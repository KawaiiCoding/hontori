/*
 * words.js  (engine: items)
 * Job: the plain English words of the bag and the shop that the content does not carry. A game
 * gives its own through install(game, { words }); any word left out falls back to these.
 *
 * Public API:
 *   WORDS    { key: string }   {name} placeholders are filled by the caller
 */

export const WORDS = {
  bag: 'Backpack',
  purse: 'Purse',
  tabPocket: 'Backpack',
  tabSupply: 'Supplies',
  tabTrade: 'Pouch',
  tabKey: 'Key things',
  notePocket: 'Only some things use a pocket.',
  noteSupply: 'Used up as you go. No pocket needed.',
  noteKey: 'Always with you. They cannot be dropped.',
  emptyPocket: 'Nothing here yet.',
  emptySupply: 'No supplies yet.',
  emptyTrade: 'Empty. Things you find go here.',
  emptyKey: 'Nothing yet.',
  pouchTitle: 'Merchant pouch',
  pouchWorth: 'Worth {coins}.',
  pouchHint: 'Tap a find to read about it.',
  each: '{coins} each',
  inUse: 'In use',
  drop: 'Drop',
  dropSure: 'Drop it?',
  dropHeld: 'Take one out first',
  putBackHeld: 'Take one other thing out first',
  shopTitle: 'Shop',
  shopSellDone: 'Sold',
  shopLeave: 'Done',
  shopBuy: 'Buy',
  shopSell: 'Sell',
  shopShort: 'Not enough coins',
  shopPick: 'Tap a thing to see what it does.',
  shopPouchWorth: 'Everything in it is worth {coins}.',
  party: 'Party',
};
