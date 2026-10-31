import { findEntry } from '../data/dictionary-demo.data.js';
import { hasDemoPair, getLanguage } from '../data/languages.data.js';

/**
 * Servicio de traducción en modo demostración. Consulta únicamente el diccionario
 * local revisado. No genera equivalencias en tiempo de ejecución: si no existe una
 * entrada verificada, informa del estado correspondiente para que la interfaz lo
 * comunique sin inventar un resultado.
 *
 * Estados devueltos:
 *  - found: existe una entrada local verificada.
 *  - pairUnavailable: el par de idiomas aún no tiene datos ni servicio conectado.
 *  - notFound: el par existe, pero la palabra no está en el diccionario local.
 *  - invalid: idioma desconocido o misma lengua.
 */
export function translateText({ text, from, to } = {}) {
 const source = String(text ?? '').trim();
 if (!from || !to || !getLanguage(from) || !getLanguage(to)) return { status: 'invalid' };
 if (from === to) return { status: 'invalid' };
 if (!hasDemoPair(from, to)) return { status: 'pairUnavailable', from, to, text: source };
 const entry = findEntry(from, to, source);
 if (!entry) return { status: 'notFound', from, to, text: source };
 return { status: 'found', from, to, text: source, entry };
}
