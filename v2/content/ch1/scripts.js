/*
 * ch1/scripts.js
 * Job: the services of chapter 1: Madam Sorrel's lessons, the classmates' duels, Big Bo's ramen and guest bed.
 */

export default {
  'ch1.sorrel.teach': [
    { set: 'again', to: { pick: [['c1:lesson:bind', 1]], else: 0 } },
    { say: 'ch1.sorrel.1', who: 'sorrel' },
    { say: 'ch1.sorrel.2', who: 'sorrel' },
    { say: 'ch1.sorrel.3', who: 'sorrel' },
    { say: 'ch1.sorrel.4', who: 'sorrel' },
    { ext: 'draw', sigil: 'bind', text: 'ch1.sorrel.5' },
    { flag: 'c1:lesson:bind' },
    { ext: 'learn', spell: 'bind' },
    { sound: 'sparkle' },
    { fx: 'magic', n: 14, dy: -10 },
    {
      if: { var: 'again', eq: 1 },
      then: [
        { toast: 'ch1.sorrel.6', params: { lesson: 'shared.spell.bind' } },
        { say: 'ch1.sorrel.7', who: 'sorrel' }
      ],
      else: [
        { toast: 'ch1.sorrel.8', params: { lesson: 'shared.spell.bind' } },
        { say: 'ch1.sorrel.9', who: 'sorrel' },
        { if: { companion: true }, then: [{ say: 'ch1.sorrel.10', who: 'companion' }] }
      ]
    }
  ],
  'ch1.sorrel.wheel': [
    { say: 'ch1.sorrel.11', who: 'sorrel' },
    { say: 'ch1.sorrel.12', who: 'sorrel' },
    { say: 'ch1.sorrel.13', who: 'sorrel' },
    { say: 'ch1.sorrel.14', who: 'sorrel' },
    { open: 'blackboard' },
    { if: { not: 'c1:lesson:wheel' }, then: [{ flag: 'c1:lesson:wheel' }, { toast: 'ch1.sorrel.15' }] }
  ],
  'ch1.sorrel.care': [
    { say: 'ch1.sorrel.16', who: 'sorrel' },
    { say: 'ch1.sorrel.mend.1', who: 'sorrel' },
    { ext: 'draw', sigil: 'mend', text: 'ch1.sorrel.mend.2' },
    { ext: 'learn', spell: 'mend' },
    { say: 'ch1.sorrel.17', who: 'sorrel' },
    { say: 'ch1.sorrel.18', who: 'sorrel' },
    { say: 'ch1.sorrel.19', who: 'sorrel' },
    { if: { companion: true }, then: [{ say: 'ch1.sorrel.22', who: 'companion' }] },
    { if: { not: 'c1:lesson:care' }, then: [{ flag: 'c1:lesson:care' }, { toast: 'ch1.sorrel.23' }] }
  ],
  'ch1.sorrel.graduate': [
    { flag: 'c1:graduated' },
    { give: 'novice_cert', quiet: true },
    { sound: 'sparkle' },
    { fx: 'sparkle', n: 24, dy: -10 },
    { toast: 'ch1.sorrel.24' },
    { say: 'ch1.sorrel.25', who: 'sorrel' },
    { say: 'ch1.sorrel.26', who: 'sorrel' },
    { say: 'ch1.sorrel.27', who: 'sorrel' },
    { if: { companion: true }, then: [{ say: 'ch1.sorrel.28', who: 'companion' }] }
  ],
  'ch1.sorrel.after': [
    {
      branch: [
        {
          if: { all: [{ not: 'c1:graduated' }, { all: ['c1:lesson:bind', 'c1:duel:cole', 'c1:duel:mira'] }] },
          then: [{ run: 'ch1.sorrel.graduate' }]
        },
        {
          if: { all: [{ not: 'c1:lesson:bind' }, { not: { any: ['c1:duel:cole', 'c1:duel:mira'] } }] },
          then: [{ say: 'ch1.sorrel.29', who: 'sorrel' }]
        }
      ]
    }
  ],
  'ch1.sorrel.menu': [
    {
      choose: [
        {
          text: 'ch1.sorrel.opt.bind',
          params: {
            tag: {
              pick: [
                ['c1:lesson:bind', 'ch1.sorrel.tag.done'],
                [{ any: ['c1:duel:cole', 'c1:duel:mira'] }, 'ch1.sorrel.tag.next']
              ],
              else: 'ch1.sorrel.tag.duel'
            }
          },
          then: [
            {
              branch: [
                { if: 'c1:lesson:bind', then: [{ say: 'ch1.sorrel.known', who: 'sorrel' }] },
                {
                  if: { not: { any: ['c1:duel:cole', 'c1:duel:mira'] } },
                  then: [{ say: 'ch1.sorrel.30', who: 'sorrel' }]
                }
              ],
              else: [{ run: 'ch1.sorrel.teach' }, { run: 'ch1.sorrel.after' }]
            }
          ]
        },
        {
          text: 'ch1.sorrel.opt.wheel',
          params: { tag: { pick: [['c1:lesson:wheel', 'ch1.sorrel.tag.done']], else: 'shared.empty' } },
          then: [{ branch: [{ if: 'c1:lesson:wheel', then: [{ say: 'ch1.sorrel.known', who: 'sorrel' }] }], else: [{ run: 'ch1.sorrel.wheel' }, { run: 'ch1.sorrel.after' }] }]
        },
        {
          text: 'ch1.sorrel.opt.care',
          params: { tag: { pick: [['c1:lesson:care', 'ch1.sorrel.tag.done']], else: 'shared.empty' } },
          then: [{ branch: [{ if: 'c1:lesson:care', then: [{ say: 'ch1.sorrel.known', who: 'sorrel' }] }], else: [{ run: 'ch1.sorrel.care' }, { run: 'ch1.sorrel.after' }] }]
        },
        { text: 'ch1.sorrel.opt.leave', then: [{ say: 'ch1.sorrel.31', who: 'sorrel' }] }
      ],
      cancel: 3,
      highlight: { pick: [['c1:lesson:bind', -1]], else: 0 }
    }
  ],
  'ch1.svc.lessons': [
    {
      branch: [
        { if: 'c1:graduated', then: [{ say: 'ch1.sorrel.32', who: 'sorrel' }, { run: 'ch1.sorrel.menu' }] },
        {
          if: { all: ['c1:lesson:bind', 'c1:duel:cole', 'c1:duel:mira'] },
          then: [{ run: 'ch1.sorrel.graduate' }]
        }
      ],
      else: [{ run: 'ch1.sorrel.menu' }]
    }
  ],
  'ch1.svc.duel.cole': [
    {
      if: 'c1:duel:cole',
      then: [{ say: 'ch1.duel.again', who: 'cole' }],
      else: [{ say: 'ch1.duel.cole.1', who: 'cole' }]
    },
    {
      choose: [
        { text: 'ch1.duel.opt.cole', then: [] },
        { text: 'ch1.duel.opt.no', then: [{ say: 'ch1.duel.later', who: 'cole' }, { stop: true }] }
      ],
      cancel: 1
    },
    { set: 'first', to: { pick: [['c1:duel:cole', 0]], else: 1 } },
    {
      battle: { opponent: 'cole' },
      after: 'restore',
      fled: [{ say: 'ch1.duel.fled', who: 'cole' }],
      lost: [{ say: 'ch1.duel.cole.2', who: 'cole' }],
      won: [
        { flag: 'c1:duel:cole' },
        {
          if: { var: 'first', eq: 1 },
          then: [{ sound: 'confirm' }, { toast: 'ch1.duel.won', params: { name: 'ch1.name.cole' } }]
        },
        { say: 'ch1.duel.cole.3', who: 'cole' },
        {
          if: { var: 'first', eq: 1 },
          then: [
            {
              branch: [
                {
                  if: { not: 'c1:duel:mira' },
                  then: [
                    { if: { companion: true }, then: [{ say: 'ch1.duel.fox.first', who: 'companion' }] },
                    { toast: 'ch1.duel.unlocked' }
                  ]
                },
                {
                  if: { all: ['c1:lesson:bind', { not: 'c1:graduated' }] },
                  then: [{ if: { companion: true }, then: [{ say: 'ch1.duel.fox.ready', who: 'companion' }] }]
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  'ch1.svc.duel.mira': [
    {
      if: 'c1:duel:mira',
      then: [{ say: 'ch1.duel.again', who: 'mira' }],
      else: [{ say: 'ch1.duel.mira.1', who: 'mira' }]
    },
    {
      choose: [
        { text: 'ch1.duel.opt.mira', then: [] },
        { text: 'ch1.duel.opt.no', then: [{ say: 'ch1.duel.later', who: 'mira' }, { stop: true }] }
      ],
      cancel: 1
    },
    { set: 'first', to: { pick: [['c1:duel:mira', 0]], else: 1 } },
    {
      battle: { opponent: 'mira' },
      after: 'restore',
      fled: [{ say: 'ch1.duel.fled', who: 'mira' }],
      lost: [{ say: 'ch1.duel.mira.2', who: 'mira' }],
      won: [
        { flag: 'c1:duel:mira' },
        {
          if: { var: 'first', eq: 1 },
          then: [{ sound: 'confirm' }, { toast: 'ch1.duel.won', params: { name: 'ch1.name.mira' } }]
        },
        { say: 'ch1.duel.mira.3', who: 'mira' },
        {
          if: { var: 'first', eq: 1 },
          then: [
            {
              branch: [
                {
                  if: { not: 'c1:duel:cole' },
                  then: [
                    { if: { companion: true }, then: [{ say: 'ch1.duel.fox.first', who: 'companion' }] },
                    { toast: 'ch1.duel.unlocked' }
                  ]
                },
                {
                  if: { all: ['c1:lesson:bind', { not: 'c1:graduated' }] },
                  then: [{ if: { companion: true }, then: [{ say: 'ch1.duel.fox.ready', who: 'companion' }] }]
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  'ch1.svc.guestbed': [
    { say: 'ch1.bo.1', who: 'bo', params: { coins: { coins: { price: 'guest_bed' } } } },
    {
      choose: [
        { text: 'ch1.bo.opt.rest', then: [] },
        { text: 'ch1.bo.opt.no', then: [{ say: 'ch1.bo.2', who: 'bo' }, { stop: true }] }
      ],
      cancel: 1
    },
    {
      spend: { price: 'guest_bed' },
      fail: [{ say: 'ch1.bo.3', who: 'bo', params: { coins: { coins: { price: 'guest_bed' } } } }, { stop: true }]
    },
    { sound: 'sleep' },
    { fade: 800 },
    { rest: { hours: 8 } },
    { toast: 'ch1.bo.4' },
    { if: { companion: true }, then: [{ say: 'ch1.bo.5', who: 'companion' }] }
  ],
  'ch1.svc.ramen': [
    { say: 'ch1.bo.6', who: 'bo' },
    {
      choose: [
        {
          text: 'ch1.bo.opt.ramen',
          params: { price: { pick: [['ramenFree', { coins: { price: 'ramen' } }]], else: 'ch1.bo.free' } },
          then: []
        },
        {
          text: 'ch1.bo.opt.bed',
          params: { coins: { coins: { price: 'guest_bed' } } },
          then: [{ run: 'ch1.svc.guestbed' }, { stop: true }]
        },
        { text: 'ch1.bo.opt.none', then: [{ say: 'ch1.bo.7', who: 'bo' }, { stop: true }] }
      ],
      cancel: 2
    },
    {
      if: 'ramenFree',
      then: [
        {
          spend: { price: 'ramen' },
          fail: [{ say: 'ch1.bo.8', who: 'bo', params: { coins: { coins: { price: 'ramen' } } } }, { stop: true }]
        }
      ],
      else: [{ flag: 'ramenFree', value: 1 }, { toast: 'ch1.bo.9' }]
    },
    { heal: { hp: 'full', rest: true } },
    { ext: 'mana', set: 'full' },
    { sound: 'sparkle' },
    { fx: 'sparkle', n: 16, dy: -10 },
    { fx: 'smoke', n: 6, dy: -14 },
    { toast: 'ch1.bo.10' },
    { say: 'ch1.bo.11', who: 'bo' },
    { if: { companion: true }, then: [{ say: 'ch1.bo.12', who: 'companion' }] }
  ]
};
