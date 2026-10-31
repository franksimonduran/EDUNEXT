# Fase 19 — AITHRON REFUERZA: tareas, planes, asignaciones y seguimiento

## Abrir localmente

```powershell
python -m http.server 8088 --bind 127.0.0.1 --directory "D:\Programing\ATHRON EDU1\frontend"
```

Abrir http://127.0.0.1:8088/monitor/tareas.html. Usar localhost/HTTPS para Service Worker y Cache Storage; no `file://`.

| Vista | Ruta de ejemplo desde frontend |
| --- | --- |
| Mis Tareas | `monitor/tareas.html` |
| Crear/editar tarea | `monitor/editar-tarea.html` |
| Refuerzos | `monitor/refuerzos.html` |
| Crear plan | `monitor/crear-refuerzo.html` |
| Asignar actividad | `monitor/asignar-actividad.html?id=task-demo-5` |
| Detalle | `monitor/detalle-actividad.html?id=task-demo-4` |
| Seguimiento general | `monitor/seguimiento-actividades.html` |
| Seguimiento del plan | `monitor/seguimiento-refuerzo.html?id=support-demo-4` |

Todas las vistas son docentes de demostración. No se publican tareas ni se distribuyen datos a otros dispositivos.

## Inspección y referencias

Se revisaron cursos/unidades/lecciones, prácticas y juegos existentes, diccionario, Tutor predefinido, Agenda, evaluaciones/correcciones, notas/evidencias, estudiantes/aulas, almacenamiento y cola Sync. Sidebar y Topbar siguen siendo los componentes compartidos.

El ZIP `D:\Programing\ATHRON EDU.zip` existe, pero no contiene imágenes PNG/JPG de Tareas, Refuerzos o Monitor. Se mantuvo el diseño corporativo existente; no se afirma reproducción de mockups inaccesibles.

Las fases anteriores tienen implementaciones de alcance distinto. Se verificaron por regresión las fases 16–18, no toda la plataforma. El motor antiguo de paquetes de fase 14 continúa siendo parcial y su booleano `verified` no prueba disponibilidad de archivos. Esta fase no usa ese booleano para anunciar un recurso como descargado.

## Flujo de tareas y planes

1. Abrir Tareas o Refuerzos; buscar, combinar filtros y ordenar.
2. Crear un borrador con curso, grado y unidad reales, objetivo, instrucciones y tiempo orientativo.
3. Elegir recursos del catálogo. Se conservan referencias, no copias de lecciones o motores de ejercicios.
4. En un plan, añadir etapas con título, descripción, recurso y duración opcional; subir/bajar mediante botones accesibles.
5. Validar y guardar. El ID permanece estable; una edición incrementa versión/revisión local. La vista previa no registra entregas.
6. Configurar aulas, individuos o grupos diferenciados neutrales y sus recursos.
7. Elegir fechas, horas opcionales, prioridad y criterio de finalización; revisar y guardar configuración local.
8. Consultar detalle, seguimiento y observaciones. La falta de registros no demuestra incumplimiento del estudiante.

Duplicar genera ID nuevo y etapas nuevas, sin copiar asignaciones, resultados ni observaciones. Las actividades con registros quedan bloqueadas para cambios incompatibles y deben duplicarse. Archivar conserva referencias. Eliminar solo permite borradores sin asignación, registros u observaciones y exige confirmación.

Guardar cambios de contenido invalida una configuración local sin registros, porque cambia la versión. El editor lo informa antes de editar. Las asignaciones se enlazan a una versión concreta; no se modifican silenciosamente registros anteriores.

## Recursos educativos reales

`monitor-learning-resources.service.js` adapta los catálogos existentes de Aprende, Practica, Juegos, diccionario y Tutor. Cada referencia incluye ID estable, versión de demostración, grado, curso, unidad, tipo y URL derivada de archivos/rutas reales.

- Lección, repaso y actividad guiada: abren lecciones existentes, sin duplicar su contenido.
- Práctica/juego: abren los motores existentes, sin crear otro corrector.
- Vocabulario: entradas reales del diccionario local, sin inventar traducciones.
- Tutor: abre contexto de una explicación predefinida. No genera un plan con IA, ni accede a conversaciones privadas.
- Las voces del navegador no se garantizan offline.
- Una dificultad solo se muestra cuando está definida por la fuente; en otros recursos se indica que no está especificada.

La búsqueda/tipo de recurso se combina con el grado, curso y unidad del formulario. Cambiar de ámbito retira recursos incompatibles y referencias académicas del ámbito anterior. No se permiten URLs arbitrarias ni recursos inexistentes.

## Destinatarios, fechas y políticas

Las aulas y alias proceden de la misma fuente de fase 16. Solo se ofrecen destinatarios del grado de la actividad y aulas asociadas al monitor ficticio.

La selección individual conserva lo seleccionado al buscar/filtrar; Seleccionar visibles solo incorpora los resultados visibles. Los grupos diferenciados se denominan Grupo A, B, etc.; no son etiquetas de capacidad. No se puede repetir un estudiante entre grupos. Cada grupo debe tener recursos y un criterio compatible; la vista previa muestra su propio subconjunto de contenido.

Las fechas se seleccionan expresamente. Horas vacías se guardan como `null`, sin inventar horario. Para el mismo día se exigen ambas horas y un cierre posterior. La zona es `America/Lima`. El reloj local no valida plazos oficiales.

Tiempo estimado, prioridad, obligatoriedad y repetición son configuración de demostración. Las instrucciones/recursos siempre se pueden consultar. Las políticas no pretenden restringir todavía el motor del estudiante. Abrir un enlace, marcar un destinatario o cerrar una vista previa no crea una finalización.

## Evidencia y sugerencias

Se reutilizan las evidencias de fase 18 y las observaciones formativas de fase 16:

- Evaluación: al menos una respuesta objetiva incorrecta, utilizando intentos completamente revisados. No se toman abiertas pendientes como resultados definitivos.
- Práctica: dos registros formativos por debajo del 50 %, con la limitación de que las muestras anteriores no tienen fecha conocida.
- Contexto individual: el avance curricular global puede incorporarse como referencia. El texto aclara que lecciones pendientes no prueban una dificultad personal.

Las referencias guardan fuente/ID y versión cuando existe; no se copian puntajes como nuevas notas. Cada sugerencia es revisable por el docente y requiere elegir recursos e instrucciones antes de guardar una asignación. Si un tema de las muestras previas no corresponde exactamente al catálogo, debe revisarse esa relación: no hay asignación automática.

El bloque Sugerencias de Aithron Insights identifica reglas de demostración, no IA. Las observaciones no son diagnósticos ni etiquetas permanentes.

## Seguimiento honesto

Se inicializan una vez tres tareas y tres planes (4.º/5.º/6.º). Dos configuraciones de muestra están asociadas al aula 4.º A: una tarea grupal y un plan individual para dos alias. Cuatro registros ficticios compartidos ilustran progreso/finalización local. No proceden de otros dispositivos ni de una entrega real.

Cada fila representa un par actividad–estudiante. Una persona con dos actividades aparece en dos filas legítimas; no se afirma que son dos personas distintas. Los filtros actualizan tanto filas como indicadores.

- Registros conocidos: filas con registro accesible.
- Finalizadas: estado explícito local de muestra, no finalización oficial.
- Pendientes conocidas: estado explícito en progreso.
- Sin información: destinatario configurado sin un registro accesible; no se convierte en una falta ni en cero.
- Un plan/tarea solo aparece como finalizado en el catálogo si todos sus destinatarios tienen registros finales compatibles con la versión. Un registro aislado no demuestra que todo el aula terminó.

El plan de muestra 4.º tiene 7 pasos conocidos completados de 10 configurados entre sus dos destinatarios; es avance por etapas, no porcentaje de aciertos. No se infiere que una práctica fue realizada por estar enlazada.

Antes/después consulta resultados completos existentes, por curso y destinatarios, con fechas anteriores al inicio o posteriores al cierre. Son resultados relacionados, no prueba de efecto del plan. Si no hay información posterior se muestra vacío; no se inventan mejorías ni comparaciones causales.

Las observaciones se guardan como texto académico local, hasta 2000 caracteres, con ID/revisión y fecha reales de guardado. Se rechazan etiquetas HTML. No se publican ni se comparten con estudiantes.

## Almacenamiento y Sync

La misma base `aithron-edu` pasa de v2 a **v3**, añadiendo:

- `monitorActivities`: tareas/planes por discriminador `kind`, con etapas y referencias.
- `monitorActivityAssignments`: configuración local y versión de actividad.
- `monitorActivityRecords`: registros ficticios explícitos.
- `monitorActivityObservations`: comentarios locales.

La migración no elimina almacenes anteriores. Los borradores/evaluaciones/prácticas previos no se reemplazan. No hay otra biblioteca ni una segunda base para este módulo.

Las mutaciones y eventos pendientes de `syncQueue` se confirman juntos. Incluyen ID, revisión/versión, ámbito demostrativo, idempotencia y requisito de autorización. No hay solicitudes a endpoints inventados ni eventos marcados como confirmados. Se comprueban revisiones para detectar ediciones obsoletas. La asignación verifica la revisión de la actividad dentro de su transacción; la eliminación vuelve a comprobar relaciones en una transacción antes de borrar.

El evento de Agenda es una proyección preparada, con actividad/versión, fechas/horas, curso y estado no publicado. No se inserta en la Agenda del estudiante. La publicación/distribución futuras deberán crear eventos autorizados en backend.

## Offline real

El preparador docente compartido cubre ahora las 24 vistas de fases 17–19. El selector añade preparación explícita de un recurso educativo y sus dependencias: HTML, módulos, CSS, imágenes y audio asociado a la lección cuando existe.

Se reutilizó el mismo recorrido estático de preparación, sin otro Service Worker. Las referencias se validan como archivos locales; las importaciones se descubren a partir de declaraciones de módulos, no de palabras sueltas como claves `from` de un diccionario.

Los manifiestos técnicos de recursos se guardan en `storageMetadata` solo después de verificar respuestas y disponibilidad en Cache Storage. Al consultar un indicador se comprueban sus archivos otra vez. Si falta uno, se retira la disponibilidad. El respaldo offline devuelve 503 y un marcador específico: no puede confundirse con la descarga exitosa de una práctica que no existe en caché.

### Recorrido reproducible

1. Abrir Crear Tarea con red y seleccionar una lección.
2. Pulsar Preparar recurso offline y esperar la verificación real.
3. Guardar el borrador.
4. Desde Tareas, preparar las vistas docentes para trabajar sin red.
5. Recargar una vez, desconectar y abrir el editor por ID.
6. Editar, guardar y recargar: el borrador conserva los cambios.
7. Abrir la lección preparada y comprobar el texto después de la navegación offline.

Este recorrido se ejecutó. También se borró un audio de caché para comprobar que el indicador pasaba a no disponible, se restauró su preparación y se intentó preparar offline un juego no guardado: falló sin crear una disponibilidad falsa.

La caché/IndexedDB pueden ser eliminadas por el navegador. No se garantiza almacenamiento permanente, cifrado, voces locales ni IA generativa offline. Las versiones de recurso son demostrativas; los paquetes oficiales/versionados y permisos requerirán catálogo/servicios confiables.

## Integraciones

- Dashboard: Tareas, Refuerzos y Seguimiento, conservando aula cuando corresponde.
- Estudiante: Preparar refuerzo abre contexto válido y referencia curricular, sin guardar una asignación.
- Aula: Preparar actividad grupal abre editor con aula/grado preferidos.
- Evaluaciones: acceso contextual al formulario de refuerzo.
- Análisis/reportes: tema/evidencia → editor de plan, sin duplicar resultados.
- Aprende/Practica/Juegos/Tutor/Diccionario: enlaces a sus módulos reales.
- Agenda y Sync: contratos/eventos locales preparados, sin distribución ni confirmaciones ficticias.

## Archivos creados

- Ocho HTML de `frontend/monitor/`: `tareas`, `editar-tarea`, `refuerzos`, `crear-refuerzo`, `asignar-actividad`, `detalle-actividad`, `seguimiento-actividades`, `seguimiento-refuerzo`.
- `frontend/css/monitor/tasks.css`
- `frontend/js/monitor/support.js`
- `frontend/js/monitor/support-editor.js`
- `frontend/js/monitor/support-assignment.js`
- `frontend/js/monitor/support-tracking.js`
- `frontend/js/components/monitor-resource-selector.js`
- `frontend/js/components/monitor-support-ui.js`
- `frontend/js/services/monitor-learning-resources.service.js`
- `frontend/js/services/monitor-tasks.service.js`
- `frontend/js/services/monitor-support-tracking.service.js`
- `frontend/js/data/monitor-support-demo.data.js`
- `frontend/js/utils/learning-support-validation.js`
- `tests/phase19.cjs`
- `docs/phase19.md`

### Archivos modificados

`offline/database-schema.js`, `offline/monitor-preparation.js`, `frontend/sw.js`, `monitor/management-shell.js`, `monitor/dashboard.js`, `monitor/management.js`, `monitor/evaluation-grading.js`, `monitor/gradebook.js`, `css/monitor/dashboard.css`, `tests/phase16.cjs` y README.

La prueba de fase 16 cambió únicamente su expectativa del antiguo botón de refuerzo en construcción: ahora verifica que abre el formulario real con aula/grado y sin guardar automáticamente.

## Pruebas ejecutadas

Desde la raíz del proyecto:

```powershell
node tests/phase19.cjs
node tests/phase18.cjs
node tests/phase17.cjs
node tests/phase16.cjs
```

Se usa Playwright/Chromium externo al frontend (`PLAYWRIGHT_MODULE` configurable), Python y servidores temporales que las suites cierran al terminar.

**Fase 19 aprobada:** migración v2→v3 conservando un borrador anterior, catálogos/búsqueda/filtros, validación, selección real de lección/práctica, creación/recuperación/edición sin duplicados, etapas y reordenación, duplicación con nuevos IDs, eliminación confirmada, bloqueo por registros, rechazo de revisión obsoleta, programación grupal y diferenciada, búsqueda/selección individual, fechas inválidas, vista previa sin entregas, seguimiento con desconocidos, observaciones persistidas y rechazo de HTML, referencias de estudiante/aula/evidencia, cola pendiente y recursos offline reales.

Las ocho vistas se comprobaron a 1280, 768 y 320 px sin desbordamiento horizontal global. Se verificaron enlaces del contenido y ausencia de errores JavaScript/HTTP inesperados. La respuesta 503 de la prueba negativa offline es intencionada y comprobada.

**Regresiones 16–18 aprobadas** en sus últimas ejecuciones. Una ejecución inicial de fase 17, durante la ejecución simultánea de cuatro navegadores, excedió el tiempo de arranque; su repetición individual pasó. No se certifica rendimiento bajo esa concurrencia de pruebas.

**Axe:** cero infracciones detectadas con etiquetas WCAG 2 A/AA y 2.1 AA en las ocho vistas, incluyendo etapas y selección diferenciada. Se auditó adicionalmente el Dashboard actualizado y el formulario contextual individual, sin infracciones detectadas.

No ejecutados: regresión exhaustiva de fases 1–14, auditoría manual completa con lector de pantalla, otros navegadores, cuota real agotada y reproducción física de audio. El archivo de audio se verificó en caché; no se declara una prueba de sonido. La validación automática no constituye certificación completa de accesibilidad.

## Pendiente de backend

Identidad/autorización docente–aula/curso, publicación y distribución reales, recepción confirmada de registros, notificaciones, políticas de repetición/plazos aplicadas por servidor, sincronización autorizada, catálogos/versiones oficiales, reconciliación de conflictos y Aithron Insights avanzado. Los grupos/datos son ficticios y los filtros visuales no son seguridad efectiva.

No se implementó la fase siguiente, administración institucional, notas oficiales ni corrección generativa.
