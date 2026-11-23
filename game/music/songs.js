/*
 * songs.js
 * Job: the new tunes of the Whistling Pass chapter, written in the song format of the current game's synthesizer
 * (src/audio.js, SONGS): { bpm, bpb, style, transpose, form, sections: { name: { ch, mel } } }.
 *   ch    one chord per bar, separated by spaces; "Bm,A" splits a bar in two (the first chord gets two beats)
 *   mel   notes as NAME:BEATS, "-" is a rest, "|" only marks a bar line for the reader
 * Every melody bar must add up to bpb beats (the synthesizer warns when it does not; tools check it too).
 *
 * Public API:
 *   SONGS   { kitewick, kitewick_night, gale_duel }
 *
 * kitewick        a town tune for Kitewick, the hamlet on stilts: a lilting 3/4 in D, floating high, with the raised
 *                 fourth (G sharp) over the chord on the second step, the airy colour of a wide open sky.
 * kitewick_night  the same tune at night: slower, a step lower, fewer voices (the way village_night treats village).
 * gale_duel       the duel tune for Gale Loft: a steady 3/4 pulse in A dorian, clear plucked melody, nothing harsh.
 *                 The pulse comes in threes to match the wind that swaps your hontori every third turn.
 */

const KITEWICK = {
  /* the first step of each phrase leaps a fifth (the kite taking the wind), then settles */
  A: {
    ch: 'D E Bm A D E Bm,A D',
    mel: 'D5:1.5 A5:.5 F#5:1 | E5:1 G#5:1 B5:1 | B5:1.5 A5:.5 F#5:1 | E5:1 C#5:.5 E5:.5 A5:1 | ' +
         'D5:1.5 A5:.5 D6:1 | C#6:.5 B5:.5 G#5:1 E5:1 | F#5:1 D5:1 E5:1 | D5:3'
  },
  /* the same bars lifted: the kite climbs and then drifts back down */
  A2: {
    ch: 'D E Bm A D E Bm,A D',
    mel: 'A5:1 F#5:.5 A5:.5 D6:1 | B5:1 G#5:1 E5:1 | D6:1.5 B5:.5 F#5:1 | E5:1 A5:1 C#6:1 | ' +
         'D6:1.5 A5:.5 F#5:1 | G#5:.5 B5:.5 E6:1 B5:1 | D6:1 B5:1 C#6:1 | D6:2 A5:1'
  },
  /* a rising bass and rising arpeggios, one step higher each bar: the wind picking up, then letting go */
  B: {
    ch: 'G A Bm C#m D Bm Em A7',
    mel: 'D5:1 G5:1 B5:1 | E5:1 A5:1 C#6:1 | F#5:1 B5:1 D6:1 | E6:1.5 C#6:.5 G#5:1 | ' +
         'D6:1.5 A5:.5 F#5:1 | D6:1 B5:1 F#5:1 | E5:1 G5:1 B5:1 | C#6:1.5 A5:.5 E5:1'
  }
};

export const SONGS = {
  kitewick: {
    bpm: 88, bpb: 3, style: 'pastoral', transpose: 0, form: ['A', 'A2', 'B', 'A2'],
    sections: KITEWICK
  },
  kitewick_night: {
    bpm: 64, bpb: 3, style: 'nocturne', transpose: -2, form: ['A', 'B', 'A2'],
    sections: KITEWICK
  },
  gale_duel: {
    bpm: 120, bpb: 3, style: 'duel', transpose: 0, form: ['A', 'B', 'A', 'C', 'B'],
    sections: {
      /* the theme: quick rising figures that break in the second half of each bar, like a gust */
      A: {
        ch: 'Am D Am D G C Em E7',
        mel: 'A4:.5 C5:.5 E5:1 A5:1 | A5:.5 F#5:.5 D5:1 F#5:1 | E5:.5 A5:.5 C6:1 B5:.5 A5:.5 | F#5:1.5 A5:.5 D6:1 | ' +
             'D6:.5 B5:.5 G5:1 B5:1 | E5:.5 G5:.5 C6:1 G5:.5 E5:.5 | G5:.5 B5:.5 E6:1 B5:1 | G#5:1 B5:.5 D6:.5 B5:1'
      },
      /* the answer: higher, warmer chords, the low octave joins the melody */
      B: {
        ch: 'C D Em Am C D E7 Am',
        mel: 'G5:1 E5:.5 G5:.5 C6:1 | D6:1 A5:.5 F#5:.5 A5:1 | G5:1 B5:.5 E6:.5 B5:1 | A5:1.5 E5:.5 C5:1 | ' +
             'E6:1 D6:.5 C6:.5 G5:1 | A5:.5 D6:.5 F#6:1 D6:1 | E6:1 D6:.5 B5:.5 G#5:1 | A5:2 E5:1'
      },
      /* the wind drops for a moment: long notes over the same pulse, so the fight can breathe */
      C: {
        ch: 'Am Em G D Am Em Bm E7',
        mel: 'E5:2 A5:1 | G5:2 B5:1 | D6:2 B5:1 | A5:2 F#5:1 | C6:2 E6:1 | D6:1.5 B5:.5 G5:1 | F#5:1 B5:1 D6:1 | G#5:1 B5:1 D6:1'
      }
    }
  }
};
