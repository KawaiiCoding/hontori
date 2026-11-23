window.H = window.H || {};
// Unlock: the full journey is bought once. Until the stores are wired up, a code unlocks it.
// The offer is shown once, at the end of Chapter 2, and never interrupts play. A grown-up check sits before the code field.
// API: H.unlock = { isFull(), open(reason) -> Promise<bool>, offerOnce(key) -> Promise }
(function () {
  'use strict';
  var H = window.H, KEY = 'hontori.full';
  // the code is compared by its hash, so the plain text is not sitting in the page
  var CODE_HASH = 2249155625; // "VELUM-8-RINGS"
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h; }
  function norm(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function isFull() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function setFull() { try { localStorage.setItem(KEY, '1'); } catch (e) {} }
  var CSS = [
    '.hul{position:absolute;inset:0;z-index:70;display:flex;align-items:center;justify-content:center;background:rgba(6,7,20,.82);opacity:0;transition:opacity .25s;font-family:Nunito,"M PLUS Rounded 1c",system-ui,sans-serif;color:#f4f1e8}',
    '.hul.on{opacity:1}',
    '.hul-card{width:min(90%,360px);max-height:92%;overflow:auto;padding:18px;border-radius:18px;background:linear-gradient(180deg,#262a52,#1a1d3c);border:3px solid #ffd98a;box-shadow:0 0 0 2px #14143a,0 14px 40px #000;text-align:center}',
    '.hul-card h2{margin:6px 0 2px;font-size:22px;font-weight:900;color:#ffd98a}',
    '.hul-card p{margin:8px 0;font-size:14px;font-weight:700;line-height:1.4;opacity:.92}',
    '.hul-art{display:flex;justify-content:center;gap:6px;margin:4px 0}.hul-art canvas{width:64px;height:64px;image-rendering:pixelated}',
    '.hul-list{text-align:left;margin:10px 0;padding:10px 12px;border-radius:12px;background:rgba(0,0,0,.25);font-size:13px;font-weight:700;line-height:1.5}',
    '.hul-in{width:100%;box-sizing:border-box;margin:8px 0;padding:11px 12px;border-radius:12px;border:2px solid rgba(255,255,255,.25);background:#10122a;color:#fff;font:900 18px Nunito,system-ui,sans-serif;text-align:center;letter-spacing:1px;-webkit-user-select:text;user-select:text}',
    '.hul-in:focus{outline:none;border-color:#ffd98a}',
    '.hul-err{min-height:18px;font-size:13px;font-weight:800;color:#ffb08a}',
    '.hul-row{display:flex;gap:8px;margin-top:8px}.hul-row .hk-btn{flex:1}'
  ].join('');
  var styled = false;
  function mk(tag, cls, parent, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; }
  function art(parent) {
    var row = mk('div', 'hul-art', parent);
    ['wind', 'water', 'hontori', 'electric', 'earth'].forEach(function (k) { try { var c = mk('canvas', '', row); c.width = c.height = 64; var p = H.spirits.portrait(k); c.getContext('2d').drawImage(p, 0, 0, p.width, p.height, 0, 0, 64, 64); } catch (e) {} });
  }
  var openNow = null;
  // open(reason): 'offer' shows the story card first; 'code' goes straight to the grown-up check
  function open(reason) {
    if (openNow) return openNow;
    openNow = new Promise(function (resolve) {
      var root = document.getElementById('root'); if (!root) return resolve(false);
      if (!styled) { var st = mk('style', '', document.head); st.textContent = CSS; styled = true; }
      var el = mk('div', 'hul', root), card = mk('div', 'hul-card', el);
      function close(v) { el.classList.remove('on'); setTimeout(function () { el.remove(); openNow = null; resolve(!!v); }, 250); }
      function clear() { card.innerHTML = ''; }
      function btn(parent, o) { return H.kit ? H.kit.btn(parent, o) : (function () { var b = mk('button', '', parent, o.label); b.addEventListener('click', o.onClick); return b; })(); }
      function done() {
        clear(); art(card); mk('h2', '', card, 'The full journey is yours');
        mk('p', '', card, 'Thank you. Eight rings, eight lands, one new law. New chapters open here as they are finished.');
        btn(card, { icon: 'star', label: 'Continue', kind: 'gold', wide: true, onClick: function () { close(true); } });
      }
      function codeStep() {
        clear(); mk('h2', '', card, 'Enter your code');
        mk('p', '', card, 'Type the code that came with your purchase.');
        var inp = mk('input', 'hul-in', card); inp.type = 'text'; inp.autocapitalize = 'characters'; inp.autocomplete = 'off'; inp.spellcheck = false; inp.placeholder = 'XXXXX-X-XXXXX'; inp.maxLength = 24;
        var err = mk('div', 'hul-err', card, ''), tries = 0;
        var row = mk('div', 'hul-row', card);
        btn(row, { label: 'Back', kind: 'alt', onClick: function () { close(false); } });
        function submit() {
          if (hash(norm(inp.value)) === CODE_HASH) { setFull(); try { H.audio && H.audio.sfx && H.audio.sfx('wand'); } catch (e) {} return done(); }
          tries++; err.textContent = inp.value ? 'That code does not fit. Check it and try again.' : 'Type the code first.'; inp.select();
        }
        btn(row, { icon: 'wand', label: 'Unlock', kind: 'gold', onClick: submit });
        inp.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') submit(); });
        inp.addEventListener('keyup', function (e) { e.stopPropagation(); });
        setTimeout(function () { try { inp.focus(); } catch (e) {} }, 300);
      }
      // a grown-up check: a small sum a young child will not answer by tapping around
      function gate() {
        clear(); mk('h2', '', card, 'For grown-ups');
        var a = 6 + Math.floor(Math.random() * 4), b = 6 + Math.floor(Math.random() * 4);
        mk('p', '', card, 'Please ask a grown-up. What is ' + a + ' times ' + b + '?');
        var inp = mk('input', 'hul-in', card); inp.type = 'text'; inp.inputMode = 'numeric'; inp.autocomplete = 'off'; inp.maxLength = 3;
        var err = mk('div', 'hul-err', card, '');
        var row = mk('div', 'hul-row', card);
        btn(row, { label: 'Back', kind: 'alt', onClick: function () { close(false); } });
        function submit() { if (parseInt(inp.value, 10) === a * b) codeStep(); else { err.textContent = 'Not quite. Ask a grown-up to help.'; inp.value = ''; } }
        btn(row, { label: 'Next', kind: 'gold', onClick: submit });
        inp.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') submit(); });
        inp.addEventListener('keyup', function (e) { e.stopPropagation(); });
        setTimeout(function () { try { inp.focus(); } catch (e) {} }, 300);
      }
      function offer() {
        clear(); art(card); mk('h2', '', card, 'The road goes on');
        mk('p', '', card, 'You earned the Leaf Ring. Seven more schools wait beyond the pass, and the Archmage has noticed you.');
        var l = mk('div', 'hul-list', card);
        l.innerHTML = 'The full journey, bought once:<br>&bull; Eight lands and eight rings<br>&bull; Every hontori and every spell<br>&bull; No ads, nothing else to buy';
        btn(card, { icon: 'wand', label: 'I have a code', desc: 'For grown-ups', kind: 'gold', wide: true, onClick: gate });
        var later = btn(card, { label: 'Keep playing', desc: 'Everything so far stays open', kind: 'alt', wide: true, onClick: function () { close(false); } }); later.style.marginTop = '8px';
      }
      if (isFull()) done(); else if (reason === 'offer') offer(); else gate();
      // keys typed here never reach the game
      el.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      requestAnimationFrame(function () { el.classList.add('on'); });
    });
    return openNow;
  }
  // shown once per journey at a story moment; later the menu and the title screen carry a quiet button
  function offerOnce(key) {
    var s = (H.game && H.game.state) || {}, f = (s.flags = s.flags || {});
    if (isFull() || f['offer:' + key]) return Promise.resolve(false);
    f['offer:' + key] = true; try { H.game.save(); } catch (e) {}
    return open('offer');
  }
  H.unlock = { isFull: isFull, open: open, offerOnce: offerOnce };
})();
