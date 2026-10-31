# Dependencias y suministro

## Consulta real 2026-10-27 (UTC)

Se ejecutó pip-audit **2.10.1** en venv separado, servicio de avisos **PyPI**, sobre
54 paquetes resueltos del venv desechable de aplicación/pruebas, incluido pip/setuptools.
Solo se enviaron nombres/versiones de paquetes, no código, claves o datos educativos.

Antes: coincidencias en ecdsa 0.19.2, python-jose 3.5.0, pip 22.3 y setuptools 65.5.0.
Se actualizaron **solo herramientas del venv propio** a pip 26.2.2/setuptools 84.2.1;
build-system ahora requiere setuptools>=84.1.0. Después: quedan ecdsa/python-jose,
sin fix_version en el servicio consultado. Avisos con IDs duplicados no se cuentan
como vulnerabilidades independientes. No se ejecutó `--fix` automático.

- Antes: `final/evidence/phase48-dependencies-20261027T032825661229Z/ADVISORIES.json`.
- Después: `final/evidence/phase48-dependencies-20261027T033307506104Z/ADVISORIES.json`.
- SBOM CycloneDX 1.4, 54 componentes: mismo directorio posterior, `SBOM.cdx.json`.
- Snapshot exacto de versiones: `RESOLVED_REQUIREMENTS.txt`, no lock con hashes aprobado.

Triaged contextualmente en A48-18/19: allowlist JWT probada, sin invocación ECDSA
en tests HS256, no afirmación de seguridad global o aceptación del riesgo.
Exit 1 de pip-audit se conserva: no es un resultado verde. `pip check` pasa pero
no detecta CVEs. Scope no cubre OS/Docker/CI/modelos/activos frontend/licencias.
Las aseveraciones de falta de consulta inferiores son históricas, no estado actual.

## Registro histórico

Fuente: backend/pyproject.toml. Rangos >= para FastAPI, Pydantic, SQLAlchemy, Alembic, asyncpg, python-jose, passlib[argon2], multipart, etc. No se resolvió entorno ni lock transitivo. No se consultó base CVE/OSV ni ejecutó pip-audit/Safety; fecha de consulta de vulnerabilidades: **no realizada**. No declarar ausencia de CVEs.

EmailStr requiere email-validator; se añadió declaración explícita. El detector de archivos importaba magic sin manejar ausencia; ahora opcional y tipo desconocido se rechaza. No se instalaron paquetes ni se verificaron las versiones resueltas.

Herramienta propia audit-phase48.cjs revisa fuentes por patrones y almacena solo archivo/línea/regla, sin valores. Los candidatos de passwords/secret literals incluyen fixtures y defaults. No se revisó historial Git (no disponible) ni `.env` privado. No se confirmó una clave real filtrada; tampoco se certifica cobertura de secretos. Si se confirma exposición, rotar bajo autorización, no publicar valor.

No hay workflows/Compose raíz identificados; imágenes, CI y procedencia de artefactos no evaluadas. El inventario de declaraciones en JSON **no es SBOM completo**; faltan transitivas/versiones/licencias y recursos multimedia. Frontend no incorpora framework o dependencia nueva.
