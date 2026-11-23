import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="error-page">
      <h1>Diese Ausfahrt gibt es nicht.</h1>
      <Link href="/">Zurück zu PumaMap</Link>
    </main>
  );
}
