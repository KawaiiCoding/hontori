window.H = window.H || {};
(function () {
  'use strict';
  var H = window.H;
  if (!H.maps) H.maps = {};
  var W = 60, HT = 40;

  function hash(x, y, s) {
    var n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul((s | 0) + 3, 982451653)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function grid(ch) { var g = []; for (var y = 0; y < HT; y++) { var r = []; for (var x = 0; x < W; x++) r.push(ch); g.push(r); } return g; }
  var g = grid('g');
  function set(x, y, ch) { if (x >= 0 && y >= 0 && x < W && y < HT) g[y][x] = ch; }
  function get(x, y) { return (x >= 0 && y >= 0 && x < W && y < HT) ? g[y][x] : null; }
  function rect(x0, y0, x1, y1, ch) { for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) set(x, y, ch); }
  function blob(cx, cy, rx, ry, seed, fn) {
    for (var y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (var x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
      var dx = (x - cx) / rx, dy = (y - cy) / ry, d = dx * dx + dy * dy + (hash(x, y, seed) - 0.5) * 0.35;
      fn(x, y, d);
    }
  }
  // trail through waypoints; width 1 or 2
  function trail(pts, w, ch) {
    for (var i = 0; i < pts.length - 1; i++) {
      var x = pts[i][0], y = pts[i][1], x1 = pts[i + 1][0], y1 = pts[i + 1][1];
      paint(x, y);
      while (x !== x1 || y !== y1) {
        var ax = Math.abs(x1 - x), ay = Math.abs(y1 - y);
        if (ax >= ay) x += Math.sign(x1 - x); else y += Math.sign(y1 - y);
        paint(x, y);
      }
    }
    function paint(x, y) {
      for (var j = 0; j < w; j++) for (var k = 0; k < w; k++) {
        var c = get(x + k, y + j);
        if (c === null) continue;
        set(x + k, y + j, c === 'w' || c === 'b' ? 'b' : ch);
      }
    }
  }

  // soft-edged compact patch (tiny noise only on the rim)
  function soft(cx, cy, rx, ry, seed, fn) {
    for (var y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (var x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
      var dx = (x - cx) / rx, dy = (y - cy) / ry, d = dx * dx + dy * dy;
      if (d > 0.75) d += (hash(x, y, seed) - 0.5) * 0.18;
      if (get(x, y) !== null) fn(x, y, d);
    }
  }
  var x, y;

  // ---------- river: constant 3-wide water, 1-tile sand banks, two gentle bends ----------
  function riverX(yy) { return yy <= 10 ? 40 : yy <= 26 ? 41 : 42; }
  for (y = 0; y < HT; y++) {
    var cx = riverX(y);
    set(cx - 2, y, 's'); set(cx + 2, y, 's');
    for (x = cx - 1; x <= cx + 1; x++) set(x, y, 'w');
  }
  // fill the bank corners at each bend so the sand strip stays continuous
  [[10, 40], [26, 41]].forEach(function (bd) { var yy = bd[0], c0 = bd[1]; set(c0 + 2, yy + 1, 'w'); set(c0 + 3, yy, 's'); set(c0 - 2, yy + 1, 's'); });
  // ---------- pond (south-west): compact rounded blob ----------
  for (y = 28; y <= 39; y++) for (x = 1; x <= 15; x++) {
    var pdx = (x - 8) / 5.2, pdy = (y - 33.5) / 3.7, pd = pdx * pdx + pdy * pdy;
    if (pd < 0.5) set(x, y, 'w'); else if (pd < 0.95) set(x, y, 's');
  }
  // ---------- meadows: compact patches ----------
  soft(52, 16.5, 5.5, 3.2, 5, function (x, y, d) { if (d < 1 && get(x, y) === 'g') set(x, y, 'f'); });
  soft(53, 35, 5, 3.2, 7, function (x, y, d) { if (d < 1 && get(x, y) === 'g') set(x, y, 't'); });
  soft(5, 24.5, 3.2, 2.6, 8, function (x, y, d) { if (d < 1) set(x, y, 't'); });
  soft(32, 35.5, 4.5, 2.4, 12, function (x, y, d) { if (d < 1 && get(x, y) === 'g') set(x, y, 'f'); });
  soft(20, 36, 3.5, 2, 14, function (x, y, d) { if (d < 1) set(x, y, 'f'); });
  soft(35, 6, 3, 2.2, 15, function (x, y, d) { if (d < 1) set(x, y, 't'); });
  soft(57, 30.5, 2.2, 2.2, 16, function (x, y, d) { if (d < 1) set(x, y, 't'); });
  soft(13, 21.5, 3, 1.4, 17, function (x, y, d) { if (d < 1) set(x, y, 'f'); });

  // ---------- buildings ----------
  var FP = { house_player: [6, 4], house_a: [5, 4], tavern: [8, 5], shop: [6, 4], school: [10, 6] };
  var buildings = [
    { type: 'school', x: 22, y: 3 },
    { type: 'house_player', x: 6, y: 11 },
    { type: 'house_a', x: 14, y: 11 },
    { type: 'house_a', x: 47, y: 9 },
    { type: 'house_a', x: 50, y: 26 },
    { type: 'tavern', x: 12, y: 24 },
    { type: 'shop', x: 30, y: 24 }
  ];
  function doorOf(b) { var f = FP[b.type]; return { x: b.x + Math.floor(f[0] / 2), y: b.y + f[1] - 1 }; }

  // ---------- plaza: clean cobble rectangle with clipped corners ----------
  rect(22, 15, 33, 22, 'c');
  set(22, 15, 'g'); set(33, 15, 'g'); set(22, 22, 'g'); set(33, 22, 'g');
  rect(26, 9, 28, 14, 'c');                  // school forecourt walk

  // ---------- roads (2 wide) and garden paths (1 wide), straight with right angles ----------
  trail([[0, 18], [21, 18]], 2, 'p');                       // west road, straight past the house row
  trail([[34, 18], [59, 18]], 2, 'p');                      // east road + bridge
  trail([[9, 15], [9, 17]], 1, 'p');                        // player house
  trail([[16, 15], [16, 17]], 1, 'p');                      // house_a 1
  trail([[49, 13], [49, 17]], 1, 'p');                      // house_a 2
  trail([[52, 30], [48, 30], [48, 20]], 1, 'p');            // house_a 3
  trail([[24, 23], [24, 30]], 1, 'p');                      // plaza -> south lane
  trail([[12, 30], [37, 30]], 1, 'p');                      // south lane
  trail([[16, 29], [16, 30]], 1, 'p');                      // tavern
  trail([[33, 28], [33, 30]], 1, 'p');                      // shop
  trail([[37, 30], [37, 33], [50, 33], [50, 36]], 1, 'p');  // footbridge into the wild meadow
  trail([[4, 17], [4, 9], [6, 9], [6, 6]], 1, 'p');         // up to west orchard
  trail([[50, 13], [55, 13], [55, 5]], 1, 'p');             // to cherry grove
  trail([[25, 9], [17, 9], [17, 7]], 1, 'p');               // school side lane to the old garden

  // ground under buildings
  buildings.forEach(function (b) { var f = FP[b.type]; rect(b.x, b.y, b.x + f[0] - 1, b.y + f[1] - 1, 'g'); });
  // tiles just below doors must be walkable path
  buildings.forEach(function (b) { var d = doorOf(b); if (get(d.x, d.y + 1) !== 'c') set(d.x, d.y + 1, 'p'); });

  // ---------- occupancy ----------
  var occ = []; for (y = 0; y < HT; y++) { occ.push([]); for (x = 0; x < W; x++) occ[y].push(0); }
  function res(x0, y0, x1, y1) { for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) if (occ[y] && x >= 0 && x < W) occ[y][x] = 1; }
  buildings.forEach(function (b) { var f = FP[b.type]; res(b.x, Math.max(0, b.y - 3), b.x + f[0] - 1, b.y + f[1] - 1); var d = doorOf(b); res(d.x - 1, d.y + 1, d.x + 1, d.y + 2); });
  for (y = 0; y < HT; y++) for (x = 0; x < W; x++) { var ch = g[y][x]; if (ch === 'p' || ch === 'b') occ[y][x] = 1; }

  var INFO = (H.propsOutdoor && H.propsOutdoor.info) || {};
  var props = [];
  function size(t) { var i = INFO[t]; return i ? [i.fw, i.fh] : [1, 1]; }
  function okGround(t, c) {
    if (t === 'lilypad') return c === 'w';
    if (t === 'reeds') return c === 's' || c === 'w';
    if (t === 'stepping_stone') return c === 'g' || c === 's' || c === 'f' || c === 't';
    return c === 'g' || c === 'f' || c === 't' || c === 's';
  }
  function put(t, x, y, any) {
    var s = size(t), decor = INFO[t] && INFO[t].decor;
    for (var yy = y; yy < y + s[1]; yy++) for (var xx = x; xx < x + s[0]; xx++) {
      if (xx < 0 || yy < 0 || xx >= W || yy >= HT) return false;
      if (occ[yy][xx] && !(decor && any)) return false;
      if (!any && !okGround(t, g[yy][xx])) return false;
    }
    if (!decor || !any) res(x, y, x + s[0] - 1, y + s[1] - 1);
    props.push({ type: t, x: x, y: y });
    return true;
  }

  // ---------- villagers (reserve their tiles + approach) ----------
  var npcs = [
    { key: 'elder', x: 25, y: 17, dir: 0, lines: [['Elder Wisteria', 'Soot on your nose? Chimney children are lucky.'], ['Elder Wisteria', 'The old well hums when nobody is listening.']] },
    { key: 'innkeeper', x: 20, y: 29, dir: 2, lines: [['Big Bo', 'Ramen is on! Best broth this side of the river.'], ['Big Bo', 'Something keeps stealing my fish cakes. Wet pawprints!']] },
    { key: 'shopkeeper', x: 35, y: 28, dir: 2, lines: [['Nettle', 'Potions, packs and practical things!'], ['Nettle', 'I crossed Whistling Pass twice. Lost a boot, found a friend.']] },
    { key: 'girl', x: 12, y: 32, dir: 2, lines: [['Mira', 'Stay still and the pond sparkles back at you.'], ['Mira', 'Grandma says sunlight. But sunlight does not giggle.']] },
    { key: 'boy', x: 47, y: 32, dir: 2, lines: [['Tobin', 'Never walk the tall grass without a buddy.'], ['Tobin', 'A spark with ears zapped my kite string!']] },
    { key: 'girl', x: 56, y: 9, dir: 2, lines: [['Pell', 'I count falling petals. Ninety-one so far today.'], ['Pell', 'At night the blossoms glow. Nobody believes me.']] },
    { key: 'elder', x: 37, y: 13, dir: 3, lines: [['Old Oru', 'Fifty years fishing. One fish. His name is Gerald.'], ['Old Oru', 'The river rose this spring. Something stirs upstream.']] },
    { key: 'boy', x: 29, y: 11, dir: 0, lines: [['Kip', 'The Academy only takes kids who see hidden things.'], ['Kip', 'I squinted for a week. Just got headaches.']] }
  ];
  npcs.forEach(function (n) { res(n.x - 1, n.y - 1, n.x + 1, n.y + 1); });

  // ---------- plaza ----------
  put('well', 27, 18, true);
  put('market_stall', 22, 16, true); put('market_stall', 31, 16, true); put('market_stall', 31, 21, true);
  put('statue', 23, 21, true);
  put('lamp', 25, 15, true); put('lamp', 30, 15, true); put('lamp', 22, 19, true); put('lamp', 33, 20, true);
  put('bench', 28, 22, true);
  put('flowerbed', 25, 13); put('flowerbed', 29, 13);
  put('lantern_string', 26, 15, true);
  put('crate', 21, 17); put('barrel', 34, 17); put('cart', 34, 22);
  put('sign', 29, 9); put('windchime', 24, 10);
  // ---------- home garden (player) ----------
  put('mailbox', 8, 15); put('flowerbed', 11, 15);
  put('garden_bed', 2, 15); put('garden_bed', 2, 17); put('pumpkin', 5, 15); put('pumpkin', 5, 17);
  put('birdbath', 12, 16); put('laundry_line', 11, 9, true);
  for (x = 1; x <= 4; x++) put('fence_h', x, 14);
  put('fence_v', 0, 15); put('fence_v', 0, 16); put('fence_v', 0, 17);
  put('hay_bale', 1, 19 - 1); put('butterfly_bush', 13, 17);
  // neighbour house_a 1
  put('mailbox', 15, 15); put('flowerbed', 18, 15); put('barrel', 19, 13); put('log_pile', 19, 16);
  // ---------- west orchard (apples) ----------
  [[1, 4], [4, 3], [7, 4], [2, 7], [6, 8], [9, 6], [11, 3]].forEach(function (p) { put('fruit_tree', p[0], p[1]); });
  put('hay_bale', 8, 1); put('crate', 4, 5); put('cart', 7, 9 - 0);
  // ---------- old garden behind school lane ----------
  put('garden_bed', 15, 4); put('garden_bed', 18, 5); put('pumpkin', 14, 7); put('pumpkin', 20, 4); put('birdbath', 13, 4);
  // ---------- tavern & shop ----------
  put('barrel', 20, 27); put('barrel', 20, 28); put('crate', 11, 27); put('crate', 11, 28); put('bench', 13, 30 - 0);
  put('lantern_string', 13, 29 + 0, true);
  put('crate', 36, 25); put('crate', 37, 25); put('barrel', 36, 27); put('sign', 29, 27); put('flowerbed', 30, 28);
  put('lamp', 21, 25); put('lamp', 29, 29); put('lamp', 15, 21); put('lamp', 36, 21); put('lamp', 46, 22);
  // ---------- river: reeds, rocks, fishing spot ----------
  for (y = 0; y < HT; y++) {
    var rx = riverX(y);
    if (y > 17 && y < 23) continue;
    if (hash(1, y, 31) < 0.35) put('reeds', rx - 2, y);
    if (hash(2, y, 32) < 0.3) put('reeds', rx + 2, y);
    if (hash(3, y, 33) < 0.12) put('lilypad', rx, y);
  }
  put('rock', 36, 11); put('crate', 36, 14); put('bench', 34, 12);
  // ---------- pond: lilypads, reeds, stepping stones ----------
  [[6, 33], [9, 34], [5, 35], [10, 32], [8, 36]].forEach(function (p) { put('lilypad', p[0], p[1]); });
  for (y = 29; y <= 38; y++) for (x = 1; x <= 15; x++) if (g[y][x] === 's' && hash(x, y, 40) < 0.22) put('reeds', x, y);
  put('stepping_stone', 11, 31, true); put('stepping_stone', 15, 33); put('rock', 2, 31); put('bench', 4, 38);
  // ---------- east meadow ----------
  for (y = 13; y <= 21; y++) for (x = 45; x <= 58; x++) if ((g[y][x] === 'f' || g[y][x] === 'g') && hash(x, y, 50) < 0.16) put('flower_patch', x, y);
  put('butterfly_bush', 53, 15); put('butterfly_bush', 56, 18); put('windchime', 51, 13); put('mailbox', 47, 14);
  for (x = 52; x <= 57; x++) put('stone_wall_h', x, 23);
  put('hay_bale', 55, 25); put('hay_bale', 57, 25); put('log_pile', 56, 28);
  // ---------- cherry grove (north-east) ----------
  [[50, 3], [53, 2], [57, 3], [52, 6], [57, 7], [49, 6], [58, 10], [54, 12]].forEach(function (p) { put('cherry_tree', p[0], p[1]); });
  put('statue', 56, 5); put('lantern_string', 51, 8, true); put('bench', 52, 10 - 0);
  // ---------- south ----------
  put('mushroom_ring', 26, 35, true); put('mushroom_ring', 56, 37, true);
  [[24, 33], [29, 37], [17, 38], [22, 38], [36, 37]].forEach(function (p) { put('cherry_tree', p[0], p[1]); });
  put('sign', 37, 32); put('sign', 50, 32); put('rock', 34, 33); put('log_pile', 25, 32);
  for (y = 31; y <= 38; y++) for (x = 28; x <= 38; x++) if (g[y][x] === 'f' && hash(x, y, 55) < 0.3) put('flower_patch', x, y);
  [[17, 22], [12, 22], [7, 22], [34, 30], [41, 24], [10, 37], [19, 35]].forEach(function (p) { put('flower_patch', p[0], p[1]); });
  put('mushroom_ring', 8, 27, true); put('mushroom_ring', 20, 10, true);
  put('stepping_stone', 22, 34); put('stepping_stone', 23, 35);

  // ---------- forest edges: mixed species, irregular ----------
  var KINDS = ['tree', 'pine', 'tree', 'fruit_tree', 'bush', 'pine', 'butterfly_bush', 'tree'];
  for (y = 0; y < HT; y++) for (x = 0; x < W; x++) {
    var e = Math.min(x, y, W - 1 - x, HT - 1 - y);
    var ch2 = e === 0 ? 0.6 : e === 1 ? 0.4 : e === 2 ? 0.14 : e <= 4 ? 0.03 : 0;
    if (hash(x, y, 60) >= ch2) continue;
    var k = hash(x, y, 61), t = KINDS[Math.floor(k * KINDS.length)];
    if (x > 44 && y > 30) t = k < 0.6 ? 'pine' : 'tree';
    if (x < 12 && y > 30) t = k < 0.4 ? 'pine' : k < 0.8 ? 'tree' : 'bush';
    if (t === 'tree' || t === 'pine' || t === 'fruit_tree') { if (!free3(x, y)) continue; }
    put(t, x, y);
  }
  function free3(x, y) {
    for (var yy = y - 2; yy <= y; yy++) for (var xx = x - 1; xx <= x + 1; xx++) if (yy >= 0 && xx >= 0 && xx < W && occ[yy] && occ[yy][xx]) return false;
    return true;
  }
  // scattered inner groves, bushes, rocks
  [[19, 13], [7, 21], [34, 6], [35, 3], [20, 23], [44, 14], [38, 9], [58, 14], [44, 27], [38, 25], [27, 26], [3, 28], [17, 33]]
    .forEach(function (p, i) { put(i % 4 === 3 ? 'pine' : i % 4 === 1 ? 'fruit_tree' : 'tree', p[0], p[1]); });
  [[20, 12], [36, 8], [45, 6], [10, 23], [26, 27], [39, 28], [33, 9], [19, 22], [5, 21], [44, 29], [28, 33]]
    .forEach(function (p, i) { put(i % 3 === 0 ? 'butterfly_bush' : 'bush', p[0], p[1]); });
  [[33, 13], [19, 37], [45, 37], [3, 11], [38, 4]].forEach(function (p) { put('rock', p[0], p[1]); });
  // sprinkle flower patches on open grass
  for (y = 2; y < HT - 2; y++) for (x = 2; x < W - 2; x++) if (g[y][x] === 'g' && hash(x, y, 70) < 0.035) put('flower_patch', x, y);

  // ---------- doors ----------
  var doors = [];
  var homeMap = H.maps.home;
  var homeDoor = homeMap && (homeMap.doors || []).filter(function (d) { return d.to === 'village'; })[0];
  var hp = doorOf(buildings[1]);
  doors.push({ x: hp.x, y: hp.y, to: 'home', tx: homeDoor ? homeDoor.x : 5, ty: homeDoor ? homeDoor.y - 1 : 16, dir: 1 });
  if (homeDoor) { homeDoor.tx = hp.x; homeDoor.ty = hp.y + 1; homeDoor.dir = 0; }

  var old = H.maps.village || {};
  H.maps.village = {
    name: old.name || 'Emberbrook Village',
    w: W, h: HT, tileset: 'outdoor',
    ground: g.map(function (r) { return r.join(''); }),
    legend: { g: 'grass', t: 'tallgrass', f: 'flowers', p: 'path', c: 'cobble', w: 'water', s: 'sand', b: 'bridge' },
    props: props,
    buildings: buildings,
    npcs: npcs,
    doors: doors,
    spawn: { x: hp.x, y: hp.y + 1, dir: 0 },
    env: old.env || { time: 9, weather: 'wind' }
  };
})();
