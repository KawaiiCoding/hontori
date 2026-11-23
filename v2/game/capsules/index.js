/*
 * game/capsules/index.js  (Hontori: capsules)
 * Job: Hontori's capsule machines on the engine's rules (systems/capsules): the machines drawn as props in
 * the tavern and Pell's Trading Post, the reveal card after a turn, the prizes worn by the lead hontori (in
 * the world, in battle and on the riding saddle), the wand's ink, the keepsakes in the kid's room and the
 * Capsule Album in the Menu. Coins are the game's own coins (the content's script spends them); nothing is
 * ever bought with real money.
 *
 * Public API:
 *   install(game)   after the items, time, story and panels lanes, before game.save.load() and game.start()
 *
 * What it registers:
 *   everything of systems/capsules (save section "capsules", service "capsuleRules", the story's
 *   ext "capsule"), the machine props (game.art.addProp), panel "capsules", the album row in the Menu,
 *   system and world.layer "capsules:room", system "capsules:wear"
 *   service "capsules" (also window.H.capsules, read by the riding art):
 *     drawOn(ctx, kind, x, y, opts)   paint what the lead wears over a creature drawn with the same place and
 *                                     pose; opts: the pose with `env` (or the legacy call (ctx, kind, x, y, env, pose))
 *     blanketColor()                  the saddle blanket colour chosen, or null
 *     inkColor()                      the wand ink colour chosen, or null
 *     wearing()                       a hat is worn
 *     rules                           the capsule rules
 */

import { TILE } from '../../core/units.js';
import { install as installRules, bookOf } from '../../systems/capsules/index.js';
import { setDress } from '../battle-scene/fighters.js';
import { machine, MACHINE_H } from './art.js';
import { createWear } from './wear.js';
import { showReveal } from './reveal.js';
import { installRoom } from './room.js';
import { installAlbum } from './album.js';

const WORDS_KEY = 'capsules';

function wordsOf(game) {
  for (const folder of game.registry.all('content')) if (folder && folder[WORDS_KEY] && folder[WORDS_KEY].words) return folder[WORDS_KEY].words;
  return {};
}

function itemsOf(game) {
  return game.registry.get('service', 'items') || null;
}

function leadOf(game) {
  try {
    const items = itemsOf(game);
    return items && items.party ? items.party.lead() : null;
  } catch (error) {
    return null;
  }
}

export function install(game) {
  const text = (id, params) => {
    try {
      return typeof game.text === 'function' ? game.text(id, params) : id;
    } catch (error) {
      return id;
    }
  };
  const words = wordsOf(game);
  const book = bookOf(game);
  const prizes = {};
  for (const series of Object.values(book.series)) for (const p of series.prizes || []) prizes[p.id] = p;

  const rules = installRules(game, {
    reveal: (prize) => showReveal(game, {
      prize,
      rare: !!prize.rare,
      kicker: text(prize.rare ? words.revealRare : words.revealKicker),
      name: text(prize.name),
      desc: text(prize.desc),
      tap: text(words.tap),
    }),
    refund: (n) => {
      try {
        itemsOf(game).money.add(n);
      } catch (error) {
        /* nothing to give back to */
      }
    },
  });

  /* the machines: a prop each, drawn from a cached picture with a soft contact shadow */
  for (const m of book.machines) {
    if (!m.prop) continue;
    try {
      game.art.addProp(m.prop, {
        info: { fw: 1, fh: 1, solid: true },
        draw(ctx, px, py) {
          ctx.fillStyle = 'rgba(0,0,0,0.22)';
          ctx.fillRect(px + 1, py + TILE - 2, TILE - 2, 2);
          ctx.drawImage(machine(m.body, m.trim), px, py + TILE - MACHINE_H);
        },
      });
    } catch (error) {
      console.warn(`capsules: the machine prop "${m.prop}" could not be added`, error);
    }
  }

  const colorOf = (slot) => {
    try {
      const id = rules.worn(slot);
      const prize = id ? prizes[id] : null;
      return prize && typeof prize.color === 'string' ? prize.color : null;
    } catch (error) {
      return null;
    }
  };

  const wear = createWear(game.art, rules, (id) => prizes[id] || null);
  const service = {
    rules,
    drawOn(ctx, kind, x, y, a, b) {
      const pose = b || a || {};
      const env = b ? a : pose.env || { t: 0, time: 12, weather: 'clear', wind: 0, indoor: false };
      wear.drawOn(ctx, kind, x, y, env, pose);
    },
    blanketColor: () => colorOf('blanket'),
    inkColor: () => colorOf('ink'),
    wearing: () => wear.wearing(),
  };
  game.registry.add('service', 'capsules', service);
  if (typeof window !== 'undefined') {
    window.H = window.H || {};
    window.H.capsules = service;
  }

  /* the lead wears its things in the world (the companion) and in battle (the kid's own fighter) */
  const dress = (ctx, key, x, y, env, pose) => wear.drawOn(ctx, key, x, y, env, pose);
  game.registry.add('system', 'capsules:wear', {
    start() {
      game.bus.on('map:enter', ({ scene }) => {
        if (scene && scene.companion) scene.companion.dress = dress;
      });
      /* the words are there once the story has started */
      if (game.debug) checkContent(game, book, words);
    },
  });
  setDress((ctx, actor, x, y, env, pose) => {
    const lead = leadOf(game);
    if (lead && lead.key === actor.key) wear.drawOn(ctx, actor.key, x, y, env, pose);
  });

  installRoom(game, rules, prizes);
  installAlbum(game, { rules, prizes, words, text, drawOn: dress, lead: () => leadOf(game) });
  return service;
}

/* every prize has its words and a picture, every keepsake a place on a map that exists */
function checkContent(game, book, words) {
  const problems = [];
  const has = (id) => {
    try {
      return typeof game.text === 'function' && game.text(id) !== id;
    } catch (error) {
      return false;
    }
  };
  for (const [seriesId, series] of Object.entries(book.series)) {
    if (!has(series.name)) problems.push(`series ${seriesId}: missing text ${series.name}`);
    for (const p of series.prizes || []) {
      if (!book.slots[p.slot]) problems.push(`prize ${p.id}: unknown slot ${p.slot}`);
      for (const field of ['name', 'desc']) if (!has(p[field])) problems.push(`prize ${p.id}: missing text ${p[field]}`);
      if (p.slot === 'keepsake' && (!p.place || !game.registry.has('map', p.place.map))) problems.push(`prize ${p.id}: no place`);
      if ((p.slot === 'blanket' || p.slot === 'ink') && !/^#[0-9a-f]{6}$/i.test(p.color || '')) problems.push(`prize ${p.id}: no colour`);
    }
  }
  for (const m of book.machines) if (!book.series[m.series]) problems.push(`machine ${m.id}: unknown series ${m.series}`);
  for (const id of Object.values(words).flatMap((w) => (typeof w === 'string' ? [w] : Object.values(w)))) {
    if (!has(id)) problems.push(`missing text ${id}`);
  }
  if (problems.length) console.warn(`capsules: ${problems.length} content problem(s)\n${problems.join('\n')}`);
}
