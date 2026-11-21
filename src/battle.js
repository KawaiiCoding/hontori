// Spirit battle (demo): your lead hontori vs a jealous wild hontori.
// Spells are cast by DRAWING a shape with the mouse or finger:
//   triangle = element strike, circle = mend (heal), zigzag = stun, wave = sleep.
// Element matrix + weather change the damage. A calmed hontori is remembered in the wand.
(function () {
  var H = window.H = window.H || {};

  // ---------------------------------------------------------------- elements
  var ELS = ['water', 'fire', 'wind', 'grass', 'electric', 'earth', 'dark', 'light'];
  // STRONG[a] = elements that a is strong against (x1.6). Reverse pairs are weak (x0.6).
  var STRONG = {
    water: ['fire', 'earth'], fire: ['grass', 'wind'], wind: ['grass', 'electric'], grass: ['water', 'earth'],
    electric: ['water', 'wind'], earth: ['electric', 'fire'], dark: ['light'], light: ['dark']
  };
  function matrix(a, d) {
    if (STRONG[a] && STRONG[a].indexOf(d) >= 0) return 1.6;
    if (STRONG[d] && STRONG[d].indexOf(a) >= 0) return 0.6;
    return 1;
  }
  // weather / time boosts
  function weatherMul(el, env) {
    var w = env.weather, night = env.time >= 19 || env.time < 6;
    if (w === 'rain') { if (el === 'water' || el === 'electric') return 1.3; if (el === 'fire') return 0.7; }
    if (w === 'wind' && el === 'wind') return 1.3;
    if (w === 'snow') { if (el === 'water') return 1.15; if (el === 'grass') return 0.8; }
    if (w === 'fog' && el === 'dark') return 1.2;
    if (w === 'clear' && !night && (el === 'fire' || el === 'light')) return 1.2;
    if (night && el === 'dark') return 1.25;
    if (night && el === 'light') return 0.85;
    return 1;
  }
  var ATTACK = { fire: 'Ember Strike', water: 'Tide Splash', wind: 'Gust', grass: 'Leaf Dart', electric: 'Spark', earth: 'Pebble Toss', dark: 'Shade Bite', light: 'Glimmer' };
  var COL = { fire: '#ff8a3c', water: '#4aa8ff', wind: '#9ff0e0', grass: '#7ed957', electric: '#7ff0ff', earth: '#c9935a', dark: '#a070ff', light: '#fff2a8' };

  // ---------------------------------------------------------------- gesture recognizer
  // Resample to N points, centre, scale uniformly; compare to templates (any start point, either direction).
  var N = 48;
  function pathLen(p) { var d = 0; for (var i = 1; i < p.length; i++) d += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return d; }
  function resample(pts, n) {
    var I = pathLen(pts) / (n - 1), D = 0, out = [pts[0].slice()], p = pts.map(function (q) { return q.slice(); });
    for (var i = 1; i < p.length; i++) {
      var d = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
      if (D + d >= I && d > 0) {
        var t = (I - D) / d, q = [p[i - 1][0] + t * (p[i][0] - p[i - 1][0]), p[i - 1][1] + t * (p[i][1] - p[i - 1][1])];
        out.push(q); p.splice(i, 0, q); D = 0;
      } else D += d;
    }
    while (out.length < n) out.push(p[p.length - 1].slice());
    return out.slice(0, n);
  }
  function normalize(pts) {
    var r = resample(pts, N), minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9, cx = 0, cy = 0;
    r.forEach(function (q) { minx = Math.min(minx, q[0]); maxx = Math.max(maxx, q[0]); miny = Math.min(miny, q[1]); maxy = Math.max(maxy, q[1]); cx += q[0]; cy += q[1]; });
    cx /= N; cy /= N; var s = Math.max(maxx - minx, maxy - miny) || 1;
    return r.map(function (q) { return [(q[0] - cx) / s, (q[1] - cy) / s]; });
  }
  function dist(a, b) { var d = 0; for (var i = 0; i < N; i++) d += Math.hypot(a[i][0] - b[i][0], a[i][1] - b[i][1]); return d / N; }
  function poly(pts) { return pts; }
  var TEMPLATES = {
    attack: { closed: true, pts: normalize(poly([[0, 1], [0.5, 0], [1, 1], [0, 1]])) },
    mend: { closed: true, pts: normalize((function () { var a = []; for (var i = 0; i <= 32; i++) { var t = -Math.PI / 2 + i / 32 * Math.PI * 2; a.push([Math.cos(t), Math.sin(t)]); } return a; })()) },
    stun: { closed: false, pts: normalize(poly([[0.35, 0], [0.75, 0.38], [0.25, 0.62], [0.65, 1]])) },
    sleep: { closed: false, pts: normalize((function () { var a = []; for (var i = 0; i <= 40; i++) { var x = i / 40; a.push([x, 0.5 + 0.22 * Math.sin(x * Math.PI * 4)]); } return a; })()) },
    // spiral drawn from the outside in (2 turns): pulls a weakened hontori into the wand
    absorb: { closed: false, rot: true, pts: normalize((function () { var a = []; for (var i = 0; i <= 60; i++) { var t = i / 60, r = 1 - t * 0.85, ang = -Math.PI / 2 + t * Math.PI * 4; a.push([Math.cos(ang) * r, Math.sin(ang) * r]); } return a; })()) },
    // five-point star in one stroke (hardest shape)
    revive: { closed: true, pts: normalize((function () { var a = []; for (var i = 0; i <= 5; i++) { var ang = -Math.PI / 2 + i * Math.PI * 4 / 5; a.push([Math.cos(ang), Math.sin(ang)]); } return a; })()) },
    // the veil spell from the intro: a V, opening the curtain
    veil: { closed: false, pts: normalize(poly([[0, 0], [0.5, 1], [1, 0]])) }
  };
  function recognize(raw, allowed) {
    if (raw.length < 6 || pathLen(raw) < 30) return null;
    var g = normalize(raw), gr = g.slice().reverse(), best = null, bestD = 1e9;
    (allowed || Object.keys(TEMPLATES)).forEach(function (k) {
      var T = TEMPLATES[k], shifts = T.closed ? 12 : 1;
      // rotation-free shapes (spiral): try 16 rotations, clockwise and mirrored
      var cands = [g, gr];
      if (T.rot) { cands = []; for (var r = 0; r < 16; r++) { var a = r / 16 * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
        [1, -1].forEach(function (m) { cands.push(g.map(function (q) { return [(q[0] * c - q[1] * sn) * m, q[0] * sn + q[1] * c]; })); }); } }
      for (var s = 0; s < shifts; s++) {
        var off = Math.round(s * N / shifts), tp = T.closed ? T.pts.slice(off).concat(T.pts.slice(0, off)) : T.pts;
        for (var ci = 0; ci < cands.length; ci++) { var d = dist(cands[ci], tp); if (d < bestD) { bestD = d; best = k; } }
      }
    });
    return bestD < (best === 'revive' ? 0.16 : 0.2) ? best : null;
  }

  // Full-screen "draw this shape" prompt (used by the intro for Velum Aperi). Resolves when drawn correctly.
  function prompt(kind, text) {
    return new Promise(function (resolve) {
      var root = document.getElementById('root');
      var el = document.createElement('div');
      el.style.cssText = 'position:absolute;inset:0;z-index:44;touch-action:none;background:rgba(8,8,24,.35)';
      var cv = document.createElement('canvas'); cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none'; el.appendChild(cv);
      var tip = document.createElement('div');
      tip.style.cssText = 'position:absolute;left:12px;right:12px;top:22%;text-align:center;color:#fff4d6;font:900 clamp(18px,5vmin,26px) Nunito,system-ui,sans-serif;text-shadow:0 2px 0 rgba(0,0,0,.6);pointer-events:none';
      tip.textContent = text; el.appendChild(tip); root.appendChild(el);
      var g = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), trail = [], drawing = false, live = true, T0 = performance.now(), sparks = [];
      function size() { cv.width = el.clientWidth * dpr; cv.height = el.clientHeight * dpr; }
      size();
      var guide = TEMPLATES[kind].pts;
      function frame(ms) {
        if (!live) return;
        var w = el.clientWidth, h = el.clientHeight, s = Math.min(w, h) * 0.42, cx = w / 2, cy = h * 0.52;
        g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
        // animated ghost guide: dashed shape + a dot travelling along it
        g.lineCap = 'round'; g.lineJoin = 'round'; g.setLineDash([6, 10]); g.lineWidth = 4; g.strokeStyle = 'rgba(255,230,170,.35)';
        g.beginPath(); guide.forEach(function (q, i) { var x = cx + q[0] * s, y = cy + q[1] * s; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke(); g.setLineDash([]);
        var k = Math.floor(((ms - T0) / 1800 % 1) * (guide.length - 1)), q = guide[k];
        g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(cx + q[0] * s, cy + q[1] * s, 6, 0, 7); g.fill();
        if (trail.length > 1) {
          [[10, 'rgba(255,200,120,.25)'], [5, 'rgba(255,230,170,.75)'], [2, '#fff']].forEach(function (st) {
            g.lineWidth = st[0]; g.strokeStyle = st[1]; g.beginPath(); g.moveTo(trail[0][0], trail[0][1]); for (var i = 1; i < trail.length; i++) g.lineTo(trail[i][0], trail[i][1]); g.stroke(); });
        }
        for (var i = sparks.length - 1; i >= 0; i--) { var p = sparks[i]; p.x += p.vx; p.y += p.vy; p.l -= 0.02; if (p.l <= 0) { sparks.splice(i, 1); continue; } g.globalAlpha = p.l; g.fillStyle = p.c; g.fillRect(p.x, p.y, 3, 3); }
        g.globalAlpha = 1;
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
      function pt(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
      var pid = null;
      cv.addEventListener('pointerdown', function (e) { pid = e.pointerId; try { cv.setPointerCapture(pid); } catch (_) {} drawing = true; trail = [pt(e)]; e.preventDefault(); });
      cv.addEventListener('pointermove', function (e) { if (!drawing || e.pointerId !== pid) return; var p = pt(e); trail.push(p); sparks.push({ x: p[0], y: p[1], vx: (Math.random() - .5) * 1.5, vy: -Math.random() * 1.5, l: 1, c: Math.random() < .5 ? '#ffd98a' : '#fff' }); });
      function up(e) {
        if (!drawing || e.pointerId !== pid) return; drawing = false;
        if (recognize(trail, [kind]) === kind) {
          tip.textContent = ''; for (var i = 0; i < 80; i++) { var a = Math.random() * 6.28, v = Math.random() * 6; sparks.push({ x: trail[trail.length - 1][0], y: trail[trail.length - 1][1], vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 1.4, c: i % 3 ? '#ffd98a' : '#fff' }); }
          setTimeout(function () { live = false; el.remove(); resolve(); }, 700);
        } else { tip.textContent = 'Almost. Follow the glowing line.'; trail = []; try { H.audio && H.audio.sfx('bump'); } catch (_) {} }
      }
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    });
  }
  H.gesture = { recognize: recognize, prompt: prompt };

  // ---------------------------------------------------------------- UI
  var CSS = [
    '.hb{position:absolute;inset:0;z-index:45;background:#0b0c1c;font-family:Nunito,"M PLUS Rounded 1c",system-ui,sans-serif;color:#f4f1e8;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none;opacity:0;transition:opacity .35s}',
    '.hb.on{opacity:1}',
    '.hb canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;touch-action:none}',
    '.hb-card{position:absolute;min-width:150px;max-width:62%;padding:8px 12px 10px;border-radius:14px;background:rgba(14,16,36,.86);border:2px solid rgba(255,255,255,.18);box-shadow:0 6px 18px rgba(0,0,0,.4)}',
    '.hb-card .nm{font-weight:900;font-size:16px;display:flex;justify-content:space-between;gap:10px}',
    '.hb-card .lv{opacity:.75;font-size:13px}',
    '.hb-hp{height:9px;border-radius:5px;background:rgba(0,0,0,.55);overflow:hidden;margin-top:6px}',
    '.hb-hp b{display:block;height:100%;width:100%;background:linear-gradient(90deg,#57d07a,#9cf0a6);transition:width .5s}',
    '.hb-hp b.low{background:linear-gradient(90deg,#ff7a5a,#ffb08a)}',
    '.hb-card .st{font-size:12px;font-weight:800;margin-top:4px;color:#ffd98a;min-height:15px}',
    '.hb-foe{right:12px;top:calc(env(safe-area-inset-top,0px) + 14px)}',
    '.hb-me{right:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 132px)}',
    '.hb-msg{position:absolute;left:12px;right:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 100px);text-align:center;font-weight:900;font-size:clamp(16px,4.6vmin,22px);text-shadow:0 2px 0 rgba(0,0,0,.6);pointer-events:none;min-height:28px}',
    '.hb-spells{position:absolute;left:8px;right:8px;bottom:calc(env(safe-area-inset-bottom,0px) + 10px);display:grid;grid-template-columns:repeat(6,1fr);gap:5px}',
    '.hb-sp.lock{opacity:.35}',
    '.hb-sp{border-radius:12px;background:rgba(20,22,48,.9);border:2px solid rgba(255,255,255,.16);padding:6px 4px;text-align:center;font-size:11px;font-weight:800;line-height:1.1}',
    '.hb-sp svg{display:block;margin:0 auto 3px;width:30px;height:30px}',
    '.hb-sp.hot{border-color:#ffc56b;box-shadow:0 0 0 2px rgba(255,197,107,.3)}',
    '.hb-run{position:absolute;left:12px;top:calc(env(safe-area-inset-top,0px) + 14px);border:0;border-radius:12px;background:rgba(14,16,36,.8);color:#fff;font:inherit;font-weight:900;font-size:14px;padding:10px 14px;cursor:pointer}',
    '.hb-end{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);border:0;border-radius:999px;padding:14px 30px;font:inherit;font-size:18px;font-weight:900;color:#2a1405;background:linear-gradient(180deg,#ffd98a,#ff9a3c);box-shadow:0 5px 0 #a8501c;cursor:pointer}',
    '.hb-end[hidden]{display:none}'
  ].join('\n');
  var GLYPH = {
    attack: '<path d="M5 25 L15 5 L25 25 Z" />',
    mend: '<circle cx="15" cy="15" r="10" />',
    stun: '<path d="M11 4 L21 12 L9 18 L19 26" />',
    sleep: '<path d="M3 15 Q7 7 11 15 T19 15 T27 15" />',
    absorb: '<path d="M15 4 A11 11 0 1 1 4.5 17 A8 8 0 0 1 15 8 A5.5 5.5 0 1 1 10 15 A3 3 0 0 1 15 12" />',
    revive: '<path d="M15 3 L22 26 L4 11 L26 11 L8 26 Z" />'
  };
  function glyph(k, col) { return '<svg viewBox="0 0 30 30"><g fill="none" stroke="' + col + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' + GLYPH[k] + '</g></svg>'; }
  function mk(tag, cls, parent, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function specOf(key) { return (H.spirits && H.spirits.list.filter(function (s) { return s.key === key; })[0]) || { key: key, element: 'fire', name: key }; }
  function sfx(n) { try { H.audio && H.audio.sfx(n); } catch (e) {} }

  var styled = false;
  function start(opts) {
    opts = opts || {};
    var root = document.getElementById('root'), env = opts.env || { t: 0, time: 12, weather: 'clear' };
    if (!styled) { var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); styled = true; }
    var party = (H.game && H.game.state.party) || [];
    var lead = party[0] || { key: 'hontori', level: 1, hp: 20, maxHp: 20 };
    var me = { key: lead.key, el: specOf(lead.key).element, hp: lead.hp, max: lead.maxHp, lvl: lead.level, name: lead.nick || (cap(specOf(lead.key).element) + ' Hontori'), stun: 0, sleep: 0 };
    var pool = H.spirits.list.map(function (s) { return s.key; }).filter(function (k) { return k !== me.key; });
    var fk = opts.enemy || pool[Math.floor(Math.random() * pool.length)], fs = specOf(fk);
    var foe = { key: fk, el: fs.element, hp: 18, max: 18, lvl: 1, name: 'Jealous ' + cap(fs.element) + ' Hontori', stun: 0, sleep: 0 };

    var el = mk('div', 'hb', root), cv = mk('canvas', '', el), g = cv.getContext('2d');
    var foeCard = mk('div', 'hb-card hb-foe', el), meCard = mk('div', 'hb-card hb-me', el);
    var msg = mk('div', 'hb-msg', el), spells = mk('div', 'hb-spells', el);
    var endBtn = mk('button', 'hb-end', el, 'Continue'); endBtn.hidden = true;
    var cards = {};
    var GC = { mend: '#9cf0a6', stun: '#ffe27a', sleep: '#b9a8ff', absorb: '#ffd98a', revive: '#ffffff' };
    [['attack', ATTACK[me.el]], ['mend', 'Mend'], ['stun', 'Stun'], ['sleep', 'Sleep'], ['absorb', 'Absorb'], ['revive', 'Revive']].forEach(function (s) {
      cards[s[0]] = mk('div', 'hb-sp', spells, glyph(s[0], s[0] === 'attack' ? COL[me.el] : GC[s[0]]) + s[1]);
    });
    var runBtn = mk('button', 'hb-run', el, 'Run');
    function refreshLocks() {
      cards.absorb.classList.toggle('lock', foe.hp / foe.max > 0.35);
      cards.revive.classList.toggle('lock', me.hp > 0);
      cards.attack.classList.toggle('lock', me.hp <= 0); cards.mend.classList.toggle('lock', me.hp <= 0);
      cards.stun.classList.toggle('lock', me.hp <= 0); cards.sleep.classList.toggle('lock', me.hp <= 0);
    }
    requestAnimationFrame(function () { el.classList.add('on'); });

    function card(c, f) {
      var low = f.hp / f.max < 0.3, status = f.stun ? 'Stunned' : f.sleep ? 'Asleep' : '';
      c.innerHTML = '<div class="nm"><span>' + f.name + '</span><span class="lv">Lv ' + f.lvl + '</span></div><div class="hb-hp"><b class="' + (low ? 'low' : '') + '" style="width:' + Math.max(0, Math.round(100 * f.hp / f.max)) + '%"></b></div><div class="st">' + (f === me ? f.hp + ' / ' + f.max + (status ? '  ' + status : '') : status) + '</div>';
      try { var b = H.ui.elementBadge(f.el); b.style.marginLeft = '0'; c.querySelector('.nm span').appendChild(document.createTextNode(' ')); c.querySelector('.st').prepend(b); } catch (e) {}
    }
    function say(t) { msg.textContent = t; }

    // ---------------- scene rendering
    var W = 0, Hh = 0, L = 1, dpr = Math.min(2, window.devicePixelRatio || 1), parts = [], floats = [], shakeT = 0, flashT = 0;
    var meFx = { dx: 0, dy: 0, hit: 0 }, foeFx = { dx: 0, dy: 0, hit: 0, alpha: 1 };
    function size() {
      var w = el.clientWidth, h = el.clientHeight; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      L = Math.max(2, Math.floor(Math.min(w, h) / 120)); W = w / L; Hh = h / L;
    }
    size(); window.addEventListener('resize', size);
    var night = env.time >= 19 || env.time < 6;
    function bg() {
      var sky = g.createLinearGradient(0, 0, 0, Hh);
      if (night) { sky.addColorStop(0, '#141a3e'); sky.addColorStop(1, '#2a2f55'); } else { sky.addColorStop(0, '#8fd0ff'); sky.addColorStop(0.6, '#cdefff'); sky.addColorStop(1, '#e8f7d8'); }
      g.fillStyle = sky; g.fillRect(0, 0, W, Hh);
      // far hills
      g.fillStyle = night ? '#1f3a3a' : '#7cc47a'; g.beginPath(); g.moveTo(0, Hh * 0.5);
      for (var x = 0; x <= W; x += 4) g.lineTo(x, Hh * 0.47 + Math.sin(x * 0.05) * 4 + Math.sin(x * 0.013) * 7); g.lineTo(W, Hh); g.lineTo(0, Hh); g.fill();
      g.fillStyle = night ? '#24453a' : '#8fd27a'; g.fillRect(0, Hh * 0.55, W, Hh);
      // platforms
      function plat(x, y, rx) { g.fillStyle = night ? '#2f5a3f' : '#6fbf5c'; g.beginPath(); g.ellipse(x, y, rx, rx * 0.28, 0, 0, 7); g.fill(); g.fillStyle = night ? '#3a6b4a' : '#9ad97d'; g.beginPath(); g.ellipse(x, y - 1, rx * 0.86, rx * 0.2, 0, 0, 7); g.fill(); }
      plat(W * 0.7, Hh * 0.36, 34); plat(W * 0.3, Hh * 0.68, 40);
      if (env.weather === 'rain') { g.strokeStyle = 'rgba(200,220,255,.45)'; g.lineWidth = 0.5; g.beginPath(); for (var i = 0; i < 70; i++) { var rx = (i * 53 + T * 90) % W, ry = (i * 97 + T * 260) % Hh; g.moveTo(rx, ry); g.lineTo(rx - 2, ry + 6); } g.stroke(); }
      if (night) { g.fillStyle = 'rgba(255,255,255,.7)'; for (var j = 0; j < 30; j++) g.fillRect((j * 71) % W, (j * 37) % (Hh * 0.45), 0.6, 0.6); }
    }
    var T = 0, live = true, trail = [], drawing = false;
    function frame(ms) {
      if (!live) return;
      T = ms / 1000;
      if (Math.round(el.clientWidth * dpr) !== cv.width || Math.round(el.clientHeight * dpr) !== cv.height) size();
      g.setTransform(dpr * L, 0, 0, dpr * L, 0, 0); g.imageSmoothingEnabled = false;
      var sx = shakeT > 0 ? (Math.random() - 0.5) * 3 * shakeT : 0; shakeT = Math.max(0, shakeT - 0.03);
      g.save(); g.translate(sx, 0);
      bg();
      var senv = { t: T, time: env.time, weather: env.weather, wind: 0.3, indoor: false };
      // foe: front view, top right. Me: back view, bottom left.
      g.globalAlpha = foeFx.alpha;
      if (!(foeFx.hit > 0 && Math.floor(T * 20) % 2)) H.spirits.draw(g, foe.key, Math.round(W * 0.7 + foeFx.dx), Math.round(Hh * 0.36 - 14 + foeFx.dy), senv, { scale: 1.4, dir: 0, sit: !!foe.sleep });
      g.globalAlpha = 1;
      g.globalAlpha = me.hp <= 0 ? 0.35 : 1;
      if (!(meFx.hit > 0 && Math.floor(T * 20) % 2)) H.spirits.draw(g, me.key, Math.round(W * 0.3 + meFx.dx), Math.round(Hh * 0.68 - 16 + meFx.dy), senv, { scale: 1.7, dir: 1 });
      g.globalAlpha = 1; meFx.hit = Math.max(0, meFx.hit - 0.02); foeFx.hit = Math.max(0, foeFx.hit - 0.02);
      if (foe.sleep) { g.fillStyle = '#e8e0ff'; g.font = 'bold 7px Nunito, sans-serif'; g.fillText('z', W * 0.7 + 12, Hh * 0.36 - 30 - (T * 6 % 6)); }
      if (foe.stun) { g.fillStyle = '#ffe27a'; for (var s = 0; s < 3; s++) { var a = T * 4 + s * 2.1; g.fillRect(W * 0.7 + Math.cos(a) * 10, Hh * 0.36 - 34 + Math.sin(a) * 3, 1.5, 1.5); } }
      // particles
      g.globalCompositeOperation = 'lighter';
      for (var i = parts.length - 1; i >= 0; i--) { var p = parts[i]; p.x += p.vx; p.y += p.vy; p.vy += p.g || 0; p.l -= p.d; if (p.l <= 0) { parts.splice(i, 1); continue; } g.globalAlpha = Math.min(1, p.l); g.fillStyle = p.c; g.fillRect(p.x, p.y, p.s, p.s); }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      g.restore();
      // floating damage numbers
      for (var k = floats.length - 1; k >= 0; k--) { var f = floats[k]; f.y -= 0.25; f.l -= 0.012; if (f.l <= 0) { floats.splice(k, 1); continue; }
        g.globalAlpha = Math.min(1, f.l * 2); g.font = 'bold 9px Nunito, sans-serif'; g.textAlign = 'center'; g.lineWidth = 2; g.strokeStyle = 'rgba(0,0,0,.6)'; g.strokeText(f.t, f.x, f.y); g.fillStyle = f.c; g.fillText(f.t, f.x, f.y); }
      g.globalAlpha = 1;
      // gesture trail (glowing)
      if (trail.length > 1) {
        g.lineCap = 'round'; g.lineJoin = 'round';
        [[5, 'rgba(255,200,120,.25)'], [2.4, 'rgba(255,230,170,.7)'], [1, '#ffffff']].forEach(function (st) {
          g.lineWidth = st[0]; g.strokeStyle = st[1]; g.beginPath(); g.moveTo(trail[0][0] / L, trail[0][1] / L);
          for (var i = 1; i < trail.length; i++) g.lineTo(trail[i][0] / L, trail[i][1] / L); g.stroke();
        });
      }
      if (flashT > 0) { g.fillStyle = 'rgba(255,255,255,' + flashT + ')'; g.fillRect(0, 0, W, Hh); flashT = Math.max(0, flashT - 0.05); }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    function burst(x, y, col, n, spread) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, v = Math.random() * (spread || 1.2); parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.2, l: 1, d: 0.02 + Math.random() * 0.02, c: Math.random() < 0.3 ? '#ffffff' : col, s: Math.random() < 0.5 ? 1 : 1.5 }); } }
    function float(x, y, t, c) { floats.push({ x: x, y: y, t: t, c: c || '#fff', l: 1 }); }
    function projectile(fromMe, col) {
      return new Promise(function (res) {
        var x0 = fromMe ? W * 0.3 : W * 0.7, y0 = fromMe ? Hh * 0.68 - 20 : Hh * 0.36 - 14, x1 = fromMe ? W * 0.7 : W * 0.3, y1 = fromMe ? Hh * 0.36 - 14 : Hh * 0.68 - 20, k = 0;
        (function step() { k += 0.06; var x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * 12;
          for (var i = 0; i < 4; i++) parts.push({ x: x + (Math.random() - .5) * 3, y: y + (Math.random() - .5) * 3, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, l: 0.8, d: 0.05, c: i ? col : '#fff', s: 1.5 });
          if (k < 1) requestAnimationFrame(step); else res(); })();
      });
    }

    // Element-specific attack animation, from attacker to target.
    function attackFx(el, fromMe) {
      var x0 = fromMe ? W * 0.3 : W * 0.7, y0 = fromMe ? Hh * 0.68 - 20 : Hh * 0.36 - 14, x1 = fromMe ? W * 0.7 : W * 0.3, y1 = fromMe ? Hh * 0.36 - 14 : Hh * 0.68 - 20;
      var c = COL[el];
      function P(o) { parts.push(Object.assign({ vx: 0, vy: 0, l: 1, d: 0.04, c: c, s: 1.5 }, o)); }
      return new Promise(function (res) {
        var k = 0, sp = { electric: 0.2, light: 0.12, wind: 0.05, earth: 0.045 }[el] || 0.06;
        (function step() {
          k = Math.min(1, k + sp);
          var x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k, arc = Math.sin(k * Math.PI);
          if (el === 'fire') { y -= arc * 10; for (var i = 0; i < 5; i++) P({ x: x + (Math.random() - .5) * 4, y: y + (Math.random() - .5) * 4, vy: -0.4 - Math.random() * .5, vx: (Math.random() - .5) * .3, c: ['#ff5a1f', '#ff8a3c', '#ffd27a', '#fff'][i % 4], d: 0.05 }); }
          else if (el === 'water') { y -= arc * 16; for (var j = 0; j < 4; j++) P({ x: x + (Math.random() - .5) * 3, y: y + (Math.random() - .5) * 3, vy: 0.3, c: j ? '#4aa8ff' : '#cfe9ff', d: 0.05 }); }
          else if (el === 'wind') { for (var w = 0; w < 3; w++) { var a = k * 20 + w * 2.1; P({ x: x + Math.cos(a) * 6, y: y + Math.sin(a) * 3, c: '#dffcf6', d: 0.06, s: 1 }); } }
          else if (el === 'grass') { y -= arc * 8; for (var gl = 0; gl < 3; gl++) P({ x: x + Math.cos(k * 30 + gl * 2) * 4, y: y + Math.sin(k * 30 + gl * 2) * 4, c: gl ? '#7ed957' : '#c8f59a', d: 0.04, s: 2 }); }
          else if (el === 'electric') { var jx = x + (Math.random() - .5) * 8, jy = y + (Math.random() - .5) * 8; for (var e = 0; e < 6; e++) P({ x: jx + (Math.random() - .5) * 3, y: jy + (Math.random() - .5) * 3, c: e % 2 ? '#7ff0ff' : '#fff', d: 0.08 }); flashT = Math.max(flashT, 0.15); }
          else if (el === 'earth') { y -= arc * 22; for (var r = 0; r < 2; r++) P({ x: x + (Math.random() - .5) * 2, y: y, c: r ? '#8a6040' : '#c9935a', d: 0.04, s: 2.5, vy: 0.1 }); }
          else if (el === 'dark') { for (var d = 0; d < 4; d++) { var b = k * 14 + d * 1.6; P({ x: x + Math.cos(b) * 5, y: y + Math.sin(b) * 5, c: d ? '#7a4ad0' : '#2a1640', d: 0.04, s: 2 }); } }
          else if (el === 'light') { for (var t2 = 0; t2 < 8; t2++) { var q = t2 / 8; P({ x: x0 + (x - x0) * q, y: y0 + (y - y0) * q, c: '#fff2a8', d: 0.09, s: 1 }); } }
          if (k < 1) return requestAnimationFrame(step);
          // impact
          var n = el === 'earth' ? 18 : 28;
          for (var m = 0; m < n; m++) { var ang = Math.random() * 6.283, v = Math.random() * 1.7; P({ x: x1, y: y1, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - (el === 'fire' ? 0.6 : 0.2), c: Math.random() < .3 ? '#fff' : c, d: 0.025 + Math.random() * 0.02, g: el === 'earth' || el === 'water' ? 0.05 : 0 }); }
          if (el === 'water') for (var rr = 0; rr < 16; rr++) { var ra = rr / 16 * 6.283; P({ x: x1, y: y1 + 8, vx: Math.cos(ra) * 1.4, vy: Math.sin(ra) * 0.4, c: '#cfe9ff', d: 0.04, s: 1 }); }
          if (el === 'light' || el === 'electric') flashT = 0.45;
          res();
        })();
      });
    }

    // ---------------- turn logic
    var busy = false, done = false, tutorial = !(H.game && H.game.state.battles);
    card(foeCard, foe); card(meCard, me); refreshLocks();
    say('A jealous hontori blocks the way!');
    setTimeout(function () { if (!busy && !done) say(tutorial ? 'Draw a triangle to attack' : 'Draw a spell'); if (tutorial) cards.attack.classList.add('hot'); }, 1400);

    async function cast(kind) {
      if (busy || done) return; busy = true;
      Object.keys(cards).forEach(function (k) { cards[k].classList.toggle('hot', k === kind); });
      var mx = W * 0.3, my = Hh * 0.68 - 20, fx = W * 0.7, fy = Hh * 0.36 - 14;
      if (kind === 'attack') {
        say(ATTACK[me.el] + '!'); sfx('spell'); meFx.dy = -3; setTimeout(function () { meFx.dy = 0; }, 150);
        await attackFx(me.el, true);
        var m = matrix(me.el, foe.el), wm = weatherMul(me.el, env), dmg = Math.max(1, Math.round(6 * m * wm * (0.85 + Math.random() * 0.3)));
        foe.hp = Math.max(0, foe.hp - dmg); foeFx.hit = 0.6; shakeT = 1; flashT = 0.25; burst(fx, fy, COL[me.el], 30, 1.6); sfx('bump');
        float(fx, fy - 12, '-' + dmg, m > 1 ? '#ffd24a' : '#ffffff');
        if (foe.sleep) foe.sleep = 0;
        say(m > 1 ? 'It is strong!' : m < 1 ? 'It is weak...' : wm > 1 ? 'The weather helps!' : wm < 1 ? 'The weather holds it back.' : 'A clean hit.');
      } else if (kind === 'mend') {
        var heal = Math.min(me.max - me.hp, 8); me.hp += heal; say('Mend!'); sfx('sparkle');
        for (var i = 0; i < 4; i++) setTimeout(function () { burst(mx, my, '#9cf0a6', 10, 0.8); }, i * 120);
        float(mx, my - 14, '+' + heal, '#9cf0a6');
      } else if (kind === 'stun') {
        say('Stun!'); sfx('spell'); await projectile(true, '#ffe27a'); flashT = 0.5; burst(fx, fy, '#ffe27a', 24, 1.4);
        if (Math.random() < 0.7) { foe.stun = 1; say('It is stunned!'); } else say('It shook it off.');
        foe.hp = Math.max(0, foe.hp - 2); float(fx, fy - 12, '-2');
      } else if (kind === 'absorb') {
        if (foe.hp / foe.max > 0.35) { say('Weaken it first.'); busy = false; return; }
        say('Absorb!'); sfx('spell');
        // light pulls the foe toward the wand
        for (var a1 = 0; a1 < 24; a1++) (function (i) { setTimeout(function () { var ang = i * 0.7, r = 22 - i * 0.8; parts.push({ x: fx + Math.cos(ang) * r, y: fy + Math.sin(ang) * r, vx: 0, vy: 0, l: 1, d: 0.03, c: i % 2 ? '#ffd98a' : '#fff', s: 1.5 }); }, i * 40); })(a1);
        var chance = 0.35 + (1 - foe.hp / foe.max) * 0.5 + (foe.sleep ? 0.2 : 0) + (foe.stun ? 0.15 : 0);
        for (var sh = 0; sh < 3; sh++) { await wait(450); foeFx.dx = sh % 2 ? 3 : -3; foeFx.alpha = 0.5; sfx('bump'); await wait(120); foeFx.dx = 0; foeFx.alpha = 1; }
        if (Math.random() < Math.min(0.95, chance)) { foeFx.alpha = 0; burst(fx, fy, '#ffd98a', 40, 1.5); return absorbed(); }
        say('It broke free!');
      } else if (kind === 'revive') {
        if (me.hp > 0) { say('It does not need reviving.'); busy = false; return; }
        var mat = { fire: 'ember_dust', water: 'tide_pearl' }[me.el] || 'spirit_snack', st0 = H.game && H.game.state, it = st0 && st0.items.filter(function (i) { return i.id === mat; })[0];
        var matName = { ember_dust: 'Ember Dust', tide_pearl: 'Tide Pearl', spirit_snack: 'Spirit Snack' }[mat];
        if (!it) { say('You need ' + matName + ' to revive.'); busy = false; return; }
        it.n = (it.n || 1) - 1; if (it.n <= 0) st0.items.splice(st0.items.indexOf(it), 1);
        say('Revive!'); sfx('wand'); flashT = 0.6;
        for (var rv = 0; rv < 6; rv++) { burst(mx, my, '#fff2a8', 14, 1); await wait(110); }
        me.hp = Math.ceil(me.max / 2); meFx.alpha = 1; float(mx, my - 14, '+' + me.hp, '#9cf0a6');
        say(matName + ' glows. It stands again!'); card(meCard, me); refreshLocks(); await wait(900); busy = false; say('Draw a spell'); return;
      } else if (kind === 'sleep') {
        say('Sleep...'); sfx('sparkle'); for (var j = 0; j < 5; j++) setTimeout(function () { burst(fx, fy, '#b9a8ff', 8, 0.6); }, j * 140);
        await wait(500);
        if (Math.random() < 0.55) { foe.sleep = 2; say('It fell asleep.'); } else say('It stays awake.');
      }
      card(foeCard, foe); card(meCard, me);
      await wait(900);
      if (foe.hp <= 0) return win();
      await foeTurn();
      card(foeCard, foe); card(meCard, me);
      refreshLocks();
      if (me.hp <= 0) { var hasMat = H.game && H.game.state.items.some(function (i) { return { fire: 'ember_dust', water: 'tide_pearl' }[me.el] === i.id || i.id === 'spirit_snack'; });
        if (!hasMat) return lose(); busy = false; say('It fainted. Draw a star to revive.'); cards.revive.classList.add('hot'); return; }
      busy = false; if (!done) say(foe.hp / foe.max <= 0.35 ? 'It is weak. Draw a spiral to absorb it.' : 'Draw a spell'); if (foe.hp / foe.max <= 0.35) cards.absorb.classList.add('hot');
    }
    async function foeTurn() {
      if (foe.stun) { foe.stun = 0; say('It cannot move!'); await wait(900); return; }
      if (foe.sleep) { foe.sleep--; say(foe.sleep ? 'It sleeps on.' : 'It wakes up!'); await wait(900); return; }
      say(foe.name.replace('Jealous ', '') + ' strikes!'); foeFx.dy = 3; setTimeout(function () { foeFx.dy = 0; }, 150);
      await attackFx(foe.el, false);
      var m = matrix(foe.el, me.el), dmg = Math.max(1, Math.round(4 * m * weatherMul(foe.el, env) * (0.8 + Math.random() * 0.4)));
      me.hp = Math.max(0, me.hp - dmg); meFx.hit = 0.6; shakeT = 0.8; burst(W * 0.3, Hh * 0.68 - 20, COL[foe.el], 22, 1.3); sfx('bump');
      float(W * 0.3, Hh * 0.68 - 34, '-' + dmg, '#ff9a8a'); await wait(800);
    }
    async function win() {
      done = true; say('It calms down.'); sfx('wand');
      for (var i = 0; i < 6; i++) { burst(W * 0.7, Hh * 0.36 - 14, '#fff2a8', 12, 1); await wait(120); }
      foeFx.alpha = 0.5; await wait(500);
      var st = H.game && H.game.state;
      if (st) { st.battles = (st.battles || 0) + 1; st.seen = st.seen || []; if (st.seen.indexOf(foe.key) < 0) st.seen.push(foe.key); }
      var joined = false;
      if (H.game && st.party.length < 5 && !st.party.some(function (p) { return p.key === foe.key; })) joined = H.game.addHontori(foe.key);
      say(joined ? 'It wants to come with you!' : 'Your wand remembers it.');
      finish();
    }
    function absorbed() {
      done = true; sfx('wand'); say('Absorbed into your wand!');
      var st = H.game && H.game.state;
      if (st) { st.battles = (st.battles || 0) + 1; st.seen = st.seen || []; if (st.seen.indexOf(foe.key) < 0) st.seen.push(foe.key); st.wand = st.wand || []; st.wand.push(foe.key); }
      var joined = false;
      if (H.game && st.party.length < 5) joined = H.game.addHontori(foe.key);
      setTimeout(function () { say(joined ? 'It joins your party.' : 'It rests inside the wand.'); finish(); }, 900);
    }
    function lose() { done = true; say('Your hontori needs rest.'); finish(); }
    function finish() {
      if (H.game) { var p = H.game.state.party[0]; if (p) p.hp = Math.max(1, me.hp); H.game.save(); H.menu && H.menu.refresh(); }
      endBtn.hidden = false; spells.style.opacity = '0.4';
    }

    // ---------------- input: draw spells
    function pt(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    var pid = null;
    cv.addEventListener('pointerdown', function (e) { if (busy || done) return; pid = e.pointerId; try { cv.setPointerCapture(pid); } catch (_) {} drawing = true; trail = [pt(e)]; e.preventDefault(); });
    cv.addEventListener('pointermove', function (e) { if (!drawing || e.pointerId !== pid) return; var p = pt(e), l = trail[trail.length - 1]; if (Math.hypot(p[0] - l[0], p[1] - l[1]) > 2) trail.push(p); if (Math.random() < 0.5) parts.push({ x: p[0] / L, y: p[1] / L, vx: (Math.random() - .5) * .4, vy: -.2, l: .7, d: .03, c: '#ffd98a', s: 1 }); });
    function up(e) {
      if (!drawing || e.pointerId !== pid) return; drawing = false; pid = null;
      var kind = recognize(trail, ['attack', 'mend', 'stun', 'sleep', 'absorb', 'revive']), t0 = trail; setTimeout(function () { if (trail === t0) trail = []; }, 250);
      if (kind) cast(kind); else if (trail.length > 3) { say('The spell fizzles. Try again.'); sfx('bump'); }
    }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

    return new Promise(function (resolve) {
      function close() { live = false; el.classList.remove('on'); window.removeEventListener('resize', size); setTimeout(function () { el.remove(); }, 350); resolve(); }
      endBtn.addEventListener('click', close);
      runBtn.addEventListener('click', function () { if (busy && !done) return; say('You slip away.'); setTimeout(close, 600); });
    });
  }

  H.battle = { start: start, matrix: matrix, weatherMul: weatherMul, ELS: ELS };
})();
