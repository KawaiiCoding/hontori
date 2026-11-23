window.H = window.H || {};
// Whisperwood: a calm forest route south of the village. Winding path, a stream with a ford and a bridge,
// an old stone circle, mushroom groves, a rocky ledge and a windy hill top. Linked to the village south road at load.
(function () {
  'use strict';
  var H = window.H;
  if (!H.maps) H.maps = {};
  var W = 50, HT = 40;

  function hash(x, y, s) {
    var n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul((s | 0) + 7, 982451653)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  var g = []; for (var yy0 = 0; yy0 < HT; yy0++) { var r0 = []; for (var xx0 = 0; xx0 < W; xx0++) r0.push('g'); g.push(r0); }
  function set(x, y, ch) { if (x >= 0 && y >= 0 && x < W && y < HT) g[y][x] = ch; }
  function get(x, y) { return (x >= 0 && y >= 0 && x < W && y < HT) ? g[y][x] : null; }
  function soft(cx, cy, rx, ry, seed, fn) {
    for (var y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (var x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
      var dx = (x - cx) / rx, dy = (y - cy) / ry, d = dx * dx + dy * dy;
      if (d > 0.75) d += (hash(x, y, seed) - 0.5) * 0.2;
      if (get(x, y) !== null) fn(x, y, d);
    }
  }
  function trail(pts, w, ch) {
    function paint(x, y) {
      for (var j = 0; j < w; j++) for (var k = 0; k < w; k++) {
        var c = get(x + k, y + j); if (c === null) continue;
        set(x + k, y + j, c === 'w' || c === 'b' ? 'b' : ch);
      }
    }
    for (var i = 0; i < pts.length - 1; i++) {
      var x = pts[i][0], y = pts[i][1], x1 = pts[i + 1][0], y1 = pts[i + 1][1];
      paint(x, y);
      while (x !== x1 || y !== y1) {
        var ax = Math.abs(x1 - x), ay = Math.abs(y1 - y);
        if (ax >= ay) x += Math.sign(x1 - x); else y += Math.sign(y1 - y);
        paint(x, y);
      }
    }
  }
  var x, y;

  // ---- stream: west to east, gentle bends, 2 wide with sand banks (columns joined so it never breaks)
  function streamY(xx) { return Math.round(17 + Math.sin(xx * 0.19) * 2 + (xx > 30 ? 1 : 0)); }
  for (x = 0; x < W; x++) {
    var sy = streamY(x), py0 = x > 0 ? streamY(x - 1) : sy, top = Math.min(sy, py0), bot = Math.max(sy, py0) + 1;
    for (y = top; y <= bot; y++) set(x, y, 'w');
  }
  for (x = 0; x < W; x++) for (y = 1; y < HT - 1; y++) if (g[y][x] === 'g' && (g[y - 1][x] === 'w' || g[y + 1][x] === 'w')) set(x, y, 's');
  // ---- zones
  var CL = { x: 10, y: 31 };   // stone circle clearing
  var HL = { x: 41, y: 8 };    // windy hill top
  var RK = { x: 41, y: 33 };   // rocks and ledge
  soft(CL.x, CL.y, 4.6, 3.8, 3, function (x, y, d) { if (d < 1 && get(x, y) === 'g') set(x, y, d < 0.45 ? 'f' : 'g'); });
  soft(HL.x, HL.y, 5.5, 4, 4, function (x, y, d) { if (d < 0.5 && get(x, y) === 'g') set(x, y, 'f'); });
  soft(30, 22, 3.4, 2.2, 5, function (x, y, d) { if (d < 1 && get(x, y) === 'g') set(x, y, 't'); });
  soft(9, 22, 3.2, 2, 6, function (x, y, d) { if (d < 1 && get(x, y) === 'g') set(x, y, 't'); });
  soft(30, 7, 2.6, 2.2, 7, function (x, y, d) { if (d < 1 && get(x, y) === 'g') set(x, y, 't'); });
  soft(RK.x, RK.y, 5, 3, 8, function (x, y, d) { if (d < 0.7 && get(x, y) === 'g') set(x, y, 's'); });

  // ---- paths
  trail([[24, 0], [24, 6], [18, 9], [18, 25], [26, 26], [33, 26], [38, 24], [38, 14], [40, 12]], 2, 'p'); // main route
  trail([[18, 26], [13, 28], [12, 30]], 1, 'p');      // to the stone circle
  trail([[33, 27], [33, 32], [37, 34]], 1, 'p');      // to the rocks
  // the main path fords the stream on stepping stones (water stays, the stones are walkable); the east crossing stays a bridge
  var ford = [];
  for (y = 0; y < HT; y++) for (x = 17; x <= 20; x++) if (g[y][x] === 'b') { g[y][x] = 'w'; ford.push([x, y]); }
  // ---- occupancy
  var occ = [], hard = [];
  for (y = 0; y < HT; y++) { occ.push([]); hard.push([]); for (x = 0; x < W; x++) { var c = g[y][x]; var o = (c === 'p' || c === 'b') ? 1 : 0; occ[y].push(o); hard[y].push(o); } }
  ford.forEach(function (f) { occ[f[1]][f[0]] = 1; hard[f[1]][f[0]] = 1; });
  function res(x0, y0, x1, y1) { for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) if (occ[y] && x >= 0 && x < W) occ[y][x] = 1; }
  var INFO = (H.propsOutdoor && H.propsOutdoor.info) || {};
  var props = [];
  function okGround(t, c) {
    if (t === 'lilypad') return c === 'w';
    if (t === 'reeds') return c === 's' || c === 'w';
    return c === 'g' || c === 'f' || c === 't' || c === 's';
  }
  function put(t, x, y, any, extra) {
    var i = INFO[t], fw = i ? i.fw : 1, fh = i ? i.fh : 1, decor = i && i.decor;
    for (var yy = y; yy < y + fh; yy++) for (var xx = x; xx < x + fw; xx++) {
      if (xx < 0 || yy < 0 || xx >= W || yy >= HT) return false;
      if (occ[yy][xx] && any !== 'F' && !(decor && any)) return false;
      if (!any && !okGround(t, g[yy][xx])) return false;
    }
    res(x, y, x + fw - 1, y + fh - 1);
    var p = { type: t, x: x, y: y }; if (extra) for (var k in extra) p[k] = extra[k];
    props.push(p);
    if (t !== 'tree' && t !== 'pine' && t !== 'bush') for (var y2 = y; y2 < y + fh; y2++) for (var x2 = x; x2 < x + fw; x2++) hard[y2][x2] = 1;
    return true;
  }
  ford.forEach(function (f) { props.push({ type: 'stepping_stone', x: f[0], y: f[1] }); });

  var npcs = [
    { key: 'guard', x: 21, y: 4, dir: 2, lines: [['Ranger Alder', 'Whisperwood is calm. Keep to the path.'], ['Ranger Alder', 'Past these trees lie the elemental schools.']] },
    { key: 'traveler', x: 36, y: 27, dir: 2, lines: [['Sela', 'I am walking to the far schools.'], ['Sela', 'There is a stone circle deep in this wood. I rested there a while.']] },
    { key: 'fisher', x: 22, y: 17, dir: 2, lines: [['Old Tam', 'The stones hum when spirits cross.'], ['Old Tam', 'The fish bite best at dusk. Be patient with them.']] }
  ];
  npcs.forEach(function (n) { res(n.x - 1, n.y - 1, n.x + 1, n.y + 1); hard[n.y][n.x] = 1; });

  // ---- entrance: sign and lanterns
  put('sign', 26, 3, false, { text: 'Whisperwood. North: Emberbrook. Mind the stream.' });
  put('log_pile', 27, 5);
  // ---- stone circle: eight stones round a quiet statue
  put('statue', CL.x, CL.y, 'F');
  for (var a = 0; a < 8; a++) { var ang = a * Math.PI / 4; put('rock', Math.round(CL.x + Math.cos(ang) * 3), Math.round(CL.y + Math.sin(ang) * 2.5), 'F'); }
  for (y = CL.y - 3; y <= CL.y + 3; y++) for (x = CL.x - 4; x <= CL.x + 4; x++) if (g[y][x] === 'f' && hash(x, y, 20) < 0.25) put('flower_patch', x, y, true);
  res(CL.x - 5, CL.y - 4, CL.x + 5, CL.y + 4);
  // ---- windy hill top: open, a few stones, a chime left by travellers
  put('windchime', HL.x + 1, HL.y - 2); put('rock', HL.x - 4, HL.y + 2); put('rock', HL.x + 4, HL.y - 1);
  put('sign', HL.x - 1, HL.y + 3, false, { text: 'Breezy Knoll. Hold on to your hat.' });
  for (y = HL.y - 4; y <= HL.y + 4; y++) for (x = HL.x - 5; x <= HL.x + 5; x++) if (g[y][x] === 'f' && hash(x, y, 21) < 0.15) put('flower_patch', x, y, true);
  res(HL.x - 5, HL.y - 3, HL.x + 5, HL.y + 3);
  // ---- rocky ledge: a broken stone line and loose rocks
  for (x = RK.x - 5; x <= RK.x + 5; x++) if (hash(x, 1, 22) < 0.8) put('stone_wall_h', x, RK.y - 3);
  [[-3, 0], [2, -1], [4, 1], [-1, 2], [1, 1], [5, -1], [-4, 2]].forEach(function (p) { put('rock', RK.x + p[0], RK.y + p[1]); });
  res(RK.x - 5, RK.y - 2, RK.x + 5, RK.y + 3);
  // ---- stream: reeds on the banks
  for (x = 0; x < W; x++) { var s2 = streamY(x); if (Math.abs(x - 18.5) < 3 || Math.abs(x - 38.5) < 3) continue;
    if (hash(x, 1, 30) < 0.25) put('reeds', x, s2 - 1); if (hash(x, 2, 31) < 0.2) put('reeds', x, s2 + 2); }
  // ---- mushroom groves (north-west and south-east, under the trees)
  [[6, 7], [8, 9], [5, 11], [10, 6], [29, 33], [27, 35], [31, 36], [45, 22], [3, 26]].forEach(function (p) { put('mushroom_ring', p[0], p[1], true); });
  put('log_pile', 7, 13); put('log_pile', 28, 30);
  [[14, 12], [23, 13], [26, 21], [13, 21]].forEach(function (p) { put('bush', p[0], p[1]); });

  // ---- forest: dense border, then calm groves inside
  var KINDS = ['tree', 'pine', 'pine', 'tree', 'pine', 'bush'];
  function free3h(x, y) { for (var yy = y - 2; yy <= y; yy++) for (var xx = x - 1; xx <= x + 1; xx++) if (yy >= 0 && xx >= 0 && xx < W && hard[yy] && hard[yy][xx]) return false; return true; }
  for (var pass = 0; pass < 2; pass++) for (y = 0; y < HT; y++) for (x = 0; x < W; x++) {
    var e = Math.min(x, y, W - 1 - x, HT - 1 - y);
    var ch2 = pass === 0 ? (e === 0 ? 1 : e === 1 ? 0.7 : e === 2 ? 0.3 : 0) : (e <= 1 ? 1 : 0);
    if (hash(x, y, 60 + pass) >= ch2) continue;
    var c0 = g[y][x]; if (c0 !== 'g' && c0 !== 'f' && c0 !== 't') continue;
    var t = KINDS[Math.floor(hash(x, y, 61) * KINDS.length)];
    if (pass === 1 || ((x + y) & 1 && e > 0) || !free3h(x, y)) t = 'bush';
    put(t, x, y);
  }
  // interior groves: denser in the north-west and south, light near the path
  for (y = 3; y < HT - 3; y++) for (x = 3; x < W - 3; x++) {
    if (g[y][x] !== 'g') continue;
    var nearPath = false;
    for (var py = y - 1; py <= y + 1 && !nearPath; py++) for (var px = x - 1; px <= x + 1; px++) if (get(px, py) === 'p') { nearPath = true; break; }
    if (nearPath) continue;
    var dens = (x < 15 && y < 15) || (y > 28 && x > 22 && x < 34) ? 0.34 : 0.14;
    if (hash(x, y, 62) >= dens || !free3h(x, y)) continue;
    put(hash(x, y, 63) < 0.55 ? 'pine' : 'tree', x, y);
  }
  for (y = 3; y < HT - 3; y++) for (x = 3; x < W - 3; x++) if (g[y][x] === 'g' && hash(x, y, 70) < 0.03) put('flower_patch', x, y, true);

  // ---------- doors (village south road <-> north edge of the wood)
  var doors = [
    { x: 24, y: 0, to: 'village', tx: 29, ty: 37, dir: 1 },
    { x: 25, y: 0, to: 'village', tx: 30, ty: 37, dir: 1 }
  ];
  var V = H.maps.village;
  if (V) {
    V.doors = V.doors || [];
    var road = [];
    for (x = 0; x < V.w; x++) { var cv = V.ground[V.h - 1][x]; if (V.legend[cv] === 'path') road.push(x); }
    if (!road.length) road = [29, 30];
    road.forEach(function (rx, i) {
      if (!V.doors.some(function (d) { return d.x === rx && d.y === V.h - 1; }))
        V.doors.push({ x: rx, y: V.h - 1, to: 'whisperwood', tx: i % 2 ? 25 : 24, ty: 1, dir: 0 });
    });
    doors[0].tx = road[0]; doors[1].tx = road[road.length > 1 ? 1 : 0];
    doors[0].ty = doors[1].ty = V.h - 2;
  }

  H.maps.whisperwood = {
    name: 'Whisperwood',
    labels: [{ x: CL.x, y: CL.y - 4, name: 'Stone circle' }, { x: HL.x, y: HL.y - 4, name: 'Breezy Knoll' }, { x: RK.x, y: RK.y + 3, name: 'Rocky ledge' }],
    w: W, h: HT, tileset: 'outdoor',
    ground: g.map(function (r) { return r.join(''); }),
    legend: { g: 'grass', t: 'tallgrass', f: 'flowers', p: 'path', c: 'cobble', w: 'water', s: 'sand', b: 'bridge' },
    props: props,
    buildings: [],
    npcs: npcs,
    doors: doors,
    passable: ford,
    spawn: { x: 24, y: 1, dir: 0 },
    wildCount: 6,
    wildLevel: [2, 4],
    // habitat zones boost a species near a place: {x,y,r,key,w}
    zones: [
      { x: CL.x, y: CL.y, r: 5, key: 'light', w: 4 },
      { x: HL.x, y: HL.y, r: 6, key: 'wind', w: 4 },
      { x: RK.x, y: RK.y, r: 6, key: 'earth', w: 4 },
      { x: 7, y: 9, r: 6, key: 'dark', w: 2.5 },
      { x: 29, y: 34, r: 5, key: 'dark', w: 2.5 }
    ]
  };
})();
