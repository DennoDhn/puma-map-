'use client';
import { useEffect, useState, useId } from 'react';
import Link from 'next/link';
import { api } from './platform-client';
type Result = {
  id: string;
  username?: string;
  name?: string;
  title?: string;
  bio?: string;
  body?: string;
  variant?: string;
  year?: number;
  kind?: string;
  author?: { username: string };
  owner?: { username: string };
};
export function CommunityDiscovery({
  openMember,
  openContent,
}: {
  openMember: (id: string) => void;
  openContent: (id: string) => void;
}) {
  const fieldId = useId();
  const [q, setQ] = useState(''),
    [kind, setKind] = useState('POST'),
    [sort, setSort] = useState('newest'),
    [page, setPage] = useState(1),
    [data, setData] = useState<{ results: Result[]; hasMore: boolean } | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      setError('');
      api<{ results: Result[]; hasMore: boolean }>(
        `discover?kind=${kind}&q=${encodeURIComponent(q)}&page=${page}&sort=${sort}`,
      )
        .then((d) => {
          if (active) setData(d);
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [q, kind, page, sort]);
  return (
    <section className="discovery-panel">
      <div className="discovery-filters">
        <div>
          <label htmlFor={fieldId + '-query'}>Community durchsuchen</label>
          <input
            id={fieldId + '-query'}
            type="search"
            value={q}
            maxLength={100}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Mitglieder, Projekte, Erfahrungen …"
          />
        </div>
        <div>
          <label htmlFor={fieldId + '-kind'}>Bereich</label>
          <select
            id={fieldId + '-kind'}
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              setPage(1);
            }}
          >
            <option value="POST">Beiträge</option>
            <option value="TOPIC">Forenthemen</option>
            <option value="BUILD">Builds</option>
            <option value="VEHICLE">Fahrzeuge</option>
            <option value="MEMBER">Mitglieder</option>
          </select>
        </div>
        <div>
          <label htmlFor={fieldId + '-sort'}>Sortierung</label>
          <select
            id={fieldId + '-sort'}
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="newest">Neueste zuerst</option>
            <option value="oldest">Älteste zuerst</option>
          </select>
        </div>
      </div>
      {error && <p role="alert">{error}</p>}
      {loading ? (
        <p role="status">Community wird durchsucht …</p>
      ) : (
        data && (
          <>
            <p className="muted">Öffentlich freigegebene Inhalte · Seite {page}</p>
            <h2>Suchergebnisse</h2>
            <div className="discovery-grid">
              {data.results.map((r) => (
                <article className="discovery-card" key={r.id}>
                  <span className="eyebrow">{r.kind ?? kind}</span>
                  <h3>
                    {kind === 'VEHICLE' ? (
                      <Link href={`/fahrzeuge/${r.id}`}>{r.name}</Link>
                    ) : (
                      <button
                        className="title-button"
                        onClick={() => (kind === 'MEMBER' ? openMember(r.id) : openContent(r.id))}
                      >
                        {r.username ?? r.title}
                      </button>
                    )}
                  </h3>
                  <p>{(r.bio ?? r.body ?? `${r.variant ?? ''} · ${r.year ?? ''}`).slice(0, 180)}</p>
                  <small>{r.author?.username ?? r.owner?.username}</small>
                  {r.kind && <Link href={`/beitraege/${r.id}`}>Direktlink zum Inhalt →</Link>}
                </article>
              ))}
            </div>
            {!data.results.length && (
              <div className="journal-empty">
                <h3>Noch kein Treffer.</h3>
                <p>Versuche einen anderen Suchbegriff oder Bereich.</p>
              </div>
            )}
            <div className="discussion-tools">
              <button
                className="button secondary"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Vorherige Seite
              </button>
              <button
                className="button secondary"
                disabled={!data.hasMore}
                onClick={() => setPage((p) => p + 1)}
              >
                Nächste Seite
              </button>
            </div>
          </>
        )
      )}
    </section>
  );
}
