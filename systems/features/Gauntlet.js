/*
 * Gauntlet.js  (engine: features)
 * Job: a run of battles in a row with no rest between them (a school's last test, a tournament): only what
 * the player carries helps. Before each battle the run keeps a save point (whatever the game says the player
 * has: health, mana, things in the bag) and saves the journey. A lost battle puts everything back as it was at
 * that save point, so the next try starts at the same battle in the same shape, never from the beginning.
 * Leaving the place of the run ends it (the player may then rest, and starts again from the first battle).
 * It knows no game: the battles are the story's own `battle` command, the save point is the game's.
 *
 * Public API:
 *   installGauntlets(game, { snapshot, restore, command, leave, condition })
 *       snapshot()       what to keep at a save point (plain data, it is saved)
 *       restore(data)    put it back
 *       command, leave, condition   the story names to register (defaults "gauntlet", "gauntlet:leave",
 *                        "gauntlet"; a game passes its extension names, e.g. "ext:gauntlet")
 *     returns the Gauntlets object below (also registry "service" "gauntlets": { open(id), stage(id), leave(id) })
 *
 * Content `gauntlets`: { id: { venue: mapId | [mapIds], rules: [battle rule], done: flag,
 *     stages: [{ battle: { opponent, rules }, before: [commands], won: [commands] }], left: textId, onLeave: [commands] } }
 *   before   runs right after the save point, before the battle (someone steps up)
 *   won      runs after that battle is won, before the next save point
 *   rules    added to every battle of the run (the game's rule that refuses rest, for example)
 *   left     the toast shown when the run ends because the player left the venue
 *
 * Story use:
 *   command    { <command>: id, won: [commands], lost: [commands] }   runs the run from the battle it stands
 *              at to the end (`won`, the `done` flag is set) or to a lost battle (`lost`, everything is put back
 *              as it was before that battle). A run already done goes straight to `won`.
 *   leave      { <leave>: id }   ends an open run (the next start is from the first battle)
 *   condition  { <condition>: id, stage: n }   a run is open (and stands at battle n, counted from 0)
 * The keys inside the nodes are `gauntlet` (the id), so with the "ext:" names a use reads
 *   { ext: 'gauntlet', gauntlet: 'works', won: [...], lost: [...] }
 *
 * Registers: the story command, leave command and condition named above, save section "gauntlet"
 *   { runs: { id: { stage, keep } } }, system "features:gauntlet" (watches map:enter for leaving).
 */

export class Gauntlets {
  #game;
  #o;
  #defs = null;

  constructor(game, options) {
    this.#game = game;
    this.#o = options;
  }

  #all() {
    if (!this.#defs) {
      this.#defs = {};
      for (const folder of this.#game.registry.all('content')) {
        const table = folder && folder.gauntlets;
        if (table && typeof table === 'object') for (const [id, def] of Object.entries(table)) if (def && !this.#defs[id]) this.#defs[id] = def;
      }
    }
    return this.#defs;
  }

  #runs() {
    const section = this.#game.save.state.gauntlet;
    if (section && (!section.runs || typeof section.runs !== 'object')) section.runs = {};
    return section ? section.runs : {};
  }

  #story() {
    return this.#game.story || this.#game.registry.get('service', 'story') || null;
  }

  #commit() {
    try {
      this.#game.save.commit();
    } catch (error) {
      console.warn('Gauntlet: saving failed', error);
    }
  }

  #keep() {
    try {
      return this.#o.snapshot ? JSON.parse(JSON.stringify(this.#o.snapshot() ?? null)) : null;
    } catch (error) {
      console.warn('Gauntlet: the save point could not be kept', error);
      return null;
    }
  }

  #putBack(data) {
    if (data == null || !this.#o.restore) return;
    try {
      this.#o.restore(data);
    } catch (error) {
      console.warn('Gauntlet: the save point could not be put back', error);
    }
  }

  open(id) {
    const run = this.#runs()[id];
    return !!run && Number.isInteger(run.stage);
  }

  stage(id) {
    return this.open(id) ? this.#runs()[id].stage : -1;
  }

  leave(id) {
    const runs = this.#runs();
    if (!runs[id]) return false;
    delete runs[id];
    this.#commit();
    return true;
  }

  async run(node, ctx) {
    const story = ctx.story;
    const id = ctx.value(node.gauntlet);
    const def = this.#all()[id];
    if (!def || !Array.isArray(def.stages) || !def.stages.length) {
      story.warnOnce(`gauntlet:${id}`, `Gauntlet: there is no gauntlet "${id}" with battles`);
      return undefined;
    }
    const branch = (list) => (Array.isArray(list) && list.length ? ctx.run(list) : undefined);
    if (def.done && story.flag(def.done)) return branch(node.won);
    const runs = this.#runs();
    let run = runs[id];
    if (!run || !Number.isInteger(run.stage) || run.stage < 0 || run.stage >= def.stages.length) {
      run = { stage: 0, keep: null };
      runs[id] = run;
    } else if (run.keep != null) {
      /* a run cut off (the game closed mid-battle): it goes on from its last save point */
      this.#putBack(run.keep);
    }
    const extra = Array.isArray(def.rules) ? def.rules : [];
    for (let stage = run.stage; stage < def.stages.length; stage++) {
      const step = def.stages[stage] || {};
      run.stage = stage;
      run.keep = this.#keep();
      this.#commit();
      if (Array.isArray(step.before) && step.before.length) {
        if ((await ctx.run(step.before)) === 'stop' || story.ended(ctx)) return 'stop';
      }
      const battle = { ...(step.battle || {}) };
      battle.rules = [...extra, ...(Array.isArray(battle.rules) ? battle.rules : [])];
      ctx.battle = null;
      await ctx.run([{ battle }]);
      if (story.ended(ctx)) return 'stop';
      const result = ctx.battle || {};
      if (!result.won) {
        this.#putBack(run.keep);
        this.#commit();
        return branch(node.lost);
      }
      if (Array.isArray(step.won) && step.won.length) {
        if ((await ctx.run(step.won)) === 'stop' || story.ended(ctx)) return 'stop';
      }
    }
    delete runs[id];
    if (def.done) story.setFlag(def.done, true);
    this.#commit();
    return branch(node.won);
  }

  /* leaving the place of a run ends it */
  #entered(map) {
    const runs = this.#runs();
    for (const id of Object.keys(runs)) {
      const def = this.#all()[id];
      const venue = def ? (Array.isArray(def.venue) ? def.venue : [def.venue]).filter(Boolean) : [];
      if (!def || !venue.length || venue.includes(map.id)) continue;
      delete runs[id];
      const story = this.#story();
      const commands = [];
      if (def.left) commands.push({ toast: def.left });
      if (Array.isArray(def.onLeave)) commands.push(...def.onLeave);
      if (story && commands.length) story.run(commands);
    }
  }

  start() {
    this.#game.bus.on('map:enter', ({ map }) => {
      try {
        if (map) this.#entered(map);
      } catch (error) {
        console.warn('Gauntlet: leaving could not be checked', error);
      }
    });
  }
}

export function installGauntlets(game, options = {}) {
  const gauntlets = new Gauntlets(game, options);
  const { registry } = game;
  const command = options.command || 'gauntlet';
  const leave = options.leave || 'gauntlet:leave';
  const condition = options.condition || 'gauntlet';
  game.save.define('gauntlet', { runs: {} });
  registry.add('story.command', command, (node, ctx) => gauntlets.run(node, ctx));
  registry.add('story.command', leave, (node, ctx) => {
    gauntlets.leave(ctx.value(node.gauntlet));
  });
  registry.add('story.condition', condition, (node, ctx) => {
    const id = ctx.value(node.gauntlet);
    if (!gauntlets.open(id)) return false;
    return node.stage === undefined || gauntlets.stage(id) === Number(ctx.value(node.stage));
  });
  registry.add('system', 'features:gauntlet', gauntlets);
  registry.add('service', 'gauntlets', { open: (id) => gauntlets.open(id), stage: (id) => gauntlets.stage(id), leave: (id) => gauntlets.leave(id) });
  return gauntlets;
}
