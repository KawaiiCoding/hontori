window.H = window.H || {};
(function () {
  'use strict';
  var T = 16;

  function mk(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    return { c: c, g: g };
  }
  function P(g, x, y, col, w, h) { g.fillStyle = col; g.fillRect(x | 0, y | 0, w || 1, h || 1); }
  // shaded box: outline, base, top highlight, bottom/right shade
  function box(g, x, y, w, h, base, hi, sh, ol) {
    P(g, x, y, ol, w, h);
    P(g, x + 1, y + 1, base, w - 2, h - 2);
    P(g, x + 1, y + 1, hi, w - 2, 1);
    P(g, x + 1, y + 1, hi, 1, h - 2);
    P(g, x + 1, y + h - 2, sh, w - 2, 1);
    P(g, x + w - 2, y + 1, sh, 1, h - 2);
  }
  function disc(g, cx, cy, r, col) {
    for (var y = -r; y <= r; y++) for (var x = -r; x <= r; x++)
      if (x * x + y * y <= r * r + r * 0.6) P(g, cx + x, cy + y, col);
  }
  function hash(a, b) { var h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function shadow(g, x, y, w, h) { g.fillStyle = 'rgba(20,10,5,0.28)'; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(20,10,5,0.16)'; g.fillRect(x - 1, y + 1, w + 2, h - 2); }

  // ---- double-resolution support -------------------------------------------------
  // Sprites are shown on a 2x canvas. up2() turns a 1x sprite into a real 2x one by
  // edge-aware doubling (diagonals and curves become smooth steps, flat areas stay
  // crisp). Painters flagged hd already author at 2x. blit() draws at logical size.
  function up2(src) {
    if (src._hd) return src._hd;
    var w = src.width, h = src.height;
    var sd = src.getContext('2d').getImageData(0, 0, w, h);
    var a = new Uint32Array(sd.data.buffer);
    var out = document.createElement('canvas'); out.width = w * 2; out.height = h * 2;
    var og = out.getContext('2d'), od = og.createImageData(w * 2, h * 2), o = new Uint32Array(od.data.buffer);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var i = y * w + x, p = a[i];
      var A = y > 0 ? a[i - w] : p, D = y < h - 1 ? a[i + w] : p, C = x > 0 ? a[i - 1] : p, B = x < w - 1 ? a[i + 1] : p;
      var j = (y * 2) * (w * 2) + x * 2;
      o[j] = (C === A && C !== D && A !== B) ? A : p;
      o[j + 1] = (A === B && A !== C && B !== D) ? B : p;
      o[j + w * 2] = (D === C && D !== B && C !== A) ? C : p;
      o[j + w * 2 + 1] = (B === D && B !== A && D !== C) ? D : p;
    }
    og.putImageData(od, 0, 0);
    src._hd = out; out._hd = out;
    return out;
  }
  function blit(ctx, c, x, y) { if (!c) return; var hc = up2(c); ctx.drawImage(hc, x, y, hc.width / 2, hc.height / 2); }
  function mk2(w, h) { var s = mk(w * 2, h * 2); s.c._hd = s.c; return s; }
  // rounded rectangle (pixel-stepped corners, radius r)
  function rr(g, x, y, w, h, r, col) {
    g.fillStyle = col;
    for (var i = 0; i < r; i++) {
      var d = r - Math.round(Math.sqrt(r * r - (r - i - 0.5) * (r - i - 0.5)));
      g.fillRect(x + d, y + i, w - 2 * d, 1); g.fillRect(x + d, y + h - 1 - i, w - 2 * d, 1);
    }
    g.fillRect(x, y + r, w, h - 2 * r);
  }
  // soft cushion-like volume: outline, base, broad top-left light, bottom-right shade
  function vol(g, x, y, w, h, r, ramp, ol) {
    rr(g, x, y, w, h, r, ol);
    rr(g, x + 1, y + 1, w - 2, h - 2, Math.max(1, r - 1), ramp[0]);            // shade
    rr(g, x + 1, y + 1, w - 3, h - 4, Math.max(1, r - 1), ramp[1]);            // base
    rr(g, x + 2, y + 2, w - 6, Math.max(2, (h / 3) | 0), Math.max(1, r - 2), ramp[2]); // light
    g.fillStyle = ramp[3]; g.fillRect(x + r + 1, y + 2, Math.max(2, (w / 3) | 0), 1); // rim highlight
  }
  function softShadow(g, x, y, w, h) {
    rr(g, x, y, w, h, Math.min(3, h >> 1), 'rgba(20,10,5,0.20)'); rr(g, x + 2, y + 1, w - 4, h - 2, 1, 'rgba(20,10,5,0.16)');
  }
  H._hd = { up2: up2, blit: blit, mk2: mk2, rr: rr, vol: vol, softShadow: softShadow };

  var OL = '#2a1a14';
  var WOOD = ['#8a5a34', '#b07a48', '#5e3a20'];
  var DWOOD = ['#5e3a22', '#7c5030', '#3c2414'];

  // ---------- art painters: each returns {c, ox, oy} where ox/oy offset from footprint top-left
  var painters = {};

  painters.fireplace_base = function () {
    var s = mk(32, 48), g = s.g;
    var MORT = '#463c35';
    var ST = [['#8f8478', '#b0a594', '#6b6156'], ['#9a8c7a', '#baab96', '#72665a'], ['#84807a', '#a4a098', '#605e58'], ['#a08a74', '#bea88e', '#786450']];
    function stones(x0, y0, w, h, seed) {
      P(g, x0, y0, MORT, w, h);
      var row = 0;
      for (var y = y0; y < y0 + h; y += 4, row++) {
        var x = x0 - ((hash(row, seed) * 4) | 0) - ((row & 1) ? 3 : 0), i = 0;
        var hh = Math.min(3, y0 + h - y);
        while (x < x0 + w) {
          var sw = 5 + ((hash(row * 9 + i, seed + 1) * 4) | 0);
          var a = Math.max(x, x0), b = Math.min(x + sw - 1, x0 + w);
          if (b - a >= 1 && hh > 0) {
            var p = ST[(hash(row * 5 + i, seed + 2) * 4) | 0];
            P(g, a, y, p[0], b - a, hh);
            P(g, a, y, p[1], b - a, 1);
            if (a === x && hh > 1) P(g, a, y + 1, p[1], 1, hh - 1);
            if (hh > 1) P(g, a + 1, y + hh - 1, p[2], b - a - 1, 1);
            if (b - a > 3 && hash(row + i, seed + 3) > 0.55) P(g, a + 2, y + 1, p[2]);
          }
          x += sw; i++;
        }
      }
    }
    // chimney breast going up over the wall
    P(g, 3, 0, OL, 26, 20);
    stones(4, 1, 24, 18, 3);
    g.fillStyle = 'rgba(20,10,5,0.22)'; g.fillRect(25, 1, 3, 18);
    g.fillStyle = 'rgba(20,10,5,0.10)'; g.fillRect(22, 1, 3, 18);
    g.fillStyle = 'rgba(255,240,210,0.14)'; g.fillRect(4, 1, 2, 18);
    // firebox surround (stone)
    P(g, 1, 22, OL, 30, 26);
    stones(2, 23, 28, 22, 11);
    g.fillStyle = 'rgba(20,10,5,0.20)'; g.fillRect(27, 23, 3, 22);
    g.fillStyle = 'rgba(255,240,210,0.12)'; g.fillRect(2, 23, 2, 22);
    // mantel shelf: thick oak beam with lit top face
    P(g, 0, 17, OL, 32, 6);
    P(g, 1, 18, '#b8834e', 30, 1); P(g, 1, 18, '#d8a66c', 12, 1);
    P(g, 1, 19, '#9a6a40', 30, 1);
    P(g, 1, 20, '#7c5030', 30, 2); P(g, 1, 21, '#5a381f', 30, 1);
    for (var mx = 4; mx < 30; mx += 7) P(g, mx, 20, '#5a381f', 3, 1);
    g.fillStyle = 'rgba(15,8,4,0.45)'; g.fillRect(2, 23, 28, 1);
    g.fillStyle = 'rgba(15,8,4,0.22)'; g.fillRect(2, 24, 28, 1);
    // mantel decor: candle, little clock, blue jar, sprig
    P(g, 5, 12, OL, 3, 6); P(g, 6, 13, '#f0e6cc', 1, 4); P(g, 4, 17, '#c9a24a', 5, 1);
    P(g, 23, 13, OL, 5, 5); P(g, 24, 14, '#4d7fa8', 3, 3); P(g, 24, 14, '#8fc0e0'); P(g, 26, 16, '#365d80');
    P(g, 25, 11, '#5a8a48'); P(g, 24, 10, '#6fa458'); P(g, 26, 9, '#6fa458'); P(g, 25, 12, '#4a6a3a');
    P(g, 13, 10, OL, 6, 8); P(g, 14, 9, OL, 4, 1); P(g, 14, 11, '#d9b45a', 4, 6); P(g, 14, 10, '#f0d080', 4, 1);
    P(g, 15, 12, '#fff6d8', 2, 2); P(g, 16, 13, OL); P(g, 14, 16, '#a8842e', 4, 1);
    // arched opening
    P(g, 6, 28, OL, 20, 17);
    P(g, 7, 27, OL, 18, 1); P(g, 9, 26, OL, 14, 1);
    P(g, 7, 29, '#170c09', 18, 16); P(g, 8, 28, '#170c09', 16, 1); P(g, 10, 27, '#170c09', 12, 1);
    // soot-black brick back wall
    P(g, 9, 30, '#2a1712', 14, 12);
    for (var by = 30; by < 42; by += 3) { P(g, 9, by, '#1e100c', 14, 1); for (var bx = 10 + ((by / 3) & 1) * 3; bx < 23; bx += 6) P(g, bx, by + 1, '#1e100c', 1, 2); }
    // keystone
    P(g, 13, 23, OL, 6, 5); P(g, 14, 24, '#b9ae9e', 4, 3); P(g, 14, 24, '#d4c9b6', 4, 1); P(g, 17, 25, '#8f8478', 1, 2);
    // hearth slab
    P(g, 0, 44, OL, 32, 4); P(g, 1, 45, '#857a6e', 30, 2); P(g, 1, 45, '#b0a596', 30, 1);
    P(g, 10, 45, '#5d544a', 1, 2); P(g, 21, 45, '#5d544a', 1, 2);
    // logs
    P(g, 9, 40, OL, 14, 4); P(g, 10, 41, '#6b4022', 12, 2); P(g, 10, 41, '#8b5a32', 12, 1);
    P(g, 21, 41, '#c9a27a', 1, 2); P(g, 10, 41, '#c9a27a', 1, 2);
    P(g, 11, 38, OL, 11, 3); P(g, 12, 39, '#5a3418', 9, 1); P(g, 12, 39, '#7a4a26', 4, 1);
    // andirons
    P(g, 8, 38, '#15110f', 1, 6); P(g, 23, 38, '#15110f', 1, 6); P(g, 8, 37, '#c9a24a'); P(g, 23, 37, '#c9a24a');
    return { c: s.c, ox: 0, oy: -32 };
  };

  var fireFrames = null, fireGlow = null;
  function buildFire() {
    var base = painters.fireplace_base();
    fireFrames = [];
    var N = 8, f, x, y;
    var LAY = [[1, '#b32e16'], [0.86, '#e8521c'], [0.64, '#ff8a26'], [0.42, '#ffc23c'], [0.2, '#fff3b0']];
    for (f = 0; f < N; f++) {
      var s = mk(32, 48), g = s.g;
      g.drawImage(base.c, 0, 0);
      var ph = f / N * Math.PI * 2;
      // back-wall glow
      g.fillStyle = 'rgba(255,110,40,' + (0.20 + 0.06 * Math.sin(ph)).toFixed(3) + ')'; g.fillRect(9, 30, 14, 11);
      for (x = 8; x < 24; x++) {
        var k = (x - 8) / 15;
        var en = Math.pow(Math.sin(k * Math.PI), 0.8);
        var lick = Math.sin(ph + x * 1.1) * 2 + Math.sin(ph * 2 - x * 0.7) * 1.6 + Math.sin(ph * 3 + x * 2.3) * 0.8;
        var hgt = 2 + en * (8.5 + lick);
        for (var L = 0; L < LAY.length; L++) {
          var hh = Math.round(hgt * LAY[L][0] - (L > 1 ? Math.abs(k - 0.5) * L * 2.2 : 0));
          if (hh < 1) continue;
          var top = Math.max(29, 41 - hh);
          P(g, x, top, LAY[L][1], 1, 41 - top);
        }
      }
      // detached tongues
      for (var e = 0; e < 2; e++) {
        var ex = 12 + ((hash(f + 3, e) * 8) | 0), ey = 29 + ((hash(e, f + 7) * 3) | 0);
        P(g, ex, ey, '#ff8a26'); P(g, ex, ey + 1, '#ffc23c');
      }
      // rising sparks
      for (var sp = 0; sp < 3; sp++) {
        var sy = 38 - ((f * 2 + sp * 5) % 16) * 0.6 | 0;
        var sx = 11 + sp * 4 + ((Math.sin(ph + sp * 2) * 1.5) | 0);
        if (sy >= 28) P(g, sx, sy, sy < 32 ? '#ff8a30' : '#ffe08a');
      }
      // logs silhouetted through the flame base + glowing coals
      P(g, 10, 41, '#3a1c0e', 12, 1);
      for (var c2 = 0; c2 < 7; c2++) P(g, 9 + ((hash(c2, f >> 1) * 14) | 0), 42 + (c2 & 1), (c2 + f) % 3 ? '#ff6a20' : '#ffd060');
      P(g, 10, 43, '#8a2410', 12, 1);
      for (var c3 = 0; c3 < 4; c3++) P(g, 10 + ((hash(c3 + 9, f >> 1) * 12) | 0), 43, '#ff9a30');
      // warm rim light on jambs, arch and hearth
      var a = 0.30 + 0.10 * Math.sin(ph);
      g.fillStyle = 'rgba(255,170,80,' + a.toFixed(3) + ')';
      g.fillRect(5, 28, 1, 16); g.fillRect(26, 28, 1, 16); g.fillRect(9, 25, 14, 1); g.fillRect(4, 45, 24, 1);
      g.fillStyle = 'rgba(255,150,60,' + (a * 0.5).toFixed(3) + ')';
      g.fillRect(3, 27, 2, 17); g.fillRect(27, 27, 2, 17); g.fillRect(2, 46, 28, 1);
      // mantel candle flame
      P(g, 6, 11, '#ffd36a'); P(g, 6, 10 - (f & 1), '#ff9a3c'); if (f % 3 === 0) P(g, 6, 11, '#fff3b0');
      fireFrames.push(s.c);
    }
    // warm light pool spilling onto the floor in front of the hearth
    var G = mk(64, 30), gg = G.g;
    for (y = 0; y < 30; y++) for (x = 0; x < 64; x++) {
      var dx = (x - 31.5) / 32, dy = y / 30;
      var d = dx * dx + dy * dy;
      if (d >= 1) continue;
      var v = Math.pow(1 - d, 1.6) * 4.2;
      var lv = Math.floor(v + (((x + y) & 1) ? 0.5 : 0));
      if (lv <= 0) continue;
      gg.fillStyle = 'rgba(255,' + (140 + lv * 12) + ',60,' + (lv * 0.085).toFixed(3) + ')';
      gg.fillRect(x, y, 1, 1);
    }
    fireGlow = G.c;
  }

  painters.bed = function () {
    var s = mk(16, 34), g = s.g;
    shadow(g, 1, 31, 15, 3);
    // frame
    box(g, 0, 0, 16, 32, DWOOD[0], DWOOD[1], DWOOD[2], OL);
    // headboard
    box(g, 0, 0, 16, 6, DWOOD[1], '#a0703f', DWOOD[2], OL);
    P(g, 3, 2, DWOOD[2], 2, 2); P(g, 11, 2, DWOOD[2], 2, 2);
    // mattress/sheet
    P(g, 1, 6, '#e9e3d4', 14, 25);
    // pillow
    box(g, 2, 6, 12, 6, '#f6f2ea', '#ffffff', '#cfc6b4', '#8d8270');
    P(g, 4, 8, '#e0d8c8', 8, 1);
    // quilt (patchwork)
    P(g, 1, 13, OL, 14, 1);
    var cols = ['#c0504a', '#e0a040', '#4f7fb0', '#6aa060'];
    for (var y = 14; y < 30; y += 4) for (var x = 1; x < 15; x += 4) {
      var c = cols[((x + y) / 4 | 0) % 4];
      P(g, x, y, c, 4, 4); P(g, x, y, 'rgba(255,255,255,0.25)', 4, 1); P(g, x, y + 3, 'rgba(0,0,0,0.18)', 4, 1);
    }
    P(g, 1, 13, '#f2ece0', 14, 1);
    // fold
    P(g, 1, 29, '#8a3a36', 14, 2);
    // footboard
    P(g, 0, 30, OL, 16, 2); P(g, 1, 30, DWOOD[1], 14, 1);
    return { c: s.c, ox: 0, oy: 0 };
  };

  painters.table = function () {
    var s = mk(32, 32), g = s.g;
    shadow(g, 2, 26, 30, 5);
    // legs
    P(g, 2, 18, OL, 4, 12); P(g, 3, 18, WOOD[2], 2, 11);
    P(g, 26, 18, OL, 4, 12); P(g, 27, 18, WOOD[2], 2, 11);
    // top
    box(g, 0, 4, 32, 16, WOOD[0], WOOD[1], WOOD[2], OL);
    for (var y = 7; y < 18; y += 3) P(g, 2, y, '#7a4c2a', 28, 1);
    // apron
    P(g, 0, 19, OL, 32, 4); P(g, 1, 19, WOOD[2], 30, 3); P(g, 1, 19, '#734628', 30, 1);
    // tablecloth runner
    P(g, 10, 4, '#e6dccb', 12, 16); P(g, 10, 4, '#fff', 12, 1);
    for (var x = 10; x < 22; x += 2) P(g, x, 19, '#c0504a');
    // bowl of fruit
    P(g, 12, 7, OL, 8, 5); P(g, 13, 8, '#d8d0c0', 6, 3);
    disc(g, 14, 7, 1, '#d23a30'); disc(g, 17, 7, 1, '#e8a030'); P(g, 15, 5, '#5a9a40', 2, 2);
    P(g, 13, 6, '#ff8a80');
    // mugs
    P(g, 4, 9, OL, 4, 5); P(g, 5, 10, '#4f7fb0', 2, 3); P(g, 8, 10, OL, 1, 2);
    P(g, 24, 11, OL, 4, 5); P(g, 25, 12, '#e0a040', 2, 3); P(g, 25, 12, '#f8d080');
    return { c: s.c, ox: 0, oy: 0 };
  };

  painters.chair = function () {
    var s = mk(16, 20), g = s.g;
    shadow(g, 3, 16, 12, 3);
    P(g, 3, 10, OL, 2, 9); P(g, 11, 10, OL, 2, 9);
    // back
    box(g, 3, 0, 10, 8, WOOD[0], WOOD[1], WOOD[2], OL);
    P(g, 5, 2, WOOD[2], 1, 5); P(g, 8, 2, WOOD[2], 1, 5); P(g, 10, 2, WOOD[2], 1, 5);
    // seat
    box(g, 2, 7, 12, 6, WOOD[1], '#c9925a', WOOD[2], OL);
    P(g, 4, 8, '#c0504a', 8, 3); P(g, 4, 8, '#e07a70', 8, 1);
    return { c: s.c, ox: 0, oy: -4 };
  };

  painters.bookshelf = function () {
    var s = mk(32, 32), g = s.g;
    box(g, 0, 0, 32, 32, DWOOD[0], DWOOD[1], DWOOD[2], OL);
    P(g, 0, 0, OL, 32, 1); P(g, 1, 1, '#9a6a40', 30, 2);
    var shelves = [3, 12, 21];
    var cols = ['#b04040', '#3f6fa0', '#5a9050', '#d0a040', '#7a4f9a', '#c06a30', '#2f7a7a', '#e0d0b0'];
    for (var si = 0; si < 3; si++) {
      var sy = shelves[si];
      P(g, 2, sy, '#2e1c10', 28, 8);
      var x = 2;
      while (x < 29) {
        var r = hash(x, si);
        var w = 2 + ((r * 2) | 0), h = 5 + ((hash(si, x) * 3) | 0);
        if (x + w > 30) break;
        if (r > 0.86 && x < 26) { // leaning book / gap
          P(g, x, sy + 8 - 2, OL, 4, 2); P(g, x, sy + 8 - 2, cols[(x + si) % 8], 4, 1); x += 5; continue;
        }
        var c = cols[((r * 8) | 0)];
        P(g, x, sy + 8 - h, c, w, h);
        P(g, x, sy + 8 - h, 'rgba(255,255,255,0.3)', 1, h);
        P(g, x + w - 1, sy + 8 - h, 'rgba(0,0,0,0.3)', 1, h);
        P(g, x, sy + 9 - h + 1, 'rgba(255,240,200,0.6)', w, 1);
        x += w;
      }
      P(g, 1, sy + 8, OL, 30, 1); P(g, 1, sy + 9, DWOOD[1], 30, 1);
    }
    // little plant on top shelf corner & base
    P(g, 2, 30, DWOOD[2], 28, 1);
    return { c: s.c, ox: 0, oy: -16 };
  };

  painters.stove = function () {
    var s = mk(16, 24), g = s.g;
    // pipe / hood
    P(g, 6, 0, OL, 4, 6); P(g, 7, 0, '#555a62', 2, 6); P(g, 7, 0, '#7a808a', 1, 6);
    box(g, 0, 5, 16, 19, '#3d4048', '#5c616c', '#26282e', '#121316');
    // top plates
    P(g, 1, 6, '#1e2024', 14, 3);
    disc(g, 4, 7, 1, '#50545c'); disc(g, 11, 7, 1, '#50545c');
    // pot
    P(g, 9, 3, OL, 6, 5); P(g, 10, 4, '#b04a3a', 4, 3); P(g, 10, 4, '#d8705a', 4, 1);
    // oven door with glowing window
    box(g, 2, 11, 12, 10, '#4a4e57', '#666b76', '#2a2c32', '#121316');
    P(g, 5, 14, '#121316', 6, 4); P(g, 6, 15, '#ff8a30', 4, 2); P(g, 6, 15, '#ffd06a', 2, 1);
    P(g, 4, 12, '#c9b06a', 8, 1); // handle brass
    P(g, 1, 22, '#121316', 2, 2); P(g, 13, 22, '#121316', 2, 2);
    return { c: s.c, ox: 0, oy: -8 };
  };

  painters.cupboard = function () {
    var s = mk(32, 32), g = s.g;
    box(g, 0, 0, 32, 32, '#6f8a6a', '#8eab88', '#4f664b', OL);
    P(g, 0, 0, OL, 32, 2); P(g, 1, 1, '#a6c09e', 30, 1);
    // glass upper doors with plates
    for (var d = 0; d < 2; d++) {
      var dx = 2 + d * 15;
      P(g, dx, 3, OL, 13, 12); P(g, dx + 1, 4, '#c8dce0', 11, 10);
      P(g, dx + 1, 9, '#7a5a3a', 11, 1);
      disc(g, dx + 4, 6, 2, '#f0ece2'); P(g, dx + 4, 6, '#4f7fb0');
      disc(g, dx + 8, 6, 2, '#f0ece2'); P(g, dx + 8, 6, '#c0504a');
      P(g, dx + 2, 11, '#e0a040', 3, 3); P(g, dx + 7, 11, '#f0ece2', 3, 3); P(g, dx + 7, 11, '#b8c8d0', 3, 1);
      P(g, dx + 1, 4, 'rgba(255,255,255,0.55)', 1, 6); P(g, dx + 2, 4, 'rgba(255,255,255,0.35)', 1, 3);
    }
    // counter
    P(g, 0, 16, OL, 32, 3); P(g, 1, 16, '#c9b08a', 30, 1); P(g, 1, 17, '#a08a68', 30, 1);
    // lower doors
    box(g, 2, 19, 13, 11, '#6f8a6a', '#8eab88', '#4f664b', '#3a4a38');
    box(g, 17, 19, 13, 11, '#6f8a6a', '#8eab88', '#4f664b', '#3a4a38');
    P(g, 13, 24, '#d9b45a', 1, 2); P(g, 18, 24, '#d9b45a', 1, 2);
    return { c: s.c, ox: 0, oy: -16 };
  };

  painters.plant = function () {
    var s = mk(16, 24), g = s.g;
    shadow(g, 3, 21, 11, 3);
    // pot
    P(g, 4, 15, OL, 8, 8); P(g, 3, 14, OL, 10, 3);
    P(g, 4, 15, '#c0643a', 8, 1); P(g, 5, 17, '#a85230', 6, 5); P(g, 5, 17, '#d07848', 2, 5); P(g, 10, 17, '#7a3a20', 1, 5);
    // leaves
    var L = [[8, 2, '#3f8a3a'], [4, 5, '#4f9a44'], [12, 5, '#3a7a34'], [6, 9, '#5aaa4c'], [11, 10, '#357030'], [8, 7, '#62b454'], [3, 11, '#2f6a2c'], [13, 12, '#2f6a2c']];
    for (var i = 0; i < L.length; i++) {
      var l = L[i];
      disc(g, l[0], l[1], 2, OL);
    }
    for (var j = 0; j < L.length; j++) {
      var m = L[j];
      disc(g, m[0], m[1], 1, m[2]); P(g, m[0] - 1, m[1] - 1, '#8ad070');
    }
    P(g, 8, 9, '#2a5a26', 1, 6);
    return { c: s.c, ox: 0, oy: -8 };
  };

  painters.clock_base = function () {
    var s = mk(16, 34), g = s.g;
    shadow(g, 3, 31, 12, 3);
    box(g, 3, 0, 10, 32, DWOOD[0], DWOOD[1], DWOOD[2], OL);
    P(g, 2, 0, OL, 12, 3); P(g, 3, 1, '#a0703f', 10, 1);
    // face
    disc(g, 8, 7, 4, OL); disc(g, 8, 7, 3, '#f4ecd4');
    P(g, 8, 4, OL); P(g, 8, 10, OL); P(g, 5, 7, OL); P(g, 11, 7, OL);
    // pendulum window
    P(g, 5, 13, OL, 6, 14); P(g, 6, 14, '#2a1a10', 4, 12);
    P(g, 6, 14, 'rgba(255,255,255,0.18)', 1, 12);
    P(g, 3, 29, OL, 10, 3); P(g, 4, 29, DWOOD[1], 8, 1);
    return s.c;
  };
  var clockFrames = null;
  function buildClock() {
    var base = painters.clock_base();
    clockFrames = [];
    for (var f = 0; f < 4; f++) {
      var s = mk(16, 34), g = s.g;
      g.drawImage(base, 0, 0);
      var off = [0, 1, 0, -1][f];
      P(g, 8, 14, '#c9a040', 1, 8);
      P(g, 7 + off, 21, '#e8c050', 2, 2); P(g, 7 + off, 21, '#fff0a0');
      fireFrames && 0;
      clockFrames.push(s.c);
    }
  }

  painters.chest = function () {
    var s = mk(16, 18), g = s.g;
    shadow(g, 1, 14, 15, 4);
    box(g, 1, 2, 14, 14, WOOD[0], WOOD[1], WOOD[2], OL);
    P(g, 1, 2, OL, 14, 1); P(g, 2, 3, '#c9925a', 12, 2); // lid
    P(g, 1, 7, OL, 14, 1);
    P(g, 4, 2, '#555a62', 1, 14); P(g, 11, 2, '#555a62', 1, 14);
    P(g, 4, 3, '#8a909a', 1, 4); P(g, 11, 3, '#8a909a', 1, 4);
    P(g, 6, 6, OL, 4, 4); P(g, 7, 7, '#e8c050', 2, 2); P(g, 7, 8, OL);
    return { c: s.c, ox: 0, oy: -2 };
  };

  painters.sofa = function () {
    var s = mk2(32, 24), g = s.g;
    var R = ['#7d3229', '#a9493e', '#c4614f', '#e09078'];
    softShadow(g, 2, 40, 62, 8);
    // feet
    P(g, 5, 40, OL, 5, 6); P(g, 6, 41, '#7c5030', 3, 4); P(g, 54, 40, OL, 5, 6); P(g, 55, 41, '#7c5030', 3, 4);
    // back rest
    vol(g, 4, 0, 56, 26, 6, R, OL);
    // seat cushions
    vol(g, 8, 18, 25, 20, 4, [R[0], R[2], R[3], '#f0ac94'], OL);
    vol(g, 31, 18, 25, 20, 4, [R[0], R[2], R[3], '#f0ac94'], OL);
    // front rail
    P(g, 8, 36, OL, 48, 6); P(g, 9, 37, R[1], 46, 2); P(g, 9, 39, R[0], 46, 2);
    // arms
    vol(g, 0, 10, 11, 32, 5, R, OL); vol(g, 53, 10, 11, 32, 5, R, OL);
    // throw pillow
    vol(g, 11, 8, 15, 15, 4, ['#a8802a', '#e0b040', '#f4d06a', '#fff0b0'], OL);
    P(g, 17, 14, '#a8802a', 3, 3); P(g, 18, 15, '#f4d06a');
    // knit blanket draped over the right cushion
    rr(g, 39, 17, 16, 24, 2, OL); P(g, 40, 18, '#5a8ab0', 14, 22);
    for (var y = 20; y < 39; y += 4) P(g, 40, y, '#7aaad0', 14, 2);
    P(g, 40, 18, '#9cc4e4', 14, 1); P(g, 52, 18, '#40688c', 2, 22);
    for (var x = 41; x < 54; x += 3) { P(g, x, 40, '#e8e4dc', 2, 3); P(g, x, 43, OL, 2, 1); }
    return { c: s.c, ox: 0, oy: -8 };
  };

  function paintWindow(mode, f) {
    var s = mk(16, 16), g = s.g;
    // frame
    P(g, 1, 1, OL, 14, 13);
    var sky;
    if (mode === 'night') sky = ['#0c1430', '#14204a', '#1e2c5c'];
    else if (mode === 'dusk') sky = ['#3a2c6a', '#c0607a', '#f0a060'];
    else sky = ['#5a9ae0', '#7ab4ec', '#a8d4f6'];
    P(g, 3, 3, sky[0], 10, 3); P(g, 3, 6, sky[1], 10, 3); P(g, 3, 9, sky[2], 10, 3);
    // dither between bands
    for (var x = 3; x < 13; x += 2) { P(g, x, 6, sky[0]); P(g, x + 1, 9, sky[1]); }
    if (mode === 'night') {
      var stars = [[4, 4], [11, 3], [9, 7], [5, 9], [12, 10], [7, 3]];
      for (var i = 0; i < stars.length; i++) {
        var on = (i + f) % 3 !== 0;
        P(g, stars[i][0], stars[i][1], on ? '#fff8d0' : '#7080b0');
      }
      // crescent moon
      disc(g, 9, 5, 2, '#fff4c0'); disc(g, 10, 4, 1, sky[0]); P(g, 10, 5, sky[0]);
      P(g, 8, 6, '#e8d890');
      // hills silhouette
      P(g, 3, 11, '#0a1020', 10, 1); P(g, 6, 10, '#0a1020', 4, 1);
    } else if (mode === 'dusk') {
      disc(g, 10, 10, 2, '#ffd070'); P(g, 3, 11, '#3a2440', 10, 1);
      P(g, 4, 5, '#ffc0a0', 3, 1);
    } else {
      disc(g, 11, 4, 1, '#fff6b0');
      P(g, 4, 6, '#ffffff', 4, 1); P(g, 5, 5, '#ffffff', 2, 1); P(g, 4, 7, '#dbeaf6', 4, 1);
      P(g, 3, 11, '#5aa04a', 10, 1); P(g, 7, 10, '#6ab85a', 4, 1);
    }
    // wooden frame + cross mullions
    P(g, 2, 2, '#f0e6d0', 12, 1); P(g, 2, 2, '#f0e6d0', 1, 11); P(g, 13, 2, '#cfc0a0', 1, 11);
    P(g, 2, 12, '#cfc0a0', 12, 1);
    P(g, 8, 3, '#e8dcc0', 1, 9); P(g, 3, 7, '#e8dcc0', 10, 1);
    // glass glint
    P(g, 4, 4, 'rgba(255,255,255,0.35)'); P(g, 10, 9, 'rgba(255,255,255,0.25)');
    // sill
    P(g, 0, 13, OL, 16, 3); P(g, 1, 13, '#f4ecd8', 14, 1); P(g, 1, 14, '#c8b898', 14, 1);
    // curtains
    var sw = (f === 1) ? 1 : 0; // gentle sway of the hems
    P(g, 0, 1, OL, 4, 12); P(g, 12, 1, OL, 4, 12);
    P(g, 1, 1, '#a8483e', 3, 11); P(g, 1, 1, '#d07a68', 1, 11); P(g, 3, 1, '#7a3028', 1, 8);
    P(g, 12, 1, '#a8483e', 3, 11); P(g, 12, 1, '#c86a5c', 1, 8); P(g, 14, 1, '#7a3028', 1, 11);
    P(g, 1, 8, '#e0b050', 3, 1); P(g, 12, 8, '#e0b050', 3, 1); // tie-backs
    P(g, 3 + sw, 9, '#a8483e', 1, 3); P(g, 11 - sw, 9, '#a8483e', 1, 3);
    if (mode === 'night') { g.fillStyle = 'rgba(170,200,255,0.22)'; g.fillRect(4, 3, 1, 9); g.fillRect(9, 3, 1, 9); g.fillRect(1, 13, 14, 1); }
    P(g, 0, 0, OL, 16, 2); P(g, 0, 0, '#b07a48', 16, 1); P(g, 0, 0, '#e0b050', 1, 1); P(g, 15, 0, '#e0b050', 1, 1);
    return s.c;
  }

  painters.picture = function () {
    var s = mk(16, 16), g = s.g;
    P(g, 7, 0, OL, 2, 2);
    P(g, 2, 2, OL, 12, 11);
    P(g, 3, 3, '#d9b45a', 10, 9); P(g, 3, 3, '#f0d488', 10, 1); P(g, 12, 3, '#a8802a', 1, 9); P(g, 3, 11, '#a8802a', 10, 1);
    // landscape: sky, mountain, meadow, little fox-ish flame shape (original)
    P(g, 4, 4, '#8ac0e8', 8, 3); P(g, 4, 7, '#5aa04a', 8, 4);
    P(g, 6, 5, '#7a8aa0', 3, 2); P(g, 7, 4, '#e8eef4');
    P(g, 9, 8, '#ff8a30', 2, 2); P(g, 10, 7, '#ffd06a');
    P(g, 11, 4, '#fff6b0');
    P(g, 3, 13, 'rgba(0,0,0,0.25)', 11, 1);
    return { c: s.c, ox: 0, oy: 0 };
  };

  painters.floor_lamp = function () {
    var s = mk(16, 32), g = s.g;
    shadow(g, 3, 29, 11, 3);
    // base
    P(g, 4, 28, OL, 8, 3); P(g, 5, 28, '#c9a040', 6, 1); P(g, 5, 29, '#8a6a20', 6, 1);
    // pole
    P(g, 7, 9, OL, 2, 19); P(g, 7, 9, '#d9b45a', 1, 19);
    // shade (glowing)
    P(g, 3, 2, OL, 10, 9); P(g, 4, 1, OL, 8, 1);
    P(g, 4, 2, '#f8dca0', 8, 8); P(g, 4, 2, '#fff2c8', 8, 2); P(g, 4, 8, '#e8b870', 8, 2);
    P(g, 3, 10, '#ffe8a0', 10, 1);
    for (var x = 4; x < 12; x += 2) P(g, x, 9, '#d8a050');
    return { c: s.c, ox: 0, oy: -16 };
  };

  var info = {
    fireplace: { fw: 2, fh: 1, solid: true, light: { dx: 16, dy: 2, r: 72, color: '#ff9a3c', flicker: true } },
    bed: { fw: 1, fh: 2, solid: true },
    table: { fw: 2, fh: 2, solid: true },
    chair: { fw: 1, fh: 1, solid: false },
    bookshelf: { fw: 2, fh: 1, solid: true },
    stove: { fw: 1, fh: 1, solid: true, light: { dx: 8, dy: 8, r: 20, color: '#ff8a30', flicker: true } },
    cupboard: { fw: 2, fh: 1, solid: true },
    plant: { fw: 1, fh: 1, solid: true },
    clock: { fw: 1, fh: 1, solid: true },
    chest: { fw: 1, fh: 1, solid: true },
    sofa: { fw: 2, fh: 1, solid: true },
    window: { fw: 1, fh: 1, solid: false, decor: true },
    picture: { fw: 1, fh: 1, solid: false, decor: true },
    floor_lamp: { fw: 1, fh: 1, solid: true, light: { dx: 8, dy: -10, r: 46, color: '#ffd890', flicker: false } }
  };

  var cache = {}, winCache = {};
  function isNight(h) { return h >= 19 || h < 6; }

  function draw(ctx, type, px, py, env) {
    env = env || {};
    var t = env.t || 0;
    px = px | 0; py = py | 0;
    if (type === 'fireplace') {
      if (!fireFrames) buildFire();
      var ff = Math.floor(t * 10) % fireFrames.length;
      var oc = ctx.globalCompositeOperation, oa = ctx.globalAlpha;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = oa * (0.62 + 0.14 * Math.sin(t * 9) + 0.08 * Math.sin(t * 23));
      ctx.drawImage(fireGlow, px - 16, py + 15);
      ctx.globalCompositeOperation = oc; ctx.globalAlpha = oa;
      blit(ctx, fireFrames[ff], px, py - 32);
      return;
    }
    if (type === 'clock') {
      if (!clockFrames) buildClock();
      blit(ctx, clockFrames[Math.floor(t * 2) % 4], px, py - 18);
      return;
    }
    if (type === 'window') {
      var h = env.time == null ? 12 : env.time;
      var mode = isNight(h) ? 'night' : (h >= 17 || h < 7) ? 'dusk' : 'day';
      var f = Math.floor(t * 1.5) % 3;
      var key = mode + f;
      if (!winCache[key]) winCache[key] = paintWindow(mode, f);
      if (mode !== 'dusk') { // light falling from the pane onto the wall below
        ctx.fillStyle = mode === 'night' ? 'rgba(150,185,255,0.10)' : 'rgba(255,244,200,0.12)';
        ctx.fillRect(px + 2, py + 16, 12, 7); ctx.fillRect(px + 1, py + 23, 14, 6); ctx.fillRect(px + 3, py + 16, 10, 13);
      }
      blit(ctx, winCache[key], px, py);
      return;
    }
    var p = painters[type];
    if (!p) return;
    if (!cache[type]) cache[type] = p();
    var a = cache[type];
    blit(ctx, a.c, px + a.ox, py + a.oy);
  }

  H.furniture = { info: info, draw: draw };

  // ---------------- Items ----------------
  var list = [
    { id: 'backpack', name: 'Backpack', desc: 'A patched canvas backpack. Room for snacks and secrets.' },
    { id: 'lantern', name: 'Lantern', desc: 'A brass lantern. Its flame leans toward hidden things.' },
    { id: 'teddy', name: 'Teddy', desc: 'One-eared bear. Has seen every bad dream and won.' },
    { id: 'cookbook', name: 'Cookbook', desc: "Mom's recipes, with sauce stains as bookmarks." },
    { id: 'compass', name: 'Compass', desc: 'The needle points north... mostly. Sometimes at spirits.' },
    { id: 'scarf', name: 'Scarf', desc: 'Warm red scarf, knitted by Grandma. Smells like cinnamon.' },
    { id: 'slingshot', name: 'Slingshot', desc: 'Forked oak and a strong band. For cans, never critters.' },
    { id: 'bread', name: 'Bread', desc: 'Fresh crusty loaf. Spirits find it irresistible.' },
    { id: 'map', name: 'Map', desc: 'A hand-drawn village map. Someone doodled a dragon on it.' },
    { id: 'candle', name: 'Candle', desc: 'A stubby beeswax candle. Burns a little longer than it should.' },
    { id: 'kite', name: 'Kite', desc: 'Diamond kite with a ribbon tail. Loves windy days.' },
    { id: 'mirror', name: 'Mirror', desc: 'Small hand mirror. Through it, the veil looks thinner.' }
  ];

  var icons = {};
  icons.backpack = function (g) {
    P(g, 5, 1, OL, 6, 3); P(g, 6, 2, '#7a5030', 4, 1);
    box(g, 3, 3, 10, 12, '#5a8a50', '#7aaa68', '#3a6034', OL);
    box(g, 4, 8, 8, 6, '#4a7a42', '#6a9a5a', '#2f5028', OL);
    P(g, 3, 6, OL, 10, 1); P(g, 7, 6, '#d9b45a', 2, 3); P(g, 7, 7, OL, 2, 1);
    P(g, 9, 10, '#e0a040', 2, 2);
  };
  icons.lantern = function (g) {
    P(g, 6, 0, OL, 4, 2); P(g, 7, 0, '#d9b45a', 2, 1);
    P(g, 4, 2, OL, 8, 2); P(g, 5, 2, '#c9a040', 6, 1);
    P(g, 4, 4, OL, 8, 9); P(g, 5, 4, '#fff0b0', 6, 8); P(g, 6, 6, '#ffb43c', 4, 5); P(g, 7, 7, '#fff8d0', 2, 3);
    P(g, 5, 4, '#a8802a', 1, 8); P(g, 10, 4, '#a8802a', 1, 8);
    P(g, 3, 13, OL, 10, 2); P(g, 4, 13, '#c9a040', 8, 1);
  };
  icons.teddy = function (g) {
    disc(g, 4, 3, 2, OL); disc(g, 12, 3, 2, OL); disc(g, 12, 3, 1, '#a8703c');
    disc(g, 8, 5, 4, OL); disc(g, 8, 5, 3, '#a8703c');
    disc(g, 8, 11, 4, OL); disc(g, 8, 11, 3, '#9a6434'); disc(g, 8, 11, 1, '#d8a878');
    P(g, 6, 4, OL); P(g, 10, 4, OL); P(g, 7, 6, '#e8c8a0', 3, 2); P(g, 8, 6, OL);
    P(g, 6, 3, '#c89060'); P(g, 5, 9, '#c0504a', 6, 1);
    P(g, 3, 14, OL, 3, 2); P(g, 10, 14, OL, 3, 2);
  };
  icons.cookbook = function (g) {
    box(g, 2, 2, 12, 13, '#c0504a', '#e07a70', '#8a3030', OL);
    P(g, 3, 13, '#f0ece0', 10, 1); P(g, 4, 2, '#8a3030', 1, 12);
    P(g, 6, 5, '#f0ece0', 6, 5); disc(g, 9, 7, 1, '#e0a040'); P(g, 7, 8, '#8a5a34', 4, 1);
    P(g, 11, 0, '#e0a040', 1, 4);
  };
  icons.compass = function (g) {
    disc(g, 8, 8, 6, OL); disc(g, 8, 8, 5, '#c9a040'); disc(g, 8, 8, 4, '#f4ecd4');
    P(g, 7, 1, OL, 2, 2);
    P(g, 8, 4, '#c0303a', 1, 4); P(g, 7, 5, '#c0303a'); P(g, 8, 8, '#3a4a6a', 1, 4); P(g, 9, 10, '#3a4a6a');
    P(g, 8, 8, OL); P(g, 6, 4, '#fff');
  };
  icons.scarf = function (g) {
    P(g, 2, 3, OL, 12, 5); P(g, 3, 4, '#c0403a', 10, 3); P(g, 3, 4, '#e06a5a', 10, 1);
    P(g, 9, 7, OL, 5, 8); P(g, 10, 7, '#c0403a', 3, 7); P(g, 10, 7, '#e06a5a', 1, 7);
    for (var y = 5; y < 13; y += 3) P(g, 10, y + 2, '#f0d080', 3, 1);
    P(g, 10, 14, '#f0d080', 1, 2); P(g, 12, 14, '#f0d080', 1, 2);
  };
  icons.slingshot = function (g) {
    P(g, 7, 9, OL, 3, 7); P(g, 8, 9, '#a8703c', 1, 6);
    P(g, 3, 2, OL, 3, 9); P(g, 10, 2, OL, 3, 9); P(g, 4, 3, '#a8703c', 1, 7); P(g, 11, 3, '#a8703c', 1, 7);
    P(g, 5, 9, OL, 7, 2); P(g, 6, 9, '#8a5a30', 5, 1);
    P(g, 4, 3, '#7a6a5a', 1, 1); P(g, 5, 4, '#c08060', 6, 1); P(g, 7, 4, '#5a3a2a', 3, 2);
  };
  icons.bread = function (g) {
    P(g, 1, 7, OL, 14, 7); P(g, 2, 6, OL, 12, 1); P(g, 4, 5, OL, 8, 1);
    P(g, 2, 7, '#c88a40', 12, 6); P(g, 4, 6, '#e0a858', 8, 2); P(g, 2, 12, '#9a6024', 12, 1);
    P(g, 5, 7, '#f4d090', 1, 2); P(g, 8, 7, '#f4d090', 1, 2); P(g, 11, 7, '#f4d090', 1, 2);
  };
  icons.map = function (g) {
    P(g, 1, 3, OL, 14, 11);
    P(g, 2, 4, '#f0e2bc', 4, 9); P(g, 6, 4, '#e0d0a4', 4, 9); P(g, 10, 4, '#f0e2bc', 4, 9);
    P(g, 3, 6, '#5a9a50', 2, 2); P(g, 7, 9, '#4f7fb0', 4, 1); P(g, 11, 6, '#8a5a34', 2, 1);
    P(g, 4, 10, '#c0303a'); P(g, 11, 9, '#c0303a', 1, 1); P(g, 12, 10, '#c0303a');
  };
  icons.candle = function (g) {
    P(g, 7, 1, '#ffd36a', 2, 2); P(g, 7, 0, '#ff9a3c'); P(g, 8, 3, OL);
    P(g, 5, 4, OL, 6, 9); P(g, 6, 4, '#f4e8c0', 4, 8); P(g, 6, 4, '#fff8e0', 1, 8); P(g, 9, 5, '#d8c890', 1, 7);
    P(g, 9, 6, '#f4e8c0', 2, 2);
    P(g, 2, 12, OL, 12, 3); P(g, 3, 12, '#c9a040', 10, 1); P(g, 3, 13, '#8a6a20', 10, 1);
  };
  icons.kite = function (g) {
    for (var i = 0; i < 6; i++) { P(g, 8 - i, 1 + i, OL, 1 + i * 2, 1); P(g, 8 - i, 12 - i, OL, 1 + i * 2, 1); }
    for (var j = 1; j < 6; j++) {
      P(g, 9 - j, 1 + j, '#e0a040', j, 1); P(g, 8, 1 + j, '#4f7fb0', j, 1);
      P(g, 9 - j, 12 - j, '#4f7fb0', j, 1); P(g, 8, 12 - j, '#e0a040', j, 1);
    }
    P(g, 3, 6, '#e0a040', 5, 1); P(g, 8, 6, '#4f7fb0', 5, 1);
    P(g, 8, 13, OL); P(g, 9, 14, '#c0303a'); P(g, 10, 15, OL); P(g, 11, 14, '#c0303a');
  };
  icons.mirror = function (g) {
    disc(g, 8, 6, 5, OL); disc(g, 8, 6, 4, '#c9a040'); disc(g, 8, 6, 3, '#a8d4f0');
    P(g, 6, 4, '#fff', 1, 2); P(g, 7, 3, '#e8f4ff'); P(g, 9, 7, '#8a7ad0'); P(g, 10, 8, '#c8b8ff');
    P(g, 7, 11, OL, 3, 5); P(g, 8, 11, '#a8703c', 1, 4);
  };

  var iconCache = {};
  function drawItem(ctx, id, x, y) {
    if (!iconCache[id]) {
      var fn = icons[id];
      if (!fn) return;
      var s = mk(16, 16);
      fn(s.g);
      iconCache[id] = s.c;
    }
    ctx.drawImage(iconCache[id], x | 0, y | 0);
  }

  H.items = { list: list, draw: drawItem };
})();
