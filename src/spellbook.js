window.H = window.H || {};
// New spell moments: whenever the kid learns a sigil, a clear card shows its shape, what it does,
// how to draw it, and where to find it again (Menu, Spells). It also joins the battle loadout if there is room.
(function () {
  'use strict';
  var H = window.H;
  var HOW = { circle: 'Draw a circle', U: 'Draw a cup shape', peak: 'Draw a peak', zigzag: 'Draw a zigzag', wave: 'Draw a wave', spiral: 'Draw a spiral from the outside in', star: 'Draw a star in one line', V: 'Draw a V' };
  var CSS = '.hsb{position:absolute;inset:0;z-index:58;display:flex;align-items:center;justify-content:center;background:rgba(6,6,16,.78);opacity:0;transition:opacity .25s;font-family:Nunito,"M PLUS Rounded 1c",system-ui,sans-serif;color:#f4f1e8}' +
    '.hsb.on{opacity:1}.hsb .bx{width:min(88%,360px);padding:18px 16px 14px;border-radius:22px;text-align:center;background:linear-gradient(180deg,#1d2040,#101226);border:2px solid #ffd98a;box-shadow:0 0 40px rgba(255,217,138,.35),0 12px 40px rgba(0,0,0,.6)}' +
    '.hsb small{display:block;font-size:12px;font-weight:900;letter-spacing:4px;text-transform:uppercase;color:#ffd98a}' +
    '.hsb .sg{width:120px;height:120px;margin:10px auto 6px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle,rgba(255,217,138,.25),rgba(255,217,138,0) 70%);animation:hsbS 1.2s ease-out both}' +
    '.hsb .sg svg{width:96px;height:96px}.hsb b{display:block;font-size:24px;font-weight:900;margin-top:4px}' +
    '.hsb p{margin:6px 0 0;font-size:15px;font-weight:700;line-height:1.35;opacity:.92}.hsb .w{margin-top:10px;font-size:13px;color:#bfe4ff}' +
    '.hsb .row{display:flex;gap:8px;margin-top:14px}.hsb button{flex:1;border:0;border-radius:14px;padding:11px;font:inherit;font-weight:900;font-size:15px;cursor:pointer}' +
    '.hsb .ok{background:linear-gradient(180deg,#ffd98a,#ff9a3c);color:#2a1405}.hsb .bk{background:rgba(255,255,255,.12);color:#fff}' +
    '@keyframes hsbS{from{transform:scale(.3) rotate(-90deg);opacity:0}to{transform:none;opacity:1}}';
  function S() { return (H.game && H.game.state) || {}; }
  var showing = false;
  function show(id) {
    var B = (H.battle && H.battle.SPELLS) || {}, sp = B[id] || { name: id, desc: '', how: '' }, st = S();
    if (!document.getElementById('hsb-css')) { var c = document.createElement('style'); c.id = 'hsb-css'; c.textContent = CSS; document.head.appendChild(c); }
    var L = st.spellLoadout = st.spellLoadout || [], added = false;
    if (L.indexOf(id) < 0 && L.length < 4) { L.push(id); added = true; }
    try { H.game.save(); } catch (e) {}
    showing = true;
    return new Promise(function (res) {
      var o = document.createElement('div'); o.className = 'hsb';
      var svg = ''; try { svg = H.gesture.sigilSVG(id, sp.col || '#ffd98a', false); } catch (e) {}
      o.innerHTML = '<div class="bx"><small>New spell learned</small><div class="sg">' + svg + '</div><b>' + sp.name + '</b><p>' + (sp.desc || '') + (sp.cost ? '. Costs ' + sp.cost + ' mana.' : '.') + '</p>' +
        '<p class="w">' + (HOW[sp.how] || '') + '. ' + (added ? 'It is ready for battle.' : 'Add it to your four battle spells in the spell book.') + '<br>Find it any time in Menu, Spells.</p>' +
        '<div class="row"><button class="bk">Spell book</button><button class="ok">Got it</button></div></div>';
      (document.getElementById('root') || document.body).appendChild(o);
      try { H.audio && H.audio.sfx('spell'); } catch (e) {}
      requestAnimationFrame(function () { o.classList.add('on'); });
      function done(open) { o.classList.remove('on'); setTimeout(function () { o.remove(); showing = false; if (open && H.menu && H.menu.show) H.menu.show('spells'); res(); }, 250); }
      o.querySelector('.ok').addEventListener('click', function () { done(false); });
      o.querySelector('.bk').addEventListener('click', function () { done(true); });
    });
  }
  // watch for spells that were just learned (any lesson, any story event)
  setInterval(function () {
    var st = S(); if (!st.intro || showing || !Array.isArray(st.spells)) return;
    if (!Array.isArray(st.spellsSeen)) { st.spellsSeen = st.spells.slice(); return; }   // old saves: no flood of cards
    if (document.querySelector('.hb') || (H.ui && H.ui.isOpen && H.ui.isOpen()) || (H.story && H.story.busy)) return;
    var nw = st.spells.filter(function (k) { return st.spellsSeen.indexOf(k) < 0; })[0];
    if (!nw) return;
    st.spellsSeen.push(nw); show(nw === 'absorb' ? 'bind' : nw);
  }, 700);
  H.spellbook = { show: show };
})();
