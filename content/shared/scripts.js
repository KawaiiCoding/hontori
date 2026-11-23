/*
 * shared/scripts.js
 * Job: scripts every chapter uses: fishing at any water, the fisher's lesson and contest, the shop service.
 */

export default {
  'shared.water': [
    {
      if: { not: { ext: 'spell', has: 'fish' } },
      then: [
        { say: 'shared.fish.1', who: 'kid' },
        {
          if: { not: 'fish:hint' },
          then: [{ flag: 'fish:hint' }, { say: 'shared.fish.2', who: 'companion' }]
        },
        { stop: true }
      ]
    },
    {
      choose: [
        { text: 'shared.fish.opt.fish', desc: 'shared.fish.opt.fish.desc', then: [] },
        { text: 'shared.fish.opt.no', then: [{ stop: true }] }
      ],
      cancel: 1
    },
    { run: 'shared.fish.cast' },
    {
      branch: [
        { if: { var: 'cast.kind', eq: 'none' }, then: [{ say: 'shared.fish.3', who: 'kid' }] },
        {
          if: { var: 'cast.kind', eq: 'hontori' },
          then: [
            { say: 'shared.fish.4', who: 'kid' },
            { battle: { wild: { kind: { var: 'cast.hontori' }, level: { var: 'cast.level' } } } }
          ]
        },
        { if: { var: 'cast.kind', eq: 'fish' }, then: [{ run: 'shared.fish.keep' }] }
      ]
    }
  ],
  'shared.fish.cast': [
    {
      if: { ext: 'mana', lt: 1 },
      then: [{ say: 'shared.fish.5', who: 'companion' }, { set: 'cast.kind', to: 'nomana' }, { stop: true }]
    },
    {
      if: { var: 'contest', eq: true },
      then: [{ ext: 'draw', sigil: 'fish', text: 'shared.fish.draw.contest' }],
      else: [{ ext: 'draw', sigil: 'fish', text: 'shared.fish.draw' }]
    },
    { ext: 'cast', contest: { var: 'contest' }, as: 'cast' }
  ],
  'shared.fish.keep': [
    { give: { var: 'cast.fish' }, quiet: true },
    { sound: 'pickup' },
    {
      helper: 'fishcatch',
      title: 'shared.fish.helper.catch.title',
      text: 'shared.fish.helper.catch',
      icon: 'water'
    },
    { say: 'shared.fish.6', who: 'kid', params: { fish: { var: 'cast.name' }, kg: { var: 'cast.kg' } } }
  ],
  'shared.svc.fisher': [
    {
      if: { not: { ext: 'spell', has: 'fish' } },
      then: [
        { say: 'shared.fish.7', who: 'self' },
        { say: 'shared.fish.8', who: 'self' },
        { ext: 'draw', sigil: 'fish', text: 'shared.fish.draw.learn', params: { fisher: { obj: 'name' } } },
        { ext: 'learn', spell: 'fish' },
        { say: 'shared.fish.9', who: 'self' },
        { say: 'shared.fish.10', who: 'self' },
        { stop: true }
      ]
    },
    {
      if: { flag: 'fish:contest', is: 'today' },
      then: [{ say: 'shared.fish.11', who: 'self' }, { stop: true }]
    },
    { say: 'shared.fish.12', who: 'self' },
    {
      choose: [
        { text: 'shared.fish.opt.contest', desc: 'shared.fish.opt.contest.desc', then: [] },
        { text: 'shared.fish.opt.notoday', then: [{ say: 'shared.fish.13', who: 'self' }, { stop: true }] }
      ],
      cancel: 1
    },
    { flag: 'fish:contest', value: 'today' },
    { set: 'best', to: 0 },
    { set: 'contest', to: true },
    {
      repeat: 3,
      until: { var: 'cast.kind', eq: 'nomana' },
      then: [
        { run: 'shared.fish.cast' },
        {
          branch: [
            {
              if: { var: 'cast.kind', eq: 'fish' },
              then: [{ set: 'best', max: { var: 'cast.kg' } }, { run: 'shared.fish.keep' }]
            },
            { if: { var: 'cast.kind', eq: 'nomana' }, then: [] }
          ],
          else: [{ say: 'shared.fish.14', who: 'kid' }]
        }
      ]
    },
    { set: 'his', to: { ext: 'fishWeight', index: 1 } },
    { say: 'shared.fish.15', who: 'self', params: { his: { var: 'his' }, best: { var: 'best' } } },
    {
      branch: [
        {
          if: { var: 'best', gt: { var: 'his' } },
          then: [{ money: 20, why: 'shared.fish.prize' }, { say: 'shared.fish.16', who: 'self' }]
        },
        { if: { var: 'best', gt: 0 }, then: [{ say: 'shared.fish.17', who: 'self' }] }
      ],
      else: [{ say: 'shared.fish.18', who: 'self' }]
    }
  ],
  'shared.fish.helper': [
    {
      helper: 'fishspot',
      title: 'shared.fish.helper.spot.title',
      text: 'shared.fish.helper.spot',
      icon: 'water'
    }
  ],
  'shared.svc.shop': [{ shop: 'self' }]
};
