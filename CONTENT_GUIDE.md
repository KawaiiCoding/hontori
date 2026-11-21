# Content Guide (partial)

Plain classic scripts. Each file starts with `window.H = window.H || {};`. Add new files to `index.html`.

## Map
```js
H.maps.my_room = {
  name: 'My Room', w: 10, h: 8, tileset: 'indoor',
  ground: ['WWWWWWWWWW', 'WWWWWWWWWW', 'FFFFFFFFFF', /* h rows of w chars */],
  legend: { W: 'wall', F: 'floor_wood', R: 'rug' },
  props: [{ type: 'bed', x: 1, y: 2 }],
  npcs: [], doors: [], spawn: { x: 5, y: 6, dir: 1 }, env: { time: 9, weather: 'clear' }
};
```

## Door
Stepping on tile (x, y) loads map `to` at (tx, ty).
```js
H.maps.my_room.doors.push({ x: 5, y: 7, to: 'village', tx: 9, ty: 15, dir: 0 });
```

## NPC
`lines` are [name, text]; the first two play on talk. `svc` names an H.interact service run after talking. `idle` picks an idle action.
```js
{ key: 'girl', x: 4, y: 5, dir: 0, lines: [['Juno', 'Hello.'], ['Juno', 'Nice day.']], svc: 'shop_counter', idle: 'read' }
```

## Item
```js
H.game.addItem('tide_pearl', 'Tide Pearl', 'backpack'); // id, name, icon (H.items id or H.icons name)
```

## Quest (src/quests.js)
```js
H.story.defineQuest({ id: 'my_quest', title: 'A Small Favor', desc: 'Optional line.',
  steps: [
    { id: 'talk', text: 'Talk to Juno' },                         // completed by H.story.completeStep
    { id: 'pearl', text: 'Find a Tide Pearl', done: s => s.items.some(i => i.id === 'tide_pearl') }
  ],
  reward: { item: { id: 'kite', name: 'Kite' } } });               // or reward: api => { ... }
H.story.start('my_quest');
```

## Event
`when`: 'mapEnter' | 'talk' | 'interact' | 'auto'. `once` defaults to true.
```js
H.story.defineEvent({ id: 'juno_hello', when: 'talk', npc: 'Juno', cond: s => !H.story.isDone('my_quest'),
  run: async (a) => {
    await a.say('girl', 'Juno', 'Could you find me a pearl?');
    a.startQuest('my_quest'); a.completeStep('my_quest', 'talk');
  } });
H.story.defineEvent({ id: 'pond_look', when: 'interact', map: 'village', svc: ['bench', 'reeds'], run: async (a) => { await a.say('kid', 'You', 'Quiet water.'); } });
H.story.defineEvent({ id: 'wood_first', when: 'mapEnter', map: 'whisperwood', run: async (a) => { a.toast('Whisperwood'); } });
```
api: `say(key, name, text)`, `lines([[key,name,text],...])`, `choose(opts)`, `toast`, `fade(ms)`, `blackout(fn, ms)`, `wait(ms)`, `setTime(h)`, `give(id)`, `addHontori(key)`, `battle(enemy)`, `draw(kind, text)`, `setFlag`, `getFlag`, `startQuest`, `completeStep`.
Talk events tag matching npcs with `svc: 'story:talk'` (an existing svc still runs afterwards).

## Not written yet
School, spirit stage sections.
