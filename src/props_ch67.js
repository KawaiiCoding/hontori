window.H = window.H || {};
/*
  props_ch67.js: the outdoor pieces of chapters 6 and 7 (Stonehollow, the Drum Circle, the Old Quarry, Cinderreach,
  the brazier court of the Ember Crucible), painted in code in the style of props_ch45.js (1x pixels, soft
  coloured outline).

  API: adds to H.propsOutdoor.info / H.propsOutdoor.draw (footprint in tiles; art may rise above it):
    drum                   1x1  a tall hand drum: a wooden body, a pale hide head, red lacing and two iron hoops
    drum_big               2x1  a big round drum on a timber stand, its hide face turned to the path, brass tacks
    brazier                1x1  a cold iron brazier on three legs on a stone foot, grey ash in the bowl (art 1x2)
    brazier_lit            1x1  the same brazier burning: glowing coals and a flame (three frames, chosen by time)
    carving_stone          2x1  an upright carved slab: a person and a hontori side by side, cut into the stone
    carving_stone_flame    2x1  an upright carved slab: a mountain and a small flame climbing it, up the west side,
                                over the top and down the east (four flame marks in old red pigment: the order)
    school_touch_earth     1x1  a small cairn of flat stones with an amber stone on a post (a small school's touch, earth)
    school_touch_fire      1x1  a small iron fire basket burning on a post (a small school's touch, fire)
  The cave mouth of the Old Quarry and the great schools' halls are buildings (src/buildings.js).
  Every prop is still except brazier_lit and school_touch_fire, whose flames change frame with the time;
  their light is the separate lighting pass.
  Sheets (H.sheets, group 'outdoor'): key 'p67:<type>' for each picture, 'p67:<type>_<frame>' for the flames.
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

  /* ---------- palettes (the world's own ramps, plus hide, ember and carved stone) ---------- */
  var WOOD = ['#2e1c14', '#4a2e1c', '#6a4426', '#8e5f33', '#b37f45', '#d6a466'];
  var RWOOD = ['#2a1210', '#4e2018', '#743424', '#9a4a30', '#c06a44'];
  var STONE = ['#2a2b3a', '#424659', '#5f6579', '#82889d', '#a9afc0', '#d2d6e0'];
  var WSTONE = ['#2e2824', '#4a4038', '#6a5e52', '#8c8072', '#b0a494', '#d4cabc'];
  var IRON = ['#15161e', '#262a3a', '#3b4058', '#59607e', '#868fb0'];
  var HIDE = ['#8a7050', '#b89a70', '#dcc49a', '#f0e0c0', '#fff4dc'];
  var BRASS = ['#6a4a14', '#a87a24', '#e0b048', '#fff0a0'];
  var AMBER = ['#6a3010', '#a85a18', '#e08a28', '#ffc860', '#fff0b0'];
  var EMBER = ['#5a1410', '#a8301c', '#e0602a', '#ffa040', '#ffd870', '#fff6c8'];
  var ASH = ['#2a2628', '#46403e', '#686060', '#8a8280'];
  var LACE = ['#7a1e1a', '#b83a2e', '#e0604a'];
  var MOSS = ['#2a4a26', '#3e6a34', '#5a8c44'];

  /* ================= DRUMS ================= */
  function drum() {
    var g = G(16, 25), x, y;
    /* the body: a gently bulging wooden barrel with staves */
    for (y = 6; y < 21; y++) {
      var t = (y - 6) / 14, bul = Math.round(Math.sin(t * Math.PI) * 1.2), x0 = 2 - bul, x1 = 13 + bul;
      for (x = x0; x <= x1; x++) {
        var nx = (x - x0 + 0.5) / (x1 - x0 + 1) * 2 - 1, v = clamp(0.64 - nx * 0.45 - nx * nx * 0.35, 0, 0.999);
        if ((x - x0) % 4 === 3) v -= 0.18;
        sp(g, x, y, pick(RWOOD, clamp(v, 0, 0.999), x, y));
      }
    }
    /* two iron hoops */
    [8, 18].forEach(function (hy) { for (x = 1; x <= 14; x++) { var nx = (x - 7.5) / 7; sp(g, x, hy, pick(IRON, clamp(0.75 - nx * 0.5, 0, 0.999), x, hy)); } });
    /* the hide head on top (an ellipse seen from above) and its rim */
    for (y = 2; y <= 7; y++) for (x = 1; x <= 14; x++) {
      var ex = (x - 7.5) / 6.8, ey = (y - 4.5) / 2.8, q = ex * ex + ey * ey;
      if (q > 1) continue;
      sp(g, x, y, q > 0.62 ? (y > 4 ? RWOOD[1] : RWOOD[4]) : pick(HIDE, clamp(0.8 - ey * 0.25 - ex * 0.15, 0, 0.999), x, y));
    }
    sp(g, 5, 3, HIDE[4]); sp(g, 6, 3, HIDE[4]);
    /* red lacing in a zigzag from the rim down to the lower hoop */
    for (var k = 0; k < 4; k++) {
      var lx = 3 + k * 3;
      line(g, lx, 8, lx + 1.5, 18, LACE[1]);
      line(g, lx + 3, 8, lx + 1.5, 18, LACE[k === 3 ? 0 : 2]);
    }
    /* short feet */
    rect(g, 3, 21, 2, 3, WOOD[1]); rect(g, 11, 21, 2, 3, WOOD[1]); rect(g, 7, 21, 2, 2, WOOD[2]);
    outline(g);
    return { c: toCanvas(g), ox: 0, oy: -9 };
  }
  function drumBig() {
    var g = G(32, 31), x, y, cx = 16, cy = 13, R = 11;
    /* the timber stand behind and below: two splayed legs and a cross bar */
    line(g, 6, 18, 2, 29, WOOD[2]); line(g, 7, 18, 3, 29, WOOD[3]); line(g, 8, 18, 4, 29, WOOD[1]);
    line(g, 26, 18, 30, 29, WOOD[1]); line(g, 25, 18, 29, 29, WOOD[3]); line(g, 24, 18, 28, 29, WOOD[2]);
    rect(g, 4, 24, 24, 2, WOOD[2]); rect(g, 4, 24, 24, 1, WOOD[4]);
    /* the body seen just from the side: a thick wooden ring behind the face */
    for (y = -R - 1; y <= R + 1; y++) for (x = -R - 1; x <= R + 3; x++) {
      var q = (x - 2) * (x - 2) + y * y;
      if (q > (R + 1) * (R + 1)) continue;
      sp(g, cx + x, cy + y, pick(RWOOD, clamp(0.55 - y / R * 0.3 - (x - 2) / R * 0.15, 0, 0.999), cx + x, cy + y));
    }
    /* the hide face */
    for (y = -R; y <= R; y++) for (x = -R; x <= R; x++) {
      var d = Math.sqrt(x * x + y * y);
      if (d > R + 0.3) continue;
      var v = d > R - 1.2 ? 0.15 : clamp(0.78 - y / R * 0.22 - x / R * 0.14 - (d / R) * 0.12, 0, 0.999);
      sp(g, cx + x, cy + y, d > R - 1.2 ? RWOOD[1] : pick(HIDE, v, cx + x, cy + y));
    }
    /* a painted ring and a mountain mark in the middle of the face (the earth school's sign) */
    for (var a = 0; a < 40; a++) { var an = a / 40 * Math.PI * 2; sp(g, cx + Math.cos(an) * 6.5, cy + Math.sin(an) * 6.5, LACE[1]); }
    line(g, cx - 3, cy + 2, cx, cy - 2, '#7a4a24'); line(g, cx, cy - 2, cx + 3, cy + 2, '#7a4a24'); line(g, cx - 3, cy + 2, cx + 3, cy + 2, '#7a4a24');
    /* brass tacks around the rim */
    for (a = 0; a < 14; a++) { var b = a / 14 * Math.PI * 2; sp(g, cx + Math.cos(b) * (R - 0.6), cy + Math.sin(b) * (R - 0.6), a % 2 ? BRASS[2] : BRASS[3]); }
    sp(g, cx - 5, cy - 6, HIDE[4]); sp(g, cx - 4, cy - 7, HIDE[4]);
    outline(g);
    return { c: toCanvas(g), ox: 0, oy: -15 };
  }

  /* ================= BRAZIERS ================= */
  /* the cold brazier: stone foot, three iron legs, a wide iron bowl with grey ash */
  function brazierBase(g, lit) {
    var x, y;
    /* the stone foot */
    cyl(g, 1, 24, 14, 4, STONE); rect(g, 1, 24, 14, 1, STONE[4]);
    /* the bowl: a wide iron basin, darker below, a bright rim */
    for (y = 10; y < 16; y++) {
      var t = (y - 10) / 5, half = 7.5 - t * t * 3.5;
      for (x = Math.ceil(7.5 - half); x <= Math.floor(7.5 + half); x++) {
        var nx = (x - 7.5) / 7.5, v = clamp(0.66 - nx * 0.42 - t * 0.3, 0, 0.999);
        sp(g, x, y, pick(IRON, v, x, y));
      }
    }
    rect(g, 0, 10, 16, 1, IRON[4]); rect(g, 0, 11, 16, 1, IRON[2]);
    for (x = 2; x < 15; x += 3) sp(g, x, 13, IRON[4]);
    /* what lies in the bowl, seen over the rim */
    for (x = 1; x < 15; x++) {
      var hgt = 1 + Math.round(hash(x, 3, lit ? 5 : 2) * 1.6);
      for (y = 0; y < hgt; y++) {
        var c = lit ? EMBER[clamp(Math.round(1 + hash(x, y, 9) * 3 + (y === hgt - 1 ? 0 : -1)), 0, 5)] : ASH[clamp(Math.round(1 + hash(x, y, 4) * 2.4 + (y === hgt - 1 ? 0.6 : 0)), 0, 3)];
        sp(g, x, 10 - y, c);
      }
    }
    if (!lit) { sp(g, 5, 8, ASH[3]); sp(g, 10, 9, '#3a2a26'); }
  }
  /* three thin iron legs between the bowl and the foot, drawn after the outline so the gaps stay open */
  function brazierLegs(g) {
    line(g, 3, 16, 1, 23, IRON[1]); line(g, 4, 16, 2, 23, IRON[3]);
    line(g, 12, 16, 14, 23, IRON[1]); line(g, 11, 16, 13, 23, IRON[2]);
    rect(g, 7, 16, 1, 8, IRON[3]); rect(g, 8, 16, 1, 8, IRON[1]);
  }
  /* a flame: tongues of fire rising from a line of coals; frame 0..2 changes the tongues' heights and sway */
  function flame(g, x0, x1, base, top, f) {
    var w = x1 - x0 + 1, mid = (x0 + x1) / 2;
    for (var x = x0; x <= x1; x++) {
      var u = (x - mid) / (w / 2), hgt = (base - top) * (1 - u * u * 0.7) * (0.72 + 0.28 * Math.sin(x * 1.9 + f * 2.1));
      for (var y = 0; y < hgt; y++) {
        var k = y / hgt, sw = Math.round(Math.sin(y * 0.6 + f * 2.3) * k * 1.2);
        var c = k > 0.78 ? EMBER[2] : k > 0.5 ? EMBER[3] : k > 0.22 ? EMBER[4] : EMBER[5];
        if (Math.abs(u) > 0.7 && k < 0.5) c = EMBER[3];
        sp(g, x + sw, base - y, c);
      }
    }
  }
  function brazier(lit, f) {
    var g = G(16, 28);
    brazierBase(g, lit);
    outline(g);
    brazierLegs(g);
    /* the fire stands over the outline so the flame keeps its soft edge */
    if (lit) { flame(g, 3, 12, 9, 0, f); sp(g, 7, 1 + f, EMBER[3]); }
    return { c: toCanvas(g), ox: 0, oy: -12 };
  }

  /* ================= CARVED STONES ================= */
  /* an upright slab with a rounded top and a mossy foot; carve(g) cuts its picture in */
  function slab(g, carve) {
    var x, y;
    for (y = 1; y < 29; y++) for (x = 1; x < 31; x++) {
      if (y < 5) { var u = (x - 15.5) / 14.5, top = 5 - Math.sqrt(Math.max(0, 1 - u * u * u * u)) * 4; if (y < top) continue; }
      var nx = (x - 15.5) / 15, v = clamp(0.62 - nx * 0.3 - (y / 29) * 0.2 + (hash(x >> 1, y >> 1, 3) - 0.5) * 0.16, 0, 0.999);
      sp(g, x, y, pick(WSTONE, v, x, y));
    }
    /* the face: a smoothed panel inside a cut border */
    for (y = 6; y < 25; y++) for (x = 4; x < 28; x++) sp(g, x, y, (x + y) % 7 === 0 ? WSTONE[3] : WSTONE[4]);
    for (y = 5; y < 26; y++) { sp(g, 3, y, WSTONE[1]); sp(g, 28, y, WSTONE[5]); }
    for (x = 3; x <= 28; x++) { sp(g, x, 5, WSTONE[1]); sp(g, x, 25, WSTONE[5]); }
    carve(g);
    /* moss and grass at the foot */
    for (x = 0; x < 32; x++) if (hash(x, 1, 11) > 0.45) { sp(g, x, 28, MOSS[x % 3]); if (hash(x, 2, 11) > 0.6) sp(g, x, 27, MOSS[2]); }
  }
  /* a carved stroke: the cut is dark, its lower right lip catches the light */
  function cut(g, pts) {
    var key = {};
    pts.forEach(function (p) { key[p[0] + ',' + p[1]] = 1; });
    pts.forEach(function (p) { if (!key[(p[0] + 1) + ',' + (p[1] + 1)]) sp(g, p[0] + 1, p[1] + 1, '#f0e8dc'); });
    pts.forEach(function (p) { sp(g, p[0], p[1], WSTONE[1]); });
  }
  function strokes(list) {
    var P = [];
    list.forEach(function (l) { var n = Math.max(Math.abs(l[2] - l[0]), Math.abs(l[3] - l[1]), 1); for (var i = 0; i <= n; i++) P.push([Math.round(l[0] + (l[2] - l[0]) * i / n), Math.round(l[1] + (l[3] - l[1]) * i / n)]); });
    return P;
  }
  function ring(cx, cy, r) {
    var P = [];
    for (var a = 0; a < 24; a++) { var b = a / 24 * Math.PI * 2; P.push([Math.round(cx + Math.cos(b) * r), Math.round(cy + Math.sin(b) * r)]); }
    return P;
  }
  function carvingStone() {
    var g = G(32, 30);
    slab(g, function (g2) {
      /* the person: a round head, a dress, an arm held out over the hontori */
      var P = ring(11, 9, 2).concat(strokes([[11, 12, 8, 21], [11, 12, 14, 21], [8, 21, 14, 21], [10, 21, 10, 23], [12, 21, 12, 23], [12, 14, 17, 15]]));
      /* the hontori: a round body, two pointed ears, a tail */
      P = P.concat(ring(20, 19, 3), strokes([[18, 16, 17, 13], [17, 13, 19, 15], [22, 16, 23, 13], [23, 13, 21, 15], [23, 20, 26, 17]]));
      cut(g2, P);
      sp(g2, 19, 18, WSTONE[1]); sp(g2, 21, 18, WSTONE[1]);
    });
    outline(g);
    return { c: toCanvas(g), ox: 0, oy: -14 };
  }
  function carvingStoneFlame() {
    var g = G(32, 30);
    slab(g, function (g2) {
      /* the mountain: two slopes meeting at a peak over a ground line */
      cut(g2, strokes([[5, 22, 15, 8], [15, 8, 16, 8], [16, 8, 26, 22], [5, 22, 26, 22]]));
      /* the four flames of the order, in old red pigment: low west, high west, high east, low east, each with its count of dots */
      [[8, 17], [12, 11], [19, 11], [23, 17]].forEach(function (p, k) {
        sp(g2, p[0], p[1], EMBER[1]); sp(g2, p[0], p[1] - 1, EMBER[2]); sp(g2, p[0], p[1] - 2, EMBER[3]); sp(g2, p[0] - 1, p[1], EMBER[1]); sp(g2, p[0] + 1, p[1], EMBER[1]); sp(g2, p[0] - 1, p[1] - 1, EMBER[1]); sp(g2, p[0] + 1, p[1] - 1, EMBER[1]);
        for (var d = 0; d <= k; d++) sp(g2, p[0] - 1 + d * 2 - (k > 1 ? 1 : 0), p[1] + 2, '#8a2a1a');
      });
      /* small arrows of the climb between them */
      [[10, 13], [15, 6], [16, 6], [21, 13]].forEach(function (p) { sp(g2, p[0], p[1], '#8a3a24'); });
    });
    outline(g);
    return { c: toCanvas(g), ox: 0, oy: -14 };
  }

  /* ================= SMALL SCHOOL TOUCHES ================= */
  function postBase(g) {
    cyl(g, 6, 16, 4, 26, WOOD);
    cyl(g, 4, 40, 8, 3, STONE); rect(g, 4, 40, 8, 1, STONE[4]);
  }
  function touchEarth() {
    var g = G(16, 44);
    postBase(g);
    rect(g, 4, 15, 8, 2, WOOD[2]); rect(g, 4, 15, 8, 1, WOOD[4]);
    /* a small cairn: three flat stones, each smaller, and an amber stone on top */
    ball(g, 8, 12, 6, 2, WSTONE, 0.25, 0.05, 2);
    ball(g, 7, 8, 5, 2, STONE, 0.25, 0.08, 5);
    ball(g, 8, 5, 3, 1, WSTONE, 0.2, 0.12, 8);
    ball(g, 8, 2, 2, 2, AMBER, 0, 0.12);
    sp(g, 7, 1, AMBER[4]);
    outline(g);
    return { c: toCanvas(g), ox: 0, oy: -28 };
  }
  function touchFire(f) {
    var g = G(16, 44), x, y;
    postBase(g);
    /* an iron fire basket: a bowl of bars on the post top */
    for (y = 9; y < 16; y++) {
      var half = 6 - (y - 9) * 0.55;
      for (x = Math.ceil(8 - half); x <= Math.floor(7 + half); x++) {
        var bar = (x - 1) % 3 === 0 || y === 9 || y === 15;
        if (bar) sp(g, x, y, (x < 8 ? IRON[3] : IRON[1]));
        else sp(g, x, y, EMBER[y < 12 ? 3 : 2]);
      }
    }
    rect(g, 2, 9, 12, 1, IRON[4]);
    outline(g);
    flame(g, 4, 11, 8, 0, f);
    return { c: toCanvas(g), ox: 0, oy: -28 };
  }

  /* ---------- registry: one picture per type (flames: one per frame) ---------- */
  var FRAMES = 3;
  var PAINT = {
    drum: drum,
    drum_big: drumBig,
    brazier: function () { return brazier(false, 0); },
    carving_stone: carvingStone,
    carving_stone_flame: carvingStoneFlame,
    school_touch_earth: touchEarth
  };
  for (var fr = 0; fr < FRAMES; fr++) {
    PAINT['brazier_lit_' + fr] = (function (f) { return function () { return brazier(true, f); }; })(fr);
    PAINT['school_touch_fire_' + fr] = (function (f) { return function () { return touchFire(f); }; })(fr);
  }
  /* the types drawn by frame: the picture of each frame is '<type>_<frame>' */
  var ANIM = { brazier_lit: 1, school_touch_fire: 1 };
  /* anchors of each picture (its painter's own ox, oy), so a baked picture is placed without painting it */
  var AT = { drum: [0, -9], drum_big: [0, -15], brazier: [0, -12], carving_stone: [0, -14], carving_stone_flame: [0, -14], school_touch_earth: [0, -28] };
  for (fr = 0; fr < FRAMES; fr++) { AT['brazier_lit_' + fr] = [0, -12]; AT['school_touch_fire_' + fr] = [0, -28]; }
  var INFO = {
    drum: { fw: 1, fh: 1, solid: true, still: true },
    drum_big: { fw: 2, fh: 1, solid: true, still: true },
    brazier: { fw: 1, fh: 1, solid: true, still: true },
    brazier_lit: { fw: 1, fh: 1, solid: true, still: false, light: { dx: 8, dy: -8, r: 46, color: '#ffa050', flicker: true } },
    carving_stone: { fw: 2, fh: 1, solid: true, still: true },
    carving_stone_flame: { fw: 2, fh: 1, solid: true, still: true },
    school_touch_earth: { fw: 1, fh: 1, solid: true, still: true },
    school_touch_fire: { fw: 1, fh: 1, solid: true, still: false, light: { dx: 8, dy: -22, r: 26, color: '#ffa050', flicker: true } }
  };
  var cache = {}, KEY = {}, PF = {};
  function get(t) {
    var s = cache[t];
    if (s) return s;
    try { s = PAINT[t](); } catch (e) { s = null; }
    if (!s) return null;
    cache[t] = s;
    if (s.ox !== AT[t][0] || s.oy !== AT[t][1]) { AT[t] = [s.ox, s.oy]; try { console.warn('props_ch67: anchor of ' + t + ' changed; update AT'); } catch (e) { /* no console */ } }
    if (H.sheets && H.sheets.recording) H.sheets.rec('outdoor', KEY[t], s.c);
    return s;
  }
  function paintOf(t) { return function () { var s = get(t); return s && s.c; }; }
  Object.keys(PAINT).forEach(function (t) { KEY[t] = 'p67:' + t; PF[t] = paintOf(t); });
  /* a flame's frame: about five a second, each picture placed at a slightly different moment by its place */
  function frameOf(type, px, env) {
    var t = (env && env.t) || 0;
    return type + '_' + (((Math.floor(t * 5 + px * 0.13) % FRAMES) + FRAMES) % FRAMES);
  }

  var base = H.propsOutdoor || { info: {}, draw: function () {} };
  var oldDraw = base.draw;
  for (var k in INFO) base.info[k] = INFO[k];
  base.draw = function (ctx, type, px, py, env) {
    var t = ANIM[type] ? frameOf(type, px, env) : type;
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
