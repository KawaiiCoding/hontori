/*
 * commands.js  (engine: items)
 * Job: the story commands, conditions and values the items system answers (content/schema.md
 * sections 4 to 6), registered for the story runner through the Registry.
 *
 * Public API:
 *   registerCommands(game, items)
 *
 * Registry kinds it adds to (the story lane runs them); every handler is (node, ctx):
 *   "story.command"    id: the verb   value: (node, ctx) => undefined | Promise
 *        give, take, find, money, spend, shop, heal
 *   "story.condition"  id: the key    value: (node, ctx) => boolean
 *        has, owns, coins, party ({ hurt, size, named })
 *   "story.value"      id: the key    value: (node, ctx) => number | string
 *        price, coins, item ({ item: id | variable name, field })
 *   ctx (from the story runner): value(v) resolves a value; vars holds the script's variables;
 *   run(commands) runs a branch (a Promise); target is what is being used ({ kind, id, person, ... }).
 *
 * Events it listens to: "time:rest" (a night's rest heals the party, then "party:rested" is emitted:
 * what only rest refills listens to that one event), "battle:after" { how: 'wake' | 'restore' }.
 */

import { value as resolve } from './bridge.js';

const COMPARE = {
  eq: (a, b) => a === b, ne: (a, b) => a !== b, gt: (a, b) => a > b,
  gte: (a, b) => a >= b, lt: (a, b) => a < b, lte: (a, b) => a <= b,
};

/* { gte: 10 } against a number; a bare number means "at least" */
export function compare(actual, rule, ctx) {
  if (typeof rule === 'number') return actual >= rule;
  if (!rule || typeof rule !== 'object') return false;
  return Object.keys(COMPARE).every((op) => !(op in rule) || COMPARE[op](actual, Number(resolve(ctx, rule[op]))));
}

function branch(ctx, list) {
  if (!Array.isArray(list) || !list.length || !ctx || typeof ctx.run !== 'function') return undefined;
  return ctx.run(list);
}

function what(ctx, raw) {
  const v = resolve(ctx, raw);
  if (v && typeof v === 'object' && typeof v.tag === 'string') return { tag: v.tag };
  if (v && typeof v === 'object' && typeof v.id === 'string') return v.id;
  return typeof v === 'string' ? v : null;
}

function itemVar(items, entry) {
  if (!entry) return null;
  const def = items.book.get(entry.id) || {};
  return { ...def, ...entry, name: items.name(entry.id), value: items.book.sellValue(entry.id) };
}

function setVar(ctx, name, val) {
  if (!name || !ctx) return;
  if (!ctx.vars) ctx.vars = {};
  ctx.vars[name] = val;
}

export function registerCommands(game, items) {
  const r = game.registry;

  r.add('story.command', 'give', (cmd, ctx) => {
    const id = what(ctx, cmd.give);
    const n = Math.max(1, Number(resolve(ctx, cmd.n)) || 1);
    if (typeof id === 'string') items.give(id, n, !!cmd.quiet);
  });

  r.add('story.command', 'take', (cmd, ctx) => {
    const thing = what(ctx, cmd.take);
    const n = Math.max(1, Number(resolve(ctx, cmd.n)) || 1);
    const before = thing ? items.inventory.find(thing) : null;
    const kept = before ? { ...before } : null;
    const taken = thing ? items.take(thing, n) : null;
    setVar(ctx, cmd.as, taken ? itemVar(items, { ...kept, n: taken.n }) : null);
  });

  r.add('story.command', 'find', (cmd, ctx) => {
    const thing = what(ctx, cmd.find);
    setVar(ctx, cmd.as, thing ? itemVar(items, items.inventory.find(thing)) : null);
  });

  r.add('story.command', 'money', (cmd, ctx) => {
    const n = Math.floor(Number(resolve(ctx, cmd.money)) || 0);
    if (n > 0) items.earn(n, cmd.why === undefined ? '' : cmd.why);
    else if (n < 0) {
      items.money.lose(-n);
      items.save();
    }
  });

  r.add('story.command', 'spend', (cmd, ctx) => {
    const n = Math.max(0, Math.floor(Number(resolve(ctx, cmd.spend)) || 0));
    return branch(ctx, items.pay(n) ? cmd.ok : cmd.fail);
  });

  r.add('story.command', 'shop', (cmd, ctx) => {
    let id = resolve(ctx, cmd.shop);
    if (id === 'self') {
      const target = (ctx && ctx.target) || {};
      const person = target.person;
      const keeper = target.id || (person && (person.def ? person.def.id : person.id));
      const shop = keeper ? items.book.shopOfKeeper(keeper) : null;
      id = shop ? shop.id : null;
    }
    return openShop(game, items, id);
  });

  r.add('story.command', 'heal', (cmd) => {
    const how = cmd.heal || {};
    items.party.heal(how.hp == null ? 'full' : how.hp, !!how.rest);
    if (how.rest) game.bus.emit('party:rested', {});
    items.save();
  });

  /* every rest is a full night: health and stamina come back, then what only rest refills */
  game.bus.on('time:rest', () => {
    items.party.heal('full', true);
    game.bus.emit('party:rested', {});
  });

  game.bus.on('battle:after', ({ how } = {}) => {
    if (how === 'restore') items.party.heal('full', true);
    else if (how === 'wake') {
      for (const member of items.party.members()) if (member.hp != null && member.hp <= 0) member.hp = 1;
      items.party.changed();
    } else return;
    items.save();
  });

  r.add('story.condition', 'has', (cond, ctx) => {
    const thing = what(ctx, cond.has);
    return !!thing && !!items.inventory.find(thing);
  });

  r.add('story.condition', 'owns', (cond, ctx) => {
    const thing = what(ctx, cond.owns);
    const entry = thing ? items.inventory.find(thing) : null;
    const n = cond.n == null ? 1 : Number(resolve(ctx, cond.n));
    return !!entry && (entry.n | 0) >= n;
  });

  r.add('story.condition', 'coins', (cond, ctx) => compare(items.money.get(), cond.coins, ctx));

  r.add('story.condition', 'party', (cond, ctx) => {
    const rule = cond.party || {};
    if ('hurt' in rule && items.party.hurt() !== !!rule.hurt) return false;
    if ('size' in rule && !compare(items.party.size(), rule.size, ctx)) return false;
    if ('named' in rule) {
      const lead = items.party.lead();
      if (!!(lead && lead.nick) !== !!rule.named) return false;
    }
    return true;
  });

  r.add('story.value', 'price', (v) => items.book.price(v.price));

  /* a field of an item: one stored in a variable by take or find, else the item of that id */
  r.add('story.value', 'item', (v, ctx) => {
    const held = ctx && ctx.vars && typeof v.item === 'string' ? ctx.vars[v.item] : null;
    const found = held && typeof held === 'object' ? held : itemVar(items, items.book.get(v.item) ? { id: v.item, n: 0 } : null);
    return found ? found[v.field || 'name'] : null;
  });

  r.add('story.value', 'coins', (v, ctx) => items.money.format(Number(resolve(ctx, v.coins)) || 0));
}

/* the shop panel; the Promise resolves when the player leaves it */
export function openShop(game, items, shopId) {
  if (!shopId || !items.book.shop(shopId)) {
    console.warn(`items: no shop "${shopId}"`);
    return Promise.resolve();
  }
  return new Promise((done) => {
    try {
      game.registry.get('panel', 'shop').show(shopId);
      game.ui.openPanel('shop');
    } catch (error) {
      console.warn('items: the shop failed to open', error);
      done();
      return;
    }
    const opened = game.scenes.top;
    const off = game.bus.on('scene:change', ({ top }) => {
      if (top === opened) return;
      off();
      done();
    });
  });
}
