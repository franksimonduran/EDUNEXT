# Manual Administrador — no consola de infraestructura

`/admin/index.html` presenta datos ficticios. Ser Administrador institucional no significa acceso global a otras instituciones, cloud, secretos o bases. No importar matrículas/cuentas reales durante revisión.

| Área | Uso y precaución |
|---|---|
| Usuarios/roles | Directorios/propuestas locales y API existente sin integración completa probada. No cuenta creada por guardar borrador ni elevación por modificar HTML |
| Año/periodos/grados/secciones/aulas | Verificar institución/año/estado. No crear segunda organización ni interpretar cambios locales como oficiales |
| Matrículas/traslados | Conservar historial; cupo/idempotencia/autorización deben comprobarse en servidor. No borrar matrícula para arreglar un conflicto |
| Asignaciones docentes | Solo ámbito autorizado; revocación/cambio deben retirar acceso sin perder historial. No certificado en esta entrega |
| Contenidos/publicaciones | Revisión/versiones/recursos; propuesta local no publica. No aprobar sin autorización y revisión pedagógica |
| Reportes | API parcial. Respetar grupos pequeños/fuentes faltantes y permisos en CSV; no compartir exportaciones privadas |
| Configuración | Separar preferencia local, propuesta, persistida y activa; UI no modifica variables críticas de infraestructura |
| Panel Sync | Diagnósticos locales, no motor remoto/recibos verificados. No exponer respuestas personales |
| Incidencias | Guardar mínimo: área, hora, request ID y estado; nunca contraseña, token, audio o respuestas completas |

## Antes de administrar de verdad

Exigir validación 47–49, dos instituciones sintéticas aisladas, sesión/RBAC/archivos/caché probados, responsables, capacitación y recuperación. No usar este manual como autorización. Soporte y contactos reales siguen por designar. No conceder rol Admin desde selección demo. No purgar IndexedDB/volúmenes ni modificar AD/A/B/C automáticamente.

## Seguridad y salida

Revisar que no quedan datos de la cuenta anterior en equipo compartido; si aparecen, suspender. Logout real con revocación está pendiente de prueba. No distribuir archivos privados o secretos por informe/correo general. [Manual técnico](TECHNICAL_ADMINISTRATION_MANUAL.md).
