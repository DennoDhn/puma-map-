'use client';
import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
export type Member = {
  _count?: { vehicles: number; contents: number };
  contents?: { id: string; kind: string; title: string; createdAt: string }[];
  id: string;
  username: string;
  bio: string;
  region: { id: string; name: string; latitude: number; longitude: number } | null;
  vehicles: { id: string; name: string; variant: string; year: number; color: string }[];
};
export default function CommunityMap({
  members,
  onMember,
}: {
  members: Member[];
  onMember: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tiles, setTiles] = useState(false);
  useEffect(() => {
    let disposed = false;
    let map: import('leaflet').Map | undefined;
    void import('leaflet').then((L) => {
      if (disposed || !ref.current) return;
      map = L.map(ref.current, { scrollWheelZoom: false }).setView([51.5, 10], 6);
      if (tiles)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 10,
          minZoom: 4,
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
      const groups = Map.groupBy(members, (m) => m.region?.id ?? 'unknown');
      for (const group of groups.values()) {
        const region = group[0].region;
        if (!region) continue;
        const popup = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = region.name;
        popup.append(title);
        for (const member of group) {
          const button = document.createElement('button');
          button.textContent = `${member.username} · Profil öffnen`;
          button.className = 'map-profile';
          button.addEventListener('click', () => onMember(member.id));
          popup.append(button);
        }
        L.marker([region.latitude, region.longitude], {
          icon: L.divIcon({
            className: 'region-marker',
            html: `<span>${group.length}</span>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -22],
          }),
        })
          .addTo(map)
          .bindPopup(popup, { maxWidth: 280 });
      }
    });
    return () => {
      disposed = true;
      map?.remove();
    };
  }, [members, tiles, onMember]);
  return (
    <>
      <div className="map-consent">
        <label>
          <input type="checkbox" checked={tiles} onChange={(e) => setTiles(e.target.checked)} />{' '}
          Kartenhintergrund von OpenStreetMap laden
        </label>
        <p>
          Dabei wird deine IP-Adresse an den Kartenanbieter übermittelt. Regionale Marker
          funktionieren auch ohne Hintergrundkarte.
        </p>
      </div>
      <div className="map-canvas" ref={ref} aria-label="Mitgliederkarte mit ungefähren Regionen" />
      <p className="muted small">
        Pins markieren regionale Bezugspunkte, keine Wohnadressen. Mit Tab lassen sich Marker und
        Profile öffnen.
      </p>
    </>
  );
}
