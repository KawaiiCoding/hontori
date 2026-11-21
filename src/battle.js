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
    sleep: { closed: false, pts: normalize((function () { var a = []; for (var i = 0; i <= 40; i++) { var x = i / 40; a.push([x, 0.5 + 0.22 * Math.sin(x * Math.PI * 4)]); } return a; })()) }
  };
  function recognize(raw) {
    if (raw.length < 6 || pathLen(raw) < 30) return null;
    var g = normalize(raw), gr = g.slice().reverse(), best = null, bestD = 1e9;
    Object.keys(TEMPLATES).forEach(function (k) {
      var T = TEMPLATES[k], shifts = T.closed ? 12 : 1;
      for (var s = 0; s < shifts; s++) {
        var off = Math.round(s * N / shifts), tp = T.closed ? T.pts.slice(off).concat(T.pts.slice(0, off)) : T.pts;
        var d = Math.min(dist(g, tp), dist(gr, tp));
        if (d < bestD) { bestD = d; best = k; }
      }
    });
    return bestD < 0.2 ? best : null;
  }
  H.gesture = { recognize: recognize };

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
    '.hb-me{left:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 168px)}',
    '.hb-msg{position:absolute;left:12px;right:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 100px);text-align:center;font-weight:900;font-size:clamp(16px,4.6vmin,22px);text-shadow:0 2px 0 rgba(0,0,0,.6);pointer-events:none;min-height:28px}',
    '.hb-spells{position:absolute;left:8px;right:8px;bottom:calc(env(safe-area-inset-bottom,0px) + 10px);display:grid;grid-template-columns:repeat(4,1fr) auto;gap:6px}',
    '.hb-sp{border-radius:12px;background:rgba(20,22,48,.9);border:2px solid rgba(255,255,255,.16);padding:6px 4px;text-align:center;font-size:11px;font-weight:800;line-height:1.1}',
    '.hb-sp svg{display:block;margin:0 auto 3px;width:30px;height:30px}',
    '.hb-sp.hot{border-color:#ffc56b;box-shadow:0 0 0 2px rgba(255,197,107,.3)}',
    '.hb-run{border:0;border-radius:12px;background:rgba(255,255,255,.12);color:#fff;font:inherit;font-weight:900;font-size:13px;padding:0 12px;cursor:pointer}',
    '.hb-end{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);border:0;border-radius:999px;padding:14px 30px;font:inherit;font-size:18px;font-weight:900;color:#2a1405;background:linear-gradient(180deg,#ffd98a,#ff9a3c);box-shadow:0 5px 0 #a8501c;cursor:pointer}',
    '.hb-end[hidden]{display:none}'
  ].join('\n');
  var GLYPH = {
    attack: '<path d="M5 25 L15 5 L25 25 Z" />',
    mend: '<circle cx="15" cy="15" r="10" />',
    stun: '<path d="M11 4 L21 12 L9 18 L19 26" />',
    sleep: '<path d="M3 15 Q7 7 11 15 T19 15 T27 15" />'
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
    [['attack', ATTACK[me.el]], ['mend', 'Mend'], ['stun', 'Stun'], ['sleep', 'Sleep']].forEach(function (s) {
      cards[s[0]] = mk('div', 'hb-sp', spells, glyph(s[0], s[0] === 'attack' ? COL[me.el] : s[0] === 'mend' ? '#9cf0a6' : s[0] === 'stun' ? '#ffe27a' : '#b9a8ff') + s[1]);
    });
    var runBtn = mk('button', 'hb-run', spells, 'Run');
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
      g.setTransform(dpr * L, 0, 0, dpr * L, 0, 0); g.imageSmoothingEnabled = false;
      var sx = shakeT > 0 ? (Math.random() - 0.5) * 3 * shakeT : 0; shakeT = Math.max(0, shakeT - 0.03);
      g.save(); g.translate(sx, 0);
      bg();
      var senv = { t: T, time: env.time, weather: env.weather, wind: 0.3, indoor: false };
      // foe: front view, top right. Me: back view, bottom left.
      g.globalAlpha = foeFx.alpha;
      if (!(foeFx.hit > 0 && Math.floor(T * 20) % 2)) H.spirits.draw(g, foe.key, Math.round(W * 0.7 + foeFx.dx), Math.round(Hh * 0.36 - 14 + foeFx.dy), senv, { scale: 1.4, dir: 0, sit: !!foe.sleep });
      g.globalAlpha = 1;
      if (!(meFx.hit > 0 && Math.floor(T * 20) % 2)) H.spirits.draw(g, me.key, Math.round(W * 0.3 + meFx.dx), Math.round(Hh * 0.68 - 16 + meFx.dy), senv, { scale: 1.7, dir: 1 });
      meFx.hit = Math.max(0, meFx.hit - 0.02); foeFx.hit = Math.max(0, foeFx.hit - 0.02);
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

    // ---------------- turn logic
    var busy = false, done = false, tutorial = !(H.game && H.game.state.battles);
    card(foeCard, foe); card(meCard, me);
    say('A jealous hontori blocks the way!');
    setTimeout(function () { if (!busy && !done) say(tutorial ? 'Draw a triangle to attack' : 'Draw a spell'); if (tutorial) cards.attack.classList.add('hot'); }, 1400);

    async function cast(kind) {
      if (busy || done) return; busy = true;
      Object.keys(cards).forEach(function (k) { cards[k].classList.toggle('hot', k === kind); });
      var mx = W * 0.3, my = Hh * 0.68 - 20, fx = W * 0.7, fy = Hh * 0.36 - 14;
      if (kind === 'attack') {
        say(ATTACK[me.el] + '!'); sfx('spell'); meFx.dy = -3; setTimeout(function () { meFx.dy = 0; }, 150);
        await projectile(true, COL[me.el]);
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
      if (me.hp <= 0) return lose();
      busy = false; if (!done) say('Draw a spell');
    }
    async function foeTurn() {
      if (foe.stun) { foe.stun = 0; say('It cannot move!'); await wait(900); return; }
      if (foe.sleep) { foe.sleep--; say(foe.sleep ? 'It sleeps on.' : 'It wakes up!'); await wait(900); return; }
      say(foe.name.replace('Jealous ', '') + ' strikes!'); foeFx.dy = 3; setTimeout(function () { foeFx.dy = 0; }, 150);
      await projectile(false, COL[foe.el]);
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
      var kind = recognize(trail), t0 = trail; setTimeout(function () { if (trail === t0) trail = []; }, 250);
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
