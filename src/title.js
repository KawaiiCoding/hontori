// Title / loading screen. Shows while art is prepared, then waits for a tap.
// The engine waits on H.title.ready before starting the intro or resuming a save.
(function () {
  var H = window.H = window.H || {};
  var CSS = [
    '.ht{position:absolute;inset:0;z-index:50;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;',
    'background:radial-gradient(ellipse at 50% 30%,#2a2a5e 0%,#14143a 55%,#07081a 100%);color:#fff4d6;font-family:Nunito,"M PLUS Rounded 1c",system-ui,sans-serif;',
    'transition:opacity .6s;overflow:hidden;-webkit-user-select:none;user-select:none}',
    '.ht.out{opacity:0;pointer-events:none}',
    '.ht-stars{position:absolute;inset:0}',
    '.ht-star{position:absolute;width:2px;height:2px;background:#fff;border-radius:1px;animation:htw 2.4s ease-in-out infinite}',
    '@keyframes htw{0%,100%{opacity:.2}50%{opacity:1}}',
    '.ht-logo{position:relative;font-size:clamp(44px,14vmin,84px);font-weight:900;letter-spacing:2px;line-height:1;',
    'background:linear-gradient(180deg,#fff4d6 10%,#ffc56b 55%,#ff8a3c 100%);-webkit-background-clip:text;background-clip:text;color:transparent;',
    'filter:drop-shadow(0 4px 0 #5a2a10) drop-shadow(0 0 18px rgba(255,150,60,.35))}',
    '.ht-sub{position:relative;font-size:clamp(14px,4vmin,18px);font-weight:700;opacity:.8;margin-top:-8px;letter-spacing:1px}',
    '.ht-fox{position:relative;width:144px;height:144px;image-rendering:pixelated;animation:htb 2.6s ease-in-out infinite}',
    '@keyframes htb{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}',
    '.ht-bar{position:relative;width:min(60%,260px);height:10px;border-radius:6px;background:rgba(255,255,255,.12);overflow:hidden;border:2px solid rgba(255,255,255,.18)}',
    '.ht-bar b{display:block;height:100%;width:0;background:linear-gradient(90deg,#ff8a3c,#ffc56b);transition:width .25s}',
    '.ht-btn{position:relative;min-width:200px;justify-content:center;font-size:20px;animation:htp 1.6s ease-in-out infinite}',
    '@keyframes htp{0%,100%{filter:brightness(1)}50%{filter:brightness(1.12)}}',
    '.ht-btn[hidden]{display:none}',
    '.ht-hint{position:relative;font-size:13px;opacity:.55}'
  ].join('');

  if (H.noTitle) return; // debug URLs skip the title
  var resolveReady, overlay;
  var ready = new Promise(function (r) { resolveReady = r; });
  H.title = { ready: ready };

  function mk(tag, cls, parent, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; parent.appendChild(e); return e; }

  function init() {
    var root = document.getElementById('root');
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    overlay = mk('div', 'ht', root);
    var stars = mk('div', 'ht-stars', overlay);
    for (var i = 0; i < 60; i++) {
      var s = mk('div', 'ht-star', stars);
      s.style.left = (Math.random() * 100) + '%'; s.style.top = (Math.random() * 70) + '%';
      s.style.animationDelay = (Math.random() * 2.4) + 's'; s.style.opacity = Math.random();
    }
    var fox = mk('canvas', 'ht-fox', overlay); fox.width = fox.height = 96;
    mk('div', 'ht-logo', overlay, 'Hontori');
    mk('div', 'ht-sub', overlay, 'The veil is thin tonight');
    var bar = mk('div', 'ht-bar', overlay), fill = mk('b', '', bar);
    var btn = H.kit ? H.kit.btn(overlay, { icon: 'wand', label: ' ', kind: 'gold' }) : mk('button', '', overlay); btn.classList.add('ht-btn'); btn.hidden = true;
    var btnLabel = btn.querySelector('.t span') || btn;
    var hint = mk('div', 'ht-hint', overlay, 'Preparing the world...');

    // animate the fox on the title
    var env = { t: 0, time: 22, weather: 'clear', wind: 0.2, indoor: true }, live = true;
    function anim(ms) {
      if (!live) return;
      env.t = ms / 1000;
      var g = fox.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 96, 96); g.imageSmoothingEnabled = false;
      try { g.scale(2, 2); H.spirits.draw(g, 'hontori', 24, 24, env, { scale: 1, sit: true }); } catch (e) {}
      requestAnimationFrame(anim);
    }
    requestAnimationFrame(anim);

    // warm up: pre-render art caches in small steps so the bar moves and the first frame is smooth
    var jobs = [];
    var k = H.renderScale || 2;
    if (H.spirits) H.spirits.list.forEach(function (s) { jobs.push(function () { try { H.spirits.portrait(s.key); } catch (e) {} }); });
    if (H.chars) ['kid', 'mom', 'dad'].forEach(function (c) { jobs.push(function () { try { H.chars.portrait(c); } catch (e) {} }); });
    jobs.push(function () { try { H.icons && H.icons.names.forEach(function (n) { H.icons.url(n, 2); }); } catch (e) {} });
    var n = jobs.length, done = 0, start = performance.now();
    function step() {
      var t0 = performance.now();
      while (jobs.length && performance.now() - t0 < 12) { jobs.shift()(); done++; }
      // never flash past: show the bar for at least ~1.2s
      var p = Math.min(done / Math.max(1, n), (performance.now() - start) / 1200);
      fill.style.width = Math.round(p * 100) + '%';
      if (jobs.length || p < 1) return requestAnimationFrame(step);
      var hasSave = false; try { var sv = JSON.parse(localStorage.getItem('hontori.save.v1') || 'null'); hasSave = !!(sv && sv.state && sv.state.intro); } catch (e) {}
      bar.style.display = 'none';
      btnLabel.textContent = hasSave ? 'Continue' : 'Start';
      btn.hidden = false;
      hint.textContent = hasSave ? 'Your journey is saved on this device' : 'Sound on for the full magic';
    }
    requestAnimationFrame(step);

    function go(e) {
      if (btn.hidden) return;
      if (e) e.preventDefault();
      try { H.audio && H.audio.unlock && H.audio.unlock(); } catch (_) {} // start sound inside the tap (required on iPhone)
      overlay.classList.add('out');
      setTimeout(function () { live = false; overlay.remove(); }, 650);
      resolveReady();
    }
    btn.addEventListener('click', go);
    window.addEventListener('keydown', function onKey(e) { if (!btn.hidden && (e.key === ' ' || e.key === 'Enter')) { window.removeEventListener('keydown', onKey); go(e); } });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
