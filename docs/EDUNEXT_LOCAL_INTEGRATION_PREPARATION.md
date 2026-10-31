# EDUNEXT — preparación de integración local, sin ejecutar servicios

Alcance autorizado: **solo preparar archivos**. No se instaló PostgreSQL ni Docker,
no se crearon bases/usuarios/volúmenes y no se inició ningún servicio. Producción,
staging y piloto real siguen sin autorización. Usar únicamente fixtures sintéticas.

## Ruta preparada: infraestructura local existente

Reutilizar `docker-compose.yml` e `infra/scripts/prepare-local-env.cjs`, no crear una
arquitectura paralela. El Compose conserva sus identificadores internos de roles
para compatibilidad. En una futura ejecución autorizada, el proyecto explícito
`edunext-integration` separaría contenedores, red y volumen de otros proyectos.
El puerto web 8080 debe estar libre. PostgreSQL no publica un puerto al host.

Prerrequisitos aún no satisfechos: Docker instalado y operativo, revisión del entorno
privado y autorización explícita para crear recursos y ejecutar migraciones en una
base nueva. La instalación de Docker no forma parte de esta preparación.

### Secuencia propuesta para revisión — NO ejecutada

Desde la raíz, tras autorización específica y confirmación de recursos nuevos:

1. Generar secretos sintéticos nuevos con el helper existente; rechaza sobrescritura:
   `node infra/scripts/prepare-local-env.cjs`.
   Si el destino existe, detenerse y revisarlo privadamente; no borrarlo ni imprimirlo.
2. Usar siempre `--env-file infra/environments/development/.env` y
   `-p edunext-integration` en las operaciones Compose. No apuntar a proyectos previos.
3. Construir `api` y `web`; no confundir build local sin lock con imagen de release.
4. Crear exclusivamente el servicio `db` y esperar su healthcheck. Si ya existe un
   volumen del proyecto, detenerse: no reutilizarlo como si fuera una base nueva.
5. Ejecutar el servicio `migrate` con perfil `tools` sobre esa base nueva. No editar
   migraciones históricas, no ejecutar downgrade y no correr la suite destructiva
   `backend/tests/conftest.py` contra ese entorno.
6. Iniciar `api`/`web` y comprobar health/readiness, revisión `phase46receipts`,
   logs sin secretos y cookies/CSRF. No crear cuentas universales ni conceder roles.
7. Solo después, preparar fixtures sintéticas institucionales y pruebas E2E de
   estudiantes/docentes/administradores con aprobación específica de los datos y roles.

No se proporciona un comando único que genere secretos, migre y arranque todo sin
revisión. No usar `down -v`, eliminación de volúmenes ni limpieza de datos como rollback.
Rollback de código no recupera una base; backup/restore requiere una prueba aparte.

## Gemini y ejecución nativa

El helper `tools/configure-gemini-session.ps1` configura solo su terminal local.
Sus variables no entran automáticamente a los contenedores: el Compose existente
mantiene IA desactivada deliberadamente. No pasar claves al frontend ni habilitar
Google para conseguir un healthcheck. La prueba remota y sus costos requieren
autorización independiente. MiniCPM del navegador permanece separado.

Si se elige instalación nativa de PostgreSQL en lugar de Docker, confirmar antes
el instalador, destino, puerto y base exclusiva; estas decisiones no están tomadas.
No arrancar FastAPI contra una `DATABASE_URL` desconocida: su lifespan escribe
roles/grados y activa retención.

## Marca y compatibilidad

Configuraciones nuevas pueden usar `EDUNEXT_CONFIG.apiBaseUrl` en el navegador y
`EDUNEXT_AI_ENABLED` en el entorno backend. Se conservan sus alias antiguos;
cuando ambos existen, tiene prioridad el nombre EDUNEXT.
Se mantienen claves IDB/localStorage/caché, nombres de roles DB, issuer/audience JWT,
clases internas, migraciones, paquetes y actas históricas. Cambiarlos sin migración
puede desconectar cuentas o hacer desaparecer borradores existentes de la interfaz.

## Validación antes de autorizar ejecución

`AITHRON_FINAL_VALIDATION=1` sigue siendo el interruptor técnico de evidencias para
compatibilidad. Ejecutar contratos de fuente, pruebas de alias y runner existente.
Esto no prueba Docker, PostgreSQL, permisos persistentes ni la generación real de IA.
