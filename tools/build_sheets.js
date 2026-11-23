/*
  Builds the sprite sheets:  node tools/build_sheets.js

  Opens the game in record mode (?sheets=record) in a headless browser, asks every art module for
  every picture it can paint (the functions registered with H.sheets.enumerate), trims each picture
  to its visible pixels, packs them into sheets of at most 2048 x 2048 with a 1 px clear gutter, and
  writes assets/sheets/<name>-<n>.png plus assets/sheets/index.js.

  The build is repeatable: the page runs with no animation frames and a fixed random seed, pictures
  are sorted by key, and identical pictures share one rectangle. Running it twice gives the same files.

  Options:  --port 8123   static server port (started here if nothing answers)
            --out  dir    output folder (default assets/sheets)
            --only group  bake one group only  (for a quick look: the written index then holds that group alone)
            --skip group  bake everything but one group
*/
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PLAYWRIGHT = process.env.HONTORI_PLAYWRIGHT || '/Users/hm/Desktop/files/dev/game/node_modules/playwright';
const CHROME = process.env.HONTORI_CHROME || '/Users/hm/Library/Caches/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const MAX = 2048, GUTTER = 1;

function arg(name, def) { const i = process.argv.indexOf('--' + name); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : def; }
const PORT = +arg('port', 8123), OUT = path.resolve(ROOT, arg('out', 'assets/sheets')), ONLY = arg('only', ''), SKIP = arg('skip', '');
/* Hontori are never baked (the owner's decision): every kind, stage and size is painted by code. Their
   module keeps its H.sheets.draw calls, which simply fall back to the painters. */
const NEVER = { hontori: 'hontori stay fully painted by code (owner decision): every kind x stage x size is about 34,000 pictures' };
const wanted = g => (!ONLY || g === ONLY) && g !== SKIP && !NEVER[g];

/* The argument handed to a group's enumerator. A module bakes its own default when its group is not
   listed; list a group here to widen or narrow what is baked without touching the module. */
const ENUM_ARGS = {
  /* people: level 0 = walking and standing (breath, blink) for every character, and the portraits.
     Levels 1 to 3 add the idle gestures and talking poses: tens of thousands of pictures, left painted. */
  people: 0
};

/* Which sheet a picture goes to. First match wins; anything else goes to '<group>-<module>'.
   A sheet image is loaded the first time one of its pictures is asked for, so pictures that are
   needed together belong together and rarely used ones get their own sheet. */
const PARTS = [
  /* trees and bushes in the wind: '<module>:<plant>:b<bend>p<phase>', bend -4..10. One sheet per plant
     and wind band: a calm day leans them -2..4, a windy one up to 10 (bends the wind formula cannot
     reach are left out by DROP below). */
  [/^(?:props|oplus):([a-z_]+):b(-[12]|[0-4])p\d+$/, m => 'outdoor-' + m[1] + '-calm'],
  [/^(?:props|oplus):([a-z_]+):b([5-9]|10)p\d+$/, m => 'outdoor-' + m[1] + '-windy'],
  /* buildings come in a day and a night picture; only one of the two is on screen */
  [/^bld:[a-z_]+?S?D\d*$/, 'outdoor-buildings-day'],
  [/^bld:[a-z_]+?S?N\d*$/, 'outdoor-buildings-night'],
  /* people: one sheet per character (walk and standing frames and the portrait) */
  [/^chars:portrait\/([a-z_0-9]+)$/i, m => 'people-' + m[1]],
  [/^chars:([a-z_0-9]+)\//i, m => 'people-' + m[1]],
  /* hontori: one sheet per kind and stage (a creature's frames are needed together and most kinds are
     not on screen), and one sheet for the portraits (menus show portraits only) */
  [/^spirits:portrait\|/, 'hontori-portraits'],
  [/^spirits:([^|]+)\|[^|]+\|[^|]+\|[^|]+\|(\d+)\|/, m => 'hontori-' + m[1] + '-s' + m[2]],
  [/^tiles:bltall/, 'outdoor-tallgrass'],
  [/^tiles:wt/, 'outdoor-water'],
  [/^tiles:/, 'outdoor-ground']
];
function partOf(group, key, part) {
  if (part) return group + '-' + String(part).replace(/[^a-z0-9_-]/gi, '');
  for (const [re, name] of PARTS) { const m = re.exec(key); if (m) return typeof name === 'function' ? name(m).replace(/[^a-z0-9_-]/gi, '') : name; }
  const mod = key.split(':')[0].replace(/[^a-z0-9_]/gi, '');
  return group + '-' + mod;
}

/* Pictures that are NOT baked although their module can record them, each with its reason. A sheet has
   to pay for its download and its lines in the index: it does when the pictures are costly to paint or
   heavy to keep as canvases (trees in the wind, buildings, people), and it does not for thousands of
   small per-cell tiles that take a twentieth of a millisecond each to paint. The summary prints what
   each rule left out, so the choice can be revisited with numbers. First match wins. */
const REACH = { bush: [-1, 6], butterfly_bush: [-1, 7] };
const DROP = [
  [k => { const m = /^(?:props|oplus):([a-z_]+):b(-?\d+)p\d+$/.exec(k); if (!m) return false; const r = REACH[m[1]] || [-2, 10]; return +m[2] < r[0] || +m[2] > r[1]; },
    'tree and bush bends the wind formula can never reach'],
  [/^tiles:e/, 'ground edges, one picture per map cell: cheap to paint, and each needs its own line in the index'],
  [/^tiles:bltall/, 'tall grass: 672 small pictures of which a map shows a few dozen; the sheet would hold more memory than painting does'],
  [/^tiles:wt/, 'water frames: opaque 128x128 pictures, the same memory either way and quick to paint'],
  [/^(iplus:(floor|carpet)_[a-z]+\d+_\d+s?$|tin:|hall:moss\d+_\d+)/, 'indoor floor, rug and wall tiles, one picture per map cell: cheap to paint, and each needs its own line in the index']
];
function dropped(key) {
  for (let i = 0; i < DROP.length; i++) { const t = DROP[i][0]; if (typeof t === 'function' ? t(key) : t.test(key)) return i; }
  return -1;
}

/* What is known to stay painted at run time, printed with the summary. */
const PAINTED = [
  ['hontori', NEVER.hontori],
  ['people', 'baked: walk and standing frames and portraits. Painted: idle gestures and talking poses (levels 1 to 3 of the enumerator)'],
  ['icons', 'icons.js and item_icons.js: their pictures are handed out as data URLs and canvases for the interface (DOM), not drawn through a draw call, so there is no rectangle to copy; about 0.03 MB in all'],
  ['outdoor', 'tiles: water sparkles and sand shells are a few filled rectangles per frame, never cached']
];

function ping() {
  return new Promise(res => {
    const r = http.get({ host: 'localhost', port: PORT, path: '/index.html', timeout: 1500 }, x => { x.resume(); res(x.statusCode === 200); });
    r.on('error', () => res(false)); r.on('timeout', () => { r.destroy(); res(false); });
  });
}
async function server() {
  if (await ping()) return null;
  const p = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 40; i++) { await new Promise(r => setTimeout(r, 150)); if (await ping()) return p; }
  p.kill(); throw new Error('could not start a static server on port ' + PORT);
}

/* shelf packer: tallest first, rows filled left to right; new sheet when the height runs out */
function pack(rects, width) {
  const sheets = []; let cur = null, x = 0, y = 0, rowH = 0;
  const open = () => { cur = { w: 0, h: 0, items: [] }; sheets.push(cur); x = 0; y = 0; rowH = 0; };
  open();
  for (const r of rects) {
    const w = r.w + GUTTER, h = r.h + GUTTER;
    if (x + w > width) { x = 0; y += rowH; rowH = 0; }
    if (y + h > MAX) { open(); }
    r.x = x; r.y = y; cur.items.push(r);
    x += w; if (h > rowH) rowH = h;
    if (x - GUTTER > cur.w) cur.w = x - GUTTER;
    if (y + r.h > cur.h) cur.h = y + r.h;
  }
  return sheets;
}
function bestPack(rects) {
  const widest = rects.reduce((m, r) => Math.max(m, r.w), 1);
  let best = null;
  for (const width of [128, 256, 384, 512, 768, 1024, 1536, 2048]) {
    if (width < widest) continue;
    /* pack() writes the place into the rectangles, so each try is copied out at once */
    const s = pack(rects, width).map(q => ({ w: q.w, h: q.h, items: q.items.map(r => ({ id: r.id, x: r.x, y: r.y })) }));
    const area = s.reduce((a, q) => a + q.w * q.h, 0);
    /* fewer sheets first, then the smaller area, then the squarer shape */
    const score = s.length * 1e12 + area * 1e3 + Math.abs(s[0].w - s[0].h);
    if (!best || score < best.score) best = { score, sheets: s };
  }
  return best.sheets;
}

(async () => {
  const srv = await server();
  const { chromium } = require(PLAYWRIGHT);
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
  /* a still, repeatable page: no frames are ever drawn and Math.random is a fixed sequence */
  await page.addInitScript(() => {
    let a = 0x9e3779b9;
    Math.random = function () { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    window.requestAnimationFrame = function () { return 0; };
  });
  await page.goto('http://localhost:' + PORT + '/?sheets=record&debug=1&scene=village&time=12', { waitUntil: 'load' });
  await page.waitForTimeout(300);
  const ok = await page.evaluate(() => !!(window.H && H.sheets && H.sheets.recording));
  if (!ok) throw new Error('record mode did not start (is src/sheets.js loaded?)');

  /* 1. every module paints everything it can */
  const enums = await page.evaluate(() => H.sheets._enumerators.map(e => e.group));
  const t0 = Date.now(), enumErrors = [];
  for (let i = 0; i < enums.length; i++) {
    if (!wanted(enums[i])) continue;
    const err = await page.evaluate(async ([i, a]) => {
      /* the first picture of an enumerator is timed from here, not from the previous enumerator */
      H.sheets.rec('', '', null);
      try { await H.sheets._enumerators[i].fn(a === null ? undefined : a); return ''; } catch (e) { return String(e && e.stack || e); }
    }, [i, ENUM_ARGS[enums[i]] === undefined ? null : ENUM_ARGS[enums[i]]]);
    if (err) enumErrors.push(enums[i] + ': ' + err);
  }

  /* 2. measure: trimmed bounds and a content hash of every recorded picture */
  const metas = await page.evaluate(() => {
    const R = H.sheets._recorded, out = [];
    Object.keys(R).sort().forEach(key => {
      const c = R[key].canvas, w = c.width | 0, h = c.height | 0;
      const m = { key: key, group: R[key].group, part: R[key].part || '', ms: R[key].ms || 0, fw: w, fh: h, x: 0, y: 0, w: 0, h: 0, hash: '0' };
      out.push(m);
      if (!w || !h) return;
      let d;
      try { d = c.getContext('2d').getImageData(0, 0, w, h).data; } catch (e) { m.err = String(e); return; }
      let x0 = w, y0 = h, x1 = -1, y1 = -1, x, y;
      for (y = 0; y < h; y++) for (x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < 0) return;
      m.x = x0; m.y = y0; m.w = x1 - x0 + 1; m.h = y1 - y0 + 1;
      let h1 = 0x811c9dc5, h2 = 0x1b873593;
      for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) {
        const i = (y * w + x) * 4, a = d[i + 3];
        /* pixels with no alpha count as empty whatever colour hides in them */
        const v = a ? ((d[i] << 24) | (d[i + 1] << 16) | (d[i + 2] << 8) | a) : 0;
        h1 = Math.imul(h1 ^ v, 0x01000193); h2 = Math.imul(h2 + v, 0x85ebca6b) ^ (h2 >>> 13);
      }
      m.hash = (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16);
    });
    return out;
  });
  const bad = metas.filter(m => m.err);
  const left = DROP.map(d => ({ why: d[1], n: 0, px: 0, ms: 0 }));
  const list = metas.filter(m => {
    if (m.err || !wanted(m.group)) return false;
    const d = dropped(m.key);
    if (d < 0) return true;
    left[d].n++; left[d].px += m.w * m.h; left[d].ms += m.ms;
    return false;
  });

  /* 3. group into parts, share identical pictures, pack */
  const parts = {};
  for (const m of list) { const pn = partOf(m.group, m.key, m.part); (parts[pn] = parts[pn] || { group: m.group, metas: [] }).metas.push(m); }
  const sheetList = [], index = {}, summary = [];
  let plan = [];
  for (const name of Object.keys(parts).sort()) {
    const P = parts[name], uniq = new Map(), rects = [];
    for (const m of P.metas) {
      if (!m.w) continue;
      const id = m.w + 'x' + m.h + ':' + m.hash;
      if (!uniq.has(id)) { const r = { id, w: m.w, h: m.h, src: m }; uniq.set(id, r); rects.push(r); }
    }
    rects.sort((a, b) => b.h - a.h || b.w - a.w || (a.src.key < b.src.key ? -1 : 1));
    const packed = rects.length ? bestPack(rects) : [];
    const where = {};
    packed.forEach((s, n) => {
      const sid = name + '-' + n, si = sheetList.length;
      sheetList.push([sid, P.group, s.w, s.h]);
      plan.push({ sid, w: s.w, h: s.h, items: s.items.map(it => { const r = uniq.get(it.id); where[it.id] = [si, it.x, it.y]; return { key: r.src.key, sx: r.src.x, sy: r.src.y, w: r.w, h: r.h, x: it.x, y: it.y }; }) });
    });
    const anySheet = sheetList.length - 1;
    for (const m of P.metas) {
      /* an empty picture is listed (so nothing is painted for it) when its part has a sheet at all */
      if (!m.w) { if (packed.length) index[m.key] = [anySheet, 0, 0, 0, 0, 0, 0, m.fw, m.fh]; continue; }
      const q = where[m.w + 'x' + m.h + ':' + m.hash];
      index[m.key] = [q[0], q[1], q[2], m.w, m.h, m.x, m.y, m.fw, m.fh];
    }
    summary.push({ name, group: P.group, sprites: P.metas.length, unique: rects.length, empty: P.metas.filter(m => !m.w).length, ms: P.metas.reduce((a, m) => a + m.ms, 0),
      fullPx: P.metas.reduce((a, m) => a + m.fw * m.fh, 0), trimPx: rects.reduce((a, r) => a + r.w * r.h, 0), sheets: packed.map(s => s.w + 'x' + s.h), sheetPx: packed.reduce((a, s) => a + s.w * s.h, 0), bytes: 0 });
  }

  /* 4. the page draws each sheet from the recorded canvases and hands back the PNG */
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of fs.readdirSync(OUT)) if (/\.png$/.test(f) || f === 'index.js') fs.unlinkSync(path.join(OUT, f));
  const bytesOf = {};
  for (const s of plan) {
    const url = await page.evaluate(s => {
      const c = document.createElement('canvas'); c.width = s.w; c.height = s.h;
      const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
      const R = H.sheets._recorded;
      for (const it of s.items) g.drawImage(R[it.key].canvas, it.sx, it.sy, it.w, it.h, it.x, it.y, it.w, it.h);
      return c.toDataURL('image/png');
    }, s);
    const buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
    fs.writeFileSync(path.join(OUT, s.sid + '.png'), buf);
    bytesOf[s.sid] = buf.length;
  }
  for (const q of summary) q.bytes = Object.keys(bytesOf).filter(id => id.replace(/-\d+$/, '') === q.name).reduce((a, id) => a + bytesOf[id], 0);

  /* 5. the index, written small (see the format in the file's own header and in src/sheets.js):
        per sheet the keys are sorted, their common start is written once, each key then gives only
        how many characters it shares with the key before it and its own ending; the numbers are
        packed two characters each. */
  const A0 = 40, enc1 = n => String.fromCharCode(A0 + n), enc2 = n => enc1(n >> 6) + enc1(n & 63);
  const rows = sheetList.map(() => []);
  for (const k of Object.keys(index)) rows[index[k][0]].push(k);
  const outSheets = sheetList.map((sh, si) => {
    const ks = rows[si].sort();
    let pre = ks.length ? ks[0] : '';
    for (const k of ks) { let i = 0; while (i < pre.length && i < k.length && pre[i] === k[i]) i++; pre = pre.slice(0, i); }
    const sizes = [], sizeAt = {}; let names = '', nums = '', prev = '';
    for (const k of ks) {
      const e = index[k], tail = k.slice(pre.length);
      if (/ /.test(k)) throw new Error('a key may not hold a space: ' + k);
      let sh2 = 0; while (sh2 < 63 && sh2 < prev.length && sh2 < tail.length && prev[sh2] === tail[sh2]) sh2++;
      names += (names ? ' ' : '') + enc1(sh2) + tail.slice(sh2); prev = tail;
      const sz = e[7] + 'x' + e[8];
      if (sizeAt[sz] === undefined) { sizeAt[sz] = sizes.length / 2; sizes.push(e[7], e[8]); }
      if (sizeAt[sz] > 63) throw new Error('more than 64 picture sizes in sheet ' + sh[0]);
      for (let j = 1; j <= 6; j++) { if (e[j] < 0 || e[j] > 4095) throw new Error('number out of range in ' + k); nums += enc2(e[j]); }
      nums += enc1(sizeAt[sz]);
    }
    return [sh[0], sh[1], sh[2], sh[3], pre, sizes, names, nums];
  });
  const js = '/* Written by tools/build_sheets.js. Do not edit: rebuild with  node tools/build_sheets.js\n' +
    '   One row per sheet: [name, group, width, height, key start, sizes, keys, numbers]. The format is described in src/sheets.js. */\n' +
    'window.H = window.H || {};\nwindow.H.sheetIndex = { v: 2, sheets: [\n' + outSheets.map(r => JSON.stringify(r)).join(',\n') + '\n] };\n';
  fs.writeFileSync(path.join(OUT, 'index.js'), js);

  /* summary */
  const mb = n => (n / 1048576).toFixed(2) + ' MB', kb = n => Math.round(n / 1024) + ' KB';
  console.log('enumerators: ' + enums.join(', ') + '   (' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)');
  console.log('\npart                      sprites unique empty  painted size  trimmed  in memory  PNG   paint ms  sheets');
  const tot = { sprites: 0, unique: 0, fullPx: 0, trimPx: 0, sheetPx: 0, bytes: 0, sheets: 0 };
  for (const q of summary) {
    console.log(q.name.padEnd(26) + String(q.sprites).padStart(6) + String(q.unique).padStart(7) + String(q.empty).padStart(6) + mb(q.fullPx * 4).padStart(13) + mb(q.trimPx * 4).padStart(10) + mb(q.sheetPx * 4).padStart(10) + kb(q.bytes).padStart(9) + q.ms.toFixed(0).padStart(7) + '  ' + q.sheets.join(' '));
    tot.sprites += q.sprites; tot.unique += q.unique; tot.fullPx += q.fullPx; tot.trimPx += q.trimPx; tot.sheetPx += q.sheetPx; tot.bytes += q.bytes; tot.sheets += q.sheets.length;
  }
  console.log('TOTAL'.padEnd(26) + String(tot.sprites).padStart(6) + String(tot.unique).padStart(7) + ''.padStart(6) + mb(tot.fullPx * 4).padStart(13) + mb(tot.trimPx * 4).padStart(10) + mb(tot.sheetPx * 4).padStart(10) + kb(tot.bytes).padStart(9) + '  ' + tot.sheets + ' sheets');
  const groups = {};
  for (const q of summary) { const g = groups[q.group] = groups[q.group] || { sprites: 0, sheets: 0, bytes: 0 }; g.sprites += q.sprites; g.sheets += q.sheets.length; g.bytes += q.bytes; }
  console.log('\nper group:');
  for (const g of Object.keys(groups).sort()) console.log('  ' + g.padEnd(10) + groups[g].sprites + ' sprites, ' + groups[g].sheets + ' sheets, ' + kb(groups[g].bytes) + ' of PNG');
  console.log('  index.js  ' + kb(js.length));
  console.log('\nnot baked on purpose (painted by code):');
  for (const d of left) if (d.n) console.log('  ' + String(d.n).padStart(5) + ' pictures, ' + mb(d.px * 4) + ' trimmed, ' + d.ms.toFixed(0) + ' ms to paint them all here: ' + d.why);
  console.log('\nleft to run-time painting:');
  for (const [g, why] of PAINTED) console.log('  [' + g + '] ' + why);
  for (const g of ['outdoor', 'indoor', 'people', 'hontori', 'icons']) if (!groups[g] && !NEVER[g] && g !== 'icons') console.log('  [' + g + '] nothing baked: no module of this group recorded a picture');
  if (bad.length) console.log('\ncould not be read (left painted): ' + bad.map(m => m.key).join(', '));
  if (enumErrors.length) console.log('\nENUMERATOR ERRORS:\n' + enumErrors.join('\n'));
  if (errors.length) console.log('\nPAGE ERRORS:\n' + errors.join('\n'));
  console.log('\nwritten to ' + path.relative(ROOT, OUT) + '/');
  await browser.close();
  if (srv) srv.kill();
  if (enumErrors.length || errors.length) process.exitCode = 1;
})().catch(e => { console.error(e); process.exit(1); });
