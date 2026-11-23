'use client';
import { useEffect } from 'react';

export function OfflineSupport() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js').catch(() => {
        // Browsers with storage restrictions can still use the online application.
      });
    }
  }, []);
  return null;
}
