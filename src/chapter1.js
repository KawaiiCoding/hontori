window.H = window.H || {};
// Chapter 1 (Emberbrook) story content. Morning after the intro, the pick-5 backpack, four quests and the grey-eye letter.
// Built on H.story (src/quests.js). Everything is saved in state.flags and state.quests.
(function () {
  'use strict';
  var H = window.H, ST = H.story;
  if (!ST) return;

  function S() { return (H.game && H.game.state) || {}; }
  function F(k) { var s = S(); return !!(s.flags && s.flags[k]); }
  function spells() { return Array.isArray(S().spells) ? S().spells : []; }
  function duels() { var d = S().academyDuels || {}; return Object.keys(d).some(function (k) { return d[k]; }); }
  function hour() { var e = ST.env; return e && typeof e.time === 'number' ? e.time : 12; }
  function dusk() { var h = hour(); return h >= 18 || h < 5; }
  function pondPending() { var s = S(); return !!(s.flags && s.flags['c1:pip'] && !s.flags['c1:pond'] && !s.flags['c1:brook']); }
  function pos() { var c = H.game && H.game.currentMap && H.game.currentMap(); return c && c.player ? { x: c.player.tx, y: c.player.ty, name: c.name } : null; }

  // ---------------------------------------------------------------- quests
  ST.defineQuest({ id: 'academy', icon: 'book', title: 'The Academy', desc: 'Emberbrook Academy teaches one spell: the Binding Spiral.', steps: [
    { id: 'go', text: 'Go to Emberbrook Academy, up the road north of the square', done: function (s) { return !!s.academy || !!s.flags['visited:school']; } },
    { id: 'trial', text: 'Pass the gate trial', done: function (s) { return !!s.academy; } },
    { id: 'duel', text: 'Win a practice duel with Ash or Mira', done: function () { return duels(); } },
    { id: 'bind', text: 'Learn the Binding Spiral from Madam Sorrel', done: function () { return spells().indexOf('bind') >= 0; } }
  ], reward: function () {
    ST.start('woods'); ST.start('pawprints');
    var q = S().quests || {}; if (q.pawprints && q.woods && q.pawprints.status === 'active') q.pawprints.t = q.woods.t + 1; // Pip comes first in the pill
    openWoods();
  } });

  ST.defineQuest({ id: 'pawprints', icon: 'paw', title: 'Wet Pawprints', desc: 'Something leaves wet pawprints in the village at night.', steps: [
    { id: 'pip', text: 'Ask Pip about the pawprints, in Pip\'s house on the south row', done: function () { return F('c1:pip'); } },
    { id: 'pond', text: function () { return dusk() ? 'Go to the pond in the northwest of the village' : 'Wait for night: sleep in your bed, then go to the pond'; }, done: function () { return F('c1:pond'); } },
    { id: 'bind', text: 'Weaken the shy water hontori at the pond and bind it', done: function () { return F('c1:brook'); } }
  ], reward: function () { ST.start('elder'); } });

  ST.defineQuest({ id: 'elder', icon: 'light', title: 'The Elder\'s Second Cup', desc: 'Elder Wisteria sets a second cup of tea each morning.', steps: [
    { id: 'family', text: 'Talk to Fenn or Lark in Fenn\'s house on the south row', done: function () { return F('c1:fenn'); } },
    { id: 'elder', text: 'Ask Elder Wisteria about the well, near the Academy road', done: function () { return F('c1:well'); } }
  ] });

  ST.defineQuest({ id: 'woods', icon: 'sprout', title: 'Beyond the Trees', desc: 'The south road leads to Whisperwood.', steps: [
    { id: 'gate', text: 'Finish the Academy so Guard Bram opens the south gate', done: function () { return ST.isDone('academy'); } },
    { id: 'wood', text: 'Walk the south road into Whisperwood', done: function (s) { return ST.isDone('academy') && !!s.flags['visited:whisperwood']; } }
  ] });

  // ---------------------------------------------------------------- quest markers for the area map
  // mapview reads step.target = {map, x, y}. Each getter answers for the map the kid is on now:
  // the spot itself when it is on this map, otherwise the door that leads toward it.
  function here() { return ST.mapName || (H.game && H.game.currentMap && H.game.currentMap().name); }
  function doorTo(cur, dest) {
    var m = H.maps && H.maps[cur]; if (!m) return null;
    var ds = (m.doors || []).concat(cur === 'village' ? held : []);
    var d = ds.filter(function (d) { return d.to === dest; })[0] || ds.filter(function (d) { return d.to === 'village'; })[0];
    return d ? { map: cur, x: d.x, y: d.y } : null;
  }
  function spot(map, x, y) { var cur = here(); if (!cur) return null; return cur === map ? { map: map, x: x, y: y } : doorTo(cur, map); }
  function aim(qid, sid, fn) {
    var q = ST.quests[qid], step = q && q.steps.filter(function (s) { return s.id === sid; })[0];
    if (step) Object.defineProperty(step, 'target', { configurable: true, get: fn });
  }
  aim('academy', 'go', function () { return spot('village', 30, 9); });
  aim('academy', 'trial', function () { return spot('village', 30, 9); });
  aim('academy', 'duel', function () { return spot('school', 5, 7); });
  aim('academy', 'bind', function () { return spot('school', 8, 3); });
  aim('pawprints', 'pip', function () { return spot('house_a2', 9, 8); });
  aim('pawprints', 'pond', function () { return dusk() ? spot('village', 9, 10) : spot('home', 28, 2); });
  aim('pawprints', 'bind', function () { return spot('village', 9, 10); });
  aim('elder', 'family', function () { return spot('house_a3', 7, 4); });
  aim('elder', 'elder', function () { return spot('village', 33, 12); });
  aim('woods', 'gate', function () { return spot('village', 32, 37); });
  aim('woods', 'wood', function () { return spot('whisperwood', 24, 1); });
  // where the current step points on this map, or null
  ST.target = function () { var id = ST.current(), st = id && ST.nextStep(id); return (st && st.target) || null; };

  // ---------------------------------------------------------------- the south gate
  // The village doors to Whisperwood are held back until the Academy quest is done.
  var V = H.maps && H.maps.village, held = [];
  if (V && V.doors) {
    held = V.doors.filter(function (d) { return d.to === 'whisperwood'; });
    V.doors = V.doors.filter(function (d) { return d.to !== 'whisperwood'; });
  }
  function openWoods() {
    if (!V || !held.length) return;
    held.forEach(function (d) { if (V.doors.indexOf(d) < 0) V.doors.push(d); });
    held = [];
    setGuard();
  }
  function setLines(n, lines) { if (n && n.lines) { n.lines.length = 0; lines.forEach(function (l) { n.lines.push(l); }); } }
  function npcBy(map, name) { var m = H.maps && H.maps[map]; return m && (m.npcs || []).filter(function (n) { return n.lines && n.lines[0] && n.lines[0][0] === name; })[0]; }
  function setGuard() {
    var g = npcBy('village', 'Guard Bram'); if (!g) return;
    if (ST.isDone('academy')) setLines(g, [['Guard Bram', 'The south gate is open for you now.'], ['Guard Bram', 'Keep to the path in Whisperwood.']]);
    else setLines(g, [['Guard Bram', 'The south road is closed to new wands.'], ['Guard Bram', 'Come back once the Academy has taught you.']]);
  }
  function setParents() {
    if (!F('c1:morning')) return;
    setLines(npcBy('home', 'Mom'), [['Mom', 'Take a snack if you go out.'], ['Mom', 'Be home before the lanterns are lit.']]);
    setLines(npcBy('home', 'Dad'), [['Dad', 'The hearth stays warm all day now.'], ['Dad', 'Old houses have their moods, I suppose.']]);
  }
  function sync() { if (!ST.isDone('academy')) setGuard(); else openWoods(); setParents(); }
  H.onMapEnter = H.onMapEnter || [];
  H.onMapEnter.unshift(function () { sync(); });

  // near the closed south edge, the guard calls out once per approach
  var gateArmed = true;
  ST.defineEvent({ id: 'c1_gate', when: 'auto', once: false, cond: function () {
    var p = pos(); if (!p || p.name !== 'village' || ST.isDone('academy') || !V) return false;
    var near = p.y >= V.h - 2 && p.x >= 26 && p.x <= 34;
    if (!near) { gateArmed = true; return false; }
    return gateArmed;
  }, run: function (a) {
    gateArmed = false;
    return a.say('guard', 'Guard Bram', 'Hold on. The south road is closed to new wands.')
      .then(function () { return a.say('guard', 'Guard Bram', 'Learn your craft at the Academy first.'); })
      .then(function () { return a.say('hontori', 'The woods are deep, the road is long. First the Academy, then we are strong.'); });
  } });

  // ---------------------------------------------------------------- morning and the backpack
  ST.defineEvent({ id: 'c1_morning', when: 'auto', map: 'home', cond: function (s) { return s.intro && !s.flags['c1:morning']; }, run: function (a) {
    return a.blackout(function () { a.setTime(8); }, 1800)
      .then(function () { return a.say('kid', 'Morning already.'); })
      .then(function () { return a.say('mom', 'Mom', 'Good morning, sweetheart. You slept by the fireplace again.'); })
      .then(function () { return a.say('mom', 'Mom', 'There is warm porridge on the stove.'); })
      .then(function () { return a.say('dad', 'Dad', 'The chimney finally stopped grumbling.'); })
      .then(function () { return a.say('dad', 'Dad', 'Wren says the old Academy opened its gate again.'); })
      .then(function () { return a.say('hontori', 'They cannot see, and that is fine. Pack your bag, the sun will shine.'); })
      .then(function () { return a.say('mom', 'Mom', 'Take what you need, five things fit in your bag.'); })
      .then(function () {
        // the home items now lie around the house as small glowing pickups (src/items.js)
        a.setFlag('c1:morning'); setParents();
        ST.start('academy');
      });
  } });
  // leaving without the map: Mom stops the kid once and hands it over (it does not take a bag slot)
  ST.defineEvent({ id: 'c1_mapgift', when: 'manual', once: false, run: function (a) {
    return a.say('mom', 'Mom', 'Wait. You will need this.')
      .then(function () {
        a.state.flags['map:gift'] = true;
        a.give('map', 'Map', 'map');
        return a.say('hontori', 'A map in hand, we know the land.');
      });
  } });

  // ---------------------------------------------------------------- Wet Pawprints
  ST.defineEvent({ id: 'c1_pip', when: 'talk', map: 'house_a2', npc: 'Pip', run: function (a) {
    return a.say('boy', 'Pip', 'You believe me, right? It was real.')
      .then(function () { return a.say('boy', 'Pip', 'The pawprints always lead to the pond.'); })
      .then(function () { return a.say('hontori', 'Wet little paws, a pond at night. We wait for dusk and the water light.'); })
      .then(function () { ST.start('pawprints'); a.setFlag('c1:pip'); });
  } });

  function nearPond() { var p = pos(); return !!(p && p.name === 'village' && p.x <= 16 && p.y <= 14); }
  var pondArmed = true;
  ST.defineEvent({ id: 'c1_pond', when: 'auto', once: false, cond: function (s) {
    if (!s.flags['c1:pip'] || s.flags['c1:brook']) return false;
    if (!nearPond()) { pondArmed = true; return false; }
    return pondArmed && dusk();
  }, run: function (a) {
    pondArmed = false;
    if (spells().indexOf('bind') < 0) {
      return a.say('kid', 'Something is watching from the water.')
        .then(function () { return a.say('hontori', 'Shy and quick, it slips away. Learn the spiral first, then come and stay.'); });
    }
    a.setFlag('c1:pond');
    return a.say('kid', 'Ripples... and two small eyes.')
      .then(function () { return a.say('hontori', 'Gentle now, it is afraid. Tire it first, then the spiral is made.'); })
      .then(function () { return a.battle('water', { level: 3 }); })
      .then(function (r) {
        if (r && r.captured) {
          a.setFlag('c1:brook');
          return a.say('kid', 'It was lonely. That is all.')
            .then(function () { return a.say('hontori', 'No more milk by the door at night. A friend at last, and all is right.'); });
        }
        return a.say('hontori', 'Back to the reeds it swam away. Step back, return, and try today.');
      });
  } });

  // ---------------------------------------------------------------- The Elder's Second Cup
  ST.defineEvent({ id: 'c1_fenn', when: 'talk', map: 'house_a3', npc: ['Fenn', 'Lark'], run: function (a) {
    var who = a.ctx.npc === 'Lark' ? ['girl', 'Lark'] : ['dad', 'Fenn'];
    return a.say(who[0], who[1], 'The Elder never talks about the well.')
      .then(function () { return a.say(who[0], who[1], 'Maybe she will talk to you.'); })
      .then(function () { ST.start('elder'); a.setFlag('c1:fenn'); });
  } });
  ST.defineEvent({ id: 'c1_well', when: 'talk', npc: 'Elder Wisteria', cond: function (s) { return !!s.flags['c1:fenn']; }, run: function (a) {
    return a.say('elder', 'Elder Wisteria', 'The second cup is for an old friend, a spirit of light.')
      .then(function () { return a.say('elder', 'Elder Wisteria', 'Long ago an old law called every hontori a bad spirit.'); })
      .then(function () { return a.say('elder', 'Elder Wisteria', 'My friend was sealed in the well for it.'); })
      .then(function () { return a.say('elder', 'Elder Wisteria', 'The law was written by Grand Archmage Orlen Vael.'); })
      .then(function () { return a.say('elder', 'Elder Wisteria', 'Everyone loves him. Be careful who you tell.'); })
      .then(function () { return a.say('hontori', 'A kindly face, an old decree. Some locks are made to hide the key.'); })
      .then(function () { a.setFlag('c1:well'); });
  } });

  // ---------------------------------------------------------------- ending
  ST.defineEvent({ id: 'c1_letter', when: 'auto', cond: function (s) {
    return s.flags['c1:morning'] && ['academy', 'pawprints', 'elder', 'woods'].every(ST.isDone);
  }, run: function (a) {
    return a.wait(600)
      .then(function () { a.sfx('page'); return a.say('kid', 'A paper bird glides down and lands at my feet.'); })
      .then(function () { return a.say('kid', 'It is sealed with a closed grey eye.'); })
      .then(function () { return a.say('letter', 'The letter', 'To the child who sees.'); })
      .then(function () { return a.say('letter', 'The letter', 'The Council has heard of a new wand in Emberbrook.'); })
      .then(function () { return a.say('letter', 'The letter', 'Keep your spirit close, and your eyes closed.'); })
      .then(function () { return a.say('letter', 'The letter', 'Orlen Vael, Grand Archmage, Keeper of the Veil.'); })
      .then(function () { return a.say('hontori', 'A closed grey eye, a quiet threat. We will not fear. Not yet, not yet.'); })
      .then(function () { a.give('grey_letter', 'Sealed Letter', 'scroll'); a.setFlag('c1:complete'); return a.wait(500); })
      .then(function () { return a.say('kid', 'Then we keep going.'); })
      .then(function () { return a.say('hontori', 'The road runs on through leaf and stone. We walk it now, but not alone.'); });
  } });

  // ---------------------------------------------------------------- tips, each shown once when it first matters
  function tip(flag, text) {
    if (F(flag)) return Promise.resolve();
    ST.set(flag);
    return ST.api().say('hontori', text);
  }
  function hurt() { var p = (S().party || [])[0]; return !!(p && p.maxHp && p.hp < p.maxHp); }
  function wrapBattle() {
    if (!H.battle || !H.battle.start || H.battle.__c1) return;
    H.battle.__c1 = true;
    var start0 = H.battle.start;
    H.battle.start = function (o) {
      var self = this, args = arguments, wild = !(o && o.trainer);
      return tip('tip:move', 'Tap a move and I will fight. Stay close, and we will be all right.')
        .then(function () { return start0.apply(self, args); })
        .then(function (r) {
          var p = Promise.resolve();
          if (r && r.won && !r.captured && wild && spells().indexOf('bind') < 0)
            p = p.then(function () { return tip('tip:bind', 'It tired and fled, but do not mind. The Academy teaches how to bind.'); });
          if (wild && hurt()) p = p.then(function () { return tip('tip:mend', 'Open the party and choose Mend. It costs some mana, my friend.'); });
          return p.then(function () { return r; });
        });
    };
  }
  setInterval(wrapBattle, 1000);
  ST.defineEvent({ id: 'c1_tip_mana', when: 'auto', cond: function (s) { return s.flags['c1:morning'] && s.mana != null && s.mana <= 1; }, run: function (a) {
    a.setFlag('tip:mana');
    return a.say('hontori', 'Your mana is low. Eat herbs, or ramen at the tavern, and it will grow.');
  } });
  ST.defineEvent({ id: 'c1_tip_night', when: 'auto', cond: function (s) { var h = hour(); return s.flags['c1:morning'] && (h >= 20 || h < 5) && !pondPending(); }, run: function (a) {
    a.setFlag('tip:night');
    return a.say('hontori', 'The stars are out, the lanterns low. Sleep in a bed, then on we go.');
  } });

  H.chapter1 = { openWoods: openWoods };
})();
