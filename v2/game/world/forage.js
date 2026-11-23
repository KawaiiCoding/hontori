/*
 * game/world/forage.js
 * Job: the story command `forage` (content/schema.md sections 6 and 11, src/money.js): a bush, rock,
 * log or tree may hide something. Each spot is tried once a day (a mark on the thing); about one in
 * three hides something that day (more with the luck item), the same answer however often it is
 * asked. The find goes into the bag quietly, the player says what it is, a toast names it, and the
 * companion sometimes answers in rhyme. The first find shows the trade pouch card.
 * When nothing is found the command acts as `pass`, so the thing's next handler runs.
 *
 * Public API:
 *   forageCommand(game)   -> (node, ctx) handler for story command "forage" { forage: tableId }
 */

import { PASS } from '../../systems/story/Commands.js';
import { folders } from './common.js';

const MARK = 'forage';
const HUNDRED = 100;
const DAY_MIX = 2654435761;

function table(game) {
  for (const folder of folders(game)) if (folder && folder.forage && folder.forage.tables) return folder.forage;
  return null;
}

function hash(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return h;
}

export function forageCommand(game) {
  return (node, ctx) => {
    const forage = table(game);
    const story = ctx.story;
    const kind = ctx.value(node.forage);
    const list = forage && forage.tables[kind];
    const target = ctx.target;
    if (!list || !list.length || !target || target.x == null) return PASS;
    if (forage.needs != null && !ctx.test(forage.needs)) return PASS;
    const day = story.today();
    if (story.markValue(ctx, MARK) === day) return PASS;
    story.setMark(ctx, MARK, day);
    const key = `${target.map}:${kind}:${target.x},${target.y}`;
    const h = hash(key);
    const luck = forage.luck && ctx.test({ has: forage.luck.has }) ? forage.luck.add || 0 : 0;
    const chance = (forage.chance ?? 0.35) + luck;
    if (((h ^ Math.imul(day, DAY_MIX)) >>> 0) % HUNDRED >= Math.round(chance * HUNDRED)) return PASS;
    const id = list[((h >>> 3) + day) % list.length];
    const items = game.registry.get('service', 'items');
    const item = items && items.book ? items.book.get(id) : null;
    const lines = (forage.lines || {})[id] || {};
    const said = [{ give: id, quiet: true }, { sound: 'pickup' }, { fx: 'sparkle', n: 8, dy: -6 }];
    if (forage.helper) said.push({ helper: forage.helper.id, title: forage.helper.title, text: forage.helper.text, icon: forage.helper.icon });
    if (lines.kid) said.push({ say: lines.kid, who: 'kid' });
    if (forage.found && item) said.push({ toast: forage.found, params: { item: item.name } });
    if (lines.companion) {
      said.push({ if: { all: [{ companion: true }, { chance: forage.companionChance ?? 0.5 }] }, then: [{ say: lines.companion, who: 'companion' }] });
    }
    return ctx.run(said).then(() => undefined);
  };
}
