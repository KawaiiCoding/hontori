/*
 * theme.js
 * Job: Hontori's interface theme (the interface is specified in INTERFACES.md): the colours,
 * the font, the icons, the words and the title screen that give the engine's UI kit the look
 * and voice of this game. The values are the current game's (src/ui.js, src/menu.js, src/title.js).
 *
 * Public API:
 *   theme   { font, colors, icons, words, title }
 */

const NIGHT = { t: 0, time: 22, weather: 'clear', wind: 0.2, indoor: true };
const SITTING = { scale: 1, sit: true };

export const theme = {
  font: {
    family: 'Nunito,"M PLUS Rounded 1c",system-ui,-apple-system,"Segoe UI",sans-serif',
    url: '',
  },

  /* every entry becomes the CSS variable --<name> on the interface layer */
  colors: {
    'text': '#f4f1e8',
    'accent': '#ffd98a',
    'hud-bg': 'rgba(14,16,32,.8)',
    'hud-place': '#ffe7a8',
    'hud-clock': '#bfe3ff',
    'round-bg': 'rgba(18,20,40,.82)',
    'shade': 'rgba(5,6,14,.55)',
    'panel-top': '#1b1e3a',
    'panel-bottom': '#101226',
    'panel-edge': '#6f7fd8',
    'btn-top': '#a8dcff',
    'btn-bottom': '#7cc4fa',
    'btn-depth': '#2e5a8a',
    'btn-text': '#14162a',
    'alt-top': '#2e335e',
    'alt-bottom': '#23274a',
    'alt-depth': '#0a0c1c',
    'warn-text': '#ffb3a8',
    'gold-top': '#ffd98a',
    'gold-bottom': '#ff9a3c',
    'gold-depth': '#a8501c',
    'gold-text': '#2a1405',
    'toast-bg': 'rgba(255,236,170,.97)',
    'toast-text': '#2a1d05',
    'title-glow': '#2a2a5e',
    'title-mid': '#14143a',
    'title-edge': '#07081a',
    'title-text': '#fff4d6',
    'logo-top': '#fff4d6',
    'logo-mid': '#ffc56b',
    'logo-bottom': '#ff8a3c',
    'logo-depth': '#5a2a10',
    'slot-bg': 'rgba(20,22,48,.78)',
    'badge-top': '#ffd98a',
    'badge-bottom': '#e0a040',
    'badge-text': '#3a2410',
  },

  /* names the art provider's iconUrl() understands */
  icons: {
    close: 'close',
    menu: 'cog',
    save: 'scroll',
    controls: 'locate',
    soundOn: 'bell',
    soundOff: 'bell_off',
    slot: 'book',
    time: { dawn: 'dawn', day: 'day', dusk: 'dusk', night: 'night' },
    weather: { wind: 'wind', rain: 'rain', snow: 'snow', fog: 'fog' },
  },

  words: {
    weather: { wind: 'Windy', rain: 'Rain', snow: 'Snow', fog: 'Fog' },
    slot: 'Journey',
    newSlot: 'New journey',
    emptySlot: 'An empty page, waiting',
    switchSlot: 'Switch to another journey',
  },

  title: {
    name: 'Hontori',
    tagline: 'The veil is thin tonight',
    hint: 'Sound on for the full magic',
    /* the fire hontori sits by night light, as in the opening of the story */
    mascot: {
      pixels: 96,
      draw(ctx, art, seconds) {
        NIGHT.t = seconds;
        ctx.scale(2, 2);
        art.drawCreature(ctx, 'hontori', 24, 24, NIGHT, SITTING);
      },
    },
  },
};
