// Intro script — overrides the long one in maps.js.
// Voice: short and calm. The hontori speaks in gentle rhyme.
window.H = window.H || {};
H.script = H.script || {};
H.script.intro = [
  { do: 'fade' },
  { do: 'shake' },
  { say: ['kid', 'You', 'A sound... in the fireplace?'] },
  { do: 'spiritAppear' },
  { say: ['hontori', 'Hontori', 'From ash and flame, to you I came.'] },
  { say: ['kid', 'You', 'A fox... made of fire?'] },
  { say: ['hontori', 'Hontori', 'A hontori, a spirit true. The world has magic, old and new.'] },
  { say: ['hontori', 'Hontori', 'Most eyes are veiled and cannot see. But yours are open. Come with me.'] },
  { say: ['kid', 'You', 'My parents will freak.'] },
  { say: ['hontori', 'Hontori', 'Then soft and slow, so none may know.'] },
  { do: 'giveWand' },
  { say: ['hontori', 'Hontori', 'Take this wand. Draw a V, and say Velum Aperi.'] },
  { do: 'spell' },
  { say: ['hontori', 'Hontori', 'The veil is thin, the path is wide. At dawn we go, side by side.'] },
];
