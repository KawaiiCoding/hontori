window.H = window.H || {};
// interiors_interact: what the tavern, shop and school furniture does when you press the action button.
(function () {
  'use strict';
  var H = window.H;
  if (!H.interact) return;
  var base = { has: H.interact.has, run: H.interact.run };
  var visits = {};

  function P(v) { return (v && typeof v.then === 'function') ? v : Promise.resolve(v); }
  function say(c, key, name, text) { return c.say ? P(c.say(key, name, text)) : Promise.resolve(); }
  function kid(c, text) { return say(c, 'kid', 'You', text); }
  function fox(c, text) { return c.hasSpirit ? say(c, 'hontori', 'Hontori', text) : Promise.resolve(); }
  function toast(c, t) { if (c.toast) c.toast(t); }
  function emit(c, kind, n, dy) { if (c.emit) c.emit(kind, c.x || 0, (c.y || 0) + (dy || 0), n); }
  function sfx(c, n) { if (c.sfx) c.sfx(n); }
  function choose(opts) { return H.ui && H.ui.choose ? P(H.ui.choose(opts)) : Promise.resolve(-1); }
  function step(n, a) { return a[n % a.length]; }
  function save() { try { H.game && H.game.save(); } catch (e) {} }
  function cycle(lines, fx) { return function (c, n) { if (fx) emit(c, fx, 5, -8); return kid(c, step(n, lines)); }; }

  function ramen(c) {
    return say(c, 'innkeeper', 'Big Bo', 'A hot bowl of ramen for you and your friends?')
      .then(function () { return choose(['Eat ramen', 'No thanks']); })
      .then(function (i) {
        if (i !== 0) return say(c, 'innkeeper', 'Big Bo', 'The pot will be here when you are hungry.');
        var party = (H.game && H.game.state && H.game.state.party) || [];
        party.forEach(function (p) { p.hp = p.maxHp; if (H.progress && H.progress.staMax) p.sta = H.progress.staMax(p.level); });
        if (H.game && H.game.state) H.game.state.mana = H.game.state.maxMana || 3;
        sfx(c, 'sparkle'); emit(c, 'sparkle', 16, -10); emit(c, 'smoke', 6, -14);
        toast(c, 'Party healed. Mana restored.');
        save();
        return say(c, 'innkeeper', 'Big Bo', 'Slurp it slow, the broth is the best part.')
          .then(function () { return fox(c, 'Noodles and steam, a hungry fox\'s dream.'); });
      });
  }

  var GOODS = [
    ['herb', 'Herb', 'grass'], ['ember_dust', 'Ember Dust', 'fire'], ['tide_pearl', 'Tide Pearl', 'water'],
    ['spirit_snack', 'Spirit Snack', 'heart'], ['charm', 'Backpack Charm', 'backpack']
  ];
  function shop(c) {
    return say(c, 'shopkeeper', 'Nettle', 'Pick one, first visit treats are on me.')
      .then(function () { return choose(GOODS.map(function (g) { return g[1]; }).concat(['Nothing'])); })
      .then(function (i) {
        var g = GOODS[i];
        if (!g) return say(c, 'shopkeeper', 'Nettle', 'Browse all you like, dear.');
        if (H.game && H.game.addItem) H.game.addItem(g[0], g[1], g[2]);
        sfx(c, 'confirm'); emit(c, 'sparkle', 8, -10); toast(c, 'Got ' + g[1]); save();
        var tip = g[0] === 'ember_dust' ? 'Ember Dust wakes a fainted fire spirit.' :
          g[0] === 'tide_pearl' ? 'A Tide Pearl wakes a fainted water spirit.' :
          g[0] === 'herb' ? 'An Herb restores a little mana in battle.' :
          g[0] === 'spirit_snack' ? 'A Spirit Snack restores a little mana in battle.' : 'Clip it on, it brings a little luck.';
        return say(c, 'shopkeeper', 'Nettle', tip);
      });
  }

  var PAIRS = [
    'Water beats fire and earth.', 'Fire beats grass and wind.', 'Wind beats grass and electric.',
    'Grass beats water and earth.', 'Electric beats water and wind.', 'Earth beats electric and fire.',
    'Dark and light beat each other.'
  ];
  var NOTES = [
    'Wanted: whoever keeps stealing fish cakes, wet pawprints seen.',
    'Lost: a glowing puff, last seen near a woodpile.',
    'The meadows are lively at dusk, so bring a buddy.',
    'Ask the Elder why the old well hums at night.'
  ];
  var BANNER = {
    water: 'A blue banner with a drop, for water.', fire: 'A red banner with a flame, for fire.',
    wind: 'A pale green banner with a swirl, for wind.', grass: 'A green banner with a leaf, for grass.',
    electric: 'A yellow banner with a bolt, for electric.', earth: 'A brown banner with a mountain, for earth.',
    dark: 'A violet banner with a moon, for dark.', light: 'A golden banner with a sun, for light.'
  };

  var T = {
    ramen_pot: ramen,
    tavern_counter: ramen,
    shop_counter: shop,
    crystal_orb: function (c) {
      sfx(c, 'sparkle'); emit(c, 'magic', 20, -12);
      return say(c, 'orb', 'Crystal Orb', 'Water and fire, and wind on the wire.')
        .then(function () { return say(c, 'orb', 'Crystal Orb', 'Grass and the spark, and earth in the dark.'); })
        .then(function () { return say(c, 'orb', 'Crystal Orb', 'Dark meets the light, eight held tight.'); });
    },
    blackboard: function (c, n) { return kid(c, 'The chalk says: ' + PAIRS[n % PAIRS.length].charAt(0).toLowerCase() + PAIRS[n % PAIRS.length].slice(1)); },
    notice_board: function (c, n) { return kid(c, step(n, NOTES)); },
    element_banner: function (c) {
      var o = c.object || {}, el = (H.bannerEl && H.bannerEl[o.x + ',' + o.y]) || 'light';
      emit(c, 'sparkle', 4, -6);
      return kid(c, BANNER[el] || BANNER.light);
    },
    shop_shelf: cycle(['Potions in every colour, all neatly labelled.', 'A backpack with a pocket for snacks.', 'Herb bundles that smell like rain.']),
    potion_rack: cycle(['The bottles glow softly, like tiny lanterns.', 'One bubbles when I lean close.', 'The label says shake gently, then wish.'], 'sparkle'),
    barrel_in: cycle(['A barrel of something that smells of plums.', 'It sloshes when I knock.', 'Someone carved a fox on the lid.']),
    stool: cycle(['A worn red stool, still warm.', 'It spins a little. Fun.']),
    tavern_table: cycle(['Two bowls, slurped clean.', 'Someone left half an egg, tempting.', 'The table smells of ginger and broth.']),
    lantern_hang: cycle(['A paper lantern, glowing like a sunset.', 'It sways when the door opens.']),
    school_desk: cycle(['A spellbook open to a page about sparks.', 'Somebody doodled a fox in the margin.', 'The ink pot smells of pine.']),
    bookstack: cycle(['"Spirits and How to Befriend Them."', '"Rhymes That Ward Off Rain."', '"The Quiet Art of Earth."']),
    loom: cycle(['A half-woven blanket in sunset colours.', 'The threads hum when I pluck them.']),
    flower_vase: cycle(['Fresh flowers, picked this morning.', 'They lean toward the window.'])
  };

  H.interact.has = function (type) { return !!T[type] || base.has.call(H.interact, type); };
  H.interact.run = function (type, ctx) {
    if (!T[type]) return base.run.call(H.interact, type, ctx);
    ctx = ctx || {};
    var n = visits[type] || 0; visits[type] = n + 1;
    try { return P(T[type](ctx, n)).catch(function (e) { console.warn('interact', type, e); }); }
    catch (e) { console.warn('interact', type, e); return Promise.resolve(); }
  };
})();
