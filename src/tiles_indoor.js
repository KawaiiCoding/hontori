window.H = window.H || {};
// Indoor tiles, authored at double resolution: every tile is a cached 32x32 canvas
// blitted into a 16x16 logical cell (the engine renders on a 2x canvas).
(function () {
  var T = 16, S = 32;
  var cache = {};

  function hash(x, y, s) {
    var h = (x * 374761393 + y * 668265263 + (s || 0) * 2147483647) | 0;
    h = (h ^ (h >>> 13)) * 1274126177 | 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function mk() {
    var c = document.createElement('canvas');
    c.width = S; c.height = S;
    return c;
  }
  function P(g, col, x, y, w, h) { g.fillStyle = col; g.fillRect(x, y, w || 1, h || 1); }

  function isWall(id) { return id === 'wall'; }

  // soft dithered shadow cast by a wall above onto the floor
  function wallShadow(g, on) {
    if (!on) return;
    var a = [0.46, 0.40, 0.34, 0.28, 0.22, 0.17, 0.12, 0.08];
    for (var i = 0; i < 8; i++) { g.fillStyle = 'rgba(30,12,4,' + a[i] + ')'; g.fillRect(0, i, S, 1); }
    g.fillStyle = 'rgba(30,12,4,0.08)';
    for (var x = 0; x < S; x += 2) { g.fillRect(x, 8, 1, 1); g.fillRect(x + 1, 9, 1, 1); }
    for (x = 0; x < S; x += 4) g.fillRect(x, 10, 1, 1);
  }

  // ---------- wood floor: long planks, fine grain, staggered butt joints ----------
  function drawWood(g, tx, ty, shadow) {
    var pal = [
      ['#b07443', '#cf9159', '#8c5732', '#9c6539'],
      ['#a86c3d', '#c68850', '#86522e', '#955f35'],
      ['#b97d4a', '#d79a61', '#935c35', '#a56d3f'],
      ['#a0663a', '#be804b', '#80502c', '#8d5a32']
    ];
    var seam = '#4a2c17';
    for (var p = 0; p < 4; p++) {
      var y0 = p * 8, gy = ty * 4 + p;
      var off = Math.floor(hash(0, gy, 3) * 48);
      var len = 44 + Math.floor(hash(1, gy, 5) * 20);
      for (var x = 0; x < S; x++) {
        var gx = tx * S + x + off;
        var idx = Math.floor(gx / len), lx = gx % len;
        var c = pal[Math.floor(hash(idx, gy, 11) * 4)];
        P(g, c[0], x, y0, 1, 8);
        P(g, c[1], x, y0, 1, 1);
        P(g, c[2], x, y0 + 6, 1, 1);
        P(g, seam, x, y0 + 7, 1, 1);
        // grain: thin broken lines running along the plank
        for (var row = 2; row <= 5; row++) {
          if (hash(idx * 5 + row, gy, 17) < 0.6) {
            var seg = hash(Math.floor((gx + row * 7) / (5 + row)), gy * 9 + row, 19);
            if (seg < 0.55) P(g, c[3], x, y0 + row);
            else if (seg > 0.93) P(g, c[1], x, y0 + row);
          }
        }
        if (lx === 0) P(g, seam, x, y0, 1, 7);
        else if (lx === 1) P(g, c[1], x, y0 + 1, 1, 5);
        else if (lx === len - 1) P(g, c[2], x, y0 + 1, 1, 6);
        else if (lx === 3 || lx === len - 4) { P(g, seam, x, y0 + 2); P(g, seam, x, y0 + 5); } // nail heads
        // knot
        if (hash(idx, gy, 29) < 0.3) {
          var kx = 8 + Math.floor(hash(idx, gy, 23) * (len - 20)), d = lx - kx;
          if (d === 0 || d === 3) P(g, c[2], x, y0 + 3, 1, 2);
          else if (d === 1 || d === 2) { P(g, c[2], x, y0 + 2); P(g, c[2], x, y0 + 5); P(g, d === 1 ? seam : '#6a3e22', x, y0 + 3, 1, 2); }
        }
      }
    }
    wallShadow(g, shadow);
  }

  // ---------- kitchen tile: glazed checker with bevels and soft specular ----------
  function drawTile(g, tx, ty, shadow) {
    var grout = '#8e8070';
    var A = ['#efe4cc', '#fdf6e6', '#d4c8ad', '#bdb095', '#e7dbc1'];   // cream
    var B = ['#7fa38a', '#a0c4aa', '#648870', '#527260', '#77997f'];   // sage
    P(g, grout, 0, 0, S, S);
    for (var j = 0; j < 2; j++) for (var i = 0; i < 2; i++) {
      var gx = tx * 2 + i, gy = ty * 2 + j;
      var c = ((gx + gy) & 1) ? B : A;
      var x0 = i * 16, y0 = j * 16, k;
      P(g, c[0], x0 + 1, y0 + 1, 15, 15);
      // glaze mottling (low contrast)
      for (k = 0; k < 14; k++) P(g, c[4], x0 + 3 + Math.floor(hash(gx * 17 + k, gy, 31) * 11), y0 + 3 + Math.floor(hash(gx, gy * 13 + k, 37) * 11), 2, 1);
      // bevel
      P(g, c[1], x0 + 1, y0 + 1, 15, 1); P(g, c[1], x0 + 1, y0 + 1, 1, 15);
      P(g, c[2], x0 + 15, y0 + 2, 1, 14); P(g, c[2], x0 + 2, y0 + 15, 14, 1);
      P(g, c[3], x0 + 15, y0 + 15); P(g, c[4], x0 + 14, y0 + 3, 1, 11); P(g, c[4], x0 + 3, y0 + 14, 11, 1);
      // diagonal specular streaks
      for (k = 0; k < 4; k++) P(g, 'rgba(255,255,255,0.55)', x0 + 3 + k, y0 + 6 - k);
      for (k = 0; k < 2; k++) P(g, 'rgba(255,255,255,0.35)', x0 + 4 + k, y0 + 9 - k);
      // occasional hairline crack / chip
      var cr = hash(gx, gy, 41);
      if (cr < 0.025) for (k = 0; k < 6; k++) P(g, c[3], x0 + 6 + k, y0 + 8 + ((k * 2 / 3) | 0));
      else if (cr > 0.95) P(g, grout, x0 + 14, y0 + 14, 2, 2);
    }
    // grout depth: dark hairline on the lit side of each joint
    g.fillStyle = 'rgba(50,36,24,0.30)';
    g.fillRect(0, 0, S, 1); g.fillRect(0, 16, S, 1); g.fillRect(0, 0, 1, S); g.fillRect(16, 0, 1, S);
    wallShadow(g, shadow);
  }

  // ---------- rug: calm twill field, medallions, patterned border ----------
  function drawRug(g, tx, ty, e, shadow) {
    var base = '#a43039', baseD = '#972a33', baseL = '#b23c42', deep = '#84222c';
    var gold = '#e0a948', goldL = '#f6d47c', goldD = '#b47f2c', navy = '#2c3a5e', navyL = '#40507c', cream = '#f2dcb0', edge = '#3e1014';
    var gx0 = tx * S, gy0 = ty * S, x, y, d;
    P(g, base, 0, 0, S, S);
    for (y = 0; y < S; y++) for (x = 0; x < S; x++) {
      var gx = gx0 + x, gy = gy0 + y;
      if (((gx + gy) & 3) === 0) P(g, baseD, x, y);
      else if (((gx + gy) & 3) === 2 && (gy & 1)) P(g, baseL, x, y);
    }
    if (((tx + ty) & 1) === 0) {
      // diamond medallion
      for (y = 0; y < S; y++) for (x = 0; x < S; x++) {
        d = Math.abs(x - 15.5) + Math.abs(y - 15.5);
        if (d < 3) P(g, navy, x, y);
        else if (d < 5) P(g, cream, x, y);
        else if (d < 6) P(g, navy, x, y);
        else if (d < 10) { if (((x + y) & 1) === 0) P(g, deep, x, y); }
        else if (d < 12) P(g, (x < 16 && y < 16) ? goldL : gold, x, y);
        else if (d < 13) P(g, goldD, x, y);
      }
      P(g, gold, 15, 15, 2, 2);
      P(g, gold, 15, 0, 2, 2); P(g, gold, 15, 30, 2, 2); P(g, gold, 0, 15, 2, 2); P(g, gold, 30, 15, 2, 2);
    } else {
      // small floret
      for (y = 8; y < 24; y++) for (x = 8; x < 24; x++) {
        d = Math.abs(x - 15.5) + Math.abs(y - 15.5);
        if (d < 2) P(g, cream, x, y);
        else if (d < 4) P(g, navy, x, y);
        else if (d < 5) P(g, gold, x, y);
      }
      P(g, navyL, 15, 8, 2, 3); P(g, navyL, 15, 21, 2, 3); P(g, navyL, 8, 15, 3, 2); P(g, navyL, 21, 15, 3, 2);
      P(g, gold, 6, 6, 2, 2); P(g, gold, 24, 6, 2, 2); P(g, gold, 6, 24, 2, 2); P(g, gold, 24, 24, 2, 2);
    }

    function hband(y0, dir) {
      for (var k = 1; k <= 6; k++) P(g, navy, 0, y0 + k * dir, S, 1);
      for (var xx = 0; xx < S; xx++) {
        var m = (gx0 + xx) & 7, tri = m < 4 ? m : 7 - m;
        P(g, gold, xx, y0 + (2 + tri) * dir);
        if (m === 0) P(g, cream, xx, y0 + 5 * dir); else if (m === 4) P(g, navyL, xx, y0 + 2 * dir);
      }
      P(g, goldL, 0, y0 + 7 * dir, S, 1); P(g, goldD, 0, y0 + 8 * dir, S, 1); P(g, deep, 0, y0 + 9 * dir, S, 1);
      P(g, edge, 0, y0, S, 1);
    }
    function vband(x0, dir) {
      for (var k = 1; k <= 6; k++) P(g, navy, x0 + k * dir, 0, 1, S);
      for (var yy = 0; yy < S; yy++) {
        var m = (gy0 + yy) & 7, tri = m < 4 ? m : 7 - m;
        P(g, gold, x0 + (2 + tri) * dir, yy);
        if (m === 0) P(g, cream, x0 + 5 * dir, yy); else if (m === 4) P(g, navyL, x0 + 2 * dir, yy);
      }
      P(g, goldL, x0 + 7 * dir, 0, 1, S); P(g, goldD, x0 + 8 * dir, 0, 1, S); P(g, deep, x0 + 9 * dir, 0, 1, S);
      P(g, edge, x0, 0, 1, S);
    }
    if (!e.l) vband(0, 1);
    if (!e.r) vband(31, -1);
    if (!e.u) hband(0, 1);
    if (!e.d) hband(31, -1);
    function corner(x0, y0) {
      P(g, edge, x0, y0, 10, 10); P(g, navy, x0 + 1, y0 + 1, 8, 8);
      P(g, gold, x0 + 3, y0 + 3, 4, 4); P(g, goldL, x0 + 3, y0 + 3, 4, 1); P(g, cream, x0 + 4, y0 + 4, 2, 2);
      P(g, goldD, x0 + 1, y0 + 1); P(g, goldD, x0 + 8, y0 + 1); P(g, goldD, x0 + 1, y0 + 8); P(g, goldD, x0 + 8, y0 + 8);
    }
    if (!e.l && !e.u) corner(0, 0);
    if (!e.r && !e.u) corner(22, 0);
    if (!e.l && !e.d) corner(0, 22);
    if (!e.r && !e.d) corner(22, 22);
    // fringe tassels on the short ends
    var fy;
    if (!e.l) for (fy = 0; fy < S; fy++) P(g, (fy & 3) < 2 ? cream : '#b89868', 0, fy, 2, 1);
    if (!e.r) for (fy = 0; fy < S; fy++) P(g, (fy & 3) < 2 ? cream : '#b89868', 30, fy, 2, 1);
    // pile thickness: lit top edge, shaded bottom edge
    if (!e.u) { g.fillStyle = 'rgba(255,220,190,0.25)'; g.fillRect(0, 1, S, 1); }
    if (!e.d) { g.fillStyle = 'rgba(20,5,5,0.45)'; g.fillRect(0, 31, S, 1); g.fillStyle = 'rgba(20,5,5,0.2)'; g.fillRect(0, 30, S, 1); }
    wallShadow(g, shadow);
  }

  // ---------- wall: striped damask wallpaper, crown molding, panelled wainscot ----------
  var MOTIF = ['...X...', '..XXX..', '.X.X.X.', 'XX.o.XX', '.XXoXX.', '..XXX..', '...X...', '..LXL..', '...L...'];
  function drawWall(g, tx, ty, top, bottom) {
    var paper = '#d9a77c', paperL = '#e6b98f', paperD = '#c8946a', stripe = '#bd8860';
    var mo = '#bf8660', rose = '#a8504a', leaf = '#8a9058', dot = '#f0d2ab';
    var x, y, m;
    P(g, paper, 0, 0, S, S);
    for (x = 0; x < S; x++) {
      m = x & 15;
      if (m === 0) P(g, stripe, x, 0, 1, S);
      else if (m === 1) P(g, paperD, x, 0, 1, S);
      else if (m === 2 || m === 15) P(g, paperL, x, 0, 1, S);
    }
    // faint paper fibre
    for (y = 0; y < S; y++) for (x = 0; x < S; x++) {
      m = x & 15;
      if (m > 2 && m < 15) { var hv = hash(x + (tx & 1) * 32, y, 51); if (hv < 0.035) P(g, paperL, x, y); else if (hv > 0.975) P(g, paperD, x, y); }
    }
    // damask sprig between the stripes, staggered column to column
    for (var col = 0; col < 2; col++) {
      var cx = col * 16 + 8, cy = col ? 22 : 6, oy = col ? 6 : 22;
      for (var r = 0; r < MOTIF.length; r++) for (var q = 0; q < 7; q++) {
        var ch = MOTIF[r].charAt(q);
        if (ch !== '.') P(g, ch === 'X' ? mo : ch === 'o' ? rose : leaf, cx - 3 + q, cy - 4 + r);
      }
      P(g, dot, cx, oy - 1); P(g, dot, cx - 1, oy); P(g, dot, cx + 1, oy); P(g, dot, cx, oy + 1); P(g, mo, cx, oy);
    }

    if (top) {
      // crown molding with dentils, deep shadow tucked beneath
      P(g, '#4a2a18', 0, 0, S, 1);
      P(g, '#f0c888', 0, 1, S, 1);
      P(g, '#c58a52', 0, 2, S, 2);
      P(g, '#9b6337', 0, 4, S, 1);
      P(g, '#5a3420', 0, 5, S, 2);
      for (x = 0; x < S; x += 4) { P(g, '#c58a52', x, 5, 2, 2); P(g, '#e0a868', x, 5, 1, 1); }
      P(g, '#7e4c2a', 0, 7, S, 1);
      P(g, '#4a2a18', 0, 8, S, 1);
      var sa = [0.36, 0.28, 0.21, 0.15, 0.10, 0.06];
      for (y = 0; y < 6; y++) { g.fillStyle = 'rgba(50,20,8,' + sa[y] + ')'; g.fillRect(0, 9 + y, S, 1); }
      g.fillStyle = 'rgba(50,20,8,0.06)'; for (x = 0; x < S; x += 2) g.fillRect(x, 15, 1, 1);
    } else {
      g.fillStyle = 'rgba(255,225,180,0.06)'; g.fillRect(0, 0, S, S);
    }
    if (bottom) {
      // chair rail
      P(g, '#5a3420', 0, 13, S, 1);
      P(g, '#f0c888', 0, 14, S, 1);
      P(g, '#c58a52', 0, 15, S, 2);
      P(g, '#9b6337', 0, 17, S, 1);
      P(g, '#4a2a18', 0, 18, S, 1);
      // wainscot: stiles + recessed bevelled panels
      var W1 = '#a56a3e', W1L = '#bb8250', W2 = '#8f5833', WS = '#6a3e22';
      P(g, W1, 0, 19, S, 8);
      for (x = 0; x < S; x++) {
        m = x & 15;
        if (m >= 3 && m <= 13) {
          P(g, W2, x, 20, 1, 6);
          P(g, WS, x, 20, 1, 1); P(g, W1L, x, 25, 1, 1);
          if (m === 3) P(g, WS, x, 20, 1, 6); else if (m === 13) P(g, W1L, x, 21, 1, 5);
          else if (hash(x + (tx & 1) * 32, 3, 61) < 0.3) P(g, '#855030', x, 21 + ((hash(x, 7, 63) * 3) | 0), 1, 2); // panel grain
        } else if (m === 0) P(g, W1L, x, 19, 1, 8);
        else if (m === 15) P(g, '#8f5833', x, 19, 1, 8);
      }
      g.fillStyle = 'rgba(40,15,5,0.30)'; g.fillRect(0, 19, S, 1);
      // baseboard
      P(g, '#4a2a18', 0, 26, S, 1);
      P(g, '#c08450', 0, 27, S, 1);
      P(g, '#8a5530', 0, 28, S, 3);
      P(g, '#a86b3c', 0, 28, S, 1);
      P(g, '#2e180d', 0, 31, S, 1);
    }
  }

  function build(id, tx, ty, nb) {
    var n = nb || function () { return id; };
    var up = n(0, -1);
    var key, c, g;
    if (id === 'void') {
      key = 'void';
      if (!cache[key]) { c = mk(); g = c.getContext('2d'); P(g, '#000', 0, 0, S, S); cache[key] = c; }
      return cache[key];
    }
    if (id === 'wall') {
      var top = !isWall(up);
      var bottom = !isWall(n(0, 1));
      key = 'w' + (tx & 1) + (top ? 1 : 0) + (bottom ? 1 : 0);
      if (!cache[key]) { c = mk(); g = c.getContext('2d'); drawWall(g, tx, ty, top, bottom); cache[key] = c; }
      return cache[key];
    }
    var sh = isWall(up) || up === 'void';
    if (id === 'rug') {
      var e = { u: n(0, -1) === 'rug', d: n(0, 1) === 'rug', l: n(-1, 0) === 'rug', r: n(1, 0) === 'rug' };
      key = 'r' + (e.u ? 1 : 0) + (e.d ? 1 : 0) + (e.l ? 1 : 0) + (e.r ? 1 : 0) + (sh ? 1 : 0) + (tx & 1) + '_' + (ty & 1);
      if (!cache[key]) { c = mk(); g = c.getContext('2d'); drawRug(g, tx, ty, e, sh); cache[key] = c; }
      return cache[key];
    }
    if (id === 'floor_tile') {
      key = 't' + tx + '_' + ty + (sh ? 's' : '');
      if (!cache[key]) { c = mk(); g = c.getContext('2d'); drawTile(g, tx, ty, sh); cache[key] = c; }
      return cache[key];
    }
    key = 'f' + tx + '_' + ty + (sh ? 's' : '');
    if (!cache[key]) { c = mk(); g = c.getContext('2d'); drawWood(g, tx, ty, sh); cache[key] = c; }
    return cache[key];
  }

  H.tilesIndoor = {
    solid: { wall: true, void: true },
    draw: function (ctx, id, px, py, tx, ty, env, nb) {
      ctx.drawImage(build(id, tx | 0, ty | 0, nb), Math.round(px * 2) / 2, Math.round(py * 2) / 2, T, T);
    }
  };
})();
