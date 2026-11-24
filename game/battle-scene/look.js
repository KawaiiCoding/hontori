/*
 * look.js  (Hontori game layer)
 * Job: the fixed looks and words of Hontori's battle screen as data: element and spell colours, the foe's
 * intents, the status tags, the grades, the ring of a school duel, the owner's pixel hand and every label the
 * screen itself shows (the rules' own lines live in game/battle/text.js).
 *
 * Public API:
 *   ELEMENT_COLORS, BADGE_COLORS    element -> the bright colour of its magic / the colour of its badge
 *   SPELL_COLORS, SPELL_NOTES       spell -> its ink colour / the two words under it on the spell sheet
 *   GRADE_COLORS                    grade -> colour of the pop-up
 *   BREATH_GAIN                     the stamina one breath gives back (shown on the button)
 *   INTENTS                         intent -> { word, note, color, drawing (svg path markup) }
 *   STATUS_TAGS                     status -> [label, colour]
 *   END_CARDS                       result -> { kicker, color } (see endCard)
 *   LABELS, label(id, vars)         the screen's own words
 *   elementBadge(art, element)      -> { icon, label, color } for a BattleCard
 *   edgeOf(attack, defend)          'up' when my attacks are strong, 'down' when the foe's are, else 'even'
 *   ringCrest(color)                svg markup of a gold ring with a gem in the school's colour
 *   handPicture()                   a data URL of the open pixel hand that blocks a binding
 *   rgba(hex, alpha)
 */

export const ELEMENT_COLORS = Object.freeze({
  fire: '#ff8a3c', water: '#4aa8ff', wind: '#9ff0e0', grass: '#7ed957', electric: '#7ff0ff', earth: '#c9935a',
  dark: '#a070ff', light: '#fff2a8'
});

export const BADGE_COLORS = Object.freeze({
  water: '#2e86e4', fire: '#e45426', wind: '#2aa892', grass: '#48aa36', electric: '#d6a810', earth: '#a46c36',
  dark: '#563692', light: '#d0b050'
});

export const SPELL_COLORS = Object.freeze({
  mend: '#9cf0a6', shield: '#8fd8ff', boost: '#ffb35a', stun: '#ffe27a', sleep: '#b9a8ff', bind: '#ffd98a',
  revive: '#fff0d0', veil: '#ffd98a', fish: '#7fd8ff', step: '#c8f0ff'
});

export const SPELL_NOTES = Object.freeze({
  mend: 'Heal', shield: 'Block', boost: 'Power up', stun: 'Stun', sleep: 'Sleep', bind: 'Capture', revive: 'Revive',
  veil: 'Lift veil', step: 'Escape'
});

/* the stamina one breath gives back, shown on the Catch breath button (the rule is in game/battle/fight.js) */
export const BREATH_GAIN = 3;

export const GRADE_COLORS = Object.freeze({ flawless: '#ffd24a', strong: '#bfe4ff', weak: '#a8a8b8' });

export const INTENTS = Object.freeze({
  strike: { word: 'Attack', color: '#ff9a7a', note: 'will hit yours', drawing: '<path d="M6 22 L14 6 M11 24 L20 8 M16 26 L25 11"/>' },
  charge: { word: 'Powering up', color: '#ffcf5a', note: 'big hit next turn', drawing: '<path d="M8 18 L15 11 L22 18 M8 25 L15 18 L22 25"/>' },
  unleash: { word: 'Big hit', color: '#ff5a5a', note: 'double damage now', drawing: '<path d="M15 3 L17 12 L26 9 L19 16 L26 22 L17 19 L15 28 L13 19 L4 22 L11 16 L4 9 L13 12 Z"/>' },
  guard: { word: 'Guarding', color: '#8fd8ff', note: 'takes half damage', drawing: '<path d="M15 4 L25 8 Q25 20 15 26 Q5 20 5 8 Z"/>' },
  heal: { word: 'Healing', color: '#9cf0a6', note: 'restores itself', drawing: '<path d="M15 6 L15 24 M6 15 L24 15"/>' },
  hex: { word: 'Sleep spell', color: '#c49aff', note: 'yours may fall asleep', drawing: '<path d="M4 15 Q15 4 26 15 Q15 26 4 15 Z"/><circle cx="15" cy="15" r="3"/>' },
  asleep: { word: 'Asleep', color: '#b9a8ff', note: 'cannot act', drawing: '<path d="M8 8 L16 8 L8 16 L16 16 M17 16 L23 16 L17 22 L23 22"/>' },
  stunned: { word: 'Stunned', color: '#ffe27a', note: 'cannot act', drawing: '<path d="M15 4 L18 12 L26 12 L19 17 L22 25 L15 20 L8 25 L11 17 L4 12 L12 12 Z"/>' }
});

export const STATUS_TAGS = Object.freeze({
  asleep: ['Asleep', '#b9a8ff'], stun: ['Stunned', '#ffe27a'], shield: ['Warded', '#8fd8ff'], boost: ['Rallied', '#ffb35a'],
  root: ['Rooted', '#7ed957'], glow: ['Glow', '#ff8a3c'], harden: ['Shell', '#c9935a'], tail: ['Tailwind', '#9ff0e0'],
  veil: ['Veiled', '#a070ff'], mist: ['Misted', '#cfe9ff'], guard: ['Guard', '#8fd8ff'], charged: ['Charged', '#ffcf5a']
});

export const END_CARDS = Object.freeze({
  captured: { kicker: 'Bound', color: '#ffd98a' },
  ring: { kicker: 'Ring earned', color: '#9cf0a6' },
  duelWon: { kicker: 'Duel won', color: '#9cf0a6' },
  won: { kicker: 'Victory', color: '#9cf0a6' },
  fled: { kicker: 'Escaped', color: '#bfe4ff' },
  duelLost: { kicker: 'Duel lost', color: '#ffb08a' },
  lost: { kicker: 'Time to rest', color: '#ffb08a' }
});

export const LABELS = Object.freeze({
  mana: 'Mana',
  spells: 'Spells',
  herb: 'Herb x{n}',
  bread: 'Bread',
  treat: 'Treat x{n}',
  switch: 'Switch',
  escape: 'Escape',
  breath: 'Catch breath',
  breathGain: '+{n} ST',
  guide: 'Guide',
  on: 'On',
  off: 'Off',
  yourTurn: 'Your turn',
  enemyTurn: 'Enemy turn',
  level: 'Lv {n}',
  hp: 'HP',
  stamina: 'ST',
  attack: 'Attack',
  support: 'Support',
  cost: '{n} ST',
  power: 'Power {n}. ',
  rest: 'Rest {n}',
  fainted: 'Fainted',
  asleep: 'Asleep',
  movesFirst: ', moves first',
  ringDuel: 'Ring Duel',
  ownerRing: '{name} - Ring Duel',
  rule: 'Rule: {rule}',
  tapToBegin: 'Tap to begin',
  continue: 'Continue',
  rival: 'Rival',
  moveInfo: '{name}: {desc}',
  floatMana: '+1 mana',
  floatStamina: '+{n} stamina',
  floatMiss: 'Miss',
  floatDodged: 'Dodged',
  floatWoke: 'Woke up',
  floatDoze: 'Zzz',
  floatStunned: 'Stunned',
  floatAsleep: 'Asleep',
  floatMastery: 'Mastery {n}',
  tipGrade: 'Neater sigils are stronger and teach the wand more.',
  tipSwitch: 'Switching uses your turn.',
  tipEscape: 'The bars show your chance. Tap again to run.',
  tipBread: 'A binding holds more easily now.',
  joins: 'It joins your party.',
  rests: 'It rests inside the wand.'
});

export function label(id, vars) {
  const s = LABELS[id] || '';
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] != null ? String(vars[k]) : ''));
}

export function rgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export function elementBadge(art, element) {
  const key = String(element || '').toLowerCase();
  let icon = '';
  try {
    icon = art.iconUrl(key);
  } catch (error) {
    icon = '';
  }
  return { icon, label: key ? key.charAt(0).toUpperCase() + key.slice(1) : '', color: BADGE_COLORS[key] || '#555' };
}

export function edgeOf(attack, defend) {
  return attack > 1 ? 'up' : defend > 1 ? 'down' : 'even';
}

export function ringCrest(color) {
  const gem = color || '#7ed957';
  return `<svg viewBox="0 0 160 140" width="170" height="150"><defs>
<linearGradient id="btRingBand" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3b8"/><stop offset=".45" stop-color="#e8b84a"/><stop offset="1" stop-color="#8a5a18"/></linearGradient>
<radialGradient id="btRingGem" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="${gem}"/><stop offset="1" stop-color="#0a1a0a"/></radialGradient></defs>
<ellipse cx="80" cy="86" rx="52" ry="34" fill="none" stroke="#3a2408" stroke-width="20"/>
<ellipse cx="80" cy="86" rx="52" ry="34" fill="none" stroke="url(#btRingBand)" stroke-width="15"/>
<ellipse cx="80" cy="82" rx="50" ry="31" fill="none" stroke="#fff6c8" stroke-width="2" opacity=".6"/>
<path d="M58 54 L80 30 L102 54 L80 66 Z" fill="#5a3a10"/><path d="M62 52 L80 22 L98 52 L80 64 Z" fill="url(#btRingGem)" stroke="#2a1a06" stroke-width="2"/>
<path d="M70 44 L80 28 L84 40 Z" fill="#fff" opacity=".7"/><circle cx="118" cy="70" r="3" fill="#fff" opacity=".9"/></svg>`;
}

const HAND_W = 15;
const HAND_H = 19;
const HAND_CELL = 5;
const HAND_COLORS = { o: '#f2c9a0', s: '#d89e74', h: '#ffe4c8', c: '#5a4a9a', t: '#e0c060' };
let handUrl = null;

/* an open palm with four fingers, a thumb, a soft highlight and a sleeve with a gold trim, outlined in brown */
export function handPicture() {
  if (handUrl) return handUrl;
  const cell = {};
  const put = (x, y, c) => {
    cell[`${x},${y}`] = c;
  };
  for (const [fx, top] of [[2, 3], [5, 1], [8, 2], [11, 4]]) {
    for (let y = top; y < 10; y++) {
      put(fx, y, 'o');
      put(fx + 1, y, y === top ? 'o' : 's');
    }
  }
  for (let y = 9; y < 16; y++) for (let x = 2; x <= 12; x++) put(x, y, y >= 14 || x === 12 ? 's' : 'o');
  for (const [x, y] of [[0, 9], [1, 9], [0, 10], [1, 10], [1, 11], [1, 12], [1, 13]]) put(x, y, 'o');
  put(5, 11, 'h');
  put(6, 11, 'h');
  put(5, 12, 'h');
  for (let y = 16; y < 19; y++) for (let x = 2; x <= 12; x++) put(x, y, y === 16 ? 't' : 'c');
  const canvas = document.createElement('canvas');
  canvas.width = (HAND_W + 2) * HAND_CELL;
  canvas.height = (HAND_H + 1) * HAND_CELL;
  const g = canvas.getContext('2d');
  for (let y = -1; y <= HAND_H; y++) {
    for (let x = -1; x <= HAND_W; x++) {
      const k = cell[`${x},${y}`];
      const edge = cell[`${x - 1},${y}`] || cell[`${x + 1},${y}`] || cell[`${x},${y - 1}`] || cell[`${x},${y + 1}`];
      if (!k && !edge) continue;
      g.fillStyle = k ? HAND_COLORS[k] : '#3a2418';
      g.fillRect((x + 1) * HAND_CELL, y * HAND_CELL, HAND_CELL, HAND_CELL);
    }
  }
  handUrl = canvas.toDataURL();
  return handUrl;
}
