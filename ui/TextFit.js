/*
 * TextFit.js
 * Job: make sure a piece of text can never break a layout, in any language. The text is
 * shrunk step by step until it fits its box; if it still does not fit at the smallest
 * readable size, it ends in an ellipsis.
 *
 * Public API:
 *   fitText(node, minPx)   node: an element with one line of text and a width set by its layout
 *                          minPx: the smallest font size allowed (default 11)
 * Call it after the text or the box changed. It reads layout, so never call it per frame.
 */

export function fitText(node, minPx = 11) {
  node.style.fontSize = '';
  node.style.whiteSpace = 'nowrap';
  node.style.overflow = 'hidden';
  node.style.textOverflow = 'ellipsis';
  let size = parseFloat(getComputedStyle(node).fontSize);
  while (size > minPx && node.scrollWidth > node.clientWidth) {
    size -= 1;
    node.style.fontSize = `${size}px`;
  }
}
