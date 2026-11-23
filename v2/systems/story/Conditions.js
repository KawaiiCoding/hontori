/*
 * Conditions.js
 * Job: the conditions the story system itself answers (content/schema.md section 4) and the one
 * comparison rule every condition shares. Conditions about things other systems own (the bag, coins,
 * quests, the party) are registered by those systems under the same registry kind.
 *
 * Public API:
 *   compare(actual, spec, value)   spec: a plain value (equal) or { eq, ne, gt, gte, lt, lte } (all must
 *                                  hold); value(v) resolves a schema value inside the spec
 *   isComparison(object)           true if the object is a { eq, gt, ... } spec
 *   CONDITIONS                     { key: (cond, ctx) => boolean } registered as "story.condition"
 *                                  (flag all any not atLeast hour weather indoor map area var mark obj tile chance battle)
 *   FALLBACK_CONDITIONS            used only while no other system registered that key:
 *                                  { companion: true } holds while a companion is shown in the world
 *
 * A condition handler is found by the first key of the condition object that has a handler
 * (`{ var: 'x', gt: 1 }` is answered by `var`); `{ ext: name }` is answered by "ext:<name>".
 */

const OPERATORS = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte'];

export function isComparison(spec) {
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) return false;
  return OPERATORS.some((name) => name in spec);
}

export function compare(actual, spec, value = (v) => v) {
  if (!isComparison(spec)) return actual === value(spec);
  for (const name of OPERATORS) {
    if (!(name in spec)) continue;
    const wanted = value(spec[name]);
    let holds;
    if (name === 'eq') holds = actual === wanted;
    else if (name === 'ne') holds = actual !== wanted;
    else if (name === 'gt') holds = actual > wanted;
    else if (name === 'gte') holds = actual >= wanted;
    else if (name === 'lt') holds = actual < wanted;
    else holds = actual <= wanted;
    if (!holds) return false;
  }
  return true;
}

/* { var: 'best', gt: 3 } keeps its operators beside the subject */
function operatorsOf(cond) {
  const spec = {};
  for (const name of OPERATORS) if (name in cond) spec[name] = cond[name];
  return spec;
}

function inHours(hour, [from, to]) {
  return from <= to ? hour >= from && hour < to : hour >= from || hour < to;
}

function inRange(n, range) {
  if (Array.isArray(range)) return n >= range[0] && n <= range[1];
  return n === range;
}

export const CONDITIONS = {
  flag(cond, ctx, story) {
    const name = cond.flag;
    if (!('is' in cond)) return story.flag(name);
    const wanted = cond.is === 'today' ? story.today() : story.value(cond.is, ctx);
    return story.flagValue(name) === wanted;
  },

  all: (cond, ctx, story) => cond.all.every((c) => story.test(c, ctx)),
  any: (cond, ctx, story) => cond.any.some((c) => story.test(c, ctx)),
  not: (cond, ctx, story) => !story.test(cond.not, ctx),
  atLeast(cond, ctx, story) {
    let count = 0;
    for (const c of cond.of || []) if (story.test(c, ctx)) count++;
    return count >= story.value(cond.atLeast, ctx);
  },

  hour(cond, ctx, story) {
    const world = story.world;
    return !!world && inHours(world.env.time, cond.hour);
  },
  weather(cond, ctx, story) {
    const world = story.world;
    return !!world && world.env.weather === cond.weather;
  },
  indoor(cond, ctx, story) {
    const world = story.world;
    return !!world && !!world.env.indoor === !!cond.indoor;
  },
  map(cond, ctx, story) {
    const world = story.world;
    return !!world && world.map.id === cond.map;
  },
  area(cond, ctx, story) {
    const world = story.world;
    const box = cond.area;
    if (!world || (box.map && world.map.id !== box.map)) return false;
    return inRange(world.player.tx, box.x) && inRange(world.player.ty, box.y);
  },

  var(cond, ctx, story) {
    const actual = story.readVar(ctx, cond.var);
    const spec = operatorsOf(cond);
    return Object.keys(spec).length ? compare(actual, spec, (v) => story.value(v, ctx)) : !!actual;
  },

  mark(cond, ctx, story) {
    const stored = story.markValue(ctx, cond.mark);
    if (!('is' in cond)) return stored != null && stored !== false;
    const wanted = cond.is === 'today' ? story.today() : story.value(cond.is, ctx);
    return stored === wanted;
  },

  /* a field of the prop or person being used: { obj: { element: 'water' } }; { obj: { has: 'text' } }: it has that field */
  obj(cond, ctx) {
    const facts = ctx.obj || {};
    return Object.entries(cond.obj).every(([field, wanted]) => (
      field === 'has' ? facts[wanted] != null && facts[wanted] !== false : compare(facts[field], wanted)
    ));
  },

  /* the tile the player stands on is one of these: { tile: ['grass', 'flowers'] } */
  tile(cond, ctx, story) {
    const world = story.world;
    if (!world) return false;
    const under = world.map.tileAt(world.player.tx, world.player.ty);
    return Array.isArray(cond.tile) ? cond.tile.includes(under) : cond.tile === under;
  },

  chance: (cond, ctx, story) => Math.random() < story.value(cond.chance, ctx),

  /* the last battle's result, inside battleEnd events and battle branches */
  battle(cond, ctx) {
    const result = ctx.battle;
    if (!result) return false;
    return Object.entries(cond.battle).every(([field, wanted]) => compare(!!result[field], wanted));
  },
};

export const FALLBACK_CONDITIONS = {
  companion(cond, ctx, story) {
    const world = story.world;
    const walking = !!(world && world.companion && world.companion.visible);
    return walking === !!cond.companion;
  },
};
