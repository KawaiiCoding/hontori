window.H = window.H || {};
// Ride: the saddle (sold by Nettle for 1 gold once the lead hontori reaches its second evolution) lets the kid ride outdoors.
// This module owns the Ride button and the first-time tips; the engine owns the riding itself (H.game.ride, H.game.riding, H.game.canRide).
// API: H.ride = { toggle(), refresh() }
(function () {
  'use strict';
  var H = window.H, btn = null, lastShow = null, lastOn = null;
  function G() { return H.game || null; }
  function saddleIcon() { try { return H.itemIcons.url('saddle', 2); } catch (e) { return ''; } }
  function make() {
    var root = document.getElementById('root'); if (!root) return null;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'hride'; b.setAttribute('aria-label', 'Ride');
    b.style.cssText = 'position:absolute;right:12px;top:calc(env(safe-area-inset-top,0px) + 176px);z-index:30;width:44px;height:44px;border-radius:14px;background:rgba(18,20,40,.82);border:2px solid rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.35);padding:0';
    var im = document.createElement('img'); im.alt = ''; im.src = saddleIcon(); im.style.cssText = 'width:30px;height:30px;image-rendering:pixelated;pointer-events:none'; b.appendChild(im);
    b.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    b.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    b.hidden = true; root.appendChild(b); return b;
  }
  function toggle() {
    var g = G(); if (!g || !g.ride) return;
    if (!g.canRide()) { if (H.ui && H.ui.toast) H.ui.toast('Riding needs open sky'); return; }
    var on = g.ride(); refresh();
    try { if (on && H.ui && H.ui.helper) H.ui.helper('riding', 'Riding', 'You ride faster than you walk. Tap the saddle again to step down.', 'paw', btn); } catch (e) {}
  }
  // called about once a second: the button only exists while riding is possible
  function refresh() {
    var g = G(); if (!g || !g.canRide) return;
    var show = false, on = false;
    try { show = !!g.canRide() && !(H.menu && H.menu.isOpen && H.menu.isOpen()) && !document.querySelector('.hb'); on = !!g.riding(); } catch (e) {}
    if (show && !btn) btn = make();
    if (!btn) return;
    if (show !== lastShow) { btn.hidden = !show; lastShow = show; if (show) { try { H.ui.helper('saddle', 'Saddle', 'Tap the saddle to ride your hontori. It works under open sky.', 'paw', btn); } catch (e) {} } }
    if (on !== lastOn) { btn.style.borderColor = on ? '#ffd98a' : 'rgba(255,255,255,.22)'; btn.style.boxShadow = on ? '0 0 12px rgba(255,217,138,.6)' : '0 3px 10px rgba(0,0,0,.35)'; lastOn = on; }
  }
  setInterval(refresh, 700);
  window.addEventListener('keydown', function (e) { if ((e.key === 'q' || e.key === 'Q') && !(H.ui && H.ui.isOpen && H.ui.isOpen())) toggle(); });
  H.ride = { toggle: toggle, refresh: refresh };
})();
