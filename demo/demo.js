// Демо клиента для сайта: подменяет приложение (Swift) и изображает подключение.
// Настоящего VPN тут нет. Параметры адреса: ?theme=night&auto=on&tab=settings
(function () {
  const q = new URLSearchParams(location.search);
  const store = {
    get() { try { return JSON.parse(localStorage.getItem('demoSettings') || '{}'); } catch (e) { return {}; } },
    set(v) { try { localStorage.setItem('demoSettings', JSON.stringify(v)); } catch (e) {} },
  };
  const settings = store.get();
  // Для скриншотов: анимации проигрываются в 20 раз быстрее
  if (q.has('still')) window.addEventListener('load', () => { try { gsap.globalTimeline.timeScale(20); } catch (e) {} });
  if (q.get('theme')) settings.theme = q.get('theme');
  if (q.get('anim')) settings.anim = q.get('anim');
  if (q.has('mute') || window.top !== window) settings.muted = settings.muted ?? q.has('mute');

  const S = {
    type: 'state', status: 'off', hasKey: true, hasLink: true,
    title: '⚔️ Навайбкодил ВПН',
    announce: '🎬 Это демо на сайте: кнопки работают, но настоящего подключения нет',
    used: 3.4 * 1073741824, total: 0, expire: 0,
    updated: Math.floor(Date.now() / 1000), settings,
  };
  let statsTimer = null, since = 0, down = 0, up = 0;
  const emit = (m) => setTimeout(() => window.onNative && window.onNative(m), 0);
  const push = () => emit({ ...S, settings: { ...settings } });

  function goOn(withResult) {
    S.status = 'on'; S.country = 'NL'; S.ping = undefined;
    since = Math.floor(Date.now() / 1000); down = up = 0;
    push();
    if (withResult) emit({ type: 'result', op: 'connect', ok: true });
    clearInterval(statsTimer);
    statsTimer = setInterval(() => {
      const d = Math.round(150000 + Math.random() * 2600000), u = Math.round(8000 + Math.random() * 90000);
      down += d; up += u;
      emit({ type: 'stats', down: d, up: u, totalDown: down, totalUp: up, since });
    }, 1000);
    setTimeout(() => { S.ping = 48 + Math.round(Math.random() * 30); emit({ type: 'ping', ms: S.ping }); }, 1300);
  }
  function goOff() {
    clearInterval(statsTimer);
    S.status = 'off'; S.country = undefined;
    push();
    emit({ type: 'result', op: 'disconnect', ok: true });
  }

  window.webkit = { messageHandlers: { native: { postMessage(m) {
    switch (m.cmd) {
      case 'init':
        push();
        if (q.get('auto') === 'on') setTimeout(() => goOn(false), 50);
        if (q.get('tab')) setTimeout(() => { const b = document.querySelector(`nav [data-tab="${q.get('tab')}"]`); if (b) b.click(); }, 400);
        break;
      case 'connect':
      case 'toggle':
        if (S.status !== 'off') break;
        S.status = 'connecting'; push();
        setTimeout(() => goOn(true), 900 + Math.random() * 600);
        break;
      case 'disconnect':
        S.status = 'disconnecting'; push();
        setTimeout(goOff, 400);
        break;
      case 'saveSettings': {
        const old = settings.route;
        Object.assign(settings, m.settings); store.set(settings);
        if (S.status === 'on' && old !== settings.route) {
          S.status = 'connecting'; push();
          setTimeout(() => { goOn(false); emit({ type: 'result', op: 'reconnect', ok: true, route: settings.route }); }, 600);
        }
        break;
      }
      case 'setKey': case 'paste':
        emit({ type: 'result', op: 'setKey', ok: false, error: 'В демо ключ не нужен: он уже «добыт». В настоящем приложении сюда вставляется ссылка из бота.' });
        break;
      case 'refresh':
        S.updated = Math.floor(Date.now() / 1000); push();
        emit({ type: 'result', op: 'refresh', ok: true });
        break;
      case 'forget': break;
      case 'openBot': window.open('https://t.me/navaibevpn_bot?start=site', '_blank', 'noopener'); break;
    }
  } } } };
})();
