/*
 * shared/helpers.js
 * Job: the once-only first-touch cards (world rule 48) for carried things and controls, with the moment each appears.
 */

export default [
  {
    id: 'item:backpack',
    title: 'shared.item.backpack.name',
    text: 'shared.use.helper.backpack',
    icon: 'backpack',
    when: 'pickup:backpack'
  },
  {
    id: 'item:map',
    title: 'shared.item.map.name',
    text: 'shared.use.helper.map',
    icon: 'map',
    when: 'pickup:map'
  },
  {
    id: 'item:lantern',
    title: 'shared.item.lantern.name',
    text: 'shared.use.helper.lantern',
    icon: 'lantern',
    when: { all: [{ has: 'lantern' }, { indoor: false }, { hour: [19.5, 5.5] }] }
  },
  {
    id: 'item:compass',
    title: 'shared.item.compass.name',
    text: 'shared.use.helper.compass',
    icon: 'compass',
    when: 'compass:offscreen'
  },
  {
    id: 'item:teddy',
    title: 'shared.item.teddy.name',
    text: 'shared.use.helper.teddy',
    icon: 'teddy',
    when: { all: [{ has: 'teddy' }, { indoor: false }, { hour: [19.5, 5.5] }] }
  },
  {
    id: 'item:kite',
    title: 'shared.use.helper.kite.title',
    text: 'shared.use.helper.kite',
    icon: 'wind',
    when: { all: [{ has: 'kite' }, { indoor: false }, { weather: 'wind' }] }
  },
  {
    id: 'item:mirror',
    title: 'shared.item.mirror.name',
    text: 'shared.use.helper.mirror',
    icon: 'mirror',
    when: { all: [{ has: 'mirror' }, { indoor: false }] }
  },
  {
    id: 'saddle',
    title: 'shared.use.helper.saddle.title',
    text: 'shared.use.helper.saddle',
    icon: 'paw',
    when: 'ride:possible'
  },
  {
    id: 'riding',
    title: 'shared.use.helper.riding.title',
    text: 'shared.use.helper.riding',
    icon: 'paw',
    when: 'ride:on'
  },
  {
    id: 'quest',
    title: 'shared.use.helper.quest.title',
    text: 'shared.use.helper.quest',
    icon: 'scroll',
    when: 'ui:questPill'
  },
  {
    id: 'questlog',
    title: 'shared.use.helper.log.title',
    text: 'shared.use.helper.log',
    icon: 'scroll',
    when: 'ui:questLog'
  }
];
