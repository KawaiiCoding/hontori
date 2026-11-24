window.H = window.H || {};
// Spirits: authored in a 32x32 logical box, rasterised natively at any real scale k (renderScale * opts.scale), 4 directions + walk/sit poses,
// so 1x, 1.5x (0.75 on the 2x canvas), 2x and the 3x portraits are all crisp. 16-frame idle with squash-and-stretch.
// API: H.spirits = { list, draw(ctx, key, x, y, env, opts), portrait(key, stage), frames, stages, dual, habitats (where the third- to sixth-wave kinds live) }
(function () {
  var S = 32, NF = 16, cache = {}, pcache = {}, gcache = {};
  var list = [
    { key: 'hontori', name: 'Hontori', element: 'fire' },
    { key: 'water', name: 'Brookit', element: 'water' },
    { key: 'wind', name: 'Hooligust', element: 'wind' },
    { key: 'grass', name: 'Bramblebun', element: 'grass' },
    { key: 'electric', name: 'Zappity', element: 'electric' },
    { key: 'earth', name: 'Dugsworth', element: 'earth' },
    { key: 'dark', name: 'Nyxlet', element: 'dark' },
    { key: 'light', name: 'Lumbleen', element: 'light' },
    { key: 'frog', name: 'Pondlet', element: 'water' },
    { key: 'salamander', name: 'Sizzlet', element: 'fire' },
    { key: 'squirrel', name: 'Flitbrush', element: 'wind' },
    { key: 'tortoise', name: 'Mossplod', element: 'grass' },
    { key: 'hamster', name: 'Fizzpip', element: 'electric' },
    { key: 'crab', name: 'Pebbit', element: 'earth' },
    { key: 'raven', name: 'Duskrook', element: 'dark' },
    { key: 'firefly', name: 'Wickbug', element: 'light' }
  ];
  // element -> the original species key that owns that element's aura / glow / fx colours
  var ELK = { fire: 'hontori', water: 'water', wind: 'wind', grass: 'grass', electric: 'electric', earth: 'earth', dark: 'dark', light: 'light' }, BASEK = {};
  list.forEach(function (s) { BASEK[s.key] = ELK[s.element]; });
  var OUT = { hontori: '#3a140c', water: '#0f2440', wind: '#2a2440', grass: '#14301a', electric: '#16303a', earth: '#2a1a10', dark: '#120a1e', light: '#4a3a2a',
    frog: '#123a2e', salamander: '#3a120a', squirrel: '#2a2448', tortoise: '#1e2a12', hamster: '#3a2a10', crab: '#2a1a10', raven: '#0e0a1c', firefly: '#4a3020' };
  var FLY = { wind: 1, dark: 1, light: 1, raven: 1, firefly: 1 }, SEED = {};
  list.forEach(function (s, i) { SEED[s.key] = hash(i * 3.7 + 1.3); });

  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ---------- sprite sheets (H.sheets, group 'hontori') ----------
     The painters below stay the source of every picture and the fallback. A picture that is a pure
     function of its key may also be shipped in a sheet; draw() then copies it from there.

     KEYS (built once, kept next to the cached entry, never built per frame)
       'spirits:<kind>|<k>|<blink>|<dir><mode>|<stage>|<f>'   one animation frame
            kind   a key of H.spirits.list (the twelve two-element kinds have their own, recoloured, pictures)
            k      raster scale: pixels per logical unit, a multiple of 0.25 (draw() uses
                   max(0.5, round(renderScale * opts.scale * stageScale * 4) / 4); portraits use 3 and 2)
            blink  0 | 1 (eyes closed; never 1 while moving)
            dir    0 front | 1 back | 2 side, authored facing left
            mode   idle | move | sit
            stage  1..5
            f      0..15, the frame of the 16-frame loop
            The part before the last '|' is exactly the frame cache id used by frame().
            Picture size: n x n with n = ceil((32 + 2 * margin) * k), margin 2 at stage 1 and 26 above.
       'spirits:portrait|<kind>|<stage>'   the 96x96 portrait (backdrop and figure), copied whole

     STAYS AT DRAW TIME (never baked): mirroring (dir 3 and opts.flip draw the left-facing picture under
     scale(-1, 1)), opts.alpha, the hover offset, the ground shadow, the on-screen size (stage scale times
     opts.scale) and the second-element particles of the dual kinds. Which frame, blink state and raster
     scale are shown is chosen per draw; each of them is its own key.
     STAYS PAINTED: the halo behind a hontori (glow(), one 64x64 canvas per kind, painted once). It is
     very faint and always drawn through a pulsing alpha; an image file cannot hold such low alpha
     values exactly, so a baked halo would not match the painted one. */
  var MODEI = { idle: 0, move: 1, sit: 2 }, slots = {};
  /* one slot per (kind, k, blink, dir, mode, stage): the 16 cached frames and their 16 sheet keys */
  function slot(key, k, blink, dir, mode, st) {
    var a = slots[key] || (slots[key] = []), b = a[k * 4] || (a[k * 4] = []), mi = MODEI[mode];
    /* a mode outside the table (only a caller of frames() could pass one) keeps its own entry */
    var i = mi === undefined ? dir + mode + '|' + st + '|' + (blink ? 1 : 0) : (((st - 1) * 3 + dir) * 3 + mi) * 2 + (blink ? 1 : 0), s = b[i];
    if (!s) {
      var id = key + '|' + k + '|' + (blink ? 1 : 0) + '|' + dir + mode + '|' + st;
      s = b[i] = { arr: cache[id] || (cache[id] = []), keys: [] };
      for (var f = 0; f < NF; f++) s.keys.push('spirits:' + id + '|' + f);
    }
    return s;
  }
  /* the pose asked for by the draw in progress: the paint functions handed to H.sheets.draw read it,
     so no closure is made per draw */
  var qKey = 'hontori', qK = 1, qBlink = false, qF = 0, qDir = 0, qMode = 'idle', qSt = 1;
  function paintFrame() { return frame(qKey, qK, qBlink, qF, qDir, qMode, qSt); }
  function paintNone() { return null; }
  /* true while a portrait is being painted: the figure it is built from is part of the portrait, not a picture of its own */
  var inPortrait = false;
  function rasterK(sc) { return Math.max(0.5, Math.round((H.renderScale || 1) * sc * 4) / 4); }
  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  // Painter in logical coords. Zones (when warp is on): feet stay planted, the body stretches from its base,
  // the head rides on top with a small lag -> squash-and-stretch without any resampling.
  function P(c, k) {
    var g = c.getContext('2d'), K = Math.max(1, Math.round(k));
    var R = function (v) { return Math.round(v * k); }, snap = function (v) { return Math.round(v * k) / k; };
    var api = { g: g, k: k, ph: 0, blink: false, u: 0, uh: 0, fly: false, warp: false };
    function zone(y) { return !api.warp ? 0 : y >= 25.5 ? 0 : y >= 19 ? 1 : 2; }
    function dy(y) { var z = zone(y); return z === 2 ? -api.uh : z === 1 ? snap(-api.u * 0.5) : 0; }
    function rpx(x, y, col) { g.fillStyle = col; var X = R(x), Y = R(y); g.fillRect(X, Y, Math.max(1, R(x + 1) - X), Math.max(1, R(y + 1) - Y)); }
    function rrect(x, y, w, h, col) { g.fillStyle = col; var X = R(x), Y = R(y); g.fillRect(X, Y, Math.max(1, R(x + w) - X), Math.max(1, R(y + h) - Y)); }
    // shaded ellipse, pal = [hi, base, shade, dark]
    function rell(cx, cy, rx, ry, pal, flat) {
      cx *= k; cy *= k; rx *= k; ry *= k;
      for (var y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
        for (var x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          var nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry, r = nx * nx + ny * ny;
          if (r > 1) continue;
          var col = pal[1];
          if (!flat) {
            var d = nx * 0.55 + ny * 0.85;
            if (d < -0.62 && r < 0.75) col = pal[0];
            // darkest tone only on the deep shadow side; the rim of overlapping parts stays mid-tone (no dark 'ropes')
            else if (d > 0.7) col = pal[3] || pal[2];
            else if (r > 0.86 && d > 0.1) col = pal[2];
            else if (d > 0.2) col = pal[2];
          }
          g.fillStyle = col; g.fillRect(x, y, 1, 1);
        }
    }
    api.px = function (x, y, col) { rpx(x, y + dy(y), col); };
    api.rect = function (x, y, w, h, col) { rrect(x, y + dy(y + h / 2), w, h, col); };
    api.ell = function (cx, cy, rx, ry, pal, flat) {
      if (zone(cy) === 1 && ry >= 3) { var u = api.u; rell(cx, cy - u / 2, rx * (1 - 0.035 * u), ry + u / 2, pal, flat); }
      else rell(cx, cy + dy(cy), rx, ry, pal, flat);
    };
    // triangle (ear / spike): base from x0..x1 at y, tip at (tx,ty)
    api.tri = function (x0, x1, y, tx, ty, col, col2) {
      var d = dy((y + ty) / 2); y += d; ty += d;
      var Y0 = R(ty), Y1 = R(y + 1) - 1;
      for (var yy = Y0; yy <= Y1; yy++) {
        var q = (yy - Y0) / Math.max(1, Y1 - Y0);
        var a = Math.round((tx + (x0 - tx) * q) * k), b = Math.round((tx + 1 + (x1 - tx) * q) * k) - 1;
        for (var xx = a; xx <= b; xx++) {
          g.fillStyle = (col2 && xx >= a + K && xx <= b - K && yy >= Y0 + 2 * K) ? col2 : col;
          g.fillRect(xx, yy, 1, 1);
        }
      }
    };
    api.eye = function (x, y, big, col) {
      var h = big ? 3 : 2; y += dy(y); col = col || '#1a1020';
      if (k < 1.5) { rrect(x, y, 2, h, col); rpx(x, y, '#ffffff'); if (big) rpx(x + 1, y + 2, '#6a5a80'); return; }
      rell(x + 1, y + h / 2, 1.1, h / 2 + 0.08, [col, col], true);
      var hs = k >= 2 ? 1 : 0.6;
      rrect(x + 0.25, y + 0.3, hs, hs, '#ffffff');
      if (big) rrect(x + 1.05, y + h - 1.05, 0.5, 0.5, '#8a7aa8');
    };
    api.happyEye = function (x, y, col) {
      y += dy(y); g.fillStyle = col || '#1a1020';
      var X = R(x), n = Math.max(3, R(x + 3) - X), Y = R(y + 1), th = Math.max(1, Math.round(k * 0.55));
      for (var i = 0; i < n; i++) g.fillRect(X + i, Y - Math.round(Math.sin((i + 0.5) / n * Math.PI) * K - 0.3), 1, th);
    };
    api.blush = function (x, y, col) {
      if (api.stage >= 3) return; col = col || '#ff8a9a'; y += dy(y);
      if (k < 1.5) rrect(x, y, 2, 1, col); else rell(x + 1, y + 0.5, 1.3, 0.62, [col, col], true);
    };
    return api;
  }

  function outline(c, col, close, under) {
    var g = c.getContext('2d'), w = c.width, h = c.height;
    // 'under' = the layer drawn behind this one; no outline where it already covers (avoids lines across tails)
    var ud = under ? under.getContext('2d').getImageData(0, 0, w, h).data : null;
    var id = g.getImageData(0, 0, w, h), d = id.data, a = new Uint8Array(w * h), i, x, y;
    for (i = 0; i < w * h; i++) a[i] = d[i * 4 + 3] > 40 ? 1 : 0;
    if (close) {
      // morphological closing (dilate then erode) seals thin seams between overlapping parts that open to the edge
      var dil = new Uint8Array(w * h), cl = new Uint8Array(w * h), r = close, xx, yy, hit;
      for (y = 0; y < h; y++) for (x = 0; x < w; x++) { hit = 0;
        for (yy = Math.max(0, y - r); yy <= Math.min(h - 1, y + r) && !hit; yy++) for (xx = Math.max(0, x - r); xx <= Math.min(w - 1, x + r); xx++) if (a[yy * w + xx]) { hit = 1; break; }
        dil[y * w + x] = hit; }
      for (y = 0; y < h; y++) for (x = 0; x < w; x++) { hit = 1;
        for (yy = y - r; yy <= y + r && hit; yy++) for (xx = x - r; xx <= x + r; xx++) { if (xx < 0 || yy < 0 || xx >= w || yy >= h || !dil[yy * w + xx]) { hit = 0; break; } }
        cl[y * w + x] = hit; }
      // seam pixels (in the closed shape, transparent in the drawing): fill with a nearby body colour
      for (var pass = 0; pass < r + 1; pass++) for (i = 0; i < w * h; i++) {
        if (a[i] || !cl[i]) continue;
        var nb = [i - 1, i + 1, i - w, i + w];
        for (var q2 = 0; q2 < 4; q2++) { var j2 = nb[q2]; if (j2 >= 0 && j2 < w * h && a[j2]) { d[i * 4] = d[j2 * 4]; d[i * 4 + 1] = d[j2 * 4 + 1]; d[i * 4 + 2] = d[j2 * 4 + 2]; d[i * 4 + 3] = 255; a[i] = 1; break; } }
      }
    }
    // Transparent pixels reachable from the canvas border are "outside". Any other transparent pixel is a
    // hairline gap between overlapping body shapes: heal it with a neighbouring body colour instead of
    // outlining it (outlining those gaps made thin dark "ropes" across evolved forms).
    var out = new Uint8Array(w * h), q = [];
    for (x = 0; x < w; x++) { q.push(x, (h - 1) * w + x); }
    for (y = 0; y < h; y++) { q.push(y * w, y * w + w - 1); }
    while (q.length) { i = q.pop(); if (out[i] || a[i]) continue; out[i] = 1; x = i % w; y = (i / w) | 0;
      if (x > 0) q.push(i - 1); if (x < w - 1) q.push(i + 1); if (y > 0) q.push(i - w); if (y < h - 1) q.push(i + w); }
    for (i = 0; i < w * h; i++) {
      if (a[i] || out[i]) continue;
      var n = [i - 1, i + 1, i - w, i + w];
      for (var k = 0; k < 4; k++) { var j = n[k]; if (j >= 0 && j < w * h && a[j]) { d[i * 4] = d[j * 4]; d[i * 4 + 1] = d[j * 4 + 1]; d[i * 4 + 2] = d[j * 4 + 2]; d[i * 4 + 3] = 255; break; } }
    }
    g.putImageData(id, 0, 0);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); // pixel coords: the stage canvases carry a margin translate
    g.fillStyle = col;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      if (!out[y * w + x]) continue;
      if (ud && ud[(y * w + x) * 4 + 3] > 40) continue;
      if ((x > 0 && a[y * w + x - 1]) || (x < w - 1 && a[y * w + x + 1]) || (y > 0 && a[(y - 1) * w + x]) || (y < h - 1 && a[(y + 1) * w + x]))
        g.fillRect(x, y, 1, 1);
    }
    g.restore();
  }

  // ---------- aura particles (drawn after outline, unoutlined, glowing) ----------
  function aura(p, key, f) {
    var i, ph, x, y, k; key = BASEK[key] || key;
    for (i = 0; i < 5; i++) {
      ph = ((f / NF) + i / 5) % 1;
      var sx = 4 + Math.floor(hash(i * 7 + key.length) * 24);
      switch (key) {
        case 'hontori':
          x = sx + Math.round(Math.sin(ph * 6.28 + i) * 1.5); y = 28 - Math.round(ph * 24);
          p.px(x, y, ph < 0.4 ? '#fff2a0' : ph < 0.75 ? '#ff9a2a' : '#c0401a');
          if (ph < 0.3) p.px(x, y + 1, '#ff6a1a');
          break;
        case 'water':
          x = sx + Math.round(Math.sin(ph * 9 + i) * 1); y = 27 - Math.round(ph * 22);
          if (i % 2) { p.px(x, y, '#bfefff'); p.px(x + 1, y, '#7fd0ff'); p.px(x, y + 1, '#7fd0ff'); p.px(x + 1, y + 1, '#ffffff'); }
          else p.px(x, y, '#bfefff');
          break;
        case 'wind':
          k = ph * 6.28 + i * 1.3; x = 16 + Math.round(Math.cos(k) * 13); y = 17 + Math.round(Math.sin(k) * 7);
          p.px(x, y, '#ffffff'); p.px(x - Math.sign(Math.sin(k)), y, '#cfe8ff'); p.px(x - 2 * Math.sign(Math.sin(k)), y, '#9fc0e8');
          break;
        case 'grass':
          x = sx + Math.round(Math.sin(ph * 6.28 + i) * 3); y = 4 + Math.round(ph * 24);
          p.px(x, y, '#9be04a'); p.px(x + 1, y, '#5aa030'); if (i % 2) p.px(x, y - 1, '#cff07a');
          break;
        case 'electric':
          if ((f + i) % 3 === 0) {
            x = sx; y = 4 + Math.floor(hash(i * 3 + f) * 20);
            p.px(x, y, '#e8ffff'); p.px(x + 1, y + 1, '#7ff0ff'); p.px(x, y + 2, '#7ff0ff'); p.px(x + 1, y + 3, '#c8fbff');
          }
          break;
        case 'earth':
          x = sx + Math.round(Math.sin(i + ph) * 1); y = 29 - Math.round(Math.sin(ph * 3.14) * 6);
          p.px(x, y, i % 2 ? '#b08a5a' : '#8a6a40'); if (i === 2) p.px(x + 1, y, '#6a5030');
          break;
        case 'dark':
          k = ph * 6.28 + i; x = sx; y = 26 - Math.round(ph * 20);
          if (ph < 0.8) { p.px(x, y, '#b07aff'); if (i % 2) { p.px(x - 1, y, '#5a2a9a'); p.px(x + 1, y, '#5a2a9a'); p.px(x, y - 1, '#5a2a9a'); p.px(x, y + 1, '#5a2a9a'); } }
          break;
        case 'light':
          x = sx; y = 3 + Math.floor(hash(i * 11) * 24);
          var tw = (f + i * 2) % NF;
          if (tw < 3) { p.px(x, y, '#ffffff'); if (tw === 1) { p.px(x - 1, y, '#fff3b0'); p.px(x + 1, y, '#fff3b0'); p.px(x, y - 1, '#fff3b0'); p.px(x, y + 1, '#fff3b0'); } }
          break;
      }
    }
  }

  // ---------- spirit bodies ----------
  // Every body is drawn in a 32x32 logical box (centre 16,16, ground ~y28). Pose is on the painter:
  //   p.dir 0 front | 1 back | 2 side (all side art faces LEFT; dir 3 is the mirror), p.mode 'idle'|'move'|'sit',
  //   p.gp gait phase (radians), p.back / p.side shortcuts.
  function lift(p, pair) { return p.mode === 'move' ? (Math.sin(p.gp + pair * Math.PI) > 0.35 ? 1 : 0) : 0; }
  // two front/back-view feet that alternate when walking
  function feet2(p, x1, x2, y, w, h, col, top) {
    var a = lift(p, 0), c = lift(p, 1);
    p.rect(x1, y - a, w, h, col); p.rect(x2, y - c, w, h, col);
    if (top) { p.rect(x1, y - a, w - 1, 1, top); p.rect(x2, y - c, w - 1, 1, top); }
  }
  // side-view legs: diagonal pairs swing (trot); legs = [[x, pair, far]]
  function legsSide(p, legs, y0, y1, w, col, farCol, sock) {
    legs.forEach(function (L) {
      var mv = p.mode === 'move', s = mv ? Math.sin(p.gp + L[1] * Math.PI) : 0, dx = Math.round(s * 1.6 * 2) / 2;
      var up = mv && Math.cos(p.gp + L[1] * Math.PI) < -0.2 ? 1 : 0,  /* a foot lifts while it swings forward (to the left), so the walk reads forwards */ yb = y1 - up, c = L[2] ? farCol : col;
      for (var yy = y0; yy < yb; yy++) {
        var q = (yy - y0) / Math.max(1, yb - y0), xx = L[0] + dx * q;
        p.rect(xx, yy, w, 1, sock && yy >= yb - 2 ? (L[2] ? sock[1] : sock[0]) : c);
      }
    });
  }
  function hop(p) { return p.mode === 'move' ? -Math.round(Math.abs(Math.sin(p.gp)) * 3) / 2 : p.mode === 'sit' ? 1 : 0; }

  var FOX = { O: ['#ffc070', '#f07a26', '#c0501a', '#8a3010'], C: ['#fff8e8', '#ffe8c8', '#f0c8a0', '#d8a078'],
    T1: ['#ffd070', '#f89a2c', '#e06a20', '#b84a18'], T2: ['#ffe08a', '#ffb83a', '#f08a26', '#d86a1c'], T3: ['#ffe9a0', '#ffd060'] };
  function foxTail(p, f, pts) { // pts: 4 [x,y] centres from base to tip, sway applied progressively
    var s = [Math.sin(p.ph), Math.sin(p.ph - 0.9), Math.sin(p.ph - 1.8), Math.sin(p.ph - 2.7)], fk = (f >> 1) & 1;
    var am = p.mode === 'move' ? 0.6 : 1;
    p.ell(pts[0][0] + s[0] * 0.5 * am, pts[0][1], 4.3, 5, FOX.O);
    p.ell(pts[1][0] + s[1] * 1.1 * am, pts[1][1], 3.5, 4.1, FOX.T1);
    p.ell(pts[2][0] + s[2] * 1.7 * am, pts[2][1], 2.4, 3, FOX.T2);
    p.ell(pts[3][0] + s[3] * 2.2 * am, pts[3][1] - fk * 0.5, 1.2, 2, FOX.T3, true);
    p.ell(pts[1][0] + s[1] * 1.1 * am, pts[1][1] + 0.6, 1.5, 2.2, ['#ffd878', '#ffd878'], true);
    p.ell(pts[2][0] + s[2] * 1.7 * am, pts[2][1] + 0.6, 0.9, 1.4, ['#ffe9a0', '#ffe9a0'], true);
  }
  function foxFront(p, f) {
    var O = FOX.O, C = FOX.C, b = hop(p), sit = p.mode === 'sit', hb = sit ? 0 : b;
    if (sit) foxTail(p, f, [[22.5, 23], [25.5, 18], [26.5, 13], [26.5, 9.5]]);
    else foxTail(p, f, [[23.5, 21 + b], [25.6, 15.6 + b], [26, 11.2 + b], [26.2, 7.6 + b]]);
    if (sit) {
      p.ell(15, 22.5, 7, 5.5, O);
      p.ell(9.5, 25, 3, 2.6, O); p.ell(20.5, 25, 3, 2.6, O);
      p.ell(15, 22.5, 3.6, 4, C);
      p.rect(11.5, 25.5, 2.5, 2.5, O[3]); p.rect(16.5, 25.5, 2.5, 2.5, O[3]);
      p.rect(11.5, 25.5, 2, 1, O[2]); p.rect(16.5, 25.5, 2, 1, O[2]);
      // tail tip curled around the paws
      p.ell(21, 27, 4, 1.6, FOX.T1); p.ell(17.5, 27.3, 2, 1.2, FOX.T3, true);
    } else {
      p.ell(15, 22 + b, 6.5, 5.5, O);
      p.ell(14, 23 + b, 3.5, 3.5, C);
      feet2(p, 10, 17, 26 + b * 0, 3, 2, O[3], O[2]);
    }
    p.tri(6, 10, 11 + hb, 6, 3 + hb, O[1], '#ffb8a0'); p.tri(17, 21, 11 + hb, 21, 3 + hb, O[2], '#ffb8a0');
    p.rect(6, 3 + hb, 1, 2, '#3a2020'); p.rect(21, 3 + hb, 1, 2, '#3a2020');
    p.ell(14, 13 + hb, 7.5, 5.5, O);
    p.ell(14, 16 + hb, 4.5, 2.5, C);
    if (p.blink) { p.happyEye(9, 12 + hb); p.happyEye(17, 12 + hb); }
    else { p.eye(9, 11 + hb, true); p.eye(17, 11 + hb, true); }
    p.rect(13, 15 + hb, 2, 1, '#2a1010');
    p.px(12, 17 + hb, '#5a2010'); p.px(13, 18 + hb, '#5a2010'); p.px(14, 18 + hb, '#5a2010'); p.px(15, 17 + hb, '#5a2010');
    p.blush(7, 15 + hb); p.blush(19, 15 + hb);
    p.px(18, 14 + hb, '#5a4a48'); p.px(19, 13 + hb, '#4a3a38'); p.px(11, 9 + hb, '#5a4a48');
    p.px(14, 7 + hb, '#ffd060'); p.px(13, 8 + hb, '#ffb030'); p.px(15, 6 + hb - ((f >> 1) & 1) * 0.5, '#ffe08a');
  }
  function foxBack(p, f) {
    var O = FOX.O, C = FOX.C, b = hop(p), sit = p.mode === 'sit', hb = sit ? 0 : b;
    // cheek fluff peeking out past the head
    p.ell(8.5, 16.5 + hb, 2.2, 1.6, C); p.ell(23.5, 16.5 + hb, 2.2, 1.6, C);
    if (sit) { p.ell(16, 22.5, 7, 5.5, O); p.ell(10, 25, 3, 2.6, O); p.ell(22, 25, 3, 2.6, O); }
    else { p.ell(16, 22 + b, 6.5, 5.5, O); feet2(p, 11, 18, 26, 3, 2, O[3], O[2]); }
    // ears from behind: solid fur, dark tips
    p.tri(7, 11, 11 + hb, 7, 3 + hb, O[1], O[2]); p.tri(21, 25, 11 + hb, 25, 3 + hb, O[2], O[3]);
    p.rect(7, 3 + hb, 1, 2, '#3a2020'); p.rect(25, 3 + hb, 1, 2, '#3a2020');
    p.ell(16, 13 + hb, 7.5, 5.8, O);
    p.px(16, 7 + hb, '#ffd060'); p.px(15, 8 + hb, '#ffb030'); p.px(17, 6 + hb - ((f >> 1) & 1) * 0.5, '#ffe08a');
    p.px(19, 10 + hb, '#5a4a48'); p.px(20, 11 + hb, '#6a5a58'); // soot on the back of the head
    // tail: nearest to the viewer, rises from the rump and sweeps up to one side
    if (sit) foxTail(p, f, [[20.5, 25.5], [24, 22], [26, 18], [27, 14.5]]);
    else foxTail(p, f, [[20, 24.5 + b], [23.5, 20.5 + b], [25.5, 16.5 + b], [26.5, 13 + b]]);
  }
  function foxSide(p, f) { // faces left
    var O = FOX.O, C = FOX.C, b = hop(p), sit = p.mode === 'sit', mv = p.mode === 'move';
    var hx = sit ? 10 : 9.5, hy = sit ? 12 : 14 + b, sock = ['#7a2a10', '#5a2010'];
    // far ear (behind head)
    p.tri(12, 15, hy - 4, 14.5, hy - 11, O[2], O[3]);
    if (sit) {
      foxTail(p, f, [[23, 21], [26, 17], [27, 13], [27, 9.5]]);
      p.ell(19.5, 23.5, 5.5, 4.4, O);
      p.ell(13, 19.5, 4.2, 5.4, O);
      p.ell(11.2, 19.5, 2.2, 4, C);
      legsSide(p, [[9.5, 0, 1]], 21, 28, 2, O[1], O[2], sock);
      legsSide(p, [[12, 0, 0]], 21, 28, 2.5, O[1], O[2], sock);
      p.ell(16.5, 27.2, 3.2, 1.3, ['#a84018', '#8a3010']);
      p.ell(20, 27.2, 6, 1.7, FOX.T1); p.ell(14.5, 27.1, 2.6, 1.4, FOX.T3, true);
    } else {
      var ta = mv ? 1.5 : 0;
      foxTail(p, f, [[24 + ta, 19.5 + b], [27 + ta, 15 + b + ta * 0.6], [28 + ta * 0.6, 11 + b + ta], [28.2, 7.8 + b + ta * 1.4]]);
      legsSide(p, [[11, 1, 1], [20.5, 0, 1]], 23 + b, 28, 2.2, O[1], O[2], sock);
      p.ell(17, 21 + b, 7.2, 4.6, O);
      p.ell(15.5, 23.4 + b, 4.6, 1.7, C);
      legsSide(p, [[12.5, 0, 0], [22, 1, 0]], 23 + b, 28, 2.5, O[1], O[2], sock);
      p.ell(11.5, 20 + b, 2.8, 3, C);
    }
    // head in profile
    p.ell(hx, hy, 6, 5.2, O);
    p.ell(hx + 2.5, hy + 3, 2.6, 1.8, C); // cheek ruff
    p.ell(hx - 4.8, hy + 2, 3.2, 1.9, C);  // muzzle
    p.ell(hx - 4.2, hy + 0.8, 2.6, 1.2, O, true);
    p.rect(hx - 8.2, hy + 1, 1.6, 1.3, '#2a1010');
    p.px(hx - 6, hy + 3.4, '#5a2010'); p.px(hx - 5, hy + 3.6, '#5a2010');
    if (p.blink) p.happyEye(hx - 5, hy - 1); else p.eye(hx - 4, hy - 2.5, true);
    p.blush(hx - 2, hy + 1.6);
    // near ear
    p.tri(hx - 1, hx + 3.5, hy - 3.5, hx + 1, hy - 11, O[1], '#ffb8a0');
    p.rect(hx + 1, hy - 11, 1, 2, '#3a2020');
    p.px(hx + 3, hy - 1, '#5a4a48'); p.px(hx + 4, hy, '#6a5a58');
    p.px(hx - 1, hy - 5.5, '#ffd060'); p.px(hx - 2, hy - 6.5 - ((f >> 1) & 1) * 0.5, '#ffe08a');
  }

  // ---- generic helpers for the other spirits ----
  var DEF = {
    hontori: function (p, f) { if (p.back) foxBack(p, f); else if (p.side) foxSide(p, f); else foxFront(p, f); },

    water: function (p, f) { // Brookit the otter
      var B = ['#9ad0f0', '#4a90c8', '#2e6aa0', '#1c4878'], C = ['#ffffff', '#e8f4ff', '#c0dcf0', '#9ac0e0'];
      var b = hop(p), sw = Math.sin(p.ph - 1) * 2;
      if (p.side) {
        p.ell(26 + sw * 0.3, 25 + b + sw / 3, 5, 1.8, B);
        legsSide(p, [[19, 1, 1], [12, 0, 1]], 24 + b, 28, 2.4, B[2], B[3]);
        p.ell(17, 21 + b, 7, 5.6, B);
        p.ell(13.5, 22 + b, 3.4, 4.4, C);
        p.ell(11, 21.5 + b, 2, 1.6, ['#ffe0f0', '#f0b0c8', '#c88098', '#a06078']);
        legsSide(p, [[20, 0, 0], [13, 1, 0]], 24 + b, 28, 2.6, B[2], B[3]);
        p.ell(13.5, 8.5 + b, 1.6, 1.6, B);
        p.ell(11, 13 + b, 6, 5.2, B);
        p.ell(6.5, 15 + b, 3.2, 2.3, C);
        p.rect(3.2, 13.6 + b, 2, 1.3, '#1a1020');
        if (p.blink) p.happyEye(6.5, 11.5 + b); else p.eye(7, 10.5 + b, true);
        p.px(5, 16.5 + b, '#e8f4ff'); p.px(4, 17 + b, '#e8f4ff');
        p.blush(9, 13.5 + b, '#ff9ab0');
        p.px(12, 5 + b, '#bfefff'); p.rect(11, 6 + b, 3, 1, '#7fd0ff'); p.px(12, 6 + b, '#ffffff');
        return;
      }
      if (!p.back) p.ell(25 + sw * 0.3, 25.5 + b + sw / 2, 5, 2, B);
      p.ell(15, 21 + b, 6.5, 6, B);
      if (!p.back) {
        p.ell(15, 22 + b, 4, 4.5, C);
        p.ell(15, 22 + b, 2.5, 1.8, ['#ffe0f0', '#f0b0c8', '#c88098', '#a06078']); p.px(15, 21 + b, '#ffffff');
        p.rect(11, 21 + b, 2, 2, '#2e6aa0'); p.rect(18, 21 + b, 2, 2, '#2e6aa0');
      }
      feet2(p, 10, 17, 26, 3, 2, '#1c4878');
      p.ell(15, 12 + b, 7, 5.5, B);
      p.ell(8, 8 + b, 1.6, 1.6, B); p.ell(22, 8 + b, 1.6, 1.6, B);
      if (p.back) { p.ell(15, 26 + b, 4, 2.2, B); p.ell(15, 26.6 + b, 2.5, 1, ['#9ad0f0', '#7ab8e0'], true); }
      else {
        p.ell(15, 15 + b, 4.5, 2.5, C);
        if (p.blink) { p.happyEye(10, 12 + b); p.happyEye(18, 12 + b); } else { p.eye(10, 11 + b, true); p.eye(18, 11 + b, true); }
        p.rect(14, 14 + b, 3, 1, '#1a1020'); p.px(15, 15 + b, '#1a1020');
        p.px(10, 15 + b, '#e8f4ff'); p.px(9, 15 + b, '#e8f4ff'); p.px(20, 15 + b, '#e8f4ff'); p.px(21, 15 + b, '#e8f4ff');
        p.blush(8, 14 + b, '#ff9ab0'); p.blush(21, 13 + b, '#ff9ab0');
      }
      p.px(15, 5 + b, '#bfefff'); p.rect(14, 6 + b, 3, 1, '#7fd0ff'); p.px(15, 6 + b, '#ffffff');
    },

    wind: function (p, f) { // Hooligust the owl
      var B = ['#e0f0ff', '#a8c4e8', '#7890c0', '#58689a'], C = ['#ffffff', '#f4f8ff', '#dce8f8', '#c0d0e8'];
      var fl = Math.sin(p.ph * (p.mode === 'move' ? 4 : 2)) * 1.6 - 0.5, b = 0, Y = ['#ffd84a', '#ffc020', '#e09010'];
      if (p.side) {
        p.ell(22, 17 + fl * 0.5, 3, 5, B); // far wing
        p.ell(16, 17, 8.5, 9.5, B);
        p.ell(12, 21, 4, 5, C);
        p.tri(9, 12, 10, 9, 5, B[2]); p.tri(16, 19, 9, 19, 4, B[3]);
        p.ell(10.5, 14, 3.8, 3.6, C, true);
        if (p.blink) p.happyEye(9, 13); else { p.ell(10, 14, 2.2, 2.2, Y, true); p.rect(8.5, 13, 2, 2, '#1a1020'); p.px(8.5, 13, '#fff'); }
        p.px(6, 16, '#f0a030'); p.px(5, 16.5, '#f0a030'); p.px(6, 17, '#c07010');
        p.ell(19, 19 + fl, 4, 6, B); // near wing
        p.px(19, 17 + fl, '#dce8f8'); p.px(20, 20 + fl, '#dce8f8');
        p.rect(13, 26, 3, 1, '#e09010');
        return;
      }
      p.ell(6, 18 + fl, 3, 5, B); p.ell(26, 18 + fl, 3, 5, B);
      p.ell(16, 17, 9, 9.5, B);
      p.tri(7, 10, 10, 6, 5, B[2]); p.tri(22, 25, 10, 26, 5, B[3]);
      if (p.back) {
        [[13, 15], [19, 15], [16, 19], [13, 23], [19, 23]].forEach(function (q) { p.px(q[0], q[1], '#dce8f8'); p.px(q[0] - 1, q[1] - 1, '#dce8f8'); p.px(q[0] + 1, q[1] - 1, '#dce8f8'); });
        p.ell(16, 26, 3, 1.4, ['#a8c4e8', '#7890c0', '#58689a']);
      } else {
        p.ell(16, 21, 5.5, 5, C);
        p.px(14, 21, '#a8c4e8'); p.px(15, 22, '#a8c4e8'); p.px(17, 22, '#a8c4e8'); p.px(18, 21, '#a8c4e8');
        p.ell(12, 14, 4, 3.6, C, true); p.ell(20, 14, 4, 3.6, C, true);
        if (p.blink) { p.happyEye(10, 13); p.happyEye(19, 13); }
        else { p.ell(12, 14, 2.2, 2.2, Y, true); p.ell(20, 14, 2.2, 2.2, Y, true);
          p.rect(11, 13, 2, 2, '#1a1020'); p.rect(19, 13, 2, 2, '#1a1020'); p.px(11, 13, '#fff'); p.px(19, 13, '#fff'); }
        p.px(15, 16, '#f0a030'); p.px(16, 16, '#f0a030'); p.px(15, 17, '#c07010'); p.px(16, 17, '#c07010');
        p.px(16, 9, '#ffffff'); p.px(17, 8, '#ffffff'); p.px(15, 8, '#dce8f8');
      }
      p.rect(12, 26, 3, 1, '#e09010'); p.rect(18, 26, 3, 1, '#e09010');
    },

    grass: function (p, f) { // Bramblebun the hedgehog
      var L = ['#bff070', '#6ab83a', '#3a8a2a', '#24601e'], C = ['#fff8e8', '#f8e0c0', '#e0c098', '#c09a70'];
      var b = hop(p), i, a, tx, ty;
      function flower(fx, fy) { p.px(fx, fy - 1, '#ff9ac0'); p.px(fx - 1, fy, '#ff9ac0'); p.px(fx + 1, fy, '#ff9ac0'); p.px(fx, fy + 1, '#ff9ac0'); p.px(fx, fy, '#ffe04a'); }
      function spikes(cx, n, a0, da) {
        for (i = 0; i < n; i++) {
          a = a0 + i * da; tx = Math.round(cx + Math.cos(a) * 10); ty = Math.round(19 + Math.sin(a) * 9 + b);
          p.tri(tx - 2, tx + 2, ty + 4, tx + (i % 2 ? 1 : 0), ty - 1, i % 3 ? L[2] : L[1], '#9be04a');
        }
      }
      if (p.side) {
        spikes(17, 9, -2.6, 0.4);
        p.ell(17, 20 + b, 9, 7, L);
        p.ell(11, 20 + b, 5.5, 5, C); p.ell(6, 22 + b, 2, 1.6, C);
        p.px(4, 22 + b, '#3a2020'); p.px(5, 22 + b, '#3a2020');
        if (p.blink) p.happyEye(8, 19 + b); else p.eye(8, 18 + b, true);
        p.blush(10, 22 + b);
        p.px(7, 24 + b, '#5a3020'); p.px(8, 24.5 + b, '#5a3020');
        legsSide(p, [[10, 0, 0], [20, 1, 0]], 26 + b, 28, 3, C[3], C[3]);
        flower(19, 9 + b); p.px(20, 11 + b, L[2]);
        return;
      }
      spikes(16, 9, -2.95, 0.36);
      p.ell(16, 20 + b, 9.5, 7, L);
      if (p.back) {
        for (i = 0; i < 5; i++) { tx = 9 + i * 3.5; p.tri(tx - 2, tx + 2, 22 + b + (i % 2), tx, 15 + b + (i % 2), i % 2 ? L[2] : L[1], '#9be04a'); }
        p.ell(16, 25.5 + b, 1.5, 1, C);
      } else {
        p.ell(16, 21 + b, 6, 5, C);
        p.ell(16, 24 + b, 2.2, 1.5, C);
        p.rect(15, 23 + b, 2, 1, '#3a2020');
        if (p.blink) { p.happyEye(11, 20 + b); p.happyEye(18, 20 + b); } else { p.eye(11.5, 19 + b, true); p.eye(18.5, 19 + b, true); }
        p.blush(10, 22.5 + b); p.blush(20, 22.5 + b);
      }
      feet2(p, 10, 19, 26, 3, 2, C[3]);
      flower(17, 9 + b); p.px(18, 11 + b, L[2]);
    },

    electric: function (p, f) { // Zappity the spark stoat: slate-teal fur, goggle markings, spark-plug tail
      var S = ['#8fd4dc', '#4f9aac', '#36707f', '#244c58'], C = ['#fffaf0', '#f4ecd8', '#ddd0b4', '#bfae8c'];
      var G = '#1d3640', Q = ['#e8ffff', '#7ff0ff', '#3cc8e0', '#2390a8'], b = hop(p), tk = (f >> 1) & 1;
      var spark = function (x, y) { if ((f + Math.round(x)) % 4 < 2) { p.px(x, y, '#e8ffff'); p.px(x + 0.5, y - 0.5, '#7ff0ff'); } };
      if (p.side) {
        var sw = Math.sin(p.ph) * 0.8;
        p.ell(26 + sw * 0.4, 20 + b, 2.8, 3.4, S); p.ell(27.5 + sw, 15.5 + b, 2.6, 3, S);
        p.ell(28 + sw * 1.4, 11.5 + b, 2.3, 2.3, Q); p.px(27.5 + sw * 1.4, 10.5 + b, '#ffffff');
        legsSide(p, [[11, 1, 1], [21, 0, 1]], 24 + b, 28, 2, S[2], S[3]);
        p.ell(17.5, 22 + b, 8.5, 3.8, S);
        p.ell(15.5, 24.3 + b, 5.5, 1.4, C, true);
        legsSide(p, [[12.5, 0, 0], [22.5, 1, 0]], 24 + b, 28, 2.2, S[2], S[3]);
        p.ell(11, 19 + b, 3.4, 3.6, S);
        p.ell(9.5, 12 + b, 1.9, 1.9, S); p.ell(9.5, 12.2 + b, 0.9, 0.9, ['#f0d8d0', '#e0b8b0'], true);
        p.ell(8, 15.5 + b, 5.2, 4.2, S);
        p.ell(4, 17.3 + b, 2.8, 1.7, C);
        p.rect(1.2, 16.2 + b, 1.4, 1.2, '#1a1020');
        p.ell(6.5, 15 + b, 2.7, 2.5, [G, G], true);
        if (p.blink) p.happyEye(5, 14.5 + b, '#bff8ff'); else { p.eye(5.5, 14 + b, true, '#0e1a20'); }
        p.px(9, 14.5 + b, G);
        p.blush(8.5, 17.5 + b, '#f0a0a8');
        spark(1, 19 + b); spark(3, 20 + b);
        return;
      }
      var sw2 = Math.sin(p.ph) * 0.8;
      if (!p.back) { // tail behind, curling up on the right
        p.ell(23 + sw2 * 0.3, 23 + b, 3, 3.4, S); p.ell(25.5 + sw2 * 0.8, 18 + b, 2.8, 3.2, S);
        p.ell(26.3 + sw2 * 1.2, 13.5 + b, 2.4, 2.4, Q); p.px(25.8 + sw2 * 1.2, 12.5 + b, '#ffffff');
      }
      p.ell(16, 21 + b, 5.2, 6, S);
      if (!p.back) p.ell(16, 22.3 + b, 3, 4.4, C);
      feet2(p, 11.5, 17.5, 26, 3, 2, S[3], S[2]);
      p.ell(10.5, 7.5 + b, 2, 2, S); p.ell(21.5, 7.5 + b, 2, 2, S);
      if (!p.back) { p.ell(10.5, 7.7 + b, 0.9, 0.9, ['#f0d8d0', '#e0b8b0'], true); p.ell(21.5, 7.7 + b, 0.9, 0.9, ['#f0d8d0', '#e0b8b0'], true); }
      p.ell(16, 12.5 + b, 6.8, 5.2, S);
      if (p.back) {
        p.rect(15.5, 9 + b, 1, 3, S[2]); p.rect(15.5, 17 + b, 1, 6, S[2]);
        p.ell(18 + sw2 * 0.3, 24 + b, 3, 3.2, S); p.ell(21.5 + sw2 * 0.8, 19.5 + b, 2.8, 3, S);
        p.ell(23.5 + sw2 * 1.2, 15 + b, 2.4, 2.4, Q); p.px(23 + sw2 * 1.2, 14 + b, '#ffffff');
        return;
      }
      // goggle markings
      p.ell(12.6, 12 + b, 2.8, 2.5, [G, G], true); p.ell(19.4, 12 + b, 2.8, 2.5, [G, G], true);
      p.rect(15, 11.5 + b, 2, 1, G);
      if (p.blink) { p.happyEye(11, 12 + b, '#bff8ff'); p.happyEye(18, 12 + b, '#bff8ff'); }
      else { p.eye(11.6, 10.8 + b, true, '#0e1a20'); p.eye(18.4, 10.8 + b, true, '#0e1a20'); }
      p.ell(16, 15.3 + b, 3.2, 1.8, C);
      p.rect(15.3, 14.4 + b, 1.4, 1, '#1a1020');
      p.px(15, 16.3 + b, '#6a5050'); p.px(17, 16.3 + b, '#6a5050');
      p.blush(10, 15 + b, '#f0a0a8'); p.blush(20, 15 + b, '#f0a0a8');
      // static sparks between the whiskers
      spark(8, 15 + b); spark(23, 16 + b); if (tk) { p.px(7, 17 + b, '#7ff0ff'); p.px(24, 14 + b, '#7ff0ff'); }
    },

    earth: function (p, f) { // Dugsworth the mole
      var B = ['#c09070', '#8a6044', '#664430', '#4a3020'], C = ['#ffd0d0', '#f0a8a8', '#d08080', '#a86060'];
      var BL = ['#d0a888', '#b08868', '#906850', '#705038'], R = ['#d0d0c8', '#a0a098', '#787870', '#585850'];
      var dig = (Math.sin(p.ph * 2) + 1) / 2, b = hop(p);
      if (p.side) {
        p.ell(25, 21 + b - dig, 2.4, 1.8, C);
        p.ell(17, 20 + b, 9.5, 7.5, B);
        p.ell(13, 23 + b, 5, 3.5, BL);
        p.ell(5.5, 19 + b, 2.6, 2.1, C);
        p.px(3, 19 + b, '#f0a8a8'); p.px(5, 17 + b, '#f0a8a8');
        p.rect(8, 13 + b, 4, 3, '#e0e8f0'); p.px(8, 13 + b, '#ffffff');
        if (!p.blink) p.rect(8.5, 14 + b, 2, 1, '#1a1020');
        p.px(12, 14 + b, '#3a2a20'); p.px(13, 14 + b, '#3a2a20');
        p.ell(10, 23 + b + dig - 1, 2.8, 2, C); p.px(7, 24 + b + dig - 1, '#fff0e0'); p.px(8, 25 + b + dig - 1, '#fff0e0');
        legsSide(p, [[13, 0, 0], [20, 1, 0]], 26 + b, 28, 3, B[3], B[3]);
        p.ell(16, 9.5 + b, 4, 2.2, R); p.px(15, 6.5 + b, '#6ab83a'); p.px(16, 5.5 + b, '#9be04a'); p.px(16, 6.5 + b, '#3a8a2a');
        return;
      }
      p.ell(16, 20 + b, 9, 7.5, B);
      p.ell(6, 22 + b - dig, 2.6, 2, C); p.ell(26, 22 + b + dig - 1, 2.6, 2, C);
      p.px(4, 23 + b - dig, '#fff0e0'); p.px(5, 24 + b - dig, '#fff0e0'); p.px(27, 23 + b + dig - 1, '#fff0e0'); p.px(28, 22 + b + dig - 1, '#fff0e0');
      if (p.back) { p.ell(16, 25.5 + b, 1.4, 1.2, C); p.px(12, 15 + b, B[0]); p.px(20, 18 + b, B[0]); }
      else {
        p.ell(16, 22 + b, 5, 4.5, BL);
        p.ell(16, 17 + b, 2.5, 2, C);
        p.px(16, 15 + b, '#f0a8a8'); p.px(13, 17 + b, '#f0a8a8'); p.px(19, 17 + b, '#f0a8a8');
        p.rect(10, 12 + b, 4, 3, '#e0e8f0'); p.rect(18, 12 + b, 4, 3, '#e0e8f0');
        if (!p.blink) { p.rect(11, 13 + b, 2, 1, '#1a1020'); p.rect(19, 13 + b, 2, 1, '#1a1020'); }
        p.px(10, 12 + b, '#ffffff'); p.px(18, 12 + b, '#ffffff');
        p.rect(14, 13 + b, 4, 1, '#3a2a20');
      }
      feet2(p, 12, 18, 26, 3, 2, B[3]);
      p.ell(16, 9 + b, 4, 2.2, R);
      p.px(15, 6 + b, '#6ab83a'); p.px(16, 5 + b, '#9be04a'); p.px(16, 6 + b, '#3a8a2a');
    },

    dark: function (p, f) { // Nyxlet the bat-cat
      var B = ['#7a5aa8', '#4a3478', '#30205a', '#1e143c'];
      var fl = Math.sin(p.ph * (p.mode === 'move' ? 4 : 2)) * 1.2;
      var eyes = function (x, y) {
        p.rect(x, y, 4, 3, '#ffe060'); p.rect(x + 1, y, 1, 3, '#120a1e');
        p.rect(x, y, 4, p.blink ? 2.5 : 1, B[2]); p.px(x + 3, y + 2, '#ffffff');
      };
      if (p.side) {
        p.tri(19, 27, 20 + fl, 26, 9 + fl, B[2], B[1]); // far wing
        p.rect(23, 26, 3, 1, B[2]); p.rect(25, 23, 1, 3, B[2]); p.rect(24, 22, 2, 1, B[2]);
        p.ell(17, 21, 6, 5.5, B);
        p.tri(15, 19, 9, 18, 2, B[2], B[3]);
        p.ell(12, 13, 6.5, 6, B);
        p.tri(9, 13, 9, 10, 2, B[1], '#c080d0');
        eyes(6, 12);
        p.px(5, 16, '#ff8ab0');
        p.px(6, 17.5, '#120a1e'); p.px(7, 18, '#120a1e'); p.px(8, 17.5, '#120a1e'); p.px(7, 19, '#ffffff');
        p.tri(14, 23, 22 + fl, 21, 11 + fl, B[2], B[1]); // near wing over the body
        p.rect(13, 26, 3, 2, B[3]); p.rect(18, 26, 3, 2, B[3]);
        return;
      }
      var wb = p.back ? 1 : 0;
      p.tri(1 - wb, 8, 20 + fl, 2 - wb, 10 + fl - wb, B[2], B[1]); p.tri(24, 31 + wb, 20 + fl, 30 + wb, 10 + fl - wb, B[2], B[1]);
      p.px(3, 21 + fl, B[2]); p.px(28, 21 + fl, B[2]);
      if (!p.back) { p.rect(23, 26, 3, 1, B[2]); p.rect(25, 23, 1, 3, B[2]); p.rect(24, 22, 2, 1, B[2]); }
      p.ell(16, 21, 6.5, 5.5, B);
      p.ell(16, 13, 7.5, 6, B);
      p.tri(9, 13, 10, 9, 3, B[1], p.back ? B[2] : '#c080d0'); p.tri(19, 23, 10, 23, 3, B[2], p.back ? B[3] : '#c080d0');
      if (p.back) {
        p.px(15, 9, '#e0d0ff'); p.px(16, 10, '#e0d0ff'); p.px(17, 9, '#e0d0ff');
        p.rect(16, 26, 1, 1, B[2]); p.rect(17, 24, 1, 2, B[2]); p.rect(16, 23, 2, 1, B[2]);
      } else {
        eyes(10, 12); eyes(18, 12);
        p.px(16, 16, '#ff8ab0');
        p.px(14, 17, '#120a1e'); p.px(15, 18, '#120a1e'); p.px(16, 17, '#120a1e'); p.px(17, 18, '#120a1e'); p.px(18, 17, '#120a1e');
        p.px(15, 19, '#ffffff');
        p.px(15, 8, '#e0d0ff'); p.px(16, 9, '#e0d0ff'); p.px(17, 8, '#e0d0ff');
      }
      p.rect(11, 26, 3, 2, B[3]); p.rect(18, 26, 3, 2, B[3]);
    },

    light: function (p, f) { // Lumbleen the moth-lamb
      var F = ['#ffffff', '#fff8ec', '#f0e4cc', '#d8c8a8'], M = ['#fffbe0', '#ffe8a0', '#f0c870', '#d0a050'];
      var K = ['#fff0e0', '#e8c8b0', '#c8a088', '#a88068'], Eye = ['#ffffff', '#c0e0ff', '#80a8e0'];
      var fl = (Math.sin(p.ph * (p.mode === 'move' ? 4 : 2)) + 1) / 2, i;
      var puffs = [[11, 18], [16, 16], [21, 18], [10, 23], [16, 24], [22, 23], [16, 20]];
      if (p.side) {
        p.ell(21, 12 - fl, 4, 6 + fl, M); p.ell(21, 12 - fl, 1.6, 1.6, Eye, true);
        for (i = 0; i < puffs.length; i++) p.ell(puffs[i][0] + 2, puffs[i][1], 4.2, 3.8, F);
        p.ell(16, 9.5, 4, 2.2, F);
        p.ell(11, 13.5, 4.5, 4.3, K);
        p.ell(15, 14, 2, 1.3, K);
        if (p.blink) p.happyEye(8, 12); else p.eye(8.5, 12, false);
        p.px(7, 15.5, '#8a5a50'); p.px(8, 16, '#8a5a50');
        p.blush(10, 15);
        p.px(13, 6, '#a88068'); p.px(12, 5, '#a88068'); p.px(11, 4, (f & 1) ? '#ffffff' : '#fff3a0');
        p.ell(24, 14 - fl * 1.5, 3, 5 + fl, M); // near wing edge
        p.rect(13, 27, 2, 1, '#a88068'); p.rect(19, 27, 2, 1, '#a88068');
        return;
      }
      var wg = p.back ? 0.6 : 0;
      p.ell(5, 14 - fl, 4 + wg, 6 + fl + wg, M); p.ell(27, 14 - fl, 4 + wg, 6 + fl + wg, M);
      p.ell(5, 14 - fl, 1.6, 1.6, Eye, true); p.ell(27, 14 - fl, 1.6, 1.6, Eye, true);
      for (i = 0; i < puffs.length; i++) p.ell(puffs[i][0], puffs[i][1], 4.2, 3.8, F);
      p.ell(10, 13, 2, 1.3, K); p.ell(22, 13, 2, 1.3, K);
      if (p.back) { p.ell(16, 12, 5, 4.5, F); p.ell(16, 9, 4.5, 2.2, F); }
      else {
        p.ell(16, 13, 5, 4.5, K);
        p.ell(16, 9, 4.5, 2.2, F);
        if (p.blink) { p.happyEye(13, 12); p.happyEye(17, 12); } else { p.eye(13, 12, false); p.eye(18, 12, false); }
        p.px(16, 15, '#8a5a50'); p.px(15, 16, '#8a5a50'); p.px(17, 16, '#8a5a50');
        p.blush(12, 15); p.blush(19, 15);
      }
      p.px(14, 6, '#a88068'); p.px(13, 5, '#a88068'); p.px(18, 6, '#a88068'); p.px(19, 5, '#a88068');
      p.px(12, 4, (f & 1) ? '#ffffff' : '#fff3a0'); p.px(20, 4, (f & 1) ? '#fff3a0' : '#ffffff');
      p.rect(12, 27, 2, 1, '#a88068'); p.rect(19, 27, 2, 1, '#a88068');
    }
  };

  // ---------- evolution stages ----------
  // Stage 1 is the base body. Stages 2-5 add element structures in four layers around the same body:
  //   'behind' (glow, unoutlined) | 'back' (outlined, behind body) | 'front' (outlined, over body) | 'fx' (glow, over everything).
  var SS = [1, 1.1, 1.25, 1.4, 1.6], SM = 26, M1 = 2; // stage scale, extra logical margin for stages 2-5
  var STAGES = {
    hontori: [['Hontori', 'A small fire fox kit with a warm ember on its brow.'], ['Cindrel', 'Its tail now burns at the tip and its ruff has grown thick.'],
      ['Brandtail', 'A bold young fox that splits its flame into two tails.'], ['Pyrevane', 'Four blazing tails and gold-marked fur; embers circle where it walks.'],
      ['Solvaryn', 'A legendary fox whose five tails open like a crown of sunfire.']],
    water: [['Brookit', 'A round river otter that blows tiny bubbles.'], ['Plashet', 'A head fin and a broad paddle tail make it a quick swimmer.'],
      ['Tidewend', 'Ear fins and arm fins let it ride the strongest currents.'], ['Marivoss', 'Flowing whisker tendrils; rings of water turn around it.'],
      ['Thalavyr', 'A legendary otter crowned with a breaking wave, calm as deep water.']],
    wind: [['Hooligust', 'A fluffy owlet that rides small breezes.'], ['Breezlow', 'Long ear tufts and its first strong flight feathers.'],
      ['Galequill', 'Wide wings and a feathered crest that cut the wind.'], ['Cyclorne', 'Great wings; loose feathers spin around it in a gale.'],
      ['Aerovaunt', 'A legendary owl of the high sky, haloed by a ring of wind.']],
    grass: [['Bramblebun', 'A round hedgehog with a flower in its spines.'], ['Thistlet', 'Leaves sprout among its spines and it carries two blooms.'],
      ['Thornmantle', 'A mantle of leaf blades guards its back.'], ['Brackenward', 'Bark plates and blossoms; petals drift wherever it rests.'],
      ['Sylvanthos', 'A legendary forest warden with blooming branch antlers.']],
    electric: [['Zappity', 'A slate-teal storm ferret with a spark-plug tail.'], ['Voltwhisk', 'Static tufts on its ears and a brighter tail coil.'],
      ['Arcrunner', 'A jagged crest and a conductor collar hum with charge.'], ['Tempestoat', 'A storm-cloud mane; charged rings orbit its body.'],
      ['Fulgaryn', 'A legendary ferret crowned with lightning prongs and twin coils.']],
    earth: [['Dugsworth', 'A sleepy mole wearing a pebble with a sprout.'], ['Burrowby', 'A bigger stone cap and heavy digging claws.'],
      ['Quarrydel', 'Rock plates on its shoulders and an amber gem on its brow.'], ['Stonewarden', 'Amber crystals grow from its back; pebbles float around it.'],
      ['Orogrand', 'A legendary mountain mole with a crown of crystal spires.']],
    dark: [['Nyxlet', 'A tiny cat-bat with golden eyes that loves the dusk.'], ['Gloamkit', 'Its wings have grown wide enough to glide.'],
      ['Vesperclaw', 'Hooked wing claws and a crescent mark on its brow.'], ['Shadewyn', 'Star-flecked wings; shadow wisps trail behind it.'],
      ['Nocthrone', 'A legendary night spirit with a floating crescent crown.']],
    light: [['Lumbleen', 'A fleecy moth-lamb that glows like a candle.'], ['Glimmerwool', 'Bigger wings and soft glowing antennae.'],
      ['Lanternfleece', 'A second pair of wings with bright eye spots.'], ['Halomere', 'Ornate shining wings; motes of light drift around it.'],
      ['Seraphleen', 'A legendary moth-lamb with four radiant wings and a sun halo.']]
  };
  var stages = {};
  Object.keys(STAGES).forEach(function (k) { stages[k] = STAGES[k].map(function (a) { return { name: a[0], desc: a[1] }; }); });

  var EP = { // element palettes [hi, base, shade, dark]
    fire: [['#fff6c0', '#ffe08a', '#ffc050', '#f0a030'], ['#ffd070', '#f89a2c', '#e06a20', '#b84a18'], ['#ffc070', '#f07a26', '#c0501a', '#8a3010']],
    water: [['#f0fdff', '#bff0ff', '#8fdcff', '#5ab8f0'], ['#bff0ff', '#7fd0ff', '#4aa0e0', '#2a70b0'], ['#9ad0f0', '#4a90c8', '#2e6aa0', '#1c4878']],
    wind: [['#ffffff', '#f4f8ff', '#dce8f8', '#c0d0e8'], ['#e0f0ff', '#a8c4e8', '#7890c0', '#58689a'], ['#c8d8f0', '#8aa0d0', '#6070a8', '#46507e']],
    grass: [['#e8ffb0', '#bff070', '#8ad050', '#5aa030'], ['#bff070', '#6ab83a', '#3a8a2a', '#24601e'], ['#c8a070', '#9a7048', '#6e4c30', '#4a3020']],
    electric: [['#e8ffff', '#bff8ff', '#7ff0ff', '#3cc8e0'], ['#8fd4dc', '#4f9aac', '#36707f', '#244c58'], ['#5a7f8a', '#3a5a66', '#28424c', '#1a2e36']],
    earth: [['#fff4c8', '#ffd878', '#f0a840', '#c07828'], ['#d0d0c8', '#a0a098', '#787870', '#585850'], ['#c09070', '#8a6044', '#664430', '#4a3020']],
    dark: [['#f4e8ff', '#d0a8ff', '#a070f0', '#7040c0'], ['#7a5aa8', '#4a3478', '#30205a', '#1e143c'], ['#5a3a88', '#30205a', '#1e143c', '#120a24']],
    light: [['#ffffff', '#fffbe0', '#fff0a8', '#ffd870'], ['#fffbe0', '#ffe8a0', '#f0c870', '#d0a050'], ['#ffffff', '#fff8ec', '#f0e4cc', '#d8c8a8']]
  };
  var GC = { // glow colours for unoutlined fx: [core, mid, edge]
    hontori: ['#fff6c0', '#ffb040', '#e0601a'], water: ['#ffffff', '#9fe8ff', '#4aa8e8'], wind: ['#ffffff', '#dceeff', '#9fc0e8'],
    grass: ['#fff0f6', '#ff9ac0', '#9be04a'], electric: ['#ffffff', '#9ff6ff', '#3cc8e0'], earth: ['#fff6d0', '#ffd060', '#c08830'],
    dark: ['#f6eaff', '#c090ff', '#7040c0'], light: ['#ffffff', '#fff3b0', '#ffd060']
  };
  // tapered chain of shaded blobs: a tail, flame, fin, feather or crystal
  function plume(p, x0, y0, ang, len, r0, pals, bend, taper) {
    var n = Math.max(3, Math.round(len / 1.3)), ca = Math.cos(ang), sa = Math.sin(ang), i, t, r;
    taper = taper == null ? 0.72 : taper; bend = bend || 0;
    for (i = 0; i < n; i++) {
      t = i / (n - 1); r = Math.max(0.55, r0 * (1 - taper * t));
      // drop the darkest tone: on a chain of small circles it forms dark hair-like lines
      var pl = pals[Math.min(pals.length - 1, Math.floor(t * pals.length))];
      p.ell(x0 + ca * len * t - sa * bend * t * t, y0 + sa * len * t + ca * bend * t * t, r, r * 1.08,
        pl.length > 3 ? [pl[0], pl[1], pl[2]] : pl, r < 1.1);
    }
  }
  function sparkle(p, x, y, c0, c1, big) {
    p.px(x, y, c0);
    if (big) { p.px(x - 1, y, c1); p.px(x + 1, y, c1); p.px(x, y - 1, c1); p.px(x, y + 1, c1); }
  }
  // dotted ellipse ring; part: 0 all, 1 back half only, 2 front half only
  function ring(p, cx, cy, rx, ry, col, n, ph, part, gap) {
    for (var i = 0; i < n; i++) {
      var a = ph + i / n * 6.2832, s = Math.sin(a);
      if (part === 1 && s > 0 || part === 2 && s <= 0) continue;
      if (gap && (i % gap) === 0) continue;
      p.rect(cx + Math.cos(a) * rx - 0.5, cy + s * ry - 0.5, 1, 1, col);
    }
  }
  var RUNES = [[0, 1, 0, 1, 1, 1, 0, 1, 0], [1, 0, 1, 0, 1, 0, 1, 0, 1], [1, 1, 0, 0, 1, 0, 0, 1, 1], [0, 1, 1, 1, 0, 0, 0, 1, 1], [1, 1, 1, 0, 1, 0, 1, 0, 1], [0, 1, 0, 1, 0, 1, 1, 1, 1]];
  function rune(p, x, y, i, col) {
    var r = RUNES[i % RUNES.length], u = Math.max(0.5, Math.round(0.5 * p.k) / p.k);
    for (var j = 0; j < 9; j++) if (r[j]) p.rect(x + (j % 3) * u, y + Math.floor(j / 3) * u, u, u, col);
  }
  // orbiting items around (cx,cy); split into behind (back half) and fx (front half) layers
  function orbit(p, f, layer, n, cx, cy, rx, ry, fn, spd) {
    for (var i = 0; i < n; i++) {
      var a = (f / NF) * 6.2832 * (spd || 1) + i / n * 6.2832, s = Math.sin(a);
      if (layer === 'behind' && s <= 0 || layer === 'fx' && s > 0) fn(cx + Math.cos(a) * rx, cy + s * ry, i, s);
    }
  }
  // stage-5 runic circle on the ground and a soft sparkle shower
  function crownFx(p, f, key, layer, cy) {
    var G = GC[key], ph = f / NF * 6.2832;
    if (layer === 'behind') {
      ring(p, 16, 27.5, 15, 3.6, G[2], 40, ph * 0.25, 1, 5);
      for (var i = 0; i < 6; i++) { var a = ph * 0.25 + i / 6 * 6.2832; if (Math.sin(a) <= 0) rune(p, 15.3 + Math.cos(a) * 15, 26.8 + Math.sin(a) * 3.6, i, G[1]); }
    }
    if (layer === 'fx') {
      ring(p, 16, 27.5, 15, 3.6, G[2], 40, ph * 0.25, 2, 5);
      for (var j = 0; j < 6; j++) { var b = ph * 0.25 + j / 6 * 6.2832; if (Math.sin(b) > 0) rune(p, 15.3 + Math.cos(b) * 15, 26.8 + Math.sin(b) * 3.6, j, G[0]); }
      for (var q = 0; q < 4; q++) {
        var t = ((f / NF) + q / 4) % 1, x = 2 + hash(q * 5.3 + key.length) * 28;
        if (t < 0.85) sparkle(p, x, cy - 4 + 30 * (1 - t) - 10, t < 0.3 ? G[0] : G[1], G[2], t > 0.35 && t < 0.55);
      }
    }
  }

  var STG = {
    hontori: function (p, f, s, L) {
      var d = p.side ? 2 : p.back ? 1 : 0, b = hop(p), sit = p.mode === 'sit', hb = sit ? 0 : b, F = EP.fire, G = GC.hontori;
      var tp = [FOX.O, FOX.T1, FOX.T2, FOX.T3], sw = Math.sin(p.ph) * 1.2, i;
      var hx = d === 2 ? (sit ? 10 : 9.5) : d === 1 ? 16 : 14, hy = d === 2 ? (sit ? 12 : 14 + b) : 13 + hb;
      if (L === 'behind') {
        if (s >= 4) { var ga = 'rgba(255,170,60,'; } // glow handled by draw
        if (s === 5) { // sun disc behind the tail fan
          ring(p, d === 2 ? 25 : 16, d === 2 ? 9 : 9, 9.5, 9.5, G[1], 44, f / NF * 1.57, 0, 4);
          ring(p, d === 2 ? 25 : 16, d === 2 ? 9 : 9, 7.5, 7.5, G[2], 30, -f / NF * 1.57, 0, 3);
        }
        crownFx(p, f, 'hontori', L, hy); if (s < 5) {}
        if (s >= 4) orbit(p, f, L, 4, 16, 18, 14, 5, function (x, y) { sparkle(p, x, y, G[2], G[2]); });
        return;
      }
      if (L === 'back') {
        // extra tails fan out behind; count and length grow with the stage
        var len = 9 + s * 2.4, r0 = 3.4 + s * 0.35;
        var fan = s === 2 ? [] : s === 3 ? [-2.0] : s === 4 ? [-2.05, -2.6, -0.65] : [-1.57, -2.05, -2.6, -0.95, -0.4];
        var bx = d === 2 ? 24 : d === 1 ? 16 : 16, by = d === 2 ? 20 + b : 23 + b;
        if (d === 2) fan = fan.map(function (a, j) { return -0.3 - j * 0.32; });
        fan.forEach(function (a, j) { plume(p, bx + Math.cos(a) * 3, by, a, len * (j === 0 && s === 5 ? 1.15 : 1), r0, tp, Math.sin(p.ph - j) * 1.4); });
        // main tail gets a bigger flame plume underneath
        if (d === 0) plume(p, 23.5, 21 + b, -1.25, len + 2, r0 + 0.4, tp, sw);
        else if (d === 1) plume(p, 20, 24 + b, -1.05, len + 1, r0 + 0.3, tp, sw);
        else plume(p, 24, 19.5 + b, -1.35, len + 2, r0 + 0.3, tp, sw);
        return;
      }
      if (L === 'front') {
        // chest ruff
        if (d === 0 && !sit) { p.ell(14, 18.6 + hb, 4 + s * 0.4, 2.2, FOX.C); for (i = 0; i < 3; i++) p.tri(11 + i * 2.5, 13 + i * 2.5, 19 + hb, 12 + i * 2.5, 21.5 + hb, FOX.C[1]); }
        if (d === 2 && !sit) p.ell(12, 19 + b, 3.2, 3.4, FOX.C);
        // brow flame
        var bx2 = d === 2 ? hx - 1 : hx, by2 = d === 2 ? hy - 5.5 : 7.5 + hb;
        plume(p, bx2, by2, -1.57, 1.5 + s * 1.1, 1.1 + s * 0.3, [F[1], F[0], F[0]], Math.sin(p.ph * 2) * 0.6);
        if (s >= 3) { // flame-tipped ears
          var ears = d === 0 ? [[6.5, 3.5 + hb], [21.5, 3.5 + hb]] : d === 1 ? [[7.5, 3.5 + hb], [25.5, 3.5 + hb]] : [[hx + 1.5, hy - 10.5]];
          ears.forEach(function (e, j) { plume(p, e[0], e[1], -1.57 + (j ? 0.3 : -0.3), 2 + s * 0.6, 1.2, [F[1], F[0]], Math.sin(p.ph * 2 + j) * 0.5); });
        }
        if (s >= 4 && d !== 1) { // gold markings
          var gm = '#ffe070';
          if (d === 0) { p.px(8, 13 + hb, gm); p.px(7, 14 + hb, gm); p.px(20, 13 + hb, gm); p.px(21, 14 + hb, gm); p.rect(10, 25 + b, 3, 1, gm); p.rect(17, 25 + b, 3, 1, gm); }
          else { p.px(hx + 2, hy - 1, gm); p.px(hx + 3, hy, gm); p.rect(18, 19 + b, 3, 1, gm); p.rect(21, 20 + b, 2, 1, gm); }
        }
        if (s === 5) { // flame crown
          var cx = d === 2 ? hx - 0.5 : hx, cy = d === 2 ? hy - 6.5 : 6.5 + hb;
          [-0.7, 0, 0.7].forEach(function (o, j) { plume(p, cx + o * 4, cy + Math.abs(o) * 2, -1.57 + o * 0.5, 4 + (j === 1 ? 3 : 0), 1.3, [F[0], F[0], ['#ffffff', '#ffffff']], Math.sin(p.ph * 2 + j) * 0.5); });
        }
        return;
      }
      if (L === 'fx') {
        if (s >= 3) for (i = 0; i < s - 1; i++) { var t = ((f / NF) * 1.5 + i / (s - 1)) % 1; sparkle(p, 6 + hash(i * 9.1) * 22, 22 - t * 22, t < 0.4 ? G[0] : G[1], G[2], s >= 4 && t < 0.25); }
        if (s >= 4) orbit(p, f, L, 4, 16, 18, 14, 5, function (x, y) { sparkle(p, x, y, G[0], G[1], true); });
        crownFx(p, f, 'hontori', L, hy);
      }
    },

    water: function (p, f, s, L) {
      var d = p.side ? 2 : p.back ? 1 : 0, b = hop(p), W = EP.water, G = GC.water, i, sw = Math.sin(p.ph) * 1;
      var fin = [W[0], W[1], W[1], W[0]];
      var hx = d === 2 ? 11 : 15, hy = 12 + b;
      if (L === 'behind') {
        if (s >= 4) orbit(p, f, L, s === 5 ? 6 : 4, 15.5, 21, 13, 5, function (x, y) { p.rect(x - 1, y - 0.5, 2, 1, G[2]); });
        if (s >= 4) ring(p, 15.5, 21, 13, 5, G[2], 36, f / NF * 6.28, 1, 3);
        if (s === 5) ring(p, d === 2 ? 11 : 15, 2.5 + b, 8, 2.2, G[1], 30, f / NF * 3.14, 1);
        crownFx(p, f, 'water', L, hy);
        return;
      }
      if (L === 'back') {
        // paddle tail grows
        var tl = 3 + s * 1.6;
        if (d === 0) plume(p, 22, 25.5 + b, -0.1 + sw * 0.05, tl + 2, 2.4 + s * 0.3, [W[2], W[2], W[1]], -1.5 - sw, 0.2);
        else if (d === 2) plume(p, 23, 25 + b, 0.05, tl + 3, 2.3 + s * 0.3, [W[2], W[2], W[1]], -1.5 - sw, 0.2);
        else plume(p, 15, 26 + b, 1.57, 2 + s, 2.6 + s * 0.4, [W[2], W[1]], sw, 0.1);
        if (s >= 4 && d === 0) { plume(p, 27 + s, 24 + b, -0.9, 3 + s, 1.8, fin, sw); plume(p, 27 + s, 26 + b, 0.5, 2 + s, 1.6, fin, -sw); }
        if (s >= 3) { // arm fins and ear fins
          if (d === 2) { plume(p, 17, 19 + b, -0.25, 4 + s * 1.2, 2, fin, -1); plume(p, 14, 9 + b, -0.6, 2 + s, 1.6, fin, 0); }
          else { [-1, 1].forEach(function (k) {
            plume(p, 15 + k * 6, 20 + b, k > 0 ? 0.3 : 2.84, 3 + s * 1.2, 1.9, fin, k * 1.2);
            plume(p, 15 + k * 7, 8 + b, k > 0 ? -0.55 : -2.6, 2 + s * 0.9, 1.6, fin, -k * 0.6);
          }); }
        }
        if (s >= 4) { // long mantle fins from the shoulders
          var ml = s === 5 ? 15 : 10;
          if (d === 2) plume(p, 18, 17 + b, 0.2, ml, 2.2, [W[1], W[0], W[0]], 3 + sw);
          else [-1, 1].forEach(function (k) { plume(p, 15 + k * 5, 17 + b, k > 0 ? 0.45 : 2.69, ml, 2.2, [W[1], W[0], W[0]], k * (3 + sw)); });
        }
        return;
      }
      if (L === 'front') {
        // head fin crest
        var n = s >= 4 ? 3 : 1, cx = d === 2 ? hx + 1 : hx;
        for (i = 0; i < n; i++) { var o = n === 1 ? 0 : (i - 1); plume(p, cx + o * 2.5, 7.5 + b + Math.abs(o), -1.57 + o * 0.45 + (d === 2 ? 0.5 : 0), 2 + s * 0.9 - Math.abs(o), 1.5 + s * 0.15, fin, sw * 0.5); }
        if (s >= 4 && d === 0) { // whisker tendrils
          plume(p, 9.5, 15 + b, 2.6, 5 + s, 0.9, [W[0], W[0]], -2 - sw, 0.2); plume(p, 20.5, 15 + b, 0.54, 5 + s, 0.9, [W[0], W[0]], 2 + sw, 0.2);
        }
        if (s >= 4 && d === 2) plume(p, 5, 16 + b, 2.2, 5 + s, 0.9, [W[0], W[0]], -2 - sw, 0.2);
        if (s >= 3 && d !== 2) { p.px(12, 19 + b, W[0][1]); p.px(13, 18 + b, W[0][1]); p.px(18, 18 + b, W[0][1]); p.px(19, 19 + b, W[0][1]); }
        if (s === 5) { // wave crown
          var wx = d === 2 ? hx + 0.5 : hx;
          for (i = -2; i <= 2; i++) plume(p, wx + i * 2.6, 5 + b + Math.abs(i) * 0.9, -1.57 + i * 0.22, 4 - Math.abs(i) * 0.6, 1.2, [W[1], W[0], [ '#ffffff', '#ffffff']], i * 0.6 + Math.sin(p.ph + i) * 0.4);
        }
        return;
      }
      if (L === 'fx') {
        if (s >= 3) for (i = 0; i < s - 2; i++) { var t = ((f / NF) + i / (s - 2)) % 1, x = 5 + hash(i * 4.1 + 2) * 22; if (t < 0.7) { p.rect(x, 24 - t * 18, 1, 1, G[0]); if (t > 0.3) p.rect(x + 1, 24 - t * 18 - 1, 1, 1, G[1]); } }
        if (s >= 4) { ring(p, 15.5, 21, 13, 5, G[1], 36, f / NF * 6.28, 2, 3); orbit(p, f, L, s === 5 ? 6 : 4, 15.5, 21, 13, 5, function (x, y) { p.rect(x - 1, y - 0.5, 2, 1, G[0]); p.px(x - 1, y - 1.5, G[1]); }); }
        if (s === 5) ring(p, d === 2 ? 11 : 15, 2.5 + b, 8, 2.2, G[0], 30, f / NF * 3.14, 2);
        crownFx(p, f, 'water', L, hy);
      }
    },

    wind: function (p, f, s, L) {
      var d = p.side ? 2 : p.back ? 1 : 0, Wd = EP.wind, G = GC.wind, i, fl = Math.sin(p.ph * (p.mode === 'move' ? 4 : 2)) * 1.6 - 0.5;
      var feather = [Wd[1], Wd[1], Wd[0]], tipf = [Wd[2], Wd[1], Wd[0]];
      if (L === 'behind') {
        if (s >= 4) orbit(p, f, L, 4, 16, 15, 15, 7, function (x, y) { p.rect(x - 1, y, 2, 1, G[2]); p.px(x + 1, y - 1, G[2]); }, 1);
        if (s === 5) { ring(p, 16, 16, 17, 15, G[2], 56, f / NF * 6.28, 0, 7); }
        crownFx(p, f, 'wind', L, 8);
        return;
      }
      if (L === 'back') {
        if (s >= 3) { // spread wings: feathers fanning out from the shoulders
          var nf = s === 3 ? 3 : s === 4 ? 4 : 5, wl = 6 + s * 1.6;
          if (d === 2) for (i = 0; i < nf; i++) plume(p, 20, 15 + fl * 0.5, -0.9 + i * 0.32, wl - i * 0.6, 2.4, tipf, -1 + fl * 0.3, 0.55);
          else [-1, 1].forEach(function (k) {
            for (i = 0; i < nf; i++) { var a = -0.55 + i * 0.36 + fl * 0.06; plume(p, 16 + k * 7, 15 + fl * 0.5, k > 0 ? a : Math.PI - a, wl - i * 0.5, 2.4, tipf, k * (0.8 + i * 0.2), 0.55); }
          });
        }
        // tail feathers
        if (d !== 2) for (i = -1; i <= 1; i++) plume(p, 16 + i * 1.6, 24, 1.57 + i * 0.35, 2 + s, 1.6, feather, 0);
        else plume(p, 22, 23, 0.9, 2 + s, 1.6, feather, 0);
        return;
      }
      if (L === 'front') {
        // ear tufts lengthen into plumes
        var tl = 2 + s * 1.2;
        if (d === 2) { plume(p, 10, 8, -1.85, tl, 1.4, [Wd[1], Wd[0]], -0.5); plume(p, 18, 7, -1.3, tl, 1.4, [Wd[2], Wd[1]], 0.5); }
        else { plume(p, 7.5, 8, -2.0, tl, 1.5, [Wd[1], Wd[0]], -0.6); plume(p, 24.5, 8, -1.14, tl, 1.5, [Wd[1], Wd[0]], 0.6); }
        if (s >= 3) { var cx = d === 2 ? 13 : 16; for (i = -1; i <= 1; i++) plume(p, cx + i * 1.6, 8.5, -1.57 + i * 0.4, 3 + s * 0.8 - Math.abs(i), 1.2, [Wd[0], Wd[0], ['#ffffff', '#ffffff']], i * 0.5); }
        if (s >= 4 && d === 0) for (i = 0; i < 3; i++) { p.px(13 + i * 3, 23, Wd[2][1]); p.px(14 + i * 3, 24, Wd[2][1]); p.px(12 + i * 3, 24, Wd[2][1]); }
        if (s >= 4 && d === 1) for (i = 0; i < 3; i++) { p.px(12 + i * 4, 12, Wd[0][2]); p.px(13 + i * 4, 11, Wd[0][2]); p.px(14 + i * 4, 12, Wd[0][2]); }
        if (s === 5) { // sky crest
          var c2 = d === 2 ? 13 : 16;
          for (i = -2; i <= 2; i++) plume(p, c2 + i * 1.8, 7.5 + Math.abs(i) * 0.6, -1.57 + i * 0.3, 7 - Math.abs(i) * 1.5, 1.3, [Wd[1], Wd[0], ['#ffffff', '#ffffff']], i * 0.8 + Math.sin(p.ph + i) * 0.4);
        }
        return;
      }
      if (L === 'fx') {
        if (s >= 2) for (i = 0; i < s; i++) { var k2 = (f / NF) * 6.28 * 1.3 + i * 1.7; p.rect(16 + Math.cos(k2) * (12 + s), 17 + Math.sin(k2) * 6, 1, 1, i % 2 ? G[0] : G[1]); }
        if (s >= 4) orbit(p, f, L, 4, 16, 15, 15, 7, function (x, y) { p.rect(x - 1, y, 2, 1, G[0]); p.px(x + 1, y - 1, G[1]); p.px(x - 2, y + 1, G[2]); }, 1);
        if (s === 5) ring(p, 16, 16, 17, 15, G[1], 56, f / NF * 6.28, 2, 7);
        crownFx(p, f, 'wind', L, 8);
      }
    },

    grass: function (p, f, s, L) {
      var d = p.side ? 2 : p.back ? 1 : 0, b = hop(p), Gr = EP.grass, G = GC.grass, i, sw = Math.sin(p.ph) * 0.8;
      var leaf = [Gr[1], Gr[0]], bark = [Gr[2], Gr[2]], cx = d === 2 ? 18 : 16;
      function flower(fx, fy, big) {
        var pc = big ? '#ffb8d4' : '#ff9ac0';
        p.ell(fx, fy - 1.2, 1.1, 1.1, [pc, pc], true); p.ell(fx - 1.2, fy, 1.1, 1.1, [pc, pc], true); p.ell(fx + 1.2, fy, 1.1, 1.1, [pc, pc], true); p.ell(fx, fy + 1.2, 1.1, 1.1, [pc, pc], true);
        p.ell(fx, fy, 0.8, 0.8, ['#ffe04a', '#ffe04a'], true);
      }
      if (L === 'behind') {
        if (s >= 4) orbit(p, f, L, 5, 16, 18, 14, 6, function (x, y) { p.rect(x, y, 1, 1, G[1]); }, 0.8);
        crownFx(p, f, 'grass', L, 10);
        return;
      }
      if (L === 'back') {
        if (s >= 3) { // leaf-blade mantle
          var nb = s === 3 ? 5 : 7, bl = 4 + s * 1.3;
          for (i = 0; i < nb; i++) { var a = -2.7 + i * (2.2 / (nb - 1)) + (d === 2 ? 0.25 : 0); plume(p, cx + Math.cos(a) * 7, 19 + b + Math.sin(a) * 6, a, bl, 2, [Gr[1], Gr[1], Gr[0]], Math.sin(p.ph + i) * 0.6); }
        }
        if (s === 5) { // branch antlers
          var ax = d === 2 ? [[16, 1]] : [[11, -1], [21, 1]];
          ax.forEach(function (A) {
            var k = A[1], x0 = A[0], y0 = 11 + b;
            plume(p, x0, y0, k > 0 ? -1.15 : -1.99, 10, 1.4, [bark, bark], k * -1, 0.3);
            plume(p, x0 + k * 3, y0 - 5, k > 0 ? -0.5 : -2.64, 4, 1, [bark], 0, 0.3);
          });
        }
        return;
      }
      if (L === 'front') {
        // leaf sprigs among the spines
        var nl = s === 2 ? 3 : 4;
        for (i = 0; i < nl; i++) { var a2 = -2.5 + i * (1.8 / (nl - 1)); plume(p, cx + Math.cos(a2) * 8.5, 19 + b + Math.sin(a2) * 8, a2, 2 + s * 0.4, 1.1, leaf, 0.4); }
        if (s >= 4) { // bark plates
          if (d === 0) { p.ell(7.5, 18 + b, 2.6, 2.2, Gr[2]); p.ell(24.5, 18 + b, 2.6, 2.2, Gr[2]); p.px(7, 17 + b, Gr[2][0]); p.px(24, 17 + b, Gr[2][0]); }
          else if (d === 1) for (i = 0; i < 3; i++) { p.ell(11 + i * 5, 17 + b + (i % 2), 2.4, 2, Gr[2]); p.px(10.5 + i * 5, 16 + b + (i % 2), Gr[2][0]); }
          else { p.ell(19, 16 + b, 2.6, 2.2, Gr[2]); p.ell(24, 19 + b, 2.4, 2, Gr[2]); }
        }
        if (s >= 4 && d === 0) { p.px(9, 21 + b, Gr[1][1]); p.px(8, 22 + b, Gr[1][1]); p.px(23, 21 + b, Gr[1][1]); p.px(24, 22 + b, Gr[1][1]); }
        // flowers: one more per stage
        var fp = d === 2 ? [[19, 9], [23, 11], [14, 10], [26, 15]] : [[17, 9], [12, 10.5], [22, 11], [8, 14], [25, 15]];
        for (i = 0; i < Math.min(fp.length, s - (s === 5 ? 1 : 0)); i++) flower(fp[i][0], fp[i][1] + b, i === 0 && s >= 3);
        if (s === 5) { // blossoms on the antler tips
          (d === 2 ? [[13, 1 + b], [20, -3 + b]] : [[7, 1 + b], [25, 1 + b], [9, -4 + b], [23, -4 + b]]).forEach(function (q) { flower(q[0], q[1], true); });
        }
        return;
      }
      if (L === 'fx') {
        if (s >= 3) for (i = 0; i < s - 1; i++) { var t = ((f / NF) * 0.8 + i / (s - 1)) % 1, x = 4 + hash(i * 6.7 + 1) * 24 + Math.sin(t * 9 + i) * 2; if (t < 0.9) { p.px(x, 2 + t * 26, G[1]); if (i % 2) p.px(x + 1, 2 + t * 26, G[0]); } }
        if (s >= 4) orbit(p, f, L, 5, 16, 18, 14, 6, function (x, y, j) { p.rect(x, y, 1, 1, j % 2 ? G[1] : G[2]); p.px(x + 1, y - 1, G[0]); }, 0.8);
        crownFx(p, f, 'grass', L, 10);
      }
    },

    electric: function (p, f, s, L) {
      var d = p.side ? 2 : p.back ? 1 : 0, b = hop(p), E = EP.electric, G = GC.electric, i, sw = Math.sin(p.ph) * 0.8, Q = E[0];
      var hx = d === 2 ? 8 : 16, hy = d === 2 ? 15.5 + b : 12.5 + b;
      function bolt(x, y, h, dx, col, col2) { // stepped zigzag prong pointing up
        for (var j = 0; j < h; j++) { var o = ((j >> 1) & 1) ? dx : 0; p.rect(x + o, y - j, 1.6, 1, j < 2 && col2 ? col2 : col); }
      }
      if (L === 'behind') {
        if (s >= 4) { ring(p, 16, 20, 14, 4.5, G[2], 40, f / NF * 6.28, 1, 6); orbit(p, f, L, 3, 16, 20, 14, 4.5, function (x, y) { p.rect(x - 0.5, y - 0.5, 1.5, 1.5, G[2]); }, 1.5); }
        if (s === 5) { ring(p, hx, hy - 9, 7, 2, G[2], 26, -f / NF * 6.28, 1); }
        crownFx(p, f, 'electric', L, hy);
        return;
      }
      if (L === 'back') {
        // second (and third) tail coil
        if (s >= 2) {
          var tl = 4 + s * 1.5;
          if (d === 0) { plume(p, 22, 19 + b, -1.1, tl, 2.6, [E[1], E[1], E[0]], 1 + sw, 0.2); p.ell(22 + Math.cos(-1.1) * tl + 1, 19 + b + Math.sin(-1.1) * tl, 2 + s * 0.3, 2 + s * 0.3, Q); }
          else if (d === 1) { plume(p, 21, 18 + b, -1.0, tl, 2.6, [E[1], E[1]], 1 + sw, 0.2); p.ell(21 + Math.cos(-1) * tl + 1, 18 + b + Math.sin(-1) * tl, 2 + s * 0.3, 2 + s * 0.3, Q); }
          else { plume(p, 27, 15 + b, -1.3, tl, 2.4, [E[1], E[1]], 1 + sw, 0.2); p.ell(27.5 + Math.cos(-1.3) * tl + 1, 15 + b + Math.sin(-1.3) * tl, 2 + s * 0.3, 2 + s * 0.3, Q); }
        }
        if (s === 5) { // twin coil on the other side
          if (d === 0) { plume(p, 10, 22 + b, -2.0, 9, 2.4, [E[1], E[1]], -1 - sw, 0.2); p.ell(5.5, 13 + b, 2.6, 2.6, Q); }
          else if (d === 1) { plume(p, 12, 22 + b, -2.1, 9, 2.4, [E[1], E[1]], -1 - sw, 0.2); p.ell(7.5, 13.5 + b, 2.6, 2.6, Q); }
        }
        if (s >= 4) { // storm-cloud mane
          var mc = [E[2][0], E[2][1], E[2][2], E[2][3]];
          if (d === 2) { p.ell(13, 17 + b, 3.4, 3, mc); p.ell(15.5, 15 + b, 2.8, 2.6, mc); p.ell(12, 13 + b, 2.6, 2.4, mc); }
          else [-1, 1].forEach(function (k) { p.ell(16 + k * 6.5, 15.5 + b, 3, 2.8, mc); p.ell(16 + k * 8, 12 + b, 2.4, 2.2, mc); p.ell(16 + k * 4, 18 + b, 3, 2.4, mc); });
        }
        return;
      }
      if (L === 'front') {
        // static ear tufts
        var ears = d === 2 ? [[9.5, 10 + b]] : [[10.5, 6 + b], [21.5, 6 + b]];
        ears.forEach(function (e, j) { bolt(e[0] - 0.8, e[1], 1 + s, j ? 1 : -1, E[1][1], Q[1]); });
        if (s >= 3) { // jagged crest
          var cx = d === 2 ? hx + 1 : hx, ch = 2 + s;
          bolt(cx - 0.8, hy - 4.5, ch + 1, 1, E[1][2], Q[1]);
          if (s >= 4) { bolt(cx - 3.2, hy - 4, ch - 1, -1, E[1][2], Q[1]); bolt(cx + 1.6, hy - 4, ch - 1, 1, E[1][2], Q[1]); }
        }
        if (s >= 3 && d !== 2) { p.rect(11.5, 17 + b, 9, 1.4, '#1d3640'); for (i = 0; i < 3; i++) p.rect(13 + i * 2.5, 17.2 + b, 1, 1, Q[2]); }
        if (s >= 3 && d === 2) { p.rect(9, 18.5 + b, 1.4, 4, '#1d3640'); p.rect(9.2, 19.5 + b, 1, 1, Q[2]); }
        if (s >= 4 && d !== 2) { p.px(14, 21 + b, Q[2]); p.px(15, 22 + b, Q[2]); p.px(14, 23 + b, Q[2]); p.px(18, 21 + b, Q[2]); p.px(17, 22 + b, Q[2]); p.px(18, 23 + b, Q[2]); }
        if (s >= 4 && d === 2) { p.px(16, 21 + b, Q[2]); p.px(17, 22 + b, Q[2]); p.px(18, 21 + b, Q[2]); p.px(21, 21 + b, Q[2]); p.px(22, 22 + b, Q[2]); }
        if (s === 5) { // lightning prong crown
          var c5 = d === 2 ? hx + 1 : hx;
          [-4.5, 0, 4.5].forEach(function (o, j) { bolt(c5 + o - 0.8, hy - 7 - (j === 1 ? 3 : 0), j === 1 ? 7 : 5, j === 0 ? -1 : 1, E[0][2], '#ffffff'); });
        }
        return;
      }
      if (L === 'fx') {
        var tk = f % 4 < 2;
        if (s >= 2 && tk) for (i = 0; i < s - 1; i++) { var x = 3 + hash(i * 3.3 + f) * 26, y = 6 + hash(i * 7.7 + f) * 20; p.px(x, y, G[0]); p.px(x + 1, y + 1, G[1]); p.px(x, y + 2, G[1]); }
        if (s >= 4) { ring(p, 16, 20, 14, 4.5, G[1], 40, f / NF * 6.28, 2, 6); orbit(p, f, L, 3, 16, 20, 14, 4.5, function (x, y) { p.rect(x - 0.5, y - 0.5, 1.5, 1.5, G[0]); }, 1.5); }
        if (s === 5) ring(p, hx, hy - 9, 7, 2, G[1], 26, -f / NF * 6.28, 2);
        crownFx(p, f, 'electric', L, hy);
      }
    },

    earth: function (p, f, s, L) {
      var d = p.side ? 2 : p.back ? 1 : 0, b = hop(p), Ea = EP.earth, G = GC.earth, i, Am = Ea[0], R = Ea[1];
      var cx = d === 2 ? 16 : 16, ry = d === 2 ? 9.5 : 9;
      function crystal(x, y, ang, len, w) { plume(p, x, y, ang, len, w, [Am, Am, [Am[0], Am[0]]], 0, 0.75); }
      if (L === 'behind') {
        if (s >= 4) orbit(p, f, L, s === 5 ? 5 : 4, 16, 18, 15, 5, function (x, y, j) { p.rect(x - 0.5, y - 0.5, 1.5, 1.5, j % 2 ? '#8a6a40' : G[2]); }, 0.6);
        crownFx(p, f, 'earth', L, 6);
        return;
      }
      if (L === 'back') {
        if (s >= 4) { // amber crystals rising from the back
          var cs = s === 4 ? [[-0.6, 6], [0.6, 6]] : [[-1, 7], [-0.45, 9], [0.45, 9], [1, 7]];
          if (d === 2) cs.forEach(function (c, j) { crystal(19 + j * 2.4, 15 + b + Math.abs(c[0]) * 2, -1.57 + 0.3 + c[0] * 0.3, c[1], 1.8); });
          else cs.forEach(function (c) { crystal(16 + c[0] * 8, 15 + b + Math.abs(c[0]) * 2, -1.57 + c[0] * 0.55, c[1], 1.9); });
        }
        return;
      }
      if (L === 'front') {
        // stone cap grows
        p.ell(cx, ry + b, 4 + s * 0.6, 2.2 + s * 0.25, R);
        p.px(cx - 1, ry - 1 + b, R[0]);
        if (s >= 2) { p.px(cx - 0.5, ry - 3 - s * 0.25 + b, '#6ab83a'); p.px(cx + 0.5, ry - 4 - s * 0.25 + b, '#9be04a'); p.px(cx - 1.5, ry - 4 - s * 0.25 + b, '#9be04a'); }
        // heavy claws
        if (d !== 2) { [[4, 23], [27, 23]].forEach(function (c, j) { for (i = 0; i < 3; i++) p.rect(c[0] + (j ? i * 0.4 : -i * 0.4) - 0.5, c[1] + b + i * 1 - 1, 1.5 + s * 0.2, 0.9, R[0]); }); }
        else for (i = 0; i < 3; i++) p.rect(6 - s * 0.2, 23 + b + i, 1.5 + s * 0.2, 0.9, R[0]);
        if (s >= 3) { // shoulder plates and amber gem
          if (d === 2) { p.ell(20, 15 + b, 3.6, 2.6, R); p.ell(23.5, 18 + b, 3, 2.2, R); }
          else { p.ell(7.5, 15.5 + b, 3.2, 2.6, R); p.ell(24.5, 15.5 + b, 3.2, 2.6, R); if (d === 1) { p.ell(16, 15 + b, 3.4, 2.4, R); p.ell(12, 18.5 + b, 2.6, 2, R); p.ell(20, 18.5 + b, 2.6, 2, R); } }
          if (d !== 1) p.ell(d === 2 ? cx - 3 : cx, ry + 0.5 + b, 1.3, 1.3, Am);
        }
        if (s >= 4 && d !== 1) { var gc = Am[1]; p.px(10, 21 + b, gc); p.px(11, 22 + b, gc); p.px(10, 23 + b, gc); p.px(22, 21 + b, gc); p.px(21, 22 + b, gc); p.px(22, 23 + b, gc); }
        if (s >= 4 && d === 1) { p.px(13, 21 + b, Am[1]); p.px(14, 22 + b, Am[1]); p.px(19, 21 + b, Am[1]); p.px(18, 22 + b, Am[1]); }
        if (s >= 4 && d !== 2) { crystal(6.5, 14 + b, -2.2, 3 + s * 0.5, 1.3); crystal(25.5, 14 + b, -0.94, 3 + s * 0.5, 1.3); }
        if (s === 5) { // crystal crown spires
          var cc = d === 2 ? cx - 1 : cx;
          [[-4, 4, -0.35], [-2, 6, -0.15], [0, 8, 0], [2, 6, 0.15], [4, 4, 0.35]].forEach(function (c) { crystal(cc + c[0], ry - 1.5 + b + Math.abs(c[0]) * 0.2, -1.57 + c[2], c[1], 1.4); });
        }
        return;
      }
      if (L === 'fx') {
        if (s >= 3) for (i = 0; i < s - 2; i++) { var t = ((f / NF) + i / (s - 2)) % 1; if (t < 0.6) p.px(6 + hash(i * 2.9) * 20, 28 - Math.sin(t / 0.6 * 3.14) * 4, '#b08a5a'); }
        if (s >= 4) orbit(p, f, L, s === 5 ? 5 : 4, 16, 18, 15, 5, function (x, y, j) { p.rect(x - 0.5, y - 0.5, 1.5, 1.5, j % 2 ? '#b08a5a' : G[1]); p.px(x - 0.5, y - 0.5, G[0]); }, 0.6);
        if (s >= 4 && f % 8 < 3) sparkle(p, 16 + (s === 5 ? 0 : 0), ry - 7 - (s === 5 ? 4 : 0) + b, '#ffffff', G[0], true);
        crownFx(p, f, 'earth', L, 6);
      }
    },

    dark: function (p, f, s, L) {
      var d = p.side ? 2 : p.back ? 1 : 0, D = EP.dark, G = GC.dark, i, fl = Math.sin(p.ph * (p.mode === 'move' ? 4 : 2)) * 1.2, B = D[1];
      if (L === 'behind') {
        if (s >= 4) orbit(p, f, L, 4, 16, 18, 15, 6, function (x, y) { p.rect(x - 0.5, y - 0.5, 1.5, 1.5, G[2]); }, 0.7);
        if (s === 5) ring(p, 16, 0.5, 6, 6, G[2], 30, f / NF * 3.14, 0, 5);
        crownFx(p, f, 'dark', L, 6);
        return;
      }
      if (L === 'back') {
        // wings grow: layered membranes with scalloped edges
        var ext = (s - 1) * 2.2, up = (s - 1) * 1.6;
        function wing(k, ox, extra) {
          var x0 = 16 + k * 8, tip = 16 + k * (14 + ext + extra), ty = 9 - up + fl - extra * 0.5;
          var lo = Math.min(x0, tip), hi = Math.max(x0, tip);
          p.tri(lo, hi, 20 + fl, tip, ty, B[2], B[1]);
          p.tri(Math.min(x0, x0 + k * (ext * 0.6 + 6)), Math.max(x0, x0 + k * (ext * 0.6 + 6)), 23 + fl, x0 + k * (ext * 0.5 + 5), 15 + fl - up * 0.5, B[2], B[1]);
          if (s >= 3) { p.rect(tip - 0.5, ty - 1, 1, 1.5, '#e0d0ff'); p.px(tip - k, ty - 1.5, '#e0d0ff'); }
          if (s >= 4) for (var j = 0; j < 3; j++) p.px(x0 + k * (3 + j * 2.5), 16 - j * 1.5 + fl - up * 0.4, '#d0b0ff');
        }
        if (d === 2) { var tip2 = 25 + ext * 0.8; p.tri(18, tip2 + 3, 20 + fl, tip2 + 2, 6 - up + fl, B[2], B[1]); if (s >= 3) p.rect(tip2 + 1.5, 5 - up + fl, 1, 1.5, '#e0d0ff'); }
        else { wing(-1, 0, 0); wing(1, 0, 0); if (s === 5) { wing(-1, 0, 4); wing(1, 0, 4); } }
        // tail grows longer with a pointed tuft
        if (d !== 2 && s >= 2) { plume(p, 22, 25, -0.7, 3 + s * 1.2, 1, [D[1], D[1]], -1, 0.2); var tx = 22 + Math.cos(-0.7) * (3 + s * 1.2), ty2 = 25 + Math.sin(-0.7) * (3 + s * 1.2) + 0.6; p.tri(tx - 1.5, tx + 1.5, ty2, tx + 0.5, ty2 - 3, B[1], D[0][2]); }
        return;
      }
      if (L === 'front') {
        if (d === 2) { // near wing over the body grows too
          if (s >= 2) p.tri(13, 24 + s, 22 + fl, 22 + s * 0.6, 10 - (s - 1) * 1.6 + fl, B[2], B[1]);
        }
        if (s >= 3) { // ear tufts
          var ears = d === 2 ? [[10, 2], [18, 2]] : [[9, 3], [23, 3]];
          ears.forEach(function (e, j) { plume(p, e[0], e[1] + 0.5, -1.57 + (j ? 0.5 : -0.5), 1.5 + s * 0.5, 0.9, [B, B], 0, 0.3); });
        }
        if (s >= 3 && d !== 1) { var mx = d === 2 ? 9 : 16; p.rect(mx - 1, 8, 1, 1, '#ffe060'); p.rect(mx, 7, 2, 1, '#ffe060'); p.rect(mx + 2, 8, 1, 1, '#ffe060'); }
        if (s >= 4 && d !== 2) { p.px(13, 22, '#d0b0ff'); p.px(19, 21, '#d0b0ff'); p.px(16, 24, '#e0d0ff'); }
        if (s >= 4 && d === 1) { p.px(14, 18, '#d0b0ff'); p.px(18, 20, '#d0b0ff'); }
        return;
      }
      if (L === 'fx') {
        if (s >= 3) for (i = 0; i < s - 1; i++) { var t = ((f / NF) * 0.7 + i / (s - 1)) % 1; if (t < 0.8) { var x = 4 + hash(i * 8.3) * 24; p.px(x, 26 - t * 22, G[1]); if (t < 0.3) p.px(x, 27 - t * 22, G[2]); } }
        if (s >= 4) orbit(p, f, L, 4, 16, 18, 15, 6, function (x, y) { sparkle(p, x, y, G[0], G[1], true); }, 0.7);
        if (s === 5) { // floating crescent crown
          var cy = -1 + Math.sin(p.ph) * 0.7, cx = d === 2 ? 12 : 16;
          for (var a = -2.4; a <= 2.4; a += 0.18) { var px = cx + Math.sin(a) * 5, py = cy - Math.cos(a) * 4.2; p.rect(px - 0.5, py, 1.2, 1.2, Math.abs(a) < 1 ? '#fff4c0' : '#ffe060'); }
          p.rect(cx - 0.5, cy - 7, 1, 1, '#ffffff'); sparkle(p, cx, cy - 7, '#ffffff', '#ffe060', f % 6 < 3);
          ring(p, 16, 0.5, 6, 6, G[1], 30, f / NF * 3.14, 2, 5);
        }
        crownFx(p, f, 'dark', L, 6);
      }
    },

    light: function (p, f, s, L) {
      var d = p.side ? 2 : p.back ? 1 : 0, Lt = EP.light, G = GC.light, i, fl = (Math.sin(p.ph * (p.mode === 'move' ? 4 : 2)) + 1) / 2;
      var M = Lt[1], Eye = ['#ffffff', '#c0e0ff', '#80a8e0'];
      if (L === 'behind') {
        if (s >= 4) orbit(p, f, L, 5, 16, 16, 15, 7, function (x, y) { p.px(x, y, G[2]); }, 0.6);
        if (s === 5) { ring(p, 16, 1.5, 7, 2.2, G[1], 34, f / NF * 3.14, 1); for (i = 0; i < 12; i++) { var a = i / 12 * 6.28 + f / NF * 0.8; p.rect(16 + Math.cos(a) * 12, 13 + Math.sin(a) * 12, 1, 1, G[2]); } }
        crownFx(p, f, 'light', L, 6);
        return;
      }
      if (L === 'back') {
        var wx = 4 + s * 1.1, wy = 7 + s * 0.9;
        if (d === 2) {
          p.ell(22, 11 - fl - s * 0.5, wx * 0.8, wy * 0.85 + fl, M); p.ell(22, 11 - fl - s * 0.5, 1.8, 1.8, Eye, true);
          if (s >= 3) { p.ell(22, 20 + fl * 0.5, wx * 0.6, wy * 0.5, M); }
        } else [-1, 1].forEach(function (k) {
          var x = 16 + k * (9 + s * 1.2), y = 12 - fl - s * 0.6;
          p.ell(x, y, wx, wy + fl, M);
          p.ell(x, y, 1.8 + s * 0.2, 1.8 + s * 0.2, Eye, true);
          if (s >= 4) ring(p, x, y, wx - 1.6, wy - 2, '#fff8d8', 22, 0, 0, 0);
          if (s >= 3) { var x2 = 16 + k * (8 + s), y2 = 21 + fl * 0.5; p.ell(x2, y2, wx * 0.7, wy * 0.5, M); p.ell(x2, y2 + 0.5, 1.2, 1.2, Eye, true); }
          if (s === 5) { p.ell(16 + k * 7, 4 - fl, 3.4, 5, [Lt[0][0], Lt[0][1], Lt[0][2], Lt[0][3]]); }
        });
        return;
      }
      if (L === 'front') {
        // fluffy antenna tips
        var at = d === 2 ? [[11, 4]] : [[12, 4], [20, 4]];
        at.forEach(function (q) { p.ell(q[0], q[1] - s * 0.4, 0.8 + s * 0.3, 0.8 + s * 0.3, s >= 4 ? Lt[0] : Lt[2]); });
        if (s >= 3) { // fleece collar
          if (d === 2) p.ell(14, 18, 3.5, 2.5, Lt[2]);
          else { for (i = 0; i < 5; i++) p.ell(10.5 + i * 2.75, 18 + (i % 2) * 0.6, 1.8, 1.6, Lt[2]); }
        }
        if (s >= 4 && d === 0) { p.px(16, 9, '#ffd060'); p.px(15, 10, '#ffe890'); p.px(17, 10, '#ffe890'); }
        if (s === 5) { // sun crown rays
          var cx = d === 2 ? 13 : 16;
          for (i = -2; i <= 2; i++) plume(p, cx + i * 2.2, 6.5 + Math.abs(i) * 0.6, -1.57 + i * 0.32, 4 - Math.abs(i) * 0.5, 1, [Lt[0], ['#ffffff', '#ffffff']], 0, 0.5);
        }
        return;
      }
      if (L === 'fx') {
        if (s >= 2) for (i = 0; i < s; i++) { var tw = (f + i * 3) % NF; if (tw < 4) sparkle(p, 3 + hash(i * 5.9 + 3) * 26, 2 + hash(i * 2.3) * 24, '#ffffff', G[1], tw === 1); }
        if (s >= 4) orbit(p, f, L, 5, 16, 16, 15, 7, function (x, y) { sparkle(p, x, y, '#ffffff', G[1], true); }, 0.6);
        if (s === 5) ring(p, 16, 1.5, 7, 2.2, '#ffffff', 34, f / NF * 3.14, 2);
        crownFx(p, f, 'light', L, 6);
      }
    }
  };
  // ---------- second wave: one more species per element ----------
  var NP = {
    frogG: ['#b8f0a0', '#5cc08a', '#3a9070', '#26685a'], frogC: ['#ffffff', '#f4fbe8', '#d8ecc8', '#b8d4a8'], lily: ['#bff070', '#6ab83a', '#3a8a2a', '#24601e'],
    salR: ['#ffb070', '#f06a3a', '#c8442a', '#8a2a1a'], salB: ['#fff0c0', '#ffd890', '#f0b060', '#d08840'], flame: ['#fff6c0', '#ffd060', '#ff9a2a'],
    sqS: ['#f0e8ff', '#c8b8f0', '#9a88d0', '#7060a8'], sqT: ['#ffffff', '#e8f4ff', '#b8d4f0', '#8ea8d8'], sqC: ['#fffaf0', '#fff0dc', '#ecd8c0', '#d0b89c'],
    tSh: ['#d8a878', '#a87650', '#7e5436', '#5a3a22'], tM: ['#c8f080', '#7ac048', '#4a9030', '#306820'], tK: ['#f4ecb8', '#dccc88', '#b4a260', '#8a7a40'],
    hY: ['#fff6c8', '#ffe08a', '#e8b850', '#c09030'], hC: ['#ffffff', '#fffaf0', '#f0e4cc', '#d8c8a8'], hP: ['#ffffff', '#effdff', '#c4f0fa', '#9ce0f0'],
    cS: ['#f0c098', '#d08a5c', '#a2603e', '#764228'], cT: ['#e8e4d8', '#b8b0a0', '#8a8272', '#646050'],
    rB: ['#7a7ab0', '#4a4a80', '#32325e', '#22223e'], rC: ['#c0c0ec', '#9a9ad0', '#7a7ab0', '#5a5a90'],
    ffH: ['#fff4e8', '#ffdcc0', '#f0b496', '#d08e74'], ffL: ['#ffffff', '#fff6a0', '#ffd850', '#f0b030'], ffW: ['#ffffff', '#f2faff', '#d4e8fa', '#b4cdea']
  };
  var DK = '#1a1020';
  function smile(p, x, y, col) { col = col || DK; p.px(x, y, col); p.rect(x + 1, y + 1, 3, 1, col); p.px(x + 4, y, col); }
  function eyes2(p, x1, x2, y, big) {
    if (p.blink) { p.happyEye(x1 - 0.5, y + 1); p.happyEye(x2 - 0.5, y + 1); } else { p.eye(x1, y, big); p.eye(x2, y, big); }
  }
  function eye1(p, x, y, big) { if (p.blink) p.happyEye(x - 0.5, y + 1); else p.eye(x, y, big); }
  function flyF(p) { return Math.sin(p.ph * (p.mode === 'move' ? 4 : 2)) * 1.4; }

  var DEF2 = {
    frog: function (p, f) { // Pondlet: a round pond frog wearing a lily pad
      var G = NP.frogG, C = NP.frogC, b = hop(p);
      function lily(x, y, w) { p.ell(x, y, w, 1.3, NP.lily); p.px(x + w - 1.5, y - 0.6, '#24601e'); p.px(x - 1, y - 1.2, '#ffb0d0'); p.px(x - 0.5, y - 1.8, '#ff8ab8'); }
      if (p.side) {
        p.ell(21, 23.5 + b, 4.6, 3.4, G);
        p.rect(18, 26.5, 7, 1.5, G[2]);
        p.ell(16, 21 + b, 7.5, 5.5, G);
        p.ell(12.5, 23 + b, 4, 3.6, C);
        p.ell(11, 16 + b, 6.5, 4.6, G);
        p.ell(12.5, 11.8 + b, 3, 3, G);
        eye1(p, 11, 10.3 + b, true);
        p.rect(5, 17.5 + b, 6, 1, '#123a2e'); p.px(10.5, 17 + b, '#123a2e');
        p.blush(8, 15 + b, '#ff9ab0');
        legsSide(p, [[10, 0, 0], [14, 1, 0]], 24 + b, 28, 2.4, G[2], G[3]);
        lily(15.5, 9 + b, 3.2);
        return;
      }
      p.ell(16, 21 + b, 8.5, 6, G);
      if (!p.back) p.ell(16, 22.5 + b, 5.6, 4.2, C);
      feet2(p, 8.5, 19.5, 26, 4, 2, G[2], G[1]);
      p.ell(16, 15.2 + b, 8.5, 5, G);
      p.ell(10.5, 11.5 + b, 3.2, 3.2, G); p.ell(21.5, 11.5 + b, 3.2, 3.2, G);
      if (p.back) {
        p.ell(12, 18 + b, 1.6, 1.2, [G[2], G[2]], true); p.ell(19.5, 20 + b, 1.8, 1.3, [G[2], G[2]], true); p.ell(15, 23.5 + b, 1.4, 1, [G[2], G[2]], true);
      } else {
        eyes2(p, 9.5, 20.5, 10 + b, true);
        smile(p, 13.5, 16.8 + b, '#123a2e');
        p.blush(7.5, 15.5 + b, '#ff9ab0'); p.blush(22.5, 15.5 + b, '#ff9ab0');
      }
      lily(16, 9.4 + b, 3.4);
    },

    salamander: function (p, f) { // Sizzlet: an ember salamander with frilly gills and a candle-flame tail
      var R = NP.salR, Bl = NP.salB, b = hop(p), sw = Math.sin(p.ph) * 0.8, fk = (f >> 1) & 1;
      function flame(x, y) { p.ell(x, y, 1.6, 2.2, NP.flame); p.ell(x, y + 0.6, 0.9, 1.2, ['#ffffff', '#fff6c0'], true); p.px(x - 0.3, y - 2.4 - fk * 0.5, '#ffd060'); }
      function frills(cx, y, side) { [-2.2, 0, 2.2].forEach(function (o, j) { p.ell(cx + side * (j === 1 ? 1 : 0), y + o, 1.7, 1.1, ['#ffd0a0', '#ff9a60', '#e07040']); }); }
      if (p.side) {
        p.ell(23 + sw * 0.2, 24.6 + b, 5, 1.8, R);
        flame(27.5, 21.8 + b);
        legsSide(p, [[19, 1, 1], [12, 0, 1]], 24 + b, 28, 2.2, R[2], R[3]);
        p.ell(16, 22.5 + b, 7, 4.3, R);
        p.ell(14, 24.6 + b, 4.5, 1.9, Bl);
        frills(12.5, 16.5 + b, 1);
        p.ell(9, 18 + b, 5.6, 4.6, R);
        p.px(16, 19.5 + b, '#ffe070'); p.px(19, 20.5 + b, '#ffe070'); p.px(10, 14.5 + b, '#ffe070');
        eye1(p, 6.5, 16.3 + b, true);
        p.rect(4, 20.5 + b, 3.5, 1, R[3]);
        p.blush(8, 19.5 + b, '#ff8a7a');
        legsSide(p, [[18, 0, 0], [11, 1, 0]], 24 + b, 28, 2.4, R[2], R[3]);
        return;
      }
      p.ell(23.5 + sw * 0.3, 25 + b, 4.6, 1.8, R);
      flame(27.6 + sw * 0.3, 22.6 + b);
      p.ell(9.5, 24.5 + b, 2.3, 2, R); p.ell(22.5, 24.5 + b, 2.3, 2, R);
      p.ell(16, 22 + b, 6.5, 5, R);
      if (!p.back) p.ell(16, 23.2 + b, 4, 3.4, Bl);
      feet2(p, 11, 18, 26, 3, 2, R[3], R[2]);
      frills(8.8, 14 + b, -1); frills(23.2, 14 + b, 1);
      p.ell(16, 15 + b, 7.5, 5.6, R);
      if (p.back) {
        p.px(12, 13 + b, '#ffe070'); p.px(19, 11.5 + b, '#ffe070'); p.px(16, 18 + b, '#ffe070'); p.px(13, 21 + b, '#ffe070'); p.px(19, 22 + b, '#ffe070');
      } else {
        p.px(12, 10.5 + b, '#ffe070'); p.px(19.5, 10 + b, '#ffe070'); p.px(16, 9.5 + b, '#ffe070');
        eyes2(p, 11.5, 18.5, 13 + b, true);
        smile(p, 13.5, 17 + b, R[3]);
        p.blush(9.5, 16 + b, '#ff8a7a'); p.blush(20.5, 16 + b, '#ff8a7a');
      }
    },

    squirrel: function (p, f) { // Flitbrush: a lilac squirrel whose huge tail flies like a kite
      var S2 = NP.sqS, T = NP.sqT, C = NP.sqC, b = hop(p), sw = Math.sin(p.ph) * 0.8;
      function tail(dx, flip) {
        var m = flip ? -1 : 1, cx = 16 + m * dx;
        p.ell(cx + m * 7, 20 + b, 4, 5, T);
        p.ell(cx + m * 9 + sw * 0.4, 13 + b, 4.6, 5, T);
        p.ell(cx + m * 7 + sw * 0.7, 7 + b, 3.4, 2.8, T);
        p.ell(cx + m * 9.4 + sw * 0.4, 13.5 + b, 2, 3, [T[0], T[0]], true);
        p.px(cx + m * 5 + sw, 4.4 + b, '#ffb0d0'); p.px(cx + m * 4 + sw, 3.6 + b, '#ff8ab8');
      }
      function ears(x1, x2, y) { [x1, x2].forEach(function (x) { p.tri(x - 1.5, x + 1.5, y, x, y - 4.5, S2[1], '#ffc8e0'); }); }
      if (p.side) {
        tail(1, false);
        legsSide(p, [[18, 1, 1], [12, 0, 1]], 24 + b, 28, 2.2, S2[2], S2[3]);
        p.ell(16, 22 + b, 5.6, 4.6, S2);
        p.ell(13.5, 23 + b, 3, 3.2, C);
        p.tri(11, 14, 11 + b, 13, 6 + b, S2[1], '#ffc8e0');
        p.ell(10.5, 15.5 + b, 5.6, 5, S2);
        p.ell(7, 17.2 + b, 3, 2, C);
        p.px(4.5, 16.5 + b, '#ff8aa8');
        eye1(p, 7.5, 13.5 + b, true);
        p.blush(10, 17.5 + b, '#ff9ab0');
        legsSide(p, [[17, 0, 0], [11, 1, 0]], 24 + b, 28, 2.4, S2[2], S2[3]);
        return;
      }
      if (!p.back) tail(0, false);
      p.ell(15, 22 + b, 5.6, 5, S2);
      if (!p.back) p.ell(15, 23 + b, 3.6, 3.6, C);
      feet2(p, 11, 16, 26, 3, 2, S2[3], S2[2]);
      ears(11, 19, 10 + b);
      p.ell(15, 14.5 + b, 6.6, 5.5, S2);
      if (p.back) tail(-1, true);
      else {
        p.ell(15, 17 + b, 3.2, 1.8, C);
        p.px(15, 16 + b, '#ff8aa8');
        eyes2(p, 11, 18, 12.5 + b, true);
        p.blush(9.5, 16 + b, '#ff9ab0'); p.blush(19.5, 16 + b, '#ff9ab0');
        p.rect(12.5, 22.5 + b, 1.5, 1, C[2]); p.rect(16.5, 22.5 + b, 1.5, 1, C[2]);
      }
    },

    tortoise: function (p, f) { // Mossplod: a slow tortoise with a mossy shell and a sprout
      var Sh = NP.tSh, M = NP.tM, K = NP.tK, b = hop(p) * 0.5;
      function top(cx, cy) {
        p.ell(cx, cy, 7.6, 4.4, M);
        p.px(cx - 4, cy + 1, M[0]); p.px(cx + 3, cy - 1.5, M[0]);
        p.rect(cx - 0.5, cy - 6, 1, 3, '#4a9030');
        p.ell(cx - 2, cy - 6, 1.8, 1, M, true); p.ell(cx + 1.5, cy - 6.8, 1.8, 1, NP.lily, true);
        p.ell(cx + 4.5, cy - 2.2, 1.9, 1.3, ['#ffc0b0', '#f07060', '#c84a40']); p.px(cx + 4, cy - 3, '#ffffff');
      }
      if (p.side) {
        legsSide(p, [[20, 1, 1], [11, 0, 1]], 24 + b, 28, 3, K[2], K[3]);
        p.rect(7, 19.5 + b, 3.5, 3, K[1]);
        p.ell(6.5, 20.5 + b, 3.6, 3, K);
        eye1(p, 4.5, 19.3 + b, false);
        p.px(3.5, 22 + b, K[3]);
        p.blush(6.5, 21.8 + b, '#ff9ab0');
        p.ell(17, 19.5 + b, 9, 6.8, Sh);
        p.ell(17, 24 + b, 9, 1.8, K);
        top(17, 15.5 + b);
        legsSide(p, [[19, 0, 0], [10, 1, 0]], 24 + b, 28, 3, K[2], K[3]);
        return;
      }
      feet2(p, 7, 21.5, 24.5, 3.5, 3.5, K[2], K[1]);
      p.ell(16, 19.5 + b, 10, 7, Sh);
      p.ell(16, 24 + b, 9.4, 2, K);
      top(16, 15.5 + b);
      if (p.back) p.ell(16, 26.5 + b, 1.6, 1, K);
      else {
        p.ell(16, 22.5 + b, 4.6, 3.8, K);
        eyes2(p, 13, 18, 21 + b, false);
        p.px(15.5, 24 + b, K[3]); p.px(16.5, 24 + b, K[3]);
        p.blush(12, 23 + b, '#ff9ab0'); p.blush(19, 23 + b, '#ff9ab0');
      }
    },

    hamster: function (p, f) { // Fizzpip: a round hamster crowned with a static-charged puff
      var Y = NP.hY, C = NP.hC, PF = NP.hP, b = hop(p), zap = (f >> 2) & 1;
      function puff(cx, cy) { p.ell(cx - 3, cy + 0.6, 2.6, 2, PF); p.ell(cx + 3, cy + 0.6, 2.6, 2, PF); p.ell(cx, cy - 1, 3.2, 2.4, PF);
        p.px(cx - 1, cy - 2, '#ffffff'); if (zap) { p.px(cx + 4.5, cy - 2, '#5ad8f0'); p.px(cx - 5, cy - 1.5, '#5ad8f0'); } }
      function cheek(x, y) { p.ell(x, y, 1.9, 1.5, ['#c8f8ff', '#5ad8f0', '#30b0d0'], true); p.px(x - 0.5, y - 0.5, '#ffffff'); }
      if (p.side) {
        p.ell(24.5, 24 + b, 1.6, 1.3, PF);
        legsSide(p, [[19, 1, 1], [12, 0, 1]], 25 + b, 28, 2.4, Y[3], Y[3]);
        p.ell(17, 12.5 + b, 2.3, 2.3, Y);
        p.ell(16, 20.5 + b, 8.4, 7, Y);
        p.ell(12, 22.5 + b, 4.2, 4.4, C);
        p.ell(8.5, 18.5 + b, 3, 2.2, Y);
        p.px(5.5, 18 + b, '#ff8aa8');
        eye1(p, 8.5, 14.8 + b, true);
        cheek(11, 19 + b);
        puff(15, 10.5 + b);
        legsSide(p, [[18, 0, 0], [11, 1, 0]], 25 + b, 28, 2.6, Y[3], Y[3]);
        return;
      }
      p.ell(9.5, 12.5 + b, 2.3, 2.3, Y); p.ell(22.5, 12.5 + b, 2.3, 2.3, Y);
      if (!p.back) { p.px(9.5, 12.5 + b, '#ffb0c0'); p.px(22, 12.5 + b, '#ffb0c0'); }
      p.ell(16, 20 + b, 9, 7.4, Y);
      if (p.back) {
        p.ell(16, 25 + b, 2, 1.6, PF);
        p.px(16, 15 + b, '#5ad8f0'); p.px(17, 16 + b, '#5ad8f0'); p.px(16, 17 + b, '#5ad8f0'); p.px(17, 18 + b, '#5ad8f0');
      } else {
        p.ell(16, 22.5 + b, 5.6, 4.8, C);
        eyes2(p, 11.5, 18.5, 15 + b, true);
        p.px(15.5, 18.2 + b, '#ff8aa8'); p.px(15, 19.2 + b, Y[3]); p.px(16, 19.2 + b, Y[3]);
        cheek(9.8, 19 + b); cheek(22.2, 19 + b);
        p.rect(13, 22.5 + b, 1.5, 1, C[3]); p.rect(17.5, 22.5 + b, 1.5, 1, C[3]);
      }
      feet2(p, 10, 18.5, 26, 3.5, 2, Y[3], Y[2]);
      puff(16, 11 + b);
    },

    crab: function (p, f) { // Pebbit: a pebble crab carrying smooth stones on its shell
      var Sh = NP.cS, St = NP.cT, b = hop(p) * 0.5, wv = Math.round(Math.sin(p.ph) * 2) / 2;
      function leg(x, y, dir, pair) { var u = lift(p, pair); p.rect(x, y - u, 1.6, 1.6, Sh[2]); p.rect(x + dir, y + 1.5 - u, 1.6, 1.6, Sh[2]); p.rect(x + dir * 1.6, y + 3 - u, 1.6, 1.4, Sh[3]); }
      function claw(x, y, m) { p.rect(x + (m > 0 ? -3 : 1), y + 2, 3, 1.6, Sh[2]); p.ell(x, y - 1, 3, 2.2, Sh); p.ell(x + m * 0.4, y + 2.4, 2.4, 1.5, Sh); }
      function stalk(x, y) { p.rect(x - 0.5, y, 1, 3.5, Sh[2]); p.ell(x, y - 0.4, 1.7, 1.7, ['#ffffff', '#ffffff'], true); if (p.blink) p.rect(x - 1, y - 0.5, 2, 0.6, DK); else p.rect(x - 0.6, y - 1, 1.2, 1.4, DK); }
      if (p.side) {
        for (var i = 0; i < 3; i++) { leg(19 + i * 1.6, 22 + i * 0.5, 1, i % 2); leg(11 - i * 1.6, 22 + i * 0.5, -1, (i + 1) % 2); }
        claw(9.5, 14.5 + wv * 0.5, -1);
        p.ell(16, 20.5 + b, 6.4, 5, Sh);
        p.ell(14, 15.8 + b, 2.6, 1.8, St); p.ell(18.5, 16.2 + b, 2, 1.5, St);
        stalk(11.5, 11.2 + b);
        p.px(10, 21 + b, DK); p.px(11, 21.6 + b, DK);
        p.blush(11.5, 19 + b, '#ff9a8a');
        claw(6, 17 + wv, -1);
        return;
      }
      for (var j = 0; j < 3; j++) { var lx = 9.4 - j * 1.8, ly = 22.6 + j * 0.4; leg(lx, ly, -1, j % 2); leg(30.4 - lx - 1.6, ly, 1, (j + 1) % 2); }
      claw(5.6, 15.5 + wv, -1); claw(26.4, 15.5 - wv, 1);
      p.ell(16, 20.5 + b, 8.4, 5.4, Sh);
      p.ell(12, 15.6 + b, 2.6, 1.8, St); p.ell(17.2, 14.8 + b, 3, 2, St); p.ell(21.2, 16.2 + b, 2, 1.5, St);
      stalk(12.5, 11 + b); stalk(19.5, 11 + b);
      if (!p.back) {
        smile(p, 13.5, 20.5 + b, Sh[3]);
        p.blush(9.5, 19.5 + b, '#ff9a8a'); p.blush(20.5, 19.5 + b, '#ff9a8a');
      } else { p.px(13, 22 + b, Sh[0]); p.px(18, 23 + b, Sh[0]); }
    },

    raven: function (p, f) { // Duskrook: a plump night raven with moon-ring eyes
      var B = NP.rB, C = NP.rC, fl = flyF(p), bk = ['#fff0a0', '#ffd060', '#e0a030'];
      function ring(x, y) { p.ell(x, y, 2.6, 2.5, ['#e8e0ff', '#c8c0f0', '#a8a0d8'], true); }
      if (p.side) {
        p.ell(22, 16 + fl * 0.5, 3.2, 5, B);
        p.ell(25, 23.5, 3.4, 1.6, B);
        p.ell(16.5, 18, 8, 8.5, B);
        p.ell(13, 21.5, 4, 4.8, C);
        p.tri(14, 18, 10, 16, 5, B[1]); p.tri(16, 19, 10, 19, 6.5, B[2]);
        ring(11, 14); eye1(p, 10, 13, true);
        p.rect(5.5, 14.8, 3.5, 1.5, bk[1]); p.rect(6.5, 16.3, 2, 0.8, bk[2]);
        p.ell(19.5, 19 + fl, 4, 6, B); p.px(19, 17 + fl, C[0]); p.px(20, 20 + fl, C[0]);
        p.rect(14, 26, 3, 1, bk[2]);
        return;
      }
      p.ell(6.5, 18 + fl, 3.2, 5.5, B); p.ell(25.5, 18 + fl, 3.2, 5.5, B);
      if (p.back) { p.rect(13.5, 24, 5, 3, B[2]); p.rect(14.5, 26.5, 3, 1, B[3]); }
      p.ell(16, 18, 8, 8.5, B);
      p.tri(13, 17, 10, 14.5, 4.5, B[1]); p.tri(16, 20, 10, 18.5, 6, B[2]);
      if (p.back) {
        p.px(13, 16, C[1]); p.px(19, 16, C[1]); p.px(16, 20, C[1]); p.px(15, 12, C[1]);
      } else {
        p.ell(16, 21.5, 5, 4.6, C);
        p.px(16, 21, '#ffffff'); p.px(15, 22, '#e8e0ff'); p.px(17, 22, '#e8e0ff'); p.px(16, 23, '#e8e0ff');
        ring(12, 14); ring(20, 14);
        eyes2(p, 11, 19, 12.8, true);
        p.rect(15, 16, 2, 1.5, bk[1]); p.rect(15.5, 17.5, 1, 0.8, bk[2]);
        p.blush(9, 17, '#c890d8'); p.blush(21, 17, '#c890d8');
      }
      p.rect(12.5, 26, 2, 1, bk[2]); p.rect(17.5, 26, 2, 1, bk[2]);
    },

    firefly: function (p, f) { // Wickbug: a round firefly with a lantern belly
      var Hd = NP.ffH, Ln = NP.ffL, W = NP.ffW, fl = flyF(p), buzz = (f & 1) ? 0.4 : 0;
      function ant(x, y, m) { p.px(x, y, Hd[3]); p.px(x + m, y - 1, Hd[3]); p.px(x + m, y - 2, Hd[3]); p.ell(x + m * 1.5, y - 3.2, 1.3, 1.3, Ln, true); }
      if (p.side) {
        p.ell(19, 10 + fl * 0.5, 3.4, 4.6, [W[1], W[2], W[3]]);
        p.ell(21, 21, 5.6, 4.6, Ln);
        p.rect(18, 17, 1, 8, '#e0b040'); p.rect(21, 16.6, 1, 8.8, '#e0b040');
        p.ell(13, 15, 6.6, 6, Hd);
        ant(11, 8.5, -1);
        eye1(p, 8.6, 13, true);
        p.blush(11, 17, '#ff9ab0');
        p.px(7, 18, Hd[3]); p.px(8, 18.5, Hd[3]);
        p.ell(16.5, 10.5 + fl + buzz, 4, 5, W); p.px(16, 9 + fl, '#ffffff');
        p.rect(12, 21, 1, 1.5, Hd[3]); p.rect(14.5, 21, 1, 1.5, Hd[3]);
        return;
      }
      var wy = p.back ? 0 : 0.5;
      p.ell(8, 12 + fl + wy, 4.2, 5, W); p.ell(24, 12 + fl + wy, 4.2, 5, W);
      p.px(7, 10 + fl, '#ffffff'); p.px(24, 10 + fl, '#ffffff');
      p.ell(16, 22.5, 5.6, 4.6, Ln);
      p.rect(11, 20, 10, 1, '#e0b040');
      ant(13, 7.5, -1); ant(19, 7.5, 1);
      p.ell(16, 14, 7, 6, Hd);
      if (p.back) { p.ell(16, 12.5, 4, 2.5, [Hd[1], Hd[1]], true); p.px(16, 9.5, Hd[0]); }
      else {
        eyes2(p, 11.5, 18.5, 12.5, true);
        smile(p, 13.5, 16.5, Hd[3]);
        p.blush(9.5, 16, '#ff9ab0'); p.blush(20.5, 16, '#ff9ab0');
      }
      p.rect(13.5, 26.8, 1, 1, Hd[3]); p.rect(17.5, 26.8, 1, 1, Hd[3]);
    }
  };

  // Stages for the second wave: a shared frame (glow rings, rising motes, stage-5 runic circle) plus each species' own growth.
  function gstg(grow) {
    return function (p, f, s, L) {
      var key = p.key, bk = BASEK[key], G = GC[bk], d = p.side ? 2 : p.back ? 1 : 0, i;
      if (L === 'behind') {
        if (s >= 4) orbit(p, f, L, s === 5 ? 5 : 3, 16, 19, 14, 5, function (x, y) { p.rect(x - 0.5, y - 0.5, 1, 1, G[2]); }, 0.6);
        if (s === 5) ring(p, 16, 19, 14, 5, G[2], 28, f / NF * 6.28, 1, 4);
        crownFx(p, f, bk, L, 6);
      }
      if (L === 'back' || L === 'front') grow(p, f, s, L, d, hop(p));
      if (L === 'fx') {
        if (s >= 3) for (i = 0; i < s - 2; i++) { var t = ((f / NF) + i / (s - 2)) % 1, x = 6 + hash(i * 5.7 + key.length) * 20; if (t < 0.75) p.px(x, 25 - t * 20, t < 0.35 ? G[0] : G[1]); }
        if (s >= 4) orbit(p, f, L, s === 5 ? 5 : 3, 16, 19, 14, 5, function (x, y) { sparkle(p, x, y, G[0], G[1], true); }, 0.6);
        if (s === 5) ring(p, 16, 19, 14, 5, G[1], 28, f / NF * 6.28, 2, 4);
        crownFx(p, f, bk, L, 6);
      }
    };
  }
  var STG2 = {
    frog: gstg(function (p, f, s, L, d, b) {
      var W = EP.water, Lf = NP.lily, sw = Math.sin(p.ph) * 0.8, hx = d === 2 ? 15.5 : 16;
      if (L === 'back') {
        if (s >= 3) [-1, 1].forEach(function (m) { if (d === 2 && m < 0) return; plume(p, hx + m * 6 + (d === 2 ? 4 : 0), 20 + b, -1.57 + m * 0.5, 5 + s * 1.4, 1.6, [Lf, Lf, W[1]], m * sw); });
        if (s >= 4) { p.ell(hx, 8.4 + b, 4.5 + s * 0.6, 1.6, Lf); }
        return;
      }
      // a lotus bud on the lily pad that opens with each stage
      var lx = hx - 1, ly = 8.2 + b, n = Math.min(5, s + 1);
      for (i = 0; i < n; i++) { var a = -1.57 + (i - (n - 1) / 2) * 0.5; plume(p, lx, ly, a, 1.4 + s * 0.5, 1.1, [['#fff0f6', '#ffc0d8', '#ff90b8']], 0, 0.3); }
      var i;
      p.px(lx, ly - 0.5, '#ffe070');
      if (s >= 3 && d === 0) { p.ell(16, 19.2 + b, 2.2, 1.4, ['#e0fff0', '#b0f0d0', '#80d0b0']); }
    }),
    salamander: gstg(function (p, f, s, L, d, b) {
      var F = EP.fire, tp = [F[2], F[1], F[0]], sw = Math.sin(p.ph) * 1;
      if (L === 'back') {
        // a flame crest runs down the back, more and taller each stage
        var n = s + 1, x0 = d === 2 ? 11 : 16;
        for (var i = 0; i < n; i++) {
          if (d === 2) plume(p, x0 + i * 2.2, 15 + i * 1.2 + b, -1.57 - 0.2, 2 + s * 0.8 - i * 0.3, 1.3, tp, sw * 0.5);
          else { var o = i - (n - 1) / 2; plume(p, x0 + o * 2.4, 10.5 + Math.abs(o) * 1.2 + b, -1.57 + o * 0.25, 2 + s * 0.8 - Math.abs(o) * 0.5, 1.3, tp, sw * 0.4); }
        }
        if (s >= 4) { var tx = d === 2 ? 27.5 : 27.6; plume(p, tx, 21 + b, -1.57, 3 + s, 1.8, tp, sw); }
        return;
      }
      if (s >= 3 && d !== 1) { var ex = d === 2 ? 9 : 16; p.rect(ex - 1, d === 2 ? 13.5 + b : 10 + b, 2, 1, '#fff6c0'); }
    }),
    squirrel: gstg(function (p, f, s, L, d, b) {
      var T = NP.sqT, Wd = EP.wind, sw = Math.sin(p.ph) * 1.2;
      if (L === 'back') {
        // kite ribbons stream from the tail tip; gliding membranes from stage 3
        var tx = d === 1 ? 7 : 23, m = d === 1 ? -1 : 1;
        for (var i = 0; i < Math.min(3, s - 1); i++) plume(p, tx, 5 + b, -1.57 - m * (0.6 + i * 0.4), 4 + s * 1.2, 1, [['#ffd0e8', '#ff9ac8'], Wd[0], ['#ffffff', '#ffffff']], m * (sw + i), 0.4);
        if (s >= 3) { if (d === 2) p.ell(19, 21 + b, 4 + s * 0.4, 3, Wd[1]); else { p.ell(8.5, 21 + b, 3 + s * 0.4, 3.2, Wd[1]); p.ell(21.5, 21 + b, 3 + s * 0.4, 3.2, Wd[1]); } }
        return;
      }
      if (s >= 2) { var ex = d === 2 ? [13] : [11, 19]; ex.forEach(function (x) { plume(p, x, 6 + b, -1.57, 1.5 + s * 0.6, 0.8, [T, T], 0, 0.3); }); }
    }),
    tortoise: gstg(function (p, f, s, L, d, b) {
      var Lf = NP.lily, M = NP.tM, Bk = EP.grass[2], cx = d === 2 ? 17 : 16;
      b *= 0.5;
      if (L === 'back') {
        if (s >= 3) { // a little tree grows from the shell
          plume(p, cx, 13 + b, -1.57, 3 + s, 1.3, [Bk, Bk], 0, 0.2);
          var ty = 13 - (3 + s) + b;
          p.ell(cx, ty - 1, 3 + s * 0.9, 2.4 + s * 0.4, Lf);
          if (s >= 4) { p.ell(cx - 3, ty + 0.5, 2.4, 1.8, M); p.ell(cx + 3, ty + 0.5, 2.4, 1.8, M); }
        }
        return;
      }
      if (s >= 2) { p.px(cx - 5, 18 + b, '#ffe070'); p.px(cx + 5, 19 + b, '#ffb0d0'); }
      if (s >= 4) { var ty2 = 13 - (3 + s) + b; [[-2, -1.5], [2.5, -0.5], [0, -3]].forEach(function (o) { p.px(cx + o[0], ty2 + o[1], '#ffc0d8'); p.px(cx + o[0] + 1, ty2 + o[1], '#ffe8f0'); }); }
      if (s >= 3 && d !== 1) { var ex = d === 2 ? 6 : 16; p.rect(ex - 1.5, d === 2 ? 16 + b : 17.6 + b, 3, 1.2, M[1]); }
    }),
    hamster: gstg(function (p, f, s, L, d, b) {
      var Pf = NP.hP, E = EP.electric, zap = (f >> 1) & 1;
      if (L === 'back') {
        // the static puff swells into a little storm cloud
        var cx = d === 2 ? 15 : 16, cy = 9 + b - s * 0.5;
        p.ell(cx - 4 - s * 0.4, cy + 1, 2.4 + s * 0.3, 2, Pf); p.ell(cx + 4 + s * 0.4, cy + 1, 2.4 + s * 0.3, 2, Pf); p.ell(cx, cy - 0.5, 3.4 + s * 0.4, 2.6 + s * 0.2, Pf);
        if (s >= 3) [-1, 1].forEach(function (m) { plume(p, cx + m * 7, 15 + b, m > 0 ? -0.6 : -2.54, 2 + s, 1, [E[0], E[0]], m * 0.8, 0.3); });
        return;
      }
      if (s >= 3) { var x = d === 2 ? 15 : 16, y = 9 + b - s * 0.5; p.px(x - 1, y + 2, '#fff6a0'); p.px(x, y + 3, '#ffd850'); p.px(x - 1, y + 4, '#ffd850'); }
      if (s >= 4 && zap) { p.px(4, 16 + b, E[0][2]); p.px(28, 15 + b, E[0][2]); }
    }),
    crab: gstg(function (p, f, s, L, d, b) {
      var E = EP.earth, Cr = E[0];
      b *= 0.5;
      if (L === 'back') {
        // amber crystals push up between the stones
        var n = s - 1, cx = d === 2 ? 16 : 16;
        for (var i = 0; i < n; i++) { var o = i - (n - 1) / 2, x = cx + o * 3.2, h = 3 + s * 0.9 - Math.abs(o) * 0.8; p.tri(x - 1.4, x + 1.4, 15.5 + b, x, 15.5 + b - h, Cr[2], Cr[1]); }
        return;
      }
      if (s >= 3 && d !== 2) { [5.6, 26.4].forEach(function (x, j) { p.tri(x - 1, x + 1, 13.2 + b, x + (j ? 0.5 : -0.5), 10.5 + b - s * 0.4, Cr[2], Cr[1]); }); }
      if (s >= 3 && d === 2) p.tri(5, 7, 15.2 + b, 6, 12 + b - s * 0.4, Cr[2], Cr[1]);
    }),
    raven: gstg(function (p, f, s, L, d, b) {
      var D = EP.dark, B = NP.rB, fl = flyF(p);
      if (L === 'back') {
        // wings widen and long night-tail feathers grow
        var ext = (s - 1) * 1.6;
        if (d === 2) p.ell(22 + ext * 0.4, 14 + fl * 0.5 - ext * 0.3, 3.4 + ext * 0.4, 5 + ext * 0.5, B);
        else [-1, 1].forEach(function (m) { p.ell(16 + m * (10 + ext * 0.6), 16 + fl - ext * 0.4, 3.2 + ext * 0.35, 5 + ext * 0.5, B); p.px(16 + m * (10 + ext), 13 + fl - ext, NP.rC[0]); });
        if (s >= 3) { var tx = d === 2 ? 26 : 16; for (var i = -1; i <= 1; i++) plume(p, tx + (d === 2 ? 0 : i * 1.8), 24, d === 2 ? 0.3 + i * 0.25 : 1.57 + i * 0.35, 2 + s, 1.2, [B, D[0]], 0, 0.3); }
        return;
      }
      if (s >= 3) { var cx = d === 2 ? 17 : 16.5; for (var j = 0; j < 3; j++) plume(p, cx + (j - 1) * 1.6, 7, -1.57 + (j - 1) * 0.4 + (d === 2 ? 0.5 : 0), 2 + s * 0.6, 0.9, [B, D[0]], 0, 0.3); }
      if (s >= 4 && d === 0) { p.px(16, 25, '#ffe060'); }
    }),
    firefly: gstg(function (p, f, s, L, d, b) {
      var Lt = EP.light, W = NP.ffW, fl = flyF(p);
      if (L === 'back') {
        // a second pair of wings, then long lantern streamers
        if (s >= 2) { if (d === 2) p.ell(20, 17 + fl * 0.6, 3.2 + s * 0.3, 4, [W[1], W[2], W[3]]); else { p.ell(7 - s * 0.4, 19 + fl * 0.6, 3.4 + s * 0.3, 3.8, W); p.ell(25 + s * 0.4, 19 + fl * 0.6, 3.4 + s * 0.3, 3.8, W); } }
        if (s >= 3) { if (d === 2) p.ell(20, 9 + fl, 4.4 + s * 0.3, 5.5, W); else { p.ell(7 - s * 0.3, 10 + fl, 4.6 + s * 0.3, 5.6, W); p.ell(25 + s * 0.3, 10 + fl, 4.6 + s * 0.3, 5.6, W); } }
        if (s >= 4 && d !== 2) [-1, 1].forEach(function (m) { plume(p, 16 + m * 3, 26, 1.57 - m * 0.5, 2 + s, 1, [Lt[1], Lt[0]], m * 1.2, 0.3); });
        return;
      }
      if (s >= 3 && d !== 2) { p.rect(12, 23.5, 8, 1, '#e0b040'); }
      if (s >= 4) { var ax = d === 2 ? [9] : [11.5, 20.5]; ax.forEach(function (x) { p.ell(x, 4, 1.6, 1.6, Lt[0], true); }); }
    })
  };
  Object.keys(DEF2).forEach(function (k) { DEF[k] = DEF2[k]; STG[k] = STG2[k]; });
  Object.assign(STAGES, {
    frog: [['Pondlet', 'A round pond frog that wears a lily pad as a hat.'], ['Lilyhop', 'A lotus bud opens on its lily pad.'],
      ['Reedcroak', 'Reed fronds rise behind it and its croak ripples the water.'], ['Lotusage', 'A wide lily cape; dewdrops circle it like small moons.'],
      ['Nenuvast', 'A legendary pond keeper crowned with a full lotus in bloom.']],
    salamander: [['Sizzlet', 'An ember salamander with frilly gills and a candle-flame tail.'], ['Kilnback', 'A row of small flames wakes along its back.'],
      ['Scorchwade', 'Its crest burns tall and a bright mark glows on its brow.'], ['Forgemantle', 'Its tail flame roars; embers turn around it.'],
      ['Pyrasalis', 'A legendary salamander with a crown of living fire.']],
    squirrel: [['Flitbrush', 'A lilac squirrel whose huge tail flies like a kite.'], ['Gusttuft', 'Wind tufts on its ears and a ribbon on its tail.'],
      ['Kitewhisk', 'Soft gliding folds let it sail from tree to tree.'], ['Skysail', 'Three ribbons stream from its tail in every breeze.'],
      ['Zephyrine', 'A legendary sky squirrel that rides the high winds.']],
    tortoise: [['Mossplod', 'A slow tortoise with a mossy shell and a sprout.'], ['Fernshell', 'Small flowers dot the moss on its shell.'],
      ['Grovedome', 'A young tree has taken root on its back.'], ['Canopith', 'The tree on its shell blossoms each spring.'],
      ['Elderwold', 'A legendary tortoise carrying a little forest.']],
    hamster: [['Fizzpip', 'A round hamster crowned with a static-charged puff.'], ['Crackleby', 'Its puff has grown into a fizzing cloud.'],
      ['Voltumble', 'Spark whiskers crackle and a bolt glows in its puff.'], ['Stormpaunch', 'A little storm cloud rides on its head.'],
      ['Thundermuff', 'A legendary hamster wrapped in a calm thundercloud.']],
    crab: [['Pebbit', 'A pebble crab carrying smooth stones on its shell.'], ['Cobbleclaw', 'An amber crystal pushes up between its stones.'],
      ['Gravelgrip', 'Crystals tip its claws and crown its shell.'], ['Cragmantle', 'Its shell is a small crystal ridge.'],
      ['Petravast', 'A legendary crab with a mountain of amber on its back.']],
    raven: [['Duskrook', 'A plump night raven with moon-ring eyes.'], ['Gloomquill', 'Its wings grow wide enough to ride the dusk.'],
      ['Umbracaw', 'A feather crest and long night-tail feathers.'], ['Nightvane', 'Great wings; shadow motes circle it.'],
      ['Noctregent', 'A legendary raven that keeps watch over the night.']],
    firefly: [['Wickbug', 'A round firefly with a warm lantern belly.'], ['Glowmere', 'A second pair of wings hums behind the first.'],
      ['Lanternip', 'Its lantern grows bright enough to light a path.'], ['Beaconwing', 'Glowing streamers and bright antenna lamps.'],
      ['Solsticara', 'A legendary firefly that glows like a small sun.']]
  });
  Object.keys(DEF2).forEach(function (k) { stages[k] = STAGES[k].map(function (a) { return { name: a[0], desc: a[1] }; }); });
  // richer colours as the line matures (applied to the outlined body only)
  function enrich(c, s) {
    if (s < 3) return;
    var g = c.getContext('2d'), id = g.getImageData(0, 0, c.width, c.height), dd = id.data, a = (s - 2) * 0.09, i, m;
    for (i = 0; i < dd.length; i += 4) {
      if (!dd[i + 3]) continue;
      m = (dd[i] + dd[i + 1] + dd[i + 2]) / 3;
      dd[i] = Math.max(0, Math.min(255, m + (dd[i] - m) * (1 + a)));
      dd[i + 1] = Math.max(0, Math.min(255, m + (dd[i + 1] - m) * (1 + a)));
      dd[i + 2] = Math.max(0, Math.min(255, m + (dd[i + 2] - m) * (1 + a)));
    }
    g.putImageData(id, 0, 0);
  }

  // pose: dir 0 front | 1 back | 2 side (drawn facing left), mode 'idle' | 'move' | 'sit'
  function frame(key, k, blink, f, dir, mode, st) {
    dir = dir || 0; mode = mode || 'idle'; st = st > 1 && STG[key] ? Math.min(5, st | 0) : 1;
    var sl = slot(key, k, blink, dir, mode, st), arr = sl.arr;
    if (arr[f]) return arr[f];
    var M = st > 1 ? SM : M1, n = Math.ceil((S + 2 * M) * k), c = mk(n, n), fly = !!FLY[key], ph = f / NF * 6.2832;
    var sn = function (v) { return Math.round(v * k) / k; };
    var body = st > 1 ? mk(n, n) : c, T = Math.round(M * k);
    function setup(cv) {
      var p = P(cv, k); if (T) p.g.translate(T, T);
      p.key = key; p.ph = ph; p.gp = ph * 2; p.blink = !!blink; p.fly = fly; p.dir = dir; p.mode = mode; p.stage = st;
      p.back = dir === 1; p.side = dir === 2; p.warp = mode !== 'move';
      p.u = fly ? 0 : sn(Math.sin(ph) * (mode === 'sit' ? 0.5 : 0.8));
      p.uh = fly ? sn(Math.sin(ph - 0.9) * 0.5) : sn(Math.sin(ph) * 0.8 + Math.sin(ph - 0.9) * 0.6);
      return p;
    }
    var pb = setup(body), pc = st > 1 ? setup(c) : pb;
    if (st > 1) { pc.warp = false; STG[key](pc, f, st, 'behind'); pc.warp = mode !== 'move'; STG[key](pb, f, st, 'back'); }
    DEF[key](pb, f);
    if (st > 1) STG[key](pb, f, st, 'front');
    outline(body, OUT[key] || '#1a1020', st > 1 ? Math.max(1, Math.round(k)) : 0, st > 1 ? c : null);
    if (st > 1) { // repaint outline-coloured pixels that sit between body pixels (interior hairlines)
      var oc = OUT[key] || '#1a1020', orr = parseInt(oc.slice(1, 3), 16), og = parseInt(oc.slice(3, 5), 16), ob = parseInt(oc.slice(5, 7), 16);
      var bg2 = body.getContext('2d'), bw = body.width, bh = body.height, bid = bg2.getImageData(0, 0, bw, bh), bd = bid.data;
      var isO = function (j) { return bd[j + 3] > 200 && bd[j] === orr && bd[j + 1] === og && bd[j + 2] === ob; };
      var solid = function (j) { return bd[j + 3] > 200 && !isO(j); };
      for (var pass2 = 0; pass2 < 2; pass2++) for (var yy2 = 1; yy2 < bh - 1; yy2++) for (var xx2 = 1; xx2 < bw - 1; xx2++) {
        var j0 = (yy2 * bw + xx2) * 4; if (!isO(j0)) continue;
        var L2 = j0 - 4, R2 = j0 + 4, U2 = j0 - bw * 4, D2 = j0 + bw * 4, A2 = -1, B2 = -1;
        if (solid(L2) && solid(R2)) { A2 = L2; B2 = R2; } else if (solid(U2) && solid(D2)) { A2 = U2; B2 = D2; }
        if (A2 < 0) continue;
        for (var ch = 0; ch < 3; ch++) bd[j0 + ch] = (bd[A2 + ch] + bd[B2 + ch]) >> 1;
      }
      bg2.putImageData(bid, 0, 0);
    }
    if (st > 1) { enrich(body, st); var cg = c.getContext('2d'); cg.save(); cg.setTransform(1, 0, 0, 1, 0, 0); cg.drawImage(body, 0, 0); cg.restore(); } // body and layers share the same margin offset
    pc.warp = false; aura(pc, key, f);
    if (st > 1) STG[key](pc, f, st, 'fx');
    if (DUALK[key]) recolor(c, DUALK[key]);
    if (!inPortrait && H.sheets && H.sheets.recording) H.sheets.rec('hontori', sl.keys[f], c);
    return (arr[f] = c);
  }
  function frames(key, dir, mode, stage) {
    if (!DEF[key]) key = 'hontori';
    var a = [], k = H.renderScale || 1; for (var f = 0; f < NF; f++) a.push(frame(key, k, false, f, dir === 3 ? 2 : dir, mode, stage)); return a;
  }

  var AURA = { hontori: '255,150,60', water: '90,180,255', wind: '200,230,255', grass: '140,220,90', electric: '110,230,250', earth: '190,150,100', dark: '150,90,230', light: '255,245,190' };
  list.forEach(function (s) { if (!AURA[s.key]) AURA[s.key] = AURA[BASEK[s.key]]; });
  var GLOW = { hontori: 0.22, light: 0.32, electric: 0.3, firefly: 0.34, hamster: 0.28, salamander: 0.22 };
  // soft pixel-stepped halo, cached once per spirit (kept deliberately faint)
  function glow(key) {
    if (gcache[key]) return gcache[key];
    var c = mk(64, 64), g = c.getContext('2d');
    for (var y = 0; y < 64; y += 2) for (var x = 0; x < 64; x += 2) {
      var u = (x - 31) / 30, v = (y - 33) / 25, d = Math.sqrt(u * u + v * v);
      var a = d < 0.4 ? 0.2 : d < 0.62 ? 0.15 : d < 0.8 ? 0.09 : d < 1 ? 0.04 : 0;
      if (a) { g.fillStyle = 'rgba(' + AURA[key] + ',' + a + ')'; g.fillRect(x, y, 2, 2); }
    }
    return (gcache[key] = c);
  }

  // opts: { scale, flip, alpha, noShadow, dir (0 front,1 back,2 left,3 right), moving, sit }
  function draw(ctx, key, x, y, env, opts) {
    opts = opts || {}; if (!DEF[key]) key = 'hontori';
    var t = (env && env.t) || 0, RS = H.renderScale || 1, sd = SEED[key];
    var sc0 = opts.scale || 1, a = opts.alpha == null ? 1 : opts.alpha;
    var st = Math.max(1, Math.min(5, opts.stage | 0 || 1)), sc = sc0 * SS[st - 1], B = S + 2 * (st > 1 ? SM : M1), yo = 12 * sc0 - 12 * sc;
    var k = rasterK(sc), SH = H.sheets;
    var dir = (opts.dir | 0) & 3, mode = opts.moving ? 'move' : opts.sit ? 'sit' : 'idle';
    var f = Math.floor((t + sd * 3) * (mode === 'move' ? 16 : 12)) % NF;
    var bt = (t + sd * 5) % (2.7 + sd * 2.1), blink = mode !== 'move' && (bt < 0.15 || (sd > 0.5 && bt > 0.32 && bt < 0.42));
    var hov = FLY[key] ? Math.round((Math.sin(t * 2.6 + sd * 6) * 2 - 2) * sc * RS) / RS : 0;
    // standing still, every hontori floats a little: a slow, soft rise and fall (spirits are light)
    if (!FLY[key] && mode === 'idle') hov = Math.round((Math.sin(t * 1.7 + sd * 6) * 1.2 - 1.4) * sc * RS) / RS;
    // side views are authored facing left: dir 3 mirrors; for front/back the legacy flip option still applies
    var flip = dir === 3 ? true : dir === 2 ? false : !!opts.flip;
    x = Math.round(x); y = Math.round(y);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = a;
    if (!opts.noShadow) { // ground shadow (shrinks while hovering)
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      var sw = Math.round((10 + hov) * sc);
      ctx.fillRect(Math.round(x - sw / 2), Math.round(y + 10 * sc0), sw, Math.max(1, Math.round(2 * sc0)));
      ctx.fillRect(Math.round(x - sw / 2 + 2), Math.round(y + 10 * sc0 - 1), sw - 4, Math.max(1, Math.round(4 * sc0)));
    }
    ctx.globalAlpha = a * (GLOW[key] || 0.3) * (0.85 + 0.15 * Math.sin(t * 2.4 + sd * 9));
    ctx.drawImage(glow(key), x - 16 * sc, y + hov + yo - 16 * sc, 32 * sc, 32 * sc);
    ctx.globalAlpha = a;
    ctx.translate(x, Math.round(y + hov + yo));
    if (flip) ctx.scale(-1, 1);
    /* the same picture, from a sheet when it is baked: same place, same size, inside the same alpha and mirror */
    qKey = key; qK = k; qBlink = blink; qF = f; qDir = dir === 3 ? 2 : dir; qMode = mode; qSt = st;
    if (SH) SH.draw(ctx, slot(key, k, blink, qDir, mode, STG[key] ? st : 1).keys[f], -B / 2 * sc, -B / 2 * sc, paintFrame, B * sc, B * sc);
    else ctx.drawImage(frame(key, k, blink, f, qDir, mode, st), -B / 2 * sc, -B / 2 * sc, B * sc, B * sc);
    if (EL2[key]) aura2(ctx, key, t + sd * 4, sc);
    ctx.restore();
  }

  function portrait(key, stage) {
    var st = Math.max(1, Math.min(5, stage | 0 || 1)), pk = key + '|' + st;
    if (pcache[pk]) return pcache[pk];
    var known = !!DEF[key];
    if (!known) key = 'hontori';
    var c = mk(96, 96), g = c.getContext('2d'), sk = 'spirits:portrait|' + key + '|' + st;
    /* a baked portrait is copied whole, one to one; anything else is painted as before */
    if (H.sheets && H.sheets.draw(g, sk, 0, 0, paintNone) === true) return (pcache[pk] = c);
    g.clearRect(0, 0, 96, 96);
    var col = AURA[key];
    // pixel-stepped radial backdrop
    for (var y = 0; y < 96; y += 2) for (var x = 0; x < 96; x += 2) {
      var dx = x - 47, dy = y - 49, d = Math.sqrt(dx * dx + dy * dy);
      if (d > 46) continue;
      var k = 1 - d / 46, a = 0.14 + Math.floor(k * 5) / 5 * 0.42;
      g.fillStyle = 'rgba(' + col + ',' + a.toFixed(3) + ')';
      g.fillRect(x, y, 2, 2);
    }
    inPortrait = true;
    try {
      if (st > 1) g.drawImage(frame(key, 2, false, 0, 0, 'idle', st), 0, 0, 96, 96); else g.drawImage(frame(key, 3, false, 0, 0, 'idle'), -M1 * 3, 4 - M1 * 3);
    } finally { inPortrait = false; }
    if (known && H.sheets && H.sheets.recording) H.sheets.rec('hontori', sk, c);
    return (pcache[pk] = c);
  }

  // ---------- two-element hontori: an existing body, recoloured, with a second-element aura drawn around it.
  // Stronger kinds: they live in the great schools and their wild places. [key, name, base body, element, element2, hue, sat, light, stage names...]
  var DUAL = [
    ['frostwhisk', 'Frostwhisk', 'squirrel', 'water', 'wind', 195, 0.55, 1.18, ['Frostwhisk', 'Rimetail', 'Sleetglide', 'Glacisail', 'Borealith'], 'An icy squirrel. Snow falls wherever its tail swings.'],
    ['mistsizzle', 'Mistsizzle', 'salamander', 'fire', 'water', 170, 0.45, 1.12, ['Mistsizzle', 'Steamgill', 'Vaporcrest', 'Geysmantle', 'Thermaveil'], 'A steam salamander, warm and wet at once.'],
    ['bogglet', 'Bogglet', 'frog', 'water', 'earth', 32, 0.55, 0.9, ['Bogglet', 'Mudcroak', 'Mirehop', 'Silttoad', 'Bogregent'], 'A mud frog that naps in warm puddles.'],
    ['thundercaw', 'Thundercaw', 'raven', 'dark', 'electric', 235, 0.75, 0.95, ['Thundercaw', 'Stormquill', 'Voltrook', 'Tempestwing', 'Fulgurex'], 'A storm raven. Sparks crackle in its feathers.'],
    ['magmite', 'Magmite', 'crab', 'earth', 'fire', 8, 0.85, 0.85, ['Magmite', 'Cindershell', 'Lavaclaw', 'Basaltrex', 'Calderion'], 'A crab of cooling lava. Its shell glows at the seams.'],
    ['sunsprout', 'Sunsprout', 'tortoise', 'grass', 'light', 58, 0.7, 1.15, ['Sunsprout', 'Dawnshell', 'Gleamgrove', 'Haloak', 'Solarwold'], 'A tortoise whose garden faces the sun.'],
    ['nightbramble', 'Nightbramble', 'grass', 'grass', 'dark', 285, 0.55, 0.8, ['Nightbramble', 'Duskthorn', 'Shadebriar', 'Gloomrose', 'Umbrathorn'], 'A thorny bun that blooms only at night.'],
    ['dunewhirl', 'Dunewhirl', 'wind', 'wind', 'earth', 40, 0.5, 1.05, ['Dunewhirl', 'Sandgale', 'Siroccowl', 'Dustvane', 'Desertempest'], 'An owl of sand and wind.'],
    ['prismite', 'Prismite', 'firefly', 'light', 'electric', 185, 0.8, 1.1, ['Prismite', 'Spectrabug', 'Arclantern', 'Rayvolt', 'Prismaron'], 'A firefly whose light splits into colours.'],
    ['cinderhawk', 'Cinderhawk', 'raven', 'fire', 'wind', 18, 0.85, 1.05, ['Cinderhawk', 'Ashwing', 'Blazevane', 'Pyregale', 'Infernix'], 'A hawk that rides hot winds.'],
    ['ripplezap', 'Ripplezap', 'hamster', 'electric', 'water', 205, 0.7, 1.05, ['Ripplezap', 'Tidecell', 'Surgepaw', 'Stormtide', 'Voltmaren'], 'A hamster that charges itself in the rain.'],
    ['duskmantle', 'Duskmantle', 'light', 'light', 'dark', 265, 0.4, 0.85, ['Duskmantle', 'Twiluma', 'Eclipsel', 'Penumbrae', 'Equinoxis'], 'Half dawn, half night. Rarely seen by anyone.']
  ];
  /* EL2: the second element of a kind (two-element kinds and the third wave), shown as a small aura */
  var DUALK = {}, EL2 = {};
  DUAL.forEach(function (d) {
    var key = d[0], base = d[2]; DUALK[key] = { base: base, el2: d[4], h: d[5], s: d[6], l: d[7] }; EL2[key] = d[4];
    list.push({ key: key, name: d[1], element: d[3], element2: d[4], dual: true });
    DEF[key] = DEF[base]; STG[key] = STG[base]; OUT[key] = OUT[base]; if (FLY[base]) FLY[key] = 1;
    BASEK[key] = BASEK[base]; SEED[key] = hash(list.length * 3.7 + 9.1); AURA[key] = AURA[ELK[d[3]]];
    stages[key] = d[8].map(function (n, i) { return { name: n, desc: i ? 'A grown ' + d[1] + '. ' + d[9] : d[9] }; });
  });
  /* ---------- third wave (chapter 3, the Whistling Pass): eight kinds with bodies of their own.
     They come after the two-element kinds in the list, so every earlier seed stays the same.
     A second element shows as the same small aura the two-element kinds have (EL2). */
  var NP3 = {
    kR: ['#ffc890', '#e08a4a', '#b8602e', '#86401e'], kS: ['#d8e4f8', '#98aad8', '#6a78b0', '#4a5486'], kC: ['#fffaf0', '#fff0d8', '#f0d4b0', '#d8b48c'], kB: ['#fff0a0', '#ffd060', '#e0a030'],
    pW: ['#ffffff', '#f8fafe', '#e9eef7', '#d2dae8'], pS: ['#fff6c8', '#ecdc96', '#c8b468', '#a08c48'],
    gF: ['#fffaf0', '#efe6d6', '#cdbfa6', '#a6957c'], gB: ['#d8a878', '#a87650', '#7e5436', '#5a3a22'], gH: ['#f4ecd4', '#d0bf94', '#a08e64', '#7a6a48'],
    hF: ['#e4dccf', '#b4a796', '#8a7d6d', '#62584d'], hC: ['#fffaf0', '#f4ece0', '#dccfbc', '#c0b09a'], hS: ['#eceae2', '#bdb7a8', '#8f897a', '#686456'],
    bF: ['#ffffff', '#f0f6fc', '#d2dfec', '#aec1d6'], bT: ['#e0f0ff', '#a8c4e8', '#7890c0', '#58689a'],
    sB: ['#e0f6ff', '#86ccf2', '#4f9cd4', '#2f6eaa'], sC: ['#ffffff', '#f2fbff', '#d4eef9', '#b0d8ec'], sF: ['#ffffff', '#e6f6ff', '#b4dcf4', '#88bce0'],
    vB: ['#b0a8d0', '#726aa0', '#50487c', '#363056'], vH: ['#fbf8ff', '#e4dcf4', '#bfb4dc', '#9a8ec0'], vY: ['#fffbe0', '#fff070', '#f0c840', '#c89a20'], vW: ['#d0c8ec', '#9288c0', '#6a6098', '#4a4272'], vE: ['#e8ffff', '#8ff2ff', '#3cc8e0'],
    mW: ['#d8eec4', '#98c48e', '#6a9a6a', '#4a724e'], mF: ['#b0a294', '#827262', '#5c5044', '#40362c'], mH: ['#eceae2', '#bdb7a8', '#8f897a', '#686456']
  };
  var PINK = '#ffb0b8';
  var DEF3 = {
    kestrip: function (p, f) { /* Kestrip: a small kestrel chick with a slate cap and cheek stripes */
      var R = NP3.kR, Sc = NP3.kS, C = NP3.kC, Bk = NP3.kB, fl = flyF(p);
      function spots(cx, cy) { p.px(cx - 2, cy - 1, R[2]); p.px(cx + 1.5, cy - 1.5, R[2]); p.px(cx - 0.5, cy + 1, R[2]); p.px(cx + 2, cy + 1.5, R[2]); }
      if (p.side) {
        plume(p, 21, 22, 0.5, 5, 2.4, [R, R, [R[2], R[3]]], 0, 0.1);
        p.px(24.5, 24.5, R[3]); p.px(22.5, 23.5, R[3]);
        p.ell(20, 15 + fl * 0.5, 3, 5, [R[1], R[2], R[3]]);
        p.ell(16, 18.5, 7.5, 8, R);
        p.ell(12.5, 21.5, 4, 5, C);
        spots(12.5, 22.5);
        p.ell(13.5, 12.5, 6.5, 4.3, Sc);
        eye1(p, 9.5, 13, true);
        p.rect(10, 16.2, 1, 2.6, Sc[3]);
        p.rect(5, 15, 3, 1.5, Bk[1]); p.px(5, 16.5, Bk[2]); p.px(7, 14.6, Bk[0]);
        p.blush(11.5, 17.5, '#ff9ab0');
        p.ell(19.5, 19 + fl, 4.5, 6, R);
        p.rect(19.5, 23.5 + fl, 4, 1, R[3]); p.px(18.5, 17 + fl, R[3]); p.px(20.5, 19.5 + fl, R[3]);
        p.rect(13, 26.5, 1.5, 1.5, Bk[2]); p.rect(16, 26.5, 1.5, 1.5, Bk[2]);
        return;
      }
      p.ell(16, 26, 3.2, 2, R);
      p.ell(6.5, 18 + fl, 3.2, 5.8, R); p.ell(25.5, 18 + fl, 3.2, 5.8, R);
      p.rect(5, 22.5 + fl, 3, 1, R[3]); p.rect(24, 22.5 + fl, 3, 1, R[3]);
      p.px(6, 17 + fl, R[3]); p.px(26, 17 + fl, R[3]);
      p.ell(16, 18.5, 8, 8.5, R);
      if (p.back) {
        p.ell(16, 12, 7.5, 5, Sc);
        p.rect(14, 24.5, 4, 0.8, R[3]); p.px(12, 18, R[3]); p.px(20, 18, R[3]); p.px(16, 20.5, R[3]);
      } else {
        p.ell(16, 21.5, 5.2, 4.8, C);
        spots(16, 22.5);
        p.ell(16, 11, 7.2, 3.6, Sc);
        eyes2(p, 11.5, 18.5, 12.8, true);
        p.rect(11.5, 16, 1, 2.5, Sc[3]); p.rect(19.5, 16, 1, 2.5, Sc[3]);
        p.rect(15, 15.6, 2, 1.6, Bk[1]); p.px(15.5, 17.2, Bk[2]);
        p.blush(8.5, 16, '#ff9ab0'); p.blush(21.5, 16, '#ff9ab0');
      }
      p.rect(12.5, 26.5, 2, 1, Bk[2]); p.rect(17.5, 26.5, 2, 1, Bk[2]);
    },

    pufflet: function (p, f) { /* Pufflet: a dandelion puff with a sleepy face and two leaf feet */
      var W = NP3.pW, Sd = NP3.pS, Lf = NP.lily, fl = flyF(p), i, cx = 16, cy = 15 + Math.round(fl * 0.4 * 2) / 2;
      p.rect(cx - 0.5, cy + 7, 1, 4.5, Lf[2]);
      p.ell(cx - 2.6, cy + 11.4, 2.4, 1.1, Lf); p.ell(cx + 2.6, cy + 11.4, 2.4, 1.1, Lf);
      for (i = 0; i < 12; i++) { var a = i / 12 * 6.2832 + Math.sin(p.ph + i) * 0.05; p.ell(cx + Math.cos(a) * 8.2, cy + Math.sin(a) * 7.6, 2.3, 2.3, W); }
      p.ell(cx, cy, 8.4, 7.8, W);
      if (p.back) {
        [[-3, -3], [2, -4], [4, 1], [-1, 2], [-4, 3.5], [1, 5]].forEach(function (q) { p.px(cx + q[0], cy + q[1], Sd[2]); });
        p.ell(cx, cy + 6.4, 1.6, 1, Sd);
        return;
      }
      if (p.side) {
        eye1(p, cx - 6, cy - 2, true);
        p.rect(cx - 6.5, cy + 2, 2.5, 1, '#8a7a90'); p.px(cx - 4, cy + 1.5, '#8a7a90');
        p.blush(cx - 4, cy + 0.6, '#ff9ab0');
        p.px(cx + 2, cy - 3, Sd[2]); p.px(cx + 4, cy + 1, Sd[2]); p.px(cx, cy + 4, Sd[2]);
        return;
      }
      eyes2(p, cx - 4.5, cx + 2.5, cy - 2, true);
      smile(p, cx - 2.5, cy + 1.6, '#8a7a90');
      p.blush(cx - 7, cy + 1, '#ff9ab0'); p.blush(cx + 5, cy + 1, '#ff9ab0');
      p.px(cx - 1, cy - 5, Sd[2]); p.px(cx + 2, cy - 5.5, Sd[2]); p.px(cx + 0.5, cy + 5, Sd[2]);
    },

    cragnib: function (p, f) { /* Cragnib: a sure-footed mountain kid with a brown saddle and stub horns */
      var F = NP3.gF, Br = NP3.gB, Hn = NP3.gH, b = hop(p), hv = '#4a3a30', sw = Math.sin(p.ph * 2) * 0.5;
      function horn(x, y, m, len) { p.tri(x - 1, x + 1, y, x + m * 0.8, y - len, Hn[2], Hn[1]); }
      if (p.side) {
        legsSide(p, [[20, 1, 1], [12, 0, 1]], 23 + b, 28, 1.8, F[2], F[3], [hv, '#2e241e']);
        p.ell(24.5, 16.5 + b + sw, 1.3, 2, F);
        p.ell(17, 20 + b, 7.5, 4.6, F);
        p.ell(18.5, 17.6 + b, 5, 2.2, Br);
        p.ell(11.5, 16 + b, 3, 4, F);
        horn(10.5, 9.5 + b, 1, 2.6);
        p.ell(13, 11.8 + b, 2.4, 1.1, F); p.px(12.5, 11.8 + b, PINK);
        p.ell(9, 12.5 + b, 4.6, 4, F);
        p.ell(5.6, 14 + b, 2.2, 1.9, [F[0], F[1], F[2]]);
        p.px(3.8, 13.5 + b, '#c08878');
        p.ell(7.5, 17.4 + b, 0.9, 1.6, Hn);
        p.px(9.5, 9.6 + b, Br[1]); p.px(10.5, 9.4 + b, Br[1]);
        eye1(p, 7.5, 11 + b, true);
        p.blush(8, 14.2 + b, '#ff9ab0');
        legsSide(p, [[19, 0, 0], [11, 1, 0]], 23 + b, 28, 2, F[1], F[2], [hv, hv]);
        return;
      }
      p.rect(9.5, 22.5 + b, 1.6, 4, F[3]); p.rect(20.9, 22.5 + b, 1.6, 4, F[3]);
      feet2(p, 11.5, 18.5, 22.5, 2, 5.5, F[2], F[1]);
      feet2(p, 11.5, 18.5, 26.5, 2, 1.5, hv);
      p.ell(16, 20.5 + b, 7, 4.6, F);
      if (p.back) { p.ell(16, 19.6 + b, 5.6, 2.6, Br); p.ell(16, 16.8 + b + sw, 1.5, 2, F); }
      p.ell(9.6, 13 + b, 2.6, 1.2, F); p.ell(22.4, 13 + b, 2.6, 1.2, F);
      if (!p.back) { p.px(9.5, 13 + b, PINK); p.px(22, 13 + b, PINK); }
      horn(13.5, 9.2 + b, -1, 3); horn(18.5, 9.2 + b, 1, 3);
      p.ell(16, 13 + b, 5.2, 4.6, F);
      if (p.back) { p.ell(16, 11.5 + b, 2.6, 1.6, [Br[0], Br[1], Br[1]]); return; }
      p.ell(16, 9.6 + b, 1.6, 1, [Br[0], Br[1], Br[1]], true);
      eyes2(p, 12.5, 17.5, 11.8 + b, true);
      p.ell(16, 16 + b, 2.8, 1.9, [F[0], F[0], F[1]]);
      p.px(15.5, 15.4 + b, '#c08878'); p.px(16, 15.4 + b, '#c08878'); p.px(16, 17 + b, F[3]);
      p.ell(16, 18.6 + b, 0.8, 1.1, [F[1], F[2], F[2]]);
      p.blush(10.5, 15 + b, '#ff9ab0'); p.blush(19.5, 15 + b, '#ff9ab0');
    },

    pebblehop: function (p, f) { /* Screehop: a rock rabbit with pebble-speckled fur and a pebble for a tail */
      var F = NP3.hF, C = NP3.hC, St = NP3.hS, b = hop(p);
      function ear(x, y, inner) { p.ell(x, y, 1.9, 4.6, F); if (inner) p.ell(x, y + 0.8, 0.8, 3, [PINK, PINK], true); p.ell(x, y - 3.8, 1.5, 1.2, St); }
      if (p.side) {
        p.ell(20.5, 26.8, 3.4, 1.2, [F[2], F[2], F[3]]);
        p.ell(17.2, 8.2 + b, 1.7, 4.4, [F[2], F[2], F[3]]); p.ell(17.2, 4.6 + b, 1.3, 1.1, [St[1], St[2], St[3]]);
        p.ell(25, 21.5 + b, 2.3, 2.1, St);
        p.ell(18, 21.5 + b, 6.6, 5, F);
        p.ell(21, 22 + b, 4, 4, F);
        p.ell(15, 23.5 + b, 3.4, 3, C);
        ear(14.5, 7.5 + b, true);
        p.ell(10.5, 15 + b, 5.2, 4.6, F);
        p.ell(7.5, 17 + b, 2.4, 2, C);
        p.px(5.2, 16 + b, '#e08890');
        eye1(p, 8.5, 13.4 + b, true);
        p.px(19, 18 + b, St[2]); p.px(22, 20 + b, St[3]); p.px(12.5, 11.8 + b, St[2]); p.px(16.5, 20 + b, St[2]);
        p.rect(11.5, 25.5, 2, 2.5, F[1]);
        p.ell(19.5, 27, 3.8, 1.2, [F[0], F[1], F[2]]);
        p.blush(9, 17.5 + b, '#ff9ab0');
        return;
      }
      p.ell(10.5, 27, 2.8, 1.2, [F[1], F[2], F[3]]); p.ell(21.5, 27, 2.8, 1.2, [F[1], F[2], F[3]]);
      p.ell(16, 21.5 + b, 6.8, 5.4, F);
      if (p.back) p.ell(16, 24.6 + b, 2.4, 2.2, St);
      else {
        p.ell(16, 22.5 + b, 4.4, 4, C);
        p.rect(13, 25, 2, 2.5, F[1]); p.rect(17, 25, 2, 2.5, F[1]);
      }
      p.px(11, 19.5 + b, St[2]); p.px(21, 20.5 + b, St[3]);
      ear(12.5, 7 + b, !p.back); ear(19.5, 7 + b, !p.back);
      p.ell(16, 14 + b, 6.2, 5.2, F);
      if (p.back) { p.px(14, 12 + b, St[2]); p.px(18.5, 13.5 + b, St[3]); p.ell(16, 10.6 + b, 1.2, 0.9, St); return; }
      p.ell(16, 10.2 + b, 1.2, 0.9, St);
      eyes2(p, 11.5, 18.5, 12.5 + b, true);
      p.ell(13.6, 16.4 + b, 2.2, 1.7, C); p.ell(18.4, 16.4 + b, 2.2, 1.7, C);
      p.rect(15.5, 15.4 + b, 1, 0.8, '#e08890');
      p.rect(15.5, 17.2 + b, 1, 1, '#ffffff');
      p.blush(9.5, 15.8 + b, '#ff9ab0'); p.blush(20.5, 15.8 + b, '#ff9ab0');
    },

    breezelet: function (p, f) { /* Breezelet: a white stoat that stands up to sniff the wind; its tail tip curls like a gust */
      var F = NP3.bF, T = NP3.bT, b = hop(p), sw = Math.sin(p.ph) * 0.8;
      function swirl(x, y, r) { p.ell(x, y, r, r, T); p.ell(x - r * 0.25, y - r * 0.2, r * 0.55, r * 0.55, [F[1], F[1], F[2]], true); p.px(x - r * 0.15, y - r * 0.1, T[2]); }
      if (p.side) {
        plume(p, 24, 23.5 + b, -0.9, 7, 1.5, [F, F, T], -1.5 + sw, 0.25);
        swirl(27.2, 16.5 + b + sw * 0.4, 2.4);
        legsSide(p, [[21, 1, 1], [12, 0, 1]], 24 + b, 28, 1.8, F[2], F[3]);
        p.ell(17, 22.5 + b, 8, 3.6, F);
        p.ell(18, 20.4 + b, 6.6, 1.5, [T[0], T[0], T[1]]);
        p.ell(9.5, 18.5 + b, 3.4, 3.6, F);
        p.ell(10.5, 11.8 + b, 1.6, 1.6, F); p.px(10.5, 11.8 + b, PINK);
        p.ell(8, 15 + b, 4.4, 3.8, F);
        p.px(3.8, 15 + b, '#ff8aa8');
        eye1(p, 6, 13.6 + b, true);
        p.px(9.5, 12.6 + b, T[1]); p.px(10.5, 13.2 + b, T[1]);
        p.blush(7, 16.6 + b, '#ff9ab0');
        legsSide(p, [[20, 0, 0], [11, 1, 0]], 24 + b, 28, 2, F[1], F[2]);
        return;
      }
      plume(p, 20, 26 + b, -1.2, 8, 1.5, [F, F, T], 2 + sw, 0.25);
      swirl(24.5, 17 + b + sw * 0.4, 2.4);
      feet2(p, 12, 17.5, 26, 2.5, 2, F[2], F[1]);
      p.ell(16, 21.5 + b, 5, 5.6, F);
      if (p.back) p.ell(16, 20 + b, 3.4, 4.6, [T[0], T[0], T[1]]);
      else { p.ell(16, 22.5 + b, 3.2, 3.8, [F[0], F[0], F[1]]); p.ell(14, 19 + b, 1.3, 1.1, [F[0], F[1], F[2]]); p.ell(18, 19 + b, 1.3, 1.1, [F[0], F[1], F[2]]); }
      p.ell(11, 9.5 + b, 1.8, 1.8, F); p.ell(21, 9.5 + b, 1.8, 1.8, F);
      if (!p.back) { p.px(11, 9.5 + b, PINK); p.px(20.5, 9.5 + b, PINK); }
      p.ell(16, 12.5 + b, 5.6, 4.4, F);
      p.ell(16, p.back ? 11.5 + b : 9.4 + b, 4.4, p.back ? 3 : 1.6, [T[0], T[0], T[1]]);
      if (p.back) return;
      eyes2(p, 12.5, 17.5, 11.2 + b, true);
      p.rect(15.5, 14.2 + b, 1, 0.9, '#ff8aa8');
      p.px(14.5, 15.4 + b, F[3]); p.px(17, 15.4 + b, F[3]); p.px(15.5, 15.8 + b, F[3]); p.px(16, 15.8 + b, F[3]);
            p.blush(10, 13.8 + b, '#ff9ab0'); p.blush(20, 13.8 + b, '#ff9ab0');
    },

    skyfin: function (p, f) { /* Skyfin: a flying fish that glides on fins as wide as wings */
      var Bd = NP3.sB, C = NP3.sC, Fn = NP3.sF, fl = flyF(p), i;
      if (p.side) {
        p.ell(20, 11 + fl * 0.6, 5, 2.4, [Fn[1], Fn[2], Fn[3]]);
        plume(p, 22.5, 17, -0.6, 5.5, 1.9, [Bd, Bd, [Bd[2], Bd[3]]], 0, 0.45);
        plume(p, 22.5, 17.5, 0.6, 5.5, 1.9, [Bd, Bd, [Bd[2], Bd[3]]], 0, 0.45);
        p.tri(13, 19, 12.6, 17.5, 9, Bd[2], Bd[1]);
        p.ell(15.5, 17, 8.5, 5.2, Bd);
        p.ell(14, 19.6, 6, 2.4, C);
        p.rect(11.5, 15, 0.8, 4, Bd[2]);
        eye1(p, 8, 14.4, true);
        p.rect(6.6, 18, 1.5, 0.8, Bd[3]);
        p.blush(9.5, 17.2, '#ff9ab0');
        p.ell(16, 22.4, 2, 1, Fn);
        p.ell(18.5, 12 + fl, 6.2, 2.4, Fn);
        for (i = 0; i < 4; i++) p.rect(15 + i * 2, 11.6 + fl, 0.6, 1.4, Fn[3]);
        return;
      }
      [-1, 1].forEach(function (m) {
        p.ell(16 + m * 9.5, 14.5 + fl, 5, 2.6, Fn);
        p.ell(16 + m * 8, 18 + fl, 3.8, 1.9, [Fn[1], Fn[2], Fn[3]]);
        for (i = 0; i < 3; i++) p.rect(16 + m * (7 + i * 2) - 0.3, 14 + fl, 0.6, 1.4, Fn[3]);
      });
            p.tri(14, 18, 11, 16, 6.5, Bd[2], Bd[1]);
      p.ell(16, 17, 6.4, 6.8, Bd);
      if (p.back) {
        p.ell(16, 21, 1.5, 4.2, [Bd[1], Bd[2], Bd[3]]);
        [[13, 15], [18, 14], [15.5, 18], [12.5, 20], [19, 20]].forEach(function (q) { p.px(q[0], q[1], Bd[0]); p.px(q[0] + 1, q[1] + 1, Bd[2]); });
        return;
      }
      p.ell(16, 20, 4.4, 3.4, C);
      eyes2(p, 11, 19, 13.6, true);
      p.ell(16, 18.2, 1, 0.7, [Bd[3], Bd[3]], true);
      p.blush(9.6, 17, '#ff9ab0'); p.blush(20.4, 17, '#ff9ab0');
    },

    voltmoth: function (p, f) { /* Voltmoth: a fuzzy night moth with zigzag wing bands and feathered antennae */
      var Bd = NP3.vB, Y = NP3.vY, W = NP3.vW, E = NP3.vE, fl = flyF(p);
      function zig(x, y, m) { for (var i = 0; i < 4; i++) p.rect(x + m * i * 1.2 - (m < 0 ? 1.4 : 0), y + (i % 2 ? 1 : 0), 1.4, 1, Y[2]); }
      function spot(x, y) { p.ell(x, y, 1.5, 1.5, E, true); p.px(x - 0.5, y - 0.5, '#ffffff'); }
      function ant(x, y, m) { for (var i = 0; i < 5; i++) { var ax = x + m * i * 0.8, ay = y - i; p.px(ax, ay, Y[3]); if (i) { p.px(ax - m, ay - 0.5, Y[1]); p.px(ax + m * 0.5, ay + 0.8, Y[1]); } } }
      if (p.side) {
        plume(p, 17, 15 + fl * 0.5, -0.95, 7, 2.6, [[W[1], W[2], W[3]]], 0, -0.45);
        ant(9.5, 11, -1);
        p.ell(19, 20.5, 6, 3.6, Bd);
        p.rect(18, 18, 0.8, 5, Bd[3]); p.rect(21, 18.2, 0.8, 4.8, Bd[3]);
        p.ell(13, 17, 3, 3, Y);
        p.ell(10, 15, 4.2, 4, NP3.vH);
        eye1(p, 7, 13.6, true);
        p.blush(8.5, 16.6, '#ff9ab0');
        plume(p, 15, 16 + fl, -1.2, 7, 2.8, [W, W], 0, -0.45);
        zig(15, 11.5 + fl, 1); spot(17.5, 8.5 + fl);
        p.rect(12, 23, 1, 2, Bd[3]); p.rect(14.5, 23, 1, 2, Bd[3]);
        return;
      }
      /* forewings fan out from the shoulders and are widest at the tip, as a moth's are */
      [-1, 1].forEach(function (m) { plume(p, 16 + m * 3.5, 15.5 + fl, m > 0 ? -0.5 : Math.PI + 0.5, 7, 2.8, [W, W], 0, -0.5); });
      p.ell(9.5, 21 + fl * 0.6, 3.8, 3.6, W); p.ell(22.5, 21 + fl * 0.6, 3.8, 3.6, W);
      zig(6, 12.6 + fl, 1); zig(26, 12.6 + fl, -1);
      spot(8, 10.5 + fl); spot(24, 10.5 + fl);
      p.px(9.5, 21 + fl * 0.6, Y[2]); p.px(22.5, 21 + fl * 0.6, Y[2]);
      p.ell(16, 20.5, 4, 6, Bd);
      p.rect(13, 21.5, 6, 0.8, Bd[3]); p.rect(13.5, 24, 5, 0.8, Bd[3]);
      ant(13.5, 8.5, -1); ant(18.5, 8.5, 1);
      p.ell(16, 16.4, 5.6, 2.3, Y);
      p.ell(16, 12.4, 5, 4, p.back ? Bd : NP3.vH);
      if (p.back) { p.ell(16, 11.5, 2.6, 1.5, [Bd[0], Bd[1], Bd[1]]); return; }
      eyes2(p, 12.5, 17.5, 11.2, true);
      p.px(15.5, 14.4, Bd[2]); p.px(16.5, 14.4, Bd[2]);
      p.blush(10, 13.6, '#ff9ab0'); p.blush(20, 13.6, '#ff9ab0');
      p.rect(14, 26, 1, 1.5, Bd[3]); p.rect(17, 26, 1, 1.5, Bd[3]);
    },

    mossram: function (p, f) { /* Mossram: a sturdy ram whose fleece is soft green moss, with curled stone horns */
      var W = NP3.mW, Fc = NP3.mF, Hn = NP3.mH, b = hop(p) * 0.6, i;
      function horn(x, y, m) { p.ell(x, y, 2.8, 3, Hn); p.ell(x + m * 0.3, y + 0.3, 1.3, 1.4, [Hn[2], Hn[2], Hn[3]]); p.px(x + m * 0.2, y + 0.2, Hn[3]); }
      function fleece(cx, cy, rx, ry) {
        for (i = 0; i < 12; i++) { var a = i / 12 * 6.2832; p.ell(cx + Math.cos(a) * (rx - 0.6), cy + Math.sin(a) * (ry - 0.6), 2.3, 2.1, W); }
        p.ell(cx, cy, rx, ry, W);
      }
      function blooms(q) { q.forEach(function (o, j) { p.px(o[0], o[1], j % 2 ? '#fff0a0' : '#ffb0d0'); }); }
      if (p.side) {
        legsSide(p, [[22, 1, 1], [13, 0, 1]], 23 + b, 28, 2, Fc[2], Fc[3]);
        p.ell(26.5, 17.5 + b, 1.6, 1.5, W);
        fleece(18, 19.5 + b, 8.4, 5.6);
        blooms([[16, 16 + b], [22, 18.5 + b], [19, 23 + b]]);
        p.ell(13.5, 16.2 + b, 1.8, 0.9, Fc);
        p.ell(8.5, 17 + b, 3.8, 4, Fc);
        p.ell(5.6, 18.8 + b, 2, 1.6, [Fc[0], Fc[0], Fc[1]]);
        p.ell(10, 13.6 + b, 3, 2, W);
        horn(11.2, 16 + b, 1);
        eye1(p, 6.5, 15.4 + b, true);
        p.px(3.8, 18 + b, Fc[3]);
        p.blush(7.5, 18.4 + b, '#e89aa0');
        legsSide(p, [[21, 0, 0], [12, 1, 0]], 23 + b, 28, 2.2, Fc[1], Fc[2]);
        return;
      }
      feet2(p, 10.5, 19.5, 24, 2.2, 4, Fc[2], Fc[1]);
      fleece(16, 19.5 + b, 9, 6);
      blooms([[10, 17 + b], [22, 21 + b], [13, 23.5 + b], [20, 16 + b]]);
      if (p.back) {
        p.ell(16, 23.5 + b, 1.6, 1.4, [W[0], W[1], W[2]]);
        horn(10.5, 13 + b, -1); horn(21.5, 13 + b, 1);
        p.ell(16, 13.5 + b, 4.6, 3.4, W);
        return;
      }
      p.ell(10, 14.6 + b, 2.2, 1, Fc); p.ell(22, 14.6 + b, 2.2, 1, Fc);
      horn(10.5, 13 + b, -1); horn(21.5, 13 + b, 1);
      p.ell(16, 15.5 + b, 4.2, 4.6, Fc);
      p.ell(16, 11.6 + b, 3.6, 2, W);
      eyes2(p, 13, 17, 14 + b, true);
      p.ell(16, 18.4 + b, 2.4, 1.6, [Fc[0], Fc[0], Fc[1]]);
      p.px(15.5, 17.8 + b, Fc[3]); p.px(16.5, 17.8 + b, Fc[3]);
      p.blush(11.5, 17.2 + b, '#e89aa0'); p.blush(18.5, 17.2 + b, '#e89aa0');
    }
  };
  var STG3 = {
    kestrip: gstg(function (p, f, s, L, d, b) {
      var R = NP3.kR, Sc = NP3.kS, fl = flyF(p), sw = Math.sin(p.ph) * 0.8, i;
      if (L === 'back') {
        /* long flight feathers grow from each wing; from stage 4 the wings open wide */
        var n = s >= 4 ? 3 : s >= 3 ? 2 : 1, ln = 3 + s * 1.3;
        if (d === 2) for (i = 0; i < n; i++) plume(p, 21, 16 + fl * 0.5, -0.9 + i * 0.35, ln - i * 0.6, 2, [R, R, Sc], sw, 0.5);
        else [-1, 1].forEach(function (m) { for (i = 0; i < n; i++) { var a = -0.95 + i * 0.4; plume(p, 16 + m * 8, 15 + fl, m > 0 ? a : Math.PI - a, ln - i * 0.6, 2, [R, R, Sc], m * sw, 0.5); } });
        if (s >= 3) {
          if (d === 2) for (i = -1; i <= 1; i++) plume(p, 23.5, 23.5, 0.45 + i * 0.3, 1 + s, 1.6, [R, [R[2], R[3]]], 0, 0.2);
          else if (d === 1) for (i = -1; i <= 1; i++) plume(p, 16 + i * 1.6, 25.5, 1.57 + i * 0.45, s - 1, 1.6, [R, [R[2], R[3]]], 0, 0.2);
        }
        return;
      }
      if (s >= 2) {
        var cx = d === 2 ? 15 : 16, tl = 1.5 + s * 0.7;
        /* one swept-back crest on the slate cap */
        if (d === 2) plume(p, 17, 9.5, -0.35, tl + 1, 1.6, [Sc, Sc], -0.8, 0.5);
        else plume(p, cx, 8.4, -1.57, tl * 0.7, 1.6, [Sc, Sc], 0, 0.5);
      }
    }),
    pufflet: gstg(function (p, f, s, L, d, b) {
      var W = NP3.pW, Sd = NP3.pS, Lf = NP.lily, fl = flyF(p), cy = 15 + Math.round(fl * 0.4 * 2) / 2, i;
      if (L === 'back') {
        if (s >= 3) [-1, 1].forEach(function (m) { if (d === 2 && m < 0) return; plume(p, 16 + m * 6, cy + 6, m > 0 ? -0.5 : -2.64, 4 + s * 1.2, 1.8, [Lf, Lf], m * -1.2, 0.6); });
        /* the seeds the puff will one day let go: thin stalks with a tuft, more each stage */
        var n = s + 1;
        for (i = 0; i < n; i++) {
          var a = -1.57 + (i - (n - 1) / 2) * 0.55, x0 = 16 + Math.cos(a) * 8.6, y0 = cy + Math.sin(a) * 8.2 - 1.5;
          p.rect(x0, y0 - 1, 0.6, 2.2, Sd[2]);
          p.rect(x0 - 1.6, y0 - 2.4, 3.8, 0.8, W[0]); p.px(x0 - 2, y0 - 3, W[2]); p.px(x0 + 2, y0 - 3, W[2]); p.px(x0, y0 - 3.2, W[0]);
        }
        if (s >= 4) for (i = 0; i < 10; i++) { var b2 = i / 10 * 6.2832 + 0.3; p.ell(16 + Math.cos(b2) * 10.2, cy + Math.sin(b2) * 9.4, 1.6, 1.6, W); }
        return;
      }
      if (s >= 5) {
        var Pe = ['#fff6a0', '#ffd850', '#f0b030'];
        for (i = -2; i <= 2; i++) p.ell(16 + i * 2, cy - 8 - (2 - Math.abs(i)) * 0.6, 1.4, 1.8, Pe);
        p.ell(16, cy - 7.5, 2, 1, ['#ffe080', '#f0b030'], true);
      }
      if (s >= 3 && d === 0) { p.px(16, cy - 5, Sd[1]); p.px(15, cy - 5.5, Sd[1]); p.px(17, cy - 5.5, Sd[1]); }
    }),
    cragnib: gstg(function (p, f, s, L, d, b) {
      var Hn = NP3.gH, St = NP3.hS, Am = EP.earth[0], i;
      if (L === 'back') {
        /* the horns lengthen and curl back; from stage 4 a ridge of stone runs along the back */
        var hl = 2 + s * 1.1, bd = s >= 3 ? 2 : 0.6;
        if (d === 2) plume(p, 10.5, 9.6 + b, -1.0, hl, 1.3, [Hn, Hn, [Hn[2], Hn[3]]], bd, 0.5);
        else [-1, 1].forEach(function (m) { plume(p, 16 + m * 2.6, 10 + b, -1.57 + m * 0.6, hl, 1.3, [Hn, Hn, [Hn[2], Hn[3]]], m * bd, 0.5); });
        if (s >= 4) {
          if (d === 2) for (i = 0; i < 3; i++) p.tri(14.5 + i * 3.4, 16.3 + i * 3.4, 17 + b, 15.4 + i * 3.4, 13 + b - (i % 2) * 1.4, St[2], St[1]);
          else for (i = -1; i <= 1; i++) p.tri(16 + i * 3.4 - 0.9, 16 + i * 3.4 + 0.9, 16.6 + b, 16 + i * 3.4, 12.6 + b - (i ? 0 : 1.4), St[2], St[1]);
        }
        return;
      }
      if (s >= 3) {
        if (d === 2) p.ell(13.5, 19.2 + b, 2.4, 1.8, St);
        else [-1, 1].forEach(function (m) { p.ell(16 + m * 5.2, 19.4 + b, 2.2, 1.7, St); });
      }
      if (s >= 5 && d !== 1) { var cx = d === 2 ? 9.5 : 16, cy = d === 2 ? 9.6 : 9.4; p.tri(cx - 1, cx + 1, cy + b, cx, cy - 2.6 + b, Am[2], Am[1]); }
    }),
    pebblehop: gstg(function (p, f, s, L, d, b) {
      var St = NP3.hS, Am = EP.earth[0], i, n = s - 1;
      if (L === 'back') {
        /* stone plates gather on its back, and from stage 4 they push up into a ridge of shards */
        if (s >= 4) {
          if (d === 2) for (i = 0; i < 3; i++) p.tri(17 + i * 3.2, 18.8 + i * 3.2, 17.6 + b, 17.9 + i * 3.2, 13.6 + b - (i === 1 ? 1.4 : 0), St[2], St[1]);
          else for (i = -1; i <= 1; i++) p.tri(16 + i * 3.6 - 0.9, 16 + i * 3.6 + 0.9, 17.6 + b, 16 + i * 3.6, 13.4 + b - (i ? 0 : 1.4), St[2], St[1]);
        }
        return;
      }
      if (d === 2) for (i = 0; i < n; i++) p.ell(17 + i * 2.4, 17.4 + b + (i % 2) * 0.6, 1.8, 1.3, St);
      else if (d === 1) for (i = 0; i < n; i++) p.ell(16 + (i - (n - 1) / 2) * 3, 19 + b + (i % 2), 1.9, 1.4, St);
      else { p.ell(10.2, 18.6 + b, 1.6, 1.2, St); if (s >= 3) p.ell(21.8, 18.6 + b, 1.6, 1.2, St); }
      if (s >= 3) {
        var tips = d === 2 ? [[14.5, 3.6]] : [[12.5, 3.2], [19.5, 3.2]];
        tips.forEach(function (q) { p.tri(q[0] - 1, q[0] + 1, q[1] + b, q[0], q[1] - 1.6 - s * 0.4 + b, Am[2], Am[1]); });
      }
    }),
    breezelet: gstg(function (p, f, s, L, d, b) {
      var T = NP3.bT, F = NP3.bF, sw = Math.sin(p.ph) * 1.2, i;
      if (L === 'back') {
        /* ribbons of wind stream from its ruff, more each stage */
        if (s >= 3) {
          var n = s - 2;
          /* the wind always blows them the same way: back along the body, or off to its right */
          var rb = [[T[1], T[2], T[3]], T];
          if (d === 2) for (i = 0; i < n; i++) plume(p, 11.5, 15.5 + b + i, -0.3 + i * 0.25, 6 + s, 1.1, rb, -1 - sw - i * 0.5, 0.3);
          else for (i = 0; i < n; i++) plume(p, 20.5, 16 + b + i, 0.1 + i * 0.35, 4 + s, 1.1, rb, -1.2 - sw - i * 0.4, 0.3);
        }
        if (s >= 4) { var tx = d === 2 ? 27.2 : 24.5, ty = (d === 2 ? 16.5 : 17) + b + sw * 0.4, r = s - 0.8; p.ell(tx + 0.6, ty - 0.6, r, r, [T[1], T[2], T[3]]); p.ell(tx, ty, r - 1.2, r - 1.2, [T[0], T[1], T[2]]); }
        return;
      }
      if (s >= 2) {
        var ex = d === 2 ? [[10.5, 10.6]] : [[11, 8.2], [21, 8.2]];
        ex.forEach(function (q, j) { plume(p, q[0], q[1] + b, -1.57 + (d === 2 ? 0.3 : j ? 0.25 : -0.25), 0.8 + s * 0.3, 0.8, [F, T], 0, 0.3); });
      }
      if (s >= 5 && d === 0) for (i = -1; i <= 1; i++) plume(p, 16 + i * 1.8, 8.5 + b, -1.57 + i * 0.4, 3 - Math.abs(i), 0.9, [T, [T[0], T[0]]], i * 0.6, 0.3);
    }),
    skyfin: gstg(function (p, f, s, L, d, b) {
      var Fn = NP3.sF, Bd = NP3.sB, fl = flyF(p), sw = Math.sin(p.ph) * 1, i;
      if (L === 'back') {
        /* the wing fins widen each stage; from stage 3 long cloud streamers trail from the tail */
        var ln = 4 + s * 1.5, ff = [Fn, Fn, [Fn[0], Fn[0]]];
        if (d === 2) { plume(p, 15, 13.5 + fl, -0.55, ln, 2.4, ff, -1, 0.5); if (s >= 4) plume(p, 16, 14 + fl, -0.15, ln - 2, 2, ff, -0.6, 0.5); }
        else [-1, 1].forEach(function (m) { plume(p, 16 + m * 6, 15 + fl, m > 0 ? -0.3 : -2.84, ln, 2.4, ff, m * -1, 0.5); if (s >= 4) plume(p, 16 + m * 5, 18 + fl, m > 0 ? 0.2 : 2.94, ln - 2, 2, ff, m * 0.6, 0.5); });
        if (s >= 3) {
          if (d === 2) for (i = -1; i <= 1; i += 2) plume(p, 26, 17 + i * 1.6, i * 0.35, 3 + s, 1.2, [Fn, [Fn[0], Fn[0]]], sw * i, 0.3);
        }
        return;
      }
      if (s >= 3 && d !== 1) { var cx = d === 2 ? 16 : 16; p.tri(cx - 1.5, cx + 1.5, d === 2 ? 12.6 : 11, cx + (d === 2 ? 1.5 : 0), (d === 2 ? 9 : 7) - s * 0.3, Bd[2], Fn[1]); }
      if (s >= 4 && d === 0) { p.px(13, 22.4, Fn[3]); p.px(16, 23, Fn[3]); p.px(19, 22.4, Fn[3]); }
    }),
    voltmoth: gstg(function (p, f, s, L, d, b) {
      var W = NP3.vW, Y = NP3.vY, E = NP3.vE, fl = flyF(p), sw = Math.sin(p.ph) * 0.8, i;
      if (L === 'back') {
        /* long tails grow from the hind wings; from stage 3 the forewings widen */
        var tl = 1.5 + s * 0.8, tp = [W, W, [Y[1], Y[2], Y[3]]];
        if (d === 2) plume(p, 21.5, 21 + fl * 0.6, 0.9, tl, 2, tp, sw, 0.6);
        else [-1, 1].forEach(function (m) { plume(p, 16 + m * 10.5, 22.5 + fl * 0.6, 1.57 - m * 1.0, tl, 2, tp, m * sw, 0.6); });
        if (s >= 3) {
          var wl = 6 + s, wr = 2.6 + s * 0.25;
          if (d === 2) plume(p, 17.5, 15 + fl * 0.5, -0.75, wl, wr, [[W[1], W[2], W[3]]], 0, -0.4);
          else [-1, 1].forEach(function (m) { plume(p, 16 + m * 4, 15.5 + fl, m > 0 ? -0.3 : Math.PI + 0.3, wl, wr, [W, W], 0, -0.4); });
        }
        return;
      }
      if (s >= 3 && d !== 2) [-1, 1].forEach(function (m) { for (i = 0; i < 3; i++) p.rect(16 + m * (4 + i * 1.3) - (m < 0 ? 1.2 : 0), 16 + fl + (i % 2), 1.2, 0.8, E[2]); });
      if (s >= 3 && d === 2) for (i = 0; i < 3; i++) p.rect(14 + i * 1.3, 14.5 + fl + (i % 2), 1.2, 0.8, E[2]);
      if (s >= 4) { if (d === 2) p.ell(18.5, 13 + fl, 1, 1, E, true); else { p.ell(9.5, 15 + fl, 1, 1, E, true); p.ell(22.5, 15 + fl, 1, 1, E, true); } }
    }),
    mossram: gstg(function (p, f, s, L, d, b) {
      var Hn = NP3.mH, Lf = NP.lily, Mu = ['#ffc0b0', '#f07060', '#c84a40'], i;
      b *= 0.6;
      if (L === 'back') {
        /* the horns grow into wide curls */
        if (s >= 2) {
          var r = 2.6 + s * 0.6;
          if (d === 2) p.ell(12, 15.6 + b, r, r + 0.3, Hn);
          else [-1, 1].forEach(function (m) { p.ell(16 + m * (6 + s * 0.3), 13.6 + b, r, r + 0.3, Hn); p.ell(16 + m * (6 + s * 0.3), 14 + b, r * 0.45, r * 0.45, [Hn[2], Hn[2], Hn[3]]); });
        }
        if (s >= 4) {
          var cx = d === 2 ? 19 : 16, top = (d === 2 ? 14 : 13.6) + b;
          for (i = -2; i <= 2; i++) plume(p, cx + i * 2.4, top + Math.abs(i) * 0.8, -1.57 + i * 0.35, 3 + s * 0.7 - Math.abs(i) * 0.6, 1.2, [Lf, Lf], i * 0.5, 0.4);
        }
        return;
      }
      /* fern sprouts, then small mushrooms, then flowers grow in the moss */
      var spots = d === 2 ? [[14, 14.4], [21, 14.8], [24, 18]] : [[9, 15.6], [23, 15.6], [12.5, 13.8], [19.5, 13.8]];
      spots.forEach(function (q, j) {
        if (j >= s) return;
        if (s >= 3 && j % 2) { p.rect(q[0] - 0.3, q[1] - 1.2 + b, 0.8, 1.4, '#f4ecd0'); p.ell(q[0], q[1] - 1.6 + b, 1.4, 0.9, Mu); p.px(q[0] - 0.5, q[1] - 2 + b, '#ffffff'); }
        else plume(p, q[0], q[1] + b, -1.57 + (q[0] < 16 ? -0.3 : 0.3), 1.5 + s * 0.5, 0.9, [Lf, Lf], 0, 0.3);
      });
    })
  };
  var EL3 = [
    ['kestrip', 'wind', null, '#3a1c10', 1, [['Kestrip', 'A small kestrel chick with a slate cap and stripes on its cheeks. It hovers in one place to watch.'], ['Hoverwing', 'Its flight feathers have grown long enough to ride a gust.'], ['Updraftor', 'A crest and a barred tail fan. It climbs on rising air without one flap.'], ['Gyrfane', 'Wide wings open like sails over the cliff roads.'], ['Skytalon', 'A legendary hawk that keeps watch over the high passes.']]],
    ['pufflet', 'wind', null, '#3a3c4a', 1, [['Pufflet', 'A dandelion puff with a sleepy face. It drifts wherever the wind is kind.'], ['Downwisp', 'Its first seeds stand up around its head, waiting for a breeze.'], ['Seedrift', 'Two leaf wings let it steer the wind a little.'], ['Parasoleil', 'A double halo of down; it floats for a whole day.'], ['Aerablume', 'A legendary puff crowned with a flower that never closes.']]],
    ['cragnib', 'earth', null, '#2e2418', 0, [['Cragnib', 'A mountain kid with stub horns. It finds a foothold on any ledge.'], ['Ledgekid', 'Its horns have started to curl back.'], ['Cliffhorn', 'Stone plates grow on its shoulders where it leans on the rock.'], ['Bouldercurl', 'A ridge of stone runs along its back.'], ['Summitarch', 'A legendary goat with an amber peak upon its brow.']]],
    ['pebblehop', 'earth', null, '#2a2420', 0, [['Screehop', 'A rock rabbit with pebble-speckled fur and a pebble for a tail.'], ['Gravelear', 'Smooth stones settle on its back as it grows.'], ['Shalebound', 'Amber shards tip its long ears.'], ['Cairnleap', 'Its back rises into a little ridge of stone.'], ['Monolapin', 'A legendary rabbit that carries a small mountain lightly.']]],
    ['breezelet', 'wind', null, '#26304a', 0, [['Breezelet', 'A white stoat that stands up to sniff the wind. Its tail tip curls like a gust.'], ['Swirltail', 'Wind tufts rise from its ears.'], ['Gustermine', 'Ribbons of wind stream from its ruff.'], ['Galeruff', 'A second gust curls from its tail.'], ['Tempestoat', 'A legendary stoat that runs on the edge of every storm.']]],
    ['skyfin', 'wind', 'water', '#163a5a', 1, [['Skyfin', 'A flying fish that glides on fins as wide as wings.'], ['Glidegill', 'Its wing fins stretch further each season.'], ['Cloudfin', 'Cloud streamers trail from its tail.'], ['Stratosail', 'Two pairs of wing fins; it can glide across a valley.'], ['Aeromaris', 'A legendary fish that swims through the sky as through the sea.']]],
    ['voltmoth', 'wind', 'electric', '#221c3a', 1, [['Voltmoth', 'A fuzzy night moth with zigzag wing bands and feathered antennae.'], ['Staticwing', 'Long tails hang from its hind wings.'], ['Sparklace', 'Its forewings widen and blue sparks mark their edges.'], ['Stormveil', 'Bright eyespots glow on its wings at dusk.'], ['Aurorarc', 'A legendary moth whose wings carry the colours of a storm sky.']]],
    ['mossram', 'earth', 'grass', '#20241a', 0, [['Mossram', 'A sturdy ram whose fleece is soft green moss, with curled stone horns.'], ['Lichenhorn', 'Its horns grow into wide curls and ferns sprout in its fleece.'], ['Fernfleece', 'Small mushrooms grow in the moss on its back.'], ['Bloomcurl', 'A crest of ferns rises along its fleece.'], ['Elderfleece', 'A legendary ram whose fleece is a whole mountain meadow.']]]
  ];
  /* where each of them likes to live: the same shape as the habitat tables of src/encounters.js and
     content/shared/wild.js (feature weights, day and night factors, weather factors, rarity) */
  var HAB3 = {
    kestrip:   { f: { open: 2, rock: 1, bridge: 1.2, chime: 1.5, tree: 0.5 }, day: 1.3, night: 0.3, wx: { wind: 2.4, clear: 1.2, rain: 0.6 }, rare: 0.75 },
    pufflet:   { f: { flowers: 2.4, open: 1.2, tallgrass: 1, garden: 0.8 }, day: 1.2, night: 0.4, wx: { wind: 2.8, clear: 1.2, rain: 0.4 }, rare: 0.8 },
    cragnib:   { f: { rock: 2.8, wall: 1.2, path: 0.5, open: 0.6 }, day: 1.1, night: 0.7, wx: { wind: 1.2, rain: 0.8 }, rare: 0.7 },
    pebblehop: { f: { rock: 2, tallgrass: 1.2, field: 1, sand: 0.8 }, day: 0.9, night: 1, wx: { fog: 1.2, rain: 0.7 }, rare: 0.85 },
    breezelet: { f: { tallgrass: 1.6, open: 1.2, rock: 0.8, chime: 1.4, bridge: 0.8 }, day: 1, night: 0.8, wx: { wind: 2.2, fog: 1.2 }, rare: 0.6 },
    skyfin:    { f: { water: 2.4, bridge: 2, reeds: 0.8, open: 0.6 }, day: 1, night: 0.6, wx: { wind: 2.4, rain: 1.6 }, rare: 0.4 },
    voltmoth:  { f: { lamp: 3, chime: 1.2, flowers: 0.8, metal: 1 }, day: 0.15, night: 2.4, wx: { wind: 1.6, rain: 1.8, clear: 0.8 }, rare: 0.35 },
    mossram:   { f: { tallgrass: 1.6, rock: 1.4, garden: 1, field: 1.2, tree: 0.6 }, day: 1, night: 0.7, wx: { rain: 1.4, fog: 1.1 }, rare: 0.45 }
  };
  EL3.forEach(function (d) {
    var key = d[0], e = { key: key, name: d[5][0][0], element: d[1] };
    if (d[2]) { e.element2 = d[2]; EL2[key] = d[2]; }
    SEED[key] = hash(list.length * 3.7 + 1.3);
    list.push(e);
    DEF[key] = DEF3[key]; STG[key] = STG3[key]; OUT[key] = d[3]; if (d[4]) FLY[key] = 1;
    BASEK[key] = ELK[d[1]]; AURA[key] = AURA[ELK[d[1]]];
    STAGES[key] = d[5];
    stages[key] = d[5].map(function (a) { return { name: a[0], desc: a[1] }; });
  });
  /* ---------- fourth wave (chapters 4 and 5: the coast and the copper city): sixteen kinds with bodies of their own.
     They come after the third wave in the list, so every earlier seed stays the same. */
  var CU = ['#ffd8a8', '#e09a58', '#b06a38', '#7e4626'];
  var NP4 = {
    spW: ['#ffffff', '#eef3f8', '#cdd8e4', '#a4b4c6'], spG: ['#dce6f0', '#b4c4d6', '#8ea2b8', '#6c8098'], spM: ['#ffffff', '#fffaf6', '#f0e4e0', '#d8c8c4'],
    mwB: ['#c8d8e8', '#8ea6c0', '#667e9c', '#4a5e7c'], mwC: ['#ffffff', '#f4f6f0', '#dcdccc', '#b8b8a4'], mwK: ['#fff0a0', '#f0c040', '#c89020', '#986a18'],
    bfB: ['#7ac0d0', '#3a7e9c', '#2a5a7c', '#1c3c5a'], bfC: ['#f0f8f0', '#d4ecdc', '#a8d0c0', '#80b0a0'], bfL: ['#fffbe0', '#ffe070', '#f0b030', '#b07818'], bfF: ['#bff0ff', '#8ad0e8', '#5aa8c8', '#3a80a8'],
    tcS: ['#fff4e8', '#f4d8c0', '#d8b090', '#b08868'], tcB: ['#ffb890', '#f07850', '#c85438', '#943a28'],
    crB: ['#fff0ec', '#ffd6cc', '#f4aea4', '#d88a84'], crC: ['#ffa08c', '#f2606a', '#c83e52', '#962a40'],
    djB: ['#ffffff', '#e8f0ff', '#c4d4f4', '#9cb0dc'], djR: ['#f0e4ff', '#c8b4f0', '#a08cd8', '#7a68b4'],
    ikB: ['#b8a8f0', '#7a64c8', '#56449e', '#3a2c74'], ikS: '#e4d8ff',
    btB: ['#d8b090', '#a87a58', '#7e5840', '#5a3e2c'], btC: ['#fffaf0', '#f4e6d0', '#dcc8a8', '#bca888'], btK: ['#b8e070', '#6aa840', '#3e7a2e', '#285a20'], btS: ['#ffffff', '#f4eef8', '#d0c4e0', '#a898c0'],
    smF: ['#e8e4f0', '#b8b0cc', '#8e86a8', '#6a6284'], smC: ['#ffffff', '#fbf8ff', '#e4dcef', '#c8bedc'], bulb: ['#ffffff', '#fff8c0', '#ffe070', '#e0b040'],
    bbS: ['#a8f0e0', '#40b8a8', '#2a8480', '#1c5a5c'], bbF: ['#fff6d0', '#f4e0a0', '#d8bc70', '#b09048'],
    wlB: ['#8ac8f0', '#3a78b8', '#2a5890', '#1c3a68'], wlY: ['#fffbe0', '#fff070', '#f0c840', '#c89a20'], wlC: ['#f0faff', '#d4ecfa', '#a8cce8', '#88acd0'],
    cpF: ['#b4a4b4', '#7a6a7c', '#584a5c', '#3c3040'], cpC: ['#fff0ec', '#f0c8c0', '#d4a098', '#b07a74'], cpB: ['#dcd0dc', '#b0a2b2', '#8a7c8c'],
    lwG: ['#ffffff', '#fffbe4', '#fff0b4', '#ecd48c'], lwBr: ['#fff0b0', '#e0b850', '#b08830', '#806020'],
    soB: ['#a8b0c8', '#6a7090', '#4c5070', '#363a54'], soF: ['#ffffff', '#f6f6fa', '#dcdeea', '#b8bcd0'], soY: ['#fffbe0', '#fff070', '#f0c840', '#c89a20'],
    rcF: ['#f4bc94', '#cc7c4c', '#9e5a36', '#703e26'], rcG: ['#d0ccc8', '#9a9692', '#72706c', '#52504c'], rcC: ['#fffaf2', '#f6e8d6', '#e0caae', '#c0a888'],
    msB: ['#6e6488', '#463c60', '#30284a', '#201a34'], msS: ['#e8ffff', '#8ff2ff', '#3cc8e0', '#2a98b0'], msF: ['#e4dcf4', '#b8acd8', '#9284b8', '#6e6094']
  };
  /* a copper wire with spring rings wound round it, from (x0,y0) to (x1,y1) */
  function coilT(p, x0, y0, x1, y1, n, r) {
    var j, m = 12; for (j = 0; j <= m; j++) p.rect(x0 + (x1 - x0) * j / m - 0.4, y0 + (y1 - y0) * j / m - 0.4, 0.9, 0.9, CU[2]);
    for (j = 0; j < n; j++) { var t = (j + 0.5) / n; p.ell(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, r * 0.38, CU); }
  }
  function bulbAt(p, x, y, r) { p.rect(x - r * 0.6, y + r * 0.7, r * 1.2, 1, CU[2]); p.ell(x, y, r, r * 1.1, NP4.bulb); p.px(x - 0.5, y, '#ff9a40'); p.px(x + 0.5, y - 0.5, '#ff9a40'); p.px(x - r * 0.5, y - r * 0.5, '#ffffff'); }
  var DEF4 = {
    seapup: function (p, f) { /* Seapup: a round seal pup with a spotted coat, big dark eyes and soft flippers */
      var W = NP4.spW, G = NP4.spG, M = NP4.spM, b = hop(p), wg = Math.sin(p.ph * 2) * 0.5, N = '#3a3440';
      function spot(x, y) { p.ell(x, y, 1, 0.7, [G[1], G[1]], true); }
      if (p.side) {
        p.ell(25.5, 26.5 + wg, 3, 1.3, G); p.ell(26.5, 24.8 + wg, 2.2, 1.1, G);
        p.ell(17.5, 21.5 + b, 8.5, 5.6, W);
        spot(20, 18.5 + b); spot(23, 21 + b); spot(16.5, 19 + b);
        p.ell(10.5, 15.5 + b, 6, 5.4, W);
        p.ell(6, 17.5 + b, 2.6, 1.9, M);
        p.rect(3.6, 16.4 + b, 1.4, 1, N);
        p.px(5.5, 19 + b, G[2]); p.px(7, 19.3 + b, G[2]);
        eye1(p, 8, 13.5 + b, true);
        p.blush(10, 17.5 + b, '#ff9ab0');
        p.ell(13.5, 25.6 + b * 0.5, 3.4, 1.5, G);
        return;
      }
      p.ell(11, 27, 3, 1.2, G); p.ell(21, 27, 3, 1.2, G);
      /* one pear-shaped body: the head sinks into the shoulders, as a seal's does */
      p.ell(16, 22 + b, 8, 5.6, W);
      p.ell(16, 18.5 + b, 7.4, 4.6, W);
      p.ell(7.8, 23.4 + b, 2, 3.2, G); p.ell(24.2, 23.4 + b, 2, 3.2, G);
      if (p.back) {
        p.ell(16, 14 + b, 7.2, 5.8, W);
        spot(13, 20 + b); spot(19, 22.5 + b); spot(16, 17.5 + b); spot(12.5, 12 + b); spot(19.5, 13.5 + b);
        return;
      }
      p.ell(16, 23.4 + b, 4.6, 3.4, M);
      spot(10, 20.5 + b); spot(22, 21.5 + b);
      p.ell(16, 14 + b, 7.2, 5.8, W);
      spot(11, 10.6 + b);
      eyes2(p, 11.5, 18.5, 12.2 + b, true);
      p.ell(16, 17 + b, 3.2, 1.9, M);
      p.rect(15.2, 15.7 + b, 1.6, 1, N);
      p.px(13.2, 17.4 + b, G[2]); p.px(12.4, 18 + b, G[2]); p.px(18.8, 17.4 + b, G[2]); p.px(19.6, 18 + b, G[2]);
      p.blush(9.2, 16 + b, '#ff9ab0'); p.blush(20.8, 16 + b, '#ff9ab0');
    },

    marshwick: function (p, f) { /* Marshwick: a reed heron chick on long legs, with a reed-green crest */
      var B = NP4.mwB, C = NP4.mwC, K = NP4.mwK, Lf = NP.lily, LG = '#d09a40', b = hop(p) * 0.6, sw = Math.sin(p.ph) * 0.5;
      if (p.side) {
        legsSide(p, [[16.5, 1, 1]], 22, 28, 1, LG, '#a87830');
        p.rect(14.5, 27.4, 3, 0.8, '#a87830');
        plume(p, 23, 19.5 + b, 0.35, 3.5, 1.6, [B, B], 0, 0.4);
        p.ell(18, 18.5 + b, 6.4, 5, B);
        p.ell(15, 19.5 + b, 3, 3.6, C);
        p.ell(12.5, 13 + b, 2.4, 3.6, C);
        plume(p, 14.5, 7.5 + b, -0.35, 5, 1.3, [Lf, Lf], 0.8 + sw, 0.5);
        p.ell(12, 9.6 + b, 4, 3.6, B);
        p.ell(11, 11 + b, 2.6, 1.8, C);
        p.rect(3.5, 10.6 + b, 5.5, 1.2, K[1]); p.rect(4, 11.8 + b, 5, 0.6, K[2]);
        eye1(p, 10, 8.4 + b, true);
        p.blush(11.5, 11.6 + b, '#ff9ab0');
        p.ell(20, 17.6 + b, 4.4, 3.4, [B[1], B[2], B[3]]);
        legsSide(p, [[18, 0, 0]], 22, 28, 1, LG, LG);
        p.rect(16, 27.4, 3, 0.8, LG);
        return;
      }
      feet2(p, 13.2, 17.8, 22.5, 1, 5.5, LG);
      feet2(p, 12.2, 16.8, 27.3, 3, 0.8, LG);
      p.ell(10.2, 18.5 + b, 2.6, 4.4, [B[1], B[2], B[3]]); p.ell(21.8, 18.5 + b, 2.6, 4.4, [B[1], B[2], B[3]]);
      p.ell(16, 18 + b, 6, 5.5, B);
      if (p.back) {
        p.ell(16, 23 + b, 2.4, 1.6, [B[2], B[3]]);
        plume(p, 16.5, 7 + b, -1.2, 5, 1.3, [Lf, Lf], 0.8 + sw, 0.5);
        p.ell(16, 10.5 + b, 4.8, 4.4, B);
        return;
      }
      p.ell(16, 19.4 + b, 3.4, 4, C);
      plume(p, 16.5, 7 + b, -1.2, 5, 1.3, [Lf, Lf], 0.8 + sw, 0.5);
      p.ell(16, 10.5 + b, 4.8, 4.4, B);
      p.ell(16, 12.2 + b, 3.4, 2.4, C);
      eyes2(p, 12.5, 17.5, 9.2 + b, true);
      p.ell(16, 13.4 + b, 1.2, 1.6, K); p.px(15.5, 14.8 + b, K[3]);
      p.blush(10.6, 12.4 + b, '#ff9ab0'); p.blush(19.4, 12.4 + b, '#ff9ab0');
    },

    bellfish: function (p, f) { /* Bellfish: a round night fish that carries a little glowing bell on a stalk */
      var B = NP4.bfB, C = NP4.bfC, L = NP4.bfL, Fn = NP4.bfF, fl = flyF(p), cy = 17 + Math.round(fl * 0.5 * 2) / 2, sw = Math.sin(p.ph * 2) * 0.6;
      function bell(x, y) {
        p.ell(x, y, 2.3, 2.2, L); p.rect(x - 2.6, y + 1.4, 5.2, 1, L[2]); p.ell(x, y + 2.8, 0.7, 0.7, [L[3], L[3]], true); p.px(x - 1, y - 1, '#ffffff');
      }
      if (p.side) {
        p.ell(26 + sw * 0.4, cy, 2.4, 4.2, Fn); p.ell(24.5, cy, 1.6, 2, [Fn[1], Fn[2]]);
        p.rect(10, cy - 9, 0.9, 4, B[2]); p.rect(8.5, cy - 10, 2, 0.9, B[2]);
        bell(7.5, cy - 11.5);
        p.tri(15, 21, cy - 5.5, 19, cy - 9, B[2], B[1]);
        p.ell(16, cy, 8.5, 6.5, B);
        p.ell(14.5, cy + 3, 6, 2.6, C);
        eye1(p, 9.5, cy - 2.8, true);
        p.rect(7.6, cy + 1.6, 1.5, 0.6, B[3]);
        p.blush(11, cy + 0.6, '#ff9ab0');
        p.ell(17, cy + 1 + sw, 3, 1.6, Fn);
        return;
      }
      p.ell(7.4, cy + 1 + sw, 2.4, 3, Fn); p.ell(24.6, cy + 1 - sw, 2.4, 3, Fn);
      p.rect(15.6, cy - 14.5, 0.8, 8, B[2]); p.px(15.5, cy - 15, B[2]);
      if (p.back) { bell(16, cy - 12); p.ell(16, cy, 8, 7.5, B); p.tri(14, 18, cy - 6, 16, cy - 9, B[2], B[1]); p.ell(16, cy + 7.6, 2.6, 1.4, Fn); return; }
      p.ell(16, cy, 8, 7.5, B);
      p.ell(16, cy + 3.4, 5, 3.4, C);
      bell(16, cy - 12);
      eyes2(p, 11.5, 18.5, cy - 2.6, true);
      smile(p, 14, cy + 1.4, B[3]);
      p.blush(9.6, cy + 0.6, '#ff9ab0'); p.blush(20.4, cy + 0.6, '#ff9ab0');
    },

    tidecrab: function (p, f) { /* Whelkit: a hermit crab that lives in a spiral whelk shell and waves one big claw */
      var S = NP4.tcS, B = NP4.tcB, b = hop(p), cl = Math.sin(p.ph * 2) > 0.6 ? -0.5 : 0;
      function whorl(cx, cy, r) {
        p.ell(cx, cy, r, r * 0.92, S);
        p.ell(cx + r * 0.08, cy - r * 0.06, r * 0.7, r * 0.64, [S[2], S[2]], true);
        p.ell(cx + r * 0.12, cy - r * 0.1, r * 0.56, r * 0.5, [S[0], S[1], S[1]]);
        p.ell(cx + r * 0.2, cy - r * 0.16, r * 0.3, r * 0.27, [S[2], S[2]], true);
        p.ell(cx + r * 0.24, cy - r * 0.2, r * 0.16, r * 0.14, [S[1], S[1]], true);
      }
      if (p.side) {
        legsSide(p, [[14, 1, 1], [10, 0, 1]], 23 + b, 28, 1.2, B[2], B[3]);
        p.tri(23, 27, 10 + b, 27.5, 5 + b, S[2], S[1]);
        whorl(19.5, 16 + b, 7.5);
        p.ell(11.5, 22 + b, 5, 3.6, B);
        p.rect(9.4, 15.5 + b, 1, 4, B[2]);
        eye1(p, 8.5, 13.6 + b, true);
        p.ell(6, 22.2 + b + cl, 3, 2.6, B); p.px(3.5, 21.2 + b + cl, B[3]); p.px(4, 21.6 + b + cl, B[3]);
        p.rect(8.2, 23.8 + b, 1.2, 0.6, B[3]);
        legsSide(p, [[15, 0, 0], [11, 1, 0]], 23 + b, 28, 1.2, B[2], B[3]);
        return;
      }
      if (p.back) {
        feet2(p, 10.5, 20, 24.5, 1.5, 3, B[2]);
        p.ell(8.5, 23.5 + b, 2.2, 2, B); p.ell(23.5, 23 + b + cl, 3, 2.6, B);
        p.tri(14.5, 17.5, 9 + b, 16, 3.5 + b, S[2], S[1]);
        whorl(16, 17 + b, 8.5);
        return;
      }
      p.tri(14.5, 17.5, 8 + b, 16, 3 + b, S[2], S[1]);
      whorl(16, 14.5 + b, 8);
      feet2(p, 11.5, 19, 24.5, 1.5, 3, B[2]);
      p.ell(16, 22 + b, 5.5, 3.6, B);
      p.rect(12.5, 16.5 + b, 1, 3.5, B[2]); p.rect(18.5, 16.5 + b, 1, 3.5, B[2]);
      eyes2(p, 12, 18, 14.6 + b, true);
      smile(p, 13.5, 21.4 + b, B[3]);
      p.ell(9, 23.5 + b, 2.2, 2, B);
      p.ell(23.5, 23 + b + cl, 3, 2.6, B); p.px(25.5, 21.6 + b + cl, B[3]); p.px(25, 22.2 + b + cl, B[3]);
      p.blush(10.4, 20.4 + b, '#ff9ab0'); p.blush(19.6, 20.4 + b, '#ff9ab0');
    },

    coralet: function (p, f) { /* Coralet: a little coral sprite with branching coral on its head and a fish tail */
      var B = NP4.crB, C = NP4.crC, fl = flyF(p), cy = 15 + Math.round(fl * 0.5 * 2) / 2, sw = Math.sin(p.ph * 2) * 0.6, PO = '#fffbe0';
      function branch(x, y, m) {
        plume(p, x, y, -1.57 + m * 0.35, 5, 0.9, [C, C], 0, 0.2);
        plume(p, x + m * 1, y - 2.4, -1.57 + m * 1.1, 2.6, 0.7, [C, C], 0, 0.2);
        plume(p, x + m * 0.2, y - 1.6, -1.57 - m * 0.7, 2, 0.7, [C, C], 0, 0.2);
        p.px(x + m * 1.8, y - 5, PO); p.px(x + m * 3.4, y - 3.6, PO);
      }
      function tail(x, y, m) {
        p.ell(x, y, 2.6, 2.8, B);
        p.ell(x - 2 + m, y + 2.6 + sw * 0.5, 1.8, 1, [C[0], C[1], C[2]]); p.ell(x + 2 + m, y + 2.6 - sw * 0.5, 1.8, 1, [C[0], C[1], C[2]]);
      }
      if (p.side) {
        tail(19, cy + 8.4, 1);
        plume(p, 17, cy - 4.5, -1.15, 4.5, 1.1, [C, C], 0, 0.3); plume(p, 19, cy - 6.5, -0.5, 2.4, 0.8, [C, C], 0, 0.3);
        p.px(21, cy - 7.5, PO); p.px(19, cy - 8.6, PO);
        p.ell(15.5, cy + 1, 6.6, 7, B);
        eye1(p, 10.5, cy - 0.6, true);
        p.px(10.5, cy + 3, C[3]); p.px(11.5, cy + 3.4, C[3]);
        p.blush(12.6, cy + 2.2, '#ff8a9a');
        p.ell(16, cy + 4, 2.6, 1.6, [B[1], B[2], B[3]]);
        p.px(18, cy - 2, PO); p.px(20, cy + 2, PO);
        return;
      }
      tail(16, cy + 8.4, 0);
      branch(12.5, cy - 4, -1); branch(19.5, cy - 4, 1);
      p.ell(8.6, cy + 3, 2.4, 1.6, B); p.ell(23.4, cy + 3, 2.4, 1.6, B);
      p.ell(16, cy + 1, 7, 7, B);
      if (p.back) { p.px(13, cy - 1, PO); p.px(18.5, cy + 1, PO); p.px(15.5, cy + 4, PO); p.ell(16, cy - 2, 3, 1.6, [B[0], B[0]], true); return; }
      eyes2(p, 12, 18, cy - 0.6, true);
      smile(p, 14, cy + 2.8, C[3]);
      p.blush(9.8, cy + 2.2, '#ff8a9a'); p.blush(20.2, cy + 2.2, '#ff8a9a');
      p.px(15.5, cy - 4.5, PO);
    },

    driftjelly: function (p, f) { /* Driftjelly: a jellyfish with a soft round bell and ribbon arms that drift on the breeze */
      var B = NP4.djB, R = NP4.djR, fl = flyF(p), cy = 12 + Math.round(fl * 0.6 * 2) / 2, i;
      function ribbons(x0, ang, spread, n, len) {
        for (i = 0; i < n; i++) { var o = i - (n - 1) / 2; plume(p, x0 + o * spread, cy + 5, ang + o * 0.1, len - Math.abs(o) * 1.2, 0.85, [R, R, [R[0], R[1]]], Math.sin(p.ph + i * 0.4) * 1.6, 0.4); }
      }
      if (p.side) {
        if (p.stage > 1) ribbons(14, 1.25, 1, 1, 10); else ribbons(16, 1.25, 2.6, 3, 10);
        p.ell(15.5, cy + 0.5, 7.5, 6.5, B);
        for (i = -3; i <= 3; i++) p.ell(15.5 + i * 2, cy + 5.6 + (i % 2 ? 0.4 : 0), 1.3, 1.2, R);
        p.ell(16.5, cy - 2.6, 3, 1.6, [B[0], B[0]], true);
        eye1(p, 9.6, cy - 0.4, true);
        p.blush(11.4, cy + 2, '#ff9ab0');
        p.px(9, cy + 2.6, R[3]);
        return;
      }
      /* grown forms add their own long outer ribbons; the inner ones stay few so the gaps between them stay open */
      if (p.stage > 1) ribbons(16, 1.57, 6, 2, 11); else ribbons(16, 1.57, 3.2, 4, 11);
      p.ell(16, cy + 0.5, 8, 6.5, B);
      for (i = -3; i <= 3; i++) p.ell(16 + i * 2.2, cy + 5.6 + (i % 2 ? 0.4 : 0), 1.4, 1.2, R);
      p.ell(16, cy - 2.6, 3.2, 1.6, [B[0], B[0]], true);
      if (p.back) { p.ell(16, cy + 1, 4, 2.4, [B[2], B[2]], true); p.ell(16, cy + 1, 2.6, 1.4, [B[1], B[1]], true); return; }
      eyes2(p, 12, 18, cy - 0.4, true);
      smile(p, 14, cy + 2.4, R[3]);
      p.blush(9.6, cy + 2, '#ff9ab0'); p.blush(20.4, cy + 2, '#ff9ab0');
    },

    inkling: function (p, f) { /* Inkpip: a little night squid with a pointed hood and curling arms */
      var B = NP4.ikB, Sp = NP4.ikS, fl = flyF(p), cy = 14 + Math.round(fl * 0.6 * 2) / 2, i;
      function arms(x0, ang, spread) {
        for (i = 0; i < 5; i++) { var o = i - 2; plume(p, x0 + o * spread, cy + 5.5, ang + o * 0.3, 7.5 - Math.abs(o) * 0.8, 1.3, [B, B, [B[0], B[1]]], Math.sin(p.ph + i * 0.5) * 1.4 + o * 0.9, 0.55); }
      }
      if (p.side) {
        arms(14, 1.15, 2.2);
        p.ell(19.5, cy - 5, 2.4, 1.4, B);
        p.tri(10, 21, cy - 1, 17.5, cy - 10.5, B[1], B[0]);
        p.ell(15, cy + 2, 6, 5.5, B);
        p.ell(11.5, cy + 2.2, 2.6, 3, [B[0], B[0], B[1]]);
        eye1(p, 10, cy + 0.2, true);
        p.px(9, cy + 3.6, B[3]);
        p.blush(12, cy + 3, '#ff9ab0');
        p.px(17, cy - 4, Sp); p.px(16, cy - 1, Sp);
        return;
      }
      arms(16, 1.57, 2.4);
      p.ell(10.6, cy - 5, 2.4, 1.4, B); p.ell(21.4, cy - 5, 2.4, 1.4, B);
      p.tri(10, 22, cy - 1, 16, cy - 11, B[1], B[0]);
      p.ell(16, cy + 2, 6.6, 5.5, B);
      if (p.back) { p.px(14, cy - 4, Sp); p.px(17.5, cy - 6, Sp); p.px(16, cy, Sp); p.px(13, cy + 3, Sp); p.px(19, cy + 2, Sp); return; }
      p.ell(16, cy + 2.2, 4.6, 3.4, [B[0], B[0], B[1]]);
      eyes2(p, 12, 18, cy + 0.2, true);
      p.rect(15.5, cy + 3.6, 1, 0.8, B[3]);
      p.blush(9.6, cy + 3, '#ff9ab0'); p.blush(20.4, cy + 3, '#ff9ab0');
      p.px(16, cy - 6, Sp); p.px(14.5, cy - 3.5, Sp); p.px(17.5, cy - 3.5, Sp);
    },

    brinetail: function (p, f) { /* Brinetail: a sea otter in a kelp scarf that keeps a favourite shell close */
      var B = NP4.btB, C = NP4.btC, K = NP4.btK, Sh = NP4.btS, b = hop(p), sw = Math.sin(p.ph - 1) * 1.5, N = '#3a2420';
      function shell(x, y) { p.ell(x, y, 2.4, 1.9, Sh); p.px(x - 1, y - 0.5, Sh[2]); p.px(x, y - 0.8, Sh[2]); p.px(x + 1, y - 0.5, Sh[2]); }
      if (p.side) {
        p.ell(26 + sw * 0.3, 25 + b + sw / 3, 5, 1.8, B);
        legsSide(p, [[20, 1, 1], [13, 0, 1]], 24 + b, 28, 2.4, B[2], B[3]);
        p.ell(17, 21 + b, 7, 5.6, B);
        p.ell(13.5, 22 + b, 3.4, 4, C);
        plume(p, 15, 17.8 + b, 0.7, 4.5, 1.1, [K, K], 1 + sw * 0.4, 0.4);
        p.ell(13.5, 17.5 + b, 3.4, 1.4, K);
        shell(10.5, 20.6 + b);
        legsSide(p, [[21, 0, 0], [14, 1, 0]], 24 + b, 28, 2.6, B[2], B[3]);
        p.ell(13.5, 8.8 + b, 1.4, 1.4, B);
        p.ell(11, 13 + b, 5.6, 5, B);
        p.ell(7.5, 14.6 + b, 3, 2.6, C);
        p.rect(3.8, 13.4 + b, 1.6, 1.2, N);
        eye1(p, 8, 10.8 + b, true);
        p.px(5.5, 16.4 + b, B[2]); p.px(4.5, 16.8 + b, B[2]);
        p.blush(9.6, 14.4 + b, '#ff9ab0');
        return;
      }
      if (!p.back) p.ell(24 + sw * 0.3, 25.5 + b + sw / 2, 4.6, 1.8, B);
      p.ell(16, 21 + b, 6.5, 6, B);
      feet2(p, 11, 18, 26, 3, 2, B[3]);
      if (p.back) {
        p.ell(16, 17 + b, 6, 1.4, K);
        plume(p, 15, 17.5 + b, 1.8, 4, 1, [K, K], sw * 0.5, 0.4); plume(p, 17, 17.5 + b, 1.35, 4, 1, [K, K], -sw * 0.5, 0.4);
        p.ell(10, 8.5 + b, 1.4, 1.4, B); p.ell(22, 8.5 + b, 1.4, 1.4, B);
        p.ell(16, 12 + b, 6.6, 5.4, B);
        p.ell(16, 26 + b, 4, 2, B);
        return;
      }
      p.ell(16, 22.4 + b, 4, 4.2, C);
      shell(16, 21.6 + b);
      p.ell(13, 20.8 + b, 1.5, 1.2, B[2]); p.ell(19, 20.8 + b, 1.5, 1.2, B[2]);
      p.ell(16, 17.2 + b, 6, 1.4, K);
      plume(p, 20, 17.6 + b, 1.2, 3.5, 1, [K, K], sw * 0.4, 0.4);
      p.ell(10, 8.5 + b, 1.4, 1.4, B); p.ell(22, 8.5 + b, 1.4, 1.4, B);
      p.ell(16, 12 + b, 6.6, 5.4, B);
      p.ell(16, 13.6 + b, 5, 3.6, C);
      eyes2(p, 12, 18, 10.6 + b, true);
      p.rect(15, 13.4 + b, 2, 1.2, N); p.px(15.5, 14.6 + b, N);
      p.px(12, 14.6 + b, B[2]); p.px(11, 15 + b, B[2]); p.px(20, 14.6 + b, B[2]); p.px(21, 15 + b, B[2]);
      p.blush(9.4, 14 + b, '#ff9ab0'); p.blush(20.6, 14 + b, '#ff9ab0');
    },

    sparkmouse: function (p, f) { /* Whiskwatt: a harvest mouse with copper whiskers and a coiled wire tail that ends in a tiny bulb */
      var F = NP4.smF, C = NP4.smC, b = hop(p), sw = Math.sin(p.ph) * 0.6, PK = '#f0b0bc', bg = p.stage >= 3 ? 0.6 : 0;
      function ear(x, y) { p.ell(x, y, 3.2, 3.2, F); p.ell(x, y + 0.3, 2, 2, [PK, PK], true); p.px(x - 1, y - 3, CU[1]); p.px(x, y - 3.2, CU[1]); p.px(x + 1, y - 3, CU[1]); }
      if (p.side) {
        coilT(p, 23.5, 23 + b, 27 + sw, 14 + b, 6, 1.7); bulbAt(p, 27 + sw, 11.4 + b - bg, 1.7 + bg);
        legsSide(p, [[20, 1, 1], [15, 0, 1]], 24 + b, 28, 1.6, F[2], F[3]);
        p.ell(18, 21.5 + b, 6.6, 4.8, F);
        p.ell(15, 22.5 + b, 3, 3, C);
        ear(12.5, 9.5 + b);
        p.ell(10.5, 15 + b, 5, 4.4, F);
        p.ell(6.5, 16.5 + b, 2.4, 1.6, C);
        p.px(4.3, 16 + b, '#e07a8a');
        eye1(p, 8.5, 13.4 + b, true);
        p.rect(3.6, 17.6 + b, 3, 0.6, CU[1]); p.rect(4, 18.6 + b, 2.6, 0.6, CU[2]);
        p.blush(10, 16.8 + b, '#ff9ab0');
        legsSide(p, [[21, 0, 0], [16, 1, 0]], 24 + b, 28, 1.6, F[1], F[2]);
        return;
      }
      if (!p.back) { coilT(p, 21, 24 + b, 26 + sw, 17 + b, 5, 1.6); bulbAt(p, 26 + sw, 14.6 + b - bg, 1.7 + bg); }
      p.ell(16, 21.5 + b, 6, 5.4, F);
      feet2(p, 12, 17.5, 26, 2.5, 2, PK);
      ear(10, 8.2 + b); ear(22, 8.2 + b);
      p.ell(16, 13 + b, 6.4, 5.4, F);
      if (p.back) { coilT(p, 16, 25 + b, 23 + sw, 16 + b, 6, 1.7); bulbAt(p, 23 + sw, 13.4 + b - bg, 1.7 + bg); return; }
      p.ell(16, 22.5 + b, 3.6, 3.6, C);
      p.ell(16, 15.6 + b, 2.6, 1.6, C);
      p.px(15.5, 14.8 + b, '#e07a8a'); p.px(16, 14.8 + b, '#e07a8a');
      eyes2(p, 12.5, 17.5, 11.6 + b, true);
      p.rect(8.4, 15.4 + b, 3, 0.6, CU[1]); p.rect(8.8, 16.6 + b, 2.6, 0.6, CU[2]);
      p.rect(20.6, 15.4 + b, 3, 0.6, CU[1]); p.rect(20.6, 16.6 + b, 2.6, 0.6, CU[2]);
      p.blush(10, 14 + b, '#ff9ab0'); p.blush(20, 14 + b, '#ff9ab0');
    },

    boltbug: function (p, f) { /* Boltbug: a round beetle whose copper horn works like a little lightning rod */
      var S = NP4.bbS, Fc = NP4.bbF, b = hop(p) * 0.5, LC = '#26303a';
      function legs(xs, y) { xs.forEach(function (x, j) { var u = p.mode === 'move' && ((j + (p.gp > 3.14 ? 1 : 0)) % 2) ? -0.5 : 0; p.rect(x, y + u, 1, 2.6, LC); }); }
      if (p.side) {
        legs([13, 17, 21], 24.5);
        p.ell(19, 19.5 + b, 7.5, 5.8, S);
        p.ell(16.5, 16.5 + b, 2.2, 1.2, [S[0], S[0]], true);
        p.rect(19, 14 + b, 7, 0.8, S[3]);
        p.ell(11, 21.5 + b, 4, 3.6, Fc);
        plume(p, 9.5, 18.5 + b, -1.9, 6.5, 1, [CU, CU], -1.2, 0.2);
        p.ell(7.6, 11.6 + b, 1.4, 1.4, CU);
        eye1(p, 8.4, 20 + b, true);
        p.px(8, 23.4 + b, Fc[3]);
        p.blush(10.4, 22.8 + b, '#ff9ab0');
        legs([12, 16, 20], 25);
        return;
      }
      legs([8.5, 22.5], 21); legs([10, 21], 23.5);
      if (p.back) {
        p.rect(15.5, 9 + b, 1, 4, CU[2]); p.ell(16, 8.5 + b, 1.5, 1.5, CU);
        p.ell(16, 18.5 + b, 8.5, 7.5, S);
        p.rect(15.6, 11.5 + b, 0.8, 14, S[3]);
        p.ell(12.5, 15 + b, 1.6, 1, [S[0], S[0]], true); p.ell(19.5, 15 + b, 1.6, 1, [S[0], S[0]], true);
        return;
      }
      p.ell(16, 17.5 + b, 8, 6.5, S);
      p.ell(11.5, 14.5 + b, 1.8, 1.1, [S[0], S[0]], true);
      p.rect(15.4, 10 + b, 1.2, 8, CU[2]); p.rect(15.4, 10 + b, 0.6, 8, CU[1]);
      p.ell(16, 9.4 + b, 1.6, 1.6, CU);
      p.ell(16, 22 + b, 5.4, 4.2, Fc);
      eyes2(p, 12.5, 17.5, 20.4 + b, true);
      p.rect(15.5, 24.4 + b, 1, 0.6, Fc[3]);
      p.blush(10.8, 23.2 + b, '#ff9ab0'); p.blush(19.2, 23.2 + b, '#ff9ab0');
    },

    wireling: function (p, f) { /* Wireling: a small eel with bright stripes that hums with a soft current */
      var B = NP4.wlB, Y = NP4.wlY, C = NP4.wlC, fl = flyF(p), sw = Math.sin(p.ph) * 0.6, i, n = 11;
      function body(pt) {
        for (i = n; i >= 1; i--) {
          var t = i / n, q = pt(t), r = 3.3 * (1 - 0.62 * t);
          p.ell(q[0], q[1], r, r, B);
          if (i % 3 === 1) p.ell(q[0], q[1] - r * 0.35, r * 0.55, r * 0.3, [Y[0], Y[1], Y[2]], true);
        }
        var e = pt(1); p.ell(e[0], e[1], 1.6, 1.2, [Y[1], Y[2]]);
      }
      if (p.side) {
        body(function (t) { return [9 + t * 19, 13 + fl + t * 9 + Math.sin(t * 6 + p.ph) * 2.6 * t]; });
        p.ell(13, 9.8 + fl, 1.6, 1.2, Y);
        p.ell(9.5, 13 + fl, 5, 4.6, B);
        p.ell(8, 15 + fl, 2.8, 1.8, C);
        eye1(p, 7, 11.4 + fl, true);
        p.px(5.4, 15.2 + fl, B[3]);
        p.blush(9, 14.6 + fl, '#ff9ab0');
        return;
      }
      body(function (t) { return [16 + Math.sin(t * 4.6 + 0.6 + sw) * 7 * Math.min(1, t * 1.6), 13 + fl + t * 13]; });
      p.ell(10.2, 10.4 + fl, 1.6, 2.6, Y); p.ell(21.8, 10.4 + fl, 1.6, 2.6, Y);
      p.ell(16, 12 + fl, 5.6, 4.8, B);
      if (p.back) { p.ell(16, 10.6 + fl, 2.6, 1, [Y[1], Y[2]], true); return; }
      p.ell(16, 13.8 + fl, 3.6, 2.4, C);
      eyes2(p, 12.5, 17.5, 10.4 + fl, true);
      smile(p, 14, 13.6 + fl, B[3]);
      p.blush(10.2, 13.6 + fl, '#ff9ab0'); p.blush(19.8, 13.6 + fl, '#ff9ab0');
    },

    copperpup: function (p, f) { /* Copperpup: a velvet mole with copper digging claws and a copper plate on its brow */
      var F = NP4.cpF, C = NP4.cpC, Bl = NP4.cpB, b = hop(p), dg = p.mode === 'move' ? Math.round(Math.sin(p.gp) * 2) / 2 : 0;
      function claw(x, y, m) { p.ell(x, y, 2.6, 2, CU); for (var j = -1; j <= 1; j++) p.px(x + j * 1.2, y + 1.8, CU[3]); }
      if (p.side) {
        legsSide(p, [[21, 1, 1]], 24 + b, 28, 2, F[2], F[3]);
        p.px(26.5, 21 + b, F[2]);
        p.ell(18, 21 + b, 8, 5.5, F);
        p.ell(16, 23 + b, 4, 3, Bl);
        p.ell(10.5, 16 + b, 5, 4.6, F);
        p.ell(11, 11.8 + b, 2, 1, CU);
        p.ell(5.8, 17.5 + b, 2.4, 1.6, C);
        p.ell(4, 17.2 + b, 1, 0.9, ['#f08a9a', '#e07080']);
        eye1(p, 8.5, 14.6 + b, false);
        p.blush(9.6, 17.6 + b, '#ff9ab0');
        claw(9.5 + dg, 24.6 + b, -1);
        legsSide(p, [[22, 0, 0]], 24 + b, 28, 2, F[1], F[2]);
        return;
      }
      p.ell(16, 21 + b, 7.5, 6, F);
      feet2(p, 11.5, 18, 26, 2.5, 2, C[2]);
      if (p.back) { p.ell(16, 13.5 + b, 6.6, 5.2, F); p.ell(16, 9.8 + b, 2.2, 1.2, CU); p.px(16, 27 + b, F[3]); claw(8.8, 23 + b - dg, -1); claw(23.2, 23 + b + dg, 1); return; }
      p.ell(16, 22.5 + b, 4.5, 4, Bl);
      claw(8.8, 23 + b - dg, -1); claw(23.2, 23 + b + dg, 1);
      p.ell(16, 13.5 + b, 6.6, 5.2, F);
      p.ell(16, 9.6 + b, 2.2, 1.2, CU); p.px(16, 9.4 + b, '#fff070');
      p.ell(16, 16.4 + b, 2.6, 1.8, C);
      p.ell(16, 15.8 + b, 1.2, 0.9, ['#f08a9a', '#e07080']);
      eyes2(p, 12.5, 17.5, 12.6 + b, false);
      p.blush(10.4, 15 + b, '#ff9ab0'); p.blush(19.6, 15 + b, '#ff9ab0');
    },

    lampwisp: function (p, f) { /* Lampwisp: a little glass globe with a warm glowing heart and a brass cap */
      var G = NP4.lwG, Br = NP4.lwBr, fl = flyF(p), cy = 15 + Math.round(fl * 0.5 * 2) / 2, sw = Math.sin(p.ph * 1.5) * 1.6, HT = ['#ffd890', '#ff9a40'];
      function heart(x, y) { p.ell(x - 0.8, y, 1, 1, HT, true); p.ell(x + 0.8, y, 1, 1, HT, true); p.tri(x - 1.6, x + 1.6, y + 0.4, x, y + 2.2, HT[1]); }
      function cap(x) { p.rect(x - 3.5, cy - 8.8, 7, 2.2, Br[1]); p.rect(x - 3.5, cy - 7.6, 7, 0.6, Br[2]); p.ell(x, cy - 10, 1.4, 1, Br); p.px(x, cy - 10, Br[3]); }
      if (p.side) {
        plume(p, 17, cy + 5.5, 1.25, 6, 2.4, [G, G, [G[1], G[2]]], sw, 0.8);
        p.ell(16, cy, 7.2, 7.4, G);
        cap(16.5);
        heart(17, cy + 3);
        p.rect(18.5, cy - 4.6, 1, 2.4, '#ffffff');
        eye1(p, 10.5, cy - 2, true);
        p.px(10.5, cy + 1.6, Br[2]); p.px(11.5, cy + 2, Br[2]);
        p.blush(12.6, cy + 0.8, '#ffb070');
        p.ell(16, cy + 2, 1.8, 1.2, G);
        return;
      }
      plume(p, 16, cy + 6, 1.57, 5.5, 2.4, [G, G, [G[1], G[2]]], sw, 0.8);
      p.ell(8, cy + 1.5, 1.6, 1.2, G); p.ell(24, cy + 1.5, 1.6, 1.2, G);
      p.ell(16, cy, 7.5, 7.5, G);
      cap(16);
      heart(16, cy + 4);
      if (p.back) { p.rect(19.5, cy - 4.6, 1, 2.4, '#ffffff'); return; }
      p.rect(11, cy - 4.8, 1, 2.4, '#ffffff');
      eyes2(p, 12.5, 17.5, cy - 2.4, true);
      p.px(15, cy + 0.8, Br[2]); p.px(16, cy + 1.2, Br[2]); p.px(17, cy + 0.8, Br[2]);
      p.blush(10, cy + 0.6, '#ffb070'); p.blush(20, cy + 0.6, '#ffb070');
    },

    stormowl: function (p, f) { /* Stormowl: a slender slate owl with a heart-shaped pale face and lightning ear tufts */
      var B = NP4.soB, Fc = NP4.soF, Y = NP4.soY, fl = flyF(p), BL = ['#e8eaf2', '#c8ccdc', '#a4a8c0', '#8488a4'];
      /* a two-step lightning zigzag; it grows taller with each stage */
      function tuft(x, m) { var g = (p.stage - 1) * 0.7; p.tri(x - 1.2, x + 1.2, 8 + fl * 0.3, x + m * 0.8, 5.5 + fl * 0.3 - g * 0.4, Y[2], Y[1]); p.tri(x + m * 0.2 - 1, x + m * 0.2 + 1, 6 + fl * 0.3 - g * 0.4, x + m * 1.8, 2.8 + fl * 0.3 - g, Y[2], Y[1]); }
      if (p.side) {
        plume(p, 21.5, 24, 0.9, 3.5, 1.7, [B, B], 0, 0.4);
        p.ell(17, 19, 6, 7, B);
        p.ell(14.5, 21, 3.2, 4.4, BL);
        tuft(15, 1);
        p.ell(13, 11.5, 5.4, 5.2, B);
        p.ell(10.2, 12.2, 3.2, 4.2, Fc);
        eye1(p, 8.8, 10.8, true);
        p.px(7.4, 13.6, '#d0a050'); p.px(7.4, 14.4, '#b08038');
        p.blush(10.6, 14.4, '#ff9ab0');
        p.ell(19.5, 18.5 + fl, 4.4, 6, [B[1], B[2], B[3]]);
        p.px(19, 16 + fl, B[0]); p.px(21, 19 + fl, B[0]); p.px(18.5, 21 + fl, B[0]);
        p.rect(14.5, 26, 1.4, 1.6, Y[2]); p.rect(16.6, 26, 1.4, 1.6, Y[3]);
        return;
      }
      p.ell(8.4, 18.5 + fl * 0.6, 3.2, 6, [B[1], B[2], B[3]]); p.ell(23.6, 18.5 + fl * 0.6, 3.2, 6, [B[1], B[2], B[3]]);
      p.ell(16, 19.5, 6.5, 7, B);
      p.rect(13, 26, 1.5, 1.6, Y[2]); p.rect(17.5, 26, 1.5, 1.6, Y[2]);
      tuft(11, -1); tuft(21, 1);
      p.ell(16, 11.6, 6.8, 5.6, B);
      if (p.back) { p.px(14, 18, B[0]); p.px(18, 20, B[0]); p.px(15.5, 22.5, B[0]); p.ell(16, 24.5, 2.4, 2, [B[2], B[3]]); return; }
      p.ell(16, 21.5, 4, 4.6, BL);
      p.px(14.5, 20, BL[3]); p.px(17.5, 21.5, BL[3]); p.px(15, 23.5, BL[3]);
      p.ell(13.5, 11.6, 3.3, 3.8, Fc); p.ell(18.5, 11.6, 3.3, 3.8, Fc);
      p.tri(11.5, 20.5, 14, 16, 16.8, Fc[1]);
      eyes2(p, 12.5, 17.5, 10.6, true);
      p.px(15.5, 13.8, '#d0a050'); p.px(16, 13.8, '#d0a050'); p.px(15.5, 14.6, '#b08038');
      p.blush(10.6, 14, '#ff9ab0'); p.blush(19.4, 14, '#ff9ab0');
    },

    rustcat: function (p, f) { /* Rustcat: a lean city stray with a rust coat, one notched ear and a wire-wrapped tail */
      var F = NP4.rcF, G = NP4.rcG, C = NP4.rcC, b = hop(p), sw = Math.sin(p.ph) * 1.2, IN = '#f0a8a0';
      function tailTip(x, y) { coilT(p, x - 0.6, y + 1.2, x + 0.6, y - 1.2, 3, 1.4); p.px(x + 1, y - 2.6, '#fff070'); }
      if (p.side) {
        plume(p, 24.5, 19.5 + b, -1.35, 7, 1.3, [F, F, G], 2.6 + sw, 0.2);
        tailTip(27 + sw * 0.6, 12.6 + b);
        legsSide(p, [[22, 1, 1], [14, 0, 1]], 23 + b, 28, 1.6, F[2], F[3], [C[2], C[3]]);
        p.ell(18, 21 + b, 7, 4, F);
        p.ell(20, 19.4 + b, 3, 1.8, G);
        p.ell(13.5, 22.6 + b, 2.6, 2.2, C);
        p.tri(10.5, 13.5, 11 + b, 12.6, 5.5 + b, F[2], IN);
        p.ell(10, 14.5 + b, 4.8, 4.4, F);
        p.ell(6.3, 16 + b, 2, 1.4, C);
        p.px(4.5, 15.2 + b, '#d07080');
        eye1(p, 8, 13 + b, true);
        p.rect(3.8, 17 + b, 2.6, 0.5, G[0]);
        p.blush(9.6, 16.4 + b, '#ff9ab0');
        legsSide(p, [[21, 0, 0], [13, 1, 0]], 23 + b, 28, 1.8, F[1], F[2], [C[1], C[2]]);
        return;
      }
      if (!p.back) { plume(p, 21.5, 24 + b, -1.15, 8, 1.4, [F, F, G], 2 + sw, 0.2); tailTip(26 + sw * 0.6, 14.4 + b); }
      p.ell(16, 21.5 + b, 5.6, 5.2, F);
      feet2(p, 12.5, 17.5, 26, 2.5, 2, C[1]);
      p.tri(9.5, 13.5, 10.5 + b, 10, 4.5 + b, F[2], p.back ? F[2] : IN);
      p.tri(18.5, 22.5, 10.5 + b, 22, 4.5 + b, F[2], p.back ? F[2] : IN);
      p.px(21, 5.8 + b, F[3]); p.px(21.5, 6.6 + b, F[3]);
      p.ell(16, 13.5 + b, 6.4, 5, F);
      if (p.back) {
        p.ell(14, 12 + b, 2.6, 2, G); p.rect(14.5, 18 + b, 3, 0.8, F[3]); p.rect(14, 21 + b, 4, 0.8, F[3]);
        plume(p, 16, 25 + b, -1.25, 8, 1.4, [F, F, G], 2 + sw, 0.2); tailTip(20.5 + sw * 0.6, 15.6 + b);
        return;
      }
      p.ell(16, 22.5 + b, 3, 3.4, C);
      p.ell(19.2, 12 + b, 2.6, 2, G);
      eyes2(p, 12.5, 17.5, 12 + b, true);
      p.ell(16, 15.8 + b, 2.4, 1.4, C);
      p.px(15.5, 15 + b, '#d07080'); p.px(16, 15 + b, '#d07080');
      p.rect(8.6, 15.2 + b, 2.6, 0.5, G[0]); p.rect(20.8, 15.2 + b, 2.6, 0.5, G[0]);
      p.blush(10.2, 14.6 + b, '#ff9ab0'); p.blush(19.8, 14.6 + b, '#ff9ab0');
    },

    mothspark: function (p, f) { /* Mothspark: a sooty caterpillar with a fluffy collar and spark-blue spots; it grows wings later */
      var B = NP4.msB, S = NP4.msS, F = NP4.msF, b = hop(p) * 0.6, i;
      function spot(x, y) { p.ell(x, y, 1.1, 1.1, S, true); }
      function collar(cx, cy, rx) { for (i = 0; i < 9; i++) { var a = 0.2 + i / 8 * 2.74; p.ell(cx + Math.cos(a) * rx, cy + Math.sin(a) * 1.6, 1.7, 1.5, F); } }
      function ant(x, y, m) { p.rect(x, y, 0.8, 2.6, B[3]); p.ell(x + 0.4 + m * 0.6, y - 0.4, 1, 1, S, true); }
      if (p.side) {
        for (i = 0; i < 4; i++) p.rect(12 + i * 3.6, 26.2, 1.4, 1.6, B[3]);
        p.ell(23, 24 + b * 0.5, 3.4, 2.8, B); p.ell(19, 23 + b * 0.7, 4, 3.4, B); p.ell(14.5, 21.5 + b, 4.4, 4, B);
        spot(23, 22.6); spot(19, 21); spot(15, 19.5 + b);
        ant(10.5, 8 + b, -1);
        collar(10, 18 + b, 4);
        p.ell(9.5, 14.5 + b, 5, 4.6, B);
        eye1(p, 6.8, 13.4 + b, true);
        p.px(5.4, 17 + b, F[2]);
        p.blush(8.6, 16.4 + b, '#ff9ab0');
        return;
      }
      for (i = 0; i < 4; i++) p.rect(10.6 + i * 3.2, 26.4, 1.4, 1.4, B[3]);
      p.ell(16, 22 + b, 7, 5.6, B);
      p.rect(10, 21 + b, 12, 0.6, B[3]); p.rect(10.6, 24 + b, 10.8, 0.6, B[3]);
      spot(11.5, 22.6 + b); spot(20.5, 22.6 + b);
      ant(12.6, 6.4 + b, -1); ant(18.6, 6.4 + b, 1);
      collar(16, 17.4 + b, 6.4);
      p.ell(16, 12.8 + b, 6.2, 5.2, B);
      if (p.back) { spot(16, 10.6 + b); spot(13, 22 + b); spot(19, 22 + b); return; }
      p.ell(16, 14 + b, 4.2, 3, [F[1], F[1], F[2]]);
      eyes2(p, 12.5, 17.5, 11.6 + b, true);
      smile(p, 14, 14.6 + b, B[2]);
      p.blush(10.2, 14.6 + b, '#ff9ab0'); p.blush(19.8, 14.6 + b, '#ff9ab0');
    }
  };
  var STG4 = {
    seapup: gstg(function (p, f, s, L, d, b) {
      var Wt = EP.water[1], Fm = EP.water[0], Fp = [Wt, Wt, Fm], sw = Math.sin(p.ph) * 0.8, i;
      if (L === 'back') {
        /* a fin of sea water rises along its back, taller each stage */
        if (s >= 3) {
          var n = s - 1;
          if (d === 2) for (i = 0; i < n; i++) plume(p, 15 + i * 2.6, 16.5 + b + i * 0.6, -1.2, 3 + s * 0.9 - i * 0.4, 1.4, Fp, -1 + sw * 0.3, 0.5);
          else for (i = 0; i < n; i++) { var o = i - (n - 1) / 2; plume(p, 16 + o * 2.6, 9 + Math.abs(o) * 1.4 + b, -1.57 + o * 0.35, 3 + s * 0.9 - Math.abs(o) * 0.5, 1.4, Fp, 0.8 + sw * 0.3, 0.5); }
        }
        return;
      }
      /* a curl of sea foam on its head from stage 2, and a foam collar from stage 4 */
      if (s >= 2) {
        var cx = d === 2 ? 10.5 : 16, cyy = (d === 2 ? 10 : 8.4) + b, r = 1.1 + s * 0.3;
        p.ell(cx, cyy, r, r, Fm); p.ell(cx + r * 0.3, cyy + r * 0.2, r * 0.5, r * 0.5, [Wt[0], Wt[1]], true);
      }
      if (s >= 4) {
        if (d === 2) { for (i = 0; i < 3; i++) p.ell(13 + i * 1.8, 19.4 + b + i * 0.2, 1.3, 1.1, Fm); }
        else for (i = -3; i <= 3; i++) p.ell(16 + i * 1.9, 19.6 + b + Math.abs(i) * 0.3, 1.3, 1.1, Fm);
      }
    }),
    marshwick: gstg(function (p, f, s, L, d, b) {
      var B = NP4.mwB, C = NP4.mwC, Lf = NP.lily, sw = Math.sin(p.ph) * 0.8, i;
      b *= 0.6;
      if (L === 'back') {
        /* reed-green flight feathers from stage 3; long white plumes trail from its back from stage 4 */
        if (s >= 3) {
          var ln = 2 + s * 1.2;
          if (d === 2) for (i = 0; i < 2; i++) plume(p, 22, 16 + b + i * 1.5, -0.2 + i * 0.35, ln - i, 1.6, [B, B, Lf], sw * 0.5, 0.5);
          else [-1, 1].forEach(function (m) { for (i = 0; i < 2; i++) plume(p, 16 + m * 7.5, 15 + b + i * 1.6, m > 0 ? 1.0 + i * 0.3 : Math.PI - 1.0 - i * 0.3, ln - i, 1.6, [B, B, Lf], m * sw * 0.5, 0.5); });
        }
        if (s >= 4) {
          if (d === 2) for (i = 0; i < 2; i++) plume(p, 22, 20 + b, 0.5 + i * 0.3, 3 + s, 1, [C, C], 1.4 + sw, 0.3);
          else if (d === 1) for (i = -1; i <= 1; i += 2) plume(p, 16 + i * 3, 21 + b, 1.57 + i * 0.35, 2 + s, 1, [C, C], i * (1 + sw), 0.3);
        }
        return;
      }
      /* the crest grows: one more reed blade each stage */
      if (s >= 2) {
        var n = Math.min(3, s - 1), hx = d === 2 ? 14 : 16.5, hy = 7.4 + b;
        for (i = 0; i < n; i++) plume(p, hx + (d === 2 ? 0.5 : -0.6) * i, hy + i * 0.6, (d === 2 ? -0.1 : -1.0) + i * 0.3, 3 + s * 0.6 - i * 0.6, 0.9, [Lf, Lf], 0.8 + sw * 0.5, 0.5);
      }
      if (s >= 5 && d !== 1) { var cx = d === 2 ? 12.5 : 16, cy2 = (d === 2 ? 6.4 : 6.2) + b; p.ell(cx, cy2, 1.2, 1.2, ['#fff0f6', '#ffc0d8', '#ff90b8']); p.px(cx, cy2, '#ffe070'); }
    }),
    bellfish: gstg(function (p, f, s, L, d, b) {
      var Fn = NP4.bfF, L2 = NP4.bfL, fl = flyF(p), cy = 17 + Math.round(fl * 0.5 * 2) / 2, sw = Math.sin(p.ph * 2) * 1, i;
      if (L === 'back') {
        /* long trailing fins from stage 2; from stage 4 a pair of wide fins open like a gown */
        var ln = 2 + s * 1.3;
        if (d === 2) { plume(p, 25, cy - 1, -0.3, ln, 1.4, [Fn, Fn], sw, 0.5); plume(p, 25, cy + 1, 0.3, ln, 1.4, [Fn, Fn], -sw, 0.5); }
        else [-1, 1].forEach(function (m) { plume(p, 16 + m * 2.6, cy + 6, 1.57 - m * 0.4, 1 + s, 2, [Fn, Fn, [Fn[0], Fn[1]]], m * sw, 0.3); });
        if (s >= 4) {
          if (d === 2) plume(p, 17, cy - 5, -0.9, 4 + s, 2, [Fn, Fn, [Fn[0], Fn[0]]], -1, 0.6);
          else [-1, 1].forEach(function (m) { plume(p, 16 + m * 7, cy - 1, m > 0 ? -0.4 : Math.PI + 0.4, 3 + s, 2.2, [Fn, Fn, [Fn[0], Fn[0]]], m * -0.8, 0.6); });
        }
        return;
      }
      /* little lamps light up along its sides, one more each stage from 3 */
      if (s >= 3) {
        var n = s - 2;
        for (i = 0; i < n; i++) {
          if (d === 2) p.ell(13 + i * 3, cy + 3.8, 0.7, 0.7, [L2[0], L2[1]], true);
          else if (d === 0) { p.ell(10.4 - i * 0.2, cy + 2 + i * 2, 0.7, 0.7, [L2[0], L2[1]], true); p.ell(21.6 + i * 0.2, cy + 2 + i * 2, 0.7, 0.7, [L2[0], L2[1]], true); }
        }
      }
    }),
    tidecrab: gstg(function (p, f, s, L, d, b) {
      var S = NP4.tcS, St = NP3.hS, Bn = ['#f4f0e8', '#d4d0c8', '#a8a49c'], i;
      if (L === 'back') {
        /* the shell grows spikes from stage 3, and a second whorl rises on top from stage 4 */
        var cx = d === 2 ? 19.5 : 16, cy = (d === 2 ? 16 : d === 1 ? 17 : 14.5) + b, r = d === 1 ? 8.5 : d === 2 ? 7.5 : 8;
        if (s >= 4) {
          var tx = d === 2 ? cx + 3 : cx, ty = cy - r + 0.5;
          p.ell(tx, ty - 1.5, 3.4, 3, S); p.tri(tx - 1.6, tx + 1.6, ty - 3.5, tx + (d === 2 ? 2 : 0), ty - 5.5 - s * 0.6, S[2], S[1]);
        }
        if (s >= 3) for (i = 0; i < 5; i++) {
          var a = Math.PI + 0.3 + i * 0.55; if (d === 2) a = -2.2 + i * 0.65;
          var x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.92;
          plume(p, x, y, a, 1 + s * 0.5, 1.1, [S, [S[2], S[3]]], 0, 0.5);
        }
        return;
      }
      /* barnacles and small stones settle on the shell */
      var spots = d === 2 ? [[16, 11], [22.5, 19], [14.5, 18]] : d === 1 ? [[11, 13], [21, 15], [16, 22]] : [[10.5, 11], [21.5, 12], [12.5, 18.5]];
      spots.forEach(function (q, j) {
        if (j >= s - 1) return;
        if (j % 2) p.ell(q[0], q[1] + b, 1.4, 1.1, St);
        else { p.ell(q[0], q[1] + b, 1.3, 1.1, Bn); p.px(q[0], q[1] - 0.5 + b, Bn[2]); }
      });
    }),
    coralet: gstg(function (p, f, s, L, d, b) {
      var C = NP4.crC, B = NP4.crB, fl = flyF(p), cy = 15 + Math.round(fl * 0.5 * 2) / 2, PO = '#fffbe0', i;
      if (L === 'back') {
        /* the coral crown branches wider each stage; from stage 4 sea-fan fins open at its sides */
        var n = s - 1;
        for (i = 0; i < n; i++) {
          var o = i - (n - 1) / 2, x0 = d === 2 ? 16 + o * 1.8 : 16 + o * 2.4, a = -1.57 + o * 0.5 + (d === 2 ? 0.4 : 0), ln = 3 + s * 0.8 - Math.abs(o) * 0.6;
          plume(p, x0, cy - 5, a, ln, 0.8, [C, C], 0, 0.2);
          var tx = x0 + Math.cos(a) * ln * 0.6, ty = cy - 5 + Math.sin(a) * ln * 0.6;
          plume(p, tx, ty, a + (o >= 0 ? 0.8 : -0.8), 1.5 + s * 0.3, 0.6, [C, C], 0, 0.2);
        }
        if (s >= 4) {
          var fan = [['#fff4f0', '#ffd0c4', '#f4a8a0']];
          if (d === 2) plume(p, 19, cy + 1, -0.2, 3 + s, 2.6, fan, 0, 0.3);
          else [-1, 1].forEach(function (m) { plume(p, 16 + m * 6, cy + 1, m > 0 ? -0.35 : Math.PI + 0.35, 3 + s, 2.6, fan, 0, 0.3); });
        }
        return;
      }
      /* small lights wake in the polyps from stage 3 */
      if (s >= 3) {
        var pts = d === 2 ? [[18, cy - 2], [20, cy + 2], [15, cy + 5]] : [[11, cy - 2], [21, cy - 2], [10.5, cy + 4.5], [21.5, cy + 4.5]];
        pts.forEach(function (q, j) { if (j < s - 1) { p.ell(q[0], q[1], 0.8, 0.8, ['#ffffff', PO], true); } });
      }
    }),
    driftjelly: gstg(function (p, f, s, L, d, b) {
      var R = NP4.djR, B = NP4.djB, Wd = EP.wind[0], fl = flyF(p), cy = 12 + Math.round(fl * 0.6 * 2) / 2, i;
      if (L === 'back') {
        /* more and longer ribbons each stage; a cloud crest from stage 3 */
        var ln = 7 + s * 1.6, RP = [[R[1], R[2], R[3]], R, [R[0], R[1]]];
        if (d === 2) plume(p, 19.5, cy + 5, 1.0, ln, 0.85, RP, Math.sin(p.ph + 0.8) * 1.6, 0.4);
        else [-1, 1].forEach(function (m) { plume(p, 16 + m * 6.6, cy + 4.6, 1.57 - m * 0.3, ln, 0.85, RP, Math.sin(p.ph + 0.8) * 1.6, 0.4); });
        if (s >= 3) {
          var cx = d === 2 ? 17 : 16;
          for (i = -1; i <= 1; i++) p.ell(cx + i * 2.8, cy - 5.6 - (i ? 0 : 0.8) - s * 0.2, 2.2 + (i ? 0 : 0.4), 1.7, Wd);
        }
        if (s >= 4) {
          if (d === 2) plume(p, 20, cy + 1, 0.4, 2 + s, 1.8, [B, B, R], 0, 0.6);
          else [-1, 1].forEach(function (m) { plume(p, 16 + m * 7, cy + 2, m > 0 ? 0.55 : Math.PI - 0.55, 2 + s, 1.8, [B, B, R], m * 1, 0.6); });
        }
        return;
      }
      if (s >= 2 && d !== 1) { var gx = d === 2 ? 16.5 : 16; p.ell(gx, cy - 3.6, 1, 0.8, ['#ffffff', '#ffffff'], true); }
    }),
    inkling: gstg(function (p, f, s, L, d, b) {
      var B = NP4.ikB, Sp = NP4.ikS, D = EP.dark[0], fl = flyF(p), cy = 14 + Math.round(fl * 0.6 * 2) / 2, sw = Math.sin(p.ph) * 1.4, i;
      if (L === 'back') {
        /* two long reaching arms from stage 2; the hood fins widen into a night cape from stage 4 */
        var ln = 4 + s * 1.6;
        if (d === 2) { plume(p, 15, cy + 6, 1.0, ln, 1.2, [B, B, [B[0], B[1]]], sw + 1, 0.45); }
        else [-1, 1].forEach(function (m) { plume(p, 16 + m * 4, cy + 5.5, 1.57 - m * 0.55, ln, 1.2, [B, B, [B[0], B[1]]], m * (sw + 1), 0.45); });
        if (s >= 4) {
          var cp = [[B[1], B[2], B[3]], [B[2], B[3]]];
          if (d === 2) plume(p, 19, cy - 4, 0.5, 2 + s, 2.2, cp, 1, 0.5);
          else [-1, 1].forEach(function (m) { plume(p, 16 + m * 5, cy - 4, m > 0 ? 0.45 : Math.PI - 0.45, 2 + s, 2.2, cp, m * 1, 0.5); });
        }
        return;
      }
      /* night spots glow on the hood from stage 3 */
      if (s >= 3) {
        var pts = d === 2 ? [[16, cy - 6], [18, cy - 2.5], [14, cy - 1]] : [[16, cy - 8], [13.2, cy - 4.5], [18.8, cy - 4.5]];
        pts.forEach(function (q, j) { if (j < s - 2) p.ell(q[0], q[1], 0.9, 0.9, [D[0], D[1]], true); });
      }
    }),
    brinetail: gstg(function (p, f, s, L, d, b) {
      var K = NP4.btK, Wt = EP.water[1], Fm = EP.water[0], B = NP4.btB, sw = Math.sin(p.ph - 1) * 1.5, i;
      if (L === 'back') {
        /* the kelp scarf grows long ends; from stage 4 its tail widens into a paddle with a wave crest */
        if (s >= 2) {
          var ln = 2 + s * 1.5;
          if (d === 2) plume(p, 15.5, 17.5 + b, 0.5, ln, 1, [K, K], 1.5 + sw * 0.6, 0.4);
          else plume(p, 19, 17.5 + b, 0.3, ln, 1, [K, K], 1.5 + sw * 0.6, 0.4);
        }
        if (s >= 4) {
          if (d === 2) plume(p, 25, 24.5 + b, -0.2, 4 + s * 0.6, 2, [B, Wt, Fm], sw, 0.3);
          else if (d === 0) plume(p, 23, 25 + b, -0.25, 4 + s * 0.6, 2, [B, Wt, Fm], sw, 0.3);
        }
        return;
      }
      /* a little wave curls on its head from stage 3 */
      if (s >= 3) {
        /* one wave that curls forward over its brow, a little taller each stage */
        var cx = d === 2 ? 13 : 17.5, cy = (d === 2 ? 8.4 : 7.6) + b, m = d === 1 ? 1 : -1;
        plume(p, cx, cy, -1.57 - m * 0.5, 2.5 + s * 0.6, 1.4, [Wt, Wt, Fm], m * (1.5 + s * 0.3), 0.55);
      }
    }),
    sparkmouse: gstg(function (p, f, s, L, d, b) {
      var F = NP4.smF, sw = Math.sin(p.ph) * 0.6, i;
      if (L === 'back') {
        return;
      }
      /* the bulb glows brighter: copper bands on the ears from stage 2 */
      if (s >= 2 && d !== 1) {
        if (d === 2) p.ell(12.5, 6.6 + b, 1.2, 0.6, CU);
        else { p.ell(7.6, 6.6 + b, 0.7, 1.2, CU); p.ell(24.4, 6.6 + b, 0.7, 1.2, CU); }
      }
      /* a thin copper feeler rises between its ears from stage 4, tipped with a spark */
      if (s >= 4) {
        var fx = d === 2 ? 11 : 16, fy = (d === 2 ? 10.6 : 8.4) + b, h = 1.6 + (s - 3) * 1.2;
        p.rect(fx - 0.35, fy - h, 0.8, h, CU[2]); p.ell(fx, fy - h - 0.6, 1, 1, NP4.bulb, true);
      }
    }),
    boltbug: gstg(function (p, f, s, L, d, b) {
      var S = NP4.bbS, Y = NP4.wlY, Wg = ['#e8ffff', '#bff4ff', '#8fd8f0'], i;
      b *= 0.5;
      if (L === 'back') {
        /* thin wings peek from under the shell from stage 4 */
        if (s >= 4) {
          if (d === 2) plume(p, 22, 16 + b, -0.4, 4 + s, 2.2, [Wg, Wg], 0, 0.5);
          else [-1, 1].forEach(function (m) { plume(p, 16 + m * 6, 16 + b, m > 0 ? -0.5 : Math.PI + 0.5, 4 + s, 2.2, [Wg, Wg], 0, 0.5); });
        }
        /* side horns on the shell from stage 3 */
        if (s >= 3 && d !== 2) [-1, 1].forEach(function (m) { plume(p, 16 + m * 5, 12.5 + b, -1.57 + m * 0.6, 1.5 + s * 0.5, 0.9, [CU, CU], 0, 0.3); });
        return;
      }
      /* the copper horn grows taller each stage, and a yellow zigzag marks the shell from stage 3 */
      if (s >= 2) {
        var h = s - 1;
        if (d === 2) { p.ell(7.6 - h * 0.4, 11.6 + b - h * 1.2, 1.4, 1.4, CU); plume(p, 7.6, 11.6 + b, -1.9, h * 1.2, 0.8, [CU, CU], 0, 0); }
        else if (d === 0) { p.rect(15.4, 9.4 - h * 1.3 + b, 1.2, h * 1.3, CU[2]); p.ell(16, 9.4 - h * 1.3 + b, 1.6, 1.6, CU); }
        else { p.rect(15.5, 8.5 - h * 1.3 + b, 1, h * 1.3, CU[2]); p.ell(16, 8.5 - h * 1.3 + b, 1.5, 1.5, CU); }
      }
      if (s >= 3) {
        var zx = d === 2 ? 17 : d === 1 ? 10 : 9.6, zy = (d === 2 ? 19 : 17) + b;
        for (i = 0; i < 4; i++) p.rect(zx + i * 1.2, zy + (i % 2 ? 1 : 0), 1.2, 0.9, Y[2]);
        if (d !== 2) for (i = 0; i < 4; i++) p.rect(32 - zx - 1.2 - i * 1.2, zy + (i % 2 ? 1 : 0), 1.2, 0.9, Y[2]);
      }
    }),
    wireling: gstg(function (p, f, s, L, d, b) {
      var Y = NP4.wlY, B = NP4.wlB, fl = flyF(p), sw = Math.sin(p.ph) * 1, i;
      if (L === 'back') {
        /* a fin ridge grows from its head, longer each stage */
        var n = s;
        for (i = 0; i < n; i++) {
          if (d === 2) plume(p, 12 + i * 1.8, 9.5 + fl + i * 0.5, -1.4 + i * 0.25, 1.5 + s * 0.5 - i * 0.2, 0.9, [B, Y], 0.6, 0.4);
          else { var o = i - (n - 1) / 2; plume(p, 16 + o * 1.8, 8 + fl + Math.abs(o) * 0.6, -1.57 + o * 0.35, 1.5 + s * 0.5 - Math.abs(o) * 0.4, 0.9, [B, Y], 0, 0.4); }
        }
        return;
      }
      /* long whisker barbels from stage 3 */
      if (s >= 3 && d !== 1) {
        var ln = 2 + s * 0.8;
        if (d === 2) plume(p, 6.5, 15 + fl, 2.0, ln, 0.6, [Y, Y], sw, 0);
        else [-1, 1].forEach(function (m) { plume(p, 16 + m * 3, 14.6 + fl, 1.57 + m * 0.6, ln, 0.6, [Y, Y], m * sw, 0); });
      }
    }),
    copperpup: gstg(function (p, f, s, L, d, b) {
      var St = NP3.hS, Am = EP.earth[0], i;
      if (L === 'back') {
        /* copper rods rise along its back from stage 3, each with a small stone on top */
        if (s >= 3) {
          /* spaced well apart, so each rod keeps its own outline */
          var rods = d === 2 ? (s >= 5 ? [[15.5, -1.45], [20, -1.25], [24.5, -1.05]] : [[17, -1.4], [22, -1.15]])
            : (s >= 5 ? [[-8.6, -1.95], [0, -1.57], [8.6, -1.19]] : [[-8.6, -1.95], [8.6, -1.19]]);
          rods.forEach(function (r, j) {
            var x = d === 2 ? r[0] : 16 + r[0], y = (d === 2 ? 16.4 : r[0] ? 18.5 : 10) + b, a = r[1], ln = 3 + s * 0.8;
            plume(p, x, y, a, ln, 0.7, [CU, CU], 0, 0);
            p.ell(x + Math.cos(a) * ln, y + Math.sin(a) * ln, 1.1, 1.1, j % 2 ? St : Am);
          });
        }
        return;
      }
      /* copper plates on the shoulders from stage 2 */
      if (s >= 2) {
        if (d === 2) p.ell(14, 18.2 + b, 2.4, 1.4, CU);
        else [-1, 1].forEach(function (m) { p.ell(16 + m * 5.4, 17.6 + b, 2.2, 1.3, CU); });
      }
    }),
    lampwisp: gstg(function (p, f, s, L, d, b) {
      var Br = NP4.lwBr, G = NP4.lwG, fl = flyF(p), cy = 15 + Math.round(fl * 0.5 * 2) / 2, i;
      if (L === 'back') {
        /* from stage 4 little brass wings carry it */
        if (s >= 4) {
          var wl = 2 + s;
          if (d === 2) plume(p, 22, cy - 4, -0.5, wl, 1.8, [Br, Br, G], 0, 0.6);
          else [-1, 1].forEach(function (m) { plume(p, 16 + m * 8, cy - 4, m > 0 ? -0.5 : Math.PI + 0.5, wl, 1.8, [Br, Br, G], 0, 0.6); });
        }
        return;
      }
      /* the brass cap grows a finial, taller each stage; a brass ring holds the base of the globe from stage 3 */
      var cx = d === 2 ? 16.5 : 16;
      if (s >= 2) p.tri(cx - 0.8, cx + 0.8, cy - 10.6, cx, cy - 12 - s * 0.5, Br[2], Br[1]);
      if (s >= 5 && d !== 2) [-1, 1].forEach(function (m) { p.tri(cx + m * 3 - 0.6, cx + m * 3 + 0.6, cy - 8.8, cx + m * 3.4, cy - 11, Br[2], Br[1]); });
      if (s >= 3) { p.ell(cx, cy + 6.4, 3.6, 1.2, Br); p.px(cx - 2, cy + 6.2, Br[0]); }
    }),
    stormowl: gstg(function (p, f, s, L, d, b) {
      var B = NP4.soB, Y = NP4.soY, Cl = EP.wind[0], fl = flyF(p), i;
      if (L === 'back') {
        /* from stage 4 the wings open wide with bright lightning tips */
        if (s >= 4) {
          var wl = 6 + s * 1.4, ed = [B, B, B, [Y[0], Y[1], Y[2]]];
          if (d === 2) plume(p, 19, 16 + fl, -0.7, wl, 3.2, ed, -1, 0.65);
          else [-1, 1].forEach(function (m) { plume(p, 16 + m * 6.5, 16 + fl, m > 0 ? -0.45 : Math.PI + 0.45, wl, 3.2, ed, m * -1, 0.65); });
        }
        return;
      }
      /* a ruff of cloud round its neck from stage 3 (its ear tufts grow in the body painter) */
      if (s >= 3) {
        if (d === 2) for (i = 0; i < 3; i++) p.ell(13 + i * 2.2, 17.2 + i * 0.5, 2, 1.6, Cl);
        else if (d === 1) for (i = -2; i <= 2; i++) p.ell(16 + i * 2.8, 16.8 + Math.abs(i) * 0.3, 2.2, 1.7, Cl);
        else for (i = -2; i <= 2; i++) p.ell(16 + i * 2.8, 18 + Math.abs(i) * -0.4, 2.2, 1.7, Cl);
      }
    }),
    rustcat: gstg(function (p, f, s, L, d, b) {
      var F = NP4.rcF, G = NP4.rcG, Y = NP4.wlY, sw = Math.sin(p.ph) * 1.2, i;
      if (L === 'back') {
        /* a grey ruff of fur from stage 3, and a second tail from stage 4 */
        if (s >= 4) {
          if (d === 2) plume(p, 24, 21 + b, -0.9, 7, 1.2, [F, F, G], 2 - sw, 0.2);
          else if (d === 0) plume(p, 11, 24 + b, -1.95, 7, 1.2, [F, F, G], -2 + sw, 0.2);
        }
        if (s >= 3) {
          if (d === 2) for (i = 0; i < 3; i++) p.ell(13.5 + i * 1.2, 17 + b + i * 1.4, 2, 1.8, G);
          else for (i = -2; i <= 2; i++) p.ell(16 + i * 2.6, 17.6 + b + Math.abs(i) * 0.4, 2, 1.8, G);
        }
        return;
      }
      /* spark-yellow tabby stripes, more each stage */
      var n = s - 1;
      for (i = 0; i < n; i++) {
        if (d === 2) p.rect(17 + i * 2.2, 18 + b, 0.9, 2.2, Y[2]);
        else if (d === 1) p.rect(14 + i * 1.6 - (n - 1) * 0.4, 18 + b + i * 1.3, 1.4, 0.8, Y[2]);
        else { p.rect(10.6, 19 + b + i * 1.4, 1.2, 0.8, Y[2]); p.rect(20.2, 19 + b + i * 1.4, 1.2, 0.8, Y[2]); }
      }
    }),
    mothspark: gstg(function (p, f, s, L, d, b) {
      var B = NP4.msB, S = NP4.msS, F = NP4.msF, MW = ['#a89cc8', '#7a6eaa', '#584e88', '#3e3666'], sw = Math.sin(p.ph * 2) * 0.15, i;
      b *= 0.6;
      if (L === 'back') {
        /* a soft cloak of static silk at stage 2; wings from stage 3, wider each stage */
        if (s === 2) {
          if (d === 2) p.ell(18, 21 + b, 6, 4.6, F);
          else p.ell(16, 21 + b, 8.4, 6.4, F);
        }
        if (s >= 3) {
          /* moth wings fan out from the shoulders and are widest at the tip */
          var wl = 4 + s * 1.4, W = [MW, MW];
          if (d === 2) plume(p, 15.5, 16 + b, -0.95 + sw, wl, 2.2, W, 0, -0.7);
          else [-1, 1].forEach(function (m) {
            plume(p, 16 + m * 4.5, 16 + b, m > 0 ? -0.55 - sw : Math.PI + 0.55 + sw, wl, 2.2, W, 0, -0.7);
            plume(p, 16 + m * 4.5, 21 + b, m > 0 ? 0.5 : Math.PI - 0.5, wl * 0.6, 1.4, W, 0, -0.3);
          });
        }
        return;
      }
      /* spark-blue eye rings on the wings */
      if (s >= 3) {
        var wl2 = 4 + s * 1.4;
        if (d === 2) { var ex = 15.5 + Math.cos(-0.95) * wl2 * 0.75, ey = 16 + b + Math.sin(-0.95) * wl2 * 0.75; p.ell(ex, ey, 1.4, 1.4, [S[1], S[2]], true); p.ell(ex, ey, 0.6, 0.6, [B[3], B[3]], true); }
        else [-1, 1].forEach(function (m) { var a = m > 0 ? -0.55 : Math.PI + 0.55, x = 16 + m * 4.5 + Math.cos(a) * wl2 * 0.75, y = 16 + b + Math.sin(a) * wl2 * 0.75; p.ell(x, y, 1.4, 1.4, [S[1], S[2]], true); p.ell(x, y, 0.6, 0.6, [B[3], B[3]], true); });
      }
    })
  };
  var EL4 = [
    ['seapup', 'water', null, '#2a3448', 0, [['Seapup', 'A round seal pup with a spotted coat. It naps on warm sand between the tides.'], ['Foamflip', 'A curl of sea foam sits on its head and never quite dries.'], ['Swellback', 'A fin of sea water rises along its back when it swims.'], ['Breakerhide', 'A collar of foam rings its neck like a breaking wave.'], ['Tidemantle', 'A legendary seal that sleeps on the open sea and wakes with the tide.']]],
    ['marshwick', 'water', null, '#26303e', 0, [['Marshwick', 'A heron chick on long legs, with a crest of reed. It stands still for hours in the shallows.'], ['Reedstilt', 'Its crest grows a second blade of reed.'], ['Wadecrest', 'Reed-green flight feathers grow on its wings.'], ['Fenplume', 'Long white plumes trail from its back as it wades.'], ['Marshherald', 'A legendary heron that a lotus flower follows wherever it walks.']]],
    ['bellfish', 'water', null, '#142a3c', 1, [['Bellfish', 'A round night fish that carries a little glowing bell on a stalk. It rings softly when it is happy.'], ['Chimefin', 'Long fins trail behind it like ribbons.'], ['Tollgill', 'Small lamps light up along its sides.'], ['Deepchime', 'Wide fins open around it like a gown.'], ['Abyssbell', 'A legendary fish whose bell can be heard under the deepest sea.']]],
    ['tidecrab', 'water', 'earth', '#3a2018', 0, [['Whelkit', 'A hermit crab that lives in a spiral whelk shell and waves its one big claw.'], ['Conchgrip', 'Barnacles and small stones settle on its shell.'], ['Spiralhold', 'Its shell grows spikes along the rim.'], ['Tidespire', 'A second whorl rises on its shell like a little tower.'], ['Shorekeep', 'A legendary crab whose shell is a small tide-pool castle.']]],
    ['coralet', 'water', 'light', '#4a2028', 1, [['Coralet', 'A little sprite with branching coral on its head. It drifts in warm, shallow water.'], ['Reefling', 'Its coral crown branches wider.'], ['Branchglow', 'Small lights wake in the polyps of its coral.'], ['Atollume', 'Sea-fan fins open at its sides.'], ['Reefcrown', 'A legendary sprite whose coral crown is a whole shining reef.']]],
    ['driftjelly', 'water', 'wind', '#2c2a50', 1, [['Driftjelly', 'A jellyfish with a soft round bell. Its ribbon arms drift wherever the breeze goes.'], ['Floatfrill', 'More ribbons grow under its bell.'], ['Gustveil', 'A small cloud crest rides on top of its bell.'], ['Billowcrown', 'Wide frills open at its sides and catch the wind.'], ['Aerolumen', 'A legendary jellyfish that floats between the sea and the sky.']]],
    ['inkling', 'water', 'dark', '#1c1440', 1, [['Inkpip', 'A little night squid with a pointed hood. It hides in its own puff of ink.'], ['Murkcurl', 'Two long arms reach out to feel the dark water.'], ['Duskink', 'Small night lights glow on its hood.'], ['Shadecape', 'Its hood fins widen into a night cape.'], ['Abyssmantle', 'A legendary squid that swims through the night as through the sea.']]],
    ['brinetail', 'water', null, '#2e1e14', 0, [['Brinetail', 'A sea otter in a kelp scarf. It keeps a favourite shell close to its chest.'], ['Kelpwrap', 'The ends of its kelp scarf grow long.'], ['Surfwhisk', 'A small wave curls on its head.'], ['Tidepaddle', 'Its tail widens into a paddle with a wave on its edge.'], ['Marimantle', 'A legendary otter that the sea itself carries home.']]],
    ['sparkmouse', 'electric', null, '#2e2a40', 0, [['Whiskwatt', 'A harvest mouse with copper whiskers and a coiled wire tail that ends in a tiny bulb.'], ['Coilwhisk', 'Copper bands shine on its round ears.'], ['Brightcoil', 'The bulb on its tail grows big and bright.'], ['Arcwhisker', 'A thin copper feeler rises between its ears, tipped with a spark.'], ['Dynamarch', 'A legendary mouse that keeps a whole street lit at night.']]],
    ['boltbug', 'electric', null, '#14302e', 0, [['Boltbug', 'A round beetle whose copper horn works like a little lightning rod.'], ['Rodhorn', 'Its copper horn grows taller.'], ['Arcshell', 'A yellow zigzag marks its shell and two small horns rise beside it.'], ['Thunderscarab', 'Thin wings peek from under its shell.'], ['Fulminarch', 'A legendary beetle that calls the storm down onto its own horn.']]],
    ['wireling', 'electric', 'water', '#14243e', 1, [['Wireling', 'A small eel with bright stripes. It hums with a soft current.'], ['Coileel', 'A fin ridge grows on its head.'], ['Currentail', 'Long whisker barbels feel for sparks in the water.'], ['Surgefin', 'Its fin ridge grows tall and bright.'], ['Tempestcoil', 'A legendary eel that carries a storm through the rivers.']]],
    ['copperpup', 'electric', 'earth', '#2a1e2c', 0, [['Copperpup', 'A velvet mole with copper digging claws and a copper plate on its brow.'], ['Burrowire', 'Copper plates grow on its shoulders.'], ['Lodeclaw', 'Copper rods rise along its back, each with a small stone on top.'], ['Ironvein', 'More rods grow; it can feel a spark through solid rock.'], ['Magnetarch', 'A legendary mole that keeps the copper veins of the earth alive.']]],
    ['lampwisp', 'electric', 'light', '#4a3820', 1, [['Lampwisp', 'A little glass globe with a warm glowing heart and a brass cap.'], ['Glowbulb', 'A small brass finial grows on its cap.'], ['Arclamp', 'A brass ring forms around the base of its globe.'], ['Beaconglass', 'Little brass wings carry its lantern.'], ['Lumarch', 'A legendary lamp that never goes out.']]],
    ['stormowl', 'electric', 'wind', '#22243a', 1, [['Stormowl', 'A slender slate owl with a heart-shaped pale face and lightning ear tufts.'], ['Thunderhoot', 'Its ear tufts grow taller.'], ['Galestrix', 'A ruff of cloud forms around its neck.'], ['Cloudwarden', 'Its wings open wide, edged with lightning.'], ['Tempestrix', 'A legendary owl that watches over every storm.']]],
    ['rustcat', 'electric', null, '#3a2014', 0, [['Rustcat', 'A lean city stray with a rust coat, one notched ear and a wire-wrapped tail.'], ['Alleywatt', 'Spark-yellow stripes show in its coat.'], ['Tinprowl', 'A grey ruff of fur grows around its neck.'], ['Coppermane', 'A second tail grows; it walks the roof wires at night.'], ['Ferrolynx', 'A legendary cat that knows every street of the city.']]],
    ['mothspark', 'electric', 'dark', '#18122a', 0, [['Mothspark', 'A sooty caterpillar with a fluffy collar and spark-blue spots.'], ['Staticloak', 'It wraps itself in a soft cloak of static silk.'], ['Duskwing', 'Dark wings unfold, marked with spark-blue rings.'], ['Gloamspark', 'Its wings grow wide enough to hide the moon.'], ['Eclipsara', 'A legendary moth that flies only on the darkest night.']]]
  ];
  var HAB4 = {
    seapup:     { f: { water: 2.4, sand: 2, rock: 0.8 }, day: 1.1, night: 0.7, wx: { rain: 1.4, fog: 1.2 }, rare: 0.85 },
    marshwick:  { f: { reeds: 3, water: 1.4, lilypad: 1, tallgrass: 0.6 }, day: 1.2, night: 0.5, wx: { rain: 1.6, fog: 1.4 }, rare: 0.75 },
    bellfish:   { f: { water: 3, bridge: 1.2, lamp: 0.6 }, day: 0.1, night: 2.6, wx: { fog: 1.4, clear: 1 }, rare: 0.5 },
    tidecrab:   { f: { sand: 3, rock: 1.6, water: 0.8 }, day: 1, night: 1, wx: { rain: 1.2 }, rare: 0.7 },
    coralet:    { f: { water: 2.4, sand: 1, rock: 0.8, flowers: 0.4 }, day: 1.3, night: 0.5, wx: { clear: 1.4, rain: 0.8 }, rare: 0.4 },
    driftjelly: { f: { water: 2.6, bridge: 1, open: 0.6 }, day: 0.9, night: 1, wx: { wind: 2.4, rain: 1.4 }, rare: 0.45 },
    inkling:    { f: { water: 2.4, shade: 1.2, rock: 0.8, bridge: 0.6 }, day: 0.1, night: 2.6, wx: { fog: 1.8, rain: 1.2 }, rare: 0.4 },
    brinetail:  { f: { water: 2.2, reeds: 1.4, sand: 1, bridge: 0.8 }, day: 1.2, night: 0.6, wx: { rain: 1.3, clear: 1.1 }, rare: 0.7 },
    sparkmouse: { f: { lamp: 1.6, metal: 1.6, field: 1.2, tallgrass: 1, wall: 0.6 }, day: 0.8, night: 1.2, wx: { rain: 1.8 }, rare: 0.85 },
    boltbug:    { f: { tallgrass: 1.6, metal: 1.4, field: 1.2, tree: 0.8 }, day: 1, night: 0.8, wx: { rain: 2, wind: 1.2 }, rare: 0.75 },
    wireling:   { f: { water: 2.4, metal: 1.2, reeds: 0.8 }, day: 0.8, night: 1.2, wx: { rain: 2.6 }, rare: 0.45 },
    copperpup:  { f: { field: 2, rock: 1.4, path: 1, metal: 0.8 }, day: 0.7, night: 1.2, wx: { rain: 1.4 }, rare: 0.6 },
    lampwisp:   { f: { lamp: 3.2, metal: 0.8, statue: 0.6 }, day: 0.2, night: 2.4, wx: { fog: 1.6, rain: 1.4 }, rare: 0.35 },
    stormowl:   { f: { field: 1.6, tree: 1, open: 1.4, metal: 1 }, day: 0.4, night: 1.8, wx: { rain: 2, wind: 2 }, rare: 0.35 },
    rustcat:    { f: { wall: 1.8, path: 1.4, metal: 1.2, lamp: 1, statue: 0.6 }, day: 0.9, night: 1.3, wx: { clear: 1.1, rain: 0.8 }, rare: 0.8 },
    mothspark:  { f: { lamp: 2.4, shade: 1.4, tallgrass: 1, field: 0.8 }, day: 0.1, night: 2.6, wx: { rain: 1.6, fog: 1.4 }, rare: 0.4 }
  };
  EL4.forEach(function (d) {
    var key = d[0], e = { key: key, name: d[5][0][0], element: d[1] };
    if (d[2]) { e.element2 = d[2]; EL2[key] = d[2]; }
    SEED[key] = hash(list.length * 3.7 + 1.3);
    list.push(e);
    DEF[key] = DEF4[key]; STG[key] = STG4[key]; OUT[key] = d[3]; if (d[4]) FLY[key] = 1;
    BASEK[key] = ELK[d[1]]; AURA[key] = AURA[ELK[d[1]]];
    STAGES[key] = d[5];
    stages[key] = d[5].map(function (a) { return { name: a[0], desc: a[1] }; });
    HAB3[key] = HAB4[key];
  });
  GLOW.lampwisp = 0.34; GLOW.bellfish = 0.28;
  /* ---------- fifth wave (chapters 6 and 7: the stone mountains and the fire country): sixteen kinds with bodies of their own.
     They come after the fourth wave in the list, so every earlier seed stays the same. */
  var NP5 = {
    cbF: ['#c8b4a8', '#8e7468', '#6a5248', '#4a362e'], cbW: ['#b49cb4', '#7a627c', '#5a4660', '#3e2e44'], cbC: ['#f4e8dc', '#e0ccb8', '#c0a890', '#a08870'],
    gdS: ['#dcd8d0', '#aca8a0', '#807c76', '#5e5a56'], gdC: ['#ffffff', '#f2e4ff', '#cdb0f2', '#a080d4'],
    bkF: ['#ecd0ac', '#bc9470', '#90704e', '#684e34'], bkC: ['#fffaf0', '#f6e8d4', '#e0c8a8', '#c0a888'], bkP: ['#ffe0d8', '#f4b8a8', '#d89484', '#b07060'],
    shB: ['#c8d0d8', '#929ca8', '#6c7684', '#4e5664'], shH: ['#fff6e0', '#ecd8b0', '#c8ae84', '#9e8662'], shM: ['#e8ecf0', '#c8ced6', '#a4acb8', '#848c9a'],
    mmB: ['#c4b49c', '#94846c', '#6c5e4c', '#4c4236'], mmF: ['#f4ecdc', '#dccfb8', '#b8aa90', '#948670'], mmL: ['#e8f4c8', '#c0d898', '#94b070', '#70884e'],
    pqB: ['#e4caa8', '#b48e6a', '#8a6a4c', '#624a34'], pqC: ['#fff6e8', '#f2dec4', '#d6be9c', '#b49c7c'],
    qsB: ['#fff0e4', '#f0d2c0', '#d0ac98', '#a88674'], qsS: ['#ffffff', '#ffe2ec', '#f4b6cc', '#d68eac'],
    rtB: ['#cdb48c', '#9a7c52', '#72583a', '#523e28'], rtC: ['#e4f6ee', '#b4dcd2', '#84bcb0', '#60988c'],
    ckF: ['#9a949e', '#6a6470', '#4c4854', '#36323c'], ckC: ['#f0eaec', '#d4ccd2', '#b0a8b0', '#8c848e'],
    amB: ['#ffffff', '#f4f0ec', '#dad2ca', '#b8aea4'], amW: ['#f2e6dc', '#d4bfae', '#ae9684', '#8a7262'],
    mpR: ['#8e8698', '#655c70', '#483f52', '#322b3a'], mpL: ['#fff0a0', '#ffb040', '#f06a20', '#c04018'],
    efR: ['#ffb8a0', '#f06a4a', '#c84a34', '#963222'], efC: ['#fff2dc', '#ffdcb0', '#f0b880', '#d09058'],
    sdB: ['#a8a8b8', '#747284', '#565466', '#3c3a4a'], sdC: ['#e8e6ee', '#c8c6d2', '#a4a2b2', '#848294'],
    ffF: ['#ffe6b4', '#f2be72', '#d2964a', '#aa7032'], ffC: ['#fffaf0', '#fff0dc', '#f0d8b8', '#d8bc98'],
    ktS: ['#f4ac8c', '#cc6a4c', '#9e4c38', '#723628'], ktB: ['#d0c4a8', '#a09478', '#786c56', '#585040'],
    sfG: ['#fffbe0', '#ffe27a', '#f8bc48', '#d89030'], sfF: ['#ffffff', '#fffaf0', '#fff0d0', '#f4dcac']
  };
  var EMB = ['#fff0b0', '#ffb040', '#f07020', '#b84818'], SMK = ['#f0eeee', '#d0cccc', '#aaa4a4'], INR = '#f4a8b0';
  /* a crystal point from (x, y) up to height h, leaning by m */
  function shard(p, x, y, w, h, m, C) { p.tri(x - w, x + w, y, x + m, y - h, C[2], C[1]); p.px(x + m * 0.5 - 0.5, y - h * 0.6, C[0]); }
  /* a spiral shell: nested rings that drift towards the centre */
  function spiral(p, cx, cy, r, S) {
    p.ell(cx, cy, r, r * 0.94, S);
    p.ell(cx + r * 0.1, cy - r * 0.06, r * 0.7, r * 0.64, [S[2], S[2]], true);
    p.ell(cx + r * 0.14, cy - r * 0.1, r * 0.56, r * 0.5, [S[0], S[1], S[1]]);
    p.ell(cx + r * 0.22, cy - r * 0.16, r * 0.3, r * 0.27, [S[2], S[2]], true);
    p.ell(cx + r * 0.26, cy - r * 0.2, r * 0.16, r * 0.14, [S[1], S[1]], true);
  }
  /* a little flame: tip up, three tones */
  function flame(p, x, y, h, r, sw) { plume(p, x, y, -1.57, h, r, [EMB, [EMB[0], EMB[1], EMB[1]], [EMB[0], EMB[0], EMB[0]]], sw || 0, 0.7); }
  var DEF5 = {
    cavebat: function (p, f) { /* Echopip: a round cave bat with huge ears, a soft brown coat and dusky wings */
      var F = NP5.cbF, W = NP5.cbW, C = NP5.cbC, fl = flyF(p), cy = 16 + Math.round(fl * 0.5 * 2) / 2, fp = Math.sin(p.ph * (p.mode === 'move' ? 4 : 2));
      function wing(x, m) {
        var y = cy + 1 - fp * 1.2;
        p.ell(x, y, 4.4, 3.2, W);
        for (var i = 0; i < 3; i++) p.tri(x - 3.8 + i * 2.6, x - 1.6 + i * 2.6, y + 2, x - 2.7 + i * 2.6, y + 3.8, W[1]);
        p.px(x + m * 3.8, y - 2.6, W[3]);
      }
      if (p.side) {
        p.ell(21, cy - 2 - fp * 1.5, 4.2, 3, [W[1], W[2], W[3]]);
        p.tri(15, 19, cy - 4, 17.5, cy - 11, F[2], F[3]);
        p.ell(16.5, cy + 2, 5.6, 5.4, F);
        p.ell(14, cy + 3.4, 2.8, 3.2, C);
        p.tri(11, 15, cy - 4, 12.5, cy - 12, F[1], INR);
        p.ell(11.5, cy - 1, 5, 4.6, F);
        p.ell(7.6, cy + 0.2, 2, 1.5, C);
        p.px(5.8, cy - 0.4, '#5a3a3a');
        eye1(p, 8.8, cy - 2.8, true);
        p.px(7.8, cy + 1.6, '#ffffff');
        p.blush(10, cy + 1.2, '#ff9ab0');
        wing(20, 1);
        p.rect(15, cy + 7, 1, 1.4, F[3]); p.rect(17.4, cy + 7, 1, 1.4, F[3]);
        return;
      }
      wing(6.8, -1); wing(25.2, 1);
      p.tri(8.5, 13.5, cy - 3, 9.5, cy - 12, F[2], p.back ? F[2] : INR);
      p.tri(18.5, 23.5, cy - 3, 22.5, cy - 12, F[2], p.back ? F[2] : INR);
      p.ell(16, cy + 1, 7.4, 7, F);
      p.rect(13.5, cy + 7.6, 1.2, 1.4, F[3]); p.rect(17.3, cy + 7.6, 1.2, 1.4, F[3]);
      if (p.back) { p.ell(16, cy - 4.6, 2.4, 1.2, [F[0], F[0]], true); return; }
      p.ell(16, cy + 4, 4.2, 3.4, C);
      eyes2(p, 11.8, 18.2, cy - 2.6, true);
      p.ell(16, cy + 0.8, 1.6, 1, C); p.rect(15.4, cy + 0.3, 1.2, 0.7, '#5a3a3a');
      p.rect(14.6, cy + 2, 2.8, 0.5, F[3]); p.px(14.6, cy + 2.4, '#ffffff'); p.px(16.9, cy + 2.4, '#ffffff');
      p.blush(9.8, cy + 1, '#ff9ab0'); p.blush(20.2, cy + 1, '#ff9ab0');
    },

    geodeling: function (p, f) { /* Druselet: a round stone that is hollow and full of crystals; it sparkles where its shell is cracked */
      var S = NP5.gdS, C = NP5.gdC, b = hop(p);
      function crystals(cx, cy) { shard(p, cx - 3, cy + 1, 1.3, 3.4, -0.6, C); shard(p, cx + 3, cy + 1, 1.3, 3.4, 0.6, C); shard(p, cx, cy + 1, 1.7, 5.6, 0, C); }
      function flecks(x, y) { p.px(x, y, S[3]); p.px(x + 5, y + 3, S[3]); p.px(x + 2, y + 5, S[0]); p.px(x - 2, y + 4, S[2]); }
      if (p.side) {
        legsSide(p, [[13, 1, 1], [19, 0, 1]], 24 + b, 28, 2.2, S[2], S[3]);
        crystals(17, 11 + b);
        p.ell(16.5, 18.5 + b, 7.8, 7.2, S);
        p.ell(17, 12.4 + b, 4.4, 1.4, [C[2], C[3]], true);
        flecks(18, 16 + b);
        eye1(p, 10, 16 + b, true);
        p.px(9.5, 20 + b, S[3]); p.px(10.5, 20.4 + b, S[3]);
        p.blush(12.4, 19 + b, '#ff9ab0');
        legsSide(p, [[12, 0, 0], [18, 1, 0]], 24 + b, 28, 2.4, S[1], S[2]);
        return;
      }
      feet2(p, 11, 18, 25, 3, 2.4, S[2], S[1]);
      crystals(16, 10.5 + b);
      p.ell(16, 18 + b, 8.2, 7.6, S);
      p.ell(16, 11.8 + b, 5, 1.6, [C[2], C[3]], true);
      if (p.back) { flecks(12, 15 + b); flecks(18, 18 + b); return; }
      flecks(19.5, 20 + b);
      eyes2(p, 12.2, 17.8, 16.4 + b, true);
      smile(p, 14, 20.2 + b, S[3]);
      p.blush(10, 19.4 + b, '#ff9ab0'); p.blush(20, 19.4 + b, '#ff9ab0');
    },

    burrowkit: function (p, f) { /* Tunnelpaw: a round dusty kitten with big pink digging paws and a smudge of earth on its nose */
      var F = NP5.bkF, C = NP5.bkC, P2 = NP5.bkP, b = hop(p), sw = Math.sin(p.ph) * 1.2, pr = 1 + (p.stage - 1) * 0.12;
      function paw(x, y) { p.ell(x, y, 2.6 * pr, 1.8 * pr, P2); p.px(x - 1.4 * pr, y - 1.2 * pr, '#ffffff'); p.px(x, y - 1.5 * pr, '#ffffff'); p.px(x + 1.4 * pr, y - 1.2 * pr, '#ffffff'); }
      if (p.side) {
        plume(p, 22, 22 + b, -0.9, 6, 1.8, [F, F], 1 + sw, 0.4);
        legsSide(p, [[19.5, 1, 1]], 23 + b, 28, 2, F[2], F[3]);
        p.ell(17, 21.5 + b, 6.4, 4.6, F);
        p.ell(14.5, 23 + b, 3, 2.4, C);
        legsSide(p, [[20.5, 0, 0]], 23 + b, 28, 2.2, F[1], F[2]);
        p.tri(11, 14.5, 10.5 + b, 13.2, 5.5 + b, F[2], INR);
        p.ell(10.5, 14.5 + b, 5.6, 4.8, F);
        p.ell(6.6, 16.2 + b, 2.2, 1.6, C);
        p.px(4.6, 15.4 + b, '#e07888'); p.px(5.6, 14.6 + b, F[3]);
        eye1(p, 8.2, 12.8 + b, true);
        p.blush(10, 16.6 + b, '#ff9ab0');
        paw(10.5 - lift(p, 0) * 0.5, 26.6 - lift(p, 0));
        return;
      }
      if (!p.back) plume(p, 21.5, 24 + b, -0.9, 6, 1.8, [F, F], 1.5 + sw, 0.4);
      p.ell(16, 22 + b, 6.6, 5, F);
      p.tri(9, 13, 10.5 + b, 10, 5 + b, F[2], p.back ? F[2] : INR);
      p.tri(19, 23, 10.5 + b, 22, 5 + b, F[2], p.back ? F[2] : INR);
      p.ell(16, 13.6 + b, 7, 5.4, F);
      if (p.back) { plume(p, 16, 25 + b, -1.3, 6, 1.8, [F, F], 1.5 + sw, 0.4); p.ell(16, 11.5 + b, 3, 1.4, [F[2], F[2]], true); paw(11.5, 26.4 - lift(p, 0)); paw(20.5, 26.4 - lift(p, 1)); return; }
      p.ell(16, 23 + b, 3.6, 3.2, C);
      eyes2(p, 12.4, 17.6, 12.2 + b, true);
      p.ell(16, 15.8 + b, 2.6, 1.5, C);
      p.rect(15.4, 15 + b, 1.2, 0.8, '#e07888'); p.px(17.2, 14.4 + b, F[3]); p.px(17.8, 15 + b, F[3]);
      p.rect(8.6, 15.4 + b, 2.6, 0.5, C[2]); p.rect(20.8, 15.4 + b, 2.6, 0.5, C[2]);
      p.blush(10.2, 14.6 + b, '#ff9ab0'); p.blush(19.8, 14.6 + b, '#ff9ab0');
      paw(11.5, 26.4 - lift(p, 0)); paw(20.5, 26.4 - lift(p, 1));
    },

    slatehorn: function (p, f) { /* Flintcalf: a sturdy rhino calf of slate grey with one stubby horn on its nose */
      var B = NP5.shB, H = NP5.shH, M = NP5.shM, b = hop(p) * 0.6;
      if (p.side) {
        legsSide(p, [[12, 1, 1], [21, 0, 1]], 23 + b, 28, 2.6, B[2], B[3]);
        p.ell(18, 20 + b, 8, 5.4, B);
        p.ell(17, 23 + b, 5, 1.8, M);
        p.px(26, 18.6 + b, B[3]); p.px(26.6, 19.6 + b, B[3]);
        legsSide(p, [[13.5, 0, 0], [22.5, 1, 0]], 23 + b, 28, 2.8, B[1], B[2]);
        p.tri(11, 14, 13.5 + b, 13, 10 + b, B[2], INR);
        p.ell(9.5, 17.5 + b, 5.4, 4.4, B);
        p.ell(6, 19.4 + b, 2.6, 2.2, M);
        p.tri(3.6, 7, 17.2 + b, 4.2, 11.5 + b, H[2], H[1]);
        p.px(3.8, 19.6 + b, B[3]);
        eye1(p, 8.4, 15.4 + b, false);
        p.blush(9.6, 19 + b, '#ff9ab0');
        return;
      }
      feet2(p, 9.5, 19.5, 24.5, 3, 3.5, B[2], B[1]);
      p.ell(16, 20.5 + b, 8.6, 5.6, B);
      p.tri(7.5, 11, 11.5 + b, 8.5, 7.5 + b, B[2], p.back ? B[2] : INR);
      p.tri(21, 24.5, 11.5 + b, 23.5, 7.5 + b, B[2], p.back ? B[2] : INR);
      p.ell(16, 14.6 + b, 7, 5.4, B);
      if (p.back) { p.ell(16, 20 + b, 4, 2, [B[2], B[2]], true); p.rect(15.5, 25 + b, 1, 2, B[3]); return; }
      p.ell(16, 18.4 + b, 4.4, 2.8, M);
      p.tri(14.6, 17.4, 17 + b, 16, 10.5 + b, H[2], H[1]);
      eyes2(p, 11, 19.6, 13 + b, false);
      p.px(14.4, 19 + b, B[3]); p.px(17.4, 19 + b, B[3]);
      p.blush(9.8, 16.4 + b, '#ff9ab0'); p.blush(20.6, 16.4 + b, '#ff9ab0');
    },

    mossmite: function (p, f) { /* Mossmite: a pill bug with a dome of stone plates and soft moss growing on top */
      var B = NP5.mmB, Fc = NP5.mmF, M = NP.tM, b = hop(p) * 0.5, wv = Math.sin(p.ph * 2) * 0.5, i;
      function moss(x, y) { p.ell(x, y, 2, 1.3, M); }
      function ant(x, y, m) { p.rect(x, y, 0.7, 2.6, B[3]); p.ell(x + 0.35 + m * 0.6, y - 0.3, 0.9, 0.9, [Fc[1], Fc[2]], true); }
      if (p.side) {
        for (i = 0; i < 5; i++) p.rect(9 + i * 3.4 + ((f + i) % 2) * 0.4, 26, 1.2, 2, B[3]);
        p.ell(17, 21.5 + b, 10, 6, B);
        for (i = 0; i < 4; i++) p.rect(12 + i * 3.4, 16.4 + b + Math.abs(i - 1.5) * 0.6, 0.6, 9, B[3]);
        moss(13, 15.8 + b); moss(17, 15.4 + b); moss(21, 16.2 + b);
        ant(5, 18 + b + wv, -1);
        p.ell(6.5, 23 + b, 3, 2.8, Fc);
        eye1(p, 4.6, 21.6 + b, true);
        p.blush(6.6, 24.4 + b, '#ff9ab0');
        return;
      }
      for (i = 0; i < 4; i++) p.rect(9.6 + i * 4, 26.2, 1.2, 1.8, B[3]);
      p.ell(16, 19.5 + b, 9, 7, B);
      p.rect(8, 18 + b, 16, 0.6, B[3]); p.rect(8.6, 21.6 + b, 14.8, 0.6, B[3]);
      moss(12, 13.6 + b); moss(16, 12.8 + b); moss(20, 13.6 + b);
      if (p.back) { moss(14, 16 + b); moss(19, 17 + b); return; }
      ant(12.6, 18 + b + wv, -1); ant(18.6, 18 + b - wv, 1);
      p.ell(16, 23.4 + b, 5, 3.6, Fc);
      eyes2(p, 12.8, 17.2, 21.8 + b, true);
      smile(p, 14, 24.8 + b, Fc[3]);
      p.blush(11.2, 24.6 + b, '#ff9ab0'); p.blush(18.8, 24.6 + b, '#ff9ab0');
    },

    pebblequail: function (p, f) { /* Gritquail: a round quail chick with a speckled coat and a pebble on the tip of its topknot */
      var B = NP5.pqB, C = NP5.pqC, Pb = NP3.hS, b = hop(p), sw = Math.sin(p.ph * 2) * 0.4, LG = '#c89058';
      function speck(x, y) { p.px(x, y, B[3]); p.px(x + 2.4, y + 1.6, B[3]); p.px(x + 0.8, y + 3, B[3]); }
      function knot(x, y, m) { plume(p, x, y, -1.57 + m * 0.5, 3.4, 0.8, [[B[3], B[3]]], m * 1.6 + sw, 0); p.ell(x + m * 2.6 + sw, y - 3.6, 1.3, 1.2, Pb); }
      if (p.side) {
        legsSide(p, [[17, 1, 1]], 24, 28, 0.9, LG, '#a87038');
        plume(p, 22.5, 18 + b, -0.35, 4, 1.6, [B, B], 0, 0.5);
        p.ell(17, 20 + b, 7.4, 6, B);
        p.ell(14.5, 22 + b, 3.6, 3.6, C);
        speck(18, 17.4 + b);
        p.ell(19, 19.6 + b, 4, 3, [B[1], B[2], B[3]]);
        knot(11, 8.4 + b, -1);
        p.ell(11, 12.4 + b, 4.6, 4.2, B);
        p.rect(8, 13.8 + b, 4, 0.6, '#3a2c24');
        p.ell(10.4, 15 + b, 2.4, 1.2, C);
        p.tri(5.4, 7.4, 13.4 + b, 4.8, 12.6 + b, '#4a3a30');
        eye1(p, 8.4, 11 + b, true);
        p.blush(10.8, 14.6 + b, '#ff9ab0');
        legsSide(p, [[15, 0, 0]], 24, 28, 0.9, LG, LG);
        return;
      }
      feet2(p, 13, 18, 24.5, 1, 3.5, LG);
      p.ell(9.4, 19.5 + b, 2.4, 3.8, [B[1], B[2], B[3]]); p.ell(22.6, 19.5 + b, 2.4, 3.8, [B[1], B[2], B[3]]);
      p.ell(16, 19.5 + b, 7, 6.2, B);
      knot(16, 7.4 + b, -0.6);
      p.ell(16, 12 + b, 5.2, 4.6, B);
      if (p.back) { speck(13, 17 + b); speck(17, 19 + b); p.ell(16, 25 + b, 2.4, 1.4, [B[2], B[3]]); return; }
      p.ell(16, 21 + b, 4.4, 4.2, C);
      speck(12.4, 19 + b); speck(17.8, 19.6 + b);
      p.rect(11, 13.2 + b, 2.4, 0.6, '#3a2c24'); p.rect(18.6, 13.2 + b, 2.4, 0.6, '#3a2c24');
      p.ell(16, 15.4 + b, 3, 1.4, C);
      eyes2(p, 12.4, 17.6, 10.6 + b, true);
      p.tri(15.2, 16.8, 13.4 + b, 16, 15 + b, '#4a3a30');
      p.blush(10.6, 14.6 + b, '#ff9ab0'); p.blush(19.4, 14.6 + b, '#ff9ab0');
    },

    quartzsnail: function (p, f) { /* Glintsnail: a soft peach snail that carries a spiral shell of rose quartz */
      var B = NP5.qsB, S = NP5.qsS, wv = Math.sin(p.ph * 2) * 0.5, cr = p.mode === 'move' ? Math.sin(p.gp) * 0.6 : 0;
      function stalk(x, y, m) { p.rect(x, y, 0.9, 3.4, B[3]); p.ell(x + 0.45 + m * 0.4, y - 0.4 + wv * m, 1.1, 1.1, [B[2], B[3]], true); }
      if (p.side) {
        p.ell(16 + cr, 25.6, 10.6, 2.4, B);
        spiral(p, 19 + cr * 0.5, 17.2, 6.8, S);
        p.px(16, 13, '#ffffff'); p.px(22, 15, '#ffffff');
        /* one stalk shows from the side, leaning away from the shell */
        stalk(5.6 + cr, 15.4, -1);
        p.ell(7.6 + cr, 21.6, 3.6, 3.8, B);
        eye1(p, 5.6 + cr, 20.2, true);
        p.blush(7.8 + cr, 23, '#ff9ab0');
        return;
      }
      p.ell(16, 25.8, 8.4, 2.4, B);
      if (p.back) { spiral(p, 16, 16.4, 7.6, S); p.px(13, 12, '#ffffff'); p.px(19, 14, '#ffffff'); return; }
      spiral(p, 17.4, 15, 7.2, S);
      p.px(13.4, 10.6, '#ffffff'); p.px(20, 12.4, '#ffffff');
      stalk(11.6, 15.2, -1); stalk(19.6, 15.2, 1);
      p.ell(16, 21.6, 5, 4.2, B);
      eyes2(p, 12.8, 17.2, 19.8, true);
      smile(p, 14, 22.8, B[3]);
      p.blush(11, 22.4, '#ff9ab0'); p.blush(19, 22.4, '#ff9ab0');
    },

    rumbletoad: function (p, f) { /* Rumbletoad: a wide stone-brown toad with a round throat sac that hums like a drum */
      var B = NP5.rtB, C = NP5.rtC, St = NP3.hS, b = hop(p) * 0.6, pf = (Math.sin(p.ph * 2) > 0.5 ? 0.6 : 0) + (p.stage - 1) * 0.35;
      function wart(x, y) { p.ell(x, y, 0.9, 0.8, [B[0], B[1]], true); }
      if (p.side) {
        p.ell(22.5, 25 + b * 0.5, 4.4, 2.8, B);
        p.ell(17, 21.5 + b, 8, 5.4, B);
        wart(18, 18 + b); wart(21.5, 19.5 + b); wart(15, 17.4 + b);
        p.ell(9.5, 19 + b, 5.4, 4.4, B);
        p.ell(10.5, 14.6 + b, 2.6, 2.4, B);
        p.ell(8.6, 23 + b, 2.8 + pf, 1.8 + pf * 0.5, C);
        p.rect(4.8, 20.2 + b, 5.6, 0.6, B[3]);
        eye1(p, 9.4, 13.4 + b, true);
        p.blush(11.6, 18.6 + b, '#ff9ab0');
        p.rect(11.5, 24 + b, 1.6, 4, B[2]); p.rect(10.6, 27.2, 3, 0.8, B[2]);
        return;
      }
      p.ell(7.6, 25.4, 3.6, 2.4, B); p.ell(24.4, 25.4, 3.6, 2.4, B);
      p.ell(16, 21.4 + b, 9, 6, B);
      p.ell(10.8, 11.6 + b, 2.8, 2.6, B); p.ell(21.2, 11.6 + b, 2.8, 2.6, B);
      p.ell(16, 15.8 + b, 8.4, 5, B);
      if (p.back) { wart(12, 17 + b); wart(19, 18.5 + b); wart(15.5, 21.5 + b); wart(21, 22 + b); wart(11, 22.5 + b); return; }
      p.ell(16, 22.6 + b, 5.6, 3.6, C);
      p.ell(16, 19.6 + b, 3.6 + pf, 2.2 + pf * 0.5, C);
      eyes2(p, 9.8, 20.2, 10.4 + b, true);
      p.rect(10.6, 17.2 + b, 10.8, 0.6, B[3]); p.px(10, 16.6 + b, B[3]); p.px(21.6, 16.6 + b, B[3]);
      wart(8.6, 19.4 + b); wart(23.4, 19.4 + b); wart(13, 14 + b); wart(19.2, 14.4 + b);
      p.ell(11, 26.6, 2.2, 1.3, B); p.ell(21, 26.6, 2.2, 1.3, B);
      p.blush(9.2, 15.4 + b, '#ff9ab0'); p.blush(20.8, 15.4 + b, '#ff9ab0');
    },

    cinderkit: function (p, f) { /* Kindlet: a round charcoal kitten with warm ember ears and a little flame at the tip of its tail */
      var F = NP5.ckF, C = NP5.ckC, b = hop(p), sw = Math.sin(p.ph) * 1.2, EI = '#ffa860';
      if (p.side) {
        plume(p, 22.5, 22 + b, -1.2, 6, 1.5, [F, F], 1.8 + sw, 0.3);
        flame(p, 25.4 + sw * 0.5, 14.6 + b, 3, 1.2, sw * 0.3);
        legsSide(p, [[20, 1, 1], [14, 0, 1]], 23 + b, 28, 1.8, F[2], F[3], [C[2], C[3]]);
        p.ell(17.5, 21.6 + b, 6, 4.2, F);
        p.ell(14.5, 23 + b, 2.6, 2.2, C);
        p.tri(11, 14.5, 10.5 + b, 13, 4.6 + b, F[2], EI);
        p.ell(10.5, 14.2 + b, 5.4, 4.8, F);
        p.ell(6.8, 16 + b, 2.2, 1.5, C);
        p.px(4.8, 15.2 + b, '#f08890');
        eye1(p, 8, 12.6 + b, true);
        p.blush(10, 16.4 + b, '#ff9ab0');
        legsSide(p, [[21, 0, 0], [13, 1, 0]], 23 + b, 28, 2, F[1], F[2], [C[1], C[2]]);
        return;
      }
      if (!p.back) { plume(p, 21, 24 + b, -1.05, 6.5, 1.5, [F, F], 1.6 + sw, 0.3); flame(p, 25 + sw * 0.5, 16.4 + b, 3, 1.2, sw * 0.3); }
      p.ell(16, 22 + b, 5.6, 5, F);
      feet2(p, 12.5, 17.5, 26, 2.5, 2, C[1]);
      p.tri(9, 13.5, 10.5 + b, 9.6, 4 + b, F[2], p.back ? F[2] : EI);
      p.tri(18.5, 23, 10.5 + b, 22.4, 4 + b, F[2], p.back ? F[2] : EI);
      p.ell(16, 13.6 + b, 7, 5.4, F);
      if (p.back) { plume(p, 16, 25 + b, -1.3, 6.5, 1.5, [F, F], 1.6 + sw, 0.3); flame(p, 19.4 + sw * 0.5, 17.4 + b, 3, 1.2, sw * 0.3); p.px(15.5, 9.6 + b, EMB[1]); return; }
      p.ell(16, 22.6 + b, 3, 3.2, C);
      p.px(15.5, 9.4 + b, EMB[1]); p.px(16.5, 9.4 + b, EMB[2]);
      eyes2(p, 12.4, 17.6, 12 + b, true);
      p.ell(16, 15.8 + b, 2.4, 1.4, C);
      p.rect(15.5, 15.1 + b, 1, 0.7, '#f08890');
      p.blush(10.2, 14.6 + b, '#ff9ab0'); p.blush(19.8, 14.6 + b, '#ff9ab0');
    },

    ashmoth: function (p, f) { /* Ashmoth: a fluffy ash-white moth with round wings fringed in ember orange */
      var B = NP5.amB, W = NP5.amW, fl = flyF(p), cy = 16 + Math.round(fl * 0.5 * 2) / 2, fp = Math.sin(p.ph * (p.mode === 'move' ? 4 : 2)) * 0.8;
      function wing(x, y, rx, ry) { p.ell(x, y, rx + 0.6, ry + 0.6, [EMB[2], EMB[1]], true); p.ell(x, y, rx, ry, [W[1], W[1]], true); p.ell(x - 0.4, y - 0.4, rx * 0.6, ry * 0.55, [W[0], W[0]], true); }
      function ant(x, m) { plume(p, x, cy - 7, -1.57 + m * 0.6, 4.4, 0.6, [[B[3], B[3]]], m * 0.8, 0); p.px(x + m * 1.6, cy - 9.6, B[3]); p.px(x + m * 2.8, cy - 10, B[3]); }
      if (p.side) {
        wing(19.5, cy - 3 - fp, 5, 5.4);
        wing(19, cy + 4 + fp * 0.5, 3.4, 3);
        ant(13.5, -1);
        p.ell(16, cy + 1.5, 3.6, 6, B);
        p.ell(13.6, cy - 4.4, 3.8, 3.6, B);
        p.ell(14.6, cy - 1.6, 2.4, 1.4, [B[0], B[0]], true);
        eye1(p, 11, cy - 5.6, true);
        p.blush(13, cy - 3.2, '#ff9ab0');
        return;
      }
      wing(9, cy - 3 - fp, 5.4 - Math.abs(fp) * 0.6, 4.8); wing(23, cy - 3 - fp, 5.4 - Math.abs(fp) * 0.6, 4.8);
      wing(10, cy + 4 + fp * 0.5, 3.6, 3.2); wing(22, cy + 4 + fp * 0.5, 3.6, 3.2);
      ant(14.6, -1); ant(17.4, 1);
      p.ell(16, cy + 2, 3.6, 6.2, B);
      p.ell(16, cy - 4, 4.6, 3.8, B);
      if (p.back) { p.rect(13.4, cy + 2, 5.2, 0.6, B[2]); p.rect(13.8, cy + 4.6, 4.4, 0.6, B[2]); return; }
      p.ell(16, cy - 0.4, 3.4, 1.6, [B[0], B[0]], true);
      eyes2(p, 13, 17.2, cy - 5.6, true);
      p.blush(12.4, cy - 2.4, '#ff9ab0'); p.blush(19.6, cy - 2.4, '#ff9ab0');
    },

    magmapup: function (p, f) { /* Scorchpup: a basalt puppy with floppy ears and warm lava glowing in the cracks of its coat */
      var R = NP5.mpR, L = NP5.mpL, b = hop(p), wg = Math.sin(p.ph * 3) * 1.2, MZ = ['#b4acbc', '#968ea0', '#786f84', '#5a5266'];
      function crack(x, y) { p.rect(x, y, 1.6, 0.6, L[2]); p.rect(x + 1.2, y + 0.5, 1.4, 0.6, L[1]); p.px(x + 2.4, y + 1, L[2]); }
      if (p.side) {
        plume(p, 23.5, 20 + b, -0.8, 4, 1.4, [R, R], wg, 0.4);
        legsSide(p, [[20.5, 1, 1], [13.5, 0, 1]], 23 + b, 28, 2, R[2], R[3]);
        p.ell(17.5, 21.4 + b, 6.6, 4.4, R);
        crack(17, 19.4 + b); crack(20.5, 22 + b);
        legsSide(p, [[21.5, 0, 0], [12.5, 1, 0]], 23 + b, 28, 2.2, R[1], R[2]);
        p.ell(10.5, 14.6 + b, 5.6, 4.8, R);
        p.ell(6.4, 16.6 + b, 2.8, 1.9, MZ);
        p.rect(3.8, 15.6 + b, 1.6, 1.2, '#1a1218');
        p.ell(13, 15 + b, 2, 3.6, [R[2], R[3]]);
        eye1(p, 8, 12.6 + b, true);
        p.blush(9.6, 17 + b, '#ff9ab0');
        return;
      }
      if (!p.back) plume(p, 21, 23 + b, -0.8 + wg * 0.2, 4, 1.4, [R, R], wg, 0.4);
      p.ell(16, 21.6 + b, 6.2, 5, R);
      feet2(p, 11.8, 17.8, 25.4, 2.6, 2.4, R[2], R[1]);
      p.ell(16, 13.6 + b, 6.8, 5.4, R);
      p.ell(9.4, 15.6 + b, 1.8, 3.6, [R[2], R[3]]); p.ell(22.6, 15.6 + b, 1.8, 3.6, [R[2], R[3]]);
      if (p.back) { plume(p, 16, 24 + b, -1.5 + wg * 0.2, 4, 1.4, [R, R], wg, 0.4); crack(13, 20 + b); crack(16.5, 22.6 + b); crack(14, 12 + b); return; }
      crack(11.4, 21.4 + b); crack(17.4, 23 + b); crack(17, 10.2 + b);
      p.ell(16, 16.4 + b, 3.2, 2.2, MZ);
      p.rect(15.2, 15.2 + b, 1.6, 1.1, '#1a1218');
      p.px(15.5, 17.6 + b, '#ff8a9a');
      eyes2(p, 12.4, 17.6, 11.8 + b, true);
      p.blush(10.6, 15 + b, '#ff9ab0'); p.blush(19.4, 15 + b, '#ff9ab0');
    },

    emberfinch: function (p, f) { /* Emberfinch: a round red finch with a gold beak and a little flame for a crest */
      var R = NP5.efR, C = NP5.efC, fl = flyF(p), cy = 17 + Math.round(fl * 0.5 * 2) / 2, fp = Math.sin(p.ph * (p.mode === 'move' ? 4 : 2)), BK = ['#fff0a0', '#f0c040', '#c89020'], ch = 3.4 + (p.stage - 1) * 0.8;
      if (p.side) {
        plume(p, 21.5, cy + 2, 0.3, 4.4, 1.6, [R, [R[1], R[2], R[3]]], 0, 0.4);
        p.ell(16.5, cy, 6.6, 6.2, R);
        p.ell(13.8, cy + 2.4, 3.6, 3.4, C);
        flame(p, 15.6, cy - 5.4, ch, 1.5, Math.sin(p.ph * 2) * 0.4);
        p.tri(8, 10.6, cy - 0.2, 7.2, cy + 0.6, BK[1], BK[0]);
        eye1(p, 11, cy - 2.6, true);
        p.blush(12.6, cy + 0.6, '#ff9ab0');
        p.ell(18.5, cy + 0.6 - fp, 4, 3.2, [R[1], R[2], R[3]]);
        p.rect(15, cy + 6, 0.9, 2, '#8a5030'); p.rect(17.2, cy + 6, 0.9, 2, '#8a5030');
        return;
      }
      p.ell(9, cy + 0.4 - fp, 2.6, 3.8, [R[1], R[2], R[3]]); p.ell(23, cy + 0.4 - fp, 2.6, 3.8, [R[1], R[2], R[3]]);
      p.ell(16, cy, 6.8, 6.4, R);
      p.rect(14, cy + 6, 0.9, 2, '#8a5030'); p.rect(17.1, cy + 6, 0.9, 2, '#8a5030');
      flame(p, 16, cy - 5.4, ch, 1.5, Math.sin(p.ph * 2) * 0.4);
      if (p.back) { plume(p, 16, cy + 4, 1.57, 3.6, 1.6, [R, [R[1], R[2], R[3]]], 0, 0.4); return; }
      p.ell(16, cy + 2.6, 4.2, 3.6, C);
      eyes2(p, 12.2, 17.8, cy - 2.8, true);
      p.tri(14.8, 17.2, cy - 0.2, 16, cy + 1.6, BK[1], BK[0]);
      p.blush(10.6, cy + 0.6, '#ff9ab0'); p.blush(21.4, cy + 0.6, '#ff9ab0');
    },

    soothound: function (p, f) { /* Sootpaw: a slim smoke-grey hound pup with pale socks and a warm ember spot on its chest */
      var B = NP5.sdB, C = NP5.sdC, b = hop(p), sw = Math.sin(p.ph) * 1;
      if (p.side) {
        plume(p, 24, 20 + b, -0.6, 7, 1.1, [B, B, C], 1.6 + sw, 0.3);
        legsSide(p, [[21.5, 1, 1], [13.5, 0, 1]], 22.5 + b, 28, 1.5, B[2], B[3], [C[2], C[3]]);
        p.ell(18, 20.6 + b, 7, 3.8, B);
        p.ell(13.4, 21.6 + b, 2.6, 2.4, C);
        p.px(12.6, 21.4 + b, EMB[1]); p.px(13.4, 21 + b, EMB[0]);
        legsSide(p, [[22.5, 0, 0], [12.5, 1, 0]], 22.5 + b, 28, 1.7, B[1], B[2], [C[1], C[2]]);
        p.tri(11.5, 14.5, 10 + b, 14, 3.5 + b, B[2], INR);
        p.ell(10.5, 13.6 + b, 4.6, 4.2, B);
        p.ell(6, 15.6 + b, 2.8, 1.6, C);
        p.rect(3.2, 14.8 + b, 1.4, 1.1, '#1a1420');
        eye1(p, 8.2, 12 + b, true);
        p.blush(10, 15.8 + b, '#ff9ab0');
        return;
      }
      if (!p.back) plume(p, 21, 23.5 + b, -1.1, 7, 1.1, [B, B, C], 1.8 + sw, 0.3);
      p.ell(16, 21.4 + b, 5, 5, B);
      feet2(p, 12.8, 17.4, 25.4, 1.8, 2.6, C[1], C[0]);
      p.tri(9.5, 13, 10 + b, 9.8, 3.4 + b, B[2], p.back ? B[2] : INR);
      p.tri(19, 22.5, 10 + b, 22.2, 3.4 + b, B[2], p.back ? B[2] : INR);
      p.ell(16, 13.4 + b, 6, 4.8, B);
      if (p.back) { plume(p, 16, 24.5 + b, -1.35, 7, 1.1, [B, B, C], 1.8 + sw, 0.3); p.ell(16, 11 + b, 2.4, 1.4, [B[2], B[2]], true); return; }
      p.ell(16, 21 + b, 2.6, 3.2, C);
      p.ell(16, 20.4 + b, 0.9, 0.9, [EMB[0], EMB[1]], true);
      p.ell(16, 16 + b, 2.6, 1.8, C);
      p.rect(15.3, 15 + b, 1.4, 1, '#1a1420');
      eyes2(p, 12.6, 17.4, 11.8 + b, true);
      p.blush(10.6, 14.6 + b, '#ff9ab0'); p.blush(19.4, 14.6 + b, '#ff9ab0');
    },

    flarefox: function (p, f) { /* Fennflare: a sand-gold fennec with huge ears and a cream tail tip that warms in the sun */
      var F = NP5.ffF, C = NP5.ffC, b = hop(p), sw = Math.sin(p.ph) * 1.2, TP = p.stage >= 2 ? EMB : C;
      function tail(x, y, a, m) { plume(p, x, y, a, 7, 2.4, [F, F, [TP[0], TP[1], TP[1]]], m * (1.2 + sw), 0.35); }
      if (p.side) {
        tail(23.5, 21 + b, -0.7, 1);
        p.tri(12.5, 16, 10 + b, 16.5, 1.5 + b, F[2], F[3]);
        legsSide(p, [[20.5, 1, 1], [13.5, 0, 1]], 23 + b, 28, 1.6, F[2], F[3]);
        p.ell(17.5, 21.4 + b, 6, 4, F);
        p.ell(14.5, 22.6 + b, 3, 2.4, C);
        legsSide(p, [[21.5, 0, 0], [12.5, 1, 0]], 23 + b, 28, 1.8, F[1], F[2]);
        p.ell(10.5, 14.4 + b, 5, 4.4, F);
        p.ell(7, 16.4 + b, 2.8, 1.7, C);
        p.rect(3.8, 15.6 + b, 1.4, 1, '#3a2418');
        p.tri(9.5, 14, 11 + b, 12.5, 1.2 + b, F[1], INR);
        eye1(p, 8, 12.8 + b, true);
        p.blush(10.4, 16.4 + b, '#ff9ab0');
        return;
      }
      if (!p.back) tail(21, 24 + b, -1.0, 1);
      p.ell(16, 21.6 + b, 5.4, 5, F);
      feet2(p, 12.6, 17.6, 25.6, 2.2, 2.4, F[2], F[1]);
      p.tri(5, 11, 12 + b, 5.4, 1.4 + b, F[2], p.back ? F[2] : INR);
      p.tri(21, 27, 12 + b, 26.6, 1.4 + b, F[2], p.back ? F[2] : INR);
      p.ell(16, 13.8 + b, 6.4, 5, F);
      if (p.back) { tail(16, 25 + b, -1.3, 1); return; }
      p.ell(16, 22.4 + b, 3, 3.2, C);
      p.ell(16, 15.6 + b, 4.4, 2.8, C);
      p.rect(15.3, 15 + b, 1.4, 1, '#3a2418');
      eyes2(p, 12.2, 17.8, 12 + b, true);
      p.blush(10.2, 15.4 + b, '#ff9ab0'); p.blush(21.8, 15.4 + b, '#ff9ab0');
    },

    kilnturtle: function (p, f) { /* Kilnshell: a stony turtle that carries a dome of brick with a little chimney on top */
      var S = NP5.ktS, B = NP5.ktB, b = hop(p) * 0.5, MO = '#f0dcc4', fw = Math.sin(p.ph * 2) > 0 ? EMB[1] : EMB[0];
      function bricks(cx, cy, rx, ry) {
        for (var r = -1; r <= 1; r++) {
          var y = cy + r * ry * 0.45; p.rect(cx - rx * 0.86 * (1 - Math.abs(r) * 0.25), y, rx * 1.72 * (1 - Math.abs(r) * 0.25), 0.5, MO);
          for (var c = -2; c <= 2; c++) { var x = cx + c * rx * 0.36 + (r % 2 ? rx * 0.18 : 0); if (Math.abs(x - cx) < rx * 0.8 * (1 - Math.abs(r) * 0.3)) p.rect(x, y - ry * 0.4, 0.5, ry * 0.4, MO); }
        }
      }
      function chimney(x, y) { p.rect(x - 1.5, y, 3, 4.4, S[2]); p.rect(x - 2, y - 0.6, 4, 1, S[3]); p.rect(x - 1.5, y + 1.6, 3, 0.4, MO); }
      if (p.side) {
        legsSide(p, [[11, 1, 1], [22, 0, 1]], 23 + b, 27.5, 2.6, B[2], B[3]);
        p.ell(25.5, 22.6 + b, 2, 1.2, B);
        chimney(20, 7.6 + b);
        p.ell(17.5, 17.6 + b, 8.4, 6.4, S);
        bricks(17.5, 17.6 + b, 8.4, 6.4);
        p.rect(9.5, 22.4 + b, 16, 1.4, S[3]);
        p.ell(21, 21 + b, 1.8, 1.6, [fw, EMB[2]], true); p.rect(19.2, 21 + b, 3.6, 1.4, EMB[2]);
        p.ell(7.6, 19.6 + b, 3.8, 3.4, B);
        p.ell(5.2, 21 + b, 1.6, 1, [B[0], B[1]], true);
        eye1(p, 5.6, 18 + b, true);
        p.blush(7.8, 21 + b, '#ff9ab0');
        legsSide(p, [[12.5, 0, 0], [23.5, 1, 0]], 23 + b, 27.5, 2.8, B[1], B[2]);
        return;
      }
      feet2(p, 8.5, 20.5, 23.5, 3, 4, B[2], B[1]);
      chimney(19.5, 6.4 + b);
      p.ell(16, 16.6 + b, 9, 6.8, S);
      bricks(16, 16.6 + b, 9, 6.8);
      p.rect(7.4, 22 + b, 17.2, 1.4, S[3]);
      if (p.back) { p.ell(16, 23.8 + b, 2, 1.2, B); return; }
      p.ell(16, 21.4 + b, 4.6, 4, B);
      eyes2(p, 12.8, 17.2, 19.6 + b, true);
      smile(p, 14, 22.6 + b, B[3]);
      p.blush(11.2, 22.4 + b, '#ff9ab0'); p.blush(18.8, 22.4 + b, '#ff9ab0');
    },

    sunflare: function (p, f) { /* Sunnip: a round golden chick with a little crown of rays */
      var G = NP5.sfG, Fc = NP5.sfF, fl = flyF(p), cy = 17 + Math.round(fl * 0.5 * 2) / 2, fp = Math.sin(p.ph * (p.mode === 'move' ? 4 : 2)), rl = 2 + (p.stage - 1) * 0.7, i;
      function rays(cx, cyy, a0, a1, n) { for (i = 0; i < n; i++) { var a = a0 + (a1 - a0) * i / (n - 1); p.tri(cx + Math.cos(a) * 5 - 1, cx + Math.cos(a) * 5 + 1, cyy + Math.sin(a) * 4.6, cx + Math.cos(a) * (5 + rl), cyy + Math.sin(a) * (4.6 + rl), EMB[1], EMB[0]); } }
      if (p.side) {
        rays(15, cy - 3, -2.8, -0.9, 4);
        plume(p, 21.5, cy + 2.4, 0.4, 3.6, 1.4, [G, G], 0, 0.4);
        p.ell(16, cy, 6.6, 6.4, G);
        p.ell(12.8, cy + 0.4, 3.2, 3.4, Fc);
        p.tri(7.6, 9.6, cy - 0.2, 6.8, cy + 0.4, '#f08a30', '#ffb050');
        eye1(p, 10.4, cy - 2.6, true);
        p.blush(12.4, cy + 1.2, '#ff9ab0');
        p.ell(18, cy + 1 - fp, 3.6, 3, [G[1], G[2], G[3]]);
        p.rect(14.6, cy + 6, 0.9, 2, '#d08030'); p.rect(16.8, cy + 6, 0.9, 2, '#d08030');
        return;
      }
      rays(16, cy - 2, -2.75, -0.39, 5);
      p.ell(9.4, cy + 1 - fp, 2.4, 3.2, [G[1], G[2], G[3]]); p.ell(22.6, cy + 1 - fp, 2.4, 3.2, [G[1], G[2], G[3]]);
      p.ell(16, cy, 6.8, 6.6, G);
      p.rect(14, cy + 6.2, 0.9, 2, '#d08030'); p.rect(17.1, cy + 6.2, 0.9, 2, '#d08030');
      if (p.back) { p.ell(16, cy + 5, 2.4, 1.4, [G[2], G[3]]); return; }
      p.ell(16, cy + 1, 4.6, 4.4, Fc);
      eyes2(p, 12.4, 17.6, cy - 2, true);
      p.tri(15, 17, cy + 1, 16, cy + 2.4, '#f08a30', '#ffb050');
      p.blush(10.6, cy + 1.4, '#ff9ab0'); p.blush(21.4, cy + 1.4, '#ff9ab0');
    }
  };
  var STG5 = {
    cavebat: gstg(function (p, f, s, L, d, b) {
      var F = NP5.cbF, W = NP5.cbW, Cr = NP5.gdC, fl = flyF(p), cy = 16 + Math.round(fl * 0.5 * 2) / 2, fp = Math.sin(p.ph * (p.mode === 'move' ? 4 : 2)), i;
      if (L === 'back') {
        /* from stage 4 the wings open wide like a cloak */
        if (s >= 4) {
          var wl = 5 + s * 1.3, ed = [W, W, [W[1], W[2], W[3]]];
          if (d === 2) plume(p, 19, cy - 2, -0.8 - fp * 0.2, wl, 3.4, ed, -1, 0.6);
          else [-1, 1].forEach(function (m) { plume(p, 16 + m * 7, cy - 1, (m > 0 ? -0.35 : Math.PI + 0.35) - m * fp * 0.2, wl, 3.4, ed, m * -1, 0.6); });
        }
        return;
      }
      /* a fluffy collar from stage 2, crystal claws on the wing tips from stage 3, a crescent on the brow at stage 5 */
      if (s >= 2) {
        if (d === 2) for (i = 0; i < 3; i++) p.ell(12.5 + i * 1.8, cy + 2.6 + i * 0.3, 1.6, 1.3, NP5.cbC);
        else if (d === 0) for (i = -2; i <= 2; i++) p.ell(16 + i * 2.2, cy + 3.6 + Math.abs(i) * -0.4, 1.6, 1.3, NP5.cbC);
      }
      if (s >= 3) {
        var y = cy - 1.6 - fp * 1.2;
        if (d === 2) shard(p, 23.6, y, 0.8, 2.2, 0.6, Cr);
        else { shard(p, 2.6, y, 0.8, 2.2, -0.6, Cr); shard(p, 29.4, y, 0.8, 2.2, 0.6, Cr); }
      }
      if (s >= 5 && d !== 1) { var cx = d === 2 ? 11.5 : 16, yy = cy - 5.6; p.ell(cx, yy, 1.6, 1.4, [Cr[0], Cr[1]], true); p.ell(cx + 0.7, yy - 0.5, 1.2, 1.1, [F[1], F[1]], true); }
    }),
    geodeling: gstg(function (p, f, s, L, d, b) {
      var C = NP5.gdC, cx = d === 2 ? 17 : 16, top = (d === 2 ? 11.5 : 11) + b;
      if (L === 'back') {
        /* more crystals from stage 2, one tall glowing crystal from stage 3 */
        if (s >= 2) { shard(p, cx - 5.2, top + 2.4, 1.1, 2.6, -1.2, C); shard(p, cx + 5.2, top + 2.4, 1.1, 2.6, 1.2, C); }
        if (s >= 3) shard(p, cx + 0.4, top + 0.5, 2, 6 + s * 1.2, 0.3, C);
        return;
      }
      /* crystal clusters on its shoulders from stage 4, a crystal heart on the chest at stage 5 */
      if (s >= 4) {
        if (d === 2) { shard(p, 20.5, 16 + b, 1.1, 3, 1, C); shard(p, 22.4, 17.4 + b, 0.9, 2.2, 1.4, C); }
        else { [-1, 1].forEach(function (m) { shard(p, 16 + m * 7, 15 + b, 1.1, 3, m * 1.2, C); shard(p, 16 + m * 8.4, 16.6 + b, 0.9, 2.2, m * 1.6, C); }); }
      }
      if (s >= 5 && d === 0) { p.ell(15.2, 22.8 + b, 1, 1, [C[1], C[2]], true); p.ell(16.8, 22.8 + b, 1, 1, [C[1], C[2]], true); p.tri(14.3, 17.7, 23 + b, 16, 25 + b, C[2], C[1]); }
    }),
    burrowkit: gstg(function (p, f, s, L, d, b) {
      var St = NP3.hS, Am = EP.earth[0], i;
      if (L === 'back') {
        /* a ridge of stone plates down its back from stage 4 */
        if (s >= 4) {
          if (d === 2) for (i = 0; i < 4; i++) p.tri(14 + i * 2.6, 16.4 + i * 2.6, 18 + b + i * 0.4, 15 + i * 2.6, 14.6 + b + i * 0.4 - (s - 4), St[2], St[1]);
          else if (d === 1) for (i = 0; i < 4; i++) p.ell(16, 11 + b + i * 3.4, 1.6, 1.3, St);
        }
        return;
      }
      /* the paws grow in the body painter; an amber stone shines on its brow from stage 3 */
      if (s >= 3 && d !== 1) { var x = d === 2 ? 9.2 : 16, y = (d === 2 ? 10.6 : 9.6) + b; p.ell(x, y, 1.3, 1.1, Am); p.px(x - 0.5, y - 0.6, '#ffffff'); }
    }),
    slatehorn: gstg(function (p, f, s, L, d, b) {
      var B = NP5.shB, H = NP5.shH, St = NP3.hS, i;
      b *= 0.6;
      if (L === 'back') {
        /* plates of slate on its back from stage 3, a spine ridge from stage 4 */
        if (s >= 3) {
          if (d === 2) for (i = 0; i < 3; i++) p.ell(15 + i * 3.6, 15.4 + b, 2, 1.6, St);
          else for (i = -1; i <= 1; i++) p.ell(16 + i * 4.4, 16 + b + Math.abs(i) * 0.6, 2.2, 1.6, St);
        }
        if (s >= 4) {
          if (d === 2) for (i = 0; i < 4; i++) p.tri(13 + i * 3, 15.4 + i * 3, 15 + b, 14 + i * 3, 12 + b - (s - 4), St[2], St[1]);
          else for (i = -1; i <= 1; i++) p.tri(14.8 + i * 4.4, 17.2 + i * 4.4, 15 + b, 16 + i * 4.4, 11.6 + b - (s - 4), St[2], St[1]);
        }
        return;
      }
      /* a second, smaller horn from stage 2; the main horn grows long from stage 4 */
      if (d === 2) {
        if (s >= 4) p.tri(3.4, 7, 17.2 + b, 2.4, 9.5 + b - (s - 4), H[2], H[1]);
        if (s >= 2) p.tri(6.8, 9, 14.6 + b, 7.6, 11.4 + b, H[2], H[1]);
      } else if (d === 0) {
        if (s >= 4) p.tri(14.4, 17.6, 17 + b, 16, 8.4 + b - (s - 4), H[2], H[1]);
        if (s >= 2) p.tri(15, 17, 12.6 + b, 16, 9.6 + b, H[2], H[1]);
      }
    }),
    mossmite: gstg(function (p, f, s, L, d, b) {
      var Li = NP5.mmL, M = NP.tM, sw = Math.sin(p.ph) * 0.5, i;
      b *= 0.5;
      if (L === 'back') return;
      /* pale lichen from stage 2, ferns from stage 3, flowers among them from stage 4 */
      var spots = d === 2 ? [[11, 18], [15.5, 19.5], [20, 18.4], [23.5, 20.6]] : [[10.6, 16.4], [14.4, 17.4], [18, 16.6], [21.6, 17.6]];
      if (s >= 2) spots.forEach(function (q) { p.ell(q[0], q[1] + b, 1.1, 0.8, [Li[1], Li[2]], true); });
      var tops = d === 2 ? [[13, 15], [17, 14.6], [21, 15.4]] : [[12, 12.8], [16, 12], [20, 12.8]];
      if (s >= 3) tops.forEach(function (q, j) { if (j === 1 || s >= 4) plume(p, q[0], q[1] + b, -1.57 + (j - 1) * 0.4, 2 + s * 0.6, 0.8, [M, M], sw + (j - 1) * 0.6, 0.3); });
      if (s >= 4) tops.forEach(function (q, j) { if (j !== 1) { var x = q[0] + (j - 1) * 1.6, y = q[1] - 1.4 - s * 0.3 + b; p.ell(x, y, 1.1, 1.1, ['#fff0f6', '#ffc0d8', '#ff90b8']); p.px(x - 0.5, y - 0.5, '#ffe070'); } });
    }),
    pebblequail: gstg(function (p, f, s, L, d, b) {
      var B = NP5.pqB, St = NP3.hS, Pb = NP3.hS, Tp = [B[0], B[1], B[2]], sw = Math.sin(p.ph * 2) * 0.4, i;
      if (L === 'back') {
        /* a fan of long tail feathers from stage 4 */
        if (s >= 4) {
          if (d === 2) for (i = 0; i < 3; i++) plume(p, 22, 18 + b, -0.7 + i * 0.35, 4 + s, 1.3, [B, B, Tp], 0.5, 0.4);
          else if (d === 1) for (i = -2; i <= 2; i++) plume(p, 16, 22 + b, 1.57 + i * 0.3, 3 + s, 1.3, [B, B, Tp], 0, 0.4);
          else for (i = -1; i <= 1; i += 2) plume(p, 16 + i * 5, 21 + b, -1.57 + i * 0.9, 2 + s, 1.2, [B, B, Tp], i * 0.5, 0.4);
        }
        return;
      }
      /* a second pebble on the topknot from stage 2; stone scales on the wings from stage 3 */
      if (s >= 2) { var x = (d === 2 ? 9.6 : 14.6) + sw, y = (d === 2 ? 5.4 : 4.4) + b; p.ell(x, y, 1, 0.9, Pb); }
      if (s >= 3) {
        if (d === 2) for (i = 0; i < 3; i++) p.ell(17.4 + i * 1.6, 19 + b + (i % 2) * 1.2, 0.9, 0.8, [St[1], St[2]], true);
        else [-1, 1].forEach(function (m) { for (i = 0; i < 2; i++) p.ell(16 + m * 6.6, 18 + b + i * 2, 0.9, 0.8, [St[1], St[2]], true); });
      }
    }),
    quartzsnail: gstg(function (p, f, s, L, d, b) {
      var S = NP5.qsS, cr = p.mode === 'move' ? Math.sin(p.gp) * 0.6 : 0, cx = d === 2 ? 19 + cr * 0.5 : d === 1 ? 16 : 17.4, cy = d === 2 ? 17.2 : d === 1 ? 16.4 : 15, r = d === 2 ? 6.8 : d === 1 ? 7.6 : 7.2, i;
      if (L === 'back') {
        /* a tall crystal rises from the top of the shell from stage 3 */
        if (s >= 3) shard(p, cx + 0.6, cy - r + 1.6, 1.8, 4 + s * 1.2, 0.4, S);
        return;
      }
      /* small crystal points on the rim from stage 2, more of them over the whole shell from stage 4 */
      if (s >= 2) for (i = 0; i < 3; i++) { var a = -2.6 + i * 0.9; shard(p, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.94 + 0.8, 0.8, 1.6 + s * 0.3, Math.cos(a), S); }
      if (s >= 4) for (i = 0; i < 3; i++) { var a2 = -0.3 + i * 0.6; shard(p, cx + Math.cos(a2) * r * 0.9, cy + Math.sin(a2) * r * 0.9 + 0.8, 0.8, 1.4 + s * 0.2, Math.cos(a2), S); }
    }),
    rumbletoad: gstg(function (p, f, s, L, d, b) {
      var St = NP3.hS, i;
      b *= 0.6;
      if (L === 'back') return;
      /* its throat sac grows in the body painter; river stones on its back from stage 3, a stone crest over its eyes from stage 4 */
      if (s >= 3) {
        var pts = d === 2 ? [[17, 17.2], [20.5, 18.4], [23, 21], [14.4, 16.8]] : d === 1 ? [[12, 17], [19, 18.5], [15.5, 21.5], [21, 22], [11, 22.5]] : [[8.4, 19.2], [23.6, 19.2], [12.6, 13.8], [19.4, 13.8]];
        pts.forEach(function (q) { p.ell(q[0], q[1] + b, 1.4, 1.1, St); });
      }
      if (s >= 4 && d !== 1) {
        if (d === 2) for (i = 0; i < 2; i++) p.tri(8.8 + i * 1.8, 10.6 + i * 1.8, 12.8 + b, 9.6 + i * 1.8, 11 + b - (s - 4) * 0.6, St[2], St[1]);
        else [10.8, 21.2].forEach(function (x) { for (i = -1; i <= 1; i++) p.tri(x + i * 1.4 - 0.9, x + i * 1.4 + 0.9, 9.6 + b, x + i * 1.4, 8 + b - (s - 4) * 0.6 - (i ? 0 : 0.7), St[2], St[1]); });
      }
    }),
    cinderkit: gstg(function (p, f, s, L, d, b) {
      var sw = Math.sin(p.ph * 2) * 0.5, i;
      if (L === 'back') {
        /* a soft mane of flame round its neck from stage 4 */
        if (s >= 4) {
          if (d === 2) for (i = 0; i < 3; i++) flame(p, 13.5 + i * 1.6, 18.6 + b + i * 0.6, 2 + s * 0.6, 1.3, sw);
          else for (i = -2; i <= 2; i++) flame(p, 16 + i * 2.6, 18.4 + b + Math.abs(i) * 0.4, 2 + s * 0.6 - Math.abs(i) * 0.4, 1.3, sw * (i % 2 ? -1 : 1));
        }
        return;
      }
      /* glowing whiskers from stage 2, ember ear tips and paws from stage 3 */
      if (s >= 2 && d === 0) { p.rect(8.4, 15.2 + b, 2.8, 0.5, EMB[1]); p.rect(8.6, 16.4 + b, 2.6, 0.5, EMB[1]); p.rect(20.8, 15.2 + b, 2.8, 0.5, EMB[1]); p.rect(20.8, 16.4 + b, 2.6, 0.5, EMB[1]); }
      if (s >= 2 && d === 2) { p.rect(3, 16.6 + b, 3, 0.5, EMB[1]); p.rect(3.2, 17.6 + b, 2.6, 0.5, EMB[1]); }
      if (s >= 3) {
        if (d === 2) flame(p, 13, 4.8 + b, 1.6 + s * 0.4, 0.9, sw);
        else { flame(p, 9.6, 4.4 + b, 1.6 + s * 0.4, 0.9, sw); flame(p, 22.4, 4.4 + b, 1.6 + s * 0.4, 0.9, -sw); }
        if (d === 0) { p.rect(12.6, 27, 2.2, 0.6, EMB[1]); p.rect(17.6, 27, 2.2, 0.6, EMB[1]); }
      }
    }),
    ashmoth: gstg(function (p, f, s, L, d, b) {
      var W = NP5.amW, fl = flyF(p), cy = 16 + Math.round(fl * 0.5 * 2) / 2, fp = Math.sin(p.ph * (p.mode === 'move' ? 4 : 2)) * 0.8;
      if (L === 'back') {
        /* smoke tails on the hind wings from stage 2; wide ember-edged wings from stage 4 */
        if (s >= 2) {
          if (d === 2) plume(p, 21, cy + 5, 0.7, 3 + s, 1.1, [W, SMK], 1.4, 0.5);
          else [-1, 1].forEach(function (m) { plume(p, 16 + m * 9, cy + 5, 1.57 - m * 1.0, 3 + s, 1.1, [W, SMK], m * 1.4, 0.5); });
        }
        if (s >= 4) {
          var ed = [W, W, [EMB[1], EMB[2], EMB[2]]];
          if (d === 2) plume(p, 19, cy - 4 - fp, -0.9, 6 + s, 3.6, ed, -1, 0.55);
          else [-1, 1].forEach(function (m) { plume(p, 16 + m * 9, cy - 4 - fp, m > 0 ? -0.5 : Math.PI + 0.5, 4 + s, 3.6, ed, m * -1, 0.55); });
        }
        return;
      }
      /* ember eyespots on the wings from stage 3 */
      if (s >= 3) {
        var eye = function (x, y) { p.ell(x, y, 1.5, 1.5, [EMB[1], EMB[2]], true); p.ell(x, y, 0.6, 0.6, [EMB[0], EMB[0]], true); };
        if (d === 2) eye(20.5, cy - 3.4 - fp); else if (d === 0) { eye(8.4, cy - 3.4 - fp); eye(23.6, cy - 3.4 - fp); }
      }
    }),
    magmapup: gstg(function (p, f, s, L, d, b) {
      var R = NP5.mpR, L2 = NP5.mpL, i;
      if (L === 'back') {
        /* a ridge of warm lava rocks along its back from stage 3 */
        if (s >= 3) {
          var rock = function (x, y, h) { p.tri(x - 1.4, x + 1.4, y, x, y - h, R[2], R[1]); p.px(x - 0.5, y - h * 0.5, L2[1]); };
          if (d === 2) for (i = 0; i < 4; i++) rock(14 + i * 2.6, 18.4 + b, 2 + s * 0.5 - Math.abs(i - 1.5) * 0.5);
          else if (d === 1) for (i = 0; i < 3; i++) p.ell(16, 12 + b + i * 3.6, 1.6, 1.3, R);
          else for (i = -1; i <= 1; i++) rock(16 + i * 3, 17 + b, 2 + s * 0.4);
        }
        return;
      }
      /* the lava cracks spread from stage 2; lava drops hang from its ears from stage 4 */
      if (s >= 2) {
        if (d === 2) { p.rect(13.4, 25.6, 1.6, 0.6, L2[1]); p.rect(20.8, 25.6, 1.6, 0.6, L2[1]); }
        else if (d === 0) { p.rect(12.2, 26.4, 2, 0.6, L2[1]); p.rect(18.2, 26.4, 2, 0.6, L2[1]); }
      }
      if (s >= 4) {
        var drop = function (x, y) { p.ell(x, y, 1.1, 1.3, [L2[0], L2[1], L2[2]]); };
        if (d === 2) drop(13, 19 + b); else { drop(9, 18.6 + b); drop(23, 18.6 + b); }
      }
    }),
    emberfinch: gstg(function (p, f, s, L, d, b) {
      var R = NP5.efR, fl = flyF(p), cy = 17 + Math.round(fl * 0.5 * 2) / 2, fp = Math.sin(p.ph * (p.mode === 'move' ? 4 : 2)), i;
      if (L === 'back') {
        /* ember tail feathers from stage 3; wide flame-tipped wings from stage 4 (the crest grows in the body painter) */
        if (s >= 3) {
          var tp = [R, R, [EMB[0], EMB[1], EMB[1]]];
          if (d === 2) for (i = 0; i < 2; i++) plume(p, 21, cy + 2, 0.2 + i * 0.4, 3 + s * 1.2, 1.3, tp, 0.6, 0.4);
          else for (i = -1; i <= 1; i++) plume(p, 16, cy + 5, 1.57 + i * 0.35, 2 + s, 1.3, tp, 0, 0.4);
        }
        if (s >= 4) {
          var ed = [R, R, [EMB[0], EMB[1], EMB[2]]];
          if (d === 2) plume(p, 18, cy - 1 - fp, -0.8, 4 + s, 2.8, ed, -1, 0.6);
          else [-1, 1].forEach(function (m) { plume(p, 16 + m * 6, cy - 1 - fp, m > 0 ? -0.4 : Math.PI + 0.4, 3 + s, 2.8, ed, m * -1, 0.6); });
        }
      }
    }),
    soothound: gstg(function (p, f, s, L, d, b) {
      var B = NP5.sdB, C = NP5.sdC, sw = Math.sin(p.ph) * 0.6, i;
      if (L === 'back') {
        /* a long tail that trails smoke from stage 4 */
        if (s >= 4) {
          if (d === 2) plume(p, 27.4, 14 + b, -1.3, 2 + s * 0.8, 1.2, [SMK, SMK], 1.6 + sw, 0.4);
          else if (d === 0) plume(p, 25.4, 15.4 + b, -1.4, 2 + s * 0.8, 1.2, [SMK, SMK], 1.6 + sw, 0.4);
        }
        /* embers in the fur along its neck from stage 3 */
        if (s >= 3) {
          if (d === 2) for (i = 0; i < 3; i++) p.tri(12.5 + i * 1.8, 14.5 + i * 1.8, 17.6 + b, 13.8 + i * 1.8, 14.4 + b, B[2], EMB[2]);
          else for (i = -2; i <= 2; i++) p.tri(15 + i * 2.4, 17 + i * 2.4, 18 + b, 16 + i * 2.4, 15.4 + b - (i ? 0 : 0.6), B[2], EMB[2]);
        }
        return;
      }
      /* wisps of smoke curl from the tips of its ears from stage 2 */
      if (s >= 2) {
        var wl = 1.6 + s * 0.4;
        if (d === 2) plume(p, 14, 3.6 + b, -0.6, wl, 1, [SMK], 1.2 + sw, 0.4);
        else { plume(p, 9.8, 3.4 + b, -2.4, wl, 1, [SMK], -1.2 + sw, 0.4); plume(p, 22.2, 3.4 + b, -0.7, wl, 1, [SMK], 1.2 + sw, 0.4); }
      }
    }),
    flarefox: gstg(function (p, f, s, L, d, b) {
      var C = NP5.ffC, sw = Math.sin(p.ph * 2) * 0.5, i;
      if (L === 'back') {
        /* a ruff of warm fur round its neck from stage 4 */
        if (s >= 4) {
          if (d === 2) for (i = 0; i < 3; i++) p.ell(13 + i * 1.6, 18.4 + b + i * 0.4, 1.8, 1.6, C);
          else for (i = -2; i <= 2; i++) p.ell(16 + i * 2.4, 18.6 + b + Math.abs(i) * -0.3, 1.9, 1.6, C);
        }
        return;
      }
      /* the tail tip warms in the body painter from stage 2; small flames dance on the ear tips from stage 3 */
      if (s >= 3) {
        if (d === 2) { flame(p, 12.5, 1.6 + b, 1.6 + s * 0.4, 0.9, sw); flame(p, 16.5, 1.9 + b, 1.4 + s * 0.3, 0.8, -sw); }
        else { flame(p, 5.4, 1.6 + b, 1.6 + s * 0.4, 0.9, sw); flame(p, 26.6, 1.6 + b, 1.6 + s * 0.4, 0.9, -sw); }
      }
      if (s >= 5 && d !== 1) { var x = d === 2 ? 10 : 16, y = (d === 2 ? 10.4 : 9.8) + b; p.ell(x, y, 1.2, 1.2, [EMB[0], EMB[1]]); }
    }),
    kilnturtle: (function () {
      var base = gstg(function (p, f, s, L, d, b) {
        var S = NP5.ktS, CuR = CU, i;
        b *= 0.5;
        if (L === 'back') {
          /* the chimney grows tall from stage 3, and a second one rises from stage 4 */
          if (s >= 3) { var x = d === 2 ? 20 : 19.5, y = (d === 2 ? 7.6 : 6.4) + b; p.rect(x - 1.5, y - 2 - (s - 3), 3, 3 + (s - 3), S[2]); p.rect(x - 2, y - 2.6 - (s - 3), 4, 1, S[3]); }
          if (s >= 4 && d !== 2) { p.rect(11, 8.6 + b, 2.6, 3.6, S[2]); p.rect(10.6, 8 + b, 3.4, 1, S[3]); }
          if (s >= 4 && d === 2) { p.rect(13.4, 9.4 + b, 2.6, 3.6, S[2]); p.rect(13, 8.8 + b, 3.4, 1, S[3]); }
          return;
        }
        /* a copper rim rings its shell from stage 4 */
        if (s >= 4) {
          if (d === 2) p.rect(9.5, 22.2 + b, 16, 1, CuR[1]);
          else p.rect(7.4, 21.8 + b, 17.2, 1, CuR[1]);
        }
      });
      return function (p, f, s, L) {
        base(p, f, s, L);
        if (L !== 'fx') return;
        /* warm smoke rises from the chimney (its cause is in plain sight) */
        var d = p.side ? 2 : p.back ? 1 : 0, b = hop(p) * 0.5, x = d === 2 ? 20 : 19.5, y = (d === 2 ? 7.6 : 6.4) + b - (s >= 3 ? 3 + (s - 3) : 1);
        for (var i = 0; i < 2; i++) { var t = ((f / NF) + i / 2) % 1, r = 0.8 + t * 1.4; if (t < 0.8) p.ell(x + t * 3, y - t * 8, r, r, SMK, true); }
      };
    })(),
    sunflare: gstg(function (p, f, s, L, d, b) {
      var G = NP5.sfG, fl = flyF(p), cy = 17 + Math.round(fl * 0.5 * 2) / 2, fp = Math.sin(p.ph * (p.mode === 'move' ? 4 : 2)), i;
      if (L === 'back') {
        /* long golden tail feathers from stage 3; wide shining wings from stage 4 (the rays grow in the body painter) */
        if (s >= 3) {
          var tp = [G, G, [EMB[0], EMB[1], EMB[1]]];
          if (d === 2) for (i = 0; i < 2; i++) plume(p, 21, cy + 3, 0.3 + i * 0.4, 3 + s * 1.3, 1.3, tp, 0.8, 0.4);
          else for (i = -1; i <= 1; i++) plume(p, 16, cy + 5, 1.57 + i * 0.4, 2 + s, 1.3, tp, i * 0.4, 0.4);
        }
        if (s >= 4) {
          var ed = [G, G, [G[0], G[0], G[1]]];
          if (d === 2) plume(p, 18, cy - 1 - fp, -0.8, 4 + s, 3, ed, -1, 0.6);
          else [-1, 1].forEach(function (m) { plume(p, 16 + m * 6, cy - 1 - fp, m > 0 ? -0.4 : Math.PI + 0.4, 3 + s, 3, ed, m * -1, 0.6); });
        }
      }
    })
  };
  var EL5 = [
    ['cavebat', 'earth', 'dark', '#1e1420', 1, [['Echopip', 'A round cave bat with huge ears. It hangs in the dark and listens to the stone.'], ['Echowing', 'A fluffy collar of fur grows round its neck.'], ['Gloomvane', 'Pale crystal claws grow at the tips of its wings.'], ['Caverncloak', 'Its wings open wide, like a cloak for the dark.'], ['Deepecho', 'A legendary bat that can hear a single drop fall in the deepest cave.']]],
    ['geodeling', 'earth', 'light', '#2a2632', 0, [['Druselet', 'A round stone that is hollow and full of crystals. It sparkles where its shell is cracked.'], ['Prismcrag', 'More crystals crowd out of the crack in its shell.'], ['Glintspire', 'One tall crystal rises from the middle, bright as a lamp.'], ['Lumendrusa', 'Crystal clusters grow on its shoulders.'], ['Heartgeode', 'A legendary geode with a crystal heart that lights the whole cave.']]],
    ['burrowkit', 'earth', null, '#2e2014', 0, [['Tunnelpaw', 'A round kitten with big pink digging paws. It always has a little earth on its nose.'], ['Claymitt', 'Its digging paws grow broad and strong.'], ['Shalewhisk', 'An amber stone shines on its brow like a miner\'s lamp.'], ['Burrowmane', 'A ridge of stone plates runs down its back.'], ['Deepdelver', 'A legendary cat that digs roads under the mountains for others to walk.']]],
    ['slatehorn', 'earth', null, '#22262e', 0, [['Flintcalf', 'A sturdy rhino calf of slate grey with one stubby horn on its nose.'], ['Slatebrow', 'A second, smaller horn grows above the first.'], ['Shalehide', 'Plates of slate cover its back.'], ['Ridgeplow', 'Its horn grows long and a ridge of stone runs along its spine.'], ['Mountainhide', 'A legendary rhino as steady as the mountain it walks on.']]],
    ['mossmite', 'earth', 'grass', '#24201a', 0, [['Mossmite', 'A pill bug with a dome of stone plates and soft moss on top. It rolls up when it is shy.'], ['Lichenroll', 'Pale lichen spreads across its shell.'], ['Fernplate', 'A little fern sprouts from the moss on its back.'], ['Bloomback', 'More ferns grow, and small flowers open among them.'], ['Verdantroll', 'A legendary pill bug whose back is a little rolling hill of moss and flowers.']]],
    ['pebblequail', 'earth', null, '#2a1e14', 0, [['Gritquail', 'A round quail chick with a speckled coat and a pebble on the tip of its topknot.'], ['Cobbleplume', 'Its topknot grows a second pebble.'], ['Stonecrest', 'Stone-grey scales mark its wings.'], ['Ridgequail', 'A fan of long tail feathers opens behind it.'], ['Summitquail', 'A legendary quail whose call echoes from peak to peak.']]],
    ['quartzsnail', 'earth', null, '#3a2028', 0, [['Glintsnail', 'A soft peach snail that carries a spiral shell of rose quartz.'], ['Rosewhorl', 'Small crystal points grow on the rim of its shell.'], ['Quartzspire', 'A tall crystal rises from the top of its shell.'], ['Prismcurl', 'Crystals cover its shell and catch every light.'], ['Geomantle', 'A legendary snail whose shell is a little crystal cave.']]],
    ['rumbletoad', 'earth', 'water', '#2a1e12', 0, [['Rumbletoad', 'A wide stone-brown toad with a round throat sac that hums like a drum.'], ['Drumthroat', 'Its throat sac grows big; its croak booms like a drum.'], ['Stonewart', 'Its warts harden into round river stones.'], ['Quakecroak', 'A crest of stone rises over its eyes.'], ['Riverdrum', 'A legendary toad whose croak makes the riverbed hum.']]],
    ['cinderkit', 'fire', null, '#1e1a22', 0, [['Kindlet', 'A round charcoal kitten with warm ember ears and a little flame at the tip of its tail.'], ['Emberwhisk', 'Its whiskers glow like warm wire.'], ['Charpaw', 'Small flames dance on its ear tips and its paws glow.'], ['Flamemane', 'A soft mane of flame rings its neck.'], ['Hearthkeeper', 'A legendary cat that keeps the fire alive in every hearth of the mountain.']]],
    ['ashmoth', 'fire', 'wind', '#3a2a22', 1, [['Ashmoth', 'A fluffy ash-white moth with round wings fringed in ember orange.'], ['Smokewing', 'Long tails like smoke trail from its hind wings.'], ['Cinderveil', 'Ember eyespots glow on its wings.'], ['Emberdrift', 'Its wings grow wide, edged with glowing embers.'], ['Sunsetwing', 'A legendary moth whose wings carry the colours of a fire at dusk.']]],
    ['magmapup', 'fire', 'earth', '#1a1420', 0, [['Scorchpup', 'A basalt puppy with floppy ears and warm lava glowing in the cracks of its coat.'], ['Basaltpup', 'The lava cracks spread down to its paws.'], ['Lavaridge', 'A ridge of warm lava rocks rises along its back.'], ['Craterhound', 'Drops of glowing lava hang from its ears.'], ['Mountfire', 'A legendary dog that sleeps in the mouth of the volcano.']]],
    ['emberfinch', 'fire', null, '#3a1410', 1, [['Emberfinch', 'A round red finch with a gold beak and a little flame for a crest.'], ['Flickercrest', 'Its flame crest grows taller and flickers.'], ['Sparkplume', 'Long ember feathers grow in its tail.'], ['Blazewing', 'Its wings open wide with flame at the tips.'], ['Hearthsong', 'A legendary finch whose song lights the morning fires.']]],
    ['soothound', 'fire', 'dark', '#1a1824', 0, [['Sootpaw', 'A slim smoke-grey hound pup with pale socks and a warm ember spot on its chest.'], ['Smokewhisk', 'Wisps of smoke curl from the tips of its ears.'], ['Cinderhackle', 'Embers glow in the fur along its neck.'], ['Gloamhound', 'Its tail grows long and trails smoke.'], ['Nightkiln', 'A legendary hound that guards the fires that burn through the night.']]],
    ['flarefox', 'fire', null, '#3a2410', 0, [['Fennflare', 'A sand-gold fennec with huge ears. It loves the hottest stone on the road.'], ['Sandflicker', 'The tip of its tail glows like a coal.'], ['Flareear', 'Small flames dance at the tips of its ears.'], ['Sunfennec', 'A ruff of warm fur rings its neck.'], ['Miragefox', 'A legendary fox with a sun mark on its brow. It walks the hot roads inside a shimmer of heat.']]],
    ['kilnturtle', 'fire', 'earth', '#2a1810', 0, [['Kilnshell', 'A stony turtle that carries a dome of brick with a little chimney on top.'], ['Brickback', 'Warm smoke puffs from its chimney.'], ['Chimneyplod', 'Its chimney grows tall.'], ['Forgeshell', 'A second chimney rises and a copper rim rings its shell.'], ['Hearthmount', 'A legendary turtle that carries a warm hearth on its back for travellers.']]],
    ['sunflare', 'fire', 'light', '#4a2a14', 1, [['Sunnip', 'A round golden chick with a little crown of rays.'], ['Raycrest', 'Its crown of rays grows longer.'], ['Dawnflare', 'Long golden tail feathers trail behind it.'], ['Noonplume', 'Its wings open wide and shine like morning light.'], ['Zenithar', 'A legendary bird that rises with the sun and carries its light into dark places.']]]
  ];
  var HAB5 = {
    cavebat:     { f: { rock: 2, wall: 1.6, shade: 2, mushroom: 1 }, day: 0.1, night: 2.6, wx: { fog: 1.4, rain: 1.2 }, rare: 0.6 },
    geodeling:   { f: { rock: 2.6, wall: 1.4, shade: 0.8, statue: 0.6 }, day: 0.8, night: 1.3, wx: { clear: 1.2 }, rare: 0.4 },
    burrowkit:   { f: { path: 1.6, rock: 1.4, field: 1.2, garden: 0.8 }, day: 1, night: 0.8, wx: { rain: 0.8 }, rare: 0.85 },
    slatehorn:   { f: { rock: 2.4, path: 1.2, open: 0.8 }, day: 1.2, night: 0.6, wx: { clear: 1.1 }, rare: 0.5 },
    mossmite:    { f: { rock: 1.6, tallgrass: 1.4, shade: 1.2, mushroom: 1, tree: 0.6 }, day: 0.8, night: 1.1, wx: { rain: 1.8, fog: 1.2 }, rare: 0.8 },
    pebblequail: { f: { tallgrass: 1.8, rock: 1.4, path: 1, field: 1 }, day: 1.3, night: 0.4, wx: { clear: 1.3, rain: 0.6 }, rare: 0.9 },
    quartzsnail: { f: { rock: 2, wall: 1.4, shade: 1, water: 0.6 }, day: 0.6, night: 1.4, wx: { rain: 2, fog: 1.2 }, rare: 0.55 },
    rumbletoad:  { f: { water: 2, rock: 1.6, reeds: 1, sand: 0.6 }, day: 0.9, night: 1.2, wx: { rain: 2.2 }, rare: 0.5 },
    cinderkit:   { f: { warm: 2.4, path: 1, rock: 1, wall: 0.8 }, day: 1, night: 0.9, wx: { clear: 1.3, rain: 0.4 }, rare: 0.85 },
    ashmoth:     { f: { warm: 2, lamp: 1.6, open: 1, flowers: 0.6 }, day: 0.3, night: 2, wx: { wind: 1.8, clear: 1, rain: 0.4 }, rare: 0.5 },
    magmapup:    { f: { warm: 2.6, rock: 1.6, sand: 0.8 }, day: 1, night: 0.9, wx: { clear: 1.3, rain: 0.3 }, rare: 0.6 },
    emberfinch:  { f: { warm: 1.6, tree: 1.4, open: 1.2, flowers: 0.8 }, day: 1.4, night: 0.3, wx: { clear: 1.4, rain: 0.5 }, rare: 0.9 },
    soothound:   { f: { warm: 1.8, shade: 1.6, rock: 1, path: 0.8 }, day: 0.3, night: 2.2, wx: { fog: 1.6, clear: 0.9, rain: 0.5 }, rare: 0.45 },
    flarefox:    { f: { sand: 2.2, warm: 1.8, rock: 1, open: 0.8 }, day: 1.3, night: 0.6, wx: { clear: 1.6, rain: 0.3 }, rare: 0.4 },
    kilnturtle:  { f: { warm: 2.4, rock: 1.4, path: 0.8, wall: 0.6 }, day: 1, night: 1, wx: { clear: 1.2, rain: 0.5 }, rare: 0.45 },
    sunflare:    { f: { warm: 1.6, open: 1.6, flowers: 1, statue: 0.6 }, day: 1.6, night: 0.1, wx: { clear: 2, rain: 0.3, fog: 0.5 }, rare: 0.3 }
  };
  EL5.forEach(function (d) {
    var key = d[0], e = { key: key, name: d[5][0][0], element: d[1] };
    if (d[2]) { e.element2 = d[2]; EL2[key] = d[2]; }
    SEED[key] = hash(list.length * 3.7 + 1.3);
    list.push(e);
    DEF[key] = DEF5[key]; STG[key] = STG5[key]; OUT[key] = d[3]; if (d[4]) FLY[key] = 1;
    BASEK[key] = ELK[d[1]]; AURA[key] = AURA[ELK[d[1]]];
    STAGES[key] = d[5];
    stages[key] = d[5].map(function (a) { return { name: a[0], desc: a[1] }; });
    HAB3[key] = HAB5[key];
  });
  GLOW.geodeling = 0.3; GLOW.sunflare = 0.32; GLOW.magmapup = 0.26; GLOW.cinderkit = 0.24;
  /* ---------- sixth wave (chapters 8 and 9: the town of dusk and the golden city): sixteen kinds with bodies of their own.
     They come after the fifth wave in the list, so every earlier seed stays the same. */
  var NP6 = {
    dlF: ['#d8ccec', '#a898cc', '#7e6ea8', '#5a4c84'], dlC: ['#f6f0ff', '#e4dcf4', '#c4b8e0', '#a496c4'],
    mlB: ['#6a6898', '#46447a', '#32305e', '#222044'], mlW: ['#7a88c8', '#5260a8', '#3c4888', '#2a3468'], mlF: ['#f4f2ff', '#dcdaf0', '#b8b6d8', '#9694bc'],
    spF: ['#8886c4', '#5a5898', '#42407c', '#2e2c5e'], spC: ['#ffffff', '#eef0ff', '#c8ccec', '#a4a8d4'],
    goF: ['#a88ed0', '#7660a8', '#584684', '#3e2e64'], goE: ['#fffcf0', '#fff4c4', '#ecd894', '#c8b070'],
    nfB: ['#6a7ac0', '#46569c', '#34427c', '#26305c'], nfC: ['#f0f6ff', '#d4e2f6', '#a8bcdc', '#8098c4'],
    vcF: ['#ece8f6', '#cac2e4', '#a298c4', '#7e74a4'], vcV: ['#ffffff', '#f0eaff', '#d8ccf6', '#b8a8e4'],
    sbF: ['#9c8ca8', '#72647e', '#54485e', '#3a3042'], sbS: ['#f0d8e8', '#d8b0c8', '#b08ca4', '#8a6a80'], sbM: ['#ecd4ff', '#b888e8', '#8a5cc4', '#64409a'],
    csW: ['#6c6478', '#4a4456', '#36303e', '#26222c'], csV: ['#fbf0ff', '#d8acff', '#a46cf0', '#7444c4'],
    scF: ['#fff2c8', '#f6d088', '#dcaa5c', '#b48444'], scM: ['#fff6a8', '#ffd850', '#f0aa30', '#c88020'], scC: ['#fffcf0', '#fff2dc', '#f4dcbc', '#dcc09c'],
    gbB: ['#fff8c0', '#ffdc68', '#ecac34', '#bc8222'], gbS: '#6a5038', gbW: ['#ffffff', '#f2faff', '#d4ecfa', '#b0d4ec'],
    hfF: ['#fbe8d2', '#e8c49c', '#c49e74', '#9c7852'], hfC: ['#fffcf4', '#fff4e4', '#f2dcc0', '#d8c0a0'], hfA: ['#fff8d8', '#f0dca0', '#d4b874', '#ac9252'],
    pbW: ['#ffffff', '#f4f7ff', '#d8e0f2', '#b2bfda'],
    dpF: ['#fff8f0', '#fce6d6', '#efc4ac', '#d49e86'], dpT: ['#ffe8b0', '#ffb88c', '#ff8e86', '#e06a72'],
    gsB: ['#f8f2e6', '#e2d6be', '#beb096', '#988c74'], gsG: ['#ffffff', '#eef8fc', '#cae6f0', '#a2cade'],
    kiB: ['#ffffff', '#fffaf2', '#f2e4d0', '#d6c2a8'], kiG: ['#fff4b0', '#ffcc48', '#eea02a', '#c07a1c'], kiF: ['#ffffff', '#fff6ec', '#f6e0d2', '#dcc0b0'],
    swF: ['#ffffff', '#f6f4fc', '#dcdaee', '#b8b6d2'], swC: ['#ffffff', '#fffcf6', '#f2ece0', '#d8d0c0']
  };
  var STR = ['#fffbe0', '#fff070', '#f0c840', '#c89a20'], MOON = ['#fffef0', '#fff4c0', '#ecd890', '#c8b468'];
  var RAIN = ['#ff9a9a', '#ffc070', '#fff080', '#9ae08a', '#8ac8ff', '#c0a0ff'];
  /* a small five-point star */
  function star5(p, x, y, r, C) { p.tri(x - r * 0.4, x + r * 0.4, y + r * 0.2, x, y - r, C[1]); p.rect(x - r, y - r * 0.15, r * 2, r * 0.55, C[1]); p.tri(x - r * 0.8, x - r * 0.1, y + r * 0.9, x - r * 0.6, y + r * 0.9, C[1]); p.tri(x + r * 0.1, x + r * 0.8, y + r * 0.9, x + r * 0.6, y + r * 0.9, C[1]); p.ell(x, y + r * 0.1, r * 0.55, r * 0.5, [C[0], C[1]], true); }
  /* a small crescent moon opening to the right */
  function crescent(p, x, y, r, C, bg) { p.ell(x, y, r, r, [C[0], C[1]], true); p.ell(x + r * 0.5, y - r * 0.2, r * 0.75, r * 0.75, [bg, bg], true); }
  var DEF6 = {
    duskling: function (p, f) { /* Duskling: a lilac moon hare with long ears and a pale crescent on its brow */
      var F = NP6.dlF, C = NP6.dlC, b = hop(p), sw = Math.sin(p.ph) * 0.6, el = p.stage >= 4 ? 1.6 + (p.stage - 4) * 0.8 : 0;
      if (p.side) {
        plume(p, 13, 10 + b, -1.75, 8 + el * 2, 1.8, [F, F], -0.8 + sw, 0.25);
        p.ell(23.4, 20.4 + b, 2.2, 2, C);
        legsSide(p, [[19.5, 1, 1]], 23 + b, 28, 2, F[2], F[3]);
        p.ell(17, 21.6 + b, 6.4, 4.6, F);
        p.ell(14.6, 23 + b, 3, 2.4, C);
        p.ell(21, 26.6, 3.2, 1.4, F);
        legsSide(p, [[13, 0, 0]], 23 + b, 28, 1.8, F[1], F[2]);
        p.ell(10.5, 14.6 + b, 5.2, 4.6, F);
        p.ell(7, 16.2 + b, 2.2, 1.6, C);
        p.px(5, 15.4 + b, '#e88aa8');
        crescent(p, 10.6, 10.6 + b, 1.2, MOON, F[1]);
        plume(p, 14.5, 10.5 + b, -1.45, 8 + el * 2, 1.8, [F, F], -1 + sw, 0.25);
        p.rect(13.9, 5 - el * 1.6 + b, 0.9, 4.4 + el * 1.4, C[2]);
        eye1(p, 8, 12.8 + b, true);
        p.blush(10.2, 16.6 + b, '#ff9ab0');
        return;
      }
      [-1, 1].forEach(function (m) { p.ell(16 + m * 3.6 + m * sw * 0.3, 6.6 - el + b, 1.9, 5.6 + el, F); if (!p.back) p.ell(16 + m * 3.6 + m * sw * 0.3, 7 - el + b, 0.9, 4.2 + el, [C[1], C[2]], true); });
      p.ell(16, 22 + b, 6, 5, F);
      feet2(p, 11.6, 17.6, 26, 2.8, 2, C[1]);
      p.ell(16, 14.2 + b, 6.4, 5.2, F);
      if (p.back) { p.ell(16, 25 + b, 2.4, 2.2, C); return; }
      p.ell(16, 23 + b, 3.4, 3.4, C);
      crescent(p, 15.6, 10.6 + b, 1.3, MOON, F[1]);
      eyes2(p, 12.4, 17.6, 12.8 + b, true);
      p.ell(16, 16.2 + b, 2.2, 1.3, C); p.px(15.5, 15.6 + b, '#e88aa8'); p.px(16, 15.6 + b, '#e88aa8');
      p.blush(10.2, 15.4 + b, '#ff9ab0'); p.blush(19.8, 15.4 + b, '#ff9ab0');
    },

    mothlight: function (p, f) { /* Mothlight: a night-blue moth whose wings carry soft glowing spots, with a pale fluffy face */
      var B = NP6.mlB, W = NP6.mlW, Fc = NP6.mlF, fl = flyF(p), cy = 16 + Math.round(fl * 0.5 * 2) / 2, fp = Math.sin(p.ph * (p.mode === 'move' ? 4 : 2)) * 0.8;
      function wing(x, y, rx, ry, g) { p.ell(x, y, rx, ry, W); if (g) p.ell(x + g * 0.6, y - 0.4, 1.1, 1.1, [STR[0], STR[1]], true); }
      function ant(x, m) { plume(p, x, cy - 7, -1.57 + m * 0.55, 4, 0.6, [[B[3], B[3]]], m * 0.8, 0); p.ell(x + m * 2.4, cy - 10.4, 0.8, 0.8, [STR[0], STR[1]], true); }
      if (p.side) {
        wing(19.5, cy - 3 - fp, 5, 5.4, 1); wing(19.5, cy + 4 + fp * 0.5, 3.4, 3, 0);
        ant(13.6, -1);
        p.ell(16, cy + 2, 3.4, 5.8, B);
        p.ell(13.8, cy - 4.2, 3.8, 3.6, Fc);
        eye1(p, 11, cy - 5.4, true);
        p.blush(13, cy - 3, '#ff9ab0');
        return;
      }
      var sq = Math.abs(fp) * 0.6;
      wing(9, cy - 3 - fp, 5.4 - sq, 4.8, -1); wing(23, cy - 3 - fp, 5.4 - sq, 4.8, 1);
      wing(10.4, cy + 4 + fp * 0.5, 3.6, 3.2, 0); wing(21.6, cy + 4 + fp * 0.5, 3.6, 3.2, 0);
      ant(14.6, -1); ant(17.4, 1);
      p.ell(16, cy + 2, 3.4, 6, B);
      if (p.back) { p.ell(16, cy - 4, 4.4, 3.6, B); p.rect(13.8, cy + 2, 4.4, 0.6, B[3]); p.rect(14.2, cy + 4.6, 3.6, 0.6, B[3]); return; }
      p.ell(16, cy - 4, 4.6, 3.8, Fc);
      eyes2(p, 13, 17.2, cy - 5.4, true);
      p.blush(12.4, cy - 2.4, '#ff9ab0'); p.blush(19.6, cy - 2.4, '#ff9ab0');
    },

    shadepup: function (p, f) { /* Shadepup: a round indigo wolf cub with a pale moon on its chest */
      var F = NP6.spF, C = NP6.spC, b = hop(p), sw = Math.sin(p.ph) * 1;
      function tail(x, y, a) { plume(p, x, y, a, 6, 2, [F, F, [C[1], C[2], C[2]]], 1.4 + sw, 0.3); }
      if (p.side) {
        tail(22.5, 21 + b, -0.8);
        legsSide(p, [[20, 1, 1], [13.5, 0, 1]], 23 + b, 28, 2, F[2], F[3]);
        p.ell(17.4, 21.4 + b, 6.2, 4.4, F);
        p.ell(13.8, 22 + b, 2.8, 2.8, C);
        legsSide(p, [[21, 0, 0], [12.6, 1, 0]], 23 + b, 28, 2.2, F[1], F[2]);
        p.tri(11, 14.6, 10.6 + b, 13.4, 4.4 + b, F[2], INR);
        p.ell(10.5, 14.4 + b, 5.2, 4.6, F);
        p.ell(6.4, 16.4 + b, 2.6, 1.7, C);
        p.rect(3.6, 15.4 + b, 1.4, 1.1, '#1a1430');
        eye1(p, 8, 12.6 + b, true);
        p.blush(10, 16.6 + b, '#ff9ab0');
        return;
      }
      if (!p.back) tail(21, 23.5 + b, -0.9);
      p.ell(16, 21.8 + b, 6, 5, F);
      feet2(p, 12, 17.6, 25.6, 2.6, 2.4, F[2], F[1]);
      p.tri(9, 13, 10.4 + b, 9.6, 4 + b, F[2], p.back ? F[2] : INR);
      p.tri(19, 23, 10.4 + b, 22.4, 4 + b, F[2], p.back ? F[2] : INR);
      p.ell(16, 13.8 + b, 6.6, 5.2, F);
      if (p.back) { tail(16, 25 + b, -1.3); return; }
      crescent(p, 15.4, 21.6 + b, 2.4, C, F[1]);
      p.ell(16, 16.4 + b, 3, 2, C);
      p.rect(15.3, 15.3 + b, 1.4, 1.1, '#1a1430');
      eyes2(p, 12.4, 17.6, 12 + b, true);
      p.blush(10.4, 15 + b, '#ff9ab0'); p.blush(19.6, 15 + b, '#ff9ab0');
    },

    gloomowl: function (p, f) { /* Gloomowl: a round purple owlet with huge moon-pale eye discs */
      var F = NP6.goF, E = NP6.goE, fl = flyF(p), cy = 17 + Math.round(fl * 0.5 * 2) / 2, fp = Math.sin(p.ph * (p.mode === 'move' ? 4 : 2)), tf = 1.4 + (p.stage - 1) * 0.7;
      if (p.side) {
        plume(p, 21.5, cy + 4, 0.7, 3, 1.6, [F, F], 0, 0.4);
        p.tri(14.6, 17.4, cy - 5, 17, cy - 6.6 - tf, F[2], F[1]);
        p.ell(16.5, cy, 7, 7.4, F);
        p.ell(11.6, cy - 1, 3.4, 3.8, E);
        eye1(p, 10, cy - 2.4, true);
        p.tri(8, 9.4, cy + 0.6, 7.6, cy + 1.8, '#d0a050');
        p.blush(12.4, cy + 2, '#ff9ab0');
        p.ell(18.6, cy + 1 - fp, 4, 4.4, [F[1], F[2], F[3]]);
        p.rect(14.6, cy + 7, 1.2, 1.6, '#d0a050'); p.rect(17, cy + 7, 1.2, 1.6, '#d0a050');
        return;
      }
      p.ell(8.4, cy + 1 - fp, 2.6, 4.6, [F[1], F[2], F[3]]); p.ell(23.6, cy + 1 - fp, 2.6, 4.6, [F[1], F[2], F[3]]);
      p.tri(9.6, 12.6, cy - 5, 9.4, cy - 6.6 - tf, F[2], F[1]); p.tri(19.4, 22.4, cy - 5, 22.6, cy - 6.6 - tf, F[2], F[1]);
      p.ell(16, cy, 7.6, 7.6, F);
      p.rect(13.4, cy + 7.2, 1.3, 1.6, '#d0a050'); p.rect(17.3, cy + 7.2, 1.3, 1.6, '#d0a050');
      if (p.back) { p.ell(16, cy + 5, 2.4, 1.6, [F[2], F[3]]); return; }
      p.ell(12.6, cy - 1.4, 3.4, 3.4, E); p.ell(19.4, cy - 1.4, 3.4, 3.4, E);
      eyes2(p, 11.6, 18.4, cy - 2.8, true);
      p.tri(15.2, 16.8, cy + 1.6, 16, cy + 3, '#d0a050');
      p.ell(16, cy + 5, 3.4, 2, [F[0], F[1]], true);
      p.blush(10.2, cy + 2.6, '#ff9ab0'); p.blush(21.8, cy + 2.6, '#ff9ab0');
    },

    nightfin: function (p, f) { /* Nightfin: a little night ray with a starry back and a pale belly; it glides over dark water */
      var B = NP6.nfB, C = NP6.nfC, fl = flyF(p), cy = 17 + Math.round(fl * 0.5 * 2) / 2, fp = Math.sin(p.ph * (p.mode === 'move' ? 4 : 2)) * 1.4;
      function spots(y) { p.px(12, y - 1, STR[0]); p.px(19.5, y, STR[0]); p.px(15.6, y + 2, STR[1]); }
      if (p.side) {
        plume(p, 22, cy + 1, 0.15, 7, 0.7, [[B[2], B[3]]], 0.6, 0);
        p.ell(15.5, cy - 1.6 - fp * 0.6, 5, 2.6, [B[1], B[2], B[3]]);
        p.ell(15, cy + 0.6, 7.4, 3, B);
        p.ell(14.4, cy + 2, 6, 1.4, C);
        p.ell(8.2, cy + 1.4, 1.4, 1.8, B);
        eye1(p, 9.6, cy - 1, true);
        p.blush(11.4, cy + 1.4, '#ff9ab0');
        p.px(16, cy - 1.6, STR[0]); p.px(19, cy - 0.6, STR[0]);
        return;
      }
      /* wide wing fins that beat slowly */
      p.tri(4, 13, cy + 1.6, 2.6, cy - 1.6 - fp, B[1]); p.tri(19, 28, cy + 1.6, 29.4, cy - 1.6 - fp, B[1]);
      p.ell(7.8, cy + 0.2 - fp * 0.4, 4.6, 2.6, B); p.ell(24.2, cy + 0.2 - fp * 0.4, 4.6, 2.6, B);
      if (p.back) { plume(p, 16, cy + 4, 1.57, 6, 0.7, [[B[2], B[3]]], Math.sin(p.ph) * 2.4, 0); p.ell(16, cy, 6.4, 5.2, B); spots(cy); return; }
      p.ell(12.6, cy - 4.4, 1.3, 2, B); p.ell(19.4, cy - 4.4, 1.3, 2, B);
      p.ell(16, cy, 6.4, 5.2, B);
      p.ell(16, cy + 1.8, 4.6, 2.8, C);
      eyes2(p, 12.6, 17.4, cy - 2.6, true);
      smile(p, 14, cy + 1.6, B[3]);
      p.blush(10.4, cy + 0.8, '#ff9ab0'); p.blush(21.6, cy + 0.8, '#ff9ab0');
    },

    veilcat: function (p, f) { /* Veilcat: a slender lilac cat with a sheer veil that falls from its head over its back */
      var F = NP6.vcF, V = NP6.vcV, b = hop(p), sw = Math.sin(p.ph) * 1.2, vl = 5 + (p.stage >= 2 ? 3 : 0);
      if (p.side) {
        plume(p, 23, 21 + b, -1.3, 7, 1.2, [F, F], 2.4 + sw, 0.2);
        legsSide(p, [[20.5, 1, 1], [14, 0, 1]], 23 + b, 28, 1.5, F[2], F[3]);
        p.ell(17.6, 21.2 + b, 6.2, 3.8, F);
        legsSide(p, [[21.5, 0, 0], [13, 1, 0]], 23 + b, 28, 1.7, F[1], F[2]);
        p.tri(10.6, 13.8, 10.6 + b, 12.4, 4.6 + b, F[2], INR);
        p.ell(10.4, 14.2 + b, 4.8, 4.4, F);
        plume(p, 13, 10.6 + b, 0.35, vl, 2, [V, V, [V[0], V[1], V[1]]], 1.4 + sw * 0.4, 0.1);
        p.ell(6.8, 16 + b, 2, 1.4, V);
        p.px(4.8, 15.2 + b, '#e88aa8');
        eye1(p, 8, 12.8 + b, true);
        p.blush(10, 16.4 + b, '#ff9ab0');
        return;
      }
      if (!p.back) plume(p, 21, 24 + b, -1.1, 7, 1.2, [F, F], 2 + sw, 0.2);
      p.ell(16, 21.8 + b, 5, 5, F);
      feet2(p, 12.8, 17.4, 26, 2, 2, F[1]);
      if (p.back) {
        p.tri(9.5, 13, 10.6 + b, 10, 4.4 + b, F[2], F[2]); p.tri(19, 22.5, 10.6 + b, 22, 4.4 + b, F[2], F[2]);
        p.ell(16, 13.6 + b, 6, 4.8, F);
        plume(p, 16, 11 + b, 1.57, vl + 4, 3.4, [V, V, [V[0], V[1], V[1]]], sw * 0.4, 0.2);
        plume(p, 16, 25 + b, -1.3, 7, 1.2, [F, F], 2 + sw, 0.2);
        return;
      }
      [-1, 1].forEach(function (m) { plume(p, 16 + m * 5.6, 12 + b, 1.57 - m * 0.25, vl - 1, 1.6, [V, V], m * 0.6, 0.2); });
      p.tri(9.5, 13, 10.6 + b, 10, 4.4 + b, F[2], INR); p.tri(19, 22.5, 10.6 + b, 22, 4.4 + b, F[2], INR);
      p.ell(16, 13.6 + b, 6, 4.8, F);
      p.ell(16, 9.8 + b, 4.6, 1.4, V);
      p.ell(16, 22.6 + b, 2.6, 3, V);
      eyes2(p, 12.6, 17.4, 12 + b, true);
      p.ell(16, 15.8 + b, 2.2, 1.3, V); p.rect(15.5, 15.1 + b, 1, 0.7, '#e88aa8');
      p.blush(10.6, 14.8 + b, '#ff9ab0'); p.blush(19.4, 14.8 + b, '#ff9ab0');
    },

    shadeboar: function (p, f) { /* Snufflet: a round dusky piglet with a big soft snout and a glowing mushroom on its back */
      var F = NP6.sbF, Sn = NP6.sbS, M = NP6.sbM, T = ['#fffaf0', '#f0e4c8', '#d0c0a0'], b = hop(p) * 0.6;
      function shroom(x, y, r) { p.rect(x - 0.5, y, 1, r * 1.1, T[1]); p.ell(x, y, r, r * 0.7, M); p.px(x - r * 0.4, y - r * 0.3, M[0]); }
      if (p.side) {
        legsSide(p, [[12.5, 1, 1], [20.5, 0, 1]], 23.5 + b, 28, 2.2, F[2], F[3]);
        shroom(19, 13.4 + b, 2.2);
        p.ell(17.5, 20.6 + b, 7.6, 5.4, F);
        p.px(25, 18.6 + b, F[3]); p.px(25.6, 19.6 + b, F[3]);
        legsSide(p, [[13.6, 0, 0], [21.6, 1, 0]], 23.5 + b, 28, 2.4, F[1], F[2]);
        p.tri(10.6, 13.4, 14 + b, 12.6, 10.4 + b, F[2], INR);
        p.ell(9.6, 18 + b, 5, 4.4, F);
        p.ell(5.2, 19.4 + b, 2, 2.2, Sn);
        p.px(4.4, 19 + b, Sn[3]);
        p.tri(5.8, 7, 21.4 + b, 6.2, 19.2 + b, T[1]);
        eye1(p, 8, 16 + b, true);
        p.blush(10.4, 19.6 + b, '#ff9ab0');
        return;
      }
      feet2(p, 9.8, 19.2, 24.6, 3, 3.4, F[2], F[1]);
      if (!p.back) shroom(20.6, 9.6 + b, 2);
      p.ell(16, 20.4 + b, 8.4, 5.8, F);
      p.tri(8, 11.4, 12 + b, 8.6, 8 + b, F[2], p.back ? F[2] : INR); p.tri(20.6, 24, 12 + b, 23.4, 8 + b, F[2], p.back ? F[2] : INR);
      p.ell(16, 15 + b, 6.8, 5.2, F);
      if (p.back) { shroom(16, 11.4 + b, 2.4); p.px(15.5, 25 + b, F[3]); p.px(16.4, 25.6 + b, F[3]); return; }
      p.ell(16, 17.6 + b, 3, 2.2, Sn);
      p.px(14.9, 17.4 + b, Sn[3]); p.px(16.6, 17.4 + b, Sn[3]);
      p.tri(12.2, 13.2, 19.6 + b, 12.4, 17.8 + b, T[1]); p.tri(18.8, 19.8, 19.6 + b, 19.6, 17.8 + b, T[1]);
      eyes2(p, 11.8, 18.2, 12.6 + b, true);
      p.blush(9.8, 16 + b, '#ff9ab0'); p.blush(20.2, 16 + b, '#ff9ab0');
    },

    cindershade: function (p, f) { /* Cindershade: a little dark candle with a violet flame on its head and wax drips for hands */
      var W = NP6.csW, V = NP6.csV, b = hop(p) * 0.5, fh = 3.4 + (p.stage >= 2 ? (p.stage - 1) * 0.8 : 0), sw = Math.sin(p.ph * 2) * 0.5;
      function vflame(x, y) { plume(p, x, y, -1.57, fh, 1.6, [V, [V[0], V[1], V[1]], [V[0], V[0], V[0]]], sw, 0.7); }
      if (p.side) {
        p.rect(13.4, 25.6, 2.4, 2.2, W[2]); p.rect(17.4, 25.6, 2.4, 2.2, W[2]);
        p.ell(16.4, 19.4 + b, 5, 7, W);
        p.ell(16.4, 12.8 + b, 4.4, 1.6, [W[0], W[1]]);
        p.rect(16, 9.4 + b, 0.8, 2.6, W[3]);
        vflame(16.4, 9.4 + b);
        p.ell(19.6, 17 + b, 1, 2.6, [W[0], W[1]]);
        eye1(p, 12.4, 16.4 + b, true);
        p.blush(14.4, 19.4 + b, '#ff9ab0');
        return;
      }
      p.rect(12.4, 25.6, 2.6, 2.2, W[2]); p.rect(17, 25.6, 2.6, 2.2, W[2]);
      p.ell(16, 19.4 + b, 6, 7, W);
      p.ell(16, 12.8 + b, 5.2, 1.8, [W[0], W[1]]);
      p.rect(15.6, 9.2 + b, 0.8, 2.8, W[3]);
      vflame(16, 9.2 + b);
      p.ell(9.6, 19.4 + b, 1.2, 2.4, W); p.ell(22.4, 19.4 + b, 1.2, 2.4, W);
      if (p.back) { p.ell(13.4, 15 + b, 0.9, 2.4, [W[0], W[1]]); return; }
      p.ell(18.6, 14.6 + b, 0.9, 2.2, [W[0], W[1]]);
      eyes2(p, 12.6, 17.4, 16.4 + b, true);
      smile(p, 14, 20.2 + b, W[3]);
      p.blush(10.8, 19.6 + b, '#ff9ab0'); p.blush(21.2, 19.6 + b, '#ff9ab0');
    },

    sunkit: function (p, f) { /* Solcub: a golden lion cub with a ring of sunny petals for a mane */
      var F = NP6.scF, M = NP6.scM, C = NP6.scC, b = hop(p), sw = Math.sin(p.ph) * 1, n = 9 + (p.stage >= 2 ? 3 : 0), i;
      function mane(cx, cy, r) { for (i = 0; i < n; i++) { var a = i / n * 6.2832; p.ell(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9, 2, 2, M); } }
      if (p.side) {
        plume(p, 22.5, 21.5 + b, -1, 6, 1, [F, F], 1.6 + sw, 0.1); p.ell(26 + sw * 0.6, 15.6 + b, 1.4, 1.4, M);
        legsSide(p, [[20.4, 1, 1], [13.6, 0, 1]], 23 + b, 28, 2, F[2], F[3]);
        p.ell(17.6, 21.4 + b, 6, 4.2, F);
        legsSide(p, [[21.4, 0, 0], [12.6, 1, 0]], 23 + b, 28, 2.2, F[1], F[2]);
        mane(11.6, 14.4 + b, 5.2);
        p.ell(10.4, 14.4 + b, 4.8, 4.4, F);
        p.ell(6.8, 16.2 + b, 2.2, 1.6, C);
        p.rect(4.6, 15.4 + b, 1.2, 0.9, '#a05a3a');
        eye1(p, 8, 12.8 + b, true);
        p.blush(10, 16.6 + b, '#ff9ab0');
        return;
      }
      if (!p.back) { plume(p, 21, 24 + b, -1, 6, 1, [F, F], 1.6 + sw, 0.1); p.ell(25 + sw * 0.6, 17.6 + b, 1.4, 1.4, M); }
      p.ell(16, 22 + b, 5.6, 5, F);
      feet2(p, 12.4, 17.6, 26, 2.4, 2, C[1]);
      mane(16, 13.8 + b, 6.6);
      p.ell(11, 9 + b, 1.6, 1.6, F); p.ell(21, 9 + b, 1.6, 1.6, F);
      p.ell(16, 13.8 + b, 6, 4.8, F);
      if (p.back) { plume(p, 16, 25 + b, -1.3, 6, 1, [F, F], 1.6 + sw, 0.1); p.ell(19.6 + sw * 0.6, 18.8 + b, 1.4, 1.4, M); return; }
      p.ell(16, 22.6 + b, 3, 3.2, C);
      p.ell(16, 16 + b, 2.6, 1.6, C);
      p.rect(15.4, 15.1 + b, 1.2, 0.9, '#a05a3a');
      eyes2(p, 12.4, 17.6, 12 + b, true);
      p.blush(10.6, 15 + b, '#ff9ab0'); p.blush(19.4, 15 + b, '#ff9ab0');
    },

    glimmerbee: function (p, f) { /* Glimmerbee: a round fuzzy bee with soft gold stripes and glassy wings */
      var B = NP6.gbB, S = NP6.gbS, W = NP6.gbW, fl = flyF(p), cy = 17 + Math.round(fl * 0.5 * 2) / 2, fp = (f % 2) * 1.2;
      function ant(x, m) { plume(p, x, cy - 5, -1.57 + m * 0.5, 3.2, 0.55, [[S, S]], m * 0.6, 0); p.ell(x + m * 1.8, cy - 8, 0.8, 0.8, [B[1], B[2]], true); }
      if (p.side) {
        p.ell(19, cy - 5 - fp, 3.6, 2.4, W);
        p.ell(18, cy + 1, 6, 5, B);
        p.rect(17.4, cy - 3.6, 1.2, 8.4, S); p.rect(20.6, cy - 3, 1.2, 7.4, S);
        ant(12.4, -1);
        p.ell(11.4, cy - 0.4, 4.2, 4, B);
        eye1(p, 9, cy - 1.8, true);
        p.blush(11.4, cy + 1.4, '#ff9ab0');
        p.ell(17, cy - 4.6 - fp, 3, 2, W);
        return;
      }
      p.ell(8.6, cy - 4 - fp, 3.6, 2.6, W); p.ell(23.4, cy - 4 - fp, 3.6, 2.6, W);
      ant(13.6, -1); ant(18.4, 1);
      p.ell(16, cy + 1, 6.8, 6.4, B);
      p.rect(9.8, cy + 2.4, 12.4, 1.1, S); p.rect(10.6, cy + 5, 10.8, 1, S);
      p.rect(14, cy + 7.2, 1.2, 1.2, S); p.rect(16.8, cy + 7.2, 1.2, 1.2, S);
      if (p.back) { p.rect(10.4, cy - 0.6, 11.2, 1.1, S); return; }
      eyes2(p, 12.6, 17.4, cy - 2.6, true);
      smile(p, 14, cy + 0.2, S);
      p.blush(10.6, cy, '#ff9ab0'); p.blush(21.4, cy, '#ff9ab0');
    },

    halofawn: function (p, f) { /* Halofawn: a dappled fawn with big soft ears and a faint ring of light above its head */
      var F = NP6.hfF, C = NP6.hfC, b = hop(p), hr = 3.6;
      function spots(x, y) { p.ell(x, y, 0.8, 0.7, [C[1], C[1]], true); p.ell(x + 2.4, y + 1.2, 0.7, 0.6, [C[1], C[1]], true); p.ell(x + 0.6, y + 2.4, 0.7, 0.6, [C[1], C[1]], true); }
      function halo(cx, cy) { ring(p, cx, cy, hr, 1, STR[1], 16, 0, 0, 0); ring(p, cx, cy, hr - 0.6, 0.7, STR[0], 12, 0.3, 0, 0); }
      if (p.side) {
        legsSide(p, [[20, 1, 1], [14, 0, 1]], 21.5 + b, 28, 1.3, F[2], F[3]);
        p.ell(17.6, 19.6 + b, 6, 4, F);
        spots(17, 17.6 + b);
        p.ell(23.2, 17.6 + b, 1.4, 1.2, C);
        legsSide(p, [[21, 0, 0], [13, 1, 0]], 21.5 + b, 28, 1.5, F[1], F[2]);
        p.ell(13.4, 10.4 + b, 3.6, 1.6, F);
        p.ell(10.4, 12.4 + b, 4.4, 4.2, F);
        p.ell(6.6, 14.6 + b, 2.4, 1.7, C);
        p.rect(4.2, 13.8 + b, 1.2, 1, '#4a3424');
        eye1(p, 8.4, 11 + b, true);
        p.blush(10.4, 15 + b, '#ff9ab0');
        halo(11, 5.4 + b);
        return;
      }
      feet2(p, 12.8, 17.6, 24, 1.6, 4, F[2], F[1]);
      p.ell(16, 20.4 + b, 5, 4.6, F);
      p.ell(8.6, 11.6 + b, 3.6, 1.7, F); p.ell(23.4, 11.6 + b, 3.6, 1.7, F);
      if (!p.back) { p.ell(8.4, 11.6 + b, 2.2, 0.8, [INR, INR], true); p.ell(23.6, 11.6 + b, 2.2, 0.8, [INR, INR], true); }
      p.ell(16, 13 + b, 5.4, 4.8, F);
      halo(16, 5.6 + b);
      if (p.back) { spots(13.4, 18.4 + b); p.ell(16, 23.6 + b, 1.4, 1.2, C); return; }
      p.ell(16, 21.4 + b, 2.6, 2.6, C);
      p.ell(16, 15.6 + b, 2.6, 1.8, C);
      p.rect(15.4, 14.8 + b, 1.2, 1, '#4a3424');
      eyes2(p, 12.6, 17.4, 11.4 + b, true);
      p.blush(11, 14.4 + b, '#ff9ab0'); p.blush(19, 14.4 + b, '#ff9ab0');
    },

    prismbird: function (p, f) { /* Rainquill: a white swallow whose forked tail ends in ribbons of colour */
      var W = NP6.pbW, fl = flyF(p), cy = 16 + Math.round(fl * 0.5 * 2) / 2, fp = Math.sin(p.ph * (p.mode === 'move' ? 4 : 2)), sw = Math.sin(p.ph) * 0.8, tl = 4 + (p.stage >= 2 ? 3 : 0);
      function ribbons(x, y, a, m) { for (var i = 0; i < 3; i++) plume(p, x + i * m * 0.6, y + i * 0.6, a + i * 0.18 * m, tl - i, 0.8, [[RAIN[i * 2], RAIN[i * 2]], [RAIN[i * 2 + 1], RAIN[i * 2 + 1]]], m * (0.6 + sw), 0.1); }
      if (p.side) {
        ribbons(21, cy + 3, 0.35, 1);
        p.ell(16.4, cy + 1, 6.4, 5, W);
        p.ell(14, cy + 3, 3.4, 2.6, ['#fff0f0', '#ffe0dc', '#f4c4bc']);
        p.ell(11.4, cy - 2, 4.2, 4, W);
        p.tri(6, 8, cy - 1.6, 5.4, cy - 1, '#5a5068');
        eye1(p, 9, cy - 3.4, true);
        p.blush(11.2, cy - 0.4, '#ff9ab0');
        p.ell(18.6, cy - fp, 5, 2.8, [W[1], W[2], W[3]]);
        p.rect(14.6, cy + 5.6, 0.8, 2, '#8a8094'); p.rect(16.6, cy + 5.6, 0.8, 2, '#8a8094');
        return;
      }
      [-1, 1].forEach(function (m) { plume(p, 16 + m * 5.4, cy, m > 0 ? -0.3 - fp * 0.3 : Math.PI + 0.3 + fp * 0.3, 5, 2.2, [W, W, [W[1], W[2], W[3]]], m * -0.6, 0.6); });
      if (p.back) { ribbons(15, cy + 5, 1.9, 1); ribbons(17, cy + 5, 1.25, -1); }
      p.ell(16, cy + 1.4, 5.4, 5.4, W);
      p.ell(16, cy - 3.4, 4.6, 4, W);
      p.rect(14.4, cy + 6.4, 0.8, 1.8, '#8a8094'); p.rect(16.8, cy + 6.4, 0.8, 1.8, '#8a8094');
      if (p.back) return;
      p.ell(16, cy + 2.6, 3.2, 2.8, ['#fff0f0', '#ffe0dc', '#f4c4bc']);
      eyes2(p, 13, 17.4, cy - 4.4, true);
      p.tri(15.2, 16.8, cy - 1.8, 16, cy - 0.4, '#5a5068');
      p.blush(11.8, cy - 1.8, '#ff9ab0'); p.blush(20.2, cy - 1.8, '#ff9ab0');
    },

    dawnpup: function (p, f) { /* Dawnpup: a fluffy cream pup whose ears and tail tip are the colour of sunrise */
      var F = NP6.dpF, T = NP6.dpT, b = hop(p), wg = Math.sin(p.ph * 3) * 1.2, tr = p.stage >= 3 ? 2.8 : 2;
      function tail(x, y, a) { plume(p, x, y, a, 5, tr, [F, F, [T[0], T[1], T[1]]], wg, 0.3); }
      if (p.side) {
        tail(23, 20.5 + b, -0.9);
        legsSide(p, [[20.4, 1, 1], [13.6, 0, 1]], 23 + b, 28, 2, F[2], F[3]);
        p.ell(17.6, 21.4 + b, 6.2, 4.6, F);
        legsSide(p, [[21.4, 0, 0], [12.6, 1, 0]], 23 + b, 28, 2.2, F[1], F[2]);
        p.ell(13, 13.6 + b, 2, 3.4, [T[1], T[2], T[3]]);
        p.ell(10.4, 14.4 + b, 5.2, 4.8, F);
        p.ell(6.6, 16.4 + b, 2.4, 1.7, F);
        p.rect(4, 15.6 + b, 1.4, 1.1, '#6a3a3a');
        eye1(p, 8, 12.8 + b, true);
        p.blush(10.2, 16.6 + b, '#ff9ab0');
        return;
      }
      if (!p.back) tail(21, 23.5 + b, -0.9);
      p.ell(16, 21.8 + b, 6.2, 5.2, F);
      feet2(p, 11.8, 17.8, 25.6, 2.6, 2.4, F[2], F[1]);
      p.ell(9.4, 12.6 + b, 2.2, 3.6, [T[1], T[2], T[3]]); p.ell(22.6, 12.6 + b, 2.2, 3.6, [T[1], T[2], T[3]]);
      p.ell(16, 13.8 + b, 6.6, 5.4, F);
      if (p.back) { tail(16, 25 + b, -1.4); return; }
      p.ell(16, 16.4 + b, 3, 2, [F[0], F[0], F[1]]);
      p.rect(15.3, 15.3 + b, 1.4, 1.1, '#6a3a3a');
      eyes2(p, 12.4, 17.6, 12 + b, true);
      p.blush(10.4, 15 + b, '#ff9ab0'); p.blush(19.6, 15 + b, '#ff9ab0');
    },

    glasssnail: function (p, f) { /* Glasswhorl: a cream snail that carries a clear glass shell with a seed of light inside */
      var B = NP6.gsB, G = NP6.gsG, wv = Math.sin(p.ph * 2) * 0.5, cr = p.mode === 'move' ? Math.sin(p.gp) * 0.6 : 0, gl = (f >> 2) % 2;
      function stalk(x, y, m) { p.rect(x, y, 0.9, 3.4, B[3]); p.ell(x + 0.45 + m * 0.4, y - 0.4 + wv * m, 1.1, 1.1, [B[2], B[3]], true); }
      function shell(cx, cy, r) {
        p.ell(cx, cy, r, r * 0.94, G);
        p.ell(cx + r * 0.12, cy - r * 0.08, r * 0.62, r * 0.56, [G[2], G[2]], true);
        p.ell(cx + r * 0.14, cy - r * 0.1, r * 0.5, r * 0.44, [G[0], G[1], G[1]]);
        p.ell(cx + r * 0.1, cy + r * 0.05, r * 0.3, r * 0.3, [STR[0], STR[1 + gl]], true);
        p.px(cx - r * 0.6, cy - r * 0.5, '#ffffff'); p.px(cx - r * 0.45, cy - r * 0.65, '#ffffff');
      }
      if (p.side) {
        p.ell(16 + cr, 25.6, 10.6, 2.4, B);
        shell(19 + cr * 0.5, 17.2, 6.8);
        stalk(5.6 + cr, 15.4, -1);
        p.ell(7.6 + cr, 21.6, 3.6, 3.8, B);
        eye1(p, 5.6 + cr, 20.2, true);
        p.blush(7.8 + cr, 23, '#ff9ab0');
        return;
      }
      p.ell(16, 25.8, 8.4, 2.4, B);
      if (p.back) { shell(16, 16.4, 7.6); return; }
      shell(17.4, 15, 7.2);
      stalk(11.6, 15.2, -1); stalk(19.6, 15.2, 1);
      p.ell(16, 21.6, 5, 4.2, B);
      eyes2(p, 12.8, 17.2, 19.8, true);
      smile(p, 14, 22.8, B[3]);
      p.blush(11, 22.4, '#ff9ab0'); p.blush(19, 22.4, '#ff9ab0');
    },

    brightcarp: function (p, f) { /* Glintkoi: a white koi with gold patches and soft flowing fins; it swims through the air */
      var B = NP6.kiB, G = NP6.kiG, Fn = NP6.kiF, fl = flyF(p), cy = 17 + Math.round(fl * 0.5 * 2) / 2, sw = Math.sin(p.ph * 2) * 0.8, fn = 3 + (p.stage >= 2 ? 2 : 0);
      if (p.side) {
        plume(p, 22.4, cy, -0.4 + sw * 0.1, fn + 2, 2.6, [Fn, Fn, [G[0], G[1], G[1]]], sw, 0.3); plume(p, 22.4, cy + 1, 0.5 - sw * 0.1, fn + 2, 2.6, [Fn, Fn, [G[0], G[1], G[1]]], -sw, 0.3);
        p.tri(14, 19, cy - 3.6, 17.6, cy - 6.4, Fn[2], Fn[1]);
        p.ell(15, cy, 8.2, 4.4, B);
        p.ell(18, cy - 2.4, 2.6, 1.8, G); p.ell(13.4, cy + 1.6, 1.6, 1.2, G);
        p.ell(15.6, cy + 4.4, 2.4, 1.4, Fn);
        eye1(p, 9.4, cy - 2, true);
        p.rect(7.2, cy + 1, 1.4, 0.6, B[3]);
        p.blush(11, cy + 1, '#ff9ab0');
        return;
      }
      plume(p, 10, cy + 2, 2.5 + sw * 0.1, 3 + fn * 0.4, 2, [Fn, Fn], 0, 0.3); plume(p, 22, cy + 2, 0.64 - sw * 0.1, 3 + fn * 0.4, 2, [Fn, Fn], 0, 0.3);
      if (p.back) { plume(p, 16, cy + 5, 1.57, fn, 2.2, [Fn, Fn], sw, 0.2); p.ell(16, cy, 7, 6.6, B); p.ell(13.6, cy - 2, 2.6, 2, G); p.ell(18.4, cy + 2, 2, 1.6, G); return; }
      plume(p, 16, cy + 5, 1.57, fn + 1, 2.6, [Fn, Fn, [G[0], G[1], G[1]]], sw, 0.3);
      p.tri(14.6, 17.4, cy - 5.4, 16, cy - 8.4, Fn[2], Fn[1]);
      p.ell(16, cy, 6.6, 6.2, B);
      p.ell(19.6, cy - 4, 2.6, 1.8, G); p.ell(11.6, cy + 3.4, 1.4, 1.2, G);
      eyes2(p, 12, 18, cy - 2.4, true);
      p.ell(16, cy + 2.2, 1.6, 1.1, [B[2], B[3]], true);
      p.blush(10, cy + 1.2, '#ff9ab0'); p.blush(22, cy + 1.2, '#ff9ab0');
    },

    starcat: function (p, f) { /* Starwhisk: a fluffy white kitten whose tail ends in a little golden star */
      var F = NP6.swF, C = NP6.swC, b = hop(p), sw = Math.sin(p.ph) * 1.2;
      if (p.side) {
        plume(p, 22.5, 22 + b, -1.2, 6, 1.4, [F, F], 1.8 + sw, 0.2); star5(p, 25.6 + sw * 0.5, 14.4 + b, 2, STR);
        legsSide(p, [[20, 1, 1], [14, 0, 1]], 23 + b, 28, 1.8, F[2], F[3]);
        p.ell(17.5, 21.6 + b, 6, 4.4, F);
        legsSide(p, [[21, 0, 0], [13, 1, 0]], 23 + b, 28, 2, F[1], F[2]);
        p.tri(11, 14.5, 10.5 + b, 13, 4.6 + b, F[2], INR);
        p.ell(10.5, 14.4 + b, 5.4, 4.8, F);
        p.ell(6.8, 16.2 + b, 2.2, 1.5, C);
        p.px(4.8, 15.4 + b, '#f08890');
        eye1(p, 8, 12.8 + b, true);
        p.blush(10, 16.6 + b, '#ff9ab0');
        return;
      }
      if (!p.back) { plume(p, 21, 24 + b, -1.05, 6.5, 1.4, [F, F], 1.6 + sw, 0.2); star5(p, 25 + sw * 0.5, 16.6 + b, 2, STR); }
      p.ell(16, 22 + b, 5.8, 5, F);
      feet2(p, 12.5, 17.5, 26, 2.5, 2, C[1]);
      p.tri(9, 13.5, 10.5 + b, 9.6, 4 + b, F[2], p.back ? F[2] : INR); p.tri(18.5, 23, 10.5 + b, 22.4, 4 + b, F[2], p.back ? F[2] : INR);
      p.ell(16, 13.6 + b, 7, 5.4, F);
      if (p.back) { plume(p, 16, 25 + b, -1.3, 6.5, 1.4, [F, F], 1.6 + sw, 0.2); star5(p, 19.6 + sw * 0.5, 17.6 + b, 2, STR); return; }
      p.ell(16, 22.6 + b, 3, 3.2, C);
      eyes2(p, 12.4, 17.6, 12 + b, true);
      p.ell(16, 15.8 + b, 2.4, 1.4, C); p.rect(15.5, 15.1 + b, 1, 0.7, '#f08890');
      p.blush(10.2, 14.6 + b, '#ff9ab0'); p.blush(19.8, 14.6 + b, '#ff9ab0');
    }
  };
  var STG6 = {
    duskling: gstg(function (p, f, s, L, d, b) {
      var F = NP6.dlF, C = NP6.dlC, sw = Math.sin(p.ph) * 0.6, i;
      if (L === 'back') {
        /* its ears grow long from stage 4 in the body painter */
        return;
      }
      /* pale stars on its ears from stage 2; a crescent collar of light from stage 3 */
      if (s >= 2 && d !== 2) [-1, 1].forEach(function (m) { p.px(16 + m * 3.6 - 0.5, 4 + b - (s >= 4 ? 2 : 0), STR[0]); p.px(16 + m * 3.6, 7.4 + b, STR[1]); });
      if (s >= 2 && d === 2) { p.px(12, 6 + b, STR[0]); p.px(13.6, 3.6 + b, STR[1]); }
      if (s >= 3) {
        if (d === 2) for (i = 0; i < 3; i++) p.ell(12.6 + i * 1.6, 18.4 + b + i * 0.3, 1.2, 0.9, MOON);
        else if (d === 0) for (i = -2; i <= 2; i++) p.ell(16 + i * 2, 18.6 + b + Math.abs(i) * -0.35, 1.2, 0.9, MOON);
      }
    }),
    mothlight: gstg(function (p, f, s, L, d, b) {
      var W = NP6.mlW, fl = flyF(p), cy = 16 + Math.round(fl * 0.5 * 2) / 2, fp = Math.sin(p.ph * (p.mode === 'move' ? 4 : 2)) * 0.8, i;
      if (L === 'back') {
        /* long trailing tails from stage 2; wide lamp-shade wings from stage 4 */
        if (s >= 2) {
          var tp = [W, W, [STR[0], STR[1], STR[1]]];
          if (d === 2) plume(p, 21, cy + 5, 0.5, 2 + s, 1.8, tp, 1.2, 0.5);
          else [-1, 1].forEach(function (m) { plume(p, 16 + m * 9.4, cy + 5, 1.57 - m * 1.25, 2 + s, 1.8, tp, m * 1.2, 0.5); });
        }
        if (s >= 4) {
          var ed = [W, W, [W[1], W[2], W[3]]];
          if (d === 2) plume(p, 19, cy - 4 - fp, -0.9, 6 + s, 3.6, ed, -1, 0.55);
          else [-1, 1].forEach(function (m) { plume(p, 16 + m * 9, cy - 4 - fp, m > 0 ? -0.5 : Math.PI + 0.5, 4 + s, 3.6, ed, m * -1, 0.55); });
        }
        return;
      }
      /* glowing rings open on its wings from stage 3 */
      if (s >= 3) {
        var rg = function (x, y) { p.ell(x, y, 1.8, 1.8, [STR[1], STR[2]], true); p.ell(x, y, 0.9, 0.9, [W[2], W[2]], true); };
        if (d === 2) rg(20.6, cy - 2.6 - fp); else if (d === 0) { rg(8, cy - 2.2 - fp); rg(24, cy - 2.2 - fp); }
      }
    }),
    shadepup: gstg(function (p, f, s, L, d, b) {
      var F = NP6.spF, C = NP6.spC, i;
      if (L === 'back') {
        /* a thick smoky ruff from stage 3 */
        if (s >= 3) {
          if (d === 2) for (i = 0; i < 3; i++) p.ell(13 + i * 1.6, 18 + b + i * 0.5, 2, 1.7, F);
          else for (i = -2; i <= 2; i++) p.ell(16 + i * 2.6, 18.2 + b + Math.abs(i) * -0.3, 2.1, 1.8, F);
        }
        return;
      }
      /* a moon on its brow from stage 2; stars in its fur from stage 4 */
      if (s >= 2 && d !== 1) { var x = d === 2 ? 10.2 : 15.6, y = (d === 2 ? 10.8 : 10.2) + b; crescent(p, x, y, 1.2, MOON, F[1]); }
      if (s >= 4) {
        var pts = d === 2 ? [[18, 19], [21.5, 21], [16, 22.5]] : d === 1 ? [[13, 19], [18.6, 21], [15.6, 14]] : [[11.4, 20.6], [20.6, 21.4], [19.6, 9.4]];
        pts.forEach(function (q) { p.px(q[0], q[1] + b, STR[0]); p.px(q[0] - 0.6, q[1] + b, STR[1]); p.px(q[0] + 0.6, q[1] + b, STR[1]); });
      }
    }),
    gloomowl: gstg(function (p, f, s, L, d, b) {
      var F = NP6.goF, fl = flyF(p), cy = 17 + Math.round(fl * 0.5 * 2) / 2, fp = Math.sin(p.ph * (p.mode === 'move' ? 4 : 2)), i;
      if (L === 'back') {
        /* wide soft wings from stage 4 (its ear tufts grow in the body painter) */
        if (s >= 4) {
          var ed = [F, F, [F[1], F[2], F[3]]];
          if (d === 2) plume(p, 19, cy - 1 - fp, -0.7, 5 + s, 3.4, ed, -1, 0.6);
          else [-1, 1].forEach(function (m) { plume(p, 16 + m * 7, cy - fp, m > 0 ? -0.35 : Math.PI + 0.35, 4 + s, 3.4, ed, m * -1, 0.6); });
        }
        return;
      }
      /* feathered stars on its wings from stage 3 */
      if (s >= 3) {
        if (d === 2) { p.px(18.4, cy - 0.4 - fp, STR[0]); p.px(19.8, cy + 2 - fp, STR[1]); }
        else if (d === 0) [-1, 1].forEach(function (m) { p.px(16 + m * 7.8, cy - fp, STR[0]); p.px(16 + m * 8.4, cy + 2.6 - fp, STR[1]); });
      }
    }),
    nightfin: gstg(function (p, f, s, L, d, b) {
      var B = NP6.nfB, Wv = EP.water[0], fl = flyF(p), cy = 17 + Math.round(fl * 0.5 * 2) / 2, fp = Math.sin(p.ph * (p.mode === 'move' ? 4 : 2)) * 1.4;
      if (L === 'back') {
        /* a long thin tail from stage 2; wide gliding wings from stage 4 */
        if (s >= 2 && d === 0) plume(p, 16, cy + 4, 1.57, 3 + s, 0.7, [[B[2], B[3]]], Math.sin(p.ph) * 2.4, 0);
        if (s >= 4) {
          if (d === 2) plume(p, 15, cy - 2 - fp * 0.6, -0.2, 4 + s, 2.6, [B, B, [Wv[0], Wv[1], Wv[2]]], -1.4, 0.6);
          else [-1, 1].forEach(function (m) { plume(p, 16 + m * 9, cy - fp * 0.6, m > 0 ? -0.25 : Math.PI + 0.25, 2 + s, 2.6, [B, B, [Wv[0], Wv[1], Wv[2]]], m * -0.8, 0.6); });
        }
        return;
      }
      /* its wing tips glow like waves at night from stage 3 */
      if (s >= 3 && d !== 2) { p.ell(3.6, cy - 0.6 - fp, 1.2, 1, Wv, true); p.ell(28.4, cy - 0.6 - fp, 1.2, 1, Wv, true); }
      if (s >= 3 && d === 2) p.ell(19.6, cy - 3.6 - fp * 0.6, 1.2, 1, Wv, true);
    }),
    veilcat: gstg(function (p, f, s, L, d, b) {
      var F = NP6.vcF, V = NP6.vcV, sw = Math.sin(p.ph) * 1.2;
      if (L === 'back') {
        /* its tail splits into two soft ribbons from stage 4 (the veil grows in the body painter) */
        if (s >= 4) {
          if (d === 2) plume(p, 23, 21 + b, -0.8, 7, 1.2, [F, F, V], 2 - sw, 0.2);
          else if (d === 0) plume(p, 11, 24 + b, -2, 7, 1.2, [F, F, V], -2 + sw, 0.2);
        }
        return;
      }
      /* a small moon on its brow from stage 3 */
      if (s >= 3 && d !== 1) { var x = d === 2 ? 9.6 : 15.4, y = (d === 2 ? 11 : 9.8) + b; crescent(p, x, y, 1.2, MOON, d === 2 ? F[1] : V[1]); }
    }),
    shadeboar: gstg(function (p, f, s, L, d, b) {
      var F = NP6.sbF, M = NP6.sbM, T = ['#fffaf0', '#f0e4c8', '#d0c0a0'], i;
      b *= 0.6;
      function shroom(x, y, r) { p.rect(x - 0.5, y, 1, r * 1.1, T[1]); p.ell(x, y, r, r * 0.7, M); }
      if (L === 'back') {
        /* more mushrooms from stage 2; a bristly mane of shadow from stage 4 */
        if (s >= 4) {
          if (d === 2) for (i = 0; i < 4; i++) p.tri(12.6 + i * 2.6, 15 + i * 2.6, 16 + b, 13.4 + i * 2.6, 12.6 + b - (s - 4), F[2], F[1]);
          else for (i = -1; i <= 1; i++) p.tri(14.8 + i * 3.4, 17.2 + i * 3.4, 15.4 + b, 16 + i * 3.4, 11.4 + b - (s - 4), F[2], F[1]);
        }
        if (s >= 2) {
          if (d === 2) { shroom(15.4, 15 + b, 1.5); shroom(22.4, 15.6 + b, 1.4); }
          else { shroom(11.4, 11 + b, 1.5); if (d === 1) shroom(20.4, 11.4 + b, 1.4); }
        }
        return;
      }
      /* its tusks grow and curl from stage 3 */
      if (s >= 3 && d !== 1) {
        var tl = 1.4 + (s - 3) * 0.6;
        if (d === 2) plume(p, 6.4, 21.4 + b, -1.9, tl + 1, 0.6, [T], 0.8, 0);
        else { plume(p, 12.6, 19.6 + b, -1.9, tl + 1, 0.6, [T], 0.8, 0); plume(p, 19.4, 19.6 + b, -1.24, tl + 1, 0.6, [T], -0.8, 0); }
      }
    }),
    cindershade: gstg(function (p, f, s, L, d, b) {
      var W = NP6.csW, V = NP6.csV, sw = Math.sin(p.ph * 2) * 0.5, i;
      b *= 0.5;
      if (L === 'back') {
        /* wax drips form a little cape from stage 3 */
        if (s >= 3) {
          if (d === 2) for (i = 0; i < 3; i++) p.ell(19.6 + i * 1.2, 18 + b + i * 2, 1.4, 2.6, W);
          else for (i = -2; i <= 2; i++) p.ell(16 + i * 2.8, 21 + b + Math.abs(i) * -0.6, 1.6, 3.4, W);
        }
        return;
      }
      /* the flame grows in the body painter; two small flames float beside it from stage 4 */
      if (s >= 4 && d !== 1) {
        var fl2 = function (x, y) { plume(p, x, y, -1.57, 2 + (s - 4), 1, [V, [V[0], V[1], V[1]]], sw, 0.7); };
        var o = Math.sin(p.ph) * 0.8;
        if (d === 2) fl2(22, 12 + b + o); else { fl2(6.4, 13 + b + o); fl2(25.6, 13 + b - o); }
      }
    }),
    sunkit: gstg(function (p, f, s, L, d, b) {
      var M = NP6.scM, i;
      if (L === 'back') {
        /* golden rays rise through its mane from stage 4 (the mane itself grows fuller in the body painter) */
        if (s >= 4) {
          var cx = d === 2 ? 11.6 : 16, cy = (d === 2 ? 14.4 : 13.8) + b, n = 7;
          for (i = 0; i < n; i++) { var a = Math.PI + 0.2 + i / (n - 1) * (Math.PI - 0.4); p.tri(cx + Math.cos(a) * 7 - 1, cx + Math.cos(a) * 7 + 1, cy + Math.sin(a) * 6.4, cx + Math.cos(a) * (9 + s), cy + Math.sin(a) * (8.4 + s), STR[2], STR[1]); }
        }
        return;
      }
      /* a tuft of light tips its tail from stage 3 */
      if (s >= 3) {
        var tx = d === 2 ? 26 : d === 1 ? 19.6 : 25, ty = (d === 2 ? 15.6 : d === 1 ? 18.8 : 17.6) + b;
        p.ell(tx, ty, 2, 2, [STR[0], STR[1], STR[2]]);
      }
    }),
    glimmerbee: gstg(function (p, f, s, L, d, b) {
      var W = NP6.gbW, B = NP6.gbB, fl = flyF(p), cy = 17 + Math.round(fl * 0.5 * 2) / 2, fp = (f % 2) * 1.2, i;
      if (L === 'back') {
        /* a second pair of glass wings from stage 4 */
        if (s >= 4) {
          if (d === 2) p.ell(21.4, cy - 2 - fp, 3.4, 2.2, W);
          else { p.ell(7.4, cy - 0.6 - fp, 3.2, 2.2, W); p.ell(24.6, cy - 0.6 - fp, 3.2, 2.2, W); }
        }
        return;
      }
      /* drops of light on its antennae from stage 2; a soft fuzz collar from stage 3 */
      if (s >= 2) {
        if (d === 2) p.ell(10.6, cy - 8, 1, 1, [STR[0], STR[1]], true);
        else { p.ell(11.8, cy - 8, 1, 1, [STR[0], STR[1]], true); p.ell(20.2, cy - 8, 1, 1, [STR[0], STR[1]], true); }
      }
      if (s >= 3) {
        if (d === 2) for (i = 0; i < 3; i++) p.ell(14.4 + i * 0.4, cy - 2.4 + i * 2, 1.4, 1.2, ['#ffffff', '#fffaf0', '#f0e8d8']);
        else if (d === 0) for (i = -2; i <= 2; i++) p.ell(16 + i * 2.2, cy + 0.6 + Math.abs(i) * -0.4, 1.4, 1.2, ['#ffffff', '#fffaf0', '#f0e8d8']);
      }
    }),
    halofawn: gstg(function (p, f, s, L, d, b) {
      var A = NP6.hfA, i;
      if (L === 'back') return;
      /* small antlers from stage 2, branching from stage 4; the halo widens from stage 3 */
      var ax = d === 2 ? [[11.6, 9 + b, -1]] : [[13.2, 8.6 + b, -1], [18.8, 8.6 + b, 1]];
      if (s >= 2) ax.forEach(function (q) {
        var h = 2 + Math.min(s, 4) * 0.6; plume(p, q[0], q[1], -1.57 + q[2] * 0.3, h, 0.7, [A], q[2] * 0.4, 0);
        if (s >= 4) { plume(p, q[0] + q[2] * 0.6, q[1] - h * 0.5, -1.57 + q[2] * 1.1, 1.6 + (s - 4), 0.6, [A], 0, 0); plume(p, q[0] - q[2] * 0.2, q[1] - h * 0.3, -1.57 - q[2] * 0.9, 1.2 + (s - 4), 0.6, [A], 0, 0); }
      });
      if (s >= 3) { var cx = d === 2 ? 11 : 16, cy = (d === 2 ? 5.4 : 5.6) + b - (s - 3) * 0.6; ring(p, cx, cy, 4.4 + (s - 3) * 0.8, 1.2, STR[2], 20, f / NF * 0.8, 0, 0); }
    }),
    prismbird: gstg(function (p, f, s, L, d, b) {
      var W = NP6.pbW, fl = flyF(p), cy = 16 + Math.round(fl * 0.5 * 2) / 2, fp = Math.sin(p.ph * (p.mode === 'move' ? 4 : 2)), i;
      if (L === 'back') {
        /* its wings open wide as a rainbow from stage 4 (the tail ribbons grow in the body painter) */
        if (s >= 4) {
          var ed = [W, W, [RAIN[4], RAIN[5], RAIN[5]]];
          if (d === 2) plume(p, 18, cy - 1 - fp, -0.9, 5 + s, 3, ed, -1, 0.6);
          else [-1, 1].forEach(function (m) { plume(p, 16 + m * 7, cy - 1 - fp, m > 0 ? -0.5 : Math.PI + 0.5, 4 + s, 3, ed, m * -1, 0.6); });
        }
        return;
      }
      /* colours split along its wing edges from stage 3 */
      if (s >= 3) {
        if (d === 2) for (i = 0; i < 3; i++) p.rect(16 + i * 1.4, cy + 2.2 - fp, 1.4, 0.7, RAIN[i * 2]);
        else [-1, 1].forEach(function (m) { for (i = 0; i < 3; i++) p.rect(16 + m * (8 + i * 1.3) - 0.7, cy + 1.2 + i * 0.4 + m * fp * 0.3, 1.4, 0.7, RAIN[i * 2 + 1]); });
      }
    }),
    dawnpup: gstg(function (p, f, s, L, d, b) {
      var F = NP6.dpF, T = NP6.dpT, i;
      if (L === 'back') {
        /* a ruff of warm light from stage 4 */
        if (s >= 4) {
          if (d === 2) for (i = 0; i < 3; i++) p.ell(13 + i * 1.6, 18.2 + b + i * 0.5, 1.9, 1.6, [T[0], T[1], T[1]]);
          else for (i = -2; i <= 2; i++) p.ell(16 + i * 2.5, 18.4 + b + Math.abs(i) * -0.3, 2, 1.7, [T[0], T[1], T[1]]);
        }
        return;
      }
      /* a sun freckle on its brow from stage 2 (the tail grows fluffy in the body painter from stage 3) */
      if (s >= 2 && d !== 1) { var x = d === 2 ? 10 : 16, y = (d === 2 ? 10.6 : 9.8) + b; p.ell(x, y, 1, 1, [T[0], T[1]], true); }
    }),
    glasssnail: gstg(function (p, f, s, L, d, b) {
      var G = NP6.gsG, cr = p.mode === 'move' ? Math.sin(p.gp) * 0.6 : 0, cx = d === 2 ? 19 + cr * 0.5 : d === 1 ? 16 : 17.4, cy = d === 2 ? 17.2 : d === 1 ? 16.4 : 15, r = d === 2 ? 6.8 : d === 1 ? 7.6 : 7.2, i;
      if (L === 'back') {
        /* a little glass spire rises on its shell from stage 3 */
        if (s >= 3) shard(p, cx + 0.6, cy - r + 1.6, 1.6, 3 + s * 1.1, 0.3, G);
        return;
      }
      /* the seed of light glows brighter from stage 2; small coloured panes shine on the shell from stage 4 */
      if (s >= 2) p.ell(cx + r * 0.1, cy + r * 0.05, r * 0.3 + 0.4, r * 0.3 + 0.4, [STR[0], STR[0], STR[1]], true);
      if (s >= 4) for (i = 0; i < 3; i++) { var a = -2.4 + i * 1.1; p.rect(cx + Math.cos(a) * r * 0.78 - 0.6, cy + Math.sin(a) * r * 0.74 - 0.6, 1.3, 1.3, RAIN[(i * 2 + 1) % 6]); }
    }),
    brightcarp: gstg(function (p, f, s, L, d, b) {
      var G = NP6.kiG, Fn = NP6.kiF, fl = flyF(p), cy = 17 + Math.round(fl * 0.5 * 2) / 2, sw = Math.sin(p.ph * 2) * 0.8;
      if (L === 'back') {
        /* a crest fin along its back from stage 4 (the long fins grow in the body painter) */
        if (s >= 4) {
          if (d === 2) plume(p, 12, cy - 4.4, -0.3, 6 + (s - 4) * 2, 1.6, [Fn, Fn, [G[0], G[1], G[1]]], 1.2, 0.4);
          else plume(p, 16, cy - 6, -1.57, 2 + s * 0.5, 1.8, [Fn, Fn, [G[0], G[1], G[1]]], sw * 0.4, 0.4);
        }
        return;
      }
      /* golden whiskers trail from its mouth from stage 3 */
      if (s >= 3) {
        if (d === 2) plume(p, 7.6, cy + 1.4, 2.1, 2 + s, 0.5, [[G[1], G[2]]], -1 + sw, 0);
        else if (d === 0) { plume(p, 14.4, cy + 2.4, 2.4, 2 + s, 0.5, [[G[1], G[2]]], -0.8 + sw, 0); plume(p, 17.6, cy + 2.4, 0.74, 2 + s, 0.5, [[G[1], G[2]]], 0.8 - sw, 0); }
      }
    }),
    starcat: gstg(function (p, f, s, L, d, b) {
      var Y = NP4.wlY, i;
      if (L === 'back') {
        /* its tail star shines like a falling star from stage 4 */
        if (s >= 4) {
          var tx = d === 2 ? 25.6 : d === 1 ? 19.6 : 25, ty = (d === 2 ? 14.4 : d === 1 ? 17.6 : 16.6) + b;
          for (i = 1; i <= 3; i++) p.ell(tx + i * 1.4, ty + i * 1.6, 1.4 - i * 0.3, 1.2 - i * 0.25, [STR[0], STR[1]], true);
          p.ell(tx, ty, 2.6 + (s - 4) * 0.4, 2.6 + (s - 4) * 0.4, [STR[0], STR[1], STR[1]], true);
        }
        return;
      }
      /* star marks on its cheeks from stage 2; spark whiskers from stage 3 */
      if (s >= 2) { if (d === 0) { star5(p, 10, 15.2 + b, 1.2, STR); star5(p, 22, 15.2 + b, 1.2, STR); } else if (d === 2) star5(p, 10.2, 16.2 + b, 1.2, STR); }
      if (s >= 3) {
        if (d === 0) { p.rect(6.6, 14.6 + b, 2, 0.5, Y[1]); p.rect(23.4, 14.6 + b, 2, 0.5, Y[1]); p.rect(7, 16.2 + b, 1.8, 0.5, Y[1]); p.rect(23.2, 16.2 + b, 1.8, 0.5, Y[1]); }
        else if (d === 2) { p.rect(2.6, 16.4 + b, 2.6, 0.5, Y[1]); p.rect(2.8, 17.4 + b, 2.4, 0.5, Y[1]); }
      }
    })
  };
  var EL6 = [
    ['duskling', 'dark', null, '#241c3a', 0, [['Duskling', 'A lilac moon hare with long ears and a pale crescent on its brow.'], ['Starlop', 'Pale stars speckle its long ears.'], ['Crescelle', 'A collar of moonlight rings its neck.'], ['Ribbonight', 'Its ears grow long, like ribbons of night.'], ['Moonwarren', 'A legendary hare that carries the moon home every morning.']]],
    ['mothlight', 'dark', null, '#141430', 1, [['Mothlight', 'A night-blue moth with soft glowing spots on its wings and a pale fluffy face.'], ['Trailwing', 'Long tails with glowing tips trail from its hind wings.'], ['Lanternwing', 'Glowing rings open on its wings.'], ['Moonlamp', 'Its wings grow wide as a lamp shade.'], ['Nightbeacon', 'A legendary moth that lights the way for anyone lost at night.']]],
    ['shadepup', 'dark', null, '#1a1838', 0, [['Shadepup', 'A round indigo wolf cub with a pale moon on its chest.'], ['Moonbrow', 'A small moon appears on its brow.'], ['Duskruff', 'Its ruff grows thick and soft as smoke.'], ['Starpelt', 'Stars glint in its fur.'], ['Umbralupe', 'A legendary wolf that walks the night with the moon at its side.']]],
    ['gloomowl', 'dark', null, '#22163a', 1, [['Gloomowl', 'A round purple owlet with huge moon-pale eye discs.'], ['Tufthoot', 'Its ear tufts grow long.'], ['Starquill', 'Feathered stars mark its wings.'], ['Hushwing', 'Its wings open wide and soft as dusk.'], ['Somnowl', 'A legendary owl that watches over every sleeper in the town.']]],
    ['nightfin', 'dark', 'water', '#141c3a', 1, [['Nightfin', 'A little night ray with a starry back and a pale belly. It glides over dark water.'], ['Tailray', 'A long thin tail trails behind it.'], ['Glowedge', 'Its wing tips glow like waves at night.'], ['Gloamray', 'Its wings widen and it glides high above the water.'], ['Nocturay', 'A legendary ray that swims through the night sky as through the sea.']]],
    ['veilcat', 'dark', 'light', '#2e2844', 0, [['Veilcat', 'A slender lilac cat with a sheer veil that falls from its head.'], ['Gauzetail', 'Its veil grows long and trails behind it.'], ['Moonveil', 'A small moon shines on its brow.'], ['Twinribbon', 'Its tail splits into two soft ribbons.'], ['Velumira', 'A legendary cat whose veil keeps the night and the day apart.']]],
    ['shadeboar', 'dark', 'earth', '#241a2a', 0, [['Snufflet', 'A round dusky piglet with a big soft snout and a glowing mushroom on its back.'], ['Truffhog', 'More mushrooms grow on its back.'], ['Curltusk', 'Its tusks grow and curl.'], ['Gloombristle', 'A bristly mane of shadow runs down its back.'], ['Nightgrove', 'A legendary boar that keeps a whole night forest on its back.']]],
    ['cindershade', 'dark', 'fire', '#18141e', 0, [['Cindershade', 'A little dark candle with a violet flame on its head and wax drips for hands.'], ['Tallwick', 'Its violet flame grows taller.'], ['Dripcloak', 'Wax drips form a little cape behind it.'], ['Gloamwick', 'Two small flames float beside it.'], ['Everwick', 'A legendary candle whose flame never goes out, even in the wind.']]],
    ['sunkit', 'light', null, '#4a3014', 0, [['Solcub', 'A golden lion cub with a ring of sunny petals for a mane.'], ['Petalmane', 'Its petal mane grows fuller.'], ['Sunwhisk', 'A tuft of light tips its tail.'], ['Raymane', 'Golden rays rise through its mane.'], ['Leosol', 'A legendary lion that wakes the sun each morning.']]],
    ['glimmerbee', 'light', null, '#4a3418', 1, [['Glimmerbee', 'A round fuzzy bee with soft gold stripes and glassy wings.'], ['Glowdrop', 'A drop of light hangs from each antenna.'], ['Velvetbuzz', 'A soft fuzz collar grows round its neck.'], ['Glasswing', 'A second pair of glass wings grows.'], ['Aurumbee', 'A legendary bee whose honey glows like morning.']]],
    ['halofawn', 'light', null, '#3e2a1a', 0, [['Halofawn', 'A dappled fawn with big soft ears and a faint ring of light above its head.'], ['Twigling', 'Small antlers bud on its head.'], ['Glowring', 'Its ring of light grows wide and bright.'], ['Goldantler', 'Its antlers branch like golden twigs.'], ['Dawnstag', 'A legendary deer that walks where the first light falls.']]],
    ['prismbird', 'light', 'wind', '#2a2c44', 1, [['Rainquill', 'A white swallow whose forked tail ends in ribbons of colour.'], ['Streamtail', 'Its tail ribbons grow long.'], ['Prismwing', 'Colours split along the edges of its wings.'], ['Bowsail', 'Its wings open wide as a rainbow.'], ['Iridawn', 'A legendary bird that paints the sky after rain.']]],
    ['dawnpup', 'light', 'fire', '#4a2a26', 0, [['Dawnpup', 'A fluffy cream pup whose ears and tail tip are the colour of sunrise.'], ['Freckleglow', 'A sun freckle shines on its brow.'], ['Cloudtail', 'Its tail grows big and fluffy as a morning cloud.'], ['Morningruff', 'A ruff of warm light rings its neck.'], ['Aurorhound', 'A legendary dog that runs ahead of the sunrise.']]],
    ['glasssnail', 'light', 'earth', '#2c3438', 0, [['Glasswhorl', 'A cream snail that carries a clear glass shell with a seed of light inside.'], ['Seedglow', 'The seed of light inside its shell glows brighter.'], ['Spireglass', 'A little glass spire rises on its shell.'], ['Paneshell', 'Small panes of coloured glass shine on its shell.'], ['Lanternhome', 'A legendary snail whose shell is a lantern for travellers.']]],
    ['brightcarp', 'light', 'water', '#3a2c20', 1, [['Glintkoi', 'A white koi with gold patches and soft fins. It swims through the air as through water.'], ['Silkfin', 'Its fins grow long and flowing.'], ['Goldwhisker', 'Golden whiskers trail from its mouth.'], ['Crestkoi', 'A crest fin rises along its back.'], ['Lumikoi', 'A legendary koi that leaps up waterfalls of light.']]],
    ['starcat', 'light', 'electric', '#2a2a40', 0, [['Starwhisk', 'A fluffy white kitten whose tail ends in a little golden star.'], ['Twinklecheek', 'Star marks appear on its cheeks.'], ['Sparkwhisk', 'Small sparks crackle along its whiskers.'], ['Comettail', 'The star on its tail shines like a falling star.'], ['Astralis', 'A legendary cat that rides the shooting stars.']]]
  ];
  var HAB6 = {
    duskling:    { f: { tallgrass: 1.6, flowers: 1, shade: 1.4, field: 0.8 }, day: 0.2, night: 2.4, wx: { clear: 1.4, fog: 1.2 }, rare: 0.85 },
    mothlight:   { f: { lamp: 2.4, shade: 1.4, tree: 1, flowers: 0.8 }, day: 0.1, night: 2.6, wx: { fog: 1.6, clear: 1 }, rare: 0.7 },
    shadepup:    { f: { shade: 2, tree: 1.2, path: 0.8, tallgrass: 1 }, day: 0.3, night: 2.2, wx: { fog: 1.4, clear: 1.1 }, rare: 0.6 },
    gloomowl:    { f: { tree: 2.2, shade: 1.4, mushroom: 1 }, day: 0.1, night: 2.6, wx: { fog: 1.6, clear: 1.1 }, rare: 0.65 },
    nightfin:    { f: { water: 3, bridge: 1, reeds: 0.6 }, day: 0.2, night: 2.4, wx: { clear: 1.3, fog: 1.2 }, rare: 0.45 },
    veilcat:     { f: { shade: 1.4, statue: 1.2, wall: 1, flowers: 0.8 }, day: 0.6, night: 1.6, wx: { fog: 2, clear: 1 }, rare: 0.35 },
    shadeboar:   { f: { mushroom: 2.6, tree: 1.4, shade: 1.2, garden: 0.8 }, day: 0.5, night: 1.6, wx: { rain: 1.6, fog: 1.2 }, rare: 0.55 },
    cindershade: { f: { lamp: 1.8, warm: 1.6, shade: 1.4, statue: 0.8 }, day: 0.1, night: 2.4, wx: { clear: 1.2, wind: 0.5, rain: 0.5 }, rare: 0.4 },
    sunkit:      { f: { flowers: 2, open: 1.4, garden: 1.2, statue: 0.6 }, day: 1.6, night: 0.2, wx: { clear: 1.8, rain: 0.5 }, rare: 0.7 },
    glimmerbee:  { f: { flowers: 3, garden: 1.6, fruit: 1 }, day: 1.5, night: 0.2, wx: { clear: 1.6, rain: 0.3, wind: 0.6 }, rare: 0.85 },
    halofawn:    { f: { tree: 1.4, tallgrass: 1.4, flowers: 1.2, garden: 0.8 }, day: 1.3, night: 0.5, wx: { clear: 1.4, fog: 1.2 }, rare: 0.5 },
    prismbird:   { f: { open: 1.6, statue: 1.2, water: 1, flowers: 0.8 }, day: 1.4, night: 0.3, wx: { rain: 1.8, clear: 1.2 }, rare: 0.4 },
    dawnpup:     { f: { path: 1.4, garden: 1.2, warm: 1.2, open: 1 }, day: 1.5, night: 0.4, wx: { clear: 1.6, rain: 0.6 }, rare: 0.6 },
    glasssnail:  { f: { garden: 1.6, wall: 1.2, statue: 1.2, water: 0.6 }, day: 0.8, night: 1.2, wx: { rain: 2, clear: 1 }, rare: 0.55 },
    brightcarp:  { f: { water: 3, bridge: 1.2, lilypad: 1, statue: 0.4 }, day: 1.3, night: 0.6, wx: { clear: 1.4, rain: 1.2 }, rare: 0.5 },
    starcat:     { f: { lamp: 1.6, statue: 1.2, wall: 1, open: 1 }, day: 0.6, night: 1.6, wx: { clear: 2, rain: 0.8 }, rare: 0.4 }
  };
  EL6.forEach(function (d) {
    var key = d[0], e = { key: key, name: d[5][0][0], element: d[1] };
    if (d[2]) { e.element2 = d[2]; EL2[key] = d[2]; }
    SEED[key] = hash(list.length * 3.7 + 1.3);
    list.push(e);
    DEF[key] = DEF6[key]; STG[key] = STG6[key]; OUT[key] = d[3]; if (d[4]) FLY[key] = 1;
    BASEK[key] = ELK[d[1]]; AURA[key] = AURA[ELK[d[1]]];
    STAGES[key] = d[5];
    stages[key] = d[5].map(function (a) { return { name: a[0], desc: a[1] }; });
    HAB3[key] = HAB6[key];
  });
  GLOW.mothlight = 0.3; GLOW.glimmerbee = 0.3; GLOW.glasssnail = 0.3; GLOW.cindershade = 0.26;
  // recolour a finished frame: every body pixel takes the dual's hue, keeps its shading
  function recolor(c, D) {
    var g = c.getContext('2d'), id = g.getImageData(0, 0, c.width, c.height), a = id.data;
    for (var i = 0; i < a.length; i += 4) {
      if (a[i + 3] < 8) continue;
      var r = a[i] / 255, gg = a[i + 1] / 255, b = a[i + 2] / 255, mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), L = (mx + mn) / 2, d = mx - mn;
      if (d < 0.04 && (L < 0.18 || L > 0.92)) continue;   // keep outlines, eye whites and highlights
      var S = d === 0 ? 0 : d / (1 - Math.abs(2 * L - 1));
      var nh = D.h / 360, ns = Math.min(1, S * 0.35 + D.s * 0.65), nl = Math.min(0.96, L * D.l);
      var q = nl < 0.5 ? nl * (1 + ns) : nl + ns - nl * ns, pp = 2 * nl - q;
      var f = function (t) { t = (t + 1) % 1; return t < 1 / 6 ? pp + (q - pp) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? pp + (q - pp) * (2 / 3 - t) * 6 : pp; };
      a[i] = f(nh + 1 / 3) * 255; a[i + 1] = f(nh) * 255; a[i + 2] = f(nh - 1 / 3) * 255;
    }
    g.putImageData(id, 0, 0);
  }
  // the second element shows as a small moving aura: frost, sparks, petals, embers, droplets, dust, wisps, motes
  var FX2 = {
    wind: ['#e8f8ff', 'flake'], water: ['#8fd0ff', 'drop'], fire: ['#ffb050', 'ember'], earth: ['#c8a070', 'dust'],
    electric: ['#fff070', 'spark'], grass: ['#8ee070', 'leaf'], dark: ['#a070ff', 'wisp'], light: ['#fff4c0', 'mote']
  };
  function aura2(ctx, key, t, sc) {
    var e2 = EL2[key], F = e2 && FX2[e2]; if (!F) return; ctx.fillStyle = F[0];
    for (var i = 0; i < 6; i++) {
      var ph = (t * 0.6 + i / 6) % 1, ang = i * 1.05 + t * 0.8, rx = (9 + (i % 3) * 2) * sc, x, y;
      if (F[1] === 'ember' || F[1] === 'mote' || F[1] === 'wisp') { x = Math.cos(ang) * rx * 0.8; y = 6 * sc - ph * 22 * sc; }
      else if (F[1] === 'drop' || F[1] === 'flake' || F[1] === 'leaf') { x = Math.cos(ang) * rx; y = -14 * sc + ph * 22 * sc; }
      else { x = Math.cos(ang * 2) * rx; y = Math.sin(ang * 2) * rx * 0.6; }
      ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.9;
      var s1 = Math.max(1, Math.round(sc));
      if (F[1] === 'flake') { ctx.fillRect(x - s1, y, s1 * 3, s1); ctx.fillRect(x, y - s1, s1, s1 * 3); }
      else if (F[1] === 'spark') { ctx.fillRect(x, y, s1 * 2, s1); ctx.fillRect(x + s1, y + s1, s1 * 2, s1); }
      else if (F[1] === 'leaf') { ctx.fillRect(x, y, s1 * 2, s1); ctx.fillRect(x + s1, y - s1, s1, s1); }
      else ctx.fillRect(x, y, s1 * (F[1] === 'wisp' ? 2 : 1), s1 * (F[1] === 'drop' ? 2 : 1));
    }
    ctx.globalAlpha = 1;
  }

  /* Build tool: produce every picture (each one is recorded where it is created). Everything by default:
     every kind, stage 1 to 5, the three authored directions, the three modes, both blink states and all
     16 frames at the raster scale of a plain draw (opts.scale 1), and the portraits.
     o narrows it: { kinds: [keys], stages: [1..5], dirs: [0, 1, 2], modes: ['idle', 'move', 'sit'],
       scales: [opts.scale values the game draws with, default [1]], blink: false (open eyes only),
       portraits: false }.
     Returns { pictures, pixels } (untrimmed) for what the call covered. */
  function enumerateAll(o) {
    o = o || {};
    var kinds = o.kinds || list.map(function (s) { return s.key; }), sts = o.stages || [1, 2, 3, 4, 5];
    var dirs = o.dirs || [0, 1, 2], modes = o.modes || ['idle', 'move', 'sit'], scales = o.scales || [1];
    var n = 0, px = 0;
    function one(c) { if (c) { n++; px += c.width * c.height; } }
    kinds.forEach(function (key) {
      if (!DEF[key]) return;
      sts.forEach(function (st) {
        st = Math.max(1, Math.min(5, st | 0 || 1));
        if (o.portraits !== false) one(portrait(key, st));
        var seen = {};
        scales.forEach(function (sc0) {
          var k = rasterK(sc0 * SS[st - 1]);
          if (seen[k]) return;
          seen[k] = 1;
          dirs.forEach(function (dir) { modes.forEach(function (mode) {
            for (var bl = 0; bl < (mode === 'move' || o.blink === false ? 1 : 2); bl++)
              for (var f = 0; f < NF; f++) one(frame(key, k, !!bl, f, dir, mode, st));
          }); });
        });
      });
    });
    return { pictures: n, pixels: px };
  }
  try {
    if (H.sheets && H.sheets.enumerate) H.sheets.enumerate('hontori', enumerateAll);
    /* once a sheet has arrived, the painted copies of its pictures are not kept */
    if (H.sheets && H.sheets.onLoad && H.sheets.has) H.sheets.onLoad(function (group) {
      if (group !== 'hontori') return;
      Object.keys(slots).forEach(function (key) { slots[key].forEach(function (b) { if (b) b.forEach(function (s) {
        if (s) for (var f = 0; f < NF; f++) if (s.arr[f] && H.sheets.has(s.keys[f])) s.arr[f] = null;
      }); }); });
    });
  } catch (e) { /* no sheets: everything stays painted */ }

  H.spirits = { list: list, draw: draw, portrait: portrait, frames: frames, stages: stages, dual: DUALK, habitats: HAB3 };
})();
