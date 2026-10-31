# Fase 17 — Evaluaciones del Monitor / Docente

## Ejecutar y abrir

Desde `D:\Programing\ATHRON EDU1\frontend`:

```powershell
python -m http.server 8088 --bind 127.0.0.1
```

Abrir http://127.0.0.1:8088/monitor/evaluaciones.html. No usar `file://`.

| Vista | Ruta desde frontend |
| --- | --- |
| Catálogo | `monitor/evaluaciones.html` |
| Crear | `monitor/editar-evaluacion.html` |
| Editar | `monitor/editar-evaluacion.html?id=teacher-demo-4-1` |
| Preguntas | `monitor/preguntas-evaluacion.html?id=teacher-demo-4-1` |
| Vista previa | `monitor/vista-previa-evaluacion.html?id=teacher-demo-4-1` |
| Programación | `monitor/asignar-evaluacion.html?id=teacher-demo-4-1` |
| Intentos | `monitor/entregas-evaluacion.html?id=eval-a4` |
| Corrección | `monitor/corregir-evaluacion.html?id=teacher-attempt-eval-a4-0` |
| Resultados | `monitor/resultados-evaluacion.html?id=eval-a4` |

## Inspección y alcance real

Se revisaron el Dashboard y las vistas docentes de fases 15–16, sus datos compartidos, navegación por perfiles, Sidebar, Topbar, catálogo/unidades del estudiante, renderizador de preguntas, servicios/validaciones de evaluación fase 10, borradores IndexedDB históricos, esquema/capa IndexedDB fase 14 y Service Worker existente.

El ZIP `D:\Programing\ATHRON EDU.zip` está disponible, pero su listado no contiene imágenes PNG/JPG de evaluaciones, preguntas, corrección o resultados docentes. No se afirma reproducción de mockups inaccesibles. Se conserva el sistema visual existente.

Las fases anteriores tienen pantallas y servicios, no una certificación global de funcionamiento. La fase 14 conserva limitaciones en su motor de paquetes educativos; esta fase no declara reparado ese motor. La preparación offline incorporada aquí cubre explícitamente las ocho vistas docentes y sus recursos estáticos.

## Flujo funcional

1. Crear un borrador desde el catálogo o el Dashboard.
2. Elegir asignatura, grado y una unidad del catálogo real. Completar objetivo, tema e instrucciones.
3. Guardar localmente o continuar al editor.
4. Añadir preguntas, configurar claves docentes y puntajes, reordenar mediante botones, duplicar o eliminar con confirmación.
5. Validar la evaluación y corregir los errores señalados. La vista previa usa el mismo renderizador visual del estudiante y no registra intentos ni ejecuta un temporizador académico.
6. Seleccionar aulas compatibles, fechas y políticas. Revisar la confirmación y guardar configuración local, sin publicación.
7. Consultar los intentos ficticios de muestra, revisar y guardar comentarios/puntajes abiertos.
8. Consultar estadísticas y vista previa de resultados, sin publicación ni notificación.

El catálogo combina búsqueda, curso, grado, aula y estado, además de ordenación. Una evaluación sin programación no coincide con un filtro por aula. Las operaciones de duplicar, archivar y eliminar actualizan el catálogo; solo se eliminan borradores sin intentos. Un archivo puede duplicarse para continuar trabajando.

## Modelos y reutilización

`monitor-demo.data.js` sigue siendo la fuente de monitores, aulas y alias. Las tres evaluaciones de Matemática conservan los IDs/nombres/fechas base de fase 15. Se inicializan, una sola vez, 15 evaluaciones locales (cinco asignaturas por cada grado), 12 borradores y tres programaciones de muestra. Los nuevos borradores locales son un catálogo docente adicional; los indicadores curriculares previos no se convierten en calificaciones ni se actualizan como si hubiera publicación oficial.

Se incluyen seis intentos **ficticios compartidos**, dos por evaluación de Matemática, vinculados con estudiantes existentes: uno pendiente de respuesta abierta y otro con revisión demostrativa. Sus fechas y programación son escenarios ficticios, no un historial de entregas ni el cumplimiento de plazos oficiales. No se importan automáticamente intentos privados de otros dispositivos.

Evaluación: ID estable, autor demostrativo, versión de contenido, revisión local, fechas locales de creación/modificación, preguntas y políticas. Asignación: aulas, fechas ISO con offset, zona `America/Lima`, duración, intentos y estado local. Intento: versión y snapshot docente inmutable para revisión, respuestas y comentarios por pregunta.

El esquema de preguntas conserva `id`, `type`, `context`, `title`, `options`, `correct`, `pairs` e `items` del motor existente, agregando puntajes y configuración docente. Se amplió el renderizador compartido para respuesta abierta, selección múltiple de varias respuestas y recursos de imagen locales; no se creó otro reproductor incompatible.

`publicQuestion()` omite claves `correct`, explicaciones, rúbrica, criterios y respuesta orientativa al pasar preguntas a la vista previa. Esta es una separación de presentación demostrativa: **no protege exámenes oficiales**. En particular, relaciones y secuencias del motor local incluyen estructura que un usuario técnico puede inspeccionar. Un futuro paquete oficial deberá transformar y separar sus claves en el backend, no reutilizar sin revisión este modelo docente.

Las preguntas de imagen usan los SVG existentes `open-book.svg` y `mark.svg`. No hay subida de archivos, base64 ni URLs arbitrarias. No se añadieron recursos de audio ficticios.

## Reglas de corrección

- Selección simple, verdadero/falso e imagen: ID correcto exacto.
- Completar: igualdad con respuestas aceptadas; mayúsculas y espacios solo según las opciones explícitas. No hay similitud aproximada ni eliminación implícita de acentos.
- Numérica: conversión numérica explícita, coma decimal aceptada, tolerancia no negativa. Una respuesta vacía no se interpreta como cero.
- Relacionar: todas las correspondencias correctas; sin crédito parcial.
- Ordenar: secuencia exacta completa.
- Varias respuestas: todas y únicamente las correctas, sin duplicados ni crédito parcial.
- Abierta: pendiente hasta introducir manualmente un valor entre 0 y el máximo. Vacío no equivale a cero.

El total máximo es la suma de puntajes. No hay calificaciones oficiales. Los promedios de resultados excluyen intentos con abiertas pendientes; las barras por pregunta excluyen respuestas sin revisar y explican el tamaño de muestra. Las observaciones cuentan respuestas con menos del máximo, sin IA ni conclusiones personales.

## Persistencia y futuras operaciones

La misma base `aithron-edu` pasa a versión 2, agregando `monitorEvaluations` y `monitorAttempts`. No se eliminan almacenes anteriores. El almacén de borradores estudiantiles y la base histórica de fase 10 no se reemplazan ni se leen como entregas docentes.

Las mutaciones y sus eventos de `syncQueue` se confirman en una misma transacción. Los eventos contienen identidad demostrativa, ID/revisión, clave de idempotencia y estado pendiente; no se envían ni confirman. El futuro adaptador deberá autorizar al docente y resolver la entidad completa antes de enviar. No contiene endpoints inventados ni tokens.

Ediciones repetidas conservan el ID. Las copias generan IDs de evaluación y preguntas nuevos. Una evaluación con intentos queda bloqueada para cambios; se trabaja en otra copia independiente. Los intentos siempre se corrigen contra su snapshot, no contra un borrador mutable. Se detectan revisiones locales obsoletas para evitar sobrescrituras entre pestañas; no es una política de resolución de conflictos académicos de servidor.

Guardado y corrección muestran confirmación local y errores comprensibles. Hay advertencia nativa al abandonar formularios con cambios pendientes. IndexedDB y cachés pueden ser eliminados por el navegador; no se promete almacenamiento permanente ni cifrado. Solo deben usarse alias ficticios en esta demostración.

## Recorrido offline reproducible

1. Abrir el catálogo mediante localhost/HTTPS y crear un borrador.
2. Pulsar **Preparar estas vistas para trabajar sin conexión** y esperar el resultado de recursos preparados.
3. El preparador registra el único `sw.js` existente con el ámbito relativo correcto y recorre dependencias estáticas del editor. No guarda datos docentes en HTML ni respuestas de API.
4. Recargar una vez; desconectar la red desde DevTools.
5. Abrir `editar-evaluacion.html?id=...`, editar y guardar.
6. Recargar de nuevo y comprobar el título/instrucciones persistidos.
7. Abrir una corrección guardada y comprobar puntajes/comentarios.

Este recorrido se ejecutó automáticamente. Las vistas sin preparar no se prometen offline. No implica distribución al estudiante ni empaquetado oficial de evaluaciones. Una actualización de Service Worker pendiente pide guardar/cerrar otras pestañas; no fuerza activación ni recarga durante un intento. El respaldo `offline.html` se añadió porque no existía realmente. Se corrigieron las referencias esenciales inexistentes de la instalación previa y se evitó eliminar cachés ajenas al activar.

## Archivos creados

- Ocho HTML en `frontend/monitor/`: `evaluaciones`, `editar-evaluacion`, `preguntas-evaluacion`, `vista-previa-evaluacion`, `asignar-evaluacion`, `entregas-evaluacion`, `corregir-evaluacion`, `resultados-evaluacion`.
- `frontend/css/monitor/evaluations.css`
- `frontend/js/monitor/evaluations.js`
- `frontend/js/monitor/evaluation-editor.js`
- `frontend/js/monitor/question-editor.js`
- `frontend/js/monitor/evaluation-assignment.js`
- `frontend/js/monitor/evaluation-grading.js`
- `frontend/js/components/monitor-evaluation-ui.js`
- `frontend/js/services/monitor-evaluations.service.js`
- `frontend/js/data/monitor-evaluations-demo.data.js`
- `frontend/js/utils/monitor-evaluation-validation.js`
- `frontend/js/utils/monitor-grading.js`
- `frontend/js/offline/monitor-preparation.js`
- `frontend/offline.html`
- `tests/phase17.cjs`

Modificados: `offline/database-schema.js`, `components/question-renderer.js`, `monitor/management-shell.js`, `monitor/management.js`, `monitor/dashboard.js`, `frontend/sw.js` y README.

Durante regresión se corrigieron dos errores preexistentes: comillas incorrectas en `student/learning-routes.js` y una importación duplicada de `learningURL` en `student/lessons.js`. Impedían cargar prácticas/lecciones antes de poder completar la suite histórica.

## Pruebas ejecutadas

Desde la raíz del proyecto:

```powershell
node tests/phase17.cjs
node tests/phase16.cjs
```

Requieren Playwright/Chromium externo al frontend. Puede configurarse `PLAYWRIGHT_MODULE`. Cada suite inicia y cierra su servidor Python temporal.

**Fase 17: aprobada.** Migración v1→v2 conservando registros de contenido y borradores, catálogo/filtros combinados, validación, creación/edición sin duplicados, recuperación tras recarga, configuración de nueve tipos, claves y puntajes, duplicación/reordenación/eliminación de preguntas, vista previa sin intentos, fecha inválida, programación local, filtros de intentos, rango de puntaje abierto, pendiente sin cero implícito, comentarios persistidos, resultados, duplicación/archivo/eliminación de borradores, conservación de intentos, bloqueo de versión, detección de revisión obsoleta, cola pendiente y reglas objetivas.

Ocho vistas comprobadas a 1280, 768 y 320 px sin overflow horizontal; enlaces del contenido sin errores HTTP; sin errores JavaScript en el recorrido. Preparación real de Service Worker, desconexión de red, navegación por ID, edición, guardado y recarga offline, y recuperación de corrección previamente guardada: aprobados.

**Fase 16: aprobada nuevamente**, incluyendo sus cinco vistas responsive y navegación Dashboard→Estudiantes.

**Suite histórica `practice-games.browser.cjs`: aprobada**, tras las dos correcciones de sintaxis indicadas. Recorrió 15 prácticas/60 preguntas, 15 juegos, siete tipos previos, reintentos, teclado, reanudación, escape de entradas, fallback de almacenamiento e integración con lecciones. Se ejecutó sin la opción AXE_MODULE de esa suite; su mensaje general no acredita auditoría Axe histórica.

**Axe ejecutado por separado** (etiquetas WCAG 2 A/AA y 2.1 AA): cero infracciones detectadas en catálogo, formulario, editor de preguntas y corrección. Esto no sustituye una auditoría manual completa con lector de pantalla.

Pendiente: regresión exhaustiva de todas las fases 1–14, navegadores/plataformas adicionales, auditoría manual completa, pruebas de cuota real agotada y actualizaciones de aplicación durante sesiones prolongadas. No se declara probado lo anterior.

## Pendiente de backend y próximas fases

- Identidad real y asociación docente–aula/curso en cada operación.
- API FastAPI y PostgreSQL, autorización y contratos definitivos.
- Versionado/publicación oficiales, distribución a alumnos y paquetes sin claves docentes.
- Recepción real de intentos, plazos e idempotencia confirmada.
- Corrección certificada, publicación de notas y notificaciones.
- Reconciliación de conflictos y sincronización autorizada.
- Políticas académicas efectivas en el reproductor de una evaluación publicada.
- Integración institucional de rúbricas y escalas de calificación.

No se implementaron módulos posteriores ni se afirma envío, recepción o publicación oficial.
