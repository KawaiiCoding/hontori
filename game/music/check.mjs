/*
 * check.mjs
 * Job: check the music data without a browser. Run: node game/music/check.mjs
 * Every song needs its form to name real sections, one chord per bar, chords the synthesizer can read, notes it can read,
 * and melody bars that add up to the beats in a bar. Every tune named in places.js must exist in songs.js.
 * Exits with code 1 and lists each problem when something is wrong.
 */

import { SONGS } from './songs.js';
import { PLACES } from './places.js';

const NOTE = /^[A-G][#b]?-?\d$/;
const CHORD = /^[A-G][#b]?m?7?$/;
const problems = [];
const bad = (message) => problems.push(message);

for (const [key, song] of Object.entries(SONGS)) {
  const where = (name) => `${key}.${name}`;
  if (!(song.bpm > 0) || !(song.bpb > 0)) bad(`${key}: bpm and bpb must be positive`);
  for (const name of song.form || []) if (!song.sections[name]) bad(`${key}: form names a missing section ${name}`);
  for (const [name, sec] of Object.entries(song.sections)) {
    const chords = sec.ch.split(' ').filter(Boolean);
    for (const bar of chords) for (const chord of bar.split(',')) if (!CHORD.test(chord)) bad(`${where(name)}: unreadable chord ${chord}`);
    let beats = 0;
    for (const tok of sec.mel.split(/\s+/)) {
      if (!tok || tok === '|') continue;
      const [note, len] = tok.split(':');
      if (note !== '-' && !NOTE.test(note)) bad(`${where(name)}: unreadable note ${tok}`);
      if (!(parseFloat(len) > 0)) bad(`${where(name)}: unreadable length ${tok}`);
      beats += parseFloat(len);
    }
    if (Math.abs(beats - chords.length * song.bpb) > 0.001) {
      bad(`${where(name)}: melody has ${beats} beats, ${chords.length} bars of ${song.bpb} need ${chords.length * song.bpb}`);
    }
  }
}

for (const row of PLACES) {
  if (!Array.isArray(row.maps) || !row.maps.length) bad('places: a row has no maps');
  for (const field of ['day', 'night', 'duel', 'wild']) {
    if (row[field] && !SONGS[row[field]] && !['duel', 'wild'].includes(row[field])) bad(`places: ${field} names a missing song ${row[field]}`);
  }
}

if (problems.length) {
  console.log(problems.join('\n'));
  process.exit(1);
}
console.log(`music ok: ${Object.keys(SONGS).length} songs, ${PLACES.length} place rows`);
