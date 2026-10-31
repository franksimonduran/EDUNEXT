// Datos demostrativos de pronunciación. Estructurados para reutilizarse desde
// Traductor, Vocabulario y Lecciones. Sin audios obligatorios: la síntesis de voz
// del navegador puede usarse como alternativa cuando esté disponible.
// No contienen datos personales.
export const pronunciationItems = Object.freeze([
 // 4.º Primaria - Inglés
 { id: 'pron-g4-001', grade: 4, lang: 'en', word: 'Hello', translation: 'Hola', difficulty: 'beginner', topic: 'Saludos', example: 'Hello, my friend.', tags: ['greetings'], source: 'demo' },
 { id: 'pron-g4-002', grade: 4, lang: 'en', word: 'Good morning', translation: 'Buenos días', difficulty: 'beginner', topic: 'Saludos', example: 'Good morning, teacher.', tags: ['greetings','phrases'], source: 'demo' },
 { id: 'pron-g4-003', grade: 4, lang: 'en', word: 'Cat', translation: 'Gato', difficulty: 'beginner', topic: 'Animales', example: 'The cat sleeps.', tags: ['animals'], source: 'demo' },
 { id: 'pron-g4-004', grade: 4, lang: 'en', word: 'Dog', translation: 'Perro', difficulty: 'beginner', topic: 'Animales', example: 'The dog runs.', tags: ['animals'], source: 'demo' },
 { id: 'pron-g4-005', grade: 4, lang: 'en', word: 'Red', translation: 'Rojo', difficulty: 'beginner', topic: 'Colores', example: 'A red apple.', tags: ['colors'], source: 'demo' },
 { id: 'pron-g4-006', grade: 4, lang: 'en', word: 'Book', translation: 'Libro', difficulty: 'beginner', topic: 'Objetos escolares', example: 'Open your book.', tags: ['school'], source: 'demo' },
 { id: 'pron-g4-007', grade: 4, lang: 'en', word: 'One', translation: 'Uno', difficulty: 'beginner', topic: 'Números', example: 'One pencil.', tags: ['numbers'], source: 'demo' },
 { id: 'pron-g4-008', grade: 4, lang: 'en', word: 'Two', translation: 'Dos', difficulty: 'beginner', topic: 'Números', example: 'Two books.', tags: ['numbers'], source: 'demo' },

 // 5.º Primaria
 { id: 'pron-g5-001', grade: 5, lang: 'en', word: 'Family', translation: 'Familia', difficulty: 'intermediate', topic: 'Familia', example: 'This is my family.', tags: ['family'], source: 'demo' },
 { id: 'pron-g5-002', grade: 5, lang: 'en', word: 'Breakfast', translation: 'Desayuno', difficulty: 'intermediate', topic: 'Comida', example: 'I eat breakfast.', tags: ['food'], source: 'demo' },
 { id: 'pron-g5-003', grade: 5, lang: 'en', word: 'I get up early', translation: 'Me levanto temprano', difficulty: 'intermediate', topic: 'Actividades cotidianas', example: 'I get up early for school.', tags: ['daily','phrases'], source: 'demo' },
 { id: 'pron-g5-004', grade: 5, lang: 'en', word: 'Park', translation: 'Parque', difficulty: 'intermediate', topic: 'Lugares', example: 'We play in the park.', tags: ['places'], source: 'demo' },
 { id: 'pron-g5-005', grade: 5, lang: 'en', word: 'Can I play?', translation: '¿Puedo jugar?', difficulty: 'intermediate', topic: 'Frases sencillas', example: 'Can I play with you?', tags: ['questions','phrases'], source: 'demo' },
 { id: 'pron-g5-006', grade: 5, lang: 'en', word: 'Butterfly', translation: 'Mariposa', difficulty: 'intermediate', topic: 'Animales', example: 'The butterfly is beautiful.', tags: ['animals'], source: 'demo' },

 // 6.º Primaria
 { id: 'pron-g6-001', grade: 6, lang: 'en', word: 'My name is...', translation: 'Mi nombre es...', difficulty: 'advanced', topic: 'Presentaciones', example: 'My name is Ana.', tags: ['introductions','phrases'], source: 'demo' },
 { id: 'pron-g6-002', grade: 6, lang: 'en', word: 'I like to read', translation: 'Me gusta leer', difficulty: 'advanced', topic: 'Descripciones', example: 'I like to read books.', tags: ['hobbies','phrases'], source: 'demo' },
 { id: 'pron-g6-003', grade: 6, lang: 'en', word: 'Where are you from?', translation: '¿De dónde eres?', difficulty: 'advanced', topic: 'Preguntas habituales', example: 'Where are you from?', tags: ['questions','phrases'], source: 'demo' },
 { id: 'pron-g6-004', grade: 6, lang: 'en', word: 'Could you help me?', translation: '¿Podrías ayudarme?', difficulty: 'advanced', topic: 'Expresiones de comunicación', example: 'Could you help me, please?', tags: ['polite','phrases'], source: 'demo' },
 { id: 'pron-g6-005', grade: 6, lang: 'en', word: 'I would like to know', translation: 'Me gustaría saber', difficulty: 'advanced', topic: 'Frases más extensas', example: 'I would like to know more.', tags: ['expressions','phrases'], source: 'demo' },
 { id: 'pron-g6-006', grade: 6, lang: 'en', word: 'Thank you very much', translation: 'Muchas gracias', difficulty: 'advanced', topic: 'Expresiones de comunicación', example: 'Thank you very much for your help.', tags: ['polite','phrases'], source: 'demo' },

 // Español (para práctica)
 { id: 'pron-es-001', grade: 4, lang: 'es', word: 'Hola', translation: 'Hello', difficulty: 'beginner', topic: 'Saludos', example: 'Hola, ¿cómo estás?', tags: ['greetings'], source: 'demo' },
]);

export function getPronunciationItems({ grade = null, lang = null, difficulty = null, topic = null } = {}) {
 return pronunciationItems.filter(item => {
  if (grade !== null && item.grade !== Number(grade)) return false;
  if (lang && item.lang !== lang) return false;
  if (difficulty && item.difficulty !== difficulty) return false;
  if (topic && item.topic !== topic) return false;
  return true;
});
}

export function getPronunciationItem(id) {
 return pronunciationItems.find(item => item.id === id) ?? null;
}

export function getPronunciationByWord(word, lang) {
 const normalize = value => String(value ?? '').trim().toLowerCase();
 return pronunciationItems.find(item => normalize(item.word) === normalize(word) && item.lang === lang) ?? null;
}
