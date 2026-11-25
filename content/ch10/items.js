/*
 * ch10/items.js
 * Job: the things of chapter 10 (schema section 1: one id means one thing).
 *   archmage_ring   the last ring (world rule 9), given by or for Orlen Vael once mercy is decided; with the
 *                   eight Wardens' votes it makes the new law. Effect ring: it shows in the ring case.
 *   charter         the Wanders' Charter, the new law; Read shows its first line (the one the player wrote) and
 *                   opens the final lore book (./lore.js, book charter).
 *   fair_*          keepsakes from the Emberbrook fair after the end (effect keepsake, the capsule album's
 *                   slots: `slot` hat is worn by the lead hontori; `slot` keepsake stands in the home at `place`;
 *                   `look` is the picture, as the capsule prizes in shared/capsules.js).
 */

export default {
  archmage_ring: {
    id: 'archmage_ring',
    name: 'ch10.item.archmage_ring.name',
    icon: 'archmage_ring',
    kind: 'key',
    desc: null,
    use: 'ch10.item.archmage_ring.use',
    tag: 'ch10.item.archmage_ring.tag',
    effect: 'ring'
  },
  charter: {
    id: 'charter',
    name: 'ch10.item.charter.name',
    icon: 'charter',
    kind: 'key',
    desc: null,
    use: 'ch10.item.charter.use',
    tag: 'ch10.item.charter.tag',
    effect: 'story',
    actions: [{ label: 'ch3.item.read', desc: 'ch3.item.read.desc', then: [{ run: 'ch10.charter' }] }]
  },
  fair_hat: {
    id: 'fair_hat',
    name: 'ch10.item.fair_hat.name',
    icon: 'fair_hat',
    kind: 'key',
    desc: 'ch10.item.fair_hat.desc',
    use: 'ch10.item.fair_hat.use',
    tag: 'ch10.item.fair.tag',
    effect: 'keepsake',
    slot: 'hat',
    look: 'wander_hat'
  },
  fair_frame: {
    id: 'fair_frame',
    name: 'ch10.item.fair_frame.name',
    icon: 'fair_frame',
    kind: 'key',
    desc: 'ch10.item.fair_frame.desc',
    use: 'ch10.item.fair_home.use',
    tag: 'ch10.item.fair.tag',
    effect: 'keepsake',
    slot: 'keepsake',
    look: 'picture_frame',
    place: { map: 'home', x: 16, y: 1, lift: 0 }
  },
  fair_lantern: {
    id: 'fair_lantern',
    name: 'ch10.item.fair_lantern.name',
    icon: 'fair_lantern',
    kind: 'key',
    desc: 'ch10.item.fair_lantern.desc',
    use: 'ch10.item.fair_home.use',
    tag: 'ch10.item.fair.tag',
    effect: 'keepsake',
    slot: 'keepsake',
    look: 'window_lantern',
    place: { map: 'home', x: 17, y: 1, lift: 0 }
  },
  fair_sweets: {
    id: 'fair_sweets',
    name: 'ch10.item.fair_sweets.name',
    icon: 'fair_sweets',
    kind: 'key',
    desc: 'ch10.item.fair_sweets.desc',
    use: 'ch10.item.fair_home.use',
    tag: 'ch10.item.fair.tag',
    effect: 'keepsake',
    slot: 'keepsake',
    look: 'sweet_jar',
    place: { map: 'home', x: 5, y: 2, lift: 9 }
  }
};
