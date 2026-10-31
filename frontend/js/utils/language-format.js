import { getLocale } from '../student/i18n.js';
import { translatorLanguages, getLanguage, hasDemoPair } from '../data/languages.data.js';

// Nombre visible del idioma según el idioma de la interfaz. Nunca banderas.
export function languageName(code) {
 const language = getLanguage(code);
 if (!language) return code;
 return getLocale() === 'en' ? language.nameEn : language.name;
}

export function languageEndonym(code) {
 return getLanguage(code)?.endonym ?? code;
}

export function languageTag(code) {
 return getLanguage(code)?.tag ?? code;
}

export function pairAvailable(from, to) {
 return from !== to && hasDemoPair(from, to);
}

export const categoryLabels = Object.freeze({
 es: { noun: 'Sustantivo', verb: 'Verbo', adjective: 'Adjetivo', phrase: 'Expresión' },
 en: { noun: 'Noun', verb: 'Verb', adjective: 'Adjective', phrase: 'Phrase' },
});

export function categoryLabel(category) {
 return categoryLabels[getLocale()]?.[category] ?? category;
}

// Orden alfabético estable por el nombre visible.
export function sortByLanguageName(codes) {
 return [...codes].sort((a, b) => languageName(a).localeCompare(languageName(b), getLocale()));
}

export const allLanguages = translatorLanguages;
