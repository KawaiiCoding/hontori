/*
 * tournament.js  (Hontori: features)
 * Job: Hontori's Ring Tournament (Halo Court) on the engine's runs of battles (systems/features/Gauntlet.js, used
 * under the tournament's own names): rounds in a row against ring holders, a save point before each round (the
 * same save point as the Storm Works gauntlet: gauntlet.js snapshot and restore), the Champions' Board between
 * rounds (systems/features/Standings.js; the music of the place plays there), a tune of its own for each round
 * ('tournament', then 'tournament_2' to 'tournament_4') and a round's own drawing twist ('flawless').
 *
 * Public API:
 *   installTournament(game)   registers:
 *     story.command   "ext:tournament"        { ext: 'tournament', tournament: id, won: [commands], lost: [commands] }
 *     story.command   "ext:tournamentLeave"   { ext: 'tournamentLeave', tournament: id }
 *     story.condition "ext:tournament"        { ext: 'tournament', tournament: id, round: n }  (a run is open, and
 *                                             stands at round n, counted from 1)
 *     service "tournaments" { open, stage, leave }, system "features:tournament", save section "tournament"
 *   boardRows(game, def, index)   the board's rows before round `index` (0-based; pure, for checks)
 *   musicOf(index)                the tune of round `index`
 *
 * Content `tournaments`: { id: { venue, rules, done, left, title, bracket: [{ who: 'player' | person or trainer id,
 *   out: the round they fall in }], between: [commands], rounds: [{ name, battle: { opponent }, twist, before, won }] } }
 */

import { installGauntlets, showStandings } from '../../systems/features/index.js';
import { snapshot, restore } from './gauntlet.js';
import { word } from './words.js';

export function musicOf(index) {
  return index > 0 ? `tournament_${Math.min(4, index + 1)}` : 'tournament';
}

function fromContent(game, key, id) {
  for (const folder of game.registry.all('content')) {
    const table = folder && folder[key];
    if (Array.isArray(table)) {
      const found = table.find((x) => x && x.id === id);
      if (found) return found;
    }
  }
  return null;
}

function portraitOf(game, look) {
  try {
    return look ? game.art.portrait('person', look) : null;
  } catch (error) {
    return null;
  }
}

export function boardRows(game, def, index) {
  const rounds = Array.isArray(def.rounds) ? def.rounds : [];
  const next = rounds[index] && rounds[index].battle ? rounds[index].battle.opponent : null;
  const round = index + 1;
  return (Array.isArray(def.bracket) ? def.bracket : []).map((entry) => {
    if (!entry) return null;
    if (entry.who === 'player') {
      return { name: word(game, 'shared.feat.board.you'), note: word(game, 'shared.feat.board.in'), portrait: portraitOf(game, game.config && game.config.playerLook), state: 'you' };
    }
    const trainer = fromContent(game, 'trainers', entry.who);
    const person = fromContent(game, 'people', entry.who);
    const name = word(game, (trainer && trainer.name) || (person && person.name) || entry.who);
    const look = (trainer && trainer.look) || (person && person.look) || null;
    const out = Number(entry.out) > 0 && Number(entry.out) < round;
    const facing = entry.who === next;
    return {
      name, portrait: portraitOf(game, look),
      state: out ? 'out' : facing ? 'next' : 'in',
      note: out ? word(game, 'shared.feat.board.out', { n: entry.out }) : facing ? word(game, 'shared.feat.board.facing') : word(game, 'shared.feat.board.in'),
    };
  }).filter(Boolean);
}

export function installTournament(game) {
  const quiet = () => {
    try {
      if (typeof game.sound.battle === 'function') game.sound.battle(null);
    } catch (error) {
      /* the music never stops a run */
    }
  };
  return installGauntlets(game, {
    snapshot: () => snapshot(game),
    restore: (data) => restore(game, data),
    command: 'ext:tournament',
    leave: 'ext:tournamentLeave',
    condition: 'ext:tournament',
    contentKey: 'tournaments',
    section: 'tournament',
    idKey: 'tournament',
    stagesKey: 'rounds',
    stageKey: 'round',
    stageBase: 1,
    service: 'tournaments',
    system: 'features:tournament',
    /* the Champions' Board before every round */
    async onStage({ def, index }) {
      quiet();
      const round = def.rounds[index] || {};
      await showStandings(game, {
        title: word(game, 'shared.feat.board.title'),
        sub: round.name ? word(game, 'shared.feat.board.next', { round: word(game, round.name) }) : '',
        rows: boardRows(game, def, index),
        go: word(game, 'shared.feat.board.go'),
      });
    },
    dress(battle, { step, index }) {
      const out = { music: musicOf(index) };
      if (typeof step.twist === 'string') out.twist = step.twist;
      return out;
    },
    onEnd: quiet,
  });
}
