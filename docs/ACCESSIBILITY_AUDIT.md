# Accesibilidad — alcance parcial

Referencia: WCAG 2.2 AA; **no se declara conformidad**. Prueba real limitada a login.html en Edge y Chrome headless con viewport 320/375/768/1440 px. Sin lector de pantalla, zoom, contraste automatizado ni dispositivo móvil físico.

Comprobado: lang=es, un h1, main presente, inputs sin etiqueta detectados=0, formulario vacío establece aria-invalid en identificador y contraseña, foco vuelve a identifier; Tab real mediante CDP mueve foco a password. Sin desbordamiento horizontal ni Runtime.exceptionThrown en esas cargas.

No hubo correcciones visuales basadas en esta muestra porque no reprodujo un defecto en esos controles. No se certifica todo el orden del foco, anuncio por lector de pantalla, contraste, objetivos táctiles, movimiento reducido, tablas/gráficos o juegos drag-and-drop.

Pendiente: todos los flujos por rol, alternativas a audio/micrófono, zoom 200–400%, teclado en modales, prácticas y evaluaciones, lenguaje infantil validado y pruebas con tecnologías de asistencia. Los sinks DOM y etiquetas detectadas por heurística no sustituyen evaluación manual.

Evidencia: PHASE_48_BROWSER_EVIDENCE.json; herramienta propia tests/phase48-browser.cjs, sin framework de aplicación nuevo.
