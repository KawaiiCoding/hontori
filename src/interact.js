window.H = window.H || {};
// H.interact - one small interaction for every prop, furniture piece and building.
// run(type, ctx) -> Promise. ctx: { say, toast, emit, sfx, note, env, map, mapName, x, y, player, hasSpirit,
//   setTime, fade, object }
(function () {
  'use strict';

  var visits = {};          // type -> times used
  var state = { coins: 0, apples: 0, books: 0 };

  // ---------- safe wrappers (ctx parts may be missing) ----------
  function P(v) { return (v && typeof v.then === 'function') ? v : Promise.resolve(v); }
  function kid(c, text) { return c.say ? P(c.say('kid', 'You', text)) : Promise.resolve(); }
  function fox(c, text) { return c.say ? P(c.say('hontori', 'Hontori', text)) : Promise.resolve(); }
  function toast(c, text) { if (c.toast) c.toast(text); }
  function emit(c, kind, n, dx, dy) { if (c.emit) c.emit(kind, (c.x || 0) + (dx || 0), (c.y || 0) + (dy || 0), n || 6); }
  function sfx(c, name) { if (c.sfx) c.sfx(name); }
  function note(c, m) { if (c.note) c.note(m); }
  function fade(c, ms) { return c.fade ? P(c.fade(ms)) : Promise.resolve(); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function chance(p) { return Math.random() < p; }
  function isNight(c) { var h = c.env && c.env.time; return typeof h === 'number' && (h >= 19 || h < 6); }

  // line by visit number: 1st, 2nd, 3rd... then keeps cycling through the later ones
  function step(n, a) { return n < a.length ? a[n] : a[1 + ((n - 1) % (a.length - 1 || 1))] || a[0]; }

  // Hontori sometimes chimes in with a rhyme
  function rhyme(c, lines, p) {
    if (!c.hasSpirit || !chance(p == null ? 0.4 : p)) return Promise.resolve();
    return fox(c, typeof lines === 'string' ? lines : pick(lines));
  }

  function clockText(c) {
    var t = c.env && typeof c.env.time === 'number' ? c.env.time : 12;
    var h = Math.floor(t) % 24, m = Math.floor((t - Math.floor(t)) * 60);
    var ap = h < 12 ? 'am' : 'pm', h12 = h % 12 || 12;
    return h12 + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
  }

  // simple handler: cycling kid lines + optional effect + optional fox rhymes
  function simple(lines, opt) {
    opt = opt || {};
    return function (c, n) {
      if (opt.fx) emit(c, opt.fx, opt.n || 5, 0, opt.dy || 0);
      if (opt.sfx) sfx(c, opt.sfx);
      return kid(c, step(n, lines)).then(function () {
        return opt.fox ? rhyme(c, opt.fox, opt.p) : null;
      });
    };
  }

  var BOOKS = [
    '"Rivers and Rain." The pages smell of the sea.',
    '"A Year of Bread." Mom marked the rye page.',
    '"Old Tales of the Valley." The spine is soft with use.',
    '"Stars for Beginners." A pressed leaf keeps my place.',
    '"Weather Signs." Red sky at night, it says.',
    '"Chimney Care." Dad underlined the soot part.',
    '"Garden Birds." Someone drew a robin in the margin.',
    '"Mom\'s Ramen Notes." Neat loops, very careful.'
  ];
  var PENTA = [60, 62, 64, 67, 69, 72, 74, 76];

  function shakeTree(kindFx, fruit) {
    return function (c, n) {
      sfx(c, 'rustle');
      emit(c, kindFx, 8, 0, -22);
      emit(c, 'dust', 3, 0, -4);
      if (fruit && chance(0.4)) {
        state.apples++;
        sfx(c, 'pickup');
        toast(c, 'An apple fell (' + state.apples + ')');
        return kid(c, 'An apple dropped into my hands.')
          .then(function () { return rhyme(c, 'A gift from the bough, so take it now.'); });
      }
      return kid(c, step(n, [
        'The leaves whisper down around me.',
        'The branches settle again.',
        'A bird watches me from above.'
      ])).then(function () {
        return rhyme(c, ['Leaves drift low, soft and slow.', 'Old trees keep the wind they know.'], 0.3);
      });
    };
  }

  function sleep(c, n, small) {
    return kid(c, step(n, [
      small ? 'My own bed. I could rest a while.' : 'A soft bed. I could rest a while.',
      'A little sleep would be nice.',
      'Time to rest again.'
    ])).then(function () { sfx(c, 'sleep'); return fade(c, 700); })
      .then(function () {
        if (c.setTime) c.setTime(((c.env && c.env.time) || 22) + 8 >= 24 ? (((c.env && c.env.time) || 22) + 8) % 24 : ((c.env && c.env.time) || 22) + 8); // sleeping skips 8 hours
        emit(c, 'sparkle', 6, 0, -8);
        toast(c, 'Eight hours later');
        return c.hasSpirit ? fox(c, pick(['Up with the sun, a new day begun.', 'Rest is done, now out we run.']))
          : kid(c, 'I feel rested.');
      });
  }

  function neighbour(c, n) {
    sfx(c, 'knock');
    return kid(c, step(n, [
      isNight(c) ? 'The lights are out. They must be asleep.' : 'I knock. Nobody answers.',
      'It smells like bread inside.',
      'A curtain moves, then stills.'
    ])).then(function () { return rhyme(c, 'Let them be, and come with me.', 0.3); });
  }

  // ---------- handlers: fn(ctx, visitIndex) -> Promise ----------
  var T = {
    // ===== indoor =====
    fireplace: function (c, n) {
      emit(c, 'ember', 10, 0, -6); sfx(c, 'fire');
      if (!c.hasSpirit) {
        return kid(c, step(n, ['The fire crackles softly.', 'Something stirs in the chimney.', 'The embers glow a little brighter.']));
      }
      emit(c, 'smoke', 4, 0, -20);
      return kid(c, step(n, ['This is where you came from.', 'The fire feels friendlier now.', 'Warm and quiet.']))
        .then(function () {
          return fox(c, step(n, [
            'Through the flue, I came to you.',
            'Ember bright, a door at night.',
            'Where embers glow, home I know.'
          ]));
        });
    },
    bed: function (c, n) { return sleep(c, n, false); },
    kid_bed: function (c, n) { return sleep(c, n, true); },
    piano: function (c, n) {
      var len = 5 + Math.floor(Math.random() * 3), i = 0, at = 2 + Math.floor(Math.random() * 4);
      function next() {
        if (i >= len) return Promise.resolve();
        at = Math.max(0, Math.min(PENTA.length - 1, at + pick([-2, -1, -1, 1, 1, 2])));
        note(c, PENTA[at]);
        emit(c, 'sparkle', 1, (i - len / 2) * 3, -14);
        i++;
        return wait(170).then(next);
      }
      return next().then(function () {
        return kid(c, step(n, ['A small tune of my own.', 'The notes hang in the air.', 'I play it a little slower.']));
      }).then(function () { return rhyme(c, ['A tune so sweet, soft and neat.', 'Play it again, slow at the end.'], 0.5); });
    },
    cat_bed: function (c, n) {
      sfx(c, n % 2 ? 'purr' : 'meow');
      emit(c, 'dust', 2);
      return kid(c, step(n, ['Biscuit purrs and stretches.', 'She opens one eye, then closes it.', 'She is watching the fox.']))
        .then(function () { return rhyme(c, 'Cats can see what others miss. I like this.', 0.5); });
    },
    bookshelf: function (c, n) {
      state.books++;
      sfx(c, 'page');
      emit(c, 'dust', 3, 0, -10);
      return kid(c, pick(BOOKS)).then(function () {
        return rhyme(c, ['Page by page, the young grow sage.', 'Old words keep, like seeds asleep.'], 0.3);
      });
    },
    telescope: function (c, n) {
      emit(c, 'sparkle', 5, 0, -12);
      if (!isNight(c)) return kid(c, step(n, ['Only rooftops by day.', 'The stars will come out tonight.']));
      return kid(c, step(n, ['So many stars tonight.', 'One star looks like a fox.', 'A shooting star. I make a wish.']))
        .then(function () { return rhyme(c, 'Stars burn high, lamps in the sky.'); });
    },
    globe: function (c, n) {
      sfx(c, 'spin'); emit(c, 'sparkle', 3, 0, -8);
      return kid(c, step(n, ['I spin it and it slows on the sea.', 'Our valley is too small to see.', 'The world is so wide.']))
        .then(function () { return rhyme(c, 'The world is wide, with much to find.', 0.35); });
    },
    toybox: function (c, n) {
      sfx(c, 'rattle'); emit(c, 'dust', 3);
      return kid(c, step(n, ['My old wooden dragon.', 'A kite string, all tangled.', 'My teddy, a bit worn.']))
        .then(function () { return rhyme(c, 'Toys of old, stories told.', 0.35); });
    },
    stove: function (c, n) {
      emit(c, 'smoke', 4, 0, -12); sfx(c, 'sizzle');
      return kid(c, step(n, ['Leftover stew, still warm.', 'Something simmers with onions.', 'The pot ticks as it cools.']))
        .then(function () { return rhyme(c, ['A gentle flame, my kind of game.', 'Low and slow, a kindly glow.'], 0.5); });
    },
    sink: function (c, n) {
      sfx(c, 'splash'); emit(c, 'sparkle', 4, 0, -6);
      return kid(c, step(n, ['The tap drips slowly.', 'I wash my hands.', 'Cool water, clear and still.']))
        .then(function () { return rhyme(c, 'Water near? I will stay here.', 0.5); });
    },
    clock: function (c, n) {
      sfx(c, 'tick');
      return kid(c, 'It is ' + clockText(c) + '.')
        .then(function () { return rhyme(c, 'Tick and tock, mind the clock.', 0.3); });
    },
    window: function (c, n) {
      var w = c.env && c.env.weather;
      if (w === 'rain') return kid(c, 'Rain runs down the glass.');
      if (w === 'snow') return kid(c, 'Snow falls softly outside.');
      if (isNight(c)) {
        return kid(c, step(n, ['The moon is bright tonight.', 'A light flickers by the well.', 'The village is asleep.']))
          .then(function () { return rhyme(c, 'Night is deep, the town asleep.', 0.4); });
      }
      return kid(c, step(n, ['The village looks peaceful.', 'Someone walks down the lane.', 'A fine day outside.']));
    },
    wall_map: simple(['A map of the valley.', 'Someone drew a tiny fox in the corner.', 'Grandpa\'s writing runs along the edge.'],
      { fox: 'Roads that wind, paths to find.' }),
    stairs: simple(['My parents are asleep upstairs.', 'The third step creaks.', 'The house is quiet.'],
      { fox: 'Soft and slow, on tiptoe go.', p: 0.5 }),
    chest: function (c, n) {
      sfx(c, 'creak'); emit(c, n ? 'dust' : 'sparkle', 5, 0, -4);
      return kid(c, step(n, ['Folded blankets inside.', 'Still blankets, warm and soft.', 'It smells of cedar.']))
        .then(function () { return rhyme(c, 'Not gold, but warm when cold.', 0.35); });
    },
    table: simple(['A few crumbs on the table.', 'A tiny star is carved underneath.', 'A sturdy old table.']),
    dining_table: simple(['Four chairs, one for a guest.', 'Mom\'s good tablecloth.', 'It still smells like dinner.'],
      { fox: 'A spare seat, warm and neat.', p: 0.5 }),
    chair: simple(['A wooden chair.', 'It wobbles a little.', 'I sit for a moment.']),
    armchair: simple(['Dad\'s chair, still warm.', 'Deep and soft.', 'A good chair for reading.'], { fx: 'dust', n: 2 }),
    sofa: simple(['A soft sofa.', 'The cushions are still dented.', 'I could nap here.'], { fx: 'dust', n: 2 }),
    cupboard: simple(['Plates, cups and the biscuit tin.', 'Everything in its place.', 'It smells of tea.'], { sfx: 'creak' }),
    plant: simple(['A leafy green plant.', 'It grew a new leaf.', 'Mom talks to it every morning.'],
      { fox: 'Leaf and flame, not the same.', p: 0.35 }),
    potted_tree: simple(['A little tree in a pot.', 'One leaf has fallen.', 'It leans toward the light.'], { fx: 'dust', n: 2, dy: -10 }),
    picture: simple(['A painting of the river in autumn.', 'The frame is slightly crooked.', 'The colours are soft and warm.'],
      { fox: 'Paint holds days that slip away.', p: 0.35 }),
    floor_lamp: function (c, n) {
      sfx(c, 'click'); emit(c, 'sparkle', 3, 0, -18);
      return kid(c, step(n, ['A cosy little glow.', 'A moth circles the light.', 'Click. Off again.']))
        .then(function () { return rhyme(c, 'A tiny light, steady and bright.', 0.4); });
    },
    desk: simple(['My homework waits here.', 'A drawing of a fox, from before I met one.', 'Pencils and paper.']),
    wardrobe: function (c, n) {
      sfx(c, 'creak');
      return kid(c, step(n, ['Coats and scarves.', 'Just wood at the back.', 'It smells of lavender.']))
        .then(function () { return rhyme(c, 'Coats in a row, warm for snow.', 0.4); });
    },
    dresser: simple(['Socks and shirts.', 'One drawer always sticks.', 'My lucky button is here.'], { sfx: 'creak' }),
    counter: simple(['Flour on the counter.', 'A bowl of plums.', 'Fresh bread cooling.']),
    firewood: function (c, n) {
      emit(c, 'dust', 3);
      return kid(c, step(n, ['Neatly stacked logs.', 'A beetle lives in this one.', 'It smells like the forest.']))
        .then(function () { return rhyme(c, ['Oak burns slow, a steady glow.', 'Logs in a stack, warmth to come back.'], 0.6); });
    },
    candles: function (c, n) {
      emit(c, 'ember', 3, 0, -8);
      return kid(c, step(n, ['The flames lean when I breathe.', 'Warm, wavering light.', 'Wax drips slowly.']))
        .then(function () { return rhyme(c, 'Small and bright, kin of mine tonight.', 0.5); });
    },
    coat_rack: simple(['My coat and Dad\'s hat.', 'Mom\'s long scarf.', 'A single mitten.']),
    doormat: simple(['It says "Welcome".', 'I wipe my feet.', 'A little dusty.'], { fx: 'dust', n: 2 }),
    hanging_pots: function (c, n) {
      sfx(c, 'clang'); note(c, pick([72, 76, 79])); emit(c, 'sparkle', 2, 0, -10);
      return kid(c, step(n, ['The pots chime softly.', 'The big pot is for ramen night.', 'The ladle swings.']));
    },
    wall_shelf: simple(['Jars of jam, labelled by Mom.', 'A small carved owl.', 'Too high to reach.']),
    garland: simple(['Dried flowers from last summer.', 'They still smell of June.', 'A petal falls.'], { fx: 'sparkle', n: 3, dy: -8 }),
    herb_rack: simple(['Thyme and sage, drying.', 'They smell sharp and green.', 'Mom says herbs are slow magic.'],
      { fx: 'dust', n: 2, fox: 'Leaf and steam, a quiet dream.', p: 0.5 }),
    laundry_basket: simple(['Clean socks, warm from the line.', 'Folded shirts.', 'It smells of soap.'],
      { fox: 'Warm and deep, a place to sleep.', p: 0.4 }),

    // ===== outdoor =====
    tree: shakeTree('dust', false),
    pine: function (c, n) {
      sfx(c, 'rustle'); emit(c, 'dust', 5, 0, -20);
      return kid(c, step(n, ['Pine needles drift down.', 'A pinecone falls nearby.', 'It smells of winter.']))
        .then(function () { return rhyme(c, 'Needles fine, sweet with pine.', 0.3); });
    },
    fruit_tree: shakeTree('dust', true),
    cherry_tree: function (c, n) {
      sfx(c, 'rustle'); emit(c, 'sparkle', 10, 0, -22); emit(c, 'magic', 3, 0, -18);
      return kid(c, step(n, ['Pink petals fall like snow.', 'A petal lands on my nose.', 'I could stay here all day.']))
        .then(function () { return rhyme(c, 'Petals fall without a sound.', 0.4); });
    },
    bush: function (c, n) {
      sfx(c, 'rustle'); emit(c, 'dust', 4);
      return kid(c, step(n, ['The bush rustles.', 'Something small runs off.', 'A few berries grow here.']))
        .then(function () { return rhyme(c, 'Something small, gone, that is all.', 0.3); });
    },
    butterfly_bush: simple(['Butterflies everywhere.', 'They scatter and drift back.', 'Purple flowers, full of wings.'],
      { fx: 'magic', n: 6, dy: -8, fox: 'Flutter by, on breezes high.', p: 0.35 }),
    fence_h: simple(['A wooden fence.', 'Freshly painted.', 'Good for leaning on.']),
    fence_v: simple(['A fence post with a snail on it.', 'The snail has moved a little.', 'Slow and steady.']),
    stone_wall_h: simple(['Old stones, soft with moss.', 'A lizard rests in a crack.', 'This wall is very old.'],
      { fox: 'Stone on stone, old as bone.', p: 0.35 }),
    lamp: function (c, n) {
      emit(c, isNight(c) ? 'ember' : 'sparkle', 4, 0, -24);
      return kid(c, isNight(c)
        ? step(n, ['A warm circle of light.', 'It hums softly.', 'Moths dance around it.'])
        : step(n, ['A street lamp, waiting for dusk.', 'The glass is clean.', 'Someone lights these every evening.']))
        .then(function () { return rhyme(c, 'One small light against the night.', 0.4); });
    },
    lantern_string: simple(['Paper lanterns sway in the breeze.', 'One has a fox painted on it.', 'Left from the festival.'],
      { fx: 'sparkle', n: 5, dy: -14, fox: 'Lanterns glow, row on row.', p: 0.5 }),
    mailbox: function (c, n) {
      sfx(c, 'creak');
      return kid(c, step(n, ['It is empty.', 'A ladybird lives inside.', 'Nothing today.']))
        .then(function () { return rhyme(c, 'Words that roam will find their home.', 0.35); });
    },
    sign: function (c, n) {
      var o = c.object || {};
      var text = o.text || o.label || o.msg;
      if (text) return (c.say ? P(c.say('sign', 'Sign', String(text))) : Promise.resolve());
      return kid(c, step(n, ['"Emberbrook. Mind the geese."', 'The paint is flaking.']));
    },
    rock: simple(['A smooth grey rock.', 'Warm from the sun.', 'It has not moved.'],
      { fox: 'Rocks sit still, on every hill.', p: 0.3 }),
    well: function (c, n) {
      sfx(c, 'splash'); emit(c, 'sparkle', 6, 0, -6);
      state.coins++;
      return kid(c, step(n, ['I listen to the water far below.', 'My voice echoes back.', 'The water is cool and deep.']))
        .then(function () { return rhyme(c, ['Deep and cold, the water old.', 'Make a wish, soft as a fish.'], 0.45); });
    },
    flowerbed: simple(['Tulips in a tidy row.', 'A bee is busy here.', 'They smell sweet.'], { fx: 'sparkle', n: 3 }),
    flower_patch: simple(['Wildflowers grow here.', 'They nod in the wind.', 'Blue, white and yellow.'],
      { fx: 'sparkle', n: 3, fox: 'Wild and free, as flowers be.', p: 0.3 }),
    garden_bed: simple(['Carrot tops in a row.', 'A worm wriggles past.', 'Fresh lettuce.'], { fx: 'dust', n: 2 }),
    bench: simple(['A quiet bench.', 'Initials are carved into it.', 'I sit and watch the clouds.'],
      { fox: 'Rest a while, then on we go.', p: 0.35 }),
    barrel: function (c, n) {
      sfx(c, 'knock');
      return kid(c, step(n, ['It sounds full.', 'It smells of pickles.', 'Sealed tight.']));
    },
    crate: simple(['A crate marked "Fragile".', 'Something clinks inside.', 'Stamped with the market seal.'], { sfx: 'knock' }),
    mushroom_ring: function (c, n) {
      emit(c, 'magic', 8); sfx(c, 'chime');
      return kid(c, step(n, ['A ring of mushrooms. The air tingles.', 'My hair stands up a little.', 'They glow faintly.']))
        .then(function () { return rhyme(c, 'A ring of old, where spirits hold.', 0.6); });
    },
    lilypad: simple(['A lily pad on the water.', 'A frog sits on it.', 'It bobs gently.'], { fx: 'sparkle', n: 3, sfx: 'splash' }),
    reeds: simple(['Reeds whisper together.', 'A dragonfly rests on one.', 'They sway in the breeze.'], { fx: 'dust', n: 2 }),
    stepping_stone: simple(['I hop across.', 'A little wobbly.', 'Slippery after rain.'], { fx: 'dust', n: 2 }),
    hay_bale: function (c, n) {
      emit(c, 'dust', 6); sfx(c, 'rustle');
      return kid(c, step(n, ['Soft, scratchy hay.', 'Hay in my hair.', 'It smells of summer.']))
        .then(function () { return rhyme(c, 'Hay is dry, I pass it by.', 0.6); });
    },
    cart: simple(['A cart with a squeaky wheel.', 'Full of turnips.', 'Waiting for the market.'],
      { fox: 'Wheels that turn, roads to learn.', p: 0.3 }),
    market_stall: function (c, n) {
      emit(c, 'sparkle', 3, 0, -10);
      return kid(c, step(n, ['Apples, honey and cheese.', 'Everything looks fresh.', 'The stall keeper smiles.']))
        .then(function () { return rhyme(c, 'Sweet and bright, a market sight.', 0.45); });
    },
    laundry_line: simple(['Shirts dance on the line.', 'A sheet flaps in the wind.', 'Drying in the sun.'],
      { fx: 'dust', n: 2, dy: -12, fox: 'Cloth that sways, on breezy days.', p: 0.4 }),
    windchime: function (c, n) {
      var a = [79, 76, 72, 81, 74], i = 0;
      function next() { if (i >= 4) return Promise.resolve(); note(c, pick(a)); emit(c, 'sparkle', 1, 0, -16); i++; return wait(140).then(next); }
      return next().then(function () {
        return kid(c, step(n, ['The chimes ring softly.', 'A different tune each time.', 'The wind plays them.']));
      }).then(function () { return rhyme(c, 'Wind will play, come what may.', 0.4); });
    },
    birdbath: function (c, n) {
      sfx(c, 'splash'); emit(c, 'sparkle', 5, 0, -10);
      return kid(c, step(n, ['A sparrow takes a bath.', 'Water splashes my sleeve.', 'The sparrow flies away.']))
        .then(function () { return rhyme(c, 'Little wings, little things.', 0.4); });
    },
    statue: function (c, n) {
      emit(c, c.hasSpirit ? 'magic' : 'dust', 6, 0, -16);
      return kid(c, step(n, ['A stone figure with a fox at its feet.', 'The plaque is too worn to read.', 'Moss covers one shoulder.', 'The stone fox seems to smile.']))
        .then(function () {
          if (!c.hasSpirit) return null;
          return fox(c, step(n, [
            'She saw us clear, long ago here.',
            'Stone remembers, like old embers.',
            'Kind and true, she knew us too.',
            'A fox of stone, not alone.'
          ]));
        });
    },
    pumpkin: function (c, n) {
      sfx(c, 'knock'); emit(c, 'dust', 2);
      return kid(c, step(n, ['A ripe pumpkin.', 'Bigger than my head.', 'It thumps when I knock.']))
        .then(function () { return rhyme(c, 'Orange and round, it grew from the ground.', 0.5); });
    },
    log_pile: simple(['Logs drying for winter.', 'Woodlice live underneath.', 'Neatly stacked.'],
      { fx: 'dust', n: 3, fox: 'Dry and stacked, warmth is packed.', p: 0.5 }),

    // ===== buildings =====
    house_player: function (c, n) {
      emit(c, 'smoke', 3, 0, -40);
      return kid(c, step(n, ['Home. The chimney is smoking.', 'My window is the one with the kite.', 'It smells like soup.']))
        .then(function () { return rhyme(c, 'Hearth and home, where I came alone.', 0.5); });
    },
    house_a: neighbour,
    tavern: function (c, n) {
      emit(c, 'smoke', 4, 0, -20); sfx(c, 'sizzle');
      return kid(c, step(n, ['The smell of ramen drifts out.', 'Warm light in the windows.', 'Someone laughs inside.']))
        .then(function () { return rhyme(c, ['Broth so warm, shelter from storm.', 'Steam and light, rest tonight.'], 0.6); });
    },
    shop: function (c, n) {
      sfx(c, 'bell'); emit(c, 'sparkle', 3, 0, -12);
      return kid(c, step(n, ['Bottles and backpacks in the window.', 'A blue bottle bubbles by itself.', 'The bell above the door rings.']))
        .then(function () { return rhyme(c, 'Jars that gleam, more than they seem.', 0.45); });
    },
    school: function (c, n) {
      sfx(c, 'locked'); emit(c, 'magic', 6, 0, -20);
      return kid(c, step(n, ['The door is locked.', 'A crest glows above the door.', 'Still locked.']))
        .then(function () {
          if (!c.hasSpirit) return null;
          return fox(c, step(n, [
            'A door of old, its secrets hold.',
            'Not yet, not now, wait and see how.',
            'Patience, friend, it opens in the end.'
          ]));
        });
    }
  };
  // aliases for likely variants
  var ALIAS = { house_b: 'house_a', house_c: 'house_a', house: 'house_a', fence: 'fence_h', stone_wall_v: 'stone_wall_h',
    lantern: 'lamp', flowers: 'flower_patch', inn: 'tavern', store: 'shop' };

  function resolve(type) { return T[type] ? type : (ALIAS[type] && T[ALIAS[type]] ? ALIAS[type] : null); }

  function generic(type) {
    var name = String(type == null ? 'thing' : type).replace(/_/g, ' ');
    var an = /^[aeiou]/i.test(name) ? 'An ' : 'A ';
    return function (c, n) {
      emit(c, 'dust', 2);
      return kid(c, step(n, [an + name + '.', 'Just ' + an.toLowerCase() + name + '.']));
    };
  }

  H.interact = {
    has: function (type) { return !!resolve(type); },
    run: function (type, ctx) {
      ctx = ctx || {};
      var key = resolve(type), fn = key ? T[key] : generic(type);
      var id = key || ('?' + type);
      var n = visits[id] || 0;
      visits[id] = n + 1;
      try { return P(fn(ctx, n)).catch(function (e) { if (typeof console !== 'undefined') console.warn('interact', type, e); }); }
      catch (e) { if (typeof console !== 'undefined') console.warn('interact', type, e); return Promise.resolve(); }
    },
    types: function () { return Object.keys(T); },
    reset: function () { visits = {}; state.coins = 0; state.apples = 0; state.books = 0; }
  };
})();
