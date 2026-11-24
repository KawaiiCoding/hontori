/*
 * roster.js  (Hontori: panels)
 * Job: what the Hontori panels need to know and do about the hontori, the wand and the spells,
 * read from the systems that own them: the items service's party, the save sections "kinds"
 * (the Wand Sanctum is kinds.resting), "wand" and "mana", the content's kinds, and the battle
 * rules' growth, moves and spells. The panels only show what it answers.
 *
 * Public API:
 *   new Roster(game, localText)       localText: the panels' own words (used while they are not in content)
 *   text(id, params)                  a visible string (the story's text, else the panels' own, else the content's)
 *   elementWord(element)              the shown name of an element
 *   wandFacts()                       { level, frac, mana, max, power, capture } for the wand section
 *   party, members(), max             the items service's Party and its members
 *   kinds()                           every hontori kind of the content, in order
 *   kindOf(key), elementOf(key)
 *   stageName(member), nameOf(member)          the stage's name; the given name, else "<Element> Hontori"
 *   kindName(key)                     the first stage's name of a kind
 *   badgeOf(element)                  { icon, label, color } for an element badge
 *   faceOf(key, stage)                the creature's face (a canvas) or null
 *   bars(member)                      [{ frac, kind, label, value }] health, stamina and EXP
 *   resting(), capacity()             the Sanctum's members; how many it holds (12, then 6 more per wand level)
 *   toSanctum(i), fromSanctum(j, swapWith), release(j)   -> true when done (a full Sanctum is said in a toast;
 *                                     while it is sealed nothing is done and that is said instead)
 *   sealed()                          the Council has sealed the Sanctum (service "sanctum", game/features/sanctum.js)
 *   memoryOf(key)                     'bound' | 'met' | 'unknown'
 *   mana()                            { n, max } (the mana service, else the save section)
 *   spendMana(n)                      -> true when there was enough
 *   wand()                            the save section "wand", repaired: { level, exp, spells, loadout, ... }
 *   spells()                          [{ id, name, cost, mastery, on }] the battle spells learnt, loadout first marked
 *   toggleSpell(id)                   -> 'on' | 'off' | 'max' | 'last'
 *   movesOf(member)                   [{ id, name, element, pow, cd, desc, on }] the moves it has learnt
 *   toggleMove(member, id)            -> 'on' | 'off' | 'max' | 'last'
 *   commit()                          save now
 */

import { MOVES, learned, movesFor } from '../battle/moves.js';
import { SPELLS, BATTLE_SPELLS, masteryOf, spellCost, normalizeSpellId } from '../battle/spells.js';
import { need, staMax, wandPerks, wandNeed, WAND_MAX } from '../battle/growth.js';
import { BADGE_COLORS } from '../battle-scene/look.js';
import { t as contentText } from '../text.js';

const MAX_PICKS = 4;
const SANCTUM_BASE = 12;
const SANCTUM_PER_LEVEL = 6;

function fill(raw, params) {
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (whole, name) => (params[name] != null ? String(params[name]) : whole));
}

export class Roster {
  #game;
  #local;

  constructor(game, localText) {
    this.#game = game;
    this.#local = localText || {};
  }

  text(id, params) {
    const game = this.#game;
    try {
      if (game.text) {
        const said = game.text(id, params);
        if (said !== id) return said;
      }
    } catch (error) {
      /* fall back to the panels' own words */
    }
    return typeof this.#local[id] === 'string' ? fill(this.#local[id], params) : contentText(id, params);
  }

  get party() {
    const items = this.#game.registry.get('service', 'items');
    return items && items.party ? items.party : null;
  }

  members() {
    const party = this.party;
    return party ? party.members() : [];
  }

  get max() {
    const party = this.party;
    return party ? party.max : 5;
  }

  kinds() {
    const out = [];
    for (const folder of this.#game.registry.all('content')) {
      if (Array.isArray(folder && folder.kinds)) out.push(...folder.kinds);
    }
    return out;
  }

  kindOf(key) {
    return this.kinds().find((kind) => kind.kind === key) || null;
  }

  elementOf(key) {
    const kind = this.kindOf(key);
    return (kind && kind.element) || 'fire';
  }

  stageName(m) {
    const kind = this.kindOf(m.key);
    const stage = kind && kind.stages ? kind.stages[Math.max(0, Math.min(kind.stages.length - 1, (m.stage || 1) - 1))] : null;
    return stage ? this.text(stage.name) : String(m.key);
  }

  kindName(key) {
    const kind = this.kindOf(key);
    return kind && kind.stages && kind.stages[0] ? this.text(kind.stages[0].name) : String(key);
  }

  elementWord(element) {
    return this.text(`shared.ui.element.${element}`);
  }

  nameOf(m) {
    if (m.nick) return String(m.nick);
    return this.text('shared.ui.party.kindName', { element: this.elementWord(this.elementOf(m.key)) });
  }

  badgeOf(element) {
    let icon = '';
    try {
      icon = this.#game.art.iconUrl(element);
    } catch (error) {
      icon = '';
    }
    return { icon, label: this.elementWord(element), color: BADGE_COLORS[element] || '#555' };
  }

  faceOf(key, stage) {
    try {
      return this.#game.art.portrait('creature', key, stage || 1);
    } catch (error) {
      return null;
    }
  }

  bars(m) {
    const level = m.level || 1;
    const maxHp = m.maxHp || 1;
    const hp = m.hp == null ? maxHp : m.hp;
    const sm = staMax(level);
    const sta = m.sta == null ? sm : m.sta;
    const needed = need(level);
    return [
      { frac: hp / maxHp, label: this.text('shared.ui.party.hp'), value: `${hp} / ${maxHp}` },
      { frac: sta / sm, kind: 'st', label: this.text('shared.ui.party.st'), value: `${sta} / ${sm}` },
      { frac: (m.exp || 0) / needed, kind: 'xp', label: this.text('shared.ui.party.exp'), value: `${m.exp || 0} / ${needed}` },
    ];
  }

  /* ---------- the Wand Sanctum ---------- */

  resting() {
    const kinds = this.#game.save.state.kinds;
    if (!kinds) return [];
    if (!Array.isArray(kinds.resting)) kinds.resting = [];
    return kinds.resting;
  }

  capacity() {
    return SANCTUM_BASE + SANCTUM_PER_LEVEL * (this.wand().level - 1);
  }

  sealed() {
    try {
      const sanctum = this.#game.registry.get('service', 'sanctum');
      return !!(sanctum && sanctum.sealed());
    } catch (error) {
      return false;
    }
  }

  #shut() {
    if (!this.sealed()) return false;
    this.#game.ui.toast(this.text('shared.ui.sanctum.sealed.rest'));
    return true;
  }

  #full() {
    if (this.resting().length < this.capacity()) return false;
    this.#game.ui.toast(this.text('shared.ui.sanctum.full'));
    return true;
  }

  toSanctum(i) {
    const party = this.party;
    if (!party || party.size() <= 1 || this.#shut() || this.#full()) return false;
    const member = party.removeAt(i);
    if (!member) return false;
    this.resting().push(member);
    this.commit();
    return true;
  }

  fromSanctum(j, swapWith) {
    const party = this.party;
    const resting = this.resting();
    const member = resting[j];
    if (!party || !member || this.#shut()) return false;
    if (swapWith == null) {
      if (party.size() >= party.max) return false;
      resting.splice(j, 1);
      party.add(member);
    } else {
      const members = party.members();
      const out = members[swapWith];
      if (!out) return false;
      members[swapWith] = member;
      resting[j] = out;
      party.changed();
    }
    this.commit();
    return true;
  }

  release(j) {
    const resting = this.resting();
    if (!resting[j] || this.#shut()) return false;
    resting.splice(j, 1);
    this.commit();
    return true;
  }

  /* ---------- Wand Memory ---------- */

  memoryOf(key) {
    const kinds = this.#game.save.state.kinds || {};
    const own = this.members().some((m) => m.key === key) || this.resting().some((m) => m.key === key)
      || (Array.isArray(kinds.bound) && kinds.bound.includes(key));
    if (own) return 'bound';
    return Array.isArray(kinds.seen) && kinds.seen.includes(key) ? 'met' : 'unknown';
  }

  /* ---------- mana and the wand ---------- */

  mana() {
    const service = this.#game.registry.get('service', 'mana');
    try {
      if (service) return { n: Math.max(0, Math.min(service.max(), service.get())), max: service.max() };
    } catch (error) {
      /* read the save section instead */
    }
    const section = this.#game.save.state.mana || {};
    const max = section.maxMana || 3;
    return { n: section.mana == null ? max : Math.min(max, section.mana), max };
  }

  spendMana(n) {
    const { n: now } = this.mana();
    if (now < n) return false;
    const service = this.#game.registry.get('service', 'mana');
    if (service) service.set(now - n);
    else this.#game.save.state.mana.mana = now - n;
    return true;
  }

  wand() {
    const wand = this.#game.save.state.wand || {};
    wand.level = Math.max(1, Math.min(WAND_MAX, wand.level | 0 || 1));
    if (!Array.isArray(wand.spells) || !wand.spells.length) wand.spells = ['mend'];
    if (!Array.isArray(wand.loadout)) wand.loadout = [];
    if (!wand.spellXp || typeof wand.spellXp !== 'object') wand.spellXp = {};
    if (!wand.spellMastery || typeof wand.spellMastery !== 'object') wand.spellMastery = {};
    return wand;
  }

  wandFacts() {
    const wand = this.wand();
    const perks = wandPerks(wand.level);
    const { n, max } = this.mana();
    return {
      level: wand.level,
      frac: wand.level >= WAND_MAX ? 1 : (wand.exp || 0) / wandNeed(wand.level),
      mana: n, max,
      power: Math.round((perks.power - 1) * 100),
      capture: Math.round(perks.captureBonus * 100),
    };
  }

  #battleSpells() {
    const wand = this.wand();
    const known = [...new Set(wand.spells.map(normalizeSpellId))].filter((id) => BATTLE_SPELLS.includes(id));
    /* the loadout keeps only learnt spells; an empty one starts with the first four, as in battle */
    wand.loadout = [...new Set(wand.loadout.map(normalizeSpellId))].filter((id) => known.includes(id)).slice(0, MAX_PICKS);
    if (!wand.loadout.length) wand.loadout = known.slice(0, MAX_PICKS);
    return known;
  }

  spells() {
    const wand = this.wand();
    const perks = wandPerks(wand.level);
    return this.#battleSpells().map((id) => {
      const mastery = masteryOf(wand.spellXp[id] || 0, wand.spellMastery[id]);
      return { id, name: SPELLS[id].name, cost: spellCost(id, mastery, perks), mastery, on: wand.loadout.includes(id) };
    });
  }

  toggleSpell(id) {
    this.#battleSpells();
    const loadout = this.wand().loadout;
    const at = loadout.indexOf(id);
    if (at >= 0) {
      if (loadout.length <= 1) return 'last';
      loadout.splice(at, 1);
      this.commit();
      return 'off';
    }
    if (loadout.length >= MAX_PICKS) return 'max';
    loadout.push(id);
    this.commit();
    return 'on';
  }

  /* ---------- moves ---------- */

  #chosen(m) {
    const element = this.elementOf(m.key);
    const known = learned(m.level || 1, element);
    let ids = Array.isArray(m.moves) ? m.moves.filter((id, i, all) => all.indexOf(id) === i && known.some((k) => k.id === id)) : [];
    if (!ids.length) ids = movesFor(m, element).map((move) => move.id);
    m.moves = ids.slice(0, MAX_PICKS);
    return { element, known: known.length ? known : (MOVES[element] || MOVES.fire).slice(0, 3) };
  }

  movesOf(m) {
    const { element, known } = this.#chosen(m);
    return known.map((move) => ({ id: move.id, name: move.name, element: move.el || element, pow: move.pow, cd: move.cd, desc: move.desc, on: m.moves.includes(move.id) }));
  }

  toggleMove(m, id) {
    this.#chosen(m);
    const at = m.moves.indexOf(id);
    if (at >= 0) {
      if (m.moves.length <= 1) return 'last';
      m.moves.splice(at, 1);
    } else {
      if (m.moves.length >= MAX_PICKS) return 'max';
      m.moves.push(id);
    }
    this.commit();
    return at >= 0 ? 'off' : 'on';
  }

  commit() {
    try {
      this.#game.save.commit();
    } catch (error) {
      console.warn('panels: saving failed', error);
    }
  }
}
