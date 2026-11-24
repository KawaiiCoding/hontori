/*
 * shared/extensions.js
 * Job: the Hontori extensions (schema.md section 14), declared as data so the checker can validate their
 * use without the game layer. args: the options each use must or may carry (? = optional).
 */

export default {
  command: {
    draw: { args: ['sigil:spell', 'text:text', 'twist?:string'] },
    learn: { args: ['spell:spell'] },
    mana: { args: ['set?', 'add?:number'] },
    ring: { args: ['element:element'] },
    cast: { args: ['contest?', 'as:string'] },
    addHontori: { args: ['kind:kind', 'level?:number'] },
    revealMap: { args: ['radius:number'] },
    capsule: { args: ['turn:string'] },
    kiteFlight: { args: ['mode?:string', 'to?', 'bring?:string'] },
    flight: { args: ['what:string', 'bring?:string'] },
    travel: { args: ['to', 'via?', 'seconds?:number', 'during?', 'after?'] },
    gauntlet: { args: ['gauntlet:string', 'won?', 'lost?'] },
    gauntletLeave: { args: ['gauntlet:string'] },
    chooseCarry: { args: ['n:number', 'title:text', 'sub?:text', 'confirm?:text'] },
    sanctum: { args: ['seal'] },
    toFront: { args: ['kind:kind'] }
  },
  condition: {
    spell: { args: ['has:spell'] },
    lead: { args: ['stage?:compare', 'level?:compare', 'element?:element'] },
    ring: { args: ['has:element'] },
    mana: { args: ['lte?:number', 'lt?:number', 'gte?:number'] },
    full: { args: [] },
    capsule: { args: ['done?', 'free?'] },
    gauntlet: { args: ['gauntlet:string', 'stage?:number'] },
    sanctum: { args: ['sealed?', 'count?'] },
    carries: { args: ['kind?:kind', 'element?:element'] }
  },
  value: {
    leadLevel: { args: ['add?:number', 'min?:number', 'none?:number'] },
    fishWeight: { args: ['index:number'] },
    capsule: { args: ['cost?'] }
  },
  battleRule: ['noCapture', 'noSwitch', 'sureBind', 'practice', 'windSwap', 'tideRise', 'noRest', 'wandDuel', 'heat'],
  testType: { sight: { args: ['who:person'] }, sigil: { args: ['sigil:spell'] }, vanes: { args: ['puzzle:string'] }, tide: { args: ['puzzle:string'] }, circuit: { args: ['puzzle:string'] }, braziers: { args: ['puzzle:string'] } },
  awardRule: { wandTrial: { args: ['sigil:spell', 'count:number', 'twist?:string'] }, ringDuel: { args: ['trainer:trainer'] } },
  elements: ['water', 'fire', 'wind', 'grass', 'electric', 'earth', 'dark', 'light']
};
