/*
  Builds the v2 release:  node tools/build_release_v2.js

  Reads v2/index.html and writes a complete, self-contained dist2/ folder:

    dist2/index.html            the page: the classic script tags become one bundle, the module becomes another
    dist2/art.<hash>.js         the sheet index and the classic scripts of src/ that v2 loads, in page order,
                                joined (each keeps its own function scope) and minified with terser
    dist2/app.<hash>.js         the v2 ES modules from game/main.js, bundled by esbuild as one ES module,
                                minified with local names mangled (property names are never changed:
                                saves and the H.* art interface keep their field names)
    dist2/sw.js                 the service worker (v2/sw.js) with this build's version and its full file list
    dist2/manifest.webmanifest  and dist2/assets/ (sheets, fonts, icons), copied as they are

  The release asks no other origin for anything: the theme's web font link is left out of the bundle
  and the page carries an @font-face for the font file that ships in assets/fonts/.

  The build writes nothing outside dist2/ and gives the same output for the same input.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const V2 = path.join(ROOT, 'v2');
const DIST = path.join(ROOT, 'dist2');
const MODULES = process.env.HONTORI_NODE_MODULES || '/Users/hm/Desktop/files/dev/game/node_modules';
const ASSET_DIRS = ['assets/sheets', 'assets/fonts', 'assets/icons'];

const hash = buf => crypto.createHash('sha256').update(buf).digest('hex');
const gz = buf => zlib.gzipSync(buf, { level: 9 }).length;

function copyDir(from, to, list, rel) {
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1)).forEach(e => {
    if (e.name.startsWith('.')) return;
    const a = path.join(from, e.name), b = path.join(to, e.name), r = rel + '/' + e.name;
    if (e.isDirectory()) copyDir(a, b, list, r);
    else if (e.isFile()) { fs.copyFileSync(a, b); list.push(r); }
  });
}

/* ---------- the page's scripts, in order ---------- */
function readPage(html) {
  const tags = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) {
    const src = (/\bsrc="([^"]+)"/.exec(m[1]) || [])[1] || '';
    tags.push({ src, module: /type="module"/.test(m[1]), code: m[2], from: m.index, to: m.index + m[0].length });
  }
  const classic = tags.filter(t => t.src && !t.module);
  const modules = tags.filter(t => t.module);
  if (!classic.length || modules.length !== 1) throw new Error('v2/index.html: expected classic script tags and one module script');
  classic.forEach(t => { if (!fs.existsSync(path.join(V2, t.src))) throw new Error('v2/index.html: ' + t.src + ' does not exist'); });
  return { tags, classic, module: modules[0] };
}

/* the theme's web font is a call to another origin: the release uses the shipped font file instead */
const noWebFont = {
  name: 'no-web-font',
  setup(b) {
    b.onLoad({ filter: /[\\/]game[\\/]theme\.js$/ }, args => {
      const src = fs.readFileSync(args.path, 'utf8');
      const out = src.replace(/url:\s*'https:\/\/fonts\.googleapis\.com[^']*'/, "url: ''");
      if (out === src && /https?:\/\//.test(src.replace(/http:\/\/www\.w3\.org[^'"]*/g, ''))) throw new Error('theme.js: the web font line was not found');
      return { contents: out, loader: 'js' };
    });
  },
};

async function build() {
  const terser = require(path.join(MODULES, 'terser'));
  const esbuild = require(path.join(MODULES, 'esbuild'));
  const html = fs.readFileSync(path.join(V2, 'index.html'), 'utf8');
  const page0 = readPage(html);

  /* ---------- classic art scripts ---------- */
  const parts = [path.join(ROOT, 'assets/sheets/index.js')].concat(page0.classic.map(t => path.join(V2, t.src)));
  let source = '', artSource = 0;
  parts.forEach(f => { const c = fs.readFileSync(f, 'utf8'); artSource += Buffer.byteLength(c); source += c + '\n;\n'; });
  const artOut = await terser.minify(source, { ecma: 2018, compress: { passes: 2 }, mangle: { safari10: true }, format: { comments: false, safari10: true } });
  if (artOut.error) throw artOut.error;
  const artCode = artOut.code + '\n';
  const art = { file: 'art.' + hash(artCode).slice(0, 10) + '.js', code: artCode, files: parts.length, source: artSource };

  /* ---------- the ES modules ---------- */
  const entry = page0.module.code;
  const result = await esbuild.build({
    stdin: { contents: entry, resolveDir: V2, sourcefile: 'entry.js', loader: 'js' },
    bundle: true, format: 'esm', target: 'es2022', platform: 'browser',
    minify: true, legalComments: 'none', charset: 'utf8', write: false, metafile: true,
    plugins: [noWebFont], logLevel: 'warning',
  });
  const appCode = result.outputFiles[0].text;
  const inputs = Object.keys(result.metafile.inputs).filter(k => k !== 'entry.js');
  const appSource = inputs.reduce((n, k) => n + result.metafile.inputs[k].bytes, 0);
  const app = { file: 'app.' + hash(appCode).slice(0, 10) + '.js', code: appCode, files: inputs.length, source: appSource };
  if (/https?:\/\/(?!www\.w3\.org)/.test(appCode + artCode)) {
    const hit = /https?:\/\/(?!www\.w3\.org)[^'"\s)]*/.exec(appCode + artCode)[0];
    console.warn('note: a bundle still names another origin: ' + hit);
  }

  /* ---------- write dist2/ ---------- */
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  [art, app].forEach(b => fs.writeFileSync(path.join(DIST, b.file), b.code));
  const files = ['index.html', art.file, app.file, 'manifest.webmanifest'];
  const manifest = fs.readFileSync(path.join(V2, 'manifest.webmanifest'), 'utf8').replace(/"\.\.\/assets\//g, '"assets/');
  fs.writeFileSync(path.join(DIST, 'manifest.webmanifest'), manifest);
  ASSET_DIRS.forEach(d => copyDir(path.join(ROOT, d), path.join(DIST, d), files, d));
  /* the sheet index rides in the art bundle; the release never asks for the separate file */
  const idx = files.indexOf('assets/sheets/index.js');
  if (idx >= 0) { files.splice(idx, 1); fs.rmSync(path.join(DIST, 'assets/sheets/index.js')); }

  /* ---------- the page ---------- */
  const firstClassic = page0.classic[0], lastClassic = page0.classic[page0.classic.length - 1];
  let page = html.slice(0, firstClassic.from) + '<script src="' + art.file + '"></script>' +
    html.slice(lastClassic.to, page0.module.from) + '<script type="module" src="' + app.file + '"></script>' +
    html.slice(page0.module.to);
  page = page.replace(/<!--[\s\S]*?-->\s*/g, '').replace(/\.\.\/assets\//g, 'assets/');
  page = page.replace('</head>', '<link rel="modulepreload" href="' + app.file + '">\n</head>');
  const inline = [];
  page.replace(/<script>([\s\S]*?)<\/script>/g, (all, code) => { inline.push(code); return all; });
  for (const code of inline) {
    const out = await terser.minify(code, { ecma: 2018, compress: {}, mangle: true, format: { comments: false } });
    if (out.error) throw out.error;
    page = page.replace('<script>' + code + '</script>', () => '<script>' + out.code + '</script>');
  }
  if (/\.\.\/src\/|\.\.\//.test(page)) throw new Error('dist2/index.html still points outside dist2/');
  fs.writeFileSync(path.join(DIST, 'index.html'), page);

  /* ---------- the service worker ---------- */
  let sw = fs.readFileSync(path.join(V2, 'sw.js'), 'utf8');
  if (!/var VERSION = 'dev';/.test(sw) || !/var FILES = \[\];/.test(sw)) throw new Error('v2/sw.js: the VERSION and FILES lines were not found');
  const version = hash(files.map(f => f + ':' + hash(fs.readFileSync(path.join(DIST, f)))).join('\n') + '\nsw:' + hash(sw)).slice(0, 12);
  sw = sw.replace("var VERSION = 'dev';", () => 'var VERSION = ' + JSON.stringify(version) + ';').replace('var FILES = [];', () => 'var FILES = ' + JSON.stringify(files) + ';');
  const swOut = await terser.minify(sw, { ecma: 2018, compress: {}, mangle: true, format: { comments: false } });
  if (swOut.error) throw swOut.error;
  fs.writeFileSync(path.join(DIST, 'sw.js'), swOut.code + '\n');

  /* ---------- report ---------- */
  const pad = (s, n) => String(s).padStart(n), kb = n => (n / 1024).toFixed(1) + ' KB';
  console.log('Hontori v2 release ' + version + '  ->  dist2/');
  console.log('file'.padEnd(26) + pad('inputs', 7) + pad('source', 12) + pad('minified', 12) + pad('gzip', 12));
  let ts = 0, tm = 0, tg = 0;
  [art, app].forEach(b => {
    const min = Buffer.byteLength(b.code), g = gz(Buffer.from(b.code));
    ts += b.source; tm += min; tg += g;
    console.log(b.file.padEnd(26) + pad(b.files, 7) + pad(kb(b.source), 12) + pad(kb(min), 12) + pad(kb(g), 12));
  });
  console.log('total scripts'.padEnd(26) + pad('', 7) + pad(kb(ts), 12) + pad(kb(tm), 12) + pad(kb(tg), 12));
  console.log('index.html'.padEnd(26) + pad('', 7) + pad(kb(Buffer.byteLength(html)), 12) + pad(kb(Buffer.byteLength(page)), 12) + pad(kb(gz(Buffer.from(page))), 12));
  ASSET_DIRS.forEach(d => {
    const list = files.filter(f => f.indexOf(d + '/') === 0);
    const n = list.reduce((s, f) => s + fs.statSync(path.join(DIST, f)).size, 0);
    console.log((d + ' (' + list.length + ')').padEnd(26) + pad('', 7) + pad('', 12) + pad(kb(n), 12) + pad('', 12));
  });
  let all = 0;
  files.concat(['sw.js']).forEach(f => { all += fs.statSync(path.join(DIST, f)).size; });
  console.log('whole dist2/: ' + kb(all) + ' in ' + (files.length + 1) + ' files; the service worker stores ' + files.length + ' of them');
}

build().catch(e => { console.error(e && e.stack || e); process.exit(1); });
