/*
 * check.hontori.mjs
 * Job: the Hontori extensions for the content checker (schema.md section 14). check.mjs stays generic and hands
 * every { ext } use, battle rule, test type and award rule to this module. Lives in the game layer; once
 * game/ registers the same extensions at run time; the declarations it reads are content/shared/extensions.js.
 *
 * Public API: hontoriExtensions(ctx, shared) -> { check(kind, use, where) }
 */

export function hontoriExtensions(ctx, shared) {
  const { R, bad } = ctx;
  const decl = shared.extensions;
  const elements = new Set(decl.elements);
  const types = {
    spell: (v) => !!R.spells[v], element: (v) => elements.has(v), kind: (v) => !!R.kinds[v], person: (v) => !!R.people[v],
    trainer: (v) => !!R.trainers[v], text: (v) => R.text[v] !== undefined, number: (v) => typeof v === 'number', string: (v) => typeof v === 'string',
    compare: (v) => v && typeof v === 'object' && Object.keys(v).every((k) => ['eq', 'ne', 'gt', 'gte', 'lt', 'lte'].includes(k)),
  };
  function args(spec, use, where, name) {
    const known = new Set(['ext', 'type', 'then', 'else', 'intro', 'ask', 'wrong', 'fail', 'pass', 'text', 'stage', 'options', 'script', 'done', 'rules', 'who', 'params']);
    for (const a of spec.args) {
      const [key, type] = a.replace('?', '').split(':');
      known.add(key);
      const v = use[key];
      if (v === undefined) { if (!a.includes('?')) bad(where, `${name} needs "${key}"`); continue; }
      if (v && typeof v === 'object' && v.var) continue;
      if (type && types[type] && !types[type](v)) bad(where, `${name}: "${key}" is not a valid ${type} (${JSON.stringify(v)})`);
    }
    for (const k of Object.keys(use)) if (!known.has(k)) bad(where, `${name}: unknown option "${k}"`);
  }
  return {
    check(kind, use, where) {
      if (kind === 'battleRule') { if (!decl.battleRule.includes(use)) bad(where, `unknown battle rule "${use}"`); return; }
      const table = decl[kind];
      const name = kind === 'testType' || kind === 'awardRule' ? use.type : use.ext;
      if (!table || !table[name]) return bad(where, `unknown ${kind} extension "${name}"`);
      args(table[name], use, where, name);
    },
  };
}
