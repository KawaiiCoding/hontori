/*
 * Side.js  (engine: battle framework)
 * Job: one side of a battle: its members (plain data the game owns), which one is on the field, and who fought.
 *
 * Public API:
 *   new Side(id, members)
 *   id, members          the list (the game's own records; the Side never reads inside them)
 *   active               index of the member on the field
 *   fighter              the Fighter on the field (null until sent)
 *   fought               indices that have been on the field, in order of first appearance
 *   send(index, fighter) put a member on the field
 *   others(test)         indices of the other members for which test(member, index) is true
 */

export class Side {
  constructor(id, members) {
    this.id = id;
    this.members = Array.isArray(members) ? members : [];
    this.active = 0;
    this.fighter = null;
    this.fought = [];
  }

  send(index, fighter) {
    this.active = index;
    this.fighter = fighter;
    if (!this.fought.includes(index)) this.fought.push(index);
  }

  others(test) {
    const out = [];
    this.members.forEach((m, i) => {
      if (i !== this.active && test(m, i)) out.push(i);
    });
    return out;
  }
}
