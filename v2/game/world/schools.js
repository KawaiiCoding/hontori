/*
 * schools.js  (Hontori: world)
 * Job: the small school dressing. A map written as data may say that one of its houses is a small school
 * (`school` in game/maps/index.js); that house then shows a name board over its door, the banner of its
 * element on the wall and a touch of its own (the Kite House: kites on poles, swaying in the wind). This
 * module paints those props; the map loader places them. A later small school needs no code: its element
 * picks the banner, its name the board.
 *
 * Public API:
 *   installSchools(game, folders)   folders: the map folders (game/maps MAP_FOLDERS). Adds the props
 *        "school_banner_<element>" (all eight), "kite_pole" and one "school_sign:<map id>" per school.
 */

import { paintKite } from '../features/kite.js';

const INK = '#2a1c2e';
const WOOD = ['#5a3a1e', '#8a5a30', '#a8743e', '#c08a54'];
const GOLD = '#e0c060';
const GOLD_DARK = '#8a6a20';
const POLE = ['#5a3a1e', '#8a5a30', '#a8743e'];
/* the cloth of each element's banner: [cloth, light edge] */
const CLOTH = {
  water: ['#2a6aa8', '#4a8ac8'], fire: ['#b8442a', '#d8643a'], wind: ['#2a8a80', '#46b4a4'], grass: ['#2f7a3a', '#4a9a4a'],
  electric: ['#a8882a', '#c8a83a'], earth: ['#7a5a3a', '#9a7a52'], dark: ['#4a3a6a', '#6a5a8a'], light: ['#b89a5a', '#d8c08a'],
};
/* the element emblems of the current game's icons (src/icons.js), 8 by 8 */
const EMBLEM = {
  water: ['...##...', '...##...', '..####..', '.######.', '.######.', '.######.', '..####..', '........'],
  fire: ['...#....', '...##...', '..###.#.', '.####.#.', '.######.', '########', '.######.', '..####..'],
  wind: ['..####..', '.#....#.', '#..##..#', '#.#..#.#', '#.#.##.#', '#..#...#', '.#......', '..###...'],
  grass: ['......##', '.....###', '...#####', '..######', '.#####..', '.####...', '#.##....', '#.......'],
  electric: ['....###.', '...###..', '..###...', '.######.', '....##..', '...##...', '..##....', '.#......'],
  earth: ['........', '...#....', '..###...', '..###.#.', '.######.', '########', '########', '........'],
  dark: ['..###...', '.###..#.', '###.....', '##......', '##......', '###.....', '.###....', '..###...'],
  light: ['...##...', '...##...', '..####..', '########', '########', '..####..', '...##...', '...##...'],
};
/* a 3 by 5 pixel alphabet for name boards */
const ROWS = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['..#', '..#', '..#', '#.#', '.#.'], K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#.#', '###', '###', '#.#', '#.#'], N: ['##.', '#.#', '#.#', '#.#', '#.#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  P: ['##.', '#.#', '##.', '#..', '#..'], Q: ['.#.', '#.#', '#.#', '.#.', '..#'], R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'], U: ['#.#', '#.#', '#.#', '#.#', '###'],
  V: ['#.#', '#.#', '#.#', '#.#', '.#.'], W: ['#.#', '#.#', '###', '###', '#.#'], X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
};
const LETTER = 4;
const SPACE = 2;
/* how far above the doorstep the board and the banner hang, in pixels */
const SIGN_RISE = 36;
const BANNER_RISE = 22;
/* the board is lit by a small warm lamp of its own, so it reads at night */
const SIGN_LIGHT = { dx: 8, dy: -30, r: 22, color: '#ffe0a0', flicker: false };
const KITE_LIGHT = { dx: 14, dy: -24, r: 12, color: '#8a7a5a', flicker: false };

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function widthOf(text) {
  let w = 0;
  for (const ch of text) w += ROWS[ch] ? LETTER : SPACE;
  return Math.max(0, w - 1);
}

function paintText(ctx, text, x, y, color) {
  ctx.fillStyle = color;
  let at = x;
  for (const ch of text) {
    const rows = ROWS[ch];
    if (!rows) {
      at += SPACE;
      continue;
    }
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (rows[r][c] === '#') ctx.fillRect(at + c, y + r, 1, 1);
    at += LETTER;
  }
}

/* a wooden name board on two short chains, centred over the door tile */
function signPainter(name) {
  const text = String(name || '').toUpperCase().replace(/[^A-Z ]/g, '').trim();
  const inner = widthOf(text);
  const w = inner + 6;
  return (ctx, px, py) => {
    const x = Math.round(px + 8 - w / 2);
    const y = py - SIGN_RISE;
    rect(ctx, x + 2, y - 3, 1, 3, INK);
    rect(ctx, x + w - 3, y - 3, 1, 3, INK);
    rect(ctx, x, y, w, 10, INK);
    rect(ctx, x + 1, y + 1, w - 2, 8, WOOD[2]);
    rect(ctx, x + 1, y + 1, w - 2, 1, WOOD[3]);
    rect(ctx, x + 1, y + 8, w - 2, 1, WOOD[1]);
    paintText(ctx, text, x + 3, y + 3, WOOD[0]);
  };
}

/* the banner of a school: a rod, the cloth of the element, gold bands and its emblem */
function bannerPainter(element) {
  const [cloth, light] = CLOTH[element];
  const emblem = EMBLEM[element];
  return (ctx, px, py) => {
    const x = px + 2;
    const y = py - BANNER_RISE;
    rect(ctx, x - 1, y, 14, 2, GOLD_DARK);
    rect(ctx, x, y + 2, 12, 20, INK);
    rect(ctx, x + 1, y + 2, 10, 19, cloth);
    rect(ctx, x + 1, y + 2, 2, 19, light);
    for (let i = 0; i < 10; i++) rect(ctx, x + 1 + i, y + 21 + (i % 2), 1, 1, cloth);
    rect(ctx, x + 1, y + 4, 10, 1, GOLD);
    rect(ctx, x + 1, y + 18, 10, 1, GOLD);
    ctx.fillStyle = GOLD;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (emblem[r][c] === '#') ctx.fillRect(x + 2 + c, y + 7 + r, 1, 1);
  };
}

/* a kite tethered to a pole: it leans and sways with the wind of the day */
function paintKitePole(ctx, px, py, env) {
  const t = (env && env.t) || 0;
  const wind = Math.max(0.25, Math.min(1, (env && env.wind) || 0));
  const seed = (px * 7 + py * 13) % 10;
  rect(ctx, px + 6, py - 14, 4, 28, INK);
  rect(ctx, px + 7, py - 13, 2, 26, POLE[1]);
  rect(ctx, px + 7, py - 13, 1, 26, POLE[2]);
  rect(ctx, px + 5, py + 12, 6, 2, POLE[0]);
  const sway = Math.sin(t * 1.7 + seed) * 2 * wind;
  const kx = px + 8 + 9 * wind + sway;
  const ky = py - 26 + Math.cos(t * 1.3 + seed) * 1.5;
  ctx.strokeStyle = 'rgba(250,244,230,0.85)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px + 8, py - 13);
  ctx.quadraticCurveTo(px + 8 + (kx - px - 8) / 2, py - 15, kx, ky + 4);
  ctx.stroke();
  KITE_INFO.seconds = t + seed;
  KITE_INFO.tilt = 0.4 * wind + sway * 0.1;
  paintKite(ctx, kx, ky, KITE_INFO, seed % 2 ? KITE_A : KITE_B);
}

const KITE_INFO = { seconds: 0, tilt: 0 };
const KITE_A = { body: '#d8442e', light: '#f07a4a', spar: '#5a2a18', bow: ['#ffd060', '#7ac0f0'] };
const KITE_B = { body: '#3a8ab8', light: '#7ac0f0', spar: '#1e3a5a', bow: ['#ffd060', '#f4ead0'] };

export function installSchools(game, folders = []) {
  const art = game.art;
  const add = (type, spec) => {
    try {
      art.addProp(type, spec);
    } catch (error) {
      console.warn(`Schools: the prop "${type}" could not be added`, error);
    }
  };
  for (const element of Object.keys(CLOTH)) {
    add(`school_banner_${element}`, { info: { fw: 1, fh: 1, solid: false, hangs: true, still: true }, draw: bannerPainter(element) });
  }
  add('kite_pole', { info: { fw: 1, fh: 1, solid: true, light: KITE_LIGHT }, draw: paintKitePole, animates: true });
  for (const folder of folders) {
    for (const data of (folder && folder.maps) || []) {
      if (!data.school) continue;
      const name = folder.text && data.school.name in folder.text ? folder.text[data.school.name] : data.school.name;
      add(`school_sign:${data.id}`, { info: { fw: 1, fh: 1, solid: false, hangs: true, still: true, light: SIGN_LIGHT }, draw: signPainter(name) });
    }
  }
}
