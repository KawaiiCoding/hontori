window.H = window.H || {};
(function () {
  'use strict';
  // Pixel-art icon set. Each icon is drawn on a 16x16 material grid, then auto-shaded
  // (3-4 tones per material ramp), outlined, and finished with highlight/sparkle overlays.
  var N = 16;

  // ramp: [outline, dark, base, light, hi]
  var R = {
    sun:   ['#7a2e0c', '#e07a18', '#ffb21f', '#ffd94a', '#fff7b8'],
    dawn:  ['#7a2440', '#f0705a', '#ff9e6a', '#ffcf86', '#fff2c4'],
    dusk:  ['#5a1416', '#c0361e', '#ec5f24', '#ff9a3c', '#ffd27a'],
    hillD: ['#2a1a3e', '#4e3a78', '#6e58a8', '#9a86d0', '#cfc2f2'],
    hillK: ['#1c0e26', '#3a1e48', '#5a2c5e', '#86426c', '#c06a7e'],
    moon:  ['#3a2c5a', '#c9b46a', '#f2e29a', '#fff4c8', '#ffffff'],
    cloud: ['#3a4a6a', '#a8b8d4', '#dfe8f6', '#f6f9ff', '#ffffff'],
    rainC: ['#262f48', '#6a7898', '#93a2c0', '#b9c6de', '#e2e9f6'],
    storm: ['#141826', '#3a405a', '#565e7e', '#7a84a4', '#a8b2cc'],
    drop:  ['#0e2a5e', '#2a6ad0', '#46a0ff', '#8ad0ff', '#e0f6ff'],
    bolt:  ['#5a3a00', '#e0a000', '#ffd21a', '#fff06a', '#ffffe0'],
    gust:  ['#1e4a5a', '#7cc0d0', '#bfeaf2', '#e8fbff', '#ffffff'],
    leaf:  ['#14401a', '#2f8a2a', '#56c03a', '#9ae05a', '#e4ffb0'],
    fog:   ['#3a4250', '#8e98a8', '#b8c0cc', '#d8dee6', '#f4f6fa'],
    heart: ['#4a0a18', '#b81c3a', '#ec3a52', '#ff7c88', '#ffd6dc'],
    gold:  ['#5a3200', '#c08010', '#f0b828', '#ffdc5a', '#fff8c8'],
    bowl:  ['#3e0c10', '#9c1e26', '#d23a36', '#f0745a', '#ffc8a8'],
    rim:   ['#3e0c10', '#d8c4a8', '#f2e6d0', '#fffaf0', '#ffffff'],
    broth: ['#4a1e08', '#b8601e', '#e08a32', '#f4b25a', '#ffe0a0'],
    noodle:['#5a4210', '#e0b84a', '#f8dc78', '#fff0b0', '#ffffff'],
    stick: ['#2e1a0c', '#6e4424', '#9a6436', '#c08a54', '#e8c08a'],
    wood:  ['#2a140a', '#5e3418', '#8a5428', '#b47a40', '#dcaa6a'],
    handle:['#1a0e1e', '#3a2448', '#5a3a6e', '#80609a', '#b8a0d0'],
    star:  ['#6a3a00', '#f0a820', '#ffd640', '#fff27a', '#ffffff'],
    pack:  ['#3a1a0c', '#8a4420', '#c0682c', '#e8964c', '#ffd09a'],
    flap:  ['#2a1008', '#6e2e18', '#9a4226', '#c4643a', '#eea070'],
    strap: ['#1e1410', '#4a3428', '#6e5040', '#927060', '#c0a090'],
    pocket:['#3a1a0c', '#9a5228', '#d07c3a', '#f0a45e', '#ffd8a8']
  };

  var EL = {
    water:    { g: ['#0b2250', '#1d58b0', '#2e86e4', '#6cc0ff', '#d6f2ff'], s: ['', '#9ad8ff', '#e6f8ff', '#ffffff', '#ffffff'] },
    fire:     { g: ['#4e0e06', '#b02c16', '#e45426', '#ff963a', '#ffe08a'], s: ['', '#ffb04a', '#ffe68a', '#fffbe0', '#ffffff'] },
    wind:     { g: ['#0b3e3a', '#249286', '#46c4ac', '#8ae8d2', '#e4fff6'], s: ['', '#b8f4e6', '#f0fffa', '#ffffff', '#ffffff'] },
    grass:    { g: ['#0f3812', '#2a7a26', '#48aa36', '#88d656', '#e0ffb0'], s: ['', '#bff07a', '#efffc8', '#ffffff', '#ffffff'] },
    electric: { g: ['#4e3a00', '#c08e00', '#f2c418', '#ffe462', '#fffbd0'], s: ['', '#7a4a00', '#a86400', '#d08a10', '#fff2a0'] },
    earth:    { g: ['#36200e', '#74461f', '#a46c36', '#cf985a', '#f4d6a6'], s: ['', '#e2c08a', '#fbe8c4', '#fffaf0', '#ffffff'] },
    dark:     { g: ['#120a22', '#352062', '#563692', '#8664c6', '#d4c2ff'], s: ['', '#b49cff', '#e4d8ff', '#ffffff', '#ffffff'] },
    light:    { g: ['#6a4a1e', '#d6b45a', '#f2e2a2', '#fff7d8', '#ffffff'], s: ['', '#c47a10', '#ec9e22', '#ffc450', '#fff0b0'] }
  };

  var SYM = {
    water:    ['...##...', '...##...', '..####..', '.##+###.', '.#+####.', '.######.', '..####..', '........'],
    fire:     ['...#....', '...##...', '..###.#.', '.####.#.', '.#+####.', '##+#####', '.######.', '..####..'],
    wind:     ['..####..', '.#....#.', '#..##..#', '#.#..#.#', '#.#.##.#', '#..#...#', '.#......', '..###...'],
    grass:    ['......##', '.....###', '...##+##', '..##+###', '.#####..', '.####...', '#.##....', '#.......'],
    electric: ['....###.', '...###..', '..###...', '.######.', '....##..', '...##...', '..##....', '.#......'],
    earth:    ['........', '...#....', '..#+#...', '..###.#.', '.#+####.', '########', '########', '........'],
    dark:     ['..###...', '.###..#.', '###.....', '##......', '##......', '###.....', '.###....', '..###...'],
    light:    ['...##...', '...##...', '..#++#..', '###++###', '########', '..####..', '...##...', '...##...']
  };

  function Grid() {
    this.m = new Array(N * N).fill(null);   // material ramp (array) per pixel
    this.t = new Array(N * N).fill(-1);     // explicit tone 0..4, -1 = auto
    this.ov = [];                           // overlay pixels drawn after outline [x,y,color]
  }
  var G = Grid.prototype;
  G.ok = function (x, y) { return x >= 0 && y >= 0 && x < N && y < N; };
  G.px = function (x, y, m, t) {
    x |= 0; y |= 0; if (!this.ok(x, y)) return;
    var i = y * N + x; this.m[i] = m; this.t[i] = t == null ? -1 : t;
  };
  G.get = function (x, y) { return this.ok(x, y) ? this.m[y * N + x] : null; };
  G.tone = function (x, y, t) { if (this.ok(x, y) && this.m[y * N + x]) this.t[y * N + x] = t; };
  G.clear = function (x, y) { if (this.ok(x, y)) { this.m[y * N + x] = null; this.t[y * N + x] = -1; } };
  G.rect = function (x, y, w, h, m) { for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) this.px(x + i, y + j, m); };
  G.disc = function (cx, cy, r, m, clip) {
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r * r && (!clip || clip(x, y))) this.px(x, y, m);
    }
  };
  G.erase = function (cx, cy, r) {
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r * r) this.clear(x, y);
    }
  };
  G.line = function (x0, y0, x1, y1, m) {
    var dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy;
    for (;;) {
      this.px(x0, y0, m);
      if (x0 === x1 && y0 === y1) break;
      var e2 = 2 * e;
      if (e2 >= dy) { e += dy; x0 += sx; }
      if (e2 <= dx) { e += dx; y0 += sy; }
    }
  };
  G.bmp = function (rows, ox, oy, map) {
    for (var j = 0; j < rows.length; j++) for (var i = 0; i < rows[j].length; i++) {
      var c = rows[j][i], v = map[c];
      if (v) this.px(ox + i, oy + j, v[0], v[1]);
    }
  };
  // light from top-left: assign tones 1..4 to every pixel of material m by position in a sphere
  G.sphere = function (m, cx, cy, r) {
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var i = y * N + x; if (this.m[i] !== m || this.t[i] >= 0) continue;
      var v = ((x + 0.5 - cx) * -0.62 + (y + 0.5 - cy) * -0.78) / r;
      var dd = Math.sqrt((x + 0.5 - cx) * (x + 0.5 - cx) + (y + 0.5 - cy) * (y + 0.5 - cy)) / r;
      this.t[i] = v > 0.5 && dd > 0.35 ? 3 : v > -0.05 ? 3 : v > -0.55 ? 2 : 1;
      if (v > 0.45 && dd > 0.45 && dd < 0.8) this.t[i] = 4;
    }
  };
  G.sparkle = function (x, y, big, col) {
    var c = col || '#fffbe0';
    this.ov.push([x, y, '#ffffff']);
    this.ov.push([x - 1, y, c], [x + 1, y, c], [x, y - 1, c], [x, y + 1, c]);
    if (big) this.ov.push([x - 2, y, c + '99'], [x + 2, y, c + '99'], [x, y - 2, c + '99'], [x, y + 2, c + '99']);
  };
  G.dot = function (x, y, c) { this.ov.push([x, y, c || '#ffffff']); };

  function render(g) {
    var cv = document.createElement('canvas'); cv.width = N; cv.height = N;
    var cx = cv.getContext('2d');
    var x, y, i, m;
    // auto tones
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
      i = y * N + x; m = g.m[i]; if (!m || g.t[i] >= 0) continue;
      var below = g.get(x, y + 1) !== m, right = g.get(x + 1, y) !== m;
      var above = g.get(x, y - 1) !== m, left = g.get(x - 1, y) !== m;
      if (below && !above) g.t[i] = 1;
      else if (right && !left && !above) g.t[i] = 1;
      else if ((above || left) && !below) g.t[i] = 3;
      else g.t[i] = 2;
    }
    // fill
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
      i = y * N + x; m = g.m[i]; if (!m) continue;
      cx.fillStyle = m[Math.max(0, Math.min(4, g.t[i]))];
      cx.fillRect(x, y, 1, 1);
    }
    // outline (4-neighbour), coloured by the touching material's darkest tone
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
      if (g.m[y * N + x]) continue;
      var n = g.get(x, y + 1) || g.get(x, y - 1) || g.get(x + 1, y) || g.get(x - 1, y);
      if (!n) continue;
      cx.fillStyle = n[0]; cx.fillRect(x, y, 1, 1);
    }
    for (i = 0; i < g.ov.length; i++) {
      var o = g.ov[i]; if (!g.ok(o[0], o[1])) continue;
      cx.fillStyle = o[2]; cx.fillRect(o[0], o[1], 1, 1);
    }
    return cv;
  }

  // ---------- shapes ----------
  function sun(g, rays, sparkles) {
    var S = R.sun;
    if (rays) {
      g.rect(7, 1, 2, 2, S); g.rect(7, 13, 2, 2, S); g.rect(1, 7, 2, 2, S); g.rect(13, 7, 2, 2, S);
      g.px(3, 3, S); g.px(12, 3, S); g.px(3, 12, S); g.px(12, 12, S);
    }
    g.disc(7.5, 7.5, 4.3, S);
    g.sphere(S, 7.5, 7.5, 4.3);
    g.dot(5, 5, '#ffffff'); g.dot(6, 5, '#fff7b8'); g.dot(5, 6, '#fff7b8');
    if (sparkles) { g.sparkle(13, 2, false); g.sparkle(2, 13, false, '#fff2a0'); }
  }
  function horizonSun(g, S, hill, warm) {
    g.disc(7.5, 11, 5.6, S, function (x, y) { return y < 11; });
    g.sphere(S, 7.5, 11, 5.6);
    // rays
    g.px(7, 2, S); g.px(8, 2, S); g.px(7, 3, S, 3); g.px(8, 3, S, 3);
    g.px(2, 6, S); g.px(13, 6, S); g.px(3, 6, S); g.px(12, 6, S);
    // horizon hills
    g.rect(1, 11, 14, 3, hill);
    g.px(2, 10, hill); g.px(3, 10, hill); g.px(11, 10, hill); g.px(12, 10, hill); g.px(13, 10, hill);
    for (var x = 1; x < 15; x++) g.tone(x, 11, x % 3 ? 3 : 2);
    if (warm) {
      // cloud streak over the setting sun
      for (var i = 3; i <= 9; i++) g.ov.push([i, 8, '#ff6a3a']);
      for (var k = 7; k <= 12; k++) g.ov.push([k, 6, '#ffb060']);
      g.sparkle(12, 2, false, '#ffd27a');
    } else {
      g.dot(5, 8, '#ffffff'); g.dot(6, 7, '#fff2c4');
      g.sparkle(13, 2, false); g.sparkle(2, 3, false, '#ffd6e0');
    }
    for (var w = 2; w < 14; w += 3) g.dot(w, 12, warm ? '#c06a7e' : '#cfc2f2');
  }
  function cloud(g, oy, m) {
    g.disc(5.2, 9.2 + oy, 3, m);
    g.disc(9.2, 7.6 + oy, 3.8, m);
    g.disc(12.2, 10 + oy, 2.4, m);
    g.rect(3, 10 + oy, 11, 2.0, m);
    g.sphere(m, 8, 7 + oy, 6.5);
    for (var x = 2; x < 15; x++) {
      if (g.get(x, 11 + oy) === m) g.tone(x, 11 + oy, 1);
    }
    g.dot(7, 5 + oy, m[4]); g.dot(8, 5 + oy, m[4]); g.dot(4, 8 + oy, m[4]);
  }

  var draw = {
    dawn: function (g) { horizonSun(g, R.dawn, R.hillD, false); },
    day: function (g) { sun(g, true, false); },
    dusk: function (g) { horizonSun(g, R.dusk, R.hillK, true); },
    night: function (g) {
      var M = R.moon;
      g.disc(6.5, 8, 5.6, M);
      g.sphere(M, 6.5, 8, 5.6);
      g.erase(9.8, 5.8, 4.6);
      g.dot(3, 7, '#ffffff'); g.dot(3, 8, '#fff4c8'); g.dot(4, 11, '#c9b46a'); g.dot(6, 12, '#c9b46a');
      g.sparkle(12, 3, true, '#fff4c8');
      g.sparkle(13, 11, false, '#cfe0ff');
      g.dot(9, 13, '#ffffff'); g.dot(14, 7, '#cfe0ff');
    },
    clear: function (g) { sun(g, true, true); },
    cloudy: function (g) {
      cloud(g, 0, R.cloud);
      g.sparkle(2, 3, false, '#ffffff');
    },
    rain: function (g) {
      cloud(g, -3, R.rainC);
      var D = R.drop;
      g.px(4, 11, D); g.px(4, 12, D); g.px(3, 13, D);
      g.px(8, 12, D); g.px(8, 13, D); g.px(7, 14, D);
      g.px(12, 11, D); g.px(12, 12, D); g.px(11, 13, D);
      g.dot(4, 11, '#e0f6ff'); g.dot(8, 12, '#e0f6ff'); g.dot(12, 11, '#e0f6ff');
    },
    storm: function (g) {
      cloud(g, -3, R.storm);
      var B = R.bolt;
      g.bmp(['..##', '.##.', '####', '.##.', '##..', '#...'], 6, 9, { '#': [B] });
      g.dot(8, 9, '#ffffe0'); g.dot(7, 10, '#ffffe0');
      var D = R.drop; g.px(3, 11, D); g.px(3, 12, D); g.px(12, 11, D); g.px(12, 12, D);
      g.sparkle(13, 14, false, '#fff06a');
    },
    wind: function (g) {
      var W = R.gust;
      g.bmp([
        '..........##....',
        '.........#..#...',
        '............#...',
        '..##########....',
        '................',
        '................',
        '.############...',
        '................',
        '................',
        '...#########....',
        '............#...',
        '.........#..#...',
        '..........##....'
      ], 0, 1, { '#': [W] });
      var L = R.leaf;
      g.px(14, 6, L); g.px(13, 7, L, 3); g.px(14, 7, L); g.px(13, 8, L, 1);
      g.dot(13, 7, '#e4ffb0');
      g.sparkle(3, 2, false, '#e8fbff');
    },
    snow: function (g) {
      cloud(g, -3, R.cloud);
      g.sparkle(4, 12, false, '#cfeeff');
      g.sparkle(11, 11, false, '#cfeeff');
      g.sparkle(8, 14, false, '#e6f6ff');
      g.dot(14, 14, '#cfeeff'); g.dot(1, 14, '#e6f6ff');
    },
    fog: function (g) {
      var F = R.fog;
      g.disc(10.5, 4.5, 3, R.sun); g.sphere(R.sun, 10.5, 4.5, 3);
      g.rect(2, 6, 11, 2, F);
      g.rect(1, 9, 9, 2, F); g.rect(11, 9, 4, 2, F);
      g.rect(3, 12, 11, 2, F);
      g.dot(3, 6, '#ffffff'); g.dot(2, 9, '#ffffff'); g.dot(4, 12, '#ffffff');
    },
    heart: function (g) {
      var Hm = R.heart;
      g.bmp([
        '...###....###...',
        '..#####..#####..',
        '.##############.',
        '.##############.',
        '.##############.',
        '..############..',
        '...##########...',
        '....########....',
        '.....######.....',
        '......####......',
        '.......##.......'
      ], 0, 2, { '#': [Hm] });
      g.sphere(Hm, 7, 6.5, 7);
      g.dot(3, 4, '#ffffff'); g.dot(4, 4, '#ffd6dc'); g.dot(3, 5, '#ffd6dc'); g.dot(10, 4, '#ffd6dc');
      g.sparkle(13, 12, false, '#ffd6dc');
    },
    energy: function (g) {
      // chopsticks
      g.line(9, 7, 14, 1, R.stick); g.line(11, 7, 15, 3, R.stick);
      // broth + noodles
      g.rect(2, 7, 12, 1, R.broth);
      g.bmp(['.##.##..##.##.', '#..#..##..#..#'], 1, 6, { '#': [R.noodle] });
      g.px(4, 7, R.noodle); g.px(9, 7, R.noodle);
      // egg slice
      g.px(11, 6, R.rim, 3); g.px(12, 6, R.rim, 3); g.px(11, 7, R.gold, 3); g.px(12, 7, R.rim, 2);
      // bowl
      g.rect(1, 8, 14, 1, R.rim);
      g.disc(7.5, 8, 6.6, R.bowl, function (x, y) { return y >= 9; });
      g.sphere(R.bowl, 6, 8, 7);
      g.rect(5, 14, 6, 1, R.bowl);
      for (var x = 3; x <= 12; x += 3) g.tone(x, 11, 4);
      // steam
      g.dot(4, 1, '#ffffffaa'); g.dot(5, 2, '#ffffffcc'); g.dot(4, 3, '#ffffffaa'); g.dot(5, 4, '#ffffff88');
      g.dot(7, 0, '#ffffff88'); g.dot(8, 1, '#ffffffbb'); g.dot(7, 2, '#ffffff99'); g.dot(8, 3, '#ffffff77');
      g.dot(2, 8, '#ffffff');
    },
    wand: function (g) {
      g.line(2, 13, 9, 6, R.wood); g.line(3, 13, 10, 6, R.wood);
      g.px(2, 14, R.handle); g.px(3, 14, R.handle);
      g.line(2, 12, 4, 10, R.handle); g.line(3, 12, 5, 10, R.handle); g.px(4, 12, R.handle); g.px(2, 13, R.handle); g.px(3, 13, R.handle);
      g.px(5, 10, R.gold, 3); g.px(6, 9, R.gold, 3);
      var S = R.star;
      g.bmp(['..#..', '..#..', '#####', '.###.', '.#.#.'], 10, 1, { '#': [S] });
      g.px(12, 3, S, 4);
      g.sphere(S, 12.5, 3.5, 3);
      g.sparkle(6, 3, false, '#fff27a');
      g.sparkle(14, 9, false, '#d6c4ff');
      g.dot(8, 1, '#ffffff'); g.dot(12, 12, '#fff27a');
    },
    backpack: function (g) {
      // handle loop
      g.rect(6, 1, 4, 1, R.strap); g.px(5, 2, R.strap); g.px(10, 2, R.strap);
      // body
      g.rect(3, 3, 10, 11, R.pack);
      g.clear(3, 3); g.clear(12, 3); g.clear(3, 13); g.clear(12, 13);
      g.sphere(R.pack, 6, 6, 9);
      // side straps
      g.rect(2, 6, 1, 6, R.strap); g.rect(13, 6, 1, 6, R.strap);
      // flap
      g.rect(4, 3, 8, 4, R.flap); g.rect(5, 7, 6, 1, R.flap);
      g.px(7, 8, R.flap, 1); g.px(8, 8, R.flap, 1);
      // buckle
      g.px(7, 7, R.gold, 3); g.px(8, 7, R.gold, 2);
      // pocket
      g.rect(5, 10, 6, 3, R.pocket);
      for (var x = 5; x < 11; x++) g.tone(x, 10, 4);
      g.dot(5, 4, '#ffd09a'); g.dot(4, 8, '#ffd09a');
      g.sparkle(14, 2, false, '#fff8c8');
    },
    coin: function (g) {
      var C = R.gold;
      g.disc(7.5, 7.5, 6.4, C);
      g.sphere(C, 7.5, 7.5, 6.4);
      // inset ring: inner area shaded inverted
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
        var dx = x + 0.5 - 7.5, dy = y + 0.5 - 7.5, d = Math.sqrt(dx * dx + dy * dy);
        if (d <= 4.4 && d > 3.5) g.tone(x, y, (dx + dy) < 0 ? 1 : 3);
        else if (d <= 3.5) g.tone(x, y, 2);
      }
      g.rect(7, 5, 2, 6, C); for (var j = 5; j < 11; j++) { g.tone(7, j, 4); g.tone(8, j, 3); }
      g.tone(6, 6, 3); g.tone(9, 9, 1);
      g.dot(4, 3, '#ffffff'); g.dot(3, 4, '#fff8c8'); g.dot(5, 3, '#fff8c8');
      g.sparkle(13, 2, false);
    }
  };

  // elemental gem badges
  Object.keys(EL).forEach(function (k) {
    draw[k] = function (g) {
      var e = EL[k], gm = e.g, sm = e.s;
      // octagon gem
      for (var y = 1; y <= 14; y++) for (var x = 1; x <= 14; x++) {
        var cx = Math.min(x - 1, 14 - x), cy = Math.min(y - 1, 14 - y);
        if (cx + cy < 3) continue;
        g.px(x, y, gm, 2);
      }
      // bevel ring + facets
      for (y = 1; y <= 14; y++) for (x = 1; x <= 14; x++) {
        if (!g.get(x, y)) continue;
        var edge = !g.get(x - 1, y) || !g.get(x + 1, y) || !g.get(x, y - 1) || !g.get(x, y + 1) ||
          !g.get(x - 1, y - 1) || !g.get(x + 1, y + 1) || !g.get(x + 1, y - 1) || !g.get(x - 1, y + 1);
        var s = x + y;
        if (edge) g.tone(x, y, s < 15 ? 3 : 1);
        else if (s < 11) g.tone(x, y, 3);
        else if (s > 19) g.tone(x, y, 1);
      }
      // symbol with drop shadow
      var rows = SYM[k], ox = 4, oy = 4, i, j;
      for (j = 0; j < 8; j++) for (i = 0; i < 8; i++) {
        if (rows[j][i] === '.') continue;
        var sx = ox + i + 1, sy = oy + j + 1;
        if (g.get(sx, sy) === gm) g.tone(sx, sy, 0);
      }
      g.bmp(rows, ox, oy, { '#': [sm], '+': [sm, 4] });
      // glints
      g.dot(3, 3, gm[4]); g.dot(4, 2, gm[4]); g.dot(2, 4, gm[4]);
      g.sparkle(13, 2, false, gm[4]);
    };
  });

  var names = Object.keys(draw);
  var baseCache = {}, cvCache = {}, urlCache = {};

  function base(name) {
    if (!baseCache[name]) {
      var g = new Grid();
      (draw[name] || draw.coin)(g);
      baseCache[name] = render(g);
    }
    return baseCache[name];
  }
  function canvas(name, scale) {
    scale = Math.max(1, (scale | 0) || 1);
    var key = name + '@' + scale;
    if (!cvCache[key]) {
      var b = base(name);
      if (scale === 1) cvCache[key] = b;
      else {
        var c = document.createElement('canvas'); c.width = N * scale; c.height = N * scale;
        var x = c.getContext('2d'); x.imageSmoothingEnabled = false;
        x.drawImage(b, 0, 0, c.width, c.height);
        cvCache[key] = c;
      }
    }
    return cvCache[key];
  }
  function url(name, scale) {
    var key = name + '@' + (Math.max(1, (scale | 0) || 1));
    if (!urlCache[key]) urlCache[key] = canvas(name, scale).toDataURL('image/png');
    return urlCache[key];
  }

  H.icons = { names: names, canvas: canvas, url: url };
})();
