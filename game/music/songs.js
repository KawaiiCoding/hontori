/*
 * songs.js
 * Job: the new tunes of chapters 3 to 7, written in the song format of the current game's synthesizer
 * (src/audio.js, SONGS): { bpm, bpb, style, transpose, form, sections: { name: { ch, mel } } }.
 *   ch    one chord per bar, separated by spaces; "Bm,A" splits a bar in two (the first chord gets two beats)
 *   mel   notes as NAME:BEATS, "-" is a rest, "|" only marks a bar line for the reader
 * Every melody bar must add up to bpb beats (the synthesizer warns when it does not; tools check it too).
 *
 * Public API:
 *   SONGS   { kitewick, kitewick_night, gale_duel,
 *             tidewell, tidewell_night, deepbell_duel,
 *             coilhaven, storm_duel,
 *             stonehollow, stonehollow_night, bedrock_duel,
 *             cinderreach, cinderreach_night, hearth_below, crucible_duel, crucible_duel_2 }
 *
 * kitewick        a town tune for Kitewick, the hamlet on stilts: a lilting 3/4 in D, floating high, with the raised
 *                 fourth (G sharp) over the chord on the second step, the airy colour of a wide open sky.
 * kitewick_night  the same tune at night: slower, a step lower, fewer voices (the way village_night treats village).
 * gale_duel       the duel tune for Gale Loft: a steady 3/4 pulse in A dorian, clear plucked melody, nothing harsh.
 *                 The pulse comes in threes to match the wind that swaps your hontori every third turn.
 * tidewell        the harbour town of chapter 4: a slow barcarolle in A, rolling arpeggios like small waves under a
 *                 melody written in long dotted notes (two groups of three eighths to the bar). The flat seventh
 *                 (G natural) in the middle section is the salt in the air; the lower deck doubles the tune an octave
 *                 down like a bell heard through water.
 * tidewell_night  the same tune at night: slower, a step lower, fewer voices. It also plays on the Sunken Stair and in
 *                 Deepbell Hall, where the place is quiet and the bell is near.
 * deepbell_duel   the duel tune for Deepbell Hall: a 6/8 lilt in C sharp minor. Each phrase starts a step higher than
 *                 the last, the way the water climbs every round; the middle section tolls one long note a bar, the
 *                 sunken bell, and gives the fight a breath.
 * coilhaven       the workshop city of chapter 5: a bright, clockwork 4/4 in E flat. Quick tick-tick-tock figures
 *                 over a steady rolling arpeggio, like a wire humming; warm, busy and never loud. It plays at night
 *                 too, because the city never sleeps.
 * storm_duel      the duel tune for the Storm Works: 4/4 in C minor, the same tick figures as the city's tune turned
 *                 minor. Steady and a little quicker, with a held-note breath in the middle so three fights in a row
 *                 stay easy on the ear.
 * stonehollow     the cliff town of chapter 6: a slow, stately 4/4 in E minor. Every phrase is called and then answered
 *                 a little lower, like a voice coming back off a carved wall; the raised D sharp over the B chord is the
 *                 one bright note. The middle section is long notes, the carvings, and closes on B to ask for the answer.
 * stonehollow_night  the same tune at night: slower, a step lower, fewer voices. It also plays in the Listening Cave and
 *                 in Bedrock Hall, where the place is quiet and the stone is listening.
 * bedrock_duel    the duel tune for Bedrock Hall (wand to wand, no hontori on the field): 4/4 in E minor, slower than the
 *                 other duels, a ritual. A strike is a quick rising figure and a held note, the ward; the middle section
 *                 is steady quarter notes in waves, the shield being raised; the third section is the breath.
 * cinderreach     the volcano town of chapter 7: a warm 4/4 in B flat with the flat seventh (A flat) chord under it, the
 *                 smoky colour of a banked fire. Long held notes, the glow, then small steps falling, the embers; the
 *                 second pass flickers in long and short pairs.
 * cinderreach_night  the same tune at night: slower, a step lower, fewer voices, the volcano glowing in the dark.
 * hearth_below    the quiet tune of the lava cave and the empty nest: very slow, sparse, in F minor with long notes and room
 *                 around them. Each pass ends on F major, the light that was left on, and falls back to the minor.
 * crucible_duel   the duel tune for Ember Crucible (heat, where the wand does not refill): 4/4 in B minor with a dotted
 *                 flicker, a long note and a short one; the middle section sings in the major side, the third is the breath.
 * crucible_duel_2 the second phase of Brasa's fight: the same sections a whole step higher and a little quicker, with no
 *                 breath. Not placed by places.js (a row names one duel tune); the fight scene plays it with
 *                 audio.battle('crucible_duel_2') when the second phase begins, and the first tune again afterwards.
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

/* two groups of three eighths to the bar: the dotted notes are the long swell, the eighths the ripple on top */
const TIDEWELL = {
  /* the harbour wakes: the line climbs to the high D over three bars and settles by steps */
  A: {
    ch: 'A F#m D E A C#m D E7',
    mel: 'E5:1.5 C#5:.5 E5:.5 A5:.5 | A5:1.5 F#5:1.5 | D5:.5 F#5:.5 A5:.5 D6:1.5 | C#6:1 B5:.5 G#5:1.5 | ' +
         'A5:1.5 E5:.5 F#5:.5 A5:.5 | G#5:1.5 E5:.5 G#5:.5 B5:.5 | A5:1.5 F#5:.5 A5:.5 D6:.5 | D6:1.5 B5:1.5'
  },
  /* the answer starts high and falls, then climbs to the top E before it comes home to A */
  A2: {
    ch: 'A F#m D E A C#m Bm,E A',
    mel: 'C#6:1.5 B5:.5 A5:.5 E5:.5 | F#5:.5 A5:.5 C#6:1.5 A5:.5 | D6:1.5 A5:.5 F#5:.5 A5:.5 | G#5:1.5 B5:.5 E6:1 | ' +
         'C#6:1.5 A5:.5 E5:.5 A5:.5 | E5:.5 G#5:.5 B5:1 C#6:1 | D6:1 B5:1 G#5:1 | A5:1.5 E5:1.5'
  },
  /* the bell deck: long notes, G natural for the salt, a wave of arpeggios in the last bars */
  B: {
    ch: 'D A Bm F#m G D Bm,E E7',
    mel: 'F#5:1.5 A5:1.5 | C#6:1.5 A5:1.5 | D6:1.5 B5:1.5 | A5:1 C#6:1 F#5:1 | ' +
         'B5:1.5 G5:.5 B5:.5 D6:.5 | A5:1.5 F#5:.5 A5:.5 D6:.5 | F#5:1 B5:1 G#5:1 | B5:1.5 D6:.5 B5:.5 G#5:.5'
  }
};

/* the clockwork: a quick tick-tick-tock of three notes, then a long one that hums like a wire */
const COILHAVEN = {
  A: {
    ch: 'Eb Gm Ab Bb Cm Ab Fm,Bb Eb',
    mel: 'G5:.25 Bb5:.25 Eb6:.5 C6:1 Bb5:1 G5:1 | Bb5:.25 D6:.25 F6:.5 D6:1 Bb5:1 G5:1 | Ab5:1.5 C6:.5 Eb6:1 C6:1 | D6:1.5 F6:.5 D6:1 Bb5:1 | ' +
         'Eb5:.25 G5:.25 C6:.5 Eb6:1 D6:.5 C6:.5 G5:1 | Eb6:1.5 C6:.5 Ab5:1 Eb5:1 | Ab5:1 C6:1 D6:1 Bb5:1 | Eb6:2 Bb5:1 G5:1'
  },
  /* the same bars as little runs: the tick figure walks up a step each time it comes round */
  A2: {
    ch: 'Eb Gm Ab Bb Cm Ab Fm,Bb Eb',
    mel: 'Eb6:.5 Bb5:.5 G5:.5 Bb5:.5 Eb6:1 G5:1 | Bb5:.5 D6:.5 G5:.5 D6:.5 Bb5:1 G5:1 | C6:.25 Eb6:.25 Ab5:.5 C6:1.5 Eb6:.5 C6:1 | D6:.25 F6:.25 Bb5:.5 D6:1.5 F6:.5 D6:1 | ' +
         'Eb6:1 C6:.5 G5:.5 C6:.5 Eb6:.5 G5:1 | Eb6:1 Ab5:.5 C6:.5 Eb6:1.5 C6:.5 | Ab5:.5 C6:.5 F6:1 D6:1 F6:.5 D6:.5 | Eb6:1.5 Bb5:.5 G5:2'
  },
  /* the long wires: held notes and wider steps over a darker turn through C minor */
  B: {
    ch: 'Cm Fm Bb Eb Ab Fm Gm,Bb Bb7',
    mel: 'C6:1.5 Eb6:.5 G5:1 Eb5:1 | Ab5:1.5 C6:.5 F6:1 Eb6:1 | D6:1.5 F6:.5 D6:1 Bb5:1 | G5:1 Bb5:1 Eb6:2 | ' +
         'Eb6:1.5 C6:.5 Ab5:1 C6:1 | F5:.5 Ab5:.5 C6:1 F6:2 | D6:1 Bb5:1 D6:.5 F6:.5 D6:1 | Ab5:2 F5:1 D5:1'
  }
};

/* the carved stone: each phrase is called and then answered a step lower, like a voice coming back off a cliff */
const STONEHOLLOW = {
  /* the call rises, the answer falls; the same shape comes again a third lower. The raised leading tone (D sharp) over
     the B chord is the one bright note in the minor, the light in a carved window. */
  A: {
    ch: 'Em D C D Em G Am,B Em',
    mel: 'E5:1 G5:1 B5:2 | A5:1 F#5:1 D5:2 | C5:1 E5:1 G5:2 | A5:1.5 F#5:.5 D5:2 | ' +
         'B5:1.5 G5:.5 E5:2 | D5:1 G5:1 B5:2 | C6:1 A5:1 F#5:1 D#5:1 | E5:3 B4:1'
  },
  /* the same bars sung higher, each phrase reaching a little further before it settles */
  A2: {
    ch: 'Em D C D Em G Am,B Em',
    mel: 'B5:1 E6:1 D6:1 B5:1 | A5:1 D6:1 A5:2 | G5:1 C6:1 E6:2 | D6:1.5 A5:.5 F#5:2 | ' +
         'G5:1 B5:1 E6:2 | D6:1.5 B5:.5 G5:2 | A5:1 C6:1 B5:1 D#6:1 | E6:2 B5:1 E5:1'
  },
  /* the carvings: long notes, a bright turn through C and G, and a close on the B chord that asks to be answered */
  B: {
    ch: 'C G D Em C G Am,D B',
    mel: 'E5:2 G5:1 C6:1 | B5:2 G5:1 D5:1 | F#5:2 A5:1 D6:1 | B5:3 G5:1 | ' +
         'C6:1.5 G5:.5 E5:2 | B5:1 D6:2 B5:1 | A5:1 C6:1 D6:1 F#5:1 | F#5:2 D#5:1 B4:1'
  }
};

/* the smoky colour: the flat seventh chord (A flat in B flat) glows under the tune the way a banked fire does */
const CINDERREACH = {
  /* each phrase starts on a long held note, the glow, and the rest are the small embers falling after it */
  A: {
    ch: 'Bb Ab Eb F Bb Gm Eb,F Bb',
    mel: 'D6:2 F6:1 D6:.5 C6:.5 | Eb6:1.5 C6:.5 Ab5:2 | Bb5:1 G5:1 Eb5:2 | C6:1.5 A5:.5 F5:2 | ' +
         'D6:1 F6:1 Bb5:1 D6:1 | D6:1.5 Bb5:.5 G5:1 Bb5:1 | G5:1 Bb5:1 C6:1 A5:1 | Bb5:3 F5:1'
  },
  /* the flicker: long and short pairs, the dotted figure of a flame, then the same settling steps */
  A2: {
    ch: 'Bb Ab Eb F Bb Gm Eb,F Bb',
    mel: 'F6:1.5 D6:.5 C6:.5 Bb5:.5 D6:1 | Eb6:1.5 C6:.5 Ab5:.5 C6:.5 Eb6:1 | Bb5:1.5 G5:.5 Eb5:.5 G5:.5 Bb5:1 | A5:1 C6:1 F6:2 | ' +
         'D6:1.5 C6:.5 Bb5:1 F5:1 | G5:1 Bb5:1 D6:1 Bb5:1 | Eb6:1 Bb5:1 C6:1 A5:1 | D6:2 Bb5:2'
  },
  /* the hearth: slower, wider notes, the whole town leaning toward the warm room; it ends on F to lead home to B flat */
  B: {
    ch: 'Eb Bb Cm Gm Ab Eb F F',
    mel: 'G5:2 Bb5:1 Eb6:1 | D6:2 F6:1 D6:1 | Eb6:1.5 C6:.5 G5:2 | D6:1 Bb5:1 G5:2 | ' +
         'C6:2 Eb6:1 C6:1 | Bb5:1 G5:1 Bb5:2 | C6:1.5 A5:.5 C6:1 F6:1 | A5:2 C6:2'
  }
};

/* a very quiet tune in F minor, a few long notes with room around them, like a cave remembering. The last bar of each
   pass turns to F major (the light that was left on) and falls back to the minor when the tune comes round. */
const HEARTH_BELOW = {
  A: {
    ch: 'Fm Db Ab Eb Fm Db Bbm,C F',
    mel: '-:1 C5:1 F5:2 | Ab5:2 F5:1.5 Db5:.5 | C5:1 Eb5:1 Ab5:2 | G5:2 Bb5:1 G5:1 | ' +
         'F5:2 Ab5:1 C6:1 | Bb5:1.5 Ab5:.5 F5:2 | Db6:1 Bb5:1 C6:1 G5:1 | A5:2 F5:2'
  },
  /* the empty nest: the same slow steps, the high notes held longer, nothing hurried */
  B: {
    ch: 'Db Ab Eb Bbm Db Ab Bbm,C F',
    mel: 'F5:2 Ab5:2 | C6:2 Ab5:2 | Bb5:2 G5:1 Eb5:1 | Db5:1 F5:1 Bb5:2 | ' +
         'Ab5:1.5 F5:.5 Db5:2 | Eb5:2 C5:1 Eb5:1 | Db5:1 F5:1 E5:1 G5:1 | A5:2 C6:2'
  }
};

/* wand to wand: a strike is a quick rising figure and a held note, the ward; each bar answers the one before */
const BEDROCK_DUEL = {
  A: {
    ch: 'Em G D Am Em C B Em',
    mel: 'E5:.25 G5:.25 B5:.5 E6:2 -:1 | B5:2 G5:1 D5:1 | D5:.25 F#5:.25 A5:.5 D6:2 -:1 | C6:2 A5:1 E5:1 | ' +
         'E5:.5 G5:.5 B5:.5 E6:.5 D6:1 B5:1 | C6:1.5 G5:.5 E5:1 G5:1 | D#5:.5 F#5:.5 B5:1 A5:1 F#5:1 | E5:2 B4:1 E5:1'
  },
  /* the ward: steady quarter notes in waves, the shield being raised, then a lift to the top E */
  B: {
    ch: 'G D Em Bm C G Am,B7 Em',
    mel: 'D6:1 B5:1 G5:1 B5:1 | A5:1 F#5:1 D5:1 F#5:1 | G5:1 B5:1 E6:1 B5:1 | D6:2 F#5:2 | ' +
         'E6:1.5 C6:.5 G5:2 | D6:1.5 B5:.5 G5:1 D5:1 | A5:1 C6:1 D#6:1 F#5:1 | B5:2 E5:2'
  },
  /* the breath between rounds: two beats a note, so a long duel stays easy on the ear */
  C: {
    ch: 'Em C G D Em C B Em',
    mel: 'E5:2 G5:2 | G5:2 E5:2 | B5:2 D6:2 | A5:2 F#5:2 | G5:2 B5:2 | E6:2 C6:2 | D#6:2 F#5:2 | E5:4'
  }
};

/* the heat: a dotted flicker (a long note and a short one) rising and falling, in B minor, steady and never loud */
const CRUCIBLE_DUEL = {
  A: {
    ch: 'Bm G D A Bm G Em F#',
    mel: 'F#5:.75 B5:.25 D6:1.5 B5:.5 F#5:1 | G5:.75 B5:.25 D6:1.5 B5:.5 G5:1 | A5:.75 D6:.25 A5:1.5 F#5:.5 D5:1 | E5:.75 A5:.25 C#6:1.5 A5:.5 E5:1 | ' +
         'D6:.75 F#6:.25 D6:1.5 B5:.5 F#5:1 | B5:.75 D6:.25 B5:1.5 G5:.5 D5:1 | G5:1 B5:1 E6:1 B5:1 | C#6:1 A#5:1 F#5:2'
  },
  /* the answer: the major side of B minor, long notes that sing over the same pulse */
  B: {
    ch: 'D A Bm G D A Em,F# Bm',
    mel: 'F#5:1.5 A5:.5 D6:2 | C#6:1.5 E6:.5 A5:2 | D6:1.5 B5:.5 F#5:2 | G5:1.5 B5:.5 D6:2 | ' +
         'A5:.75 F#5:.25 D5:1 F#5:1 A5:1 | C#6:.75 E6:.25 C#6:1 A5:2 | G5:1 B5:1 C#6:1 A#5:1 | B5:2 F#5:2'
  },
  /* the embers hold: two beats a note, so a fight where the wand does not refill can breathe */
  C: {
    ch: 'Bm G D A Bm G F# Bm',
    mel: 'B5:2 F#5:2 | D6:2 B5:2 | A5:2 F#5:2 | E5:2 C#6:2 | D6:2 B5:2 | B5:2 G5:2 | A#5:2 C#6:2 | B5:4'
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
  },
  tidewell: {
    bpm: 72, bpb: 3, style: 'pastoral', transpose: 0, form: ['A', 'A2', 'B', 'A2'],
    sections: TIDEWELL
  },
  tidewell_night: {
    bpm: 56, bpb: 3, style: 'nocturne', transpose: -2, form: ['A', 'B', 'A2'],
    sections: TIDEWELL
  },
  deepbell_duel: {
    bpm: 108, bpb: 3, style: 'duel', transpose: 0, form: ['A', 'B', 'C', 'A', 'B'],
    sections: {
      /* the tide coming in: each four bars starts a step above the last */
      A: {
        ch: 'C#m A E B C#m A F#m B',
        mel: 'E5:1.5 G#5:.5 C#6:1 | E6:1.5 C#6:.5 A5:1 | G#5:.5 B5:.5 E6:1.5 D#6:.5 | B5:1.5 F#5:.5 B5:1 | ' +
             'G#5:1.5 C#6:.5 E6:1 | E6:1.5 C#6:.5 E6:1 | A5:.5 C#6:.5 F#6:1 E6:.5 C#6:.5 | D#6:1.5 B5:1.5'
      },
      /* the surge: rising arpeggios that fall back in the second half of each bar */
      B: {
        ch: 'F#m C#m A E F#m E A B',
        mel: 'A5:1 C#6:1 F#6:1 | E6:1.5 C#6:.5 G#5:1 | A5:.5 C#6:.5 E6:1.5 C#6:.5 | B5:1.5 G#5:.5 E5:1 | ' +
             'C#6:1 A5:.5 F#5:.5 A5:1 | G#5:.5 B5:.5 E6:1.5 B5:.5 | C#6:1.5 A5:.5 C#6:.5 E6:.5 | D#6:1.5 F#6:.5 D#6:.5 B5:.5'
      },
      /* the bell: one long note a bar over the same pulse, so the fight can breathe */
      C: {
        ch: 'C#m A E B C#m A F#m B',
        mel: 'C#5:3 | E5:3 | G#5:3 | F#5:3 | G#5:1.5 E5:1.5 | A5:3 | C#6:1.5 A5:1.5 | B5:3'
      }
    }
  },
  coilhaven: {
    bpm: 100, bpb: 4, style: 'pastoral', transpose: 0, form: ['A', 'A2', 'B', 'A2'],
    sections: COILHAVEN
  },
  storm_duel: {
    bpm: 126, bpb: 4, style: 'duel', transpose: 0, form: ['A', 'B', 'C', 'A', 'B'],
    sections: {
      /* the city's tick figure in the minor, a clear plucked line over the steady pulse */
      A: {
        ch: 'Cm Ab Eb Bb Cm Ab Fm Bb',
        mel: 'C5:.25 Eb5:.25 G5:.5 C6:1 Bb5:.5 G5:.5 Eb5:1 | Ab5:.25 C6:.25 Eb6:.5 C6:1 Ab5:1 Eb5:1 | Bb5:1 G5:.5 Bb5:.5 Eb6:1.5 Bb5:.5 | D6:.5 F6:.5 D6:1 Bb5:1 F5:1 | ' +
             'G5:.25 C6:.25 Eb6:.5 D6:.5 C6:.5 G5:.5 Eb5:1.5 | Ab5:.5 C6:.5 Eb6:1 C6:1 Ab5:1 | F5:.5 Ab5:.5 C6:1 F6:1.5 Eb6:.5 | D6:1 Bb5:.5 F5:.5 Bb5:2'
      },
      /* the answer: the major side of C minor, longer notes that sing */
      B: {
        ch: 'Eb Bb Cm Gm Ab Eb Fm Bb',
        mel: 'G5:1.5 Bb5:.5 Eb6:2 | F6:1.5 D6:.5 Bb5:2 | G5:.5 C6:.5 Eb6:1 D6:1 C6:1 | D6:1 Bb5:1 G5:2 | ' +
             'Eb6:1.5 C6:.5 Ab5:.5 C6:.5 Eb6:1 | Bb5:1 G5:.5 Bb5:.5 Eb6:2 | C6:1 Ab5:.5 F5:.5 Ab5:1 C6:1 | D6:.5 F6:.5 D6:.5 Bb5:.5 F5:2'
      },
      /* the wires settle: two beats a note, so the fight can breathe between the rounds */
      C: {
        ch: 'Cm Ab Eb Bb Ab Eb Fm Bb',
        mel: 'G5:2 Eb5:2 | Eb5:2 C5:2 | G5:2 Bb5:2 | F5:2 D5:2 | Eb5:2 C6:2 | Bb5:2 G5:2 | C6:2 Ab5:2 | D6:2 Bb5:2'
      }
    }
  },
  stonehollow: {
    bpm: 80, bpb: 4, style: 'pastoral', transpose: 0, form: ['A', 'A2', 'B', 'A2'],
    sections: STONEHOLLOW
  },
  stonehollow_night: {
    bpm: 58, bpb: 4, style: 'nocturne', transpose: -2, form: ['A', 'B', 'A2'],
    sections: STONEHOLLOW
  },
  cinderreach: {
    bpm: 92, bpb: 4, style: 'pastoral', transpose: 0, form: ['A', 'A2', 'B', 'A2'],
    sections: CINDERREACH
  },
  cinderreach_night: {
    bpm: 62, bpb: 4, style: 'nocturne', transpose: -2, form: ['A', 'B', 'A2'],
    sections: CINDERREACH
  },
  hearth_below: {
    bpm: 52, bpb: 4, style: 'nocturne', transpose: 0, form: ['A', 'B', 'A'],
    sections: HEARTH_BELOW
  },
  bedrock_duel: {
    bpm: 100, bpb: 4, style: 'duel', transpose: 0, form: ['A', 'B', 'C', 'A', 'B'],
    sections: BEDROCK_DUEL
  },
  crucible_duel: {
    bpm: 112, bpb: 4, style: 'duel', transpose: 0, form: ['A', 'B', 'C', 'A', 'B'],
    sections: CRUCIBLE_DUEL
  },
  /* the second phase of Brasa's fight: the same tune a whole step higher and a little quicker, with no breath section
     (the way the common wild tune is the duel tune moved up). Played with audio.battle('crucible_duel_2'). */
  crucible_duel_2: {
    bpm: 122, bpb: 4, style: 'duel', transpose: 2, form: ['B', 'A', 'B', 'A'],
    sections: CRUCIBLE_DUEL
  }
};
