window.H = window.H || {};
// Great-school pieces for Rootwood Hall (School of Grass): the Heart Tree, mossy stone pillars,
// leaf windows, banners, glowcaps, sprout pots, a moss runner and a stone dais. Drawn in code at 2x.
(function () {
  'use strict';
  var H = window.H, T = 16;
  if (!H.furniture || !H._hd) return;
  var HD = H._hd;
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; var g = c.getContext('2d'); g.imageSmoothingEnabled = false; return { c: c, g: g }; }
  function P(g, x, y, col, w, h) { g.fillStyle = col; g.fillRect(x | 0, y | 0, w || 1, h || 1); }
  function hash(a, b) { var h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function disc(g, cx, cy, r, col) { for (var y = -r; y <= r; y++) for (var x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) P(g, cx + x, cy + y, col); }
  function ell(g, cx, cy, rx, ry, col) { for (var y = -ry; y <= ry; y++) for (var x = -rx; x <= rx; x++) if ((x * x) / (rx * rx + 0.3) + (y * y) / (ry * ry + 0.3) <= 1) P(g, cx + x, cy + y, col); }
  var OL = '#1e1a14';
  var BARK = ['#3a2616', '#5a3a22', '#7a5232', '#9a6c42'];
  var LEAF = ['#1f4a26', '#2f6a32', '#46903e', '#6cb850', '#a4dc6a'];
  var STONE = ['#4a4c4a', '#6a6e68', '#8a8e86', '#aab0a4'];
  var MOSS = ['#2f5a28', '#4a7a34', '#6a9a44', '#8ec060'];

  var info = {
    heart_tree: { fw: 6, fh: 3, solid: true, light: { dx: 48, dy: 4, r: 110, color: '#c8ff90', flicker: true } },
    hall_wall: { fw: 1, fh: 1, solid: false, decor: true },
    root_wall: { fw: 1, fh: 1, solid: true },
    stone_pillar: { fw: 1, fh: 1, solid: true },
    leaf_window: { fw: 2, fh: 1, solid: false, decor: true, light: { dx: 16, dy: 30, r: 46, color: '#d8ffb0', flicker: false } },
    hall_banner: { fw: 1, fh: 1, solid: false, decor: true },
    glowcaps: { fw: 1, fh: 1, solid: true, light: { dx: 8, dy: 10, r: 26, color: '#80ffd8', flicker: true } },
    sprout_pot: { fw: 1, fh: 1, solid: true },
    moss_runner: { fw: 1, fh: 1, solid: false, decor: true },
    stone_dais: { fw: 6, fh: 2, solid: false, decor: true }
  };

  // ---------- static art (cached, then upscaled 2x like all furniture)
  var art = {};
  art.heart_tree = function () {
    // drawn on a 128 x 176 canvas; the bottom 96 x 48 sits on the tree's floor tiles (6 x 3)
    var s = mk(128, 176), g = s.g, K = 1.35, cx0 = 64, base = 168;
    function X(v) { return cx0 + (v - 48) * K; } function Y(v) { return base - (112 - v) * K; }
    for (var r = 0; r < 9; r++) {
      var a = -Math.PI + 0.2 + r * (Math.PI - 0.4) / 8, len = (26 + hash(r, 3) * 16) * K, x = cx0, y = base - 8;
      for (var k = 0; k < len; k++) { x += Math.cos(a); y += Math.abs(Math.sin(a)) * 0.3; var w = Math.max(1, 5 - k / 7); P(g, x - w / 2, y - 1, BARK[0], w + 1, 3); P(g, x - w / 2, y - 1, BARK[2], w, 1); }
    }
    for (var yy = Y(28); yy < base; yy++) {
      var t = (yy - Y(28)) / (base - Y(28)), w2 = (13 + t * t * 22) * K, cx = cx0 + Math.sin(yy * 0.07) * 2.5;
      P(g, cx - w2 / 2 - 1, yy, OL, w2 + 2, 1); P(g, cx - w2 / 2, yy, BARK[1], w2, 1);
      P(g, cx - w2 / 2, yy, BARK[2], Math.max(2, w2 * 0.28), 1); P(g, cx + w2 / 2 - 4, yy, BARK[0], 4, 1);
      if (((yy | 0) + (hash(yy | 0, 1) * 5 | 0)) % 6 === 0) P(g, cx - w2 / 4 + hash(yy | 0, 2) * w2 / 2, yy, BARK[0], 1, 4);
      if ((yy | 0) % 9 === 0) P(g, cx - w2 / 2 + 2, yy, BARK[3], 3, 1);
    }
    ell(g, cx0, Y(86), 8, 12, '#1a1208'); ell(g, cx0, Y(88), 6, 9, '#c8ff80'); ell(g, cx0, Y(89), 3, 5, '#ffffe0');
    [[-1, 40], [1, 38], [-1, 52], [1, 50], [-1, 30], [1, 30]].forEach(function (b, i) { for (var k = 0; k < 24; k++) P(g, cx0 + b[0] * k * 1.3, Y(b[1]) - k * 0.8, i % 3 === 0 ? BARK[1] : BARK[0], 3, 2); });
    var cl = [[48, 26, 34, 22], [22, 36, 18, 13], [74, 36, 18, 13], [34, 14, 18, 12], [62, 14, 18, 12], [48, 4, 16, 10], [12, 22, 12, 9], [84, 22, 12, 9]];
    function C(c, dx, dy, dr, ry) { ell(g, X(c[0]) + dx, Y(c[1]) + dy, Math.max(2, c[2] * K + dr), Math.max(2, c[3] * K + ry), arguments[5]); }
    cl.forEach(function (c) { ell(g, X(c[0]), Y(c[1]) + 3, c[2] * K + 1, c[3] * K + 1, OL); });
    cl.forEach(function (c) { ell(g, X(c[0]), Y(c[1]) + 2, c[2] * K, c[3] * K, LEAF[0]); });
    cl.forEach(function (c) { ell(g, X(c[0]) - 3, Y(c[1]), c[2] * K - 4, c[3] * K - 4, LEAF[1]); });
    cl.forEach(function (c) { ell(g, X(c[0]) - 6, Y(c[1]) - 3, Math.max(2, c[2] * K - 11), Math.max(2, c[3] * K - 9), LEAF[2]); });
    var d = g.getImageData(0, 0, 128, 176).data;
    for (var i = 0; i < 520; i++) {
      var lx = 2 + hash(i, 9) * 124, ly = 2 + hash(i, 11) * 90, a3 = d[(((ly | 0) * 128) + (lx | 0)) * 4 + 3];
      if (a3 < 10) continue;
      P(g, lx, ly, hash(i, 13) < 0.07 ? '#ffe07a' : hash(i, 13) < 0.45 ? LEAF[3] : LEAF[1], hash(i, 5) < 0.3 ? 2 : 1, 1);
    }
    for (i = 0; i < 70; i++) { var qx = 10 + hash(i, 21) * 108, qy = 4 + hash(i, 23) * 50; if (d[(((qy | 0) * 128) + (qx | 0)) * 4 + 3] > 10) P(g, qx, qy, LEAF[4], 1, 1); }
    [[18, 58], [32, 64], [94, 64], [108, 58], [70, 66], [52, 62]].forEach(function (v, i) { for (var k = 0; k < 16 + i * 3; k++) { P(g, v[0] + Math.sin(k * 0.5), v[1] + k, LEAF[1]); if (k % 4 === 1) P(g, v[0] + 1, v[1] + k, LEAF[3]); } });
    return { c: s.c, ox: -16, oy: -(176 - 48) };
  };
  art.hall_wall = function () {
    var s = mk(16, 32), g = s.g;
    P(g, 0, 0, STONE[1], 16, 32);
    for (var y = 0; y < 32; y += 6) { P(g, 0, y, STONE[0], 16, 1); var off = (y / 6) % 2 ? 0 : 8; P(g, off, y, STONE[0], 1, 6); P(g, (off + 8) % 16, y + 1, STONE[2], 6, 1); }
    for (var i = 0; i < 10; i++) P(g, hash(i, 1) * 15, hash(i, 2) * 30, STONE[hash(i, 3) < 0.5 ? 2 : 0]);
    P(g, 0, 29, '#3a3a36', 16, 3); P(g, 0, 29, STONE[3], 16, 1);
    for (var x = 0; x < 16; x++) if (hash(x, 9) < 0.5) P(g, x, 26 + (hash(x, 8) * 3 | 0), MOSS[(hash(x, 7) * 3) | 0], 1, 3);
    return { c: s.c, ox: 0, oy: 0 };
  };
  art.root_wall = function () {
    // a living hedge wall: dense leaves on top, a band of twisted roots at the foot
    var s = mk(16, 28), g = s.g;
    P(g, 0, 24, 'rgba(20,10,5,0.35)', 16, 4);
    P(g, 0, 18, OL, 16, 7); for (var i = 0; i < 4; i++) { P(g, i * 4, 18, BARK[1 + (i % 2)], 3, 6); P(g, i * 4, 18, BARK[3], 1, 3); }
    P(g, 0, 2, OL, 16, 17); P(g, 1, 3, LEAF[0], 14, 15);
    for (i = 0; i < 46; i++) { var x = 1 + hash(i, 3) * 13, y = 3 + hash(i, 4) * 14; P(g, x, y, hash(i, 5) < 0.4 ? LEAF[1] : hash(i, 5) < 0.8 ? LEAF[2] : LEAF[3], 2, 2); }
    for (i = 0; i < 8; i++) P(g, 2 + hash(i, 6) * 12, 3 + hash(i, 7) * 4, LEAF[4], 1, 1);
    P(g, 1, 3, LEAF[3], 14, 1);
    return { c: s.c, ox: 0, oy: -12 };
  };
  art.stone_pillar = function () {
    var s = mk(16, 60), g = s.g;
    // capital, shaft, base; mossy at the foot, ivy climbing
    P(g, 0, 2, OL, 16, 6); P(g, 1, 3, STONE[2], 14, 4); P(g, 1, 3, STONE[3], 14, 1); P(g, 1, 6, STONE[1], 14, 1);
    P(g, 2, 8, OL, 12, 40); P(g, 3, 8, STONE[1], 10, 40); P(g, 4, 8, STONE[2], 4, 40); P(g, 5, 8, STONE[3], 1, 40); P(g, 11, 8, STONE[0], 2, 40);
    for (var y = 12; y < 48; y += 8) P(g, 3, y, STONE[0], 10, 1);
    P(g, 0, 48, OL, 16, 10); P(g, 1, 49, STONE[2], 14, 8); P(g, 1, 49, STONE[3], 14, 1); P(g, 1, 56, STONE[0], 14, 1);
    for (var x = 1; x < 15; x++) if (hash(x, 4) < 0.7) P(g, x, 55 - (hash(x, 7) * 4 | 0), MOSS[(hash(x, 8) * 3) | 0], 1, 3);
    for (y = 10; y < 52; y++) { var vx = 4 + Math.sin(y * 0.35) * 3; P(g, vx, y, MOSS[0]); if (y % 3 === 0) { P(g, vx + 1, y, MOSS[2], 2, 1); P(g, vx - 1, y + 1, MOSS[3]); } }
    return { c: s.c, ox: 0, oy: -44 };
  };
  art.leaf_window = function () {
    var s = mk(32, 32), g = s.g;
    // pointed arch of stone with green and gold glass and a big leaf in the middle
    for (var y = 0; y < 30; y++) { var w = y < 10 ? Math.round(6 + y * 1.6) : 22, x = 16 - w / 2; P(g, x - 2, y + 1, OL, w + 4, 1); P(g, x - 1, y + 1, STONE[2], w + 2, 1); P(g, x + 1, y + 1, y % 4 < 2 ? '#7ad070' : '#5ab060', w - 2, 1); }
    for (y = 3; y < 29; y++) P(g, 15, y, STONE[1], 2, 1);
    for (var x = 7; x < 25; x++) P(g, x, 18, STONE[1]);
    ell(g, 16, 14, 4, 7, '#e8d060'); ell(g, 16, 14, 3, 6, '#fff0a0'); for (y = 8; y < 21; y++) P(g, 16, y, '#b89030');
    P(g, 9, 6, '#d8ffc0', 2, 1); P(g, 21, 22, '#c8f0a0', 2, 1);
    P(g, 4, 30, OL, 24, 2); P(g, 5, 30, STONE[3], 22, 1);
    return { c: s.c, ox: 0, oy: -8 };
  };
  art.hall_banner = function () {
    var s = mk(16, 30), g = s.g;
    P(g, 1, 0, '#8a6a30', 14, 2); P(g, 2, 2, OL, 12, 24); P(g, 3, 2, '#2f7a3a', 10, 23); P(g, 3, 2, '#4a9a4a', 2, 23);
    for (var x = 3; x < 13; x++) P(g, x, 25 + (x % 2), '#2f7a3a');
    P(g, 3, 4, '#e0c060', 10, 1); P(g, 3, 22, '#e0c060', 10, 1);
    ell(g, 8, 13, 3, 5, '#e0c060'); for (var y = 9; y < 18; y++) P(g, 8, y, '#8a6a20');
    return { c: s.c, ox: 0, oy: -14 };
  };
  art.sprout_pot_dry = function () { return pot(false); };
  art.sprout_pot_wet = function () { return pot(true); };
  function pot(ok) {
    var s = mk(16, 24), g = s.g;
    P(g, 3, 14, OL, 10, 9); P(g, 4, 15, '#c0683a', 8, 7); P(g, 4, 15, '#e08a52', 2, 7); P(g, 2, 13, OL, 12, 3); P(g, 3, 14, '#d07a44', 10, 1);
    P(g, 4, 13, '#3a2616', 8, 1);
    if (ok) { for (var y = 3; y < 13; y++) P(g, 8, y, MOSS[1]); ell(g, 5, 7, 3, 2, MOSS[2]); ell(g, 11, 5, 3, 2, MOSS[3]); disc(g, 8, 2, 2, '#ffd0e8'); P(g, 8, 2, '#fff8a0'); }
    else { for (var k = 0; k < 7; k++) P(g, 8 + (k > 3 ? k - 3 : 0), 12 - k, '#8a7a40'); P(g, 11, 10, '#6a5a30', 2, 1); P(g, 6, 11, '#7a6a38', 2, 1); }
    return { c: s.c, ox: 0, oy: -8 };
  }
  art.glowcaps = function () {
    var s = mk(16, 16), g = s.g;
    [[4, 11, 3], [10, 9, 4], [12, 13, 2], [7, 13, 2]].forEach(function (m) { P(g, m[0], m[1], '#e8e0c8', 1, 16 - m[1] - 1); ell(g, m[0], m[1], m[2], Math.max(1, m[2] - 1), '#1a4a4a'); ell(g, m[0], m[1] - 1, m[2] - 1, Math.max(1, m[2] - 2), '#60e8c8'); P(g, m[0] - 1, m[1] - 2, '#d8fff0'); });
    return { c: s.c, ox: 0, oy: 0 };
  };
  art.stone_dais = function () {
    var s = mk(96, 32), g = s.g;
    P(g, 0, 2, OL, 96, 30); P(g, 1, 3, STONE[2], 94, 14); P(g, 1, 3, STONE[3], 94, 1);
    for (var x = 1; x < 95; x += 12) P(g, x, 3, STONE[1], 1, 14);
    P(g, 4, 17, OL, 88, 1); P(g, 5, 18, STONE[1], 86, 12); P(g, 5, 18, STONE[2], 86, 1);
    for (x = 0; x < 96; x++) if (hash(x, 2) < 0.35) P(g, x, 16 - (hash(x, 3) * 2 | 0), MOSS[(hash(x, 4) * 3) | 0], 1, 2);
    return { c: s.c, ox: 0, oy: 0 };
  };
  var cache = {};
  function blitArt(ctx, key, px, py) { var a = cache[key] || (cache[key] = art[key]()); HD.blit(ctx, a.c, px + a.ox, py + a.oy); }

  function moss(ctx, px, py) {
    var tx = px / T | 0, ty = py / T | 0;
    for (var y = 0; y < 16; y += 2) for (var x = 0; x < 16; x += 2) {
      var h = hash(tx * 16 + x, ty * 16 + y), c = h < 0.25 ? MOSS[0] : h < 0.7 ? MOSS[1] : h < 0.95 ? MOSS[2] : MOSS[3];
      ctx.fillStyle = c; ctx.fillRect(px + x, py + y, 2, 2);
      if (h > 0.985) { ctx.fillStyle = hash(x, y + tx) < 0.5 ? '#ffe8f0' : '#fff6a0'; ctx.fillRect(px + x, py + y, 1, 1); }
    }
  }

  // ---------- draw (animated touches on top of the cached art)
  function draw(ctx, type, px, py, env) {
    var t = (env && env.t) || 0;
    if (type === 'moss_runner') return moss(ctx, px, py), true;
    if (type === 'sprout_pot') { var f = (H.game && H.game.state && H.game.state.flags) || {}; blitArt(ctx, f['c2:sprouts'] ? 'sprout_pot_wet' : 'sprout_pot_dry', px, py); return true; }
    if (!art[type]) return false;
    blitArt(ctx, type, px, py);
    if (type === 'heart_tree') {
      // fireflies and slow falling leaves around the canopy
      for (var i = 0; i < 9; i++) {
        var a = t * (0.4 + i * 0.05) + i * 1.7, fx = px + 48 + Math.cos(a) * (26 + i * 4), fy = py - 60 + Math.sin(a * 1.3) * 14, on = (Math.sin(t * 3 + i) + 1) / 2;
        ctx.fillStyle = 'rgba(220,255,140,' + (0.4 + on * 0.6).toFixed(2) + ')'; ctx.fillRect(fx | 0, fy | 0, 1, 1);
      }
      for (i = 0; i < 3; i++) { var k = ((t * 0.12 + i / 3) % 1), lx = px + 14 + i * 30 + Math.sin(t + i) * 6, ly = py - 90 + k * 110;
        ctx.fillStyle = i === 1 ? '#ffe07a' : '#8ed060'; ctx.globalAlpha = 1 - k * 0.8; ctx.fillRect(lx | 0, ly | 0, 2, 1); ctx.globalAlpha = 1; }
    }
    if (type === 'leaf_window') { ctx.fillStyle = 'rgba(220,255,180,0.07)'; ctx.beginPath(); ctx.moveTo(px + 8, py + 14); ctx.lineTo(px + 24, py + 14); ctx.lineTo(px + 34, py + 60); ctx.lineTo(px + 2, py + 60); ctx.closePath(); ctx.fill(); }
    if (type === 'glowcaps') { var o = (Math.sin(t * 2 + px) + 1) / 2; ctx.fillStyle = 'rgba(128,255,216,' + (0.15 + o * 0.2).toFixed(2) + ')'; ctx.fillRect(px + 2, py + 4, 12, 10); }
    return true;
  }
  var fi = H.furniture.info; Object.keys(info).forEach(function (k) { fi[k] = info[k]; });
  var draw0 = H.furniture.draw;
  H.furniture.draw = function (ctx, type, px, py, env) { if (info[type] && draw(ctx, type, px, py, env)) return; return draw0.apply(this, arguments); };

  // ---------- what the kid and the fox say about each piece
  var LINES = {
    heart_tree: [['A tree, growing inside the hall. Its roots run under the floor.', 'Old roots deep, the hall they keep.'], ['The hollow glows like a lantern.', 'A light inside, where spirits hide.']],
    stone_pillar: [['Ivy climbs all the way to the roof.', null], ['The stone is cool and covered in moss.', null]],
    leaf_window: [['Green glass with a golden leaf.', 'Light through leaves, the green hall breathes.']],
    hall_banner: [['The banner of the School of Grass.', null]],
    glowcaps: [['Tiny mushrooms that glow on their own.', 'Small and bright in the forest night.']],
    sprout_pot: [['A sprout in a clay pot.', null]],
    stone_dais: [['A stone dais in front of the Heart Tree.', null]],
    root_wall: [['A hedge grown on old roots, thick as a wall.', 'Roots that twist and roots that turn. Push the leaves, and they will learn.'], ['The roots do not move. The leaves might.', null]],
    moss_runner: [['Soft moss, like a carpet.', null]]
  };
  function hook() {
    if (!H.interact || H.interact.__hall) return; H.interact.__hall = true;
    var has0 = H.interact.has, run0 = H.interact.run;
    H.interact.has = function (t) { return !!LINES[t] || has0.apply(this, arguments); };
    H.interact.run = function (t, c) {
      if (!LINES[t]) return run0.apply(this, arguments);
      var f = (H.game && H.game.state && H.game.state.flags) || {}, L = LINES[t];
      if (t === 'sprout_pot') L = [[f['c2:sprouts'] ? 'Awake and green, it even has a bud.' : 'Wilted and dry. Warden Fern will know what to do.', null]];
      var n = (c && c.object) ? ((c.object.__n = (c.object.__n || 0) + 1) - 1) : 0, l = L[n % L.length];
      var say = function (who, name, text, col) { return H.ui && H.ui.say ? Promise.resolve(H.ui.say(name, text, null, col)) : Promise.resolve(); };
      return say('kid', 'You', l[0], '#7cc8ff').then(function () { if (l[1] && c && c.hasSpirit) return say('hontori', H.spiritName || 'Fire Hontori', l[1], '#ffb04a'); });
    };
  }
  if (document.readyState === 'complete') setTimeout(hook, 0); else addEventListener('load', function () { setTimeout(hook, 0); });
})();
