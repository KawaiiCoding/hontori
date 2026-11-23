/*
 * shared/voices.js
 * Job: speakers who are not people on a map. color is the name colour in the dialog box;
 * look is the portrait ('lead' means the lead companion).
 */

export default {
  kid: { name: 'shared.voice.kid', look: 'kid', color: '#7cc8ff' },
  companion: { name: 'shared.voice.companion', look: 'lead', color: '#ffb04a', named: 'lead' },
  lumen: { name: 'shared.voice.lumen', look: 'light' },
  letter: { name: 'shared.voice.letter', look: null },
  orb: { name: 'shared.voice.orb', look: null },
  sign: { name: 'shared.voice.sign', look: null },
  lookColors: { kid: '#7cc8ff', hontori: '#ffb04a', mom: '#ff9fc2', dad: '#9fe0a0' },
  defaultColor: '#ffe08a'
};
