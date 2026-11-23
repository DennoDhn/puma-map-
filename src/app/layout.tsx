import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'PumaMap — Eine Ikone. Deine Community.',
  description:
    'Die Community für den Ford Puma Mk1. Menschen verbinden, Fahrzeuge bewahren und Projekte gemeinsam voranbringen.',
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#050609',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
