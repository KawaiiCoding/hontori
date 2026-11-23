/*
 * BattleStyles.js
 * Job: the stylesheet of the battle screen: the two fighter cards with their bars, the intent pill, the turn
 * pill, the message line, the action row with its resource orbs, the move buttons, the trays (spells, party),
 * the grade popup, the matchup banner, the title card and the end card. The shapes are the current game's
 * battle screen; the font comes from the interface layer the screen is added to.
 *
 * Public API:
 *   installBattleStyles()   add the stylesheet to the page (once)
 *
 * Classes: .bt (the screen), .bt-stage (its canvas), .bt-card (+ foe, me), .bt-bar (+ sta, thin), .bt-tag,
 *   .bt-badge, .bt-intent, .bt-turn, .bt-msg, .bt-acts, .bt-pips, .bt-pip, .bt-btn (+ hot, off), .bt-ic,
 *   .bt-odds, .bt-moves (+ away: the wide button stands in their place), .bt-mv, .bt-breath (the wide button), .bt-tray (+ strip), .bt-chip, .bt-pm, .bt-grade, .bt-banner,
 *   .bt-owner, .bt-rule, .bt-title, .bt-end, .bt-ward, .bt-hand.
 *   On a wide screen (the frame has the class "land") the player's card moves to the left, under the turn pill.
 *   Colour hooks: --mc (a move or member), --ic (intent), --gc (grade), --ec (end card, badge), --sc (frame).
 */

const CSS = `
.bt{position:absolute;inset:0;z-index:45;pointer-events:auto;background:#0b0c1c;color:#f4f1e8;overflow:hidden;
  touch-action:none;-webkit-user-select:none;user-select:none;opacity:0;transition:opacity .35s}
.bt.on{opacity:1}
.bt-stage{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;touch-action:none}
.bt-card{position:absolute;width:min(58%,230px);padding:7px 11px 8px;border-radius:14px;background:rgba(14,16,36,.84);
  border:2px solid rgba(255,255,255,.16);box-shadow:0 6px 18px rgba(0,0,0,.4);pointer-events:none}
.bt-card .nm{font-weight:900;font-size:14px;display:flex;justify-content:space-between;gap:8px;line-height:1.15}
.bt-card .lv{opacity:.75;font-size:12px;white-space:nowrap}
.bt-card.foe{right:10px;top:calc(var(--sa-t) + 50px)}
/* the column under the arena, from the bottom: moves, the action row (120 to 164), 8 px, the message line (at most two
   lines, 44 px), 8 px, the player's card */
.bt-card.me{right:10px;bottom:calc(var(--sa-b) + 224px)}
.bt.tray-open .bt-card.me{bottom:calc(var(--sa-b) + 228px + var(--tray,84px))}
.bt.tray-open .bt-msg{bottom:calc(var(--sa-b) + 176px + var(--tray,84px))}
.land .bt-card{width:min(34%,230px)}
.land .bt-msg{max-width:calc(100% - 2 * min(34%,230px) - 48px)}
.land .bt-card.me,.land .bt.tray-open .bt-card.me{left:calc(var(--sa-l) + 10px);right:auto;bottom:auto;top:calc(var(--sa-t) + 104px)}
.bt-bar{position:relative;height:13px;border-radius:6px;background:rgba(0,0,0,.6);overflow:hidden;margin-top:4px}
.bt-bar b{display:block;height:100%;transition:width .5s;background:linear-gradient(90deg,#57d07a,#9cf0a6)}
.bt-bar.low b{background:linear-gradient(90deg,#ff7a5a,#ffb08a)}
.bt-bar.sta b{background:linear-gradient(90deg,#e0a83a,#ffd98a)}
.bt-bar span{position:absolute;inset:0;display:flex;justify-content:space-between;align-items:center;padding:0 6px;
  font-size:10px;font-weight:900;line-height:1;color:#fff;text-shadow:0 1px 0 #000,0 0 3px #000}
.bt-bar.thin{height:11px}
.bt-bar.thin span{font-size:9px}
.bt-card .st{font-size:11px;font-weight:800;margin-top:4px;display:flex;flex-wrap:wrap;gap:3px;align-items:center;min-height:16px}
.bt-tag{display:inline-block;padding:1px 6px;border-radius:8px;font-size:10px;font-weight:900;background:rgba(255,255,255,.12);color:#fff}
.bt-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 10px 2px 3px;border-radius:999px;font-weight:900;font-size:.85em;
  color:#fff;background:var(--ec,#555);border:2px solid rgba(0,0,0,.35);box-shadow:inset 0 1px 0 rgba(255,255,255,.35);
  text-shadow:0 1px 1px rgba(0,0,0,.6);vertical-align:middle}
.bt-badge img{width:24px;height:24px}
.bt-edge{flex:none;vertical-align:middle}
.bt-intent{position:absolute;right:10px;top:calc(var(--sa-t) + 12px);display:flex;align-items:center;gap:6px;padding:5px 11px 5px 7px;
  border-radius:999px;background:rgba(14,16,36,.88);border:2px solid var(--ic,#fff);font-weight:900;font-size:14px;
  box-shadow:0 0 12px var(--ic,#fff);pointer-events:none;transition:transform .2s;line-height:1.1}
.bt.owned .bt-intent{max-width:calc(52% - 14px);top:calc(var(--sa-t) + 8px)}
.bt.owned .bt-card.foe{top:calc(var(--sa-t) + 58px)}
.bt.owned .bt-intent small{display:block}
.bt-intent svg{width:20px;height:20px}
.bt-intent small{font-size:11px;font-weight:800;opacity:.8}
.bt-intent.pulse,.bt-mv.hot{animation:btPulse 1s ease-in-out infinite}
@keyframes btPulse{50%{transform:scale(1.08)}}
.bt-msg{position:absolute;left:50%;transform:translateX(-50%);width:max-content;max-width:min(calc(100% - 24px),340px);
  bottom:calc(var(--sa-b) + 172px);text-align:center;font-weight:800;font-size:13px;line-height:16px;color:#fff;
  display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;
  padding:4px 12px;border-radius:12px;background:rgba(10,12,30,.88);border:2px solid rgba(255,255,255,.14);
  box-shadow:0 4px 12px rgba(0,0,0,.4);pointer-events:none}
.bt-msg:empty{display:none}
.bt-moves{position:absolute;left:calc(var(--sa-l) + 8px);right:calc(var(--sa-r) + 8px);bottom:calc(var(--sa-b) + 8px);display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.bt-mv{position:relative;border:0;border-radius:14px;padding:7px 6px 6px;min-height:66px;overflow:hidden;text-align:left;font:inherit;
  color:#fff;cursor:pointer;background:linear-gradient(180deg,color-mix(in srgb,var(--mc) 55%,#1a1c38),#14162e);
  box-shadow:inset 0 0 0 2px var(--mc),inset 0 2px 0 rgba(255,255,255,.18),0 4px 0 color-mix(in srgb,var(--mc) 45%,#000),0 6px 12px rgba(0,0,0,.35);
  transition:transform .08s;touch-action:manipulation}
.bt-mv b{display:flex;align-items:center;gap:5px;font-size:13px;font-weight:900;line-height:1.1;padding-right:44px}
.bt-mv .ic{width:20px;height:20px;flex:none;filter:drop-shadow(0 1px 0 rgba(0,0,0,.5))}
.bt-mv .kind{display:inline-block;margin-top:4px;font-size:9px;font-weight:900;letter-spacing:.5px;text-transform:uppercase;padding:1px 6px;
  border-radius:6px;background:rgba(0,0,0,.35)}
.bt-mv .sc{display:inline-block;margin-left:5px;font-size:9px;font-weight:900;color:#ffd98a;text-transform:uppercase;letter-spacing:.5px}
.bt-mv:active{transform:translateY(3px);box-shadow:inset 0 0 0 2px var(--mc),0 0 0 rgba(0,0,0,.45)}
.bt-mv i{display:block;font-style:normal;font-size:10px;font-weight:700;opacity:.85;line-height:1.15;margin-top:3px}
.bt-mv .mark{position:absolute;top:5px;right:6px}
.bt-mv.off{filter:grayscale(.85) brightness(.6)}
.bt-mv .cd{position:absolute;inset:0;border-radius:14px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;
  background:rgba(10,10,24,.55)}
.bt-moves.four .bt-mv i,.bt-moves.four .bt-mv .ic{display:none}
.bt-moves.four .bt-mv{padding:6px 5px 5px}
.bt-moves.four .bt-mv b{font-size:12px;padding-right:12px}
.bt-moves.four .bt-mv .mark{top:3px;right:3px}
.bt-moves.four .bt-edge{width:14px;height:14px}
.bt-moves.away{visibility:hidden}
.bt-acts{position:absolute;left:calc(var(--sa-l) + 8px);right:calc(var(--sa-r) + 8px);bottom:calc(var(--sa-b) + 120px);display:flex;align-items:center;
  gap:6px;height:44px;overflow:hidden}
.bt-acts .gap{flex:1}
.bt-pips{flex:none;white-space:nowrap;display:flex;align-items:center;gap:5px;padding:6px 10px;border-radius:12px;background:rgba(14,16,36,.84);font-weight:900;font-size:12px}
.bt-pip{width:11px;height:11px;border-radius:50%;border:2px solid #9fd0ff}
.bt-pip.on{background:radial-gradient(circle at 35% 35%,#fff,#7fc8ff 50%,#3a7ad8);box-shadow:0 0 6px #7fc8ff}
.bt-btn{display:flex;align-items:center;justify-content:center;gap:4px;min-width:44px;min-height:44px;border:0;border-radius:12px;background:rgba(14,16,36,.84);color:#fff;font:inherit;
  font-weight:900;font-size:12px;padding:9px 11px;cursor:pointer;box-shadow:inset 0 0 0 2px rgba(255,255,255,.14);touch-action:manipulation;
  white-space:nowrap;flex:none}
.bt-acts.tight .bt-pips .tl,.bt-acts.tighter .bt-btn.ic .tl,.bt-acts.tightest .tl{display:none}
.bt-acts.tighter{gap:4px}
.bt-acts.tighter .bt-btn{padding-left:7px;padding-right:7px}
.bt-acts.tighter .bt-pips{padding-left:7px;padding-right:7px}
.bt-acts.tightest{gap:3px}
.bt-acts.tightest .bt-btn,.bt-acts.tightest .bt-pips{padding-left:5px;padding-right:5px;gap:3px}
.bt-acts.tightest .bt-pip{width:9px;height:9px}
.bt-btn{position:relative}
.bt-btn .cnt{display:none;position:absolute;right:1px;top:1px;min-width:14px;padding:0 3px;border-radius:7px;font-size:10px;line-height:14px;
  background:#ffd98a;color:#2a1405;pointer-events:none}
.bt-acts.tighter .bt-btn .cnt:not(:empty),.bt-acts.tightest .bt-btn .cnt:not(:empty){display:block}
.bt-btn.hot{box-shadow:inset 0 0 0 2px #ffd98a,0 0 10px #ffd98a}
.bt-btn.off{opacity:.45}
.bt-btn img{width:20px;height:20px}
.bt-btn.ic{padding:7px 9px}
.bt-btn.ic img{width:26px;height:26px;filter:drop-shadow(0 1px 0 rgba(0,0,0,.5))}
.bt-odds{display:flex;align-items:flex-end;gap:2px;height:14px}
.bt-odds b{width:4px;border-radius:2px;background:rgba(255,255,255,.2)}
.bt-odds b:nth-child(1){height:6px}
.bt-odds b:nth-child(2){height:10px}
.bt-odds b:nth-child(3){height:14px}
.bt-odds[data-l="1"] b:nth-child(-n+1){background:#ff8a7a}
.bt-odds[data-l="2"] b:nth-child(-n+2){background:#ffd24a}
.bt-odds[data-l="3"] b:nth-child(-n+3){background:#57d07a}
.bt-breath{position:absolute;left:calc(var(--sa-l) + 8px);right:calc(var(--sa-r) + 8px);bottom:calc(var(--sa-b) + 8px);min-height:66px;
  gap:10px;border-radius:14px;font-size:16px;background:linear-gradient(180deg,#ffd98a,#e0a83a);color:#2a1405;
  box-shadow:inset 0 2px 0 rgba(255,255,255,.45),0 4px 0 #8a5a18,0 6px 12px rgba(0,0,0,.35)}
.bt-breath img{width:32px;height:32px;filter:drop-shadow(0 1px 0 rgba(0,0,0,.35))}
.bt-breath .tl{display:flex;flex-direction:column;align-items:flex-start;line-height:1.15}
.bt-breath .ds{font-size:12px;font-weight:900;opacity:.75}
.bt-breath:active{transform:translateY(3px);box-shadow:0 1px 0 #8a5a18}
.bt-breath.off{filter:grayscale(.6);opacity:.7}
.bt-tray{position:absolute;left:8px;right:8px;bottom:calc(var(--sa-b) + 168px);display:flex;overflow-x:auto;gap:4px;padding:6px;
  scrollbar-width:none;border-radius:14px;background:#0c0d20;border:2px solid rgba(255,217,138,.25);touch-action:pan-x}
.bt-tray.strip{gap:6px;padding:7px}
.bt-chip{position:relative;flex:0 0 74px;min-height:44px;border:0;background:none;color:inherit;font:inherit;text-align:center;font-size:10px;
  font-weight:800;line-height:1.1;padding:2px 0 3px;border-radius:10px;cursor:pointer}
.bt-chip svg{display:block;margin:0 auto 2px;width:34px;height:34px}
.bt-chip .dot{display:block;font-size:22px;line-height:34px}
.bt-chip .c{display:block;margin-top:2px;letter-spacing:1px;color:#9fd0ff;font-size:9px}
.bt-chip .d{display:block;margin-top:2px;font-size:9.5px;font-weight:700;opacity:.8;line-height:1.15;padding:0 2px}
.bt-chip.no{opacity:.55}
.bt-chip.hot{background:rgba(255,217,138,.14);box-shadow:0 0 0 2px rgba(255,217,138,.5)}
.bt-chip .ms{display:flex;justify-content:center;gap:2px;margin-top:3px}
.bt-chip .ms i{width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,.2)}
.bt-chip .ms i.on{background:#ffd98a;box-shadow:0 0 3px #ffd98a}
.bt-pm{flex:1 0 64px;max-width:110px;min-height:44px;border:0;border-radius:12px;padding:5px 6px;background:rgba(255,255,255,.06);color:#fff;
  font:inherit;font-size:11px;font-weight:900;text-align:center;cursor:pointer;box-shadow:inset 0 0 0 2px var(--mc,#fff)}
.bt-pm canvas{display:block;width:40px;height:40px;margin:0 auto 2px;image-rendering:pixelated}
.bt-pm.cur{opacity:.5;box-shadow:inset 0 0 0 2px #ffd98a}
.bt-pm.out{filter:grayscale(1);opacity:.4}
.bt-pm .hp{height:5px;border-radius:5px;background:rgba(0,0,0,.55);overflow:hidden;margin-top:3px}
.bt-pm .hp b{display:block;height:100%;background:linear-gradient(90deg,#57d07a,#9cf0a6)}
.bt-pm .hp b.low{background:linear-gradient(90deg,#ff7a5a,#ffb08a)}
.bt-grade{position:absolute;transform:translate(-50%,-50%);padding:2px 9px;border-radius:999px;font-weight:900;font-size:12px;
  background:rgba(10,10,28,.85);border:2px solid var(--gc);color:var(--gc);box-shadow:0 0 10px var(--gc);pointer-events:none;z-index:6;
  animation:btGrade 1.4s ease-out both}
@keyframes btGrade{0%{opacity:0;transform:translate(-50%,-50%) scale(.6)}18%{opacity:1;transform:translate(-50%,-50%) scale(1)}
  80%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(.6)}}
.bt-turn{position:absolute;left:12px;top:calc(var(--sa-t) + 64px);padding:6px 16px;border-radius:999px;font-weight:900;font-size:14px;
  letter-spacing:.5px;background:rgba(40,20,24,.85);color:#ffb3a8;border:2px solid rgba(255,140,120,.5);opacity:0;transition:opacity .25s;
  pointer-events:none;z-index:5}
.bt-turn.on{opacity:1}
.bt-turn.me{background:rgba(14,30,24,.88);color:#b8f5c8;border-color:#57d07a;box-shadow:0 0 14px rgba(87,208,122,.45)}
.bt-banner{position:absolute;left:50%;top:40%;min-width:240px;max-width:90%;text-align:center;padding:14px 18px;border-radius:18px;
  background:rgba(10,10,28,.9);border:2px solid rgba(255,217,138,.4);box-shadow:0 0 30px rgba(0,0,0,.6);pointer-events:none;
  animation:btBanner 2.7s ease both}
.bt-banner .vs{display:flex;align-items:center;justify-content:center;gap:10px;font-weight:900;font-size:16px}
@keyframes btBanner{0%{opacity:0;transform:translate(-50%,-50%) scale(.9)}15%{opacity:1;transform:translate(-50%,-50%) scale(1)}
  85%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(.9)}}
.bt-owner{position:absolute;left:10px;top:calc(var(--sa-t) + 12px);display:flex;align-items:center;gap:6px;padding:3px 10px 3px 3px;
  border-radius:999px;background:rgba(14,16,36,.84);font-weight:900;font-size:12px;pointer-events:none;max-width:calc(48% - 10px)}
.bt-owner .nm{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bt-owner canvas{flex:none}
.bt-owner canvas{width:30px;height:30px;border-radius:50%;background:#2a2c48}
.bt-owner .dots{flex:none;margin-left:2px;display:flex;gap:2px}
.bt-owner .dots b{width:7px;height:7px;border-radius:50%;background:#ffd98a}
.bt-owner .dots b.out{background:rgba(255,255,255,.22)}
.bt.framed{box-shadow:inset 0 0 0 3px var(--sc),inset 0 0 60px color-mix(in srgb,var(--sc) 35%,transparent)}
.bt.framed .bt-card{border-color:color-mix(in srgb,var(--sc) 70%,#fff)}
.bt-rule{position:absolute;left:12px;top:calc(var(--sa-t) + 106px);padding:4px 10px;border-radius:10px;font-size:11px;font-weight:900;
  letter-spacing:.3px;line-height:1.2;max-width:calc(100% - min(58%,230px) - 28px);background:color-mix(in srgb,var(--sc) 30%,#0e1024);
  border:2px solid var(--sc);pointer-events:none}
.bt-title{position:absolute;inset:0;z-index:30;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;
  text-align:center;background:radial-gradient(circle at 50% 42%,color-mix(in srgb,var(--sc) 45%,#0b0c1c),#06070f 70%);
  animation:btTitleIn .6s ease-out both;cursor:pointer}
.bt-title.out{animation:btTitleOut .5s ease-in both;pointer-events:none}
.bt-title .crest{display:flex;align-items:center;justify-content:center;
  filter:drop-shadow(0 0 22px var(--sc)) drop-shadow(0 6px 0 rgba(0,0,0,.5));animation:btTitleSpin 2.6s ease-in-out both}
.bt-title .skip{margin-top:18px;font-size:12px;font-weight:800;opacity:.6;animation:btPulse 1.6s ease-in-out infinite}
.bt-title small{margin-top:14px;font-size:13px;font-weight:900;letter-spacing:6px;text-transform:uppercase;color:#ffd98a}
.bt-title b{font-size:clamp(26px,8vw,40px);font-weight:900;text-shadow:0 0 18px var(--sc),0 3px 0 #000}
.bt-title span{font-size:16px;font-weight:800;opacity:.9}
.bt-title em{margin-top:8px;font-style:normal;font-size:13px;font-weight:900;padding:5px 14px;border-radius:12px;border:2px solid var(--sc);
  background:rgba(0,0,0,.35)}
@keyframes btTitleIn{from{opacity:0;transform:scale(1.15)}to{opacity:1;transform:none}}
@keyframes btTitleOut{to{opacity:0;transform:scale(.92)}}
@keyframes btTitleSpin{from{transform:rotateY(540deg) scale(.2);opacity:0}60%{transform:rotateY(-20deg) scale(1.08);opacity:1}to{transform:none}}
.bt-end{position:absolute;left:50%;bottom:calc(var(--sa-b) + 34px);transform:translateX(-50%);display:flex;align-items:center;gap:12px;
  min-width:220px;border:2px solid var(--ec,#ffd98a);border-radius:20px;padding:10px 14px 10px 10px;font:inherit;color:#fff;cursor:pointer;
  background:linear-gradient(180deg,rgba(30,32,64,.96),rgba(12,13,30,.96));
  box-shadow:0 0 0 4px rgba(0,0,0,.25),0 0 26px color-mix(in srgb,var(--ec,#ffd98a) 55%,transparent),0 10px 24px rgba(0,0,0,.5);
  animation:btEnd .45s ease-out both}
.bt-end .ei{flex:none;width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;
  background:radial-gradient(circle at 35% 30%,#fff3c0,var(--ec,#ffd98a) 55%,#8a5a18);box-shadow:inset 0 -3px 0 rgba(0,0,0,.25)}
.bt-end .ei img{width:26px;height:26px;transform:scaleX(-1)}
.bt-end .et{display:flex;flex-direction:column;align-items:flex-start;line-height:1.1;text-align:left}
.bt-end .et small{font-size:11px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:var(--ec,#ffd98a)}
.bt-end .et b{font-size:19px;font-weight:900}
.bt-end .ar{margin-left:auto;font-size:20px;font-weight:900;color:var(--ec,#ffd98a);animation:btNudge 1.2s ease-in-out infinite}
.bt-end:active{transform:translateX(-50%) translateY(3px)}
@keyframes btEnd{from{opacity:0;transform:translate(-50%,16px) scale(.92)}to{opacity:1;transform:translateX(-50%)}}
@keyframes btNudge{50%{transform:translateX(4px)}}
.bt-ward{position:absolute;border-radius:50%;border:3px solid #ffd98a;box-shadow:0 0 18px #ffd98a,inset 0 0 18px rgba(255,217,138,.6);
  pointer-events:none;z-index:6;animation:btWard 1.75s ease-out both}
@keyframes btWard{0%{opacity:0;transform:scale(.3)}22%{opacity:1;transform:scale(1)}74%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.3)}}
.bt-hand{position:absolute;image-rendering:pixelated;pointer-events:none;z-index:7;filter:drop-shadow(0 4px 0 rgba(0,0,0,.35));
  animation:btHand 1.75s ease-out both}
@keyframes btHand{0%{opacity:0;transform:translateY(60%) scale(.7)}14%{opacity:1;transform:translateY(-4%) scale(1.03)}
  20%{opacity:1;transform:translateY(0) scale(1)}22%{transform:translateX(0) scale(1)}27%{transform:translateX(-6%) scale(1.06)}
  40%{transform:translateX(0) scale(1)}74%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(30%) scale(.9)}}
`;

let installed = false;

export function installBattleStyles() {
  if (installed) return;
  installed = true;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
}
