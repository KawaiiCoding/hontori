/*
 * words.js  (Hontori: features)
 * Job: the text lookup the feature pieces use: the story system's text (every content folder, this lane's
 * words included), else the id itself.
 *
 * Public API:
 *   word(game, id, params)   the string of that text id with its placeholders filled
 */

export function word(game, id, params) {
  const story = game.registry.get('service', 'story');
  try {
    return story ? story.text(id, params) : String(id);
  } catch (error) {
    return String(id);
  }
}
