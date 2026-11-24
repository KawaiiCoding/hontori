#!/usr/bin/env node
/*
 * check.mjs
 * Job: the content checker (schema.md). Loads every content folder and reports each problem: unknown ids
 * (people, items, maps, quests, scripts, trainers, kinds, text), invalid triggers, commands and conditions,
 * quest steps no event can reach, a person in two places at once, items given or sold without a use.
 * It validates the generic core itself and hands every { ext } use to the game's registered extensions.
 * Run: node content/check.mjs        Exit code 1 when there are problems.
 *
 * Public API (for a debug build): check(folders, { extensions, world }) -> { problems, notes }
 */

import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ORDER = ['shared', 'prologue', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7'];

const COMMANDS = new Set(['say', 'choose', 'if', 'branch', 'cycle', 'random', 'repeat', 'set', 'run', 'stop', 'pass', 'give', 'take', 'find',
  'money', 'spend', 'flag', 'unflag', 'mark', 'quest', 'battle', 'move', 'face', 'place', 'spawn', 'remove', 'companion', 'wait', 'fade', 'blackout',
  'time', 'rest', 'heal', 'sound', 'note', 'fx', 'shake', 'flash', 'toast', 'helper', 'shop', 'story', 'ask', 'open', 'puzzle', 'forage', 'offer',
  'trial', 'ext']);
const TRIGGERS = new Set(['newGame', 'talk', 'interact', 'tile', 'enter', 'flag', 'auto', 'area', 'door', 'battleEnd']);
const CONDS = new Set(['flag', 'all', 'any', 'not', 'atLeast', 'hour', 'weather', 'indoor', 'map', 'area', 'has', 'owns', 'quest', 'step', 'coins',
  'var', 'companion', 'party', 'battle', 'mark', 'obj', 'chance', 'tile', 'mapRest', 'ext']);
const SCREENS = new Set(['blackboard', 'noticeBoard', 'spellbook']);
const NESTED = ['then', 'else', 'won', 'lost', 'fled', 'captured', 'ok', 'fail'];
const TEXT_ID = /^(shared|pro|ch\d+)\.[A-Za-z0-9_.:-]+$/;
const SCRIPT_FIELDS = new Set(['run', 'service', 'script']);
const FLAG_SET_BY_ENGINE = (map) => 'visited:' + map;

export function check(folders, opts = {}) {
  const problems = [], notes = [];
  const bad = (where, msg) => { const m = `${where}: ${msg}`; if (!problems.includes(m)) problems.push(m); };
  const R = { text: {}, people: {}, events: {}, scripts: {}, quests: {}, trainers: {}, shops: {}, trials: {}, puzzles: {}, items: {}, voices: {}, maps: {}, kinds: {}, spells: {}, stories: {}, goods: {} };
  const flagsSet = new Set(['intro']), flagsUsed = [], questsStarted = new Set(), spellsLearned = new Set(), laterFlags = new Set();
  const add = (kind, id, v, where) => { if (R[kind][id] !== undefined) bad(where, `${kind} id "${id}" is defined twice`); R[kind][id] = v; };

  // ---------- registries
  for (const f of folders) {
    const w = f.id;
    for (const [k, v] of Object.entries(f.text || {})) add('text', k, v, w);
    (f.people || []).forEach((p) => add('people', p.id, p, w));
    (f.events || []).forEach((e) => add('events', e.id, e, w));
    for (const [k, v] of Object.entries(f.scripts || {})) add('scripts', k, v, w);
    (f.quests || []).forEach((q) => add('quests', q.id, q, w));
    (f.trainers || []).forEach((t) => add('trainers', t.id, t, w));
    (f.shops || []).forEach((s) => add('shops', s.id, s, w));
    for (const [k, v] of Object.entries(f.trials || {})) add('trials', k, v, w);
    for (const [k, v] of Object.entries(f.puzzles || {})) add('puzzles', k, v, w);
    for (const [k, v] of Object.entries(f.items || {})) add('items', k, v, w);
    for (const [k, v] of Object.entries(f.voices || {})) if (v && v.name) add('voices', k, v, w);
    (f.maps || []).forEach((m) => add('maps', m.id, m, w));
    (f.kinds || []).forEach((k) => add('kinds', k.kind, k, w));
    for (const [k, v] of Object.entries((f.spells && f.spells.list) || {})) add('spells', k, v, w);
    for (const [k, v] of Object.entries(f.story || {})) add('stories', k, v, w);
    for (const [k, v] of Object.entries(f.goods || {})) add('goods', k, v, w);
    (f.laterFlags || []).forEach((x) => laterFlags.add(x));
  }
  const world = opts.world || null;
  if (world) for (const id of Object.keys(R.maps)) if (!world.maps[id]) bad('shared.maps', `map "${id}" is not in the world`);
  const ctx = { R, bad, notes, world, flagsSet, spellsLearned };
  const ext = opts.extensions ? opts.extensions(ctx) : null;
  /* the declared battle modes and drawing twists (shared/extensions.js) */
  const known = (folders.find((f) => f && f.extensions) || {}).extensions || {};

  // ---------- references
  const isMap = (id, where) => { if (!R.maps[id]) bad(where, `unknown map "${id}"`); };
  const isText = (id, where) => { if (typeof id !== 'string' || R.text[id] === undefined) bad(where, `missing text "${id}"`); };
  const isItem = (id, where) => { if (typeof id === 'string' && !R.items[id]) bad(where, `unknown item "${id}"`); };
  const isPerson = (id, where) => { if (!R.people[id]) bad(where, `unknown person "${id}"`); };
  const isScript = (id, where) => { if (!R.scripts[id]) bad(where, `unknown script "${id}"`); };
  const isKind = (id, where) => { if (typeof id === 'string' && !R.kinds[id]) bad(where, `unknown kind "${id}"`); };
  const isLook = (look, where) => { if (look && world && !world.looks.has(look) && !R.kinds[look]) bad(where, `unknown look "${look}"`); };

  // every string that looks like a text id must exist, except script ids
  function texts(v, where, field) {
    if (typeof v === 'string') { if (TEXT_ID.test(v)) (SCRIPT_FIELDS.has(field) ? isScript : isText)(v, where); return; }
    if (Array.isArray(v)) { v.forEach((x) => texts(x, where, field)); return; }
    if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) texts(x, where, k);
  }

  // ---------- conditions
  function cond(c, where) {
    if (c === undefined || c === true || c === false) return;
    if (typeof c === 'string') { flagsUsed.push([c, where]); return; }
    if (!c || typeof c !== 'object') return bad(where, `bad condition ${JSON.stringify(c)}`);
    const k = Object.keys(c)[0];
    if (!CONDS.has(k)) return bad(where, `unknown condition "${k}"`);
    if (k === 'flag') { if (c.is === undefined) flagsUsed.push([c.flag, where]); }
    else if (k === 'all' || k === 'any') c[k].forEach((x) => cond(x, where));
    else if (k === 'atLeast') c.of.forEach((x) => cond(x, where));
    else if (k === 'not') cond(c.not, where);
    else if (k === 'hour') { if (!Array.isArray(c.hour) || c.hour.length !== 2) bad(where, 'hour needs [from, to]'); }
    else if (k === 'map') isMap(c.map, where);
    else if (k === 'area') isMap(c.area.map, where);
    else if (k === 'has' || k === 'owns') { if (typeof c[k] === 'string') isItem(c[k], where); }
    else if (k === 'quest') { if (!R.quests[c.quest]) bad(where, `unknown quest "${c.quest}"`); }
    else if (k === 'step') { const q = R.quests[c.step[0]]; if (!q || !q.steps.some((s) => s.id === c.step[1])) bad(where, `unknown quest step ${c.step}`); }
    else if (k === 'ext') extUse('condition', c, where);
  }
  function value(v, where) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (v.ext) extUse('value', v, where);
      if (v.pick) { v.pick.forEach(([c, x]) => { cond(c, where); value(x, where); }); value(v.else, where); }
      for (const k of ['add', 'max', 'min']) if (Array.isArray(v[k])) v[k].forEach((x) => value(x, where));
      if (v.coins) value(v.coins, where);
      if (v.price && !(R.shopsPrices || {})[v.price] && opts.prices && !opts.prices[v.price]) bad(where, `unknown price "${v.price}"`);
    }
  }
  function extUse(kind, use, where) {
    if (!ext) return notes.push(`${where}: extension "${use.ext}" not checked (no extensions registered)`);
    ext.check(kind, use, where);
  }

  // ---------- commands
  function script(list, where) {
    if (!Array.isArray(list)) return bad(where, 'a script must be a list');
    list.forEach((c, i) => command(c, `${where}[${i}]`));
  }
  function command(c, where) {
    if (!c || typeof c !== 'object') return bad(where, 'a command must be an object');
    const verb = Object.keys(c).find((k) => COMMANDS.has(k));
    if (!verb) return bad(where, `unknown command ${JSON.stringify(Object.keys(c))}`);
    texts(c, where);
    for (const k of NESTED) if (c[k] !== undefined && verb !== 'if' && verb !== 'branch' && verb !== 'battle' && verb !== 'spend' && verb !== 'blackout' && verb !== 'repeat' && verb !== 'ask' && verb !== 'ext') bad(where, `"${k}" is not an option of ${verb}`);
    switch (verb) {
      case 'say': if (c.who !== 'self' && !R.people[c.who] && !R.voices[c.who]) bad(where, `unknown speaker "${c.who}"`); if (c.params) Object.values(c.params).forEach((v) => value(v, where)); break;
      case 'choose': c.choose.forEach((o, i) => { cond(o.if, where); cond(o.off, where); if (o.params) Object.values(o.params).forEach((v) => value(v, where)); script(o.then || [], `${where}.choose[${i}]`); }); break;
      case 'if': cond(c.if, where); script(c.then || [], where + '.then'); if (c.else) script(c.else, where + '.else'); break;
      case 'branch': c.branch.forEach((a, i) => { cond(a.if, where); script(a.then, `${where}.branch[${i}]`); }); if (c.else) script(c.else, where + '.else'); break;
      case 'cycle': case 'random': c[verb].forEach((a, i) => script(a, `${where}.${verb}[${i}]`)); break;
      case 'repeat': cond(c.until, where); script(c.then, where + '.then'); break;
      case 'set': value(c.to, where); value(c.max, where); break;
      case 'run': isScript(c.run, where); break;
      case 'give': if (typeof c.give === 'string') { isItem(c.give, where); given.add(c.give); } break;
      case 'take': case 'find': if (typeof c[verb] === 'string') isItem(c[verb], where); break;
      case 'money': value(c.money, where); break;
      case 'spend': value(c.spend, where); script(c.ok || [], where + '.ok'); script(c.fail || [], where + '.fail'); break;
      case 'flag': flagsSet.add(c.flag); break;
      case 'quest': if (!R.quests[c.quest]) bad(where, `unknown quest "${c.quest}"`); else if (c.start) questsStarted.add(c.quest); else if (c.step && !R.quests[c.quest].steps.some((s) => s.id === c.step)) bad(where, `unknown step "${c.step}"`); break;
      case 'battle': {
        const b = c.battle;
        if (b.opponent) { if (!R.trainers[b.opponent]) bad(where, `unknown trainer "${b.opponent}"`); }
        else if (b.wild) { isKind(b.wild.kind, where); value(b.wild.level, where); }
        else bad(where, 'a battle needs an opponent or a wild kind');
        (b.rules || []).forEach((r) => (ext ? ext.check('battleRule', r, where) : null));
        /* a double battle beside someone: their name, look and hontori */
        if (b.mode !== undefined && !(known.battleMode || []).includes(b.mode)) bad(where, `unknown battle mode "${b.mode}"`);
        if (b.mode === 'ally') {
          if (!b.ally) bad(where, 'a battle in mode ally needs ally: { name, look, team }');
          else { isText(b.ally.name, where); isLook(b.ally.look, where); (b.ally.team || []).forEach((m) => { isKind(m.kind, where); value(m.level, where); }); }
        }
        if (b.twist !== undefined && !(known.twist || []).includes(b.twist)) bad(where, `unknown twist "${b.twist}"`);
        for (const k of ['won', 'lost', 'fled', 'captured', 'else']) if (c[k]) script(c[k], `${where}.${k}`);
        if (c.after && !['wake', 'restore'].includes(c.after)) bad(where, `battle after "${c.after}"`);
        break;
      }
      case 'move': case 'face': case 'place': case 'remove': isPerson(c[verb], where); break;
      case 'spawn': isPerson(c.spawn, where); if (R.people[c.spawn] && !R.people[c.spawn].spawned) bad(where, `"${c.spawn}" is not a spawned person`); isMap(c.at.map, where); if (world) placeOk(c.at.map, c.at.x, c.at.y, where); break;
      case 'companion': isKind(c.kind, where); break;
      case 'blackout': script(c.then || [], where + '.then'); break;
      case 'shop': if (c.shop !== 'self' && !R.shops[c.shop]) bad(where, `unknown shop "${c.shop}"`); break;
      case 'story': if (!R.stories[c.story]) bad(where, `unknown story "${c.story}"`); break;
      case 'open': if (!SCREENS.has(c.open)) bad(where, `unknown screen "${c.open}"`); break;
      case 'puzzle': if (!R.puzzles[c.puzzle]) bad(where, `unknown puzzle "${c.puzzle}"`); break;
      case 'trial': if (!R.trials[c.trial]) bad(where, `unknown trial "${c.trial}"`); break;
      case 'ask': if (c.then) script(c.then, where + '.then'); break;
      case 'ext':
        extUse('command', c, where);
        if (c.ext === 'learn') spellsLearned.add(c.spell);
        /* an extension may carry scripts of its own (a run of duels, a ride) */
        for (const k of ['won', 'lost', 'during', 'after']) if (Array.isArray(c[k])) script(c[k], `${where}.${k}`);
        break;
      default: break;
    }
  }
  const given = new Set();

  // ---------- events
  for (const e of Object.values(R.events)) {
    const w = 'event ' + e.id, on = e.on || {}, k = Object.keys(on).find((x) => TRIGGERS.has(x));
    if (!k) bad(w, `unknown trigger ${JSON.stringify(on)}`);
    else if (k === 'talk') [].concat(on.talk).forEach((p) => isPerson(p, w));
    else if (k === 'enter') isMap(on.enter, w);
    else if (k === 'area') isMap(on.area.map, w);
    else if (k === 'door') { isMap(on.door.map, w); isMap(on.door.to, w); }
    else if (k === 'interact' && on.map) isMap(on.map, w);
    else if (k === 'flag') flagsUsed.push([on.flag, w]);
    cond(e.if, w);
    script(e.then, w);
  }
  for (const [id, s] of Object.entries(R.scripts)) script(s, 'script ' + id);
  for (const f of folders) {
    for (const [type, hs] of Object.entries(f.interactions || {})) hs.forEach((h, i) => { const w = `${f.id} interaction ${type}[${i}]`; if (h.map) isMap(h.map, w); cond(h.if, w); script(h.then, w); });
    for (const d of f.doors || []) { isMap(d.map, f.id + ' door'); isMap(d.to, f.id + ' door'); cond(d.if, f.id + ' door'); }
    for (const r of f.rest || []) { cond(r.if, f.id + ' rest'); isText(r.toast, f.id + ' rest'); }
    for (const o of f.objects || []) { isMap(o.map, f.id + ' object'); texts(o, f.id + ' object'); }
    if (f.pickups) { cond(f.pickups.active, f.id + ' pickups'); f.pickups.list.forEach((p) => { isItem(p.item, f.id + ' pickup'); isMap(p.map, f.id + ' pickup'); given.add(p.item); }); }
    if (f.screens) texts(f.screens, f.id + ' screens');
    if (f.story) texts(f.story, f.id + ' story');
    if (f.ask) texts(f.ask, f.id + ' ask');
    if (f.helpers) f.helpers.forEach((h) => { texts(h, 'helper ' + h.id); if (typeof h.when === 'object') cond(h.when, 'helper ' + h.id); });
    if (f.pickup) texts(f.pickup, 'pickup flow');
    if (f.shopFlow) texts(f.shopFlow, 'shop flow');
    if (f.money) texts(f.money, 'money');
    if (f.forage) { texts(f.forage, 'forage'); for (const list of Object.values(f.forage.tables)) list.forEach((it) => { isItem(it, 'forage'); given.add(it); }); }
    if (f.waters) { texts(f.waters, 'waters'); for (const [m, wa] of Object.entries(f.waters)) if (wa && wa.fish) { if (m !== 'sea') isMap(m, 'waters'); wa.fish.forEach((x) => { isItem(x.item, 'waters ' + m); given.add(x.item); }); wa.kinds.forEach((k) => isKind(k, 'waters ' + m)); } }
    if (f.wild) for (const [m, wt] of Object.entries(f.wild)) { isMap(m, f.id + ' wild'); (wt.zones || []).forEach((z) => isKind(z.kind, f.id + ' wild ' + m)); }
    if (f.wildHabitats) Object.keys(f.wildHabitats.habitats).forEach((k) => isKind(k, 'wild habitats'));
    if (f.kinds) f.kinds.forEach((k) => texts(k, 'kind ' + k.kind));
    if (f.spells) texts(f.spells, 'spells');
    if (f.maps) f.maps.forEach((m) => texts(m, 'map ' + m.id));
    if (f.voices) texts(f.voices, 'voices');
  }
  for (const [id, it] of Object.entries(R.items)) {
    texts(it, 'item ' + id);
    for (const a of it.actions || []) { cond(a.if, 'item ' + id); (a.off || []).forEach((o) => cond(o.if, 'item ' + id)); script(a.then, 'item ' + id); }
  }
  for (const [id, g] of Object.entries(R.goods)) g.forEach((x) => { isItem(x.item, 'goods ' + id); value(x.price, 'goods ' + id); cond(x.if, 'goods ' + id); isText(x.tip, 'goods ' + id); given.add(x.item); });
  for (const s of Object.values(R.shops)) { isPerson(s.keeper, 'shop ' + s.id); isMap(s.map, 'shop ' + s.id); if (!R.goods[s.goods]) bad('shop ' + s.id, `unknown goods "${s.goods}"`); }
  for (const t of Object.values(R.trainers)) {
    const w = 'trainer ' + t.id; isText(t.name, w); isLook(t.look, w); if (t.venue && !R.trials[t.venue]) bad(w, `unknown venue "${t.venue}"`);
    (t.rules || []).forEach((r) => (ext ? ext.check('battleRule', r, w) : null));
    t.team.forEach((m) => { isKind(m.kind, w); value(m.level, w); });
    texts(t.banner || {}, w);
  }
  for (const [id, t] of Object.entries(R.trials)) {
    const w = 'trial ' + id; isMap(t.venue, w); if (t.door) { isMap(t.door.map, w); isMap(t.door.to, w); }
    texts(t, w); if (t.onPass) script(t.onPass, w + '.onPass');
    (t.entrance || []).forEach((x) => (x.type === 'push' ? (R.puzzles[x.puzzle] ? null : bad(w, `unknown puzzle "${x.puzzle}"`)) : ext && ext.check('testType', x, w)));
    [].concat(t.award || []).forEach((x) => { if (x.type) ext && ext.check('awardRule', x, w); if (x.script) isScript(x.script, w); });
    if (t.passed) flagsUsed.push([t.passed, w]);
    if (t.award && t.award.flag) flagsUsed.push([t.award.flag, w]);
  }
  /* runs of battles in a row: every stage is a battle with its own scripts */
  for (const f of folders) for (const [id, g] of Object.entries(f.gauntlets || {})) {
    const w = 'gauntlet ' + id;
    [].concat(g.venue || []).forEach((m) => isMap(m, w));
    (g.rules || []).forEach((r) => (ext ? ext.check('battleRule', r, w) : null));
    if (g.done) flagsSet.add(g.done);
    if (g.left) isText(g.left, w);
    script(g.onLeave || [], w + '.onLeave');
    if (!Array.isArray(g.stages) || !g.stages.length) bad(w, 'a gauntlet needs stages');
    (g.stages || []).forEach((stage, i) => {
      const sw = `${w} stage ${i}`;
      const b = stage.battle || {};
      if (!R.trainers[b.opponent]) bad(sw, `unknown trainer "${b.opponent}"`);
      (b.rules || []).forEach((r) => (ext ? ext.check('battleRule', r, sw) : null));
      script(stage.before || [], sw + '.before');
      script(stage.won || [], sw + '.won');
    });
  }
  /* tournaments: rounds of duels with a board between them (game/features/tournament.js) */
  for (const f of folders) for (const [id, g] of Object.entries(f.tournaments || {})) {
    const w = 'tournament ' + id;
    [].concat(g.venue || []).forEach((m) => isMap(m, w));
    (g.rules || []).forEach((r) => (ext ? ext.check('battleRule', r, w) : null));
    if (g.done) flagsSet.add(g.done);
    for (const k of ['left', 'title']) if (g[k]) isText(g[k], w);
    script(g.onLeave || [], w + '.onLeave');
    script(g.between || [], w + '.between');
    if (!Array.isArray(g.rounds) || !g.rounds.length) bad(w, 'a tournament needs rounds');
    (g.bracket || []).forEach((e, i) => {
      if (!e || (e.who !== 'player' && !R.people[e.who] && !R.trainers[e.who])) bad(`${w} bracket ${i}`, `unknown entrant "${e && e.who}"`);
      if (e && e.out !== undefined && !(Number.isInteger(e.out) && e.out >= 1)) bad(`${w} bracket ${i}`, 'out is the round they fall in, from 1');
    });
    if (Array.isArray(g.bracket) && !g.bracket.some((e) => e && e.who === 'player')) bad(w, 'the bracket needs the player');
    (g.rounds || []).forEach((round, i) => {
      const rw = `${w} round ${i + 1}`;
      const b = round.battle || {};
      if (!R.trainers[b.opponent]) bad(rw, `unknown trainer "${b.opponent}"`);
      (b.rules || []).forEach((r) => (ext ? ext.check('battleRule', r, rw) : null));
      if (round.name) isText(round.name, rw);
      if (round.twist !== undefined && !(known.twist || []).includes(round.twist)) bad(rw, `unknown twist "${round.twist}"`);
      script(round.before || [], rw + '.before');
      script(round.won || [], rw + '.won');
    });
  }
  for (const [id, p] of Object.entries(R.puzzles)) { const w = 'puzzle ' + id; isMap(p.map, w); script(p.onSolve || [], w); flagsSet.add(p.solved); if ((p.type || 'push') === 'push' && p.boxes.length < p.pads.length) bad(w, 'fewer piles than pads'); }
  for (const tr of Object.values(R.trials)) if (tr.passed && tr.entrance && tr.entrance.every((x) => x.type !== 'push')) flagsSet.add(tr.passed);
  for (const m of Object.keys(R.maps)) flagsSet.add(FLAG_SET_BY_ENGINE(m));
  for (const e of Object.values(R.events)) if (e.once !== false) flagsSet.add('ev:' + e.id);

  // ---------- people: valid, and one place at a time
  const slotsAt = (sched, h) => (sched || []).filter((s) => (s.from <= s.to ? h >= s.from && h < s.to : h >= s.from || h < s.to));
  const occupied = new Map();
  for (const p of Object.values(R.people)) {
    const w = 'person ' + p.id; isText(p.name, w); isLook(p.look, w); texts(p, w);
    if (p.service) isScript(p.service, w);
    if (!p.at && !p.spawned) bad(w, 'no place and not spawned');
    cond(p.goneIf, w);
    const variants = [{ at: p.at, schedule: p.schedule, tag: 'base' }];
    (p.phases || []).forEach((ph, i) => { cond(ph.if, w); if (ph.name) isText(ph.name, w); variants.push({ at: ph.at || p.at, schedule: ph.schedule || p.schedule, tag: 'phase ' + i }); });
    for (const v of variants) {
      for (let h = 0; h < 24; h += 0.5) {
        const hit = slotsAt(v.schedule, h);
        if (hit.length > 1) { bad(w, `${v.tag}: two schedule slots at hour ${h}`); break; }
        if (!v.at) continue;
        const s = hit[0] || {};
        if (s.away) continue;
        const map = s.map || v.at.map, x = s.x != null ? s.x : v.at.x, y = s.y != null ? s.y : v.at.y;
        isMap(map, w);
        if (world) placeOk(map, x, y, w);
        if (v.tag === 'base' && !(p.phases || []).length) {
          const key = `${map}:${x},${y}@${h}`;
          if (occupied.has(key) && occupied.get(key) !== p.id) bad(w, `stands on ${map} ${x},${y} with ${occupied.get(key)} at hour ${h}`);
          occupied.set(key, p.id);
        }
      }
    }
  }
  // ---------- maps written as data: nobody is ever put on water, in a wall or outside the map
  if (world) {
    const doorsOk = (doors, w) => (doors || []).forEach((d) => { isMap(d.to, w); placeOk(d.to, d.tx, d.ty, `${w} door to ${d.to}`); });
    for (const m of Object.values(R.maps)) {
      if (!Array.isArray(m.rows)) continue;
      const w = 'map ' + m.id, known = world.maps[m.id];
      if (!known) continue;
      if (m.spawn) placeOk(m.id, m.spawn.x, m.spawn.y, w + ' spawn');
      doorsOk(m.doors, w);
      (m.doors || []).forEach((d) => { if (d.x < 0 || d.y < 0 || d.x >= known.w || d.y >= known.h) bad(w, `door ${d.x},${d.y} is outside the map`); });
      for (const [name, spot] of Object.entries(m.spots || {})) {
        const list = Array.isArray(spot) && Array.isArray(spot[0]) ? spot : [spot];
        /* a spot of four numbers is a zone: both corners are checked for the map's edge only */
        for (const s of list) {
          if (!Array.isArray(s)) continue;
          for (let i = 0; i + 1 < s.length; i += 2) {
            const x = s[i], y = s[i + 1];
            if (x < 0 || y < 0 || x >= known.w || y >= known.h) bad(w, `spot "${name}" ${x},${y} is outside the map`);
            else if (s.length === 2 && known.ground && known.ground[y][x]) bad(w, `spot "${name}" ${x},${y} is on water or in a wall`);
          }
        }
      }
    }
    for (const f of folders) for (const link of f.links || []) doorsOk(link.doors, `${f.id} link ${link.map}`);
  }
  function placeOk(map, x, y, w) {
    const m = world.maps[map]; if (!m) return;
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) return bad(w, `${map} ${x},${y} is outside the map`);
    if (m.solid[y][x]) bad(w, `${map} ${x},${y} is not walkable`);
  }

  // ---------- quests can be reached
  const canSet = (f) => flagsSet.has(f) || laterFlags.has(f);
  for (const q of Object.values(R.quests)) {
    const w = 'quest ' + q.id; isText(q.title, w); isText(q.desc, w); texts(q, w);
    if (!questsStarted.has(q.id)) bad(w, 'no command starts it');
    if (q.after) script(q.after, w + '.after');
    q.steps.forEach((s) => {
      const sw = `${w} step ${s.id}`;
      cond(s.done, sw);
      positives(s.done).forEach((f) => { if (!canSet(f)) bad(sw, `waits for flag "${f}" that nothing sets`); });
      (s.target || []).forEach((t) => { isMap(t.map, sw); cond(t.if, sw); if (world && world.maps[t.map] && (t.x >= world.maps[t.map].w || t.y >= world.maps[t.map].h)) bad(sw, 'target outside the map'); });
    });
  }
  function positives(c) {
    if (typeof c === 'string') return [c];
    if (!c || typeof c !== 'object') return [];
    if (c.flag && c.is === undefined) return [c.flag];
    if (c.all) return c.all.flatMap(positives);
    if (c.any) { const all = c.any.map(positives); return all.some((a) => a.every(canSet)) ? [] : all.flat(); }
    if (c.ext === 'spell' && !spellsLearned.has(c.has)) return ['spell:' + c.has];
    return [];
  }
  for (const [f, where] of flagsUsed) if (!canSet(f) && !/^tip:/.test(f)) bad(where, `reads flag "${f}" that nothing sets`);

  // ---------- items given or sold have a use
  for (const id of given) {
    const it = R.items[id]; if (!it) continue;
    if (!it.effect) bad('item ' + id, 'given or sold but has no effect');
    if (!it.desc && !it.use) notes.push(`item ${id}: no description or use text in the bag`);
  }
  // ---------- lore: readable books (systems/lore): ids, text, kinds, and every shelf on a real book prop
  const LORE_KINDS = new Set(['lore', 'hint', 'notes']), LORE_PROPS = new Set(['bookshelf', 'bookstack']);
  const books = {}, shelfAt = new Set();
  for (const f of folders) for (const [id, b] of Object.entries((f.lore && f.lore.books) || {})) {
    const where = `${f.id}.lore.${id}`;
    if (books[id]) bad(where, `book id "${id}" is defined twice`);
    books[id] = b;
    isText(b.title, where);
    if (b.kind !== undefined && !LORE_KINDS.has(b.kind)) bad(where, `unknown book kind "${b.kind}"`);
    if (!Array.isArray(b.pages) || b.pages.length < 1) bad(where, 'a book needs pages');
    else b.pages.forEach((page) => isText(page, where));
  }
  const shelved = new Set();
  for (const f of folders) ((f.lore && f.lore.shelves) || []).forEach((s, i) => {
    const where = `${f.id}.lore.shelves[${i}]`;
    if (!books[s.book]) bad(where, `unknown book "${s.book}"`);
    shelved.add(s.book);
    isMap(s.map, where);
    const key = `${s.map}:${s.x}:${s.y}`;
    if (shelfAt.has(key)) bad(where, `two books on one shelf at ${key}`);
    shelfAt.add(key);
    const m = world && world.maps[s.map];
    if (m && Array.isArray(m.props) && !m.props.some((p) => LORE_PROPS.has(p.type) && p.x === s.x && p.y === s.y)) bad(where, `no bookshelf or book stack at ${key}`);
  });
  for (const id of Object.keys(books)) if (!shelved.has(id)) notes.push(`book ${id}: on no shelf`);

  for (const id of Object.keys(R.items)) if (!given.has(id) && !['wand', 'ember_dust', 'novice_cert', 'grey_letter', 'ring_leaf'].includes(id)) {
    const seen = JSON.stringify(Object.values(R.events)) + JSON.stringify(R.scripts);
    if (!seen.includes(`'${id}'`) && !seen.includes(`"${id}"`)) notes.push(`item ${id}: nothing gives or sells it`);
  }
  return { problems, notes, R };
}

/* ---------- the world from the current game: map sizes, solid tiles and known looks (optional) */
export function loadWorld(src = path.join(HERE, '../src/'), contentMaps = [], links = []) {
  try {
    const stub = () => new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'length' ? 0 : stub()), apply: () => stub(), construct: () => stub(), set: () => true });
    const doc = { createElement: () => stub(), getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], head: stub(), body: stub(), readyState: 'loading', addEventListener() {} };
    const win = { document: doc, addEventListener() {}, setTimeout: () => 0, setInterval: () => 0, requestAnimationFrame: () => 0, performance: { now: () => 0 }, localStorage: { getItem: () => null, setItem() {} }, location: { search: '', pathname: '/' }, navigator: { userAgent: '' }, console: { log() {}, warn() {} }, devicePixelRatio: 1, innerWidth: 400, innerHeight: 800, getComputedStyle: () => ({}), Image: function () { return stub(); } };
    win.window = win;
    const ctx = vm.createContext(win);
    for (const f of ['characters', 'spirits', 'props_outdoor', 'outdoor_plus', 'props_ch45', 'props_ch67', 'buildings', 'furniture', 'interior_plus', 'hall_props', 'walltops', 'maps', 'village', 'whisperwood', 'mossgrove', 'interiors_props', 'interiors']) vm.runInContext(fs.readFileSync(src + f + '.js', 'utf8'), ctx, { filename: f });
    const H = win.H, maps = {};
    const info = (t) => (H.propsOutdoor && H.propsOutdoor.info && H.propsOutdoor.info[t]) || (H.furniture && H.furniture.info && H.furniture.info[t]) || null;
    /* the maps written as data (map descriptions: rows instead of ground) are read the same way */
    const all = Object.entries(H.maps).concat(contentMaps.map((m) => [m.id, { ...m, ground: m.rows, w: m.rows[0].length, h: m.rows.length }]));
    for (const [id, m] of all) {
      const ground = m.ground.map((row) => [...row].map((ch) => ['water', 'wall', 'void', 'lava', 'cave_rock', 'cave_wall', 'cave_carving', 'cave_lava', 'cave_pool', 'cave_stalagmite', 'cave_crystal', 'cave_nest'].includes(m.legend[ch])));
      const solid = ground.map((row) => row.slice());
      const gone = links.filter((link) => link.map === id).flatMap((link) => link.without || []);
      for (const p of m.props || []) { if (gone.some((g) => g.type === p.type && g.x === p.x && g.y === p.y)) continue; const i = info(p.type); if (!i || !i.solid || i.decor) continue; for (let y = 0; y < (i.fh || 1); y++) for (let x = 0; x < (i.fw || 1); x++) if (solid[p.y + y]) solid[p.y + y][p.x + x] = true; }
      for (const b of m.buildings || []) { const i = H.buildings.info[b.type]; for (let y = 0; y < i.fh; y++) for (let x = 0; x < i.fw; x++) if (solid[b.y + y]) solid[b.y + y][b.x + x] = true; }
      for (const [x, y] of m.passable || []) solid[y][x] = false;
      maps[id] = { w: m.w, h: m.h, solid, ground, props: (m.props || []).map((p) => ({ type: p.type, x: p.x, y: p.y })) };
    }
    return { maps, looks: new Set(H.chars.keys) };
  } catch (e) {
    return null;
  }
}

export async function loadFolders(dir = HERE) {
  const out = [];
  for (const f of ORDER) out.push((await import(pathToFileURL(path.join(dir, f, 'index.js')).href)).default);
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const folders = await loadFolders();
  const { hontoriExtensions } = await import('../game/content/check.hontori.mjs');
  const shared = folders[0];
  const { MAP_FOLDERS, buildMap } = await import('../game/maps/index.js');
  const world = loadWorld(undefined, MAP_FOLDERS.flatMap((folder) => (folder.maps || []).map((data) => buildMap(data, folder.text))), MAP_FOLDERS.flatMap((folder) => folder.links || []));
  const { problems, notes } = check(folders, { world, prices: shared.money.prices, extensions: (ctx) => hontoriExtensions(ctx, shared) });
  const n = (k) => Object.keys(folders.reduce((a, f) => ({ ...a, ...(f[k] || {}) }), {})).length;
  console.log(`Content: ${folders.map((f) => f.id).join(', ')}. ${n('text')} texts. World ${world ? 'loaded from src/' : 'not loaded (map and look checks skipped)'}.`);
  notes.forEach((x) => console.log('note: ' + x));
  problems.forEach((x) => console.log('PROBLEM: ' + x));
  console.log(problems.length ? `${problems.length} problem(s).` : 'No problems.');
  process.exit(problems.length ? 1 : 0);
}
