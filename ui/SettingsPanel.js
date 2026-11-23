/*
 * SettingsPanel.js
 * Job: the Menu panel that the engine itself owns: saving, how to move, sound, and the way back
 * to the title to switch save slots. It also shows how any system adds a panel and its HUD button.
 * Icons and the word for a save slot come from the game's theme.
 *
 * Public API:
 *   registerSettings(game)   registers panel "settings" and HUD button "settings"
 */

const CONTROLS = {
  stick: { label: 'Controls: Joystick', desc: 'Stick to move, A to use, B to run' },
  tap: { label: 'Controls: Tap', desc: 'Tap to move, double tap to run' },
};

export function registerSettings(game) {
  const { icons } = game.theme;
  game.registry.add('panel', 'settings', {
    icon: icons.menu,
    /* read when the panel opens: the game's words may be set after this registration */
    get title() {
      return game.theme.words.menu || 'Menu';
    },
    build,
  });
  game.registry.add('hud.button', 'settings', {
    icon: icons.menu, label: game.theme.words.menu || 'Menu', order: 90, open: () => game.ui.openPanel('settings'),
  });
}

/* the game's words for the movement button, else the plain ones */
function controlWords(words, mode) {
  const plain = CONTROLS[mode];
  const key = mode === 'tap' ? 'menuTap' : 'menuStick';
  return { label: words[key] || plain.label, desc: words[`${key}Desc`] || plain.desc };
}

function build(panel, { game, close, refresh }) {
  const { icons, words } = game.theme;
  const row = panel.actions();
  panel.button(row, {
    icon: icons.save, label: words.save || 'Save', desc: words.saveDesc || 'Also saves by itself', kind: 'alt',
    onPress: () => {
      game.save.commit();
      close();
      game.ui.toast(words.saved || 'Game saved');
    },
  });
  const mode = game.input.mode;
  panel.button(row, {
    icon: icons.controls, ...controlWords(words, mode), kind: 'alt',
    onPress: () => {
      game.chooseControls(mode === 'tap' ? 'stick' : 'tap');
      refresh();
    },
  });
  const muted = game.settings.get('muted');
  panel.button(row, {
    icon: muted ? icons.soundOff : icons.soundOn, label: muted ? (words.soundOff || 'Sound off') : (words.soundOn || 'Sound on'), desc: words.soundDesc || 'Tap to switch', kind: 'alt',
    onPress: () => {
      game.setMuted(!muted);
      refresh();
    },
  });
  panel.button(row, {
    icon: icons.slot, label: `${words.slot} ${game.save.slot}`, desc: words.switchSlot, kind: 'alt',
    onPress: () => {
      game.save.commit();
      game.scenes.reset('title');
    },
  });
}
