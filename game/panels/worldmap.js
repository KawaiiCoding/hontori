/*
 * worldmap.js  (Hontori: panels)
 * Job: the World tab of the map panel, as in the current game (src/mapview.js): two segment tabs,
 * "This area" and "World", over the area map; the World tab shows the regions of the content's
 * `world` data on the engine's WorldMapView. A region is known once one of its maps was visited
 * (flag `visited:<map>`) or the player is in it; a named region next to a known one by a road is
 * heard of and shows why it is closed; the ring of a region shows once it is earned.
 *
 * Public API:
 *   installWorldTab(game, roster, guide)   after the time lane registered panel "areamap";
 *                                          -> false when there is no area map to extend
 */

import { extendPanel, segments, setHead } from '../../ui/PanelExtras.js';
import { WorldMapView } from '../../ui/WorldMap.js';
import { mapStyle } from '../time/mapStyle.js';

const PALETTE = {
  grass: mapStyle.tile.grass, tallgrass: mapStyle.tile.tallgrass, flowers: mapStyle.tile.flowers,
  water: mapStyle.tile.water, waterLight: '#6aa8e0', sand: mapStyle.tile.sand, path: mapStyle.tile.path,
  treeDark: mapStyle.treeDark, treeLight: mapStyle.treeLight, snow: '#f0f0f4', rock: '#8a8478', rockDark: '#6a6458',
  fog: mapStyle.background, markEdge: '#2a1d10', markKnown: '#ffd98a', markHeard: '#8a7a5a', ring: '#ffcf3a',
  you: mapStyle.you, youGlow: mapStyle.youGlow,
  labelBack: mapStyle.labelBack, labelEdge: mapStyle.labelEdge, labelText: mapStyle.labelText,
};

function worldData(game) {
  for (const folder of game.registry.all('content')) if (folder && folder.world && Array.isArray(folder.world.regions)) return folder.world;
  return null;
}

export function installWorldTab(game, roster, guide) {
  /* which tab each opening of the map shows (keyed by that opening's close function) */
  const tabs = new WeakMap();
  const story = () => game.registry.get('service', 'story') || game.story || null;
  const flag = (name) => {
    try {
      return !!story().flag(name);
    } catch (error) {
      return false;
    }
  };
  const ringEarned = (element) => {
    try {
      return !!story().test({ ext: 'ring', has: element });
    } catch (error) {
      return false;
    }
  };

  function view(here) {
    const data = worldData(game);
    const regions = data.regions;
    const current = regions.find((r) => Array.isArray(r.maps) && r.maps.includes(here));
    const known = new Set(regions.filter((r) => r === current || (r.maps || []).some((m) => flag(`visited:${m}`))).map((r) => r.id));
    const heard = new Set(regions.filter((r) => !known.has(r.id) && r.name
      && data.roads.some(([a, b]) => (a === r.id && known.has(b)) || (b === r.id && known.has(a)))).map((r) => r.id));
    const places = regions.map((r) => {
      const isKnown = known.has(r.id);
      const isHeard = heard.has(r.id);
      let name = null;
      if (r.name && (isKnown || isHeard)) {
        const place = roster.text(r.name);
        name = isHeard && r.why ? roster.text('shared.ui.map.closed', { place, why: roster.text(r.why) }) : place;
      }
      let icon = '';
      try {
        icon = r.element ? game.art.iconUrl(r.element) : '';
      } catch (error) {
        icon = '';
      }
      return { id: r.id, x: r.x, y: r.y, name, known: isKnown, heard: isHeard, icon, ring: !!r.ring && isKnown && ringEarned(r.ring) };
    });
    return {
      places, roads: data.roads, here: current ? current.id : null, sea: data.sea || null,
      mountains: data.mountains || [], palette: PALETTE, label: roster.text('shared.ui.map.world'),
    };
  }

  return extendPanel(game.registry, 'areamap', {
    before(panel, ctx) {
      if (!worldData(game)) return;
      const tab = tabs.get(ctx.close) || 'area';
      panel.add(segments({
        tabs: [{ id: 'area', label: roster.text('shared.ui.map.tab.area') }, { id: 'world', label: roster.text('shared.ui.map.tab.world') }],
        current: tab,
        onPick: (id) => {
          if (id === tab) return;
          tabs.set(ctx.close, id);
          ctx.refresh();
        },
      }));
    },
    after(panel, ctx, made) {
      const own = game.registry.get('panel', 'areamap');
      if (!worldData(game) || tabs.get(ctx.close) !== 'world') {
        /* back from the World tab: the area's own header again */
        if (tabs.has(ctx.close)) setHead(panel, game.art, { icon: own.icon, title: own.title, sub: own.sub });
        return;
      }
      for (const node of made) node.hidden = true;
      setHead(panel, game.art, { icon: own.icon, title: roster.text('shared.ui.map.world') });
      const scene = game.scenes.base;
      const here = scene && scene.map ? scene.map.id : null;
      new WorldMapView(view(here)).mount(panel.add(document.createElement('div')));
      guide.show('world', { title: 'shared.ui.guide.world.title', text: 'shared.ui.guide.world.text', target: '.ui-wmap' });
    },
  });
}
