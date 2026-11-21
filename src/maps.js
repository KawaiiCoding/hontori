window.H = window.H || {};
(function () {
  'use strict';
  var H = window.H;

  // ---------- helpers ----------
  function grid(w, h, ch) {
    var g = [];
    for (var y = 0; y < h; y++) { var r = []; for (var x = 0; x < w; x++) r.push(ch); g.push(r); }
    return g;
  }
  function rect(g, x0, y0, x1, y1, ch) {
    for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++)
      if (g[y] && x >= 0 && x < g[y].length) g[y][x] = ch;
  }
  function hash(x, y, s) {
    var n = (x * 374761393 + y * 668265263 + (s || 0) * 982451653) | 0;
    n = (n ^ (n >>> 13)) * 1274126177 | 0;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function toStrings(g) { return g.map(function (r) { return r.join(''); }); }

  // =====================================================================
  // HOME (30 x 18) — night. Cozy cottage split into rooms.
  //   x1-9  : kitchen + dining (top)  /  entry hall (bottom, front door)
  //   x11-19: living room (fireplace on top wall)
  //   x21-28: kid's bedroom (top)     /  linen & reading nook (bottom)
  //   partitions: void columns x10, x20; horizontal void row + 2-row wall face
  // =====================================================================
  var HW = 30, HH = 18;
  var hg = grid(HW, HH, 'V');
  rect(hg, 1, 0, 28, 1, 'W');           // outer top wall (2 rows)
  rect(hg, 10, 0, 10, 1, 'V');          // partition columns cut the top wall
  rect(hg, 20, 0, 20, 1, 'V');
  // kitchen + dining
  rect(hg, 1, 2, 9, 8, 'K');
  // partition kitchen / entry: void row + 2-row wall face
  rect(hg, 1, 9, 9, 9, 'V'); rect(hg, 1, 10, 9, 11, 'W');
  rect(hg, 7, 9, 8, 11, 'F');           // doorway kitchen <-> entry
  // entry hall
  rect(hg, 1, 12, 9, 16, 'S');
  hg[17][5] = 'S';                      // front door on the bottom edge
  // living room
  rect(hg, 11, 2, 19, 16, 'H');
  rect(hg, 12, 6, 18, 10, 'R');         // big rug before the hearth
  // kid's bedroom
  rect(hg, 21, 2, 28, 9, 'F');
  rect(hg, 22, 4, 27, 8, 'B');          // blue carpet
  // partition bedroom / nook
  rect(hg, 21, 10, 28, 10, 'V'); rect(hg, 21, 11, 28, 12, 'W');
  rect(hg, 21, 13, 28, 16, 'F');        // linen & reading nook
  // doorway gaps through the vertical partitions
  rect(hg, 10, 6, 10, 7, 'F');          // kitchen <-> living
  rect(hg, 10, 14, 10, 15, 'F');        // entry <-> living
  rect(hg, 20, 5, 20, 6, 'F');          // living <-> bedroom
  rect(hg, 20, 14, 20, 15, 'F');        // living <-> nook

  var home = {
    name: 'Home',
    w: HW, h: HH, tileset: 'indoor',
    ground: toStrings(hg),
    legend: { F: 'floor_wood', K: 'floor_tile', R: 'rug', W: 'wall', V: 'void',
              H: 'floor_herring', S: 'floor_stone', B: 'carpet_blue' },
    props: [
      // ---- kitchen + dining
      { type: 'hanging_pots', x: 1, y: 1 },
      { type: 'window', x: 4, y: 1 },
      { type: 'herb_rack', x: 6, y: 1 },
      { type: 'window', x: 8, y: 1 },
      { type: 'stove', x: 1, y: 2 },
      { type: 'counter', x: 2, y: 2 },
      { type: 'sink', x: 4, y: 2 },
      { type: 'counter', x: 5, y: 2 },
      { type: 'cupboard', x: 8, y: 2 },
      { type: 'firewood', x: 1, y: 4 },
      { type: 'firewood', x: 1, y: 8 },
      { type: 'dining_table', x: 3, y: 5 },
      { type: 'chair', x: 2, y: 5 },
      { type: 'chair', x: 6, y: 6 },
      { type: 'chair', x: 3, y: 7 },
      { type: 'chair', x: 5, y: 7 },
      { type: 'plant', x: 9, y: 8 },
      // ---- entry hall
      { type: 'wall_map', x: 2, y: 11 },
      { type: 'picture', x: 5, y: 11 },
      { type: 'coat_rack', x: 1, y: 12 },
      { type: 'clock', x: 6, y: 12 },
      { type: 'potted_tree', x: 9, y: 12 },
      { type: 'doormat', x: 4, y: 16 },
      { type: 'potted_tree', x: 9, y: 16 },
      // ---- living room
      { type: 'bookshelf', x: 11, y: 2 },
      { type: 'picture', x: 13, y: 1 },
      { type: 'candles', x: 13, y: 2 },
      { type: 'fireplace', x: 14, y: 2 },
      { type: 'candles', x: 16, y: 2 },
      { type: 'window', x: 17, y: 1 },
      { type: 'window', x: 19, y: 1 },
      { type: 'piano', x: 18, y: 2 },
      { type: 'globe', x: 11, y: 4 },
      { type: 'armchair', x: 12, y: 8 },
      { type: 'armchair', x: 18, y: 7 },
      { type: 'floor_lamp', x: 19, y: 9 },
      { type: 'sofa', x: 14, y: 10 },
      { type: 'cat_bed', x: 13, y: 12 },
      { type: 'plant', x: 19, y: 12 },
      { type: 'floor_lamp', x: 11, y: 12 },
      { type: 'plant', x: 11, y: 16 },
      { type: 'plant', x: 19, y: 16 },
      // ---- kid's bedroom
      { type: 'wall_shelf', x: 21, y: 1 },
      { type: 'window', x: 23, y: 1 },
      { type: 'garland', x: 24, y: 1 },
      { type: 'window', x: 26, y: 1 },
      { type: 'picture', x: 28, y: 1 },
      { type: 'desk', x: 21, y: 2 },
      { type: 'chair', x: 21, y: 3 },
      { type: 'toybox', x: 24, y: 2 },
      { type: 'telescope', x: 26, y: 2 },
      { type: 'kid_bed', x: 28, y: 2 },
      { type: 'plant', x: 28, y: 9 },
      { type: 'wardrobe', x: 21, y: 9 },
      // ---- linen & reading nook
      { type: 'picture', x: 25, y: 12 },
      { type: 'wall_shelf', x: 26, y: 12 },
      { type: 'bookshelf', x: 22, y: 13 },
      { type: 'laundry_basket', x: 25, y: 13 },
      { type: 'dresser', x: 27, y: 13 },
      { type: 'chest', x: 28, y: 13 },
      { type: 'candles', x: 28, y: 16 },
      { type: 'potted_tree', x: 21, y: 16 }
    ],
    buildings: [],
    npcs: [
      { key: 'mom', x: 5, y: 3, dir: 0, lines: [
        ['Mom', 'Still up? The kettle keeps humming by itself tonight.'],
        ['Mom', 'Bed soon, sweetheart. The village fair starts tomorrow.']
      ] },
      { key: 'dad', x: 18, y: 8, dir: 2, lines: [
        ['Dad', 'That chimney has grumbled all week. Old houses talk.'],
        ['Dad', 'Grandma said the hearth keeps secrets for the curious.']
      ] }
    ],
    doors: [
      { x: 5, y: 17, to: 'village', tx: 9, ty: 14, dir: 0 }
    ],
    spawn: { x: 27, y: 4, dir: 0 },
    env: { time: 22, weather: 'clear' }
  };

  // =====================================================================
  // VILLAGE (60 x 40) — morning, windy
  // =====================================================================
  var VW = 60, VH = 40;
  var vg = grid(VW, VH, 'g');

  // organic sprinkles first (get overwritten by features)
  for (var y = 0; y < VH; y++) for (var x = 0; x < VW; x++) {
    var r = hash(x, y, 1);
    if (r < 0.035) vg[y][x] = 'f';
    else if (r < 0.06 && hash(x >> 2, y >> 2, 7) < 0.4) vg[y][x] = 't';
  }

  // flower meadow (north-east), irregular blob
  for (y = 12; y <= 19; y++) for (x = 45; x <= 57; x++) {
    var dx = (x - 51) / 6.5, dy = (y - 15.5) / 4;
    if (dx * dx + dy * dy + hash(x, y, 3) * 0.35 < 1.05) vg[y][x] = hash(x, y, 4) < 0.7 ? 'f' : 'g';
  }
  // west meadow of flowers near the player house
  for (y = 15; y <= 18; y++) for (x = 2; x <= 6; x++) if (hash(x, y, 5) < 0.6) vg[y][x] = 'f';

  // tall grass areas (adventure zones)
  for (y = 29; y <= 37; y++) for (x = 44; x <= 57; x++) {
    var ex = (x - 50.5) / 7, ey = (y - 33) / 4.5;
    if (ex * ex + ey * ey + hash(x, y, 6) * 0.4 < 1.1) vg[y][x] = 't';
  }
  for (y = 22; y <= 28; y++) for (x = 2; x <= 8; x++) {
    var fx = (x - 5) / 3.6, fy = (y - 25) / 3.4;
    if (fx * fx + fy * fy + hash(x, y, 8) * 0.3 < 1.0) vg[y][x] = 't';
  }

  // pond (south-west) with sandy ring
  for (y = 28; y <= 38; y++) for (x = 1; x <= 15; x++) {
    var px = (x - 8) / 5.2, py = (y - 33.5) / 3.6;
    var d = px * px + py * py;
    if (d < 0.62) vg[y][x] = 'w';
    else if (d < 1.0) vg[y][x] = 's';
  }

  // river: meanders north->south
  function riverX(yy) { return 40 + Math.round(2 * Math.sin(yy / 6) + Math.sin(yy / 2.7) * 0.6); }
  for (y = 0; y < VH; y++) {
    var cx = riverX(y);
    vg[y][cx - 2] = 's'; vg[y][cx + 2] = 's';
    vg[y][cx - 1] = 'w'; vg[y][cx] = 'w'; vg[y][cx + 1] = 'w';
    if (hash(cx, y, 9) < 0.4) vg[y][cx - 3] = 's';
    if (hash(cx, y, 10) < 0.4) vg[y][cx + 3] = 's';
  }

  // main east-west road (rows 20-21) incl. bridge
  for (y = 20; y <= 21; y++) for (x = 2; x <= 57; x++) {
    vg[y][x] = vg[y][x] === 'w' ? 'b' : 'p';
  }
  // southern lane (row 31) west + east of river
  rect(vg, 14, 31, 35, 31, 'p');
  rect(vg, 45, 31, 56, 31, 'p');
  rect(vg, 20, 22, 21, 30, 'p');       // west connector down to lane
  rect(vg, 56, 22, 56, 30, 'p');       // east connector

  // plaza (cobble) with a slightly ragged edge
  rect(vg, 22, 15, 31, 22, 'c');
  vg[15][22] = 'g'; vg[15][31] = 'g'; vg[22][22] = 'p'; vg[22][31] = 'p';

  // path up to the school
  rect(vg, 26, 9, 27, 14, 'c');
  // side paths from house doors to main road
  rect(vg, 9, 14, 9, 19, 'p');        // player house
  rect(vg, 15, 14, 15, 19, 'p');      // house_a #1
  rect(vg, 48, 12, 48, 19, 'p');      // house_a #2 (across river)
  rect(vg, 16, 30, 16, 30, 'p');      // tavern
  rect(vg, 33, 29, 33, 30, 'p');      // shop
  rect(vg, 52, 30, 52, 30, 'p');      // house_a #3
  // little trail through the tall grass to a secret clearing
  rect(vg, 50, 32, 50, 36, 'p');
  rect(vg, 49, 36, 51, 37, 'g');

  // ---------- buildings ----------
  var FP = {
    house_player: [6, 4], house_a: [5, 4], tavern: [8, 5], shop: [6, 4], school: [10, 6]
  };
  var buildings = [
    { type: 'school', x: 21, y: 3 },
    { type: 'house_player', x: 6, y: 10 },
    { type: 'house_a', x: 13, y: 10 },
    { type: 'house_a', x: 46, y: 8 },
    { type: 'house_a', x: 50, y: 26 },
    { type: 'tavern', x: 12, y: 25 },
    { type: 'shop', x: 30, y: 25 }
  ];
  // ground under buildings = grass
  var occ = grid(VW, VH, 0);
  buildings.forEach(function (b) {
    var f = FP[b.type];
    rect(vg, b.x, b.y, b.x + f[0] - 1, b.y + f[1] - 1, 'g');
    // roof art reaches ~3 tiles above: keep props out of there too
    rect(occ, b.x, Math.max(0, b.y - 3), b.x + f[0] - 1, b.y + f[1] - 1, 1);
  });

  // ---------- props ----------
  var props = [];
  var SIZE = { well: [2, 2], flowerbed: [2, 1], bench: [2, 1] };
  function free(x, y, w, h) {
    for (var yy = y; yy < y + h; yy++) for (var xx = x; xx < x + w; xx++) {
      if (xx < 0 || yy < 0 || xx >= VW || yy >= VH || occ[yy][xx]) return false;
    }
    return true;
  }
  function put(type, x, y, anyGround) {
    var s = SIZE[type] || [1, 1];
    if (!free(x, y, s[0], s[1])) return false;
    if (!anyGround) {
      for (var yy = y; yy < y + s[1]; yy++) for (var xx = x; xx < x + s[0]; xx++) {
        var c = vg[yy][xx]; if (c !== 'g' && c !== 'f' && c !== 't') return false;
      }
    }
    rect(occ, x, y, x + s[0] - 1, y + s[1] - 1, 1);
    props.push({ type: type, x: x, y: y });
    return true;
  }
  function reserve(x0, y0, x1, y1) { rect(occ, x0, y0, x1, y1, 1); }

  // keep paths / door approaches clear
  for (y = 0; y < VH; y++) for (x = 0; x < VW; x++) {
    var ch = vg[y][x];
    if (ch === 'p' || ch === 'b' || ch === 'w') occ[y][x] = 1;
  }

  // plaza furniture
  put('well', 26, 18, true);
  put('lamp', 22, 16, true); put('lamp', 31, 16, true);
  put('lamp', 23, 22, true); put('lamp', 30, 22, true);
  put('bench', 23, 18, true); put('bench', 29, 19, true);
  put('flowerbed', 24, 15, true); put('flowerbed', 28, 15, true);
  put('sign', 28, 13);
  // roadside
  put('sign', 8, 19); put('mailbox', 10, 14); put('mailbox', 16, 14);
  put('flowerbed', 11, 15); put('flowerbed', 6, 14);
  put('sign', 35, 19); put('lamp', 12, 19); put('lamp', 34, 22);
  put('lamp', 45, 19); put('lamp', 53, 22); put('lamp', 4, 22);
  put('mailbox', 49, 12); put('mailbox', 53, 30); put('sign', 49, 31 - 1);
  put('sign', 51, 32);  // secret trail sign
  // tavern & shop clutter
  put('barrel', 20, 27, true); put('barrel', 11, 28); put('crate', 11, 29); put('bench', 13, 30);
  put('crate', 36, 27); put('crate', 36, 28); put('barrel', 29, 28);
  // fences: player garden, a sheep-less pasture east, school yard
  for (x = 2; x <= 5; x++) put('fence_h', x, 14);
  for (y = 15; y <= 18; y++) put('fence_v', 1, y);
  for (x = 52; x <= 57; x++) put('fence_h', x, 23);
  for (x = 52; x <= 57; x++) put('fence_h', x, 11);
  put('fence_v', 51, 12); put('fence_v', 51, 13);
  for (x = 18; x <= 20; x++) put('fence_h', x, 9);
  for (x = 31; x <= 33; x++) put('fence_h', x, 9);
  // river bank rocks & shore bits
  [[36, 4], [44, 9], [35, 13], [45, 25], [37, 33], [44, 37], [43, 16]].forEach(function (p) { put('rock', p[0], p[1]); });
  [[3, 30], [14, 31 + 2], [12, 37], [2, 36]].forEach(function (p) { put('rock', p[0], p[1]); });
  put('bench', 9, 28);

  // forest edges — denser at corners, irregular, mixed species
  for (y = 0; y < VH; y++) for (x = 0; x < VW; x++) {
    var edge = Math.min(x, y, VW - 1 - x, VH - 1 - y);
    var cornerBoost = (x < 12 && y < 9) || (x > 48 && y < 7) || (x > 52 && y > 34) ? 1.6 : 1;
    var chance = edge === 0 ? 0.62 : edge === 1 ? 0.38 : edge === 2 ? 0.12 : edge <= 4 ? 0.03 : 0;
    chance *= cornerBoost;
    if (hash(x, y, 11) < chance && free(x - 1, y - 1, 3, 2)) {
      var kind = hash(x, y, 12);
      var type = (x > 45 || y < 6) ? (kind < 0.65 ? 'pine' : 'tree') : (kind < 0.6 ? 'tree' : 'pine');
      if (kind > 0.92) type = 'bush';
      put(type, x, y);
    }
  }
  // scattered groves and bushes inside
  [[18, 13], [19, 16], [34, 6], [33, 3], [5, 8], [45, 4], [55, 18], [24, 34], [28, 36], [32, 34],
   [17, 36], [4, 20], [38, 27], [47, 22], [58, 27], [12, 7]].forEach(function (p, i) {
    put(i % 3 === 2 ? 'pine' : 'tree', p[0], p[1]);
  });
  [[20, 12], [17, 18], [36, 10], [28, 27], [25, 29], [44, 14], [58, 14], [3, 12], [19, 32], [38, 36], [47, 27]]
    .forEach(function (p) { put('bush', p[0], p[1]); });

  var village = {
    name: 'Emberbrook Village',
    w: VW, h: VH, tileset: 'outdoor',
    ground: toStrings(vg),
    legend: { g: 'grass', t: 'tallgrass', f: 'flowers', p: 'path', c: 'cobble', w: 'water', s: 'sand', b: 'bridge' },
    props: props,
    buildings: buildings,
    npcs: [
      { key: 'elder', x: 25, y: 20, dir: 0, lines: [
        ['Elder Wisteria', 'Ah, the little one from the chimney house. You have soot on your nose.'],
        ['Elder Wisteria', 'This well is older than the village. On quiet nights it hums a tune I knew as a girl.'],
        ['Elder Wisteria', 'Some folk walk right past wonder. They call it "nothing-much". Don\'t be a nothing-much, child.']
      ] },
      { key: 'innkeeper', x: 18, y: 30, dir: 0, lines: [
        ['Big Bo', 'Welcome to the Steaming Bowl! Best ramen this side of the river.'],
        ['Big Bo', 'Secret is the broth. Simmered three days on a fire that never quite goes out... odd fire, that.'],
        ['Big Bo', 'Lately something keeps sneaking my fish cakes. Leaves wet little pawprints. Cheeky!']
      ] },
      { key: 'shopkeeper', x: 31, y: 29, dir: 0, lines: [
        ['Nettle', 'Potions, packs and practical things! No refunds on exploding tonics.'],
        ['Nettle', 'I used to be an explorer, you know. Crossed the Whistling Pass twice. Lost a boot, found a friend.'],
        ['Nettle', 'Come back when you\'ve got coins. Or a good story. I accept both.']
      ] },
      { key: 'girl', x: 13, y: 33, dir: 2, lines: [
        ['Mira', 'Shh! If you stay very still, the pond starts to sparkle back at you.'],
        ['Mira', 'Grandma says it\'s just sunlight. But sunlight doesn\'t giggle.'],
        ['Mira', 'I\'m going to be the first person in Emberbrook to catch a water sprite. Or at least wave at one.']
      ] },
      { key: 'boy', x: 46, y: 32, dir: 3, lines: [
        ['Tobin', 'Don\'t go in the tall grass without a buddy! Things rustle in there.'],
        ['Tobin', 'Yesterday a little spark zapped my kite string clean in half. A spark! With ears!'],
        ['Tobin', 'There\'s a trail through the middle, past the sign. I dare you. ...I double-dare you.']
      ] },
      { key: 'girl', x: 41, y: 21, dir: 1, lines: [
        ['Pell', 'I count the leaves that float under the bridge. Four hundred and twelve today.'],
        ['Pell', 'When the wind blows from the north, I hear an owl hooting riddles. Nobody believes me.'],
        ['Pell', 'Riddle of the day: "I have feathers but never fly, I hoot by day and hush the sky." ...I don\'t know the answer either.']
      ] },
      { key: 'elder', x: 36, y: 15, dir: 2, lines: [
        ['Old Oru', 'Fifty years I\'ve fished this river. Fifty years, one fish. Name\'s Gerald. I let him go.'],
        ['Old Oru', 'The water rose a hand higher this spring. Something upstream is stirring, mark my words.'],
        ['Old Oru', 'Want advice? Patience is a lure. Throw it far.']
      ] },
      { key: 'boy', x: 26, y: 10, dir: 0, lines: [
        ['Kip', 'The Lanternwood Academy only takes students who can see the "hidden stuff".'],
        ['Kip', 'I tried squinting really hard for a week. Just got a headache.'],
        ['Kip', 'If you ever find out the trick, tell me first, okay? Pinky promise.']
      ] }
    ],
    doors: [
      { x: 9, y: 13, to: 'home', tx: 5, ty: 16, dir: 1 }
    ],
    spawn: { x: 9, y: 14, dir: 0 },
    env: { time: 9, weather: 'wind' }
  };

  H.maps = { home: home, village: village };

  // =====================================================================
  // INTRO SCRIPT
  // =====================================================================
  var K = 'kid', KN = 'You', HK = 'hontori', HN = 'Hontori';
  H.script = {
    intro: [
      { do: 'fade' },
      { say: [K, KN, 'Tick... tock... tick... Ugh. Sleep, why won\'t you come?'] },
      { say: [K, KN, 'Even the moon looks bored tonight.'] },
      { do: 'shake' },
      { say: [K, KN, 'W-what was that rumble? It came from... the fireplace?'] },
      { do: 'shake' },
      { say: ['?', '???', '*COUGH* *COUGH* Hack! Who stacks a chimney this narrow?!'] },
      { do: 'spiritAppear' },
      { say: [HK, HN, 'Ta-daa! Ahem. Sorry for the soot, it\'s an awful lot...'] },
      { say: [HK, HN, 'I\'m Hontori, ember and spark, the fox who glows when the night gets dark!'] },
      { say: [K, KN, 'A... talking fox. Made of FIRE. In my living room.'] },
      { say: [HK, HN, 'The world has magic, truth be told — in brook and breeze, in stone and cold.'] },
      { say: [HK, HN, 'But most folk wear a veil so thick, they never see a single trick.'] },
      { say: [HK, HN, 'We call them the Veilbound — kind, but blind to all the glowing things behind.'] },
      { say: [K, KN, 'Wait, so... my parents can\'t see you?'] },
      { say: [HK, HN, 'Not unless the veil is torn. They\'d think I\'m just a coal, forlorn.'] },
      { say: [K, KN, 'My parents will FREAK if they find a fire-fox on the rug!'] },
      { say: [HK, HN, 'Then let\'s be quiet, sly and neat... *hrk*... hold on... something\'s stuck... *HURK*!'] },
      { do: 'giveWand' },
      { say: [K, KN, 'Did you just... cough up a stick?'] },
      { say: [HK, HN, 'A WAND, my friend, of hearth-oak grown. Warm it up, it\'s now your own!'] },
      { say: [HK, HN, 'Point it high and speak it clear, and hidden things will soon appear:'] },
      { say: [HK, HN, '"Velum Aperi!" — the veil undone. Go on, give it a try. It\'s fun!'] },
      { say: [K, KN, 'Okay... Velum... Aperi!'] },
      { do: 'spell' },
      { say: [K, KN, 'Whoa... the whole room is sparkling. Everything is... humming.'] },
      { say: [HK, HN, 'Now you see what I can see! Spirits hide in every tree.'] },
      { say: [HK, HN, 'Seven friends of wind and wave, of leaf and bolt and stone and cave...'] },
      { say: [HK, HN, '...of shadow soft and light so bright — they need a friend with veil-free sight.'] },
      { say: [HK, HN, 'So grab your scarf and tie it tight. Come morning\'s glow — we take our flight!'] },
      { say: [K, KN, 'An adventure? With a coughing fire-fox? ...Deal.'] },
      { say: [HK, HN, 'Splendid! Now sleep, the stars agree. Tomorrow, the village — you and me!'] },
      { do: 'fade' }
    ]
  };
})();
