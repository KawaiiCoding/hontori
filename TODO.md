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
