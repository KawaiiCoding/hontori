/*
 * ch3/items.js
 * Job: the key things of chapter 3 (schema section 1: one id means one thing). The letters and Cole's note can be
 * read again from the bag. The Token looks like a kind gift; it is the one mystery this chapter plants.
 */

export default {
  token: {
    id: 'token',
    name: 'ch3.item.token.name',
    icon: 'coin',
    kind: 'key',
    desc: 'ch3.item.token.desc',
    use: 'ch3.item.token.use',
    tag: 'ch3.item.token.tag',
    effect: 'story'
  },
  gale_ring: {
    id: 'gale_ring',
    name: 'ch3.item.gale_ring.name',
    icon: 'wind',
    kind: 'key',
    desc: null,
    use: 'ch3.item.gale_ring.use',
    tag: 'ch3.item.gale_ring.tag',
    effect: 'ring'
  },
  letter_home_1: {
    id: 'letter_home_1',
    name: 'ch3.item.letter_home_1.name',
    icon: 'scroll',
    kind: 'key',
    desc: null,
    use: 'ch3.item.letter.use',
    tag: 'ch3.item.letter.tag',
    effect: 'story',
    actions: [{ label: 'ch3.item.read', desc: 'ch3.item.read.desc', then: [{ run: 'ch3.letter1' }] }]
  },
  letter_home_2: {
    id: 'letter_home_2',
    name: 'ch3.item.letter_home_2.name',
    icon: 'scroll',
    kind: 'key',
    desc: null,
    use: 'ch3.item.letter.use',
    tag: 'ch3.item.letter.tag',
    effect: 'story',
    actions: [{ label: 'ch3.item.read', desc: 'ch3.item.read.desc', then: [{ run: 'ch3.letter2' }] }]
  },
  cole_kite_note: {
    id: 'cole_kite_note',
    name: 'ch3.item.cole_kite_note.name',
    icon: 'kite',
    kind: 'key',
    desc: null,
    use: 'ch3.item.cole_kite_note.use',
    tag: 'ch3.item.cole_kite_note.tag',
    effect: 'story',
    actions: [{ label: 'ch3.item.read', desc: 'ch3.item.read.desc', then: [{ run: 'ch3.colenote' }] }]
  }
};
