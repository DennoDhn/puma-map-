import {
  Compass,
  MapPin,
  CarFront,
  Radio,
  MessageCircle,
  ShoppingBag,
  BookOpen,
  CalendarDays,
  Wrench,
} from 'lucide-react';
import type { Kind } from './platform-model';
export const nav = [
  { id: 'home', label: 'Entdecken', icon: Compass },
  { id: 'discover', label: 'Community-Suche', icon: Compass },
  { id: 'map', label: 'Community-Karte', icon: MapPin },
  { id: 'garage', label: 'Fahrzeuggarage', icon: CarFront },
  { id: 'POST', label: 'Community Feed', icon: Radio },
  { id: 'TOPIC', label: 'Forum', icon: MessageCircle },
  { id: 'LISTING', label: 'Marktplatz', icon: ShoppingBag },
  { id: 'WIKI', label: 'Technik-Wiki', icon: BookOpen },
  { id: 'EVENT', label: 'Treffen & Ausfahrten', icon: CalendarDays },
  { id: 'BUILD', label: 'Builds & Projekte', icon: Wrench },
] as const;
export const headings: Record<string, { eyebrow: string; title: string; description: string }> = {
  discover: {
    eyebrow: 'DAS MK1 NETZWERK',
    title: 'Menschen. Wissen. Projekte.',
    description: 'Finde öffentlich geteilte Fahrzeuge, Builds und Erfahrungen.',
  },
  home: {
    eyebrow: 'FORD PUMA MK1 · 1997—2002',
    title: 'Eine Ikone. Deine Community.',
    description: 'Für Menschen, die mehr als ein Auto sehen.',
  },
  map: {
    eyebrow: 'VERBINDUNGEN STATT KOORDINATEN',
    title: 'Deine Leute. In deiner Nähe.',
    description: 'Entdecke Mitglieder nach Region. Dein Zuhause bleibt privat.',
  },
  garage: {
    eyebrow: 'DEINE AUTOMOTIVE IDENTITÄT',
    title: 'Jeder Puma erzählt eine Geschichte.',
    description: 'Gib deinem Fahrzeug einen Platz. Halte fest, was es besonders macht.',
  },
  POST: {
    eyebrow: 'AUS DER COMMUNITY',
    title: 'Was uns bewegt.',
    description: 'Neue Ideen, kleine Fortschritte und große Geschichten.',
  },
  TOPIC: {
    eyebrow: 'WISSEN TEILEN',
    title: 'Zusammen weiterkommen.',
    description: 'Fragen stellen. Erfahrungen austauschen. Lösungen finden.',
  },
  LISTING: {
    eyebrow: 'VON ENTHUSIASTEN. FÜR ENTHUSIASTEN.',
    title: 'Das nächste Puzzleteil.',
    description: 'Teile und Fahrzeuge aus der Community. Ohne integrierte Zahlungsabwicklung.',
  },
  WIKI: {
    eyebrow: 'WISSEN, DAS BLEIBT',
    title: 'Die Technik hinter der Ikone.',
    description: 'Quellenbasierte Artikel. Beiträge erscheinen erst nach redaktioneller Freigabe.',
  },
  EVENT: {
    eyebrow: 'RAUS AUS DER GARAGE',
    title: 'Gute Straßen. Gute Gesellschaft.',
    description: 'Treffen und Ausfahrten gemeinsam planen.',
  },
  BUILD: {
    eyebrow: 'GEBAUT MIT LEIDENSCHAFT',
    title: 'Von der Idee auf die Straße.',
    description: 'Dokumentiere deinen Fortschritt und teile dein nächstes Kapitel.',
  },
  saved: {
    eyebrow: 'DEINE SAMMLUNG',
    title: 'Für später aufgehoben.',
    description: 'Gespeicherte Beiträge, Projekte, Angebote und Termine.',
  },
  notifications: {
    eyebrow: 'AUF DEM LAUFENDEN',
    title: 'Deine Benachrichtigungen.',
    description: 'Kommentare und Moderationsmitteilungen an einem Ort.',
  },
  profile: {
    eyebrow: 'DEIN PUMAMAP',
    title: 'Du entscheidest, was sichtbar ist.',
    description: 'Profil, regionale Freigabe und Kontrolle über deine Daten.',
  },
  admin: {
    eyebrow: 'VERANTWORTUNG ÜBERNEHMEN',
    title: 'Moderationszentrale.',
    description: 'Meldungen prüfen, Wikiartikel freigeben und Maßnahmen nachvollziehen.',
  },
};
export const kinds: Kind[] = ['POST', 'TOPIC', 'LISTING', 'EVENT', 'WIKI', 'BUILD'];
