# Hontori v2: architecture

The game at the repository root. It began as a fresh build ("v2") beside the first version and replaced it; where these notes say "v2" they mean this game, and "the current game" means the first version, whose engine is gone. Its art painters, audio and classic map scripts live on in `src/` (CLAUDE.md principle H) under a system built for efficiency, correctness and fast chapter-making (principles A to J).

## Layers (each depends only on the ones above it)

| Layer | Folder | Holds | Never contains |
|---|---|---|---|
| Core | `core/` | Clock, Input, Camera, Assets, SaveStore, EventBus, Registry, Scene and SceneStack | Game rules, content |
| World | `world/` | TileMap, MapView, Entity and its subclasses, Trigger, Schedule | DOM, story text |
| Systems | `systems/` | Party, Inventory, Money, Quests, DialogRunner, BattleRules, Spells, Encounters, TimeWeather, Text | Drawing, DOM |
| UI | `ui/` | Panel kit (Panel, List, Grid, Button, TextFit), HUD, DialogBox, screens described as data | Game rules |
| Content | `content/` | Pure data: maps, people, dialog, quests, shops, schools, hontori, spells, items, text tables | Logic |
| Art, audio | `src/` | The painters and music as classic scripts, behind the adapters in `game/` | Game state |

## Engine and game are separate

The engine is meant to make other games of the same kind, not only Hontori (CLAUDE.md principle J).

| Part | Folder | Reusable for another game? |
|---|---|---|
| Engine | `core/`, `world/`, `ui/`, `systems/` | Yes. Knows nothing about hontori, elements, spells or this story |
| Game layer | `game/` | No. Hontori's rules: the element matrix, the hontori, spells, rings, the art adapter |
| Content | `content/` | No. This game's chapters as data |

A new game reuses the engine, writes its own game layer and content, and supplies its own art. A rule of thumb for every file: if it mentions a Hontori name, it belongs in `game/` or `content/`.

## Classes

- `Scene` (base: enter, exit, update, draw, pause) -> `TitleScene`, `StoryScene` (picture stories), `WorldScene`, `BattleScene`. A `SceneStack` runs exactly one at a time; menus and dialogs are overlays that pause the scene below.
- `Entity` (id, position, depth, visible, update, draw) -> `Actor` (grid movement, walk frames) -> `Player`, `Person`, `Companion`, `WildHontori`. Also `Prop`, `Pickup`, `Door`.
- `Clock`: the only owner of the frame loop. Fixed-step logic. 30 frames per second in the world, 60 only while a sigil is being drawn, a low rate when nothing moves, stopped when the app is hidden.
- `MapView`: bakes ground and everything that never moves into chunk pictures once per map; only animated things on screen are drawn live.
- `Assets`: every sprite is painted into a sheet the first time it is needed, then only copied. Sheets not used for a while are released.
- `BattleRules`: pure logic with no drawing, so every rule (damage, stamina, binding chance, trial rules) is one small testable function. `BattleScene` only shows what the rules decide.
- `Registry`: one place where features register items, shop goods, interactions, wearables, menu entries, HUD buttons, save defaults and trial rules.
- `Text`: every visible string goes through one lookup. English is the source; other languages are data files loaded on demand; `TextFit` guarantees no string can break a layout.

## A chapter is a folder of data

```
content/ch3/
  maps.js       grids, legends, props, doors, labels
  people.js     id, look, place, schedule, lines
  events.js     scripts made of commands: say, choose, give, battle, draw, flag, move, wait
  quests.js     steps with conditions written as data
  school.js     entrance test and ring rule, picked from a library of puzzle and rule types
  shops.js      goods and prices
  wild.js       which hontori appear where and when
  text.en.js    all strings
```

A new chapter adds no engine code. A new kind of puzzle or ring rule is added once to the library and is then available to every later chapter. That is what makes each chapter faster than the last.

## Correctness without a play-through bot

1. A content checker runs at load in debug mode: every id resolves, every item has an icon and a use, every person has exactly one place, every door leads somewhere, every quest step can be reached and finished, every string exists.
2. Rules are pure functions separated from drawing.
3. One scene at a time; no shared mutable state between scenes except the saved game.
4. Saved data has a version and additive defaults.
5. Nothing in a draw path can throw; every extension call is guarded.

## Build order

| Phase | Result | Runs in parallel? |
|---|---|---|
| 1. Core and world | Emberbrook on screen in v2: walk, camera, day and night, weather, doors, people. Measured against the current game. | No: this fixes the contracts |
| 2. Systems | Dialog and events, quests, inventory, money, time, save | Yes, one agent per system |
| 3. Battle | Rules, spells and gesture, battle screen | Yes, alongside phase 2 |
| 4. UI | Panel kit, HUD, menus, text and languages | Yes, alongside phases 2 and 3 |
| 5. Content | Prologue, chapter 1, chapter 2 as data; riding, unlock, capsules, unique key characters | Yes, one agent per chapter or feature |
| 6. Store readiness | Offline, icons, wrapper, review checklist | After 5 |

Phase 1 must finish before the others start, because it defines the interfaces everything else builds on.

## Phase 1 refinements (what the build changed in this plan, and why)

1. **Standing things are not baked.** MapView bakes the ground and flat decoration only. Trees, furniture and buildings are drawn live, depth-sorted and culled, because actors walk in front of and behind them, and each is a single cached image copy anyway. The saving comes from culling (the current engine draws every prop of the map every frame) and from the baked ground.
2. **Ground in three classes.** Fixed ground is baked once. Ground that sways tile by tile (grass, flowers) is rebaked on a rota, 5 times a second, one chunk group per frame. Water is never baked: it flows across tile borders, so sampling it per chunk would tear it at the seams; it is drawn every frame under the chunk, which leaves a hole for it.
3. **No sprite sheets for people and creatures.** The painters already cache every frame and pick idle frames from the time. Measured: a sheet copy saves 1 to 3 microseconds per person per frame and loses breathing, blinking and idle acts. Assets is a bounded, pooled sheet store used by the ground and open to panels and battle backdrops.
4. **No idle frame rate in the world.** Measured: the idle picture changes in every one of the 30 frames per second, outdoors and indoors (wind, breathing, the companion). The world stays at 30; scenes with nothing moving lower their own `frameRate` (an open panel runs at 8).
5. **Fixed logic step of 1/60 s**, rounded per frame with the remainder carried, so display jitter never adds or drops a step.
6. **Paused but alive.** A scene under an overlay gets `ambient(dt)` instead of `update(dt)`: the picture keeps moving, game time and input stand still.
7. **The interface is DOM**, as in the current game, so fonts, shadows and safe areas are identical. Its colours, font, icons and words come from a theme object.
8. **Added to core:** Screen (canvas fitting), Fade, TouchPad, Settings (device choices), Game (the composition root), units. **Added to world:** Environment (time, weather, wind; the TimeWeather system of phase 2 drives it), Atmosphere, GroundLayer, Fixture, PathFinder, WorldSound, DebugTools. `Trigger` is replaced by events (`player:step`, `world:interact`) and gates.
9. **The content checker takes TileMap objects**, so core does not import world.
10. **Engine and game:** `art/`, `audio/` and `content/legacy.js` became `game/HontoriArt.js`, `game/HontoriSound.js` and `game/legacyMaps.js`; the entry is `game/main.js`.
