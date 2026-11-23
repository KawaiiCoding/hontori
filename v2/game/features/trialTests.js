/*
 * trialTests.js  (Hontori: features)
 * Job: Hontori's entrance tests of a school (content/schema.md section 14), run by the engine's trial
 * command (systems/features/Trials.js). As in the current game (src/engine.js academyTrial):
 *   sight   a great spirit appears beside the gate; the Veilbound would see nothing there. Pick what you
 *           see out of three: the right description, another spirit's, or an empty courtyard.
 *   sigil   draw a sigil you already know.
 *
 * Public API:
 *   installTrialTests(game)   registers "trial.test" "sight", "sigil" and "push" (a push puzzle that is solved)
 *
 * Test fields: who (the person who speaks), intro, ask, wrong, fail, pass (text ids; pass gets {kind}),
 *   stage (the spirit's stage, default 5), options (how many answers, default 3), sigil, text
 */

import { kinds } from './content.js';
import { addFloat } from './floats.js';
import { drawSigil } from './sigil.js';

const GREAT = 5;

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function sound(game, name) {
  try {
    game.sound.play(name);
  } catch (error) {
    /* silent */
  }
}

/* the spirit is painted once into its own canvas: a great one's painter reads its pixels back, so
   painting it every frame would read the canvas again and again */
const PORTRAIT_W = 128;
const PORTRAIT_H = 128;
const PORTRAIT_X = 64;
const PORTRAIT_Y = 96;

function paintOnce(game, key, stage, env) {
  const canvas = document.createElement('canvas');
  canvas.width = PORTRAIT_W;
  canvas.height = PORTRAIT_H;
  const g = canvas.getContext('2d');
  try {
    game.art.drawCreature(g, key, PORTRAIT_X, PORTRAIT_Y, env, { stage, dir: 0 });
  } catch (error) {
    console.warn('Sight test: the spirit could not be painted', error);
  }
  return canvas;
}

/* the great spirit beside the gate, fading in and floating softly */
function showSpirit(game, world, key, stage) {
  const x = world.player.x + 30;
  const y = world.player.y - 26;
  const since = performance.now();
  let portrait = null;
  world.effect('magic', x, y, 50);
  const remove = addFloat(game, {
    draw(ctx, scene, now) {
      const env = scene.env;
      game.art.drawShadow(ctx, x, y + 18, 12, 4, env);
      const alpha = Math.min(1, ((now - since) / 1000) * 1.5);
      ctx.save();
      ctx.globalAlpha = alpha;
      const picture = portrait || (portrait = paintOnce(game, key, stage, env));
      ctx.drawImage(picture, Math.round(x) - PORTRAIT_X, Math.round(y + Math.sin(env.t * 2) * 2) - PORTRAIT_Y);
      ctx.restore();
    },
  });
  return { x, y, remove };
}

async function sight(game, test, ctx) {
  const say = (id, params) => (id ? ctx.run([{ say: id, who: test.who, params }]) : undefined);
  const world = ctx.story.world;
  const all = kinds(game);
  if (!world || !all.length) return false;
  const stage = Math.max(1, Math.min(GREAT, Number(test.stage) || GREAT));
  await say(test.intro);
  const picked = all[Math.floor(Math.random() * all.length)];
  const shown = showSpirit(game, world, picked.kind, stage);
  sound(game, 'sparkle');
  await ctx.run([{ wait: 900 }]);
  try {
    await say(test.ask);
    const stageOf = (kind) => (kind.stages && (kind.stages[stage - 1] || kind.stages[kind.stages.length - 1])) || {};
    const others = shuffle(all.filter((kind) => kind.kind !== picked.kind));
    const right = { label: ctx.text(stageOf(picked).desc), right: true };
    const answers = [right];
    const count = Math.max(2, Number(test.options) || 3);
    for (const kind of others.slice(0, Math.max(0, count - 2))) answers.push({ label: ctx.text(stageOf(kind).desc) });
    if (test.wrong) answers.push({ label: ctx.text(test.wrong) });
    shuffle(answers);
    const index = await ctx.story.choose(answers.map((a) => ({ label: a.label, desc: '' })));
    if (ctx.story.ended(ctx)) return false;
    if (!answers[index] || !answers[index].right) {
      sound(game, 'bump');
      shown.remove();
      await say(test.fail);
      return false;
    }
    sound(game, 'confirm');
    await say(test.pass, { kind: stageOf(picked).name });
    world.effect('sparkle', shown.x, shown.y, 30);
    return true;
  } finally {
    shown.remove();
  }
}

async function sigil(game, test, ctx) {
  if (test.intro) await ctx.run([{ say: test.intro, who: test.who }]);
  await drawSigil(game, ctx.value(test.sigil), test.text ? ctx.text(test.text) : '');
  if (ctx.story.ended(ctx)) return false;
  const world = ctx.story.world;
  sound(game, 'wand');
  if (world) world.effect('magic', world.player.x, world.player.y - 16, 60);
  if (test.pass) await ctx.run([{ say: test.pass, who: test.who }]);
  return true;
}

/* a push puzzle is passed when the puzzles service says it is solved */
function push(game, test) {
  const puzzles = game.registry.get('service', 'puzzles');
  try {
    return !!(puzzles && puzzles.solved(test.puzzle));
  } catch (error) {
    return false;
  }
}

export function installTrialTests(game) {
  game.registry.add('trial.test', 'push', (test) => push(game, test));
  game.registry.add('trial.test', 'sight', (test, ctx) => sight(game, test, ctx));
  game.registry.add('trial.test', 'sigil', (test, ctx) => sigil(game, test, ctx));
}
