/*
 * game/features/index.js  (Hontori: features)
 * Job: install Hontori's features on the engine's feature system (systems/features): the prologue's picture
 * story, drawing a sigil outside a battle, the academy's entrance tests, rings, fishing, the Element Bloom,
 * riding with the saddle, the offer of the full journey, naming the fire hontori, the chimney entrance, a
 * clean restart of an opening that was cut off, the wind-vane puzzles, kites in the world, lessons at a school,
 * the twists of the drawing prompt (drifting, mirrored, quick), the tide-wheel and power-line puzzles, rides
 * over a crossing map (the ferry) and duels in a row with save points (the Storm Works).
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
 *                     ext:flight (flyby.js); ext:travel (travel.js); ext:gauntlet, ext:gauntletLeave (gauntlet.js)
 *   story.condition   ext:ring (rings.js); ext:full (unlock.js); ext:gauntlet (gauntlet.js)
 *   story.value       ext:fishWeight (fishing.js)
 *   trial.test        sight, sigil, push (trialTests.js); vanes (vanes.js); tide (tide.js); circuit (circuit.js);
 *                     watchers (watchers.js, on systems/features/Watchers.js); mirrors (mirrors.js, on
 *                     systems/features/Mirrors.js);
 *                     braziers (braziers.js, on systems/features/Braziers.js: its gate, layer, system, service
 *                     "braziers", story.command ext:brazierLit and puzzle.reset)
 *   draw.twist        drift, mirror, quick, burn (sigil.js)
 *   companion.entrance  chimney (entrance.js)
 *   title.action      code: "I have a code" on the title; the same row is added to panel "settings"
 *   closeup           blackboard: the Element Wheel (closeups.js)
 *   world.layer       features (floats.js); features:flights (systems/features/Flights.js);
 *                     features:gusts (vanes.js on systems/features/Gusts.js); features:tides (tide.js);
 *                     features:circuits (circuit.js); features:travel (travel.js)
 *   (sanctum.js) save section sanctum; service sanctum; story.command ext:chooseCarry, ext:sanctum, ext:toFront;
 *                     story.condition ext:sanctum, ext:carries
 *   (tournament.js) story.command ext:tournament, ext:tournamentLeave; story.condition ext:tournament; service
 *                     tournaments; system features:tournament; save section tournament
 *   (wandGems.js) save section wandGems; the item effect manaPlus; world.layer features:heldClock (maps that
 *                     hold their hour and weather: content `always`)
 *   world.sight       lantern (lantern.js: the Lantern, and Lantern Oil, widen the light in a dark cave)
 *   gate              features:gusts, features:tides, features:circuits, features:travel
 *   service           gusts, tides, circuits { solved, reset }; travel { go, riding }; gauntlets { open, stage, leave }
 *   puzzle.reset      vanes, tide, circuit   (type -> (puzzleId) => owned and reset)
 *   save sections     opening, rings, gusts, tides, circuits, travel, gauntlet
 *   systems           opening, fishing-spot, bloom, ride, features:gusts, features:tides, features:circuits,
 *                     features:travel, features:gauntlet
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
import { installTide } from './tide.js';
import { installCircuit } from './circuit.js';
import { installTravelling } from './travel.js';
import { installGauntlet } from './gauntlet.js';
import { installLantern } from './lantern.js';
import { installSanctum } from './sanctum.js';
import { installBrazierCourt } from './braziers.js';
import { installWandGems } from './wandGems.js';
import { installWatcherGround } from './watchers.js';
import { installMirrorGarden } from './mirrors.js';
import { installTournament } from './tournament.js';

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
  installTide(game);
  installCircuit(game);
  installTravelling(game);
  installGauntlet(game);
  installLantern(game);
  installSanctum(game);
  installBrazierCourt(game);
  installWandGems(game);
  installWatcherGround(game);
  installMirrorGarden(game);
  installTournament(game);
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
