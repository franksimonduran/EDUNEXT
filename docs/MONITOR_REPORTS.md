# Reportes docentes

Pantalla conectada: `monitor/reportes.html?modo=api` y vistas de reporte que comparten
el controlador grades.js. Contextos de aula/curso/periodo se consultan al servidor.

- monitor.classrooms: progreso actual por estudiante autorizado; reutiliza
  MonitorProgressService y catálogo FASE 41, con paginación.
- monitor.assignments: tareas publicadas históricamente con versión de publicación,
  destinatarios, última recepción, pendientes, revisadas, tardías y proporción.

Requiere reports.read_assigned más permiso de fuente. Classroom/course obligatorios;
periodo debe pertenecer al aula y existir asignación docente para el contexto.
No basta modificar el UUID ni seleccionar un aula visualmente. Exportación exige
reports.export_assigned y vuelve a validar las mismas relaciones.

El reporte de progreso representa matrícula y catálogo actuales; no es reconstrucción
histórica de finalización a un periodo pasado. En tareas el periodo filtra tareas
de ese contexto, pero los estados mostrados son los de la transacción actual.

La tabla individual docente usa student_id y mínimos indicadores necesarios;
no añade nombres completos, credenciales, familia, voz ni conversaciones.
No etiqueta ausencia de uso como bajo aprendizaje. Prácticas/evaluaciones/competencias
confirmadas siguen explícitamente no disponibles y no se sustituyen por cifras demo.
