import { dictionaryEntries } from '../data/dictionary-demo.data.js';

// Colección temporal de vocabulario de la sesión. Se apoya en SessionStorage para
// compartir las palabras entre pantallas durante la visita, con respaldo en memoria.
// Estos datos son temporales y pueden desaparecer al finalizar la sesión; NO son la
// colección offline definitiva (reservada a IndexedDB) ni se sincronizan con ningún
// servidor. No contienen información personal.
const KEY = 'aithron.demo.vocabulary.v1';
const memory = { version: 1, words: [] };
let storageAvailable = true;

function isEntry(value) {
 return value && typeof value === 'object'
  && typeof value.id === 'string'
  && typeof value.from === 'string' && typeof value.to === 'string'
  && typeof value.word === 'string' && typeof value.translation === 'string'
  && typeof value.category === 'string';
}

function reconcile(word) {
 const known = dictionaryEntries.find(entry => entry.id === word.id);
 return isEntry(known) ? known : null;
}

function read() {
 if (!storageAvailable) return memory;
 try {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return memory;
  const data = JSON.parse(raw);
  if (data.version !== 1 || !Array.isArray(data.words)) return memory;
  memory.words = data.words.filter(word => isEntry(word) && reconcile(word) !== null).slice(-60);
 } catch { storageAvailable = false; }
 return memory;
}

function persist() {
 try { sessionStorage.setItem(KEY, JSON.stringify(memory)); } catch { storageAvailable = false; }
}

export function listWords() {
 return structuredClone(read().words);
}

export function hasWord(id) {
 return read().words.some(word => word.id === id);
}

export function addWord(entry) {
 const data = read();
 const source = reconcile(entry);
 if (!source) return false;
 if (data.words.some(word => word.id === source.id)) return false;
 data.words.push(structuredClone(source));
 persist();
 return true;
}

export function removeWord(id) {
 const data = read();
 data.words = data.words.filter(word => word.id !== id);
 persist();
}

export function toggleWord(entry) {
 if (hasWord(entry.id)) { removeWord(entry.id); return { saved: false }; }
 return { saved: addWord(entry) };
}

export function clearWords() {
 memory.words = [];
 persist();
}

export function canStoreVocabulary() {
 return storageAvailable;
}
