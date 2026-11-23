/*
 * unlock.js  (Hontori: features)
 * Job: the full journey, bought once (src/unlock.js). Until the stores are wired up, a code unlocks it. The
 * offer is shown once per journey after the grey cloak duel and never interrupts play; a grown-up check sits
 * before the code field (CLAUDE.md rule 20). Hontori's words, picture and code for the engine's offer.
 *
 * Public API:
 *   unlockOptions(game)   the options of installOffer (systems/features/Offer.js) for Hontori
 *   installUnlock(game)   registers "story.condition" "ext:full" (the full journey is open)
 *   openUnlock(game)      the code screen from a menu row or the title (grown-up check first); Promise<bool>
 *   isFull(game)
 */

import { Entitlement, openOffer } from '../../systems/features/index.js';

/* the code is compared by its hash, so the plain text is not in the page */
const CODE_HASH = 2249155625;
/* the current game's key, so a journey unlocked there stays unlocked here */
const OLD_KEY = 'hontori.full';
const PICTURE = ['wind', 'water', 'hontori', 'electric', 'earth'];

const entitlements = new WeakMap();

function entitlementOf(game) {
  let found = entitlements.get(game);
  if (!found) {
    found = new Entitlement([`${game.config.id}.full`, OLD_KEY], game.storage);
    entitlements.set(game, found);
  }
  return found;
}

function hash(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h;
}

export function isFull(game) {
  return entitlementOf(game).openNow;
}

export function unlockOptions(game) {
  return {
    entitlement: entitlementOf(game),
    codeHash: CODE_HASH,
    hash,
    sound: 'wand',
    offers: {
      c2: {
        title: 'shared.feat.offer.c2.title',
        text: 'shared.feat.offer.c2.text',
        list: ['shared.feat.offer.c2.list.1', 'shared.feat.offer.c2.list.2', 'shared.feat.offer.c2.list.3', 'shared.feat.offer.c2.list.4'],
      },
    },
    words: {
      keep: 'shared.feat.offer.keep', keepDesc: 'shared.feat.offer.keep.desc', code: 'shared.feat.offer.code', codeDesc: 'shared.feat.offer.code.desc',
      gateTitle: 'shared.feat.offer.gate.title', gateAsk: 'shared.feat.offer.gate.ask', gateWrong: 'shared.feat.offer.gate.wrong',
      next: 'shared.feat.offer.next', back: 'shared.feat.offer.back', codeTitle: 'shared.feat.offer.code.title', codeText: 'shared.feat.offer.code.text',
      codeWrong: 'shared.feat.offer.code.wrong', codeEmpty: 'shared.feat.offer.code.empty', unlock: 'shared.feat.offer.unlock',
      doneTitle: 'shared.feat.offer.done.title', doneText: 'shared.feat.offer.done.text', done: 'shared.feat.offer.done',
    },
    picture(row) {
      for (const key of PICTURE) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        try {
          const face = game.art.portrait('creature', key);
          const g = canvas.getContext('2d');
          g.imageSmoothingEnabled = false;
          g.drawImage(face, 0, 0, face.width, face.height, 0, 0, 64, 64);
          row.appendChild(canvas);
        } catch (error) {
          /* a face that cannot be painted is left out */
        }
      }
    },
  };
}

export function openUnlock(game) {
  return openOffer(game, 'code');
}

export function installUnlock(game) {
  game.registry.add('story.condition', 'ext:full', () => isFull(game));
}
