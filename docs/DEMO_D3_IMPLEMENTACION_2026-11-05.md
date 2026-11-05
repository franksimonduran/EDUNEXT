# EDUNEXT DEMO D3 — Tutor, Translate, Pronuncia (2026-11-05)

## Alcance
Etapa 3/6 para una **presentación** con frontend estático HTML/CSS/JS. No modifica
backend, PostgreSQL, autenticación, cuentas, ni análisis académicos reales.
Respaldo previo: `backup-main-before-d3-2026-11-05`.

## Qué se implementó
- `student/tutor-demo.html`: tutor **guiado** con preguntas por Comunicación,
  Matemática, Ciencia y Tecnología, Personal Social e Inglés, usando un catálogo
  de explicaciones pedagógicas escritas y actividades de refuerzo. No admite chat
  generativo libre. La orientación contextual depende de la puntuación ficticia
  del recorrido de comprensión lectora.
- `student/traductor-demo.html`: consulta exacta del diccionario educativo existente
  (`js/data/dictionary-demo.data.js`) para español/inglés. Indica que la entrada no
  existe cuando el vocabulario solicitado no figura en los datos locales;
  no traduce párrafos ni consulta servicios externos.
- `student/pronuncia-demo.html`: vocabulario del 5.º grado obtenido de
  `js/data/pronunciation-demo.data.js`, escucha opcional mediante
  `speechSynthesis` del dispositivo y ejercicio escrito de significado.
  No solicita permisos de micrófono ni guarda grabaciones ni asigna puntuación fonética.
- `monitor/herramientas-ia-demo.html` y `admin/herramientas-ia-demo.html`:
  estado informativo sobre Tutor guiado, diccionario, pronunciación y capacidades
  NO certificadas (MiniCPM, Argos y análisis de voz).
- Accesos desde `demo.html`, los tres dashboards, `tutor.html`,
  `traductor.html` y `pronuncia.html` sin sustituir sus implementaciones previas.
- La práctica `student/recorrido-demo.html` enlaza al tutor con orientación de
  lectura después de finalizar; no adjudica IA real a la explicación.

## Archivos principales
`frontend/js/demo/ai-guided.js`: respuestas educativas y catálogo de capacidades.
`frontend/js/demo/translation.js`: adaptación al diccionario ya existente.
`frontend/js/demo/pronunciation.js`: referencias existentes y síntesis opcional.
`frontend/js/demo/ai-tools.js`: controlador de las cinco páginas.
`frontend/css/pages/demo-ai-d3.css`: diseño responsive con accesibilidad de
teclado, estados claros y sin librerías remotas.

## Secuencia para el jurado
1. `demo.html` → **Tutor** → elegir tema y pregunta → mostrar explicación.
2. `student/recorrido-demo.html` → completar lectura → abrir explicación guiada.
3. **Translate** → consultar «Escuela» = «School» usando diccionario.
4. **Pronuncia** → elegir «Family» → escuchar si hay voz del dispositivo
   → comprobar significado escrito «Familia».
5. **Monitor** y **Administrador** → consultar el estado de herramientas sin
   atribuir servicios generativos no verificados.

## Verificaciones
`node tests/demo-d3.mjs` verifica catálogo, respuestas, selección por resultado,
diccionario bidireccional, fallos explícitos para palabras desconocidas,
referencias de pronunciación, síntesis simulada, enlaces y ausencia de captación
de micrófono o llamadas a servicios desde el nuevo módulo.
`node tools/demo-smoke.cjs` en Chrome comprueba rutas enlazadas desde portada
a 360 y 1280 píxeles; CI ejecuta además verificaciones D1/D2.
El despliegue Pages incluye una precondición que exige archivos y pruebas D3.

## Límites y seguridad
- La generación **MiniCPM local real** del proyecto no se considera certificada
  por la existencia del runtime; no se descarga ni activa modelo alguno en D3.
- **Argos Translate** requiere un entorno de ejecución adicional; GitHub Pages
  no ejecuta el proceso Python.
- Si `speechSynthesis` no está disponible no hay audio ni se marca error en
  el aprendizaje escrito. Una llamada a `speechSynthesis.speak` solo solicita
  reproducción: no garantiza la existencia de una voz local compatible.
- No se solicitan datos personales, cámara, micrófono ni permisos docentes.
  No usar las vistas para emitir calificaciones ni diagnósticos institucionales.
- La publicación de GitHub Pages permanece condicionada a configuraciones del
  repositorio/plan; crear el workflow no constituye despliegue confirmado.

## Próxima etapa D4
PWA, precarga de recursos y funcionamiento offline verificado, sin crear
sincronización remota ficticia.
