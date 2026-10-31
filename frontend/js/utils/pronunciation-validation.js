export function validatePronunciationTarget({ word, lang }) {
 const w = String(word ?? '').trim();
 if (!w) return { valid: false, reason: 'empty' };
 const allowed = ['es','en'];
 if (!allowed.includes(lang)) return { valid: false, reason: 'lang' };
 return { valid: true, word: w, lang };
}
