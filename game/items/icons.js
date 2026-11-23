/*
 * icons.js  (Hontori: items)
 * Job: the clear pixel icons of the things the chapters written as data add (world rule: every item is shown
 * by an icon that looks like the thing itself). Each is painted once, on first use, and kept.
 *
 * Public API:
 *   hasItemIcon(id)          true when this module paints that item
 *   itemIconUrl(id, scale)   a data URL of the 16 by 16 icon at that scale, or null
 *
 * A new icon is one more entry in DRAW: function(p) with p(x, y, color, w, h) filling a rectangle.
 */

const SIZE = 16;
const OUTLINE = '#1e1a24';
const urls = new Map();

const DRAW = {
  /* the Archmage's Token: a small gold disc with a closed grey eye, Orlen Vael's mark */
  token(p) {
    p(5, 1, OUTLINE, 6, 14);
    p(3, 2, OUTLINE, 10, 12);
    p(2, 3, OUTLINE, 12, 10);
    p(1, 5, OUTLINE, 14, 6);
    p(5, 2, '#e8b838', 6, 12);
    p(3, 3, '#e8b838', 10, 10);
    p(2, 5, '#e8b838', 12, 6);
    p(5, 2, '#fff0a0', 4, 1);
    p(3, 3, '#fff0a0', 2, 2);
    p(11, 11, '#b07a1e', 2, 2);
    p(5, 13, '#b07a1e', 6, 1);
    /* the closed eye: a grey lid curving down, with three lashes */
    p(4, 7, '#6a6a78', 1, 1);
    p(5, 8, '#6a6a78', 2, 1);
    p(7, 9, '#6a6a78', 2, 1);
    p(9, 8, '#6a6a78', 2, 1);
    p(11, 7, '#6a6a78', 1, 1);
    p(5, 10, '#8a8a96', 1, 1);
    p(8, 11, '#8a8a96', 1, 1);
    p(10, 10, '#8a8a96', 1, 1);
  },
  /* Cole's kite note: a small red kite with a folded note tied to its tail */
  cole_kite_note(p) {
    const half = [1, 2, 3, 4, 5, 4, 3, 2, 1];
    half.forEach((w, row) => {
      p(6 - w, row, OUTLINE, w * 2 + 1, 1);
    });
    half.forEach((w, row) => {
      if (w > 1) p(7 - w, row, row < 4 ? '#f07a4a' : '#d8442e', w * 2 - 1, 1);
    });
    p(6, 1, '#5a2a18', 1, 7);
    p(3, 4, '#5a2a18', 7, 1);
    p(7, 9, '#ffd060', 1, 1);
    p(8, 10, '#7ac0f0', 1, 1);
    p(8, 10, OUTLINE, 7, 6);
    p(9, 11, '#f4ead0', 5, 4);
    p(10, 12, '#a89a7a', 3, 1);
    p(10, 13, '#a89a7a', 2, 1);
  },
  /* the Gale Ring: a silver band with a pale green-blue gem */
  gale_ring(p) {
    p(4, 6, OUTLINE, 8, 9);
    p(3, 8, OUTLINE, 10, 5);
    p(5, 7, '#d4d8e4', 6, 7);
    p(4, 8, '#d4d8e4', 8, 5);
    p(5, 7, '#f4f6fa', 3, 1);
    p(4, 8, '#f4f6fa', 1, 2);
    p(9, 12, '#8a92a6', 2, 1);
    p(6, 13, '#8a92a6', 4, 1);
    p(6, 9, OUTLINE, 4, 3);
    p(6, 9, '#3a3448', 4, 3);
    /* the gem on top */
    p(6, 1, OUTLINE, 4, 6);
    p(5, 2, OUTLINE, 6, 4);
    p(6, 2, '#8ee0d0', 4, 4);
    p(7, 2, '#d8fff4', 2, 1);
    p(6, 3, '#c0f4e8', 1, 1);
    p(8, 4, '#58b8b0', 2, 2);
  },
};

export function hasItemIcon(id) {
  return typeof DRAW[id] === 'function';
}

export function itemIconUrl(id, scale = 2) {
  if (!hasItemIcon(id)) return null;
  const key = `${id}@${scale}`;
  if (urls.has(key)) return urls.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = SIZE * scale;
  canvas.height = SIZE * scale;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.scale(scale, scale);
  DRAW[id]((x, y, color, w = 1, h = 1) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  });
  const url = canvas.toDataURL();
  urls.set(key, url);
  return url;
}
