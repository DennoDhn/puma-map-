'use client';
import { useEffect, useState, useRef, type FormEvent } from 'react';
import Link from 'next/link';
import { JournalVersions } from './journal-versions';
import { VehicleWorkspace, type GalleryCover } from './vehicle-workspace';
import { Car } from './car';
import { api, date, money } from './platform-client';
import type { Vehicle } from './platform-model';
const categories: Record<string, string> = {
  ENGINE: 'Motor',
  GEARBOX: 'Getriebe',
  SUSPENSION: 'Fahrwerk',
  BRAKES: 'Bremsen',
  BODY: 'Karosserie',
  INTERIOR: 'Innenraum',
  ELECTRICAL: 'Elektrik',
  WHEELS: 'Räder & Reifen',
  OTHER: 'Sonstiges',
};
type Entry = {
  revision: number;
  keepVersions?: boolean;
  category: string;
  progress: number;
  communityBuild: { id: string; status: string } | null;
  id: string;
  kind: string;
  title: string;
  body: string;
  occurredOn: string;
  mileage: number | null;
  costCents?: number | null;
  visibility: 'PUBLIC' | 'PRIVATE';
};
type Page = { entries: Entry[]; nextCursor: string | null };
const labels: Record<string, string> = {
  BUILD: 'Build-Update',
  MAINTENANCE: 'Wartung',
  REPAIR: 'Reparatur',
};
export function VehicleDossier({ id }: { id: string }) {
  const [vehicle, setVehicle] = useState<(Vehicle & { canEdit: boolean }) | null>(null);
  const [journal, setJournal] = useState<Page>({ entries: [], nextCursor: null });
  const [cover, setCover] = useState<GalleryCover | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState<Entry | 'new' | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [versions, setVersions] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [publishing, setPublishing] = useState<Entry | null>(null);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const journalQuery = new URLSearchParams({ kind: filter, q: search });
  if (!filter) journalQuery.delete('kind');
  const journalSuffix = journalQuery.toString();
  const titleInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editing) titleInput.current?.focus();
  }, [editing]);
  const base = `vehicles/${encodeURIComponent(id)}`;
  useEffect(() => {
    let active = true;
    Promise.all([
      api<Vehicle & { canEdit: boolean }>(base),
      api<Page>(`${base}/entries?${journalSuffix}`),
    ])
      .then(([v, j]) => {
        if (active) {
          setVehicle(v);
          setJournal(j);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [base, journalSuffix]);
  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Anfrage fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const entry = editing && editing !== 'new' ? editing : null;
    void run(async () => {
      await api(`${base}/entries${entry ? '/' + entry.id : ''}`, entry ? 'PATCH' : 'POST', {
        ...(entry ? { expectedRevision: entry.revision } : {}),
        keepVersions: data.get('keepVersions') === 'on',
        kind: data.get('kind'),
        category: data.get('category'),
        progress: Number(data.get('progress')),
        title: data.get('title'),
        body: data.get('body'),
        occurredOn: data.get('occurredOn'),
        mileage: data.get('mileage') ? Number(data.get('mileage')) : null,
        costCents: data.get('cost') ? Math.round(Number(data.get('cost')) * 100) : null,
        visibility: data.get('public') === 'on' ? 'PUBLIC' : 'PRIVATE',
      });
      setJournal(await api<Page>(`${base}/entries?${journalSuffix}`));
      setEditing(null);
      setNotice('Eintrag gespeichert.');
    });
  }
  const initial = editing && editing !== 'new' ? editing : null;
  return (
    <main className="dossier">
      <nav aria-label="Zurück">
        <Link className="text-button" href="/">
          ← PumaMap / Community
        </Link>
      </nav>
      {error && (
        <p className="dossier-alert" role="alert">
          {error}
        </p>
      )}
      <p role="status" className="muted">
        {notice}
      </p>
      {!loaded && <p role="status">Fahrzeugdossier wird geladen …</p>}
      {error && (
        <button
          className="button"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              setJournal(await api<Page>(`${base}/entries?${journalSuffix}`));
              setNotice(
                'Aktueller Stand geladen. Eine offene Bearbeitung wurde nicht überschrieben.',
              );
            })
          }
        >
          Historie neu laden
        </button>
      )}
      {versions && (
        <JournalVersions
          base={`${base}/entries/${versions}`}
          onClose={() => setVersions(null)}
          onChanged={async () => {
            setJournal(await api<Page>(`${base}/entries?${journalSuffix}`));
            setEditing(null);
          }}
        />
      )}
      {vehicle && (
        <>
          <header className="dossier-hero">
            <div>
              <span className="eyebrow">PUMAMAP / VEHICLE DOSSIER</span>
              <h1>{vehicle.name}</h1>
              <p>
                {vehicle.owner?.username} ·{' '}
                {vehicle.visibility === 'PRIVATE' ? 'Privates Fahrzeug' : 'Öffentliches Fahrzeug'}
              </p>
              <dl className="dossier-specs">
                <div>
                  <dt>Variante</dt>
                  <dd>{vehicle.variant}</dd>
                </div>
                <div>
                  <dt>Baujahr</dt>
                  <dd>{vehicle.year}</dd>
                </div>
                <div>
                  <dt>Leistung</dt>
                  <dd>{vehicle.powerKw !== null ? `${vehicle.powerKw} kW` : 'Nicht angegeben'}</dd>
                </div>
                <div>
                  <dt>Laufleistung</dt>
                  <dd>
                    {vehicle.mileage !== null
                      ? `${vehicle.mileage.toLocaleString('de-DE')} km`
                      : 'Nicht angegeben'}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="dossier-art">
              {cover ? (
                <>
                  {/* Protected already optimized image; never share through optimizer cache. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/${base}/media/${cover.id}/file?v=${encodeURIComponent(cover.updatedAt)}`}
                    width={cover.width}
                    height={cover.height}
                    alt={cover.caption || vehicle.name}
                  />
                  <span>{cover.caption || 'Dein Fahrzeug. Deine Geschichte.'}</span>
                </>
              ) : (
                <>
                  <Car />
                  <span>Eigene Coupé-Illustration · kein Fahrzeugfoto</span>
                </>
              )}
            </div>
          </header>
          {vehicle.description && <p className="dossier-description">{vehicle.description}</p>}
          <VehicleWorkspace
            vehicleId={id}
            owner={vehicle.canEdit}
            entries={journal.entries}
            onCoverChange={setCover}
          />
          <section aria-labelledby="journal-title">
            <div className="split">
              <div>
                <span className="eyebrow">DIE GESCHICHTE DEINES PUMA</span>
                <h2 id="journal-title">Build & Fahrzeughistorie</h2>
              </div>
              {vehicle.canEdit && (
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={() => setEditing('new')}
                >
                  Eintrag hinzufügen
                </button>
              )}
            </div>
            <p className="muted">
              Wartung, Reparaturen und Umbauten chronologisch dokumentiert.
              {vehicle.canEdit
                ? ' Kosten siehst nur du. Einträge sind standardmäßig privat.'
                : 'Hier erscheinen ausschließlich freigegebene Einträge.'}
            </p>
            <form
              className="journal-filters"
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                setSearch(String(data.get('search') ?? ''));
                setFilter(String(data.get('kind') ?? ''));
              }}
            >
              <label>
                Historie durchsuchen
                <input
                  name="search"
                  type="search"
                  maxLength={100}
                  placeholder="Titel oder Dokumentation"
                />
              </label>
              <label>
                Eintragsart
                <select name="kind">
                  <option value="">Alle Einträge</option>
                  {Object.entries(labels).map(([v, l]) => (
                    <option value={v} key={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              <button className="button secondary" type="submit">
                Filtern
              </button>
            </form>
            {publishing && (
              <form
                className="journal-form publish-panel"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  void run(async () => {
                    await api(`${base}/entries/${publishing.id}/publish`, 'POST', {
                      title: f.get('title'),
                      body: f.get('body'),
                      confirmPublic: f.get('confirm') === 'on',
                    });
                    setPublishing(null);
                    setJournal(await api<Page>(`${base}/entries?${journalSuffix}`));
                    setNotice('Community-Build veröffentlicht.');
                  });
                }}
              >
                <span className="eyebrow">BEWUSST TEILEN</span>
                <h3>Als Community-Build veröffentlichen</h3>
                <p>
                  Veröffentliche eine eigene Beschreibung. Werkstattnotizen und Kosten werden nicht
                  übernommen. Fahrzeug und Eintrag müssen öffentlich freigegeben sein. Kommentare
                  und Reaktionen sind anschließend öffentlich.
                </p>
                <fieldset disabled={busy}>
                  <label>
                    Öffentlicher Titel
                    <input
                      name="title"
                      required
                      minLength={3}
                      maxLength={120}
                      defaultValue={publishing.title}
                    />
                  </label>
                  <label>
                    Öffentliche Build-Beschreibung
                    <textarea name="body" required minLength={10} maxLength={10000} rows={5} />
                  </label>
                  <label className="journal-consent">
                    <input type="checkbox" name="confirm" required /> Ich möchte diese Beschreibung
                    öffentlich in der Community teilen.
                  </label>
                  <div className="journal-actions">
                    <button className="button" type="submit">
                      Jetzt veröffentlichen
                    </button>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => setPublishing(null)}
                    >
                      Abbrechen
                    </button>
                  </div>
                </fieldset>
              </form>
            )}
            {editing && (
              <form className="journal-form" onSubmit={submit} key={initial?.id ?? 'new'}>
                <h3>
                  {initial ? `Eintrag bearbeiten · V${initial.revision}` : 'Neuer Historieneintrag'}
                </h3>
                {initial && (
                  <p className="muted">
                    Änderungen in anderen Fenstern werden erkannt. Bei einem Konflikt bleiben deine
                    Eingaben hier stehen. Kopiere sie bei Bedarf, brich ab und lade anschließend den
                    aktuellen Stand.
                  </p>
                )}
                <fieldset disabled={busy}>
                  <div className="journal-fields">
                    <label>
                      Art
                      <select name="kind" defaultValue={initial?.kind ?? 'BUILD'}>
                        {Object.entries(labels).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Technische Kategorie
                      <select name="category" defaultValue={initial?.category ?? 'OTHER'}>
                        {Object.entries(categories).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Fortschritt in %
                      <input
                        name="progress"
                        type="number"
                        required
                        min="0"
                        max="100"
                        step="1"
                        defaultValue={initial?.progress ?? 0}
                      />
                    </label>
                    <label>
                      Datum
                      <input
                        name="occurredOn"
                        type="date"
                        required
                        max={new Date().toISOString().slice(0, 10)}
                        defaultValue={
                          initial?.occurredOn.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
                        }
                      />
                    </label>
                    <label>
                      Kilometerstand
                      <input
                        name="mileage"
                        type="number"
                        min="0"
                        max="2000000"
                        step="1"
                        defaultValue={initial?.mileage ?? ''}
                      />
                    </label>
                    <label>
                      Kosten in € · nur für dich
                      <input
                        name="cost"
                        type="number"
                        min="0"
                        max="1000000"
                        step="0.01"
                        defaultValue={initial?.costCents != null ? initial.costCents / 100 : ''}
                      />
                    </label>
                  </div>
                  <label>
                    Titel
                    <input
                      ref={titleInput}
                      name="title"
                      required
                      minLength={3}
                      maxLength={120}
                      defaultValue={initial?.title}
                    />
                  </label>
                  <label>
                    Dokumentation
                    <textarea
                      name="body"
                      required
                      minLength={10}
                      maxLength={10000}
                      rows={5}
                      defaultValue={initial?.body}
                    />
                  </label>
                  <label className="journal-consent">
                    <input
                      type="checkbox"
                      name="keepVersions"
                      defaultChecked={initial?.keepVersions ?? false}
                    />
                    Frühere Inhalte für meine Wiederherstellung speichern: maximal 20 Stände für 30
                    Tage. Freiwillig; beim Deaktivieren werden vorhandene Versionen gelöscht.
                    Freitexte können private Angaben enthalten.
                  </label>
                  <label className="journal-consent">
                    <input
                      name="public"
                      type="checkbox"
                      defaultChecked={initial?.visibility === 'PUBLIC'}
                    />{' '}
                    Öffentlich anzeigen, sofern das Fahrzeug öffentlich ist. Kosten bleiben privat.
                  </label>
                  <div className="journal-actions">
                    <button className="button primary" type="submit">
                      {busy ? 'Speichert …' : 'Eintrag speichern'}
                    </button>
                    <button className="button" type="button" onClick={() => setEditing(null)}>
                      Abbrechen
                    </button>
                  </div>
                </fieldset>
              </form>
            )}
            {!journal.entries.length && (
              <div className="journal-empty">
                <h3>Noch keine sichtbaren Einträge</h3>
                <p>Eine Fahrzeuggeschichte beginnt mit dem ersten dokumentierten Schritt.</p>
              </div>
            )}
            <ol className="journal-timeline">
              {journal.entries.map((entry) => (
                <li key={entry.id} id={`entry-${entry.id}`}>
                  <article>
                    <div className="split">
                      <span className="tag">{labels[entry.kind]}</span>
                      <time dateTime={entry.occurredOn}>{date(entry.occurredOn)}</time>
                    </div>
                    <h3>{entry.title}</h3>
                    <span className="tag">{categories[entry.category]}</span>
                    {entry.kind === 'BUILD' && (
                      <div className="build-progress">
                        <span>Fortschritt {entry.progress} %</span>
                        <progress
                          max={100}
                          value={entry.progress}
                          aria-label={`Fortschritt: ${entry.title}`}
                        />
                      </div>
                    )}
                    {entry.communityBuild && (
                      <a className="build-preview" href={`/beitraege/${entry.communityBuild.id}`}>
                        Community-Build öffnen · Kommentare & Reaktionen →
                      </a>
                    )}
                    {vehicle.canEdit && entry.kind === 'BUILD' && !entry.communityBuild && (
                      <button
                        className="button secondary"
                        disabled={busy}
                        onClick={() => setPublishing(entry)}
                      >
                        Als Community-Build teilen
                      </button>
                    )}
                    <p className="journal-body">{entry.body}</p>
                    <div className="journal-meta">
                      {entry.mileage !== null && (
                        <span>{entry.mileage.toLocaleString('de-DE')} km</span>
                      )}
                      {entry.costCents != null && (
                        <span>{money(entry.costCents)} · nur für dich</span>
                      )}
                      <span>{entry.visibility === 'PRIVATE' ? 'Privat' : 'Freigegeben'}</span>
                    </div>
                    {vehicle.canEdit && (
                      <div className="journal-actions">
                        <button
                          className="text-button"
                          disabled={busy}
                          onClick={() => setEditing(entry)}
                        >
                          Bearbeiten
                        </button>
                        <button
                          className="text-button"
                          disabled={busy}
                          onClick={() => setVersions(entry.id)}
                        >
                          Versionen
                        </button>
                        <button
                          className="text-button"
                          disabled={busy}
                          onClick={() => setDeleting(entry.id)}
                        >
                          Löschen
                        </button>
                      </div>
                    )}
                    {deleting === entry.id && (
                      <div role="group" aria-label="Löschen bestätigen">
                        <p>Diesen Eintrag endgültig löschen?</p>
                        <button
                          className="button"
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              await api(`${base}/entries/${entry.id}`, 'DELETE', {
                                expectedRevision: entry.revision,
                              });
                              setJournal(await api<Page>(`${base}/entries?${journalSuffix}`));
                              setDeleting(null);
                              if (initial?.id === entry.id) setEditing(null);
                              setNotice('Eintrag gelöscht.');
                            })
                          }
                        >
                          Endgültig löschen
                        </button>
                        <button
                          className="text-button"
                          disabled={busy}
                          onClick={() => setDeleting(null)}
                        >
                          Behalten
                        </button>
                      </div>
                    )}
                  </article>
                </li>
              ))}
            </ol>
            {journal.nextCursor && (
              <button
                className="button"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const next = await api<Page>(
                      `${base}/entries?${journalSuffix}&cursor=${encodeURIComponent(journal.nextCursor!)}`,
                    );
                    setJournal({
                      entries: [...journal.entries, ...next.entries],
                      nextCursor: next.nextCursor,
                    });
                  })
                }
              >
                Ältere Einträge laden
              </button>
            )}
          </section>
        </>
      )}
      {loaded && !vehicle && (
        <p>
          Das Fahrzeug ist privat, nicht verfügbar oder konnte nicht geladen werden. Melde dich auf
          der Startseite an, um deine privaten Fahrzeuge aufzurufen.
        </p>
      )}
    </main>
  );
}
