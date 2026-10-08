/* Guarda o app no celular do aluno: depois da primeira abertura ele roda
   sem internet. Só a aula em vídeo (Vimeo) continua precisando de rede.   */
const CACHE = 'injecao-moto-v26';
const ESSENCIAL = [
  './',
  './index.html',
  './manifest.json',
  './icones/icone-192.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ESSENCIAL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())     /* um arquivo faltando nao impede instalar */
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;        /* Vimeo e afins: direto da rede */

  /* o que já está guardado responde na hora; o resto baixa e guarda */
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copia = res.clone();
          caches.open(CACHE).then(c => c.put(req, copia));
        }
        return res;
      }).catch(() => caches.match('./index.html'));   /* offline e sem cache */
    })
  );
});
