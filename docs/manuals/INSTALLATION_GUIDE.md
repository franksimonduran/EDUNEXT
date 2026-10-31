# Instalación y comprobación — distinguir probado de preparado

## Probado en este entorno

Windows, Node v24.22.1. Desde la raíz del repositorio:

```powershell
node tools/final-inventory.cjs
node tools/run-final-validation.cjs
```

El segundo comando ejecuta contratos/fuente, fixtures locales y navegadores Edge/Chrome instalados; no levanta FastAPI ni PostgreSQL. Usa perfiles temporales nuevos y conserva evidencias en docs/final/evidence. Verificar resultados, no asumir PASS por existir comando. No es login real ni E2E autenticado.

Si ya existe candidato congelado, el primer comando se sustituye por `node tools/final-inventory.cjs --verify`: no sobrescribe su inventario. Revalidaciones posteriores usan carpeta nueva y conservan la evidencia congelada.

## Backend/infraestructura: pasos preparados, NO ejecutados aquí

Python >=3.11, PostgreSQL, Docker con contenedores Linux/Compose v2 según opción. Frontend no requiere npm/framework de aplicación. Python local es alias Store, Docker/Git/pg_dump/age no están disponibles. Por tanto no existe instalación completa reproducida en esta máquina.

Seguir [Docker local](../DOCKER_DEPLOYMENT.md) para NUEVO entorno sintético: generar NUEVA .env con el helper (sin sobrescribir), config --quiet, build dev, db --wait, migración explícita y api/web, smoke loopback. No down -v. Esos comandos no están probados y no autorizan staging/producción.

Alternativa Python cuando el operador disponga de herramientas: entorno virtual, dependencias de backend/pyproject.toml, variables propias/base aislada, revisar Alembic y arrancar `python -m uvicorn app.main:app --host 127.0.0.1` desde backend. El servidor estático Python histórico no hace proxy /api/v1; usar la infraestructura same-origin o configurar base pública antes de módulos. No abrir HTML con file:// para probar módulos.

## Pruebas backend y riesgos

CI prepara PostgreSQL efímero y verification con --noconftest. No ejecutar backend/tests/conftest.py en base desconocida: borra/recrea tablas. No habilitar su opt-in para obtener una suite verde. Unit tests 48/49 están escritos, no ejecutados aquí. Release build exige requirements.lock con hashes que falta; no inventar lock/resolución.

No se ha validado que otro operador pueda reproducir todo con esta guía. Cualquier paso pendiente necesita evidencia propia antes de aprobar uso real.
