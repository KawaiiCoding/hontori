/*
 * check.js
 * Job: the story part of the content check (debug only): every command has a system that carries it
 * out, every condition and value a system that answers it, every script that is run exists, every
 * speaker is known and every text that is shown exists.
 *
 * Public API:
 *   checkStory(story)   -> array of problems (strings); story: the running StoryRunner
 */

import { verbOf } from './Runner.js';
import { FALLBACK_COMMANDS } from './Commands.js';
import { FALLBACK_VALUES } from './Values.js';
import { FALLBACK_CONDITIONS } from './Conditions.js';

const BLOCK_KEYS = ['then', 'else', 'ok', 'fail', 'won', 'lost', 'fled', 'captured'];
const CONDITION_KEYS = ['if', 'off', 'until', 'goneIf', 'done', 'when'];
const TEXT_KEYS = ['text', 'desc', 'offText', 'title', 'toast', 'why'];

export function checkStory(story) {
  const { library, game } = story;
  const registry = game.registry;
  const problems = new Set();
  const missing = new Map();
  const report = (where, what) => problems.add(`${where}: ${what}`);
  /* a command or condition nobody handles is one problem, however often it is used */
  const unhandled = (where, what) => {
    const seen = missing.get(what);
    if (seen) seen.count++;
    else missing.set(what, { count: 1, where });
  };
  const knownText = (id) => typeof id !== 'string' || !/^[a-z0-9]+\.[a-z0-9_.:-]+$/.test(id) || story.strings.has(id);

  const condition = (cond, where) => {
    if (cond == null || typeof cond !== 'object') return;
    if (Array.isArray(cond)) return;
    const key = verbOf(cond);
    if (!registry.has('story.condition', key) && !FALLBACK_CONDITIONS[key]) unhandled(where, `no system answers the condition "${key}"`);
    for (const inner of cond.all || cond.any || cond.of || []) condition(inner, where);
    if (cond.not) condition(cond.not, where);
  };

  const value = (v, where) => {
    if (v === null || typeof v !== 'object' || Array.isArray(v)) return;
    const key = verbOf(v);
    if (!registry.has('story.value', key) && !FALLBACK_VALUES[key]) unhandled(where, `no system works out the value "${key}"`);
    if (v.pick) for (const [cond, result] of v.pick) {
      condition(cond, where);
      value(result, where);
    }
  };

  const params = (given, where) => {
    for (const p of Object.values(given || {})) {
      if (typeof p === 'string' && !knownText(p)) report(where, `missing text "${p}"`);
      else value(p, where);
    }
  };

  const block = (list, where) => {
    for (const cmd of list || []) command(cmd, where);
  };

  const command = (cmd, where) => {
    if (!cmd || typeof cmd !== 'object') return;
    const verb = verbOf(cmd);
    if (!registry.has('story.command', verb) && !FALLBACK_COMMANDS[verb]) unhandled(where, `no system carries out "${verb}"`);
    if (verb === 'say') {
      for (const id of [].concat(cmd.say)) if (!knownText(id)) report(where, `missing text "${id}"`);
      if (cmd.who && cmd.who !== 'self' && !library.people.has(cmd.who) && !library.voices[cmd.who]) report(where, `unknown speaker "${cmd.who}"`);
    }
    if (verb === 'run' && !library.scripts[cmd.run]) report(where, `no script "${cmd.run}"`);
    for (const key of TEXT_KEYS) if (typeof cmd[key] === 'string' && !knownText(cmd[key])) report(where, `missing text "${cmd[key]}"`);
    for (const key of CONDITION_KEYS) if (key in cmd) condition(cmd[key], where);
    params(cmd.params, where);
    for (const key of BLOCK_KEYS) if (Array.isArray(cmd[key])) block(cmd[key], where);
    if (cmd.choose) for (const option of cmd.choose) {
      for (const key of TEXT_KEYS) if (typeof option[key] === 'string' && !knownText(option[key])) report(where, `missing text "${option[key]}"`);
      if (option.if) condition(option.if, where);
      if (option.off) condition(option.off, where);
      params(option.params, where);
      block(option.then, where);
    }
    if (cmd.branch) for (const arm of cmd.branch) {
      condition(arm.if, where);
      block(arm.then, where);
    }
    for (const arms of [cmd.cycle, cmd.random]) if (Array.isArray(arms)) for (const arm of arms) block(arm, where);
  };

  for (const event of library.events) {
    condition(event.if, `event ${event.id}`);
    block(event.then, `event ${event.id}`);
  }
  for (const [id, script] of Object.entries(library.scripts)) block(script, `script ${id}`);
  for (const folder of library.folders) {
    for (const [type, handlers] of Object.entries(folder.interactions || {})) {
      for (const handler of handlers) {
        condition(handler.if, `${folder.id} interaction ${type}`);
        block(handler.then, `${folder.id} interaction ${type}`);
      }
    }
  }
  for (const def of library.people.values()) {
    const where = `person ${def.id}`;
    if (def.name && !knownText(def.name)) report(where, `missing text "${def.name}"`);
    for (const id of def.lines || []) if (!knownText(id)) report(where, `missing text "${id}"`);
    if (def.service && !library.scripts[def.service]) report(where, `no script "${def.service}"`);
    condition(def.goneIf, where);
    for (const phase of def.phases || []) {
      condition(phase.if, where);
      if (phase.name && !knownText(phase.name)) report(where, `missing text "${phase.name}"`);
      if (phase.service && !library.scripts[phase.service]) report(where, `no script "${phase.service}"`);
    }
  }
  for (const [what, { count, where }] of missing) problems.add(`${what} (${count} uses, first in ${where})`);
  return [...problems];
}
