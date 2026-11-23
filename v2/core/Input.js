/*
 * Input.js
 * Job: turn the keyboard, the touch pad and taps on the game picture into one normalized state.
 * Scenes read this state; they never listen to DOM events themselves.
 *
 * Public API:
 *   new Input(target, mode)   target: the element taps are read from; mode: 'stick' or 'tap'
 *   mode                      'stick' (keys, stick and buttons) or 'tap' (tap where to go)
 *   setMode(mode)
 *   dx, dy                    held direction, each -1, 0 or 1 (keys and stick combined)
 *   run                       true while a run key or the run button is held
 *   takeAction()              true once per press of the action key or button
 *   takeTap()                 { x, y, double } in client pixels once per tap in tap mode, else null
 *   clear()                   forget everything held or pending (a scene was paused, the page was hidden)
 *   setStick(dx, dy), setButton(name, down)   fed by the TouchPad; name is 'action' or 'run'
 *   onModeChange              optional callback(mode)
 */

const ACTION_KEYS = new Set([' ', 'enter', 'z']);
const SCROLL_KEYS = new Set([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);
/* a press that travels further than this many pixels is a drag, not a tap */
const TAP_SLOP = 24;
const DOUBLE_TAP_MS = 320;
const DOUBLE_TAP_SLOP = 60;

export class Input {
  mode = 'stick';
  onModeChange = null;

  #keys = new Set();
  #stickX = 0;
  #stickY = 0;
  #runButton = false;
  #action = false;
  #tap = null;
  #down = null;
  #lastTap = null;

  constructor(target, mode) {
    if (mode === 'tap') this.mode = 'tap';
    window.addEventListener('keydown', (event) => this.#onKey(event, true));
    window.addEventListener('keyup', (event) => this.#onKey(event, false));
    window.addEventListener('blur', () => this.clear());
    target.addEventListener('pointerdown', (event) => this.#onPointerDown(event));
    target.addEventListener('pointerup', (event) => this.#onPointerUp(event));
  }

  get dx() {
    const keys = (this.#held('arrowright', 'd') ? 1 : 0) - (this.#held('arrowleft', 'a') ? 1 : 0);
    return Math.sign(keys + this.#stickX);
  }

  get dy() {
    const keys = (this.#held('arrowdown', 's') ? 1 : 0) - (this.#held('arrowup', 'w') ? 1 : 0);
    return Math.sign(keys + this.#stickY);
  }

  get run() {
    return this.#runButton || this.#keys.has('shift');
  }

  setMode(mode) {
    this.mode = mode === 'tap' ? 'tap' : 'stick';
    this.clear();
    if (this.onModeChange) this.onModeChange(this.mode);
  }

  takeAction() {
    const pressed = this.#action;
    this.#action = false;
    return pressed;
  }

  takeTap() {
    const tap = this.#tap;
    this.#tap = null;
    return tap;
  }

  clear() {
    this.#keys.clear();
    this.#stickX = 0;
    this.#stickY = 0;
    this.#runButton = false;
    this.#action = false;
    this.#tap = null;
  }

  setStick(dx, dy) {
    this.#stickX = dx;
    this.#stickY = dy;
  }

  setButton(name, down) {
    if (name === 'run') this.#runButton = down;
    else if (name === 'action' && down) this.#action = true;
  }

  #held(a, b) {
    return this.#keys.has(a) || this.#keys.has(b);
  }

  #onKey(event, down) {
    const key = event.key.toLowerCase();
    if (SCROLL_KEYS.has(key)) event.preventDefault();
    if (!down) {
      this.#keys.delete(key);
      return;
    }
    if (ACTION_KEYS.has(key) && !this.#keys.has(key)) this.#action = true;
    this.#keys.add(key);
  }

  #onPointerDown(event) {
    this.#down = { x: event.clientX, y: event.clientY };
  }

  #onPointerUp(event) {
    const down = this.#down;
    this.#down = null;
    if (this.mode !== 'tap' || !down) return;
    const x = event.clientX;
    const y = event.clientY;
    if (Math.abs(x - down.x) + Math.abs(y - down.y) > TAP_SLOP) return;
    const now = performance.now();
    const last = this.#lastTap;
    const double = !!last && now - last.at < DOUBLE_TAP_MS
      && Math.abs(x - last.x) + Math.abs(y - last.y) < DOUBLE_TAP_SLOP;
    this.#lastTap = double ? null : { x, y, at: now };
    this.#tap = { x, y, double };
  }
}
