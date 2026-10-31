# Seguridad y privacidad de reportes

## RBAC y ámbito

Reutiliza JWT/AuthSession y resolución de permisos anterior. Nuevos permisos se
registran por migración sin grants. Cada código exige permiso de reporte y de sus
fuentes; exportación añade permiso específico. Usuarios/instituciones inactivos
no generan datos. Institución viene de sesión, no de querystring.

Consultas filtran institución antes de agrupar. Para docentes se comprueban perfil,
TeacherAssignment, aula, curso y periodo cuando se solicita. Propios se resuelven
por identidad, sin student_id arbitrario. Filtros inválidos/repetidos se rechazan.

## Grupos pequeños

REPORT_MIN_GROUP_SIZE configurable por operador, mínimo 5 y máximo 100; no es
controlable por solicitud. En matrículas se usan particiones fijas por grado.
Una celda no vacía menor al mínimo suprime toda la distribución, todas las métricas
y el total. No se publica un total complementario que permita reconstruirla.
Filtros institucionales de aula/sección/estudiante se rechazan para impedir
diferenciación trivial de celdas académicas. La misma política se aplica a CSV.

No se afirma anonimización formal. Cortes temporales y conocimiento externo pueden
revelar cambios de matrícula; se trata de conteos administrativos autorizados, no
distribuciones privadas de notas. No se implementa privacidad diferencial ni
presupuesto de consultas. Antes de ampliar segmentos o valoraciones se requiere
nueva evaluación de inferencia y supresión complementaria.

## Minimización y caché

Sin respuestas completas, familia, voz, salud, conversaciones ni credenciales.
Reportes docentes individuales usan solo ID y progreso permitido. Respuestas
exitosas y CSV son private/no-store; Service Worker existente excluye /api/ y
orígenes ajenos. No se añadieron cachés autenticados ni almacenamiento local privado.

ReportAccessEvent almacena actor/institución/código/versión/operación/estado, no
filas ni exportaciones completas. SQLAlchemyError se convierte a 503 genérico
después de rollback. El middleware global heredado registra parámetros de consulta;
no se aceptan textos sensibles libres como filtros de reportes.

Pruebas: IDOR propio/institucional, docente no asignado, usuario inactivo, filtro
de institución/estudiante rechazado, CSV sin permiso, grupos pequeños y supresión
complementaria, SQL sin detalle interno. Login real/revocación de sesión y análisis
formal de inferencias a largo plazo no fueron validados de extremo a extremo.
