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
    '.hmap .wt{display:flex;gap:6px;justify-content:center;margin:0 0 8px}.hmap .wt button{border:2px solid #8a6a40;border-radius:12px;background:rgba(255,255,255,.35);color:#4a3420;font:900 14px Nunito,system-ui,sans-serif;padding:6px 16px;cursor:pointer}.hmap .wt button.on{background:#8a6a40;color:#fff6dc}',
    '.hmap .wv{position:absolute;inset:0;z-index:2}.hmap .wv[hidden],.hmap .zm[hidden]{display:none}',
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

  // ---------- place names: only where the kid has been (not under fog); a label that would overlap another is skipped
  function labelsOf(name, map) {
    var seen = bits(name, map), out = [], have = {};
    function add(x, y, t) {
      if (!t || have[t] || x < 0 || y < 0 || x >= map.w || y >= map.h) return;
      var ok = false; for (var dy = -1; dy <= 1 && !ok; dy++) for (var dx = -1; dx <= 1 && !ok; dx++) { var xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < map.w && yy < map.h && seen[yy * map.w + xx]) ok = true; }
      if (ok) { have[t] = 1; out.push({ x: x, y: y, t: t }); }
    }
    (map.doors || []).forEach(function (d) {
      var t = d.to === 'home' ? 'Your home' : d.to === 'whisperwood' ? 'Road to Whisperwood' : d.to === 'village' ? 'Road to Emberbrook' : (H.maps && H.maps[d.to] && H.maps[d.to].tileset === 'indoor' ? H.maps[d.to].name : null);
      add(d.x, d.y, t);
    });
    (map.labels || []).forEach(function (l) { add(l.x, l.y, l.name); });
    return out;
  }
  function drawLabels(g, labs, ox, oy, q, W, Hh) {
    if (!labs.length) return;
    g.save(); g.font = '800 11px Nunito, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    var placed = [];
    labs.forEach(function (l) {
      var x = ox + (l.x + 0.5) * q, y = oy + (l.y + 0.5) * q - Math.max(10, q * 0.9), w = g.measureText(l.t).width + 10, h = 16;
      if (y - h / 2 < 2) y = oy + (l.y + 0.5) * q + Math.max(10, q * 0.9); // no room above: put it below
      var r = { x: Math.max(2, Math.min(W - w - 2, x - w / 2)), y: y - h / 2, w: w, h: h }; x = r.x + w / 2;
      if (r.x + r.w < 0 || r.y + r.h < 0 || r.x > W || r.y > Hh) return;
      if (placed.some(function (o) { return r.x < o.x + o.w + 2 && o.x < r.x + r.w + 2 && r.y < o.y + o.h + 2 && o.y < r.y + r.h + 2; })) return;
      placed.push(r);
      g.fillStyle = 'rgba(250,240,214,.92)'; g.strokeStyle = 'rgba(74,52,32,.7)'; g.lineWidth = 1;
      g.beginPath(); if (g.roundRect) g.roundRect(r.x, r.y, r.w, r.h, 6); else g.rect(r.x, r.y, r.w, r.h); g.fill(); g.stroke();
      g.fillStyle = '#3a2814'; g.fillText(l.t, x, y + 0.5);
    });
    g.restore();
  }

  // ---------- the world map: every region as a place on a parchment, linked by roads.
  // Visited places have names; the next place you have heard of shows its name and why it is closed; the rest are quiet marks.
  var REG = [
    { id: 'emberbrook', n: 'Emberbrook', x: 0.42, y: 0.16, maps: ['home', 'village', 'tavern', 'shop', 'school', 'house_a1', 'house_a2', 'house_a3'], el: 'fire' },
    { id: 'whisperwood', n: 'Whisperwood', x: 0.42, y: 0.38, maps: ['whisperwood'], el: 'grass' },
    { id: 'mossgrove', n: 'Mossgrove', x: 0.32, y: 0.58, maps: ['mossgrove', 'rootwood_gate', 'rootwood_hall', 'moss_house1', 'moss_house2'], el: 'grass', ring: 'grass' },
    { id: 'pass', n: 'Whistling Pass', x: 0.66, y: 0.56, maps: [], el: 'wind', why: 'Rockslide' },
    { x: 0.8, y: 0.76 }, { x: 0.58, y: 0.84 }, { x: 0.86, y: 0.36 }, { x: 0.2, y: 0.82 }, { x: 0.12, y: 0.42 }, { x: 0.7, y: 0.18 }, { x: 0.38, y: 0.95 }
  ];
  var ROADS = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [3, 6], [5, 7], [7, 8], [6, 9], [5, 10]];
  function regionOf(mapName) { for (var i = 0; i < REG.length; i++) if (REG[i].maps && REG[i].maps.indexOf(mapName) >= 0) return i; return -1; }
  function visited(r) { var f = (H.game && H.game.state && H.game.state.flags) || {}; return !!(r.maps && r.maps.some(function (k) { return f['visited:' + k]; })); }
  // the world is painted like the area map: same palette, pixel scale and labels; places you do not know stay in fog
  var wcache = { key: '', c: null };
  function worldPixels(PW, PH, known, heard) {
    var c = document.createElement('canvas'); c.width = PW; c.height = PH; var g = c.getContext('2d');
    function px(x, y, col) { g.fillStyle = col; g.fillRect(x | 0, y | 0, 1, 1); }
    function hsh(x, y) { var n = (x * 374761393 + y * 668265263) | 0; n = (n ^ (n >>> 13)) * 1274126177; return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
    // land and sea
    for (var y = 0; y < PH; y++) for (var x = 0; x < PW; x++) {
      var u = x / PW, v = y / PH, sea = (u - 1.02) * (u - 1.02) / 0.18 + (v - 1.02) * (v - 1.02) / 0.09 < 1;
      if (sea) px(x, y, hsh(x, y) < 0.06 ? '#6aa8e0' : COL.water);
      else { var r = hsh(x, y); px(x, y, r < 0.12 ? COL.tallgrass : r < 0.2 ? COL.flowers : COL.grass); }
    }
    // sandy coast
    for (y = 1; y < PH - 1; y++) for (x = 1; x < PW - 1; x++) {
      var d = g.getImageData(x, y, 1, 1).data; if (d[2] > 150) continue;
      var n2 = g.getImageData(x + 1, y, 1, 1).data, n3 = g.getImageData(x, y + 1, 1, 1).data;
      if (n2[2] > 150 || n3[2] > 150) px(x, y, COL.sand);
    }
    // forests (little round trees like the area map), mountains by the pass
    for (var k = 0; k < 140; k++) { var tx = hsh(k, 7) * PW, ty = hsh(k, 9) * PH, uu = tx / PW, vv = ty / PH;
      if ((uu - 1.02) * (uu - 1.02) / 0.2 + (vv - 1.02) * (vv - 1.02) / 0.11 < 1) continue;
      g.fillStyle = '#2f5f2c'; g.fillRect(tx - 1, ty - 1, 3, 3); g.fillStyle = '#3f7a38'; g.fillRect(tx - 1, ty - 1, 2, 2); }
    for (k = 0; k < 7; k++) { var mx = PW * (0.58 + k * 0.045), my = PH * (0.45 + (k % 2) * 0.03);
      for (var h = 0; h < 7; h++) { g.fillStyle = h < 2 ? '#f0f0f4' : '#8a8478'; g.fillRect(mx - h, my - 7 + h, h * 2 + 1, 1); g.fillStyle = '#6a6458'; g.fillRect(mx, my - 7 + h, h + 1, 1); } }
    // roads in path colour; dotted toward places not reached yet
    ROADS.forEach(function (e) { var a = REG[e[0]], b = REG[e[1]], both = known[e[0]] && known[e[1]], any = known[e[0]] || known[e[1]];
      if (!any) return;
      var x0 = a.x * PW, y0 = a.y * PH, x1 = b.x * PW, y1 = b.y * PH, n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
      for (var i = 0; i <= n; i++) { if (!both && (i >> 1) % 2) continue; var q = i / n, xx = x0 + (x1 - x0) * q + Math.sin(q * 3.14) * 3, yy = y0 + (y1 - y0) * q;
        g.fillStyle = COL.path; g.fillRect(xx | 0, yy | 0, 2, 2); } });
    // fog over everything you have not seen, the same deep colour as the area map
    var fog = document.createElement('canvas'); fog.width = PW; fog.height = PH; var f = fog.getContext('2d');
    f.fillStyle = '#141020'; f.fillRect(0, 0, PW, PH); f.globalCompositeOperation = 'destination-out';
    REG.forEach(function (r, i) { if (!known[i] && !heard[i]) return; var rad = (known[i] ? 0.2 : 0.11) * PW, gr = f.createRadialGradient(r.x * PW, r.y * PH, rad * 0.4, r.x * PW, r.y * PH, rad);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); f.fillStyle = gr; f.fillRect(0, 0, PW, PH); });
    g.drawImage(fog, 0, 0);
    return c;
  }
  function drawWorld(c, W, Hh, dpr, t, here) {
    if (c.width !== Math.round(W * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(Hh * dpr); c.style.width = W + 'px'; c.style.height = Hh + 'px'; }
    var g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var cur = regionOf(here), known = REG.map(function (r, i) { return visited(r) || i === cur; });
    var heard = REG.map(function (r, i) { return !known[i] && !!r.n && ROADS.some(function (e) { return (e[0] === i && known[e[1]]) || (e[1] === i && known[e[0]]); }); });
    var SC = Math.max(2, Math.floor(W / 110)), PW = Math.ceil(W / SC), PH = Math.ceil(Hh / SC), key = PW + 'x' + PH + known.join() + heard.join();
    if (wcache.key !== key) { wcache.key = key; wcache.c = worldPixels(PW, PH, known, heard); }
    g.imageSmoothingEnabled = false; g.drawImage(wcache.c, 0, 0, PW * SC, PH * SC);
    // places: the element icon, a gold ring where the ring is earned, labels like the area map
    var labs = [];
    REG.forEach(function (r, i) {
      if (!known[i] && !heard[i]) return;
      var x = Math.round(r.x * W), y = Math.round(r.y * Hh);
      g.fillStyle = '#2a1d10'; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); g.fillStyle = known[i] ? '#ffd98a' : '#8a7a5a'; g.beginPath(); g.arc(x, y, 10, 0, 7); g.fill();
      try { var im = iconImg(r.el); if (im.complete) { g.globalAlpha = known[i] ? 1 : 0.55; g.drawImage(im, x - 8, y - 8, 16, 16); g.globalAlpha = 1; } } catch (e2) {}
      if (r.ring && (H.game.state.rings || []).indexOf(r.ring) >= 0) { g.strokeStyle = '#ffcf3a'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 15, 0, 7); g.stroke(); }
      labs.push({ t: r.n + (heard[i] && r.why ? ': ' + r.why : ''), x: x, y: y + 22 });
    });
    drawLabels(g, labs.map(function (l) { return { t: l.t, x: l.x - 0.5, y: l.y - 0.5 }; }), 0, 0, 1, W, Hh);
    if (cur >= 0) { var cx = Math.round(REG[cur].x * W) + 18, cy = Math.round(REG[cur].y * Hh) - 10, rr = 5 * (0.9 + 0.15 * Math.sin(t / 200));
      g.fillStyle = 'rgba(255,60,40,.3)'; g.beginPath(); g.arc(cx, cy, rr * 2, 0, 7); g.fill();
      g.fillStyle = '#ff3c28'; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, rr, 0, 7); g.fill(); g.stroke(); }
  }
  var icCache = {};
  function iconImg(el) { if (!icCache[el]) { var im = new Image(); im.src = H.icons.url(el, 2); icCache[el] = im; } return icCache[el]; }

  function show() {
    var m = H.game && H.game.currentMap && H.game.currentMap();
    if (!m || !m.map || document.querySelector('.hmap')) return;
    if (H.pickups && H.game.state.intro && !H.pickups.has('map')) { H.ui && H.ui.blocked('No map yet. There is one somewhere at home.'); return; }
    H.ui && H.ui.helper && H.ui.helper('map', 'Map', 'Places you have seen. Drag to look, pinch to zoom.', 'map', '.hmap .vp');
    var map = m.map, root = document.getElementById('root');
    if (!document.getElementById('hmap-css')) { var st = document.createElement('style'); st.id = 'hmap-css'; st.textContent = CSS; document.head.appendChild(st); }
    reveal(m.name, map, m.player.tx, m.player.ty);
    var o = document.createElement('div'); o.className = 'hmap';
    var box = document.createElement('div'); box.className = 'box'; o.appendChild(box);
    var h = document.createElement('h3'); h.appendChild(H.kit.img('map')); h.appendChild(document.createTextNode(map.name || m.name)); box.appendChild(h);
    var tabs = document.createElement('div'); tabs.className = 'wt'; box.appendChild(tabs);
    var tA = document.createElement('button'); tA.textContent = 'This area'; tA.className = 'on'; tabs.appendChild(tA);
    var tW = document.createElement('button'); tW.textContent = 'World'; tabs.appendChild(tW);
    var vp = document.createElement('div'); vp.className = 'vp'; box.appendChild(vp);
    var wv = document.createElement('canvas'); wv.className = 'wv'; wv.hidden = true; vp.appendChild(wv);
    var worldOn = false;
    function setTab(w) { worldOn = w; tA.classList.toggle('on', !w); tW.classList.toggle('on', w); wv.hidden = !w; zm.style.zIndex = w ? 3 : ''; lg.style.visibility = w ? 'hidden' : 'visible'; h.lastChild.textContent = w ? 'The World' : (map.name || m.name); }
    tA.addEventListener('click', function (e) { e.stopPropagation(); setTab(false); });
    tW.addEventListener('click', function (e) { e.stopPropagation(); setTab(true); });
    var cv = document.createElement('canvas'); vp.appendChild(cv);
    var zm = document.createElement('div'); zm.className = 'zm'; vp.appendChild(zm);
    function zb(icon, tip) { var b = H.kit.x(zm); b.title = tip; b.setAttribute('aria-label', tip); b.firstChild.src = H.icons.url(icon, 2); return b; }
    var zin = zb('plus', 'Closer'), zout = zb('minus', 'Whole area');
    var lg = document.createElement('div'); lg.className = 'lg'; box.appendChild(lg);
    [['#efc77e', 'Road'], ['#3f86c8', 'Water'], ['#ffd98a', 'Door'], ['#ffffff', 'Person'], ['#ff3c28', 'You']]
      .concat(questTarget(m.name, map) ? [['#ffcf3a', 'Quest']] : []).forEach(function (l) {
        var s = document.createElement('span'), i = document.createElement('i'); i.style.background = l[0]; i.style.boxShadow = 'inset 0 0 0 1px rgba(0,0,0,.35)'; s.appendChild(i); s.appendChild(document.createTextNode(l[1])); lg.appendChild(s);
      });
    var S = 8, base = paintBase(map, S), fog = paintFog(map, bits(m.name, map)), qt = questTarget(m.name, map), labs = labelsOf(m.name, map);
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
      if (worldOn) { drawWorld(wv, W, Hh, dpr, t, m.name); requestAnimationFrame(draw); return; }
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = '#141020'; g.fillRect(0, 0, W, Hh);
      g.imageSmoothingEnabled = z < 1; g.drawImage(base, ox, oy, map.w * S * z, map.h * S * z);
      g.imageSmoothingEnabled = true; g.drawImage(fog, ox, oy, map.w * S * z, map.h * S * z);
      var q = S * z;
      if (qt) { var qx = ox + (qt.x + 0.5) * q, qy = oy + (qt.y + 0.5) * q, qr = Math.max(5, q * 0.6) * (1 + 0.12 * Math.sin(t / 260));
        g.fillStyle = '#ffcf3a'; g.strokeStyle = '#4a3010'; g.lineWidth = 2; g.beginPath(); g.moveTo(qx, qy - qr); g.lineTo(qx + qr * 0.7, qy); g.lineTo(qx, qy + qr); g.lineTo(qx - qr * 0.7, qy); g.closePath(); g.fill(); g.stroke(); }
      drawLabels(g, labs, ox, oy, q, W, Hh);
      var px = ox + (m.player.tx + 0.5) * q, py = oy + (m.player.ty + 0.5) * q, r = Math.max(4, q * 0.5) * (0.9 + 0.15 * Math.sin(t / 200));
      g.fillStyle = 'rgba(255,60,40,.3)'; g.beginPath(); g.arc(px, py, r * 2, 0, 7); g.fill();
      g.fillStyle = '#ff3c28'; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(px, py, r, 0, 7); g.fill(); g.stroke();
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
    // zoom buttons go between the whole map and a close view around the kid
    zin.addEventListener('click', function (e) { e.stopPropagation(); if (worldOn) { setTab(false); z = fit; clamp(); return; } z = Math.min(zMax(), z * 2); centreKid(); });
    zout.addEventListener('click', function (e) { e.stopPropagation(); if (worldOn) return; if (z <= fit * 1.01) { setTab(true); return; } zoomAt(z / 2, W / 2, Hh / 2); });
    vp.addEventListener('wheel', function (e) { e.preventDefault(); if (worldOn) { if (e.deltaY < 0) setTab(false); return; } if (e.deltaY > 0 && z <= fit * 1.01) { setTab(true); return; } var r = vp.getBoundingClientRect(); zoomAt(z * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    // drag to pan, two fingers to pinch
    var pts = {}, pinch = null;
    function loc(e) { var r = vp.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    vp.addEventListener('pointerdown', function (e) { if (e.target !== cv && e.target !== wv) return; pts[e.pointerId] = loc(e); try { cv.setPointerCapture(e.pointerId); } catch (_) {} pinch = null; e.preventDefault(); });
    vp.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return; var p = loc(e), ids = Object.keys(pts);
      if (ids.length >= 2) {
        pts[e.pointerId] = p; var a = pts[ids[0]], b = pts[ids[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        if (pinch && !worldOn && d < pinch.d * 0.8 && z <= fit * 1.01) { setTab(true); pinch = null; return; }
        if (pinch && worldOn && d > pinch.d * 1.25) { setTab(false); pinch = null; return; }
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
