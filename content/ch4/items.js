/*
 * ch4/items.js
 * Job: the things of chapter 4 (schema section 1: one id means one thing). The ferry ticket pays every crossing
 * after the first; the Night Hook brings big night fish more often; the brass plate from the drowned bell, Orlen
 * Vael's letter and Rook's letter can be read again from the bag. The plate is the proof this chapter keeps.
 */

export default {
  ferry_ticket: {
    id: 'ferry_ticket',
    name: 'ch4.item.ferry_ticket.name',
    icon: 'scroll',
    kind: 'key',
    desc: null,
    use: 'ch4.item.ferry_ticket.use',
    tag: 'ch4.item.ferry_ticket.tag',
    effect: 'story'
  },
  tide_ring: {
    id: 'tide_ring',
    name: 'ch4.item.tide_ring.name',
    icon: 'water',
    kind: 'key',
    desc: null,
    use: 'ch4.item.tide_ring.use',
    tag: 'ch4.item.tide_ring.tag',
    effect: 'ring'
  },
  night_hook: {
    id: 'night_hook',
    name: 'ch4.item.night_hook.name',
    icon: 'water',
    kind: 'supply',
    desc: 'ch4.item.night_hook.desc',
    use: 'ch4.item.night_hook.use',
    tag: 'ch4.item.night_hook.tag',
    effect: 'nightHook'
  },
  bell_order: {
    id: 'bell_order',
    name: 'ch4.item.bell_order.name',
    icon: 'scroll',
    kind: 'key',
    desc: null,
    use: 'ch4.item.bell_order.use',
    tag: 'ch4.item.bell_order.tag',
    effect: 'story',
    actions: [{ label: 'ch3.item.read', desc: 'ch3.item.read.desc', then: [{ run: 'ch4.order' }] }]
  },
  vael_letter: {
    id: 'vael_letter',
    name: 'ch4.item.vael_letter.name',
    icon: 'scroll',
    kind: 'key',
    desc: null,
    use: 'ch4.item.letter.use',
    tag: 'ch3.item.letter.tag',
    effect: 'story',
    actions: [{ label: 'ch3.item.read', desc: 'ch3.item.read.desc', then: [{ run: 'ch4.vaelletter' }] }]
  },
  rook_letter: {
    id: 'rook_letter',
    name: 'ch4.item.rook_letter.name',
    icon: 'scroll',
    kind: 'key',
    desc: null,
    use: 'ch4.item.letter.use',
    tag: 'ch3.item.letter.tag',
    effect: 'story',
    actions: [{ label: 'ch3.item.read', desc: 'ch3.item.read.desc', then: [{ run: 'ch4.rookletter' }] }]
  }
};
