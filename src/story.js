// Short, funny intro — overrides the long one in maps.js. Keep lines brief.
// The fox's voice: wise old rhymes... that keep going wrong.
window.H = window.H || {};
H.script = H.script || {};
H.script.intro = [
  { do: 'fade' },
  { do: 'shake' },
  { say: ['kid', 'You', 'Is... the fireplace coughing?'] },
  { do: 'spiritAppear' },
  { say: ['hontori', 'Hontori', 'Behold! A spirit, ancient and wise! ...Ow. Soot in my eyes.'] },
  { say: ['kid', 'You', 'A fox. Made of fire. On our rug.'] },
  { say: ['hontori', 'Hontori', 'Fire hontori! Rug is fine. Mostly. Smells toasty.'] },
  { say: ['hontori', 'Hontori', 'Magic is real, as old as the sea... or the moon? Big. Old. Trust me.'] },
  { say: ['kid', 'You', 'Mom and Dad will freak!'] },
  { say: ['hontori', 'Hontori', 'Then shh! Wise spirits are silent... *hrk* ...HURK!'] },
  { do: 'giveWand' },
  { say: ['kid', 'You', 'Did you just cough up a stick?'] },
  { say: ['hontori', 'Hontori', 'A sacred wand! I kept it safe. In my belly. Say: Velum Aperi!'] },
  { do: 'spell' },
  { say: ['hontori', 'Hontori', 'The veil is lifted! I planned that. Mostly. Snacks?'] },
];
