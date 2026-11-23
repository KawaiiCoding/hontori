/*
 * game/world/fishers.js
 * Job: a fisher at the water keeps facing it, with a line in the water and a red and white bobber
 * that rides the ripples and dips now and then (src/fishing.js). A fisher is anyone whose content
 * service is the fishing service; the water is found in front of them, else beside them.
 *
 * Public API:
 *   fishersOnEnter(game, world, stage)   on map:enter, after the story has matched the people;
 *                                        stage(entity) puts a line into the world picture (its owner
 *                                        steps it: after a talk the fisher turns back to the water)
 *   FISHER_SERVICE                       the service id that makes someone a fisher
 */

import { Painted } from '../../world/Painted.js';
import { DIR_STEP, TILE } from '../../core/units.js';
import { storyOf } from './common.js';

export const FISHER_SERVICE = 'shared.svc.fisher';
const REACH = [1, 2];
const LINE = 'rgba(240,240,230,.75)';
const RIPPLE = 'rgba(255,255,255,.35)';
const BOBBER_TOP = '#e8483a';
const BOBBER_BOTTOM = '#fff';

function facesWater(map, tx, ty, dir) {
  const [dx, dy] = DIR_STEP[dir];
  return REACH.some((n) => map.tileAt(tx + dx * n, ty + dy * n) === 'water');
}

function waterDir(map, person) {
  if (facesWater(map, person.tx, person.ty, person.dir)) return person.dir;
  for (let dir = 0; dir < 4; dir++) if (facesWater(map, person.tx, person.ty, dir)) return dir;
  return -1;
}

const ROD = '#7a4a26';
const ROD_DARK = '#3a2214';
const CORK = '#d8b070';

/* a fisher holds a wooden rod raised from the hands; the line hangs from its tip in a soft curve to the bobber */
function paintLine(ctx, thing, art, env) {
  const { person, dir } = thing.data;
  if (person.away || person.moving || person.dir !== dir) return;
  const [dx, dy] = DIR_STEP[dir];
  const t = env.t || 0;
  const sway = Math.sin(t * 1.1 + person.tx) * 0.6;
  const hx = person.tx * TILE + 8 + dx * 4 + (dy !== 0 ? 4 : 0);
  const hy = person.ty * TILE + 6;
  const tipX = hx + dx * 15 + (dy !== 0 ? 3 : 0) + sway;
  const tipY = hy + dy * 10 - 11;
  ctx.lineCap = 'round';
  ctx.strokeStyle = ROD_DARK;
  ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tipX, tipY); ctx.stroke();
  ctx.strokeStyle = ROD;
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tipX, tipY); ctx.stroke();
  ctx.fillStyle = CORK;
  ctx.fillRect(Math.round(hx) - 1, Math.round(hy) - 1, 2, 2);
  const bx = (person.tx + dx * 2) * TILE + 8 + (dy !== 0 ? 4 : 0);
  const dip = Math.sin(t * 2 + person.tx) > 0.93 ? 2 : Math.sin(t * 1.3) * 0.6;
  const by = (person.ty + dy * 2) * TILE + 10 + dip;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.quadraticCurveTo((tipX + bx) / 2, Math.max(tipY, by) + 3, bx, by - 2);
  ctx.stroke();
  ctx.fillStyle = ROD_DARK;
  ctx.fillRect(Math.round(bx) - 2, Math.round(by) - 4, 4, 5);
  ctx.fillStyle = BOBBER_TOP;
  ctx.fillRect(Math.round(bx) - 1, Math.round(by) - 3, 2, 2);
  ctx.fillStyle = BOBBER_BOTTOM;
  ctx.fillRect(Math.round(bx) - 1, Math.round(by) - 1, 2, 1);
  ctx.strokeStyle = RIPPLE;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.ellipse(bx, by + 1, 4 + Math.sin(t * 2), 1.4, 0, 0, Math.PI * 2);
  ctx.stroke();
}

export function fishersOnEnter(game, world, stage) {
  const story = storyOf(game);
  if (!story || !story.people) return;
  for (const person of world.people) {
    const def = story.people.contentOf(person);
    const service = def ? story.people.resolve(def).service : person.def.service;
    if (service !== FISHER_SERVICE) continue;
    const dir = waterDir(world.map, person);
    if (dir < 0) continue;
    person.dir = dir;
    /* glances would turn them from the water */
    person.def.fixed = true;
    const reach = 2.5 * TILE;
    const line = new Painted(`line:${person.id}`, {
      x: person.tx * TILE,
      y: person.ty * TILE,
      depth: () => person.ty * TILE + TILE,
      bounds: { left: -reach, top: -reach, right: TILE + reach, bottom: TILE + reach },
      paint: paintLine,
      /* after a talk they turn back to the water */
      update: () => {
        if (!person.talking && !person.moving && !story.busy && person.dir !== dir) person.dir = dir;
      },
    });
    line.data = { person, dir };
    stage(line);
  }
}
