/*
 * SealedFace.js
 * Job: a face picture shown as sealed away: the face in pale greys with its eyes' worth of colour gone, a
 * layer of grey wax poured over it (drips from the top edge, a rim along the bottom) and a small "z z" of
 * sleep. Made once per face and kept while the face itself is kept.
 *
 * Public API:
 *   sealedFace(face)   face: a canvas (or image); -> a new canvas of the same size, or null when there is none
 */

const cache = new WeakMap();
const WAX = '#9a98a2';
const WAX_LIGHT = '#c4c2ca';
const WAX_DARK = '#6e6c78';

export function sealedFace(face) {
  if (!face || !face.width || !face.height) return null;
  if (cache.has(face)) return cache.get(face);
  const w = face.width;
  const h = face.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  try {
    g.filter = 'grayscale(1) brightness(0.9) contrast(0.8)';
    g.drawImage(face, 0, 0);
    g.filter = 'none';
  } catch (error) {
    return null;
  }
  const u = Math.max(1, Math.round(w / 32));
  g.globalAlpha = 0.45;
  g.fillStyle = WAX;
  g.fillRect(0, 0, w, h);
  g.globalAlpha = 0.85;
  /* drips from the top edge */
  for (let i = 0; i < 6; i++) {
    const x = Math.round(((i * 0.17 + 0.04) % 1) * w);
    const len = Math.round(h * (0.12 + ((i * 37) % 5) * 0.04));
    g.fillStyle = i % 2 ? WAX_LIGHT : WAX;
    g.fillRect(x, 0, 3 * u, len);
    g.fillRect(x - u, len - u, 5 * u, 2 * u);
  }
  g.fillStyle = WAX;
  g.fillRect(0, 0, w, 2 * u);
  /* the rim along the bottom */
  g.fillStyle = WAX_DARK;
  g.fillRect(0, h - 4 * u, w, 4 * u);
  g.fillStyle = WAX_LIGHT;
  g.fillRect(0, h - 4 * u, w, u);
  /* asleep */
  g.globalAlpha = 1;
  g.fillStyle = '#ffffff';
  const zx = w - 12 * u;
  const zy = 5 * u;
  for (const [dx, dy, s] of [[0, 3, 4], [5, 0, 3]]) {
    const x = zx + dx * u;
    const y = zy + dy * u;
    g.fillRect(x, y, s * u, u);
    g.fillRect(x + (s - 2) * u, y + u, u, u);
    g.fillRect(x + u, y + 2 * u, u, u);
    g.fillRect(x, y + 3 * u, s * u, u);
  }
  cache.set(face, canvas);
  return canvas;
}
