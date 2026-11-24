/*
 * Standings.js  (engine: features)
 * Job: the board shown between the rounds of a run of battles (a tournament): a card with a title, one line under
 * it (what comes next), one row per entrant with a face, a name and where they stand (still in, out in some
 * round, your next match, you), and one button to go on. It decides nothing: the rows come from the caller.
 *
 * Public API:
 *   class StandingsScene     enter({ title, sub, rows: [{ name, note, portrait (a canvas or null), state: 'in' |
 *                            'out' | 'next' | 'you' }], go })   result: true once the button is pressed
 *   showStandings(game, options)   open it; a Promise that resolves when it is left
 */

import { element } from '../../ui/dom.js';
import { Button } from '../../ui/Button.js';
import { ScreenScene, openScreen } from './ScreenScene.js';

const FACE = 40;

export class StandingsScene extends ScreenScene {
  overlay = true;
  frameRate = 8;

  constructor(game) {
    super(game, 'ft-dim');
  }

  build(root, { title = '', sub = '', rows = [], go = 'OK' }) {
    const card = element('div', 'ft-card ft-board', root);
    element('h2', '', card, title);
    if (sub) element('p', '', card, sub);
    const list = element('div', 'rows', card);
    for (const row of Array.isArray(rows) ? rows : []) {
      const line = element('div', `row s-${row.state || 'in'}`, list);
      const face = element('canvas', '', line);
      face.width = FACE;
      face.height = FACE;
      try {
        const g = face.getContext('2d');
        g.imageSmoothingEnabled = false;
        if (row.portrait) g.drawImage(row.portrait, 0, 0, FACE, FACE);
      } catch (error) {
        /* no face: the name still shows */
      }
      element('b', '', line, row.name || '');
      element('small', '', line, row.note || '');
    }
    const button = new Button(this.game.art, { label: go, kind: 'gold', wide: true, onPress: () => this.done(true) });
    card.appendChild(button.element);
  }

  onKey(event) {
    if (event.key === 'Enter' || event.key === ' ') this.done(true);
  }
}

export function showStandings(game, options) {
  return openScreen(game, new StandingsScene(game), options);
}
