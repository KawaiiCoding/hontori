window.H = window.H || {};
// Clear pixel icons for world items that had none of their own: every fish, the forest finds, the merchant pouch,
// and chapters 4 and 5: tide_ring, spark_ring, ferry_ticket, night_hook, bell_order.
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
