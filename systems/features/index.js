/*
 * systems/features/index.js  (engine: features)
 * Job: install the general story features a game of this kind needs beyond dialog: the picture story, the
 * trials of a school door, the name entry, the one purchase offer and the guard that restarts an opening
 * that was cut off. Each piece is engine code; the game passes what is its own (painters, words, the code).
 *
 * Public API:
 *   install(game, { names, offer })   before game.save.load() and game.start(), before the stand-ins
 *        names: options of installNameEntry (NameEntry.js); offer: options of installOffer (Offer.js),
 *        left out: no offer command
 *
 * What it registers:
 *   story.command   "story" (PictureStory.js), "trial" (Trials.js), "ask:name" (NameEntry.js), "offer" (Offer.js),
 *                   "open" (CloseUp.js)
 *   scene           "pictureStory"
 *   save section    "opening" { state }    system "opening" (Opening.js)
 * Registry kinds it reads: "picture.painter" (main), "trial.test" (type), "service" "items" and "story"
 *
 * Also exported for other pieces of a game: ScreenScene, openScreen, drawPrompt, askName, chooseCarry (the
 * choose-who-comes screen, CarryChoice.js), chooseLine (choose one line, with a confirm step, LineChoice.js),
 * openGroupDrawing (a ring drawn stroke by stroke by many people, GroupDrawing.js), rollCredits (Credits.js),
 * playPictureStory (PictureStory.js), openOffer, Entitlement,
 * and the pieces a game installs with its own look: installGusts (wind-vane puzzles, Gusts.js), GustField and
 * checkGustField (their rules and fairness proof), installFlights and fly (things flying over the world,
 * Flights.js), driftTwist, mirrorTwist, quickTwist, burnTwist and twistOf (twists of the drawing prompt, twists.js),
 * installTides with TideField and checkTideField (water-level puzzles, Tides.js), installCircuits with
 * CircuitField and checkCircuitField (power-line puzzles, Circuits.js), installTravel (a ride from one place
 * to another over a crossing map, Travel.js), installBraziers with BrazierField and checkBrazierField (lighting in
 * order, Braziers.js), installMirrors with MirrorField and checkMirrorField (a beam turned by mirrors, Mirrors.js),
 * installWatchers with WatcherField and checkWatcherField (slipping past watchers, Watchers.js), installHeldClock
 * (maps that hold their hour, HeldClock.js) and installGauntlets (battles in a row with save points,
 * Gauntlet.js). Every puzzle type also registers kind "puzzle.reset" (type -> (id) => owned and reset).
 */

import { installPictureStory } from './PictureStory.js';
import { installTrials } from './Trials.js';
import { installNameEntry } from './NameEntry.js';
import { installOffer } from './Offer.js';
import { installOpening } from './Opening.js';
import { installCloseUps } from './CloseUp.js';

export { ScreenScene, openScreen, guardInput } from './ScreenScene.js';
export { drawPrompt } from './DrawPrompt.js';
export { askName, cleanName } from './NameEntry.js';
export { chooseCarry, CarryChoiceScene } from './CarryChoice.js';
export { installBraziers, Braziers } from './Braziers.js';
export { installHeldClock } from './HeldClock.js';
export { showStandings, StandingsScene } from './Standings.js';
export { chooseLine, LineChoiceScene } from './LineChoice.js';
export { openGroupDrawing, GroupDrawingScene } from './GroupDrawing.js';
export { rollCredits, CreditsScene } from './Credits.js';
export { playPictureStory } from './PictureStory.js';
export { installMirrors, Mirrors } from './Mirrors.js';
export { MirrorField, checkMirrorField } from './MirrorField.js';
export { installWatchers, Watchers } from './Watchers.js';
export { WatcherField, checkWatcherField } from './WatcherField.js';
export { BrazierField, checkBrazierField } from './BrazierField.js';
export { openOffer, Entitlement } from './Offer.js';
export { trialOf } from './Trials.js';
export { openCloseUp } from './CloseUp.js';
export { installGusts, Gusts } from './Gusts.js';
export { GustField, checkGustField, DIRS } from './GustField.js';
export { installFlights, fly } from './Flights.js';
export { driftTwist, mirrorTwist, quickTwist, burnTwist, unseenTwist, flawlessTwist, twistOf } from './twists.js';
export { installTides, Tides } from './Tides.js';
export { TideField, checkTideField } from './TideField.js';
export { installCircuits, Circuits } from './Circuits.js';
export { CircuitField, checkCircuitField, SIDES, SHAPES } from './CircuitField.js';
export { installTravel, Travel } from './Travel.js';
export { installGauntlets, Gauntlets } from './Gauntlet.js';

export function install(game, { names, offer } = {}) {
  installPictureStory(game);
  installTrials(game);
  installNameEntry(game, names);
  if (offer) installOffer(game, offer);
  installOpening(game);
  installCloseUps(game);
}
