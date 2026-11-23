/*
 * styles.js  (Hontori: capsules)
 * Job: the stylesheet of the capsule reveal card and the album's preview, in the shapes and colours of the
 * game's cards (the theme's variables).
 *
 * Public API:
 *   installCapsuleStyles()   add the stylesheet to the page (once)
 *
 * Classes: .cp-dim (the dimmed screen), .cp-card (+ rare, done), .cp-cap (the capsule: .shut, .open), .cp-prize,
 *   .cp-glow, .cp-kick, .cp-name, .cp-desc, .cp-tap; .cp-prev (the album's live preview).
 *   The reveal runs once in 1.6 s: the capsule drops in and wobbles, opens, the prize rises, its name shows.
 */

const CSS = `
.cp-dim{background:var(--shade);display:flex;align-items:center;justify-content:center;cursor:pointer;
  padding:calc(var(--sa-t) + 8px) 8px calc(var(--sa-b) + 8px)}
.cp-card{position:relative;width:min(84%,320px);padding:18px 16px 16px;border-radius:20px;text-align:center;color:var(--text);
  background:linear-gradient(180deg,var(--panel-top),var(--panel-bottom));border:2px solid var(--panel-edge);
  box-shadow:0 10px 30px rgba(0,0,0,.5);animation:cpIn .25s ease-out both}
.cp-card.rare{border-color:#ffd24a;box-shadow:0 0 24px rgba(255,210,74,.45),0 10px 30px rgba(0,0,0,.5)}
.cp-stage{position:relative;height:132px;margin:0 auto 4px;width:160px}
.cp-cap{position:absolute;left:50%;top:22px;width:100px;height:100px;margin-left:-50px;image-rendering:pixelated}
.cp-cap.shut{animation:cpDrop .45s ease-out both,cpWobble .35s .45s ease-in-out 1,cpGone .1s .8s linear forwards}
.cp-cap.open{opacity:0;animation:cpShow .1s .8s linear forwards,cpFade .35s 1.05s ease-in forwards}
.cp-glow{position:absolute;left:50%;top:28px;width:96px;height:96px;margin-left:-48px;border-radius:50%;opacity:0;
  background:radial-gradient(circle,color-mix(in srgb,var(--cc,#ffd98a) 55%,transparent),transparent 70%);animation:cpShow .3s .85s ease-out forwards}
.cp-prize{position:absolute;left:50%;top:34px;width:80px;height:80px;margin-left:-40px;image-rendering:pixelated;opacity:0;
  animation:cpRise .45s .85s ease-out forwards}
.cp-kick{font-size:13px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:var(--accent);opacity:0;animation:cpShow .25s 1.1s forwards}
.cp-card.rare .cp-kick{color:#ffd24a}
.cp-name{margin:4px 0 2px;font-size:22px;font-weight:900;opacity:0;animation:cpShow .25s 1.15s forwards}
.cp-desc{margin:4px 0 10px;font-size:14px;font-weight:700;line-height:1.35;opacity:0;animation:cpShow .25s 1.25s forwards}
.cp-tap{font-size:12px;font-weight:800;opacity:0;animation:cpShow .3s 1.6s forwards}
.cp-card.done *{animation-delay:0s!important;animation-duration:0s!important}
@keyframes cpIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:none}}
@keyframes cpDrop{from{transform:translateY(-40px);opacity:0}to{transform:none;opacity:1}}
@keyframes cpWobble{25%{transform:rotate(-9deg)}75%{transform:rotate(9deg)}}
@keyframes cpGone{to{opacity:0}}
@keyframes cpShow{to{opacity:1}}
@keyframes cpFade{to{opacity:0}}
@keyframes cpRise{from{opacity:0;transform:translateY(18px) scale(.6)}to{opacity:1;transform:none}}
.cp-prev{width:96px;height:96px;border-radius:14px;background:rgba(0,0,0,.25);flex:none;image-rendering:pixelated}
.cp-series{margin:14px 0 8px;font-size:15px;font-weight:900;display:flex;justify-content:space-between;gap:8px}
.cp-series small{font-size:12px;opacity:.7}
.ui-card .cp-ic{width:48px;height:48px;image-rendering:pixelated;margin:6px 0}
`;

let installed = false;

export function installCapsuleStyles() {
  if (installed) return;
  installed = true;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
}
