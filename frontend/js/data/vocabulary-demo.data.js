// Conjunto de vocabulario de demostración, claramente identificado, para poder
// practicar el repaso cuando el estudiante todavía ha guardado pocas palabras.
// Reutiliza las entradas del diccionario local; no son datos del estudiante.
import { dictionaryEntries } from './dictionary-demo.data.js';

export function getReviewDemoSet(from = 'es', to = 'en', limit = 6) {
 return dictionaryEntries
  .filter(entry => entry.from === from && entry.to === to)
  .slice(0, limit)
  .map(entry => ({ ...entry, demo: true }));
}
