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
  ST.defineQuest({ id: 'night', icon: 'night', title: 'Sleep Tight', desc: 'It is late. Tomorrow starts something new.', steps: [
    { id: 'bed', text: 'Go to bed in your room', done: function (s) { return !!s.flags['c1:morning']; } }
  ] });
  ST.defineQuest({ id: 'academy', icon: 'book', title: 'The Academy', desc: 'The old school up the north road has opened its gate again.', steps: [
    { id: 'go', text: 'Go to Emberbrook Academy, up the road north of the square', done: function (s) { return !!s.academy || !!s.flags['visited:school']; } },
    { id: 'trial', text: 'Pass the gate trial', done: function (s) { return !!s.academy; } },
    { id: 'duel', text: 'Win a practice duel with Cole or Mira', done: function () { return duels(); } },
    { id: 'bind', text: 'Learn the Binding Spiral from Madam Sorrel', done: function () { return spells().indexOf('bind') >= 0; } }
  ], reward: function () {
    ST.start('woods'); ST.start('pawprints');
    var q = S().quests || {}; if (q.pawprints && q.woods && q.pawprints.status === 'active') q.pawprints.t = q.woods.t + 1; // Tobin comes first in the pill
    openWoods();
  } });

  ST.defineQuest({ id: 'pawprints', icon: 'paw', title: 'Wet Pawprints', desc: 'Something leaves wet pawprints in the village at night.', steps: [
    { id: 'pip', text: 'Ask Tobin about the pawprints, in Tobin\'s house on the south row', done: function () { return F('c1:pip'); } },
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
    else setLines(g, [['Guard Bram', 'The south road is closed to new Wonders.'], ['Guard Bram', 'Come back once the Academy has taught you.']]);
  }
  // Mom and Dad keep their own day (see PARENTS below); before the spell they cannot see the hontori
  function setParents() { if (H.game && H.game.applySched) H.game.applySched(true); }
  function sync() {
    if (!ST.isDone('academy')) setGuard(); else openWoods(); setParents();
    if (S().academy) setLines(npcBy('village', 'Gatekeeper'), [['Gatekeeper', 'Welcome back, young Wonder. The doors are open to you.'], ['Gatekeeper', 'Madam Sorrel is inside.']]);
  }
  H.onMapEnter = H.onMapEnter || [];
  H.onMapEnter.unshift(function () { sync(); });

  // Mom and Dad: different places and words through the day. After the first morning they can see the hontori.
  var PARENTS = {
    mom: [
      { from: 6, to: 11, x: 3, y: 3, dir: 0, lines: [['Mom', 'Eat something warm before you go, Wonder.'], ['Mom', 'Your little fox can have the crust.']] },
      { from: 11, to: 17, x: 9, y: 10, dir: 3, lines: [['Mom', 'Out exploring? Good. Wave at Wren for me.'], ['Mom', 'Come home if you get tired.']] },
      { from: 17, to: 21, x: 2, y: 3, dir: 0, lines: [['Mom', 'Soup tonight. The fox keeps the stove warm.'], ['Mom', 'Tell me one thing you learned today.']] },
      { from: 21, to: 24, x: 15, y: 11, dir: 0, lines: [['Mom', 'Late again. I am proud of you.'], ['Mom', 'Bed soon, my brave one.']] },
      { from: 0, to: 6, away: true }
    ],
    dad: [
      { from: 6, to: 11, x: 4, y: 8, dir: 0, lines: [['Dad', 'Morning, Wonder. Big day?'], ['Dad', 'The road is yours. Just keep to the path.']] },
      { from: 11, to: 17, x: 12, y: 5, dir: 2, lines: [['Dad', 'I am reading about the old schools.'], ['Dad', 'Eight elements, it says. You will see them all.']] },
      { from: 17, to: 21, x: 15, y: 4, dir: 0, lines: [['Dad', 'The fire burns cleaner since your friend came.'], ['Dad', 'Any new hontori today?']] },
      { from: 21, to: 24, x: 18, y: 8, dir: 2, lines: [['Dad', 'Still up? Me too. Old habits.'], ['Dad', 'Rest well. Tomorrow is another road.']] },
      { from: 0, to: 6, away: true }
    ]
  };
  (function () {
    var home = H.maps && H.maps.home; if (!home) return;
    (home.npcs || []).forEach(function (n) {
      var plan = PARENTS[n.key]; if (!plan) return;
      // the very first night they stay where the intro left them, with their old lines
      var first = [{ from: 0, to: 24, lines: n.lines.slice() }];
      Object.defineProperty(n, 'sched', { configurable: true, enumerable: true, get: function () { return F('c1:morning') ? plan : first; } });
    });
  })();

  // near the closed south edge, the guard calls out once per approach
  var gateArmed = true;
  ST.defineEvent({ id: 'c1_gate', when: 'auto', once: false, cond: function () {
    var p = pos(); if (!p || p.name !== 'village' || ST.isDone('academy') || !V) return false;
    var near = p.y >= V.h - 2 && p.x >= 26 && p.x <= 34;
    if (!near) { gateArmed = true; return false; }
    return gateArmed;
  }, run: function (a) {
    gateArmed = false;
    // Bram steps into the road in front of the kid
    try { var p0 = pos(), gn = (H.game.npcs() || []).filter(function (n) { return n.key === 'guard'; })[0]; if (gn && p0) { gn.x = p0.x; gn.y = Math.min(V.h - 1, p0.y + 1); gn.px = gn.x * 16 + 8; gn.py = gn.y * 16 + 15; gn.dir = 1; gn.slot = -2; } } catch (e) {}
    return a.say('guard', 'Guard Bram', 'Hold on, young Wonder. The south road is not safe for you yet.')
      .then(function () { return a.say('guard', 'Guard Bram', 'When the Academy says you are ready, I will open the gate.'); })
      .then(function () { return a.say('hontori', 'The woods are deep, the road is long. First the Academy, then we are strong.'); });
  } });

  // ---------------------------------------------------------------- the first night: explore the house, then bed
  aim('night', 'bed', function () { return spot('home', 28, 3); });
  ST.defineEvent({ id: 'c1_night', when: 'auto', map: 'home', cond: function (s) { return s.intro && !s.flags['c1:morning']; }, run: function (a) {
    ST.start('night');
    return a.say('hontori', 'Look around, but keep it light. Then off to bed, and sleep tight.');
  } });
  // the first night the door stays shut: Mom or Dad sends the kid to bed
  function firstNight() { var s = S(); return !!(s.intro && !(s.flags && s.flags['c1:morning'])); }
  var door0 = H.doorGuard;
  H.doorGuard = function (door, mapName) {
    if (mapName === 'home' && door.to === 'village' && firstNight()) return ST.run('c1_nightdoor');
    return door0 ? door0(door, mapName) : null;
  };
  ST.defineEvent({ id: 'c1_nightdoor', when: 'manual', once: false, run: function (a) {
    return a.say('mom', 'Mom', 'It is the middle of the night, sweetheart. Bed first.')
      .then(function () { return a.say('hontori', 'The night is long, the road can wait. Your bed is warm, so do not be late.'); });
  } });
  // sleeping in the kid's bed that first night starts the morning
  function hookBed() {
    if (!H.interact || H.interact.__night) return; H.interact.__night = true;
    var run0 = H.interact.run;
    H.interact.run = function (t, c) {
      if ((t === 'kid_bed' || t === 'bed') && firstNight()) return ST.run('c1_morning', c);
      return run0.apply(this, arguments);
    };
  }
  if (document.readyState === 'complete') setTimeout(hookBed, 0); else addEventListener('load', function () { setTimeout(hookBed, 0); });

  // ---------------------------------------------------------------- morning and the backpack
  ST.defineEvent({ id: 'c1_morning', when: 'manual', map: 'home', run: function (a) {
    a.sfx('sleep');
    return a.blackout(function () { a.setTime(8); }, 2200)
      .then(function () { return a.say('kid', 'Morning already.'); })
      .then(function () { return a.say('mom', 'Mom', 'Good morning, sweetheart. You look like you have a secret.'); })
      .then(function () { return a.say('hontori', 'They cannot see me, not just yet. Lift their veil, they will not forget.'); })
      .then(function () { return a.draw('veil', 'Draw the V for Mom and Dad'); })
      .then(function () { a.sfx('spell'); a.emit('magic', 60, 0, -10); return a.wait(900); })
      .then(function () { return a.say('mom', 'Mom', 'Oh. A little fox made of fire.'); })
      .then(function () { return a.say('dad', 'Dad', 'So the chimney was not grumbling. It was knocking.'); })
      .then(function () { return a.say('mom', 'Mom', 'Grandma told us about Wonders. Kids who see. Be brave, and be kind.'); })
      .then(function () { return a.say('dad', 'Dad', 'The old Academy opened its gate again. Go and learn.'); })
      .then(function () { return a.say('mom', 'Mom', 'Look around the house. Five things fit in your bag.'); })
      .then(function () { return a.say('dad', 'Dad', 'And a little pocket money. Spend it well.'); })
      .then(function () { var s = a.state; if (s.coins == null) s.coins = 0; if (H.money) H.money.add(25, 'pocket money'); else s.coins += 25; })
      .then(function () { return a.say('hontori', 'Your family sees, your path is clear. Pack your bag, the day is here.'); })
      .then(function () {
        // the home items now lie around the house as small glowing pickups (src/items.js)
        a.setFlag('c1:morning'); setParents();
        ST.start('academy');
      });
  } });
  // leaving without the map: Mom stops the kid once and hands it over (it does not take a bag slot)
  // an npc walks over to the kid (shortest path around furniture), one tile at a time
  function walkTo(key, near) {
    var c = H.game.currentMap && H.game.currentMap(), list = H.game.npcs ? H.game.npcs() : [];
    var n = list.filter(function (q) { return q.key === key && !q.away; })[0];
    if (!c || !n) return Promise.resolve();
    var goal = near, start = n.x + ',' + n.y, prev = {}, Q = [[n.x, n.y]]; prev[start] = null;
    var free = function (x, y) { return (x === n.x && y === n.y) || !c.blocked(x, y) || (x === goal[0] && y === goal[1]); };
    while (Q.length) { var q = Q.shift(); if (q[0] === goal[0] && q[1] === goal[1]) break;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var x = q[0] + d[0], y = q[1] + d[1], k = x + ',' + y; if (k in prev || !free(x, y) || (x === c.player.tx && y === c.player.ty)) return; prev[k] = q; Q.push([x, y]); }); }
    var path = [], k0 = goal[0] + ',' + goal[1]; if (!(k0 in prev)) return Promise.resolve();
    for (var cur = goal; cur; cur = prev[cur[0] + ',' + cur[1]]) path.unshift(cur);
    // smooth steps with the same walking frames the kid uses (1, 0, 3, 0 ...)
    var steps = 0; n.hold = true;   // the day schedule must not pull her back while she walks
    return path.slice(1).reduce(function (p, step) { return p.then(function () {
      n.dir = step[0] > n.x ? 3 : step[0] < n.x ? 2 : step[1] > n.y ? 0 : 1;
      var fx = n.x, fy = n.y; n.x = step[0]; n.y = step[1]; n.slot = -3; steps++;
      return new Promise(function (r) {
        var t0 = performance.now(), D = 230;
        (function tick(now) {
          var k = Math.min(1, (now - t0) / D);
          n.px = (fx + (n.x - fx) * k) * 16 + 8; n.py = (fy + (n.y - fy) * k) * 16 + 15;
          n.frame = k < 0.5 ? (steps % 2 ? 1 : 3) : (steps % 2 ? 2 : 0);
          if (k < 1) requestAnimationFrame(tick); else { n.frame = 0; r(); }
        })(t0);
      });
    }); }, Promise.resolve()).then(function () { n.dir = c.player.ty < n.y ? 1 : c.player.ty > n.y ? 0 : c.player.tx > n.x ? 3 : 2; });
  }
  ST.defineEvent({ id: 'c1_mapgift', when: 'manual', once: false, run: function (a) {
    var c = H.game.currentMap && H.game.currentMap(), p = c ? c.player : null;
    return a.say('mom', 'Mom', 'Wait, sweetheart.')
      .then(function () { return p ? walkTo('mom', [p.tx, p.ty - 1]) : null; })
      .then(function () { return a.say('mom', 'Mom', 'You will need this. Your grandma drew it.'); })
      .then(function () {
        a.state.flags['map:gift'] = true;
        a.give('map', 'Map', 'map');
        return a.say('hontori', 'A map in hand, we know the land.');
      });
  } });

  // ---------------------------------------------------------------- Wet Pawprints
  ST.defineEvent({ id: 'c1_pip', when: 'talk', map: 'house_a2', npc: 'Tobin', run: function (a) {
    return a.say('boy', 'Tobin', 'You believe me, right? It was real.')
      .then(function () { return a.say('boy', 'Tobin', 'The pawprints always lead to the pond.'); })
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
      // moves are taught by the fox guide inside the battle; no extra tip before it
      return Promise.resolve().then(function () { return start0.apply(self, args); })
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
