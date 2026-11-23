/*
 * Party.js  (engine: items)
 * Job: the party data model: the companions who travel with the player, the first one leads.
 * A member is plain saved data; the game layer decides what its fields mean beyond these:
 *   { key, nick, level, stage, hp, maxHp, sta, exp, moves }   (missing hp counts as healthy)
 *
 * Public API:
 *   SAVE                       the save section defaults: { members: [] }
 *   new Party(read, emit, { max })   max: how many may travel at once (default 5)
 *   members(), size(), max, lead()   lead: the first member, or null
 *   add(member)                'party' (joined), or 'full'
 *   removeAt(i)                the member taken out, or null
 *   setLead(i)                 move member i to the front
 *   hurt()                     true when anyone has less than full health
 *   heal(hp, staFull)          hp: 'full' | 'half' | a number; staFull: also refill stamina (sta = null)
 *   changed()                  tell listeners that members changed outside these calls (after a battle)
 *
 * Events it emits: "party:change" {}
 */

export const SAVE = { members: [] };

export class Party {
  #read;
  #emit;

  constructor(read, emit, { max = 5 } = {}) {
    this.#read = read;
    this.#emit = emit;
    this.max = max;
  }

  members() {
    const section = this.#read();
    if (!Array.isArray(section.members)) section.members = [];
    return section.members;
  }

  size() {
    return this.members().length;
  }

  lead() {
    return this.members()[0] || null;
  }

  add(member) {
    const members = this.members();
    if (!member || members.length >= this.max) return 'full';
    members.push(member);
    this.changed();
    return 'party';
  }

  removeAt(i) {
    const members = this.members();
    if (i < 0 || i >= members.length) return null;
    const [member] = members.splice(i, 1);
    this.changed();
    return member;
  }

  setLead(i) {
    const members = this.members();
    if (i <= 0 || i >= members.length) return;
    const [member] = members.splice(i, 1);
    members.unshift(member);
    this.changed();
  }

  hurt() {
    return this.members().some((m) => m.hp != null && m.maxHp != null && m.hp < m.maxHp);
  }

  heal(hp = 'full', staFull = false) {
    for (const m of this.members()) {
      if (m.maxHp != null) {
        const now = m.hp == null ? m.maxHp : m.hp;
        const add = hp === 'full' ? m.maxHp : hp === 'half' ? Math.ceil(m.maxHp / 2) : Math.max(0, Number(hp) || 0);
        m.hp = Math.min(m.maxHp, now + add);
      }
      if (staFull) m.sta = null;
    }
    this.changed();
  }

  changed() {
    this.#emit('party:change', {});
  }
}
