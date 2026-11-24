/*
 * screens.js  (Hontori: panels)
 * Job: the panels about the hontori and the wand, as in the current game (src/menu.js): the party
 * (one card per hontori with its bars and Mend, Name, Lead, Moves and Rest), its moves, the Wand
 * Sanctum and one resting hontori (join, swap, release), the spell loadout and the Wand Memory
 * (every kind as bound, met or not met, and one kind's page). A panel moves between its screens in
 * place, and Back returns to where it was opened from (the party or the Menu). The Menu gets the
 * wand's section (level, EXP, mana and perks, and the way into the three wand screens).
 *
 * Public API:
 *   installScreens(game, roster, guide)   after the items lane and Hontori's battle install
 *
 * What it registers:
 *   panel   "party" (the party strip opens it), "sanctum", "spells", "memory" (the Menu opens them)
 *   the Menu ("settings") gets the wand section before its own buttons, once the player has the wand
 *
 * Commands it runs through the story (registered by the features lane):
 *   { ext: 'draw', sigil: 'mend', text }                 Mend draws the circle first, then heals 40%
 *   { ask: 'name', target, title }                       target: a party index, or { resting: index }
 */

import { element, icon } from '../../ui/dom.js';
import { Button } from '../../ui/Button.js';
import { setHead, swapPanel } from '../../ui/PanelExtras.js';
import { badge, detail, face, grid, gridCard, memberCard, orbs, pickRow, pips, statBar } from '../../ui/RosterKit.js';
import { sigilSvg } from '../battle-scene/sigils.js';
import { sealedFace } from '../../ui/SealedFace.js';

const MEMORY_TOTAL = 100;
const MEND_SHARE = 0.4;
const SIGIL_COLOR = '#ffd98a';
const REOPEN_MS = 200;
const REOPEN_WAIT_MS = 8000;

/* where each panel starts, and where its Back leads from the first screen */
const STARTS = { party: 'party', sanctum: 'sanctum', spells: 'spells', memory: 'memory' };
const ORIGINS = { party: null, sanctum: 'wand', spells: 'wand', memory: 'wand' };
const ICONS = { spell: 'book', party: 'paw', moves: 'claw', sanctum: 'crystal', resting: 'crystal', spells: 'book', memory: 'paw', kind: 'paw' };
const GUIDES = {
  party: { title: 'shared.ui.guide.party.title', text: 'shared.ui.guide.party.text', target: '.hp-strip' },
  sanctum: { title: 'shared.ui.guide.sanctum.title', text: 'shared.ui.guide.sanctum.text', target: '.ui-sheet.on' },
  spells: { title: 'shared.ui.guide.spells.title', text: 'shared.ui.guide.spells.text', target: '.ui-sheet.on' },
  moves: { title: 'shared.ui.guide.moves.title', text: 'shared.ui.guide.moves.text', target: '.ui-sheet.on' },
};

export function installScreens(game, roster, guide) {
  const { registry } = game;
  const t = (id, params) => roster.text(id, params);
  const story = () => registry.get('service', 'story') || game.story || null;
  /* each opening of a panel has its own screens (keyed by that opening's close function) */
  const navs = new WeakMap();
  let busy = false;
  /* the screen on show, so a guide card that waited does not appear over another screen */
  let shown = null;

  const hasWand = () => {
    try {
      const s = story();
      return !s || !!s.test({ has: 'wand' });
    } catch (error) {
      return true;
    }
  };

  /* back to the panel once the world is on top again (a short story moment may come first) */
  function reopen(id) {
    const until = performance.now() + REOPEN_WAIT_MS;
    const tryOpen = () => {
      const top = game.scenes.top;
      if (top && top.hud) {
        game.ui.openPanel(id);
        return;
      }
      if (performance.now() < until) setTimeout(tryOpen, REOPEN_MS);
    };
    setTimeout(tryOpen, REOPEN_MS);
  }

  async function runStory(commands) {
    const s = story();
    if (!s) return;
    try {
      await s.run(commands);
    } catch (error) {
      console.warn('panels: a story step failed', error);
    }
  }

  /* draw the circle, then spend one mana and heal about 40% */
  async function mend(m, ctx, id) {
    if (busy) return;
    busy = true;
    ctx.close();
    await runStory([{ ext: 'draw', sigil: 'mend', text: 'shared.ui.party.mend.draw' }]);
    const maxHp = m.maxHp || 1;
    const hp = m.hp == null ? maxHp : m.hp;
    if (roster.members().includes(m) && hp < maxHp && roster.spendMana(1)) {
      m.hp = Math.min(maxHp, hp + Math.max(1, Math.round(maxHp * MEND_SHARE)));
      roster.party.changed();
      roster.commit();
      game.ui.toast(t('shared.ui.party.mend.done', { name: roster.nameOf(m), n: m.hp - hp }));
    }
    busy = false;
    reopen(id);
  }

  async function rename(target, ctx, id) {
    if (busy) return;
    busy = true;
    ctx.close();
    await runStory([{ ask: 'name', target, title: 'shared.ui.party.name.title' }]);
    roster.party && roster.party.changed();
    busy = false;
    reopen(id);
  }

  function backRow(s, desc) {
    const row = s.panel.actions();
    s.panel.button(row, { icon: 'back', label: t('shared.ui.back'), desc, kind: 'alt', onPress: s.back });
  }

  function backWord(s) {
    if (s.nav.stack.length > 1) return s.nav.stack[s.nav.stack.length - 2].screen === 'party' ? t('shared.ui.back.party') : null;
    return s.nav.origin ? t('shared.ui.back.menu') : null;
  }

  function empty(s, text) {
    s.panel.add(element('div', 'ui-empty', null, text));
  }

  /* ---------- the screens ---------- */

  const SCREENS = {
    party(s) {
      const members = roster.members();
      s.head(t('shared.ui.party'), t('shared.ui.party.sub', { n: members.length, max: roster.max }));
      const mana = roster.mana();
      s.panel.add(orbs(null, { label: t('shared.ui.party.mana'), n: mana.n, max: mana.max }));
      if (!members.length) empty(s, t('shared.ui.party.none'));
      members.forEach((m, i) => {
        const maxHp = m.maxHp || 1;
        const well = (m.hp == null ? maxHp : m.hp) >= maxHp;
        const why = well ? t('shared.ui.party.mend.well') : mana.n < 1 ? t('shared.ui.party.mend.empty') : null;
        const actions = [
          { icon: 'mend', label: t('shared.ui.party.mend'), desc: why || t('shared.ui.party.mend.desc'), off: !!why, onPress: () => mend(m, s.ctx, s.id) },
          { icon: 'feather', label: t('shared.ui.party.name'), desc: t('shared.ui.party.name.desc'), onPress: () => rename(i, s.ctx, s.id) },
        ];
        if (i > 0) {
          actions.push({ icon: 'star', label: t('shared.ui.party.toLead'), desc: t('shared.ui.party.toLead.desc'), onPress: () => {
            roster.party.setLead(i);
            roster.commit();
            s.ctx.refresh();
          } });
        }
        actions.push({ icon: 'claw', label: t('shared.ui.party.moves'), desc: t('shared.ui.party.moves.desc'), onPress: () => s.go('moves', m) });
        if (members.length > 1 && !roster.sealed()) {
          actions.push({ icon: 'crystal', label: t('shared.ui.party.rest'), desc: t('shared.ui.party.rest.desc'), onPress: () => {
            if (roster.toSanctum(i)) s.ctx.refresh();
          } });
        }
        s.panel.add(memberCard(null, game.art, {
          face: roster.faceOf(m.key, m.stage), name: roster.nameOf(m), badge: roster.badgeOf(roster.elementOf(m.key)),
          tag: i === 0 ? t('shared.ui.party.lead') : null, lead: i === 0,
          sub: t('shared.ui.party.level', { stage: roster.stageName(m), level: m.level || 1 }), bars: roster.bars(m), actions,
        }));
      });
      const row = s.panel.actions();
      s.panel.button(row, {
        icon: 'crystal', label: t('shared.ui.sanctum.title'),
        desc: roster.sealed() ? t('shared.ui.sanctum.sealed') : t('shared.ui.party.sanctum.desc', { n: roster.resting().length, max: roster.capacity() }),
        onPress: () => s.go('sanctum'),
      });
    },

    moves(s) {
      const m = s.at.arg;
      const moves = roster.movesOf(m);
      s.head(t('shared.ui.moves.title'), t('shared.ui.moves.sub', { name: roster.nameOf(m), n: m.moves.length }));
      if (!moves.length) empty(s, t('shared.ui.moves.none'));
      for (const move of moves) {
        const bits = [];
        if (move.pow) bits.push(t('shared.ui.moves.power', { n: move.pow }));
        if (move.cd) bits.push(t('shared.ui.moves.rests', { n: Math.max(0, move.cd - 1) }));
        if (move.desc) bits.push(move.desc);
        s.panel.add(pickRow(null, {
          left: badge(null, roster.badgeOf(move.element)), title: move.name, sub: bits.join('   '), on: move.on,
          onWord: t('shared.ui.pick.on'), offWord: t('shared.ui.pick.off'),
          onPress: () => {
            const done = roster.toggleMove(m, move.id);
            if (done === 'max') game.ui.toast(t('shared.ui.moves.max'));
            else if (done === 'last') game.ui.toast(t('shared.ui.moves.keepOne'));
            else s.ctx.refresh();
          },
        }));
      }
      backRow(s, backWord(s));
    },

    sanctum(s) {
      const resting = roster.resting();
      /* sealed by the Council: everyone sleeps under grey wax, and nobody can be opened, swapped or released */
      if (roster.sealed()) {
        s.head(t('shared.ui.sanctum.sealed'), t('shared.ui.sanctum.sealed.sub', { n: resting.length }));
        s.panel.note(t('shared.ui.sanctum.sealed.note'));
        const sleeping = s.panel.add(grid(null));
        resting.forEach((m) => {
          gridCard(sleeping, {
            face: sealedFace(roster.faceOf(m.key, m.stage)) || roster.faceOf(m.key, m.stage), corner: `Lv ${m.level || 1}`,
            badge: roster.badgeOf(roster.elementOf(m.key)), name: roster.stageName(m),
            onPress: () => game.ui.toast(t('shared.ui.sanctum.sealed.tap', { name: m.nick || roster.stageName(m) })),
          });
        });
        backRow(s, backWord(s));
        return;
      }
      s.head(t('shared.ui.sanctum.title'), t('shared.ui.sanctum.sub', { n: resting.length, max: roster.capacity() }));
      if (!resting.length) empty(s, t('shared.ui.sanctum.none'));
      const cards = s.panel.add(grid(null));
      resting.forEach((m, j) => {
        gridCard(cards, {
          face: roster.faceOf(m.key, m.stage), corner: `Lv ${m.level || 1}`, badge: roster.badgeOf(roster.elementOf(m.key)),
          name: roster.stageName(m), onPress: () => s.go('resting', { member: m, confirm: false, swap: false }),
        });
      });
      backRow(s, backWord(s));
    },

    resting(s) {
      const pick = s.at.arg;
      const m = pick.member;
      const j = roster.resting().indexOf(m);
      s.head(roster.nameOf(m), t('shared.ui.sanctum.resting'));
      const nameRow = s.panel.actions();
      s.panel.button(nameRow, { icon: 'feather', label: t('shared.ui.party.name'), desc: t('shared.ui.party.name.desc'), kind: 'alt', small: true,
        onPress: () => rename({ resting: j }, s.ctx, s.id) });
      const heading = element('div', 'ui-dnm');
      element('span', '', heading, roster.stageName(m));
      badge(heading, roster.badgeOf(roster.elementOf(m.key)));
      const maxHp = m.maxHp || 1;
      const hp = m.hp == null ? maxHp : m.hp;
      const bars = roster.bars(m);
      s.panel.add(detail(null, {
        face: roster.faceOf(m.key, m.stage),
        lines: [heading, t('shared.ui.sanctum.facts', { level: m.level || 1, stage: m.stage || 1, hp, maxHp }),
          statBar(null, { frac: bars[0].frac }), statBar(null, { frac: bars[2].frac, kind: 'xp' })],
      }));
      const update = (change) => {
        Object.assign(pick, change);
        s.ctx.refresh();
      };
      if (pick.confirm) {
        s.panel.note(t('shared.ui.sanctum.release.ask', { name: roster.nameOf(m) }));
        const row = s.panel.actions();
        s.panel.button(row, { icon: 'feather', label: t('shared.ui.sanctum.release'), desc: t('shared.ui.sanctum.release.sure'), kind: 'warn', onPress: () => {
          const name = roster.nameOf(m);
          if (roster.release(roster.resting().indexOf(m))) game.ui.toast(t('shared.ui.sanctum.release.done', { name }));
          s.back();
        } });
        s.panel.button(row, { icon: 'star', label: t('shared.ui.sanctum.keep'), onPress: () => update({ confirm: false }) });
        return;
      }
      const full = roster.members().length >= roster.max;
      const row = s.panel.actions();
      s.panel.button(row, {
        icon: 'swap', label: t(full ? 'shared.ui.sanctum.swap' : 'shared.ui.sanctum.join'),
        desc: t(full ? 'shared.ui.sanctum.swap.desc' : 'shared.ui.sanctum.join.desc'),
        onPress: () => {
          if (full) {
            update({ swap: !pick.swap });
            return;
          }
          if (roster.fromSanctum(roster.resting().indexOf(m))) game.ui.toast(t('shared.ui.sanctum.joined', { name: roster.nameOf(m) }));
          s.back();
        },
      });
      s.panel.button(row, { icon: 'feather', label: t('shared.ui.sanctum.release'), desc: t('shared.ui.sanctum.release.desc'), kind: 'warn',
        onPress: () => update({ confirm: true }) });
      if (pick.swap) {
        s.panel.note(t('shared.ui.sanctum.who'));
        const picks = s.panel.add(element('div', 'ui-picks'));
        roster.members().forEach((p, i) => {
          const button = new Button(game.art, { label: roster.nameOf(p), desc: `Lv ${p.level || 1}`, kind: 'alt', small: true, onPress: () => {
            if (roster.fromSanctum(roster.resting().indexOf(m), i)) game.ui.toast(t('shared.ui.sanctum.joined', { name: roster.nameOf(m) }));
            s.back();
          } });
          button.element.insertBefore(face(roster.faceOf(p.key, p.stage), 48), button.element.firstChild);
          picks.appendChild(button.element);
        });
      }
      backRow(s, null);
    },

    spells(s) {
      const spells = roster.spells();
      s.head(t('shared.ui.spells.title'), t('shared.ui.spells.sub', { n: spells.filter((x) => x.on).length }));
      if (!spells.length) empty(s, t('shared.ui.spells.none'));
      for (const spell of spells) {
        const sigil = element('span', 'sig');
        sigil.innerHTML = sigilSvg(spell.id, SIGIL_COLOR);
        const sub = element('span');
        element('span', 'mana', sub, t('shared.ui.spells.cost', { n: spell.cost }));
        pips(sub, spell.mastery, 5, t(`shared.ui.mastery.${Math.max(1, Math.min(5, spell.mastery))}`));
        /* a tap opens the spell first: what it does, its cost, then Equip or Unequip */
        s.panel.add(pickRow(null, {
          left: sigil, title: spell.name, sub, on: spell.on, onWord: t('shared.ui.pick.on'), offWord: t('shared.ui.pick.off'),
          onPress: () => s.go('spell', spell.id),
        }));
      }
      s.panel.note(t('shared.ui.spells.note'));
      backRow(s, backWord(s));
    },

    spell(s) {
      const spell = roster.spells().find((x) => x.id === s.at.arg);
      if (!spell) return s.back();
      s.head(spell.name, t('shared.ui.spells.cost', { n: spell.cost }));
      const card = s.panel.add(element('div', 'ui-spell'));
      const sigil = element('div', 'sig big', card);
      sigil.innerHTML = sigilSvg(spell.id, SIGIL_COLOR);
      const words = element('div', 'words', card);
      element('p', 'use', words, t(`shared.ui.spell.use.${spell.id}`));
      element('p', 'how', words, t(`shared.ui.spell.how.${spell.id}`));
      pips(words, spell.mastery, 5, t(`shared.ui.mastery.${Math.max(1, Math.min(5, spell.mastery))}`));
      element('p', 'how', words, t('shared.ui.mastery.explain'));
      const row = s.panel.add(element('div', 'ui-row'));
      s.panel.button(row, {
        icon: 'book', kind: spell.on ? 'alt' : 'gold',
        label: t(spell.on ? 'shared.ui.spell.unequip' : 'shared.ui.spell.equip'),
        desc: t(spell.on ? 'shared.ui.spell.unequip.desc' : 'shared.ui.spell.equip.desc'),
        onPress: () => {
          const done = roster.toggleSpell(spell.id);
          if (done === 'max') game.ui.toast(t('shared.ui.spells.max'));
          else if (done === 'last') game.ui.toast(t('shared.ui.spells.keepOne'));
          else s.ctx.refresh();
        },
      });
      backRow(s, backWord(s));
    },

    memory(s) {
      const kinds = roster.kinds();
      let met = 0;
      let bound = 0;
      const states = kinds.map((kind) => {
        const state = roster.memoryOf(kind.kind);
        if (state === 'bound') bound += 1;
        if (state !== 'unknown') met += 1;
        return state;
      });
      s.head(t('shared.ui.wand.memory'), t('shared.ui.memory.sub', { met, bound, total: MEMORY_TOTAL }));
      const filter = s.nav.filter || 'all';
      const row = s.panel.add(element('div', 'ui-filter'));
      for (const [id, word] of [['all', 'shared.ui.memory.all'], ['bound', 'shared.ui.memory.bound'], ['met', 'shared.ui.memory.metOnly']]) {
        s.panel.button(row, { label: t(word), kind: filter === id ? undefined : 'alt', small: true, onPress: () => {
          s.nav.filter = id;
          s.ctx.refresh();
        } });
      }
      const cards = s.panel.add(grid(null));
      kinds.forEach((kind, i) => {
        const state = states[i];
        if (filter !== 'all' && state !== filter) return;
        const known = state !== 'unknown';
        gridCard(cards, {
          face: known ? roster.faceOf(kind.kind, 1) : null, mark: '?', corner: `#${i + 1}`, dim: !known,
          name: known ? roster.kindName(kind.kind) : t('shared.ui.memory.unknown'),
          tag: known ? t(state === 'bound' ? 'shared.ui.memory.bound' : 'shared.ui.memory.met') : null, tagKind: state === 'met' ? 'soft' : '',
          onPress: () => s.go('kind', kind.kind),
        });
      });
      if (!cards.children.length) empty(s, t(filter === 'bound' ? 'shared.ui.memory.noneBound' : 'shared.ui.memory.none'));
      backRow(s, backWord(s));
    },

    kind(s) {
      const key = s.at.arg;
      const state = roster.memoryOf(key);
      const kind = roster.kindOf(key) || { stages: [] };
      const sub = state === 'bound' ? t('shared.ui.memory.bound') : state === 'met' ? t('shared.ui.memory.met') : null;
      s.head(state === 'unknown' ? t('shared.ui.memory.unknown.title') : roster.kindName(key), sub);
      if (state === 'unknown') {
        s.panel.add(detail(null, { lines: [t('shared.ui.memory.unknown.text')] }));
      } else {
        const first = kind.stages[0];
        const forms = state === 'bound'
          ? t('shared.ui.memory.forms', { forms: kind.stages.map((stage) => t(stage.name)).join(', ') })
          : t('shared.ui.memory.bindToLearn');
        s.panel.add(detail(null, {
          face: roster.faceOf(key, 1),
          lines: [badge(null, roster.badgeOf(kind.element)), first ? t(first.desc) : null, forms],
        }));
      }
      backRow(s, null);
    },
  };

  /* a screen whose hontori has left (released, swapped, or moved) gives way to the one before */
  function valid(at) {
    if (at.screen === 'moves') return roster.members().includes(at.arg) || roster.resting().includes(at.arg);
    if (at.screen === 'resting') return roster.resting().includes(at.arg.member);
    return true;
  }

  function render(id, panel, ctx) {
    /* each panel keeps its own place, even when several are swapped in place in one sheet */
    let byPanel = navs.get(ctx.close);
    if (!byPanel) {
      byPanel = {};
      navs.set(ctx.close, byPanel);
    }
    let nav = byPanel[id];
    if (!nav) {
      nav = { stack: [{ screen: STARTS[id] }], origin: ORIGINS[id], filter: 'all' };
      byPanel[id] = nav;
    }
    while (nav.stack.length > 1 && !valid(nav.stack[nav.stack.length - 1])) nav.stack.pop();
    const at = nav.stack[nav.stack.length - 1];
    const s = {
      id, panel, ctx, nav, at,
      head: (title, sub) => setHead(panel, game.art, { icon: ICONS[at.screen], title, sub }),
      go: (screen, arg) => {
        nav.stack.push({ screen, arg });
        ctx.refresh();
      },
      back: () => {
        if (nav.stack.length > 1) {
          nav.stack.pop();
          ctx.refresh();
        } else if (nav.origin) swapPanel(game, nav.origin);
        else ctx.close();
      },
    };
    SCREENS[at.screen](s);
    shown = at;
    /* the Sanctum's first-touch card speaks of swapping, which the seal forbids: it waits until the seal is gone */
    const card = at.screen === 'sanctum' && roster.sealed() ? null : GUIDES[at.screen];
    if (card) guide.show(`panel:${at.screen}`, { ...card, still: () => shown === at && panel.element.isConnected && nav.stack.includes(at) });
  }

  for (const id of Object.keys(STARTS)) {
    registry.add('panel', id, {
      icon: ICONS[STARTS[id]],
      title: '',
      build(panel, ctx) {
        render(id, panel, ctx);
      },
    });
  }

  /* the wand's section at the top of the Menu */
  /* the wand has its own button beside the backpack; the Menu keeps saving, controls and sound */
  registry.add('panel', 'wand', {
    icon: 'wand',
    title: t('shared.ui.wand.panel'),
    build(panel) {
      const facts = roster.wandFacts();
      const section = element('div', 'ui-wsec');
      const heading = element('h3', '', section);
      heading.appendChild(icon(game.art, 'wand'));
      heading.appendChild(document.createTextNode(t('shared.ui.wand.title', { level: facts.level })));
      statBar(section, { frac: facts.frac, kind: 'xp wd' });
      element('div', 'ui-note', section, t('shared.ui.wand.facts', facts));
      const row = element('div', 'ui-acts', section);
      for (const [target, iconName, label, desc] of [
        ['spells', 'book', 'shared.ui.spells.title', 'shared.ui.party.moves.desc'],
        ['sanctum', 'crystal', 'shared.ui.sanctum.title', 'shared.ui.wand.sanctum.desc'],
        ['memory', 'paw', 'shared.ui.wand.memory', 'shared.ui.wand.memory.desc'],
      ]) {
        row.appendChild(new Button(game.art, { icon: iconName, label: t(label), desc: t(desc), onPress: () => swapPanel(game, target) }).element);
      }
      panel.add(section);
    },
  });
  registry.add('hud.button', 'wand', {
    icon: 'wand', label: t('shared.ui.wand.panel'), order: 15,
    enabled: () => hasWand(),
    refreshOn: ['inventory:change', 'story:flag', 'map:enter'],
    open: () => {
      if (hasWand()) game.ui.openPanel('wand');
      else game.ui.toast(t('shared.ui.wand.none'));
    },
  });
}
