/*
 * ch1/pickups.js
 * Job: the home things lying around the house after the first morning (src/items.js SPOT); row lets a thing sit on furniture.
 * Bread comes back the next day once eaten.
 */

export default {
  active: 'c1:morning',
  list: [
    { item: 'lantern', map: 'home', x: 3, y: 16 },
    { item: 'cookbook', map: 'home', x: 1, y: 3 },
    { item: 'teddy', map: 'home', x: 28, y: 6, row: 7 },
    { item: 'map', map: 'home', x: 21, y: 2 },
    { item: 'compass', map: 'home', x: 22, y: 2 },
    { item: 'bread', map: 'home', x: 4, y: 5, row: 6, respawn: 'daily' },
    { item: 'slingshot', map: 'home', x: 24, y: 3 },
    { item: 'kite', map: 'home', x: 28, y: 7 },
    { item: 'mirror', map: 'home', x: 8, y: 13 },
    { item: 'backpack', map: 'home', x: 23, y: 9 }
  ]
};
