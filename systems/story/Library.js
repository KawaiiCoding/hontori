/*
 * Library.js
 * Job: the story's view of the content folders (content/schema.md): it merges every folder, in
 * load order, into the tables the story system reads. Content stays plain data; nothing here
 * names a chapter.
 *
 * Public API:
 *   new Library(folders)      folders: content folder objects in load order (shared first)
 *   text                      { id: string }, every folder's text merged
 *   people                    Map id -> person (schema section 3)
 *   events                    [event] in load order (schema section 7)
 *   scripts                   { id: [command] }
 *   handlers(type)            the interaction handlers of a type (schema section 8), later folders first;
 *                             an alias shares the handlers of the type it names
 *   handlerKey(type)          the type whose handlers (and visit count) a type uses
 *   voices                    { id: { name, look, color, named } }
 *   lookColors, defaultColor  name colours by look (voices data)
 *   objectAt(map, x, y)       the facts content gives about one prop or building, or null
 *   doors                     [{ map, to, if }] doors that exist only while a condition holds
 *   helpers                   [{ id, title, text, icon, when }] the once-only first-touch cards; `when` is
 *                             a moment's name ('ui:questPill') or a condition
 *   ask(name)                 the options of an `ask` command (for example 'controls'), or null
 *   folders                   the folders as given
 */

export class Library {
  text = {};
  people = new Map();
  events = [];
  scripts = {};
  voices = {};
  lookColors = {};
  defaultColor = '#ffd27a';
  doors = [];
  helpers = [];
  folders;

  #handlers = new Map();
  #aliases = {};
  #objects = new Map();
  #ask = {};

  constructor(folders) {
    this.folders = folders;
    for (const folder of folders) this.#add(folder || {});
  }

  handlerKey(type) {
    return this.#aliases[type] || type;
  }

  handlers(type) {
    return this.#handlers.get(this.handlerKey(type)) || null;
  }

  objectAt(map, x, y) {
    return this.#objects.get(`${map}:${x}:${y}`) || null;
  }

  ask(name) {
    return this.#ask[name] || null;
  }

  #add(folder) {
    Object.assign(this.text, folder.text);
    for (const person of folder.people || []) this.people.set(person.id, person);
    for (const event of folder.events || []) this.events.push(event);
    Object.assign(this.scripts, folder.scripts);
    Object.assign(this.#aliases, folder.aliases);
    Object.assign(this.#ask, folder.ask);
    for (const door of folder.doors || []) this.doors.push(door);
    for (const card of folder.helpers || []) this.helpers.push(card);
    for (const fact of folder.objects || []) this.#objects.set(`${fact.map}:${fact.x}:${fact.y}`, fact);
    this.#addVoices(folder.voices);
    /* a later folder's handlers for a type are tried before an earlier folder's */
    for (const [type, list] of Object.entries(folder.interactions || {})) {
      this.#handlers.set(type, [...list, ...(this.#handlers.get(type) || [])]);
    }
  }

  #addVoices(voices) {
    if (!voices) return;
    for (const [id, voice] of Object.entries(voices)) {
      if (id === 'lookColors') Object.assign(this.lookColors, voice);
      else if (id === 'defaultColor') this.defaultColor = voice;
      else if (voice && typeof voice === 'object') this.voices[id] = voice;
    }
  }
}
