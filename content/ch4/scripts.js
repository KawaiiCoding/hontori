/*
 * ch4/scripts.js
 * Job: the scripts of chapter 4: the ferry (Hask's word pays the first crossing, a ticket every one after) and the
 * first crossing south, Warden Maren at the flooded hall, the drowned bell and the old order, the tide wheels,
 * the kite letters from Orlen Vael and Rook, Mira and Lisel, Mira's rematch, Hollis's tea in the Saltmarsh, the
 * bench in Deepbell Hall, the ring duel, and the Salt Kettle (ramen and the guest bed).
 */

const TICKET = 10;
/* the ride: the deck of the ferry map on open water, then the pier at the other end (ext travel) */
const SOUTH = { to: { map: 'tidewell', x: 28, y: 39, dir: 1 }, via: { map: 'ferry', x: 12, y: 14, dir: 0, heading: 0 } };
const NORTH = { to: { map: 'kitewick', x: 11, y: 24, dir: 1 }, via: { map: 'ferry', x: 12, y: 14, dir: 1, heading: 1 } };

export default {
  'ch4.ferry.closed': [{ say: 'ch4.ferry.closed', who: 'kid' }],
  /* boarding: the first crossing is on Hask; after it a ticket is needed (bought once, at either end) */
  'ch4.board.south': [
    { if: { all: ['c4:ferry:free', { not: { has: 'ferry_ticket' } }] }, then: [{ run: 'ch4.fare' }] },
    { if: { all: ['c4:ferry:free', { not: { has: 'ferry_ticket' } }] }, then: [{ stop: true }] },
    { ext: 'travel', ...SOUTH, seconds: 6, during: [{ run: 'ch4.crossing' }] }
  ],
  'ch4.board.north': [
    { if: { not: { has: 'ferry_ticket' } }, then: [{ run: 'ch4.fare' }] },
    { if: { not: { has: 'ferry_ticket' } }, then: [{ stop: true }] },
    { ext: 'travel', ...NORTH, seconds: 6, during: [{ run: 'ch4.crossing' }] }
  ],
  'ch4.crossing': [
    { if: { not: 'c4:ferry:free' }, then: [{ run: 'ch4.ferry.first' }], else: [{ say: 'ch4.p.ferryman.1', who: 'ferryman' }] }
  ],
  'ch4.ferry.first': [
    { say: 'ch4.ferry.hask.1', who: 'ferryman' },
    { say: 'ch4.ferry.hask.2', who: 'ferryman' },
    { flag: 'c4:ferry:free' },
    { say: 'ch4.crossing.1', who: 'ferryman' },
    { say: 'ch4.crossing.2', who: 'ferryman' },
    { say: 'ch4.crossing.3', who: 'kid' },
    { say: 'ch4.crossing.4', who: 'companion' },
    { say: 'ch4.crossing.5', who: 'ferryman' }
  ],
  /* Hask's word paid the first crossing; every one after needs the ticket, bought once */
  'ch4.fare': [
    { say: 'ch4.ferry.ticket.1', who: 'ferryman', params: { coins: { coins: TICKET } } },
    {
      choose: [
        { text: 'ch4.ferry.ticket.opt', params: { coins: { coins: TICKET } }, then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch4.ferry.later', who: 'ferryman' }, { stop: true }] }
      ],
      cancel: 1
    },
    {
      spend: TICKET,
      ok: [{ give: 'ferry_ticket' }],
      fail: [{ say: 'ch4.ferry.ticket.short', who: 'ferryman', params: { coins: { coins: TICKET } } }]
    }
  ],
  'ch4.hall.closed': [
    { say: 'ch4.hall.closed.1', who: 'kid' },
    { if: { not: 'c4:maren' }, then: [{ say: 'ch4.hall.closed.2', who: 'kid' }] }
  ],
  'ch4.maren.meet': [
    { say: 'ch4.ev.maren.1', who: 'maren' },
    { say: 'ch4.ev.maren.2', who: 'maren' },
    { say: 'ch4.ev.maren.3', who: 'maren' },
    { say: 'ch4.ev.maren.4', who: 'maren' },
    { say: 'ch4.ev.maren.5', who: 'maren' },
    {
      if: { not: { ext: 'spell', has: 'sleep' } },
      then: [{ say: 'ch4.ev.maren.6', who: 'maren' }]
    },
    { flag: 'c4:maren' },
    { say: 'ch4.ev.maren.9', who: 'companion' }
  ],
  'ch4.svc.wheels': [
    { if: 'c4:bell', then: [{ stop: true }] },
    { if: 'c4:stair', then: [{ say: 'ch4.ev.wheels.1', who: 'isk' }, { stop: true }] },
    {
      choose: [
        {
          text: 'ch4.ev.wheels.2',
          then: [{ puzzle: 'tide', do: 'reset' }, { sound: 'splash' }, { say: 'ch4.ev.wheels.3', who: 'isk' }]
        },
        { text: 'ch4.ev.wheels.4', then: [{ say: 'ch4.ev.wheels.5', who: 'isk' }] }
      ],
      cancel: 1
    }
  ],
  'ch4.bell': [
    { say: 'ch4.ev.bell.1', who: 'kid' },
    { say: 'ch4.ev.bell.2', who: 'companion' },
    {
      if: { not: { ext: 'spell', has: 'sleep' } },
      then: [{ say: 'ch4.ev.bell.3', who: 'kid' }, { say: 'ch4.ev.bell.4', who: 'companion' }, { stop: true }]
    },
    {
      choose: [
        { text: 'ch4.ev.bell.opt', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch4.ev.bell.5', who: 'kid' }, { stop: true }] }
      ],
      cancel: 1
    },
    { say: 'ch4.ev.bell.6', who: 'companion' },
    { ext: 'draw', sigil: 'sleep', text: 'ch4.ev.bell.draw', twist: 'mirror' },
    { sound: 'sleep' },
    { wait: 500 },
    { say: 'ch4.ev.bell.7', who: 'kid' },
    { say: 'ch4.ev.bell.8', who: 'kid' },
    { sound: 'page' },
    { run: 'ch4.order' },
    { give: 'bell_order' },
    { flag: 'c4:order' },
    { say: 'ch4.ev.bell.9', who: 'kid' },
    { say: 'ch4.ev.bell.10', who: 'companion' },
    { say: 'ch4.ev.bell.11', who: 'isk' },
    {
      blackout: 1200,
      then: [{ sound: 'creak' }, { wait: 400 }, { sound: 'splash' }, { wait: 400 }, { sound: 'bell' }, { flag: 'c4:bell' }, { time: { add: 1 } }]
    },
    { toast: 'ch4.ev.bell.12' },
    { say: 'ch4.ev.bell.13', who: 'isk' },
    { say: 'ch4.ev.bell.14', who: 'kid' },
    {
      choose: [
        { text: 'ch4.ev.bell.take', then: [{ ext: 'addHontori', kind: 'bellfish', level: 11 }, { say: 'ch4.ev.bell.15', who: 'companion' }] },
        { text: 'ch4.ev.bell.leave', then: [{ say: 'ch4.ev.bell.16', who: 'isk' }] }
      ],
      cancel: 1
    }
  ],
  'ch4.order': [
    { say: 'ch4.order.1', who: 'sign' },
    { say: 'ch4.order.2', who: 'sign' }
  ],
  'ch4.vaelletter': [
    { say: 'ch4.vael.1', who: 'orlen' },
    { say: 'ch4.vael.2', who: 'orlen' },
    { say: 'ch4.vael.3', who: 'orlen' }
  ],
  'ch4.rookletter': [
    { say: 'ch4.rook.1', who: 'rook' },
    { say: 'ch4.rook.2', who: 'rook' },
    { say: 'ch4.rook.3', who: 'rook' }
  ],
  'ch4.lisel': [
    { say: 'ch4.ev.mira.4', who: 'mira' },
    {
      choose: [
        { text: 'ch4.ev.mira.opt', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch4.ev.mira.5', who: 'mira' }, { stop: true }] }
      ],
      cancel: 1
    },
    { say: 'ch4.ev.mira.6', who: 'kid' },
    { say: 'ch4.ev.mira.7', who: 'lisel' },
    { say: 'ch4.ev.mira.8', who: 'lisel' },
    { say: 'ch4.ev.mira.9', who: 'kid' },
    { say: 'ch4.ev.mira.10', who: 'companion' },
    { say: 'ch4.ev.mira.11', who: 'mira' },
    { flag: 'c4:lisel' },
    { run: 'ch4.svc.mira' }
  ],
  'ch4.svc.mira': [
    { if: { not: 'c4:lisel' }, then: [{ stop: true }] },
    { if: 'c4:mira', then: [{ say: 'ch4.ev.mira.done', who: 'mira' }, { stop: true }] },
    { say: 'ch4.ev.mira.12', who: 'mira' },
    {
      choose: [
        { text: 'ch1.duel.opt.mira', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch4.ev.mira.5', who: 'mira' }, { stop: true }] }
      ],
      cancel: 1
    },
    {
      battle: { opponent: 'mira_tidewell' },
      after: 'wake',
      won: [
        { flag: 'c4:mira' },
        { say: 'ch4.ev.mira.13', who: 'mira' },
        { say: 'ch4.ev.mira.14', who: 'mira' },
        { say: 'ch4.ev.mira.15', who: 'companion' }
      ],
      else: [{ say: 'ch4.ev.mira.16', who: 'mira' }]
    }
  ],
  'ch4.svc.hollis': [
    { if: { flag: 'c4:tea', is: 'today' }, then: [{ say: 'ch4.hollis.4', who: 'hollis' }, { stop: true }] },
    { say: 'ch4.hollis.1', who: 'hollis' },
    {
      choose: [
        { text: 'ch4.hollis.opt', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch4.hollis.2', who: 'hollis' }, { stop: true }] }
      ],
      cancel: 1
    },
    { blackout: 800, then: [{ sound: 'sizzle' }, { wait: 300 }, { heal: { hp: 'full' } }, { flag: 'c4:tea', value: 'today' }] },
    { toast: 'ch4.hollis.3' },
    { say: 'ch4.hollis.5', who: 'companion' }
  ],
  'ch4.svc.hallbench': [
    { if: 'c4:hall:rested', then: [{ say: 'ch4.ev.hallbench.3', who: 'isk' }, { stop: true }] },
    { say: 'ch4.ev.hallbench.1', who: 'isk' },
    { blackout: 900, then: [{ wait: 400 }, { heal: { hp: 'full', rest: true } }, { ext: 'mana', set: 'full' }, { flag: 'c4:hall:rested' }] },
    { toast: 'ch4.ev.hallbench.2' }
  ],
  'ch4.ringduel': [
    { if: 'c4:order', then: [{ say: 'ch4.ev.ring.0', who: 'maren' }] },
    { say: 'ch4.ev.ring.1', who: 'maren' },
    { say: 'ch4.ev.ring.2', who: 'maren' },
    {
      choose: [
        { text: 'ch2.ev.13', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch4.ev.ring.3', who: 'maren' }, { stop: true }] }
      ],
      cancel: 1
    },
    {
      battle: { opponent: 'maren' },
      after: 'wake',
      won: [
        { flag: 'c4:ring' },
        { ext: 'ring', element: 'water' },
        { give: 'tide_ring' },
        { money: 50, why: 'ch2.ev.15' },
        { say: 'ch4.ev.ring.4', who: 'maren' },
        { say: 'ch4.ev.ring.5', who: 'maren' },
        { say: 'ch4.ev.ring.6', who: 'maren' },
        { say: 'ch4.ev.ring.7', who: 'companion' }
      ],
      else: [{ say: 'ch4.ev.ring.8', who: 'maren' }]
    }
  ],
  'ch4.svc.guestbed': [
    { say: 'ch4.inn.1', who: 'td_innkeeper', params: { coins: { coins: { price: 'guest_bed' } } } },
    {
      choose: [
        { text: 'ch1.bo.opt.rest', then: [] },
        { text: 'ch1.bo.opt.no', then: [{ say: 'ch4.inn.2', who: 'td_innkeeper' }, { stop: true }] }
      ],
      cancel: 1
    },
    {
      spend: { price: 'guest_bed' },
      fail: [{ say: 'ch4.inn.3', who: 'td_innkeeper', params: { coins: { coins: { price: 'guest_bed' } } } }, { stop: true }]
    },
    { sound: 'sleep' },
    { fade: 800 },
    { rest: { hours: 8 } },
    { toast: 'ch1.bo.4' },
    { if: { companion: true }, then: [{ say: 'ch4.inn.4', who: 'companion' }] }
  ],
  'ch4.svc.ramen': [
    { say: 'ch4.inn.5', who: 'td_innkeeper' },
    {
      choose: [
        { text: 'ch1.bo.opt.ramen', params: { price: { coins: { price: 'ramen' } } }, then: [] },
        {
          text: 'ch1.bo.opt.bed',
          params: { coins: { coins: { price: 'guest_bed' } } },
          then: [{ run: 'ch4.svc.guestbed' }, { stop: true }]
        },
        { text: 'ch1.bo.opt.none', then: [{ say: 'ch4.inn.2', who: 'td_innkeeper' }, { stop: true }] }
      ],
      cancel: 2
    },
    {
      spend: { price: 'ramen' },
      fail: [{ say: 'ch4.inn.6', who: 'td_innkeeper', params: { coins: { coins: { price: 'ramen' } } } }, { stop: true }]
    },
    { heal: { hp: 'full', rest: true } },
    { ext: 'mana', set: 'full' },
    { sound: 'sparkle' },
    { fx: 'smoke', n: 6, dy: -14 },
    { toast: 'ch1.bo.10' },
    { say: 'ch4.inn.7', who: 'td_innkeeper' }
  ]
};
