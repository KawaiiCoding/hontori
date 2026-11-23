/*
 * game/story/index.js
 * Job: Hontori's part of the story system: its content folders, and who is speaking when a line
 * belongs to the fire hontori (the lead companion): the creature's face and, once it has one, its
 * given name.
 *
 * Public API:
 *   install(game)          after systems/story install(game), before game.start()
 *
 * What it registers:
 *   content         shared, prologue, ch1, ch2 (content.js)
 *   story.speaker   "lead": a voice whose look is 'lead' shows the lead hontori's portrait; a voice
 *                   named after the lead (voices.js `named: 'lead'`) shows the lead's name
 *
 * Values it reads when another system has registered them (the party):
 *   story.value "leadKind"    the lead hontori's kind (default: the companion of the config)
 *   story.value "companion"   the lead's given name or kind name, as in {companion}
 */

import { registerContent } from './content.js';

const LEAD = 'lead';

function registeredValue(story, key, ctx) {
  const handler = story.game.registry.get('story.value', key);
  if (!handler) return null;
  try {
    return handler({ [key]: true }, ctx, story);
  } catch (error) {
    return null;
  }
}

export function install(game) {
  registerContent(game);
  game.registry.add('story.speaker', LEAD, (speaker, ctx, story) => {
    const voice = speaker.voice;
    if (speaker.look === LEAD) {
      const kind = registeredValue(story, 'leadKind', ctx) || (game.config.companion && game.config.companion.key);
      let portrait = null;
      try {
        portrait = kind ? game.art.portrait('creature', kind) : null;
      } catch (error) {
        portrait = null;
      }
      speaker.portrait = portrait;
      speaker.look = 'hontori';
    }
    if (voice && voice.named === LEAD) {
      const name = registeredValue(story, 'companion', ctx);
      if (name) speaker.name = String(name);
    }
    return speaker;
  });
}
