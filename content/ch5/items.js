/*
 * ch5/items.js
 * Job: the key things of chapter 5 (schema section 1: one id means one thing). The Spark Ring is the fourth
 * Warden's vote. The jar tag from Tib's lamp can be read again from the bag; it is what the kid shows
 * Master Ashfield.
 */

export default {
  spark_ring: {
    id: 'spark_ring',
    name: 'ch5.item.spark_ring.name',
    icon: 'electric',
    kind: 'key',
    desc: null,
    use: 'ch5.item.spark_ring.use',
    tag: 'ch5.item.spark_ring.tag',
    effect: 'ring'
  },
  freed_spark_note: {
    id: 'freed_spark_note',
    name: 'ch5.item.freed_spark_note.name',
    icon: 'scroll',
    kind: 'key',
    desc: null,
    use: 'ch5.item.freed_spark_note.use',
    tag: 'ch5.item.freed_spark_note.tag',
    effect: 'story',
    actions: [{ label: 'ch5.item.read', desc: 'ch5.item.read.desc', then: [{ run: 'ch5.jartag' }] }]
  }
};
