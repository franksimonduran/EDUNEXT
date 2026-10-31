// Diccionario educativo local de demostración. Cada entrada ha sido redactada y
// revisada manualmente. No hay traducciones generadas en tiempo de ejecución ni
// equivalencias inventadas: si una palabra no aparece aquí, la interfaz informa
// que se requiere el servicio de traducción.
// Categorías: noun, verb, adjective, phrase. `topic` es el área académica opcional.

export const dictionaryEntries = Object.freeze([
 // — Vocabulario general Español → Inglés —
 { id: 'es-en-hola', from: 'es', to: 'en', word: 'Hola', translation: 'Hello', category: 'phrase', example: 'Hola, ¿cómo estás?', exampleTranslation: 'Hello, how are you?', topic: null },
 { id: 'es-en-gracias', from: 'es', to: 'en', word: 'Gracias', translation: 'Thank you', category: 'phrase', example: 'Gracias por tu ayuda.', exampleTranslation: 'Thank you for your help.', topic: null },
 { id: 'es-en-libro', from: 'es', to: 'en', word: 'Libro', translation: 'Book', category: 'noun', example: 'El libro está sobre la mesa.', exampleTranslation: 'The book is on the table.', topic: 'Comunicación' },
 { id: 'es-en-escuela', from: 'es', to: 'en', word: 'Escuela', translation: 'School', category: 'noun', example: 'Mi escuela tiene un patio grande.', exampleTranslation: 'My school has a big playground.', topic: 'Personal Social' },
 { id: 'es-en-agua', from: 'es', to: 'en', word: 'Agua', translation: 'Water', category: 'noun', example: 'Bebo agua después de correr.', exampleTranslation: 'I drink water after running.', topic: 'Ciencia y Tecnología' },
 { id: 'es-en-casa', from: 'es', to: 'en', word: 'Casa', translation: 'House', category: 'noun', example: 'Mi casa está cerca del parque.', exampleTranslation: 'My house is near the park.', topic: null },
 { id: 'es-en-perro', from: 'es', to: 'en', word: 'Perro', translation: 'Dog', category: 'noun', example: 'El perro juega en el jardín.', exampleTranslation: 'The dog plays in the garden.', topic: null },
 { id: 'es-en-gato', from: 'es', to: 'en', word: 'Gato', translation: 'Cat', category: 'noun', example: 'El gato duerme en la silla.', exampleTranslation: 'The cat sleeps on the chair.', topic: null },
 { id: 'es-en-mariposa', from: 'es', to: 'en', word: 'Mariposa', translation: 'Butterfly', category: 'noun', example: 'La mariposa es hermosa.', exampleTranslation: 'The butterfly is beautiful.', topic: 'Ciencia y Tecnología' },
 { id: 'es-en-amigo', from: 'es', to: 'en', word: 'Amigo', translation: 'Friend', category: 'noun', example: 'Mi amigo me presta su lápiz.', exampleTranslation: 'My friend lends me his pencil.', topic: 'Personal Social' },

 // — Vocabulario académico Español → Inglés —
 { id: 'es-en-numero', from: 'es', to: 'en', word: 'Número', translation: 'Number', category: 'noun', example: 'El número siete es impar.', exampleTranslation: 'The number seven is odd.', topic: 'Matemática' },
 { id: 'es-en-suma', from: 'es', to: 'en', word: 'Suma', translation: 'Addition', category: 'noun', example: 'La suma de dos y tres es cinco.', exampleTranslation: 'The addition of two and three is five.', topic: 'Matemática' },
 { id: 'es-en-fraccion', from: 'es', to: 'en', word: 'Fracción', translation: 'Fraction', category: 'noun', example: 'Un cuarto es una fracción.', exampleTranslation: 'One quarter is a fraction.', topic: 'Matemática' },
 { id: 'es-en-circulo', from: 'es', to: 'en', word: 'Círculo', translation: 'Circle', category: 'noun', example: 'Dibujé un círculo con un compás.', exampleTranslation: 'I drew a circle with a compass.', topic: 'Matemática' },
 { id: 'es-en-lectura', from: 'es', to: 'en', word: 'Lectura', translation: 'Reading', category: 'noun', example: 'La lectura diaria mejora el vocabulario.', exampleTranslation: 'Daily reading improves vocabulary.', topic: 'Comunicación' },
 { id: 'es-en-historia', from: 'es', to: 'en', word: 'Historia', translation: 'Story', category: 'noun', example: 'La historia tiene un final feliz.', exampleTranslation: 'The story has a happy ending.', topic: 'Comunicación' },
 { id: 'es-en-planta', from: 'es', to: 'en', word: 'Planta', translation: 'Plant', category: 'noun', example: 'La planta necesita luz y agua.', exampleTranslation: 'The plant needs light and water.', topic: 'Ciencia y Tecnología' },
 { id: 'es-en-energia', from: 'es', to: 'en', word: 'Energía', translation: 'Energy', category: 'noun', example: 'El sol nos da energía.', exampleTranslation: 'The sun gives us energy.', topic: 'Ciencia y Tecnología' },
 { id: 'es-en-animal', from: 'es', to: 'en', word: 'Animal', translation: 'Animal', category: 'noun', example: 'El conejo es un animal pequeño.', exampleTranslation: 'The rabbit is a small animal.', topic: 'Ciencia y Tecnología' },
 { id: 'es-en-comunidad', from: 'es', to: 'en', word: 'Comunidad', translation: 'Community', category: 'noun', example: 'Mi comunidad cuida el parque.', exampleTranslation: 'My community takes care of the park.', topic: 'Personal Social' },

 // — Reversos Inglés → Español (permiten el intercambio de idiomas) —
 { id: 'en-es-hello', from: 'en', to: 'es', word: 'Hello', translation: 'Hola', category: 'phrase', example: 'Hello, how are you?', exampleTranslation: 'Hola, ¿cómo estás?', topic: null },
 { id: 'en-es-thank-you', from: 'en', to: 'es', word: 'Thank you', translation: 'Gracias', category: 'phrase', example: 'Thank you for your help.', exampleTranslation: 'Gracias por tu ayuda.', topic: null },
 { id: 'en-es-book', from: 'en', to: 'es', word: 'Book', translation: 'Libro', category: 'noun', example: 'The book is on the table.', exampleTranslation: 'El libro está sobre la mesa.', topic: 'Comunicación' },
 { id: 'en-es-school', from: 'en', to: 'es', word: 'School', translation: 'Escuela', category: 'noun', example: 'My school has a big playground.', exampleTranslation: 'Mi escuela tiene un patio grande.', topic: 'Personal Social' },
 { id: 'en-es-water', from: 'en', to: 'es', word: 'Water', translation: 'Agua', category: 'noun', example: 'I drink water after running.', exampleTranslation: 'Bebo agua después de correr.', topic: 'Ciencia y Tecnología' },
 { id: 'en-es-house', from: 'en', to: 'es', word: 'House', translation: 'Casa', category: 'noun', example: 'My house is near the park.', exampleTranslation: 'Mi casa está cerca del parque.', topic: null },
 { id: 'en-es-dog', from: 'en', to: 'es', word: 'Dog', translation: 'Perro', category: 'noun', example: 'The dog plays in the garden.', exampleTranslation: 'El perro juega en el jardín.', topic: null },
 { id: 'en-es-cat', from: 'en', to: 'es', word: 'Cat', translation: 'Gato', category: 'noun', example: 'The cat sleeps on the chair.', exampleTranslation: 'El gato duerme en la silla.', topic: null },
 { id: 'en-es-butterfly', from: 'en', to: 'es', word: 'Butterfly', translation: 'Mariposa', category: 'noun', example: 'The butterfly is beautiful.', exampleTranslation: 'La mariposa es hermosa.', topic: 'Ciencia y Tecnología' },
 { id: 'en-es-friend', from: 'en', to: 'es', word: 'Friend', translation: 'Amigo', category: 'noun', example: 'My friend lends me his pencil.', exampleTranslation: 'Mi amigo me presta su lápiz.', topic: 'Personal Social' },
 { id: 'en-es-number', from: 'en', to: 'es', word: 'Number', translation: 'Número', category: 'noun', example: 'The number seven is odd.', exampleTranslation: 'El número siete es impar.', topic: 'Matemática' },
 { id: 'en-es-fraction', from: 'en', to: 'es', word: 'Fraction', translation: 'Fracción', category: 'noun', example: 'One quarter is a fraction.', exampleTranslation: 'Un cuarto es una fracción.', topic: 'Matemática' },
 { id: 'en-es-circle', from: 'en', to: 'es', word: 'Circle', translation: 'Círculo', category: 'noun', example: 'I drew a circle with a compass.', exampleTranslation: 'Dibujé un círculo con un compás.', topic: 'Matemática' },
 { id: 'en-es-reading', from: 'en', to: 'es', word: 'Reading', translation: 'Lectura', category: 'noun', example: 'Daily reading improves vocabulary.', exampleTranslation: 'La lectura diaria mejora el vocabulario.', topic: 'Comunicación' },
 { id: 'en-es-story', from: 'en', to: 'es', word: 'Story', translation: 'Historia', category: 'noun', example: 'The story has a happy ending.', exampleTranslation: 'La historia tiene un final feliz.', topic: 'Comunicación' },
 { id: 'en-es-plant', from: 'en', to: 'es', word: 'Plant', translation: 'Planta', category: 'noun', example: 'The plant needs light and water.', exampleTranslation: 'La planta necesita luz y agua.', topic: 'Ciencia y Tecnología' },
 { id: 'en-es-energy', from: 'en', to: 'es', word: 'Energy', translation: 'Energía', category: 'noun', example: 'The sun gives us energy.', exampleTranslation: 'El sol nos da energía.', topic: 'Ciencia y Tecnología' },
 { id: 'en-es-community', from: 'en', to: 'es', word: 'Community', translation: 'Comunidad', category: 'noun', example: 'My community takes care of the park.', exampleTranslation: 'Mi comunidad cuida el parque.', topic: 'Personal Social' },
]);

export function findEntry(from, to, word) {
 const normalize = value => String(value).trim().toLocaleLowerCase('es').normalize('NFD').replace(/\p{Diacritic}/gu, '');
 const target = normalize(word);
 return dictionaryEntries.find(entry => entry.from === from && entry.to === to && normalize(entry.word) === target) ?? null;
}

export function listEntries(from, to) {
 return dictionaryEntries.filter(entry => entry.from === from && entry.to === to);
}
