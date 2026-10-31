# Fase 18 — Notas, registro académico y reportes del Monitor

## Ejecutar

```powershell
python -m http.server 8088 --bind 127.0.0.1 --directory "D:\Programing\ATHRON EDU1\frontend"
```

Abrir http://127.0.0.1:8088/monitor/notas.html. Usar HTTP en localhost o HTTPS, no `file://`.

| Pantalla | Ejemplo de ruta desde frontend |
| --- | --- |
| Notas y Calificaciones | `monitor/notas.html` |
| Registro Académico | `monitor/registro-notas.html?room=a4&course=Matemática` |
| Detalle de Calificación | `monitor/detalle-calificacion.html?attempt=teacher-attempt-eval-a4-1` |
| Historial individual | `monitor/historial-academico.html?student=a4-s2` |
| Análisis | `monitor/analisis-resultados.html?room=a4` |
| Centro de Reportes | `monitor/reportes.html?room=a4` |
| Reporte del aula | `monitor/reporte-aula.html?room=a4` |
| Reporte individual | `monitor/reporte-estudiante.html?room=a4&student=a4-s2` |

Las rutas también están conectadas al Sidebar, Dashboard, estudiantes, aulas y resultados de evaluaciones. No hay autenticación real ni publicación institucional.

## Inspección y reutilización

Se revisaron los servicios y vistas de fases 15–17, el calculador `resultFor`, las correcciones almacenadas, los modelos de aulas/estudiantes, progreso demostrativo, borradores históricos de fase 10, IndexedDB v2, navegación, componentes de tabla/gráficos y el Service Worker.

El ZIP original está accesible en `D:\Programing\ATHRON EDU.zip`; no contiene las imágenes de notas/calificaciones/reportes docentes buscadas. Se utiliza la identidad visual existente, sin afirmar reproducción de mockups no disponibles.

Las fases previas contienen implementaciones, no una garantía de validación global. El motor de paquetes educativos de fase 14 sigue siendo parcial: marca verificado sin comprobar realmente cada recurso. Esta fase no certifica ese motor. La preparación offline de vistas docentes, separada de los paquetes educativos, sí se probó con desconexión y recarga.

## Fuente única de resultados

`monitor-grades.service.js` proyecta los intentos de `monitorAttempts` y sus snapshots; calcula mediante **el mismo `resultFor` de fase 17**. No almacena notas independientes ni crea otro motor de corrección. Registro, detalle, historial, análisis y reportes consumen esta proyección compartida.

Cada resultado conserva ID de intento, evaluación, versión de contenido, revisión local, estudiante y aula. El desglose expone puntajes y estado, no respuestas ni claves correctas. La modificación de puntajes sigue ocurriendo exclusivamente en la corrección de fase 17.

Las vistas filtrables vuelven a leer el almacenamiento al recuperar foco; el detalle también se actualiza desde la fuente compartida. Los reportes son una vista generada en una fecha local y pueden regenerarse al recargar/configurar de nuevo.

El progreso curricular reutiliza los modelos del Monitor de fase 16. El escenario global del estudiante de fase 11 utiliza otra identidad demostrativa y no se fusiona arbitrariamente con estos alias. Se presenta como una referencia global sin fecha/periodo atribuible, separada de resultados y prácticas.

## Datos ficticios y ejemplos adicionales

Se mantienen los 76 estudiantes y tres aulas existentes (24/28/24), cinco asignaturas por grado y las 15 evaluaciones de fase 17. Inicialmente existen seis intentos de Matemática: tres con revisión abierta pendiente y tres revisados. No se inventan resultados para las otras asignaturas al consultar una vista vacía.

El botón **Cargar ejemplos de las cinco asignaturas** permite añadir explícitamente los escenarios de revisión de las otras asignaturas al **mismo almacén de intentos de fase 17**. En una instalación de demostración intacta añade 24 intentos y deja 30 en total, dos por evaluación, para los tres grados y las cinco asignaturas.

- Reutiliza los IDs de evaluaciones y estudiantes; no crea alumnos ni evaluaciones duplicados.
- Solo utiliza los borradores originales de ejemplo, con revisión 1 y preguntas intactas. Omite borradores editados, archivados o con intentos existentes.
- La transacción añade intentos mediante IDs estables; repetir la acción añade cero duplicados.
- No reemplaza correcciones, no programa entregas ni envía operaciones al servidor.
- Los ejemplos con intentos asociados quedan sujetos al bloqueo de edición de fase 17. Deben duplicarse para modificar preguntas; se informa antes de cargar los ejemplos.
- Fechas, respuestas y observaciones de los ejemplos son ficticias. Una fecha de corrección desconocida sigue mostrándose como desconocida.

### Publicación y escala cualitativa de demostración

`monitor-academic-periods.data.js` contiene anotaciones explícitas sobre intentos de ejemplo ya revisados: un marcador `published-demo` y un nivel B para el criterio concreto de explicación de la pregunta abierta. **No se convierten porcentajes en AD/A/B/C.** La escala configurable enumera AD, A, B y C con `automatic:false`.

Estas anotaciones solo se aplican cuando coinciden ID, versión y revisión local y la corrección está completa. Al cambiar una revisión dejan de aplicarse; no se presenta como publicada una corrección distinta. No tienen una fecha de publicación inventada y nunca significan publicación oficial ni notificación al estudiante.

Los contadores de revisados incluyen los publicados de demostración; son categorías que pueden solaparse, no conjuntos que deban sumarse. Las vistas anteriores aclaran que sus resultados oficiales disponibles no son estos marcadores ficticios.

## Periodos, filtros y estados

Periodos de muestra: primer semestre de 2026 y segundo semestre de 2026, más Todos y Sin fecha conocida. Las fechas se comparan en `America/Lima`, usando componentes de fecha de `Intl`; se probó el límite UTC de cambio de semestre.

Los resultados se ubican por fecha conocida del intento, no por una fecha de corrección supuesta. Las evaluaciones usan programación o creación local y también sus intentos pertinentes al periodo. Las prácticas existentes sin fecha solo se incluyen en Todos o Sin fecha conocida: no se les atribuye arbitrariamente un semestre.

Filtros combinables: aula, grado, asignatura, periodo, estado y evaluación/búsqueda. En historial/análisis también se distingue tipo de actividad. Los filtros de evaluación/estado/búsqueda de evaluación no convierten registros formativos en resultados de examen.

El registro requiere un aula concreta, permite buscar y ordenar alias y mantiene columnas dinámicas. Con varias respuestas accesibles se muestran los intentos, sin elegir una nota máxima arbitrariamente. Las celdas diferencian una ausencia de intento de una coincidencia excluida por filtro de estado.

Estados preparados: en progreso local, finalizado localmente, pendiente de revisión, corregido en demostración, publicado de demostración y no disponible. Sin un intento accesible se muestra un mensaje, nunca un cero. No se afirma que la falta de un registro local demuestra incumplimiento, ausencia de entrega o cambios pendientes en otro dispositivo.

Los identificadores de estudiante, aula, evaluación, intento y versión se validan. Un detalle incompatible no sustituye el registro por el de otra persona. Una URL no representa autorización; el backend deberá comprobarla.

## Estadísticas

- Puntaje y porcentaje individual: los de `resultFor`, contra el snapshot de la versión del intento.
- Si hay una respuesta abierta pendiente, el puntaje final y su porcentaje son `null`; no entran al promedio.
- Media descriptiva: media aritmética de `puntaje/máximo ×100`, con igual peso entre los intentos completos **de la misma evaluación y versión**. Se indica n. No hay un promedio oficial combinado entre evaluaciones, prácticas o asignaturas.
- Evidencia por pregunta: solo respuestas objetivas válidamente revisadas. Una respuesta con cero puntos cuenta como incorrecta; una respuesta abierta sin revisar no cuenta como incorrecta.
- Se pueden consultar componentes objetivos de intentos con revisión abierta pendiente, pero esto no hace completo su puntaje final. Se indica expresamente en el análisis.
- Refuerzo: se listan preguntas/temas con al menos una respuesta objetiva incorrecta en la muestra, junto con conteos y estudiantes asociados. No hay IA ni diagnósticos.
- Rendimiento formativo: aciertos/preguntas registradas, por asignatura y tema, separado de puntajes de evaluación.
- Evolución: requiere al menos dos registros con fechas distintas de la misma evaluación y versión. Los ejemplos iniciales no cumplen esa condición y muestran el estado de datos insuficientes. No se inventan tendencias.

Los SVG tienen etiquetas accesibles y la misma información numérica en texto. No hay rankings públicos.

## Reportes e impresión

El Centro permite preparar las variantes Aula, Curso, Individual, Evaluaciones y Actividades. Configura aula, grado derivado, curso, periodo, estudiante cuando corresponde, evaluaciones incluidas, indicadores visibles y comentarios ficticios opcionales. Se validan relaciones y filtros antes de abrir la vista.

Los reportes incluyen institución/alias ficticios, fecha e ID de generación local, fuente, tamaño de muestra, estados parciales y aviso **Reporte de demostración — No oficial**. Separan progreso curricular, prácticas y evaluaciones. No contienen firmas, sellos ni afirmaciones de envío o certificación.

`reports-print.css` oculta navegación/acciones, conserva el aviso de demostración, repite cabeceras de tabla y evita cortes dentro de filas. El botón invoca `window.print()`. Guardar como PDF desde el navegador no convierte el reporte en oficial; no se incluyó una biblioteca PDF.

Los reportes completos no se guardan en una nueva base ni como HTML personalizado en caché. Su configuración usa parámetros de IDs/opciones, no información privada ni claves de respuestas. La vista se vuelve a calcular desde los datos locales al abrirla.

## CSV de demostración

Disponible en el Registro, con confirmación que informa filas y evaluaciones filtradas. Exporta código/alias ficticio, aula, evaluación, versión, puntajes y estados; no exporta respuestas, claves ni comentarios privados.

- Solo las filas buscadas/filtradas y permitidas.
- UTF-8 con BOM, separador `;` y finales CRLF.
- Etiqueta de demostración, filtros y encabezados explícitos.
- Campos entre comillas y comillas internas duplicadas.
- Protección con apóstrofo para prefijos de fórmula `=`, `+`, `-`, `@`, incluso con espacios/control iniciales.
- Ausencias de puntaje exportadas vacías, no como cero.
- Archivo `AITHRON-datos-de-demostracion.csv`.

No se envía a un servidor ni se exportan datos reales de menores. Las exportaciones institucionales requerirán permisos del backend.

## Offline reproducible

1. Abrir Notas en localhost/HTTPS y consultar o corregir un intento de muestra.
2. Pulsar **Preparar vistas para consulta sin conexión** y esperar el conteo final.
3. Recargar una vez y desactivar la red en DevTools.
4. Abrir un reporte por aula/estudiante y recargarlo nuevamente.
5. Comprobar que recupera los mismos puntajes y comentarios locales guardados.

El preparador existente incluye ahora las 16 vistas de evaluaciones y registro/reportes y recorre sus dependencias estáticas. El único Service Worker admite estas rutas por ID al estar preparadas. Para JS/CSS sin hash se usa actualización por red con respaldo local, evitando mantener indefinidamente módulos viejos en línea. No se fuerza la activación de una actualización pendiente ni una recarga durante trabajo docente.

Los datos proceden de IndexedDB; solo se preparan plantillas/código/estilos e imágenes estáticas, no reportes personales completos ni respuestas de una API. La disponibilidad real del servidor permanece desconocida. El almacenamiento del navegador no es permanente ni cifrado por esta demostración; puede ser eliminado por el navegador o el usuario.

## Archivos creados

- Ocho HTML en `frontend/monitor/`: `notas`, `registro-notas`, `detalle-calificacion`, `historial-academico`, `analisis-resultados`, `reportes`, `reporte-aula`, `reporte-estudiante`.
- `frontend/css/monitor/grades.css`
- `frontend/css/monitor/reports-print.css`
- `frontend/js/monitor/grades.js`
- `frontend/js/monitor/gradebook.js`
- `frontend/js/monitor/academic-reports.js`
- `frontend/js/components/monitor-academic-ui.js`
- `frontend/js/services/monitor-grades.service.js`
- `frontend/js/services/monitor-reports.service.js`
- `frontend/js/data/monitor-academic-periods.data.js`
- `frontend/js/utils/academic-statistics.js`
- `frontend/js/utils/csv-safety.js`
- `tests/phase18.cjs`
- `docs/phase18.md`

### Modificados

- `frontend/js/monitor/management-shell.js`: navegación a Notas y Reportes.
- `frontend/js/monitor/dashboard.js`: accesos y resumen de evaluaciones/revisiones desde la fuente local compartida, sin cambiar sus métricas curriculares.
- `frontend/js/monitor/management.js`: enlaces desde estudiante/aula/seguimiento y distinción de resultados oficiales frente a marcadores ficticios.
- `frontend/js/monitor/evaluation-grading.js`: enlace Resultados → Registro.
- `frontend/js/services/monitor-evaluations.service.js`: carga explícita de intentos de ejemplo usando los mismos almacenes.
- `frontend/js/data/monitor-evaluations-demo.data.js`: reutilización del generador de intentos, sin cambiar el cálculo de corrección.
- `frontend/js/offline/monitor-preparation.js` y `frontend/sw.js`: preparación de las nuevas vistas y recursos.
- `README.md`.

No se añadieron bases ni almacenes: `aithron-edu` continúa en versión 2. Los borradores estudiantiles históricos permanecen separados y no se consultan como entregas docentes remotas.

## Pruebas realmente ejecutadas

Desde la raíz del repositorio:

```powershell
node tests/phase18.cjs
node tests/phase17.cjs
node tests/phase16.cjs
```

Requieren Python y Playwright/Chromium externos al frontend. `PLAYWRIGHT_MODULE` permite indicar el módulo. Cada suite inicia y cierra su servidor temporal (8099, 8097 y 8096).

**Fase 18: aprobada.** Verificó filtros combinados y contadores, aula/curso/periodo, búsqueda y orden real A–Z/Z–A, registro sin duplicados, vacíos distintos de cero, abiertas pendientes, nivel cualitativo explícito, IDs incompatibles, historial y falta de evolución, media/muestra/periodos, CSV descargado y protección de fórmulas, reportes con y sin comentarios, indicadores/evaluaciones excluidos, variante Actividades, límites de aula, trazabilidad tras corregir en fase 17 y caducidad del marcador ficticio tras cambiar revisión.

También se comprobó la carga de 24 ejemplos sin duplicados, repetición con cero añadidos y preservación de un borrador editado (22 ejemplos añadidos, ninguno asociado al borrador protegido). Se validaron vínculos desde Dashboard, estudiante, aula y resultados de evaluación.

Ocho vistas a **1280, 768 y 320 px**, sin desbordamiento horizontal global; enlaces del contenido sin fallos HTTP, notificaciones/perfil y foco básico por teclado; sin errores JavaScript en el recorrido. No es una auditoría manual exhaustiva de teclado o lector de pantalla.

**Impresión:** se invocó el botón, se recibió `beforeprint`, se comprobaron navegación oculta y cabeceras de tabla en modo print y se obtuvo un PDF en memoria con el motor nativo de Chromium. No se emitió un documento oficial ni se verificó una impresora física.

**Offline:** preparación real, desconexión, apertura de reporte por ID, recarga y recuperación del puntaje/comentario corregido: aprobados.

**Regresión:** fases 16 y 17 aprobadas nuevamente, incluida la migración/persistencia y edición offline de fase 17.

**Axe:** cero infracciones detectadas con etiquetas WCAG 2 A/AA y 2.1 AA en las ocho vistas y en el nuevo diálogo de ejemplos.

Pendientes de verificación: otros navegadores/plataformas, auditoría manual completa con lector de pantalla, impresoras físicas, cuota realmente agotada y regresión exhaustiva de las fases 1–14. No se declaran aprobados estos puntos.

## Pendiente de backend / institucional

Identidad y autorización docente–aula/curso, datos académicos reales, escalas y competencias institucionales validadas, publicación de resultados, trazabilidad oficial de cambios, permisos de exportación, sincronización confirmada y documentos institucionales. La capa de servicios permite reemplazar los datos locales por un adaptador autorizado sin introducir otro motor de corrección.

No hay notas oficiales, envíos a familias/dirección, correos, certificados, firmas/sellos ni análisis generativo. No se accede a conversaciones del Tutor o grabaciones. La fase siguiente no está implementada.
