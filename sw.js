const CACHE = 'strengthos-v2';
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

self.addEventListener('fetch', e => {
  if(e.request.method!=='GET') return;
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
