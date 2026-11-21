// node test/interact.test.js — every prop/furniture/building type has an interaction and run() resolves.
var path = require('path'), fs = require('fs'), vm = require('vm'), assert = require('assert');
var root = path.join(__dirname, '..');
function stub() {
  var f = function () { return p; };
  var p = new Proxy(f, {
    get: function (t, k) { if (k === 'canvas') return { width: 16, height: 16 }; if (k === Symbol.toPrimitive) return function () { return 0; }; return p; },
    set: function () { return true; }, apply: function () { return p; }, construct: function () { return p; }
  });
  return p;
}
var S = stub();
var win = {};
var sb = { window: win, document: { createElement: function () { return { width: 0, height: 0, style: {}, getContext: function () { return S; } }; } },
  console: console, Math: Math, setTimeout: function (fn) { return setTimeout(fn, 0); }, Promise: Promise };
win.window = win; win.document = sb.document;
vm.createContext(sb);
['furniture', 'interior_plus', 'props_outdoor', 'outdoor_plus', 'buildings', 'interact'].forEach(function (f) {
  vm.runInContext('with(window){' + fs.readFileSync(path.join(root, 'src', f + '.js'), 'utf8') + '\n}', sb, { filename: f + '.js' });
});
var H = win.H;
var types = [].concat(Object.keys(H.furniture.info), Object.keys(H.propsOutdoor.info), Object.keys(H.buildings.info));
assert(types.length > 70, 'expected many types, got ' + types.length);

var said = [], longest = 0, longLines = [];
function ctx(spirit, time, extra) {
  var c = {
    say: function (k, n, t) {
      assert(typeof t === 'string' && t.length, 'empty line');
      assert(!/[\u{1F000}-\u{1FFFF}☀-➿]/u.test(t), 'emoji in: ' + t);
      assert(t.indexOf('undefined') < 0 && t.indexOf('NaN') < 0, 'bad text: ' + t);
      var w = t.split(/\s+/).length; if (w > longest) longest = w; if (w > 12) longLines.push(t);
      said.push([k, n, t]); return Promise.resolve();
    },
    toast: function () {}, emit: function (kind) { assert(['sparkle', 'ember', 'smoke', 'magic', 'dust'].indexOf(kind) >= 0, 'bad particle ' + kind); },
    sfx: function () {}, note: function (m) { assert(typeof m === 'number'); },
    env: { t: 0, time: time, weather: 'clear', wind: 0.3, indoor: false }, map: {}, mapName: 'village',
    x: 100, y: 100, player: { x: 100, y: 116 }, hasSpirit: spirit,
    setTime: function (h) { c.env.time = h; c.slept = h; }, fade: function () { return Promise.resolve(); }, object: { type: 'x', x: 1, y: 1 }
  };
  for (var k in (extra || {})) c[k] = extra[k];
  return c;
}

(async function () {
  types.forEach(function (t) { assert(H.interact.has(t), 'no interaction for ' + t); });
  assert(!H.interact.has('zzz_unknown'));
  var rnd = Math.random, modes = [function () { return 0; }, function () { return 0.999; }, rnd];
  for (var m = 0; m < modes.length; m++) {
    sb.Math.random = modes[m];
    for (var i = 0; i < types.length; i++) {
      for (var v = 0; v < 5; v++) {
        var before = said.length;
        await H.interact.run(types[i], ctx(v % 2 === 0, v < 3 ? 22 : 10));
        assert(said.length > before, types[i] + ' said nothing');
      }
    }
  }
  sb.Math.random = rnd;
  var c = ctx(true, 22); await H.interact.run('kid_bed', c); assert.strictEqual(c.slept, 7);
  c = ctx(false, 22); await H.interact.run('bed', c); assert.strictEqual(c.slept, 7);
  said.length = 0; await H.interact.run('sign', ctx(false, 9, { object: { type: 'sign', text: 'North: the old mill.' } }));
  assert.strictEqual(said[0][2], 'North: the old mill.');
  said.length = 0; await H.interact.run('clock', ctx(false, 13.5)); assert(/1:30 pm/.test(said[0][2]), said[0][2]);
  said.length = 0; await H.interact.run('weird_gizmo', ctx(false, 9)); assert(/weird gizmo/.test(said[0][2]));
  await H.interact.run('tree', {}); await H.interact.run('piano'); // missing ctx parts must not throw
  assert(longLines.length === 0, 'lines too long:\n' + longLines.join('\n'));
  console.log('ok - ' + types.length + ' types, longest line ' + longest + ' words');
})().catch(function (e) { console.error('FAIL', e.message); process.exit(1); });
