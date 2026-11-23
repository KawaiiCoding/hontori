/*
 * moves.js  (Hontori game layer)
 * Job: the hontori moves as data (old src/moves.js, data and pools only), in the engine's MoveBook.
 *
 * Public API:
 *   MOVES                     element -> [basic, signature, utility] in the old order (foes use [0] and [1])
 *   BOOK                      the MoveBook: every move of an element sorted by learnLevel
 *   byId(id), pool(element), learned(level, element)
 *   movesFor(member, element) the 1 to 4 moves a member brings: its chosen ids it has learnt first, then other
 *                             learnt ones; the element's first three when nothing is learnt
 *   staCost(move)             stamina: no power or power <= 6 -> 1, <= 8 -> 2, more -> 3
 * A move: { id, name, el, pow?, cd?, util?, learnLevel, desc, anim }. cd is the rest set on use; cooldowns count
 * down at the start of every round, so cd 3 is two rounds of rest. util: glow, mist, tail, root, static, harden,
 * veil or bless. anim names the animation a scene plays (the later moves borrow one).
 * Learn levels: basic 1, signature 4, utility 1, then 7, 13, 19.
 */

import { MoveBook } from '../../systems/battle/moves.js';

const BASE = {
  fire: [
    { id: 'ember_nip', name: 'Ember Nip', pow: 5, desc: 'A quick bite wrapped in flame.' },
    { id: 'flare_tail', name: 'Flare Tail', pow: 8, cd: 3, desc: 'A blazing tail arc. Rests 2 turns.' },
    { id: 'warm_glow', name: 'Warm Glow', util: 'glow', cd: 3, desc: 'Attacks +50% for 2 turns.' }
  ],
  water: [
    { id: 'curl_wave', name: 'Curl Wave', pow: 5, desc: 'A curling wave crashes down.' },
    { id: 'torrent_jet', name: 'Torrent Jet', pow: 8, cd: 3, desc: 'A strong jet of water. Rests 2 turns.' },
    { id: 'morning_mist', name: 'Morning Mist', util: 'mist', cd: 3, desc: 'Foe aims worse for 3 turns.' }
  ],
  wind: [
    { id: 'crescent_blade', name: 'Crescent Blade', pow: 5, desc: 'Three blades of wind.' },
    { id: 'spiral_gale', name: 'Spiral Gale', pow: 8, cd: 3, desc: 'A tornado lifts the foe. Rests 2 turns.' },
    { id: 'tailwind', name: 'Tailwind', util: 'tail', cd: 3, desc: 'Move first and land more crits.' }
  ],
  grass: [
    { id: 'leaf_volley', name: 'Leaf Volley', pow: 5, desc: 'A spray of sharp leaves.' },
    { id: 'thorn_lash', name: 'Thorn Lash', pow: 8, cd: 3, desc: 'Thorny vines whip up. Rests 2 turns.' },
    { id: 'deep_root', name: 'Deep Root', util: 'root', cd: 3, desc: 'Heals a little for 3 turns.' }
  ],
  electric: [
    { id: 'arc_crackle', name: 'Arc Crackle', pow: 5, desc: 'Crackling arcs leap across.' },
    { id: 'sky_fork', name: 'Sky Fork', pow: 8, cd: 3, desc: 'Lightning from the sky. Rests 2 turns.' },
    { id: 'static_field', name: 'Static Field', util: 'static', cd: 3, desc: '40% chance to stun the foe.' }
  ],
  earth: [
    { id: 'boulder_toss', name: 'Boulder Toss', pow: 5, desc: 'A heavy stone, thrown high.' },
    { id: 'stone_eruption', name: 'Stone Eruption', pow: 8, cd: 3, desc: 'Rocks burst from the ground. Rests 2 turns.' },
    { id: 'stone_shell', name: 'Stone Shell', util: 'harden', cd: 3, desc: 'Takes half damage for 2 turns.' }
  ],
  dark: [
    { id: 'shadow_claw', name: 'Shadow Claw', pow: 5, desc: 'Claws tear from the dark.' },
    { id: 'night_tendrils', name: 'Night Tendrils', pow: 8, cd: 3, desc: 'Shadows rise and grasp. Rests 2 turns.' },
    { id: 'veil_step', name: 'Veil Step', util: 'veil', cd: 3, desc: 'Slips away from the next hit.' }
  ],
  light: [
    { id: 'halo_burst', name: 'Halo Burst', pow: 5, desc: 'A ring of light bursts.' },
    { id: 'dawn_beam', name: 'Dawn Beam', pow: 8, cd: 3, desc: 'A beam falls from above. Rests 2 turns.' },
    { id: 'bless', name: 'Bless', util: 'bless', cd: 3, desc: 'Heals and clears sleep.' }
  ]
};

/* [id, name, pow, cd, animation borrowed, desc]; learnt at levels 7, 13 and 19 */
const EXTRA = {
  fire: [['cinder_dash', 'Cinder Dash', 6, 0, 'ember_nip', 'A dash of hot sparks.'], ['blaze_crown', 'Blaze Crown', 11, 4, 'flare_tail', 'A crown of fire falls.'], ['spark_rush', 'Spark Rush', 7, 2, 'ember_nip', 'Two fast fiery bites.']],
  water: [['ripple_slap', 'Ripple Slap', 6, 0, 'curl_wave', 'A quick slap of water.'], ['tidal_crash', 'Tidal Crash', 11, 4, 'torrent_jet', 'The whole tide crashes.'], ['bubble_burst', 'Bubble Burst', 7, 2, 'curl_wave', 'Bubbles pop in a row.']],
  wind: [['gust_cut', 'Gust Cut', 6, 0, 'crescent_blade', 'A thin cut of air.'], ['sky_rend', 'Sky Rend', 11, 4, 'spiral_gale', 'The sky splits open.'], ['feather_storm', 'Feather Storm', 7, 2, 'crescent_blade', 'A storm of sharp air.']],
  grass: [['seed_shot', 'Seed Shot', 6, 0, 'leaf_volley', 'Hard seeds, fired fast.'], ['bramble_wall', 'Bramble Crush', 11, 4, 'thorn_lash', 'Brambles close in.'], ['petal_dance', 'Petal Dance', 7, 2, 'leaf_volley', 'A whirl of petals.']],
  electric: [['jolt', 'Jolt', 6, 0, 'arc_crackle', 'A small sharp jolt.'], ['storm_lance', 'Storm Lance', 11, 4, 'sky_fork', 'A spear of lightning.'], ['chain_spark', 'Chain Spark', 7, 2, 'arc_crackle', 'Sparks leap twice.']],
  earth: [['pebble_shot', 'Pebble Shot', 6, 0, 'boulder_toss', 'A rain of pebbles.'], ['quake', 'Quake', 11, 4, 'stone_eruption', 'The ground heaves.'], ['rock_roll', 'Rock Roll', 7, 2, 'boulder_toss', 'A rolling stone.']],
  dark: [['dusk_bite', 'Dusk Bite', 6, 0, 'shadow_claw', 'A bite from the shade.'], ['abyss_grip', 'Abyss Grip', 11, 4, 'night_tendrils', 'The deep dark grips.'], ['shade_flurry', 'Shade Flurry', 7, 2, 'shadow_claw', 'Quick shadow cuts.']],
  light: [['glint', 'Glint', 6, 0, 'halo_burst', 'A sharp flash of light.'], ['sunfall', 'Sunfall', 11, 4, 'dawn_beam', 'Sunlight falls hard.'], ['prism_ray', 'Prism Ray', 7, 2, 'halo_burst', 'Light split in colours.']]
};
const LEARN = [1, 4, 1];
const EXTRA_LV = [7, 13, 19];

export const MOVES = {};
const FAMILIES = {};

for (const el of Object.keys(BASE)) {
  MOVES[el] = Object.freeze(BASE[el].map((m, i) => Object.freeze({ ...m, el, learnLevel: LEARN[i], anim: m.id })));
  const list = MOVES[el].slice();
  EXTRA[el].forEach((e, i) => {
    const m = { id: e[0], name: e[1], pow: e[2], desc: e[5], learnLevel: EXTRA_LV[i], el, anim: e[4] };
    if (e[3]) m.cd = e[3];
    list.push(Object.freeze(m));
  });
  FAMILIES[el] = list;
}
Object.freeze(MOVES);

export const BOOK = new MoveBook(FAMILIES, 'fire');

export const byId = (id) => BOOK.byId(id);
export const pool = (element) => BOOK.pool(element);
export const learned = (level, element) => BOOK.learned(level, element);

export function movesFor(member, element) {
  return BOOK.loadout(member && member.moves, member && member.level, element, 4,
    () => (MOVES[element] || MOVES.fire).slice(0, 3));
}

export function staCost(move) {
  const p = (move && move.pow) || 0;
  return !p ? 1 : p <= 6 ? 1 : p <= 8 ? 2 : 3;
}
