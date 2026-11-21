window.H = window.H || {};
(function () {
  'use strict';
  // interiors_props: furniture for the tavern, shop, school and village houses.
  // All art is authored at 2x (32px per logical tile) and blitted at logical size via H._hd.
  var H = window.H, HD = H._hd;
  if (!HD) return;

  function P(g, x, y, col, w, h) { g.fillStyle = col; g.fillRect(x | 0, y | 0, w || 1, h || 1); }
  function box(g, x, y, w, h, base, hi, sh, ol) {
    P(g, x, y, ol, w, h); P(g, x + 2, y + 2, base, w - 4, h - 4);
    P(g, x + 2, y + 2, hi, w - 4, 2); P(g, x + 2, y + 2, hi, 2, h - 4);
    P(g, x + 2, y + h - 4, sh, w - 4, 2); P(g, x + w - 4, y + 2, sh, 2, h - 4);
  }
  function ell(g, cx, cy, rx, ry, col) {
    for (var y = -ry; y <= ry; y++) for (var x = -rx; x <= rx; x++)
      if ((x * x) / (rx * rx + 0.3) + (y * y) / (ry * ry + 0.3) <= 1) P(g, cx + x, cy + y, col);
  }
  function hash(a, b) { var h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

  var OL = '#2a1a14';
  var WOOD = ['#8a5a34', '#b07a48', '#5e3a20', '#d09a62'];
  var DWOOD = ['#5e3a22', '#7c5030', '#3c2414', '#9a6a40'];
  var LWOOD = ['#c08a52', '#dcaa6e', '#94643a', '#f0c88a'];
  var BRASS = ['#d9b45a', '#fff0b0', '#9a7a30'];
  var EL = {
    water: ['#2f6fc0', '#6fb0f0', '#cfe8ff'], fire: ['#c8442a', '#ff8a3c', '#ffe08a'],
    wind: ['#5aa8a0', '#a8e0d0', '#f0fff8'], grass: ['#3f8a3a', '#7cc85a', '#d0f0a0'],
    electric: ['#c8a018', '#ffe040', '#fffbd0'], earth: ['#7a5430', '#b8864a', '#e8c890'],
    dark: ['#3a2a5a', '#6a4a9a', '#b8a0e0'], light: ['#c8b070', '#fff0b0', '#ffffff']
  };
  var ELS = ['water', 'fire', 'wind', 'grass', 'electric', 'earth', 'dark', 'light'];

  // chalk / banner glyphs on a 10x10 grid (2x px), drawn with a single colour
  var GLYPH = {
    water: ['....#.....', '...###....', '..#####...', '.#######..', '.#######..', '.#######..', '..#####...', '...###....'],
    fire: ['....#.....', '...##.#...', '..####.#..', '..#####...', '.#######..', '.###.###..', '..##.##...', '...###....'],
    wind: ['..####....', '.#....#...', '......#...', '.####.#...', '#....#....', '.###......', '#...#.....', '.###......'],
    grass: ['......##..', '....####..', '...#####..', '..#####...', '.####.....', '.##.......', '#.........', '#.........'],
    electric: ['....###...', '...###....', '..###.....', '.#######..', '....###...', '...###....', '..##......', '.#........'],
    earth: ['...##.....', '..####....', '.######...', '########..', '###.####..', '##...###..', '##########', '##########'],
    dark: ['..####....', '.###......', '###.......', '###.......', '###.......', '.###......', '..####....', '..........'],
    light: ['....#.....', '.#..#..#..', '..#####...', '.#######..', '########..', '.#######..', '..#####...', '.#..#..#..']
  };
  function glyph(g, el, x, y, col, s) {
    s = s || 1; var r = GLYPH[el];
    for (var j = 0; j < r.length; j++) for (var i = 0; i < r[j].length; i++) if (r[j][i] === '#') P(g, x + i * s, y + j * s, col, s, s);
  }
  function bottle(g, x, y, col, hi, tall) {
    var h = tall ? 12 : 9;
    P(g, x, y, OL, 8, h); P(g, x + 2, y - 3, OL, 4, 4);
    P(g, x + 2, y + 2, col, 4, h - 4); P(g, x + 2, y + 2, hi, 2, 2);
    P(g, x + 3, y - 2, '#c8a070', 2, 2);
    P(g, x + 2, y + 1, 'rgba(255,255,255,0.35)', 4, 1);
  }
  function backpack(g, x, y, col, dk) {
    HD.rr(g, x, y, 12, 13, 3, OL); HD.rr(g, x + 1, y + 1, 10, 11, 2, col);
    P(g, x + 2, y + 6, dk, 8, 1); P(g, x + 4, y + 8, BRASS[0], 2, 2); P(g, x + 2, y + 2, 'rgba(255,255,255,0.25)', 3, 2);
    P(g, x + 4, y - 2, OL, 4, 3); P(g, x + 5, y - 1, dk, 2, 1);
  }
  function bowl(g, cx, cy) {
    ell(g, cx, cy, 7, 4, OL); ell(g, cx, cy, 6, 3, '#f4ead8'); ell(g, cx, cy - 1, 5, 2, '#d88a3a');
    P(g, cx - 3, cy - 2, '#fff0c0', 4, 1); P(g, cx + 1, cy - 1, '#6cae4a', 2, 1); P(g, cx - 1, cy - 1, '#f8f0e0', 2, 1);
    P(g, cx - 4, cy + 2, '#c84a3a', 8, 1); // rim stripe
  }
  function mug(g, x, y) { P(g, x, y, OL, 7, 8); P(g, x + 1, y + 1, '#c89a50', 5, 6); P(g, x + 1, y + 1, '#fff4d8', 5, 2); P(g, x + 7, y + 2, OL, 2, 4); }

  var painters = {}, anim = {}, cache = {};

  painters.shop_counter = function () {
    var s = HD.mk2(48, 26), g = s.g;
    HD.softShadow(g, 2, 46, 94, 6);
    box(g, 0, 22, 96, 28, WOOD[0], WOOD[1], WOOD[2], OL);
    for (var i = 0; i < 3; i++) { P(g, 6 + i * 30, 28, WOOD[2], 26, 16); P(g, 8 + i * 30, 30, WOOD[1], 22, 12); P(g, 8 + i * 30, 30, WOOD[3], 22, 2); }
    box(g, -0, 12, 96, 12, LWOOD[0], LWOOD[3], LWOOD[2], OL);
    // ledger
    P(g, 30, 10, OL, 16, 8); P(g, 32, 11, '#f4ead0', 6, 5); P(g, 39, 11, '#f4ead0', 6, 5); P(g, 38, 11, '#a08868', 1, 6);
    P(g, 33, 13, '#9a8a70', 4, 1); P(g, 40, 13, '#9a8a70', 4, 1);
    // candy jar
    P(g, 10, 2, OL, 12, 14); P(g, 12, 4, '#cfe8f0', 8, 10); P(g, 12, 0, OL, 8, 3); P(g, 13, 1, '#c84a3a', 6, 1);
    P(g, 13, 8, '#ff9ac0', 2, 2); P(g, 16, 10, '#9ad0ff', 2, 2); P(g, 14, 11, '#ffe070', 2, 2); P(g, 17, 6, '#a0f0a0', 2, 2);
    P(g, 12, 4, 'rgba(255,255,255,0.6)', 1, 6);
    // brass bell
    ell(g, 72, 12, 5, 4, OL); ell(g, 72, 12, 4, 3, BRASS[0]); P(g, 70, 10, BRASS[1], 2, 1); P(g, 71, 6, OL, 2, 3);
    P(g, 66, 16, OL, 12, 2);
    // little potion for show
    bottle(g, 84, 4, '#c040a0', '#ff90e0', false);
    return { c: s.c, ox: 0, oy: -6 };
  };

  painters.shop_shelf = function () {
    var s = HD.mk2(32, 34), g = s.g;
    box(g, 0, 0, 64, 66, DWOOD[0], DWOOD[1], DWOOD[2], OL);
    P(g, 2, 2, DWOOD[3], 60, 3);
    var rows = [6, 26, 46];
    var pc = [['#c84040', '#ff9a8a'], ['#3f78c8', '#a0d0ff'], ['#4aa050', '#b0f0a0'], ['#c8a030', '#fff0a0'], ['#8a4ac0', '#e0b0ff']];
    for (var r = 0; r < 3; r++) {
      var y = rows[r];
      P(g, 4, y, '#2e1c10', 56, 18);
      if (r === 0) for (var i = 0; i < 6; i++) bottle(g, 6 + i * 9, y + 6, pc[i % 5][0], pc[i % 5][1], i % 2 === 0);
      else if (r === 1) { backpack(g, 7, y + 4, '#a0602a', '#6a3a18'); backpack(g, 23, y + 4, '#3f6a8a', '#24405a'); backpack(g, 39, y + 4, '#6a8a3a', '#3e5a20');
        P(g, 53, y + 8, OL, 6, 9); P(g, 54, y + 9, '#e0d0a0', 4, 7); }
      else { // boxes and herb bundles
        P(g, 6, y + 8, OL, 14, 10); P(g, 7, y + 9, LWOOD[0], 12, 8); P(g, 7, y + 9, LWOOD[3], 12, 1); P(g, 12, y + 12, '#6a4a2a', 2, 2);
        for (var k = 0; k < 3; k++) { P(g, 24 + k * 6, y + 4, OL, 4, 13); P(g, 25 + k * 6, y + 5, k === 1 ? '#7cb85a' : '#5a9a40', 2, 9); P(g, 24 + k * 6, y + 14, '#c8a070', 4, 2); }
        P(g, 44, y + 10, OL, 14, 8); P(g, 45, y + 11, '#d8c8a0', 12, 6); P(g, 45, y + 11, '#f0e4c4', 12, 1);
      }
      P(g, 2, y + 18, OL, 60, 2); P(g, 4, y + 20, DWOOD[3], 56, 1);
    }
    return { c: s.c, ox: 0, oy: -18 };
  };

  painters.potion_rack = function () {
    var s = HD.mk2(16, 28), g = s.g;
    HD.softShadow(g, 2, 50, 28, 5);
    box(g, 0, 4, 32, 50, DWOOD[1], DWOOD[3], DWOOD[2], OL);
    var cs = [['#3fd0c0', '#c0fff4'], ['#ff7ac0', '#ffd0ec'], ['#ffd040', '#fff8c0'], ['#8a7aff', '#d8d0ff'], ['#7cf060', '#e0ffd0'], ['#ff8a40', '#ffe0b0']];
    for (var r = 0; r < 2; r++) {
      var y = 8 + r * 22; P(g, 3, y, '#24160c', 26, 18);
      for (var i = 0; i < 3; i++) {
        var c = cs[r * 3 + i], x = 5 + i * 8;
        P(g, x - 1, y + 3, 'rgba(255,255,200,0.12)', 10, 14);
        bottle(g, x, y + 6, c[0], c[1], i === 1);
        P(g, x + 2, y + 8, c[1], 2, 2);
      }
      P(g, 2, y + 18, OL, 28, 2); P(g, 3, y + 20, DWOOD[3], 26, 1);
    }
    return { c: s.c, ox: 0, oy: -12 };
  };

  painters.barrel_in = function () {
    var s = HD.mk2(16, 22), g = s.g;
    HD.softShadow(g, 3, 38, 26, 5);
    HD.rr(g, 3, 6, 26, 36, 6, OL);
    HD.rr(g, 5, 8, 22, 32, 5, WOOD[0]);
    P(g, 7, 10, WOOD[1], 6, 28); P(g, 21, 10, WOOD[2], 5, 28); P(g, 9, 10, WOOD[3], 2, 26);
    P(g, 4, 14, '#4a4a52', 24, 3); P(g, 4, 32, '#4a4a52', 24, 3); P(g, 5, 14, '#8a8a96', 20, 1); P(g, 5, 32, '#8a8a96', 20, 1);
    ell(g, 16, 8, 11, 4, OL); ell(g, 16, 8, 10, 3, LWOOD[0]); ell(g, 16, 8, 7, 2, LWOOD[1]); P(g, 12, 7, LWOOD[3], 6, 1);
    P(g, 13, 24, OL, 6, 4); P(g, 14, 25, BRASS[0], 4, 2); // tap
    return { c: s.c, ox: 0, oy: -6 };
  };

  painters.tavern_counter = function () {
    var s = HD.mk2(48, 26), g = s.g;
    HD.softShadow(g, 2, 46, 94, 6);
    box(g, 0, 22, 96, 28, DWOOD[1], DWOOD[3], DWOOD[2], OL);
    for (var x = 6; x < 92; x += 10) P(g, x, 26, DWOOD[2], 2, 20);
    P(g, 2, 44, '#c84a3a', 92, 2); // red trim
    box(g, 0, 12, 96, 12, WOOD[1], LWOOD[1], WOOD[2], OL);
    mug(g, 10, 6); mug(g, 22, 7);
    bowl(g, 50, 14);
    P(g, 58, 9, '#5a3a20', 1, 8); P(g, 60, 9, '#5a3a20', 1, 8); // chopsticks
    // noren-style cloth hanging at the front
    for (var i = 0; i < 3; i++) { P(g, 66 + i * 9, 22, OL, 8, 14); P(g, 67 + i * 9, 23, '#2f4a7a', 6, 12); P(g, 68 + i * 9, 27, '#f0e8d0', 4, 3); }
    P(g, 84, 6, OL, 8, 10); P(g, 85, 7, '#e8e0c8', 6, 8); P(g, 86, 9, '#c84a3a', 4, 1); // menu card
    return { c: s.c, ox: 0, oy: -6 };
  };

  function buildRamen() {
    var frames = [];
    for (var f = 0; f < 6; f++) {
      var s = HD.mk2(16, 32), g = s.g;
      HD.softShadow(g, 2, 56, 28, 6);
      // stone hearth
      box(g, 2, 40, 28, 20, '#7a7068', '#a8a098', '#544c46', OL);
      P(g, 8, 48, '#1a0e08', 16, 8);
      var fl = f % 3;
      P(g, 10, 52 - fl, '#ff8a30', 4, 4 + fl); P(g, 16, 51 + (fl === 1 ? 1 : 0), '#ffb43c', 5, 5); P(g, 12, 54, '#fff0a0', 6, 2);
      // big pot
      HD.rr(g, 2, 22, 28, 20, 5, OL); HD.rr(g, 4, 24, 24, 16, 4, '#3a3a44'); P(g, 6, 26, '#6a6a78', 3, 12); P(g, 22, 26, '#24242c', 4, 12);
      P(g, 0, 28, OL, 4, 4); P(g, 28, 28, OL, 4, 4);
      ell(g, 16, 22, 13, 4, OL); ell(g, 16, 22, 12, 3, '#d88a3a'); ell(g, 15, 21, 8, 2, '#f0b060');
      P(g, 10, 21, '#f8f0e0', 3, 1); P(g, 18, 22, '#6cae4a', 2, 1);
      P(g, 20, 8, OL, 3, 15); P(g, 21, 9, LWOOD[0], 1, 13); // ladle
      // steam wisps rising
      for (var k = 0; k < 3; k++) {
        var ph = (f + k * 2) % 6, yy = 18 - ph * 3, xx = 8 + k * 7 + ((ph % 2) ? 1 : -1);
        g.fillStyle = 'rgba(255,255,255,' + (0.45 - ph * 0.07).toFixed(2) + ')';
        g.fillRect(xx, yy, 3, 4); g.fillRect(xx + 1, yy - 3, 2, 3);
      }
      frames.push(s.c);
    }
    anim.ramen_pot = { frames: frames, fps: 6, ox: 0, oy: -16 };
  }

  painters.stool = function () {
    var s = HD.mk2(16, 18), g = s.g;
    HD.softShadow(g, 6, 30, 20, 4);
    P(g, 8, 14, OL, 4, 18); P(g, 20, 14, OL, 4, 18); P(g, 9, 15, DWOOD[1], 2, 15); P(g, 21, 15, DWOOD[1], 2, 15);
    P(g, 8, 24, OL, 16, 2);
    ell(g, 16, 12, 11, 5, OL); ell(g, 16, 12, 10, 4, '#a04030'); ell(g, 15, 11, 7, 2, '#d0604a'); P(g, 11, 10, '#f09a80', 4, 1);
    return { c: s.c, ox: 0, oy: -2 };
  };

  painters.tavern_table = function () {
    var s = HD.mk2(32, 34), g = s.g;
    HD.softShadow(g, 4, 58, 58, 8);
    P(g, 8, 44, OL, 6, 18); P(g, 50, 44, OL, 6, 18); P(g, 10, 45, DWOOD[1], 2, 15); P(g, 52, 45, DWOOD[1], 2, 15);
    HD.rr(g, 0, 4, 64, 46, 8, OL);
    HD.rr(g, 2, 6, 60, 40, 7, WOOD[0]);
    HD.rr(g, 2, 6, 60, 36, 7, WOOD[1]);
    for (var y = 14; y < 40; y += 8) P(g, 4, y, '#9a6a3a', 56, 1);
    P(g, 10, 8, WOOD[3], 30, 2);
    P(g, 2, 42, WOOD[2], 60, 4);
    bowl(g, 18, 18); bowl(g, 44, 30);
    P(g, 40, 14, '#5a3a20', 10, 1); P(g, 40, 16, '#5a3a20', 10, 1);
    mug(g, 14, 30); mug(g, 46, 12);
    // tiny vase
    P(g, 30, 20, OL, 6, 8); P(g, 31, 21, '#4a8ac0', 4, 6); P(g, 32, 15, '#5aa040', 1, 6); P(g, 31, 14, '#ffd0e0', 3, 2);
    return { c: s.c, ox: 0, oy: -2 };
  };

  painters.lantern_hang = function () {
    var s = HD.mk2(16, 16), g = s.g;
    P(g, 6, 2, OL, 20, 3); P(g, 7, 3, DWOOD[3], 18, 1); P(g, 15, 4, OL, 2, 6);
    HD.rr(g, 8, 9, 16, 20, 6, OL); HD.rr(g, 9, 10, 14, 18, 5, '#d04a34'); HD.rr(g, 11, 11, 7, 14, 3, '#ff8a5a');
    P(g, 13, 13, '#ffd0a0', 2, 8);
    P(g, 9, 14, '#a8341f', 14, 1); P(g, 9, 19, '#a8341f', 14, 1); P(g, 9, 24, '#a8341f', 14, 1);
    P(g, 11, 9, OL, 10, 2); P(g, 11, 27, OL, 10, 2); P(g, 15, 29, '#d9b45a', 2, 3);
    return { c: s.c, ox: 0, oy: 0 };
  };

  painters.blackboard = function () {
    var s = HD.mk2(32, 24), g = s.g;
    box(g, 0, 0, 64, 44, WOOD[0], WOOD[3], WOOD[2], OL);
    P(g, 4, 4, '#24402e', 56, 34); P(g, 4, 4, '#2e5038', 56, 2);
    for (var i = 0; i < 40; i++) P(g, 5 + ((hash(i, 3) * 54) | 0), 6 + ((hash(3, i) * 30) | 0), 'rgba(255,255,255,0.07)', 3, 1);
    var CH = '#eef4e8';
    // element ring: 8 small glyphs in two rows with arrows
    for (var k = 0; k < 8; k++) {
      var gx = 7 + (k % 4) * 14, gy = 7 + ((k / 4) | 0) * 16;
      glyph(g, ELS[k], gx, gy, k % 2 ? CH : EL[ELS[k]][2], 1);
      if (k % 4 < 3) { P(g, gx + 10, gy + 4, 'rgba(238,244,232,0.7)', 3, 1); P(g, gx + 12, gy + 3, 'rgba(238,244,232,0.7)', 1, 3); }
    }
    P(g, 6, 36, 'rgba(238,244,232,0.5)', 22, 1);
    // tray with chalk
    P(g, 2, 38, OL, 60, 4); P(g, 4, 38, WOOD[1], 56, 2); P(g, 40, 36, '#ffffff', 5, 2); P(g, 48, 36, '#ffd0d0', 4, 2);
    return { c: s.c, ox: 0, oy: -10 };
  };

  painters.school_desk = function () {
    var s = HD.mk2(16, 24), g = s.g;
    HD.softShadow(g, 2, 42, 28, 5);
    P(g, 3, 28, OL, 4, 16); P(g, 25, 28, OL, 4, 16); P(g, 4, 29, DWOOD[1], 2, 14); P(g, 26, 29, DWOOD[1], 2, 14);
    box(g, 0, 14, 32, 18, LWOOD[0], LWOOD[3], LWOOD[2], OL);
    P(g, 2, 28, LWOOD[2], 28, 3);
    // open spellbook
    P(g, 5, 15, OL, 18, 10); P(g, 6, 16, '#f6eed8', 7, 8); P(g, 14, 16, '#f6eed8', 7, 8); P(g, 13, 16, '#a08868', 1, 8);
    P(g, 7, 18, '#9a8ac0', 5, 1); P(g, 7, 20, '#9a8ac0', 4, 1); P(g, 15, 18, '#c08a6a', 5, 1); P(g, 16, 20, '#6aa0c0', 3, 3);
    // inkwell + quill
    P(g, 24, 16, OL, 6, 7); P(g, 25, 17, '#24304a', 4, 5); P(g, 25, 17, '#6a80b0', 2, 1);
    P(g, 27, 6, '#f6f0e0', 2, 11); P(g, 29, 5, '#f6f0e0', 1, 6);
    return { c: s.c, ox: 0, oy: -8 };
  };

  painters.bookstack = function () {
    var s = HD.mk2(16, 22), g = s.g;
    HD.softShadow(g, 2, 38, 28, 5);
    var cs = ['#b0403a', '#3f6fa0', '#5f9a50', '#d8a040', '#7a4a90', '#2f7a7a', '#c86a3a'];
    var y = 38;
    for (var i = 0; i < 6; i++) {
      var w = 20 + ((hash(i, 9) * 8) | 0), x = 3 + ((hash(9, i) * (28 - w)) | 0), h = 5;
      y -= h; P(g, x, y, OL, w, h); P(g, x + 1, y + 1, cs[i % 7], w - 2, h - 2); P(g, x + w - 4, y + 1, '#f4ead0', 2, h - 2);
      P(g, x + 1, y + 1, 'rgba(255,255,255,0.3)', w - 6, 1);
    }
    // candle stub on top
    P(g, 13, y - 7, OL, 5, 7); P(g, 14, y - 6, '#f6eed8', 3, 6); P(g, 15, y - 10, '#ffb43c', 1, 3);
    return { c: s.c, ox: 0, oy: -6 };
  };

  function buildOrb() {
    var frames = [];
    for (var f = 0; f < 8; f++) {
      var s = HD.mk2(16, 30), g = s.g;
      HD.softShadow(g, 4, 54, 24, 5);
      // carved pedestal
      P(g, 6, 50, OL, 20, 8); P(g, 8, 51, '#8a8098', 16, 5); P(g, 8, 51, '#b8b0c8', 16, 1);
      P(g, 10, 34, OL, 12, 17); P(g, 12, 35, '#9a90b0', 8, 15); P(g, 12, 35, '#c8c0d8', 2, 15);
      P(g, 6, 30, OL, 20, 6); P(g, 8, 31, '#a89ec0', 16, 3); BRASS && P(g, 8, 31, BRASS[0], 16, 1);
      // glowing orb with drifting element colours
      ell(g, 16, 20, 11, 11, OL);
      ell(g, 16, 20, 10, 10, '#3a2a6a');
      for (var k = 0; k < 4; k++) {
        var a = (f / 8) * 6.283 + k * 1.57, el = EL[ELS[(k * 2 + (f > 3 ? 1 : 0)) % 8]];
        ell(g, 16 + Math.round(Math.cos(a) * 5), 20 + Math.round(Math.sin(a) * 4), 3, 2, el[1]);
      }
      ell(g, 16, 20, 4, 4, '#d8c8ff'); ell(g, 16, 20, 2, 2, '#ffffff');
      P(g, 10, 13, 'rgba(255,255,255,0.7)', 4, 2); P(g, 9, 15, 'rgba(255,255,255,0.5)', 2, 3);
      g.fillStyle = 'rgba(190,160,255,' + (0.10 + 0.06 * Math.sin(f / 8 * 6.283)).toFixed(3) + ')'; g.fillRect(2, 6, 28, 28);
      frames.push(s.c);
    }
    anim.crystal_orb = { frames: frames, fps: 5, ox: 0, oy: -14 };
  }

  // banners pick their element from H.bannerEl["tx,ty"] (set by interiors.js), else by position
  H.bannerEl = H.bannerEl || {};
  function bannerArt(el) {
    var s = HD.mk2(16, 16), g = s.g, c = EL[el];
    P(g, 2, 1, OL, 28, 3); P(g, 3, 2, BRASS[0], 26, 1); P(g, 1, 1, OL, 3, 3); P(g, 28, 1, OL, 3, 3);
    P(g, 6, 4, OL, 20, 24);
    P(g, 7, 4, c[0], 18, 22); P(g, 7, 4, c[1], 18, 3); P(g, 7, 4, c[1], 2, 22);
    P(g, 7, 26, OL, 18, 2); P(g, 7, 26, c[0], 4, 4); P(g, 14, 26, c[0], 4, 4); P(g, 21, 26, c[0], 4, 4);
    P(g, 6, 30, OL, 6, 1); P(g, 13, 30, OL, 6, 1); P(g, 20, 30, OL, 6, 1);
    glyph(g, el, 11, 10, c[2], 1);
    return { c: s.c, ox: 0, oy: -2 };
  }

  painters.notice_board = function () {
    var s = HD.mk2(32, 22), g = s.g;
    box(g, 2, 2, 60, 36, DWOOD[1], DWOOD[3], DWOOD[2], OL);
    P(g, 6, 6, '#b8885a', 52, 28);
    for (var i = 0; i < 50; i++) P(g, 6 + ((hash(i, 5) * 51) | 0), 6 + ((hash(5, i) * 27) | 0), '#a07448', 1, 1);
    var notes = [[9, 8, 14, 16, '#f4ead0'], [26, 10, 12, 12, '#ffe8a0'], [41, 7, 14, 14, '#d8ecff'], [24, 24, 16, 8, '#ffd8e0']];
    notes.forEach(function (n, j) {
      P(g, n[0] + 1, n[1] + 1, 'rgba(40,20,10,0.3)', n[2], n[3]); P(g, n[0], n[1], n[4], n[2], n[3]);
      for (var l = n[1] + 4; l < n[1] + n[3] - 2; l += 3) P(g, n[0] + 2, l, '#8a7a6a', n[2] - 4 - (l % 2) * 2, 1);
      P(g, n[0] + (n[2] >> 1) - 1, n[1] - 1, ['#c84a3a', '#3f78c8', '#4aa050', '#c8a030'][j], 3, 3);
    });
    P(g, 44, 12, '#ffb04a', 6, 4); P(g, 45, 10, '#ffb04a', 2, 2); P(g, 49, 10, '#ffb04a', 2, 2); // little fox doodle
    return { c: s.c, ox: 0, oy: -6 };
  };

  painters.loom = function () {
    var s = HD.mk2(16, 30), g = s.g;
    HD.softShadow(g, 2, 54, 28, 5);
    P(g, 2, 6, OL, 4, 52); P(g, 26, 6, OL, 4, 52); P(g, 3, 7, WOOD[1], 2, 50); P(g, 27, 7, WOOD[1], 2, 50);
    P(g, 2, 6, OL, 28, 4); P(g, 3, 7, WOOD[3], 26, 2);
    P(g, 2, 44, OL, 28, 4); P(g, 3, 45, WOOD[1], 26, 2);
    // warp threads + woven cloth
    for (var x = 7; x < 26; x += 2) P(g, x, 10, '#e8e0d0', 1, 18);
    var bands = ['#c84a3a', '#e8b040', '#3f78c8', '#f0e8d4', '#5a9a50'];
    for (var y = 28; y < 44; y++) P(g, 6, y, bands[((y - 28) / 3 | 0) % 5], 20, 1);
    for (var y2 = 29; y2 < 44; y2 += 2) for (var x2 = 6 + (y2 % 4 ? 0 : 1); x2 < 26; x2 += 2) P(g, x2, y2, 'rgba(0,0,0,0.12)', 1, 1);
    P(g, 6, 26, OL, 20, 2); P(g, 8, 26, LWOOD[1], 16, 1);
    // yarn ball
    ell(g, 26, 54, 4, 3, OL); ell(g, 26, 54, 3, 2, '#c84a8a'); P(g, 24, 53, '#f0a0c8', 2, 1);
    return { c: s.c, ox: 0, oy: -14 };
  };

  painters.flower_vase = function () {
    var s = HD.mk2(16, 24), g = s.g;
    HD.softShadow(g, 4, 42, 24, 5);
    // small round side table
    P(g, 14, 30, OL, 4, 14); P(g, 15, 31, DWOOD[1], 2, 12); P(g, 8, 42, OL, 16, 2);
    ell(g, 16, 28, 12, 4, OL); ell(g, 16, 28, 11, 3, LWOOD[0]); ell(g, 15, 27, 8, 2, LWOOD[1]);
    // vase
    HD.rr(g, 11, 14, 10, 14, 4, OL); HD.rr(g, 12, 15, 8, 12, 3, '#3f78c8'); P(g, 13, 16, '#9ad0ff', 2, 6); P(g, 12, 20, '#f0e8d4', 8, 1);
    // flowers
    P(g, 15, 6, '#3e7a30', 1, 9); P(g, 12, 8, '#3e7a30', 1, 7); P(g, 19, 7, '#3e7a30', 1, 8);
    [[15, 4, '#ff8ab0'], [11, 6, '#ffe070'], [19, 5, '#f4f0ff'], [22, 9, '#ff8ab0'], [9, 10, '#c0a0ff']].forEach(function (f) {
      P(g, f[0] - 1, f[1], f[2], 3, 1); P(g, f[0], f[1] - 1, f[2], 1, 3); P(g, f[0], f[1], '#fff4c0', 1, 1);
    });
    P(g, 21, 11, '#5aa040', 2, 2); P(g, 9, 12, '#5aa040', 2, 2);
    return { c: s.c, ox: 0, oy: -8 };
  };

  var newInfo = {
    shop_counter: { fw: 3, fh: 1, solid: true },
    shop_shelf: { fw: 2, fh: 1, solid: true },
    potion_rack: { fw: 1, fh: 1, solid: true, light: { dx: 8, dy: 0, r: 22, color: '#a0ffe0', flicker: false } },
    barrel_in: { fw: 1, fh: 1, solid: true },
    tavern_counter: { fw: 3, fh: 1, solid: true },
    ramen_pot: { fw: 1, fh: 1, solid: true, light: { dx: 8, dy: 10, r: 26, color: '#ff9a4a', flicker: true } },
    stool: { fw: 1, fh: 1, solid: true },
    tavern_table: { fw: 2, fh: 2, solid: true },
    lantern_hang: { fw: 1, fh: 1, solid: false, decor: true, light: { dx: 8, dy: 10, r: 30, color: '#ffb070', flicker: true } },
    blackboard: { fw: 2, fh: 1, solid: false, decor: true },
    school_desk: { fw: 1, fh: 1, solid: true },
    bookstack: { fw: 1, fh: 1, solid: true },
    crystal_orb: { fw: 1, fh: 1, solid: true, light: { dx: 8, dy: 4, r: 30, color: '#b8a0ff', flicker: false } },
    element_banner: { fw: 1, fh: 1, solid: false, decor: true },
    notice_board: { fw: 2, fh: 1, solid: false, decor: true },
    loom: { fw: 1, fh: 1, solid: true },
    flower_vase: { fw: 1, fh: 1, solid: true }
  };
  var builders = { ramen_pot: buildRamen, crystal_orb: buildOrb };
  var AO = { shop_counter: 1, shop_shelf: 1, tavern_counter: 1, potion_rack: 1, loom: 1, school_desk: 1 };

  function drawProps(ctx, type, px, py, env) {
    var t = (env && env.t) || 0;
    px = px | 0; py = py | 0;
    if (builders[type]) {
      if (!anim[type]) builders[type]();
      var A = anim[type], n = (A && A.frames && A.frames.length) || 0, fi = n ? ((Math.floor((+t || 0) * A.fps) % n) + n) % n : 0;
      if (n && A.frames[fi]) HD.blit(ctx, A.frames[fi], px + A.ox, py + A.oy);
      return true;
    }
    var a;
    if (type === 'element_banner') {
      var tx = (px / 16) | 0, ty = (py / 16) | 0, el = H.bannerEl[tx + ',' + ty] || ELS[(tx + ty * 3) % 8];
      a = cache['b_' + el] || (cache['b_' + el] = bannerArt(el));
    } else {
      var p = painters[type]; if (!p) return false;
      a = cache[type] || (cache[type] = p());
    }
    HD.blit(ctx, a.c, px + a.ox, py + a.oy);
    return true;
  }

  if (H.furniture) {
    var info = H.furniture.info || (H.furniture.info = {});
    for (var k in newInfo) if (!info[k]) info[k] = newInfo[k];
    var prev = H.furniture.draw;
    H.furniture.draw = function (ctx, type, px, py, env) {
      if (newInfo[type]) {
        if (AO[type]) { var bw = newInfo[type].fw * 16, by = (py | 0) + 16, bx = px | 0;
          ctx.fillStyle = 'rgba(20,8,3,0.26)'; ctx.fillRect(bx + 1, by - 2, bw, 3); }
        if (drawProps(ctx, type, px, py, env)) return;
      }
      if (prev) return prev.call(H.furniture, ctx, type, px, py, env);
    };
  }
  H.interiorsProps = { types: Object.keys(newInfo), elements: ELS };
})();
