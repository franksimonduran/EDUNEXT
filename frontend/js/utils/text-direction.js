import { getLanguage } from '../data/languages.data.js';

// Devuelve la dirección de escritura del idioma. Solo se aplica a los campos y
// resultados relevantes; la interfaz completa no se invierte por un texto RTL.
export function directionFor(code) {
 return getLanguage(code)?.dir === 'rtl' ? 'rtl' : 'ltr';
}

export function isRTL(code) {
 return directionFor(code) === 'rtl';
}

// Atributos listos para incrustar en plantillas.
export function dirAttributes(code) {
 const dir = directionFor(code);
 return `dir="${dir}" lang="${getLanguage(code)?.tag ?? code}"`;
}
