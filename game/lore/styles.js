/*
 * styles.js  (Hontori: lore)
 * Job: the stylesheet of the book reader and the Library list, in the shapes and colours of the game's cards
 * (the theme's variables), with one warm paper tone for the page.
 *
 * Public API:
 *   installLoreStyles()   add the stylesheet to the page (once)
 *
 * Classes: .lr-dim (the dimmed screen), .lr-book (the reader's panel), .lr-page (the paper page, .lr-kind its
 *   small kind word), .lr-dots (page dots, i.on), .lr-new (the "new" mark on a Library row).
 */

const CSS = `
.lr-dim{background:var(--shade);display:flex;align-items:center;justify-content:center;
  padding:calc(var(--sa-t) + 10px) 10px calc(var(--sa-b) + 10px)}
.lr-book{position:relative;width:min(94%,380px);max-height:100%;overflow:auto;animation:lrIn .2s ease-out both}
.lr-book .ui-head h2{font-size:18px;line-height:1.2}
.lr-page{margin:6px 2px 10px;min-height:150px;padding:16px 16px 14px;border-radius:10px;
  background:linear-gradient(180deg,#f6ead0,#eadbb8);color:#4a3826;border:2px solid #c9ad7c;
  box-shadow:inset 0 0 18px rgba(120,84,40,.18);font-size:16px;font-weight:700;line-height:1.45;
  overflow-wrap:break-word;hyphens:auto}
.lr-kind{display:block;margin-bottom:6px;font-size:11px;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:#9a6a30}
.lr-dots{display:flex;justify-content:center;gap:7px;margin:0 0 10px}
.lr-dots i{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.22)}
.lr-dots i.on{background:var(--accent)}
.lr-book .ui-btn[disabled]{opacity:.4}
.lr-new{display:inline-block;margin-left:6px;padding:1px 6px;border-radius:8px;background:var(--accent);color:#2a1a08;
  font-size:10px;font-weight:900;letter-spacing:1px;text-transform:uppercase;vertical-align:middle}
@keyframes lrIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:none}}
`;

let installed = false;

export function installLoreStyles() {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  const style = document.createElement('style');
  style.dataset.owner = 'lore';
  style.textContent = CSS;
  document.head.appendChild(style);
}
