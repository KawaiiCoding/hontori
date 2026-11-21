window.H = window.H || {};
// Story engine: flags, quests and scripted events, plus a small quest pill and a Quest Log sheet.
// Data lives in H.game.state.flags and H.game.state.quests, so it is saved with the game.
// Events hook in three ways: map enter (H.onMapEnter), npc talk (npc.svc = 'story:talk'), and
// prop interaction (wraps H.interact.run, like closeup.js does).
(function () {
  'use strict';
  var H = window.H;
  var quests = {}, order = [], events = [];
  var env = null, mapName = null, running = false, queue = [];

  function S() { var s = (H.game && H.game.state) || {}; if (!s.flags) s.flags = {}; if (!s.quests) s.quests = {}; return s; }
  function save() { try { H.game && H.game.save(); } catch (e) {} }
  function P(v) { return (v && typeof v.then === 'function') ? v : Promise.resolve(v); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function sfx(n) { try { H.audio && H.audio.sfx(n); } catch (e) {} }
  function npcName(n) { return (n && n.lines && n.lines[0] && n.lines[0][0]) || ''; }

  // ---------- quests
  function qs(id) { var s = S(); return s.quests[id]; }
  function defineQuest(q) { if (!quests[q.id]) order.push(q.id); quests[q.id] = q; return q; }
  function start(id, quiet) {
    var q = quests[id], s = S(); if (!q || s.quests[id]) return false;
    s.quests[id] = { status: 'active', steps: {}, t: Date.now() };
    if (!quiet && H.ui) H.ui.toast('New quest: ' + q.title);
    sfx('page'); advance(); save(); return true;
  }
  function stepDone(q, st, step) {
    if (st.steps[step.id]) return true;
    try { return !!(step.done && step.done(S())); } catch (e) { return false; }
  }
  function completeStep(id, stepId) { var st = qs(id); if (!st) { start(id, true); st = qs(id); } if (!st) return; st.steps[stepId] = true; advance(); save(); }
  // re-check every active quest; finish the ones whose steps are all done
  function advance() {
    var s = S(), changed = false;
    order.forEach(function (id) {
      var q = quests[id], st = s.quests[id]; if (!st || st.status !== 'active') return;
      (q.steps || []).forEach(function (step) { if (!st.steps[step.id] && stepDone(q, st, step)) { st.steps[step.id] = true; changed = true; } });
      if ((q.steps || []).every(function (step) { return st.steps[step.id]; })) {
        st.status = 'done'; changed = true;
        if (H.ui) H.ui.toast('Quest complete: ' + q.title);
        sfx('sparkle');
        if (typeof q.reward === 'function') { try { q.reward(api()); } catch (e) { console.warn(e); } }
        else if (q.reward && q.reward.item && H.game) H.game.addItem(q.reward.item.id, q.reward.item.name, q.reward.item.icon || q.reward.item.id);
      }
    });
    if (changed) save();
    renderPill();
    return changed;
  }
  function isDone(id) { var st = qs(id); return !!(st && st.status === 'done'); }
  function isActive(id) { var st = qs(id); return !!(st && st.status === 'active'); }
  function current() {
    var s = S(), best = null;
    order.forEach(function (id) { var st = s.quests[id]; if (st && st.status === 'active' && (!best || st.t >= s.quests[best].t)) best = id; });
    return best;
  }
  function nextStep(id) { var q = quests[id], st = qs(id); if (!q || !st) return null; for (var i = 0; i < q.steps.length; i++) if (!st.steps[q.steps[i].id]) return q.steps[i]; return null; }

  // ---------- flags
  function setFlag(k, v) { S().flags[k] = v === undefined ? true : v; advance(); save(); }
  function getFlag(k) { return S().flags[k]; }

  // ---------- events
  function defineEvent(ev) {
    if (ev.once === undefined) ev.once = true;
    events = events.filter(function (e) { return e.id !== ev.id; });
    events.push(ev);
    if (ev.when === 'talk') tagNpcs();
    return ev;
  }
  function evOk(ev, ctx) {
    if (ev.once && S().flags['ev:' + ev.id]) return false;
    if (ev.map && ev.map !== ctx.mapName) return false;
    try { return !ev.cond || !!ev.cond(S(), ctx); } catch (e) { return false; }
  }
  function matchTalk(ev, n) { var want = ev.npcKey || ev.npc; return !want || [].concat(want).some(function (w) { return w === npcName(n) || w === (n && n.key); }); }
  function find(when, ctx) {
    for (var i = 0; i < events.length; i++) {
      var ev = events[i]; if (ev.when !== when || !evOk(ev, ctx)) continue;
      if (when === 'talk' && !matchTalk(ev, ctx.object)) continue;
      if (when === 'interact' && ev.svc && [].concat(ev.svc).indexOf(ctx.type) < 0) continue;
      return ev;
    }
    return null;
  }
  // one event at a time; the world is paused while it runs
  function run(ev, ctx) {
    var go = function () {
      running = true;
      if (ev.once) S().flags['ev:' + ev.id] = true;
      return P(ev.run(api(ctx))).catch(function (e) { console.warn('story event', ev.id, e); })
        .then(function () { running = false; advance(); save(); var nx = queue.shift(); if (nx) nx(); });
    };
    if (!running) return go();
    return new Promise(function (res) { queue.push(function () { go().then(res); }); });
  }
  function fire(when, ctx) { var ev = find(when, ctx); return ev ? run(ev, ctx) : null; }

  // ---------- the api handed to event scripts
  var COLORS = { hontori: '#ffb04a', kid: '#7cc8ff', mom: '#ff9fc2', dad: '#9fe0a0' };
  function portrait(key) {
    try { if (H.spirits && H.spirits.list.some(function (s) { return s.key === key; })) return H.spirits.portrait(key); return H.chars.portrait(key); } catch (e) { return null; }
  }
  function api(ctx) {
    ctx = ctx || {};
    var a = {
      ctx: ctx, state: S(), env: env, map: mapName,
      // say(key, name, text) or say([key, name, text]); 'hontori' uses the companion's name
      say: function (key, name, text) {
        if (Array.isArray(key)) { text = key[2]; name = key[1]; key = key[0]; }
        if (text === undefined) { text = name; name = key === 'kid' ? 'You' : key; }
        if (key === 'hontori') name = H.spiritName || 'Fire Hontori';
        return H.ui ? P(H.ui.say(name, text, portrait(key), COLORS[key] || '#ffe08a')) : Promise.resolve();
      },
      lines: function (list) { return list.reduce(function (p, l) { return p.then(function () { return a.say(l); }); }, Promise.resolve()); },
      choose: function (opts) { return H.ui ? P(H.ui.choose(opts)) : Promise.resolve(0); },
      toast: function (t) { if (H.ui) H.ui.toast(t); },
      fade: function (ms) { return H.ui ? P(H.ui.fade(ms)) : Promise.resolve(); },
      // fade to black, run fn while dark, then fade back in
      blackout: function (fn, ms) { ms = ms || 1400; var f = a.fade(ms); return wait(ms / 2 + 40).then(function () { try { fn && fn(); } catch (e) { console.warn(e); } return f; }); },
      wait: wait,
      sfx: sfx,
      emit: function (kind, n, dx, dy) { if (ctx.emit) ctx.emit(kind, (ctx.x || (ctx.player && ctx.player.x) || 0) + (dx || 0), (ctx.y || (ctx.player && ctx.player.y) || 0) + (dy || 0), n || 8); },
      setTime: function (h) { if (env) env.time = h; if (H.ui && env) H.ui.hud(env, (H.maps[mapName] && H.maps[mapName].name) || mapName); },
      give: function (id, name, icon) {
        var it = H.items && H.items.list.filter(function (x) { return x.id === id; })[0];
        H.game && H.game.addItem(id, name || (it && it.name) || id, icon || id);
        a.toast('Got ' + (name || (it && it.name) || id)); save();
      },
      addHontori: function (key) { return !!(H.game && H.game.addHontori(key)); },
      // resolves with the battle result ({won, fled} when the battle module reports it)
      battle: function (enemy, opts) {
        if (!H.battle || !H.battle.start) return Promise.resolve(null);
        var o = opts || {}; o.env = env; o.enemy = enemy;
        return P(H.battle.start(o)).then(function (r) { return r || null; });
      },
      draw: function (kind, text) { return H.gesture && H.gesture.prompt ? P(H.gesture.prompt(kind, text)) : Promise.resolve(); },
      setFlag: setFlag, getFlag: getFlag, flag: getFlag,
      startQuest: start, completeStep: completeStep, isDone: isDone, isActive: isActive
    };
    return a;
  }

  // ---------- hooks
  // capture the live env (the engine passes it to the HUD every second) and tag npcs before the first map loads
  function hookUi() {
    if (!H.ui || H.ui.__story) return;
    H.ui.__story = true;
    var hud0 = H.ui.hud, init0 = H.ui.init;
    H.ui.hud = function (e, place) { if (e && typeof e.time === 'number') env = e; return hud0.apply(this, arguments); };
    H.ui.init = function () { tagNpcs(); var r = init0.apply(this, arguments); buildPill(); return r; };
    // while an event runs, the touch stick and A button do not move the kid
    var real = H.ui.input, idle = { dx: 0, dy: 0, ax: 0, ay: 0, action: false, back: false, run: false };
    try { Object.defineProperty(H.ui, 'input', { configurable: true, get: function () { return running ? idle : real; }, set: function (v) { real = v; } }); } catch (e) {}
  }
  // keyboard: block walking and hotkeys during events, keep Space/Enter for advancing dialog
  addEventListener('keydown', function (e) {
    if (!running) return;
    var k = e.key.toLowerCase(), adv = k === ' ' || k === 'enter' || k === 'z';
    if (adv && H.ui && H.ui.isOpen()) return;
    if (document.querySelector('.hq-pick')) return;
    e.stopPropagation(); if (adv || k.indexOf('arrow') === 0) e.preventDefault();
  }, true);

  // npcs named by talk events get svc 'story:talk'; an npc that already had a service keeps it as svc0
  function tagNpcs() {
    var want = {};
    events.forEach(function (ev) { if (ev.when === 'talk') [].concat(ev.npcKey || ev.npc || '*').forEach(function (w) { want[(ev.map || '*') + '|' + w] = 1; }); });
    Object.keys(H.maps || {}).forEach(function (mn) {
      ((H.maps[mn] && H.maps[mn].npcs) || []).forEach(function (n) {
        var hit = want['*|' + npcName(n)] || want[mn + '|' + npcName(n)] || want['*|' + n.key] || want[mn + '|' + n.key] || want[mn + '|*'];
        if (!hit || n.svc === 'story:talk') return;
        if (n.svc) n.svc0 = n.svc;
        n.svc = 'story:talk';
      });
    });
  }

  function hookInteract() {
    if (!H.interact || H.interact.__story) return;
    H.interact.__story = true;
    var run0 = H.interact.run, has0 = H.interact.has;
    H.interact.has = function (t) { return t === 'story:talk' || has0.apply(this, arguments); };
    H.interact.run = function (t, c) {
      c = c || {};
      var self = this, args = arguments;
      if (t === 'story:talk') {
        var n = c.object || {}, ctx = Object.assign({}, c, { type: 'talk', npc: npcName(n), mapName: c.mapName || mapName });
        var ev = find('talk', ctx), orig = n.svc0;
        var after = function () { return orig && has0.call(H.interact, orig) ? H.interact.run(orig, c) : null; };
        return ev ? P(run(ev, ctx)).then(function () { return ev.thenService === false ? null : after(); }) : P(after());
      }
      var ictx = Object.assign({}, c, { type: t, mapName: c.mapName || mapName });
      var iev = find('interact', ictx);
      if (iev) return P(run(iev, ictx)).then(function () { return iev.thenDefault ? run0.apply(self, args) : null; });
      return run0.apply(this, arguments);
    };
  }

  H.onMapEnter = H.onMapEnter || [];
  H.onMapEnter.push(function (name, map) {
    mapName = name;
    var s = S();
    s.flags['visited:' + name] = true;
    advance();
    var ctx = { mapName: name, map: map, type: 'mapEnter' };
    var ev = find('mapEnter', ctx);
    // let the door fade finish first
    if (ev) setTimeout(function () { if (find('mapEnter', ctx) === ev) run(ev, ctx); }, ev.delay != null ? ev.delay : 700);
  });

  // ---------- quest pill + Quest Log sheet
  var CSS = [
    '.hq-pill{position:absolute;z-index:31;left:calc(env(safe-area-inset-left,0px) + 60px);top:calc(env(safe-area-inset-top,0px) + 62px);max-width:min(64%,330px);display:flex;align-items:center;gap:8px;padding:6px 12px 6px 8px;border-radius:14px;background:rgba(14,16,32,.82);border:2px solid rgba(255,214,120,.35);color:#f4f1e8;font:800 13px/1.2 Nunito,"M PLUS Rounded 1c",system-ui,sans-serif;box-shadow:0 3px 10px rgba(0,0,0,.4);cursor:pointer;transition:opacity .2s,transform .2s;-webkit-user-select:none;user-select:none}',
    '.hq-pill[hidden]{display:none}',
    '.hq-pill:active{transform:translateY(2px)}',
    '.hq-pill .dot{flex:none;width:10px;height:10px;border-radius:50%;background:#ffc56b;box-shadow:0 0 8px #ffb04a}',
    '.hq-pill .tx{min-width:0}',
    '.hq-pill b{display:block;color:#ffe7a8;font-weight:900;font-size:12px;letter-spacing:.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.hq-pill span{display:block;opacity:.85;font-weight:700;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}',
    '.hq-pill.flash{animation:hqf 1s ease-out}@keyframes hqf{0%{box-shadow:0 0 0 0 rgba(255,200,100,.8)}100%{box-shadow:0 0 0 14px rgba(255,200,100,0)}}',
    '.hq-shade{position:absolute;inset:0;z-index:46;background:rgba(5,6,14,.6);opacity:0;transition:opacity .2s}',
    '.hq-shade.on{opacity:1}',
    '.hq-sheet{position:absolute;left:8px;right:8px;bottom:calc(env(safe-area-inset-bottom,0px) + 8px);max-height:80%;overflow:auto;border-radius:20px;background:linear-gradient(180deg,#1b1e3a,#101226);border:2px solid #d9a85a;box-shadow:0 10px 40px rgba(0,0,0,.6);padding:16px;color:#f4f1e8;font-family:Nunito,"M PLUS Rounded 1c",system-ui,sans-serif;transform:translateY(30px);transition:transform .22s}',
    '.hq-shade.on .hq-sheet{transform:none}',
    '@media (min-width:640px){.hq-sheet{left:50%;right:auto;width:560px;margin-left:-280px}}',
    '.hq-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}',
    '.hq-h h2{margin:0;font-size:22px;font-weight:900}',
    '.hq-x{width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.1);border:0;color:#fff;font:900 18px Nunito,system-ui;cursor:pointer}',
    '.hq-sec{margin:12px 0 6px;font-size:12px;font-weight:900;letter-spacing:1px;text-transform:uppercase;opacity:.6}',
    '.hq-q{background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.12);border-radius:16px;padding:10px 12px;margin-bottom:8px}',
    '.hq-q.cur{border-color:#ffc56b}',
    '.hq-q.done{opacity:.6}',
    '.hq-q h3{margin:0 0 3px;font-size:17px;font-weight:900}',
    '.hq-q p{margin:0 0 6px;font-size:13px;opacity:.75;line-height:1.3}',
    '.hq-q ul{list-style:none;margin:0;padding:0}',
    '.hq-q li{display:flex;gap:8px;align-items:flex-start;font-size:14px;font-weight:700;line-height:1.3;padding:3px 0}',
    '.hq-q li i{flex:none;width:14px;height:14px;margin-top:2px;border-radius:4px;border:2px solid rgba(255,255,255,.45)}',
    '.hq-q li.ok{opacity:.6;text-decoration:line-through}',
    '.hq-q li.ok i{background:#6fe08a;border-color:#6fe08a}',
    '.hq-empty{opacity:.6;padding:16px 4px;text-align:center}'
  ].join('\n');
  var pill = null, styled = false, lastPill = '';
  function style() { if (styled) return; var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); styled = true; }
  function buildPill() {
    if (pill || !document.getElementById('root')) return;
    style();
    pill = document.createElement('div'); pill.className = 'hq-pill'; pill.hidden = true;
    pill.innerHTML = '<i class="dot"></i><div class="tx"><b></b><span></span></div>';
    pill.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); });
    pill.addEventListener('click', function (e) { e.stopPropagation(); openLog(); });
    document.getElementById('root').appendChild(pill);
    renderPill();
  }
  function renderPill() {
    if (!pill) return;
    var id = current(), st = id && nextStep(id);
    var key = id ? id + '|' + (st ? st.id : '') : '';
    pill.hidden = !id || !(H.game && H.game.state && H.game.state.intro);
    if (!id) { lastPill = ''; return; }
    var q = quests[id], txt = st ? (typeof st.text === 'function' ? st.text(S()) : st.text) : '';
    pill.querySelector('b').textContent = q.title;
    pill.querySelector('span').textContent = txt;
    if (key !== lastPill && lastPill) { pill.classList.remove('flash'); void pill.offsetWidth; pill.classList.add('flash'); }
    lastPill = key;
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function openLog() {
    style(); sfx('page');
    var s = S(), cur = current(), act = [], done = [];
    order.forEach(function (id) { var st = s.quests[id]; if (st) (st.status === 'done' ? done : act).push(id); });
    function card(id) {
      var q = quests[id], st = s.quests[id];
      var li = (q.steps || []).map(function (step) {
        var ok = !!st.steps[step.id], txt = typeof step.text === 'function' ? step.text(s) : step.text;
        return '<li class="' + (ok ? 'ok' : '') + '"><i></i>' + esc(txt) + '</li>';
      }).join('');
      return '<div class="hq-q' + (id === cur ? ' cur' : '') + (st.status === 'done' ? ' done' : '') + '"><h3>' + esc(q.title) + '</h3>' + (q.desc ? '<p>' + esc(q.desc) + '</p>' : '') + '<ul>' + li + '</ul></div>';
    }
    var o = document.createElement('div'); o.className = 'hq-shade';
    o.innerHTML = '<div class="hq-sheet"><div class="hq-h"><h2>Quest Log</h2><button class="hq-x" type="button">X</button></div>' +
      (act.length ? '<div class="hq-sec">Active</div>' + act.map(card).join('') : '<div class="hq-empty">No open quests right now.</div>') +
      (done.length ? '<div class="hq-sec">Done</div>' + done.map(card).join('') : '') + '</div>';
    document.getElementById('root').appendChild(o);
    requestAnimationFrame(function () { o.classList.add('on'); });
    function close() { o.classList.remove('on'); removeEventListener('keydown', key, true); setTimeout(function () { o.remove(); }, 220); }
    function key(e) { if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); close(); } }
    addEventListener('keydown', key, true);
    o.querySelector('.hq-x').addEventListener('click', close);
    o.addEventListener('click', function (e) { if (e.target === o) close(); });
    o.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  }

  hookUi(); hookInteract();
  // state-based steps (spells learned, party, items) are re-checked now and then
  setInterval(function () { if (H.game && H.game.state) advance(); }, 1500);
  // 'auto' events fire on their own once cond passes and the world is calm (no dialog, panel, battle or fade)
  function idle() {
    if (running || !H.game || !H.game.state || !H.game.state.intro) return false;
    if (H.ui && H.ui.isOpen()) return false;
    if (document.querySelector('.hb,.hz,.hq-shade,.hq-pick,.hm-shade.on,.ht')) return false;
    var f = document.querySelector('.hui-fade'); if (f && +getComputedStyle(f).opacity > 0.01) return false;
    return true;
  }
  var calm = 0;
  setInterval(function () { calm = idle() ? calm + 1 : 0; if (calm >= 2) fire('auto', { mapName: mapName, type: 'auto' }); }, 400);

  H.story = {
    get flags() { return S().flags; },
    set: setFlag, get: getFlag,
    quests: quests, defineQuest: defineQuest, start: start, advance: advance, completeStep: completeStep,
    isDone: isDone, isActive: isActive, current: current, nextStep: nextStep,
    defineEvent: defineEvent, events: function () { return events; }, fire: fire, run: function (id, ctx) { var ev = events.filter(function (e) { return e.id === id; })[0]; return ev ? run(ev, ctx || { mapName: mapName }) : null; },
    api: api, openLog: openLog, idle: idle, tagNpcs: tagNpcs,
    get busy() { return running; },
    get env() { return env; },
    get mapName() { return mapName; }
  };
})();
