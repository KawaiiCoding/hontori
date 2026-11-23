/*
 * dom.js
 * Job: the two small helpers every interface piece uses to build its elements.
 *
 * Public API:
 *   element(tag, className, parent, text)   create an element; parent and text are optional
 *   icon(art, name)                         an <img> showing a pixel icon of the game
 */

export function element(tag, className, parent, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  if (parent) parent.appendChild(node);
  return node;
}

export function icon(art, name) {
  const image = document.createElement('img');
  image.alt = '';
  image.draggable = false;
  image.src = art.iconUrl(name);
  return image;
}
