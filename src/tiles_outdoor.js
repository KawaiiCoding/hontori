window.H = window.H || {};
(function () {
  'use strict';
  var T = 16, TAU = Math.PI * 2;
  var cache = {};
  /* Sheets (src/sheets.js): every cached picture has the sheet key 'tiles:' + its cache key, in group
     'outdoor'. Sheet first, the painters below stay as the fallback. Without H.sheets nothing changes.
       gtex dtex stex ctex            ground textures (drawn one 32x32 cell at a time)
       wt<f>                          water frame f = 0..31
       deep<k>                        deep-water tint k = 1, 2
       gd<v>                          grass detail v = 0..7
       bl<kind><v>_<f>_<em>           blades: kind g, fl, tall; v variant; f sway frame 0..6; em edge mask 0..15 (tall only)
       fh<v>_<f>                      flower heads v = 0..11, f = 0..6
       br<horiz><railA><railB>        bridge planks
       e<tx>_<ty><self><9 ranks>      autotile edge of one map cell; the same key plus f0..f3 = its four foam frames */
  var SH = H.sheets || null, GROUP = 'outdoor', PRE = 'tiles:';
  function mk(w, h) {
    var c = (typeof document !== 'undefined') ? document.createElement('canvas') : new OffscreenCanvas(w, h);
    c.width = w; c.height = h; return c;
  }
  function get(key, w, h, fn) {
    var c = cache[key];
    if (!c) { c = mk(w, h); var g = c.getContext('2d'); g.imageSmoothingEnabled = false; fn(g, w, h); cache[key] = c; if (SH && SH.recording && key !== 'wbase') SH.rec(GROUP, PRE + key, c); }
    return c;
  }
  function P(g, x, y, col) { g.fillStyle = col; g.fillRect(x | 0, y | 0, 1, 1); }
  function R(g, x, y, w, h, col) { g.fillStyle = col; g.fillRect(x | 0, y | 0, w | 0, h | 0); }
  function hash(x, y, s) {
    var h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul((s | 0) + 1, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function bay(x, y) { return (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  // periodic value noise
  function pnoise(size, cells, seed) {
    var r = rng(seed), L = [], i;
    for (i = 0; i < cells * cells; i++) L.push(r());
    var cs = size / cells;
    return function (x, y) {
      var gx = x / cs, gy = y / cs, x0 = Math.floor(gx), y0 = Math.floor(gy);
      var fx = gx - x0, fy = gy - y0;
      fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
      var a0 = ((x0 % cells) + cells) % cells, a1 = (a0 + 1) % cells;
      var b0 = ((y0 % cells) + cells) % cells, b1 = (b0 + 1) % cells;
      var v00 = L[b0 * cells + a0], v10 = L[b0 * cells + a1], v01 = L[b1 * cells + a0], v11 = L[b1 * cells + a1];
      return (v00 * (1 - fx) + v10 * fx) * (1 - fy) + (v01 * (1 - fx) + v11 * fx) * fy;
    };
  }

  // ---------- palettes ----------
  var G = { deep: '#1d4620', dark: '#2b672c', mid: '#3d8834', base: '#52a43d', light: '#6fc04c', hi: '#97dc66', tip: '#c6f28c' };
  var D = { deep: '#8a6640', dark: '#ad8853', base: '#c4a067', light: '#d6b57c', hi: '#e8cf9e' };
  var S = { dark: '#cdb070', base: '#e3cc8f', light: '#efdca6', hi: '#faefc8', deep: '#b8975a' };
  var W = { deep: '#3179bf', base: '#3e8cd2', light: '#4c9add', hi: '#78bbec', rip: '#b4e0ff', foam: '#eaf8ff', foam2: '#bfe6fb' };

  var GRASSY = { grass: 1, tallgrass: 1, flowers: 1 };
  function isGrass(id) { return !!GRASSY[id]; }
  function isWet(id) { return id === 'water' || id === 'bridge'; }

  // =====================================================================
  // All tile art is authored at DOUBLE resolution: 32x32 real pixels per 16-unit tile.
  // Cached canvases are blitted at half size (ctx is pre-scaled by 2 by the engine).
  // =====================================================================
  var HT = 32;
  /* show: a whole cached picture of real size w x h; showTex: one tile cell of a repeating n x n texture.
     `paint` returns the painted canvas and is only called when the sheet cannot serve the key. */
  function show(ctx, key, px, py, w, h, paint) {
    if (SH) { SH.draw(ctx, key, px, py, paint, w / 2, h / 2); return; }
    var c = paint(); if (c) ctx.drawImage(c, px, py, w / 2, h / 2);
  }
  function showTex(ctx, key, n, px, py, tx, ty, paint) {
    var sx = ((tx * HT) % n + n) % n, sy = ((ty * HT) % n + n) % n;
    if (SH) { SH.drawPart(ctx, key, sx, sy, HT, HT, px, py, T, T, paint); return; }
    ctx.drawImage(paint(), sx, sy, HT, HT, px, py, T, T);
  }
  /* arguments of the picture being drawn, read by the argument-free painters handed to H.sheets */
  var pK = 'g', pV = 0, pF = 0, pE = 0, pA = false, pB = false, pC = false, pEdge = null;
  var KIND = { g: 0, fl: 1, tall: 2 }, K_BL = [], K_FH = [], K_GD = [], K_WT = [], K_DEEP = [], K_BR = [];
  var K_G = PRE + 'gtex', K_D = PRE + 'dtex', K_S = PRE + 'stex', K_C = PRE + 'ctex';
  function paintBlades() { return blades(pK, pV, pF, pE); }
  function paintHeads() { return flowerHeads(pV, pF); }
  function paintDetail() { return grassDetail(pV); }
  function paintWater() { return waterTex(pF); }
  function paintDeep() { return deepTile(pV); }
  function paintBridge() { return bridge(pA, pB, pC); }
  function paintEdgeBase() { paintEdge(pEdge); return pEdge.base; }
  function paintEdgeFoam() { paintEdge(pEdge); return pEdge.foam ? pEdge.foam[pF] : null; }
  function showBlades(ctx, kind, v, f, em, px, py) {
    var i = ((KIND[kind] * 8 + v) * 7 + f) * 16 + em;
    pK = kind; pV = v; pF = f; pE = em;
    show(ctx, K_BL[i] || (K_BL[i] = PRE + 'bl' + kind + v + '_' + f + '_' + em), px, py, HT, HT + (kind === 'tall' ? 24 : 10), paintBlades);
  }
  function showHeads(ctx, v, f, px, py) {
    var i = v * 7 + f;
    pV = v; pF = f;
    show(ctx, K_FH[i] || (K_FH[i] = PRE + 'fh' + v + '_' + f), px, py, HT, HT + 8, paintHeads);
  }
  var GT = ['#35792e', '#3f8c35', '#499b3a', '#56ab40', '#66b947'];

  function grassTex() {
    return get('gtex', 256, 256, function (g) {
      var n0 = pnoise(256, 2, 5), n1 = pnoise(256, 5, 11), n2 = pnoise(256, 16, 18), r = rng(77), x, y, i, j;
      var V = new Float32Array(65536);
      for (y = 0; y < 256; y++) for (x = 0; x < 256; x++) {
        var v = n0(x, y) * 0.3 + n1(x, y) * 0.5 + n2(x, y) * 0.2;
        V[y * 256 + x] = v;
        v += (bay(x, y) - 0.5) * 0.035;
        P(g, x, y, v < 0.37 ? GT[0] : v < 0.47 ? GT[1] : v < 0.56 ? GT[2] : v < 0.65 ? GT[3] : GT[4]);
      }
      // blade clusters: lit tip, darker root, tiny shadow to the lower right (sun top-left)
      for (i = 0; i < 430; i++) {
        var cx = Math.floor(r() * 256), cy = Math.floor(r() * 256), lv = V[cy * 256 + cx], nb = 2 + Math.floor(r() * 3);
        for (j = 0; j < nb; j++) {
          var bx = (cx + j * 2 - 2 + 256) % 256, h = 2 + Math.floor(r() * 3), by = cy + (j & 1);
          for (var k = 0; k < h; k++) {
            var yy = ((by - k) % 256 + 256) % 256;
            P(g, bx, yy, k === h - 1 ? (lv > 0.56 ? '#84cf58' : '#6fc04c') : k === 0 ? GT[0] : (lv > 0.5 ? GT[4] : GT[3]));
          }
          if (j === nb - 1) P(g, (bx + 1) % 256, (by + 1) % 256, G.dark);
        }
      }
    });
  }
  function dirtTex() {
    return get('dtex', 128, 128, function (g) {
      var n1 = pnoise(128, 2, 23), n2 = pnoise(128, 4, 31), r = rng(131), x, y, i;
      for (y = 0; y < 128; y++) for (x = 0; x < 128; x++) {
        var v = n1(x, y) * 0.6 + n2(x, y) * 0.4;
        P(g, x, y, v < 0.4 ? '#c29f66' : v < 0.6 ? '#c8a66d' : '#ceae75');
      }
      function W2(x, y, c) { P(g, (x + 128) % 128, (y + 128) % 128, c); }
      for (i = 0; i < 5; i++) { // a rare rounded pebble
        x = Math.floor(r() * 128); y = Math.floor(r() * 128);
        W2(x, y, '#e6dfcc'); W2(x + 1, y, '#bdb7a6'); W2(x + 2, y, '#bdb7a6'); W2(x - 1, y + 1, '#bdb7a6'); W2(x, y + 1, '#bdb7a6'); W2(x + 1, y + 1, '#a39d8d'); W2(x + 2, y + 1, '#a39d8d');
        W2(x, y + 2, '#b08c57'); W2(x + 1, y + 2, '#b08c57'); W2(x + 2, y + 2, '#b08c57');
      }
    });
  }
  function sandTex() {
    return get('stex', 128, 128, function (g) {
      var n1 = pnoise(128, 2, 37), n2 = pnoise(128, 4, 41), x, y, k;
      for (y = 0; y < 128; y++) for (x = 0; x < 128; x++) {
        var v = n1(x, y) * 0.6 + n2(x, y) * 0.4;
        P(g, x, y, v < 0.42 ? '#e0c88a' : v < 0.6 ? S.base : '#e8d397');
      }
      for (x = 0; x < 128; x++) for (k = 0; k < 4; k++) { // faint dunes
        y = Math.round(k * 32 + 9 + Math.sin(TAU * x / 64 + k) * 4 + Math.sin(TAU * x / 128 * 3) * 2);
        y = ((y % 128) + 128) % 128;
        if ((x + k * 29) % 61 < 34) { P(g, x, y, S.light); P(g, x, (y + 1) % 128, '#dcc384'); }
      }
    });
  }
  function cobbleTex() {
    return get('ctex', 128, 128, function (g) {
      R(g, 0, 0, 128, 128, '#6a675f');
      var r = rng(51), sets = [['#a9a599', '#c9c5b8', '#807c72'], ['#9d998e', '#bdb9ad', '#77736a'], ['#b4b0a4', '#d4d0c4', '#8a867b'], ['#a69c88', '#c8bfa9', '#7d7462'], ['#9498a0', '#b6bac2', '#6e727a']];
      function W2(x, y, c) { P(g, (x + 128) % 128, (y + 128) % 128, c); }
      for (var row = 0; row < 8; row++) {
        var x = Math.floor(r() * 16), y = row * 16, start = x;
        while (x < start + 128) {
          var w = 13 + Math.floor(r() * 10); if (start + 128 - x - w < 9) w = start + 128 - x;
          var st = sets[Math.floor(r() * sets.length)], hh = 14, ww = w - 2, cut = 2 + Math.floor(r() * 2);
          for (var sy = 0; sy < hh; sy++) for (var sx = 0; sx < ww; sx++) {
            var dx = Math.min(sx, ww - 1 - sx), dy = Math.min(sy, hh - 1 - sy);
            if (dx + dy < cut) continue;
            var c = st[0];
            if ((sy < 2 || sx < 2 || dx + dy < cut + 1) && sx < ww - 2 && sy < hh - 2) c = st[1];
            if (sy >= hh - 3 || sx >= ww - 2) c = st[2];
            
            
            W2(x + sx, y + sy, c);
          }
          W2(x + 2, y + 2, '#eeeade'); W2(x + 3, y + 2, '#eeeade'); W2(x + 2, y + 3, '#eeeade');
          if (r() < 0) { var kx = x + 4 + Math.floor(r() * (ww - 8)); for (var k = 0; k < 5; k++) W2(kx + (k >> 1), y + 4 + k, st[2]); } // crack
          if (r() < 0.18) { var mx = x + ww - 1, my = y + 9 + Math.floor(r() * 4); W2(mx, my, G.mid); W2(mx + 1, my, G.light); W2(mx, my + 1, G.dark); W2(mx + 1, my - 1, G.hi); W2(mx - 1, my + 1, G.mid); } // moss in the joints
          x += w;
        }
      }
    });
  }

  // ---------- grass detail overlays (static per variant, 32x32) ----------
  var NV = 8;
  function grassDetail(v) {
    return get('gd' + v, HT, HT, function (g) {
      var r = rng(1000 + v * 77), i, x0, y0, q = r();
      if (q < 0.3) { // clover patch
        for (i = 0; i < 3; i++) {
          x0 = 6 + Math.floor(r() * 20); y0 = 6 + Math.floor(r() * 20);
          R(g, x0, y0 - 2, 2, 2, G.hi); R(g, x0 - 2, y0, 2, 2, G.light); R(g, x0 + 2, y0, 2, 2, G.light); P(g, x0, y0, G.dark); P(g, x0 + 1, y0 + 1, G.dark); R(g, x0, y0 + 2, 2, 1, G.deep);
        }
      } else if (q < 0.42) { // pebble
        x0 = 6 + Math.floor(r() * 20); y0 = 8 + Math.floor(r() * 18);
        R(g, x0, y0, 4, 3, '#a7a498'); R(g, x0, y0, 3, 1, '#dcd9cc'); P(g, x0, y0 + 1, '#dcd9cc'); R(g, x0 + 1, y0 + 2, 3, 1, '#7d7a70'); R(g, x0, y0 + 3, 5, 1, G.deep); P(g, x0 + 4, y0 + 2, G.deep);
      } else if (q < 0.6) { // daisies
        for (i = 0; i < 3; i++) {
          x0 = 4 + Math.floor(r() * 24); y0 = 4 + Math.floor(r() * 24); var c = r() < 0.6 ? '#fffbe8' : '#ffe27a';
          P(g, x0, y0 - 1, c); P(g, x0 - 1, y0, c); P(g, x0 + 1, y0, c); P(g, x0, y0 + 1, c); P(g, x0, y0, '#f2b63a'); P(g, x0 + 1, y0 + 1, G.deep); P(g, x0, y0 + 2, G.dark);
        }
      } else if (q < 0.8) { // broad leaf tuft
        x0 = 8 + Math.floor(r() * 16); y0 = 12 + Math.floor(r() * 16);
        for (i = 0; i < 5; i++) { P(g, x0 - i, y0 - i, i > 2 ? G.hi : G.light); P(g, x0 - i, y0 - i + 1, G.mid); P(g, x0 + 1 + i, y0 - i, G.light); P(g, x0 + 1 + i, y0 - i + 1, G.dark); P(g, x0, y0 - i - 1, i > 2 ? G.tip : G.light); }
        R(g, x0 - 1, y0 + 1, 4, 1, G.deep);
      }
    });
  }

  // ---------- swaying blades (double-res) ----------
  function blades(kind, v, f, em) {
    var s = f - 3, top = kind === 'tall' ? 24 : 10; em = em || 0;
    return get('bl' + kind + v + '_' + f + '_' + em, HT, HT + top, function (g) {
      var r = rng((kind === 'tall' ? 5000 : kind === 'fl' ? 7000 : 3000) + v * 131), i, j, list = [];
      if (kind === 'tall') {
        for (i = 0; i < 30; i++) list.push({ x: Math.floor(r() * 32), y: 16 + Math.floor(r() * 16), h: 14 + Math.floor(r() * 13), lean: (r() - 0.5) * 5, t: 1 });
        // thin the clump out towards sides that border open ground, so patches have ragged, rounded outlines
        function keep(x, y) {
          var kp = 1;
          if (em & 1) kp = Math.min(kp, (y - 14) / 12); if (em & 2) kp = Math.min(kp, (33 - y) / 9);
          if (em & 4) kp = Math.min(kp, (x + 1) / 13); if (em & 8) kp = Math.min(kp, (32 - x) / 13);
          return kp;
        }
        list = list.filter(function (b) { var kp = keep(b.x, b.y); if (kp < 1) b.h = Math.max(6, Math.round(b.h * (0.45 + kp * 0.55))); return hash(b.x, b.y, 77 + v) < kp * 1.15; });
        list.sort(function (a, b) { return a.y - b.y; });
        for (j = 0; j < 32; j++) for (i = 0; i < 12; i++) if (bay(j, i) < (0.6 - i * 0.04) * Math.min(1, keep(j, 20 + i) * 1.2)) P(g, j, top + 20 + i, 'rgba(15,45,15,0.5)');
      } else {
        var n = kind === 'fl' ? 2 : 1 + Math.floor(r() * 3);
        for (i = 0; i < n; i++) {
          var cx = 4 + Math.floor(r() * 24), cy = 10 + Math.floor(r() * 21), m = 3 + Math.floor(r() * 3);
          for (j = 0; j < m; j++) list.push({ x: cx + j * 2 - m + (r() < 0.3 ? 1 : 0), y: cy - (j & 1), h: 5 + Math.floor(r() * 6), lean: (j - (m - 1) / 2) * 1.3, t: 0 });
        }
      }
      var amp = kind === 'tall' ? 2.2 : 1.3;
      list.forEach(function (b) {
        if (!b.t) { P(g, b.x + 1, top + b.y, G.deep); P(g, b.x + 2, top + b.y + 1, 'rgba(20,50,20,0.5)'); }
        for (var k = 0; k < b.h; k++) {
          var u = k / (b.h - 1 || 1), x = b.x + Math.round((s * amp + b.lean) * Math.pow(u, 1.6)), y = top + b.y - k;
          var col = u < 0.3 ? G.dark : u < 0.6 ? G.mid : u < 0.85 ? G.light : G.hi;
          if (k === b.h - 1) col = G.tip;
          if (b.t) { if (u < 0.75) P(g, x + 1, y, G.deep); if (u < 0.45) P(g, x - 1, y, G.mid); if (u > 0.3 && u < 0.7) col = G.base; }
          P(g, x, y, col);
        }
      });
      if (kind === 'tall') { // seed heads catching the light
        for (i = 0; i < 4; i++) {
          if (!list.length) break; var b = list[Math.floor(r() * list.length)], hx = b.x + Math.round(s * amp + b.lean), hy = top + b.y - b.h;
          R(g, hx, hy - 3, 1, 4, '#e6d58a'); P(g, hx + 1, hy - 2, '#c2a95a'); P(g, hx - 1, hy - 1, '#f6ecb4');
        }
      }
    });
  }

  var FLC = [['#ffffff', '#cfd3e6'], ['#ff94bd', '#d4507f'], ['#ffe066', '#d39b1f'], ['#93bcff', '#5272d4'], ['#ff6a5e', '#b42b2b'], ['#d6a8ff', '#8f5cd0']];
  function flowerHeads(v, f) {
    var s = f - 3;
    return get('fh' + v + '_' + f, HT, HT + 8, function (g) {
      var r = rng(9000 + v * 53), n = 3 + Math.floor(r() * 3), L = [], i, k;
      var c1 = FLC[v % FLC.length], c2 = FLC[(v * 3 + 2) % FLC.length];
      for (i = 0; i < n; i++) L.push({ x: 5 + Math.floor(r() * 22), y: 16 + Math.floor(r() * 23), h: 6 + Math.floor(r() * 5), c: r() < 0.6 ? c1 : c2, spike: r() < 0.25 });
      L.sort(function (a, b) { return a.y - b.y; });
      L.forEach(function (o) {
        var x = o.x, y = o.y, h = o.h, c = o.c, hx = x + Math.round(s * 1.1), hy = y - h;
        R(g, x - 1, y + 1, 4, 1, 'rgba(20,50,20,0.45)');
        for (k = 0; k < h; k++) P(g, x + Math.round(s * 1.1 * k / h), y - k, k < 2 ? G.deep : G.mid);
        P(g, x - 1, y - 2, G.light); P(g, x - 2, y - 3, G.hi); P(g, x + 1, y - 3, G.mid); P(g, x + 2, y - 4, G.light);
        if (o.spike) { // lupin-like spike
          for (k = 0; k < 4; k++) { R(g, hx - 1 + (k & 1), hy - k * 2 + 1, 2, 2, k > 1 ? c[0] : c[1]); P(g, hx - 1 + (k & 1), hy - k * 2 + 1, c[0]); }
          P(g, hx, hy - 7, '#ffffff');
        } else {
          R(g, hx - 1, hy - 3, 2, 2, c[0]); R(g, hx - 3, hy - 1, 2, 2, c[0]); R(g, hx + 1, hy - 1, 2, 2, c[1]); R(g, hx - 1, hy + 1, 2, 2, c[1]);
          P(g, hx + 1, hy - 1, c[0]); P(g, hx - 1, hy + 1, c[0]);
          R(g, hx - 1, hy - 1, 2, 2, '#ffd23a'); P(g, hx, hy, '#d8901e'); P(g, hx - 1, hy - 3, '#ffffff'); P(g, hx - 3, hy - 1, '#ffffff');
        }
      });
    });
  }

  // wind: a gust front travels across the map (left to right), blades lean with it then spring back
  function swayFrame(env, tx, ty, amp) {
    var w = env && env.wind != null ? env.wind : 0.3, t = env && env.t || 0;
    if (env && env.weather === 'wind') w = Math.max(w, 0.6);
    var ph = t * 1.5 - tx * 0.42 - ty * 0.16;
    var gust = Math.pow(Math.sin(ph) * 0.5 + 0.5, 2);
    var s = (Math.sin(t * (1.6 + w * 1.6) - tx * 0.9 + ty * 0.5) * (0.35 + w * 0.5) + gust * (0.6 + w * 3.2)) * amp;
    return clamp(Math.round(s), -3, 3) + 3;
  }

  // ---------- rounded organic autotile edges ----------
  // Higher-ranked ground spills onto lower-ranked neighbours. Coverage = box-blurred indicator of the 3x3
  // neighbourhood, thresholded with a world-space wobble, so corners come out round (inner and outer) and
  // border lines meander and match across tile seams. One cached 32x32 canvas per edge tile.
  var RANK = { water: 0, bridge: 0, cobble: 1, path: 2, sand: 3, grass: 4, tallgrass: 4, flowers: 4 };
  var RK = 14, MG = 10, GW = HT + MG * 2;
  var wobA = pnoise(128, 5, 61), wobB = pnoise(128, 13, 67);
  function texFor(k) { return k === 4 ? grassTex() : k === 3 ? sandTex() : k === 2 ? dirtTex() : cobbleTex(); }
  var ETONE = {
    4: { lit: ['#8fd660', G.light], sh: [G.dark, GT[0]] }, 3: { lit: [S.hi, S.light], sh: [S.dark, '#d6ba7c'] },
    2: { lit: [D.hi, D.light], sh: [D.dark, '#b8945e'] }, 1: { lit: ['#d4d0c4', '#b4b0a4'], sh: ['#706c64', '#8a867b'] }
  };
  var BANK = { 4: ['#8a683e', '#6f5030', '#523a20', '#382614'], 3: ['#d9c07c', '#c2a463', '#9c8048', '#7c6436'], 2: ['#b8945e', '#9c7a48', '#7c5e36', '#5a4226'], 1: ['#9a978c', '#7c796f', '#5c5a52', '#42403b'] };
  var scratch = null, maskCv = null, edgeCache = {}, recPart = '';
  function margin(tx, ty, ranks, k) { // (coverage - threshold) on a grid with MG px of margin
    var m = new Float32Array(GW * GW), ox = [0, 0, 0], oy = [0, 0, 0], x, y, i, j;
    var ind = []; for (i = 0; i < 9; i++) ind.push(ranks[i] >= k ? 1 : 0);
    for (y = 0; y < GW; y++) {
      var py = y - MG + 0.5;
      for (j = 0; j < 3; j++) oy[j] = Math.max(0, Math.min(py + RK, 32 * j) - Math.max(py - RK, 32 * j - 32)) / (2 * RK);
      for (x = 0; x < GW; x++) {
        var px = x - MG + 0.5, f = 0;
        for (i = 0; i < 3; i++) ox[i] = Math.max(0, Math.min(px + RK, 32 * i) - Math.max(px - RK, 32 * i - 32)) / (2 * RK);
        for (j = 0; j < 3; j++) if (oy[j] > 0) for (i = 0; i < 3; i++) if (ind[j * 3 + i]) f += ox[i] * oy[j];
        var wx = tx * 32 + x - MG, wy = ty * 32 + y - MG;
        m[y * GW + x] = f - (0.29 + (wobA(wx, wy) - 0.5) * 0.2 + (wobB(wx, wy) - 0.5) * 0.09);
      }
    }
    return m;
  }
  function edgeTile(tx, ty, self, nb) {
    var sr = RANK[self] || 0, ranks = [], has = [0, 0, 0, 0, 0], maxr = sr, i, j, x, y, k;
    for (j = -1; j <= 1; j++) for (i = -1; i <= 1; i++) {
      var rr = (i || j) ? RANK[nb(i, j)] : sr; if (rr === undefined) rr = 4;
      ranks.push(rr); has[rr] = 1; if (rr > maxr) maxr = rr;
    }
    if (maxr <= sr) return null;
    var key = tx + '_' + ty + self + ranks.join(''), res = edgeCache[key];
    if (!res) {
      /* a light record; the pictures are painted only if the sheet cannot serve them */
      res = edgeCache[key] = { tx: tx, ty: ty, sr: sr, ranks: ranks, has: has, base: null, foam: null, kb: PRE + 'e' + key, kf: null };
      if (sr === 0) res.kf = [res.kb + 'f0', res.kb + 'f1', res.kb + 'f2', res.kb + 'f3'];
    }
    return res;
  }
  function paintEdge(res) {
    if (res.base) return;
    var tx = res.tx, ty = res.ty, sr = res.sr, ranks = res.ranks, has = res.has, i, j, x, y, k;
    if (!scratch) { scratch = mk(HT, HT); maskCv = mk(HT, HT); }
    var out = mk(HT, HT), og = out.getContext('2d'), sg = scratch.getContext('2d'), mg = maskCv.getContext('2d');
    var first = null, foam = null;
    function M(m, x, y) { return m[(y + MG) * GW + x + MG]; }
    for (k = sr + 1; k <= 4; k++) {
      if (!has[k]) continue;
      var m = margin(tx, ty, ranks, k), tn = ETONE[k];
      if (!first) first = { m: m, k: k };
      // soft shading on the lower ground just outside the edge (shadow on the lower-right side, damp line elsewhere)
      if (sr > 0) for (y = 0; y < 32; y++) for (x = 0; x < 32; x++) {
        var v = M(m, x, y); if (v > 0 || v < -0.17) continue;
        var shaded = M(m, x - 2, y - 2) > M(m, x + 2, y + 2);
        P(og, x, y, v < -0.075 ? 'rgba(96,62,20,0.08)' : shaded ? (v > -0.04 ? 'rgba(60,40,10,0.24)' : 'rgba(70,46,14,0.14)') : 'rgba(80,52,16,0.13)');
      }
      var id = mg.createImageData(HT, HT), d = id.data;
      for (y = 0; y < 32; y++) for (x = 0; x < 32; x++) if (M(m, x, y) > 0) d[(y * 32 + x) * 4 + 3] = 255;
      mg.putImageData(id, 0, 0);
      sg.globalCompositeOperation = 'source-over'; sg.clearRect(0, 0, HT, HT);
      var tex = texFor(k), n = tex.width;
      sg.drawImage(tex, ((tx * HT) % n + n) % n, ((ty * HT) % n + n) % n, HT, HT, 0, 0, HT, HT);
      sg.globalCompositeOperation = 'destination-in'; sg.drawImage(maskCv, 0, 0);
      og.drawImage(scratch, 0, 0);
      // 2-step rim: lit towards the sun (top-left), gently darker away from it
      for (y = 0; y < 32; y++) for (x = 0; x < 32; x++) {
        var v2 = M(m, x, y); if (v2 <= 0 || v2 > 0.07) continue;
        var lit = M(m, x + 2, y + 2) > M(m, x - 2, y - 2), tt = lit ? tn.lit : tn.sh;
        if (v2 < 0.035) P(og, x, y, tt[0]); else if (bay(x, y) < 0.6) P(og, x, y, tt[1]);
      }
      if (k === 4) { // tufts and stray blades leaning out over the border
        for (y = 0; y < 32; y++) for (x = 0; x < 32; x++) {
          var v3 = M(m, x, y); if (v3 > -0.005 || v3 < -0.11) continue;
          var hq = hash(tx * 32 + x, ty * 32 + y, 33); if (hq < 0.93) continue;
          var bh = 2 + Math.floor((hq - 0.93) * 60);
          for (j = 0; j < bh; j++) P(og, x, y - j, j === bh - 1 ? '#84cf58' : j ? G.base : G.dark);
          P(og, x + 1, y, 'rgba(40,30,10,0.3)');
        }
      }
    }
    if (sr === 0 && first) { // water: bank face under land that lies above, shallows, foam frames
      var fm = first.m, ukind = Math.max(1, ranks[1] || ranks[0] || ranks[2] || first.k), face = BANK[ukind], up = new Uint8Array(1024);
      for (y = 0; y < 32; y++) for (x = 0; x < 32; x++) {
        if (M(fm, x, y) > 0) continue;
        var dd = 0; for (j = 1; j <= 10; j++) if (M(fm, x, y - j) > 0) { dd = j; break; }
        up[y * 32 + x] = dd;
        if (dd && dd <= 6) P(og, x, y, dd < 2 ? face[0] : dd === 2 ? (bay(x, y) < 0.5 ? face[0] : face[1]) : dd === 3 ? face[1] : dd < 6 ? (hash(tx * 32 + x >> 2, dd, 9) < 0.3 ? face[3] : face[2]) : face[3]);
        else if (dd) P(og, x, y, dd < 9 ? 'rgba(16,52,100,0.5)' : 'rgba(16,52,100,0.25)');
        else { var sv = -M(fm, x, y); if (sv < 0.24) P(og, x, y, sv < 0.12 ? 'rgba(170,228,255,0.34)' : 'rgba(170,228,255,0.16)'); }
      }
      foam = [];
      for (var fr = 0; fr < 4; fr++) {
        var fc = mk(HT, HT), fg = fc.getContext('2d'), a = 0.004 + fr * 0.016;
        for (y = 0; y < 32; y++) for (x = 0; x < 32; x++) {
          var mv = M(fm, x, y); if (mv > 0) continue;
          var u = up[y * 32 + x], wv = wobB(tx * 32 + x + fr * 9, ty * 32 + y);
          if (u) { if (u === 7 + (fr & 1) && wv > 0.42) P(fg, x, y, u === 7 ? W.foam : W.foam2); continue; }
          var val = -mv;
          if (val >= a && val < a + 0.035) P(fg, x, y, W.foam);
          else if (val >= a + 0.035 && val < a + 0.06 && wv > 0.4) P(fg, x, y, W.foam2);
          else if (val >= a + 0.15 && val < a + 0.175 && wv > 0.56) P(fg, x, y, 'rgba(234,248,255,0.5)');
        }
        foam.push(fc);
      }
    }
    res.base = out; res.foam = foam;
    if (SH && SH.recording) {
      SH.rec(GROUP, res.kb, out, recPart);
      if (foam && res.kf) for (i = 0; i < 4; i++) SH.rec(GROUP, res.kf[i], foam[i], recPart);
    }
  }
  function drawEdges(ctx, px, py, tx, ty, self, nb) {
    var e = edgeTile(tx, ty, self, nb);
    if (e) { pEdge = e; show(ctx, e.kb, px, py, HT, HT, paintEdgeBase); }
    return e;
  }

  // ---------- water ----------
  // calm clear water: three smooth flat tones (static soft shapes) + a few slow drifting highlight strokes
  var WF = 32;
  function waterBase() {
    return get('wbase', 128, 128, function (g) {
      for (var y = 0; y < 128; y++) for (var x = 0; x < 128; x++) {
        var v = Math.sin(TAU * (x + 2 * y) / 128) * 0.5 + Math.sin(TAU * (2 * x - y) / 128 + 1.3) * 0.3 + Math.sin(TAU * 3 * y / 128 + Math.sin(TAU * x / 128) * 1.2) * 0.3;
        P(g, x, y, v < -0.55 ? W.deep : v < 0.5 ? W.base : W.light);
      }
    });
  }
  function waterTex(f) {
    return get('wt' + f, 128, 128, function (g) {
      g.drawImage(waterBase(), 0, 0);
      var r = rng(4242), sh = Math.round(f * 128 / WF);
      function seg(x, y, len, col) { for (var i = 0; i < len; i++) P(g, ((x + i) % 128 + 128) % 128, ((y % 128) + 128) % 128, col); }
      for (var i = 0; i < 22; i++) {
        var x = Math.floor(r() * 128), y = Math.floor(r() * 64) * 2, len = 7 + Math.floor(r() * 9), sp = r() < 0.5 ? 1 : 2, br = r() < 0.3;
        var pulse = Math.sin(TAU * (f / WF) * sp + i * 1.7);          // strokes breathe a little as they drift
        var l2 = Math.max(3, Math.round(len * (0.75 + pulse * 0.25))), xx = x + sh * sp;
        seg(xx, y, l2, br ? W.rip : W.hi);
        seg(xx + 1, y, 1, br ? '#ffffff' : W.rip);
        seg(xx + 3, y + 1, Math.max(2, l2 - 6), W.hi);
        seg(xx - 2, y + 3, Math.max(2, (l2 >> 1)), W.deep);
      }
    });
  }
  function deepTile(k) {
    return get('deep' + k, HT, HT, function (g) {
      for (var y = 0; y < 32; y++) for (var x = 0; x < 32; x++) P(g, x, y, k === 2 ? 'rgba(22,52,112,0.2)' : 'rgba(22,52,112,0.1)');
    });
  }
  function drawWater(ctx, px, py, tx, ty, env, nb, withShore) {
    var t = env && env.t || 0;
    pF = Math.floor(t * 4) % WF;
    showTex(ctx, K_WT[pF] || (K_WT[pF] = PRE + 'wt' + pF), 128, px, py, tx, ty, paintWater);
    var U = nb(0, -1), Dn = nb(0, 1), L = nb(-1, 0), Rr = nb(1, 0);
    var all8 = isWet(U) && isWet(Dn) && isWet(L) && isWet(Rr) && isWet(nb(-1, -1)) && isWet(nb(1, -1)) && isWet(nb(-1, 1)) && isWet(nb(1, 1));
    if (all8) {
      pV = isWet(nb(0, -2)) && isWet(nb(0, 2)) && isWet(nb(-2, 0)) && isWet(nb(2, 0)) ? 2 : 1;
      show(ctx, K_DEEP[pV] || (K_DEEP[pV] = PRE + 'deep' + pV), px, py, HT, HT, paintDeep);
    }
    // sparkles (half-unit pixels)
    for (var k = 0; k < 2; k++) {
      var h = hash(tx, ty, 40 + k), cyc = (t * (0.3 + h * 0.25) + h * 7) % 1;
      if (cyc < 0.14) {
        var sx = px + 2 + Math.floor(hash(tx, ty, 50 + k) * 24) / 2, sy = py + 3 + Math.floor(hash(tx, ty, 60 + k) * 20) / 2;
        ctx.fillStyle = '#ffffff'; ctx.fillRect(sx, sy, 0.5, 0.5);
        if (cyc > 0.03 && cyc < 0.11) {
          ctx.fillStyle = '#e4f5ff'; ctx.fillRect(sx - 1, sy, 2.5, 0.5); ctx.fillRect(sx, sy - 1, 0.5, 2.5);
          ctx.fillStyle = '#ffffff'; ctx.fillRect(sx - 0.5, sy, 1.5, 0.5); ctx.fillRect(sx, sy - 0.5, 0.5, 1.5);
        }
      }
    }
    if (!withShore) return;
    var e = drawEdges(ctx, px, py, tx, ty, 'water', nb);
    if (e && e.kf) {
      var fi = Math.floor(t * 2.5 + hash(tx >> 2, ty >> 2, 8) * 2) % 6;
      pEdge = e; pF = fi < 4 ? fi : 6 - fi;
      show(ctx, e.kf[pF], px, py, HT, HT, paintEdgeFoam);
    }
  }

  // ---------- bridge (32x32) ----------
  function bridge(horiz, railA, railB) {
    return get('br' + (horiz ? 1 : 0) + (railA ? 1 : 0) + (railB ? 1 : 0), HT, HT, function (g) {
      var WOOD = [['#a8743e', '#c2905a', '#855a30'], ['#9a6836', '#b68450', '#7a5029'], ['#b27c44', '#cc9a62', '#8e6236']], i, j;
      function put(a, b, col) { if (horiz) P(g, a, b, col); else P(g, b, a, col); }
      for (var p = 0; p < 4; p++) {
        var wd = WOOD[(p * 2 + 1) % 3];
        for (i = 0; i < 8; i++) for (j = 2; j < 30; j++) {
          var a = p * 8 + i, col = wd[0];
          if (i === 7) col = '#3e2612'; else if (i === 6) col = wd[2]; else if (i === 0) col = wd[1];
          else if (hash(p * 8 + i, j >> 3, 81) < 0.22) col = wd[2];           // grain streaks
          else if (hash(p * 8 + i, j >> 2, 83) > 0.9) col = wd[1];
          if (j >= 28) col = '#5e3a1b';
          put(a, j, col);
        }
        put(p * 8 + 3, 6, '#2e1c0c'); put(p * 8 + 3, 7, '#d8b078'); put(p * 8 + 3, 24, '#2e1c0c'); put(p * 8 + 3, 25, '#d8b078');
        if (p === 1) { for (j = 12; j < 17; j++) put(p * 8 + 2 + ((j >> 1) & 1), j, wd[2]); }   // knot crack
      }
      for (i = 0; i < 32; i++) { put(i, 0, 'rgba(10,30,60,0.3)'); put(i, 1, 'rgba(10,30,60,0.45)'); put(i, 30, 'rgba(10,30,60,0.5)'); put(i, 31, 'rgba(10,30,60,0.3)'); }
      function rail(b0, front) {
        for (i = 0; i < 32; i++) {
          put(i, b0, '#f0c890'); put(i, b0 + 1, '#d39a5c'); put(i, b0 + 2, '#b47c44'); put(i, b0 + 3, '#8a5a2c'); put(i, b0 + 4, front ? '#4a2c14' : '#5e3a1c');
          put(i, b0 + 5, 'rgba(40,20,5,0.35)'); if (i & 1) put(i, b0 + 6, 'rgba(40,20,5,0.25)');
        }
        for (i = 2; i < 32; i += 14) for (j = 0; j < 4; j++) { put(i + j, b0 - 1, '#3e2612'); put(i + j, b0, j < 1 ? '#fff0c8' : '#e8b87c'); put(i + j, b0 + 1, j < 3 ? '#d39a5c' : '#7a4c24'); put(i + j, b0 + 2, j < 3 ? '#a8743e' : '#5e3a1c'); put(i + j, b0 + 3, '#6e4522'); put(i + j, b0 + 4, '#3e2612'); }
      }
      if (railA) rail(1, false);
      if (railB) rail(24, true);
    });
  }

  // ---------- main draw ----------
  function noNb(id) { return function () { return id; }; }

  function drawGrassBase(ctx, px, py, tx, ty) {
    showTex(ctx, K_G, 256, px, py, tx, ty, grassTex);
    if (hash(tx, ty, 21) < 0.3) {
      pV = Math.floor(hash(tx, ty, 1) * NV);
      show(ctx, K_GD[pV] || (K_GD[pV] = PRE + 'gd' + pV), px, py, HT, HT, paintDetail);
    }
  }

  function draw(ctx, id, px, py, tx, ty, env, nb) {
    px = px | 0; py = py | 0; env = env || {};
    nb = nb || noNb(id);
    var v = Math.floor(hash(tx, ty, 2) * NV), f;
    switch (id) {
      case 'grass':
        drawGrassBase(ctx, px, py, tx, ty);
        f = swayFrame(env, tx, ty, 1);
        showBlades(ctx, 'g', v, f, 0, px, py - 5);
        break;
      case 'tallgrass':
        drawGrassBase(ctx, px, py, tx, ty);
        f = swayFrame(env, tx, ty, 1.3);
        var em = (nb(0, -1) !== 'tallgrass' ? 1 : 0) | (nb(0, 1) !== 'tallgrass' ? 2 : 0) | (nb(-1, 0) !== 'tallgrass' ? 4 : 0) | (nb(1, 0) !== 'tallgrass' ? 8 : 0);
        showBlades(ctx, 'tall', v % 6, f, em, px, py - 12);
        break;
      case 'flowers':
        drawGrassBase(ctx, px, py, tx, ty);
        f = swayFrame(env, tx, ty, 1);
        showBlades(ctx, 'fl', v, f, 0, px, py - 5);
        showHeads(ctx, Math.floor(hash(tx, ty, 3) * 12), f, px, py - 4);
        break;
      case 'path':
      case 'cobble':
        if (id === 'path') showTex(ctx, K_D, 128, px, py, tx, ty, dirtTex); else showTex(ctx, K_C, 128, px, py, tx, ty, cobbleTex);
        drawEdges(ctx, px, py, tx, ty, id, nb);
        break;
      case 'sand':
        showTex(ctx, K_S, 128, px, py, tx, ty, sandTex);
        var hs = hash(tx, ty, 12);
        if (hs < 0.18) { // shell
          var sx = px + 3 + Math.floor(hash(tx, ty, 13) * 10), sy = py + 3 + Math.floor(hash(tx, ty, 14) * 10);
          ctx.fillStyle = '#fff3ea'; ctx.fillRect(sx + 0.5, sy, 1.5, 0.5); ctx.fillRect(sx, sy + 0.5, 2.5, 0.5);
          ctx.fillStyle = '#f2b8a8'; ctx.fillRect(sx, sy + 1, 2.5, 0.5); ctx.fillRect(sx + 1, sy + 0.5, 0.5, 1);
          ctx.fillStyle = '#b9905a'; ctx.fillRect(sx + 0.5, sy + 1.5, 2, 0.5);
        }
        drawEdges(ctx, px, py, tx, ty, id, nb);
        break;
      case 'water':
        drawWater(ctx, px, py, tx, ty, env, nb, true);
        break;
      case 'bridge':
        drawWater(ctx, px, py, tx, ty, env, nb, false);
        var horiz = isWet(nb(0, -1)) || isWet(nb(0, 1)) ? true : !(isWet(nb(-1, 0)) || isWet(nb(1, 0)));
        var ra, rb;
        if (horiz) { ra = nb(0, -1) === 'water'; rb = nb(0, 1) === 'water'; }
        else { ra = nb(-1, 0) === 'water'; rb = nb(1, 0) === 'water'; }
        pA = horiz; pB = ra; pC = rb;
        var bi = (horiz ? 4 : 0) + (ra ? 2 : 0) + (rb ? 1 : 0);
        show(ctx, K_BR[bi] || (K_BR[bi] = PRE + 'br' + (horiz ? 1 : 0) + (ra ? 1 : 0) + (rb ? 1 : 0)), px, py, HT, HT, paintBridge);
        break;
      default:
        drawGrassBase(ctx, px, py, tx, ty);
    }
  }

  if (SH) {
    /* once a sheet is in memory, the painted copies of its pictures are let go */
    SH.onLoad(function () {
      var k, e, q, all;
      for (k in cache) if (SH.has(PRE + k)) delete cache[k];
      for (k in edgeCache) {
        e = edgeCache[k]; if (!e.base) continue;
        all = SH.has(e.kb);
        if (all && e.kf) for (q = 0; q < 4; q++) if (!SH.has(e.kf[q])) all = false;
        if (all) { e.base = null; e.foam = null; }
      }
    });
    /* build tool: paint every picture this module can make. Edges come from the map tables. */
    SH.enumerate(GROUP, function () {
      var v, f, em, q, kinds = ['g', 'fl'];
      grassTex(); dirtTex(); sandTex(); cobbleTex();
      for (f = 0; f < WF; f++) waterTex(f);
      deepTile(1); deepTile(2);
      for (v = 0; v < NV; v++) grassDetail(v);
      for (q = 0; q < 2; q++) for (v = 0; v < NV; v++) for (f = 0; f < 7; f++) blades(kinds[q], v, f, 0);
      for (v = 0; v < 6; v++) for (f = 0; f < 7; f++) for (em = 0; em < 16; em++) blades('tall', v, f, em);
      for (v = 0; v < 12; v++) for (f = 0; f < 7; f++) flowerHeads(v, f);
      for (q = 0; q < 8; q++) bridge(!!(q & 4), !!(q & 2), !!(q & 1));
      var maps = H.maps || {};
      Object.keys(maps).sort().forEach(function (name) {
        var m = maps[name]; if (!m || m.tileset === 'indoor' || !m.ground || !m.legend) return;
        /* the edges of one map are only ever needed together: one sheet per map */
        recPart = 'edges-' + name;
        var first = m.legend[Object.keys(m.legend)[0]];
        var grid = m.ground.map(function (row) { return Array.prototype.map.call(row, function (ch) { return m.legend[ch] || first; }); });
        grid.forEach(function (row, ty) {
          row.forEach(function (id, tx) {
            if (id !== 'path' && id !== 'cobble' && id !== 'sand' && id !== 'water') return;
            var e = edgeTile(tx, ty, id, function (dx, dy) { return (grid[ty + dy] && grid[ty + dy][tx + dx]) || 'grass'; });
            if (e) paintEdge(e);
          });
        });
      });
      recPart = '';
    });
  }

  H.tilesOutdoor = {
    draw: draw,
    /* still[id] is true when what draw() paints for that tile depends only on its id, its position and
       its eight neighbours: never on time, wind, weather or the hour. Such a tile can be drawn once into
       a larger picture. Everything else moves: grass, tall grass and flowers sway, water and the water
       under a bridge flow. An id that is not listed counts as moving. */
    still: { path: true, cobble: true, sand: true, grass: false, tallgrass: false, flowers: false, water: false, bridge: false },
    solid: { water: true, grass: false, tallgrass: false, flowers: false, path: false, cobble: false, sand: false, bridge: false }
  };
})();
