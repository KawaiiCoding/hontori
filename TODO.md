# Hontori: what is left

Live: https://kawaiicoding.github.io/hontori/  (deploys from `main`)
Story bible: STORY.md. How to add content: CONTENT_GUIDE.md. Module contract: CONTRACT.md.

## Verify first (built in parallel at the end, needs one full play-through on iPhone Safari)
- Battle redesign (src/battle.js, src/moves.js): hontori moves vs drawn wand spells, mana, enemy intents, matchup banner, capture only via Binding Spiral, escape as a real action, switching hontori, loadouts, drawing quality grades, spell mastery, trainer duels.
- Progression (src/progress.js, src/menu.js): EXP and levels, 4 evolutions, wand levels, Wand Sanctum storage, loadout screens.
- Evolution art (src/spirits.js): 5 forms per species, gallery.html.
- Wild hontori and habitats (src/encounters.js) and the Whisperwood map (src/whisperwood.js).
- Story engine and Chapter 1 (src/quests.js, src/chapter1.js): morning scene, pick 5 items, quests.
- Academy lessons and duels (src/academy.js): switch Aegis Ward and Rally Rune to their real shapes once battle.js has them; duels should use trainer mode.

## First thing next time
- Battle screen layout fixed (spell sheet starts closed). Run one full battle on a real iPhone to confirm.
- Faint dark seam lines remain on the largest evolved forms (stage 4-5); finish the clean-up in src/spirits.js.

## Battle: still missing (src/battle.js, src/moves.js)
- Drawing quality grades (Flawless / Strong / Rough) changing spell strength.
- Spell mastery (state.spellMastery) and the 4-spell loadout (state.spellLoadout).
- Move pools that grow with level (H.moves.pool / learned, member.moves, up to 4 move buttons).
- Switching hontori mid-battle; result needs a participants list for EXP sharing.
- Escape as a real action (chance low/fair/good, retry bonus, failure costs the turn, dash-off animation, veilstep sigil).
- Node test that all drawn shapes are told apart (U vs V most at risk).
- Check every biome/time/weather background and run a battle in WebKit (iPhone Safari).

## Left over from the last agents (details)
- Done: Chapter 1 (src/chapter1.js) played end to end in Chromium (intro, V, picker, real walk to the Academy, gate trial, a real duel, Binding lesson, Pip, two sleeps, pond, Fenn, Elder, south gate, Whisperwood, letter, closing rhyme, save/reload). Still play it once on iPhone Safari with a real pond capture.
- The gatekeeper and Madam Sorrel both use the 'elder' portrait (engine.js / academy.js): give the gatekeeper a look of its own.
- Academy lesson "Caring for your hontori" added (src/academy.js); check its lines match the final Mend/mana mechanics.
- Approve the antagonist name in STORY.md: Grand Archmage Orlen Vael (crest: a closed grey eye). Check STORY.md against WORLD_RULES.md.
- CONTENT_GUIDE.md is missing the school and spirit-stage sections; quest log sheet and story events untested.
- Evolution art: stages 4-5 are a bit noisy (fire stage 5 crowded); grass, electric, earth, dark, light stages 2-5 not reviewed; no sit pose for stages 2-5; stage 2-5 portraits unchecked.
- Progression: battle must use H.progress.wandPerks(), state.spellLoadout, state.spellMastery, report participants, set H.progress.handled; lessons should call H.progress.lesson(); evolution flash looks grey; Moves screen needs src/moves.js pool/learned and its script tag.
- Wild hontori: battle ignores the wild level (opts.level); electric ones almost never spawn; species balance; door between village and Whisperwood not play-tested; pale light and wind spirits hard to see by day.

## Requested but not done yet
- Rewrite object interaction lines (src/interact.js) in the calm short style with spirit rhyme (some are still jokey).
- Wand memory of 100 spirits (codex/encyclopedia screen) and more species beyond the 8 starters.
- Revive materials per element for all 8 elements (only fire and water have one).
- More regions: 8 element towns, each with a School of Magic, a trial, and a ring.
- The antagonist storyline (archmage) and the final goal: a new law so hontori are respected.
- Real pixel-art sprite sheets (Aseprite) and maps in the Tiled editor once the look is final.
- Furniture at full 2x detail (most pieces are still upscaled), trees and props redrawn at 2x.
- Music check on a real iPhone (silent switch fix added, not heard on device yet).
- Mobile app packaging (Capacitor) after the web version is stable.

## Known rough edges
- index.html shows a keyboard help line on desktop that overlaps the phone frame.
- Debug keys (T time, R weather, H add hontori, F battle, 1/2 maps) should be hidden in a release build.
