/*
 * index.js  (engine: quests)
 * Job: install the quests lane: the rule system, its save section, the quest conditions and command,
 * the quest pill, the quest log panel and the compass arrow. Nothing here names a game.
 *
 * Public API:
 *   install(game, options)   call before game.start(); returns the Quests system
 *   Quests, QUESTS_SAVE, Routes
 *
 * options (all optional):
 *   test(cond) -> boolean          the condition evaluator (content/schema.md section 4)
 *   run(commands) -> Promise       the script runner, for a quest's `after` commands (schema section 6)
 *   text(id, params) -> string     the text lookup (schema section 2)
 *   showIf: cond                   the pill and compass show only while this holds (for example: the
 *                                  opening scene is over)
 *   compassIf: cond                the compass shows only while this holds (for example: a compass is carried)
 *   icon: name                     the pill's and the log's icon (default 'scroll')
 *   words: { newQuest, questDone, log, active, done, none, stepsDone, stepDone, follow }   the UI's words
 *   compass: { fill, edge }        the arrow's colours
 *
 * When test, run or text is not given, it is looked up at the moment of use, so the story lane may be
 * installed before or after this one:
 *   registry kind "service", id "story" -> { test(cond), run(commands) -> Promise, text(id, params) }
 * Missing, a condition is false, `after` does nothing and a text shows its id.
 *
 * What it registers:
 *   save section   "quests"   QUESTS_SAVE
 *   "system"       "quests"   the Quests system (Quests.js)
 *   "system"       "quests.pill"   the pill (ui/QuestPill.js)
 *   "panel"        "quests"   the quest log (ui/QuestLog.js)
 *   "world.layer"  "compass"  the arrow (ui/Compass.js): { update(dt, world), draw(ctx, world) }
 *   "story.condition"  "quest"   (node, ctx) -> boolean for { quest: id, is: 'none' | 'active' | 'done' }
 *   "story.condition"  "step"    (node, ctx) -> boolean for { step: [questId, stepId] }
 *   "story.command"    "quest"   (node, ctx) -> void for { quest: id, start: true, quiet } and { quest: id, step: stepId }
 *   "map.marker"       "quest"   (mapId) -> [{ x, y }] the followed quest's spot on that map (the area map)
 *   "service"          "quests"  the Quests system
 *
 * Events it listens to: "map:enter", "world:tick", "scene:change", "story:flag", "story:end" (re-check the steps).
 * Events it emits: "quest:change" { id, why }, and "helper:moment" { name } with the names
 * 'ui:questPill', 'ui:questLog' and 'compass:offscreen' (the first-touch cards of the content).
 */

import { Quests, QUESTS_SAVE } from './Quests.js';
import { QuestPill } from '../../ui/QuestPill.js';
import { registerQuestLog } from '../../ui/QuestLog.js';
import { Compass } from '../../ui/Compass.js';

export { Quests, QUESTS_SAVE } from './Quests.js';
export { Routes } from './routes.js';

const DEFAULT_WORDS = {
  newQuest: 'New quest: {quest}',
  questDone: 'Quest complete: {quest}',
  log: 'Quest Log',
  active: 'Active',
  done: 'Done',
  none: 'No open quests right now.',
  stepDone: '1 step done',
  stepsDone: '{n} steps done',
  follow: 'Tap a quest to follow it.',
};

function service(game, id, method) {
  const found = game.registry.get('service', id);
  return found && typeof found[method] === 'function' ? found : null;
}

export function install(game, options = {}) {
  const words = { ...DEFAULT_WORDS, ...(options.words || {}) };
  const ports = {
    test: (cond) => {
      if (options.test) return options.test(cond);
      const found = service(game, 'story', 'test');
      return found ? found.test(cond) : false;
    },
    run: (commands) => {
      if (options.run) return options.run(commands);
      const found = service(game, 'story', 'run');
      return found ? found.run(commands) : Promise.resolve();
    },
    text: (id, params) => {
      if (options.text) return options.text(id, params);
      const found = service(game, 'story', 'text');
      return found ? found.text(id, params) : id;
    },
  };
  const holds = (cond) => {
    if (cond == null) return true;
    try {
      return !!ports.test(cond);
    } catch (error) {
      return false;
    }
  };
  const moment = (name) => game.bus.emit('helper:moment', { name });
  const icon = options.icon || 'scroll';

  game.save.define('quests', QUESTS_SAVE);
  const quests = new Quests(ports, { words });
  game.registry.add('system', 'quests', quests);
  game.registry.add('system', 'quests.pill', new QuestPill(quests, { icon, words, visible: () => holds(options.showIf), moment }));
  registerQuestLog(game, quests, { icon, words, moment });
  game.registry.add('world.layer', 'compass', new Compass(game, quests, {
    ...(options.compass || {}),
    visible: () => holds(options.showIf) && holds(options.compassIf),
    moment,
  }));

  game.registry.add('service', 'quests', quests);
  game.registry.add('map.marker', 'quest', (mapId) => {
    const goal = holds(options.showIf) ? quests.goal(mapId) : null;
    return goal ? [{ x: goal.x, y: goal.y }] : [];
  });

  game.registry.add('story.condition', 'quest', (cond) => quests.status(cond.quest) === (cond.is || 'done'));
  game.registry.add('story.condition', 'step', (cond) => Array.isArray(cond.step) && quests.isStepDone(cond.step[0], cond.step[1]));
  game.registry.add('story.command', 'quest', (cmd) => {
    if (cmd.start) quests.begin(cmd.quest, { quiet: !!cmd.quiet });
    else if (cmd.step) quests.finishStep(cmd.quest, cmd.step);
  });
  return quests;
}
