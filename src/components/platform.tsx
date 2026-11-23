'use client';
import { CommunityDiscovery } from './community-discovery';
import { NotificationCenter } from './notification-center';
import { useState, useEffect, useCallback, type FormEvent } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowRight,
  Menu,
  X,
  MapPin,
  CarFront,
  MessageCircle,
  CalendarDays,
  Bookmark,
  Bell,
  Settings,
  ShieldCheck,
  Plus,
  Search,
  Users,
  LogOut,
  Check,
  ChevronRight,
  LockKeyhole,
  Download,
  Trash2,
  Pencil,
  Activity,
  Globe,
  Radio,
} from 'lucide-react';
import { Car } from './car';
import { VirtualGarage } from './virtual-garage';
const PlatformDialogs = dynamic(() => import('./platform-dialogs'));
import type { Member } from './community-map';
const CommunityMap = dynamic(() => import('./community-map'), {
  ssr: false,
  loading: () => <div className="skeleton map-canvas" />,
});
import type { Me, Vehicle, Kind, Item, Admin, Screen, Modal } from './platform-model';
import { nav, headings, kinds } from './platform-navigation';
import { api, date, money } from './platform-client';
import { Empty, Field, ModerateForm } from './platform-ui';
export function Platform({ initialContentId }: { initialContentId?: string } = {}) {
  const [me, setMe] = useState<Me | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionLookupFailed, setSessionLookupFailed] = useState(false);
  const [screen, setScreen] = useState<Screen>('home');
  const [mobile, setMobile] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [stats, setStats] = useState({ members: 0, vehicles: 0, posts: 0, events: 0 });
  const [forumCategory, setForumCategory] = useState('');
  const [categories, setCategories] = useState<{ name: string; parentName: string | null }[]>([]);
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([]);
  const [highlights, setHighlights] = useState<{ events: Item[]; listings: Item[]; wiki: Item[] }>({
    events: [],
    listings: [],
    wiki: [],
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [query, setQuery] = useState('');
  const [mine, setMine] = useState(false);
  const [contentPage, setContentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [revision, setRevision] = useState(0);
  const refresh = () => setRevision((v) => v + 1);
  useEffect(() => {
    if (!initialContentId) return;
    let active = true;
    api<Item>(`contents/${encodeURIComponent(initialContentId)}`)
      .then((item) => {
        if (active) setModal({ type: 'detail', item });
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [initialContentId]);

  const navigate = (next: Screen) => {
    setScreen(next);
    setContentPage(1);
    setQuery('');
    setForumCategory('');
    setMine(false);
    setError('');
    setMobile(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  useEffect(() => {
    let alive = true;
    api<Me | null>('me')
      .then((user) => {
        if (alive) {
          setMe(user);
          setSessionReady(true);
        }
      })
      .catch((e) => {
        if (alive) {
          setSessionLookupFailed(true);
          setError(e.message);
        }
      });
    api<{ id: string; name: string }[]>('regions')
      .then((result) => {
        if (alive) setRegions(result);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    const params = new URLSearchParams(window.location.search);
    const verify = params.get('verify'),
      reset = params.get('reset');
    if (verify || reset) {
      queueMicrotask(() => {
        if (alive) {
          setModal({
            type: 'auth',
            mode: verify ? 'verify' : 'reset',
            token: verify ?? reset ?? undefined,
          });
          window.history.replaceState({}, '', window.location.pathname);
        }
      });
    }
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const s = await api<typeof stats>('stats');
        if (!alive) return;
        setStats(s);
        if (screen === 'home' || screen === 'garage') {
          const [v, c, highlights] = await Promise.all([
            api<Vehicle[]>(`vehicles${screen === 'garage' && mine ? '?mine=true' : ''}`),
            api<Item[]>('contents?kind=POST&feed=true'),
            screen === 'home'
              ? api<{ events: Item[]; listings: Item[]; wiki: Item[] }>('home-highlights')
              : null,
          ]);
          if (alive) {
            setVehicles(v);
            if (highlights) setHighlights(highlights);
            if (screen === 'home') setItems(c);
          }
        } else if (kinds.includes(screen as Kind) || screen === 'saved') {
          if (screen === 'TOPIC') {
            const groups = await api<typeof categories>('forum-categories');
            if (alive) setCategories(groups);
          }
          const endpoint =
            screen === 'saved'
              ? 'saved?'
              : `contents?kind=${screen}&feed=${screen === 'POST'}&mine=${mine}&category=${encodeURIComponent(forumCategory)}&`;
          const c = await api<{ items: Item[]; hasMore: boolean }>(
            `${endpoint}q=${encodeURIComponent(query)}&page=${contentPage}`,
          );
          if (alive) {
            setItems(c.items);
            setHasMore(c.hasMore);
          }
        } else if (screen === 'map') {
          if (!me?.shareRegion) {
            if (alive) setMembers([]);
          } else {
            const m = await api<Member[]>('members');
            if (alive) setMembers(m);
          }
        } else if (screen === 'admin') {
          const a = await api<Admin>('admin');
          if (alive) setAdmin(a);
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Laden fehlgeschlagen.');
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [screen, mine, query, revision, me?.shareRegion, contentPage, forumCategory]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 7000);
    return () => clearTimeout(id);
  }, [toast]);
  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Aktion fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  };
  const openAuth = () => setModal({ type: 'auth', mode: 'login' });
  const authenticated = async (fn: () => void) => {
    if (!sessionReady) {
      await run(async () => {
        const user = await api<Me | null>('me');
        setMe(user);
        setSessionReady(true);
        if (user) fn();
        else openAuth();
      });
      return;
    }
    if (me) fn();
    else openAuth();
  };
  const openMember = useCallback((id: string) => {
    void api<Member>(`members/${id}`)
      .then((member) => setModal({ type: 'member', member }))
      .catch((e) => setError(e.message));
  }, []);
  const openDetail = (id: string) =>
    void run(async () => {
      const item = await api<Item>(`contents/${id}`);
      setModal({ type: 'detail', item });
    });
  const changeDetail = async (id: string, action: string, method = 'POST', data?: unknown) => {
    await api(`contents/${id}/${action}`, method, data);
    const item = await api<Item>(`contents/${id}`);
    setModal({ type: 'detail', item });
    refresh();
  };
  const authSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (modal?.type !== 'auth') return;
    void run(async () => {
      let data: Record<string, unknown> = {};
      if (['login', 'register', 'request-reset', 'resend'].includes(modal.mode))
        data.email = String(form.get('email'));
      if (['login', 'register', 'reset'].includes(modal.mode))
        data.password = String(form.get('password'));
      if (modal.mode === 'register')
        data = {
          ...data,
          username: String(form.get('username')),
          shareRegion: form.get('shareRegion') === 'on',
          regionId: form.get('regionId') || null,
        };
      if (modal.token) data.token = modal.token;
      const result = await api<Me & { message?: string }>(`auth/${modal.mode}`, 'POST', data);
      if (modal.mode === 'login') {
        setMe(result);
        setModal(null);
        setToast('Willkommen zurück.');
        refresh();
      } else {
        setToast(result.message ?? 'Gespeichert.');
        setModal({ type: 'auth', mode: 'login' });
      }
    });
  };
  const vehicleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const existing = modal?.type === 'vehicle' ? modal.vehicle : undefined;
    void run(async () => {
      await api(`vehicles${existing ? '/' + existing.id : ''}`, existing ? 'PATCH' : 'POST', {
        name: f.get('name'),
        variant: f.get('variant'),
        year: Number(f.get('year')),
        powerKw: f.get('powerKw') ? Number(f.get('powerKw')) : null,
        mileage: f.get('mileage') ? Number(f.get('mileage')) : null,
        color: f.get('color'),
        description: f.get('description'),
        visibility: f.get('visibility'),
      });
      setModal(null);
      setToast('Fahrzeug dauerhaft gespeichert.');
      setMine(true);
      setScreen('garage');
      refresh();
    });
  };
  const contentSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (modal?.type !== 'editor') return;
    const f = new FormData(e.currentTarget);
    const { kind, item } = modal;
    void run(async () => {
      const result = await api<Item>(
        `contents${item ? '/' + item.id : ''}`,
        item ? 'PATCH' : 'POST',
        {
          kind,
          title: f.get('title'),
          body: f.get('body'),
          category: f.get('category'),
          priceCents: kind === 'LISTING' ? Math.round(Number(f.get('price')) * 100) : null,
          region: f.get('region') || null,
          startsAt: f.get('startsAt') ? new Date(String(f.get('startsAt'))).toISOString() : null,
          location: f.get('location') || null,
          sourceUrl: f.get('sourceUrl') || null,
        },
      );
      setModal(null);
      setScreen(kind);
      setMine(kind === 'WIKI');
      refresh();
      setToast(
        result.status === 'DRAFT'
          ? 'Wiki-Entwurf gespeichert. Redaktionelle Freigabe steht aus.'
          : 'Inhalt gespeichert.',
      );
    });
  };
  const editorTitle =
    modal?.type === 'editor'
      ? {
          POST: 'Beitrag',
          TOPIC: 'Thema',
          LISTING: 'Inserat',
          EVENT: 'Event',
          WIKI: 'Wikiartikel',
          BUILD: 'Build-Update',
        }[modal.kind]
      : '';
  const heading = headings[screen];
  const currentNav = nav.find((n) => n.id === screen);
  const vehicleCards = (list: Vehicle[]) =>
    list.map((v) => (
      <article className="vehicle-card" key={v.id}>
        <div className="vehicle-art">
          <span className="pill">
            {v.year} / {v.variant}
          </span>
          <Car />
          <span className="art-caption">PUMAMAP · COUPÉ STUDY</span>
        </div>
        <div className="vehicle-info">
          <div className="split">
            <span className="muted small">{v.owner?.username ?? me?.username}</span>
            <span className={`visibility ${v.visibility === 'PRIVATE' ? 'private' : ''}`}>
              {v.visibility === 'PRIVATE' ? (
                <>
                  <LockKeyhole size={12} /> Privat
                </>
              ) : (
                'Öffentlich'
              )}
            </span>
          </div>
          <h3>
            <a href={`/fahrzeuge/${v.id}`}>
              {v.name} <ArrowUpRight size={16} />
            </a>
          </h3>
          <p>
            {v.color} ·{' '}
            {v.mileage !== null
              ? new Intl.NumberFormat('de-DE').format(v.mileage) + ' km'
              : 'Kilometerstand offen'}
          </p>
          <div className="split vehicle-bottom">
            <span>{v.powerKw !== null ? v.powerKw + ' kW' : 'Leistung offen'}</span>
            {v.ownerId === me?.id ? (
              <button
                className="text-button"
                onClick={() => setModal({ type: 'vehicle', vehicle: v })}
              >
                Bearbeiten <Pencil size={13} />
              </button>
            ) : (
              <button className="text-button" onClick={() => openMember(v.ownerId)}>
                Profil <ArrowUpRight size={16} />
              </button>
            )}
          </div>
        </div>
      </article>
    ));
  const contentCards = (list: Item[]) =>
    list.map((item) => (
      <article className={`content-card kind-${item.kind.toLowerCase()}`} key={item.id}>
        <div className="split">
          <span className="tag">
            {item.kind === 'BUILD' ? 'BUILD / ' : ''}
            {item.category}
          </span>
          <span className="muted small">{date(item.createdAt)}</span>
        </div>
        {item.startsAt && (
          <div className="event-date">
            <CalendarDays size={20} />
            {date(item.startsAt)} ·{' '}
            {new Date(item.startsAt).toLocaleTimeString('de-DE', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Europe/Berlin',
            })}{' '}
            Uhr
          </div>
        )}
        {(item.pinned || item.locked) && (
          <div className="discussion-tools">
            {item.pinned && <span className="tag">Angeheftet</span>}
            {item.locked && <span className="tag">Geschlossen</span>}
          </div>
        )}
        <h3>
          <button className="title-button" onClick={() => openDetail(item.id)}>
            {item.title}
            <ArrowUpRight size={18} />
          </button>
        </h3>
        <p className="clamp">{item.body}</p>
        {item.priceCents !== null && <strong className="price">{money(item.priceCents)}</strong>}
        <div className="content-footer">
          <button className="author-button" onClick={() => openMember(item.authorId)}>
            <span className="avatar tiny">{item.author.username.slice(0, 2).toUpperCase()}</span>
            {item.author.username}
          </button>
          <span className="muted small">
            <MessageCircle size={13} /> {item._count.comments}
          </span>
          {item.status !== 'PUBLISHED' && (
            <span className="tag">
              {
                {
                  DRAFT: 'Entwurf',
                  RESERVED: 'Reserviert',
                  SOLD: 'Verkauft',
                  HIDDEN: 'Ausgeblendet',
                }[item.status]
              }
            </span>
          )}
        </div>
      </article>
    ));
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Zum Inhalt springen
      </a>
      <aside className={`sidebar ${mobile ? 'is-open' : ''}`}>
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">
            P<span>↗</span>
          </span>
          <span>
            PUMA<span className="lime">MAP</span>
            <small>THE MK1 COLLECTIVE</small>
          </span>
        </Link>
        <div className="sidebar-section">DEINE COMMUNITY</div>
        <nav aria-label="Hauptnavigation">
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={screen === id ? 'active' : ''}
              aria-current={screen === id ? 'page' : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {screen === id && <span className="active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="sidebar-section">DEIN BEREICH</div>
        <nav aria-label="Persönlicher Bereich">
          <button
            className={screen === 'saved' ? 'active' : ''}
            onClick={() => authenticated(() => navigate('saved'))}
          >
            <Bookmark size={18} />
            Gespeichert
          </button>
          <button
            className={screen === 'profile' ? 'active' : ''}
            onClick={() => authenticated(() => navigate('profile'))}
          >
            <Settings size={18} />
            Profil & Datenschutz
          </button>
          {me && me.role !== 'MEMBER' && (
            <button onClick={() => navigate('admin')}>
              <ShieldCheck size={18} />
              Moderation
            </button>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="collective-badge">
            <span className="orb" />
            <div>
              Eine gemeinsame Leidenschaft.<small>Kein gewöhnliches Auto.</small>
            </div>
          </div>
          <button className="version-button" onClick={() => setModal({ type: 'status' })}>
            PUMAMAP / DEVELOPMENT <ArrowUpRight size={12} />
          </button>
        </div>
      </aside>
      {mobile && (
        <button
          className="nav-scrim"
          onClick={() => setMobile(false)}
          aria-label="Navigation schließen"
        />
      )}
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button menu-button"
              aria-label={mobile ? 'Menü schließen' : 'Menü öffnen'}
              aria-expanded={mobile}
              onClick={() => setMobile(!mobile)}
            >
              {mobile ? <X /> : <Menu />}
            </button>
            <span className="breadcrumb-root">Community</span>
            <ChevronRight size={14} />
            <strong>{currentNav?.label ?? heading.title}</strong>
          </div>
          <div className="topbar-actions">
            <span className="edition">MK1 / EST. 1997</span>
            <button
              className="icon-button"
              aria-label="Benachrichtigungen"
              disabled={!sessionReady && !sessionLookupFailed}
              onClick={() => authenticated(() => navigate('notifications'))}
            >
              <Bell size={19} />
            </button>
            {me ? (
              <button className="profile-button" onClick={() => navigate('profile')}>
                <span className="avatar">{me.username.slice(0, 2).toUpperCase()}</span>
                <span>{me.username}</span>
              </button>
            ) : (
              <button className="button small-button" onClick={openAuth}>
                Anmelden <ArrowUpRight size={15} />
              </button>
            )}
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          <div className="page-intro">
            <div>
              <span className="eyebrow">{heading.eyebrow}</span>
              <h1>
                {screen === 'studio' ? (
            <VirtualGarage onBack={() => navigate('garage')} />
          ) : screen === 'home' ? (
                  <>
                    Willkommen im <em>Collective.</em>
                  </>
                ) : (
                  heading.title
                )}
              </h1>
              <p>{heading.description}</p>
            </div>
            {screen === 'home' && (
              <span className="outline-label">
                <span className="status-dot" /> ENTWICKLUNGSSTAND · V0.6
              </span>
            )}
          </div>
          {error && (
            <div className="alert" role="alert">
              {error}
              <button className="text-button" onClick={refresh}>
                Erneut laden
              </button>
            </div>
          )}
          {screen === 'home' ? (
            <>
              <section className="hero">
                <div className="hero-grid" aria-hidden="true" />
                <div className="hero-copy">
                  <span className="hero-edition"><span className="hero-edition-light" aria-hidden="true" /> NOIR SIGNATURE <span className="hero-edition-divider" aria-hidden="true" /> THE MK1 COLLECTIVE</span>
                  <span className="hero-kicker">
                    <span /> BUILT AROUND A LEGEND
                  </span>
                  <h2>
                    Eine Ikone.
                    <br />
                    Tausend Geschichten.
                    <br />
                    <em>Deine gehört dazu.</em>
                  </h2>
                  <p>
                    Für die letzte Schraube. Die erste Ausfahrt.
                    <br />
                    Und alles, was uns dazwischen verbindet.
                  </p>
                  <div className="button-row">
                    <button
                      className="button"
                      onClick={() => authenticated(() => navigate('garage'))}
                    >
                      {me ? 'Deine Garage öffnen' : 'Teil der Community werden'}
                      <ArrowUpRight size={18} />
                    </button>
                    <button className="button secondary" onClick={() => navigate('map')}>
                      Karte entdecken <MapPin size={16} />
                    </button>
                  </div>
                  <p className="hero-footnote"><span aria-hidden="true" className="hero-footnote-line" /> Die unabhängige Community für den Ford Puma Mk1.</p>
                </div>
                <div className="hero-visual">
                  <div className="hero-model" aria-hidden="true">
                    PUMA<span>MK1</span>
                  </div>
                  <span className="hero-vehicle-label">THE ORIGINAL COUPÉ <span>1997 / 2002</span></span>
                  <div className="hero-vehicle-halo" aria-hidden="true" />
                  <Car className="hero-car" />
                  <div className="spec-line">
                    <span>1997 — 2002</span>
                    <span>ORIGINAL SPIRIT.</span>
                    <span>ENDLESS POSSIBILITIES.</span>
                  </div>
                </div>
                <div className="hero-bottom">
                  <span>01 / THE ORIGINAL CONNECTION</span>
                  <span>UNABHÄNGIG. LEIDENSCHAFTLICH. PUMAMAP.</span>
                </div>
              </section>
              <nav className="signature-pathways" aria-label="PumaMap entdecken">
                <button type="button" className="signature-pathway" onClick={() => navigate('garage')}>
                  <span className="pathway-index">01 / GARAGE</span>
                  <span className="pathway-title"><CarFront size={22} /> Deine Fahrzeuge <ArrowUpRight size={18} /></span>
                  <span className="pathway-description">Fahrzeuge, Umbauten und ihre Geschichte.</span>
                </button>
                <button type="button" className="signature-pathway" onClick={() => navigate('BUILD')}>
                  <span className="pathway-index">02 / BUILDS</span>
                  <span className="pathway-title"><Activity size={22} /> Projekte entdecken <ArrowUpRight size={18} /></span>
                  <span className="pathway-description">Vom ersten Konzept bis zum letzten Detail.</span>
                </button>
                <button type="button" className="signature-pathway" onClick={() => navigate('POST')}>
                  <span className="pathway-index">03 / COMMUNITY</span>
                  <span className="pathway-title"><Users size={22} /> Austausch erleben <ArrowUpRight size={18} /></span>
                  <span className="pathway-description">Menschen, Wissen und gemeinsame Leidenschaft.</span>
                </button>
              </nav>
              <section className="stats" aria-label="Community-Statistiken">
                {[
                  { icon: Users, value: stats.members, label: 'Verifizierte Mitglieder' },
                  { icon: CarFront, value: stats.vehicles, label: 'Öffentliche Fahrzeuge' },
                  { icon: Radio, value: stats.posts, label: 'Community-Beiträge' },
                  { icon: CalendarDays, value: stats.events, label: 'Kommende Events' },
                ].map(({ icon: Icon, value, label }) => (
                  <div key={label}>
                    <span className="stat-icon">
                      <Icon size={20} />
                    </span>
                    <div>
                      <strong>{loading || error ? '—' : value.toLocaleString('de-DE')}</strong>
                      <span>{label}</span>
                    </div>
                    <Activity size={15} className="stat-trend" />
                  </div>
                ))}
              </section>
              <div className="home-columns">
                <section>
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">DAS HERZ DER COMMUNITY</span>
                      <h2>
                        Fahrzeuge mit Charakter<span className="lime">.</span>
                      </h2>
                    </div>
                    <button className="text-button" onClick={() => navigate('garage')}>
                      Alle Fahrzeuge <ArrowRight size={16} />
                    </button>
                  </div>
                  {vehicles.length ? (
                    <div className="vehicle-grid">{vehicleCards(vehicles.slice(0, 2))}</div>
                  ) : (
                    <Empty
                      title="Die erste Geschichte wartet."
                      action={
                        <button
                          className="button secondary"
                          onClick={() => authenticated(() => setModal({ type: 'vehicle' }))}
                        >
                          <Plus size={16} /> Fahrzeug hinzufügen
                        </button>
                      }
                    >
                      Hier erscheinen echte, öffentlich freigegebene Fahrzeuge. Dein Puma kann den
                      Anfang machen.
                    </Empty>
                  )}
                  <div className="section-heading feed-heading">
                    <div>
                      <span className="eyebrow">NEUES AUS DEM COLLECTIVE</span>
                      <h2>Werkstattgespräche.</h2>
                    </div>
                    <button className="text-button" onClick={() => navigate('POST')}>
                      Zum Feed <ArrowRight size={16} />
                    </button>
                  </div>
                  {items.length ? (
                    <div className="content-grid">{contentCards(items.slice(0, 2))}</div>
                  ) : (
                    <Empty icon={MessageCircle} title="Platz für deinen ersten Beitrag.">
                      Teile eine Frage, eine Idee oder den nächsten Schritt an deinem Puma.
                    </Empty>
                  )}
                  {(
                    [
                      { kind: 'EVENT', title: 'Nächste Treffen', items: highlights.events },
                      {
                        kind: 'LISTING',
                        title: 'Frisch im Marktplatz',
                        items: highlights.listings,
                      },
                      { kind: 'WIKI', title: 'Neues im Technik-Wiki', items: highlights.wiki },
                    ] as const
                  )
                    .filter((group) => group.items.length > 0)
                    .map((group) => (
                      <section key={group.kind}>
                        <div className="section-heading feed-heading">
                          <h2>{group.title}</h2>
                          <button className="text-button" onClick={() => navigate(group.kind)}>
                            Alle anzeigen <ArrowRight size={16} />
                          </button>
                        </div>
                        <div className="content-grid">{contentCards(group.items)}</div>
                      </section>
                    ))}
                </section>
                <aside className="right-column">
                  <section className="region-promo">
                    <span className="eyebrow">NÄHER ALS DU DENKST</span>
                    <h2>
                      Dein nächster
                      <br />
                      Kontakt beginnt
                      <br />
                      <em>auf der Karte.</em>
                    </h2>
                    <div className="abstract-map" aria-hidden="true">
                      <div className="map-road r1" />
                      <div className="map-road r2" />
                      <div className="map-road r3" />
                      <span className="pin p1">
                        <MapPin />
                      </span>
                      <span className="pin p2">
                        <MapPin />
                      </span>
                      <span className="map-label">DEINE REGION</span>
                    </div>
                    <p>
                      Ungefähre Regionen.
                      <br />
                      Echte Verbindungen. Keine Wohnadressen.
                    </p>
                    <button className="button full" onClick={() => navigate('map')}>
                      Community entdecken <ArrowUpRight size={16} />
                    </button>
                  </section>
                  <section className="manifesto">
                    <ShieldCheck size={24} />
                    <h3>Deine Daten. Deine Entscheidung.</h3>
                    <p>
                      Private Garage, freiwillige Standortfreigabe und Kontrolle über dein Konto.
                    </p>
                    <button
                      className="text-button"
                      onClick={() => authenticated(() => navigate('profile'))}
                    >
                      Datenschutz einstellen <ArrowRight size={14} />
                    </button>
                  </section>
                </aside>
              </div>
            </>
          ) : null}
          {screen === 'garage' && (
            <>
              <div className="toolbar">
                <div className="segmented">
                  <button className={!mine ? 'selected' : ''} onClick={() => setMine(false)}>
                    Community-Garage
                  </button>
                  <button
                    className={mine ? 'selected' : ''}
                    onClick={() => authenticated(() => setMine(true))}
                  >
                    Meine Fahrzeuge
                  </button>
                </div>
                <button
                  className="button"
                  onClick={() => authenticated(() => setModal({ type: 'vehicle' }))}
                >
                  <Plus size={17} /> Fahrzeug hinzufügen
                </button>
              </div>
              {loading ? (
                <div className="skeleton loading-panel" />
              ) : vehicles.length ? (
                <div className="vehicle-grid three">{vehicleCards(vehicles)}</div>
              ) : (
                <Empty
                  title={mine ? 'Deine Garage ist bereit.' : 'Noch keine öffentlichen Fahrzeuge.'}
                >
                  Füge deinen Puma hinzu. Du entscheidest für jedes Fahrzeug, ob es öffentlich
                  sichtbar ist.
                </Empty>
              )}
            </>
          )}
          {(kinds.includes(screen as Kind) || screen === 'saved') && (
            <>
              <div className="toolbar">
                <form
                  className="search-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setContentPage(1);
                    setQuery(String(new FormData(e.currentTarget).get('q') ?? ''));
                  }}
                >
                  <Search size={18} />
                  <input
                    name="q"
                    aria-label="Inhalte durchsuchen"
                    placeholder="Titel oder Inhalt durchsuchen …"
                  />
                  <button className="text-button" type="submit">
                    Suchen
                  </button>
                </form>
                <div className="button-row">
                  {me && screen !== 'saved' && (
                    <label className="inline-check">
                      <input
                        type="checkbox"
                        checked={mine}
                        onChange={(e) => {
                          setMine(e.target.checked);
                          setContentPage(1);
                        }}
                      />{' '}
                      Nur meine
                    </label>
                  )}
                  {screen !== 'saved' && (
                    <button
                      className="button"
                      onClick={() =>
                        authenticated(() => setModal({ type: 'editor', kind: screen as Kind }))
                      }
                    >
                      <Plus size={17} /> Erstellen
                    </button>
                  )}
                </div>
              </div>
              {screen === 'TOPIC' && (
                <label className="field">
                  <span>Forum nach Kategorie filtern</span>
                  <select
                    value={forumCategory}
                    onChange={(event) => {
                      setContentPage(1);
                      setForumCategory(event.target.value);
                    }}
                  >
                    <option value="">Alle Kategorien</option>
                    {categories
                      .filter((c) => !c.parentName)
                      .map((root) => (
                        <optgroup key={root.name} label={root.name}>
                          <option value={root.name}>
                            {root.name} einschließlich Unterkategorien
                          </option>
                          {categories
                            .filter((c) => c.parentName === root.name)
                            .map((c) => (
                              <option key={c.name}>{c.name}</option>
                            ))}
                        </optgroup>
                      ))}
                  </select>
                </label>
              )}
              {loading ? (
                <div className="skeleton loading-panel" />
              ) : items.length ? (
                <div className="content-grid">{contentCards(items)}</div>
              ) : (
                <Empty
                  icon={currentNav?.icon ?? Bookmark}
                  title={query ? 'Keine passenden Inhalte.' : 'Hier beginnt das nächste Kapitel.'}
                >
                  {query
                    ? 'Versuche einen anderen Suchbegriff.'
                    : 'Es gibt hier noch keine passenden veröffentlichten Inhalte.'}
                </Empty>
              )}
            </>
          )}
          {(kinds.includes(screen as Kind) || screen === 'saved') && !loading && (
            <div className="discussion-tools">
              <button
                className="button secondary"
                disabled={contentPage === 1}
                onClick={() => setContentPage((p) => p - 1)}
              >
                Vorherige Beiträge
              </button>
              <span>Seite {contentPage}</span>
              <button
                className="button secondary"
                disabled={!hasMore}
                onClick={() => setContentPage((p) => p + 1)}
              >
                Weitere Beiträge
              </button>
            </div>
          )}
          {screen === 'map' &&
            (!me ? (
              <Empty
                icon={MapPin}
                title="Finde das Collective in deiner Region."
                action={
                  <button className="button" onClick={openAuth}>
                    Anmelden <ArrowUpRight size={16} />
                  </button>
                }
              >
                Die Mitgliederkarte ist angemeldeten Mitgliedern mit freiwilliger regionaler
                Freigabe vorbehalten.
              </Empty>
            ) : !me.shareRegion ? (
              <Empty
                icon={LockKeyhole}
                title="Deine Region bleibt privat."
                action={
                  <button className="button" onClick={() => navigate('profile')}>
                    Standortfreigabe verwalten
                  </button>
                }
              >
                Solange du keine Region freigibst, bleibt die Mitgliederkarte eingeschränkt.
                Öffentliche Fahrzeuge, Beiträge und Termine kannst du weiterhin ansehen.
              </Empty>
            ) : (
              <>
                <div className="toolbar">
                  <label className="search-form">
                    <Search size={18} />
                    <input
                      aria-label="Mitglieder oder Region filtern"
                      placeholder="Mitglied, Region oder Fahrzeug …"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <span className="muted">{members.length} freigegebene Profile</span>
                </div>
                <CommunityMap
                  members={members.filter((m) =>
                    `${m.username} ${m.region?.name} ${m.vehicles.map((v) => v.variant).join(' ')}`
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                  )}
                  onMember={openMember}
                />
                <div className="member-list">
                  {members
                    .filter((m) =>
                      `${m.username} ${m.region?.name} ${m.vehicles.map((v) => v.variant).join(' ')}`
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                    )
                    .map((m) => (
                      <button key={m.id} className="member-row" onClick={() => openMember(m.id)}>
                        <span className="avatar">{m.username.slice(0, 2).toUpperCase()}</span>
                        <span>
                          <strong>{m.username}</strong>
                          <small>{m.region?.name}</small>
                        </span>
                        <ArrowUpRight size={17} />
                      </button>
                    ))}
                </div>
              </>
            ))}
          {screen === 'profile' && me && (
            <div className="settings-grid">
              <section className="panel">
                <div className="profile-heading">
                  <span className="avatar large">{me.username.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <h2>{me.username}</h2>
                    <p className="muted">{me.email}</p>
                  </div>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    void run(async () => {
                      const user = await api<Me>('profile', 'PATCH', {
                        bio: f.get('bio'),
                        regionId: f.get('regionId') || null,
                        shareRegion: f.get('shareRegion') === 'on',
                      });
                      setMe(user);
                      setToast('Profil und Sichtbarkeit gespeichert.');
                      refresh();
                    });
                  }}
                >
                  <Field label="Über dich">
                    <textarea name="bio" maxLength={1000} defaultValue={me.bio} rows={5} />
                  </Field>
                  <Field label="Ungefähre Region">
                    <select name="regionId" defaultValue={me.regionId ?? ''}>
                      <option value="">Keine Region auswählen</option>
                      {regions.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <label className="consent-box">
                    <input name="shareRegion" type="checkbox" defaultChecked={me.shareRegion} />
                    <span>
                      Meine ungefähre Region auf der Mitgliederkarte freigeben.
                      <small>
                        Keine Adresse und keine GPS-Daten. Freiwillig und jederzeit widerrufbar.
                        Ohne Freigabe ist die Mitgliederkarte eingeschränkt.
                      </small>
                    </span>
                  </label>
                  <button className="button" disabled={busy}>
                    Änderungen speichern <Check size={16} />
                  </button>
                </form>
              </section>
              <aside>
                <section className="panel">
                  <h3>Dein Konto</h3>
                  <p>Deine E-Mail-Adresse ist nur für dich und die Kontoverwaltung sichtbar.</p>
                  <a download className="button secondary full" href="/api/profile/export">
                    <Download size={16} /> Daten exportieren
                  </a>
                  <button
                    className="button secondary full mt"
                    onClick={() =>
                      void run(async () => {
                        await api('auth/logout', 'POST');
                        setMe(null);
                        navigate('home');
                        setToast('Du bist abgemeldet.');
                      })
                    }
                  >
                    <LogOut size={16} /> Abmelden
                  </button>
                </section>
                <section className="panel danger-panel">
                  <h3>Konto löschen</h3>
                  <p>
                    Entfernt dein Profil, Fahrzeuge, eigene Beiträge und zugehörige persönliche
                    Daten. Die Löschung lässt sich nicht rückgängig machen.
                  </p>
                  <button
                    className="button danger"
                    onClick={() => setModal({ type: 'deleteAccount' })}
                  >
                    <Trash2 size={16} /> Konto löschen
                  </button>
                </section>
              </aside>
            </div>
          )}
          {screen === 'discover' && (
            <CommunityDiscovery openMember={openMember} openContent={openDetail} />
          )}
          {screen === 'notifications' && <NotificationCenter openContent={openDetail} />}
          {screen === 'admin' && admin && (
            <>
              <div className="settings-grid">
                <section className="panel">
                  <h2>Offene Meldungen</h2>
                  {admin.reports.length ? (
                    admin.reports.map((r) => (
                      <div className="admin-row" key={r.id}>
                        <button className="title-button" onClick={() => openDetail(r.content.id)}>
                          {r.content.title}
                          <ArrowUpRight size={16} />
                        </button>
                        {r.comment && (
                          <blockquote>{r.comment.body || 'Kommentar wurde entfernt.'}</blockquote>
                        )}
                        <p>{r.reason}</p>
                        {r.comment ? (
                          <div className="button-row">
                            {[false, true].map((remove) => (
                              <button
                                key={String(remove)}
                                className="button secondary"
                                disabled={busy}
                                onClick={() =>
                                  void run(async () => {
                                    await api('admin/comment-review', 'POST', {
                                      reportId: r.id,
                                      remove,
                                    });
                                    refresh();
                                    setToast('Meldung bearbeitet.');
                                  })
                                }
                              >
                                {remove ? 'Kommentar entfernen' : 'Meldung schließen'}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <ModerateForm
                            id={r.content.id}
                            action="HIDE"
                            busy={busy}
                            submit={(data) =>
                              void run(async () => {
                                await api('admin/moderate', 'POST', data);
                                refresh();
                                setToast('Maßnahme gespeichert und protokolliert.');
                              })
                            }
                          />
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="muted">Keine offenen Meldungen.</p>
                  )}
                </section>
                <section className="panel">
                  <h2>Wiki-Freigaben</h2>
                  {admin.drafts.length ? (
                    admin.drafts.map((d) => (
                      <div className="admin-row" key={d.id}>
                        <button className="title-button" onClick={() => openDetail(d.id)}>
                          {d.title}
                          <ArrowUpRight size={16} />
                        </button>
                        <p>Autor: {d.author.username}</p>
                        <ModerateForm
                          id={d.id}
                          action="PUBLISH"
                          busy={busy}
                          submit={(data) =>
                            void run(async () => {
                              await api('admin/moderate', 'POST', data);
                              refresh();
                              setToast('Artikel freigegeben.');
                            })
                          }
                        />
                      </div>
                    ))
                  ) : (
                    <p className="muted">Keine Artikel zur Prüfung.</p>
                  )}
                </section>
              </div>
              <section className="panel mt">
                <h2>Audit-Protokoll</h2>
                {admin.audit.map((a) => (
                  <div className="notice" key={a.id}>
                    <ShieldCheck size={16} />
                    <span>{a.action}</span>
                    <small>{date(a.createdAt)}</small>
                  </div>
                ))}
              </section>
            </>
          )}
          <footer>
            <span>
              © {new Date().getFullYear()} PUMAMAP <span className="footer-sep">/</span> THE MK1
              COLLECTIVE
            </span>
            <div>
              <button onClick={() => setModal({ type: 'status' })}>Entwicklungsstand</button>
              <button onClick={() => setModal({ type: 'legal' })}>Rechtliche Hinweise</button>
              <span>DE</span>
              <Globe size={13} />
            </div>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={19} />
          {toast}
          <button aria-label="Hinweis schließen" onClick={() => setToast('')}>
            <X size={16} />
          </button>
        </div>
      )}
      {modal && (
        <PlatformDialogs
          modal={modal}
          setModal={setModal}
          error={error}
          setError={setError}
          busy={busy}
          me={me}
          setMe={setMe}
          regions={regions}
          forumCategories={categories}
          authSubmit={authSubmit}
          vehicleSubmit={vehicleSubmit}
          contentSubmit={contentSubmit}
          editorTitle={editorTitle}
          authenticated={authenticated}
          run={run}
          changeDetail={changeDetail}
          openAuth={openAuth}
          refresh={refresh}
          setToast={setToast}
          navigate={navigate}
        />
      )}
    </div>
  );
}
