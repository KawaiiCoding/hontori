/*
 * art.js  (Hontori: capsules)
 * Job: the pictures of the capsule machines and their prizes, painted lazily in the game's pixel style
 * (pixels.js) and cached: a 16 x 16 icon for every prize look, the hats a hontori wears on its head, the keepsakes that stand in the kid's room, and the machine itself
 * (a coloured body, a glass dome full of capsules, a coin slot, a chute and a crank).
 *
 * Public API:
 *   iconCanvas(prize)            16 x 16 canvas of the prize (look + colours)
 *   iconUrl(prize, scale)        a data URL of it (default scale 2)
 *   hatSprite(look)              { canvas, ax, ay, sink } or null: ax, ay is the point of the sprite that
 *                                sits on the top of the head; sink: figure pixels it sits down into the head
 *   keepsake(look)               { canvas, ax, ay, light } or null: ax, ay the foot point; light: a glow colour
 *   machine(body, trim)          a canvas 16 x MACHINE_H, its bottom on the bottom of its tile
 *   MACHINE_H                    the machine's height in map pixels
 *   capsuleCanvas(color, open)   a capsule 16 x 16 (open: the two halves apart), for the reveal
 */

import { Grid, RAMPS, ramp } from './pixels.js';

export const MACHINE_H = 28;

const icons = new Map();
const urls = new Map();
const hats = new Map();
const keepsakes = new Map();
const machines = new Map();
const capsules = new Map();

const G = RAMPS;

/* ---------- prize icons (16 x 16) ---------- */

const ICONS = {
  straw_hat(g) {
    g.bmp([
      '.....SSSSS.....',
      '....SSSSSSS....',
      '....SSSSSSS....',
      '....RRRRRRR....',
      'SSSSSSSSSSSSSSS',
      '.SSSSSSSSSSSSS.',
      '...SSSSSSSSS...'
    ], 0, 5, { S: [G.straw], R: [G.red, 2] });
    g.dot(6, 6, '#fff6d0');
    g.dot(7, 6, '#fff6d0');
  },
  beret(g, p) {
    const B = ramp(p.color || '#c8402e');
    g.bmp([
      '.......NN......',
      '....BBBBBBB....',
      '..BBBBBBBBBBB..',
      '.BBBBBBBBBBBBB.',
      'BBBBBBBBBBBBBBB',
      '.DDDDDDDDDDDDD.'
    ], 0, 5, { B: [B], N: [B, 1], D: [B, 1] });
    g.dot(5, 7, B[4]);
    g.dot(6, 7, B[4]);
    g.dot(4, 8, B[3]);
  },
  crown(g) {
    g.bmp([
      'G.....G.....G',
      'GG...GGG...GG',
      'GGG.GGGGG.GGG',
      'GGGGGGRGGGGGG',
      'GGGGGRRRGGGGG',
      'GGGGGGRGGGGGG',
      'GGGGGGGGGGGGG'
    ], 1, 5, { G: [G.gold], R: [G.red, 3] });
    g.dot(7, 8, '#ffd0c0');
    g.dot(1, 5, '#fff8c8');
    g.dot(13, 5, '#fff8c8');
  },
  acorn(g) {
    g.bmp([
      '.......s.......',
      '.......s.......',
      '....AAAAAAA....',
      '..AAaAAaAAaAA..',
      '.AaAAaAAaAAaAA.',
      'AAAAAAAAAAAAAAA',
      '.CCCCCCCCCCCCC.'
    ], 0, 4, { A: [G.acorn], a: [G.acorn, 1], s: [G.wood, 2], C: [G.acorn, 1] });
    g.dot(5, 7, '#e8c08a');
  },
  flower_crown(g) {
    g.bmp([
      '..PP...WW...PP.',
      '.PYP..WYW..PYP.',
      '..PP...WW...PP.',
      'LLLLLLLLLLLLLLL',
      '.L..L..L..L..L.'
    ], 0, 6, { P: [G.pink], W: [G.white], Y: [G.gold, 3], L: [G.leaf] });
  },
  chef_hat(g) {
    g.bmp([
      '...WWW.WWW....',
      '..WWWWWWWWW...',
      '.WWWWWWWWWWW..',
      '.WWWWWWWWWWW..',
      '..WWWWWWWWW...',
      '...WWWWWWW....',
      '...WWWWWWW....',
      '...CCCCCCC....',
      '...CCCCCCC....'
    ], 1, 3, { W: [G.white], C: [G.cream] });
    g.dot(5, 5, '#ffffff');
    g.dot(4, 6, '#ffffff');
  },
  toadstool(g) {
    g.bmp([
      '.....RRRRR.....',
      '...RRWWRRRRR...',
      '..RRRWWRRRWWR..',
      '.RRRRRRRRRWWRR.',
      'RRWWRRRRRRRRRRR',
      'RRWWRRRRWWRRRRR',
      '.SSSSSSSSSSSSS.'
    ], 0, 5, { R: [G.red], W: [G.white, 4], S: [G.cream, 2] });
  },
  blanket(g, p) {
    const B = ramp(p.color || '#b04a3a');
    g.bmp([
      'BBBBBBBBBBBBBB',
      'BTTTTTTTTTTTTB',
      'BBBBBBBBBBBBBB',
      'BBBBBBBBBBBBBB',
      'BBBBBBBBBBBBBB',
      'BTTTTTTTTTTTTB',
      'BBBBBBBBBBBBBB',
      'f.f.f.f.f.f.f.'
    ], 1, 4, { B: [B], T: [G.gold, 3], f: [G.gold, 2] });
    g.dot(2, 6, B[4]);
    g.dot(3, 6, B[4]);
  },
  ink(g, p) {
    const I = ramp(p.color || '#ff9a4a');
    g.bmp([
      '......WW......',
      '.....CCCC.....',
      '.....CCCC.....',
      '....GGGGGG....',
      '...GIIIIIIG...',
      '..GIIIIIIIIG..',
      '..GIIIIIIIIG..',
      '..GIIIIIIIIG..',
      '..GIIIIIIIIG..',
      '...GGGGGGGG...'
    ], 1, 4, { W: [G.wood, 2], C: [G.wood], G: [G.glass, 3], I: [I] });
    g.dot(4, 9, I[4]);
    g.dot(4, 10, I[4]);
    g.dot(5, 8, '#ffffff');
  },
  paper_lantern(g) {
    g.bmp([
      '......s......',
      '.....GGG.....',
      '...RRRRRRR...',
      '..RRRRRRRRR..',
      '..RRRRRRRRR..',
      '..RRRRRRRRR..',
      '..RRRRRRRRR..',
      '...RRRRRRR...',
      '.....GGG.....',
      '......t......',
      '.....ttt.....'
    ], 1, 2, { s: [G.wood, 2], G: [G.gold], R: [G.red], t: [G.gold, 3] });
    for (let y = 5; y <= 9; y += 2) g.dot(5, y, '#ffd0c0');
    g.dot(8, 6, '#fff2a0');
  },
  kettle(g) {
    g.bmp([
      '......HH......',
      '....HH..HH....',
      '...H......H...',
      '....KKKKKK....',
      '..KKKKKKKKKK..',
      '.KKKKKKKKKKKKS',
      '.KKKKKKKKKKKS.',
      '.KKKKKKKKKKK..',
      '..KKKKKKKKK...',
      '...DDDDDDD....'
    ], 1, 4, { H: [G.wood, 2], K: [G.copper], S: [G.copper, 3], D: [G.copper, 1] });
    g.dot(4, 9, '#ffd8b0');
    g.dot(5, 9, '#ffd8b0');
  },
  mushroom_lamp(g) {
    g.bmp([
      '....RRRRR....',
      '..RRWRRRWRR..',
      '.RRRRRRRRRRR.',
      'RRWRRRRRRRWRR',
      'RRRRRRRRRRRRR',
      '....CCCCC....',
      '....CCCCC....',
      '....CCCCC....',
      '...WWWWWWW...'
    ], 1, 4, { R: [G.red], W: [G.white, 4], C: [G.cream], X: [G.wood] });
    g.dot(6, 10, '#fff4d8');
  },
};

export function iconCanvas(prize) {
  const look = (prize && prize.look) || 'straw_hat';
  const key = `${look}|${prize && prize.color}|${prize && prize.stripe}`;
  if (!icons.has(key)) {
    const g = new Grid(16, 16);
    (ICONS[look] || ICONS.straw_hat)(g, prize || {});
    icons.set(key, g.render(true));
  }
  return icons.get(key);
}

export function iconUrl(prize, scale = 2) {
  const key = `${prize && prize.id}@${scale}`;
  if (!urls.has(key)) {
    const base = iconCanvas(prize);
    const out = document.createElement('canvas');
    out.width = 16 * scale;
    out.height = 16 * scale;
    const g = out.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(base, 0, 0, out.width, out.height);
    urls.set(key, out.toDataURL('image/png'));
  }
  return urls.get(key);
}

/* ---------- what a hontori wears ---------- */

const HATS = {
  straw_hat: { rows: ['...SSSSS...', '...SSSSS...', '...RRRRR...', 'SSSSSSSSSSS', '.SSSSSSSSS.'], map: { S: [G.straw], R: [G.red, 2] }, sink: 2 },
  beret: { rows: ['.....N.....', '..BBBBBB...', '.BBBBBBBBB.', 'BBBBBBBBBBB', '.DDDDDDDDD.'], map: 'beret', sink: 2 },
  crown: { rows: ['G..G..G', 'GGGGGGG', 'GGGRGGG', 'GGGGGGG'], map: { G: [G.gold], R: [G.red, 3] }, sink: 1 },
  acorn: { rows: ['....s....', '..AAAAA..', '.AaAAaAA.', 'AAAAAAAAA', '.CCCCCCC.'], map: { A: [G.acorn], a: [G.acorn, 1], s: [G.wood, 2], C: [G.acorn, 1] }, sink: 2 },
  flower_crown: { rows: ['P.W.Y.W.P', 'LLLLLLLLL'], map: { P: [G.pink, 3], W: [G.white, 4], Y: [G.gold, 3], L: [G.leaf] }, sink: 1 },
  chef_hat: { rows: ['.WW.WW.', 'WWWWWWW', 'WWWWWWW', '.WWWWW.', '.WWWWW.', '.CCCCC.'], map: { W: [G.white], C: [G.cream] }, sink: 2 },
  toadstool: { rows: ['...RRR...', '.RRWRRWR.', 'RWRRRRRRR', 'RRRRRWRRR', '.SSSSSSS.'], map: { R: [G.red], W: [G.white, 4], S: [G.cream, 2] }, sink: 2 },
};

export function hatSprite(look, color) {
  const def = HATS[look];
  if (!def) return null;
  const key = `${look}|${color}`;
  if (!hats.has(key)) {
    const rows = def.rows;
    const g = new Grid(rows[0].length + 2, rows.length + 2);
    const B = ramp(color || '#c8402e');
    const map = def.map === 'beret' ? { B: [B], N: [B, 1], D: [B, 1] } : def.map;
    g.bmp(rows, 1, 1, map);
    hats.set(key, { canvas: g.render(true), ax: 1 + rows[0].length / 2, ay: rows.length, sink: def.sink });
  }
  return hats.get(key);
}

/* ---------- keepsakes in the kid's room ---------- */

const KEEPSAKES = {
  paper_lantern: {
    w: 9, h: 14, ax: 4.5, ay: 14, light: '#ff9a6a',
    paint(g) {
      g.rect(4, 0, 1, 2, G.wood);
      g.bmp(['..GGG..', '.RRRRR.', 'RRRRRRR', 'RRRRRRR', 'RRRRRRR', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..GGG..', '...t...', '..t.t..'], 1, 2, { G: [G.gold], R: [G.red], t: [G.gold, 3] });
      for (let y = 5; y <= 9; y += 2) g.dot(3, y, '#ffd0c0');
      g.dot(5, 6, '#fff2a0');
    },
  },
  kettle: {
    w: 12, h: 10, ax: 6, ay: 10, light: null,
    paint(g) {
      g.bmp(['...HHHH...', '..H....H..', '...KKKK...', '.KKKKKKKKS', 'KKKKKKKKS.', 'KKKKKKKK..', '.KKKKKK...', '..DDDD....'], 1, 1, { H: [G.wood, 2], K: [G.copper], S: [G.copper, 3], D: [G.copper, 1] });
      g.dot(3, 5, '#ffd8b0');
    },
  },
  mushroom_lamp: {
    w: 11, h: 11, ax: 5.5, ay: 11, light: '#ffb0a0',
    paint(g) {
      g.bmp(['...RRR...', '.RRWRRWR.', 'RRRRRRRRR', 'RWRRRRRWR', '...CCC...', '...CCC...', '...CCC...', '..WWWWW..'], 1, 1, { R: [G.red], W: [G.white, 4], C: [G.cream] });
      g.dot(4, 6, '#fff4d8');
    },
  },
};

export function keepsake(look) {
  const def = KEEPSAKES[look];
  if (!def) return null;
  if (!keepsakes.has(look)) {
    const g = new Grid(def.w, def.h);
    def.paint(g);
    keepsakes.set(look, { canvas: g.render(true), ax: def.ax, ay: def.ay, light: def.light });
  }
  return keepsakes.get(look);
}

/* ---------- the machine ---------- */

const CAPSULE_COLORS = ['#e0482c', '#4a8ae4', '#f0b828', '#4aaa3a', '#f07a90', '#b08aff'];

export function machine(body, trim) {
  const key = `${body}|${trim}`;
  if (!machines.has(key)) {
    const B = ramp(body || '#c8402e');
    const T = ramp(trim || '#f0c060');
    const g = new Grid(16, MACHINE_H);
    /* the dome: glass full of capsules */
    g.disc(8, 8.5, 6.6, G.glass);
    /* round capsules, coloured on top and white below */
    const spots = [[4, 4], [9, 3], [6, 7], [10, 7], [3, 10], [7, 11], [11, 11]];
    spots.forEach(([x, y], i) => {
      const c = ramp(CAPSULE_COLORS[i % CAPSULE_COLORS.length]);
      g.px(x + 1, y, c, 3);
      g.px(x, y + 1, c, 3);
      g.px(x + 1, y + 1, c, 2);
      g.px(x + 2, y + 1, c, 1);
      g.px(x, y + 2, G.white, 3);
      g.px(x + 1, y + 2, G.white, 2);
      g.px(x + 2, y + 2, G.white, 1);
    });
    g.rect(6, 0, 4, 2, T);
    /* the collar under the dome */
    g.rect(2, 14, 12, 2, T);
    /* the body */
    g.rect(2, 16, 12, 10, B);
    /* the coin slot plate and the chute */
    g.rect(4, 17, 4, 4, T);
    g.rect(5, 18, 2, 2, G.dark);
    g.rect(4, 22, 6, 3, G.dark);
    g.px(5, 22, G.dark, 3);
    /* the crank on the right */
    g.rect(10, 18, 3, 3, G.metal);
    g.px(11, 19, G.metal, 1);
    g.rect(13, 19, 2, 1, G.metal);
    g.rect(14, 17, 1, 3, G.metal);
    g.px(14, 16, B, 3);
    /* the foot */
    g.rect(1, 26, 14, 2, T);
    const canvas = g.render(true);
    const c = canvas.getContext('2d');
    /* the glass shines */
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.fillRect(4, 4, 1, 2);
    c.fillRect(5, 3, 1, 1);
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.fillRect(11, 4, 1, 1);
    machines.set(key, canvas);
  }
  return machines.get(key);
}

/* ---------- the capsule of the reveal ---------- */

export function capsuleCanvas(color, open) {
  const key = `${color}|${open ? 1 : 0}`;
  if (!capsules.has(key)) {
    const C = ramp(color || '#e0482c');
    const g = new Grid(20, 20);
    const lift = open ? 4 : 0;
    g.disc(10, 10, 7.5, C, (x, y) => y < 10);
    g.disc(10, 10, 7.5, G.white, (x, y) => y >= 10);
    if (open) {
      for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (y < 10 && g.get(x, y)) g.clear(x, y);
      g.disc(10, 10 - lift, 7.5, C, (x, y) => y < 10 - lift);
    }
    g.rect(3, 9, 14, 1, G.metal);
    const canvas = g.render(true);
    const c = canvas.getContext('2d');
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.fillRect(6, 5 - lift, 2, 1);
    c.fillRect(5, 6 - lift, 1, 1);
    capsules.set(key, canvas);
  }
  return capsules.get(key);
}
