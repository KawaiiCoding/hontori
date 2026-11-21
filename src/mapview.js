// Area map: a map button next to the backpack opens a picture of the current area
// (ground, roads, buildings, doors, people) with a marker where the kid stands.
// Only places the kid has walked near are shown; the rest stays in fog. Pinch, wheel or +/- to zoom.
(function () {
  var H = window.H = window.H || {};
  var COL = {
    grass: '#5f9a4c', tallgrass: '#477f3e', flowers: '#6aa656', path: '#efc77e', cobble: '#e2bf86', sand: '#ead29a',
    water: '#3f86c8', bridge: '#d8a860', floor_wood: '#a8784a', floor_herring: '#b08050', floor_tile: '#c8d0c0',
    floor_stone: '#9a968e', carpet_blue: '#3a4a8a', rug: '#a03a3a', wall: '#6a4a3a', void: '#1a1410'
  };
  var ROAD = { path: 1, cobble: 1, sand: 1, bridge: 1 };
  var ROOF = { school: '#6a4aa8', house_player: '#c0503a', tavern: '#8a5a30', shop: '#3a7a4a' };
  var CSS = [
    '.hmap{position:absolute;inset:0;z-index:47;background:rgba(6,6,16,.78);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s;touch-action:none;font-family:Nunito,system-ui,sans-serif}',
    '.hmap.on{opacity:1}',
    '.hmap .box{position:relative;width:min(94%,560px);padding:10px;border-radius:16px;background:#e8d8b0;box-shadow:inset 0 0 0 3px #8a6a40,0 12px 40px rgba(0,0,0,.6)}',
    '.hmap h3{display:flex;align-items:center;justify-content:center;gap:8px;min-height:40px;margin:0 46px 8px;text-align:center;color:#4a3420;font-size:18px;font-weight:900;line-height:1.1}.hmap h3 img{width:24px;height:24px;image-rendering:pixelated;flex:none}',
    '.hmap .vp{position:relative;border-radius:8px;overflow:hidden;background:#141020;touch-action:none}',
    '.hmap canvas{width:100%;height:100%;display:block}',
    '.hmap .hk-x{position:absolute;right:8px;top:6px}',
    '.hmap .zm{position:absolute;right:8px;bottom:8px;display:flex;flex-direction:column;gap:8px}',
    '.hmap .zm .hk-x{position:static}',
    '.hmap .lg{display:flex;flex-wrap:wrap;gap:4px 12px;justify-content:center;margin-top:8px;color:#4a3420;font-size:12px;font-weight:800}',
    '.hmap .lg span{display:flex;align-items:center;gap:4px}.hmap .lg i{width:12px;height:12px;border-radius:3px;display:inline-block}'
  ].join('\n');

  // ---------- explored tiles: one bit per tile, kept as a short base64-like string per map
  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_', cache = {};
  function bits(name, map) {
    var n = map.w * map.h, c = cache[name];
    if (c && c.length === n) return c;
    c = new Uint8Array(n); var st = H.game && H.game.state, s = st && st.explored && st.explored[name];
    if (typeof s === 'string') for (var i = 0; i < s.length; i++) { var v = B64.indexOf(s[i]); for (var k = 0; k < 6; k++) if (v >> k & 1 && i * 6 + k < n) c[i * 6 + k] = 1; }
    cache[name] = c; return c;
  }
  function store(name, c) {
    var out = '';
    for (var i = 0; i < c.length; i += 6) { var v = 0; for (var k = 0; k < 6; k++) if (c[i + k]) v |= 1 << k; out += B64[v]; }
    var st = H.game.state; st.explored = st.explored || {}; st.explored[name] = out;
  }
  function reveal(name, map, tx, ty) {
    if (!map || !H.game || !H.game.state) return;
    var c = bits(name, map), R = 6, ch = false, indoor = map.tileset === 'indoor';
    for (var y = 0; y < map.h; y++) for (var x = 0; x < map.w; x++) {
      if (c[y * map.w + x]) continue;
      if (indoor || (x - tx) * (x - tx) + (y - ty) * (y - ty) <= R * R + 2) { c[y * map.w + x] = 1; ch = true; }
    }
    if (ch) store(name, c);
  }

  // where the current quest wants you, if the story says so
  function questTarget(name, map) {
    try {
      var s = H.story; if (!s || !s.current || !s.nextStep) return null;
      var id = s.current(), step = id && s.nextStep(id); if (!step) return null;
      var t = step.target || step.where || step;
      if (t.map && t.map !== name) return null;
      if (t.x != null && t.y != null && (t.map || step.map === name)) return { x: t.x, y: t.y };
      var key = t.npc || step.npc;
      if (key) { var n = (map.npcs || []).filter(function (n) { return n.key === key; })[0]; if (n) return { x: n.x, y: n.y }; }
    } catch (e) {}
    return null;
  }

  function paintBase(map, S) {
    var cv = document.createElement('canvas'); cv.width = map.w * S; cv.height = map.h * S;
    var g = cv.getContext('2d'), legend = map.legend || {};
    var id = function (x, y) { return legend[(map.ground[y] || '')[x]] || 'grass'; };
    for (var y = 0; y < map.h; y++) for (var x = 0; x < map.w; x++) {
      var t = id(x, y); g.fillStyle = COL[t] || '#5f9a4c'; g.fillRect(x * S, y * S, S, S);
      if (t === 'tallgrass') { g.fillStyle = '#3a6c34'; g.fillRect(x * S + 2, y * S + 3, 1, 3); g.fillRect(x * S + 5, y * S + 2, 1, 3); }
      if (t === 'water') { g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x * S + 1, y * S + 3, 3, 1); }
    }
    // a soft darker rim along road edges so the roads read clearly
    g.fillStyle = 'rgba(120,80,30,.45)';
    for (y = 0; y < map.h; y++) for (x = 0; x < map.w; x++) if (ROAD[id(x, y)]) {
      if (y > 0 && !ROAD[id(x, y - 1)]) g.fillRect(x * S, y * S, S, 1);
      if (y < map.h - 1 && !ROAD[id(x, y + 1)]) g.fillRect(x * S, y * S + S - 1, S, 1);
      if (x > 0 && !ROAD[id(x - 1, y)]) g.fillRect(x * S, y * S, 1, S);
      if (x < map.w - 1 && !ROAD[id(x + 1, y)]) g.fillRect(x * S + S - 1, y * S, 1, S);
    }
    (map.props || []).forEach(function (p) {
      if (/tree|pine/.test(p.type)) { g.fillStyle = '#2f5f2c'; g.beginPath(); g.arc(p.x * S + S / 2, p.y * S + S / 2, S * 0.75, 0, 7); g.fill(); g.fillStyle = '#3f7a38'; g.beginPath(); g.arc(p.x * S + S / 2 - 1, p.y * S + S / 2 - 1, S * 0.4, 0, 7); g.fill(); }
    });
    (map.buildings || []).forEach(function (b) {
      var i = H.buildings && H.buildings.info[b.type]; if (!i) return;
      var X = b.x * S, Y = b.y * S, W = i.fw * S, Hh = i.fh * S, rh = Math.round(Hh * 0.62), rc = ROOF[b.type] || '#3a5aa8';
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(X + 2, Y + 2, W, Hh);
      g.fillStyle = '#d8c4a0'; g.fillRect(X, Y + rh, W, Hh - rh);
      g.fillStyle = rc; g.fillRect(X, Y, W, rh);
      g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(X, Y, W, 2);
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(X, Y + rh - 2, W, 2);
      for (var k = 1; k < 4; k++) { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(X, Y + Math.round(rh * k / 4), W, 1); }
    });
    (map.doors || []).forEach(function (d) { g.fillStyle = '#5a3418'; g.fillRect(d.x * S + 1, d.y * S, S - 2, S); g.fillStyle = '#ffd98a'; g.fillRect(d.x * S + 2, d.y * S + 1, S - 4, S - 2); });
    (map.npcs || []).forEach(function (n) { g.fillStyle = '#2a1d10'; g.beginPath(); g.arc(n.x * S + S / 2, n.y * S + S / 2, S * 0.42, 0, 7); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(n.x * S + S / 2, n.y * S + S / 2, S * 0.3, 0, 7); g.fill(); });
    return cv;
  }
  // fog: one pixel per tile, partly see-through near the explored edge; scaled up smoothly
  function paintFog(map, c) {
    var cv = document.createElement('canvas'); cv.width = map.w; cv.height = map.h;
    var g = cv.getContext('2d'), im = g.createImageData(map.w, map.h), d = im.data;
    for (var y = 0; y < map.h; y++) for (var x = 0; x < map.w; x++) {
      var a;
      if (!c[y * map.w + x]) a = 255;
      else { var u = 0, n = 0; for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) { var xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= map.w || yy >= map.h) continue; n++; if (!c[yy * map.w + xx]) u++; } a = Math.round(200 * u / n); }
      var o = (y * map.w + x) * 4; d[o] = 20; d[o + 1] = 16; d[o + 2] = 32; d[o + 3] = a;
    }
    g.putImageData(im, 0, 0); return cv;
  }

  function show() {
    var m = H.game && H.game.currentMap && H.game.currentMap();
    if (!m || !m.map || document.querySelector('.hmap')) return;
    var map = m.map, root = document.getElementById('root');
    if (!document.getElementById('hmap-css')) { var st = document.createElement('style'); st.id = 'hmap-css'; st.textContent = CSS; document.head.appendChild(st); }
    reveal(m.name, map, m.player.tx, m.player.ty);
    var o = document.createElement('div'); o.className = 'hmap';
    var box = document.createElement('div'); box.className = 'box'; o.appendChild(box);
    var h = document.createElement('h3'); h.appendChild(H.kit.img('map')); h.appendChild(document.createTextNode(map.name || m.name)); box.appendChild(h);
    var vp = document.createElement('div'); vp.className = 'vp'; box.appendChild(vp);
    var cv = document.createElement('canvas'); vp.appendChild(cv);
    var zm = document.createElement('div'); zm.className = 'zm'; vp.appendChild(zm);
    function zb(icon, tip) { var b = H.kit.x(zm); b.title = tip; b.setAttribute('aria-label', tip); b.firstChild.src = H.icons.url(icon, 2); return b; }
    var zin = zb('plus', 'Closer'), zout = zb('minus', 'Whole area');
    var lg = document.createElement('div'); lg.className = 'lg'; box.appendChild(lg);
    [['#efc77e', 'Road'], ['#3f86c8', 'Water'], ['#c0503a', 'Building'], ['#ffd98a', 'Door'], ['#ffffff', 'Person'], ['#ff3c28', 'You']]
      .concat(questTarget(m.name, map) ? [['#ffcf3a', 'Quest']] : []).forEach(function (l) {
        var s = document.createElement('span'), i = document.createElement('i'); i.style.background = l[0]; i.style.boxShadow = 'inset 0 0 0 1px rgba(0,0,0,.35)'; s.appendChild(i); s.appendChild(document.createTextNode(l[1])); lg.appendChild(s);
      });
    var S = 8, base = paintBase(map, S), fog = paintFog(map, bits(m.name, map)), qt = questTarget(m.name, map);
    var g = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), W = 0, Hh = 0, fit = 1, z = 1, ox = 0, oy = 0, live = true;
    function size() {
      var bw = box.clientWidth - 20, maxH = Math.max(160, window.innerHeight * 0.62);
      W = bw; Hh = Math.min(maxH, bw * map.h / map.w); if (Hh < bw * map.h / map.w) W = Math.min(bw, Hh * map.w / map.h);
      vp.style.width = W + 'px'; vp.style.height = Hh + 'px'; vp.style.margin = '0 auto';
      cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr);
      fit = Math.min(W / (map.w * S), Hh / (map.h * S)); if (z < fit) z = fit;
    }
    function zMax() { return Math.max(fit * 1.5, Math.min(W, Hh) / (16 * S)); } // close view: about 16 tiles across
    function clamp() {
      var mw = map.w * S * z, mh = map.h * S * z;
      ox = mw <= W ? (W - mw) / 2 : Math.min(0, Math.max(W - mw, ox));
      oy = mh <= Hh ? (Hh - mh) / 2 : Math.min(0, Math.max(Hh - mh, oy));
    }
    function zoomAt(nz, sx, sy) { nz = Math.max(fit, Math.min(zMax(), nz)); ox = sx - (sx - ox) * nz / z; oy = sy - (sy - oy) * nz / z; z = nz; clamp(); }
    function centreKid() { ox = W / 2 - (m.player.tx + 0.5) * S * z; oy = Hh / 2 - (m.player.ty + 0.5) * S * z; clamp(); }
    size(); z = fit; clamp();
    function draw(t) {
      if (!live) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = '#141020'; g.fillRect(0, 0, W, Hh);
      g.imageSmoothingEnabled = z < 1; g.drawImage(base, ox, oy, map.w * S * z, map.h * S * z);
      g.imageSmoothingEnabled = true; g.drawImage(fog, ox, oy, map.w * S * z, map.h * S * z);
      var q = S * z;
      if (qt) { var qx = ox + (qt.x + 0.5) * q, qy = oy + (qt.y + 0.5) * q, qr = Math.max(5, q * 0.6) * (1 + 0.12 * Math.sin(t / 260));
        g.fillStyle = '#ffcf3a'; g.strokeStyle = '#4a3010'; g.lineWidth = 2; g.beginPath(); g.moveTo(qx, qy - qr); g.lineTo(qx + qr * 0.7, qy); g.lineTo(qx, qy + qr); g.lineTo(qx - qr * 0.7, qy); g.closePath(); g.fill(); g.stroke(); }
      var px = ox + (m.player.tx + 0.5) * q, py = oy + (m.player.ty + 0.5) * q, r = Math.max(4, q * 0.5) * (0.9 + 0.15 * Math.sin(t / 200));
      g.fillStyle = 'rgba(255,60,40,.3)'; g.beginPath(); g.arc(px, py, r * 2, 0, 7); g.fill();
      g.fillStyle = '#ff3c28'; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(px, py, r, 0, 7); g.fill(); g.stroke();
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
    // zoom buttons go between the whole map and a close view around the kid
    zin.addEventListener('click', function (e) { e.stopPropagation(); z = Math.min(zMax(), z * 2); centreKid(); });
    zout.addEventListener('click', function (e) { e.stopPropagation(); zoomAt(z / 2, W / 2, Hh / 2); });
    vp.addEventListener('wheel', function (e) { e.preventDefault(); var r = vp.getBoundingClientRect(); zoomAt(z * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    // drag to pan, two fingers to pinch
    var pts = {}, pinch = null;
    function loc(e) { var r = vp.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    vp.addEventListener('pointerdown', function (e) { if (e.target !== cv) return; pts[e.pointerId] = loc(e); try { cv.setPointerCapture(e.pointerId); } catch (_) {} pinch = null; e.preventDefault(); });
    vp.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return; var p = loc(e), ids = Object.keys(pts);
      if (ids.length >= 2) {
        pts[e.pointerId] = p; var a = pts[ids[0]], b = pts[ids[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        if (pinch) { zoomAt(z * d / Math.max(1, pinch.d), mx, my); ox += mx - pinch.mx; oy += my - pinch.my; clamp(); }
        pinch = { d: d, mx: mx, my: my };
      } else { var q0 = pts[e.pointerId]; ox += p[0] - q0[0]; oy += p[1] - q0[1]; clamp(); pts[e.pointerId] = p; }
    });
    function up(e) { delete pts[e.pointerId]; pinch = null; }
    vp.addEventListener('pointerup', up); vp.addEventListener('pointercancel', up);
    var x = H.kit.x(box);
    function close() { live = false; o.classList.remove('on'); setTimeout(function () { o.remove(); }, 220); }
    x.addEventListener('click', close); o.addEventListener('click', function (e) { if (e.target === o) close(); });
    root.appendChild(o); size(); z = fit; clamp(); requestAnimationFrame(function () { o.classList.add('on'); });
    try { H.audio && H.audio.sfx('page'); } catch (e) {}
  }

  // a small pixel map icon button next to the backpack
  function addButton() {
    var top = document.querySelector('.hm-top');
    if (!top) return setTimeout(addButton, 300);
    if (top.querySelector('.hm-map')) return;
    var b = document.createElement('div'); b.className = 'hm-btn hm-map'; b.title = 'Map';
    var c = document.createElement('img'); c.alt = ''; c.src = H.icons.url('map', 2); c.style.cssText = 'width:28px;height:28px;image-rendering:pixelated';
    b.appendChild(c); b.addEventListener('click', show);
    top.appendChild(b); top.style.flexDirection = 'column'; // stack buttons so the clock stays visible
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addButton); else addButton();
  H.mapview = { show: show, reveal: reveal };
})();
