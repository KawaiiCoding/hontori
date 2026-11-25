/*
 * setup.js  (Hontori game layer)
 * Job: build a Hontori battle from the save data: the party side, the foe side (wild or a trainer's team), the
 * wand (mana, known spells, the 4-spell loadout, perks, mastery) and the items (old src/battle.js start()).
 *
 * Public API:
 *   setupBattle(b, setup)     the rules' setup hook. setup:
 *     party      [{ key, level, hp, maxHp, atk, stage, sta, moves, nick }]   copied, never mutated
 *     species    (key) => { element, element2, name }
 *     env        { time, weather, indoor }
 *     enemy, level, stage, pool   a wild foe: its key (else a random pick from pool, minus the lead's key),
 *                                 its level (else lead level -1 (30%), +0 (42%) or +1 (28%))
 *     trainer    { name, key, spirit, level, stage, team: [{ spirit, level, stage }], noSwitch, ban, lesson,
 *                  school, noCapture }
 *     noCapture, sureBind (the third binding always holds), spells (a fixed spell list for this battle),
 *     noRoom (the party is full and the Sanctum sealed: no binding), twist ('flawless'),
 *     mode ('ally') with ally { name, key, team } (a double battle: ally.js)
 *     rules      [name]   the battle's rule names (content); the ring rules among them (ringRules.js) run;
 *                          their setup hook runs last, once the battle is built
 *     wand       { mana, maxMana, level, spells, loadout, spellXp, spellMastery, perks }  (perks: growth.wandPerks)
 *     items      [{ id, n }]
 *     flags      { boundOnce }
 *   makeMine(b, member), makeFoe(b, key, level, stage, name)   new fighters
 * The lead is the first member with hp above 0 (a missing hp counts as healthy), else the first member.
 */

import { HontoriFighter, foeMaxHp } from './HontoriFighter.js';
import { MOVES, movesFor } from './moves.js';
import { normalizeSpellId } from './spells.js';
import { staMax } from './growth.js';
import { ELEMENTS } from './elements.js';
import { speciesOf, cap } from './common.js';
import { ringRulesOf, runRingRules } from './ringRules.js';
import { setupAlly } from './ally.js';

const DEFAULT_LEAD = { key: 'hontori', level: 1, hp: 20, maxHp: 20 };

export function makeMine(b, member) {
  const sp = speciesOf(b.state.species, member.key);
  const smx = staMax(member.level);
  return new HontoriFighter({
    side: 'me', key: member.key, element: sp.element, element2: sp.element2,
    name: member.nick || sp.name || cap(sp.element) + ' Hontori',
    level: member.level || 1, hp: Math.max(0, member.hp == null ? 20 : member.hp), maxHp: member.maxHp || 20,
    atk: member.atk || 0, stage: member.stage, staMax: smx,
    sta: Math.max(0, Math.min(smx, member.sta == null ? smx : member.sta))
  });
}

export function makeFoe(b, key, level, stage, name) {
  const sp = speciesOf(b.state.species, key);
  const max = foeMaxHp(level);
  return new HontoriFighter({ side: 'foe', key, element: sp.element, element2: sp.element2, name, level, hp: max, maxHp: max, stage });
}

export function setupBattle(b, s) {
  const S = b.state;
  S.species = s.species;
  S.env = Object.assign({ time: 12, weather: 'clear', indoor: false }, s.env);
  const TR = s.trainer || null;
  S.trainer = TR;
  S.team = TR && Array.isArray(TR.team) && TR.team.length ? TR.team : null;
  S.teamIndex = 0;
  S.noCapture = !!s.noCapture;
  S.sureBind = !!s.sureBind;
  S.noRoom = !!s.noRoom;
  /* a drawing twist on this battle ('flawless': only Flawless sigils take effect) */
  S.twist = typeof s.twist === 'string' ? s.twist : null;
  S.foresee = 0;
  setupAlly(b, s);
  S.nextIntent = null;
  S.sealedSpell = null;
  /* the spells a ring rule seals one by one (seal), and the ones it brings into the battle (the V under seal) */
  S.sealed = [];
  S.extraSpells = [];
  S.rules = ringRulesOf([...(Array.isArray(s.rules) ? s.rules : []), ...(TR && Array.isArray(TR.rules) ? TR.rules : [])]);
  S.flags = Object.assign({}, s.flags);

  S.partyGiven = Array.isArray(s.party) && s.party.length > 0;
  const party = (S.partyGiven ? s.party : [DEFAULT_LEAD]).map((m) => Object.assign({}, m));
  let act = party.findIndex((m) => (m.hp == null ? 1 : m.hp) > 0);
  if (act < 0) act = 0;
  b.addSide('me', party);
  const mine = b.send('me', act, makeMine(b, party[act]));
  S.moves = movesFor(party[act], mine.el);

  let key;
  let level;
  let stage;
  let name;
  if (TR) {
    const first = S.team ? S.team[0] : TR;
    key = first.spirit || 'electric';
    level = first.level || 1;
    stage = s.stage || (S.team && first.stage ? first.stage : TR.stage);
    const sp = speciesOf(S.species, key);
    name = S.team ? sp.name || TR.name : TR.name;
  } else {
    if (s.enemy) key = s.enemy;
    else {
      const pool = (Array.isArray(s.pool) && s.pool.length ? s.pool : ELEMENTS).filter((k) => k !== mine.key);
      key = pool[Math.floor(b.random() * pool.length)] || 'fire';
    }
    if (s.level) level = s.level;
    else {
      const r = b.random();
      level = Math.max(1, mine.level + (r < 0.3 ? -1 : b.random() < 0.6 ? 0 : 1));
    }
    stage = s.stage;
    const sp = speciesOf(S.species, key);
    name = 'Jealous ' + (sp.name || cap(sp.element));
  }
  b.addSide('foe', S.team ? S.team : [{ spirit: key, level, stage }]);
  const f = b.send('foe', 0, makeFoe(b, key, level, stage, name));
  S.foeMoves = MOVES[f.el] || MOVES.fire;
  S.foeKey = key;
  S.foeLevel = level;
  S.seen = TR ? [] : [key];

  const w = s.wand || {};
  S.maxMana = w.maxMana || 3;
  S.mana = Math.min(S.maxMana, w.mana == null ? S.maxMana : w.mana);
  let known = (Array.isArray(w.spells) ? w.spells : []).map(normalizeSpellId);
  if (Array.isArray(s.spells)) known = s.spells.map(normalizeSpellId);
  if (TR && Array.isArray(TR.ban)) known = known.filter((k) => !TR.ban.includes(k));
  S.known = known;
  let loadout = (s.spells ? known : Array.isArray(w.loadout) && w.loadout.length ? w.loadout : known)
    .map(normalizeSpellId).filter((k, i, a) => known.includes(k) && a.indexOf(k) === i).slice(0, 4);
  if (!loadout.length) loadout = known.slice(0, 4);
  S.loadout = loadout;
  S.perks = w.perks || { power: 1 + 0.05 * ((w.level || 1) - 1), costCut: 0, tolerance: 0 };
  S.wandPower = S.perks.power || 1;
  S.spellXp = Object.assign({}, w.spellXp);
  S.spellMastery = Object.assign({}, w.spellMastery);

  S.items = (Array.isArray(s.items) ? s.items : []).map((i) => Object.assign({}, i));
  S.used = {};
  S.wandExp = 0;
  S.intent = 'strike';
  S.lastIntent = '';
  S.spellUsed = false;
  S.binds = 0;
  S.escTries = 0;
  S.forced = false;
  S.breadUsed = false;
  S.calm = 0;
  S.stepped = 0;
  /* a ring rule may shape the battle once it is built (seal adds the V to the loadout) */
  runRingRules(b, 'setup');
}
