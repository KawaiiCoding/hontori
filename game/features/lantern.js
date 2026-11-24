/*
 * lantern.js  (Hontori: features)
 * Job: how far the kid sees in a dark cave (the world's darkness pass, world/Darkness.js). A dark map names its
 * lantern: `dark: { level, sight, lantern: { item, sight, oil } }`. While that item is carried the circle of
 * light is `lantern.sight` wide; while a thing whose effect is "lanternOil" is carried too (Lantern Oil), it
 * is `lantern.oil` wide (default OIL_SHARE times the lantern's sight). The oil is not used up: it lights the
 * way while it is carried (content/ch6/items.js).
 *
 * Public API:
 *   installLantern(game)   registers "world.sight" "lantern"
 *   OIL_EFFECT, OIL_SHARE
 *   sightWith(dark, has)   the radius for a dark description, given has(effectOrItem) answers (pure, for checks)
 */

export const OIL_EFFECT = 'lanternOil';
export const OIL_SHARE = 1.45;

export function sightWith(dark, has) {
  const lantern = dark && dark.lantern;
  if (!lantern || !lantern.item || !has({ item: lantern.item })) return null;
  const sight = Number(lantern.sight) || 0;
  if (!has({ effect: OIL_EFFECT })) return sight;
  return Number(lantern.oil) > 0 ? Number(lantern.oil) : Math.round(sight * OIL_SHARE);
}

export function installLantern(game) {
  /* asked every step on a dark map: the answer is kept until the bag or the map changes */
  let known = null;
  const forget = () => {
    known = null;
  };
  game.bus.on('inventory:change', forget);
  game.bus.on('map:enter', forget);
  game.registry.add('world.sight', 'lantern', (dark) => {
    if (known && known.dark === dark) return known.sight;
    const items = game.registry.get('service', 'items');
    if (!items) return null;
    const sight = sightWith(dark, (want) => {
      if (want.item) return items.inventory.has(want.item);
      return items.inventory.list().some((entry) => items.book.effect(entry.id) === want.effect);
    });
    known = { dark, sight };
    return sight;
  });
}
