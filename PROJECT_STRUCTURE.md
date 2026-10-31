# Estructura real de EDUNEXT

Esta es una fotografía del repositorio, no una arquitectura ideal ni prueba de ejecución.

```text
frontend/                  HTML de entrada y student/, monitor/, admin/
  css/                     estilos/componentes y páginas
  js/core/                 configuración, roles y navegación
  js/services/             servicios demo/locales y clientes API existentes
  js/data/                 contenido y registros ficticios, no datos oficiales
  js/offline/              IndexedDB/caché/preparación local; no motor Sync certificado
  assets/                  recursos públicos incluidos; licencias por revisar
  sw.js                    único Service Worker existente
  manifest.webmanifest     manifiesto preparado, instalación no certificada
backend/
  app/api/v1/              routers y endpoints
  app/core/                seguridad/config/logging/middleware
  app/db/models/           declaraciones SQLAlchemy
  app/dependencies/        auth/RBAC/paginación
  app/schemas/             Pydantic
  app/repositories/        consultas de dominio
  app/services/            reglas y servicios
  app/providers/           adaptador AI existente
  app/storage/             validadores; adapter de bytes pendiente
  alembic/                 historial de migraciones conservado
  tests/                   suite con conftest destructivo: requiere aislamiento explícito
  verification/            verificaciones y unittest no destructivos nuevos
  scripts/                 scripts backend previos
  Dockerfile               preparado; build release exige lock pendiente
infra/
  docker/                  proxy/frontend/init local
  environments/            plantillas development/staging/production
  scripts/                 gates, entorno nuevo, smoke y validación
  backups/                 script cifrado/drill, no copias reales
  monitoring/              alertas propuestas, sin canal conectado
.github/workflows/         CI/build/elegibilidad; no despliegue cloud
tests/                     suites Node/navegador y fases previas
  acceptance/              comprobaciones finales reales de fuente/datos/docs/gates
  fixtures/                escenarios sintéticos no sembrados
tools/                     auditorías/inventario/regresión/candidato
docs/                      arquitectura y evidencias históricas
  final/                   estado 50 fases, aceptación, inventario y candidato interno
  final/evidence/          resultados reales de esta validación
  pilot/                   plan/instrumentos, NO piloto ejecutado
  manuals/                 manuales con límites reales
  operations/              soporte/mantenimiento/entrega por designar
docker-compose.yml         solo entorno local sintético, no ejecutado
```

No hay directorios raíz database/, content/ o scripts/: modelos/migraciones/contenido/scripts residen en los lugares indicados. No se crean carpetas paralelas. No .git ni LICENSE identificados; no se inventan rama, licencia o propietario.

Listado completo regenerable y referencias HTML/CSS/JS, endpoints/modelos/migraciones en `docs/final/FINAL_INVENTORY.json`; generador `node tools/final-inventory.cjs`. Excluye configuraciones privadas, claves, copias y cachés. Es análisis estático, no OpenAPI ni esquema vivo.
