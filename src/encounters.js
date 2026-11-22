window.H = window.H || {};
// Habitats and visible wild hontori. Each outdoor map keeps a few wild spirits in places that suit them.
// They wander, notice the kid, drift closer, and a touch starts a battle.
// API: H.encounters = { habitat, weights(map,tx,ty,env), pick(map,tx,ty,env)->{key,level}, enter, update, collect, defeated }
(function () {
  'use strict';
  var H = window.H, T = 16;

  // ---------- habitats
  // feature weights per species: tile counts / props near a tile, then time and weather factors, then rarity
  var HAB = {
    water:    { f: { water: 3, sand: 1.2, bridge: 1, reeds: 1.5, lilypad: 1 }, day: 1, night: 0.8, wx: { rain: 2.2, fog: 1.2 }, rare: 1 },
    grass:    { f: { tallgrass: 2.6, tree: 0.8, bush: 1, flowers: 0.6, garden: 1.5, fruit: 1.4 }, day: 1, night: 0.6, wx: { rain: 1.3 }, rare: 1 },
    wind:     { f: { open: 1.6, bridge: 1.5, flowers: 0.5, chime: 3 }, day: 1, night: 0.6, wx: { wind: 2.5, rain: 0.7 }, rare: 0.8 },
    electric: { f: { lamp: 3, metal: 2, open: 0.3 }, day: 0.8, night: 1, wx: { rain: 3, wind: 1.3, clear: 0.6 }, rare: 0.35 },
    earth:    { f: { rock: 2.5, path: 0.5, sand: 0.6, wall: 1.2, field: 0.8 }, day: 1, night: 0.8, wx: { rain: 0.8 }, rare: 0.9 },
    hontori:  { f: { warm: 3, open: 0.4, path: 0.3 }, day: 1.3, night: 0.25, wx: { clear: 1.4, rain: 0.25, snow: 0.3, fog: 0.6 }, rare: 0.4 },
    dark:     { f: { shade: 1.6, mushroom: 3, tree: 0.8, tallgrass: 1.2, open: 0.7, path: 0.4 }, day: 0.08, night: 3, wx: { fog: 2.2, rain: 1.1 }, rare: 0.8 },
    light:    { f: { flowers: 1.4, statue: 5, open: 0.4 }, day: 1.2, night: 0.08, wx: { clear: 1.4, rain: 0.4, fog: 0.5 }, rare: 0.3 },
    // second wave
    frog:       { f: { lilypad: 3, reeds: 2.2, water: 1.4, tallgrass: 0.3 }, day: 0.8, night: 1.3, wx: { rain: 2.6, fog: 1.3, clear: 0.8 }, rare: 0.8 },
    salamander: { f: { warm: 2.4, rock: 1, log: 1 }, day: 0.9, night: 0.9, wx: { clear: 1.3, rain: 0.2, snow: 0.3 }, rare: 0.35 },
    squirrel:   { f: { tree: 1.4, fruit: 2, open: 0.5, chime: 1.5 }, day: 1.2, night: 0.3, wx: { wind: 2.6, rain: 0.6 }, rare: 0.7 },
    tortoise:   { f: { garden: 1.4, tallgrass: 0.8, water: 0.6, mushroom: 1, shade: 1 }, day: 1, night: 0.6, wx: { rain: 1.5, fog: 1.2 }, rare: 0.45 },
    hamster:    { f: { lamp: 2, field: 1.6, garden: 0.8, metal: 1 }, day: 0.9, night: 0.9, wx: { rain: 2.2, wind: 1.4, clear: 0.7 }, rare: 0.4 },
    crab:       { f: { sand: 3, rock: 1.5, water: 0.6 }, day: 1, night: 0.9, wx: { rain: 1.2 }, rare: 0.6 },
    raven:      { f: { tree: 1.2, shade: 1.4, field: 1, statue: 0.8 }, day: 0.12, night: 2.2, wx: { fog: 2, rain: 1.2 }, rare: 0.6 },
    firefly:    { f: { tallgrass: 1.2, flowers: 1.4, water: 0.8, reeds: 1.2, lamp: 1 }, day: 0.1, night: 2.4, wx: { clear: 1.3, rain: 0.3, fog: 0.8 }, rare: 0.35 }
  };
  var PROPF = {
    tree: 'tree', pine: 'tree', cherry_tree: 'tree', fruit_tree: 'fruit', bush: 'bush', butterfly_bush: 'bush',
    rock: 'rock', stone_wall_h: 'wall', mushroom_ring: 'mushroom', flower_patch: 'flowers', flowerbed: 'flowers',
    reeds: 'reeds', lilypad: 'lilypad', statue: 'statue', lamp: 'lamp', lantern_string: 'lamp', windchime: 'chime',
    log_pile: 'warm', campfire: 'warm', fireplace: 'warm', barrel: 'metal', cart: 'metal', mailbox: 'metal', fence_h: 'field', fence_v: 'field',
    hay_bale: 'field', garden_bed: 'garden', pumpkin: 'garden', well: 'metal'
  };
  var TILEF = { water: 'water', sand: 'sand', bridge: 'bridge', tallgrass: 'tallgrass', flowers: 'flowers', path: 'path', cobble: 'path' };

  function isNight(env) { var h = env ? env.time : 12; return h >= 19.5 || h < 5.5; }
  function isDusk(env) { var h = env ? env.time : 12; return (h >= 17.5 && h < 19.5) || (h >= 5.5 && h < 7); }

  // Feature table for a map, cached on the map object.
  function habitat(map) {
    if (map._hab) return map._hab;
    var w = map.w, h = map.h, ids = map.ground.map(function (r) { return r.split('').map(function (c) { return map.legend[c]; }); });
    var raw = []; for (var y = 0; y < h; y++) { raw.push([]); for (var x = 0; x < w; x++) raw[y].push({}); }
    function add(x, y, k, v) { if (x >= 0 && y >= 0 && x < w && y < h) raw[y][x][k] = (raw[y][x][k] || 0) + v; }
    function spread(cx, cy, k, r, v) { for (var yy = cy - r; yy <= cy + r; yy++) for (var xx = cx - r; xx <= cx + r; xx++) { var d = Math.abs(xx - cx) + Math.abs(yy - cy); if (d <= r) add(xx, yy, k, v / (1 + d)); } }
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) { var f = TILEF[ids[y][x]]; if (f) spread(x, y, f, 2, 0.35); }
    var propCount = []; for (y = 0; y < h; y++) { propCount.push([]); for (x = 0; x < w; x++) propCount[y].push(0); }
    (map.props || []).forEach(function (p) {
      var f = PROPF[p.type]; if (!f) return;
      var r = f === 'statue' || f === 'lamp' || f === 'warm' || f === 'chime' ? 4 : 2;
      spread(p.x, p.y, f, r, f === 'statue' ? 1.2 : 0.6);
      if (f === 'tree') for (var yy = p.y - 2; yy <= p.y + 2; yy++) for (var xx = p.x - 2; xx <= p.x + 2; xx++) if (propCount[yy] && xx >= 0 && xx < w) propCount[yy][xx]++;
    });
    (map.buildings || []).forEach(function (b) {
      var bi = (H.buildings && H.buildings.info[b.type]) || { fw: 4, fh: 4 };
      // chimneys and hearths are warm; the player's house has the stone chimney
      spread(b.x + (bi.fw >> 1), b.y + bi.fh, 'warm', 5, b.type === 'house_player' || b.type === 'tavern' ? 1.4 : 0.6);
    });
    var out = [];
    for (y = 0; y < h; y++) { out.push([]); for (x = 0; x < w; x++) {
      var o = raw[y][x], trees = propCount[y][x];
      o.shade = Math.max(0, trees - 3) * 0.35;
      o.open = trees === 0 && !o.water && !o.path ? 1 : trees <= 1 ? 0.4 : 0;
      (map.zones || []).forEach(function (z) { var d = Math.hypot(x - z.x, y - z.y); if (d <= z.r) o['z_' + z.key] = (o['z_' + z.key] || 0) + z.w * (1 - d / (z.r + 1)); });
      out[y].push(o);
    } }
    map._hab = out; return out;
  }

  function weights(map, tx, ty, env) {
    var hab = habitat(map), o = (hab[ty] && hab[ty][tx]) || {}, res = {};
    var night = isNight(env), dusk = isDusk(env), wx = (env && env.weather) || 'clear';
    for (var key in HAB) {
      if (H.spirits && H.spirits.list && !H.spirits.list.some(function (q) { return q.key === key; })) continue;
      var sp = HAB[key], s = 0.05;
      for (var f in sp.f) if (o[f]) s += Math.min(3, o[f]) * sp.f[f];
      if (o['z_' + key]) s += o['z_' + key];
      s *= night ? sp.night : dusk ? (sp.day + sp.night) / 2 : sp.day;
      s *= sp.wx[wx] || 1;
      res[key] = s * sp.rare;
    }
    // a lit lantern at night draws dark hontori closer
    if (night && H.pickups && H.pickups.has('lantern')) { if (res.dark) res.dark *= 2.2; if (res.raven) res.raven *= 1.6; }
    return res;
  }

  function pick(map, tx, ty, env, rnd) {
    rnd = rnd || Math.random;
    var w = weights(map, tx, ty, env), sum = 0, k;
    for (k in w) sum += w[k];
    var r = rnd() * sum, key = 'grass';
    for (k in w) { r -= w[k]; if (r <= 0) { key = k; break; } }
    var lv = map.wildLevel || [1, 3], level = lv[0] + Math.floor(rnd() * (lv[1] - lv[0] + 1));
    if (HAB[key].rare < 0.5) level += 1;
    return { key: key, level: level, score: w[key] };
  }

  // ---------- spawn rules
  // A tile can host a wild one if it is walkable, not on a path, away from doors and npcs, and has a real habitat.
  // Towns (maps with buildings) keep them to the wild edges.
  function candidates(map, solid, grid) {
    if (map._wildTiles) return map._wildTiles;
    var town = (map.buildings || []).length > 0, out = [], w = map.w, h = map.h, hab = habitat(map);
    var avoid = [];
    (map.doors || []).forEach(function (d) { avoid.push([d.x, d.y, 4]); });
    (map.npcs || []).forEach(function (n) { avoid.push([n.x, n.y, 2]); });
    var bld = (map.buildings || []).map(function (b) { var bi = H.buildings.info[b.type]; return [b.x, b.y, b.x + bi.fw - 1, b.y + bi.fh - 1]; });
    for (var y = 1; y < h - 1; y++) for (var x = 1; x < w - 1; x++) {
      if (solid[y][x]) continue;
      var id = grid[y][x];
      if (id === 'path' || id === 'cobble' || id === 'bridge') continue;
      if (avoid.some(function (a) { return Math.abs(a[0] - x) + Math.abs(a[1] - y) < a[2]; })) continue;
      if (town) {
        var o = hab[y][x], edge = Math.min(x, y, w - 1 - x, h - 1 - y);
        var wild = id === 'tallgrass' || id === 'sand' || id === 'flowers' || o.water > 0.3 || o.fruit > 0.3 || edge <= 4;
        if (!wild) continue;
        if (bld.some(function (b) { return x >= b[0] - 3 && x <= b[2] + 3 && y >= b[1] - 4 && y <= b[3] + 3; })) continue;
        if (o.path > 0.5 && id !== 'tallgrass') continue;
      }
      out.push([x, y]);
    }
    map._wildTiles = out; return out;
  }

  // ---------- live state
  var S = { mapName: null, map: null, grid: null, solid: null, list: [], timers: [], grace: 0, reeval: 6, uid: 1 };
  var cache = {}; // mapName -> list, so wild ones stay put when you come back

  function freeTile(x, y, ctx) { return !(ctx && ctx.blocked ? ctx.blocked(x, y) : S.solid[y] && S.solid[y][x]); }

  function spawnOne(env, player) {
    var cand = candidates(S.map, S.solid, S.grid); if (!cand.length) return null;
    for (var tries = 0; tries < 40; tries++) {
      var c = cand[Math.floor(Math.random() * cand.length)];
      if (player && Math.abs(c[0] - player.tx) + Math.abs(c[1] - player.ty) < 8) continue;
      if (S.list.some(function (w) { return Math.abs(w.hx - c[0]) + Math.abs(w.hy - c[1]) < 5; })) continue;
      var p = pick(S.map, c[0], c[1], env);
      if (p.score < 0.35) continue;
      // keep the mix varied: at most two of a kind per map
      if (tries < 30 && S.list.filter(function (o) { return o.key === p.key; }).length >= 2) continue;
      var w = { id: S.uid++, key: p.key, level: p.level, hx: c[0], hy: c[1], tx: c[0], ty: c[1],
        x: c[0] * T + 8, y: c[1] * T + 12, dir: Math.floor(Math.random() * 4), moving: false, state: 'idle',
        timer: 1 + Math.random() * 3, alpha: 0, fade: 1, bang: 0, ph: Math.random() * 6.28, hidden: Math.random() < 0.22 };
      S.list.push(w); return w;
    }
    return null;
  }

  function enter(mapName, map, ctx) {
    S.mapName = mapName; S.map = map; S.grid = ctx.grid; S.solid = ctx.solid; S.timers = []; S.grace = 1.5;
    if (map.tileset !== 'outdoor') { S.list = []; return; }
    var want = map.wildCount || ((map.buildings || []).length ? 4 : 5);
    S.list = cache[mapName] || [];
    cache[mapName] = S.list;
    S.list.forEach(function (w) { w.state = 'idle'; w.timer = 1; w.bang = 0; });
    while (S.list.length < want) if (!spawnOne(ctx.env, ctx.player)) break;
    S.list.forEach(function (w) { w.alpha = 1; w.fade = 0; });
  }

  function stepToward(w, gx, gy, speed, dt, ctx) {
    var dx = gx - w.x, dy = gy - w.y, d = Math.hypot(dx, dy);
    if (d < 0.5) { w.moving = false; return true; }
    var st = Math.min(d, speed * dt), nx = w.x + dx / d * st, ny = w.y + dy / d * st;
    var ntx = Math.floor(nx / T), nty = Math.floor((ny + 3) / T);
    if ((ntx !== w.tx || nty !== w.ty) && !freeTile(ntx, nty, ctx)) {
      // slide along one axis
      var ax = Math.floor((w.x + dx / d * st) / T), ay = Math.floor((w.y + 3) / T);
      if (Math.abs(dx) > 0.3 && freeTile(ax, ay, ctx)) { nx = w.x + Math.sign(dx) * st; ny = w.y; }
      else { var by = Math.floor((w.y + dy / d * st + 3) / T); if (Math.abs(dy) > 0.3 && freeTile(Math.floor(w.x / T), by, ctx)) { nx = w.x; ny = w.y + Math.sign(dy) * st; } else { w.moving = false; return true; } }
      ntx = Math.floor(nx / T); nty = Math.floor((ny + 3) / T);
    }
    if (Math.abs(nx - w.x) > 0.05 || Math.abs(ny - w.y) > 0.05) w.dir = Math.abs(nx - w.x) > Math.abs(ny - w.y) ? (nx < w.x ? 2 : 3) : (ny < w.y ? 1 : 0);
    w.x = nx; w.y = ny; w.tx = ntx; w.ty = nty; w.moving = true; return false;
  }

  // ctx: { env, player, blocked(x,y), busy, emit, sfx }. Returns the wild one touched, or null.
  function update(dt, ctx) {
    if (!S.map || S.map.tileset !== 'outdoor') return null;
    var env = ctx.env, pl = ctx.player, hit = null;
    S.grace = Math.max(0, S.grace - dt);
    // respawn timers
    for (var i = S.timers.length - 1; i >= 0; i--) { S.timers[i] -= dt; if (S.timers[i] <= 0) { S.timers.splice(i, 1); spawnOne(env, pl); } }
    // now and then, a spirit out of season (dark at noon, light at night) fades away and a fitting one takes its place
    S.reeval -= dt;
    if (S.reeval <= 0 && S.list.length) {
      S.reeval = 8;
      var w0 = S.list[Math.floor(Math.random() * S.list.length)];
      if (w0.state !== 'chase' && w0.fade === 0) {
        var ws = weights(S.map, w0.hx, w0.hy, env), best = 0; for (var k in ws) best = Math.max(best, ws[k]);
        if (ws[w0.key] < best * 0.12) { w0.fade = -1; S.timers.push(4 + Math.random() * 6); }
      }
    }
    for (var j = S.list.length - 1; j >= 0; j--) {
      var w = S.list[j];
      w.ph += dt;
      if (w.fade > 0) { w.alpha = Math.min(1, w.alpha + dt * 0.8); if (w.alpha >= 1) w.fade = 0; }
      if (w.fade < 0) { w.alpha -= dt * 0.8; if (w.alpha <= 0) { S.list.splice(j, 1); continue; } }
      w.bang = Math.max(0, w.bang - dt);
      var pdx = pl.x - w.x, pdy = (pl.y - 4) - w.y, pd = Math.hypot(pdx, pdy);
      // hidden ones (a faint shimmer) only notice a kid who can see them in the mirror
      var calm = ctx.busy || S.grace > 0 || w.fade < 0 || (w.hidden && !seen());
      if (!calm && w.state !== 'chase' && w.state !== 'notice' && pd < 3 * T) {
        w.state = 'notice'; w.timer = 0.7; w.bang = 1.1; w.moving = false;
        w.dir = Math.abs(pdx) > Math.abs(pdy) ? (pdx < 0 ? 2 : 3) : (pdy < 0 ? 1 : 0);
        if (ctx.sfx) ctx.sfx('sparkle');
      }
      if (w.state === 'notice') { w.timer -= dt; w.moving = false; if (w.timer <= 0) w.state = 'chase'; }
      else if (w.state === 'chase') {
        if (calm || pd > 6 * T || Math.abs(w.tx - w.hx) + Math.abs(w.ty - w.hy) > 9) { w.state = 'home'; }
        else stepToward(w, pl.x, pl.y - 4, 26, dt, ctx);
      } else if (w.state === 'home') {
        if (stepToward(w, w.hx * T + 8, w.hy * T + 12, 16, dt, ctx)) { w.state = 'idle'; w.timer = 2 + Math.random() * 3; }
      } else if (w.state === 'idle') {
        w.moving = false; w.timer -= dt;
        if (w.timer <= 0) {
          // pick a nearby free tile around home
          for (var t2 = 0; t2 < 6; t2++) {
            var gx = w.hx + Math.round((Math.random() - 0.5) * 6), gy = w.hy + Math.round((Math.random() - 0.5) * 4);
            if (freeTile(gx, gy, ctx) && S.solid[gy] && !S.solid[gy][gx]) { w.gx = gx * T + 8; w.gy = gy * T + 12; w.state = 'wander'; w.timer = 6; break; }
          }
          if (w.state === 'idle') w.timer = 1.5 + Math.random() * 2;
        }
      } else if (w.state === 'wander') {
        w.timer -= dt;
        if (stepToward(w, w.gx, w.gy, 12, dt, ctx) || w.timer <= 0) { w.state = 'idle'; w.timer = 2 + Math.random() * 4; w.moving = false; }
      }
      if (ctx.emit && Math.random() < dt * 0.6) ctx.emit('sparkle', w.x + (Math.random() - 0.5) * 10, w.y - 4, 1);
      if (!hit && !calm && w.alpha > 0.6 && Math.abs(pdx) < 10 && Math.abs(pdy) < 9) hit = w;
    }
    return hit;
  }

  function defeated(w) {
    var i = S.list.indexOf(w); if (i >= 0) S.list.splice(i, 1);
    S.timers.push(18 + Math.random() * 20); S.grace = 3;
    S.list.forEach(function (o) { if (o.state === 'chase' || o.state === 'notice') o.state = 'home'; });
  }

  // "!" pop, drawn once
  var bangCv = null;
  function bang() {
    if (bangCv) return bangCv;
    var c = document.createElement('canvas'); c.width = 9; c.height = 12; var x = c.getContext('2d');
    var rows = ['.ooooooo.', 'owwwwwwwo', 'owwwrwwwo', 'owwrrrwwo', 'owwrrrwwo', 'owwwrwwwo', 'owwwrwwwo', 'owwwwwwwo', 'owwwrwwwo', '.ooooooo.', '...owo...', '....o....'];
    var pal = { o: '#2a1e2e', w: '#fff8e8', r: '#e0483c' };
    rows.forEach(function (r, y) { for (var i = 0; i < r.length; i++) if (pal[r[i]]) { x.fillStyle = pal[r[i]]; x.fillRect(i, y, 1, 1); } });
    return (bangCv = c);
  }

  // Push draw entries into the engine's y-sorted list.
  function seen() { return !!(H.pickups && H.pickups.has('mirror')); }
  function collect(ents, lights, ctx, env) {
    if (!S.map || S.map.tileset !== 'outdoor') return;
    var night = isNight(env), mir = seen();
    S.list.forEach(function (w) {
      var gy = w.y + 10;
      if (w.hidden && !mir) { ents.push({ y: gy, d: function () { var a = 0.25 + Math.sin(w.ph * 2.6) * 0.15; ctx.fillStyle = 'rgba(220,235,255,' + a + ')';
        for (var q = 0; q < 4; q++) { var an = w.ph * 1.3 + q * 1.57; ctx.fillRect(Math.round(w.x + Math.cos(an) * 5), Math.round(w.y - 2 + Math.sin(an * 1.4) * 4), 1, 1); } } }); return; }
      if (night) lights.push({ x: w.x, y: w.y, r: 18, color: '#9ec8ff', flicker: true });
      ents.push({ y: gy, d: function () {
        var bob = Math.sin(w.ph * 2.2) * 1.2, shim = 0.84 + Math.sin(w.ph * 3.1) * 0.08;
        H.fx && H.fx.shadow(ctx, w.x, gy, 4, 1.5, env);
        H.spirits.draw(ctx, w.key, Math.round(w.x), Math.round(w.y - 1 + bob), env, { scale: 0.8, dir: w.dir, moving: w.moving, noShadow: true, alpha: shim * w.alpha });
        if (w.bang > 0) {
          var b = bang(), pop = w.bang > 0.95 ? (1.1 - w.bang) * 20 : 3;
          ctx.globalAlpha = Math.min(1, w.bang * 3);
          ctx.drawImage(b, Math.round(w.x - 4), Math.round(w.y - 24 - Math.min(3, pop)));
          ctx.globalAlpha = 1;
        }
      } });
    });
  }

  // clear this map's wild ones and spawn a fresh set for the current time and weather
  function reset(env, player) {
    if (!S.map) return; S.list.length = 0; S.timers = [];
    var want = S.map.wildCount || ((S.map.buildings || []).length ? 4 : 5);
    while (S.list.length < want) if (!spawnOne(env, player)) break;
  }

  H.encounters = { reset: reset, habitat: habitat, weights: weights, pick: pick, candidates: candidates, enter: enter, update: update, collect: collect, defeated: defeated,
    get list() { return S.list; } };
})();
