// Menu overlay: backpack button, party strip (up to 5 hontori), party panel, save.
// DOM based, mobile first. Talks to the engine through H.game (state, save, reset).
(function () {
  var H = window.H = window.H || {};
  var root, els = {}, open = null;
  var MAX = 5;

  var CSS = [
    '.hm{position:absolute;inset:0;pointer-events:none;font-family:Nunito,"M PLUS Rounded 1c",system-ui,sans-serif;color:#f4f1e8;z-index:30}',
    '.hm *{box-sizing:border-box}',
    '.hm-top{position:absolute;right:calc(env(safe-area-inset-right,0px) + 10px);top:calc(env(safe-area-inset-top,0px) + 10px);display:flex;gap:8px;pointer-events:auto}',
    '.hm-btn.off{opacity:.45}',
    '.hm-btn{width:44px;height:44px;border-radius:14px;background:rgba(18,20,40,.82);border:2px solid rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.35)}',
    '.hm-btn:active{transform:translateY(2px)}',
    '.hm-btn canvas.cog{transition:transform .5s cubic-bezier(.3,1.5,.5,1)}.hm-btn:hover canvas.cog,.hm-btn:active canvas.cog{transform:rotate(45deg)}',
    '.hm-btn img,.hm-btn canvas{width:28px;height:28px;image-rendering:pixelated}',
    '.hm-party{position:absolute;left:calc(env(safe-area-inset-left,0px) + 10px);top:calc(env(safe-area-inset-top,0px) + 62px);display:flex;flex-direction:column;gap:6px;pointer-events:auto;cursor:pointer}',
    '.hm-slot{position:relative;width:40px;height:40px;border-radius:50%;background:rgba(18,20,40,.72);border:2px solid rgba(255,255,255,.18);overflow:hidden}',
    '.hm-slot.lead{border-color:#ffc56b;box-shadow:0 0 0 2px rgba(255,197,107,.25)}',
    '.hm-slot.empty{border-style:dashed;background:rgba(18,20,40,.35)}',
    '.hm-slot canvas{width:100%;height:100%;image-rendering:pixelated}',
    '.hm-slot i{position:absolute;left:5px;right:5px;bottom:3px;height:4px;border-radius:2px;background:rgba(0,0,0,.55)}',
    '.hm-slot i b{display:block;height:100%;border-radius:2px;background:#6fe08a}',
    '.hm-shade{position:absolute;inset:0;background:rgba(5,6,14,.55);opacity:0;transition:opacity .18s;pointer-events:none}',
    '.hm-shade.on{opacity:1;pointer-events:auto}',
    '.hm-sheet{position:absolute;left:8px;right:8px;bottom:calc(env(safe-area-inset-bottom,0px) + 8px);max-height:78%;overflow:auto;border-radius:20px;background:linear-gradient(180deg,#1b1e3a,#101226);border:2px solid #6f7fd8;box-shadow:0 10px 40px rgba(0,0,0,.6);padding:16px;transform:translateY(calc(100% + 60px));visibility:hidden;transition:transform .22s,visibility 0s .22s;pointer-events:auto}',
    '.hm-sheet.on{transform:none;visibility:visible;transition:transform .22s}',
    '.hm-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}',
    '.hm-h h2{margin:0;font-size:22px;font-weight:900;letter-spacing:.3px}',
    '.hm-x{width:38px;height:38px;border-radius:12px;background:rgba(255,255,255,.1);border:0;color:#fff;font-size:20px;font-weight:900;cursor:pointer}',
    '.hm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:10px}',
    '.hm-item{background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.12);border-radius:14px;padding:10px 6px;text-align:center;font-size:13px;font-weight:700;line-height:1.2}',
    '.hm-item canvas{width:48px;height:48px;image-rendering:pixelated;display:block;margin:0 auto 6px}',
    '.hm-empty{opacity:.6;font-size:15px;padding:18px 4px;text-align:center}',
    '.hm-row{display:flex;gap:12px;align-items:center;background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.12);border-radius:16px;padding:10px;margin-bottom:8px}',
    '.hm-row.lead{border-color:#ffc56b}',
    '.hm-row canvas.por{width:64px;height:64px;border-radius:12px;image-rendering:pixelated;background:rgba(0,0,0,.25);flex:none}',
    '.hm-row .inf{flex:1;min-width:0}',
    '.hm-row .nm{font-size:18px;font-weight:900;display:flex;gap:8px;align-items:center;flex-wrap:wrap}',
    '.hm-row .sub{font-size:13px;opacity:.75;margin:2px 0 6px;white-space:pre-wrap}',
    '.hm-bar{height:8px;border-radius:4px;background:rgba(0,0,0,.5);overflow:hidden}',
    '.hm-bar b{display:block;height:100%;background:linear-gradient(90deg,#57d07a,#9cf0a6)}',
    '.hm-tag{font-size:11px;font-weight:900;padding:2px 8px;border-radius:999px;background:#ffc56b;color:#2a1c05}',
    '.hm-mini{border:0;border-radius:10px;padding:8px 10px;font:inherit;font-weight:800;font-size:13px;background:rgba(255,255,255,.14);color:#fff;cursor:pointer}',
    '.hm-acts{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}',
    '.hm-act{flex:1;min-width:120px;border:0;border-radius:14px;padding:14px 10px;font:inherit;font-weight:900;font-size:16px;color:#14162a;background:#8fd0ff;cursor:pointer}',
    '.hm-act.warn{background:rgba(255,255,255,.12);color:#ffb3a8}',
    '.hm-note{font-size:13px;opacity:.7;margin-top:10px;line-height:1.35}',
    '.hm-bar.lb{position:relative;height:14px;margin-top:4px}.hm-bar.lb span{position:absolute;inset:0;display:flex;justify-content:space-between;align-items:center;padding:0 6px;font-size:10px;font-weight:900;color:#fff;text-shadow:0 1px 0 #000,0 0 3px #000}.hm-bar.lb em{font-style:normal}.hm-bar.st b{background:linear-gradient(90deg,#e0a83a,#ffd98a)}',
    '.hm-bar.xp{height:6px;margin-top:4px}.hm-bar.xp.lb{height:14px}.hm-bar.xp b{background:linear-gradient(90deg,#6fb8ff,#bfe4ff)}.hm-bar.wd b{background:linear-gradient(90deg,#ffb54a,#ffe6a0)}',
    '.hm-btns{display:flex;flex-direction:column;gap:6px;flex:none}',
    '.hm-sec{margin-top:16px;padding:12px;border-radius:16px;background:rgba(255,255,255,.05);border:2px solid rgba(255,255,255,.1)}',
    '.hm-sec h3{margin:0 0 6px;font-size:17px;font-weight:900}',
    '.hm-sg{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px}',
    '.hm-sc{position:relative;background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.12);border-radius:14px;padding:6px 4px 8px;text-align:center;font-size:12px;font-weight:800;line-height:1.2;cursor:pointer}',
    '.hm-sc canvas{width:60px;height:60px;image-rendering:pixelated;display:block;margin:0 auto 4px}',
    '.hm-sc .lv{position:absolute;left:6px;top:6px;font-size:11px;font-weight:900;background:rgba(0,0,0,.55);border-radius:8px;padding:1px 6px}',
    '.hm-sc .hui-el{transform:scale(.85)}',
    '.hm-det{display:flex;gap:12px;align-items:center}.hm-det canvas{width:96px;height:96px;border-radius:14px;image-rendering:pixelated;background:rgba(0,0,0,.25);flex:none}',
    '.hm-mana{display:flex;align-items:center;gap:4px;font-size:13px;font-weight:900;margin:-4px 0 12px;opacity:.95}',
    '.hm-cry{width:10px;height:14px;clip-path:polygon(50% 0,100% 35%,50% 100%,0 35%);background:rgba(255,255,255,.16)}.hm-cry.on{background:linear-gradient(180deg,#d8f0ff,#5aa8ff)}',
    '.hm-mend{display:flex;flex-direction:column;align-items:center;line-height:1.1;background:rgba(120,200,255,.22)}.hm-mend small{font-size:10px;font-weight:700;opacity:.8}',
    '.hm-mend .ic{display:inline-block;width:10px;height:10px;border:2px solid #bfe4ff;border-radius:50%;margin-right:5px;vertical-align:-1px}',
    '.hm-mend[disabled]{opacity:.5;cursor:default}',
    '.hm-pick{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.hm-pick canvas.pp{width:32px;height:32px;image-rendering:pixelated;flex:none}',
    '.hm-row.col{flex-direction:column;align-items:stretch;gap:10px}.hm-row .top{display:flex;gap:12px;align-items:center}',
    '.hm-row.col .hm-btns{flex-direction:row;flex-wrap:wrap;gap:8px}.hm-row.col .hm-btns .hk-btn{flex:1 1 calc(50% - 4px);min-width:0}',
    '.hm-row canvas.itm{width:40px;height:40px;image-rendering:pixelated;flex:none}',
    '.hm-sec h3{display:flex;align-items:center;gap:8px}.hm-sec h3 img{width:24px;height:24px;image-rendering:pixelated}',
    '.hm-sheet{-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding-bottom:calc(16px + env(safe-area-inset-bottom,0px))}'
  ].join('\n');

  function mk(tag, cls, parent, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; }
  function game() { return H.game || { state: { items: [], party: [] } }; }
  function spec(key) { return (H.spirits && H.spirits.list.filter(function (s) { return s.key === key; })[0]) || { key: key, name: key, element: 'fire' }; }
  function iconCanvas(name) { try { return H.icons.canvas(name, 2); } catch (e) { return null; } }
  function copyCanvas(src, size) { var c = document.createElement('canvas'); c.width = c.height = size; var g = c.getContext('2d'); g.imageSmoothingEnabled = false; if (src) g.drawImage(src, 0, 0, size, size); return c; }
  function portrait(key, stage) { try { return H.spirits.portrait(key, stage || 1); } catch (e) { return null; } }
  function P() { return H.progress; }
  function stageName(p) { try { return P() ? P().stageName(p.key, p.stage || 1) : spec(p.key).name; } catch (e) { return spec(p.key).name; } }
  function xpFrac(p) { try { return P() ? Math.min(1, (p.exp || 0) / P().need(p.level || 1)) : 0; } catch (e) { return 0; } }
  function bar(parent, frac, cls, label, val) { var b = mk('div', 'hm-bar' + (cls ? ' ' + cls : '') + (label ? ' lb' : ''), parent), f = mk('b', '', b); f.style.width = Math.round(100 * Math.max(0, Math.min(1, frac))) + '%'; if (label) { var t = mk('span', '', b); mk('em', '', t, label); mk('em', '', t, val); } return b; }
  var sel = null, confirmRel = false, swapPick = false, moveFor = null;
  var GLYPH = {
    attack: '<path d="M5 25 L15 5 L25 25 Z" />', mend: '<circle cx="15" cy="15" r="10" />', stun: '<path d="M11 4 L21 12 L9 18 L19 26" />',
    sleep: '<path d="M3 15 Q7 7 11 15 T19 15 T27 15" />', absorb: '<path d="M15 4 A11 11 0 1 1 4.5 17 A8 8 0 0 1 15 8 A5.5 5.5 0 1 1 10 15 A3 3 0 0 1 15 12" />',
    revive: '<path d="M15 3 L22 26 L4 11 L26 11 L8 26 Z" />'
  };
  function glyphEl(id) {
    var w = document.createElement('span'); w.style.cssText = 'width:34px;height:34px;flex:none;display:inline-block';
    var html = null; try { if (H.battle && H.battle.glyph) html = H.battle.glyph(id, '#ffd98a'); } catch (e) {}
    w.innerHTML = html || ('<svg viewBox="0 0 30 30" width="34" height="34"><g fill="none" stroke="#ffd98a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' + (GLYPH[id] || '<circle cx="15" cy="15" r="4" />') + '</g></svg>');
    var sv = w.querySelector('svg'); if (sv) { sv.setAttribute('width', '34'); sv.setAttribute('height', '34'); }
    return w;
  }
  function pips(n) { var t = ''; for (var i = 1; i <= 5; i++) t += i <= n ? '*' : '.'; return t; }
  function pickRow(parent, on, left, title, sub, onTap) {
    var r = mk('div', 'hm-row' + (on ? ' lead' : ''), parent); r.style.cursor = 'pointer'; r.style.padding = '8px 10px';
    if (left) r.appendChild(left);
    var i = mk('div', 'inf', r); mk('div', 'nm', i, title).style.fontSize = '16px'; mk('div', 'sub', i, sub).style.margin = '2px 0 0';
    mk('span', 'hm-tag', r, on ? 'EQUIPPED' : 'TAP TO ADD').style.background = on ? '#ffc56b' : 'rgba(255,255,255,.14)';
    if (!on) r.lastChild.style.color = '#fff';
    r.addEventListener('click', onTap); return r;
  }
  function itemCanvas(it) {
    var c = document.createElement('canvas'); c.width = c.height = 32; var g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    try {
      if (H.items && H.items.list.some(function (x) { return x.id === it.id; })) { g.scale(2, 2); H.items.draw(g, it.id, 0, 0); }
      else { var ICO = { ember_dust: 'fire', tide_pearl: 'water', herb: 'grass', spirit_snack: 'energy', wand: 'wand', novice_cert: 'scroll', charm: 'backpack' }; var ic = iconCanvas(ICO[it.id] || it.icon || it.id); if (ic) g.drawImage(ic, 0, 0, 32, 32); }
    } catch (e) {}
    return c;
  }
  // The kind is "hontori"; each one may get a personal nickname later.
  function displayName(p) { var s = spec(p.key); return p.nick || (cap(s.element) + ' Hontori'); }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

  // Settings cog drawn as 16x16 pixel art, in the same style as the backpack icon:
  // dark outline, 3-tone metal shading lit from the top-left, a warm gem in the hub.
  function pixelCog() {
    var N = 16, c = document.createElement('canvas'); c.width = c.height = N; c.className = 'cog';
    var g = c.getContext('2d'), cx = 7.5, cy = 7.5;
    function inside(x, y) {
      var dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      var tooth = Math.cos(a * 8) > 0.0; // 8 chunky teeth
      var outer = tooth ? 6.7 : 4.9;
      return r <= outer;
    }
    var OUTL = '#3a220e', HI = '#fff2c8', MID = '#e8b868', LO = '#b07a38', HUB = '#5a3a1c', GEM = '#ff8a3c', GEMH = '#ffe6a8';
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      if (inside(x, y)) {
        var light = (x - cx) * -0.6 + (y - cy) * -0.8; // top-left light
        g.fillStyle = light > 2 ? HI : light < -1.8 ? LO : MID;
        g.fillRect(x, y, 1, 1);
      } else if (inside(x - 1, y) || inside(x + 1, y) || inside(x, y - 1) || inside(x, y + 1)) {
        g.fillStyle = OUTL; g.fillRect(x, y, 1, 1); // outline sits outside the shape so the teeth stay readable
      }
    }
    // hub with a small gem
    g.fillStyle = OUTL; g.fillRect(6, 5, 4, 6); g.fillRect(5, 6, 6, 4);
    g.fillStyle = GEM; g.fillRect(6, 6, 4, 4); g.fillStyle = '#c85a20'; g.fillRect(8, 8, 2, 2); g.fillStyle = GEMH; g.fillRect(6, 6, 2, 1); g.fillRect(6, 7, 1, 1);
    // little sparkle, like the backpack icon
    g.fillStyle = '#ffffff'; g.fillRect(14, 0, 1, 3); g.fillRect(13, 1, 3, 1);
    c.style.cssText = 'width:30px;height:30px;image-rendering:pixelated';
    return c;
  }

  function init(rootEl) {
    root = rootEl;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    var o = els.o = mk('div', 'hm', root);
    els.party = mk('div', 'hm-party', o); els.party.addEventListener('click', function () { show('party'); });
    var top = mk('div', 'hm-top', o);
    var bp = mk('div', 'hm-btn', top); bp.title = 'Backpack'; var b1 = iconCanvas('backpack'); if (b1) bp.appendChild(copyCanvas(b1, 32)); else bp.textContent = 'Bag';
    bp.addEventListener('click', function () { show('bag'); });
    var mn = mk('div', 'hm-btn', top); mn.title = 'Menu'; var cg = iconCanvas('cog'); if (cg) { cg = copyCanvas(cg, 32); cg.className = 'cog'; mn.appendChild(cg); } else mn.appendChild(pixelCog());
    mn.addEventListener('click', function () { show('menu'); });
    els.shade = mk('div', 'hm-shade', o); els.shade.addEventListener('click', hide);
    els.sheet = mk('div', 'hm-sheet', o);
    refresh();
  }

  function refresh() {
    if (!els.party) return;
    var party = game().state.party || [];
    els.party.innerHTML = '';
    els.party.style.display = party.length ? 'flex' : 'none';
    for (var i = 0; i < MAX; i++) {
      var p = party[i], s = mk('div', 'hm-slot' + (p ? (i === 0 ? ' lead' : '') : ' empty'), els.party);
      if (p) { s.appendChild(copyCanvas(portrait(p.key, p.stage), 48)); var bar = mk('i', '', s), f = mk('b', '', bar); f.style.width = Math.round(100 * p.hp / p.maxHp) + '%'; }
    }
    if (open) render();
  }

  // out of battle care: draw a circle, spend 1 mana, heal about 40% of health
  var mending = false;
  function mend(p) {
    var g = H.game, st = g.state, mm = st.maxMana || 3, mn = st.mana == null ? mm : st.mana;
    if (mending || mn < 1 || p.hp >= p.maxHp) return;
    mending = true; hide();
    H.ui && H.ui.helper && H.ui.helper('mend', 'Mend', 'Draw a circle to heal. It costs one mana.', 'mend');
    var pips = ''; for (var q = 0; q < mm; q++) pips += '<span style="display:inline-block;width:12px;height:12px;margin:0 2px;border-radius:50%;border:2px solid #9fd0ff;vertical-align:middle;' + (q < mn ? 'background:' + (q === mn - 1 ? '#ffd98a' : '#7fc8ff') : '') + '"></span>';
    var ask = H.gesture && H.gesture.prompt ? Promise.resolve(H.gesture.prompt('mend', 'Draw a circle to mend', 'Mana ' + pips + ' ' + mn + ' / ' + mm + '. Mend uses 1 (the gold one).')) : Promise.resolve();
    ask.then(function () {
      var cur = st.mana == null ? mm : st.mana;
      if (cur >= 1 && p.hp < p.maxHp) {
        st.mana = cur - 1; var before = p.hp; p.hp = Math.min(p.maxHp, p.hp + Math.max(1, Math.round(p.maxHp * 0.4)));
        H.ui && H.ui.toast(displayName(p) + ' feels better  +' + (p.hp - before));
        g.save && g.save();
      }
    }).catch(function (e) { console.warn(e); }).then(function () { mending = false; refresh(); setTimeout(function () { show('party'); }, 200); });
  }
  function K() { return H.kit; }
  function header(title, icon, sub) { K().header(els.sheet, icon, title, sub, hide); }
  function kb(parent, o) { return K().btn(parent, o); }
  function acts(parent) { return mk('div', 'hk-acts', parent || els.sheet); }
  function note(text, parent) { return mk('div', 'hk-note', parent || els.sheet, text); }
  function itemDesc(it) {
    var USE = { ember_dust: 'Revives a fainted fire hontori', tide_pearl: 'Revives a fainted water hontori', herb: 'Restores a little mana in battle', spirit_snack: 'Revives other hontori, restores mana', wand: 'Draw spells to help your hontori', novice_cert: 'Proof you finished the Academy', charm: 'A lucky charm' };
    var d = it.desc || USE[it.id];
    if (!d && H.items) { var f = H.items.list.filter(function (x) { return x.id === it.id; })[0]; d = f && f.desc; }
    return d ? String(d).split(/(?<=\.)\s/)[0] : '';
  }

  // passive things work by themselves: they show a small tag instead of a button
  var PASSIVE = { lantern: 'In use at night', compass: 'In use', mirror: 'In use', map: 'Map button', wand: 'Always with you', herb: 'Used in battle', bread: 'Used in battle', ember_dust: 'Used in battle', tide_pearl: 'Used in battle', spirit_snack: 'Used in battle', backpack: 'In use', cookbook: 'Use at a stove', slingshot: 'Use at fruit trees' };
  function dropItem(it) {
    var st = game().state, i = st.items.indexOf(it); if (i < 0) return;
    if (it.id === 'backpack' && H.pickups && H.pickups.count() > 5) { H.ui && H.ui.toast('Take one thing out first'); return; }
    if (it.n > 1) it.n--; else st.items.splice(i, 1);
    H.ui && H.ui.toast(it.name + ((H.pickups && H.pickups.spots[it.id]) ? ' goes back home' : ' dropped'));
    game().save && game().save();
  }
  function render() {
    var g = game(), st = g.state; els.sheet.innerHTML = '';
    if (open === 'bag') {
      header('Backpack', 'backpack', (H.pickups && H.game.currentMap && H.game.currentMap().name === 'home' && (st.flags || {})['c1:morning']) ? 'Bag ' + H.pickups.count() + ' / ' + H.pickups.cap() : st.items.length ? st.items.length + ' things' : null);
      var MON = H.money, TR = MON ? MON.TRADE : {};
      if (MON) { var pr = mk('div', 'hm-mana', els.sheet); pr.appendChild(K().img('coin')); mk('span', '', pr, 'Purse: ' + MON.fmt(MON.get())); }
      var main = st.items.filter(function (it) { return !TR[it.id]; }), pouch = st.items.filter(function (it) { return TR[it.id]; });
      if (!main.length) mk('div', 'hm-empty', els.sheet, 'Empty for now.');
      if (pouch.length) {
        var ps = mk('div', 'hm-sec', els.sheet), ph = mk('h3', '', ps); ph.appendChild(K().img('coin')); ph.appendChild(document.createTextNode('Trade pouch   worth ' + MON.fmt(MON.pouchValue())));
        note('Sell these at Nettle\'s shop.', ps);
        pouch.forEach(function (it) { var r = mk('div', 'hm-row', ps); r.style.padding = '6px 10px'; var cc = itemCanvas(it); cc.className = 'itm'; r.appendChild(cc); var inf = mk('div', 'inf', r); mk('div', 'nm', inf, TR[it.id][0] + (it.n > 1 ? '  x' + it.n : '')); mk('div', 'sub', inf, TR[it.id][3] + '  ' + MON.fmt(MON.value(it.id)) + ' each'); });
      }
      main.forEach(function (it) {
        var r = mk('div', 'hm-row', els.sheet); r.style.padding = '8px 10px';
        var c = itemCanvas(it); c.className = 'itm'; r.appendChild(c);
        var i = mk('div', 'inf', r); mk('div', 'nm', i, it.name + (it.n > 1 ? '  x' + it.n : '')).style.fontSize = '16px';
        var d = (H.pickups && H.pickups.uses[it.id]) || itemDesc(it); if (d) mk('div', 'sub', i, d).style.margin = '2px 0 0';
        var ax = H.pickups ? H.pickups.actions(it) : [];
        var KEY = { wand: 1, map: 1, novice_cert: 1 };
        if (!KEY[it.id]) ax = ax.concat([{ label: 'Drop', desc: (H.pickups && H.pickups.spots[it.id]) ? 'It goes back home' : 'Leave one here', drop: true, run: function () { dropItem(it); } }]);
        if (!(H.pickups ? H.pickups.actions(it) : []).length) mk('span', 'hm-tag', i.firstChild, PASSIVE[it.id] || 'In use');
        if (ax.length) { var ab = mk('div', 'hm-btns', i); ab.style.cssText = 'flex-direction:row;flex-wrap:wrap;margin-top:6px'; ax.forEach(function (x) { var bt = kb(ab, { label: x.label, desc: x.desc, kind: 'alt', sm: true, onClick: function () { if (x.off) return; if (x.drop && !bt._sure) { bt._sure = 1; bt.querySelector('span span').textContent = 'Drop it?'; return; } if (x.label !== 'Put back' && !x.drop) hide(); x.run(); if (open) render(); } }); bt.disabled = !!x.off; }); }
      });
    } else if (open === 'party') {
      header('Your Hontori', 'paw', st.party.length + ' of ' + MAX + ' travel with you');
      var mm = st.maxMana || 3, mn = st.mana == null ? mm : Math.min(mm, st.mana), mrow = mk('div', 'hm-mana', els.sheet); mk('span', '', mrow, 'Mana');
      for (var ci = 0; ci < mm; ci++) mk('i', 'hm-cry' + (ci < mn ? ' on' : ''), mrow);
      mk('span', '', mrow, mn + ' / ' + mm);
      if (!st.party.length) mk('div', 'hm-empty', els.sheet, 'No hontori with you yet.');
      st.party.forEach(function (p, i) {
        var s = spec(p.key), card = mk('div', 'hm-row col' + (i === 0 ? ' lead' : ''), els.sheet), row = mk('div', 'top', card);
        var pc = copyCanvas(portrait(p.key, p.stage), 96); pc.className = 'por'; row.appendChild(pc);
        var inf = mk('div', 'inf', row), nm = mk('div', 'nm', inf); nm.appendChild(document.createTextNode(displayName(p)));
        try { if (H.ui && H.ui.elementBadge) nm.appendChild(H.ui.elementBadge(s.element)); } catch (e) {}
        if (i === 0) mk('span', 'hm-tag', nm, 'LEAD');
        mk('div', 'sub', inf, stageName(p) + '   Lv ' + p.level);
        var smx = P() && P().staMax ? P().staMax(p.level) : 0, need = P() ? P().need(p.level || 1) : 0;
        bar(inf, p.hp / p.maxHp, '', 'HP', p.hp + ' / ' + p.maxHp);
        if (smx) bar(inf, (p.sta == null ? smx : p.sta) / smx, 'st', 'ST', (p.sta == null ? smx : p.sta) + ' / ' + smx);
        bar(inf, xpFrac(p), 'xp', 'EXP', (p.exp || 0) + ' / ' + need);
        var bs = mk('div', 'hm-btns', card);
        var why = p.hp >= p.maxHp ? 'Already well' : mn < 1 ? 'No mana left' : null;
        var md = kb(bs, { icon: 'mend', label: 'Mend', desc: why || 'Heal, 1 mana', kind: 'alt', sm: true, onClick: function () { mend(p); } }); md.disabled = !!why;
        kb(bs, { icon: 'feather', label: 'Name', desc: 'Give it a name', kind: 'alt', sm: true, onClick: function () { H.naming && H.naming.ask(p.nick || '', portrait(p.key), 'Name your hontori').then(function (v) { if (v) { p.nick = v; g.save && g.save(); refresh(); } }); } });
        if (i > 0) kb(bs, { icon: 'star', label: 'Lead', desc: 'Walks with you', kind: 'alt', sm: true, onClick: function () { st.party.splice(i, 1); st.party.unshift(p); g.partyChanged && g.partyChanged(); refresh(); } });
        if (P()) kb(bs, { icon: 'claw', label: 'Moves', desc: 'Pick 4 for battle', kind: 'alt', sm: true, onClick: function () { moveFor = p; show('moves'); } });
        if (st.party.length > 1 && P()) kb(bs, { icon: 'crystal', label: 'Rest', desc: 'Into the Sanctum', kind: 'alt', sm: true, onClick: function () { P().toSanctum(i); } });
      });
      if (P()) kb(acts(), { icon: 'crystal', label: 'Wand Sanctum', desc: (st.sanctum || []).length + ' / ' + P().capacity() + ' resting in your wand', onClick: function () { sel = null; show('sanctum'); } });
    } else if (open === 'memory') {
      renderMemory(st);
    } else if (open === 'sanctum') {
      renderSanctum(g, st);
    } else if (open === 'spells') {
      header('Spell Loadout', 'book', (st.spellLoadout || []).length + ' of 4 ready for battle');
      P() && P().fixSpells(st);
      if (!(st.spells || []).length) mk('div', 'hm-empty', els.sheet, 'No spells learned yet.');
      (st.spells || []).forEach(function (id) {
        var inf = P().spellInfo(id), on = st.spellLoadout.indexOf(id) >= 0;
        pickRow(els.sheet, on, glyphEl(id), inf.name, 'Mana ' + inf.cost + '   Mastery ' + pips(inf.mastery), function () {
          var L = st.spellLoadout, k = L.indexOf(id);
          if (k >= 0) L.splice(k, 1); else if (L.length < 4) L.push(id); else { H.ui && H.ui.toast('Four spells at most'); return; }
          g.save && g.save(); render();
        });
      });
      kb(acts(), { icon: 'back', label: 'Back', kind: 'alt', onClick: function () { show('menu'); } });
    } else if (open === 'moves') {
      var m = moveFor && (st.party.indexOf(moveFor) >= 0 || (st.sanctum || []).indexOf(moveFor) >= 0) ? moveFor : st.party[0];
      if (!m) { hide(); return; }
      P().fixMoves(m);
      header('Moves', 'claw', displayName(m) + '   ' + m.moves.length + ' of 4 for battle');
      var pool = P().movePool(m);
      if (!pool.length) mk('div', 'hm-empty', els.sheet, 'No moves to choose yet.');
      pool.forEach(function (mv) {
        var on = m.moves.indexOf(mv.id) >= 0, sw = document.createElement('span');
        try { if (H.ui && H.ui.elementBadge) sw = H.ui.elementBadge(mv.element || spec(m.key).element); } catch (e) {}
        var bits = [];
        if (mv.power || mv.pow) bits.push('Power ' + (mv.power || mv.pow));
        if (mv.cooldown || mv.cd) bits.push('Rest ' + Math.max(0, (mv.cooldown || mv.cd) - 1));
        if (mv.effect || mv.desc) bits.push(mv.effect || mv.desc);
        pickRow(els.sheet, on, sw, mv.name, bits.join('   '), function () {
          var k = m.moves.indexOf(mv.id);
          if (k >= 0) { if (m.moves.length > 1) m.moves.splice(k, 1); else { H.ui && H.ui.toast('Keep at least one move'); return; } }
          else if (m.moves.length < 4) m.moves.push(mv.id); else { H.ui && H.ui.toast('Four moves at most'); return; }
          g.save && g.save(); render();
        });
      });
      kb(acts(), { icon: 'back', label: 'Back', kind: 'alt', onClick: function () { show('party'); } });
    } else if (open === 'menu') {
      header('Menu', 'cog');
      if (P()) {
        var wl = st.wandLevel || 1, sec = mk('div', 'hm-sec', els.sheet), wh = mk('h3', '', sec);
        wh.appendChild(K().img('wand')); wh.appendChild(document.createTextNode('Wand   Lv ' + wl));
        bar(sec, wl >= 10 ? 1 : (st.wandExp || 0) / P().wandNeed(wl), 'xp wd');
        var pk = P().wandPerks();
        note('Mana ' + (st.mana == null ? (st.maxMana || 3) : st.mana) + ' / ' + (st.maxMana || 3) + '   Spell power +' + Math.round((pk.power - 1) * 100) + '%   Capture +' + Math.round(pk.captureBonus * 100) + '%', sec).style.marginTop = '6px';
        var wa = acts(sec);
        kb(wa, { icon: 'crystal', label: 'Wand Sanctum', desc: 'Resting hontori', onClick: function () { sel = null; show('sanctum'); } });
        kb(wa, { icon: 'book', label: 'Spell Loadout', desc: 'Pick 4 for battle', onClick: function () { show('spells'); } });
        kb(wa, { icon: 'paw', label: 'Wand Memory', desc: 'Hontori you met and bound', onClick: function () { memSel = null; show('memory'); } });
      }
      var a = acts();
      kb(a, { icon: 'scroll', label: 'Save', desc: 'Also saves by itself', kind: 'alt', onClick: function () { g.save && g.save(); hide(); H.ui && H.ui.toast('Game saved'); } });
      var muted = H.audio && H.audio.muted;
      kb(a, { icon: muted ? 'bell_off' : 'bell', label: muted ? 'Sound off' : 'Sound on', desc: 'Tap to switch', kind: 'alt', onClick: function () { if (H.audio) { H.audio.setMuted(!H.audio.muted); render(); } } });
      var armed = false, ng = kb(a, { icon: 'sprout', label: 'New game', desc: 'Erases this save', kind: 'warn' });
      ng.addEventListener('click', function () { if (!armed) { armed = true; ng.querySelector('.t span').textContent = 'Tap again'; ng.querySelector('small').textContent = 'This erases your save'; } else g.reset && g.reset(); });
    }
  }

  // Wand Memory: one list of every hontori kind, each labelled Bound, Met or Unknown
  var memSel = null, memFilter = 'all';
  function memState(st, key) {
    var own = (st.party || []).concat(st.sanctum || []).some(function (m) { return m.key === key; }) || (st.bound || []).indexOf(key) >= 0 || (st.wand || []).indexOf(key) >= 0;
    if (own) return 'bound';
    return (st.seen || []).indexOf(key) >= 0 ? 'met' : 'unknown';
  }
  function renderMemory(st) {
    var all = (H.spirits && H.spirits.list) || [], TOTAL = 100;
    var nb = 0, nm = 0; all.forEach(function (s) { var k = memState(st, s.key); if (k === 'bound') nb++; if (k !== 'unknown') nm++; });
    if (memSel) {
      var s = memSel, ms = memState(st, s.key), stg = (H.spirits.stages && H.spirits.stages[s.key]) || [];
      header(ms === 'unknown' ? 'Not met yet' : (stg[0] && stg[0].name) || s.name, 'paw', ms === 'bound' ? 'Bound' : ms === 'met' ? 'Met' : '');
      var d = mk('div', 'hm-det', els.sheet); if (ms !== 'unknown') d.appendChild(copyCanvas(portrait(s.key, 1), 96));
      var inf = mk('div', 'inf', d); inf.style.flex = '1';
      if (ms !== 'unknown') {
        try { if (H.ui && H.ui.elementBadge) inf.appendChild(H.ui.elementBadge(s.element)); } catch (e) {}
        note((stg[0] && stg[0].desc) || '', inf).style.opacity = '1';
        if (ms === 'bound') note('Forms: ' + stg.map(function (x) { return x.name; }).join(', '), inf);
        else note('Bind one to learn its forms.', inf);
      } else note('The wand has not met this one. Look in other places, times and weather.', inf);
      kb(acts(), { icon: 'back', label: 'Back', kind: 'alt', onClick: function () { memSel = null; render(); } });
      return;
    }
    header('Wand Memory', 'paw', 'Met ' + nm + ', bound ' + nb + ', out of ' + TOTAL);
    var fr = mk('div', 'hm-btns', els.sheet); fr.style.cssText = 'flex-direction:row;gap:6px;margin-bottom:8px';
    [['all', 'All'], ['bound', 'Bound'], ['met', 'Met only']].forEach(function (f) { var b = kb(fr, { label: f[1], kind: memFilter === f[0] ? '' : 'alt', sm: true, onClick: function () { memFilter = f[0]; render(); } }); b.style.flex = '1'; });
    var grid = mk('div', 'hm-sg', els.sheet);
    all.forEach(function (s, i) {
      var ms = memState(st, s.key);
      if (memFilter === 'bound' && ms !== 'bound') return;
      if (memFilter === 'met' && ms !== 'met') return;
      var c = mk('div', 'hm-sc', grid);
      // no spoilers: an unknown kind shows only a quiet mark, never its picture
      if (ms === 'unknown') { var qm = mk('div', '', c, '?'); qm.style.cssText = 'width:60px;height:60px;margin:0 auto 4px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(255,255,255,.05);font-size:26px;font-weight:900;opacity:.4'; }
      else c.appendChild(copyCanvas(portrait(s.key, 1), 96));
      mk('span', 'lv', c, '#' + (i + 1));
      if (ms === 'unknown') { c.style.opacity = '.6'; mk('div', '', c, 'Not met'); }
      else { var stg = (H.spirits.stages && H.spirits.stages[s.key]) || []; mk('div', '', c, (stg[0] && stg[0].name) || s.name); var t = mk('span', 'hm-tag', c, ms === 'bound' ? 'Bound' : 'Met'); t.style.cssText = 'display:inline-block;margin-top:3px;' + (ms === 'met' ? 'background:rgba(159,208,255,.25);color:#bfe4ff' : ''); }
      c.addEventListener('click', function () { memSel = s; render(); });
    });
    if (!grid.children.length) mk('div', 'hm-empty', els.sheet, memFilter === 'bound' ? 'None bound yet.' : 'None here yet.');
    kb(acts(), { icon: 'back', label: 'Back', kind: 'alt', onClick: function () { show('menu'); } });
  }
  function renderSanctum(g, st) {
    var sn = st.sanctum || [], cap = P() ? P().capacity() : 12;
    var m = sel != null ? sn[sel] : null;
    if (!m) {
      sel = null; header('Wand Sanctum', 'crystal', sn.length + ' of ' + cap + ' \u00b7 tap one to open');
      if (!sn.length) mk('div', 'hm-empty', els.sheet, 'Quiet for now. A sixth hontori rests here.');
      var grid = mk('div', 'hm-sg', els.sheet);
      sn.forEach(function (p, j) {
        var c = mk('div', 'hm-sc', grid); c.appendChild(copyCanvas(portrait(p.key, p.stage), 96)); mk('span', 'lv', c, 'Lv ' + p.level);
        try { if (H.ui && H.ui.elementBadge) c.appendChild(H.ui.elementBadge(spec(p.key).element)); } catch (e) {}
        mk('div', '', c, stageName(p));
        c.addEventListener('click', function () { sel = j; confirmRel = false; swapPick = false; render(); });
      });
      kb(acts(), { icon: 'back', label: 'Back', desc: 'To your party', kind: 'alt', onClick: function () { show('party'); } });
      return;
    }
    header(displayName(m), 'crystal', 'Resting in the Sanctum');
    kb(els.sheet, { icon: 'feather', label: 'Name', desc: 'Give it a name', kind: 'alt', sm: true, onClick: function () { H.naming && H.naming.ask(m.nick || '', portrait(m.key), 'Name your hontori').then(function (v) { if (v) { m.nick = v; H.game.save && H.game.save(); render(); } }); } });
    var d = mk('div', 'hm-det', els.sheet), pc = copyCanvas(portrait(m.key, m.stage), 96); d.appendChild(pc);
    var inf = mk('div', 'inf', d); inf.style.flex = '1';
    var nm = mk('div', '', inf); nm.style.cssText = 'font-size:17px;font-weight:900;display:flex;gap:8px;align-items:center;flex-wrap:wrap';
    nm.appendChild(document.createTextNode(stageName(m)));
    try { if (H.ui && H.ui.elementBadge) nm.appendChild(H.ui.elementBadge(spec(m.key).element)); } catch (e) {}
    note('Lv ' + m.level + '   Stage ' + (m.stage || 1) + ' of 5   Health ' + m.hp + ' / ' + m.maxHp, inf);
    bar(inf, m.hp / m.maxHp); bar(inf, xpFrac(m), 'xp');
    if (confirmRel) {
      note('Release ' + displayName(m) + '? It goes back to the wild for good.').style.opacity = '1';
      var a2 = acts();
      kb(a2, { icon: 'feather', label: 'Release', desc: 'Cannot be undone', kind: 'warn', onClick: function () { var n = displayName(m); P().release(sel); sel = null; confirmRel = false; H.ui && H.ui.toast(n + ' went home'); render(); } });
      kb(a2, { icon: 'star', label: 'Keep', onClick: function () { confirmRel = false; render(); } });
      return;
    }
    var full = st.party.length >= MAX, a1 = acts();
    kb(a1, { icon: 'swap', label: full ? 'Swap in' : 'Join party', desc: full ? 'Trade with one in your party' : 'Travel with you', onClick: function () { if (!full) { P().fromSanctum(sel); sel = null; render(); } else { swapPick = !swapPick; render(); } } });
    kb(a1, { icon: 'feather', label: 'Release', desc: 'Back to the wild', kind: 'warn', onClick: function () { confirmRel = true; render(); } });
    if (swapPick) {
      note('Who rests instead?').style.opacity = '1';
      var pk = mk('div', 'hm-pick', els.sheet);
      st.party.forEach(function (p, i) {
        var b = kb(pk, { label: displayName(p), desc: 'Lv ' + p.level, kind: 'alt', sm: true, onClick: function () { P().fromSanctum(sel, i); sel = null; swapPick = false; H.ui && H.ui.toast(displayName(m) + ' joined your party'); render(); } });
        var pcv = copyCanvas(portrait(p.key, p.stage), 48); pcv.className = 'pp'; b.insertBefore(pcv, b.firstChild);
      });
    }
    kb(acts(), { icon: 'back', label: 'Back', kind: 'alt', onClick: function () { sel = null; swapPick = false; render(); } });
  }
  var HELP = {
    bag: ['Backpack', 'Your things live here. Tap one to see its use.', 'backpack', '.hm-top .hm-btn'],
    menu: ['Menu', 'Your wand, saving and sound.', 'cog', '.hm-top .hm-btn:nth-child(2)'],
    party: ['Your hontori', 'Five can travel with you. The first walks by you.', 'paw', '.hm-party'],
    sanctum: ['Wand Sanctum', 'More friends rest inside your wand. Swap them any time.', 'crystal', '.hm-sheet'],
    spells: ['Spell Loadout', 'Pick four spells to bring into battle.', 'book', '.hm-sheet'],
    moves: ['Moves', 'Pick four moves. New ones come as you grow.', 'claw', '.hm-sheet']
  };
  function show(what) { open = what; render(); els.shade.classList.add('on'); els.sheet.classList.add('on'); var h = HELP[what]; if (h && H.ui && H.ui.helper) H.ui.helper(what, h[0], h[1], h[2], h[3]); }
  function hide() { open = null; els.shade.classList.remove('on'); els.sheet.classList.remove('on'); }

  H.menu = { init: init, refresh: refresh, show: show, hide: hide, isOpen: function () { return !!open; } };
})();
