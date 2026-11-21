window.H = window.H || {};
// Characters: data-driven chibi sprites authored at 2x (56x56 real px in a 28x28 logical box, feet bottom-centre) + 96x96 portraits.
(function () {
  // ---------- colour helpers ----------
  function hex(c) { c = c.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(c.substr(i, 2), 16); }); }
  function rgb(a) { return '#' + a.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  var SC = {};
  function sh(c, f) {
    var k = c + f; if (SC[k]) return SC[k];
    var a = hex(c), r;
    if (f < 1) { var t = 1 - f; r = [a[0] * f + 34 * t * 0.5, a[1] * f + 18 * t * 0.5, a[2] * f + 52 * t * 0.6]; } // purple-ish shadows
    else { var u = f - 1; r = [a[0] + (255 - a[0]) * u, a[1] + (250 - a[1]) * u, a[2] + (225 - a[2]) * u]; } // warm highlights
    return (SC[k] = rgb(r));
  }


  // ---------- pixel grid with auto-shaded parts (k = authoring scale: logical coords * k = real pixels) ----------
  function G(w, h, ox, oy, k) { this.w = w; this.h = h; this.ox = ox; this.oy = oy; this.k = k || 1; this.c = new Array(w * h).fill(null); }
  G.prototype.set = function (x, y, c) {
    var k = this.k; x = Math.floor(x * k) + this.ox; y = Math.floor(y * k) + this.oy;
    for (var j = 0; j < k; j++) for (var i = 0; i < k; i++) {
      var X = x + i, Y = y + j; if (X >= 0 && Y >= 0 && X < this.w && Y < this.h) this.c[Y * this.w + X] = c;
    }
  };
  G.prototype.get = function (x, y) { var k = this.k; x = Math.floor(x * k) + this.ox; y = Math.floor(y * k) + this.oy; return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? null : this.c[y * this.w + x]; };
  // part(colour, painter, darkRimWidth, flat): mask -> 4 tones (light top-left rim, base, mid, dark bottom-right rim)
  G.prototype.part = function (col, fn, dk, flat) {
    var w = this.w, h = this.h, ox = this.ox, oy = this.oy, k = this.k, M = new Uint8Array(w * h); dk = (dk || 1) * k;
    var m = {
      p: function (x, y) { x = Math.floor(x) + ox; y = Math.floor(y) + oy; if (x >= 0 && y >= 0 && x < w && y < h) M[y * w + x] = 1; },
      x: function (x, y) { x = Math.floor(x) + ox; y = Math.floor(y) + oy; if (x >= 0 && y >= 0 && x < w && y < h) M[y * w + x] = 0; },
      r: function (x, y, a, b) {
        var x0 = Math.floor(x * k), y0 = Math.floor(y * k), x1 = Math.floor((x + a) * k), y1 = Math.floor((y + b) * k);
        for (var j = y0; j < y1; j++) for (var i = x0; i < x1; i++) m.p(i, j);
      },
      e: function (cx, cy, rx, ry) {
        cx *= k; cy *= k; rx *= k; ry *= k;
        for (var y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry); y++) for (var x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx); x++) {
          var u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry; if (u * u + v * v <= 1) m.p(x, y);
        }
      },
      clip: function (f) { for (var i = 0; i < w * h; i++) if (M[i] && !f(Math.floor((i % w - ox) / k), Math.floor((((i / w) | 0) - oy) / k))) M[i] = 0; },
      cut: function (f) { for (var i = 0; i < w * h; i++) if (M[i] && !f((i % w - ox + 0.5) / k, (((i / w) | 0) - oy + 0.5) / k)) M[i] = 0; }
    };
    fn(m);
    var inn = function (x, y) { return x >= 0 && y >= 0 && x < w && y < h && M[y * w + x]; };
    var D = sh(col, 0.66), Md = sh(col, 0.84), L = sh(col, 1.26), q;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      if (!M[y * w + x]) continue;
      var c = col;
      if (!flat) {
        var dark = false, mid = false, lite = false;
        for (q = 1; q <= dk; q++) if (!inn(x + q, y) || !inn(x, y + q)) dark = true;
        if (!dark) {
          for (q = 1; q <= k; q++) if (!inn(x - q, y) || !inn(x, y - q)) lite = true;
          if (!lite) for (q = dk + 1; q <= dk + k; q++) if (!inn(x + q, y) || !inn(x, y + q)) mid = true;
        }
        c = dark ? D : lite ? L : mid ? Md : col;
      }
      this.c[y * w + x] = c;
    }
  };
  G.prototype.outline = function (n) {
    var w = this.w, h = this.h, c = this.c;
    for (var pass = 0; pass < (n || 1); pass++) {
      var o = [];
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
        var i = y * w + x; if (c[i]) continue;
        var nb = (x > 0 && c[i - 1]) || (x < w - 1 && c[i + 1]) || (y > 0 && c[i - w]) || (y < h - 1 && c[i + w]);
        if (nb) o.push(i, nb);
      }
      for (var q = 0; q < o.length; q += 2) c[o[q]] = pass ? o[q + 1] : sh(o[q + 1], 0.24);
    }
  };
  G.prototype.canvas = function (s, flip) {
    var cv = document.createElement('canvas'); cv.width = this.w * s; cv.height = this.h * s;
    var x = cv.getContext('2d');
    for (var j = 0; j < this.h; j++) for (var i = 0; i < this.w; i++) {
      var c = this.c[j * this.w + i]; if (!c) continue;
      x.fillStyle = c; x.fillRect((flip ? this.w - 1 - i : i) * s, j * s, s, s);
    }
    return cv;
  };

  // ---------- character data ----------
  // ---------- character data ----------
  var C = {
    kid: { name: 'You', kid: 1, skin: '#f6c9a0', hair: '#7a4a2a', style: 'messy', shirt: '#4d7fd0', pants: '#46466a', shoes: '#c4523a',
      scarf: '#e2453a', eye: '#4f9a4a', expr: 'grin', raised: 1, freckles: 1, bg: '#9ec8f0' },
    mom: { name: 'Mom', skin: '#f2c29a', hair: '#b5562e', style: 'bun', dress: '#4fa07c', pants: '#5a4a5a', shoes: '#6a3a2a',
      ties: '#f0d070', collar: '#f6efe0', eye: '#8a5a3a', expr: 'smile', bg: '#f2c6a0' },
    dad: { name: 'Dad', skin: '#e3b08a', hair: '#3a2a22', style: 'short', shirt: '#d8a040', collar: '#7a4a2a', pants: '#3a4a6a', shoes: '#3a2a22',
      eye: '#4a6a9a', expr: 'smile', stubble: 1, bg: '#c8d8a0' },
    elder: { name: 'Elder Moro', skin: '#e8b890', hair: '#ece8e0', style: 'elder', robe: '#6a5aa8', trim: '#e0b850', pants: '#4a3a5a',
      shoes: '#5a3a2a', staff: 1, beard: 1, eye: '#4a4a6a', expr: 'closed', brow: '#f8f6f0', bg: '#c8b0e8' },
    innkeeper: { name: 'Bruno', skin: '#d89a70', hair: '#2a1a14', style: 'bandana', band: '#d04848', shirt: '#f0e6d0', pants: '#5a3a2a',
      shoes: '#3a2418', apron: '#e8dcc0', moustache: 1, eye: '#5a3a2a', expr: 'smile', my: 33, bg: '#f0b090' },
    shopkeeper: { name: 'Nettle', skin: '#f0c8a8', hair: '#8a3a5a', style: 'ponytail', shirt: '#e8b048', pants: '#4a3a3a', shoes: '#5a3a2a',
      apron: '#5e8a4a', ties: '#f0e070', glasses: 1, eye: '#7a4aa0', expr: 'smile', bg: '#a8e0c8' },
    girl: { name: 'Lily', kid: 1, skin: '#f8d0b0', hair: '#f0c050', style: 'twintails', dress: '#e06a8a', pants: '#f4ecec', shoes: '#7a3a4a',
      ties: '#4ab0e0', collar: '#ffffff', eye: '#3a7ad8', expr: 'grin', bg: '#f8c0d8' },
    boy: { name: 'Tomo', kid: 1, skin: '#c88a60', hair: '#1e1e2e', style: 'cap', cap: '#3aa05a', shirt: '#f08a30', pants: '#6a5a4a',
      shoes: '#f0f0f0', eye: '#6a4a2a', expr: 'grin', bandaid: 1, raised: 1, bg: '#b8e0a0' },
    farmer: { name: 'Farmer', skin: '#d9a27a', hair: '#6a4a2a', style: 'hat', cap: '#e2c060', shirt: '#c8563a', pants: '#3e5486', shoes: '#4a3020',
      apron: '#4a64a0', stubble: 1, eye: '#4a3a2a', expr: 'smile', wide: 1, bg: '#e8dc98' },
    fisher: { name: 'Fisher', skin: '#c98a5e', hair: '#a4a4ac', style: 'bandana', band: '#2a6a9a', shirt: '#e8e0c8', pants: '#3a4a3a', shoes: '#2a2a2a',
      apron: '#d8a030', beard: 1, brow: '#c8c8d0', eye: '#3a4a6a', expr: 'smile', bg: '#98d0e8' },
    baker: { name: 'Baker', skin: '#f4cfb0', hair: '#c8783a', style: 'bun', ties: '#ffffff', shirt: '#f2d0c0', pants: '#6a4a3a', shoes: '#5a3a2a',
      apron: '#fbf4ea', eye: '#6a3a2a', expr: 'grin', wide: 1, bg: '#f4d8a8' },
    grandma: { name: 'Grandma', skin: '#ecc4a4', hair: '#dcd8e2', style: 'bun', ties: '#8a5aa0', dress: '#7a5a9a', pants: '#4a3a5a', shoes: '#4a2a2a',
      collar: '#f4ecf4', glasses: 1, eye: '#5a5a7a', expr: 'smile', bg: '#d8c8e8' },
    guard: { name: 'Guard', skin: '#b87a52', hair: '#2a2420', style: 'hat', cap: '#8a90a0', shirt: '#3a5a9a', collar: '#d8b850', pants: '#33334a', shoes: '#262626',
      moustache: 1, spear: 1, eye: '#3a2a1a', expr: 'smile', wide: 1, bg: '#b0c0e0' },
    kid2: { name: 'Kid', kid: 1, skin: '#8a5a3e', hair: '#241818', style: 'short', shirt: '#f0cc3a', pants: '#3a6aa0', shoes: '#e04a4a',
      eye: '#4a2a1a', expr: 'grin', raised: 1, freckles: 1, bg: '#f8e0a0' },
    traveler: { name: 'Traveler', skin: '#e8b890', hair: '#5a3a6a', style: 'ponytail', ties: '#c04040', robe: '#5e7048', trim: '#c8a050', pants: '#4a3a2a',
      shoes: '#5a3a2a', scarf: '#c8a050', eye: '#5a8a4a', expr: 'smile', bg: '#c8d8b0' },
    gardener: { name: 'Gardener', skin: '#f0c8a0', hair: '#a83a2a', style: 'hat', cap: '#78a048', shirt: '#9ad0e0', pants: '#5a4a3a', shoes: '#4a3a2a',
      apron: '#7a5a3a', freckles: 1, eye: '#3a7a5a', expr: 'grin', bg: '#c0e8b0' }
  };
  var E = '#2a1c2e', GL = '#3a2e44', WH = '#fbf6f0', MO = '#a8443c';

  // ---------- sprite (authored at 2x: 56x56 real px, local centre x = 16, feet bottom at local y = 47) ----------
  function sHair(g, d, dir, P) {
    var hx = P.hx, hw = P.hw, hy = P.hy, hh = P.hh, cy = P.cy, A = P.A, lg = P.lag, ey = P.ey;
    var st = d.style, side = dir >= 2, up = dir === 1, fr = hy + (A ? 6 : 8), bot = hy + hh - 3, R = hx + hw - 1;
    if (st === 'elder') {
      g.part(d.hair, function (m) {
        if (dir === 0) { m.e(hx + 1, cy + 2, 2.6, 5); m.e(31 - hx, cy + 2, 2.6, 5); }
        else if (up) { m.e(16, cy, hw / 2 + 1, hh / 2 + 1); m.clip(function (x, y) { return y >= cy - 2; }); }
        else { m.e(17, cy, hw / 2, hh / 2 + 1); m.clip(function (x, y) { return x >= 18 && y >= cy - 4; }); }
      });
      return;
    }
    var lng = st === 'bun' || st === 'twintails' || st === 'ponytail', shortS = st === 'short' || st === 'cap' || st === 'hat' || st === 'bandana';
    var longH = lng ? bot : shortS ? fr + 4 : bot - 3, swept = st === 'bun' || st === 'ponytail', tl = shortS ? 2 : 4, per = A ? 6 : 7;
    function bang(x, y) {
      var j = y - fr; if (j < 0 || j >= tl) return false;
      if (swept) return j < (1 - (x - hx) / hw) * 5;
      var q = (((x - hx + (A ? 1 : 2)) % per) + per) % per;
      return Math.abs(q - (per - 1) / 2) <= per / 2 - j;
    }
    g.part(d.hair, function (m) {
      m.e(16, cy - 1, hw / 2 + 1, hh / 2 + 1);
      m.clip(function (x, y) {
        if (y < fr) return true;
        if (up) return y <= bot + (lng ? 3 : 1);
        if (!side) return bang(x, y) || ((x <= hx + 1 || x >= R - 1) && y <= longH);
        return (x >= 20 && y <= longH + 2) || (x >= 14 && y <= fr + 3) || bang(x, y);
      });
      if (st === 'messy') {
        if (!side) {
          m.r(6, hy - 2 + lg, 3, 4); m.p(7, hy - 3 + lg); m.r(12, hy - 4 + lg, 4, 4); m.p(13, hy - 5 + lg); m.r(23, hy - 2 + lg, 3, 4); m.p(24, hy - 3 + lg);
          m.r(17, hy - 4 + lg, 2, 3); m.r(18, hy - 6 + lg, 2, 2); m.r(20, hy - 7 + lg, 2, 2); m.p(22, hy - 6 + lg);
          m.r(2, cy - 2 + lg, 2, 2); m.r(2, cy + 3 + lg, 2, 2); m.r(28, cy - 2 + lg, 2, 2); m.r(28, cy + 3 + lg, 2, 2);
        } else {
          m.r(9, hy - 2 + lg, 3, 4); m.p(9, hy - 3 + lg); m.r(15, hy - 4 + lg, 4, 4); m.r(19, hy - 6 + lg, 2, 3); m.r(21, hy - 7 + lg, 2, 2); m.p(23, hy - 6 + lg);
          m.r(28, cy - 5 + lg, 2, 3); m.p(30, cy - 5 + lg); m.r(28, cy + lg, 3, 2); m.p(31, cy + 1 + lg); m.r(27, cy + 5 + lg, 3, 2);
        }
      }
      if (st === 'bun') { if (side) m.e(26, hy + 3 + lg, 4.5, 4.5); else m.e(16, hy - 1 + lg, 5.5, 4.5); }
      if (st === 'ponytail') { if (dir === 0) m.e(R + 2, cy + 4 + lg, 2.8, 6); else if (up) m.e(16, hy + hh + lg, 3.2, 6.5); else m.e(R + 2, cy + 3 + lg, 3.2, 7); }
      if (st === 'twintails') { if (side) m.e(R - 2, cy + 6 + lg, 3.4, 6.5); else { m.e(hx, cy + 6 + lg, 3.4, 6.5); m.e(32 - hx, cy + 6 + lg, 3.4, 6.5); } }
    });
    // glossy highlight arc (top-left light)
    var HL = sh(d.hair, 1.5), HM = sh(d.hair, 1.22);
    for (var x = hx + 3; x <= 21; x++) {
      if (x === 13 || x === 14 || x === 19) continue;
      var yy = hy + 2 + Math.round(Math.pow((x - 16) / (hw / 2), 2) * 4);
      if (g.get(x, yy) === d.hair) g.set(x, yy, x < 15 ? HL : HM);
      if (x > hx + 4 && x < 12 && g.get(x, yy + 1) === d.hair) g.set(x, yy + 1, HM);
    }
    if (st === 'twintails') g.part(d.ties, function (m) { var y = Math.floor(cy) + 1 + lg; if (side) m.r(R - 4, y + 1, 5, 2); else { m.r(hx - 2, y, 5, 2); m.r(R - 2, y, 5, 2); } }, 1, true);
    if (st === 'ponytail') g.part(d.ties, function (m) { if (up) m.r(14, hy + hh - 4, 4, 2); else m.r(R, cy - 1, 3, 2); }, 1, true);
    if (st === 'bun' && !side) g.part(d.ties, function (m) { m.r(13, hy + 2, 6, 1); }, 1, true);
    if (st === 'bandana') {
      g.part(d.band, function (m) {
        m.e(16, cy - 1, hw / 2 + 1.3, hh / 2 + 1.3); m.clip(function (x, y) { return y < fr - 1; });
        if (side) { m.r(R + 1, fr - 4, 2, 3); m.r(R + 2, fr - 2, 2, 5); m.r(R + 4, fr - 3, 1, 3); }
        if (up) { m.r(14, fr - 2, 4, 2); m.r(13, fr, 2, 4); m.r(17, fr, 2, 3); }
      });
      [[11, 1], [16, 0], [21, 2], [13, 4], [19, 4], [9, 4], [23, 4]].forEach(function (p) { if (g.get(p[0], hy + p[1]) === d.band) g.set(p[0], hy + p[1], '#fff4e0'); });
    }
    if (st === 'cap') {
      g.part(d.cap, function (m) { m.e(16, cy - 1, hw / 2 + 1.3, hh / 2 + 1.3); m.clip(function (x, y) { return y < fr - 1; }); });
      if (!up) g.part(sh(d.cap, 0.8), function (m) { if (dir === 0) m.r(hx + 1, fr - 2, hw - 2, 3); else m.r(hx - 4, fr - 3, 11, 3); });
      else g.part(sh(d.cap, 0.8), function (m) { m.r(13, fr - 3, 6, 2); }, 1, true);
      if (dir === 0) { g.set(15, hy - 1, '#fff'); g.set(16, hy - 1, '#fff'); }
    }
    if (st === 'hat') { // wide-brim hat: dome + brim + band
      g.part(d.cap, function (m) { m.e(16, cy - 3, hw / 2 - 1, hh / 2 - 1); m.clip(function (x, y) { return y < fr - 2; }); });
      g.part(sh(d.cap, 0.88), function (m) { m.r(hx - 3, fr - 3, hw + 6, 2); m.r(hx - 1, fr - 1, hw + 2, 1); });
      g.part(sh(d.cap, 0.6), function (m) { m.r(hx + 2, fr - 5, hw - 4, 2); }, 1, true);
    }
  }

  // ---------- idle actions (posed arms + small props) ----------
  // hand positions (top-left of the 4x3 hand) for named poses; front view uses L/R, side view a single near arm
  function hp(n, P, w) {
    var by = P.by, hy = P.hy, ey = P.ey, my = P.my, hx = P.hx;
    if (P.side) return ({ chest: [10, by + 6], low: [9, by + 9], high: [13, hy - 3], gest: [6, by + 5], salute: [hx + 1, ey - 4], mouth: [hx - 1, my - 2] })[n];
    var L = w === 'L';
    return ({ chest: L ? [10, by + 6] : [18, by + 6], low: L ? [10, by + 9] : [18, by + 9], high: L ? [2, hy - 2] : [26, hy - 2],
      gest: L ? [1, by + 5] : [27, by + 5], salute: L ? [8, ey - 4] : [20, ey - 4], mouth: L ? [13, my - 2] : [15, my - 2] })[n];
  }
  function pose(sp, l, r, P) { if (l) { sp.L = typeof l === 'string' ? hp(l, P, 'L') : l; sp.Ln = l; } if (r) { sp.R = typeof r === 'string' ? hp(r, P, 'R') : r; sp.Rn = r; } return sp; }
  function seg(m, a, b, w) {
    var n = Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]))) + 1;
    for (var i = 0; i <= n; i++) { var t = i / n; m.r(a[0] + (b[0] - a[0]) * t - w / 2, a[1] + (b[1] - a[1]) * t - 1.5, w, 3); }
  }
  function armPose(g, d, sleeve, w, H, P) {
    var S = w === 'S' ? [15.5, P.by + 2] : w === 'L' ? [5.5, P.by + 2] : [25.5, P.by + 2], out = w === 'S' ? 0 : w === 'L' ? -1 : 1;
    var Hc = [H[0] + 2, H[1] + 1.5], E;
    if (Hc[1] < P.by + 2) E = [(S[0] + Hc[0]) / 2 + out * 2, (S[1] + Hc[1]) / 2];
    else E = [S[0], Math.min(Hc[1], P.by + 7)];
    g.part(sleeve, function (m) { seg(m, S, E, 4); seg(m, E, Hc, 3); });
    g.part(d.skin, function (m) { m.r(H[0], H[1], 4, 3); });
  }
  function ln(g, x0, y0, x1, y1, c, L) {
    var n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0;
    for (var i = 0; i <= n; i++) { var t = n ? i / n : 0, x = Math.round(x0 + (x1 - x0) * t), y = Math.round(y0 + (y1 - y0) * t); if (L) L.push([x, y, c]); else g.set(x, y, c); }
  }
  function loopP(fps) { return function (p, u) { return Math.floor(u * fps) % 4; }; }
  function seqP(p) { return Math.min(3, Math.floor(p * 4)); }
  var ACT = {
    talk: { ph: null, f: function (a, P) { return pose({}, null, a === 1 ? 'gest' : a === 2 ? 'chest' : null, P); } },
    fish: { ph: function (p, u) { return p < 0.16 ? 0 : p < 0.3 ? 1 : 2 + (Math.floor(u * 3) & 1); }, f: function (a, P) {
      var sp = pose({}, a >= 2 ? 'low' : null, a === 0 ? (P.side ? [14, P.by - 2] : [24, P.by - 1]) : a === 1 ? 'gest' : 'chest', P), fw = P.fw;
      var R = sp.R, hc = [R[0] + 2, R[1] + 1];
      var tip = a === 0 ? [hc[0] - fw * 5, hc[1] - 20] : a === 1 ? [hc[0] + fw * 16, hc[1] - 10] : [hc[0] + fw * 14, hc[1] - 13 + (a === 3 ? 2 : 0)];
      sp.back = function (g) { ln(g, hc[0], hc[1] + 3, tip[0], tip[1], '#7a5230'); };
      sp.front = function (g, P2, L) {
        g.set(hc[0] + fw * 2, hc[1] + 2, '#9aa0aa'); g.set(hc[0] + fw * 3, hc[1] + 2, '#6a7080');
        var B = a === 1 ? [tip[0] + fw * 3, tip[1] + 5] : [hc[0] + fw * 18, 43 + (a === 3 ? 1 : 0)];
        if (a >= 1) {
          ln(g, tip[0], tip[1], B[0], B[1], '#e4eef2', L);
          L.push([B[0], B[1], '#e03a3a'], [B[0] + 1, B[1], '#e03a3a'], [B[0], B[1] + 1, '#ffffff'], [B[0] + 1, B[1] + 1, '#ffffff']);
          if (a === 3) L.push([B[0] - 2, B[1] + 2, '#d8f4ff'], [B[0] + 3, B[1] + 2, '#d8f4ff'], [B[0] - 1, B[1] + 2, '#bfe6ff'], [B[0] + 2, B[1] + 2, '#bfe6ff']);
        }
      };
      return sp;
    } },
    knead: { ph: loopP(4), f: function (a, P) {
      var by = P.by, o = a & 1, sp = P.side ? pose({}, null, [9, by + 8 + o], P) : pose({}, [10, by + 8 + o], [18, by + 9 - o], P);
      var cx = P.side ? 9 : 16;
      sp.back = function (g) { g.part('#e2b878', function (m) { m.e(cx, by + 11.5, P.side ? 4 : 5.5, 2.5); }); };
      sp.front = function (g, P2, L) {
        if (a < 2) return;
        var dy = (a - 2) * 2;
        [[-3, 5], [4, 4], [0, 3], [-5, 4], [2, 6]].forEach(function (q, i) { L.push([cx + q[0], by + q[1] - dy - (i & 1), i % 3 ? '#f6f2ea' : '#ffffff']); });
      };
      return sp;
    } },
    knit: { ph: loopP(6), f: function (a, P) {
      var by = P.by, o = a & 1, sp = P.side ? pose({}, null, [10, by + 6], P) : pose({}, [11, by + 6], [17, by + 6 + o], P);
      sp.back = function (g) {
        if (P.up) return;
        var x0 = P.side ? 7 : 12;
        g.part('#e07aa0', function (m) { m.r(x0, by + 9, P.side ? 6 : 9, 3); });
        for (var i = x0; i < x0 + (P.side ? 6 : 9); i += 2) g.set(i, by + 10, '#f4b0c8');
        g.part('#b05a8a', function (m) { m.e(P.side ? 4 : 25, 45, 2.5, 2); });
      };
      sp.front = function (g, P2, L) {
        if (P.up) return;
        if (P.side) { ln(g, 11, by + 7, 7 - o, by + 1, '#c8ccd8'); ln(g, 12, by + 7, 9 + o, by + 2, '#aab0c0'); if (o) L.push([8, by + 1, '#ffffff']); }
        else { ln(g, 12, by + 7, 18 - o, by + 1, '#c8ccd8'); ln(g, 20, by + 7 + o, 14 + o, by + 1, '#c8ccd8'); if (o) L.push([16, by, '#ffffff'], [15, by - 1, '#fff8d0']); }
      };
      return sp;
    } },
    hoe: { ph: seqP, f: function (a, P) {
      var by = P.by, ey = P.ey, hx = P.hx, sp = {};
      var X = P.side ? 7 : P.up ? 3 : 28;
      if (P.side) pose(sp, null, a >= 2 ? [hx + 1 + (a === 3 ? 2 : 0), ey - 3] : [X - 2, by + 1], P);
      else pose(sp, a >= 2 ? [8 + (a === 3 ? 3 : 0), ey - 3] : null, [25, by + 1], P);
      sp.back = function (g) {
        g.part('#9a6a3a', function (m) { m.r(X, by - 5, 2, 47 - by + 5); });
        g.part('#9aa0aa', function (m) { if (P.side) m.r(X - 5, 44, 7, 3); else m.r(X, 44, 6, 3); });
      };
      sp.front = function (g, P2, L) { if (a === 3 && !P.up) L.push(P.side ? [hx - 2, ey + 1, '#bfe8ff'] : [7, ey + 2, '#bfe8ff'], P.side ? [hx - 2, ey + 2, '#8ad0ff'] : [7, ey + 3, '#8ad0ff']); };
      return sp;
    } },
    water: { ph: loopP(6), f: function (a, P) {
      var by = P.by, sp = P.side ? pose({}, null, [9, by + 8], P) : pose({}, null, [21, by + 8], P);
      sp.front = function (g, P2, L) {
        if (P.up) return;
        var s = P.side ? -1 : 1, cx = P.side ? 5 : 22, tx = P.side ? -1 : 33, ty = by + 8 + (a & 1);
        g.part('#5f9a78', function (m) { m.r(cx, by + 10, 7, 5); });
        g.part('#4a7a60', function (m) { m.r(cx + 2, by + 8, 3, 2); });
        ln(g, P.side ? cx - 1 : cx + 7, by + 11, tx, ty, '#5f9a78'); g.set(tx, ty, '#3e6a52'); g.set(tx + s, ty, '#3e6a52');
        for (var i = 0; i < 4; i++) { var yy = ty + 2 + ((a * 3 + i * 4) % 14); L.push([tx + s * (i & 1) + s, yy, '#9adcff']); if (i === 1) L.push([tx + s, yy + 1, '#d8f4ff']); }
      };
      return sp;
    } },
    spear: { ph: seqP, still: function (a) { return a >= 2; }, f: function (a, P) {
      var sp = { spy: a === 0 ? -3 : 0 };
      if (a === 0) pose(sp, null, P.side ? [7, P.by + 3] : [25, P.by + 3], P);
      if (a >= 2) pose(sp, P.side ? null : 'salute', P.side ? 'salute' : null, P);
      if (a === 1) sp.front = function (g, P2, L) { var x = P.side ? 6 : P.up ? 2 : 28; L.push([x - 2, 47, '#d8c8a8'], [x + 3, 47, '#d8c8a8'], [x - 3, 46, '#e8dcc0'], [x + 4, 46, '#e8dcc0']); };
      return sp;
    } },
    hop: { ph: loopP(7), dy: function (a) { return [0, -1.5, -2.5, -1][a]; }, f: function (a, P) { return a === 1 || a === 2 ? pose({}, 'high', 'high', P) : {}; } },
    swing: { ph: loopP(5), f: function (a, P) { return pose({}, a === 0 ? 'gest' : null, a === 2 ? 'gest' : null, P); } },
    kick: { ph: seqP, f: function (a, P) {
      var sp = { kl: a === 0 ? 3 : a === 1 ? 2 : 0 };
      sp.front = function (g, P2, L) {
        if (a === 0 || P.up) return;
        var x = P.side ? [9, 4, -1][a - 1] : [24, 29, 34][a - 1], y = a === 2 ? 45 : 46;
        L.push([x, y, '#8a8a92'], [x + 1, y, '#6a6a72'], [x, y + 1, '#6a6a72'], [x + 1, y + 1, '#55555e'], [x, y - 1 + (a === 2 ? 0 : 1), '#c0c0c8']);
      };
      return sp;
    } },
    map: { ph: loopP(1.5), nd: function () { return 1; }, f: function (a, P) {
      var by = P.by, o = a & 1, sp = P.side ? pose({}, null, [8, by + 6], P) : pose({}, [9, by + 6 + o], [19, by + 6], P);
      sp.lk = P.side ? 0 : (a < 2 ? -1 : 1);
      sp.back = function (g) {
        if (P.up) return;
        var x0 = P.side ? 3 : 8, w = P.side ? 6 : 16;
        g.part('#efe0b4', function (m) { m.r(x0, by + 2 + (P.side ? 0 : o), w, 8); });
        if (!P.side) {
          for (var i = 0; i < 8; i++) g.set(16, by + 2 + o + i, '#d8c490');
          [[10, 7], [11, 6], [13, 6], [14, 5], [18, 6], [19, 7]].forEach(function (q) { g.set(q[0], by + q[1] + o, '#a07a4a'); });
          g.set(20, by + 4 + o, '#d04040'); g.set(21, by + 5 + o, '#d04040'); g.set(21, by + 4 + o, '#d04040'); g.set(20, by + 5 + o, '#d04040');
        } else { g.set(5, by + 5, '#a07a4a'); g.set(6, by + 6, '#a07a4a'); }
      };
      return sp;
    } },
    beard: { ph: loopP(2.5), nd: function (a) { return a >= 2 ? 1 : 0; }, f: function (a, P) {
      return P.side ? pose({}, null, [P.hx + 2, P.ey + 5 + a], P) : pose({}, [11, P.ey + 5 + a], null, P);
    } },
    mug: { ph: loopP(5), f: function (a, P) {
      var by = P.by, sp = P.side ? pose({}, null, [8, by + 7], P) : pose({}, [10, by + 7], [[15, by + 1], [17, by + 3], [15, by + 5], [13, by + 3]][a], P);
      sp.back = function (g) {
        if (P.up) return;
        var x0 = P.side ? 6 : 11;
        g.part('#6a8ac8', function (m) { m.r(x0, by + 2, 6, 6); m.r(P.side ? x0 + 6 : x0 - 2, by + 3, 2, 3); m.x(P.side ? x0 + 7 : x0 - 2, by + 4); });
        g.part('#f4f0e0', function (m) { m.r(x0, by + 2, 6, 1); }, 1, true);
      };
      sp.front = function (g, P2, L) {
        if (P.up) return;
        if (P.side) { var cx = [6, 8, 10, 8][a]; g.part('#f4f4ee', function (m) { m.r(cx, by + 1, 3, 2); }); }
        else { var R = sp.R; g.part('#f4f4ee', function (m) { m.r(R[0] - 1, R[1] + 2, 5, 2); }); }
        L.push([P.side ? 7 : 12, by + 3, '#ffffff']);
      };
      return sp;
    } },
    coins: { ph: loopP(6), f: function (a, P) {
      var by = P.by, sp = P.side ? pose({}, null, [9, by + 9], P) : pose({}, [10, by + 9], [18, by + 7], P);
      sp.front = function (g, P2, L) {
        if (P.up) return;
        var x0 = P.side ? 9 : 10;
        g.part('#e8b830', function (m) { m.r(x0, by + 7, 4, 2); m.r(x0 + 1, by + 6, 2, 1); }, 1);
        var cx = P.side ? 10 : 15, cy = by + 3 - [0, 3, 5, 2][a];
        if (a & 1) L.push([cx, cy, '#ffd860'], [cx, cy + 1, '#c89020']);
        else L.push([cx - 1, cy, '#ffd860'], [cx, cy, '#ffe890'], [cx - 1, cy + 1, '#c89020'], [cx, cy + 1, '#e8b830']);
        if (a === 2) L.push([cx + 2, cy - 1, '#fffbe0'], [cx + 2, cy - 2, '#fffbe0'], [cx + 3, cy - 1, '#fffbe0']);
      };
      return sp;
    } },
    stretch: { ph: seqP, f: function (a, P) { var sp = a >= 1 ? pose({}, 'high', 'high', P) : pose({}, 'chest', 'chest', P); sp.ec = a === 1 || a === 2; sp.mo = a === 1 || a === 2; return sp; } },
    yawn: { ph: seqP, f: function (a, P) { var sp = pose({}, a === 0 || a === 3 ? 'chest' : 'mouth', null, P); sp.ec = a >= 1; sp.mo = a === 1; return sp; } },
    fold: { ph: loopP(1), f: function (a, P) { var sp = P.side ? pose({}, null, [11, P.by + 6], P) : pose({}, [16, P.by + 6], [11, P.by + 7], P); sp.lk = [0, -1, 0, 1][a]; return sp; } }
  };
  var IDLE = { fisher: ['fish'], baker: ['knead'], grandma: ['knit'], farmer: ['hoe'], gardener: ['water'], guard: ['spear'],
    kid: ['hop', 'swing', 'kick'], kid2: ['kick', 'hop', 'swing'], girl: ['hop', 'swing', 'kick'], boy: ['kick', 'swing', 'hop'],
    traveler: ['map'], elder: ['beard'], innkeeper: ['mug'], shopkeeper: ['coins'], mom: ['stretch', 'yawn', 'fold'], dad: ['fold', 'yawn', 'stretch'] };
  function hsh(n) { var s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

  function sprite(d, dir, f, o) {
    var g = new G(56, 56, 12, 6), A = !d.kid, side = dir >= 2, up = dir === 1;
    var st = f === 1 ? -1 : f === 3 ? 1 : 0, b = st ? 2 : (o.br || 0), lag = st ? -1 : f === 2 ? 1 : 0;
    var hw = A ? 20 : 24, hh = A ? 20 : 22, hx = 16 - hw / 2, hy = (A ? 1 : 5) + b + (o.nd || 0);
    if (o.hl != null && !st) lag = o.hl;
    var by = (A ? 20 : 25) + b, ly = A ? 35 : 38, cy = hy + hh / 2, ey = hy + hh - (A ? 10 : 11);
    var body = d.robe || d.dress || d.shirt, sleeve = d.robe || d.shirt || d.dress;
    var tx = side ? (d.wide ? 10 : 11) : (d.wide ? 7 : 8), tw = side ? (d.wide ? 12 : 10) : (d.wide ? 18 : 16), al = A ? 10 : 8, i, j;
    var dim = function (c) { return sh(c, 0.78); };
    var my0 = hy + hh - (A ? 10 : 11) + (A ? 6 : 7);
    var P = { side: side, up: up, dir: dir, fw: side ? -1 : 1, by: by, hy: hy, ey: ey, my: my0, hx: hx, A: A, ly: ly, tx: tx, tw: tw };
    var ACTD = o.ac && ACT[o.ac], spec = ACTD ? ACTD.f(o.ap | 0, P) || {} : {}, LATE = [];
    var HL = spec.L || null, HR = spec.R || null;
    if (side) { HR = HR || HL; HL = null; }
    if (up) { if (HL && spec.Ln !== 'high' && spec.Ln !== 'gest') HL = null; if (HR && spec.Rn !== 'high' && spec.Rn !== 'gest') HR = null; }
    function legF(x, lift, sx) {
      g.part(d.pants, function (m) { m.r(x, ly - 3, 5, 47 - ly - lift); });
      g.part(d.shoes, function (m) { m.r(sx, 44 - lift, 6, 4); m.x(sx === x ? sx + 5 : sx, 44 - lift); });
    }
    function legS(off, lift, far) {
      var y0 = ly - 3, y1 = 44 - lift;
      g.part(far ? dim(d.pants) : d.pants, function (m) { for (var q = y0; q < y1; q++) m.r(13 + Math.round(off * (q - y0) / (y1 - y0)), q, 6, 1); });
      g.part(far ? dim(d.shoes) : d.shoes, function (m) { m.r(11 + off, y1, 9, 4); m.x(11 + off, y1); m.x(12 + off, y1); m.x(19 + off, y1); });
    }
    function armS(sw, far) {
      var y0 = by + 1;
      g.part(far ? dim(sleeve) : sleeve, function (m) { for (var q = 0; q < al; q++) m.r(14 + Math.round(sw * q / al), y0 + q, 4, 1); });
      g.part(far ? dim(d.skin) : d.skin, function (m) { m.r(14 + sw, y0 + al, 4, 3); });
    }
    // legs / feet
    if (d.robe) {
      g.part(d.shoes, function (m) { if (side) m.r(10 + st * 2, 45, 9, 3); else { m.r(10, 45 - (st < 0 ? 1 : 0), 5, 3); m.r(17, 45 - (st > 0 ? 1 : 0), 5, 3); } });
    } else if (!side) { legF(10, st < 0 ? 3 : 0, 9); legF(17, st > 0 ? 3 : spec.kl || 0, 17); }
    else if (spec.kl) { legS(0, 0, true); legS(-4, spec.kl > 2 ? 2 : 1, false); }
    else if (st) { legS(st < 0 ? 4 : -4, st < 0 ? 1 : 0, true); legS(st < 0 ? -4 : 4, st < 0 ? 0 : 1, false); }
    else legS(0, 0, false);
    if (side && st) armS(st < 0 ? -5 : 5, true);
    // torso
    if (d.robe) {
      g.part(d.robe, function (m) { m.r(tx, by, tw, 45 - by); m.r(tx - 1, by + 9, tw + 2, 36 - by); m.r(tx - 2, 40, tw + 4, 5); m.x(tx, by); m.x(tx + tw - 1, by); });
      if (!up) g.part(d.trim, function (m) { if (side) m.r(tx, by + 2, 2, 43 - by); else m.r(15, by + 2, 2, 43 - by); }, 1, true);
      g.part(d.trim, function (m) { m.r(tx - 2, 43, tw + 4, 1); }, 1, true);
      for (i = 0; i < 6; i++) { g.set(tx + 3, 34 + i, sh(d.robe, 0.84)); if (!side) g.set(tx + tw - 4, 35 + i, sh(d.robe, 0.84)); }
    } else {
      g.part(body, function (m) {
        m.r(tx, by, tw, ly - by); m.x(tx, by); m.x(tx + tw - 1, by);
        if (!side) { m.x(tx + 1, by); m.x(tx, by + 1); m.x(tx + tw - 2, by); m.x(tx + tw - 1, by + 1); }
      });
      if (d.dress) {
        g.part(d.dress, function (m) { for (var q = 0; q < 7; q++) { var e2 = (q + 1) >> 1; m.r(tx - e2, ly - 4 + q, tw + 2 * e2, 1); } });
        for (i = 0; i < 4; i++) { g.set(tx + 2, ly - 2 + i, sh(d.dress, 0.84)); g.set(tx + tw - 4, ly - 2 + i, sh(d.dress, 0.84)); if (!side) g.set(16, ly - 1 + i, sh(d.dress, 0.84)); }
      } else {
        g.part(sh(d.pants, 0.82), function (m) { m.r(tx, ly - 2, tw, 2); }, 1, true);
        g.part(sh(body, 1.2), function (m) { m.r(tx + 1, ly - 3, tw - 3, 1); }, 1, true);
        if (!up && !side) g.set(16, ly - 2, '#f0d070');
      }
      var F = sh(body, 0.84);
      if (!side) [[tx + 3, 6], [tx + 4, 7], [tx + tw - 4, 6], [tx + tw - 5, 7], [tx + 3, 8]].forEach(function (p) { if (by + p[1] < ly - 4) g.set(p[0], by + p[1], F); });
      else { g.set(tx + 6, by + 6, F); g.set(tx + 7, by + 7, F); }
      if (d.collar && !up) g.part(d.collar, function (m) { if (side) m.r(tx, by + 1, 5, 2); else { m.r(12, by + 1, 8, 2); m.x(15, by + 2); m.x(16, by + 2); } }, 1, true);
      if (d.stubble && dir === 0) { g.set(16, by + 5, F); g.set(16, by + 8, F); }
    }
    if (d.apron && !up) {
      g.part(d.apron, function (m) { if (side) { m.r(tx, by + 4, 4, ly - by - 2); if (o.as) m.r(tx + 4, ly - 4, 1, 3); } else { m.r(11, by + 4, 10, ly - by - 2); m.r(11, by + 1, 2, 3); m.r(19, by + 1, 2, 3); if (o.as) { m.r(21, ly - 4, 1, 3); m.x(11, ly - 1); } } });
      if (!side) for (i = 13; i < 19; i++) g.set(i, by + 10, sh(d.apron, 0.8));
    }
    // arms (swing opposite to the legs)
    if (!side) {
      [[4, st], [24, -st]].forEach(function (a) {
        if (a[0] === 4 ? HL : HR) return;
        var len = al + a[1] * 2, y0 = by + 1, ox = a[0] === 4 ? 4 : 27;
        g.part(sleeve, function (m) { m.r(a[0], y0, 4, len); m.x(ox, y0); });
        g.part(d.skin, function (m) { m.r(a[0], y0 + len, 4, 3); m.x(ox, y0 + len + 2); });
      });
    } else if (!HR) armS(st < 0 ? 5 : st > 0 ? -5 : 0, false);
    // scarf: wrap + tail trailing in the wind
    if (d.scarf) {
      var wl = o.wl || 0, L = [7, 11, 15][wl], sx = dir === 0 ? 21 : up ? 16 : tx + tw - 2, sy = by + 1, ph = (o.sp || 0) * Math.PI / 2;
      var path = function (m, i0, i1) {
        for (var q = i0; q <= i1; q++) {
          var kk = q / L, droop = q * [0.85, 0.3, 0.04][wl] - (wl === 2 ? kk * 2 : 0), amp = [1, 1.7, 2.3][wl];
          var y = sy + droop + Math.sin(q * 0.55 - ph) * amp * kk, x = sx + q * (wl === 0 ? 0.6 : 1);
          m.r(Math.round(x), Math.round(y), 2, q > L - 2 ? 3 : 4);
        }
      };
      g.part(d.scarf, function (m) { path(m, 0, L); });
      g.part(sh(d.scarf, 1.4), function (m) { path(m, L - 4, L - 3); }, 1, true);
      g.part(d.scarf, function (m) {
        m.r(tx - 1, by, tw + 2, 5); m.x(tx - 1, by); m.x(tx + tw, by); m.x(tx - 1, by + 4); m.x(tx + tw, by + 4);
        if (dir === 0) m.r(19, by + 2, 4, 5);
      });
      for (i = tx + 1; i < tx + tw - 1; i += 3) g.set(i, by + 2 + (i & 1), sh(d.scarf, 0.84));
    }
    // staff
    if (d.staff) {
      var fx = side ? 6 : up ? 2 : 28;
      g.part('#8a5a32', function (m) { m.r(fx, by - 8, 2, 56 - by); });
      g.part('#6ad0ff', function (m) { m.e(fx + 1, by - 10, 3, 3); });
      g.set(fx, by - 12, '#e8fbff');
    }
    if (d.spear) {
      var spx = side ? 6 : up ? 2 : 28, spy = spec.spy || 0;
      g.part('#8a6a42', function (m) { m.r(spx, by - 13 + spy, 2, 60 - by - spy); });
      g.part('#c8ccd8', function (m) { m.r(spx, by - 19 + spy, 2, 6); m.r(spx - 1, by - 16 + spy, 4, 2); }, 1);
      g.part('#c83a3a', function (m) { m.r(spx - 1, by - 13 + spy, 4, 2); }, 1, true);
    }
    // head
    g.part(d.skin, function (m) {
      m.e(16, cy, hw / 2, hh / 2);
      if (side) m.r(hx - 1, ey + 4, 1, 2); else if (!up) { m.r(hx - 1, ey + 2, 1, 4); m.r(hx + hw, ey + 2, 1, 4); }
    });
    // face
    var I = d.eye, IL = sh(d.eye, 1.35), closed = d.expr === 'closed' || spec.ec, mouthOn = d.expr !== 'closed' || o.mo || spec.mo, w = A ? 3 : 4, rows = A ? 3 : 4, gx = spec.lk != null ? spec.lk : (o.lk || 0);
    function eye(x0, mir) {
      var q, r;
      if (closed) { g.set(x0, ey + 2, E); for (q = 1; q < w - 1; q++) g.set(x0 + q, ey + 1, E); g.set(x0 + w - 1, ey + 2, E); return; }
      if (o.bl) { for (q = 0; q < w; q++) g.set(x0 + q, ey + rows - 1, E); return; }
      for (q = 0; q < w; q++) g.set(x0 + q, ey, E);
      var sc = mir ? x0 : x0 + w - 1, p0 = mir ? x0 + 1 : x0;
      for (r = 1; r <= rows; r++) {
        if (r < rows) g.set(sc, ey + r, WH);
        for (q = 0; q < w - 1; q++) g.set(p0 + q, ey + r, r === rows ? (A ? I : IL) : (r === rows - 1 && !A) ? I : E);
      }
      g.set(p0, ey + 1, '#ffffff');
    }
    var my = ey + (A ? 6 : 7), grin = d.expr === 'grin', BL = A ? sh(d.skin, 0.9) : '#f09a94', mc = grin ? E : MO;
    if (dir === 0) {
      if (A) { eye(10 + gx, false); eye(19 + gx, true); g.set(16 + gx, ey + 4, sh(d.skin, 0.8)); } else { eye(9 + gx, false); eye(19 + gx, true); }
      if (o.mo || spec.mo) {
        for (i = 14; i <= 17; i++) g.set(i + gx, my - 1, E);
        g.set(14 + gx, my, E); g.set(15 + gx, my, '#b8404c'); g.set(16 + gx, my, '#b8404c'); g.set(17 + gx, my, E);
        g.set(15 + gx, my + 1, E); g.set(16 + gx, my + 1, E);
      } else if (mouthOn) {
        g.set(13 + gx, my - 1, mc); g.set(18 + gx, my - 1, mc); for (i = 14; i <= 17; i++) g.set(i + gx, my, mc);
        if (grin) { g.set(15 + gx, my + 1, '#e0606c'); g.set(16 + gx, my + 1, '#e0606c'); }
      }
      if (A) { g.set(8, ey + 4, BL); g.set(9, ey + 4, BL); g.set(22, ey + 4, BL); g.set(23, ey + 4, BL); }
      else for (i = 0; i < 3; i++) for (j = 0; j < 2; j++) { g.set(6 + i, ey + 5 + j, BL); g.set(23 + i, ey + 5 + j, BL); }
      if (d.freckles) { g.set(7, ey + 4, sh(d.skin, 0.78)); g.set(24, ey + 4, sh(d.skin, 0.78)); }
      if (d.bandaid) for (i = 22; i <= 25; i++) { g.set(i, ey + 5, '#f6e2c0'); g.set(i, ey + 6, i === 23 ? '#d8b080' : '#f6e2c0'); }
    } else if (side) {
      eye(hx + 3 + (gx > 0 ? 1 : 0), true);
      if (o.mo || spec.mo) { g.set(hx + 2, my - 1, E); g.set(hx + 3, my - 1, E); g.set(hx + 2, my, '#b8404c'); g.set(hx + 3, my, E); g.set(hx + 2, my + 1, E); }
      else if (mouthOn) { g.set(hx + 2, my, mc); g.set(hx + 3, my, mc); g.set(hx + 4, my - (grin ? 1 : 0), mc); }
      if (!A) for (i = 0; i < 3; i++) for (j = 0; j < 2; j++) g.set(hx + 8 + i, ey + 5 + j, BL);
    }
    if (d.stubble && !up) for (j = ey + 4; j <= ey + 9; j++) for (i = hx; i < hx + hw; i++) if (((i + j) & 1) && g.get(i, j) === d.skin && !(Math.abs(i - 15.5) < 3 && j < ey + 8)) g.set(i, j, sh(d.skin, 0.88));
    sHair(g, d, dir, { hx: hx, hw: hw, hy: hy, hh: hh, cy: cy, A: A, lag: lag, ey: ey });
    if (side) { // ear: one clean oval with a soft rim, sitting where the face meets the hair
      var EX = 19, EY = ey + 3.5, inE = function (x, y) { var u = (x + 0.5 - EX) / 1.8, v = (y + 0.5 - EY) / 2.4; return u * u + v * v <= 1; }, ER = sh(d.skin, 0.66);
      for (j = Math.floor(EY - 4); j <= EY + 4; j++) for (i = 15; i <= 23; i++) {
        if (inE(i, j)) g.set(i, j, j > EY + 0.5 ? sh(d.skin, 0.9) : d.skin);
        else if (g.get(i, j) && (inE(i - 1, j) || inE(i + 1, j) || inE(i, j - 1) || inE(i, j + 1))) g.set(i, j, ER);
      }
      g.set(19, Math.floor(EY) + 1, sh(d.skin, 0.78));
    }
    // facial accessories
    if (d.beard && !up) {
      g.part(d.hair, function (m) { m.e(dir === 0 ? 16 : hx + 5, hy + hh, dir === 0 ? 7 : 5, 6); m.clip(function (x, y) { return y >= ey + 4; }); });
      for (j = -1; j <= 0; j++) for (i = 0; i < 4; i++) { if (dir === 0) { g.set(9 + i, ey + j, d.brow); g.set(19 + i, ey + j, d.brow); } else g.set(hx + 2 + i, ey + j, d.brow); }
    }
    if (d.moustache && !up) g.part(d.hair, function (m) { if (dir === 0) { m.e(13.5 + gx, ey + 6, 2.7, 1.4); m.e(18.5 + gx, ey + 6, 2.7, 1.4); } else m.r(hx, ey + 5, 4, 2); }, 1, true);
    if (d.glasses && !up) {
      var fr = function (x0, x1) { for (i = x0; i <= x1; i++) { g.set(i, ey - 1, GL); g.set(i, ey + 4, GL); } for (j = ey; j < ey + 4; j++) { g.set(x0, j, GL); g.set(x1, j, GL); } };
      if (dir === 0) { fr(9 + gx, 13 + gx); fr(18 + gx, 22 + gx); for (i = 14; i <= 17; i++) g.set(i + gx, ey + 1, GL); }
      else { fr(hx + 2, hx + 6); for (i = hx + 7; i <= 18; i++) g.set(i, ey + 1, GL); }
    }
    // idle action: props behind hands, posed arms, props in front
    if (spec.back) spec.back(g, P, LATE);
    if (HL) armPose(g, d, sleeve, 'L', HL, P);
    if (HR) armPose(g, d, sleeve, side ? 'S' : 'R', HR, P);
    if (spec.front) spec.front(g, P, LATE);
    // weight shift: upper body leans one pixel over the hips
    if (o.ws) {
      var cut = ly - 3 + g.oy, sx2 = o.ws;
      for (j = 0; j < cut; j++) {
        var row = g.c.slice(j * g.w, (j + 1) * g.w);
        for (i = 0; i < g.w; i++) { var si = i - sx2; g.c[j * g.w + i] = si >= 0 && si < g.w ? row[si] : null; }
      }
    }
    g.outline();
    LATE.forEach(function (p) { g.set(p[0], p[1], p[2]); });
    return g.canvas(1, dir === 3);
  }

  // ---------- portrait (96x96, authored in 48-unit coords at k=2) ----------
  function portraitArt(d) {
    var cv = document.createElement('canvas'); cv.width = cv.height = 96;
    var x = cv.getContext('2d'), i, j;
    for (j = 0; j < 96; j++) for (i = 0; i < 96; i++) {
      var u = i - 47.5, v = j - 47.5, r = Math.sqrt(u * u + v * v); if (r > 47.5) continue;
      var c = d.bg, t = j / 96, dz = ((i >> 1) + (j >> 1)) & 1;
      if (r > 45.5) c = sh(d.bg, 0.62); else if (r > 43) c = sh(d.bg, 0.8);
      else if (t >= 0.76 || (t > 0.62 && dz)) c = sh(d.bg, 0.88);
      else if (t < 0.34 && (u + v < -30 || (dz && u + v < -18))) c = sh(d.bg, 1.14);
      x.fillStyle = c; x.fillRect(i, j, 1, 1);
    }
    var g = new G(96, 96, 0, 0, 2), s = d.skin, hc = d.hair, st = d.style, ey = 20, hl = (st === 'cap' || st === 'hat') ? 16 : 15;
    // back hair
    if (st === 'twintails') g.part(hc, function (m) { m.e(8, 33, 4.5, 10); m.e(40, 33, 4.5, 10); }, 2);
    if (st === 'ponytail') g.part(hc, function (m) { m.e(39, 31, 4.5, 10); }, 2);
    if (st === 'bun') g.part(hc, function (m) { m.e(24, 26, 14.5, 9); m.clip(function (x, y) { return y < 32; }); }, 2);
    // body
    g.part(d.robe || d.dress || d.shirt, function (m) { m.e(24, 56, 20, 16); }, 2);
    if (d.collar) g.part(d.collar, function (m) { m.e(24, 40, 8, 3); m.clip(function (x, y) { return y >= 39; }); });
    if (d.robe) g.part(d.trim, function (m) { for (var k = 0; k < 8; k++) { m.r(20 - k, 40 + k, 2, 1); m.r(26 + k, 40 + k, 2, 1); } }, 1, true);
    if (d.apron) g.part(d.apron, function (m) { m.r(16, 42, 16, 6); m.r(16, 39, 2, 3); m.r(30, 39, 2, 3); });
    if (d.shirt && !d.collar && !d.apron && !d.scarf) g.part(sh(d.shirt, 0.85), function (m) { m.r(23, 42, 2, 6); }, 1, true);
    g.part(sh(s, 0.85), function (m) { m.r(19, 30, 10, 10); });
    if (d.dress) g.part(sh(s, 0.95), function (m) { m.e(24, 39.5, 5, 2.5); m.clip(function (x, y) { return y >= 39; }); }, 1, true);
    if (d.scarf) {
      g.part(d.scarf, function (m) { m.e(24, 38, 12, 4); m.r(28, 40, 5, 8); });
      [39, 44].forEach(function (y) { for (var k = 29; k < 32; k++) g.set(k, y, sh(d.scarf, 1.35)); });
      for (var k = 14; k < 34; k += 3) g.set(k, 38, sh(d.scarf, 1.2));
    }
    // head
    g.part(s, function (m) { m.e(24, 21, 12.5, 12.5); m.e(24, 25, 11, 10); m.e(11.5, 24, 2.2, 3.2); m.e(36.5, 24, 2.2, 3.2); }, 2);
    // eyes
    var eye = function (x0, right) {
      var ex = x0 + 2.5;
      if (d.expr === 'closed') {
        g.part(E, function (m) { m.e(ex, ey + 4.6, 3.2, 2.2); m.cut(function (x, y) { var u = (x - ex) / 3.2, v = (y - ey - 5.5) / 2.2; return u * u + v * v > 1; }); }, 1, true);
        return;
      }
      g.part(WH, function (m) { m.e(ex, ey + 3.4, 3.1, 3.3); }, 1, true);
      g.part(d.eye, function (m) { m.e(ex, ey + 3.6, 2.4, 3); });
      g.part(sh(d.eye, 0.55), function (m) { m.e(ex, ey + 3.6, 2.4, 3); m.cut(function (x, y) { return y < ey + 2.8; }); }, 1, true);
      g.part(E, function (m) { m.e(ex, ey + 3.6, 1.2, 1.7); }, 1, true);
      g.part(sh(d.eye, 1.5), function (m) { m.e(ex, ey + 5.6, 1.3, 0.6); }, 1, true);
      g.part(E, function (m) {
        m.e(ex, ey + 3.2, 3.7, 3.9); m.cut(function (x, y) { var u = (x - ex) / 3.3, v = (y - ey - 3.9) / 3.5; return u * u + v * v > 1 && y < ey + 3; });
        m.r(right ? x0 + 5.5 : x0 - 1.5, ey + 0.5, 1, 1);
      }, 1, true);
      g.part('#ffffff', function (m) { m.e(ex - 1, ey + 2.4, 1, 1); m.e(ex + 1.1, ey + 4.9, 0.45, 0.45); }, 1, true);
      g.part(sh(s, 0.74), function (m) { m.r(x0 + 1, ey + 7, 3, 0.5); }, 1, true);
    };
    eye(14, false); eye(29, true);
    g.set(23, 27, sh(s, 0.8)); g.set(24, 27, sh(s, 0.8));
    // mouth
    var my = d.my || 30;
    if (d.expr === 'grin') {
      g.part(E, function (m) { m.e(24, my + 0.2, 3.8, 3.4); m.cut(function (x, y) { return y >= my; }); m.r(19.5, my - 0.5, 1, 1); m.r(27.5, my - 0.5, 1, 1); }, 1, true);
      g.part('#ffffff', function (m) { m.r(21.5, my + 0.5, 5, 1); }, 1, true);
      g.part('#e06070', function (m) { m.e(24, my + 2.9, 1.9, 1.1); m.cut(function (x, y) { return y < my + 3; }); }, 1, true);
    } else if (d.expr !== 'closed') {
      g.part(E, function (m) { m.e(24, my - 0.6, 3.6, 2.2); m.cut(function (x, y) { var u = (x - 24) / 3.6, v = (y - my + 1.4) / 2.2; return u * u + v * v > 1; }); m.r(20, my - 0.5, 0.5, 0.5); m.r(27.5, my - 0.5, 0.5, 0.5); }, 1, true);
      g.part(sh(s, 0.8), function (m) { m.r(23, my + 2.5, 2, 0.5); }, 1, true);
    }
    // blush & freckles
    [16.5, 31.5].forEach(function (bx) { g.part('#f4a49c', function (m) { m.e(bx, 29.6, 2.7, 1.4); }, 1, true); g.part('#f8bcb0', function (m) { m.e(bx - 0.6, 29.2, 1.2, 0.5); }, 1, true); });
    if (d.freckles) [[15, 27], [17, 28], [30, 28], [32, 27]].forEach(function (p) { g.set(p[0], p[1], sh(s, 0.72)); });
    if (d.stubble) for (j = 29; j <= 35; j++) for (i = 14; i <= 33; i++) if (((i + j) & 1) && g.get(i, j) === s) g.set(i, j, sh(s, 0.86));
    if (d.bandaid) { for (i = 31; i <= 34; i++) { g.set(i, 28, '#f3d6a8'); g.set(i, 29, '#f3d6a8'); } g.set(32, 28, '#d8b080'); g.set(33, 29, '#d8b080'); }
    // front hair
    var base = function (m, sideLen) { m.e(24, 19, 14, 13.5); m.clip(function (x, y) { return y <= hl || ((x <= 12 || x >= 35) && y <= sideLen); }); };
    var bangs = function (m, n, len, x0, x1) {
      x0 = x0 || 11; x1 = x1 || 37; var w = (x1 - x0) / n;
      for (var k = 0; k < n; k++) { var c = x0 + (k + 0.5) * w; for (var y = 0; y <= len + 0.5; y += 0.5) { var h = (1 - y / (len + 1.2)) * w / 2 + 0.2; m.r(c - h, hl + y, Math.max(0.5, 2 * h), 0.5); } }
    };
    var shine = true;
    if (st === 'elder') {
      shine = false;
      g.part(hc, function (m) { m.e(11, 20, 3.5, 6); m.e(37, 20, 3.5, 6); });
      [[17, 11], [18, 11], [16, 12], [19, 10]].forEach(function (p) { g.set(p[0], p[1], sh(s, 1.35)); });
      g.part(hc, function (m) { m.e(24, 36, 12, 10); m.clip(function (x, y) { return y >= 29; }); }, 2);
      g.part(hc, function (m) { m.e(20, 30, 4.5, 2); m.e(28, 30, 4.5, 2); });
    } else if (st === 'cap') {
      shine = false;
      g.part(hc, function (m) { m.e(12, 22, 3, 6); m.e(36, 22, 3, 6); bangs(m, 4, 3, 12, 36); });
      g.part(d.cap, function (m) { m.e(24, 16, 14.5, 11); m.clip(function (x, y) { return y <= 15; }); }, 2);
      g.part(sh(d.cap, 0.75), function (m) { m.e(24, 16.5, 15.5, 2.4); });
      g.part('#ffffff', function (m) { m.e(24, 10, 2.5, 2.5); }, 1, true); g.set(24, 10, d.cap); g.set(23, 9, d.cap);
    } else if (st === 'hat') {
      shine = false;
      g.part(hc, function (m) { m.e(12, 22, 3, 6); m.e(36, 22, 3, 6); bangs(m, 5, 3, 12, 36); });
      g.part(d.cap, function (m) { m.e(24, 12, 11, 9); m.clip(function (x, y) { return y <= 14; }); }, 2);
      g.part(sh(d.cap, 0.6), function (m) { m.r(13, 11, 22, 2); }, 1, true);
      g.part(sh(d.cap, 0.9), function (m) { m.e(24, 15, 22, 3); }, 2);
    } else {
      g.part(hc, function (m) {
        if (st === 'messy') { base(m, 24); bangs(m, 5, 4); m.e(15, 8, 4, 3); m.e(24, 6, 4.5, 3.5); m.e(33, 8, 4, 3); m.r(25, 2, 2, 3); m.r(27, 1, 2, 2); m.e(10, 24, 2, 4); m.e(38, 24, 2, 4); }
        else if (st === 'bun') { base(m, 28); bangs(m, 3, 5, 11, 30); m.e(24, 5, 7, 5); }
        else if (st === 'short') { base(m, 23); bangs(m, 4, 3); }
        else if (st === 'ponytail') { base(m, 26); bangs(m, 4, 4); }
        else if (st === 'twintails') { base(m, 25); bangs(m, 5, 4); }
        else if (st === 'bandana') { base(m, 26); bangs(m, 6, 2); }
      }, 2);
      if (st === 'bun') g.part(d.ties, function (m) { m.r(18, 9, 12, 2); });
      if (st === 'ponytail') g.part(d.ties, function (m) { m.e(39, 22, 2, 1.8); });
      if (st === 'twintails') g.part(d.ties, function (m) { m.e(8, 24, 2.5, 2); m.e(40, 24, 2.5, 2); });
      if (st === 'bandana') {
        shine = false;
        g.part(d.band, function (m) { m.e(24, 18, 14.6, 13.6); m.clip(function (x, y) { return y <= 13; }); m.e(38, 11, 3, 2.5); m.r(37, 13, 2, 6); m.r(39, 13, 2, 5); }, 2);
        for (j = 5; j <= 12; j++) for (i = 11; i <= 37; i++) if ((i + 2 * j) % 6 === 0 && g.get(i, j) === d.band) g.set(i, j, '#fff4e0');
      }
    }
    if (shine) [[15, 10], [16, 9], [17, 9], [18, 9], [19, 10], [28, 9], [29, 9], [30, 10]].forEach(function (p) { if (g.get(p[0], p[1])) g.set(p[0], p[1], sh(hc, 1.45)); });
    // brows (over bangs, anime style)
    var bc = d.brow || sh(hc, 0.6);
    [[14, -1], [29, 1]].forEach(function (b) {
      for (var q = 0; q < 5; q++) {
        var outer = b[1] < 0 ? q === 0 : q === 4, yy = ey - 3 - (d.raised && outer ? 1 : 0);
        g.set(b[0] + q, yy, bc); if (d.beard) g.set(b[0] + q, yy - 1, bc);
      }
    });
    if (d.moustache) g.part(hc, function (m) { m.e(20, 31, 4.2, 1.8); m.e(28, 31, 4.2, 1.8); });
    if (d.glasses) {
      [14, 29].forEach(function (x0) {
        for (var q = x0 - 1; q <= x0 + 5; q++) { g.set(q, ey - 1, GL); g.set(q, ey + 7, GL); }
        for (var yy = ey - 1; yy <= ey + 7; yy++) { g.set(x0 - 1, yy, GL); g.set(x0 + 5, yy, GL); }
        g.set(x0 + 4, ey + 5, '#d8f0ff');
      });
      for (i = 20; i <= 27; i++) g.set(i, ey + 1, GL);
      for (i = 9; i <= 12; i++) { g.set(i, ey + 1, GL); g.set(47 - i, ey + 1, GL); }
    }
    g.outline(2);
    x.drawImage(g.canvas(1, false), 0, 0);
    return cv;
  }

  // ---------- API ----------
  var SPR = {}, POR = {}, SEED = {};
  Object.keys(C).forEach(function (k, i) { var s = Math.sin((i + 1) * 91.7) * 43758.5453; SEED[k] = s - Math.floor(s); });
  var NSPR = 0;
  function frameCanvas(key, dir, f, o) {
    var k = key + dir + f + '|' + [o.br, o.bl, o.sp, o.wl, o.lk, o.ws, o.hl, o.as, o.nd, o.mo, o.ac, o.ap].join(',');
    if (!SPR[k]) { if (++NSPR > 3000) { SPR = {}; NSPR = 1; } SPR[k] = sprite(C[key], dir, f, o); }
    return SPR[k];
  }
  H.chars = {
    data: C,
    keys: Object.keys(C),
    names: Object.keys(C).reduce(function (o, k) { o[k] = C[k].name; return o; }, {}),
    idles: Object.keys(ACT).filter(function (k) { return k !== 'talk'; }),
    // (x,y) = feet centre in logical px. Art is 2x: 56x56 real px drawn into a 28x28 logical box.
    // opts (NPCs): { npc, seed 0..1, idle: action name, talking }
    draw: function (ctx, key, x, y, dir, frame, env, opts) {
      if (!C[key]) key = 'kid';
      dir = (dir | 0) & 3; var f = ((Math.floor(frame || 0) % 4) + 4) % 4, d = C[key];
      var npc = !!(opts && opts.npc), sd = opts && opts.seed != null ? +opts.seed : SEED[key];
      var t = (env && env.t) || 0, wv = (env && !env.indoor && env.wind) || 0, dy = 0;
      var o = { br: 0, bl: 0, sp: 0, wl: 0, lk: 0, ws: 0, hl: 0, as: 0, nd: 0, mo: 0, ac: '', ap: 0 };
      if (f === 0) {
        // breathing (1 real px), blinking at irregular moments, hair/apron lagging the breath
        o.br = Math.sin(t * (1.6 + sd * 0.6) + sd * 6.28) > 0.1 ? 1 : 0;
        var slot = 1.9 + sd * 0.9, bt = t + sd * 13, bi = Math.floor(bt / slot), bh = hsh(bi + sd * 91), bu = bt - bi * slot, bo = bh * (slot - 0.5);
        o.bl = (bh > 0.2 && bu > bo && bu < bo + 0.13) || (bh > 0.78 && bu > bo + 0.26 && bu < bo + 0.38) ? 1 : 0;
        o.hl = o.br ? -1 : 0;
        if (d.apron && wv > 0.35) o.as = o.br;
        if (npc) {
          // glance + weight shift together, at random-feeling moments
          var gp = 2.4 + sd * 1.3, gi = Math.floor((t + sd * 17) / gp), gh = hsh(gi * 3.1 + sd * 33);
          o.lk = gh < 0.5 ? 0 : gh < 0.75 ? -1 : 1;
          if (!d.staff && !d.spear) o.ws = hsh(gi * 5.7 + sd * 7) < 0.45 ? o.lk || 1 : 0;
          if (opts.talking) {
            o.ac = 'talk'; o.ap = Math.floor(t * 1.3 + sd * 5) % 3; o.ws = 0; o.lk = 0;
            o.mo = hsh(Math.floor(t * 7) + sd * 50) > 0.38 ? 1 : 0;
            o.nd = (t * 1.4 + sd * 3) % 2.3 < 0.28 ? 1 : 0;
          } else {
            var per = 6 + sd * 6, dur = 1.6 + sd * 1.4, at = t + sd * 37, ci = Math.floor(at / per), u = at - ci * per;
            var list = opts.idle && ACT[opts.idle] ? [opts.idle] : IDLE[key];
            if (list && u < dur) {
              var nm = list[(ci + Math.floor(sd * 10)) % list.length], A = ACT[nm];
              o.ac = nm; o.ap = A.ph(u / dur, u); o.ws = 0;
              if (A.nd) o.nd = A.nd(o.ap);
              if (A.dy) { dy = A.dy(o.ap); o.br = 0; }
              if (A.still && A.still(o.ap)) o.br = 0;
              if (o.nd) o.lk = 0;
            }
          }
        }
      }
      if (d.scarf) {
        o.wl = wv < 0.35 ? 0 : wv < 0.65 ? 1 : 2;
        o.sp = Math.floor(t * (o.wl ? 9 : 3.5)) & 3;
      }
      ctx.drawImage(frameCanvas(key, dir, f, o), Math.round(x) - 14, Math.round(y) - 27.5 + dy, 28, 28);
    },
    portrait: function (key) {
      if (!POR[key]) POR[key] = portraitArt(C[key] || C.kid);
      return POR[key];
    }
  };
})();
