import type { Member } from './community-map';
export type Me = {
  id: string;
  username: string;
  email: string;
  bio: string;
  regionId: string | null;
  shareRegion: boolean;
  role: string;
};
export type Vehicle = {
  id: string;
  ownerId: string;
  name: string;
  variant: string;
  year: number;
  powerKw: number | null;
  mileage: number | null;
  color: string;
  description: string;
  visibility: 'PRIVATE' | 'PUBLIC';
  owner?: { username: string };
};
export type Kind = 'POST' | 'TOPIC' | 'LISTING' | 'EVENT' | 'WIKI' | 'BUILD';
export type Item = {
  locked?: boolean;
  pinned?: boolean;
  subscribed?: boolean;
  vehicleEntry?: {
    vehicleId: string;
    progress: number;
    category: string;
    vehicle: { name: string };
  } | null;
  id: string;
  authorId: string;
  kind: Kind;
  title: string;
  body: string;
  category: string;
  status: string;
  priceCents: number | null;
  region: string | null;
  startsAt: string | null;
  location: string | null;
  sourceUrl: string | null;
  createdAt: string;
  author: { id: string; username: string };
  _count: { comments: number; reactions: number; attendance: number };
  comments?: { id: string; body: string; author: { username: string }; createdAt: string }[];
  myReactions?: { type: string }[];
  attending?: boolean;
  revisions?: { id: string; title: string; body: string; createdAt: string }[];
};
export type Notice = { id: string; text: string; read: boolean; createdAt: string };
export type Admin = {
  reports: { id: string; reason: string; content: { id: string; title: string } }[];
  drafts: Item[];
  audit: { id: string; action: string; createdAt: string }[];
};
export type Screen =
  'discover' | 'home' | 'map' | 'garage' | Kind | 'saved' | 'notifications' | 'profile' | 'admin';
export type Modal =
  | {
      type: 'auth';
      mode: 'login' | 'register' | 'request-reset' | 'resend' | 'verify' | 'reset';
      token?: string;
    }
  | { type: 'vehicle'; vehicle?: Vehicle }
  | { type: 'editor'; item?: Item; kind: Kind }
  | { type: 'detail'; item: Item }
  | { type: 'member'; member: Member }
  | { type: 'report'; id: string }
  | { type: 'deleteAccount' }
  | { type: 'confirmDelete'; entity: 'vehicles' | 'contents'; id: string }
  | { type: 'legal' }
  | { type: 'status' }
  | null;
