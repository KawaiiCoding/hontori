/*
 * Assets.js
 * Job: a bounded store of offscreen pictures ("sheets") that are painted on first need and
 * then only copied. Sheets that have not been used for the longest time are released first,
 * and their canvases are reused, so the render path creates no canvases once it is warm.
 *
 * Public API:
 *   new Assets(newSheet, limit)   newSheet(width, height, opaque) -> { canvas, ctx } (Screen.newSheet)
 *   sheet(key, width, height, opaque)   -> { canvas, ctx, width, height, blank }
 *        Returns the sheet for that key and marks it as just used. `blank` is true when the
 *        caller must paint it (first use, or it was released meanwhile); the caller sets it to
 *        false after painting. Sizes are logical pixels.
 *   size                          how many sheets are held
 *
 * Whether actors belong here depends on the game's art provider. A provider whose painters
 * already cache every frame they produce gains nothing from a second cache (see INTERFACES.md).
 */

const SPARE_LIMIT = 16;

export class Assets {
  #newSheet;
  #limit;
  #sheets = new Map();
  #spare = [];

  constructor(newSheet, limit = 96) {
    this.#newSheet = newSheet;
    this.#limit = limit;
  }

  get size() {
    return this.#sheets.size;
  }

  sheet(key, width, height, opaque = false) {
    let sheet = this.#sheets.get(key);
    if (sheet) {
      /* a Map keeps insertion order: re-inserting marks this sheet as the most recently used */
      this.#sheets.delete(key);
    } else {
      sheet = this.#take(width, height, opaque);
      if (this.#sheets.size >= this.#limit) this.#releaseOldest();
    }
    this.#sheets.set(key, sheet);
    return sheet;
  }

  #take(width, height, opaque) {
    const i = this.#spare.findIndex((s) => s.width === width && s.height === height && s.opaque === opaque);
    if (i >= 0) {
      const [sheet] = this.#spare.splice(i, 1);
      sheet.blank = true;
      return sheet;
    }
    const { canvas, ctx } = this.#newSheet(width, height, opaque);
    return { canvas, ctx, width, height, opaque, blank: true };
  }

  #releaseOldest() {
    const [key, sheet] = this.#sheets.entries().next().value;
    this.#sheets.delete(key);
    if (this.#spare.length < SPARE_LIMIT) this.#spare.push(sheet);
  }
}
