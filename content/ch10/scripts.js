/*
 * ch10/scripts.js
 * Job: the scripts of chapter 10: the lookout on the stair, Attendant Odile's ramen and bed, the locked Council
 * gate and Merrit's sketch, the hall and Vael's note, the three Councillors, Vael in his study and the duel
 * (rule seal), the fall, the city asked and the Great V, mercy (the player's choice: ask Vael whether he wants
 * to see, or leave him to the Wardens; both are respected, rule 71), the new law (the player writes its first
 * line; the hidden last line is undone), Vael's garden (the jars open, the sleepers go home, Ida's friend),
 * the ending (picture story, credits, home), and after the end the fair, the Warden rematches and Vael.
 *
 * Vael never threatens and never raises his voice. He was afraid of what he could not keep safe (rule 104):
 * as a boy he hid a frightened spark in his sleeve (chapter 7's letter), and later he closed his own eyes and
 * then everyone's. The grey closed eye on every seal is his.
 *
 * Library commands used here (content/shared/extensions.js), each with a fallback so no step can dead-end
 * (rule 8):
 *   { ext: 'greatV', who, text, sub, done, weak }   the group drawing; afterwards c10:greatv is set here
 *        whatever happened, and if the screen is missing the plain V is drawn with ext draw.
 *   { ext: 'law', title, sub, lines: [{ text, flag }] }   the new first line; if no law flag is set afterwards
 *        (the screen missing), a plain choose asks the same.
 *   { ext: 'ending', story, credits }   the picture story and the credits; then a plain travel fade takes the
 *        kid home, where the home scene waits (an auto event, so it also runs if the kid walks home).
 * The last bloom of the kid's hontori needs no command: the bloom system asks after Vael's duel by itself.
 */

import P from './places.js';

const LAW = { any: ['c10:law_shared', 'c10:law_seen', 'c10:law_free'] };

/* the law's new first line, said by whoever reads it */
const lawLine = (who) => ({
  branch: [
    { if: 'c10:law_shared', then: [{ say: 'ch10.law.line.shared', who }] },
    { if: 'c10:law_seen', then: [{ say: 'ch10.law.line.seen', who }] }
  ],
  else: [{ say: 'ch10.law.line.free', who }]
});

/* a Warden's friendly duel after the end: asked first, the purse on the first win only */
const rematch = (warden, trainer) => [
  { say: 'ch10.re.' + warden + '.1', who: warden },
  {
    choose: [
      { text: 'ch10.re.opt', then: [] },
      { text: 'ch10.re.no', then: [{ say: 'ch10.re.later', who: warden }, { stop: true }] }
    ],
    cancel: 1
  },
  {
    battle: { opponent: trainer },
    after: 'wake',
    won: [{ flag: 'c10:re:' + warden }, { say: 'ch10.re.' + warden + '.2', who: warden }],
    else: [{ say: 'ch10.re.lost', who: warden }]
  }
];

const RAMEN = [
  { heal: { hp: 'full', rest: true } },
  { ext: 'mana', set: 'full' },
  { sound: 'sparkle' },
  { fx: 'smoke', n: 6, dy: -14 },
  { toast: 'ch1.bo.10' }
];

export default {
  /* halfway up: Goldmere below, and far to the south a line of hills that looks like home */
  'ch10.lookout': [
    { wait: 300 },
    { say: 'ch10.ev.lookout.1', who: 'kid' },
    { say: 'ch10.ev.lookout.2', who: 'kid' },
    { say: 'ch10.ev.lookout.3', who: 'companion' }
  ],

  /* Attendant Odile: the Council told her to turn people back; she gives ramen and her bed instead */
  'ch10.svc.landing': [
    { if: 'c10:complete', then: [{ say: 'ch10.ev.odile.after', who: 'attendant' }, { stop: true }] },
    { say: 'ch10.ev.odile.1', who: 'attendant' },
    {
      choose: [
        { text: 'ch10.ev.odile.ramen', then: RAMEN.concat([{ say: 'ch10.ev.odile.2', who: 'attendant' }]) },
        { text: 'ch10.ev.odile.bed', then: [{ run: 'ch10.svc.bed' }] },
        { text: 'ch1.bo.opt.none', then: [{ say: 'ch10.ev.odile.3', who: 'attendant' }] }
      ],
      cancel: 2
    }
  ],
  'ch10.svc.hallbench': [
    { blackout: 900, then: [{ wait: 400 }, { heal: { hp: 'full', rest: true } }, { ext: 'mana', set: 'full' }] },
    { toast: 'ch10.ev.hallbench' }
  ],
  'ch10.svc.bed': [
    { say: 'ch10.ev.odile.bed.1', who: 'attendant' },
    { sound: 'sleep' },
    { fade: 800 },
    { rest: { hours: 8 } },
    { toast: 'ch1.bo.4' },
    { if: { companion: true }, then: [{ say: 'ch10.ev.odile.bed.2', who: 'companion' }] }
  ],

  /* PAYOFF (chapter 8): the Council gate is locked; Merrit's sketch shows the side way behind the ivy */
  'ch10.landing': [
    { say: 'ch10.ev.lock.1', who: 'kid' },
    { say: 'ch10.ev.lock.2', who: 'sign' },
    {
      if: { has: 'stair_sketch' },
      then: [
        { say: 'ch10.ev.lock.3', who: 'kid' },
        { say: 'ch8.sketch.2', who: 'letter' },
        { say: 'ch10.ev.lock.4', who: 'kid' }
      ],
      else: [{ say: 'ch10.ev.lock.nosketch', who: 'kid' }]
    },
    { sound: 'door' },
    { flag: 'c10:sketch' },
    { say: 'ch10.ev.lock.5', who: 'kid' },
    { say: 'ch10.ev.lock.6', who: 'companion' }
  ],

  /* the hall; Vael moves from the plaza to his study, and sends word by paper bird (rule 90) */
  'ch10.hall': [
    { flag: 'c10:hall' },
    { remove: 'orlen' },
    { spawn: 'orlen', at: P.vsVael },
    { say: 'ch10.ev.hall.1', who: 'kid' },
    { say: 'ch10.ev.hall.2', who: 'kid' },
    { ext: 'flight', what: 'paper_bird' },
    { say: 'ch10.ev.hall.note.1', who: 'letter' },
    { say: 'ch10.ev.hall.note.2', who: 'letter' },
    { say: 'ch10.ev.hall.3', who: 'companion' },
    { helper: 'c10_council', title: 'ch10.help.council.title', text: 'ch10.help.council', icon: 'light' }
  ],

  /* the Council: three chambers, each under one old rule the Council took from the schools */
  'ch10.brand': [
    { say: 'ch10.ev.brand.1', who: 'cn_brand' },
    { say: 'ch10.ev.brand.2', who: 'cn_brand' },
    { say: 'ch10.ev.brand.3', who: 'cn_brand' },
    { run: 'ch10.ready' },
    {
      ext: 'gauntlet',
      gauntlet: 'council_brand',
      won: [{ say: 'ch10.ev.brand.4', who: 'cn_brand' }, { say: 'ch10.ev.brand.5', who: 'companion' }],
      lost: [{ say: 'ch10.ev.council.lost', who: 'cn_brand' }]
    }
  ],
  'ch10.vesk': [
    { say: 'ch10.ev.vesk.1', who: 'cn_vesk' },
    { say: 'ch10.ev.vesk.2', who: 'cn_vesk' },
    { say: 'ch10.ev.vesk.3', who: 'cn_vesk' },
    { run: 'ch10.ready' },
    {
      ext: 'gauntlet',
      gauntlet: 'council_vesk',
      won: [{ say: 'ch10.ev.vesk.4', who: 'cn_vesk' }, { say: 'ch10.ev.vesk.5', who: 'companion' }],
      lost: [{ say: 'ch10.ev.council.lost', who: 'cn_vesk' }]
    }
  ],
  'ch10.hale': [
    { say: 'ch10.ev.hale.1', who: 'cn_hale' },
    { say: 'ch10.ev.hale.2', who: 'cn_hale' },
    { say: 'ch10.ev.hale.3', who: 'cn_hale' },
    { run: 'ch10.ready' },
    {
      ext: 'gauntlet',
      gauntlet: 'council_hale',
      won: [
        { say: 'ch10.ev.hale.4', who: 'cn_hale' },
        { say: 'ch10.ev.hale.5', who: 'cn_hale' },
        { say: 'ch10.ev.hale.6', who: 'kid' },
        { say: 'ch10.ev.hale.7', who: 'companion' }
      ],
      lost: [{ say: 'ch10.ev.council.lost', who: 'cn_hale' }]
    }
  ],
  /* every duel is asked first; "not yet" always leaves the way open */
  'ch10.ready': [
    {
      choose: [
        { text: 'ch10.ev.ready', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch10.ev.ready.wait', who: 'self' }, { stop: true }] }
      ],
      cancel: 1
    }
  ],

  /* Vael's study */
  'ch10.study': [
    { face: 'orlen', dir: 'player' },
    { say: 'ch10.ev.study.1', who: 'orlen' },
    { say: 'ch10.ev.study.2', who: 'orlen' },
    { say: 'ch10.ev.study.3', who: 'orlen' },
    { say: 'ch10.ev.study.4', who: 'orlen' },
    { say: 'ch10.ev.study.5', who: 'kid' },
    { say: 'ch10.ev.study.6', who: 'orlen' },
    { say: 'ch10.ev.study.7', who: 'orlen' },
    { run: 'ch10.vael.duel' }
  ],
  'ch10.vael.ask': [{ say: 'ch10.ev.study.again', who: 'orlen' }, { run: 'ch10.vael.duel' }],
  'ch10.vael.duel': [
    { helper: 'c10_seal', title: 'ch10.help.seal.title', text: 'ch10.help.seal', icon: 'light' },
    {
      choose: [
        { text: 'ch10.ev.ready', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch10.ev.study.wait', who: 'orlen' }, { stop: true }] }
      ],
      cancel: 1
    },
    {
      ext: 'gauntlet',
      gauntlet: 'vael',
      won: [{ run: 'ch10.fallen' }],
      lost: [{ say: 'ch10.ev.vael.lost.1', who: 'orlen' }, { say: 'ch10.ev.vael.lost.2', who: 'companion' }]
    }
  ],

  /* the fall: the last ring, the last bloom, and the hall below fills with light */
  'ch10.fallen': [
    { if: 'c10:fallen', then: [{ stop: true }] },
    { flag: 'c10:fallen' },
    { say: 'ch10.ev.fallen.1', who: 'kid' },
    { say: 'ch10.ev.fallen.2', who: 'orlen' },
    { say: 'ch10.ev.fallen.3', who: 'orlen' },
    { wait: 600 },
    { say: 'ch10.ev.fallen.4', who: 'kid' },
    { say: 'ch10.ev.fallen.5', who: 'companion' },
    { remove: 'orlen' },
    { spawn: 'greycloak', at: P.ahMerrit },
    { say: 'ch10.ev.fallen.6', who: 'kid' }
  ],

  /* the city is asked first (rule 71); then every Wander draws one stroke and the kid the last V */
  'ch10.city': [
    { wait: 500 },
    { say: 'ch10.ev.city.1', who: 'greycloak' },
    { say: 'ch10.ev.city.2', who: 'greycloak' },
    { say: 'ch10.ev.city.3', who: 'mira' },
    { say: 'ch10.ev.city.4', who: 'aurel' },
    { say: 'ch10.ev.city.5', who: 'aurel' },
    {
      choose: [
        { text: 'ch10.ev.city.ask', then: [] },
        { text: 'ch2.ev.notyet', then: [{ flag: 'c10:city:wait' }, { say: 'ch10.ev.city.wait', who: 'greycloak' }, { stop: true }] }
      ],
      cancel: 1
    },
    { say: 'ch10.ev.city.6', who: 'kid' },
    { say: 'ch10.ev.city.7', who: 'kid' },
    { wait: 900 },
    { say: 'ch10.ev.city.8', who: 'kid' },
    { say: 'ch10.ev.city.9', who: 'kid' },
    { say: 'ch10.ev.city.10', who: 'mom' },
    { run: 'ch10.greatv' }
  ],
  'ch10.greatv': [
    {
      ext: 'greatV',
      who: ['mira', 'cole', 'wren', 'pim', 'fern', 'zephra', 'maren', 'volta', 'harrow', 'brasa', 'nox', 'aurel', 'greycloak', 'lisel', 'mom', 'dad'],
      text: 'ch10.gv.draw',
      sub: 'ch10.gv.sub',
      done: 'ch10.gv.done',
      weak: 'ch10.gv.weak'
    },
    { flag: 'c10:greatv' },
    { wait: 700 },
    { say: 'ch10.ev.gv.1', who: 'kid' },
    { say: 'ch10.ev.gv.2', who: 'kid' },
    { say: 'ch10.ev.gv.3', who: 'kid' },
    { say: 'ch10.ev.gv.4', who: 'dad' },
    { say: 'ch10.ev.gv.5', who: 'companion' }
  ],

  /* MERCY: the Wardens bring Vael down. The player chooses; both answers are kept for the rest of the game */
  'ch10.mercy': [
    { spawn: 'orlen', at: P.ahVael },
    { face: 'orlen', dir: 'player' },
    { say: 'ch10.ev.mercy.1', who: 'nox' },
    { say: 'ch10.ev.mercy.2', who: 'orlen' },
    { say: 'ch10.ev.mercy.3', who: 'orlen' },
    { say: 'ch10.ev.mercy.4', who: 'orlen' },
    { say: 'ch10.ev.mercy.5', who: 'nox' },
    { say: 'ch10.ev.mercy.6', who: 'aurel' },
    {
      choose: [
        { text: 'ch10.ev.mercy.ask', desc: 'ch10.ev.mercy.ask.desc', then: [{ run: 'ch10.mercy.yes' }] },
        { text: 'ch10.ev.mercy.leave', desc: 'ch10.ev.mercy.leave.desc', then: [{ run: 'ch10.mercy.no' }] }
      ]
    }
  ],
  'ch10.mercy.yes': [
    { say: 'ch10.ev.mercy.yes.1', who: 'kid' },
    { wait: 1200 },
    { say: 'ch10.ev.mercy.yes.2', who: 'orlen' },
    { say: 'ch10.ev.mercy.yes.3', who: 'orlen' },
    { ext: 'draw', sigil: 'veil', text: 'ch10.ev.mercy.draw' },
    { sound: 'spell' },
    { wait: 900 },
    { say: 'ch10.ev.mercy.yes.4', who: 'orlen' },
    { say: 'ch10.ev.mercy.yes.5', who: 'kid' },
    { say: 'ch10.ev.mercy.yes.6', who: 'orlen' },
    { flag: 'c10:mercy' },
    { say: 'ch10.ev.mercy.yes.7', who: 'orlen' },
    { give: 'archmage_ring' },
    { say: 'ch10.ev.mercy.yes.8', who: 'companion' }
  ],
  'ch10.mercy.no': [
    { say: 'ch10.ev.mercy.no.1', who: 'kid' },
    { say: 'ch10.ev.mercy.no.2', who: 'aurel' },
    { say: 'ch10.ev.mercy.no.3', who: 'orlen' },
    { flag: 'c10:nomercy' },
    { say: 'ch10.ev.mercy.no.4', who: 'aurel' },
    { give: 'archmage_ring' },
    { say: 'ch10.ev.mercy.no.5', who: 'companion' }
  ],

  /* THE NEW LAW: eight votes and the last ring; the hidden last line is undone, the kid writes the first */
  'ch10.law': [
    { if: { not: { has: 'archmage_ring' } }, then: [{ give: 'archmage_ring' }] },
    { say: 'ch10.ev.law.1', who: 'aurel' },
    { say: 'ch10.ev.law.2', who: 'aurel' },
    { say: 'ch10.ev.law.3', who: 'kid' },
    { say: 'ch10.ev.law.4', who: 'kid' },
    { say: 'ch10.ev.law.5', who: 'fern' },
    { say: 'ch10.ev.law.6', who: 'kid' },
    { sound: 'chime' },
    { say: 'ch10.ev.law.7', who: 'kid' },
    { say: 'ch10.ev.law.8', who: 'aurel' },
    {
      ext: 'law',
      title: 'ch10.law.title',
      sub: 'ch10.law.sub',
      lines: [
        { text: 'ch10.law.line.shared', flag: 'c10:law_shared' },
        { text: 'ch10.law.line.seen', flag: 'c10:law_seen' },
        { text: 'ch10.law.line.free', flag: 'c10:law_free' }
      ]
    },
    {
      if: { not: LAW },
      then: [
        {
          choose: [
            { text: 'ch10.law.opt.shared', desc: 'ch10.law.line.shared', then: [{ flag: 'c10:law_shared' }] },
            { text: 'ch10.law.opt.seen', desc: 'ch10.law.line.seen', then: [{ flag: 'c10:law_seen' }] },
            { text: 'ch10.law.opt.free', desc: 'ch10.law.line.free', then: [{ flag: 'c10:law_free' }] }
          ]
        }
      ]
    },
    { sound: 'wand' },
    { flag: 'c10:law' },
    lawLine('kid'),
    { say: 'ch10.ev.law.9', who: 'aurel' },
    { give: 'charter' },
    { say: 'ch10.ev.law.10', who: 'mira' },
    { say: 'ch10.ev.law.11', who: 'companion' },
    { if: 'c10:mercy', then: [{ say: 'ch10.ev.law.mercy', who: 'orlen' }] },
    { remove: 'orlen' },
    { if: 'c10:mercy', then: [{ spawn: 'orlen', at: P.vgVael }], else: [{ spawn: 'orlen', at: P.vsVael }] },
    { say: 'ch10.ev.law.12', who: 'aurel' },
    { say: 'ch10.ev.law.13', who: 'kid' },
    { ext: 'travel', to: P.vgArrive }
  ],

  /* Vael's garden: the V opens the jars, the sleepers wake and go home; Ida's friend; Mira's last scene */
  'ch10.garden': [
    { wait: 400 },
    { say: 'ch10.ev.garden.1', who: 'kid' },
    { if: 'c10:mercy', then: [{ face: 'orlen', dir: 'player' }, { say: 'ch10.ev.garden.mercy.1', who: 'orlen' }] },
    { ext: 'draw', sigil: 'veil', text: 'ch10.ev.garden.draw' },
    { sound: 'spell' },
    { wait: 800 },
    { say: 'ch10.ev.garden.2', who: 'kid' },
    { say: 'ch10.ev.garden.3', who: 'kid' },
    { say: 'ch10.ev.garden.4', who: 'companion' },
    { say: 'ch10.ev.garden.5', who: 'kid' },
    { say: 'ch10.ev.garden.6', who: 'companion' },
    { wait: 500 },
    { say: 'ch10.ev.garden.7', who: 'kid' },
    { say: 'ch10.ev.garden.8', who: 'kid' },
    {
      if: 'c10:mercy',
      then: [{ say: 'ch10.ev.garden.mercy.2', who: 'orlen' }, { say: 'ch10.ev.garden.mercy.3', who: 'orlen' }],
      else: [{ say: 'ch10.ev.garden.nomercy.1', who: 'kid' }]
    },
    { say: 'ch10.ev.garden.9', who: 'kid' },
    { say: 'ch10.ev.garden.10', who: 'companion' },
    { wait: 500 },
    { move: 'mira', to: { player: [1, 0] } },
    { face: 'mira', dir: 'player' },
    {
      if: 'c10:mercy',
      then: [{ say: 'ch10.ev.mira.mercy.1', who: 'mira' }, { say: 'ch10.ev.mira.mercy.2', who: 'mira' }],
      else: [{ say: 'ch10.ev.mira.nomercy.1', who: 'mira' }, { say: 'ch10.ev.mira.nomercy.2', who: 'mira' }]
    },
    { say: 'ch10.ev.mira.3', who: 'lisel' },
    { say: 'ch10.ev.mira.4', who: 'cole' },
    { say: 'ch10.ev.mira.5', who: 'mira' },
    { say: 'ch10.ev.mira.6', who: 'kid' },
    { flag: 'c10:jars' }
  ],

  /* the ending: the picture story (it mirrors the opening; one panel follows the mercy choice), the
     credits, and home (travel is last: the fade starts when the script ends) */
  'ch10.ending': [
    { flag: 'c10:complete' },
    { wait: 600 },
    {
      if: 'c10:mercy',
      then: [{ ext: 'ending', story: 'ch10_end_mercy', credits: 'ch10' }],
      else: [{ ext: 'ending', story: 'ch10_end_nomercy', credits: 'ch10' }]
    },
    { quest: 'fair', start: true, quiet: true },
    { quest: 'wardens', start: true, quiet: true },
    { ext: 'travel', to: P.homeKid }
  ],
  'ch10.home': [
    { flag: 'c10:home' },
    { wait: 500 },
    { face: 'mom', dir: 'player' },
    { face: 'dad', dir: 'player' },
    { say: 'ch10.ev.home.1', who: 'mom' },
    { say: 'ch10.ev.home.2', who: 'dad' },
    lawLine('dad'),
    { say: 'ch10.ev.home.3', who: 'dad' },
    { if: { has: 'grandma_wand' }, then: [{ say: 'ch10.ev.home.wand.1', who: 'kid' }, { say: 'ch10.ev.home.wand.2', who: 'mom' }] },
    { say: 'ch10.ev.home.4', who: 'mom' },
    { say: 'ch10.ev.home.5', who: 'companion' },
    { say: 'ch10.ev.home.6', who: 'dad' },
    { say: 'ch10.ev.home.7', who: 'companion' },
    { helper: 'c10_after', title: 'ch10.help.after.title', text: 'ch10.help.after', icon: 'light' }
  ],

  /* the charter (key item): the new first line, then the book itself (the final lore book) */
  'ch10.charter': [lawLine('letter'), { ext: 'read', book: 'charter' }],

  /* after the end */
  'ch10.fair': [
    { flag: 'c10:fair' },
    { say: 'ch10.ev.fair.1', who: 'kid' },
    { say: 'ch10.ev.fair.2', who: 'kid' },
    { say: 'ch10.ev.fair.3', who: 'companion' }
  ],
  'ch10.vael.closed': [
    { say: 'ch10.ev.vael.after.no.1', who: 'orlen' },
    { say: 'ch10.ev.vael.after.no.2', who: 'orlen' }
  ],
  'ch10.re.fern': rematch('fern', 'fern_last'),
  'ch10.re.zephra': rematch('zephra', 'zephra_last'),
  'ch10.re.maren': rematch('maren', 'maren_last'),
  'ch10.re.volta': rematch('volta', 'volta_last'),
  'ch10.re.harrow': rematch('harrow', 'harrow_last'),
  'ch10.re.brasa': rematch('brasa', 'brasa_last'),
  'ch10.re.nox': rematch('nox', 'nox_last'),
  'ch10.re.aurel': rematch('aurel', 'aurel_last')
};
