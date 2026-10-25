/* Next Up — offline-first service worker for Home Screen / GitHub Pages */
const CACHE = 'nextup-v3';

/** Paths relative to the SW scope (works in a site subfolder). */
const SHELL = [
  'index.html',
  'css/fonts.css',
  'css/styles.css',
  'js/app.js',
  'js/scheduler.js',
  'js/storage.js',
  'manifest.webmanifest',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/apple-touch-icon.png',
  'assets/icons/icon.svg',
  'assets/fonts/figtree-latin-400-normal.woff2',
  'assets/fonts/figtree-latin-500-normal.woff2',
  'assets/fonts/figtree-latin-600-normal.woff2',
  'assets/fonts/figtree-latin-700-normal.woff2',
  'assets/fonts/syne-latin-600-normal.woff2',
  'assets/fonts/syne-latin-700-normal.woff2',
  'assets/fonts/syne-latin-800-normal.woff2',
];

function toUrl(path) {
  return new URL(path, self.registration.scope).href;
}

async function precache() {
  const cache = await caches.open(CACHE);
  const urls = SHELL.map(toUrl);

  // Prefer addAll, but fall back per-file so one failure doesn't abort install
  try {
    await cache.addAll(urls);
  } catch {
    await Promise.all(
      urls.map(async (url) => {
        try {
          const res = await fetch(url, { cache: 'reload' });
          if (res.ok) await cache.put(url, res);
        } catch {
          /* ignore individual failures during install */
        }
      })
    );
  }

  // Same shell under common launch URLs (/, ./, index.html)
  const index =
    (await cache.match(toUrl('index.html'))) ||
    (await cache.match(toUrl('./index.html')));
  if (index) {
    const clones = [toUrl(''), toUrl('./'), toUrl('index.html')];
    await Promise.all(clones.map((u) => cache.put(u, index.clone())));
  }
}

async function cachedShell() {
  const cache = await caches.open(CACHE);
  return (
    (await cache.match(toUrl('index.html'), { ignoreSearch: true })) ||
    (await cache.match(toUrl('./'), { ignoreSearch: true })) ||
    (await cache.match(toUrl(''), { ignoreSearch: true }))
  );
}

async function matchAsset(request) {
  const cache = await caches.open(CACHE);
  const direct = await cache.match(request, { ignoreSearch: true });
  if (direct) return direct;

  // Try scope-relative pathname (helps when request URL differs slightly)
  try {
    const url = new URL(request.url);
    const scope = new URL(self.registration.scope);
    if (url.origin === scope.origin && url.pathname.startsWith(scope.pathname)) {
      const rel = url.pathname.slice(scope.pathname.length).replace(/^\//, '') || 'index.html';
      const byRel = await cache.match(toUrl(rel), { ignoreSearch: true });
      if (byRel) return byRel;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

function isNavigation(request) {
  if (request.mode === 'navigate') return true;
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html');
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Only handle same-origin app traffic (fonts are self-hosted)
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      // App shell: always prefer cache so Home Screen cold-starts work offline
      if (isNavigation(request)) {
        const shell = (await matchAsset(request)) || (await cachedShell());
        if (shell) {
          // Refresh in background when online; ignore failures offline
          event.waitUntil(
            fetch(request)
              .then(async (res) => {
                if (!res || !res.ok) return;
                const cache = await caches.open(CACHE);
                await cache.put(request, res.clone());
                await cache.put(toUrl('index.html'), res.clone());
              })
              .catch(() => {})
          );
          return shell;
        }
        try {
          return await fetch(request);
        } catch {
          return new Response(
            '<!doctype html><meta charset="utf-8"><title>Next Up</title><body style="font-family:system-ui;padding:2rem;background:#e7f1ea;color:#10231c"><h1>Next Up</h1><p>Open this app once while online so it can finish downloading for offline use.</p></body>',
            { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }
      }

      const cached = await matchAsset(request);
      if (cached) {
        event.waitUntil(
          fetch(request)
            .then(async (res) => {
              if (!res || !res.ok) return;
              const cache = await caches.open(CACHE);
              await cache.put(request, res.clone());
            })
            .catch(() => {})
        );
        return cached;
      }

      try {
        const fresh = await fetch(request);
        if (fresh && fresh.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(request, fresh.clone());
        }
        return fresh;
      } catch {
        return new Response('', { status: 503, statusText: 'Offline' });
      }
    })()
  );
});
