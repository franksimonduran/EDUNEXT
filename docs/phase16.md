# Fase 16 — Estudiantes, aulas y seguimiento docente

## Ejecutar
Desde `D:\Programing\ATHRON EDU1\frontend`:

```powershell
python -m http.server 8088 --bind 127.0.0.1
```

Abrir `/monitor/estudiantes.html`, `/monitor/aulas.html` o navegar desde `/monitor/index.html`. Ejemplos de detalle: `/monitor/detalle-estudiante.html?id=a5-s1`, `/monitor/detalle-aula.html?id=a5`, `/monitor/seguimiento-aula.html?id=a5`.

## Reutilización e inspección
Se revisaron datos y Dashboard fase 15, Sidebar, Topbar, CSS, servicio de estadísticas y navegación por perfiles. El ZIP original sigue sin contener imágenes PNG/JPG de monitor, aulas o estudiantes: no se afirma reproducción exacta de esos mockups. Se conserva la identidad y arquitectura actuales.

Las fases previas contienen implementaciones y documentación, pero no se certifica su finalización mediante esta fase. La limitación offline de fase 14 documentada en fase 15 sigue vigente.

## Archivos
Creados:
- `frontend/monitor/estudiantes.html`
- `frontend/monitor/detalle-estudiante.html`
- `frontend/monitor/aulas.html`
- `frontend/monitor/detalle-aula.html`
- `frontend/monitor/seguimiento-aula.html`
- `frontend/css/monitor/management.css`
- `frontend/js/monitor/management.js`
- `frontend/js/monitor/management-shell.js`
- `frontend/js/services/monitor-students.service.js`
- `frontend/js/components/monitor-student-table.js`
- `tests/phase16.cjs`

Modificado: `frontend/js/monitor/dashboard.js`, para conectar estudiantes, aulas, perfiles de apoyo y seguimiento. Los componentes globales permanecen compartidos.

## Datos y cálculos
Fuente única: `monitor-demo.data.js`, con 76 alias ficticios (24/28/24), tres aulas autorizadas y cinco asignaturas por grado. No se agregan bases locales ni solicitudes externas.

Progreso curricular individual: completadas / asignadas ×100. El total existente de 20 lecciones por estudiante se distribuye determinísticamente en cinco cursos de cuatro lecciones, dos unidades ilustrativas cada uno. No son lecciones reales vinculadas al catálogo del estudiante: se etiquetan expresamente como muestra; las fechas permanecen desconocidas. La suma por curso coincide siempre con el total fase 15.

Aula: suma de completadas / suma de asignadas, ponderado por lecciones. La muestra tiene 20 asignadas por estudiante, por lo que también coincide con la media individual. Si no hay denominador válido se muestra sin datos suficientes. No se mezclan porcentajes curriculares con aciertos formativos. Se mantiene el redondeo del Dashboard.

Las prácticas reutilizan exactamente los registros fase 15. Fortalezas: dos prácticas del mismo curso/tema con ≥80 %; refuerzo: dos con <50 %. Evidencias visibles, sin IA ni diagnósticos. Evaluaciones programadas son grupales; no se atribuyen intentos individuales ni resultados publicados inexistentes. El número de respuestas abiertas es expresamente del aula.

Búsqueda de estudiantes normaliza mayúsculas y acentos; permite alias, código y aula/grado. Filtros se combinan y conservan durante paginación. Todos cursan cinco asignaturas: filtrar por una de ellas mantiene legítimamente la misma lista. Resumen de estudiantes corresponde al aula seleccionada, mientras el listado aplica el conjunto completo de filtros; esta distinción está indicada en pantalla.

## Pruebas
Ejecutar desde raíz del proyecto:

```powershell
node tests/phase16.cjs
```

Requiere Playwright/Chromium. Se puede indicar su módulo mediante `PLAYWRIGHT_MODULE`. La prueba inicia servidor temporal en localhost:8096 y lo cierra al finalizar.

Verificado: búsqueda parcial, filtros aula/grado combinados, limpieza, cambio de orden, paginación conservando aula, detalles y expansión de unidades/lecciones, IDs inválidos, filtro de aulas, búsqueda de integrantes, gráficos, modales y Escape, foco básico por Tab, navegación Dashboard→Estudiantes, enlaces del contenido, ausencia de errores JS/HTTP y ausencia de overflow en las cinco vistas a 1280/768/320 px. También se verifica unicidad de 76 estudiantes y coherencia de sumas por curso y aula.

No ejecutados: auditoría completa con lector de pantalla, navegadores adicionales, regresión exhaustiva de fases 1–14 ni conectividad real de backend. La prueba de ordenación comprueba el control, no todas las combinaciones posibles. No se certifica autorización: los filtros son presentación de datos ficticios.

## Límites y preparación backend
Sin altas/bajas/matrículas, edición de identidad, publicación de notas, refuerzos oficiales, sincronización ni consulta de datos reales. Acciones futuras abren un diálogo explícito. La información remota permanece desconocida. No se leen conversaciones, grabaciones ni datos personales del almacenamiento estudiantil. Los datos docentes no se guardan automáticamente en caché.

Servicios devuelven modelos derivados sustituibles por consultas autorizadas FastAPI. El backend deberá comprobar identidad docente y asociación con aula en cada consulta; un parámetro URL no concede permisos. Un futuro refuerzo deberá relacionar docente, estudiante/aula, curso, tema y actividad; en esta fase no se escribe ningún registro.
