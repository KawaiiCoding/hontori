/*
 * content.js
 * Job: hand Hontori's content folders to the engine, in load order (content/schema.md section 1:
 * shared, prologue, ch1, ch2, ch3, ch4, ch5, ch6, ch7), as registry kind "content". Any system that reads content takes it
 * from there; a new chapter is one more import and one more entry in FOLDERS.
 *
 * Public API:
 *   registerContent(game)   add every folder that is not registered yet
 *   FOLDERS                 the folders in load order
 */

import shared from '../../content/shared/index.js';
import prologue from '../../content/prologue/index.js';
import ch1 from '../../content/ch1/index.js';
import ch2 from '../../content/ch2/index.js';
import ch3 from '../../content/ch3/index.js';
import ch4 from '../../content/ch4/index.js';
import ch5 from '../../content/ch5/index.js';
import ch6 from '../../content/ch6/index.js';
import ch7 from '../../content/ch7/index.js';

export const FOLDERS = [shared, prologue, ch1, ch2, ch3, ch4, ch5, ch6, ch7];

export function registerContent(game) {
  for (const folder of FOLDERS) {
    if (!game.registry.has('content', folder.id)) game.registry.add('content', folder.id, folder);
  }
}
