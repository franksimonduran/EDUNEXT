# Inventario y matriz de preparación

No existían Dockerfiles/Compose/workflows/lock/manifiesto PWA localizados antes de esta intervención. Sí existían FastAPI, Alembic, auth, logs, SW y módulos locales. README/actas 47–48 revisados; Fase 48 BLOQUEADA. Git no disponible y .git ausente: rama/remotes/commits no determinables. No se alteraron ramas ni secretos reales.

| Componente | Estado actual / dependencia | Riesgo y configuración | Evidencia / prueba | Aprobación responsable | Estado final |
|---|---|---|---|---|---|
| Frontend/proxy | Dockerfile + nginx same-origin | CSP/caché por probar en nginx | Contratos Node, sin build | Equipo técnico por asignar | Parcial |
| API | Dockerfile no-root, 1 worker | Lock ausente; imágenes sin ejecutar | Revisión + tests fuente | Equipo técnico | Parcial |
| Dependencias | Pyproject con rangos | No build de release hasta lock con hashes | Guard REQUIRE_LOCK=true | Revisor de dependencias | Bloqueado para release |
| Bases de imagen | Digests de índices oficiales consultados | No pull, firma o escaneo CVE | infra/base-images.json | Revisor de suministro | Preparado parcialmente |
| PostgreSQL local | Compose, volumen, red privada, roles separados | Init solo volumen NUEVO | Fuente; Docker ausente | Operador local | Parcial |
| PostgreSQL administrado | Ninguno elegido | Región, TLS/CA, roles, backups/costo | Sin conexión ni contrato | Institución + operador | No configurado |
| Readiness/cierre | SELECT 1 + versión esperada, dispose | Python no operativo | Tests unitarios escritos | Equipo técnico | Parcial |
| Archivos privados | Adapter ausente; endpoints 503 | No servir como assets públicos | Hallazgo A48-06 | Institución + equipo | Bloqueado |
| PWA | Manifiesto agregado, SW existente conservado | Instalar/actualizar/IDB/cuentas pendientes | JSON y referencias probados | Equipo + validación de uso | Parcial |
| AI | Deshabilitada por defecto | Proveedor/host/política no verificados | No llamada real | Institución/privacidad | Bloqueado |
| Insights/Sync | Motores no registrados completos | No prometer recibos/recomendaciones | Inventario 47–48 | Equipo técnico | Bloqueado |
| CI | Tres workflows preparados, lectura mínima | Sin repositorio remoto ejecutado | Tests de texto, no GitHub | Mantenedores | Parcial |
| Staging | Plantilla segura, gate cerrado | Sin autorización/proveedor/dominio | Sin URL ni despliegue | Responsable por definir | No configurado |
| Producción | Plantilla + elegibilidad manual | Fase 48 no aprobada | Gate CLI devuelve 1 | Autorización explícita institucional | Bloqueado |
| Backup/restore | Script age + libpq preparado | Herramientas/clave/destino/drill ausentes | Guardas por fuente, no backup real | Custodio por definir | Parcial |
| Observabilidad | Logs JSON/minimizados, reglas propuestas | Sin colector/canal/dashboard | Python sin ejecutar | Operador por asignar | Parcial |

Herramientas locales: Node disponible; Docker/Git/pg_dump/age no disponibles; Python devuelve 9009 (alias Store). No hay servicios cloud/correo/notificaciones confirmados. Ningún componente está marcado “desplegado y verificado”.
