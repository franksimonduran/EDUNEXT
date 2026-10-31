# Fuentes reales auditadas

Repositorio: D:\Programing\ATHRON EDU. README y documentación de progreso/planner
revisados. No hay PROJECT_STRUCTURE ni AGENTS.md local conocidos. No existe .git;
git status no permite determinar rama o cambios previos.

| Fuente | Uso / estado |
|---|---|
| User, Institution, AuthSession, Role/Permission | Identidad y ámbito, reutilizados |
| Enrollment, Classroom, AcademicYear, AcademicPeriod, Grade | Matrícula efectiva/histórica y corte |
| TeacherAssignment, MonitorProfile | Autorización docente vigente |
| Course, Unit, Lesson | Catálogo estable, grado/contexto |
| ContentVersion, ContentPublication, ContentReview | Última versión publicada, válida y aprobada independientemente |
| LearningProgress | Inicio/finalización propia, origin progress-engine-v1 e institución |
| StudentAchievement | Reconocimientos earned, no calificaciones |
| Assignment, AssignmentVersion, AssignmentTarget | Tarea publicada, snapshot y destinatarios |
| AssignmentSubmission | Último intento por target para estados actuales; submitted_at para recepción histórica |
| AssignmentFeedback | Estado publicado reflejado en entrega; texto no incluido en reportes generales |

Prácticas/juegos tienen modelos/routers pero siguen limitaciones de publicación,
integridad y resultados cliente documentadas en fases anteriores. No se usan como
fuentes confirmadas de estadística educativa.

Assessment/AssessmentAttempt/AssessmentResult existen, pero no hay flujo operativo
confirmado completo de publicación académica/programación ni fuentes operativas
CompetencyAchievement/AcademicRecord/DescriptiveConclusion. No se sintetizan
valoraciones de prueba como si estas APIs ya existieran. Los reportes de esas
fuentes devuelven source_not_available sin ceros de respaldo.

Historial reutiliza consulta compuesta de FASE 41, no nueva LearningEvent.
Calendario y refuerzos del planner no se duplican para reportes; sus reportes
específicos permanecen fuera de este primer alcance.

No hay materialización ni caché: se consulta snapshot transaccional actual.
Matrículas reconstruyen intervalos disponibles. Curso/progreso no reconstruyen
catálogos pasados; cutoff histórico se rechaza en esas definiciones. Resultados
académicos no se modifican al consultar o exportar.
