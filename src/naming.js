// Naming panel: give a hontori its own name. H.naming.ask(current, portraitCanvas) -> Promise<string|null>
(function () {
  var H = window.H = window.H || {};
  var CSS = [
    '.hn{position:absolute;inset:0;z-index:52;background:rgba(6,6,16,.72);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s;font-family:Nunito,"M PLUS Rounded 1c",system-ui,sans-serif}',
    '.hn.on{opacity:1}',
    '.hn .bx{width:min(90%,380px);padding:18px 16px 16px;border-radius:20px;background:linear-gradient(180deg,#1b1e3a,#101226);border:2px solid #ffc56b;box-shadow:0 12px 40px rgba(0,0,0,.6);text-align:center;color:#f4f1e8}',
    '.hn canvas{width:88px;height:88px;image-rendering:pixelated;border-radius:16px;background:rgba(255,197,107,.12);margin:0 auto 8px;display:block}',
    '.hn h3{margin:0 0 10px;font-size:19px;font-weight:900}',
    '.hn input{width:100%;box-sizing:border-box;font:inherit;font-size:20px;font-weight:900;text-align:center;padding:12px;border-radius:14px;border:2px solid rgba(255,255,255,.2);background:#0c0d20;color:#fff;outline:none}',
    '.hn input:focus{border-color:#ffc56b}',
    '.hn .row{display:flex;gap:8px;margin-top:12px}',
    '.hn button{flex:1;border:0;border-radius:14px;padding:12px;font:inherit;font-weight:900;font-size:16px;cursor:pointer}',
    '.hn .ok{background:linear-gradient(180deg,#ffd98a,#ff9a3c);color:#2a1405;box-shadow:0 4px 0 #a8501c}',
    '.hn .no{background:rgba(255,255,255,.1);color:#fff}',
    '.hn .ok:active,.hn .no:active{transform:translateY(3px);box-shadow:none}'
  ].join('\n');
  // a few gentle suggestions so nobody is stuck on an empty box
  var IDEAS = ['Ember', 'Kindle', 'Sootling', 'Pebble', 'Juniper', 'Wisp', 'Cinder', 'Maple', 'Nova', 'Tansy'];

  function ask(current, portrait, title) {
    return new Promise(function (resolve) {
      if (!document.getElementById('hn-css')) { var st = document.createElement('style'); st.id = 'hn-css'; st.textContent = CSS; document.head.appendChild(st); }
      var root = document.getElementById('root') || document.body;
      var o = document.createElement('div'); o.className = 'hn';
      var bx = document.createElement('div'); bx.className = 'bx'; o.appendChild(bx);
      if (portrait) { var c = document.createElement('canvas'); c.width = c.height = 96; var g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(portrait, 0, 0, 96, 96); bx.appendChild(c); }
      var h = document.createElement('h3'); h.textContent = title || 'Choose a name'; bx.appendChild(h);
      var inp = document.createElement('input'); inp.maxLength = 12; inp.autocomplete = 'off'; inp.spellcheck = false;
      inp.value = current || ''; inp.placeholder = IDEAS[Math.floor(Math.random() * IDEAS.length)]; bx.appendChild(inp);
      var row = document.createElement('div'); row.className = 'row'; bx.appendChild(row);
      var no = document.createElement('button'); no.className = 'no'; no.textContent = 'Later'; row.appendChild(no);
      var ok = document.createElement('button'); ok.className = 'ok'; ok.textContent = 'Name it'; row.appendChild(ok);
      function done(v) {
        o.classList.remove('on'); setTimeout(function () { o.remove(); }, 200);
        window.removeEventListener('keydown', stopKeys, true); resolve(v);
      }
      // keep the game's keys (space, arrows) from reacting while typing
      function stopKeys(e) { if (e.key === 'Enter') { e.preventDefault(); ok.click(); } else if (e.key === 'Escape') done(null); e.stopPropagation(); }
      window.addEventListener('keydown', stopKeys, true);
      ok.addEventListener('click', function () {
        var v = (inp.value || inp.placeholder || '').replace(/[^\p{L}\p{N} '\-]/gu, '').trim().slice(0, 12);
        done(v || null);
      });
      no.addEventListener('click', function () { done(null); });
      root.appendChild(o); requestAnimationFrame(function () { o.classList.add('on'); setTimeout(function () { try { inp.focus(); } catch (e) {} }, 60); });
    });
  }
  H.naming = { ask: ask };
})();
