window.H = window.H || {};
/*
  tiles_cave.js: the cave tiles (natural rock, no masonry), painted in code at double resolution like
  tiles_indoor.js: every picture is a cached 32x32 canvas shown in a 16x16 cell. A cave map is an
  indoor map (tileset 'indoor') whose legend names these ids, so it needs no other code.

  API: adds tile ids to H.tilesIndoor (draw is wrapped; solid and still get the new ids):
    cave_floor       uneven earth and stone, pebbles, cracks, now and then a small puddle
    cave_rock        the rock mass seen from above: dark, with a lit lip where a rock face falls away
                     to the south and a rough rim where a floor touches it          (solid)
    cave_wall        a rock face (stack two rows above a floor): crevices, ledges, rubble at its foot (solid)
    cave_carving     a rock face with old carvings cut into it: people and creatures side by side;
                     three pictures, chosen by the tile column                       (solid)
    cave_lava        slow lava under plates of dark crust, a burnt rim at its shore  (solid)
    cave_pool        still cave water with a stone rim                               (solid)
    cave_stalagmite  floor with stalagmites                                          (solid)
    cave_crystal     floor with a cluster of pale blue crystals                      (solid)
    cave_nest        floor with an empty nest of twigs and ash                       (solid)
  Every picture is a pure function of the tile id, its position and its neighbours, so all are still.
  And to H.tilesOutdoor, for the volcano maps:
    lava             glowing orange lava under dark crust, a burnt rim at its shore, a slow pulse of four
                     frames from env.t (solid, not still; it is not water, so nothing can be fished from it)
    cooled_lava      dark grey rock with faint cracks, one still warm: lava that was cooled (walkable, still)
    ash              the grey ash ground of the volcano country, cinders in it (walkable, still)
  Sheets (H.sheets): group 'indoor' keys 'cave:<kind><variant>', group 'outdoor' keys 'cave:ol...' and 'cave:oc...'.
*/
(function () {
  'use strict';
  var H = window.H;
  if (!H.tilesIndoor) return;
  var TI = H.tilesIndoor, TO = H.tilesOutdoor, base = TI.draw, T = 16, S = 32;
  var OL = '#1e1a14';
  /* rock, dark to light */
  var W0 = '#2a2320', W1 = '#433932', W2 = '#574b42', W3 = '#6c5e52', W4 = '#857565', W5 = '#a39280';
  /* floor */
  var F0 = '#4d4239', F1 = '#5f5247', F2 = '#6b5d50', F3 = '#77695a', F4 = '#8d8071', F5 = '#a89b8a';
  /* the rock mass from above */
  var M0 = '#15110f', M1 = '#1d1816', M2 = '#26201d', M3 = '#302925';
  var SOLID = { cave_rock: 1, cave_wall: 1, cave_carving: 1, cave_lava: 1, cave_pool: 1, cave_stalagmite: 1, cave_crystal: 1, cave_nest: 1 };
  var IDS = ['cave_floor', 'cave_rock', 'cave_wall', 'cave_carving', 'cave_lava', 'cave_pool', 'cave_stalagmite', 'cave_crystal', 'cave_nest'];
  var FLOOR_VARIANTS = 16, FACE_VARIANTS = 8, TOP_VARIANTS = 3;

  function hash(x, y, s) {
    var h = (x * 374761393 + y * 668265263 + (s || 0) * 2147483647) | 0;
    h = (h ^ (h >>> 13)) * 1274126177 | 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function mk() { var c = document.createElement('canvas'); c.width = S; c.height = S; return c; }
  /* R paints in tile pixels (16 to a tile), F in fine pixels (32 to a tile) */
  function R(g, col, x, y, w, h) { g.fillStyle = col; g.fillRect(x * 2, y * 2, (w || 1) * 2, (h || 1) * 2); }
  function F(g, col, x, y, w, h) { g.fillStyle = col; g.fillRect(x, y, w || 1, h || 1); }
  function ell(g, col, cx, cy, rx, ry) {
    for (var y = -ry; y <= ry; y++) for (var x = -rx; x <= rx; x++) if ((x * x) / (rx * rx + 0.4) + (y * y) / (ry * ry + 0.4) <= 1) F(g, col, cx + x, cy + y);
  }

  function isRock(id) { return id === 'cave_rock' || id === 'void'; }
  function isFace(id) { return id === 'cave_wall' || id === 'cave_carving'; }

  /* ---------- floor ---------- */
  /* v 0..15: plain variants; 16 and 17 hold a puddle */
  function paintFloor(g, v, shade, left) {
    var i, x, y, r, w;
    F(g, F2, 0, 0, S, S);
    /* soft uneven patches of paler dust and darker damp earth */
    for (i = 0; i < 7; i++) {
      x = (hash(v * 31 + i, 1, 7) * 28) | 0; y = (hash(v * 17 + i, 2, 7) * 28) | 0; r = hash(v + i, 3, 7);
      ell(g, r < 0.5 ? F3 : F1, x + 2, y + 2, 3 + ((r * 13) | 0) % 4, 1 + ((r * 7) | 0) % 2);
    }
    /* grit */
    for (i = 0; i < 30; i++) {
      x = (hash(v * 13 + i, 5, 9) * 32) | 0; y = (hash(v * 19 + i, 6, 9) * 32) | 0; r = hash(v * 3 + i, 7, 9);
      F(g, r < 0.4 ? F4 : r < 0.75 ? F1 : F0, x, y, 1, 1);
    }
    /* a flat stone set in the earth */
    if (v % 5 === 2) {
      x = 5 + ((hash(v, 31, 3) * 14) | 0); y = 6 + ((hash(v, 32, 3) * 14) | 0); w = 4 + (v % 3);
      ell(g, F0, x, y + 1, w + 1, 3); ell(g, F3, x, y, w, 2); F(g, F4, x - w + 1, y - 1, w, 1); F(g, F1, x, y + 1, w - 1, 1);
    }
    /* a crack */
    if (v % 4 === 1) {
      x = 6 + ((hash(v, 11, 3) * 14) | 0); y = 5 + ((hash(v, 12, 3) * 8) | 0);
      for (i = 0; i < 12; i++) { F(g, F0, x, y); if (hash(v, i, 13) < 0.5) F(g, F0, x + 1, y); x += hash(v, i, 14) < 0.55 ? 1 : 0; y += hash(v, i, 15) < 0.8 ? 1 : 0; }
    }
    /* pebbles */
    if (v % 3 === 0) {
      for (i = 0; i < 1 + (v % 2); i++) {
        x = 5 + ((hash(v, i, 21) * 20) | 0); y = 6 + ((hash(v, i, 22) * 20) | 0);
        F(g, F0, x, y + 3, 5, 1); F(g, OL, x + 1, y + 3, 3, 1); F(g, F4, x, y + 1, 5, 2); F(g, F4, x + 1, y, 3, 1); F(g, F5, x + 1, y + 1, 2, 1); F(g, F1, x + 3, y + 2, 2, 1);
      }
    }
    /* a puddle of drip water */
    if (v >= 16) {
      x = v === 16 ? 15 : 17; y = v === 16 ? 17 : 15;
      ell(g, F0, x, y, 11, 7); ell(g, F0, x + 4, y + 3, 7, 5); ell(g, '#3b5568', x, y, 10, 6); ell(g, '#3b5568', x + 4, y + 3, 6, 4);
      ell(g, '#4a6b82', x - 1, y - 1, 7, 3); ell(g, '#5b8098', x - 2, y - 2, 4, 1); F(g, '#b4d8e6', x - 6, y - 3, 4, 1); F(g, '#b4d8e6', x - 7, y - 2, 2, 1); F(g, '#7ea6bc', x + 3, y + 3, 4, 1);
    }
    if (shade) {
      var a = [0.5, 0.44, 0.38, 0.31, 0.25, 0.19, 0.14, 0.1, 0.06];
      for (i = 0; i < a.length; i++) F(g, 'rgba(14,10,8,' + a[i] + ')', 0, i, S, 1);
    }
    if (left) { F(g, 'rgba(14,10,8,0.3)', 0, 0, 3, S); F(g, 'rgba(14,10,8,0.14)', 3, 0, 3, S); }
  }

  /* ---------- rock face ---------- */
  /* row: 0 the upper row of a face, 1 the lower row, 2 a face one row high */
  function paintFace(g, v, row, endL, endR) {
    var x, y, i, c, cracks = [3 + ((hash(v, 1, 31) * 4) | 0), 9 + ((hash(v, 2, 31) * 4) | 0), 14 + ((hash(v, 3, 31) * 2) | 0)];
    var yo = row === 1 ? 16 : 0;
    F(g, W2, 0, 0, S, S);
    /* light falls from above: the upper row is paler, the foot darker */
    for (y = 0; y < 16; y++) {
      var depth = (y + yo) / (row === 2 ? 16 : 32);
      for (x = 0; x < 16; x++) {
        var n = hash(v * 16 + x, y + yo, 33);
        c = depth < 0.3 ? (n < 0.55 ? W3 : W2) : depth < 0.7 ? (n < 0.2 ? W3 : n < 0.85 ? W2 : W1) : (n < 0.5 ? W2 : W1);
        R(g, c, x, y);
      }
    }
    /* crevices running down, a lit edge on their right and a dark one on their left */
    for (i = 0; i < cracks.length; i++) {
      x = cracks[i];
      for (y = 0; y < 16; y++) {
        if (((y + yo) & 3) === 0) x += hash(v * 5 + i, (y + yo) >> 2, 35) < 0.34 ? -1 : hash(v * 5 + i, (y + yo) >> 2, 36) < 0.4 ? 1 : 0;
        if (x < 0 || x > 15) continue;
        R(g, W0, x, y);
        if (x > 0) R(g, W1, x - 1, y);
        if (x < 15) R(g, hash(v + i, y + yo, 37) < 0.7 ? W4 : W3, x + 1, y);
      }
    }
    /* ledges: a pale top edge over a dark underside */
    for (i = 0; i < 3; i++) {
      y = 2 + ((hash(v * 7 + i, row, 41) * 11) | 0); x = (hash(v * 7 + i, row, 42) * 11) | 0;
      var w = 3 + ((hash(v * 7 + i, row, 43) * 3) | 0);
      R(g, W4, x, y, w, 1); R(g, W0, x, y + 1, w, 1); R(g, W1, x + 1, y + 2, w - 1, 1);
    }
    /* fine grain */
    for (i = 0; i < 40; i++) {
      x = (hash(v * 3 + i, row, 45) * 32) | 0; y = (hash(v * 9 + i, row, 46) * 32) | 0;
      F(g, hash(v + i, row, 47) < 0.5 ? W1 : W4, x, y, 1, 1);
    }
    if (row !== 1) {
      /* the brow under the lip of the rock above */
      for (x = 0; x < 16; x++) { R(g, W4, x, 0); if (hash(v * 16 + x, 1, 49) < 0.6) R(g, W3, x, 1); }
    }
    if (row !== 0) {
      /* the foot: shadow, rubble, a dark line where it meets the floor */
      F(g, 'rgba(14,10,8,0.28)', 0, 22, S, 10);
      for (i = 0; i < 3; i++) {
        x = 1 + ((hash(v * 11 + i, 5, 51) * 12) | 0);
        R(g, W0, x, 15, 3, 1); R(g, W3, x, 14, 3, 1); R(g, W4, x, 13, 2, 1); R(g, W1, x + 2, 14, 1, 1);
      }
      for (x = 0; x < 16; x++) if (hash(v * 16 + x, 9, 53) < 0.75) R(g, W0, x, 15);
    }
    if (endL) { R(g, OL, 0, 0, 1, 16); R(g, W4, 1, 0, 1, 16); }
    if (endR) { R(g, OL, 15, 0, 1, 16); R(g, W0, 14, 0, 1, 16); }
  }

  /* glyphs of the old carvings, 14 wide by 12 high: # is the cut line */
  var GLYPHS = [
    ['...##.........', '..#..#........', '..#..#...#..#.', '...##....####.', '..####..#.##.#', '.#.##.#.######', '.#.##.#.#....#', '...##...######', '...##....#..#.', '..#..#...#..#.', '..#..#........', '.##..##.......'],
    ['......##......', '.....#..#.....', '.....#..#.....', '......##......', '.#..######..#.', '..##.####.##..', '.....####.....', '....######....', '....######....', '...########...', '...########...', '..##########..'],
    ['.#..#.....##..', '.####....#..#.', '#.##.#...#..#.', '######....##..', '#....#...####.', '######..#.##.#', '.#..#.....##..', '..........##..', '.##.##...#..#.', '#..#..#..#..#.', '.#...#..##..##', '..###.........']
  ];
  function paintCarving(g, v, row, endL, endR) {
    var rows = GLYPHS[v % GLYPHS.length], x, y;
    paintFace(g, v + 3, row, endL, endR);
    /* a panel rubbed smooth, then the cut lines: pale where the tool bit, a dark groove under each */
    for (y = 1; y < 14; y++) for (x = 1; x < 15; x++) R(g, hash(x + v * 16, y, 62) < 0.6 ? W2 : W1, x, y);
    R(g, W0, 0, 0, 16, 1); R(g, W0, 0, 14, 16, 1);
    for (y = 0; y < rows.length; y++) for (x = 0; x < 14; x++) {
      if (rows[y].charAt(x) !== '#') continue;
      R(g, '#c9b89f', x + 1, y + 1);
      F(g, W0, (x + 1) * 2, (y + 1) * 2 + 2, 2, 1);
    }
    for (y = 0; y < rows.length; y++) for (x = 0; x < 14; x++) if (rows[y].charAt(x) === '#') F(g, '#e2d3ba', (x + 1) * 2, (y + 1) * 2, 2, 1);
  }

  /* ---------- the rock mass from above ---------- */
  /* mask bits: 1 north, 2 south, 4 west, 8 east open (not rock); 16 nw, 32 ne, 64 sw, 128 se open corners */
  function paintTop(g, mask, v) {
    var n = mask & 1, s = mask & 2, w = mask & 4, e = mask & 8, i, x, y, t;
    F(g, mask ? M2 : M0, 0, 0, S, S);
    for (i = 0; i < 12; i++) {
      x = (hash(v * 23 + i, 1, 71) * 30) | 0; y = (hash(v * 29 + i, 2, 71) * 30) | 0;
      F(g, mask ? (i & 1 ? M3 : M1) : (i & 1 ? M1 : '#100d0c'), x, y, 2 + (i % 3), 1 + (i & 1));
    }
    if (!mask) return;
    /* the rock falls into the dark away from the open side */
    if (s && !n) for (y = 0; y < 5; y++) F(g, 'rgba(10,8,7,' + (0.5 - y * 0.1) + ')', 0, y * 2, S, 2);
    if (n) {
      for (x = 0; x < 16; x++) { t = hash(v * 16 + x, 3, 73) < 0.4 ? 1 : 0; R(g, OL, x, 0); R(g, W1, x, 1, 1, 1 + t); R(g, M3, x, 2 + t); }
    }
    if (w) {
      for (y = 0; y < 16; y++) { t = hash(v * 16 + y, 4, 73) < 0.4 ? 1 : 0; R(g, OL, 0, y); R(g, W2, 1, y, 1 + t, 1); R(g, M3, 2 + t, y); }
    }
    if (e) {
      for (y = 0; y < 16; y++) { t = hash(v * 16 + y, 5, 73) < 0.4 ? 1 : 0; R(g, OL, 15, y); R(g, W0, 14 - t, y, 1 + t, 1); R(g, M3, 13 - t, y); }
    }
    if (s) {
      /* the lip: the lit top edge of the face below */
      for (x = 0; x < 16; x++) {
        t = hash(v * 16 + x, 6, 73) < 0.45 ? 1 : 0;
        R(g, M3, x, 10 - t); R(g, W1, x, 11 - t); R(g, W3, x, 12 - t, 1, 2 + t); R(g, W5, x, 14); R(g, W4, x, 15);
        if (hash(v * 16 + x, 7, 73) < 0.25) R(g, W4, x, 13);
      }
      if (w) R(g, OL, 0, 10, 1, 6);
      if (e) R(g, OL, 15, 10, 1, 6);
    }
    if ((mask & 16) && !n && !w) { R(g, OL, 0, 0); R(g, W1, 1, 0, 1, 2); R(g, W1, 0, 1, 2, 1); }
    if ((mask & 32) && !n && !e) { R(g, OL, 15, 0); R(g, W0, 14, 0, 1, 2); R(g, W1, 14, 1, 2, 1); }
    if ((mask & 64) && !s && !w) { R(g, OL, 0, 15); R(g, W2, 1, 14, 1, 2); R(g, W3, 0, 14, 2, 1); }
    if ((mask & 128) && !s && !e) { R(g, OL, 15, 15); R(g, W0, 14, 14, 1, 2); R(g, W3, 14, 14, 2, 1); }
  }

  /* ---------- lava and water: mask bits 1 n, 2 s, 4 w, 8 e open (shore) ---------- */
  function paintLiquid(g, lava, mask, v) {
    var i, x, y, deep = lava ? '#d8501a' : '#365468', mid = lava ? '#f07a22' : '#44687e', hot = lava ? '#ffb23c' : '#5b859c', glint = lava ? '#ffe680' : '#b4d8e6';
    var crust = lava ? '#4a1a12' : '#2c4354', crustL = lava ? '#7c2c16' : '#3a5668', rim = lava ? '#2a1210' : '#2a2320', rimL = lava ? '#5a2416' : W3;
    F(g, deep, 0, 0, S, S);
    for (i = 0; i < 7; i++) {
      x = (hash(v * 31 + i, 1, 81) * 28) | 0; y = (hash(v * 37 + i, 2, 81) * 28) | 0;
      ell(g, mid, x + 2, y + 2, 4 + (i % 3), 2);
    }
    for (i = 0; i < 4; i++) {
      x = (hash(v * 41 + i, 3, 81) * 26) | 0; y = (hash(v * 43 + i, 4, 81) * 28) | 0;
      F(g, hot, x, y, 6, 1); F(g, hot, x + 2, y + 1, 5, 1); F(g, glint, x + 2, y, 3, 1);
    }
    if (lava) {
      /* plates of cooled crust drifting on it */
      for (i = 0; i < 2; i++) {
        x = 4 + ((hash(v * 47 + i, 5, 81) * 20) | 0); y = 4 + ((hash(v * 53 + i, 6, 81) * 20) | 0);
        ell(g, crustL, x, y, 4, 2); ell(g, crust, x, y, 3, 1); F(g, hot, x - 4, y + 3, 8, 1);
      }
    } else {
      for (i = 0; i < 3; i++) F(g, crustL, (hash(v + i, 7, 81) * 26) | 0, (hash(v + i, 8, 81) * 30) | 0, 5, 1);
    }
    for (i = 0; i < 16; i++) {
      var t = hash(v * 16 + i, 9, 83) < 0.45 ? 1 : 0;
      if (mask & 1) { R(g, rim, i, 0, 1, 2 + t); R(g, rimL, i, 0); if (lava) R(g, hot, i, 2 + t); }
      if (mask & 2) { R(g, rim, i, 14 - t, 1, 2 + t); R(g, OL, i, 15); if (lava) R(g, hot, i, 13 - t); }
      if (mask & 4) { R(g, rim, 0, i, 2 + t, 1); R(g, rimL, 0, i); if (lava) R(g, hot, 2 + t, i); }
      if (mask & 8) { R(g, rim, 14 - t, i, 2 + t, 1); R(g, OL, 15, i); if (lava) R(g, hot, 13 - t, i); }
    }
  }

  /* ---------- things standing on the floor ---------- */
  function cone(g, cx, by, hw, h) {
    var y, w, x;
    ell(g, 'rgba(14,10,8,0.4)', cx + 2, by, hw + 3, 2);
    for (y = 0; y < h; y++) {
      w = Math.max(0, Math.round(hw * Math.pow(1 - y / h, 1.25)));
      for (x = -w; x <= w; x++) F(g, x <= -w + 1 && w > 1 ? W5 : x < 0 ? W4 : x < w * 0.5 ? W3 : W1, cx + x, by - y);
      F(g, OL, cx - w - 1, by - y); F(g, OL, cx + w + 1, by - y);
      if (y % 5 === 3 && w > 1) F(g, W2, cx - w + 1, by - y, w * 2 - 1, 1);
    }
    F(g, OL, cx, by - h, 1, 1); F(g, OL, cx - hw - 1, by + 1, hw * 2 + 3, 1);
  }
  function paintStalagmite(g, v) {
    paintFloor(g, v + 1, false, false);
    if (v % 3 === 0) { cone(g, 12, 28, 6, 25); cone(g, 24, 30, 4, 14); }
    else if (v % 3 === 1) { cone(g, 20, 28, 6, 26); cone(g, 8, 30, 4, 15); cone(g, 27, 30, 2, 8); }
    else { cone(g, 16, 29, 7, 27); cone(g, 5, 30, 3, 10); cone(g, 27, 30, 3, 12); }
  }
  function shard(g, x0, by, w, h, lean) {
    var y, x, sx;
    for (y = 0; y < h; y++) {
      sx = x0 + Math.round(lean * y / h);
      var ww = y > h - 4 ? Math.max(1, w - (y - (h - 4)) * 1) : w;
      for (x = 0; x < ww; x++) F(g, x === 0 ? '#c8fbf4' : x < ww / 2 ? '#7fdcdc' : '#3a9cb0', sx + x, by - y);
      F(g, '#123a44', sx - 1, by - y); F(g, '#123a44', sx + ww, by - y);
    }
    F(g, '#123a44', x0 + lean, by - h, 2, 1); F(g, '#ffffff', x0 + Math.round(lean * 0.6), by - h + 3, 1, 2);
  }
  function paintCrystal(g, v) {
    paintFloor(g, v + 2, false, false);
    ell(g, 'rgba(120,236,228,0.16)', 16, 20, 13, 9);
    ell(g, 'rgba(14,10,8,0.35)', 16, 28, 10, 2);
    if (v % 2) { shard(g, 8, 28, 4, 11, -3); shard(g, 20, 28, 4, 13, 3); shard(g, 13, 29, 5, 22, 0); shard(g, 25, 29, 3, 7, 2); }
    else { shard(g, 18, 28, 4, 12, 4); shard(g, 6, 28, 3, 8, -2); shard(g, 11, 29, 5, 20, 1); }
    F(g, '#123a44', 6, 29, 22, 1);
  }
  function paintNest(g, v) {
    var i, a, x, y, TW = ['#4a3018', '#6e4a26', '#93693a', '#b58a52'];
    paintFloor(g, v + 4, false, false);
    ell(g, 'rgba(14,10,8,0.35)', 16, 21, 15, 9);
    ell(g, OL, 16, 18, 14, 9); ell(g, TW[1], 16, 18, 13, 8);
    /* woven twigs round the rim */
    for (i = 0; i < 40; i++) {
      a = i / 40 * Math.PI * 2; x = 16 + Math.round(Math.cos(a) * 11); y = 18 + Math.round(Math.sin(a) * 6.5);
      F(g, TW[(i * 7) % 4], x - 1, y, 3, 1); F(g, TW[(i * 5 + 1) % 4], x, y - 1, 2, 1);
    }
    /* the hollow, lined with pale ash and down, empty */
    ell(g, TW[0], 16, 18, 9, 5); ell(g, '#2a2320', 16, 18, 8, 4); ell(g, '#5c554e', 16, 19, 6, 3); ell(g, '#7b736a', 15, 19, 4, 2);
    F(g, '#a39a8e', 13, 19, 3, 1); F(g, '#a39a8e', 17, 20, 2, 1);
    /* loose twigs beside it */
    F(g, TW[2], 2, 27, 5, 1); F(g, TW[0], 3, 28, 4, 1); F(g, TW[3], 25, 28, 4, 1); F(g, TW[1], 27, 27, 3, 1);
  }

  /* ---------- which picture a tile shows ---------- */
  var cache = {}, entries = {};
  function ent(key, paint, a, b, c, d) { return entries[key] || (entries[key] = { key: key, k: 'cave:' + key, paint: paint, a: a, b: b, c: c, d: d, r: 0 }); }
  function shoreMask(nb, id) { return (nb(0, -1) !== id ? 1 : 0) | (nb(0, 1) !== id ? 2 : 0) | (nb(-1, 0) !== id ? 4 : 0) | (nb(1, 0) !== id ? 8 : 0); }
  function entry(id, tx, ty, nb) {
    var v, up, row, l, r, mask, n, s, w, e;
    if (id === 'cave_floor') {
      v = (hash(tx, ty, 3) * FLOOR_VARIANTS) | 0; up = nb(0, -1);
      if (hash(tx, ty, 77) < 0.012) v = 16 + (tx & 1);
      var sh = isFace(up) || isRock(up) ? 1 : 0, lf = isRock(nb(-1, 0)) || isFace(nb(-1, 0)) ? 1 : 0;
      return ent('f' + v + sh + lf, paintFloor, v, sh, lf);
    }
    if (id === 'cave_wall' || id === 'cave_carving') {
      row = isFace(nb(0, -1)) ? 1 : isFace(nb(0, 1)) ? 0 : 2;
      l = !isFace(nb(-1, 0)) && !isRock(nb(-1, 0)) ? 1 : 0; r = !isFace(nb(1, 0)) && !isRock(nb(1, 0)) ? 1 : 0;
      if (id === 'cave_carving') { v = ((tx % 3) + 3) % 3; return ent('c' + v + row + l + r, paintCarving, v, row, l, r); }
      v = (hash(tx, 0, 5) * FACE_VARIANTS) | 0;
      return ent('w' + v + row + l + r, paintFace, v, row, l, r);
    }
    if (id === 'cave_rock') {
      n = !isRock(nb(0, -1)); s = !isRock(nb(0, 1)); w = !isRock(nb(-1, 0)); e = !isRock(nb(1, 0));
      mask = (n ? 1 : 0) | (s ? 2 : 0) | (w ? 4 : 0) | (e ? 8 : 0);
      if (!n && !w && !isRock(nb(-1, -1))) mask |= 16;
      if (!n && !e && !isRock(nb(1, -1))) mask |= 32;
      if (!s && !w && !isRock(nb(-1, 1))) mask |= 64;
      if (!s && !e && !isRock(nb(1, 1))) mask |= 128;
      v = (hash(tx, ty, 7) * TOP_VARIANTS) | 0;
      return ent('t' + mask + '_' + v, paintTop, mask, v);
    }
    v = (hash(tx, ty, 9) * 4) | 0;
    if (id === 'cave_lava') { mask = shoreMask(nb, id); return ent('l' + mask + '_' + v, paintLiquid, true, mask, v); }
    if (id === 'cave_pool') { mask = shoreMask(nb, id); return ent('p' + mask + '_' + v, paintLiquid, false, mask, v); }
    if (id === 'cave_stalagmite') return ent('s' + v, paintStalagmite, v);
    if (id === 'cave_crystal') return ent('x' + v, paintCrystal, v);
    return ent('n' + (v & 1), paintNest, v & 1);
  }
  function canvasOf(o) {
    var c = cache[o.key], SH = H.sheets;
    if (c) return c;
    c = mk();
    var g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    o.paint(g, o.a, o.b, o.c, o.d);
    cache[o.key] = c;
    if (SH && SH.recording && SH.rec && !o.r) { o.r = 1; try { SH.rec(o.group || 'indoor', o.k, c); } catch (err) {} }
    return c;
  }
  var pend = null;
  function paintPend() { return pend ? canvasOf(pend) : null; }
  function same() { return 'cave_rock'; }

  for (var i = 0; i < IDS.length; i++) { TI.solid[IDS[i]] = !!SOLID[IDS[i]]; TI.still[IDS[i]] = true; }
  TI.draw = function (ctx, id, px, py, tx, ty, env, nb) {
    if (!(id in TI.solid) || id.charCodeAt(0) !== 99 || id.indexOf('cave_') !== 0) { base.apply(this, arguments); return; }
    var o = entry(id, tx | 0, ty | 0, nb || same), x = Math.round(px * 2) / 2, y = Math.round(py * 2) / 2, SH = H.sheets;
    if (SH && SH.draw) { pend = o; try { SH.draw(ctx, o.k, x, y, paintPend, T, T); return; } catch (err) {} }
    ctx.drawImage(canvasOf(o), x, y, T, T);
  };

  /* sheet build: every picture but the rarer rims of the rock mass (those are painted on first use) */
  function enumerate() {
    var count = 0, a, b, c, d, list = [];
    for (a = 0; a < FLOOR_VARIANTS + 2; a++) for (b = 0; b < 2; b++) for (c = 0; c < 2; c++) list.push(ent('f' + a + b + c, paintFloor, a, b, c));
    for (b = 0; b < 3; b++) for (c = 0; c < 2; c++) for (d = 0; d < 2; d++) {
      for (a = 0; a < FACE_VARIANTS; a++) list.push(ent('w' + a + b + c + d, paintFace, a, b, c, d));
      for (a = 0; a < 3; a++) list.push(ent('c' + a + b + c + d, paintCarving, a, b, c, d));
    }
    for (a = 0; a < 16; a++) for (b = 0; b < TOP_VARIANTS; b++) list.push(ent('t' + a + '_' + b, paintTop, a, b));
    for (a = 0; a < 16; a++) for (b = 0; b < 4; b++) { list.push(ent('l' + a + '_' + b, paintLiquid, true, a, b)); list.push(ent('p' + a + '_' + b, paintLiquid, false, a, b)); }
    for (a = 0; a < 4; a++) { list.push(ent('s' + a, paintStalagmite, a)); list.push(ent('x' + a, paintCrystal, a)); }
    list.push(ent('n0', paintNest, 0)); list.push(ent('n1', paintNest, 1));
    for (a = 0; a < list.length; a++) { canvasOf(list[a]); count++; }
    return { count: count, pixels: count * S * S };
  }
  if (H.sheets && H.sheets.enumerate) try { H.sheets.enumerate('indoor', enumerate); } catch (err) {}

  /* ---------- outdoors: lava and the rock it cools into ---------- */
  var PULSE = [0, 0.07, 0.14, 0.07], PULSE_SECONDS = 1.6;
  function paintLava(g, mask, v, frame) {
    paintLiquid(g, true, mask, v);
    if (PULSE[frame]) F(g, 'rgba(255,224,130,' + PULSE[frame] + ')', 0, 0, S, S);
  }
  function paintCooled(g, mask, v) {
    var i, x, y, B0 = '#2b2826', B1 = '#3a3633', B2 = '#48433f', B3 = '#5a544e';
    F(g, B1, 0, 0, S, S);
    for (i = 0; i < 8; i++) {
      x = (hash(v * 31 + i, 1, 91) * 28) | 0; y = (hash(v * 37 + i, 2, 91) * 28) | 0;
      ell(g, i & 1 ? B2 : B0, x + 2, y + 2, 3 + (i % 3), 1 + (i & 1));
    }
    for (i = 0; i < 26; i++) F(g, i % 3 ? B2 : B3, (hash(v * 13 + i, 3, 91) * 32) | 0, (hash(v * 17 + i, 4, 91) * 32) | 0, 1, 1);
    /* faint cracks, one of them still warm */
    for (i = 0; i < 2; i++) {
      x = 4 + ((hash(v, i, 93) * 20) | 0); y = 3 + ((hash(v, i, 94) * 10) | 0);
      for (var k = 0; k < 14; k++) { F(g, i === 0 && v % 2 === 0 && k > 3 && k < 9 ? '#8a3a1c' : B0, x, y); x += hash(v * 7 + i, k, 95) < 0.5 ? 1 : hash(v * 7 + i, k, 96) < 0.3 ? -1 : 0; y += hash(v * 7 + i, k, 97) < 0.75 ? 1 : 0; }
    }
    for (i = 0; i < 16; i++) {
      if (mask & 1) { R(g, B0, i, 0); F(g, B3, i * 2, 2, 2, 1); }
      if (mask & 2) { R(g, B0, i, 15); }
      if (mask & 4) { R(g, B0, 0, i); F(g, B3, 2, i * 2, 1, 2); }
      if (mask & 8) { R(g, B0, 15, i); }
    }
  }
  /* mask: 1 n, 2 s, 4 w, 8 e lie against green ground */
  function paintAsh(g, mask, v) {
    var i, x, y, r, A0 = '#4f4844', A1 = '#625a54', A2 = '#70675f', A3 = '#7f766d', A4 = '#978d82';
    F(g, A2, 0, 0, S, S);
    for (i = 0; i < 8; i++) {
      x = (hash(v * 31 + i, 1, 101) * 28) | 0; y = (hash(v * 37 + i, 2, 101) * 28) | 0; r = hash(v + i, 3, 101);
      ell(g, r < 0.5 ? A3 : A1, x + 2, y + 2, 3 + ((r * 11) | 0) % 4, 1 + ((r * 7) | 0) % 2);
    }
    for (i = 0; i < 30; i++) {
      x = (hash(v * 13 + i, 5, 103) * 32) | 0; y = (hash(v * 19 + i, 6, 103) * 32) | 0; r = hash(v * 3 + i, 7, 103);
      F(g, r < 0.35 ? A4 : r < 0.7 ? A1 : A0, x, y, 1, 1);
    }
    /* a cinder or two */
    if (v % 3 === 0) {
      x = 6 + ((hash(v, 8, 105) * 18) | 0); y = 6 + ((hash(v, 9, 105) * 18) | 0);
      F(g, A0, x, y + 2, 4, 1); F(g, '#3a3432', x, y, 4, 2); F(g, A1, x + 1, y, 2, 1);
    }
    for (i = 0; i < 16; i++) {
      r = hash(v * 16 + i, 11, 107);
      if (mask & 1) { R(g, A1, i, 0, 1, r < 0.5 ? 2 : 1); if (r < 0.3) R(g, A0, i, 0); }
      if (mask & 2) { R(g, A1, i, r < 0.5 ? 14 : 15, 1, r < 0.5 ? 2 : 1); if (r < 0.3) R(g, A0, i, 15); }
      if (mask & 4) { R(g, A1, 0, i, r < 0.5 ? 2 : 1, 1); if (r < 0.3) R(g, A0, 0, i); }
      if (mask & 8) { R(g, A1, r < 0.5 ? 14 : 15, i, r < 0.5 ? 2 : 1, 1); if (r < 0.3) R(g, A0, 15, i); }
    }
  }
  function green(n) { return n === 'grass' || n === 'tallgrass' || n === 'flowers'; }
  function entryOut(id, tx, ty, nb, env) {
    var v = (hash(tx, ty, 9) * 4) | 0, mask, o;
    if (id === 'ash') {
      v = (hash(tx, ty, 9) * 8) | 0;
      mask = (green(nb(0, -1)) ? 1 : 0) | (green(nb(0, 1)) ? 2 : 0) | (green(nb(-1, 0)) ? 4 : 0) | (green(nb(1, 0)) ? 8 : 0);
      o = ent('oa' + mask + '_' + v, paintAsh, mask, v);
      o.group = 'outdoor';
      return o;
    }
    if (id === 'lava') {
      mask = (nb(0, -1) !== 'lava' ? 1 : 0) | (nb(0, 1) !== 'lava' ? 2 : 0) | (nb(-1, 0) !== 'lava' ? 4 : 0) | (nb(1, 0) !== 'lava' ? 8 : 0);
      var frame = (((env && env.t) || 0) / PULSE_SECONDS + hash(tx >> 1, ty >> 1, 11) * 4) & 3;
      o = ent('ol' + mask + '_' + v + '_' + frame, paintLava, mask, v, frame);
    } else {
      var open = function (n) { return n !== 'cooled_lava' && n !== 'lava'; };
      mask = (open(nb(0, -1)) ? 1 : 0) | (open(nb(0, 1)) ? 2 : 0) | (open(nb(-1, 0)) ? 4 : 0) | (open(nb(1, 0)) ? 8 : 0);
      o = ent('oc' + mask + '_' + v, paintCooled, mask, v);
    }
    o.group = 'outdoor';
    return o;
  }
  function sameLava() { return 'lava'; }
  var maskNb = null, maskId = '';
  function masked(dx, dy) { var n = maskNb(dx, dy); return n === 'lava' || n === 'cooled_lava' || n === 'ash' ? maskId : n; }
  if (TO) {
    var baseOut = TO.draw;
    TO.solid.lava = true; TO.solid.cooled_lava = false; TO.solid.ash = false;
    /* lava pulses slowly (not still); the cooled rock never changes */
    TO.still.lava = false; TO.still.cooled_lava = true; TO.still.ash = true;
    TO.draw = function (ctx, id, px, py, tx, ty, env, nb) {
      if (id !== 'lava' && id !== 'cooled_lava' && id !== 'ash') {
        /* the other ground tiles fringe themselves with grass toward a tile they do not know: lava keeps its own burnt rim and ash its own edge instead */
        if (!nb) { baseOut.call(this, ctx, id, px, py, tx, ty, env, nb); return; }
        var keepNb = maskNb, keepId = maskId;
        maskNb = nb; maskId = id;
        try { baseOut.call(this, ctx, id, px, py, tx, ty, env, masked); } finally { maskNb = keepNb; maskId = keepId; }
        return;
      }
      var o = entryOut(id, tx | 0, ty | 0, nb || sameLava, env), SH = H.sheets;
      px = px | 0; py = py | 0;
      if (SH && SH.draw) { pend = o; try { SH.draw(ctx, o.k, px, py, paintPend, T, T); return; } catch (err) {} }
      ctx.drawImage(canvasOf(o), px, py, T, T);
    };
    if (H.sheets && H.sheets.enumerate) try {
      H.sheets.enumerate('outdoor', function () {
        var a, b, f, n = 0, o;
        for (a = 0; a < 16; a++) for (b = 0; b < 4; b++) {
          for (f = 0; f < 4; f++) { o = ent('ol' + a + '_' + b + '_' + f, paintLava, a, b, f); o.group = 'outdoor'; canvasOf(o); n++; }
          o = ent('oc' + a + '_' + b, paintCooled, a, b); o.group = 'outdoor'; canvasOf(o); n++;
        }
        for (a = 0; a < 16; a++) for (b = 0; b < 8; b++) { o = ent('oa' + a + '_' + b, paintAsh, a, b); o.group = 'outdoor'; canvasOf(o); n++; }
        return { count: n, pixels: n * S * S };
      });
    } catch (err) {}
  }
})();
