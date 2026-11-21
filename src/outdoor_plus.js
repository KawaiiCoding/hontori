window.H = window.H || {};
(function () {
  'use strict';
  var H = window.H;
  var OUT = '#1b1522';
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function bay(x, y) { return (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16; }
  function hash(x, y, s) {
    var h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul((s | 0) + 7, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  // ---------- pixel grid helpers ----------
  function G(w, h) { var d = new Array(w * h); for (var i = 0; i < d.length; i++) d[i] = null; return { w: w, h: h, d: d }; }
  function sp(g, x, y, c) { x = x | 0; y = y | 0; if (x < 0 || y < 0 || x >= g.w || y >= g.h) return; g.d[y * g.w + x] = c; }
  function gp(g, x, y) { if (x < 0 || y < 0 || x >= g.w || y >= g.h) return null; return g.d[y * g.w + x]; }
  function rect(g, x, y, w, h, c) { for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) sp(g, x + i, y + j, c); }
  function pick(r, v, x, y) {
    var i = Math.floor(v * r.length + bay(x, y) - 0.5);
    return r[i < 0 ? 0 : i >= r.length ? r.length - 1 : i];
  }
  function ball(g, cx, cy, rx, ry, ramp, tex, bias, seed) {
    bias = bias || 0; seed = seed || 0;
    for (var y = -ry; y <= ry; y++) for (var x = -rx; x <= rx; x++) {
      var nx = x / (rx + 0.5), ny = y / (ry + 0.5), q = nx * nx + ny * ny;
      if (q > 1) continue;
      var nz = Math.sqrt(1 - q);
      var v = (-0.5 * nx - 0.62 * ny + 0.6 * nz + 0.55) / 1.45 + bias;
      var X = cx + x, Y = cy + y;
      if (tex) v += (hash(X >> 1, Y >> 1, seed) - 0.5) * tex + (hash(X, Y, seed + 1) - 0.5) * tex * 0.5;
      sp(g, X, Y, pick(ramp, clamp(v, 0, 0.999), X, Y));
    }
  }
  function cyl(g, x, y, w, h, ramp, bias) {
    for (var i = 0; i < w; i++) {
      var nx = (i + 0.5) / w * 2 - 1;
      var v = clamp(0.62 - nx * 0.45 - nx * nx * 0.35 + (bias || 0), 0, 0.999);
      for (var j = 0; j < h; j++) sp(g, x + i, y + j, pick(ramp, v, x + i, y + j));
    }
  }
  function outline(g, c) {
    var add = [];
    for (var y = 0; y < g.h; y++) for (var x = 0; x < g.w; x++) {
      if (gp(g, x, y)) continue;
      if (gp(g, x - 1, y) || gp(g, x + 1, y) || gp(g, x, y - 1) || gp(g, x, y + 1)) add.push(x, y);
    }
    for (var i = 0; i < add.length; i += 2) sp(g, add[i], add[i + 1], c || OUT);
  }
  function newCanvas(w, h) {
    if (typeof document !== 'undefined') { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
    return new OffscreenCanvas(w, h);
  }
  function toCanvas(g) {
    var c = newCanvas(g.w, g.h), x = c.getContext('2d');
    for (var j = 0; j < g.h; j++) for (var i = 0; i < g.w; i++) {
      var col = g.d[j * g.w + i]; if (!col) continue;
      x.fillStyle = col; x.fillRect(i, j, 1, 1);
    }
    return c;
  }
  function mk(g, ox, oy, oc) { if (oc !== false) outline(g, oc); return { c: toCanvas(g), ox: ox, oy: oy }; }
  var cache = {};
  function sprite(key, fn) { return cache[key] || (cache[key] = fn()); }
  function blit(ctx, s, px, py) { ctx.drawImage(s.c, Math.round(px + s.ox), Math.round(py + s.oy)); }
  function isNight(env) { var h = env && env.time != null ? env.time : 12; return h >= 19 || h < 6; }
  function sway(env, px, py, n, amp) {
    var t = env && env.t || 0, w = env && env.wind != null ? env.wind : 0.2;
    var sp_ = 1.2 + w * 2.2;
    var s = Math.sin(t * sp_ + px * 0.07 + py * 0.05) * (0.25 + w * 0.75) + Math.sin(t * sp_ * 2.3 + px * 0.13) * 0.15 * w;
    s = clamp(s * amp, -1, 1);
    return clamp(Math.round((s + 1) / 2 * (n - 1)), 0, n - 1);
  }

  // ---------- palettes ----------
  var LEAF = ['#16301f', '#22482a', '#2f6633', '#45863b', '#64a847', '#8fcb58', '#c3e87a'];
  var DLEAF = ['#13291f', '#1d4030', '#2a5a3a', '#3d7a43', '#5c9c4c', '#86c062'];
  var CHER = ['#4e1c38', '#7d2f57', '#b04d7c', '#d873a0', '#f19cc0', '#ffcfe2', '#fff0f6'];
  var BARK = ['#24170f', '#3c2717', '#5a3b22', '#7a5230', '#9a6c40'];
  var CBARK = ['#26141a', '#3e2228', '#5a343a', '#7a4c4e'];
  var WOOD = ['#2e1c14', '#4a2e1c', '#6a4426', '#8e5f33', '#b37f45', '#d6a466'];
  var STONE = ['#2a2b3a', '#424659', '#5f6579', '#82889d', '#a9afc0', '#d2d6e0'];
  var MOSS = ['#2c4a26', '#467032', '#6a9a40', '#9cc65a'];
  var HAY = ['#5a3e16', '#8a6420', '#b88b2c', '#dcb348', '#f2d877'];
  var PUMP = ['#5a1f0c', '#8f3812', '#c95a1a', '#ec8a2c', '#ffbb5a'];
  var APPLE = ['#4a0f16', '#8c1f24', '#cf3b32', '#f07a5a'];
  var SOIL = ['#2a1a14', '#3d281c', '#553826', '#6c4a32'];
  var WATER = ['#1d3f6e', '#2f68a0', '#4f97c8', '#8ad0ec', '#d4f2ff'];
  var FLOWER_COLS = [
    ['#a8203a', '#e04a5a', '#ff8a8a'], ['#b06a10', '#f2b628', '#ffe680'], ['#5a2d9a', '#9a63e0', '#d0b0ff'],
    ['#c2c6d8', '#f4f4fa', '#ffffff'], ['#b0306a', '#ec6aa8', '#ffb0d4'], ['#2a5aa8', '#4f8ee8', '#a8d4ff'],
    ['#c0501a', '#f08a3a', '#ffc080']
  ];

  // ================= TREES =================
  function shearCanopy(g, can, ox, oy, s) {
    for (var j = 0; j < can.h; j++) {
      var off = Math.round(s * Math.pow((can.h - j) / can.h, 1.3));
      for (var i = 0; i < can.w; i++) { var c = can.d[j * can.w + i]; if (c) sp(g, i + ox + off, j + oy, c); }
    }
  }
  function canopy(ramp, blobs, seed, accents) {
    var g = G(46, 42);
    blobs.forEach(function (b, i) { ball(g, b[0], b[1], b[2], b[3], ramp, 0.3, i >= 3 ? 0.04 : -0.06, seed); });
    for (var k = 0; k < 22; k++) {
      var cx = 7 + Math.floor(hash(k, 3, seed) * 32), cy = 4 + Math.floor(hash(k, 7, seed) * 28);
      if (!gp(g, cx, cy) || !gp(g, cx, cy + 3)) continue;
      for (var dx = -2; dx <= 2; dx++) {
        var yy = cy + (Math.abs(dx) === 2 ? 1 : 0);
        if (gp(g, cx + dx, yy)) sp(g, cx + dx, yy, cy < 16 ? ramp[ramp.length - 1] : ramp[ramp.length - 2]);
        if (gp(g, cx + dx, yy + 2)) sp(g, cx + dx, yy + 2, ramp[2]);
      }
    }
    if (accents) accents(g);
    return g;
  }
  function fruitTreeFrames() {
    var can = canopy(DLEAF, [[23, 28, 14, 8], [12, 24, 9, 8], [34, 24, 9, 8], [23, 17, 15, 11], [16, 10, 9, 7], [30, 10, 9, 7]], 31,
      function (g) {
        for (var a = 0; a < 15; a++) {
          var x = 8 + Math.floor(hash(a, 1, 99) * 30), y = 8 + Math.floor(hash(a, 2, 99) * 26);
          if (!gp(g, x, y) || !gp(g, x + 2, y + 2) || !gp(g, x - 1, y - 1)) continue;
          rect(g, x, y, 3, 3, APPLE[2]); sp(g, x, y + 2, APPLE[1]); sp(g, x + 2, y + 2, APPLE[0]);
          sp(g, x + 2, y + 1, APPLE[1]); sp(g, x, y, APPLE[3]); sp(g, x + 1, y - 1, '#5a3b22');
        }
      });
    var fr = [];
    for (var f = 0; f < 7; f++) {
      var g = G(54, 60);
      cyl(g, 24, 30, 6, 26, BARK); cyl(g, 22, 52, 10, 4, BARK, -0.05);
      for (var y = 32; y < 54; y += 4) sp(g, 26, y, BARK[0]);
      rect(g, 24, 30, 6, 4, BARK[0]);
      shearCanopy(g, can, 4, 0, (f - 3) * 1.1);
      // fallen apples near roots
      rect(g, 16, 55, 2, 2, APPLE[2]); sp(g, 16, 55, APPLE[3]); rect(g, 37, 56, 2, 2, APPLE[1]);
      fr.push(mk(g, -19, -44));
    }
    return fr;
  }
  function cherryTreeFrames() {
    var can = canopy(CHER, [[23, 28, 15, 8], [11, 24, 9, 7], [35, 23, 9, 8], [23, 16, 15, 11], [14, 10, 8, 7], [31, 9, 9, 7], [23, 6, 7, 5]], 57,
      function (g) {
        // peek-through branches
        for (var b = 0; b < 5; b++) {
          var x = 10 + Math.floor(hash(b, 5, 3) * 26), y = 14 + Math.floor(hash(b, 6, 3) * 16);
          for (var k = 0; k < 4; k++) if (gp(g, x + k, y - (k >> 1))) sp(g, x + k, y - (k >> 1), CBARK[1]);
        }
        for (var s = 0; s < 30; s++) {
          var sx = Math.floor(hash(s, 9, 4) * 46), sy = Math.floor(hash(s, 10, 4) * 40);
          if (gp(g, sx, sy)) sp(g, sx, sy, CHER[6]);
        }
      });
    var fr = [];
    for (var f = 0; f < 7; f++) {
      var g = G(54, 60);
      cyl(g, 24, 32, 6, 24, CBARK); cyl(g, 21, 52, 12, 4, CBARK, -0.05);
      for (var y = 34; y < 54; y += 3) { sp(g, 25, y, CBARK[0]); sp(g, 28, y + 1, CBARK[3]); }
      // forked limbs
      for (var k = 0; k < 8; k++) { sp(g, 23 - k, 33 - k, CBARK[1]); sp(g, 30 + k, 32 - k, CBARK[1]); sp(g, 24 - k, 33 - k, CBARK[2]); }
      shearCanopy(g, can, 4, 0, (f - 3) * 0.9);
      // fallen petals on ground
      [[14, 57], [19, 58], [33, 57], [38, 56], [27, 59], [10, 56]].forEach(function (p) { sp(g, p[0], p[1], CHER[4]); });
      fr.push(mk(g, -19, -44));
    }
    return fr;
  }

  // ================= SMALL PLANTS =================
  function flowerPatchFrames(variant) {
    var fr = [];
    var n = 6 + variant;
    for (var f = 0; f < 4; f++) {
      var g = G(18, 18);
      for (var k = 0; k < n; k++) {
        var bx = 2 + Math.floor(hash(k, 1, variant) * 13), by = 6 + Math.floor(hash(k, 2, variant) * 10);
        var col = FLOWER_COLS[Math.floor(hash(k, 3, variant) * FLOWER_COLS.length)];
        var off = f === 0 ? -1 : f === 3 ? 1 : 0;
        if (k % 2) off = -off;
        // stem + leaf
        sp(g, bx, by + 1, '#2f6633'); sp(g, bx, by + 2, '#22482a'); sp(g, bx + 1, by + 2, '#45863b');
        var hx = bx + (by < 10 ? off : 0), hy = by - 1;
        sp(g, hx, hy - 1, col[1]); sp(g, hx - 1, hy, col[1]); sp(g, hx + 1, hy, col[0]); sp(g, hx, hy + 1, col[0]);
        sp(g, hx - 1, hy - 1, col[2]);
        sp(g, hx, hy, k % 3 ? '#ffd84a' : '#6a3a1a');
      }
      fr.push(mk(g, -1, -3, '#1d3a22'));
    }
    return fr;
  }
  function butterflyBushFrames() {
    var fr = [];
    for (var f = 0; f < 4; f++) {
      var g = G(24, 26);
      ball(g, 12, 18, 9, 6, ['#18361f', '#265127', '#387131', '#53923e', '#7cb64e'], 0.35, 0, 8);
      var off = f - 1.5;
      for (var s = 0; s < 6; s++) {
        var x = 5 + s * 3, top = 4 + Math.floor(hash(s, 4, 12) * 6);
        var o = Math.round(off * (s % 2 ? 0.8 : 1.2));
        for (var y = top; y < 15; y++) {
          var xx = x + Math.round(o * (15 - y) / 11);
          var pc = ['#4a2470', '#7a3fb0', '#a86ae0', '#d6b0ff'][(y + s) % 3 + (y === top ? 1 : 0)];
          sp(g, xx, y, pc); if (y > top + 1 && y < 13) sp(g, xx + 1, y, (y % 2) ? '#7a3fb0' : '#a86ae0');
        }
      }
      fr.push(mk(g, -4, -10));
    }
    return fr;
  }
  function mushroomRing() {
    var g = G(16, 16);
    for (var i = 0; i < 7; i++) {
      var a = i / 7 * Math.PI * 2;
      var x = Math.round(8 + Math.cos(a) * 5.5), y = Math.round(9 + Math.sin(a) * 4);
      var red = i % 3 !== 1;
      sp(g, x, y + 1, '#e8dcc0'); sp(g, x, y + 2, '#c8b898');
      var cap = red ? ['#7a1a1a', '#c8302a', '#ff6a50'] : ['#5a3a20', '#9a6a3a', '#d4a066'];
      sp(g, x - 1, y, cap[1]); sp(g, x, y, cap[1]); sp(g, x + 1, y, cap[0]); sp(g, x, y - 1, cap[2]);
      if (red) sp(g, x - 1, y, '#fff4e0');
    }
    // fairy grass shimmer in middle
    sp(g, 8, 9, '#c3e87a'); sp(g, 7, 10, '#8fcb58'); sp(g, 9, 8, '#e0ffb0');
    return mk(g, 0, 0, '#22301c');
  }
  function reedsFrames() {
    var fr = [];
    for (var f = 0; f < 4; f++) {
      var g = G(18, 30);
      var off = f - 1.5;
      for (var s = 0; s < 7; s++) {
        var x = 2 + s * 2 + (s % 2), h = 14 + Math.floor(hash(s, 2, 21) * 10);
        for (var y = 0; y < h; y++) {
          var yy = 28 - y, xx = x + Math.round(off * y / h * (s % 2 ? 1.3 : 1));
          sp(g, xx, yy, y < 4 ? '#2a5a3a' : (s % 3 ? '#4f8a3e' : '#78ad4c'));
        }
        if (s % 2 === 0) {
          var tx = x + Math.round(off * 1.1), ty = 28 - h;
          rect(g, tx, ty, 2, 4, '#6a3a1c'); sp(g, tx, ty, '#9a5a2c'); sp(g, tx, ty - 1, '#4a2a14');
        }
      }
      fr.push(mk(g, -1, -14, '#14281c'));
    }
    return fr;
  }
  function lilypadFrames() {
    var fr = [];
    for (var f = 0; f < 2; f++) {
      var g = G(16, 16);
      function pad(cx, cy, r, fl) {
        for (var y = -r; y <= r; y++) for (var x = -r - 1; x <= r + 1; x++) {
          var q = (x * x) / ((r + 1.4) * (r + 1.4)) + (y * y) / (r * r + 0.5);
          if (q > 1) continue;
          if (x > 0 && Math.abs(y) <= (x >> 1) && y <= 0) continue; // notch
          sp(g, cx + x, cy + y, q > 0.6 ? '#2f6633' : (y < 0 ? '#64a847' : '#45863b'));
        }
        sp(g, cx - 1, cy - 1, '#a8d870');
        if (fl) {
          sp(g, cx - 1, cy - 2, '#f4b8d0'); sp(g, cx + 1, cy - 2, '#f4b8d0'); sp(g, cx, cy - 3, '#fff0f6');
          sp(g, cx, cy - 2, '#ffd84a'); sp(g, cx - 2, cy - 1, '#d873a0'); sp(g, cx + 2, cy - 1, '#d873a0');
        }
      }
      pad(5, 6 + f, 3, false); pad(10, 11 - f, 3, true);
      sp(g, 13, 4, '#45863b'); sp(g, 14, 4, '#2f6633');
      fr.push(mk(g, 0, 0, '#163024'));
    }
    return fr;
  }
  function pumpkin() {
    var g = G(16, 16);
    for (var r = 0; r < 3; r++) ball(g, 4 + r * 4, 10, 3, 4, PUMP, 0.1, r === 1 ? 0.08 : -0.05, r);
    for (var y = 7; y < 14; y++) { sp(g, 6, y, PUMP[1]); sp(g, 10, y, PUMP[1]); }
    rect(g, 7, 4, 2, 3, '#4a6a22'); sp(g, 8, 4, '#7aa040'); sp(g, 9, 3, '#5a3b22');
    sp(g, 10, 5, '#45863b'); sp(g, 11, 5, '#64a847'); sp(g, 12, 6, '#45863b');
    return mk(g, 0, 0);
  }

  // ================= STRUCTURES =================
  function stoneWall() {
    var g = G(16, 22);
    rect(g, 0, 6, 16, 16, STONE[2]);
    var rows = [[6, 5], [11, 5], [16, 6]];
    rows.forEach(function (r, ri) {
      var x = ri % 2 ? -4 : 0;
      while (x < 16) {
        var w = 5 + Math.floor(hash(x + 9, ri, 5) * 4);
        for (var j = 0; j < r[1]; j++) for (var i = 0; i < w; i++) {
          var X = x + i, Y = r[0] + j;
          if (X < 0 || X > 15) continue;
          var edge = i === 0 || j === r[1] - 1;
          var v = edge ? 0.05 : (j === 0 ? 0.85 : 0.55 - i / w * 0.3);
          sp(g, X, Y, edge ? STONE[1] : pick(STONE, clamp(v + (hash(X, Y, 3) - 0.5) * 0.2, 0, 0.99), X, Y));
        }
        x += w;
      }
    });
    for (var i = 0; i < 16; i++) { if (hash(i, 1, 8) < 0.7) sp(g, i, 5, MOSS[1 + (i % 3)]); if (hash(i, 2, 8) < 0.4) sp(g, i, 6, MOSS[2]); }
    sp(g, 3, 4, MOSS[3]); sp(g, 11, 4, MOSS[2]);
    return mk(g, 0, -6);
  }
  function hayBale() {
    var g = G(18, 18);
    for (var y = 0; y < 12; y++) for (var x = 0; x < 16; x++) {
      var nx = (x - 7.5) / 8, ny = (y - 6) / 6.5;
      if (nx * nx * 0.4 + ny * ny > 1) continue;
      var v = 0.75 - ny * 0.35 - nx * 0.2 + (hash(x, y, 3) - 0.5) * 0.25;
      sp(g, x + 1, y + 4, pick(HAY, clamp(v, 0, 0.99), x, y));
    }
    // round face spiral on left
    for (var a = 0; a < 18; a++) { var r = a / 6, t = a * 0.9; sp(g, Math.round(4 + Math.cos(t) * r), Math.round(10 + Math.sin(t) * r * 1.4), HAY[1]); }
    for (var s = 0; s < 6; s++) sp(g, 6 + s * 2, 5 + (s % 2), HAY[4]);
    rect(g, 1, 9, 16, 1, '#7a4a20');
    return mk(g, -1, -2);
  }
  function wheel(g, cx, cy) {
    for (var y = -4; y <= 4; y++) for (var x = -4; x <= 4; x++) {
      var d = x * x + y * y;
      if (d <= 17 && d >= 9) sp(g, cx + x, cy + y, y < 0 ? WOOD[3] : WOOD[1]);
    }
    sp(g, cx, cy, WOOD[4]); sp(g, cx, cy - 2, WOOD[2]); sp(g, cx, cy + 2, WOOD[2]); sp(g, cx - 2, cy, WOOD[2]); sp(g, cx + 2, cy, WOOD[2]);
  }
  function cart() {
    var g = G(36, 26);
    // bed
    rect(g, 4, 8, 26, 9, WOOD[2]);
    for (var x = 4; x < 30; x++) { sp(g, x, 8, WOOD[4]); sp(g, x, 12, WOOD[1]); sp(g, x, 16, WOOD[0]); }
    for (x = 4; x < 30; x += 6) for (var y = 9; y < 16; y++) sp(g, x, y, WOOD[1]);
    // produce load
    for (var k = 0; k < 7; k++) {
      var cx = 7 + k * 3.5, cyy = 6 - (k % 2);
      var pal = k % 3 === 0 ? APPLE : k % 3 === 1 ? PUMP : ['#2a4a1a', '#3d6a26', '#5a9a3a', '#8ac85a'];
      ball(g, Math.round(cx), cyy, 2, 2, pal, 0.05, 0, k);
    }
    // handles
    rect(g, 30, 12, 5, 1, WOOD[3]); rect(g, 30, 14, 5, 1, WOOD[2]);
    wheel(g, 10, 19); wheel(g, 24, 19);
    return mk(g, -2, -8);
  }
  function stallFrames(variant) {
    var stripeA = variant ? '#3a9a9a' : '#c8403a', stripeB = '#f4ead0', stripeD = variant ? '#1f5a62' : '#7a2424';
    var fr = [];
    for (var f = 0; f < 3; f++) {
      var g = G(36, 40);
      // posts
      cyl(g, 3, 8, 2, 30, WOOD); cyl(g, 31, 8, 2, 30, WOOD);
      // counter
      rect(g, 2, 26, 32, 12, WOOD[2]);
      for (var x = 2; x < 34; x++) { sp(g, x, 26, WOOD[5]); sp(g, x, 27, WOOD[4]); sp(g, x, 37, WOOD[0]); }
      for (x = 6; x < 34; x += 7) for (var y = 28; y < 37; y++) sp(g, x, y, WOOD[1]);
      // produce baskets
      var goods = variant ? [['#2a4a1a', '#3d6a26', '#5a9a3a', '#8ac85a'], PUMP, ['#3a1a5a', '#6a2f9a', '#9a5ad0', '#d0a8ff']]
        : [APPLE, ['#6a4a10', '#b08a20', '#e8c840', '#fff090'], ['#7a2a10', '#c8501a', '#f08a3a', '#ffc080']];
      for (var b = 0; b < 3; b++) {
        var bx = 4 + b * 10;
        rect(g, bx, 22, 8, 4, '#8e5f33'); for (var i = 0; i < 8; i += 2) sp(g, bx + i, 23, '#b37f45');
        for (var q = 0; q < 4; q++) ball(g, bx + 1 + q * 2, 21 - (q % 2), 1, 1, goods[b], 0, 0.1);
      }
      // awning with scallops flapping
      var flap = f - 1;
      for (y = 2; y < 12; y++) for (x = 0; x < 36; x++) {
        var xx = x + Math.round(flap * (y - 2) / 10);
        var str = Math.floor(x / 4) % 2 === 0;
        var col = str ? stripeA : stripeB;
        if (y < 4) col = str ? stripeD : '#d8ccb0';
        sp(g, xx, y, col);
      }
      for (x = 0; x < 36; x += 4) {
        var sx = x + flap, str2 = Math.floor(x / 4) % 2 === 0;
        sp(g, sx + 1, 12, str2 ? stripeA : stripeB); sp(g, sx + 2, 12, str2 ? stripeA : stripeB);
        sp(g, sx + 1, 13, str2 ? stripeD : '#d8ccb0');
      }
      rect(g, 1, 1, 34, 1, WOOD[3]);
      fr.push(mk(g, -2, -24));
    }
    return fr;
  }
  function laundryFrames() {
    var fr = [];
    var cloths = [['#e85a5a', '#b03a3a', 8, 7], ['#f4f0e4', '#c8c0a8', 13, 11], ['#5a8ae0', '#3a5aa8', 6, 6], ['#f2c84a', '#c8962a', 5, 8]];
    for (var f = 0; f < 3; f++) {
      var g = G(50, 34);
      cyl(g, 2, 4, 2, 30, WOOD); cyl(g, 45, 4, 2, 30, WOOD);
      rect(g, 0, 4, 6, 1, WOOD[3]); rect(g, 43, 4, 6, 1, WOOD[3]);
      var rope = function (x) { return 5 + Math.round(Math.sin((x - 3) / 42 * Math.PI) * 3); };
      for (var x = 4; x < 45; x++) sp(g, x, rope(x), '#d8ccb0');
      var cx = 7;
      cloths.forEach(function (c, i) {
        var top = rope(cx + (c[2] >> 1)) + 1;
        for (var yy = 0; yy < c[3]; yy++) for (var xx = 0; xx < c[2]; xx++) {
          var wave = Math.round(Math.sin(yy * 0.6 + f * 2.1 + i) * (yy / c[3]) * 1.5);
          sp(g, cx + xx + wave + (f - 1) * (yy > c[3] / 2 ? 1 : 0), top + yy, (xx === 0 || yy === c[3] - 1 || (xx + yy + f) % 5 === 0) ? c[1] : c[0]);
        }
        sp(g, cx + 1, top - 1, '#8e5f33'); sp(g, cx + c[2] - 2, top - 1, '#8e5f33');
        cx += c[2] + 3;
      });
      fr.push(mk(g, -1, -16));
    }
    return fr;
  }
  function steppingStone() {
    var g = G(16, 16);
    [[4, 5, 3, 2], [11, 8, 3, 2], [5, 12, 2, 2]].forEach(function (s, i) {
      ball(g, s[0], s[1], s[2], s[3], ['#5f6579', '#82889d', '#a9afc0', '#c4c8d4'], 0.15, 0.05, i);
    });
    return mk(g, 0, 0, '#3a3e4c');
  }
  function chimeFrames() {
    var fr = [];
    for (var f = 0; f < 3; f++) {
      var g = G(18, 36);
      cyl(g, 7, 6, 3, 30, WOOD);
      rect(g, 2, 4, 14, 2, WOOD[3]); rect(g, 1, 3, 16, 1, '#5c2629'); rect(g, 2, 2, 14, 1, '#843a34');
      var sw = f - 1;
      for (var c = 0; c < 4; c++) {
        var x = 3 + c * 4, len = 5 + (c % 2) * 2;
        for (var y = 0; y < len; y++) sp(g, x + Math.round(sw * y / len * (c % 2 ? -1 : 1)), 6 + y, c === 1 ? '#f2c84a' : (y % 2 ? '#82889d' : '#d2d6e0'));
      }
      // small bell
      rect(g, 8, 13, 2, 1, '#d89a3a'); rect(g, 7, 14, 4, 2, '#f2c84a'); sp(g, 7, 14, '#fff090'); sp(g, 8 + sw, 16, '#8f5a1a');
      // paper tag
      rect(g, 3 + sw, 13, 2, 4, '#f4ead0'); sp(g, 3 + sw, 16, '#c8403a');
      fr.push(mk(g, -1, -20));
    }
    return fr;
  }
  function gardenBed() {
    var g = G(34, 22);
    rect(g, 1, 8, 32, 12, WOOD[2]);
    for (var x = 1; x < 33; x++) { sp(g, x, 8, WOOD[4]); sp(g, x, 19, WOOD[0]); sp(g, x, 14, WOOD[1]); }
    rect(g, 3, 9, 28, 5, SOIL[1]);
    // neat soft furrows: evenly spaced gentle mounds, lit on the left
    for (x = 3; x < 31; x++) { var fq = (x - 3) % 5; if (fq === 0) rect(g, x, 9, 1, 5, SOIL[2]); else if (fq === 4) rect(g, x, 10, 1, 4, SOIL[0]); }
    // cabbages
    [5, 11].forEach(function (cx) { ball(g, cx, 8, 3, 2, ['#2a5a3a', '#4f8a3e', '#7ab84c', '#b8e080'], 0.2, 0.05); sp(g, cx, 8, '#d8f0a0'); });
    // carrots tops
    [16, 19, 22].forEach(function (cx) { sp(g, cx, 6, '#5a9a3a'); sp(g, cx - 1, 5, '#7ab84c'); sp(g, cx + 1, 5, '#7ab84c'); sp(g, cx, 7, '#64a847'); sp(g, cx, 9, '#ec8a2c'); });
    // tomato stake
    rect(g, 27, 0, 1, 10, WOOD[3]);
    for (var k = 0; k < 4; k++) { sp(g, 26 + (k % 2) * 2, 2 + k * 2, '#45863b'); sp(g, 28 - (k % 2) * 2, 3 + k * 2, '#e04a3a'); }
    sp(g, 26, 7, '#ff8a6a');
    return mk(g, -1, -6);
  }
  function birdbathFrames() {
    var fr = [];
    for (var f = 0; f < 2; f++) {
      var g = G(18, 26);
      cyl(g, 7, 12, 4, 12, STONE); cyl(g, 4, 22, 10, 3, STONE, -0.1);
      for (var x = 1; x < 17; x++) { var top = 8, bot = 12 - (Math.abs(x - 8.5) > 6 ? 1 : 0); for (var y = top; y <= bot; y++) sp(g, x, y, y === top ? STONE[5] : y === bot ? STONE[1] : STONE[3]); }
      rect(g, 3, 9, 12, 2, WATER[2]); sp(g, 5 + f * 4, 9, WATER[4]); sp(g, 10 - f * 3, 10, WATER[3]);
      sp(g, 2, 7, MOSS[2]); sp(g, 15, 12, MOSS[1]); sp(g, 8, 18, MOSS[2]);
      fr.push(mk(g, -1, -10));
    }
    return fr;
  }
  function statue() {
    var g = G(20, 40);
    // plinth
    cyl(g, 2, 28, 16, 10, STONE, 0.05);
    rect(g, 1, 27, 18, 2, STONE[4]);
    for (var x = 1; x < 19; x++) sp(g, x, 27, STONE[5]);
    rect(g, 6, 32, 8, 3, STONE[1]); rect(g, 7, 33, 6, 1, '#d8b04a');
    // spirit: round body, leaf ears, curled tail
    ball(g, 10, 20, 6, 6, STONE, 0.12, 0.05, 5);
    ball(g, 10, 11, 5, 4, STONE, 0.1, 0.1, 6);
    for (var e = 0; e < 4; e++) { sp(g, 6 - e, 8 - e, STONE[3]); sp(g, 7 - e, 8 - e, STONE[4]); sp(g, 14 + e, 8 - e, STONE[2]); sp(g, 13 + e, 8 - e, STONE[3]); }
    for (var t = 0; t < 8; t++) sp(g, 16 + Math.round(Math.cos(t * 0.7) * 2), 22 - t, STONE[2]);
    sp(g, 8, 11, '#2a2b3a'); sp(g, 12, 11, '#2a2b3a'); sp(g, 10, 13, STONE[1]);
    // moss and offering flowers
    sp(g, 6, 16, MOSS[1]); sp(g, 7, 15, MOSS[2]); sp(g, 13, 24, MOSS[1]); sp(g, 4, 26, MOSS[2]); sp(g, 15, 26, MOSS[3]);
    sp(g, 3, 25, '#ec6aa8'); sp(g, 4, 25, '#ffd84a'); sp(g, 16, 25, '#9a63e0');
    // glowing crest gem
    sp(g, 10, 18, '#8ad0ec'); sp(g, 10, 19, '#4f97c8');
    return mk(g, -2, -24);
  }
  function lanternString(night) {
    var g = G(50, 32);
    cyl(g, 2, 2, 2, 30, WOOD); cyl(g, 45, 2, 2, 30, WOOD);
    var rope = function (x) { return 3 + Math.round(Math.sin((x - 3) / 42 * Math.PI) * 4); };
    for (var x = 4; x < 45; x++) sp(g, x, rope(x), '#3c2717');
    var cols = [['#c8403a', '#ff7a5a', '#ffd0a0'], ['#d8a020', '#ffd84a', '#fff4c0'], ['#3a9a9a', '#6ad0c8', '#d0fff4'], ['#a03a8a', '#e070c0', '#ffd0f0']];
    for (var k = 0; k < 6; k++) {
      var lx = 8 + k * 6, ly = rope(lx) + 1, c = cols[k % 4];
      rect(g, lx, ly + 1, 4, 5, night ? c[1] : c[0]);
      rect(g, lx + 1, ly + 2, 2, 3, night ? c[2] : c[1]);
      rect(g, lx + 1, ly, 2, 1, '#2a1a14'); rect(g, lx + 1, ly + 6, 2, 1, '#2a1a14');
      sp(g, lx, ly + 3, night ? c[1] : '#5a1a1a');
    }
    return mk(g, -1, -18);
  }
  function logPile() {
    var g = G(34, 22);
    var pos = [[6, 15], [14, 15], [22, 15], [10, 9], [18, 9], [26, 15]];
    pos.forEach(function (p, i) {
      // log body going back
      rect(g, p[0], p[1] - 3, 8, 7, WOOD[2]);
      for (var x = 0; x < 8; x++) { sp(g, p[0] + x, p[1] - 3, BARK[3]); sp(g, p[0] + x, p[1] + 3, BARK[0]); }
    });
    pos.forEach(function (p, i) {
      for (var y = -3; y <= 3; y++) for (var x = -3; x <= 3; x++) {
        var d = x * x + y * y; if (d > 11) continue;
        sp(g, p[0] + x, p[1] + y, d > 7 ? BARK[1] : d > 3 ? '#d6a466' : d > 1 ? '#b37f45' : '#8e5f33');
      }
      sp(g, p[0] - 1, p[1] - 1, '#f0c88a');
    });
    rect(g, 30, 4, 1, 14, WOOD[1]); // axe handle leaning
    rect(g, 29, 3, 3, 2, STONE[3]); sp(g, 29, 3, STONE[5]);
    return mk(g, -1, -6);
  }

  // ---------- registry ----------
  var base = H.propsOutdoor || { info: {}, draw: function () {} };
  var oldDraw = base.draw;
  var INFO = {
    flower_patch: { fw: 1, fh: 1, solid: false, decor: true },
    mushroom_ring: { fw: 1, fh: 1, solid: false, decor: true },
    fruit_tree: { fw: 1, fh: 1, solid: true },
    cherry_tree: { fw: 1, fh: 1, solid: true },
    lilypad: { fw: 1, fh: 1, solid: true, decor: true },
    reeds: { fw: 1, fh: 1, solid: true },
    stone_wall_h: { fw: 1, fh: 1, solid: true },
    hay_bale: { fw: 1, fh: 1, solid: true },
    cart: { fw: 2, fh: 1, solid: true },
    market_stall: { fw: 2, fh: 1, solid: true },
    laundry_line: { fw: 3, fh: 1, solid: false, decor: true },
    stepping_stone: { fw: 1, fh: 1, solid: false, decor: true },
    windchime: { fw: 1, fh: 1, solid: true },
    garden_bed: { fw: 2, fh: 1, solid: true },
    birdbath: { fw: 1, fh: 1, solid: true },
    statue: { fw: 1, fh: 1, solid: true, light: { dx: 8, dy: -6, r: 18, color: '#6ab8d8', flicker: false } },
    lantern_string: { fw: 3, fh: 1, solid: false, decor: true, light: { dx: 24, dy: -10, r: 40, color: '#ffb070', flicker: true } },
    pumpkin: { fw: 1, fh: 1, solid: true },
    log_pile: { fw: 2, fh: 1, solid: true },
    butterfly_bush: { fw: 1, fh: 1, solid: true }
  };
  var STATIC = {
    mushroom_ring: mushroomRing, stone_wall_h: stoneWall, hay_bale: hayBale, cart: cart, stepping_stone: steppingStone,
    garden_bed: gardenBed, statue: statue, pumpkin: pumpkin, log_pile: logPile
  };
  for (var k in INFO) base.info[k] = INFO[k];

  base.draw = function (ctx, type, px, py, env) {
    env = env || {};
    if (!INFO[type]) return oldDraw.call(base, ctx, type, px, py, env);
    var fr, v;
    switch (type) {
      case 'fruit_tree': fr = sprite(type, fruitTreeFrames); return blit(ctx, fr[sway(env, px, py, fr.length, 1)], px, py);
      case 'cherry_tree': fr = sprite(type, cherryTreeFrames); return blit(ctx, fr[sway(env, px, py, fr.length, 1)], px, py);
      case 'flower_patch':
        v = Math.floor(hash(px >> 4, py >> 4, 2) * 3);
        fr = sprite(type + v, function () { return flowerPatchFrames(v); });
        return blit(ctx, fr[sway(env, px + 13, py, fr.length, 1)], px, py);
      case 'butterfly_bush': fr = sprite(type, butterflyBushFrames); return blit(ctx, fr[sway(env, px + 5, py, fr.length, 0.9)], px, py);
      case 'reeds': fr = sprite(type, reedsFrames); return blit(ctx, fr[sway(env, px + 3, py, fr.length, 1)], px, py);
      case 'lilypad': fr = sprite(type, lilypadFrames); return blit(ctx, fr[Math.floor((env.t || 0) * 0.8 + px * 0.03) & 1], px, py);
      case 'market_stall':
        v = (px >> 4) % 2;
        fr = sprite(type + v, function () { return stallFrames(v); });
        return blit(ctx, fr[sway(env, px, py, fr.length, 0.8)], px, py);
      case 'laundry_line': fr = sprite(type, laundryFrames); return blit(ctx, fr[Math.floor((env.t || 0) * (0.8 + (env.wind || 0.2) * 1.4)) % 3], px, py);
      case 'windchime': fr = sprite(type, chimeFrames); return blit(ctx, fr[sway(env, px, py, fr.length, 1.2)], px, py);
      case 'birdbath': fr = sprite(type, birdbathFrames); return blit(ctx, fr[Math.floor((env.t || 0) * 1.5) & 1], px, py);
      case 'lantern_string':
        var n = isNight(env) || (env.time != null && env.time >= 18);
        return blit(ctx, sprite('lstr' + (n ? 1 : 0), function () { return lanternString(n); }), px, py);
    }
    blit(ctx, sprite(type, STATIC[type]), px, py);
  };
  H.propsOutdoor = base;

  // =====================================================================
  // AMBIENT CRITTERS (world coordinates)
  // =====================================================================
  function tinySprite(w, h, rows, pal) {
    var c = newCanvas(w, h), x = c.getContext('2d');
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) {
      var ch = rows[j][i]; if (ch === '.') continue;
      x.fillStyle = pal[ch]; x.fillRect(i, j, 1, 1);
    }
    return c;
  }
  function flipCanvas(src) {
    var c = newCanvas(src.width, src.height), x = c.getContext('2d');
    x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0); return c;
  }
  var amb = null;
  function ambSprites() {
    if (amb) return amb;
    amb = { fly: [], bird: {}, duck: {} };
    var BF = [['#c8403a', '#ff8a5a'], ['#f2c84a', '#fff4a0'], ['#5a8ae0', '#b0d8ff'], ['#f4f4fa', '#ffffff'], ['#a86ae0', '#e0c0ff']];
    BF.forEach(function (c) {
      var pal = { o: '#2a1a24', a: c[0], b: c[1] };
      amb.fly.push([
        tinySprite(7, 5, ['ab.o.ba', 'aaooaaa', '.aoboa.', '.a.o.a.', '.......'], pal),
        tinySprite(7, 5, ['.......', '.bbobb.', '.aaoaa.', '...o...', '.......'], pal)
      ]);
    });
    var bp = { o: '#1b1522', a: '#8a5a3a', b: '#c89a6a', c: '#f4e4c8', k: '#000000', y: '#f2b628' };
    var stand = tinySprite(8, 7, ['..oo....', '.oaakoy.', 'oaaaao..', 'oabbbao.', '.occco..', '..o.o...', '........'], bp);
    var peck = tinySprite(8, 7, ['........', '..ooo...', '.oaaaoo.', 'oabbbaky', '.occcoo.', '..o.o...', '........'], bp);
    var flyA = tinySprite(9, 7, ['o.....o..', 'ao...oa..', '.aaoaa...', '..abbaoky', '...ccao..', '.........', '.........'], bp);
    var flyB = tinySprite(9, 7, ['.........', '.........', '..ooaoo..', '.aabbaoky', 'aa.ccao..', 'o........', '.........'], bp);
    amb.bird.r = [stand, peck, flyA, flyB]; amb.bird.l = amb.bird.r.map(flipCanvas);
    var dp = { o: '#1b1522', g: '#2f7a4a', w: '#f4f0e4', d: '#c8c0a8', y: '#f2a020', b: '#8a6a4a', k: '#000000' };
    var d1 = tinySprite(11, 8, ['.......oo..', '......oggo.', '......ogkyy', '.oo...oggo.', 'owwoooowdo.', 'owwwwwwwdo.', '.oddddddo..', '..oooooo...'], dp);
    var d2 = tinySprite(11, 8, ['.......oo..', '......oggo.', '......ogkyy', 'oo....oggo.', 'owwoooowdo.', '.owwwwwwdo.', '.oddddddo..', '..oooooo...'], dp);
    amb.duck.r = [d1, d2]; amb.duck.l = [flipCanvas(d1), flipCanvas(d2)];
    return amb;
  }

  H.ambient = {
    create: function (map) {
      var noop = { update: function () {}, draw: function () {} };
      if (!map || map.tileset !== 'outdoor') return noop;
      var T = 16, W = map.w, Hh = map.h;
      var ids = map.ground.map(function (r) { return r.split('').map(function (ch) { return map.legend[ch]; }); });
      var tile = function (tx, ty) { return ids[ty] && ids[ty][tx]; };
      var water = [], grass = [], blooms = [], cherries = [];
      for (var y = 0; y < Hh; y++) for (var x = 0; x < W; x++) {
        var id = ids[y][x];
        if (id === 'water') {
          var deep = tile(x - 1, y) === 'water' && tile(x + 1, y) === 'water' && tile(x, y - 1) === 'water' && tile(x, y + 1) === 'water';
          water.push([x, y, deep]);
        } else if (id === 'grass' || id === 'flowers' || id === 'tallgrass') grass.push([x, y]);
        if (id === 'flowers') blooms.push([x, y]);
      }
      var occupied = {};
      (map.props || []).forEach(function (p) {
        if (p.type === 'flower_patch' || p.type === 'butterfly_bush' || p.type === 'flowerbed' || p.type === 'garden_bed') blooms.push([p.x, p.y]);
        if (p.type === 'cherry_tree') cherries.push([p.x, p.y]);
        occupied[p.x + ',' + p.y] = 1;
      });
      (map.buildings || []).forEach(function (b) {
        var bi = H.buildings && H.buildings.info[b.type] || { fw: 4, fh: 4 };
        for (var yy = b.y - 3; yy < b.y + bi.fh; yy++) for (var xx = b.x; xx < b.x + bi.fw; xx++) occupied[xx + ',' + yy] = 1;
      });
      var openGrass = grass.filter(function (g) { return !occupied[g[0] + ',' + g[1]]; });
      var seed = 12345;
      function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
      function pickOf(a) { return a[Math.floor(rnd() * a.length)]; }
      var S = ambSprites();

      var flies = [], birds = [], ducks = [], ripples = [], petals = [], bugs = [];
      var i;
      for (i = 0; i < 16 && blooms.length; i++) {
        var hm = pickOf(blooms);
        flies.push({ hx: hm[0] * T + 8, hy: hm[1] * T + 4, x: hm[0] * T + 8, y: hm[1] * T, vx: 0, vy: 0, c: i % S.fly.length, ph: rnd() * 10, tgt: 0 });
      }
      for (i = 0; i < 10 && openGrass.length; i++) {
        var gs = pickOf(openGrass);
        birds.push({ x: gs[0] * T + 8, y: gs[1] * T + 12, z: 0, st: 0, timer: rnd() * 2, dir: rnd() < 0.5 ? 1 : -1, tx: 0, ty: 0, frame: 0 });
      }
      var deepW = water.filter(function (w) { return w[2]; });
      for (i = 0; i < Math.min(5, Math.floor(deepW.length / 12)); i++) {
        var dw = pickOf(deepW);
        ducks.push({ x: dw[0] * T + 8, y: dw[1] * T + 10, tx: dw[0] * T + 8, ty: dw[1] * T + 10, dir: 1, wait: rnd() * 3, baby: i === 0 ? 2 : 0, trail: [] });
      }
      for (i = 0; i < 22 && openGrass.length; i++) {
        var fg = pickOf(openGrass);
        bugs.push({ x: fg[0] * T + rnd() * 16, y: fg[1] * T + rnd() * 16, a: rnd() * 6.28, ph: rnd() * 6.28, sp: 6 + rnd() * 8 });
      }
      if (!map._baseLights) map._baseLights = (map.lights || []).slice();
      var baseLights = map._baseLights;
      var rippleT = 0, petalT = 0;

      function isWaterPx(x, y) { return tile(Math.floor(x / T), Math.floor(y / T)) === 'water'; }
      function near(x, y, P, r) { return P && Math.abs(x - P.x) < r && Math.abs(y - P.y) < r; }

      return {
        update: function (dt, env) {
          var P = H.ambientPlayer || { x: -999, y: -999 };
          var t = env.t || 0, wind = env.wind || 0.2, hr = env.time != null ? env.time : 12;
          var night = hr >= 19 || hr < 5.5, wet = env.weather === 'rain' || env.weather === 'snow';
          // butterflies
          flies.forEach(function (f) {
            f.ph += dt;
            if (f.ph > f.tgt) { f.tgt = f.ph + 1 + rnd() * 2; f.vx = (rnd() - 0.5) * 30 + wind * 8; f.vy = (rnd() - 0.5) * 20; }
            f.vx += (f.hx - f.x) * dt * 0.6; f.vy += (f.hy - 6 - f.y) * dt * 0.6;
            if (near(f.x, f.y, P, 18)) { f.vx += (f.x - P.x) * dt * 6; f.vy -= 20 * dt; }
            f.x += f.vx * dt; f.y += (f.vy + Math.sin(f.ph * 9) * 14) * dt;
          });
          // birds
          birds.forEach(function (b) {
            b.timer -= dt;
            if (b.st === 0) { // grounded
              if (near(b.x, b.y, P, 34)) {
                b.st = 1; var tg = pickOf(openGrass);
                for (var k = 0; k < 6 && Math.abs(tg[0] * T - P.x) + Math.abs(tg[1] * T - P.y) < 140; k++) tg = pickOf(openGrass);
                b.tx = tg[0] * T + 8; b.ty = tg[1] * T + 12; b.dir = b.tx > b.x ? 1 : -1;
              } else if (b.timer <= 0) {
                b.timer = 0.4 + rnd() * 1.6;
                var r = rnd();
                if (r < 0.45) { var nx = b.x + (rnd() - 0.5) * 12, ny = b.y + (rnd() - 0.5) * 6; if (tile(Math.floor(nx / T), Math.floor(ny / T)) !== 'water') { b.dir = nx > b.x ? 1 : -1; b.x = nx; b.y = ny; b.hop = 0.15; } }
                b.frame = r > 0.6 ? 1 : 0;
              }
              if (b.hop) { b.hop = Math.max(0, b.hop - dt); b.z = Math.sin(b.hop / 0.15 * Math.PI) * 2; }
            } else { // flying
              var dx = b.tx - b.x, dy = b.ty - b.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
              var spd = 70;
              b.x += dx / d * spd * dt; b.y += dy / d * spd * dt;
              b.z = Math.min(26, d * 0.25 + 4) * (d > 6 ? 1 : d / 6);
              b.frame = 2 + (Math.floor(t * 14) & 1);
              if (d < 3) { b.st = 0; b.z = 0; b.frame = 0; b.timer = 1; }
            }
          });
          // ducks
          ducks.forEach(function (dk) {
            var dx = dk.tx - dk.x, dy = dk.ty - dk.y, d = Math.sqrt(dx * dx + dy * dy);
            if (d < 1.5) {
              dk.wait -= dt;
              if (dk.wait <= 0) {
                var a = rnd() * 6.28, r = 16 + rnd() * 40;
                var nx = dk.x + Math.cos(a) * r, ny = dk.y + Math.sin(a) * r * 0.6;
                var ok = true;
                for (var s = 1; s <= 4; s++) if (!isWaterPx(dk.x + (nx - dk.x) * s / 4, dk.y + (ny - dk.y) * s / 4) || !isWaterPx(dk.x + (nx - dk.x) * s / 4 + 6, dk.y + (ny - dk.y) * s / 4)) ok = false;
                if (!isWaterPx(nx - 6, ny)) ok = false;
                if (ok) { dk.tx = nx; dk.ty = ny; } dk.wait = 1 + rnd() * 3;
              }
            } else {
              var sp2 = 9;
              dk.x += dx / d * sp2 * dt; dk.y += dy / d * sp2 * dt; dk.dir = dx >= 0 ? 1 : -1;
              dk.trail.push([dk.x, dk.y]); if (dk.trail.length > 40) dk.trail.shift();
              if (rnd() < dt * 2) ripples.push({ x: dk.x - dk.dir * 5, y: dk.y + 3, r: 1, life: 1, max: 1 });
            }
          });
          // fish ripples
          rippleT -= dt;
          if (rippleT <= 0 && deepW.length) {
            rippleT = 0.8 + rnd() * 1.6;
            var w = pickOf(deepW);
            if (near(w[0] * T, w[1] * T, P, 260)) ripples.push({ x: w[0] * T + 4 + rnd() * 8, y: w[1] * T + 4 + rnd() * 8, r: 1, life: 1.6, max: 1.6, fish: rnd() < 0.3 });
          }
          for (var q = ripples.length - 1; q >= 0; q--) { var rp = ripples[q]; rp.life -= dt; rp.r += dt * 6; if (rp.life <= 0) ripples.splice(q, 1); }
          if (ripples.length > 30) ripples.splice(0, ripples.length - 30);
          // petals near cherries
          petalT -= dt;
          if (petalT <= 0 && cherries.length && !wet) {
            petalT = 0.12 / (0.5 + wind);
            var c = pickOf(cherries);
            if (near(c[0] * T, c[1] * T, P, 240) && petals.length < 60)
              petals.push({ x: c[0] * T + 8 + (rnd() - 0.5) * 36, y: c[1] * T - 34 + rnd() * 20, gy: c[1] * T + 14 + rnd() * 30, life: 6, ph: rnd() * 6, c: rnd() < 0.5 ? '#f19cc0' : '#ffd6e6' });
          }
          for (q = petals.length - 1; q >= 0; q--) {
            var p = petals[q];
            if (p.y < p.gy) { p.ph += dt * 3; p.x += (wind * 18 + Math.sin(p.ph) * 8) * dt; p.y += (10 + Math.cos(p.ph) * 4) * dt; }
            p.life -= dt; if (p.life <= 0) petals.splice(q, 1);
          }
          // fireflies
          var fl = baseLights.slice();
          bugs.forEach(function (b, k) {
            b.ph += dt; b.a += (Math.sin(b.ph * 0.7 + k) * 1.5) * dt;
            b.x += Math.cos(b.a) * b.sp * dt; b.y += Math.sin(b.a) * b.sp * dt * 0.6;
            b.glow = Math.max(0, Math.sin(b.ph * 2 + k));
            if (night && !wet && k < 12 && b.glow > 0.3 && near(b.x, b.y, P, 230)) fl.push({ x: b.x, y: b.y - 6, r: 7 + b.glow * 4, color: '#c8ff6a', flicker: false });
          });
          map.lights = fl;
          this.night = night; this.wet = wet;
        },
        draw: function (ctx, env) {
          var P = H.ambientPlayer || { x: 0, y: 0 };
          var t = env.t || 0, i, s, R = 230;
          var day = !this.night;
          // ripples
          ctx.fillStyle = '#d4f2ff';
          for (i = 0; i < ripples.length; i++) {
            var rp = ripples[i];
            ctx.globalAlpha = Math.max(0, rp.life / rp.max) * 0.7;
            var r = Math.round(rp.r), rx = r + 1, ry = Math.max(1, Math.round(r * 0.5));
            ctx.fillRect(Math.round(rp.x - rx), Math.round(rp.y), 1, 1); ctx.fillRect(Math.round(rp.x + rx), Math.round(rp.y), 1, 1);
            ctx.fillRect(Math.round(rp.x - r + 1), Math.round(rp.y - ry), r * 2 - 1, 1); ctx.fillRect(Math.round(rp.x - r + 1), Math.round(rp.y + ry), r * 2 - 1, 1);
            if (rp.fish && rp.life > rp.max - 0.3) { ctx.fillStyle = '#e8a040'; ctx.fillRect(Math.round(rp.x) - 1, Math.round(rp.y) - 2, 3, 1); ctx.fillStyle = '#d4f2ff'; }
          }
          ctx.globalAlpha = 1;
          // ducks with ducklings
          for (i = 0; i < ducks.length; i++) {
            var dk = ducks[i];
            if (!near(dk.x, dk.y, P, R)) continue;
            var fr = (Math.floor(t * 2 + i) & 1), set = dk.dir > 0 ? S.duck.r : S.duck.l;
            var bob = Math.round(Math.sin(t * 2 + i) * 0.6);
            ctx.fillStyle = 'rgba(20,40,80,0.25)'; ctx.fillRect(Math.round(dk.x) - 5, Math.round(dk.y) + 3, 11, 2);
            ctx.drawImage(set[fr], Math.round(dk.x) - 5, Math.round(dk.y) - 5 + bob);
            for (var b = 1; b <= dk.baby; b++) {
              var tp = dk.trail[Math.max(0, dk.trail.length - 1 - b * 10)];
              if (!tp) continue;
              ctx.fillStyle = '#1b1522'; ctx.fillRect(Math.round(tp[0]) - 2, Math.round(tp[1]) - 1, 5, 4);
              ctx.fillStyle = '#f2d36b'; ctx.fillRect(Math.round(tp[0]) - 1, Math.round(tp[1]), 3, 2);
              ctx.fillStyle = '#ffe890'; ctx.fillRect(Math.round(tp[0]), Math.round(tp[1]) - 1, 2, 1);
            }
          }
          // birds (shadow on ground, body raised by z)
          for (i = 0; i < birds.length; i++) {
            var bd = birds[i];
            if (!near(bd.x, bd.y, P, R)) continue;
            if (bd.st === 0 && this.wet) continue;
            ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(Math.round(bd.x) - 3, Math.round(bd.y), 6, 1);
            var bs = (bd.dir > 0 ? S.bird.r : S.bird.l)[bd.frame | 0];
            ctx.drawImage(bs, Math.round(bd.x) - 4, Math.round(bd.y - 7 - (bd.z || 0)));
          }
          // butterflies (day, dry)
          if (day && !this.wet) for (i = 0; i < flies.length; i++) {
            var f = flies[i];
            if (!near(f.x, f.y, P, R)) continue;
            s = S.fly[f.c][(Math.floor(t * 8 + i) & 1)];
            ctx.drawImage(s, Math.round(f.x) - 3, Math.round(f.y) - 8);
          }
          // petals
          for (i = 0; i < petals.length; i++) {
            var p = petals[i];
            ctx.globalAlpha = Math.min(1, p.life);
            ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), (Math.floor(p.ph) & 1) ? 2 : 1, 1);
          }
          ctx.globalAlpha = 1;
          // fireflies
          if (this.night && !this.wet) for (i = 0; i < bugs.length; i++) {
            var bg = bugs[i];
            if (bg.glow < 0.15 || !near(bg.x, bg.y, P, R)) continue;
            ctx.globalAlpha = bg.glow * 0.35; ctx.fillStyle = '#c8ff6a';
            ctx.fillRect(Math.round(bg.x) - 1, Math.round(bg.y) - 7, 3, 3);
            ctx.globalAlpha = bg.glow; ctx.fillStyle = '#f4ffb0';
            ctx.fillRect(Math.round(bg.x), Math.round(bg.y) - 6, 1, 1);
          }
          ctx.globalAlpha = 1;
        }
      };
    }
  };
})();
