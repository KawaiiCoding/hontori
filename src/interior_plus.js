window.H = window.H || {};
(function () {
  'use strict';
  // interior_plus: extends H.furniture and H.tilesIndoor with extra cozy home pieces.
  var T = 16;

  function mk(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    return { c: c, g: g };
  }
  function P(g, x, y, col, w, h) { g.fillStyle = col; g.fillRect(x | 0, y | 0, w || 1, h || 1); }
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
  function ell(g, cx, cy, rx, ry, col) {
    for (var y = -ry; y <= ry; y++) for (var x = -rx; x <= rx; x++)
      if ((x * x) / (rx * rx + 0.3) + (y * y) / (ry * ry + 0.3) <= 1) P(g, cx + x, cy + y, col);
  }
  function hash(a, b) { var h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function shadow(g, x, y, w, h) { g.fillStyle = 'rgba(20,10,5,0.28)'; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(20,10,5,0.16)'; g.fillRect(x - 1, y + 1, w + 2, h - 2); }
  function dither(g, x, y, w, h, col, ph) {
    for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++)
      if (((xx + yy + (ph || 0)) & 1) === 0) P(g, x + xx, y + yy, col);
  }

  var OL = '#2a1a14';
  var WOOD = ['#8a5a34', '#b07a48', '#5e3a20'];
  var DWOOD = ['#5e3a22', '#7c5030', '#3c2414'];
  var LWOOD = ['#c08a52', '#dcaa6e', '#94643a'];
  var BRASS = ['#d9b45a', '#fff0b0', '#9a7a30'];

  // little book row helper
  function books(g, x, y, w, h) {
    var cols = ['#b0403a', '#3f6fa0', '#5f9a50', '#d8a040', '#7a4a90', '#c86a3a'];
    var i = 0;
    while (x < w) {
      var bw = 2 + ((hash(x, y) * 2) | 0), bh = h - ((hash(y, x) * 3) | 0);
      if (x + bw > w) bw = w - x;
      var c = cols[(i + ((hash(x, 7) * 6) | 0)) % 6];
      P(g, x, y + h - bh, OL, bw, bh);
      P(g, x, y + h - bh + 1, c, bw - (bw > 2 ? 1 : 0), bh - 1);
      P(g, x, y + h - bh + 2, 'rgba(255,240,200,0.5)', 1, 1);
      x += bw; i++;
    }
  }

  var painters = {};
  var HD = H._hd;
  var anim = {}; // type -> {frames:[], fps, ox, oy}

  // ---------------- furniture ----------------
  painters.armchair = function () {
    var s = HD.mk2(18, 26), g = s.g, vol = HD.vol, rr = HD.rr;
    var R = ['#532433', '#7d3c4d', '#a3546a', '#c98296'];
    HD.softShadow(g, 3, 43, 32, 8);
    // legs
    P(g, 3, 42, OL, 4, 6); P(g, 4, 43, DWOOD[1], 2, 4); P(g, 29, 42, OL, 4, 6); P(g, 30, 43, DWOOD[1], 2, 4);
    // tall rounded back
    vol(g, 4, 2, 28, 30, 7, R, OL);
    P(g, 13, 12, R[0], 2, 2); P(g, 22, 12, R[0], 2, 2); P(g, 17, 19, R[0], 2, 2); // tufting
    // seat cushion
    vol(g, 7, 26, 22, 15, 4, [R[0], R[2], R[3], '#e0a4b4'], OL);
    // little pillow
    vol(g, 10, 18, 13, 12, 4, ['#b08030', '#e0b050', '#f4d47a', '#fff0b8'], OL);
    // arms
    vol(g, 0, 18, 10, 25, 5, R, OL); vol(g, 26, 18, 10, 25, 5, R, OL);
    // knit throw over the right arm
    rr(g, 26, 22, 10, 18, 2, OL); P(g, 27, 23, '#e8d8a0', 8, 16);
    for (var y = 25; y < 38; y += 4) P(g, 27, y, '#c8b070', 8, 2);
    P(g, 27, 23, '#f8ecc0', 8, 1);
    P(g, 28, 40, '#e8d8a0', 2, 2); P(g, 32, 40, '#e8d8a0', 2, 2);
    return { c: s.c, ox: -1, oy: -8 };
  };

  painters.desk = function () {
    var s = mk(16, 30), g = s.g;
    shadow(g, 1, 27, 15, 3);
    // desk body
    box(g, 0, 12, 16, 16, WOOD[0], WOOD[1], WOOD[2], OL);
    P(g, 1, 13, LWOOD[1], 14, 1);
    // drawers
    box(g, 2, 17, 12, 5, WOOD[1], LWOOD[1], WOOD[2], OL); P(g, 7, 19, BRASS[0], 2, 1);
    box(g, 2, 22, 12, 5, WOOD[1], LWOOD[1], WOOD[2], OL); P(g, 7, 24, BRASS[0], 2, 1);
    // book stack
    P(g, 1, 7, OL, 6, 6);
    P(g, 2, 8, '#3f6fa0', 4, 1); P(g, 2, 9, OL, 4, 1); P(g, 2, 10, '#b0403a', 5, 1); P(g, 2, 11, '#5f9a50', 4, 1);
    P(g, 2, 8, '#7fa8d0'); P(g, 2, 10, '#e07a6a');
    // open book
    P(g, 6, 11, OL, 6, 2); P(g, 6, 11, '#f4ead0', 2, 1); P(g, 9, 11, '#f4ead0', 2, 1); P(g, 8, 11, '#a08868');
    P(g, 6, 11, '#c8b890');
    // ink pot + quill
    P(g, 11, 9, OL, 3, 4); P(g, 12, 10, '#24304a', 1, 2); P(g, 12, 10, '#5a70a0');
    P(g, 13, 4, '#f6f0e0', 1, 5); P(g, 14, 3, '#f6f0e0', 1, 3); P(g, 12, 5, '#d8d0c0', 1, 2);
    // little lamp (brass, green shade)
    P(g, 3, 1, OL, 6, 4); P(g, 4, 1, '#3c8a5a', 4, 3); P(g, 4, 1, '#6cc08a', 4, 1);
    P(g, 3, 4, '#fff2b0', 6, 1);
    P(g, 5, 5, BRASS[2], 1, 3); P(g, 4, 6, BRASS[0], 3, 1);
    // warm light pool on desk
    g.fillStyle = 'rgba(255,220,130,0.22)'; g.fillRect(1, 12, 10, 3);
    return { c: s.c, ox: 0, oy: -12 };
  };

  painters.wardrobe = function () {
    var s = mk(32, 42), g = s.g;
    shadow(g, 1, 39, 31, 3);
    // crown
    box(g, 0, 0, 32, 5, DWOOD[1], '#9a6a40', DWOOD[2], OL);
    P(g, 2, 1, '#b08050', 28, 1);
    // body
    box(g, 1, 4, 30, 34, DWOOD[0], DWOOD[1], DWOOD[2], OL);
    // two doors with panels
    for (var d = 0; d < 2; d++) {
      var x = 3 + d * 13;
      box(g, x, 6, 13, 24, DWOOD[1], '#9a6a40', DWOOD[2], OL);
      box(g, x + 2, 8, 9, 9, DWOOD[0], DWOOD[1], DWOOD[2], '#3c2414');
      box(g, x + 2, 19, 9, 9, DWOOD[0], DWOOD[1], DWOOD[2], '#3c2414');
      // carved star
      P(g, x + 6, 11, BRASS[0]); P(g, x + 5, 12, BRASS[0], 3, 1); P(g, x + 6, 13, BRASS[0]);
    }
    // knobs
    P(g, 14, 18, BRASS[0], 1, 2); P(g, 17, 18, BRASS[0], 1, 2); P(g, 14, 18, BRASS[1]);
    // drawer at bottom
    box(g, 3, 30, 26, 6, DWOOD[1], '#9a6a40', DWOOD[2], OL);
    P(g, 14, 32, BRASS[0], 4, 1);
    // scarf peeking out of the door
    P(g, 16, 24, '#d04a3a', 2, 5); P(g, 16, 28, '#f0e0a0', 2, 1); P(g, 17, 24, '#a03028', 1, 5);
    // feet
    P(g, 2, 38, OL, 3, 3); P(g, 27, 38, OL, 3, 3);
    // hat box on top
    P(g, 20, -1 + 1, OL, 0, 0);
    return { c: s.c, ox: 0, oy: -26 };
  };

  painters.dresser = function () {
    var s = mk(16, 28), g = s.g;
    shadow(g, 1, 25, 15, 3);
    box(g, 0, 9, 16, 17, LWOOD[0], LWOOD[1], LWOOD[2], OL);
    P(g, 0, 9, OL, 16, 1); P(g, 1, 10, '#ecc088', 14, 1);
    for (var i = 0; i < 3; i++) {
      box(g, 2, 12 + i * 4, 12, 4, LWOOD[1], '#ecc088', LWOOD[2], OL);
      P(g, 5, 13 + i * 4, BRASS[0]); P(g, 10, 13 + i * 4, BRASS[0]);
    }
    // mirror (oval)
    ell(g, 8, 4, 5, 5, OL); ell(g, 8, 4, 4, 4, '#9fc4d8');
    P(g, 6, 2, '#e8f6ff', 1, 3); P(g, 7, 1, '#e8f6ff'); P(g, 10, 6, '#6a90a8', 2, 1);
    P(g, 3, 4, BRASS[0], 1, 3); P(g, 12, 4, BRASS[0], 1, 3);
    P(g, 7, 9, BRASS[2], 2, 1);
    // perfume bottle + brush
    P(g, 2, 7, OL, 3, 3); P(g, 3, 8, '#e080b0'); P(g, 3, 6, BRASS[0]);
    P(g, 11, 8, OL, 4, 2); P(g, 12, 8, '#a06a40', 2, 1);
    return { c: s.c, ox: 0, oy: -10 };
  };

  painters.kid_bed = function () {
    var s = mk(16, 36), g = s.g;
    shadow(g, 1, 33, 15, 3);
    // frame painted pale blue
    var B = ['#6a8ec0', '#90b4e0', '#44628c'];
    box(g, 0, 0, 16, 34, B[0], B[1], B[2], OL);
    box(g, 0, 0, 16, 7, B[1], '#c0d8f4', B[2], OL);
    // headboard star cutouts
    P(g, 4, 3, '#ffe890'); P(g, 3, 4, '#ffe890', 3, 1); P(g, 4, 5, '#ffe890');
    P(g, 11, 2, '#ffe890'); P(g, 10, 3, '#ffe890', 3, 1); P(g, 11, 4, '#ffe890');
    // sheet
    P(g, 1, 7, '#eee8dc', 14, 25);
    // pillow
    box(g, 2, 7, 12, 6, '#fbf8f0', '#ffffff', '#d6cebe', '#8d8270');
    // teddy on pillow
    disc(g, 5, 9, 2, OL); disc(g, 5, 9, 1, '#b07a48');
    P(g, 3, 7, OL, 2, 2); P(g, 6, 7, OL, 2, 2); P(g, 3, 7, '#b07a48'); P(g, 7, 7, '#b07a48');
    P(g, 4, 9, OL); P(g, 6, 9, OL); P(g, 5, 10, '#e0b080');
    P(g, 3, 12, OL, 5, 3); P(g, 4, 12, '#b07a48', 3, 2); P(g, 4, 12, '#d04a3a', 3, 1);
    // patchwork quilt with stitching
    P(g, 1, 14, OL, 14, 1);
    var cols = ['#e0705a', '#f0c050', '#6aa0d0', '#80b870', '#c080c0', '#f09a60'];
    for (var y = 15; y < 31; y += 4) for (var x = 1; x < 15; x += 4) {
      var k = ((hash(x, y) * 6) | 0);
      var c = cols[k];
      P(g, x, y, c, 4, 4);
      P(g, x, y, 'rgba(255,255,255,0.3)', 4, 1);
      P(g, x, y + 3, 'rgba(0,0,0,0.2)', 4, 1);
      if (k & 1) { P(g, x + 1, y + 1, 'rgba(255,255,255,0.45)'); P(g, x + 2, y + 2, 'rgba(255,255,255,0.45)'); }
      else { P(g, x + 1, y + 2, 'rgba(0,0,0,0.15)', 2, 1); }
      // stitches
      P(g, x + 3, y + 1, 'rgba(60,30,20,0.35)'); P(g, x + 1, y + 3, 'rgba(60,30,20,0.35)');
    }
    P(g, 1, 14, '#f8f2e6', 14, 1);
    P(g, 1, 30, '#b05a4a', 14, 2);
    // footboard
    P(g, 0, 31, OL, 16, 3); P(g, 1, 31, B[1], 14, 1); P(g, 1, 32, B[2], 14, 1);
    return { c: s.c, ox: 0, oy: -2 };
  };

  painters.toybox = function () {
    var s = mk(16, 22), g = s.g;
    shadow(g, 1, 19, 15, 3);
    // toys sticking out
    P(g, 3, 0, OL, 2, 6); P(g, 3, 0, '#e04040', 1, 6); // sword
    P(g, 2, 2, BRASS[0], 4, 1);
    disc(g, 10, 4, 3, OL); disc(g, 10, 4, 2, '#4a90e0'); P(g, 9, 2, '#a0d0ff', 2, 1); P(g, 10, 4, '#f0e040', 3, 1); // ball
    P(g, 13, 1, OL, 2, 5); P(g, 13, 1, '#60b060', 1, 4); // block
    // box
    box(g, 0, 6, 16, 14, '#c05a3a', '#e08060', '#8a3a24', OL);
    // lid edge
    P(g, 0, 6, OL, 16, 3); P(g, 1, 7, '#e8906a', 14, 1);
    // painted letters/blocks
    box(g, 2, 11, 4, 4, '#f0d060', '#fff0a0', '#c0a030', OL); P(g, 3, 12, '#c04040', 2, 2);
    box(g, 6, 11, 4, 4, '#60a0e0', '#a0d0ff', '#3a70b0', OL); P(g, 7, 12, '#fff', 2, 1);
    box(g, 10, 11, 4, 4, '#70c070', '#a8e8a0', '#409040', OL); P(g, 11, 13, '#fff', 2, 1);
    P(g, 1, 17, '#8a3a24', 14, 1);
    return { c: s.c, ox: 0, oy: -4 };
  };

  painters.piano = function () {
    var s = mk(32, 30), g = s.g;
    shadow(g, 1, 27, 31, 3);
    var K = ['#3a2430', '#5a3a48', '#20121a'];
    // upright body
    box(g, 0, 0, 32, 20, K[0], K[1], K[2], OL);
    P(g, 1, 1, '#7a5464', 30, 1);
    // music stand + sheet music
    P(g, 9, 3, OL, 14, 8); P(g, 10, 4, '#f4ecd8', 6, 6); P(g, 16, 4, '#ece0c8', 6, 6);
    for (var l = 0; l < 4; l++) { P(g, 10, 5 + l, '#8a7a6a', 6, 1); P(g, 16, 5 + l, '#8a7a6a', 6, 1); }
    P(g, 12, 6, OL); P(g, 14, 7, OL); P(g, 18, 5, OL); P(g, 20, 8, OL);
    // candle sconces
    P(g, 3, 4, BRASS[0], 3, 1); P(g, 4, 1, '#f0e6cc', 1, 3); P(g, 4, 0, '#ffd36a');
    P(g, 26, 4, BRASS[0], 3, 1); P(g, 27, 1, '#f0e6cc', 1, 3); P(g, 27, 0, '#ffd36a');
    // carved panel
    P(g, 3, 12, K[2], 26, 1);
    // keyboard
    P(g, 0, 17, OL, 32, 6);
    P(g, 1, 18, '#f6f2e8', 30, 4);
    for (var k = 1; k < 31; k += 2) P(g, k, 21, '#c8c0b0');
    for (var b = 2; b < 30; b += 2) { if (b % 14 === 6 || b % 14 === 12) continue; P(g, b, 18, '#1a1014', 1, 2); }
    // lower body
    box(g, 1, 22, 30, 6, K[0], K[1], K[2], OL);
    P(g, 6, 26, BRASS[0], 2, 1); P(g, 24, 26, BRASS[0], 2, 1); // pedals
    return { c: s.c, ox: 0, oy: -14 };
  };

  painters.dining_table = function () {
    var s = mk(48, 36), g = s.g;
    shadow(g, 2, 31, 46, 4);
    // tabletop
    box(g, 0, 2, 48, 26, WOOD[0], WOOD[1], WOOD[2], OL);
    for (var y = 6; y < 26; y += 5) P(g, 1, y, '#7a4c2a', 46, 1);
    // tablecloth runner
    P(g, 2, 9, '#f0e8d4', 44, 10);
    for (var x = 2; x < 46; x += 2) { P(g, x, 9, '#c84a3a'); P(g, x + 1, 18, '#c84a3a'); }
    dither(g, 2, 10, 44, 1, '#e0d6c0', 0);
    // plates
    function plate(cx, cy) {
      ell(g, cx, cy, 4, 3, OL); ell(g, cx, cy, 3, 2, '#f8f4ec'); ell(g, cx, cy, 2, 1, '#e4dccc');
      P(g, cx - 2, cy - 2, '#ffffff', 2, 1);
    }
    plate(8, 6); plate(24, 5); plate(40, 6); plate(8, 22); plate(40, 22);
    // stew in a plate
    ell(g, 24, 23, 4, 3, OL); ell(g, 24, 23, 3, 2, '#c87a3a'); P(g, 23, 22, '#e8a050', 2, 1); P(g, 25, 23, '#70a040');
    // bread loaf on board
    P(g, 13, 12, OL, 11, 7); P(g, 14, 13, '#a87040', 9, 5);
    ell(g, 18, 14, 4, 2, OL); ell(g, 18, 14, 3, 1, '#d89a50'); P(g, 16, 13, '#f0c070', 3, 1);
    P(g, 17, 14, '#9a5a28'); P(g, 19, 14, '#9a5a28');
    // candle in holder (flame drawn static, light from info)
    P(g, 30, 13, OL, 5, 3); P(g, 31, 14, BRASS[0], 3, 1);
    P(g, 31, 6, OL, 3, 8); P(g, 32, 7, '#f6eed8', 1, 7);
    P(g, 32, 4, '#ff9a3c', 1, 2); P(g, 32, 5, '#fff0a0');
    // mugs + salt
    P(g, 38, 12, OL, 4, 5); P(g, 39, 13, '#5a8ac0', 2, 3); P(g, 42, 14, OL, 1, 2);
    P(g, 4, 13, OL, 3, 4); P(g, 5, 14, '#ffffff', 1, 2);
    // apron edge / legs
    P(g, 0, 27, OL, 48, 3); P(g, 1, 27, WOOD[2], 46, 2);
    P(g, 2, 29, OL, 3, 6); P(g, 43, 29, OL, 3, 6);
    P(g, 3, 29, WOOD[0], 1, 5); P(g, 44, 29, WOOD[0], 1, 5);
    return { c: s.c, ox: 0, oy: -4 };
  };

  painters.counter = function () {
    var s = mk(32, 26), g = s.g;
    shadow(g, 1, 23, 31, 3);
    // stone top
    box(g, 0, 6, 32, 6, '#c8c0b4', '#e4dcd0', '#9a9284', OL);
    dither(g, 1, 8, 30, 2, '#b0a89a', 1);
    // cabinets
    box(g, 0, 11, 32, 13, LWOOD[0], LWOOD[1], LWOOD[2], OL);
    box(g, 2, 13, 13, 9, LWOOD[1], '#ecc088', LWOOD[2], OL);
    box(g, 17, 13, 13, 9, LWOOD[1], '#ecc088', LWOOD[2], OL);
    P(g, 13, 16, BRASS[0], 1, 3); P(g, 18, 16, BRASS[0], 1, 3);
    // cutting board
    P(g, 3, 5, OL, 14, 6); P(g, 4, 6, '#d8a868', 12, 4); P(g, 4, 6, '#f0c888', 12, 1);
    // knife
    P(g, 5, 7, '#e0e4ec', 5, 1); P(g, 10, 7, DWOOD[2], 2, 1);
    // carrots
    P(g, 9, 8, OL, 5, 2); P(g, 10, 8, '#f08030', 3, 1); P(g, 13, 7, '#60b040', 2, 1);
    // chopped slices
    P(g, 6, 9, '#f08030'); P(g, 8, 9, '#f08030');
    // cabbage / tomato
    disc(g, 21, 6, 3, OL); disc(g, 21, 6, 2, '#70b050'); P(g, 20, 5, '#a8e080', 2, 1); P(g, 21, 7, '#4a8030');
    disc(g, 27, 7, 2, OL); disc(g, 27, 7, 1, '#e04030'); P(g, 26, 6, '#ff9080'); P(g, 27, 5, '#60b040');
    // onion basket
    P(g, 24, 2, OL, 0, 0);
    return { c: s.c, ox: 0, oy: -8 };
  };

  painters.sink = function () {
    var s = mk(16, 26), g = s.g;
    shadow(g, 1, 23, 15, 3);
    box(g, 0, 6, 16, 6, '#c8c0b4', '#e4dcd0', '#9a9284', OL);
    // basin
    P(g, 2, 7, OL, 12, 5); P(g, 3, 8, '#7aa8c8', 10, 3); P(g, 3, 8, '#b8dcf0', 10, 1);
    P(g, 5, 9, '#ffffff'); P(g, 9, 10, '#e0f4ff');
    // tap
    P(g, 7, 1, OL, 3, 6); P(g, 8, 1, '#c0c8d0', 1, 5); P(g, 8, 4, '#c0c8d0', 3, 1); P(g, 10, 5, '#c0c8d0');
    P(g, 6, 2, '#e04040'); P(g, 10, 2, '#4080e0');
    // soap + sponge
    P(g, 12, 3, OL, 3, 4); P(g, 13, 4, '#80d0a0', 1, 2);
    P(g, 1, 4, OL, 4, 3); P(g, 2, 5, '#f0d040', 2, 1);
    // cabinet with curtain
    box(g, 0, 11, 16, 13, LWOOD[0], LWOOD[1], LWOOD[2], OL);
    P(g, 2, 13, '#d8e8c8', 12, 9);
    for (var x = 2; x < 14; x += 2) P(g, x, 13, '#a8c098', 1, 9);
    for (var x2 = 2; x2 < 14; x2 += 4) P(g, x2 + 1, 15, '#f08080');
    P(g, 2, 13, '#b8d0a8', 12, 1);
    return { c: s.c, ox: 0, oy: -8 };
  };

  painters.firewood = function () {
    var s = mk(16, 20), g = s.g;
    shadow(g, 1, 17, 15, 3);
    // rack
    P(g, 1, 4, OL, 2, 14); P(g, 13, 4, OL, 2, 14); P(g, 1, 16, OL, 14, 2);
    P(g, 2, 5, '#606060', 1, 12); P(g, 14, 5, '#606060', 1, 12);
    // logs stacked (end grain)
    var pos = [[4, 13], [8, 13], [12, 13], [6, 9], [10, 9], [8, 5]];
    for (var i = 0; i < pos.length; i++) {
      var cx = pos[i][0], cy = pos[i][1];
      disc(g, cx, cy, 2, OL); disc(g, cx, cy, 1, '#d8b080');
      P(g, cx, cy, '#a87a48'); P(g, cx - 1, cy - 1, '#f0d0a0');
      P(g, cx + 2, cy - 1, '#6b4022');
    }
    // axe leaning
    P(g, 13, 0, OL, 2, 10); P(g, 14, 1, '#a07040', 1, 8);
    P(g, 11, 0, OL, 4, 3); P(g, 11, 1, '#c0c8d0', 2, 1);
    return { c: s.c, ox: 0, oy: -4 };
  };

  function buildCat() {
    var N = 8, frames = [];
    for (var f = 0; f < N; f++) {
      var s = mk(16, 22), g = s.g;
      var br = Math.sin(f / N * Math.PI * 2); // breathing
      var lift = br > 0.3 ? 1 : 0;
      shadow(g, 1, 17, 15, 3);
      // basket bed
      ell(g, 8, 14, 7, 4, OL); ell(g, 8, 14, 6, 3, '#b08050');
      for (var x = 2; x < 15; x += 2) P(g, x, 15, '#8a5a30');
      ell(g, 8, 13, 5, 2, '#c06070'); // cushion
      P(g, 4, 12, '#e090a0', 3, 1);
      // curled cat (ginger)
      var cy = 11 - lift;
      ell(g, 8, cy + 1, 5, 3 + lift * 0, OL);
      ell(g, 8, cy + 1, 4, 2, '#e09040');
      P(g, 5, cy, '#f0b060', 5, 1);
      P(g, 6, cy + 2, '#b06a28', 1, 1); P(g, 9, cy + 2, '#b06a28', 1, 1); // stripes
      P(g, 7, cy, '#b06a28');
      // head on left
      disc(g, 4, cy + 1, 2, OL); disc(g, 4, cy + 1, 1, '#f0a050');
      P(g, 2, cy - 2, OL, 2, 2); P(g, 5, cy - 2, OL, 2, 2); P(g, 3, cy - 1, '#f0a050'); P(g, 5, cy - 1, '#f0a050');
      P(g, 3, cy + 1, OL); P(g, 5, cy + 1, OL); // closed eyes
      P(g, 4, cy + 2, '#f08090');
      // tail wrapping
      P(g, 9, cy + 3, OL, 4, 1); P(g, 4, cy + 3, OL, 5, 1); P(g, 5, cy + 3, '#e09040', 6, 1);
      P(g, 12, cy + 2, '#fff0d0');
      // zzz
      var zf = f % N;
      var zz = [[11, 6 - (zf >> 2)], [13, 3 - (zf >> 2)]];
      P(g, zz[0][0], zz[0][1], '#e8f0ff', 2, 1); P(g, zz[0][0] + 1, zz[0][1] + 1, '#e8f0ff'); P(g, zz[0][0], zz[0][1] + 2, '#e8f0ff', 2, 1);
      if (zf >= 3) { P(g, zz[1][0], zz[1][1], '#b8c8f0', 3, 1); P(g, zz[1][0] + 1, zz[1][1] + 1, '#b8c8f0'); P(g, zz[1][0], zz[1][1] + 2, '#b8c8f0', 3, 1); }
      frames.push(s.c);
    }
    anim.cat_bed = { frames: frames, fps: 3, ox: 0, oy: -6 };
  }

  painters.telescope = function () {
    var s = mk(16, 28), g = s.g;
    shadow(g, 2, 25, 13, 3);
    // tripod
    P(g, 7, 13, OL, 2, 3);
    for (var i = 0; i < 10; i++) { P(g, 7 - (i >> 1), 15 + i, OL, 2, 1); P(g, 8 + (i >> 1), 15 + i, OL, 2, 1); P(g, 7, 15 + i, OL, 2, 1); }
    for (var j = 0; j < 9; j++) { P(g, 7 - (j >> 1), 16 + j, DWOOD[1]); P(g, 9 + (j >> 1), 16 + j, DWOOD[1]); }
    // tube diagonal to upper-right
    for (var k = 0; k < 12; k++) {
      var x = 2 + k, y = 14 - k;
      P(g, x, y - 1, OL, 2, 4);
      P(g, x, y, '#3a5a8a', 1, 2); P(g, x + 1, y, '#2a3a60', 1, 2); P(g, x, y, '#7aa0d0');
    }
    // brass rings & eyepiece & lens
    P(g, 5, 9, BRASS[0], 2, 4); P(g, 10, 4, BRASS[0], 2, 4);
    P(g, 0, 14, OL, 3, 3); P(g, 1, 15, BRASS[0]);
    P(g, 13, 0, OL, 3, 4); P(g, 14, 1, '#a0e0ff', 1, 2); P(g, 14, 1, '#ffffff');
    // star chart pinned? small stars sparkle
    return { c: s.c, ox: 0, oy: -12 };
  };

  painters.globe = function () {
    var s = mk(16, 26), g = s.g;
    shadow(g, 2, 23, 13, 3);
    // stand
    P(g, 4, 22, OL, 8, 2); P(g, 5, 22, DWOOD[1], 6, 1);
    P(g, 7, 16, OL, 2, 7); P(g, 7, 16, DWOOD[1], 1, 6);
    // meridian arc
    for (var a = -0.3; a < Math.PI + 0.3; a += 0.08) P(g, 8 + Math.round(Math.cos(a + Math.PI / 2) * 7), 9 - Math.round(Math.sin(a + Math.PI / 2) * 7 * -1) - 0, BRASS[2]);
    // globe
    disc(g, 8, 9, 6, OL); disc(g, 8, 9, 5, '#3a78b8');
    // continents
    var land = [[5, 6, 3, 2], [4, 8, 2, 3], [9, 5, 2, 2], [10, 8, 3, 3], [7, 12, 3, 1], [6, 10, 1, 1]];
    for (var i = 0; i < land.length; i++) P(g, land[i][0], land[i][1], '#6aa858', land[i][2], land[i][3]);
    P(g, 10, 9, '#d8c070'); P(g, 5, 7, '#a0d080');
    // shading + highlight
    for (var y = 4; y < 15; y++) for (var x = 9; x < 14; x++) {
      var dx = x - 8, dy = y - 9;
      if (dx * dx + dy * dy <= 25 && dx * dx + dy * dy > 12 && ((x + y) & 1)) P(g, x, y, 'rgba(10,20,50,0.4)');
    }
    P(g, 5, 5, '#c0e0ff', 2, 1); P(g, 4, 6, '#c0e0ff');
    P(g, 8, 2, BRASS[0], 1, 2); P(g, 8, 15, BRASS[0], 1, 2);
    return { c: s.c, ox: 0, oy: -10 };
  };

  function buildCandles() {
    var N = 6, frames = [];
    var cs = [[4, 6, 7], [8, 3, 10], [12, 8, 5]]; // x, topY, height
    for (var f = 0; f < N; f++) {
      var s = mk(16, 22), g = s.g;
      shadow(g, 2, 19, 13, 2);
      // tray
      ell(g, 8, 18, 7, 2, OL); ell(g, 8, 18, 6, 1, BRASS[0]); P(g, 3, 17, BRASS[1], 4, 1);
      for (var i = 0; i < cs.length; i++) {
        var x = cs[i][0], ty = cs[i][1] + 4, h = cs[i][2];
        P(g, x - 1, ty, OL, 3, h + 1);
        P(g, x, ty, '#f6eed8', 1, h); P(g, x + 1, ty + 1, '#d8ccb0', 0, 0);
        P(g, x, ty, '#fffaf0');
        P(g, x - 1, ty + 2, '#f6eed8'); // wax drip
        // flame flicker
        var fl = Math.sin(f * 1.7 + i * 2.1);
        var fh = 3 + (fl > 0.2 ? 1 : 0);
        var sx = fl > 0.6 ? 1 : fl < -0.6 ? -1 : 0;
        P(g, x, ty - 1, OL);
        P(g, x + (sx > 0 ? 0 : 0), ty - fh, '#ff8a30', 1, fh - 1);
        P(g, x + sx, ty - fh - 0, '#ffb43c');
        P(g, x, ty - 2, '#fff0a0');
        // glow halo
        g.fillStyle = 'rgba(255,200,100,' + (0.12 + 0.04 * fl) + ')';
        g.fillRect(x - 2, ty - fh - 1, 5, fh + 2);
      }
      frames.push(s.c);
    }
    anim.candles = { frames: frames, fps: 8, ox: 0, oy: -6 };
  }

  painters.coat_rack = function () {
    var s = mk(16, 32), g = s.g;
    shadow(g, 3, 29, 11, 3);
    // pole
    P(g, 7, 2, OL, 3, 28); P(g, 8, 2, DWOOD[1], 1, 27);
    P(g, 4, 28, OL, 9, 2); P(g, 5, 28, DWOOD[1], 7, 1);
    // hooks
    P(g, 5, 3, OL, 7, 1); P(g, 6, 1, BRASS[0], 5, 1);
    // hat on top
    P(g, 4, 0, OL, 9, 3); P(g, 5, 0, '#5a4a7a', 7, 2); P(g, 3, 2, OL, 11, 2); P(g, 4, 2, '#7a6aa0', 9, 1);
    // coat hanging left (green)
    P(g, 2, 4, OL, 6, 15); P(g, 3, 5, '#4a7a4a', 4, 13); P(g, 3, 5, '#6aa06a', 1, 12); P(g, 6, 8, '#2e5030', 1, 10);
    P(g, 4, 9, BRASS[0]); P(g, 4, 12, BRASS[0]); P(g, 4, 15, BRASS[0]);
    // scarf right (red striped)
    P(g, 10, 4, OL, 4, 14); P(g, 11, 5, '#d04a3a', 2, 12);
    for (var y = 7; y < 17; y += 3) P(g, 11, y, '#f0e0a0', 2, 1);
    P(g, 11, 17, '#d04a3a'); P(g, 12, 18, '#f0e0a0');
    // umbrella leaning
    P(g, 13, 20, OL, 2, 10); P(g, 13, 21, '#3a5a9a', 1, 8);
    return { c: s.c, ox: 0, oy: -16 };
  };

  painters.stairs = function () {
    var s = mk(32, 48), g = s.g;
    // side walls/stringers
    P(g, 0, 0, OL, 32, 48);
    P(g, 1, 0, '#4a2c18', 30, 48);
    // steps going up (top of art = far/higher)
    var n = 8;
    for (var i = 0; i < n; i++) {
      var y = 48 - (i + 1) * 6;
      var shade = Math.max(0, 1 - i / n);
      P(g, 3, y, OL, 26, 6);
      P(g, 4, y + 1, i % 2 ? '#a06a3a' : '#a8723f', 24, 3); // tread
      P(g, 4, y + 1, '#d0985c', 24, 1); // nose highlight
      P(g, 4, y + 4, '#6a4022', 24, 1); // riser
      g.fillStyle = 'rgba(15,8,20,' + (0.45 - shade * 0.45) + ')';
      g.fillRect(4, y + 1, 24, 5);
      // runner carpet
      P(g, 10, y + 1, '#8a2a3a', 12, 4); P(g, 10, y + 1, '#c04a5a', 12, 1);
      P(g, 10, y + 1, '#d8b060', 1, 4); P(g, 21, y + 1, '#d8b060', 1, 4);
      P(g, 9, y + 4, BRASS[0], 14, 1);
      g.fillStyle = 'rgba(15,8,20,' + (0.45 - shade * 0.45) + ')'; g.fillRect(10, y + 1, 12, 4);
    }
    // darkness at the top landing
    P(g, 3, 0, '#140a10', 26, 2);
    dither(g, 3, 2, 26, 2, '#140a10', 0);
    // banister on right
    P(g, 28, 0, OL, 4, 48); P(g, 29, 0, DWOOD[1], 2, 48); P(g, 29, 0, '#a0703f', 1, 48);
    for (var b = 4; b < 46; b += 6) { P(g, 28, b, BRASS[2], 3, 1); }
    // newel post
    P(g, 26, 34, OL, 6, 14); P(g, 27, 35, DWOOD[1], 4, 12); P(g, 27, 35, '#a0703f', 1, 12);
    P(g, 26, 32, OL, 6, 3); P(g, 27, 32, BRASS[0], 4, 2); P(g, 27, 32, BRASS[1], 2, 1);
    // left wall edge
    P(g, 0, 0, OL, 3, 48); P(g, 1, 0, '#6a4a3a', 1, 48);
    return { c: s.c, ox: 0, oy: -16 };
  };

  painters.doormat = function () {
    var s = mk(32, 16), g = s.g;
    P(g, 1, 3, OL, 30, 11);
    P(g, 2, 4, '#a8783a', 28, 9);
    // coir texture
    for (var y = 4; y < 13; y++) for (var x = 2; x < 30; x++) {
      var v = hash(x, y);
      if (v < 0.25) P(g, x, y, '#8a5a28'); else if (v > 0.85) P(g, x, y, '#c89a58');
    }
    // border
    P(g, 3, 5, '#5a3a1a', 26, 1); P(g, 3, 11, '#5a3a1a', 26, 1); P(g, 3, 5, '#5a3a1a', 1, 7); P(g, 28, 5, '#5a3a1a', 1, 7);
    // little sun/house motif
    P(g, 14, 7, '#6a3a18', 4, 3); P(g, 13, 7, '#6a3a18', 6, 1); P(g, 15, 6, '#6a3a18', 2, 1);
    P(g, 15, 8, '#c89a58', 1, 2);
    P(g, 7, 8, '#6a3a18', 3, 1); P(g, 22, 8, '#6a3a18', 3, 1);
    // fringe
    for (var fx = 2; fx < 30; fx += 2) { P(g, fx, 2, '#c89a58'); P(g, fx + 1, 13, '#c89a58'); }
    // little boots beside
    return { c: s.c, ox: 0, oy: 0 };
  };

  painters.hanging_pots = function () {
    var s = mk(32, 16), g = s.g;
    // rail
    P(g, 1, 1, OL, 30, 3); P(g, 2, 2, '#8a8a90', 28, 1); P(g, 2, 1, '#c0c0c8', 28, 1);
    P(g, 1, 0, OL, 2, 3); P(g, 29, 0, OL, 2, 3);
    // hooks + pots
    function pot(x, w, h, col, hi, sh) {
      P(g, x + (w >> 1), 4, '#404048', 1, 2);
      P(g, x, 6, OL, w, h);
      P(g, x + 1, 7, col, w - 2, h - 2); P(g, x + 1, 7, hi, 1, h - 2); P(g, x + w - 2, 7, sh, 1, h - 2);
      P(g, x - 1, 6, OL, w + 2, 1);
    }
    pot(3, 7, 6, '#c86a3a', '#f0a070', '#8a3a1a'); // copper pot
    // pan (round with handle up)
    P(g, 13, 4, '#404048', 1, 3);
    disc(g, 14, 10, 3, OL); disc(g, 14, 10, 2, '#4a4a54'); P(g, 13, 9, '#80808c');
    pot(19, 6, 5, '#c86a3a', '#f0a070', '#8a3a1a');
    // ladle
    P(g, 27, 4, '#404048', 1, 7); disc(g, 27, 12, 1, OL); P(g, 27, 12, '#c0c0c8');
    // garlic braid
    P(g, 10, 4, '#e8e0c8', 1, 2); P(g, 9, 6, '#f0ead8', 2, 2); P(g, 10, 8, '#f0ead8', 2, 2); P(g, 9, 10, '#f0ead8', 2, 2);
    P(g, 10, 7, '#c8c0a8'); P(g, 9, 9, '#c8c0a8');
    return { c: s.c, ox: 0, oy: 0 };
  };

  function buildShelf() {
    var N = 6, frames = [];
    var jars = [
      { x: 2, w: 4, h: 6, c: '#c8a060', glow: null },
      { x: 7, w: 3, h: 7, c: '#60e0b0', glow: 'rgba(110,255,200,' },
      { x: 11, w: 4, h: 5, c: '#e0c050', glow: null },
      { x: 16, w: 3, h: 6, c: '#c070ff', glow: 'rgba(200,130,255,' },
      { x: 20, w: 4, h: 7, c: '#a06040', glow: null },
      { x: 25, w: 4, h: 5, c: '#ff8080', glow: 'rgba(255,140,150,' }
    ];
    for (var f = 0; f < N; f++) {
      var s = mk(32, 16), g = s.g;
      // plank + brackets
      P(g, 0, 11, OL, 32, 3); P(g, 1, 11, WOOD[1], 30, 1); P(g, 1, 12, WOOD[0], 30, 1);
      P(g, 3, 14, OL, 2, 2); P(g, 27, 14, OL, 2, 2);
      for (var i = 0; i < jars.length; i++) {
        var j = jars[i], y = 11 - j.h;
        P(g, j.x, y, OL, j.w, j.h);
        P(g, j.x + 1, y + 2, j.c, j.w - 2, j.h - 3);
        P(g, j.x + 1, y, '#a07040', j.w - 2, 1); // cork/lid
        P(g, j.x + 1, y + 2, 'rgba(255,255,255,0.55)', 1, 1);
        if (j.glow) {
          var a = 0.12 + 0.12 * (0.5 + 0.5 * Math.sin(f / N * Math.PI * 2 + i));
          g.fillStyle = j.glow + a + ')';
          g.fillRect(j.x - 1, y - 1, j.w + 2, j.h + 2);
          if ((f + i) % 3 === 0) P(g, j.x + 1, y + 3, '#ffffff');
          if ((f + i) % 4 === 1) P(g, j.x + j.w - 1, y - 2, j.c);
        }
      }
      // tiny label
      P(g, 2, 7, '#f4ead0', 4, 1); P(g, 20, 7, '#f4ead0', 4, 1);
      frames.push(s.c);
    }
    anim.wall_shelf = { frames: frames, fps: 4, ox: 0, oy: 0 };
  }

  painters.wall_map = function () {
    var s = mk(32, 16), g = s.g;
    P(g, 1, 1, OL, 30, 13);
    P(g, 2, 2, '#e8d4a0', 28, 11);
    dither(g, 2, 2, 28, 11, '#dcc48c', 0);
    // curled ends
    P(g, 0, 1, '#c8a870', 2, 13); P(g, 30, 1, '#c8a870', 2, 13); P(g, 0, 1, OL, 1, 13); P(g, 31, 1, OL, 1, 13);
    // coastline / sea
    P(g, 20, 2, '#8ab0c8', 10, 11); dither(g, 20, 2, 10, 11, '#a8c8d8', 1);
    P(g, 19, 3, '#8a6a40', 1, 9); P(g, 20, 6, '#8a6a40', 1, 3);
    // forest dots
    for (var i = 0; i < 6; i++) P(g, 4 + i * 2, 9 + (i & 1), '#5a8a40');
    // river
    P(g, 9, 3, '#5a8ab0', 1, 3); P(g, 10, 5, '#5a8ab0', 1, 2); P(g, 11, 6, '#5a8ab0', 8, 1);
    // mountains
    P(g, 4, 5, '#7a6a5a', 3, 1); P(g, 5, 4, '#7a6a5a'); P(g, 13, 4, '#7a6a5a', 3, 1); P(g, 14, 3, '#7a6a5a');
    // X marks the spot + dotted path
    P(g, 6, 11, '#c03030'); P(g, 15, 9, '#8a3a2a'); P(g, 13, 10, '#8a3a2a'); P(g, 11, 11, '#8a3a2a');
    P(g, 16, 10, '#c03030'); P(g, 18, 10, '#c03030'); P(g, 17, 11, '#c03030'); P(g, 16, 12, '#c03030'); P(g, 18, 12, '#c03030');
    // tiny dragon doodle in the sea
    P(g, 24, 8, '#3a6a3a', 3, 1); P(g, 26, 7, '#3a6a3a'); P(g, 23, 9, '#3a6a3a');
    // compass rose
    P(g, 26, 3, '#8a3a2a', 1, 3); P(g, 25, 4, '#8a3a2a', 3, 1);
    // pins
    P(g, 2, 2, '#e04040'); P(g, 29, 2, '#e04040');
    return { c: s.c, ox: 0, oy: 0 };
  };

  function buildGarland() {
    var N = 8, frames = [];
    var cols = ['#ffd36a', '#ff9a6a', '#fff0b0', '#ffc080', '#ffe890'];
    var pts = [];
    for (var x = 1; x < 31; x++) pts.push([x, 3 + Math.round(Math.sin((x - 1) / 29 * Math.PI) * 6)]);
    for (var f = 0; f < N; f++) {
      var s = mk(32, 16), g = s.g;
      // nails
      P(g, 0, 2, OL, 2, 2); P(g, 30, 2, OL, 2, 2);
      // wire with tiny leaves
      for (var i = 0; i < pts.length; i++) {
        P(g, pts[i][0], pts[i][1], '#3a4a2a');
        if (i % 3 === 1) P(g, pts[i][0], pts[i][1] - 1, '#5a8a40');
      }
      // bulbs
      for (var b = 2; b < pts.length; b += 4) {
        var px = pts[b][0], py = pts[b][1] + 1;
        var idx = (b >> 2);
        var on = Math.sin(f / N * Math.PI * 2 + idx * 1.9) > -0.3;
        var col = cols[idx % cols.length];
        P(g, px, py, OL, 1, 1);
        P(g, px - 1, py + 1, OL, 3, 3);
        P(g, px, py + 1, on ? col : '#8a6a40', 1, 2);
        if (on) {
          P(g, px, py + 1, '#ffffff');
          g.fillStyle = 'rgba(255,210,120,0.18)'; g.fillRect(px - 2, py, 5, 5);
          g.fillStyle = 'rgba(255,210,120,0.08)'; g.fillRect(px - 3, py + 1, 7, 3);
        }
      }
      frames.push(s.c);
    }
    anim.garland = { frames: frames, fps: 4, ox: 0, oy: 0 };
  }

  painters.herb_rack = function () {
    var s = mk(16, 16), g = s.g;
    // dowel
    P(g, 0, 1, OL, 16, 3); P(g, 1, 2, DWOOD[1], 14, 1); P(g, 1, 1, '#a0703f', 14, 1);
    var bunches = [[2, '#6a9a4a', '#9ac870', 9], [6, '#8a9a5a', '#b8c880', 7], [10, '#5a8a6a', '#80b890', 10], [13, '#9a6aa0', '#c8a0d0', 7]];
    for (var i = 0; i < bunches.length; i++) {
      var b = bunches[i], x = b[0], len = b[3];
      P(g, x, 4, '#c8a060', 2, 1); // twine
      for (var y = 5; y < 5 + len; y++) {
        var w = 1 + ((y - 4) >> 2);
        P(g, x - (w >> 1), y, OL, w + 2, 1);
        P(g, x - (w >> 1) + 1, y, b[1], w, 1);
        if (hash(x, y) > 0.5) P(g, x - (w >> 1) + 1, y, b[2]);
      }
      // flowers at tips (lavender)
      if (i === 3) { P(g, x - 1, 5 + len - 2, '#e0c0f0'); P(g, x + 1, 5 + len - 1, '#e0c0f0'); }
    }
    return { c: s.c, ox: 0, oy: 0 };
  };

  painters.potted_tree = function () {
    var s = mk(18, 36), g = s.g;
    shadow(g, 3, 33, 13, 3);
    // pot (terracotta)
    P(g, 3, 24, OL, 12, 10); P(g, 2, 23, OL, 14, 3);
    P(g, 3, 24, '#c86a3a', 12, 1); P(g, 3, 24, '#f0a070', 12, 1);
    P(g, 4, 26, '#b05a30', 10, 7); P(g, 4, 26, '#d07a48', 2, 7); P(g, 12, 26, '#8a3a1a', 2, 7);
    P(g, 6, 28, '#e09060', 6, 1);
    // trunk
    P(g, 8, 14, OL, 3, 10); P(g, 9, 14, '#7a5030', 1, 9);
    P(g, 6, 17, OL, 3, 1); P(g, 10, 15, OL, 3, 1);
    // canopy clusters
    var cl = [[9, 8, 6], [5, 12, 4], [13, 11, 4], [9, 4, 4], [6, 6, 3], [12, 6, 3]];
    for (var i = 0; i < cl.length; i++) disc(g, cl[i][0], cl[i][1], cl[i][2] + 1, OL);
    for (var j = 0; j < cl.length; j++) disc(g, cl[j][0], cl[j][1], cl[j][2], '#3f7a3a');
    for (var k = 0; k < cl.length; k++) disc(g, cl[k][0] - 1, cl[k][1] - 1, cl[k][2] - 2, '#5aa050');
    for (var m = 0; m < 26; m++) {
      var x = 3 + ((hash(m, 1) * 13) | 0), y = 2 + ((hash(m, 2) * 13) | 0);
      if (hash(m, 3) > 0.5) P(g, x, y, '#8ad070'); else P(g, x, y, '#2a5a2a');
    }
    // little lemons
    P(g, 6, 10, OL, 2, 2); P(g, 6, 10, '#f0d040'); P(g, 12, 7, OL, 2, 2); P(g, 12, 7, '#f0d040'); P(g, 10, 12, '#f0d040');
    return { c: s.c, ox: -1, oy: -20 };
  };

  painters.laundry_basket = function () {
    var s = mk(16, 20), g = s.g;
    shadow(g, 1, 17, 15, 3);
    // clothes heaped above
    ell(g, 8, 6, 6, 3, OL);
    ell(g, 6, 6, 3, 2, '#6aa0d0'); ell(g, 10, 5, 3, 2, '#f0e8d8'); P(g, 9, 4, '#ffffff', 2, 1);
    P(g, 3, 4, OL, 3, 4); P(g, 4, 4, '#e07060', 1, 3); // sock hanging
    P(g, 12, 6, '#f0c050', 2, 2);
    // wicker basket
    P(g, 1, 7, OL, 14, 11); P(g, 0, 7, OL, 16, 2);
    P(g, 1, 7, '#d8b070', 14, 1);
    for (var y = 9; y < 17; y++) for (var x = 2; x < 14; x++) {
      var c = ((x + (y >> 1)) & 1) ? '#c09050' : '#a87838';
      if (y % 2 === 0) c = '#8a6028';
      P(g, x, y, c);
    }
    P(g, 2, 9, 'rgba(255,240,200,0.35)', 1, 8); P(g, 13, 9, 'rgba(0,0,0,0.25)', 1, 8);
    // handles
    P(g, 0, 10, OL, 2, 3); P(g, 14, 10, OL, 2, 3);
    return { c: s.c, ox: 0, oy: -4 };
  };

  // ---------------- info ----------------
  var newInfo = {
    armchair: { fw: 1, fh: 1, solid: true },
    desk: { fw: 1, fh: 1, solid: true, light: { dx: 6, dy: -9, r: 28, color: '#ffe0a0', flicker: false } },
    wardrobe: { fw: 2, fh: 1, solid: true },
    dresser: { fw: 1, fh: 1, solid: true },
    kid_bed: { fw: 1, fh: 2, solid: true },
    toybox: { fw: 1, fh: 1, solid: true },
    piano: { fw: 2, fh: 1, solid: true },
    dining_table: { fw: 3, fh: 2, solid: true, light: { dx: 32, dy: 4, r: 40, color: '#ffc070', flicker: true } },
    counter: { fw: 2, fh: 1, solid: true },
    sink: { fw: 1, fh: 1, solid: true },
    firewood: { fw: 1, fh: 1, solid: true },
    cat_bed: { fw: 1, fh: 1, solid: true },
    telescope: { fw: 1, fh: 1, solid: true },
    globe: { fw: 1, fh: 1, solid: true },
    candles: { fw: 1, fh: 1, solid: true, light: { dx: 8, dy: 4, r: 34, color: '#ffb050', flicker: true } },
    coat_rack: { fw: 1, fh: 1, solid: true },
    stairs: { fw: 2, fh: 2, solid: true },
    doormat: { fw: 2, fh: 1, solid: false, decor: true },
    hanging_pots: { fw: 2, fh: 1, solid: false, decor: true },
    wall_shelf: { fw: 2, fh: 1, solid: false, decor: true },
    wall_map: { fw: 2, fh: 1, solid: false, decor: true },
    garland: { fw: 2, fh: 1, solid: false, decor: true },
    herb_rack: { fw: 1, fh: 1, solid: false, decor: true },
    potted_tree: { fw: 1, fh: 1, solid: true },
    laundry_basket: { fw: 1, fh: 1, solid: true }
  };
  var builders = { cat_bed: buildCat, candles: buildCandles, wall_shelf: buildShelf, garland: buildGarland };

  var cache = {};
  function drawPlus(ctx, type, px, py, env) {
    var t = (env && env.t) || 0;
    px = px | 0; py = py | 0;
    if (builders[type]) {
      if (!anim[type]) builders[type]();
      var A = anim[type], n = (A && A.frames && A.frames.length) || 0, fi = n ? ((Math.floor((+t || 0) * A.fps) % n) + n) % n : 0;
      if (n && A.frames[fi]) HD.blit(ctx, A.frames[fi], px + A.ox, py + A.oy);
      return true;
    }
    var p = painters[type];
    if (!p) return false;
    if (!cache[type]) cache[type] = p();
    var a = cache[type];
    HD.blit(ctx, a.c, px + a.ox, py + a.oy);
    return true;
  }

  if (H.furniture) {
    var info = H.furniture.info || (H.furniture.info = {});
    for (var k in newInfo) if (!info[k]) info[k] = newInfo[k];
    var origDraw = H.furniture.draw;
    var AO = { bookshelf: 1, cupboard: 1, wardrobe: 1, piano: 1, counter: 1, sink: 1, stove: 1, sofa: 1, dresser: 1, desk: 1, chest: 1,
      toybox: 1, bed: 1, kid_bed: 1, dining_table: 1, table: 1, clock: 1, armchair: 1, stairs: 1, laundry_basket: 1, firewood: 1 };
    H.furniture.draw = function (ctx, type, px, py, env) {
      if (AO[type]) { // ambient-occlusion contact shadow, light from top-left
        var fi = info[type], bw = fi.fw * 16, by = (py | 0) + fi.fh * 16, bx = px | 0;
        ctx.fillStyle = 'rgba(20,8,3,0.30)'; ctx.fillRect(bx + 1, by - 2, bw, 3);
        ctx.fillStyle = 'rgba(20,8,3,0.16)'; ctx.fillRect(bx + 3, by + 1, bw - 2, 1); ctx.fillRect(bx + bw, by - 7, 1, 6);
      }
      if (newInfo[type] && drawPlus(ctx, type, px, py, env)) return;
      if (origDraw) return origDraw.call(H.furniture, ctx, type, px, py, env);
    };
  } else {
    H.furniture = { info: newInfo, draw: function (ctx, type, px, py, env) { drawPlus(ctx, type, px, py, env); } };
  }

  // ---------------- tiles (authored at 2x: 32x32 canvas per 16x16 logical tile) ----------------
  var S = 32;
  function tmk() { var c = document.createElement('canvas'); c.width = S; c.height = S; return c; }
  function wallShadow(g, on) {
    if (!on) return;
    var a = [0.46, 0.40, 0.34, 0.28, 0.22, 0.17, 0.12, 0.08];
    for (var i = 0; i < 8; i++) { g.fillStyle = 'rgba(30,12,4,' + a[i] + ')'; g.fillRect(0, i, S, 1); }
    g.fillStyle = 'rgba(30,12,4,0.08)';
    for (var x = 0; x < S; x += 2) { g.fillRect(x, 8, 1, 1); g.fillRect(x + 1, 9, 1, 1); }
    for (x = 0; x < S; x += 4) g.fillRect(x, 10, 1, 1);
  }

  // parquet: 16px blocks of four slats, alternating direction, fine grain along each slat
  function drawHerring(g, tx, ty, sh) {
    var pal = [['#b8763e', '#d39559', '#93592e', '#a5683a'], ['#c08044', '#dba062', '#9a6033', '#ad7040'],
               ['#ad6e3a', '#c98c52', '#885228', '#9a6034'], ['#bb7a40', '#d79a5c', '#955a2e', '#a86a3a']];
    var seam = '#74461f';
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var gx = tx * S + x, gy = ty * S + y;
      var bx = gx >> 4, by = gy >> 4, horiz = ((bx + by) & 1) === 0;
      var u = horiz ? (gx & 15) : (gy & 15);          // along the slat
      var v = horiz ? (gy & 15) : (gx & 15);          // across the block
      var si = v >> 2, w = v & 3;                      // slat index, position across slat
      var id = bx * 131 + by * 71 + si;
      var p = pal[(hash(id, 5) * 4) | 0];
      var c = p[0];
      if (w === 0) c = p[1]; else if (w === 3) c = seam;
      else if (hash(id * 3 + w, (u + si * 5) >> 2) < 0.26) c = p[3];   // grain dashes
      if (u === 15) c = seam; else if (u === 0 && w !== 3) c = p[1]; else if (u === 14 && w !== 3) c = p[2];
      P(g, x, y, c);
    }
    // varnish sheen + worn, paler patches where feet pass
    if (hash(tx, ty) > 0.55) { g.fillStyle = 'rgba(255,238,205,0.13)'; for (var k = 0; k < 7; k++) g.fillRect(6 + k, 12 - k, 3, 1); }
    var wv = hash((tx >> 1) + 40, (ty >> 1) + 17);
    if (wv > 0.6) { g.fillStyle = 'rgba(255,226,180,0.07)'; g.fillRect(0, 0, S, S); }
    else if (wv < 0.2) { g.fillStyle = 'rgba(50,22,8,0.07)'; g.fillRect(0, 0, S, S); }
    wallShadow(g, sh);
  }

  // flagstones: four irregular slabs per tile, bevelled, pitted, mossy joints
  function drawStone(g, tx, ty, sh) {
    var GR = '#3a3634';
    P(g, 0, 0, GR, S, S);
    var sx = 12 + ((hash(tx, ty) * 10) | 0), sy = 12 + ((hash(ty, tx) * 10) | 0);
    var sx2 = 9 + ((hash(tx + 3, ty) * 15) | 0);
    var rects = [[0, 0, sx, sy], [sx, 0, S - sx, sy], [0, sy, sx2, S - sy], [sx2, sy, S - sx2, S - sy]];
    var pals = [['#8c8478', '#a8a092', '#6a645a', '#bab2a2', '#807a6e'], ['#7e7a72', '#9a958a', '#5e5a54', '#aea898', '#74706a'],
                ['#948870', '#b0a488', '#706650', '#c0b498', '#887c66'], ['#868a84', '#a2a69e', '#626660', '#b4b8ae', '#7a7e78']];
    for (var i = 0; i < 4; i++) {
      var r = rects[i];
      var p = pals[(hash(tx * 4 + i, ty * 7) * 4) | 0];
      var x0 = r[0] + 1, y0 = r[1] + 1, w = r[2] - 2, h = r[3] - 2;
      if (w < 3 || h < 3) continue;
      P(g, x0, y0, p[0], w, h);
      // mottled face
      for (var k = 0; k < 10; k++) {
        var mx = x0 + 1 + ((hash(i * 13 + k, tx * 5 + ty) * Math.max(1, w - 3)) | 0);
        var my = y0 + 1 + ((hash(k, i * 7 + tx + ty * 9) * Math.max(1, h - 2)) | 0);
        P(g, mx, my, k % 3 === 0 ? p[2] : k % 3 === 1 ? p[4] : p[3], k % 3 === 1 ? 2 : 1, 1);
      }
      // bevel: lit top/left, shaded bottom/right
      P(g, x0, y0, p[3], w, 1); P(g, x0, y0, p[1], 1, h); P(g, x0 + 1, y0 + 1, p[1], w - 2, 1);
      P(g, x0, y0 + h - 1, p[2], w, 1); P(g, x0 + w - 1, y0, p[2], 1, h); P(g, x0 + 1, y0 + h - 2, p[4], w - 2, 1);
      // rounded corners
      P(g, x0, y0, GR); P(g, x0 + w - 1, y0, GR); P(g, x0, y0 + h - 1, GR); P(g, x0 + w - 1, y0 + h - 1, GR);
      // hairline crack
      if (hash(tx + i * 3, ty + 21) > 0.75 && w > 8 && h > 6) for (var q = 0; q < 5; q++) P(g, x0 + 3 + q, y0 + 3 + ((q * 3 / 4) | 0), p[2]);
      // moss in the joint
      if (hash(tx + i, ty + 11) > 0.72 && w > 6) { P(g, x0 + 2, y0 + h - 1, '#5c7a46', 3, 1); P(g, x0 + 3, y0 + h - 2, '#6a8a50'); P(g, x0 + 1, y0 + h, '#4a6a3a', 2, 1); }
    }
    wallShadow(g, sh);
  }

  // night-sky carpet: soft pile, crisp stars and crescent moons
  function drawCarpetBlue(g, tx, ty, sh) {
    var base = '#3a4f8e', mid = '#4259a0', dark = '#324480', Y = '#f0d870', YL = '#fff8d0';
    P(g, 0, 0, base, S, S);
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var gx = tx * S + x, gy = ty * S + y;
      var r = hash(gx, gy);
      if (r < 0.16) P(g, x, y, dark); else if (r > 0.84) P(g, x, y, mid);
      if (((gx + gy * 3) & 7) === 0 && r > 0.4) P(g, x, y, mid);
    }
    var moon = hash(tx + 5, ty + 5) > 0.82;
    var stars = 2 + ((hash(tx, ty + 99) * 2) | 0);
    for (var i = 0; i < stars; i++) {
      var sx = 4 + ((hash(tx * 3 + i, ty) * 24) | 0), sy = 4 + ((hash(tx, ty * 3 + i) * 24) | 0);
      if (moon && sx > 14 && sy > 12) continue;
      if (hash(i, tx + ty) > 0.5) {
        P(g, sx, sy - 3, Y, 1, 7); P(g, sx - 3, sy, Y, 7, 1);
        P(g, sx - 1, sy - 1, Y, 3, 3); P(g, sx, sy - 1, YL, 1, 3); P(g, sx - 1, sy, YL, 3, 1);
        P(g, sx - 2, sy - 2, '#a89a60'); P(g, sx + 2, sy - 2, '#a89a60'); P(g, sx - 2, sy + 2, '#a89a60'); P(g, sx + 2, sy + 2, '#a89a60');
      } else {
        P(g, sx, sy - 1, '#c8d4ff', 1, 3); P(g, sx - 1, sy, '#c8d4ff', 3, 1); P(g, sx, sy, '#ffffff');
      }
    }
    if (moon) {
      for (var my = -5; my <= 5; my++) for (var mx = -5; mx <= 5; mx++) {
        if (mx * mx + my * my <= 26 && (mx - 3) * (mx - 3) + (my + 1) * (my + 1) > 20) P(g, 22 + mx, 21 + my, (mx + my < -3) ? '#fffbe0' : '#f4e8b0');
      }
    }
    wallShadow(g, sh);
  }

  var tcache = {};
  var tdraw = { floor_herring: drawHerring, floor_stone: drawStone, carpet_blue: drawCarpetBlue };
  if (H.tilesIndoor) {
    var TI = H.tilesIndoor;
    TI.solid = TI.solid || {};
    TI.solid.floor_herring = false; TI.solid.floor_stone = false; TI.solid.carpet_blue = false;
    var origTile = TI.draw;
    TI.draw = function (ctx, id, px, py, tx, ty, env, nb) {
      var fn = tdraw[id];
      if (!fn) return origTile && origTile.call(TI, ctx, id, px, py, tx, ty, env, nb);
      tx = tx | 0; ty = ty | 0;
      var up = nb ? nb(0, -1) : id;
      var sh = up === 'wall' || up === 'void';
      var key = id + tx + '_' + ty + (sh ? 's' : '');
      if (!tcache[key]) { var c = tmk(); var g = c.getContext('2d'); fn(g, tx, ty, sh); tcache[key] = c; }
      ctx.drawImage(tcache[key], Math.round(px * 2) / 2, Math.round(py * 2) / 2, T, T);
    };
  }
})();
