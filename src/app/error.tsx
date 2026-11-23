'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-page">
      <h1>Hier hat es kurz gehakt.</h1>
      <p>Die Ansicht konnte nicht geladen werden. Bitte versuche es erneut.</p>
      <button onClick={reset}>Erneut laden</button>
    </main>
  );
}
