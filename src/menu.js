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
    '.hm-row .sub{font-size:13px;opacity:.75;margin:2px 0 6px}',
    '.hm-bar{height:8px;border-radius:4px;background:rgba(0,0,0,.5);overflow:hidden}',
    '.hm-bar b{display:block;height:100%;background:linear-gradient(90deg,#57d07a,#9cf0a6)}',
    '.hm-tag{font-size:11px;font-weight:900;padding:2px 8px;border-radius:999px;background:#ffc56b;color:#2a1c05}',
    '.hm-mini{border:0;border-radius:10px;padding:8px 10px;font:inherit;font-weight:800;font-size:13px;background:rgba(255,255,255,.14);color:#fff;cursor:pointer}',
    '.hm-acts{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}',
    '.hm-act{flex:1;min-width:120px;border:0;border-radius:14px;padding:14px 10px;font:inherit;font-weight:900;font-size:16px;color:#14162a;background:#8fd0ff;cursor:pointer}',
    '.hm-act.warn{background:rgba(255,255,255,.12);color:#ffb3a8}',
    '.hm-note{font-size:13px;opacity:.7;margin-top:10px;line-height:1.35}'
  ].join('\n');

  function mk(tag, cls, parent, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; }
  function game() { return H.game || { state: { items: [], party: [] } }; }
  function spec(key) { return (H.spirits && H.spirits.list.filter(function (s) { return s.key === key; })[0]) || { key: key, name: key, element: 'fire' }; }
  function iconCanvas(name) { try { return H.icons.canvas(name, 2); } catch (e) { return null; } }
  function copyCanvas(src, size) { var c = document.createElement('canvas'); c.width = c.height = size; var g = c.getContext('2d'); g.imageSmoothingEnabled = false; if (src) g.drawImage(src, 0, 0, size, size); return c; }
  function portrait(key) { try { return H.spirits.portrait(key); } catch (e) { return null; } }
  function itemCanvas(it) {
    var c = document.createElement('canvas'); c.width = c.height = 32; var g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    try {
      if (H.items && H.items.list.some(function (x) { return x.id === it.id; })) { g.scale(2, 2); H.items.draw(g, it.id, 0, 0); }
      else { var ic = iconCanvas(it.icon || it.id); if (ic) g.drawImage(ic, 0, 0, 32, 32); }
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
    var mn = mk('div', 'hm-btn', top); mn.title = 'Settings'; mn.appendChild(pixelCog());
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
      if (p) { s.appendChild(copyCanvas(portrait(p.key), 48)); var bar = mk('i', '', s), f = mk('b', '', bar); f.style.width = Math.round(100 * p.hp / p.maxHp) + '%'; }
    }
    if (open) render();
  }

  function header(title) { var h = mk('div', 'hm-h', els.sheet); mk('h2', '', h, title); var x = mk('button', 'hm-x', h, 'X'); x.addEventListener('click', hide); }

  function render() {
    var g = game(), st = g.state; els.sheet.innerHTML = '';
    if (open === 'bag') {
      header('Backpack');
      if (!st.items.length) mk('div', 'hm-empty', els.sheet, 'Empty for now. You will pick 5 things from home before leaving.');
      else { var grid = mk('div', 'hm-grid', els.sheet); st.items.forEach(function (it) { var c = mk('div', 'hm-item', grid); c.appendChild(itemCanvas(it)); c.appendChild(document.createTextNode(it.name + (it.n > 1 ? ' x' + it.n : ''))); }); }
    } else if (open === 'party') {
      header('Your Hontori  ' + st.party.length + ' / ' + MAX);
      if (!st.party.length) mk('div', 'hm-empty', els.sheet, 'No hontori with you yet.');
      st.party.forEach(function (p, i) {
        var s = spec(p.key), row = mk('div', 'hm-row' + (i === 0 ? ' lead' : ''), els.sheet);
        var pc = copyCanvas(portrait(p.key), 96); pc.className = 'por'; row.appendChild(pc);
        var inf = mk('div', 'inf', row), nm = mk('div', 'nm', inf); nm.appendChild(document.createTextNode(displayName(p)));
        try { if (H.ui && H.ui.elementBadge) nm.appendChild(H.ui.elementBadge(s.element)); } catch (e) {}
        if (i === 0) mk('span', 'hm-tag', nm, 'WALKING WITH YOU');
        mk('div', 'sub', inf, 'Level ' + p.level + '   Health ' + p.hp + ' / ' + p.maxHp);
        var bar = mk('div', 'hm-bar', inf), f = mk('b', '', bar); f.style.width = Math.round(100 * p.hp / p.maxHp) + '%';
        if (i > 0) { var b = mk('button', 'hm-mini', row, 'Lead'); b.addEventListener('click', function () { st.party.splice(i, 1); st.party.unshift(p); g.partyChanged && g.partyChanged(); refresh(); }); }
      });
      mk('div', 'hm-note', els.sheet, 'Up to 5 hontori travel with you. The first one walks beside you; the others rest inside the wand. Every hontori you meet is remembered in the wand.');
    } else if (open === 'menu') {
      header('Menu');
      var acts = mk('div', 'hm-acts', els.sheet);
      var sv = mk('button', 'hm-act', acts, 'Save game'); sv.addEventListener('click', function () { g.save && g.save(); hide(); H.ui && H.ui.toast('Game saved'); });
      var bt = mk('button', 'hm-act', acts, 'Spirit battle (demo)'); bt.addEventListener('click', function () { hide(); setTimeout(function () { H.game.battle && H.game.battle(); }, 250); });
      var snd = mk('button', 'hm-act', acts, (H.audio && H.audio.muted) ? 'Sound: off' : 'Sound: on');
      snd.addEventListener('click', function () { if (H.audio) { H.audio.setMuted(!H.audio.muted); render(); } });
      var ng = mk('button', 'hm-act warn', acts, 'New game'); var armed = false;
      ng.addEventListener('click', function () { if (!armed) { armed = true; ng.textContent = 'Tap again to erase'; } else g.reset && g.reset(); });
      mk('div', 'hm-note', els.sheet, 'The game also saves by itself on this device when you change area, and every 30 seconds.');
    }
  }

  function show(what) { open = what; render(); els.shade.classList.add('on'); els.sheet.classList.add('on'); }
  function hide() { open = null; els.shade.classList.remove('on'); els.sheet.classList.remove('on'); }

  H.menu = { init: init, refresh: refresh, show: show, hide: hide, isOpen: function () { return !!open; } };
})();
