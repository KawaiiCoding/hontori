/*
 * ch2/index.js
 * Job: chapter 2, Whisperwood and Mossgrove: the Root Maze, Rootwood Hall and the Leaf Ring, the grey cloak, the Light in the Well.
 * laterFlags: flags a later chapter sets (the Rockslide quest waits for them).
 */

import people from './people.js';
import events from './events.js';
import scripts from './scripts.js';
import quests from './quests.js';
import trainers from './trainers.js';
import trials from './trials.js';
import shops from './shops.js';
import wild from './wild.js';
import interactions from './interactions.js';
import objects from './objects.js';
import puzzles from './puzzles.js';
import text from './text.en.js';

export default { id: 'ch2', title: 'ch2.quest.leaf', people, events, scripts, quests, trainers, trials, shops, wild, interactions, objects, puzzles, laterFlags: ['ch3:open'], text };
