window.H = window.H || {};
/*
  props_ch45.js: the outdoor pieces of chapters 4 and 5 (Tidewell, the Sunken Stair, Coilhaven, Sparkmoor),
  painted in code in the style of props_outdoor.js and outdoor_plus.js (1x pixels, soft coloured outline).

  API: adds to H.propsOutdoor.info / H.propsOutdoor.draw (footprint in tiles; art may rise above it):
    spirit_bell            2x2  the drowned bronze bell, green with patina, half sunk in sand and weed
    spirit_bell_raised     2x2  the bell hung again in its timber frame, the bronze cleaned
    tide_wheel_0..2        1x1  a wooden valve wheel on a stone post (art 1x2), turned to its first, second
                                and third notch (the red handle points at a different brass notch); tide_wheel = _0
    lightning_rod          1x1  a tall iron rod with a copper tip on a stone foot (art 1x2.5)
    lightning_rod_lit      1x1  the same rod with power in it: the copper wire and tip lit, a spark at the tip
    lamp_jar               1x1  a street lamp whose glass is a jar with a small trapped spark inside, sealed
                                with grey closed-eye wax (art 1x3, like the lamp)
    lamp_jar_open          1x1  the same lamp with its lid off and the jar empty
    boat_hull_bow          2x2  the front of a moored boat: a raised prow, a coil of rope, the mast stub
    boat_hull_cabin        2x2  the middle: a small cabin, its door on the left tile, a round window on the right
    boat_hull_stern        2x2  the back: a rounded stern, the tiller and a lantern post
                                (bow, cabin, stern side by side, left to right, make one boat six tiles long)
    school_touch_water     1x1  a small lantern boat on a post (a small school's touch, water)
    school_touch_electric  1x1  a spark coil on a post (a small school's touch, electric)
  and to H.buildings (once buildings.js has made it):
    house_copper           5x4  house_a with a green-copper roof (Coilhaven); day and night like house_a
  Every prop here is still (one picture, never animated); lights are the separate lighting pass.
  Sheets (H.sheets, group 'outdoor'): key 'p45:<type>' for each prop, 'p45:house_copperD' / 'p45:house_copperN'.
*/
(function () {
  'use strict';
  var H = window.H, T = 16;
  var OUT = '#1b1522';
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function bay(x, y) { return (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16; }
  function hash(x, y, s) {
    var h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul((s | 0) + 7, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ---------- pixel grid helpers (as in outdoor_plus.js) ---------- */
  function G(w, h) { var d = new Array(w * h); for (var i = 0; i < d.length; i++) d[i] = null; return { w: w, h: h, d: d }; }
  function sp(g, x, y, c) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= g.w || y >= g.h) return; g.d[y * g.w + x] = c; }
  function gp(g, x, y) { if (x < 0 || y < 0 || x >= g.w || y >= g.h) return null; return g.d[y * g.w + x]; }
  function rect(g, x, y, w, h, c) { for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) sp(g, x + i, y + j, c); }
  function pick(r, v, x, y) {
    var i = Math.floor(v * r.length + bay(x, y) - 0.5);
    return r[i < 0 ? 0 : i >= r.length ? r.length - 1 : i];
  }
  /* a ramp step without dithering, for broad smooth metal (the bell) and plank walls */
  function step(r, v) { var i = Math.floor(v * r.length); return r[i < 0 ? 0 : i >= r.length ? r.length - 1 : i]; }
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

  /* ---------- palettes (the world's own ramps, plus bronze, patina, copper and sand) ---------- */
  var WOOD = ['#2e1c14', '#4a2e1c', '#6a4426', '#8e5f33', '#b37f45', '#d6a466'];
  var DWOOD = ['#1e1a20', '#2e2a30', '#45383a', '#5e4a44', '#7a6250'];
  var STONE = ['#2a2b3a', '#424659', '#5f6579', '#82889d', '#a9afc0', '#d2d6e0'];
  var IRON = ['#15161e', '#262a3a', '#3b4058', '#59607e', '#868fb0'];
  var BRONZE = ['#2e2014', '#523a1e', '#7e5a2c', '#a8803e', '#d0a858', '#f2d48c'];
  var PATINA = ['#1c3632', '#2a564a', '#3f7c68', '#5ea488', '#8ccaa8'];
  var COPPER = ['#3a1a10', '#6a3420', '#9a5430', '#c87a44', '#e8a868', '#ffd4a4'];
  var SAND = ['#6a5a3a', '#9a8458', '#c4ac78', '#e0cc98', '#f4e4b8'];
  var WEED = ['#1e3a24', '#2f5a30', '#4a8040', '#6aa850'];
  var BRASS = ['#6a4a14', '#a87a24', '#e0b048', '#fff0a0'];
  var GLASS = ['#4a6478', '#7a98aa', '#aac6d4', '#dcecf2'];
  var SPARK = ['#c89a20', '#ffd84a', '#ffee90', '#fffbe0'];
  var RED = ['#64202a', '#a83a34', '#d85a48'];
  var WAX = ['#4a4a56', '#7a7a88', '#a4a4b2'];

  /* ================= THE SPIRIT BELL ================= */
  /* half width of the bell at row y of H rows: a rounded crown, gently widening sides, a flared lip */
  function bellW(y, Hh) {
    var t = y / (Hh - 1), w = 5.2 + 2.6 * t + (t > 0.72 ? Math.pow((t - 0.72) / 0.28, 1.6) * 4.6 : 0);
    if (y < 3) w *= Math.sqrt(1 - Math.pow((3 - y) / 3.6, 2));
    return w;
  }
  /* the bell body: cx centre column, y0 top row, Hh rows, patina share, shear = x shift per row (a tilt) */
  function bellBody(g, cx, y0, Hh, patina, shear, seed) {
    var lip = Hh - 4, band = 5;
    for (var y = 0; y < Hh; y++) {
      var hw = bellW(y, Hh), sx = cx + (y - Hh) * shear;
      for (var x = Math.floor(-hw); x <= Math.ceil(hw); x++) {
        if (Math.abs(x) > hw) continue;
        var nx = x / (hw + 0.5);
        var v = 0.66 - nx * 0.5 - nx * nx * 0.3 - (y / Hh) * 0.08;
        if (y === band || y === lip) v += 0.28;
        if (y === band + 1 || y === lip + 1) v -= 0.22;
        if (y >= Hh - 2) v -= 0.15;
        var X = sx + x, Y = y0 + y;
        /* patina: soft patches, thicker under the bands and towards the lip, and drips down from the bands */
        var n = hash(X >> 2, Y >> 2, seed) * 0.75 + hash(X >> 1, Y >> 1, seed + 3) * 0.25;
        var drip = hash(X, 1, seed + 9) > 0.62 && ((y > band && y < band + 5 + hash(X, 2, seed) * 6) || y > lip);
        var green = n < patina || (drip && patina > 0.2);
        sp(g, X, Y, step(green ? PATINA : BRONZE, clamp(v + (green ? 0.05 : 0), 0, 0.999)));
      }
    }
    /* the crown loop on top */
    var tx = cx - Hh * shear;
    for (var a = 0; a < 12; a++) {
      var ang = Math.PI * a / 11;
      sp(g, tx + Math.cos(ang) * 3, y0 - 1 - Math.sin(ang) * 3.2, a < 6 ? BRONZE[4] : BRONZE[2]);
      sp(g, tx + Math.cos(ang) * 2, y0 - 1 - Math.sin(ang) * 2.2, a < 6 ? BRONZE[3] : BRONZE[1]);
    }
    /* a raised ring of the old script around the waist: small dots */
    for (var d = -3; d <= 3; d += 2) sp(g, cx + d + (band + 4 - Hh) * shear, y0 + band + 4, patina > 0.5 ? PATINA[4] : BRONZE[5]);
  }
  function spiritBell() {
    var g = G(36, 38), Hh = 24, cx = 18, y0 = 6;
    bellBody(g, cx, y0, Hh, 0.6, 0.07, 4);
    /* barnacles and a crust of shell on the lower bell */
    [[12, 22], [14, 25], [22, 24], [24, 20], [19, 27], [10, 26], [25, 26]].forEach(function (p, i) {
      sp(g, p[0], p[1], '#d8d0c0'); sp(g, p[0] + 1, p[1], i % 2 ? '#a8a090' : '#c8c0b0'); sp(g, p[0], p[1] + 1, '#8a8478');
    });
    /* weed hanging from the shoulder and the lip */
    [[13, 9, 7], [22, 10, 9], [16, 20, 6], [25, 19, 7]].forEach(function (s, i) {
      for (var k = 0; k < s[2]; k++) sp(g, s[0] + Math.round(Math.sin(k * 0.9 + i) * 0.8), s[1] + k, WEED[1 + ((k + i) % 3)]);
    });
    /* the sand mound it has sunk into */
    for (var y = 0; y < 9; y++) for (var x = 0; x < 36; x++) {
      var nx = (x - 17.5) / 17.5, ny = (y - 9) / 9, q = nx * nx + ny * ny * 0.9;
      if (q > 1 || y + 27 > 37) continue;
      var v = 0.85 - y / 9 * 0.45 - Math.abs(nx) * 0.2 + (hash(x >> 1, y, 7) - 0.5) * 0.25;
      sp(g, x, 28 + y, pick(SAND, clamp(v, 0, 0.999), x, 28 + y));
    }
    /* ripples in the sand, a shell and weed tufts at the foot */
    [[5, 32, 6], [24, 33, 7], [13, 35, 5]].forEach(function (r) { for (var k = 0; k < r[2]; k++) sp(g, r[0] + k, r[1], SAND[1]); });
    sp(g, 6, 30, '#f0c8c0'); sp(g, 7, 30, '#e0a8a0'); sp(g, 6, 31, '#c88a84');
    [[3, 30], [30, 31], [28, 29]].forEach(function (p) { sp(g, p[0], p[1], WEED[2]); sp(g, p[0], p[1] - 1, WEED[3]); sp(g, p[0] + 1, p[1] - 2, WEED[2]); });
    outline(g);
    return { c: toCanvas(g), ox: -2, oy: -6 };
  }
  function spiritBellRaised() {
    var g = G(36, 58);
    /* two timber posts on stone feet and a beam across */
    cyl(g, 2, 8, 4, 44, WOOD); cyl(g, 30, 8, 4, 44, WOOD);
    cyl(g, 1, 50, 6, 6, STONE); cyl(g, 29, 50, 6, 6, STONE);
    rect(g, 1, 50, 6, 1, STONE[4]); rect(g, 29, 50, 6, 1, STONE[4]);
    for (var x = 0; x < 36; x++) { var v = 0.7 - Math.abs(x - 18) / 36 * 0.3; for (var y = 3; y < 9; y++) sp(g, x, y, pick(WOOD, clamp(v + (y === 3 ? 0.3 : y === 8 ? -0.4 : 0), 0, 0.999), x, y)); }
    rect(g, 0, 2, 36, 1, WOOD[4]);
    /* braces */
    for (var k = 0; k < 6; k++) { sp(g, 6 + k, 9 + k, WOOD[2]); sp(g, 7 + k, 9 + k, WOOD[3]); sp(g, 29 - k, 9 + k, WOOD[2]); sp(g, 28 - k, 9 + k, WOOD[1]); }
    /* iron hanger */
    rect(g, 16, 9, 4, 3, IRON[2]); rect(g, 16, 9, 4, 1, IRON[4]);
    /* the bell, upright and cleaned: the bronze shines, only old patina in the seams */
    bellBody(g, 18, 16, 26, 0.16, 0, 4);
    /* the clapper under the lip */
    rect(g, 17, 42, 2, 2, IRON[2]); ball(g, 18, 45, 2, 2, IRON, 0, 0.1);
    /* the bell rope, tied off on the right post */
    for (var r = 0; r < 14; r++) sp(g, 22 + Math.round(r * 0.55), 30 + r, r % 2 ? '#c8b080' : '#a89060');
    sp(g, 30, 44, '#c8b080'); sp(g, 30, 45, '#a89060');
    outline(g);
    return { c: toCanvas(g), ox: -2, oy: -26 };
  }

  /* ================= TIDE WHEEL ================= */
  function tideWheel(state) {
    var g = G(18, 32), cx = 9, cy = 9, R = 7;
    /* the stone post */
    cyl(g, 4, 9, 10, 18, STONE);
    rect(g, 4, 9, 10, 1, STONE[5]);
    for (var j = 13; j < 27; j += 5) for (var i = 4; i < 14; i++) sp(g, i, j, STONE[1]);
    sp(g, 6, 17, '#4a7a3a'); sp(g, 7, 18, '#6a9a40'); sp(g, 12, 23, '#4a7a3a');
    cyl(g, 3, 26, 12, 4, STONE, -0.1); rect(g, 3, 26, 12, 1, STONE[4]);
    /* a brass plate on the post with three pips: as many are lit as the notch the wheel is turned to */
    rect(g, 5, 19, 9, 4, BRASS[1]); rect(g, 6, 20, 7, 2, '#2a1e10');
    for (var pp = 0; pp < 3; pp++) { sp(g, 6 + pp * 3, 20, pp <= state ? '#fff4b0' : '#5a4a2a'); sp(g, 6 + pp * 3, 21, pp <= state ? '#ffd84a' : '#4a3a20'); }
    /* three brass notches on the post top: where the red handle can point */
    var notch = [-2.2, -Math.PI / 2, -0.94];
    notch.forEach(function (a) { sp(g, cx + Math.cos(a) * (R + 1.6), cy + Math.sin(a) * (R + 1.6), BRASS[2]); });
    /* the wheel: rim, six spokes, brass hub; turned a further 40 degrees at each notch */
    var turn = state * 0.7;
    for (var y = -R - 1; y <= R + 1; y++) for (var x = -R - 1; x <= R + 1; x++) {
      var d = Math.sqrt(x * x + y * y);
      if (d > R + 0.4 || d < R - 1.6) continue;
      var lit = -(x + y) / (R * 1.5);
      sp(g, cx + x, cy + y, pick(WOOD, clamp(0.5 + lit * 0.45, 0, 0.999), cx + x, cy + y));
    }
    for (var s = 0; s < 6; s++) {
      var a = turn + s * Math.PI / 3;
      for (var k = 2; k < R - 1; k++) sp(g, cx + Math.cos(a) * k, cy + Math.sin(a) * k, s % 3 === 0 ? WOOD[4] : WOOD[3]);
    }
    rect(g, cx - 1, cy - 1, 3, 3, BRASS[1]); sp(g, cx - 1, cy - 1, BRASS[3]); sp(g, cx, cy, BRASS[2]);
    /* handle knobs at three spoke ends, one painted red: it points at the notch of this state */
    var red = notch[state] - turn;
    for (var h = 0; h < 3; h++) {
      var ha = turn + red + h * Math.PI * 2 / 3;
      var hx = cx + Math.cos(ha) * (R + 0.8), hy = cy + Math.sin(ha) * (R + 0.8);
      var col = h === 0 ? RED : [BRASS[0], BRASS[2], BRASS[3]];
      sp(g, hx, hy, col[1]); sp(g, hx + 0.6, hy - 0.6, col[2]); sp(g, hx - 0.6, hy + 0.6, col[0]);
    }
    outline(g);
    return { c: toCanvas(g), ox: -1, oy: -14 };
  }

  /* ================= LIGHTNING ROD ================= */
  function lightningRod(lit) {
    var g = G(16, 44);
    /* stone foot with an iron plate */
    cyl(g, 3, 37, 10, 6, STONE); rect(g, 3, 37, 10, 1, STONE[4]);
    rect(g, 5, 35, 6, 2, IRON[2]); rect(g, 5, 35, 6, 1, IRON[4]);
    /* the iron rod */
    cyl(g, 7, 6, 2, 29, IRON);
    /* two white glass insulators and a cross-arm */
    [14, 26].forEach(function (y) { rect(g, 6, y, 4, 2, '#d8dce8'); rect(g, 6, y, 4, 1, '#f4f6fa'); sp(g, 9, y + 1, '#a8acbc'); });
    rect(g, 4, 20, 8, 1, IRON[3]); sp(g, 4, 19, IRON[2]); sp(g, 11, 19, IRON[2]);
    /* the copper earth wire wound down the rod */
    var wire = lit ? SPARK : COPPER;
    for (var y = 8; y < 35; y++) { var s = Math.floor(y / 3) % 2; sp(g, s ? 6 : 9, y, wire[lit ? 1 : 3]); if (y % 3 === 0) sp(g, s ? 9 : 6, y, wire[lit ? 2 : 2]); }
    /* the copper tip */
    for (var t = 0; t < 6; t++) { var w = t < 2 ? 1 : t < 4 ? 2 : 2; for (var i = 0; i < w; i++) sp(g, 7 + i, t, lit ? (t < 2 ? SPARK[3] : SPARK[2]) : COPPER[i ? 2 : 4]); }
    sp(g, 7, 6, lit ? SPARK[2] : COPPER[3]); sp(g, 8, 6, lit ? SPARK[1] : COPPER[1]);
    rect(g, 6, 6, 4, 1, lit ? SPARK[1] : COPPER[2]);
    outline(g);
    if (lit) {
      /* the spark at the tip: short bright rays (the power the player has routed here) */
      [[5, 1], [4, 0], [10, 1], [11, 0], [7, -1], [5, 4], [10, 4]].forEach(function (p, i) { sp(g, p[0], p[1] + 1, i % 2 ? SPARK[2] : SPARK[3]); });
    }
    return { c: toCanvas(g), ox: 0, oy: -28 };
  }

  /* ================= LAMP JAR ================= */
  function lampJar(open) {
    var g = G(18, 46), y, x;
    /* the street lamp's own foot and pole (as the lamp of props_outdoor.js) */
    cyl(g, 5, 40, 8, 5, STONE); rect(g, 5, 40, 8, 1, STONE[5]);
    cyl(g, 6, 37, 6, 3, IRON);
    cyl(g, 8, 18, 2, 19, IRON);
    sp(g, 7, 26, IRON[3]); sp(g, 10, 26, IRON[1]);
    /* the cradle the jar sits in */
    rect(g, 4, 17, 10, 2, IRON[2]); rect(g, 4, 17, 10, 1, IRON[4]);
    sp(g, 4, 16, IRON[3]); sp(g, 13, 16, IRON[1]);
    /* the jar: a round glass belly with a narrow neck */
    var spx = 9, spy = 11;
    for (y = 5; y < 17; y++) {
      var hw = y < 7 ? 3 : y < 8 ? 4.4 : y > 15 ? 4.6 : 5.2;
      for (x = Math.ceil(9 - hw - 0.5); x < 9 + hw - 0.5; x++) {
        var v = 0.72 - (x - 4) / 10 * 0.55 - (y - 5) / 12 * 0.15;
        if (!open) { var dx = x - spx, dy = y - spy, dd = Math.sqrt(dx * dx + dy * dy); if (dd < 4.5) v = Math.max(v, 0.95 - dd * 0.12); }
        var ramp = !open && Math.sqrt((x - spx) * (x - spx) + (y - spy) * (y - spy)) < 3.6 ? ['#a89a6a', '#d8c88a', '#f4e8b0', '#fff8dc'] : GLASS;
        sp(g, x, y, pick(ramp, clamp(v, 0, 0.999), x, y));
      }
    }
    /* glints on the glass */
    sp(g, 5, 9, GLASS[3]); sp(g, 5, 10, GLASS[3]); sp(g, 6, 8, GLASS[3]);
    if (!open) {
      /* the trapped spark: a small bright body with two dark eyes, curled up */
      rect(g, spx - 1, spy - 1, 3, 3, SPARK[2]); rect(g, spx - 2, spy, 5, 1, SPARK[1]); sp(g, spx, spy - 2, SPARK[1]); sp(g, spx, spy + 2, SPARK[1]);
      sp(g, spx + 2, spy - 2, SPARK[1]); sp(g, spx + 3, spy - 3, SPARK[2]);
      sp(g, spx - 1, spy, '#3a2a1a'); sp(g, spx + 1, spy, '#3a2a1a'); sp(g, spx, spy - 1, SPARK[3]);
      /* the lid and the grey wax seal over it, stamped with a closed eye */
      rect(g, 5, 3, 8, 2, IRON[2]); rect(g, 5, 3, 8, 1, IRON[4]);
      rect(g, 6, 4, 6, 3, WAX[1]); rect(g, 6, 4, 6, 1, WAX[2]); sp(g, 5, 6, WAX[1]); sp(g, 12, 6, WAX[0]); sp(g, 7, 7, WAX[0]); sp(g, 10, 7, WAX[1]);
      sp(g, 7, 5, WAX[0]); sp(g, 8, 6, WAX[0]); sp(g, 9, 6, WAX[0]); sp(g, 10, 5, WAX[0]);
      /* the wax has run down over the glass */
      sp(g, 6, 7, WAX[1]); sp(g, 6, 8, WAX[0]); sp(g, 11, 7, WAX[1]); sp(g, 11, 8, WAX[1]); sp(g, 11, 9, WAX[0]);
      /* the hook the lamp hangs from */
      sp(g, 9, 2, IRON[3]); sp(g, 9, 1, IRON[3]); sp(g, 10, 0, IRON[2]);
    } else {
      /* open: the mouth stands empty, the lid hangs on its chain at the side, the broken wax below it */
      rect(g, 6, 4, 6, 1, GLASS[3]); rect(g, 7, 5, 4, 1, '#2a3440');
      for (var c = 0; c < 4; c++) sp(g, 13 + (c > 1 ? 1 : 0), 5 + c, IRON[3]);
      rect(g, 13, 9, 2, 4, IRON[2]); sp(g, 14, 9, IRON[4]);
      sp(g, 5, 18, WAX[1]); sp(g, 12, 18, WAX[0]);
    }
    outline(g);
    return { c: toCanvas(g), ox: -1, oy: -30 };
  }

  /* ================= THE MOORED BOAT ================= */
  /* one hull piece, 32 wide: the hull side below the gunwale (y 22..33), the deck behind it (y 9..21).
     kind: 'bow' (pointed prow on the left), 'mid', 'stern' (rounded stern on the right) */
  function hull(g, kind) {
    var gun = 21, keel = 33, x, y;
    for (x = 0; x < 32; x++) {
      var top = 9, bot = keel, left = 0;
      if (kind === 'bow') { var u = 1 - x / 31; left = u; top = 9 + Math.round(Math.pow(u, 1.5) * 8); bot = keel - Math.round(Math.pow(u, 1.4) * 9); }
      if (kind === 'stern') { var w = Math.max(0, (x - 22) / 9); top = 9 + Math.round(w * w * 6); bot = keel - Math.round(w * w * 6); }
      /* the prow rises a little above the rail */
      var rail = gun - (kind === 'bow' ? Math.round(Math.pow(1 - x / 31, 2) * 5) : 0);
      for (y = top; y <= bot; y++) {
        var col;
        if (y < rail - 1) {
          /* deck planks, running along the boat */
          var pl = (y - top) % 3 === 2;
          col = pl ? DWOOD[3] : pick(WOOD, clamp(0.72 - (y - top) * 0.02 + (hash(x >> 3, y, 2) - 0.5) * 0.12, 0, 0.999), x, y);
          if (pl && hash(x >> 2, y, 5) > 0.85) col = WOOD[2];
        } else if (y <= rail) {
          col = y === rail - 1 ? WOOD[5] : WOOD[3];
        } else {
          /* the hull side: dark painted strakes, a pale stripe, the darker wet band at the waterline */
          var k = y - rail, strake = k % 3 === 0;
          col = k === 2 || k === 3 ? '#d8d0b8' : pick(['#1a2a3a', '#24384c', '#2e4a62', '#3e5e7a'], clamp(0.7 - k / 12 * 0.5 + (strake ? -0.2 : 0), 0, 0.999), x, y);
          if (k === 3) col = '#b0a890';
          if (y >= bot - 1) col = '#16222e';
        }
        sp(g, x, y, col);
      }
      /* the rail's inner edge */
      if (top < rail - 1) sp(g, x, top, WOOD[1]);
    }
    /* rivets along the stripe */
    for (x = 3; x < 32; x += 6) if (gp(g, x, gun + 2)) sp(g, x, gun + 2, '#8a8270');
  }
  function boatPiece(kind) {
    var g = G(32, 48), oy = 14, x, y, i;
    var sub = G(32, 34);
    hull(sub, kind);
    for (y = 0; y < 34; y++) for (x = 0; x < 32; x++) { var c0 = sub.d[y * 32 + x]; if (c0) sp(g, x, y + oy, c0); }
    if (kind === 'bow') {
      /* the stem post and a coil of rope at the prow */
      cyl(g, 1, oy + 9, 2, 10, WOOD, 0.1); sp(g, 1, oy + 8, WOOD[4]);
      for (i = 0; i < 10; i++) { var a = i * 0.7; sp(g, 9 + Math.cos(a) * 2.5, oy + 17 + Math.sin(a) * 1.2, i % 2 ? '#c8b080' : '#a89060'); }
      /* the mast stub with a furled sail lashed to it */
      cyl(g, 22, 0, 3, oy + 13, WOOD);
      rect(g, 21, oy + 12, 5, 2, WOOD[1]);
      for (y = 3; y < 17; y++) { var sw = 2 + (y > 6 && y < 14 ? 1 : 0); for (x = 25; x < 25 + sw; x++) sp(g, x, y, y % 4 === 0 ? '#c8bc9c' : '#ece4cc'); }
      sp(g, 25, 6, '#a89060'); sp(g, 26, 6, '#a89060'); sp(g, 25, 12, '#a89060'); sp(g, 26, 12, '#a89060');
      rect(g, 21, 0, 5, 1, IRON[3]);
    } else if (kind === 'mid') {
      /* the cabin: plank walls, a curved roof, a door on the left tile, a round window on the right */
      var cy0 = 3, cy1 = oy + 18;
      for (y = cy0 + 6; y < cy1; y++) for (x = 3; x < 29; x++) {
        var v = 0.66 - (x - 3) / 26 * 0.3 + ((x - 3) % 5 === 0 ? -0.25 : 0);
        if ((y - cy0) % 4 === 1) v -= 0.12;
        sp(g, x, y, step(['#6a4a3a', '#8a6248', '#a87e5a', '#c89c72', '#e0bc90'], clamp(v, 0, 0.999)));
      }
      for (y = 0; y < 7; y++) for (x = 1; x < 31; x++) {
        var arch = Math.abs(x - 15.5) / 15.5, yt = cy0 + Math.round(arch * arch * 3);
        if (cy0 + y < yt) continue;
        sp(g, x, cy0 + y, pick(['#20343a', '#2e5058', '#3e6e74', '#5a9090', '#8cbcb4'], clamp(0.85 - y / 7 * 0.6 - arch * 0.15, 0, 0.999), x, cy0 + y));
      }
      rect(g, 1, cy0 + 7, 30, 1, '#20343a');
      /* door */
      rect(g, 5, cy1 - 13, 7, 13, '#4a2e1c'); rect(g, 6, cy1 - 12, 5, 12, WOOD[3]); rect(g, 6, cy1 - 12, 5, 1, WOOD[4]);
      sp(g, 8, cy1 - 12, WOOD[2]); for (y = cy1 - 11; y < cy1; y++) sp(g, 8, y, WOOD[2]);
      sp(g, 10, cy1 - 6, BRASS[2]);
      /* round window with a brass rim */
      for (y = -3; y <= 3; y++) for (x = -3; x <= 3; x++) { var dd = x * x + y * y; if (dd > 11) continue; sp(g, 22 + x, cy1 - 8 + y, dd > 6 ? BRASS[dd > 9 ? 1 : 2] : dd < 2 ? '#e8d890' : '#c8a860'); }
      sp(g, 21, cy1 - 9, '#fff4c0');
      /* a step down to the deck */
      rect(g, 4, cy1, 9, 1, WOOD[4]);
    } else {
      /* the stern: the tiller and a lantern on a short post */
      cyl(g, 27, oy + 6, 2, 10, WOOD); line(g, 28, oy + 8, 20, oy + 12, WOOD[3]); line(g, 28, oy + 9, 20, oy + 13, WOOD[1]);
      cyl(g, 6, 2, 2, oy + 13, WOOD);
      rect(g, 3, 1, 8, 1, IRON[3]);
      rect(g, 4, 2, 6, 6, IRON[2]); rect(g, 5, 3, 4, 4, '#f0c870'); sp(g, 6, 4, '#fff4c0'); rect(g, 4, 8, 6, 1, IRON[3]);
      /* a crate lashed to the deck */
      rect(g, 13, oy + 7, 7, 6, WOOD[3]); rect(g, 13, oy + 7, 7, 1, WOOD[5]); line(g, 13, oy + 12, 19, oy + 8, WOOD[1]);
    }
    outline(g);
    return { c: toCanvas(g), ox: 0, oy: -16 };
  }

  /* ================= SMALL SCHOOL TOUCHES ================= */
  function postBase(g) {
    cyl(g, 6, 16, 4, 26, WOOD);
    cyl(g, 4, 40, 8, 3, STONE); rect(g, 4, 40, 8, 1, STONE[4]);
  }
  function touchWater() {
    var g = G(16, 44), x, y;
    postBase(g);
    rect(g, 5, 16, 6, 1, WOOD[2]);
    /* a little boat on the post: a blue crescent hull with raised ends, a white stripe, a mast with a paper lantern */
    for (x = 0; x < 16; x++) {
      var u = Math.abs(x - 7.5) / 7.5, top = 11 - Math.round(u * u * u * 5), bot = 16 - Math.round(u * u * 4);
      for (y = top; y <= bot; y++) {
        var k2 = y - top;
        sp(g, x, y, k2 === 0 ? WOOD[4] : k2 === 1 ? '#f0ecdc' : step(['#1e3a5e', '#2c5486', '#3f72ab', '#6496cf'], clamp(0.8 - k2 / 6 * 0.6 - (x > 7 ? 0.15 : 0), 0, 0.999)));
      }
    }
    rect(g, 7, 1, 1, 10, WOOD[1]);
    rect(g, 8, 2, 4, 1, WOOD[1]);
    /* the lantern hanging from the yard */
    sp(g, 11, 3, '#2a1a14');
    rect(g, 10, 4, 3, 4, '#e87a3a'); rect(g, 11, 5, 1, 2, '#ffd890'); rect(g, 10, 4, 3, 1, '#2a1a14'); sp(g, 11, 8, '#2a1a14');
    outline(g);
    return { c: toCanvas(g), ox: 0, oy: -28 };
  }
  function touchElectric() {
    var g = G(16, 44), y;
    postBase(g);
    rect(g, 3, 15, 10, 2, IRON[2]); rect(g, 3, 15, 10, 1, IRON[4]);
    /* the coil: copper windings on a dark core, a brass ball on top */
    for (y = 5; y < 15; y++) for (var x = 4; x < 12; x++) {
      var nx = (x - 7.5) / 4, v = 0.65 - nx * 0.45 - nx * nx * 0.3;
      sp(g, x, y, y % 2 ? pick(COPPER, clamp(v, 0, 0.999), x, y) : COPPER[1]);
    }
    rect(g, 5, 4, 6, 1, IRON[3]);
    ball(g, 8, 2, 1, 1, BRASS, 0, 0.15); sp(g, 8, 3, BRASS[1]);
    outline(g);
    /* a small spark leaping from the brass ball (the coil is what makes it) */
    [[10, 1], [11, 0], [12, 1], [13, 0], [14, 1]].forEach(function (p, i) { sp(g, p[0], p[1], i % 2 ? SPARK[3] : SPARK[1]); });
    return { c: toCanvas(g), ox: 0, oy: -28 };
  }

  /* ---------- registry: one still picture per type ---------- */
  var PAINT = {
    spirit_bell: spiritBell,
    spirit_bell_raised: spiritBellRaised,
    tide_wheel_0: function () { return tideWheel(0); },
    tide_wheel_1: function () { return tideWheel(1); },
    tide_wheel_2: function () { return tideWheel(2); },
    lightning_rod: function () { return lightningRod(false); },
    lightning_rod_lit: function () { return lightningRod(true); },
    lamp_jar: function () { return lampJar(false); },
    lamp_jar_open: function () { return lampJar(true); },
    boat_hull_bow: function () { return boatPiece('bow'); },
    boat_hull_cabin: function () { return boatPiece('mid'); },
    boat_hull_stern: function () { return boatPiece('stern'); },
    school_touch_water: touchWater,
    school_touch_electric: touchElectric
  };
  /* anchors of each picture (its painter's own ox, oy), so a baked picture is placed without painting it */
  var AT = {
    spirit_bell: [-2, -6], spirit_bell_raised: [-2, -26], tide_wheel_0: [-1, -14], tide_wheel_1: [-1, -14], tide_wheel_2: [-1, -14],
    lightning_rod: [0, -28], lightning_rod_lit: [0, -28], lamp_jar: [-1, -30], lamp_jar_open: [-1, -30],
    boat_hull_bow: [0, -16], boat_hull_cabin: [0, -16], boat_hull_stern: [0, -16], school_touch_water: [0, -28], school_touch_electric: [0, -28]
  };
  var INFO = {
    spirit_bell: { fw: 2, fh: 2, solid: true, still: true },
    spirit_bell_raised: { fw: 2, fh: 2, solid: true, still: true },
    tide_wheel: { fw: 1, fh: 1, solid: true, still: true },
    tide_wheel_0: { fw: 1, fh: 1, solid: true, still: true },
    tide_wheel_1: { fw: 1, fh: 1, solid: true, still: true },
    tide_wheel_2: { fw: 1, fh: 1, solid: true, still: true },
    lightning_rod: { fw: 1, fh: 1, solid: true, still: true },
    lightning_rod_lit: { fw: 1, fh: 1, solid: true, still: true, light: { dx: 8, dy: -26, r: 34, color: '#fff0a0', flicker: true } },
    lamp_jar: { fw: 1, fh: 1, solid: true, still: true, light: { dx: 8, dy: -19, r: 52, color: '#ffe680', flicker: true } },
    lamp_jar_open: { fw: 1, fh: 1, solid: true, still: true },
    boat_hull_bow: { fw: 2, fh: 2, solid: true, still: true },
    boat_hull_cabin: { fw: 2, fh: 2, solid: true, still: true, light: { dx: 22, dy: -6, r: 26, color: '#ffc070', flicker: false } },
    boat_hull_stern: { fw: 2, fh: 2, solid: true, still: true, light: { dx: 7, dy: -11, r: 30, color: '#ffb070', flicker: true } },
    school_touch_water: { fw: 1, fh: 1, solid: true, still: true, light: { dx: 11, dy: -22, r: 22, color: '#ffb070', flicker: true } },
    school_touch_electric: { fw: 1, fh: 1, solid: true, still: true, light: { dx: 8, dy: -26, r: 22, color: '#fff0a0', flicker: true } }
  };
  var ALIAS = { tide_wheel: 'tide_wheel_0' };
  var cache = {}, KEY = {}, PF = {};
  function get(t) {
    var s = cache[t];
    if (s) return s;
    try { s = PAINT[t](); } catch (e) { s = null; }
    if (!s) return null;
    cache[t] = s;
    if (s.ox !== AT[t][0] || s.oy !== AT[t][1]) { AT[t] = [s.ox, s.oy]; try { console.warn('props_ch45: anchor of ' + t + ' changed; update AT'); } catch (e) { /* no console */ } }
    if (H.sheets && H.sheets.recording) H.sheets.rec('outdoor', KEY[t], s.c);
    return s;
  }
  function paintOf(t) { return function () { var s = get(t); return s && s.c; }; }
  Object.keys(PAINT).forEach(function (t) { KEY[t] = 'p45:' + t; PF[t] = paintOf(t); });

  var base = H.propsOutdoor || { info: {}, draw: function () {} };
  var oldDraw = base.draw;
  for (var k in INFO) base.info[k] = INFO[k];
  base.draw = function (ctx, type, px, py, env) {
    var t = ALIAS[type] || type;
    if (!PAINT[t]) return oldDraw.call(base, ctx, type, px, py, env);
    var x = Math.round(px + AT[t][0]), y = Math.round(py + AT[t][1]);
    if (H.sheets) { H.sheets.draw(ctx, KEY[t], x, y, PF[t]); return; }
    var s = get(t);
    if (s) ctx.drawImage(s.c, x, y);
  };
  H.propsOutdoor = base;

  /* ================= COPPER ROOFS: the building house_copper ================= */
  /* house_a's picture with its blue roof tiles recoloured to weathered green copper with copper glints.
     It is made from what buildings.js draws (nothing of its inside is read): the roof ramp below is house_a's. */
  var ROOF_FROM = ['#121a30', '#26406c', '#365c94', '#5282bc', '#88b2e0'];
  var ROOF_TO = ['#162e2a', '#2a5e52', '#3e8a74', '#5eae92', '#e0a066'];
  var CB = { from: 'house_a', ext: 48 };
  var bcache = {}, BKEY = ['p45:house_copperD', 'p45:house_copperN'], BPF = [function () { return copper(0); }, function () { return copper(1); }];
  var buildingsRef = null, baseBuildDraw = null;
  function rgbOf(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  var SWAP = {};
  ROOF_FROM.forEach(function (f, i) { var a = rgbOf(f); SWAP[(a[0] << 16) | (a[1] << 8) | a[2]] = rgbOf(ROOF_TO[i]); });
  function copper(n) {
    if (bcache[n]) return bcache[n];
    var bi = buildingsRef && buildingsRef.info[CB.from];
    if (!bi || !baseBuildDraw) return null;
    var W = bi.fw * T, Hh = bi.fh * T + CB.ext, c = newCanvas(W * 2, Hh * 2), x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.scale(2, 2);
    try { baseBuildDraw(x, CB.from, 0, CB.ext, { time: n ? 22 : 12, t: 0, wind: 0 }); } catch (e) { return null; }
    var img = x.getImageData(0, 0, W * 2, Hh * 2), d = img.data, swapped = 0;
    for (var i = 0; i < d.length; i += 4) {
      if (d[i + 3] !== 255) continue;
      var to = SWAP[(d[i] << 16) | (d[i + 1] << 8) | d[i + 2]];
      if (to) { d[i] = to[0]; d[i + 1] = to[1]; d[i + 2] = to[2]; swapped++; }
    }
    /* nothing was drawn (the sheet was not in yet, or a dry run): try again next time, keep nothing */
    if (!swapped) return null;
    x.putImageData(img, 0, 0);
    /* standing seams: the copper plates are joined by thin raised lines down the roof */
    var rc = ROOF_TO.map(function (h) { var a = rgbOf(h); return (a[0] << 16) | (a[1] << 8) | a[2]; });
    img = x.getImageData(0, 0, W * 2, Hh * 2); d = img.data;
    for (var yy = 0; yy < Hh * 2; yy++) for (var xx = 6; xx < W * 2; xx += 12) {
      var p = (yy * W * 2 + xx) * 4, v = (d[p] << 16) | (d[p + 1] << 8) | d[p + 2], r = rc.indexOf(v);
      if (r < 1 || r > 3) continue;
      var hi = rgbOf(ROOF_TO[r === 3 ? 4 : r + 1]);
      d[p] = hi[0]; d[p + 1] = hi[1]; d[p + 2] = hi[2];
    }
    x.putImageData(img, 0, 0);
    bcache[n] = c;
    if (H.sheets && H.sheets.recording) H.sheets.rec('outdoor', BKEY[n], c);
    return c;
  }
  function isNightB(env) { var h = env && env.time != null ? env.time : 12; return h >= 18.5 || h < 6; }
  function installBuildings(b) {
    if (!b || !b.info || typeof b.draw !== 'function' || b.info.house_copper || !b.info[CB.from]) return;
    buildingsRef = b; baseBuildDraw = b.draw;
    var src = b.info[CB.from], inf = {}, kk;
    for (kk in src) inf[kk] = src[kk];
    b.info.house_copper = inf;
    b.draw = function (ctx, type, px, py, env) {
      if (type !== 'house_copper') return baseBuildDraw.apply(b, arguments);
      var bi = b.info[CB.from], W = bi.fw * T, Hh = bi.fh * T + CB.ext, x0 = Math.round(px), y0 = Math.round(py - CB.ext), n = isNightB(env) ? 1 : 0;
      /* the same contact shadow as every building */
      ctx.fillStyle = 'rgba(10,20,10,0.28)'; ctx.fillRect(x0 + 1, y0 + Hh, W - 1, 1);
      ctx.fillStyle = 'rgba(10,20,10,0.13)'; ctx.fillRect(x0 + 2, y0 + Hh + 1, W - 1, 1); ctx.fillRect(x0 + W, y0 + Hh - 6, 1, 7);
      /* baked: from the sheet (painted meanwhile); otherwise the recoloured picture, or plain house_a until it can be made */
      if (H.sheets && H.sheets.baked && H.sheets.baked(BKEY[n])) { H.sheets.draw(ctx, BKEY[n], x0, y0, BPF[n], W, Hh); return; }
      var c = copper(n);
      if (c) ctx.drawImage(c, x0, y0, W, Hh);
      else baseBuildDraw.call(b, ctx, CB.from, px, py, env);
    };
  }
  /* buildings.js loads after this file: wrap H.buildings the moment it is set (or now, if it already is) */
  if (H.buildings) installBuildings(H.buildings);
  else {
    try {
      var held;
      Object.defineProperty(H, 'buildings', {
        configurable: true, enumerable: true,
        get: function () { return held; },
        set: function (v) { held = v; try { installBuildings(v); } catch (e) { /* the plain buildings stay */ } }
      });
    } catch (e) { /* no copper roofs; every other building is unchanged */ }
  }

  if (H.sheets) {
    try {
      H.sheets.enumerate('outdoor', function () {
        for (var t in PAINT) get(t);
        copper(0); copper(1);
      });
      H.sheets.onLoad(function (group) {
        if (group !== 'outdoor') return;
        for (var t in cache) if (H.sheets.has(KEY[t])) delete cache[t];
        for (var n = 0; n < 2; n++) if (bcache[n] && H.sheets.has(BKEY[n])) delete bcache[n];
      });
    } catch (e) { /* sheets are optional */ }
  }
})();
