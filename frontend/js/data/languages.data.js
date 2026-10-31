// Registro de idiomas del traductor. La identificación no depende de banderas.
// `demoPairs` indica qué pares tienen datos locales revisados en esta demostración.
// El resto mostrará el aviso de que el servicio de traducción aún no está conectado.

export const uiLanguages = Object.freeze([
 { code: 'es', name: 'Español', nameEn: 'Spanish', tag: 'es' },
 { code: 'en', name: 'English', nameEn: 'English', tag: 'en' },
]);

export const translatorLanguages = Object.freeze([
 { code: 'es', tag: 'es-ES', endonym: 'Español', name: 'Español', nameEn: 'Spanish', dir: 'ltr', script: 'latino' },
 { code: 'en', tag: 'en-US', endonym: 'English', name: 'Inglés', nameEn: 'English', dir: 'ltr', script: 'latino' },
 { code: 'pt', tag: 'pt-PT', endonym: 'Português', name: 'Portugués', nameEn: 'Portuguese', dir: 'ltr', script: 'latino' },
 { code: 'fr', tag: 'fr-FR', endonym: 'Français', name: 'Francés', nameEn: 'French', dir: 'ltr', script: 'latino' },
 { code: 'de', tag: 'de-DE', endonym: 'Deutsch', name: 'Alemán', nameEn: 'German', dir: 'ltr', script: 'latino' },
 { code: 'it', tag: 'it-IT', endonym: 'Italiano', name: 'Italiano', nameEn: 'Italian', dir: 'ltr', script: 'latino' },
 { code: 'zh', tag: 'zh-CN', endonym: '中文 (普通话)', name: 'Chino mandarín', nameEn: 'Mandarin Chinese', dir: 'ltr', script: 'han' },
 { code: 'ja', tag: 'ja-JP', endonym: '日本語', name: 'Japonés', nameEn: 'Japanese', dir: 'ltr', script: 'japones' },
 { code: 'ko', tag: 'ko-KR', endonym: '한국어', name: 'Coreano', nameEn: 'Korean', dir: 'ltr', script: 'hangul' },
 { code: 'ar', tag: 'ar-SA', endonym: 'العربية', name: 'Árabe', nameEn: 'Arabic', dir: 'rtl', script: 'arabe' },
]);

// Idiomas considerados para una incorporación posterior, condicionada a recursos
// confiables y validación lingüística. No son seleccionables todavía.
export const plannedLanguages = Object.freeze([
 { code: 'qu', tag: 'qu-PE', endonym: 'Runasimi', name: 'Quechua', nameEn: 'Quechua', dir: 'ltr', script: 'latino', planned: true },
 { code: 'ay', tag: 'ay-PE', endonym: 'Aymar aru', name: 'Aymara', nameEn: 'Aymara', dir: 'ltr', script: 'latino', planned: true },
]);

// Pares con datos demostrativos revisados. La clave es `origen-destino`.
export const demoPairs = Object.freeze(['es-en', 'en-es']);

export function getLanguage(code) {
 return translatorLanguages.find(language => language.code === code) ?? null;
}

export function hasDemoPair(from, to) {
 return demoPairs.includes(`${from}-${to}`);
}
