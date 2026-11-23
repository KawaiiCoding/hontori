/*
 * Trials.js  (engine: features)
 * Job: the story command { trial: trialId } (content/schema.md section 12): run the entrance tests of a trial
 * in order, each by its named type. All passed in one go: the trial's `passed` flag is set (a door tied to it
 * opens) and its `onPass` commands run. A failed test ends the attempt; the script goes on and the trial can
 * be tried again. It knows no test type itself: the game layer registers them.
 *
 * Public API:
 *   installTrials(game)   registers "story.command" "trial"
 *   trialOf(game, id)     the trial of that id from the content folders, or null
 *
 * Registry kind it reads:
 *   "trial.test"  type -> (test, ctx, trial) => boolean | Promise<boolean>   one entrance test
 *                 A type no system registered is noted once and ends the attempt: the trial is not passed,
 *                 and it can be tried again once the test exists. A test that throws is not passed either.
 */

export function trialOf(game, id) {
  for (const folder of game.registry.all('content')) {
    const table = folder && folder.trials;
    if (table && table[id]) return table[id];
  }
  return null;
}

export function installTrials(game) {
  const told = new Set();
  game.registry.add('story.command', 'trial', async (node, ctx) => {
    const id = ctx.value(node.trial);
    const trial = trialOf(game, id);
    if (!trial) {
      ctx.story.warnOnce(`trial:${id}`, `Features: there is no trial "${id}"`);
      return undefined;
    }
    for (const test of trial.entrance || []) {
      const type = test && test.type;
      const run = game.registry.get('trial.test', type);
      if (!run) {
        /* a test nobody can run is not passed: nothing here may grant progress */
        if (!told.has(type)) {
          told.add(type);
          console.warn(`Features: no system runs the trial test "${type}"; the trial cannot be passed yet`);
        }
        return undefined;
      }
      let passed = false;
      try {
        passed = !!(await run(test, ctx, trial));
      } catch (error) {
        console.warn(`Features: the trial test "${type}" failed`, error);
        passed = false;
      }
      if (ctx.story.ended(ctx)) return 'stop';
      if (!passed) return undefined;
    }
    if (trial.passed) ctx.story.setFlag(trial.passed, true);
    game.save.commit();
    return Array.isArray(trial.onPass) ? ctx.run(trial.onPass) : undefined;
  });
}
