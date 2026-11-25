/*
 * ch10/credits.js
 * Job: the credits after the ending story (content key `credits`, rolled by { ext: 'ending', credits: 'ch10' },
 * game/features/finale.js): sections of people (shown by their current name and face, so the grey cloak reads
 * Merrit), then every hontori the journey has met, in the order met, and a last line.
 */

export default {
  ch10: {
    title: 'ch10.credits.title',
    end: 'ch10.credits.end',
    sections: [
      { head: 'ch10.credits.family', people: ['mom', 'dad'] },
      { head: 'ch10.credits.friends', people: ['mira', 'cole', 'wren', 'pim', 'lisel', 'greycloak'] },
      { head: 'ch10.credits.wardens', people: ['fern', 'zephra', 'maren', 'volta', 'harrow', 'brasa', 'nox', 'aurel'] },
      { head: 'ch10.credits.teachers', people: ['sorrel', 'elder'] },
      { head: 'ch10.credits.archmage', people: ['orlen'] },
      { head: 'ch10.credits.hontori', kinds: 'seen' },
      { head: 'ch10.credits.made', lines: ['ch10.credits.made.1'] }
    ]
  }
};
