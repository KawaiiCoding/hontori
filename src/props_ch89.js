window.H = window.H || {};
/*
  props_ch89.js: the outdoor pieces of chapters 8 and 9 (Duskmere and Hollow Moon's crater, the Golden Gate, Goldmere,
  the Mirror Gardens, Vael's garden, Halo Court), painted in code in the style of props_ch67.js (1x pixels, soft
  coloured outline).

  API: adds to H.propsOutdoor.info / H.propsOutdoor.draw (footprint in tiles; art may rise above it):
    golden_gate            2x2  the golden gate shut: two barred gold leaves under a gold arch set with seven ring
                                sockets, white stone pillars either side (solid)
    golden_gate_open       2x2  the same arch and pillars with the leaves swung back (not solid: the way through)
    garden_jar             1x1  a tall glass jar sealed with grey closed-eye wax, a hontori curled asleep inside
                                (three sleepers, chosen by the jar's place)
    garden_jar_empty       1x1  the same jar open and empty
    garden_mirror_0..3     1x1  a mirror on a stand, its face turned: 0 '/' facing down-right, 1 '\' facing down-left,
                                2 '/' facing up-left (its back shows), 3 '\' facing up-right (its back shows);
                                a two-sided mirror puzzle uses 0 for '/' and 1 for '\'
    sun_lamp               1x1  a stone pedestal with a sun-stone burning in a gold cage (the gardens' light source)
    watch_lamp             1x1  a grey iron post with a hooded Council lantern, cold pale light (the watchers' posts)
    fountain               2x2  a tiered stone fountain with a gold sun on top, water falling (three frames)
    banner_pole            1x1  a tall pole with a white and gold halo banner
    bracket_board          2x1  the tournament bracket on a standing board: four names, two, one, a gold halo
    arena_stand            3x2  three tiers of wooden benches with white cloth and gold trim
    school_touch_dark      1x1  a crescent moon in a ring on a post (a small school's touch, dark)
    school_touch_light     1x1  a gold sun disc on a post (a small school's touch, light)
  The great schools' halls school_dark and school_light are buildings (src/buildings.js).
  Every prop is still except fountain, whose water changes frame with the time; lights are the lighting pass.
  Sheets (H.sheets, group 'outdoor'): key 'p89:<picture>'.
*/
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

  /* ---------- pixel grid helpers (as in props_ch45.js) ---------- */
  function G(w, h) { var d = new Array(w * h); for (var i = 0; i < d.length; i++) d[i] = null; return { w: w, h: h, d: d }; }
  function sp(g, x, y, c) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= g.w || y >= g.h) return; g.d[y * g.w + x] = c; }
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
      if (tex) v += (hash(X >> 1, Y >> 1, seed) - 0.5) * tex;
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
  function line(g, x0, y0, x1, y1, c) {
    var n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (var i = 0; i <= n; i++) sp(g, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c);
  }
  var DK = {};
  function deep(col) {
    if (DK[col]) return DK[col];
    var m = /^#([0-9a-f]{6})$/i.exec(col || ''), out = OUT;
    if (m) { var n = parseInt(m[1], 16), r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255;
      out = '#' + [r * 0.38, gg * 0.42, b * 0.46].map(function (v) { v = Math.round(v); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
    return (DK[col] = out);
  }
  function outline(g) {
    var add = [];
    for (var y = 0; y < g.h; y++) for (var x = 0; x < g.w; x++) {
      if (gp(g, x, y)) continue;
      var nb = gp(g, x - 1, y) || gp(g, x + 1, y) || gp(g, x, y - 1) || gp(g, x, y + 1);
      if (nb) add.push(x, y, nb);
    }
    for (var i = 0; i < add.length; i += 3) sp(g, add[i], add[i + 1], deep(add[i + 2]));
  }
  function newCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function toCanvas(g) {
    var c = newCanvas(g.w, g.h), x = c.getContext('2d');
    for (var j = 0; j < g.h; j++) for (var i = 0; i < g.w; i++) {
      var col = g.d[j * g.w + i]; if (!col) continue;
      x.fillStyle = col; x.fillRect(i, j, 1, 1);
    }
    return c;
  }

  /* ---------- palettes ---------- */
  var WOOD = ['#2e1c14', '#4a2e1c', '#6a4426', '#8e5f33', '#b37f45', '#d6a466'];
  var STONE = ['#2a2b3a', '#424659', '#5f6579', '#82889d', '#a9afc0', '#d2d6e0'];
  var MARBLE = ['#6a6660', '#a8a49c', '#d0ccc4', '#ecead4', '#fbfaf4'];
  var IRON = ['#15161e', '#262a3a', '#3b4058', '#59607e', '#868fb0'];
  var GOLD = ['#5a3a10', '#9a6a1a', '#c8962a', '#e8c050', '#fff0a0'];
  var SPARK = ['#c89a20', '#ffd84a', '#ffee90', '#fffbe0'];
  var GLASS = ['#7a98aa', '#aac6d4', '#cfe2ea', '#eef8fb'];
  var WAX = ['#4a4a56', '#7a7a88', '#a4a4b2', '#c4c4ce'];
  var WATER = ['#1e4a7a', '#2c6aa8', '#4a90d0', '#8ac4f0', '#e0f4ff'];
  var MOON = ['#3a3460', '#6a5aa8', '#a898e8', '#e8e4ff'];
  var CLOTH = ['#b8b0a0', '#e8e4d8', '#fbfaf4'];

  /* ================= THE GOLDEN GATE ================= */
  function goldenGate(open) {
    var g = G(48, 64), x, y;
    /* white stone pillars with gold caps */
    [0, 38].forEach(function (px) {
      cyl(g, px, 16, 10, 48, MARBLE);
      for (y = 22; y < 62; y += 8) rect(g, px, y, 10, 1, MARBLE[1]);
      rect(g, px - 1, 14, 12, 3, GOLD[2]); rect(g, px - 1, 14, 12, 1, GOLD[4]);
      ball(g, px + 5, 10, 3, 3, GOLD, 0, 0.1);
      rect(g, px - 1, 60, 12, 4, MARBLE[1]); rect(g, px - 1, 60, 12, 1, MARBLE[3]);
    });
    /* the arch: a gold band from pillar to pillar, rising in the middle */
    function archTop(xx) { var u = (xx - 23.5) / 14; return Math.round(18 - Math.sqrt(Math.max(0, 1 - u * u)) * 8); }
    for (x = 10; x < 38; x++) {
      var t = archTop(x);
      for (y = t; y < t + 6; y++) sp(g, x, y, y === t ? GOLD[4] : y === t + 5 ? GOLD[0] : pick(GOLD, clamp(0.75 - (y - t) / 10, 0, 0.999), x, y));
    }
    /* seven ring sockets along the arch */
    for (var k = 0; k < 7; k++) {
      var sx = 12 + Math.round(k * 23 / 6), sy = archTop(sx) + 2;
      sp(g, sx, sy, '#2a1a08'); sp(g, sx + 1, sy, '#2a1a08'); sp(g, sx, sy + 1, '#2a1a08'); sp(g, sx + 1, sy + 1, '#2a1a08');
      sp(g, sx, sy - 1, GOLD[4]);
    }
    if (!open) {
      /* the two leaves: gold bars, rails, a sun medallion where they meet */
      for (x = 10; x < 38; x++) {
        var top = archTop(x) + 6;
        for (y = top; y < 62; y++) {
          var bar = (x - 10) % 3 === 0 || y === 34 || y === 35 || y === 52 || y === 53 || y === top;
          if (bar) sp(g, x, y, (x - 10) % 3 === 0 ? pick(GOLD, clamp(0.7 - (x - 10) / 60, 0, 0.999), x, y) : GOLD[3]);
        }
      }
      rect(g, 23, 24, 2, 38, GOLD[1]);
      ball(g, 24, 43, 5, 5, GOLD, 0, 0.1);
      for (k = 0; k < 8; k++) { var an = k * Math.PI / 4; sp(g, 24 + Math.round(Math.cos(an) * 7), 43 + Math.round(Math.sin(an) * 7), GOLD[3]); }
      ball(g, 24, 43, 2, 2, SPARK, 0, 0.1);
    } else {
      /* the leaves swung back: seen edge on against the inner faces of the pillars */
      [[10, 1], [35, -1]].forEach(function (L) {
        for (y = 24; y < 62; y++) { sp(g, L[0], y, GOLD[3]); sp(g, L[0] + 1, y, GOLD[2]); sp(g, L[0] + 2, y, GOLD[1]); }
        rect(g, L[0], 34, 3, 2, GOLD[4]); rect(g, L[0], 52, 3, 2, GOLD[4]);
      });
    }
    outline(g);
    return { c: toCanvas(g), ox: -8, oy: -32 };
  }

  /* ================= VAEL'S JARS ================= */
  var SLEEPERS = [['#e07a3a', '#f4b070', '#a84a24'], ['#4a90d0', '#9ad0f0', '#2a5a8a'], ['#6ab048', '#b0e080', '#3a7a2a']];
  function gardenJar(v, empty) {
    var g = G(16, 25), x, y;
    /* the glass body: round shoulders, a straight side, a rounded foot */
    for (y = 7; y < 24; y++) {
      var hw = y < 10 ? 4 + (y - 7) * 1.3 : y > 21 ? 6.5 - (y - 21) * 0.8 : 6.5;
      for (x = Math.ceil(7.5 - hw); x <= Math.floor(7.5 + hw); x++) {
        var nx = (x - 7.5) / 7, val = clamp(0.55 - nx * 0.3 - nx * nx * 0.2, 0, 0.999);
        sp(g, x, y, pick(GLASS, val, x, y));
      }
    }
    rect(g, 5, 4, 6, 4, GLASS[1]); rect(g, 5, 4, 2, 4, GLASS[3]);
    if (!empty) {
      /* the sleeper: curled round, a closed eye, a tail around it, all seen through the glass */
      var S = SLEEPERS[v];
      for (y = 13; y < 22; y++) for (x = 3; x < 13; x++) {
        var u = (x - 7.5) / 5, w = (y - 17.5) / 4.2;
        if (u * u + w * w > 1) continue;
        sp(g, x, y, u + w < -0.6 ? S[1] : u + w > 0.7 ? S[2] : S[0]);
      }
      [[4, 13], [3, 12], [11, 13], [12, 12]].forEach(function (p) { sp(g, p[0], p[1], S[0]); });
      sp(g, 6, 16, '#2a1c2e'); sp(g, 7, 17, '#2a1c2e'); sp(g, 8, 16, '#2a1c2e');
      for (x = 4; x < 12; x++) sp(g, x, 21, S[2]);
      /* the glass over it: a cool sheen and the bright edge */
      for (y = 9; y < 23; y++) { sp(g, 3, y, GLASS[3]); if ((y & 1) === 0) sp(g, 4, y, GLASS[2]); }
      /* the grey wax seal over the neck, dripping, with a closed eye pressed in */
      rect(g, 4, 1, 8, 5, WAX[2]); rect(g, 4, 1, 8, 1, WAX[3]); rect(g, 10, 2, 2, 4, WAX[1]);
      sp(g, 4, 6, WAX[2]); sp(g, 4, 7, WAX[1]); sp(g, 11, 6, WAX[1]); sp(g, 9, 6, WAX[2]);
      sp(g, 6, 3, WAX[0]); sp(g, 7, 4, WAX[0]); sp(g, 8, 4, WAX[0]); sp(g, 9, 3, WAX[0]);
    } else {
      for (y = 9; y < 23; y++) sp(g, 3, y, GLASS[3]);
      rect(g, 4, 3, 8, 1, GLASS[3]);
    }
    outline(g);
    return { c: toCanvas(g), ox: 0, oy: -9 };
  }

  /* ================= GARDEN MIRRORS AND THE SUN LAMP ================= */
  function gardenMirror(f) {
    var g = G(18, 30), x, y;
    /* the stand: a post on crossed feet */
    rect(g, 8, 18, 2, 9, WOOD[2]); rect(g, 8, 18, 1, 9, WOOD[4]);
    rect(g, 4, 26, 10, 2, WOOD[2]); rect(g, 4, 26, 10, 1, WOOD[4]); rect(g, 7, 28, 4, 2, WOOD[1]);
    /* the plate: leaning one way or the other; its near end sits lower */
    var slash = f === 0 || f === 2, front = f < 2;
    for (x = 2; x < 16; x++) {
      var t = (x - 2) / 13, dy = Math.round(slash ? (1 - t) * 4 : t * 4);
      for (y = 3 + dy; y < 15 + dy; y++) {
        var edge = x === 2 || x === 15 || y === 3 + dy || y === 14 + dy, col;
        if (edge) col = GOLD[y === 3 + dy ? 4 : 2];
        else if (front) {
          var d = (x + y) % 9;
          col = d === 0 || d === 1 ? '#ffffff' : pick(['#8aa8c8', '#b8d0e4', '#dceaf4'], clamp(0.75 - (y - dy) / 20 + (slash ? -t : t) * 0.2, 0, 0.999), x, y);
        } else col = (x % 4 === 0) ? WOOD[1] : WOOD[3];
        sp(g, x, y, col);
      }
    }
    if (!front) for (x = 3; x < 15; x++) { var t2 = (x - 2) / 13, d2 = Math.round(slash ? (1 - t2) * 4 : t2 * 4); sp(g, x, 8 + d2, WOOD[2]); sp(g, x, 9 + d2, WOOD[2]); }
    outline(g);
    return { c: toCanvas(g), ox: -1, oy: -14 };
  }
  function sunLamp() {
    var g = G(16, 30), x, y;
    cyl(g, 3, 18, 10, 11, MARBLE); rect(g, 2, 17, 12, 2, MARBLE[3]); rect(g, 2, 28, 12, 2, MARBLE[1]);
    rect(g, 4, 21, 8, 1, GOLD[3]);
    /* the gold cage and the sun-stone in it */
    ball(g, 8, 10, 4, 4, SPARK, 0, 0.15);
    for (y = 3; y < 17; y++) { sp(g, 3, y, GOLD[2]); sp(g, 12, y, GOLD[1]); if (y % 2) { sp(g, 6, y, GOLD[3]); sp(g, 9, y, GOLD[2]); } }
    rect(g, 3, 2, 10, 1, GOLD[4]); rect(g, 3, 16, 10, 1, GOLD[2]); rect(g, 6, 0, 4, 2, GOLD[3]);
    outline(g);
    return { c: toCanvas(g), ox: 0, oy: -14 };
  }
  function watchLamp() {
    var g = G(16, 44), y;
    /* a grey iron post on a stone foot */
    cyl(g, 7, 12, 2, 28, IRON); cyl(g, 4, 39, 8, 4, STONE); rect(g, 4, 39, 8, 1, STONE[4]);
    rect(g, 6, 24, 4, 2, IRON[3]);
    /* a grey wax plate with a closed eye on the post */
    rect(g, 5, 28, 6, 4, WAX[2]); rect(g, 5, 28, 6, 1, WAX[3]); sp(g, 6, 30, WAX[0]); sp(g, 7, 31, WAX[0]); sp(g, 8, 31, WAX[0]); sp(g, 9, 30, WAX[0]);
    /* the hooded lantern, cold pale light behind its glass */
    rect(g, 3, 4, 10, 2, IRON[3]); rect(g, 4, 2, 8, 2, IRON[2]); rect(g, 6, 0, 4, 2, IRON[1]);
    for (y = 6; y < 12; y++) { sp(g, 4, y, IRON[2]); sp(g, 11, y, IRON[1]); for (var x = 5; x < 11; x++) sp(g, x, y, y < 8 ? '#f4f8ff' : y < 10 ? '#d8e4fa' : '#b8c8e8'); }
    rect(g, 4, 12, 8, 1, IRON[3]);
    outline(g);
    return { c: toCanvas(g), ox: 0, oy: -28 };
  }

  /* ================= THE PLAZA FOUNTAIN ================= */
  function fountain(f) {
    var g = G(32, 46), x, y;
    /* the lower basin: a wide stone ring holding water */
    for (y = 30; y < 45; y++) for (x = 1; x < 31; x++) {
      var u = (x - 15.5) / 15, w = (y - 37) / 7.5, q = u * u + w * w;
      if (q > 1) continue;
      var inner = (x - 15.5) * (x - 15.5) / (12.5 * 12.5) + (y - 36) * (y - 36) / (5 * 5);
      if (inner < 1) sp(g, x, y, pick(WATER, clamp(0.6 - w * 0.2 + (((x + y + f * 2) % 7 === 0) ? 0.35 : 0), 0, 0.999), x, y));
      else sp(g, x, y, pick(MARBLE, clamp(0.75 - w * 0.4 - u * 0.2, 0, 0.999), x, y));
    }
    /* the column and the upper bowl */
    cyl(g, 13, 14, 6, 22, MARBLE);
    for (y = 12; y < 18; y++) { var hw = 9 - (y - 12) * 1.2; for (x = Math.ceil(15.5 - hw); x <= Math.floor(15.5 + hw); x++) sp(g, x, y, pick(MARBLE, clamp(0.8 - (x - 15.5) / 18 - (y - 12) / 12, 0, 0.999), x, y)); }
    rect(g, 7, 12, 18, 1, WATER[3]);
    /* the gold sun on top */
    ball(g, 16, 6, 3, 3, GOLD, 0, 0.12);
    for (var k = 0; k < 8; k++) { var an = k * Math.PI / 4 + f * 0; sp(g, 16 + Math.round(Math.cos(an) * 5), 6 + Math.round(Math.sin(an) * 5), GOLD[3]); }
    rect(g, 15, 9, 2, 3, GOLD[2]);
    outline(g);
    /* water spilling from the upper bowl into the basin (over the outline, so it stays soft) */
    [7, 24].forEach(function (sx, i) {
      for (y = 13; y < 33; y++) {
        var drift = (sx < 16 ? -1 : 1) * Math.floor((y - 13) / 8);
        if (((y + f * 2 + i) % 5) === 0) continue;
        sp(g, sx + drift, y, y % 3 ? WATER[3] : WATER[4]);
      }
    });
    [[5, 33], [26, 33], [8, 34], [23, 34]].forEach(function (p, i) { if ((i + f) % 2) sp(g, p[0], p[1], WATER[4]); });
    return { c: toCanvas(g), ox: 0, oy: -14 };
  }

  /* ================= TOURNAMENT PIECES ================= */
  function bannerPole() {
    var g = G(16, 50), y;
    cyl(g, 7, 4, 2, 42, WOOD); cyl(g, 4, 45, 8, 4, STONE); rect(g, 4, 45, 8, 1, STONE[4]);
    ball(g, 8, 2, 2, 2, GOLD, 0, 0.12);
    rect(g, 2, 6, 12, 1, WOOD[3]);
    /* the banner: white with a gold border, a gold halo in the middle, a swallowtail end */
    for (y = 7; y < 34; y++) for (var x = 3; x < 13; x++) {
      if (y > 30 && x > 5 && x < 10 && y - 30 > Math.abs(x - 7.5) * -1 + 3) continue;
      var edge = x === 3 || x === 12 || y === 7;
      sp(g, x, y, edge ? GOLD[3] : x < 5 ? CLOTH[2] : x > 10 ? CLOTH[0] : CLOTH[1]);
    }
    for (var a = 0; a < 20; a++) { var t = a / 20 * Math.PI * 2; sp(g, 8 + Math.round(Math.cos(t) * 3), 17 + Math.round(Math.sin(t) * 3), GOLD[2]); }
    sp(g, 8, 17, GOLD[4]);
    outline(g);
    return { c: toCanvas(g), ox: 0, oy: -34 };
  }
  function bracketBoard() {
    var g = G(32, 36), x, y;
    rect(g, 4, 20, 2, 16, WOOD[2]); rect(g, 26, 20, 2, 16, WOOD[1]);
    /* the board: a wooden frame, cream paper */
    rect(g, 1, 2, 30, 22, WOOD[3]); rect(g, 1, 2, 30, 1, WOOD[5]); rect(g, 1, 23, 30, 1, WOOD[1]);
    rect(g, 3, 4, 26, 18, '#f6eed8'); rect(g, 3, 4, 26, 1, '#fffaf0');
    rect(g, 10, 0, 12, 3, GOLD[2]); rect(g, 10, 0, 12, 1, GOLD[4]);
    /* four names, two, one: the lines of the bracket */
    var ink = '#5a4a3a';
    [6, 9, 15, 18].forEach(function (yy) { rect(g, 5, yy, 5, 1, ink); });
    [[10, 6, 9], [10, 15, 18]].forEach(function (b) { rect(g, b[0], b[1], 1, b[2] - b[1] + 1, ink); rect(g, 10, Math.round((b[1] + b[2]) / 2), 4, 1, ink); });
    rect(g, 14, 7, 4, 1, '#3a6ab0'); rect(g, 14, 16, 4, 1, '#c8443a');
    rect(g, 18, 7, 1, 10, ink); rect(g, 18, 12, 4, 1, ink);
    for (var a = 0; a < 16; a++) { var t = a / 16 * Math.PI * 2; sp(g, 25 + Math.round(Math.cos(t) * 2.5), 12 + Math.round(Math.sin(t) * 1.5), GOLD[2]); }
    outline(g);
    return { c: toCanvas(g), ox: 0, oy: -20 };
  }
  function arenaStand() {
    var g = G(48, 42), x, y;
    /* three tiers, back to front: a bench plank on a white cloth riser with a gold trim */
    [[4, 0], [16, 1], [28, 2]].forEach(function (tier) {
      var ty = tier[0];
      rect(g, 0, ty, 48, 3, WOOD[3]); rect(g, 0, ty, 48, 1, WOOD[5]); rect(g, 0, ty + 3, 48, 1, WOOD[1]);
      var shade = [CLOTH[0], CLOTH[1], CLOTH[2]][tier[1]];
      for (y = ty + 4; y < ty + 12; y++) for (x = 0; x < 48; x++) sp(g, x, y, y === ty + 4 ? GOLD[3] : y === ty + 11 ? '#8a8478' : (x % 12 === 0 ? CLOTH[0] : x > 42 ? CLOTH[0] : shade));
      /* gold scallops along each cloth */
      for (x = 3; x < 48; x += 6) { sp(g, x, ty + 5, GOLD[2]); sp(g, x + 1, ty + 6, GOLD[2]); sp(g, x + 2, ty + 5, GOLD[2]); }
    });
    /* corner posts with gold knobs */
    [0, 46].forEach(function (px) { rect(g, px, 0, 2, 40, WOOD[2]); sp(g, px, 0, GOLD[4]); sp(g, px + 1, 0, GOLD[2]); });
    rect(g, 0, 40, 48, 2, WOOD[1]);
        outline(g);
    return { c: toCanvas(g), ox: 0, oy: -10 };
  }

  /* ================= SMALL SCHOOL TOUCHES ================= */
  function postBase(g) {
    cyl(g, 6, 16, 4, 26, WOOD);
    cyl(g, 4, 40, 8, 3, STONE); rect(g, 4, 40, 8, 1, STONE[4]);
  }
  function touchDark() {
    var g = G(16, 44);
    postBase(g);
    /* a dark iron ring with a pale crescent moon hung in it */
    for (var a = 0; a < 40; a++) { var t = a / 40 * Math.PI * 2; sp(g, 8 + Math.round(Math.cos(t) * 6), 8 + Math.round(Math.sin(t) * 6), IRON[2]); }
    for (var y = -4; y <= 4; y++) for (var x = -4; x <= 4; x++) {
      var q = x * x + y * y, q2 = (x - 2) * (x - 2) + (y + 1) * (y + 1);
      if (q <= 17 && q2 > 12) sp(g, 8 + x, 8 + y, MOON[x + y < 0 ? 3 : 2]);
    }
    rect(g, 7, 14, 2, 3, IRON[2]);
    outline(g);
    return { c: toCanvas(g), ox: 0, oy: -28 };
  }
  function touchLight() {
    var g = G(16, 44);
    postBase(g);
    /* a polished gold sun disc with short rays */
    ball(g, 8, 8, 4, 4, GOLD, 0, 0.15);
    for (var k = 0; k < 8; k++) { var an = k * Math.PI / 4; sp(g, 8 + Math.round(Math.cos(an) * 6), 8 + Math.round(Math.sin(an) * 6), GOLD[3]); sp(g, 8 + Math.round(Math.cos(an) * 7), 8 + Math.round(Math.sin(an) * 7), GOLD[2]); }
    sp(g, 7, 6, '#ffffff');
    rect(g, 7, 13, 2, 3, GOLD[1]);
    outline(g);
    return { c: toCanvas(g), ox: 0, oy: -28 };
  }

  /* ---------- registry ---------- */
  var FRAMES = 3;
  var PAINT = {
    golden_gate: function () { return goldenGate(false); },
    golden_gate_open: function () { return goldenGate(true); },
    garden_jar_empty: function () { return gardenJar(0, true); },
    sun_lamp: sunLamp,
    watch_lamp: watchLamp,
    banner_pole: bannerPole,
    bracket_board: bracketBoard,
    arena_stand: arenaStand,
    school_touch_dark: touchDark,
    school_touch_light: touchLight
  };
  var k;
  for (k = 0; k < 3; k++) PAINT['garden_jar_' + k] = (function (v) { return function () { return gardenJar(v, false); }; })(k);
  for (k = 0; k < 4; k++) PAINT['garden_mirror_' + k] = (function (v) { return function () { return gardenMirror(v); }; })(k);
  for (k = 0; k < FRAMES; k++) PAINT['fountain_' + k] = (function (v) { return function () { return fountain(v); }; })(k);
  /* anchors of each picture (its painter's own ox, oy), so a baked picture is placed without painting it */
  var AT = { golden_gate: [-8, -32], golden_gate_open: [-8, -32], garden_jar_empty: [0, -9], sun_lamp: [0, -14], watch_lamp: [0, -28],
    banner_pole: [0, -34], bracket_board: [0, -20], arena_stand: [0, -10], school_touch_dark: [0, -28], school_touch_light: [0, -28] };
  for (k = 0; k < 3; k++) AT['garden_jar_' + k] = [0, -9];
  for (k = 0; k < 4; k++) AT['garden_mirror_' + k] = [-1, -14];
  for (k = 0; k < FRAMES; k++) AT['fountain_' + k] = [0, -14];
  var INFO = {
    golden_gate: { fw: 2, fh: 2, solid: true, still: true },
    golden_gate_open: { fw: 2, fh: 2, solid: false, still: true },
    garden_jar: { fw: 1, fh: 1, solid: true, still: true },
    garden_jar_empty: { fw: 1, fh: 1, solid: true, still: true },
    sun_lamp: { fw: 1, fh: 1, solid: true, still: true, light: { dx: 8, dy: -4, r: 50, color: '#fff0a0', flicker: false } },
    watch_lamp: { fw: 1, fh: 1, solid: true, still: true, light: { dx: 8, dy: -19, r: 44, color: '#dde6ff', flicker: false } },
    fountain: { fw: 2, fh: 2, solid: true, still: false },
    banner_pole: { fw: 1, fh: 1, solid: true, still: true },
    bracket_board: { fw: 2, fh: 1, solid: true, still: true },
    arena_stand: { fw: 3, fh: 2, solid: true, still: true },
    school_touch_dark: { fw: 1, fh: 1, solid: true, still: true },
    school_touch_light: { fw: 1, fh: 1, solid: true, still: true }
  };
  for (k = 0; k < 4; k++) INFO['garden_mirror_' + k] = { fw: 1, fh: 1, solid: true, still: true };
  var cache = {}, KEY = {}, PF = {};
  function get(t) {
    var s = cache[t];
    if (s) return s;
    try { s = PAINT[t](); } catch (e) { s = null; }
    if (!s) return null;
    cache[t] = s;
    if (s.ox !== AT[t][0] || s.oy !== AT[t][1]) { AT[t] = [s.ox, s.oy]; try { console.warn('props_ch89: anchor of ' + t + ' changed; update AT'); } catch (e) { /* no console */ } }
    if (H.sheets && H.sheets.recording) H.sheets.rec('outdoor', KEY[t], s.c);
    return s;
  }
  function paintOf(t) { return function () { var s = get(t); return s && s.c; }; }
  Object.keys(PAINT).forEach(function (t) { KEY[t] = 'p89:' + t; PF[t] = paintOf(t); });
  /* which picture a type shows here and now: the jar's sleeper by its place, the fountain's frame by the time */
  function pictureOf(type, px, py, env) {
    if (type === 'garden_jar') return 'garden_jar_' + Math.min(2, Math.floor(hash(Math.floor(px / 16), Math.floor(py / 16), 5) * 3));
    if (type === 'fountain') { var t = (env && env.t) || 0; return 'fountain_' + ((Math.floor(t * 4) % FRAMES) + FRAMES) % FRAMES; }
    return type;
  }

  var base = H.propsOutdoor || { info: {}, draw: function () {} };
  var oldDraw = base.draw;
  for (var key in INFO) base.info[key] = INFO[key];
  base.draw = function (ctx, type, px, py, env) {
    var t = pictureOf(type, px, py, env);
    if (!PAINT[t]) return oldDraw.call(base, ctx, type, px, py, env);
    var x = Math.round(px + AT[t][0]), y = Math.round(py + AT[t][1]);
    if (H.sheets) { H.sheets.draw(ctx, KEY[t], x, y, PF[t]); return; }
    var s = get(t);
    if (s) ctx.drawImage(s.c, x, y);
  };
  H.propsOutdoor = base;

  if (H.sheets) {
    try {
      H.sheets.enumerate('outdoor', function () { for (var t in PAINT) get(t); });
      H.sheets.onLoad(function (group) {
        if (group !== 'outdoor') return;
        for (var t in cache) if (H.sheets.has(KEY[t])) delete cache[t];
      });
    } catch (e) { /* sheets are optional */ }
  }
})();
