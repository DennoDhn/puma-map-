import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/lib/db';
import { handle } from '../src/lib/api';
import { newToken, digest } from '../src/lib/security';
const origin = process.env.APP_ORIGIN ?? 'http://localhost:3000';
async function call(path: string, method = 'GET', data?: unknown, cookie = '') {
  const response = await handle(
    new Request(`${origin}/api/${path}`, {
      method,
      headers: { origin, cookie, ...(data ? { 'content-type': 'application/json' } : {}) },
      body: data ? JSON.stringify(data) : undefined,
    }),
    path.split('?')[0].split('/'),
  );
  return { status: response.status, data: await response.json() };
}
test('community integration with isolated synthetic accounts', async (t) => {
  assert.equal(process.env.TEST_DATABASE_CONFIRM, 'isolated');
  assert.match(new URL(process.env.DATABASE_URL!).pathname, /_test$/);
  const users = [];
  for (const role of ['MEMBER', 'MEMBER', 'MODERATOR'] as const) {
    const token = newToken();
    const user = await db.user.create({
      data: {
        username: `c_${digest(token).slice(0, 12)}`,
        email: `${token}@example.test`,
        passwordHash: 'unusable-fixture',
        verifiedAt: new Date(),
        role,
        sessions: {
          create: { tokenHash: digest(token), expiresAt: new Date(Date.now() + 3600000) },
        },
      },
    });
    users.push({ ...user, cookie: `pumamap=${token}` });
  }
  const [alice, bob, mod] = users;
  const payload = {
    kind: 'TOPIC',
    title: 'Community test discussion',
    body: 'Synthetic public discussion fixture.',
    category: 'Werkstatt',
  };
  const topic = (await call('contents', 'POST', payload, alice.cookie)).data;
  const base = `contents/${topic.id}`;
  try {
    await t.test(
      'comment reports keep the parent public and require moderator review',
      async () => {
        const reportTopic = (await call('contents', 'POST', payload, alice.cookie)).data;
        const reportBase = 'contents/' + reportTopic.id;
        const comment = (
          await call(reportBase + '/comments', 'POST', { body: 'Testkommentar' }, alice.cookie)
        ).data;
        const reportInput = { commentId: comment.id, reason: 'Bitte diesen Kommentar prüfen.' };
        assert.equal((await call(reportBase + '/report', 'POST', reportInput)).status, 401);
        assert.equal(
          (
            await call(
              reportBase + '/report',
              'POST',
              { ...reportInput, commentId: 'missing' },
              bob.cookie,
            )
          ).status,
          404,
        );
        for (const attempt of [1, 2])
          assert.equal(
            (await call(reportBase + '/report', 'POST', reportInput, bob.cookie)).status,
            200,
            String(attempt),
          );
        const reports = (await call('admin', 'GET', undefined, mod.cookie)).data.reports.filter(
          (row: { commentId: string }) => row.commentId === comment.id,
        );
        assert.equal(reports.length, 1);
        assert.equal(reports[0].comment.body, 'Testkommentar');
        const review = { reportId: reports[0].id, remove: true };
        assert.equal((await call('admin/comment-review', 'POST', review, bob.cookie)).status, 403);
        assert.equal((await call('admin/comment-review', 'POST', review, mod.cookie)).status, 200);
        assert.equal(
          (await db.comment.findUniqueOrThrow({ where: { id: comment.id } })).removed,
          true,
        );
        assert.equal(
          (await db.content.findUniqueOrThrow({ where: { id: reportTopic.id } })).status,
          'PUBLISHED',
        );
        assert.equal(
          (await db.report.findUniqueOrThrow({ where: { id: reports[0].id } })).resolved,
          true,
        );
      },
    );
    await t.test(
      'mentions notify once per new post, respect settings and skip email addresses',
      async () => {
        const message = {
          ...payload,
          kind: 'POST',
          body: `@${mod.username} @${mod.username.toUpperCase()} test@${bob.username}.de @${alice.username}`,
        };
        const post = (await call('contents', 'POST', message, alice.cookie)).data;
        const notices = await db.notification.findMany({ where: { contentId: post.id } });
        assert.equal(notices.length, 1);
        assert.equal(notices[0].kind, 'MENTION');
        assert.equal(notices[0].userId, mod.id);
        await db.user.update({ where: { id: mod.id }, data: { notifyMentions: false } });
        await call(
          'contents/' + post.id + '/comments',
          'POST',
          { body: '@' + mod.username },
          bob.cookie,
        );
        assert.equal(
          await db.notification.count({ where: { contentId: post.id, userId: mod.id } }),
          1,
        );
        await db.content.delete({ where: { id: post.id } });
      },
    );
    await t.test(
      'owners can page through more than fifty notifications and bookmarks',
      async () => {
        const docs = await db.content.createManyAndReturn({
          data: Array.from({ length: 51 }, (_, i) => ({
            authorId: mod.id,
            kind: 'POST' as const,
            title: 'Seitenprüfung ' + i,
            body: 'Pagination',
            category: 'Test',
          })),
          select: { id: true },
        });
        await db.reaction.createMany({
          data: docs.map((d) => ({ userId: mod.id, contentId: d.id, type: 'SAVE' })),
        });
        await db.notification.createMany({
          data: docs.map((d) => ({ userId: mod.id, contentId: d.id, text: 'Test' })),
        });
        for (const route of ['notifications', 'saved']) {
          const ids = new Set<string>();
          for (const page of [1, 2, 3]) {
            const result = await call(route + '?page=' + page, 'GET', undefined, mod.cookie);
            assert.equal(result.status, 200);
            assert.equal(result.data.hasMore, page < 3);
            for (const row of result.data.items) ids.add(row.id);
          }
          assert.equal(ids.size, 51);
          assert.equal((await call(route, 'GET', undefined, mod.cookie)).data.length, 50);
          assert.deepEqual(
            (await call(route + '?page=1', 'GET', undefined, bob.cookie)).data.items,
            [],
          );
        }
        await db.content.deleteMany({ where: { id: { in: docs.map((d) => d.id) } } });
      },
    );
    await t.test(
      'subscriptions are idempotent and notification reads are owner scoped',
      async () => {
        assert.equal((await call(`${base}/subscription`, 'POST', {}, bob.cookie)).status, 200);
        await call(`${base}/subscription`, 'POST', {}, bob.cookie);
        assert.equal(await db.subscription.count({ where: { contentId: topic.id } }), 1);
        assert.equal((await call(base, 'GET', undefined, bob.cookie)).data.subscribed, true);
        await call(`${base}/comments`, 'POST', { body: 'First answer' }, alice.cookie);
        const notices = (await call('notifications', 'GET', undefined, bob.cookie)).data;
        assert.equal(notices.length, 1);
        assert.equal(notices[0].kind, 'SUBSCRIPTION');
        assert.equal(
          (await call(`notifications/${notices[0].id}`, 'PATCH', {}, alice.cookie)).status,
          404,
        );
        assert.equal(
          (await call(`notifications/${notices[0].id}`, 'PATCH', {}, bob.cookie)).status,
          200,
        );
      },
    );
    await t.test(
      'reply references, comment edits and moderator lock/remove are enforced',
      async () => {
        const first = (await call(`${base}/comments?page=1`)).data.items[0];
        const reply = await call(
          `${base}/comments`,
          'POST',
          { body: 'Reply to source', parentId: first.id },
          bob.cookie,
        );
        assert.equal(reply.status, 201);
        assert.equal(
          (
            await call(
              `${base}/comments`,
              'POST',
              { body: 'Too deeply nested', parentId: reply.data.id },
              alice.cookie,
            )
          ).status,
          400,
        );
        assert.equal(
          (
            await call(
              `${base}/comments/${first.id}`,
              'PATCH',
              { body: 'Foreign edit' },
              bob.cookie,
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await call(
              `${base}/comments/${first.id}`,
              'PATCH',
              { body: 'Own edited comment' },
              alice.cookie,
            )
          ).status,
          200,
        );
        assert.equal(
          (await call(`${base}/discussion`, 'PATCH', { locked: true, pinned: true }, alice.cookie))
            .status,
          403,
        );
        assert.equal(
          (await call(`${base}/discussion`, 'PATCH', { locked: true, pinned: true }, mod.cookie))
            .status,
          200,
        );
        assert.equal(
          (await call(`${base}/comments`, 'POST', { body: 'Blocked response' }, bob.cookie)).status,
          409,
        );
        assert.equal(
          (
            await call(
              `${base}/comments/${first.id}`,
              'PATCH',
              { body: 'Blocked edit' },
              alice.cookie,
            )
          ).status,
          409,
        );
        assert.equal(
          (await call(`${base}/comments/${first.id}`, 'DELETE', undefined, mod.cookie)).status,
          200,
        );
        const rows = (await call(`${base}/comments?page=1`)).data.items;
        assert.equal(rows[0].body, '');
        assert.equal(rows[1].parent.removed, true);
        assert.equal(
          await db.audit.count({ where: { targetId: first.id, action: 'COMMENT_REMOVE' } }),
          1,
        );
      },
    );
    await t.test(
      'notification preferences persist; reaction toggles do not farm duplicate alerts',
      async () => {
        const prefs = {
          notifyComments: false,
          notifyReplies: false,
          notifySubscriptions: false,
          notifyReactions: true,
          notifyMentions: false,
        };
        assert.equal(
          (await call('notification-preferences', 'PATCH', prefs, alice.cookie)).status,
          200,
        );
        assert.deepEqual(
          (await call('notification-preferences', 'GET', undefined, alice.cookie)).data,
          prefs,
        );
        assert.equal(
          (
            await call(
              'notification-preferences',
              'PATCH',
              { ...prefs, userId: bob.id },
              alice.cookie,
            )
          ).status,
          400,
        );
        const post = (await call('contents', 'POST', { ...payload, kind: 'POST' }, alice.cookie))
          .data;
        await call(`contents/${post.id}/comments`, 'POST', { body: 'Silent comment' }, bob.cookie);
        assert.equal(await db.notification.count({ where: { contentId: post.id } }), 0);
        for (const method of ['POST', 'DELETE', 'POST'])
          assert.equal(
            (await call(`contents/${post.id}/reaction`, method, { type: 'LIKE' }, bob.cookie))
              .status,
            200,
          );
        assert.equal(await db.notification.count({ where: { contentId: post.id } }), 1);
        await call('notifications', 'PATCH', {}, alice.cookie);
        assert.equal(
          (await db.notification.findFirstOrThrow({ where: { contentId: post.id } })).read,
          true,
        );
      },
    );
    await t.test(
      'discovery, content and comment pagination are stable and hide moderated rows',
      async () => {
        const marker = `Marker-${newToken()}`;
        const rows = await db.content.createManyAndReturn({
          data: Array.from({ length: 23 }, (_, i) => ({
            authorId: alice.id,
            kind: 'POST' as const,
            title: `${marker}-${i}`,
            body: 'Synthetic test content body',
            category: 'QA',
          })),
        });
        const first = (await call(`discover?kind=POST&q=${marker}&page=1`)).data;
        const second = (await call(`discover?kind=POST&q=${marker}&page=2`)).data;
        assert.equal(first.results.length, 20);
        assert.equal(second.results.length, 3);
        assert.equal(first.hasMore, true);
        assert.equal(
          new Set([...first.results, ...second.results].map((r: { id: string }) => r.id)).size,
          23,
        );
        assert.equal((await call(`contents?kind=POST&q=${marker}&page=1`)).data.items.length, 20);
        assert.equal((await call('discover?page=-1')).status, 400);
        await db.content.update({ where: { id: rows[0].id }, data: { status: 'HIDDEN' } });
        assert.equal((await call(`discover?kind=POST&q=${marker}&page=2`)).data.results.length, 2);
        await db.comment.createMany({
          data: Array.from({ length: 23 }, (_, i) => ({
            contentId: rows[1].id,
            authorId: alice.id,
            body: `Reply ${i}`,
          })),
        });
        const comments = (await call(`contents/${rows[1].id}/comments?page=1`)).data;
        assert.equal(comments.items.length, 20);
        assert.equal((await call(`contents/${rows[1].id}/comments?page=2`)).data.items.length, 3);
        assert.equal(
          (
            await call(
              `contents/${rows[2].id}/comments`,
              'POST',
              { body: 'Wrong source', parentId: comments.items[0].id },
              bob.cookie,
            )
          ).status,
          404,
        );
        const member = (await call(`members/${alice.id}`)).data;
        assert.equal('email' in member, false);
        assert.equal(
          member.contents.some((c: { id: string }) => c.id === rows[0].id),
          false,
        );
      },
    );
    await t.test(
      'withdrawing a linked build removes notification, search and public profile paths',
      async () => {
        const v = await db.vehicle.create({
          data: {
            ownerId: alice.id,
            name: 'Private source fixture',
            variant: '1.7',
            year: 2000,
            color: 'Green',
            visibility: 'PUBLIC',
          },
        });
        const entry = await db.vehicleEntry.create({
          data: {
            vehicleId: v.id,
            kind: 'BUILD',
            title: 'Original private notes',
            body: 'Never copy this text into notices',
            occurredOn: new Date('2026-01-01'),
            visibility: 'PUBLIC',
            costCents: 12345,
          },
        });
        const build = await db.content.create({
          data: { ...payload, kind: 'BUILD', authorId: alice.id, vehicleEntryId: entry.id },
        });
        const comment = (
          await call(
            `contents/${build.id}/comments`,
            'POST',
            { body: 'Following this project' },
            bob.cookie,
          )
        ).data;
        await call(
          `contents/${build.id}/comments`,
          'POST',
          { body: 'Responding to your question', parentId: comment.id },
          alice.cookie,
        );
        assert.equal(
          (await call('notifications', 'GET', undefined, bob.cookie)).data.some(
            (n: { contentId: string }) => n.contentId === build.id,
          ),
          true,
        );
        await db.vehicleEntry.update({ where: { id: entry.id }, data: { visibility: 'PRIVATE' } });
        assert.equal((await call(`contents/${build.id}/comments`)).status, 404);
        assert.equal(
          (await call('notifications', 'GET', undefined, bob.cookie)).data.some(
            (n: { contentId: string }) => n.contentId === build.id,
          ),
          false,
        );
        assert.equal(
          (await call('discover?kind=BUILD')).data.results.some(
            (c: { id: string }) => c.id === build.id,
          ),
          false,
        );
        assert.equal(
          (await call(`members/${alice.id}`)).data.contents.some(
            (c: { id: string }) => c.id === build.id,
          ),
          false,
        );
      },
    );
    await t.test(
      'home highlights return future events, available listings and published wiki only',
      async () => {
        const seed = { authorId: alice.id, category: 'test', body: 'test' };
        const rows = await db.content.createManyAndReturn({
          data: [
            { ...seed, kind: 'EVENT', title: 'Zukunft', startsAt: new Date(Date.now() + 86400000) },
            { ...seed, kind: 'EVENT', title: 'Vergangen', startsAt: new Date(0) },
            { ...seed, kind: 'WIKI', title: 'Entwurf', status: 'DRAFT' },
            { ...seed, kind: 'WIKI', title: 'Freigegeben' },
            { ...seed, kind: 'LISTING', title: 'Verkauft', status: 'SOLD' },
            { ...seed, kind: 'LISTING', title: 'Verfügbar' },
          ],
        });
        try {
          const highlights = await call('home-highlights');
          assert.equal(highlights.status, 200);
          for (const [key, title] of Object.entries({
            events: 'Zukunft',
            wiki: 'Freigegeben',
            listings: 'Verfügbar',
          })) {
            const own = highlights.data[key].filter((r: { id: string }) =>
              rows.some((row) => row.id === r.id),
            );
            assert.deepEqual(
              own.map((r: { title: string }) => r.title),
              [title],
            );
          }
        } finally {
          await db.content.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
        }
      },
    );
    await t.test('deleting a topic cascades subscriptions and linked notifications', async () => {
      assert.equal((await call(base, 'DELETE', undefined, alice.cookie)).status, 200);
      assert.equal(await db.subscription.count({ where: { contentId: topic.id } }), 0);
      assert.equal(await db.notification.count({ where: { contentId: topic.id } }), 0);
    });
  } finally {
    await db.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });
    await db.$disconnect();
  }
});
