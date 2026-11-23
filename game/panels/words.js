/*
 * words.js  (Hontori: panels)
 * Job: the words of the title screen and the HUD from text ids instead of plain English in the
 * theme, so they follow the language like every other string.
 *
 * Public API:
 *   applyThemeWords(game, roster)   fills game.theme.title (name, tagline, hint) and game.theme.words
 *        (weather, slot, newSlot, emptySlot, switchSlot, and for the title's movement choice and the
 *        Menu: controls, controlsLater, stick, stickDesc, tap, tapDesc, menu, save, saveDesc, saved,
 *        menuStick, menuStickDesc, menuTap, menuTapDesc, soundOn, soundOff, soundDesc)
 */

const TITLE = { name: 'shared.ui.title.name', tagline: 'shared.ui.title.tagline', hint: 'shared.ui.title.hint' };

const WORDS = {
  slot: 'shared.ui.title.slot', newSlot: 'shared.ui.title.newSlot', emptySlot: 'shared.ui.title.emptySlot',
  switchSlot: 'shared.ui.title.switchSlot', controls: 'shared.ui.title.controls', controlsLater: 'shared.ui.title.controls.later',
  stick: 'shared.ui.title.stick', stickDesc: 'shared.ui.title.stick.desc', tap: 'shared.ui.title.tap', tapDesc: 'shared.ui.title.tap.desc',
  menu: 'shared.ui.menu.title', save: 'shared.ui.menu.save', saveDesc: 'shared.ui.menu.save.desc', saved: 'shared.ui.menu.saved',
  menuStick: 'shared.ui.menu.stick', menuStickDesc: 'shared.ui.menu.stick.desc', menuTap: 'shared.ui.menu.tap',
  menuTapDesc: 'shared.ui.menu.tap.desc', soundOn: 'shared.ui.menu.soundOn', soundOff: 'shared.ui.menu.soundOff',
  soundDesc: 'shared.ui.menu.sound.desc',
};

const WEATHER = ['wind', 'rain', 'snow', 'fog'];

export function applyThemeWords(game, roster) {
  const theme = game.theme;
  if (!theme) return;
  theme.title = theme.title || {};
  for (const [key, id] of Object.entries(TITLE)) theme.title[key] = roster.text(id);
  theme.words = theme.words || {};
  for (const [key, id] of Object.entries(WORDS)) theme.words[key] = roster.text(id);
  theme.words.weather = { ...(theme.words.weather || {}) };
  for (const weather of WEATHER) theme.words.weather[weather] = roster.text(`shared.ui.weather.${weather}`);
}
