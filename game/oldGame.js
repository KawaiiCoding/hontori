/*
 * oldGame.js  (Hontori)
 * Job: tidy up, once, what the first version of the game left on the device. Its saves and settings
 * cannot be read by this game, so they are removed; the unlock key stays, because a journey bought
 * there is still bought here (game/features/unlock.js reads it). Its stored files and any service
 * worker it registered under another file name are removed too.
 *
 * Public API:
 *   clearOldGame({ storage, id, caches, workers, pageUrl })   returns true when it ran, false when it
 *        had already run or storage is missing. Every argument but storage and id is optional:
 *        caches   the page's CacheStorage (default: window.caches)
 *        workers  navigator.serviceWorker (default: the page's)
 *        pageUrl  the address of the page (default: location.href)
 *
 * The page shares its origin with other sites (a project page on a shared host), so only what
 * belongs to this game is touched: storage keys that start with 'hontori.', caches named
 * 'hontori...' that are not this game's ('<id>-...'), and service workers of this page's folder.
 * Nothing here throws: storage or a browser feature that is missing or refuses is skipped.
 */

const OLD_PREFIX = 'hontori.';
const OLD_CACHE = /^hontori/;
/* the old unlock key: still read by game/features/unlock.js */
const KEEP = ['hontori.full'];

function clearKeys(storage) {
  const gone = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (typeof key === 'string' && key.startsWith(OLD_PREFIX) && !KEEP.includes(key)) gone.push(key);
  }
  gone.forEach((key) => storage.removeItem(key));
}

function clearCaches(caches, id) {
  if (!caches || typeof caches.keys !== 'function') return;
  const own = `${id}-`;
  caches.keys().then((names) => {
    names.forEach((name) => { if (OLD_CACHE.test(name) && !name.startsWith(own)) caches.delete(name); });
  }).catch(() => {});
}

/* A worker of this folder under another file name is the old game's: it goes. One under this game's
   own file name (sw.js) is replaced by the browser itself; it is only asked to look for the new file. */
function clearWorkers(workers, pageUrl) {
  if (!workers || typeof workers.getRegistrations !== 'function') return;
  const folder = new URL('./', pageUrl).href;
  const script = new URL('sw.js', pageUrl).href;
  workers.getRegistrations().then((list) => {
    list.forEach((reg) => {
      if (!reg || typeof reg.scope !== 'string' || !reg.scope.startsWith(folder)) return;
      const worker = reg.active || reg.waiting || reg.installing;
      if (worker && worker.scriptURL === script && reg.scope === folder) { if (typeof reg.update === 'function') reg.update().catch(() => {}); return; }
      reg.unregister().catch(() => {});
    });
  }).catch(() => {});
}

export function clearOldGame({ storage, id, caches, workers, pageUrl } = {}) {
  const mark = `${id}.oldGameCleared`;
  try {
    if (!storage || !id || storage.getItem(mark) === '1') return false;
    clearKeys(storage);
    storage.setItem(mark, '1');
  } catch (e) {
    return false;
  }
  try {
    const page = pageUrl || globalThis.location.href;
    clearCaches(caches || globalThis.caches, id);
    clearWorkers(workers || (globalThis.navigator && globalThis.navigator.serviceWorker), page);
  } catch (e) {
    /* a browser without these features: nothing to tidy */
  }
  return true;
}
