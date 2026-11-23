/*
 * Camera.js
 * Job: decide which rectangle of the map is on screen. It follows a point smoothly, never shows
 * beyond the map edge, and centres a map that is smaller than the view.
 *
 * Public API:
 *   x, y                  top-left of the view in map pixels (whole numbers)
 *   width, height         the view size in logical pixels
 *   resize(width, height)
 *   setBounds(mapWidth, mapHeight)   map size in pixels
 *   follow(x, y, dt)      move toward centring that point
 *   snap(x, y)            centre on that point at once (after a map change)
 *   sees(left, top, right, bottom)   true if that map rectangle touches the view
 */

const FOLLOW_SPEED = 12;

export class Camera {
  x = 0;
  y = 0;
  width = 0;
  height = 0;

  #mapWidth = 0;
  #mapHeight = 0;
  #exactX = 0;
  #exactY = 0;

  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  setBounds(mapWidth, mapHeight) {
    this.#mapWidth = mapWidth;
    this.#mapHeight = mapHeight;
  }

  follow(x, y, dt) {
    const k = 1 - Math.exp(-dt * FOLLOW_SPEED);
    this.#exactX += (this.#targetX(x) - this.#exactX) * k;
    this.#exactY += (this.#targetY(y) - this.#exactY) * k;
    this.#round();
  }

  snap(x, y) {
    this.#exactX = this.#targetX(x);
    this.#exactY = this.#targetY(y);
    this.#round();
  }

  sees(left, top, right, bottom) {
    return right > this.x && left < this.x + this.width && bottom > this.y && top < this.y + this.height;
  }

  #targetX(x) {
    return clampAxis(x, this.width, this.#mapWidth);
  }

  #targetY(y) {
    return clampAxis(y, this.height, this.#mapHeight);
  }

  #round() {
    this.x = Math.round(this.#exactX);
    this.y = Math.round(this.#exactY);
  }
}

function clampAxis(center, view, map) {
  if (map <= view) return -(view - map) / 2;
  return Math.max(0, Math.min(map - view, center - view / 2));
}
