/*
 * ch2/people.js
 * Job: everyone in Mossgrove, Rootwood Hall and the Root Maze (schema section 3). Rowan and Wren arrive here
 * from chapter 1 through their phases. The grey cloak appears only through a spawn command.
 */

export default [
  {
    id: 'ranger_moss',
    name: 'ch2.name.ranger_moss',
    look: 'ranger_moss',
    at: { map: 'whisperwood', x: 26, y: 37, dir: 2 },
    lines: ['ch2.p.ranger_moss.1', 'ch2.p.ranger_moss.2']
  },
  {
    id: 'burr',
    name: 'ch2.name.burr',
    look: 'burr',
    at: { map: 'mossgrove', x: 8, y: 17, dir: 0 },
    lines: ['ch2.p.burr.1', 'ch2.p.burr.2'],
    schedule: [
      { from: 7, to: 18 },
      { from: 18, to: 7, map: 'moss_house1', x: 5, y: 6, dir: 0, lines: ['ch2.p.burr.3', 'ch2.p.burr.4'] }
    ]
  },
  {
    id: 'sorreljr',
    name: 'ch2.name.sorreljr',
    look: 'sorreljr',
    at: { map: 'mossgrove', x: 30, y: 17, dir: 2 },
    lines: ['ch2.p.sorreljr.1', 'ch2.p.sorreljr.2']
  },
  {
    id: 'lin',
    name: 'ch2.name.lin',
    look: 'lin',
    at: { map: 'mossgrove', x: 29, y: 6, dir: 3 },
    lines: ['ch2.p.lin.1'],
    fixed: true,
    service: 'shared.svc.fisher'
  },
  {
    id: 'fern',
    name: 'ch2.name.fern',
    look: 'warden',
    at: { map: 'rootwood_hall', x: 13, y: 12, dir: 0 },
    lines: ['ch2.p.fern.1', 'ch2.p.fern.2']
  },
  {
    id: 'bryn',
    name: 'ch2.name.bryn',
    look: 'apprentice',
    at: { map: 'rootwood_hall', x: 13, y: 15, dir: 0 },
    lines: ['ch2.p.bryn.1', 'ch2.p.bryn.2']
  },
  {
    id: 'ivo',
    name: 'ch2.name.ivo',
    look: 'ivo',
    at: { map: 'rootwood_gate', x: 14, y: 11, dir: 2 },
    lines: ['ch2.p.ivo.1', 'ch2.p.ivo.2'],
    service: 'ch2.svc.maze'
  },
  {
    id: 'pell',
    name: 'ch2.name.pell',
    look: 'pell',
    at: { map: 'moss_house2', x: 3, y: 3, dir: 0 },
    lines: ['ch2.p.pell.1', 'ch2.p.pell.2'],
    service: 'shared.svc.shop'
  },
  {
    id: 'pip_pell',
    name: 'ch2.name.pip_pell',
    look: 'pip',
    at: { map: 'moss_house2', x: 6, y: 6, dir: 0 },
    lines: ['ch2.p.pip_pell.1', 'ch2.p.pip_pell.2']
  },
  {
    id: 'greycloak',
    name: 'ch2.name.greycloak',
    look: 'greycloak',
    at: null,
    lines: ['ch2.p.greycloak.1'],
    spawned: true
  }
];
