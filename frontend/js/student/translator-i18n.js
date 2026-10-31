import { getLocale } from './i18n.js';
const es = {
 // Encabezado / modo
 title: 'EDUNEXT Translate', subtitle: 'Descubre nuevos idiomas y aprende palabras de todo el mundo',
 description: 'Escribe una palabra o frase y descubre su significado, cómo se usa y cómo suena.',
 demo: 'Modo demostración', demoNote: 'Traducciones de un diccionario educativo local. No hay servicio de traducción conectado.',
 connectionHelp: 'La señal del navegador es orientativa; no confirma un servicio de traducción.',

 // Paneles
 source: 'Idioma de origen', target: 'Idioma de destino', sourceText: 'Texto de origen', resultText: 'Traducción',
 placeholder: 'Escribe aquí una palabra o frase que quieras aprender...', detecting: 'Detectar idioma',
 detectPending: 'Detección automática pendiente del servicio de traducción', detectingNote: 'La detección automática todavía no está implementada. Elige el idioma manualmente.',
 characters: '{count} / {max} caracteres', clear: 'Limpiar', listen: 'Escuchar', listenSlow: '🐢 Escuchar lento', stop: 'Detener',
 copy: 'Copiar', copied: 'Copiado al portapapeles', copyUnavailable: 'El navegador no permite copiar automáticamente. Selecciona el texto manualmente.',
 paste: 'Pegar', pasted: 'Texto pegado desde el portapapeles', pasteUnavailable: 'Pegar requiere permiso del portapapeles y no está disponible.',
 swap: 'Intercambiar idiomas', translate: 'Traducir', translating: 'Traduciendo…', retry: 'Reintentar',

 // Estados del resultado
 resultTitle: 'Resultado educativo', found: 'Traducción encontrada', notFound: 'No hay una traducción local para “{text}”.',
 notFoundNote: 'Puedes guardar la palabra cuando conectemos el servicio, o probar otra del diccionario de demostración.',
 pairUnavailable: 'Este par de idiomas estará disponible al conectar el servicio de traducción.',
 pairUnavailableNote: 'Por ahora solo hay datos demostrativos para Español ↔ Inglés. No se inventan equivalencias.',
 empty: 'Escribe una palabra o frase antes de traducir.', tooLong: 'El texto supera el límite de {max} caracteres.', sameLanguage: 'Elige dos idiomas diferentes.',
 error: 'No se pudo consultar el diccionario. Puedes intentarlo de nuevo.', invalid: 'El idioma seleccionado no es válido.',

 // Tarjeta de resultado
 example: 'Ejemplo', exampleTranslation: 'Traducción del ejemplo', category: 'Categoría', topic: 'Tema académico', meaning: 'Significado educativo',
 save: 'Guardar palabra', saved: 'Guardada en Mi vocabulario', saveFull: 'Tu colección de esta sesión alcanzó el límite de {max} palabras.',
 remove: 'Quitar de favoritos', removed: 'Se quitó de Mi vocabulario', seeDetail: 'Ver detalle', tryPronounce: '🎤 Inténtalo tú',
 pronounceSoon: 'Práctica de pronunciación disponible próximamente', pronounceNote: 'El reconocimiento de voz se desarrollará en una fase posterior. No se solicita el micrófono ahora.',
 speechUnsupported: 'Tu navegador no ofrece síntesis de voz. Puedes leer el texto.', speechStopped: 'Reproducción detenida.', speechSlow: 'Reproduciendo lentamente…', speechPlaying: 'Reproduciendo…', speechOffline: 'La voz puede depender de recursos del dispositivo.',
 speechNote: 'La voz depende de las voces instaladas en tu dispositivo y puede variar.',

 // Ejemplos del diccionario
 suggestions: 'Palabras para probar', suggestionNote: 'Toca una palabra del diccionario de demostración.', recent: 'Búsquedas de esta sesión',

 // Mi vocabulario
 vocabTitle: 'Mi vocabulario', vocabSubtitle: 'Todas las palabras nuevas que has aprendido', vocabDemo: 'Colección de esta sesión',
 wordsSaved: 'Palabras guardadas', languagesUsed: 'Idiomas representados', reviewed: 'Palabras revisadas', categoriesAvailable: 'Categorías',
 vocabTemporary: 'Temporal: esta colección vive en tu sesión y puede desaparecer al cerrarla. Todavía no se sincroniza con ningún servidor.',
 search: 'Buscar palabra', filterLanguage: 'Idioma', filterCategory: 'Categoría', all: 'Todos', sort: 'Ordenar', sortAlpha: 'Alfabético (A–Z)', sortRecent: 'Agregado reciente',
 empty: 'Aún no has guardado palabras', emptyNote: 'Traduce una palabra y guárdala para verla aquí.', goTranslator: 'Ir al traductor',
 noResults: 'No hay palabras que coincidan con estos filtros.', openDetail: 'Ver detalle', review: 'Repasar vocabulario', startReview: 'Comenzar repaso',

 // Detalle de palabra
 detailTitle: 'Detalle de la palabra', notFoundTitle: 'No encontramos esta palabra', notFoundNote: 'La palabra no está en el diccionario de esta demostración.', backTranslator: 'Volver al traductor',
 detailLangs: 'Idiomas', detailCategory: 'Categoría gramatical', detailMeaning: 'Para qué sirve', meaningNote: 'Describe cómo usar la palabra en una oración sencilla.',
 favorite: 'En tus favoritos', notFavorite: 'No está en tus favoritos',

 // Repaso
 reviewTitle: 'Repaso de vocabulario', reviewSubtitle: 'Practica las palabras que has guardado',
 modeFlashcards: 'Flashcards', modeChoice: 'Elegir traducción', modeMatch: 'Relacionar palabras',
 flashcardPrompt: '¿Recuerdas su significado?', showTranslation: 'Mostrar traducción', hideTranslation: 'Ocultar traducción', previous: 'Anterior', next: 'Siguiente', back: 'Volver', cardOf: 'Tarjeta {current} de {total}',
 choosePrompt: 'Elige la traducción correcta de:', matchPrompt: 'Relaciona cada palabra con su traducción.',
 correct: '¡Correcto!', incorrect: 'Respuesta incorrecta', chooseAnswer: 'Elige una opción.', matchProgress: '{done} de {total} relacionadas',
 results: 'Resultado del repaso', reviewedWords: 'Palabras repasadas', correctAnswers: 'Respuestas correctas', incorrectAnswers: 'Respuestas incorrectas', accuracy: 'Porcentaje de aciertos', accuracyNote: 'Resultado del repaso; no se registra como nota oficial.', finish: 'Finalizar', restart: 'Repetir',
 reviewEmpty: 'Necesitas al menos una palabra para repasar.', reviewDemo: 'Tienes pocas palabras guardadas. Puedes practicar con este conjunto de demostración.', useDemo: 'Practicar con ejemplo', useSaved: 'Practicar mis palabras', demoSet: 'Conjunto de demostración',

 // Genéricos
 detail: 'Detalle', close: 'Cerrar', of: 'de', play: 'Reproducir', yes: 'Sí', no: 'No', sourceLang: 'Origen', targetLang: 'Destino',
 offline: 'Sin conexión', offlineNote: 'Sin conexión. Puedes seguir usando el diccionario demostrativo incluido.',
 languageDirNote: 'El texto se muestra con su dirección de escritura original.',
};
const en = {
 title: 'EDUNEXT Translate', subtitle: 'Discover new languages and learn words from around the world',
 description: 'Type a word or phrase and discover its meaning, how it is used and how it sounds.',
 demo: 'Demonstration mode', demoNote: 'Translations come from a local educational dictionary. No translation service is connected.',
 connectionHelp: 'The browser indicator does not confirm translation service availability.',

 source: 'Source language', target: 'Target language', sourceText: 'Source text', resultText: 'Translation',
 placeholder: 'Type a word or phrase you want to learn here...', detecting: 'Detect language',
 detectPending: 'Automatic detection pending the translation service', detectingNote: 'Automatic detection is not implemented yet. Choose the language manually.',
 characters: '{count} / {max} characters', clear: 'Clear', listen: 'Listen', listenSlow: '🐢 Listen slowly', stop: 'Stop',
 copy: 'Copy', copied: 'Copied to clipboard', copyUnavailable: 'The browser does not allow automatic copying. Select the text manually.',
 paste: 'Paste', pasted: 'Text pasted from the clipboard', pasteUnavailable: 'Pasting requires clipboard permission and is not available.',
 swap: 'Swap languages', translate: 'Translate', translating: 'Translating…', retry: 'Try again',

 resultTitle: 'Educational result', found: 'Translation found', notFound: 'There is no local translation for “{text}”.',
 notFoundNote: 'You can save the word once we connect the service, or try another from the demonstration dictionary.',
 pairUnavailable: 'This language pair will be available once the translation service is connected.',
 pairUnavailableNote: 'For now there is demonstration data only for Spanish ↔ English. No equivalences are invented.',
 empty: 'Type a word or phrase before translating.', tooLong: 'The text exceeds the limit of {max} characters.', sameLanguage: 'Choose two different languages.',
 error: 'The dictionary could not be checked. Please try again.', invalid: 'The selected language is not valid.',

 example: 'Example', exampleTranslation: 'Example translation', category: 'Category', topic: 'Academic topic', meaning: 'Educational meaning',
 save: 'Save word', saved: 'Saved to My vocabulary', saveFull: 'Your collection for this session reached the limit of {max} words.',
 remove: 'Remove from favourites', removed: 'Removed from My vocabulary', seeDetail: 'View detail', tryPronounce: '🎤 Give it a try',
 pronounceSoon: 'Pronunciation practice available soon', pronounceNote: 'Voice recognition will be developed in a later phase. The microphone is not requested now.',
 speechUnsupported: 'Your browser does not offer speech synthesis. You can read the text.', speechStopped: 'Playback stopped.', speechSlow: 'Playing slowly…', speechPlaying: 'Playing…', speechOffline: 'Speech may depend on your device resources.',
 speechNote: 'Speech depends on the voices installed on your device and may vary.',

 suggestions: 'Words to try', suggestionNote: 'Tap a word from the demonstration dictionary.', recent: 'Searches from this session',

 vocabTitle: 'My vocabulary', vocabSubtitle: 'All the new words you have learned', vocabDemo: 'Collection for this session',
 wordsSaved: 'Saved words', languagesUsed: 'Languages represented', reviewed: 'Words reviewed', categoriesAvailable: 'Categories',
 vocabTemporary: 'Temporary: this collection lives in your session and may disappear when you close it. It is not synced to any server yet.',
 search: 'Search word', filterLanguage: 'Language', filterCategory: 'Category', all: 'All', sort: 'Sort', sortAlpha: 'Alphabetical (A–Z)', sortRecent: 'Recently added',
 empty: 'You have not saved any words yet', emptyNote: 'Translate a word and save it to see it here.', goTranslator: 'Go to the translator',
 noResults: 'No words match these filters.', openDetail: 'View detail', review: 'Review vocabulary', startReview: 'Start review',

 detailTitle: 'Word detail', notFoundTitle: 'We could not find this word', notFoundNote: 'The word is not in this demonstration dictionary.', backTranslator: 'Back to the translator',
 detailLangs: 'Languages', detailCategory: 'Grammatical category', detailMeaning: 'What it is used for', meaningNote: 'It describes how to use the word in a simple sentence.',
 favorite: 'In your favourites', notFavorite: 'Not in your favourites',

 reviewTitle: 'Vocabulary review', reviewSubtitle: 'Practise the words you have saved',
 modeFlashcards: 'Flashcards', modeChoice: 'Choose the translation', modeMatch: 'Match words',
 flashcardPrompt: 'Do you remember its meaning?', showTranslation: 'Show translation', hideTranslation: 'Hide translation', previous: 'Previous', next: 'Next', back: 'Back', cardOf: 'Card {current} of {total}',
 choosePrompt: 'Choose the correct translation of:', matchPrompt: 'Match each word with its translation.',
 correct: 'Correct!', incorrect: 'Incorrect answer', chooseAnswer: 'Choose an option.', matchProgress: '{done} of {total} matched',
 results: 'Review result', reviewedWords: 'Words reviewed', correctAnswers: 'Correct answers', incorrectAnswers: 'Incorrect answers', accuracy: 'Accuracy', accuracyNote: 'Review result; not recorded as an official grade.', finish: 'Finish', restart: 'Restart',
 reviewEmpty: 'You need at least one word to review.', reviewDemo: 'You have few saved words. You can practise with this demonstration set.', useDemo: 'Practise with a sample', useSaved: 'Practise my words', demoSet: 'Demonstration set',

 detail: 'Detail', close: 'Close', of: 'of', play: 'Play', yes: 'Yes', no: 'No', sourceLang: 'Source', targetLang: 'Target',
 offline: 'Offline', offlineNote: 'Offline. You can keep using the included demonstration dictionary.',
 languageDirNote: 'The text is shown with its original writing direction.',
};
export function ts(key, values = {}) {
 return (getLocale() === 'en' ? en : es)[key]?.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? '')) ?? key;
}
