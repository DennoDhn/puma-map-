'use client';
import { useEffect, useState } from 'react';
import { api, date } from './platform-client';
type Notice = {
  id: string;
  text: string;
  read: boolean;
  createdAt: string;
  contentId: string | null;
  kind: string;
};
type Preferences = {
  notifyComments: boolean;
  notifyReplies: boolean;
  notifySubscriptions: boolean;
  notifyReactions: boolean;
};
const labels: Record<keyof Preferences, string> = {
  notifyComments: 'Kommentare zu meinen Inhalten',
  notifyReplies: 'Antworten auf meine Kommentare',
  notifySubscriptions: 'Abonnierte Forenthemen',
  notifyReactions: 'Reaktionen auf meine Inhalte',
};
export function NotificationCenter({ openContent }: { openContent: (id: string) => void }) {
  const [items, setItems] = useState<Notice[]>([]),
    [page, setPage] = useState(1),
    [hasMore, setHasMore] = useState(false),
    [prefs, setPrefs] = useState<Preferences | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [loaded, setLoaded] = useState(false),
    [message, setMessage] = useState('');
  useEffect(() => {
    let alive = true;
    Promise.all([
      api<{ items: Notice[]; hasMore: boolean }>('notifications?page=1'),
      api<Preferences>('notification-preferences'),
    ])
      .then(([n, p]) => {
        if (alive) {
          setItems(n.items);
          setHasMore(n.hasMore);
          setPrefs(p);
          setLoaded(true);
        }
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, []);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Aktion fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  }
  function loadPage(next: number) {
    void run(async () => {
      const result = await api<{ items: Notice[]; hasMore: boolean }>(`notifications?page=${next}`);
      setItems(result.items);
      setHasMore(result.hasMore);
      setPage(next);
    });
  }
  return (
    <section className="notification-center">
      {error && <p role="alert">{error}</p>}
      <p role="status">{message}</p>
      <div className="split">
        <h2>Deine Community-Aktivität</h2>
        <button
          className="button secondary"
          disabled={busy || (!hasMore && page === 1 && !items.some((n) => !n.read))}
          onClick={() =>
            void run(async () => {
              await api('notifications', 'PATCH', {});
              setItems(items.map((n) => ({ ...n, read: true })));
              setMessage('Alle Benachrichtigungen als gelesen markiert.');
            })
          }
        >
          Alle als gelesen markieren
        </button>
      </div>
      {!loaded && !error && <p>Lädt …</p>}
      {loaded && !items.length && (
        <div className="journal-empty">
          <h3>Du bist auf dem Laufenden.</h3>
          <p>Neue Kommentare, Antworten und abonnierte Themen erscheinen hier.</p>
        </div>
      )}
      <div className="notice-list">
        {items.map((n) => (
          <article className={`notice-card ${n.read ? '' : 'unread'}`} key={n.id}>
            <div>
              <span className="tag">
                {n.kind === 'SYSTEM'
                  ? 'Mitteilung'
                  : n.kind === 'REACTION'
                    ? 'Reaktion'
                    : n.kind === 'REPLY'
                      ? 'Antwort'
                      : 'Diskussion'}
              </span>
              <p>{n.text}</p>
              <time dateTime={n.createdAt}>{date(n.createdAt)}</time>
            </div>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await api(`notifications/${n.id}`, 'PATCH', {});
                  setItems(items.map((i) => (i.id === n.id ? { ...i, read: true } : i)));
                  if (n.contentId) openContent(n.contentId);
                })
              }
            >
              {n.contentId ? 'Inhalt öffnen' : n.read ? 'Gelesen' : 'Als gelesen markieren'}
            </button>
          </article>
        ))}
      </div>
      {(page > 1 || hasMore) && (
        <nav className="discussion-tools" aria-label="Benachrichtigungsseiten">
          <button
            className="button secondary"
            disabled={busy || page === 1}
            onClick={() => loadPage(page - 1)}
          >
            Zurück
          </button>
          <span>Seite {page}</span>
          <button
            className="button secondary"
            disabled={busy || !hasMore}
            onClick={() => loadPage(page + 1)}
          >
            Weiter
          </button>
        </nav>
      )}
      {prefs && (
        <form
          className="notification-settings"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await api('notification-preferences', 'PATCH', prefs);
              setMessage('Benachrichtigungseinstellungen gespeichert.');
            });
          }}
        >
          <h3>Was möchtest du erfahren?</h3>
          <p className="muted">
            Gilt für neue In-App-Benachrichtigungen. Wichtige Moderationsmitteilungen bleiben aktiv.
          </p>
          {(Object.keys(labels) as (keyof Preferences)[]).map((key) => (
            <label className="journal-consent" key={key}>
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
              />
              {labels[key]}
            </label>
          ))}
          <button className="button primary" disabled={busy}>
            Einstellungen speichern
          </button>
        </form>
      )}
    </section>
  );
}
