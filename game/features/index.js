/*
 * game/features/index.js  (Hontori: features)
 * Job: install Hontori's features on the engine's feature system (systems/features): the prologue's picture
 * story, drawing a sigil outside a battle, the academy's entrance tests, rings, fishing, the Element Bloom,
 * riding with the saddle, the offer of the full journey, naming the fire hontori, the chimney entrance, a
 * clean restart of an opening that was cut off, the wind-vane puzzles, kites in the world, lessons at a school
 * and the drifting page of the drawing prompt.
 *
 * Public API:
 *   install(game)   in main.js build, after the battle starter (installBattles) and before the stand-ins
 *                   (installStandIns, installPending): every handler here replaces a stand-in
 *   openUnlock(game), isFull(game)   the code screen for a menu row or the title (unlock.js)
 *
 * What it registers (see each file's header):
 *   (its words are in content/shared/text.en.js)
 *   picture.painter   "main"       storyArt.js
 *   story.command     story, trial, ask:name, offer (systems/features); ext:draw (sigil.js);
 *                     ext:cast (fishing.js); ext:ring (rings.js); ext:bloom (bloom.js); ext:kiteFlight (kite.js);
 *                     ext:flight (flyby.js)
 *   story.condition   ext:ring (rings.js); ext:full (unlock.js)
 *   story.value       ext:fishWeight (fishing.js)
 *   trial.test        sight, sigil, push (trialTests.js); vanes (vanes.js)
 *   draw.twist        drift (sigil.js)
 *   companion.entrance  chimney (entrance.js)
 *   title.action      code: "I have a code" on the title; the same row is added to panel "settings"
 *   closeup           blackboard: the Element Wheel (closeups.js)
 *   world.layer       features (floats.js); features:flights (systems/features/Flights.js);
 *                     features:gusts (vanes.js on systems/features/Gusts.js)
 *   gate              features:gusts       service   gusts { solved, reset }
 *   save sections     opening, rings, gusts
 *   systems           opening, fishing-spot, bloom, ride, features:gusts
 */

import { install as installEngine, installFlights } from '../../systems/features/index.js';
import text from '../../content/shared/text.en.js';
import { storyPainter } from './storyArt.js';
import { installFloats } from './floats.js';
import { installSigil } from './sigil.js';
import { installTrialTests } from './trialTests.js';
import { installFishing } from './fishing.js';
import { installRings } from './rings.js';
import { installUnlock, unlockOptions, openUnlock, isFull } from './unlock.js';
import { extendPanel } from '../../ui/PanelExtras.js';
import { word } from './words.js';
import { installBloom } from './bloom.js';
import { installRide } from './ride.js';
import { installEntrance } from './entrance.js';
import { installCloseUps } from './closeups.js';
import { installVanes } from './vanes.js';
import { installKite } from './kite.js';
import { installFlyby } from './flyby.js';

export { openUnlock, isFull } from './unlock.js';

export function install(game) {
  const { registry } = game;
  registry.add('picture.painter', 'main', storyPainter(game.art));
  installEngine(game, {
    names: {
      ideas: String(text['shared.feat.name.ideas'] || '').split(',').filter(Boolean),
      portraitOf: (member) => game.art.portrait('creature', member.key, member.stage),
      /* { resting: index }: a hontori resting in the Wand Sanctum */
      memberOf: (target) => {
        const kinds = game.save.state.kinds;
        return target && Number.isInteger(target.resting) && kinds && Array.isArray(kinds.resting) ? kinds.resting[target.resting] : null;
      },
      words: { later: 'shared.feat.name.later', ok: 'shared.feat.name.ok' },
    },
    offer: unlockOptions(game),
  });
  installFloats(game);
  installSigil(game);
  installTrialTests(game);
  installFishing(game);
  installRings(game);
  installUnlock(game);
  installBloom(game);
  installRide(game);
  installEntrance(game);
  installCloseUps(game);
  installFlights(game);
  installVanes(game);
  installKite(game);
  installFlyby(game);
  /* "I have a code": a row in the Menu and a link on the title, until the full journey is open */
  registry.add('title.action', 'code', {
    label: () => word(game, 'shared.feat.offer.code'),
    showIf: () => !isFull(game),
    open: () => openUnlock(game),
  });
  extendPanel(registry, 'settings', {
    after(panel, { close }) {
      if (isFull(game)) return;
      const row = panel.actions();
      panel.button(row, {
        icon: 'scroll', label: word(game, 'shared.feat.offer.code'), desc: word(game, 'shared.feat.offer.code.desc'), kind: 'alt',
        onPress: () => {
          close();
          openUnlock(game);
        },
      });
    },
  });
}
