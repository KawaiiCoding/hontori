/*
 * shared/capsules.js
 * Job: the capsule machines (world rules: paid with in-game coins only, one free turn a day, never a prize
 * already owned, a finished series takes no coins, every prize is used and seen). Two series, one machine each.
 *
 *   slots       where a prize goes: one hat (worn by the lead hontori in the world, in battle and while
 *               riding), one saddle blanket colour, one wand ink (the sigil line), and keepsakes (many at
 *               once: props in the kid's room at home)
 *   series      id -> { name, price (copper a turn), prizes: [{ id, slot, name, desc, look, color, rare, place }] }
 *               look: the picture (game/capsules/art.js); color: the blanket or ink colour;
 *               place: a keepsake's spot { map, x, y, lift } (lift: pixels up, to stand on furniture)
 *   machines    [{ id, series, map, x, y, prop, body, trim }]: the prop is added to that map at load;
 *               body and trim are the machine's colours
 *   words       text ids of the album and the reveal
 *   interactions, aliases   what the machine does when used (schema section 8)
 */

export default {
  slots: { hat: {}, blanket: {}, ink: {}, keepsake: { many: true } },
  series: {
    emberbrook: {
      name: 'shared.capsule.series.emberbrook',
      first: 'cap_straw_hat',
      price: 10,
      prizes: [
        { id: 'cap_straw_hat', slot: 'hat', look: 'straw_hat', name: 'shared.capsule.cap_straw_hat', desc: 'shared.capsule.cap_straw_hat.desc' },
        { id: 'cap_ember_beret', slot: 'hat', look: 'beret', color: '#c8402e', name: 'shared.capsule.cap_ember_beret', desc: 'shared.capsule.cap_ember_beret.desc' },
        { id: 'cap_chef_hat', slot: 'hat', look: 'chef_hat', name: 'shared.capsule.cap_chef_hat', desc: 'shared.capsule.cap_chef_hat.desc' },
        { id: 'cap_sunset_blanket', slot: 'blanket', look: 'blanket', color: '#e07a2a', name: 'shared.capsule.cap_sunset_blanket', desc: 'shared.capsule.cap_sunset_blanket.desc' },
        { id: 'cap_ember_ink', slot: 'ink', look: 'ink', color: '#ff9a4a', name: 'shared.capsule.cap_ember_ink', desc: 'shared.capsule.cap_ember_ink.desc' },
        {
          id: 'cap_paper_lantern', slot: 'keepsake', look: 'paper_lantern', place: { map: 'home', x: 27, y: 1, lift: 0 },
          name: 'shared.capsule.cap_paper_lantern', desc: 'shared.capsule.cap_paper_lantern.desc'
        },
        {
          id: 'cap_copper_kettle', slot: 'keepsake', look: 'kettle', place: { map: 'home', x: 21, y: 2, lift: 9 },
          name: 'shared.capsule.cap_copper_kettle', desc: 'shared.capsule.cap_copper_kettle.desc'
        },
        { id: 'cap_festival_crown', slot: 'hat', look: 'crown', rare: true, name: 'shared.capsule.cap_festival_crown', desc: 'shared.capsule.cap_festival_crown.desc' }
      ]
    },
    mossgrove: {
      name: 'shared.capsule.series.mossgrove',
      price: 15,
      prizes: [
        { id: 'cap_acorn_cap', slot: 'hat', look: 'acorn', name: 'shared.capsule.cap_acorn_cap', desc: 'shared.capsule.cap_acorn_cap.desc' },
        { id: 'cap_toadstool_cap', slot: 'hat', look: 'toadstool', name: 'shared.capsule.cap_toadstool_cap', desc: 'shared.capsule.cap_toadstool_cap.desc' },
        { id: 'cap_fern_blanket', slot: 'blanket', look: 'blanket', color: '#4f8a3a', name: 'shared.capsule.cap_fern_blanket', desc: 'shared.capsule.cap_fern_blanket.desc' },
        { id: 'cap_dew_ink', slot: 'ink', look: 'ink', color: '#8ae8d8', name: 'shared.capsule.cap_dew_ink', desc: 'shared.capsule.cap_dew_ink.desc' },
        {
          id: 'cap_mushroom_lamp', slot: 'keepsake', look: 'mushroom_lamp', place: { map: 'home', x: 24, y: 2, lift: 8 },
          name: 'shared.capsule.cap_mushroom_lamp', desc: 'shared.capsule.cap_mushroom_lamp.desc'
        },
        { id: 'cap_flower_crown', slot: 'hat', look: 'flower_crown', rare: true, name: 'shared.capsule.cap_flower_crown', desc: 'shared.capsule.cap_flower_crown.desc' }
      ]
    }
  },
  machines: [
    { id: 'emberbrook', series: 'emberbrook', map: 'tavern', x: 15, y: 2, prop: 'capsule_emberbrook', body: '#c8402e', trim: '#f0c060' },
    { id: 'mossgrove', series: 'mossgrove', map: 'moss_house2', x: 9, y: 2, prop: 'capsule_mossgrove', body: '#3f8a4a', trim: '#e8d890' }
  ],
  words: {
    album: 'shared.capsule.album',
    albumSub: 'shared.capsule.album.sub',
    albumDesc: 'shared.capsule.album.desc',
    albumNote: 'shared.capsule.album.note',
    count: 'shared.capsule.count',
    worn: 'shared.capsule.worn',
    shown: 'shared.capsule.shown',
    wear: 'shared.capsule.wear',
    takeOff: 'shared.capsule.takeoff',
    show: 'shared.capsule.show',
    putAway: 'shared.capsule.putaway',
    rare: 'shared.capsule.rare',
    unknown: 'shared.capsule.unknown',
    slot: {
      hat: 'shared.capsule.slot.hat',
      blanket: 'shared.capsule.slot.blanket',
      ink: 'shared.capsule.slot.ink',
      keepsake: 'shared.capsule.slot.keepsake'
    },
    revealKicker: 'shared.capsule.reveal',
    revealRare: 'shared.capsule.reveal.rare',
    tap: 'shared.capsule.tap'
  },
  aliases: { capsule_emberbrook: 'capsule_machine', capsule_mossgrove: 'capsule_machine' },
  interactions: {
    capsule_machine: [
      {
        then: [
          { sound: 'tick' },
          {
            if: { ext: 'capsule', done: true },
            then: [{ say: 'shared.capsule.machine.done', who: 'sign' }, { stop: true }]
          },
          {
            if: { ext: 'capsule', free: true },
            then: [
              { say: 'shared.capsule.machine.free', who: 'sign' },
              {
                choose: [
                  { text: 'shared.capsule.machine.turnFree', then: [{ ext: 'capsule', turn: 'free' }, { helper: 'capsules', title: 'shared.capsule.helper.title', text: 'shared.capsule.helper.text', target: 'hud:backpack' }] },
                  { text: 'shared.capsule.machine.leave', then: [] }
                ],
                cancel: 1
              }
            ],
            else: [{ say: 'shared.capsule.machine.tomorrow', who: 'sign' }]
          }
        ]
      }
    ]
  }
};
