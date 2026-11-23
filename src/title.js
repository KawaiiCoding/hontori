// Title / loading screen. Shows while the world scripts and the first map's sheets arrive, then waits for a tap.
// The engine waits on H.title.ready before starting the intro or resuming a save.
// It paints only what it shows; the party's portraits are warmed up in idle moments while the journeys are on screen.
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
    '.ht-fox{position:relative;width:144px;height:144px;image-rendering:pixelated;animation:htb 2.6s ease-in-out infinite;opacity:0;transition:opacity .3s}','.ht-fox.on{opacity:1}',
    '@keyframes htb{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}',
    '.ht-bar{position:relative;width:min(60%,260px);height:10px;border-radius:6px;background:rgba(255,255,255,.12);overflow:hidden;border:2px solid rgba(255,255,255,.18)}',
    '.ht-bar b{display:block;height:100%;width:0;background:linear-gradient(90deg,#ff8a3c,#ffc56b);transition:width .25s}',
    '.ht-btn{position:relative;min-width:200px;justify-content:center;font-size:20px;animation:htp 1.6s ease-in-out infinite}',
    '@keyframes htp{0%,100%{filter:brightness(1)}50%{filter:brightness(1.12)}}',
    '.ht-btn[hidden]{display:none}',
    '.ht-ctl{position:relative;z-index:3;margin-top:16px;text-align:center;color:#f4f1e8}.ht-ctl[hidden]{display:none}',
    '.ht-ctl-q{font-size:14px;font-weight:900;margin-bottom:8px;opacity:.9}',
    '.ht-seg{display:flex;gap:8px;justify-content:center}',
    '.ht-opt{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:130px;padding:9px 12px;border-radius:14px;border:2px solid rgba(255,255,255,.2);background:rgba(20,22,48,.75);color:#fff;font:inherit;cursor:pointer}',
    '.ht-opt b{font-size:15px;font-weight:900}.ht-opt small{font-size:11px;font-weight:700;opacity:.7}',
    '.ht-opt.on{border-color:#ffd98a;background:rgba(255,217,138,.18);box-shadow:0 0 14px rgba(255,217,138,.35)}',
    '.ht-ctl-n{margin-top:8px;font-size:12px;font-weight:700;opacity:.6}',
    '.ht-hint{position:relative;font-size:13px;opacity:.55}',
    '.ht-slots{position:relative;z-index:3;display:flex;flex-direction:column;gap:8px;width:min(86%,320px)}.ht-slots[hidden]{display:none}',
    '.ht-slot{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:14px;border:2px solid rgba(255,255,255,.2);background:rgba(20,22,48,.78);color:#fff;font:inherit;cursor:pointer;text-align:left}',
    '.ht-slot:active{transform:translateY(1px)}.ht-slot.last{border-color:#ffd98a;box-shadow:0 0 14px rgba(255,217,138,.3)}',
    '.ht-slot .n{flex:none;width:30px;height:30px;border-radius:9px;display:grid;place-items:center;font-weight:900;font-size:15px;background:linear-gradient(180deg,#ffd98a,#e0a040);color:#3a2410;box-shadow:inset 0 -2px 0 rgba(0,0,0,.25)}',
    '.ht-slot.empty .n{background:rgba(255,255,255,.12);color:#fff}',
    '.ht-slot .d{display:flex;flex-direction:column;min-width:0}.ht-slot b{font-size:15px;font-weight:900}.ht-slot small{font-size:11px;font-weight:700;opacity:.72;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
  ].join('');

  /* debug URLs skip the title */
  if (H.noTitle) return;
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
    // how to move: chosen right here, changeable later in the menu
    var ctl = mk('div', 'ht-ctl', overlay); ctl.hidden = true;
    mk('div', 'ht-ctl-q', ctl, 'How do you want to move?');
    var seg = mk('div', 'ht-seg', ctl), cur = null;
    try { cur = localStorage.getItem('hontori.controls'); } catch (e) {}
    if (!cur) cur = 'stick';
    [['stick', 'Joystick', 'Stick, A and B'], ['tap', 'Tap to move', 'Tap, double tap to run']].forEach(function (o) {
      var b = mk('button', 'ht-opt', seg); mk('b', '', b, o[1]); mk('small', '', b, o[2]);
      b.dataset.m = o[0]; b.classList.toggle('on', cur === o[0]);
      b.addEventListener('click', function (e) { e.stopPropagation(); cur = o[0]; [].forEach.call(seg.children, function (x) { x.classList.toggle('on', x.dataset.m === cur); }); });
    });
    mk('div', 'ht-ctl-n', ctl, 'You can change this later in the menu.');
    var slots = mk('div', 'ht-slots', overlay); slots.hidden = true;
    overlay.insertBefore(slots, ctl);
    var hint = mk('div', 'ht-hint', overlay, 'Preparing the world...');
    function slotKey(n) { return n === 1 ? 'hontori.save.v1' : 'hontori.save.v1.s' + n; }
    function slotInfo(n) {
      try { var sv = JSON.parse(localStorage.getItem(slotKey(n)) || 'null'); if (!sv || !sv.state || !sv.state.intro) return null;
        var lead = (sv.state.party || [])[0], m = H.maps && H.maps[sv.map];
        var place = m && m.name ? m.name : sv.map, nm = lead ? (lead.nick || ((H.spirits && (H.spirits.list || []).filter(function (q) { return q.key === lead.key; })[0] || {}).name) || 'Hontori') : '';
        return (lead ? nm + ' Lv ' + (lead.level || 1) + '  ·  ' : '') + place + '  ·  ' + (sv.state.party || []).length + ' hontori';
      } catch (e) { return null; } }
    var canGo = false, curSlot = 1; try { curSlot = +localStorage.getItem('hontori.slot') || 1; } catch (e) {}
    function pick(n) {
      try { localStorage.setItem('hontori.slot', String(n)); } catch (e) {}
      if (n === curSlot) return go();
      // another journey: reload into it and skip this screen
      try { localStorage.setItem('hontori.controls', cur); sessionStorage.setItem('hontori.autoplay', '1'); } catch (e) {}
      location.reload();
    }
    function buildSlots() {
      slots.innerHTML = '';
      [1, 2, 3].forEach(function (n) {
        var info = slotInfo(n), b = mk('button', 'ht-slot' + (info ? '' : ' empty') + (n === curSlot && info ? ' last' : ''), slots);
        mk('span', 'n', b, String(n)); var d = mk('span', 'd', b);
        mk('b', '', d, info ? 'Journey ' + n : 'New journey'); mk('small', '', d, info || 'An empty page, waiting');
        b.addEventListener('click', function (e) { e.stopPropagation(); pick(n); });
      });
    }

    // animate the fox on the title; it fades in the first time it can be painted
    var env = { t: 0, time: 22, weather: 'clear', wind: 0.2, indoor: true }, live = true, foxOn = false;
    function anim(ms) {
      if (!live) return;
      requestAnimationFrame(anim);
      if (!H.spirits || !H.spirits.draw) return;
      env.t = ms / 1000;
      var g = fox.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 96, 96); g.imageSmoothingEnabled = false;
      try { g.scale(2, 2); H.spirits.draw(g, 'hontori', 24, 24, env, { scale: 1, sit: true }); if (!foxOn) { foxOn = true; fox.classList.add('on'); } } catch (e) {}
    }
    requestAnimationFrame(anim);

    /* The title paints only itself. The bar runs while the world scripts arrive (src/loader.js) and the
       sprite sheets of the first map are fetched; then the journeys appear. What comes next is warmed up
       afterwards, in idle moments, and stops the moment a journey is tapped. */
    var start = performance.now(), worldAt = 0, sheetsIn = false, tapped = false;
    function save() { try { var sv = JSON.parse(localStorage.getItem(slotKey(curSlot)) || 'null'); return sv && sv.state && sv.state.intro ? sv : null; } catch (e) { return null; } }
    function worldHere() {
      if (worldAt) return;
      worldAt = performance.now();
      /* the sheets the first map draws from: asked for now, waited for at most a second */
      var waits = [];
      try {
        var sv = save(), m = H.maps && H.maps[(sv && sv.map) || 'home'];
        if (H.sheets && H.sheets.ready) { waits.push(H.sheets.ready(m && m.tileset === 'outdoor' ? 'outdoor' : 'indoor')); waits.push(H.sheets.ready('people')); }
      } catch (e) {}
      Promise.all(waits).then(function () { sheetsIn = true; }, function () { sheetsIn = true; });
    }
    if (H.loader) H.loader.ready('world').then(worldHere);
    else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', worldHere);
    else worldHere();

    function step() {
      var now = performance.now(), open = worldAt && (sheetsIn || now - worldAt > 1000);
      // never flash past: show the bar for at least half a second
      var p = Math.min((now - start) / 500, open ? 1 : 0.9);
      fill.style.width = Math.round(p * 100) + '%';
      if (p < 1) return requestAnimationFrame(step);
      var hasSave = !!save();
      bar.style.display = 'none';
      var auto = false; try { auto = sessionStorage.getItem('hontori.autoplay') === '1'; sessionStorage.removeItem('hontori.autoplay'); } catch (e) {}
      btnLabel.textContent = hasSave ? 'Continue' : 'Start';
      canGo = true; if (auto) return go();
      buildSlots(); slots.hidden = false; ctl.hidden = false;
      hint.textContent = 'Sound on for the full magic';
      warmUp();
    }
    requestAnimationFrame(step);

    /* one small job per idle moment: the portraits of the party that is about to play */
    function warmUp() {
      var jobs = [], sv = save();
      ((sv && sv.state.party) || [{ key: 'hontori', stage: 1 }]).forEach(function (m) {
        if (m && m.key) jobs.push(function () { H.spirits.portrait(m.key, m.stage || 1); });
      });
      jobs.push(function () { H.chars.portrait('kid'); });
      function next() {
        if (tapped || !jobs.length) return;
        try { jobs.shift()(); } catch (e) {}
        if (jobs.length) later(next);
      }
      function later(fn) { if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(fn, { timeout: 800 }); else setTimeout(fn, 60); }
      later(next);
    }

    function go(e) {
      if (!canGo) return; canGo = false; tapped = true;
      if (e) e.preventDefault();
      try { localStorage.setItem('hontori.controls', cur); if (H.ui && H.ui.setControls) H.ui.setControls(cur); } catch (_) {}
      /* start sound inside the tap (required on iPhone) */
      try { H.audio && H.audio.unlock && H.audio.unlock(); } catch (_) {}
      /* the last background scripts are normally in by now; if not, they are fetched at once and the game starts with them */
      var enter = function () {
        overlay.classList.add('out');
        setTimeout(function () { live = false; overlay.remove(); }, 650);
        resolveReady();
      };
      if (H.loader) { try { H.loader.hurry(); } catch (_) {} H.loader.whenAll().then(enter, enter); } else enter();
    }
    btn.addEventListener('click', go);
    window.addEventListener('keydown', function onKey(e) { if (!slots.hidden && (e.key === ' ' || e.key === 'Enter')) { window.removeEventListener('keydown', onKey); e.preventDefault(); pick(curSlot); } });
  }

  /* the page's root is already there when this script runs, so the title appears before the world scripts are read */
  if (document.getElementById('root')) init(); else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
