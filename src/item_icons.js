window.H = window.H || {};
// Clear pixel icons for world items that had none of their own: every fish, the forest finds, the merchant pouch,
// chapters 4 and 5: tide_ring, spark_ring, ferry_ticket, night_hook, bell_order; chapters 6 and 7: stone_ring,
// flame_ring, lantern_oil, miner_rope, dug_treat, carving_chisel, burr_page, sanctum_order, heat_cloak, grandma_wand,
// grandma_letter, vael_young_letter; chapters 8 and 9: moon_ring, halo_ring, favour_token, garden_key.
// Rule: every item in the world is shown by an icon that looks like the thing itself.
// API: H.itemIcons = { has(id), draw(g, id) (16 x 16 at 1x), url(id, scale) }
(function () {
  'use strict';
  var H = window.H, OL = '#1e1a24';
  function P(g, x, y, c, w, h) { g.fillStyle = c; g.fillRect(x, y, w || 1, h || 1); }
  // fish: one body shape, coloured per kind [back, belly, fin, mark]
  var FISH = {
    minnow: ['#8aa0a8', '#dfe8e8', '#6a8088', null], carp: ['#a8b0b8', '#f0f0f0', '#808890', '#c8ccd2'],
    moonfin: ['#3a4a8a', '#c8d0f8', '#2a3470', '#fff4c0'], trout: ['#6a8a4a', '#f0d8c0', '#4a6a34', '#e0607a'],
    perch: ['#c8b040', '#f0e8b0', '#a08020', '#3a4020'], glowgill: ['#2a6a6a', '#b0fff0', '#1a4a4a', '#80ffe0'],
    koi: ['#f0f0f0', '#ffffff', '#e05a30', '#e05a30'], bass: ['#4a6a3a', '#d8e0b0', '#34502a', '#2a3a20'],
    starkoi: ['#ffd860', '#fff6d0', '#e0a020', '#ffffff'], mackerel: ['#3a6aa8', '#e8f0f8', '#2a4a80', '#1a2a50'],
    snapper: ['#d84a3a', '#ffd0c0', '#a8302a', '#ff9a80'], tidefin: ['#2a8ab8', '#d0f4ff', '#1a5a80', '#ffffff']
  };
  function fish(g, c) {
    // tail on the left, head on the right, a fin on top
    P(g, 1, 5, OL, 3, 6); P(g, 2, 6, c[2], 1, 4); P(g, 1, 4, OL, 2, 1); P(g, 1, 11, OL, 2, 1);
    P(g, 4, 5, OL, 9, 6); P(g, 3, 6, OL, 1, 4); P(g, 13, 6, OL, 2, 4);
    P(g, 4, 6, c[0], 9, 2); P(g, 4, 8, c[1], 9, 2); P(g, 13, 7, c[0], 1, 2);
    P(g, 7, 3, OL, 4, 2); P(g, 8, 4, c[2], 2, 1);
    P(g, 11, 6, '#ffffff', 1, 1); P(g, 12, 6, OL, 1, 1);
    if (c[3]) { P(g, 6, 7, c[3], 1, 1); P(g, 8, 6, c[3], 1, 1); P(g, 9, 8, c[3], 1, 1); }
    P(g, 5, 6, 'rgba(255,255,255,.5)', 3, 1);
  }
  var DRAW = {
    glowcap: function (g) { P(g, 7, 9, OL, 3, 6); P(g, 8, 9, '#e8e0c8', 1, 5); P(g, 3, 4, OL, 11, 6); P(g, 4, 5, '#1a4a4a', 9, 4); P(g, 5, 5, '#60e8c8', 7, 2); P(g, 6, 5, '#d8fff0', 2, 1); P(g, 4, 3, OL, 9, 1); },
    river_reed: function (g) { for (var y = 2; y < 15; y++) { P(g, 7, y, OL, 3, 1); P(g, 8, y, '#6a9a3a', 1, 1); } P(g, 6, 2, OL, 5, 5); P(g, 7, 3, '#7a4a28', 3, 3); P(g, 8, 3, '#a8703c', 1, 2); P(g, 10, 8, OL, 3, 2); P(g, 11, 8, '#8ac050', 1, 1); },
    acorn: function (g) { P(g, 4, 3, OL, 8, 4); P(g, 5, 4, '#8a5a30', 6, 2); P(g, 7, 2, OL, 2, 1); P(g, 4, 6, OL, 8, 7); P(g, 5, 7, '#c88a40', 6, 5); P(g, 6, 7, '#e8b060', 2, 3); P(g, 7, 12, OL, 2, 2); },
    wild_herb: function (g) { P(g, 7, 8, OL, 2, 7); P(g, 7, 9, '#4a8a34', 1, 5); [[3, 4], [9, 3], [5, 1]].forEach(function (l) { P(g, l[0], l[1], OL, 5, 5); P(g, l[0] + 1, l[1] + 1, '#5ab040', 3, 3); P(g, l[0] + 1, l[1] + 1, '#9ae070', 1, 1); }); },
    blue_backpack: function (g) {
      // a blue backpack with a flap, a front pocket and a strap loop on top
      P(g, 6, 1, OL, 4, 1); P(g, 5, 2, OL, 1, 2); P(g, 10, 2, OL, 1, 2);
      P(g, 3, 3, OL, 10, 12); P(g, 2, 5, OL, 1, 9); P(g, 13, 5, OL, 1, 9);
      P(g, 4, 4, '#3a7ad8', 8, 10); P(g, 3, 6, '#3a7ad8', 10, 7); P(g, 4, 4, '#6aa8f0', 3, 3);
      P(g, 4, 7, OL, 8, 1); P(g, 7, 7, '#e0c060', 2, 2);
      P(g, 5, 10, OL, 6, 4); P(g, 6, 11, '#2a5aa8', 4, 2); P(g, 6, 11, '#4a8ae0', 4, 1);
    },
    saddle: function (g) {
      // a leather saddle with a red blanket, a pommel and a stirrup
      P(g, 2, 8, OL, 12, 5); P(g, 3, 9, '#b04a3a', 10, 3); P(g, 3, 11, '#e0c060', 10, 1);
      P(g, 3, 4, OL, 10, 5); P(g, 2, 5, OL, 2, 3); P(g, 12, 3, OL, 2, 5);
      P(g, 4, 5, '#8a5a30', 8, 3); P(g, 3, 6, '#8a5a30', 1, 1); P(g, 12, 4, '#8a5a30', 1, 3); P(g, 5, 5, '#b07a44', 5, 1);
      P(g, 7, 12, OL, 1, 3); P(g, 5, 14, OL, 5, 2); P(g, 6, 14, '#c8c8d2', 3, 1);
    },
    pouch: function (g) {
      // a leather drawstring pouch with a coin peeking out
      P(g, 5, 1, OL, 6, 3); P(g, 6, 2, '#c8925a', 4, 1); P(g, 4, 3, OL, 8, 1); P(g, 5, 4, OL, 6, 1);
      P(g, 2, 5, OL, 12, 10); P(g, 1, 7, OL, 1, 6); P(g, 14, 7, OL, 1, 6); P(g, 3, 15, OL, 10, 1);
      P(g, 3, 5, '#8a5a30', 10, 10); P(g, 2, 7, '#8a5a30', 12, 6); P(g, 4, 6, '#b07a44', 5, 5); P(g, 4, 6, '#c8925a', 2, 3);
      P(g, 3, 5, '#e0c060', 10, 1); P(g, 7, 4, '#e0c060', 2, 1);
      P(g, 9, 9, OL, 4, 4); P(g, 10, 10, '#ffd860', 2, 2); P(g, 10, 10, '#fff4c0', 1, 1);
    }
  };
  // the Warden rings, styled like the Gale Ring: a band with its element's gem on top [band, band light, band dark, gem, gem light, gem dark]
  function ring(g, c) {
    P(g, 4, 6, OL, 8, 9); P(g, 3, 8, OL, 10, 5);
    P(g, 5, 7, c[0], 6, 7); P(g, 4, 8, c[0], 8, 5); P(g, 5, 7, c[1], 3, 1); P(g, 4, 8, c[1], 1, 2);
    P(g, 9, 12, c[2], 2, 1); P(g, 6, 13, c[2], 4, 1);
    P(g, 6, 9, OL, 4, 3); P(g, 6, 9, '#3a3448', 4, 3);
    P(g, 6, 1, OL, 4, 6); P(g, 5, 2, OL, 6, 4);
    P(g, 6, 2, c[3], 4, 4); P(g, 7, 2, c[4], 2, 1); P(g, 6, 3, c[4], 1, 1); P(g, 8, 4, c[5], 2, 2);
  }
  /* the Tide Ring: a pale silver-blue band with a round sea pearl */
  DRAW.tide_ring = function (g) { ring(g, ['#c4d4e4', '#eef4fa', '#7a8ea8', '#4a9ad8', '#d8f2ff', '#2a5a9a']); };
  /* the Spark Ring: a copper band with a yellow spark stone */
  DRAW.spark_ring = function (g) {
    ring(g, ['#d0844a', '#f4c08a', '#8a4a24', '#ffd84a', '#fffbe0', '#c89a20']);
    P(g, 4, 1, '#ffe680', 1, 1); P(g, 11, 1, '#ffe680', 1, 1);
  };
  /* the ferry ticket: a cream paper stub with a torn edge, a blue boat printed on it and a red punch hole */
  DRAW.ferry_ticket = function (g) {
    P(g, 1, 4, OL, 14, 9); P(g, 2, 5, '#f4ead0', 12, 7); P(g, 2, 5, '#fffaf0', 12, 1);
    for (var y = 5; y < 12; y += 2) P(g, 13, y, OL, 1, 1);
    P(g, 10, 5, '#c8b898', 1, 7);
    P(g, 3, 9, '#2a5a9a', 6, 1); P(g, 4, 10, '#2a5a9a', 4, 1); P(g, 6, 6, '#5a3a22', 1, 3); P(g, 4, 7, '#ffffff', 2, 2); P(g, 7, 7, '#e8e0d0', 1, 1);
    P(g, 11, 7, '#c8443a', 2, 2); P(g, 11, 7, '#e87a6a', 1, 1);
  };
  /* the Night Hook: a bright silver fish hook with a small glowing lure bead on its line */
  DRAW.night_hook = function (g) {
    P(g, 8, 0, OL, 3, 3); P(g, 9, 1, '#e0e4ee', 1, 1);
    P(g, 8, 3, OL, 3, 8); P(g, 9, 3, '#c8ccd8', 1, 8);
    P(g, 3, 9, OL, 3, 4); P(g, 4, 9, '#c8ccd8', 1, 3); P(g, 3, 7, OL, 3, 3); P(g, 4, 7, '#f4f6fa', 1, 2);
    P(g, 4, 11, OL, 7, 3); P(g, 5, 12, '#c8ccd8', 5, 1); P(g, 8, 11, '#c8ccd8', 2, 1);
    P(g, 11, 4, OL, 4, 4); P(g, 12, 5, '#7ad8f0', 2, 2); P(g, 12, 5, '#e8fbff', 1, 1);
    P(g, 10, 5, '#a8a8b8', 1, 1);
  };
  /* the bell order: a brass plate with engraved lines and a round grey seal with a closed eye */
  DRAW.bell_order = function (g) {
    P(g, 1, 2, OL, 14, 12); P(g, 2, 3, '#d8a840', 12, 10); P(g, 2, 3, '#f4d478', 12, 1); P(g, 2, 3, '#f4d478', 1, 10);
    P(g, 13, 4, '#a87a24', 1, 9); P(g, 3, 12, '#a87a24', 11, 1);
    P(g, 3, 4, '#fff0b0', 1, 1); P(g, 12, 4, '#8a6420', 1, 1); P(g, 3, 11, '#8a6420', 1, 1);
    P(g, 4, 5, '#8a6420', 7, 1); P(g, 4, 7, '#8a6420', 5, 1); P(g, 4, 9, '#8a6420', 3, 1);
    P(g, 8, 8, OL, 6, 6); P(g, 7, 9, OL, 8, 4); P(g, 9, 9, '#8a8a96', 4, 4); P(g, 8, 10, '#8a8a96', 6, 2); P(g, 9, 9, '#b0b0bc', 2, 1);
    P(g, 9, 11, '#4a4a58', 1, 1); P(g, 10, 12, '#4a4a58', 2, 1); P(g, 12, 11, '#4a4a58', 1, 1);
  };
  /* ---------- chapters 6 and 7 ---------- */
  /* the Stone Ring: a stone-grey band with a polished amber stone */
  DRAW.stone_ring = function (g) { ring(g, ['#9a968c', '#d0ccc0', '#5e5a52', '#d88a2a', '#ffd890', '#8a5218']); };
  /* the Flame Ring: a dark iron band with a glowing ember stone */
  DRAW.flame_ring = function (g) {
    ring(g, ['#5a4a4a', '#8a7a78', '#2e2426', '#e8502a', '#ffd070', '#9a2a1a']);
    P(g, 7, 0, '#ffb040', 2, 1);
  };
  /* Lantern Oil: a small round glass flask of clear golden oil with a cork and a string tag */
  DRAW.lantern_oil = function (g) {
    P(g, 6, 1, OL, 4, 4); P(g, 7, 2, '#b07a44', 2, 2); P(g, 7, 2, '#d8a468', 1, 1);
    P(g, 5, 4, OL, 6, 3); P(g, 6, 5, '#c8dce4', 4, 2);
    P(g, 3, 6, OL, 10, 9); P(g, 2, 8, OL, 12, 6); P(g, 4, 15, OL, 8, 1);
    P(g, 4, 7, '#c8dce4', 8, 8); P(g, 3, 9, '#c8dce4', 10, 4);
    P(g, 3, 10, '#e8b040', 10, 3); P(g, 4, 10, '#f4cc60', 8, 1); P(g, 4, 13, '#c88a24', 8, 1); P(g, 5, 14, '#c88a24', 6, 1);
    P(g, 4, 8, '#ffffff', 1, 2); P(g, 5, 7, '#ffffff', 1, 1);
    P(g, 10, 5, '#c8443a', 1, 1); P(g, 11, 6, '#c8443a', 2, 2);
  };
  /* the Miner's Rope: a coil of thick hemp rope, the loose end hanging down */
  DRAW.miner_rope = function (g) {
    P(g, 3, 3, OL, 10, 10); P(g, 2, 5, OL, 12, 6); P(g, 4, 2, OL, 8, 12);
    P(g, 4, 4, '#c89a58', 8, 8); P(g, 3, 6, '#c89a58', 10, 4); P(g, 5, 3, '#c89a58', 6, 10);
    P(g, 6, 6, OL, 4, 4); P(g, 7, 7, '#5a4028', 2, 2);
    [[4, 5], [5, 4], [10, 4], [11, 5], [3, 8], [12, 8], [5, 11], [10, 11], [7, 12], [8, 3]].forEach(function (p) { P(g, p[0], p[1], '#8a6434', 1, 1); });
    [[5, 5], [6, 4], [4, 7], [9, 4]].forEach(function (p) { P(g, p[0], p[1], '#ecc888', 1, 1); });
    P(g, 11, 11, OL, 3, 5); P(g, 12, 12, '#c89a58', 1, 3); P(g, 12, 15, '#8a6434', 1, 1);
  };
  /* the Dugsworth Treat: a round golden biscuit with a small grey pebble pressed on top */
  DRAW.dug_treat = function (g) {
    var y, rr = [3, 5, 6, 6, 7, 7, 7, 7, 6, 6, 5, 3];
    for (y = 0; y < 12; y++) P(g, 8 - rr[y] - 1, 2 + y, OL, rr[y] * 2 + 2, 1);
    P(g, 5, 1, OL, 6, 1); P(g, 5, 14, OL, 6, 1);
    for (y = 0; y < 12; y++) P(g, 8 - rr[y], 2 + y, '#d8a050', rr[y] * 2, 1);
    P(g, 4, 4, '#f0c878', 3, 1); P(g, 3, 5, '#f0c878', 2, 2);
    P(g, 11, 9, '#b07a34', 2, 3); P(g, 6, 12, '#b07a34', 5, 1); P(g, 12, 7, '#b07a34', 1, 2);
    [[4, 9], [10, 4], [9, 11], [6, 4]].forEach(function (q) { P(g, q[0], q[1], '#a86a2a', 1, 1); });
    P(g, 6, 6, OL, 4, 4); P(g, 5, 7, OL, 6, 2); P(g, 6, 7, '#8a8a92', 4, 2); P(g, 7, 6, '#9a9aa2', 2, 3); P(g, 7, 7, '#d4d4dc', 1, 1);
  };
  /* the Fox Chisel: a steel chisel with a worn wooden handle; a small fox head is cut into the handle's end */
  DRAW.carving_chisel = function (g) {
    var i;
    /* the steel blade, from the cutting edge (bottom left) up to the ferrule */
    for (i = 0; i < 6; i++) P(g, 1 + i, 12 - i, OL, 3, 3);
    for (i = 0; i < 6; i++) { P(g, 2 + i, 13 - i, '#8a8e9a', 1, 1); P(g, 2 + i, 12 - i, '#dce0ea', 1, 1); }
    P(g, 1, 14, OL, 2, 1); P(g, 2, 13, '#f4f6fa', 1, 1);
    /* the brass ferrule */
    P(g, 7, 6, OL, 3, 3); P(g, 8, 7, '#d0a040', 1, 1);
    /* the wooden handle, rising to the top right, with a small fox head cut in its end */
    for (i = 0; i < 5; i++) P(g, 9 + i, 5 - i, OL, 3, 3);
    for (i = 0; i < 5; i++) { P(g, 10 + i, 5 - i, '#8a5a30', 1, 1); P(g, 9 + i, 5 - i, '#b07a44', 1, 1); }
    P(g, 13, 0, '#e07a3a', 1, 1); P(g, 15, 1, '#e07a3a', 1, 1); P(g, 14, 1, '#ffd0a0', 1, 1);
  };
  /* Burr's Page: a torn page of notes with a sketch of the carving: a figure with a wand and a fox at her feet */
  DRAW.burr_page = function (g) {
    P(g, 2, 1, OL, 12, 14); P(g, 3, 2, '#f0e4c4', 10, 12); P(g, 3, 2, '#fbf4e0', 10, 1);
    for (var y = 3; y < 14; y += 3) P(g, 13, y, OL, 1, 1);
    P(g, 12, 3, '#d8c8a0', 1, 11);
    P(g, 6, 3, '#5a4a6a', 2, 2); P(g, 5, 5, '#5a4a6a', 4, 5); P(g, 5, 10, '#5a4a6a', 1, 2); P(g, 8, 10, '#5a4a6a', 1, 2);
    P(g, 9, 4, '#5a4a6a', 1, 5); P(g, 9, 3, '#c89a3a', 1, 1);
    P(g, 9, 11, '#c85a2a', 2, 1); P(g, 10, 10, '#c85a2a', 1, 1); P(g, 11, 11, '#c85a2a', 1, 1);
    P(g, 4, 13, '#a89878', 7, 1);
  };
  /* the Council Order: a cream paper with a gold border and a round grey wax seal with a closed eye */
  DRAW.sanctum_order = function (g) {
    P(g, 1, 1, OL, 14, 14); P(g, 2, 2, '#e0c060', 12, 12); P(g, 3, 3, '#f6eed8', 10, 10); P(g, 3, 3, '#fffaf0', 10, 1);
    P(g, 4, 4, '#8a7a5a', 7, 1); P(g, 4, 6, '#8a7a5a', 5, 1); P(g, 4, 8, '#8a7a5a', 6, 1);
    P(g, 7, 9, OL, 6, 6); P(g, 6, 10, OL, 8, 4); P(g, 8, 10, '#8a8a96', 4, 4); P(g, 7, 11, '#8a8a96', 6, 2); P(g, 8, 10, '#b0b0bc', 2, 1);
    P(g, 8, 12, '#4a4a58', 1, 1); P(g, 9, 13, '#4a4a58', 2, 1); P(g, 11, 12, '#4a4a58', 1, 1);
  };
  /* the Heat Cloak: a folded cloak of grey ash-cloth with an ember-red hem and a clasp */
  DRAW.heat_cloak = function (g) {
    var y;
    /* the hood */
    P(g, 5, 0, OL, 6, 1); P(g, 4, 1, OL, 8, 4); P(g, 5, 1, '#8a8480', 6, 3); P(g, 6, 2, '#3a3436', 4, 2); P(g, 5, 1, '#a8a29c', 2, 1);
    /* the cloak, widening down from the shoulders */
    for (y = 0; y < 10; y++) { var hw = 4 + Math.floor(y * 0.4); P(g, 8 - hw - 1, 5 + y, OL, hw * 2 + 2, 1); P(g, 8 - hw, 5 + y, '#8a8480', hw * 2, 1); P(g, 8 - hw, 5 + y, '#a8a29c', 2, 1); P(g, 7 + hw - 1, 5 + y, '#6a6460', 1, 1); }
    P(g, 1, 15, OL, 14, 1);
    P(g, 8, 6, '#5a5450', 1, 7);
    P(g, 1, 13, '#c8442a', 14, 2); P(g, 1, 13, '#e8703a', 14, 1);
    P(g, 7, 4, OL, 3, 3); P(g, 8, 5, '#f0b040', 1, 1);
  };
  /* Grandma's Wand: a slim wooden wand with a wrapped grip and a small glowing light-stone at its tip */
  DRAW.grandma_wand = function (g) {
    for (var i = 0; i < 9; i++) { P(g, 2 + i, 13 - i, OL, 3, 3); }
    for (i = 0; i < 9; i++) { P(g, 3 + i, 13 - i, i < 3 ? '#6a3a5a' : '#a87a4a', 1, 1); if (i > 2) P(g, 3 + i, 14 - i, '#7a5230', 1, 1); }
    P(g, 3, 13, '#c88ab0', 1, 1); P(g, 5, 11, '#c88ab0', 1, 1);
    P(g, 11, 1, OL, 4, 4); P(g, 12, 2, '#fff0a0', 2, 2); P(g, 12, 2, '#ffffff', 1, 1); P(g, 13, 3, '#e8c050', 1, 1);
  };
  /* Grandma's Note: a folded cream note tied with a lilac ribbon */
  DRAW.grandma_letter = function (g) {
    P(g, 1, 3, OL, 14, 11); P(g, 2, 4, '#f6ecd4', 12, 9); P(g, 2, 4, '#fffaf0', 12, 1);
    P(g, 8, 4, '#d8c8a8', 1, 9);
    P(g, 3, 6, '#8a7a6a', 4, 1); P(g, 3, 8, '#8a7a6a', 3, 1); P(g, 10, 6, '#8a7a6a', 3, 1); P(g, 10, 8, '#8a7a6a', 2, 1);
    P(g, 2, 10, '#a888d8', 12, 1); P(g, 7, 9, OL, 3, 3); P(g, 8, 10, '#c8b0f0', 1, 1); P(g, 6, 11, '#a888d8', 1, 2); P(g, 10, 11, '#a888d8', 1, 2);
  };
  /* the letter from young Orlen: an old envelope, yellowed, with a small blue wax seal */
  DRAW.vael_young_letter = function (g) {
    P(g, 1, 3, OL, 14, 11); P(g, 2, 4, '#e8d8b0', 12, 9); P(g, 2, 4, '#f4e8c8', 12, 1);
    for (var i = 0; i < 6; i++) { P(g, 2 + i, 5 + i, '#b8a480', 1, 1); P(g, 13 - i, 5 + i, '#b8a480', 1, 1); }
    P(g, 6, 9, OL, 4, 4); P(g, 7, 10, '#3a5ab0', 2, 2); P(g, 7, 10, '#7a9ae0', 1, 1);
    P(g, 3, 12, '#c8b48c', 10, 1);
  };
  /* ---------- chapters 8 and 9 ---------- */
  /* the Moon Ring: a silver band with a pale violet moonstone, a thin crescent cut in it */
  DRAW.moon_ring = function (g) {
    ring(g, ['#b8b8cc', '#eeeef8', '#6a6a86', '#a898e8', '#f0ecff', '#5a4aa0']);
    P(g, 8, 3, '#5a4aa0', 1, 2);
  };
  /* the Halo Ring: a gold band with a white-gold stone and a thin halo over it */
  DRAW.halo_ring = function (g) {
    ring(g, ['#e8b840', '#fff0a0', '#a87a24', '#fff4d0', '#ffffff', '#e0b048']);
    P(g, 4, 0, '#ffe680', 8, 1); P(g, 3, 1, '#ffe680', 1, 1); P(g, 12, 1, '#ffe680', 1, 1);
  };
  /* a favour token: a round wooden token on a red cord, a knot carved in its face */
  DRAW.favour_token = function (g) {
    P(g, 7, 0, '#c8443a', 2, 4); P(g, 6, 1, '#c8443a', 1, 2); P(g, 9, 1, '#c8443a', 1, 2);
    P(g, 4, 4, OL, 8, 11); P(g, 3, 5, OL, 10, 9); P(g, 2, 7, OL, 12, 5);
    P(g, 4, 5, '#b07a44', 8, 9); P(g, 3, 7, '#b07a44', 10, 5); P(g, 4, 5, '#d0a068', 3, 2); P(g, 3, 7, '#d0a068', 1, 2);
    P(g, 11, 10, '#8a5a30', 1, 2); P(g, 6, 13, '#8a5a30', 5, 1);
    P(g, 6, 7, '#5a3a20', 4, 1); P(g, 6, 10, '#5a3a20', 4, 1); P(g, 6, 7, '#5a3a20', 1, 4); P(g, 9, 7, '#5a3a20', 1, 4); P(g, 7, 8, '#5a3a20', 2, 2);
  };
  /* the garden key: a long gold key with a leaf-shaped bow */
  DRAW.garden_key = function (g) {
    P(g, 1, 1, OL, 7, 7); P(g, 2, 2, '#e0b048', 5, 5); P(g, 3, 2, '#fff0a0', 2, 1); P(g, 2, 3, '#fff0a0', 1, 2);
    P(g, 4, 4, OL, 1, 1); P(g, 5, 3, '#a87a24', 1, 1); P(g, 3, 5, '#a87a24', 1, 1);
    for (var i = 0; i < 7; i++) { P(g, 6 + i, 6 + i, OL, 3, 3); }
    for (i = 0; i < 7; i++) P(g, 7 + i, 7 + i, '#e0b048', 1, 1);
    P(g, 11, 13, OL, 3, 3); P(g, 12, 14, '#e0b048', 1, 1); P(g, 13, 10, OL, 3, 3); P(g, 14, 11, '#e0b048', 1, 1);
  };
  Object.keys(FISH).forEach(function (k) { DRAW[k] = function (g) { fish(g, FISH[k]); }; });
  var urls = {};
  function draw(g, id) { if (DRAW[id]) DRAW[id](g); }
  function url(id, scale) {
    var key = id + '@' + (scale || 2); if (urls[key]) return urls[key];
    var c = document.createElement('canvas'), s = scale || 2; c.width = c.height = 16 * s; var g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.scale(s, s); draw(g, id);
    return (urls[key] = c.toDataURL());
  }
  H.itemIcons = { has: function (id) { return !!DRAW[id]; }, draw: draw, url: url };
})();
