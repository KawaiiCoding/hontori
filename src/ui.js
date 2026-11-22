window.H = window.H || {};
(function () {
  'use strict';
  var root, els = {}, dlg = null, choice = null, fadeBusy = null;
  var input = { dx: 0, dy: 0, ax: 0, ay: 0, action: false, back: false, run: false };
  var resetJoy = function () {};

  var CSS = [
    '.hui{position:absolute;inset:0;pointer-events:none;container-type:size;font-family:"Nunito","M PLUS Rounded 1c",system-ui,-apple-system,"Segoe UI",sans-serif;color:#fff;z-index:10;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;overflow:hidden;--sa-t:env(safe-area-inset-top,0px);--sa-b:env(safe-area-inset-bottom,0px);--sa-l:env(safe-area-inset-left,0px);--sa-r:env(safe-area-inset-right,0px);--u:min(1vw,1vh);--u:1cqmin}',
    '.hui *{box-sizing:border-box}',
    '.hui img.px{image-rendering:pixelated;image-rendering:crisp-edges;display:block}',
    /* HUD pill */
    '.hui-hud{position:absolute;top:calc(var(--sa-t) + clamp(6px,calc(var(--u)*2),16px));left:calc(var(--sa-l) + clamp(6px,calc(var(--u)*2),16px));display:flex;align-items:center;gap:clamp(5px,calc(var(--u)*1.4),10px);padding:clamp(3px,calc(var(--u)*.8),6px) clamp(10px,calc(var(--u)*2.4),16px) clamp(3px,calc(var(--u)*.8),6px) clamp(4px,calc(var(--u)*1),8px);border-radius:999px;background:rgba(14,16,32,.8);border:2px solid rgba(255,255,255,.18);box-shadow:0 3px 12px rgba(0,0,0,.4);font-weight:800;font-size:clamp(13px,calc(var(--u)*3.6),19px);letter-spacing:.02em;text-shadow:0 1px 2px #000;max-width:calc(100% - 24px);white-space:nowrap}',
    '.hui-hud img.px{width:clamp(26px,calc(var(--u)*6.5),34px);height:clamp(26px,calc(var(--u)*6.5),34px);flex:0 0 auto}',
    '.hui-hud img.px[hidden]{display:none}',
    '.hui-hud .ics{display:flex;gap:2px;align-items:center}',
    '.hui-hud .pl{color:#ffe7a8;overflow:hidden;text-overflow:ellipsis;min-width:0}',
    '.hui-hud .tm{color:#bfe3ff;font-variant-numeric:tabular-nums}',
    '.hui-hud .sep{width:2px;height:1.1em;background:rgba(255,255,255,.25);border-radius:2px;flex:0 0 auto}',
    /* dialog: mobile-first full-width card above the bottom safe area */
    '.hui-dlg{position:absolute;left:calc(var(--sa-l) + 8px);right:calc(var(--sa-r) + 8px);bottom:calc(var(--sa-b) + 8px);margin:0 auto;max-width:980px;transform:translateY(24px);display:flex;gap:12px;align-items:stretch;padding:clamp(14px,calc(var(--u)*3),22px) clamp(14px,calc(var(--u)*3),24px) clamp(18px,calc(var(--u)*3.4),24px);border-radius:18px;background:linear-gradient(180deg,rgba(20,22,44,.97),rgba(10,12,28,.98));border:3px solid var(--c,#ffd27a);box-shadow:0 0 0 2px rgba(0,0,0,.6),0 0 22px color-mix(in srgb,var(--c,#ffd27a) 45%,transparent),0 10px 30px rgba(0,0,0,.55);opacity:0;transition:opacity .18s,transform .18s;pointer-events:auto;cursor:pointer;margin-top:40px}',
    '.hui-dlg.on{opacity:1;transform:translateY(0)}',
    '.hui-por{flex:0 0 auto;width:clamp(60px,calc(var(--u)*15),112px);height:clamp(60px,calc(var(--u)*15),112px);border-radius:14px;background:#2a2d52;border:3px solid var(--c,#ffd27a);overflow:hidden;align-self:flex-start}',
    '.hui-por canvas{width:100%;height:100%;image-rendering:pixelated;image-rendering:crisp-edges;display:block}',
    '.hui-por.none{display:none}',
    '.hui-body{flex:1 1 auto;min-width:0;position:relative}',
    '.hui-name{position:absolute;top:calc(-1 * clamp(40px,calc(var(--u)*8),50px));left:-6px;padding:4px 16px;border-radius:12px;background:var(--c,#ffd27a);color:#141428;font-weight:900;font-size:clamp(16px,calc(var(--u)*4.2),22px);letter-spacing:.03em;box-shadow:0 3px 8px rgba(0,0,0,.45);white-space:nowrap}',
    '.hui-name.none{display:none}',
    '.hui-txt{font-size:clamp(19px,calc(var(--u)*5),28px);line-height:1.42;font-weight:700;color:#fbfbff;text-shadow:0 2px 0 rgba(0,0,0,.55);min-height:2.84em;white-space:pre-wrap;overflow-wrap:break-word}',
    '.hui-more{position:absolute;right:-4px;bottom:-14px;width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:11px solid var(--c,#ffd27a);animation:huiB .8s steps(2) infinite;opacity:0}',
    '.hui-more.on{opacity:1}',
    '@keyframes huiB{0%{transform:translateY(0)}50%{transform:translateY(4px)}}',
    /* choices sit above the dialog */
    '.hui-ch{position:absolute;right:calc(var(--sa-r) + 10px);bottom:calc(var(--sa-b) + clamp(160px,calc(var(--u)*34),230px));display:flex;flex-direction:column;gap:8px;min-width:min(70%,320px);max-width:calc(100% - 20px);padding:10px;border-radius:18px;background:rgba(14,16,36,.97);border:3px solid #9fd3ff;box-shadow:0 0 18px rgba(120,190,255,.4),0 8px 22px rgba(0,0,0,.5);pointer-events:auto}',
    '.hui-ch button{font:inherit;font-weight:800;font-size:clamp(18px,calc(var(--u)*4.6),24px);text-align:left;color:#fff;background:rgba(255,255,255,.06);border:2px solid transparent;border-radius:12px;padding:12px 14px 12px 36px;min-height:48px;cursor:pointer;position:relative}',
    '.hui-ch button.sel{background:rgba(159,211,255,.22);border-color:#9fd3ff}',
    '.hui-ch button.sel:before{content:"";position:absolute;left:13px;top:50%;transform:translateY(-50%);border-top:7px solid transparent;border-bottom:7px solid transparent;border-left:10px solid #9fd3ff}',
    /* toast below the HUD pill so it never covers it */
    '.hui-toast{position:absolute;top:calc(var(--sa-t) + clamp(132px,calc(var(--u)*30),150px));width:max-content;left:50%;transform:translate(-50%,-16px);padding:10px 20px;border-radius:16px;background:rgba(255,236,170,.97);color:#2a1d05;font-weight:900;font-size:clamp(16px,calc(var(--u)*4.2),22px);box-shadow:0 6px 18px rgba(0,0,0,.45),0 0 0 3px rgba(0,0,0,.35);opacity:0;transition:opacity .25s,transform .25s;max-width:calc(100% - 32px);text-align:center}',
    '.hui-toast.on{opacity:1;transform:translate(-50%,0)}',
    '.hui-fade{position:absolute;inset:0;background:#000;opacity:0;pointer-events:none}',
    /* element badge */
    '.hui-el{display:inline-flex;align-items:center;gap:4px;padding:2px 10px 2px 3px;border-radius:999px;font-weight:900;font-size:.85em;color:#fff;background:var(--ec,#555);border:2px solid rgba(0,0,0,.35);box-shadow:inset 0 1px 0 rgba(255,255,255,.35);text-shadow:0 1px 1px rgba(0,0,0,.6);vertical-align:middle}',
    '.hui-el img.px{width:24px;height:24px}',
    /* touch controls: thumbs, semi-transparent; only on coarse pointers */
    '.hui-touch{display:none}',
    '@media (pointer:coarse){.hui-touch{display:block}}',
    '.hui.touch .hui-touch{display:block}',
    '.hui.fine .hui-touch{display:none}',
    '.hui.talk .hui-touch{display:none}',
    '.hui-zone{position:absolute;left:0;bottom:0;width:50%;top:22%;pointer-events:auto;touch-action:none}',
    '.hui-joy{position:absolute;left:0;top:0;width:var(--js);height:var(--js);margin:calc(var(--js) / -2) 0 0 calc(var(--js) / -2);border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.04) 30%,rgba(255,255,255,.12) 70%);border:2px solid rgba(255,255,255,.26);box-shadow:0 0 0 1px rgba(0,0,0,.25),inset 0 0 18px rgba(0,0,0,.25);opacity:.45;transition:opacity .15s;pointer-events:none}',
    '.hui-zone{--js:clamp(118px,calc(var(--u)*32),164px)}',
    '.hui-joy.act{opacity:.9;transition:none}',
    '.hui-knob{position:absolute;left:50%;top:50%;width:44%;height:44%;margin:-22% 0 0 -22%;border-radius:50%;background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.85),rgba(190,200,230,.6));border:2px solid rgba(255,255,255,.7);box-shadow:0 4px 10px rgba(0,0,0,.4)}',
    '.hui-btn{position:absolute;border-radius:50%;pointer-events:auto;touch-action:none;color:#fff;font-weight:900;display:flex;align-items:center;justify-content:center;text-shadow:0 2px 0 rgba(0,0,0,.4);opacity:.85;border:3px solid rgba(255,255,255,.5)}',
    '.hui-a{right:calc(var(--sa-r) + clamp(16px,calc(var(--u)*5),40px));bottom:calc(var(--sa-b) + clamp(54px,calc(var(--u)*14),90px));width:clamp(70px,calc(var(--u)*19),92px);height:clamp(70px,calc(var(--u)*19),92px);font-size:clamp(26px,calc(var(--u)*7),34px);background:radial-gradient(circle at 35% 30%,rgba(255,154,122,.92),rgba(217,69,43,.88));box-shadow:0 5px 0 rgba(122,29,14,.85),0 8px 16px rgba(0,0,0,.35)}',
    '.hui-b{right:calc(var(--sa-r) + clamp(96px,calc(var(--u)*26),136px));bottom:calc(var(--sa-b) + clamp(16px,calc(var(--u)*4),34px));width:clamp(56px,calc(var(--u)*15),74px);height:clamp(56px,calc(var(--u)*15),74px);font-size:clamp(22px,calc(var(--u)*5.6),28px);background:radial-gradient(circle at 35% 30%,rgba(140,190,255,.9),rgba(52,96,200,.86));box-shadow:0 5px 0 rgba(20,40,110,.85),0 8px 16px rgba(0,0,0,.35)}',
    '.hui-btn.on{transform:translateY(4px);box-shadow:0 1px 0 rgba(0,0,0,.5),0 3px 8px rgba(0,0,0,.4)}',
    /* larger screens / desktop */
    '@media (min-width:760px){.hui-dlg{left:50%;right:auto;width:min(92%,980px);transform:translate(-50%,24px);bottom:calc(var(--sa-b) + 18px);gap:16px;border-radius:20px}.hui-dlg.on{transform:translate(-50%,0)}.hui-por{align-self:center}.hui-ch{right:max(4%,calc(50% - 490px))}}'
  ].join('\n');

  (function () { var st = document.createElement('style'); st.textContent = '.hui-ch button.rich{display:flex;align-items:center;gap:10px;text-align:left}.hui-ch button.rich .ci{width:32px;height:32px;image-rendering:pixelated;flex:none}.hui-ch button.rich .ct{display:flex;flex-direction:column}.hui-ch button.rich small{font-size:.72em;font-weight:700;opacity:.75;margin-top:2px}'; document.head.appendChild(st); })();
  function mk(tag, cls, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  }

  var ELCOL = { water: '#2e86e4', fire: '#e45426', wind: '#2aa892', grass: '#48aa36', electric: '#d6a810', earth: '#a46c36', dark: '#563692', light: '#d0b050' };
  function icUrl(name) { return (H.icons && H.icons.url) ? H.icons.url(name, 2) : ''; }
  function mkIcon(parent) { var im = mk('img', 'px', parent); im.alt = ''; im.draggable = false; return im; }
  function elementBadge(element) {
    var k = String(element || '').toLowerCase();
    var b = document.createElement('span'); b.className = 'hui-el';
    b.style.setProperty('--ec', ELCOL[k] || '#555');
    var u = icUrl(k);
    if (u) { var im = mkIcon(b); im.src = u; }
    var t = document.createElement('span'); t.textContent = k ? k.charAt(0).toUpperCase() + k.slice(1) : '';
    b.appendChild(t);
    return b;
  }
  function timeIcon(tm) { return tm >= 5 && tm < 8 ? 'dawn' : tm >= 8 && tm < 17 ? 'day' : tm >= 17 && tm < 20 ? 'dusk' : 'night'; }

  function init(rootEl) {
    root = rootEl || document.body;
    if (getComputedStyle(root).position === 'static') root.style.position = 'relative';
    if (!document.getElementById('hui-font')) {
      var pc = mk('link'); pc.rel = 'preconnect'; pc.href = 'https://fonts.gstatic.com'; pc.crossOrigin = ''; document.head.appendChild(pc);
      var l = mk('link'); l.id = 'hui-font'; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap';
      document.head.appendChild(l);
    }
    if (!document.getElementById('hui-style')) {
      var s = mk('style'); s.id = 'hui-style'; s.textContent = CSS; document.head.appendChild(s);
    }
    var o = els.root = mk('div', 'hui', root);
    els.hud = mk('div', 'hui-hud', o);
    els.hud.style.display = 'none';
    var ics = mk('span', 'ics', els.hud);
    els.tIcon = mkIcon(ics);
    els.wIcon = mkIcon(ics);
    els.place = mk('span', 'pl', els.hud);
    mk('span', 'sep', els.hud);
    els.time = mk('span', 'tm', els.hud);

    els.dlg = mk('div', 'hui-dlg', o);
    els.por = mk('div', 'hui-por none', els.dlg);
    var body = mk('div', 'hui-body', els.dlg);
    els.name = mk('div', 'hui-name none', body);
    els.txt = mk('div', 'hui-txt', body);
    els.more = mk('div', 'hui-more', body);
    els.dlg.style.display = 'none';
    els.dlg.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); advance(); });

    els.toast = mk('div', 'hui-toast', o);
    els.fade = mk('div', 'hui-fade', o);

    // touch controls
    var tc = mk('div', 'hui-touch', o);
    // analog joystick: floating base appears where the left thumb lands
    var zone = mk('div', 'hui-zone', tc);
    var joy = mk('div', 'hui-joy', zone), knob = mk('div', 'hui-knob', joy);
    var joyId = null, jx = 0, jy = 0;
    function joyRest() {
      var zb = zone.getBoundingClientRect(), r = joy.offsetWidth / 2 || 70;
      joy.style.left = (r + 22) + 'px';
      joy.style.top = (zb.height - r - 30) + 'px';
      knob.style.transform = '';
      joy.classList.remove('act');
    }
    function joyMove(e) {
      var zb = zone.getBoundingClientRect();
      var r = joy.offsetWidth / 2 || 70, max = r * 0.62;
      var x = e.clientX - zb.left - jx, y = e.clientY - zb.top - jy;
      var d = Math.sqrt(x * x + y * y);
      if (d > max) { x = x / d * max; y = y / d * max; d = max; }
      knob.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      var dz = max * 0.28, ax = 0, ay = 0, dx = 0, dy = 0;
      if (d > dz) {
        var k = (d - dz) / (max - dz) / d;
        ax = x * k; ay = y * k;
        if (Math.abs(x) > Math.abs(y)) dx = x > 0 ? 1 : -1; else dy = y > 0 ? 1 : -1;
      }
      input.ax = ax; input.ay = ay;
      var changed = dy !== input.dy;
      input.dx = dx; input.dy = dy;
      if (changed && choice && dy) moveChoice(dy);
    }
    function joyEnd(e) {
      if (e && e.pointerId !== joyId) return;
      joyId = null; input.dx = 0; input.dy = 0; input.ax = 0; input.ay = 0;
      joyRest();
    }
    resetJoy = function () { joyId = null; input.ax = 0; input.ay = 0; joyRest(); };
    zone.addEventListener('pointerdown', function (e) {
      if (joyId !== null) return;
      e.preventDefault(); joyId = e.pointerId;
      try { zone.setPointerCapture(e.pointerId); } catch (_) {}
      var zb = zone.getBoundingClientRect(), r = joy.offsetWidth / 2 || 70;
      jx = Math.max(r, Math.min(zb.width - r, e.clientX - zb.left));
      jy = Math.max(r, Math.min(zb.height - r, e.clientY - zb.top));
      joy.style.left = jx + 'px'; joy.style.top = jy + 'px';
      joy.classList.add('act');
      joyMove(e);
    });
    zone.addEventListener('pointermove', function (e) { if (e.pointerId === joyId) { e.preventDefault(); joyMove(e); } });
    zone.addEventListener('pointerup', joyEnd);
    zone.addEventListener('pointercancel', joyEnd);
    zone.addEventListener('lostpointercapture', joyEnd);
    window.addEventListener('resize', function () { if (joyId === null) joyRest(); });
    requestAnimationFrame(joyRest);

    function btn(cls, label, onDown, onUp) {
      var el = mk('div', 'hui-btn ' + cls, tc), pid = null; el.textContent = label;
      el.addEventListener('pointerdown', function (e) {
        e.preventDefault(); if (pid !== null) return; pid = e.pointerId;
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
        el.classList.add('on'); onDown();
      });
      function up(e) { if (e.pointerId !== pid) return; pid = null; el.classList.remove('on'); onUp(); }
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('lostpointercapture', up);
      return el;
    }
    // A = action, B = run/back. While a dialog/choice is open they drive the UI; otherwise they feed the engine.
    btn('hui-a', 'A', function () { if (dlg || choice) advance(); else input.action = true; }, function () { input.action = false; });
    btn('hui-b', 'B', function () { if (dlg || choice) advance(); else { input.back = true; input.run = true; } }, function () { input.back = false; input.run = false; });

    var coarse = window.matchMedia && matchMedia('(pointer:coarse)').matches;
    if (coarse) o.classList.add('touch'); else o.classList.add('fine');
    window.addEventListener('touchstart', function () { o.classList.remove('fine'); o.classList.add('touch'); }, { once: true, passive: true });

    // choice keyboard navigation (engine handles game keys; this only acts while a choice is open)
    window.addEventListener('keydown', function (e) {
      if (!choice) return;
      var k = e.key;
      if (k === 'ArrowUp' || k === 'w' || k === 'W') { moveChoice(-1); e.preventDefault(); e.stopPropagation(); }
      else if (k === 'ArrowDown' || k === 's' || k === 'S') { moveChoice(1); e.preventDefault(); e.stopPropagation(); }
    }, true);
  }

  // ---- dialog ----
  function say(speakerName, text, portraitCanvas, color) {
    if (!els.dlg) init(document.body);
    if (dlg) finishDlg();
    var c = color || '#ffd27a';
    els.dlg.style.setProperty('--c', c);
    if (els.ch) els.ch.style.setProperty('--c', c);
    els.name.textContent = speakerName || '';
    els.name.classList.toggle('none', !speakerName);
    els.por.innerHTML = '';
    if (portraitCanvas) {
      var pc = portraitCanvas;
      if (pc.parentNode) { // clone so the same cached canvas can be reused
        var cl = document.createElement('canvas'); cl.width = pc.width; cl.height = pc.height;
        cl.getContext('2d').drawImage(pc, 0, 0); pc = cl;
      }
      els.por.appendChild(pc);
      els.por.classList.remove('none');
    } else els.por.classList.add('none');
    els.txt.textContent = '';
    els.more.classList.remove('on');
    els.dlg.style.display = 'flex';
    setTalk(true);
    void els.dlg.offsetWidth;
    els.dlg.classList.add('on');

    return new Promise(function (resolve) {
      var chars = Array.from(String(text || ''));
      var d = dlg = { resolve: resolve, chars: chars, i: 0, typing: true, timer: null, opened: performance.now() };
      function tick() {
        if (dlg !== d || !d.typing) return;
        var ch = chars[d.i++];
        els.txt.textContent += ch === undefined ? '' : ch;
        if (d.i >= chars.length) { endType(d); return; }
        var delay = /[.!?…]/.test(ch) ? 140 : /[,;:]/.test(ch) ? 80 : 24;
        d.timer = setTimeout(tick, delay);
      }
      d.timer = setTimeout(tick, 60);
    });
  }
  function setTalk(on) {
    if (!els.root) return;
    els.root.classList.toggle('talk', on);
    if (on) { input.dx = 0; input.dy = 0; input.action = false; input.back = false; input.run = false; resetJoy(); }
  }
  function maybeEndTalk() { if (!dlg && !choice) { setTalk(false); resetJoy(); } }
  function endType(d) {
    d.typing = false; clearTimeout(d.timer);
    els.txt.textContent = d.chars.join('');
    els.more.classList.add('on');
  }
  function finishDlg() {
    var d = dlg; if (!d) return;
    clearTimeout(d.timer); dlg = null;
    els.more.classList.remove('on');
    if (!choice) {
      els.dlg.classList.remove('on');
      setTimeout(function () { if (!dlg && !choice) els.dlg.style.display = 'none'; }, 190);
    }
    setTimeout(maybeEndTalk, 60);
    d.resolve();
  }

  // ---- choice ----
  // icons and one-line descriptions for common choices (shop items, food, services)
  var CHOICE_INFO = [
    [/herb/i, 'grass', 'Restores a little mana in battle'],
    [/ember dust/i, 'fire', 'Revives a fainted fire hontori'],
    [/tide pearl/i, 'water', 'Revives a fainted water hontori'],
    [/spirit snack/i, 'energy', 'Revives other hontori, restores some mana'],
    [/charm/i, 'backpack', 'A lucky charm for your backpack'],
    [/ramen/i, 'energy', 'Heals your party and refills mana'],
    [/sleep|rest/i, 'night', 'Rest for 8 hours'],
    [/^(yes|okay|ok|sure|let)/i, 'star', null],
    [/no thanks|leave|maybe later|not now|^no\b|^back/i, 'back', null]
  ];
  function choiceInfo(label) {
    for (var i = 0; i < CHOICE_INFO.length; i++) if (CHOICE_INFO[i][0].test(label)) {
      var ic = null; try { if (CHOICE_INFO[i][1] && H.icons) ic = H.icons.url(CHOICE_INFO[i][1], 2); } catch (e) {}
      return { icon: ic, desc: CHOICE_INFO[i][2] };
    }
    return {};
  }
  function choose(options) {
    if (!els.root) init(document.body);
    if (choice) closeChoice(-1);
    var box = els.ch = mk('div', 'hui-ch', els.root);
    setTalk(true);
    var btns = (options || []).map(function (opt, i) {
      var b = mk('button', i === 0 ? 'sel' : '', box);
      b.type = 'button';
      // options may be plain text or {label, icon, desc}; known items get an icon and a short "what it does"
      var o = (opt && typeof opt === 'object') ? opt : { label: String(opt) }, info = choiceInfo(o.label);
      var icon = o.icon || info.icon, desc = o.desc || info.desc;
      if (icon || desc) {
        b.classList.add('rich');
        if (icon) { var im = document.createElement('img'); im.className = 'ci'; im.alt = ''; im.src = icon; b.appendChild(im); }
        var tx = document.createElement('span'); tx.className = 'ct'; tx.textContent = o.label; b.appendChild(tx);
        if (desc) { var ds = document.createElement('small'); ds.textContent = desc; tx.appendChild(ds); }
      } else b.textContent = o.label;
      b.addEventListener('pointerenter', function () { setSel(i); });
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); setSel(i); closeChoice(i); });
      return b;
    });
    return new Promise(function (resolve) {
      choice = { resolve: resolve, btns: btns, sel: 0, opened: performance.now() };
    });
  }
  function setSel(i) {
    if (!choice) return;
    choice.sel = i;
    choice.btns.forEach(function (b, j) { b.classList.toggle('sel', j === i); });
  }
  function moveChoice(d) {
    if (!choice || !choice.btns.length) return;
    var n = choice.btns.length;
    setSel((choice.sel + d + n) % n);
  }
  function closeChoice(i) {
    var c = choice; if (!c) return;
    choice = null;
    if (els.ch) { els.ch.remove(); els.ch = null; }
    if (!dlg) {
      els.dlg.classList.remove('on');
      setTimeout(function () { if (!dlg && !choice) els.dlg.style.display = 'none'; }, 190);
    }
    setTimeout(maybeEndTalk, 60);
    c.resolve(i < 0 ? 0 : i);
  }

  function advance() {
    if (choice) {
      if (performance.now() - choice.opened < 150) return;
      closeChoice(choice.sel); return;
    }
    if (!dlg) return;
    if (dlg.typing) { endType(dlg); return; }
    if (performance.now() - dlg.opened < 120) return;
    finishDlg();
  }
  function isOpen() { return !!(dlg || choice); }

  // ---- HUD ----
  var lastHud = '';
  function hud(env, placeName) {
    if (!els.hud) return;
    env = env || {};
    var tm = typeof env.time === 'number' ? env.time : 12;
    tm = ((tm % 24) + 24) % 24;
    var h = Math.floor(tm), m = Math.floor((tm - h) * 60);
    var ti = timeIcon(tm);
    var w = env.weather || 'clear';
    if (!/^(clear|cloudy|rain|storm|wind|snow|fog)$/.test(w)) w = 'clear';
    // a clear sky at night is already told by the moon icon
    // the time icon already shows sun or moon; only show real weather, and never indoors
    var showW = w !== 'clear' && !env.indoor;
    var timeStr = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    var key = (placeName || '') + '|' + timeStr + '|' + ti + '|' + w + '|' + (env.indoor ? 1 : 0) + '|' + (H.icons ? 1 : 0);
    if (key === lastHud) return;
    lastHud = key;
    els.hud.style.display = placeName === null ? 'none' : 'flex';
    var tu = icUrl(ti), wu = icUrl(w);
    if (tu && els.tIcon.getAttribute('src') !== tu) els.tIcon.src = tu;
    els.tIcon.hidden = !tu;
    els.tIcon.title = ti;
    if (wu && els.wIcon.getAttribute('src') !== wu) els.wIcon.src = wu;
    els.wIcon.hidden = !wu || !showW;
    els.wIcon.title = w;
    els.place.textContent = placeName || '';
    els.time.textContent = timeStr;
  }

  // ---- toast ----
  var toastQ = [], toastBusy = false;
  function toast(text) {
    if (!els.toast) return;
    toastQ.push(String(text));
    if (!toastBusy) nextToast();
  }
  function nextToast() {
    var t = toastQ.shift();
    if (t === undefined) { toastBusy = false; return; }
    toastBusy = true;
    els.toast.textContent = t;
    void els.toast.offsetWidth;
    els.toast.classList.add('on');
    setTimeout(function () {
      els.toast.classList.remove('on');
      setTimeout(nextToast, 300);
    }, 2200);
  }

  // ---- fade: out to black over ms/2, back in over ms/2 ----
  function fade(ms) {
    if (!els.fade) return Promise.resolve();
    ms = ms == null ? 800 : ms;
    var half = Math.max(1, ms / 2), f = els.fade;
    var p = (fadeBusy || Promise.resolve()).then(function () {
      return new Promise(function (res) {
        f.style.pointerEvents = 'auto';
        f.style.transition = 'opacity ' + half + 'ms ease-in';
        void f.offsetWidth;
        f.style.opacity = '1';
        setTimeout(function () {
          f.style.transition = 'opacity ' + half + 'ms ease-out';
          f.style.opacity = '0';
          setTimeout(function () { f.style.pointerEvents = 'none'; res(); }, half);
        }, half + 30);
      });
    });
    fadeBusy = p;
    return p;
  }

  H.ui = {
    init: init, say: say, choose: choose, advance: advance, isOpen: isOpen,
    hud: hud, toast: toast, fade: fade, input: input, elementBadge: elementBadge
  };
})();

// H.kit: one visual language for every panel, button, header and close button (menu, results, map, boards, title).
(function () {
  'use strict';
  var H = window.H;
  var CSS = [
    '.hk-panel{border-radius:20px;background:linear-gradient(180deg,#1b1e3a,#101226);border:2px solid #6f7fd8;box-shadow:0 10px 40px rgba(0,0,0,.6);color:#f4f1e8;font-family:Nunito,"M PLUS Rounded 1c",system-ui,-apple-system,sans-serif}',
    '.hk-h{display:flex;align-items:center;gap:10px;margin:0 0 12px;min-height:40px}',
    '.hk-h img{width:28px;height:28px;image-rendering:pixelated;flex:none}',
    '.hk-h h2{flex:1;min-width:0;margin:0;font-size:20px;font-weight:900;letter-spacing:.2px;line-height:1.15;color:#f4f1e8}',
    '.hk-h h2 small{display:block;font-size:12px;font-weight:700;opacity:.7;letter-spacing:0}',
    '.hk-btn{display:flex;align-items:center;gap:10px;min-height:48px;padding:8px 14px;border:2px solid rgba(0,0,0,.35);border-radius:14px;font:inherit;font-family:Nunito,"M PLUS Rounded 1c",system-ui,-apple-system,sans-serif;font-weight:900;font-size:16px;line-height:1.15;text-align:left;cursor:pointer;color:#14162a;background:linear-gradient(180deg,#a8dcff,#7cc4fa);box-shadow:0 4px 0 #2e5a8a,0 6px 14px rgba(0,0,0,.3);-webkit-tap-highlight-color:transparent;touch-action:manipulation;-webkit-user-select:none;user-select:none}',
    '.hk-btn:active{transform:translateY(3px);box-shadow:0 1px 0 #2e5a8a,0 2px 6px rgba(0,0,0,.3)}',
    '.hk-btn.alt,.hk-btn.warn{color:#f4f1e8;background:linear-gradient(180deg,#2e335e,#23274a);border-color:rgba(255,255,255,.16);box-shadow:0 4px 0 #0a0c1c,0 6px 14px rgba(0,0,0,.3)}',
    '.hk-btn.alt:active,.hk-btn.warn:active{box-shadow:0 1px 0 #0a0c1c}',
    '.hk-btn.warn{color:#ffb3a8}',
    '.hk-btn.gold{color:#2a1405;background:linear-gradient(180deg,#ffd98a,#ff9a3c);box-shadow:0 4px 0 #a8501c,0 6px 14px rgba(0,0,0,.3)}',
    '.hk-btn.gold:active{box-shadow:0 1px 0 #a8501c}',
    '.hk-btn.sm{min-height:40px;padding:5px 10px;gap:6px;font-size:14px;border-radius:12px}',
    '.hk-btn img{width:28px;height:28px;image-rendering:pixelated;flex:none}',
    '.hk-btn.sm img{width:22px;height:22px}',
    '.hk-btn .t{display:flex;flex-direction:column;min-width:0}',
    '.hk-btn small{font-size:12px;font-weight:700;opacity:.75;margin-top:1px}',
    '.hk-btn[hidden],.hk-x[hidden]{display:none}',
    '.hk-btn[disabled]{opacity:.5;cursor:default;transform:none}',
    '.hk-btn.wide{width:100%;justify-content:center}',
    '.hk-btn.wide .t{align-items:center;text-align:center}',
    '.hk-x{flex:none;width:40px;height:40px;padding:0;border-radius:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:linear-gradient(180deg,#2e335e,#23274a);border:2px solid rgba(255,255,255,.16);box-shadow:0 3px 0 #0a0c1c;-webkit-tap-highlight-color:transparent;touch-action:manipulation}',
    '.hk-x:active{transform:translateY(2px);box-shadow:0 1px 0 #0a0c1c}',
    '.hk-x img{width:22px;height:22px;image-rendering:pixelated}',
    '.hk-acts{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}',
    '.hk-acts .hk-btn{flex:1 1 140px}',
    '.hk-note{font-size:13px;font-weight:700;opacity:.7;margin-top:10px;line-height:1.35;white-space:pre-wrap}'
  ].join('\n');
  function css() { if (document.getElementById('hk-style')) return; var s = document.createElement('style'); s.id = 'hk-style'; s.textContent = CSS; (document.head || document.documentElement).appendChild(s); }
  css();
  function img(name, scale) { var im = document.createElement('img'); im.alt = ''; im.draggable = false; try { im.src = H.icons.url(name, scale || 2); } catch (e) {} return im; }
  // btn(parent, {icon, label, desc, kind:'alt'|'warn'|'gold', sm, wide, onClick})
  function btn(parent, o) {
    o = o || {}; css();
    var b = document.createElement('button'); b.type = 'button';
    b.className = 'hk-btn' + (o.kind ? ' ' + o.kind : '') + (o.sm ? ' sm' : '') + (o.wide ? ' wide' : '');
    if (o.icon) b.appendChild(img(o.icon));
    var t = document.createElement('span'); t.className = 't'; b.appendChild(t);
    var l = document.createElement('span'); l.textContent = o.label || ''; t.appendChild(l);
    if (o.desc) { var d = document.createElement('small'); d.textContent = o.desc; t.appendChild(d); }
    if (o.onClick) b.addEventListener('click', o.onClick);
    if (parent) parent.appendChild(b);
    return b;
  }
  function x(parent, onClick) {
    css();
    var b = document.createElement('button'); b.type = 'button'; b.className = 'hk-x'; b.title = 'Close'; b.setAttribute('aria-label', 'Close');
    b.appendChild(img('close'));
    if (onClick) b.addEventListener('click', onClick);
    if (parent) parent.appendChild(b);
    return b;
  }
  function header(parent, icon, title, sub, onClose) {
    css();
    var h = document.createElement('div'); h.className = 'hk-h';
    if (icon) h.appendChild(img(icon));
    var t = document.createElement('h2'); t.textContent = title; h.appendChild(t);
    if (sub) { var s = document.createElement('small'); s.textContent = sub; t.appendChild(s); }
    if (onClose) x(h, onClose);
    if (parent) parent.appendChild(h);
    return h;
  }
  H.kit = { css: css, img: img, btn: btn, x: x, header: header };
})();

// H.ui.helper: rule 48 first-touch guide. The kid's own hontori floats to the thing being explained and says one short line
// in a small bubble; that thing gets a soft glowing ring. Shown once per id (state.flags['help:' + id]); tap anywhere to go on.
// helper(id, title, text, icon, target) - target: an element or a selector (optional).
// H.ui.blocked(text): the one-line "not yet, learn it at ..." note for things shown but not open yet.
(function () {
  'use strict';
  var H = window.H, busy = false, queue = [];
  var CSS = '.hg{position:absolute;inset:0;z-index:9000;background:transparent;opacity:0;transition:opacity .2s;pointer-events:none;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;font-family:Nunito,"M PLUS Rounded 1c",system-ui,-apple-system,sans-serif}' +
    '.hg.on{opacity:1}' +
    '.hg-ring{position:absolute;border-radius:14px;box-shadow:0 0 0 3px rgba(255,214,120,.95),0 0 18px 4px rgba(255,190,90,.6);animation:hgP 1.4s ease-in-out infinite;pointer-events:none}' +
    '@keyframes hgP{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}' +
    '.hg-g{position:absolute;pointer-events:auto;display:flex;align-items:flex-start;gap:6px;max-width:min(300px,calc(100% - 20px));transition:left .35s ease,top .35s ease}' +
    '.hg-fox{flex:none;width:44px;height:44px;border-radius:50%;overflow:hidden;background:#2a2d52;border:2px solid #ffb04a;box-shadow:0 3px 10px rgba(0,0,0,.45);animation:hgB 1.8s ease-in-out infinite}' +
    '.hg-fox canvas{width:100%;height:100%;image-rendering:pixelated;display:block}' +
    '@keyframes hgB{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}' +
    '.hg-b{position:relative;min-width:0;padding:7px 11px 8px;border-radius:14px;background:#fffaf0;color:#2a1d10;box-shadow:0 4px 14px rgba(0,0,0,.4);font-size:14px;font-weight:800;line-height:1.3}' +
    '.hg-b:before{content:"";position:absolute;left:-6px;top:14px;border-top:6px solid transparent;border-bottom:6px solid transparent;border-right:7px solid #fffaf0}' +
    '.hg-b b{display:block;font-size:11px;font-weight:900;color:#c0602a;letter-spacing:.3px;text-transform:uppercase}' +
    '.hg-b span{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}';
  function css() { if (document.getElementById('hg-style')) return; var s = document.createElement('style'); s.id = 'hg-style'; s.textContent = CSS; document.head.appendChild(s); }
  function flags() { var st = H.game && H.game.state; if (!st) return null; return (st.flags = st.flags || {}); }
  function seen(id) { var f = flags(); return !!(f && f['help:' + id]); }
  function helper(id, title, text, icon, target) {
    var f = flags(); if (!f || f['help:' + id]) return Promise.resolve(false);
    f['help:' + id] = 1;
    try { H.game.save && H.game.save(); } catch (e) {}
    // shown after a short pause, so the thing it explains is seen first
    return new Promise(function (res) { queue.push({ title: title, text: text, target: target, res: res }); if (!busy) setTimeout(next, 1000); busy = true; });
  }
  function fox() {
    var st = H.game && H.game.state, m = st && st.party && st.party[0], c = null;
    try { c = H.spirits.portrait(m ? m.key : 'hontori'); } catch (e) {}
    if (!c) return null;
    var cl = document.createElement('canvas'); cl.width = c.width; cl.height = c.height; cl.getContext('2d').drawImage(c, 0, 0); return cl;
  }
  function next() {
    var o = queue.shift(); if (!o) { busy = false; return; }
    css();
    var root = document.getElementById('root') || document.body, R = root.getBoundingClientRect();
    var ov = document.createElement('div'); ov.className = 'hg';
    var t = typeof o.target === 'string' ? document.querySelector(o.target) : o.target, tr = null;
    if (t && t.getBoundingClientRect && t.offsetParent !== null) { var b = t.getBoundingClientRect(); if (b.width && b.height) tr = { x: b.left - R.left, y: b.top - R.top, w: b.width, h: b.height }; }
    if (tr) { var ring = document.createElement('div'); ring.className = 'hg-ring'; ring.style.cssText = 'left:' + (tr.x - 4) + 'px;top:' + (tr.y - 4) + 'px;width:' + (tr.w + 8) + 'px;height:' + (tr.h + 8) + 'px'; ov.appendChild(ring); }
    var g = document.createElement('div'); g.className = 'hg-g';
    var fx = document.createElement('div'); fx.className = 'hg-fox'; var fc = fox(); if (fc) fx.appendChild(fc); g.appendChild(fx);
    var bb = document.createElement('div'); bb.className = 'hg-b';
    var bt = document.createElement('b'), bs = document.createElement('span'); bt.textContent = o.title; bs.textContent = o.text;
    bb.appendChild(bt); bb.appendChild(bs); g.appendChild(bb); ov.appendChild(g);
    root.appendChild(ov);
    // the guide floats next to the thing: below it in the top half of the screen, above it in the bottom half
    var W = R.width, Hh = R.height, gw = Math.min(300, W - 20), gh = g.offsetHeight || 70, x, y;
    // rule: the guide never covers what matters. Try spots next to the target, then top, middle and bottom bands,
    // and keep the one that hides the least of the target and of any visible button, card, panel or dialog.
    var busyEls = [].slice.call(root.querySelectorAll('button, .hb-card, .hb-msg, .hb-intent, .hb-moves, .hb-bar, .hm-sheet.on, .hui-dlg, .hk-btn, .hq, input'))
      .filter(function (e) { return e.offsetParent !== null && !ov.contains(e); })
      .map(function (e) { var b = e.getBoundingClientRect(); return { x: b.left - R.left, y: b.top - R.top, w: b.width, h: b.height }; })
      .filter(function (b) { return b.w > 0 && b.h > 0 && b.w * b.h < W * Hh * 0.6; });
    try { if (H.ui.helperAvoid) busyEls = busyEls.concat(H.ui.helperAvoid() || []); } catch (e) {}
    function cover(cx, cy) {
      var c = 0;
      busyEls.forEach(function (b) { var ix = Math.max(0, Math.min(cx + gw, b.x + b.w) - Math.max(cx, b.x)), iy = Math.max(0, Math.min(cy + gh, b.y + b.h) - Math.max(cy, b.y)); c += ix * iy; });
      if (tr) { var ix = Math.max(0, Math.min(cx + gw, tr.x + tr.w) - Math.max(cx, tr.x)), iy = Math.max(0, Math.min(cy + gh, tr.y + tr.h) - Math.max(cy, tr.y)); c += ix * iy * 20; }
      return c;
    }
    var cands = [], mx = (W - gw) / 2;
    if (tr) { var tx = Math.max(10, Math.min(W - gw - 10, tr.x + tr.w / 2 - gw / 2)); cands.push([tx, tr.y + tr.h + 12], [tx, tr.y - gh - 12]); }
    [0.12, 0.3, 0.45, 0.6, 0.75].forEach(function (f) { cands.push([mx, Hh * f], [10, Hh * f], [W - gw - 10, Hh * f]); });
    var best = null;
    cands.forEach(function (cnd, i) { var cx = cnd[0], cy = Math.max(10, Math.min(Hh - gh - 10, cnd[1])), sc = cover(cx, cy) + i * 2; if (!best || sc < best[2]) best = [cx, cy, sc]; });
    x = best[0]; y = best[1];
    g.style.left = x + 'px'; g.style.top = y + 'px'; g.style.width = gw + 'px';
    var gone = false;
    function close(e) { if (e) { e.stopPropagation(); e.preventDefault(); } if (gone) return; gone = true; ov.classList.remove('on'); setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); o.res(true); next(); }, 200); }
    // it never blocks: a tap on the bubble closes it, any other tap closes it and still goes through
    g.addEventListener('click', close);
    var anyTap = function () { document.removeEventListener('pointerdown', anyTap, true); setTimeout(function () { close(); }, 0); };
    setTimeout(function () { document.addEventListener('pointerdown', anyTap, true); }, 350);
    setTimeout(function () { document.removeEventListener('pointerdown', anyTap, true); close(); }, 7000);
    void ov.offsetWidth; ov.classList.add('on');
  }
  function blocked(text) { if (H.ui && H.ui.toast) H.ui.toast(text); }
  // the game layers never scroll: a focused input or scrollIntoView must not shift the screen (Safari)
  document.addEventListener('scroll', function (e) { var t = e.target; if (t && t.nodeType === 1 && (t.id === 'root' || t.classList.contains('hb')) && (t.scrollTop || t.scrollLeft)) { t.scrollTop = 0; t.scrollLeft = 0; } }, true);
  H.ui = H.ui || {};
  H.ui.helper = helper; H.ui.helperSeen = seen; H.ui.blocked = blocked;
})();
