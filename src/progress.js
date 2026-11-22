window.H = window.H || {};
// Progress: hontori EXP, levels and evolution stages; wand EXP and levels; the Wand Sanctum (storage).
// Also wraps H.battle.start so every battle ends with a results card and any evolutions.
(function () {
  var H = window.H;
  var STAGE_LV = [1, 5, 10, 20, 25];          // level a hontori may reach each stage at
  var TIER = ['', 'Bright', 'Grand', 'Elder', 'Radiant'];
  var MAX_LV = 60, WAND_MAX = 10, PARTY_MAX = 5;

  function sfx(n) { try { H.audio && H.audio.sfx(n); } catch (e) {} }
  function toast(t) { try { H.ui && H.ui.toast(t); } catch (e) {} }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function st() { return (H.game && H.game.state) || {}; }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  function spec(key) { return (H.spirits && H.spirits.list.filter(function (s) { return s.key === key; })[0]) || { key: key, name: key, element: 'fire' }; }

  // ---------- hontori stats
  function need(L) { var d = L - 1; return Math.round(12 + 6 * d + 0.9 * d * d); }   // EXP from L to L+1
  function hpAt(L, stage) { return 20 + (L - 1) * 4 + ((stage || 1) - 1) * 4; }
  function atkAt(L, stage) { return Math.round(5 + (L - 1) * 1.5 + ((stage || 1) - 1) * 2); }
  // stamina: hontori moves use it; only rest refills it (bed, sleep, ramen, the teddy outdoors)
  function staMax(L) { return 10 + (L || 1); }
  function staCost(mv) { var p = (mv && mv.pow) || 0; return !p ? 1 : p <= 6 ? 1 : p <= 8 ? 2 : 3; }
  function restMember(m) { if (!m) return; if (m.maxHp) m.hp = m.maxHp; m.sta = staMax(m.level); }
  function stageFor(L) { var s = 1; for (var i = 1; i < STAGE_LV.length; i++) if (L >= STAGE_LV[i]) s = i + 1; return s; }

  function newMember(key, level) {
    var L = Math.max(1, Math.min(MAX_LV, level | 0 || 1)), s = stageFor(L);
    var m = { key: key, nick: null, level: L, exp: 0, stage: s, hp: hpAt(L, s), maxHp: hpAt(L, s), atk: atkAt(L, s) };
    return fixMoves(m);
  }
  function fix(m) {
    if (!m || typeof m !== 'object') return m;
    m.level = Math.max(1, m.level | 0 || 1); m.exp = Math.max(0, +m.exp || 0);
    m.stage = Math.max(1, Math.min(5, m.stage | 0 || 1));
    var mh = hpAt(m.level, m.stage);
    if (!(m.maxHp >= mh)) { var r = m.maxHp ? (m.hp / m.maxHp) : 1; m.maxHp = mh; m.hp = Math.max(1, Math.round(mh * r)); }
    if (m.hp == null || m.hp > m.maxHp) m.hp = m.maxHp;
    m.atk = atkAt(m.level, m.stage);
    if (m.nick === undefined) m.nick = null;
    if (m.sta == null || m.sta > staMax(m.level)) m.sta = staMax(m.level);
    fixMoves(m);
    return m;
  }

  function stageName(key, stage) {
    stage = stage || 1; var s = spec(key), n = null;
    try {
      if (H.spirits && typeof H.spirits.stageName === 'function') n = H.spirits.stageName(key, stage);
      if (!n && H.spirits && H.spirits.stages && H.spirits.stages[key]) { var a = H.spirits.stages[key][stage - 1]; n = a && (a.name || a); }
      if (!n && s.stages) { var b = s.stages[stage - 1]; n = b && (b.name || b); }
      if (!n && s.names) n = s.names[stage - 1];
    } catch (e) {}
    if (typeof n === 'string' && n) return n;
    return stage <= 1 ? s.name : TIER[stage - 1] + ' ' + s.name;
  }
  function displayName(m) { return m.nick || (cap(spec(m.key).element) + ' Hontori'); }

  // ---------- moves (H.moves comes from src/moves.js; guarded)
  function movePool(m) {
    var M = H.moves; if (!M) return [];
    try {
      if (typeof M.learned === 'function') return M.learned(m) || [];
      var pool = typeof M.pool === 'function' ? M.pool(m.key) : (M.MOVES && M.MOVES[spec(m.key).element]) || [];
      return pool.filter(function (mv, i) { var ll = mv.learnLevel != null ? mv.learnLevel : [1, 5, 10, 14][i] || 1; return ll <= m.level; });
    } catch (e) { return []; }
  }
  function moveById(m, id) { var l = movePool(m); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function fixMoves(m) {
    var ids = movePool(m).map(function (x) { return x.id; });
    if (!Array.isArray(m.moves) || !m.moves.length) m.moves = ids.slice(0, 4);
    else if (ids.length) m.moves = m.moves.filter(function (id, i, a) { return ids.indexOf(id) >= 0 && a.indexOf(id) === i; }).slice(0, 4);
    return m;
  }

  // award(member, amount) -> events: [{type:'level', from, to}], plus {type:'canEvolve', to} when a stage is reachable
  function award(m, amount) {
    fix(m); var ev = [], from = m.level;
    if (m.level >= MAX_LV) return ev;
    var known = movePool(m).map(function (x) { return x.id; });
    m.exp += Math.max(0, Math.round(amount || 0));
    while (m.level < MAX_LV && m.exp >= need(m.level)) {
      m.exp -= need(m.level); m.level++;
      var oldMax = m.maxHp; m.maxHp = hpAt(m.level, m.stage); m.hp = Math.min(m.maxHp, m.hp + (m.maxHp - oldMax)); m.atk = atkAt(m.level, m.stage);
    }
    if (m.level >= MAX_LV) m.exp = 0;
    if (m.level > from) {
      ev.push({ type: 'level', from: from, to: m.level }); delete m.hold;
      if (!Array.isArray(m.moves)) m.moves = [];
      movePool(m).forEach(function (mv) {
        if (known.indexOf(mv.id) >= 0) return;
        if (m.moves.length < 4) { m.moves.push(mv.id); ev.push({ type: 'move', move: mv, equipped: true }); }
        else ev.push({ type: 'move', move: mv, equipped: false });
      });
    }
    if (canEvolve(m)) ev.push({ type: 'canEvolve', to: stageFor(m.level) });
    return ev;
  }
  function canEvolve(m) { return stageFor(m.level) > (m.stage || 1) && !m.hold; }
  function applyEvolve(m, to) {
    m.stage = to || stageFor(m.level); delete m.hold;
    var oldMax = m.maxHp; m.maxHp = hpAt(m.level, m.stage); m.hp = Math.min(m.maxHp, m.hp + (m.maxHp - oldMax)); m.atk = atkAt(m.level, m.stage);
  }

  // ---------- wand
  function wandNeed(L) { return Math.round(30 + 25 * Math.pow(L - 1, 1.4)); }
  function wandLevel() { return st().wandLevel || 1; }
  function maxManaAt(L) { return Math.min(8, 2 + L); }
  function capacity() { return 12 + 6 * (wandLevel() - 1); }
  function spellPower() { return 1 + 0.05 * (wandLevel() - 1); }
  function captureBonus() { return 0.04 * (wandLevel() - 1); }
  // perks the battle applies: spells cost less mana (never below 1) and sigils are read more loosely
  function wandPerks() { var L = wandLevel(); return { level: L, power: spellPower(), captureBonus: captureBonus(), costCut: Math.floor((L - 1) / 3), tolerance: 0.03 * (L - 1), maxMana: maxManaAt(L) }; }
  var SPELLS = { attack: ['Strike', 0], mend: ['Mend', 1], stun: ['Stun', 1], sleep: ['Sleep', 1], absorb: ['Absorb', 2], revive: ['Revive', 2] };
  function spellInfo(id) {
    var b = H.battle || {}, d = null;
    try { d = (b.SPELLS && b.SPELLS[id]) || (b.spellInfo && b.spellInfo(id)); } catch (e) {}
    var f = SPELLS[id] || [cap(String(id).replace(/_/g, ' ')), 1];
    var cost = d && d.cost != null ? d.cost : f[1];
    return { id: id, name: (d && d.name) || f[0], cost: cost, mastery: Math.max(1, Math.min(5, (st().spellMastery || {})[id] || 1)) };
  }
  function fixSpells(s) {
    if (!Array.isArray(s.spells)) s.spells = s.spells || [];
    if (!s.spellMastery || typeof s.spellMastery !== 'object') s.spellMastery = {};
    s.spells.forEach(function (id) { if (!s.spellMastery[id]) s.spellMastery[id] = 1; });
    if (!Array.isArray(s.spellLoadout)) s.spellLoadout = s.spells.slice(0, 4);
    s.spellLoadout = s.spellLoadout.filter(function (id, i, a) { return s.spells.indexOf(id) >= 0 && a.indexOf(id) === i; }).slice(0, 4);
  }
  function wandAward(amount, quiet) {
    var s = st(); s.wandLevel = s.wandLevel || 1; s.wandExp = s.wandExp || 0;
    if (s.wandLevel >= WAND_MAX) return 0;
    var from = s.wandLevel; s.wandExp += Math.max(0, Math.round(amount || 0));
    while (s.wandLevel < WAND_MAX && s.wandExp >= wandNeed(s.wandLevel)) { s.wandExp -= wandNeed(s.wandLevel); s.wandLevel++; }
    if (s.wandLevel >= WAND_MAX) s.wandExp = 0;
    var ups = s.wandLevel - from;
    if (ups) { var mm = maxManaAt(s.wandLevel); s.mana = Math.min(mm, (s.mana == null ? mm : s.mana) + (mm - (s.maxMana || 3))); s.maxMana = mm; if (!quiet) { toast('Your wand grew stronger'); sfx('wand'); } }
    return ups;
  }
  function lesson() { var u = wandAward(15); H.game && H.game.save && H.game.save(); return u; }

  // ---------- sanctum
  var placed = [];   // keys placed while a battle runs, to reconcile with the battle's own state.wand pushes
  function place(m) {
    var s = st(); s.party = s.party || []; s.sanctum = s.sanctum || [];
    fix(m);
    if (s.party.length < PARTY_MAX) { s.party.push(m); placed.push(m.key); H.game && H.game.partyChanged && H.game.partyChanged(); H.menu && H.menu.refresh(); return true; }
    if (s.sanctum.length >= capacity()) { toast('Your Sanctum is full'); return false; }
    s.sanctum.push(m); placed.push(m.key); toast('It rests in your Wand Sanctum'); H.game && H.game.save && H.game.save(); H.menu && H.menu.refresh(); return true;
  }
  function drainWand(skip) {
    var s = st(); if (!Array.isArray(s.wand) || !s.wand.length) { if (Array.isArray(s.wand)) s.wand = []; return; }
    s.sanctum = s.sanctum || []; skip = (skip || []).slice();
    s.wand.forEach(function (k) {
      if (typeof k !== 'string') { if (k && k.key) k = k.key; else return; }
      var i = skip.indexOf(k); if (i >= 0) { skip.splice(i, 1); return; }
      if (s.sanctum.length < capacity()) s.sanctum.push(newMember(k, 1));
    });
    s.wand = [];
  }
  function toSanctum(i) {
    var s = st(); if (s.party.length <= 1 || !s.party[i]) return false;
    if (s.sanctum.length >= capacity()) { toast('Your Sanctum is full'); return false; }
    s.sanctum.push(s.party.splice(i, 1)[0]); H.game.partyChanged(); H.menu && H.menu.refresh(); return true;
  }
  function fromSanctum(j, swapWith) {
    var s = st(), m = s.sanctum[j]; if (!m) return false;
    if (s.party.length < PARTY_MAX && swapWith == null) { s.sanctum.splice(j, 1); s.party.push(m); }
    else { var k = swapWith == null ? s.party.length - 1 : swapWith; var out = s.party[k]; s.party[k] = m; s.sanctum[j] = out; }
    H.game.partyChanged(); H.menu && H.menu.refresh(); return true;
  }
  function release(j) { var s = st(); if (!s.sanctum[j]) return false; s.sanctum.splice(j, 1); H.game.save(); H.menu && H.menu.refresh(); return true; }

  function migrate(s) {
    s = s || st();
    s.party = (s.party || []).map(fix); s.sanctum = (s.sanctum || []).map(fix).filter(Boolean);
    s.wandLevel = Math.max(1, s.wandLevel | 0 || 1); s.wandExp = Math.max(0, +s.wandExp || 0);
    s.maxMana = maxManaAt(s.wandLevel); if (s.mana == null || s.mana > s.maxMana) s.mana = s.maxMana;
    fixSpells(s);
    drainWand([]);
    wrapBattle();
    return s;
  }

  // ---------- battle hook
  var P = H.progress = {
    staMax: staMax, staCost: staCost, rest: restMember,
    STAGE_LV: STAGE_LV, need: need, newMember: newMember, fix: fix, award: award, canEvolve: canEvolve, stageFor: stageFor,
    stageName: stageName, displayName: displayName, wandNeed: wandNeed, wandAward: wandAward, lesson: lesson,
    capacity: capacity, spellPower: spellPower, captureBonus: captureBonus, maxManaAt: maxManaAt,
    place: place, toSanctum: toSanctum, fromSanctum: fromSanctum, release: release, migrate: migrate,
    wandPerks: wandPerks, spellInfo: spellInfo, fixSpells: fixSpells, movePool: movePool, moveById: moveById, fixMoves: fixMoves,
    handled: false, onBattleEnd: onBattleEnd, runEvolutions: runEvolutions, evolve: evolveSeq
  };

  async function onBattleEnd(result, info) {
    P.handled = true;
    result = result || {}; info = info || {};
    var s = st(), party = s.party || [];
    drainWand(placed); placed = [];
    if (!party.length || !(result.won || result.captured)) { H.game && H.game.save && H.game.save(); return; }
    var lead = party[0], fl = info.foeLevel || (lead && lead.level) || 1;
    var base = Math.round((10 + fl * 6) * (info.trainer ? 1.5 : 1) * (result.captured ? 1.2 : 1));
    var parts = Array.isArray(result.participants) && result.participants.length ? result.participants : [0];
    var active = typeof result.active === 'number' ? result.active : parts[parts.length - 1];
    var rows = party.map(function (m, i) {
      fix(m);
      var share = i === active ? 1 : parts.indexOf(i) >= 0 ? 0.6 : 0.3;
      var b = { m: m, lv0: m.level, f0: m.exp / need(m.level), gain: Math.max(1, Math.round(base * share)) };
      b.ev = award(m, b.gain); b.lv1 = m.level; b.f1 = m.level >= MAX_LV ? 1 : m.exp / need(m.level);
      return b;
    });
    var w0 = { lv: wandLevel(), f: (s.wandExp || 0) / wandNeed(wandLevel()) }, wg = (result.won ? 10 : 0) + (result.captured ? 25 : 0) + (info.trainer ? 10 : 0);
    var ups = wandAward(wg, true), w1 = { lv: wandLevel(), f: wandLevel() >= WAND_MAX ? 1 : s.wandExp / wandNeed(wandLevel()) };
    H.game && H.game.save && H.game.save();
    await resultsCard(rows, { gain: wg, w0: w0, w1: w1, ups: ups });
    if (ups) { toast('Your wand grew stronger'); }
    for (var ri = 0; ri < rows.length; ri++) for (var ei = 0; ei < rows[ri].ev.length; ei++) {
      var e = rows[ri].ev[ei]; if (e.type === 'move' && !e.equipped) await offerMove(rows[ri].m, e.move);
    }
    await runEvolutions(party.filter(canEvolve));
    H.menu && H.menu.refresh();
  }

  var wrapped = false;
  function wrapBattle() {
    if (wrapped || !H.battle || !H.battle.start) return;
    wrapped = true;
    var orig = H.battle.start;
    H.battle.start = function (opts) {
      opts = opts || {};
      var s = st(), b0 = s.battles || 0, w0 = (s.wand || []).length, lead = s.party && s.party[0];
      var n0 = (s.party || []).length + (s.sanctum || []).length;
      P.handled = false; placed = [];
      return Promise.resolve(orig.apply(this, arguments)).then(function (res) {
        if (P.handled) return res;
        var r = (res && typeof res === 'object') ? res : {};
        var n1 = (s.party || []).length + (s.sanctum || []).length;
        var captured = r.captured != null ? !!r.captured : ((s.wand || []).length > w0 || n1 > n0);
        var won = r.won != null ? !!r.won : ((s.battles || 0) > b0);
        var info = { foeKey: r.foeKey || opts.enemy || null, foeLevel: r.foeLevel || opts.foeLevel || (lead && lead.level) || 1, trainer: !!(r.trainer || opts.trainer) };
        return onBattleEnd({ won: won || captured, captured: captured, fled: r.fled != null ? r.fled : !(won || captured) }, info).then(function () { return res; });
      });
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wrapBattle); else setTimeout(wrapBattle, 0);

  // ---------- results card
  var CSS = [
    '.hp-o{position:absolute;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(5,6,14,.6);font-family:Nunito,"M PLUS Rounded 1c",system-ui,sans-serif;color:#f4f1e8;opacity:0;transition:opacity .25s}',
    '.hp-o.on{opacity:1}',
    '.hp-card{width:min(92%,460px);max-height:86%;overflow:auto;border-radius:20px;background:linear-gradient(180deg,#1b1e3a,#101226);border:2px solid #6f7fd8;box-shadow:0 10px 40px rgba(0,0,0,.6);padding:16px}',
    '.hp-card h3{margin:0 0 10px;font-size:20px;font-weight:900}',
    '.hp-r{display:flex;gap:10px;align-items:center;margin-bottom:8px;background:rgba(255,255,255,.05);border-radius:14px;padding:6px 8px}',
    '.hp-r canvas{width:44px;height:44px;border-radius:10px;image-rendering:pixelated;flex:none;background:rgba(0,0,0,.25)}',
    '.hp-r .i{flex:1;min-width:0}.hp-r .n{font-weight:900;font-size:15px;display:flex;justify-content:space-between;gap:6px}',
    '.hp-r .n span{opacity:.75;font-weight:800}',
    '.hp-bar{height:8px;border-radius:4px;background:rgba(0,0,0,.5);overflow:hidden;margin-top:5px}',
    '.hp-bar b{display:block;height:100%;width:0;background:linear-gradient(90deg,#6fb8ff,#bfe4ff)}',
    '.hp-bar.w b{background:linear-gradient(90deg,#ffb54a,#ffe6a0)}',
    '.hp-up{color:#ffe27a;font-size:12px;font-weight:900;height:15px;opacity:0;transition:opacity .3s}.hp-up.on{opacity:1}',
    '.hp-go{width:100%;margin-top:10px}',
    '.hp-card .hk-h{margin-bottom:10px}'
  ].join('\n');
  var styled = false;
  function style() { if (styled) return; styled = true; var e = document.createElement('style'); e.textContent = CSS; document.head.appendChild(e); }
  function el(tag, cls, parent, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; }
  function rootEl() { return document.getElementById('root') || document.body; }
  function portraitOf(m) {
    var c = document.createElement('canvas'); c.width = c.height = 48; var g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    try { var p = H.spirits.portrait(m.key, m.stage || 1); if (p) g.drawImage(p, 0, 0, 48, 48); } catch (e) {}
    return c;
  }
  P.portrait = portraitOf;

  // animate a bar from f0 at level lv0 to f1 at level lv1 (wrapping once per level)
  function fillBar(b, up, lv0, f0, lv1, f1, label, lvText) {
    return new Promise(function (res) {
      var steps = [], L = lv0; if (lv1 > lv0) { steps.push([f0, 1]); for (L = lv0 + 1; L < lv1; L++) steps.push([0, 1]); steps.push([0, f1]); } else steps.push([f0, f1]);
      b.style.transition = 'none'; b.style.width = (f0 * 100) + '%';
      var i = 0, lv = lv0;
      function next() {
        if (i >= steps.length) return res();
        var s = steps[i++];
        b.style.transition = 'none'; b.style.width = (s[0] * 100) + '%'; void b.offsetWidth;
        var dur = Math.max(160, Math.min(700, (s[1] - s[0]) * 700 / Math.max(1, steps.length * 0.6)));
        b.style.transition = 'width ' + dur + 'ms ease-out'; b.style.width = (s[1] * 100) + '%';
        setTimeout(function () {
          if (s[1] >= 1 && i < steps.length) { lv++; lvText.textContent = 'Lv ' + lv; up.textContent = label; up.classList.add('on'); sfx('sparkle'); }
          next();
        }, dur + 40);
      }
      next();
    });
  }

  function resultsCard(rows, wand) {
    style();
    return new Promise(function (resolve) {
      var o = el('div', 'hp-o', rootEl()), c = el('div', 'hp-card', o);
      H.kit.header(c, 'star', 'After the battle');
      var anims = [];
      rows.forEach(function (r) {
        var row = el('div', 'hp-r', c); row.appendChild(portraitOf(r.m));
        var i = el('div', 'i', row), n = el('div', 'n', i); el('b', '', n, displayName(r.m)); var lt = el('span', '', n, 'Lv ' + r.lv0);
        var bar = el('div', 'hp-bar', i), f = el('b', '', bar); var up = el('div', 'hp-up', i, '+' + r.gain + ' EXP');
        up.classList.add('on'); up.style.opacity = '.7';
        var mv = r.ev.filter(function (e) { return e.type === 'move'; }).map(function (e) { return e.move.name; });
        anims.push(function () { return fillBar(f, up, r.lv0, r.f0, r.lv1, r.f1, 'Grew to level ' + r.lv1, lt).then(function () { if (r.lv1 > r.lv0) { up.textContent = 'Grew to level ' + r.lv1 + (mv.length ? '. Learned ' + mv.join(', ') : ''); up.style.opacity = '1'; } }); });
      });
      var wr = el('div', 'hp-r', c), wc = document.createElement('canvas'); wc.width = wc.height = 48;
      try { var ic = H.icons.canvas('wand', 2); if (ic) { var gg = wc.getContext('2d'); gg.imageSmoothingEnabled = false; gg.drawImage(ic, 8, 8, 32, 32); } } catch (e) {}
      wr.appendChild(wc);
      var wi = el('div', 'i', wr), wn = el('div', 'n', wi); el('b', '', wn, 'Spirit Wand'); var wl = el('span', '', wn, 'Lv ' + wand.w0.lv);
      var wb = el('div', 'hp-bar w', wi), wf = el('b', '', wb); var wu = el('div', 'hp-up on', wi, '+' + wand.gain + ' EXP'); wu.style.opacity = '.7';
      anims.push(function () { return fillBar(wf, wu, wand.w0.lv, wand.w0.f, wand.w1.lv, wand.w1.f, 'Your wand grew stronger', wl); });
      var go = H.kit.btn(c, { icon: 'back', label: 'Continue', wide: true }); go.classList.add('hp-go'); go.firstChild.style.transform = 'scaleX(-1)';
      void o.offsetWidth; o.classList.add('on');
      setTimeout(function () { Promise.all(anims.map(function (a) { return a(); })); }, 250);
      function close() { go.removeEventListener('click', close); o.classList.remove('on'); setTimeout(function () { o.remove(); resolve(); }, 260); }
      go.addEventListener('click', close);
    });
  }

  // a new move with all 4 slots full: offer to swap one, or keep the current set
  function offerMove(m, mv) {
    style();
    return new Promise(function (resolve) {
      var o = el('div', 'hp-o', rootEl()), c = el('div', 'hp-card', o);
      H.kit.header(c, 'claw', displayName(m) + ' can learn ' + mv.name, 'Four moves at most. Forget one?');
      function done() { o.classList.remove('on'); setTimeout(function () { o.remove(); resolve(); }, 260); H.game && H.game.save && H.game.save(); }
      m.moves.forEach(function (id, i) {
        var old = moveById(m, id), b = H.kit.btn(c, { icon: 'feather', label: 'Forget ' + (old ? old.name : id), desc: 'Learn ' + mv.name + ' instead', kind: 'alt', wide: true }); b.classList.add('hp-go');
        b.addEventListener('click', function () { m.moves[i] = mv.id; toast(displayName(m) + ' now knows ' + mv.name); done(); });
      });
      var k = H.kit.btn(c, { icon: 'star', label: 'Keep my moves', desc: 'Skip ' + mv.name, wide: true }); k.classList.add('hp-go'); k.addEventListener('click', done);
      void o.offsetWidth; o.classList.add('on');
    });
  }
  P.offerMove = offerMove;

  // ---------- evolution sequence
  async function runEvolutions(list) {
    for (var i = 0; i < (list || []).length; i++) if (canEvolve(list[i])) await evolveSeq(list[i]);
    H.game && H.game.save && H.game.save(); H.menu && H.menu.refresh();
  }

  function spriteCanvas(key, stage, size, t) {
    var c = document.createElement('canvas'); c.width = c.height = size; var g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    try { H.spirits.draw(g, key, size / 2, size / 2, { t: t || 0 }, { scale: size / 40, noShadow: true, stage: stage }); } catch (e) {}
    return c;
  }
  function silhouette(src, color) {
    var c = document.createElement('canvas'); c.width = src.width; c.height = src.height; var g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    try { var d = g.getImageData(0, 0, c.width, c.height), a = d.data; for (var i = 0; i < a.length; i += 4) { if (a[i + 3] < 200) a[i + 3] = 0; else { a[i] = a[i + 1] = a[i + 2] = 255; a[i + 3] = 255; } } g.putImageData(d, 0, 0); }
    catch (e) { g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height); }
    return c;
  }

  function evolveSeq(m) {
    style();
    var to = stageFor(m.level), from = m.stage || 1, name = displayName(m), el0 = spec(m.key).element;
    var newName = stageName(m.key, to);
    return new Promise(function (resolve) {
      var o = el('div', 'hp-o', rootEl()); o.style.background = '#05060e'; o.style.flexDirection = 'column';
      var cv = el('canvas', '', o); cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
      var msg = el('div', '', o); msg.style.cssText = 'position:absolute;left:16px;right:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 28px);text-align:center;font-size:clamp(17px,4.6vw,24px);font-weight:900;line-height:1.3;text-shadow:0 2px 8px #000;padding:12px;border-radius:16px;background:rgba(16,18,38,.8);border:2px solid rgba(255,255,255,.18)';
      msg.textContent = 'Something is changing in ' + name + '.';
      var hold = H.kit.btn(o, { icon: 'close', label: 'Wait', desc: 'Stay as it is', kind: 'alt', sm: true }); hold.style.cssText = 'position:absolute;right:calc(env(safe-area-inset-right,0px) + 14px);top:calc(env(safe-area-inset-top,0px) + 14px)';
      var g = cv.getContext('2d'), W = 0, Hh = 0, dpr = 1;
      function size() { dpr = Math.min(2, window.devicePixelRatio || 1); W = o.clientWidth; Hh = o.clientHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr); }
      size(); window.addEventListener('resize', size);
      var SZ = 160;
      var oldC = spriteCanvas(m.key, from, SZ, 0), newC = spriteCanvas(m.key, to, SZ, 0);
      var oldS = silhouette(oldC, '#ffffff'), newS = silhouette(newC, '#ffffff');
      var COL = { fire: '255,150,80', water: '110,180,255', wind: '120,230,200', grass: '140,230,120', electric: '255,230,110', earth: '230,180,120', dark: '190,150,255', light: '255,240,180' };
      var col = COL[el0] || '255,230,170';
      var parts = [], t0 = performance.now(), phase = 'intro', swapAt = 0, live = true, stopped = false;
      var PULSE = 3.6, INTRO = 0.9;
      sfx('spell');
      void o.offsetWidth; o.classList.add('on');
      function stop() {
        if (phase !== 'intro' && phase !== 'pulse') return;
        stopped = true; phase = 'held'; m.hold = true; hold.hidden = true; sfx('bump');
        msg.textContent = name + ' stayed as it is.'; finishSoon();
      }
      hold.addEventListener('click', stop);
      function onKey(e) { if (e.key === 'b' || e.key === 'B' || e.key === 'Escape') stop(); else if ((e.key === 'Enter' || e.key === ' ' || e.key === 'a') && phase === 'done') close(); }
      window.addEventListener('keydown', onKey);
      var canClose = false;
      function finishSoon() { setTimeout(function () { canClose = true; phase = phase === 'held' ? 'held' : 'done'; msg.textContent += '  Tap to continue.'; }, 1400); }
      o.addEventListener('click', function (e) { if (!hold.contains(e.target) && canClose) close(); });
      function close() {
        if (!live) return; live = false; window.removeEventListener('resize', size); window.removeEventListener('keydown', onKey);
        o.classList.remove('on'); setTimeout(function () { o.remove(); resolve(!stopped); }, 260);
      }
      function frame(now) {
        if (!live) return;
        var t = (now - t0) / 1000, cx = W / 2, cy = Hh * 0.42, k = Math.min(W, Hh) / 260, sz = SZ * k * 1.3;
        g.setTransform(dpr, 0, 0, dpr, 0, 0); g.imageSmoothingEnabled = false;
        g.fillStyle = '#05060e'; g.fillRect(0, 0, W, Hh);
        if (phase === 'intro' && t > INTRO) phase = 'pulse';
        var p = phase === 'pulse' ? Math.min(1, (t - INTRO) / PULSE) : phase === 'reveal' || phase === 'done' ? 1 : 0;
        if (phase === 'pulse' && p >= 1) {
          phase = 'reveal'; swapAt = t; hold.hidden = true; applyEvolve(m, to); sfx('wand');
          for (var i = 0; i < 90; i++) { var a = Math.random() * 6.283, v = 40 + Math.random() * 220; parts.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 1 + Math.random() * 1.2, s: 2 + Math.random() * 3 }); }
          msg.textContent = 'Your ' + el0 + ' hontori became ' + newName + '!';
          H.game && H.game.save && H.game.save(); finishSoon();
        }
        var bright = phase === 'pulse' ? p : phase === 'reveal' || phase === 'done' ? Math.max(0, 1 - (t - swapAt) * 0.8) * 0.6 : 0.1;
        // soft backdrop glow
        var rg = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, Hh) * 0.6);
        rg.addColorStop(0, 'rgba(' + col + ',' + (0.12 + bright * 0.45) + ')'); rg.addColorStop(1, 'rgba(5,6,14,0)');
        g.fillStyle = rg; g.fillRect(0, 0, W, Hh);
        // light rays
        if (phase !== 'held') {
          var nr = 14, ra = t * 0.35, len = Math.max(W, Hh);
          g.save(); g.translate(cx, cy); g.globalCompositeOperation = 'lighter';
          for (var r = 0; r < nr; r++) {
            var a0 = ra + r * 6.283 / nr, wdt = 0.07 + 0.05 * Math.sin(t * 2 + r);
            g.fillStyle = 'rgba(' + col + ',' + (0.05 + bright * 0.22) + ')';
            g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a0 - wdt) * len, Math.sin(a0 - wdt) * len); g.lineTo(Math.cos(a0 + wdt) * len, Math.sin(a0 + wdt) * len); g.closePath(); g.fill();
          }
          g.restore();
        }
        // the hontori
        var bob = Math.sin(t * 2.2) * 4 * k;
        if (phase === 'intro' || phase === 'held') g.drawImage(oldC, cx - sz / 2, cy - sz / 2 + bob, sz, sz);
        else if (phase === 'pulse') {
          // pulses between the old and the new outline, faster and brighter as it goes
          var freq = 1.2 + p * p * 9, wave = Math.sin((t - INTRO) * freq * 3.1416 * 2 * (0.5 + p * 0.5));
          var useNew = p > 0.25 && wave > 0.2, sc = 1 + 0.06 * Math.max(0, wave) * p;
          g.globalAlpha = 1; g.drawImage(oldC, cx - sz / 2, cy - sz / 2 + bob, sz, sz);
          g.globalAlpha = Math.min(1, 0.25 + p * 0.9);
          var S2 = sz * sc; g.drawImage(useNew ? newS : oldS, cx - S2 / 2, cy - S2 / 2 + bob, S2, S2);
          g.globalAlpha = 1;
          if (Math.random() < 0.3 + p) parts.push({ x: cx + (Math.random() - .5) * sz, y: cy + sz * 0.4, vx: (Math.random() - .5) * 20, vy: -40 - Math.random() * 60, l: 1.2, s: 2 + Math.random() * 2 });
        } else {
          g.drawImage(newC, cx - sz / 2, cy - sz / 2 + bob, sz, sz);
          var fl = Math.max(0, 1 - (t - swapAt) * 2.2);
          if (fl > 0) { g.globalAlpha = fl; g.drawImage(newS, cx - sz / 2, cy - sz / 2 + bob, sz, sz); g.globalAlpha = 1; }
          if (Math.random() < 0.25) { var aa = Math.random() * 6.283, d = sz * (0.3 + Math.random() * 0.4); parts.push({ x: cx + Math.cos(aa) * d, y: cy + Math.sin(aa) * d, vx: 0, vy: -10, l: 0.9, s: 3, star: 1 }); }
        }
        // particles and sparkles
        g.globalCompositeOperation = 'lighter';
        for (var j = parts.length - 1; j >= 0; j--) {
          var q = parts[j]; q.l -= 1 / 60; if (q.l <= 0) { parts.splice(j, 1); continue; }
          q.x += q.vx / 60; q.y += q.vy / 60; q.vx *= 0.97; q.vy *= 0.97;
          g.fillStyle = 'rgba(255,248,220,' + Math.min(1, q.l) + ')';
          var s2 = Math.round(q.s * k);
          if (q.star) { g.fillRect(Math.round(q.x - s2 * 1.5), Math.round(q.y), s2 * 3, Math.max(1, s2 >> 1) + 1); g.fillRect(Math.round(q.x), Math.round(q.y - s2 * 1.5), Math.max(1, s2 >> 1) + 1, s2 * 3); }
          else g.fillRect(Math.round(q.x), Math.round(q.y), s2, s2);
        }
        g.globalCompositeOperation = 'source-over';
        // white flash at the swap
        if (phase === 'reveal' || phase === 'done') { var fw = Math.max(0, 1 - (t - swapAt) * 1.6); if (fw > 0) { g.fillStyle = 'rgba(255,255,255,' + fw + ')'; g.fillRect(0, 0, W, Hh); } }
        else if (phase === 'pulse' && p > 0.85) { g.fillStyle = 'rgba(255,255,255,' + ((p - 0.85) / 0.15 * 0.7) + ')'; g.fillRect(0, 0, W, Hh); }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }
})();
