/*
 * places.js
 * Job: the data that says which maps have their own music. One row per group of maps; to give a new place its own
 * tune, add a row here and its songs to songs.js. No code changes.
 *
 * A row:
 *   maps   map ids that share the music
 *   day    the tune while it is day (the song key); leave out to keep the current game's tune for the place
 *   night  the tune at night; leave out to use the day tune at night too
 *   duel   the tune of a duel fought on these maps; leave out to keep the common duel tune
 *   wild   the tune of a wild encounter on these maps; leave out to keep the common one
 *   phase  the tune once a trainer's hontori flares up into its second phase; leave out to keep the duel tune
 *
 * Public API:
 *   PLACES          the rows
 *   NIGHT           { from, to } the hours the night tunes play (the same hours the synthesizer's own night uses)
 *   isNight(hour)   true from NIGHT.from to NIGHT.to
 */

export const NIGHT = { from: 19, to: 6 };

export function isNight(hour) {
  const h = Number(hour);
  return Number.isFinite(h) && (h >= NIGHT.from || h < NIGHT.to);
}

export const PLACES = [
  {
    maps: ['kitewick', 'windrest', 'kite_house', 'whistling_pass', 'kitewick_tavern', 'kitewick_shop', 'kitewick_h1', 'kitewick_h2', 'kitewick_h3', 'kitewick_h4'],
    day: 'kitewick',
    night: 'kitewick_night'
  },
  {
    maps: ['gale_loft', 'gale_bridges'],
    day: 'kitewick',
    duel: 'gale_duel'
  },
  /* chapter 4: the harbour, its houses and the boats; the coast road leaves from here */
  {
    maps: ['ferry', 'tidewell', 'tidewell_tavern', 'tidewell_shop', 'tidewell_h1', 'tidewell_h2', 'tidewell_h3', 'tidewell_h4', 'lullaby_boat', 'saltmarsh', 'coast_road'],
    day: 'tidewell',
    night: 'tidewell_night'
  },
  /* the drowned stair is quiet in daylight too */
  {
    maps: ['sunken_stair'],
    day: 'tidewell_night'
  },
  {
    maps: ['deepbell_hall'],
    day: 'tidewell_night',
    duel: 'deepbell_duel'
  },
  /* chapter 5: the city never sleeps, so its tune is the same at night */
  {
    maps: ['coilhaven', 'coilhaven_tavern', 'coilhaven_shop', 'coilhaven_h1', 'coilhaven_h2', 'coilhaven_h3', 'coilhaven_h4', 'tinker_shed', 'sparkmoor'],
    day: 'coilhaven'
  },
  {
    maps: ['storm_works'],
    day: 'coilhaven',
    duel: 'storm_duel'
  },
  /* chapter 6: the cliff town, the road up to it, the quarry and the Drum Circle */
  {
    maps: ['mountain_road', 'stonehollow', 'stonehollow_tavern', 'stonehollow_shop', 'stonehollow_h1', 'stonehollow_h2', 'stonehollow_h3', 'stonehollow_h4', 'drum_circle', 'old_quarry'],
    day: 'stonehollow',
    night: 'stonehollow_night'
  },
  /* the cave listens and the hall is quiet: the night tune plays in daylight too */
  {
    maps: ['listening_cave'],
    day: 'stonehollow_night'
  },
  {
    maps: ['bedrock_hall'],
    day: 'stonehollow_night',
    duel: 'bedrock_duel'
  },
  /* chapter 7: the volcano town, the ash road to it and the Smoke House */
  {
    maps: ['ash_road', 'cinderreach', 'cinderreach_tavern', 'cinderreach_shop', 'cinderreach_h1', 'cinderreach_h2', 'cinderreach_h3', 'cinderreach_h4', 'smoke_house'],
    day: 'cinderreach',
    night: 'cinderreach_night'
  },
  /* the lava cave and the empty nest: one very quiet tune, day and night */
  {
    maps: ['hearth_below'],
    day: 'hearth_below'
  },
  {
    maps: ['ember_crucible'],
    day: 'cinderreach_night',
    duel: 'crucible_duel',
    /* the second phase of Brasa's lead (game/battle/phases.js) */
    phase: 'crucible_duel_2'
  },
  /* chapter 8: the town where it is always evening; the clock is held at dusk inside it, so the day tune is its dusk */
  {
    maps: ['duskmere', 'duskmere_tavern', 'duskmere_shop', 'duskmere_h1', 'duskmere_h2', 'duskmere_h3', 'duskmere_h4', 'lantern_room'],
    day: 'duskmere',
    night: 'duskmere_night'
  },
  /* the dark wood is quiet whatever the hour, and so is the crater school */
  {
    maps: ['mothwood'],
    day: 'duskmere_night'
  },
  {
    maps: ['hollow_moon'],
    day: 'duskmere_night',
    duel: 'hollow_moon_duel'
  },
  /* chapter 9: the golden city, its gate, the small school and the mirror gardens */
  {
    maps: ['golden_gate', 'goldmere', 'goldmere_tavern', 'goldmere_shop', 'goldmere_h1', 'goldmere_h2', 'goldmere_h3', 'goldmere_h4', 'glasshouse', 'mirror_gardens'],
    day: 'goldmere',
    night: 'goldmere_night'
  },
  /* the court is calm between fights; the tournament rounds ask for their own tune (see PlaceMusic.battle) */
  {
    maps: ['halo_court'],
    day: 'goldmere_night',
    duel: 'halo_duel'
  },
  /* the garden of jars: one lullaby, day and night */
  {
    maps: ['vael_garden'],
    day: 'vael_garden'
  }
];
