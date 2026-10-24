/* service worker do app: mostra o aviso que chega por push e, no toque, leva ao app. Não guarda nada em cache. */
const RE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const RE_LINK = /^#(aula|licao|contato)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', ev => ev.waitUntil(self.clients.claim()));

// todo push vira notificação, também quando a mensagem chega vazia ou ilegível
self.addEventListener('push', ev => {
  let dados = null;
  try { dados = ev.data ? ev.data.json() : null; } catch (e) { dados = null; }
  const certo = !!dados && typeof dados === 'object';
  const titulo = certo && typeof dados.titulo === 'string' && dados.titulo ? dados.titulo : 'Forward Academy';
  const opcoes = { body: certo && typeof dados.corpo === 'string' ? dados.corpo : '', icon: 'icone-192.png' };
  if (certo && RE_ID.test(dados.id)) opcoes.data = { id: dados.id, link: RE_LINK.test(dados.link) ? dados.link : null };
  ev.waitUntil(self.registration.showNotification(titulo, opcoes));
});

// a aba do app que já está aberta recebe o aviso por mensagem; sem aba, abre o app com ?aviso=
self.addEventListener('notificationclick', ev => {
  ev.notification.close();
  const d = ev.notification.data || {};
  const id = RE_ID.test(d.id) ? d.id : null;
  const link = id && RE_LINK.test(d.link) ? d.link : null;
  const app = self.registration.scope;
  ev.waitUntil((async () => {
    const abas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const aba = abas.find(c => c.url.startsWith(app));
    if (aba) {
      if (id) aba.postMessage({ id, link });
      try { await aba.focus(); } catch (e) { /* o navegador só deixa focar a partir de um toque de verdade */ }
      return;
    }
    await self.clients.openWindow(id ? `${app}?aviso=${id}${link || ''}` : app);
  })());
});
