/*
 * QuestLog.js
 * Job: the quest log panel. Open quests first, then finished ones. Without spoilers: finished steps fold
 * into a count, only the next step is shown, later steps stay hidden. With more than one open quest, a
 * tap on a quest makes it the followed one (the pill, the compass and the map point to it).
 *
 * Public API:
 *   registerQuestLog(game, quests, { icon, words, moment(name) })
 *        registers the panel "quests" (open it with game.ui.openPanel('quests')); moment('ui:questLog')
 *        is called the first time it opens
 */

import { element, icon } from './dom.js';

function play(game, name) {
  try {
    game.sound.play(name);
  } catch (error) {
    /* no sound */
  }
}

export function registerQuestLog(game, quests, { icon: iconName = 'scroll', words = {}, moment } = {}) {
  let told = false;
  game.registry.add('panel', 'quests', {
    icon: iconName,
    title: words.log || 'Quest Log',
    build(panel, { refresh }) {
      if (!told) {
        told = true;
        play(game, 'page');
        try {
          if (moment) moment('ui:questLog');
        } catch (error) {
          /* nobody listens */
        }
      }
      const open = [];
      const finished = [];
      for (const def of quests.all()) {
        const status = quests.status(def.id);
        if (status === 'active') open.push(def);
        else if (status === 'done') finished.push(def);
      }
      const current = quests.current();
      const canPick = open.length > 1;

      if (open.length) {
        panel.add(element('div', 'ui-qsec', null, words.active || 'Active'));
        for (const def of open) {
          const card = questCard(game, quests, def, { current: def.id === current, button: canPick, words });
          if (canPick) card.addEventListener('click', () => {
            quests.follow(def.id);
            play(game, 'confirm');
            refresh();
          });
          panel.add(card);
        }
        if (canPick) panel.note(words.follow || 'Tap a quest to follow it.');
      } else {
        panel.add(element('div', 'ui-qnone', null, words.none || 'No open quests right now.'));
      }
      if (finished.length) {
        panel.add(element('div', 'ui-qsec', null, words.done || 'Done'));
        for (const def of finished) panel.add(questCard(game, quests, def, { done: true, words }));
      }
    },
  });
}

function questCard(game, quests, def, { current = false, done = false, button = false, words }) {
  const card = element(button ? 'button' : 'div', `ui-quest${current ? ' cur' : ''}${done ? ' done' : ''}`);
  if (button) {
    card.type = 'button';
    card.setAttribute('aria-pressed', current ? 'true' : 'false');
  }
  const head = element('h3', '', card);
  head.appendChild(icon(game.art, def.icon || 'scroll'));
  element('span', '', head, quests.title(def.id));
  if (done) return card;
  const desc = quests.desc(def.id);
  if (desc) element('p', '', card, desc);
  const count = quests.doneCount(def.id);
  if (count) element('div', 'count', card, count === 1 ? (words.stepDone || '1 step done') : (words.stepsDone || '{n} steps done').replace('{n}', count));
  const next = quests.stepText(def.id);
  if (next) {
    const line = element('div', 'next', card);
    element('i', '', line);
    element('span', '', line, next);
  }
  return card;
}
