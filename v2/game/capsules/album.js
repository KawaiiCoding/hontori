/*
 * album.js  (Hontori: capsules)
 * Job: the Capsule Album: a live picture of the lead hontori wearing what is chosen, then every series as a
 * grid of its prizes (an unknown one shows a quiet "?"). A tap on an owned prize wears it or takes it off (a
 * keepsake is set out in the kid's room or put away), and the picture changes at once. The Menu shows a row
 * that opens the album once the first prize is owned.
 *
 * Public API:
 *   installAlbum(game, { rules, prizes, words, text, drawOn, lead })
 *        prizes: id -> prize; words: text ids (content `words`); text(id, params); drawOn: wear.drawOn;
 *        lead(): the lead member { key, stage } or null
 *        registers panel "capsules" and adds the album row to panel "settings"
 */

import { element } from '../../ui/dom.js';
import { Button } from '../../ui/Button.js';
import { extendPanel, swapPanel } from '../../ui/PanelExtras.js';
import { grid, gridCard } from '../../ui/RosterKit.js';
import { RENDER_SCALE } from '../../core/units.js';
import { iconCanvas } from './art.js';
import { installCapsuleStyles } from './styles.js';

const PREVIEW = 96;
const PREVIEW_ENV = { t: 0.4, time: 12, weather: 'clear', wind: 0, indoor: true };

export function installAlbum(game, { rules, prizes, words, text, drawOn, lead }) {
  const { registry } = game;
  const t = (id, params) => {
    try {
      return id ? text(id, params) : '';
    } catch (error) {
      return '';
    }
  };
  const total = () => Object.keys(prizes).length;

  function preview() {
    const canvas = element('canvas', 'cp-prev');
    canvas.width = PREVIEW * RENDER_SCALE;
    canvas.height = PREVIEW * RENDER_SCALE;
    try {
      const member = lead();
      const key = member ? member.key : game.config.companion && game.config.companion.key;
      if (!key) return canvas;
      const g = canvas.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
      const pose = { scale: 2, dir: 0, noShadow: false, moving: false, sit: false, stage: member ? Math.min(3, member.stage || 1) : 1 };
      game.art.drawCreature(g, key, PREVIEW / 2, PREVIEW / 2 + 6, PREVIEW_ENV, pose);
      drawOn(g, key, PREVIEW / 2, PREVIEW / 2 + 6, PREVIEW_ENV, pose);
    } catch (error) {
      /* an empty picture */
    }
    return canvas;
  }

  function stateWord(prize) {
    const many = rules.many(prize.slot);
    if (rules.isWorn(prize.id)) return { tag: t(many ? words.shown : words.worn), kind: '' };
    return { tag: t(words.slot && words.slot[prize.slot]), kind: 'quiet' };
  }

  function build(panel, { refresh }) {
    installCapsuleStyles();
    const top = element('div', 'ui-det');
    top.appendChild(preview());
    const info = element('div', 'inf', top);
    element('div', 'ui-note', info, t(words.albumNote));
    panel.add(top);
    for (const seriesId of rules.seriesIds()) {
      const series = rules.series(seriesId);
      const count = rules.count(seriesId);
      const head = element('div', 'cp-series');
      element('span', '', head, t(series.name));
      element('small', '', head, `${count.owned} / ${count.total}`);
      panel.add(head);
      const cards = grid(null);
      for (const prize of series.prizes || []) {
        if (!rules.owns(prize.id)) {
          gridCard(cards, { face: null, mark: '?', name: t(words.unknown), dim: true });
          continue;
        }
        const state = stateWord(prize);
        const card = gridCard(cards, {
          face: iconCanvas(prize),
          name: t(prize.name),
          tag: prize.rare && !rules.isWorn(prize.id) ? t(words.rare) : state.tag,
          tagKind: state.kind,
          dim: !rules.isWorn(prize.id),
          onPress: () => {
            rules.toggle(prize.id);
            game.save.commit();
            refresh();
          },
        });
        card.setAttribute('aria-pressed', rules.isWorn(prize.id) ? 'true' : 'false');
      }
      panel.add(cards);
    }
  }

  registry.add('panel', 'capsules', {
    icon: 'star',
    get title() {
      return t(words.album);
    },
    get sub() {
      return t(words.albumSub, { n: rules.ownedCount(), total: total() });
    },
    build,
  });

  /* the album's row in the Menu, once a prize is owned */
  extendPanel(registry, 'settings', {
    after(panel) {
      if (!rules.ownedCount()) return;
      const row = panel.actions();
      const button = new Button(game.art, {
        icon: 'star', label: t(words.album), desc: t(words.albumDesc), kind: 'alt', onPress: () => swapPanel(game, 'capsules'),
      });
      row.appendChild(button.element);
    },
  });
}
