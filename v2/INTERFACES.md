# Hontori v2: interfaces

The contracts that phases 2 to 5 code against. Phase 1 (core and world) implements all of them; nothing here is a plan. If a contract has to change, change it here first and tell every phase.

Every file starts with a header comment that states its single job and its full public API. This document is the map; the headers are the detail.

## 0. Ground rules

- v2 code is ES modules. The bootstrap is `v2/game/main.js` (`build`, `load`, `start`, and `boot` for a page); importing it starts nothing. `v2/index.html` loads the classic painter, map, audio and item-icon scripts from `../src` first and then calls `boot()`.
- Engine and game are separate (principle J). `core/`, `world/` and `ui/` are the engine and name nothing of Hontori. `game/` is Hontori: its art, sound, theme, maps and entry point. Only `game/HontoriArt.js`, `game/HontoriSound.js` and `game/legacyMaps.js` touch `window.H`.
- Layers depend downward only: `core` knows nothing of `world` or `ui`; `world` knows nothing of systems or UI; the engine never imports from `game/`.
- Units: one tile is 16 logical pixels (`TILE`); the canvas is drawn at 2 real pixels per logical pixel (`RENDER_SCALE`). All drawing code works in logical pixels. Directions are `DOWN = 0, UP = 1, LEFT = 2, RIGHT = 3` (`core/units.js`).
- Nothing in `update` or `draw` may throw. The Clock guards the frame, the EventBus guards every handler, and every call into a registered extension is guarded by its caller.
- No inline `//` comment in the middle of a code line.

## 1. The Game object

`core/Game.js`. Built once in `main.js`; passed to every scene (`scene.game`) and every system (`start(game)`).

| Field | Class | Use |
|---|---|---|
| `game.bus` | `EventBus` | events between modules |
| `game.registry` | `Registry` | everything that is registered by kind and id |
| `game.save` | `SaveStore` | the saved game |
| `game.scenes` | `SceneStack` | what is on screen |
| `game.clock` | `Clock` | the frame loop; frame-rate requests |
| `game.input` | `Input` | the player's intent |
| `game.screen` | `Screen` | canvas, view size, `toView(clientX, clientY)` |
| `game.assets` | `Assets` | bounded store of baked pictures |
| `game.art` | art provider | the game's painters (section 12) |
| `game.sound` | sound provider | `unlock()`, `enterPlace(mapId, env)`, `follow(env)`, `play(name)`, `setMuted(on)` |
| `game.theme` | theme | colours, font, icons, words, title (section 12) |
| `game.config` | object | `{ id, firstMap, playerLook, companion }` |
| `game.settings` | `Settings` | device choices: `get/set('controls' | 'muted' | 'slot')` |
| `game.ui` | `Ui` | `layer`, `toast(text)`, `openPanel(id)` (section 11) |

`game.chooseControls('stick' | 'tap')` and `game.setMuted(on)` change a setting and apply it.

## 2. Registering with the Registry

```js
registry.add(kind, id, value)   // throws if (kind, id) is already taken: one id means one thing
registry.get(kind, id)          // value or undefined
registry.has(kind, id)
registry.all(kind)              // iterable of values, in the order added
registry.ids(kind)              // array of ids
```

Kinds in use after phase 1:

| Kind | Value | Read by |
|---|---|---|
| `map` | a map description (section 6) | `WorldScene` |
| `scene` | `(game) => Scene` | `SceneStack.open(id, params)` |
| `system` | an object with `start(game)` | `Game.start`, once, in the order added |
| `gate` | `(step) => boolean` (section 5) | `WorldScene`, once per attempted step |
| `panel` | `{ icon, title, sub, build }` (section 11) | `PanelScene` |
| `hud.button` | `{ icon, label, order, open }` (section 11) | `Hud` |

Phase 2 added the kinds of section 14 (`content`, `quest`, `story.command`, `story.condition`, `story.value`, `story.speaker`, `service`, `world.layer`, `map.marker`). A later phase documents its own there. Register before `game.start(...)`, inside `build` in `main.js`.

### A system

A system is any object with `start(game)`. It subscribes to events and registers what it owns. A rule system (money, quests) never draws and never touches the DOM; only interface systems such as `ui/Hud.js` do.

```js
// systems/Money.js
export class Money {
  start(game) {
    this.state = game.save.state.money;
    game.bus.on('world:interact', (event) => this.#maybePay(event));
  }
}

// main.js, before game.start(...)
game.save.define('money', { copper: 0 });
game.registry.add('system', 'money', new Money());
```

`world/DebugTools.js` is a working example.

## 3. Events

```js
const off = bus.on(type, handler)   // returns the function that unsubscribes
bus.off(type, handler)
bus.emit(type, payload)             // a handler that throws is reported and skipped
```

Events emitted by phase 1:

| Event | Payload | When |
|---|---|---|
| `map:enter` | `{ map: TileMap, scene: WorldScene }` | a map has been set up (start, door) |
| `world:tick` | `{ scene, env, map }` | once a second while the world is visible (clock, ambience) |
| `player:step` | `{ map, tx, ty, player }` | the player arrived on a tile |
| `player:bump` | `{ map, tx, ty, player }` | the player walked into something |
| `door:enter` | `{ map, door, player }` | the player stepped onto a door |
| `scene:change` | `{ top, base }` | after every scene push and pop |
| `world:interact` | `{ map, tx, ty, target, player }` | action button, or a tap on something (section 5) |
| `save:before` | the save state | just before the state is written; copy live values into it |
| `app:hidden`, `app:visible` | none | the page went to the background or came back |

Name new events `subject:verb`. A scene or panel that subscribes must unsubscribe in `exit()`.

## 4. Scenes, overlays and pausing

`core/Scene.js`, `core/SceneStack.js`.

```js
class Scene {
  frameRate = 30;      // frames per second while on top
  overlay = false;     // true: the scene below stays visible
  hud = false;         // true: played with the HUD and the touch controls (the world)
  constructor(game)
  enter(params) {}     // pushed
  exit() {}            // popped: remove every listener and timer
  pause() {}           // something was pushed on top
  resume() {}          // on top again
  update(dt) {}        // fixed step (1/60 s), only while on top
  ambient(dt) {}       // fixed step while paused but visible under an overlay
  draw(ctx) {}         // logical pixels; must not throw or change state
  resize(width, height) {}
}

game.scenes.open(id, params)    // push the scene registered under kind "scene"
game.scenes.push(scene, params)
game.scenes.pop()
game.scenes.reset(id, params)   // exit every scene, open that one (title to world and back)
game.scenes.top                 // the scene on top
game.scenes.base                // the lowest scene still drawn
```

Exactly one scene gets `update`: the top one.

- Pushing scene B over A calls `A.pause()`, then `B.resize(w, h)`, then `B.enter(params)`.
- Popping B calls `B.exit()`, then `A.resume()`.
- If B is an **overlay** (`overlay = true`), A is still drawn first and gets `ambient(dt)` instead of `update(dt)`. In the world, `ambient` keeps wind, water, weather and idle animations alive, while the hour of the day, input, movement and schedules stand still. This is how a dialog or a small menu pauses the world (world rule 41) without freezing the picture.
- If B is **not** an overlay (a battle, a full-screen menu), A is neither drawn nor stepped until B is popped.
- `WorldScene.pause()` drops any tap route and clears held input, so no step is taken on return.

```js
// ui/DialogBox.js
export class DialogScene extends Scene {
  overlay = true;
  enter({ lines }) { this.lines = lines; this.at = 0; }
  update() { if (this.game.input.takeAction() && ++this.at >= this.lines.length) this.game.scenes.pop(); }
  draw(ctx) { /* the box and the current line */ }
}
game.registry.add('scene', 'dialog', (game) => new DialogScene(game));
// later, from a system:
game.scenes.open('dialog', { lines });
```

A screen that shows nothing moving lowers its own `frameRate` (for example 10); that is the only idle mechanism (rule 13).

## 5. Interactions and steps in the world

`world/WorldScene.js`. It knows no dialog, item or quest rule. It reports what the player did and lets registered gates refuse a step.

### An interaction is an event with a target

Pressing the action key or button uses the tile in front of the player. In tap mode, a tap on something solid walks next to it, turns to it, and uses it. Both end in one event:

```js
bus.on('world:interact', ({ map, tx, ty, target, player }) => { ... });
```

`target` is one of:

| `target.kind` | Other fields | Meaning |
|---|---|---|
| `'person'` | `person` (a `Person`; data in `person.def`, current schedule slot in `person.slot`) | someone stands there |
| `'prop'` | `type`, `object` (the `{ type, x, y }` from the map description) | a prop covers the tile (when facing up, also the wall piece one tile above) |
| `'building'` | `type`, `object` | a building covers the tile |
| `'tile'` | `tile` (tile id, for example `'water'`) | nothing stands there |

```js
// systems/DialogRunner.js
game.bus.on('world:interact', ({ target, player }) => {
  if (target.kind !== 'person' || !target.person.def.lines) return;
  target.person.dir = [UP, DOWN, RIGHT, LEFT][player.dir];
  target.person.talking = true;
  game.scenes.open('dialog', { lines: target.person.def.lines, speaker: target.person });
});
```

To handle a prop type, filter on `target.kind === 'prop' && target.type === 'well'`. A registry kind `interaction` keyed by type is the natural phase 2 step; add it to section 2 when it exists.

### A gate may refuse a step

```js
registry.add('gate', id, (step) => boolean)
// step: { map: mapId, tx, ty, door: Door | null, player }   (the object is reused: read it, do not keep it)
```

Every gate is asked once when the player tries to step onto a tile that is otherwise free (or a door). Returning `true` refuses the step; the gate may open a scene to say why. Gates are not asked during path-finding.

```js
game.registry.add('gate', 'academy-door', (step) => {
  if (!step.door || step.door.to !== 'school' || game.save.state.story.academy) return false;
  game.scenes.open('academy-trial');
  return true;
});
```

### The live world

While a `WorldScene` is on top (`game.scenes.top`), systems may read and steer:

```js
world.env          // Environment: t, time, weather, wind, indoor; setTime(h), setWeather(w)
world.map          // TileMap: tileAt, solidAt, doorAt, thingAt, people, doors, ...
world.player       // Player (Actor): tx, ty, dir, moving, x, y
world.people       // Person[]: def, away, slot, talking, held, dir, placeAt(tx, ty, dir)
world.companion    // Companion: key (null in a game without one)
world.camera       // Camera: x, y, width, height
world.isBlocked(tx, ty)
world.goTo(mapId, tx, ty, dir)   // change map behind the door fade
world.effect(kind, x, y, count)  // particles at a point in map pixels ('dust', 'sparkle', 'smoke', 'ember', 'magic')
world.pointOf(type)              // the middle of the first prop or building of that type, { x, y } or null
world.addPerson(description)     // someone new on this map until it is left; returns the Person
world.removePerson(person)       // only a person added that way; true if removed
```

`companion.visible = false` takes the companion out of the picture, its light and its stroll.

A registry kind `world.layer` (`{ update(dt, world), draw(ctx, world) }`, both optional) is stepped while the world is on top and drawn in view pixels after the particles. Each call is guarded; a layer that throws is reported once and skipped from then on.

`person.held = true` stops the schedule and the glances from moving a person a scene is directing.

### Entities

```
Entity (id, x, y, visible, depth, bounds, update, draw)
  Actor (look, tx, ty, dir, frame, moving, placeAt, stepTo, walk)
    Player (trail, tryStep, advance)
    Person (def, away, slot, talking, held, followSchedule)
  Companion (key, light, sheds, joinAt)
  Prop, Building (type, def, lights)        world/Fixture.js
```

A new moving thing (a wild hontori, a pickup that bobs) extends `Entity` or `Actor`, keeps `bounds` up to date, and is added to the list the scene hands to `MapView.draw`. `draw(ctx, art, env)` paints through `art` only.

## 6. Content: how a map, a person and a door are described

Content is plain data registered under kind `map`. `game/legacyMaps.js` produces exactly this from the current game's scripts; phase 5 writes it directly.

```js
{
  id: 'village',                       // unique; doors and saves refer to it
  name: 'Emberbrook Village',          // shown to the player
  tileset: 'outdoor',                  // 'outdoor' | 'indoor'
  rows: ['gggppg...', ...],            // one string per row, one letter per tile, all the same length
  legend: { g: 'grass', p: 'path' },   // letter -> tile id the painters know
  props: [{ type: 'lamp', x: 12, y: 30 }],          // top-left tile of the footprint
  buildings: [{ type: 'tavern', x: 13, y: 16 }],    // the doorway is the middle tile of the front row
  people: [ /* person descriptions */ ],
  doors: [ /* door descriptions */ ],
  spawn: { x: 7, y: 32, dir: 0 },      // where the player stands when no tile is given
  passable: [[21, 14]],                // tiles made walkable although the ground is solid
  lights: [{ x: 120, y: 80, r: 40, color: '#ffcf7a', flicker: true }],   // extra lights, map pixels
  labels: [{ x: 7, y: 7, name: 'The pond' }],        // for the map screen
  start: { time: 9, weather: 'wind' }  // or null; used only when the game starts on this map
}
```

Tile ids, prop types, building types and looks are what `game.art` knows (`knowsTile`, `propInfo`, `buildingInfo`, `knowsLook`). A prop's footprint, solidity and light come from the painters (`art.propInfo(type)` gives `{ fw, fh, solid, decor, light }`); a `decor` prop lies flat, blocks nobody, and is baked into the ground.

A person:

```js
{
  id: 'elder',            // unique within the map
  look: 'elder',          // a character the painters know
  x: 33, y: 12, dir: 0,
  fixed: true,            // optional: never glances around
  idle: 'sweep',          // optional: one idle animation of the look instead of its usual set
  schedule: [             // optional: the day; hours 0..24, a slot may run over midnight
    { from: 7, to: 18 },
    { from: 18, to: 7, x: 5, y: 6, dir: 0 },
    { from: 22, to: 6, away: true }
  ],
  lines: [['Elder Wisteria', 'The Academy sees what others miss.']],   // carried for the dialog system
  service: 'story:talk',  // carried for systems
  goneIf: 'c1:complete'   // carried for the story system
}
```

`Person` itself reads `id`, `look`, `x`, `y`, `dir`, `fixed`, `idle` and `schedule`. Every other field is carried untouched in `person.def`, and a schedule slot may carry extra fields too (read them from `person.slot`). Nobody appears, vanishes or jumps while the player is within 7 tiles, except indoors through a door, or when the map is entered.

A door:

```js
{ x: 17, y: 20, to: 'tavern', tx: 9, ty: 10, dir: 1 }   // the tile, the target map, the arrival tile and facing
```

Stepping onto a door tile changes map behind a 0.6 second fade and then saves. A door tile may be stepped on even where the building around it is solid.

### The content checker

With `?debug=1`, `core/check.js` validates every registered map at start and prints one list. A map must produce no problems before it ships. It checks: row lengths and legend letters; known tiles, props, buildings and looks; things inside the map; doors that lead to an existing map and land on a walkable tile; a walkable spawn; unique person ids; one person per tile; walkable tiles for every person, also at every scheduled place; no solid prop on a road tile (world rule 62); and that nothing baked into the ground animates without being marked as animated in the adapter. `game.debug.problems` holds the result.

Later phases add their own checks (every item has an icon and a use, every quest step can be reached) as functions beside `checkMaps`, run from `DebugTools`.

## 7. Frame rate

`core/Clock.js` is the only code that calls `requestAnimationFrame`.

- Logic runs in fixed steps of 1/60 s (`STEP`), whatever the display rate or the frame rate.
- Rendering is capped at the top scene's `frameRate` (30 in the world).
- The loop is stopped while the page is hidden; the game is saved first.

To ask for 60 frames per second for a while (drawing a sigil):

```js
const release = game.clock.requestRate(60);
// ... the gesture ...
release();
```

The rate in force is the highest of the top scene's `frameRate` and all open requests. Always call the release function; do it in `exit()` if the request belongs to a scene.

`game.clock.stats` is `{ frames, workMs, worstMs }` (time in update plus draw per rendered frame) since `game.clock.resetStats()`.

## 8. Input

`core/Input.js`. Scenes read state; they never add DOM listeners for game input.

```js
input.dx, input.dy     // -1, 0, 1: arrows, WASD and the stick, combined
input.run              // shift or the B button
input.takeAction()     // true once per press of space, enter, Z or the A button
input.takeTap()        // { x, y, double } in client pixels, once per tap (tap mode only), else null
input.mode             // 'stick' | 'tap'; input.setMode(mode) switches (the pad hides in tap mode)
input.clear()          // forget held and pending input
```

Whoever is on top consumes `takeAction()` and `takeTap()`, so an overlay naturally keeps presses away from the world. `game.screen.toView(x, y)` turns client pixels into view pixels.

## 9. Saved state

`core/SaveStore.js`. One state object, split into sections; each system owns one section.

```js
game.save.define('inventory', { items: [], pockets: 5 });   // in main.js, before game.save.load()
// after load:
const inventory = game.save.state.inventory;                 // always complete: saved fields over defaults
inventory.items.push({ id: 'wand', n: 1 });
game.save.commit();                                          // emits "save:before", then writes
```

- **Additive defaults.** A field added to a section's defaults later appears in every old save with its default value. Never rename or reuse a field; add a new one.
- **Versions.** `VERSION` (in `SaveStore.js`) is stored with the data. When a change cannot be expressed as a default, raise `VERSION` and register `game.save.upgrade(newVersion, (data) => { ... })`, which rewrites data saved one version earlier. Upgrades run in order.
- **Slots.** `game.save.load(slot)` with slot 1 to `game.save.slots`; `peek(slot)` reads a slot's complete state without switching; `erase(slot)`. Keys are `<config.id>.save.s<slot>` (`hontori2...`); the current game's saves are not touched.
- **Live values.** State that lives elsewhere while playing is copied in on `save:before`. The `world` section (`{ map, tx, ty, dir, time, weather }`) works this way.
- The game is committed after every door and when the page is hidden. A system commits after anything the player must not lose.
- Storage that refuses never throws; the game then runs unsaved.

## 10. Drawing and art

- All art goes through `game.art` (Hontori's is `game/HontoriArt.js`). Its header lists every call: tiles, props, buildings, people, creatures, portraits, icons, shadows, lighting, weather, particles, small life.
- `env` is the world's `Environment`; painters read `t`, `time`, `weather`, `wind`, `indoor` from it.
- `MapView.draw(ctx, camera, env, actors, focus)` draws the baked ground, then fixtures and the given actors back to front, culled to the camera. Equal depths keep the order given.
- `game.assets.sheet(key, width, height, opaque)` returns a pooled offscreen sheet `{ canvas, ctx, blank }`. Paint it when `blank` is true and set `blank = false`. Ask for it every frame it is used: that is what keeps it from being released. Use it for anything that is painted from several calls and then only copied (a panel background, a battle backdrop).
- People and creatures are drawn straight through the painters, not from sheets: Hontori's painters already cache every frame they produce, and they pick breathing, blinking and idle frames from the time. Measured in phase 1 (CPU throttled 4x): a sheet copy saves 1 to 3 microseconds per person and about 15 per creature per frame, under 0.1 ms for a full screen, and loses the idle life.

### What animates (established by reading the painters, re-verified by the checker)

| Thing | Behaviour in v2 |
|---|---|
| grass, tall grass, flowers | baked; repainted on a rota 5 times a second |
| water, bridge | never baked: drawn every frame under the ground chunks |
| path, cobble, sand, every indoor tile | baked once |
| flat decoration (flower patch, lily pad, laundry line, lantern string, window, garland, wall shelf) | baked with its chunk; the chunk goes on the rota |
| trees, bushes, reeds, stalls, wind chime, bird bath, lamps, fireplace, clock, candles, cat bed, ramen pot, crystal orb, heart tree, glowcaps | drawn live every frame, depth-sorted |
| every other prop, and buildings (sign swing, chimney smoke) | drawn live every frame, depth-sorted (one image copy each) |

A new painter that animates must be added to the lists at the top of `game/HontoriArt.js`; the checker reports a tile or a decoration that animates without being listed.

## 11. The interface (HUD, panels, toasts, the kit)

The interface is DOM over the canvas, in one layer (`game.ui.layer`, class `.ui`). The kit in `ui/` gives every screen the same shapes; colours, font, icons and flavour words come from `game.theme`. A screen should not write CSS of its own.

### Register a HUD button

The round buttons at the top right are registry-driven. A button exists only if a system registered it; phase 1 registers `settings` (order 90) and nothing else.

```js
game.registry.add('hud.button', 'backpack', {
  icon: 'backpack',                 // an icon name game.art.iconUrl() knows
  label: 'Backpack',                // accessible name
  order: 10,                        // lower is higher up; the Menu is 90
  open: (game) => game.ui.openPanel('backpack'),
});
```

Register before `game.start(...)`. Buttons answer only while the world is the top scene. Suggested orders: backpack 10, quests 20, party 30, map 40.

### Open a panel

A panel is data plus a build function. `game.ui.openPanel(id)` pushes the `panel` scene: an overlay, so the world below is paused (section 4), and the clock drops to 8 frames per second while it is open. It closes on its close button, a tap on the dimmed world, or Escape.

```js
game.registry.add('panel', 'backpack', {
  icon: 'backpack', title: 'Backpack', sub: '3 of 5 pockets',
  build(panel, { game, close, refresh }) {
    const row = panel.actions();                         // a row of evenly laid out buttons
    panel.button(row, { icon: 'bread', label: 'Bread', desc: 'Calms a wild foe', kind: 'alt',
      onPress: () => { use('bread'); refresh(); } });     // refresh() builds the panel again
    panel.note('Tap a thing to use it.');
    panel.add(anyElement);                               // anything else
  },
});
```

### The kit

| Piece | File | Use |
|---|---|---|
| `Panel` | `ui/Panel.js` | `actions()`, `button(row, options)`, `note(text)`, `add(node)`, `clear()` |
| `Button` | `ui/Button.js` | `new Button(art, { icon, label, desc, kind, small, wide, onPress })`; kinds: default (main action), `alt`, `warn`, `gold`; `setText`, `setIcon` |
| `Sheet` | `ui/Sheet.js` | shows a Panel as a bottom sheet over a dimmed world: `open()`, `close()` |
| `Toast` | `ui/Toast.js` | through `game.ui.toast('Game saved')`: queued, 2.2 s each, under the top bar |
| `fitText` | `ui/TextFit.js` | `fitText(node, minPx)`: shrink one line of text until it fits, then ellipsis; call after text or box changes, never per frame |
| `element`, `icon` | `ui/dom.js` | `element(tag, className, parent, text)`, `icon(art, name)` |

Rules: every tap target is at least 44 px; positions add the safe-area insets (`--sa-t`, `--sa-b`, `--sa-l`, `--sa-r`); sizes that scale use `--u` (1% of the frame's smaller side). A full-screen scene of its own (a battle) builds its DOM in `enter()` and removes it in `exit()`, as `ui/TitleScene.js` does.

### The HUD and the controls

`ui/Hud.js` shows the top bar (time-of-day icon, place name, clock, weather word) and the buttons while the lowest visible scene has `hud = true`. The stick and the A and B buttons (`core/TouchPad.js`) show while the top scene has `hud = true` and the mode is `stick`. The player chooses stick or tap on the title; the Menu changes it later.

## 12. Making another game with this engine

`core/`, `world/` and `ui/` are reused unchanged. A new game writes its own `game/` folder, an `index.html` that loads its assets, and content. `game/main.js` is the worked example. It must provide:

1. **`config`**: `{ id, firstMap, playerLook, companion }`. `id` prefixes everything stored on the device. `companion` is `{ key, light: { r, color, flicker, soft }, sheds }` or `null`.
2. **An art provider** (`game.art`), an object with these methods (see `game/HontoriArt.js` for each signature):
   - tiles: `knowsTile`, `tileSolid`, `tileAnimates`, `tileFlows`, `tileOverhang`, `tileBeyond`, `tileIsRoad`, `drawTile`
   - props: `propInfo` (`{ fw, fh, solid, decor, light }`), `propAnimates`, `propBelongsOnRoad`, `propBounds`, `drawProp`
   - buildings: `buildingInfo` (`{ fw, fh, lights }`), `buildingBounds`, `drawBuilding`
   - actors: `knowsLook`, `drawPerson`, `drawCreature`, `portrait(kind, key)`
   - `iconUrl(name)`, `drawShadow`
   - atmosphere: `createLighting(w, h)`, `createWeather(w, h)`, `createParticles()`, `createAmbient(mapDescription)`
   - for the checker: `tileChangesOverTime`, `propChangesOverTime`
   A game that draws from image files implements the same methods with `drawImage`.
3. **A sound provider** (`game.sound`): `unlock()`, `enterPlace(mapId, env)`, `follow(env)`, `play(name)`, `setMuted(on)`. The engine plays `step`, `bump` and `door`.
4. **A theme** (`game.theme`), see `game/theme.js`:
   - `font: { family, url }`
   - `colors`: `text, accent, hud-bg, hud-place, hud-clock, round-bg, shade, panel-top, panel-bottom, panel-edge, btn-top, btn-bottom, btn-depth, btn-text, alt-top, alt-bottom, alt-depth, warn-text, gold-top, gold-bottom, gold-depth, gold-text, toast-bg, toast-text, title-glow, title-mid, title-edge, title-text, logo-top, logo-mid, logo-bottom, logo-depth, slot-bg, badge-top, badge-bottom, badge-text` (each becomes the CSS variable `--name`)
   - `icons`: `close, menu, save, controls, soundOn, soundOff, slot, time: { dawn, day, dusk, night }, weather: { <weather>: icon }`
   - `words`: `weather: { <weather>: word }, slot, newSlot, emptySlot, switchSlot`
   - `title`: `{ name, tagline, hint, mascot: { pixels, draw(ctx, art, seconds) } }`
5. **Content**: map descriptions (section 6) registered under kind `map`, with `config.firstMap` among them.
6. **Wiring** in its `main.js`, as three steps that a page calls (importing the file starts nothing): `build` makes the `Game`, sets `game.ui = new Ui(root, game)`, registers the scenes (`title`, `world`, `panel`), `game.save.define('world', WORLD_SAVE)`, `registerSettings(game)`, the systems (`Hud`, `WorldSound`), the maps, then the content and the lanes in the order of section 14; `load` loads the save; `start` calls `game.start('title')`.

Not themed yet: the colours of the stick and the A and B buttons (`core/TouchPad.js`) and the kit's plain English labels (Save, Controls, Sound); the Text system of phase 4 takes the labels over.

## 13. Debug URL

`v2/?scene=village&tx=30&ty=13&time=22&weather=rain&debug=1`

| Parameter | Meaning |
|---|---|
| `scene` | skip the title and start on this map; never a new journey, so the prologue is not played |
| `flags` | with `scene`: story flags to set, comma separated (`flags=intro,c1:morning`) |
| `tx`, `ty` | start tile |
| `time` | hour, 0 to 24 |
| `weather` | `clear`, `rain`, `wind`, `snow`, `fog` |
| `controls=tap` | tap to move (stored as the device's choice) |
| `slot` | saved journey, 1 to 3 |
| `debug=1` | content check at start; `T` adds three hours, `R` changes the weather; `window.game` is the Game |

## 14. Phase 2: story, quests, items and time as one game

`game/main.js` `build` installs, in this order: engine scenes, save sections, HUD and sound; the maps; `systems/story` then `game/story` (content folders as kind `content`, in load order); every folder's quests as kind `quest`; `systems/quests` (after the HUD); `game/items`; `game/time`; `game/story/party.js`; `game/story/battle.js` (the battle screen and its starter); last the stand-ins (`game/story` `installStandIns`, `systems/story/Pending.js` `installPending`). Systems start in that order.

### Kinds

| Kind | Id | Value |
|---|---|---|
| `content` | folder id | a content folder (content/schema.md), in load order |
| `quest` | quest id | a quest definition, in folder order |
| `story.command` | verb; an extension as `ext:<name>`; a named ask as `ask:<name>` | `(node, ctx) => undefined \| 'stop' \| 'pass' \| Promise` |
| `story.condition` | key; `ext:<name>` | `(node, ctx) => boolean` |
| `story.value` | key; `ext:<name>` | `(node, ctx) => any` (`day`, `companion`, `leadKind` are answered this way too) |
| `story.speaker` | any | `(speaker, ctx, story) => speaker` |
| `service` | `story`, `quests`, `items`, `time`, `mana`, `battle` | an object other systems call (below) |
| `world.layer` | any | `{ update(dt, world), draw(ctx, world) }` (section 5) |
| `map.marker` | any | `(mapId, game) => [{ x, y, color, legend }]` spots on the area map |
| `story.pending` | `<kind>/<id>` | `{ kind, id, phase }`: a stand-in is in place (a list for reports) |

One signature everywhere: `(node, ctx)`. `node` is the command, condition or value object from the content. `ctx` is the story runner's context: `vars` (the script's variables), `self`, `person`, `obj`, `battle`, `visit`, `target` (`{ kind, type, id, person, map, x, y }`, what is being used), and `value(v)`, `test(cond)`, `text(id, params)`, `run(commands)` (more commands inside the running script; a Promise of the signal), `story` (the runner). A question asked outside a script gets the same context with empty variables.

Who owns what: story (`systems/story`): say choose if branch cycle random repeat set run stop pass flag unflag mark wait fade blackout flash shake ask move face place spawn remove fx note companion battle, conditions flag all any not atLeast hour weather indoor map area var mark obj tile chance battle, values var pick add max min clock obj. Quests: command and condition `quest`, condition `step`. Items: give take find money spend shop heal; has owns coins party; price coins item. Time: rest time; mapRest; day; `ext:mana`, `ext:revealMap`. `game/story/party.js`: companion, leadKind, `ext:leadLevel`, `ext:lead`, `ext:addHontori`. `game/story/battle.js`: `ext:learn`, `ext:spell`.

### Services

| `service` id | What it offers |
|---|---|
| `story` | the StoryRunner: `test(cond)`, `text(id, params)`, `run(commands)` (waits until the world is calm; resolves when run), `helper(card)`, `flag`, `setFlag`, `busy`, `world`. Also `game.story` and `game.text(id, params)` |
| `quests` | the Quests system (`status`, `begin`, `finishStep`, `goal`, ...) |
| `items` | the Items system (`inventory`, `money`, `party`, `give`, `take`, `earn`, `pay`) |
| `time` | `day`, `today()`, `rest`, `setTime`, `addTime`, `newDay`, `weatherOf`, `explored` |
| `mana` | `get`, `set`, `max`, `add`, `fill` (saved in section `mana`: `{ mana, maxMana }`) |
| `battle` | `game/story/battle.js`: `{ start(battle, ctx, node) -> Promise<{ result, won, captured, lost, fled, wild, opponent }> }`. `battle` is the `battle` key of the command (schema section 9). The starter opens the screen, writes down what the battle left behind, emits `battle:end` with the same result and resolves. In a game without one the `battle` command notes it once on the console and goes on with `{ won: true }` |

### Events

| Event | Payload | From |
|---|---|---|
| `story:flag` | `{ name, value }` | story: a flag changed (`visited:<map>` on entering a map, `ev:<id>`, `help:<id>`) |
| `story:end` | `{}` | story: a script ended |
| `helper:moment` | `{ name }` | any system: a first-touch moment (`ui:questPill`, `ui:questLog`, `compass:offscreen`); the story shows the card whose `when` is that name |
| `quest:change` | `{ id, why }` | quests |
| `inventory:change`, `money:change`, `party:change` | see `systems/items` | items |
| `time:day` | `{ day, weather, reason }` | time: a new day began |
| `time:set` | `{ hour }` | time: a script set the hour |
| `time:rest` | `{ from, to, hours, day, map }` | time: the player woke. Items heal the party on it and then emit `party:rested` |
| `party:rested` | `{}` | items: after a night's rest or `{ heal: { rest: true } }`. The one event that refills what only rest refills (mana listens here, nowhere else) |
| `battle:end` | the result | the battle starter; the story fires `battleEnd` events from it |
| `battle:after` | `{ how: 'wake' \| 'restore', result }` | the `battle` command; items wake or heal the party |
| `map:explored` | see `systems/time/Explored.js` | time |

### Battles

The battle screen is the scene `battle` (`game/battle-scene`, on the engine's `systems/battle-scene`); it is not an overlay, so the world below is neither drawn nor stepped. `startBattle(game, setup, { biome, tutorial, joinsParty, rewards, random })` opens it and resolves to `{ result, report, rewards }` (`result`: `'won' | 'captured' | 'lost' | 'fled' | 'foeFled'`; null when the scene was removed from outside). It writes nothing.

The story reaches it through `service` `battle` (`game/story/battle.js`), the only caller. It builds the setup of `game/battle/setup.js`: the party (`save.state.party.members`), the wand (`save.state.mana`, and the save section `wand`: `{ level, exp, spells, loadout, spellXp, spellMastery }`), the bag, and either a content trainer (`{ opponent: id }`: name, look, team with levels as values, lesson, rules) or a wild hontori (`{ wild: { kind, level } }`); the rules `noCapture`, `noSwitch`, `sureBind` become setup flags. After the battle it applies the report and the rewards: health and stamina, things used, EXP and levels (`growth.award`), the purse once per trainer and the coins dropped after a lost wild battle (through the items system), mana and wand EXP (`growth.wandAward` raises `mana.maxMana`), spell practice, and the save section `kinds`: `{ seen, bound, resting, boundOnce, purses, battles }`. A bound hontori joins the party while there is room, else it rests (`kinds.resting`). A `practice` duel heals the party. The first wild battle of a journey is the tutorial. `game.sound.battle('wild' | 'duel' | null)` switches the music; the scene calls it. Which tune a place plays is data: `game/music/places.js` has one row per group of maps (`day`, `night`, `duel`, `wild` song keys) and `game/music/songs.js` the songs in the synthesizer's format; `HontoriSound` asks `game/music/` on every map change, so a new town's music needs no code.

### Stand-ins

A command, condition or value that no system owns is registered through `pending(game, kind, id, { phase })` (`systems/story/Pending.js`). **No stand-in may grant progress.** A stand-in command stops its script (nothing after it runs: no flag, no item, no pass), a condition is false, a value is null. With the debug tools it says `Not built yet: "<id>"` once, on the console and as a toast; in a normal start it does nothing. The same rule holds inside real handlers: a trial whose test type nobody registered, or whose test throws, is not passed (`systems/features/Trials.js`). After phases 4 and 5 no stand-in is in place; `installPending` remains as the safety net for the core commands.

## 15. Phases 4 and 5: world, panels and features

`build` installs, after `game/story/battle.js`: `game/panels`, `game/world`, `game/features`, then `installPending`. Their words are in `content/shared/text.en.js`; the world map's data is the shared folder key `world` (`content/shared/world.js`: `regions: [{ id, name, x, y, element, ring, why, maps: [map ids] }]`, `roads`, `mountains`).

### Kinds

| Kind | Id | Value |
|---|---|---|
| `story.command` | `forage`, `puzzle`, `pickup` (world); `story`, `trial`, `ask:name`, `offer`, `open` (features); `helper` (panels); `ext:draw`, `ext:cast`, `ext:ring`, `ext:bloom` | `(node, ctx)` as in section 14 |
| `story.condition` / `story.value` | `ext:ring`, `ext:full` / `ext:fishWeight` | |
| `companion.entrance` | name (`chimney`) | `(node, ctx) => Promise`: the animation of `{ companion: 'join', entrance }`; the script waits, and the companion stands beside the player afterwards |
| `trial.test` | type (`sight`, `sigil`, `push`) | `(test, ctx, trial) => boolean \| Promise<boolean>`; only `true` passes |
| `picture.painter` | `main` | `{ paint(g, scene, env, k, size) }` for the picture story |
| `closeup` | id (`blackboard`) | `(frame, { game, data, text }) => void`: fills the close-up that `{ open: id }` shows; content `screens[id].notes` is a board of pinned notes without a builder |
| `title.action` | any | `{ label \| label(game), showIf(game), open(game) }`: a text link on the title |
| `hud.button` | id | also `enabled(game)` and `refreshOn: [events]`: while `enabled` answers false the button is dimmed (class `off`), never hidden, and `open` is still called so the owner can say why in one line (the Map until the map is carried) |
| `gate` | `world:pickups`, `world:puzzles` | section 5 |
| `service` | `puzzles` `{ solved(id), reset(id) }`, `wild` (the roaming wild ones), `ride` `{ riding() }` | |
| `panel` | `party`, `sanctum`, `spells`, `memory` | section 11 |

### Engine additions

- `extendPanel(registry, id, { before, after })`, `setHead`, `swapPanel(game, id)` (`ui/PanelExtras.js`): add to another system's panel; `swapPanel` changes the open sheet in place through `PanelScene.show(id)`.
- The guide (`game/panels/guide.js`, `ui/HelperCard.js`) owns the `helper` command: `guide.show(id, { title, text, target, still })`. A card of the content may carry `helpers[].target`: a CSS selector or `hud:<button id>`; the card never covers its target.
- `Actor.painter` (a function that paints the actor instead of its look) and `Player.pace` (a factor on the seconds per tile): riding sets both and resets them; no method of the player is replaced.
- `Runner.setFlag(name, undefined)` removes a flag (`unflag` uses it); `Runner.hideLine()` puts the dialog box away, and a `wait` of 300 ms or more does so.
- `ChoiceList` options accept `iconUrl`; the battle service reads `battle.biome`; `art.portrait(kind, key, stage)`.
- `ShopPanel`: a tap selects a good and shows what it does; only the Buy (or Sell) button in that card trades.
- `Entitlement(keys, storage)`: the unlock state is kept in the game's storage (`game.storage`); the current game's `hontori.full` is still read.

### Events

| Event | Payload | From |
|---|---|---|
| `ring:earned` | `{ element }` | `game/features/rings.js` |
| `helper:moment` | `{ name: 'pickup:<item>' }` | the world lane, when a home thing is taken |

### Debug

`?scene=...&flags=intro,...` gives an empty journey the fire hontori and the wand; `level=<n>` sets its level.
