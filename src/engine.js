// Hontori preview engine — glues modules from CONTRACT.md together.
(function () {
  const H = window.H;
  const T = 16; let VW = 384, VH = 216;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const env = { t: 0, time: 22, weather: 'clear', wind: 0.2, indoor: true };
  const WEATHERS = ['clear', 'rain', 'wind', 'snow', 'fog'];
  let lighting = null, weather = null;
  // Mobile-first: short screen side = ~14 tiles, long side follows the device aspect.
  const RS = 2; // render scale: logical 16px tiles are drawn on a 2x canvas, so art may be authored at 32px per tile
  H.renderScale = RS;
  function resize() {
    const root = document.getElementById('root');
    const w = root.clientWidth || window.innerWidth, h = root.clientHeight || window.innerHeight, short = 216;
    // keep the exact screen aspect (never stretch); limit the long side for speed
    const lo = Math.min(w, h), hi = Math.max(w, h), longS = Math.min(440, short * hi / lo), shortS = longS * lo / hi;
    if (h >= w) { VW = Math.round(shortS); VH = Math.round(longS); } else { VW = Math.round(longS); VH = Math.round(shortS); }
    root.classList.toggle('land', w > h);
    canvas.width = VW * RS; canvas.height = VH * RS; ctx.setTransform(RS, 0, 0, RS, 0, 0); ctx.imageSmoothingEnabled = false;
    lighting = H.fx && H.fx.createLighting ? H.fx.createLighting(VW, VH) : null;
    weather = H.fx && H.fx.createWeather ? H.fx.createWeather(VW, VH) : null;
  }
  resize(); addEventListener('resize', resize);
  // Phones report the new size late after rotating, so also check the real size every frame.
  let lastRW = 0, lastRH = 0;
  function checkSize() { const r = document.getElementById('root'); if (r.clientWidth !== lastRW || r.clientHeight !== lastRH) { lastRW = r.clientWidth; lastRH = r.clientHeight; resize(); } }
  addEventListener('orientationchange', () => setTimeout(resize, 250));
  const particles = H.fx && H.fx.createParticles ? H.fx.createParticles() : null;
  const emit = (k, x, y, n) => particles && particles.emit(k, x, y, n);
  const sfx = (n) => { try { H.audio && H.audio.sfx(n); } catch (e) {} };
  try { H.audio && H.audio.init(); } catch (e) { console.warn(e); }

  let map, grid, solid, tileset, camX = 0, camY = 0, shake = 0, busy = false, mapName;
  const player = { key: 'kid', tx: 0, ty: 0, x: 0, y: 0, dir: 0, moving: false, fx: 0, fy: 0, prog: 0, frame: 0, steps: 0 };
  let spirit = null, camFocus = null, ambient = null, fcx = 0, fcy = 0, camSnap = true; // {key,x,y}
  const trail = [];
  let npcs = [];

  const propInfo = (type) => (H.furniture && H.furniture.info[type]) || (H.propsOutdoor && H.propsOutdoor.info[type]) || { fw: 1, fh: 1, solid: true };
  const propDraw = (type, px, py) => {
    if (H.furniture && H.furniture.info[type]) return H.furniture.draw(ctx, type, px, py, env);
    if (H.propsOutdoor && H.propsOutdoor.info[type]) return H.propsOutdoor.draw(ctx, type, px, py, env);
    ctx.fillStyle = '#a66'; ctx.fillRect(px, py, T, T);
  };

  function loadMap(name, tx, ty, dir) {
    mapName = name; map = H.maps[name];
    tileset = map.tileset === 'indoor' ? H.tilesIndoor : H.tilesOutdoor;
    env.indoor = map.tileset === 'indoor';
    if (map.env) { env.time = map.env.time; env.weather = map.env.weather || 'clear'; }
    grid = map.ground.map(r => [...r].map(ch => map.legend[ch] || Object.values(map.legend)[0]));
    solid = grid.map(r => r.map(id => !!(tileset && tileset.solid && tileset.solid[id])));
    const block = (x, y) => { if (solid[y] && x >= 0 && x < map.w) solid[y][x] = true; };
    (map.props || []).forEach(p => { const i = propInfo(p.type); if (i.solid && !i.decor) for (let y = 0; y < i.fh; y++) for (let x = 0; x < i.fw; x++) block(p.x + x, p.y + y); });
    (map.buildings || []).forEach(b => { const i = H.buildings.info[b.type]; const dx = Math.floor(i.fw / 2), dy = i.fh - 1;
      for (let y = 0; y < i.fh; y++) for (let x = 0; x < i.fw; x++) if (!(x === dx && y === dy)) block(b.x + x, b.y + y); });
    try { ambient = H.ambient && H.ambient.create ? H.ambient.create(map) : null; } catch (e) { console.warn(e); ambient = null; }
    npcs = (map.npcs || []).map((n, i) => ({ ...n, seed: (n.x * 13 + n.y * 7 + i * 31) % 97 / 97, px: n.x * T + 8, py: n.y * T + 15 }));
    const s = map.spawn || { x: 1, y: 1, dir: 0 };
    player.tx = tx ?? s.x; player.ty = ty ?? s.y; player.dir = dir ?? s.dir ?? 0;
    player.x = player.tx * T + 8; player.y = player.ty * T + 15; player.moving = false; camSnap = true;
    if (spirit) { spirit.x = spirit.gx = player.x; spirit.gy = player.y; spirit.y = player.y - 10; trail.length = 0; }
    H.ui && H.ui.hud(env, map.name || name);
    try { H.audio && H.audio.setScene(name, env); } catch (e) {}
  }

  const tileAt = (x, y) => (grid[y] && grid[y][x]) || (env.indoor ? 'void' : 'grass');
  const blocked = (x, y) => x < 0 || y < 0 || x >= map.w || y >= map.h || solid[y][x] || npcs.some(n => n.x === x && n.y === y);
  const DIRS = [[0, 1], [0, -1], [-1, 0], [1, 0]];

  // ---------- input
  const keys = {}; let actionQueued = false;
  addEventListener('keydown', e => {
    const k = e.key.toLowerCase(); if (!keys[k] && (k === ' ' || k === 'enter' || k === 'z')) actionQueued = true;
    keys[k] = true;
    if (k === 't') { env.time = (env.time + 3) % 24; H.ui && H.ui.toast('Time ' + Math.floor(env.time) + ':00'); }
    if (k === 'r') { env.weather = WEATHERS[(WEATHERS.indexOf(env.weather) + 1) % WEATHERS.length]; H.ui && H.ui.toast('Weather: ' + env.weather); }
    if (k === 'h' && !busy && H.spirits) { const have = H.game.state.party.map(p => p.key), nx = H.spirits.list.find(s => !have.includes(s.key)); if (nx && H.game.addHontori(nx.key)) H.ui && H.ui.toast('A ' + nx.element + ' hontori joined'); }
    if (k === 'f' && !busy) startBattle();
    if (k === '1' && !busy) loadMap('home'); if (k === '2' && !busy) loadMap('village');
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  });
  addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
  let touchActionPrev = false;
  let started = !H.title; if (H.title) H.title.ready.then(() => { started = true; actionQueued = false; });
  function readInput() {
    if (!started) { actionQueued = false; return { dx: 0, dy: 0, act: false }; }
    const ti = (H.ui && H.ui.input) || { dx: 0, dy: 0, action: false };
    let dx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0) + (ti.dx || 0);
    let dy = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0) + (ti.dy || 0);
    let act = actionQueued || (ti.action && !touchActionPrev); touchActionPrev = !!ti.action; actionQueued = false;
    return { dx: Math.sign(dx), dy: Math.sign(dy), act };
  }

  // ---------- dialog helpers
  const portrait = (key) => {
    try { if (H.spirits && H.spirits.list.some(s => s.key === key)) return H.spirits.portrait(key); return H.chars.portrait(key); } catch (e) { return null; }
  };
  const COLORS = { hontori: '#ffb04a', kid: '#7cc8ff', mom: '#ff9fc2', dad: '#9fe0a0' };
  // 'hontori' is the word for all spirits (a kind, not a name). The companion is nameless until the player names it.
  async function say(key, name, text) { if (key === 'hontori') name = H.spiritName || 'Fire Hontori'; if (H.ui) await H.ui.say(name, text, portrait(key), COLORS[key] || '#ffe08a'); }

  // Chimney entrance: camera to the hearth, the fox drops down the flue, shakes off soot, then walks to the kid.
  async function spiritEntrance(fp) {
    const hx = fp ? fp.x * T + 16 : player.x, hy = fp ? (fp.y + 1) * T + 12 : player.y;
    camFocus = { x: hx, y: hy - 10 }; await wait(700);
    // soot rumbles down the flue
    for (let i = 0; i < 3; i++) { emit('smoke', hx, hy - 34, 10); emit('ember', hx, hy - 20, 6); sfx('cough'); shake = 0.25; await wait(380); }
    spirit = { key: 'hontori', x: hx, y: hy - 46, gx: hx, gy: hy, h: 46, vh: 0, mode: 'drop', dir: 0, face: 1, ph: 0, idle: 0, timer: 0 };
    // fall with gravity, small bounce
    await new Promise(res => { spirit.onLand = res; });
    emit('smoke', hx, hy - 4, 34); emit('ember', hx, hy - 6, 18); sfx('bump'); shake = 0.35;
    await wait(500);
    // shake off the soot
    spirit.mode = 'shakeoff'; spirit.timer = 0.8; sfx('sparkle');
    for (let i = 0; i < 4; i++) { emit('smoke', spirit.x + (i % 2 ? 6 : -6), spirit.y + 2, 6); await wait(180); }
    emit('sparkle', spirit.x, spirit.y, 16); await wait(300);
    // walk through the house to the kid, camera follows the fox
    const path = findPath(Math.floor(hx / T), Math.floor((hy - 2) / T), player.tx, player.ty);
    spirit.mode = 'script'; spirit.path = path.map(([x, y]) => [x * T + 8, y * T + 14]); camFocus = spirit;
    await new Promise(res => { spirit.onArrive = res; });
    player.dir = Math.abs(spirit.gx - player.x) > Math.abs(spirit.gy - player.y) ? (spirit.gx < player.x ? 2 : 3) : (spirit.gy < player.y ? 1 : 0);
    spirit.mode = 'follow'; spirit.dir = 0; camFocus = null; await wait(400);
  }
  // BFS over walkable tiles; returns tiles from start to a free tile next to the goal.
  function findPath(sx, sy, gx, gy) {
    const key = (x, y) => y * map.w + x, prev = new Map([[key(sx, sy), null]]), q = [[sx, sy]];
    let end = null;
    while (q.length) { const [x, y] = q.shift(); if (Math.abs(x - gx) + Math.abs(y - gy) === 1) { end = [x, y]; break; }
      for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy, k = key(nx, ny);
        if (prev.has(k) || nx < 0 || ny < 0 || nx >= map.w || ny >= map.h || solid[ny][nx]) continue; prev.set(k, [x, y]); q.push([nx, ny]); } }
    if (!end) return [[gx, gy + 1]];
    const out = []; let c = end; while (c) { out.unshift(c); c = prev.get(key(c[0], c[1])); } return out;
  }

  async function runIntro() {
    busy = true;
    const fp = (map.props || []).find(p => p.type === 'fireplace');
    const fx = fp ? fp.x * T + 16 : player.x, fy = fp ? fp.y * T + 4 : player.y - 30;
    for (const st of H.script.intro || []) {
      if (st.say) await say(st.say[0], st.say[1], st.say[2]);
      else if (st.do === 'shake') { shake = 0.8; sfx('cough'); emit('smoke', fx, fy, 20); emit('ember', fx, fy, 20); await wait(700); }
      else if (st.do === 'spiritAppear') await spiritEntrance(fp);
      else if (st.do === 'giveWand') { sfx('wand'); emit('magic', player.x, player.y - 20, 40); H.ui && H.ui.toast('Received: Spirit Wand'); await wait(900); }
      else if (st.do === 'spell') { if (H.gesture && H.gesture.prompt) await H.gesture.prompt('veil', 'Draw a V to lift the veil'); sfx('spell'); emit('magic', player.x, player.y - 16, 90); emit('sparkle', player.x, player.y - 16, 60); flash = 1; await wait(1200); }
      else if (st.do === 'fade') { if (H.ui) await H.ui.fade(600); }
    }
    H.game.state.intro = true;
    if (!H.game.state.party.length) H.game.state.party.push(mkMember('hontori'));
    H.game.addItem('wand', 'Spirit Wand', 'wand'); H.game.addItem('ember_dust', 'Ember Dust', 'backpack'); H.game.save();
    busy = false;
  }
  const wait = ms => new Promise(r => setTimeout(r, ms));
  let flash = 0, bumpT = 0;

  async function goDoor(d) {
    busy = true; sfx('door'); const f = H.ui ? H.ui.fade(600) : Promise.resolve();
    await wait(300); loadMap(d.to, d.tx, d.ty, d.dir); H.game.save(); await f; busy = false;
  }

  // Everything in the world answers the action button.
  function objectAt(x, y) {
    let hit = null;
    (map.props || []).forEach(p => { const i = propInfo(p.type); if (x >= p.x && x < p.x + i.fw && y >= p.y && y < p.y + i.fh) { if (!hit || !i.decor) hit = { o: p, type: p.type, cx: (p.x + i.fw / 2) * T, cy: (p.y + i.fh / 2) * T }; } });
    (map.buildings || []).forEach(b => { const i = H.buildings.info[b.type]; if (x >= b.x && x < b.x + i.fw && y >= b.y && y < b.y + i.fh) hit = { o: b, type: b.type, cx: (b.x + i.fw / 2) * T, cy: (b.y + i.fh) * T - 8 }; });
    return hit;
  }
  function interactAt(x, y) {
    if (!H.interact) return;
    // wall decor hangs one tile above the floor edge, so look one tile further up when facing a wall
    const hit = objectAt(x, y) || (player.dir === 1 ? objectAt(x, y - 1) : null);
    if (!hit) return;
    busy = true; sfx('confirm');
    const c = { say, toast: (t) => H.ui && H.ui.toast(t), emit, sfx, note: (m) => { try { H.audio && H.audio.note(m); } catch (e) {} },
      env, map, mapName, x: hit.cx, y: hit.cy, player, hasSpirit: !!spirit, object: hit.o,
      setTime: (h) => { env.time = h; }, fade: (ms) => (H.ui ? H.ui.fade(ms) : Promise.resolve()) };
    Promise.resolve().then(() => H.interact.run(hit.type, c)).catch(e => console.warn(e)).then(() => { busy = false; });
  }

  // The companion is alive: it hops along the kid's path, dashes to catch up, and plays around when the kid rests.
  function updateSpirit(dt) {
    const sp = spirit;
    if (sp.gx == null) { sp.gx = sp.x; sp.gy = sp.y + 10; sp.h = 0; sp.ph = 0; sp.idle = 0; sp.mode = 'follow'; sp.timer = 1; sp.face = 1; sp.ang = 0; }
    if (sp.mode === 'drop') {
      sp.vh = (sp.vh || 0) - 420 * dt; sp.h += sp.vh * dt;
      if (sp.h <= 0) { if (sp.vh < -90) { sp.vh = -sp.vh * 0.3; sp.h = 0; if (sp.onLand) { const f = sp.onLand; sp.onLand = null; f(); } } else { sp.h = 0; sp.vh = 0; sp.mode = 'rest'; } }
      sp.x = sp.gx; sp.y = sp.gy - 10 - sp.h; sp.moving = false; return;
    }
    if (sp.mode === 'rest' || sp.mode === 'shakeoff') {
      sp.timer -= dt; const wig = sp.mode === 'shakeoff' && sp.timer > 0 ? Math.sin(env.t * 40) * 1.5 : 0;
      sp.x = sp.gx + wig; sp.y = sp.gy - 10; sp.moving = false; return;
    }
    if (sp.mode === 'script') {
      const wp = sp.path && sp.path[0];
      if (!wp) { sp.moving = false; if (sp.onArrive) { const f = sp.onArrive; sp.onArrive = null; f(); } sp.x = sp.gx; sp.y = sp.gy - 10; return; }
      const ddx = wp[0] - sp.gx, ddy = wp[1] - sp.gy, dd = Math.hypot(ddx, ddy), st = 52 * dt;
      if (dd <= st) { sp.gx = wp[0]; sp.gy = wp[1]; sp.path.shift(); } else { sp.gx += ddx / dd * st; sp.gy += ddy / dd * st; }
      if (dd > 0.1) sp.dir = Math.abs(ddx) > Math.abs(ddy) ? (ddx < 0 ? 2 : 3) : (ddy < 0 ? 1 : 0);
      sp.ph += st * 0.16; sp.h = Math.abs(Math.sin(sp.ph)) * 1.6; sp.moving = true;
      sp.x = sp.gx; sp.y = sp.gy - 10 - sp.h; return;
    }
    let tx, ty, speed = 62;
    if (player.moving) { sp.idle = 0; if (sp.mode !== 'follow') { sp.mode = 'follow'; } } else sp.idle += dt;
    if (sp.mode === 'follow') {
      const c = trail.length > 9 ? trail[trail.length - 9] : null;
      if (c && player.moving) { tx = c[0]; ty = c[1]; } else { tx = sp.gx; ty = sp.gy; }
      const far = Math.hypot(player.x - sp.gx, player.y - sp.gy);
      if (far > 34) { tx = player.x; ty = player.y; speed = 95; }
      if (far > 120) { sp.gx = player.x; sp.gy = player.y; }
      if (sp.idle > 2.5) { sp.mode = 'play'; sp.act = 'sit'; sp.timer = 4 + Math.random() * 4; }
    }
    if (sp.mode === 'play') {
      sp.timer -= dt;
      if (sp.timer <= 0) {
        // mostly rest beside the kid; a short calm stroll now and then
        if (Math.random() < 0.25) {
          for (let i = 0; i < 6; i++) { const a = Math.random() * 6.283, d = 12 + Math.random() * 10, px = player.x + Math.cos(a) * d, py = player.y + Math.sin(a) * d * 0.7;
            if (!blocked(Math.floor(px / T), Math.floor((py - 2) / T))) { sp.wx = px; sp.wy = py; break; } }
          sp.act = 'trot'; sp.timer = 2.5;
        } else { sp.act = 'sit'; sp.timer = 5 + Math.random() * 6; sp.face = player.x >= sp.gx ? 1 : -1; }
      }
      if (sp.act === 'trot' && sp.wx != null) { tx = sp.wx; ty = sp.wy; speed = 30; }
      else { tx = sp.gx; ty = sp.gy; }
    }
    const dx = tx - sp.gx, dy = ty - sp.gy, d = Math.hypot(dx, dy);
    let moved = 0;
    sp.v = (sp.v || 0) + ((d > 0.6 ? Math.min(speed, d * 6) : 0) - (sp.v || 0)) * Math.min(1, dt * 8);
    if (d > 0.6) { moved = Math.min(d, sp.v * dt); sp.gx += dx / d * moved; sp.gy += dy / d * moved; if (Math.abs(dx) > 0.8) sp.face = dx > 0 ? 1 : -1; if (moved > 0.05) sp.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0); }
    else if (sp.mode === 'play' && sp.act === 'sit') sp.dir = 0;
    sp.moving = moved > 0.05; sp.sit = !sp.moving && sp.mode === 'play' && sp.act === 'sit';
    // hop while travelling: one bounce every ~11px, settle smoothly when it stops
    if (moved > 0.01) { sp.ph += moved * 0.16; const th = Math.abs(Math.sin(sp.ph)) * 1.6; sp.h += (th - sp.h) * Math.min(1, dt * 12); }
    else { sp.h += (0 - sp.h) * Math.min(1, dt * 14); sp.ph = 0; }
    sp.x = sp.gx; sp.y = sp.gy - 10 - sp.h;
    if (Math.random() < dt * 1.5) emit('ember', sp.x + (Math.random() - .5) * 8, sp.y, 1);
  }

  function tryMove(inp, carry) {
    // keep current axis while both are held, so diagonal presses do not jitter
    let dir;
    if (inp.dx && inp.dy) dir = (player.dir < 2) ? (inp.dy > 0 ? 0 : 1) : (inp.dx < 0 ? 2 : 3);
    else dir = inp.dy > 0 ? 0 : inp.dy < 0 ? 1 : inp.dx < 0 ? 2 : 3;
    player.dir = dir;
    const [ddx, ddy] = DIRS[dir], nx = player.tx + ddx, ny = player.ty + ddy;
    const door = (map.doors || []).find(d => d.x === nx && d.y === ny);
    if (!blocked(nx, ny) || door) { player.moving = true; player.fx = player.tx; player.fy = player.ty; player.tx = nx; player.ty = ny; player.prog = carry || 0; }
    else { player.frame = 0; if (bumpT <= 0) { sfx('bump'); bumpT = 0.4; } }
  }

  // ---------- update
  function update(dt) {
    env.t += dt;
    const targetWind = env.weather === 'wind' ? 0.45 : env.weather === 'rain' ? 0.3 : 0.1;
    env.wind += (targetWind + Math.sin(env.t * 0.4) * 0.1 - env.wind) * dt * 0.8;
    const inp = readInput();
    const menuOpen = !!(H.menu && H.menu.isOpen());
    if (menuOpen) { /* world input paused while a panel is open */ }
    else if (inp.act && H.ui && H.ui.isOpen()) { H.ui.advance(); }
    else if (!busy && !player.moving) {
      if (inp.act) {
        const [ddx, ddy] = DIRS[player.dir]; const n = npcs.find(n => n.x === player.tx + ddx && n.y === player.ty + ddy);
        if (n && n.lines) { busy = true; n.dir = [1, 0, 3, 2][player.dir]; sfx('confirm');
          (async () => { n.talking = true; for (const l of n.lines.slice(0, 2)) await say(n.key, l[0], l[1]); n.talking = false; busy = false; })(); }
        else if (!n) interactAt(player.tx + ddx, player.ty + ddy);
      } else if (inp.dx || inp.dy) tryMove(inp, 0);
    }
    if (player.moving) {
      const run = keys.shift || ((H.ui && H.ui.input && (H.ui.input.run || H.ui.input.back)) ? true : false);
      player.prog += dt / (run ? 0.13 : 0.21);
      if (player.prog >= 1) {
        const left = player.prog - 1; player.moving = false; player.steps++; sfx('step');
        player.x = player.tx * T + 8; player.y = player.ty * T + 15;
        const d = (map.doors || []).find(d => d.x === player.tx && d.y === player.ty);
        if (d) { player.frame = 0; goDoor(d); }
        else if (!env.indoor && tileAt(player.tx, player.ty) === 'tallgrass' && H.game.state.party.length && Math.random() < 0.12) { player.frame = 0; startBattle(); }
        else if (!busy && !menuOpen && !(H.ui && H.ui.isOpen()) && (inp.dx || inp.dy)) tryMove(inp, left); // chain steps with no hitch
        else player.frame = 0;
      }
      if (player.moving) {
        const k = player.prog;
        player.x = (player.fx + (player.tx - player.fx) * k) * T + 8;
        player.y = (player.fy + (player.ty - player.fy) * k) * T + 15;
        player.frame = k < 0.5 ? (player.steps % 2 ? 1 : 3) : (player.steps % 2 ? 2 : 0);
        if (!env.indoor && Math.random() < dt * 5) emit('dust', player.x, player.y, 1);
      }
      const lt = trail[trail.length - 1]; if (!lt || Math.hypot(lt[0] - player.x, lt[1] - player.y) >= 2) { trail.push([player.x, player.y]); if (trail.length > 40) trail.shift(); }
    }
    // villagers glance around now and then
    npcs.forEach(n => { n.look = (n.look ?? Math.random() * 6) - dt; if (n.look <= 0 && !busy) { n.look = 3 + Math.random() * 5; if (Math.random() < 0.6) n.dir = Math.floor(Math.random() * 4); } });
    if (spirit) updateSpirit(dt);
    H.ambientPlayer = { x: player.x, y: player.y };
    if (ambient) try { ambient.update(dt, env); } catch (e) { console.warn(e); ambient = null; }
    try { H.audio && H.audio.update(env); } catch (e) {}
    particles && particles.update(dt, env); weather && !env.indoor && weather.update(dt, env);
    bumpT -= dt; shake = Math.max(0, shake - dt); flash = Math.max(0, flash - dt * 1.5);
    // camera
    const mw = map.w * T, mh = map.h * T;
    const fx0 = camFocus ? camFocus.x : player.x, fy0 = camFocus ? camFocus.y : player.y - 8;
    const tcx = mw <= VW ? -(VW - mw) / 2 : Math.max(0, Math.min(mw - VW, fx0 - VW / 2));
    const tcy = mh <= VH ? -(VH - mh) / 2 : Math.max(0, Math.min(mh - VH, fy0 - VH / 2));
    if (camSnap) { fcx = tcx; fcy = tcy; camSnap = false; }
    const ck = 1 - Math.exp(-dt * (camFocus ? 4 : 12)); fcx += (tcx - fcx) * ck; fcy += (tcy - fcy) * ck;
    camX = Math.round(fcx + (shake ? (Math.random() - .5) * 4 * shake : 0)); camY = Math.round(fcy + (shake ? (Math.random() - .5) * 4 * shake : 0));
  }

  // ---------- render
  function render() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
    ctx.save(); ctx.translate(-camX, -camY);
    const x0 = Math.max(0, Math.floor(camX / T)), y0 = Math.max(0, Math.floor(camY / T));
    const x1 = Math.min(map.w - 1, Math.floor((camX + VW) / T)), y1 = Math.min(map.h - 1, Math.floor((camY + VH) / T));
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const nb = (dx, dy) => tileAt(tx + dx, ty + dy);
      try { tileset.draw(ctx, grid[ty][tx], tx * T, ty * T, tx, ty, env, nb); } catch (e) { ctx.fillStyle = '#f0f'; ctx.fillRect(tx * T, ty * T, T, T); }
    }
    const lights = [];
    const ents = [];
    const pushLight = (l, ox, oy) => l && lights.push({ x: ox + (l.dx || 0), y: oy + (l.dy || 0), r: l.r || 40, color: l.color || '#ffcf7a', flicker: l.flicker ?? true });
    (map.props || []).forEach(p => { const i = propInfo(p.type), px = p.x * T, py = p.y * T; pushLight(i.light, px, py);
      if (i.decor) propDraw(p.type, px, py);
      else ents.push({ y: py + i.fh * T, d: () => { if (!env.indoor) H.fx.shadow(ctx, px + i.fw * 8, py + i.fh * T - 2, i.fw * 7, 3, env); propDraw(p.type, px, py); } }); });
    (map.buildings || []).forEach(b => { const i = H.buildings.info[b.type], px = b.x * T, py = b.y * T;
      (i.lights || []).forEach(l => pushLight(l, px, py));
      ents.push({ y: py + i.fh * T, d: () => { H.fx.shadow(ctx, px + i.fw * 8, py + i.fh * T - 1, i.fw * 8 + 4, 6, env); H.buildings.draw(ctx, b.type, px, py, env); } }); });
    npcs.forEach(n => ents.push({ y: n.py, d: () => { H.fx.shadow(ctx, n.px, n.py, 6, 2, env); H.chars.draw(ctx, n.key, n.px, n.py, n.dir || 0, 0, env, { npc: true, seed: n.seed, idle: n.idle, talking: n.talking }); } }));
    ents.push({ y: player.y, d: () => { H.fx.shadow(ctx, player.x, player.y, 6, 2, env); H.chars.draw(ctx, 'kid', Math.round(player.x), Math.round(player.y), player.dir, player.frame, env); } });
    if (spirit) { lights.push({ x: spirit.x, y: spirit.y, r: 28, color: '#b8642a', flicker: true });
      ents.push({ y: (spirit.gy ?? spirit.y + 10), d: () => { const gy = spirit.gy ?? spirit.y + 10, h = spirit.h || 0;
        H.fx.shadow(ctx, spirit.x, gy, Math.max(3, 5 - h * 0.25), 2, env);
        H.spirits.draw(ctx, spirit.key, Math.round(spirit.x), Math.round(spirit.y), env, { scale: 0.75, dir: spirit.dir || 0, noShadow: true, moving: !!spirit.moving, sit: !!spirit.sit }); } }); }
    (map.lights || []).forEach(l => lights.push(l));
    ents.sort((a, b) => a.y - b.y).forEach(e => { try { e.d(); } catch (err) { console.warn(err); } });
    if (ambient) try { ambient.draw(ctx, env); } catch (e) { console.warn(e); ambient = null; }
    ctx.restore();
    if (weather && !env.indoor) weather.draw(ctx, camX, camY, env);
    if (lighting) lighting.render(ctx, camX, camY, env, lights);
    if (particles) particles.draw(ctx, camX, camY);
    if (flash > 0) { ctx.fillStyle = `rgba(255,240,200,${flash * 0.6})`; ctx.fillRect(0, 0, VW, VH); }
  }

  // ---------- game state, saving (on this device)
  const SAVE_KEY = 'hontori.save.v1';
  const mkMember = (key) => ({ key, nick: null, level: 1, hp: 20, maxHp: 20 });
  H.game = {
    state: { items: [], party: [], intro: false },
    save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ map: mapName, tx: player.tx, ty: player.ty, dir: player.dir, time: env.time, weather: env.weather, state: H.game.state })); return true; } catch (e) { return false; } },
    read() { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { return null; } },
    reset() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} location.href = location.pathname; },
    partyChanged() { const lead = H.game.state.party[0]; if (lead) { if (!spirit) spirit = { key: lead.key, x: player.x + 12, y: player.y - 10 }; else if (spirit.key !== lead.key) { spirit.key = lead.key; emit('sparkle', spirit.x, spirit.y, 14); sfx('sparkle'); } } H.game.save(); },
    addHontori(key) { const p = H.game.state.party; if (p.length >= 5) return false; p.push(mkMember(key)); H.game.partyChanged(); H.menu && H.menu.refresh(); return true; },
    addItem(id, name, icon) { const it = H.game.state.items.find(i => i.id === id); if (it) it.n = (it.n || 1) + 1; else H.game.state.items.push({ id, name, icon, n: 1 }); H.menu && H.menu.refresh(); },
  };

  // ---------- battles
  async function startBattle(enemy) {
    if (busy || !H.battle || !H.game.state.party.length) return;
    busy = true; sfx('spell');
    // what kind of place we are in, from the tiles and props around the player
    let water = 0, trees = 0, tall = 0;
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const id = tileAt(player.tx + dx, player.ty + dy); if (id === 'water') water++; if (id === 'tallgrass') tall++; }
    (map.props || []).forEach(p => { if (/tree|pine/.test(p.type) && Math.abs(p.x - player.tx) < 6 && Math.abs(p.y - player.ty) < 6) trees++; });
    const biome = env.indoor ? 'indoor' : water > 6 ? 'river' : trees > 4 ? 'forest' : 'meadow';
    try { await H.battle.start({ env, enemy, biome }); } catch (e) { console.warn(e); }
    busy = false;
  }
  H.game.battle = startBattle;

  let last = performance.now();
  function loop(now) { checkSize(); const dt = Math.min(0.05, (now - last) / 1000); last = now; update(dt); render(); requestAnimationFrame(loop); }

  H.ui && H.ui.init(document.getElementById('root'));
  // debug url params: ?nointro=1&scene=village&time=21&weather=rain&tx=10&ty=12
  const Q = new URLSearchParams(location.search);
  const sv = (!Q.get('scene') && !Q.get('nointro')) ? H.game.read() : null;
  if (sv && sv.state && sv.state.intro && H.maps[sv.map]) {
    H.game.state = sv.state; loadMap(sv.map, sv.tx, sv.ty, sv.dir); env.time = sv.time; env.weather = sv.weather || 'clear';
    if (sv.state.party[0]) spirit = { key: sv.state.party[0].key, x: player.x + 12, y: player.y - 10 };
  } else {
    loadMap(Q.get('scene') || 'home', Q.get('tx') ? +Q.get('tx') : undefined, Q.get('ty') ? +Q.get('ty') : undefined);
    if (Q.get('time')) env.time = +Q.get('time'); if (Q.get('weather')) env.weather = Q.get('weather');
    if (Q.get('nointro')) { H.game.state.party = [mkMember('hontori')]; H.game.state.intro = true; spirit = { key: 'hontori', x: player.x + 14, y: player.y - 10 }; }
    else (H.title ? H.title.ready : Promise.resolve()).then(() => setTimeout(runIntro, 500));
  }
  H.menu && H.menu.init(document.getElementById('root'));
  requestAnimationFrame(loop);
  setInterval(() => { if (H.game.state.intro && !busy) H.game.save(); }, 30000);
  setInterval(() => H.ui && H.ui.hud(env, map.name || mapName), 1000);
})();
