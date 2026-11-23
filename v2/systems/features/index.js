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
 * Also exported for other pieces of a game: ScreenScene, openScreen, drawPrompt, askName, openOffer, Entitlement,
 * and the pieces a game installs with its own look: installGusts (wind-vane puzzles, Gusts.js), GustField and
 * checkGustField (their rules and fairness proof), installFlights and fly (things flying over the world,
 * Flights.js), driftTwist and twistOf (twists of the drawing prompt, twists.js)
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
export { openOffer, Entitlement } from './Offer.js';
export { trialOf } from './Trials.js';
export { openCloseUp } from './CloseUp.js';
export { installGusts, Gusts } from './Gusts.js';
export { GustField, checkGustField, DIRS } from './GustField.js';
export { installFlights, fly } from './Flights.js';
export { driftTwist, twistOf } from './twists.js';

export function install(game, { names, offer } = {}) {
  installPictureStory(game);
  installTrials(game);
  installNameEntry(game, names);
  if (offer) installOffer(game, offer);
  installOpening(game);
  installCloseUps(game);
}
