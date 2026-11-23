import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'PumaMap – The Mk1 Collective',
    short_name: 'PumaMap',
    lang: 'de',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#050609',
    theme_color: '#050609',
    icons: [192, 512].map((size) => ({
      src: `/pumamap-${size}.png`,
      sizes: `${size}x${size}`,
      type: 'image/png',
      purpose: 'any',
    })),
  };
}
