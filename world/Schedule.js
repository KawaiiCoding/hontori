/*
 * Schedule.js
 * Job: a person's day: which slot of their schedule holds at a given hour.
 *
 * Public API:
 *   new Schedule(slots)   slots: [{ from, to, x?, y?, dir?, away?, ...anything a system wants to read }]
 *                         hours are 0..24; a slot may run over midnight (from 18, to 7)
 *   slotAt(hour)          the slot that holds at that hour, or null
 */

export class Schedule {
  #slots;

  constructor(slots) {
    this.#slots = slots;
  }

  slotAt(hour) {
    for (const slot of this.#slots) {
      const holds = slot.from <= slot.to
        ? hour >= slot.from && hour < slot.to
        : hour >= slot.from || hour < slot.to;
      if (holds) return slot;
    }
    return null;
  }
}
