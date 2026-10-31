# Modelo de amenazas — STRIDE

Activos: cuentas, hashes, cookies, roles/membresías, matrícula/historial, respuestas y entregas, notas/competencias, archivos, mensajes/contexto AI, audio, operaciones/recibos Sync y secretos de operador. Algunos activos son contratos o módulos incompletos, no capacidades verificadas.

Actores: estudiante, monitor asignado/no asignado, administrador institucional, usuario de otra institución, usuario anónimo, operador, proveedor AI y siguiente usuario de un dispositivo compartido.

| STRIDE / límite | Amenaza | Control encontrado o aplicado | Riesgo restante |
|---|---|---|---|
| Suplantación navegador → API | JWT manipulado, sesión revocada | Firma/iss/aud/exp; consulta de sesión/usuario en dependencia | No probado en API real; defaults producción ahora rechazados en configuración |
| Elevación API → datos | UUID ajeno con permiso genérico | Curso padre institucional en unidades/lecciones/asociaciones | Asignación docente, publicación y resto de endpoints por verificar |
| Divulgación institución A → B | Lecciones/borradores ajenos | Filtro de curso en servicio; consultas scoped existentes | No hay prueba PostgreSQL multiinstitucional actual |
| Alteración navegador/IDB → servidor | Puntuación/nota o operación repetida | Backend debe validar; no se agrega Sync genérico | Motores académicos/Sync incompletos, no habilitar como confirmados |
| Negación de acciones API → DB | Transacciones/entregas sin trazabilidad | Sesiones/eventos y registros existentes | Pruebas de idempotencia y auditoría completas pendientes |
| Divulgación servidor → logs/cache | Excepciones con valores, SQL echo, caché privada | Logs por clase, echo false, no-store API y SW restringido | Logs externos, caches heredadas y módulos locales sin aislamiento certificado |
| DoS cliente → API/proveedor | Argon2/archivos grandes/cuotas/memoria | Rate limit por proceso, límites AI, upload deshabilitado | Diccionario limiter sin límite global de claves; multipart/pool/carga sin probar |
| Inyección API → AI | Instrucciones de lección evaden contexto | Loopback, no redirección/proxy, salida estructurada, sin herramientas | Filtros no son moderación completa; proveedor y evaluación infantil no probados |
| Divulgación API → archivos | Ruta privada o éxito sin bytes | Upload/download 503 hasta adapter real | Ficheros históricos y autorización granular por revisar |

Ninguna red interna, UUID o estado local es prueba de autorización. Decisiones académicas quedan humanas/autorizadas; no se deriva AD/A/B/C de porcentajes ni AI.

## Adenda STRIDE 2026-10-27

| Límite/activo | Amenaza | Tratamiento comprobado | Riesgo residual |
|---|---|---|---|
| Archivo entrante → destino existente | Alteración/pérdida por truncado previo | Lectura limitada y escritura temporal/reemplazo; fallos sintéticos con bytes previos intactos | Endpoints bloqueados; host/TOCTOU/almacenamiento completo no certificados |
| Ruta → filesystem Windows | Escape/ADS/nombre reservado | Contención resuelta y validación de componentes | Host debe proteger directorios/symlinks; no permisos de descarga por UUID |
| Identificadores login → RAM | Consumo ilimitado y retención de identificadores | Cota monotónica, RLock y claves HMAC | Capacidad agotada bloquea nuevos usuarios; múltiples workers no coordinados |
| JWT → contexto autenticado | Token emitido sin claims de seguridad | Requerir aud/iss/exp/iat/nbf y conservar allowlist | Sin revocación DB probada; avisos de librería abiertos |
| Dependencias → proceso/build | Paquetes vulnerables | Consulta PyPI/SBOM y herramientas propias actualizadas | python-jose/ecdsa sin fix_version, licencias/OS/imágenes sin evaluación suficiente |

Estos tratamientos no resuelven las amenazas altas entre instituciones ni certifican
el sistema completo. Solo datos sintéticos y entornos locales fueron utilizados.
