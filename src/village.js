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

  // ================= LAYOUT =================
  // river (east, gentle bends) - 3 wide water with 1-tile sand banks
  function riverX(yy) { return yy <= 12 ? 48 : yy <= 30 ? 49 : 48; }
  for (y = 0; y < HT; y++) {
    var cx = riverX(y);
    set(cx - 2, y, 's'); set(cx + 2, y, 's');
    for (x = cx - 1; x <= cx + 1; x++) set(x, y, 'w');
  }
  set(46, 13, 's'); set(50, 12, 'w'); set(51, 12, 's'); set(47, 13, 'w'); set(47, 30, 's');
  set(50, 31, 's'); set(49, 31, 'w'); set(48, 30, 'w'); set(46, 31, 's'); set(51, 30, 's');
  // pond: calm north-west corner
  for (y = 2; y <= 12; y++) for (x = 1; x <= 14; x++) {
    var pdx = (x - 7.5) / 4.8, pdy = (y - 7) / 3.2, pd = pdx * pdx + pdy * pdy + (hash(x, y, 3) - 0.5) * 0.12;
    if (pd < 0.55) set(x, y, 'w'); else if (pd < 0.95) set(x, y, 's');
  }
  // flower meadow (east of river, north) and wildflower verges
  soft(55, 9, 3.6, 4.2, 5, function (x, y, d) { if (d < 1 && get(x, y) === 'g') set(x, y, 'f'); });
  soft(40, 36, 3, 1.6, 12, function (x, y, d) { if (d < 1 && get(x, y) === 'g') set(x, y, 'f'); });
  // tall grass (encounter zones) - edges only, away from houses
  soft(55.5, 31, 3.2, 4.5, 7, function (x, y, d) { if (d < 1 && get(x, y) === 'g') set(x, y, 't'); });
  soft(17, 5, 3.4, 2.2, 8, function (x, y, d) { if (d < 1 && get(x, y) === 'g') set(x, y, 't'); });
  soft(42.5, 4.5, 2.6, 2.4, 9, function (x, y, d) { if (d < 1 && get(x, y) === 'g') set(x, y, 't'); });

  // buildings
  var FP = { house_player: [6, 4], house_a: [5, 4], tavern: [8, 5], shop: [6, 4], school: [10, 6] };
  var buildings = [
    { type: 'school', x: 25, y: 4 },
    { type: 'house_player', x: 4, y: 28 },
    { type: 'house_a', x: 13, y: 28 },
    { type: 'house_a', x: 21, y: 28 },
    { type: 'house_a', x: 35, y: 28 },
    { type: 'tavern', x: 13, y: 16 },
    { type: 'shop', x: 38, y: 17 }
  ];
  function doorOf(b) { var f = FP[b.type]; return { x: b.x + Math.floor(f[0] / 2), y: b.y + f[1] - 1 }; }

  // plaza + school terrace
  rect(23, 16, 36, 24, 'c');
  set(23, 16, 'g'); set(36, 16, 'g'); set(23, 24, 'g'); set(36, 24, 'g');
  rect(27, 10, 32, 11, 'c');                      // school forecourt
  rect(29, 12, 30, 15, 'c');                      // steps down to the plaza
  // roads (2 wide) and lanes
  trail([[29, 25], [29, 39]], 2, 'p');            // main road from the south gate
  trail([[2, 22], [22, 22]], 2, 'p');             // west road past the tavern
  trail([[37, 22], [55, 22]], 2, 'p');            // east road over the bridge
  trail([[3, 32], [44, 32]], 2, 'p');             // residential lane
  trail([[54, 21], [54, 14]], 1, 'p'); trail([[54, 24], [54, 26]], 1, 'p');            // meadow path
  trail([[2, 21], [2, 13]], 1, 'p');              // orchard path to the pond
  // ground under buildings, path below every door
  buildings.forEach(function (b) { var f = FP[b.type]; rect(b.x, b.y, b.x + f[0] - 1, b.y + f[1] - 1, 'g'); });
  buildings.forEach(function (b) { var d = doorOf(b); for (var yy = d.y + 1; yy < HT && get(d.x, yy) === 'g'; yy++) set(d.x, yy, 'p'); });

  // occupancy
  var occ = []; for (y = 0; y < HT; y++) { occ.push([]); for (x = 0; x < W; x++) occ[y].push(0); }
  function res(x0, y0, x1, y1) { for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) if (occ[y] && x >= 0 && x < W) occ[y][x] = 1; }
  buildings.forEach(function (b) { var f = FP[b.type]; res(b.x, Math.max(0, b.y - 3), b.x + f[0] - 1, b.y + f[1] - 1); var d = doorOf(b); res(d.x - 1, d.y + 1, d.x + 1, d.y + 2); });
  for (y = 0; y < HT; y++) for (x = 0; x < W; x++) { var ch = g[y][x]; if (ch === 'p' || ch === 'b' || ch === 'c') occ[y][x] = 1; }

  var hard = occ.map(function (r) { return r.slice(); });
  var INFO = (H.propsOutdoor && H.propsOutdoor.info) || {};
  var props = [];
  function size(t) { var i = INFO[t]; return i ? [i.fw, i.fh] : [1, 1]; }
  function okGround(t, c) {
    if (t === 'lilypad') return c === 'w';
    if (t === 'reeds') return c === 's' || c === 'w';
    return c === 'g' || c === 'f' || c === 't' || c === 's';
  }
  function put(t, x, y, any) {
    var s = size(t), decor = INFO[t] && INFO[t].decor;
    for (var yy = y; yy < y + s[1]; yy++) for (var xx = x; xx < x + s[0]; xx++) {
      if (xx < 0 || yy < 0 || xx >= W || yy >= HT) return false;
      if (occ[yy][xx] && !(decor && any) && any !== 'F') return false;
      if (!any && !okGround(t, g[yy][xx])) return false;
    }
    if (!decor || !any) res(x, y, x + s[0] - 1, y + s[1] - 1);
    props.push({ type: t, x: x, y: y });
    if (t !== 'tree' && t !== 'pine' && t !== 'bush') for (var y2 = y; y2 < y + s[1]; y2++) for (var x2 = x; x2 < x + s[0]; x2++) hard[y2][x2] = 1;
    return true;
  }

  // villagers: every look is unique, each fits its spot
  var npcs = [
    { key: 'elder', x: 33, y: 12, dir: 0, lines: [['Elder Wisteria', 'The Academy sees what others miss.'], ['Elder Wisteria', 'Soot on your nose is a lucky sign.']] },
    { key: 'baker', x: 25, y: 19, dir: 3, lines: [['Rosa', 'Fresh buns, still warm.'], ['Rosa', 'Something nibbles my crusts at night.']] },
    // Old Oru sits on the bank and always faces the river, line in the water
    { key: 'fisher', x: 46, y: 9, dir: 3, fixed: true, lines: [['Old Oru', 'The river is quiet today.'], ['Old Oru', 'Something big stirs upstream.']] },
    { key: 'grandma', x: 11, y: 12, dir: 1, lines: [['Grandma Ula', 'I feed the ducks every morning.'], ['Grandma Ula', 'The pond sparkles back if you wait.']] },
    { key: 'farmer', x: 7, y: 17, dir: 0, lines: [['Farmer Hob', 'Apples are nearly ripe.'], ['Farmer Hob', 'Help yourself to a windfall.']] },
    // the Academy gatekeeper stands beside the door; he holds the sight test before the first visit
    { key: 'gatekeeper', x: 32, y: 10, dir: 2, lines: [['Gatekeeper', 'Only open eyes may enter the Academy.'], ['Gatekeeper', 'Walk up to the door when you are ready.']] },
    { key: 'guard', x: 32, y: 37, dir: 0, lines: [['Guard Bram', 'The south gate is open.'], ['Guard Bram', 'Take a friend into the meadows.']] },
    { key: 'gardener', x: 57, y: 13, dir: 2, lines: [['Ivy', 'These flowers hum at dusk.'], ['Ivy', 'Please step around the seedlings.']] },
    { key: 'traveler', x: 56, y: 24, dir: 2, goneIf: 'c1:complete', lines: [['Rowan', 'I walk from town to town and trade news.'], ['Rowan', 'Your village feels warm. Mossgrove is next for me.']] },
    { key: 'kid2', x: 19, y: 36, dir: 0, lines: [['Kip', 'I am racing the snails today.'], ['Kip', 'The slow one always wins.']] },
    { key: 'milo', x: 52, y: 28, dir: 3, lines: [['Milo', 'Never walk the meadows alone.'], ['Milo', 'Something tugged my kite right out of the sky.']] },
    { key: 'tansy', x: 34, y: 26, dir: 0, lines: [['Tansy', 'The well hums when it is quiet.'], ['Tansy', 'Grandma says that is just the wind.']] }
  ];
  npcs.forEach(function (n) { res(n.x - 1, n.y - 1, n.x + 1, n.y + 1); });

  // ---- plaza: well centre, stalls, benches, lamps at the corners ----
  put('well', 29, 19, 'F');
  put('market_stall', 24, 17, 'F'); put('market_stall', 34, 17, 'F');
  put('bench', 25, 23, 'F'); put('bench', 33, 23, 'F');
  put('lamp', 23, 17, 'F'); put('lamp', 36, 18, 'F'); put('lamp', 23, 23, 'F'); put('lamp', 36, 23, 'F');
  put('flowerbed', 26, 20, 'F'); put('flowerbed', 32, 20, 'F');
  put('lantern_string', 28, 16, true);
  // ---- school terrace: low wall with a stair gap, framed by trees ----
  for (x = 21; x <= 38; x++) if (x < 29 || x > 30) put('stone_wall_h', x, 12);
  put('flowerbed', 27, 11, true); put('flowerbed', 31, 11, true);
  put('lamp', 28, 14); put('lamp', 31, 14);
  put('sign', 32, 15);
  [[22, 5], [23, 8], [21, 10], [36, 5], [37, 8], [38, 10], [24, 2], [35, 2]].forEach(function (p, i) { put(i % 2 ? 'pine' : 'tree', p[0], p[1]); });
  put('bush', 24, 10); put('bush', 35, 10);
  // ---- tavern: barrels & crates at its sides ----
  put('barrel', 12, 19); put('barrel', 12, 20); put('crate', 21, 20); put('barrel', 21, 21 - 1 + 1);
  put('bench', 13, 21); put('lantern_string', 14, 15, true);
  put('lamp', 11, 21); put('sign', 20, 21);
  // ---- shop: crates by the side, sign ----
  put('crate', 44, 18); put('crate', 44, 19); put('barrel', 37, 19); put('barrel', 37, 20); put('sign', 38, 21); put('cart', 42, 15);
  // ---- lamps along roads ----
  [[28, 27], [31, 30], [28, 36]].forEach(function (p) { put('lamp', p[0], p[1]); });
  [[6, 21], [16, 24], [43, 21], [52, 24], [57, 21]].forEach(function (p) { put('lamp', p[0], p[1]); });
  [[10, 31], [19, 34], [26, 31], [40, 34]].forEach(function (p) { put('lamp', p[0], p[1]); });
  // ---- house row: mailboxes + small fenced gardens across the lane ----
  buildings.forEach(function (b) {
    if (b.type !== 'house_a' && b.type !== 'house_player') return;
    var d = doorOf(b);
    put('mailbox', d.x + 2, d.y + 1);
    var gx = b.x, gy = 34;
    for (var xx = gx; xx < gx + 5; xx++) put('fence_h', xx, gy + 2);
    put('fence_v', gx, gy); put('fence_v', gx, gy + 1); put('fence_v', gx + 4, gy); put('fence_v', gx + 4, gy + 1);
    put('garden_bed', gx + 1, gy); put('pumpkin', gx + 3, gy); put('flower_patch', gx + 2, gy + 1, true);
  });
  put('laundry_line', 10, 29, true); put('birdbath', 11, 30); put('log_pile', 19, 30); put('butterfly_bush', 26, 30);
  put('hay_bale', 41, 30); put('barrel', 34, 30);
  // ---- orchard (west, tidy rows) ----
  for (y = 14; y <= 18; y += 2) for (x = 4; x <= 10; x += 3) if (!(x === 7 && y === 16)) put('fruit_tree', x + (y === 16 ? 1 : 0), y);
  put('crate', 5, 20); put('hay_bale', 9, 20); put('cart', 3, 26 - 1);
  // ---- pond: lilypads, reeds, bench ----
  [[5, 6], [9, 7], [7, 8], [10, 5]].forEach(function (p) { put('lilypad', p[0], p[1]); });
  for (y = 2; y <= 12; y++) for (x = 1; x <= 14; x++) if (g[y][x] === 's' && hash(x, y, 40) < 0.2) put('reeds', x, y);
  put('bench', 6, 11 + 1); put('rock', 13, 4); put('stepping_stone', 12, 9, true);
  // ---- river: reeds, lilypads, a fishing spot ----
  for (y = 0; y < HT; y++) {
    var rx = riverX(y);
    if (y > 19 && y < 25) continue;
    if (hash(1, y, 31) < 0.3) put('reeds', rx - 2, y);
    if (hash(2, y, 32) < 0.3) put('reeds', rx + 2, y);
    if (hash(3, y, 33) < 0.1) put('lilypad', rx, y);
  }
  put('crate', 45, 10); put('rock', 45, 7);
  // ---- meadow: flowers, butterflies, windchime ----
  for (y = 4; y <= 14; y++) for (x = 52; x <= 58; x++) if (g[y][x] === 'f' && hash(x, y, 50) < 0.22) put('flower_patch', x, y);
  put('butterfly_bush', 53, 8); put('butterfly_bush', 57, 6); put('windchime', 56, 15); put('bench', 55, 17);
  [[52, 3], [57, 2]].forEach(function (p) { put('cherry_tree', p[0], p[1]); });
  // ---- east: stone wall edging the wild grass ----
  for (x = 53; x <= 58; x++) put('stone_wall_h', x, 25);
  put('sign', 52, 26);
  // ---- south: gate trees + meadow verge ----
  put('sign', 31, 36); put('mushroom_ring', 42, 37, true); put('mushroom_ring', 15, 26, true);
  for (y = 34; y <= 38; y++) for (x = 36; x <= 44; x++) if (g[y][x] === 'f' && hash(x, y, 55) < 0.3) put('flower_patch', x, y);
  // a few calm accents on open grass
  [[19, 26], [42, 27], [8, 26], [26, 14], [40, 13]].forEach(function (p, i) { put(i % 2 ? 'bush' : 'tree', p[0], p[1]); });
  [[45, 14], [20, 11]].forEach(function (p) { put('rock', p[0], p[1]); });

  // ---- dense forest border (no void at the edges) ----
  var KINDS = ['tree', 'pine', 'tree', 'pine', 'tree', 'bush'];
  function free3h(x, y) {
    for (var yy = y - 2; yy <= y; yy++) for (var xx = x - 1; xx <= x + 1; xx++) if (yy >= 0 && xx >= 0 && xx < W && hard[yy] && hard[yy][xx]) return false;
    return true;
  }
  function free3(x, y) {
    for (var yy = y - 2; yy <= y; yy++) for (var xx = x - 1; xx <= x + 1; xx++) if (yy >= 0 && xx >= 0 && xx < W && occ[yy] && occ[yy][xx]) return false;
    return true;
  }
  for (var pass = 0; pass < 2; pass++) for (y = 0; y < HT; y++) for (x = 0; x < W; x++) {
    var e = Math.min(x, y, W - 1 - x, HT - 1 - y);
    var ch2 = pass === 0 ? (e === 0 ? 1 : e === 1 ? 0.55 : e === 2 ? 0.15 : 0) : (e <= 1 ? 1 : 0);
    if (hash(x, y, 60 + pass) >= ch2) continue;
    var c0 = g[y][x]; if (c0 !== 'g' && c0 !== 'f' && c0 !== 't') continue;
    var k = hash(x, y, 61), t = KINDS[Math.floor(k * KINDS.length)];
    if (pass === 1 || ((x + y) & 1 && e > 0)) t = 'bush';
    else if (!free3h(x, y)) t = 'bush';
    put(t, x, y);
  }
  // sprinkle a few flower patches on open grass
  for (y = 3; y < HT - 3; y++) for (x = 3; x < W - 3; x++) if (g[y][x] === 'g' && hash(x, y, 70) < 0.025) put('flower_patch', x, y);

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
    labels: [{ x: 7, y: 7, name: 'The pond' }, { x: riverX(22), y: 21, name: 'Bridge' }],
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
