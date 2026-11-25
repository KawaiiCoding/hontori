/*
 * finale.js  (Hontori: features)
 * Job: the moments of the last chapter on the engine's screens: the Great V (systems/features/GroupDrawing.js and
 * the drawing prompt), the choice of the new law (LineChoice.js), the ending (a picture story, then the credits,
 * Credits.js, with the ending's music), and the story flags for the music of a place (the fair after the end).
 *
 * Public API:
 *   installFinale(game)   registers:
 *     story.command "ext:greatV"  { ext: 'greatV', who: [person or voice ids], text, sub?, done?, weak? }
 *                                 each one in `who` adds a stroke of the ring, with their face and name; then the
 *                                 kid draws the V large across the screen (one retry, then any stroke is taken: the
 *                                 moment never fails); the V blazes and the veil lifts with `done`, or with the
 *                                 gentler `weak` when the drawing was weak or not a V. The script waits.
 *     story.command "ext:law"     { ext: 'law', title, sub?, lines: [{ text, flag }], confirm?, yes?, back? }
 *                                 choose one line, then confirm it; the chosen line's flag is set and the others'
 *                                 removed. The script waits; there is no way out without a choice.
 *     story.command "ext:ending"  { ext: 'ending', story: storyId, credits?: creditsId }
 *                                 the ending's music, the picture story, the credits (skippable), then the place's
 *                                 music again; the script goes on in the world.
 *     game.sound.useFlags(test)   the music rows with `after` (game/music/places.js) follow the story flags
 *   creditSections(game, def)     the credits' sections with names and faces (pure but for the art; for checks)
 *
 * Content `credits`: { id: { title, end, skip?, sections: [{ head, people?: [ids], kinds?: [keys] | 'seen' | 'all',
 *   lines?: [text ids] }] } }   people show their current name and face, kinds their first stage's name and face
 *   ('seen': every kind the journey has met, in the order met; 'all': every kind).
 */

import { openGroupDrawing, chooseLine, rollCredits, playPictureStory } from '../../systems/features/index.js';
import { sigils } from '../battle-scene/sigils.js';
import { drawSigil } from './sigil.js';
import { kinds, kindOf } from './content.js';
import { word } from './words.js';

/* soft colours for the strokes of the ring, one each in turn */
const STROKE_COLORS = ['#ffd98a', '#9fd0ff', '#9cf0a6', '#ffb35a', '#b9a8ff', '#ffe6b0', '#7ff0ff', '#ffa8c8', '#fff2a8'];
const VEIL = '#b8b0c8';
/* the accuracy under which a sigil is weak (game/battle/spells.js gradeOf) */
const STRONG = 0.25;
const V_SCALE = 1.6;

function sound(game) {
  return game.sound && typeof game.sound.battle === 'function' ? game.sound : null;
}

function guard(fn, fallback) {
  try {
    return fn();
  } catch (error) {
    return fallback;
  }
}

function personPortrait(game, look) {
  return guard(() => (look ? game.art.portrait('person', look) : null), null);
}

function creditsOf(game, id) {
  for (const folder of game.registry.all('content')) {
    const table = folder && folder.credits;
    if (table && table[id]) return table[id];
  }
  return null;
}

function speakerOf(game, id) {
  const story = game.registry.get('service', 'story');
  return guard(() => (story ? story.speaker(id) : null), null) || { id, name: '', look: null };
}

function kindEntry(game, key) {
  const kind = kindOf(game, key);
  if (!kind) return null;
  const first = Array.isArray(kind.stages) && kind.stages[0] ? kind.stages[0].name : key;
  return { name: word(game, first), portrait: guard(() => game.art.portrait('creature', key, 1), null) };
}

function kindKeys(game, list) {
  if (list === 'all') return kinds(game).map((k) => k.kind);
  if (list === 'seen') {
    const seen = guard(() => game.save.state.kinds.seen, []);
    return Array.isArray(seen) ? seen : [];
  }
  return Array.isArray(list) ? list : [];
}

export function creditSections(game, def) {
  return (Array.isArray(def && def.sections) ? def.sections : []).map((section) => {
    if (!section) return null;
    const names = [];
    for (const id of Array.isArray(section.people) ? section.people : []) {
      const who = speakerOf(game, id);
      if (who.name) names.push({ name: who.name, portrait: personPortrait(game, who.look) });
    }
    for (const key of kindKeys(game, section.kinds)) {
      const entry = kindEntry(game, key);
      if (entry) names.push(entry);
    }
    for (const id of Array.isArray(section.lines) ? section.lines : []) names.push({ name: word(game, id) });
    return { head: section.head ? word(game, section.head) : '', names };
  }).filter(Boolean);
}

async function greatV(game, node, ctx) {
  const who = Array.isArray(node.who) ? node.who : [];
  const strokes = who.map((id, i) => {
    const sp = speakerOf(game, ctx.value(id));
    return { name: sp.name || '', portrait: personPortrait(game, sp.look), color: STROKE_COLORS[i % STROKE_COLORS.length] };
  });
  const shape = guard(() => sigils.glyph('veil'), []);
  const scene = openGroupDrawing(game, { strokes, shape, veil: VEIL });
  await Promise.race([scene.ready, scene.result]);
  if (scene.ended || ctx.story.ended(ctx)) return ctx.story.ended(ctx) ? 'stop' : undefined;
  let drawn = null;
  const text = node.text ? ctx.text(node.text, node.params) : '';
  const sub = node.sub ? ctx.text(node.sub, node.params) : undefined;
  await drawSigil(game, 'veil', text, sub, { scale: V_SCALE, forgive: 1, onDrawn: (r) => { drawn = r; } });
  const strong = !!(drawn && drawn.matched && drawn.accuracy >= STRONG);
  const words = strong ? node.done || 'shared.feat.greatV.done' : node.weak || 'shared.feat.greatV.weak';
  await scene.lift({ text: ctx.text(words, node.params) });
  return ctx.story.ended(ctx) ? 'stop' : undefined;
}

async function law(game, node, ctx) {
  const given = Array.isArray(node.lines) ? node.lines.filter((l) => l && l.text) : [];
  if (!given.length) {
    ctx.story.warnOnce('law:lines', 'Features: a law choice without lines');
    return undefined;
  }
  const pick = await chooseLine(game, {
    title: node.title ? ctx.text(node.title, node.params) : '',
    sub: node.sub ? ctx.text(node.sub, node.params) : '',
    lines: given.map((l, i) => ({ id: i, text: ctx.text(l.text, node.params) })),
    words: {
      ask: ctx.text(node.confirm || 'shared.feat.law.ask'),
      yes: ctx.text(node.yes || 'shared.feat.law.yes'),
      back: ctx.text(node.back || 'shared.feat.law.back'),
      pick: ctx.text('shared.feat.law.pick'),
    },
  });
  if (pick == null) return ctx.story.ended(ctx) ? 'stop' : undefined;
  given.forEach((l, i) => {
    if (typeof l.flag === 'string' && l.flag) ctx.story.setFlag(l.flag, i === pick ? true : undefined);
  });
  return undefined;
}

async function ending(game, node, ctx) {
  const music = sound(game);
  guard(() => music && music.battle('ending'));
  try {
    const id = ctx.value(node.story);
    const played = id ? await playPictureStory(game, id, (textId) => ctx.text(textId)) : false;
    if (id && !played) ctx.story.warnOnce(`ending:${id}`, `Features: there is no picture story "${id}"`);
    const credits = node.credits ? creditsOf(game, ctx.value(node.credits)) : null;
    if (node.credits && !credits) ctx.story.warnOnce(`credits:${node.credits}`, `Features: there are no credits "${node.credits}"`);
    if (credits && !ctx.story.ended(ctx)) {
      await rollCredits(game, {
        title: credits.title ? word(game, credits.title) : '',
        sections: creditSections(game, credits),
        end: credits.end ? word(game, credits.end) : '',
        skip: word(game, credits.skip || 'shared.feat.credits.skip'),
      });
    }
  } finally {
    guard(() => music && music.battle(null));
  }
  return ctx.story.ended(ctx) ? 'stop' : undefined;
}

export function installFinale(game) {
  const { registry } = game;
  registry.add('story.command', 'ext:greatV', (node, ctx) => greatV(game, node, ctx));
  registry.add('story.command', 'ext:law', (node, ctx) => law(game, node, ctx));
  registry.add('story.command', 'ext:ending', (node, ctx) => ending(game, node, ctx));
  /* the music of a place may follow a story flag (the fair after the end) */
  guard(() => {
    if (game.sound && typeof game.sound.useFlags === 'function') {
      game.sound.useFlags((name) => {
        const story = registry.get('service', 'story');
        return !!(story && story.flag(name));
      });
    }
  });
}
