# Hontori

A top-down 2D tile RPG about a kid and the elemental spirits called hontori.

Play: serve this folder with any static server (for example `python3 -m http.server 8123`) and open it. It also runs straight from GitHub Pages; there is no build step for development.

- `index.html` is the page; `game/main.js` starts the game. The layout is described in `CLAUDE.md` and `docs/ARCHITECTURE.md`.
- `?scene=village&debug=1` starts on a map with the debug tools (see the header of `game/main.js`).
- Progress saves automatically on the device. The game plays offline once loaded.
- Release: `node tools/build_sheets.js` (when art changed), then `node tools/build_release.js` writes `dist/`. See `STORE_CHECKLIST.md`.
- `gallery.html` shows all hontori.
