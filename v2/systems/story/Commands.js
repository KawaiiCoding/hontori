/*
 * Commands.js
 * Job: the script commands the story system itself carries out (content/schema.md section 6):
 * words, choices, the flow of a script, flags and marks, timing and the effects drawn over the
 * world. Commands about what other systems own (the bag, coins, quests, battles, resting) are
 * registered by those systems under the same registry kind.
 *
 * Public API:
 *   STOP, PASS                 the signals a command may return: end this script; end this
 *                              interaction handler and let the next one run
 *   COMMANDS                   { verb: (cmd, ctx, story) => signal | Promise<signal> }
 *                              registered as "story.command"
 *   FALLBACK_COMMANDS          used only while no other system registered that verb:
 *                              time (sets the hour), sound, toast, helper (a once-only card shown as a line)
 *
 * A command handler receives the command object, the running context (ctx: vars, self, person,
 * target, obj, visit, battle) and the story system (see Runner.js for what it offers).
 */

export const STOP = 'stop';
export const PASS = 'pass';

const HIDE_LINE_MS = 300;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

/* "step" plays 1, 2, 3, then repeats 2..n; "loop" repeats 1..n */
function cycleArm(visit, count, mode) {
  if (count <= 1) return 0;
  if (mode === 'loop') return visit % count;
  return visit < count ? visit : 1 + ((visit - 1) % (count - 1));
}

async function choose(cmd, ctx, story) {
  const shown = [];
  cmd.choose.forEach((option, index) => {
    if (option.if === undefined || story.test(option.if, ctx)) shown.push({ option, index });
  });
  if (!shown.length) return undefined;
  const options = shown.map(({ option }) => {
    const off = option.off !== undefined && story.test(option.off, ctx);
    const desc = off && option.offText ? option.offText : option.desc;
    return {
      label: story.text(option.text, option.params, ctx),
      desc: desc ? story.text(desc, option.params, ctx) : '',
      icon: option.icon || null,
      disabled: off,
    };
  });
  const place = (original) => shown.findIndex(({ index }) => index === original);
  const cancel = cmd.cancel === undefined ? -1 : place(story.value(cmd.cancel, ctx));
  const wanted = cmd.highlight === undefined ? -1 : story.value(cmd.highlight, ctx);
  const highlight = typeof wanted === 'number' && wanted >= 0 ? place(wanted) : -1;
  const picked = await story.choose(options, { selected: Math.max(0, highlight), highlight, cancel });
  const chosen = shown[picked] || shown[0];
  return story.block(chosen.option.then, ctx);
}

export const COMMANDS = {
  async say(cmd, ctx, story) {
    const ids = Array.isArray(cmd.say) ? cmd.say : [cmd.say];
    const speaker = story.speaker(cmd.who, ctx);
    for (const id of ids) {
      await story.line(speaker, story.text(id, cmd.params, ctx));
      if (story.ended(ctx)) return STOP;
    }
    return undefined;
  },

  choose,

  if: (cmd, ctx, story) => story.block(story.test(cmd.if, ctx) ? cmd.then : cmd.else, ctx),

  branch(cmd, ctx, story) {
    for (const arm of cmd.branch) if (story.test(arm.if, ctx)) return story.block(arm.then, ctx);
    return story.block(cmd.else, ctx);
  },

  cycle(cmd, ctx, story) {
    const arms = cmd.cycle || [];
    const visit = (ctx.visit && ctx.visit[cmd.by === 'object' ? 'object' : 'type']) || 0;
    return story.block(arms[cycleArm(visit, arms.length, cmd.mode)], ctx);
  },

  random(cmd, ctx, story) {
    const arms = cmd.random || [];
    return story.block(arms[Math.floor(Math.random() * arms.length)], ctx);
  },

  async repeat(cmd, ctx, story) {
    const times = Math.min(100, Number(story.value(cmd.repeat, ctx)) || 0);
    for (let i = 0; i < times; i++) {
      if (cmd.until !== undefined && i > 0 && story.test(cmd.until, ctx)) break;
      const signal = await story.block(cmd.then, ctx);
      if (signal) return signal;
    }
    return undefined;
  },

  set(cmd, ctx, story) {
    if ('max' in cmd) {
      const now = Number(story.readVar(ctx, cmd.set)) || 0;
      story.writeVar(ctx, cmd.set, Math.max(now, Number(story.value(cmd.max, ctx)) || 0));
    } else if ('min' in cmd) {
      const now = story.readVar(ctx, cmd.set);
      const given = Number(story.value(cmd.min, ctx)) || 0;
      story.writeVar(ctx, cmd.set, now == null ? given : Math.min(Number(now) || 0, given));
    } else {
      story.writeVar(ctx, cmd.set, story.value(cmd.to, ctx));
    }
  },

  async run(cmd, ctx, story) {
    const signal = await story.runScript(cmd.run, ctx);
    return signal === PASS ? PASS : undefined;
  },

  stop: () => STOP,
  pass: () => PASS,

  flag(cmd, ctx, story) {
    story.setFlag(cmd.flag, 'value' in cmd ? story.value(cmd.value, ctx) : true);
  },

  unflag(cmd, ctx, story) {
    story.setFlag(cmd.unflag, undefined);
  },

  mark(cmd, ctx, story) {
    story.setMark(ctx, cmd.mark, 'value' in cmd ? story.value(cmd.value, ctx) : true);
  },

  async wait(cmd, ctx, story) {
    const ms = Number(story.value(cmd.wait, ctx)) || 0;
    /* a pause is for watching the world: the last line does not stay over it */
    if (ms >= HIDE_LINE_MS) story.hideLine();
    await wait(ms);
  },

  async fade(cmd, ctx, story) {
    const half = (Number(story.value(cmd.fade, ctx)) || 600) / 2;
    await story.darken(1, half);
    await story.darken(0, half);
  },

  async blackout(cmd, ctx, story) {
    const ms = Number(story.value(cmd.blackout, ctx)) || 1500;
    await story.darken(1, ms * 0.3);
    const signal = await story.block(cmd.then, ctx);
    story.refreshPeople(true);
    await wait(ms * 0.4);
    await story.darken(0, ms * 0.3);
    return signal;
  },

  flash(cmd, ctx, story) {
    story.flash();
  },

  shake(cmd, ctx, story) {
    story.shake(Number(story.value(cmd.shake, ctx)) || 0.5);
  },

  /* { ask: 'controls' } is answered here; any other ask is the command "ask:<name>" of another system */
  async ask(cmd, ctx, story) {
    if (cmd.ask !== 'controls') return story.command(cmd, ctx, `ask:${cmd.ask}`);
    const options = story.library.ask('controls') || [];
    if (!options.length) return undefined;
    const labels = options.map((o) => ({ label: story.text(o.text, null, ctx), desc: o.desc ? story.text(o.desc, null, ctx) : '' }));
    const current = options.findIndex((o) => o.mode === story.game.input.mode);
    const picked = options[await story.choose(labels, { selected: Math.max(0, current) })] || options[0];
    story.game.chooseControls(picked.mode);
    if (picked.toast) story.game.ui.toast(story.text(picked.toast, null, ctx));
    return undefined;
  },
};

export const FALLBACK_COMMANDS = {
  time(cmd, ctx, story) {
    const world = story.world;
    if (!world) return;
    const spec = cmd.time;
    const hour = spec && typeof spec === 'object' && 'add' in spec
      ? world.env.time + (Number(story.value(spec.add, ctx)) || 0)
      : Number(story.value(spec, ctx));
    if (Number.isFinite(hour)) world.env.setTime(((hour % 24) + 24) % 24);
    story.refreshPeople(true);
  },

  sound(cmd, ctx, story) {
    try {
      story.game.sound.play(cmd.sound);
    } catch (error) {
      /* a missing sound never stops a script */
    }
  },

  toast(cmd, ctx, story) {
    story.game.ui.toast(story.text(cmd.toast, cmd.params, ctx));
  },

  async helper(cmd, ctx, story) {
    const seen = `help:${cmd.helper}`;
    if (story.flag(seen)) return;
    story.setFlag(seen, true);
    const speaker = { name: story.text(cmd.title, null, ctx), portrait: null, color: null };
    await story.line(speaker, story.text(cmd.text, null, ctx));
  },
};
