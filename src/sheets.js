window.H = window.H || {};
/*
  H.sheets: sprite sheets. Art that the modules paint in code is also shipped as packed image
  files (assets/sheets/<group>-<n>.png). Drawing copies one rectangle out of a sheet; the module's
  own painter stays as the always-correct fallback, so the game can never show a hole.

  THE CONTRACT (every art module codes against exactly this)

  1. H.sheets.draw(ctx, key, dx, dy, paint, dw, dh) -> true when it came from a sheet
       Draws sprite `key` so that the top-left of its ORIGINAL, untrimmed picture lands at (dx, dy).
       Baked and its sheet image loaded: one drawImage from the sheet (trim offsets applied).
       Otherwise: var c = paint(); if (c) ctx.drawImage(c, dx, dy).
       `paint` is the module's existing function that returns its cached canvas (painting it on
       first use). Pass a function that already exists; do not build a closure per call.
       dw, dh are optional: the on-screen size of the full untrimmed picture when the module draws
       scaled (for example a 32x32 tile shown as 16x16). When given, the trimmed rectangle and its
       offsets are scaled by the same factors, and the fallback is ctx.drawImage(c, dx, dy, dw, dh).
       draw never throws and allocates nothing. It does not touch the context state.

  2. H.sheets.rec(group, key, canvas)
       A module calls this right after it creates and paints a cached canvas, and only when
       `H.sheets && H.sheets.recording` is true (the build tool's record mode).

  3. H.sheets.enumerate(group, fn)
       A module registers one function that makes it produce every picture it can (by calling its
       own cache getters for every key). The build tool calls every registered function, then
       collects everything that was passed to rec().

  4. H.sheets.has(key)      -> true when the key is baked AND its sheet image is loaded
     H.sheets.ready(group)  -> Promise, resolved when every sheet of the group is loaded (or failed;
                               it never rejects). Call it to preload before a scene needs the art.
     H.sheets.stats()       -> { keys, sheets, loaded, bytes, fromSheet, painted, loads, dropped, list }
                               bytes = decoded size of the loaded sheet images (width x height x 4);
                               fromSheet / painted = draws served each way; loads = image fetches so far;
                               dropped = images let go by trim() or by idling;
                               list = one { id, group, w, h, state, bytes, idleMs } per sheet
                               (state 0 not loaded, 1 loading, 2 ready, 3 failed)

  5. Keys are strings '<module>:<the module's own cache key>', built once and reused (no string
     building per frame). Groups: 'outdoor', 'indoor', 'people', 'hontori', 'icons'.

  6. URL flags: ?sheets=record (build tool: everything is painted and recorded),
                ?sheets=off    (force the painted path, for comparison).

  7. Every call from a module is guarded with `H.sheets &&`. A missing sheets.js, a missing
     assets/sheets/ folder or a sheet that fails to load all mean today's behaviour exactly.

  EXTRAS (optional, same guard)
     H.sheets.baked(key)      -> true when the key is in the index, whether or not its image is loaded
     H.sheets.onLoad(fn)      -> fn(group) is called each time a sheet image finishes loading. A module
                                 uses it to drop painted cache entries whose key now answers has(),
                                 so the painted duplicate is not kept in memory.
     H.sheets.drawPart(ctx, key, sx, sy, sw, sh, dx, dy, dw, dh, paint)
                              -> copies one part of a picture (a cell of a repeating ground texture):
                                 the nine-argument drawImage, from the sheet when the picture is baked
                                 whole (untrimmed), from paint() otherwise.
     H.sheets.probe(fn, maxMs)
                              -> Promise. Runs fn (one draw of the scene) as a dry run: baked pictures are
                                 neither drawn nor painted, they only ask for their sheets. Resolves when
                                 those sheets are in memory (or after maxMs, default 3000). Draw the first
                                 real frame after it and nothing is painted that a sheet serves.
     H.sheets.ready(name)     -> also takes a sheet's own name without its number ('outdoor-trees'),
                                 to preload one part of a group.
     H.sheets.rec(group, key, canvas, part)
                              -> the optional fourth argument names the sheet inside the group that the
                                 picture should be packed into ('edges-village' -> outdoor-edges-village-0.png),
                                 for pictures that are only ever needed together. Without it the build
                                 tool decides (one part per module unless its table says otherwise).
     H.sheets.recording       -> true in record mode
     H.sheets.off             -> true when sheets are switched off by the URL flag

  MEMORY: a sheet image is fetched the first time one of its pictures is asked for. It is let go again
     - by H.sheets.trim(maxBytes): least recently used first, until the decoded total is under the
       cap; a sheet drawn from in the last five seconds is never dropped. Returns the bytes still held.
     - on its own after H.sheets.idleMs (default 90000) in which nothing was drawn from it; set
       H.sheets.idleMs = 0 to switch that off and rely on trim() alone.
  A dropped sheet is fetched again (from the browser's cache) the next time one of its pictures is
  asked for, and the painters cover the gap. No timer runs: time is read once every 256 sheet draws.

  Files: assets/sheets/index.js (a classic script that sets H.sheetIndex, so it works from file:
  and needs no fetch) and assets/sheets/<group>-<n>.png. Both are written by tools/build_sheets.js.
  Rebuild after any art change:  node tools/build_sheets.js
*/
(function () {
  'use strict';
  var H = window.H;
  var search = '';
  try { search = String(window.location.search || ''); } catch (e) { search = ''; }
  var flag = (/[?&]sheets=(\w+)/.exec(search) || [])[1] || '';
  var recording = flag === 'record', off = flag === 'off' || recording;

  /* where this script lives decides where the sheets live, so a page in another folder still finds them */
  var base = 'assets/sheets/', local = false;
  try { local = window.location.protocol === 'file:'; } catch (e) { local = false; }
  try {
    var cs = document.currentScript && document.currentScript.src;
    if (cs && /src\/sheets\.js/.test(cs)) base = cs.replace(/src\/sheets\.js.*$/, 'assets/sheets/');
  } catch (e) { base = 'assets/sheets/'; }

  /* Opened straight from disk (file:), a browser treats a picture file as foreign: a canvas that
     received it can no longer be read back. So there only canvases that are on the page take sheet
     pixels; off-screen ones (which a module may read back) keep the painted path. */
  function usable(ctx) { return !local || !!(ctx.canvas && ctx.canvas.isConnected); }

  /* keys: key -> position of its entry in E; an entry is nine numbers in a row:
     sheet, x, y, w, h, offsetX, offsetY, fullW, fullH. One flat array keeps thousands of entries small. */
  var keys = {}, nKeys = 0, E = new Int16Array(0);
  /* sheet: { id, group, w, h, state, img, waiters }   state: 0 idle, 1 loading, 2 ready, 3 failed */
  var sheets = [], byGroup = {};
  var listeners = [], enumerators = [], recorded = {}, recOrder = [];
  var nSheet = 0, nPaint = 0;
  /* Last use. Reading the time on every draw would cost more than the draw, so the time is read
     once every 256 sheet draws and each sheet is stamped with that reading. No timer runs. */
  var clock = 0, lastSweep = 0, nLoads = 0, nDrops = 0;
  var SWEEP_MS = 10000, KEEP_MS = 5000;
  function time() { try { return performance.now(); } catch (e) { return Date.now(); } }
  function drop(s) { s.img = null; s.state = 0; nDrops++; }
  function beat() {
    clock = time();
    if (clock - lastSweep < SWEEP_MS) return;
    lastSweep = clock;
    var idle = H.sheets.idleMs;
    if (!(idle > 0)) return;
    /* a sheet nothing was drawn from for idleMs (another map's ground, another weather's trees) is let go */
    for (var i = 0; i < sheets.length; i++) if (sheets[i].state === 2 && clock - sheets[i].used > idle) drop(sheets[i]);
  }
  /* trim(maxBytes): lets the least recently used sheet images go until the decoded total
     (width x height x 4) is at most maxBytes. A sheet drawn from in the last five seconds is never
     dropped, so the total can stay above the cap while the scene really needs that much.
     Returns the bytes still held. */
  function trim(maxBytes) {
    var now = time(), total = 0, live = [], i;
    try {
      for (i = 0; i < sheets.length; i++) if (sheets[i].state === 2) { total += sheets[i].w * sheets[i].h * 4; live.push(sheets[i]); }
      if (!(maxBytes >= 0) || total <= maxBytes) return total;
      live.sort(function (a, b) { return a.used - b.used; });
      for (i = 0; i < live.length && total > maxBytes; i++) {
        if (now - live[i].used < KEEP_MS) break;
        total -= live[i].w * live[i].h * 4;
        drop(live[i]);
      }
    } catch (e) { /* trimming is housekeeping: it never throws */ }
    return total;
  }

  /* The index (assets/sheets/index.js) is written small. One row per sheet:
       [name, group, width, height, start, sizes, names, numbers]
     start    what every key of the sheet begins with, written once
     sizes    the untrimmed picture sizes that occur in the sheet: w0, h0, w1, h1, ...
     names    the keys in sorted order, separated by a space; each is one character saying how many
              characters it shares with the key before it (after `start`), then its own ending
     numbers  thirteen characters per key: x, y, w, h, offsetX, offsetY (two characters each, a number
              0..4095 in base 64) and one character choosing the size
     A character stands for its code minus 40. */
  function adopt(ix) {
    if (!ix || !ix.sheets || nKeys) return;
    var i, r, n = 0, map = {}, flat, names, nums, prev, key, tail, k, p, j, q, sz;
    function v1(str, at) { return str.charCodeAt(at) - 40; }
    try {
      for (i = 0; i < ix.sheets.length; i++) n += ix.sheets[i][7].length / 13;
      flat = new Int16Array(n * 9);
      n = 0;
      for (i = 0; i < ix.sheets.length; i++) {
        r = ix.sheets[i];
        sheets.push({ id: r[0], group: r[1], w: r[2], h: r[3], state: 0, img: null, waiters: [], used: 0 });
        (byGroup[r[1]] = byGroup[r[1]] || []).push(i);
        var part = String(r[0]).replace(/-\d+$/, '');
        if (part !== r[1]) (byGroup[part] = byGroup[part] || []).push(i);
        names = r[6] ? r[6].split(' ') : []; nums = r[7]; prev = '';
        for (k = 0; k < names.length; k++) {
          tail = prev.slice(0, v1(names[k], 0)) + names[k].slice(1); prev = tail;
          key = r[4] + tail; p = k * 13; q = n * 9;
          flat[q] = i;
          for (j = 0; j < 6; j++) flat[q + 1 + j] = v1(nums, p + j * 2) * 64 + v1(nums, p + j * 2 + 1);
          sz = v1(nums, p + 12) * 2;
          flat[q + 7] = r[5][sz]; flat[q + 8] = r[5][sz + 1];
          map[key] = q;
          n++;
        }
      }
      keys = map; E = flat; nKeys = n;
      /* the table has been read: the script's own copy is not needed any more */
      ix.sheets = null;
    } catch (e) {
      /* an index that cannot be read means no sheets: everything stays painted */
      keys = {}; E = new Int16Array(0); nKeys = 0; sheets.length = 0; byGroup = {};
    }
  }

  function settle(s, state) {
    s.state = state;
    if (state !== 2) s.img = null;
    var w = s.waiters, i; s.waiters = [];
    for (i = 0; i < w.length; i++) { try { w[i](); } catch (e) { /* a waiter must not stop the others */ } }
    if (state === 2) for (i = 0; i < listeners.length; i++) { try { listeners[i](s.group); } catch (e2) { /* same */ } }
  }
  function load(s) {
    if (s.state) return;
    s.state = 1; s.used = clock = time(); nLoads++;
    try {
      var img = new Image();
      img.decoding = 'async';
      img.onload = function () {
        s.img = img;
        if (img.decode) img.decode().then(function () { settle(s, 2); }, function () { settle(s, 2); });
        else settle(s, 2);
      };
      img.onerror = function () { settle(s, 3); };
      img.src = base + s.id + '.png';
    } catch (e) { settle(s, 3); }
  }

  function draw(ctx, key, dx, dy, paint, dw, dh) {
    var e = keys[key], s, c, w, h;
    try {
      if (e !== undefined) {
        s = sheets[E[e]];
        if (probing && s.state !== 3) { if (s.state === 0) load(s); return true; }
        if (s.state === 2 && usable(ctx)) {
          s.used = clock;
          w = E[e + 3]; h = E[e + 4];
          if (w) {
            if (dw === undefined) ctx.drawImage(s.img, E[e + 1], E[e + 2], w, h, dx + E[e + 5], dy + E[e + 6], w, h);
            else ctx.drawImage(s.img, E[e + 1], E[e + 2], w, h, dx + E[e + 5] * dw / E[e + 7], dy + E[e + 6] * dh / E[e + 8], w * dw / E[e + 7], h * dh / E[e + 8]);
          }
          if ((++nSheet & 255) === 0) beat();
          return true;
        }
        if (s.state === 0) load(s);
      }
      c = paint ? paint() : null;
      if (c) {
        if (dw === undefined) ctx.drawImage(c, dx, dy); else ctx.drawImage(c, dx, dy, dw, dh);
        nPaint++;
      }
    } catch (err) { /* a draw call never throws */ }
    return false;
  }

  function drawPart(ctx, key, sx, sy, sw, sh, dx, dy, dw, dh, paint) {
    var e = keys[key], s, c;
    try {
      if (e !== undefined && E[e + 3] === E[e + 7] && E[e + 4] === E[e + 8]) {
        s = sheets[E[e]];
        if (probing && s.state !== 3) { if (s.state === 0) load(s); return true; }
        if (s.state === 2 && usable(ctx)) {
          s.used = clock;
          ctx.drawImage(s.img, E[e + 1] + sx, E[e + 2] + sy, sw, sh, dx, dy, dw, dh);
          if ((++nSheet & 255) === 0) beat();
          return true;
        }
        if (s.state === 0) load(s);
      }
      c = paint ? paint() : null;
      if (c) { ctx.drawImage(c, sx, sy, sw, sh, dx, dy, dw, dh); nPaint++; }
    } catch (err) { /* a draw call never throws */ }
    return false;
  }

  function has(key) { var e = keys[key]; return e !== undefined && sheets[E[e]].state === 2; }
  function baked(key) { return keys[key] !== undefined; }

  function ready(group) {
    var ids = byGroup[group] || [], left = ids.length;
    return new Promise(function (resolve) {
      if (!left) { resolve(); return; }
      function one() { if (--left <= 0) resolve(); }
      for (var i = 0; i < ids.length; i++) {
        var s = sheets[ids[i]];
        if (s.state >= 2) one(); else { s.waiters.push(one); load(s); }
      }
    });
  }

  /* probe(fn, maxMs): runs fn (for example one draw of the scene) without drawing or painting any
     baked picture: each one only asks for its sheet. Resolves when those sheets have arrived, or after
     maxMs (default 3000) so a slow network never holds the game. Use it to have a scene's sheets in
     memory before its first real frame, so nothing is painted that a sheet would have served. */
  var probing = false;
  function probe(fn, maxMs) {
    probing = true;
    try { fn(); } catch (e) { /* the probe is a dry run */ }
    probing = false;
    return new Promise(function (resolve) {
      var left = 0, done = false, i;
      function finish() { if (!done) { done = true; resolve(); } }
      function one() { if (--left <= 0) finish(); }
      for (i = 0; i < sheets.length; i++) if (sheets[i].state === 1) { left++; sheets[i].waiters.push(one); }
      if (!left) { finish(); return; }
      try { setTimeout(finish, maxMs > 0 ? maxMs : 3000); } catch (e) { finish(); }
    });
  }

  function stats() {
    var loaded = 0, bytes = 0, list = [], now = time();
    for (var i = 0; i < sheets.length; i++) {
      var s = sheets[i];
      if (s.state === 2) { loaded++; bytes += s.w * s.h * 4; }
      list.push({ id: s.id, group: s.group, w: s.w, h: s.h, state: s.state, bytes: s.w * s.h * 4, idleMs: s.state === 2 ? Math.round(now - s.used) : -1 });
    }
    return { keys: nKeys, sheets: sheets.length, loaded: loaded, bytes: bytes, fromSheet: nSheet, painted: nPaint, loads: nLoads, dropped: nDrops, list: list };
  }

  var recAt = 0;
  function rec(group, key, canvas, part) {
    if (!recording) return;
    if (!canvas || typeof key !== 'string') { recAt = time(); return; }
    if (!recorded[key]) recOrder.push(key);
    /* ms: time since the previous picture was recorded, which is about what this one took to paint */
    var now = time();
    recorded[key] = { group: group, canvas: canvas, part: part || '', ms: now - recAt };
    recAt = now;
  }
  function enumerate(group, fn) { if (typeof fn === 'function') enumerators.push({ group: group, fn: fn }); }
  function onLoad(fn) { if (typeof fn === 'function') listeners.push(fn); }

  H.sheets = {
    draw: draw, drawPart: drawPart, has: has, baked: baked, ready: ready, probe: probe, stats: stats, trim: trim,
    idleMs: 90000,
    rec: rec, record: rec, enumerate: enumerate, onLoad: onLoad,
    recording: recording, off: off,
    /* for the build tool only */
    _enumerators: enumerators, _recorded: recorded, _recOrder: recOrder
  };

  if (off) return;
  if (H.sheetIndex) { adopt(H.sheetIndex); return; }
  /* The index is a classic script. While the page is still being parsed it is written in place, so
     it is in memory before the first art module runs; later than that it is appended and adopted
     when it arrives. A missing file leaves the table empty: everything stays painted. */
  try {
    if (document.readyState === 'loading' && document.currentScript) {
      document.write('<script src="' + base + 'index.js" onload="window.H&&H.sheets&&H.sheets._adopt&&H.sheets._adopt()"><\/script>');
    } else {
      var tag = document.createElement('script');
      tag.src = base + 'index.js';
      tag.onload = function () { adopt(H.sheetIndex); };
      document.head.appendChild(tag);
    }
  } catch (e) { /* no index: painted path */ }
  H.sheets._adopt = function () { adopt(H.sheetIndex); };
})();
