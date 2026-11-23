'use client';
import { CommunityDiscussion } from './community-discussion';
import type { FormEvent } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Trash2,
  CalendarDays,
  Heart,
  Bookmark,
  Flag,
  Pencil,
  CarFront,
} from 'lucide-react';
import type { Me, Modal, Screen, Item } from './platform-model';
import { api, date, money } from './platform-client';
import { Field } from './platform-ui';
import { Dialog } from './dialog';
import { Car } from './car';
type Props = {
  modal: Exclude<Modal, null>;
  setModal: (value: Modal) => void;
  error: string;
  setError: (value: string) => void;
  busy: boolean;
  me: Me | null;
  setMe: (value: Me | null) => void;
  forumCategories: { name: string; parentName: string | null }[];
  regions: { id: string; name: string }[];
  authSubmit: (event: FormEvent<HTMLFormElement>) => void;
  vehicleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  contentSubmit: (event: FormEvent<HTMLFormElement>) => void;
  editorTitle: string;
  authenticated: (action: () => void) => void;
  run: (action: () => Promise<void>) => Promise<void>;
  changeDetail: (id: string, action: string, method?: string, data?: unknown) => Promise<void>;
  openAuth: () => void;
  refresh: () => void;
  setToast: (value: string) => void;
  navigate: (value: Screen) => void;
};
export default function PlatformDialogs({
  modal,
  setModal,
  error,
  setError,
  busy,
  me,
  setMe,
  regions,
  forumCategories,
  authSubmit,
  vehicleSubmit,
  contentSubmit,
  editorTitle,
  authenticated,
  run,
  changeDetail,
  refresh,
  setToast,
  navigate,
}: Props) {
  return (
    <Dialog
      title={
        modal.type === 'auth'
          ? {
              login: 'Willkommen zurück.',
              register: 'Dein Platz im Collective.',
              'request-reset': 'Passwort vergessen?',
              resend: 'Bestätigung erneut senden',
              verify: 'E-Mail bestätigen',
              reset: 'Neues Passwort festlegen',
            }[modal.mode]
          : modal.type === 'vehicle'
            ? modal.vehicle
              ? 'Fahrzeug bearbeiten'
              : 'Dein Puma. Deine Geschichte.'
            : modal.type === 'editor'
              ? `${editorTitle} ${modal.item ? 'bearbeiten' : 'erstellen'}`
              : modal.type === 'detail'
                ? modal.item.title
                : modal.type === 'member'
                  ? modal.member.username
                  : modal.type === 'report'
                    ? 'Inhalt melden'
                    : modal.type === 'deleteAccount'
                      ? 'Konto dauerhaft löschen'
                      : modal.type === 'confirmDelete'
                        ? 'Eintrag löschen'
                        : modal.type === 'legal'
                          ? 'Rechtliche Hinweise'
                          : 'Projektstatus · 0.6'
      }
      onClose={() => {
        setModal(null);
        setError('');
      }}
    >
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
      {modal.type === 'auth' && (
        <form onSubmit={authSubmit}>
          <p className="muted">
            {modal.mode === 'register'
              ? 'Erstelle dein Konto. Die Bestätigung erfolgt per E-Mail.'
              : modal.mode === 'verify'
                ? 'Bestätige deine E-Mail-Adresse mit diesem einmaligen Link.'
                : 'Deine Garage, deine Projekte und deine Community.'}
          </p>
          {modal.mode === 'register' && (
            <Field label="Benutzername">
              <input
                name="username"
                autoComplete="username"
                required
                minLength={3}
                maxLength={24}
                pattern="[a-zA-Z0-9_]+"
                placeholder="Dein Name im Collective"
              />
            </Field>
          )}
          {['login', 'register', 'request-reset', 'resend'].includes(modal.mode) && (
            <Field label="E-Mail-Adresse">
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="du@beispiel.de"
              />
            </Field>
          )}
          {['login', 'register', 'reset'].includes(modal.mode) && (
            <Field label={modal.mode === 'login' ? 'Passwort' : 'Passwort · mindestens 12 Zeichen'}>
              <input
                name="password"
                type="password"
                autoComplete={modal.mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={modal.mode === 'login' ? 1 : 12}
                maxLength={128}
              />
            </Field>
          )}
          {modal.mode === 'register' && (
            <>
              <Field label="Region (freiwillig)">
                <select name="regionId">
                  <option value="">Privat lassen</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </Field>
              <label className="consent-box">
                <input type="checkbox" name="shareRegion" />
                <span>
                  Meine ungefähre Region freigeben.
                  <small>
                    Jederzeit widerrufbar. Die Mitgliederkarte ist ohne Freigabe eingeschränkt.
                    Deine Wohnadresse wird nicht erhoben.
                  </small>
                </span>
              </label>
            </>
          )}
          <button className="button full" disabled={busy}>
            {busy
              ? 'Wird verarbeitet …'
              : {
                  login: 'Anmelden',
                  register: 'Konto erstellen',
                  'request-reset': 'Link anfordern',
                  resend: 'Bestätigung anfordern',
                  verify: 'E-Mail jetzt bestätigen',
                  reset: 'Passwort ändern',
                }[modal.mode]}
            <ArrowRight size={17} />
          </button>
          <div className="auth-links">
            {modal.mode === 'login' ? (
              <>
                <button type="button" onClick={() => setModal({ type: 'auth', mode: 'register' })}>
                  Noch kein Konto? Registrieren
                </button>
                <button
                  type="button"
                  onClick={() => setModal({ type: 'auth', mode: 'request-reset' })}
                >
                  Passwort vergessen
                </button>
                <button type="button" onClick={() => setModal({ type: 'auth', mode: 'resend' })}>
                  Bestätigung erneut senden
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setModal({ type: 'auth', mode: 'login' })}>
                Zur Anmeldung
              </button>
            )}
          </div>
        </form>
      )}
      {modal.type === 'vehicle' && (
        <form onSubmit={vehicleSubmit}>
          <div className="form-car">
            <Car />
          </div>
          <Field label="Fahrzeugname">
            <input
              name="name"
              defaultValue={modal.vehicle?.name}
              required
              minLength={2}
              maxLength={80}
              placeholder="Mein Puma"
            />
          </Field>
          <div className="form-grid">
            <Field label="Variante / Motorisierung">
              <input
                name="variant"
                required
                maxLength={80}
                defaultValue={modal.vehicle?.variant}
                placeholder="z. B. 1.7"
              />
            </Field>
            <Field label="Baujahr">
              <input
                name="year"
                type="number"
                required
                min={1997}
                max={2002}
                defaultValue={modal.vehicle?.year ?? 2000}
              />
            </Field>
            <Field label="Leistung (kW, optional)">
              <input
                name="powerKw"
                type="number"
                min={1}
                max={1000}
                defaultValue={modal.vehicle?.powerKw ?? ''}
              />
            </Field>
            <Field label="Laufleistung (km, optional)">
              <input
                name="mileage"
                type="number"
                min={0}
                max={2000000}
                defaultValue={modal.vehicle?.mileage ?? ''}
              />
            </Field>
          </div>
          <Field label="Farbe">
            <input
              name="color"
              required
              minLength={2}
              maxLength={60}
              defaultValue={modal.vehicle?.color}
              placeholder="z. B. Pacific Green"
            />
          </Field>
          <Field label="Geschichte / Umbauten">
            <textarea
              name="description"
              rows={4}
              maxLength={5000}
              defaultValue={modal.vehicle?.description}
            />
          </Field>
          <Field label="Sichtbarkeit">
            <select name="visibility" defaultValue={modal.vehicle?.visibility ?? 'PRIVATE'}>
              <option value="PRIVATE">Privat · nur für mich</option>
              <option value="PUBLIC">Öffentlich · für die Community</option>
            </select>
          </Field>
          <p className="muted small">
            Nach dem Speichern kannst du im Fahrzeugdossier eigene Bilder hochladen, ein Titelbild
            wählen sowie Teile und Meilensteine dokumentieren. Neue Bilder bleiben zunächst privat.
          </p>
          <button className="button full" disabled={busy}>
            Fahrzeug speichern <Check size={16} />
          </button>
          {modal.vehicle && (
            <button
              type="button"
              className="text-button danger-text mt"
              onClick={() =>
                setModal({ type: 'confirmDelete', entity: 'vehicles', id: modal.vehicle!.id })
              }
            >
              <Trash2 size={15} /> Fahrzeug löschen
            </button>
          )}
        </form>
      )}
      {modal.type === 'editor' && (
        <form onSubmit={contentSubmit}>
          <Field label="Titel">
            <input
              name="title"
              required
              minLength={3}
              maxLength={140}
              defaultValue={modal.item?.title}
            />
          </Field>
          <Field label="Kategorie">
            <select name="category" defaultValue={modal.item?.category ?? 'Allgemein'}>
              {modal.kind === 'TOPIC' && forumCategories.length ? (
                <>
                  {modal.item && !forumCategories.some((c) => c.name === modal.item?.category) && (
                    <option>{modal.item.category}</option>
                  )}
                  {forumCategories
                    .filter((c) => !c.parentName)
                    .map((root) => (
                      <optgroup key={root.name} label={root.name}>
                        <option>{root.name}</option>
                        {forumCategories
                          .filter((c) => c.parentName === root.name)
                          .map((c) => (
                            <option key={c.name}>{c.name}</option>
                          ))}
                      </optgroup>
                    ))}
                </>
              ) : (
                [
                  'Allgemein',
                  'Motor',
                  'Fahrwerk',
                  'Bremsen',
                  'Elektrik',
                  'Karosserie',
                  'Innenraum',
                  'Wartung',
                  'Teile',
                  'Fahrzeuge',
                  'Treffen',
                ].map((c) => <option key={c}>{c}</option>)
              )}
            </select>
          </Field>
          <Field label="Inhalt">
            <textarea
              name="body"
              required
              minLength={10}
              maxLength={15000}
              rows={7}
              defaultValue={modal.item?.body}
              placeholder="Erzähle der Community mehr …"
            />
          </Field>
          {modal.kind === 'LISTING' && (
            <>
              <Field label="Preis in Euro">
                <input
                  name="price"
                  type="number"
                  min={0}
                  max={1000000}
                  step="0.01"
                  required
                  defaultValue={
                    modal.item?.priceCents !== null && modal.item?.priceCents !== undefined
                      ? modal.item.priceCents / 100
                      : ''
                  }
                />
              </Field>
              <Field label="Region">
                <input name="region" maxLength={100} defaultValue={modal.item?.region ?? ''} />
              </Field>
              <p className="muted small">
                Zustand bitte in der Beschreibung angeben. Dieses Modul verarbeitet keine Zahlungen
                und bietet noch keine privaten Verkäufernachrichten.
              </p>
            </>
          )}
          {modal.kind === 'EVENT' && (
            <>
              <Field label="Datum und Uhrzeit (Zeitzone deines Geräts)">
                <input
                  name="startsAt"
                  type="datetime-local"
                  required
                  defaultValue={
                    modal.item?.startsAt
                      ? new Date(
                          new Date(modal.item.startsAt).getTime() -
                            new Date(modal.item.startsAt).getTimezoneOffset() * 60000,
                        )
                          .toISOString()
                          .slice(0, 16)
                      : ''
                  }
                />
              </Field>
              <Field label="Öffentlicher Treffpunkt">
                <input
                  name="location"
                  required
                  maxLength={200}
                  defaultValue={modal.item?.location ?? ''}
                />
              </Field>
            </>
          )}
          {modal.kind === 'WIKI' && (
            <>
              <Field label="Überprüfbare Quelle (HTTPS)">
                <input
                  name="sourceUrl"
                  type="url"
                  required
                  defaultValue={modal.item?.sourceUrl ?? ''}
                  placeholder="https://…"
                />
              </Field>
              <p className="muted small">
                Wird als Entwurf gespeichert. Auch Änderungen benötigen eine neue redaktionelle
                Freigabe.
              </p>
            </>
          )}
          <button className="button full" disabled={busy}>
            {modal.kind === 'WIKI' ? 'Zur Prüfung speichern' : 'Speichern'}
            <Check size={16} />
          </button>
        </form>
      )}
      {modal.type === 'detail' && (
        <div className="detail">
          <div className="split">
            <span className="tag">{modal.item.category}</span>
            <span className="muted small">
              {date(modal.item.createdAt)} · {modal.item.author.username}
            </span>
          </div>
          <p className="detail-body">{modal.item.body}</p>
          <a className="text-button" href={`/beitraege/${modal.item.id}`}>
            Direktlink zum Beitrag
          </a>
          {modal.item.vehicleEntry && (
            <a className="build-preview" href={`/fahrzeuge/${modal.item.vehicleEntry.vehicleId}`}>
              <span className="eyebrow">VERKNÜPFTES FAHRZEUG</span>
              <strong>{modal.item.vehicleEntry.vehicle.name}</strong>
              <span>Build-Fortschritt: {modal.item.vehicleEntry.progress} %</span>
              <progress
                max={100}
                value={modal.item.vehicleEntry.progress}
                aria-label="Build-Fortschritt"
              />
            </a>
          )}
          {modal.item.priceCents !== null && (
            <p className="price">{money(modal.item.priceCents)}</p>
          )}
          {modal.item.startsAt && (
            <p>
              <CalendarDays size={16} /> {date(modal.item.startsAt)} · {modal.item.location}
            </p>
          )}
          {modal.item.sourceUrl && (
            <a
              className="text-button"
              href={modal.item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Quelle öffnen <ArrowUpRight size={15} />
            </a>
          )}
          <div className="detail-actions">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() =>
                authenticated(
                  () =>
                    void run(() =>
                      changeDetail(
                        modal.item.id,
                        'reaction',
                        modal.item.myReactions?.some((r) => r.type === 'LIKE') ? 'DELETE' : 'POST',
                        { type: 'LIKE' },
                      ),
                    ),
                )
              }
            >
              <Heart size={16} />
              {modal.item.myReactions?.some((r) => r.type === 'LIKE')
                ? 'Gefällt dir'
                : 'Gefällt mir'}
            </button>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() =>
                authenticated(
                  () =>
                    void run(() =>
                      changeDetail(
                        modal.item.id,
                        'reaction',
                        modal.item.myReactions?.some((r) => r.type === 'SAVE') ? 'DELETE' : 'POST',
                        { type: 'SAVE' },
                      ),
                    ),
                )
              }
            >
              <Bookmark size={16} />
              {modal.item.myReactions?.some((r) => r.type === 'SAVE') ? 'Gespeichert' : 'Speichern'}
            </button>
            <button
              className="icon-button"
              aria-label="Inhalt melden"
              onClick={() => authenticated(() => setModal({ type: 'report', id: modal.item.id }))}
            >
              <Flag size={16} />
            </button>
          </div>
          {modal.item.kind === 'EVENT' && (
            <button
              className="button full"
              disabled={busy}
              onClick={() =>
                authenticated(
                  () =>
                    void run(() =>
                      changeDetail(
                        modal.item.id,
                        'attend',
                        modal.item.attending ? 'DELETE' : 'POST',
                      ),
                    ),
                )
              }
            >
              {modal.item.attending ? 'Teilnahme absagen' : 'Für dieses Event anmelden'} ·{' '}
              {modal.item._count.attendance} Teilnehmende
            </button>
          )}
          {modal.item.authorId === me?.id && (
            <div className="detail-actions">
              <button
                className="text-button"
                onClick={() =>
                  setModal({ type: 'editor', kind: modal.item.kind, item: modal.item })
                }
              >
                <Pencil size={14} />
                Bearbeiten
              </button>
              <button
                className="text-button danger-text"
                onClick={() =>
                  setModal({ type: 'confirmDelete', entity: 'contents', id: modal.item.id })
                }
              >
                <Trash2 size={14} />
                Löschen
              </button>
              {modal.item.kind === 'LISTING' && (
                <select
                  aria-label="Inseratsstatus"
                  value={modal.item.status}
                  onChange={(e) =>
                    void run(() =>
                      changeDetail(modal.item.id, 'status', 'PATCH', {
                        status: e.target.value,
                      }),
                    )
                  }
                >
                  <option value="PUBLISHED">Verfügbar</option>
                  <option value="RESERVED">Reserviert</option>
                  <option value="SOLD">Verkauft</option>
                </select>
              )}
            </div>
          )}
          <CommunityDiscussion
            item={modal.item}
            me={me}
            onChange={async () => {
              const updated = await api<Item>(`contents/${modal.item.id}`);
              setModal({ type: 'detail', item: updated });
            }}
          />
          {!!modal.item.revisions?.length && (
            <details>
              <summary>Änderungsverlauf ({modal.item.revisions.length})</summary>
              {modal.item.revisions.map((r) => (
                <div className="comment" key={r.id}>
                  <strong>
                    {date(r.createdAt)} · {r.title}
                  </strong>
                  <p>{r.body}</p>
                </div>
              ))}
            </details>
          )}
        </div>
      )}
      {modal.type === 'member' && (
        <>
          <div className="profile-heading">
            <span className="avatar large">{modal.member.username.slice(0, 2).toUpperCase()}</span>
            <div>
              <h3>{modal.member.username}</h3>
              <p className="muted">{modal.member.region?.name ?? 'Region privat'}</p>
            </div>
          </div>
          {modal.member._count && (
            <div className="recovery-summary">
              <span>{modal.member._count.vehicles} öffentliche Fahrzeuge</span>
              <span>{modal.member._count.contents} öffentliche Inhalte</span>
            </div>
          )}
          {!!modal.member.contents?.length && (
            <section className="profile-activity">
              <h3>Beiträge & Builds</h3>
              {modal.member.contents.map((c) => (
                <a className="discovery-card" key={c.id} href={`/beitraege/${c.id}`}>
                  <span className="eyebrow">{c.kind}</span>
                  <strong>{c.title}</strong>
                  <small>{date(c.createdAt)}</small>
                </a>
              ))}
            </section>
          )}
          <p className="detail-body">{modal.member.bio || 'Noch keine Profilbeschreibung.'}</p>
          <h3>Öffentliche Fahrzeuge</h3>
          {modal.member.vehicles.length ? (
            modal.member.vehicles.map((v) => (
              <div className="member-row" key={v.id}>
                <CarFront />
                <span>
                  <a href={`/fahrzeuge/${v.id}`}>
                    <strong>{v.name}</strong>
                  </a>
                  <small>
                    {v.year} · {v.variant} · {v.color}
                  </small>
                </span>
              </div>
            ))
          ) : (
            <p className="muted">Keine öffentlichen Fahrzeuge.</p>
          )}
        </>
      )}
      {modal.type === 'report' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const reason = new FormData(e.currentTarget).get('reason');
            void run(async () => {
              await api(`contents/${modal.id}/report`, 'POST', { reason });
              setModal(null);
              setToast('Deine Meldung wurde an die Moderation übermittelt.');
            });
          }}
        >
          <Field label="Grund der Meldung">
            <textarea name="reason" required minLength={10} maxLength={1000} rows={5} />
          </Field>
          <button className="button" disabled={busy}>
            Meldung senden <Flag size={15} />
          </button>
        </form>
      )}
      {modal.type === 'confirmDelete' && (
        <>
          <p>Dieser Eintrag wird mit zugehörigen Kommentaren und Reaktionen dauerhaft entfernt.</p>
          <button
            className="button danger"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await api(`${modal.entity}/${modal.id}`, 'DELETE');
                setModal(null);
                refresh();
                setToast('Eintrag gelöscht.');
              })
            }
          >
            Endgültig löschen
          </button>
        </>
      )}
      {modal.type === 'deleteAccount' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const password = new FormData(e.currentTarget).get('password');
            void run(async () => {
              await api('profile', 'DELETE', { password });
              setMe(null);
              setModal(null);
              navigate('home');
              setToast('Dein Konto und die zugehörigen Daten wurden gelöscht.');
            });
          }}
        >
          <p>
            Exportiere deine Daten vorher, wenn du sie behalten möchtest. Für die endgültige
            Löschung bestätige dein Passwort.
          </p>
          <Field label="Aktuelles Passwort">
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
            />
          </Field>
          <button className="button danger full" disabled={busy}>
            Konto und Daten endgültig löschen
          </button>
        </form>
      )}
      {modal.type === 'legal' && (
        <div className="prose">
          <span className="tag">NICHT ZUR ÖFFENTLICHEN ABNAHME FREIGEGEBEN</span>
          <h3>Unabhängiges Community-Projekt</h3>
          <p>
            PumaMap ist keine offizielle Website der Ford Motor Company. Markennamen dienen der
            Beschreibung des Fahrzeugschwerpunkts.
          </p>
          <h3>Betreiberangaben und rechtliche Prüfung ausstehend</h3>
          <p>
            Vor einem öffentlichen Start müssen vollständiges Impressum, Datenschutzerklärung,
            Community-Regeln und Marktplatzbedingungen anhand des tatsächlichen Betreibers und der
            eingesetzten Dienste juristisch geprüft und ergänzt werden.
          </p>
          <h3>Datenschutz dieser Entwicklungsfassung</h3>
          <p>
            Konten speichern E-Mail, Benutzernamen und einen Passwort-Hash. Standortfreigaben
            beziehen sich ausschließlich auf auswählbare Regionen. OpenStreetMap wird erst auf
            ausdrücklichen Wunsch geladen. Kontoexport und Löschung findest du im Profil.
          </p>
        </div>
      )}
      {modal.type === 'status' && (
        <div className="prose">
          <span className="tag">ENTWICKLUNGSFASSUNG · KEIN PRODUKTIONSRELEASE</span>
          <p>
            Diese Oberfläche arbeitet mit der angeschlossenen PostgreSQL-Datenbank. Es werden keine
            Mitglieder, Beiträge oder Kennzahlen vorgetäuscht.
          </p>
          <h3>Erste implementierte Abläufe</h3>
          <p>
            Konten mit E-Mail-Bestätigung, Login, Wiederherstellung, Profile, regionale Freigabe,
            Fahrzeugdatensätze, textbasierte Beiträge, Themen, Inserate, Events, Wiki-Entwürfe und
            Build-Updates. Kommentare, Merkliste, Teilnahmen und grundlegende Moderation.
            Fahrzeuggalerien mit geschütztem Upload, Teilelisten, Meilensteine und privater
            Änderungsverlauf ergänzen die Fahrzeugdossiers. Private Versionswiederherstellung,
            Forenabonnements, Antworten, Themenmoderation, Community-Suche und
            Benachrichtigungseinstellungen sind ebenfalls implementiert.
          </p>
          <h3>Noch nicht vollständig</h3>
          <p>
            Medien in allen Community-Bereichen, vollständige Forumstruktur, PLZ-Suche, private
            Nachrichten, Clubs, Build-Timeline, Gamification, Legacy Center, PWA und erweiterte
            Administration. Diese Bereiche sind nicht als fertige Module freigeschaltet.
          </p>
          <h3>Vor Veröffentlichung</h3>
          <p>
            Altbestand übernehmen, rechtliche Texte ergänzen, Mailzustellung konfigurieren,
            unabhängige Sicherheitsprüfung, vollständige Geräte- und Lasttests sowie getestetes
            Produktions-Backup und Rollback.
          </p>
        </div>
      )}
    </Dialog>
  );
}
