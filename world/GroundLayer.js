/*
 * GroundLayer.js
 * Job: the ground of a map as a few large pictures instead of hundreds of tile draws. The map is
 * cut into chunks; a chunk holds its tiles and the decoration that lies flat on them (flower
 * patches, lily pads, doormats, things hung on walls).
 *
 *   - A chunk is painted the first time the camera sees it.
 *   - Fixed ground (roads, floors, walls) is never painted again.
 *   - Ground that sways tile by tile (grass, flowers, a window's sky) is painted again on a rota,
 *     five times a second, each chunk on its own turn so the work is spread over the frames.
 *   - Ground that flows across tile borders (water) is left out of the chunk as a hole and drawn
 *     under it every frame, because sampling it chunk by chunk would tear it at the seams.
 *
 * Public API:
 *   new GroundLayer(map, art, assets)
 *   draw(ctx, camera, env)   bring the visible chunks up to date and copy them to the screen
 */

import { TILE, RENDER_SCALE } from '../core/units.js';

const CHUNK_TILES = 8;
const CHUNK_PIXELS = CHUNK_TILES * TILE;
/* a swaying chunk is repainted every 6th frame: 5 times per second at 30 frames per second */
const REPAINT_EVERY = 6;

export class GroundLayer {
  #map;
  #art;
  #assets;
  #columns;
  #rows;
  #chunks = [];
  #frame = 0;
  #tx = 0;
  #ty = 0;
  #neighbour = (dx, dy) => this.#map.tileAt(this.#tx + dx, this.#ty + dy);

  constructor(map, art, assets) {
    this.#map = map;
    this.#art = art;
    this.#assets = assets;
    this.#columns = Math.ceil(map.width / CHUNK_TILES);
    this.#rows = Math.ceil(map.height / CHUNK_TILES);
    for (let row = 0; row < this.#rows; row++) {
      for (let column = 0; column < this.#columns; column++) this.#chunks.push(this.#newChunk(column, row));
    }
    this.#placeDecor();
    for (const chunk of this.#chunks) this.#study(chunk);
  }

  draw(ctx, camera, env) {
    this.#frame++;
    const first = Math.max(0, Math.floor(camera.x / CHUNK_PIXELS));
    const last = Math.min(this.#columns - 1, Math.floor((camera.x + camera.width - 1) / CHUNK_PIXELS));
    const top = Math.max(0, Math.floor(camera.y / CHUNK_PIXELS));
    const bottom = Math.min(this.#rows - 1, Math.floor((camera.y + camera.height - 1) / CHUNK_PIXELS));
    for (let row = top; row <= bottom; row++) {
      for (let column = first; column <= last; column++) {
        const chunk = this.#chunks[row * this.#columns + column];
        const sheet = this.#assets.sheet(chunk.key, chunk.width, chunk.height, chunk.flowing.length === 0);
        const due = chunk.sways && (this.#frame + chunk.turn) % REPAINT_EVERY === 0;
        if (sheet.blank || due) this.#paint(chunk, sheet, env);
        this.#drawFlowing(ctx, chunk, env);
        ctx.drawImage(sheet.canvas, chunk.x, chunk.y, chunk.width, chunk.height);
      }
    }
  }

  #newChunk(column, row) {
    const tx = column * CHUNK_TILES;
    const ty = row * CHUNK_TILES;
    const tilesWide = Math.min(CHUNK_TILES, this.#map.width - tx);
    const tilesHigh = Math.min(CHUNK_TILES, this.#map.height - ty);
    return {
      key: `ground:${this.#map.id}:${column}:${row}`,
      tx, ty, tilesWide, tilesHigh,
      x: tx * TILE, y: ty * TILE, width: tilesWide * TILE, height: tilesHigh * TILE,
      /* neighbours take different turns, so the repainting is spread evenly over the frames */
      turn: (column + row * 3) % REPAINT_EVERY,
      /* the row below is painted too when tiles reach above their square: its blades hang into this chunk */
      lastRow: Math.min(this.#map.height, ty + tilesHigh + (this.#art.tileOverhang(this.#map.indoor) > 0 ? 1 : 0)) - 1,
      decor: [],
      flowing: [],
      sways: false,
    };
  }

  /* each flat decoration goes to every chunk its art touches, in map order */
  #placeDecor() {
    for (const prop of this.#map.props) {
      const info = this.#art.propInfo(prop.type);
      if (!info || !info.decor) continue;
      const box = this.#art.propBounds(prop.type);
      const x = prop.x * TILE;
      const y = prop.y * TILE;
      const first = Math.max(0, Math.floor((x + box.left) / CHUNK_PIXELS));
      const last = Math.min(this.#columns - 1, Math.floor((x + box.right) / CHUNK_PIXELS));
      const top = Math.max(0, Math.floor((y + box.top) / CHUNK_PIXELS));
      const bottom = Math.min(this.#rows - 1, Math.floor((y + box.bottom) / CHUNK_PIXELS));
      for (let row = top; row <= bottom; row++) {
        for (let column = first; column <= last; column++) this.#chunks[row * this.#columns + column].decor.push(prop);
      }
    }
  }

  /* find the chunk's flowing tiles and whether anything baked into it sways */
  #study(chunk) {
    const { indoor } = this.#map;
    chunk.sways = chunk.decor.some((prop) => this.#art.propAnimates(prop.type));
    for (let ty = chunk.ty; ty <= chunk.lastRow; ty++) {
      for (let tx = chunk.tx; tx < chunk.tx + chunk.tilesWide; tx++) {
        const tile = this.#map.tileAt(tx, ty);
        const own = ty < chunk.ty + chunk.tilesHigh;
        if (this.#art.tileFlows(indoor, tile)) {
          if (own) chunk.flowing.push(tx, ty);
        } else if (this.#art.tileAnimates(indoor, tile)) {
          chunk.sways = true;
        }
      }
    }
  }

  #paint(chunk, sheet, env) {
    sheet.blank = false;
    const g = sheet.ctx;
    const { indoor } = this.#map;
    g.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, -chunk.x * RENDER_SCALE, -chunk.y * RENDER_SCALE);
    try {
      for (let ty = chunk.ty; ty <= chunk.lastRow; ty++) {
        for (let tx = chunk.tx; tx < chunk.tx + chunk.tilesWide; tx++) {
          const tile = this.#map.tileAt(tx, ty);
          if (this.#art.tileFlows(indoor, tile)) g.clearRect(tx * TILE, ty * TILE, TILE, TILE);
          else this.#drawTile(g, tile, tx, ty, env);
        }
      }
      for (const prop of chunk.decor) this.#art.drawProp(g, prop.type, prop.x * TILE, prop.y * TILE, env);
    } catch (error) {
      console.warn(`GroundLayer: could not paint ${chunk.key}`, error);
    }
  }

  #drawFlowing(ctx, chunk, env) {
    const flowing = chunk.flowing;
    for (let i = 0; i < flowing.length; i += 2) {
      const tx = flowing[i];
      const ty = flowing[i + 1];
      this.#drawTile(ctx, this.#map.tileAt(tx, ty), tx, ty, env);
    }
  }

  #drawTile(ctx, tile, tx, ty, env) {
    this.#tx = tx;
    this.#ty = ty;
    this.#art.drawTile(ctx, this.#map.indoor, tile, tx * TILE, ty * TILE, tx, ty, env, this.#neighbour);
  }
}
