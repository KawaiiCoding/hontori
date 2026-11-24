/*
 * storyArt.js  (Hontori: features)
 * Job: the painter of Hontori's picture stories. A panel of content/prologue/story.js names a set (a
 * backdrop of parallax layers, painted once and kept), a light, a camera move, actors and extras; this file
 * draws them with the game's own tiles, props, buildings, people and hontori, so the story looks like the game.
 * Everything that moves has a cause in the picture (world rule 76; engineering rule 27).
 *
 * Public API:
 *   storyPainter(art)   { paint(g, scene, env, k, [w, h, scale]), forget() } for registry "picture.painter" "main"
 *
 * Places are in world pixels: x 0 is the middle of the picture, y 0 the ground line, y grows downward.
 * Times are shares of the panel's action time (k): 0 at its start, 1 when the action is over; the panel
 * stays longer than that (env.hold action times), so a time may be above 1.
 *
 * Scene parts:
 *   set      'orchard' | 'festival' | 'nightTown' | 'window'      the backdrop
 *   zoom     1 | 2                                                how close the camera stands
 *   horizon  [tall, wide]                                         where the ground line sits, as a share of the height
 *   light    'gold' | 'dusk' | 'night' | 'grey'                   the mood of the light
 *   haze     true                                                 the sun's warm haze (sets with a sun)
 *   cam      { from: [x], to: [x], at: [k0, k1] }                 a slow pan; without `at` it lasts the whole panel
 *   veil     'all' | { x, y, at: [k0, k1], lift }                 the grey veil: everywhere, spreading from a
 *                                                                 point, or (lift) colour returning from a point
 *   actors   { person: look, x, y, dir, seed, scale, clear }      clear: neither light nor veil touches them;
 *                                                                 scale 1 is the size of a person in the game, and a
 *                                                                 hontori is always drawn companion-sized beside it
 *            { spirit: kind, x, y, dir, scale, sit, glow, light, unseen, fades }
 *              glow: a spirit that shines by itself; light: the radius of the light it casts;
 *              unseen: how faint it is under the veil (0..1); fades: it turns faint when the veil reaches it
 *            both: wide: true (only shown when the picture is wide enough to hold them whole),
 *            walk: { to: x, at: [k0, k1] }, hop: [k0, k1, count, height], turn: [[k, dir], ...];
 *            a spirit's sit may be a time: sit: [k]
 *   extras   { part: 'apple', from: [x, y], to: [x, y], arc, at: [k0, k1] }
 *            { part: 'lanterns', from: [x, y], to: [x, y], n, sag, lit, lighter: { spirit, at: [k0, k1] } }
 *            { part: 'seal', x, y, drop: [k0, k1], open: [k0, k1], gone: [k0, k1] }
 *            { part: 'sigil', from: [x, y], points: [[x, y], ...], rise: [k0, k1], at: [k0, k1] }
 *            { part: 'stars' } | { part: 'moon', x } | { part: 'smoke' } | { part: 'kidAtWindow', look, turn }
 */

/* screen pixels a layer reaches past each side of the picture: the room the camera has to travel */
const PAD = 48;
const KEEP_SETS = 4;
const TILE = 16;
const FAINT_EDGE = 28;
/* the house painter's bounds reach up to its own smoke; the chimney's mouth is this far below that */
const CHIMNEY_DROP = 24;
/* a hontori beside a person is drawn as small as the game draws a companion */
const SPIRIT_SCALE = 0.75;
/* the room an actor marked `wide` needs between itself and the edge of the picture to be shown */
const WIDE_ROOM = 22;
const BG = '#06060e';

const LIGHTS = {
  gold: { color: '#ffdf9e', alpha: 0.5 },
  dusk: { color: '#ffc79a', alpha: 0.34 },
  night: { color: '#3a4690', alpha: 0.8 },
  grey: null,
};

const DAY = { t: 0.4, time: 12, weather: 'clear', wind: 0.2, indoor: false };
const NIGHT = { t: 0.4, time: 23, weather: 'clear', wind: 0.2, indoor: false };

/* ---------- small helpers ---------- */

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function share(k, range) {
  if (!Array.isArray(range)) return 0;
  const span = range[1] - range[0];
  return span > 0 ? clamp01((k - range[0]) / span) : k >= range[0] ? 1 : 0;
}

function ease(p) {
  return p * p * (3 - 2 * p);
}

function hash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function canvasOf(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(width));
  canvas.height = Math.max(1, Math.ceil(height));
  return canvas;
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/* a filled circle made of pixel rows */
function disc(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  const cx = Math.round(x);
  const cy = Math.round(y);
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35);
    ctx.fillRect(cx - half, cy + dy, half * 2 + 1, 1);
  }
}

/* sky colours from the horizon upward; the last one fills the rest; a dithered row softens each step */
function sky(ctx, box, colors, step) {
  let bottom = 12;
  colors.forEach((color, i) => {
    const top = i === colors.length - 1 ? box.y0 : bottom - step;
    rect(ctx, box.x0, top, box.x1 - box.x0, bottom - top, color);
    if (i > 0) {
      ctx.fillStyle = color;
      for (let x = box.x0; x < box.x1; x += 4) ctx.fillRect(x, bottom, 2, 1);
      for (let x = box.x0 + 2; x < box.x1; x += 8) ctx.fillRect(x, bottom + 1, 2, 1);
    }
    bottom = top;
  });
}

/* a soft pixel hill line, filled down to the bottom of the layer (or only `thick` pixels deep) */
function ridge(ctx, box, base, amp, seed, color, freq = 0.045, thick = 0) {
  ctx.fillStyle = color;
  for (let x = box.x0; x < box.x1; x++) {
    const y = Math.round(base + Math.sin(x * freq + seed) * amp + Math.sin(x * freq * 2.4 + seed * 2) * amp * 0.4);
    ctx.fillRect(x, y, 1, thick || box.y1 - y);
  }
}

function ridgeY(x, base, amp, seed, freq = 0.045) {
  return Math.round(base + Math.sin(x * freq + seed) * amp + Math.sin(x * freq * 2.4 + seed * 2) * amp * 0.4);
}

/* round tree tops along a hill line */
function woods(ctx, box, base, amp, seed, color, gap, size) {
  for (let x = box.x0; x < box.x1; x += gap) {
    const h = hash(x * 0.37 + seed);
    if (h < 0.3) continue;
    disc(ctx, x + h * gap, ridgeY(x, base, amp, seed) - 1, size + Math.round(h * 2), color);
  }
}

function cloud(ctx, x, y, size, color) {
  disc(ctx, x, y, size, color);
  disc(ctx, x + size * 1.4, y + 1, size - 1, color);
  disc(ctx, x - size * 1.3, y + 1, size - 2, color);
  rect(ctx, x - size * 2.2, y + 1, size * 4.6, size - 1, color);
}

/* light that falls off in a few even steps (drawn additively) */
function glowSprite(rgb) {
  const canvas = canvasOf(64, 64);
  const ctx = canvas.getContext('2d');
  for (let r = 31; r >= 3; r -= 4) disc(ctx, 32, 32, r, `rgba(${rgb},0.085)`);
  return canvas;
}

/* ---------- the painter ---------- */

export function storyPainter(art) {
  const sets = new Map();
  const glows = new Map();
  const plans = new WeakMap();
  let vignette = null;
  let grassColor = null;
  let canDrain = null;

  function glow(g, x, y, radius, rgb, alpha) {
    let sprite = glows.get(rgb);
    if (!sprite) {
      sprite = glowSprite(rgb);
      glows.set(rgb, sprite);
    }
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = alpha;
    g.drawImage(sprite, Math.round(x - radius), Math.round(y - radius), radius * 2, radius * 2);
    g.restore();
  }

  /* the colour of the game's grass, read once from its own tile, for hills that meet the ground */
  function grass() {
    if (grassColor) return grassColor;
    grassColor = '#4c9a4c';
    try {
      const canvas = canvasOf(TILE, TILE);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      art.drawTile(ctx, false, 'grass', 0, 0, 70, 9, DAY, () => 'grass');
      const data = ctx.getImageData(0, 0, TILE, TILE).data;
      let r = 0;
      let gr = 0;
      let b = 0;
      let n = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 200) continue;
        r += data[i];
        gr += data[i + 1];
        b += data[i + 2];
        n++;
      }
      if (n) grassColor = `rgb(${Math.round(r / n)},${Math.round(gr / n)},${Math.round(b / n)})`;
    } catch (error) {
      /* the fallback green stays */
    }
    return grassColor;
  }

  /* ----- building a set: layers painted once ----- */

  function makeLayer(v, depth, zoom, res, paint) {
    const canvas = canvasOf((v.W + 2 * PAD) * res, v.H * res);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(res * zoom, 0, 0, res * zoom, (PAD + v.cx) * res, v.gy * res);
    const box = {
      x0: Math.floor(-(v.cx + PAD) / zoom) - 1,
      x1: Math.ceil((v.W - v.cx + PAD) / zoom) + 1,
      y0: Math.floor(-v.gy / zoom) - 1,
      y1: Math.ceil((v.H - v.gy) / zoom) + 1,
    };
    try {
      paint(ctx, box);
    } catch (error) {
      /* a layer that cannot be painted stays as far as it got */
    }
    return { canvas, depth };
  }

  function tiles(ctx, box, top, pick) {
    const tx0 = Math.floor(box.x0 / TILE) - 1;
    const tx1 = Math.ceil(box.x1 / TILE);
    for (let ty = 0; top + ty * TILE < box.y1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        try {
          art.drawTile(ctx, false, pick(tx, ty), tx * TILE, top + ty * TILE, tx + 64, ty + 8, DAY, (dx, dy) => pick(tx + dx, ty + dy));
        } catch (error) {
          /* a tile that cannot be drawn is left out */
        }
      }
    }
  }

  /* a prop or building standing with the middle of its foot on (x, y) */
  function stand(ctx, kind, type, x, y, env, scale = 1) {
    try {
      const bounds = (kind === 'building' ? art.buildingBounds(type) : art.propBounds(type)) || { left: 0, right: TILE, bottom: TILE };
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y));
      ctx.scale(scale, scale);
      const px = -Math.round((bounds.left + bounds.right) / 2);
      const py = -Math.round(bounds.bottom);
      if (kind === 'building') art.drawBuilding(ctx, type, px, py, env);
      else art.drawProp(ctx, type, px, py, env);
      ctx.restore();
      return { px, py, scale };
    } catch (error) {
      ctx.restore();
      return null;
    }
  }

  function meadowPick(seed, pathRows) {
    return (tx, ty) => {
      if (pathRows && pathRows.includes(ty)) return 'path';
      return hash(tx * 7.3 + ty * 13.7 + seed) < 0.16 ? 'flowers' : 'grass';
    };
  }

  /* bushes at the lower corners of the picture, nearer than everything: they frame the shot */
  function corners(v, zoom, types) {
    return makeLayer(v, 1.3, zoom, v.S, (ctx, box) => {
      const half = v.cx / zoom;
      stand(ctx, 'prop', types[0], -half - 2, box.y1 + 3, DAY);
      stand(ctx, 'prop', types[1], half + 4, box.y1 + 5, DAY);
      if (types[2]) stand(ctx, 'prop', types[2], -half + 16, box.y1 + 9, DAY);
    });
  }

  const SETS = {
    /* a fruit tree on a meadow, close: the golden past, and later the same spot under the veil */
    orchard(v) {
      const zoom = v.zoom;
      const back = [
        makeLayer(v, 0, 1, 1, (ctx, box) => {
          sky(ctx, box, ['#fff2c4', '#ffe9ac', '#f4e4b0', '#d6e6c8', '#b6e0dc', '#98d4e8', '#7ec6ec', '#6ab8ea'], 12);
          disc(ctx, 40, -34, 13, 'rgba(255,250,214,0.35)');
          disc(ctx, 40, -34, 10, '#fffbe2');
          cloud(ctx, -52, -52, 6, '#fff8e2');
          cloud(ctx, 76, -70, 5, '#fff8e2');
          cloud(ctx, -8, -96, 7, '#f4f6ee');
        }),
        makeLayer(v, 0.08, 1, 1, (ctx, box) => {
          ridge(ctx, box, -16, 7, 1, '#a9cf9a');
          woods(ctx, box, -9, 5, 3, '#7fb878', 9, 3);
          ridge(ctx, box, -9, 5, 3, '#8cc07e');
        }),
        makeLayer(v, 0.3, 1, v.S, (ctx, box) => {
          ridge(ctx, box, -3, 2.5, 5, '#6fb565', 0.03);
          stand(ctx, 'building', 'house_a', 58, 0, DAY, 0.5);
          stand(ctx, 'prop', 'hay_bale', -64, 1, DAY, 0.5);
          stand(ctx, 'prop', 'hay_bale', -54, 2, DAY, 0.5);
          stand(ctx, 'prop', 'tree', 96, 0, DAY, 0.5);
        }),
        makeLayer(v, 1, zoom, v.S, (ctx, box) => {
          tiles(ctx, box, -2, meadowPick(3));
          ridge(ctx, box, -3, 1, 8, grass(), 0.11, 4);
          ctx.clearRect(box.x0, box.y0, box.x1 - box.x0, -4 - box.y0);
          /* the tree without the windfalls around its foot: at this distance they read as stray dots */
          ctx.save();
          ctx.beginPath();
          ctx.rect(box.x0, box.y0, box.x1 - box.x0, -14 - box.y0);
          ctx.rect(-47, -14, 14, 24);
          ctx.clip();
          stand(ctx, 'prop', 'fruit_tree', -40, 7, DAY);
          ctx.restore();
          stand(ctx, 'prop', 'bush', 44, 3, DAY);
        }),
      ];
      const haze = makeLayer(v, 0, 1, 1, (ctx) => {
        for (let r = 70; r >= 14; r -= 8) disc(ctx, 40, -34, r, 'rgba(255,214,140,0.05)');
      });
      return { back, front: [corners(v, zoom, ['bush', 'butterfly_bush'])], haze: [haze], lights: [] };
    },

    /* the village green at dusk, wide: houses frame it, a path crosses it, the sun is low */
    festival(v) {
      const back = [
        makeLayer(v, 0, 1, 1, (ctx, box) => {
          sky(ctx, box, ['#ffe09a', '#ffcb84', '#fbb07c', '#ee9880', '#dc8a92', '#be80a0', '#a078a6', '#8670a6', '#7068a0'], 11);
          disc(ctx, 26, -17, 15, 'rgba(255,238,170,0.3)');
          disc(ctx, 26, -17, 11, '#fff4c0');
          cloud(ctx, -60, -44, 6, '#ffd0a4');
          cloud(ctx, 70, -58, 5, '#f2a898');
          cloud(ctx, -20, -86, 7, '#c890a4');
          cloud(ctx, 96, -110, 6, '#9c80a4');
        }),
        makeLayer(v, 0.1, 1, 1, (ctx, box) => {
          ridge(ctx, box, -20, 8, 2, '#b88ca4');
          woods(ctx, box, -11, 5, 4, '#8a7498', 8, 3);
          ridge(ctx, box, -11, 5, 4, '#96809e');
        }),
        makeLayer(v, 0.4, 1, 1, (ctx, box) => {
          woods(ctx, box, -5, 3, 6, '#4f8a58', 7, 4);
          ridge(ctx, box, -5, 3, 6, '#5d9a5c', 0.03);
        }),
        makeLayer(v, 1, 1, v.S, (ctx, box) => {
          tiles(ctx, box, -6, meadowPick(11, [1, 2]));
          ridge(ctx, box, -7, 1, 9, grass(), 0.11, 4);
          ctx.clearRect(box.x0, box.y0, box.x1 - box.x0, -8 - box.y0);
          stand(ctx, 'prop', 'cherry_tree', -150, 8, DAY);
          stand(ctx, 'prop', 'tree', 152, 9, DAY);
          stand(ctx, 'building', 'house_a', -92, 8, DAY);
          stand(ctx, 'building', 'house_copper', 94, 8, DAY);
          stand(ctx, 'prop', 'market_stall', -22, 8, DAY);
          stand(ctx, 'prop', 'cart', 22, 9, DAY);
          stand(ctx, 'prop', 'barrel', 50, 9, DAY);
          stand(ctx, 'prop', 'hay_bale', -50, 9, DAY);
          stand(ctx, 'prop', 'pumpkin', 0, 10, DAY);
        }),
      ];
      return { back, front: [corners(v, 1, ['bush', 'bush', 'pumpkin'])], haze: [], lights: [] };
    },

    /* a sleeping town under a hill at night, wide: one window is lit, its chimney smokes */
    nightTown(v) {
      const TOWN = 0.55;
      const homeX = 18;
      const off = homeX - 52;
      const homeY = -8;
      let home = null;
      const back = [
        makeLayer(v, 0, 1, 1, (ctx, box) => {
          sky(ctx, box, ['#86a2cc', '#7690c0', '#647cb2', '#5268a2', '#425690', '#34467e', '#2a386c', '#222c5a', '#1c244c'], 13);
        }),
        makeLayer(v, 0.1, 1, 1, (ctx, box) => {
          ridge(ctx, box, -44, 9, 2, '#465a92');
          woods(ctx, box, -34, 6, 5, '#34467c', 8, 3);
          ridge(ctx, box, -34, 6, 5, '#3a4c84');
        }),
        makeLayer(v, 0.4, 1, v.S, (ctx, box) => {
          const kinds = ['house_a', 'shop', 'house_copper', 'house_a'];
          for (let i = -4; i <= 4; i++) stand(ctx, 'building', kinds[(i + 8) % 4], i * 50 + 22, -22, DAY, 0.5);
          for (let i = -5; i <= 5; i++) stand(ctx, 'prop', 'pine', i * 50 - 4, -21, DAY, 0.5);
          /* the far row stands in haze */
          ctx.globalCompositeOperation = 'source-atop';
          rect(ctx, box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0, 'rgba(70,90,150,0.5)');
          ctx.globalCompositeOperation = 'source-over';
        }),
        makeLayer(v, TOWN, 1, v.S, (ctx, box) => {
          ridge(ctx, box, -13, 2, 3, '#4f8a58', 0.03);
          const row = [['house_copper', -150], ['house_a', -100], ['shop', -48], ['house_a', 106], ['house_copper', 156], ['shop', 208]];
          for (const [type, x] of row) stand(ctx, 'building', type, x + off, homeY, DAY, 0.5);
          home = stand(ctx, 'building', 'house_player', homeX, homeY, DAY, 0.5);
          stand(ctx, 'prop', 'tree', 2 + off, -7, DAY, 0.5);
          stand(ctx, 'prop', 'pine', -74 + off, -7, DAY, 0.5);
          stand(ctx, 'prop', 'tree', 132 + off, -7, DAY, 0.5);
          stand(ctx, 'prop', 'pine', 82 + off, -7, DAY, 0.5);
        }),
        makeLayer(v, 1, 1, v.S, (ctx, box) => {
          tiles(ctx, box, 4, meadowPick(5));
          ridge(ctx, box, 3, 2, 2, grass(), 0.05, 5);
          ctx.clearRect(box.x0, box.y0, box.x1 - box.x0, 0 - box.y0);
          stand(ctx, 'prop', 'pine', -96, 12, DAY);
          stand(ctx, 'prop', 'pine', 152, 12, DAY);
        }),
      ];
      /* the lit windows: the same house painted with its lamps on, kept only where its windows are */
      const info = art.buildingInfo('house_player');
      const lamps = (info && info.lights) || [];
      const lights = [
        makeLayer(v, TOWN, 1, v.S, (ctx) => {
          if (!home) return;
          ctx.save();
          ctx.translate(homeX, homeY);
          ctx.scale(0.5, 0.5);
          ctx.beginPath();
          for (const lamp of lamps.slice(0, 2)) ctx.rect(home.px + lamp.dx - 9, home.py + lamp.dy - 9, 18, 18);
          ctx.clip();
          art.drawBuilding(ctx, 'house_player', home.px, home.py, NIGHT);
          ctx.restore();
        }),
      ];
      const spots = home ? lamps.slice(0, 2).map((lamp) => [homeX + (home.px + lamp.dx) * 0.5, homeY + (home.py + lamp.dy) * 0.5]) : [];
      const bounds = art.buildingBounds('house_player') || { top: -30, left: 0, right: 96 };
      const chimney = home ? [homeX + (home.px + bounds.left + (bounds.right - bounds.left) * 0.74) * 0.5 - 6, homeY + (home.py + bounds.top) * 0.5 + CHIMNEY_DROP] : null;
      return { back, front: [corners(v, 1, ['bush', 'bush'])], haze: [], lights, spots, chimney, depth: TOWN };
    },

    /* the wall of a house at night, close: one open window with a light on inside */
    window(v) {
      const back = [
        makeLayer(v, 1, 1, v.S, (ctx, box) => {
          const w = box.x1 - box.x0;
          rect(ctx, box.x0, box.y0, w, box.y1 - box.y0, '#e6d8b8');
          for (let i = 0; i < 260; i++) {
            rect(ctx, box.x0 + hash(i) * w, -74 + hash(i + 400) * 76, 2, 1, i % 3 ? '#dccba6' : '#efe4c8');
          }
          /* the roof above */
          for (let y = -79, row = 0; y > box.y0 - 6; y -= 6, row++) {
            rect(ctx, box.x0, y - 6, w, 6, row % 2 ? '#b2483a' : '#a84034');
            for (let x = box.x0 - (row % 2) * 5; x < box.x1; x += 10) rect(ctx, x, y - 6, 1, 6, '#86302a');
            rect(ctx, box.x0, y - 1, w, 1, '#86302a');
          }
          rect(ctx, box.x0, -79, w, 3, '#5c3a28');
          /* timber */
          rect(ctx, box.x0, -76, w, 5, '#7a5236');
          rect(ctx, box.x0, 0, w, 5, '#7a5236');
          for (const x of [-56, 51, -126, 121]) rect(ctx, x, -71, 5, 71, '#7a5236');
          rect(ctx, box.x0, -72, w, 1, '#5c3a28');
          rect(ctx, box.x0, 4, w, 1, '#5c3a28');
          /* the stone foot and the ground */
          for (let x = box.x0, i = 0; x < box.x1; x += 11, i++) {
            rect(ctx, x, 5, 11, 5, i % 2 ? '#9a9aa6' : '#8a8a98');
            rect(ctx, x + 5, 10, 11, 5, i % 2 ? '#8a8a98' : '#a4a4b0');
            rect(ctx, x, 5, 1, 5, '#6a6a78');
            rect(ctx, x + 5, 10, 1, 5, '#6a6a78');
          }
          rect(ctx, box.x0, 10, w, 1, '#6a6a78');
          tiles(ctx, box, 15, meadowPick(7));
          /* the window: frame, open shutters, sill and flower box */
          rect(ctx, -26, -63, 52, 52, '#5c3a28');
          rect(ctx, -23, -60, 46, 46, '#2a2238');
          for (const x of [-41, 27]) {
            rect(ctx, x, -62, 14, 50, '#5c3a28');
            rect(ctx, x + 1, -61, 12, 48, '#3f7a6a');
            for (let y = -58; y < -15; y += 5) rect(ctx, x + 2, y, 10, 1, '#2f5f54');
            rect(ctx, x + 1, -38, 12, 2, '#2f5f54');
          }
          rect(ctx, -30, -14, 60, 4, '#b08a5a');
          rect(ctx, -30, -10, 60, 1, '#7a5236');
          rect(ctx, -24, -9, 48, 7, '#8a5a3a');
          rect(ctx, -24, -9, 48, 1, '#4a3424');
          for (let i = 0; i < 11; i++) {
            const x = -22 + i * 4 + Math.round(hash(i + 9) * 2);
            rect(ctx, x, -13 - (i % 3), 3, 4 + (i % 3), i % 2 ? '#4f9a54' : '#3f8a4a');
            if (i % 2 === 0) rect(ctx, x, -15 - (i % 3), 2, 2, ['#f06a7a', '#ffd86a', '#f4f0f0'][i % 3]);
          }
        }),
      ];
      return { back, front: [], haze: [], lights: [], opening: [-23, -60, 46, 46] };
    },
  };

  function setOf(name, v) {
    const key = `${name}|${v.zoom}|${v.W}|${v.H}|${v.gy}|${v.S}`;
    let set = sets.get(key);
    if (set) {
      /* used last: it is forgotten last */
      sets.delete(key);
      sets.set(key, set);
      return set;
    }
    const build = SETS[name];
    set = build ? build(v) : { back: [], front: [], haze: [], lights: [] };
    sets.set(key, set);
    while (sets.size > KEEP_SETS) sets.delete(sets.keys().next().value);
    return set;
  }

  /* ----- one panel's plan: who is drawn under the light and who over it, kept per scene ----- */

  function planOf(scene) {
    let plan = plans.get(scene);
    if (plan) return plan;
    const actors = (Array.isArray(scene.actors) ? scene.actors : []).map((actor) => ({
      actor,
      over: !!(actor.glow || actor.clear || actor.unseen != null),
      x: 0,
      lift: 0,
      dir: 0,
      frame: 0,
      sit: false,
      moving: false,
      alpha: 1,
      pose: { scale: SPIRIT_SCALE, dir: 0, moving: false, sit: false, alpha: 1 },
      shown: true,
      look: { npc: true, seed: actor.seed == null ? 0.3 : actor.seed },
    }));
    actors.sort((a, b) => (a.actor.y || 0) - (b.actor.y || 0));
    const extras = Array.isArray(scene.extras) ? scene.extras : [];
    plan = { actors, extras, veil: { on: false, all: false, lift: false, x: 0, y: 0, r: 0 } };
    plans.set(scene, plan);
    return plan;
  }

  function veilAt(plan, scene, k, v) {
    const veil = plan.veil;
    const spec = scene.veil;
    veil.on = !!spec;
    veil.all = spec === 'all';
    if (!spec || veil.all) return veil;
    veil.lift = !!spec.lift;
    veil.x = spec.x || 0;
    veil.y = spec.y || 0;
    veil.r = ease(share(k, spec.at)) * Math.hypot(v.W + PAD, v.H) / v.zoom;
    return veil;
  }

  /* is this point under the veil (1) or free of it (0), softly across the veil's edge */
  function veiled(veil, x, y) {
    if (!veil.on) return 0;
    if (veil.all) return 1;
    const inside = clamp01((veil.r - Math.hypot(x - veil.x, y - veil.y)) / FAINT_EDGE);
    return veil.lift ? 1 - inside : inside;
  }

  function update(state, k, veil) {
    const actor = state.actor;
    let x = actor.x || 0;
    state.moving = false;
    state.frame = 0;
    if (actor.walk) {
      const p = share(k, actor.walk.at);
      const gone = (actor.walk.to - x) * p;
      state.moving = p > 0 && p < 1;
      if (state.moving) state.frame = [1, 2, 3, 0][Math.floor(Math.abs(gone) / 6) % 4];
      x += gone;
    }
    state.x = x;
    state.lift = 0;
    if (Array.isArray(actor.hop) && k >= actor.hop[0] && k <= actor.hop[1]) {
      const p = (k - actor.hop[0]) / (actor.hop[1] - actor.hop[0]);
      state.lift = Math.abs(Math.sin(p * Math.PI * (actor.hop[2] || 1))) * (actor.hop[3] || 3);
    }
    state.dir = actor.dir || 0;
    if (Array.isArray(actor.turn)) for (const turn of actor.turn) if (k >= turn[0]) state.dir = turn[1];
    state.sit = Array.isArray(actor.sit) ? k >= actor.sit[0] : !!actor.sit;
    state.alpha = 1;
    if (actor.spirit && (actor.fades || actor.unseen != null)) {
      const faint = actor.unseen != null ? actor.unseen : 0.3;
      state.alpha = 1 - (1 - faint) * veiled(veil, x, (actor.y || 0) - 8);
    }
  }

  function drawActor(g, state, env) {
    const actor = state.actor;
    const scale = actor.scale || 1;
    g.save();
    try {
      g.translate(Math.round(state.x), Math.round((actor.y || 0) - state.lift));
      if (scale !== 1) g.scale(scale, scale);
      if (actor.person) {
        art.drawPerson(g, actor.person, 0, 0, state.dir, state.frame, env, actor.clear ? undefined : state.look);
      } else {
        const pose = state.pose;
        pose.dir = state.sit ? 0 : state.dir;
        pose.moving = state.moving;
        pose.sit = state.sit;
        pose.alpha = state.alpha;
        art.drawCreature(g, actor.spirit, 0, -10 * SPIRIT_SCALE, env, pose);
      }
    } catch (error) {
      /* someone who cannot be drawn is left out */
    }
    g.restore();
  }

  /* ----- extras ----- */

  function apple(g, part, k) {
    const p = ease(share(k, part.at));
    const from = part.from || [0, 0];
    const to = part.to || from;
    const x = Math.round((from[0] + (to[0] - from[0]) * p) * 2) / 2;
    const y = Math.round((from[1] + (to[1] - from[1]) * p - Math.sin(p * Math.PI) * (part.arc || 0)) * 2) / 2;
    /* painted in half pixels, so it stays a small apple in a close shot */
    g.save();
    g.translate(x, y);
    g.scale(0.5, 0.5);
    disc(g, 0, 0, 4, '#8a1f1c');
    disc(g, 0, 0, 3, '#d8402e');
    rect(g, -2, -2, 2, 2, '#ff9a8a');
    rect(g, 0, -6, 1, 3, '#5a3a22');
    rect(g, 1, -6, 3, 2, '#5aa04a');
    g.restore();
  }

  function lanternPlace(part, i) {
    const u = (i + 0.5) / part.n;
    return [
      part.from[0] + (part.to[0] - part.from[0]) * u,
      part.from[1] + (part.to[1] - part.from[1]) * u + (part.sag || 0) * 4 * u * (1 - u) + 1,
    ];
  }

  /* how far along the string the lamplighter has come (1: all of it) */
  function lanternReach(part, k) {
    if (part.lit) return 1;
    return part.lighter ? share(k, part.lighter.at) : 0;
  }

  /* the posts, the string and the paper lanterns, unlit */
  function lanternsUnder(g, part) {
    const [x0, y0] = part.from;
    const [x1, y1] = part.to;
    for (const [x, y] of [[x0, y0], [x1, y1]]) {
      rect(g, x - 1, y - 2, 3, 12 - y, '#5a4030');
      rect(g, x - 1, y - 2, 1, 12 - y, '#7a5a40');
      rect(g, x - 2, y - 3, 5, 2, '#4a3426');
    }
    g.fillStyle = '#4a3426';
    for (let x = x0; x <= x1; x++) {
      const u = (x - x0) / (x1 - x0);
      g.fillRect(x, Math.round(y0 + (y1 - y0) * u + (part.sag || 0) * 4 * u * (1 - u)), 1, 1);
    }
    for (let i = 0; i < part.n; i++) {
      const [x, y] = lanternPlace(part, i);
      rect(g, x - 2, y, 5, 6, i % 2 ? '#b0705a' : '#b89060');
      rect(g, x - 1, y - 1, 3, 1, '#4a3426');
      rect(g, x - 1, y + 6, 3, 1, '#4a3426');
    }
  }

  /* the lanterns that burn, and the hontori that lights them one after another */
  function lanternsOver(g, part, k, env, veil) {
    const reach = lanternReach(part, k);
    for (let i = 0; i < part.n; i++) {
      if ((i + 0.5) / part.n > reach) continue;
      const [x, y] = lanternPlace(part, i);
      const burn = 1 - veiled(veil, x, y);
      if (burn <= 0.05) continue;
      g.globalAlpha = burn;
      rect(g, x - 2, y, 5, 6, i % 2 ? '#ff9a6a' : '#ffd27a');
      rect(g, x - 1, y + 1, 3, 4, '#fff2c0');
      g.globalAlpha = 1;
      glow(g, x, y + 3, 15, '255,190,110', 0.75 * burn);
    }
    if (part.lighter && part.lighter.spirit) {
      const [x0, y0] = part.from;
      const [x1, y1] = part.to;
      const u = ease(reach);
      const x = x0 + (x1 - x0) * u;
      const y = y0 + (y1 - y0) * u + (part.sag || 0) * 4 * u * (1 - u) - 8;
      try {
        art.drawCreature(g, part.lighter.spirit, Math.round(x), Math.round(y), env, { scale: SPIRIT_SCALE, dir: 3, moving: reach > 0 && reach < 1, noShadow: true });
      } catch (error) {
        /* the lamplighter is left out */
      }
    }
  }

  /* the seal of the old law: a grey stone disc with a closed eye; open: 0 closed .. 1 open */
  function seal(g, part, k, v) {
    const gone = part.gone ? share(k, part.gone) : 0;
    if (gone >= 1) return;
    const drop = part.drop ? share(k, part.drop) : 1;
    const top = -v.gy / v.zoom - 18;
    const landed = 1 - (1 - drop) * (1 - drop);
    const x = Math.round(part.x || 0);
    let y = Math.round(top + ((part.y || 0) - top) * landed);
    /* it presses down once as it lands */
    if (part.drop && k > part.drop[1] && k < part.drop[1] + 0.07) y += 1;
    const open = part.open ? share(k, part.open) : 0;
    g.save();
    g.globalAlpha = 1 - gone;
    disc(g, x, y + 1, 14, 'rgba(20,20,32,0.35)');
    disc(g, x, y, 14, '#3e404c');
    disc(g, x, y, 12, '#9da0ae');
    disc(g, x, y - 1, 11, '#b9bcc8');
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.39;
      rect(g, x + Math.cos(a) * 13 - 0.5, y + Math.sin(a) * 13 - 0.5, 1, 1, '#b9bcc8');
    }
    const lid = '#34363f';
    /* an almond eye: its lid is down (stone), or it opens on a warm iris */
    const h = Math.round(open * 3);
    for (let dy = -4; dy <= 4; dy++) {
      const half = Math.round(9 * (1 - (dy * dy) / 20.25));
      rect(g, x - half, y + dy - 1, half * 2 + 1, 1, lid);
    }
    for (let dy = -3; dy <= 3; dy++) {
      const half = Math.round(7.6 * (1 - (dy * dy) / 12.25));
      rect(g, x - half, y + dy - 1, half * 2 + 1, 1, Math.abs(dy) <= h && open > 0.05 ? '#fbf6e6' : dy < 0 ? '#8d909e' : '#7d808e');
    }
    if (open > 0.05) {
      if (h > 0) disc(g, x, y - 1, Math.min(2, h), '#d8962e');
      rect(g, x, y - 1, 1, 1, lid);
    } else {
      rect(g, x - 7, y - 1, 15, 1, lid);
      for (const i of [-4, -1, 2, 5]) rect(g, x + i - 1, y + 4, 1, 2, lid);
    }
    g.restore();
  }

  /* an ember rises from the fire hontori and draws the stroke in gold */
  function sigil(g, part, k) {
    const points = part.points;
    if (!Array.isArray(points) || points.length < 2) return;
    const rise = share(k, part.rise);
    if (rise <= 0) return;
    const drawn = share(k, part.at);
    const segments = points.length - 1;
    const n = 18 * segments;
    const upTo = Math.floor(n * drawn);
    let hx = points[0][0];
    let hy = points[0][1];
    for (let i = 0; i <= upTo && drawn > 0; i++) {
      const t = (i / n) * segments;
      const s = Math.min(segments - 1, Math.floor(t));
      const u = t - s;
      hx = Math.round(points[s][0] + (points[s + 1][0] - points[s][0]) * u);
      hy = Math.round(points[s][1] + (points[s + 1][1] - points[s][1]) * u);
      g.fillStyle = 'rgba(255,200,110,0.3)';
      g.fillRect(hx - 2, hy - 2, 5, 5);
      g.fillStyle = '#ffd98a';
      g.fillRect(hx - 1, hy - 1, 3, 3);
    }
    if (drawn <= 0 && part.from) {
      const p = ease(rise);
      hx = Math.round(part.from[0] + (points[0][0] - part.from[0]) * p);
      hy = Math.round(part.from[1] + (points[0][1] - part.from[1]) * p);
    }
    for (let i = 0; i <= upTo && drawn > 0; i += 2) {
      const t = (i / n) * segments;
      const s = Math.min(segments - 1, Math.floor(t));
      const u = t - s;
      g.fillStyle = '#fff6d8';
      g.fillRect(Math.round(points[s][0] + (points[s + 1][0] - points[s][0]) * u), Math.round(points[s][1] + (points[s + 1][1] - points[s][1]) * u), 1, 1);
    }
    /* the ember itself, while it travels */
    if (drawn < 1) {
      glow(g, hx, hy, 12, '255,180,90', 0.8);
      rect(g, hx - 1, hy - 1, 3, 3, '#ffb060');
      rect(g, hx, hy, 1, 1, '#fff6d8');
    } else glow(g, points[1][0], points[1][1] - 12, 30, '255,200,120', 0.35);
  }

  function stars(g, v, t) {
    const floor = Math.max(24, v.gy - 62);
    const count = Math.round((v.W * floor) / 320);
    g.fillStyle = '#ffffff';
    for (let i = 0; i < count; i++) {
      const y = Math.round(hash(i * 3.3) * hash(i * 1.7 + 4) * floor) + 2;
      g.globalAlpha = 0.45 + 0.4 * Math.abs(Math.sin(t * 0.7 + i * 1.9));
      g.fillRect(Math.round(hash(i + 20) * v.W), y, 1, 1);
      if (i % 9 === 0) g.fillRect(Math.round(hash(i + 20) * v.W) - 1, y, 3, 1);
    }
    g.globalAlpha = 1;
  }

  function moon(g, part, v) {
    const x = v.cx + (part.x || 0);
    const y = Math.max(18, Math.round((v.gy - 60) * 0.3));
    glow(g, x, y, 30, '190,200,255', 0.6);
    disc(g, x, y, 9, '#fff6da');
    disc(g, x - 3, y - 2, 2, '#f0e4be');
    disc(g, x + 3, y + 3, 1, '#f0e4be');
  }

  /* smoke from the one chimney with a fire under it */
  function smoke(g, x, y, t) {
    for (let i = 0; i < 4; i++) {
      const age = (t * 0.22 + i / 4) % 1;
      g.globalAlpha = 0.3 * (1 - age);
      disc(g, x + Math.sin(age * 5 + i) * 2 + age * 8, y - age * 22, 2 + Math.round(age * 2.4), '#b4bede');
    }
    g.globalAlpha = 1;
  }

  /* the lit room behind the open window and the child in it, seen from outside */
  function kidAtWindow(g, part, set, env, k) {
    const o = set.opening;
    if (!o) return;
    const [x, y, w, h] = o;
    let dir = 0;
    if (Array.isArray(part.turn)) for (const turn of part.turn) if (k >= turn[0]) dir = turn[1];
    g.save();
    g.beginPath();
    g.rect(x, y, w, h);
    g.clip();
    const room = ['#ffe9ae', '#ffdf9a', '#fbd088', '#f4be76', '#e8aa68'];
    room.forEach((color, i) => rect(g, x, y + (i * h) / room.length, w, h / room.length + 1, color));
    /* a shelf with books and a framed picture on the far wall */
    rect(g, x + 3, y + 12, 14, 2, '#a8703e');
    ['#c8563a', '#4d7fd0', '#5aa04a', '#e2c060'].forEach((color, i) => rect(g, x + 4 + i * 3, y + 6 + (i % 2), 2, 6 - (i % 2), color));
    rect(g, x + w - 15, y + 6, 11, 9, '#a8703e');
    rect(g, x + w - 13, y + 8, 7, 5, '#fff2cc');
    try {
      g.save();
      g.translate(x + w / 2, y + h + 16);
      g.scale(2, 2);
      art.drawPerson(g, part.look || 'kid', 0, 0, dir, 0, env, undefined);
      g.restore();
    } catch (error) {
      g.restore();
    }
    /* curtains */
    for (let i = 0; i < 7; i++) {
      rect(g, x, y + i * 3, 9 - i, 3, i % 2 ? '#d86a6a' : '#c85a5e');
      rect(g, x + w - 9 + i, y + i * 3, 9 - i, 3, i % 2 ? '#d86a6a' : '#c85a5e');
    }
    g.restore();
    glow(g, x + w / 2, y + h / 2, 50, '255,196,110', 0.5);
  }

  /* ----- light and veil ----- */

  function light(g, name, v) {
    const spec = LIGHTS[name];
    if (!spec) return;
    g.save();
    g.globalCompositeOperation = 'multiply';
    g.globalAlpha = spec.alpha;
    g.fillStyle = spec.color;
    g.fillRect(0, 0, v.W, v.H);
    g.restore();
  }

  /* take the colour out of what has been painted so far, inside the current clip */
  function drain(g) {
    if (canDrain == null) {
      g.globalCompositeOperation = 'color';
      canDrain = g.globalCompositeOperation === 'color';
    }
    const far = 4000;
    if (canDrain) {
      g.globalCompositeOperation = 'color';
      g.globalAlpha = 0.93;
      g.fillStyle = '#7d8088';
      g.fillRect(-far, -far, far * 2, far * 2);
      g.globalCompositeOperation = 'multiply';
      g.globalAlpha = 0.5;
      g.fillStyle = '#aab0c2';
      g.fillRect(-far, -far, far * 2, far * 2);
    } else {
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 0.62;
      g.fillStyle = '#6c7078';
      g.fillRect(-far, -far, far * 2, far * 2);
    }
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
  }

  function drawVeil(g, veil) {
    if (!veil.on) return;
    if (veil.all) {
      drain(g);
      return;
    }
    if (veil.r <= 0 && !veil.lift) return;
    g.save();
    g.beginPath();
    if (veil.lift) g.rect(-4000, -4000, 8000, 8000);
    g.arc(veil.x, veil.y, Math.max(0.01, veil.r), 0, Math.PI * 2);
    g.clip(veil.lift ? 'evenodd' : 'nonzero');
    drain(g);
    g.restore();
    /* the edge of the veil itself, so the eye sees what takes or returns the colour */
    if (veil.r > 2) {
      g.save();
      g.lineWidth = 1.5;
      g.strokeStyle = veil.lift ? 'rgba(255,224,150,0.85)' : 'rgba(214,218,230,0.6)';
      g.beginPath();
      g.arc(veil.x, veil.y, veil.r, 0, Math.PI * 2);
      g.stroke();
      g.lineWidth = 4;
      g.strokeStyle = veil.lift ? 'rgba(255,214,130,0.3)' : 'rgba(200,204,220,0.22)';
      g.beginPath();
      g.arc(veil.x, veil.y, Math.max(0.01, veil.r - 3), 0, Math.PI * 2);
      g.stroke();
      g.restore();
    }
  }

  function drawVignette(g, v) {
    if (!vignette || vignette.width !== v.W || vignette.height !== v.H) {
      vignette = canvasOf(v.W, v.H);
      const ctx = vignette.getContext('2d');
      const far = Math.hypot(v.W, v.H) / 2;
      const shade = ctx.createRadialGradient(v.W / 2, v.H * 0.52, far * 0.55, v.W / 2, v.H * 0.52, far);
      shade.addColorStop(0, 'rgba(6,6,14,0)');
      shade.addColorStop(1, 'rgba(6,6,14,0.5)');
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, v.W, v.H);
    }
    g.drawImage(vignette, 0, 0, v.W, v.H);
  }

  function drawLayer(g, v, layer, camX) {
    const shift = Math.max(-PAD, Math.min(PAD, camX * v.zoom * layer.depth));
    g.drawImage(layer.canvas, Math.round((-PAD - shift) * v.S) / v.S, 0, v.W + 2 * PAD, v.H);
  }

  const view = { W: 0, H: 0, S: 3, cx: 0, gy: 0, zoom: 1 };

  return {
    paint(g, scene, env, k, size) {
      const v = view;
      v.W = size[0];
      v.H = size[1];
      v.S = size[2] || 3;
      v.zoom = scene.zoom === 2 ? 2 : 1;
      v.cx = Math.round(v.W / 2);
      const wide = v.W > v.H;
      const horizon = Array.isArray(scene.horizon) ? scene.horizon[wide ? 1 : 0] : wide ? 0.66 : 0.7;
      v.gy = Math.round(v.H * horizon);

      const set = setOf(scene.set, v);
      const plan = planOf(scene);
      const cam = scene.cam || {};
      const camP = ease(share(k, cam.at || [0, env.hold || 1]));
      const from = cam.from ? cam.from[0] : 0;
      const camX = from + ((cam.to ? cam.to[0] : from) - from) * camP;
      const veil = veilAt(plan, scene, k, v);
      const originX = Math.round((v.cx - camX * v.zoom) * v.S) / v.S;
      const world = () => {
        g.save();
        g.translate(originX, v.gy);
        g.scale(v.zoom, v.zoom);
      };

      g.fillStyle = BG;
      g.fillRect(0, 0, v.W, v.H);
      for (const layer of set.back) drawLayer(g, v, layer, camX);

      /* under the light: the things and the beings the light and the veil fall on */
      world();
      for (const part of plan.extras) {
        if (part.part === 'lanterns') lanternsUnder(g, part);
      }
      for (const state of plan.actors) {
        state.shown = !state.actor.wide || Math.abs(state.actor.x || 0) + WIDE_ROOM <= v.W / 2 / v.zoom;
        if (!state.shown) continue;
        update(state, k, veil);
        if (!state.over && state.alpha >= 1) drawActor(g, state, env);
      }
      for (const part of plan.extras) if (part.part === 'apple') apple(g, part, k);
      g.restore();
      for (const layer of set.front) drawLayer(g, v, layer, camX);

      light(g, scene.light, v);
      world();
      drawVeil(g, veil);
      g.restore();

      /* over the light: what shines by itself, and what the veil hides but cannot remove */
      if (scene.haze) for (const layer of set.haze) drawLayer(g, v, layer, camX);
      for (const layer of set.lights) drawLayer(g, v, layer, camX);
      for (const part of plan.extras) {
        if (part.part === 'stars') stars(g, v, env.t);
        else if (part.part === 'moon') moon(g, part, v);
      }
      world();
      /* things that belong to a far layer move with it */
      const drift = camX * (1 - (set.depth || 1));
      for (const part of plan.extras) {
        switch (part.part) {
          case 'lanterns':
            lanternsOver(g, part, k, env, veil);
            break;
          case 'smoke':
            if (set.chimney) smoke(g, set.chimney[0] + drift, set.chimney[1], env.t);
            break;
          case 'kidAtWindow':
            kidAtWindow(g, part, set, env, k);
            break;
          case 'seal':
            seal(g, part, k, v);
            break;
          case 'sigil':
            sigil(g, part, k);
            break;
          default:
            break;
        }
      }
      if (set.spots) for (const spot of set.spots) glow(g, spot[0] + drift, spot[1], 20, '255,190,110', 0.7);
      for (const state of plan.actors) {
        const actor = state.actor;
        if (!state.shown || (!state.over && state.alpha >= 1)) continue;
        if (actor.light) glow(g, state.x, (actor.y || 0) - 7 * (actor.scale || 1), actor.light, '255,170,90', 0.55);
        drawActor(g, state, env);
      }
      g.restore();
      drawVignette(g, v);
    },

    forget() {
      sets.clear();
      vignette = null;
    },
  };
}
