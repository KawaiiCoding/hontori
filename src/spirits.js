window.H = window.H || {};
// Spirits: authored in a 32x32 logical box, rasterised natively at any real scale k (renderScale * opts.scale), 4 directions + walk/sit poses,
// so 1x, 1.5x (0.75 on the 2x canvas), 2x and the 3x portraits are all crisp. 16-frame idle with squash-and-stretch.
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
    { key: 'light', name: 'Lumbleen', element: 'light' }
  ];
  var OUT = { hontori: '#3a140c', water: '#0f2440', wind: '#2a2440', grass: '#14301a', electric: '#16303a', earth: '#2a1a10', dark: '#120a1e', light: '#4a3a2a' };
  var FLY = { wind: 1, dark: 1, light: 1 }, SEED = {};
  list.forEach(function (s, i) { SEED[s.key] = hash(i * 3.7 + 1.3); });

  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
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
    g.fillStyle = col;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      if (!out[y * w + x]) continue;
      if (ud && ud[(y * w + x) * 4 + 3] > 40) continue;
      if ((x > 0 && a[y * w + x - 1]) || (x < w - 1 && a[y * w + x + 1]) || (y > 0 && a[(y - 1) * w + x]) || (y < h - 1 && a[(y + 1) * w + x]))
        g.fillRect(x, y, 1, 1);
    }
  }

  // ---------- aura particles (drawn after outline, unoutlined, glowing) ----------
  function aura(p, key, f) {
    var i, ph, x, y, k;
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
      var up = mv && Math.cos(p.gp + L[1] * Math.PI) > 0.2 ? 1 : 0, yb = y1 - up, c = L[2] ? farCol : col;
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
  var SS = [1, 1.1, 1.25, 1.4, 1.6], SM = 26; // stage scale, extra logical margin for stages 2-5
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
    var id = key + '|' + k + '|' + (blink ? 1 : 0) + '|' + dir + mode + '|' + st, arr = cache[id] || (cache[id] = []);
    if (arr[f]) return arr[f];
    var M = st > 1 ? SM : 0, n = Math.ceil((S + 2 * M) * k), c = mk(n, n), fly = !!FLY[key], ph = f / NF * 6.2832;
    var sn = function (v) { return Math.round(v * k) / k; };
    var body = st > 1 ? mk(n, n) : c, T = Math.round(M * k);
    function setup(cv) {
      var p = P(cv, k); if (T) p.g.translate(T, T);
      p.ph = ph; p.gp = ph * 2; p.blink = !!blink; p.fly = fly; p.dir = dir; p.mode = mode; p.stage = st;
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
    return (arr[f] = c);
  }
  function frames(key, dir, mode, stage) {
    if (!DEF[key]) key = 'hontori';
    var a = [], k = H.renderScale || 1; for (var f = 0; f < NF; f++) a.push(frame(key, k, false, f, dir === 3 ? 2 : dir, mode, stage)); return a;
  }

  var AURA = { hontori: '255,150,60', water: '90,180,255', wind: '200,230,255', grass: '140,220,90', electric: '110,230,250', earth: '190,150,100', dark: '150,90,230', light: '255,245,190' };
  var GLOW = { hontori: 0.22, light: 0.32, electric: 0.3 };
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
    var st = Math.max(1, Math.min(5, opts.stage | 0 || 1)), sc = sc0 * SS[st - 1], B = st > 1 ? S + 2 * SM : S, yo = 12 * sc0 - 12 * sc;
    var k = Math.max(0.5, Math.round(RS * sc * 4) / 4);
    var dir = (opts.dir | 0) & 3, mode = opts.moving ? 'move' : opts.sit ? 'sit' : 'idle';
    var f = Math.floor((t + sd * 3) * (mode === 'move' ? 16 : 12)) % NF;
    var bt = (t + sd * 5) % (2.7 + sd * 2.1), blink = mode !== 'move' && (bt < 0.15 || (sd > 0.5 && bt > 0.32 && bt < 0.42));
    var hov = FLY[key] ? Math.round((Math.sin(t * 2.6 + sd * 6) * 2 - 2) * sc * RS) / RS : 0;
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
    ctx.drawImage(frame(key, k, blink, f, dir === 3 ? 2 : dir, mode, st), -B / 2 * sc, -B / 2 * sc, B * sc, B * sc);
    ctx.restore();
  }

  function portrait(key, stage) {
    var st = Math.max(1, Math.min(5, stage | 0 || 1)), pk = key + '|' + st;
    if (pcache[pk]) return pcache[pk];
    if (!DEF[key]) key = 'hontori';
    var c = mk(96, 96), g = c.getContext('2d');
    var col = AURA[key];
    // pixel-stepped radial backdrop
    for (var y = 0; y < 96; y += 2) for (var x = 0; x < 96; x += 2) {
      var dx = x - 47, dy = y - 49, d = Math.sqrt(dx * dx + dy * dy);
      if (d > 46) continue;
      var k = 1 - d / 46, a = 0.14 + Math.floor(k * 5) / 5 * 0.42;
      g.fillStyle = 'rgba(' + col + ',' + a.toFixed(3) + ')';
      g.fillRect(x, y, 2, 2);
    }
    if (st > 1) g.drawImage(frame(key, 2, false, 0, 0, 'idle', st), 0, 0, 96, 96); else g.drawImage(frame(key, 3, false, 0, 0, 'idle'), 0, 4);
    return (pcache[pk] = c);
  }

  H.spirits = { list: list, draw: draw, portrait: portrait, frames: frames, stages: stages };
})();
