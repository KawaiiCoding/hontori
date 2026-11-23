/*
 * links.js  (engine: time)
 * Job: the few guarded ways the time lane reaches other lanes: registering a command, a
 * condition or a value with the story runner, testing a condition, looking up a text, and reading the
 * loaded content folders. Every call is guarded, so time keeps working when a lane is missing.
 *
 * Public API:
 *   offer(registry, kind, id, value)    register unless (kind, id) is taken; true if registered
 *   testCondition(game, cond, ctx)      ctx.test, else registry "service" "story".test, else
 *                                       true for no condition and false for any other
 *   lookupText(game, id, params, ctx)   ctx.text, else registry "service" "story".text, else the text
 *                                       tables of the content folders, else the id itself
 *   contentFolders(game)                registry kind "content" values, in load order
 */

const warned = new Set();

function warnOnce(key, message, error) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(message, error || '');
}

export function offer(registry, kind, id, value) {
  if (registry.has(kind, id)) {
    warnOnce(`${kind}:${id}`, `time: ${kind} "${id}" is already registered; keeping the other one`);
    return false;
  }
  registry.add(kind, id, value);
  return true;
}

export function testCondition(game, cond, ctx) {
  if (cond == null) return true;
  try {
    if (ctx && typeof ctx.test === 'function') return !!ctx.test(cond);
    const service = game.registry.get('service', 'story');
    if (service && typeof service.test === 'function') return !!service.test(cond);
  } catch (error) {
    warnOnce('test-failed', 'time: a condition test failed', error);
    return false;
  }
  warnOnce('no-tester', 'time: no condition service is registered; conditional rules are skipped');
  return false;
}

export function contentFolders(game) {
  return [...game.registry.all('content')];
}

function fill(text, params) {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name) => (params[name] != null ? String(params[name]) : whole));
}

export function lookupText(game, id, params, ctx) {
  if (id == null) return '';
  try {
    if (ctx && typeof ctx.text === 'function') return ctx.text(id, params);
    const service = game.registry.get('service', 'story');
    if (service && typeof service.text === 'function' && service.strings) return service.text(id, params);
    for (const folder of contentFolders(game)) {
      const table = folder && folder.text;
      if (table && typeof table[id] === 'string') return fill(table[id], params);
    }
  } catch (error) {
    warnOnce('text-failed', 'time: a text lookup failed', error);
  }
  return fill(String(id), params);
}
