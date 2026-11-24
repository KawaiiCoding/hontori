/*
 * ch6/interactions.js
 * Job: chapter 6 prop handlers: the Stonehollow tavern (ramen and the guest bed), Hobb's counter, the drums of
 * the Drum Circle (the barrels on the maps lane's "drums" spots), the Listening Cave (the rockslide of the Fallen
 * drift, where the Miner's Rope climbs down; the chest in the West drift; the carvings, drawn as wall_map and
 * picture props, read again in turn), and the bench and guest bed in Bedrock Hall (the rest before Harrow).
 */

export default {
  ramen_pot: [{ map: 'stonehollow_tavern', then: [{ run: 'ch6.svc.ramen' }] }],
  tavern_counter: [{ map: 'stonehollow_tavern', then: [{ run: 'ch6.svc.ramen' }] }],
  guest_bed: [{ map: 'stonehollow_tavern', then: [{ run: 'ch6.svc.guestbed' }] }],
  bed: [
    { map: 'stonehollow_tavern', then: [{ run: 'ch6.svc.guestbed' }] },
    { map: 'bedrock_hall', then: [{ run: 'ch6.svc.hallbench' }] }
  ],
  shop_counter: [{ map: 'stonehollow_shop', then: [{ shop: 'stonehollow' }] }],
  barrel: [
    {
      map: 'drum_circle',
      then: [
        { note: [45, 45, 52, 45, 57], count: [2, 3] },
        { cycle: [[{ say: 'ch6.drum.1', who: 'kid' }], [{ say: 'ch6.drum.2', who: 'kid' }], [{ say: 'ch6.drum.3', who: 'kid' }]], mode: 'loop' }
      ]
    }
  ],
  rockslide: [{ map: 'listening_cave', then: [{ run: 'ch6.drift' }] }],
  chest: [{ map: 'listening_cave', then: [{ run: 'ch6.chest' }] }],
  wall_map: [
    {
      map: 'listening_cave',
      then: [
        {
          cycle: [[{ say: 'ch6.carving.1', who: 'kid' }], [{ say: 'ch6.carving.2', who: 'kid' }]],
          by: 'type',
          mode: 'loop'
        }
      ]
    }
  ],
  picture: [{ map: 'listening_cave', then: [{ say: 'ch6.carving.3', who: 'kid' }] }],
  bench: [{ map: 'bedrock_hall', then: [{ run: 'ch6.svc.hallbench' }] }]
};
