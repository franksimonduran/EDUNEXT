# Reportes personales

Pantalla: `student/progreso.html?modo=api&vista=reportes`, enlazada desde progreso API.

Disponibles: overview, courses, activities, history y activity_series.
El servidor resuelve StudentProfile de la sesión; no existe filtro student_id.
Permiso reports.read_own no concede permisos de fuente automáticamente: se requieren
progress.read_own o assignments.read_own según el código, y solo esos reportes
aparecen en el catálogo. Exportar requiere reports.export_own además de lectura.

Resumen: conteos reales de cursos, lecciones, reconocimientos y destinatarios-tarea;
estado parcial porque prácticas/juegos/evaluaciones/competencias no están confirmadas.
Cursos: denominador, completadas, porcentaje, referencia de catálogo y última actividad.
Tareas: destinatario propio exclusivamente, última entrega y estados formativos.
Historial: reutiliza consulta FASE 41; no crea eventos duplicados.
Serie: finalizaciones por día en zona institucional, rango máximo 366 días.

No se incluyen respuestas de tareas, conversaciones, notas no publicadas ni datos
familiares. Las competencias no disponibles no reciben nivel C. No hay puntuación
global de capacidad ni promedio de letras.

El visor tiene tabla y medidores con texto, paginación, errores anunciados y CSV
directo. Los dashboards completos no se reemplazaron. No hay caché privada/offline
de reportes; ante un error se retira la tabla anterior y no se muestra demo.
