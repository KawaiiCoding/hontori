/*
 * battle.js  (Hontori: story)
 * Job: start Hontori's battles for the story and write down what they leave behind. It builds the
 * battle setup (game/battle/setup.js) from the content (a trainer or a wild hontori), the party,
 * the wand and the bag, opens the battle screen (game/battle-scene startBattle, which writes
 * nothing), and then applies the report and the rewards through the items system and the mana
 * section: health and stamina, EXP and levels, things used, the purse (once per trainer), the coins
 * dropped after a lost wild battle, the seen and bound lists, a bound hontori, mana and the wand.
 *
 * Public API:
 *   installBattles(game)   after the items and time lanes; installs the battle screen too
 *   WAND_SAVE, KINDS_SAVE  the defaults of the two save sections
 *
 * What it registers:
 *   save sections    "wand"   { level, exp, spells, loadout, spellXp, spellMastery }
 *                    "kinds"  { seen: [kind], bound: [kind], resting: [member], boundOnce, purses: { key: true }, battles }
 *   scene            "battle" (game/battle-scene)
 *   service          "battle" { start(battle, ctx, node) -> Promise<result> }   the story's battle command calls it
 *        battle: { opponent: trainerId } | { wild: { kind, level } }, with rules: [name] (schema section 9);
 *        also mode: 'ally' with ally: { name, look, team } (a double battle), twist: 'flawless', music: songKey
 *        result: { result, won, captured, lost, fled, wild, opponent }; also emitted as "battle:end"
 *   story.command    "ext:learn"   { ext: 'learn', spell }: the spell joins the wand's spells
 *   story.condition  "ext:spell"   { ext: 'spell', has: spellId }
 */

import { install as installScene, startBattle } from '../battle-scene/index.js';
import { BATTLE_SPELLS, normalizeSpellId } from '../battle/spells.js';
import { newMember, award, wandAward, wandPerks } from '../battle/growth.js';

export const WAND_SAVE = { level: 1, exp: 0, spells: [], loadout: [], spellXp: {}, spellMastery: {} };
export const KINDS_SAVE = { seen: [], bound: [], resting: [], boundOnce: false, purses: {}, battles: 0 };

function fromContent(game, key, find) {
  for (const folder of game.registry.all('content')) {
    const found = folder && folder[key] ? find(folder[key]) : null;
    if (found) return found;
  }
  return null;
}

/* what a thing does (content items `effect`), or null */
function effectOf(bag, id) {
  try {
    return (bag.book && typeof bag.book.effect === 'function' && bag.book.effect(id)) || null;
  } catch (error) {
    return null;
  }
}

function addOnce(list, value) {
  if (value != null && !list.includes(value)) list.push(value);
}

export function installBattles(game) {
  const { registry } = game;
  game.save.define('wand', WAND_SAVE);
  game.save.define('kinds', KINDS_SAVE);
  installScene(game);

  const items = () => registry.get('service', 'items');
  const kindOf = (key) => fromContent(game, 'kinds', (kinds) => (Array.isArray(kinds) ? kinds.find((kind) => kind.kind === key) : null));
  const elementOf = (key) => (kindOf(key) || {}).element;
  const trainerOf = (id) => fromContent(game, 'trainers', (list) => (Array.isArray(list) ? list.find((trainer) => trainer.id === id) : null));

  function setupOf(battle, ctx) {
    const state = game.save.state;
    const bag = items();
    const rules = [...(battle.rules || [])];
    const mana = state.mana || { mana: null, maxMana: 3 };
    const wand = state.wand;
    const spells = wand.spells.map(normalizeSpellId).filter((id) => BATTLE_SPELLS.includes(id));
    const setup = {
      party: bag ? bag.party.members() : [],
      wand: {
        mana: mana.mana, maxMana: mana.maxMana, level: wand.level, spells, loadout: wand.loadout,
        spellXp: wand.spellXp, spellMastery: wand.spellMastery, perks: wandPerks(wand.level),
      },
      /* the effect lets the battle know a thing by what it does (an earth treat), not by its id */
      items: bag ? bag.inventory.list().map((entry) => ({ id: entry.id, n: entry.n, effect: effectOf(bag, entry.id) })) : [],
      flags: { boundOnce: !!state.kinds.boundOnce },
    };
    let trainer = null;
    if (battle.opponent) {
      trainer = trainerOf(battle.opponent);
      if (!trainer) throw new Error(`no trainer "${battle.opponent}"`);
      rules.push(...(trainer.rules || []));
      setup.trainer = {
        name: ctx.text(trainer.name),
        key: trainer.look,
        team: (trainer.team || []).map((member) => ({
          spirit: member.kind, level: Math.max(1, Math.round(Number(ctx.value(member.level)) || 1)), stage: member.stage,
          phases: Array.isArray(member.phases) ? member.phases.map((phase) => ({ at: phase.at, say: phase.say ? ctx.text(phase.say) : '' })) : undefined,
        })),
        /* a caster duel's data (ring rule wandDuel) */
        wand: trainer.wand,
        lesson: trainer.lesson,
        ban: trainer.ban,
        /* the banner of a great school (schema: school is the banner { name, el, col, rule }) */
        school: trainer.school || (trainer.banner ? {
          name: ctx.text(trainer.banner.name), el: trainer.banner.element, col: trainer.banner.color,
          rule: trainer.banner.rule ? ctx.text(trainer.banner.rule) : '',
        } : undefined),
        noSwitch: rules.includes('noSwitch'),
        noCapture: rules.includes('noCapture'),
      };
    } else {
      const wild = battle.wild || {};
      setup.enemy = ctx.value(wild.kind) || undefined;
      setup.level = Math.max(0, Math.round(Number(ctx.value(wild.level === undefined ? battle.level : wild.level)) || 0)) || undefined;
    }
    /* a double battle beside someone (mode ally): their name, look and hontori (game/battle/ally.js) */
    if (battle.mode === 'ally' && battle.ally) {
      setup.mode = 'ally';
      setup.ally = {
        name: battle.ally.name ? ctx.text(battle.ally.name) : '',
        key: battle.ally.look,
        team: (battle.ally.team || []).map((member) => ({
          spirit: member.kind, level: Math.max(1, Math.round(Number(ctx.value(member.level)) || 1)), stage: member.stage,
        })),
      };
    }
    /* a drawing twist on the whole battle ('flawless'), from the command or a tournament round */
    if (typeof battle.twist === 'string') setup.twist = battle.twist;
    setup.noCapture = rules.includes('noCapture');
    /* a full party while the Council keeps the Sanctum sealed: a binding has nowhere to go */
    const sanctum = registry.get('service', 'sanctum');
    setup.noRoom = !!(sanctum && sanctum.sealed() && bag && bag.party.size() >= bag.party.max);
    setup.sureBind = rules.includes('sureBind');
    /* the ring rules among them (game/battle/ringRules.js) run in the battle */
    setup.rules = rules;
    return { setup, trainer, rules };
  }

  /* everything a finished battle changes, written once */
  function apply({ report, rewards }, trainer, rules, joins) {
    const state = game.save.state;
    const bag = items();
    const kinds = state.kinds;
    const members = bag ? bag.party.members() : [];
    (report.party || []).forEach((after, index) => {
      const member = members[index];
      if (!member || !after) return;
      if (after.hp != null) member.hp = Math.max(0, Math.min(member.maxHp || after.hp, after.hp));
      if (after.sta != null) member.sta = after.sta;
    });
    for (const [id, n] of Object.entries(report.itemsUsed || {})) if (bag && n > 0) bag.inventory.remove(id, n);
    for (const gain of (rewards && rewards.exp) || []) {
      const member = members[gain.index];
      if (member) award(member, gain.gain, elementOf(member.key));
    }
    for (const key of report.seen || []) addOnce(kinds.seen, key);
    if (report.bound && report.bound.key) {
      const key = report.bound.key;
      addOnce(kinds.seen, key);
      addOnce(kinds.bound, key);
      const member = newMember(key, report.bound.level || 1, elementOf(key));
      if (!joins || !bag || bag.party.add(member) !== 'party') kinds.resting.push(member);
    }
    if (report.boundOnce) kinds.boundOnce = true;
    if (report.countsAsBattle) kinds.battles += 1;

    /* the wand: mana left, spell practice, and its own EXP (a level raises the mana it holds) */
    const wand = state.wand;
    const mana = state.mana;
    Object.assign(wand.spellXp, report.spellXp);
    Object.assign(wand.spellMastery, report.spellMastery);
    const grown = { level: wand.level, exp: wand.exp, mana: report.mana, maxMana: mana ? mana.maxMana : 3 };
    wandAward(grown, (report.wandExp || 0) + ((rewards && rewards.wandExp) || 0));
    wand.level = grown.level;
    wand.exp = grown.exp;
    if (mana) {
      mana.maxMana = grown.maxMana;
      if (grown.mana != null) mana.mana = Math.max(0, Math.min(grown.maxMana, grown.mana));
    }

    const money = rewards && rewards.money;
    const table = fromContent(game, 'money', (m) => m) || {};
    if (bag && money && money.add) {
      kinds.purses[money.purseKey] = true;
      bag.earn(money.add, table.purse && table.purse.why);
    } else if (bag && money && money.lose) {
      const lost = bag.money.lose(money.lose);
      const why = table.wildLoss && table.wildLoss.why;
      if (lost && table.toastSpend) game.ui.toast(`${bag.text(table.toastSpend, { coins: bag.money.format(lost) })}  ${why ? bag.text(why) : ''}`.trim());
    }
    /* a practice duel leaves nobody hurt */
    if (trainer && rules.includes('practice') && bag) bag.party.heal('full', true);
    if (bag) bag.party.changed();
    game.save.commit();
  }

  registry.add('service', 'battle', {
    async start(battle, ctx) {
      const spec = battle || {};
      const { setup, trainer, rules } = setupOf(spec, ctx);
      const state = game.save.state;
      const bag = items();
      const size = bag ? bag.party.size() : 0;
      const joins = !!bag && size < bag.party.max;
      const world = ctx.story.world;
      const outcome = await startBattle(game, setup, {
        /* a battle may name its own tune (a tournament round: 'tournament', 'tournament_2' ...) */
        music: typeof spec.music === 'string' ? spec.music : undefined,
        /* the command may name the ground (a wild one met in tall grass); indoors is always indoors */
        biome: world && world.env.indoor ? 'indoor' : spec.biome || undefined,
        tutorial: !trainer && state.kinds.battles === 0,
        joinsParty: joins,
        rewards: (report) => ({
          partySize: size + (report && report.bound && joins ? 1 : 0),
          coins: bag ? bag.money.get() : 0,
          pursePaid: (key) => !!state.kinds.purses[key],
        }),
      });
      /* the screen was closed from outside: nothing happened */
      const report = (outcome && outcome.report) || { fled: true };
      if (outcome && outcome.report) apply(outcome, trainer, rules, joins);
      const result = {
        result: outcome ? outcome.result : 'fled',
        won: !!report.won || !!report.captured,
        captured: !!report.captured,
        fled: !!report.fled,
        lost: !!outcome && outcome.result === 'lost',
        wild: !trainer,
        opponent: trainer ? trainer.id : null,
      };
      game.bus.emit('battle:end', result);
      return result;
    },
  });

  registry.add('story.command', 'ext:learn', (node, ctx) => {
    const spell = normalizeSpellId(ctx.value(node.spell));
    const wand = game.save.state.wand;
    if (!spell || wand.spells.includes(spell)) return;
    wand.spells.push(spell);
    if (BATTLE_SPELLS.includes(spell) && wand.loadout.length && wand.loadout.length < 4) wand.loadout.push(spell);
    game.save.commit();
  });

  registry.add('story.condition', 'ext:spell', (node, ctx) => {
    const spell = normalizeSpellId(ctx.value(node.has));
    return game.save.state.wand.spells.includes(spell);
  });
}
