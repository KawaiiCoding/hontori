window.H = window.H || {};
(function () {
  'use strict';
  var OUT = '#1b1522';
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function bay(x, y) { return (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16; }
  function hash(x, y) {
    var h = (x * 374761393 + y * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  // ---- pixel grid helpers ----
  function G(w, h) { var d = new Array(w * h); for (var i = 0; i < d.length; i++) d[i] = null; return { w: w, h: h, d: d }; }
  function sp(g, x, y, c) { x = x | 0; y = y | 0; if (x < 0 || y < 0 || x >= g.w || y >= g.h) return; g.d[y * g.w + x] = c; }
  function gp(g, x, y) { if (x < 0 || y < 0 || x >= g.w || y >= g.h) return null; return g.d[y * g.w + x]; }
  function rect(g, x, y, w, h, c) { for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) sp(g, x + i, y + j, c); }
  function pick(r, v, x, y) {
    var i = Math.floor(v * r.length + bay(x, y) - 0.5);
    return r[i < 0 ? 0 : i >= r.length ? r.length - 1 : i];
  }
  // shaded ellipsoid, light from top-left-front
  function ball(g, cx, cy, rx, ry, ramp, tex, bias) {
    bias = bias || 0;
    for (var y = -ry; y <= ry; y++) for (var x = -rx; x <= rx; x++) {
      var nx = x / (rx + 0.5), ny = y / (ry + 0.5), q = nx * nx + ny * ny;
      if (q > 1) continue;
      var nz = Math.sqrt(1 - q);
      var l = -0.5 * nx - 0.62 * ny + 0.6 * nz;
      var v = (l + 0.55) / 1.45 + bias;
      var X = cx + x, Y = cy + y;
      if (tex) v += (hash(X >> 1, Y >> 1) - 0.5) * tex + (hash(X, Y) - 0.5) * tex * 0.5;
      sp(g, X, Y, pick(ramp, clamp(v, 0, 0.999), X, Y));
    }
  }
  // vertical cylinder shading by column
  function cyl(g, x, y, w, h, ramp, bias) {
    for (var i = 0; i < w; i++) {
      var nx = (i + 0.5) / w * 2 - 1;
      var v = clamp(0.62 - nx * 0.45 - Math.abs(nx) * Math.abs(nx) * 0.35 + (bias || 0), 0, 0.999);
      for (var j = 0; j < h; j++) sp(g, x + i, y + j, pick(ramp, v, x + i, y + j));
    }
  }
  // soft coloured outline: every edge pixel takes a deep shade of the colour it touches (no black line).
  // An explicit colour (c) still wins, for the few pieces that want a fixed edge.
  var DK = {};
  function deep(col) {
    if (DK[col]) return DK[col];
    var m = /^#([0-9a-f]{6})$/i.exec(col || ''), out = OUT;
    if (m) { var n = parseInt(m[1], 16), r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255;
      out = '#' + [r * 0.38, gg * 0.42, b * 0.46].map(function (v) { v = Math.round(v); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
    return (DK[col] = out);
  }
  function outline(g, c) {
    var add = [];
    for (var y = 0; y < g.h; y++) for (var x = 0; x < g.w; x++) {
      if (gp(g, x, y)) continue;
      var nb = gp(g, x - 1, y) || gp(g, x + 1, y) || gp(g, x, y - 1) || gp(g, x, y + 1);
      if (nb) add.push(x, y, nb);
    }
    for (var i = 0; i < add.length; i += 3) sp(g, add[i], add[i + 1], c || deep(add[i + 2]));
  }
  function toCanvas(g) {
    var c = document.createElement('canvas'); c.width = g.w; c.height = g.h;
    var x = c.getContext('2d');
    for (var j = 0; j < g.h; j++) for (var i = 0; i < g.w; i++) {
      var col = g.d[j * g.w + i]; if (!col) continue;
      x.fillStyle = col; x.fillRect(i, j, 1, 1);
    }
    return c;
  }
  function copy(src, dst, ox, oy) {
    for (var j = 0; j < src.h; j++) for (var i = 0; i < src.w; i++) {
      var c = src.d[j * src.w + i]; if (c) sp(dst, i + ox, j + oy, c);
    }
  }

  // ---- palettes ----
  var LEAF = ['#16301f', '#22482a', '#2f6633', '#45863b', '#64a847', '#8fcb58', '#c3e87a'];
  var PINE = ['#0f2723', '#173a30', '#21523d', '#2f6c48', '#468a55', '#6daa66'];
  var BUSH = ['#18361f', '#265127', '#387131', '#53923e', '#7cb64e', '#b0dc6e'];
  var WOOD = ['#2e1c14', '#4a2e1c', '#6a4426', '#8e5f33', '#b37f45', '#d6a466'];
  var BARK = ['#24170f', '#3c2717', '#5a3b22', '#7a5230', '#9a6c40'];
  var STONE = ['#2a2b3a', '#424659', '#5f6579', '#82889d', '#a9afc0', '#d2d6e0'];
  var IRON = ['#15161e', '#262a3a', '#3b4058', '#59607e', '#868fb0'];
  var RED = ['#3c1218', '#64202a', '#8f3036', '#bd4a44', '#e07a5e'];
  var ROOF = ['#3a1a1e', '#5c2629', '#843a34', '#ab5640', '#cf7c55'];
  var SOIL = ['#2a1a14', '#3d281c', '#553826'];

  /* ---------------- SPRITE SHEETS (H.sheets, group 'outdoor') ----------------
     Every picture this module caches can also come from a shipped sheet. Key scheme, module 'props':
       props:<type>             one picture per static prop: fence_h fence_v mailbox rock sign well flowerbed
                                bench barrel crate (cache key = type)
       props:lamp_d, lamp_n     the lamp with daylit glass / glowing glass (night, or from 18:00)
       <set key>:b<b>p<p>       wind frames of a plant (tree, pine, bush here as props:tree:b..p..; plants of
                                other modules pass their own set key, for example oplus:fruit_tree). One frame
                                per bend b in W_BMIN..W_BMAX (-4..10, device pixels) and flutter phase p in
                                0..W_PH-1 (0..5): 15 x 6 = 90 frames per plant. Frames are device resolution
                                (2x) and drawn at half size.
     Chosen at draw time, never baked: which wind frame (from wind, weather, time and the plant's position, so
     two trees sway out of phase), and day or night lamp. Each frame itself is a pure function of its key.
     Keys and paint functions are built once (no strings or closures per draw). The painters stay the source
     and the fallback: with no sheets.js or no baked index everything is painted exactly as before.
  */
  var cache = {};
  var SKEY = {}, PAINT = {}, BUILD = {};
  /* draw anchors of the static pictures, so a baked picture can be placed without painting it first;
     checked against the painter whenever a picture is painted */
  var ANCHOR = {
    fence_h: { ox: 0, oy: -6 }, fence_v: { ox: 0, oy: -6 }, mailbox: { ox: 0, oy: -6 }, rock: { ox: -1, oy: 0 },
    sign: { ox: 0, oy: -6 }, well: { ox: -1, oy: -18 }, flowerbed: { ox: 0, oy: -4 }, bench: { ox: 0, oy: -6 },
    barrel: { ox: 0, oy: -4 }, crate: { ox: 0, oy: -4 }, lamp_d: { ox: 0, oy: -30 }, lamp_n: { ox: 0, oy: -30 }
  };
  function made(key, s) {
    if (!s || !s.c) return;
    var a = ANCHOR[key];
    if (a && (a.ox !== s.ox || a.oy !== s.oy)) {
      a.ox = s.ox; a.oy = s.oy;
      try { console.warn('propsOutdoor: anchor of ' + key + ' changed; update ANCHOR'); } catch (e) { /* no console */ }
    }
    if (H.sheets && H.sheets.recording && SKEY[key]) H.sheets.rec('outdoor', SKEY[key], s.c);
  }
  function sprite(key, fn) {
    var s = cache[key];
    if (s) return s;
    s = cache[key] = fn();
    made(key, s);
    return s;
  }
  function mk(g, ox, oy, noOutline) { if (!noOutline) outline(g); return { c: toCanvas(g), ox: ox, oy: oy }; }

  // ---------------- WIND (trees and bushes) ----------------
  // Art is authored at 1x but shown on a 2x canvas, so wind frames are built at device resolution:
  // every art pixel is a 2x2 block and the bend moves rows in half-pixel steps. A frame is one
  // (bend level, flutter phase) pair, built once on first use and cached; drawing only picks and blits.
  //   bend    : the whole plant leans from the root up, growing with height (the base never moves)
  //   flutter : a small travelling ripple, strong at the canopy rim and zero in its core
  //   shimmer : a few highlight pixels dim for a moment as the ripple passes
  var WK = 2, W_PL = 3, W_PR = 6, W_PT = 1, W_PH = 6, W_BMIN = -4, W_BMAX = 10;
  var colMemo = {};
  function col32(c) {
    var v = colMemo[c];
    if (v == null) {
      var n = parseInt(c.slice(1), 16);
      v = colMemo[c] = (0xff000000 | ((n & 255) << 16) | (n & 0xff00) | ((n >> 16) & 255)) >>> 0;
    }
    return v;
  }
  function toU32(g) {
    var a = new Uint32Array(g.w * g.h);
    for (var i = 0; i < a.length; i++) if (g.d[i]) a[i] = col32(g.d[i]);
    return { w: g.w, h: g.h, d: a };
  }
  // distance (in art pixels) from each canopy pixel to the nearest empty one
  function edgeDist(g) {
    var w = g.w, h = g.h, d = new Uint8Array(w * h), x, y, i, v;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      i = y * w + x;
      if (!g.d[i]) { d[i] = 0; continue; }
      v = 60;
      v = Math.min(v, (x > 0 ? d[i - 1] : 0) + 1, (y > 0 ? d[i - w] : 0) + 1);
      d[i] = v;
    }
    for (y = h - 1; y >= 0; y--) for (x = w - 1; x >= 0; x--) {
      i = y * w + x;
      if (!d[i]) continue;
      d[i] = Math.min(d[i], (x < w - 1 ? d[i + 1] : 0) + 1, (y < h - 1 ? d[i + w] : 0) + 1);
    }
    return d;
  }
  // o: { w, h, ox, oy, base (grid or null), can (grid), canX, canY, rootY, topY, pow, shim [[from, to], ...], out }
  function windSet(o) {
    var s = {
      w: o.w, h: o.h, ox: o.ox, oy: o.oy, base: o.base ? toU32(o.base) : null, can: toU32(o.can),
      canX: o.canX || 0, canY: o.canY || 0, rootY: o.rootY, topY: o.topY || 0, pow: o.pow || 1.5,
      out: col32(o.out || OUT), shim: {}, hasShim: false, frames: {}
    };
    s.dist = edgeDist(s.can);
    (o.shim || []).forEach(function (q) { s.shim[col32(q[0])] = col32(q[1]); s.hasShim = true; });
    /* optional o.key: sheet keys for every frame, index (b - W_BMIN) * W_PH + p, built once */
    if (typeof o.key === 'string') {
      s.key = o.key; s.keys = [];
      for (var b = W_BMIN; b <= W_BMAX; b++) for (var p = 0; p < W_PH; p++) s.keys[(b - W_BMIN) * W_PH + p] = o.key + ':b' + b + 'p' + p;
      SETS.push(s);
    }
    return s;
  }
  var SETS = [];
  function windGet(s, k, b, p) {
    var c = s.frames[k];
    if (!c) {
      c = s.frames[k] = windFrame(s, b, p);
      if (s.keys && H.sheets && H.sheets.recording) H.sheets.rec('outdoor', s.keys[k], c);
    }
    return c;
  }
  /* the one paint function of the routed path: the frame being drawn is passed in these variables */
  var wS = null, wK = 0, wB = 0, wP = 0;
  function windPaint() { return wS ? windGet(wS, wK, wB, wP) : null; }
  /* every frame of a set (the build tool's enumerator) */
  function windAll(s) {
    if (!s || !s.frames) return 0;
    var n = 0;
    for (var b = W_BMIN; b <= W_BMAX; b++) for (var p = 0; p < W_PH; p++) { windGet(s, (b - W_BMIN) * W_PH + p, b, p); n++; }
    return n;
  }
  function windFrame(s, b, p) {
    var W = (s.w + W_PL + W_PR) * WK, Hh = (s.h + W_PT) * WK;
    var c = document.createElement('canvas'); c.width = W; c.height = Hh;
    var x2 = c.getContext('2d'), id = x2.createImageData(W, Hh), o = new Uint32Array(id.data.buffer);
    var can = s.can, base = s.base, cw = can.w, ch = can.h, dist = s.dist;
    var span = s.rootY - s.topY, ang = p / W_PH * Math.PI * 2, A = 0.9 + Math.abs(b) * 0.16;
    var X, Y, i;
    for (Y = 0; Y < Hh; Y++) {
      var ya = Y / WK - W_PT;
      var u = (s.rootY - ya) / span; u = u < 0 ? 0 : u > 1 ? 1 : u;
      var bend = b * Math.pow(u, s.pow), rb = Math.round(bend), lift = 0.35 + 0.65 * u;
      var cyl_ = (Y >> 1) - W_PT - s.canY;
      for (X = 0; X < W; X++) {
        var col = 0;
        // rim factor, read where this pixel would sit without flutter
        var ex = ((X - rb) >> 1) - W_PL - s.canX, e = 1;
        if (ex >= 0 && ex < cw && cyl_ >= 0 && cyl_ < ch) {
          var dd = dist[cyl_ * cw + ex];
          e = dd <= 1 ? 1 : dd >= 7 ? 0 : 1 - (dd - 1) / 6;
        }
        var xa = X / WK;
        var fx = A * e * lift * Math.sin(ang + ya * 0.55 + xa * 0.31);
        var fy = Math.round(A * 0.55 * e * lift * Math.sin(ang + xa * 0.42 - ya * 0.2 + 1.3));
        var sx = ((X - Math.round(bend + fx)) >> 1) - W_PL - s.canX, sy = ((Y - fy) >> 1) - W_PT - s.canY;
        if (sx >= 0 && sx < cw && sy >= 0 && sy < ch) {
          col = can.d[sy * cw + sx];
          if (col && s.hasShim && s.shim[col] && hash(sx + 101, sy + 57) < 0.24 &&
              ((Math.floor(hash(sx + 7, sy + 211) * W_PH) + p) % W_PH) < 2) col = s.shim[col];
        }
        if (!col && base) {
          var bx = ((X - rb) >> 1) - W_PL, by = (Y >> 1) - W_PT;
          if (bx >= 0 && bx < base.w && by >= 0 && by < base.h) col = base.d[by * base.w + bx];
        }
        if (col) o[Y * W + X] = col;
      }
    }
    // outline: one art pixel (two device pixels) on the four sides, as the 1x outline was
    // soft coloured outline: each edge pixel is a deep shade of the leaf or bark next to it (no black line)
    var add = [], src = [];
    for (Y = 0; Y < Hh; Y++) for (X = 0; X < W; X++) {
      i = Y * W + X;
      if (o[i]) continue;
      var nb = (X > 0 && o[i - 1]) || (X < W - 1 && o[i + 1]) || (Y > 0 && o[i - W]) || (Y < Hh - 1 && o[i + W]) ||
          (X > 1 && o[i - 2]) || (X < W - 2 && o[i + 2]) || (Y > 1 && o[i - 2 * W]) || (Y < Hh - 2 && o[i + 2 * W]);
      if (nb) { add.push(i); src.push(nb); }
    }
    for (i = 0; i < add.length; i++) {
      var v = src[i], r = v & 255, gg = (v >>> 8) & 255, b = (v >>> 16) & 255;
      o[add[i]] = (0xff << 24 | ((b * 0.42) & 255) << 16 | ((gg * 0.42) & 255) << 8 | ((r * 0.38) & 255)) >>> 0;
    }
    x2.putImageData(id, 0, 0);
    return c;
  }
  // per frame: pick a cached frame from wind, time and a per-plant phase, then one drawImage
  function windDraw(ctx, s, px, py, env, amp) {
    var t = env && env.t || 0, w = env && env.wind != null ? env.wind : 0.2;
    if (env && env.weather === 'wind') w = Math.max(w, 0.6);
    w = w < 0 ? 0 : w > 1 ? 1 : w;
    var h1 = hash(px | 0, py | 0), h2 = hash((py | 0) + 91, (px | 0) + 17);
    // a gust front crosses the map from the left (the grass uses the same front), trees follow a beat later
    var gust = Math.sin(t * 0.9 - px * 0.02625 - py * 0.01 - 0.6) * 0.5 + 0.5; gust *= gust;
    var lean = w * (1.5 + 9 * gust) +
               Math.sin(t * (0.6 + w * 0.7) + h1 * 6.283) * (0.9 + w * 2.0) +
               Math.sin(t * (1.3 + w * 0.9) + h2 * 6.283) * (0.3 + w * 0.7);   /* calm, slow sways; wind makes them bigger, not frantic */
    var b = Math.round(lean * amp); b = b < W_BMIN ? W_BMIN : b > W_BMAX ? W_BMAX : b;
    var p = Math.floor(t * (1.4 + w * 3) + h2 * W_PH) % W_PH; if (p < 0) p += W_PH;
    var k = (b - W_BMIN) * W_PH + p;
    var dx = Math.round(px + s.ox) - W_PL, dy = Math.round(py + s.oy) - W_PT;
    if (s.keys && H.sheets) {
      wS = s; wK = k; wB = b; wP = p;
      H.sheets.draw(ctx, s.keys[k], dx, dy, windPaint, s.w + W_PL + W_PR, s.h + W_PT);
      return;
    }
    var c = windGet(s, k, b, p);
    ctx.drawImage(c, dx, dy, c.width / WK, c.height / WK);
  }
  H._treeWind = { set: windSet, draw: windDraw, all: windAll };

  // ---------------- TREE ----------------
  function treeCanopy() {
    var g = G(48, 46);
    var blobs = [[24, 30, 15, 9], [12, 27, 9, 8], [36, 27, 9, 8], [24, 19, 15, 12], [16, 12, 9, 8], [32, 12, 9, 8], [24, 8, 9, 7]];
    for (var i = 0; i < blobs.length; i++) {
      var b = blobs[i];
      ball(g, b[0], b[1], b[2], b[3], LEAF, 0.32, (i >= 3 ? 0.04 : -0.06));
    }
    // leaf cluster crescents: bright tops on sub clusters
    for (var k = 0; k < 26; k++) {
      var cx = 8 + Math.floor(hash(k, 3) * 32), cy = 4 + Math.floor(hash(k, 7) * 30);
      if (!gp(g, cx, cy) || !gp(g, cx, cy + 3)) continue;
      for (var dx = -2; dx <= 2; dx++) {
        var yy = cy + (Math.abs(dx) === 2 ? 1 : 0);
        if (gp(g, cx + dx, yy)) sp(g, cx + dx, yy, cy < 18 ? LEAF[6] : LEAF[5]);
        if (gp(g, cx + dx, yy + 2)) sp(g, cx + dx, yy + 2, LEAF[2]);
      }
    }
    // small fruit/blossom accents
    for (var f = 0; f < 6; f++) {
      var fx = 10 + Math.floor(hash(f, 11) * 28), fy = 10 + Math.floor(hash(f, 13) * 22);
      if (gp(g, fx, fy) && gp(g, fx + 1, fy + 1)) { sp(g, fx, fy, '#f2d36b'); sp(g, fx + 1, fy, '#d89a3a'); }
    }
    return g;
  }
  function treeSet() {
    var g = G(56, 62);
    // trunk with root flare (footprint at x 20..36, y 46..62)
    cyl(g, 25, 30, 7, 28, BARK);
    cyl(g, 23, 54, 11, 4, BARK, -0.05);
    sp(g, 22, 57, BARK[1]); sp(g, 34, 57, BARK[1]);
    for (var y = 32; y < 56; y += 3) sp(g, 27 + ((y * 7) % 3), y, BARK[0]);
    rect(g, 25, 30, 7, 5, BARK[0]);
    return windSet({ key: 'props:tree', w: 56, h: 62, ox: -20, oy: -46, base: g, can: treeCanopy(), canX: 4, canY: 0, rootY: 54, topY: 0, pow: 1.5,
      shim: [[LEAF[6], LEAF[5]], [LEAF[5], LEAF[4]]] });
  }

  // ---------------- PINE ----------------
  function pineSet() {
    var base = G(32, 54), g = G(32, 54);
    cyl(base, 13, 40, 6, 12, BARK);
    rect(base, 13, 40, 6, 3, BARK[0]);
    for (var k = 3; k >= 0; k--) {
      var top = 2 + k * 9, hgt = 15, hw = 5 + k * 2.6;
      for (var r = 0; r < hgt; r++) {
        var Y = top + r;
        var w = hw * (r + 2) / (hgt + 1);
        var jag = (r >= hgt - 3) ? Math.floor(hash(k, r) * 2) : 0;
        for (var dx = -Math.ceil(w); dx <= Math.ceil(w); dx++) {
          if (Math.abs(dx) > w) continue;
          if (r === hgt - 1 && ((dx + k) & 3) === 0) continue; // saw-tooth bottom
          var nx = dx / (w + 0.5);
          var v = 0.62 - nx * 0.42 - (r / hgt) * 0.38 + (3 - k) * 0.03 + (hash(dx + 40, Y) - 0.5) * 0.18 - jag * 0.05;
          var X = 16 + dx;
          sp(g, X, Y, pick(PINE, clamp(v, 0, 0.999), X, Y));
        }
        // needle highlights
        if (r % 4 === 1) sp(g, 16 - Math.floor(w * 0.5), Y, PINE[5]);
      }
    }
    return windSet({ key: 'props:pine', w: 32, h: 54, ox: -8, oy: -38, base: base, can: g, rootY: 50, topY: 2, pow: 1.6, shim: [[PINE[5], PINE[4]]] });
  }

  // ---------------- BUSH ----------------
  function bushSet() {
    var g = G(22, 20);
    ball(g, 7, 12, 6, 5, BUSH, 0.3, -0.05);
    ball(g, 15, 12, 6, 5, BUSH, 0.3, -0.05);
    ball(g, 11, 9, 7, 6, BUSH, 0.3, 0.05);
    ball(g, 11, 15, 8, 3, BUSH, 0.2, -0.12);
    var berries = [[8, 9], [14, 7], [16, 13], [6, 14], [11, 12]];
    for (var b = 0; b < berries.length; b++) {
      var bx = berries[b][0], by = berries[b][1];
      sp(g, bx, by, RED[3]); sp(g, bx + 1, by, RED[2]); sp(g, bx, by + 1, RED[1]); sp(g, bx + 1, by + 1, RED[1]);
      sp(g, bx, by, '#f4a28a');
    }
    return windSet({ key: 'props:bush', w: 22, h: 20, ox: -3, oy: -4, base: null, can: g, rootY: 18, topY: 3, pow: 1.3, shim: [[BUSH[5], BUSH[4]]] });
  }

  // ---------------- FENCES ----------------
  function plankH(g, x, y, w, h) {
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) {
      var v = j === 0 ? 0.85 : j === h - 1 ? 0.25 : 0.6;
      v += (hash(x + i >> 2, y + j) - 0.5) * 0.15;
      sp(g, x + i, y + j, pick(WOOD, clamp(v, 0, 0.999), x + i, y + j));
    }
    for (var k = 3; k < w; k += 7) sp(g, x + k, y + 1, WOOD[1]);
  }
  function post(g, x, y, h) {
    cyl(g, x, y + 2, 4, h - 2, WOOD);
    rect(g, x, y, 4, 2, WOOD[5]); sp(g, x, y, WOOD[4]); sp(g, x + 3, y + 1, WOOD[3]);
  }
  function fenceH() {
    var g = G(16, 22);
    plankH(g, 0, 7, 16, 3);
    plankH(g, 0, 13, 16, 3);
    post(g, 6, 3, 18);
    // outline rails only top/bottom (manual) to keep tiles seamless
    for (var x = 0; x < 16; x++) {
      if (!gp(g, x, 6)) sp(g, x, 6, OUT); if (!gp(g, x, 10)) sp(g, x, 10, OUT);
      if (!gp(g, x, 12)) sp(g, x, 12, OUT); if (!gp(g, x, 16)) sp(g, x, 16, OUT);
    }
    for (var y = 2; y < 22; y++) { if (!gp(g, 5, y)) sp(g, 5, y, OUT); if (!gp(g, 10, y)) sp(g, 10, y, OUT); }
    rect(g, 6, 2, 4, 1, OUT); rect(g, 5, 21, 6, 1, OUT);
    return mk(g, 0, -6, true);
  }
  function fenceV() {
    var g = G(16, 22);
    // vertical rail running the full height
    for (var y = 0; y < 22; y++) {
      sp(g, 7, y, WOOD[4]); sp(g, 8, y, WOOD[2]);
      sp(g, 6, y, OUT); sp(g, 9, y, OUT);
    }
    for (var k = 2; k < 22; k += 6) sp(g, 7, k, WOOD[3]);
    post(g, 6, 5, 15);
    for (var y2 = 5; y2 < 21; y2++) { if (gp(g, 5, y2) !== WOOD[0]) sp(g, 5, y2, OUT); sp(g, 10, y2, OUT); }
    rect(g, 6, 4, 4, 1, OUT); rect(g, 5, 20, 6, 1, OUT);
    return mk(g, 0, -6, true);
  }

  // ---------------- LAMP ----------------
  function lamp(night) {
    var g = G(16, 46);
    // stone base
    cyl(g, 4, 40, 8, 5, STONE); rect(g, 4, 40, 8, 1, STONE[5]);
    cyl(g, 5, 37, 6, 3, IRON);
    // pole
    cyl(g, 7, 14, 2, 23, IRON);
    sp(g, 6, 24, IRON[3]); sp(g, 9, 24, IRON[1]); sp(g, 6, 25, IRON[2]); sp(g, 9, 25, IRON[1]);
    // arm/collar
    rect(g, 5, 13, 6, 2, IRON[2]); rect(g, 5, 13, 6, 1, IRON[4]);
    // lantern: roof
    for (var r = 0; r < 4; r++) for (var x = 8 - 1 - r * 2; x <= 8 + r * 2; x++) sp(g, x, r, r === 0 ? IRON[4] : (x < 8 ? IRON[3] : IRON[1]));
    rect(g, 1, 4, 14, 1, IRON[2]);
    sp(g, 7, 0, IRON[4]);
    // glass box
    var gl = night ? ['#ffb84a', '#ffd77a', '#fff0b8', '#fffbe8'] : ['#5a7488', '#86a6b8', '#b9d2de', '#e4f0f4'];
    for (var y = 5; y < 12; y++) for (var x2 = 3; x2 < 13; x2++) {
      var v;
      if (night) { var dx = x2 - 7.5, dy = y - 8; v = 1 - Math.sqrt(dx * dx + dy * dy) / 5; }
      else v = 0.75 - (x2 - 3) / 10 * 0.6 - (y - 5) / 7 * 0.2;
      sp(g, x2, y, pick(gl, clamp(v, 0, 0.999), x2, y));
    }
    if (!night) { sp(g, 4, 6, gl[3]); sp(g, 4, 7, gl[3]); sp(g, 5, 6, gl[3]); }
    // frame bars
    for (var y3 = 5; y3 < 12; y3++) { sp(g, 2, y3, IRON[2]); sp(g, 13, y3, IRON[1]); sp(g, 7, y3, IRON[1]); sp(g, 8, y3, IRON[1]); }
    rect(g, 2, 12, 12, 1, IRON[2]);
    for (var x3 = 4; x3 < 12; x3++) sp(g, x3, 13, x3 < 8 ? IRON[3] : IRON[1]);
    return mk(g, 0, -30);
  }

  // ---------------- small props ----------------
  function mailbox() {
    var g = G(16, 22);
    cyl(g, 7, 11, 3, 10, WOOD);
    // box body (rounded top)
    for (var y = 2; y < 11; y++) for (var x = 2; x < 13; x++) {
      if (y === 2 && (x < 4 || x > 10)) continue;
      if (y === 3 && (x < 3 || x > 11)) continue;
      var v = 0.7 - (y - 2) / 9 * 0.5 + (x < 4 ? 0.1 : 0) - (x > 11 ? 0.15 : 0);
      sp(g, x, y, pick(['#1e3a5e', '#2c5486', '#3f72ab', '#6496cf', '#a2c4ea'], clamp(v, 0, 0.999), x, y));
    }
    rect(g, 3, 9, 9, 2, '#1e3a5e');
    // slot + door
    rect(g, 4, 6, 6, 1, '#14243c');
    // flag
    rect(g, 12, 2, 1, 6, IRON[2]);
    rect(g, 13, 2, 2, 3, RED[3]); sp(g, 13, 2, RED[4]); sp(g, 14, 4, RED[1]);
    return mk(g, 0, -6);
  }
  function rock() {
    var g = G(18, 16);
    ball(g, 9, 9, 7, 5, STONE, 0.22);
    ball(g, 5, 11, 4, 3, STONE, 0.2, -0.05);
    ball(g, 13, 11, 3, 3, STONE, 0.2, -0.1);
    // cracks
    sp(g, 9, 8, STONE[1]); sp(g, 10, 9, STONE[1]); sp(g, 10, 10, STONE[1]);
    // moss on top
    for (var x = 5; x < 12; x++) {
      for (var y = 0; y < 16; y++) if (gp(g, x, y)) {
        if (hash(x, 9) > 0.35) { sp(g, x, y, x < 8 ? BUSH[4] : BUSH[3]); if (hash(x, 4) > 0.6) sp(g, x, y + 1, BUSH[2]); }
        break;
      }
    }
    return mk(g, -1, 0);
  }
  function sign() {
    var g = G(16, 22);
    cyl(g, 3, 10, 2, 11, WOOD); cyl(g, 11, 10, 2, 11, WOOD);
    for (var y = 2; y < 12; y++) for (var x = 1; x < 15; x++) {
      var v = y === 2 ? 0.95 : y === 11 ? 0.2 : 0.62 - (x / 14) * 0.15;
      v += (hash(x >> 2, y) - 0.5) * 0.12;
      sp(g, x, y, pick(WOOD, clamp(v, 0, 0.999), x, y));
    }
    rect(g, 1, 6, 14, 1, WOOD[2]);
    // carved text squiggles
    var lines = [[3, 4, 9], [3, 8, 7], [10, 8, 2]];
    for (var i = 0; i < lines.length; i++) for (var k = 0; k < lines[i][2]; k++) if (hash(k, i) > 0.2) sp(g, lines[i][0] + k, lines[i][1], WOOD[0]);
    sp(g, 2, 3, '#cfd2dc'); sp(g, 13, 3, '#cfd2dc'); // nails
    return mk(g, 0, -6);
  }
  function well() {
    var g = G(34, 50);
    var by = 30; // ring top centre y
    // stone cylinder body
    for (var y = by; y < 47; y++) for (var x = 3; x < 31; x++) {
      var nx = (x - 16.5) / 14;
      var row = y - by, bx = Math.floor((x + (Math.floor(row / 4) & 1) * 3) / 6), brickEdgeX = (x + (Math.floor(row / 4) & 1) * 3) % 6 === 0, brickEdgeY = row % 4 === 0;
      var v = 0.66 - nx * 0.38 - nx * nx * 0.3 + (hash(bx, row >> 2) - 0.5) * 0.2;
      var c = pick(STONE, clamp(v, 0, 0.999), x, y);
      if (brickEdgeX || brickEdgeY) c = STONE[1];
      sp(g, x, y, c);
    }
    // bottom curve
    for (var x4 = 3; x4 < 31; x4++) { var e = Math.round(2.2 * Math.sqrt(Math.max(0, 1 - Math.pow((x4 - 16.5) / 14, 2)))); for (var k = 0; k < e; k++) sp(g, x4, 47 + k, STONE[1]); }
    // top rim ellipse
    for (var y2 = -6; y2 <= 6; y2++) for (var x2 = -14; x2 <= 14; x2++) {
      var q = (x2 * x2) / (14.5 * 14.5) + (y2 * y2) / (6.5 * 6.5);
      if (q > 1) continue;
      var inner = (x2 * x2) / (10.5 * 10.5) + (y2 * y2) / (4 * 4);
      var X = 17 + x2, Y = by + y2;
      if (inner <= 1) {
        // water inside
        var wv = y2 < -1 ? 0 : 0.3 + (y2 + 1) / 6 * 0.4;
        sp(g, X, Y, pick(['#0d1424', '#14284a', '#1f3f6a', '#3a6a96'], clamp(wv, 0, 0.999), X, Y));
      } else {
        sp(g, X, Y, pick(STONE, clamp(0.8 - y2 / 7 * 0.35 + (hash(X >> 1, Y) - 0.5) * 0.2, 0, 0.999), X, Y));
      }
    }
    sp(g, 13, by + 2, '#9cd0f0'); sp(g, 14, by + 2, '#9cd0f0'); sp(g, 20, by + 3, '#6aa0cc');
    // posts
    cyl(g, 3, 8, 3, 26, WOOD); cyl(g, 28, 8, 3, 26, WOOD);
    // crank beam + rope + bucket
    rect(g, 5, 14, 24, 2, WOOD[3]); rect(g, 5, 14, 24, 1, WOOD[4]); rect(g, 5, 16, 24, 1, WOOD[1]);
    cyl(g, 14, 13, 6, 4, WOOD, 0.05);
    for (var ry = 17; ry < 25; ry++) sp(g, 17, ry, ry % 2 ? '#c9b07a' : '#9a8050');
    cyl(g, 14, 25, 6, 5, WOOD, -0.1); rect(g, 14, 25, 6, 1, IRON[3]); rect(g, 14, 28, 6, 1, IRON[2]);
    rect(g, 30, 13, 2, 1, IRON[3]); rect(g, 31, 13, 1, 4, IRON[2]);
    // roof
    for (var r = 0; r < 11; r++) {
      var half = 4 + r * 1.4, Y2 = r;
      for (var dx = -Math.floor(half); dx <= Math.floor(half); dx++) {
        var X2 = 17 + dx;
        var v2 = 0.5 + (dx < 0 ? 0.25 : -0.15) - (r / 11) * 0.15 + ((r % 3 === 2) ? -0.25 : 0);
        if (((X2 + (Math.floor(r / 3) & 1) * 2) % 4 === 0) && r % 3 !== 2) v2 -= 0.15;
        sp(g, X2, Y2, pick(ROOF, clamp(v2, 0, 0.999), X2, Y2));
      }
    }
    for (var x5 = 2; x5 < 33; x5++) sp(g, x5, 11, ROOF[0]);
    sp(g, 17, 0, ROOF[4]); sp(g, 16, 1, ROOF[4]);
    return mk(g, -1, -18);
  }
  function flowerbed() {
    var g = G(32, 20);
    // wooden border box
    for (var y = 4; y < 19; y++) for (var x = 0; x < 32; x++) {
      var edge = y < 6 || y > 15 || x < 2 || x > 29;
      if (edge) {
        var v = y < 6 ? 0.85 : y > 15 ? (y > 17 ? 0.15 : 0.45) : (x < 2 ? 0.7 : 0.35);
        sp(g, x, y, pick(WOOD, clamp(v + (hash(x >> 3, y) - 0.5) * 0.1, 0, 0.999), x, y));
      } else sp(g, x, y, pick(SOIL, clamp(0.3 + hash(x, y) * 0.6 - (y - 6) * 0.02, 0, 0.999), x, y));
    }
    for (var x6 = 8; x6 < 32; x6 += 8) rect(g, x6, 16, 1, 3, WOOD[1]);
    // flowers
    var cols = [['#e04a6a', '#ff8aa0', '#ffd0dc'], ['#e8b030', '#ffd860', '#fff2b0'], ['#6a5ad8', '#9a8cf0', '#d6d0ff'], ['#f0f0f8', '#ffffff', '#ffffff'], ['#e0702e', '#ffa050', '#ffd0a0']];
    for (var i = 0; i < 9; i++) {
      var fx = 4 + i * 3 + Math.floor(hash(i, 2) * 2), fy = 7 + Math.floor(hash(i, 5) * 6);
      var c = cols[Math.floor(hash(i, 9) * cols.length)];
      sp(g, fx, fy + 1, BUSH[2]); sp(g, fx, fy + 2, BUSH[2]); sp(g, fx - 1, fy + 2, BUSH[4]); sp(g, fx + 1, fy + 2, BUSH[3]);
      sp(g, fx, fy - 1, c[1]); sp(g, fx - 1, fy, c[1]); sp(g, fx + 1, fy, c[0]); sp(g, fx, fy + 1, c[0]);
      sp(g, fx, fy, '#ffe680'); sp(g, fx - 1, fy - 1, c[2]);
    }
    return mk(g, 0, -4);
  }
  function bench() {
    var g = G(32, 22);
    // legs
    cyl(g, 3, 14, 3, 7, IRON); cyl(g, 26, 14, 3, 7, IRON);
    cyl(g, 4, 2, 2, 10, IRON); cyl(g, 26, 2, 2, 10, IRON);
    // backrest planks
    plankH(g, 1, 3, 30, 3); plankH(g, 1, 7, 30, 3);
    // seat planks (top surface, lighter)
    for (var y = 11; y < 17; y++) for (var x = 0; x < 32; x++) {
      var v = (y === 13 ? 0.3 : y === 16 ? 0.15 : 0.82 - (y - 11) * 0.06) + (hash(x >> 3, y) - 0.5) * 0.1;
      sp(g, x, y, pick(WOOD, clamp(v, 0, 0.999), x, y));
    }
    rect(g, 3, 17, 26, 1, WOOD[1]);
    // armrests
    rect(g, 1, 10, 4, 2, IRON[3]); rect(g, 27, 10, 4, 2, IRON[2]);
    return mk(g, 0, -6);
  }
  function barrel() {
    var g = G(16, 20);
    for (var y = 3; y < 19; y++) {
      var bulge = Math.round(Math.sin((y - 3) / 15 * Math.PI) * 1.4);
      var x0 = 2 - bulge, w = 12 + bulge * 2;
      for (var i = 0; i < w; i++) {
        var nx = (i + 0.5) / w * 2 - 1;
        var v = 0.62 - nx * 0.45 - nx * nx * 0.3;
        var X = x0 + i, c = pick(WOOD, clamp(v, 0, 0.999), X, y);
        if (i % 3 === 0 && i > 0) c = WOOD[1];
        if (y === 5 || y === 6 || y === 15 || y === 16) c = pick(IRON, clamp(v, 0, 0.999), X, y);
        sp(g, X, y, c);
      }
    }
    // top lid ellipse
    for (var y2 = 0; y2 < 5; y2++) for (var x = 2; x < 14; x++) {
      var q = Math.pow((x - 7.5) / 6, 2) + Math.pow((y2 - 2) / 2.5, 2);
      if (q > 1) continue;
      var rim = q > 0.6;
      sp(g, x, y2 + 1, rim ? WOOD[2] : pick(WOOD, clamp(0.75 - (x - 2) / 12 * 0.3 + ((x % 3) === 0 ? -0.2 : 0), 0, 0.999), x, y2));
    }
    return mk(g, 0, -4);
  }
  function crate() {
    var g = G(16, 20);
    // top face
    for (var y = 1; y < 6; y++) for (var x = 1; x < 15; x++) {
      var c = (x === 1 || x === 14 || y === 1) ? WOOD[5] : (x % 4 === 0 ? WOOD[3] : WOOD[4]);
      sp(g, x, y, c);
    }
    rect(g, 1, 5, 14, 1, WOOD[2]);
    // front face
    for (var y2 = 6; y2 < 19; y2++) for (var x2 = 1; x2 < 15; x2++) {
      var frame = x2 < 3 || x2 > 12 || y2 < 8 || y2 > 16;
      var v = frame ? 0.55 - (y2 - 6) * 0.015 : 0.38 + ((y2 - 8) % 3 === 0 ? -0.2 : 0);
      if (x2 > 12) v -= 0.12;
      sp(g, x2, y2, pick(WOOD, clamp(v + (hash(x2 >> 2, y2) - 0.5) * 0.1, 0, 0.999), x2, y2));
    }
    // diagonal brace
    for (var k = 0; k < 10; k++) { var bx = 3 + k, byy = 16 - Math.round(k * 0.9); sp(g, bx, byy, WOOD[4]); sp(g, bx, byy + 1, WOOD[2]); }
    sp(g, 2, 7, '#cfd2dc'); sp(g, 13, 7, '#cfd2dc'); sp(g, 2, 17, '#9a9eb0'); sp(g, 13, 17, '#9a9eb0');
    return mk(g, 0, -4);
  }

  var builders = {
    fence_h: fenceH, fence_v: fenceV, mailbox: mailbox, rock: rock, sign: sign, well: well,
    flowerbed: flowerbed, bench: bench, barrel: barrel, crate: crate
  };

  function isNight(env) { var h = env && env.time != null ? env.time : 12; return h >= 19 || h < 6; }
  function blit(ctx, s, px, py) { ctx.drawImage(s.c, Math.round(px + s.ox), Math.round(py + s.oy)); }
  BUILD.lamp_d = function () { return lamp(false); };
  BUILD.lamp_n = function () { return lamp(true); };
  for (var bk in builders) BUILD[bk] = builders[bk];
  Object.keys(BUILD).forEach(function (k) {
    SKEY[k] = 'props:' + k;
    PAINT[k] = function () { var s = sprite(k, BUILD[k]); return s && s.c; };
  });
  /* a static picture by cache key: from the sheet when baked, else painted as before */
  function blitK(ctx, ck, px, py) {
    var s = cache[ck];
    if (H.sheets) {
      var a = s || ANCHOR[ck];
      H.sheets.draw(ctx, SKEY[ck], Math.round(px + a.ox), Math.round(py + a.oy), PAINT[ck]);
      return;
    }
    blit(ctx, s || sprite(ck, BUILD[ck]), px, py);
  }
  var WIND = { tree: treeSet, pine: pineSet, bush: bushSet };
  if (H.sheets) {
    try {
      H.sheets.enumerate('outdoor', function () {
        for (var k in BUILD) sprite(k, BUILD[k]);
        for (var w in WIND) windAll(sprite(w, WIND[w]));
      });
      /* once a sheet is in, drop painted copies that the sheet now answers */
      H.sheets.onLoad(function (group) {
        if (group !== 'outdoor') return;
        for (var k in SKEY) if (cache[k] && H.sheets.has(SKEY[k])) delete cache[k];
        for (var i = 0; i < SETS.length; i++) {
          var st = SETS[i];
          for (var f in st.frames) if (H.sheets.has(st.keys[f])) delete st.frames[f];
        }
      });
    } catch (e) { /* sheets are optional */ }
  }

  H.propsOutdoor = {
    /* still: true = the picture is a pure function of the type (never changes with time, wind, weather or
       hour), so it may be baked into a static map layer. Every other type animates or has a night picture. */
    info: {
      tree: { fw: 1, fh: 1, solid: true },
      pine: { fw: 1, fh: 1, solid: true },
      bush: { fw: 1, fh: 1, solid: true },
      fence_h: { fw: 1, fh: 1, solid: true, still: true },
      fence_v: { fw: 1, fh: 1, solid: true, still: true },
      lamp: { fw: 1, fh: 1, solid: true, light: { dx: 8, dy: -22, r: 64, color: '#ffcf7a', flicker: true } },
      mailbox: { fw: 1, fh: 1, solid: true, still: true },
      rock: { fw: 1, fh: 1, solid: true, still: true },
      sign: { fw: 1, fh: 1, solid: true, still: true },
      well: { fw: 2, fh: 2, solid: true, still: true },
      flowerbed: { fw: 2, fh: 1, solid: true, still: true },
      bench: { fw: 2, fh: 1, solid: true, still: true },
      barrel: { fw: 1, fh: 1, solid: true, still: true },
      crate: { fw: 1, fh: 1, solid: true, still: true }
    },
    draw: function (ctx, type, px, py, env) {
      env = env || {};
      if (type === 'tree') return windDraw(ctx, sprite('tree', treeSet), px, py, env, 1);
      if (type === 'pine') return windDraw(ctx, sprite('pine', pineSet), px, py, env, 0.85);
      if (type === 'bush') return windDraw(ctx, sprite('bush', bushSet), px, py, env, 0.45);
      if (type === 'lamp') {
        var n = isNight(env) || (env.time != null && env.time >= 18);
        return blitK(ctx, n ? 'lamp_n' : 'lamp_d', px, py);
      }
      var b = builders[type];
      if (!b) return;
      blitK(ctx, type, px, py);
    }
  };
})();
