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
    '"Tides and Tempers: A Water Primer."',
    '"Never Sneeze Near a Fire Spirit."',
    '"Wind: It Was Here a Second Ago."',
    '"Grass Grows Back. So Can You."',
    '"Electric Spirits and Other Shocks."',
    '"Earth: The Patient Element."',
    '"Dark Is Not the Same as Bad."',
    '"Light, and Where It Hides at Night."',
    '"Eight Elements, One Very Tired Author."',
    '"Chimney Care for Beginners." Huh.',
    '"Things the Veilbound Walk Past."',
    '"Mom\'s Ramen Notes." Top secret.'
  ];
  var PENTA = [60, 62, 64, 67, 69, 72, 74, 76];

  function shakeTree(kindFx, leafWord, fruit) {
    return function (c, n) {
      sfx(c, 'rustle');
      emit(c, kindFx, 8, 0, -22);
      emit(c, 'dust', 3, 0, -4);
      if (fruit && chance(0.4)) {
        state.apples++;
        sfx(c, 'pickup');
        toast(c, 'An apple fell! (' + state.apples + ')');
        return kid(c, state.apples > 3 ? 'Apple number ' + state.apples + '. I have a problem.' : 'Bonk. Free apple!')
          .then(function () { return rhyme(c, 'Fruit from a tree? Roast one for me!'); });
      }
      return kid(c, step(n, [
        'I shook it. ' + leafWord + ' everywhere.',
        'Still a tree. Still shedding.',
        'A bird just gave me a look.',
        'Sorry, tree. Last shake. Maybe.'
      ])).then(function () {
        return rhyme(c, ['Leaves in my fur. I do not concur.', 'Trees keep secrets under bark, and whisper them after dark.'], 0.3);
      });
    };
  }

  function sleep(c, n, small) {
    return kid(c, step(n, [
      small ? 'My bed. Lumpy in a good way.' : 'A big soft bed. Just a quick nap...',
      'Five more minutes. Or all night.',
      'Sleeping again? Adventuring is tiring.'
    ])).then(function () { sfx(c, 'sleep'); return fade(c, 700); })
      .then(function () {
        if (c.setTime) c.setTime(((c.env && c.env.time) || 22) + 8 >= 24 ? (((c.env && c.env.time) || 22) + 8) % 24 : ((c.env && c.env.time) || 22) + 8); // sleeping skips 8 hours
        emit(c, 'sparkle', 6, 0, -8);
        toast(c, 'Morning. 7:00 am.');
        return c.hasSpirit ? fox(c, pick(['Up with the sun, the day has begun!', 'You snore like a kettle. I mean that well.']))
          : kid(c, 'Morning already? Okay. I am up.');
      });
  }

  function neighbour(c, n) {
    sfx(c, 'knock');
    return kid(c, step(n, [
      isNight(c) ? 'Lights on, door shut. Bedtime in there.' : 'Knock knock. Nobody answers.',
      'It smells like someone is baking inside.',
      'A curtain twitched. I saw that!',
      'Their doormat says "Wipe Your Paws".'
    ])).then(function () { return rhyme(c, 'Knock too much and they will know. Quiet feet!', 0.3); });
  }

  // ---------- handlers: fn(ctx, visitIndex) -> Promise ----------
  var T = {
    // ===== indoor =====
    fireplace: function (c, n) {
      emit(c, 'ember', 10, 0, -6); sfx(c, 'fire');
      if (!c.hasSpirit) {
        return kid(c, step(n, ['Warm. The fire crackles like it is chatting.', 'Did the chimney just... cough?', 'Something is rustling up there.']));
      }
      emit(c, 'smoke', 4, 0, -20);
      return kid(c, step(n, ['So you were living in THERE?', 'It is just a fireplace again. Sort of.', 'Mom thinks the draught is noisy.']))
        .then(function () {
          return fox(c, step(n, [
            'Snug and sooty, warm and bright. Best front door at night.',
            'Mind the ash, it stains the paw. Achoo.',
            'Home is where the embers glow.'
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
        return kid(c, step(n, ['I made that up. Not bad!', 'Dad calls it "jazz". Kindly.', 'One day I will use both hands.', 'The cat left the room. Rude.']));
      }).then(function () { return rhyme(c, ['A tune so sweet it warms my feet.', 'Play it again, I will hum the end.'], 0.5); });
    },
    cat_bed: function (c, n) {
      sfx(c, n % 2 ? 'purr' : 'meow');
      emit(c, 'dust', 2);
      return kid(c, step(n, ['Meow to you too, Biscuit.', 'Purring. The engine is running.', 'She is pretending I am not here.', 'One eye open. She is watching the fox.']))
        .then(function () { return rhyme(c, 'Cats see me plain as day. Never Veilbound, anyway.', 0.5); });
    },
    bookshelf: function (c, n) {
      state.books++;
      sfx(c, 'page');
      emit(c, 'dust', 3, 0, -10);
      return kid(c, pick(BOOKS)).then(function () {
        return rhyme(c, ['Eight elements in a row. Fire is best, just so you know.', 'Read every page and you will be a sage.'], 0.3);
      });
    },
    telescope: function (c, n) {
      emit(c, 'sparkle', 5, 0, -12);
      if (!isNight(c)) return kid(c, step(n, ['Daytime. I can see the baker\'s roof.', 'A bird is staring back at me.', 'Stars are shy until dark.']));
      return kid(c, step(n, ['So many stars. One just winked.', 'That constellation looks like a fox.', 'A shooting star! Wish made. Not telling.']))
        .then(function () { return rhyme(c, 'Every star is a spirit\'s lamp, hung above the damp.'); });
    },
    globe: function (c, n) {
      sfx(c, 'spin'); emit(c, 'sparkle', 3, 0, -8);
      return kid(c, step(n, ['Spin... and my finger lands on ocean.', 'Emberbrook is not even on here.', 'Spin again. Ocean again. Big ocean.', 'Somewhere out there is the other seven.']))
        .then(function () { return rhyme(c, 'The world is wide, with spirits on every side.', 0.35); });
    },
    toybox: function (c, n) {
      sfx(c, 'rattle'); emit(c, 'dust', 3);
      return kid(c, step(n, ['My old wooden dragon. Still fierce.', 'A sock. Why is there a sock?', 'A kite string, hopelessly knotted.', 'The teddy has seen things.']))
        .then(function () { return rhyme(c, 'Toys are grand. A real fox is grander.', 0.35); });
    },
    stove: function (c, n) {
      emit(c, 'smoke', 4, 0, -12); sfx(c, 'sizzle');
      return kid(c, step(n, ['Leftover stew. Still warm.', 'I am not allowed to cook alone. Yet.', 'Something is bubbling. Smells like onions.']))
        .then(function () { return rhyme(c, ['Need a flame? You know my name.', 'A stove is a fireplace that went to school.'], 0.5); });
    },
    sink: function (c, n) {
      sfx(c, 'splash'); emit(c, 'sparkle', 4, 0, -6);
      return kid(c, step(n, ['Drip. Drip. Drip. Dad will fix it "soon".', 'I washed my hands. Mostly.', 'One spoon in there. Not mine.']))
        .then(function () { return rhyme(c, 'Water, no! Wet fur is my greatest woe.', 0.5); });
    },
    clock: function (c, n) {
      sfx(c, 'tick');
      return kid(c, step(n, ['Tick tock. It is ' + clockText(c) + '.', 'Still ' + clockText(c) + '. Roughly.', clockText(c) + '. The cuckoo retired years ago.']))
        .then(function () { return rhyme(c, 'Tick and tock, do not just stand. Wand in hand!', 0.3); });
    },
    window: function (c, n) {
      var w = c.env && c.env.weather;
      if (w === 'rain') return kid(c, 'Rain racing down the glass. Left drop wins.');
      if (w === 'snow') return kid(c, 'Snow! I breathed a circle on the glass.');
      if (isNight(c)) {
        return kid(c, step(n, ['The moon is huge tonight.', 'A light flickered out by the well.', 'My reflection looks sleepy.']))
          .then(function () { return rhyme(c, 'Past the glass the veil is thin. Magic wants in.', 0.4); });
      }
      return kid(c, step(n, ['Emberbrook looks tiny from in here.', 'Someone is chasing a hat down the lane.', 'Nice day. Why am I inside?']));
    },
    wall_map: simple(['A map of the valley. Emberbrook is the dot.', 'Someone drew a tiny fox in the corner.', '"Here be spirits," in Grandpa\'s writing.'],
      { fox: 'Maps show roads. Hidden paths are best.' }),
    stairs: simple(['Shh. My parents are asleep upstairs.', 'Third step creaks. I am not risking it.', 'Dad is snoring. The house is safe.'],
      { fox: 'Tiptoe, not a peep. Let the Veilbound sleep.', p: 0.5 }),
    chest: function (c, n) {
      sfx(c, 'creak'); emit(c, n ? 'dust' : 'sparkle', 5, 0, -4);
      return kid(c, step(n, ['Blankets, and one very old cookie.', 'Still blankets. The cookie is gone now.', 'Empty, apart from the cosy smell.']))
        .then(function () { return rhyme(c, 'No gold? Do not frown. Treasure is rarely nailed down.', 0.35); });
    },
    table: simple(['Crumbs. Evidence of a midnight snack.', 'Somebody carved a tiny star underneath.', 'Sturdy table. Good fort material.']),
    dining_table: simple(['Four chairs, three people. One for a guest.', 'Mom\'s good tablecloth. Hands off.', 'I can still smell dinner.'],
      { fox: 'A spare chair? I declare it mine.', p: 0.5 }),
    chair: simple(['A chair. It wobbles on purpose.', 'I sat. I stood. Adventure!', 'This one squeaks in B flat.']),
    armchair: simple(['Dad\'s chair. Still warm.', 'It swallows me whole. Help.', 'Found a coin in the cushion! Gone again.'], { fx: 'dust', n: 2 }),
    sofa: simple(['Squishy. Dangerously nappable.', 'The cushion fort was here last week.', 'I lost a marble in there in spring.'], { fx: 'dust', n: 2 }),
    cupboard: simple(['Plates, cups, and the hidden biscuit tin.', 'The biscuit tin is suspiciously light.', 'I was never here.'], { sfx: 'creak' }),
    plant: simple(['Hello, plant. Looking leafy.', 'I think it grew since yesterday.', 'Mom talks to it. It seems to work.'],
      { fox: 'Green friend, I keep away. Ferns and fire do not play.', p: 0.35 }),
    potted_tree: simple(['A tree with a house of its own.', 'One leaf fell. I put it back.', 'It wants to be a forest someday.'], { fx: 'dust', n: 2, dy: -10 }),
    picture: simple(['A painting of the river in autumn.', 'The frame is crooked. Now it is worse.', 'Did the painted boat just move?'],
      { fox: 'Painters catch what eyes forget.', p: 0.35 }),
    floor_lamp: function (c, n) {
      sfx(c, 'click'); emit(c, 'sparkle', 3, 0, -18);
      return kid(c, step(n, ['Click. A cosy little glow.', 'A moth is doing laps around it.', 'Click click. Okay, I will stop.']))
        .then(function () { return rhyme(c, 'A flame in a jar? How bizarre.', 0.4); });
    },
    desk: simple(['Homework. I will pretend I did not see it.', 'A doodle of a fox. Before I met one!', 'My pencil is chewed. By me.']),
    wardrobe: function (c, n) {
      sfx(c, 'creak');
      return kid(c, step(n, ['Coats, scarves, no secret kingdom.', 'I checked the back again. Just wood.', 'It smells like lavender and winter.']))
        .then(function () { return rhyme(c, 'No hidden door? What a bore.', 0.4); });
    },
    dresser: simple(['Socks, sorted by nobody.', 'One drawer always sticks. That one.', 'Found my lucky button!'], { sfx: 'creak' }),
    counter: simple(['Flour everywhere. Somebody baked.', 'A bowl of plums. One fewer now.', 'The bread knife. Not touching that.']),
    firewood: function (c, n) {
      emit(c, 'dust', 3);
      return kid(c, step(n, ['Neatly stacked logs. Dad is proud.', 'A beetle lives in this one.', 'Smells like the forest.']))
        .then(function () { return rhyme(c, ['Snacks! I mean, logs. Stacks of logs.', 'Oak burns slow, pine burns bright. Birch for a chilly night.'], 0.6); });
    },
    candles: function (c, n) {
      emit(c, 'ember', 3, 0, -8);
      return kid(c, step(n, ['The flames lean when I breathe.', 'Wax drip shaped like a tiny hat.', 'Warm, wobbly light.']))
        .then(function () { return rhyme(c, 'Small cousins of mine, see how they shine.', 0.5); });
    },
    coat_rack: simple(['My coat, Dad\'s hat, Mom\'s endless scarf.', 'I tried on Dad\'s hat. Cannot see.', 'A mitten with no partner. Tragic.']),
    doormat: simple(['"Welcome." It means it.', 'I wiped my feet. Twice, even.', 'The spare key is NOT under here.'], { fx: 'dust', n: 2 }),
    hanging_pots: function (c, n) {
      sfx(c, 'clang'); note(c, pick([72, 76, 79])); emit(c, 'sparkle', 2, 0, -10);
      return kid(c, step(n, ['Clang! Sorry. Sorry.', 'The big pot is ramen night\'s pot.', 'I bonked the ladle. It swings.']));
    },
    wall_shelf: simple(['Jars of jam, labelled in Mom\'s loops.', 'A tiny carved owl. It judges.', 'Too high. I will grow.']),
    garland: simple(['Dried flowers from last summer.', 'It still smells a bit like June.', 'One petal fell. Make a wish.'], { fx: 'sparkle', n: 3, dy: -8 }),
    herb_rack: simple(['Thyme, sage, and something sneezy.', 'Achoo. Found the sneezy one.', 'Mom says herbs are slow magic.'],
      { fx: 'dust', n: 2, fox: 'She cannot see, yet she is right. Tea is magic, brewed light.', p: 0.5 }),
    laundry_basket: simple(['Clean socks. Warm from the line.', 'I am not folding these. Not today.', 'Is that my missing mitten? No.'],
      { fox: 'A warm basket? I call the nap.', p: 0.4 }),

    // ===== outdoor =====
    tree: shakeTree('dust', 'Leaves', false),
    pine: function (c, n) {
      sfx(c, 'rustle'); emit(c, 'dust', 5, 0, -20);
      return kid(c, step(n, ['Pine needles down my collar. Great.', 'A pinecone bonked my head.', 'Smells like winter holidays.']))
        .then(function () { return rhyme(c, 'Pine sap pops and pine sap spits. Mind your mitts.', 0.3); });
    },
    fruit_tree: shakeTree('dust', 'Leaves', true),
    cherry_tree: function (c, n) {
      sfx(c, 'rustle'); emit(c, 'sparkle', 10, 0, -22); emit(c, 'magic', 3, 0, -18);
      return kid(c, step(n, ['Petals! It is snowing pink.', 'A petal landed on my nose.', 'I could stand here all day.']))
        .then(function () { return rhyme(c, 'Pink on the ground, a spell with no sound.', 0.4); });
    },
    bush: function (c, n) {
      sfx(c, 'rustle'); emit(c, 'dust', 4);
      return kid(c, step(n, ['Rustle rustle. Just a bush.', 'Something small scurried out!', 'Found a berry. Not eating it.']))
        .then(function () { return rhyme(c, 'Something ran! Catch a grass sprite if you can.', 0.3); });
    },
    butterfly_bush: simple(['Butterflies everywhere. One on my scarf!', 'They scatter, then drift right back.', 'Purple flowers, loud with wings.'],
      { fx: 'magic', n: 6, dy: -8, fox: 'Flutter by, butterfly. Not on my tail!', p: 0.35 }),
    fence_h: simple(['A fence. Good for leaning.', 'Freshly painted. Now so is my hand.', 'I could hop it. I will not.']),
    fence_v: simple(['A fence post with a snail commuter.', 'The snail has moved one plank.', 'Go, snail, go.']),
    stone_wall_h: simple(['Old stones, soft with moss.', 'A lizard lives in this crack.', 'Older than the village, Grandpa says.'],
      { fox: 'Earth spirits stack stones so. Ask the wall, it will know.', p: 0.35 }),
    lamp: function (c, n) {
      emit(c, isNight(c) ? 'ember' : 'sparkle', 4, 0, -24);
      return kid(c, isNight(c)
        ? step(n, ['A warm circle of light. Moths approve.', 'It hums a little. Cosy.', 'My shadow has three heads here.'])
        : step(n, ['A street lamp. Asleep until dusk.', 'I can see my face in the glass.', 'Old Tam lights these every evening.']))
        .then(function () { return rhyme(c, 'One lamp against the dark. Great fires start as a spark.', 0.4); });
    },
    lantern_string: simple(['Paper lanterns, bobbing in the breeze.', 'One has a fox painted on it!', 'Festival leftovers. Nobody minds.'],
      { fx: 'sparkle', n: 5, dy: -14, fox: 'That fox looks like me. Handsome, you agree?', p: 0.5 }),
    mailbox: function (c, n) {
      sfx(c, 'creak');
      return kid(c, step(n, ['One letter: "You may have won a goat."', 'Empty. The goat people gave up.', 'A ladybird is renting it now.']))
        .then(function () { return rhyme(c, 'Spirits post by breeze. No stamp, just a sneeze.', 0.35); });
    },
    sign: function (c, n) {
      var o = c.object || {};
      var text = o.text || o.label || o.msg;
      if (text) return (c.say ? P(c.say('sign', 'Sign', String(text))) : Promise.resolve());
      return kid(c, step(n, ['"Emberbrook. Mind the geese."', 'Someone added "and the puddles".', 'The paint is flaking. Still true.']));
    },
    rock: simple(['A rock. Solid. Dependable.', 'I named it Gerald.', 'Gerald has not moved. Good rock.'],
      { fox: 'Rocks are earth at rest. Do not poke. That is the test.', p: 0.3 }),
    well: function (c, n) {
      sfx(c, 'splash'); emit(c, 'sparkle', 6, 0, -6);
      state.coins++;
      toast(c, 'Plink. Wish number ' + state.coins + '.');
      return kid(c, step(n, ['I dropped a coin in. Wish made.', 'Another coin. The well is getting rich.', 'Hello! ...ello ...ello. It answered.', 'I am out of coins. That was a button.']))
        .then(function () { return rhyme(c, ['A water door. Otters know what wells are for.', 'Wish for ramen. Wish for more.'], 0.45); });
    },
    flowerbed: simple(['Tulips in a tidy row.', 'A bee is busy. I will not interrupt.', 'I only smelled them. Promise.'], { fx: 'sparkle', n: 3 }),
    flower_patch: simple(['Wildflowers. Nobody planted these.', 'I picked one for Mom.', 'They nod when the wind passes.'],
      { fx: 'sparkle', n: 3, fox: 'Wild things grow where nobody looks. Like magic.', p: 0.3 }),
    garden_bed: simple(['Carrots. Just the tops, for now.', 'A worm waved. I think.', 'Do not step on the lettuce.'], { fx: 'dust', n: 2 }),
    bench: simple(['A good bench for doing nothing.', 'Carved here: "T + M". Ooh.', 'I sat a while. The clouds moved.'],
      { fox: 'Sit and stay. Spirits pass this way.', p: 0.35 }),
    barrel: function (c, n) {
      sfx(c, 'knock');
      return kid(c, step(n, ['Knock knock. Sounds full. Pickles?', 'Definitely pickles.', 'I am not opening it. Pickle fumes.']));
    },
    crate: simple(['A crate marked "FRAGILE". I tiptoe.', 'It clinks. Bottles, probably.', 'Stamped: Emberbrook Market.'], { sfx: 'knock' }),
    mushroom_ring: function (c, n) {
      emit(c, 'magic', 8); sfx(c, 'chime');
      return kid(c, step(n, ['A ring of mushrooms. Feels tingly.', 'I stepped inside. My hair stood up.', 'They glow a little if I squint.']))
        .then(function () { return rhyme(c, 'A spirit ring. Mind your manners, show your face.', 0.6); });
    },
    lilypad: simple(['A lily pad. A frog\'s front porch.', 'Ribbit. The owner is home.', 'It bobs when I poke the water.'], { fx: 'sparkle', n: 3, sfx: 'splash' }),
    reeds: simple(['Reeds, whispering to each other.', 'A dragonfly parked on one.', 'Good for hide and seek. Bad for socks.'], { fx: 'dust', n: 2 }),
    stepping_stone: simple(['Hop. Made it.', 'Hop. Wobble. Made it.', 'These are slippery after rain.'], { fx: 'dust', n: 2 }),
    hay_bale: function (c, n) {
      emit(c, 'dust', 6); sfx(c, 'rustle');
      return kid(c, step(n, ['I jumped on it. Scratchy but bouncy.', 'Hay in my hair. Hay in my scarf.', 'Achoo! Okay, last jump.']))
        .then(function () { return rhyme(c, 'Hay is dry and I am fire. Moving on!', 0.6); });
    },
    cart: simple(['A cart with one squeaky wheel.', 'Full of turnips. So many turnips.', 'I pushed it. It did not care.'],
      { fox: 'Turnips by the heap. Not one worth a peep.', p: 0.3 }),
    market_stall: function (c, n) {
      emit(c, 'sparkle', 3, 0, -10);
      return kid(c, step(n, ['Apples, honey, and one odd cheese.', '"No refunds on the odd cheese."', 'I have exactly zero coins. Browsing.', 'Free sample! It was the odd cheese.']))
        .then(function () { return rhyme(c, 'Buy me a bun, I will pay you back. Someday. In ash.', 0.45); });
    },
    laundry_line: simple(['Shirts dancing on the line.', 'Somebody\'s spotty bloomers. I saw nothing.', 'A sheet slapped me. Fair.'],
      { fx: 'dust', n: 2, dy: -12, fox: 'I keep back from sheets. Scorch marks are not neat.', p: 0.4 }),
    windchime: function (c, n) {
      var a = [79, 76, 72, 81, 74], i = 0;
      function next() { if (i >= 4) return Promise.resolve(); note(c, pick(a)); emit(c, 'sparkle', 1, 0, -16); i++; return wait(140).then(next); }
      return next().then(function () {
        return kid(c, step(n, ['Ting, ting. The wind is home.', 'It plays a different tune every time.', 'I gave it a push. Cheating.']));
      }).then(function () { return rhyme(c, 'No breeze, that. A wind sprite, playing.', 0.4); });
    },
    birdbath: function (c, n) {
      sfx(c, 'splash'); emit(c, 'sparkle', 5, 0, -10);
      return kid(c, step(n, ['A sparrow is having a serious bath.', 'It splashed me! On purpose!', 'The sparrow left. The water is mine.']))
        .then(function () { return rhyme(c, 'A bath? How brave. I wash with ash.', 0.4); });
    },
    statue: function (c, n) {
      emit(c, c.hasSpirit ? 'magic' : 'dust', 6, 0, -16);
      return kid(c, step(n, ['A stone figure with a fox at its feet.', 'The plaque is worn: "...and the Eight".', 'Moss on its shoulder, like a little cape.', 'I think the stone fox is smiling.']))
        .then(function () {
          if (!c.hasSpirit) return null;
          return fox(c, step(n, [
            'First to lift the veil. We spirits tell her tale.',
            'Eight we were and eight we stay.',
            'Spark, stone, dark, light. Count to eight, you have it right.',
            'That fox is my great-great-gran. Same nose. Same plan.'
          ]));
        });
    },
    pumpkin: function (c, n) {
      sfx(c, 'knock'); emit(c, 'dust', 2);
      return kid(c, step(n, ['Thump. A good ripe pumpkin.', 'Bigger than my head. I measured.', 'I will carve a fox face on it.']))
        .then(function () { return rhyme(c, 'Carve it right, I will glow inside all night.', 0.5); });
    },
    log_pile: simple(['Logs, drying for winter.', 'A woodlouse family reunion.', 'I balanced one on top. Art.'],
      { fx: 'dust', n: 3, fox: 'Seasoned oak. Delicious. I mean, good for you.', p: 0.5 }),

    // ===== buildings =====
    house_player: function (c, n) {
      emit(c, 'smoke', 3, 0, -40);
      return kid(c, step(n, ['Home. The chimney is puffing away.', 'My window is the one with the kite.', 'Smells like Mom is making soup.']))
        .then(function () { return rhyme(c, 'Best chimney in the valley. Sooty, perfect bliss.', 0.5); });
    },
    house_a: neighbour,
    tavern: function (c, n) {
      emit(c, 'smoke', 4, 0, -20); sfx(c, 'sizzle');
      return kid(c, step(n, ['Mmm. Ramen broth. I can smell it from here.', 'The sign has a bowl with real steam. Almost.', 'Somebody inside is slurping loudly.', 'My stomach just growled at a building.']))
        .then(function () { return rhyme(c, ['Broth so hot! Save me what is left in the pot.', 'Ramen steam, a fox\'s dream.'], 0.6); });
    },
    shop: function (c, n) {
      sfx(c, 'bell'); emit(c, 'sparkle', 3, 0, -12);
      return kid(c, step(n, ['Potions and backpacks in the window.', '"Back in five minutes." It has been ten.', 'That blue bottle is bubbling by itself.', 'I pressed my nose on the glass. Oops.']))
        .then(function () { return rhyme(c, 'Half those potions are tea. The rest, wait and see.', 0.45); });
    },
    school: function (c, n) {
      sfx(c, 'locked'); emit(c, 'magic', 6, 0, -20);
      return kid(c, step(n, ['Locked. A note says: "Opens tomorrow."', 'I always thought this was a grain store.', 'The crest glows when I get close.', 'Still locked. I knocked politely, too.']))
        .then(function () {
          if (!c.hasSpirit) return null;
          return fox(c, step(n, [
            'The School of Magic, hid in plain sight. Tomorrow, all right?',
            'The Veilbound see a barn. You see the door.',
            'Patience, pup. The bell rings at sun-up.',
            'Knock all you like. That door holds a grudge.'
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
      return kid(c, step(n, [an + name + '. Looks interesting.', 'Yep. Still ' + an.toLowerCase() + name + '.', 'I like this ' + name + '.']));
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
