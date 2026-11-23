'use client';
import { useEffect, useState } from 'react';
import { Dialog } from './dialog';
import { api, date } from './platform-client';
type Snapshot = {
  kind: string;
  title: string;
  body: string;
  category: string;
  progress: number;
  occurredOn: string;
};
type Version = {
  id: string;
  revision: number;
  actorId: string;
  createdAt: string;
  expiresAt: string;
  snapshot: Snapshot;
};
type History = {
  revision: number;
  keepVersions: boolean;
  versions: Version[];
  retentionDays: number;
  limit: number;
};
export function JournalVersions({
  base,
  onClose,
  onChanged,
}: {
  base: string;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const [history, setHistory] = useState<History | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState<Version | null>(null),
    [purge, setPurge] = useState(false),
    [notice, setNotice] = useState('');
  useEffect(() => {
    let alive = true;
    api<History>(`${base}/versions`)
      .then((h) => {
        if (alive) setHistory(h);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [base]);
  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await task();
      await onChanged();
      setHistory(await api<History>(`${base}/versions`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Anfrage fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      title="Versionen & Wiederherstellung"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <div className="version-center">
        <span className="eyebrow">PRIVATE RECOVERY</span>
        <p>
          Bis zu 20 frühere Inhaltsstände, höchstens 30 Tage. Nur du kannst sie lesen. Kosten,
          Kilometerstand, Bilder und Verknüpfungen werden nicht zurückgesetzt.
        </p>
        {error && (
          <p role="alert" className="dossier-alert">
            {error}
          </p>
        )}
        <p role="status">{busy ? 'Wird verarbeitet …' : notice}</p>
        {history ? (
          <>
            <div className="recovery-summary">
              <span>
                Aktueller Stand <strong>V{history.revision}</strong>
              </span>
              <span>
                {history.keepVersions ? 'Aufbewahrung aktiv' : 'Aufbewahrung deaktiviert'}
              </span>
            </div>
            {!history.versions.length && (
              <div className="journal-empty">
                <h3>Noch keine wiederherstellbaren Stände</h3>
                <p>
                  Aktiviere die Aufbewahrung beim Bearbeiten des Eintrags. Erst nachfolgenden
                  Änderungen werden frühere Inhalte zugeordnet. Ältere oder gelöschte Versionen sind
                  nicht wiederherstellbar.
                </p>
              </div>
            )}
            <ol className="version-list">
              {history.versions.map((v) => (
                <li key={v.id}>
                  <div className="split">
                    <span className="tag">V{v.revision}</span>
                    <time dateTime={v.createdAt}>
                      {new Date(v.createdAt).toLocaleString('de-DE')}
                    </time>
                  </div>
                  <h3>{v.snapshot.title}</h3>
                  <p className="muted">
                    Gültig bis {date(v.expiresAt)} · {v.snapshot.progress} %
                  </p>
                  <details>
                    <summary>Gespeicherten Inhalt prüfen</summary>
                    <p className="journal-body">{v.snapshot.body}</p>
                    <dl>
                      <dt>Art / Kategorie</dt>
                      <dd>
                        {v.snapshot.kind} / {v.snapshot.category}
                      </dd>
                      <dt>Eintragsdatum</dt>
                      <dd>{date(v.snapshot.occurredOn)}</dd>
                    </dl>
                  </details>
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() => {
                      setSelected(v);
                      setPurge(false);
                    }}
                  >
                    Version {v.revision} wiederherstellen
                  </button>
                </li>
              ))}
            </ol>
            {selected && (
              <form
                className="recovery-confirm"
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(async () => {
                    await api(`${base}/restore`, 'POST', {
                      versionId: selected.id,
                      expectedRevision: history.revision,
                      confirmPrivate: true,
                    });
                    setSelected(null);
                    setNotice('Version wiederhergestellt. Der Eintrag ist jetzt privat.');
                  });
                }}
              >
                <h3>
                  V{selected.revision}: {selected.snapshot.title}
                </h3>
                <p>
                  Der aktuelle Inhalt wird vorher als private Version gesichert. Der
                  wiederhergestellte Eintrag wird privat; verknüpfte Community-Builds und Medien
                  sind für andere anschließend nicht mehr abrufbar.
                </p>
                <label className="journal-consent">
                  <input type="checkbox" required disabled={busy} />
                  Ich bestätige die Wiederherstellung als privaten Eintrag.
                </label>
                <div className="journal-actions">
                  <button className="button primary" disabled={busy}>
                    Privat wiederherstellen
                  </button>
                  <button
                    className="text-button"
                    type="button"
                    disabled={busy}
                    onClick={() => setSelected(null)}
                  >
                    Abbrechen
                  </button>
                </div>
              </form>
            )}
            {history.keepVersions && !purge && (
              <button
                className="text-button"
                disabled={busy}
                onClick={() => {
                  setPurge(true);
                  setSelected(null);
                }}
              >
                Versionen löschen & Aufbewahrung beenden
              </button>
            )}
            {purge && (
              <div className="recovery-confirm">
                <h3>Gespeicherte Versionen endgültig löschen?</h3>
                <p>
                  Der aktuelle Eintrag bleibt erhalten. Alle früheren Stände werden gelöscht und die
                  Aufbewahrung wird deaktiviert.
                </p>
                <button
                  className="button"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await api(`${base}/versions`, 'DELETE', {
                        expectedRevision: history.revision,
                      });
                      setPurge(false);
                      setNotice('Frühere Versionen gelöscht. Aufbewahrung deaktiviert.');
                    })
                  }
                >
                  Aufbewahrung beenden und Versionen löschen
                </button>
              </div>
            )}
            <button
              className="text-button"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  setSelected(null);
                  setPurge(false);
                })
              }
            >
              Versionsliste aktualisieren
            </button>
          </>
        ) : (
          <p role="status">Versionen werden geladen …</p>
        )}
      </div>
    </Dialog>
  );
}
