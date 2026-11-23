window.H = window.H || {};
// Money and the trade pouch.
// Coins are counted in copper: 10 copper = 1 silver, 10 silver = 1 gold.
// Things found outside (herbs, pebbles, feathers...) go into the trade pouch and can be sold at Nettle's shop.
// Battles: rivals pay a small purse when you win; losing to a wild hontori makes you drop a few coins.
// API: H.money = { get, add, spend, can, fmt, TRADE, value, forage }
(function () {
  'use strict';
  var H = window.H;
  function S() { return (H.game && H.game.state) || {}; }
  function save() { try { H.game && H.game.save(); } catch (e) {} }
  function toast(t) { try { H.ui && H.ui.toast(t); } catch (e) {} }
  function sfx(n) { try { H.audio && H.audio.sfx(n); } catch (e) {} }

  function get() { var s = S(); return Math.max(0, s.coins | 0); }
  function fmt(c) {
    c = Math.max(0, c | 0); var g = Math.floor(c / 100), s = Math.floor((c % 100) / 10), k = c % 10, out = [];
    if (g) out.push(g + ' gold'); if (s) out.push(s + ' silver'); if (k || !out.length) out.push(k + ' copper');
    return out.join(' ');
  }
  function add(c, why) {
    var s = S(); s.coins = get() + Math.max(0, c | 0); save();
    if (why !== false) { toast('+' + fmt(c) + (why ? '  ' + why : '')); sfx('pickup'); }
    once('coins', 'Coins', '10 copper make 1 silver, and 10 silver make 1 gold. Spend them at the shop and the tavern.');
    return s.coins;
  }
  function can(c) { return get() >= c; }
  function spend(c) { if (!can(c)) return false; S().coins = get() - c; save(); return true; }
  function lose(c, why) { var s = S(), n = Math.min(get(), Math.max(0, c | 0)); s.coins = get() - n; save(); if (n) toast('-' + fmt(n) + (why ? '  ' + why : '')); return n; }
  function once(id, t, x) { try { H.ui && H.ui.helper && H.ui.helper(id, t, x, 'coin'); } catch (e) {} }

  // ---------- trade goods: [name, icon, sell value in copper, one line]
  var TRADE = {
    shiny_pebble: ['Shiny Pebble', 'crystal', 4, 'A smooth stone that catches the light.'],
    feather: ['Soft Feather', 'feather', 2, 'Light as a breath.'],
    glowcap: ['Glowcap', 'light', 6, 'A mushroom that glows a little at night.'],
    river_reed: ['River Reed', 'water', 2, 'Hollow and green. Good for whistles.'],
    acorn: ['Acorn', 'earth', 1, 'A plump acorn with a little hat.'],
    wild_herb: ['Wild Herb', 'grass', 2, 'Smells fresh. Nettle buys these.']
  };
  // shop prices (copper); goods sold back give a little too
  var PRICE = { herb: 3, ember_dust: 15, tide_pearl: 15, spirit_snack: 8, charm: 20, ramen: 5, guest_bed: 10, blue_backpack: 100, saddle: 100 };
  function value(id) { return TRADE[id] ? TRADE[id][2] : PRICE[id] ? Math.max(1, Math.floor(PRICE[id] / 3)) : 0; }
  function pouch() { return (S().items || []).filter(function (i) { return TRADE[i.id]; }); }
  function pouchValue() { return pouch().reduce(function (t, i) { return t + value(i.id) * (i.n || 1); }, 0); }
  function sellPouch() {
    var s = S(), v = pouchValue(); if (!v) return 0;
    s.items = (s.items || []).filter(function (i) { return !TRADE[i.id]; });
    add(v, 'sold'); H.menu && H.menu.refresh && H.menu.refresh(); return v;
  }

  // ---------- foraging: plants, rocks and logs sometimes hide something, once a day each
  var FIND = {
    bush: ['wild_herb', 'herb'], butterfly_bush: ['wild_herb', 'feather'], flower_patch: ['wild_herb', 'herb'], flowerbed: ['wild_herb'],
    garden_bed: ['wild_herb'], mushroom_ring: ['glowcap'], reeds: ['river_reed', 'feather'], rock: ['shiny_pebble'],
    log_pile: ['acorn', 'feather'], tree: ['acorn', 'feather'], pine: ['acorn'], fruit_tree: ['acorn']
  };
  var LINES = {
    wild_herb: ['A wild herb, hiding under the leaves.', 'Herbs grow where the light is soft.'],
    herb: ['A healing herb. That one is for the wand.', 'Green and strong, it helps along.'],
    feather: ['A soft feather, dropped by someone small.', 'A feather light, from a bird in flight.'],
    glowcap: ['A glowcap. It shines a little in my hand.', 'A tiny light from the forest night.'],
    river_reed: ['A long river reed.', 'Hollow and green, the best I have seen.'],
    shiny_pebble: ['A shiny pebble. Nettle likes these.', 'A pebble bright, it holds the light.'],
    acorn: ['An acorn with a little hat.', 'A tiny seed for a mighty tree.']
  };
  function forage(type, c) {
    var list = FIND[type]; if (!list) return null;
    var s = S(), day = s.day || 0, k = (c.mapName || '') + ':' + type + ':' + (c.object ? c.object.x + ',' + c.object.y : '');
    s.forage = s.forage || {};
    if (s.forage[k] === day) return null;
    s.forage[k] = day;
    // about one in three spots hides something each day
    var h = 0; for (var i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) | 0;
    var luck = (S().items || []).some(function (i) { return i.id === 'charm'; }) ? 20 : 0;   // the Backpack Charm finds more
    if (((h ^ (day * 2654435761)) >>> 0) % 100 > 34 + luck) return null;
    var id = list[((h >>> 3) + day) % list.length], T = TRADE[id];
    if (H.game && H.game.addItem) H.game.addItem(id, T ? T[0] : 'Herb', T ? T[1] : 'herb');
    sfx('pickup'); if (c.emit) c.emit('sparkle', c.x || 0, (c.y || 0) - 6, 8); save();
    once('pouch', 'Trade pouch', 'Things you find go into the trade pouch in your bag. Nettle at the shop buys them.');
    var L = LINES[id] || ['Found something.'], say = H.ui && H.ui.say;
    var kid = say ? Promise.resolve(H.ui.say('You', L[0], null, '#7cc8ff')) : Promise.resolve();
    return kid.then(function () { toast('Found: ' + (T ? T[0] : 'Herb')); if (Math.random() < 0.5 && c.hasSpirit && say) return H.ui.say(H.spiritName || 'Fire Hontori', L[1], null, '#ffb04a'); });
  }
  function hook() {
    if (!H.interact || H.interact.__forage) return; H.interact.__forage = true;
    var run0 = H.interact.run;
    H.interact.run = function (t, c) {
      var self = this, args = arguments, f = FIND[t] && S().intro ? forage(t, c || {}) : null;
      return f ? f : run0.apply(self, args);
    };
  }
  if (document.readyState === 'complete') setTimeout(hook, 0); else addEventListener('load', function () { setTimeout(hook, 0); });

  // ---------- battle purses
  function afterBattle(r, info) {
    r = r || {}; info = info || {};
    var lvl = info.foeLevel || 1;
    // a trainer pays the purse once; rematches are for practice
    var fl = (H.game && H.game.state && (H.game.state.flags = H.game.state.flags || {})) || {}, pk = 'purse:' + (info.trainerName || 'duel');
    if (r.won && info.trainer && !fl[pk]) { fl[pk] = true; add(5 + 2 * lvl, 'purse for a good duel'); }
    else if (!r.won && !r.fled && !r.captured && !info.trainer) lose(Math.min(20, Math.max(1, Math.round(get() * 0.1))), 'dropped while running home');
  }

  // first coins: old saves start with a little pocket money
  function migrate() { var s = S(); if (s.coins == null && s.flags && s.flags['c1:morning']) s.coins = 25; }
  setTimeout(migrate, 500);

  H.money = { get: get, add: add, spend: spend, lose: lose, can: can, fmt: fmt, TRADE: TRADE, PRICE: PRICE, value: value, pouch: pouch, pouchValue: pouchValue, sellPouch: sellPouch, forage: forage, afterBattle: afterBattle };
})();
