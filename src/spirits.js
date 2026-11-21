window.H = window.H || {};
// Spirits: authored in a 32x32 logical box, rasterised natively at any real scale k (renderScale * opts.scale), 4 directions + walk/sit poses,
// so 1x, 1.5x (0.75 on the 2x canvas), 2x and the 3x portraits are all crisp. 16-frame idle with squash-and-stretch.
(function () {
  var S = 32, NF = 16, cache = {}, pcache = {}, gcache = {};
  var list = [
    { key: 'hontori', name: 'Hontori', element: 'fire' },
    { key: 'water', name: 'Plipplop', element: 'water' },
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
            else if (d > 0.55 || r > 0.86 && d > 0.1) col = pal[3] || pal[2];
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
      col = col || '#ff8a9a'; y += dy(y);
      if (k < 1.5) rrect(x, y, 2, 1, col); else rell(x + 1, y + 0.5, 1.3, 0.62, [col, col], true);
    };
    return api;
  }

  function outline(c, col) {
    var g = c.getContext('2d'), w = c.width, h = c.height;
    var id = g.getImageData(0, 0, w, h), d = id.data, a = new Uint8Array(w * h), i, x, y;
    for (i = 0; i < w * h; i++) a[i] = d[i * 4 + 3] > 40 ? 1 : 0;
    g.fillStyle = col;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      if (a[y * w + x]) continue;
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

    water: function (p, f) { // Plipplop the otter
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

  // pose: dir 0 front | 1 back | 2 side (drawn facing left), mode 'idle' | 'move' | 'sit'
  function frame(key, k, blink, f, dir, mode) {
    dir = dir || 0; mode = mode || 'idle';
    var id = key + '|' + k + '|' + (blink ? 1 : 0) + '|' + dir + mode, arr = cache[id] || (cache[id] = []);
    if (arr[f]) return arr[f];
    var n = Math.ceil(S * k), c = mk(n, n), p = P(c, k), ph = f / NF * 6.2832, fly = !!FLY[key];
    var sn = function (v) { return Math.round(v * k) / k; };
    p.ph = ph; p.gp = ph * 2; p.blink = !!blink; p.fly = fly; p.dir = dir; p.mode = mode;
    p.back = dir === 1; p.side = dir === 2;
    p.warp = mode !== 'move';
    p.u = fly ? 0 : sn(Math.sin(ph) * (mode === 'sit' ? 0.5 : 0.8));
    p.uh = fly ? sn(Math.sin(ph - 0.9) * 0.5) : sn(Math.sin(ph) * 0.8 + Math.sin(ph - 0.9) * 0.6);
    DEF[key](p, f);
    outline(c, OUT[key] || '#1a1020');
    p.warp = false; aura(p, key, f);
    return (arr[f] = c);
  }
  function frames(key, dir, mode) {
    if (!DEF[key]) key = 'hontori';
    var a = [], k = H.renderScale || 1; for (var f = 0; f < NF; f++) a.push(frame(key, k, false, f, dir === 3 ? 2 : dir, mode)); return a;
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
    var sc = opts.scale || 1, a = opts.alpha == null ? 1 : opts.alpha;
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
      ctx.fillRect(Math.round(x - sw / 2), Math.round(y + 10 * sc), sw, Math.max(1, Math.round(2 * sc)));
      ctx.fillRect(Math.round(x - sw / 2 + 2), Math.round(y + 10 * sc - 1), sw - 4, Math.max(1, Math.round(4 * sc)));
    }
    ctx.globalAlpha = a * (GLOW[key] || 0.3) * (0.85 + 0.15 * Math.sin(t * 2.4 + sd * 9));
    ctx.drawImage(glow(key), x - 16 * sc, y + hov - 16 * sc, 32 * sc, 32 * sc);
    ctx.globalAlpha = a;
    ctx.translate(x, y + hov);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(frame(key, k, blink, f, dir === 3 ? 2 : dir, mode), -S / 2 * sc, -S / 2 * sc, S * sc, S * sc);
    ctx.restore();
  }

  function portrait(key) {
    if (pcache[key]) return pcache[key];
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
    g.drawImage(frame(key, 3, false, 0, 0, 'idle'), 0, 4);
    return (pcache[key] = c);
  }

  H.spirits = { list: list, draw: draw, portrait: portrait, frames: frames };
})();
