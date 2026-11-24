/*
 * sanctum.js  (Hontori: features)
 * Job: the Wand Sanctum sealed by the Council (chapter 6, world rule 80) and the story's questions about who
 * travels with the kid. Before the seal the kid chooses who comes along on a clear screen (party and Sanctum
 * together, the party picked first, the kid's own hontori always kept); everyone else sleeps in the sealed
 * Sanctum until it is opened again (chapter 8). While it is sealed nothing goes in or out: the Sanctum panel
 * shows them asleep under grey wax, a binding with a full party is refused in battle (game/story/battle.js) and
 * a hontori that would join a full party waits instead, with a gentle line (game/story/party.js).
 *
 * Public API:
 *   installSanctum(game)   registers everything below
 *     save section     "sanctum" { sealed: false }
 *     service          "sanctum" { sealed(), count(), carries(test) }
 *     story.command    "ext:chooseCarry" { ext: 'chooseCarry', n, title, sub, confirm, then, else }
 *                        the choice screen (systems/features/CarryChoice.js); confirmed: the party becomes the
 *                        chosen ones (in the order shown: the party first) and the rest rest in the Sanctum,
 *                        then `then` runs; backed out: `else` runs
 *                      "ext:sanctum" { ext: 'sanctum', seal: true | false }   seal or open it
 *                      "ext:toFront" { ext: 'toFront', kind }   the first party member of that kind leads
 *     story.condition  "ext:sanctum" { ext: 'sanctum', sealed: true | false, count: n | { gte, lte, eq } }
 *                        (both optional; count: how many rest in the Sanctum)
 *                      "ext:carries" { ext: 'carries', kind, element }   a party member of that kind, or of that
 *                        element (either of its two)
 *   SANCTUM_WORDS          the words of these pieces while the content has none (text id -> English)
 *   OWN_KIND               the kind that is always kept (the kid's own hontori): the game's companion key
 */

import { chooseCarry } from '../../systems/features/index.js';
import { word } from './words.js';

export const SANCTUM_WORDS = Object.freeze({
  'shared.feat.carry.count': '{n} of {max} chosen',
  'shared.feat.carry.locked': 'Always with you',
  'shared.feat.carry.full': 'That is all the wand can carry. Unpick one first.',
  'shared.feat.carry.back': 'Not yet',
  'shared.feat.carry.level': 'Lv {level}',
  'shared.ui.sanctum.sealed': 'Sealed by the Council',
  'shared.ui.sanctum.sealed.sub': '{n} asleep under grey wax',
  'shared.ui.sanctum.sealed.note': 'They sleep safe and still. The seal cannot be opened from here.',
  'shared.ui.sanctum.sealed.tap': 'The wax holds. {name} sleeps on.',
  'shared.ui.sanctum.sealed.rest': 'The Sanctum is sealed. Nobody can rest there now.',
  'shared.feat.sanctum.noRoom': 'Your party is full and the Sanctum is sealed. {name} will have to wait.',
});

export const OWN_KIND = 'hontori';

function say(game, id, params) {
  const said = word(game, id, params);
  if (said && said !== id) return said;
  const raw = SANCTUM_WORDS[id] || '';
  return raw.replace(/\{(\w+)\}/g, (whole, key) => (params && params[key] != null ? String(params[key]) : whole));
}

function itemsOf(game) {
  return game.registry.get('service', 'items') || null;
}

function restingOf(game) {
  const kinds = game.save.state.kinds;
  if (!kinds) return [];
  if (!Array.isArray(kinds.resting)) kinds.resting = [];
  return kinds.resting;
}

function kindOf(game, key) {
  for (const folder of game.registry.all('content')) {
    const found = folder && Array.isArray(folder.kinds) ? folder.kinds.find((k) => k.kind === key) : null;
    if (found) return found;
  }
  return null;
}

function count(value, n) {
  if (value == null) return true;
  if (typeof value === 'number') return n === value;
  if (typeof value !== 'object') return false;
  if (value.gte != null && !(n >= value.gte)) return false;
  if (value.lte != null && !(n <= value.lte)) return false;
  if (value.eq != null && n !== value.eq) return false;
  return true;
}

export function installSanctum(game) {
  const { registry } = game;
  const own = (game.config && game.config.companion && game.config.companion.key) || OWN_KIND;
  game.save.define('sanctum', { sealed: false });
  const sealed = () => !!(game.save.state.sanctum && game.save.state.sanctum.sealed);
  const members = () => {
    const items = itemsOf(game);
    return items && items.party ? items.party.members() : [];
  };
  const carries = (test) => members().some((m) => {
    if (!m) return false;
    if (test.kind && m.key !== test.kind) return false;
    if (test.element) {
      const kind = kindOf(game, m.key);
      if (!kind || (kind.element !== test.element && kind.element2 !== test.element)) return false;
    }
    return !!(test.kind || test.element);
  });

  registry.add('service', 'sanctum', { sealed, count: () => restingOf(game).length, carries });

  registry.add('story.condition', 'ext:sanctum', (node) => {
    if (node.sealed != null && !!node.sealed !== sealed()) return false;
    return count(node.count, restingOf(game).length);
  });

  registry.add('story.condition', 'ext:carries', (node, ctx) => carries({ kind: ctx.value(node.kind), element: ctx.value(node.element) }));

  registry.add('story.command', 'ext:sanctum', (node) => {
    if (node.seal == null) return;
    game.save.state.sanctum.sealed = !!node.seal;
    game.bus.emit('sanctum:change', { sealed: !!node.seal });
    game.save.commit();
  });

  registry.add('story.command', 'ext:toFront', (node, ctx) => {
    const items = itemsOf(game);
    const key = ctx.value(node.kind);
    if (!items || !items.party || !key) return;
    const i = items.party.members().findIndex((m) => m && m.key === key);
    if (i > 0) {
      items.party.setLead(i);
      game.save.commit();
    }
  });

  registry.add('story.command', 'ext:chooseCarry', async (node, ctx) => {
    const items = itemsOf(game);
    if (!items || !items.party) return ctx.run(node.else || []);
    const party = items.party;
    const n = Math.max(1, Math.floor(Number(ctx.value(node.n)) || party.max));
    const inParty = party.members().slice();
    const resting = restingOf(game).slice();
    const everyone = [...inParty.map((m) => ({ m, from: 'party' })), ...resting.map((m) => ({ m, from: 'rest' }))];
    let ownKept = false;
    const entries = everyone.map(({ m, from }, i) => {
      const locked = !ownKept && m.key === own;
      if (locked) ownKept = true;
      let portrait = null;
      try {
        portrait = game.art.portrait('creature', m.key, m.stage);
      } catch (error) {
        portrait = null;
      }
      const kind = kindOf(game, m.key);
      const stage = kind && Array.isArray(kind.stages) ? kind.stages[Math.max(0, (m.stage || 1) - 1)] : null;
      const said = stage && stage.name ? word(game, stage.name) : '';
      const name = m.nick || (said && said !== stage.name ? said : m.key);
      return { id: i, name, sub: say(game, 'shared.feat.carry.level', { level: m.level || 1 }), portrait, picked: from === 'party', locked };
    });
    const picked = await chooseCarry(game, {
      title: node.title ? ctx.text(node.title) : '',
      sub: node.sub ? ctx.text(node.sub, { n }) : '',
      n,
      entries,
      words: {
        confirm: node.confirm ? ctx.text(node.confirm) : 'OK',
        back: say(game, 'shared.feat.carry.back'),
        /* the screen fills the two numbers itself: they are handed on as placeholders */
        count: say(game, 'shared.feat.carry.count', { n: '{n}', max: '{max}' }),
        locked: say(game, 'shared.feat.carry.locked'),
        full: say(game, 'shared.feat.carry.full'),
      },
    });
    if (!Array.isArray(picked) || !picked.length) return ctx.run(node.else || []);
    const chosen = new Set(picked);
    const going = everyone.filter((e, i) => chosen.has(i)).map((e) => e.m);
    const staying = everyone.filter((e, i) => !chosen.has(i)).map((e) => e.m);
    const list = party.members();
    list.length = 0;
    for (const m of going.slice(0, party.max)) list.push(m);
    const rest = restingOf(game);
    rest.length = 0;
    for (const m of staying) rest.push(m);
    for (const m of going.slice(party.max)) rest.push(m);
    party.changed();
    game.save.commit();
    return ctx.run(node.then || []);
  });
}

/* a gentle refusal while the Sanctum is sealed and the party full (game/story/party.js, game/story/battle.js) */
export function noRoomLine(game, name) {
  return say(game, 'shared.feat.sanctum.noRoom', { name });
}
