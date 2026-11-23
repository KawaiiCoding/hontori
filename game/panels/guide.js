/*
 * guide.js  (Hontori: panels)
 * Job: Hontori's first-touch guide (world rule 48): the lead hontori's face floats beside the thing
 * being explained with one short line, on its own card (ui/HelperCard.js), never blocking and
 * never covering what it explains. It takes over the story's `helper` command, so every card in
 * the content shows this way, and the panels show their own cards through it. A card is shown
 * once (flag `help:<id>`); one whose thing is not on screen is skipped and may show next time.
 *
 * Public API:
 *   installGuide(game, roster)   -> guide; registers story.command "helper" and system "guide"
 *   guide.show(id, { title, text, target, still })   title, text: text ids; target: see TARGETS;
 *                                             still(): false when the moment has passed before it shows
 *
 * Targets: a CSS selector, "hud:<button id>" (a round HUD button), or null (no ring).
 */

import { HelperCard } from '../../ui/HelperCard.js';

/* what each card of the content points at */
const TARGETS = {
  'item:backpack': 'hud:backpack',
  'item:map': 'hud:map',
  quest: '.ui-qpill',
  questlog: '.ui-sheet.on',
  coins: '.ui-purse',
};

/* the party strip and the bag's purse are Hontori's own things the card should not cover either */
const AVOID = '.hp-strip, .ui-purse';

export function installGuide(game, roster) {
  let card = null;

  const story = () => game.registry.get('service', 'story') || game.story || null;
  const seen = (id) => {
    try {
      return !!story().flag(`help:${id}`);
    } catch (error) {
      return false;
    }
  };
  const mark = (id, on) => {
    try {
      story().setFlag(`help:${id}`, on);
    } catch (error) {
      /* without a story the card may show again; nothing breaks */
    }
  };

  /* a target stays a selector until the card opens, so a panel built a moment later is found */
  function resolve(target) {
    if (!target || typeof target !== 'string' || !target.startsWith('hud:')) return target || null;
    const button = game.registry.get('hud.button', target.slice(4));
    if (!button) return null;
    const label = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(button.label) : button.label;
    return `.ui-round[aria-label="${label}"]`;
  }

  function face() {
    const lead = roster.members()[0];
    const key = lead ? lead.key : game.config.companion && game.config.companion.key;
    return key ? roster.faceOf(key, lead ? lead.stage : 1) : null;
  }

  function show(id, { title, text, target, words, still }) {
    if (!id || !card || seen(id)) return Promise.resolve(false);
    mark(id, true);
    const node = resolve(target);
    if (target && !node) {
      mark(id, false);
      return Promise.resolve(false);
    }
    const said = words || { title: roster.text(title), text: roster.text(text) };
    return card.show({ title: said.title, text: said.text, face: face(), target: node, still }).then((shown) => {
      if (!shown) mark(id, false);
      return shown;
    });
  }

  game.registry.add('system', 'guide', {
    start() {
      card = new HelperCard(game.ui.layer, { avoid: AVOID });
      game.bus.on('scene:change', ({ top }) => {
        /* a full screen of its own (a battle, the title) takes the guide away */
        if (top && !top.hud && !top.overlay) card.clear();
      });
    },
  });

  /* the content's cards: shown beside their thing; the script goes on at once */
  game.registry.add('story.command', 'helper', (node, ctx) => {
    const words = { title: ctx.text(node.title), text: ctx.text(node.text) };
    show(node.helper, { target: node.target || TARGETS[node.helper] || null, words });
  });

  return { show };
}
