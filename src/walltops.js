// Room dividers: 'void' tiles that touch a room are drawn as the top face of a thick
// solid wall (plaster cap, lit top-left edges, shaded bottom-right edges) instead of
// plain black. Also adds the side shadow a wall casts to its right (light: top-left).
// Wraps H.tilesIndoor.draw.
(function () {
  var H = window.H = window.H || {};
  if (!H.tilesIndoor) return;
  var base = H.tilesIndoor.draw;
  var TOP = '#503c30', TOP_L = '#5b4537', TOP_D = '#453328';
  var RIM_HI = '#d9b383', RIM = '#a57c54', RIM_SH = '#6e4f37', OUT = '#1e130d';
  var cache = {};
  function hash(x, y) { var n = (x * 374761393 + y * 668265263) | 0; n = (n ^ (n >> 13)) * 1274126177 | 0; return ((n ^ (n >> 16)) >>> 0) / 4294967295; }

  function paint(mask, v) {
    var c = document.createElement('canvas'); c.width = 32; c.height = 32;
    var g = c.getContext('2d');
    var n = mask & 1, s = mask & 2, w = mask & 4, e = mask & 8, nw = mask & 16, ne = mask & 32, sw = mask & 64, se = mask & 128;
    function R(col, x, y, ww, hh) { g.fillStyle = col; g.fillRect(x * 2, y * 2, ww * 2, hh * 2); }
    function F(col, x, y, ww, hh) { g.fillStyle = col; g.fillRect(x, y, ww, hh); }
    // plaster top face with a quiet two-tone mottle
    R(TOP, 0, 0, 16, 16);
    for (var i = 0; i < 4; i++) R(i & 1 ? TOP_D : TOP_L, 2 + ((hash(v * 7 + i, 3) * 11) | 0), 2 + ((hash(v, i * 11 + 5) * 12) | 0), 2 + (i & 1), 1);
    for (var j = 0; j < 14; j++) F(j % 3 ? TOP_L : TOP_D, 3 + ((hash(v * 13 + j, 9) * 26) | 0), 3 + ((hash(v + 2, j * 7 + 1) * 26) | 0), 1 + (j & 1), 1);
    // edges: lit on the sides facing the light (north / west), shaded on south / east
    if (n) { R(OUT, 0, 0, 16, 1); R(RIM_HI, 0, 1, 16, 1); R(RIM, 0, 2, 16, 1); R(TOP_L, 0, 3, 16, 1); }
    if (w) { R(OUT, 0, 0, 1, 16); R(RIM_HI, 1, 0, 1, 16); R(RIM, 2, 0, 1, 16); R(TOP_L, 3, 0, 1, 16); }
    if (s) { R(TOP_D, 0, 12, 16, 1); R(RIM, 0, 13, 16, 1); R(RIM_SH, 0, 14, 16, 1); R(OUT, 0, 15, 16, 1); }
    if (e) { R(TOP_D, 12, 0, 1, 16); R(RIM, 13, 0, 1, 16); R(RIM_SH, 14, 0, 1, 16); R(OUT, 15, 0, 1, 16); }
    // mitred corners
    if (n && w) { R(OUT, 0, 0, 16, 1); R(OUT, 0, 0, 1, 16); R(RIM_HI, 1, 1, 15, 1); R(RIM_HI, 1, 1, 1, 15); R('#f3d9ae', 1, 1, 2, 1); }
    if (n && e) { R(OUT, 15, 0, 1, 16); R(RIM_SH, 14, 1, 1, 15); R(RIM, 13, 2, 1, 14); }
    if (s && w) { R(OUT, 0, 15, 16, 1); R(RIM_SH, 1, 14, 15, 1); R(RIM, 2, 13, 14, 1); R(OUT, 0, 0, 1, 16); }
    if (s && e) { R(OUT, 15, 0, 1, 16); R(OUT, 0, 15, 16, 1); R(RIM_SH, 14, 14, 1, 1); }
    // inner corners where only a diagonal neighbour is a room
    if (!n && !w && nw) { R(OUT, 0, 0, 1, 1); R(RIM_HI, 1, 0, 1, 2); R(RIM_HI, 0, 1, 2, 1); R(RIM, 2, 0, 1, 3); R(RIM, 0, 2, 3, 1); }
    if (!n && !e && ne) { R(OUT, 15, 0, 1, 1); R(RIM_SH, 14, 0, 1, 2); R(RIM_HI, 14, 1, 2, 1); R(RIM, 13, 0, 1, 3); R(RIM, 13, 2, 3, 1); }
    if (!s && !w && sw) { R(OUT, 0, 15, 1, 1); R(RIM_HI, 1, 14, 1, 2); R(RIM_SH, 0, 14, 2, 1); R(RIM, 2, 13, 1, 3); R(RIM, 0, 13, 3, 1); }
    if (!s && !e && se) { R(OUT, 15, 15, 1, 1); R(RIM_SH, 14, 14, 1, 2); R(RIM_SH, 14, 14, 2, 1); R(RIM, 13, 13, 1, 3); R(RIM, 13, 13, 3, 1); }
    // fine 2x detail: hairline specular on lit rims, soft inner shadow on shaded rims
    if (n) { F('#f6e2bd', w ? 4 : 0, 2, w ? 28 : 32, 1); F('rgba(30,14,6,0.25)', 0, 8, 32, 1); }
    if (w) { F('#f6e2bd', 2, n ? 4 : 0, 1, n ? 28 : 32); F('rgba(30,14,6,0.25)', 8, 0, 1, 32); }
    if (s) { F('rgba(30,14,6,0.22)', 0, 23, 32, 1); F('#8a6444', 0, 28, 32, 1); }
    if (e) { F('rgba(30,14,6,0.22)', 23, 0, 1, 32); F('#8a6444', 28, 0, 1, 32); }
    return c;
  }

  // ---- sprite sheet keys (group 'indoor', module 'wtop') ----------------------------
  //   wtop:<mask * 4 + v>  wall top, 32x32 drawn into 16x16: mask = which of the 8 neighbours
  //                        are room (n 1, s 2, w 4, e 8, nw 16, ne 32, sw 64, se 128), v = 0..3
  //                        mottle variant from the tile position. Same number as the cache key.
  // Painted at run time: the solid fill of a void tile with no room around it and the soft
  // shadow a wall top casts to its right (plain fills, cheaper than pictures).
  var SK = [], recd = [], pend = 0, km = 0, kv = 0;
  /* the cached picture for key; a new one is painted from the mask and variant keyAt found */
  function canvasOf(key) {
    var c = cache[key];
    if (c) return c;
    c = cache[key] = paint(km, kv);
    rec(key, c);
    return c;
  }
  function rec(key, c) {
    var S = H.sheets;
    if (!S || !S.recording || !S.rec || recd[key]) return;
    recd[key] = 1;
    try { S.rec('indoor', SK[key] || (SK[key] = 'wtop:' + key), c); } catch (e) {}
  }
  function paintPend() { return canvasOf(pend); }
  function keyAt(nb, tx, ty) {
    var mask = (nb(0, -1) !== 'void' ? 1 : 0) | (nb(0, 1) !== 'void' ? 2 : 0) | (nb(-1, 0) !== 'void' ? 4 : 0) | (nb(1, 0) !== 'void' ? 8 : 0) |
      (nb(-1, -1) !== 'void' ? 16 : 0) | (nb(1, -1) !== 'void' ? 32 : 0) | (nb(-1, 1) !== 'void' ? 64 : 0) | (nb(1, 1) !== 'void' ? 128 : 0);
    if (!mask) return -1;
    km = mask; kv = ((hash(tx, ty) * 4) | 0);
    return mask * 4 + kv;
  }

  H.tilesIndoor.draw = function (ctx, id, px, py, tx, ty, env, nb) {
    if (id !== 'void') {
      base.apply(this, arguments);
      if (nb) {
        var l = nb(-1, 0);
        // a wall top standing to the left casts a soft shadow to the right
        if (l === 'void' && id !== 'wall') {
          ctx.fillStyle = 'rgba(25,10,4,0.30)'; ctx.fillRect(px, py, 2, 16);
          ctx.fillStyle = 'rgba(25,10,4,0.14)'; ctx.fillRect(px + 2, py, 2, 16);
        } else if (l === 'void') {
          ctx.fillStyle = 'rgba(25,10,4,0.20)'; ctx.fillRect(px, py, 2, 16);
        }
      }
      return;
    }
    var key = keyAt(nb, tx, ty);
    if (key < 0) { ctx.fillStyle = '#0b0807'; ctx.fillRect(px, py, 16, 16); return; }
    var x = Math.round(px * 2) / 2, y = Math.round(py * 2) / 2, S = H.sheets;
    if (S && S.draw) { pend = key; try { S.draw(ctx, SK[key] || (SK[key] = 'wtop:' + key), x, y, paintPend, 16, 16); return; } catch (e) {} }
    ctx.drawImage(canvasOf(key), x, y, 16, 16);
  };

  /* sheet build: every wall top the indoor maps use */
  function enumerate() {
    var maps = H.maps || {}, seen = [], count = 0, pixels = 0;
    for (var name in maps) {
      var m = maps[name];
      if (!m || m.tileset !== 'indoor' || !m.ground || !m.legend) continue;
      var first = m.legend[Object.keys(m.legend)[0]];
      var grid = m.ground.map(function (r) { return Array.from(r).map(function (ch) { return m.legend[ch] || first; }); });
      var at = function (x, y) { return (grid[y] && grid[y][x]) || 'void'; };
      for (var y = 0; y < grid.length; y++) for (var x = 0; x < grid[y].length; x++) {
        if (grid[y][x] !== 'void') continue;
        var key = keyAt(function (dx, dy) { return at(x + dx, y + dy); }, x, y);
        if (key < 0 || seen[key]) continue;
        seen[key] = 1;
        var c = canvasOf(key);
        rec(key, c);
        count++; pixels += c.width * c.height;
      }
    }
    return { count: count, pixels: pixels };
  }
  if (H.sheets && H.sheets.enumerate) try { H.sheets.enumerate('indoor', enumerate); } catch (e) {}
})();
