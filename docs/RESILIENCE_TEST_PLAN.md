# Plan de resiliencia y recuperación

Ejecutable seguro: `node tests/phase48-resilience.cjs` abre HTTP loopback efímero con payload sintético. Comprueba lectura de cuerpo incompleto hasta timeout, cancelación y errores; cierra sus sockets. `phase48-session.cjs` simula respuesta tardía/refresh/logout. `phase48-security.cjs` simula cuota de caché, sin alterar almacenamiento del usuario.

Pendientes en entorno aislado autorizado: caída temporal de PostgreSQL, fallo tras commit con respuesta perdida, idempotencia de entrega, publicación concurrente, PWA cerrada con respuestas pendientes, espacio IDB agotado, cursor/recibo Sync perdido y dos cuentas. No parar un servicio de dueño/datos desconocidos.

Recuperación propuesta: identificar operación/recibo, no reenviar mutaciones sin idempotencia, reautenticar cuenta correcta, recuperar estado confirmado de servidor, conservar conflicto/borrador y escalar a operador definido por institución. No usar última escritura gana para notas.

Backups/restauración: no se encontró ni verificó una estrategia operativa. No declarar backup válido por archivo. Antes de prueba, definir responsables y destino aislado sin sobrescribir datos. Objetivos iniciales **propuestos/no aprobados**: RPO 15 minutos para registros confirmados y RTO 4 horas, sujetos a necesidades escolares y estrategia de backup/WAL aún no implementada ni medida. No son garantías ni implementación Fase 49.
