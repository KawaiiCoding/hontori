window.H = window.H || {};
// Home items: they lie around the house after the morning, the kid picks what fits in the bag,
// and each one has a real use out in the world. Each use is taught once, when it first matters.
// API: H.pickups = { at, has, count, cap, iconUrl, actions }
(function () {
  'use strict';
  var H = window.H, T = 16;
  // where each item rests at home: [x, y, sort row]; sort row lets things sit on top of furniture
  var SPOT = {
    lantern: [3, 16], cookbook: [1, 3], teddy: [28, 3, 4], map: [21, 2], compass: [22, 2], bread: [4, 5, 6],
    slingshot: [24, 3], scarf: [2, 12], candle: [16, 3], kite: [28, 7], mirror: [8, 13], backpack: [23, 9]
  };
  var USE = {
    backpack: 'Room for one more thing', lantern: 'Light at night; dark hontori come near', teddy: 'Rest outdoors like in a bed',
    cookbook: 'Cook at a stove to heal your party', compass: 'Points the way to your goal', scarf: 'Strong wind will not slow you',
    slingshot: 'Knock apples from fruit trees', bread: 'Calms a wild hontori in battle', map: 'Shows the area you are in',
    candle: 'Sleep with it for extra mana', kite: 'Fly it on a windy day to see far', mirror: 'Shows hontori hidden in the air'
  };

  function S() { return (H.game && H.game.state) || { items: [] }; }
  function F() { var s = S(); return (s.flags = s.flags || {}); }
  function has(id) { return (S().items || []).some(function (i) { return i.id === id; }); }
  function meta(id) { return (H.items && H.items.list.filter(function (x) { return x.id === id; })[0]) || { id: id, name: id }; }
  function active() { return !!F()['c1:morning']; }
  function count() { return Object.keys(SPOT).filter(function (id) { return has(id) && !(id === 'map' && F()['map:gift']); }).length; }
  function cap() { return 5 + (has('backpack') ? 1 : 0); }
  function cur() { return H.game && H.game.currentMap ? H.game.currentMap() : null; }
  function api() { return H.story && H.story.api ? H.story.api({}) : null; }
  function toast(t) { H.ui && H.ui.toast(t); }
  function sfx(n) { try { H.audio && H.audio.sfx(n); } catch (e) {} }
  function save() { try { H.game && H.game.save(); } catch (e) {} }
  function once(k, t) { if (F()['tip:' + k]) return false; F()['tip:' + k] = true; if (t) toast(t); save(); return true; }
  function night(env) { var h = env ? env.time : 12; return h >= 19.5 || h < 5.5; }
  var urls = {};
  function iconUrl(id) {
    if (urls[id]) return urls[id];
    var c = document.createElement('canvas'); c.width = c.height = 32; var g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.scale(2, 2);
    try { H.items.draw(g, id, 0, 0); } catch (e) {}
    return (urls[id] = c.toDataURL());
  }
  function onFloor(id) { return active() && !has(id); }

  // ---------- picking things up
  function at(mapName, x, y) {
    if (mapName !== 'home' || !active()) return null;
    for (var id in SPOT) if (SPOT[id][0] === x && SPOT[id][1] === y && onFloor(id)) return { o: { id: id }, type: 'pickup:' + id, cx: x * T + 8, cy: y * T + 8 };
    return null;
  }
  function pickup(id, c) {
    var a = api(), m = meta(id), full = count() >= cap();
    if (!a) return Promise.resolve();
    var p = a.choose([{ label: 'Take the ' + m.name, icon: iconUrl(id), desc: full ? 'Bag is full. Put one back first.' : USE[id] }, { label: 'Leave it' }]);
    if (full) { var b = document.querySelector('.hui-ch button'); if (b) b.style.opacity = '.45'; }
    return p.then(function (i) {
      if (i !== 0) return;
      if (full) { toast('Bag is full'); return; }
      H.game.addItem(id, m.name, id); sfx('pickup');
      if (c && c.emit) c.emit('sparkle', c.x, c.y, 8);
      toast('Bag ' + count() + ' / ' + cap());
      if (id === 'backpack') once('backpack', 'Room for one more thing');
      if (id === 'map') once('map', 'The map button shows the area');
      save();
    });
  }
  function putBack(id) {
    if (id === 'backpack' && count() > 5) { toast('Take one out first'); return; }
    var st = S(), it = st.items.filter(function (i) { return i.id === id; })[0]; if (!it) return;
    st.items.splice(st.items.indexOf(it), 1); sfx('confirm'); toast(meta(id).name + ' put back');
    H.menu && H.menu.refresh(); save();
  }

  // ---------- uses
  function cook(c, base) {
    var a = api();
    return a.choose([{ label: 'Cook a meal', icon: iconUrl('cookbook'), desc: 'Heals your party by half' }, { label: 'Look at the stove' }]).then(function (i) {
      if (i !== 0) return base();
      sfx('sizzle'); if (c && c.emit) c.emit('smoke', c.x, c.y - 12, 6);
      (S().party || []).forEach(function (p) { p.hp = Math.min(p.maxHp, p.hp + Math.ceil(p.maxHp / 2)); });
      H.menu && H.menu.refresh(); save(); toast('Party healed');
      return a.say('kid', 'A warm meal from the cookbook.');
    });
  }
  function sling(c, base) {
    var a = api(), st = S(), k = (c.mapName || '') + ':' + (c.object ? c.object.x + ',' + c.object.y : '');
    var used = (st.slingDay = st.slingDay || {});
    if (used[k] === (st.day || 0)) return base();
    return a.choose([{ label: 'Use the slingshot', icon: iconUrl('slingshot'), desc: 'Knock down an apple' }, { label: 'Shake the tree' }]).then(function (i) {
      if (i !== 0) return base();
      used[k] = st.day || 0; sfx('pickup'); if (c.emit) c.emit('dust', c.x, c.y - 14, 6);
      (st.party || []).forEach(function (p) { p.hp = Math.min(p.maxHp, p.hp + 5); });
      H.menu && H.menu.refresh(); save(); toast('Apple: party +5 health');
      return a.say('kid', 'One good shot, one red apple.');
    });
  }
  function rest() {
    var c = cur(); if (!c || c.env.indoor) return;
    H.ui && H.ui.fade(900); setTimeout(function () { c.env.time = (c.env.time + 8) % 24; H.ui && H.ui.hud(c.env, c.map.name || c.name); toast('Eight hours later'); }, 450);
  }
  function kite() {
    var c = cur(); if (!c) return;
    var r = 18; for (var y = c.player.ty - r; y <= c.player.ty + r; y += 3) for (var x = c.player.tx - r; x <= c.player.tx + r; x += 3) {
      if (x < 0 || y < 0 || x >= c.map.w || y >= c.map.h) continue;
      try { H.mapview && H.mapview.reveal(c.name, c.map, x, y); } catch (e) {} }
    sfx('sparkle'); toast('The kite rides high. You see far.'); save();
  }
  function openGround(c) { var t = c.tileAt(c.player.tx, c.player.ty); return /grass|flower|field/.test(t || '') && !c.env.indoor; }
  // backpack panel buttons for an item: [{label, desc, off, run}]
  function actions(it) {
    var c = cur(), out = []; if (!c) return out;
    var id = it.id;
    if (c.name === 'home' && SPOT[id] && !(id === 'map' && F()['map:gift'])) out.push({ label: 'Put back', desc: 'Back to its spot', run: function () { putBack(id); } });
    if (id === 'teddy' && !c.env.indoor) out.push({ label: 'Rest', desc: 'Sleep 8 hours here', run: rest });
    if (id === 'kite' && !c.env.indoor) {
      var why = c.env.weather !== 'wind' ? 'Needs a windy day' : !openGround(c) ? 'Needs open grass' : null;
      out.push({ label: 'Fly', desc: why || 'See a large area', off: !!why, run: kite });
    }
    return out;
  }

  // ---------- hooks into the world
  H.speedMul = function (env) {
    if (env.indoor || env.weather !== 'wind') return 1;
    if (has('scarf')) { once('scarf', 'The scarf keeps the wind off'); return 1; }
    once('wind', 'Strong wind slows you down');
    return 1.18;
  };
  H.onSleep = H.onSleep || [];
  H.onSleep.push(function () {
    var st = S(); st.day = (st.day || 0) + 1;
    if (has('candle')) { st.mana = (st.maxMana || 3) + 1; toast('The candle burned all night: +1 mana'); }
  });
  H.doorGuard = function (door, mapName) {
    if (mapName !== 'home' || door.to !== 'village' || !active() || has('map') || !H.story) return null;
    return H.story.run('c1_mapgift');
  };
  H.worldDraw = H.worldDraw || [];
  H.worldDraw.push(function (ents, lights, ctx, env, mapName, player) {
    if (mapName === 'home' && active()) Object.keys(SPOT).forEach(function (id) {
      if (!onFloor(id)) return;
      var s = SPOT[id], px = s[0] * T, py = s[1] * T, ph = env.t * 2 + s[0] * 0.7 + s[1];
      lights.push({ x: px + 8, y: py + 8, r: 14, color: '#ffe6a0', flicker: true });
      ents.push({ y: (s[2] || s[1]) * T + T + 1, d: function () {
        var bob = Math.round(Math.sin(ph) * 1);
        var gr = ctx.createRadialGradient(px + 8, py + 10, 1, px + 8, py + 10, 9);
        gr.addColorStop(0, 'rgba(255,230,150,' + (0.45 + Math.sin(ph * 1.3) * 0.12) + ')'); gr.addColorStop(1, 'rgba(255,230,150,0)');
        ctx.fillStyle = gr; ctx.fillRect(px - 2, py, 20, 20);
        ctx.save(); ctx.translate(px + 2, py + 2 + bob); ctx.scale(0.75, 0.75); H.items.draw(ctx, id, 0, 0); ctx.restore();
        var tw = (Math.sin(ph * 1.7) + 1) / 2; if (tw > 0.8) { ctx.fillStyle = 'rgba(255,255,230,' + ((tw - 0.8) * 5) + ')'; ctx.fillRect(px + 12, py + 2 + bob, 1, 1); ctx.fillRect(px + 11, py + 3 + bob, 3, 0.6); }
      } });
    });
    // lantern: a soft circle of light around the kid at night outdoors
    if (has('lantern') && !env.indoor && night(env)) {
      lights.push({ x: player.x, y: player.y - 8, r: 70, color: '#ffd890', flicker: true });
      once('lantern', 'The lantern lights the way. Dark hontori come closer.');
    }
  });
  var frame = 0, pill = null;
  H.screenDraw = H.screenDraw || [];
  H.screenDraw.push(function (ctx, VW, VH, env, mapName, camX, camY, player) {
    // compass: an arrow at the edge points to the next goal
    if (has('compass') && H.story && H.story.target) {
      var t = H.story.target();
      if (t && t.map === mapName) {
        var sx = t.x * T + 8 - camX, sy = t.y * T + 8 - camY, m = 14;
        if (sx < m || sy < m || sx > VW - m || sy > VH - m) {
          var cx = player.x - camX, cy = player.y - 8 - camY, ang = Math.atan2(sy - cy, sx - cx);
          var k = Math.min(Math.abs((VW / 2 - m) / (Math.cos(ang) || 1e-6)), Math.abs((VH / 2 - m) / (Math.sin(ang) || 1e-6)));
          var ax = VW / 2 + Math.cos(ang) * k, ay = VH / 2 + Math.sin(ang) * k, pu = 1 + Math.sin(env.t * 4) * 0.12;
          ctx.save(); ctx.translate(Math.round(ax), Math.round(ay)); ctx.rotate(ang); ctx.scale(pu, pu);
          ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(-5, -5); ctx.lineTo(-2, 0); ctx.lineTo(-5, 5); ctx.closePath();
          ctx.fillStyle = '#ffd36b'; ctx.strokeStyle = 'rgba(40,24,6,.85)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fill(); ctx.restore();
          once('compass', 'The compass points the way');
        }
      }
    }
    if (++frame % 20) return;
    // map button only once the kid has the map
    var mb = document.querySelector('.hm-map'); if (mb) mb.hidden = !has('map');
    // bag counter while at home
    if (!pill) { pill = document.createElement('div'); pill.style.cssText = 'position:absolute;right:12px;top:calc(env(safe-area-inset-top,0px) + 172px);z-index:30;padding:5px 12px;border-radius:12px;background:rgba(18,20,40,.82);border:2px solid rgba(255,255,255,.22);color:#f4f1e8;font:900 14px Nunito,system-ui,sans-serif;pointer-events:none'; (document.getElementById('root') || document.body).appendChild(pill); }
    var show = mapName === 'home' && active(); pill.hidden = !show;
    if (show) { var txt = 'Bag ' + count() + ' / ' + cap(); if (pill.textContent !== txt) pill.textContent = txt; }
    // first-need tips out in the world
    if (!env.indoor && H.game.state.intro) {
      if (has('teddy') && night(env)) once('teddy', 'With the teddy you can rest out here (backpack)');
      if (has('kite') && env.weather === 'wind') once('kite', 'A windy day. The kite could fly (backpack).');
      if (has('mirror')) once('mirror', 'The mirror shows hontori hidden in the air');
    }
  });

  // wrap the interaction table once every script has loaded
  function wrap() {
    if (!H.interact || H.interact.__items) return;
    var base = H.interact.run;
    H.interact.run = function (type, c) {
      var go = function () { return base.call(H.interact, type, c); };
      if (/^pickup:/.test(type)) return pickup(type.slice(7), c);
      if (type === 'stove' && has('cookbook')) return cook(c, go);
      if (type === 'fruit_tree' && has('slingshot')) return sling(c, go);
      return go();
    };
    H.interact.__items = true;
    // old saves packed with the grid picker: keep the map they could not choose yet
    if (F()['c1:packed'] && !has('map')) { F()['map:gift'] = true; var m = meta('map'); H.game.addItem('map', m.name, 'map'); }
  }
  if (document.readyState === 'complete') setTimeout(wrap, 0); else addEventListener('load', wrap);

  H.pickups = { at: at, has: has, count: count, cap: cap, iconUrl: iconUrl, actions: actions, uses: USE, spots: SPOT };
})();
