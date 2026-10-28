// Guarda o app no aparelho para funcionar sem internet.
// Ao publicar uma versão nova, mude o número abaixo para os aparelhos baixarem a atualização.
const VERSAO = "diario-v1";
const ARQUIVOS = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Página: tenta a rede primeiro (para pegar atualizações) e usa a cópia guardada se estiver sem internet.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSAO).then(x => x.put("index.html", c)); return r; })
      .catch(() => caches.match("index.html")));
    return;
  }
  // Fontes e bibliotecas (PDF, leitura de .zip): guarda depois do primeiro uso.
  const externo = /fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com/.test(url.hostname);
  if (url.origin === location.origin || externo) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok || r.type === "opaque") { const c = r.clone(); caches.open(VERSAO).then(x => x.put(req, c)); }
      return r;
    })));
  }
});
