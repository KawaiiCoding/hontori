window.H = window.H || {};
// Hontori audio: fully synthesized music, ambience and sfx (Web Audio API, no files).
(function () {
  'use strict';

  var MASTER_VOL = 0.25;
  var LOOKAHEAD = 0.3;      // seconds scheduled ahead of ctx.currentTime
  var TICK_MS = 50;
  var XFADE = 1.5;

  var ctx = null, master = null, comp = null, musicBus = null, sfxBus = null, ambBus = null, revSend = null;
  var noiseBuf = null;
  var rainOff = false;
  var inited = false, muted = false, timer = null;
  var wantKey = null, curMap = null, lastEnv = null;
  var player = null;
  var amb = null;
  var stepFlip = 0, lastBlip = 0, lastAmbSet = -1;

  // ------------------------------------------------------------------ note data
  var SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function n2m(s) {
    var m = /^([A-G])([#b]?)(-?\d)$/.exec(s);
    if (!m) return null;
    return SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3], 10) + 1) * 12;
  }
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  // "A4:2 C5:1 | -:1" -> [{m,d}]
  function parseMel(str) {
    var out = [], toks = str.split(/\s+/);
    for (var i = 0; i < toks.length; i++) {
      var tk = toks[i];
      if (!tk || tk === '|') continue;
      var p = tk.split(':');
      out.push({ m: p[0] === '-' ? null : n2m(p[0]), d: parseFloat(p[1]) });
    }
    return out;
  }
  // "Gm" / "A7" / "Bb" -> tones around octave 3
  function parseChord(s) {
    var m = /^([A-G])([#b]?)(m?)(7?)$/.exec(s);
    var r = 48 + SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    if (r > 57) r -= 12;
    var t = [r, r + (m[3] ? 3 : 4), r + 7];
    if (m[4]) t.push(r + 10);
    return t;
  }

  var SONGS = {
    // cozy 3/4 lullaby in F
    home: {
      bpm: 70, bpb: 3, style: 'lullaby', transpose: 0, form: ['A', 'A2', 'B', 'A2'],
      sections: {
        A: { ch: 'F Dm Bb C F Dm Gm,C F',
          mel: 'A4:2 C5:1 | F5:2 D5:1 | D5:1 C5:1 Bb4:1 | C5:3 | A4:2 C5:1 | F5:2 A5:1 | G5:1 F5:1 E5:1 | F5:3' },
        A2: { ch: 'F Dm Bb C F Dm Gm,C F',
          mel: 'A4:1 C5:1 F5:1 | A5:2 F5:1 | D5:1 F5:1 Bb5:1 | G5:2 E5:1 | C5:1 F5:1 A5:1 | D6:2 A5:1 | Bb5:1 G5:1 E5:1 | F5:3' },
        B: { ch: 'Bb F Gm C Bb Am Gm,C F',
          mel: 'D5:1 F5:1 Bb5:1 | A5:2 F5:1 | G5:1 Bb5:1 G5:1 | E5:2 C5:1 | D5:1 F5:1 D5:1 | C5:2 A4:1 | Bb4:1 A4:1 G4:1 | F4:3' }
      }
    },
    // bright pastoral tune in G
    village: {
      bpm: 105, bpb: 4, style: 'pastoral', transpose: 0, form: ['A', 'A2', 'B', 'A2'],
      sections: {
        A: { ch: 'G D Em C G D C,D G',
          mel: 'B4:.5 D5:.5 G5:1 D5:.5 B4:.5 D5:1 | A4:.5 D5:.5 F#5:1 E5:.5 D5:.5 A4:1 | G4:.5 B4:.5 E5:1 D5:.5 E5:.5 G5:1 | E5:1 C5:.5 D5:.5 E5:2 | ' +
               'B4:.5 D5:.5 G5:1 A5:.5 G5:.5 D5:1 | F#5:1 A5:1 F#5:.5 E5:.5 D5:1 | E5:.5 G5:.5 E5:.5 C5:.5 D5:.5 F#5:.5 A5:1 | G5:3 -:1' },
        A2: { ch: 'G D Em C G D C,D G',
          mel: 'D5:1 G5:.5 B5:.5 A5:.5 G5:.5 D5:1 | F#5:.5 E5:.5 D5:1 A4:1 D5:1 | E5:.5 G5:.5 B5:1 A5:.5 G5:.5 E5:1 | G5:.5 E5:.5 C5:1 E5:2 | ' +
               'D5:1 G5:.5 B5:.5 A5:.5 G5:.5 D5:1 | F#5:1 A5:1 F#5:.5 E5:.5 D5:1 | E5:.5 G5:.5 E5:.5 C5:.5 F#5:.5 E5:.5 D5:.5 A4:.5 | G4:1 B4:1 G5:1.5 -:.5' },
        B: { ch: 'C G Am Em C G A7 D',
          mel: 'E5:1.5 G5:.5 C6:2 | B5:1.5 G5:.5 D5:2 | C5:1 E5:1 A5:1.5 G5:.5 | G5:2 E5:1 B4:1 | ' +
               'E5:1.5 G5:.5 C6:1 B5:1 | B5:1 D6:1 B5:1 G5:1 | A5:.5 G5:.5 E5:.5 C#5:.5 E5:1 A5:1 | F#5:1 E5:.5 F#5:.5 A5:1 D5:1' }
      }
    }
  };
  // duels: a steady, focused tune in D minor. Driving bass pulse, clear plucked melody, nothing harsh.
  SONGS.duel = {
    bpm: 116, bpb: 4, style: 'duel', transpose: 0, form: ['A', 'B', 'A', 'B'],
    sections: {
      A: { ch: 'Dm Bb C Am Dm Bb Gm A7',
        mel: 'D5:.5 F5:.5 A5:1 G5:.5 F5:.5 E5:1 | D5:.5 F5:.5 Bb5:1 A5:.5 G5:.5 F5:1 | E5:.5 G5:.5 C6:1 Bb5:.5 A5:.5 G5:1 | A5:1.5 E5:.5 C5:1 E5:1 | ' +
             'F5:.5 A5:.5 D6:1 C6:.5 A5:.5 F5:1 | G5:.5 F5:.5 D5:1 F5:.5 G5:.5 Bb5:1 | A5:1 G5:.5 F5:.5 E5:1 G5:1 | A5:2 C#5:1 E5:1' },
      B: { ch: 'F C Gm Dm Bb F Gm A7',
        mel: 'C6:1.5 A5:.5 F5:1 A5:1 | G5:1.5 E5:.5 C5:1 E5:1 | D5:.5 G5:.5 Bb5:1 A5:.5 G5:.5 D5:1 | F5:2 A5:1 F5:1 | ' +
             'D6:1 C6:.5 Bb5:.5 A5:1 F5:1 | A5:1 G5:.5 F5:.5 C5:2 | Bb4:.5 D5:.5 G5:1 F5:.5 E5:.5 D5:1 | E5:1 C#5:1 A4:2' }
    }
  };
  // wild encounters: the same family as the duel tune, a little brighter and quicker
  SONGS.wild = { bpm: 124, bpb: 4, style: 'duel', transpose: 2, form: ['B', 'A'], sections: SONGS.duel.sections };
  // calm night variant of the village tune: slower, lower key, fewer voices
  SONGS.village_night = {
    bpm: 76, bpb: 4, style: 'nocturne', transpose: -2, form: ['A', 'B', 'A2'],
    sections: SONGS.village.sections
  };

  function buildTune(spec) {
    var ev = [], bpb = spec.bpb, tr = spec.transpose || 0, bar0 = 0, style = spec.style;
    function add(t, m, d, v, g) { ev.push({ t: t, m: m + tr, d: d, v: v, g: g }); }
    for (var s = 0; s < spec.form.length; s++) {
      var name = spec.form[s], sec = spec.sections[name];
      var chords = sec.ch.split(' '), nb = chords.length;
      var isB = name === 'B', repeat = s > 0 && name !== 'B';
      // melody
      var mel = parseMel(sec.mel), t = bar0 * bpb, k;
      for (k = 0; k < mel.length; k++) {
        var n = mel[k];
        if (n.m != null) {
          var acc = (t % bpb === 0) ? 1 : 0.85;
          if (style === 'lullaby') {
            add(t, n.m, n.d, 'box', 0.34 * acc);
            if (repeat && n.d >= 2) add(t + 1, n.m + 12, 1, 'box', 0.09);
          } else if (style === 'duel') {
            add(t, n.m, n.d, 'pluck', 0.3 * acc);
            if (isB && n.d >= 1) add(t, n.m - 12, n.d, 'soft', 0.08);
          } else if (style === 'pastoral') {
            add(t, n.m, n.d, 'pluck', 0.36 * acc);
            if (isB) add(t, n.m - 12, n.d, 'soft', 0.1);
          } else {
            add(t, n.m, n.d, 'soft', 0.26 * acc);
          }
        }
        t += n.d;
      }
      if (Math.abs(t - (bar0 + nb) * bpb) > 0.001 && typeof console !== 'undefined') {
        console.warn('H.audio: melody length mismatch in section ' + name);
      }
      // accompaniment
      for (var b = 0; b < nb; b++) {
        var bt = (bar0 + b) * bpb, parts = chords[b].split(',');
        var split = parts.length > 1 ? (bpb === 3 ? 2 : 2) : bpb;
        for (var p = 0; p < parts.length; p++) {
          var c = parseChord(parts[p]);
          var ct = bt + (p === 0 ? 0 : split), cd = parts.length > 1 ? (p === 0 ? split : bpb - split) : bpb;
          var last = b === nb - 1 && s === spec.form.length - 1;
          if (style === 'lullaby') {
            for (k = 0; k < 3; k++) add(ct, c[k] + 12, cd, 'pad', 0.075);
            add(ct, c[0] - 12, cd, 'bass', 0.2);
            if (parts.length === 1) {
              add(bt + 1, c[1] + 24, 1, 'box', 0.07);
              add(bt + 2, c[2] + 24, 1, 'box', 0.06);
              if (repeat && b % 2 === 1) add(bt + 2.5, c[0] + 36, 0.5, 'box', 0.045);
            }
          } else if (style === 'duel') {
            // a steady eighth-note pulse (root and fifth), a quiet pad, a soft lift on beats 2 and 4
            for (k = 0; k < cd * 2; k++) add(ct + k * 0.5, (k % 4 === 3 ? c[2] : c[0]) - 12, 0.45, 'bass', k % 2 ? 0.13 : 0.19);
            for (k = 0; k < 3; k++) add(ct, c[k] + 12, cd, 'pad', 0.045);
            for (k = 1; k < cd; k += 2) add(ct + k, c[1] + 24, 0.4, 'box', 0.045);
          } else if (style === 'pastoral') {
            add(ct, c[0] - 12, 1, 'bass', 0.3);
            if (cd >= 4) {
              add(ct + 2, c[2] - 12, 1, 'bass', 0.24);
              if (b % 2 === 1 && !last) add(ct + 3.5, c[0] - 12, 0.5, 'bass', 0.2);
            }
            var pat = isB ? [0, 2, 1, 2] : [0, 2, 1, 2, 0, 2, 1, 2];
            var stp = isB ? 1 : 0.5, cnt = Math.round(cd / stp);
            for (k = 0; k < cnt; k++) {
              if (last && k > cnt / 2) break;
              var tone = c[pat[k % pat.length] % c.length] + 12 + (repeat && k % 4 === 3 ? 12 : 0);
              add(ct + k * stp, tone, stp, 'arp', isB ? 0.1 : 0.085);
            }
            if (isB) for (k = 0; k < 3; k++) add(ct, c[k] + 12, cd, 'pad', 0.05);
          } else {
            for (k = 0; k < 3; k++) add(ct, c[k] + 12, cd, 'pad', 0.07);
            add(ct, c[0] - 12, cd, 'bass', 0.17);
            if (parts.length === 1 && b % 2 === 0) add(bt + 2, c[2] + 24, 2, 'box', 0.05);
          }
        }
      }
      bar0 += nb;
    }
    ev.sort(function (a, b2) { return a.t - b2.t; });
    return { bpm: spec.bpm, len: bar0 * bpb, events: ev };
  }

  var tuneCache = {};
  function getTune(key) {
    if (!tuneCache[key]) tuneCache[key] = buildTune(SONGS[key]);
    return tuneCache[key];
  }

  // ------------------------------------------------------------------ synth voices
  var VOICES = {
    box:   { a: 0.004, tau: 0.42, parts: [['sine', 1, 1, 0], ['sine', 2, 0.2, 0], ['sine', 5.4, 0.05, 0]] },
    arp:   { a: 0.004, tau: 0.15, parts: [['sine', 1, 1, 0], ['triangle', 2, 0.1, 0]] },
    pluck: { a: 0.005, tau: 0.2, lpf: 3400, parts: [['triangle', 1, 1, 0], ['square', 1, 0.1, 0], ['sine', 2, 0.18, 0]] },
    bass:  { a: 0.012, tau: 0.32, lpf: 650, parts: [['triangle', 1, 1, 0], ['sine', 1, 0.6, 0]] },
    soft:  { a: 0.05, sus: 0.65, dtau: 0.3, rel: 0.22, lpf: 1900, parts: [['triangle', 1, 0.8, 0], ['sine', 1, 0.5, 6]] },
    pad:   { a: 0.5, sus: 1, dtau: 0.3, rel: 0.45, lpf: 1100, parts: [['sine', 1, 1, -6], ['sine', 1, 1, 6], ['triangle', 1, 0.25, 0]] },
    piano: { a: 0.006, tau: 0.6, lpf: 3000, parts: [['triangle', 1, 0.8, 0], ['sine', 1, 0.4, 4], ['sine', 2, 0.28, 0], ['sine', 3, 0.08, 0]] }
  };

  function playVoice(dest, t, midi, dur, vname, vel) {
    var v = VOICES[vname], f = mtof(midi);
    var g = ctx.createGain(), end;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + v.a);
    if (v.sus) {
      var hold = Math.max(dur, v.a + 0.02);
      g.gain.setTargetAtTime(vel * v.sus, t + v.a, v.dtau);
      g.gain.setTargetAtTime(0, t + hold, v.rel);
      end = t + hold + v.rel * 6;
    } else {
      g.gain.setTargetAtTime(0, t + v.a, v.tau);
      end = t + v.a + v.tau * 7;
    }
    var out = g;
    if (v.lpf) {
      var lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = v.lpf + f; lp.Q.value = 0.4;
      g.connect(lp); out = lp;
    }
    out.connect(dest);
    for (var i = 0; i < v.parts.length; i++) {
      var p = v.parts[i], o = ctx.createOscillator(), og = ctx.createGain();
      o.type = p[0]; o.frequency.value = f * p[1]; o.detune.value = p[3];
      og.gain.value = p[2];
      o.connect(og); og.connect(g);
      o.start(t); o.stop(end);
    }
  }

  // tone with pitch sweep, percussive envelope
  function beep(t, f0, f1, dur, type, vol, dest) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + Math.min(0.008, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sfxBus);
    o.start(t); o.stop(t + dur + 0.02);
    return o;
  }

  // filtered noise burst with optional filter sweep
  function puff(t, dur, ftype, f0, f1, q, vol, dest, attack) {
    var s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true;
    fl.type = ftype; fl.Q.value = q || 0.7;
    fl.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + (attack || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dest || sfxBus);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.02);
  }

  // ------------------------------------------------------------------ graph setup
  function setup() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { ctx = new AC(); } catch (e) { ctx = null; return false; }

    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 18; comp.ratio.value = 4;
    comp.attack.value = 0.008; comp.release.value = 0.25;
    master = ctx.createGain();
    master.gain.value = muted ? 0 : MASTER_VOL;
    master.connect(comp); comp.connect(ctx.destination);

    musicBus = ctx.createGain(); musicBus.gain.value = 0.9; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 1.0; sfxBus.connect(master);
    ambBus = ctx.createGain(); ambBus.gain.value = 1.0; ambBus.connect(master);

    // reverb-ish feedback delay
    revSend = ctx.createGain(); revSend.gain.value = 1;
    var dl = ctx.createDelay(1.0), fb = ctx.createGain(), lp = ctx.createBiquadFilter(), wet = ctx.createGain();
    var dl2 = ctx.createDelay(1.0);
    dl.delayTime.value = 0.31; dl2.delayTime.value = 0.197;
    fb.gain.value = 0.36; wet.gain.value = 0.3;
    lp.type = 'lowpass'; lp.frequency.value = 2400;
    revSend.connect(dl); revSend.connect(dl2);
    dl.connect(lp); dl2.connect(lp); lp.connect(fb); fb.connect(dl);
    lp.connect(wet); wet.connect(master);
    var ms = ctx.createGain(); ms.gain.value = 0.35; musicBus.connect(ms); ms.connect(revSend);
    var ss = ctx.createGain(); ss.gain.value = 0.25; sfxBus.connect(ss); ss.connect(revSend);

    // white noise buffer
    var len = ctx.sampleRate * 2;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    setupAmbience();
    if (timer) clearInterval(timer);
    timer = setInterval(tick, TICK_MS);
    return true;
  }

  function noiseSrc() {
    var s = ctx.createBufferSource();
    s.buffer = noiseBuf; s.loop = true; s.start(0, Math.random() * 1.5);
    return s;
  }

  function setupAmbience() {
    amb = { nextCrackle: 0, nextChirp: 0, fireOn: false, cricketsOn: false };
    // rain
    var rs = noiseSrc(), rhp = ctx.createBiquadFilter(), rlp = ctx.createBiquadFilter();
    rhp.type = 'highpass'; rhp.frequency.value = 900;
    rlp.type = 'lowpass'; rlp.frequency.value = 7000;
    amb.rainLp = rlp;
    amb.rain = ctx.createGain(); amb.rain.gain.value = 0;
    rs.connect(rhp); rhp.connect(rlp); rlp.connect(amb.rain); amb.rain.connect(ambBus);
    // wind: band-passed noise, slowly swept
    var ws = noiseSrc(), wlp = ctx.createBiquadFilter(), wbp = ctx.createBiquadFilter(), wmod = ctx.createGain();
    wlp.type = 'lowpass'; wlp.frequency.value = 1400;
    wbp.type = 'bandpass'; wbp.frequency.value = 420; wbp.Q.value = 1.3;
    wmod.gain.value = 0.7;
    amb.wind = ctx.createGain(); amb.wind.gain.value = 0;
    ws.connect(wlp); wlp.connect(wbp); wbp.connect(wmod); wmod.connect(amb.wind); amb.wind.connect(ambBus);
    var l1 = ctx.createOscillator(), l1g = ctx.createGain(), l2 = ctx.createOscillator(), l2g = ctx.createGain();
    var l3 = ctx.createOscillator(), l3g = ctx.createGain();
    l1.frequency.value = 0.13; l1g.gain.value = 170; l1.connect(l1g); l1g.connect(wbp.frequency);
    l2.frequency.value = 0.071; l2g.gain.value = 0.3; l2.connect(l2g); l2g.connect(wmod.gain);
    l3.frequency.value = 0.31; l3g.gain.value = 70; l3.connect(l3g); l3g.connect(wbp.frequency);
    l1.start(); l2.start(); l3.start();
    // fire: low rumble + scheduled crackles
    var fs = noiseSrc(), flp = ctx.createBiquadFilter(), fr = ctx.createGain();
    flp.type = 'lowpass'; flp.frequency.value = 260; fr.gain.value = 0.22;
    amb.fire = ctx.createGain(); amb.fire.gain.value = 0;
    fs.connect(flp); flp.connect(fr); fr.connect(amb.fire); amb.fire.connect(ambBus);
    // crickets
    amb.crickets = ctx.createGain(); amb.crickets.gain.value = 0;
    amb.crickets.connect(ambBus);
  }

  function isNight(env) { return !!env && (env.time >= 19 || env.time < 6); }

  function applyAmbience(env) {
    if (!ctx || !amb || !env) return;
    var now = ctx.currentTime;
    if (now - lastAmbSet < 0.2 && lastAmbSet >= 0) return;
    lastAmbSet = now;
    var indoor = !!env.indoor, rain = env.weather === 'rain', night = isNight(env);
    var wind = Math.max(0, Math.min(1, +env.wind || 0));
    amb.rain.gain.setTargetAtTime(rain && !rainOff ? (indoor ? 0.07 : 0.2) : 0, now, 0.7);
    amb.rainLp.frequency.setTargetAtTime(indoor ? 1100 : 7000, now, 0.5);
    amb.wind.gain.setTargetAtTime(indoor ? wind * 0.03 : wind * 0.3, now, 0.8);
    amb.fireOn = indoor;
    amb.fire.gain.setTargetAtTime(indoor ? 0.55 : 0, now, 0.6);
    amb.cricketsOn = !indoor && night && !rain && env.weather !== 'snow';
    amb.crickets.gain.setTargetAtTime(amb.cricketsOn ? 0.5 : 0, now, 0.9);
  }

  function ambienceTick(now) {
    if (!amb) return;
    if (amb.fireOn) {
      if (amb.nextCrackle < now) amb.nextCrackle = now + 0.02;
      while (amb.nextCrackle < now + LOOKAHEAD) {
        var r = Math.random(), big = r > 0.88;
        puff(amb.nextCrackle, big ? 0.07 : 0.012 + r * 0.03, 'bandpass', 1200 + Math.random() * 4200, 0, 1.2,
          big ? 0.2 : 0.05 + r * 0.09, amb.fire, 0.001);
        amb.nextCrackle += 0.03 + Math.pow(Math.random(), 2.2) * 0.55;
      }
    }
    if (amb.cricketsOn) {
      if (amb.nextChirp < now) amb.nextChirp = now + 0.1;
      while (amb.nextChirp < now + LOOKAHEAD) {
        var far = Math.random() < 0.4, f = far ? 3650 : 4350 + Math.random() * 80;
        var n = 3 + (Math.random() * 2 | 0);
        for (var i = 0; i < n; i++) beep(amb.nextChirp + i * 0.062, f, f * 1.01, 0.04, 'sine', far ? 0.015 : 0.032, amb.crickets);
        amb.nextChirp += 0.45 + Math.random() * 1.1;
      }
    }
  }

  // ------------------------------------------------------------------ music scheduler
  var forceKey = null;   // a battle can ask for its own tune
  function musicKey(mapName, env) {
    if (forceKey) return forceKey;
    if (mapName === 'home') return 'home';
    if (mapName == null) return env && env.indoor ? 'home' : null;
    return isNight(env) ? 'village_night' : 'village';
  }

  function startTune(key) {
    if (!ctx || !key || !SONGS[key]) return;
    if (player && player.key === key) return;
    var now = ctx.currentTime;
    if (player) {
      var old = player.gain;
      old.gain.cancelScheduledValues(now);
      old.gain.setValueAtTime(old.gain.value, now);
      old.gain.linearRampToValueAtTime(0, now + XFADE);
      setTimeout(function () { try { old.disconnect(); } catch (e) {} }, (XFADE + 4) * 1000);
    }
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(1, now + XFADE);
    g.connect(musicBus);
    player = { key: key, tune: getTune(key), gain: g, t0: now + 0.12, idx: 0, loop: 0 };
  }

  function tick() {
    if (!ctx || ctx.state !== 'running') return;
    var now = ctx.currentTime;
    if (wantKey && (!player || player.key !== wantKey)) startTune(wantKey);
    if (player) {
      var tu = player.tune, spb = 60 / tu.bpm, evs = tu.events, guard = 0;
      while (guard++ < 20000) {
        var e = evs[player.idx];
        var tt = player.t0 + (player.loop * tu.len + e.t) * spb;
        if (tt > now + LOOKAHEAD) break;
        if (tt >= now - 0.03) playVoice(player.gain, Math.max(tt, now), e.m, e.d * spb, e.v, e.g);
        if (++player.idx >= evs.length) { player.idx = 0; player.loop++; }
      }
    }
    ambienceTick(now);
  }

  // ------------------------------------------------------------------ sfx
  var SFX = {
    step: function (t) {
      stepFlip ^= 1;
      puff(t, 0.05, 'lowpass', stepFlip ? 520 : 400, 0, 0.6, 0.07);
      beep(t, stepFlip ? 112 : 92, 60, 0.05, 'sine', 0.05);
    },
    blip: function (t) {
      if (t - lastBlip < 0.028) return;
      lastBlip = t;
      beep(t, 760 + Math.random() * 90, 0, 0.028, 'triangle', 0.06);
    },
    confirm: function (t) {
      beep(t, 988, 0, 0.09, 'triangle', 0.16);
      beep(t + 0.075, 1319, 0, 0.16, 'triangle', 0.16);
    },
    door: function (t) {
      beep(t, 310, 420, 0.16, 'sawtooth', 0.025);
      puff(t, 0.18, 'bandpass', 600, 900, 3, 0.05, null, 0.03);
      beep(t + 0.2, 150, 62, 0.14, 'sine', 0.3);
      puff(t + 0.2, 0.07, 'lowpass', 900, 200, 0.7, 0.2);
    },
    sparkle: function (t) {
      var ns = [84, 88, 91, 96, 100];
      for (var i = 0; i < 5; i++) playVoice(sfxBus, t + i * 0.055, ns[(i * 3 + (Math.random() * 2 | 0)) % 5], 0.1, 'arp', 0.11);
    },
    spell: function (t) {
      var o = beep(t, 260, 2300, 1.0, 'triangle', 0.1);
      var l = ctx.createOscillator(), lg = ctx.createGain();
      l.frequency.value = 11; lg.gain.value = 30; l.connect(lg); lg.connect(o.detune);
      l.start(t); l.stop(t + 1.05);
      beep(t, 392, 3450, 1.0, 'sine', 0.06);
      puff(t, 1.0, 'bandpass', 900, 7000, 4, 0.05, null, 0.5);
      var sc = [67, 71, 74, 79, 83, 86, 91, 95, 98];
      for (var i = 0; i < sc.length; i++) playVoice(sfxBus, t + 0.1 + i * 0.1, sc[i], 0.1, 'box', 0.08 + i * 0.006);
      playVoice(sfxBus, t + 1.02, 103, 0.3, 'box', 0.16);
    },
    wand: function (t) {
      var ar = [67, 71, 74, 79];
      for (var i = 0; i < 4; i++) playVoice(sfxBus, t + i * 0.09, ar[i], 0.1, 'pluck', 0.22);
      var ch = [71, 74, 79, 83];
      for (var j = 0; j < 4; j++) playVoice(sfxBus, t + 0.4, ch[j], 0.6, 'box', 0.15);
      playVoice(sfxBus, t + 0.4, 55, 0.6, 'bass', 0.2);
    },
    cough: function (t) {
      puff(t, 0.11, 'bandpass', 950, 500, 1.4, 0.3, null, 0.006);
      beep(t, 190, 120, 0.09, 'sawtooth', 0.04);
      puff(t + 0.17, 0.14, 'bandpass', 800, 380, 1.4, 0.24, null, 0.006);
      beep(t + 0.17, 170, 100, 0.1, 'sawtooth', 0.035);
    },
    bump: function (t) {
      beep(t, 130, 58, 0.11, 'sine', 0.3);
      beep(t, 95, 60, 0.07, 'square', 0.04);
    },
    meow: function (t) {
      var o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(560, t);
      o.frequency.linearRampToValueAtTime(900, t + 0.14);
      o.frequency.linearRampToValueAtTime(820, t + 0.3);
      o.frequency.linearRampToValueAtTime(500, t + 0.5);
      f.type = 'bandpass'; f.Q.value = 3.5;
      f.frequency.setValueAtTime(1100, t);
      f.frequency.linearRampToValueAtTime(2300, t + 0.17);
      f.frequency.linearRampToValueAtTime(1000, t + 0.5);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.22, t + 0.07);
      g.gain.setValueAtTime(0.2, t + 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.52);
      var l = ctx.createOscillator(), lg = ctx.createGain();
      l.frequency.value = 6; lg.gain.value = 18; l.connect(lg); lg.connect(o.detune);
      o.connect(f); f.connect(g); g.connect(sfxBus);
      o.start(t); o.stop(t + 0.56); l.start(t); l.stop(t + 0.56);
    },
    splash: function (t) {
      puff(t, 0.38, 'bandpass', 2400, 500, 0.9, 0.26, null, 0.01);
      puff(t, 0.12, 'lowpass', 500, 150, 0.7, 0.2);
      for (var i = 0; i < 3; i++) {
        var f = 700 + Math.random() * 600, tt = t + 0.12 + i * 0.07 + Math.random() * 0.03;
        beep(tt, f, f * 1.8, 0.06, 'sine', 0.07);
      }
    },
    bell: function (t) {
      var f = 880, ps = [[1, 0.2, 1.6], [2.0, 0.08, 1.1], [2.76, 0.07, 0.8], [5.4, 0.03, 0.4]];
      for (var i = 0; i < ps.length; i++) beep(t, f * ps[i][0], 0, ps[i][2], 'sine', ps[i][1]);
    },
    page: function (t) {
      puff(t, 0.16, 'highpass', 1800, 4500, 0.6, 0.07, null, 0.05);
      puff(t + 0.1, 0.06, 'bandpass', 2600, 0, 1.5, 0.05, null, 0.004);
    }
  };

  // ------------------------------------------------------------------ unlock
  // iOS: web audio follows the ring/silent switch unless the page is in "playback" mode.
  // Declaring the session type (Safari 17+) and looping a silent <audio> element both switch it.
  var silentEl = null;
  function iosPlayback() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    if (silentEl) return;
    try {
      var rate = 8000, n = rate / 2, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
      var w = function (o, str) { for (var i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
      w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
      v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
      silentEl = document.createElement('audio');
      silentEl.src = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
      silentEl.loop = true; silentEl.setAttribute('playsinline', ''); silentEl.setAttribute('x-webkit-airplay', 'deny');
      var pr = silentEl.play(); if (pr && pr.catch) pr.catch(function () { silentEl = null; });
    } catch (e) { silentEl = null; }
  }
  function unlock() {
    iosPlayback();
    if (!ctx && !setup()) { removeUnlock(); return; }
    if (ctx.state !== 'running' && ctx.resume) {
      var p = ctx.resume();
      if (p && p.then) p.then(afterUnlock, function () {});
    } else {
      afterUnlock();
    }
  }
  function afterUnlock() {
    if (!ctx || ctx.state !== 'running') return;
    removeUnlock();
    lastAmbSet = -1;
    if (lastEnv) applyAmbience(lastEnv);
    tick();
  }
  var EVTS = ['pointerdown', 'keydown', 'touchstart', 'touchend', 'mousedown', 'click'];
  function removeUnlock() {
    for (var i = 0; i < EVTS.length; i++) window.removeEventListener(EVTS[i], unlock, true);
  }

  // ------------------------------------------------------------------ public api
  var api = {
    unlock: function () { unlock(); },
    init: function () {
      if (inited) return;
      inited = true;
      if (typeof window.addEventListener !== 'function') return;
      for (var i = 0; i < EVTS.length; i++) window.addEventListener(EVTS[i], unlock, true);
      if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('visibilitychange', function () {
          if (!ctx) return;
          if (document.hidden) { if (ctx.suspend) ctx.suspend(); if (silentEl) silentEl.pause(); }
          else { if (ctx.resume) ctx.resume(); if (silentEl) { var pr = silentEl.play(); if (pr && pr.catch) pr.catch(function () {}); } }
        });
      }
    },
    // battle music: H.audio.battle('duel') during a duel, H.audio.battle(null) after
    battle: function (key) {
      forceKey = key && SONGS[key] ? key : null;
      wantKey = musicKey(curMap, lastEnv) || wantKey;
      if (ctx && ctx.state === 'running' && wantKey) startTune(wantKey);
    },
    setScene: function (mapName, env) {
      curMap = mapName;
      if (env) lastEnv = env;
      wantKey = musicKey(curMap, lastEnv) || wantKey;
      if (ctx && ctx.state === 'running') { startTune(wantKey); lastAmbSet = -1; applyAmbience(lastEnv); }
    },
    update: function (env) {
      if (!env) return;
      lastEnv = env;
      var k = musicKey(curMap, env);
      if (k) wantKey = k;
      if (ctx && ctx.state === 'running') applyAmbience(env);
    },
    sfx: function (name) {
      if (!ctx || ctx.state !== 'running' || muted) return;
      var fn = SFX[name];
      if (!fn) return;
      try { fn(ctx.currentTime + 0.005); } catch (e) {}
    },
    note: function (midi) {
      if (!ctx || ctx.state !== 'running' || muted) return;
      midi = +midi;
      if (!isFinite(midi)) return;
      try { playVoice(sfxBus, ctx.currentTime + 0.005, midi, 0.5, 'piano', 0.3); } catch (e) {}
    },
    /* the player can turn the rain sound off on its own (Menu) */
    setRainMuted: function (b) {
      rainOff = !!b;
      if (ctx && amb.rain) amb.rain.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
    },
    setMuted: function (b) {
      muted = !!b;
      if (ctx && master) {
        var now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setTargetAtTime(muted ? 0 : MASTER_VOL, now, 0.06);
      }
    },
    _songs: SONGS,
    _build: getTune
  };
  Object.defineProperty(api, 'muted', {
    enumerable: true,
    get: function () { return muted; },
    set: function (b) { api.setMuted(b); }
  });

  H.audio = api;
})();
