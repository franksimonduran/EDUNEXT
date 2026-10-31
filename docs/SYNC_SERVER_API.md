# API preparada — ejecución HTTP todavía no validada

Prefijo `/api/v1`; todas las rutas usan autenticación y no-store.

| Método/ruta | Contrato y acceso |
|---|---|
| GET `/sync/status` | Cuenta e institución activas; disponibilidad, hora servidor, límites; sin prueba de conectividad PostgreSQL extrapolada |
| GET `/sync/bootstrap` | Gate V1, permisos de progreso y perfil estudiantil; IDs de contexto y capacidad única |
| POST `/sync/operations` | Gate V1, sesión; precondición cuenta/institución, validación por operación, commits individuales |
| GET `/sync/operations/{operation_id}` | Gate V1; recibo propio y lección actualmente accesible |

Ejemplo de body (todos los valores de ID son UUID reales del entorno sintético):
`expected_account_id`, `expected_institution_id`, `operations` con objetos de
`client_operation_id`, `operation_type`, `schema_version`, `resource_id`,
`lesson_version_id`. No se aceptan payloads arbitrarios ni listas de permisos.

Errores globales: sesión/permiso, 409 contexto cambiado, 413 transporte, 422 schema,
503 gate/persistencia. Resultados individuales no aplicados exponen solo código seguro.
Router registrado para OpenAPI, pero generación de OpenAPI no ejecutada en este entorno.
