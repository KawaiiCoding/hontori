// Area map: a map button next to the backpack opens a picture of the current area
// (ground, buildings, doors, people) with a marker where the kid stands.
(function () {
  var H = window.H = window.H || {};
  var COL = {
    grass: '#5aa04a', tallgrass: '#3f8a3a', flowers: '#6ab056', path: '#c9a46c', cobble: '#a8a4a0', sand: '#e0cc90',
    water: '#3f86c8', bridge: '#9a6a3a', floor_wood: '#a8784a', floor_herring: '#b08050', floor_tile: '#c8d0c0',
    floor_stone: '#9a968e', carpet_blue: '#3a4a8a', rug: '#a03a3a', wall: '#7a5a48', void: '#1a1410'
  };
  var CSS = [
    '.hmap{position:absolute;inset:0;z-index:47;background:rgba(6,6,16,.78);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s;touch-action:none}',
    '.hmap.on{opacity:1}',
    '.hmap .box{position:relative;width:min(94%,560px);padding:12px;border-radius:16px;background:#e8d8b0;box-shadow:inset 0 0 0 3px #8a6a40,0 12px 40px rgba(0,0,0,.6)}',
    '.hmap h3{margin:2px 0 8px;text-align:center;color:#4a3420;font:900 18px Nunito,system-ui,sans-serif}',
    '.hmap canvas{width:100%;display:block;image-rendering:pixelated;border-radius:8px}',
    '.hmap .x{position:absolute;right:-8px;top:-12px;width:38px;height:38px;border-radius:12px;border:0;background:#1b1e3a;color:#fff;font:900 17px Nunito,system-ui;cursor:pointer}'
  ].join('\n');

  function show() {
    var m = H.game && H.game.currentMap && H.game.currentMap();
    if (!m || !m.map) return;
    var map = m.map, root = document.getElementById('root');
    if (!document.getElementById('hmap-css')) { var st = document.createElement('style'); st.id = 'hmap-css'; st.textContent = CSS; document.head.appendChild(st); }
    var o = document.createElement('div'); o.className = 'hmap';
    var box = document.createElement('div'); box.className = 'box'; o.appendChild(box);
    var h = document.createElement('h3'); h.textContent = map.name || m.name; box.appendChild(h);
    var S = 6, cv = document.createElement('canvas'); cv.width = map.w * S; cv.height = map.h * S; box.appendChild(cv);
    var g = cv.getContext('2d');
    var legend = map.legend || {};
    for (var y = 0; y < map.h; y++) for (var x = 0; x < map.w; x++) {
      var id = legend[(map.ground[y] || '')[x]] || 'grass';
      g.fillStyle = COL[id] || '#5aa04a'; g.fillRect(x * S, y * S, S, S);
    }
    // trees and props as small dots
    (map.props || []).forEach(function (p) {
      if (/tree|pine/.test(p.type)) { g.fillStyle = '#2f6a30'; g.beginPath(); g.arc(p.x * S + S / 2, p.y * S + S / 2, S * 0.7, 0, 7); g.fill(); }
    });
    // buildings with roofs
    (map.buildings || []).forEach(function (b) {
      var i = H.buildings && H.buildings.info[b.type]; if (!i) return;
      g.fillStyle = '#5a3a2a'; g.fillRect(b.x * S, b.y * S, i.fw * S, i.fh * S);
      g.fillStyle = b.type === 'school' ? '#6a4aa8' : b.type === 'house_player' ? '#c0503a' : b.type === 'tavern' ? '#8a5a30' : b.type === 'shop' ? '#3a7a4a' : '#3a5aa8';
      g.fillRect(b.x * S + 1, b.y * S + 1, i.fw * S - 2, i.fh * S - 3);
    });
    // doors
    (map.doors || []).forEach(function (d) { g.fillStyle = '#ffd98a'; g.fillRect(d.x * S + 1, d.y * S + 1, S - 2, S - 2); });
    // people
    (map.npcs || []).forEach(function (n) { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(n.x * S + S / 2, n.y * S + S / 2, S * 0.35, 0, 7); g.fill(); });
    // the kid: a pulsing red marker
    var px = m.player.tx * S + S / 2, py = m.player.ty * S + S / 2, live = true;
    var base = g.getImageData(0, 0, cv.width, cv.height);
    (function pulse(t) {
      if (!live) return;
      g.putImageData(base, 0, 0);
      var r = S * (0.9 + 0.3 * Math.sin(t / 200));
      g.fillStyle = 'rgba(255,60,40,.35)'; g.beginPath(); g.arc(px, py, r * 1.8, 0, 7); g.fill();
      g.fillStyle = '#ff3c28'; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(px, py, r, 0, 7); g.fill(); g.stroke();
      requestAnimationFrame(pulse);
    })(0);
    var x = document.createElement('button'); x.className = 'x'; x.textContent = 'X'; box.appendChild(x);
    function close() { live = false; o.classList.remove('on'); setTimeout(function () { o.remove(); }, 220); }
    x.addEventListener('click', close); o.addEventListener('click', function (e) { if (e.target === o) close(); });
    root.appendChild(o); requestAnimationFrame(function () { o.classList.add('on'); });
    try { H.audio && H.audio.sfx('page'); } catch (e) {}
  }

  // a small pixel map icon button next to the backpack
  function addButton() {
    var top = document.querySelector('.hm-top');
    if (!top) return setTimeout(addButton, 300);
    if (top.querySelector('.hm-map')) return;
    var b = document.createElement('div'); b.className = 'hm-btn hm-map'; b.title = 'Map';
    var c = document.createElement('canvas'); c.width = c.height = 16; c.style.cssText = 'width:30px;height:30px;image-rendering:pixelated';
    var g = c.getContext('2d');
    var R = function (col, x, y, w, h) { g.fillStyle = col; g.fillRect(x, y, w, h); };
    R('#3a220e', 1, 2, 14, 12); R('#f0dcae', 2, 3, 4, 10); R('#e2c890', 6, 3, 4, 10); R('#f0dcae', 10, 3, 4, 10);
    R('#5aa04a', 3, 5, 2, 2); R('#3f86c8', 7, 8, 2, 3); R('#c9a46c', 11, 6, 2, 1); R('#c9a46c', 4, 9, 6, 1);
    R('#ff3c28', 11, 9, 2, 2); R('#ffffff', 14, 0, 1, 3); R('#ffffff', 13, 1, 3, 1);
    b.appendChild(c); b.addEventListener('click', show);
    top.appendChild(b); top.style.flexDirection = 'column'; // stack buttons so the clock stays visible
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addButton); else addButton();
  H.mapview = { show: show };
})();
