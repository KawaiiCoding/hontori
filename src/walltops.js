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
    var open = function (dx, dy) { return nb(dx, dy) !== 'void'; };
    var mask = (open(0, -1) ? 1 : 0) | (open(0, 1) ? 2 : 0) | (open(-1, 0) ? 4 : 0) | (open(1, 0) ? 8 : 0) |
      (open(-1, -1) ? 16 : 0) | (open(1, -1) ? 32 : 0) | (open(-1, 1) ? 64 : 0) | (open(1, 1) ? 128 : 0);
    if (!mask) { ctx.fillStyle = '#0b0807'; ctx.fillRect(px, py, 16, 16); return; }
    var v = ((hash(tx, ty) * 4) | 0);
    var key = mask * 4 + v;
    ctx.drawImage(cache[key] || (cache[key] = paint(mask, v)), Math.round(px * 2) / 2, Math.round(py * 2) / 2, 16, 16);
  };
})();
