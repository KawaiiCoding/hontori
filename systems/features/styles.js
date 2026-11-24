/*
 * styles.js  (engine: features)
 * Job: the stylesheet of the feature screens: the picture story, the drawing prompt, the name entry, the
 * offer card and the full-screen moment of a growth. Shapes and sizes only; every colour comes from the
 * theme variables of the interface layer (ui/styles.js), so another game restyles them without edits.
 *
 * Public API:
 *   installFeatureStyles()   add the stylesheet once
 *
 * Classes:
 *   .ft-screen (.on)               a full-screen layer that fades in
 *   .ft-canvas                     a canvas filling its parent
 *   .ft-story .frame .line .dots .tap .skip     the picture story
 *   .ft-draw .tip .sub             the drawing prompt over the dimmed world
 *   .ft-card                       a centred card (name entry, offer); .ft-card .pic .in .err .row .list
 *   .ft-carry .count .grid .pick (.on .lock) .tick   the choose-who-comes card (CarryChoice.js)
 *   .ft-board .rows .row (.in .out .next .you)        the board between rounds (Standings.js)
 *   .ft-moment .msg .row           a full-screen moment with a message at the bottom (a growth)
 *   .ft-side                       a round button under the HUD column (riding)
 *   .ft-closewrap .ft-close .ft-closex   a close-up of a board; .ft-close.notes .cork .note (.big, blue, green, pink)
 */

const CSS = `
.ft-screen{position:absolute;inset:0;pointer-events:auto;opacity:0;transition:opacity .3s;touch-action:none;
  font-family:var(--font);color:var(--title-text)}
.ft-screen.on{opacity:1}
.ft-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;image-rendering:pixelated;image-rendering:crisp-edges;touch-action:none}

.ft-story{background:var(--title-edge);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;transition:opacity .6s}
.ft-story .frame{position:relative;width:min(92%,460px);aspect-ratio:8/5;border-radius:14px;overflow:hidden;
  border:3px solid color-mix(in srgb,var(--title-glow) 70%,#ffffff 10%);box-shadow:0 0 0 2px var(--title-mid),0 10px 30px #000}
.ft-story .frame canvas{position:absolute;inset:0;width:100%;height:100%}
.ft-story .line{width:min(88%,430px);min-height:74px;text-align:center;font-size:clamp(17px,4.6cqmin,21px);font-weight:800;
  line-height:1.35;transition:opacity .35s}
.ft-story .line.gold{color:var(--accent)}
.ft-story .dots{display:flex;gap:7px}
.ft-story .dots i{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.2)}
.ft-story .dots i.on{background:var(--accent)}
.ft-story .skip{position:absolute;right:calc(var(--sa-r) + 14px);top:calc(var(--sa-t) + 14px);min-width:64px;min-height:44px;padding:7px 14px;
  border-radius:12px;border:2px solid rgba(255,255,255,.22);background:var(--slot-bg);color:#fff;font:800 14px var(--font);cursor:pointer}
.ft-story .tap{font-size:13px;font-weight:700;opacity:.55;animation:ft-pulse 1.6s ease-in-out infinite}
@keyframes ft-pulse{0%,100%{opacity:.3}50%{opacity:.7}}

.ft-draw{background:radial-gradient(ellipse at 50% 52%,color-mix(in srgb,var(--title-glow) 35%,transparent),color-mix(in srgb,var(--title-edge) 62%,transparent))}
.ft-draw .tip{position:absolute;left:12px;right:12px;top:calc(var(--sa-t) + 24%);text-align:center;font-weight:900;font-size:clamp(18px,5cqmin,26px);
  text-shadow:0 0 12px color-mix(in srgb,var(--accent) 60%,transparent),0 2px 0 rgba(0,0,0,.6);pointer-events:none}
.ft-draw .sub{margin-top:8px;font-size:clamp(14px,3.8cqmin,18px);color:var(--hud-clock);text-shadow:0 2px 0 rgba(0,0,0,.6)}

.ft-dim{background:var(--shade);display:flex;align-items:center;justify-content:center;padding:calc(var(--sa-t) + 8px) 8px calc(var(--sa-b) + 8px)}
.ft-card{width:min(90%,380px);max-height:92%;overflow:auto;padding:18px 16px 16px;border-radius:20px;text-align:center;color:var(--text);
  background:linear-gradient(180deg,var(--panel-top),var(--panel-bottom));border:2px solid var(--accent);box-shadow:0 12px 40px rgba(0,0,0,.6)}
.ft-card h2{margin:4px 0 8px;font-size:21px;font-weight:900;color:var(--accent)}
.ft-card h3{margin:0 0 10px;font-size:19px;font-weight:900}
.ft-card p{margin:8px 0;font-size:14px;font-weight:700;line-height:1.4;opacity:.92}
.ft-card .pic{display:flex;justify-content:center;gap:6px;margin:2px 0 8px}
.ft-card .pic canvas{width:min(54px,17%);aspect-ratio:1;height:auto;image-rendering:pixelated}
.ft-card .pic canvas.big{width:88px;height:88px;border-radius:16px;background:color-mix(in srgb,var(--accent) 12%,transparent)}
.ft-card .list{text-align:left;margin:10px 0;padding:10px 12px;border-radius:12px;background:rgba(0,0,0,.25);font-size:13px;font-weight:700;line-height:1.5}
.ft-card .in{width:100%;margin:8px 0 4px;padding:12px;border-radius:14px;border:2px solid rgba(255,255,255,.2);background:var(--title-mid);
  color:#fff;font:900 20px var(--font);text-align:center;letter-spacing:1px;outline:none;-webkit-user-select:text;user-select:text}
.ft-card .in:focus{border-color:var(--accent)}
.ft-card .err{min-height:18px;font-size:13px;font-weight:800;color:var(--warn-text)}
.ft-card .row{display:flex;gap:8px;margin-top:12px}
.ft-card .row .ui-btn{flex:1;justify-content:center}
.ft-card .ui-btn.wide{margin-top:8px}
.ft-card .ui-btn.off{opacity:.45}

.ft-carry{width:min(94%,440px)}
.ft-carry .count{margin:2px 0 8px;font-size:15px;font-weight:900;color:var(--accent)}
.ft-carry .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:8px}
.ft-carry .pick{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 4px 6px;min-height:44px;
  border-radius:14px;border:2px solid rgba(255,255,255,.14);background:rgba(0,0,0,.22);color:var(--text);font:inherit;cursor:pointer}
.ft-carry .pick canvas{width:52px;height:52px;image-rendering:pixelated;opacity:.6}
.ft-carry .pick b{font-size:13px;font-weight:900;line-height:1.15}
.ft-carry .pick small{font-size:11px;font-weight:700;opacity:.8}
.ft-carry .pick .tick{position:absolute;right:6px;top:6px;width:18px;height:18px;border-radius:50%;border:2px solid rgba(255,255,255,.3)}
.ft-carry .pick.on{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 16%,transparent)}
.ft-carry .pick.on canvas{opacity:1}
.ft-carry .pick.on .tick{background:var(--accent);border-color:var(--accent)}
.ft-carry .pick.lock{cursor:default}

.ft-board{width:min(94%,420px)}
.ft-board .rows{display:flex;flex-direction:column;gap:6px;margin:10px 0 4px;text-align:left}
.ft-board .row{display:grid;grid-template-columns:40px 1fr auto;align-items:center;gap:10px;padding:6px 10px;border-radius:12px;
  background:rgba(0,0,0,.22);border:2px solid rgba(255,255,255,.1)}
.ft-board .row canvas{width:40px;height:40px;image-rendering:pixelated}
.ft-board .row b{font-size:15px;font-weight:900}
.ft-board .row small{font-size:12px;font-weight:800;opacity:.85}
.ft-board .row.out{opacity:.45}
.ft-board .row.out b{text-decoration:line-through}
.ft-board .row.next{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 14%,transparent)}
.ft-board .row.you{border-color:color-mix(in srgb,var(--accent) 60%,#ffffff 20%)}

.ft-moment{background:var(--title-edge)}
.ft-moment .msg{position:absolute;left:16px;right:16px;bottom:calc(var(--sa-b) + 28px);text-align:center;font-size:clamp(16px,4.4cqmin,22px);
  font-weight:900;line-height:1.3;padding:12px;border-radius:16px;background:color-mix(in srgb,var(--panel-bottom) 86%,transparent);
  border:2px solid var(--accent);color:var(--text)}
.ft-moment .row{position:absolute;left:16px;right:16px;bottom:calc(var(--sa-b) + 128px);display:flex;gap:10px;justify-content:center}
.ft-moment .row .ui-btn{flex:0 1 180px;justify-content:center}

.ft-side{position:absolute;right:calc(var(--sa-r) + 10px);bottom:calc(var(--sa-b) + 200px);pointer-events:auto}
.ui-top .ft-side{position:static}
.ft-side.on{border-color:var(--accent);box-shadow:0 0 12px color-mix(in srgb,var(--accent) 60%,transparent)}

.ft-closewrap{position:absolute;left:50%;top:50%;width:min(94%,560px);transform:translate(-50%,-50%) scale(.6);
  transition:transform .35s cubic-bezier(.2,1.3,.4,1)}
.ft-screen.on .ft-closewrap{transform:translate(-50%,-50%) scale(1)}
.ft-closex{position:absolute;right:4px;top:-14px;z-index:4}
.ft-close.notes{border-radius:10px;padding:14px;background:#6a4428;box-shadow:inset 0 0 0 3px #43291a,0 14px 40px rgba(0,0,0,.6)}
.ft-close.notes .cork{position:relative;border-radius:4px;aspect-ratio:4/5;background:#c08850;
  background-image:radial-gradient(rgba(90,50,20,.35) 1px,transparent 1.5px),radial-gradient(rgba(255,230,180,.25) 1px,transparent 1.5px);
  background-size:9px 9px,13px 13px;background-position:0 0,4px 6px}
.ft-close .note{position:absolute;width:40%;padding:12px 12px 10px;background:#fff8e6;color:#3a2a1a;font:700 clamp(12px,3.3cqmin,15px)/1.3 var(--font);
  box-shadow:0 4px 10px rgba(0,0,0,.3);cursor:pointer;transition:transform .2s}
.ft-close .note b{display:block;font-weight:900;font-size:1.08em;margin-bottom:4px;color:#7a2a14}
.ft-close .note:before{content:"";position:absolute;left:50%;top:-6px;width:12px;height:12px;margin-left:-6px;border-radius:50%;
  background:radial-gradient(circle at 35% 30%,#ff9a8a,#c0392b);box-shadow:0 2px 2px rgba(0,0,0,.35)}
.ft-close .note.big{transform:scale(1.25) rotate(0deg)!important;z-index:3}
.ft-close .note.blue{background:#e8f2ff}
.ft-close .note.green{background:#eaf7df}
.ft-close .note.pink{background:#ffeaf0}
`;

let installed = false;

export function installFeatureStyles() {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
}
