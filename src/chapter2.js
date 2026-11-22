window.H = window.H || {};
// Chapter 2 (Whisperwood and Mossgrove): the road south, Rootwood Hall and the first ring, the Leaf Ring.
// The ring trial is a mix (rule 49): a wand-magic trial (wake three wilted sprouts with the Mending Sigil),
// then a duel with a limit (no switching hontori) against Warden Fern.
(function () {
  'use strict';
  var H = window.H, ST = H.story;
  if (!ST) return;
  function S() { return (H.game && H.game.state) || {}; }
  function F(k) { var s = S(); return !!(s.flags && s.flags[k]); }
  function pos() { var c = H.game && H.game.currentMap && H.game.currentMap(); return c && c.player ? { x: c.player.tx, y: c.player.ty, name: c.name } : null; }
  function here() { var p = pos(); return p && p.name; }
  function save() { try { H.game && H.game.save(); } catch (e) {} }

  // ---------------------------------------------------------------- quest
  ST.defineQuest({ id: 'leafring', icon: 'leaf', title: 'The Leaf Ring', desc: 'Rootwood Hall, south of Whisperwood, holds the first ring.', steps: [
    { id: 'road', text: 'Follow the path to the south edge of Whisperwood and on to Mossgrove', done: function (s) { return !!s.flags['visited:mossgrove']; } },
    { id: 'maze', text: 'Open the root gate: push the leaf piles onto the glowing moss', done: function () { return F('c2:maze'); } },
    { id: 'fern', text: 'Meet Warden Fern inside Rootwood Hall', done: function () { return F('c2:fern'); } },
    { id: 'sprouts', text: 'Wand trial: wake the three wilted sprouts in the Hall', done: function () { return F('c2:sprouts'); } },
    { id: 'duel', text: 'Ring duel with Warden Fern. No switching hontori.', done: function () { return F('c2:ring'); } }
  ], reward: function () { ST.start('tidewell'); } });
  ST.defineQuest({ id: 'tidewell', icon: 'wind', title: 'The Rockslide', desc: 'The road east of Mossgrove climbs to Whistling Pass.', steps: [
    { id: 'wait', text: 'A rockslide blocks the road to Whistling Pass. Rowan in Mossgrove knows more.', done: function () { return false; } }
  ] });

  // map markers
  function spot(map, x, y) { var cur = here(); if (!cur) return null; if (cur === map) return { map: map, x: x, y: y };
    var route = { village: { whisperwood: [29, 39], mossgrove: [29, 39], rootwood_hall: [29, 39] }, whisperwood: { mossgrove: [24, 39], rootwood_hall: [24, 39], village: [24, 0] }, mossgrove: { rootwood_hall: [20, 8], rootwood_gate: [20, 8], whisperwood: [19, 0] }, rootwood_gate: { rootwood_hall: [8, 3], mossgrove: [8, 13] }, rootwood_hall: { mossgrove: [13, 21] } };
    var r = route[cur] && route[cur][map]; return r ? { map: cur, x: r[0], y: r[1] } : null; }
  function aim(qid, sid, fn) { var q = ST.quests[qid], st = q && q.steps.filter(function (s) { return s.id === sid; })[0]; if (st) Object.defineProperty(st, 'target', { configurable: true, get: fn }); }
  aim('leafring', 'road', function () { return spot('mossgrove', 19, 2); });
  aim('leafring', 'maze', function () { return spot('rootwood_gate', 8, 5); });
  aim('leafring', 'fern', function () { return spot('rootwood_hall', 13, 12); });
  aim('leafring', 'sprouts', function () { return spot('rootwood_hall', 13, 12); });
  aim('leafring', 'duel', function () { return spot('rootwood_hall', 13, 12); });
  aim('tidewell', 'wait', function () { return spot('mossgrove', 24, 25); });

  // the quest starts once Chapter 1 is complete (the letter has arrived)
  ST.defineEvent({ id: 'c2_start', when: 'auto', cond: function (s) { return !!s.flags['c1:complete']; }, run: function (a) {
    ST.start('leafring');
    return a.say('hontori', 'South through the trees the old road goes. A hall of roots, where the first ring grows.');
  } });

  // the Ranger keeps the road closed until Chapter 1 is done
  var armed = true;
  ST.defineEvent({ id: 'c2_ranger', when: 'auto', once: false, map: 'whisperwood', cond: function (s) {
    var p = pos(), ww = H.maps.whisperwood; if (!p || p.name !== 'whisperwood' || s.flags['c1:complete'] || !ww) return false;
    var near = p.y >= ww.h - 3 && p.x >= 22 && p.x <= 27; if (!near) { armed = true; return false; } return armed;
  }, run: function (a) {
    armed = false;
    return a.say('guard', 'Ranger Moss', 'Easy, young Wonder. The south road is still deep in mud.')
      .then(function () { return a.say('guard', 'Ranger Moss', 'Finish what you started in Emberbrook. By then it will be dry.'); })
      .then(function () { return a.say('hontori', 'Mud on the road, a job at home. Finish there first, then we roam.'); });
  } });
  H.doorGuard = (function (prev) {
    return function (door, mapName) {
      if (mapName === 'whisperwood' && door.to === 'mossgrove' && !F('c1:complete')) { armed = true; return ST.run('c2_ranger'); }
      return prev ? prev(door, mapName) : null;
    };
  })(H.doorGuard);

  // Ivo at the maze: explains once, and can reset the leaves if they get stuck
  ST.defineEvent({ id: 'c2_maze', when: 'auto', map: 'rootwood_gate', cond: function (s) { return !s.flags['c2:maze']; }, run: function (a) {
    return a.say('kid2', 'Ivo', 'Welcome to the Root Maze. The gate opens when the three leaf piles rest on the glowing moss.')
      .then(function () { return a.say('kid2', 'Ivo', 'Walk into a pile to push it. If one gets stuck, ask me and I will rake them back.'); });
  } });
  (function hook() {
    if (!H.interact || !H.interact.run) { setTimeout(hook, 300); return; }
    if (H.interact.__maze) return; H.interact.__maze = true;
    var has0 = H.interact.has, run0 = H.interact.run;
    H.interact.has = function (t) { return t === 'leafmaze' || has0.apply(this, arguments); };
    H.interact.run = function (t, c) {
      if (t !== 'leafmaze') return run0.apply(this, arguments);
      var a = ST.api(c || {});
      if (F('c2:maze')) return a.say('kid2', 'Ivo', 'You solved it. Fern is waiting inside.');
      return a.choose(['Rake the leaves back', 'Keep trying']).then(function (i) {
        if (i !== 0) return a.say('kid2', 'Ivo', 'Take your time. Think before you push.');
        H.puzzles.reset('rootwood_gate'); a.sfx('step');
        return a.say('kid2', 'Ivo', 'There. Fresh start.');
      });
    };
  })();

  // first steps into Mossgrove
  ST.defineEvent({ id: 'c2_arrive', when: 'auto', map: 'mossgrove', cond: function (s) { return !!s.flags['c1:complete']; }, run: function (a) {
    return a.say('kid', 'Mossgrove. Everything here is green.')
      .then(function () { return a.say('hontori', 'Moss on the stones and roots below. The hall is north, so in we go.'); });
  } });

  // Warden Fern: the trial, step by step; each talk starts the next part
  ST.defineEvent({ id: 'c2_fern', when: 'talk', npc: 'Warden Fern', map: 'rootwood_hall', once: false, cond: function (s) { return !!s.flags['c1:complete'] && !s.flags['c2:ring']; }, run: function (a) {
    if (!F('c2:fern')) {
      return a.say('warden', 'Warden Fern', 'A Wonder from Emberbrook. Sorrel wrote that you might come.')
        .then(function () { return a.say('warden', 'Warden Fern', 'The Leaf Ring is earned in two parts: care, then courage.'); })
        .then(function () { return a.say('warden', 'Warden Fern', 'First, three sprouts here have wilted. Wake them with your wand.'); })
        .then(function () { a.setFlag('c2:fern'); return sprouts(a); });
    }
    if (!F('c2:sprouts')) return sprouts(a);
    return duel(a);
  } });
  function sprouts(a) {
    var n = 0;
    function one() {
      n++;
      return a.say('warden', 'Warden Fern', n === 1 ? 'The first one. Gently.' : n === 2 ? 'Good. The next is thirstier.' : 'The last is almost asleep.')
        .then(function () { return a.draw('mend', 'Draw the Mending Sigil for sprout ' + n + ' of 3'); })
        .then(function () { a.sfx('sparkle'); a.emit('sparkle', 14, 0, -10); a.toast('Sprout ' + n + ' of 3 is awake'); return a.wait(500); })
        .then(function () { return n < 3 ? one() : null; });
    }
    return one().then(function () {
      a.setFlag('c2:sprouts'); save();
      return a.say('warden', 'Warden Fern', 'Care, shown. Now courage. We duel, and in this hall no one switches.')
        .then(function () { return a.say('hontori', 'No switching here, so choose with care. Rest up first, the bed is there.'); });
    });
  }
  function duel(a) {
    return a.say('warden', 'Warden Fern', 'Ready? One hontori, start to end.')
      .then(function () { return a.choose(['Begin the ring duel', 'Not yet']); })
      .then(function (i) {
        if (i !== 0) return a.say('warden', 'Warden Fern', 'Roots do not hurry. Neither do I.');
        return a.battle('grass', { trainer: { name: 'Warden Fern', key: 'warden', spirit: 'sunsprout', level: 6, stage: 2, noCapture: true, noSwitch: true, school: { name: 'Rootwood Hall', el: 'grass', col: '#7ed957', rule: 'No switching' } }, noCapture: true })
          .then(function (r) {
            var party = S().party || []; party.forEach(function (p) { if (p && p.hp <= 0) p.hp = 1; });
            if (!r || !r.won) return a.say('warden', 'Warden Fern', 'Not this time. Rest, think, and come back.');
            a.setFlag('c2:ring');
            var s = S(); s.rings = s.rings || []; if (s.rings.indexOf('grass') < 0) s.rings.push('grass');
            a.give('ring_leaf', 'Leaf Ring', 'grass');
            return a.say('warden', 'Warden Fern', 'Well grown. The Leaf Ring is yours.')
              .then(function () { return a.say('warden', 'Warden Fern', 'Seven more schools. Each tests you in its own way.'); })
              .then(function () { return a.say('hontori', 'One ring of eight, a leaf of green. The bravest roots are seldom seen.'); });
          });
      });
  }

  // after the ring: a grey visitor in the square, and the bridge news
  ST.defineEvent({ id: 'c2_grey', when: 'auto', map: 'mossgrove', cond: function (s) { return !!s.flags['c2:ring']; }, run: function (a) {
    return a.say('kid', 'Someone in a grey cloak is watching from the well.')
      .then(function () { return a.say('traveler', 'Grey cloak', 'A ring already. The Archmage will be so pleased.'); })
      .then(function () { return a.say('traveler', 'Grey cloak', 'He loves to meet promising Wonders. In person.'); })
      .then(function () { return a.say('hontori', 'A friendly word, a closed grey eye. We smile, we listen, we pass by.'); });
  } });
  ST.defineEvent({ id: 'c2_rowan', when: 'talk', npc: 'Rowan', map: 'mossgrove', cond: function (s) { return !!s.flags['c2:ring']; }, run: function (a) {
    return a.say('traveler', 'Rowan', 'The road to Whistling Pass? A rockslide closed it. They are clearing it now.')
      .then(function () { return a.say('traveler', 'Rowan', 'Until then, the forest has plenty to find. Keep your eyes open.'); });
  } });

  H.chapter2 = { spot: spot };
})();
