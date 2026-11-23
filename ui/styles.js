/*
 * styles.js
 * Job: the one visual language of the interface, as a stylesheet. The shapes, sizes and
 * shadows are the kit's; every colour and the font come from the game's theme, so another
 * game restyles the kit without editing it. Sizes follow the smaller side of the game frame
 * (--u) and respect the phone's safe areas.
 *
 * Public API:
 *   installStyles(theme)   add the stylesheet and the theme's font to the page (once)
 *        theme.font: { family, url }; theme.colors: { name: css colour } - each becomes the
 *        variable --name. The names the kit uses are listed in INTERFACES.md.
 *
 * Classes (used by the kit; a screen should not need to write CSS of its own):
 *   .ui                      the layer over the game picture
 *   .ui-hud                  the top bar: time icon, place, clock, weather
 *   .ui-top, .ui-round       the column of round buttons at the top right
 *   .ui-shade, .ui-sheet     the dimmed world and the panel that slides up from the bottom
 *   .ui-panel, .ui-head      a panel and its header (icon, title, close button)
 *   .ui-btn  (+ alt, warn, gold, sm, wide)   a button;  .ui-x  the close button
 *   .ui-acts, .ui-note       a row of buttons; a small note under them
 *   .ui-toast                a short message under the top bar
 *   .ui-title ...            the title screen
 *   .ui-dlg, .ui-ch          the dialog box and a list of choices (DialogBox.js, ChoiceList.js)
 *   .ui-qpill, .ui-qpop, .ui-quest, .ui-qsec   the quest pill, its card and the quest log
 *   .ui-tabs, .ui-row, .ui-slots, .ui-pouch, .ui-purse, .ui-pick   the bag and the shop (.ui-pick: the selected good)
 *   .ui-amap                 the area map
 *   .hp-strip, .hp-slot      the party strip at the left edge
 *   .ui-bar, .ui-tag, .ui-elb, .ui-pips, .ui-orbs, .ui-mem, .ui-pick, .ui-cards, .ui-card, .ui-det, .ui-wsec,
 *   .ui-picks, .ui-filter, .ui-dnm   companions and abilities (RosterKit.js)
 *   .ui-seg, .ui-wmap        segment tabs and the world map (PanelExtras.js, WorldMap.js)
 *   .ui-guide                the first-touch guide card (HelperCard.js)
 */

const CSS = `
.ui{position:absolute;inset:0;pointer-events:none;container-type:size;font-family:var(--font);color:#fff;z-index:20;
  -webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;overflow:hidden;
  --sa-t:env(safe-area-inset-top,0px);--sa-b:env(safe-area-inset-bottom,0px);
  --sa-l:env(safe-area-inset-left,0px);--sa-r:env(safe-area-inset-right,0px);--u:min(1vw,1vh);--u:1cqmin}
.ui *{box-sizing:border-box}
.ui [hidden]{display:none!important}
.ui img{image-rendering:pixelated;image-rendering:crisp-edges;display:block}

.ui-hud{position:absolute;top:calc(var(--sa-t) + clamp(6px,calc(var(--u)*2),16px));
  left:calc(var(--sa-l) + clamp(6px,calc(var(--u)*2),16px));display:flex;align-items:center;
  gap:clamp(5px,calc(var(--u)*1.4),10px);
  padding:clamp(3px,calc(var(--u)*.8),6px) clamp(10px,calc(var(--u)*2.4),16px) clamp(3px,calc(var(--u)*.8),6px) clamp(4px,calc(var(--u)*1),8px);
  border-radius:999px;background:var(--hud-bg);border:2px solid rgba(255,255,255,.18);
  box-shadow:0 3px 12px rgba(0,0,0,.4);font-weight:800;font-size:clamp(13px,calc(var(--u)*3.6),19px);
  letter-spacing:.02em;text-shadow:0 1px 2px #000;white-space:nowrap;
  max-width:calc(100% - var(--sa-l) - var(--sa-r) - 70px)}
.ui-hud img{width:clamp(26px,calc(var(--u)*6.5),34px);height:clamp(26px,calc(var(--u)*6.5),34px);flex:0 0 auto}
.ui-hud .icons{display:flex;gap:2px;align-items:center}
.ui-hud .place{color:var(--hud-place);overflow:hidden;text-overflow:ellipsis;min-width:0}
.ui-hud .time{color:var(--hud-clock);font-variant-numeric:tabular-nums}
.ui-hud .sep{width:2px;height:1.1em;background:rgba(255,255,255,.25);border-radius:2px;flex:0 0 auto}

.ui-top{position:absolute;right:calc(var(--sa-r) + 10px);top:calc(var(--sa-t) + 10px);display:flex;
  flex-direction:column;gap:8px;pointer-events:auto}
.ui-round{width:44px;height:44px;padding:0;border-radius:14px;background:var(--round-bg);
  border:2px solid rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;cursor:pointer;
  box-shadow:0 3px 10px rgba(0,0,0,.35)}
.ui-round:active{transform:translateY(2px)}
.ui-round img{width:28px;height:28px}
.ui-round.off{opacity:.42;filter:grayscale(.85)}

.ui-shade{position:absolute;inset:0;background:var(--shade);opacity:0;transition:opacity .18s;pointer-events:auto}
.ui-shade.on{opacity:1}
.ui-sheet{position:absolute;left:calc(var(--sa-l) + 8px);right:calc(var(--sa-r) + 8px);bottom:calc(var(--sa-b) + 8px);
  max-width:560px;margin:0 auto;max-height:78%;overflow:auto;padding:16px;
  transform:translateY(calc(100% + 60px));transition:transform .22s;pointer-events:auto;
  -webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.ui-sheet.on{transform:none}

.ui-panel{border-radius:20px;background:linear-gradient(180deg,var(--panel-top),var(--panel-bottom));border:2px solid var(--panel-edge);
  box-shadow:0 10px 40px rgba(0,0,0,.6);color:var(--text)}
.ui-head{display:flex;align-items:center;gap:10px;margin:0 0 12px;min-height:44px}
/* the header (and its close button) stays in view while the sheet scrolls */
.ui-sheet .ui-head{position:sticky;top:-16px;z-index:5;margin:-16px -16px 12px;padding:16px 16px 8px;background:var(--panel-top);border-radius:18px 18px 0 0}
.ui-head img{width:28px;height:28px;flex:none}
.ui-head h2{flex:1;min-width:0;margin:0;font-size:20px;font-weight:900;letter-spacing:.2px;line-height:1.15;color:var(--text)}
.ui-head h2 small{display:block;font-size:12px;font-weight:700;opacity:.7;letter-spacing:0}

.ui-btn{display:flex;align-items:center;gap:10px;min-height:48px;padding:8px 14px;border:2px solid rgba(0,0,0,.35);
  border-radius:14px;font:inherit;font-weight:900;font-size:16px;line-height:1.15;text-align:left;cursor:pointer;
  color:var(--btn-text);background:linear-gradient(180deg,var(--btn-top),var(--btn-bottom));
  box-shadow:0 4px 0 var(--btn-depth),0 6px 14px rgba(0,0,0,.3);touch-action:manipulation}
.ui-btn:active{transform:translateY(3px);box-shadow:0 1px 0 var(--btn-depth),0 2px 6px rgba(0,0,0,.3)}
.ui-btn.alt,.ui-btn.warn{color:var(--text);background:linear-gradient(180deg,var(--alt-top),var(--alt-bottom));
  border-color:rgba(255,255,255,.16);box-shadow:0 4px 0 var(--alt-depth),0 6px 14px rgba(0,0,0,.3)}
.ui-btn.alt:active,.ui-btn.warn:active{box-shadow:0 1px 0 var(--alt-depth)}
.ui-btn.warn{color:var(--warn-text)}
.ui-btn.gold{color:var(--gold-text);background:linear-gradient(180deg,var(--gold-top),var(--gold-bottom));box-shadow:0 4px 0 var(--gold-depth),0 6px 14px rgba(0,0,0,.3)}
.ui-btn.gold:active{box-shadow:0 1px 0 var(--gold-depth)}
.ui-btn.sm{min-height:44px;padding:5px 10px;gap:6px;font-size:14px;border-radius:12px}
.ui-btn img{width:28px;height:28px;flex:none}
.ui-btn.sm img{width:22px;height:22px}
.ui-btn .text{display:flex;flex-direction:column;min-width:0}
.ui-btn .text span{overflow:hidden;text-overflow:ellipsis}
.ui-btn small{font-size:12px;font-weight:700;opacity:.75;margin-top:1px}
.ui-btn[disabled]{opacity:.5;cursor:default;transform:none}
.ui-btn.wide{width:100%;justify-content:center}
.ui-btn.wide .text{align-items:center;text-align:center}
.ui-x{flex:none;width:44px;height:44px;padding:0;border-radius:12px;display:flex;align-items:center;justify-content:center;
  cursor:pointer;background:linear-gradient(180deg,var(--alt-top),var(--alt-bottom));border:2px solid rgba(255,255,255,.16);
  box-shadow:0 3px 0 var(--alt-depth);touch-action:manipulation}
.ui-x:active{transform:translateY(2px);box-shadow:0 1px 0 var(--alt-depth)}
.ui-x img{width:22px;height:22px}
.ui-acts{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}
.ui-acts:first-child{margin-top:0}
.ui-acts .ui-btn{flex:1 1 140px}
.ui-note{font-size:13px;font-weight:700;opacity:.7;margin-top:10px;line-height:1.35;white-space:pre-wrap}

.ui-toast{position:absolute;top:calc(var(--sa-t) + clamp(132px,calc(var(--u)*30),150px));width:max-content;left:50%;
  transform:translate(-50%,-16px);padding:10px 20px;border-radius:16px;background:var(--toast-bg);color:var(--toast-text);
  font-weight:900;font-size:clamp(16px,calc(var(--u)*4.2),22px);
  box-shadow:0 6px 18px rgba(0,0,0,.45),0 0 0 3px rgba(0,0,0,.35);opacity:0;transition:opacity .25s,transform .25s;
  max-width:calc(100% - 32px);text-align:center;z-index:5}
.ui-toast.on{opacity:1;transform:translate(-50%,0)}

.ui-title{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;
  padding:calc(var(--sa-t) + 8px) calc(var(--sa-r) + 8px) calc(var(--sa-b) + 8px) calc(var(--sa-l) + 8px);
  background:radial-gradient(ellipse at 50% 30%,var(--title-glow) 0%,var(--title-mid) 55%,var(--title-edge) 100%);color:var(--title-text);
  transition:opacity .6s;overflow:hidden;pointer-events:auto}
.ui-title.out{opacity:0;pointer-events:none}
.ui-title .stars{position:absolute;inset:0}
.ui-title .star{position:absolute;width:2px;height:2px;background:#fff;border-radius:1px;animation:ui-twinkle 2.4s ease-in-out infinite}
@keyframes ui-twinkle{0%,100%{opacity:.2}50%{opacity:1}}
.ui-title .logo{position:relative;font-size:clamp(44px,14cqmin,84px);font-weight:900;letter-spacing:2px;line-height:1;
  background:linear-gradient(180deg,var(--logo-top) 10%,var(--logo-mid) 55%,var(--logo-bottom) 100%);-webkit-background-clip:text;background-clip:text;
  color:transparent;filter:drop-shadow(0 4px 0 var(--logo-depth)) drop-shadow(0 0 18px color-mix(in srgb,var(--logo-bottom) 35%,transparent))}
.ui-title .sub{position:relative;font-size:clamp(14px,4cqmin,18px);font-weight:700;opacity:.8;margin-top:-8px;letter-spacing:1px}
.ui-title .mascot{position:relative;width:144px;height:144px;flex:none;image-rendering:pixelated;animation:ui-bob 2.6s ease-in-out infinite}
@keyframes ui-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.ui-title .slots{position:relative;display:flex;flex-direction:column;gap:8px;width:min(86%,320px)}
.ui-title .slot{display:flex;align-items:center;gap:10px;min-height:48px;padding:8px 12px;border-radius:14px;
  border:2px solid rgba(255,255,255,.2);background:var(--slot-bg);color:#fff;font:inherit;cursor:pointer;text-align:left}
.ui-title .slot:active{transform:translateY(1px)}
.ui-title .slot.last{border-color:var(--accent);box-shadow:0 0 14px color-mix(in srgb,var(--accent) 30%,transparent)}
.ui-title .slot .n{flex:none;width:30px;height:30px;border-radius:9px;display:grid;place-items:center;font-weight:900;
  font-size:15px;background:linear-gradient(180deg,var(--badge-top),var(--badge-bottom));color:var(--badge-text);box-shadow:inset 0 -2px 0 rgba(0,0,0,.25)}
.ui-title .slot.empty .n{background:rgba(255,255,255,.12);color:#fff}
.ui-title .slot .d{display:flex;flex-direction:column;min-width:0}
.ui-title .slot b{font-size:15px;font-weight:900}
.ui-title .slot small{font-size:11px;font-weight:700;opacity:.72;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ui-title .ctl{position:relative;text-align:center;color:var(--text)}
.ui-title .ctl-q{font-size:14px;font-weight:900;margin-bottom:8px;opacity:.9}
.ui-title .seg{display:flex;gap:8px;justify-content:center}
.ui-title .opt{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-width:130px;min-height:48px;
  padding:9px 12px;border-radius:14px;border:2px solid rgba(255,255,255,.2);background:var(--slot-bg);color:#fff;
  font:inherit;cursor:pointer}
.ui-title .opt b{font-size:15px;font-weight:900}
.ui-title .opt small{font-size:11px;font-weight:700;opacity:.7}
.ui-title .opt.on{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 18%,transparent);box-shadow:0 0 14px color-mix(in srgb,var(--accent) 35%,transparent)}
.ui-title .ctl-n{margin-top:8px;font-size:12px;font-weight:700;opacity:.6}
.ui-title .hint{position:relative;font-size:13px;opacity:.55}
.ui-title .link{position:relative;min-height:44px;padding:8px 16px;border:0;background:none;color:var(--title-text);font:800 14px var(--font);
  text-decoration:underline;opacity:.8;cursor:pointer;pointer-events:auto}
/* a low, wide screen: the mascot and the name on the left, the choices on the right */
@container (max-height:480px){
  .ui-title{flex-flow:column wrap;align-content:center;column-gap:40px;gap:10px}
  .ui-title .mascot{width:96px;height:96px}
  .ui-title .slots{width:300px}
  .ui-title .hint{display:none}
}

/* ---------- the dialog box (ui/DialogBox.js) ---------- */
.ui-dlg{position:absolute;left:calc(var(--sa-l) + 8px);right:calc(var(--sa-r) + 8px);bottom:calc(var(--sa-b) + 8px);
  margin:0 auto;max-width:980px;transform:translateY(24px);display:flex;gap:12px;align-items:stretch;
  padding:clamp(14px,calc(var(--u)*3),22px) clamp(14px,calc(var(--u)*3),24px) clamp(18px,calc(var(--u)*3.4),24px);
  border-radius:18px;background:linear-gradient(180deg,var(--dialog-top,rgba(20,22,44,.97)),var(--dialog-bottom,rgba(10,12,28,.98)));
  border:3px solid var(--c);box-shadow:0 0 0 2px rgba(0,0,0,.6),0 0 22px color-mix(in srgb,var(--c) 45%,transparent),0 10px 30px rgba(0,0,0,.55);
  opacity:0;transition:opacity .18s,transform .18s;pointer-events:auto;cursor:pointer;min-height:44px;touch-action:manipulation}
.ui-dlg.on{opacity:1;transform:translateY(0)}
.ui-dlg-por{flex:0 0 auto;width:clamp(60px,calc(var(--u)*15),112px);height:clamp(60px,calc(var(--u)*15),112px);border-radius:14px;
  background:var(--dialog-portrait,#2a2d52);border:3px solid var(--c);overflow:hidden;align-self:flex-start}
.ui-dlg-por canvas{width:100%;height:100%;image-rendering:pixelated;image-rendering:crisp-edges;display:block}
.ui-dlg-body{flex:1 1 auto;min-width:0;position:relative}
.ui-dlg-name{position:absolute;top:calc(-1 * clamp(40px,calc(var(--u)*8),50px));left:-6px;padding:4px 16px;border-radius:12px;
  background:var(--c);color:var(--dialog-name-text,#141428);font-weight:900;font-size:clamp(16px,calc(var(--u)*4.2),22px);
  letter-spacing:.03em;box-shadow:0 3px 8px rgba(0,0,0,.45);white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}
.ui-dlg-txt{font-size:clamp(19px,calc(var(--u)*5),28px);line-height:1.42;font-weight:700;color:var(--dialog-text,#fbfbff);
  text-shadow:0 2px 0 rgba(0,0,0,.55);min-height:2.84em;white-space:pre-wrap;overflow-wrap:break-word}
.ui-dlg-more{position:absolute;right:-4px;bottom:-14px;width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;
  border-top:11px solid var(--c);animation:ui-dlg-bob .8s steps(2) infinite;opacity:0}
.ui-dlg-more.on{opacity:1}
@keyframes ui-dlg-bob{0%{transform:translateY(0)}50%{transform:translateY(4px)}}
@media (min-width:760px){.ui-dlg{left:50%;right:auto;width:min(92%,980px);transform:translate(-50%,24px);bottom:calc(var(--sa-b) + 18px);gap:16px;border-radius:20px}
  .ui-dlg.on{transform:translate(-50%,0)}.ui-dlg-por{align-self:center}}

/* ---------- a list of choices (ui/ChoiceList.js) ---------- */
.ui-ch{position:absolute;right:calc(var(--sa-r) + 10px);bottom:calc(var(--sa-b) + clamp(160px,calc(var(--u)*34),230px));
  display:flex;flex-direction:column;gap:8px;min-width:min(70%,320px);max-width:calc(100% - 20px);max-height:calc(100% - 260px);overflow:auto;
  padding:10px;border-radius:18px;background:var(--choice-bg,rgba(14,16,36,.97));border:3px solid var(--choice-edge,#9fd3ff);
  box-shadow:0 0 18px color-mix(in srgb,var(--choice-edge,#9fd3ff) 40%,transparent),0 8px 22px rgba(0,0,0,.5);pointer-events:auto;
  overscroll-behavior:contain}
.ui-ch button{font:inherit;font-weight:800;font-size:clamp(18px,calc(var(--u)*4.6),24px);text-align:left;color:#fff;
  background:rgba(255,255,255,.06);border:2px solid transparent;border-radius:12px;padding:12px 14px 12px 36px;min-height:48px;
  cursor:pointer;position:relative;display:flex;align-items:center;gap:10px;touch-action:manipulation}
.ui-ch button img{width:32px;height:32px;flex:none}
.ui-ch button .ct{display:flex;flex-direction:column;min-width:0}
.ui-ch button small{font-size:.72em;font-weight:700;opacity:.75;margin-top:2px}
.ui-ch button.hl{border-color:color-mix(in srgb,var(--accent,#ffd98a) 55%,transparent)}
.ui-ch button.sel{background:color-mix(in srgb,var(--choice-edge,#9fd3ff) 22%,transparent);border-color:var(--choice-edge,#9fd3ff)}
.ui-ch button.sel:before{content:"";position:absolute;left:13px;top:50%;transform:translateY(-50%);border-top:7px solid transparent;
  border-bottom:7px solid transparent;border-left:10px solid var(--choice-edge,#9fd3ff)}
.ui-ch button[disabled]{opacity:.45;cursor:default}
@media (min-width:760px){.ui-ch{right:max(4%,calc(50% - 490px))}}

/* ---------- the quest pill and its small card (ui/QuestPill.js) ---------- */
/* --qpill-x: a game that keeps something of its own at the left edge moves the pill beside it */
.ui-qpill{position:absolute;left:calc(var(--sa-l) + var(--qpill-x,clamp(6px,calc(var(--u)*2),16px)));
  top:calc(var(--sa-t) + clamp(6px,calc(var(--u)*2),16px) + clamp(44px,calc(var(--u)*10),56px));
  height:44px;min-width:44px;max-width:calc(100% - var(--sa-l) - var(--sa-r) - 80px - var(--qpill-x,0px));display:flex;align-items:center;
  padding:0 9px;border-radius:14px;background:var(--hud-bg);border:2px solid color-mix(in srgb,var(--accent) 38%,transparent);
  color:var(--text);font:800 13px/1.2 var(--font);box-shadow:0 3px 10px rgba(0,0,0,.4);cursor:pointer;pointer-events:auto;
  transition:transform .2s;touch-action:manipulation}
.ui-qpill:active{transform:translateY(2px)}
.ui .ui-qpill img{flex:none;width:22px;height:22px;filter:drop-shadow(0 0 4px color-mix(in srgb,var(--accent) 60%,transparent))}
.ui-qpill span{display:block;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:0;opacity:0;
  transition:max-width .35s ease,opacity .25s,margin .35s}
.ui-qpill.open span{max-width:300px;opacity:1;margin:0 4px 0 7px}
.ui-qpill.new:after{content:"";position:absolute;right:-3px;top:-3px;width:10px;height:10px;border-radius:50%;
  background:var(--accent);box-shadow:0 0 0 2px var(--hud-bg)}
.ui-qpill.flash{animation:ui-qflash 1s ease-out}
@keyframes ui-qflash{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--accent) 80%,transparent)}100%{box-shadow:0 0 0 14px transparent}}
.ui-qpop{position:absolute;left:calc(var(--sa-l) + var(--qpill-x,clamp(6px,calc(var(--u)*2),16px)));
  top:calc(var(--sa-t) + clamp(6px,calc(var(--u)*2),16px) + clamp(44px,calc(var(--u)*10),56px) + 52px);
  width:min(300px,calc(100% - var(--sa-l) - var(--sa-r) - 80px - var(--qpill-x,0px)));padding:10px 12px;opacity:0;transform:translateY(-6px);
  transition:opacity .18s,transform .18s;pointer-events:none}
.ui-qpop.on{opacity:1;transform:none;pointer-events:auto}
.ui-qpop b{display:block;font-size:12px;font-weight:900;color:var(--accent);margin-bottom:2px}
.ui-qpop p{margin:0 0 8px;font-size:14px;font-weight:700;line-height:1.3}

/* ---------- the quest log (ui/QuestLog.js) ---------- */
.ui-qsec{margin:10px 0 6px;font-size:12px;font-weight:900;letter-spacing:1px;text-transform:uppercase;opacity:.6}
.ui-qsec:first-child{margin-top:0}
.ui-quest{display:block;width:100%;text-align:left;font:inherit;color:var(--text);min-height:44px;
  background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.12);border-radius:14px;padding:8px 10px;margin:0 0 6px}
button.ui-quest{cursor:pointer;touch-action:manipulation}
button.ui-quest:active{transform:translateY(1px)}
.ui-quest.cur{border-color:var(--accent)}
.ui-quest.done{opacity:.6}
.ui-quest h3{display:flex;align-items:center;gap:8px;margin:0 0 2px;font-size:16px;font-weight:900}
.ui .ui-quest h3 img{width:22px;height:22px;flex:none}
.ui-quest p{margin:0 0 6px;font-size:13px;font-weight:600;opacity:.75;line-height:1.3}
.ui-quest .count{font-size:12px;font-weight:800;opacity:.55;padding:2px 0}
.ui-quest .next{display:flex;gap:8px;align-items:flex-start;font-size:14px;font-weight:700;line-height:1.3;padding:3px 0}
.ui-quest .next i{flex:none;width:14px;height:14px;margin-top:2px;border-radius:4px;border:2px solid rgba(255,255,255,.45)}
.ui-qnone{opacity:.6;padding:16px 4px;text-align:center;font-weight:700}

/* ---------- the bag and the shop (ui/BagPanel.js, ui/ShopPanel.js) ---------- */
.ui-purse{display:flex;align-items:center;gap:10px;margin:0 0 10px;padding:8px 12px;border-radius:14px;background:rgba(255,255,255,.06)}
.ui-purse .pl{font-weight:900;font-size:14px;margin-right:auto}
.ui-purse .pc{display:flex;align-items:center;gap:5px}
.ui-purse i{width:16px;height:16px;border-radius:50%;box-shadow:0 0 0 2px rgba(0,0,0,.35)}
.ui-purse b{font-size:17px;font-weight:900;min-width:12px}
.ui-purse small{font-size:11px;font-weight:800;opacity:.7}
.ui-tabs{display:flex;gap:6px;margin:0 0 10px}
.ui-tab{flex:1;min-width:0;min-height:56px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;padding:6px 2px;
  border-radius:12px;border:2px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:var(--text);font:inherit;cursor:pointer;touch-action:manipulation}
.ui-tab img{width:22px;height:22px;margin-bottom:2px}
.ui-tab b{font-size:12.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.ui-tab small{font-size:11px;font-weight:800;opacity:.65;white-space:nowrap}
.ui-tab.on{border-color:var(--badge-top);background:color-mix(in srgb,var(--badge-top) 16%,transparent)}
.ui-sec{margin-top:6px;padding:12px;border-radius:16px;background:rgba(255,255,255,.05);border:2px solid rgba(255,255,255,.1)}
.ui-sec .ui-note{margin:0 0 8px}
.ui-empty{opacity:.6;font-size:15px;font-weight:700;padding:14px 4px;text-align:center}
.ui-row{display:flex;gap:12px;align-items:flex-start;background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.12);border-radius:16px;padding:8px 10px;margin-bottom:8px}
.ui-row:last-child{margin-bottom:0}
.ui-row > img{width:40px;height:40px;flex:none;margin-top:2px}
.ui-row .inf{flex:1;min-width:0}
.ui-row .nm{display:flex;gap:8px;align-items:center;font-size:16px;font-weight:900}
.ui-row .nm span:first-child{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ui-row .sub{font-size:13px;font-weight:700;opacity:.75;margin-top:2px;line-height:1.3}
.ui-row .btns{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.ui-tag{margin-left:auto;flex:none;font-size:11px;font-weight:900;padding:2px 8px;border-radius:999px;background:var(--badge-top);color:var(--badge-text);white-space:nowrap}
.ui-pouch{display:flex;align-items:center;gap:12px;padding:10px 12px;margin:0 0 10px;border-radius:16px;
  background:linear-gradient(180deg,var(--pouch-top,#6a4426),var(--pouch-bottom,#4a2e18));border:2px solid var(--pouch-edge,#c8925a);
  box-shadow:inset 0 2px 0 rgba(255,220,160,.25),0 4px 10px rgba(0,0,0,.3)}
.ui-pouch .pi{width:42px;height:42px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center;
  background:radial-gradient(circle at 35% 30%,#ffe9a8,#c8902a);box-shadow:inset 0 -3px 0 rgba(0,0,0,.25)}
.ui-pouch .pi img{width:26px;height:26px}
.ui-pouch .pt{display:flex;flex-direction:column;gap:2px;min-width:0}
.ui-pouch b{font-size:16px;font-weight:900;color:var(--pouch-title,#ffe2b0)}
.ui-pouch span{font-size:12px;font-weight:700;color:var(--pouch-text,#f4dcc0);opacity:.9}
.ui-slots{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:8px;margin:0 0 12px}
.ui-sellrow{display:flex;align-items:center;gap:12px;width:100%;margin:0 0 12px;padding:10px 14px;border-radius:14px;border:2px solid rgba(255,217,138,.45);background:rgba(255,217,138,.08);color:inherit;font:inherit;text-align:left;cursor:pointer}
.ui-sellrow img{width:32px;height:32px;image-rendering:pixelated;flex:none}
.ui-sellrow .w{display:flex;flex-direction:column;min-width:0;flex:1}
.ui-sellrow b{font-size:15px;font-weight:900}
.ui-sellrow small{font-size:12px;font-weight:700;opacity:.75}
.ui-sellrow .worth{font-weight:900;color:#ffd98a;white-space:nowrap}
.ui-sellrow.on{border-color:#ffd98a;box-shadow:0 0 0 2px rgba(255,217,138,.35)}
.ui-sellrow.empty{opacity:.6}
.ui-pick.shop{margin:0 0 14px}
.ui-pick.shop .ui-btn{align-self:flex-start;width:auto;min-width:0;margin-top:8px;padding-inline:16px}
.ui-slot{position:relative;aspect-ratio:1;min-height:64px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
  border-radius:14px;border:2px solid color-mix(in srgb,var(--pouch-edge,#c8925a) 45%,transparent);
  background:radial-gradient(circle at 50% 40%,rgba(255,220,170,.12),rgba(40,28,20,.55));color:var(--text);font:inherit;cursor:pointer;padding:4px;touch-action:manipulation}
.ui-slot img{width:40px;height:40px}
.ui-slot small{font-size:10px;font-weight:900;color:var(--accent)}
.ui-slot .n{position:absolute;right:5px;top:3px;font-style:normal;font-size:10px;font-weight:900;background:rgba(0,0,0,.5);border-radius:6px;padding:0 4px}
.ui-slot.on{border-color:var(--accent);box-shadow:0 0 10px color-mix(in srgb,var(--accent) 40%,transparent)}
.ui-slotinfo{margin-top:10px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.05);font-size:13px;font-weight:700;line-height:1.4;opacity:.95}
.ui-slotinfo b{display:block;font-size:15px}
.ui-slotinfo span{display:block;color:var(--accent)}
.ui-say{display:flex;gap:12px;align-items:center;margin:0 0 10px;padding:10px 12px;border-radius:16px;background:rgba(0,0,0,.25);border:2px solid rgba(255,255,255,.1)}
.ui-say canvas{width:56px;height:56px;flex:none;border-radius:12px;image-rendering:pixelated;background:rgba(0,0,0,.25)}
.ui-say .who{font-size:13px;font-weight:900;color:var(--accent)}
.ui-say .line{font-size:15px;font-weight:800;line-height:1.3}
.ui-pick{display:flex;gap:12px;align-items:flex-start;margin-top:10px;padding:12px;border-radius:14px;background:rgba(0,0,0,.25);border:2px solid rgba(255,255,255,.1)}
.ui-pick>img{width:48px;height:48px;flex:none;image-rendering:pixelated}
.ui-pick .inf{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.ui-pick b{font-size:16px;font-weight:900}
.ui-pick .pr{font-size:14px;font-weight:900;color:var(--accent)}
.ui-pick .use{font-size:13px;font-weight:700;line-height:1.4;opacity:.95}
.ui-pick .ui-btn{margin-top:6px;align-self:stretch}
.ui-pick .ui-btn:disabled{opacity:.5;cursor:default}
.ui-pick.hint{font-size:13px;font-weight:700;opacity:.8}

/* ---------- the area map (ui/AreaMap.js) ---------- */
.ui-amap .vp{position:relative;margin:0 auto;border-radius:10px;overflow:hidden;touch-action:none;box-shadow:inset 0 0 0 2px rgba(0,0,0,.35)}
.ui-amap canvas{display:block;width:100%;height:100%;touch-action:none}
.ui-amap .zm{position:absolute;right:8px;bottom:8px;display:flex;flex-direction:column;gap:8px}
.ui-amap .lg{display:flex;flex-wrap:wrap;gap:4px 12px;justify-content:center;margin-top:10px;font-size:12px;font-weight:800}
.ui-amap .lg span{display:flex;align-items:center;gap:4px}
.ui-amap .lg i{width:12px;height:12px;border-radius:3px;display:inline-block;box-shadow:inset 0 0 0 1px rgba(0,0,0,.35)}
/* ---------- the party strip at the left edge (game/items/PartyStrip.js) ---------- */
/* the strip stands at the left edge under the top bar; the quest pill sits beside it */
.ui{--qpill-x:62px}
.hp-strip{position:absolute;left:calc(var(--sa-l) + 10px);top:calc(var(--sa-t) + 62px);display:flex;flex-direction:column;gap:6px;
  pointer-events:auto;cursor:pointer;padding:0;border:0;background:none;touch-action:manipulation}
.hp-slot{position:relative;width:44px;height:44px;border-radius:50%;background:var(--round-bg);border:2px solid rgba(255,255,255,.18);overflow:hidden}
.hp-slot.lead{border-color:var(--badge-top);box-shadow:0 0 0 2px color-mix(in srgb,var(--badge-top) 25%,transparent)}
.hp-slot.empty{border-style:dashed;background:rgba(18,20,40,.35)}
.hp-slot canvas{width:100%;height:100%;image-rendering:pixelated;display:block}
.hp-slot i{position:absolute;left:6px;right:6px;bottom:4px;height:4px;border-radius:2px;background:rgba(0,0,0,.55)}
.hp-slot i b{display:block;height:100%;border-radius:2px;background:var(--bar-hp-end,#6fe08a)}

/* ---------- companions and abilities (ui/RosterKit.js) ---------- */
.ui canvas{image-rendering:pixelated;image-rendering:crisp-edges}
.ui-bar{height:8px;border-radius:4px;background:rgba(0,0,0,.5);overflow:hidden;margin-top:4px}
.ui-bar b{display:block;height:100%;background:linear-gradient(90deg,var(--bar-hp,#57d07a),var(--bar-hp-end,#9cf0a6))}
.ui-bar.st b{background:linear-gradient(90deg,var(--bar-st,#e0a83a),var(--bar-st-end,#ffd98a))}
.ui-bar.xp{height:6px}
.ui-bar.xp b{background:linear-gradient(90deg,var(--bar-xp,#6fb8ff),var(--bar-xp-end,#bfe4ff))}
.ui-bar.wd b{background:linear-gradient(90deg,var(--bar-wd,#ffb54a),var(--bar-wd-end,#ffe6a0))}
.ui-bar.lb{position:relative;height:14px}
.ui-bar.lb span{position:absolute;inset:0;display:flex;justify-content:space-between;align-items:center;padding:0 6px;font-size:10px;font-weight:900;
  color:#fff;text-shadow:0 1px 0 #000,0 0 3px #000}
.ui-bar.lb em{font-style:normal}
.ui-tag.soft{background:color-mix(in srgb,var(--mana,#9fd0ff) 25%,transparent);color:var(--mana-text,#bfe4ff)}
.ui-tag.quiet{background:rgba(255,255,255,.14);color:var(--text)}
.ui-elb{display:inline-flex;align-items:center;gap:3px;flex:none;padding:1px 7px 1px 3px;border-radius:999px;font-size:11px;font-weight:900;
  background:color-mix(in srgb,var(--ec) 35%,rgba(0,0,0,.4));border:1px solid color-mix(in srgb,var(--ec) 70%,transparent);color:#fff}
.ui .ui-elb img{width:16px;height:16px}
.ui-pips{display:inline-flex;align-items:center;gap:3px;vertical-align:middle}
.ui-pips i{width:8px;height:8px;border-radius:2px;transform:rotate(45deg);background:rgba(255,255,255,.16)}
.ui-pips i.on{background:var(--accent);box-shadow:0 0 4px var(--gold-bottom)}
.ui-pips b{margin-left:4px;font-weight:900;color:var(--accent)}
.ui-orbs{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:900;margin:0 0 12px;padding:6px 12px;border-radius:12px;background:rgba(14,16,36,.84)}
.ui-orbs i{width:13px;height:13px;border-radius:50%;border:2px solid var(--mana,#9fd0ff)}
.ui-orbs i.on{background:radial-gradient(circle at 35% 35%,#fff,var(--mana-glow,#7fc8ff) 50%,var(--mana-deep,#3a7ad8));box-shadow:0 0 6px var(--mana-glow,#7fc8ff)}
.ui-mem{display:flex;flex-direction:column;gap:10px;background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.12);border-radius:16px;padding:10px;margin-bottom:8px}
.ui-mem.lead{border-color:var(--badge-top)}
.ui-mem .top{display:flex;gap:12px;align-items:center}
.ui-mem canvas.por{width:64px;height:64px;border-radius:12px;background:rgba(0,0,0,.25);flex:none}
.ui-mem .inf{flex:1;min-width:0}
.ui-mem .nm{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:18px;font-weight:900}
.ui-mem .nm .ui-tag{margin-left:0}
.ui-mem .sub{font-size:13px;font-weight:700;opacity:.75;margin:2px 0 4px;white-space:pre-wrap}
.ui-mem .btns{display:flex;flex-wrap:wrap;gap:8px}
.ui-mem .btns .ui-btn{flex:1 1 calc(50% - 4px);min-width:0}
.ui-pick{display:flex;gap:10px;align-items:center;width:100%;min-height:52px;margin:0 0 8px;padding:8px 10px;text-align:left;font:inherit;color:var(--text);
  background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.12);border-radius:16px;cursor:pointer;touch-action:manipulation}
.ui-pick.on{border-color:var(--badge-top)}
.ui-pick:active{transform:translateY(1px)}
.ui-pick > svg,.ui-pick > .sig{width:34px;height:34px;flex:none}
.ui-pick > .sig svg{width:100%;height:100%;display:block}
.ui-spell{display:flex;gap:12px;align-items:flex-start;padding:10px 4px}
.ui-spell .sig.big{width:72px;height:72px;flex:none}
.ui-spell .sig.big svg{width:100%;height:100%;display:block}
.ui-spell .words{min-width:0}
.ui-spell .use{margin:0 0 6px;font-weight:800;line-height:1.35}
.ui-spell .how{margin:0 0 8px;opacity:.75;font-weight:700;line-height:1.35}
.ui-pick .inf{flex:1;min-width:0;display:flex;flex-direction:column}
.ui-pick .nm{font-size:16px;font-weight:900}
.ui-pick .sub{font-size:13px;font-weight:700;opacity:.8;margin-top:2px}
.ui-pick .sub .mana{color:var(--mana,#9fd0ff);margin-right:10px}
.ui-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px}
.ui-card{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;min-height:44px;padding:6px 4px 8px;font:inherit;
  font-size:12px;font-weight:800;line-height:1.2;color:var(--text);text-align:center;background:rgba(255,255,255,.06);
  border:2px solid rgba(255,255,255,.12);border-radius:14px;cursor:pointer;touch-action:manipulation}
.ui-card.dim{opacity:.6}
.ui-card canvas{width:60px;height:60px}
.ui-card .mark{width:60px;height:60px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(255,255,255,.05);
  font-size:26px;font-weight:900;opacity:.4}
.ui-card .lv{position:absolute;left:6px;top:6px;font-size:11px;font-weight:900;background:rgba(0,0,0,.55);border-radius:8px;padding:1px 6px}
.ui-card .ui-elb{transform:scale(.85)}
.ui-card .ui-tag{margin:0}
.ui-det{display:flex;gap:12px;align-items:center;margin-bottom:6px}
.ui-det canvas{width:96px;height:96px;border-radius:14px;background:rgba(0,0,0,.25);flex:none}
.ui-det .inf{flex:1;min-width:0}
.ui-det .inf > .ui-note:first-child{margin-top:0}
.ui-dnm{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:17px;font-weight:900}
.ui-wsec{margin-bottom:12px;padding:12px;border-radius:16px;background:rgba(255,255,255,.05);border:2px solid rgba(255,255,255,.1)}
.ui-wsec h3{display:flex;align-items:center;gap:8px;margin:0 0 6px;font-size:17px;font-weight:900}
.ui .ui-wsec h3 img{width:24px;height:24px}
.ui-picks{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.ui-picks canvas{width:32px;height:32px;flex:none}
.ui-filter{display:flex;gap:6px;margin:0 0 8px}
.ui-filter .ui-btn{flex:1;justify-content:center}

/* ---------- segment tabs and the world map (ui/PanelExtras.js, ui/WorldMap.js) ---------- */
.ui-seg{display:flex;gap:6px;justify-content:center;margin:0 0 10px}
.ui-seg button{min-height:44px;min-width:110px;padding:6px 16px;border-radius:12px;border:2px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);
  color:var(--text);font:inherit;font-weight:900;font-size:14px;cursor:pointer;touch-action:manipulation}
.ui-seg button.on{border-color:var(--badge-top);background:color-mix(in srgb,var(--badge-top) 18%,transparent)}
.ui-wmap .vp{position:relative;margin:0 auto;border-radius:10px;overflow:hidden;box-shadow:inset 0 0 0 2px rgba(0,0,0,.35)}
.ui-wmap canvas{display:block;width:100%;height:100%}
.ui-wmap .you{position:absolute;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:var(--you);border:2px solid #fff;
  box-shadow:0 0 0 4px var(--you-glow);animation:ui-you 1.3s ease-in-out infinite}
@keyframes ui-you{0%,100%{transform:scale(.9)}50%{transform:scale(1.08)}}
.ui-wmap .pick{position:absolute;width:48px;height:48px;margin:-24px 0 0 -24px;padding:0;border:0;border-radius:50%;background:transparent;
  cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:transform .08s,background .08s}
.ui-wmap .pick:active{transform:scale(.9);background:rgba(255,236,170,.32);box-shadow:0 0 0 2px rgba(255,236,170,.7)}
.ui-wmap .pick.heard:active{background:rgba(255,255,255,.14);box-shadow:none}
.ui-wmap .pick:focus-visible{outline:2px solid #fff;outline-offset:2px}
.ui-amap-back{width:100%;justify-content:center;margin:0 0 10px}

/* ---------- the first-touch guide (ui/HelperCard.js) ---------- */
.ui-guide{position:absolute;inset:0;z-index:40;pointer-events:none;opacity:0;transition:opacity .2s}
.ui-guide.on{opacity:1}
.ui-guide .ring{position:absolute;border-radius:14px;box-shadow:0 0 0 3px var(--guide-ring,rgba(255,214,120,.95)),0 0 18px 4px var(--guide-glow,rgba(255,190,90,.6));
  animation:ui-ring 1.4s ease-in-out infinite}
@keyframes ui-ring{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
.ui-guide .card{position:absolute;pointer-events:auto;cursor:pointer;display:flex;align-items:flex-start;gap:6px;max-width:calc(100% - 20px);
  transition:left .35s ease,top .35s ease;touch-action:manipulation}
.ui-guide .face{flex:none;width:44px;height:44px;border-radius:50%;overflow:hidden;background:var(--guide-face,#2a2d52);border:2px solid var(--guide-edge,#ffb04a);
  box-shadow:0 3px 10px rgba(0,0,0,.45);animation:ui-bob 1.8s ease-in-out infinite}
.ui-guide .face canvas{width:100%;height:100%;display:block}
.ui-guide .words{position:relative;min-width:0;padding:7px 11px 8px;border-radius:14px;background:var(--guide-bg,#fffaf0);color:var(--guide-text,#2a1d10);
  box-shadow:0 4px 14px rgba(0,0,0,.4);font-size:14px;font-weight:800;line-height:1.3}
.ui-guide .words:before{content:"";position:absolute;left:-6px;top:14px;border-top:6px solid transparent;border-bottom:6px solid transparent;
  border-right:7px solid var(--guide-bg,#fffaf0)}
.ui-guide .words b{display:block;font-size:11px;font-weight:900;color:var(--guide-title,#c0602a);letter-spacing:.3px;text-transform:uppercase}
.ui-guide .words span{display:-webkit-box;-webkit-line-clamp:6;-webkit-box-orient:vertical;overflow:hidden}
`;

let installed = false;

export function installStyles(theme) {
  if (installed) return;
  installed = true;
  if (theme.font.url) {
    const font = document.createElement('link');
    font.rel = 'stylesheet';
    font.href = theme.font.url;
    document.head.appendChild(font);
  }
  const colors = Object.entries(theme.colors).map(([name, value]) => `--${name}:${value}`).join(';');
  const style = document.createElement('style');
  style.textContent = `.ui{--font:${theme.font.family};${colors}}${CSS}`;
  document.head.appendChild(style);
}
