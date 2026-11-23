window.H = window.H || {};
/*
  H.loader: loads scripts a little before they are needed, never at the last moment.

  The page loads in three steps:
    1. title   the few scripts the title screen needs. Plain script tags (or one bundle in a release).
    2. world   everything the first playable frame needs, up to the engine. Plain script tags in
               development; one bundle in a release, fetched while the title is already on screen.
    3. late    modules nothing needs before the player has started (the area map, the naming panel,
               the picture story...). Fetched in the background, in order, one per idle moment, right
               after the first frame. The title only lets the player through once they are all present,
               so no module can ever arrive after its first use.

  API
    H.loader.start(plan)   called once by index.html.
                             plan.world  optional list of script URLs (when left out, the world scripts
                                         are the page's own script tags and count as loaded already)
                             plan.late   list of script URLs, loaded in this order
                             plan.names  optional { url: [module names inside that file] } (bundles)
    H.loader.ready(name)   -> Promise, resolved when that module, file or step ('world', 'late') has been
                              handled. It never rejects. A name that is not in the plan is one of the
                              page's own script tags and resolves with the world step.
    H.loader.whenAll()     -> Promise, resolved when every step has been handled.
    H.loader.loaded(name)  -> true when that module, file or step is present and ran without a load error.
    H.loader.hurry()       stop waiting for idle moments and load what is left right away.

  Nothing here throws. A script that fails to load is tried once more, then reported in the console;
  the game carries on without it (every call into another module is guarded).
*/
(function () {
  'use strict';
  var H = window.H;
  var slots = {}, hurried = false, pending = null, started = false;

  function slot(name) {
    var s = slots[name];
    if (!s) {
      s = slots[name] = { done: false, ok: false, promise: null, resolve: null };
      s.promise = new Promise(function (r) { s.resolve = r; });
    }
    return s;
  }
  function mark(name, ok) {
    var s = slot(name);
    if (s.done) return;
    s.done = true; s.ok = !!ok; s.resolve(s.ok);
  }
  function moduleName(url) { return String(url).replace(/^.*\//, '').replace(/\.js(\?.*)?$/, ''); }

  /* one script tag; resolves true when it ran, false when it could not be fetched */
  function inject(url) {
    return new Promise(function (resolve) {
      try {
        var tag = document.createElement('script');
        tag.async = false;
        tag.onload = function () { resolve(true); };
        tag.onerror = function () { try { tag.remove(); } catch (e) {} resolve(false); };
        tag.src = url;
        (document.head || document.documentElement).appendChild(tag);
      } catch (e) { resolve(false); }
    });
  }
  function load(url) {
    return inject(url).then(function (ok) {
      if (ok) return true;
      return new Promise(function (r) { setTimeout(r, 400); }).then(function () { return inject(url); }).then(function (ok2) {
        if (!ok2) { try { console.error('H.loader: could not load ' + url); } catch (e) {} }
        return ok2;
      });
    });
  }

  /* run fn in the next idle moment (at once when hurried) */
  function idle(fn) {
    if (hurried) { fn(); return; }
    pending = fn;
    function fire() { if (pending !== fn) return; pending = null; fn(); }
    try {
      if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(fire, { timeout: 500 });
      else setTimeout(fire, 50);
    } catch (e) { setTimeout(fire, 50); }
  }
  function hurry() {
    hurried = true;
    if (pending) { var fn = pending; pending = null; try { fn(); } catch (e) {} }
  }

  /* load a list in order; waitIdle: one idle moment before each file */
  function chain(step, urls, names, waitIdle) {
    var i = 0, allOk = true;
    return new Promise(function (resolve) {
      function next() {
        if (i >= urls.length) { mark(step, allOk); resolve(); return; }
        var url = urls[i++];
        var go = function () {
          load(url).then(function (ok) {
            if (!ok) allOk = false;
            mark(moduleName(url), ok);
            (names[url] || []).forEach(function (n) { mark(n, ok); });
            next();
          });
        };
        if (waitIdle) idle(go); else go();
      }
      next();
    });
  }

  function afterFirstFrame(fn) {
    if (hurried) { fn(); return; }
    var called = false;
    function once() { if (called) return; called = true; fn(); }
    try { requestAnimationFrame(function () { requestAnimationFrame(once); }); } catch (e) {}
    /* a hidden page gets no frames: do not wait for one for ever */
    setTimeout(once, 400);
  }

  function start(plan) {
    if (started) return;
    started = true;
    plan = plan || {};
    var world = plan.world || [], late = plan.late || [], names = plan.names || {};
    /* debug pages have no title to hold the player back, so nothing waits for an idle moment there */
    if (H.noTitle) hurried = true;
    chain('world', world, names, false).then(function () {
      afterFirstFrame(function () { chain('late', late, names, true).then(function () { mark('*', true); }); });
    });
  }

  function known(name) { return Object.prototype.hasOwnProperty.call(slots, name); }

  H.loader = {
    start: start,
    hurry: hurry,
    ready: function (name) { return slot(known(name) ? name : 'world').promise.then(function () {}); },
    whenAll: function () { return slot('*').promise.then(function () {}); },
    loaded: function (name) { var s = slots[known(name) ? name : 'world']; return !!(s && s.done && s.ok); }
  };

  /* every name of the plan is known before its file is asked for */
  var start0 = start;
  H.loader.start = function (plan) {
    try {
      var p = plan || {}, nm = p.names || {};
      ['world', 'late', '*'].forEach(slot);
      (p.world || []).concat(p.late || []).forEach(function (u) { slot(moduleName(u)); (nm[u] || []).forEach(slot); });
      start0(p);
    } catch (e) { try { console.error('H.loader', e); } catch (_) {} mark('world', false); mark('late', false); mark('*', false); }
  };

  /* a page that never hands over a plan has nothing to wait for */
  function noPlan() { if (!started) H.loader.start({}); }
  if (document.readyState === 'complete') setTimeout(noPlan, 0); else window.addEventListener('load', function () { setTimeout(noPlan, 0); });
})();
