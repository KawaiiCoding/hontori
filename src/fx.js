window.H = window.H || {};
(function () {
  'use strict';
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function mod(a, n) { return ((a % n) + n) % n; }
  function hourOf(env) { return env && typeof env.time === 'number' ? mod(env.time, 24) : 12; }
  function isNight(h) { return h >= 19.5 || h < 5.5; }

  // ---------- cached sprites ----------
  var glowCache = {};
  // radial glow sprite (64px) in given color; used for holes (white) + additive glow
  function glow(color) {
    var g = glowCache[color];
    if (g) return g;
    var S = 64, c = mk(S, S), x = c.getContext('2d');
    var gr = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    gr.addColorStop(0, color);
    gr.addColorStop(0.35, withAlpha(color, 0.6));
    gr.addColorStop(0.7, withAlpha(color, 0.18));
    gr.addColorStop(1, withAlpha(color, 0));
    x.fillStyle = gr; x.fillRect(0, 0, S, S);
    glowCache[color] = c;
    return c;
  }
  var parseCache = {};
  function rgb(color) {
    var p = parseCache[color];
    if (p) return p;
    var r = 255, g = 220, b = 160;
    if (color && color[0] === '#') {
      var s = color.slice(1);
      if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
      r = parseInt(s.slice(0, 2), 16); g = parseInt(s.slice(2, 4), 16); b = parseInt(s.slice(4, 6), 16);
    } else if (color) {
      var m = color.match(/(\d+)\D+(\d+)\D+(\d+)/);
      if (m) { r = +m[1]; g = +m[2]; b = +m[3]; }
    }
    p = parseCache[color] = [r, g, b];
    return p;
  }
  function withAlpha(color, a) { var p = rgb(color); return 'rgba(' + p[0] + ',' + p[1] + ',' + p[2] + ',' + a + ')'; }

  // pixel-ish soft ellipse shadow sprites, keyed by rx/ry
  var shCache = {};
  function shadowSprite(rx, ry) {
    var key = rx + 'x' + ry, s = shCache[key];
    if (s) return s;
    var w = rx * 2 + 2, h = ry * 2 + 2, c = mk(w, h), x = c.getContext('2d');
    var cx = w / 2, cy = h / 2;
    for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) {
      var dx = (xx + 0.5 - cx) / rx, dy = (yy + 0.5 - cy) / ry, d = dx * dx + dy * dy;
      if (d > 1) continue;
      var a = d < 0.45 ? 0.55 : d < 0.75 ? 0.38 : 0.2; // 3 stepped tones
      x.fillStyle = 'rgba(16,10,28,' + a + ')';
      x.fillRect(xx, yy, 1, 1);
    }
    shCache[key] = c;
    return c;
  }

  // sun: returns {dx, stretch, alpha}
  function sun(env) {
    var h = hourOf(env);
    if (env && env.indoor) return { dx: 0, dy: 0, st: 1, a: isNight(h) ? 0.7 : 0.85 };
    if (h < 6 || h > 19) return { dx: 0, dy: 0, st: 1, a: 0.45 };
    var k = (h - 6) / 13;               // 0 sunrise .. 1 sunset
    var ang = (k - 0.5) * Math.PI;      // -90..90
    var low = Math.abs(Math.sin(ang));  // 1 at horizon
    var wx = env && env.weather;
    var a = (wx === 'rain' || wx === 'fog') ? 0.5 : wx === 'snow' ? 0.65 : 1;
    var edge = clamp(Math.min(h - 6, 19 - h) / 1.2, 0, 1);
    return { dx: -Math.sin(ang), dy: 0.25 + 0.35 * low, st: 1 + low * 0.9, a: a * (0.55 + 0.45 * edge) };
  }

  function shadow(ctx, x, y, rx, ry, env) {
    var s = sun(env);
    rx = Math.max(1, Math.round(rx)); ry = Math.max(1, Math.round(ry));
    var srx = Math.round(rx * s.st), spr = shadowSprite(srx, ry);
    var ox = Math.round(s.dx * rx * 0.6), oy = Math.round(s.dy * ry);
    var pa = ctx.globalAlpha;
    ctx.globalAlpha = pa * s.a;
    ctx.drawImage(spr, Math.round(x - spr.width / 2 + ox), Math.round(y - spr.height / 2 + oy));
    ctx.globalAlpha = pa;
  }

  // ---------- lighting ----------
  // keyframes: hour -> darkness rgb + alpha, tint rgb + alpha (tint drawn over, warm/golden)
  var KF = [
    [0, [6, 10, 36, 0.74], [40, 60, 140, 0.06]],
    [4.5, [8, 12, 40, 0.70], [40, 60, 140, 0.06]],
    [5.8, [50, 30, 70, 0.48], [255, 120, 90, 0.08]],
    [6.8, [70, 40, 50, 0.22], [255, 170, 80, 0.16]],
    [8.2, [0, 0, 0, 0], [255, 220, 150, 0.06]],
    [11, [0, 0, 0, 0], [255, 255, 240, 0]],
    [15.5, [0, 0, 0, 0], [255, 230, 180, 0.03]],
    [17.5, [60, 20, 40, 0.10], [255, 150, 60, 0.16]],
    [18.8, [60, 20, 60, 0.32], [255, 100, 60, 0.16]],
    [19.8, [24, 18, 66, 0.55], [120, 80, 180, 0.08]],
    [21, [8, 12, 40, 0.72], [40, 60, 140, 0.06]],
    [24, [6, 10, 36, 0.74], [40, 60, 140, 0.06]]
  ];
  function ambient(env) {
    var h = hourOf(env), i = 0;
    while (i < KF.length - 2 && KF[i + 1][0] <= h) i++;
    var A = KF[i], B = KF[i + 1], k = clamp((h - A[0]) / (B[0] - A[0]), 0, 1);
    var d = [], t = [];
    for (var j = 0; j < 4; j++) { d[j] = lerp(A[1][j], B[1][j], k); t[j] = lerp(A[2][j], B[2][j], k); }
    if (env && env.indoor) {
      // indoor: dim warm at night, slight warmth by day
      if (isNight(h) || d[3] > 0.3) { d = [22, 12, 30, Math.max(0.62, d[3] * 0.9)]; t = [255, 150, 70, 0.07]; }
      else { d = [30, 20, 20, d[3] * 0.6 + 0.08]; t = [255, 210, 150, 0.06]; }
    } else {
      var w = env && env.weather;
      if (w === 'rain') { d[0] = lerp(d[0], 20, 0.5); d[1] = lerp(d[1], 30, 0.5); d[2] = lerp(d[2], 50, 0.5); d[3] = Math.min(0.85, d[3] + 0.22); t[3] *= 0.3; }
      else if (w === 'fog') { d[3] = Math.min(0.85, d[3] + 0.06); t[3] *= 0.5; }
      else if (w === 'snow') { d[2] = lerp(d[2], 80, 0.4); d[3] = Math.min(0.85, d[3] + 0.08); }
    }
    return { d: d, t: t };
  }

  function createLighting(w, h) {
    var dark = mk(w, h), dx = dark.getContext('2d');
    function render(ctx, camX, camY, env, lights) {
      env = env || {};
      var am = ambient(env), d = am.d, t = am.t, tm = env.t || 0;
      var n = lights ? lights.length : 0, i, L, r, sx, sy, f, g;
      // tint (golden morning / warm dusk)
      if (t[3] > 0.005) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(' + (t[0] | 0) + ',' + (t[1] | 0) + ',' + (t[2] | 0) + ',' + t[3].toFixed(3) + ')';
        ctx.fillRect(0, 0, w, h);
      }
      if (d[3] > 0.01) {
        dx.globalCompositeOperation = 'source-over';
        dx.clearRect(0, 0, w, h);
        dx.fillStyle = 'rgba(' + (d[0] | 0) + ',' + (d[1] | 0) + ',' + (d[2] | 0) + ',' + d[3].toFixed(3) + ')';
        dx.fillRect(0, 0, w, h);
        dx.globalCompositeOperation = 'destination-out';
        var hole = glow('#ffffff');
        for (i = 0; i < n; i++) {
          L = lights[i]; f = flick(L, tm, i); r = (L.r || 40) * f * 1.15;
          sx = L.x - camX; sy = L.y - camY;
          if (sx + r < 0 || sy + r < 0 || sx - r > w || sy - r > h) continue;
          dx.globalAlpha = clamp(0.75 + 0.25 * f, 0, 1);
          dx.drawImage(hole, sx - r, sy - r, r * 2, r * 2);
          dx.drawImage(hole, sx - r * 0.5, sy - r * 0.5, r, r); // bright core
        }
        dx.globalAlpha = 1;
        dx.globalCompositeOperation = 'source-over';
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(dark, 0, 0);
      }
      // additive colour glow (stronger when dark)
      var gs = 0.18 + d[3] * 0.75;
      if (n && gs > 0.05) {
        ctx.globalCompositeOperation = 'lighter';
        for (i = 0; i < n; i++) {
          L = lights[i]; f = flick(L, tm, i); r = (L.r || 40) * f;
          sx = L.x - camX; sy = L.y - camY;
          if (sx + r < 0 || sy + r < 0 || sx - r > w || sy - r > h) continue;
          g = glow(L.color || '#ffc070');
          ctx.globalAlpha = clamp(gs * (0.8 + 0.2 * f), 0, 1) * 0.55;
          ctx.drawImage(g, sx - r, sy - r, r * 2, r * 2);
          ctx.globalAlpha = clamp(gs * f, 0, 1) * 0.5;
          ctx.drawImage(g, sx - r * 0.35, sy - r * 0.35, r * 0.7, r * 0.7);
        }
        ctx.globalAlpha = 1;
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    return { render: render, canvas: dark };
  }
  function flick(L, t, i) {
    var fl = L.flicker || 0;
    if (!fl) return 1;
    var s = i * 7.13 + (L.x || 0) * 0.01;
    return 1 + fl * (0.06 * Math.sin(t * 9 + s) + 0.04 * Math.sin(t * 23.7 + s * 3) + 0.03 * Math.sin(t * 4.1 + s));
  }

  // ---------- weather ----------
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function createWeather(w, h) {
    var drops = [], splashes = [], flakes = [], leaves = [];
    var i;
    for (i = 0; i < 160; i++) drops.push({ x: rnd(0, w), y: rnd(0, h), v: rnd(220, 320), l: rnd(5, 10), z: rnd(0.6, 1.2) });
    for (i = 0; i < 140; i++) flakes.push({ x: rnd(0, w), y: rnd(0, h), v: rnd(10, 26), s: Math.random() < 0.25 ? 2 : 1, p: rnd(0, 6.28), z: rnd(0.5, 1.3) });
    var LEAFC = ['#e8a33c', '#d0602a', '#9cc24a', '#f6c6d8', '#ffe08a', '#c8e070'];
    for (i = 0; i < 40; i++) leaves.push({ x: rnd(0, w), y: rnd(0, h), vx: rnd(30, 70), vy: rnd(-6, 10), p: rnd(0, 6.28), c: LEAFC[i % LEAFC.length], z: rnd(0.7, 1.3) });

    // fog texture (soft blobs, tileable)
    var FW = 256, FH = 256, fog = mk(FW, FH), fx = fog.getContext('2d');
    for (i = 0; i < 60; i++) {
      var bx = rnd(0, FW), by = rnd(0, FH), br = rnd(20, 60);
      for (var ox = -1; ox <= 1; ox++) for (var oy = -1; oy <= 1; oy++) {
        var gr = fx.createRadialGradient(bx + ox * FW, by + oy * FH, 0, bx + ox * FW, by + oy * FH, br);
        gr.addColorStop(0, 'rgba(225,230,240,0.22)'); gr.addColorStop(1, 'rgba(225,230,240,0)');
        fx.fillStyle = gr; fx.fillRect(bx + ox * FW - br, by + oy * FH - br, br * 2, br * 2);
      }
    }
    // cloud shadow texture (tileable, big soft blobs)
    var CW = 512, CH = 512, cl = mk(CW, CH), cx = cl.getContext('2d');
    for (i = 0; i < 4; i++) {
      var ccx = rnd(0, CW), ccy = rnd(0, CH);
      for (var k = 0; k < 7; k++) {
        var px = ccx + rnd(-50, 50), py = ccy + rnd(-22, 22), pr = rnd(60, 110);
        for (var ax = -1; ax <= 1; ax++) for (var ay = -1; ay <= 1; ay++) {
          var g2 = cx.createRadialGradient(px + ax * CW, py + ay * CH, 0, px + ax * CW, py + ay * CH, pr);
          g2.addColorStop(0, 'rgba(30,40,70,0.07)'); g2.addColorStop(0.6, 'rgba(30,40,70,0.04)'); g2.addColorStop(1, 'rgba(20,24,50,0)');
          cx.fillStyle = g2; cx.fillRect(px + ax * CW - pr, py + ay * CH - pr, pr * 2, pr * 2);
        }
      }
    }
    var time = 0, flash = 0, intensity = 0, lastW = null;

    function update(dt, env) {
      env = env || {};
      dt = Math.min(dt || 0, 0.1);
      time += dt;
      var wx = env.weather || 'clear', wind = env.wind != null ? env.wind : (wx === 'wind' ? 0.7 : 0.15);
      if (wx !== lastW) { intensity = 0; lastW = wx; }
      intensity = Math.min(1, intensity + dt * 0.8);
      if (env.indoor) return;
      var j, p;
      if (wx === 'rain') {
        var sl = 40 + wind * 120;
        for (j = 0; j < drops.length; j++) {
          p = drops[j]; p.y += p.v * p.z * dt; p.x += sl * p.z * dt;
          if (p.y > h + 10) {
            if (Math.random() < 0.5 && splashes.length < 60) splashes.push({ x: p.x, y: rnd(10, h), a: 0 });
            p.y = rnd(-20, -2); p.x = rnd(-40, w);
          }
          if (p.x > w + 20) p.x -= w + 40;
        }
        for (j = splashes.length - 1; j >= 0; j--) { splashes[j].a += dt * 5; if (splashes[j].a >= 1) splashes.splice(j, 1); }
        if (flash > 0) flash -= dt * 3;
        else if (Math.random() < dt * 0.04) flash = 1;
      } else if (wx === 'snow') {
        for (j = 0; j < flakes.length; j++) {
          p = flakes[j]; p.p += dt * 1.5;
          p.y += p.v * p.z * dt; p.x += (Math.sin(p.p) * 8 + wind * 30) * p.z * dt;
          if (p.y > h + 2) { p.y = -2; p.x = rnd(0, w); }
          p.x = mod(p.x, w);
        }
      }
      if (wx === 'wind' || wind > 0.45) {
        for (j = 0; j < leaves.length; j++) {
          p = leaves[j]; p.p += dt * 4;
          p.x += (p.vx * (0.5 + wind)) * p.z * dt; p.y += (p.vy + Math.sin(p.p) * 18) * dt;
          if (p.x > w + 10) { p.x = -10; p.y = rnd(-10, h); }
          if (p.y > h + 10) p.y = -10; else if (p.y < -12) p.y = h + 8;
        }
      }
    }

    function draw(ctx, camX, camY, env) {
      env = env || {};
      var wx = env.weather || 'clear', hr = hourOf(env), j, p, a = intensity;
      if (env.indoor) return;
      ctx.globalCompositeOperation = 'source-over';
      // drifting cloud shadows (daytime, not heavy weather)
      if (hr > 6.2 && hr < 18.8 && wx !== 'rain' && wx !== 'fog') {
        var day = clamp(Math.min(hr - 6.2, 18.8 - hr) / 1.5, 0, 1);
        var ox = mod(-(camX + time * (6 + (env.wind || 0) * 18)), CW), oy = mod(-(camY + time * 2), CH);
        ctx.globalAlpha = (wx === 'snow' ? 0.4 : 0.7) * day;
        for (var tx = ox - CW; tx < w; tx += CW) for (var ty = oy - CH; ty < h; ty += CH) ctx.drawImage(cl, Math.round(tx), Math.round(ty));
        ctx.globalAlpha = 1;
      }
      if (wx === 'rain') {
        ctx.fillStyle = 'rgba(14,22,40,' + (0.18 * a).toFixed(3) + ')';
        ctx.fillRect(0, 0, w, h);
        var slx = 0.18 + (env.wind || 0) * 0.4;
        ctx.strokeStyle = 'rgba(180,200,235,' + (0.45 * a).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (j = 0; j < drops.length; j++) {
          p = drops[j];
          var x0 = Math.round(p.x), y0 = Math.round(p.y);
          ctx.moveTo(x0 + 0.5, y0); ctx.lineTo(x0 + 0.5 - p.l * slx, y0 - p.l * p.z);
        }
        ctx.stroke();
        ctx.fillStyle = 'rgba(200,220,255,0.5)';
        for (j = 0; j < splashes.length; j++) {
          p = splashes[j]; var s = 1 + Math.round(p.a * 3), sx = Math.round(p.x), sy = Math.round(p.y);
          ctx.globalAlpha = (1 - p.a) * a;
          ctx.fillRect(sx - s, sy, 1, 1); ctx.fillRect(sx + s, sy, 1, 1);
          ctx.fillRect(sx - s + 1, sy - 1, 1, 1); ctx.fillRect(sx + s - 1, sy - 1, 1, 1);
          if (p.a < 0.4) ctx.fillRect(sx, sy - 2, 1, 1);
        }
        ctx.globalAlpha = 1;
        if (flash > 0) { ctx.fillStyle = 'rgba(220,230,255,' + (flash * 0.35).toFixed(3) + ')'; ctx.fillRect(0, 0, w, h); }
      } else if (wx === 'snow') {
        ctx.fillStyle = 'rgba(200,215,240,' + (0.06 * a).toFixed(3) + ')';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#f4f8ff';
        for (j = 0; j < flakes.length; j++) {
          p = flakes[j];
          var fx2 = Math.round(mod(p.x - camX * 0.15 * p.z, w)), fy = Math.round(mod(p.y - camY * 0.15 * p.z, h));
          ctx.globalAlpha = (0.55 + 0.45 * (p.z - 0.5)) * a;
          ctx.fillRect(fx2, fy, p.s, p.s);
        }
        ctx.globalAlpha = 1;
      } else if (wx === 'fog') {
        var o1x = mod(-(camX * 0.9 + time * 7), FW), o1y = mod(-(camY * 0.9), FH);
        var o2x = mod(-(camX * 1.1 - time * 4), FW), o2y = mod(-(camY * 1.1 + time * 1.5), FH);
        ctx.fillStyle = 'rgba(200,208,222,' + (0.16 * a).toFixed(3) + ')';
        ctx.fillRect(0, 0, w, h);
        tile(ctx, fog, o1x, o1y, FW, FH, w, h, 0.9 * a);
        tile(ctx, fog, o2x, o2y, FW, FH, w, h, 0.7 * a);
      }
      if (wx === 'wind' || (env.wind || 0) > 0.45) {
        for (j = 0; j < leaves.length; j++) {
          p = leaves[j];
          var lx = Math.round(mod(p.x - camX * 0.3, w + 20) - 10), ly = Math.round(mod(p.y - camY * 0.3, h + 20) - 10);
          var flip = Math.sin(p.p * 1.3);
          ctx.globalAlpha = a;
          ctx.fillStyle = p.c;
          if (flip > 0.3) ctx.fillRect(lx, ly, 2, 1);
          else if (flip < -0.3) ctx.fillRect(lx, ly, 1, 2);
          else ctx.fillRect(lx, ly, 1, 1);
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(lx + 1, ly + 3, 1, 1);
        }
        ctx.globalAlpha = 1;
      }
    }
    function tile(ctx, img, ox, oy, TW, TH, w, h, al) {
      ctx.globalAlpha = al;
      for (var x = ox - TW; x < w; x += TW) for (var y = oy - TH; y < h; y += TH) ctx.drawImage(img, Math.round(x), Math.round(y));
      ctx.globalAlpha = 1;
    }
    return { update: update, draw: draw };
  }

  // ---------- particles ----------
  var KINDS = {
    sparkle: { life: [0.5, 1.1], v: 18, g: -6, size: 1, glow: 6, cols: ['#fff6c0', '#ffffff', '#ffe27a'] },
    ember: { life: [0.8, 1.8], v: 14, g: -22, size: 1, glow: 7, cols: ['#ffb040', '#ff7a20', '#ffd060'] },
    smoke: { life: [1.6, 3.0], v: 6, g: -10, size: 3, glow: 0, cols: ['#8a8494', '#a39cab', '#6e6878'] },
    magic: { life: [0.8, 1.6], v: 22, g: -4, size: 1, glow: 8, cols: ['#ff7ad9', '#7ad8ff', '#b88aff', '#7affb2', '#fff07a'] },
    dust: { life: [0.4, 0.9], v: 12, g: 4, size: 1, glow: 0, cols: ['#c8b08a', '#b09a78', '#ddc9a5'] }
  };
  function createParticles() {
    var ps = [], MAX = 900;
    function emit(kind, x, y, n) {
      var K = KINDS[kind] || KINDS.sparkle;
      n = n || 1;
      for (var i = 0; i < n && ps.length < MAX; i++) {
        var ang = Math.random() * Math.PI * 2, sp = K.v * (0.3 + Math.random());
        ps.push({
          k: kind, K: K, x: x + rnd(-2, 2), y: y + rnd(-2, 2),
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp * (kind === 'dust' ? 0.4 : 1) - (kind === 'smoke' ? 6 : 0),
          life: rnd(K.life[0], K.life[1]), age: 0, c: K.cols[(Math.random() * K.cols.length) | 0],
          ph: Math.random() * 6.28, ang: ang
        });
      }
    }
    function update(dt, env) {
      dt = Math.min(dt || 0, 0.1);
      var wind = env && env.wind ? env.wind : 0, j = 0;
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i];
        p.age += dt;
        if (p.age >= p.life) continue;
        if (p.k === 'magic') {
          p.ang += dt * 5; // swirl
          p.vx += Math.cos(p.ang) * 40 * dt; p.vy += Math.sin(p.ang) * 40 * dt;
        } else if (p.k === 'ember') {
          p.vx += Math.sin(p.age * 6 + p.ph) * 20 * dt;
        } else if (p.k === 'smoke') {
          p.vx += (wind * 14 + Math.sin(p.age * 2 + p.ph) * 4) * dt;
        }
        p.vy += p.K.g * dt;
        var drag = p.k === 'dust' ? 0.9 : 0.97;
        p.vx *= Math.pow(drag, dt * 60); p.vy *= Math.pow(drag, dt * 60);
        p.x += (p.vx + (p.k !== 'dust' ? wind * 6 : 0)) * dt; p.y += p.vy * dt;
        ps[j++] = p;
      }
      ps.length = j;
    }
    function draw(ctx, camX, camY) {
      var i, p, k, sx, sy, g, r;
      // smoke first: soft normal blend (looks wrong additive)
      ctx.globalCompositeOperation = 'source-over';
      for (i = 0; i < ps.length; i++) {
        p = ps[i]; if (p.k !== 'smoke') continue;
        k = p.age / p.life;
        var s = Math.round(p.K.size + k * 4);
        sx = Math.round(p.x - camX - s / 2); sy = Math.round(p.y - camY - s / 2);
        ctx.globalAlpha = 0.35 * (1 - k) * Math.min(1, k * 6);
        ctx.fillStyle = p.c;
        ctx.fillRect(sx, sy + 1, s, s - 1); ctx.fillRect(sx + 1, sy, s - 2, s + 1);
      }
      ctx.globalCompositeOperation = 'lighter';
      for (i = 0; i < ps.length; i++) {
        p = ps[i]; if (p.k === 'smoke') continue;
        k = p.age / p.life;
        var a = (1 - k) * Math.min(1, k * 8 + 0.2);
        if (p.k === 'sparkle') a *= 0.6 + 0.4 * Math.sin(p.age * 25 + p.ph);
        sx = p.x - camX; sy = p.y - camY;
        if (p.K.glow) {
          r = p.K.glow * (1 - k * 0.5);
          g = glow(p.c);
          ctx.globalAlpha = a * 0.45;
          ctx.drawImage(g, sx - r, sy - r, r * 2, r * 2);
        }
        ctx.globalAlpha = a;
        ctx.fillStyle = p.c;
        var ix = Math.round(sx), iy = Math.round(sy);
        ctx.fillRect(ix, iy, 1, 1);
        if (p.k === 'sparkle' && k < 0.6) {
          ctx.globalAlpha = a * 0.6;
          ctx.fillRect(ix - 1, iy, 1, 1); ctx.fillRect(ix + 1, iy, 1, 1);
          ctx.fillRect(ix, iy - 1, 1, 1); ctx.fillRect(ix, iy + 1, 1, 1);
        } else if (p.k === 'dust') {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = a * 0.6;
          ctx.fillRect(ix + 1, iy, 1, 1);
          ctx.globalCompositeOperation = 'lighter';
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    return { emit: emit, update: update, draw: draw, count: function () { return ps.length; } };
  }

  H.fx = { shadow: shadow, createLighting: createLighting, createWeather: createWeather, createParticles: createParticles, ambient: ambient, sun: sun };
})();
