/*
 * main.js
 * Job: Hontori's bootstrap. It hands the engine what makes this game (its art, sound, theme, maps
 * and choices), installs every system in order, loads the saved journey and opens the first scene.
 * Importing this file starts nothing: the page (or a test page) calls the three steps itself.
 *
 * Public API:
 *   CONFIG                      the game's choices ({ id, firstMap, playerLook, companion })
 *   build(options)              make the Game and install everything; returns the Game.
 *        options: { canvas, root, storage, config, debug }   config: fields over CONFIG (a test page
 *        uses its own id so it never touches a real save); debug: true adds the debug tools
 *   load(game, slot)            load a saved journey (the last one used when slot is left out)
 *   start(game, params)         open the title, or with params.scene the world directly
 *        params: { scene, tx, ty, time, weather, flags, level }   see the URL parameters below
 *   boot(search)                the three steps for a page: reads the URL parameters
 *
 * Install order (build): the engine's scenes, save sections and HUD; the maps; the content folders
 * and their quests; the story system and Hontori's part of it; the quests (after the HUD); the
 * items; the time lane; Hontori's answers about the party; the battle screen and its starter; the
 * panels, the world lane, the features and the capsule machines; then the stand-ins for what no system owns yet. Systems start in that order when the game starts.
 *
 * URL parameters:
 *   scene=<map id>     skip the title and start on this map (for example scene=village); the story
 *                      of a new journey (the prologue) is not played
 *   tx=<n>&ty=<n>      start tile (default: the map's spawn point)
 *   time=<0..24>       hour of the day
 *   weather=<name>     clear, rain, wind, snow or fog
 *   controls=tap       tap to move (or controls=stick)
 *   slot=<1..3>        with scene: which saved journey to write to
 *   flags=a,b          with scene: story flags to set (for example flags=intro,c1:morning); with
 *                      `intro` an empty journey gets the fire hontori and the wand
 *   level=<n>          with scene and the flag intro: the level of that hontori (default 1)
 *   debug=1            content check, T and R keys, window.game
 */

import { Game } from '../core/Game.js';
import { WorldScene, WORLD_SAVE } from '../world/WorldScene.js';
import { WorldSound } from '../world/WorldSound.js';
import { DebugTools } from '../world/DebugTools.js';
import { Ui } from '../ui/Ui.js';
import { Hud } from '../ui/Hud.js';
import { PanelScene } from '../ui/PanelScene.js';
import { TitleScene } from '../ui/TitleScene.js';
import { registerSettings } from '../ui/SettingsPanel.js';
import { install as installStory } from '../systems/story/index.js';
import { installPending } from '../systems/story/Pending.js';
import { install as installQuests } from '../systems/quests/index.js';
import { HontoriArt } from './HontoriArt.js';
import { HontoriSound } from './HontoriSound.js';
import { legacyMaps } from './legacyMaps.js';
import { installMaps } from './maps/index.js';
import { theme } from './theme.js';
import { words } from './text.js';
import { install as installHontoriStory } from './story/index.js';
import { installParty } from './story/party.js';
import { installBattles } from './story/battle.js';
import { installHontoriItems } from './items/index.js';
import { install as installHontoriTime } from './time/index.js';
import { install as installPanels } from './panels/index.js';
import { install as installWorld } from './world/index.js';
import { install as installFeatures } from './features/index.js';
import { install as installCapsules } from './capsules/index.js';

export const CONFIG = {
  /* prefix of everything stored on the device */
  id: 'hontori2',
  /* a new journey begins at home, at night */
  firstMap: 'home',
  playerLook: 'kid',
  /* the fire hontori that follows the kid, its warm glow and the embers it sheds */
  companion: { key: 'hontori', light: { r: 28, color: '#b8642a', flicker: true, soft: true }, sheds: 'ember' },
};

/* the quest pill and the compass wait for the opening scene; the compass arrow needs the compass */
const QUESTS = {
  showIf: 'intro',
  compassIf: { all: [{ has: 'compass' }, { not: 'compass:off' }] },
  words: words({
    newQuest: 'shared.ui.quest.new', questDone: 'shared.ui.quest.complete', log: 'shared.ui.quest.log',
    active: 'shared.ui.quest.active', done: 'shared.ui.quest.done', none: 'shared.ui.quest.none',
    stepDone: 'shared.ui.quest.step', stepsDone: 'shared.ui.quest.steps', follow: 'shared.ui.quest.follow',
  }),
};

export function build({ canvas, root, storage, config, debug = false }) {
  const game = new Game({
    canvas,
    root,
    storage,
    config: { ...CONFIG, ...config },
    art: new HontoriArt(),
    sound: new HontoriSound(),
    theme,
  });
  game.ui = new Ui(root, game);
  const { registry } = game;

  /* the engine */
  registry.add('scene', 'title', (owner) => new TitleScene(owner));
  registry.add('scene', 'world', (owner) => new WorldScene(owner));
  registry.add('scene', 'panel', (owner) => new PanelScene(owner));
  game.save.define('world', WORLD_SAVE);
  registerSettings(game);
  registry.add('system', 'hud', new Hud());
  registry.add('system', 'sound', new WorldSound());
  if (debug) registry.add('system', 'debug', new DebugTools());

  /* the maps, then the content folders (kind "content") and their quests (kind "quest"), in load order */
  for (const map of legacyMaps(game.art)) registry.add('map', map.id, map);
  installStory(game);
  installHontoriStory(game);
  /* the parts of a map that wait for the story (a rockslide, a gap in a bridge) */
  installMaps(game);
  for (const folder of registry.all('content')) {
    for (const quest of folder.quests || []) registry.add('quest', quest.id, quest);
  }

  /* the lanes */
  installQuests(game, QUESTS);
  installHontoriItems(game);
  installHontoriTime(game);
  installParty(game);
  installBattles(game);
  installPanels(game);
  installWorld(game);
  installFeatures(game);
  installCapsules(game);

  /* last: stand-ins for what no system owns (none grants progress) */
  installPending(game);
  return game;
}

export function load(game, slot) {
  return game.save.load(slot ?? game.settings.get('slot'));
}

export function start(game, params = {}) {
  if (params.scene && !game.registry.has('map', params.scene)) console.warn(`main: there is no map "${params.scene}"; opening the title`);
  if (!params.scene || !game.registry.has('map', params.scene)) {
    game.start('title');
    return;
  }
  /* a debug start is never a new journey: the prologue is not played */
  const story = game.save.state.story;
  if (story) {
    story.started = true;
    for (const flag of params.flags || []) if (flag) story.flags[flag] = true;
  }
  game.start('world', { map: params.scene, tx: params.tx, ty: params.ty, time: params.time, weather: params.weather });
  /* past the opening the kid has the fire hontori and the wand: a debug start gives both to an empty journey */
  const party = game.save.state.party;
  if (story && story.flags.intro && party && Array.isArray(party.members) && !party.members.length && game.config.companion) {
    const runner = game.registry.get('service', 'story');
    const level = Math.max(1, Math.floor(Number(params.level) || 1));
    if (runner) runner.run([{ ext: 'addHontori', kind: game.config.companion.key, level }, { give: 'wand', quiet: true }]);
  }
}

export function boot(search = location.search) {
  const query = new URLSearchParams(search);
  const number = (name) => (query.has(name) ? Number(query.get(name)) : undefined);
  const root = document.getElementById('root');
  const game = build({
    canvas: document.getElementById('game'),
    root,
    storage: window.localStorage,
    debug: query.get('debug') === '1',
  });
  if (query.has('controls')) game.chooseControls(query.get('controls') === 'tap' ? 'tap' : 'stick');
  load(game, query.has('scene') ? number('slot') : undefined);
  start(game, {
    scene: query.get('scene') || undefined,
    tx: number('tx'),
    ty: number('ty'),
    time: number('time'),
    weather: query.get('weather') || undefined,
    flags: (query.get('flags') || '').split(','),
    level: number('level'),
  });
  return game;
}
