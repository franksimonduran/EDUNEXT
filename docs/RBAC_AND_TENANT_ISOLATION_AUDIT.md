# RBAC y separación institucional

Hallazgo A48-01: las lecturas directas de unidades/lecciones tenían permiso general pero no comprobaban el curso institucional. Se agregaron verificaciones del curso padre; también en agregar/quitar recursos y operaciones de lecciones. Se corrigió consulta que intentaba obtener Course utilizando la clase Unit.

AuthorizationService resuelve membresía institucional activa. Su helper can_access_resource genérico no verificaba ownership: ahora deniega hasta existir un resolver de dominio. No se encontraron consumidores de ese helper en búsqueda del backend; los servicios específicos conservan sus controles.

**No hay prueba actual de dos instituciones, BOLA horizontal/vertical ni BFLA en HTTP.** La prueba unitaria con AsyncMock del padre ajeno se escribió pero Python no pudo ejecutarla. No equivale a filtros en PostgreSQL.

Riesgo abierto A48-08: permisos genéricos de cursos/recursos no demuestran publicación, matrícula o asignación docente; revisar cada ruta antes de exposición. No se afirma auditar exhaustivamente los 258 decoradores. Reportes/progreso/planner/AI cuentan con controles propios que aún requieren regresión multiinstitucional. No se concedieron permisos globales como solución.
