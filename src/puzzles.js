window.H = window.H || {};
// In-world puzzles (never a popup): things you push with your body, pads that light up, gates that open.
// H.puzzles.def(mapName, { boxes: [[x,y]], pads: [[x,y]], gate: [x,y], flag, look: 'leaf', onSolve })
// Unsolved pieces reset each time you enter the room; a solved puzzle stays solved (state.flags[flag]).
(function () {
  'use strict';
  var H = window.H, T = 16, defs = {}, live = {};
  function S() { return (H.game && H.game.state) || {}; }
  function solved(d) { var f = S().flags || {}; return !!f[d.flag]; }
  function sfx(n) { try { H.audio && H.audio.sfx(n); } catch (e) {} }
  function reset(name) { var d = defs[name]; if (!d) return; live[name] = { boxes: d.boxes.map(function (b) { return { x: b[0], y: b[1], px: b[0] * T, py: b[1] * T }; }), t: 0 }; }
  function def(name, d) { defs[name] = d; reset(name); }
  function boxAt(name, x, y) { var L = live[name]; if (!L) return null; for (var i = 0; i < L.boxes.length; i++) if (L.boxes[i].x === x && L.boxes[i].y === y) return L.boxes[i]; return null; }
  function onPad(d, x, y) { return d.pads.some(function (p) { return p[0] === x && p[1] === y; }); }

  H.dynBlocked = function (name, x, y) {
    var d = defs[name]; if (!d || solved(d)) return false;
    if (d.gate && d.gate[0] === x && d.gate[1] === y) return true;
    return !!boxAt(name, x, y);
  };
  H.pushAt = function (name, x, y, dx, dy, blocked) {
    var d = defs[name]; if (!d || solved(d)) return false;
    var b = boxAt(name, x, y); if (!b) return false;
    var mx = x + dx, my = y + dy;
    if (blocked(mx, my)) { sfx('bump'); return false; }
    b.x = mx; b.y = my; sfx('step');
    var L = live[name];
    if (d.pads.every(function (p) { return !!boxAt(name, p[0], p[1]); })) {
      (S().flags = S().flags || {})[d.flag] = true;
      try { H.game.save(); } catch (e) {}
      setTimeout(function () { sfx('sparkle'); if (d.onSolve) d.onSolve(); }, 350);
    } else if (onPad(d, mx, my)) setTimeout(function () { sfx('blip'); }, 200);
    return true;
  };
  H.puzzles = { def: def, reset: reset, solved: function (name) { return defs[name] ? solved(defs[name]) : false; } };
  H.onMapEnter = H.onMapEnter || [];
  H.onMapEnter.push(function (name) { if (defs[name] && !solved(defs[name])) reset(name); });

  // ---------- drawing: glowing moss pads, leaf piles that glide when pushed, a lattice of roots for the gate
  function leafPile(ctx, x, y, t, lit) {
    // a big round heap of autumn leaves, easy to spot against stone and hedge
    var C = ['#6a2a10', '#a8461a', '#d8742a', '#f0a83a', '#ffd060', '#c03a24'];
    ctx.fillStyle = 'rgba(30,15,5,0.35)'; ctx.fillRect(x, y + 12, 16, 4);
    ctx.fillStyle = '#3a1808'; ctx.fillRect(x + 1, y + 4, 14, 11); ctx.fillRect(x + 3, y + 1, 10, 14);
    for (var row = 0; row < 6; row++) for (var col = 0; col < 7; col++) {
      var lx = x + 2 + col * 2 + (row % 2), ly = y + 2 + row * 2; if (row === 0 && (col < 1 || col > 5)) continue;
      ctx.fillStyle = C[(row * 3 + col * 5 + (x >> 4)) % 6]; ctx.fillRect(lx, ly, 2, 2);
    }
    var w = Math.sin(t * 3 + x * 0.1) > 0.8 ? 1 : 0;
    ctx.fillStyle = '#ffe48a'; ctx.fillRect(x + 6 + w, y + 2, 3, 1); ctx.fillRect(x + 10, y + 5 + w, 2, 1);
    if (lit) { ctx.fillStyle = 'rgba(170,255,140,0.35)'; ctx.fillRect(x + 1, y + 1, 14, 14); }
  }
  H.worldDraw = H.worldDraw || [];
  H.worldDraw.push(function (ents, lights, ctx, env, name) {
    var d = defs[name]; if (!d) return;
    var L = live[name] || (reset(name), live[name]), t = env.t || 0, done = solved(d);
    // pads are drawn on the floor first
    d.pads.forEach(function (p) {
      var x = p[0] * T, y = p[1] * T, on = !!boxAt(name, p[0], p[1]) || done, pul = (Math.sin(t * 2 + p[0]) + 1) / 2;
      ctx.fillStyle = on ? '#4aa040' : '#2f6a2a'; ctx.fillRect(x + 2, y + 3, 12, 10); ctx.fillRect(x + 3, y + 2, 10, 12);
      ctx.fillStyle = on ? 'rgba(200,255,150,0.75)' : 'rgba(140,240,120,' + (0.25 + pul * 0.35).toFixed(2) + ')';
      ctx.fillRect(x + 5, y + 5, 6, 6); ctx.fillRect(x + 7, y + 3, 2, 10); ctx.fillRect(x + 3, y + 7, 10, 2);
      lights.push({ x: x + 8, y: y + 8, r: on ? 26 : 16, color: '#b0ff90', flicker: !on });
    });
    if (done) {
      // the leaves sank into the moss and bloomed
      d.pads.forEach(function (p) { var x = p[0] * T, y = p[1] * T; ctx.fillStyle = '#ffd0e8'; ctx.fillRect(x + 4, y + 4, 2, 2); ctx.fillRect(x + 10, y + 9, 2, 2); ctx.fillStyle = '#fff6a0'; ctx.fillRect(x + 7, y + 6, 2, 2); });
      return;
    }
    L.boxes.forEach(function (b) {
      b.px += (b.x * T - b.px) * 0.35; b.py += (b.y * T - b.py) * 0.35;
      ents.push({ y: b.py + T, d: function () { leafPile(ctx, Math.round(b.px), Math.round(b.py), t, onPad(d, b.x, b.y)); } });
    });
    if (d.gate) {
      var gx = d.gate[0] * T, gy = d.gate[1] * T;
      ents.push({ y: gy + T, d: function () {
        ctx.fillStyle = '#2a1a0c'; ctx.fillRect(gx - 2, gy - 18, 20, 34);
        for (var i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? '#6a4424' : '#8a5a30'; ctx.fillRect(gx - 1 + i * 4, gy - 17, 3, 32); }
        for (var j = 0; j < 4; j++) { ctx.fillStyle = '#5a3a1e'; ctx.fillRect(gx - 2, gy - 12 + j * 8, 20, 2); }
        ctx.fillStyle = '#4a7a34'; for (var k = 0; k < 6; k++) ctx.fillRect(gx + (k * 7) % 18 - 1, gy - 16 + (k * 11) % 30, 2, 2);
      } });
    }
  });
})();
