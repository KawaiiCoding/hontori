/*
 * EventBus.js
 * Job: let modules tell each other that something happened, without knowing each other.
 *
 * Public API:
 *   on(type, handler)    subscribe; returns a function that unsubscribes
 *   off(type, handler)   unsubscribe
 *   emit(type, payload)  call every handler of that type; a handler that throws is reported and skipped
 */

export class EventBus {
  #handlers = new Map();

  on(type, handler) {
    if (!this.#handlers.has(type)) this.#handlers.set(type, new Set());
    this.#handlers.get(type).add(handler);
    return () => this.off(type, handler);
  }

  off(type, handler) {
    const set = this.#handlers.get(type);
    if (set) set.delete(handler);
  }

  emit(type, payload) {
    const set = this.#handlers.get(type);
    if (!set) return;
    for (const handler of [...set]) {
      try {
        handler(payload);
      } catch (error) {
        console.warn(`EventBus: a "${type}" handler failed`, error);
      }
    }
  }
}
