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
    { id: 'bryn', text: 'Pass Apprentice Bryn in the aisle', done: function () { return F('c2:bryn'); } },
    { id: 'duel', text: 'Ring duel with Warden Fern. No switching hontori.', done: function () { return F('c2:ring'); } }
  ], reward: function () { ST.start('tidewell'); } });
  ST.defineQuest({ id: 'tidewell', icon: 'wind', title: 'The Rockslide', desc: 'The road east of Mossgrove climbs to Whistling Pass.', steps: [
    { id: 'wait', text: function () {
      var full = false; try { full = !!(H.unlock && H.unlock.isFull && H.unlock.isFull()); } catch (e) {}
      return full ? 'The crew is still clearing the road to Whistling Pass. More of the journey is coming.' : 'The road to Whistling Pass opens with the full journey.';
    }, done: function () { return false; } }
  ] });

  // map markers
  function spot(map, x, y) { var cur = here(); if (!cur) return null; if (cur === map) return { map: map, x: x, y: y };
    var route = { village: { whisperwood: [29, 39], mossgrove: [29, 39], rootwood_hall: [29, 39] }, whisperwood: { mossgrove: [24, 39], rootwood_hall: [24, 39], village: [24, 0] }, mossgrove: { rootwood_hall: [20, 8], rootwood_gate: [20, 8], whisperwood: [26, 0], village: [26, 0] }, rootwood_gate: { rootwood_hall: [8, 3], mossgrove: [8, 13], village: [8, 13] }, rootwood_hall: { mossgrove: [13, 21], village: [13, 21] } };
    var r = route[cur] && route[cur][map]; return r ? { map: cur, x: r[0], y: r[1] } : null; }
  function aim(qid, sid, fn) { var q = ST.quests[qid], st = q && q.steps.filter(function (s) { return s.id === sid; })[0]; if (st) Object.defineProperty(st, 'target', { configurable: true, get: fn }); }
  aim('leafring', 'road', function () { return spot('mossgrove', 26, 2); });
  aim('leafring', 'maze', function () { return spot('rootwood_gate', 8, 5); });
  aim('leafring', 'fern', function () { return spot('rootwood_hall', 13, 12); });
  aim('leafring', 'sprouts', function () { return spot('rootwood_hall', 13, 12); });
  aim('leafring', 'bryn', function () { return spot('rootwood_hall', 13, 15); });
  aim('leafring', 'duel', function () { return spot('rootwood_hall', 13, 12); });
  aim('tidewell', 'wait', function () { return spot('mossgrove', 32, 17); });

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
    return a.say('ivo', 'Ivo', 'Welcome to the Root Maze. The gate opens when the three leaf piles rest on the glowing moss.')
      .then(function () { return a.say('ivo', 'Ivo', 'Walk into a pile to push it. If one gets stuck, ask me and I will rake them back.'); });
  } });
  (function hook() {
    if (!H.interact || !H.interact.run) { setTimeout(hook, 300); return; }
    if (H.interact.__maze) return; H.interact.__maze = true;
    var has0 = H.interact.has, run0 = H.interact.run;
    H.interact.has = function (t) { return t === 'leafmaze' || has0.apply(this, arguments); };
    H.interact.run = function (t, c) {
      if (t !== 'leafmaze') return run0.apply(this, arguments);
      var a = ST.api(c || {});
      if (F('c2:maze')) return a.say('ivo', 'Ivo', 'You solved it. Fern is waiting inside.');
      return a.choose(['Rake the leaves back', 'Keep trying']).then(function (i) {
        if (i !== 0) return a.say('ivo', 'Ivo', 'Take your time. Think before you push.');
        H.puzzles.reset('rootwood_gate'); a.sfx('step');
        return a.say('ivo', 'Ivo', 'There. Fresh start.');
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
    if (!F('c2:bryn')) return a.say('warden', 'Warden Fern', 'Courage first meets my apprentice. Bryn waits in the aisle.');
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
  // the apprentice: one hontori each, a short test of nerve before the Warden
  ST.defineEvent({ id: 'c2_bryn', when: 'talk', npc: 'Apprentice Bryn', map: 'rootwood_hall', once: false, cond: function (s) { return !s.flags['c2:bryn']; }, run: function (a) {
    if (!F('c2:sprouts')) return a.say('apprentice', 'Apprentice Bryn', 'Care comes first here. Help Fern with the sprouts.');
    return a.say('apprentice', 'Apprentice Bryn', 'I was standing where you stand, one spring ago.')
      .then(function () { return a.say('apprentice', 'Apprentice Bryn', 'One hontori each. If you pass me, the Warden will see you.'); })
      .then(function () { return a.choose(['Duel Bryn', 'Not yet']); })
      .then(function (i) {
        if (i !== 0) return a.say('apprentice', 'Apprentice Bryn', 'The aisle will wait. So will I.');
        var lead = (S().party || [])[0], lv = Math.max(4, ((lead && lead.level) || 4) - 1);
        return a.battle('grass', { trainer: { name: 'Apprentice Bryn', key: 'apprentice', spirit: 'tortoise', level: lv, noCapture: true, noSwitch: true }, noCapture: true })
          .then(function (r) {
            var party = S().party || []; party.forEach(function (p) { if (p && p.hp <= 0) p.hp = 1; });
            if (!r || !r.won) return a.say('apprentice', 'Apprentice Bryn', 'Slow roots still grow. Rest, then come back.');
            a.setFlag('c2:bryn'); save();
            return a.say('apprentice', 'Apprentice Bryn', 'You did not rush, and you did not falter.')
              .then(function () { return a.say('apprentice', 'Apprentice Bryn', 'Go on. The Heart Tree is listening.'); })
              .then(function () { return a.say('hontori', 'One small root, one steady stand. Now the Warden takes our hand.'); });
          });
      });
  } });
  function duel(a) {
    return a.say('warden', 'Warden Fern', 'Ready? One hontori, start to end.')
      .then(function () { return a.say('warden', 'Warden Fern', 'The first in your party stands. Choose before we begin.'); })
      .then(function () { return a.choose(['Begin the ring duel', 'Not yet']); })
      .then(function (i) {
        if (i !== 0) return a.say('warden', 'Warden Fern', 'Roots do not hurry. Neither do I.');
        var lead = (S().party || [])[0], lv = Math.max(6, ((lead && lead.level) || 5) + 1);
        return a.battle('grass', { trainer: { name: 'Warden Fern', key: 'warden', spirit: 'sunsprout', level: lv, stage: 2, noCapture: true, noSwitch: true, school: { name: 'Rootwood Hall', el: 'grass', col: '#7ed957', rule: 'No switching' } }, noCapture: true })
          .then(function (r) {
            var party = S().party || []; party.forEach(function (p) { if (p && p.hp <= 0) p.hp = 1; });
            if (!r || !r.won) return a.say('warden', 'Warden Fern', 'Not this time. Rest, think, and come back.');
            a.setFlag('c2:ring');
            var s = S(); s.rings = s.rings || []; if (s.rings.indexOf('grass') < 0) s.rings.push('grass');
            a.give('ring_leaf', 'Leaf Ring', 'grass');
            /* the ring purse: 50 copper (5 silver), paid once, with the ring */
            try { H.money && H.money.add && H.money.add(50, 'ring purse'); } catch (e) {}
            return a.say('warden', 'Warden Fern', 'Well grown. The Leaf Ring is yours.')
              .then(function () { return a.say('warden', 'Warden Fern', 'Seven more schools. Each tests you in its own way.'); })
              .then(function () { return a.say('hontori', 'One ring of eight, a leaf of green. The bravest roots are seldom seen.'); });
          });
      });
  }

  // after the ring: a grey visitor in the square, and the rockslide news
  // rule: nothing is only said. The grey cloak really stands by the well, then walks off down the south lane.
  function cloakIn() {
    var list = H.game && H.game.npcs ? H.game.npcs() : null; if (!list) return null;
    var n = { key: 'greycloak', x: 21, y: 15, dir: 2, px: 21 * 16 + 8, py: 15 * 16 + 15, seed: 0.4, svc: 'story:talk', lines: [['Grey cloak', 'We will meet again.']] };
    list.push(n); return n;
  }
  function cloakOut(n) {
    if (!n) return Promise.resolve();
    return new Promise(function (r) {
      var steps = 0;
      (function step() {
        if (steps >= 7) { var l = H.game.npcs(), i = l.indexOf(n); if (i >= 0) l.splice(i, 1); return r(); }
        var fy = n.y; n.y++; n.dir = 0; steps++;
        var t0 = performance.now();
        (function tick(now) { var k = Math.min(1, (now - t0) / 300); n.py = (fy + k) * 16 + 15; n.frame = k < 0.5 ? (steps % 2 ? 1 : 3) : (steps % 2 ? 2 : 0); if (k < 1) requestAnimationFrame(tick); else step(); })(t0);
      })();
    });
  }
  // The struggle at the well. Flags: 'c2:cloakmet' (the cloak has spoken and now waits by the well),
  // 'c2:cloak' (beaten, gone). A lost duel is retried by talking to the cloak, who stays until beaten.
  // Old saves that already saw the cloak leave ('ev:c2_grey') count as done.
  function cloakDone(s) { return !!(s.flags['c2:cloak'] || s.flags['ev:c2_grey']); }
  function cloakNpc() {
    var list = H.game && H.game.npcs ? H.game.npcs() : null; if (!list) return null;
    for (var i = 0; i < list.length; i++) if (list[i] && list[i].key === 'greycloak') return list[i];
    return null;
  }
  function cloakDuel(a, n) {
    var lead = (S().party || [])[0], lv = (lead && lead.level) || 5;
    return a.battle('raven', { trainer: { name: 'Grey cloak', key: 'greycloak', team: [{ spirit: 'raven', level: Math.max(5, lv - 1) }, { spirit: 'firefly', level: lv }], noCapture: true }, noCapture: true })
      .then(function (r) {
        var party = S().party || []; party.forEach(function (p) { if (p && p.hp <= 0) p.hp = 1; });
        if (!r || !r.won) {
          if (n) n.dir = 2;
          save();
          return a.say('greycloak', 'Grey cloak', 'No harm done. I will wait here by the well.');
        }
        a.setFlag('c2:cloak'); save();
        return a.say('greycloak', 'Grey cloak', 'The Archmage will hear how strong you have grown.')
          .then(function () { return cloakOut(n); })
          .then(function () { return a.say('hontori', 'A friendly word, a closed grey eye. We smile, we listen, we pass by.'); })
          .then(function () { return F('wl:free') ? null : a.say('hontori', 'A grey cloak by a well, a grey seal on one too. The well back home is waiting for you.'); })
          .then(function () { return H.unlock && H.unlock.offerOnce ? H.unlock.offerOnce('c2') : null; });
      });
  }
  ST.defineEvent({ id: 'c2_grey', when: 'auto', once: false, map: 'mossgrove', cond: function (s) { return !!s.flags['c2:ring'] && !cloakDone(s) && !s.flags['c2:cloakmet']; }, run: function (a) {
    var n = cloakNpc() || cloakIn();
    return a.wait(400).then(function () { return a.say('kid', 'Someone in a grey cloak is watching me from the well.'); })
      .then(function () { return a.say('greycloak', 'Grey cloak', 'A ring already. The Archmage will be so pleased.'); })
      .then(function () { return a.say('greycloak', 'Grey cloak', 'He loves to meet promising Wonders. In person.'); })
      .then(function () { return a.say('greycloak', 'Grey cloak', 'The Council keeps promising hontori safe.'); })
      .then(function () { return a.say('greycloak', 'Grey cloak', 'Let me take yours. Only for safekeeping.'); })
      .then(function () { return a.say('kid', 'No. My hontori stays with me.'); })
      .then(function () { return a.say('greycloak', 'Grey cloak', 'Then show me it is safe with you.'); })
      .then(function () { a.setFlag('c2:cloakmet'); return cloakDuel(a, n); });
  } });
  // until beaten, the cloak stands by the well again whenever the kid is in Mossgrove
  ST.defineEvent({ id: 'c2_grey_stand', when: 'auto', once: false, map: 'mossgrove', cond: function (s) {
    if (!s.flags['c2:cloakmet'] || cloakDone(s) || cloakNpc()) return false;
    var p = pos(); return !!p && p.name === 'mossgrove' && !(p.x === 21 && p.y === 15);
  }, run: function () { cloakIn(); } });
  ST.defineEvent({ id: 'c2_grey_again', when: 'talk', npc: 'greycloak', map: 'mossgrove', once: false, thenService: false, cond: function (s) { return !!s.flags['c2:cloakmet'] && !cloakDone(s); }, run: function (a) {
    var n = cloakNpc();
    return a.say('greycloak', 'Grey cloak', 'Have you thought it over? It would be safe with us.')
      .then(function () { return a.say('kid', 'My hontori stays with me.'); })
      .then(function () { return a.choose(['Duel the grey cloak', 'Not yet']); })
      .then(function (i) {
        if (i !== 0) return a.say('greycloak', 'Grey cloak', 'I am in no hurry.');
        return cloakDuel(a, n);
      });
  } });

  // ---------------------------------------------------------------- The Light in the Well (pays off the hum, the flicker and the Elder's second cup)
  function night() { var e = ST.env, h = e && typeof e.time === 'number' ? e.time : 12; return h >= 19 || h < 5; }
  ST.defineQuest({ id: 'wellight', icon: 'light', title: 'The Light in the Well', desc: 'The Elder\'s old friend was sealed in the Emberbrook well.', steps: [
    { id: 'hum', text: 'Listen at the old well in Emberbrook at night', done: function () { return F('wl:hum'); } },
    { id: 'ring', text: 'The grey seal is strong. A school ring may loosen it.', done: function () { return F('c2:ring'); } },
    { id: 'free', text: function () { return 'Back at the Emberbrook well at night, draw the V'; }, done: function () { return F('wl:free'); } },
    { id: 'cup', text: 'Tell Elder Wisteria', done: function () { return F('wl:cup'); } }
  ] });
  aim('wellight', 'hum', function () { return spot('village', 29, 19); });
  aim('wellight', 'free', function () { return spot('village', 29, 19); });
  aim('wellight', 'cup', function () { return spot('village', 33, 12); });
  ST.defineEvent({ id: 'wl_start', when: 'auto', cond: function (s) { return !!s.flags['c1:well']; }, run: function () { ST.start('wellight'); } });
  ST.defineEvent({ id: 'wl_well', when: 'interact', svc: 'well', map: 'village', once: false, cond: function (s) { return !!s.flags['c1:well'] && !s.flags['wl:free']; }, run: function (a) {
    if (!night()) return a.say('kid', 'By day the well is only water. The hum comes at night.');
    if (!F('wl:hum')) {
      a.sfx('sparkle'); a.emit('sparkle', 6, 0, -8);
      return a.say('kid', 'The water hums. Far below, a small light blinks.')
        .then(function () { return a.say('kid', 'Grey wax runs around the stones, shaped like a closed eye.'); })
        .then(function () { a.setFlag('wl:hum'); return a.say('hontori', 'A light below, a seal of grey. A ring of school may clear the way.'); });
    }
    if (!F('c2:ring')) return a.say('kid', 'The light blinks, patient. The seal holds.').then(function () { return a.say('hontori', 'Rootwood Hall, a ring of green. Then we come back to this scene.'); });
    return a.say('kid', 'The Leaf Ring warms on my finger. The grey wax softens.')
      .then(function () { return a.draw('veil', 'Draw the V over the well'); })
      .then(function () {
        a.sfx('spell'); a.emit('magic', 24, 0, -10);
        return a.wait(700).then(function () { a.sfx('sparkle'); a.emit('sparkle', 20, 0, -24); return a.wait(500); });
      })
      .then(function () { return a.say('light', 'Lumen', 'Long in the dark, I counted the days. A ring and a V, and here is the blaze.'); })
      .then(function () { return a.say('light', 'Lumen', 'Take me to Wisteria, child of the eye. Her second cup waits, and so do I.'); })
      .then(function () { a.setFlag('wl:free'); a.toast('Lumen is free'); });
  } });
  ST.defineEvent({ id: 'wl_cup', when: 'talk', npc: 'Elder Wisteria', cond: function (s) { return !!s.flags['wl:free'] && !s.flags['wl:cup']; }, run: function (a) {
    return a.say('elder', 'Elder Wisteria', 'That warm light behind you. Lumen? Is it you?')
      .then(function () { return a.say('light', 'Lumen', 'Your tea went cold a thousand times. Pour it warm, and I will stay.'); })
      .then(function () { return a.say('elder', 'Elder Wisteria', 'Forty years I set that cup. Thank you, little Wonder.'); })
      .then(function () { return a.say('light', 'Lumen', 'A gift for the hand that set me free: a star that wakes what fell, from me.'); })
      .then(function () {
        var s = S(); s.spells = s.spells || []; if (s.spells.indexOf('revive') < 0) s.spells.push('revive');
        a.sfx('wand'); a.toast('New spell: Dawn Star'); a.setFlag('wl:cup'); save();
        return a.say('elder', 'Elder Wisteria', 'The old law still stands. Keep Lumen our secret.');
      });
  } });
  ST.defineEvent({ id: 'c2_rowan', when: 'talk', npc: 'Rowan', map: 'mossgrove', cond: function (s) { return !!s.flags['c2:ring']; }, run: function (a) {
    return a.say('traveler', 'Rowan', 'The road to Whistling Pass? A rockslide closed it. They are clearing it now.')
      .then(function () { return a.say('traveler', 'Rowan', 'Until then, the forest has plenty to find. Keep your eyes open.'); });
  } });

  H.chapter2 = { spot: spot };
})();
