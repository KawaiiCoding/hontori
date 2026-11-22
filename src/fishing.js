window.H = window.H || {};
// Fishing. Old Oru, the fisherman of Emberbrook, teaches the Fishing Sigil once (a hook drawn into the air).
// With it the kid can fish in any water: rivers, ponds, streams, later lakes and the sea.
// A cast costs 1 mana. It can bring a fish (sell it, or cook it with the cookbook), a water hontori to calm,
// or nothing but weeds. Fish kinds and hontori levels depend on the place, the time and the weather.
// After teaching, Oru offers a friendly fishing contest once a day.
(function () {
  'use strict';
  var H = window.H;
  function S() { return (H.game && H.game.state) || {}; }
  function F() { var s = S(); return (s.flags = s.flags || {}); }
  function knows() { return (S().spells || []).indexOf('fish') >= 0; }
  function api(c) { return H.story && H.story.api ? H.story.api(c || {}) : null; }
  function toast(t) { try { H.ui && H.ui.toast(t); } catch (e) {} }
  function save() { try { H.game && H.game.save(); } catch (e) {} }

  // ---------- fish of each place: [id, name, sell copper, weight range kg, night only]
  var WATERS = {
    village: { name: 'the river', fish: [['minnow', 'River Minnow', 2, [0.1, 0.3]], ['carp', 'Silver Carp', 5, [0.6, 2.2]], ['moonfin', 'Moonfin', 14, [0.4, 1.1], true]], hontori: ['water', 'frog'] },
    whisperwood: { name: 'the stream', fish: [['trout', 'Brook Trout', 6, [0.4, 1.6]], ['perch', 'Stripe Perch', 4, [0.2, 0.9]], ['glowgill', 'Glowgill', 16, [0.3, 0.8], true]], hontori: ['frog', 'water'] },
    mossgrove: { name: 'Mirror Pond', fish: [['koi', 'Moss Koi', 9, [0.8, 3.0]], ['bass', 'Mirror Bass', 7, [0.7, 2.4]], ['starkoi', 'Star Koi', 22, [1.0, 3.5], true]], hontori: ['frog', 'water'] },
    sea: { name: 'the sea', fish: [['mackerel', 'Blue Mackerel', 6, [0.4, 1.4]], ['snapper', 'Red Snapper', 10, [1.0, 4.0]], ['tidefin', 'Tidefin', 28, [2.0, 7.0], true]], hontori: ['water', 'frog', 'crab'] }
  };
  function waterOf(name) { return WATERS[name] || WATERS.village; }
  // every fish can be sold (trade pouch) or cooked
  function registerFish() {
    if (!H.money || !H.money.TRADE) return;
    Object.keys(WATERS).forEach(function (k) { WATERS[k].fish.forEach(function (f) { H.money.TRADE[f[0]] = [f[1], 'water', f[2], 'Fresh from ' + WATERS[k].name + '. Sell it, or cook it at a stove.']; }); });
  }
  function night(env) { var h = env && env.time != null ? env.time : 12; return h >= 19 || h < 5; }

  function cast(c, contest) {
    var a = api(c), s = S(), mana = s.mana == null ? (s.maxMana || 3) : s.mana;
    if (mana < 1) return a.say('hontori', 'No mana left for the line. Herbs or rest, and it will shine.').then(function () { return null; });
    return a.draw('fish', contest ? 'Contest cast: draw the hook' : 'Draw the hook to cast').then(function () {
      s.mana = mana - 1; a.sfx('wand'); a.emit('sparkle', 10, 0, 0);
      toast('Mana ' + s.mana + ' / ' + (s.maxMana || 3));
      return a.wait(900 + Math.random() * 900);
    }).then(function () {
      var W = waterOf(c.mapName), env = c.env || {}, nt = night(env), rain = env.weather === 'rain';
      var r = Math.random(), pH = contest ? 0 : (rain ? 0.4 : 0.28), pNone = 0.12;
      if (r < pH) return { hontori: W.hontori[Math.floor(Math.random() * W.hontori.length)] };
      if (r < pH + pNone) return { none: true };
      var pool = W.fish.filter(function (f) { return !f[4] || nt; }), f = pool[Math.floor(Math.random() * pool.length)];
      if (Math.random() < 0.15 && nt) f = W.fish[W.fish.length - 1];
      var kg = Math.round((f[3][0] + Math.random() * (f[3][1] - f[3][0])) * 10) / 10;
      return { fish: f, kg: kg };
    });
  }
  function keep(a, res) {
    var f = res.fish; H.game.addItem(f[0], f[1], 'water'); a.sfx('pickup'); save();
    try { H.ui.helper('fishcatch', 'Fish', 'Fish go into your trade pouch. Sell them to Nettle, or cook one at a stove with the cookbook.', 'water'); } catch (e) {}
    return a.say('kid', 'A ' + f[1] + '! ' + res.kg + ' kg.');
  }
  function fish(c) {
    var a = api(c); if (!a) return Promise.resolve();
    if (!knows()) return a.say('kid', 'The water is clear and cold.').then(function () { if (!F()['fish:hint']) { F()['fish:hint'] = 1; return a.say('hontori', 'Fish swim deep, and so do friends. Old Oru knows where the river bends.'); } });
    return a.choose([{ label: 'Fish here', desc: 'Costs 1 mana' }, { label: 'Not now' }]).then(function (i) {
      if (i !== 0) return;
      return cast(c, false).then(function (res) {
        if (!res) return;
        if (res.none) return a.say('kid', 'Only weeds this time.');
        if (res.hontori) {
          var lv = (H.maps[c.mapName] && H.maps[c.mapName].wildLevel) || [2, 4], level = lv[0] + Math.floor(Math.random() * (lv[1] - lv[0] + 1));
          return a.say('kid', 'Something big pulls back. A hontori!').then(function () { return a.battle(res.hontori, { level: level }); });
        }
        return keep(a, res);
      });
    });
  }
  H.onWater = function (c) { registerFish(); return fish(c); };

  // ---------- Old Oru: teaches once, then a daily contest
  // any fisher can teach the sigil the first time you talk; after that, each one offers the contest
  function oru(c) {
    var a = api(c); registerFish();
    var nm = (c && c.object && c.object.lines && c.object.lines[0] && c.object.lines[0][0]) || 'Old Oru';
    if (!knows()) {
      return a.say('fisher', nm, 'You have the open eyes, I can tell. Then you can fish the way we used to.')
        .then(function () { return a.say('fisher', nm, 'No rod. A hook of light. Straight down, then curl it up to the left.'); })
        .then(function () { return a.draw('fish', 'Draw the hook, like Oru shows you'); })
        .then(function () {
          var s = S(); s.spells = s.spells || []; if (s.spells.indexOf('fish') < 0) s.spells.push('fish'); save();
          return a.say('fisher', nm, 'There. Face any water and cast. Sometimes a fish, sometimes a friend.');
        })
        .then(function () { return a.say('fisher', nm, 'Come back any day. I will race you for the biggest catch.'); });
    }
    var s = S(), day = s.day || 0;
    if (F()['fish:contest'] === day) return a.say('fisher', nm, 'One contest a day, or the fish get shy. Tomorrow.');
    return a.say('fisher', nm, 'A contest? Three casts each. The heaviest fish wins.')
      .then(function () { return a.choose([{ label: 'Fishing contest', desc: '3 casts, 1 mana each' }, { label: 'Not today' }]); })
      .then(function (i) {
        if (i !== 0) return a.say('fisher', nm, 'The river will wait.');
        F()['fish:contest'] = day; save();
        var best = 0, n = 0;
        function one() {
          n++;
          return cast(c, true).then(function (res) {
            if (!res) return 'stop';
            if (res.fish) { best = Math.max(best, res.kg); return keep(a, res); }
            return a.say('kid', 'Nothing on that one.');
          }).then(function (r) { return r !== 'stop' && n < 3 ? one() : null; });
        }
        return one().then(function () {
          var W = waterOf(c.mapName), his = Math.round((W.fish[1][3][0] + Math.random() * (W.fish[1][3][1] - W.fish[1][3][0])) * 10) / 10;
          return a.say('fisher', nm, 'My best: ' + his + ' kg. Yours: ' + best + ' kg.').then(function () {
            if (best > his) { if (H.money) H.money.add(20, 'contest prize'); return a.say('fisher', nm, 'You beat me fair. Here, two silver.'); }
            return a.say('fisher', nm, best ? 'Close one. The river liked me today.' : 'An empty bucket. It happens to all of us.');
          });
        });
      });
  }
  (function hook() {
    if (!H.interact || !H.interact.run || !H.story) { setTimeout(hook, 300); return; }
    if (H.interact.__fish) return; H.interact.__fish = true; registerFish();
    var has0 = H.interact.has, run0 = H.interact.run;
    H.interact.has = function (t) { return t === 'fishing' || has0.apply(this, arguments); };
    H.interact.run = function (t, c) {
      if (t === 'fishing') return oru(c);
      // a fish at the stove with the cookbook: a hearty meal (full health and stamina)
      if (t === 'stove' && H.pickups && H.pickups.has('cookbook')) {
        var it = (S().items || []).filter(function (i) { return H.money && H.money.TRADE[i.id] && /Fresh from/.test(H.money.TRADE[i.id][3]); })[0];
        if (it) {
          var a = api(c), self = this, args = arguments;
          return a.choose([{ label: 'Cook the ' + it.name, desc: 'Full health and stamina for everyone' }, { label: 'Something else' }]).then(function (i) {
            if (i !== 0) return run0.apply(self, args);
            if (it.n > 1) it.n--; else S().items.splice(S().items.indexOf(it), 1);
            (S().party || []).forEach(function (p) { if (p.maxHp) p.hp = p.maxHp; if (H.progress && H.progress.staMax) p.sta = H.progress.staMax(p.level); });
            a.sfx('sizzle'); save(); toast('Party fully rested');
            return a.say('kid', 'Grilled ' + it.name + '. Everyone is full and happy.');
          });
        }
      }
      return run0.apply(this, arguments);
    };
    // Oru's own service: talking to him starts the lesson or the contest
    Object.keys(H.maps || {}).forEach(function (mn) { (H.maps[mn].npcs || []).forEach(function (n) { if (n.key === 'fisher') { n.svc = 'fishing'; n.lines = [n.lines && n.lines[0] ? n.lines[0] : ['Fisher', 'The water is calm today.']]; } }); });
  })();
  // when the kid stands facing water and knows the sigil, a small glowing hook ripples on that water: fish here
  H.worldDraw = H.worldDraw || [];
  H.worldDraw.push(function (ents, lights, ctx, env, mapName, player) {
    if (!knows() || !player || player.moving || (H.ui && H.ui.isOpen && H.ui.isOpen())) return;
    var c = H.game.currentMap && H.game.currentMap(); if (!c || !c.tileAt) return;
    var D = [[0, 1], [0, -1], [-1, 0], [1, 0]][player.dir] || [0, 1], x = player.tx + D[0], y = player.ty + D[1];
    if (c.tileAt(x, y) !== 'water') return;
    var t = env.t || 0, cx = (player.tx + D[0] * 1.8) * 16 + 8, cy = (player.ty + D[1] * 1.8) * 16 + 9, k = (t * 0.9) % 1;   // out on the water, past the fox
    ents.push({ y: 1e9, d: function () {   // drawn on top so the fox never hides it
      ctx.save();
      // a ripple ring where the line would land
      ctx.strokeStyle = 'rgba(220,245,255,' + (0.9 - k * 0.9).toFixed(2) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(cx, cy + 3, 3 + k * 6, 1.5 + k * 2.5, 0, 0, 7); ctx.stroke();
      // a small marker above it, like the game's buttons: dark rounded square, light border, a pixel hook inside
      var bx = Math.round(cx) - 7, by = Math.round(cy - 18 + Math.sin(t * 3) * 1.2);
      ctx.fillStyle = 'rgba(18,20,40,.92)'; ctx.fillRect(bx + 1, by, 12, 14); ctx.fillRect(bx, by + 1, 14, 12);
      ctx.fillStyle = '#bfe8ff'; ctx.fillRect(bx + 1, by - 1, 12, 1); ctx.fillRect(bx + 1, by + 14, 12, 1); ctx.fillRect(bx - 1, by + 1, 1, 12); ctx.fillRect(bx + 14, by + 1, 1, 12);
      ctx.fillStyle = 'rgba(18,20,40,.92)'; ctx.fillRect(bx + 5, by + 14, 4, 2); ctx.fillRect(bx + 6, by + 16, 2, 1);   // little tail pointing down to the water
      ctx.fillStyle = '#7fd8ff';
      [[8, 2], [8, 3], [8, 4], [8, 5], [8, 6], [8, 7], [8, 8], [7, 9], [6, 10], [5, 10], [4, 9], [4, 8], [5, 7]].forEach(function (q) { ctx.fillRect(bx + q[0], by + q[1], 1.2, 1.2); });
      ctx.fillStyle = '#ffffff'; ctx.fillRect(bx + 8, by + 2, 1, 1);
      ctx.restore(); } });
    lights.push({ x: cx, y: cy, r: 8, color: '#7fd8ff', flicker: false, soft: true });
    try { H.ui.helper('fishspot', 'Fishing', 'Water in front of you. Press A, or tap the water, to cast the Fishing Sigil.', 'water'); } catch (e) {}
  });
  // a fisher who sits on the bank has a line in the water, with a bobber that dips now and then
  H.worldDraw = H.worldDraw || [];
  H.worldDraw.push(function (ents, lights, ctx, env, mapName) {
    var m = H.maps[mapName]; if (!m || !m.npcs) return;
    m.npcs.forEach(function (n) {
      if (n.key !== 'fisher' || !n.fixed) return;
      var dx = n.dir === 3 ? 1 : n.dir === 2 ? -1 : 0, dy = n.dir === 0 ? 1 : n.dir === 1 ? -1 : 0; if (!dx && !dy) return;
      var t = env.t || 0, rx = n.x * 16 + 8 + dx * 7, ry = n.y * 16 + 1, bx = (n.x + dx * 1.6) * 16 + 8, by = (n.y + dy * 1.6) * 16 + 10 + (Math.sin(t * 2 + n.x) > 0.93 ? 2 : Math.sin(t * 1.3) * 0.6);
      ents.push({ y: n.y * 16 + 16, d: function () {
        ctx.strokeStyle = 'rgba(240,240,230,.75)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.quadraticCurveTo((rx + bx) / 2, Math.min(ry, by) - 2, bx, by - 1); ctx.stroke();
        ctx.fillStyle = '#e8483a'; ctx.fillRect(Math.round(bx) - 1, Math.round(by) - 2, 2, 2); ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(bx) - 1, Math.round(by) - 1, 2, 1);
        ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(bx, by, 3 + Math.sin(t * 2) , 1, 0, 0, 7); ctx.stroke();
      } });
    });
  });
  (function () {
  })();
  H.fishing = { waters: WATERS, cast: cast };
})();
