/*
 * storyArt.js  (Hontori: features)
 * Job: the painter of Hontori's picture stories: the named grounds, actors and extras a panel of
 * content/prologue/story.js is made of, drawn with the game's own people and hontori in the 192 x 120 panel.
 * The look is the current game's (src/prologue.js).
 *
 * Public API:
 *   storyPainter(art)   { paint(g, scene, env, k, [w, h]) } for registry kind "picture.painter" "main"
 *
 * Scene parts:
 *   ground   'meadow' | 'meadowGrey' | 'nightVillage' | 'duskHill'
 *   actors   { person: look, x, y, dir, seed } | { spirit: kind, x, y, fade: 0..1 | 'out', sit }
 *   extras   { part: 'stars' } | { part: 'moon', x, y } | { part: 'house', x, y, lit }
 *            | { part: 'eyeClosing', x, y } | { part: 'spiritFlight', kind, from: [x, y], to: [x, y], arc }
 *            | { part: 'sigilDraw', points: [[x, y], ...] }
 */

const SIDE = 72;

function rect(g, x, y, w, h, color) {
  g.fillStyle = color;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/* a soft pixel hill line */
function hills(g, W, H, base, amp, color, seed) {
  g.fillStyle = color;
  for (let x = 0; x < W; x += 2) {
    const y = base + Math.sin(x * 0.045 + seed) * amp + Math.sin(x * 0.11 + seed * 2) * amp * 0.4;
    g.fillRect(x, Math.round(y), 2, H - Math.round(y));
  }
}

function sky(g, W, H, colors) {
  const h = Math.ceil(H / colors.length);
  colors.forEach((c, i) => rect(g, 0, i * h, W, h + 1, c));
}

function stars(g, W, t) {
  for (let i = 0; i < 40; i++) {
    g.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(t * 1.3 + i));
    rect(g, (i * 53) % W, (i * 29) % 62, 1, 1, '#ffffff');
  }
  g.globalAlpha = 1;
}

function meadow(g, W, H, grey) {
  sky(g, W, H, grey ? ['#8f96a6', '#a2a8b6', '#b6bbc6', '#c6cad2'] : ['#6fb6f0', '#8cc8f4', '#aadaf8', '#c8eafc']);
  hills(g, W, H, 62, 7, grey ? '#7f8a86' : '#7cc470', 1);
  hills(g, W, H, 74, 5, grey ? '#6f7a76' : '#5cae58', 3);
  rect(g, 0, 88, W, 32, grey ? '#66706c' : '#4c9a4c');
  for (let i = 0; i < 26; i++) rect(g, (i * 37) % W, 90 + ((i * 13) % 26), 1, 2, grey ? '#7f8a86' : i % 4 ? '#6cc060' : '#ffe27a');
}

const GROUNDS = {
  meadow: (g, W, H) => meadow(g, W, H, false),
  meadowGrey: (g, W, H) => meadow(g, W, H, true),
  nightVillage: (g, W, H) => {
    sky(g, W, H, ['#0c0e2a', '#14143a', '#1c1c4a', '#24245a']);
    hills(g, W, H, 84, 4, '#101028', 2);
    rect(g, 0, 112, W, 8, '#0c0c20');
  },
  duskHill: (g, W, H) => {
    sky(g, W, H, ['#1c1c4a', '#2a2a5e', '#3a3470', '#4a3a78']);
    rect(g, 0, 96, W, 24, '#2a2440');
    rect(g, 0, 96, W, 2, '#3a2e5a');
  },
};

/* the closed grey eye of the old law; k: how far it has closed (0 open .. 1 closed) */
function eye(g, cx, cy, k) {
  const w = 46;
  const h = Math.max(1, Math.round(16 * (1 - k)));
  g.fillStyle = '#3a3a46';
  g.beginPath();
  g.ellipse(cx, cy, w / 2 + 2, 11, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#d8d8e0';
  g.beginPath();
  g.ellipse(cx, cy, w / 2, Math.max(1, h / 2), 0, 0, Math.PI * 2);
  g.fill();
  if (k < 0.85) {
    g.fillStyle = '#5a5a6a';
    g.beginPath();
    g.arc(cx, cy, Math.min(6, h / 2), 0, Math.PI * 2);
    g.fill();
  }
  if (k > 0.6) {
    rect(g, cx - w / 2, cy, w, 1, '#3a3a46');
    for (let i = -2; i <= 2; i++) rect(g, cx + i * 8, cy + 2, 1, 3, '#3a3a46');
  }
}

function house(g, x, y, lit) {
  rect(g, x, y, 44, 30, '#2a2440');
  rect(g, x - 4, y - 4, 52, 6, '#3a2e5a');
  for (let i = 0; i < 12; i++) rect(g, x - 2 + i * 2, y - 6 - i, 48 - i * 4, 2, '#3a2e5a');
  rect(g, x + 30, y - 26, 8, 14, '#4a3a5a');
  rect(g, x + 29, y - 28, 10, 3, '#5a4a6a');
  rect(g, x + 8, y + 8, 10, 10, lit ? '#ffd98a' : '#1a1830');
  rect(g, x + 12, y + 8, 1, 10, '#2a2440');
  rect(g, x + 8, y + 12, 10, 1, '#2a2440');
  rect(g, x + 26, y + 12, 9, 18, '#1a1830');
}

function moon(g, x, y) {
  g.fillStyle = '#fff4d6';
  g.beginPath();
  g.arc(x, y, 9, 0, Math.PI * 2);
  g.fill();
}

/* the stroke draws itself in gold along the points */
function sigilDraw(g, points, k) {
  if (!Array.isArray(points) || points.length < 2) return;
  const segments = points.length - 1;
  const n = 20 * segments;
  const upTo = n * Math.min(1, k * 1.2);
  for (let i = 0; i <= upTo; i++) {
    const t = (i / n) * segments;
    const s = Math.min(segments - 1, Math.floor(t));
    const u = t - s;
    const a = points[s];
    const b = points[s + 1];
    const x = Math.round(a[0] + (b[0] - a[0]) * u);
    const y = Math.round(a[1] + (b[1] - a[1]) * u);
    g.fillStyle = 'rgba(255,217,138,.25)';
    g.fillRect(x - 2, y - 2, 5, 5);
    g.fillStyle = '#ffd98a';
    g.fillRect(x - 1, y - 1, 3, 3);
    g.fillStyle = '#fff6d8';
    g.fillRect(x, y, 1, 1);
  }
}

export function storyPainter(art) {
  /* spirits that fade are drawn on a small side canvas first, so they fade as a whole */
  let side = null;

  function spirit(g, key, x, y, env, alpha, sit) {
    try {
      const pose = { scale: 1, sit: !!sit };
      if (alpha == null || alpha >= 1) {
        art.drawCreature(g, key, x, y, env, pose);
        return;
      }
      if (!side) {
        side = document.createElement('canvas');
        side.width = SIDE;
        side.height = SIDE;
      }
      const sg = side.getContext('2d');
      sg.setTransform(1, 0, 0, 1, 0, 0);
      sg.clearRect(0, 0, SIDE, SIDE);
      art.drawCreature(sg, key, SIDE / 2, 50, env, pose);
      g.save();
      g.globalAlpha = Math.max(0, alpha);
      g.drawImage(side, Math.round(x) - SIDE / 2, Math.round(y) - 50);
      g.restore();
    } catch (error) {
      /* a hontori that cannot be drawn is left out */
    }
  }

  function person(g, actor, env) {
    try {
      art.drawPerson(g, actor.person, actor.x, actor.y, actor.dir || 0, 0, env, { npc: true, seed: actor.seed || 0.3 });
    } catch (error) {
      /* a person that cannot be drawn is left out */
    }
  }

  function extra(g, part, env, k, W) {
    switch (part.part) {
      case 'stars':
        stars(g, W, env.t);
        break;
      case 'moon':
        moon(g, part.x, part.y);
        break;
      case 'house':
        house(g, part.x, part.y, !!part.lit);
        break;
      case 'eyeClosing':
        eye(g, part.x, part.y, Math.min(1, k * 1.5));
        break;
      case 'spiritFlight': {
        const p = Math.min(1, Math.max(0, k));
        const from = part.from || [0, 0];
        const to = part.to || from;
        const x = from[0] + p * (to[0] - from[0]);
        const y = from[1] + p * (to[1] - from[1]) - Math.sin(p * Math.PI) * (part.arc || 0);
        g.fillStyle = 'rgba(255,170,80,.22)';
        g.beginPath();
        g.arc(x, y - 6, 16, 0, Math.PI * 2);
        g.fill();
        spirit(g, part.kind, x, y, env, 1);
        break;
      }
      case 'sigilDraw':
        sigilDraw(g, part.points, k);
        break;
      default:
        break;
    }
  }

  return {
    paint(g, scene, env, k, [W, H]) {
      const ground = GROUNDS[scene.ground];
      if (ground) ground(g, W, H);
      const extras = Array.isArray(scene.extras) ? scene.extras : [];
      /* sky things first, then the people and hontori, then what floats over them */
      const front = new Set(['eyeClosing', 'spiritFlight', 'sigilDraw']);
      for (const part of extras) if (!front.has(part.part)) extra(g, part, env, k, W);
      for (const actor of scene.actors || []) {
        if (actor.person) person(g, actor, env);
        else if (actor.spirit) {
          const alpha = actor.fade === 'out' ? Math.max(0.12, 1 - k * 1.3) : actor.fade == null ? 1 : Number(actor.fade);
          spirit(g, actor.spirit, actor.x, actor.y, env, alpha, actor.sit);
        }
      }
      for (const part of extras) if (front.has(part.part)) extra(g, part, env, k, W);
    },
  };
}
