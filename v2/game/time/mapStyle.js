/*
 * mapStyle.js  (Hontori)
 * Job: how Hontori's area map looks: the colours of its tiles, roofs, trees, doors, people and
 * labels, the legend words, and what a door's label says. The values are the current game's
 * (src/mapview.js). The engine's ui/AreaMap.js reads this object.
 *
 * Public API:
 *   mapStyle   the style object described in ui/AreaMap.js
 */

import { t, words } from '../text.js';

const TILE = {
  grass: '#5f9a4c', tallgrass: '#477f3e', flowers: '#6aa656', path: '#efc77e', cobble: '#e2bf86', sand: '#ead29a',
  water: '#3f86c8', bridge: '#d8a860', floor_wood: '#a8784a', floor_herring: '#b08050', floor_tile: '#c8d0c0',
  floor_stone: '#9a968e', carpet_blue: '#3a4a8a', rug: '#a03a3a', wall: '#6a4a3a', void: '#1a1410',
};

const ROOF = { school: '#6a4aa8', house_player: '#c0503a', tavern: '#8a5a30', shop: '#3a7a4a' };

export const mapStyle = {
  background: '#141020',
  fog: [20, 16, 32],
  tile: TILE,
  otherTile: TILE.grass,
  /* tall grass shows two blades, water a glint */
  tileDetail(g, id, px, py) {
    if (id === 'tallgrass') {
      g.fillStyle = '#3a6c34';
      g.fillRect(px + 2, py + 3, 1, 3);
      g.fillRect(px + 5, py + 2, 1, 3);
    } else if (id === 'water') {
      g.fillStyle = 'rgba(255,255,255,.18)';
      g.fillRect(px + 1, py + 3, 3, 1);
    }
  },
  roads: ['path', 'cobble', 'sand', 'bridge'],
  roadEdge: 'rgba(120,80,30,.45)',
  tree: (type) => /tree|pine/.test(type),
  treeDark: '#2f5f2c',
  treeLight: '#3f7a38',
  roof: ROOF,
  otherRoof: '#3a5aa8',
  wall: '#d8c4a0',
  doorFrame: '#5a3418',
  doorLight: '#ffd98a',
  person: '#ffffff',
  personEdge: '#2a1d10',
  you: '#ff3c28',
  youGlow: 'rgba(255,60,40,.3)',
  marker: '#ffcf3a',
  markerEdge: '#4a3010',
  labelBack: 'rgba(250,240,214,.92)',
  labelEdge: 'rgba(74,52,32,.7)',
  labelText: '#3a2814',
  legend: [
    ['#efc77e', t('shared.ui.map.road')], ['#3f86c8', t('shared.ui.map.water')],
    ['#ffd98a', t('shared.ui.map.door')], ['#ffffff', t('shared.ui.map.person')],
  ],
  words: words({ you: 'shared.ui.map.you', marker: 'shared.ui.map.quest', closer: 'shared.ui.map.closer', whole: 'shared.ui.map.whole' }),
  /* a door into a room names the room; a door to open land names the road */
  doorLabel(door, target) {
    if (!target) return null;
    return target.tileset === 'indoor' ? target.name : t('shared.ui.map.roadTo', { place: target.name });
  },
};
