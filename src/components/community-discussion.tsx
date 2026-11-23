'use client';
import { useEffect, useState, useId } from 'react';
import { api, date } from './platform-client';
import type { Item, Me } from './platform-model';
type Comment = {
  id: string;
  body: string;
  removed: boolean;
  authorId: string;
  parentId: string | null;
  author: { username: string };
  parent?: { author: { username: string }; removed: boolean } | null;
  createdAt: string;
  updatedAt: string;
};
type Page = { items: Comment[]; hasMore: boolean; page: number };
export function CommunityDiscussion({
  item,
  me,
  onChange,
}: {
  item: Item;
  me: Me | null;
  onChange: () => Promise<void>;
}) {
  const composerId = useId();
  const [data, setData] = useState<Page | null>(null),
    [page, setPage] = useState(1),
    [revision, setRevision] = useState(0),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [reply, setReply] = useState<Comment | null>(null),
    [edit, setEdit] = useState<Comment | null>(null),
    [report, setReport] = useState<string | null>(null),
    [feedback, setFeedback] = useState(''),
    [remove, setRemove] = useState<string | null>(null),
    [draft, setDraft] = useState('');
  useEffect(() => {
    let active = true;
    api<Page>(`contents/${item.id}/comments?page=${page}`)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [item.id, page, revision]);
  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await task();
      setRevision((r) => r + 1);
      await onChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Aktion fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  }
  const mod = me && ['ADMIN', 'MODERATOR'].includes(me.role);
  return (
    <section className="discussion-engine" aria-label="Diskussion">
      <div className="split">
        <div>
          <span className="eyebrow">COMMUNITY EXCHANGE</span>
          <h3>{item.kind === 'TOPIC' ? 'Diskussion' : 'Kommentare'}</h3>
        </div>
        <span className="tag">{item.locked ? 'Geschlossen' : 'Offen'}</span>
      </div>
      {item.kind === 'TOPIC' && me && (
        <div className="discussion-tools">
          <button
            className="button secondary"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await api(
                  `contents/${item.id}/subscription`,
                  item.subscribed ? 'DELETE' : 'POST',
                  item.subscribed ? undefined : {},
                );
              })
            }
          >
            {item.subscribed ? 'Abonnement beenden' : 'Thema abonnieren'}
          </button>
          {mod && (
            <>
              <button
                className="text-button"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await api(`contents/${item.id}/discussion`, 'PATCH', {
                      locked: !item.locked,
                      pinned: item.pinned ?? false,
                    });
                  })
                }
              >
                {item.locked ? 'Thema öffnen' : 'Thema schließen'}
              </button>
              <button
                className="text-button"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await api(`contents/${item.id}/discussion`, 'PATCH', {
                      locked: item.locked ?? false,
                      pinned: !item.pinned,
                    });
                  })
                }
              >
                {item.pinned ? 'Anheftung lösen' : 'Thema anheften'}
              </button>
            </>
          )}
        </div>
      )}
      {feedback && <p role="status">{feedback}</p>}
      {error && (
        <p role="alert" className="dossier-alert">
          {error}
        </p>
      )}
      {!data ? (
        <p role="status">Diskussion wird geladen …</p>
      ) : (
        <>
          {!data.items.length && (
            <div className="journal-empty">
              <h4>Deine Erfahrung macht den Unterschied.</h4>
              <p>Noch keine Antworten. Stelle eine Frage oder teile einen hilfreichen Hinweis.</p>
            </div>
          )}
          {data.items.map((c) => (
            <article
              className={`community-comment ${c.parentId ? 'is-reply' : ''}`}
              key={c.id}
              id={`comment-${c.id}`}
            >
              <div className="split">
                <strong>{c.author.username}</strong>
                <time dateTime={c.createdAt}>{date(c.createdAt)}</time>
              </div>
              {c.parent && (
                <p className="reply-context">
                  Antwort auf{' '}
                  {c.parent.removed ? 'einen entfernten Kommentar' : c.parent.author.username}
                </p>
              )}
              <p className="detail-body">
                {c.removed ? 'Dieser Kommentar wurde entfernt.' : c.body}
              </p>
              {c.updatedAt !== c.createdAt && !c.removed && (
                <small className="muted">Bearbeitet</small>
              )}
              {me && !c.removed && (
                <div className="discussion-tools">
                  {!item.locked && !c.parentId && (
                    <button
                      className="text-button"
                      onClick={() => {
                        setReply(c);
                        setEdit(null);
                        setDraft('');
                      }}
                    >
                      Antworten
                    </button>
                  )}
                  {c.authorId === me.id && !item.locked && (
                    <button
                      className="text-button"
                      onClick={() => {
                        setEdit(c);
                        setReply(null);
                        setDraft(c.body);
                      }}
                    >
                      Kommentar bearbeiten
                    </button>
                  )}
                  {c.authorId !== me.id && (
                    <button
                      className="text-button"
                      onClick={() => {
                        setReport(c.id);
                        setFeedback('');
                      }}
                    >
                      Kommentar melden
                    </button>
                  )}
                  {(c.authorId === me.id || mod) && (
                    <button className="text-button" onClick={() => setRemove(c.id)}>
                      Kommentar entfernen
                    </button>
                  )}
                </div>
              )}
              {report === c.id && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const reason = String(new FormData(e.currentTarget).get('reason'));
                    void run(async () => {
                      await api(`contents/${item.id}/report`, 'POST', { commentId: c.id, reason });
                      setReport(null);
                      setFeedback('Die Moderation hat deine Meldung erhalten.');
                    });
                  }}
                >
                  <label className="field">
                    Grund der Meldung
                    <textarea name="reason" required minLength={10} maxLength={1000} />
                  </label>
                  <button className="button" disabled={busy}>
                    Meldung senden
                  </button>
                  <button type="button" className="text-button" onClick={() => setReport(null)}>
                    Abbrechen
                  </button>
                </form>
              )}
              {remove === c.id && (
                <div className="recovery-confirm">
                  <p>Kommentar endgültig entfernen? Antworten bleiben erhalten.</p>
                  <button
                    disabled={busy}
                    className="button"
                    onClick={() =>
                      void run(async () => {
                        await api(`contents/${item.id}/comments/${c.id}`, 'DELETE');
                        setRemove(null);
                        if (edit?.id === c.id) {
                          setEdit(null);
                          setDraft('');
                        }
                      })
                    }
                  >
                    Entfernen bestätigen
                  </button>
                  <button className="text-button" onClick={() => setRemove(null)}>
                    Abbrechen
                  </button>
                </div>
              )}
            </article>
          ))}
          <div className="discussion-tools">
            <button
              className="button secondary"
              disabled={page === 1 || busy}
              onClick={() => setPage((p) => p - 1)}
            >
              Vorherige Antworten
            </button>
            <span>Seite {page}</span>
            <button
              className="button secondary"
              disabled={!data.hasMore || busy}
              onClick={() => setPage((p) => p + 1)}
            >
              Weitere Antworten
            </button>
          </div>
        </>
      )}
      {me && !item.locked && item.status === 'PUBLISHED' ? (
        <form
          className="community-composer"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await api(
                `contents/${item.id}/comments${edit ? '/' + edit.id : ''}`,
                edit ? 'PATCH' : 'POST',
                edit ? { body: draft } : { body: draft, parentId: reply?.id ?? null },
              );
              setDraft('');
              setReply(null);
              setEdit(null);
            });
          }}
        >
          {(reply || edit) && (
            <div className="split">
              <p>{edit ? 'Kommentar bearbeiten' : `Antwort an ${reply?.author.username}`}</p>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setReply(null);
                  setEdit(null);
                  setDraft('');
                }}
              >
                Abbrechen
              </button>
            </div>
          )}
          <div>
            <label htmlFor={composerId}>Dein Kommentar</label>
            <textarea
              id={composerId}
              placeholder="Mit @Benutzername jemanden erwähnen"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              required
              minLength={1}
              maxLength={3000}
              rows={3}
            />
          </div>
          <button className="button primary" disabled={busy}>
            {busy
              ? 'Wird gespeichert …'
              : edit
                ? 'Änderung speichern'
                : 'Kommentar veröffentlichen'}
          </button>
        </form>
      ) : (
        <p className="muted">
          {item.locked
            ? 'Dieses Thema ist geschlossen. Bestehende Antworten bleiben lesbar.'
            : !me
              ? 'Melde dich an, um mitzudiskutieren.'
              : 'Dieser Inhalt nimmt keine Kommentare an.'}
        </p>
      )}
    </section>
  );
}
