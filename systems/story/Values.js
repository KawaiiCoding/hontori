/*
 * Values.js
 * Job: the values the story system itself works out (content/schema.md section 5). A value is a
 * plain number, string or boolean, or an object whose first key with a handler says how to work it out.
 *
 * Public API:
 *   VALUES        { key: (value, ctx, story) => any }   registered as "story.value"
 *   FALLBACK_VALUES   used only while no other system has registered that key: { coins: v } shows
 *                     the number; { price } and { item } are unknown (null)
 *   typeName(type)    a readable name for a prop type id ('market_stall' -> 'market stall')
 */

export function typeName(type) {
  return String(type || '').replace(/_/g, ' ').replace(/\d+$/, '').trim();
}

export const VALUES = {
  var: (value, ctx, story) => story.readVar(ctx, value.var),

  pick(value, ctx, story) {
    for (const [cond, result] of value.pick) if (story.test(cond, ctx)) return story.value(result, ctx);
    return story.value(value.else, ctx);
  },

  add: (value, ctx, story) => value.add.reduce((sum, v) => sum + (Number(story.value(v, ctx)) || 0), 0),
  max: (value, ctx, story) => Math.max(...value.max.map((v) => Number(story.value(v, ctx)) || 0)),
  min: (value, ctx, story) => Math.min(...value.min.map((v) => Number(story.value(v, ctx)) || 0)),

  /* the hour of the world as a clock shows it: { clock: true } -> '9:05' */
  clock(value, ctx, story) {
    const world = story.world;
    if (!world) return '';
    const minutes = Math.floor((((world.env.time % 24) + 24) % 24) * 60);
    const m = minutes % 60;
    return `${Math.floor(minutes / 60)}:${m < 10 ? '0' : ''}${m}`;
  },

  /* a field of the prop or person being used: { obj: 'typeName' } */
  obj: (value, ctx) => (ctx.obj ? ctx.obj[value.obj] : undefined),
};

export const FALLBACK_VALUES = {
  coins: (value, ctx, story) => story.value(value.coins, ctx),
  price: () => null,
  item: () => null,
};
