// Hontori battle moves: 3 moves per element (basic, signature, utility) and a unique animation for each.
// Animations draw through a small scene API (X) that src/battle.js passes in:
//   X.a / X.b       attacker / target {x, y (body centre), gy (ground), sc}
//   X.P(o)          spawn a particle {x,y,vx,vy,l,d,c,s,g,n (normal blend), dr (drag)}
//   X.fx(ms, fn, back)  timed drawer fn(g, k 0..1, ms) (back = behind the spirits)
//   X.flash(col, a), X.dim(a, ms), X.shake(v), X.lunge(frac, ms), X.lift(px, ms), X.fade(alpha, ms), X.wait(ms)
// Each animation resolves at the moment of impact; lingering bits keep playing after.
(function () {
  var H = window.H = window.H || {};
  var COL = { fire: '#ff8a3c', water: '#4aa8ff', wind: '#9ff0e0', grass: '#7ed957', electric: '#7ff0ff', earth: '#c9935a', dark: '#a070ff', light: '#fff2a8' };

  // pow: base power; cd: rest turns after use; util: support effect id
  var MOVES = {
    fire: [
      { id: 'ember_nip', name: 'Ember Nip', pow: 5, desc: 'A quick bite wrapped in flame.' },
      { id: 'flare_tail', name: 'Flare Tail', pow: 8, cd: 3, desc: 'A blazing tail arc. Rests 2 turns.' },
      { id: 'warm_glow', name: 'Warm Glow', util: 'glow', cd: 3, desc: 'Attacks +50% for 2 turns.' }
    ],
    water: [
      { id: 'curl_wave', name: 'Curl Wave', pow: 5, desc: 'A curling wave crashes down.' },
      { id: 'torrent_jet', name: 'Torrent Jet', pow: 8, cd: 3, desc: 'A strong jet of water. Rests 2 turns.' },
      { id: 'morning_mist', name: 'Morning Mist', util: 'mist', cd: 3, desc: 'Foe aims worse for 3 turns.' }
    ],
    wind: [
      { id: 'crescent_blade', name: 'Crescent Blade', pow: 5, desc: 'Three blades of wind.' },
      { id: 'spiral_gale', name: 'Spiral Gale', pow: 8, cd: 3, desc: 'A tornado lifts the foe. Rests 2 turns.' },
      { id: 'tailwind', name: 'Tailwind', util: 'tail', cd: 3, desc: 'Move first and land more crits.' }
    ],
    grass: [
      { id: 'leaf_volley', name: 'Leaf Volley', pow: 5, desc: 'A spray of sharp leaves.' },
      { id: 'thorn_lash', name: 'Thorn Lash', pow: 8, cd: 3, desc: 'Thorny vines whip up. Rests 2 turns.' },
      { id: 'deep_root', name: 'Deep Root', util: 'root', cd: 3, desc: 'Heals a little for 3 turns.' }
    ],
    electric: [
      { id: 'arc_crackle', name: 'Arc Crackle', pow: 5, desc: 'Crackling arcs leap across.' },
      { id: 'sky_fork', name: 'Sky Fork', pow: 8, cd: 3, desc: 'Lightning from the sky. Rests 2 turns.' },
      { id: 'static_field', name: 'Static Field', util: 'static', cd: 3, desc: '40% chance to stun the foe.' }
    ],
    earth: [
      { id: 'boulder_toss', name: 'Boulder Toss', pow: 5, desc: 'A heavy stone, thrown high.' },
      { id: 'stone_eruption', name: 'Stone Eruption', pow: 8, cd: 3, desc: 'Rocks burst from the ground. Rests 2 turns.' },
      { id: 'stone_shell', name: 'Stone Shell', util: 'harden', cd: 3, desc: 'Takes half damage for 2 turns.' }
    ],
    dark: [
      { id: 'shadow_claw', name: 'Shadow Claw', pow: 5, desc: 'Claws tear from the dark.' },
      { id: 'night_tendrils', name: 'Night Tendrils', pow: 8, cd: 3, desc: 'Shadows rise and grasp. Rests 2 turns.' },
      { id: 'veil_step', name: 'Veil Step', util: 'veil', cd: 3, desc: 'Slips away from the next hit.' }
    ],
    light: [
      { id: 'halo_burst', name: 'Halo Burst', pow: 5, desc: 'A ring of light bursts.' },
      { id: 'dawn_beam', name: 'Dawn Beam', pow: 8, cd: 3, desc: 'A beam falls from above. Rests 2 turns.' },
      { id: 'bless', name: 'Bless', util: 'bless', cd: 3, desc: 'Heals and clears sleep.' }
    ]
  };

  // ---------------------------------------------------------------- helpers
  function R(a, b) { return a + Math.random() * (b - a); }
  function stroke(g, pts, w, col, alpha) {
    if (pts.length < 2) return;
    g.globalAlpha = alpha == null ? 1 : alpha; g.lineWidth = w; g.strokeStyle = col; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.stroke(); g.globalAlpha = 1;
  }
  // glowing stroke: wide coloured halo, coloured body, white core
  function glow(g, pts, w, col, alpha) {
    var a = alpha == null ? 1 : alpha;
    g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
    stroke(g, pts, w * 3, col, a * 0.22); stroke(g, pts, w * 1.4, col, a * 0.8); stroke(g, pts, Math.max(0.6, w * 0.45), '#ffffff', a);
    g.globalCompositeOperation = 'source-over';
  }
  function blob(g, x, y, r, col, a) {
    var gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = a; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.globalAlpha = 1;
  }
  function burst(X, x, y, cols, n, sp, o) {
    for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, v = Math.random() * (sp || 1.4); X.P(Object.assign({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.2, c: cols[i % cols.length], d: R(0.02, 0.04), s: Math.random() < 0.5 ? 1 : 1.5 }, o || {})); }
  }
  function ring(X, x, y, col, r1, ms, flat, w) {
    X.fx(ms, function (g, k) {
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - k; g.strokeStyle = col; g.lineWidth = (w || 1.5) * (1 - k * 0.5);
      g.beginPath(); g.ellipse(x, y, 2 + r1 * k, (2 + r1 * k) * (flat || 1), 0, 0, 6.283); g.stroke();
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    });
  }
  function jag(x0, y0, x1, y1, segs, amp) {
    var pts = [[x0, y0]], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    for (var i = 1; i < segs; i++) { var t = i / segs, o = (Math.random() - 0.5) * 2 * amp; pts.push([x0 + dx * t + nx * o, y0 + dy * t + ny * o]); }
    pts.push([x1, y1]); return pts;
  }
  function bez(p0, p1, p2, t) { var u = 1 - t; return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]; }

  // ---------------------------------------------------------------- animations
  var ANIM = {
    // ----- fire
    ember_nip: async function (X) {
      var b = X.b; X.lunge(0.6, 320); await X.wait(190);
      X.fx(300, function (g, k) {
        var o = (1 - Math.min(1, k * 1.6)) * 9, a = 1 - k;
        glow(g, arcPts(b.x, b.y - 2 - o, 8, 0.12, 0.88), 1.3, '#ff9a4a', a);
        glow(g, arcPts(b.x, b.y + 2 + o, 8, 1.12, 1.88), 1.3, '#ff9a4a', a);
        g.fillStyle = '#fff'; g.globalAlpha = a; for (var i = -2; i <= 2; i++) { g.fillRect(b.x + i * 3, b.y - 3 - o + 6, 1, 2); g.fillRect(b.x + i * 3 + 1, b.y + 1 + o - 3, 1, 2); } g.globalAlpha = 1;
      });
      await X.wait(170);
      for (var i = 0; i < 34; i++) X.P({ x: b.x + R(-6, 6), y: b.y + R(-4, 6), vx: R(-0.7, 0.7), vy: R(-1.8, -0.4), c: ['#ff4a1a', '#ff8a3c', '#ffd27a', '#fff'][i % 4], d: R(0.025, 0.045), s: R(1, 2.2), dr: 0.97 });
      ring(X, b.x, b.y, '#ffb050', 18, 380); X.flash('#ff9040', 0.18);
    },
    flare_tail: async function (X) {
      var a = X.a, b = X.b;
      // the spin: a ring of flame around the attacker
      X.fx(420, function (g, k) { var pts = []; for (var i = 0; i <= 14; i++) { var t = k * 9 + i * 0.28; pts.push([a.x + Math.cos(t) * 12, a.y + 3 + Math.sin(t) * 5]); } glow(g, pts, 1.6, '#ff7a2a', 1 - k * 0.5); });
      await X.wait(360);
      var top = [ (a.x + b.x) / 2, Math.min(a.y, b.y) - 38 ], tail = [];
      await X.tween(420, function (k) {
        var p = bez([a.x, a.y], top, [b.x, b.y], k); tail.push(p); if (tail.length > 14) tail.shift();
        for (var i = 0; i < 4; i++) X.P({ x: p[0] + R(-3, 3), y: p[1] + R(-3, 3), vx: R(-0.3, 0.3), vy: R(-0.6, 0), c: ['#ff4a1a', '#ff9a3c', '#ffe08a'][i % 3], d: 0.04, s: R(1.5, 2.5) });
      }, function (g) { glow(g, tail, 3, '#ff7a2a', 0.9); });
      burst(X, b.x, b.y, ['#ff4a1a', '#ff9a3c', '#ffe08a', '#fff'], 50, 2.2, { vy: -1 });
      ring(X, b.x, b.gy, '#ff8a3c', 26, 500, 0.35, 2); X.flash('#ff7a30', 0.35); X.shake(1.2);
    },
    warm_glow: async function (X) {
      var a = X.a;
      X.fx(1200, function (g, k) {
        g.globalCompositeOperation = 'lighter';
        blob(g, a.x, a.y, 22 + Math.sin(k * 18) * 3, 'rgba(255,150,60,.9)', 0.55 * Math.sin(k * Math.PI));
        g.globalCompositeOperation = 'source-over';
      });
      for (var i = 0; i < 3; i++) { ring(X, a.x, a.y + 4, '#ffb060', 20, 700, 0.5); await X.wait(220); }
      for (var j = 0; j < 30; j++) X.P({ x: a.x + R(-10, 10), y: a.y + R(-2, 10), vy: R(-0.9, -0.3), vx: R(-0.15, 0.15), c: j % 2 ? '#ffc060' : '#ff8a3c', d: 0.02, s: 1 });
      X.flash('#ffa050', 0.12);
    },
    // ----- water
    curl_wave: async function (X) {
      var a = X.a, b = X.b, gy = b.gy, dir = b.x > a.x ? 1 : -1;
      await X.tween(560, function () {}, function (g, k) {
        var cx = a.x + (b.x - a.x) * k, cy = a.y + (gy - a.y) * k * 0.2 + (b.y - a.y) * k * 0.8, h = 6 + k * 12, w = 18;
        // a curling crest: body + lip curling forward
        g.fillStyle = 'rgba(40,120,220,.85)'; g.beginPath(); g.moveTo(cx - w * dir, cy + 8);
        g.quadraticCurveTo(cx - w * 0.3 * dir, cy - h, cx + 4 * dir, cy - h + 2); g.quadraticCurveTo(cx + 10 * dir, cy - h + 6, cx + 6 * dir, cy - h + 9);
        g.quadraticCurveTo(cx + 2 * dir, cy - h + 4, cx + 2 * dir, cy + 8); g.closePath(); g.fill();
        glow(g, [[cx - w * 0.6 * dir, cy - h * 0.5], [cx - w * 0.2 * dir, cy - h + 1], [cx + 4 * dir, cy - h + 2], [cx + 8 * dir, cy - h + 7]], 1, '#cfefff', 0.9);
      });
      X.fx(500, function (g, k) { g.fillStyle = 'rgba(70,160,255,' + (0.7 * (1 - k)) + ')'; g.beginPath(); g.ellipse(b.x, b.y + 2 + k * 6, 14 + k * 6, 10 - k * 6, 0, 0, 6.283); g.fill(); });
      for (var i = 0; i < 40; i++) X.P({ x: b.x + R(-10, 10), y: b.y + R(-8, 4), vx: R(-1.3, 1.3), vy: R(-2.2, -0.4), g: 0.09, c: i % 3 ? '#4aa8ff' : '#e6f6ff', d: 0.022, s: R(1, 2), n: 1 });
      ring(X, b.x, gy, '#cfe9ff', 22, 600, 0.3); ring(X, b.x, gy, '#4aa8ff', 14, 450, 0.3);
    },
    torrent_jet: async function (X) {
      var a = X.a, b = X.b;
      X.lunge(-0.08, 300);
      await X.tween(620, function (k) {
        if (k > 0.25) for (var i = 0; i < 3; i++) X.P({ x: b.x + R(-3, 3), y: b.y + R(-3, 3), vx: (b.x > a.x ? 1 : -1) * R(0.2, 1.4), vy: R(-1.6, 0.2), g: 0.08, c: i ? '#7cc4ff' : '#fff', d: 0.04, s: 1.5, n: 1 });
      }, function (g, k) {
        var e = Math.min(1, k * 3), x1 = a.x + (b.x - a.x) * e, y1 = a.y + (b.y - a.y) * e, pts = [];
        for (var i = 0; i <= 10; i++) { var t = i / 10; pts.push([a.x + (x1 - a.x) * t + Math.sin(k * 40 + i) * 0.8, a.y + (y1 - a.y) * t + Math.cos(k * 37 + i * 1.3) * 0.8]); }
        var w = 2.6 * (k < 0.85 ? 1 : (1 - k) / 0.15);
        glow(g, pts, w, '#3a90ff', 1);
      });
      burst(X, b.x, b.y, ['#4aa8ff', '#cfe9ff', '#fff'], 30, 1.8, { g: 0.06 }); X.shake(1); ring(X, b.x, b.gy, '#9fd4ff', 24, 500, 0.3);
    },
    morning_mist: async function (X) {
      var b = X.foe, blobs = [];
      for (var i = 0; i < 9; i++) blobs.push({ x: b.x + R(-40, 40), y: b.y + R(-10, 14), r: R(9, 16), v: R(0.3, 0.8) * (i % 2 ? 1 : -1) });
      X.fx(1700, function (g, k) {
        var a = Math.sin(Math.min(1, k * 1.3) * Math.PI) * 0.55 + (k > 0.6 ? 0.15 : 0);
        blobs.forEach(function (q) { var x = q.x + (b.x - q.x) * Math.min(1, k * 1.6) + Math.sin(k * 6 + q.r) * 3; blob(g, x, q.y, q.r, 'rgba(220,235,255,.95)', a * 0.8); });
      });
      await X.wait(700);
    },
    // ----- wind
    crescent_blade: async function (X) {
      var a = X.a, b = X.b;
      for (var n = 0; n < 3; n++) {
        (function (n) {
          var off = (n - 1) * 14, ctl = [(a.x + b.x) / 2 + off, (a.y + b.y) / 2 - 14 + off * 0.5];
          X.tween(330, function () {}, function (g, k) {
            var p = bez([a.x, a.y], ctl, [b.x, b.y], k), q = bez([a.x, a.y], ctl, [b.x, b.y], Math.max(0, k - 0.08)), ang = Math.atan2(p[1] - q[1], p[0] - q[0]);
            glow(g, arcPts(p[0], p[1], 6, (ang - 1.6) / Math.PI, (ang + 1.6) / Math.PI), 1, '#bffff2', 1);
          });
        })(n);
        await X.wait(110);
      }
      await X.wait(230);
      X.fx(260, function (g, k) { for (var i = 0; i < 3; i++) { var o = (i - 1) * 5; glow(g, [[b.x - 9 + o, b.y - 9], [b.x - 9 + o + 18 * Math.min(1, k * 2), b.y - 9 + 18 * Math.min(1, k * 2)]], 0.8, '#e6fffa', 1 - k); } });
      burst(X, b.x, b.y, ['#dffcf6', '#9ff0e0', '#fff'], 22, 1.8);
    },
    spiral_gale: async function (X) {
      var b = X.b, deb = [];
      for (var i = 0; i < 18; i++) deb.push({ a: R(0, 6.28), h: R(0, 1), v: R(4, 7) });
      X.lift(10, 900);
      var imp = X.tween(950, function () {}, function (g, k) {
        var grow = Math.min(1, k * 2.5), fade = k > 0.8 ? (1 - k) / 0.2 : 1;
        g.globalCompositeOperation = 'lighter';
        for (var j = 0; j < 9; j++) {
          var t = j / 8, y = b.gy - t * 46 * grow, rx = (4 + t * 16) * grow, sp = k * 26 + j * 0.9;
          g.globalAlpha = 0.5 * fade; g.strokeStyle = j % 2 ? '#dffcf6' : '#9ff0e0'; g.lineWidth = 1;
          g.beginPath(); g.ellipse(b.x + Math.sin(sp * 0.3) * 2, y, rx, rx * 0.28, 0, sp % 6.28, sp % 6.28 + 4.2); g.stroke();
        }
        g.globalAlpha = fade; g.fillStyle = '#c8a070';
        deb.forEach(function (d) { var ang = d.a + k * d.v * 4, r = (4 + d.h * 14) * grow; g.fillRect(b.x + Math.cos(ang) * r, b.gy - d.h * 44 * grow - k * 6, 1, 1); });
        g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      });
      await X.wait(450); X.shake(0.6); await imp;
      burst(X, b.x, b.y, ['#dffcf6', '#fff'], 16, 1.4);
    },
    tailwind: async function (X) {
      var a = X.a, lines = [];
      for (var i = 0; i < 16; i++) lines.push({ y: a.y + R(-22, 16), x: R(-40, 0), l: R(10, 26), v: R(3, 5) });
      X.fx(900, function (g, k) {
        lines.forEach(function (q) { var x = a.x - 50 + ((q.x + k * q.v * 60) % 110); glow(g, [[x, q.y], [x + q.l, q.y]], 0.5, '#dffcf6', 0.7 * Math.sin(k * Math.PI)); });
        var pts = []; for (var j = 0; j <= 16; j++) { var t = k * 12 + j * 0.35; pts.push([a.x + Math.cos(t) * (9 + j * 0.4), a.y + 6 - j * 1.6 + Math.sin(t) * 3]); }
        glow(g, pts, 0.9, '#9ff0e0', 1 - k);
      });
      X.lift(4, 700); await X.wait(800);
    },
    // ----- grass
    leaf_volley: async function (X) {
      var a = X.a, b = X.b, leaves = [];
      for (var i = 0; i < 9; i++) leaves.push({ t0: i * 0.07, c: [(a.x + b.x) / 2 + R(-22, 22), (a.y + b.y) / 2 + R(-26, 6)], e: [b.x + R(-5, 5), b.y + R(-5, 5)] });
      await X.tween(760, function () {}, function (g, k) {
        leaves.forEach(function (q, i) {
          var t = Math.max(0, Math.min(1, (k - q.t0) / 0.42)); if (t <= 0 || t >= 1) return;
          var p = bez([a.x, a.y], q.c, q.e, t), r = k * 22 + i;
          g.save(); g.translate(p[0], p[1]); g.rotate(r);
          g.fillStyle = i % 2 ? '#7ed957' : '#a8ec6c'; g.beginPath(); g.moveTo(-3, 0); g.quadraticCurveTo(0, -2, 3, 0); g.quadraticCurveTo(0, 2, -3, 0); g.fill();
          g.fillStyle = '#e8ffd0'; g.fillRect(-2, 0, 4, 0.5); g.restore();
        });
      });
      burst(X, b.x, b.y, ['#7ed957', '#c8f59a', '#4a9a30'], 24, 1.5, { g: 0.03, n: 1 });
    },
    thorn_lash: async function (X) {
      var b = X.b, vines = [];
      for (var i = 0; i < 3; i++) vines.push({ x: b.x + (i - 1) * 12, c: (i - 1) * -18 + R(-4, 4), h: R(30, 40) });
      X.fx(300, function (g, k) { g.strokeStyle = '#3a2a18'; g.globalAlpha = 1 - k * 0.3; g.lineWidth = 1; for (var i = 0; i < 5; i++) { var an = i * 1.25; g.beginPath(); g.moveTo(b.x, b.gy); g.lineTo(b.x + Math.cos(an) * 14 * k, b.gy + Math.sin(an) * 4 * k); g.stroke(); } g.globalAlpha = 1; }, true);
      await X.wait(200);
      await X.tween(560, function () {}, function (g, k) {
        vines.forEach(function (v, i) {
          var grow = Math.min(1, k * 1.8), snap = k > 0.55 ? Math.sin((k - 0.55) / 0.45 * Math.PI) * 10 : 0, pts = [];
          for (var j = 0; j <= 12 * grow; j++) { var t = j / 12; pts.push([v.x + (v.c + snap * (i - 1 || 1)) * t * t + Math.sin(t * 7 + k * 8) * 1.5, b.gy - v.h * t]); }
          g.lineCap = 'round'; stroke(g, pts, 2.6, '#2f6a22'); stroke(g, pts, 1.2, '#5fb043');
          g.fillStyle = '#d8f0a0'; for (var m = 2; m < pts.length; m += 2) g.fillRect(pts[m][0] + (m % 4 ? 1 : -2), pts[m][1], 1, 1);
        });
      });
      for (var n = 0; n < 20; n++) X.P({ x: b.x + R(-10, 10), y: b.y + R(-12, 6), vx: R(-1, 1), vy: R(-1.4, -0.2), g: 0.04, c: n % 2 ? '#5fb043' : '#9adf6a', d: 0.02, s: 1.5, n: 1 });
      X.shake(1);
    },
    deep_root: async function (X) {
      var a = X.a, roots = [];
      for (var i = 0; i < 7; i++) roots.push({ an: i / 7 * 6.283 + R(-0.2, 0.2), l: R(14, 24) });
      X.fx(1500, function (g, k) {
        var grow = Math.min(1, k * 2), al = k > 0.75 ? (1 - k) / 0.25 : 1;
        roots.forEach(function (r) { var pts = []; for (var j = 0; j <= 8 * grow; j++) { var t = j / 8; pts.push([a.x + Math.cos(r.an) * r.l * t + Math.sin(t * 9) * 1.2, a.gy + Math.sin(r.an) * r.l * t * 0.3]); } stroke(g, pts, 1.6, '#6a4a28', al); stroke(g, pts, 0.6, '#a8ec6c', al * 0.8); });
      }, true);
      for (var j = 0; j < 4; j++) { for (var s = 0; s < 8; s++) X.P({ x: a.x + R(-14, 14), y: a.gy + R(-3, 2), vy: R(-0.7, -0.25), vx: R(-0.1, 0.1), c: s % 2 ? '#e8ff90' : '#a8ec6c', d: 0.015, s: 1 }); await X.wait(180); }
    },
    // ----- electric
    arc_crackle: async function (X) {
      var a = X.a, b = X.b, bolt = null;
      await X.tween(480, function () {}, function (g, k) {
        if (!bolt || Math.random() < 0.5) bolt = [jag(a.x, a.y, b.x, b.y, 9, 7), jag(a.x, a.y - 3, b.x, b.y + 2, 7, 10)];
        glow(g, bolt[0], 1.1, '#7ff0ff', 1); glow(g, bolt[1], 0.6, '#c8fbff', 0.6);
        if (Math.random() < 0.3) X.flash('#bff8ff', 0.08);
      });
      burst(X, b.x, b.y, ['#7ff0ff', '#fff', '#fff8a0'], 26, 2); X.flash('#c8fbff', 0.3);
    },
    sky_fork: async function (X) {
      var b = X.b; X.dim(0.45, 900);
      await X.wait(250);
      var main = jag(b.x + R(-10, 10), -4, b.x, b.y, 12, 6), br = [];
      for (var i = 3; i < 9; i += 3) { var p = main[i]; br.push(jag(p[0], p[1], p[0] + R(-22, 22), p[1] + R(12, 24), 5, 4)); }
      X.fx(420, function (g, k) { var a = k < 0.15 ? 1 : 1 - k; glow(g, main, 2, '#9ff6ff', a); br.forEach(function (q) { glow(g, q, 0.9, '#9ff6ff', a * 0.8); }); });
      X.flash('#e8fdff', 0.75); X.shake(1.6);
      X.fx(900, function (g, k) { g.fillStyle = 'rgba(30,30,40,' + (0.5 * (1 - k)) + ')'; g.beginPath(); g.ellipse(b.x, b.gy, 14, 4, 0, 0, 6.283); g.fill(); }, true);
      burst(X, b.x, b.y, ['#7ff0ff', '#fff', '#fff8a0'], 40, 2.4);
      ring(X, b.x, b.gy, '#bff8ff', 30, 500, 0.3, 2);
    },
    static_field: async function (X) {
      var b = X.foe;
      X.fx(1100, function (g, k) {
        var al = Math.sin(k * Math.PI);
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = al * 0.5; g.strokeStyle = '#7ff0ff'; g.lineWidth = 0.8;
        g.beginPath(); g.ellipse(b.x, b.y, 20, 18, 0, 0, 6.283); g.stroke(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
        for (var i = 0; i < 3; i++) if (Math.random() < 0.6) { var an = Math.random() * 6.283, an2 = an + R(0.4, 1.2); glow(g, jag(b.x + Math.cos(an) * 20, b.y + Math.sin(an) * 18, b.x + Math.cos(an2) * 20, b.y + Math.sin(an2) * 18, 4, 3), 0.5, '#bff8ff', al); }
      });
      for (var j = 0; j < 6; j++) { burst(X, b.x + R(-14, 14), b.y + R(-12, 12), ['#fff', '#7ff0ff'], 4, 0.8); await X.wait(120); }
    },
    // ----- earth
    boulder_toss: async function (X) {
      var a = X.a, b = X.b, top = [(a.x + b.x) / 2, Math.min(a.y, b.y) - 44];
      for (var i = 0; i < 10; i++) X.P({ x: a.x + R(-8, 8), y: a.gy, vx: R(-0.5, 0.5), vy: R(-0.6, -0.1), c: '#b89a78', d: 0.02, s: 2, n: 1 });
      var rot = 0;
      await X.tween(620, function () {}, function (g, k) {
        var p = k < 0.18 ? [a.x, a.gy - k / 0.18 * 16] : bez([a.x, a.gy - 16], top, [b.x, b.y], (k - 0.18) / 0.82); rot += 0.25;
        g.save(); g.translate(p[0], p[1]); g.rotate(rot);
        g.fillStyle = '#7a5a3a'; g.beginPath(); g.arc(0, 0, 6, 0, 6.283); g.fill();
        g.fillStyle = '#a07a52'; g.beginPath(); g.arc(-1, -1, 4.5, 0, 6.283); g.fill();
        g.fillStyle = '#5a4028'; g.fillRect(1, 1, 2, 2); g.fillRect(-3, 0, 1, 2); g.fillStyle = '#c8a078'; g.fillRect(-3, -3, 2, 1);
        g.restore();
      });
      X.shake(1.5);
      for (var j = 0; j < 26; j++) X.P({ x: b.x + R(-8, 8), y: b.y + R(-4, 8), vx: R(-1.2, 1.2), vy: R(-1.8, -0.3), g: 0.08, c: ['#7a5a3a', '#a07a52', '#c8a078'][j % 3], d: 0.02, s: R(1, 2.5), n: 1 });
      dust(X, b.x, b.gy, 8);
    },
    stone_eruption: async function (X) {
      var b = X.b, cr = [];
      for (var i = 0; i < 6; i++) cr.push([R(0, 6.28), R(10, 22)]);
      X.fx(1300, function (g, k) { g.strokeStyle = '#2a1a10'; g.lineWidth = 0.8; g.globalAlpha = Math.min(1, (1 - k) * 2); cr.forEach(function (c) { g.beginPath(); g.moveTo(b.x, b.gy); g.lineTo(b.x + Math.cos(c[0]) * c[1] * Math.min(1, k * 4), b.gy + Math.sin(c[0]) * c[1] * 0.3 * Math.min(1, k * 4)); g.stroke(); }); g.globalAlpha = 1; }, true);
      X.shake(0.5); await X.wait(260);
      var spikes = [];
      for (var s = 0; s < 5; s++) spikes.push({ x: b.x + (s - 2) * 7 + R(-2, 2), h: s === 2 ? 30 : R(14, 22), t0: Math.abs(s - 2) * 0.08, w: s === 2 ? 6 : 4 });
      X.fx(900, function (g, k) {
        spikes.forEach(function (q) {
          var t = Math.max(0, Math.min(1, (k - q.t0) / 0.2)), sink = k > 0.75 ? (k - 0.75) / 0.25 : 0, h = q.h * t * (1 - sink);
          if (h <= 0) return;
          g.fillStyle = '#6a4a2a'; g.beginPath(); g.moveTo(q.x - q.w, b.gy + 2); g.lineTo(q.x + 1, b.gy - h); g.lineTo(q.x + q.w, b.gy + 2); g.fill();
          g.fillStyle = '#a07a52'; g.beginPath(); g.moveTo(q.x - q.w + 1, b.gy + 2); g.lineTo(q.x + 1, b.gy - h); g.lineTo(q.x, b.gy + 2); g.fill();
        });
      });
      X.lift(8, 500); X.shake(2);
      for (var j = 0; j < 30; j++) X.P({ x: b.x + R(-14, 14), y: b.gy, vx: R(-1.4, 1.4), vy: R(-2.6, -0.8), g: 0.1, c: ['#5a4028', '#a07a52', '#c8a078'][j % 3], d: 0.018, s: R(1, 2.5), n: 1 });
      dust(X, b.x, b.gy, 12);
      await X.wait(120);
    },
    stone_shell: async function (X) {
      var a = X.a, plates = [];
      for (var i = 0; i < 8; i++) plates.push(i / 8 * 6.283);
      X.fx(1300, function (g, k) {
        var r = 26 - Math.min(1, k * 1.6) * 12, al = k > 0.8 ? (1 - k) / 0.2 : 1;
        plates.forEach(function (an, i) {
          var t = an + k * 4 * (1 - k), x = a.x + Math.cos(t) * r, y = a.y + 2 + Math.sin(t) * r * 0.6;
          g.globalAlpha = al; g.fillStyle = '#7a5a3a'; g.fillRect(x - 3, y - 2, 6, 4); g.fillStyle = '#b08860'; g.fillRect(x - 3, y - 2, 6, 1.5); g.globalAlpha = 1;
        });
        if (k > 0.55) { g.globalAlpha = (k > 0.8 ? (1 - k) / 0.2 : 1) * 0.5; g.strokeStyle = '#d8b088'; g.lineWidth = 1; g.beginPath(); g.ellipse(a.x, a.y + 2, 15, 13, 0, 0, 6.283); g.stroke(); g.globalAlpha = 1; }
      });
      await X.wait(700); X.shake(0.6); dust(X, a.x, a.gy, 8); await X.wait(300);
    },
    // ----- dark
    shadow_claw: async function (X) {
      var b = X.b; X.dim(0.6, 1100);
      await X.wait(240);
      var slashes = [0, 1, 2].map(function (i) { var o = (i - 1) * 6; return [[b.x - 14 + o, b.y - 14], [b.x + 12 + o, b.y + 12]]; });
      await X.tween(330, function () {}, function (g, k) {
        slashes.forEach(function (s, i) {
          var t = Math.max(0, Math.min(1, k * 1.6 - i * 0.2)); if (!t) return;
          var e = [s[0][0] + (s[1][0] - s[0][0]) * t, s[0][1] + (s[1][1] - s[0][1]) * t];
          g.lineCap = 'round'; stroke(g, [s[0], e], 3.2, '#1a0a2a', 0.9); glow(g, [[s[0][0] + 1, s[0][1]], [e[0] + 1, e[1]]], 0.7, '#c08aff', 1);
        });
      });
      X.flash('#5a2a90', 0.3); X.shake(1);
      X.fx(700, function (g, k) { slashes.forEach(function (s) { g.lineCap = 'round'; stroke(g, s, 2.5 * (1 - k), '#120618', 0.8 * (1 - k)); glow(g, [[s[0][0] + 1, s[0][1]], [s[1][0] + 1, s[1][1]]], 0.5, '#a070ff', 1 - k); }); });
      wisps(X, b.x, b.y, 16);
    },
    night_tendrils: async function (X) {
      var b = X.b; X.dim(0.8, 1700);
      await X.wait(260);
      var eyes = [], tend = [];
      for (var i = 0; i < 6; i++) eyes.push({ x: R(10, X.W - 10), y: R(X.Hh * 0.08, X.Hh * 0.7), t0: R(0, 0.5) });
      for (var j = 0; j < 5; j++) tend.push({ x: b.x + (j - 2) * 8 + R(-2, 2), h: R(26, 40), ph: R(0, 6), lean: (j - 2) * 2 });
      X.fx(1300, function (g, k) {
        eyes.forEach(function (e) { var t = k - e.t0; if (t < 0 || t > 0.6) return; var bl = Math.floor(t * 20) % 7 === 0 ? 0.3 : 1; g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(220,170,255,' + bl + ')'; g.fillRect(e.x, e.y, 1.5, 1); g.fillRect(e.x + 4, e.y, 1.5, 1); g.globalCompositeOperation = 'source-over'; });
      });
      await X.tween(900, function () {}, function (g, k) {
        tend.forEach(function (q) {
          var grow = Math.min(1, k * 1.5), pts = [];
          for (var m = 0; m <= 14 * grow; m++) { var t = m / 14; pts.push([q.x + Math.sin(t * 6 + k * 7 + q.ph) * 3 * t + q.lean * t * 4 + (b.x - q.x) * t * t * 0.7, b.gy - q.h * t]); }
          g.lineCap = 'round'; stroke(g, pts, 3, '#0c0414', 0.95); stroke(g, pts, 1.4, '#3a1a5a', 0.95); glow(g, pts.slice(-3), 0.5, '#b080ff', 0.8);
        });
      });
      X.flash('#2a0a40', 0.6); X.fx(260, function (g, k) { g.globalCompositeOperation = 'lighter'; blob(g, b.x, b.y, 30, 'rgba(160,90,255,1)', 0.8 * (1 - k)); g.globalCompositeOperation = 'source-over'; });
      X.shake(1.6); wisps(X, b.x, b.y, 24);
    },
    veil_step: async function (X) {
      var a = X.a; X.dim(0.35, 900); X.fade(0.35, 900);
      X.fx(900, function (g, k) { for (var i = 1; i <= 2; i++) { g.globalAlpha = 0.25 * (1 - k); g.fillStyle = '#2a1640'; g.beginPath(); g.ellipse(a.x - i * 8 * k, a.y, 9, 12, 0, 0, 6.283); g.fill(); } g.globalAlpha = 1; });
      wisps(X, a.x, a.y, 20); await X.wait(900);
    },
    // ----- light
    halo_burst: async function (X) {
      var b = X.b;
      await X.tween(420, function () {}, function (g, k) {
        var y = b.y - 22 + k * 8; g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.9; g.strokeStyle = '#fff2a8'; g.lineWidth = 1.4;
        g.beginPath(); g.ellipse(b.x, y, 6 + k * 4, 2 + k, 0, 0, 6.283); g.stroke(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
        if (Math.random() < 0.6) X.P({ x: b.x + R(-8, 8), y: y, vy: 0.4, c: '#fff8d0', d: 0.05, s: 1 });
      });
      for (var i = 0; i < 3; i++) ring(X, b.x, b.y, i ? '#fff2a8' : '#ffffff', 22 + i * 8, 420 + i * 120, 0.8, 1.6);
      X.fx(380, function (g, k) { g.globalCompositeOperation = 'lighter'; blob(g, b.x, b.y, 24, 'rgba(255,246,200,1)', 0.9 * (1 - k)); g.globalCompositeOperation = 'source-over'; });
      burst(X, b.x, b.y, ['#fff2a8', '#fff', '#ffe08a'], 28, 1.6); X.flash('#fff6d0', 0.3);
    },
    dawn_beam: async function (X) {
      var b = X.b;
      await X.tween(700, function (k) { if (k > 0.3) X.P({ x: b.x + R(-8, 8), y: R(0, b.y), vy: R(0.4, 1), c: '#fff8d0', d: 0.04, s: 1 }); }, function (g, k) {
        var w = 3 + k * 9; g.globalCompositeOperation = 'lighter';
        var gr = g.createLinearGradient(b.x - w, 0, b.x + w, 0); gr.addColorStop(0, 'rgba(255,240,170,0)'); gr.addColorStop(0.5, 'rgba(255,250,220,' + (0.4 + k * 0.5) + ')'); gr.addColorStop(1, 'rgba(255,240,170,0)');
        g.fillStyle = gr; g.fillRect(b.x - w, 0, w * 2, b.gy); g.fillStyle = 'rgba(255,255,255,' + (0.5 * k) + ')'; g.fillRect(b.x - 1, 0, 2, b.gy);
        g.globalCompositeOperation = 'source-over';
      });
      X.flash('#fffbe8', 0.8); X.shake(0.8);
      X.fx(700, function (g, k) { g.globalCompositeOperation = 'lighter'; blob(g, b.x, b.y, 40, 'rgba(255,250,220,1)', 1 - k); g.globalCompositeOperation = 'source-over'; });
      ring(X, b.x, b.gy, '#fff2a8', 34, 600, 0.3, 2);
      burst(X, b.x, b.y, ['#fff2a8', '#fff', '#ffe08a'], 40, 2);
    },
    bless: async function (X) {
      var a = X.a;
      X.fx(1300, function (g, k) {
        var al = Math.sin(k * Math.PI); g.globalCompositeOperation = 'lighter';
        g.globalAlpha = al; g.strokeStyle = '#fff2a8'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(a.x, a.y - 20, 8, 2.5, 0, 0, 6.283); g.stroke(); g.globalAlpha = 1;
        blob(g, a.x, a.y, 26, 'rgba(255,246,210,1)', al * 0.5); g.globalCompositeOperation = 'source-over';
      });
      for (var i = 0; i < 6; i++) { for (var j = 0; j < 5; j++) X.P({ x: a.x + R(-16, 16), y: a.y - R(14, 30), vy: R(0.2, 0.5), vx: R(-0.1, 0.1), c: j % 2 ? '#fff' : '#fff2a8', d: 0.018, s: 1 }); await X.wait(140); }
      X.flash('#fff8e0', 0.15);
    }
  };
  function arcPts(x, y, r, a0, a1) { var pts = []; for (var i = 0; i <= 10; i++) { var t = (a0 + (a1 - a0) * i / 10) * Math.PI; pts.push([x + Math.cos(t) * r, y + Math.sin(t) * r]); } return pts; }
  function dust(X, x, y, n) { for (var i = 0; i < n; i++) X.P({ x: x + R(-10, 10), y: y + R(-3, 1), vx: R(-0.6, 0.6), vy: R(-0.35, -0.05), c: 'rgba(200,175,140,.8)', d: 0.012, s: R(3, 5), n: 1, dr: 0.96 }); }
  function wisps(X, x, y, n) { for (var i = 0; i < n; i++) X.P({ x: x + R(-10, 10), y: y + R(-8, 10), vx: R(-0.4, 0.4), vy: R(-0.8, -0.2), c: i % 3 ? '#2a1640' : '#a070ff', d: 0.018, s: R(1.5, 3), n: i % 3 ? 1 : 0, dr: 0.97 }); }

  // Lingering reaction on the target after a hit: embers, drips, sparks, leaf bits, dust, shadow wisps...
  function linger(X, el) {
    var b = X.b;
    X.fx(1500, function (g, k) {
      if (Math.random() > 0.45) return;
      var x = b.x + R(-8, 8), y = b.y + R(-8, 8);
      if (el === 'fire') X.P({ x: x, y: y, vy: R(-0.8, -0.3), c: Math.random() < 0.5 ? '#ff8a3c' : '#ffd27a', d: 0.03, s: 1 });
      else if (el === 'water') X.P({ x: x, y: b.y + R(0, 8), vy: 0.2, g: 0.04, c: '#7cc4ff', d: 0.03, s: 1, n: 1 });
      else if (el === 'electric') { if (Math.random() < 0.5) X.P({ x: x, y: y, vx: R(-1, 1), vy: R(-1, 1), c: '#fff', d: 0.12, s: 1 }); }
      else if (el === 'grass') X.P({ x: x, y: y, vx: R(-0.3, 0.3), vy: 0.15, g: 0.01, c: '#7ed957', d: 0.02, s: 1.5, n: 1 });
      else if (el === 'earth') X.P({ x: x, y: b.gy - R(0, 4), vx: R(-0.3, 0.3), vy: -0.1, c: 'rgba(200,175,140,.6)', d: 0.02, s: 3, n: 1 });
      else if (el === 'dark') X.P({ x: x, y: y, vy: R(-0.5, -0.2), c: '#3a1a5a', d: 0.025, s: 2, n: 1 });
      else if (el === 'light') X.P({ x: x, y: y - 6, vy: R(-0.4, -0.1), c: '#fff8d0', d: 0.03, s: 1 });
      else if (el === 'wind') X.P({ x: x, y: y, vx: R(0.5, 1.2) * (Math.random() < 0.5 ? -1 : 1), c: '#dffcf6', d: 0.05, s: 1 });
    });
  }
  // generic "gathers power" (enemy Charge intent), healing, hex
  async function charge(X, el) {
    var a = X.a;
    X.fx(1000, function (g, k) { g.globalCompositeOperation = 'lighter'; blob(g, a.x, a.y, 16 + k * 10, hexA(COL[el], 1), 0.5 * Math.sin(k * Math.PI)); g.globalCompositeOperation = 'source-over'; });
    for (var i = 0; i < 6; i++) { for (var j = 0; j < 5; j++) { var an = Math.random() * 6.283; X.P({ x: a.x + Math.cos(an) * 26, y: a.y + Math.sin(an) * 22, vx: -Math.cos(an) * 0.9, vy: -Math.sin(an) * 0.8, c: j % 2 ? '#fff' : COL[el], d: 0.035, s: 1 }); } await X.wait(130); }
  }
  async function guard(X, el) {
    var a = X.a;
    X.fx(900, function (g, k) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.sin(k * Math.PI) * 0.8; g.strokeStyle = COL[el]; g.lineWidth = 1.2; g.beginPath(); g.ellipse(a.x, a.y, 18, 18, 0, 0, 6.283); g.stroke(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; });
    await X.wait(700);
  }
  async function hex(X) {
    var a = X.a, b = X.b;
    await X.tween(700, function () {}, function (g, k) {
      var p = [a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k - Math.sin(k * Math.PI) * 14], pts = [];
      for (var i = 0; i <= 14; i++) { var t = i / 14 * 6.283 * 1.5 + k * 10, r = 1 + i * 0.4; pts.push([p[0] + Math.cos(t) * r, p[1] + Math.sin(t) * r]); }
      glow(g, pts, 0.7, '#c49aff', 1);
    });
    for (var j = 0; j < 14; j++) X.P({ x: b.x + R(-8, 8), y: b.y + R(-10, 4), vy: -0.3, c: '#c49aff', d: 0.025, s: 1 });
  }
  async function heal(X, col) {
    var a = X.a;
    for (var i = 0; i < 4; i++) { for (var j = 0; j < 6; j++) X.P({ x: a.x + R(-12, 12), y: a.y + R(-2, 12), vy: R(-0.8, -0.3), c: j % 2 ? '#fff' : (col || '#9cf0a6'), d: 0.025, s: 1 }); await X.wait(120); }
    ring(X, a.x, a.gy, col || '#9cf0a6', 18, 600, 0.3);
  }
  function hexA(h, a) { var n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }

  H.moves = { MOVES: MOVES, ANIM: ANIM, COL: COL, linger: linger, charge: charge, guard: guard, hex: hex, heal: heal, glow: glow, blob: blob, ring: ring, hexA: hexA };
})();
