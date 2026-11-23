/*
 * TouchPad.js
 * Job: the on-screen stick and the A and B buttons. It only feeds the Input; it knows no game rules.
 * A floating stick under the left thumb, A (use) and B (run) on the right.
 *
 * Public API:
 *   new TouchPad(root, input)   builds the controls inside root and follows input.mode
 *                               (shown in 'stick' mode, hidden in 'tap' mode)
 *   setEnabled(on)              hide the controls while the scene on top is not played with them
 */

const CSS = `
.pad{position:absolute;inset:0;pointer-events:none;container-type:size;z-index:10;overflow:hidden;color:#fff;
  font-family:"Nunito","M PLUS Rounded 1c",system-ui,-apple-system,"Segoe UI",sans-serif;
  --sa-b:env(safe-area-inset-bottom,0px);--sa-r:env(safe-area-inset-right,0px);--u:min(1vw,1vh);--u:1cqmin}
.pad[hidden]{display:none}
.pad-zone{position:absolute;left:0;bottom:0;width:50%;top:22%;pointer-events:auto;touch-action:none;
  --js:clamp(118px,calc(var(--u)*32),164px)}
.pad-joy{position:absolute;left:0;top:0;width:var(--js);height:var(--js);
  margin:calc(var(--js) / -2) 0 0 calc(var(--js) / -2);border-radius:50%;
  background:radial-gradient(circle,rgba(255,255,255,.04) 30%,rgba(255,255,255,.12) 70%);
  border:2px solid rgba(255,255,255,.26);box-shadow:0 0 0 1px rgba(0,0,0,.25),inset 0 0 18px rgba(0,0,0,.25);
  opacity:.45;transition:opacity .15s;pointer-events:none}
.pad-joy.act{opacity:.9;transition:none}
.pad-knob{position:absolute;left:50%;top:50%;width:44%;height:44%;margin:-22% 0 0 -22%;border-radius:50%;
  background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.85),rgba(190,200,230,.6));
  border:2px solid rgba(255,255,255,.7);box-shadow:0 4px 10px rgba(0,0,0,.4)}
.pad-btn{position:absolute;border-radius:50%;pointer-events:auto;touch-action:none;font-weight:900;display:flex;
  align-items:center;justify-content:center;text-shadow:0 2px 0 rgba(0,0,0,.4);opacity:.85;
  border:3px solid rgba(255,255,255,.5)}
.pad-a{right:calc(var(--sa-r) + clamp(16px,calc(var(--u)*5),40px));
  bottom:calc(var(--sa-b) + clamp(54px,calc(var(--u)*14),90px));
  width:clamp(70px,calc(var(--u)*19),92px);height:clamp(70px,calc(var(--u)*19),92px);
  font-size:clamp(26px,calc(var(--u)*7),34px);
  background:radial-gradient(circle at 35% 30%,rgba(255,154,122,.92),rgba(217,69,43,.88));
  box-shadow:0 5px 0 rgba(122,29,14,.85),0 8px 16px rgba(0,0,0,.35)}
.pad-b{right:calc(var(--sa-r) + clamp(96px,calc(var(--u)*26),136px));
  bottom:calc(var(--sa-b) + clamp(16px,calc(var(--u)*4),34px));
  width:clamp(56px,calc(var(--u)*15),74px);height:clamp(56px,calc(var(--u)*15),74px);
  font-size:clamp(22px,calc(var(--u)*5.6),28px);
  background:radial-gradient(circle at 35% 30%,rgba(140,190,255,.9),rgba(52,96,200,.86));
  box-shadow:0 5px 0 rgba(20,40,110,.85),0 8px 16px rgba(0,0,0,.35)}
.pad-btn.on{transform:translateY(4px);box-shadow:0 1px 0 rgba(0,0,0,.5),0 3px 8px rgba(0,0,0,.4)}
`;

/* how far the knob travels, as a share of the stick radius, and the dead zone inside that */
const KNOB_REACH = 0.62;
const DEAD_ZONE = 0.28;

function element(className, parent, text) {
  const node = document.createElement('div');
  node.className = className;
  if (text) node.textContent = text;
  parent.appendChild(node);
  return node;
}

export class TouchPad {
  #input;
  #pad;
  #zone;
  #joy;
  #knob;
  #pointer = null;
  #enabled = false;
  #centerX = 0;
  #centerY = 0;

  constructor(root, input) {
    this.#input = input;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    this.#pad = element('pad', root);
    this.#zone = element('pad-zone', this.#pad);
    this.#joy = element('pad-joy', this.#zone);
    this.#knob = element('pad-knob', this.#joy);
    this.#bindStick();
    this.#bindButton(element('pad-btn pad-a', this.#pad, 'A'), 'action');
    this.#bindButton(element('pad-btn pad-b', this.#pad, 'B'), 'run');

    input.onModeChange = () => this.#show();
    this.#show();
    window.addEventListener('resize', () => this.#rest());
  }

  setEnabled(on) {
    this.#enabled = on;
    this.#show();
  }

  #show() {
    this.#pad.hidden = !this.#enabled || this.#input.mode !== 'stick';
    this.#release();
  }

  #radius() {
    return this.#joy.offsetWidth / 2 || 70;
  }

  #rest() {
    if (this.#pointer !== null) return;
    const radius = this.#radius();
    this.#joy.style.left = `${radius + 22}px`;
    this.#joy.style.top = `${this.#zone.clientHeight - radius - 30}px`;
    this.#knob.style.transform = '';
    this.#joy.classList.remove('act');
  }

  #release() {
    this.#pointer = null;
    this.#input.setStick(0, 0);
    this.#rest();
  }

  #bindStick() {
    const zone = this.#zone;
    zone.addEventListener('pointerdown', (event) => {
      if (this.#pointer !== null) return;
      event.preventDefault();
      this.#pointer = event.pointerId;
      zone.setPointerCapture(event.pointerId);
      const box = zone.getBoundingClientRect();
      const radius = this.#radius();
      this.#centerX = Math.max(radius, Math.min(box.width - radius, event.clientX - box.left));
      this.#centerY = Math.max(radius, Math.min(box.height - radius, event.clientY - box.top));
      this.#joy.style.left = `${this.#centerX}px`;
      this.#joy.style.top = `${this.#centerY}px`;
      this.#joy.classList.add('act');
      this.#move(event, box);
    });
    zone.addEventListener('pointermove', (event) => {
      if (event.pointerId !== this.#pointer) return;
      event.preventDefault();
      this.#move(event, zone.getBoundingClientRect());
    });
    const end = (event) => {
      if (event.pointerId === this.#pointer) this.#release();
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
    zone.addEventListener('lostpointercapture', end);
  }

  #move(event, box) {
    const reach = this.#radius() * KNOB_REACH;
    let x = event.clientX - box.left - this.#centerX;
    let y = event.clientY - box.top - this.#centerY;
    const distance = Math.hypot(x, y);
    if (distance > reach) {
      x = x / distance * reach;
      y = y / distance * reach;
    }
    this.#knob.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
    if (Math.min(distance, reach) <= reach * DEAD_ZONE) this.#input.setStick(0, 0);
    else if (Math.abs(x) > Math.abs(y)) this.#input.setStick(Math.sign(x), 0);
    else this.#input.setStick(0, Math.sign(y));
  }

  #bindButton(button, name) {
    let pointer = null;
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      if (pointer !== null) return;
      pointer = event.pointerId;
      button.setPointerCapture(event.pointerId);
      button.classList.add('on');
      this.#input.setButton(name, true);
    });
    const up = (event) => {
      if (event.pointerId !== pointer) return;
      pointer = null;
      button.classList.remove('on');
      this.#input.setButton(name, false);
    };
    button.addEventListener('pointerup', up);
    button.addEventListener('pointercancel', up);
    button.addEventListener('lostpointercapture', up);
  }
}
