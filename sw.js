// The placeholder below is stamped with the deploy commit SHA by
// scripts/stamp-sw.js at Netlify build time, so every deploy gets a distinct
// cache name without anyone needing to remember to bump it by hand.
const CACHE = 'strengthos-__BUILD_ID__';
const ASSETS = ['/', '/index.html', '/css/style.css', '/js/data.js', '/js/storage.js', '/js/api.js',
  '/js/profile.js', '/js/onboarding.js', '/js/exercise-picker.js', '/js/week-plan.js',
  '/js/workout-session.js', '/js/dashboard.js', '/js/progress.js', '/js/history.js',
  '/js/import-export.js', '/js/app.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(()=>{})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

// Network-first for our own app shell (HTML/CSS/JS) — cache-first here silently
// froze users on stale JS across multiple bug-fix deploys because CACHE only
// gets invalidated when this version string changes, which is easy to forget.
// Falling back to cache only on network failure keeps offline support while
// making "ship a fix" -> "user sees it" actually reliable on next load.
self.addEventListener('fetch', e => {
  if(e.request.method!=='GET') return;
  const url = new URL(e.request.url);
  const isAppShell = url.origin===self.location.origin &&
    (e.request.mode==='navigate' || /\.(js|css|html)$/.test(url.pathname) || url.pathname==='/');
  if(isAppShell){
    e.respondWith(
      fetch(e.request).then(res => {
        if(res&&res.status===200&&res.type==='basic'){
          const clone=res.clone();
          caches.open(CACHE).then(c=>c.put(e.request,clone));
        }
        return res;
      }).catch(()=>caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if(res&&res.status===200&&res.type==='basic'){
        const clone=res.clone();
        caches.open(CACHE).then(c=>c.put(e.request,clone));
      }
      return res;
    }))
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({type:'window'}).then(cs => {
      if(cs.length) return cs[0].focus();
      return clients.openWindow('/');
    })
  );
});
