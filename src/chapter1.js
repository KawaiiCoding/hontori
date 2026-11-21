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
  function pos() { var c = H.game && H.game.currentMap && H.game.currentMap(); return c && c.player ? { x: c.player.tx, y: c.player.ty, name: c.name } : null; }

  // ---------------------------------------------------------------- quests
  ST.defineQuest({ id: 'academy', title: 'The Academy', desc: 'Emberbrook Academy teaches one spell: the Binding Spiral.', steps: [
    { id: 'go', text: 'Go to Emberbrook Academy, north of the square', done: function (s) { return !!s.academy || !!s.flags['visited:school']; } },
    { id: 'trial', text: 'Pass the gate trial', done: function (s) { return !!s.academy; } },
    { id: 'duel', text: 'Win a practice duel with Ash or Mira', done: function () { return duels(); } },
    { id: 'bind', text: 'Learn the Binding Spiral from Madam Sorrel', done: function () { return spells().indexOf('bind') >= 0; } }
  ], reward: function () { ST.start('pawprints'); ST.start('woods'); openWoods(); } });

  ST.defineQuest({ id: 'pawprints', title: 'Wet Pawprints', desc: 'Something leaves wet pawprints in the village at night.', steps: [
    { id: 'pip', text: 'Ask Pip at home about the pawprints', done: function () { return F('c1:pip'); } },
    { id: 'pond', text: 'Wait by the village pond after dusk', done: function () { return F('c1:pond'); } },
    { id: 'bind', text: 'Weaken the shy water hontori and bind it', done: function () { return F('c1:brook'); } }
  ], reward: function () { ST.start('elder'); } });

  ST.defineQuest({ id: 'elder', title: 'The Elder\'s Second Cup', desc: 'Elder Wisteria sets a second cup of tea each morning.', steps: [
    { id: 'family', text: 'Talk to Fenn or Lark in their house', done: function () { return F('c1:fenn'); } },
    { id: 'elder', text: 'Ask Elder Wisteria about the well', done: function () { return F('c1:well'); } }
  ] });

  ST.defineQuest({ id: 'woods', title: 'Beyond the Trees', desc: 'The south road leads to Whisperwood.', steps: [
    { id: 'gate', text: 'Guard Bram opens the south gate', done: function () { return ST.isDone('academy'); } },
    { id: 'wood', text: 'Walk the south road into Whisperwood', done: function (s) { return ST.isDone('academy') && !!s.flags['visited:whisperwood']; } }
  ] });

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
      .then(function () { return picker(); })
      .then(function (ids) {
        ids.forEach(function (id) { var it = H.items.list.filter(function (x) { return x.id === id; })[0]; H.game.addItem(id, it ? it.name : id, id); });
        a.setFlag('c1:morning'); a.setFlag('c1:packed', ids);
        setParents();
        a.toast('Packed 5 things');
        return a.say('hontori', 'To the Academy, up the hill. Learn the spiral, and learn it well.');
      })
      .then(function () { ST.start('academy'); });
  } });

  var USE = { backpack: 'Room for one more', lantern: 'Light in dark places', teddy: 'Calm on scary nights', cookbook: 'Cook warm meals anywhere',
    compass: 'Never lose your way', scarf: 'Warm in cold wind', slingshot: 'Knock down far things', bread: 'Spirits love a crust',
    map: 'See the whole area', candle: 'A small steady flame', kite: 'Ride the wind higher', mirror: 'See through the veil' };
  var CSS = [
    '.c1-pick{position:absolute;inset:0;z-index:47;background:rgba(5,6,14,.7);display:flex;align-items:center;justify-content:center;padding:12px;opacity:0;transition:opacity .25s}',
    '.c1-pick.on{opacity:1}',
    '.c1-box{width:100%;max-width:520px;max-height:100%;overflow:auto;border-radius:20px;background:linear-gradient(180deg,#1b1e3a,#101226);border:2px solid #d9a85a;box-shadow:0 10px 40px rgba(0,0,0,.6);padding:16px;color:#f4f1e8;font-family:Nunito,"M PLUS Rounded 1c",system-ui,sans-serif}',
    '.c1-box h2{margin:0 0 2px;font-size:20px;font-weight:900;text-align:center}',
    '.c1-box p{margin:0 0 12px;text-align:center;font-weight:700;opacity:.75;font-size:14px}',
    '.c1-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}',
    '.c1-it{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border-radius:14px;background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.14);color:inherit;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}',
    '.c1-it canvas{width:40px;height:40px;image-rendering:pixelated}',
    '.c1-it b{font-size:14px;font-weight:900}',
    '.c1-it small{font-size:11px;font-weight:700;opacity:.7;line-height:1.2;text-align:center}',
    '.c1-it.on{border-color:#ffc56b;background:rgba(255,197,107,.16);box-shadow:0 0 12px rgba(255,176,74,.35)}',
    '.c1-it.off{opacity:.45}',
    '.c1-go{display:block;width:100%;margin-top:12px;padding:12px;border-radius:14px;border:0;background:#ffc56b;color:#2a1a08;font:900 16px Nunito,system-ui,sans-serif;cursor:pointer}',
    '.c1-go:disabled{background:rgba(255,255,255,.15);color:rgba(255,255,255,.5);cursor:default}'
  ].join('\n');
  var styled = false;
  function style() { if (styled) return; styled = true; var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); }
  function root() { return document.getElementById('root') || document.body; }

  // grid of the 12 home items; resolves with exactly 5 ids
  function picker() {
    style();
    return new Promise(function (res) {
      var picked = [], o = document.createElement('div');
      o.className = 'c1-pick hq-pick';
      o.innerHTML = '<div class="c1-box"><h2>Pick 5 things for your backpack</h2><p>Chosen: <span>0</span> of 5</p><div class="c1-grid"></div><button class="c1-go" type="button" disabled>Pack the bag</button></div>';
      var grid = o.querySelector('.c1-grid'), go = o.querySelector('.c1-go'), cnt = o.querySelector('p span');
      var btns = H.items.list.map(function (it) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'c1-it';
        var cv = document.createElement('canvas'); cv.width = 16; cv.height = 16;
        try { H.items.draw(cv.getContext('2d'), it.id, 0, 0); } catch (e) {}
        var nm = document.createElement('b'); nm.textContent = it.name;
        var us = document.createElement('small'); us.textContent = USE[it.id] || '';
        b.appendChild(cv); b.appendChild(nm); b.appendChild(us);
        b.addEventListener('click', function () {
          var i = picked.indexOf(it.id);
          if (i >= 0) picked.splice(i, 1); else if (picked.length < 5) picked.push(it.id); else return;
          try { H.audio && H.audio.sfx('confirm'); } catch (e) {}
          render();
        });
        grid.appendChild(b); return { b: b, id: it.id };
      });
      function render() {
        btns.forEach(function (x) { var on = picked.indexOf(x.id) >= 0; x.b.classList.toggle('on', on); x.b.classList.toggle('off', !on && picked.length >= 5); });
        cnt.textContent = picked.length; go.disabled = picked.length !== 5;
      }
      go.addEventListener('click', function () {
        if (picked.length !== 5) return;
        o.classList.remove('on'); setTimeout(function () { o.remove(); }, 260); res(picked.slice());
      });
      o.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      root().appendChild(o);
      requestAnimationFrame(function () { o.classList.add('on'); });
    });
  }

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
      .then(function () { return a.say('hontori', 'Gentle now, it is afraid. Tire it out, then bind, unswayed.'); })
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
    return a.say('dad', 'Fenn', 'The Elder never talks about the well.')
      .then(function () { return a.say('dad', 'Fenn', 'Maybe she will talk to you.'); })
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
      .then(function () { a.give('grey_letter', 'Sealed Letter', 'map'); a.setFlag('c1:complete'); });
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
  ST.defineEvent({ id: 'c1_tip_night', when: 'auto', cond: function (s) { var h = hour(); return s.flags['c1:morning'] && (h >= 20 || h < 5); }, run: function (a) {
    a.setFlag('tip:night');
    return a.say('hontori', 'The stars are out, the lanterns low. Sleep in a bed, then on we go.');
  } });

  H.chapter1 = { picker: picker, openWoods: openWoods };
})();
