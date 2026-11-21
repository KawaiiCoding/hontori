window.H = window.H || {};
// academy: Emberbrook Academy, the first school. Madam Sorrel teaches the basic sigils,
// students Ash and Mira hold practice duels, and a Novice Certificate waits at the end.
(function () {
  'use strict';
  var H = window.H;
  if (!H.interact) return;

  var TEACH = ['elder', 'Madam Sorrel'];
  var LESSONS = [
    { kind: 'mend', name: 'Mending Sigil', draw: 'Draw a circle to mend', lines: [
      'You know this one already. A full circle, closed and calm.',
      'A circle has no corners, so the hurt has nowhere to hide.'] },
    { kind: 'shield', name: 'Aegis Ward', draw: 'Draw the ward to shield', lines: [
      'A ward stands between your spirit and the blow.',
      'Draw it firm and steady, like a door you mean to close.'] },
    { kind: 'boost', name: 'Rally Rune', draw: 'Draw the rune to rally', lines: [
      'A rally rune lends your spirit a little of your courage.',
      'Draw it upward. Courage always rises.'] },
    { kind: 'stun', name: 'Thunder Seal', draw: 'Draw the zigzag to stun', lines: [
      'The thunder seal is a zigzag, quick as a flash.',
      'A stunned spirit loses its turn. Use it kindly.'] },
    { kind: 'sleep', name: 'Dream Veil', draw: 'Draw the wave to lull', lines: [
      'The dream veil is a slow wave, like breath at night.',
      'A sleeping spirit rests until it is struck.'] },
    { kind: 'absorb', name: 'Binding Spiral', draw: 'Draw the spiral inward to bind', needDuel: true, lines: [
      'You have duelled, so you are ready for the binding spiral.',
      'Draw it from the outside in, two full turns.',
      'Only a tired spirit will listen. Never bind in anger.'] }
  ];
  var FALLBACK = { shield: 'mend', boost: 'veil' };
  var STUDENTS = {
    boy: { name: 'Ash', enemy: 'electric', level: 2, lesson: 'stun',
      hello: 'Want a practice duel? My spark is getting bigger.', win: 'You got me. Good duel.', lose: 'Ha. Try again when you are ready.' },
    girl: { name: 'Mira', enemy: 'water', level: 3, lesson: 'sleep',
      hello: 'A practice duel? My little otter is quick.', win: 'Well drawn. My otter needs a nap now.', lose: 'The water was kind to me this time.' }
  };

  function P(v) { return (v && typeof v.then === 'function') ? v : Promise.resolve(v); }
  function say(c, key, name, text) { return c && c.say ? P(c.say(key, name, text)) : Promise.resolve(); }
  function sorrel(c, text) { return say(c, TEACH[0], TEACH[1], text); }
  function fox(c, text) { return c && c.hasSpirit ? say(c, 'hontori', 'Hontori', text) : Promise.resolve(); }
  function toast(c, t) { if (c && c.toast) c.toast(t); else if (H.ui && H.ui.toast) H.ui.toast(t); }
  function emit(c, kind, n) { if (c && c.emit) c.emit(kind, c.x || 0, (c.y || 0) - 10, n); }
  function sfx(c, n) { if (c && c.sfx) c.sfx(n); }
  function save() { try { H.game && H.game.save(); } catch (e) {} }
  function seq(c, fn, lines) { return lines.reduce(function (p, l) { return p.then(function () { return fn(c, l); }); }, Promise.resolve()); }

  function st() {
    var s = (H.game && H.game.state) || {};
    if (!Array.isArray(s.spells)) s.spells = ['mend'];
    if (!s.academyLessons || typeof s.academyLessons !== 'object') s.academyLessons = {};
    if (!s.academyDuels || typeof s.academyDuels !== 'object') s.academyDuels = {};
    return s;
  }
  function duelsWon(s) { return Object.keys(STUDENTS).filter(function (k) { return s.academyDuels[k]; }).length; }
  function lessonDone(s, L) { return !!s.academyLessons[L.kind]; }
  function nextLesson(s) { for (var i = 0; i < LESSONS.length; i++) if (!lessonDone(s, LESSONS[i])) return i; return -1; }
  function unlocked(s, i) { return i === nextLesson(s) && (!LESSONS[i].needDuel || duelsWon(s) > 0); }

  // does H.gesture know this shape yet? (shield and boost may arrive later)
  function hasShape(kind) {
    if (!H.gesture || !H.gesture.recognize) return false;
    var pts = []; for (var i = 0; i < 12; i++) pts.push([i * 10, (i % 2) * 10]);
    try { H.gesture.recognize(pts, [kind]); return true; } catch (e) { return false; }
  }
  function practice(L) {
    if (!H.gesture || !H.gesture.prompt) return Promise.resolve();
    var k = hasShape(L.kind) ? L.kind : (hasShape(FALLBACK[L.kind]) ? FALLBACK[L.kind] : 'mend');
    return P(H.gesture.prompt(k, L.draw));
  }

  // open a choice list and highlight one entry
  function choose(opts, hi) {
    if (!H.ui || !H.ui.choose) return Promise.resolve(-1);
    var pr = P(H.ui.choose(opts));
    if (hi > 0) setTimeout(function () {
      var b = document.querySelectorAll('.hui-ch button')[hi];
      if (b) b.dispatchEvent(new Event('pointerenter'));
    }, 30);
    return pr;
  }

  function teach(c, i) {
    var s = st(), L = LESSONS[i];
    return seq(c, sorrel, L.lines)
      .then(function () { return sorrel(c, 'Now you try. Follow the glowing line.'); })
      .then(function () { return practice(L); })
      .then(function () {
        s = st();
        s.academyLessons[L.kind] = true;
        if (s.spells.indexOf(L.kind) < 0) s.spells.push(L.kind);
        save(); sfx(c, 'sparkle'); emit(c, 'magic', 14);
        toast(c, (i === 0 ? 'Reviewed: ' : 'Learned: ') + L.name);
        return sorrel(c, i === 0 ? 'Neat and round. Good.' : 'Well done. It is yours now.');
      })
      .then(function () { return i === LESSONS.length - 1 ? fox(c, 'Round and round, the bond is found.') : fox(c, 'A brand new sign, your wand will shine.'); });
  }

  function wheel(c) {
    return sorrel(c, 'Every element is strong against two and weak against others.')
      .then(function () { return sorrel(c, 'Study the wheel on the board. Tap a spirit to see its matches.'); })
      .then(function () { return H.closeup && H.closeup.blackboard ? P(H.closeup.blackboard()) : null; })
      .then(function () { var s = st(); if (!s.academyLessons.wheel) { s.academyLessons.wheel = true; save(); toast(c, 'Studied: Element Wheel'); } });
  }

  function graduate(c) {
    var s = st();
    s.academyGraduated = true;
    if (H.game && H.game.addItem) H.game.addItem('novice_cert', 'Novice Certificate', 'wand');
    save(); sfx(c, 'sparkle'); emit(c, 'sparkle', 24);
    toast(c, 'Got Novice Certificate');
    return seq(c, sorrel, [
      'Every lesson learned, and both duels done. You are a novice now.',
      'This school gives no ring. Rings come from the elemental schools beyond the village.',
      'Each one tests a single element. Win there, and the ring is yours.'])
      .then(function () { return fox(c, 'Beyond the hill the schools await, a ring for each, we will not be late.'); });
  }

  function ready(s) { return nextLesson(s) < 0 && duelsWon(s) >= Object.keys(STUDENTS).length; }

  function lessons(c) {
    var s = st();
    if (s.academyGraduated) return sorrel(c, 'Come back and review whenever you like, novice.').then(function () { return menu(c); });
    if (ready(s)) return graduate(c);
    return menu(c);
  }

  function menu(c) {
    var s = st(), nx = nextLesson(s);
    var opts = LESSONS.map(function (L, i) {
      var tag = lessonDone(s, L) ? ' (done)' : i === nx ? (unlocked(s, i) ? ' (next)' : ' (win a duel first)') : '';
      return (i + 1) + '. ' + L.name + tag;
    });
    opts.push('Element Wheel' + (s.academyLessons.wheel ? ' (done)' : ''));
    opts.push('Leave');
    return choose(opts, nx < 0 ? -1 : nx).then(function (i) {
      if (i < 0 || i === opts.length - 1) return sorrel(c, 'Off you go. Practise between lessons.');
      if (i === LESSONS.length) return wheel(c).then(after);
      var L = LESSONS[i];
      if (lessonDone(s, L)) return teach(c, i).then(after);
      if (i !== nx) return sorrel(c, 'One step at a time. Finish ' + LESSONS[nx].name + ' first.');
      if (!unlocked(s, i)) return sorrel(c, 'Binding comes after a real duel. Ask Ash or Mira for one.');
      return teach(c, i).then(after);
    });
    function after() {
      var s2 = st();
      if (!s2.academyGraduated && ready(s2)) return graduate(c);
      if (nextLesson(s2) >= 0 && LESSONS[nextLesson(s2)].needDuel && !duelsWon(s2)) return sorrel(c, 'Next, duel a classmate. Ash and Mira are waiting.');
    }
  }

  function duel(c) {
    var key = (c && c.object && c.object.key) || 'boy', S = STUDENTS[key];
    if (!S) return Promise.resolve();
    var s = st(), done = !!s.academyDuels[key];
    return say(c, key, S.name, done ? 'Another round? Just for practice.' : S.hello)
      .then(function () { return choose(['Duel ' + S.name, 'Not now'], -1); })
      .then(function (i) {
        if (i !== 0) return say(c, key, S.name, 'Whenever you are ready.');
        if (!H.battle || !H.battle.start) return say(c, key, S.name, 'Hm, the duel circle is closed today.');
        var spec = (H.spirits && H.spirits.list || []).filter(function (p) { return p.element === S.enemy; })[0];
        var enemy = spec ? spec.key : S.enemy;
        return P(H.battle.start({ env: c.env, enemy: enemy,
          trainer: { name: S.name, key: key, spirit: enemy, level: S.level, lesson: S.lesson, noCapture: true } }))
          .then(function (r) {
            var party = (H.game && H.game.state && H.game.state.party) || [];
            party.forEach(function (p) { if (p && p.maxHp) p.hp = p.maxHp; }); // practice spirits rest quickly
            if (r && r.fled) return say(c, key, S.name, 'Running is allowed. Come back anytime.');
            if (r && r.won === false) { save(); return say(c, key, S.name, S.lose); }
            var s2 = st(), first = !s2.academyDuels[key];
            s2.academyDuels[key] = true; save();
            if (first) { sfx(c, 'confirm'); toast(c, 'Duel won: ' + S.name); }
            return say(c, key, S.name, S.win).then(function () {
              if (first && duelsWon(s2) === 1) return fox(c, 'A duel well won, the spiral lesson has begun.')
                .then(function () { toast(c, 'Binding Spiral lesson unlocked'); });
              if (first && ready(s2) && !s2.academyGraduated) return fox(c, 'Lessons and duels, all complete, Madam Sorrel you should meet.');
            });
          });
      });
  }

  var run0 = H.interact.run, has0 = H.interact.has;
  H.interact.has = function (t) { return t === 'academy_lessons' || t === 'academy_duel' || has0.call(this, t); };
  H.interact.run = function (t, c) {
    if (t === 'academy_lessons') return lessons(c);
    if (t === 'academy_duel') return duel(c);
    return run0.apply(this, arguments);
  };
  H.academy = { lessons: LESSONS, students: STUDENTS };
})();
