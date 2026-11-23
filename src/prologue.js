window.H = window.H || {};
// Prologue: a short picture story before a new journey, made from the game's own characters and hontori.
// Five panels, one line each: what the world was, what was lost, and what the player is here to do.
// API: H.prologue.play() -> Promise (resolves when it ends or is skipped)
(function () {
  'use strict';
  var H = window.H;
  var CSS = [
    '.hpr{position:absolute;inset:0;z-index:60;background:#07081a;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;',
    'font-family:Nunito,"M PLUS Rounded 1c",system-ui,sans-serif;color:#fff4d6;opacity:0;transition:opacity .6s;-webkit-user-select:none;user-select:none}',
    '.hpr.on{opacity:1}',
    '.hpr-frame{position:relative;width:min(92%,460px);aspect-ratio:8/5;border-radius:14px;overflow:hidden;border:3px solid #3a2e5a;box-shadow:0 0 0 2px #14143a,0 10px 30px #000}',
    '.hpr-frame canvas{width:100%;height:100%;display:block;image-rendering:pixelated;image-rendering:crisp-edges}',
    '.hpr-txt{width:min(88%,430px);min-height:74px;text-align:center;font-size:clamp(17px,4.6vmin,21px);font-weight:800;line-height:1.35;transition:opacity .35s}',
    '.hpr-txt.gold{color:#ffd98a}',
    '.hpr-dots{display:flex;gap:7px}.hpr-dots i{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.2)}.hpr-dots i.on{background:#ffd98a}',
    '.hpr-skip{position:absolute;right:14px;top:calc(env(safe-area-inset-top,0px) + 14px);padding:7px 14px;border-radius:12px;border:2px solid rgba(255,255,255,.22);background:rgba(20,22,48,.8);color:#fff;font:800 13px Nunito,system-ui,sans-serif;cursor:pointer}',
    '.hpr-tap{font-size:13px;font-weight:700;opacity:.55;animation:hprp 1.6s ease-in-out infinite}@keyframes hprp{0%,100%{opacity:.3}50%{opacity:.7}}'
  ].join('');
  var W = 192, HT = 120;

  function R(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  // a soft pixel hill line
  function hills(g, base, amp, c, seed) { g.fillStyle = c; for (var x = 0; x < W; x += 2) { var y = base + Math.sin(x * 0.045 + seed) * amp + Math.sin(x * 0.11 + seed * 2) * amp * 0.4; g.fillRect(x, Math.round(y), 2, HT - Math.round(y)); } }
  function sky(g, cols) { var h = Math.ceil(HT / cols.length); cols.forEach(function (c, i) { R(g, 0, i * h, W, h + 1, c); }); }
  function stars(g, t) { for (var i = 0; i < 40; i++) { var x = (i * 53) % W, y = (i * 29) % 62; g.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(t * 1.3 + i)); R(g, x, y, 1, 1, '#ffffff'); } g.globalAlpha = 1; }
  // spirits are drawn on a small side canvas first, so they can fade as a whole
  var side = null;
  function spirit(g, key, x, y, env, a, sit) {
    try {
      if (a == null || a >= 1) return H.spirits.draw(g, key, x, y, env, { scale: 1, sit: !!sit });
      if (!side) { side = document.createElement('canvas'); side.width = side.height = 72; }
      var sg = side.getContext('2d'); sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, 72, 72);
      H.spirits.draw(sg, key, 36, 50, env, { scale: 1, sit: !!sit });
      g.save(); g.globalAlpha = a; g.drawImage(side, Math.round(x) - 36, Math.round(y) - 50); g.restore();
    } catch (e) {}
  }
  function person(g, key, x, y, dir, env, seed) { try { H.chars.draw(g, key, x, y, dir || 0, 0, env, { npc: true, seed: seed || 0.3 }); } catch (e) {} }
  function meadow(g, grey) {
    sky(g, grey ? ['#8f96a6', '#a2a8b6', '#b6bbc6', '#c6cad2'] : ['#6fb6f0', '#8cc8f4', '#aadaf8', '#c8eafc']);
    hills(g, 62, 7, grey ? '#7f8a86' : '#7cc470', 1); hills(g, 74, 5, grey ? '#6f7a76' : '#5cae58', 3);
    R(g, 0, 88, W, 32, grey ? '#66706c' : '#4c9a4c');
    for (var i = 0; i < 26; i++) R(g, (i * 37) % W, 90 + (i * 13) % 26, 1, 2, grey ? '#7f8a86' : (i % 4 ? '#6cc060' : '#ffe27a'));
  }
  // the closed grey eye of the old law; k = how far it has closed (0 open .. 1 closed)
  function eye(g, cx, cy, k) {
    var w = 46, h = Math.max(1, Math.round(16 * (1 - k)));
    g.fillStyle = '#3a3a46'; g.beginPath(); g.ellipse(cx, cy, w / 2 + 2, 11, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#d8d8e0'; g.beginPath(); g.ellipse(cx, cy, w / 2, Math.max(1, h / 2), 0, 0, Math.PI * 2); g.fill();
    if (k < 0.85) { g.fillStyle = '#5a5a6a'; g.beginPath(); g.arc(cx, cy, Math.min(6, h / 2), 0, Math.PI * 2); g.fill(); }
    if (k > 0.6) { R(g, cx - w / 2, cy, w, 1, '#3a3a46'); for (var i = -2; i <= 2; i++) R(g, cx + i * 8, cy + 2, 1, 3, '#3a3a46'); }
  }
  function house(g, x, y, lit) {
    R(g, x, y, 44, 30, '#2a2440'); R(g, x - 4, y - 4, 52, 6, '#3a2e5a');
    for (var i = 0; i < 12; i++) R(g, x - 2 + i * 2, y - 6 - i, 48 - i * 4, 2, '#3a2e5a');
    R(g, x + 30, y - 26, 8, 14, '#4a3a5a'); R(g, x + 29, y - 28, 10, 3, '#5a4a6a');
    R(g, x + 8, y + 8, 10, 10, lit ? '#ffd98a' : '#1a1830'); R(g, x + 12, y + 8, 1, 10, '#2a2440'); R(g, x + 8, y + 12, 10, 1, '#2a2440');
    R(g, x + 26, y + 12, 9, 18, '#1a1830');
  }

  var PANELS = [
    { text: 'Once, people and spirits shared one world.', draw: function (g, env) {
      meadow(g, false);
      person(g, 'elder', 34, 104, 0, env, 0.2); person(g, 'kid', 96, 108, 0, env, 0.5); person(g, 'tansy', 150, 104, 0, env, 0.8);
      spirit(g, 'grass', 62, 100, env, 1); spirit(g, 'water', 124, 102, env, 1); spirit(g, 'wind', 78, 60, env, 1); spirit(g, 'light', 132, 56, env, 1);
    } },
    { text: 'Then an old law called every spirit a bad spirit. A veil fell over every eye.', draw: function (g, env, k) {
      meadow(g, true);
      var a = Math.max(0.12, 1 - k * 1.3);
      person(g, 'elder', 34, 104, 0, env, 0.2); person(g, 'kid', 96, 108, 0, env, 0.5); person(g, 'tansy', 150, 104, 0, env, 0.8);
      spirit(g, 'grass', 62, 100, env, a); spirit(g, 'water', 124, 102, env, a); spirit(g, 'wind', 78, 60, env, a); spirit(g, 'light', 132, 56, env, a);
      eye(g, 96, 24, Math.min(1, k * 1.5));
    } },
    { text: 'The spirits are still here. Almost no one can see them.', draw: function (g, env) {
      meadow(g, true);
      person(g, 'baker', 40, 104, 3, env, 0.2); person(g, 'farmer', 150, 106, 2, env, 0.7);
      spirit(g, 'grass', 70, 100, env, 0.16); spirit(g, 'water', 118, 102, env, 0.16); spirit(g, 'wind', 96, 60, env, 0.16);
    } },
    { text: 'Tonight, one small spirit is looking for someone who can.', draw: function (g, env, k) {
      sky(g, ['#0c0e2a', '#14143a', '#1c1c4a', '#24245a']); stars(g, env.t);
      g.fillStyle = '#fff4d6'; g.beginPath(); g.arc(160, 22, 9, 0, Math.PI * 2); g.fill();
      hills(g, 84, 4, '#101028', 2);
      house(g, 22, 82, false); house(g, 118, 86, true);
      R(g, 0, 112, W, 8, '#0c0c20');
      var x = 20 + Math.min(1, k) * 118, y = 66 - Math.sin(Math.min(1, k) * Math.PI) * 18 + (k >= 1 ? 0 : 0);
      g.fillStyle = 'rgba(255,170,80,.22)'; g.beginPath(); g.arc(x, y - 6, 16, 0, Math.PI * 2); g.fill();
      spirit(g, 'hontori', x, y, env, 1);
    } },
    { gold: true, text: 'That someone is you. Lift the veil. Let them be seen.', draw: function (g, env, k) {
      sky(g, ['#1c1c4a', '#2a2a5e', '#3a3470', '#4a3a78']); stars(g, env.t);
      R(g, 0, 96, W, 24, '#2a2440'); R(g, 0, 96, W, 2, '#3a2e5a');
      person(g, 'kid', 78, 110, 0, env, 0.5); spirit(g, 'hontori', 116, 104, env, 1, true);
      // the V draws itself in gold
      var kk = Math.min(1, k * 1.2), pts = [[70, 22], [96, 62], [122, 22]], n = 40;
      for (var i = 0; i <= n * kk; i++) { var t = i / n, a = t < 0.5 ? pts[0] : pts[1], b = t < 0.5 ? pts[1] : pts[2], u = t < 0.5 ? t * 2 : (t - 0.5) * 2;
        var px = a[0] + (b[0] - a[0]) * u, py = a[1] + (b[1] - a[1]) * u;
        g.fillStyle = 'rgba(255,217,138,.25)'; g.fillRect(Math.round(px) - 2, Math.round(py) - 2, 5, 5); g.fillStyle = '#ffd98a'; g.fillRect(Math.round(px) - 1, Math.round(py) - 1, 3, 3); g.fillStyle = '#fff6d8'; g.fillRect(Math.round(px), Math.round(py), 1, 1); }
    } }
  ];

  function play() {
    return new Promise(function (resolve) {
      var root = document.getElementById('root'); if (!root || !H.spirits || !H.chars) return resolve();
      var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
      var el = document.createElement('div'); el.className = 'hpr';
      var frame = document.createElement('div'); frame.className = 'hpr-frame'; var cv = document.createElement('canvas'); cv.width = W * 3; cv.height = HT * 3; frame.appendChild(cv);
      var txt = document.createElement('div'); txt.className = 'hpr-txt';
      var dots = document.createElement('div'); dots.className = 'hpr-dots'; PANELS.forEach(function () { dots.appendChild(document.createElement('i')); });
      var tap = document.createElement('div'); tap.className = 'hpr-tap'; tap.textContent = 'Tap to continue';
      var skip = document.createElement('button'); skip.className = 'hpr-skip'; skip.textContent = 'Skip';
      el.appendChild(frame); el.appendChild(txt); el.appendChild(dots); el.appendChild(tap); el.appendChild(skip); root.appendChild(el);
      var g = cv.getContext('2d'), idx = -1, t0 = 0, live = true, fade = 1, env = { t: 0, time: 12, weather: 'clear', wind: 0.2, indoor: false };
      function show(i) {
        idx = i; t0 = performance.now(); fade = 0;
        var p = PANELS[i]; txt.style.opacity = 0;
        setTimeout(function () { txt.textContent = p.text; txt.classList.toggle('gold', !!p.gold); txt.style.opacity = 1; }, 250);
        [].forEach.call(dots.children, function (d, k) { d.classList.toggle('on', k <= i); });
        tap.textContent = i === PANELS.length - 1 ? 'Tap to begin' : 'Tap to continue';
        try { H.audio && H.audio.sfx && H.audio.sfx(i === PANELS.length - 1 ? 'wand' : 'page'); } catch (e) {}
      }
      function end() { if (!live) return; live = false; el.classList.remove('on'); setTimeout(function () { el.remove(); resolve(); }, 600); }
      function next() { if (performance.now() - t0 < 500) return; if (idx >= PANELS.length - 1) end(); else show(idx + 1); }
      function loop(now) {
        if (!live) return;
        env.t = now / 1000; env.time = idx >= 3 ? 22 : 12;
        var k = (now - t0) / 2600; fade = Math.min(1, fade + 0.06);
        g.setTransform(3, 0, 0, 3, 0, 0); g.imageSmoothingEnabled = false; g.clearRect(0, 0, W, HT);
        try { PANELS[idx].draw(g, env, k); } catch (e) { console.warn(e); }
        if (fade < 1) { g.fillStyle = 'rgba(7,8,26,' + (1 - fade) + ')'; g.fillRect(0, 0, W, HT); }
        requestAnimationFrame(loop);
      }
      el.addEventListener('click', function (e) { if (e.target === skip) return; next(); });
      skip.addEventListener('click', function (e) { e.stopPropagation(); end(); });
      var onKey = function (e) { if (!live) return window.removeEventListener('keydown', onKey, true); if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); next(); } else if (e.key === 'Escape') end(); };
      window.addEventListener('keydown', onKey, true);
      show(0); requestAnimationFrame(function (n) { el.classList.add('on'); loop(n); });
    });
  }
  H.prologue = { play: play };
})();
