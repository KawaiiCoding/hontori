// Zoomed-in views for boards: the school blackboard (interactive element wheel)
// and the notice board (pinned notes). Hooks into H.interact for those prop types.
(function () {
  var H = window.H = window.H || {};
  var ELS = ['fire', 'grass', 'water', 'electric', 'wind', 'earth', 'dark', 'light'];
  var NAMES = { fire: 'Fire', grass: 'Grass', water: 'Water', electric: 'Electric', wind: 'Wind', earth: 'Earth', dark: 'Dark', light: 'Light' };
  var STRONG = {
    water: ['fire', 'earth'], fire: ['grass', 'wind'], wind: ['grass', 'electric'], grass: ['water', 'earth'],
    electric: ['water', 'wind'], earth: ['electric', 'fire'], dark: ['light'], light: ['dark']
  };
  var CSS = [
    '.hz{position:absolute;inset:0;z-index:48;background:rgba(6,6,16,.72);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .25s;touch-action:none;font-family:Nunito,"M PLUS Rounded 1c",system-ui,sans-serif}',
    '.hz.on{opacity:1}',
    '.hz-wrap{position:relative;width:min(94%,560px);transform:scale(.6);transition:transform .35s cubic-bezier(.2,1.3,.4,1)}',
    '.hz.on .hz-wrap{transform:scale(1)}',
    '.hz-x{position:absolute;right:-6px;top:-14px;width:40px;height:40px;border-radius:12px;border:0;background:#1b1e3a;color:#fff;font:900 18px Nunito,system-ui,sans-serif;box-shadow:0 3px 10px rgba(0,0,0,.5);cursor:pointer;z-index:2}',
    /* blackboard */
    '.hz-bb{border-radius:10px;padding:14px;background:#5a3a22;box-shadow:inset 0 0 0 3px #3a2414,0 14px 40px rgba(0,0,0,.6)}',
    '.hz-bb .slate{position:relative;border-radius:4px;background:radial-gradient(ellipse at 40% 35%,#2f4a3c,#1d3028);aspect-ratio:1/1;overflow:hidden}',
    '.hz-bb .slate:after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(25deg,rgba(255,255,255,.018) 0 3px,transparent 3px 9px);pointer-events:none}',
    '.hz-bb h3{position:absolute;left:0;right:0;top:3%;margin:0;text-align:center;color:#f4f1e8;font:900 clamp(16px,4.5vmin,24px) "Nunito",system-ui;letter-spacing:1px;opacity:.9}',
    '.hz-bb .foot{position:absolute;left:0;right:0;bottom:3%;text-align:center;color:#e8f0e0;font:800 clamp(12px,3.4vmin,16px) Nunito,system-ui;opacity:.85;padding:0 8%}',
    '.hz-bb .ledge{height:10px;margin:8px -6px -6px;border-radius:3px;background:#6e4a2c;box-shadow:inset 0 2px 0 #8a6040}',
    '.hz-el{position:absolute;width:15%;aspect-ratio:1/1;transform:translate(-50%,-50%);border-radius:50%;border:2px dashed rgba(244,241,232,.55);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:transform .2s,border-color .2s}',
    '.hz-el img{width:62%;image-rendering:pixelated;filter:drop-shadow(0 0 4px rgba(255,255,255,.25))}',
    '.hz-el span{position:absolute;top:100%;margin-top:2px;color:#f4f1e8;font:800 clamp(10px,2.8vmin,13px) Nunito,system-ui;white-space:nowrap}',
    '.hz-el.sel{transform:translate(-50%,-50%) scale(1.15);border-color:#fff;border-style:solid}',
    /* notice board */
    '.hz-nb{border-radius:10px;padding:14px;background:#6a4428;box-shadow:inset 0 0 0 3px #43291a,0 14px 40px rgba(0,0,0,.6)}',
    '.hz-nb .cork{position:relative;border-radius:4px;aspect-ratio:4/5;background:#c08850;background-image:radial-gradient(rgba(90,50,20,.35) 1px,transparent 1.5px),radial-gradient(rgba(255,230,180,.25) 1px,transparent 1.5px);background-size:9px 9px,13px 13px;background-position:0 0,4px 6px}',
    '.hz-note{position:absolute;padding:12px 12px 10px;background:#fff8e6;color:#3a2a1a;font:700 clamp(12px,3.3vmin,15px)/1.3 Nunito,system-ui;box-shadow:0 4px 10px rgba(0,0,0,.3);cursor:pointer;transition:transform .2s}',
    '.hz-note b{display:block;font-weight:900;font-size:1.08em;margin-bottom:4px;color:#7a2a14}',
    '.hz-note:before{content:"";position:absolute;left:50%;top:-6px;width:12px;height:12px;margin-left:-6px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ff9a8a,#c0392b);box-shadow:0 2px 2px rgba(0,0,0,.35)}',
    '.hz-note.big{transform:scale(1.25) rotate(0deg)!important;z-index:3}',
    '.hz-note.blue{background:#e8f2ff}.hz-note.green{background:#eaf7df}.hz-note.pink{background:#ffeaf0}'
  ].join('\n');
  var styled = false;
  function style() { if (styled) return; var s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); styled = true; }
  function mk(tag, cls, parent, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; }
  function icon(el) { try { return H.icons.url(el, 3); } catch (e) { return ''; } }
  function sfx(n) { try { H.audio && H.audio.sfx(n); } catch (e) {} }

  function open(build) {
    style();
    return new Promise(function (resolve) {
      var root = document.getElementById('root'), o = mk('div', 'hz', root), wrap = mk('div', 'hz-wrap', o);
      build(wrap);
      var x = mk('button', 'hz-x', wrap, 'X');
      function close() { o.classList.remove('on'); setTimeout(function () { o.remove(); resolve(); }, 260); window.removeEventListener('keydown', key, true); }
      function key(e) { if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); close(); } }
      x.addEventListener('click', close);
      o.addEventListener('click', function (e) { if (e.target === o) close(); });
      window.addEventListener('keydown', key, true);
      requestAnimationFrame(function () { o.classList.add('on'); });
      sfx('page');
    });
  }

  // ---- blackboard: element wheel, tap an element to see what it beats (green) and what beats it (red)
  var bbVisit = 0;
  function blackboard() {
    return open(function (wrap) {
      var bb = mk('div', 'hz-bb', wrap), slate = mk('div', 'slate', bb);
      mk('h3', '', slate, 'The Element Wheel');
      var foot = mk('div', 'foot', slate, '');
      var NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '0 0 100 100'); svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
      var defs = document.createElementNS(NS, 'defs');
      defs.innerHTML = '<filter id="chalk"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="0.8"/></filter>' +
        '<marker id="ahg" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#b8f0a0"/></marker>' +
        '<marker id="ahr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#ff9a8a"/></marker>';
      svg.appendChild(defs); slate.appendChild(svg);
      // chalk circle guide
      var ring = document.createElementNS(NS, 'circle'); ring.setAttribute('cx', 50); ring.setAttribute('cy', 53); ring.setAttribute('r', 31);
      ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', 'rgba(244,241,232,.22)'); ring.setAttribute('stroke-width', '0.6'); ring.setAttribute('stroke-dasharray', '1.5 2'); ring.setAttribute('filter', 'url(#chalk)');
      svg.appendChild(ring);
      var arrows = document.createElementNS(NS, 'g'); svg.appendChild(arrows);
      var pos = {};
      ELS.forEach(function (el, i) {
        var a = -Math.PI / 2 + i / ELS.length * Math.PI * 2, x = 50 + Math.cos(a) * 31, y = 53 + Math.sin(a) * 31;
        pos[el] = [x, y];
        var b = mk('div', 'hz-el', slate, '<img alt="" src="' + icon(el) + '"><span>' + NAMES[el] + '</span>');
        b.style.left = x + '%'; b.style.top = y + '%';
        b.addEventListener('click', function (e) { e.stopPropagation(); pick(el); sfx('blip'); });
        b.dataset.el = el;
      });
      function arrow(from, to, col, mk2) {
        var p = pos[from], q = pos[to], dx = q[0] - p[0], dy = q[1] - p[1], d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d, r = 8.5;
        var x1 = p[0] + ux * r, y1 = p[1] + uy * r, x2 = q[0] - ux * r, y2 = q[1] - uy * r, mx = (x1 + x2) / 2 - uy * 5, my = (y1 + y2) / 2 + ux * 5;
        var path = document.createElementNS(NS, 'path');
        path.setAttribute('d', 'M' + x1 + ' ' + y1 + ' Q' + mx + ' ' + my + ' ' + x2 + ' ' + y2);
        path.setAttribute('fill', 'none'); path.setAttribute('stroke', col); path.setAttribute('stroke-width', '1.1'); path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('marker-end', 'url(#' + mk2 + ')'); path.setAttribute('filter', 'url(#chalk)');
        var len = 80; path.style.strokeDasharray = len; path.style.strokeDashoffset = len; path.style.transition = 'stroke-dashoffset .5s ease-out';
        arrows.appendChild(path); requestAnimationFrame(function () { requestAnimationFrame(function () { path.style.strokeDashoffset = 0; }); });
      }
      function pick(el) {
        arrows.innerHTML = '';
        slate.querySelectorAll('.hz-el').forEach(function (b) { b.classList.toggle('sel', b.dataset.el === el); });
        var beats = STRONG[el] || [], beatenBy = ELS.filter(function (o) { return (STRONG[o] || []).indexOf(el) >= 0; });
        beats.forEach(function (t) { arrow(el, t, '#b8f0a0', 'ahg'); });
        beatenBy.forEach(function (f) { arrow(f, el, '#ff9a8a', 'ahr'); });
        foot.innerHTML = '<span style="color:#b8f0a0">' + NAMES[el] + ' beats ' + beats.map(function (b) { return NAMES[b]; }).join(' and ') + '.</span> <span style="color:#ff9a8a">Weak to ' + beatenBy.map(function (b) { return NAMES[b]; }).join(' and ') + '.</span>';
      }
      pick(ELS[bbVisit++ % ELS.length]);
    });
  }

  // ---- notice board: pinned notes, tap one to read it larger
  function noticeBoard() {
    var notes = [
      ['Lost hontori', 'A small water hontori was seen by the pond at dusk. Please be gentle with it.', 'blue', 6, 6, -4],
      ['Ramen night', 'The Steaming Bowl. Warm bowls restore body and mana alike.', 'pink', 52, 4, 3],
      ['Academy notice', 'Entrance trial at dawn. Bring one calm hontori and a steady hand.', 'green', 8, 42, 2],
      ['Take care', 'Jealous hontori hide in the tall grass. Weaken them before you try to bind.', '', 50, 40, -3],
      ['Wanted', 'Ember Dust for the old forge. Ask the shopkeeper.', '', 28, 74, 1]
    ];
    return open(function (wrap) {
      var nb = mk('div', 'hz-nb', wrap), cork = mk('div', 'cork', nb);
      notes.forEach(function (n) {
        var el = mk('div', 'hz-note ' + n[2], cork, '<b>' + n[0] + '</b>' + n[1]);
        el.style.left = n[3] + '%'; el.style.top = n[4] + '%'; el.style.width = '40%'; el.style.transform = 'rotate(' + n[5] + 'deg)';
        el.addEventListener('click', function (e) { e.stopPropagation(); var on = el.classList.contains('big'); cork.querySelectorAll('.hz-note').forEach(function (x) { x.classList.remove('big'); }); if (!on) el.classList.add('big'); sfx('page'); });
      });
    });
  }

  H.closeup = { blackboard: blackboard, noticeBoard: noticeBoard };

  // route the board props to the zoomed views
  if (H.interact) {
    var run0 = H.interact.run, has0 = H.interact.has;
    H.interact.has = function (t) { return t === 'blackboard' || t === 'notice_board' || has0.call(this, t); };
    H.interact.run = function (t, c) {
      if (t === 'blackboard') return blackboard();
      if (t === 'notice_board') return noticeBoard();
      return run0.apply(this, arguments);
    };
  }
})();
