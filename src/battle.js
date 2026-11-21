// Spirit battle. Two roles:
//   the hontori fights with ITS OWN MOVES (3 per element, see src/moves.js), tapped at the bottom;
//   the kid SUPPORTS with wand spells, drawn as arcane sigils anywhere on the arena (one per turn, costs mana).
// The foe telegraphs its intent each turn (Strike, Charge, Unleash, Guard, Heal, Hex).
// Element matrix and weather change every attack, both ways. Capture only with the Binding Spiral.
// start(opts) resolves with { won, captured, fled, foeKey, foeLevel, trainer }.
(function () {
  var H = window.H = window.H || {};

  // ---------------------------------------------------------------- elements
  var ELS = ['water', 'fire', 'wind', 'grass', 'electric', 'earth', 'dark', 'light'];
  var STRONG = {
    water: ['fire', 'earth'], fire: ['grass', 'wind'], wind: ['grass', 'electric'], grass: ['water', 'earth'],
    electric: ['water', 'wind'], earth: ['electric', 'fire'], dark: ['light'], light: ['dark']
  };
  function matrix(a, d) {
    if (STRONG[a] && STRONG[a].indexOf(d) >= 0) return 1.6;
    if (STRONG[d] && STRONG[d].indexOf(a) >= 0) return 0.6;
    return 1;
  }
  function isNight(env) { return env.time >= 19 || env.time < 6; }
  function weatherMul(el, env) {
    var w = env.weather, night = isNight(env);
    if (env.indoor) return 1;
    if (w === 'rain') { if (el === 'water' || el === 'electric') return 1.3; if (el === 'fire') return 0.7; }
    if (w === 'wind' && el === 'wind') return 1.3;
    if (w === 'snow') { if (el === 'water') return 1.15; if (el === 'grass') return 0.8; }
    if (w === 'fog' && el === 'dark') return 1.2;
    if (w === 'clear' && !night && (el === 'fire' || el === 'light')) return 1.2;
    if (night && el === 'dark') return 1.25;
    if (night && el === 'light') return 0.85;
    return 1;
  }
  function weatherWhy(el, env) {
    var w = env.weather, night = isNight(env);
    if (w === 'rain') return el === 'fire' ? 'Rain dulls fire' : 'Rain feeds ' + el;
    if (w === 'wind') return 'The wind lifts wind';
    if (w === 'snow') return el === 'grass' ? 'Snow chills grass' : 'Snow helps water';
    if (w === 'fog') return 'Fog hides dark';
    if (night) return el === 'dark' ? 'Night deepens dark' : 'Night dims light';
    return 'Sunlight warms ' + el;
  }
  var COL = { fire: '#ff8a3c', water: '#4aa8ff', wind: '#9ff0e0', grass: '#7ed957', electric: '#7ff0ff', earth: '#c9935a', dark: '#a070ff', light: '#fff2a8' };

  // ---------------------------------------------------------------- spells (drawn)
  var SPELLS = {
    mend: { name: 'Mending Sigil', cost: 1, col: '#9cf0a6', on: 'me', desc: 'Heal and wake', how: 'circle' },
    shield: { name: 'Aegis Ward', cost: 1, col: '#8fd8ff', on: 'me', desc: 'Blocks most of the next hit', how: 'U' },
    boost: { name: 'Rally Rune', cost: 1, col: '#ffb35a', on: 'me', desc: 'Next move +60%', how: 'peak' },
    stun: { name: 'Thunder Seal', cost: 2, col: '#ffe27a', on: 'foe', desc: 'Foe may lose its turn', how: 'zigzag' },
    sleep: { name: 'Dream Veil', cost: 2, col: '#b9a8ff', on: 'foe', desc: 'Foe may fall asleep', how: 'wave' },
    bind: { name: 'Binding Spiral', cost: 2, col: '#ffd98a', on: 'foe', desc: 'Bind a weak foe', how: 'spiral' },
    revive: { name: 'Phoenix Star', cost: 3, col: '#fff0d0', on: 'me', desc: 'Revive with a material', how: 'star' },
    veil: { name: 'Velum Aperi', cost: 0, col: '#ffd98a', on: 'me', desc: 'Lift the veil', how: 'V' }
  };
  var ORDER = ['mend', 'shield', 'boost', 'stun', 'sleep', 'bind', 'revive'];

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
  function circ(n, a0, a1, cx, cy, rx, ry) { var a = []; for (var i = 0; i <= n; i++) { var t = a0 + (a1 - a0) * i / n; a.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]); } return a; }
  var RAW = {
    mend: circ(32, -Math.PI / 2, Math.PI * 1.5, 0, 0, 1, 1),
    // a cup: down the left side, round bottom, up the right side
    shield: [[0, 0], [0, 0.3]].concat(circ(16, Math.PI, 0, 0.5, 0.45, 0.5, 0.55)).concat([[1, 0.3], [1, 0]]).map(function (q, i) { return i > 1 && i < 19 ? [q[0], q[1] < 0.45 ? 0.45 : q[1]] : q; }),
    // a peak / caret
    boost: [[0, 1], [0.5, 0], [1, 1]],
    stun: [[0.35, 0], [0.75, 0.38], [0.25, 0.62], [0.65, 1]],
    sleep: (function () { var a = []; for (var i = 0; i <= 40; i++) { var x = i / 40; a.push([x, 0.5 + 0.22 * Math.sin(x * Math.PI * 4)]); } return a; })(),
    // spiral drawn from the outside in (2 turns)
    bind: (function () { var a = []; for (var i = 0; i <= 60; i++) { var t = i / 60, r = 1 - t * 0.85, ang = -Math.PI / 2 + t * Math.PI * 4; a.push([Math.cos(ang) * r, Math.sin(ang) * r]); } return a; })(),
    // five-point star in one stroke
    revive: (function () { var a = []; for (var i = 0; i <= 5; i++) { var ang = -Math.PI / 2 + i * Math.PI * 4 / 5; a.push([Math.cos(ang), Math.sin(ang)]); } return a; })(),
    // the veil spell from the intro: a V, opening the curtain
    veil: [[0, 0], [0.5, 1], [1, 0]]
  };
  var TEMPLATES = {};
  Object.keys(RAW).forEach(function (k) { TEMPLATES[k] = { closed: k === 'mend' || k === 'revive', rot: k === 'bind', pts: normalize(RAW[k]) }; });
  TEMPLATES.absorb = TEMPLATES.bind; // old name
  // glyph points centred on their bounding box, size 1 (for drawing sigils)
  var GLYPH = {};
  function glyphPts(k) {
    if (GLYPH[k]) return GLYPH[k];
    var r = resample(RAW[k], 64), minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
    r.forEach(function (q) { minx = Math.min(minx, q[0]); maxx = Math.max(maxx, q[0]); miny = Math.min(miny, q[1]); maxy = Math.max(maxy, q[1]); });
    var s = Math.max(maxx - minx, maxy - miny) || 1, cx = (minx + maxx) / 2, cy = (miny + maxy) / 2;
    if (k === 'mend' || k === 'revive') r.push(r[0]);
    return (GLYPH[k] = r.map(function (q) { return [(q[0] - cx) / s, (q[1] - cy) / s]; }));
  }
  function score(raw, allowed, tol) {
    if (!raw || raw.length < 6 || pathLen(raw) < 30) return null;
    var g = normalize(raw), gr = g.slice().reverse(), best = null, bestD = 1e9;
    // count sharp corners: smooth sigils (circle, wave, spiral) must not accept a cornered stroke
    // such as a triangle, and the star needs real points
    var corners = 0, lastC = -9;
    for (var ci0 = 3; ci0 < g.length - 3; ci0++) {
      var ax = g[ci0][0] - g[ci0 - 3][0], ay = g[ci0][1] - g[ci0 - 3][1], bx = g[ci0 + 3][0] - g[ci0][0], by = g[ci0 + 3][1] - g[ci0][1];
      var la = Math.hypot(ax, ay), lb = Math.hypot(bx, by); if (!la || !lb) continue;
      var cosT = (ax * bx + ay * by) / (la * lb);
      if (cosT < 0.35 && ci0 - lastC > 4) { corners++; lastC = ci0; }
    }
    var SMOOTH = { mend: 1, sleep: 1, bind: 1, absorb: 1 };
    (allowed || ORDER.concat(['veil'])).forEach(function (k) {
      var T = TEMPLATES[k]; if (!T) return;
      if (SMOOTH[k] && corners >= 2) return;
      if (k === 'revive' && corners < 3) return;
      var shifts = T.closed ? 12 : 1, cands = [g, gr];
      if (T.rot) { cands = []; for (var r = 0; r < 16; r++) { var a = r / 16 * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
        [1, -1].forEach(function (m) { cands.push(g.map(function (q) { return [(q[0] * c - q[1] * sn) * m, q[0] * sn + q[1] * c]; })); }); } }
      for (var s = 0; s < shifts; s++) {
        var off = Math.round(s * N / shifts), tp = T.closed ? T.pts.slice(off).concat(T.pts.slice(0, off)) : T.pts;
        for (var ci = 0; ci < cands.length; ci++) { var d = dist(cands[ci], tp); if (d < bestD) { bestD = d; best = k; } }
      }
    });
    var lim = (best === 'revive' ? 0.16 : 0.2) + ((tol && tol[best]) || 0);
    return { kind: bestD < lim ? best : null, guess: best, d: bestD, acc: Math.max(0, Math.min(1, 1 - bestD / lim)) };
  }
  function recognize(raw, allowed) { var s = score(raw, allowed); return s && s.kind; }

  // ---------------------------------------------------------------- arcane sigils
  var RUNES = [
    [[[0, -1], [0, 1]], [[0, -0.2], [0.7, -0.9]]],
    [[[-0.6, -1], [0.6, 0], [-0.6, 1]]],
    [[[0, -1], [0, 1]], [[-0.7, -0.3], [0.7, 0.3]]],
    [[[-0.6, 1], [0, -1], [0.6, 1]], [[-0.3, 0.2], [0.3, 0.2]]],
    [[[-0.6, -1], [0.6, -1], [-0.6, 1], [0.6, 1]]],
    [[[0, -1], [0.7, 0], [0, 1], [-0.7, 0], [0, -1]]],
    [[[-0.6, -1], [-0.6, 1]], [[0.6, -1], [0.6, 1]], [[-0.6, 0], [0.6, 0]]],
    [[[-0.7, -1], [0, 0], [0.7, -1]], [[0, 0], [0, 1]]]
  ];
  function rgba(h, a) { var n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function polyStroke(g, pts, w, col, a) { if (pts.length < 2) return; g.globalAlpha = a; g.lineWidth = w; g.strokeStyle = col; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.stroke(); }
  function inkStroke(g, pts, w, col, a) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
    polyStroke(g, pts, w * 4.5, col, 0.16 * a); polyStroke(g, pts, w * 2.2, col, 0.55 * a); polyStroke(g, pts, w * 0.8, '#ffffff', a);
    g.restore();
  }
  // Magic circle: double ring, rotating rune band, counter-rotating inner ticks, inner star geometry, the spell glyph.
  function drawSigil(g, kind, x, y, r, col, o) {
    o = o || {}; var rot = o.rot || 0, a = o.alpha == null ? 1 : o.alpha, flat = o.flat || 1, lw = Math.max(0.6, r * 0.035) * (o.lw || 1);
    if (a <= 0) return;
    g.save(); g.translate(x, y); g.scale(1, flat); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
    function ringAt(rr, w, al) { g.globalAlpha = al * a; g.lineWidth = w; g.strokeStyle = col; g.beginPath(); g.arc(0, 0, rr, 0, 6.283); g.stroke(); }
    ringAt(r, lw * 3, 0.18); ringAt(r, lw, 0.95); ringAt(r * 0.84, lw * 0.8, 0.8);
    // rune band
    var nR = 10;
    for (var i = 0; i < nR; i++) {
      var an = rot + i / nR * 6.283, cx = Math.cos(an) * r * 0.92, cy = Math.sin(an) * r * 0.92, rs = r * 0.055;
      g.save(); g.translate(cx, cy); g.rotate(an + Math.PI / 2);
      RUNES[(i + (o.seed || 0)) % RUNES.length].forEach(function (ln) { polyStroke(g, ln.map(function (q) { return [q[0] * rs, q[1] * rs]; }), lw * 0.7, '#ffffff', 0.85 * a); });
      g.restore();
      var tb = an + 3.14159 / nR; g.globalAlpha = 0.7 * a; g.lineWidth = lw * 0.7; g.strokeStyle = col; g.beginPath();
      g.moveTo(Math.cos(tb) * r * 0.86, Math.sin(tb) * r * 0.86); g.lineTo(Math.cos(tb) * r * 0.98, Math.sin(tb) * r * 0.98); g.stroke();
    }
    // inner counter-rotating tick ring
    if (!o.simple) {
      g.globalAlpha = 0.6 * a; g.strokeStyle = col; g.lineWidth = lw * 0.6; g.beginPath();
      for (var j = 0; j < 24; j++) { var b = -rot * 1.4 + j / 24 * 6.283, l = j % 3 ? 0.06 : 0.11; g.moveTo(Math.cos(b) * r * 0.7, Math.sin(b) * r * 0.7); g.lineTo(Math.cos(b) * r * (0.7 - l), Math.sin(b) * r * (0.7 - l)); }
      g.stroke(); ringAt(r * 0.72, lw * 0.5, 0.45);
      // faint hexagram
      g.globalAlpha = 0.22 * a; g.lineWidth = lw * 0.6; g.beginPath();
      for (var h = 0; h < 2; h++) for (var v = 0; v <= 3; v++) { var c = rot * 0.5 + h * Math.PI / 3 + v * 2.094; if (v) g.lineTo(Math.cos(c) * r * 0.84, Math.sin(c) * r * 0.84); else g.moveTo(Math.cos(c) * r * 0.84, Math.sin(c) * r * 0.84); }
      g.stroke();
    }
    g.restore();
    // the glyph itself (flattened the same way)
    var gs = r * (o.glyph || 1.0), pts = glyphPts(kind).map(function (q) { return [x + q[0] * gs, y + q[1] * gs * flat]; });
    inkStroke(g, pts, lw * 1.4, col, a);
  }
  function sigilSVG(kind, col, locked) {
    var c = locked ? '#6a6a80' : col, p = glyphPts(kind), s = '';
    p.forEach(function (q, i) { s += (i ? 'L' : 'M') + (q[0] * 26).toFixed(1) + ' ' + (q[1] * 26).toFixed(1); });
    var ticks = '', runes = '';
    for (var i = 0; i < 8; i++) {
      var an = i / 8 * 6.283 - Math.PI / 2, cx = Math.cos(an) * 27, cy = Math.sin(an) * 27;
      RUNES[i % RUNES.length].forEach(function (ln) {
        var d = ''; ln.forEach(function (q, k) { var rx = q[0] * 1.5, ry = q[1] * 1.5, ca = Math.cos(an + Math.PI / 2), sa = Math.sin(an + Math.PI / 2);
          d += (k ? 'L' : 'M') + (cx + rx * ca - ry * sa).toFixed(1) + ' ' + (cy + rx * sa + ry * ca).toFixed(1); });
        runes += '<path d="' + d + '"/>';
      });
      var tb = an + Math.PI / 8; ticks += '<path d="M' + (Math.cos(tb) * 25).toFixed(1) + ' ' + (Math.sin(tb) * 25).toFixed(1) + 'L' + (Math.cos(tb) * 29).toFixed(1) + ' ' + (Math.sin(tb) * 29).toFixed(1) + '"/>';
    }
    return '<svg viewBox="-32 -32 64 64" style="filter:drop-shadow(0 0 3px ' + c + ')"><g fill="none" stroke="' + c + '" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle r="30" stroke-width="1.4"/><circle r="24.5" stroke-width="1" opacity=".8"/><g stroke-width="1" opacity=".9">' + ticks + '</g>' +
      '<g stroke="' + (locked ? '#8a8aa0' : '#fff') + '" stroke-width=".9">' + runes + '</g>' +
      '<path d="' + s + '" stroke-width="7" opacity=".25"/><path d="' + s + '" stroke-width="3.6"/><path d="' + s + '" stroke="#fff" stroke-width="1.4" opacity="' + (locked ? 0.4 : 1) + '"/></g></svg>';
  }
  // rune specks that peel off the ink while drawing
  function runeSpeck(g, p) {
    var R = RUNES[p.r], s = p.s;
    g.save(); g.globalCompositeOperation = 'lighter'; g.translate(p.x, p.y); g.rotate(p.a);
    R.forEach(function (ln) { polyStroke(g, ln.map(function (q) { return [q[0] * s, q[1] * s]; }), Math.max(0.5, s * 0.35), p.c, Math.min(1, p.l)); });
    g.restore();
  }

  // ---------------------------------------------------------------- shared ink + particles (screen space helpers)
  function Ink(scale) {
    var o = { trail: [], parts: [], col: '#ffd98a', guess: null, n: 0, lastHum: 0 };
    o.add = function (p) {
      o.trail.push(p); o.n++;
      if (o.n % 3 === 0) o.parts.push({ x: p[0], y: p[1], vx: (Math.random() - 0.5) * 0.6 * scale, vy: (-0.3 - Math.random() * 0.5) * scale, l: 1.2, d: 0.025, r: (Math.random() * RUNES.length) | 0, a: Math.random() * 6, s: (1.4 + Math.random()) * scale, c: o.col, rune: 1 });
      if (Math.random() < 0.6) o.parts.push({ x: p[0], y: p[1], vx: (Math.random() - 0.5) * 1.2 * scale, vy: (Math.random() - 0.7) * scale, l: 0.8, d: 0.04, c: Math.random() < 0.5 ? '#fff' : o.col, s: scale * (Math.random() < 0.5 ? 0.8 : 1.3) });
      var now = performance.now(); if (o.n % 18 === 0 && now - o.lastHum > 380) { o.lastHum = now; sfx('sparkle'); }
    };
    o.ash = function () {
      o.trail.forEach(function (p, i) { if (i % 2) return; o.parts.push({ x: p[0], y: p[1], vx: (Math.random() - 0.5) * 0.4 * scale, vy: Math.random() * 0.2 * scale, g: 0.05 * scale, l: 1, d: 0.018, c: ['#5a5a62', '#8a8890', '#3a3a40', '#a07050'][i % 4], s: scale * (1 + Math.random()), n: 1 }); });
      o.trail = [];
    };
    o.draw = function (g, w) {
      if (o.trail.length > 1) inkStroke(g, o.trail, w, o.col, 1);
      for (var i = o.parts.length - 1; i >= 0; i--) {
        var p = o.parts[i]; p.x += p.vx; p.y += p.vy; p.vy += p.g || 0; p.l -= p.d; if (p.l <= 0) { o.parts.splice(i, 1); continue; }
        if (p.rune) { runeSpeck(g, p); continue; }
        g.globalCompositeOperation = p.n ? 'source-over' : 'lighter'; g.globalAlpha = Math.min(1, p.l); g.fillStyle = p.c; g.fillRect(p.x, p.y, p.s, p.s);
      }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    };
    return o;
  }

  // Full-screen "draw this sigil" prompt (intro Velum Aperi, school trial). Resolves when drawn correctly.
  function prompt(kind, text) {
    return new Promise(function (resolve) {
      var root = document.getElementById('root') || document.body;
      var el = document.createElement('div');
      el.style.cssText = 'position:absolute;inset:0;z-index:44;touch-action:none;background:radial-gradient(ellipse at 50% 52%,rgba(40,24,70,.35),rgba(6,6,18,.62))';
      var cv = document.createElement('canvas'); cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none'; el.appendChild(cv);
      var tip = document.createElement('div');
      tip.style.cssText = 'position:absolute;left:12px;right:12px;top:16%;text-align:center;color:#fff4d6;font:900 clamp(18px,5vmin,26px) Nunito,system-ui,sans-serif;text-shadow:0 0 12px rgba(255,200,120,.6),0 2px 0 rgba(0,0,0,.6);pointer-events:none';
      tip.textContent = text; el.appendChild(tip); root.appendChild(el);
      var sp = SPELLS[kind] || SPELLS.veil, col = sp.col;
      var g = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), drawing = false, live = true, T0 = performance.now(), ink = Ink(2), win = 0, fx = [];
      ink.col = col;
      function size() { cv.width = el.clientWidth * dpr; cv.height = el.clientHeight * dpr; }
      size();
      var guide = glyphPts(kind);
      function frame(ms) {
        if (!live) return;
        if (Math.round(el.clientWidth * dpr) !== cv.width) size();
        var w = el.clientWidth, h = el.clientHeight, s = Math.min(w, h) * 0.5, cx = w / 2, cy = h * 0.54, t = (ms - T0) / 1000;
        g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
        if (!win) {
          drawSigil(g, kind, cx, cy, s * 0.72, col, { rot: t * 0.25, alpha: 0.45 + 0.1 * Math.sin(t * 2), glyph: 0 });
          // dashed glyph guide + a dot travelling along it
          g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.setLineDash([6, 10]); g.lineWidth = 4; g.strokeStyle = rgba(col, 0.45);
          g.beginPath(); guide.forEach(function (q, i) { var x = cx + q[0] * s * 0.85, y = cy + q[1] * s * 0.85; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke(); g.restore();
          // glide smoothly along the guide by path length (slow, to help the player follow)
          if (!guide._len) { guide._acc = [0]; for (var gi = 1; gi < guide.length; gi++) guide._acc.push(guide._acc[gi - 1] + Math.hypot(guide[gi][0] - guide[gi - 1][0], guide[gi][1] - guide[gi - 1][1])); guide._len = guide._acc[guide._acc.length - 1] || 1; }
          var dist0 = (t / 3.2 % 1) * guide._len, seg = 1; while (seg < guide.length - 1 && guide._acc[seg] < dist0) seg++;
          var sa = guide._acc[seg - 1], sb = guide._acc[seg], fr0 = sb > sa ? (dist0 - sa) / (sb - sa) : 0;
          var q = [guide[seg - 1][0] + (guide[seg][0] - guide[seg - 1][0]) * fr0, guide[seg - 1][1] + (guide[seg][1] - guide[seg - 1][1]) * fr0];
          g.globalCompositeOperation = 'lighter'; g.fillStyle = rgba(col, 0.35); g.beginPath(); g.arc(cx + q[0] * s * 0.85, cy + q[1] * s * 0.85, 12, 0, 7); g.fill();
          g.fillStyle = '#fff'; g.beginPath(); g.arc(cx + q[0] * s * 0.85, cy + q[1] * s * 0.85, 5, 0, 7); g.fill(); g.globalCompositeOperation = 'source-over';
        } else {
          // success: the sigil flares, then opens into a huge turning magic circle with light rays
          var u = (ms - win) / 1000, a = u < 0.15 ? 1 : Math.max(0, 1 - (u - 0.6) / 0.6);
          g.globalCompositeOperation = 'lighter';
          var gr = g.createRadialGradient(cx, cy, 0, cx, cy, s * (0.4 + u * 1.2)); gr.addColorStop(0, rgba(col, 0.5 * a)); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
          for (var rr = 0; rr < 12; rr++) { var an = rr / 12 * 6.283 + u; g.globalAlpha = 0.25 * a; g.strokeStyle = '#fff6e0'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx + Math.cos(an) * s * 0.3, cy + Math.sin(an) * s * 0.3); g.lineTo(cx + Math.cos(an) * s * (0.6 + u * 1.5), cy + Math.sin(an) * s * (0.6 + u * 1.5)); g.stroke(); }
          g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
          drawSigil(g, kind, cx, cy, s * (0.72 + u * 0.7), col, { rot: t * 1.6, alpha: a, lw: 1.4 });
          drawSigil(g, kind, cx, cy, s * (0.4 + u * 0.3), '#ffffff', { rot: -t * 2.2, alpha: a * 0.6, simple: true, glyph: 0, seed: 3 });
        }
        ink.draw(g, 2.4);
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
      function pt(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
      var pid = null;
      cv.addEventListener('pointerdown', function (e) { if (win) return; pid = e.pointerId; try { cv.setPointerCapture(pid); } catch (_) {} drawing = true; ink.trail = [pt(e)]; e.preventDefault(); });
      cv.addEventListener('pointermove', function (e) { if (!drawing || e.pointerId !== pid) return; ink.add(pt(e)); });
      function up(e) {
        if (!drawing || e.pointerId !== pid) return; drawing = false;
        if (recognize(ink.trail, [kind]) === kind) {
          tip.textContent = ''; win = performance.now(); ink.trail = []; sfx('wand');
          var w = el.clientWidth, h = el.clientHeight;
          for (var i = 0; i < 90; i++) { var a = Math.random() * 6.28, v = Math.random() * 7; ink.parts.push({ x: w / 2, y: h * 0.54, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 1.4, d: 0.02, c: i % 3 ? col : '#fff', s: 3 }); }
          setTimeout(function () { live = false; el.remove(); resolve(); }, 1250);
        } else { tip.textContent = 'Almost. Follow the glowing line.'; ink.ash(); sfx('bump'); }
      }
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    });
  }
  H.gesture = { recognize: recognize, score: score, prompt: prompt, templates: RAW, drawSigil: drawSigil, sigilSVG: sigilSVG };

  // ---------------------------------------------------------------- scene (backgrounds)
  function rng(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
  function mkc(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
  function todOf(t) { return t >= 5 && t < 8 ? 'dawn' : t >= 8 && t < 17 ? 'day' : t >= 17 && t < 20 ? 'dusk' : 'night'; }
  var SKY = { dawn: ['#4a5a9a', '#e8a0a8', '#ffd6a8'], day: ['#3f9be8', '#93d2ff', '#dcf3ff'], dusk: ['#2a2860', '#b0507a', '#ff9e5e'], night: ['#060a20', '#121a44', '#24305e'] };
  var TINT = { dawn: 'rgba(255,140,150,.16)', day: null, dusk: 'rgba(200,80,60,.26)', night: 'rgba(14,24,72,.58)' };
  var BIOME = {
    meadow: { ground: '#86c95e', dark: '#5fa846', light: '#a8e07a', hill1: '#79bd68', hill2: '#5aa456' },
    forest: { ground: '#4f8a3e', dark: '#3a6c30', light: '#6aa84e', hill1: '#2f5a3a', hill2: '#24482e' },
    river: { ground: '#7cc062', dark: '#5a9e4a', light: '#9fd87a', hill1: '#6aa86a', hill2: '#4f8e58' },
    indoor: { ground: '#9a6a42', dark: '#7a4e2e', light: '#b8845a' }
  };
  function buildScene(W, Hh, biome, env, P) {
    var tod = todOf(env.time), wx = env.weather || 'clear', B = BIOME[biome] || BIOME.meadow, R = rng(Math.round(W * 13 + Hh * 7) + biome.length * 977);
    var hz = Math.round(Hh * 0.25), wet = wx === 'rain' || wx === 'fog', snow = wx === 'snow';
    var sky = mkc(W, Hh * 0.45), land = mkc(W, Hh), sg = sky.getContext('2d'), g = land.getContext('2d');
    var S = { sky: sky, land: land, hz: hz, tod: tod, clouds: [], tufts: [], reeds: [], flies: [], stars: [], fog: null, shafts: null, fgL: null, fgR: null, drops: [], ripples: [], leaves: [], biome: biome, river: null };
    // --- sky
    var c3 = SKY[tod], gr = sg.createLinearGradient(0, 0, 0, sky.height); gr.addColorStop(0, c3[0]); gr.addColorStop(0.65, c3[1]); gr.addColorStop(1, c3[2]);
    sg.fillStyle = gr; sg.fillRect(0, 0, W, sky.height);
    if (tod === 'night') for (var i = 0; i < 70; i++) { var sx = R() * W, sy = R() * hz * 1.1; sg.fillStyle = 'rgba(255,255,255,' + (0.3 + R() * 0.6) + ')'; sg.fillRect(sx | 0, sy | 0, 1, 1); if (i < 10) S.stars.push([sx | 0, sy | 0]); }
    var sun = { dawn: [W * 0.8, hz - 4, 6, '#ffd0b0'], day: [W * 0.2, hz * 0.32, 6, '#fffbe0'], dusk: [W * 0.25, hz - 2, 8, '#ffb070'], night: [W * 0.22, hz * 0.34, 5, '#f4f0dc'] }[tod];
    var hazy = wet || snow;
    var sgr = sg.createRadialGradient(sun[0], sun[1], 0, sun[0], sun[1], sun[2] * 5); sgr.addColorStop(0, rgba(sun[3], hazy ? 0.35 : 0.6)); sgr.addColorStop(1, 'rgba(0,0,0,0)');
    sg.fillStyle = sgr; sg.fillRect(0, 0, W, sky.height);
    sg.fillStyle = sun[3]; sg.globalAlpha = hazy ? 0.5 : 1; sg.beginPath(); sg.arc(sun[0], sun[1], sun[2], 0, 6.283); sg.fill();
    if (tod === 'night') { sg.fillStyle = c3[1]; sg.beginPath(); sg.arc(sun[0] + 2.5, sun[1] - 1.5, sun[2] * 0.85, 0, 6.283); sg.fill(); sg.fillStyle = 'rgba(200,200,180,.5)'; sg.fillRect(sun[0] - 3, sun[1], 1, 1); sg.fillRect(sun[0] - 2, sun[1] + 2, 1, 1); }
    sg.globalAlpha = 1;
    if (hazy) { sg.fillStyle = wx === 'rain' ? 'rgba(90,100,120,.45)' : 'rgba(200,210,220,.35)'; sg.fillRect(0, 0, W, sky.height); }
    // --- clouds (sprites)
    var cc = tod === 'night' ? '#3a4472' : tod === 'dusk' ? '#f0a088' : tod === 'dawn' ? '#ffdcd4' : '#ffffff';
    if (wx === 'rain') cc = tod === 'night' ? '#2a3048' : '#8a92a4';
    var nc = wx === 'rain' || wx === 'snow' ? 6 : wx === 'clear' ? 3 : 4;
    for (var k = 0; k < nc; k++) {
      var cw = 18 + R() * 22, ch = 8 + R() * 5, cs = mkc(cw, ch), cg = cs.getContext('2d');
      for (var b = 0; b < 6; b++) { cg.fillStyle = b < 2 ? shade(cc, -0.12) : cc; var bx = 3 + R() * (cw - 10), br = 2 + R() * 3.5; cg.beginPath(); cg.arc(bx + br, ch - br - (b < 2 ? 0 : 1.5), br, 0, 6.283); cg.fill(); }
      cg.fillStyle = shade(cc, -0.12); cg.fillRect(2, ch - 2, cw - 4, 2);
      S.clouds.push({ c: cs, x: R() * W, y: 2 + R() * (hz - 10), v: (0.6 + R() * 1.4) * (wx === 'wind' ? 4 : 1) });
    }
    // --- land layers
    if (biome === 'indoor') buildIndoor(g, W, Hh, hz, tod, env, R, S, B, P, sky);
    else {
      // far mountains
      mountains(g, W, hz + 1, 26, R, '#9aaecb', snow || R() < 0.5);
      mountains(g, W, hz + 2, 16, R, '#7f98b8', snow);
      if (biome === 'forest') {
        // dark pines along the horizon
        for (var p = -4; p < W + 4; p += 3 + R() * 4) pine(g, p, hz + 6 + R() * 3, 9 + R() * 10, R() < 0.5 ? B.hill1 : B.hill2, snow);
      } else {
        hills(g, W, hz + 4, 7, R, B.hill1, 0.05); hills(g, W, hz + 9, 5, R, B.hill2, 0.08);
        for (var tr = 0; tr < 6; tr++) roundTree(g, R() * W, hz + 5 + R() * 6, 3 + R() * 2, shade(B.hill2, -0.15));
      }
      // ground
      var gg = g.createLinearGradient(0, hz + 6, 0, Hh); gg.addColorStop(0, shade(B.ground, -0.08)); gg.addColorStop(1, B.ground);
      g.fillStyle = gg; g.fillRect(0, hz + 8, W, Hh - hz);
      if (biome !== 'forest') { g.fillStyle = B.hill2; g.fillRect(0, hz + 8, W, 2); }
      // texture: dithered specks + perspective grass marks
      for (var y = hz + 9; y < Hh; y++) {
        var depth = (y - hz) / (Hh - hz), n = Math.round(W * 0.06 * (0.5 + depth));
        for (var q = 0; q < n; q++) { var x = R() * W | 0; g.fillStyle = R() < 0.5 ? B.dark : B.light; g.fillRect(x, y, depth > 0.4 && R() < 0.4 ? 1 : 1, depth > 0.4 && R() < 0.5 ? 2 : 1); }
      }
      if (biome === 'forest') {
        // leaf litter and moss
        for (var lf = 0; lf < 120; lf++) { g.fillStyle = ['#a8682a', '#c08a3a', '#6a4a22', '#88b048'][lf % 4]; g.fillRect(R() * W | 0, hz + 10 + R() * (Hh - hz) | 0, 2, 1); }
        // tall trunks (some behind, some in front of the far ground)
        var tx = [0.04, 0.2, 0.46, 0.62, 0.9, 0.98];
        tx.forEach(function (fx, i) { var near = i % 2 === 0, bw = near ? 7 + R() * 4 : 4 + R() * 2, base = near ? hz + 18 + R() * 8 : hz + 9; trunk(g, W * fx, base, bw, shade('#4a3424', near ? 0 : 0.12)); });
        // canopy along the top
        for (var cn = 0; cn < 40; cn++) { var cx2 = R() * W, cy2 = R() * hz * 0.5 - 4, rr = 5 + R() * 8; g.fillStyle = ['#1f4a2a', '#2a5a32', '#18402a'][cn % 3]; g.beginPath(); g.arc(cx2, cy2, rr, 0, 6.283); g.fill(); }
        for (var hl = 0; hl < 30; hl++) { g.fillStyle = '#3f7a44'; g.fillRect(R() * W | 0, R() * hz * 0.45 | 0, 2, 1); }
        // light shafts (cached, pulsed at draw time)
        if (tod !== 'night' && wx !== 'rain') {
          var sh = mkc(W, Hh), shg = sh.getContext('2d');
          for (var s2 = 0; s2 < 4; s2++) { var x0 = W * (0.1 + s2 * 0.26 + R() * 0.08), wd = 5 + R() * 7, lg = shg.createLinearGradient(0, 0, 0, Hh * 0.75); lg.addColorStop(0, 'rgba(255,248,200,.5)'); lg.addColorStop(1, 'rgba(255,248,200,0)');
            shg.fillStyle = lg; shg.beginPath(); shg.moveTo(x0, 0); shg.lineTo(x0 + wd, 0); shg.lineTo(x0 + wd + 26, Hh * 0.75); shg.lineTo(x0 + 22, Hh * 0.75); shg.fill(); }
          S.shafts = sh;
        }
        for (var ms2 = 0; ms2 < 6; ms2++) mushroom(g, R() * W, hz + 16 + R() * (Hh * 0.5), R);
      }
      if (biome === 'river') {
        var ry0 = Math.round(Hh * 0.47), ry1 = Math.round(Hh * 0.545);
        g.fillStyle = '#d8c48a'; g.fillRect(0, ry0 - 4, W, ry1 - ry0 + 9);
        g.fillStyle = '#b8a46a'; g.fillRect(0, ry0 - 1, W, 1); g.fillRect(0, ry1 + 1, W, 2);
        var wgr = g.createLinearGradient(0, ry0, 0, ry1); wgr.addColorStop(0, '#2f78c0'); wgr.addColorStop(1, '#3f9ad8'); g.fillStyle = wgr; g.fillRect(0, ry0, W, ry1 - ry0 + 1);
        for (var pb = 0; pb < 40; pb++) { g.fillStyle = R() < 0.5 ? '#9a9080' : '#c8bca0'; g.fillRect(R() * W | 0, (R() < 0.5 ? ry0 - 4 + R() * 3 : ry1 + 2 + R() * 5) | 0, 1, 1); }
        S.river = [ry0, ry1];
        for (var rd = 0; rd < 14; rd++) S.reeds.push({ x: R() * W, y: (rd % 2 ? ry0 - 2 : ry1 + 5) + R() * 2, h: 6 + R() * 6 });
      }
      if (biome === 'meadow') for (var fl = 0; fl < 70; fl++) { var fy = hz + 12 + R() * (Hh * 0.7 - hz), fx2 = R() * W; g.fillStyle = ['#ffffff', '#ffd84a', '#ff8ab0', '#b8a0ff', '#ff6a5a'][fl % 5]; g.fillRect(fx2 | 0, fy | 0, 1, 1); if ((fy - hz) / Hh > 0.2) { g.fillRect((fx2 | 0) + 1, fy | 0, 1, 1); g.fillStyle = '#4a8a3a'; g.fillRect(fx2 | 0, (fy | 0) + 1, 1, 1); } }
      if (snow) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(240,246,255,.5)'; g.fillRect(0, hz + 8, W, Hh); g.globalCompositeOperation = 'source-over';
        for (var sn = 0; sn < 260; sn++) { g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(R() * W | 0, hz + 9 + R() * (Hh - hz) | 0, R() < 0.3 ? 2 : 1, 1); } }
      // swaying tufts and flowers
      var nT = biome === 'forest' ? 26 : 36;
      for (var tf = 0; tf < nT; tf++) {
        var ty = hz + 12 + R() * (Hh * 0.78 - hz), tx2 = R() * W;
        if (Math.abs(tx2 - P.foe.x) < 30 && Math.abs(ty - P.foe.gy) < 10) continue;
        if (Math.abs(tx2 - P.me.x) < 38 && Math.abs(ty - P.me.gy) < 12) continue;
        if (S.river && ty > S.river[0] - 6 && ty < S.river[1] + 8) continue;
        var dp = (ty - hz) / (Hh - hz);
        S.tufts.push({ x: tx2, y: ty, h: 2 + dp * 6, c: R() < 0.5 ? B.dark : shade(B.dark, -0.15), f: biome === 'meadow' && R() < 0.35 ? ['#fff', '#ffd84a', '#ff8ab0', '#b8a0ff'][tf % 4] : null, ph: R() * 6 });
      }
      S.tufts.sort(function (a, b) { return a.y - b.y; });
    }
    // --- battle platforms
    platform(g, P.foe.x, P.foe.gy, 30, biome === 'river' ? 'stone' : biome === 'indoor' ? 'rug' : biome === 'forest' ? 'moss' : 'grass', R, snow);
    platform(g, P.me.x, P.me.gy, 40, biome === 'river' ? 'sand' : biome === 'indoor' ? 'rug2' : biome === 'forest' ? 'moss' : 'grass', R, snow);
    // time-of-day / weather tint on everything below the sky
    if (TINT[tod]) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = TINT[tod]; g.fillRect(0, 0, W, Hh); g.globalCompositeOperation = 'source-over'; }
    if (wet && biome !== 'indoor') { g.globalCompositeOperation = 'source-atop'; g.fillStyle = wx === 'rain' ? 'rgba(60,70,100,.22)' : 'rgba(200,210,225,.18)'; g.fillRect(0, 0, W, Hh); g.globalCompositeOperation = 'source-over'; }
    // --- foreground foliage (cached), swayed with a skew at draw time
    if (biome !== 'indoor') { S.fgL = foliage(biome, R, tod, snow, false); S.fgR = foliage(biome, R, tod, snow, true); }
    // --- weather pools
    if (wx === 'rain') for (var d = 0; d < 90; d++) S.drops.push({ x: R() * W * 1.2, y: R() * Hh, v: 150 + R() * 80 });
    if (snow) for (var d2 = 0; d2 < 70; d2++) S.drops.push({ x: R() * W, y: R() * Hh, v: 10 + R() * 14, ph: R() * 6, s: R() < 0.2 ? 2 : 1 });
    if (wx === 'wind' || biome === 'forest') for (var l2 = 0; l2 < (wx === 'wind' ? 14 : 5); l2++) S.leaves.push({ x: R() * W, y: R() * Hh * 0.8, v: wx === 'wind' ? 30 + R() * 30 : 4 + R() * 5, ph: R() * 6, c: ['#a8d860', '#e0a040', '#7ec050'][l2 % 3] });
    if (wx === 'fog') {
      var fc = mkc(W * 2, 34), fg2 = fc.getContext('2d');
      for (var f2 = 0; f2 < 26; f2++) { var fx3 = R() * W * 2, fy3 = 10 + R() * 14, fr = 8 + R() * 12, rg = fg2.createRadialGradient(fx3, fy3, 0, fx3, fy3, fr); rg.addColorStop(0, 'rgba(225,232,240,.55)'); rg.addColorStop(1, 'rgba(225,232,240,0)'); fg2.fillStyle = rg; fg2.fillRect(fx3 - fr, fy3 - fr, fr * 2, fr * 2);
        if (fx3 < fr) { fg2.fillRect(fx3 - fr + W * 2, fy3 - fr, fr * 2, fr * 2); } }
      S.fog = fc;
    }
    if (biome !== 'indoor' && wx === 'clear') {
      if (tod === 'night') for (var ff = 0; ff < 9; ff++) S.flies.push({ x: R() * W, y: hz + 14 + R() * Hh * 0.45, ph: R() * 6, k: 'fly' });
      else if (biome === 'meadow') for (var bf = 0; bf < 3; bf++) S.flies.push({ x: R() * W, y: hz + 20 + R() * Hh * 0.3, ph: R() * 6, k: 'bfly', c: ['#ffffff', '#ffd84a', '#ff9ac8'][bf] });
    }
    return S;
  }
  function shade(h, k) { var n = parseInt(h.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; function f(v) { return Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); } return '#' + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1); }
  function mountains(g, W, base, hmax, R, col, caps) {
    var pts = [], x = -4, y = base - hmax * 0.4;
    while (x < W + 8) { pts.push([x, y]); x += 4 + R() * 8; y = base - hmax * (0.25 + R() * 0.75); }
    g.fillStyle = col; g.beginPath(); g.moveTo(-4, base + 4); pts.forEach(function (p) { g.lineTo(p[0], p[1]); }); g.lineTo(W + 8, base + 4); g.fill();
    g.fillStyle = shade(col, 0.18); for (var i = 0; i < pts.length - 1; i++) { var p = pts[i], q = pts[i + 1]; if (q[1] > p[1]) { g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.lineTo(p[0] + (q[0] - p[0]) * 0.3, base + 4); g.fill(); } }
    if (caps) { g.fillStyle = 'rgba(250,252,255,.9)'; pts.forEach(function (p) { if (p[1] < base - hmax * 0.7) { g.beginPath(); g.moveTo(p[0] - 3, p[1] + 3); g.lineTo(p[0], p[1]); g.lineTo(p[0] + 3, p[1] + 3); g.fill(); } }); }
  }
  function hills(g, W, base, amp, R, col, f) {
    var ph = R() * 6, ph2 = R() * 6; g.fillStyle = col; g.beginPath(); g.moveTo(0, base + 20);
    for (var x = 0; x <= W; x += 2) g.lineTo(x, base - amp * (0.5 + 0.5 * Math.sin(x * f + ph)) - amp * 0.4 * Math.sin(x * f * 2.7 + ph2));
    g.lineTo(W, base + 20); g.fill();
  }
  function pine(g, x, base, h, col, snow) {
    g.fillStyle = col; g.beginPath(); g.moveTo(x - h * 0.3, base); g.lineTo(x, base - h); g.lineTo(x + h * 0.3, base); g.fill();
    if (snow) { g.fillStyle = 'rgba(240,246,255,.8)'; g.fillRect(x - 1, base - h + 1, 2, 2); }
  }
  function roundTree(g, x, y, r, col) { g.fillStyle = '#4a3a2a'; g.fillRect(x - 0.5, y, 1, 3); g.fillStyle = col; g.beginPath(); g.arc(x, y - r * 0.6, r, 0, 6.283); g.fill(); g.fillStyle = shade(col, 0.15); g.fillRect(x - r * 0.5, y - r, 2, 1); }
  function trunk(g, x, base, w, col) {
    x = Math.round(x - w / 2); g.fillStyle = col; g.fillRect(x, 0, w, base); g.fillStyle = shade(col, 0.15); g.fillRect(x + 1, 0, 1, base); g.fillStyle = shade(col, -0.3); g.fillRect(x + w - 1, 0, 1, base);
    for (var y = 4; y < base; y += 7) { g.fillStyle = shade(col, -0.2); g.fillRect(x + 2, y, Math.max(1, w - 4), 1); }
    g.fillStyle = shade(col, -0.1); g.fillRect(x - 2, base - 2, w + 4, 2); g.fillRect(x - 3, base - 1, 2, 1); g.fillRect(x + w + 1, base - 1, 2, 1);
  }
  function mushroom(g, x, y, R) { x |= 0; y |= 0; g.fillStyle = '#f0e8d0'; g.fillRect(x, y, 1, 2); g.fillStyle = R() < 0.5 ? '#d84a3a' : '#e0a040'; g.fillRect(x - 1, y - 1, 3, 1); g.fillStyle = '#fff'; g.fillRect(x, y - 1, 1, 1); }
  function platform(g, x, y, rx, kind, R, snow) {
    var ry = rx * 0.3;
    function ell(dx, dy, a, b, c) { g.fillStyle = c; g.beginPath(); g.ellipse(x + dx, y + dy, a, b, 0, 0, 6.283); g.fill(); }
    if (kind === 'grass' || kind === 'moss') {
      ell(0, 2, rx + 1, ry + 1.5, '#6a4a2c'); ell(0, 0, rx, ry, kind === 'moss' ? '#3a6a32' : '#4f9a3e'); ell(0, -0.5, rx * 0.86, ry * 0.75, kind === 'moss' ? '#4f8a40' : '#74c058'); ell(-rx * 0.2, -1.2, rx * 0.45, ry * 0.3, kind === 'moss' ? '#68a050' : '#92d872');
      for (var i = 0; i < 26; i++) { var a = i / 26 * 6.283, tx = x + Math.cos(a) * rx * 0.97, ty = y + Math.sin(a) * ry * 0.97; g.fillStyle = i % 2 ? '#3a7a30' : '#5fae48'; g.fillRect(tx | 0, (ty | 0) - 2, 1, 2); }
      if (kind === 'moss') { g.fillStyle = '#5a4028'; for (var r2 = 0; r2 < 4; r2++) { var a2 = 0.3 + r2 * 0.8; g.fillRect(x + Math.cos(a2) * rx * 0.9 | 0, y + Math.sin(a2) * ry + 1 | 0, 4, 1); } }
    } else if (kind === 'stone') {
      ell(0, 2, rx + 1, ry + 1.5, '#4a4a52'); ell(0, 0, rx, ry, '#8a8a94'); ell(0, -0.5, rx * 0.86, ry * 0.75, '#a4a4ae');
      g.strokeStyle = '#7a7a84'; g.lineWidth = 0.6; for (var c = 0; c < 7; c++) { var cx = x + (R() - 0.5) * rx * 1.4, cy = y + (R() - 0.5) * ry * 1.2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + 4, cy + 1); g.stroke(); }
      g.fillStyle = '#5a9a4a'; for (var m = 0; m < 8; m++) g.fillRect(x + (R() - 0.5) * rx * 1.8 | 0, y + ry * 0.6 + R() * 2 | 0, 2, 1);
    } else if (kind === 'sand') {
      ell(0, 2, rx + 1, ry + 1.5, '#a8925a'); ell(0, 0, rx, ry, '#dcc68e'); ell(0, -0.5, rx * 0.86, ry * 0.75, '#ead8a4');
      for (var s = 0; s < 40; s++) { g.fillStyle = R() < 0.5 ? '#c4ae76' : '#f4e6bc'; g.fillRect(x + (R() - 0.5) * rx * 1.6 | 0, y + (R() - 0.5) * ry * 1.4 | 0, 1, 1); }
      g.fillStyle = '#f0e0d0'; g.fillRect(x + rx * 0.5 | 0, y + 1 | 0, 2, 1);
    } else {
      var main = kind === 'rug' ? '#7a3a5a' : '#3a5a8a';
      ell(0, 1, rx + 1, ry + 1, '#5a3a22'); ell(0, 0, rx, ry, '#e0b060'); ell(0, 0, rx * 0.9, ry * 0.85, main); ell(0, 0, rx * 0.62, ry * 0.58, shade(main, 0.2));
      for (var k = 0; k < 16; k++) { var a3 = k / 16 * 6.283; g.fillStyle = '#e0b060'; g.fillRect(x + Math.cos(a3) * rx * 0.76 | 0, y + Math.sin(a3) * ry * 0.72 | 0, 1, 1); }
    }
    if (snow && kind !== 'rug' && kind !== 'rug2') { g.fillStyle = 'rgba(245,250,255,.55)'; g.beginPath(); g.ellipse(x - rx * 0.15, y - 0.5, rx * 0.6, ry * 0.5, 0, 0, 6.283); g.fill(); }
  }
  function foliage(biome, R, tod, snow, right) {
    var w = 34, h = 52, c = mkc(w, h), g = c.getContext('2d'), dark = tod === 'night' ? 0.55 : tod === 'dusk' ? 0.25 : 0;
    var cols = biome === 'forest' ? ['#1f4a26', '#2a6030', '#38783a'] : biome === 'river' ? ['#3a6a2a', '#5a8a34', '#7aa848'] : ['#2f7a2a', '#4a9a38', '#6cbc4a'];
    cols = cols.map(function (k) { return shade(k, -dark); });
    // blades/fronds rising from the bottom corner
    for (var i = 0; i < 16; i++) {
      var bx = R() * w * 0.8, bh = h * (0.4 + R() * 0.6), lean = (R() - 0.3) * 12, wd = biome === 'forest' ? 3 : 2;
      g.fillStyle = cols[i % 3];
      g.beginPath(); g.moveTo(bx - wd, h); g.quadraticCurveTo(bx + lean * 0.3, h - bh * 0.5, bx + lean, h - bh); g.quadraticCurveTo(bx + lean * 0.3 + wd, h - bh * 0.5, bx + wd, h); g.fill();
      if (biome === 'forest' && i % 3 === 0) for (var f = 0; f < 6; f++) { var t = f / 6, fx = bx + lean * t, fy = h - bh * t; g.fillRect(fx | 0, fy | 0, 4, 1); g.fillRect((fx - 4) | 0, (fy + 1) | 0, 4, 1); }
    }
    if (biome === 'river') for (var k = 0; k < 3; k++) { var cx = 6 + k * 8 + R() * 3, cy = 6 + R() * 10; g.fillStyle = shade('#4a8a30', -dark); g.fillRect(cx, cy, 1, h - cy); g.fillStyle = shade('#6a4024', -dark); g.fillRect(cx - 1, cy, 3, 6); }
    if (biome === 'meadow') for (var fl = 0; fl < 5; fl++) { var px = 4 + R() * (w - 8), py = 10 + R() * 20; g.fillStyle = shade(['#ffffff', '#ffd84a', '#ff8ab0'][fl % 3], -dark); g.fillRect(px | 0, py | 0, 2, 2); g.fillStyle = shade('#ffd84a', -dark); g.fillRect((px | 0) + (fl % 3 ? 0 : 1), (py | 0), 1, 1); }
    if (snow) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(240,246,255,.35)'; g.fillRect(0, 0, w, h * 0.5); g.globalCompositeOperation = 'source-over'; }
    if (right) { var c2 = mkc(w, h), g2 = c2.getContext('2d'); g2.translate(w, 0); g2.scale(-1, 1); g2.drawImage(c, 0, 0); return c2; }
    return c;
  }
  function buildIndoor(g, W, Hh, hz, tod, env, R, S, B, P, sky) {
    var wallB = Math.round(Hh * 0.33);
    // back wall: vertical planks
    g.fillStyle = '#7a5236'; g.fillRect(0, 0, W, wallB);
    for (var x = 0; x < W; x += 6) { g.fillStyle = (x / 6) % 2 ? '#80583a' : '#744e32'; g.fillRect(x, 0, 6, wallB); g.fillStyle = '#5a3a24'; g.fillRect(x, 0, 1, wallB); }
    g.fillStyle = '#4a2e1c'; g.fillRect(0, wallB - 3, W, 3); g.fillStyle = '#9a6a44'; g.fillRect(0, wallB - 4, W, 1);
    // window with the sky of the hour
    var wx = Math.round(W * 0.18), wy = Math.round(Hh * 0.06), ww = 30, wh = 26;
    g.drawImage(sky, 0, 0, W, sky.height * 0.7, wx, wy, ww, wh);
    g.fillStyle = '#5a3a24'; g.fillRect(wx - 2, wy - 2, ww + 4, 2); g.fillRect(wx - 2, wy + wh, ww + 4, 3); g.fillRect(wx - 2, wy, 2, wh); g.fillRect(wx + ww, wy, 2, wh); g.fillRect(wx + ww / 2 - 1, wy, 2, wh); g.fillRect(wx, wy + wh / 2 - 1, ww, 2);
    S.window = [wx, wy, ww, wh];
    // shelf with jars and books
    var sx = Math.round(W * 0.6), sy = Math.round(Hh * 0.12);
    g.fillStyle = '#4a2e1c'; g.fillRect(sx, sy, 40, 2); g.fillRect(sx, sy + 14, 40, 2);
    for (var b = 0; b < 9; b++) { g.fillStyle = ['#a04040', '#406aa0', '#4a8a4a', '#c09040', '#7a4a90'][b % 5]; var bh = 6 + R() * 5; g.fillRect(sx + 2 + b * 4, sy - bh, 3, bh); }
    for (var j = 0; j < 3; j++) { g.fillStyle = '#a8d0d8'; g.fillRect(sx + 4 + j * 12, sy + 8, 6, 6); g.fillStyle = ['#e0a040', '#7ed957', '#ff8a3c'][j]; g.fillRect(sx + 5 + j * 12, sy + 10, 4, 4); }
    // floor boards in perspective
    var fy = wallB;
    g.fillStyle = '#9a6a42'; g.fillRect(0, fy, W, Hh - fy);
    for (var y = fy, step = 3; y < Hh; y += step, step *= 1.18) { g.fillStyle = '#7a4e2e'; g.fillRect(0, Math.round(y), W, 1); }
    for (var k = -8; k <= 8; k++) { g.strokeStyle = 'rgba(90,56,32,.6)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(W / 2 + k * 10, fy); g.lineTo(W / 2 + k * 40, Hh); g.stroke(); }
    for (var n = 0; n < 160; n++) { g.fillStyle = R() < 0.5 ? '#8a5c38' : '#aa7a50'; g.fillRect(R() * W | 0, fy + R() * (Hh - fy) | 0, 2, 1); }
    // window light on the floor (day) or a warm lamp pool (night)
    var lightA = tod === 'day' ? 0.28 : tod === 'night' ? 0 : 0.18;
    if (lightA) { g.fillStyle = 'rgba(255,240,190,' + lightA + ')'; g.beginPath(); g.moveTo(wx, fy); g.lineTo(wx + ww, fy); g.lineTo(wx + ww + 40, Hh * 0.62); g.lineTo(wx + 10, Hh * 0.62); g.fill(); }
    // lamp on the wall
    g.fillStyle = '#3a2a1a'; g.fillRect(W * 0.9 | 0, Hh * 0.1 | 0, 1, 8); g.fillStyle = '#ffd27a'; g.fillRect((W * 0.9 | 0) - 2, (Hh * 0.1 | 0) + 8, 5, 4);
    var lg = g.createRadialGradient(W * 0.9, Hh * 0.1 + 10, 0, W * 0.9, Hh * 0.1 + 10, 40); lg.addColorStop(0, 'rgba(255,200,120,' + (tod === 'night' ? 0.4 : 0.15) + ')'); lg.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = lg; g.fillRect(0, 0, W, Hh);
    S.indoorNight = tod === 'night';
  }
  // per-frame animated bits of the scene (behind the spirits)
  function drawSceneBack(g, S, W, Hh, T, dt, env) {
    g.drawImage(S.sky, 0, 0);
    if (S.biome !== 'indoor') {
      S.clouds.forEach(function (c) { c.x += c.v * dt; if (c.x > W + 2) c.x = -c.c.width - 2; g.drawImage(c.c, Math.round(c.x), Math.round(c.y)); });
      S.stars.forEach(function (s, i) { var a = 0.5 + 0.5 * Math.sin(T * 2 + i * 1.7); g.fillStyle = 'rgba(255,255,240,' + a + ')'; g.fillRect(s[0] - 1, s[1], 3, 1); g.fillRect(s[0], s[1] - 1, 1, 3); });
    }
    g.drawImage(S.land, 0, 0);
    var wind = env.weather === 'wind' ? 2.6 : env.weather === 'rain' ? 1.4 : 1;
    if (S.river) {
      var y0 = S.river[0], y1 = S.river[1];
      for (var r = y0 + 1; r < y1; r += 2) { var off = (T * (10 + (r - y0) * 1.5)) % 14; g.fillStyle = 'rgba(200,235,255,.35)'; for (var x = -14 + off + ((r * 7) % 9); x < W; x += 14) g.fillRect(x | 0, r, 4, 1); }
      for (var s = 0; s < 6; s++) { var sx = (s * 37 + Math.floor(T * 1.5 + s) * 53) % W, ph = (T * 1.5 + s) % 1; if (ph < 0.4) { g.fillStyle = 'rgba(255,255,255,' + (1 - ph / 0.4) + ')'; g.fillRect(sx | 0, y0 + 2 + (s * 5) % (y1 - y0 - 3), 1, 1); } }
      S.reeds.forEach(function (q) { var sw = Math.sin(T * 1.8 + q.x * 0.2) * wind; g.strokeStyle = '#4a7a2a'; g.lineWidth = 1; g.beginPath(); g.moveTo(q.x, q.y); g.quadraticCurveTo(q.x, q.y - q.h * 0.6, q.x + sw, q.y - q.h); g.stroke(); g.fillStyle = '#6a4024'; g.fillRect(q.x + sw - 0.5, q.y - q.h, 2, 3); });
    }
    if (S.shafts) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.28 + 0.12 * Math.sin(T * 0.7); g.drawImage(S.shafts, Math.sin(T * 0.3) * 2, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    g.lineWidth = 1;
    S.tufts.forEach(function (q) {
      var sw = Math.sin(T * 1.6 + q.x * 0.15 + q.ph) * (q.h / 5) * wind;
      g.strokeStyle = q.c; g.beginPath();
      g.moveTo(q.x - 1, q.y); g.lineTo(q.x - 2 + sw * 0.8, q.y - q.h * 0.7);
      g.moveTo(q.x, q.y); g.lineTo(q.x + sw, q.y - q.h);
      g.moveTo(q.x + 1, q.y); g.lineTo(q.x + 2 + sw * 0.8, q.y - q.h * 0.8); g.stroke();
      if (q.f) { g.fillStyle = q.f; g.fillRect(Math.round(q.x + sw) - 1, Math.round(q.y - q.h) - 1, 2, 2); }
    });
    S.flies.forEach(function (f, i) {
      var x = f.x + Math.sin(T * 0.5 + f.ph) * 18, y = f.y + Math.sin(T * 0.9 + f.ph * 2) * 6;
      if (f.k === 'fly') { var a = 0.5 + 0.5 * Math.sin(T * 3 + f.ph); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(220,255,140,' + a * 0.3 + ')'; g.fillRect(x - 1, y - 1, 3, 3); g.fillStyle = 'rgba(240,255,180,' + a + ')'; g.fillRect(x, y, 1, 1); g.globalCompositeOperation = 'source-over'; }
      else { var up = Math.floor(T * 8 + i) % 2; g.fillStyle = f.c; g.fillRect(x - 2, y - (up ? 1 : 0), 2, up ? 1 : 2); g.fillRect(x + 1, y - (up ? 1 : 0), 2, up ? 1 : 2); g.fillStyle = '#3a2a1a'; g.fillRect(x, y, 1, 1); }
    });
  }
  function drawSceneFront(g, S, W, Hh, T, dt, env, uiTop) {
    var wind = env.weather === 'wind' ? 2.5 : 1;
    if (S.fgL) {
      var base = uiTop + 6;
      [[S.fgL, 0, 1], [S.fgR, W - S.fgR.width, -1]].forEach(function (f, i) {
        var sk = Math.sin(T * 1.1 + i * 2) * 0.06 * wind;
        g.save(); g.translate(f[1], base); g.transform(1, 0, sk, 1, 0, 0); g.drawImage(f[0], 0, -f[0].height); g.restore();
      });
    }
    S.leaves.forEach(function (l) {
      l.x += l.v * dt; l.y += Math.sin(T * 2 + l.ph) * 0.3 + (env.weather === 'wind' ? 0.1 : 0.25) * dt * 20; if (l.x > W + 4 || l.y > Hh) { l.x = -4; l.y = Math.random() * Hh * 0.7; }
      var fl = Math.sin(T * 6 + l.ph) > 0; g.fillStyle = l.c; g.fillRect(l.x | 0, l.y | 0, fl ? 2 : 1, fl ? 1 : 2);
    });
    var wx = env.weather;
    if (S.biome === 'indoor') {
      if (wx === 'rain' && S.window) { var w = S.window; g.strokeStyle = 'rgba(200,220,255,.6)'; g.lineWidth = 0.5; g.beginPath(); for (var i = 0; i < 10; i++) { var rx = w[0] + (i * 7 + T * 12) % w[2], ry = w[1] + (i * 11 + T * 60) % w[3]; g.moveTo(rx, ry); g.lineTo(rx - 0.5, Math.min(w[1] + w[3], ry + 3)); } g.stroke(); }
      return;
    }
    if (wx === 'rain') {
      g.strokeStyle = 'rgba(200,215,240,.5)'; g.lineWidth = 0.6; g.beginPath();
      S.drops.forEach(function (d) { d.y += d.v * dt; d.x -= d.v * dt * 0.12; if (d.y > Hh) { d.y = -6; d.x = Math.random() * W * 1.2; } g.moveTo(d.x, d.y); g.lineTo(d.x - 0.8, d.y + 5); });
      g.stroke();
      if (S.ripples.length < 8 && Math.random() < 0.3) S.ripples.push({ x: Math.random() * W, y: S.hz + 12 + Math.random() * (uiTop - S.hz - 12), t: 0 });
      g.strokeStyle = 'rgba(210,225,255,.55)'; g.lineWidth = 0.5;
      for (var r = S.ripples.length - 1; r >= 0; r--) { var q = S.ripples[r]; q.t += dt; if (q.t > 0.6) { S.ripples.splice(r, 1); continue; } g.globalAlpha = 1 - q.t / 0.6; g.beginPath(); g.ellipse(q.x, q.y, 1 + q.t * 7, 0.5 + q.t * 2, 0, 0, 6.283); g.stroke(); }
      g.globalAlpha = 1;
    } else if (wx === 'snow') {
      g.fillStyle = 'rgba(255,255,255,.9)';
      S.drops.forEach(function (d) { d.y += d.v * dt; if (d.y > Hh) { d.y = -2; d.x = Math.random() * W; } g.fillRect((d.x + Math.sin(T + d.ph) * 4) | 0, d.y | 0, d.s, d.s); });
    } else if (wx === 'fog' && S.fog) {
      [[S.hz - 6, 4, 0.9], [Hh * 0.46, -6, 0.7], [Hh * 0.7, 3, 0.6]].forEach(function (b) { var o = ((T * b[1]) % W + W) % W; g.globalAlpha = b[2]; g.drawImage(S.fog, -o, b[0]); g.drawImage(S.fog, -o + W * 2, b[0]); });
      g.globalAlpha = 1;
    } else if (wx === 'wind') {
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 0.5; g.beginPath();
      for (var k = 0; k < 5; k++) { var x = ((T * 90 + k * 53) % (W + 40)) - 20, y = S.hz + 6 + k * 23 % (Hh * 0.6); g.moveTo(x, y); g.lineTo(x + 12, y); }
      g.stroke();
    }
  }

  // ---------------------------------------------------------------- UI
  var CSS = [
    '.hb{position:absolute;inset:0;z-index:45;background:#0b0c1c;font-family:Nunito,"M PLUS Rounded 1c",system-ui,sans-serif;color:#f4f1e8;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none;opacity:0;transition:opacity .35s}',
    '.hb.on{opacity:1}',
    '.hb [hidden]{display:none!important}',
    '.hb canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;touch-action:none}',
    '.hb-card{position:absolute;width:min(58%,230px);box-sizing:border-box;padding:7px 11px 8px;border-radius:14px;background:rgba(14,16,36,.84);border:2px solid rgba(255,255,255,.16);box-shadow:0 6px 18px rgba(0,0,0,.4);pointer-events:none}',
    '.hb-card .nm{font-weight:900;font-size:14px;display:flex;justify-content:space-between;gap:8px;line-height:1.15}',
    '.hb-card .lv{opacity:.75;font-size:12px;white-space:nowrap}',
    '.hb-hp{height:8px;border-radius:5px;background:rgba(0,0,0,.55);overflow:hidden;margin-top:5px}',
    '.hb-hp b{display:block;height:100%;width:100%;background:linear-gradient(90deg,#57d07a,#9cf0a6);transition:width .5s}',
    '.hb-hp b.low{background:linear-gradient(90deg,#ff7a5a,#ffb08a)}',
    '.hb-card .st{font-size:11px;font-weight:800;margin-top:4px;display:flex;flex-wrap:wrap;gap:3px;align-items:center;min-height:16px}',
    '.hb-tag{display:inline-block;padding:1px 6px;border-radius:8px;font-size:10px;font-weight:900;background:rgba(255,255,255,.12);color:#fff}',
    '.hb-foe{right:10px;top:calc(env(safe-area-inset-top,0px) + 50px)}',
    '.hb-me{right:10px;bottom:calc(env(safe-area-inset-bottom,0px) + 200px)}',
    '.hb-intent{position:absolute;right:10px;top:calc(env(safe-area-inset-top,0px) + 12px);display:flex;align-items:center;gap:6px;padding:5px 11px 5px 7px;border-radius:999px;background:rgba(14,16,36,.88);border:2px solid var(--ic,#fff);font-weight:900;font-size:14px;box-shadow:0 0 12px var(--ic,#fff);pointer-events:none;transition:transform .2s}',
    '.hb-intent svg{width:20px;height:20px}',
    '.hb-intent small{font-size:11px;font-weight:800;opacity:.8}',
    '.hb-intent.pulse{animation:hbp 1s ease-in-out infinite}',
    '@keyframes hbp{50%{transform:scale(1.08)}}',
    '.hb-msg{position:absolute;left:10px;right:10px;bottom:calc(env(safe-area-inset-bottom,0px) + 164px);text-align:center;font-weight:900;font-size:clamp(14px,4.2vmin,19px);text-shadow:0 2px 0 rgba(0,0,0,.7),0 0 8px rgba(0,0,0,.6);pointer-events:none;min-height:24px}',
    '.hb-moves{position:absolute;left:8px;right:8px;bottom:calc(env(safe-area-inset-bottom,0px) + 8px);display:grid;grid-template-columns:repeat(3,1fr);gap:6px}',
    '.hb-mv{position:relative;border:0;border-radius:14px;padding:7px 6px 6px;min-height:66px;overflow:hidden;text-align:left;font:inherit;color:#fff;cursor:pointer;background:linear-gradient(180deg,color-mix(in srgb,var(--mc) 55%,#1a1c38),#14162e);box-shadow:inset 0 0 0 2px var(--mc),inset 0 2px 0 rgba(255,255,255,.18),0 4px 0 color-mix(in srgb,var(--mc) 45%,#000),0 6px 12px rgba(0,0,0,.35);transition:transform .08s;touch-action:manipulation}',
    '.hb-mv b{display:flex;align-items:center;gap:5px;font-size:13px;font-weight:900;line-height:1.1;padding-right:44px}',
    '.hb-mv .ic{width:20px;height:20px;image-rendering:pixelated;flex:none;filter:drop-shadow(0 1px 0 rgba(0,0,0,.5))}',
    '.hb-mv .kind{display:inline-block;margin-top:4px;font-size:9px;font-weight:900;letter-spacing:.5px;text-transform:uppercase;padding:1px 6px;border-radius:6px;background:rgba(0,0,0,.35)}',
    '.hb-mv:active{transform:translateY(3px);box-shadow:inset 0 0 0 2px var(--mc),0 0 0 rgba(0,0,0,.45)}',
    '.hb-mv i{display:block;font-style:normal;font-size:10px;font-weight:700;opacity:.85;line-height:1.15;margin-top:3px}',
    '.hb-mv em{position:absolute;top:3px;right:4px;font-style:normal;font-size:10px;font-weight:900;padding:1px 6px;border-radius:8px;background:#ffd24a;color:#3a2400}',
    '.hb-mv em.weak{background:#8a90a8;color:#14162e}',
    '.hb-mv.off{filter:grayscale(.85) brightness(.6)}',
    '.hb-mv .cd{position:absolute;inset:0;border-radius:14px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;background:rgba(10,10,24,.55)}',
    '.hb-mv.hot{animation:hbp 1s ease-in-out infinite}',
    '.hb-bar{position:absolute;left:8px;right:8px;bottom:calc(env(safe-area-inset-bottom,0px) + 116px);display:flex;align-items:center;gap:6px;height:40px}',
    '.hb-mana{display:flex;align-items:center;gap:5px;padding:6px 10px;border-radius:12px;background:rgba(14,16,36,.84);font-weight:900;font-size:12px}',
    '.hb-pip{width:11px;height:11px;border-radius:50%;border:2px solid #9fd0ff;box-sizing:border-box}',
    '.hb-pip.on{background:radial-gradient(circle at 35% 35%,#fff,#7fc8ff 50%,#3a7ad8);box-shadow:0 0 6px #7fc8ff}',
    '.hb-btn{border:0;border-radius:12px;background:rgba(14,16,36,.84);color:#fff;font:inherit;font-weight:900;font-size:12px;padding:9px 11px;cursor:pointer;box-shadow:inset 0 0 0 2px rgba(255,255,255,.14)}',
    '.hb-btn.hot{box-shadow:inset 0 0 0 2px #ffd98a,0 0 10px #ffd98a}',
    '.hb-sheet{position:absolute;left:8px;right:8px;bottom:calc(env(safe-area-inset-bottom,0px) + 160px);display:flex;overflow-x:auto;gap:4px;padding:6px;scrollbar-width:none;border-radius:14px;background:#0c0d20;border:2px solid rgba(255,217,138,.25)}',
    '.hb-sp{text-align:center;font-size:10px;font-weight:800;line-height:1.1;padding:2px 0 3px;border-radius:10px}',
    '.hb-sp svg{display:block;margin:0 auto 2px;width:34px;height:34px}',
    '.hb-sheet .hb-sp{flex:0 0 74px}',
    '.hb.sheet-open .hb-me{bottom:calc(env(safe-area-inset-bottom,0px) + 290px)!important}',
    '.hb.sheet-open .hb-msg{opacity:0}',
    '.hb-sp .c{display:block;margin-top:2px;letter-spacing:1px;color:#9fd0ff;font-size:9px}',
    '.hb-sp .d{display:block;margin-top:2px;font-size:9.5px;font-weight:700;opacity:.8;line-height:1.15;padding:0 2px}',
    '.hb-sp.lock{opacity:.45}',
    '.hb-sp.no{opacity:.55}',
    '.hb-sp.hot{background:rgba(255,217,138,.14);box-shadow:0 0 0 2px rgba(255,217,138,.5)}',
    '.hb-sp{position:relative}',
    '.hb-sp .lk{position:absolute;top:2px;right:4px;width:14px;height:14px}',
    '.hb-sp .lk svg{width:14px;height:14px}',
    '.hb-sp.lock{opacity:.4}',
    '.hb-sp.spare{opacity:.6}',
    '.hb-sp .ms{display:flex;justify-content:center;gap:2px;margin-top:3px}',
    '.hb-sp .ms i{width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,.2)}',
    '.hb-sp .ms i.on{background:#ffd98a;box-shadow:0 0 3px #ffd98a}',
    '.hb-moves.four .hb-mv i{display:none}',
    '.hb-moves.four .hb-mv{padding:6px 5px 5px}',
    '.hb-moves.four .hb-mv b{font-size:12px;padding-right:12px}',
    '.hb-moves.four .hb-mv .ic{display:none}',
    '.hb-moves.four .hb-mv > span:first-child{top:3px!important;right:3px!important}',
    '.hb-moves.four .hb-edge{width:14px;height:14px}',
    '.hb-ic{display:flex;align-items:center;gap:4px;padding:7px 9px;min-height:36px}',
    '.hb-ic svg{width:20px;height:20px}',
    '.hb-ic .pi{width:26px;height:26px;image-rendering:pixelated;filter:drop-shadow(0 1px 0 rgba(0,0,0,.5))}',
    '.hb-ic .tl{font-size:12px;font-weight:900}',
    '.hb-ic.off{opacity:.45}',
    '.hb-esc .m{display:flex;align-items:flex-end;gap:2px;height:14px}',
    '.hb-esc .m b{width:4px;border-radius:2px;background:rgba(255,255,255,.2)}',
    '.hb-esc .m b:nth-child(1){height:6px}.hb-esc .m b:nth-child(2){height:10px}.hb-esc .m b:nth-child(3){height:14px}',
    '.hb-esc[data-l="1"] .m b:nth-child(-n+1){background:#ff8a7a}',
    '.hb-esc[data-l="2"] .m b:nth-child(-n+2){background:#ffd24a}',
    '.hb-esc[data-l="3"] .m b:nth-child(-n+3){background:#57d07a}',
    '.hb-strip{position:absolute;left:8px;right:8px;bottom:calc(env(safe-area-inset-bottom,0px) + 160px);display:flex;gap:6px;padding:7px;border-radius:14px;background:#0c0d20;border:2px solid rgba(255,217,138,.25);overflow-x:auto}',
    '.hb-pm{flex:1 0 64px;max-width:110px;border:0;border-radius:12px;padding:5px 6px;background:rgba(255,255,255,.06);color:#fff;font:inherit;font-size:11px;font-weight:900;text-align:center;cursor:pointer;box-shadow:inset 0 0 0 2px var(--mc,#fff)}',
    '.hb-pm canvas{position:static;display:block;width:40px;height:40px;margin:0 auto 2px;image-rendering:pixelated}',
    '.hb-pm.cur{opacity:.5;box-shadow:inset 0 0 0 2px #ffd98a}',
    '.hb-pm.out{filter:grayscale(1);opacity:.4}',
    '.hb-pm .hb-hp{height:5px;margin-top:3px}',
    '.hb-grade{position:absolute;transform:translate(-50%,-50%) scale(.6);padding:2px 9px;border-radius:999px;font-weight:900;font-size:12px;background:rgba(10,10,28,.85);border:2px solid var(--gc);color:var(--gc);box-shadow:0 0 10px var(--gc);pointer-events:none;opacity:0;transition:opacity .2s,transform .25s;z-index:6}',
    '.hb-grade.on{opacity:1;transform:translate(-50%,-50%) scale(1)}',
    '.hb-turn{position:absolute;left:12px;top:calc(env(safe-area-inset-top,0px) + 64px);padding:6px 16px;border-radius:999px;font-weight:900;font-size:14px;letter-spacing:.5px;background:rgba(40,20,24,.85);color:#ffb3a8;border:2px solid rgba(255,140,120,.5);opacity:0;transition:opacity .25s;pointer-events:none;z-index:5}',
    '.hb-turn.on{opacity:1}',
    '.hb-turn.me{background:rgba(14,30,24,.88);color:#b8f5c8;border-color:#57d07a;box-shadow:0 0 14px rgba(87,208,122,.45)}',
    '.hb-banner{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%) scale(.9);min-width:240px;max-width:90%;text-align:center;padding:14px 18px;border-radius:18px;background:rgba(10,10,28,.9);border:2px solid rgba(255,217,138,.4);box-shadow:0 0 30px rgba(0,0,0,.6);opacity:0;transition:opacity .4s,transform .4s;pointer-events:none}',
    '.hb-banner.on{opacity:1;transform:translate(-50%,-50%) scale(1)}',
    '.hb-banner .vs{display:flex;align-items:center;justify-content:center;gap:10px;font-weight:900;font-size:16px}',
    '.hb-banner .vs span.x{opacity:.6;font-size:13px}',
    '.hb-banner .ed{margin-top:8px;font-weight:900;font-size:17px}',
    '.hb-banner .wx{margin-top:4px;font-size:12px;font-weight:800;opacity:.8}',
    '.hb-end{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);border:0;border-radius:999px;padding:14px 30px;font:inherit;font-size:18px;font-weight:900;color:#2a1405;background:linear-gradient(180deg,#ffd98a,#ff9a3c);box-shadow:0 5px 0 #a8501c;cursor:pointer}',
    '.hb-tr{position:absolute;left:10px;top:calc(env(safe-area-inset-top,0px) + 12px);display:flex;align-items:center;gap:6px;padding:3px 10px 3px 3px;border-radius:999px;background:rgba(14,16,36,.84);font-weight:900;font-size:12px;pointer-events:none}',
    '.hb-tr canvas{position:static;width:30px;height:30px;border-radius:50%;background:#2a2c48}'
  ].join('\n');
  var ICON = {
    swap: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8 H18 M14 4 L18 8 L14 12 M20 16 H6 M10 12 L6 16 L10 20"/></svg>',
    esc: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M13 5 L20 12 L13 19 M3 8 H9 M2 12 H12 M3 16 H9"/></svg>',
    lock: '<svg viewBox="0 0 16 16" fill="none" stroke="#c8c8dc" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="7" width="10" height="7" rx="1.5" fill="#3a3a50"/><path d="M5 7 V5 a3 3 0 0 1 6 0 V7"/></svg>'
  };
  var IICON = {
    strike: '<path d="M6 22 L14 6 M11 24 L20 8 M16 26 L25 11"/>',
    charge: '<path d="M8 18 L15 11 L22 18 M8 25 L15 18 L22 25"/>',
    unleash: '<path d="M15 3 L17 12 L26 9 L19 16 L26 22 L17 19 L15 28 L13 19 L4 22 L11 16 L4 9 L13 12 Z"/>',
    guard: '<path d="M15 4 L25 8 Q25 20 15 26 Q5 20 5 8 Z"/>',
    heal: '<path d="M15 6 L15 24 M6 15 L24 15"/>',
    hex: '<path d="M4 15 Q15 4 26 15 Q15 26 4 15 Z"/><circle cx="15" cy="15" r="3"/>',
    asleep: '<path d="M8 8 L16 8 L8 16 L16 16 M17 16 L23 16 L17 22 L23 22"/>',
    stunned: '<path d="M15 4 L18 12 L26 12 L19 17 L22 25 L15 20 L8 25 L11 17 L4 12 L12 12 Z"/>'
  };
  var INTENT = {
    strike: { w: 'Attack', c: '#ff9a7a', d: 'will hit yours' },
    charge: { w: 'Powering up', c: '#ffcf5a', d: 'big hit next turn' },
    unleash: { w: 'Big hit', c: '#ff5a5a', d: 'double damage now' },
    guard: { w: 'Guarding', c: '#8fd8ff', d: 'takes half damage' },
    heal: { w: 'Healing', c: '#9cf0a6', d: 'restores itself' },
    hex: { w: 'Sleep spell', c: '#c49aff', d: 'yours may fall asleep' },
    asleep: { w: 'Asleep', c: '#b9a8ff', d: 'cannot act' },
    stunned: { w: 'Stunned', c: '#ffe27a', d: 'cannot act' }
  };
  var RHYMES = [
    'My jealous heart has found its rest; your gentle wand has shown me best.',
    'The storm in me is quiet now; I leave in peace, and thank you how.',
    'No more envy, no more fight; I drift back home, my heart is light.',
    'You were kind when I was cross; I take your calm and not my loss.'
  ];
  function mk(tag, cls, parent, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function specOf(key) { return (H.spirits && H.spirits.list.filter(function (s) { return s.key === key; })[0]) || { key: key, element: key === 'hontori' ? 'fire' : (ELS.indexOf(key) >= 0 ? key : 'fire'), name: key }; }
  function sfx(n) { try { H.audio && H.audio.sfx(n); } catch (e) {} }
  var styled = false, sheetOpen = false; // cheat-sheet starts collapsed

  function start(opts) {
    opts = opts || {};
    var root = document.getElementById('root'), env = opts.env || { t: 0, time: 12, weather: 'clear' };
    if (!styled) { var st0 = document.createElement('style'); st0.textContent = CSS; document.head.appendChild(st0); styled = true; }
    var biome = opts.biome || (env.indoor ? 'indoor' : 'meadow');
    var GS = (H.game && H.game.state) || { party: [], items: [] };
    var TR = opts.trainer || null;
    var party = GS.party || [];
    var act = 0; for (var ai = 0; ai < party.length; ai++) if ((party[ai].hp == null ? 1 : party[ai].hp) > 0) { act = ai; break; }
    var lead = party[act] || { key: 'hontori', level: 1, hp: 20, maxHp: 20 };
    function mkMe(m) {
      var sp = specOf(m.key);
      return { src: m, key: m.key, el: sp.element, hp: Math.max(0, m.hp == null ? 20 : m.hp), max: m.maxHp || 20, lvl: m.level || 1, atk: m.atk || 0, stage: m.stage, name: m.nick || sp.name || (cap(sp.element) + ' Hontori'), cd: {}, fx: { dx: 0, dy: 0, hit: 0, alpha: 1, lift: 0 } };
    }
    function movesOf(m) {
      var M = H.moves, out = [];
      try {
        var lv = M.learned ? M.learned(m) : [];
        (Array.isArray(m.moves) ? m.moves : []).forEach(function (id) { var x = M.byId && M.byId(id); if (x && out.indexOf(x) < 0 && lv.indexOf(x) >= 0) out.push(x); });
        lv.forEach(function (x) { if (out.length < 4 && out.indexOf(x) < 0) out.push(x); });
      } catch (e) {}
      if (!out.length) out = (M.MOVES[specOf(m.key).element] || M.MOVES.fire).slice(0, 3);
      return out.slice(0, 4);
    }
    var me = mkMe(lead);
    var fought = [act];
    var pool = H.spirits.list.map(function (s) { return s.key; }).filter(function (k) { return k !== me.key; });
    var fk = TR ? (TR.spirit || 'electric') : (opts.enemy || pool[Math.floor(Math.random() * pool.length)]), fs = specOf(fk);
    var flvl = TR ? (TR.level || 1) : (opts.level || Math.max(1, me.lvl + (Math.random() < 0.3 ? -1 : Math.random() < 0.6 ? 0 : 1)));
    var fmax = 15 + flvl * 3;
    var foe = { key: fk, el: fs.element, hp: fmax, max: fmax, lvl: flvl, stage: opts.stage || TR && TR.stage, name: TR ? (TR.name + "'s " + cap(fs.element) + ' Hontori') : ('Jealous ' + (fs.name || cap(fs.element))), cd: {}, fx: { dx: 0, dy: 0, hit: 0, alpha: 1, lift: 0 } };
    var MOV = movesOf(lead), FMOV = H.moves.MOVES[foe.el] || H.moves.MOVES.fire;
    var maxMana = GS.maxMana || 3; if (GS.mana == null) GS.mana = maxMana; var mana = Math.min(maxMana, GS.mana);
    var known = (GS.spells && GS.spells.length ? GS.spells : ['mend']).map(function (s) { return s === 'absorb' ? 'bind' : s; });
    if (opts.spells) known = opts.spells;
    var perks = { power: 1 + 0.05 * ((GS.wandLevel || 1) - 1), costCut: 0, tolerance: 0 };
    try { if (H.progress && H.progress.wandPerks) perks = H.progress.wandPerks(); } catch (e) {}
    var wandMul = perks.power || 1;
    // loadout: up to 4 known spells can be cast in battle
    var loadout = (opts.spells ? known : (Array.isArray(GS.spellLoadout) && GS.spellLoadout.length ? GS.spellLoadout : known)).map(function (s) { return s === 'absorb' ? 'bind' : s; })
      .filter(function (k, i, a) { return known.indexOf(k) >= 0 && a.indexOf(k) === i; }).slice(0, 4);
    if (!loadout.length) loadout = known.slice(0, 4);
    function can(k) { return loadout.indexOf(k) >= 0; }
    GS.spellMastery = GS.spellMastery || {}; GS.spellXp = GS.spellXp || {};
    var MXP = [0, 6, 16, 32, 56];
    function mastery(k) { var x = GS.spellXp[k] || 0, l = 1; while (l < 5 && x >= MXP[l]) l++; return Math.max(l, Math.min(5, GS.spellMastery[k] || 1)); }
    function costOf(k) { var c = SPELLS[k].cost; if (!c) return c; return Math.max(1, c - (perks.costCut || 0) - (mastery(k) >= 4 ? 1 : 0)); }
    function tolOf(k) { return Math.min(0.07, (perks.tolerance || 0) * 0.5 + 0.01 * (mastery(k) - 1)); }
    var TOL = {}; loadout.forEach(function (k) { TOL[k] = tolOf(k); });
    var GRADE = { flawless: ['Flawless', 1.25, '#ffd24a', 3], strong: ['Strong', 1, '#bfe4ff', 2], rough: ['Rough', 0.8, '#a8a8b8', 1] };
    function gradeOf(sc) { var a = sc ? sc.acc : 0.5; return a >= 0.55 ? 'flawless' : a >= 0.25 ? 'strong' : 'rough'; }
    var result = { won: false, captured: false, fled: false, foeKey: fk, foeLevel: flvl, trainer: TR ? (TR.name || true) : null };

    // ---------------- DOM
    var el = mk('div', 'hb', root), cv = mk('canvas', '', el), g = cv.getContext('2d');
    var intentEl = mk('div', 'hb-intent', el), foeCard = mk('div', 'hb-card hb-foe', el), meCard = mk('div', 'hb-card hb-me', el);
    var msg = mk('div', 'hb-msg', el), sheet = mk('div', 'hb-sheet', el), bar = mk('div', 'hb-bar', el), movesEl = mk('div', 'hb-moves', el);
    var manaEl = mk('div', 'hb-mana', bar), sheetBtn = mk('button', 'hb-btn', bar, 'Spells'), herbBtn = mk('button', 'hb-btn', bar, ''), breadBtn = mk('button', 'hb-btn', bar, ''), breadUsed = false, calm = 0;
    mk('div', '', bar).style.flex = '1';
    var pxIc = function (n, fb) { try { return '<img class="pi" alt="" src="' + H.icons.url(n, 2) + '">'; } catch (e) { return fb; } };
    var swBtn = mk('button', 'hb-btn hb-ic', bar, pxIc('swap', ICON.swap) + '<span class="tl">Switch</span>'), escBtn = mk('button', 'hb-btn hb-ic hb-esc', bar, pxIc('run', ICON.esc) + '<span class="tl">Escape</span><span class="m"><b></b><b></b><b></b></span>');
    swBtn.setAttribute('aria-label', 'Switch'); escBtn.setAttribute('aria-label', 'Escape');
    var strip = mk('div', 'hb-strip', el); strip.hidden = true;
    if (TR) { var trEl = mk('div', 'hb-tr', el), pc = mk('canvas', '', trEl); pc.width = 96; pc.height = 96; try { pc.getContext('2d').drawImage(H.chars.portrait(TR.key || 'kid'), 0, 0); } catch (e) {} mk('span', '', trEl, (TR.name || 'Trainer') + ' - practice duel'); }
    var banner = mk('div', 'hb-banner', el);
    var endBtn = mk('button', 'hb-end', el, 'Continue'); endBtn.hidden = true;
    requestAnimationFrame(function () { el.classList.add('on'); });
    sheetOpen = false; sheet.hidden = true;
    sheetBtn.addEventListener('click', function () { sheetOpen = sheet.hidden; sheet.hidden = !sheetOpen; el.classList.toggle('sheet-open', sheetOpen); });
    new MutationObserver(function () { el.classList.toggle('sheet-open', !sheet.hidden); }).observe(sheet, { attributes: true, attributeFilter: ['hidden'] });

    // spell cheat-sheet
    var chips = {};
    var SHORT = { mend: 'Heal', shield: 'Block', boost: 'Power up', stun: 'Stun', sleep: 'Sleep', bind: 'Capture', revive: 'Revive', veil: 'Lift veil' };
    function fillChip(k) {
      var S = SPELLS[k], kn = known.indexOf(k) >= 0, c = chips[k];
      c.className = 'hb-sp' + (kn ? (can(k) ? '' : ' spare') : ' lock');
      if (!kn) { c.innerHTML = sigilSVG(k, S.col, true) + '<span class="lk">' + ICON.lock + '</span>' + S.name + '<span class="d">' + (k === 'bind' ? 'Academy' : 'Later school') + '</span>'; return; }
      var ml = mastery(k), pips = '';
      for (var i = 1; i <= 5; i++) pips += '<i class="' + (i <= ml ? 'on' : '') + '"></i>';
      c.innerHTML = sigilSVG(k, S.col, false) + S.name + '<span class="d">' + (SHORT[k] || '') + '</span><span class="c">' + new Array(costOf(k) + 1).join('&#9679;') + '</span><span class="ms">' + pips + '</span>';
    }
    ORDER.forEach(function (k) { chips[k] = mk('div', 'hb-sp', sheet); fillChip(k); });
    var sheetNote = mk('div', '', sheet); sheetNote.hidden = true;

    // move buttons
    var mvBtns = [];
    function buildMoves() {
      movesEl.innerHTML = ''; movesEl.style.gridTemplateColumns = 'repeat(' + Math.max(2, MOV.length) + ',1fr)'; movesEl.classList.toggle('four', MOV.length > 3);
      mvBtns = MOV.map(mkMv);
    }
    function mkMv(m, i) {
      var b = mk('button', 'hb-mv', movesEl); b.style.setProperty('--mc', COL[me.el]);
      var pressT = 0, longT = null;
      b.addEventListener('pointerdown', function () { pressT = performance.now(); longT = setTimeout(function () { say(m.name + ': ' + m.desc); longT = 'shown'; }, 450); });
      b.addEventListener('pointerup', function () { if (longT && longT !== 'shown') clearTimeout(longT); });
      b.addEventListener('pointerleave', function () { if (longT && longT !== 'shown') clearTimeout(longT); });
      b.addEventListener('click', function () { var lp = longT === 'shown'; longT = null; if (lp) return; useMove(i); });
      return b;
    }
    buildMoves();

    function say(t) { msg.textContent = t; }
    var tags = { asleep: ['Asleep', '#b9a8ff'], stun: ['Stunned', '#ffe27a'], shield: ['Warded', '#8fd8ff'], boost: ['Rallied', '#ffb35a'], root: ['Rooted', '#7ed957'], glow: ['Glow', '#ff8a3c'], harden: ['Shell', '#c9935a'], tail: ['Tailwind', '#9ff0e0'], veil: ['Veiled', '#a070ff'], mist: ['Misted', '#cfe9ff'], guard: ['Guard', '#8fd8ff'], charged: ['Charged', '#ffcf5a'] };
    function card(c, f) {
      var low = f.hp / f.max < 0.3, h = '<div class="nm"><span>' + f.name + '</span><span class="lv">Lv ' + f.lvl + '</span></div><div class="hb-hp"><b class="' + (low ? 'low' : '') + '" style="width:' + Math.max(0, Math.round(100 * f.hp / f.max)) + '%"></b></div><div class="st"></div>';
      c.innerHTML = h; var st = c.querySelector('.st');
      try { var b = H.ui.elementBadge(f.el); b.style.marginLeft = '0'; st.appendChild(b); } catch (e) { mk('span', 'hb-tag', st, cap(f.el)); }
      if (f === me) mk('span', '', st, '&nbsp;' + f.hp + ' / ' + f.max);
      if (f === foe) { var m = matrix(me.el, foe.el), m2 = matrix(foe.el, me.el); var ic = document.createElement('span'); ic.innerHTML = edgeIcon(m, m2, 24); ic.style.display = 'inline-flex'; st.appendChild(ic); }
      Object.keys(tags).forEach(function (k) { if (f[k]) tag(st, tags[k][0], tags[k][1]); });
      if (f === me && f.hp <= 0) tag(st, 'Fainted', '#ff8a7a');
    }
    function edgeIcon(m, m2, px) {
      px = px || 22; var up = m > 1, down = !up && m2 > 1, col = up ? '#57d07a' : down ? '#ff6a5a' : '#8a90a8';
      var path = up ? 'M12 5 L19 14 L14 14 L14 19 L10 19 L10 14 L5 14 Z' : down ? 'M12 19 L19 10 L14 10 L14 5 L10 5 L10 10 L5 10 Z' : 'M6 9 H18 V11 H6 Z M6 13 H18 V15 H6 Z';
      return '<svg class="hb-edge" width="' + px + '" height="' + px + '" viewBox="0 0 24 24" style="vertical-align:middle;flex:none"><circle cx="12" cy="12" r="11" fill="' + col + '" stroke="rgba(0,0,0,.45)" stroke-width="1.5"/><path d="' + path + '" fill="#fff"/></svg>';
    }
    function tag(p, t, c) { var s = mk('span', 'hb-tag', p, t); s.style.background = rgba(c, 0.25); s.style.color = c; }
    var turnPill = mk('div', 'hb-turn', el);
    function updateTurn() {
      var mine = !busy && !done, txt = done ? '' : mine ? 'Your turn' : 'Enemy turn';
      if (turnPill._t !== txt) { turnPill._t = txt; turnPill.textContent = txt; turnPill.className = 'hb-turn' + (txt ? ' on' : '') + (mine ? ' me' : ''); }
    }
    function renderUI() {
      card(foeCard, foe); card(meCard, me);
      manaEl.innerHTML = 'Mana ' + Array.apply(null, Array(maxMana)).map(function (_, i) { return '<span class="hb-pip' + (i < mana ? ' on' : '') + '"></span>'; }).join('');
      var herb = (GS.items || []).filter(function (i) { return i.id === 'herb'; })[0];
      herbBtn.hidden = !herb || mana >= maxMana; if (herb) herbBtn.textContent = 'Herb x' + (herb.n || 1);
      var bread = (GS.items || []).filter(function (i) { return i.id === 'bread'; })[0];
      breadBtn.hidden = !bread || breadUsed || !!TR;
      if (bread && !breadBtn.firstChild) { try { var bi = document.createElement('img'); bi.alt = ''; bi.src = H.pickups.iconUrl('bread'); bi.style.cssText = 'width:20px;height:20px;image-rendering:pixelated;vertical-align:middle;margin-right:4px'; breadBtn.appendChild(bi); } catch (e) {} breadBtn.appendChild(document.createTextNode('Bread')); }
      var fainted = me.hp <= 0;
      MOV.forEach(function (m, i) {
        var b = mvBtns[i], cd = me.cd[m.id] || 0, mx = matrix(me.el, foe.el), mark = '';
        if (m.pow && mx !== 1) mark = '<span style="position:absolute;top:5px;right:6px">' + edgeIcon(mx, mx < 1 ? 2 : 1, 20) + '</span>';
        var ico = ''; try { ico = '<img class="ic" alt="" src="' + H.icons.url(m.el || me.el, 2) + '">'; } catch (e) {}
        b.innerHTML = mark + '<b>' + ico + m.name + '</b><span class="kind">' + (m.pow ? 'Attack' : 'Support') + '</span><i>' + (m.pow ? 'Power ' + m.pow + '. ' : '') + m.desc.replace(/ Rests 2 turns\./, '') + '</i>' + (cd > 0 ? '<span class="cd">Rest ' + cd + '</span>' : fainted ? '<span class="cd">Fainted</span>' : me.asleep ? '<span class="cd">Asleep</span>' : '');
        b.classList.toggle('off', cd > 0 || fainted || busy || done);
      });
      ORDER.forEach(function (k) { var ok = can(k) && mana >= costOf(k) && !spellUsed && canCast(k) === true; chips[k].classList.toggle('no', can(k) && !ok); });
      var others = party.some(function (m, i) { return i !== act && (m.hp == null ? 1 : m.hp) > 0; });
      swBtn.hidden = party.length < 2; swBtn.classList.toggle('off', !others || busy || done);
      var ec = escChance(), lvl = ec < 0.4 ? 1 : ec < 0.7 ? 2 : 3;
      escBtn.classList.toggle('off', !!TR || busy || done); escBtn.setAttribute('data-l', TR ? 0 : lvl);
      var it = INTENT[foe.stun ? 'stunned' : foe.asleep ? 'asleep' : intent] || INTENT.strike;
      intentEl.style.setProperty('--ic', it.c);
      intentEl.innerHTML = '<svg viewBox="0 0 30 30"><g fill="none" stroke="' + it.c + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' + IICON[foe.stun ? 'stunned' : foe.asleep ? 'asleep' : intent] + '</g></svg><span>' + it.w + ' <small>' + it.d + (quickFoe() && !foe.stun && !foe.asleep ? ', moves first' : '') + '</small></span>';
      intentEl.hidden = done;
    }

    // ---------------- scene
    var W = 0, Hh = 0, L = 1, dpr = Math.min(2, window.devicePixelRatio || 1), parts = [], floats = [], fxs = [], dims = [], shakeT = 0, flash = { a: 0, c: '#fff' }, scene = null, uiTop = 0;
    var POS = { foe: {}, me: {} };
    function layout() {
      POS.foe.x = Math.round(W * 0.68); POS.foe.gy = Math.round(Hh * 0.40); POS.foe.sc = 1.45;
      POS.me.x = Math.round(W * 0.3); POS.me.gy = Math.round(Hh * 0.655); POS.me.sc = 1.8;
      ['foe', 'me'].forEach(function (k) { var p = POS[k]; p.y = p.gy - 10 * p.sc - 2; });
      uiTop = (el.clientHeight - 168) / L;
    }
    function size() {
      var w = el.clientWidth, h = el.clientHeight; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      L = Math.max(2, Math.floor(Math.min(w, h) / 120)); W = Math.ceil(w / L); Hh = Math.ceil(h / L);
      layout();
      scene = buildScene(W, Hh, biome, env, POS);
    }
    size(); window.addEventListener('resize', size);
    function F(who) { return who === 'me' ? me : foe; }
    function mkX(from, to) {
      var A = POS[from], B = POS[to], fa = F(from), fb = F(to);
      var X = {
        a: { x: A.x + fa.fx.dx, y: A.y, gy: A.gy, sc: A.sc }, b: { x: B.x, y: B.y, gy: B.gy, sc: B.sc }, foe: { x: POS.foe.x, y: POS.foe.y, gy: POS.foe.gy }, W: W, Hh: Hh,
        P: function (o) { parts.push(Object.assign({ vx: 0, vy: 0, l: 1, d: 0.03, c: '#fff', s: 1.5 }, o)); },
        fx: function (ms, fn, back) { fxs.push({ t: 0, ms: ms, draw: fn, back: back }); },
        tween: function (ms, step, draw) { return new Promise(function (res) { fxs.push({ t: 0, ms: ms, draw: draw, step: step, done: res }); }); },
        flash: function (c, a) { flash.c = c; flash.a = Math.max(flash.a, a); },
        dim: function (a, ms) { dims.push({ t: 0, ms: ms, a: a }); },
        shake: function (v) { shakeT = Math.max(shakeT, v); },
        wait: wait,
        lunge: function (frac, ms) { var dx = (B.x - A.x) * frac, dy = (B.y - A.y) * frac; fxs.push({ t: 0, ms: ms, step: function (k) { var s = Math.sin(k * Math.PI); fa.fx.dx = dx * s; fa.fx.dy = dy * s; } }); },
        lift: function (px, ms) { fxs.push({ t: 0, ms: ms, step: function (k) { fb.fx.lift = -px * Math.sin(k * Math.PI); } }); },
        fade: function (al, ms) { fxs.push({ t: 0, ms: ms, step: function (k) { fa.fx.alpha = 1 - (1 - al) * Math.sin(k * Math.PI); } }); }
      };
      return X;
    }
    function burst(x, y, col, n, spread) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, v = Math.random() * (spread || 1.2); parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.2, l: 1, d: 0.02 + Math.random() * 0.02, c: Math.random() < 0.3 ? '#ffffff' : col, s: Math.random() < 0.5 ? 1 : 1.5 }); } }
    function showGrade(G, x, y) {
      var b = mk('div', 'hb-grade', el, G[0]); b.style.setProperty('--gc', G[2]);
      b.style.left = Math.max(30, Math.min(el.clientWidth - 30, x * L)) + 'px'; b.style.top = Math.max(20, y * L) + 'px';
      requestAnimationFrame(function () { b.classList.add('on'); });
      setTimeout(function () { b.classList.remove('on'); }, 1100); setTimeout(function () { b.remove(); }, 1400);
    }
    function float(x, y, t, c, big) { floats.push({ x: x, y: y, t: t, c: c || '#fff', l: 1, big: big }); }

    var T = 0, lastMs = 0, live = true, drawing = false, ink = Ink(1);
    function drawFighter(f, p, opts2) {
      var x = Math.round(p.x + f.fx.dx), y = Math.round(p.y + f.fx.dy + f.fx.lift), senv = { t: T, time: env.time, weather: env.weather, wind: 0.3, indoor: biome === 'indoor' };
      var o = Object.assign({ scale: p.sc, stage: f.stage, sit: !!f.asleep || f.hp <= 0 }, opts2);
      var a = f.fx.alpha * (f.hp <= 0 && f === me ? 0.45 : 1) * (f.veil ? 0.6 : 1);
      if (a <= 0.01) return;
      o.alpha = a; H.spirits.draw(g, f.key, x, y, senv, o);
      if (f.fx.hit > 0) { g.globalCompositeOperation = 'lighter'; var o2 = Object.assign({}, o, { alpha: Math.min(1, f.fx.hit * 1.6), noShadow: true }); H.spirits.draw(g, f.key, x, y, senv, o2); g.globalCompositeOperation = 'source-over'; }
      // status visuals
      var sc = p.sc;
      if (f.asleep) { g.fillStyle = '#e8e0ff'; g.font = 'bold 7px Nunito, sans-serif'; g.textAlign = 'left'; for (var z = 0; z < 2; z++) { var u = (T * 0.6 + z * 0.5) % 1; g.globalAlpha = 1 - u; g.fillText('z', x + 8 * sc + u * 4, y - 12 * sc - u * 8); } g.globalAlpha = 1; }
      if (f.stun) { for (var s = 0; s < 3; s++) { var an = T * 4 + s * 2.1; g.fillStyle = '#ffe27a'; g.fillRect(x + Math.cos(an) * 9 * sc / 1.4, y - 13 * sc + Math.sin(an) * 2.5, 1.5, 1.5); } }
      g.globalCompositeOperation = 'lighter';
      if (f.shield) { g.globalAlpha = 0.55 + 0.15 * Math.sin(T * 3); g.strokeStyle = '#8fd8ff'; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y, 13 * sc, 12 * sc, 0, Math.PI * 1.05, Math.PI * 1.95 + 6.283 * 0); g.stroke(); g.beginPath(); g.ellipse(x, y, 13 * sc, 12 * sc, 0, 0, 6.283); g.globalAlpha = 0.15; g.stroke(); }
      if (f.boost) { g.globalAlpha = 0.8; g.strokeStyle = '#ffb35a'; g.lineWidth = 1; for (var c = 0; c < 2; c++) { var u2 = (T * 0.8 + c * 0.5) % 1, cy = y + 6 * sc - u2 * 16 * sc; g.globalAlpha = 1 - u2; g.beginPath(); g.moveTo(x - 9 * sc - 2, cy + 2); g.lineTo(x - 9 * sc, cy); g.lineTo(x - 9 * sc + 2, cy + 2); g.stroke(); } }
      if (f.glow) H.moves.blob(g, x, y, 14 * sc, 'rgba(255,150,60,1)', 0.25 + 0.08 * Math.sin(T * 4));
      if (f.harden) { g.globalAlpha = 0.5; g.strokeStyle = '#d8b088'; g.lineWidth = 1; g.beginPath(); for (var hx = 0; hx <= 6; hx++) { var ha = hx / 6 * 6.283 + T * 0.3; g[hx ? 'lineTo' : 'moveTo'](x + Math.cos(ha) * 11 * sc, y + 2 + Math.sin(ha) * 10 * sc); } g.stroke(); }
      if (f.tail) { g.globalAlpha = 0.5; g.strokeStyle = '#dffcf6'; g.lineWidth = 0.6; for (var tl = 0; tl < 3; tl++) { var tx = x - 14 * sc - ((T * 40 + tl * 9) % 18); g.beginPath(); g.moveTo(tx, y - 4 + tl * 5); g.lineTo(tx + 6, y - 4 + tl * 5); g.stroke(); } }
      if (f.mist) H.moves.blob(g, x, y + 4, 16 * sc, 'rgba(220,235,255,1)', 0.25);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      if (f.root) { g.fillStyle = '#6a4a28'; for (var r = 0; r < 5; r++) { var ra = r * 1.3; g.fillRect(x + Math.cos(ra) * 9 * sc | 0, p.gy + 1 + Math.sin(ra) * 2 | 0, 3, 1); } g.fillStyle = '#a8ec6c'; g.fillRect(x - 6, p.gy - 1 - (T * 2 % 2), 1, 1); }
    }
    function frame(ms) {
      if (!live) return;
      var dt = Math.min(0.05, lastMs ? (ms - lastMs) / 1000 : 0.016); lastMs = ms; T = ms / 1000;
      if (Math.round(el.clientWidth * dpr) !== cv.width || Math.round(el.clientHeight * dpr) !== cv.height) size();
      g.setTransform(dpr * L, 0, 0, dpr * L, 0, 0); g.imageSmoothingEnabled = false;
      var sx = shakeT > 0 ? (Math.random() - 0.5) * 3 * shakeT : 0, sy = shakeT > 0 ? (Math.random() - 0.5) * 1.5 * shakeT : 0; shakeT = Math.max(0, shakeT - dt * 2.2);
      g.save(); g.translate(Math.round(sx), Math.round(sy));
      drawSceneBack(g, scene, W, Hh, T, dt, env);
      if (TR) try { H.chars.draw(g, TR.key || 'kid', POS.foe.x + 28, POS.foe.gy - 4, 0, 0, { t: T, time: env.time }, { npc: true, seed: 0.3 }); } catch (e) {}
      runFx(dt, true);
      drawFighter(foe, POS.foe, { dir: 0 });
      drawFighter(me, POS.me, { dir: 1 });
      [me, foe].forEach(function (f) { f.fx.hit = Math.max(0, f.fx.hit - dt * 1.8); if (!f.fx.kb) return; f.fx.dx = f.fx.kb; f.fx.kb *= 0.85; if (Math.abs(f.fx.kb) < 0.2) { f.fx.kb = 0; f.fx.dx = 0; } });
      // darkness overlay (dark moves), then front effects glow over it
      var dm = 0; for (var d = dims.length - 1; d >= 0; d--) { var q = dims[d]; q.t += dt * 1000; var k = q.t / q.ms; if (k >= 1) { dims.splice(d, 1); continue; } dm = Math.max(dm, q.a * Math.min(1, k * 5, (1 - k) * 4)); }
      if (dm > 0) { g.fillStyle = 'rgba(8,2,18,' + dm + ')'; g.fillRect(-4, -4, W + 8, Hh + 8); }
      runFx(dt, false);
      for (var i = parts.length - 1; i >= 0; i--) { var p = parts[i]; p.x += p.vx; p.y += p.vy; p.vy += p.g || 0; if (p.dr) { p.vx *= p.dr; p.vy *= p.dr; } p.l -= p.d; if (p.l <= 0) { parts.splice(i, 1); continue; }
        g.globalCompositeOperation = p.n ? 'source-over' : 'lighter'; g.globalAlpha = Math.min(1, p.l); g.fillStyle = p.c; g.fillRect(p.x, p.y, p.s, p.s); }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      drawSceneFront(g, scene, W, Hh, T, dt, env, uiTop);
      g.restore();
      for (var j = floats.length - 1; j >= 0; j--) { var f = floats[j]; f.y -= 0.22; f.l -= 0.011; if (f.l <= 0) { floats.splice(j, 1); continue; }
        g.globalAlpha = Math.min(1, f.l * 2); g.font = (f.big ? 'bold 11px' : 'bold 7px') + ' Nunito, system-ui, sans-serif'; g.textAlign = 'center'; g.lineWidth = 2; g.strokeStyle = 'rgba(0,0,0,.7)'; g.strokeText(f.t, f.x, f.y); g.fillStyle = f.c; g.fillText(f.t, f.x, f.y); }
      g.globalAlpha = 1;
      ink.draw(g, 1);
      if (flash.a > 0) { g.globalAlpha = flash.a; g.fillStyle = flash.c; g.fillRect(0, 0, W, Hh); g.globalAlpha = 1; flash.a = Math.max(0, flash.a - dt * 2.5); }
      updateTurn(); requestAnimationFrame(frame);
    }
    function runFx(dt, back) {
      for (var i = 0; i < fxs.length; i++) {
        var e = fxs[i]; if (!!e.back !== back) continue;
        e.t += dt * 1000; var k = Math.min(1, e.t / e.ms);
        if (e.step) e.step(k);
        if (e.draw) { g.save(); e.draw(g, k, e.t); g.restore(); }
        if (k >= 1) { fxs.splice(i, 1); i--; if (e.done) e.done(); }
      }
    }
    requestAnimationFrame(frame);

    // ---------------- banner (matchup at start)
    function showBanner() {
      var m = matrix(me.el, foe.el), m2 = matrix(foe.el, me.el), wm = weatherMul(me.el, env), wf = weatherMul(foe.el, env);
      var b1 = '', b2 = ''; try { b1 = H.ui.elementBadge(me.el).outerHTML; b2 = H.ui.elementBadge(foe.el).outerHTML; } catch (e) { b1 = cap(me.el); b2 = cap(foe.el); }
      banner.innerHTML = '<div class="vs">' + b1 + edgeIcon(m, m2, 34) + b2 + '</div>';
      banner.classList.add('on'); setTimeout(function () { banner.classList.remove('on'); }, 2300);
    }

    // ---------------- battle state
    var busy = true, done = false, spellUsed = false, round = 0, intent = 'strike', lastIntent = '', binds = 0, ended = false;
    var tut = (!GS.battles && !TR) ? 0 : -1, tutMended = false;
    function quickFoe() { return (foe.el === 'wind' || foe.el === 'electric') && !me.tail && me.el !== 'wind'; }
    function pickIntent() {
      if (foe.charged) return 'unleash';
      var hp = foe.hp / foe.max, w = { strike: 5, charge: 1.6, guard: 1.3, heal: 0, hex: 1.1 };
      if (hp < 0.6) w.heal = 1.6; if (hp < 0.35) w.heal = 3; if (lastIntent === 'heal' || hp > 0.85) w.heal = 0;
      var e = foe.el;
      if (e === 'fire' || e === 'electric') w.charge += 1.6;
      if (e === 'earth') w.guard += 2;
      if ((e === 'grass' || e === 'light') && hp < 0.7) w.heal += 1.5;
      if (e === 'dark' || e === 'water') w.hex += 1.6;
      if (e === 'wind') w.strike += 2;
      if (me.asleep || me.veil) w.hex = 0;
      if (lastIntent === 'guard') w.guard = 0;
      if (lastIntent === 'hex') w.hex *= 0.3;
      if (round <= 1) { w.charge = 0; w.hex *= 0.5; }
      var tot = 0, k; for (k in w) tot += w[k]; var r = Math.random() * tot;
      for (k in w) { r -= w[k]; if (r <= 0) return k; } return 'strike';
    }
    // The owner sweeps the binding away with an open hand.
    function repelHand() {
      var hd = mk('div', '', el);
      hd.style.cssText = 'position:absolute;right:-40%;top:30%;width:42%;pointer-events:none;transition:transform .45s cubic-bezier(.2,.9,.3,1),opacity .3s;z-index:6';
      hd.innerHTML = '<svg viewBox="0 0 100 110" style="width:100%;filter:drop-shadow(0 6px 10px rgba(0,0,0,.45))"><g fill="#f2c9a0" stroke="#5a3a24" stroke-width="3" stroke-linejoin="round">' +
        '<rect x="18" y="22" width="13" height="44" rx="6.5"/><rect x="33" y="10" width="13" height="56" rx="6.5"/><rect x="48" y="8" width="13" height="58" rx="6.5"/><rect x="63" y="16" width="13" height="50" rx="6.5"/>' +
        '<path d="M14 58 Q14 100 50 104 Q86 100 84 58 Z"/><rect x="78" y="48" width="12" height="34" rx="6" transform="rotate(-35 84 64)"/></g></svg>';
      requestAnimationFrame(function () { hd.style.transform = 'translateX(-150%) rotate(-12deg)'; });
      sfx('bump'); shakeT = Math.max(shakeT, 0.4);
      for (var i = 0; i < 18; i++) parts.push({ x: POS.foe.x - 10 + Math.random() * 20, y: POS.foe.y - 10 + Math.random() * 20, vx: -1.5 - Math.random() * 2, vy: (Math.random() - .5) * 1.5, l: 1, d: 0.03, c: '#ffd98a', s: 1.5 });
      say((TR && TR.name ? TR.name : 'Owner') + ': Hands off. This one is mine.');
      setTimeout(function () { hd.style.opacity = '0'; }, 700); setTimeout(function () { hd.remove(); }, 1100);
    }
    function canCast(k) {
      var S = SPELLS[k];
      if (k === 'revive') return me.hp <= 0 ? (matFor() ? true : 'You need ' + matName(matKey()) + ' for the Phoenix Star.') : 'Your hontori does not need it.';
      if (me.hp <= 0) return 'It fainted. Only the Phoenix Star can help.';
      if (k === 'bind') { if (TR || opts.noCapture) return 'A practice duel. No binding.'; if (foe.hp / foe.max > 0.35) return 'Weaken it first.'; }
      if (k === 'mend' && me.hp >= me.max && !me.asleep) return 'It is already well.';
      return S ? true : 'Unknown spell.';
    }
    function matKey() { return { fire: 'ember_dust', water: 'tide_pearl' }[me.el] || 'spirit_snack'; }
    function matName(k) { return { ember_dust: 'Ember Dust', tide_pearl: 'Tide Pearl', spirit_snack: 'Spirit Snack' }[k]; }
    function matFor() { var id = matKey(); return (GS.items || []).filter(function (i) { return i.id === id && (i.n == null || i.n > 0); })[0]; }
    function hintLine() {
      if (tut === 0) return 'Tip: tap a move to attack.';
      if (tut === 1) return 'Tip: draw a circle anywhere to Mend.';
      if (tut === 2) return 'Tip: watch the sign at the top. It shows the foe\'s next move.';
      if (me.hp <= 0) return can('revive') ? 'It fainted. Draw the Phoenix Star.' : 'It fainted.';
      if (me.asleep) return 'It is asleep. Cast a spell, then tap a move to wait.';
      if (!TR && can('bind') && foe.hp / foe.max <= 0.35 && mana >= 2 && !spellUsed) return (GS.flags && GS.flags.boundOnce) ? 'It is weak. Draw a spiral to bind it.' : 'It is weak. Draw the spiral to bind it, and it can travel with you.';
      if (!TR && known.indexOf('bind') < 0 && foe.hp / foe.max <= 0.35) return 'It is weak. Learn the Binding Spiral at the Academy to catch it.';
      if (intent === 'charge' && can('shield')) return 'It is charging. A ward would help next turn.';
      if (intent === 'unleash' && can('shield') && !me.shield && !spellUsed) return 'A big hit is coming. Draw the Aegis Ward.';
      return spellUsed ? 'Choose a move.' : 'Draw a spell, or choose a move.';
    }
    function beginTurn() {
      round++;
      Object.keys(me.cd).forEach(function (k) { if (me.cd[k] > 0) me.cd[k]--; });
      Object.keys(foe.cd).forEach(function (k) { if (foe.cd[k] > 0) foe.cd[k]--; });
      if (round > 1 && round % 2 === 1 && mana < maxMana) { mana++; float(POS.me.x - 18, POS.me.y - 20, '+1 mana', '#9fd0ff'); }
      spellUsed = false;
      intent = (foe.stun || foe.asleep) ? intent : pickIntent();
      foe.guard = intent === 'guard' && !foe.stun && !foe.asleep;
      intentEl.classList.toggle('pulse', tut === 2 || intent === 'unleash' || intent === 'charge');
      if (me.hp <= 0 && !(can('revive') && mana >= costOf("revive") && matFor())) {
        if (alive().length) { busy = false; renderUI(); say('Choose who goes next.'); openStrip(true); return; }
        renderUI(); return lose();
      }
      busy = false; renderUI(); say(hintLine());
      mvBtns.forEach(function (b) { b.classList.toggle('hot', tut === 0); });
      if (tut === 1) { sheetBtn.classList.add('hot'); chips.mend.classList.add('hot'); }
      if (TR && TR.lesson && round === 1 && SPELLS[TR.lesson] && can(TR.lesson)) setTimeout(function () { if (!busy && !done) say((TR.name || 'Trainer') + ': try the ' + SPELLS[TR.lesson].name + ' (' + SPELLS[TR.lesson].how + ').'); }, 50);
    }

    // ---------------- damage
    function hitCalc(att, def, pow, el, mult) {
      var mx = matrix(el, def.el), wm = weatherMul(el, env), lv = 1 + 0.12 * (att.lvl - 1), atk = 1 + (att.atk || 0) * 0.05;
      var crit = Math.random() < (att.tail ? 0.4 : 0.08), m = mult || 1;
      if (att.glow) m *= 1.5; if (att.boost) m *= 1 + 0.6 * att.boost;
      if (def.guard) m *= 0.5; if (def.harden) m *= 0.5;
      var shielded = !!def.shield; if (shielded) m *= 0.25 / wandMul / def.shield;
      var scale = att === foe ? 0.75 : 1, dmg = Math.max(1, Math.round(pow * lv * atk * mx * wm * m * scale * (crit ? 1.5 : 1) * (0.88 + Math.random() * 0.24)));
      return { dmg: dmg, mx: mx, wm: wm, crit: crit, shielded: shielded };
    }
    async function attack(from, m, mult) {
      var att = F(from), to = from === 'me' ? 'foe' : 'me', def = F(to), X = mkX(from, to), B = POS[to];
      // misses: mist lowers foe aim; veil dodges the next hit
      var miss = (att.mist && Math.random() < 0.4) || Math.random() < 0.04, dodge = !!def.veil;
      await (H.moves.ANIM[m.id] || H.moves.ANIM.ember_nip)(X);
      if (dodge || miss) {
        if (dodge) def.veil = 0;
        def.fx.kb = (B.x > POS[from].x ? -1 : 1) * -5; float(B.x, B.y - 18, dodge ? 'Dodged' : 'Miss', '#dfe6ff', true); say(dodge ? (def === me ? 'Yours slips through the veil.' : 'It slips away.') : 'It missed.');
        att.boost = 0; await wait(500); return 0;
      }
      var r = hitCalc(att, def, m.pow, att.el, mult);
      def.hp = Math.max(0, def.hp - r.dmg); att.boost = 0; if (r.shielded) def.shield = 0;
      def.fx.hit = 0.7; def.fx.kb = (B.x > POS[from].x ? 1 : -1) * 6; X.shake(r.dmg > 7 ? 1.3 : 0.8); sfx('bump');
      H.moves.linger(X, att.el);
      float(B.x, B.y - 14, '-' + r.dmg, def === me ? '#ff9a8a' : r.mx > 1 ? '#ffd24a' : '#ffffff', true);
      var notes = [];
      if (r.crit) notes.push('Critical!');
      // matchup is shown by the edge icon only; no repeated words on each hit
      if (r.shielded) notes.push('Warded');
      if (def.guard) notes.push('Guarded');
      notes.forEach(function (t, i) { setTimeout(function () { float(B.x + (i % 2 ? 10 : -10), B.y - 26 - i * 2, t, t === 'Strong!' ? '#ffd24a' : t === 'Weak...' ? '#a8b0c8' : '#cfe9ff'); }, 120 + i * 160); });
      say(m.name + (notes.length ? '. ' + notes.join(' ') : '.'));
      if (def.asleep && def.hp > 0) { def.asleep = 0; setTimeout(function () { float(B.x, B.y - 30, 'Woke up', '#b9a8ff'); }, 300); }
      renderUI(); await wait(700);
      return r.dmg;
    }

    // ---------------- my move
    async function meAct(m) {
      if (me.hp <= 0) return;
      if (me.asleep) { me.asleep = 0; say('It dozes, then wakes.'); float(POS.me.x, POS.me.y - 20, 'Zzz', '#b9a8ff'); await wait(900); return; }
      if (m.cd) me.cd[m.id] = m.cd;
      if (m.pow) { say(m.name + '!'); sfx('spell'); await attack('me', m); return; }
      // utility moves
      var X = mkX('me', 'me'); X.b = X.a;
      if (m.util === 'mist' || m.util === 'static') X = mkX('me', 'foe');
      say(m.name + '!'); sfx('sparkle');
      await (H.moves.ANIM[m.id])(X);
      if (m.util === 'glow') { me.glow = 3; say('A warm glow. Attacks are stronger.'); }
      else if (m.util === 'mist') { foe.mist = 3; say('Mist rolls in. The foe aims worse.'); }
      else if (m.util === 'tail') { me.tail = 3; say('A tailwind. Yours moves first.'); }
      else if (m.util === 'root') { me.root = 3; say('Roots sink deep.'); }
      else if (m.util === 'static') { var dmg = 1 + (Math.random() < 0.5 ? 1 : 0); foe.hp = Math.max(0, foe.hp - dmg); float(POS.foe.x, POS.foe.y - 14, '-' + dmg, '#fff', true); if (Math.random() < 0.4) { foe.stun = 1; foe.charged = false; say('Static locks it in place.'); } else say('It shakes off the static.'); }
      else if (m.util === 'harden') { me.harden = 2; say('A stone shell forms.'); }
      else if (m.util === 'veil') { me.veil = 1; say('It steps into the shadows.'); }
      else if (m.util === 'bless') { var h = Math.min(me.max - me.hp, 6); me.hp += h; me.asleep = 0; float(POS.me.x, POS.me.y - 16, '+' + h, '#9cf0a6', true); say('A blessing. It feels clear.'); }
      renderUI(); await wait(600);
    }
    // ---------------- foe action
    async function foeAct() {
      if (foe.hp <= 0) return;
      if (foe.stun) { foe.stun = 0; say('It cannot move!'); float(POS.foe.x, POS.foe.y - 22, 'Stunned', '#ffe27a'); await wait(900); return; }
      if (foe.asleep) { foe.asleep--; say(foe.asleep ? 'It sleeps on.' : 'It wakes up.'); await wait(900); return; }
      var X = mkX('foe', 'me');
      if (intent === 'strike' || intent === 'unleash') {
        var sig = FMOV[1], use = intent === 'unleash' || (!foe.cd[sig.id] && Math.random() < 0.3) ? sig : FMOV[0];
        if (use.cd) foe.cd[use.id] = use.cd;
        say(intent === 'unleash' ? 'It unleashes ' + use.name + '!' : 'It uses ' + use.name + '.');
        foe.charged = false;
        await attack('foe', use, intent === 'unleash' ? 2 : 1);
      } else if (intent === 'charge') { say('It gathers power.'); await H.moves.charge(X, foe.el); foe.charged = true; }
      else if (intent === 'guard') { say('It braces itself.'); await H.moves.guard(X, foe.el); }
      else if (intent === 'heal') { X.b = X.a; await H.moves.heal(X, COL[foe.el]); var h = Math.min(foe.max - foe.hp, 4 + foe.lvl); foe.hp += h; float(POS.foe.x, POS.foe.y - 16, '+' + h, '#9cf0a6', true); say('It restores itself.'); }
      else if (intent === 'hex') {
        say('It casts a hex.'); await H.moves.hex(X);
        if (me.veil) { me.veil = 0; say('The hex passes through the veil.'); }
        else if (Math.random() < 0.45) { me.asleep = 1; float(POS.me.x, POS.me.y - 20, 'Asleep', '#b9a8ff', true); say('Yours falls asleep.'); }
        else say('Yours resists the hex.');
      }
      lastIntent = intent; renderUI(); await wait(500);
    }
    async function useMove(i) {
      if (busy || done) return;
      var m = MOV[i];
      if (me.hp <= 0) { say(canCast('revive') === true ? 'It fainted. Draw the Phoenix Star.' : 'It fainted.'); return; }
      if (me.cd[m.id] > 0) { say(m.name + ' needs rest.'); return; }
      runRound(quickFoe() ? [foeAct, function () { return meAct(m); }] : [function () { return meAct(m); }, foeAct]);
    }
    async function runRound(order) {
      busy = true; strip.hidden = true; renderUI(); mvBtns.forEach(function (b) { b.classList.remove('hot'); });
      sheetBtn.classList.remove('hot'); chips.mend.classList.remove('hot');
      for (var k = 0; k < order.length; k++) {
        await order[k]();
        if (foe.hp <= 0) return win();
        if (me.hp <= 0) { me.fx.alpha = 1; say('Yours fainted.'); renderUI(); await wait(900); break; }
      }
      // end of round
      if (me.root && me.hp > 0) { var h = Math.min(me.max - me.hp, 3); me.hp += h; me.root--; if (h) float(POS.me.x, POS.me.y - 16, '+' + h, '#9cf0a6', true); }
      ['glow', 'tail', 'harden'].forEach(function (k2) { if (me[k2]) me[k2]--; });
      if (foe.mist) foe.mist--;
      foe.guard = false;
      if (tut >= 0) { tut = tut === 0 ? (can('mend') ? 1 : 2) : tut === 1 ? 2 : -1; }
      renderUI(); await wait(300);
      beginTurn();
    }

    // ---------------- spells
    async function castSpell(kind, sc, cx, cy, sz) {
      var S = SPELLS[kind], tgt = S.on === 'me' ? 'me' : 'foe', P = POS[tgt], f = F(tgt);
      busy = true; spellUsed = true; mana -= costOf(kind); renderUI(); sfx('wand');
      if (tut === 1 && kind === 'mend') tutMended = true;
      var gk = gradeOf(sc), G = GRADE[gk], gm = G[1], ml0 = mastery(kind);
      showGrade(G, cx, cy - Math.max(12, sz * 0.62) - 6);
      GS.spellXp[kind] = (GS.spellXp[kind] || 0) + G[3];
      var ml1 = mastery(kind); GS.spellMastery[kind] = ml1;
      say(S.name + '!');
      if (ml1 > ml0) setTimeout(function () { float(cx, cy - 4, 'Mastery ' + ml1, '#ffd98a', true); }, 500);
      fillChip(kind); TOL[kind] = tolOf(kind);
      if (!(GS.flags = GS.flags || {}).tipGrade) { GS.flags.tipGrade = 1; setTimeout(function () { if (!done) say('Neater sigils cast stronger.'); }, 900); }
      // 1) the drawn stroke snaps to the perfect sigil and flares; 2) it sinks to the ground under the target; 3) magic circle + light pillar
      var t0 = 0, rr = Math.max(12, sz * 0.62);
      await new Promise(function (res) {
        var fired = false;
        fxs.push({ t: 0, ms: 1700, draw: function (g2, k, t) {
          var ms = t, x, y, r, flat, a = 1;
          if (ms < 380) { var u = ms / 380; x = cx; y = cy; r = rr * (1 + 0.12 * Math.sin(u * Math.PI)); flat = 1; H.moves.blob(g2, cx, cy, rr * 1.6, rgba(S.col, 1), 0.5 * (1 - u)); }
          else if (ms < 680) { var v = (ms - 380) / 300, e = v * v * (3 - 2 * v); x = cx + (P.x - cx) * e; y = cy + (P.gy - cy) * e; r = rr + (22 - rr) * e; flat = 1 - 0.68 * e; }
          else { var w2 = (ms - 680) / 1020; x = P.x; y = P.gy; r = 22 + w2 * 6; flat = 0.32; a = w2 < 0.6 ? 1 : 1 - (w2 - 0.6) / 0.4;
            if (!fired && w2 > 0.2) { fired = true; res(); }
            // light pillar
            var pw = 10 * Math.sin(Math.min(1, w2 * 1.6) * Math.PI); if (pw > 0) { g2.globalCompositeOperation = 'lighter'; var lg = g2.createLinearGradient(0, y - 70, 0, y); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(1, rgba(S.col, 0.55)); g2.fillStyle = lg; g2.fillRect(x - pw, y - 70, pw * 2, 70); g2.globalCompositeOperation = 'source-over'; }
          }
          drawSigil(g2, kind, x, y, r, S.col, { rot: T * (ms < 680 ? 0.5 : 2.2), alpha: a, flat: flat, lw: 1 });
          if (ms >= 680) drawSigil(g2, kind, x, y, r * 0.62, '#ffffff', { rot: -T * 3, alpha: a * 0.5, flat: flat, simple: true, glyph: 0, seed: 3 });
        } });
      });
      burst(P.x, P.y, S.col, 26, 1.4);
      if (kind === 'mend') {
        var h = Math.min(me.max - me.hp, Math.round(7 * wandMul * gm)); me.hp += h; var woke = me.asleep; me.asleep = 0;
        for (var i = 0; i < 3; i++) setTimeout(function () { burst(P.x, P.y + 4, '#9cf0a6', 10, 0.8); }, i * 120);
        float(P.x, P.y - 16, '+' + h, '#9cf0a6', true); say(woke ? 'Mended and awake.' : 'Mended.');
      } else if (kind === 'shield') { me.shield = gm; say('An Aegis Ward shimmers.'); }
      else if (kind === 'boost') { me.boost = gm; say('The Rally Rune burns bright.'); }
      else if (kind === 'stun') { flash.c = '#fff8c0'; flash.a = 0.4; if (Math.random() < Math.min(0.95, 0.75 * gm)) { foe.stun = 1; foe.charged = false; foe.guard = false; say('The Thunder Seal holds it.'); } else say('It breaks the seal.'); }
      else if (kind === 'sleep') { if (Math.random() < Math.min(0.9, 0.6 * gm)) { foe.asleep = 2; foe.charged = false; foe.guard = false; say('The Dream Veil settles. It sleeps.'); } else say('It stays awake.'); }
      else if (kind === 'revive') {
        var it = matFor(); it.n = (it.n || 1) - 1; if (it.n <= 0) GS.items.splice(GS.items.indexOf(it), 1);
        flash.c = '#fff6e0'; flash.a = 0.6;
        for (var rv = 0; rv < 5; rv++) { burst(P.x, P.y, rv % 2 ? '#ffb060' : '#fff2a8', 14, 1.2); await wait(100); }
        me.hp = Math.min(me.max, Math.ceil(me.max / 2 * gm)); me.asleep = 0; float(P.x, P.y - 16, '+' + me.hp, '#9cf0a6', true);
        say(matName(matKey()) + ' glows. It rises again.');
        H.menu && H.menu.refresh && H.menu.refresh();
      } else if (kind === 'bind') { await bind(sc, gm); if (done) return; }
      renderUI(); await wait(700);
      if (done) return;
      busy = false; renderUI(); if (!done) say(hintLine());
    }
    async function bind(sc, gm) {
      var P = POS.foe, acc = sc ? sc.acc : 0.5;
      var chance = 0.05 + 0.45 * (1 - foe.hp / foe.max) + (foe.asleep ? 0.18 : 0) + (foe.stun ? 0.12 : 0) + 0.15 * acc - 0.07 * (foe.lvl - me.lvl) - (matrix(foe.el, me.el) > 1 ? 0.08 : 0) + (matrix(me.el, foe.el) > 1 ? 0.05 : 0);
      chance = Math.max(0.05, Math.min(0.85, chance * wandMul * (gm || 1) + (perks.captureBonus || 0) + calm));
      // a spiral of light wraps the foe, then three shakes
      fxs.push({ t: 0, ms: 2000, draw: function (g2, k) { var pts = []; for (var i = 0; i <= 40; i++) { var t = i / 40, a2 = t * 12 + k * 8, r = 22 * (1 - t * 0.8) * (1 - k * 0.3); pts.push([P.x + Math.cos(a2) * r, P.y + Math.sin(a2) * r * 0.8]); } inkStroke(g2, pts, 0.8, '#ffd98a', Math.sin(k * Math.PI)); } });
      for (var s = 0; s < 3; s++) { await wait(420); foe.fx.dx = s % 2 ? 3 : -3; foe.fx.alpha = 0.5; sfx('bump'); await wait(140); foe.fx.dx = 0; foe.fx.alpha = 1; }
      if (Math.random() < chance) {
        // it becomes a streak of light that flies into the wand
        await new Promise(function (res) { fxs.push({ t: 0, ms: 600, step: function (k) { foe.fx.alpha = 1 - k; foe.fx.lift = -k * 6; }, draw: function (g2, k) { var x = P.x + (POS.me.x - 30 - P.x) * k, y = P.y + (Hh - P.y) * k * k; H.moves.blob(g2, x, y, 10, 'rgba(255,230,160,1)', 1 - k * 0.5); }, done: res }); });
        burst(POS.me.x - 30, uiTop, '#ffd98a', 30, 1.5);
        return captured();
      }
      binds++;
      if (binds >= 3) { say('It slips away into the wild.'); foe.fx.alpha = 1; await new Promise(function (res) { fxs.push({ t: 0, ms: 700, step: function (k) { foe.fx.dx = k * 60; foe.fx.alpha = 1 - k; }, done: res }); }); return fleeEnd(); }
      say('It broke free. ' + (3 - binds) + (3 - binds === 1 ? ' try left.' : ' tries left.'));
      burst(P.x, P.y, '#ffd98a', 20, 1.4);
    }

    // ---------------- switching
    function alive() { var o = []; party.forEach(function (m, i) { if (i !== act && (m.hp == null ? 1 : m.hp) > 0) o.push(i); }); return o; }
    var forced = false;
    function openStrip(force) {
      forced = !!force; strip.innerHTML = ''; strip.hidden = false; sheet.hidden = true;
      party.forEach(function (m, i) {
        var sp = specOf(m.key), hp = i === act ? me.hp : (m.hp == null ? m.maxHp : m.hp), mx = m.maxHp || 20;
        var b = mk('button', 'hb-pm' + (i === act ? ' cur' : hp <= 0 ? ' out' : ''), strip); b.style.setProperty('--mc', COL[sp.element]);
        var pc = mk('canvas', '', b); pc.width = 40; pc.height = 40;
        try { var pg = pc.getContext('2d'); pg.imageSmoothingEnabled = false; H.spirits.draw(pg, m.key, 20, 26, { t: 0, time: 12, weather: 'clear' }, { scale: 1.3, stage: m.stage, sit: hp <= 0, noShadow: true }); } catch (e) {}
        mk('div', '', b, (m.nick || sp.name || cap(sp.element)) + '<div class="hb-hp"><b class="' + (hp / mx < 0.3 ? 'low' : '') + '" style="width:' + Math.max(0, Math.round(100 * hp / mx)) + '%"></b></div>');
        b.addEventListener('click', function () { if (i === act || hp <= 0 || done) return; switchTo(i); });
      });
      if (!(GS.flags = GS.flags || {}).tipSwitch && !force) { GS.flags.tipSwitch = 1; say('Switching uses your turn.'); }
    }
    async function swapAnim(out) {
      await new Promise(function (res) { fxs.push({ t: 0, ms: 320, step: function (k) { me.fx.dx = (out ? -k : -(1 - k)) * 50; me.fx.alpha = out ? 1 - k : k; }, done: res }); });
    }
    async function switchTo(i) {
      if (busy && !forced) return;
      var free = forced; forced = false; strip.hidden = true; busy = true; renderUI();
      if (me.src) me.src.hp = Math.max(0, me.hp);
      sfx('wand'); await swapAnim(true);
      act = i; me = mkMe(party[i]); me.fx.alpha = 0; if (fought.indexOf(i) < 0) fought.push(i);
      MOV = movesOf(party[i]); buildMoves(); renderUI();
      say(me.name + ', go!'); burst(POS.me.x, POS.me.y, COL[me.el], 18, 1.2);
      await swapAnim(false); me.fx.dx = 0; me.fx.alpha = 1;
      if (free) { renderUI(); await wait(300); busy = false; renderUI(); say(hintLine()); return; }
      runRound([foeAct]);
    }
    swBtn.addEventListener('click', function () {
      if (done) return;
      if (!strip.hidden) { if (!forced) strip.hidden = true; return; }
      if (busy || !alive().length) return;
      openStrip(false);
    });
    // ---------------- escape
    var escTries = 0, escArmed = false;
    function escChance() {
      var c = 0.4 + 0.08 * (me.lvl - foe.lvl) + 0.2 * escTries + (foe.asleep || foe.stun ? 0.3 : 0) - (quickFoe() ? 0.1 : 0);
      return Math.max(0.1, Math.min(0.95, c));
    }
    escBtn.addEventListener('click', function () {
      if (done) return;
      if (TR) { say('No escape from a duel.'); return; }
      if (busy) return;
      if (!(GS.flags = GS.flags || {}).tipEscape && !escArmed) { escArmed = true; say('The bars show your chance. Tap again to run.'); return; }
      GS.flags.tipEscape = 1; escArmed = false;
      if (Math.random() < escChance()) return escapeOk();
      escTries++; say('It blocks the way.'); sfx('bump');
      runRound([function () { return wait(500); }, foeAct]);
    });
    async function escapeOk() {
      busy = true; done = true; strip.hidden = true; sheet.hidden = true; say('You slip away.'); sfx('sparkle');
      for (var i = 0; i < 10; i++) parts.push({ x: POS.me.x + 6, y: POS.me.gy - Math.random() * 10, vx: 1 + Math.random(), vy: -Math.random() * 0.4, l: 1, d: 0.04, c: '#dfe6ff', s: 1.5 });
      await new Promise(function (res) { fxs.push({ t: 0, ms: 450, step: function (k) { me.fx.dx = -k * k * (POS.me.x + 30); me.fx.alpha = 1 - k * 0.5; }, done: res }); });
      result.fled = true; saveHp(); GS.mana = mana; if (H.game && H.game.save) H.game.save();
      setTimeout(closeNow, 250);
    }
    var closeNow = function () {};
    function saveHp() {
      if (me.src) me.src.hp = Math.max(TR ? me.src.maxHp : 1, me.hp);
      fought.forEach(function (i) { var m = party[i]; if (!m) return; if (TR) m.hp = m.maxHp; else if (m.hp != null && m.hp <= 0) m.hp = 1; });
      result.participants = fought.slice(); result.active = act;
    }

    // ---------------- endings
    async function win() {
      done = true; busy = true; renderUI(); sfx('wand'); say('');
      for (var i = 0; i < 6; i++) { burst(POS.foe.x, POS.foe.y, '#fff2a8', 12, 1); await wait(110); }
      foe.fx.alpha = 0.6; result.won = true;
      if (!TR) { GS.seen = GS.seen || []; if (GS.seen.indexOf(foe.key) < 0) GS.seen.push(foe.key); }
      await wait(500);
      say(TR ? (TR.name || 'Trainer') + ': Well fought.' : '');
      finish();
    }
    function captured() {
      GS.flags = GS.flags || {}; GS.flags.boundOnce = true;
      done = true; sfx('wand'); result.captured = true; result.won = true; say('Bound into your wand!');
      GS.seen = GS.seen || []; if (GS.seen.indexOf(foe.key) < 0) GS.seen.push(foe.key);
      var joined = H.game && H.game.addHontori ? H.game.addHontori(foe.key) : false;
      if (!joined) { GS.wand = GS.wand || []; GS.wand.push(foe.key); }
      setTimeout(function () { say(joined ? 'It joins your party.' : 'It rests inside the wand.'); finish(); }, 900);
    }
    function fleeEnd() { done = true; result.fled = 'foe'; finish(); }
    function lose() { done = true; busy = true; say(TR ? 'A good try. Rest and try again.' : 'Your hontori needs rest.'); finish(); }
    function finish() {
      done = true; renderUI();
      saveHp();
      GS.mana = mana; if (!TR) GS.battles = (GS.battles || 0) + 1;
      if (H.game && H.game.save) H.game.save(); H.menu && H.menu.refresh && H.menu.refresh();
      setTimeout(function () { endBtn.hidden = false; }, 600);
      movesEl.style.opacity = '0.4'; bar.style.opacity = '0.4'; sheet.hidden = true;
    }

    // ---------------- input: draw spells
    function pt(e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / L, (e.clientY - r.top) / L]; }
    var pid = null, castable = ORDER.filter(function (k) { return can(k); });
    cv.addEventListener('pointerdown', function (e) { if (!sheet.hidden) { sheet.hidden = true; sheetOpen = false; } if (!strip.hidden && !forced) strip.hidden = true; if (busy || done) return; pid = e.pointerId; try { cv.setPointerCapture(pid); } catch (_) {} drawing = true; ink.trail = [pt(e)]; ink.col = '#ffe6b0'; ink.n = 0; e.preventDefault(); });
    cv.addEventListener('pointermove', function (e) {
      if (!drawing || e.pointerId !== pid) return; var p = pt(e), l = ink.trail[ink.trail.length - 1];
      if (Math.hypot(p[0] - l[0], p[1] - l[1]) < 0.7) return; ink.add(p);
      if (ink.n % 6 === 0 && ink.trail.length > 10) { var s = score(ink.trail, castable, TOL); if (s && s.d < 0.28) ink.col = SPELLS[s.guess].col; }
    });
    function up(e) {
      if (!drawing || e.pointerId !== pid) return; drawing = false; pid = null;
      var tr = ink.trail;
      if (tr.length < 6 || pathLen(tr) < 30 / L) { ink.trail = []; return; }
      // score in screen space so size thresholds match
      var sc = score(tr.map(function (q) { return [q[0] * L, q[1] * L]; }), castable, TOL), kind = sc && sc.kind;
      var minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9, cx = 0, cy = 0;
      tr.forEach(function (q) { minx = Math.min(minx, q[0]); maxx = Math.max(maxx, q[0]); miny = Math.min(miny, q[1]); maxy = Math.max(maxy, q[1]); });
      cx = (minx + maxx) / 2; cy = (miny + maxy) / 2;
      var why = !kind ? 'The ink crumbles. Try again.' : spellUsed ? 'One spell each turn.' : mana < costOf(kind) ? 'Not enough mana for the ' + SPELLS[kind].name + '.' : canCast(kind);
      if (kind === 'bind' && (TR || opts.noCapture)) { repelHand(); ink.ash(); return; } // another person's hontori: they push the spell away
      if (why !== true) { say(why); ink.ash(); sfx('bump'); return; }
      ink.trail = [];
      castSpell(kind, sc, cx, cy, Math.max(maxx - minx, maxy - miny));
    }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    herbBtn.addEventListener('click', function () {
      if (busy || done) return; var it = (GS.items || []).filter(function (i) { return i.id === 'herb'; })[0]; if (!it || mana >= maxMana) return;
      it.n = (it.n || 1) - 1; if (it.n <= 0) GS.items.splice(GS.items.indexOf(it), 1);
      mana++; sfx('sparkle'); burst(POS.me.x, POS.me.y, '#9fd0ff', 16, 1); float(POS.me.x, POS.me.y - 18, '+1 mana', '#9fd0ff', true); say('The herb restores a little mana.'); renderUI();
    });

    // bread: once per battle, calms a wild foe so a binding holds more easily
    breadBtn.addEventListener('click', function () {
      if (busy || done || breadUsed || TR) return; var it = (GS.items || []).filter(function (i) { return i.id === 'bread'; })[0]; if (!it) return;
      it.n = (it.n || 1) - 1; if (it.n <= 0) GS.items.splice(GS.items.indexOf(it), 1);
      breadUsed = true; calm = 0.15; sfx('sparkle'); burst(POS.foe.x, POS.foe.y, '#ffd890', 14, 1);
      if (!(GS.flags = GS.flags || {}).tipBread) { GS.flags.tipBread = true; say('It nibbles the bread and calms down. A binding holds more easily now.'); } else say('It nibbles the bread and calms down.');
      renderUI();
    });

    // ---------------- go
    renderUI(); say(TR ? (TR.name || 'A trainer') + ' wants a practice duel.' : 'A jealous hontori blocks the way!');
    setTimeout(showBanner, 300);
    setTimeout(function () { if (!done) beginTurn(); }, 2700);

    return new Promise(function (resolve) {
      function close() {
        if (ended) return; ended = true; live = false; el.classList.remove('on'); window.removeEventListener('resize', size); setTimeout(function () { el.remove(); }, 350);
        // report who fought so EXP is shared; progress marks itself handled
        var P = H.progress;
        if (P && typeof P.onBattleEnd === 'function' && !opts.noProgress) {
          var info = { foeKey: result.foeKey, foeLevel: result.foeLevel, trainer: !!result.trainer };
          Promise.resolve().then(function () { return P.onBattleEnd(result, info); }).catch(function (e) { console.warn(e); }).then(function () { resolve(result); });
        } else resolve(result);
      }
      closeNow = close;
      endBtn.addEventListener('click', close);
    });
  }

  H.battle = { start: start, matrix: matrix, weatherMul: weatherMul, ELS: ELS, SPELLS: SPELLS };
})();
