# Fase 5 — AITHRON APRENDE

## Ejecutar

Desde la raíz del proyecto:

```powershell
python -m http.server 8080 --bind 127.0.0.1 --directory frontend
```

Abrir **http://127.0.0.1:8080/student/aprende.html?grade=4**. También se puede entrar desde «Mis cursos» en el Sidebar o en la navegación inferior del Dashboard.

Ejemplo de recorrido, anteponiendo `http://127.0.0.1:8080/student/`:

1. `aprende.html?grade=4`
2. `curso.html?grade=4&course=math`
3. `unidad.html?grade=4&course=math&unit=math-g4-u1`
4. `leccion.html?grade=4&course=math&unit=math-g4-u1&lesson=math-g4-u1-l1`

No necesita compilación ni dependencias de ejecución. Servir por HTTP es necesario para los módulos y recursos; no utilizar `file://`.

## Referencias y alcance visual

Se volvió a consultar el ZIP disponible (`D:\Programing\ATHRON EDU.zip`), sin encontrar las imágenes originales de cursos, unidades o lecciones. Se informó antes de implementar. El módulo reutiliza el Sidebar, Topbar, variables, botones, tarjetas, iconos, progreso y diálogos del Dashboard. La comparación exacta con el ZIP queda pendiente de recibir esas imágenes.

Se añadieron estilos propios de las nuevas páginas, incluido celeste para Inglés, sin rediseñar la navegación anterior.

## Las cuatro pantallas

### Mis cursos

Cinco asignaturas por grado: Matemática, Comunicación, Ciencia y Tecnología, Personal Social e Inglés. Las tarjetas incluyen ilustración SVG, descripción, unidad, número de lecciones, avance, estado «No descargado» y enlace a su curso.

Filtros reales sobre los datos locales: Todos, En progreso, Completados y Disponibles offline. Los datos actuales no incluyen cursos completos al 100 % ni descargas verificadas; esos filtros muestran un estado vacío con explicación. En 4.º, el curso de Personal Social no está iniciado y se excluye de En progreso.

El resumen del catálogo cuenta las lecciones incluidas en este subconjunto de demostración. El Dashboard conserva sus estadísticas generales de muestra de fase 4; todavía no existe una fuente académica real unificada.

### Curso

Encabezado con asignatura, grado, descripción, avance y continuación hacia la primera lección que no esté completada en los datos. Objetivos, temas, resumen de lecciones y tarjeta de unidad.

«Descargar curso» abre una explicación de integración pendiente. No genera una descarga, una marca de completado ni un registro en almacenamiento.

### Unidad

Breadcrumbs, objetivo, descripción, progreso, disponibilidad offline y cuatro lecciones con estado, duración orientativa y tipos de recurso.

El repaso muestra un resumen real de las cuatro explicaciones de la unidad. Los accesos a práctica completa y evaluación explican que se implementarán en otras fases. No existe evaluación habilitada.

### Lección

Plantilla única para los 60 identificadores, con título, número, avance de muestra, índice contextual y navegación Anterior/Siguiente/Volver a la unidad.

- **Leer:** objetivo, explicación, concepto destacado, ejemplo y diagrama.
- **Escuchar:** archivo WAV real, controles nativos de reproducción/pausa, avance, duración, volumen cuando el navegador lo ofrece, selector de velocidad y transcripción.
- **Visualizar:** diagrama original específico de la lección, descrito con texto alternativo y leyenda.
- **Practicar:** selección múltiple, comprobación, retroalimentación correcta/incorrecta y continuación hacia la siguiente lección o vuelta a la unidad.

Las pestañas implementan roles ARIA, selección única, foco móvil y teclas Flecha izquierda/derecha, Inicio y Fin. Al abandonar Escuchar se pausa el audio. El índice aparece en una columna de escritorio y empieza plegado en móvil.

## «No entendí»

Diálogo con cinco opciones:

- Explicación breve, escrita en los datos.
- Tres pasos relacionados con la lección.
- Otro ejemplo distinto al principal.
- El diagrama de la lección.
- Información de conexión futura con Aithron Tutor.

No se llama a IA ni se presenta texto preescrito como respuesta generada. El diálogo permite Escape, cierre explícito y retorno del foco.

## Datos, progreso y rutas

Hay **15 cursos, 15 unidades y 60 lecciones**: una unidad de cuatro lecciones por asignatura y grado. Las unidades actuales están disponibles; no se impusieron bloqueos arbitrarios. El modelo incluye disponibilidad y razón para poder incorporar reglas definidas después.

- Curso: ID de asignatura, grado, nombre, descripción, ilustración, objetivos, avance y IDs de unidades.
- Unidad: ID único, curso, grado, título, objetivos, disponibilidad e IDs de lecciones.
- Lección: ID único, curso/unidad/grado, título, objetivo, bloques, ejemplos, diagramas, audio, ejercicio y alternativas de explicación.

El avance es determinista y deriva de los datos de muestra. Contestar un ejercicio no modifica notas ni porcentajes. No hay persistencia, guardado o sincronización simulados.

El grado y el idioma que viajan por URL son preferencias de demostración, no un expediente real ni una autorización. Se validan grados, parámetros duplicados, cursos y pertenencia de unidad/lección. Un identificador inexistente o de otro curso muestra «Contenido no encontrado» con regreso al catálogo, sin intentar cargar recursos arbitrarios.

Las interfaces admiten español e inglés. El contenido educativo y sus narraciones están explícitamente identificados como muestras en español y requieren revisión pedagógica. No se presentan como currículo aprobado por MINEDU.

## Recursos de audio

Los 60 WAV de `frontend/assets/audio/lessons/` contienen narraciones pregrabadas, generadas localmente con la voz sintética **Microsoft Sabina Desktop (es-MX)**, a partir de la transcripción de cada lección. El navegador reproduce esos archivos; no usa una simulación de audio ni depende de síntesis de voz en tiempo de ejecución.

Opcionalmente pueden regenerarse en Windows, con Node.js y esa voz instalada, desde la raíz:

```powershell
.\tools\generate-demo-audio.ps1
```

El script usa System.Speech y escribe WAV mono a 16 kHz/16 bits. No usa red ni API. **No es necesario ejecutarlo para abrir la aplicación**, porque los archivos ya están incluidos.

Los diagramas se dibujan mediante SVG a partir de datos de la lección: partes iguales para fracciones, decimales y porcentajes; conceptos y relaciones etiquetadas para lectura, ciencia, comunidad e inglés. No se sustituye un tema con una imagen ajena.

## Archivos creados

```text
frontend/student/
  aprende.html
  curso.html
  unidad.html
  leccion.html
frontend/css/student/
  courses.css
  course-detail.css
  units.css
  lessons.css
frontend/js/student/
  courses.js
  course-detail.js
  units.js
  lessons.js
  learning-i18n.js
  learning-routes.js
  learning-shell.js
  learning-page.js
frontend/js/components/
  unit-card.js
  lesson-navigation.js
  audio-player.js
  learning-tabs.js
  learning-visual.js
frontend/js/data/
  courses-demo.data.js
  units-demo.data.js
  lessons-demo.data.js
frontend/js/services/
  course.service.js
  lesson.service.js
frontend/assets/audio/lessons/
  60 archivos WAV
tools/generate-demo-audio.ps1
tests/learning.browser.cjs
docs/phase5.md
```

También se generaron diez capturas en `docs/previews/`.

## Archivos modificados

- `frontend/js/components/sidebar.js`: perfil activo configurable; mantiene Inicio por defecto en el Dashboard.
- `frontend/js/components/topbar.js`: nivel de encabezado configurable para las nuevas páginas, conservando el estilo.
- `frontend/js/components/course-card.js`: variante de catálogo sobre el mismo componente, con metadatos y enlace.
- `frontend/css/student/dashboard.css`: selector del título de Topbar compartido; no se cambió el layout del Dashboard.
- `frontend/js/student/dashboard.js`: navegación real a cursos y continuación de una lección válida; lectura de grado/idioma de muestra al regresar.
- `tests/student-dashboard.browser.cjs`: comprobaciones actualizadas para verificar los nuevos destinos en lugar de los antiguos avisos provisionales.
- `README.md`: rutas y resumen de fase 5.
- Capturas anteriores regeneradas por las pruebas de regresión.

No se cambiaron las pantallas de autenticación ni la selección/autorización de roles. La navegación autenticada continúa desactivada.

## Pruebas ejecutadas

Microsoft Edge headless con Playwright y auditoría opcional Axe, externas a las dependencias de la aplicación:

1. Integridad de 15 cursos, 15 unidades y 60 IDs únicos de lección.
2. Los 60 archivos de audio responden HTTP 200 y tienen formato WAV real y datos de audio; no son archivos vacíos.
3. Reproducción real de una narración en navegador: duración, avance de `currentTime`, pausa al cambiar de pestaña, volumen y velocidad.
4. Cinco asignaturas por grado y filtros con sus resultados/estados vacíos.
5. Navegación por las cinco asignaturas desde catálogo a curso, unidad y lección.
6. Breadcrumbs, índice actual y navegación Anterior/Siguiente, con cambio de título y fuente de audio.
7. Cuatro pestañas y navegación con flechas/Fin.
8. Ejercicio vacío, respuesta incorrecta, correcta y continuación, sin cambio del avance académico.
9. Cinco opciones de «No entendí», cierre con Escape y retorno del foco.
10. Repaso, práctica/evaluación pendientes y descarga sin marcas ficticias.
11. Cuatro pantallas a **320, 375, 768, 1024, 1440 y 1920 px**, sin desplazamiento horizontal.
12. Índice plegable en móvil, recursos y enlaces HTTP 200, identificadores inválidos, parámetros duplicados y unidad de otro curso.
13. Controles español/inglés y navegación con idioma conservado en URL.
14. Integración Dashboard → catálogo y Dashboard → lección de fracciones/decimales válida.
15. Sin errores de consola/JavaScript, peticiones externas o de modificación, ni escrituras en LocalStorage, SessionStorage o IndexedDB.
16. Axe: sin infracciones detectadas en las reglas automáticas WCAG A/AA seleccionadas para las cuatro páginas en escritorio/móvil y el diálogo de ayuda.
17. Regresión del Dashboard, Login, Registro, Recuperación, Reset, Perfiles y Acceso no autorizado: suites ejecutadas y superadas.
18. Capturas generadas y revisión visual de catálogo, curso, unidad móvil, lección en escritorio/móvil, audio y diálogo de ayuda.

No se afirma una prueba auditiva humana de las 60 narraciones: se verificaron todos los archivos y se probó reproducción real en navegador. Tampoco se ha certificado accesibilidad manual con lector de pantalla, compatibilidad con otros motores ni revisión pedagógica oficial.

### Repetir las pruebas conservadas

Con el servidor local abierto, Node.js y Microsoft Edge instalados:

```powershell
npm install --prefix "$env:TEMP\aithron-ui-tests" playwright @axe-core/playwright --no-save --package-lock=false
$env:PLAYWRIGHT_MODULE = "$env:TEMP\aithron-ui-tests\node_modules\playwright"
$env:AXE_MODULE = "$env:TEMP\aithron-ui-tests\node_modules\@axe-core\playwright"
$env:BASE_URL = "http://127.0.0.1:8080/"
node tests/learning.browser.cjs
node tests/student-dashboard.browser.cjs
```

Las dependencias de verificación se instalan fuera del frontend. Omitir `AXE_MODULE` para ejecutar solo las pruebas funcionales. Los scripts regeneran capturas en `docs/previews/`.

## Capturas

- [Mis cursos, escritorio](previews/aprende-catalog-desktop.png) / [móvil](previews/aprende-catalog-mobile.png)
- [Curso, escritorio](previews/aprende-course-desktop.png) / [móvil](previews/aprende-course-mobile.png)
- [Unidad, escritorio](previews/aprende-unit-desktop.png) / [móvil](previews/aprende-unit-mobile.png)
- [Lección, escritorio](previews/aprende-lesson-desktop.png) / [móvil](previews/aprende-lesson-mobile.png)
- [Audio real](previews/aprende-lesson-audio.png)
- [Ayuda «No entendí»](previews/aprende-lesson-help.png)

## Pendiente de integración

Recibir los mockups originales; revisar y ampliar contenidos, narraciones y diagramas; conectar datos autorizados por grado; unificar el progreso académico real; incorporar persistencia y sincronización confirmada; implementar descargas verificadas con IndexedDB/Cache Storage/Service Worker. El estado actual siempre indica que no hay recursos descargados por la aplicación.

Tutor IA, práctica/evaluaciones completas, traductor, pronunciación, juegos, autenticación, FastAPI y PostgreSQL no se implementaron en esta fase.
