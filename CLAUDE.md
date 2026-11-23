# Hontori: engineering rules

WORLD_RULES.md holds the story and design canon. This file holds the rules for the code. Both are binding.

## Principles (from the creator; these come first)
A. Exemplary quality. The code and the game must both be good enough to pass the App Store, Google Play or any other store review easily, the first time.
B. Faster with every chapter. Each thing is built so the next chapter is quicker to make than the last: content is data, systems are reusable, and a new town, school, quest, person or hontori needs no new engine code.
C. System first, story second. Build the systems for maximum efficiency and correctness, then build the story on top of them. Never bend a system to fit one scene.
D. Great to use. UI and UX are simple, clear and native-feeling: nothing to hunt for, nothing unexplained, the same patterns everywhere.
E. Great to play. The world is interactable and the gameplay rewarding at every step.
F. Extendable by design. New features plug into extension points. Classes and inheritance are welcome where they give clear control (for example one base entity, with the player, people and hontori built on it).
G. No bugs. The system is simple enough to be built correctly from the start: small modules, checked data, guarded calls, nothing fragile. A known bug is fixed before new work begins.
H. The look and feel is settled. The current game is the visual and tonal reference: its pixel style, palette, lighting, calm pacing, interface shapes and music. Anything rebuilt or added takes its look from what is already there.
I. The story serves the player. It is simple and polished, gives a steady rhythm of rewards, introduces one thing at a time, and never leaves a stretch where a new player would put the game down. Every hint pays off.
J. The engine is reusable. The core, world, UI kit and general systems (dialog, quests, inventory, saving, battles as a framework) must work for other games of the same kind, not only Hontori. Everything specific to Hontori (its hontori, elements, spells, story, art, names) lives in a separate game layer and in content data. Nothing in the engine may name a Hontori-specific thing.

## Layout
| Folder | Layer | Holds |
|---|---|---|
| `core/`, `world/`, `ui/`, `systems/` | Engine | The frame loop, input, saving, scenes; maps, entities and the world scene; the UI kit; dialog, quests, items, time, battles and capsules as frameworks. ES modules. Names nothing of Hontori (principle J). |
| `game/` | Game layer | Everything that is Hontori: its rules, theme, panels, features, music, and the adapters to the painters (`HontoriArt.js`, `HontoriSound.js`, `legacyMaps.js`). `game/main.js` is the bootstrap. |
| `content/` | Content | Chapters as pure data, one folder each (`shared`, `prologue`, `ch1`, ...), checked by `content/check.mjs`. |
| `src/` | Art painters | Classic scripts on `window.H`: the painters (tiles, props, buildings, furniture, characters, spirits, icons, fx), the sprite-sheet reader, the audio synth and the classic map scripts. Loaded by `index.html` before the modules. |
| `assets/` | Files | Sprite sheets (written by `tools/build_sheets.js`), the font, the app icons. |
| `tools/` | Build | `build_sheets.js`, `build_release.js` (writes `dist/`, never committed). |
| `docs/` | Notes | `ARCHITECTURE.md`, `INTERFACES.md` (the contracts) and the phase and chapter notes. |

The page is `index.html` with `sw.js` and `manifest.webmanifest` at the root. Every path in it is relative: the game is served from a sub-folder.

## Structure
1. One module, one job. Each file owns one feature and exports a small API, listed in a comment at the top of the file. Layers depend downward only (`core`, then `world`, `ui` and `systems`, then `game`); the engine never imports from `game/` or `content/`.
2. Modules talk through those APIs, the `Registry` and the `EventBus` only. A module never reaches into another module's private state or DOM. Only the three adapters in `game/` touch `window.H`; a painter in `src/` adds its own namespace to `window.H` and nothing else.
3. Extend, do not edit: a new feature hooks in through an existing extension point (an `install(game)` function, a kind in `game.registry`, an event on `game.bus`, a story command or condition, a `SaveStore` section, a content folder) before it changes the engine. The contracts are in `docs/INTERFACES.md`.
4. Every call into another module or a registered extension is guarded: the game must still run if that module is missing or throws.
5. Saved state is additive. New fields get defaults in their `SaveStore` section (`game.save.define`); old saves must always load.

## Safety
6. Nothing inside the render loop or a draw call may throw. The loop schedules its next frame first.
7. No inline `//` comment in the middle of a code line. Comments go on their own line or use `/* */`.
8. A story step can never dead-end: every quest can be finished from any save, and a required capture or duel can always be retried.
9. One person is in one place; one item id means one thing; every item sold or given does something.

## Performance (the game must stay cool on a phone)
10. Draw only what is on screen: tiles, props, people and particles outside the camera are skipped.
11. Art is created lazily, on first use, and cached. Caches for things no longer on screen are bounded.
12. No work per frame that can be done once: no layout reads, no new canvases, no allocation-heavy loops in the render path.
13. When nothing moves (a menu, a dialog, the title after a while), the frame rate drops. When the page is hidden, the loop and the music stop.
14. Timers and listeners are removed when their panel closes.

## Before a change is done
15. `node --check` on every changed file; `node content/check.mjs` after a content change and `node systems/battle/check.mjs game/battle/check.mjs` after a battle change.
16. Load the changed scene once in a browser and fix any page error. No play-through bot: correctness comes from the structure above.
17. Look at a screenshot of anything visual.
18. Update WORLD_RULES.md when the change adds or alters canon.

## Store readiness
19. No emojis, no copied names or designs, no real-money random rewards, no ads, no tracking, no network calls after load.
20. Purchases sit behind a grown-up check. The game is fully playable offline once loaded.

## Working efficiently (without lowering quality)
21. Verification is proportionate: one load per scene type and one screenshot per visual change. Exhaustive sweeps only for risky core changes.
22. Model by task: the strongest model for architecture and risky core work; a mid model for well-specified work; a light model for mechanical tasks such as translation from a finished text list.
23. Continue an agent that already has the context instead of starting a new one. Never let two agents read or rewrite the same files.
24. Agent reports stay under about 400 words. Do not reread files already read.
25. Features not needed for the current episode wait. User decisions are gathered and asked together.
26. Timed text (toasts, guide cards, anything that disappears by itself) stays as long as it takes to read: about 250 words a minute plus a moment to notice it, never less than 2.5 seconds. Use `readMs` (ui/readTime.js); never a fixed short duration.
27. Every visual effect has a visible cause. Sparkles, glows, flashes and particles appear only when the player can see what made them (a spell drawn, a spirit arriving, an item found) and never on their own or as decoration on ordinary actions. When unsure, leave the effect out.
