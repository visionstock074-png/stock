/* Vision Stock service worker: app shell works offline; Supabase API/auth are never cached. */
const V = 'vs-v1';
const SHELL = ['./', 'index.html', 'style.css', 'data.js', 'core.js', 'export.js', 'pages.js', 'main.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'logo.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())) });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())) });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (/supabase\.(co|in)$/.test(u.hostname)) return;                                   /* data + auth: network only */
  if (u.origin === location.origin) {                                                  /* our files: network first (updates arrive), cache fallback */
    e.respondWith(fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(V).then(x => x.put(r, c)) } return res })
      .catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
  } else if (/cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/.test(u.hostname)) {   /* libraries/fonts: cache first */
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { const c = res.clone(); caches.open(V).then(x => x.put(r, c)); return res })));
  }
});
