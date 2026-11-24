window.H = window.H || {};
// Mossgrove: a small green village at the south end of Whisperwood, home of Rootwood Hall,
// the School of Grass (the first ring school). Linked to the south edge of Whisperwood at load.
(function () {
  'use strict';
  var H = window.H;
  if (!H.maps) H.maps = {};
  var W = 40, HT = 30;
  function hash(x, y, s) { var n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul((s | 0) + 11, 982451653)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
  var g = []; for (var y0 = 0; y0 < HT; y0++) { var r0 = []; for (var x0 = 0; x0 < W; x0++) r0.push('g'); g.push(r0); }
  function set(x, y, ch) { if (x >= 0 && y >= 0 && x < W && y < HT) g[y][x] = ch; }
  function rect(x0, y0, x1, y1, ch) { for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) set(x, y, ch); }
  var x, y;

  // ground: the forest road comes in from the north, a mossy square, lanes to the houses, a pond to the east
  rect(26, 0, 27, 12, 'p');            // road from Whisperwood: east of the Hall, never behind it
  rect(13, 12, 26, 18, 'c');           // square
  rect(19, 9, 20, 11, 'c');            // hall steps
  rect(4, 15, 12, 16, 'p');            // west lane
  rect(27, 15, 39, 16, 'p');           // east lane: the road to Whistling Pass (buried by a rockslide at the edge)
  rect(19, 19, 20, 22, 'p');           // short south lane to the meadows
  for (y = 3; y < 10; y++) for (x = 30; x < 38; x++) { var dx = (x - 33.5) / 3.8, dy = (y - 6) / 3; if (dx * dx + dy * dy < 1) set(x, y, 'w'); }
  for (y = 2; y < 11; y++) for (x = 29; x < 39; x++) if (g[y][x] === 'g' && ['w'].indexOf((g[y - 1] || [])[x]) + ['w'].indexOf((g[y + 1] || [])[x]) + ['w'].indexOf(g[y][x - 1]) + ['w'].indexOf(g[y][x + 1]) > -4) set(x, y, 's');
  rect(3, 20, 9, 24, 't'); rect(28, 19, 35, 23, 't');   // meadows
  rect(14, 19, 17, 22, 'f'); rect(22, 19, 25, 22, 'f');  // flower beds

  var props = [], hard = [];
  for (y = 0; y < HT; y++) { hard.push([]); for (x = 0; x < W; x++) hard[y].push(0); }
  function free(x, y, w, h) { for (var j = y; j < y + (h || 1); j++) for (var i = x; i < x + (w || 1); i++) { if (i < 0 || j < 0 || i >= W || j >= HT || hard[j][i] || g[j][i] === 'p' || g[j][i] === 'c' || g[j][i] === 'w') return false; } return true; }
  function put(type, x, y, force) { if (!force && !free(x, y)) return false; props.push({ type: type, x: x, y: y }); hard[y][x] = 1; return true; }
  function res(x0, y0, x1, y1) { for (var j = y0; j <= y1; j++) for (var i = x0; i <= x1; i++) if (j >= 0 && i >= 0 && j < HT && i < W) hard[j][i] = 1; }

  var buildings = [
    { type: 'school', x: 15, y: 3 },     // Rootwood Hall
    { type: 'house_a', x: 4, y: 10 },
    { type: 'house_a', x: 28, y: 11 }
  ];
  buildings.forEach(function (b) { var f = { school: [10, 6], house_a: [5, 4] }[b.type]; res(b.x - 1, b.y - 1, b.x + f[0], b.y + f[1]); });
  var npcs = [
    // Granny Burr sits in the square by day and goes home at dusk
    { key: 'grandma', x: 8, y: 17, dir: 0, lines: [['Granny Burr', 'The moss here is older than my grandma.'], ['Granny Burr', 'Wanders used to come every spring.']], sched: [{ from: 7, to: 18 }, { from: 18, to: 7, away: true }] },
    { key: 'sorreljr', x: 30, y: 17, dir: 2, lines: [['Sorrel Jr.', 'Madam Sorrel is my grandma. I am not a Wander. Yet.'], ['Sorrel Jr.', 'I can almost see the shimmer near the pond.']] },
    { key: 'fisher', x: 29, y: 6, dir: 3, fixed: true, lines: [['Fisher Lin', 'Mirror Pond keeps its fish deep.']] },
    { key: 'traveler', x: 32, y: 17, dir: 3, lines: [['Rowan', 'Rocks came down on the road to Whistling Pass.'], ['Rowan', 'They say it will be clear soon.']] }
  ];
  npcs.forEach(function (n) { res(n.x - 1, n.y - 1, n.x + 1, n.y + 1); });

  // square: a well, benches, lamps; the pond has reeds and lilies
  put('well', 19, 15, true); put('bench', 15, 13, true); put('bench', 24, 17, true);
  put('lamp', 13, 12, true); put('lamp', 24, 12, true); put('lamp', 13, 18, true); put('lamp', 26, 18, true);
  put('flowerbed', 16, 15, true); put('flowerbed', 23, 15, true);
  [[30, 4], [37, 5], [29, 8], [36, 9], [33, 10]].forEach(function (p) { put('reeds', p[0], p[1]); });
  [[32, 5], [35, 7]].forEach(function (p) { put('lilypad', p[0], p[1], true); });
  put('mushroom_ring', 6, 26); put('mushroom_ring', 33, 24); put('fruit_tree', 10, 20); put('fruit_tree', 27, 18); put('rock', 11, 22); put('rock', 27, 22); put('log_pile', 2, 18);
  put('garden_bed', 10, 15 - 1); put('butterfly_bush', 12, 9); put('sign', 21, 24, true);
  // the road to Whistling Pass is buried under a rockslide: a big heap of boulders across both lanes, a warning sign before it
  put('rockslide', 35, 14, true); put('rockslide', 37, 14, true); props.push({ type: 'sign', x: 34, y: 17, text: 'Road to Whistling Pass. Closed: rockslide. Workers are clearing it.' }); hard[17][34] = 1;
  // a ring of trees all around, thicker in the corners
  for (y = 0; y < HT; y++) for (x = 0; x < W; x++) {
    var edge = x < 2 || y < 2 || x > W - 3 || y > HT - 3, r = hash(x, y, 1);
    if (edge && free(x, y) && r < 0.7) put(r < 0.35 ? 'pine' : 'tree', x, y);
    else if (!edge && g[y][x] === 'g' && free(x, y) && r < 0.05) put(r < 0.02 ? 'bush' : 'tree', x, y);
  }

  H.maps.mossgrove = {
    name: 'Mossgrove',
    labels: [{ x: 20, y: 2, name: 'Rootwood Hall' }, { x: 33, y: 2, name: 'Mirror Pond' }, { x: 36, y: 12, name: 'Road to Whistling Pass' }],
    w: W, h: HT, tileset: 'outdoor',
    ground: g.map(function (r) { return r.join(''); }),
    legend: { g: 'grass', t: 'tallgrass', f: 'flowers', p: 'path', c: 'cobble', w: 'water', s: 'sand', b: 'bridge' },
    props: props, buildings: buildings, npcs: npcs,
    doors: [{ x: 26, y: 0, to: 'whisperwood', tx: 24, ty: 38, dir: 1 }, { x: 27, y: 0, to: 'whisperwood', tx: 25, ty: 38, dir: 1 }],
    spawn: { x: 26, y: 1, dir: 0 },
    wildCount: 5, wildLevel: [3, 6],
    zones: [{ x: 33, y: 6, r: 5, key: 'water', w: 3 }, { x: 6, y: 22, r: 4, key: 'grass', w: 4 }, { x: 31, y: 21, r: 4, key: 'grass', w: 3 }]
  };

  // ---------- Rootwood Hall (inside): a great stone hall with a living Heart Tree, mossy pillars, leaf windows,
  // a sprout garden for the wand trial, and a quiet guest nook with a bed.
  var HW = 26, HH = 22, DOOR = 13, TOP = 6, SH = 4, hg = [];  // TOP wall rows: a tall stone wall so the Heart Tree has room to rise
  for (y = 0; y < HH; y++) { var rr = []; for (x = 0; x < HW; x++) rr.push(x === 0 || x === HW - 1 || y === HH - 1 ? 'V' : y < TOP ? 'W' : 'S'); hg.push(rr); }
  hg[HH - 1][DOOR] = 'S'; hg[HH - 1][DOOR - 1] = 'S';
  for (y = 13 + SH; y < 17 + SH; y++) for (x = 20; x < 25; x++) hg[y][x] = 'H';           // guest nook: warm wood
  function pr(t, x, y) { return { type: t, x: x, y: y }; }
  var hp = [];
  for (x = 1; x < HW - 1; x++) [0, 2, 4].forEach(function (wy) { hp.push(pr('hall_wall', x, wy)); });
  hp = hp.concat([
    pr('stone_dais', 10, 6), pr('heart_tree', 10, 4),
    pr('leaf_window', 2, 0), pr('leaf_window', 6, 0), pr('leaf_window', 18, 0), pr('leaf_window', 22, 0),
    pr('hall_banner', 9, 0), pr('hall_banner', 16, 0),
    pr('stone_pillar', 7, 4), pr('stone_pillar', 18, 4), pr('stone_pillar', 8, 9), pr('stone_pillar', 17, 9), pr('stone_pillar', 8, 13), pr('stone_pillar', 17, 13),
    pr('sprout_pot', 3, 7), pr('sprout_pot', 5, 9), pr('sprout_pot', 3, 11),
    pr('glowcaps', 1, 6), pr('glowcaps', 6, 12), pr('glowcaps', 24, 3), pr('glowcaps', 1, 15), pr('glowcaps', 19, 7),
    pr('bookshelf', 1, 2), pr('bookshelf', 3, 2), pr('potted_tree', 5, 2), pr('potted_tree', 20, 2), pr('bookshelf', 22, 2), pr('crystal_orb', 24, 6),
    pr('bed', 23, 13), pr('chest', 21, 13), pr('candles', 24, 16), pr('bookstack', 20, 16)
  ]);
  // everything was laid out for a 2-row wall: move the floor pieces down; windows and banners hang mid-wall
  hp.forEach(function (q) { if (q.type === 'hall_wall') return; if (q.type === 'leaf_window' || q.type === 'hall_banner') q.y = 3; else q.y += SH; });
  for (y = 8 + SH; y < HH - 1; y++) { hp.push(pr('moss_runner', 12, y)); hp.push(pr('moss_runner', 13, y)); }
  H.maps.rootwood_hall = {
    name: 'Rootwood Hall', w: HW, h: HH, tileset: 'indoor', noRest: true,
    ground: hg.map(function (r) { return r.join(''); }),
    legend: { F: 'floor_wood', R: 'rug', W: 'wall', V: 'void', H: 'floor_herring', S: 'floor_stone', K: 'floor_tile', B: 'carpet_blue' },
    props: hp,
    npcs: [
      { key: 'warden', x: 13, y: 8 + SH, dir: 0, lines: [['Warden Fern', 'Roots first, then leaves.'], ['Warden Fern', 'Rest in the guest bed if you need it.']] },
      { key: 'apprentice', x: 13, y: 11 + SH, dir: 0, lines: [['Apprentice Bryn', 'I keep the aisle to the Heart Tree.'], ['Apprentice Bryn', 'Fern sees no one I have not tested.']] },
      { key: 'wren', x: 5, y: 14 + SH, dir: 3, lines: [['Wren', 'You came too! I knew you would.'], ['Wren', 'Fern is strict, but kind.']] }
    ],
    doors: [{ x: DOOR, y: HH - 1, to: 'mossgrove', tx: 20, ty: 9, dir: 0 }, { x: DOOR - 1, y: HH - 1, to: 'mossgrove', tx: 19, ty: 9, dir: 0 }],
    spawn: { x: DOOR, y: HH - 2, dir: 1 }, door: DOOR
  };
  // ---------- the Root Maze: the entrance of Rootwood Hall. Push the leaf piles onto the glowing moss to open the root gate.
  var LV = [
    'RRRRRRRR.RRRRRRR',
    'R....R.....R...R',
    'R.L..R..O..R.L.R',
    'R......R.......R',
    'RRR.RRR.O.RR.R.R',
    'R.....L.....R..R',
    'R.RR.RR.O.R....R',
    'R..............R',
    'RRRRRRR...RRRRRR'
  ];
  var MW = 16, MT = 4, MH = MT + LV.length + 1, mg = [], mp = [], boxes = [], pads = [];
  for (y = 0; y < MH; y++) { var mr = []; for (x = 0; x < MW; x++) mr.push(y < MT ? 'W' : y === MH - 1 ? 'V' : 'S'); mg.push(mr); }
  mg[MH - 1][8] = 'S'; mg[MT - 1][8] = 'S';
  for (x = 0; x < MW; x++) [0, 2].forEach(function (wy) { mp.push(pr('hall_wall', x, wy)); });
  mp.push(pr('hall_banner', 4, 1), pr('hall_banner', 12, 1), pr('leaf_window', 1, 1), pr('leaf_window', 13, 1));
  LV.forEach(function (row, ly) { row.split('').forEach(function (ch, lx) {
    var my = MT + ly;
    if (ch === 'R') mp.push(pr('root_wall', lx, my));
    if (ch === 'L') boxes.push([lx, my]);
    if (ch === 'O') pads.push([lx, my]);
  }); });
  mp.push(pr('glowcaps', 4, MT + 1), pr('glowcaps', 14, MT + 5));
  H.maps.rootwood_gate = {
    name: 'Root Maze', w: MW, h: MH, tileset: 'indoor', noRest: true,
    ground: mg.map(function (r) { return r.join(''); }), legend: { W: 'wall', V: 'void', S: 'floor_stone', F: 'floor_wood' },
    props: mp, buildings: [],
    npcs: [{ key: 'ivo', x: 14, y: MT + 7, dir: 2, svc: 'leafmaze', lines: [['Ivo', 'This is the Root Maze. Every student of the Hall solves it.'], ['Ivo', 'Push the leaf piles onto the glowing moss.']] }],
    doors: [{ x: 8, y: MH - 1, to: 'mossgrove', tx: 20, ty: 9, dir: 0 }, { x: 8, y: MT - 1, to: 'rootwood_hall', tx: DOOR, ty: HH - 2, dir: 1 }],
    spawn: { x: 8, y: MH - 2, dir: 1 }, door: 8
  };
  H.maps.rootwood_hall.doors = [{ x: DOOR, y: HH - 1, to: 'rootwood_gate', tx: 8, ty: MT + 1, dir: 0 }, { x: DOOR - 1, y: HH - 1, to: 'rootwood_gate', tx: 8, ty: MT + 1, dir: 0 }];
  if (H.puzzles) H.puzzles.def('rootwood_gate', { boxes: boxes, pads: pads, gate: [8, MT], flag: 'c2:maze', onSolve: function () {
    if (H.ui && H.ui.toast) H.ui.toast('The root gate opens');
    var a = H.story && H.story.api ? H.story.api({}) : null;
    if (a) a.say('hontori', 'Leaves to moss, the roots let go. Now to the Hall, the way we know.');
  } });
  // the hall door now opens into the maze, not straight into the hall
  H.maps.mossgrove.doors.push({ x: 20, y: 8, to: 'rootwood_gate', tx: 8, ty: MH - 2, dir: 1 });
  // the original hall door: the middle of the school front

  // ---------- the two Mossgrove houses (rule: every open door leads somewhere)
  function room(w, h, door, floor) {
    var r = []; for (var yy = 0; yy < h; yy++) { var row = []; for (var xx = 0; xx < w; xx++) row.push(xx === 0 || xx === w - 1 || yy === h - 1 ? 'V' : yy < 2 ? 'W' : floor); r.push(row); }
    r[h - 1][door] = floor; for (yy = 5; yy < 8; yy++) for (xx = 4; xx < 9; xx++) r[yy][xx] = 'R'; return r.map(function (q) { return q.join(''); });
  }
  var LG = { F: 'floor_wood', R: 'rug', W: 'wall', V: 'void', H: 'floor_herring', S: 'floor_stone', K: 'floor_tile', B: 'carpet_blue' };
  var houses = [
    { name: 'moss_house1', title: 'Granny Burr\'s Cottage', b: buildings[1], w: 14, h: 10, door: 7, floor: 'H',
      props: [pr('window', 3, 1), pr('picture', 6, 1), pr('window', 10, 1), pr('fireplace', 6, 2), pr('stove', 1, 2), pr('cupboard', 2, 2), pr('armchair', 4, 3),
        pr('bed', 11, 2), pr('dresser', 12, 5), pr('table', 2, 6), pr('chair', 3, 6), pr('plant', 12, 8), pr('cat_bed', 1, 8), pr('herb_rack', 9, 1), pr('bookshelf', 9, 2)],
      npcs: [{ key: 'grandma', x: 5, y: 6, dir: 0, lines: [['Granny Burr', 'Tea is always warm here. Sit, if you like.'], ['Granny Burr', 'My husband was a Wander. He wrote everything down.']], sched: [{ from: 18, to: 7 }, { from: 7, to: 18, away: true }] }] },
    { name: 'moss_house2', title: 'Pell\'s Trading Post', b: buildings[2], w: 14, h: 10, door: 7, floor: 'F',
      props: [pr('window', 2, 1), pr('wall_map', 5, 1), pr('window', 10, 1), pr('shop_shelf', 1, 2), pr('barrel_in', 3, 2), pr('barrel_in', 4, 2), pr('desk', 8, 2), pr('chair', 8, 3), pr('bed', 11, 2),
        pr('table', 9, 6), pr('chair', 10, 6), pr('chest', 1, 7), pr('potted_tree', 12, 8), pr('lantern_hang', 7, 1), pr('toybox', 12, 6), pr('shop_counter', 2, 4)],
      npcs: [{ key: 'shopkeeper', x: 3, y: 3, dir: 0, lines: [['Pell', 'Seeds, herbs and fair trades.'], ['Pell', 'I buy what the forest gives you.']] }, { key: 'pip', x: 6, y: 6, dir: 0, lines: [['Pip Pell', 'Dad trades with half the forest.'], ['Pip Pell', 'He says the rock crew drinks too much tea.']] }] }
  ];
  houses.forEach(function (h) {
    var dx = h.b.x + 2, dy = h.b.y + 3;
    H.maps[h.name] = { name: h.title, w: h.w, h: h.h, tileset: 'indoor', ground: room(h.w, h.h, h.door, h.floor), legend: LG, props: h.props, buildings: [], npcs: h.npcs,
      doors: [{ x: h.door, y: h.h - 1, to: 'mossgrove', tx: dx, ty: dy + 1, dir: 0 }], spawn: { x: h.door, y: h.h - 2, dir: 1 }, door: h.door };
    H.maps.mossgrove.doors.push({ x: dx, y: dy, to: h.name, tx: h.door, ty: h.h - 2, dir: 1 });
  });

  // ---------- open a path through the south edge of Whisperwood
  function link() {
    var ww = H.maps.whisperwood; if (!ww || ww.__moss) return; ww.__moss = true;
    var rows = ww.ground.map(function (r) { return r.split(''); }), wh = ww.h;
    var path = Object.keys(ww.legend).filter(function (k) { return ww.legend[k] === 'path'; })[0] || 'p';
    [24, 25].forEach(function (cx) {
      for (var yy = wh - 1; yy >= 0; yy--) { var ch = rows[yy][cx]; if (ch === path && yy < wh - 2) break; if (ww.legend[ch] === 'water') rows[yy][cx] = Object.keys(ww.legend).filter(function (k) { return ww.legend[k] === 'bridge'; })[0] || ch; else rows[yy][cx] = path; }
    });
    ww.ground = rows.map(function (r) { return r.join(''); });
    ww.props = (ww.props || []).filter(function (p) { return !((p.x >= 23 && p.x <= 26) && rows[p.y] && rows[p.y][24] === path && p.y > 2); });
    ww.npcs = ww.npcs || [];
    ww.npcs.push({ key: 'guard', x: 26, y: wh - 3, dir: 2, lines: [['Ranger Moss', 'Mossgrove lies south of here.'], ['Ranger Moss', 'Mind the roots on the path, young Wander.']] });
    ww.doors = ww.doors || [];
    ww.doors.push({ x: 24, y: wh - 1, to: 'mossgrove', tx: 26, ty: 1, dir: 0 }, { x: 25, y: wh - 1, to: 'mossgrove', tx: 27, ty: 1, dir: 0 });
    ww.labels = (ww.labels || []).concat([{ x: 25, y: wh - 3, name: 'Road to Mossgrove' }]);
  }
  link();
})();
