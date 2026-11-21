window.H = window.H || {};
(function () {
  'use strict';
  // interiors: the tavern, shop, school and three village houses, linked to the village doors at load time.
  // Maps omit env so the time of day carries over from outside.
  var H = window.H;
  if (!H.maps) H.maps = {};
  var LEGEND = { F: 'floor_wood', K: 'floor_tile', R: 'rug', W: 'wall', V: 'void', H: 'floor_herring', S: 'floor_stone', B: 'carpet_blue' };

  // room shell: 2 wall rows on top, void border, a door gap in the bottom row
  function room(w, h, floor, doorX, fills) {
    var g = [];
    for (var y = 0; y < h; y++) { var r = []; for (var x = 0; x < w; x++) r.push('V'); g.push(r); }
    function rect(x0, y0, x1, y1, ch) { for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) g[y][x] = ch; }
    rect(1, 0, w - 2, 1, 'W');
    rect(1, 2, w - 2, h - 2, floor);
    g[h - 1][doorX] = floor;
    (fills || []).forEach(function (f) { rect(f[0], f[1], f[2], f[3], f[4]); });
    return g.map(function (r) { return r.join(''); });
  }
  function L(name, a, b) { return b ? [[name, a], [name, b]] : [[name, a]]; }
  function mk(o) {
    var m = { name: o.name, w: o.w, h: o.h, tileset: 'indoor', ground: room(o.w, o.h, o.floor, o.door, o.fills), legend: LEGEND,
      props: o.props, buildings: [], npcs: o.npcs, doors: [], spawn: { x: o.door, y: o.h - 2, dir: 1 }, door: o.door };
    return m;
  }
  function pr(type, x, y) { return { type: type, x: x, y: y }; }

  // ---------------------------------------------------------------- tavern
  var tavern = mk({
    name: 'The Steaming Bowl', w: 18, h: 12, floor: 'F', door: 9,
    fills: [[1, 2, 6, 4, 'S'], [8, 6, 15, 9, 'R']],
    props: [
      pr('lantern_hang', 7, 1), pr('notice_board', 9, 1), pr('lantern_hang', 12, 1), pr('window', 14, 1), pr('picture', 16, 1),
      pr('stove', 1, 2), pr('cupboard', 2, 2), pr('barrel_in', 4, 2),
      pr('ramen_pot', 1, 4), pr('tavern_counter', 2, 4),
      pr('tavern_table', 8, 3), pr('stool', 7, 3), pr('stool', 10, 4),
      pr('tavern_table', 12, 3), pr('stool', 14, 4),
      pr('tavern_table', 9, 7), pr('stool', 11, 7), pr('stool', 8, 8),
      pr('tavern_table', 13, 7), pr('stool', 15, 8),
      pr('barrel_in', 16, 2), pr('barrel_in', 16, 3), pr('barrel_in', 1, 7),
      pr('plant', 1, 10), pr('flower_vase', 16, 10), pr('floor_lamp', 6, 10)
    ],
    npcs: [
      { key: 'innkeeper', x: 5, y: 3, dir: 0, lines: L('Big Bo', 'Welcome in, the broth has simmered since dawn.', 'Lean on the counter if you want a bowl.') },
      { key: 'dad', x: 8, y: 7, dir: 3, lines: L('Rook the Ferryman', 'I row the river at night and hear it sing.', 'Lately the song sounds like a lost little cry.') },
      { key: 'mom', x: 11, y: 4, dir: 0, lines: L('Auntie Sumi', 'Ramen tastes better when the rain taps the roof.', 'Bo once fed a shivering spirit for free.') }
    ]
  });

  // ---------------------------------------------------------------- shop
  var shop = mk({
    name: 'Packs and Potions', w: 16, h: 11, floor: 'F', door: 8,
    fills: [[5, 2, 9, 3, 'K'], [5, 6, 10, 8, 'R']],
    props: [
      pr('lantern_hang', 6, 1), pr('window', 8, 1), pr('picture', 10, 1),
      pr('shop_shelf', 1, 2), pr('shop_shelf', 3, 2), pr('shop_shelf', 11, 2), pr('shop_shelf', 13, 2),
      pr('potion_rack', 5, 2), pr('barrel_in', 9, 2),
      pr('shop_counter', 6, 4),
      pr('barrel_in', 1, 5), pr('barrel_in', 1, 6), pr('potion_rack', 14, 5), pr('potion_rack', 14, 6),
      pr('shop_shelf', 11, 7), pr('chest', 1, 9), pr('flower_vase', 2, 9), pr('plant', 14, 9)
    ],
    npcs: [
      { key: 'shopkeeper', x: 7, y: 3, dir: 0, lines: L('Nettle', 'Step up to the counter and pick what you need.', 'Ember Dust and Tide Pearls bring a fainted spirit back.') },
      { key: 'girl', x: 4, y: 7, dir: 1, lines: L('Juniper', 'I am saving up for the blue backpack.', 'Nettle says it held a map that drew itself.') }
    ]
  });

  // ---------------------------------------------------------------- school of magic
  var school = mk({
    name: 'Emberbrook Academy', w: 20, h: 13, floor: 'H', door: 10,
    fills: [[9, 4, 11, 11, 'B'], [14, 2, 18, 4, 'S']],
    props: [
      pr('element_banner', 1, 1), pr('element_banner', 2, 1), pr('element_banner', 3, 1), pr('element_banner', 4, 1),
      pr('window', 6, 1), pr('lantern_hang', 7, 1), pr('blackboard', 9, 1), pr('lantern_hang', 12, 1), pr('window', 13, 1),
      pr('element_banner', 15, 1), pr('element_banner', 16, 1), pr('element_banner', 17, 1), pr('element_banner', 18, 1),
      pr('bookstack', 1, 2), pr('plant', 4, 2), pr('crystal_orb', 16, 3), pr('potion_rack', 18, 2),
      pr('bookshelf', 1, 4),
      pr('school_desk', 3, 6), pr('school_desk', 5, 6), pr('school_desk', 7, 6),
      pr('school_desk', 13, 6), pr('school_desk', 15, 6), pr('school_desk', 17, 6),
      pr('school_desk', 3, 9), pr('school_desk', 5, 9), pr('school_desk', 7, 9),
      pr('school_desk', 13, 9), pr('school_desk', 15, 9), pr('school_desk', 17, 9),
      pr('bookstack', 1, 11), pr('flower_vase', 18, 11), pr('plant', 1, 8), pr('bookstack', 18, 8)
    ],
    npcs: [
      { key: 'elder', x: 8, y: 3, dir: 0, lines: L('Madam Sorrel', 'Eight elements, eight tempers, and all of them teachable.', 'Read the board, child, and mind the orb.') },
      { key: 'boy', x: 5, y: 7, dir: 1, lines: L('Ash', 'I made a spark today, a tiny one.', 'Do not tell Kip outside, he would be jealous.') }
    ]
  });
  ['water', 'fire', 'wind', 'grass', 'electric', 'earth', 'dark', 'light'].forEach(function (el, i) {
    H.bannerEl = H.bannerEl || {};
    H.bannerEl[(i < 4 ? 1 + i : 11 + i) + ',1'] = el;
  });

  // ---------------------------------------------------------------- houses
  var house1 = mk({ // hints at the magic school
    name: 'Wren\'s House', w: 14, h: 11, floor: 'F', door: 7,
    fills: [[9, 2, 12, 4, 'K'], [3, 5, 8, 8, 'R']],
    props: [
      pr('window', 3, 1), pr('picture', 6, 1), pr('window', 8, 1),
      pr('bookshelf', 1, 2), pr('stove', 9, 2), pr('cupboard', 11, 2),
      pr('table', 5, 6), pr('chair', 4, 6), pr('chair', 7, 7),
      pr('school_desk', 1, 6), pr('bookstack', 1, 7), pr('bed', 12, 6), pr('flower_vase', 12, 9), pr('plant', 1, 9), pr('clock', 4, 2)
    ],
    npcs: [
      { key: 'girl', x: 2, y: 8, dir: 1, lines: L('Wren', 'A letter came from the Academy with my name on it.', 'It glows when I hold it near the fire.') },
      { key: 'mom', x: 9, y: 5, dir: 0, lines: L('Hazel', 'Wren reads spellbooks under the blanket at night.', 'I never saw magic, but I see her smile.') }
    ]
  });
  var house2 = mk({ // hints at a lost hontori
    name: 'Pip\'s House', w: 14, h: 11, floor: 'H', door: 7,
    fills: [[1, 2, 4, 4, 'K'], [7, 4, 11, 7, 'R']],
    props: [
      pr('window', 2, 1), pr('lantern_hang', 6, 1), pr('window', 9, 1), pr('picture', 11, 1),
      pr('stove', 1, 2), pr('cupboard', 2, 2), pr('loom', 6, 2), pr('bookshelf', 11, 2),
      pr('sofa', 8, 5), pr('flower_vase', 10, 5), pr('table', 2, 6), pr('chair', 1, 6), pr('chair', 4, 7),
      pr('bed', 12, 7), pr('chest', 12, 9), pr('barrel_in', 1, 9), pr('plant', 6, 9)
    ],
    npcs: [
      { key: 'boy', x: 9, y: 8, dir: 1, lines: L('Pip', 'A glowing puff slept in our woodpile last week.', 'Then it was gone, and it left wet pawprints.') },
      { key: 'dad', x: 5, y: 3, dir: 0, lines: L('Bram', 'Pip leaves a saucer of milk by the door each night.', 'Something drinks it, so I let him keep hoping.') }
    ]
  });
  var house3 = mk({ // hints at the elder
    name: 'Fenn\'s House', w: 14, h: 11, floor: 'F', door: 7,
    fills: [[8, 2, 12, 4, 'S'], [2, 5, 6, 8, 'R']],
    props: [
      pr('picture', 2, 1), pr('window', 4, 1), pr('window', 9, 1), pr('notice_board', 11, 1),
      pr('bookshelf', 1, 2), pr('fireplace', 9, 2), pr('clock', 12, 2),
      pr('sofa', 3, 6), pr('floor_lamp', 1, 6), pr('table', 9, 6), pr('chair', 8, 6), pr('chair', 11, 7),
      pr('bed', 12, 4), pr('bookstack', 1, 9), pr('flower_vase', 12, 9), pr('plant', 5, 9)
    ],
    npcs: [
      { key: 'dad', x: 7, y: 4, dir: 0, lines: L('Fenn', 'Elder Wisteria once walked with a spirit of light.', 'She still sets a second cup of tea each morning.') },
      { key: 'girl', x: 4, y: 8, dir: 1, lines: L('Lark', 'Grandpa says the Elder hums the old spells.', 'Ask her about the well, she goes very quiet.') }
    ]
  });

  var defs = { tavern: tavern, shop: shop, school: school, house_a1: house1, house_a2: house2, house_a3: house3 };
  for (var k in defs) H.maps[k] = defs[k];

  // ---------------------------------------------------------------- link doors
  var FP = { house_player: [6, 4], house_a: [5, 4], tavern: [8, 5], shop: [6, 4], school: [10, 6] };
  var village = H.maps.village;
  if (village) {
    var houseN = 0;
    village.doors = village.doors || [];
    (village.buildings || []).forEach(function (b) {
      var name = b.type === 'house_a' ? 'house_a' + (++houseN) : b.type;
      var m = defs[name]; if (!m) return;
      var f = (H.buildings && H.buildings.info && H.buildings.info[b.type]) || { fw: FP[b.type][0], fh: FP[b.type][1] };
      var dx = b.x + Math.floor(f.fw / 2), dy = b.y + f.fh - 1;
      if (!village.doors.some(function (d) { return d.x === dx && d.y === dy; }))
        village.doors.push({ x: dx, y: dy, to: name, tx: m.door, ty: m.h - 2, dir: 1 });
      m.doors = [{ x: m.door, y: m.h - 1, to: 'village', tx: dx, ty: dy + 1, dir: 0 }];
    });
  }

  // ---------------------------------------------------------------- walkability check (used by tests)
  function check(name) {
    var m = H.maps[name], info = (H.furniture && H.furniture.info) || {}, solidT = { wall: 1, void: 1 }, errs = [];
    var sol = m.ground.map(function (r) { return r.split('').map(function (ch) { return !!solidT[m.legend[ch]]; }); });
    m.props.forEach(function (p) {
      var i = info[p.type]; if (!i) { errs.push('unknown prop ' + p.type); return; }
      if (i.solid && !i.decor) for (var y = 0; y < i.fh; y++) for (var x = 0; x < i.fw; x++) {
        if (sol[p.y + y] && sol[p.y + y][p.x + x] && m.ground[p.y + y][p.x + x] !== 'W') errs.push('overlap ' + p.type + ' ' + (p.x + x) + ',' + (p.y + y));
        if (sol[p.y + y]) sol[p.y + y][p.x + x] = true;
      }
    });
    m.npcs.forEach(function (n) { if (sol[n.y][n.x]) errs.push('npc on solid ' + n.key); sol[n.y][n.x] = true; });
    var s = m.spawn, seen = {}, q = [[s.x, s.y]]; seen[s.x + ',' + s.y] = 1;
    while (q.length) {
      var c = q.shift();
      [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(function (d) {
        var nx = c[0] + d[0], ny = c[1] + d[1];
        if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || sol[ny][nx] || seen[nx + ',' + ny]) return;
        seen[nx + ',' + ny] = 1; q.push([nx, ny]);
      });
    }
    var ex = m.doors[0]; if (!ex || !seen[ex.x + ',' + ex.y]) errs.push('exit unreachable');
    m.npcs.forEach(function (n) {
      if (![[0, 1], [0, -1], [1, 0], [-1, 0]].some(function (d) { return seen[(n.x + d[0]) + ',' + (n.y + d[1])]; })) errs.push('npc unreachable ' + n.key);
    });
    // every interactive floor prop should be reachable from at least one side
    m.props.forEach(function (p) {
      var i = info[p.type]; if (!i || i.decor) return; var ok = false;
      for (var y = -1; y <= i.fh && !ok; y++) for (var x = -1; x <= i.fw && !ok; x++) {
        var edge = (y === -1 || y === i.fh) !== (x === -1 || x === i.fw); if (edge && seen[(p.x + x) + ',' + (p.y + y)]) ok = true;
      }
      if (!ok) errs.push('prop unreachable ' + p.type + ' ' + p.x + ',' + p.y);
    });
    return errs;
  }
  H.interiors = { names: Object.keys(defs), check: check };
})();
