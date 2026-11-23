/*
 * bridge.js  (engine: items)
 * Job: the few things the items system asks of other systems, each guarded so items still work
 * when that system is missing or throws (CLAUDE.md rule 4).
 *
 * Public API:
 *   makeText(game, table)        (id, params) => string: game.text(id, params) when the Text system
 *                                exists, else the content table with {name} filled; an unknown id is shown as given
 *   storyOf(game)                the story runner: registry "service" "story" (else game.story)
 *   test(game, cond, ctx)        the story's condition check (false without a story)
 *   run(game, script, ctx)       run commands through the story (a Promise; resolves at once without one)
 *   value(ctx, v)                a value through the running script (ctx.value), else v itself
 *   helper(game, def)            the once-only first-touch card, when the story offers one
 */

export function makeText(game, table) {
  return (id, params) => {
    if (typeof game.text === 'function') {
      try {
        const out = game.text(id, params);
        if (typeof out === 'string') return out;
      } catch (error) {
        console.warn('items: text lookup failed', error);
      }
    }
    const raw = typeof id === 'string' && Object.prototype.hasOwnProperty.call(table, id) ? table[id] : id;
    if (typeof raw !== 'string') return '';
    return raw.replace(/\{(\w+)\}/g, (all, name) => (params && params[name] != null ? String(params[name]) : all));
  };
}

export function storyOf(game) {
  return game.registry.get('service', 'story') || game.story || null;
}

export function test(game, cond, ctx) {
  if (cond == null) return true;
  const story = storyOf(game);
  if (!story || typeof story.test !== 'function') return false;
  try {
    return !!story.test(cond, ctx);
  } catch (error) {
    console.warn('items: a condition failed', error);
    return false;
  }
}

export function run(game, script, ctx) {
  const story = storyOf(game);
  if (!Array.isArray(script) || !script.length || !story || typeof story.run !== 'function') return Promise.resolve();
  try {
    return Promise.resolve(story.run(script, ctx)).catch((error) => console.warn('items: a script failed', error));
  } catch (error) {
    console.warn('items: a script failed', error);
    return Promise.resolve();
  }
}

export function value(ctx, v) {
  if (ctx && typeof ctx.value === 'function') {
    try {
      return ctx.value(v);
    } catch (error) {
      console.warn('items: a value failed', error);
    }
  }
  return v;
}

export function helper(game, def) {
  const story = storyOf(game);
  if (!def || !story || typeof story.helper !== 'function') return;
  try {
    story.helper(def);
  } catch (error) {
    console.warn('items: helper failed', error);
  }
}
