/*
 * CloseUp.js  (engine: features)
 * Job: a close-up of something in the world (a board on a wall): a framed view over the dimmed world
 * with a close button. Also the story command that opens one. A board of pinned notes is built in;
 * a game registers any other close-up as a builder.
 *
 * Public API:
 *   class CloseUpScene            enter({ id, data, builder }); result: null when it is closed
 *   openCloseUp(game, id)         open the close-up of that id; a Promise that resolves when it closes
 *   installCloseUps(game)         registers "story.command" "open": { open: id }; the script waits
 *
 * Registry kinds it reads:
 *   closeup   id -> (frame, { game, data, text }) => void    fills the frame (a .ft-close element)
 *   content   folder key `screens`: { [id]: data }; data.notes: [{ title, text, color, x, y, tilt }]
 *             (text ids; x and y in % of the board) is shown as a board of pinned notes
 * It closes on its button, a tap on the dimmed world, Escape, Space or Enter.
 */

import { element } from '../../ui/dom.js';
import { closeButton } from '../../ui/Button.js';
import { ScreenScene, openScreen } from './ScreenScene.js';

function dataOf(game, id) {
  for (const folder of game.registry.all('content')) {
    const table = folder && folder.screens;
    if (table && table[id]) return table[id];
  }
  return null;
}

function textOf(game) {
  const story = game.registry.get('service', 'story');
  return (id, params) => {
    try {
      return story ? story.text(id, params) : String(id);
    } catch (error) {
      return String(id);
    }
  };
}

function play(game, name) {
  try {
    game.sound.play(name);
  } catch (error) {
    /* silent */
  }
}

/* pinned notes: tap one to read it larger */
function notesBoard(frame, { game, data, text }) {
  frame.classList.add('notes');
  const cork = element('div', 'cork', frame);
  for (const note of data.notes) {
    const paper = element('div', `note ${note.color || ''}`.trim(), cork);
    element('b', '', paper, text(note.title));
    element('span', '', paper, text(note.text));
    paper.style.left = `${note.x}%`;
    paper.style.top = `${note.y}%`;
    paper.style.transform = `rotate(${note.tilt || 0}deg)`;
    paper.addEventListener('click', (event) => {
      event.stopPropagation();
      const big = paper.classList.contains('big');
      for (const other of cork.querySelectorAll('.note')) other.classList.remove('big');
      if (!big) paper.classList.add('big');
      play(game, 'page');
    });
  }
}

export class CloseUpScene extends ScreenScene {
  overlay = true;
  frameRate = 8;

  constructor(game) {
    super(game, 'ft-dim');
  }

  build(root, { data, builder }) {
    const game = this.game;
    const wrap = element('div', 'ft-closewrap', root);
    const frame = element('div', 'ft-close', wrap);
    builder(frame, { game, data, text: textOf(game) });
    const close = closeButton(game.art, game.theme && game.theme.icons ? game.theme.icons.close : 'close', () => this.done(null));
    close.classList.add('ft-closex');
    wrap.appendChild(close);
    root.addEventListener('click', (event) => {
      if (event.target === root) this.done(null);
    });
    play(game, 'page');
  }

  onKey(event) {
    if (event.key !== 'Escape' && event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    this.done(null);
  }
}

export function openCloseUp(game, id) {
  const data = dataOf(game, id) || {};
  const builder = game.registry.get('closeup', id) || (Array.isArray(data.notes) ? notesBoard : null);
  if (!builder) return null;
  return openScreen(game, new CloseUpScene(game), { id, data, builder });
}

export function installCloseUps(game) {
  let told = false;
  game.registry.add('story.command', 'open', async (node) => {
    const opened = openCloseUp(game, node.open);
    if (opened) {
      await opened;
      return;
    }
    if (!told) console.warn(`Story: there is no close-up "${node.open}"`);
    told = true;
  });
}
