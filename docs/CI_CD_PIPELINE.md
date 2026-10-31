# CI/CD preparado

No había .github/workflows. Se prepararon tres workflows, no se ejecutaron en GitHub ni se configuró remoto/ramas/secrets:

- ci.yml: push/PR/manual; permisos contents:read; Node contratos 48/49; Python 3.12 con PostgreSQL efímero sintético, Alembic en esa base, unittest y verification con --noconftest. No invoca tests/conftest.py destructivo ni usa credenciales de producción.
- build.yml: manual; exige lock con hashes, build API/frontend sin push, nginx -t, artefacto con image IDs y commit. No construye release ahora porque falta requirements.lock.
- promotion-check.yml: manual, environment staging/production y gate de elegibilidad. **No es despliegue**; no tiene proveedor, SSH, token cloud o comando de publicación. Gate actual deniega ambos entornos.

Actions referenciadas por commit completo. Revisar procedencia/actualizaciones y ejecución real antes de uso. CI puede resolver rangos para pruebas; no es build reproducible de liberación. No se configuró SCA, secret scanner, SBOM o escaneo de imágenes completo: son bloqueos pendientes, no checks verdes implícitos.

Los artifacts son evidencia sintética/identificadores, no secretos/backups ni imágenes publicadas. Retención propuesta de evidencia CI 7 días en configuración, no obligación legal. image ID local no equivale al digest de manifiesto publicado de una release.

Configurar externamente branch protections/checks/revisores y environments protegidos con aprobación responsable cuando exista repositorio autorizado. `workflow_dispatch` y la palabra environment no demuestran que protección remota esté configurada. No se cambiaron políticas del equipo ni se hizo push.

Releases futuras: commit + lock revisado + base/image digest + revisión Alembic + contratos compatibles + resultados staging + aprobación explícita. No usar latest como única identidad. Producción exige Fase 48 aprobada y restore probado. Cambiar booleanos de gate no sustituye evidencia ni autorización.
