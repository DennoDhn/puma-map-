'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, date, money } from './platform-client';
import { Dialog } from './dialog';
const categories: Record<string, string> = {
  ENGINE: 'Motor',
  GEARBOX: 'Getriebe',
  SUSPENSION: 'Fahrwerk',
  BRAKES: 'Bremsen',
  BODY: 'Karosserie',
  ELECTRICAL: 'Elektrik',
  INTERIOR: 'Innenraum',
  EXHAUST: 'Abgasanlage',
  WHEELS: 'Räder & Reifen',
  OTHER: 'Sonstiges',
};
const statuses: Record<string, string> = {
  PLANNED: 'Geplant',
  ORDERED: 'Bestellt',
  STORED: 'Auf Lager',
  INSTALLED: 'Eingebaut',
  REMOVED: 'Ausgebaut',
  PREPARING: 'In Vorbereitung',
  ACTIVE: 'In Arbeit',
  PAUSED: 'Pausiert',
  COMPLETED: 'Abgeschlossen',
};
export type GalleryCover = {
  id: string;
  caption: string;
  width: number;
  height: number;
  updatedAt: string;
};
type Media = {
  id: string;
  caption: string;
  visibility: string;
  cover: boolean;
  position: number;
  entryId: string | null;
  partId: string | null;
  milestoneId: string | null;
  width: number;
  height: number;
  updatedAt: string;
};
type Part = {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  partNumber: string;
  condition: string;
  status: string;
  installedOn: string | null;
  mileage: number | null;
  source?: string;
  priceCents?: number | null;
  notes: string;
  entryId: string | null;
  visibility: string;
};
type Milestone = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  targetOn: string | null;
  completedOn: string | null;
  progress: number;
  entryId: string | null;
  partId: string | null;
  visibility: string;
};
type Change = {
  id: string;
  actorId: string;
  entityId: string;
  entityType: string;
  action: string;
  fields: string[];
  createdAt: string;
};
type Changes = { changes: Change[]; nextCursor: string | null };
type Entry = { id: string; title: string };
export function VehicleWorkspace({
  vehicleId,
  owner,
  entries,
  onCoverChange,
}: {
  vehicleId: string;
  owner: boolean;
  entries: Entry[];
  onCoverChange: (cover: GalleryCover | null) => void;
}) {
  const base = `vehicles/${encodeURIComponent(vehicleId)}`;
  const [tab, setTab] = useState('media');
  const [media, setMedia] = useState<Media[]>([]);
  useEffect(() => {
    onCoverChange(media.find((m) => m.cover) ?? null);
  }, [media, onCoverChange]);
  const [parts, setParts] = useState<Part[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [changes, setChanges] = useState<Changes>({ changes: [], nextCursor: null });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [editor, setEditor] = useState<{ type: string; item?: Media | Part | Milestone } | null>(
    null,
  );
  const [remove, setRemove] = useState<{ type: string; id: string } | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [entryFilter, setEntryFilter] = useState('');
  const [phase, setPhase] = useState('');
  const [beforeImage, setBeforeImage] = useState('');
  const [afterImage, setAfterImage] = useState('');
  const uploadRef = useRef<HTMLInputElement>(null);
  const viewer = useRef<HTMLDivElement>(null);
  const touch = useRef<number | null>(null);
  async function refresh() {
    const [m, p, s, c] = await Promise.all([
      api<Media[]>(`${base}/media`),
      api<Part[]>(`${base}/parts`),
      api<Milestone[]>(`${base}/milestones`),
      owner ? api<Changes>(`${base}/changes`) : Promise.resolve({ changes: [], nextCursor: null }),
    ]);
    setMedia(m);
    setParts(p);
    setMilestones(s);
    setChanges(c);
  }
  useEffect(() => {
    let active = true;
    Promise.all([
      api<Media[]>(`${base}/media`),
      api<Part[]>(`${base}/parts`),
      api<Milestone[]>(`${base}/milestones`),
      owner ? api<Changes>(`${base}/changes`) : Promise.resolve({ changes: [], nextCursor: null }),
    ])
      .then(([m, p, s, c]) => {
        if (active) {
          setMedia(m);
          setParts(p);
          setMilestones(s);
          setChanges(c);
          setLoaded(true);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [base, owner, entries]);
  async function run(task: () => Promise<void>, message = 'Gespeichert.') {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await task();
      await refresh();
      setNotice(message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Anfrage fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  }
  async function upload(files: FileList | null, id?: string) {
    if (!files?.length) return;
    const selected = Array.from(files);
    await run(async () => {
      let completed = 0;
      for (const file of selected) {
        if (file.size > 6 * 1024 * 1024)
          throw new Error(`${completed} Bilder gespeichert. „${file.name}“ überschreitet 6 MiB.`);
        const r = await fetch(`/api/${base}/media${id ? '/' + id : ''}`, {
          method: 'POST',
          body: file,
          headers: { 'Content-Type': 'application/octet-stream' },
        });
        if (!r.ok) {
          const e = await r.json();
          throw new Error(
            `${completed} Bilder gespeichert. ${e.error ?? 'Upload fehlgeschlagen.'}`,
          );
        }
        completed++;
      }
    }, 'Bilder gespeichert. Neue Bilder bleiben privat, bis du sie freigibst.');
    await refresh().catch(() => {});
    if (uploadRef.current) uploadRef.current.value = '';
  }
  const imageUrl = (m: Media, small = false) =>
    `/api/${base}/media/${m.id}/file?size=${small ? 'thumb' : 'full'}&v=${encodeURIComponent(m.updatedAt)}`;
  const visibleMedia = media.filter((m) => !entryFilter || m.entryId === entryFilter);
  const current = media.find((m) => m.id === lightbox);
  function move(offset: number) {
    if (!current) return;
    const i = media.findIndex((m) => m.id === current.id);
    setLightbox(media[(i + offset + media.length) % media.length].id);
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    const f = new FormData(event.currentTarget);
    const value = (key: string) => String(f.get(key) ?? '');
    const nullable = (key: string) => value(key) || null;
    const number = (key: string) => (value(key) ? Number(value(key)) : null);
    const common = {
      visibility: f.get('public') === 'on' ? 'PUBLIC' : 'PRIVATE',
      entryId: nullable('entryId'),
    };
    const data =
      editor.type === 'media'
        ? {
            ...common,
            caption: value('caption'),
            partId: nullable('partId'),
            milestoneId: nullable('milestoneId'),
            cover: f.get('cover') === 'on',
            position: Number(value('position')),
          }
        : editor.type === 'parts'
          ? {
              ...common,
              name: value('name'),
              category: value('category'),
              manufacturer: value('manufacturer'),
              partNumber: value('partNumber'),
              condition: value('condition'),
              status: value('status'),
              installedOn: nullable('installedOn'),
              mileage: number('mileage'),
              source: value('source'),
              priceCents: value('price') ? Math.round(Number(value('price')) * 100) : null,
              notes: value('notes'),
            }
          : {
              ...common,
              title: value('title'),
              description: value('description'),
              category: value('category'),
              status: value('status'),
              targetOn: nullable('targetOn'),
              completedOn: nullable('completedOn'),
              progress: Number(value('progress')),
              partId: nullable('partId'),
            };
    void run(async () => {
      await api(
        `${base}/${editor.type}${editor.item ? '/' + editor.item.id : ''}`,
        editor.item ? 'PATCH' : 'POST',
        data,
      );
      setEditor(null);
    });
  }
  const photos = (type: 'partId' | 'milestoneId', id: string) => (
    <div className="linked-photos">
      {media
        .filter((m) => m[type] === id)
        .map((m) => (
          <button
            key={m.id}
            className="gallery-open"
            aria-label={`Bild vergrößern: ${m.caption || 'Projektbild'}`}
            onClick={() => setLightbox(m.id)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl(m, true)}
              width={m.width}
              height={m.height}
              alt={m.caption || 'Projektbild'}
              loading="lazy"
            />
          </button>
        ))}
    </div>
  );
  const item = editor?.item;
  const part = editor?.type === 'parts' ? (item as Part | undefined) : undefined;
  const milestone = editor?.type === 'milestones' ? (item as Milestone | undefined) : undefined;
  const picture = editor?.type === 'media' ? (item as Media | undefined) : undefined;
  return (
    <section
      className="vehicle-workspace"
      aria-labelledby="workspace-heading"
      id="vehicle-workspace"
    >
      <header className="workspace-head">
        <div>
          <span className="eyebrow">VEHICLE INTELLIGENCE</span>
          <h2 id="workspace-heading">Dein Projekt. Jedes Detail.</h2>
        </div>
        <span className="workspace-count">
          {media.length} {media.length === 1 ? 'Bild' : 'Bilder'} · {parts.length}{' '}
          {parts.length === 1 ? 'Teil' : 'Teile'} · {milestones.length}{' '}
          {milestones.length === 1 ? 'Meilenstein' : 'Meilensteine'}
        </span>
      </header>
      <nav className="workspace-tabs" aria-label="Fahrzeugbereiche">
        {Object.entries({
          media: 'Galerie',
          parts: 'Teile',
          milestones: 'Meilensteine',
          ...(owner ? { changes: 'Änderungsverlauf' } : {}),
        }).map(([key, label]) => (
          <button
            key={key}
            className={tab === key ? 'active' : ''}
            aria-pressed={tab === key}
            onClick={() => {
              setTab(key);
              setQuery('');
              setPhase('');
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      {error && (
        <p role="alert" className="dossier-alert">
          {error}
        </p>
      )}
      <p role="status" className="muted">
        {busy ? 'Wird verarbeitet …' : notice}
      </p>
      {!loaded ? (
        <p role="status">Fahrzeugdaten werden geladen …</p>
      ) : (
        <>
          {tab === 'media' && (
            <>
              <div className="workspace-toolbar">
                <p className="muted">
                  JPEG, PNG oder WebP · maximal 6 MiB / 24 MP · bis zu 24 Bilder. Neue Bilder sind
                  privat.
                </p>
                {owner && (
                  <label className="media-upload">
                    Bilder hinzufügen
                    <input
                      ref={uploadRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      disabled={busy}
                      onChange={(e) => void upload(e.currentTarget.files)}
                    />
                  </label>
                )}
              </div>
              <label>
                Galerie filtern
                <select value={entryFilter} onChange={(e) => setEntryFilter(e.target.value)}>
                  <option value="">Alle sichtbaren Bilder</option>
                  {entries.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </select>
              </label>
              {!visibleMedia.length && (
                <div className="journal-empty">
                  <h3>Raum für deine Fahrzeuggeschichte</h3>
                  <p>Hier erscheinen deine gespeicherten Fahrzeug- und Werkstattbilder.</p>
                </div>
              )}
              {media.length > 1 && (
                <details className="media-comparison">
                  <summary>Vorher / Nachher vergleichen</summary>
                  <div className="comparison-grid">
                    {[
                      ['Vorher', beforeImage, setBeforeImage],
                      ['Nachher', afterImage, setAfterImage],
                    ].map(([label, selected, setSelected]) => {
                      const m = media.find((m) => m.id === selected);
                      return (
                        <div key={String(label)}>
                          <label>
                            {String(label)}
                            <select
                              value={String(selected)}
                              onChange={(e) =>
                                (setSelected as (value: string) => void)(e.target.value)
                              }
                            >
                              <option value="">Bild auswählen</option>
                              {media.map((image, i) => (
                                <option key={image.id} value={image.id}>
                                  {image.caption || `Bild ${i + 1}`}
                                </option>
                              ))}
                            </select>
                          </label>
                          {m && (
                            <figure>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imageUrl(m)}
                                width={m.width}
                                height={m.height}
                                alt={`${label}: ${m.caption || 'Fahrzeugbild'}`}
                              />
                              <figcaption>{m.caption}</figcaption>
                            </figure>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}
              <div className="vehicle-gallery">
                {visibleMedia.map((m) => (
                  <article
                    className={m.cover ? 'gallery-card gallery-cover' : 'gallery-card'}
                    key={m.id}
                  >
                    <button
                      className="gallery-open"
                      onClick={() => setLightbox(m.id)}
                      aria-label={`Bild vergrößern: ${m.caption || 'Fahrzeugbild'}`}
                    >
                      {/* Protected dynamic images must not pass through a public optimizer cache. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl(m, true)}
                        srcSet={`${imageUrl(m, true)} ${Math.min(m.width, 640)}w${m.width > 640 ? `, ${imageUrl(m)} ${m.width}w` : ''}`}
                        sizes="(max-width: 700px) 90vw, 45vw"
                        width={m.width}
                        height={m.height}
                        alt={m.caption || 'Fahrzeugbild'}
                        loading="lazy"
                      />
                    </button>
                    <div className="gallery-caption">
                      <span className="tag">
                        {m.cover ? 'Titelbild · ' : ''}
                        {m.visibility === 'PRIVATE' ? 'Privat' : 'Freigegeben'}
                      </span>
                      <p>{m.caption || 'Ohne Bildbeschreibung'}</p>
                      {owner && (
                        <div className="journal-actions">
                          <button
                            className="text-button"
                            disabled={busy}
                            onClick={() => setEditor({ type: 'media', item: m })}
                          >
                            Bild bearbeiten
                          </button>
                          <button
                            className="text-button"
                            disabled={busy}
                            onClick={() => setRemove({ type: 'media', id: m.id })}
                          >
                            Entfernen
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
          {(tab === 'parts' || tab === 'milestones') && (
            <>
              <div className="workspace-toolbar">
                <label>
                  Durchsuchen
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Name oder Beschreibung"
                  />
                </label>
                <label>
                  Status
                  <select value={phase} onChange={(e) => setPhase(e.target.value)}>
                    <option value="">Alle Status</option>
                    {(tab === 'parts'
                      ? ['PLANNED', 'ORDERED', 'STORED', 'INSTALLED', 'REMOVED']
                      : ['PLANNED', 'PREPARING', 'ACTIVE', 'PAUSED', 'COMPLETED']
                    ).map((s) => (
                      <option key={s} value={s}>
                        {statuses[s]}
                      </option>
                    ))}
                  </select>
                </label>
                {owner && (
                  <button className="button primary" onClick={() => setEditor({ type: tab })}>
                    {tab === 'parts' ? 'Teil hinzufügen' : 'Meilenstein hinzufügen'}
                  </button>
                )}
              </div>
              <div className="workspace-cards">
                {tab === 'parts'
                  ? parts
                      .filter(
                        (p) =>
                          (!phase || p.status === phase) &&
                          `${p.name} ${p.partNumber} ${p.notes}`
                            .toLowerCase()
                            .includes(query.toLowerCase()),
                      )
                      .map((p) => (
                        <article key={p.id} className="workspace-card">
                          <div className="split">
                            <span className="tag">{categories[p.category]}</span>
                            <span className="status-chip">{statuses[p.status]}</span>
                          </div>
                          <h3>{p.name}</h3>
                          <p className="muted">
                            {p.manufacturer || 'Hersteller nicht angegeben'}
                            {p.partNumber ? ` · ${p.partNumber}` : ''}
                          </p>
                          <dl className="workspace-details">
                            <div>
                              <dt>Zustand</dt>
                              <dd>
                                {
                                  {
                                    UNKNOWN: 'Nicht angegeben',
                                    NEW: 'Neu',
                                    USED: 'Gebraucht',
                                    REFURBISHED: 'Überholt',
                                  }[p.condition]
                                }
                              </dd>
                            </div>
                            {p.installedOn && (
                              <div>
                                <dt>Einbaudatum</dt>
                                <dd>{date(p.installedOn)}</dd>
                              </div>
                            )}
                            {p.mileage !== null && (
                              <div>
                                <dt>Kilometerstand</dt>
                                <dd>{p.mileage.toLocaleString('de-DE')} km</dd>
                              </div>
                            )}
                            {p.priceCents != null && (
                              <div>
                                <dt>Preis · privat</dt>
                                <dd>{money(p.priceCents)}</dd>
                              </div>
                            )}
                            {p.source && (
                              <div>
                                <dt>Bezugsquelle · privat</dt>
                                <dd>{p.source}</dd>
                              </div>
                            )}
                          </dl>
                          <p className="journal-body">{p.notes}</p>
                          {photos('partId', p.id)}
                          {p.entryId && (
                            <a href={`#entry-${p.entryId}`}>Verknüpfter Historieneintrag</a>
                          )}
                          {owner && (
                            <div className="journal-actions">
                              <span>{p.visibility === 'PRIVATE' ? 'Privat' : 'Freigegeben'}</span>
                              <button
                                className="text-button"
                                onClick={() => setEditor({ type: 'parts', item: p })}
                              >
                                Bearbeiten
                              </button>
                              <button
                                className="text-button"
                                onClick={() => setRemove({ type: 'parts', id: p.id })}
                              >
                                Löschen
                              </button>
                            </div>
                          )}
                        </article>
                      ))
                  : milestones
                      .filter(
                        (m) =>
                          (!phase || m.status === phase) &&
                          `${m.title} ${m.description}`.toLowerCase().includes(query.toLowerCase()),
                      )
                      .map((m) => (
                        <article key={m.id} className="workspace-card milestone-card">
                          <div className="split">
                            <span className="tag">{categories[m.category]}</span>
                            <span className="status-chip">{statuses[m.status]}</span>
                          </div>
                          <h3>{m.title}</h3>
                          <div className="build-progress">
                            <span>{m.progress} %</span>
                            <progress
                              max={100}
                              value={m.progress}
                              aria-label={`Fortschritt: ${m.title}`}
                            />
                          </div>
                          <p className="journal-body">{m.description}</p>
                          {photos('milestoneId', m.id)}
                          <div className="journal-meta">
                            {m.targetOn && <span>Ziel: {date(m.targetOn)}</span>}
                            {m.completedOn && <span>Abgeschlossen: {date(m.completedOn)}</span>}
                          </div>
                          {m.entryId && <a href={`#entry-${m.entryId}`}>Historieneintrag öffnen</a>}
                          {m.partId && (
                            <p>
                              Teil: {parts.find((p) => p.id === m.partId)?.name ?? 'Nicht sichtbar'}
                            </p>
                          )}
                          {owner && (
                            <div className="journal-actions">
                              <span>{m.visibility === 'PRIVATE' ? 'Privat' : 'Freigegeben'}</span>
                              <button
                                className="text-button"
                                onClick={() => setEditor({ type: 'milestones', item: m })}
                              >
                                Bearbeiten
                              </button>
                              <button
                                className="text-button"
                                onClick={() => setRemove({ type: 'milestones', id: m.id })}
                              >
                                Löschen
                              </button>
                            </div>
                          )}
                        </article>
                      ))}
              </div>
              {!(tab === 'parts' ? parts : milestones).length && (
                <div className="journal-empty">
                  <h3>
                    {tab === 'parts'
                      ? 'Deine Teile, übersichtlich dokumentiert'
                      : 'Aus Ideen werden Etappen'}
                  </h3>
                  <p>
                    Noch keine sichtbaren Einträge. Neue Aufzeichnungen bleiben zunächst privat.
                  </p>
                </div>
              )}
            </>
          )}
          {tab === 'changes' && owner && (
            <>
              <p className="muted">
                Nur für dich: Zeitpunkt, Datensatz und betroffene Felder. Alte Inhalte und Preise
                werden hier nicht gespeichert. Eine Wiederherstellung ist noch nicht verfügbar.
              </p>
              <ol className="journal-timeline">
                {changes.changes.map((c) => (
                  <li key={c.id}>
                    <article>
                      <time dateTime={c.createdAt}>
                        {new Date(c.createdAt).toLocaleString('de-DE')}
                      </time>
                      <h3>
                        {{ CREATE: 'Erstellt', UPDATE: 'Bearbeitet', DELETE: 'Gelöscht' }[c.action]}{' '}
                        ·{' '}
                        {{
                          media: 'Bild',
                          parts: 'Teil',
                          milestones: 'Meilenstein',
                          entries: 'Historieneintrag',
                        }[c.entityType] ?? c.entityType}
                      </h3>
                      <p>Felder: {c.fields.join(', ') || '—'}</p>
                      <details>
                        <summary>Referenzen</summary>
                        <p className="reference-text">
                          Datensatz: {c.entityId}
                          <br />
                          Benutzer: {c.actorId}
                        </p>
                      </details>
                    </article>
                  </li>
                ))}
              </ol>
              {!changes.changes.length && <p>Noch keine protokollierten Änderungen.</p>}
              {changes.nextCursor && (
                <button
                  className="button"
                  disabled={busy}
                  onClick={() =>
                    void (async () => {
                      setBusy(true);
                      try {
                        const next = await api<Changes>(
                          `${base}/changes?cursor=${encodeURIComponent(changes.nextCursor!)}`,
                        );
                        setChanges({
                          changes: [...changes.changes, ...next.changes],
                          nextCursor: next.nextCursor,
                        });
                      } catch (e) {
                        setError(e instanceof Error ? e.message : 'Laden fehlgeschlagen.');
                      } finally {
                        setBusy(false);
                      }
                    })()
                  }
                >
                  Ältere Änderungen laden
                </button>
              )}
            </>
          )}
        </>
      )}
      {editor && (
        <Dialog
          title={
            editor.type === 'media'
              ? 'Bild bearbeiten'
              : editor.type === 'parts'
                ? 'Teil dokumentieren'
                : 'Meilenstein planen'
          }
          onClose={() => {
            if (!busy) setEditor(null);
          }}
        >
          <form className="workspace-form" onSubmit={save}>
            <fieldset disabled={busy}>
              {picture ? (
                <>
                  <label>
                    Bildbeschreibung
                    <input name="caption" maxLength={300} defaultValue={picture.caption} />
                  </label>
                  <label>
                    Verknüpftes Teil
                    <select name="partId" defaultValue={picture.partId ?? ''}>
                      <option value="">Ohne Teil</option>
                      {parts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Verknüpfter Meilenstein
                    <select name="milestoneId" defaultValue={picture.milestoneId ?? ''}>
                      <option value="">Ohne Meilenstein</option>
                      {milestones.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Sortierposition
                    <input
                      name="position"
                      type="number"
                      min={0}
                      max={999}
                      required
                      defaultValue={picture.position}
                    />
                  </label>
                  <label className="journal-consent">
                    <input type="checkbox" name="cover" defaultChecked={picture.cover} />
                    Als Titelbild anzeigen
                  </label>
                  <label>
                    Bild ersetzen
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => void upload(e.currentTarget.files, picture.id)}
                    />
                  </label>
                </>
              ) : (
                <>
                  <label>
                    {editor.type === 'parts' ? 'Teilebezeichnung' : 'Titel'}
                    <input
                      name={editor.type === 'parts' ? 'name' : 'title'}
                      required
                      minLength={editor.type === 'parts' ? 2 : 3}
                      maxLength={120}
                      defaultValue={part?.name ?? milestone?.title}
                    />
                  </label>
                  <div className="journal-fields">
                    <label>
                      Kategorie
                      <select
                        name="category"
                        defaultValue={item && 'category' in item ? item.category : 'OTHER'}
                      >
                        {Object.entries(categories).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Projektstatus
                      <select
                        name="status"
                        defaultValue={part?.status ?? milestone?.status ?? 'PLANNED'}
                      >
                        {(editor.type === 'parts'
                          ? ['PLANNED', 'ORDERED', 'STORED', 'INSTALLED', 'REMOVED']
                          : ['PLANNED', 'PREPARING', 'ACTIVE', 'PAUSED', 'COMPLETED']
                        ).map((s) => (
                          <option key={s} value={s}>
                            {statuses[s]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {editor.type === 'parts' ? (
                    <>
                      <div className="journal-fields">
                        <label>
                          Hersteller
                          <input
                            name="manufacturer"
                            maxLength={120}
                            defaultValue={part?.manufacturer}
                          />
                        </label>
                        <label>
                          Teilenummer · eigene Angabe
                          <input
                            name="partNumber"
                            maxLength={120}
                            defaultValue={part?.partNumber}
                          />
                        </label>
                        <label>
                          Zustand
                          <select name="condition" defaultValue={part?.condition ?? 'UNKNOWN'}>
                            {Object.entries({
                              UNKNOWN: 'Nicht angegeben',
                              NEW: 'Neu',
                              USED: 'Gebraucht',
                              REFURBISHED: 'Überholt',
                            }).map(([v, l]) => (
                              <option key={v} value={v}>
                                {l}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Einbaudatum
                          <input
                            type="date"
                            name="installedOn"
                            max={new Date().toISOString().slice(0, 10)}
                            defaultValue={part?.installedOn?.slice(0, 10)}
                          />
                        </label>
                        <label>
                          Kilometerstand
                          <input
                            name="mileage"
                            type="number"
                            min={0}
                            max={2000000}
                            step={1}
                            defaultValue={part?.mileage ?? ''}
                          />
                        </label>
                        <label>
                          Kaufpreis in € · privat
                          <input
                            name="price"
                            type="number"
                            min={0}
                            max={1000000}
                            step="0.01"
                            defaultValue={part?.priceCents != null ? part.priceCents / 100 : ''}
                          />
                        </label>
                      </div>
                      <label>
                        Bezugsquelle · privat
                        <input name="source" maxLength={300} defaultValue={part?.source} />
                      </label>
                      <label>
                        Notizen
                        <textarea
                          name="notes"
                          maxLength={5000}
                          rows={4}
                          defaultValue={part?.notes}
                        />
                      </label>
                    </>
                  ) : (
                    <>
                      <div className="journal-fields">
                        <label>
                          Zieltermin
                          <input
                            name="targetOn"
                            type="date"
                            defaultValue={milestone?.targetOn?.slice(0, 10)}
                          />
                        </label>
                        <label>
                          Abschlussdatum
                          <input
                            name="completedOn"
                            type="date"
                            max={new Date().toISOString().slice(0, 10)}
                            defaultValue={milestone?.completedOn?.slice(0, 10)}
                          />
                        </label>
                        <label>
                          Fortschritt in %
                          <input
                            name="progress"
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            required
                            defaultValue={milestone?.progress ?? 0}
                          />
                        </label>
                      </div>
                      <p className="muted">
                        Abgeschlossen: 100 % und Abschlussdatum. Sonst unter 100 %, ohne
                        Abschlussdatum.
                      </p>
                      <label>
                        Beschreibung
                        <textarea
                          name="description"
                          rows={4}
                          maxLength={5000}
                          defaultValue={milestone?.description}
                        />
                      </label>
                      <label>
                        Verknüpftes Teil
                        <select name="partId" defaultValue={milestone?.partId ?? ''}>
                          <option value="">Ohne Teil</option>
                          {parts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </>
                  )}
                </>
              )}
              <label>
                Historieneintrag
                <select name="entryId" defaultValue={item?.entryId ?? ''}>
                  <option value="">Ohne Verknüpfung</option>
                  {item?.entryId && !entries.some((e) => e.id === item.entryId) && (
                    <option value={item.entryId}>Bestehende Verknüpfung behalten</option>
                  )}
                  {entries.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </select>
              </label>
              <p className="muted">
                Auswahl aus den aktuell geladenen Historieneinträgen. Private Verknüpfungen
                verhindern eine öffentliche Anzeige.
              </p>
              <label className="journal-consent">
                <input
                  type="checkbox"
                  name="public"
                  defaultChecked={item?.visibility === 'PUBLIC'}
                />
                Ausdrücklich öffentlich freigeben, wenn Fahrzeug und Verknüpfungen öffentlich sind.
                Preise und Bezugsquellen bleiben privat.
              </label>
              {error && (
                <p role="alert" className="dossier-alert">
                  {error}
                </p>
              )}
              <button className="button primary" type="submit">
                {busy ? 'Speichert …' : 'Speichern'}
              </button>
            </fieldset>
          </form>
        </Dialog>
      )}
      {remove && (
        <Dialog
          title="Eintrag löschen?"
          onClose={() => {
            if (!busy) setRemove(null);
          }}
        >
          <p>
            Der Eintrag wird dauerhaft entfernt. Verknüpfte Aufzeichnungen werden gegebenenfalls
            wieder privat.
          </p>
          {error && <p role="alert">{error}</p>}
          <button
            className="button"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await api(`${base}/${remove.type}/${remove.id}`, 'DELETE');
                setRemove(null);
              }, 'Eintrag gelöscht.')
            }
          >
            Endgültig löschen
          </button>
        </Dialog>
      )}
      {current && (
        <Dialog title={current.caption || 'Fahrzeuggalerie'} onClose={() => setLightbox(null)}>
          <div
            className="gallery-viewer"
            ref={viewer}
            onTouchStart={(e) => {
              touch.current = e.changedTouches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (touch.current !== null) {
                const delta = e.changedTouches[0].clientX - touch.current;
                if (Math.abs(delta) > 60) move(delta < 0 ? 1 : -1);
              }
              touch.current = null;
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') move(1);
              if (e.key === 'ArrowLeft') move(-1);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl(current)}
              width={current.width}
              height={current.height}
              alt={current.caption || 'Fahrzeugbild'}
            />
            <div className="journal-actions">
              <button className="button" onClick={() => move(-1)} disabled={media.length < 2}>
                Zurück
              </button>
              <span>
                {media.findIndex((m) => m.id === current.id) + 1} / {media.length}
              </span>
              <button className="button" onClick={() => move(1)} disabled={media.length < 2}>
                Weiter
              </button>
              <button
                className="text-button"
                onClick={() => {
                  if (viewer.current?.requestFullscreen)
                    void viewer.current
                      .requestFullscreen()
                      .catch(() =>
                        setNotice('Vollbild wird von diesem Browser nicht unterstützt.'),
                      );
                  else
                    setNotice(
                      'Die vergrößerte Ansicht ist auf diesem Gerät verfügbar; System-Vollbild nicht.',
                    );
                }}
              >
                Vollbild
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </section>
  );
}
