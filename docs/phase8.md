# Fase 8 — AITHRON TRANSLATE: Traductor, escucha y vocabulario educativo

## Abrir localmente

```powershell
Set-Location "D:\Programing\ATHRON EDU1"
python -m http.server 8080 --bind 127.0.0.1 --directory frontend
```

- **Traductor:** http://127.0.0.1:8080/student/traductor.html?grade=5
- **Mi vocabulario:** http://127.0.0.1:8080/student/vocabulario.html?grade=5
- **Detalle de palabra:** http://127.0.0.1:8080/student/palabra.html?grade=5&word=Butterfly&from=en&to=es
- **Repaso:** http://127.0.0.1:8080/student/repaso-vocabulario.html?grade=5

Accesibles desde Dashboard → Accesos rápidos → **Aithron Translate**, desde Sidebar → **Traductor**, desde **Mis cursos → Más**, y desde **Lecciones → No entendí → Traducir esta palabra**.

## Referencia visual

El ZIP disponible (`D:\Programing\ATHRON EDU.zip`) es el proyecto Next.js original; **no se encontraron imágenes de referencia para Traductor ni para Vocabulario**. Se reutiliza la identidad, componentes, paleta, tipografía y espaciados de AITHRON EDU. La comparación exacta con mockups queda pendiente de recibirlos.

## PANTALLA 1 — Traductor principal

### Encabezado
- Ícono de traducción, título **AITHRON TRANSLATE**, subtítulo educativo, acceso a **Mi vocabulario**, badge **Modo demostración**, descripción.

### Dos paneles
- **Panel origen:** selector de idioma (sin banderas, con nombre + endónimo), área de escritura, contador, limpiar, escuchar, pegar (solo si Clipboard API está disponible), estado.
- **Panel destino:** selector de idioma, resultado traducido, copiar, escuchar, escuchar lento, guardar palabra, ver detalle, pronunciación.
- **Intercambio:** botón entre paneles para intercambiar idiomas.
- **Traducir:** botón principal con estados normal/hover/focus/disabled/processing/error/resultado.
- **Detectar idioma:** botón visible pero identificado como pendiente (sin detección automática falsa).

### Idiomas
Interfaz ES/EN. Traductor: Español, Inglés, Portugués, Francés, Alemán, Italiano, Chino mandarín, Japonés, Coreano, Árabe. **Quechua** y **Aymara** registrados como pendientes de incorporación (no seleccionables). Solo **Español ↔ Inglés** tienen datos demostrativos; otros pares muestran: *"Este par de idiomas estará disponible al conectar el servicio de traducción"*.

### Diccionario local de demostración
Palabras/frases cortas verificadas (Hola/Hello, Gracias/Thank you, Libro/Book, Escuela/School, Agua/Water, Casa/House, Perro/Dog, Gato/Cat, Mariposa/Butterfly, Amigo/Friend, y vocabulario de Matemática/Comunicación/Ciencia/Personal Social). Cada entrada incluye: idioma origen/destino, palabra, traducción, categoría, ejemplo, traducción del ejemplo, tema académico opcional. **Nunca se generan traducciones improvisadas**.

### Tarjeta educativa
Tras traducir una palabra compatible: traducción, categoría, ejemplo + traducción del ejemplo, acciones (escuchar, escuchar lento, guardar, ver detalle, **🎤 Inténtalo tú**).

### Escuchar / Escuchar lento
Web Speech API cuando está disponible. Selecciona voz según idioma, velocidad lenta real (`rate 0.6`). Detener reproducción. Mensajes honestos si no hay soporte/voces.

### Pronunciación
Botón "Inténtalo tú" abre diálogo con mensaje **"Práctica de pronunciación disponible próximamente"**. Sin micrófono, sin puntuación.

### Guardar vocabulario
Botón guardar/quitar (favorito). Deduplicación. Colección temporal en **SessionStorage** (`aithron.demo.vocabulary.v1`) con respaldo en memoria, compartida entre vistas. Datos temporales, no sincronizados. Sin LocalStorage.

## PANTALLA 2 — Mi vocabulario

Resumen (palabras guardadas, idiomas representados, palabras revisadas, categorías) — datos reales de la sesión. Lista con palabra, traducción, idiomas, categoría, audio, ver detalle, quitar favorito. Filtros: buscar, filtrar por idioma/categoría, ordenar alfabéticamente/reciente. Estado vacío → "Ir al traductor". Aviso de temporalidad.

## PANTALLA 3 — Detalle de palabra

Información completa solo desde diccionario local: palabra, traducción, idiomas, categoría gramatical, significado educativo, ejemplo + traducción, audio/escuchar lento, guardar/quitar, acceso a repaso, pronunciación futura. Si no existe → página "No encontramos esta palabra" con regreso al traductor.

## PANTALLA 4 — Repaso de vocabulario

Tres modalidades: **Flashcards** (mostrar/ocultar traducción, anterior/siguiente, escuchar), **Elegir traducción** (una correcta, validación real), **Relacionar palabras** (emparejar palabras-traducciones). Resultados reales: repasadas, correctas, incorrectas, porcentaje de aciertos (no es nota oficial). Si pocas palabras → se ofrece conjunto de demostración claramente identificado.

## Integración educativa
- Dashboard: Accesos rápidos → **Aithron Translate** (navegación real).
- Sidebar/Topbar/Más: **Traductor** accesible.
- Lección (tab Practicar → **No entendí**): opción **Traducir esta palabra** abre traductor con contexto (grade/course/unit/lesson).
- Navegación entre Traductor ↔ Mi vocabulario ↔ Detalle ↔ Repaso.

## Modo offline
Consulta diccionario demostrativo incluido. Muestra traducciones locales. Sin traducción inventada sin conexión. Voz depende de recursos del dispositivo.

## Soporte RTL
Árabe soportado visualmente con `dir="rtl"` solo en campos/resultados relevantes; interfaz completa no se invierte.

## Archivos creados

### Datos
- `frontend/js/data/languages.data.js`
- `frontend/js/data/dictionary-demo.data.js`
- `frontend/js/data/vocabulary-demo.data.js`

### Servicios
- `frontend/js/services/translation.service.js` (diccionario local, sin invención)
- `frontend/js/services/translation-api.service.js` (frontera futura FastAPI)
- `frontend/js/services/vocabulary.service.js` (SessionStorage temporal + memoria)
- `frontend/js/services/speech.service.js` (Web Speech API)

### Utilidades
- `frontend/js/utils/text-direction.js`
- `frontend/js/utils/language-format.js`
- `frontend/js/utils/translation-validation.js`

### Componentes
- `frontend/js/components/language-selector.js`
- `frontend/js/components/translation-panel.js`
- `frontend/js/components/translation-result.js`
- `frontend/js/components/audio-controls.js`
- `frontend/js/components/vocabulary-card.js`
- `frontend/js/components/flashcard.js`

### Pantallas
- `frontend/student/traductor.html` / `frontend/js/student/translator.js` / `frontend/js/student/translator-i18n.js`
- `frontend/student/vocabulario.html` / `frontend/js/student/vocabulary.js`
- `frontend/student/palabra.html` / `frontend/js/student/word-detail.js`
- `frontend/student/repaso-vocabulario.html` / `frontend/js/student/vocabulary-review.js`

### CSS
- `frontend/css/student/translator.css`
- `frontend/css/student/vocabulary.css`
- `frontend/css/student/word-detail.css`
- `frontend/css/student/vocabulary-review.css`

## Archivos modificados
- `frontend/js/core/config.js` (límites traductor + speech)
- `frontend/js/student/learning-routes.js` (rutas traductor/vocabulario/palabra/repaso)
- `frontend/js/student/dashboard.js` (traductor navega)
- `frontend/js/student/learning-shell.js` (navegación traductor)
- `frontend/js/student/lessons.js` (opción "Traducir esta palabra")
- `frontend/js/student/learning-i18n.js` (etiqueta traducir)
- `frontend/js/components/icons.js` (swap/copy/speaker/slow/star/bookmark/trash/paste/search/filter/sort/flip)

## Pruebas
Pendiente de ejecución completa con Playwright/Axe en entorno del proyecto. Verificaciones manuales realizadas en lógica: traducción local sin invención, pares no disponibles con mensaje, intercambio idiomas, guardar/quitar sin duplicados, filtros/revisión, RTL, escape HTML, sin LocalStorage para vocabulario, Web Speech con fallback, navegación real.

## Pendiente
- Integración real FastAPI `/api/translate` (autenticación/rol/límites/filtro evaluación/formal/moderación), proveedor y secretos solo backend.
- Detección automática de idioma.
- Reconocimiento/evaluación de voz (Fase 9), `pronuncia.html`.
- Sincronización de vocabulario con backend/IndexedDB + políticas privacidad/COPPA.
- Traducción de textos arbitrarios, más pares de idiomas, fuentes confiables para Quechua/Aymara.
- PWA offline completo y Aithron Sync.
