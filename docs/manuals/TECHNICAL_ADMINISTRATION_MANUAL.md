# Administración técnica

## Arquitectura y estado

HTML/CSS/ES6 + FastAPI/Pydantic + PostgreSQL/SQLAlchemy/Alembic. No framework frontend, backend adicional o SQLite sustituto. Infra 49 prepara proxy/imagen/API/DB local, no producción. Insights/Sync completos y almacenamiento privado faltan; AI deshabilitada. [Arquitectura](../DEPLOYMENT_ARCHITECTURE.md).

## Entornos/repositorio/configuración

Consultar PROJECT_STRUCTURE y AGENTS en raíz. Git no disponible/.git ausente aquí; no hay release/commit público. Plantillas separadas en infra/environments, no copiar .env privado a imágenes o evidencias. No usar staging como copia de datos reales. Settings valida entorno, secretos, CORS/hosts/TLS/revisión esperada; lectura de estructura no acredita entropía, conexión o aprobación.

## Operación preparada, no probada

- API: un worker, cierre controlado, readiness con SELECT 1/revisión. Runtime Python no verificado.
- DB: roles app/migración, red privada/volumen local y TLS verify-full staging/producción; no migración automática al arrancar.
- Migraciones: revisar heads/version actual/backup/drill/staging/compatibilidad y obtener autorización antes de upgrade. No downgrade destructivo.
- Frontend: same-origin /api/v1, único SW, manifiesto; no purgar trabajo local al actualizar.
- Logs: JSON técnico, sin cuerpos/SQL privado; colector/métricas/alertas no conectados.
- Backup/restore: script age/libpq preparado, ninguna restauración verificada; no guardar copias en Git.
- AI: no habilitar proveedor/gastos/voz sin controles institucionales y prueba real.
- Sync: no sincronizar notas/roles ni prometer recibos mientras no exista motor confirmado.

## Comprobaciones y mantenimiento

[Instalación](INSTALLATION_GUIDE.md), [backup/recuperación](../operations/BACKUP_AND_RECOVERY_GUIDE.md), [actualizaciones](../operations/UPDATE_PROCEDURE.md) y [runbook de producción bloqueado](../PRODUCTION_DEPLOYMENT_RUNBOOK.md). Soporte/revisores/custodios por designar; no transferir secretos por manual. Ningún otro integrante ejecutó una entrega reproducible completa todavía.
