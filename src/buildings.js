window.H = window.H || {};
(function () {
  var T = 16;
  function hash(x, y) { var h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function q(v) { return Math.round(v * 2) / 2; }
  function R(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(q(x), q(y), q(w), q(h)); }
  // half-unit pixel (canvases are authored at 2x)
  function HP(c, x, y, col) { c.fillStyle = col; c.fillRect(x, y, 0.5, 0.5); }
  var NOSIGN = false;
  function disc(c, cx, cy, r, col) {
    c.fillStyle = col;
    for (var y = -r; y <= r; y++) { var w = Math.floor(Math.sqrt(r * r - y * y + r * 0.6)); c.fillRect((cx - w) | 0, (cy + y) | 0, w * 2 + 1, 1); }
  }

  var ROOF = {
    red: ['#2a1214', '#6e2826', '#9c3c34', '#c65a48', '#e88c6c'],
    blue: ['#121a30', '#26406c', '#365c94', '#5282bc', '#88b2e0'],
    green: ['#11261a', '#225036', '#326c4a', '#4c9064', '#7cbc88'],
    brown: ['#24130a', '#553018', '#7a4624', '#a06432', '#c88a52'],
    purple: ['#1a1230', '#3a2862', '#563c8c', '#7858b4', '#a888dc'],
    teal: ['#0e2426', '#1c4c50', '#2a6a6c', '#3e8e8c', '#72bcb4']
  };
  var PLASTER = ['#3a2c22', '#bca684', '#d8c8a2', '#eee2c2'];
  var PLASTER_B = ['#2c2a30', '#a8a4b0', '#c6c2cc', '#e2dee8'];
  var WOOD = ['#22140c', '#4e301a', '#6e4628', '#8e6038', '#b08050'];
  var STONE = ['#1e1e24', '#4a4a54', '#6a6a76', '#8c8c98', '#b0b0bc'];
  var OUT = '#1a1014';

  // ---------- parts ----------
  function roof(c, x0, y0, w, h, P, seed) {
    R(c, x0 - 1, y0 - 1, w + 2, h + 2, OUT);
    var W2 = w * 2, H2 = h * 2, TW = 12, TH = 8, RC = 7;
    for (var Y = 0; Y < H2; Y++) {
      var shade = Y / H2;
      for (var X = 0; X < W2; X++) {
        var col;
        if (Y < RC) { // rounded ridge caps catching the sun
          var cx = X % 10;
          col = Y === 0 ? P[2] : Y === 1 ? P[4] : Y === 2 ? '#ffffff' : Y < 5 ? P[3] : Y === 5 ? P[1] : P[0];
          if (Y === 2) col = (cx > 1 && cx < 7) ? P[4] : P[3];
          if (cx === 9 && Y > 0) col = P[1]; if (cx === 0 && Y > 0 && Y < 5) col = P[4];
        } else {
          var yy = Y - RC, row = Math.floor(yy / TH), ly = yy - row * TH, off = (row & 1) ? 6 : 0;
          var lx = (X + off) % TW, ti = Math.floor((X + off) / TW), hv = hash(ti + seed * 7 + 3, row + seed), hv2 = hash(ti + 31, row * 3 + seed);
          var body = hv > 0.9 ? 3 : 2;       // odd weathered / fresh tiles
          if (shade < 0.3 && body < 3 && ((X + Y) & 1 || shade < 0.16)) body++;   // lit near the ridge
          if (shade > 0.78 && body > 1 && ((X + Y) & 1 || shade > 0.9)) body--;   // darker towards the eaves
          col = P[body];
          if (ly === 0) col = (lx > 0 && lx < 9) ? P[Math.min(4, body + 2)] : P[body + 1 > 4 ? 4 : body + 1];
          else if (ly === 1 && lx > 0 && lx < 4) col = P[Math.min(4, body + 1)];
          if (lx === 0) col = P[1];
          if (lx === TW - 1 && ly > 1) col = P[Math.max(1, body - 1)];
          if (ly === TH - 2) col = P[1];
          if (ly === TH - 1) col = P[0];
          if (ly >= TH - 3 && (lx === 0 || lx === TW - 1)) col = P[0];                // scalloped lower corners
          if (ly === TH - 2 && (lx === 1 || lx === TW - 2)) col = P[0];
          if (false && hv2 > 0.93 && ly > 1 && ly < 5 && lx > 3 && lx < 8) col = P[1];         // chipped
          if (hv2 < 0.012 && ly > 2 && ly < 6 && lx > 2 && lx < 9 && shade > 0.4) col = (lx + ly) & 1 ? '#4c8a44' : '#3a6e38'; // moss
        }
        if (X >= W2 - 6 && col !== P[0]) col = (col === P[4] || col === P[3]) ? P[2] : P[1];   // right side in shade
        if (X < 3 && (col === P[2] || col === P[1])) col = P[3];
        HP(c, x0 + X / 2, y0 + Y / 2, col);
      }
    }
    // eave fascia with highlight and deep shadow line
    R(c, x0 - 1, y0 + h - 2.5, w + 2, 2.5, P[0]);
    R(c, x0, y0 + h - 2, w, 1, P[1]); R(c, x0, y0 + h - 2, w - 3, 0.5, P[3]);
    // gable trim
    R(c, x0, y0, 0.5, h - 2, P[4]); R(c, x0 + w - 0.5, y0, 0.5, h - 2, P[0]);
  }

  function wall(c, x0, y0, w, h, PL, beams) {
    R(c, x0 - 1, y0, w + 2, h + 1, OUT);
    R(c, x0, y0, w, h, PL[2]);
    var X, Y, W2 = w * 2, H2 = h * 2;
    for (Y = 0; Y < H2; Y++) for (X = 0; X < W2; X++) {
      var big = hash((X / 14) | 0, (Y / 9) | 0), hv = hash(x0 * 2 + X, y0 * 2 + Y), col = null;
      if (big > 0.62 && ((X + Y) & 1)) col = PL[3];              // soft trowelled patches
      if (big < 0.16 && ((X ^ Y) & 3) === 0) col = PL[1];
      if (hv > 0.985) col = PL[1]; else if (hv > 0.955) col = PL[3];
      if (X >= W2 - 8 && ((X + Y) & 1 || X >= W2 - 4)) col = PL[1]; // right side falls into shade
      if (X < 3) col = PL[3];
      if (col) HP(c, x0 + X / 2, y0 + Y / 2, col);
    }
    // hairline cracks
    for (var k = 0; k < 3; k++) { var kx = x0 + 6 + hash(k, w) * (w - 14), ky = y0 + 9 + hash(w, k) * (h - 24); for (var j = 0; j < 7; j++) HP(c, kx + ((j * 3) >> 2) / 2, ky + j / 2, PL[1]); }
    // under-eave shadow fading down the wall
    R(c, x0, y0, w, 3, PL[1]); R(c, x0, y0, w, 1.5, '#8a765a');
    for (Y = 0; Y < 6; Y++) for (X = 0; X < W2; X++) if (((X + Y) & 1) === 0 && ((X >> 1) + Y) % (2 + (Y >> 1)) === 0) HP(c, x0 + X / 2, y0 + 3 + Y / 2, PL[1]);
    // stone foundation (5 units)
    var fy = y0 + h - 5;
    R(c, x0, fy, w, 5, STONE[1]);
    for (var row = 0; row < 2; row++) {
      var sx = row ? -4 : 0, n = 0;
      while (sx < W2) {
        var sw = 9 + Math.floor(hash(n, row + w) * 6), sc = hash(n + 9, row) > 0.5 ? STONE[2] : STONE[3], y1 = fy + row * 2.5;
        for (Y = 0; Y < 4; Y++) for (X = 0; X < sw - 1; X++) {
          if (sx + X < 0 || sx + X >= W2) continue;
          var cc = sc; if (Y === 0 || X === 0) cc = STONE[4]; if (Y === 3 || X === sw - 2) cc = STONE[1];
          if ((X === 0 || X === sw - 2) && (Y === 0 || Y === 3)) continue;
          if (cc === sc && hash(sx + X, Y + row * 9) > 0.86) cc = STONE[1 + (row ? 1 : 2)];
          HP(c, x0 + (sx + X) / 2, y1 + Y / 2 + 0.5, cc);
        }
        sx += sw; n++;
      }
    }
    R(c, x0, fy, w, 0.5, STONE[0]);
    if (beams) {
      R(c, x0, y0 + 3, w, 3, WOOD[2]); R(c, x0, y0 + 3, w, 0.5, WOOD[4]); R(c, x0, y0 + 3.5, w, 0.5, WOOD[3]); R(c, x0, y0 + 5, w, 1, WOOD[1]); R(c, x0, y0 + 6, w, 0.5, 'rgba(60,40,20,0.35)');
      for (X = 0; X < W2; X += 2) if (hash(X, 77) > 0.6) HP(c, x0 + X / 2, y0 + 4.5, WOOD[1]);
      for (var i = 0; i < beams.length; i++) { post(c, x0 + beams[i], y0 + 6, h - 11); brace(c, x0 + beams[i], y0 + 6, i === 0 ? -1 : 1); }
      post(c, x0, y0 + 3, h - 8); post(c, x0 + w - 3, y0 + 3, h - 8);
      // mid rail under the windows
      R(c, x0 + 3, y0 + h - 9, w - 6, 2, WOOD[2]); R(c, x0 + 3, y0 + h - 9, w - 6, 0.5, WOOD[4]); R(c, x0 + 3, y0 + h - 7.5, w - 6, 0.5, WOOD[1]);
    }
    // ambient occlusion where the wall meets the ground, plus grass growing up against it
    R(c, x0, y0 + h - 1, w, 1, 'rgba(10,10,20,0.45)'); R(c, x0, y0 + h - 1.5, w, 0.5, 'rgba(10,10,20,0.2)');
    for (X = 0; X < W2; X++) {
      var gh = hash(X, 5 + w); if (gh < 0.5) continue;
      var bh = 1 + Math.floor(gh * gh * 6);
      for (Y = 0; Y < bh; Y++) HP(c, x0 + X / 2, y0 + h - 0.5 - Y / 2 + 0.5, Y === bh - 1 ? '#97dc66' : Y > 1 ? '#52a43d' : '#2b672c');
    }
  }
  function post(c, x, y, h) {
    R(c, x, y, 3, h, WOOD[2]); R(c, x, y, 0.5, h, WOOD[4]); R(c, x + 0.5, y, 0.5, h, WOOD[3]); R(c, x + 2, y, 1, h, WOOD[1]); R(c, x + 3, y, 0.5, h, 'rgba(60,40,20,0.3)');
    for (var k = 3; k < h * 2 - 2; k++) if (hash(x * 3 + 1, k >> 2) > 0.72) HP(c, x + 1.5, y + k / 2, WOOD[1]);
    R(c, x + 1, y + 1.5, 0.5, 0.5, OUT); R(c, x + 1, y + h - 2, 0.5, 0.5, OUT);
  }
  function brace(c, x, y, dir) { // diagonal timber brace in the corner of a bay
    for (var k = 0; k < 16; k++) {
      var bx = dir < 0 ? x - 0.5 - k / 2 : x + 3 + k / 2, by = y + k / 2;
      HP(c, bx, by, WOOD[3]); HP(c, bx, by + 0.5, WOOD[2]); HP(c, bx, by + 1, WOOD[2]); HP(c, bx, by + 1.5, WOOD[1]);
    }
  }

  function windowAt(c, x, y, w, h, night, box) {
    if (night) { // warm light spilling on the wall
      R(c, x - 3, y - 3, w + 6, h + 7, 'rgba(255,190,90,0.16)'); R(c, x - 2, y - 2, w + 4, h + 5, 'rgba(255,200,110,0.2)');
    }
    R(c, x - 1, y - 1, w + 2, h + 3, OUT);
    R(c, x, y, w, h, WOOD[3]); R(c, x, y, w, 0.5, WOOD[4]); R(c, x, y, 0.5, h, WOOD[4]); R(c, x + w - 0.5, y, 0.5, h, WOOD[1]);
    var ix = x + 1, iy = y + 1, iw = (w - 2) * 2, ih = (h - 2) * 2;
    for (var yy = 0; yy < ih; yy++) for (var xx = 0; xx < iw; xx++) {
      var col;
      if (night) {
        var d = Math.abs(xx - iw / 2) / iw + Math.abs(yy - ih * 0.55) / ih;
        col = d < 0.22 ? '#fff6cc' : d < 0.4 ? '#ffe49a' : d < 0.6 ? '#ffc866' : '#ee9a3e';
        if (d > 0.4 && d < 0.6 && ((xx + yy) & 1)) col = '#ffd27a';
      } else {
        var f = yy / ih;
        col = f < 0.3 ? '#8cc0e6' : f < 0.55 ? '#6ea6d6' : f < 0.8 ? '#5488bc' : '#3f6c9c';
        if ((f > 0.27 && f < 0.33 || f > 0.52 && f < 0.58) && ((xx + yy) & 1)) col = '#7ab2de';
        var dg = xx + yy;                                   // diagonal glints
        if (dg % 17 === 5 || dg % 17 === 6 || dg % 17 === 7) col = '#d8f0ff'; else if (dg % 17 === 10) col = '#b0d8f4';
        if (yy < 2) col = '#2a4466'; else if (xx < 1) col = '#35557c';
      }
      // curtains gathered at both sides
      var cw = Math.max(0, 5 - (yy >> 2));
      if (xx < cw || xx >= iw - cw) col = night ? ((xx + yy) % 3 === 0 ? '#c8703a' : '#e09050') : ((xx % 3 === 1) ? '#d8c8b8' : '#f4ece0');
      HP(c, ix + xx / 2, iy + yy / 2, col);
    }
    // mullions with a lit edge
    R(c, x + (w >> 1), y, 1, h, WOOD[2]); R(c, x + (w >> 1), y, 0.5, h, WOOD[3]); R(c, x, y + (h >> 1), w, 1, WOOD[2]); R(c, x, y + (h >> 1), w, 0.5, WOOD[3]);
    // sill
    R(c, x - 1.5, y + h, w + 3, 2, OUT); R(c, x - 1, y + h, w + 2, 1.5, WOOD[4]); R(c, x - 1, y + h, w + 2, 0.5, '#d8b080'); R(c, x - 1, y + h + 1, w + 2, 0.5, WOOD[1]);
    R(c, x - 1, y + h + 2, w + 2, 1, 'rgba(40,25,15,0.3)');
    if (box) { // flower box, overflowing
      R(c, x - 1, y + h + 1.5, w + 2, 4, OUT); R(c, x - 0.5, y + h + 2, w + 1, 3, WOOD[2]); R(c, x - 0.5, y + h + 2, w + 1, 0.5, WOOD[4]); R(c, x - 0.5, y + h + 4.5, w + 1, 0.5, WOOD[1]);
      for (var k2 = 0; k2 < w + 1; k2 += 2) R(c, x - 0.5 + k2, y + h + 2.5, 0.5, 2, WOOD[1]);
      var FC = [['#ff8fb4', '#d4507f'], ['#ffe066', '#d39b1f'], ['#ffffff', '#cfd3e6'], ['#ff6a5e', '#b42b2b'], ['#b9a2ff', '#7a5cd0']];
      for (var X2 = -2; X2 < (w + 1) * 2 + 1; X2++) {
        var lh = 2 + Math.floor(hash(X2 + x, 11) * 4);
        for (var L2 = 0; L2 < lh; L2++) HP(c, x - 0.5 + X2 / 2, y + h + 2 - L2 / 2, L2 === lh - 1 ? '#7cc953' : L2 > 0 ? '#3c8a3a' : '#245c2a');
        if (hash(X2 + x, 12) > 0.75) HP(c, x - 0.5 + X2 / 2, y + h + 3 + hash(X2, 4) * 1.2, '#3c8a3a'); // trailing vine
      }
      for (var f2 = 0; f2 < w + 1; f2 += 2.5) {
        var fc = FC[Math.floor(hash(f2 * 2 + x, 13) * FC.length)], fx = x + f2, fy = y + h - 0.5 - hash(f2 * 2, x) * 1.5;
        R(c, fx, fy, 1.5, 1.5, fc[1]); R(c, fx, fy, 1, 1, fc[0]); HP(c, fx + 0.5, fy + 0.5, '#ffd23a'); HP(c, fx, fy, '#ffffff');
      }
    }
  }

  function door(c, fw, H, night, P, wide) {
    var tx = Math.floor(fw / 2) * T;
    var dw = wide ? 14 : 12, dx = tx + ((T - dw) >> 1), dh = 22, dy = H - 3 - dh;
    R(c, dx - 2, dy - 2, dw + 4, dh + 2, OUT);
    R(c, dx - 1, dy - 1, dw + 2, dh + 1, WOOD[3]);
    for (var y = 0; y < dh; y++) for (var x = 0; x < dw; x++) {
      var col = (x % 4 === 0) ? WOOD[1] : (x % 4 === 1 ? WOOD[3] : WOOD[2]);
      if (y < 2 && (x < 2 || x >= dw - 2)) col = OUT;
      R(c, dx + x, dy + y, 1, 1, col);
    }
    R(c, dx, dy + 6, dw, 1, WOOD[1]); R(c, dx, dy + 15, dw, 1, WOOD[1]);
    // small window in door
    R(c, dx + 3, dy + 3, dw - 6, 3, night ? '#ffd27a' : '#5a86b0');
    R(c, dx + dw - 3, dy + 11, 2, 2, '#e8c050'); R(c, dx + dw - 3, dy + 12, 1, 1, '#8a6a20');
    // fine detail: plank highlights, iron hinges, knob shine, shadow under lintel
    for (var px2 = 1; px2 < dw; px2 += 4) R(c, dx + px2, dy + 2, 0.5, dh - 2, WOOD[4]);
    R(c, dx, dy, dw, 1.5, 'rgba(20,10,5,0.4)');
    R(c, dx, dy + 4, 4, 1, '#2c2c34'); R(c, dx, dy + 4, 4, 0.5, '#6a6a76'); R(c, dx, dy + 17, 4, 1, '#2c2c34'); R(c, dx, dy + 17, 4, 0.5, '#6a6a76');
    R(c, dx + dw - 3, dy + 11, 0.5, 0.5, '#fff6c0');
    if (!night) { R(c, dx + 3.5, dy + 3.5, 1.5, 0.5, '#c4e4f8'); R(c, dx + 3.5, dy + 4, 0.5, 1, '#c4e4f8'); } else R(c, dx + 2, dy + 2, dw - 4, 5, 'rgba(255,200,110,0.25)');
    R(c, dx - 4, H - 4, dw + 8, 0.5, 'rgba(10,10,20,0.3)');
    // step
    R(c, dx - 3, H - 3, dw + 6, 3, STONE[3]); R(c, dx - 3, H - 1, dw + 6, 1, STONE[1]); R(c, dx - 3, H - 3, dw + 6, 1, STONE[4]);
    // lintel
    R(c, dx - 2, dy - 3, dw + 4, 2, P ? P[1] : WOOD[1]);
  }

  function chimney(c, x, y, w, h) {
    R(c, x - 1, y - 1, w + 2, h + 1, OUT);
    for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) {
      var row = yy >> 2, bx = (xx + (row & 1) * 3) % 6;
      var col = (yy % 4 === 3 || bx === 0) ? STONE[1] : (hash(xx + (row * 7), row) > 0.6 ? STONE[3] : STONE[2]);
      if (xx >= w - 2) col = col === STONE[1] ? STONE[0] : STONE[1];
      if (xx === 0 && col === STONE[2]) col = STONE[3];
      R(c, x + xx, y + yy, 1, 1, col);
    }
    R(c, x - 2, y - 2, w + 4, 3, OUT); R(c, x - 1, y - 1, w + 2, 1, STONE[4]); R(c, x - 1, y, w + 2, 1, STONE[2]);
    R(c, x + 2, y - 1, w - 4, 1, '#120c0c');
  }

  function lantern(c, x, y, night) {
    R(c, x + 2, y - 3, 1, 3, OUT);
    R(c, x - 1, y - 1, 7, 9, OUT);
    R(c, x, y, 5, 7, night ? '#ff7a4a' : '#d8443a');
    R(c, x + 1, y + 1, 2, 5, night ? '#ffd090' : '#f0705a');
    R(c, x, y + 2, 5, 1, '#8a2020'); R(c, x, y + 5, 5, 1, '#8a2020');
  }

  // ---------- layouts ----------
  // each: fw, fh, ext (px above footprint), wallH, roof palette, windows [x,w,h], beams, extra(c,L,night,H)
  var L = {
    house_player: { fw: 6, fh: 4, ext: 48, wallH: 38, roofTop: 18, roof: 'red', pl: PLASTER, beams: [30, 63], win: [[10, 14, 12], [72, 14, 12]], box: true,
      extra: function (c, L, n, H) { chimney(c, 66, 6, 12, 22); } },
    house_a: { fw: 5, fh: 4, ext: 48, wallH: 38, roofTop: 20, roof: 'blue', pl: PLASTER, beams: [24, 53], win: [[8, 12, 12], [60, 12, 12]], box: true,
      extra: function (c, L, n, H) {
        // small dormer
        var dx = 32, dy = 30; R(c, dx - 1, dy - 5, 18, 17, OUT); roof(c, dx, dy - 4, 16, 6, ROOF.blue, 3);
        R(c, dx + 1, dy + 2, 14, 9, PLASTER[2]); windowAt(c, dx + 4, dy + 3, 8, 6, n, false);
      } },
    tavern: { fw: 8, fh: 5, ext: 48, wallH: 44, roofTop: 14, roof: 'brown', pl: PLASTER, beams: [40, 85], win: [[10, 22, 14], [96, 22, 14]], box: false,
      extra: function (c, L, n, H) {
        var wy = H - L.wallH;
        // second-floor small windows in roof (dormers)
        windowAt(c, 24, 40, 10, 9, n, false); windowAt(c, 94, 40, 10, 9, n, false);
        // noren curtain over door
        var tx = 4 * T; R(c, tx - 3, wy + 9, 22, 1, WOOD[1]);
        for (var i = 0; i < 3; i++) { R(c, tx - 2 + i * 7, wy + 10, 6, 8, '#2a3e6e'); R(c, tx - 2 + i * 7, wy + 10, 6, 1, '#4a64a0'); R(c, tx - 1 + i * 7, wy + 13, 4, 1, '#e8e2d0'); }
        lantern(c, tx - 9, wy + 12, n); lantern(c, tx + 20, wy + 12, n);
        // ramen sign hanging from roof edge
        if (NOSIGN) return;
        var sx = 44, sy = wy - 22;
        R(c, sx + 6, sy - 6, 1, 6, OUT); R(c, sx + 32, sy - 6, 1, 6, OUT);
        R(c, sx - 1, sy - 1, 42, 22, OUT); R(c, sx, sy, 40, 20, WOOD[3]); R(c, sx + 1, sy + 1, 38, 18, '#f0e0b8');
        R(c, sx, sy, 40, 1, WOOD[4]); R(c, sx, sy + 19, 40, 1, WOOD[1]);
        // steam
        R(c, sx + 15, sy + 2, 1, 2, '#b8b0a0'); R(c, sx + 16, sy + 4, 1, 1, '#b8b0a0'); R(c, sx + 20, sy + 1, 1, 3, '#b8b0a0'); R(c, sx + 24, sy + 2, 1, 2, '#b8b0a0'); R(c, sx + 25, sy + 4, 1, 1, '#b8b0a0');
        // chopsticks
        for (var k = 0; k < 9; k++) { R(c, sx + 24 + k, sy + 10 - k, 1, 1, '#8a5a2a'); R(c, sx + 26 + k, sy + 10 - k, 1, 1, '#a86e34'); }
        // bowl
        R(c, sx + 9, sy + 9, 22, 2, '#e8c050'); // broth/noodles
        for (var q = 0; q < 20; q += 3) R(c, sx + 10 + q, sy + 9, 2, 1, '#fff0a0');
        R(c, sx + 13, sy + 8, 4, 2, '#f0a0a8'); R(c, sx + 14, sy + 8, 2, 1, '#fff'); // naruto
        R(c, sx + 22, sy + 8, 3, 2, '#3c7a3a');
        R(c, sx + 8, sy + 11, 24, 2, '#c03a2e'); R(c, sx + 9, sy + 13, 22, 2, '#a02a22'); R(c, sx + 11, sy + 15, 18, 2, '#7a1e1a');
        R(c, sx + 10, sy + 11, 6, 1, '#e86a5a'); R(c, sx + 14, sy + 17, 12, 1, '#5a1410');
      } },
    shop: { fw: 6, fh: 4, ext: 48, wallH: 40, roofTop: 18, roof: 'green', pl: PLASTER, beams: null, win: [[8, 18, 14], [70, 18, 14]], box: false,
      extra: function (c, L, n, H) {
        var wy = H - L.wallH;
        // striped awnings
        [[5, 24], [67, 24]].forEach(function (a) {
          R(c, a[0] - 1, wy + 5, a[1] + 2, 7, OUT);
          for (var x = 0; x < a[1]; x++) { var s = Math.floor(x / 4) & 1; R(c, a[0] + x, wy + 6, 1, 4, s ? '#f2ece0' : '#3c8a5a'); R(c, a[0] + x, wy + 10, 1, 1, s ? '#c8c0b0' : '#24603c'); }
          for (var x2 = 0; x2 < a[1]; x2 += 4) R(c, a[0] + x2 + 1, wy + 11, 2, 1, OUT);
        });
        // sign board on roof eave
        if (NOSIGN) return;
        var sx = 30, sy = wy - 20;
        R(c, sx - 1, sy - 1, 38, 18, OUT); R(c, sx, sy, 36, 16, WOOD[3]); R(c, sx + 2, sy + 2, 32, 12, '#f2e4c0');
        R(c, sx, sy, 36, 1, WOOD[4]);
        // potion
        R(c, sx + 8, sy + 3, 3, 2, '#8a5a2a'); R(c, sx + 8, sy + 5, 3, 2, '#c8e8f0');
        disc(c, sx + 9, sy + 10, 3, '#3a1830'); disc(c, sx + 9, sy + 10, 2, '#d04aa0'); R(c, sx + 8, sy + 9, 1, 1, '#ffc0e8');
        // backpack
        var bx = sx + 20, by = sy + 3;
        R(c, bx, by + 1, 10, 10, OUT); R(c, bx + 1, by + 2, 8, 8, '#c87a32'); R(c, bx + 1, by + 2, 8, 3, '#a85e24');
        R(c, bx + 3, by, 4, 2, OUT); R(c, bx + 4, by + 6, 2, 2, '#e8c050'); R(c, bx + 2, by + 3, 1, 1, '#f0a050'); R(c, bx + 1, by + 9, 8, 1, '#7a4218');
      } },
    school: { fw: 10, fh: 6, ext: 84, wallH: 56, roofTop: 52, roof: 'purple', pl: PLASTER_B, beams: null, win: [[20, 14, 16], [42, 14, 16], [120, 14, 16], [142, 14, 16]], box: false, wide: true,
      extra: function (c, L, n, H) {
        var wy = H - L.wallH;
        // upper row windows in roof face
        windowAt(c, 26, 74, 10, 10, n, false); windowAt(c, 140, 74, 10, 10, n, false);
        // central tower
        var tx = 70, tw = 36, ty = 26, th = H - 4 - ty;
        R(c, tx - 1, ty, tw + 2, th, OUT);
        for (var y = 0; y < th; y++) for (var x = 0; x < tw; x++) {
          var row = y >> 2, bx = (x + (row & 1) * 4) % 8;
          var col = (y % 4 === 3 || bx === 0) ? STONE[2] : (hash(x + row * 3, row) > 0.7 ? STONE[4] : STONE[3]);
          if (x >= tw - 4) col = col === STONE[2] ? STONE[1] : STONE[2];
          if (x < 2) col = STONE[4];
          R(c, tx + x, ty + y, 1, 1, col);
        }
        // battlement band
        R(c, tx - 2, ty, tw + 4, 4, OUT); R(c, tx - 1, ty + 1, tw + 2, 2, STONE[3]);
        // conical spire
        for (var sy = 0; sy < 28; sy++) {
          var hw = Math.floor((sy + 1) * 22 / 28);
          var cx = tx + tw / 2;
          R(c, cx - hw - 1, ty - 28 + sy, hw * 2 + 2, 1, OUT);
          for (var sx = -hw; sx < hw; sx++) {
            var P = ROOF.purple, rr = (sy % 4 === 3), f = (sx + hw) / (hw * 2 + 0.01);
            var col2 = rr ? P[1] : (f < 0.25 ? P[4] : (f < 0.6 ? P[3] : (f < 0.85 ? P[2] : P[1])));
            if (!rr && ((sx + sy) % 5 === 0)) col2 = P[1];
            R(c, cx + sx, ty - 28 + sy, 1, 1, col2);
          }
        }
        // spire finial star
        var fx = tx + tw / 2;
        R(c, fx - 1, ty - 34, 1, 6, OUT); R(c, fx - 2, ty - 37, 3, 3, '#ffd84a'); R(c, fx - 3, ty - 36, 5, 1, '#ffd84a'); R(c, fx - 2, ty - 39, 1, 7, '#ffd84a'); R(c, fx - 2, ty - 36, 1, 1, '#fff6c0');
        // round tower window
        disc(c, fx, ty + 16, 7, OUT); disc(c, fx, ty + 16, 6, WOOD[3]); disc(c, fx, ty + 16, 5, n ? '#ffd27a' : '#6a9ad0');
        R(c, fx - 5, ty + 16, 11, 1, WOOD[2]); R(c, fx, ty + 11, 1, 11, WOOD[2]);
        if (n) disc(c, fx, ty + 16, 2, '#fff2b8'); else { R(c, fx - 3, ty + 13, 2, 1, '#c4e4f8'); R(c, fx - 4, ty + 14, 1, 2, '#c4e4f8'); }
        // crest shield above door
        var cy = ty + 34, cxs = fx;
        R(c, cxs - 9, cy - 1, 18, 14, OUT);
        for (var yy = 0; yy < 16; yy++) {
          var hw2 = yy < 9 ? 8 : 8 - (yy - 8);
          if (hw2 <= 0) break;
          R(c, cxs - hw2 - 1, cy + yy, hw2 * 2 + 2, 1, OUT);
          R(c, cxs - hw2, cy + yy, hw2, 1, '#3a5ab0'); R(c, cxs, cy + yy, hw2, 1, '#8a2a4a');
        }
        R(c, cxs - 8, cy, 16, 1, '#e8c050');
        // crescent + star emblem
        disc(c, cxs, cy + 7, 3, '#ffd84a'); disc(c, cxs + 1, cy + 6, 2, '#3a5ab0'); R(c, cxs + 1, cy + 6, 2, 3, '#8a2a4a');
        R(c, cxs + 3, cy + 4, 1, 1, '#fff6c0');
        // banners on main wall
        [[60, wy + 8], [108, wy + 8]].forEach(function (b) {
          R(c, b[0] - 1, b[1] - 1, 10, 18, OUT); R(c, b[0], b[1], 8, 15, '#563c8c'); R(c, b[0] + 1, b[1], 2, 15, '#7858b4');
          R(c, b[0], b[1] + 15, 3, 2, '#563c8c'); R(c, b[0] + 5, b[1] + 15, 3, 2, '#563c8c');
          R(c, b[0] + 3, b[1] + 5, 2, 2, '#ffd84a'); R(c, b[0] + 2, b[1] + 6, 4, 1, '#ffd84a'); R(c, b[0] - 1, b[1] - 2, 10, 1, WOOD[2]);
        });
      } }
  };

  /* ---------- sprite sheets (window.H.sheets, group 'outdoor') ----------
     Key scheme, module 'bld' (cache key = the module's own cache key):
       bld:<type>D, bld:<type>N   the whole building by day / by night (lit windows and door, from 18:30 to
                                  6:00), drawn at half size (the canvas is 2x). Types: house_player house_a
                                  tavern shop school. The tavern and the shop are cached without their sign board.
       bld:<type>S<D|N><j>        tavern and shop sign board, by day / night, cut into its 4 strips j = 0..3
                                  (each strip swings by its own offset), drawn at half size
     Chosen at draw time: day or night, the sign swing. Stays painted every frame (continuous): the contact
     shadow, the sign chains and the shadow under the board, and the chimney smoke.
     Note: inside this module H is often a local height, so the sheet module is always window.H.sheets.
  */
  var cache = {};
  // sign boards (logical px inside the building canvas): swing separately from the cached building
  var SIGN = { tavern: function (H) { return [43, H - 44 - 23, 42, 22]; }, shop: function (H) { return [29, H - 40 - 21, 38, 18]; } };
  function build(type, night, noSign) {
    var Lt = L[type];
    var W = Lt.fw * T, H = Lt.fh * T + Lt.ext;
    var cv = document.createElement('canvas'); cv.width = W * 2; cv.height = H * 2;
    var c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.scale(2, 2);
    var wy = H - Lt.wallH;
    var P = ROOF[Lt.roof];
    NOSIGN = !!noSign;
    wall(c, 1, wy, W - 2, Lt.wallH, Lt.pl, Lt.beams);
    roof(c, 1, Lt.roofTop, W - 2, wy - Lt.roofTop + 2, P, type.length);
    // soft shadow the eave throws on the wall
    R(c, 1, wy + 2, W - 2, 0.5, 'rgba(30,20,20,0.35)');
    for (var i = 0; i < Lt.win.length; i++) { var w = Lt.win[i]; windowAt(c, w[0], wy + 12, w[1], w[2], night, Lt.box); }
    door(c, Lt.fw, H, night, P, Lt.wide);
    if (Lt.extra) Lt.extra(c, Lt, night, H);
    if (type === 'school') {
      // the tower is drawn over the wall, so give it its own arched stone doorway at the base
      var sdx = Math.floor(Lt.fw / 2) * T, adw = 18, ax = sdx + ((T - adw) >> 1), adh = 26, ay = H - 3 - adh;
      R(c, ax - 3, ay - 5, adw + 6, adh + 5, OUT);
      for (var ar = 0; ar < 5; ar++) R(c, ax - 2 + ar, ay - 4 + ar, adw + 4 - ar * 2, 1, ar % 2 ? '#9a96a8' : '#c8c4d4');
      R(c, ax - 2, ay, 2, adh, '#b0acbc'); R(c, ax + adw, ay, 2, adh, '#8a8698');
      door(c, Lt.fw, H, night, P, true);
      // glowing keystone rune
      R(c, sdx + 7, ay - 6, 3, 3, night ? '#ffe08a' : '#d0b0ff'); R(c, sdx + 8, ay - 5, 1, 1, '#ffffff');
      // two stone steps
      R(c, ax - 4, H - 3, adw + 8, 2, '#a8a4b4'); R(c, ax - 4, H - 3, adw + 8, 0.5, '#d8d4e4'); R(c, ax - 6, H - 1, adw + 12, 1, '#8a8698');
    }
    NOSIGN = false;
    return cv;
  }
  function sheets() { return window.H && window.H.sheets; }
  function recOn() { var S = sheets(); return !!(S && S.recording); }
  function get(type, night) {
    var k = type + (night ? 'N' : 'D');
    if (cache[k]) return cache[k];
    cache[k] = build(type, night, !!SIGN[type]);
    if (recOn()) sheets().rec('outdoor', 'bld:' + k, cache[k]);
    return cache[k];
  }
  var NSTRIP = 4;
  /* the sign board cut into its NSTRIP strips (2x canvases), painted from a full building with the board */
  function getSign(type, night) {
    var k = type + (night ? 'SN' : 'SD');
    if (cache[k]) return cache[k];
    var Lt = L[type], H = Lt.fh * T + Lt.ext, r = SIGN[type](H), full = build(type, night, false);
    var sh2 = r[3] * 2 / NSTRIP, strips = [];
    for (var j = 0; j < NSTRIP; j++) {
      var cv = document.createElement('canvas'); cv.width = r[2] * 2; cv.height = sh2;
      cv.getContext('2d').drawImage(full, r[0] * 2, r[1] * 2 + j * sh2, r[2] * 2, sh2, 0, 0, r[2] * 2, sh2);
      strips.push(cv);
      if (recOn()) sheets().rec('outdoor', 'bld:' + k + j, cv);
    }
    return (cache[k] = strips);
  }
  /* sheet keys and paint functions, built once: BK[type][night], SK[type][night][j] */
  var BK = {}, BP = {}, SK = {}, SP = {};
  function bPaint(type, night) { return function () { return get(type, night); }; }
  function sPaint(type, night, j) { return function () { var s = getSign(type, night); return s && s[j]; }; }
  Object.keys(L).forEach(function (type) {
    BK[type] = ['bld:' + type + 'D', 'bld:' + type + 'N'];
    BP[type] = [bPaint(type, false), bPaint(type, true)];
    if (!SIGN[type]) return;
    SK[type] = [[], []]; SP[type] = [[], []];
    for (var n = 0; n < 2; n++) for (var j = 0; j < NSTRIP; j++) {
      SK[type][n].push('bld:' + type + (n ? 'SN' : 'SD') + j);
      SP[type][n].push(sPaint(type, !!n, j));
    }
  });
  (function () {
    var S = sheets();
    if (!S) return;
    try {
      S.enumerate('outdoor', function () {
        Object.keys(L).forEach(function (type) {
          get(type, false); get(type, true);
          if (SIGN[type]) { getSign(type, false); getSign(type, true); }
        });
      });
      /* once a sheet is in, drop painted copies that the sheet now answers */
      S.onLoad(function (group) {
        if (group !== 'outdoor') return;
        Object.keys(L).forEach(function (type) {
          for (var n = 0; n < 2; n++) {
            var k = type + (n ? 'N' : 'D');
            if (cache[k] && S.has(BK[type][n])) delete cache[k];
            if (!SIGN[type]) continue;
            var ks = type + (n ? 'SN' : 'SD'), all = true;
            for (var j = 0; j < NSTRIP; j++) if (!S.has(SK[type][n][j])) all = false;
            if (cache[ks] && all) delete cache[ks];
          }
        });
      });
    } catch (e) { /* sheets are optional */ }
  })();

  var info = {};
  Object.keys(L).forEach(function (k) {
    var Lt = L[k], H = Lt.fh * T + Lt.ext, wy = H - Lt.wallH, lights = [];
    Lt.win.forEach(function (w) { lights.push({ dx: w[0] + (w[1] >> 1), dy: wy + 12 + (w[2] >> 1) - Lt.ext, r: 30, color: '#ffc070' }); });
    lights.push({ dx: Math.floor(Lt.fw / 2) * T + 8, dy: Lt.fh * T - 12, r: 22, color: '#ffb060' });
    if (k === 'tavern') { lights.push({ dx: 59, dy: wy + 16 - Lt.ext, r: 18, color: '#ff7040' }); lights.push({ dx: 86, dy: wy + 16 - Lt.ext, r: 18, color: '#ff7040' }); }
    if (k === 'school') lights.push({ dx: 88, dy: 42 - Lt.ext, r: 26, color: '#ffd27a' });
    /* still: false for every building: the windows light up at night (and the tavern and shop signs swing,
       the player's chimney smokes), so none is a pure function of its type */
    info[k] = { fw: Lt.fw, fh: Lt.fh, solid: true, still: false, lights: lights };
  });

  function isNight(env) { var h = env && env.time != null ? env.time : 12; return h >= 18.5 || h < 6; }

  function smoke(ctx, x, y, env) {
    var t = env && env.t || 0, wind = env && env.wind != null ? env.wind : 0.2;
    if (env && env.weather === 'wind') wind = Math.max(wind, 0.6);
    for (var i = 0; i < 8; i++) {
      var ph = (t * 0.3 + i / 8) % 1;
      var sx = q(x + Math.sin(t * 1.3 + i * 2.1) * (1 + ph * 2) + ph * ph * wind * 30);
      var sy = q(y - ph * 36);
      var r = 1.5 + ph * 4;
      ctx.globalAlpha = 0.5 * (1 - ph) * Math.min(1, ph * 8);
      puff(ctx, sx, sy, r, '#77737f');
      puff(ctx, sx - 0.5, sy - 0.5, r - 0.5, '#a8a4b0');
      puff(ctx, sx - 1, sy - 1, Math.max(0.5, r - 1.5), '#dcd8e0');
    }
    ctx.globalAlpha = 1;
  }
  function puff(ctx, cx, cy, r, col) {
    ctx.fillStyle = col;
    for (var y = -r; y <= r; y += 0.5) { var w = q(Math.sqrt(Math.max(0, r * r - y * y))); if (w > 0) ctx.fillRect(cx - w, cy + y, w * 2, 0.5); }
  }

  function draw(ctx, type, px, py, env) {
    var Lt = L[type]; if (!Lt) return;
    var night = isNight(env), S = sheets(), ni = night ? 1 : 0;
    var W = Lt.fw * T, H = Lt.fh * T + Lt.ext, x0 = Math.round(px), y0 = Math.round(py - Lt.ext);
    // contact shadow on the ground along the base
    ctx.fillStyle = 'rgba(10,20,10,0.28)'; ctx.fillRect(x0 + 1, y0 + H, W - 1, 1);
    ctx.fillStyle = 'rgba(10,20,10,0.13)'; ctx.fillRect(x0 + 2, y0 + H + 1, W - 1, 1); ctx.fillRect(x0 + W, y0 + H - 6, 1, 7);
    if (S) S.draw(ctx, BK[type][ni], x0, y0, BP[type][ni], W, H);
    else ctx.drawImage(get(type, night), x0, y0, W, H);
    if (SIGN[type]) {
      var r = SIGN[type](H), t = env && env.t || 0, wind = env && env.wind != null ? env.wind : 0.2;
      if (env && env.weather === 'wind') wind = Math.max(wind, 0.6);
      var sw = Math.sin(t * 2.1 + px * 0.05) * (0.4 + wind * 1.6) + Math.sin(t * 0.7) * wind * 0.6, n = NSTRIP, sh = r[3] / n;
      var sx = x0 + r[0], sy = y0 + r[1];
      // chains from the eave down to the board
      ctx.fillStyle = OUT;
      for (var k = 0; k < 10; k++) { var u = k / 10, ox = q(sw * 0.25 * u); ctx.fillRect(sx + 7 + ox, sy - 5 + k * 0.5, 0.5, 0.5); ctx.fillRect(sx + r[2] - 8 + ox, sy - 5 + k * 0.5, 0.5, 0.5); }
      ctx.fillStyle = 'rgba(20,10,10,0.3)'; ctx.fillRect(sx + 2 + q(sw), sy + r[3], r[2] - 2, 1);   // shadow under the board
      var sg = S ? null : getSign(type, night);
      for (var j = 0; j < n; j++) {
        var jx = sx + q(sw * (0.25 + 0.75 * j / (n - 1))), jy = sy + j * sh;
        if (S) S.draw(ctx, SK[type][ni][j], jx, jy, SP[type][ni][j], r[2], sh);
        else if (sg && sg[j]) ctx.drawImage(sg[j], jx, jy, r[2], sh);
      }
    }
    if (type === 'house_player') smoke(ctx, x0 + 72, y0 + 3, env);
  }

  H.buildings = { info: info, draw: draw };
})();
