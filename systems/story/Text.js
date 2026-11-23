/*
 * Text.js
 * Job: every visible string by its text id (content/schema.md section 2). One flat table per
 * language; `{name}` placeholders are filled from params. A missing id shows the id itself, so a
 * gap is visible and never breaks a screen.
 *
 * Public API:
 *   new Text(table)               table: { id: string }
 *   has(id)
 *   get(id, params, resolve)      the string with its placeholders filled. params: { name: value };
 *                                 resolve(value) turns a param value into something printable
 *                                 (a text id is looked up, a number is shown as it is). Placeholders
 *                                 without a param are asked of resolve(name, true) (always-available
 *                                 names such as {player}); if that gives nothing they stay empty.
 *   missing                       Set of ids asked for but not found (the content checker reads it)
 */

const PLACEHOLDER = /\{([a-zA-Z0-9_.]+)\}/g;

export class Text {
  missing = new Set();

  #table;

  constructor(table = {}) {
    this.#table = table;
  }

  has(id) {
    return typeof id === 'string' && Object.prototype.hasOwnProperty.call(this.#table, id);
  }

  get(id, params, resolve) {
    if (id == null) return '';
    if (typeof id !== 'string') return String(id);
    let raw = this.#table[id];
    if (raw === undefined) {
      this.missing.add(id);
      raw = id;
    }
    if (raw.indexOf('{') < 0) return raw;
    return raw.replace(PLACEHOLDER, (all, name) => {
      if (params && Object.prototype.hasOwnProperty.call(params, name)) return this.#show(params[name], resolve, 0);
      const given = resolve ? resolve(name, true) : undefined;
      return given == null ? '' : String(given);
    });
  }

  /* a param is a text id, a number, or a value the caller resolves */
  #show(value, resolve, depth) {
    if (value == null || depth > 3) return '';
    if (typeof value === 'number') return String(Math.round(value * 100) / 100);
    if (typeof value === 'string') return this.has(value) && depth < 3 ? this.get(value, null, resolve) : value;
    if (typeof value !== 'object' || !resolve) return String(value);
    return this.#show(resolve(value, false), resolve, depth + 1);
  }
}
