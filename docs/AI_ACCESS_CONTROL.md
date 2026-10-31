# Control de acceso

Reutiliza autenticación JWT/AuthSession y RBAC existentes. La migración registra
permisos sin asignarlos por defecto. Una cuenta/institución inactiva no accede.

- Estudiante: ai.tutor.use_own, ai.translate.use_own, ai.dictionary.read,
  ai.pronunciation.use_own y ai.usage.read_own según función concedida.
- Docente: ai.tutor.use_assigned_context y ai.translate.use; contexto exige aula
  realmente asignada. No lee conversaciones o sesiones privadas de estudiantes.
- Administrador: ai.config.read_institution, ai.config.manage_institution,
  ai.usage.read_institution_aggregates. No concede acceso a preguntas privadas.

No hay institution_id/user_id público ni selección de modelo/secretos. Políticas
se identifican por institución de sesión; edición requiere expected_revision.
Sesiones de referencia comprueban propietario, institución y vigencia, no solo UUID.
Consumo agregado es técnico y se suprime para menos de cinco usuarios representados.

La configuración institucional no sustituye habilitación del operador, attestation
de ejecución local ni modelo disponible. No se enviaron datos de menores a terceros.
Sesión revocada/cuenta inactiva reutilizan dependencia anterior; no se verificó
login/revocación end-to-end en esta fase. Pruebas incluyen aislamiento de cuotas,
políticas, referencias y uso de permisos mediante contextos ficticios.
