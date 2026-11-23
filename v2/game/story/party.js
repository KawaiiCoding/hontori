/*
 * party.js  (Hontori: story)
 * Job: what Hontori's story asks about the party of hontori, answered from the items system's
 * party (registry "service" "items"): the lead's name and kind for the dialog, the extensions
 * that add a hontori and read the lead's level and stage, and the rule that the companion walks
 * beside the player only once a hontori has joined.
 *
 * Public API:
 *   installParty(game)   after the story and items systems are installed, before game.start()
 *
 * What it registers (every handler is (node, ctx)):
 *   story.value      "companion"       the lead's given name, else the name of its kind and stage
 *                    "leadKind"        the lead's kind (null without a party)
 *                    "ext:leadLevel"   { ext: 'leadLevel', add, min, none }: max(min, lead level + add);
 *                                      `none` while the party is empty
 *   story.condition  "ext:lead"        { ext: 'lead', stage: { gte: 3 }, level: { ... } }
 *   story.command    "ext:addHontori"  { ext: 'addHontori', kind, level }: the hontori joins the party
 *   system           "companion-rule"  shows the world's companion while the party has a lead, as its kind
 */

import { compare } from '../../systems/story/Conditions.js';
import { newMember } from '../battle/growth.js';

function partyOf(game) {
  const items = game.registry.get('service', 'items');
  return items && items.party ? items.party : null;
}

function leadOf(game) {
  const party = partyOf(game);
  try {
    return party ? party.lead() : null;
  } catch (error) {
    return null;
  }
}

function kindOf(game, key) {
  for (const folder of game.registry.all('content')) {
    const found = Array.isArray(folder.kinds) ? folder.kinds.find((kind) => kind.kind === key) : null;
    if (found) return found;
  }
  return null;
}

class CompanionRule {
  #game = null;
  #world = null;

  start(game) {
    this.#game = game;
    game.bus.on('map:enter', ({ scene }) => {
      this.#world = scene;
      this.#apply(true);
    });
    game.bus.on('party:change', () => this.#apply(false));
  }

  /* entering a map hides a companion nobody has met yet; a hontori that joins shows it */
  #apply(entering) {
    const world = this.#world;
    const companion = world && world.companion;
    if (!companion) return;
    const lead = leadOf(this.#game);
    if (lead && lead.key) companion.key = lead.key;
    if (lead && !companion.visible) {
      companion.visible = true;
      companion.joinAt(world.player.x + 14, world.player.y);
    } else if (!lead && entering) companion.visible = false;
  }
}

export function installParty(game) {
  const { registry } = game;

  registry.add('story.value', 'leadKind', () => {
    const lead = leadOf(game);
    return lead ? lead.key : null;
  });

  registry.add('story.value', 'companion', (node, ctx) => {
    const lead = leadOf(game);
    if (lead && lead.nick) return String(lead.nick);
    const key = (lead && lead.key) || (game.config.companion && game.config.companion.key);
    const kind = kindOf(game, key);
    const stage = kind && kind.stages ? kind.stages[Math.max(0, ((lead && lead.stage) || 1) - 1)] || kind.stages[0] : null;
    return stage ? ctx.text(stage.name) : undefined;
  });

  registry.add('story.value', 'ext:leadLevel', (node, ctx) => {
    const lead = leadOf(game);
    if (!lead) return node.none == null ? 1 : Number(ctx.value(node.none));
    const level = (Number(lead.level) || 1) + (Number(ctx.value(node.add)) || 0);
    return Math.max(node.min == null ? 1 : Number(ctx.value(node.min)) || 1, level);
  });

  registry.add('story.condition', 'ext:lead', (node, ctx) => {
    const lead = leadOf(game);
    if (!lead) return false;
    for (const field of ['stage', 'level']) {
      if (field in node && !compare(Number(lead[field]) || 1, node[field], (v) => ctx.value(v))) return false;
    }
    return true;
  });

  registry.add('story.command', 'ext:addHontori', (node, ctx) => {
    const party = partyOf(game);
    const key = ctx.value(node.kind);
    const kind = kindOf(game, key);
    if (!party || !kind) {
      console.warn(`Story: no hontori "${key}" can join`);
      return;
    }
    party.add(newMember(key, Number(ctx.value(node.level)) || 1, kind.element));
    game.save.commit();
  });

  registry.add('system', 'companion-rule', new CompanionRule());
}
