window.H = window.H || {};
/*
  props_ch10.js: the pieces of chapter 10 (the Athenaeum Stair, the Athenaeum, the three Council chambers, Vael's
  study) and of the Emberbrook fair after the end, painted in code in the style of props_ch89.js (1x pixels, soft
  coloured outline).

  API: adds to H.propsOutdoor.info / H.propsOutdoor.draw (footprint in tiles; art may rise above it):
    stone_steps            1x1  pale stone step edges across a tile of the stair (flat decoration)
    landing_gate           2x1  a locked iron gate with a gold closed-eye lock across the stair (solid)
    ivy_veil               1x1  a stone arch hung thick with ivy, the side way behind it hidden (solid)
    ramen_cart             2x1  the attendant's noodle cart: a red awning, a steaming pot, a paper lantern (solid)
    landing_cot            2x1  a cot with a folded quilt under a small canvas awning (solid)
    athenaeum_door         1x1  a tall arched double door set in a wall, its foot on the tile below the wall
                                (flat decoration; put it on the last wall row, the door tile is the floor below)
    council_seal           1x1  two grey posts, a grey cord and a grey wax seal with a closed eye: a way shut
                                by the Council (solid)
    council_banner         1x1  a long grey banner with a gold closed eye, hung on a wall (flat decoration)
    tall_shelf             2x1  a tall gilded bookcase full of books, rising up the wall behind it (solid)
    law_lectern            1x1  a gold lectern with the great book of the law open on it (solid)
    council_seat_e         2x1  a high-backed Councillor's chair: blue cushion (the east chamber) (solid)
    council_seat_w         2x1  the same, amber cushion (the west chamber) (solid)
    council_seat_h         2x1  the same, violet cushion (the high chamber) (solid)
    chain_post             1x1  a short iron post with a heavy chain hung from it on both sides (solid)
    hourglass_stand        1x1  a tall brass hourglass on a stone foot, the sand all run down (solid)
    veil_curtain           1x1  a heavy grey drape pulled shut over a window (flat decoration, on a wall)
    study_desk             3x2  Vael's desk: dark polished wood, a green-shaded lamp, letters, a quill (solid)
    study_window           2x1  a great round window of small gold-leaded panes, warm sky behind (flat decoration, on a wall)
    fair_stall_hats        3x1  a fair stall with a striped awning and its wares on the counter: hats
    fair_stall_frames      3x1  the same: picture frames
    fair_stall_lanterns    3x1  the same: little lanterns for the home
    fair_stall_sweets      3x1  the same: jars of sweets
  Every prop is still; lights are the lighting pass (ramen_cart, study_desk).
  Sheets (H.sheets, group 'outdoor'): key 'p10:<type>'.
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

  /* ---------- pixel grid helpers (as in props_ch89.js) ---------- */
  function G(w, h) { var d = new Array(w * h); for (var i = 0; i < d.length; i++) d[i] = null; return { w: w, h: h, d: d }; }
  function sp(g, x, y, c) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= g.w || y >= g.h) return; g.d[y * g.w + x] = c; }
  function gp(g, x, y) { if (x < 0 || y < 0 || x >= g.w || y >= g.h) return null; return g.d[y * g.w + x]; }
  function rect(g, x, y, w, h, c) { for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) sp(g, x + i, y + j, c); }
  function pick(r, v, x, y) {
    var i = Math.floor(v * r.length + bay(x, y) - 0.5);
    return r[i < 0 ? 0 : i >= r.length ? r.length - 1 : i];
  }
  function ball(g, cx, cy, rx, ry, ramp, bias) {
    bias = bias || 0;
    for (var y = -ry; y <= ry; y++) for (var x = -rx; x <= rx; x++) {
      var nx = x / (rx + 0.5), ny = y / (ry + 0.5), q = nx * nx + ny * ny;
      if (q > 1) continue;
      var nz = Math.sqrt(1 - q);
      var v = (-0.5 * nx - 0.62 * ny + 0.6 * nz + 0.55) / 1.45 + bias;
      sp(g, cx + x, cy + y, pick(ramp, clamp(v, 0, 0.999), cx + x, cy + y));
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

  /* ---------- palettes (shared with props_ch89.js where they meet) ---------- */
  var WOOD = ['#2e1c14', '#4a2e1c', '#6a4426', '#8e5f33', '#b37f45', '#d6a466'];
  var DARKWOOD = ['#1e120e', '#3a2016', '#55301e', '#70432a', '#8e5a38'];
  var STONE = ['#2a2b3a', '#424659', '#5f6579', '#82889d', '#a9afc0', '#d2d6e0'];
  var MARBLE = ['#6a6660', '#a8a49c', '#d0ccc4', '#ecead4', '#fbfaf4'];
  var IRON = ['#15161e', '#262a3a', '#3b4058', '#59607e', '#868fb0'];
  var GOLD = ['#5a3a10', '#9a6a1a', '#c8962a', '#e8c050', '#fff0a0'];
  var BRASS = ['#4a3010', '#86601e', '#b88a34', '#dcb45a', '#f6e0a0'];
  var WAX = ['#4a4a56', '#7a7a88', '#a4a4b2', '#c4c4ce'];
  var GREY = ['#3a3a46', '#5e5e6c', '#7e7e8c', '#9e9eac', '#c4c4d0'];
  var CANVAS = ['#a8946c', '#d0bc90', '#eee0bc', '#fbf4e0'];
  var LEAF = ['#163a1e', '#24582a', '#357a34', '#4e9c40', '#7cc458'];
  var BOOKS = ['#8a3a34', '#3a5a8a', '#3a7a4a', '#7a5a9a', '#b08a3a', '#5a6a7a', '#a8603a'];

  /* a closed eye: a lid curve with lashes (cx, cy the middle of the lid line), in colour c */
  function closedEye(g, cx, cy, c, wide) {
    var w = wide || 3;
    for (var x = -w; x <= w; x++) sp(g, cx + x, cy + Math.round((1 - (x * x) / (w * w)) * 1.2), c);
    sp(g, cx - 2, cy + 3, c); sp(g, cx, cy + 3, c); sp(g, cx + 2, cy + 3, c);
  }

  /* ================= THE STAIR ================= */
  function stoneSteps() {
    var g = G(16, 16), x;
    /* two step edges: a bright nosing, a shadow under it */
    [3, 11].forEach(function (y) {
      for (x = 0; x < 16; x++) {
        sp(g, x, y, (x + y) % 7 === 0 ? MARBLE[2] : MARBLE[3]);
        sp(g, x, y + 1, 'rgba(40,36,48,0.45)');
        sp(g, x, y + 2, 'rgba(40,36,48,0.2)');
      }
    });
    return { c: toCanvas(g), ox: 0, oy: 0 };
  }
  function landingGate() {
    var g = G(32, 44), x, y;
    /* two stone posts */
    [0, 26].forEach(function (px) {
      cyl(g, px, 8, 6, 34, STONE); rect(g, px - 1, 6, 8, 3, STONE[4]); rect(g, px - 1, 6, 8, 1, STONE[5]);
      ball(g, px + 3, 3, 2, 2, GOLD, 0.05);
    });
    /* iron bars between them, a top rail with spikes */
    for (x = 7; x < 26; x += 3) { rect(g, x, 12, 1, 30, IRON[3]); rect(g, x + 1, 12, 1, 30, IRON[1]); sp(g, x, 10, IRON[4]); sp(g, x, 11, IRON[3]); }
    rect(g, 6, 13, 20, 2, IRON[2]); rect(g, 6, 13, 20, 1, IRON[4]);
    rect(g, 6, 36, 20, 2, IRON[2]); rect(g, 6, 36, 20, 1, IRON[4]);
    /* the gold lock plate with a closed eye */
    rect(g, 12, 21, 8, 9, GOLD[2]); rect(g, 12, 21, 8, 1, GOLD[4]); rect(g, 12, 29, 8, 1, GOLD[1]);
    closedEye(g, 16, 23, GOLD[0], 2);
    rect(g, 15, 27, 2, 2, '#2a1a08');
    outline(g);
    return { c: toCanvas(g), ox: 0, oy: -28 };
  }
  function ivyVeil() {
    var g = G(18, 40), x, y;
    /* a stone arch */
    cyl(g, 0, 10, 4, 30, STONE); cyl(g, 13, 10, 4, 30, STONE);
    for (x = 0; x < 17; x++) { var t = (x - 8) / 8.5, top = Math.round(4 + t * t * 6); rect(g, x, top, 1, 4, x < 8 ? STONE[4] : STONE[3]); sp(g, x, top, STONE[5]); }
    /* the dark way behind, hung over with ivy */
    rect(g, 4, 12, 9, 28, '#1a1820');
    for (y = 6; y < 40; y++) for (x = 1; x < 17; x++) {
      var r = hash(x, y, 31);
      if (y > 12 && (x < 4 || x > 12) && r < 0.5) continue;
      if (r < 0.62 - (y - 6) / 80) sp(g, x, y, pick(LEAF, clamp(0.85 - (y - 6) / 40 + (hash(x >> 1, y >> 1, 3) - 0.5) * 0.4, 0, 0.999), x, y));
    }
    /* a few hanging strands at the bottom */
    [5, 8, 11].forEach(function (sx, i) { for (y = 30; y < 38 - i; y++) sp(g, sx, y, LEAF[2 + (y & 1)]); });
    outline(g);
    return { c: toCanvas(g), ox: -1, oy: -24 };
  }
  function ramenCart() {
    var g = G(32, 44), x, y;
    /* the cart: a wooden box on two wheels */
    rect(g, 1, 22, 30, 14, WOOD[3]); rect(g, 1, 22, 30, 1, WOOD[5]); rect(g, 1, 35, 30, 1, WOOD[1]);
    for (x = 3; x < 30; x += 6) rect(g, x, 24, 1, 11, WOOD[2]);
    rect(g, 0, 20, 32, 3, WOOD[4]); rect(g, 0, 20, 32, 1, WOOD[5]);
    [6, 25].forEach(function (cx) { ball(g, cx, 38, 4, 4, DARKWOOD, 0); sp(g, cx, 38, BRASS[3]); });
    /* the awning on two poles: red and cream stripes */
    rect(g, 2, 6, 1, 14, WOOD[2]); rect(g, 29, 6, 1, 14, WOOD[2]);
    for (x = 0; x < 32; x++) for (y = 2; y < 8; y++) sp(g, x, y, (Math.floor(x / 4) % 2) ? '#f4ead0' : (y < 4 ? '#e05a48' : '#c8443a'));
    for (x = 0; x < 32; x += 4) { sp(g, x + 1, 8, '#c8443a'); sp(g, x + 2, 8, '#c8443a'); }
    /* the pot and its lid, bowls stacked beside it */
    cyl(g, 16, 13, 10, 7, IRON); rect(g, 15, 12, 12, 2, IRON[3]); rect(g, 15, 12, 12, 1, IRON[4]);
    rect(g, 4, 16, 8, 2, '#f4f0e6'); rect(g, 5, 14, 6, 2, '#f4f0e6'); rect(g, 4, 16, 8, 1, '#c8443a');
    /* a paper lantern hung from the awning */
    ball(g, 27, 12, 2, 3, ['#a83a2a', '#e05a3a', '#f08a4a', '#ffc070'], 0.1);
    /* steam from the pot */
    [[19, 9], [20, 8], [19, 7], [23, 9], [24, 8]].forEach(function (p) { sp(g, p[0], p[1], 'rgba(255,255,255,0.55)'); });
    outline(g);
    return { c: toCanvas(g), ox: 0, oy: -28 };
  }
  function landingCot() {
    var g = G(32, 34), x, y;
    /* the awning: canvas on four poles */
    [1, 30].forEach(function (px) { rect(g, px, 4, 1, 26, WOOD[2]); });
    for (y = 1; y < 7; y++) for (x = 0; x < 32; x++) sp(g, x, y, pick(CANVAS, clamp(0.8 - y / 10 - x / 90, 0, 0.999), x, y));
    for (x = 0; x < 32; x += 3) sp(g, x + 1, 7, CANVAS[1]);
    /* the cot: a wooden frame on short legs, a mattress, a folded blue quilt, a pillow */
    rect(g, 3, 20, 26, 6, WOOD[3]); rect(g, 3, 20, 26, 1, WOOD[5]);
    [4, 27].forEach(function (lx) { rect(g, lx, 26, 2, 6, WOOD[1]); });
    rect(g, 4, 16, 24, 5, '#f0ead8'); rect(g, 4, 16, 24, 1, '#ffffff');
    rect(g, 5, 15, 6, 3, '#fbf8f0'); rect(g, 5, 15, 6, 1, '#ffffff');
    rect(g, 15, 15, 13, 6, '#3a6ab0'); rect(g, 15, 15, 13, 1, '#6a9ae0'); rect(g, 15, 18, 13, 1, '#2a4a8a');
    for (x = 16; x < 28; x += 3) sp(g, x, 17, '#e0c060');
    outline(g);
    return { c: toCanvas(g), ox: 0, oy: -18 };
  }

  /* ================= THE ATHENAEUM ================= */
  function athenaeumDoor() {
    var g = G(24, 40), x, y;
    /* the stone frame of an arch */
    for (y = 0; y < 40; y++) for (x = 0; x < 24; x++) {
      var dx = x - 11.5, top = 10 - Math.sqrt(Math.max(0, 1 - (dx / 12) * (dx / 12))) * 10;
      if (y < top) continue;
      sp(g, x, y, x < 3 || x > 20 || y < top + 3 ? (x < 12 ? MARBLE[3] : MARBLE[2]) : null);
    }
    /* the two leaves: dark wood with gold studs, a gold ring on each */
    for (y = 3; y < 40; y++) for (x = 3; x < 21; x++) {
      var dx2 = x - 11.5, top2 = 13 - Math.sqrt(Math.max(0, 1 - (dx2 / 9) * (dx2 / 9))) * 10;
      if (y < top2) continue;
      var col = x === 11 || x === 12 ? DARKWOOD[0] : (x % 4 === 0 ? DARKWOOD[1] : x < 12 ? DARKWOOD[3] : DARKWOOD[2]);
      if ((y === 14 || y === 28) && x % 3 === 1) col = GOLD[3];
      sp(g, x, y, col);
    }
    [9, 14].forEach(function (rx) { sp(g, rx, 21, GOLD[4]); sp(g, rx - 1, 22, GOLD[2]); sp(g, rx + 1, 22, GOLD[2]); sp(g, rx, 23, GOLD[1]); });
    /* a gold keystone */
    rect(g, 10, 0, 4, 3, GOLD[3]); rect(g, 10, 0, 4, 1, GOLD[4]);
    outline(g);
    return { c: toCanvas(g), ox: -4, oy: -24 };
  }
  function councilSeal() {
    var g = G(20, 30), x;
    /* two short grey posts with a grey cord between them */
    [1, 15].forEach(function (px) { cyl(g, px, 10, 4, 18, GREY); rect(g, px - 1, 8, 6, 2, GREY[4]); });
    for (x = 5; x < 15; x++) sp(g, x, 14 + Math.round(Math.sin((x - 5) / 9 * Math.PI) * 3), WAX[1]);
    /* the wax seal hung in the middle: a round grey disc with a closed eye */
    ball(g, 10, 18, 4, 4, WAX, 0.05);
    closedEye(g, 10, 16, WAX[0], 2);
    outline(g);
    return { c: toCanvas(g), ox: -2, oy: -14 };
  }
  function councilBanner() {
    var g = G(14, 40), x, y;
    rect(g, 0, 0, 14, 2, GOLD[2]); rect(g, 0, 0, 14, 1, GOLD[4]);
    for (y = 2; y < 38; y++) for (x = 1; x < 13; x++) {
      if (y > 33 && Math.abs(x - 6.5) < (y - 33) * 1.1) continue;
      sp(g, x, y, x === 1 || x === 12 ? GOLD[2] : x < 4 ? GREY[3] : x > 10 ? GREY[1] : GREY[2]);
    }
    closedEye(g, 7, 14, GOLD[3], 4);
    for (x = 3; x < 11; x++) sp(g, x, 9, GOLD[3]);
    outline(g);
    return { c: toCanvas(g), ox: 1, oy: -8 };
  }
  function tallShelf() {
    var g = G(32, 60), x, y, s;
    /* the case: dark wood with gilt edges and a carved crown */
    rect(g, 0, 6, 32, 54, DARKWOOD[2]); rect(g, 0, 6, 2, 54, DARKWOOD[4]); rect(g, 30, 6, 2, 54, DARKWOOD[1]);
    rect(g, 0, 3, 32, 4, GOLD[2]); rect(g, 0, 3, 32, 1, GOLD[4]); rect(g, 10, 0, 12, 4, GOLD[3]); rect(g, 10, 0, 12, 1, GOLD[4]);
    /* five shelves of books */
    for (s = 0; s < 5; s++) {
      var top = 9 + s * 10;
      rect(g, 2, top, 28, 8, DARKWOOD[0]);
      for (x = 3; x < 29;) {
        var bw = 2 + Math.floor(hash(x, s, 4) * 2), bh = 5 + Math.floor(hash(x, s, 9) * 3), col = BOOKS[Math.floor(hash(x, s, 2) * BOOKS.length)];
        if (hash(x, s, 13) < 0.1) { x += 2; continue; }
        for (var i = 0; i < bw && x + i < 29; i++) for (y = top + 8 - bh; y < top + 8; y++) sp(g, x + i, y, i === 0 ? col : (i === bw - 1 ? deep(col) : col));
        sp(g, x, top + 8 - bh + 2, GOLD[3]);
        x += bw;
      }
      rect(g, 1, top + 8, 30, 2, DARKWOOD[3]); rect(g, 1, top + 8, 30, 1, GOLD[2]);
    }
    outline(g);
    return { c: toCanvas(g), ox: 0, oy: -44 };
  }
  function lawLectern() {
    var g = G(24, 34), x, y;
    /* a gold stand on a stepped foot */
    cyl(g, 9, 16, 6, 14, GOLD); rect(g, 4, 29, 16, 3, GOLD[2]); rect(g, 4, 29, 16, 1, GOLD[4]); rect(g, 6, 27, 12, 2, GOLD[3]);
    /* the slanted top and the great open book */
    for (y = 8; y < 17; y++) rect(g, 1 + (16 - y) / 3, y, 22 - (16 - y) / 1.5, 1, DARKWOOD[2]);
    for (y = 2; y < 12; y++) for (x = 2; x < 22; x++) {
      var page = x < 12 ? '#f4ecd4' : '#ece2c4';
      if (x === 11 || x === 12) page = '#c8b890';
      if (y > 3 && y < 11 && (x === 4 || x === 19)) page = '#fbf6e6';
      sp(g, x, y + Math.round(Math.abs(x - 11.5) / 10), page);
    }
    /* the lines of the law, and the grey seal on its foot */
    for (y = 4; y < 10; y += 2) { rect(g, 4, y, 6, 1, '#6a5a4a'); rect(g, 14, y + 1, 6, 1, '#6a5a4a'); }
    rect(g, 14, 9, 3, 2, WAX[1]);
    sp(g, 6, 12, '#c8443a'); sp(g, 6, 13, '#c8443a'); sp(g, 6, 14, '#a8302a');
    outline(g);
    return { c: toCanvas(g), ox: -4, oy: -18 };
  }
  var SEAT = { e: ['#1e3a6a', '#2c528e', '#3e6cb0', '#6a9ad8'], w: ['#6a3a10', '#9a5a1a', '#c88430', '#e8b060'], h: ['#2a1e4a', '#3e2e6a', '#5a4490', '#8a74c0'] };
  function councilSeat(k) {
    var g = G(32, 48), x, y, C = SEAT[k];
    /* the tall back: grey stone, a gold rim, a closed eye carved at the top */
    for (y = 0; y < 34; y++) for (x = 4; x < 28; x++) {
      var dx = x - 15.5;
      if (y < 6 && Math.abs(dx) > 6 + y * 1.6) continue;
      var edge = Math.abs(dx) > 10.5 || (y < 6 && Math.abs(dx) > 4.5 + y * 1.6);
      sp(g, x, y, edge ? GOLD[y < 3 ? 4 : 2] : pick(GREY, clamp(0.75 - dx / 30 - y / 90, 0, 0.999), x, y));
    }
    closedEye(g, 16, 6, GOLD[3], 3);
    /* the cushion on the back and the seat */
    rect(g, 8, 12, 16, 18, C[1]); rect(g, 8, 12, 16, 2, C[3]); rect(g, 8, 12, 2, 18, C[2]); rect(g, 22, 12, 2, 18, C[0]);
    rect(g, 3, 30, 26, 6, C[2]); rect(g, 3, 30, 26, 1, C[3]); rect(g, 3, 35, 26, 1, C[0]);
    /* the arms and the stone foot */
    [1, 27].forEach(function (ax) { rect(g, ax, 24, 4, 14, GREY[2]); rect(g, ax, 24, 4, 1, GREY[4]); sp(g, ax + 1, 24, GOLD[3]); });
    rect(g, 1, 38, 30, 8, GREY[1]); rect(g, 1, 38, 30, 1, GREY[3]); rect(g, 1, 45, 30, 1, GREY[0]);
    outline(g);
    return { c: toCanvas(g), ox: 0, oy: -32 };
  }
  function chainPost() {
    var g = G(28, 28), x;
    cyl(g, 11, 6, 6, 18, IRON); rect(g, 10, 4, 8, 3, IRON[3]); rect(g, 10, 4, 8, 1, IRON[4]); ball(g, 14, 2, 2, 2, IRON, 0.05);
    rect(g, 9, 23, 10, 3, STONE[3]); rect(g, 9, 23, 10, 1, STONE[4]);
    /* the chain: links hanging out to both sides */
    for (x = 0; x < 28; x++) {
      if (x > 10 && x < 17) continue;
      var y = 9 + Math.round(Math.sin(Math.abs(x - 13.5) / 14 * Math.PI) * 4);
      sp(g, x, y, x % 3 === 0 ? IRON[4] : IRON[2]);
      if (x % 3 === 1) sp(g, x, y + 1, IRON[3]);
    }
    outline(g);
    return { c: toCanvas(g), ox: -6, oy: -10 };
  }
  function hourglassStand() {
    var g = G(16, 40), x, y;
    /* brass caps and three posts */
    rect(g, 1, 4, 14, 3, BRASS[2]); rect(g, 1, 4, 14, 1, BRASS[4]); rect(g, 1, 29, 14, 3, BRASS[2]); rect(g, 1, 29, 14, 1, BRASS[4]);
    ball(g, 8, 2, 2, 2, BRASS, 0.05);
    [2, 13].forEach(function (px) { rect(g, px, 7, 1, 22, BRASS[1]); });
    /* the glass: two bulbs and a narrow neck; the sand all below */
    for (y = 7; y < 29; y++) {
      var t = (y - 18) / 11, hw = 1 + Math.round(Math.abs(t) * 4.5);
      for (x = 8 - hw; x < 8 + hw; x++) {
        var sand = y > 22 && (y - 22) * 1.2 > Math.abs(x - 7.5) - 1;
        sp(g, x, y, sand ? (x < 8 ? '#f0d890' : '#d8b868') : (x === 8 - hw ? '#eef8fb' : '#b8d4e0'));
      }
    }
    cyl(g, 3, 32, 10, 6, STONE); rect(g, 3, 32, 10, 1, STONE[5]);
    outline(g);
    return { c: toCanvas(g), ox: 0, oy: -24 };
  }
  function veilCurtain() {
    var g = G(16, 30), x, y;
    rect(g, 0, 0, 16, 2, IRON[3]); rect(g, 0, 0, 16, 1, IRON[4]);
    /* heavy folds pulled shut, gathered at the foot */
    for (y = 2; y < 30; y++) for (x = 1; x < 15; x++) {
      var fold = Math.sin((x + (y > 22 ? (y - 22) * 0.3 * (x < 8 ? 1 : -1) : 0)) * 1.2);
      sp(g, x, y, pick(GREY, clamp(0.5 + fold * 0.3 - y / 120, 0, 0.999), x, y));
    }
    rect(g, 1, 20, 14, 2, GOLD[2]); rect(g, 1, 20, 14, 1, GOLD[3]);
    outline(g);
    return { c: toCanvas(g), ox: 0, oy: -6 };
  }
  function studyDesk() {
    var g = G(48, 44), x, y;
    /* the top: dark polished wood with a lighter edge; the front panels and feet */
    rect(g, 0, 14, 48, 8, DARKWOOD[3]); rect(g, 0, 14, 48, 1, DARKWOOD[4]); rect(g, 0, 21, 48, 2, DARKWOOD[1]);
    rect(g, 1, 23, 46, 17, DARKWOOD[2]); rect(g, 1, 23, 2, 17, DARKWOOD[3]); rect(g, 45, 23, 2, 17, DARKWOOD[1]);
    [[5, 26], [33, 26]].forEach(function (p) { rect(g, p[0], p[1], 10, 10, DARKWOOD[1]); rect(g, p[0] + 1, p[1] + 1, 8, 8, DARKWOOD[3]); sp(g, p[0] + 5, p[1] + 5, GOLD[4]); });
    rect(g, 18, 24, 12, 4, DARKWOOD[1]); rect(g, 23, 25, 2, 2, GOLD[3]);
    rect(g, 1, 40, 4, 3, DARKWOOD[0]); rect(g, 43, 40, 4, 3, DARKWOOD[0]);
    /* the lamp: a brass foot and a green glass shade */
    rect(g, 6, 8, 2, 7, BRASS[2]); rect(g, 4, 13, 6, 2, BRASS[3]);
    for (y = 2; y < 9; y++) for (x = 7 - (y - 1); x <= 7 + (y - 1); x++) sp(g, x, y, y < 4 ? '#7ac08a' : x < 7 ? '#3a8a5a' : '#2a6a48');
    rect(g, 1, 9, 13, 1, BRASS[3]);
    /* papers, an open letter, a quill in its pot, a small sealed jar */
    rect(g, 16, 11, 10, 4, '#f4ecd8'); rect(g, 17, 12, 7, 1, '#8a7a6a'); rect(g, 17, 13, 5, 1, '#8a7a6a');
    rect(g, 27, 12, 8, 3, '#ece2c8'); rect(g, 28, 13, 5, 1, '#8a7a6a');
    rect(g, 38, 9, 4, 5, IRON[2]); line(g, 40, 9, 44, 1, '#f4f0ea'); line(g, 41, 9, 45, 2, '#c8c0b8');
    rect(g, 12, 8, 3, 6, '#cfe2ea'); rect(g, 12, 7, 3, 2, WAX[2]);
    outline(g);
    return { c: toCanvas(g), ox: 0, oy: -12 };
  }
  function studyWindow() {
    var g = G(32, 34), x, y;
    for (y = 0; y < 34; y++) for (x = 0; x < 32; x++) {
      var dx = (x - 15.5) / 15.5, dy = (y - 16.5) / 16.5, q = dx * dx + dy * dy;
      if (q > 1) continue;
      var col;
      if (q > 0.78) col = q > 0.9 ? GOLD[1] : GOLD[3];
      else if (x % 6 === 3 || y % 6 === 3) col = GOLD[2];
      else col = y < 12 ? '#9ad0f0' : y < 20 ? '#f4d8a0' : '#f0b070';
      sp(g, x, y, col);
    }
    rect(g, 15, 1, 2, 32, GOLD[2]);
    outline(g);
    return { c: toCanvas(g), ox: 0, oy: -10 };
  }

  /* ================= THE FAIR ================= */
  var AWNING = { hats: ['#3a8a6a', '#5ab08a'], frames: ['#3a5ab0', '#6a8ae0'], lanterns: ['#c8443a', '#e86a5a'], sweets: ['#b0508a', '#d878b0'] };
  function fairStall(kind) {
    var g = G(48, 40), x, y, A = AWNING[kind];
    /* posts, a counter with a cloth front, the striped awning */
    [1, 45].forEach(function (px) { rect(g, px, 6, 2, 32, WOOD[2]); sp(g, px, 6, WOOD[4]); });
    rect(g, 0, 22, 48, 3, WOOD[4]); rect(g, 0, 22, 48, 1, WOOD[5]);
    for (y = 25; y < 38; y++) for (x = 0; x < 48; x++) sp(g, x, y, y === 25 ? A[1] : (x % 8 < 4 ? '#f4ead0' : A[0]));
    for (x = 0; x < 48; x++) for (y = 0; y < 7; y++) sp(g, x, y, (Math.floor(x / 6) % 2) ? '#f8f0dc' : (y < 2 ? A[1] : A[0]));
    for (x = 0; x < 48; x += 6) { sp(g, x + 2, 7, A[0]); sp(g, x + 3, 7, A[0]); sp(g, x + 2, 8, A[0]); }
    /* the wares on the counter */
    var i, cx;
    if (kind === 'hats') {
      [['#e0b040', '#f4d070'], ['#c8443a', '#e86a5a'], ['#3a6ab0', '#6a9ae0'], ['#5a9a4a', '#8ac870']].forEach(function (c, k) {
        cx = 7 + k * 11; rect(g, cx - 4, 20, 10, 2, c[0]); rect(g, cx - 2, 15, 6, 5, c[0]); rect(g, cx - 2, 15, 3, 2, c[1]); rect(g, cx - 2, 18, 6, 1, '#f4ead0');
      });
    } else if (kind === 'frames') {
      [['#c8962a', '#9ad0f0'], ['#8e5f33', '#b8e0a0'], ['#e8c050', '#f4c8b0']].forEach(function (c, k) {
        cx = 6 + k * 14; rect(g, cx, 11, 10, 11, c[0]); rect(g, cx + 2, 13, 6, 7, c[1]); sp(g, cx + 4, 16, '#ffffff'); rect(g, cx + 3, 18, 4, 1, '#5a8a4a');
      });
    } else if (kind === 'lanterns') {
      for (i = 0; i < 4; i++) {
        cx = 7 + i * 11; rect(g, cx - 1, 11, 4, 1, IRON[3]); rect(g, cx - 2, 12, 6, 8, IRON[2]);
        rect(g, cx - 1, 13, 4, 6, i % 2 ? '#ffd27a' : '#ffe8a8'); rect(g, cx - 3, 20, 8, 2, IRON[3]);
      }
    } else {
      [['#e86a8a'], ['#f4c040'], ['#6ac0a0'], ['#a878d8']].forEach(function (c, k) {
        cx = 6 + k * 11; rect(g, cx, 13, 7, 9, '#d8eef4'); rect(g, cx + 1, 16, 5, 6, c[0]); rect(g, cx, 12, 7, 2, WOOD[3]);
        sp(g, cx + 2, 17, '#ffffff'); sp(g, cx + 4, 19, '#ffffff');
      });
    }
    outline(g);
    return { c: toCanvas(g), ox: 0, oy: -24 };
  }

  /* ---------- registry ---------- */
  var PAINT = {
    stone_steps: stoneSteps,
    landing_gate: landingGate,
    ivy_veil: ivyVeil,
    ramen_cart: ramenCart,
    landing_cot: landingCot,
    athenaeum_door: athenaeumDoor,
    council_seal: councilSeal,
    council_banner: councilBanner,
    tall_shelf: tallShelf,
    law_lectern: lawLectern,
    council_seat_e: function () { return councilSeat('e'); },
    council_seat_w: function () { return councilSeat('w'); },
    council_seat_h: function () { return councilSeat('h'); },
    chain_post: chainPost,
    hourglass_stand: hourglassStand,
    veil_curtain: veilCurtain,
    study_desk: studyDesk,
    study_window: studyWindow,
    fair_stall_hats: function () { return fairStall('hats'); },
    fair_stall_frames: function () { return fairStall('frames'); },
    fair_stall_lanterns: function () { return fairStall('lanterns'); },
    fair_stall_sweets: function () { return fairStall('sweets'); }
  };
  /* anchors of each picture (its painter's own ox, oy), so a baked picture is placed without painting it */
  var AT = {
    stone_steps: [0, 0], landing_gate: [0, -28], ivy_veil: [-1, -24], ramen_cart: [0, -28], landing_cot: [0, -18],
    athenaeum_door: [-4, -24], council_seal: [-2, -14], council_banner: [1, -8], tall_shelf: [0, -44], law_lectern: [-4, -18],
    council_seat_e: [0, -32], council_seat_w: [0, -32], council_seat_h: [0, -32], chain_post: [-6, -10], hourglass_stand: [0, -24],
    veil_curtain: [0, -6], study_desk: [0, -12], study_window: [0, -10],
    fair_stall_hats: [0, -24], fair_stall_frames: [0, -24], fair_stall_lanterns: [0, -24], fair_stall_sweets: [0, -24]
  };
  var INFO = {
    stone_steps: { fw: 1, fh: 1, solid: false, decor: true, still: true },
    landing_gate: { fw: 2, fh: 1, solid: true, still: true },
    ivy_veil: { fw: 1, fh: 1, solid: true, still: true },
    ramen_cart: { fw: 2, fh: 1, solid: true, still: true, light: { dx: 27, dy: -16, r: 40, color: '#ffc070', flicker: false } },
    landing_cot: { fw: 2, fh: 1, solid: true, still: true },
    athenaeum_door: { fw: 1, fh: 1, solid: false, decor: true, still: true },
    council_seal: { fw: 1, fh: 1, solid: true, still: true },
    council_banner: { fw: 1, fh: 1, solid: false, decor: true, still: true },
    tall_shelf: { fw: 2, fh: 1, solid: true, still: true },
    law_lectern: { fw: 1, fh: 1, solid: true, still: true },
    council_seat_e: { fw: 2, fh: 1, solid: true, still: true },
    council_seat_w: { fw: 2, fh: 1, solid: true, still: true },
    council_seat_h: { fw: 2, fh: 1, solid: true, still: true },
    chain_post: { fw: 1, fh: 1, solid: true, still: true },
    hourglass_stand: { fw: 1, fh: 1, solid: true, still: true },
    veil_curtain: { fw: 1, fh: 1, solid: false, decor: true, still: true },
    study_desk: { fw: 3, fh: 2, solid: true, still: true, light: { dx: 7, dy: -6, r: 46, color: '#ffe0a0', flicker: false } },
    study_window: { fw: 2, fh: 1, solid: false, decor: true, still: true },
    fair_stall_hats: { fw: 3, fh: 1, solid: true, still: true },
    fair_stall_frames: { fw: 3, fh: 1, solid: true, still: true },
    fair_stall_lanterns: { fw: 3, fh: 1, solid: true, still: true },
    fair_stall_sweets: { fw: 3, fh: 1, solid: true, still: true }
  };
  var cache = {}, KEY = {}, PF = {};
  function get(t) {
    var s = cache[t];
    if (s) return s;
    try { s = PAINT[t](); } catch (e) { s = null; }
    if (!s) return null;
    cache[t] = s;
    if (s.ox !== AT[t][0] || s.oy !== AT[t][1]) { AT[t] = [s.ox, s.oy]; try { console.warn('props_ch10: anchor of ' + t + ' changed; update AT'); } catch (e) { /* no console */ } }
    if (H.sheets && H.sheets.recording) H.sheets.rec('outdoor', KEY[t], s.c);
    return s;
  }
  function paintOf(t) { return function () { var s = get(t); return s && s.c; }; }
  Object.keys(PAINT).forEach(function (t) { KEY[t] = 'p10:' + t; PF[t] = paintOf(t); });

  var base = H.propsOutdoor || { info: {}, draw: function () {} };
  var oldDraw = base.draw;
  for (var key in INFO) base.info[key] = INFO[key];
  base.draw = function (ctx, type, px, py, env) {
    if (!PAINT[type]) return oldDraw.call(base, ctx, type, px, py, env);
    var x = Math.round(px + AT[type][0]), y = Math.round(py + AT[type][1]);
    if (H.sheets) { H.sheets.draw(ctx, KEY[type], x, y, PF[type]); return; }
    var s = get(type);
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
