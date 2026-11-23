# Chapter 3: The Whistling Pass (shared brief)

Read first: `../CLAUDE.md` (all principles and rules, especially H, I, J, 26, 27), `../WORLD_RULES.md` (canon; rules 79 to 83 are new), `INTERFACES.md`, `content/schema.md`, `PHASE2.md` rules 1 to 9 (they apply to every lane). Chapter 2's folder `content/ch2/` is the model for the data format.

## The chapter (canon from the design board)
- Levels 8 to 11. Element: wind. The road east of Mossgrove (the rockslide) opens only with the full journey (`ext:full`). The crew has cleared it; the grey cloaks cleared it so the kid would hurry.
- Places: the Whistling Pass (cliff road, wind gusts), Windrest (hamlet), Kitewick (town on stilts above a valley: tavern with ramen and bed, shop, about 4 houses with people and small stories), Gale Loft (great school of wind).
- Small school: the Kite House in Windrest teaches the Ward Sigil (spell id `shield`, battle name Aegis Ward: blocks one hit).
- Great school: Gale Loft. Warden Zephra, Apprentice Tolle (one hontori). Entrance test: turn the wind vanes to cross the rope bridges. Ring rule: THE WIND CHOOSES, every 3 turns the wind swaps your active hontori. Zephra's team includes an earth and a water kind so a fire lead cannot sweep it. Drawing twist: the page drifts sideways while you draw. Winning gives the Gale Ring (a Warden's vote, rule 79) and a 5 silver purse.
- Story: Grand Archmage Orlen Vael appears in person for the first time (look `orlen`), kind and helpful: he pays to mend the broken rope bridge, praises the kid, and gives the Archmage's Token (a key thing; it will later turn out to track the kid). Kites carry mail here: letters from Mom and Dad begin (a kite brings one when you arrive, one after the ring). Cole sends a warning kite: he saw grey cloaks carry a hontori away in a jar. Cole wants a ring to show his father, a ring-smith who thinks sparks are tricks; rematch with Cole (3 hontori) in Kitewick.
- Small quests: The Lost Kite (the kite item finally matters: fly it on a windy day in Kitewick to reach a stuck letter), a hontori nesting in the bell tower, a Kitewick family story.
- Pacing (rule I): about 12 beats of 5 minutes, one new thing at a time, a reward every few minutes, one mystery planted (the Token), one paid off (Cole's warning about jars connects to the grey cloaks).
- Second evolution happens in this chapter (level 10): the saddle becomes available.

## Fixed ids (use exactly these; lanes depend on each other through them)
- Maps: `whistling_pass`, `windrest`, `kite_house`, `kitewick`, `kitewick_tavern`, `kitewick_shop`, `kitewick_h1`, `kitewick_h2`, `kitewick_h3`, `kitewick_h4`, `gale_loft`, `gale_bridges`. Mossgrove's east lane at the rockslide leads to `whistling_pass`.
- People: `zephra`, `tolle`, `orlen`, `cole`, `kite_keeper` (Kite House teacher), `kw_innkeeper`, `kw_shopkeeper`, plus villagers the story lane adds.
- New hontori kinds (keys): `kestrip` (wind, small hawk), `pufflet` (wind, dandelion puff), `cragnib` (earth, mountain kid goat), `pebblehop` (earth, rock rabbit), `breezelet` (wind, stoat), `skyfin` (wind and water, gliding fish), `voltmoth` (wind and electric, moth), `mossram` (earth and grass, ram). Names may be improved by the hontori lane if one turns out to echo an existing game creature; report any rename.
- Items: `token` (Archmage's Token, key thing), `gale_ring` (Gale Ring, key thing), `letter_home_1`, `letter_home_2`, `cole_kite_note`.
- Flags prefix `c3:`. Spell `shield`. Trial `gale`. Puzzle `vanes`. Ring rule id `windSwap`. Drawing twist id `drift`.

## Lanes
| Lane | Owns | Builds |
|---|---|---|
| maps | `game/maps/` (new), `content/ch3/maps/`, and the smallest needed addition to `content/legacy.js` or `game/legacyMaps.js` | New maps as DATA (grids, legends, props, buildings, doors, labels) loaded by a small content-map loader, so future chapters never need `src/` map scripts; all 12 maps in the current look (reuse existing tiles, props, buildings, furniture); the cliff road with wind gusts, Kitewick on stilts with rope bridges; the rockslide door from Mossgrove gated by the story; map checker passes |
| hontori | `src/spirits.js` only | The 8 new kinds in all five stages, original designs in the current style, in the existing painter tables; portraits; habitats so they appear on the right tiles |
| story | `content/ch3/` except `maps/` | People, events, quests, trainers (Tolle, Zephra, Cole rematch, wild tables), shops, text, kite letters, Vael's scene, the Token, small quests, the gating of the road with `ext:full`; content check passes |
| library | `game/battle/`, `game/features/`, `systems/features/` | Ring rule `windSwap`, drawing twist `drift` for the sigil prompt, the `vanes` puzzle type (wind vanes that change gust directions, gusts that push the player on bridges), teaching `shield` at the Kite House, the kite flight action for The Lost Kite; battle checks pass |
| music | `game/HontoriSound.js` and a new `game/music/` | A calm wind-flavoured town theme for Kitewick and a duel variant for Gale Loft, in the existing song format (study `src/audio.js` SONGS) |

Verify proportionately (rule 21). Report under 300 words: files, ids added or renamed, what the lead must wire.
