# EDUNEXT DEMO — Segunda etapa D2 (frontend de presentación)

Fecha de preparación: 2026-11-05. Proyecto original respaldado en
`backup-main-before-d2-2026-11-05`.

## Objetivo
Conectar de forma verificable los frontends Estudiante, Monitor y Administrador
usando **el mismo resultado ficticio de la práctica de Comunicación**,
sin alterar el backend, notas oficiales, datos reales o indicadores históricos
de ejemplo.

## Cambios
- Progreso del estudiante: `student/progreso-demo.html`. Porcentajes reales
  del cuestionario guiado; puntos demostrativos = 20 × respuestas correctas;
  insignia «Lector del huerto» cuando se alcanza 80 %.
- Seguimiento del monitor: `monitor/seguimiento-demo.html`. Ficha de
  Estudiante Demo 01 (5.º A), filtro funcional de prácticas que requieren
  refuerzo por debajo del 80 %, y enlaces a módulos docentes existentes.
- Reporte del administrador: `admin/informe-demo.html`. Única evidencia
  ficticia de Comunicación, con filtro por curso: Matemática produce estado vacío
  explícito porque no hay datos reales de esa asignatura en el recorrido.
- Widgets complementarios (no reemplazan ni alteran datos originales) en:
  `student/progreso.html`, `student/logros.html`,
  `monitor/detalle-estudiante.html`, `monitor/reportes.html`,
  `admin/reportes.html`, `admin/estadisticas-institucionales.html`.
- Los dashboards originales enlazan a estos tres recorridos mediante
  `js/demo/dashboard-banner.js`.
- La portada `demo.html` incorpora enlaces directos a las nuevas vistas.
- Estilos responsive compartidos en `css/pages/demo-journeys-d2.css`,
  sin dependencias de CDN para estas pantallas.

## Criterio de coherencia
Los tres perfiles leen `edunext:presentacion:lectura:v1` del mismo navegador/origen.
Es una única evidencia de un único estudiante *ficticio*:
- Antes de practicar: sin resultado, 0 puntos y ninguna insignia.
- Cinco aciertos: 100 %, 100 puntos y distintivo.
- Cuatro aciertos: 80 %, 80 puntos y distintivo.
- Tres aciertos: 60 %, 60 puntos, sin distintivo.
El porcentaje de avance del recorrido muestra 100 % al completar las cinco
preguntas, **no es progreso curricular global**.

La evidencia no se refleja en dispositivos ajenos, no representa calificación
ni debe mezclarse con los informes originales.

## Pruebas
- `node tests/demo-presentation.mjs`
- `node tests/demo-d2.mjs`
- `node --check frontend/js/demo/role-pages.js`
- `node --check frontend/js/demo/context-panel.js`
- `node tools/demo-audit.cjs`
- `node tools/demo-smoke.cjs` (Edge/Chrome disponible; ver guía de demo)

El workflow `.github/workflows/demo-d2-browser.yml` ejecuta un smoke en
navegador a 360/1280 px. La suite existente de CI integra las pruebas D2.

## Secuencia para el jurado
`demo.html` → `student/recorrido-demo.html` → resultado →
`student/progreso-demo.html` → `monitor/seguimiento-demo.html` →
`admin/informe-demo.html`.
Las pantallas originales del producto siguen accesibles en cada perfil.

## Limitaciones
GitHub Pages debe estar habilitado desde Settings → Pages y ser compatible
con el plan/visibilidad actual del repositorio; crear el workflow **no** activa
Pages ni confirma un despliegue público. No se modifica la privacidad del
repositorio. IA, traductor, micrófono, Sync y autorización institucional
siguen fuera del alcance de esta entrega.

Los widgets contextuales se insertan de forma independiente; si la vista
original tiene un error o una API ausente, ello no demuestra que el sistema
completo funcione. No ingresar datos reales de menores.
