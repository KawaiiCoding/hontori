/*
 * wandDuel.js  (Hontori game layer)
 * Job: the ring rule wandDuel, WAND TO WAND (Bedrock Hall): a caster duel with no hontori on the field. The kid
 * and the Warden each draw one sigil a round; the Warden's sigil for the round is shown first, so the kid
 * answers it. Three sigils, each beating one other:
 *   Aegis Ward  (shield)  blocks a strike and turns a little of it back on the striker
 *   Rally Rune  (boost)   the strike: drains the other caster's focus; it breaks a seal being drawn
 *   Thunder Seal (stun)   breaks a ward; the warder loses its next turn
 * Two strikes both land; two wards or two seals cancel; a sealed caster draws nothing that round, and a seal
 * on a caster who is already sealed fizzles (nobody is locked out two rounds in a row). Whoever's focus runs
 * out loses. The Warden draws her sigils in the order of her `pattern`, which repeats, so a watchful kid can
 * read it; a sealed round still uses up her step. The first time round the pattern (and after a wrong answer)
 * the turn names the sigil that answers hers.
 *
 * Public API:
 *   WAND_SPELLS                 ['shield', 'stun', 'boost']: always all three in a wand duel (nothing to learn
 *                               first, so the duel can never dead-end)
 *   ANSWER                      Warden sigil -> the sigil that beats it
 *   STRIKE, STRIKE_FLAWLESS, ECHO   focus a strike drains (a flawless drawing drains more) and a ward turns back
 *   clash(mine, theirs, power)  -> { me: { loss, sealed, blocked, broke }, foe: { ... }, line } (pure, for checks)
 *   isWandDuel(setup)           the setup names the rule wandDuel
 *   new WandDuel(setup, { random })   the engine Battle with these rules. setup: the battle setup of setup.js
 *                               (trainer.wand { focus, kidFocus, pattern }, wand spellXp / spellMastery / perks,
 *                               party (only for the report: nobody fights), env)
 *     begin()                   opening lines and the first turn
 *     castSpell(kind, accuracy) the kid's sigil this round -> events
 *     waitSealed()              the kid is sealed this round: the Warden acts alone -> events
 *     focus, focusMax, foeFocus, foeFocusMax, foeSigil (null while she is sealed), sealed (the kid), round,
 *     trainer, tolerance(kind), mastery(kind)
 * Events: say { id, text }, duelTurn { round, foeSigil, sealed, foeSealed, hint, hintText }, duelCast { side,
 *   kind, grade }, duelClash { me, foe }, focus { target, amount, focus, max }, end { result, report }.
 * report: the shape of turn.js finish (no party change, no items, no binding); foeLevel is the lead's level, so
 *   the purse and EXP follow the party like any ring duel.
 */

import { Battle } from '../../systems/battle/Battle.js';
import { GRADES, gradeOf, masteryOf, tolerance as slackOf } from './spells.js';
import { line } from './text.js';

export const WAND_SPELLS = Object.freeze(['shield', 'stun', 'boost']);
export const ANSWER = Object.freeze({ shield: 'stun', stun: 'boost', boost: 'shield' });
export const STRIKE = 2;
export const STRIKE_FLAWLESS = 3;
export const ECHO = 1;

const DEFAULT_FOCUS = 8;
const DEFAULT_PATTERN = ['shield', 'boost', 'stun', 'boost'];

function side() {
  return { loss: 0, sealed: false, blocked: false, broke: false };
}

/* one round: mine and theirs are 'shield' | 'stun' | 'boost' | null (sealed); power: the strike of each side */
export function clash(mine, theirs, power) {
  const p = Object.assign({ me: STRIKE, foe: STRIKE }, power);
  const out = { me: side(), foe: side(), line: 'wdQuiet' };
  const act = (a, b, A, B, pa) => {
    /* a's sigil against b's; A and B are the result records of a and b */
    if (a === 'boost') {
      if (b === 'shield') {
        B.blocked = true;
        A.loss += ECHO;
      } else B.loss += pa;
    } else if (a === 'stun' && b === 'shield') {
      /* the seal breaks the ward and the warder loses its next turn; against a strike it is broken off, against
         a seal it cancels, against a sealed caster it fizzles */
      B.broke = true;
      B.sealed = true;
    }
  };
  act(mine, theirs, out.me, out.foe, p.me);
  act(theirs, mine, out.foe, out.me, p.foe);
  if (mine && theirs && ANSWER[theirs] === mine) out.line = `wdAnswer_${mine}`;
  else if (mine && theirs && ANSWER[mine] === theirs) out.line = `wdWrong_${theirs}`;
  else if (!theirs && mine === 'boost') out.line = 'wdFreeStrike';
  else if (!mine && theirs === 'boost') out.line = 'wdSealedHit';
  else if (mine && mine === theirs) out.line = `wdSame_${mine}`;
  return out;
}

export function isWandDuel(setup) {
  const s = setup || {};
  const rules = [...(Array.isArray(s.rules) ? s.rules : []), ...(s.trainer && Array.isArray(s.trainer.rules) ? s.trainer.rules : [])];
  return rules.includes('wandDuel');
}

function say(b, id, vars) {
  b.emit('say', { id, text: line(id, vars) });
}

function mastery(b, kind) {
  return masteryOf(b.state.spellXp[kind], b.state.spellMastery[kind]);
}

function foeSigilOf(S) {
  if (S.foeSealed) return null;
  return S.pattern[S.step % S.pattern.length] || 'boost';
}

function hintOf(S) {
  if (S.sealed) return 'wdHintSealed';
  const theirs = foeSigilOf(S);
  if (!theirs) return 'wdHintFree';
  if (S.round <= S.pattern.length || S.missed) return `wdHint_${theirs}`;
  return 'wdHintRead';
}

function emitTurn(b) {
  const S = b.state;
  S.round = b.round;
  const id = hintOf(S);
  const theirs = foeSigilOf(S);
  b.emit('duelTurn', {
    round: b.round, foeSigil: theirs, sealed: S.sealed, foeSealed: S.foeSealed, hint: id,
    hintText: line(id, { trainer: S.name })
  });
}

function report(b, result) {
  const S = b.state;
  const won = result === 'won';
  return {
    result, won, captured: false, fled: false, foeKey: null, foeLevel: S.level, trainer: S.name || true,
    participants: [], active: 0, party: [], mana: S.mana, itemsUsed: {}, spellXp: Object.assign({}, S.spellXp),
    spellMastery: Object.assign({}, S.spellMastery), wandExp: S.wandExp, seen: [], bound: null, boundOnce: !!S.boundOnce,
    countsAsBattle: false, rounds: b.round
  };
}

function focusEvent(b, target, amount) {
  const S = b.state;
  const key = target === 'me' ? 'focus' : 'foeFocus';
  S[key] = Math.max(0, S[key] - amount);
  b.emit('focus', { target, amount, focus: S[key], max: target === 'me' ? S.focusMax : S.foeFocusMax });
}

function resolve(b, mine, grade) {
  const S = b.state;
  const theirs = foeSigilOf(S);
  const kidSealed = S.sealed;
  if (theirs) b.emit('duelCast', { side: 'foe', kind: theirs, grade: 'strong' });
  const power = { me: grade === 'flawless' ? STRIKE_FLAWLESS : STRIKE, foe: STRIKE };
  const r = clash(kidSealed ? null : mine, theirs, power);
  b.emit('duelClash', { me: r.me, foe: r.foe, mine: kidSealed ? null : mine, theirs });
  say(b, r.line, { trainer: S.name });
  if (r.foe.loss) focusEvent(b, 'foe', r.foe.loss);
  if (r.me.loss) focusEvent(b, 'me', r.me.loss);
  S.missed = !!(mine && theirs && ANSWER[mine] === theirs);
  S.step++;
  S.sealed = r.me.sealed;
  S.foeSealed = r.foe.sealed;
  if (S.foeFocus <= 0) {
    say(b, 'wdWon', { trainer: S.name });
    b.finish('won', report(b, 'won'));
    return;
  }
  if (S.focus <= 0) {
    say(b, 'wdLost', { trainer: S.name });
    b.finish('lost', report(b, 'lost'));
    return;
  }
  if (S.sealed) say(b, 'wdYouSealed');
  if (S.foeSealed) say(b, 'wdFoeSealed', { trainer: S.name });
  b.emit('roundEnd', { round: b.round });
  b.startRound();
  emitTurn(b);
}

export const wandDuelRules = {
  setup(b, s) {
    const S = b.state;
    const TR = s.trainer || {};
    const w = TR.wand || {};
    const wand = s.wand || {};
    const lead = (Array.isArray(s.party) && s.party[0]) || {};
    S.trainer = TR;
    S.name = TR.name || '';
    S.level = Math.max(1, lead.level || 1);
    S.focusMax = Math.max(1, Math.round(Number(w.kidFocus) || DEFAULT_FOCUS));
    S.foeFocusMax = Math.max(1, Math.round(Number(w.focus) || DEFAULT_FOCUS));
    S.focus = S.focusMax;
    S.foeFocus = S.foeFocusMax;
    const pattern = (Array.isArray(w.pattern) ? w.pattern : []).filter((k) => WAND_SPELLS.includes(k));
    S.pattern = pattern.length ? pattern : DEFAULT_PATTERN.slice();
    S.step = 0;
    S.sealed = false;
    S.foeSealed = false;
    S.missed = false;
    S.mana = wand.mana == null ? null : wand.mana;
    S.perks = wand.perks || { tolerance: 0 };
    S.spellXp = Object.assign({}, wand.spellXp);
    S.spellMastery = Object.assign({}, wand.spellMastery);
    S.wandExp = 0;
    S.boundOnce = !!(s.flags && s.flags.boundOnce);
    S.env = Object.assign({ time: 12, weather: 'clear', indoor: true }, s.env);
  },

  begin(b) {
    const S = b.state;
    say(b, 'wdIntro', { trainer: S.name });
    say(b, 'wdHow');
    b.startRound();
    emitTurn(b);
  },

  check(b, action, p) {
    const S = b.state;
    if (action === 'spell') {
      if (S.sealed) return { reason: 'sealed', text: line('wdHintSealed') };
      if (!WAND_SPELLS.includes(p.kind)) return { reason: 'shape', text: line('wdRefuseShape') };
    }
    if (action === 'wait' && !S.sealed) return { reason: 'free', text: '' };
    return null;
  },

  actions: {
    spell(b, p) {
      const S = b.state;
      const kind = p.kind;
      const grade = gradeOf(p.accuracy);
      const G = GRADES[grade];
      const before = mastery(b, kind);
      S.spellXp[kind] = (S.spellXp[kind] || 0) + G.exp;
      S.wandExp += G.exp;
      const now = mastery(b, kind);
      S.spellMastery[kind] = now;
      b.emit('duelCast', { side: 'me', kind, grade, masteryUp: now > before, mastery: now });
      resolve(b, kind, grade);
    },
    wait(b) {
      resolve(b, null, null);
    }
  }
};

export class WandDuel extends Battle {
  constructor(setup, options) {
    super(wandDuelRules, setup, options);
  }

  castSpell(kind, accuracy) { return this.perform('spell', { kind, accuracy }); }
  waitSealed() { return this.perform('wait'); }

  get focus() { return this.state.focus; }
  get focusMax() { return this.state.focusMax; }
  get foeFocus() { return this.state.foeFocus; }
  get foeFocusMax() { return this.state.foeFocusMax; }
  get foeSigil() { return foeSigilOf(this.state); }
  get sealed() { return this.state.sealed; }
  get foeSealed() { return this.state.foeSealed; }
  get trainer() { return this.state.trainer; }
  get env() { return this.state.env; }
  mastery(kind) { return mastery(this, kind); }
  tolerance(kind) { return slackOf(mastery(this, kind), this.state.perks); }
}
