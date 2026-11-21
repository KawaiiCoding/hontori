# Hontori - Story Bible (draft for review)

## Premise
A ten-year-old lives with Mom and Dad in a small house in Emberbrook Village.
One night the chimney rumbles, and a little fire hontori tumbles down the flue.
It coughs up a wand and teaches the kid one spell: draw a V and say *Velum Aperi*.
The veil lifts. The kid can now see the spirits that share the world.
The fire fox has no name until the player gives it one.

## The world
- **The Veilbound**: most people. They cannot see magic or hontori. Mom and Dad are Veilbound.
- **Those who see**: a few people with open eyes. Mages, some elders, some children.
- **Hontori**: a species word for elemental spirits. Eight elements: fire, water, grass, wind, electric, earth, dark, light.
- Most people who know of hontori think they are bad spirits: pests, omens, dangers to be kept away.
- Wild hontori are often jealous of spirits that have a human friend. They pick fights out of loneliness, not malice. Battles end when a spirit is calmed, never destroyed.

## The wand
- The wand remembers every hontori it has calmed. It can hold the memory of up to 100 spirits.
- Spells are drawn as sigils (circle to mend, ward to shield, zigzag to stun, wave to lull, spiral to bind).
- Each hontori can grow through 4 stages as its bond deepens (stage 1 little, stage 4 grand).

## Regions and schools
Eight regions, each with an element town and a School of Magic. Each school holds a trial; passing it earns that school's ring.
The first school, **Emberbrook Academy**, teaches the basics only and gives no ring, just a Novice Certificate.

| # | Region | Element |
|---|--------|---------|
| 1 | Emberbrook (home, Academy) | basics |
| 2 | Whisperwood | grass |
| 3 | Tidewell | water |
| 4 | Whistling Pass | wind |
| 5 | Voltmere | electric |
| 6 | Deepstone | earth |
| 7 | Gloamhollow | dark |
| 8 | Dawnspire | light |
| 9 | Cinderhold | fire |

(Eight elemental schools, regions 2 to 9; Emberbrook is the starting village.)

## The antagonist
**Grand Archmage Orlen Vael**, Keeper of the Veil. White beard, warm voice, head of the Council of Mages.
Everyone loves him. Children get sweets at his visits.
In secret, he wrote the old law that keeps hontori feared, sealed away or bound to the Council.
Frightened people do not ask questions, and controlled spirits make the Council powerful.
His crest is a closed grey eye.

## The goal
Gather the 8 rings. A ring-holder may speak before the Council.
Expose Orlen Vael and pass a new law, so hontori are known and respected by everyone, Veilbound included.

## Recurring characters
- **The fire hontori**: the companion. Speaks in gentle rhyme.
- **Mom and Dad**: loving, Veilbound, keep almost noticing.
- **Elder Wisteria**: once walked with a light hontori. Sets a second cup of tea each morning. Knows about the sealed well.
- **Madam Sorrel**: teacher at Emberbrook Academy.
- **Ash and Mira**: classmates and friendly rivals.
- **Wren**: a girl who also got an Academy letter.
- **Pip**: a small boy who leaves milk out for a lost water hontori.
- **Orlen Vael**: the kind face of the old law.

## Chapters
1. **Emberbrook** - the night visit, the morning after, the Academy basics, the lost water hontori, the Elder's story. Ends with a letter sealed with a closed grey eye.
   Built in src/chapter1.js, in this order:
   - Morning at home (8:00). Mom and Dad (Veilbound) talk; Dad mentions the Academy. The kid packs exactly 5 of the 12 home items.
   - **The Academy**: reach Emberbrook Academy, pass the gate trial, win a practice duel, learn the Binding Spiral. Madam Sorrel also teaches "Caring for your hontori" from day one.
   - **Wet Pawprints** (starts after the Academy, or by talking to Pip): Pip's story, then the pond after dusk, where a shy water hontori (Brookit) appears. Weaken it and bind it. Without the Binding Spiral the fox says the Academy comes first.
   - **The Elder's Second Cup** (Fenn or Lark start it): Elder Wisteria tells of the old law, her light hontori sealed in the well, and Grand Archmage Orlen Vael.
   - **Beyond the Trees**: Guard Bram keeps the south road closed until the Academy quest is done; reaching Whisperwood finishes it.
   - When all four are done, a paper bird letter sealed with a closed grey eye arrives. No title card; the scene simply happens.
   - One-time tips appear when they first matter: first battle (tap a move), first hurt hontori after a wild battle (Mend in the party panel, costs mana), low mana (herbs, ramen), first weakened wild hontori before the spiral is known (the Academy teaches binding), first night (sleep in a bed).
2. **Whisperwood** - the forest road and the first ring school.
3. **Tidewell**
4. **Whistling Pass**
5. **Voltmere**
6. **Deepstone**
7. **Gloamhollow**
8. **Dawnspire**
9. **The Council** - the last ring, the hearing, the new law.
