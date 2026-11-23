/*
 * systems/story/index.js
 * Job: plug the story system into a game: the "story" save section, the dialog scene, the commands,
 * conditions and values the story answers itself, the door gate, and the system that runs it all.
 * Nothing here names a game: a game layer adds its content folders (registry kind "content") and
 * may add speaker hooks, values and commands of its own.
 *
 * Public API:
 *   install(game)    call before game.save.load() and game.start(); returns the StoryRunner
 *                    (also game.story once started)
 *
 * What it registers:
 *   save section     "story": { started, flags, marks, visits, spawned, talks }
 *   scene            "story"   the DialogScene (ui/DialogBox.js) a running script lives in
 *   system           "story"   the StoryRunner (Runner.js)
 *   service          "story"   the same StoryRunner: test(cond), text(id, params), run(commands), helper(card),
 *                              flag(name), setFlag(name, value) for the other systems
 *   gate             "story"   closed doors and door events that keep the player out
 *   story.command    say choose if branch cycle random repeat set run stop pass flag unflag mark
 *                    wait fade blackout flash shake ask (controls) move face place spawn remove
 *                    fx note companion (Effects.js) battle (Pending.js: it hands over to service "battle")
 *   story.condition  flag all any not atLeast hour weather indoor map area var mark obj tile chance battle
 *   story.value      var pick add max min clock obj
 *   Fallbacks used only while no system registers them: commands time, sound, toast, helper;
 *   condition companion;
 *   values coins (the plain number), price, item.
 *
 * Every handler is called as (node, ctx); ctx is the runner's context (Runner.js). Other systems
 * register their own under the same three kinds, extensions as "ext:<name>". Call installPending
 * (Pending.js) after every lane: it adds stand-ins for what no system owns yet.
 */

import { DialogScene } from '../../ui/DialogBox.js';
import { StoryRunner, STORY_SAVE } from './Runner.js';
import { COMMANDS } from './Commands.js';
import { CONDITIONS } from './Conditions.js';
import { VALUES } from './Values.js';
import { DIRECTING } from './Directing.js';
import { EFFECTS } from './Effects.js';
import { installBattleCommand } from './Pending.js';
import { checkStory } from './check.js';

export function install(game) {
  const { registry } = game;
  const story = new StoryRunner();
  game.save.define('story', STORY_SAVE);
  registry.add('scene', 'story', (owner) => new DialogScene(owner));
  for (const [verb, run] of Object.entries({ ...COMMANDS, ...DIRECTING, ...EFFECTS })) registry.add('story.command', verb, run);
  installBattleCommand(game);
  registry.add('service', 'story', story);
  for (const [key, test] of Object.entries(CONDITIONS)) registry.add('story.condition', key, test);
  for (const [key, work] of Object.entries(VALUES)) registry.add('story.value', key, work);
  registry.add('gate', 'story', (step) => story.gate(step));
  /* people a script moved walk back to their day while the world runs */
  registry.add('world.layer', 'story:homeward', { update: (dt) => story.people.stepHome(dt) });
  registry.add('system', 'story', story);
  /* the story check joins the content check of debug mode, once everything has started */
  registry.add('system', 'story-check', {
    start(owner) {
      const off = owner.bus.on('map:enter', () => {
        off();
        if (!owner.debug) return;
        const problems = checkStory(story);
        owner.debug.problems.push(...problems);
        if (problems.length) console.warn(`Story check: ${problems.length} problems\n${problems.join('\n')}`);
        else console.info('Story check: no problems');
      });
    },
  });
  return story;
}
