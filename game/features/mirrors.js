/*
 * mirrors.js  (Hontori: features)
 * Job: Hontori's Mirror Gardens (puzzle type "mirrors", the door test of Halo Court) on the engine's mirrors
 * (systems/features/Mirrors.js): the mirrors on their stands (props garden_mirror_0 '/' and garden_mirror_1 '\',
 * src/props_ch89.js), the sun-stone that sends the beam (prop sun_lamp), the crystal above the gate that takes it
 * (dark until the beam arrives, then gold), the beam of light itself, the soft ring at the mirror that can be
 * swung now, and the entrance test that passes once the puzzle is solved.
 *
 * Public API:
 *   installMirrorGarden(game)   registers trial.test "mirrors" { type: 'mirrors', puzzle } and what installMirrors
 *                               registers
 */

import { installMirrors } from '../../systems/features/index.js';

const TYPE = 'mirrors';
const BEAM = '#fff2a8';
const BEAM_CORE = '#ffffff';
const RING = '#fff2c0';
const CRYSTAL = ['#6a6a88', '#9a9ab8', '#c8c8e0'];
const CRYSTAL_LIT = ['#d8a020', '#ffd45a', '#fff6c8'];

function ring(ctx, cx, cy, t) {
  const pulse = 0.5 + 0.5 * Math.sin(t * 4);
  const rx = 11 + pulse * 1.5;
  ctx.globalAlpha = 0.4 + 0.4 * pulse;
  ctx.fillStyle = RING;
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    ctx.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * rx * 0.42), 1, 1);
  }
  ctx.globalAlpha = 1;
}

export function installMirrorGarden(game) {
  const art = game.art;
  const prop = (ctx, type, x, y, env) => {
    try {
      art.drawProp(ctx, type, x, y, env);
    } catch (error) {
      /* a missing prop draws nothing */
    }
  };
  installMirrors(game, {
    type: TYPE,
    paintMirror(ctx, x, y, look, env) {
      if (look.near) ring(ctx, x + 8, y + 13, (env && env.t) || 0);
      /* while it swings, the stand shows its back for a moment (props 2 and 3) */
      const frame = look.swing > 0.5 ? 2 + look.lean : look.lean;
      prop(ctx, `garden_mirror_${frame}`, x, y, env);
      if (look.lit) {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = BEAM;
        ctx.fillRect(x + 4, y - 10, 8, 10);
        ctx.globalAlpha = 1;
      }
    },
    paintSource(ctx, x, y, look, env) {
      prop(ctx, 'sun_lamp', x, y, env);
    },
    paintTarget(ctx, x, y, look) {
      const c = look.lit ? CRYSTAL_LIT : CRYSTAL;
      const bob = look.lit ? Math.round(Math.sin(look.t * 2) * 1) : 0;
      x = Math.round(x);
      y = Math.round(y) + bob;
      ctx.fillStyle = 'rgba(20,15,10,0.3)';
      ctx.fillRect(x + 3, y + 13, 10, 3);
      ctx.fillStyle = c[0];
      ctx.fillRect(x + 5, y - 6, 6, 16);
      ctx.fillRect(x + 3, y - 2, 10, 8);
      ctx.fillStyle = c[1];
      ctx.fillRect(x + 6, y - 5, 4, 14);
      ctx.fillRect(x + 4, y - 1, 8, 6);
      ctx.fillStyle = c[2];
      ctx.fillRect(x + 6, y - 4, 2, 5);
    },
    paintBeam(ctx, points, look) {
      if (points.length < 2) return;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const shimmer = 0.75 + 0.25 * Math.sin(look.t * 5);
      for (const [w, color, a] of [[5, BEAM, 0.25], [2, BEAM, 0.7], [1, BEAM_CORE, 0.9]]) {
        ctx.globalAlpha = a * shimmer;
        ctx.strokeStyle = color;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
        ctx.stroke();
      }
      ctx.restore();
    },
    sounds: { turn: 'blip', solve: 'unlock' },
  });
  game.registry.add('trial.test', TYPE, (test) => {
    const mirrors = game.registry.get('service', 'mirrors');
    try {
      return !!(mirrors && mirrors.solved(test.puzzle));
    } catch (error) {
      return false;
    }
  });
}
