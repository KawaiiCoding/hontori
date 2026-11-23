/*
 * ch1/trials.js
 * Job: Emberbrook Academy, the first small school (world rules 9, 10). Its gate test: the sight test, then the V.
 * It teaches one spell (the Binding Spiral) and gives no ring; graduating gives the Novice Certificate.
 */

export default {
  academy: {
    venue: 'school',
    door: { map: 'village', to: 'school' },
    passed: 'c1:academy',
    teacher: 'sorrel',
    teaches: ['bind'],
    entrance: [
      {
        type: 'sight',
        who: 'gatekeeper',
        intro: 'ch1.trial.1',
        ask: 'ch1.trial.2',
        wrong: 'ch1.trial.3',
        fail: 'ch1.trial.4',
        pass: 'ch1.trial.5',
        stage: 5,
        options: 3
      },
      {
        type: 'sigil',
        who: 'gatekeeper',
        sigil: 'veil',
        intro: 'ch1.trial.6',
        text: 'ch1.trial.7',
        pass: 'ch1.trial.8'
      }
    ],
    onPass: [{ toast: 'ch1.trial.9' }],
    award: { item: 'novice_cert', flag: 'c1:graduated', ring: null }
  }
};
