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

  /* ================= THE GREAT SCHOOLS' HALLS and the cave mouth =================
     Each great school has a hall of its own, on the school's footprint (10 x 6 tiles, the door in the middle of the
     front row, an arched stone doorway) so a map only swaps the type:
       school_grass     Rootwood Hall      plank walls, a green roof overgrown with living branches, a tree through the middle
       school_wind      Gale Loft          pale walls, a tall pale tower with a gallery, kites on lines, a weathervane
       school_water     Deepbell Hall      whitewashed sea hall, a band of blue tiles, a bell tower with the bell in view
       school_electric  the Storm Works    a brick factory hall, a copper roof, two chimneys, coils on the roof
       school_earth     Bedrock Hall       a heavy carved stone front cut into the rock, pillars, grass on the cliff above
       school_fire      the Ember Crucible dark stone, a forge stack with a glowing furnace mouth and a hot chimney lip
     and the cave mouth (cave_mouth, 3 x 2): a rock face with a timbered mine mouth, its opening the doorway tile.
     Each wears its element's crest. Day and night like every building (lit windows from 18:30). */
  var PALE = ['#3a3e4a', '#8a909e', '#b4bac6', '#d2d6e0', '#eef0f4'];
  var BRICK = ['#3a1a16', '#6a2a22', '#94402e', '#b05a40', '#d0806a'];
  var BASALT = ['#121014', '#2a2428', '#3e363a', '#544a4c', '#6e6264'];
  var CARVE = ['#3a2e26', '#7a6a58', '#a08c74', '#bea88c', '#dccab0'];
  var ROCK = ['#2a2626', '#4e4642', '#6e645c', '#8e8478', '#b0a698'];
  var BARK = ['#1e140e', '#3e2a1a', '#5a3e24', '#7a5632', '#9a7044'];
  var LEAF = ['#163a1e', '#24582a', '#357a34', '#4e9c40', '#7cc458'];
  var BRONZE = ['#3a2614', '#6a4a20', '#a07830', '#d0a848', '#f4d88a'];
  ROOF.sky = ['#1a2a3a', '#3a5a7a', '#5a82a8', '#80aacc', '#b8d8f0'];
  ROOF.sea = ['#0c2030', '#164466', '#20628e', '#3484b0', '#6cb8d8'];
  ROOF.copper = ['#162e2a', '#2a5e52', '#3e8a74', '#5eae92', '#e0a066'];
  ROOF.ember = ['#1a0e10', '#3e1a1a', '#5a2622', '#7a3428', '#a24a34'];

  /* a block wall: P = [mortar, shade, base, light, highlight], blocks bw x bh, the right side falls into shade */
  function masonry(c, x0, y0, w, h, P, bw, bh, seed) {
    R(c, x0 - 1, y0 - 1, w + 2, h + 2, OUT);
    for (var Y = 0; Y < h; Y++) {
      var row = Math.floor(Y / bh), off = (row & 1) ? bw >> 1 : 0;
      for (var X = 0; X < w; X++) {
        var bx = (X + off) % bw, blk = Math.floor((X + off) / bw), col;
        if (Y % bh === bh - 1 || bx === 0) col = P[0];
        else {
          col = hash(blk + seed * 13, row + seed) > 0.68 ? P[3] : P[2];
          if (Y % bh === 0) col = P[4];
          else if (bx === bw - 1) col = P[1];
          else if (hash(x0 + X, y0 + Y + seed) > 0.93) col = P[1];
        }
        if (X >= w - 5 && col !== P[0]) col = col === P[4] ? P[2] : P[1];
        R(c, x0 + X, y0 + Y, 1, 1, col);
      }
    }
  }
  /* where a wall meets the ground: a soft dark line and grass growing up against it */
  function foot(c, x0, y, w) {
    R(c, x0, y - 1, w, 1, 'rgba(10,10,20,0.45)');
    for (var X = 0; X < w * 2; X++) {
      var gh = hash(X, 5 + w); if (gh < 0.5) continue;
      var bh = 1 + Math.floor(gh * gh * 6);
      for (var Y = 0; Y < bh; Y++) HP(c, x0 + X / 2, y - Y / 2, Y === bh - 1 ? '#97dc66' : Y > 1 ? '#52a43d' : '#2b672c');
    }
  }
  /* a cone or pyramid roof: rows widen from the tip down to half width hw at ybase */
  function cone(c, cx, ybase, h, hw, P, step) {
    for (var sy = 0; sy < h; sy++) {
      var w = Math.max(1, Math.floor((sy + 1) * hw / h));
      R(c, cx - w - 1, ybase - h + sy, w * 2 + 2, 1, OUT);
      for (var sx = -w; sx < w; sx++) {
        var f = (sx + w) / (w * 2 + 0.01), rr = sy % (step || 4) === (step || 4) - 1;
        var col = rr ? P[1] : (f < 0.25 ? P[4] : (f < 0.6 ? P[3] : (f < 0.85 ? P[2] : P[1])));
        if (!rr && ((sx + sy) % 5 === 0)) col = P[1];
        R(c, cx + sx, ybase - h + sy, 1, 1, col);
      }
    }
  }
  /* the crest shield of a school: two halves, a gold band and the element's sign */
  function crest(c, cx, cy, left, right, sign) {
    R(c, cx - 9, cy - 1, 18, 14, OUT);
    for (var yy = 0; yy < 16; yy++) {
      var hw2 = yy < 9 ? 8 : 8 - (yy - 8);
      if (hw2 <= 0) break;
      R(c, cx - hw2 - 1, cy + yy, hw2 * 2 + 2, 1, OUT);
      R(c, cx - hw2, cy + yy, hw2, 1, left); R(c, cx, cy + yy, hw2, 1, right);
    }
    R(c, cx - 8, cy, 16, 1, '#e8c050');
    EMBLEM[sign](c, cx, cy + 7);
  }
  function px(c, list, col, cx, cy) { c.fillStyle = col; for (var i = 0; i < list.length; i += 2) c.fillRect(cx + list[i], cy + list[i + 1], 1, 1); }
  var EMBLEM = {
    leaf: function (c, x, y) { px(c, [0, -4, -1, -3, 1, -3, -2, -2, 2, -2, -2, -1, 2, -1, -2, 0, 2, 0, -1, 1, 1, 1, 0, 2], '#8ee060', x, y); px(c, [0, -3, 0, -2, 0, -1, 0, 0, 0, 1, 0, 3, 0, 4], '#2a6a2a', x, y); px(c, [-1, -2, -1, -1, 1, -2, 1, -1, -1, 0, 1, 0], '#b8f080', x, y); },
    swirl: function (c, x, y) { px(c, [-3, -1, -3, 0, -3, 1, -2, 2, -1, 2, 0, 2, 1, 1, 1, 0, 0, -1, -1, -1, -2, -3, -1, -3, 0, -3, 1, -3, 2, -2, 3, -1, 3, 0, 3, 1], '#f4fbff', x, y); },
    wave: function (c, x, y) { px(c, [-4, 0, -3, -1, -2, -1, -1, 0, 0, 1, 1, 1, 2, 0, 3, -1, 4, -1, -4, 3, -3, 2, -2, 2, -1, 3, 0, 4, 1, 4, 2, 3, 3, 2, 4, 2, 0, -4, -1, -3, 1, -3, 0, -2], '#e8f6ff', x, y); },
    bolt: function (c, x, y) { px(c, [1, -4, 0, -3, 1, -3, -1, -2, 0, -2, -2, -1, -1, -1, 0, -1, 1, -1, 2, -1, 0, 0, 1, 0, -1, 1, 0, 1, -1, 2, -2, 3, -1, 3, -2, 4], '#ffe040', x, y); },
    mountain: function (c, x, y) { px(c, [0, -3, -1, -2, 0, -2, 1, -2, -2, -1, -1, -1, 0, -1, 1, -1, 2, -1, -3, 0, -2, 0, -1, 0, 0, 0, 1, 0, 2, 0, 3, 0, -4, 1, -3, 1, -2, 1, -1, 1, 0, 1, 1, 1, 2, 1, 3, 1, 4, 1], '#f0b040', x, y); px(c, [0, -3, -1, -2, 0, -2], '#fff4d0', x, y); },
    flame: function (c, x, y) { px(c, [0, -4, 0, -3, 1, -3, -1, -2, 0, -2, 1, -2, -2, -1, -1, -1, 0, -1, 1, -1, 2, -1, -2, 0, -1, 0, 0, 0, 1, 0, 2, 0, -2, 1, -1, 1, 0, 1, 1, 1, 2, 1, -1, 2, 0, 2, 1, 2], '#ffb030', x, y); px(c, [0, -1, 0, 0, -1, 0, 0, 1, 1, 1, 0, 2], '#fff090', x, y); }
  };
  /* the arched stone doorway of a great school, in the hall's own stone, then the door; rune: keystone colours [day, night] */
  function archway(c, Lt, H, night, P, S, rune) {
    var sdx = Math.floor(Lt.fw / 2) * T, adw = 18, ax = sdx + ((T - adw) >> 1), adh = 26, ay = H - 3 - adh;
    R(c, ax - 3, ay - 5, adw + 6, adh + 5, OUT);
    for (var ar = 0; ar < 5; ar++) R(c, ax - 2 + ar, ay - 4 + ar, adw + 4 - ar * 2, 1, ar % 2 ? S[2] : S[3]);
    R(c, ax - 2, ay, 2, adh, S[3]); R(c, ax + adw, ay, 2, adh, S[1]);
    door(c, Lt.fw, H, night, P, true);
    R(c, sdx + 7, ay - 6, 3, 3, night ? rune[1] : rune[0]); R(c, sdx + 8, ay - 5, 1, 1, '#ffffff');
    R(c, ax - 4, H - 3, adw + 8, 2, S[2]); R(c, ax - 4, H - 3, adw + 8, 0.5, S[4]); R(c, ax - 6, H - 1, adw + 12, 1, S[1]);
  }
  /* a tall arched window (factory and hall windows): lit warm at night */
  function tallWindow(c, x, y, w, h, night, frame) {
    R(c, x - 1, y - 3, w + 2, h + 4, OUT);
    for (var yy = -2; yy < h; yy++) for (var xx = 0; xx < w; xx++) {
      if (yy < 0) { var u = (xx + 0.5 - w / 2) / (w / 2); if (yy < -2 + Math.round(u * u * 2)) continue; }
      var f = (yy + 2) / (h + 2), col = night ? (f < 0.5 ? '#ffe49a' : '#ffc866') : (f < 0.35 ? '#8cc0e6' : f < 0.7 ? '#6ea6d6' : '#4a7cb0');
      if (!night && (xx + yy) % 9 === 3) col = '#d8f0ff';
      R(c, x + xx, y + yy, 1, 1, col);
    }
    for (var k = 4; k < h; k += 5) R(c, x, y + k, w, 1, frame);
    R(c, x + (w >> 1), y - 2, 1, h + 2, frame);
    R(c, x - 1, y + h, w + 2, 1, frame);
    if (night) { c.fillStyle = 'rgba(255,190,90,0.15)'; c.fillRect(x - 3, y - 4, w + 6, h + 8); }
  }
  function banner(c, x, y, col, lit, sign) {
    R(c, x - 1, y - 1, 10, 18, OUT); R(c, x, y, 8, 15, col); R(c, x + 1, y, 2, 15, lit);
    R(c, x, y + 15, 3, 2, col); R(c, x + 5, y + 15, 3, 2, col);
    R(c, x - 1, y - 2, 10, 1, WOOD[2]);
    if (sign) EMBLEM[sign](c, x + 4, y + 7);
  }
  function rockMass(c, x0, x1, topAt, yb, seed) {
    for (var X = x0; X < x1; X++) {
      var top = Math.round(topAt(X));
      R(c, X, top - 1, 1, 1, OUT);
      for (var Y = top; Y < yb; Y++) {
        var n = hash((X >> 3) + seed, (Y >> 3)) * 0.55 + hash((X >> 1) + seed * 7, Y >> 1) * 0.45, v = 0.66 - (Y - top) / 300 + (n - 0.5) * 0.5 - (X > x1 - 8 ? 0.15 : 0) + (X < x0 + 6 ? 0.1 : 0);
        if (hash((X >> 3) + seed, (Y + (X >> 3) * 5) >> 3) > 0.85 && (Y & 7) === 0) v = 0.05;
        var col = ROCK[Math.max(0, Math.min(4, Math.floor(v * 5)))];
        R(c, X, Y, 1, 1, col);
      }
      /* grass on the cliff top, with a hanging tuft now and then */
      var gh = 2 + Math.floor(hash(X, seed + 3) * 3);
      for (var g = 0; g < gh; g++) R(c, X, top + g - 1, 1, 1, g === 0 ? '#97dc66' : g === 1 ? '#52a43d' : '#2b672c');
      if (hash(X, seed + 7) > 0.9) R(c, X, top + gh - 1, 1, 3, '#2b672c');
    }
  }
  function leafClump(c, cx, cy, rx, ry, seed) {
    for (var y = -ry - 1; y <= ry + 1; y++) for (var x = -rx - 1; x <= rx + 1; x++) {
      var u = x / rx, v = y / ry, q = u * u + v * v;
      var edge = 1 + (hash(cx + x + seed * 17, cy + y) - 0.5) * 0.35;
      if (q > edge) continue;
      var l = 0.6 - u * 0.25 - v * 0.35 + (hash(((cx + x) >> 1) + seed * 31, (cy + y) >> 1) - 0.5) * 0.5;
      if (q > edge - 0.18 && x > 0 && y > 0) l -= 0.3;
      R(c, cx + x, cy + y, 1, 1, LEAF[Math.max(0, Math.min(4, Math.floor(l * 5)))]);
    }
  }
  function kite(c, ax, ay, kx, ky, s, a, b) {
    /* the line from where it is tied, sagging a little, then the diamond and its bow tail */
    var n = Math.max(Math.abs(kx - ax), Math.abs(ky - ay));
    for (var i = 0; i < n; i += 1) { var t = i / n; R(c, Math.round(ax + (kx - ax) * t), Math.round(ay + (ky - ay) * t + Math.sin(t * Math.PI) * 3), 1, 1, '#4a4a5a'); }
    for (var y = -s - 1; y <= s + 1; y++) { var w = s + 1 - Math.abs(y); R(c, kx - w, ky + y, w * 2 + 1, 1, OUT); }
    for (y = -s; y <= s; y++) { var w2 = s - Math.abs(y); for (var x = -w2; x <= w2; x++) R(c, kx + x, ky + y, 1, 1, (x < 0) === (y < 0) ? a : b); }
    R(c, kx, ky - s, 1, s * 2, '#f4ecd8'); R(c, kx - s, ky, s * 2, 1, '#f4ecd8');
    for (var k = 0; k < 10; k++) R(c, kx + Math.round(Math.sin(k * 0.8) * 1.5), ky + s + 1 + k, 1, 1, '#4a4a5a');
    [[3, a], [6, b], [9, a]].forEach(function (q) { var tx = kx + Math.round(Math.sin(q[0] * 0.8) * 1.5), ty = ky + s + 1 + q[0]; R(c, tx - 2, ty, 2, 1, q[1]); R(c, tx + 1, ty, 2, 1, q[1]); });
  }
  function coil(c, x, y, h) {
    R(c, x - 1, y - 1, 8, h + 2, OUT);
    for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < 6; xx++) R(c, x + xx, y + yy, 1, 1, yy % 2 ? (xx < 2 ? '#e8a868' : xx < 4 ? '#c87a44' : '#9a5430') : '#6a3420');
    R(c, x + 2, y - 3, 2, 3, '#3b4058');
    disc(c, x + 3, y - 6, 3, OUT); disc(c, x + 3, y - 6, 2, '#e0b048'); R(c, x + 2, y - 7, 1, 1, '#fff0a0');
  }
  function chimneyB(c, x, y, w, h, P, hot, night) {
    masonry(c, x, y, w, h, P, 6, 3, 3);
    R(c, x - 2, y - 2, w + 4, 3, OUT); R(c, x - 1, y - 1, w + 2, 1, P[4]); R(c, x - 1, y, w + 2, 1, P[2]);
    R(c, x + 1, y - 1, w - 2, 1, hot ? (night ? '#ffd060' : '#ff9a40') : '#120c0c');
  }

  var HALL = {
    school_grass: function (c, Lt, n, H) {
      var wy = H - Lt.wallH, P = ROOF.green;
      roof(c, 1, Lt.roofTop, 158, wy - Lt.roofTop + 2, P, 7);
      /* living branches over the roof, leaves along them */
      [[6, 60, 70, 46], [154, 64, 100, 44], [20, 96, 60, 80], [140, 98, 104, 84]].forEach(function (b, i) {
        var nn = Math.max(Math.abs(b[2] - b[0]), Math.abs(b[3] - b[1]));
        for (var k = 0; k <= nn; k++) { var t = k / nn, X = Math.round(b[0] + (b[2] - b[0]) * t), Y = Math.round(b[1] + (b[3] - b[1]) * t + Math.sin(t * 6 + i) * 2); R(c, X, Y - 1, 1, 1, OUT); R(c, X, Y, 1, 2, BARK[3]); R(c, X, Y + 2, 1, 1, BARK[1]); }
        for (k = 1; k < 4; k++) leafClump(c, Math.round(b[0] + (b[2] - b[0]) * k / 4), Math.round(b[1] + (b[3] - b[1]) * k / 4) - 1, 4, 3, i * 5 + k);
      });
      /* plank walls on a stone footing */
      R(c, 0, wy, 160, Lt.wallH + 1, OUT);
      for (var Y = 0; Y < Lt.wallH - 5; Y++) for (var X = 1; X < 159; X++) {
        var pl = X % 7, col = pl === 0 ? BARK[1] : pl === 1 ? BARK[4] : (hash(X * 3, Y >> 3) > 0.8 ? BARK[2] : BARK[3]);
        if (X > 153 && col !== BARK[1]) col = BARK[2];
        R(c, X, wy + Y, 1, 1, col);
      }
      R(c, 1, wy, 158, 3, BARK[1]);
      masonry(c, 1, H - 5, 158, 5, ['#1e1e24', '#4a4a54', '#6a6a76', '#8c8c98', '#b0b0bc'], 9, 3, 2);
      Lt.win.forEach(function (w) { windowAt(c, w[0], wy + 12, w[1], w[2], n, true); });
      /* the tree that grows through the hall: a broad trunk, roots spreading round the door, a crown above the roof */
      leafClump(c, 88, 30, 34, 24, 3); leafClump(c, 64, 40, 14, 10, 8); leafClump(c, 114, 38, 15, 10, 9);
      var tx = 72, tw = 32;
      R(c, tx - 1, 44, tw + 2, H - 44, OUT);
      for (Y = 44; Y < H - 3; Y++) {
        var flare = Y > H - 30 ? Math.round((Y - (H - 30)) * 0.4) : 0;
        for (X = tx - flare; X < tx + tw + flare; X++) {
          var u = (X - tx + flare) / (tw + flare * 2), streak = hash(X >> 1, Y >> 4) > 0.7;
          var cc = u < 0.12 ? BARK[4] : u > 0.85 ? BARK[1] : streak ? BARK[2] : BARK[3];
          if ((X + (Y >> 2)) % 9 === 0) cc = BARK[1];
          R(c, X, Y, 1, 1, cc);
        }
        R(c, tx - flare - 1, Y, 1, 1, OUT); R(c, tx + tw + flare, Y, 1, 1, OUT);
      }
      leafClump(c, 88, 26, 26, 16, 5);
      /* round window in a knot of the trunk, the crest below it */
      disc(c, 88, 64, 7, OUT); disc(c, 88, 64, 6, BARK[1]); disc(c, 88, 64, 5, n ? '#ffd27a' : '#6a9ad0');
      R(c, 83, 64, 11, 1, BARK[2]); R(c, 88, 59, 1, 11, BARK[2]);
      crest(c, 88, 82, '#2f6a3a', '#4a8a3a', 'leaf');
      banner(c, 61, wy + 8, '#2f6a3a', '#4e9c40', 'leaf'); banner(c, 108, wy + 8, '#2f6a3a', '#4e9c40', 'leaf');
      archway(c, Lt, H, n, P, BARK, ['#a8f080', '#e8ffa0']);
      foot(c, 1, H, 158);
    },
    school_wind: function (c, Lt, n, H) {
      var wy = H - Lt.wallH;
      wall(c, 1, wy, 158, Lt.wallH, ['#3a4250', '#b4c0cc', '#d4dce6', '#eef2f6'], null);
      roof(c, 1, Lt.roofTop, 158, wy - Lt.roofTop + 2, ROOF.sky, 5);
      Lt.win.forEach(function (w) { windowAt(c, w[0], wy + 12, w[1], w[2], n, false); });
      windowAt(c, 26, Lt.roofTop + 18, 10, 10, n, false); windowAt(c, 124, Lt.roofTop + 18, 10, 10, n, false);
      /* the tall pale tower, rising far over the roof */
      var tx = 74, tw = 28, ty = 46;
      /* kites on lines tied to the eaves and the tower gallery */
      kite(c, 12, Lt.roofTop + 2, 22, 40, 5, '#e0503a', '#f4c040');
      kite(c, 150, Lt.roofTop + 2, 144, 58, 4, '#3aa0a8', '#f4ecd8');
      kite(c, 102, ty + 18, 130, 18, 4, '#8a5ab8', '#f0d070');
      masonry(c, tx, ty, tw, H - 4 - ty, PALE, 7, 4, 5);
      /* the loft gallery: a wooden balcony round the tower */
      R(c, tx - 5, ty + 18, tw + 10, 4, OUT); R(c, tx - 4, ty + 19, tw + 8, 2, WOOD[3]); R(c, tx - 4, ty + 19, tw + 8, 0.5, WOOD[4]);
      for (var k = 0; k < tw + 8; k += 3) R(c, tx - 4 + k, ty + 13, 1, 6, WOOD[2]);
      R(c, tx - 4, ty + 12, tw + 8, 1, WOOD[3]);
      cone(c, 88, ty + 1, 34, 18, ROOF.sky, 4);
      /* the weathervane: a pole, a cross bar, and an arrow with a kite-shaped tail */
      R(c, 87, ty - 46, 2, 13, OUT); R(c, 87.5, ty - 45, 1, 12, '#3a3a4a');
      R(c, 80, ty - 42, 17, 1, '#3a3a4a'); R(c, 79, ty - 43, 2, 3, '#3a3a4a');
      R(c, 96, ty - 44, 1, 5, '#3a3a4a'); R(c, 97, ty - 43, 1, 3, '#3a3a4a'); R(c, 98, ty - 42, 1, 1, '#3a3a4a');
      R(c, 78, ty - 44, 2, 2, '#e0b048'); R(c, 77, ty - 43, 1, 1, '#e0b048'); R(c, 78, ty - 42, 2, 2, '#e0b048');
      disc(c, 88, ty - 34, 1, '#e0b048');
      /* two round windows up the tower, the crest above the door */
      [ty + 34, ty + 58].forEach(function (wy2) {
        disc(c, 88, wy2, 6, OUT); disc(c, 88, wy2, 5, WOOD[3]); disc(c, 88, wy2, 4, n ? '#ffd27a' : '#6a9ad0');
        R(c, 84, wy2, 9, 1, WOOD[2]); R(c, 88, wy2 - 4, 1, 9, WOOD[2]);
      });
      crest(c, 88, ty + 76, '#5a9ac8', '#3a6a9a', 'swirl');
      banner(c, 62, wy + 8, '#5a9ac8', '#9ad0f0', 'swirl'); banner(c, 105, wy + 8, '#5a9ac8', '#9ad0f0', 'swirl');
      archway(c, Lt, H, n, ROOF.sky, PALE, ['#c8ecff', '#ffe08a']);
    },
    school_water: function (c, Lt, n, H) {
      var wy = H - Lt.wallH;
      wall(c, 1, wy, 158, Lt.wallH, ['#3a4250', '#c4ccd4', '#e4eaee', '#f8fafc'], null);
      /* the band of blue tiles along the hall, each with a small white flower */
      var by = wy + 33;
      R(c, 1, by - 1, 158, 1, '#1c3a6a'); R(c, 1, by + 12, 158, 1, '#1c3a6a');
      for (var Y = 0; Y < 12; Y++) for (var X = 1; X < 159; X++) {
        var tx2 = (X - 1) % 6, ty2 = Y % 6, col = '#f4f8fc';
        if (tx2 === 0 || ty2 === 0) col = '#2a5694';
        else if ((tx2 === 3 && ty2 !== 3) || (ty2 === 3 && tx2 !== 3)) col = '#3e78bc';
        else if (tx2 === 3 && ty2 === 3) col = '#e8c050';
        if (X > 153 && col === '#f4f8fc') col = '#c8d4e0';
        R(c, X, by + Y, 1, 1, col);
      }
      roof(c, 1, Lt.roofTop, 158, wy - Lt.roofTop + 2, ROOF.sea, 6);
      Lt.win.forEach(function (w) { windowAt(c, w[0], wy + 12, w[1], w[2], n, false); });
      windowAt(c, 26, 82, 10, 10, n, false); windowAt(c, 124, 82, 10, 10, n, false);
      /* the bell tower: an open belfry with the bronze bell, a blue pyramid roof */
      var tx = 70, tw = 36, ty = 38;
      masonry(c, tx, ty, tw, H - 4 - ty, PALE, 9, 4, 7);
      R(c, tx - 3, ty - 2, tw + 6, 4, OUT); R(c, tx - 2, ty - 1, tw + 4, 2, PALE[3]);
      cone(c, 88, ty - 2, 24, 22, ROOF.sea, 4);
      R(c, 87, ty - 32, 2, 7, OUT); disc(c, 88, ty - 33, 2, '#e8c050');
      var bx = 77, bw = 22, bt = ty + 6, bh = 20;
      R(c, bx - 1, bt - 3, bw + 2, bh + 3, OUT);
      for (Y = -2; Y < bh; Y++) for (X = 0; X < bw; X++) { var u = (X + 0.5 - bw / 2) / (bw / 2); if (Y < 0 && Y < -2 + Math.round(u * u * 2)) continue; R(c, bx + X, bt + Y, 1, 1, n ? '#1a1a2e' : '#1e2a3e'); }
      /* the bell */
      for (Y = 0; Y < 13; Y++) { var hw = 3 + Y * 0.35 + (Y > 10 ? (Y - 10) * 1.2 : 0); for (X = -Math.floor(hw); X <= Math.floor(hw); X++) R(c, 88 + X, bt + 2 + Y, 1, 1, BRONZE[Math.max(0, Math.min(4, Math.round(3 - X / hw * 1.4 - Y / 14)))]); }
      R(c, 87, bt, 2, 2, BRONZE[1]); R(c, 87, bt + 15, 2, 2, '#3b4058');
      R(c, bx, bt + bh - 2, bw, 2, PALE[1]);
      crest(c, 88, ty + 34, '#2a5694', '#20628e', 'wave');
      banner(c, 60, wy + 8, '#20628e', '#3e78bc', null); banner(c, 108, wy + 8, '#20628e', '#3e78bc', null);
      archway(c, Lt, H, n, ROOF.sea, PALE, ['#9ad8ff', '#ffe08a']);
    },
    school_electric: function (c, Lt, n, H) {
      var wy = H - Lt.wallH;
      chimneyB(c, 18, 14, 12, 60, BRICK, false, n); chimneyB(c, 132, 20, 12, 54, BRICK, false, n);
      masonry(c, 1, wy, 158, Lt.wallH, BRICK, 8, 3, 2);
      R(c, 1, wy, 158, 2, BRICK[0]);
      roof(c, 1, Lt.roofTop, 158, wy - Lt.roofTop + 2, ROOF.copper, 4);
      /* bright copper where the rain has worn the green away, along the seams */
      for (var X = 6; X < 156; X += 11) { var len = 6 + Math.floor(hash(X, 3) * 18); for (var Y = 0; Y < len; Y++) if ((Y + X) % 3) R(c, X + (Y > len / 2 ? 1 : 0), Lt.roofTop + 6 + Y, 1, 1, Y % 2 ? '#cc7c48' : '#a85a30'); }
      coil(c, 40, 62, 14); coil(c, 116, 62, 14);
      /* tall factory windows */
      [[14, 14], [38, 14], [110, 14], [134, 14]].forEach(function (w) { tallWindow(c, w[0], wy + 10, w[1], 30, n, '#3a2a22'); });
      /* the central works tower: brick, a flat top with a great coil */
      var tx = 70, tw = 36, ty = 34;
      masonry(c, tx, ty, tw, H - 4 - ty, BRICK, 8, 3, 9);
      R(c, tx - 3, ty - 3, tw + 6, 5, OUT); R(c, tx - 2, ty - 2, tw + 4, 3, '#59607e'); R(c, tx - 2, ty - 2, tw + 4, 1, '#868fb0');
      coil(c, 85, ty - 20, 16);
      /* a round gauge window with a needle */
      disc(c, 88, ty + 18, 9, OUT); disc(c, 88, ty + 18, 8, '#c87a44'); disc(c, 88, ty + 18, 6, n ? '#ffe49a' : '#f0ead8');
      for (var a = 0; a < 8; a++) R(c, Math.round(88 + Math.cos(Math.PI + a * Math.PI / 7) * 5), Math.round(ty + 18 + Math.sin(Math.PI + a * Math.PI / 7) * 5), 1, 1, '#3a2a22');
      R(c, 88, ty + 15, 1, 4, '#c83a2a'); R(c, 89, ty + 14, 1, 2, '#c83a2a');
      crest(c, 88, ty + 36, '#2a3a6a', '#3a4a8a', 'bolt');
      /* pipes along the front */
      R(c, 1, wy + 46, 158, 3, OUT); R(c, 1, wy + 47, 158, 1, '#c87a44'); R(c, 1, wy + 46, 158, 0.5, '#e8a868');
      archway(c, Lt, H, n, ROOF.copper, BRICK, ['#fff0a0', '#ffe060']);
      foot(c, 1, H, 158);
    },
    school_earth: function (c, Lt, n, H) {
      /* the cliff the hall is cut into */
      rockMass(c, 0, 160, function (X) { return 14 + Math.abs(X - 80) * 0.16 + Math.sin(X * 0.11) * 4 + Math.sin(X * 0.37) * 2; }, H, 4);
      [[16, 20], [138, 22], [52, 24]].forEach(function (b, i) { leafClump(c, b[0], b[1], 7, 4, i + 20); });
      /* the carved front: big ashlar blocks, a heavy lintel, pillars */
      var fy = 66;
      masonry(c, 14, fy, 132, H - fy, CARVE, 14, 7, 6);
      /* the overhang of the rock throws a shadow on the lintel */
      R(c, 12, fy - 6, 136, 7, OUT); R(c, 13, fy - 5, 134, 5, CARVE[3]); R(c, 13, fy - 5, 134, 1, CARVE[4]); R(c, 13, fy - 1, 134, 1, CARVE[1]);
      R(c, 13, fy - 7, 134, 1, 'rgba(10,8,8,0.35)');
      for (var X = 15; X < 146; X += 6) { R(c, X, fy - 4, 3, 1, CARVE[1]); R(c, X + 1, fy - 3, 1, 1, CARVE[1]); }
      /* the pediment over the middle, cut into the rock */
      for (var Y = 0; Y < 26; Y++) { var hw = Math.round(Y * 1.6); R(c, 88 - hw - 1, fy - 32 + Y, hw * 2 + 2, 1, OUT); R(c, 88 - hw, fy - 32 + Y, hw * 2, 1, Y % 5 === 4 ? CARVE[1] : (hw > 2 ? CARVE[3] : CARVE[4])); R(c, 88 - hw, fy - 32 + Y, 1, 1, CARVE[4]); R(c, 88 + hw - 1, fy - 32 + Y, 1, 1, CARVE[1]); }
      crest(c, 88, fy - 20, '#8a5a2a', '#a86a2a', 'mountain');
      [26, 60, 116, 150].forEach(function (x) {
        R(c, x - 6, fy, 8, H - fy - 3, OUT); R(c, x - 5, fy, 6, H - fy - 3, CARVE[3]); R(c, x - 5, fy, 1, H - fy - 3, CARVE[4]); R(c, x - 1, fy, 1, H - fy - 3, CARVE[1]);
        R(c, x - 7, fy, 10, 3, CARVE[4]); R(c, x - 7, H - 7, 10, 4, CARVE[2]); R(c, x - 7, H - 7, 10, 1, CARVE[4]);
      });
      /* deep-set windows */
      [[34, 18], [122, 18]].forEach(function (w) { windowAt(c, w[0], fy + 26, w[1], 16, n, false); });
      [[62, 12], [100, 12]].forEach(function (w) { windowAt(c, w[0], fy + 12, w[1], 12, n, false); });
      R(c, 14, H - 12, 132, 1, CARVE[1]);
      archway(c, Lt, H, n, ROOF.brown, CARVE, ['#ffc860', '#ffe08a']);
      foot(c, 14, H, 132);
    },
    school_fire: function (c, Lt, n, H) {
      var wy = H - Lt.wallH;
      masonry(c, 1, wy, 158, Lt.wallH, BASALT, 9, 4, 4);
      roof(c, 1, Lt.roofTop, 158, wy - Lt.roofTop + 2, ROOF.ember, 8);
      Lt.win.forEach(function (w) { windowAt(c, w[0], wy + 12, w[1], w[2], n, false); });
      /* ember slits glowing low in the wall: the forge fires inside */
      [30, 52, 120, 142].forEach(function (x) { R(c, x - 1, H - 13, 6, 4, OUT); R(c, x, H - 12, 4, 2, n ? '#ffb040' : '#e0602a'); R(c, x + 1, H - 12, 2, 1, '#ffe080'); });
      /* the forge stack: a broad stepped block of dark stone, a brick chimney with a hot lip */
      chimneyB(c, 78, 6, 20, 40, BRICK, true, n);
      var tx = 64, tw = 48, ty = 44;
      masonry(c, tx, ty, tw, H - 4 - ty, BASALT, 8, 4, 8);
      R(c, tx - 3, ty - 3, tw + 6, 5, OUT); R(c, tx - 2, ty - 2, tw + 4, 3, BASALT[3]); R(c, tx - 2, ty - 2, tw + 4, 1, BASALT[4]);
      /* the furnace mouth: a great round opening glowing from the fire inside, an iron grate across it */
      var fx = 88, fyc = ty + 30;
      disc(c, fx, fyc, 14, OUT); disc(c, fx, fyc, 13, BRICK[2]); disc(c, fx, fyc, 11, BRICK[1]);
      var G2 = n ? ['#c8401c', '#ff7a2a', '#ffb040', '#ffe080', '#fff8d0'] : ['#8a2a1a', '#c8401c', '#ff7a2a', '#ffb040', '#ffe080'];
      for (var r = 10; r >= 0; r--) disc(c, fx, fyc + 1, r, G2[Math.min(4, Math.floor((10 - r) / 2.2))]);
      for (var k = -8; k <= 8; k += 4) R(c, fx + k, fyc - 9, 1, 19, '#2a2428');
      R(c, fx - 10, fyc + 4, 21, 1, '#2a2428');
      for (k = 0; k < 7; k++) { var a = Math.PI + k * Math.PI / 6; R(c, Math.round(fx + Math.cos(a) * 12), Math.round(fyc + Math.sin(a) * 12), 2, 2, k % 2 ? BRICK[4] : BRICK[3]); }
      crest(c, 88, fyc + 17, '#8a2a1a', '#c8442a', 'flame');
      archway(c, Lt, H, n, ROOF.ember, BASALT, ['#ffa040', '#ffe08a']);
      foot(c, 1, H, 158);
    },
    cave_mouth: function (c, Lt, n, H) {
      /* a rock face, a timbered mine mouth on the doorway tile, the dark going in */
      rockMass(c, 0, 48, function (X) { var u = Math.abs(X - 23.5) / 24; return 4 + Math.pow(u, 3) * 26 + Math.sin(X * 0.4) * 1.5; }, H, 9);
      var ox = 16, ow = 16, oy = H - 30;
      R(c, ox - 1, oy - 1, ow + 2, H - oy + 1, OUT);
      for (var Y = oy; Y < H; Y++) for (var X = ox; X < ox + ow; X++) {
        var d = (Y - oy) / (H - oy), col = d < 0.2 ? '#0a080c' : d < 0.6 ? '#141018' : '#1e1a20';
        R(c, X, Y, 1, 1, col);
      }
      /* the floor running in, a little light on it */
      R(c, ox + 2, H - 4, ow - 4, 4, '#3a322c'); R(c, ox + 4, H - 4, ow - 8, 1, '#4e4642');
      /* the timber frame: two posts and a lintel, a brace each side */
      R(c, ox - 3, oy - 4, ow + 6, 5, OUT); R(c, ox - 2, oy - 3, ow + 4, 3, WOOD[3]); R(c, ox - 2, oy - 3, ow + 4, 1, WOOD[4]);
      [ox - 2, ox + ow - 1].forEach(function (x) { R(c, x - 1, oy, 5, H - oy, OUT); R(c, x, oy, 3, H - oy, WOOD[2]); R(c, x, oy, 1, H - oy, WOOD[4]); R(c, x + 2, oy, 1, H - oy, WOOD[1]); });
      R(c, ox + 3, oy - 2, 2, 1, '#3b4058'); R(c, ox + ow - 5, oy - 2, 2, 1, '#3b4058');
      /* a few loose stones at the foot */
      [[6, H - 3], [40, H - 4], [36, H - 2]].forEach(function (s) { R(c, s[0] - 1, s[1] - 1, 5, 4, OUT); R(c, s[0], s[1], 3, 2, ROCK[3]); R(c, s[0], s[1], 2, 1, ROCK[4]); });
    }
  };

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
      } },
    /* the great schools' halls and the cave mouth (painted whole by HALL[type]) */
    school_grass: { hall: 1, fw: 10, fh: 6, ext: 84, wallH: 56, roofTop: 52, win: [[20, 14, 16], [42, 14, 16], [120, 14, 16], [142, 14, 16]], wide: true },
    school_wind: { hall: 1, fw: 10, fh: 6, ext: 120, wallH: 56, roofTop: 112, win: [[20, 14, 16], [42, 14, 16], [120, 14, 16], [142, 14, 16]], wide: true },
    school_water: { hall: 1, fw: 10, fh: 6, ext: 84, wallH: 56, roofTop: 52, win: [[20, 14, 16], [42, 14, 16], [120, 14, 16], [142, 14, 16]], wide: true },
    school_electric: { hall: 1, fw: 10, fh: 6, ext: 84, wallH: 56, roofTop: 52, win: [], wide: true,
      glow: [[21, 149, 30, '#ffc070'], [45, 149, 30, '#ffc070'], [117, 149, 30, '#ffc070'], [141, 149, 30, '#ffc070'], [88, 52, 22, '#ffe49a']] },
    school_earth: { hall: 1, fw: 10, fh: 6, ext: 84, wallH: 56, roofTop: 52, win: [], wide: true,
      glow: [[43, 100, 30, '#ffc070'], [131, 100, 30, '#ffc070'], [68, 84, 24, '#ffc070'], [106, 84, 24, '#ffc070']] },
    school_fire: { hall: 1, fw: 10, fh: 6, ext: 84, wallH: 56, roofTop: 52, win: [[20, 14, 16], [42, 14, 16], [120, 14, 16], [142, 14, 16]], wide: true,
      glow: [[88, 75, 38, '#ff9040'], [88, 6, 18, '#ffa050']] },
    cave_mouth: { hall: 1, fw: 3, fh: 2, ext: 24, wallH: 0, roofTop: 0, win: [], noDoorLight: true }
  };

  /* ---------- sprite sheets (window.H.sheets, group 'outdoor') ----------
     Key scheme, module 'bld' (cache key = the module's own cache key):
       bld:<type>D, bld:<type>N   the whole building by day / by night (lit windows and door, from 18:30 to
                                  6:00), drawn at half size (the canvas is 2x). Types: house_player house_a
                                  tavern shop school, the halls school_grass school_wind school_water
                                  school_electric school_earth school_fire, and cave_mouth. The tavern and the shop are cached without their sign board.
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
    if (Lt.hall) { HALL[type](c, Lt, night, H); return cv; }
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
    (Lt.glow || []).forEach(function (g) { lights.push({ dx: g[0], dy: g[1] - Lt.ext, r: g[2], color: g[3] }); });
    if (!Lt.noDoorLight) lights.push({ dx: Math.floor(Lt.fw / 2) * T + 8, dy: Lt.fh * T - 12, r: 22, color: '#ffb060' });
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
