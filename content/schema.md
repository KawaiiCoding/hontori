# Content schema

Content is plain data: ES modules that `export default` objects, arrays, strings, numbers and booleans. No functions, no classes, no computed values at load. Every rule below is checked by `content/check.mjs`.

The schema has two parts. **Core** (sections 1 to 12) is generic: it names nothing from one game and is what the engine's systems read. **Extensions** (section 13) are named commands, conditions, values, battle rules and test types that a game layer registers; the core only knows that they exist and asks the registered validator to check them. Section 14 lists the Hontori extensions.

## 1. A content folder

```
content/<folder>/
  index.js      export default { id, title, people, events, scripts, quests, shops, trials, wild, trainers,
                                 interactions, pickups, puzzles, story, text }   (every key optional)
  people.js  events.js  quests.js  shops.js  trials.js  wild.js  trainers.js  text.en.js ...
```

`content/shared/` is a folder like any other, loaded first; it also holds `items`, `voices`, `maps`, `kinds` (the creature list), `money`, `forage`, `waters` and the extension declarations. Folders load in the order `shared`, `prologue`, `ch1`, `ch2`, ...; ids are global: one id means one thing across every folder (rule 9).

## 2. Text

Every string a player can see is a text id. `text.en.js` is a flat table `{ 'ch1.mom.morning.1': 'Good morning, sweetheart.' }`. Another language is another file with the same ids (`text.de.js`). Ids are lower case, dot separated, prefixed by their folder (`shared.`, `pro.`, `ch1.`, `ch2.`).

- A text may hold `{name}` placeholders, filled from `params`. A param value is a text id, a number, or a **value** (section 5). `{companion}` (the lead companion's given name, or its kind name) and `{player}` are always available.
- A text id may be the empty string `shared.empty` when a slot shows nothing.

## 3. People

```js
{ id: 'bram', name: 'ch1.name.bram', look: 'guard',
  at: { map: 'village', x: 32, y: 37, dir: 0 },        // dir: 0 down, 1 up, 2 left, 3 right
  fixed: true, idle: 'sweep',                          // optional, as in INTERFACES.md section 6
  lines: ['ch1.bram.1', 'ch1.bram.2'],                 // small talk, said in order (at most two per talk)
  service: 'ch1.svc.shop',                             // optional script id run after small talk
  schedule: [ { from: 7, to: 18 }, { from: 18, to: 7, map: 'moss_house1', x: 5, y: 6, dir: 0, lines: [...] },
              { from: 22, to: 6, away: true } ],
  phases: [ { if: <cond>, at, schedule, lines, service, fixed } ],
  goneIf: <cond>,                                      // not in the world at all while true
  spawned: true }                                      // only present after a `spawn` command
```

- A schedule slot covers hours `from` (inclusive) to `to` (exclusive) and may run over midnight. A slot may move the person to another `map`; a slot without a place keeps `at`.
- `phases` are checked in order; every phase whose condition holds overrides the fields it names (the last one wins). A phase is how a person's words, place or day change with the story.
- One person is in one place: for every hour and every reachable state, at most one placement is active (checked: slots of one schedule do not overlap; a person placed on two maps must have those placements separated by conditions or hours).

A phase may also change the person's display name (`name: id`): someone who gives their name later in the story.

## 4. Conditions

A condition is data. A bare string is a flag.

| Form | True when |
|---|---|
| `'c1:pip'` or `{ flag: 'c1:pip' }` | the flag is set (not false, not missing) |
| `{ flag: 'x', is: v }` | the flag equals `v`; `v: 'today'` means the stored day equals today |
| `{ all: [c...] }`, `{ any: [c...] }`, `{ not: c }` | logic |
| `{ atLeast: n, of: [c...] }` | at least n of the conditions hold |
| `{ hour: [from, to] }` | the hour is in `[from, to)`, wrapping past midnight (`[19, 5]` is night) |
| `{ weather: 'rain' }`, `{ indoor: true }`, `{ map: 'village' }` | the world |
| `{ area: { map, x: [x0, x1], y: [y0, y1] } }` | the player stands inside the box (inclusive) |
| `{ has: 'saddle' }`, `{ has: { tag: 'fish' } }`, `{ owns: 'saddle', n: 2 }` | the bag holds the item (or one with the tag) |
| `{ quest: 'academy', is: 'none' \| 'active' \| 'done' }` | quest state |
| `{ step: ['academy', 'duel'] }` | that quest step is done |
| `{ coins: { gte: 10 } }`, `{ var: 'best', gt: { var: 'his' } }` | comparisons: `eq ne gt gte lt lte` |
| `{ companion: true }` | a companion walks with the player |
| `{ party: { hurt: true } }`, `{ party: { size: { gte: 1 } } }`, `{ party: { named: true } }` | the party; `named`: the lead has a given name |
| `{ battle: { won: true, captured: false, wild: true } }` | the last battle's result (inside `battleEnd` events and battle branches) |
| `{ mark: 'forage', is: 'today' }` | a mark on the thing being used (section 6, `mark`) |
| `{ obj: { element: 'water' } }` | a field of the prop or person being used |
| `{ obj: { has: 'text' } }`, `{ tile: ['grass'] }`, `{ mapRest: false }` | the used thing has a field; the tile underfoot; the map allows resting |
| `{ chance: 0.4 }` | a random roll (only in commands, never in triggers or quest steps) |
| `{ ext: 'name', ... }` | a registered extension condition (section 13) |

## 5. Values

Where a number is expected (a level, a price, a param), a value may be: a number; `{ var: 'cast.kg' }` (a local variable of the running script); `{ price: 'ramen' }` (from `shared/money.js`); `{ pick: [[cond, value], ...], else: value }` (the first whose condition holds); `{ add: [v, v] }`, `{ max: [v, v] }`, `{ min: [v, v] }`; `{ coins: v }` (formatted as money in text); `{ item: 'fish', field: 'name' }` (a field of a found item); `{ obj: 'text' }` (a field of the used thing); `{ clock: true }` (the hour of the world as a clock shows it, `9:05`, 24 hours); `{ day: true }` (the day of the journey, what a flag stored as `'today'` holds); `{ ext: 'name', ... }`. Variables named `session.*` live for the play session; others for the running script.

## 6. Commands

A script is an array of commands. Each command is an object with one verb key; other keys are its options. Scripts run one at a time; the world is paused while one runs.

| Command | Does |
|---|---|
| `{ say: id \| [id...], who, params }` | dialog lines. `who` is a person id, a voice id (`shared/voices.js`), or `'self'` (the person being talked to) |
| `{ choose: [ { text, desc, icon, if, off, offText, then: [...] } ], cancel, highlight }` | a choice; `if` hides an option, `off` greys it; `cancel` is the index chosen by Back |
| `{ if: cond, then: [...], else: [...] }` | branch |
| `{ branch: [ { if, then } ... ], else: [...] }` | the first matching arm |
| `{ cycle: [ [...], [...] ], by: 'type' \| 'object', mode: 'step' \| 'loop' }` | the arm for this visit: `step` plays 1, 2, 3 then repeats 2..n; `loop` repeats 1..n |
| `{ random: [ [...], [...] ] }` | one arm at random |
| `{ repeat: n, until: cond, then: [...] }` | a loop with a hard limit |
| `{ set: 'best', to: value }`, `{ set: 'best', max: value }` | a local variable |
| `{ run: scriptId }` | another script, then continue |
| `{ stop: true }` | end this script |
| `{ pass: true }` | end this handler and let the next interaction handler for the same thing run |
| `{ give: itemId, n, quiet }`, `{ take: itemId \| { tag }, n, as: 'fish' }` | inventory; `take` with `as` keeps the item's fields in a variable |
| `{ find: { tag: 'fish' }, as: 'fish' }` | look for an item, store it in a variable (no change) |
| `{ money: value, why: id }` | add coins (toast unless `why: false`) |
| `{ spend: value, ok: [...], fail: [...] }` | pay if possible |
| `{ flag: 'x', value }`, `{ unflag: 'x' }` | story flags (value defaults to true; `'today'` stores the day) |
| `{ mark: 'forage', value: 'today' }` | a flag on the thing being used (per map and position) |
| `{ quest: 'id', start: true, quiet }`, `{ quest: 'id', step: 'stepId' }` | start a quest, finish a step |
| `{ battle: { opponent \| wild, level, rules: [...] }, won, lost, fled, captured, after }` | a battle (section 9); branches run on the result (`else` catches the rest); `after: 'wake'` sets fainted members to 1 health, `after: 'restore'` heals the party |
| `{ move: personId, to: [x, y] \| 'player', path: [[x, y]...], speed }` | walk a person (path-found if only `to`); the person is held until the script ends |
| `{ face: personId, dir \| 'player' }` | turn a person (`dir` 0 to 3, or toward the player) |
| `{ place: personId, at: [x, y] \| { player: [dx, dy] }, dir }` | stand a person on a tile of the current map at once, without a walk; without `dir` they face the player. The person is held there until the script ends. `to` (of `move`) and `at` both take `{ player: [dx, dy] }`: a tile counted from the player |
| `{ spawn: personId, at: { map, x, y, dir } }`, `{ remove: personId }` | bring in or take out a `spawned` person; `remove` after a `move` makes them walk off first |
| `{ companion: 'join', kind, entrance: name, from: propType }` | the first companion joins through a named entrance animation from the engine library |
| `{ wait: ms }`, `{ fade: ms }`, `{ blackout: ms, then: [...] }` | timing; `blackout` fades out, runs `then` in the dark, fades back in |
| `{ time: hour }`, `{ time: { add: hours } }` | set the hour |
| `{ rest: { hours: 8, wakeAt: [ { if, hour } ] } }` | sleep: skips hours (or wakes at the first matching hour); every rest is a full night: heal, refill, new day, whatever hour it lands on |
| `{ heal: { hp: 'full' \| 'half' \| n, rest: true } }` | heal the party; `rest` also refills what only rest refills |
| `{ sound: name }`, `{ note: [midi...], count: n \| [min, max], walk, gap, fx }` (a few notes picked, or a random walk), `{ fx: kind, n, dx, dy, at }`, `{ shake: s }`, `{ flash: true }` | effects at the thing being used; `at: 'player'` or `at: propType` (the first prop or building of that type on the map) moves an `fx` or a `note` there |
| `{ toast: id, params }`, `{ helper: id, title, text, icon }` | a short notice; the once-only first-touch card |
| `{ shop: shopId }` | the shop flow (section 10) |
| `{ story: storyId }` | a picture story (section 12) |
| `{ ask: 'name', target: 'lead', title, as }`, `{ ask: 'controls' }` | a name entry; the movement setting |
| `{ open: screenId }` | a close-up screen the UI owns (`blackboard`, `noticeBoard`, `spellbook`) |
| `{ puzzle: puzzleId, do: 'reset' }` | reset a puzzle |
| `{ forage: tableId }` | maybe find something (section 11); when nothing is found it acts as `pass` |
| `{ trial: trialId }` | run the entrance tests of a trial (section 12) in order, each test by its named type. On a pass the trial's `passed` flag is set (the door a `doors` rule ties to that flag opens) and its `onPass` commands run; on a fail the script simply goes on, and the trial can be tried again |
| `{ offer: offerId }` | a purchase offer, shown once per journey, behind the grown-up check |
| `{ ext: 'name', ... }` | a registered extension command |

## 7. Events and triggers

```js
{ id: 'c1_pip', on: { talk: 'tobin' }, if: <cond>, once: true, then: [...], thenService: true, delay: 700 }
```

| Trigger | Fires when |
|---|---|
| `{ newGame: true }` | a new journey starts |
| `{ talk: personId \| [ids] }` | the player talks to the person (replaces small talk; the service still runs unless `thenService: false`) |
| `{ interact: type \| [types], map }` | a prop or building of that type is used |
| `{ tile: 'water', map }` | a free tile of that type is used |
| `{ enter: mapId }` | the map is entered (after the door fade; `delay` in ms) |
| `{ flag: 'x' }` | the flag becomes true |
| `{ auto: true }` | the condition holds while the world is calm |
| `{ area: { map, x, y }, rearm: true }` | the player is inside the box and the condition holds; with `rearm` it can fire again after the player has left |
| `{ door: { map, to }, block: true }` | the player tries a door; `block` keeps them out (the event explains why) |
| `{ battleEnd: { wild: true } }` | a battle of that kind ended |

Entering a map sets the flag `visited:<map>`. `once` defaults to true and is saved as flag `ev:<id>`. Events are tried in load order; the first that matches runs. An event with `priority: n` (default 0) is tried before every event of a lower priority: a late chapter uses it so an earlier chapter's talk event never catches the talk first (the Wardens' rematches after the end). A person, prop or tile with no matching event falls back to its interaction handlers (section 8).

## 8. Interactions

```js
interactions: { well: [ { if: <cond>, map: 'village', then: [...] }, { then: [...] } ] }
```

Keyed by prop, building, tile or pickup type. Handlers are tried in order; the first whose `if` and `map` match runs, and a `pass` inside it moves on to the next. Later folders put their handlers in front of earlier ones. `cycle` counts visits per type (or per object).

## 9. Quests and battles

```js
{ id: 'academy', icon: 'book', title: id, desc: id, after: [ <commands run on completion> ],
  steps: [ { id: 'go', text: id | { pick: [[cond, id]], else: id }, done: <cond>, target: [ { if, map, x, y } ] } ] }
```

A step is done when its condition holds (or a `quest ... step` command finished it); steps finish in order; when all are done the quest is done and `after` runs. `target` lists map spots in order of preference; the map screen shows the first whose `if` holds, or the door toward it.

A **trainer** (`trainers.js`): `{ id, name, look, team: [ { kind, level, stage } ], rules: [...], purse: true, venue: trialId }`. A level is a value; `{ ext: 'leadLevel', add: -1, min: 4, none: 4 }` follows the player. A `wild` battle names `{ kind, level }`. `rules` are names registered as battle rules (section 13). A trainer pays its purse on the first win only (`shared/money.js`).

A folder may also hold `doors: [{ map, to, if }]` (a door that exists only while the condition holds), `rest: [{ if, hour, toast }]` (sleep wakes at that hour instead; still a full rest), `objects: [{ map, x, y, type, ...facts }]` (facts about one prop, read through `obj`), `pickups: { active, list: [{ item, map, x, y, row, respawn }] }`, `screens` (data for UI close-ups: `{ [id]: { notes: [{ title, text, color, x, y, tilt }] } }`, opened by `{ open: id }`) and `laterFlags` (flags a later chapter sets). The shared folder's `pickup: { take, leave, fullDesc, fullToast, got, putBack, ... }` (text ids) holds the words of the take-or-leave choice, and the command `{ pickup: itemId }` asks it for a thing lying in the world: taking it puts it in the bag, leaving it changes nothing, and a `respawn: 'daily'` spot returns the next day. The shared folder's `helpers: [{ id, title, text, icon, when }]` are the once-only first-touch cards: `when` is the name of a moment a system reports (`'ui:questPill'`, `'pickup:map'`) or a condition that is watched while the world is calm; a shown card sets the flag `help:<id>`.

**Battle setup.** The battle command maps one to one onto the game's battle setup (`game/battle/setup.js`): `wild.kind` -> `enemy`, `wild.level` -> `level`; a trainer gives `trainer: { name, key: look, team: [{ spirit: kind, level, stage }], lesson, ban, school: banner { name, el: element, col: color, rule } }`; the rules `noCapture`, `noSwitch`, `sureBind` become the setup flags of the same name (`noCapture` on the trainer and the battle). `practice` and `purse` are applied after the battle by the content system (healing and money), not by the setup.

**Battle options (Hontori, chapters 8 and 9).** A `battle` command may also carry `mode: 'ally'` with `ally: { name: id, look, team: [{ kind, level, stage }] }` (a double battle: someone fights beside the player), `twist: 'flawless'` (a drawing twist on the whole battle) and `music: songKey` (a tune of its own). A trainer's team member may carry `phases: [{ at: share of health, say: id }]`, and a wand duel reads the trainer's `wand: { focus, kidFocus, pattern }`.

**Runs of battles.** `gauntlets: { id: { venue, rules, done, left, stages: [{ battle, before, won }], onLeave } }` is a run of battles with a save point before each (a lost battle is tried again from that battle). `tournaments: { id: { venue, rules, done, left, title, bracket: [{ who: 'player' | person or trainer id, out: round }], between: [commands], rounds: [{ name, battle: { opponent }, twist, before, won }] } }` is the same with a standings board between rounds (shown to the player as the Champions' Board): `bracket` lists every entrant and the round they fall in, `between` runs before the board. Both are started by their extension command (section 14) and checked by `content/check.mjs`.

## 10. Shops

```js
{ id: 'nettle', keeper: 'nettle', map: 'shop', goods: 'shared.goods.packs',
  greet: id, sell: { label, labelEmpty, empty, done }, leave: id, cancel: id, short: id }
goods list: [ { item, price: value, if: <cond>, hideOwned: true, tip: id } ]
```

A shop may carry `sellRate` (default 1): what the trade pouch sells for there is multiplied by it (a town that pays more for finds from other lands).

The flow: greet with the money in hand, then Buy, Sell the trade pouch, or Nothing. Buy lists the goods whose `if` holds (`hideOwned` hides what is already owned), with price and "(not enough)". Paying gives the item, a toast and the item's `tip`.

## 11. Wild tables, forage and waters

```js
wild: { whisperwood: { count: 6, level: [2, 4], zones: [ { x, y, r, kind, w } ], hidden: 0.22 } }
```

Which kinds appear is weighted by the shared habitat table (`shared/wild.js`: per kind, feature weights, day and night factors, weather factors and rarity) and the map's zones. A habitat may name `maps: [map id ...]`: that kind lives only on those maps (a far country's creatures stay in it). `after: flag` keeps a kind away until that story flag is set (the rare ones after the ending), and `level: [min, max]` gives it its own levels instead of the map's. `forage` tables map a prop type to the things it may hide, once a day per spot. `waters` map a map to its fish (id, name, value, weight range, night only) and the kinds that bite.

## 12. Trials, puzzles and picture stories

```js
trials: { academy: { venue: 'school', door: { map: 'village', to: 'school' }, passed: 'c1:academy',
  entrance: [ { type: 'sight', ... }, { type: 'sigil', ... } ], award: { ... } } }
puzzles: { root_maze: { map, type: 'push', boxes: [[x, y]], pads: [[x, y]], gate: [x, y], solved: 'c2:maze', onSolve: [...] } }
story: { prologue: { panels: [ { text, gold, scene: { sky, ground, actors: [...], extras: [...] } } ], skip, tap, tapLast } }
```

A trial: `{ venue: mapId, door: { map, to }, passed: flag, teacher: personId, teaches: [spellId], entrance: [ { type, who, intro, ask, wrong, fail, pass, ... } ], onPass: [commands], award: { item, flag, ring } }`. `passed` is the one flag that says the entrance was passed; `entrance` tests run in order and all must be passed in one go; `award` is what graduating gives.

A trial's entrance tests and its award rules are named types from a library; the core supplies `push` puzzles and the `sigil`-free generic tests (`choice`), the game layer registers the rest (section 14). A picture story is a list of panels: one line of text and a scene described by named painter parts.

Puzzle types of the game layer (each proved fair by `node game/features/check.mjs`): `vanes`, `tide`, `circuit`, `braziers`, `watchers` (patrols with light cones and shadows to hide in; a catch is a gentle reset to the last shadow) and `mirrors` (turn mirrors to bounce a beam to its target). A content map may carry `dark: { level, sight, lantern: { item, sight, oil } }` (a dark map with a circle of light) and `always: { time, weather }` (the clock and weather are held there: a town where it is always evening).

**Credits.** `credits: { id: { title, end, skip, sections: [{ head, people: [person or voice ids], kinds: [keys] | 'seen' | 'all', lines: [text ids] }] } }` is the roll the `ending` command shows: people by their current name and face, kinds by their first stage's name and face (`seen`: every kind the journey has met, in that order). `content/check.mjs` checks every id, and that every `ending` names a story and credits that exist.

## 13. Extensions

A game layer registers each extension with a name, the kind (`command`, `condition`, `value`, `battleRule`, `testType`, `awardRule`) and a validator. Content uses them as `{ ext: 'name', ... }`, or by name in `rules`, `entrance` and `award`. The checker runs the validator on every use and reports an unknown name. The declarations of a game's extensions live in its `shared/extensions.js` so the checker can load them without the game.

## 14. Hontori extensions

| Name | Kind | Shape | Meaning |
|---|---|---|---|
| `draw` | command | `{ ext: 'draw', sigil: spellId, text: id }` | the player draws a sigil (the gesture screen) |
| `learn` | command | `{ ext: 'learn', spell: spellId }` | the spell joins the spell book (and the new-spell card shows) |
| `mana` | command | `{ ext: 'mana', set: 'full' \| n, add: n }` | the wand's mana |
| `ring` | command | `{ ext: 'ring', element }` | a ring is earned (also the ring item) |
| `cast` | command | `{ ext: 'cast', contest: bool, as: 'cast' }` | one Fishing Sigil cast at the water in front; stores `{ kind: 'fish' \| 'hontori' \| 'none' \| 'nomana', fish, name, kg, hontori, level }` |
| `revealMap` | command | `{ ext: 'revealMap', radius }` | the kite's wide view on the map |
| `spell` | condition | `{ ext: 'spell', has: spellId }` | the spell is known |
| `lead` | condition | `{ ext: 'lead', stage: { gte: 3 } }` | the lead hontori's stage or level |
| `ring` | condition | `{ ext: 'ring', has: element }` | the ring is held |
| `mana` | condition | `{ ext: 'mana', lte: 1 }` | the wand's mana |
| `full` | condition | `{ ext: 'full' }` | the full journey is unlocked |
| `leadLevel` | value | `{ ext: 'leadLevel', add, min, none }` | max(min, lead level + add); `none` when the party is empty |
| `fishWeight` | value | `{ ext: 'fishWeight', index }` | a random weight of the n-th fish of this water |
| `noCapture`, `noSwitch`, `sureBind`, `practice` | battleRule | in `rules` | binding refused; no switching; the third spiral always holds; rematch with no purse |
| `sight` | testType | `{ type: 'sight', ... }` | a great spirit appears; pick what you see out of three |
| `sigil` | testType | `{ type: 'sigil', sigil, ... }` | draw a known sigil |
| `wandTrial` | awardRule | `{ type: 'wandTrial', sigil, count, ... }` | draw a sigil n times to wake n things |
| `ringDuel` | awardRule | `{ type: 'ringDuel', trainer, rules }` | a duel whose win earns the ring |
| `travel` | command | `{ ext: 'travel', to, via, seconds, during, after }` | a ride over a crossing map (the ferry) |
| `gauntlet`, `tournament` | command | `{ ext: 'gauntlet' \| 'tournament', gauntlet \| tournament: id, won, lost }` | run the battles in a row from where the run stands |
| `gauntlet`, `tournament` | condition | `{ ext: 'gauntlet', gauntlet: id, stage }`, `{ ext: 'tournament', tournament: id, round }` | a run is open (and stands at that battle) |
| `chooseCarry`, `sanctum`, `toFront` | command | `{ ext: 'chooseCarry', n, title, sub, confirm, then, else }`, `{ ext: 'sanctum', seal }`, `{ ext: 'toFront', kind }` | choose who walks along; seal or open the Sanctum; that kind leads |
| `sanctum`, `carries` | condition | `{ ext: 'sanctum', sealed, count }`, `{ ext: 'carries', kind, element }` | the Sanctum's state; a party member of that kind or element |
| `windSwap`, `tideRise`, `noRest`, `wandDuel`, `heat`, `blind`, `pure` | battleRule | in `rules` | the ring rules of the great schools |
| `vanes`, `tide`, `circuit`, `braziers`, `watchers`, `mirrors` | testType | `{ type, puzzle: id }` | passed once that puzzle is solved |
| `tournament` | awardRule | `{ type: 'tournament', tournament: id, done }` | a tournament whose win earns the ring |
| `seal` | battleRule | in `rules` (the Grand Archmage) | the V (`veil`) joins the loadout and is never sealed; from round 2 one other spell is sealed each turn, the last slot first. Two phases: a team member's `phases: [{ at: 0.5, say }]` starts phase two, when a veil of three layers closes round the foe (each makes your blows 20% weaker); each V drawn then breaks one layer (a Flawless V two) |
| `greatV` | command | `{ ext: 'greatV', who: [person or voice ids], text, sub, done, weak }` | each one in `who` adds a stroke of a great ring, face and name shown; then the kid draws the V large (one retry, then any stroke counts); the veil lifts with `done`, or the gentler `weak` for a shaky V |
| `law` | command | `{ ext: 'law', title, sub, lines: [{ text, flag }], confirm, yes, back }` | choose one line, then confirm it; the chosen line's flag is set and the others' removed; there is no way out without a choice |
| `ending` | command | `{ ext: 'ending', story: storyId, credits: creditsId }` | the ending's music, the picture story, then the credits (skippable); the script goes on in the world |
| `keepsake` | item effect | `{ effect: 'keepsake', slot: 'hat' \| 'keepsake', look, place: { map, x, y, lift } }` | carried, the item joins the Capsule Album's Keepsakes: a hat is worn by the lead, a keepsake stands at `place` |
