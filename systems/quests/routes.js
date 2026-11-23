/*
 * routes.js
 * Job: find the way between maps through their doors, so a goal on another map can be shown as the
 * door that leads toward it. Pure data work: no drawing, no state.
 *
 * Public API:
 *   new Routes(registry)        reads every map description registered under kind "map" (lazily, once)
 *   firstDoor(fromMap, toMap)   the door description { x, y, to, ... } on fromMap that starts the shortest
 *                               walk to toMap, or null when there is no way (or both are the same map)
 *   forget()                    read the maps again next time (after maps were added)
 */

export class Routes {
  #registry;
  #links = null;
  #cache = new Map();

  constructor(registry) {
    this.#registry = registry;
  }

  forget() {
    this.#links = null;
    this.#cache.clear();
  }

  firstDoor(fromMap, toMap) {
    if (!fromMap || !toMap || fromMap === toMap) return null;
    const key = `${fromMap}>${toMap}`;
    if (this.#cache.has(key)) return this.#cache.get(key);
    const door = this.#search(fromMap, toMap);
    this.#cache.set(key, door);
    return door;
  }

  /* breadth first over maps; each map is reached through the first door of the shortest walk */
  #search(fromMap, toMap) {
    const links = this.#allLinks();
    const firstOf = new Map([[fromMap, null]]);
    const queue = [fromMap];
    for (let at = 0; at < queue.length; at++) {
      const map = queue[at];
      for (const door of links.get(map) || []) {
        if (firstOf.has(door.to)) continue;
        const first = firstOf.get(map) || door;
        if (door.to === toMap) return first;
        firstOf.set(door.to, first);
        queue.push(door.to);
      }
    }
    return null;
  }

  #allLinks() {
    if (this.#links) return this.#links;
    this.#links = new Map();
    for (const map of this.#registry.all('map')) {
      const doors = Array.isArray(map.doors) ? map.doors.filter((door) => door && door.to && door.to !== map.id) : [];
      this.#links.set(map.id, doors);
    }
    return this.#links;
  }
}
