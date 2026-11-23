// The preview bundle resolves platform-client to this read-only data source.
export { date, money } from '../src/components/platform-client';
export async function api(path: string, method = 'GET') {
  if (method === 'GET') {
    const url = new URL(path, 'https://preview.invalid/');
    switch (url.pathname) {
      case '/me':
        return null;
      case '/stats':
        return { members: 0, vehicles: 0, posts: 0, events: 0 };
      case '/regions':
      case '/vehicles':
      case '/members':
        return [];
      case '/contents':
        return url.searchParams.has('page') ? { items: [], hasMore: false } : [];
      case '/discover':
        return { results: [], hasMore: false };
    }
  }
  throw new Error('Diese Funktion benötigt den PumaMap-Server.');
}
