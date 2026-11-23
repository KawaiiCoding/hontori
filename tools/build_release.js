/*
  Builds the release:  node tools/build_release.js

  Reads index.html, follows its three load steps (title, world, late; see src/loader.js) and writes a
  complete, self-contained dist/ folder:

    dist/index.html            the page, with the script tags replaced by three bundles
    dist/app.<hash>.js         title step: the sheet index, sheets, icons, loader, title
    dist/world.<hash>.js       world step: everything up to the engine, fetched while the title is shown
    dist/late.<hash>.js        late step: fetched in the background after the first frame
    dist/sw.js                 the service worker, with this build's version and its complete file list
    dist/manifest.webmanifest  and dist/assets/ (icons, sprite sheets), copied as they are

  The bundles are the source files joined in load order (every file keeps its own function scope),
  then minified with terser: local names are shortened, comments removed, code compressed. Property
  names are never changed, because modules talk through H.* and saved games keep their field names.
  Pictures are copied byte for byte.

  The build writes nothing outside dist/ and gives the same output for the same input: bundle names
  and the version come from the content.

  Other modes:
    node tools/build_release.js --icons    paint the app icons again from the game's own art
                                           (assets/icons/, needs the static server on --port, default 8123)
*/
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const MODULES = process.env.HONTORI_NODE_MODULES || '/Users/hm/Desktop/files/dev/game/node_modules';
const CHROME = process.env.HONTORI_CHROME || '/Users/hm/Library/Caches/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-mac-arm64/chrome-headless-shell';

function arg(name, def) { const i = process.argv.indexOf('--' + name); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : def; }
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const hash = buf => crypto.createHash('sha256').update(buf).digest('hex');
const gz = buf => zlib.gzipSync(buf, { level: 9 }).length;
const moduleName = f => path.basename(f, '.js');

/* ---------- the load plan, read from index.html ---------- */
function readPlan(html) {
  const tags = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>\s*/g;
  let m;
  while ((m = re.exec(html))) {
    const src = (/\bsrc="([^"]+)"/.exec(m[1]) || [])[1] || '';
    tags.push({ src, code: src ? '' : m[2], from: m.index, to: m.index + m[0].length });
  }
  const first = tags.findIndex(t => t.src);
  const title = tags.findIndex(t => t.src === 'src/title.js');
  const start = tags.findIndex(t => !t.src && /H\.loader\.start\(/.test(t.code));
  if (first < 0 || title < first || start < title) throw new Error('index.html: expected script tags, then src/title.js, then H.loader.start(...)');
  const lateList = /late:\s*\[([^\]]*)\]/.exec(tags[start].code);
  if (!lateList) throw new Error('index.html: H.loader.start has no late list');
  const late = (lateList[1].match(/'[^']+'/g) || []).map(s => ({ src: s.slice(1, -1), code: '' }));
  const plan = { title: tags.slice(first, title + 1), world: tags.slice(title + 1, start), late, cut: [tags[first].from, tags[start].to] };
  const seen = new Set();
  [plan.title, plan.world, plan.late].forEach(list => list.forEach(t => {
    if (!t.src) return;
    if (seen.has(t.src)) throw new Error('index.html: ' + t.src + ' is listed twice');
    seen.add(t.src);
    if (!fs.existsSync(path.join(ROOT, t.src))) throw new Error('index.html: ' + t.src + ' does not exist');
  }));
  /* every file of src/ must be in the plan, or the release would miss a module */
  fs.readdirSync(path.join(ROOT, 'src')).filter(f => f.endsWith('.js')).forEach(f => {
    if (!seen.has('src/' + f)) console.warn('note: src/' + f + ' is not loaded by index.html and is left out');
  });
  return plan;
}

/* ---------- one bundle ---------- */
async function bundle(name, parts, terser) {
  let source = '', bytes = 0;
  for (const p of parts) {
    const code = p.src ? read(p.src) : p.code;
    bytes += Buffer.byteLength(code);
    source += code + '\n;\n';
  }
  const out = await terser.minify(source, {
    ecma: 2018,
    compress: { passes: 2 },
    mangle: { safari10: true },
    format: { comments: false, safari10: true }
  });
  if (out.error) throw out.error;
  const code = out.code + '\n';
  const file = name + '.' + hash(code).slice(0, 10) + '.js';
  return { name, file, code, source: bytes, min: Buffer.byteLength(code), gzip: gz(Buffer.from(code)), files: parts.filter(p => p.src).length };
}

function copyDir(from, to, list, rel) {
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1)).forEach(e => {
    if (e.name.startsWith('.')) return;
    const a = path.join(from, e.name), b = path.join(to, e.name), r = rel + '/' + e.name;
    if (e.isDirectory()) copyDir(a, b, list, r);
    else if (e.isFile()) { fs.copyFileSync(a, b); list.push(r); }
  });
}

async function build() {
  const terser = require(path.join(MODULES, 'terser'));
  const html = read('index.html');
  const plan = readPlan(html);

  /* the sheet index is a script of its own in development; in the release it rides in the first bundle */
  const titleParts = plan.title.slice();
  if (fs.existsSync(path.join(ROOT, 'assets/sheets/index.js'))) titleParts.unshift({ src: 'assets/sheets/index.js', code: '' });

  const app = await bundle('app', titleParts, terser);
  const world = await bundle('world', plan.world, terser);
  const late = await bundle('late', plan.late, terser);
  const bundles = [app, world, late];

  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  bundles.forEach(b => fs.writeFileSync(path.join(DIST, b.file), b.code));

  const files = ['index.html'].concat(bundles.map(b => b.file));
  if (fs.existsSync(path.join(ROOT, 'manifest.webmanifest'))) { fs.copyFileSync(path.join(ROOT, 'manifest.webmanifest'), path.join(DIST, 'manifest.webmanifest')); files.push('manifest.webmanifest'); }
  if (fs.existsSync(path.join(ROOT, 'assets'))) copyDir(path.join(ROOT, 'assets'), path.join(DIST, 'assets'), files, 'assets');
  /* the sheet index is inside the first bundle; the release never asks for the separate file */
  const idx = files.indexOf('assets/sheets/index.js');
  if (idx >= 0) { files.splice(idx, 1); fs.rmSync(path.join(DIST, 'assets/sheets/index.js')); }

  /* ---------- the page ---------- */
  const names = {};
  names[world.file] = plan.world.filter(t => t.src).map(t => moduleName(t.src));
  names[late.file] = plan.late.map(t => moduleName(t.src));
  /* The interface asks for the Nunito typeface. The release never calls another origin: when the font
     file is part of the project it is served from there, otherwise the system's own rounded fallback is used.
     (src/ui.js skips its web font link when an element with this id is already on the page.) */
  const fontFile = 'assets/fonts/nunito-latin.woff2';
  const font = '<style id="hui-font">' + (files.indexOf(fontFile) >= 0
    ? '@font-face{font-family:"Nunito";font-style:normal;font-weight:600 900;font-display:swap;src:url(' + fontFile + ') format("woff2")}' : '') + '</style>';
  const startCode = 'H.loader.start(' + JSON.stringify({ world: [world.file], late: [late.file], names }) + ');';
  let page = html.slice(0, plan.cut[0]) +
    '<script src="' + app.file + '"></script>\n<script>' + startCode + '</script>\n' +
    html.slice(plan.cut[1]);
  page = page.replace(/<!--[\s\S]*?-->\s*/g, '');
  page = page.replace('</head>', font + '\n<link rel="preload" as="script" href="' + world.file + '">\n</head>');
  /* the small scripts that stay in the page are minified too */
  const inline = [];
  page.replace(/<script>([\s\S]*?)<\/script>/g, (all, code) => { inline.push(code); return all; });
  for (const code of inline) {
    const out = await terser.minify(code, { ecma: 2018, compress: {}, mangle: true, format: { comments: false } });
    if (out.error) throw out.error;
    page = page.replace('<script>' + code + '</script>', () => '<script>' + out.code + '</script>');
  }
  fs.writeFileSync(path.join(DIST, 'index.html'), page);

  /* ---------- the service worker: this build's version and its complete file list ---------- */
  let sw = read('sw.js');
  const version = hash(files.map(f => f + ':' + hash(fs.readFileSync(path.join(DIST, f)))).join('\n') + '\nsw:' + hash(sw)).slice(0, 12);
  if (!/var VERSION = 'dev';/.test(sw) || !/var FILES = \[\];/.test(sw)) throw new Error('sw.js: the VERSION and FILES lines were not found');
  sw = sw.replace("var VERSION = 'dev';", () => 'var VERSION = ' + JSON.stringify(version) + ';').replace('var FILES = [];', () => 'var FILES = ' + JSON.stringify(files) + ';');
  const swOut = await terser.minify(sw, { ecma: 2018, compress: {}, mangle: true, format: { comments: false } });
  if (swOut.error) throw swOut.error;
  fs.writeFileSync(path.join(DIST, 'sw.js'), swOut.code + '\n');

  /* ---------- report ---------- */
  const pad = (s, n) => String(s).padStart(n), kb = n => (n / 1024).toFixed(1) + ' KB';
  console.log('Hontori release ' + version + '  ->  ' + path.relative(process.cwd(), DIST) + '/');
  console.log('bundle'.padEnd(26) + pad('files', 6) + pad('source', 12) + pad('minified', 12) + pad('gzip', 12));
  const tot = { files: 0, source: 0, min: 0, gzip: 0 };
  bundles.forEach(b => {
    console.log(b.file.padEnd(26) + pad(b.files, 6) + pad(kb(b.source), 12) + pad(kb(b.min), 12) + pad(kb(b.gzip), 12));
    tot.files += b.files; tot.source += b.source; tot.min += b.min; tot.gzip += b.gzip;
  });
  console.log('total scripts'.padEnd(26) + pad(tot.files, 6) + pad(kb(tot.source), 12) + pad(kb(tot.min), 12) + pad(kb(tot.gzip), 12));
  const pageBytes = Buffer.byteLength(page);
  console.log('index.html'.padEnd(26) + pad('', 6) + pad(kb(Buffer.byteLength(html)), 12) + pad(kb(pageBytes), 12) + pad(kb(gz(Buffer.from(page))), 12));
  let other = 0, pics = 0;
  files.forEach(f => { if (/^assets\//.test(f)) { other += fs.statSync(path.join(DIST, f)).size; pics++; } });
  console.log(('assets (' + pics + ' files, copied)').padEnd(26) + pad('', 6) + pad(kb(other), 12) + pad(kb(other), 12) + pad('', 12));
  let all = 0;
  files.concat(['sw.js']).forEach(f => { all += fs.statSync(path.join(DIST, f)).size; });
  console.log('whole dist/ folder: ' + kb(all) + ' in ' + (files.length + 1) + ' files; the service worker stores ' + files.length + ' of them');
  if (files.indexOf(fontFile) < 0) console.log('note: ' + fontFile + ' is not in the project, so the release uses the system font instead of Nunito');
}

/* ---------- app icons, painted from the game's own art ---------- */
async function icons() {
  const { chromium } = require(path.join(MODULES, 'playwright'));
  const port = +arg('port', 8123), out = path.join(ROOT, 'assets/icons');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto('http://localhost:' + port + '/index.html?debug=1&nointro=1&scene=home&sheets=off');
    await page.waitForFunction(() => window.H && H.spirits && H.spirits.draw && H.game);
    /* [file, size, share of the icon the fox may fill]; a maskable icon keeps its subject in the middle */
    const list = [['icon-192.png', 192, 0.74], ['icon-512.png', 512, 0.74], ['icon-maskable-512.png', 512, 0.52], ['apple-touch-icon.png', 180, 0.74]];
    for (const [file, size, share] of list) {
      const url = await page.evaluate(({ size, share }) => {
        /* the fox as the title shows it, on a small canvas, cut to its own pixels */
        const S = 96, small = document.createElement('canvas'); small.width = small.height = S;
        const g = small.getContext('2d'); g.imageSmoothingEnabled = false; g.scale(2, 2);
        H.spirits.draw(g, 'hontori', 24, 24, { t: 0.4, time: 22, weather: 'clear', wind: 0.2, indoor: true }, { scale: 1, sit: true });
        const d = small.getContext('2d').getImageData(0, 0, S, S).data;
        let x0 = S, y0 = S, x1 = 0, y1 = 0;
        for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (d[(y * S + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        const w = x1 - x0 + 1, h = y1 - y0 + 1;
        /* whole-number enlargement keeps every pixel square */
        const k = Math.max(1, Math.floor(size * share / Math.max(w, h)));
        const c = document.createElement('canvas'); c.width = c.height = size;
        const q = c.getContext('2d');
        /* the title's night sky and a warm glow, painted small and enlarged so the backdrop is made of squares too */
        const B = Math.round(size / 8), back = document.createElement('canvas'); back.width = back.height = B;
        const bq = back.getContext('2d');
        const bg = bq.createRadialGradient(B / 2, B * 0.4, 0, B / 2, B * 0.4, B * 0.75);
        bg.addColorStop(0, '#2a2a5e'); bg.addColorStop(0.55, '#14143a'); bg.addColorStop(1, '#07081a');
        bq.fillStyle = bg; bq.fillRect(0, 0, B, B);
        const glow = bq.createRadialGradient(B / 2, B * 0.55, 0, B / 2, B * 0.55, B * 0.42);
        glow.addColorStop(0, 'rgba(255,150,60,0.30)'); glow.addColorStop(1, 'rgba(255,150,60,0)');
        bq.fillStyle = glow; bq.fillRect(0, 0, B, B);
        q.imageSmoothingEnabled = false;
        q.drawImage(back, 0, 0, B, B, 0, 0, size, size);
        q.imageSmoothingEnabled = false;
        q.drawImage(small, x0, y0, w, h, Math.round((size - w * k) / 2), Math.round((size - h * k) / 2), w * k, h * k);
        return c.toDataURL('image/png');
      }, { size, share });
      fs.writeFileSync(path.join(out, file), Buffer.from(url.split(',')[1], 'base64'));
      console.log('wrote assets/icons/' + file);
    }
  } finally { await browser.close(); }
}

(process.argv.includes('--icons') ? icons() : build()).catch(e => { console.error(e && e.stack || e); process.exit(1); });
