/*
 * shared/interactions.js
 * Job: what every prop, piece of furniture and building says and does when used (src/interact.js,
 * src/interiors_interact.js, src/hall_props.js, src/closeup.js, forage from src/money.js, cookbook and slingshot
 * from src/items.js, fish cooking from src/fishing.js). Handlers are tried in order (schema section 8);
 * at a stove a fish meal is offered first, then the cookbook meal, then the plain stove. Shaking a fruit tree
 * without the slingshot drops no apple in v2 (the apple was only a counter in the current game).
 * '*' is any type without its own entry; aliases share a handler and its visit count.
 */

export default {
  aliases: {
    house_b: 'house_a',
    house_c: 'house_a',
    house: 'house_a',
    fence: 'fence_h',
    stone_wall_v: 'stone_wall_h',
    lantern: 'lamp',
    flowers: 'flower_patch',
    inn: 'tavern',
    store: 'shop'
  },
  handlers: {
    fireplace: [
      {
        then: [
          { fx: 'ember', n: 10, dy: -6 },
          { sound: 'fire' },
          {
            if: { not: { companion: true } },
            then: [
              {
                cycle: [
                  [{ say: 'shared.prop.fireplace.1', who: 'kid' }],
                  [{ say: 'shared.prop.fireplace.2', who: 'kid' }],
                  [{ say: 'shared.prop.fireplace.3', who: 'kid' }]
                ],
                mode: 'step'
              },
              { stop: true }
            ]
          },
          { fx: 'smoke', n: 4, dy: -20 },
          {
            cycle: [
              [{ say: 'shared.prop.fireplace.4', who: 'kid' }],
              [{ say: 'shared.prop.fireplace.5', who: 'kid' }],
              [{ say: 'shared.prop.fireplace.6', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            cycle: [
              [{ say: 'shared.prop.fireplace.7', who: 'companion' }],
              [{ say: 'shared.prop.fireplace.8', who: 'companion' }],
              [{ say: 'shared.prop.fireplace.9', who: 'companion' }]
            ],
            mode: 'step'
          }
        ]
      }
    ],
    bed: [
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.bed.1', who: 'kid' }],
              [{ say: 'shared.prop.bed.2', who: 'kid' }],
              [{ say: 'shared.prop.bed.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          { sound: 'sleep' },
          { fade: 700 },
          { rest: { hours: 8 } },
          { fx: 'sparkle', n: 6, dy: -8 },
          {
            if: { companion: true },
            then: [
              {
                if: { hour: [19, 5] },
                then: [
                  {
                    random: [
                      [{ say: 'shared.prop.bed.4', who: 'companion' }],
                      [{ say: 'shared.prop.bed.5', who: 'companion' }]
                    ]
                  }
                ],
                else: [
                  {
                    random: [
                      [{ say: 'shared.prop.bed.6', who: 'companion' }],
                      [{ say: 'shared.prop.bed.7', who: 'companion' }]
                    ]
                  }
                ]
              }
            ],
            else: [{ say: 'shared.prop.bed.8', who: 'kid' }]
          }
        ]
      }
    ],
    kid_bed: [
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.kid_bed.1', who: 'kid' }],
              [{ say: 'shared.prop.kid_bed.2', who: 'kid' }],
              [{ say: 'shared.prop.kid_bed.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          { sound: 'sleep' },
          { fade: 700 },
          { rest: { hours: 8 } },
          { fx: 'sparkle', n: 6, dy: -8 },
          {
            if: { companion: true },
            then: [
              {
                if: { hour: [19, 5] },
                then: [
                  {
                    random: [
                      [{ say: 'shared.prop.kid_bed.4', who: 'companion' }],
                      [{ say: 'shared.prop.kid_bed.5', who: 'companion' }]
                    ]
                  }
                ],
                else: [
                  {
                    random: [
                      [{ say: 'shared.prop.kid_bed.6', who: 'companion' }],
                      [{ say: 'shared.prop.kid_bed.7', who: 'companion' }]
                    ]
                  }
                ]
              }
            ],
            else: [{ say: 'shared.prop.kid_bed.8', who: 'kid' }]
          }
        ]
      }
    ],
    piano: [
      {
        then: [
          { note: [60, 62, 64, 67, 69, 72, 74, 76], walk: true, count: [5, 7], gap: 170, fx: 'sparkle' },
          {
            cycle: [
              [{ say: 'shared.prop.piano.1', who: 'kid' }],
              [{ say: 'shared.prop.piano.2', who: 'kid' }],
              [{ say: 'shared.prop.piano.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.5 }] },
            then: [
              {
                random: [
                  [{ say: 'shared.prop.piano.4', who: 'companion' }],
                  [{ say: 'shared.prop.piano.5', who: 'companion' }]
                ]
              }
            ]
          }
        ]
      }
    ],
    cat_bed: [
      {
        then: [
          { cycle: [[{ sound: 'meow' }], [{ sound: 'purr' }]], mode: 'loop' },
          { fx: 'dust', n: 2 },
          {
            cycle: [
              [{ say: 'shared.prop.cat_bed.1', who: 'kid' }],
              [{ say: 'shared.prop.cat_bed.2', who: 'kid' }],
              [{ say: 'shared.prop.cat_bed.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.5 }] },
            then: [{ say: 'shared.prop.cat_bed.4', who: 'companion' }]
          }
        ]
      }
    ],
    bookshelf: [
      { if: { ext: 'read', book: 'here' }, then: [{ sound: 'page' }, { ext: 'read', book: 'here' }] },
      {
        then: [
          { sound: 'page' },
          { fx: 'dust', n: 3, dy: -10 },
          {
            random: [
              [{ say: 'shared.prop.bookshelf.1', who: 'kid' }],
              [{ say: 'shared.prop.bookshelf.2', who: 'kid' }],
              [{ say: 'shared.prop.bookshelf.3', who: 'kid' }],
              [{ say: 'shared.prop.bookshelf.4', who: 'kid' }],
              [{ say: 'shared.prop.bookshelf.5', who: 'kid' }],
              [{ say: 'shared.prop.bookshelf.6', who: 'kid' }],
              [{ say: 'shared.prop.bookshelf.7', who: 'kid' }],
              [{ say: 'shared.prop.bookshelf.8', who: 'kid' }]
            ]
          },
          {
            if: { all: [{ companion: true }, { chance: 0.3 }] },
            then: [
              {
                random: [
                  [{ say: 'shared.prop.bookshelf.9', who: 'companion' }],
                  [{ say: 'shared.prop.bookshelf.10', who: 'companion' }]
                ]
              }
            ]
          }
        ]
      }
    ],
    telescope: [
      {
        then: [
          { fx: 'sparkle', n: 5, dy: -12 },
          {
            if: { not: { hour: [19, 6] } },
            then: [
              {
                cycle: [
                  [{ say: 'shared.prop.telescope.1', who: 'kid' }],
                  [{ say: 'shared.prop.telescope.2', who: 'kid' }]
                ],
                mode: 'step'
              },
              { stop: true }
            ]
          },
          {
            cycle: [
              [{ say: 'shared.prop.telescope.3', who: 'kid' }],
              [{ say: 'shared.prop.telescope.4', who: 'kid' }],
              [{ say: 'shared.prop.telescope.5', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.4 }] },
            then: [{ say: 'shared.prop.telescope.6', who: 'companion' }]
          }
        ]
      }
    ],
    globe: [
      {
        then: [
          { sound: 'spin' },
          { fx: 'sparkle', n: 3, dy: -8 },
          {
            cycle: [
              [{ say: 'shared.prop.globe.1', who: 'kid' }],
              [{ say: 'shared.prop.globe.2', who: 'kid' }],
              [{ say: 'shared.prop.globe.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.35 }] },
            then: [{ say: 'shared.prop.globe.4', who: 'companion' }]
          }
        ]
      }
    ],
    toybox: [
      {
        then: [
          { sound: 'rattle' },
          { fx: 'dust', n: 3 },
          {
            cycle: [
              [{ say: 'shared.prop.toybox.1', who: 'kid' }],
              [{ say: 'shared.prop.toybox.2', who: 'kid' }],
              [{ say: 'shared.prop.toybox.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.35 }] },
            then: [{ say: 'shared.prop.toybox.4', who: 'companion' }]
          }
        ]
      }
    ],
    stove: [
      {
        if: { all: [{ has: 'cookbook' }, { has: { tag: 'fish' } }] },
        then: [
          { find: { tag: 'fish' }, as: 'fish' },
          {
            choose: [
              {
                text: 'shared.fish.cook.fish',
                params: { fish: { item: 'fish', field: 'name' } },
                desc: 'shared.fish.cook.fish.desc',
                then: []
              },
              { text: 'shared.fish.cook.else', then: [{ pass: true }] }
            ],
            cancel: 1
          },
          { take: { var: 'fish' } },
          { heal: { hp: 'full', rest: true } },
          { sound: 'sizzle' },
          { toast: 'shared.fish.cook.rested' },
          { say: 'shared.fish.19', who: 'kid', params: { fish: { item: 'fish', field: 'name' } } }
        ]
      },
      {
        if: { has: 'cookbook' },
        then: [
          {
            choose: [
              { text: 'shared.use.cook', icon: 'cookbook', desc: 'shared.use.cook.desc', then: [] },
              { text: 'shared.use.cook.look', then: [{ pass: true }] }
            ],
            cancel: 1
          },
          { sound: 'sizzle' },
          { fx: 'smoke', n: 6, dy: -12 },
          { heal: { hp: 'half' } },
          { toast: 'shared.use.cook.done' },
          {
            helper: 'item:cookbook',
            title: 'shared.item.cookbook.name',
            text: 'shared.use.cook.helper',
            icon: 'cookbook'
          },
          { say: 'shared.use.1', who: 'kid' }
        ]
      },
      {
        then: [
          { fx: 'smoke', n: 4, dy: -12 },
          { sound: 'sizzle' },
          {
            cycle: [
              [{ say: 'shared.prop.stove.1', who: 'kid' }],
              [{ say: 'shared.prop.stove.2', who: 'kid' }],
              [{ say: 'shared.prop.stove.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.5 }] },
            then: [
              {
                random: [
                  [{ say: 'shared.prop.stove.4', who: 'companion' }],
                  [{ say: 'shared.prop.stove.5', who: 'companion' }]
                ]
              }
            ]
          }
        ]
      }
    ],
    sink: [
      {
        then: [
          { sound: 'splash' },
          { fx: 'sparkle', n: 4, dy: -6 },
          {
            cycle: [
              [{ say: 'shared.prop.sink.1', who: 'kid' }],
              [{ say: 'shared.prop.sink.2', who: 'kid' }],
              [{ say: 'shared.prop.sink.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.5 }] },
            then: [{ say: 'shared.prop.sink.4', who: 'companion' }]
          }
        ]
      }
    ],
    clock: [
      {
        then: [
          { sound: 'tick' },
          { say: 'shared.prop.clock.1', who: 'kid', params: { time: { clock: true } } },
          {
            if: { all: [{ companion: true }, { chance: 0.3 }] },
            then: [{ say: 'shared.prop.clock.2', who: 'companion' }]
          }
        ]
      }
    ],
    window: [
      {
        then: [
          {
            branch: [
              { if: { weather: 'rain' }, then: [{ say: 'shared.prop.window.1', who: 'kid' }] },
              { if: { weather: 'snow' }, then: [{ say: 'shared.prop.window.2', who: 'kid' }] },
              {
                if: { hour: [19, 6] },
                then: [
                  {
                    cycle: [
                      [{ say: 'shared.prop.window.3', who: 'kid' }],
                      [{ say: 'shared.prop.window.4', who: 'kid' }],
                      [{ say: 'shared.prop.window.5', who: 'kid' }]
                    ],
                    mode: 'step'
                  },
                  {
                    if: { all: [{ companion: true }, { chance: 0.4 }] },
                    then: [{ say: 'shared.prop.window.6', who: 'companion' }]
                  }
                ]
              }
            ],
            else: [
              {
                cycle: [
                  [{ say: 'shared.prop.window.7', who: 'kid' }],
                  [{ say: 'shared.prop.window.8', who: 'kid' }],
                  [{ say: 'shared.prop.window.9', who: 'kid' }]
                ],
                mode: 'step'
              }
            ]
          }
        ]
      }
    ],
    wall_map: [
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.wall_map.1', who: 'kid' }],
              [{ say: 'shared.prop.wall_map.2', who: 'kid' }],
              [{ say: 'shared.prop.wall_map.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.4 }] },
            then: [{ say: 'shared.prop.wall_map.4', who: 'companion' }]
          }
        ]
      }
    ],
    stairs: [
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.stairs.1', who: 'kid' }],
              [{ say: 'shared.prop.stairs.2', who: 'kid' }],
              [{ say: 'shared.prop.stairs.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.5 }] },
            then: [{ say: 'shared.prop.stairs.4', who: 'companion' }]
          }
        ]
      }
    ],
    chest: [
      {
        then: [
          { sound: 'creak' },
          { cycle: [[{ fx: 'sparkle', n: 5, dy: -4 }], [{ fx: 'dust', n: 5, dy: -4 }]], mode: 'step' },
          {
            cycle: [
              [{ say: 'shared.prop.chest.1', who: 'kid' }],
              [{ say: 'shared.prop.chest.2', who: 'kid' }],
              [{ say: 'shared.prop.chest.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.35 }] },
            then: [{ say: 'shared.prop.chest.4', who: 'companion' }]
          }
        ]
      }
    ],
    table: [
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.table.1', who: 'kid' }],
              [{ say: 'shared.prop.table.2', who: 'kid' }],
              [{ say: 'shared.prop.table.3', who: 'kid' }]
            ],
            mode: 'step'
          }
        ]
      }
    ],
    dining_table: [
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.dining_table.1', who: 'kid' }],
              [{ say: 'shared.prop.dining_table.2', who: 'kid' }],
              [{ say: 'shared.prop.dining_table.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.5 }] },
            then: [{ say: 'shared.prop.dining_table.4', who: 'companion' }]
          }
        ]
      }
    ],
    chair: [
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.chair.1', who: 'kid' }],
              [{ say: 'shared.prop.chair.2', who: 'kid' }],
              [{ say: 'shared.prop.chair.3', who: 'kid' }]
            ],
            mode: 'step'
          }
        ]
      }
    ],
    armchair: [
      {
        then: [
          { fx: 'dust', n: 2 },
          {
            cycle: [
              [{ say: 'shared.prop.armchair.1', who: 'kid' }],
              [{ say: 'shared.prop.armchair.2', who: 'kid' }],
              [{ say: 'shared.prop.armchair.3', who: 'kid' }]
            ],
            mode: 'step'
          }
        ]
      }
    ],
    sofa: [
      {
        then: [
          { fx: 'dust', n: 2 },
          {
            cycle: [
              [{ say: 'shared.prop.sofa.1', who: 'kid' }],
              [{ say: 'shared.prop.sofa.2', who: 'kid' }],
              [{ say: 'shared.prop.sofa.3', who: 'kid' }]
            ],
            mode: 'step'
          }
        ]
      }
    ],
    cupboard: [
      {
        then: [
          { sound: 'creak' },
          {
            cycle: [
              [{ say: 'shared.prop.cupboard.1', who: 'kid' }],
              [{ say: 'shared.prop.cupboard.2', who: 'kid' }],
              [{ say: 'shared.prop.cupboard.3', who: 'kid' }]
            ],
            mode: 'step'
          }
        ]
      }
    ],
    plant: [
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.plant.1', who: 'kid' }],
              [{ say: 'shared.prop.plant.2', who: 'kid' }],
              [{ say: 'shared.prop.plant.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.35 }] },
            then: [{ say: 'shared.prop.plant.4', who: 'companion' }]
          }
        ]
      }
    ],
    potted_tree: [
      {
        then: [
          { fx: 'dust', n: 2, dy: -10 },
          {
            cycle: [
              [{ say: 'shared.prop.potted_tree.1', who: 'kid' }],
              [{ say: 'shared.prop.potted_tree.2', who: 'kid' }],
              [{ say: 'shared.prop.potted_tree.3', who: 'kid' }]
            ],
            mode: 'step'
          }
        ]
      }
    ],
    picture: [
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.picture.1', who: 'kid' }],
              [{ say: 'shared.prop.picture.2', who: 'kid' }],
              [{ say: 'shared.prop.picture.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.35 }] },
            then: [{ say: 'shared.prop.picture.4', who: 'companion' }]
          }
        ]
      }
    ],
    floor_lamp: [
      {
        then: [
          { sound: 'click' },
          { fx: 'sparkle', n: 3, dy: -18 },
          {
            cycle: [
              [{ say: 'shared.prop.floor_lamp.1', who: 'kid' }],
              [{ say: 'shared.prop.floor_lamp.2', who: 'kid' }],
              [{ say: 'shared.prop.floor_lamp.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.4 }] },
            then: [{ say: 'shared.prop.floor_lamp.4', who: 'companion' }]
          }
        ]
      }
    ],
    desk: [
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.desk.1', who: 'kid' }],
              [{ say: 'shared.prop.desk.2', who: 'kid' }],
              [{ say: 'shared.prop.desk.3', who: 'kid' }]
            ],
            mode: 'step'
          }
        ]
      }
    ],
    wardrobe: [
      {
        then: [
          { sound: 'creak' },
          {
            cycle: [
              [{ say: 'shared.prop.wardrobe.1', who: 'kid' }],
              [{ say: 'shared.prop.wardrobe.2', who: 'kid' }],
              [{ say: 'shared.prop.wardrobe.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.4 }] },
            then: [{ say: 'shared.prop.wardrobe.4', who: 'companion' }]
          }
        ]
      }
    ],
    dresser: [
      {
        then: [
          { sound: 'creak' },
          {
            cycle: [
              [{ say: 'shared.prop.dresser.1', who: 'kid' }],
              [{ say: 'shared.prop.dresser.2', who: 'kid' }],
              [{ say: 'shared.prop.dresser.3', who: 'kid' }]
            ],
            mode: 'step'
          }
        ]
      }
    ],
    counter: [
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.counter.1', who: 'kid' }],
              [{ say: 'shared.prop.counter.2', who: 'kid' }],
              [{ say: 'shared.prop.counter.3', who: 'kid' }]
            ],
            mode: 'step'
          }
        ]
      }
    ],
    firewood: [
      {
        then: [
          { fx: 'dust', n: 3 },
          {
            cycle: [
              [{ say: 'shared.prop.firewood.1', who: 'kid' }],
              [{ say: 'shared.prop.firewood.2', who: 'kid' }],
              [{ say: 'shared.prop.firewood.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.6 }] },
            then: [
              {
                random: [
                  [{ say: 'shared.prop.firewood.4', who: 'companion' }],
                  [{ say: 'shared.prop.firewood.5', who: 'companion' }]
                ]
              }
            ]
          }
        ]
      }
    ],
    candles: [
      {
        then: [
          { fx: 'ember', n: 3, dy: -8 },
          {
            cycle: [
              [{ say: 'shared.prop.candles.1', who: 'kid' }],
              [{ say: 'shared.prop.candles.2', who: 'kid' }],
              [{ say: 'shared.prop.candles.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.5 }] },
            then: [{ say: 'shared.prop.candles.4', who: 'companion' }]
          }
        ]
      }
    ],
    coat_rack: [
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.coat_rack.1', who: 'kid' }],
              [{ say: 'shared.prop.coat_rack.2', who: 'kid' }],
              [{ say: 'shared.prop.coat_rack.3', who: 'kid' }]
            ],
            mode: 'step'
          }
        ]
      }
    ],
    doormat: [
      {
        then: [
          { fx: 'dust', n: 2 },
          {
            cycle: [
              [{ say: 'shared.prop.doormat.1', who: 'kid' }],
              [{ say: 'shared.prop.doormat.2', who: 'kid' }],
              [{ say: 'shared.prop.doormat.3', who: 'kid' }]
            ],
            mode: 'step'
          }
        ]
      }
    ],
    hanging_pots: [
      {
        then: [
          { sound: 'clang' },
          { note: [72, 76, 79], count: 1 },
          { fx: 'sparkle', n: 2, dy: -10 },
          {
            cycle: [
              [{ say: 'shared.prop.hanging_pots.1', who: 'kid' }],
              [{ say: 'shared.prop.hanging_pots.2', who: 'kid' }],
              [{ say: 'shared.prop.hanging_pots.3', who: 'kid' }]
            ],
            mode: 'step'
          }
        ]
      }
    ],
    wall_shelf: [
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.wall_shelf.1', who: 'kid' }],
              [{ say: 'shared.prop.wall_shelf.2', who: 'kid' }],
              [{ say: 'shared.prop.wall_shelf.3', who: 'kid' }]
            ],
            mode: 'step'
          }
        ]
      }
    ],
    garland: [
      {
        then: [
          { fx: 'sparkle', n: 3, dy: -8 },
          {
            cycle: [
              [{ say: 'shared.prop.garland.1', who: 'kid' }],
              [{ say: 'shared.prop.garland.2', who: 'kid' }],
              [{ say: 'shared.prop.garland.3', who: 'kid' }]
            ],
            mode: 'step'
          }
        ]
      }
    ],
    herb_rack: [
      {
        then: [
          { fx: 'dust', n: 2 },
          {
            cycle: [
              [{ say: 'shared.prop.herb_rack.1', who: 'kid' }],
              [{ say: 'shared.prop.herb_rack.2', who: 'kid' }],
              [{ say: 'shared.prop.herb_rack.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.5 }] },
            then: [{ say: 'shared.prop.herb_rack.4', who: 'companion' }]
          }
        ]
      }
    ],
    laundry_basket: [
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.laundry_basket.1', who: 'kid' }],
              [{ say: 'shared.prop.laundry_basket.2', who: 'kid' }],
              [{ say: 'shared.prop.laundry_basket.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.4 }] },
            then: [{ say: 'shared.prop.laundry_basket.4', who: 'companion' }]
          }
        ]
      }
    ],
    tree: [
      { if: 'intro', then: [{ forage: 'tree' }] },
      {
        then: [
          { sound: 'rustle' },
          { fx: 'dust', n: 8, dy: -22 },
          { fx: 'dust', n: 3, dy: -4 },
          {
            cycle: [
              [{ say: 'shared.prop.tree.1', who: 'kid' }],
              [{ say: 'shared.prop.tree.2', who: 'kid' }],
              [{ say: 'shared.prop.tree.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.3 }] },
            then: [
              {
                random: [
                  [{ say: 'shared.prop.tree.4', who: 'companion' }],
                  [{ say: 'shared.prop.tree.5', who: 'companion' }]
                ]
              }
            ]
          }
        ]
      }
    ],
    pine: [
      { if: 'intro', then: [{ forage: 'pine' }] },
      {
        then: [
          { sound: 'rustle' },
          { fx: 'dust', n: 5, dy: -20 },
          {
            cycle: [
              [{ say: 'shared.prop.pine.1', who: 'kid' }],
              [{ say: 'shared.prop.pine.2', who: 'kid' }],
              [{ say: 'shared.prop.pine.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.3 }] },
            then: [{ say: 'shared.prop.pine.4', who: 'companion' }]
          }
        ]
      }
    ],
    fruit_tree: [
      { if: 'intro', then: [{ forage: 'fruit_tree' }] },
      {
        if: { all: [{ has: 'slingshot' }, { not: { mark: 'sling', is: 'today' } }] },
        then: [
          {
            choose: [
              { text: 'shared.use.sling', icon: 'slingshot', desc: 'shared.use.sling.desc', then: [] },
              { text: 'shared.use.sling.shake', then: [{ pass: true }] }
            ],
            cancel: 1
          },
          { mark: 'sling', value: 'today' },
          { sound: 'pickup' },
          { fx: 'dust', n: 6, dy: -14 },
          { heal: { hp: 5 } },
          { toast: 'shared.use.sling.done' },
          {
            helper: 'item:slingshot',
            title: 'shared.item.slingshot.name',
            text: 'shared.use.sling.helper',
            icon: 'slingshot'
          },
          { say: 'shared.use.2', who: 'kid' }
        ]
      },
      {
        then: [
          { sound: 'rustle' },
          { fx: 'dust', n: 8, dy: -22 },
          { fx: 'dust', n: 3, dy: -4 },
          {
            cycle: [
              [{ say: 'shared.prop.fruit_tree.1', who: 'kid' }],
              [{ say: 'shared.prop.fruit_tree.2', who: 'kid' }],
              [{ say: 'shared.prop.fruit_tree.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.3 }] },
            then: [
              {
                random: [
                  [{ say: 'shared.prop.fruit_tree.4', who: 'companion' }],
                  [{ say: 'shared.prop.fruit_tree.5', who: 'companion' }]
                ]
              }
            ]
          }
        ]
      }
    ],
    cherry_tree: [
      {
        then: [
          { sound: 'rustle' },
          { fx: 'sparkle', n: 10, dy: -22 },
          { fx: 'magic', n: 3, dy: -18 },
          {
            cycle: [
              [{ say: 'shared.prop.cherry_tree.1', who: 'kid' }],
              [{ say: 'shared.prop.cherry_tree.2', who: 'kid' }],
              [{ say: 'shared.prop.cherry_tree.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.4 }] },
            then: [{ say: 'shared.prop.cherry_tree.4', who: 'companion' }]
          }
        ]
      }
    ],
    bush: [
      { if: 'intro', then: [{ forage: 'bush' }] },
      {
        then: [
          { sound: 'rustle' },
          { fx: 'dust', n: 4 },
          {
            cycle: [
              [{ say: 'shared.prop.bush.1', who: 'kid' }],
              [{ say: 'shared.prop.bush.2', who: 'kid' }],
              [{ say: 'shared.prop.bush.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.3 }] },
            then: [{ say: 'shared.prop.bush.4', who: 'companion' }]
          }
        ]
      }
    ],
    butterfly_bush: [
      { if: 'intro', then: [{ forage: 'butterfly_bush' }] },
      {
        then: [
          { fx: 'magic', n: 6, dy: -8 },
          {
            cycle: [
              [{ say: 'shared.prop.butterfly_bush.1', who: 'kid' }],
              [{ say: 'shared.prop.butterfly_bush.2', who: 'kid' }],
              [{ say: 'shared.prop.butterfly_bush.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.35 }] },
            then: [{ say: 'shared.prop.butterfly_bush.4', who: 'companion' }]
          }
        ]
      }
    ],
    fence_h: [
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.fence_h.1', who: 'kid' }],
              [{ say: 'shared.prop.fence_h.2', who: 'kid' }],
              [{ say: 'shared.prop.fence_h.3', who: 'kid' }]
            ],
            mode: 'step'
          }
        ]
      }
    ],
    fence_v: [
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.fence_v.1', who: 'kid' }],
              [{ say: 'shared.prop.fence_v.2', who: 'kid' }],
              [{ say: 'shared.prop.fence_v.3', who: 'kid' }]
            ],
            mode: 'step'
          }
        ]
      }
    ],
    stone_wall_h: [
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.stone_wall_h.1', who: 'kid' }],
              [{ say: 'shared.prop.stone_wall_h.2', who: 'kid' }],
              [{ say: 'shared.prop.stone_wall_h.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.35 }] },
            then: [{ say: 'shared.prop.stone_wall_h.4', who: 'companion' }]
          }
        ]
      }
    ],
    lamp: [
      {
        then: [
          {
            if: { hour: [19, 6] },
            then: [
              { fx: 'ember', n: 4, dy: -24 },
              {
                cycle: [
                  [{ say: 'shared.prop.lamp.1', who: 'kid' }],
                  [{ say: 'shared.prop.lamp.2', who: 'kid' }],
                  [{ say: 'shared.prop.lamp.3', who: 'kid' }]
                ],
                mode: 'step'
              }
            ],
            else: [
              { fx: 'sparkle', n: 4, dy: -24 },
              {
                cycle: [
                  [{ say: 'shared.prop.lamp.4', who: 'kid' }],
                  [{ say: 'shared.prop.lamp.5', who: 'kid' }],
                  [{ say: 'shared.prop.lamp.6', who: 'kid' }]
                ],
                mode: 'step'
              }
            ]
          },
          {
            if: { all: [{ companion: true }, { chance: 0.4 }] },
            then: [{ say: 'shared.prop.lamp.7', who: 'companion' }]
          }
        ]
      }
    ],
    lantern_string: [
      {
        then: [
          { fx: 'sparkle', n: 5, dy: -14 },
          {
            cycle: [
              [{ say: 'shared.prop.lantern_string.1', who: 'kid' }],
              [{ say: 'shared.prop.lantern_string.2', who: 'kid' }],
              [{ say: 'shared.prop.lantern_string.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.5 }] },
            then: [{ say: 'shared.prop.lantern_string.4', who: 'companion' }]
          }
        ]
      }
    ],
    mailbox: [
      {
        then: [
          { sound: 'creak' },
          {
            cycle: [
              [{ say: 'shared.prop.mailbox.1', who: 'kid' }],
              [{ say: 'shared.prop.mailbox.2', who: 'kid' }],
              [{ say: 'shared.prop.mailbox.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.35 }] },
            then: [{ say: 'shared.prop.mailbox.4', who: 'companion' }]
          }
        ]
      }
    ],
    sign: [
      {
        then: [
          {
            if: { obj: { has: 'text' } },
            then: [{ say: { obj: 'text' }, who: 'sign' }],
            else: [
              {
                cycle: [[{ say: 'shared.prop.sign.1', who: 'kid' }], [{ say: 'shared.prop.sign.2', who: 'kid' }]],
                mode: 'step'
              }
            ]
          }
        ]
      }
    ],
    rock: [
      { if: 'intro', then: [{ forage: 'rock' }] },
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.rock.1', who: 'kid' }],
              [{ say: 'shared.prop.rock.2', who: 'kid' }],
              [{ say: 'shared.prop.rock.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.3 }] },
            then: [{ say: 'shared.prop.rock.4', who: 'companion' }]
          }
        ]
      }
    ],
    well: [
      {
        then: [
          { sound: 'splash' },
          { fx: 'sparkle', n: 6, dy: -6 },
          {
            cycle: [
              [{ say: 'shared.prop.well.1', who: 'kid' }],
              [{ say: 'shared.prop.well.2', who: 'kid' }],
              [{ say: 'shared.prop.well.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.45 }] },
            then: [
              {
                random: [
                  [{ say: 'shared.prop.well.4', who: 'companion' }],
                  [{ say: 'shared.prop.well.5', who: 'companion' }]
                ]
              }
            ]
          }
        ]
      }
    ],
    flowerbed: [
      { if: 'intro', then: [{ forage: 'flowerbed' }] },
      {
        then: [
          { fx: 'sparkle', n: 3 },
          {
            cycle: [
              [{ say: 'shared.prop.flowerbed.1', who: 'kid' }],
              [{ say: 'shared.prop.flowerbed.2', who: 'kid' }],
              [{ say: 'shared.prop.flowerbed.3', who: 'kid' }]
            ],
            mode: 'step'
          }
        ]
      }
    ],
    flower_patch: [
      { if: 'intro', then: [{ forage: 'flower_patch' }] },
      {
        then: [
          { fx: 'sparkle', n: 3 },
          {
            cycle: [
              [{ say: 'shared.prop.flower_patch.1', who: 'kid' }],
              [{ say: 'shared.prop.flower_patch.2', who: 'kid' }],
              [{ say: 'shared.prop.flower_patch.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.3 }] },
            then: [{ say: 'shared.prop.flower_patch.4', who: 'companion' }]
          }
        ]
      }
    ],
    garden_bed: [
      { if: 'intro', then: [{ forage: 'garden_bed' }] },
      {
        then: [
          { fx: 'dust', n: 2 },
          {
            cycle: [
              [{ say: 'shared.prop.garden_bed.1', who: 'kid' }],
              [{ say: 'shared.prop.garden_bed.2', who: 'kid' }],
              [{ say: 'shared.prop.garden_bed.3', who: 'kid' }]
            ],
            mode: 'step'
          }
        ]
      }
    ],
    bench: [
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.bench.1', who: 'kid' }],
              [{ say: 'shared.prop.bench.2', who: 'kid' }],
              [{ say: 'shared.prop.bench.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.35 }] },
            then: [{ say: 'shared.prop.bench.4', who: 'companion' }]
          }
        ]
      }
    ],
    barrel: [
      {
        then: [
          { sound: 'knock' },
          {
            cycle: [
              [{ say: 'shared.prop.barrel.1', who: 'kid' }],
              [{ say: 'shared.prop.barrel.2', who: 'kid' }],
              [{ say: 'shared.prop.barrel.3', who: 'kid' }]
            ],
            mode: 'step'
          }
        ]
      }
    ],
    crate: [
      {
        then: [
          { sound: 'knock' },
          {
            cycle: [
              [{ say: 'shared.prop.crate.1', who: 'kid' }],
              [{ say: 'shared.prop.crate.2', who: 'kid' }],
              [{ say: 'shared.prop.crate.3', who: 'kid' }]
            ],
            mode: 'step'
          }
        ]
      }
    ],
    mushroom_ring: [
      { if: 'intro', then: [{ forage: 'mushroom_ring' }] },
      {
        then: [
          { fx: 'magic', n: 8 },
          { sound: 'chime' },
          {
            cycle: [
              [{ say: 'shared.prop.mushroom_ring.1', who: 'kid' }],
              [{ say: 'shared.prop.mushroom_ring.2', who: 'kid' }],
              [{ say: 'shared.prop.mushroom_ring.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.6 }] },
            then: [{ say: 'shared.prop.mushroom_ring.4', who: 'companion' }]
          }
        ]
      }
    ],
    lilypad: [
      {
        then: [
          { fx: 'sparkle', n: 3 },
          { sound: 'splash' },
          {
            cycle: [
              [{ say: 'shared.prop.lilypad.1', who: 'kid' }],
              [{ say: 'shared.prop.lilypad.2', who: 'kid' }],
              [{ say: 'shared.prop.lilypad.3', who: 'kid' }]
            ],
            mode: 'step'
          }
        ]
      }
    ],
    reeds: [
      { if: 'intro', then: [{ forage: 'reeds' }] },
      {
        then: [
          { fx: 'dust', n: 2 },
          {
            cycle: [
              [{ say: 'shared.prop.reeds.1', who: 'kid' }],
              [{ say: 'shared.prop.reeds.2', who: 'kid' }],
              [{ say: 'shared.prop.reeds.3', who: 'kid' }]
            ],
            mode: 'step'
          }
        ]
      }
    ],
    stepping_stone: [
      {
        then: [
          { fx: 'dust', n: 2 },
          {
            cycle: [
              [{ say: 'shared.prop.stepping_stone.1', who: 'kid' }],
              [{ say: 'shared.prop.stepping_stone.2', who: 'kid' }],
              [{ say: 'shared.prop.stepping_stone.3', who: 'kid' }]
            ],
            mode: 'step'
          }
        ]
      }
    ],
    hay_bale: [
      {
        then: [
          { fx: 'dust', n: 6 },
          { sound: 'rustle' },
          {
            cycle: [
              [{ say: 'shared.prop.hay_bale.1', who: 'kid' }],
              [{ say: 'shared.prop.hay_bale.2', who: 'kid' }],
              [{ say: 'shared.prop.hay_bale.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.6 }] },
            then: [{ say: 'shared.prop.hay_bale.4', who: 'companion' }]
          }
        ]
      }
    ],
    cart: [
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.cart.1', who: 'kid' }],
              [{ say: 'shared.prop.cart.2', who: 'kid' }],
              [{ say: 'shared.prop.cart.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.3 }] },
            then: [{ say: 'shared.prop.cart.4', who: 'companion' }]
          }
        ]
      }
    ],
    market_stall: [
      {
        then: [
          { fx: 'sparkle', n: 3, dy: -10 },
          {
            cycle: [
              [{ say: 'shared.prop.market_stall.1', who: 'kid' }],
              [{ say: 'shared.prop.market_stall.2', who: 'kid' }],
              [{ say: 'shared.prop.market_stall.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.45 }] },
            then: [{ say: 'shared.prop.market_stall.4', who: 'companion' }]
          }
        ]
      }
    ],
    laundry_line: [
      {
        then: [
          { fx: 'dust', n: 2, dy: -12 },
          {
            cycle: [
              [{ say: 'shared.prop.laundry_line.1', who: 'kid' }],
              [{ say: 'shared.prop.laundry_line.2', who: 'kid' }],
              [{ say: 'shared.prop.laundry_line.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.4 }] },
            then: [{ say: 'shared.prop.laundry_line.4', who: 'companion' }]
          }
        ]
      }
    ],
    windchime: [
      {
        then: [
          { note: [79, 76, 72, 81, 74], count: 4, gap: 140, fx: 'sparkle' },
          {
            cycle: [
              [{ say: 'shared.prop.windchime.1', who: 'kid' }],
              [{ say: 'shared.prop.windchime.2', who: 'kid' }],
              [{ say: 'shared.prop.windchime.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.4 }] },
            then: [{ say: 'shared.prop.windchime.4', who: 'companion' }]
          }
        ]
      }
    ],
    birdbath: [
      {
        then: [
          { sound: 'splash' },
          { fx: 'sparkle', n: 5, dy: -10 },
          {
            cycle: [
              [{ say: 'shared.prop.birdbath.1', who: 'kid' }],
              [{ say: 'shared.prop.birdbath.2', who: 'kid' }],
              [{ say: 'shared.prop.birdbath.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.4 }] },
            then: [{ say: 'shared.prop.birdbath.4', who: 'companion' }]
          }
        ]
      }
    ],
    statue: [
      {
        then: [
          {
            if: { companion: true },
            then: [{ fx: 'magic', n: 6, dy: -16 }],
            else: [{ fx: 'dust', n: 6, dy: -16 }]
          },
          {
            cycle: [
              [{ say: 'shared.prop.statue.1', who: 'kid' }],
              [{ say: 'shared.prop.statue.2', who: 'kid' }],
              [{ say: 'shared.prop.statue.3', who: 'kid' }],
              [{ say: 'shared.prop.statue.4', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { companion: true },
            then: [
              {
                cycle: [
                  [{ say: 'shared.prop.statue.5', who: 'companion' }],
                  [{ say: 'shared.prop.statue.6', who: 'companion' }],
                  [{ say: 'shared.prop.statue.7', who: 'companion' }],
                  [{ say: 'shared.prop.statue.8', who: 'companion' }]
                ],
                mode: 'step'
              }
            ]
          }
        ]
      }
    ],
    pumpkin: [
      {
        then: [
          { sound: 'knock' },
          { fx: 'dust', n: 2 },
          {
            cycle: [
              [{ say: 'shared.prop.pumpkin.1', who: 'kid' }],
              [{ say: 'shared.prop.pumpkin.2', who: 'kid' }],
              [{ say: 'shared.prop.pumpkin.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.5 }] },
            then: [{ say: 'shared.prop.pumpkin.4', who: 'companion' }]
          }
        ]
      }
    ],
    log_pile: [
      { if: 'intro', then: [{ forage: 'log_pile' }] },
      {
        then: [
          { fx: 'dust', n: 3 },
          {
            cycle: [
              [{ say: 'shared.prop.log_pile.1', who: 'kid' }],
              [{ say: 'shared.prop.log_pile.2', who: 'kid' }],
              [{ say: 'shared.prop.log_pile.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.5 }] },
            then: [{ say: 'shared.prop.log_pile.4', who: 'companion' }]
          }
        ]
      }
    ],
    house_player: [
      {
        then: [
          { fx: 'smoke', n: 3, dy: -40 },
          {
            cycle: [
              [{ say: 'shared.prop.house_player.1', who: 'kid' }],
              [{ say: 'shared.prop.house_player.2', who: 'kid' }],
              [{ say: 'shared.prop.house_player.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.5 }] },
            then: [{ say: 'shared.prop.house_player.4', who: 'companion' }]
          }
        ]
      }
    ],
    house_a: [
      {
        then: [
          { sound: 'knock' },
          {
            cycle: [
              [
                {
                  if: { hour: [19, 6] },
                  then: [{ say: 'shared.prop.house_a.1', who: 'kid' }],
                  else: [{ say: 'shared.prop.house_a.2', who: 'kid' }]
                }
              ],
              [{ say: 'shared.prop.house_a.3', who: 'kid' }],
              [{ say: 'shared.prop.house_a.4', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.3 }] },
            then: [{ say: 'shared.prop.house_a.5', who: 'companion' }]
          }
        ]
      }
    ],
    tavern: [
      {
        then: [
          { fx: 'smoke', n: 4, dy: -20 },
          { sound: 'sizzle' },
          {
            cycle: [
              [{ say: 'shared.prop.tavern.1', who: 'kid' }],
              [{ say: 'shared.prop.tavern.2', who: 'kid' }],
              [{ say: 'shared.prop.tavern.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.6 }] },
            then: [
              {
                random: [
                  [{ say: 'shared.prop.tavern.4', who: 'companion' }],
                  [{ say: 'shared.prop.tavern.5', who: 'companion' }]
                ]
              }
            ]
          }
        ]
      }
    ],
    shop: [
      {
        then: [
          { sound: 'bell' },
          { fx: 'sparkle', n: 3, dy: -12 },
          {
            cycle: [
              [{ say: 'shared.prop.shop.1', who: 'kid' }],
              [{ say: 'shared.prop.shop.2', who: 'kid' }],
              [{ say: 'shared.prop.shop.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { all: [{ companion: true }, { chance: 0.45 }] },
            then: [{ say: 'shared.prop.shop.4', who: 'companion' }]
          }
        ]
      }
    ],
    school: [
      {
        then: [
          { sound: 'sparkle' },
          { fx: 'magic', n: 6, dy: -20 },
          {
            cycle: [
              [{ say: 'shared.prop.school.1', who: 'kid' }],
              [{ say: 'shared.prop.school.2', who: 'kid' }],
              [{ say: 'shared.prop.school.3', who: 'kid' }]
            ],
            mode: 'step'
          },
          {
            if: { companion: true },
            then: [
              {
                cycle: [
                  [{ say: 'shared.prop.school.4', who: 'companion' }],
                  [{ say: 'shared.prop.school.5', who: 'companion' }],
                  [{ say: 'shared.prop.school.6', who: 'companion' }]
                ],
                mode: 'step'
              }
            ]
          }
        ]
      }
    ],
    crystal_orb: [
      {
        then: [
          { sound: 'sparkle' },
          { fx: 'magic', n: 20, dy: -12 },
          {
            say: ['shared.prop.crystal_orb.1', 'shared.prop.crystal_orb.2', 'shared.prop.crystal_orb.3'],
            who: 'orb'
          }
        ]
      }
    ],
    element_banner: [
      {
        then: [
          { fx: 'sparkle', n: 4, dy: -6 },
          {
            branch: [
              {
                if: { obj: { element: 'water' } },
                then: [{ say: 'shared.prop.element_banner.1', who: 'kid' }]
              },
              {
                if: { obj: { element: 'fire' } },
                then: [{ say: 'shared.prop.element_banner.2', who: 'kid' }]
              },
              {
                if: { obj: { element: 'wind' } },
                then: [{ say: 'shared.prop.element_banner.3', who: 'kid' }]
              },
              {
                if: { obj: { element: 'grass' } },
                then: [{ say: 'shared.prop.element_banner.4', who: 'kid' }]
              },
              {
                if: { obj: { element: 'electric' } },
                then: [{ say: 'shared.prop.element_banner.5', who: 'kid' }]
              },
              {
                if: { obj: { element: 'earth' } },
                then: [{ say: 'shared.prop.element_banner.6', who: 'kid' }]
              },
              {
                if: { obj: { element: 'dark' } },
                then: [{ say: 'shared.prop.element_banner.7', who: 'kid' }]
              }
            ],
            else: [{ say: 'shared.prop.element_banner.8', who: 'kid' }]
          }
        ]
      }
    ],
    shop_shelf: [
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.shop_shelf.1', who: 'kid' }],
              [{ say: 'shared.prop.shop_shelf.2', who: 'kid' }],
              [{ say: 'shared.prop.shop_shelf.3', who: 'kid' }]
            ],
            mode: 'loop'
          }
        ]
      }
    ],
    potion_rack: [
      {
        then: [
          { fx: 'sparkle', n: 5, dy: -8 },
          {
            cycle: [
              [{ say: 'shared.prop.potion_rack.1', who: 'kid' }],
              [{ say: 'shared.prop.potion_rack.2', who: 'kid' }],
              [{ say: 'shared.prop.potion_rack.3', who: 'kid' }]
            ],
            mode: 'loop'
          }
        ]
      }
    ],
    barrel_in: [
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.barrel_in.1', who: 'kid' }],
              [{ say: 'shared.prop.barrel_in.2', who: 'kid' }],
              [{ say: 'shared.prop.barrel_in.3', who: 'kid' }]
            ],
            mode: 'loop'
          }
        ]
      }
    ],
    stool: [
      {
        then: [
          {
            cycle: [[{ say: 'shared.prop.stool.1', who: 'kid' }], [{ say: 'shared.prop.stool.2', who: 'kid' }]],
            mode: 'loop'
          }
        ]
      }
    ],
    tavern_table: [
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.tavern_table.1', who: 'kid' }],
              [{ say: 'shared.prop.tavern_table.2', who: 'kid' }],
              [{ say: 'shared.prop.tavern_table.3', who: 'kid' }]
            ],
            mode: 'loop'
          }
        ]
      }
    ],
    lantern_hang: [
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.lantern_hang.1', who: 'kid' }],
              [{ say: 'shared.prop.lantern_hang.2', who: 'kid' }]
            ],
            mode: 'loop'
          }
        ]
      }
    ],
    school_desk: [
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.school_desk.1', who: 'kid' }],
              [{ say: 'shared.prop.school_desk.2', who: 'kid' }],
              [{ say: 'shared.prop.school_desk.3', who: 'kid' }]
            ],
            mode: 'loop'
          }
        ]
      }
    ],
    bookstack: [
      { if: { ext: 'read', book: 'here' }, then: [{ sound: 'page' }, { ext: 'read', book: 'here' }] },
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.bookstack.1', who: 'kid' }],
              [{ say: 'shared.prop.bookstack.2', who: 'kid' }],
              [{ say: 'shared.prop.bookstack.3', who: 'kid' }]
            ],
            mode: 'loop'
          }
        ]
      }
    ],
    loom: [
      {
        then: [
          {
            cycle: [[{ say: 'shared.prop.loom.1', who: 'kid' }], [{ say: 'shared.prop.loom.2', who: 'kid' }]],
            mode: 'loop'
          }
        ]
      }
    ],
    flower_vase: [
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.flower_vase.1', who: 'kid' }],
              [{ say: 'shared.prop.flower_vase.2', who: 'kid' }]
            ],
            mode: 'loop'
          }
        ]
      }
    ],
    blackboard: [{ then: [{ open: 'blackboard' }] }],
    notice_board: [{ then: [{ open: 'noticeBoard' }] }],
    heart_tree: [
      {
        then: [
          {
            cycle: [
              [
                { say: 'shared.prop.heart_tree.1', who: 'kid' },
                { if: { companion: true }, then: [{ say: 'shared.prop.heart_tree.2', who: 'companion' }] }
              ],
              [
                { say: 'shared.prop.heart_tree.3', who: 'kid' },
                { if: { companion: true }, then: [{ say: 'shared.prop.heart_tree.4', who: 'companion' }] }
              ]
            ],
            mode: 'loop',
            by: 'object'
          }
        ]
      }
    ],
    stone_pillar: [
      {
        then: [
          {
            cycle: [
              [{ say: 'shared.prop.stone_pillar.1', who: 'kid' }],
              [{ say: 'shared.prop.stone_pillar.2', who: 'kid' }]
            ],
            mode: 'loop',
            by: 'object'
          }
        ]
      }
    ],
    leaf_window: [
      {
        then: [
          { say: 'shared.prop.leaf_window.1', who: 'kid' },
          { if: { companion: true }, then: [{ say: 'shared.prop.leaf_window.2', who: 'companion' }] }
        ]
      }
    ],
    hall_banner: [{ then: [{ say: 'shared.prop.hall_banner.1', who: 'kid' }] }],
    glowcaps: [
      {
        then: [
          { say: 'shared.prop.glowcaps.1', who: 'kid' },
          { if: { companion: true }, then: [{ say: 'shared.prop.glowcaps.2', who: 'companion' }] }
        ]
      }
    ],
    stone_dais: [{ then: [{ say: 'shared.prop.stone_dais.1', who: 'kid' }] }],
    rockslide: [
      {
        then: [
          {
            cycle: [
              [
                { say: 'shared.prop.rockslide.1', who: 'kid' },
                { if: { companion: true }, then: [{ say: 'shared.prop.rockslide.2', who: 'companion' }] }
              ],
              [{ say: 'shared.prop.rockslide.3', who: 'kid' }]
            ],
            mode: 'loop',
            by: 'object'
          }
        ]
      }
    ],
    slide_sign: [{ then: [{ say: 'shared.prop.slide_sign.1', who: 'kid' }] }],
    root_wall: [
      {
        then: [
          {
            cycle: [
              [
                { say: 'shared.prop.root_wall.1', who: 'kid' },
                { if: { companion: true }, then: [{ say: 'shared.prop.root_wall.2', who: 'companion' }] }
              ],
              [{ say: 'shared.prop.root_wall.3', who: 'kid' }]
            ],
            mode: 'loop',
            by: 'object'
          }
        ]
      }
    ],
    moss_runner: [{ then: [{ say: 'shared.prop.moss_runner.1', who: 'kid' }] }],
    '*': [
      {
        then: [
          { fx: 'dust', n: 2 },
          {
            cycle: [
              [
                {
                  say: 'shared.prop.generic.1',
                  who: 'kid',
                  params: {
                    article: {
                      pick: [[{ obj: { vowel: true } }, 'shared.prop.generic.an']],
                      else: 'shared.prop.generic.a'
                    },
                    thing: { obj: 'typeName' }
                  }
                }
              ],
              [
                {
                  say: 'shared.prop.generic.2',
                  who: 'kid',
                  params: {
                    article: {
                      pick: [[{ obj: { vowel: true } }, 'shared.prop.generic.an.lower']],
                      else: 'shared.prop.generic.a.lower'
                    },
                    thing: { obj: 'typeName' }
                  }
                }
              ]
            ],
            mode: 'step'
          }
        ]
      }
    ],
    tile_water: [{ then: [{ run: 'shared.water' }] }]
  }
};
