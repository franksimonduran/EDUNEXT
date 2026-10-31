# Fase 48 — continuación de auditoría, informe A–Z

**Resultado: BLOQUEADA, con validación integral incompleta.** No lista para producción,
piloto o avance a Fase 49. Auditoría focal y autorrevisión técnica, no certificación
independiente, legal, de accesibilidad o seguridad absoluta. No sustituye actas previas.

## A. Estado general

Se revisaron los controles/fuentes existentes y se corrigieron defectos reproducibles
de almacenamiento, limitador de login y claims JWT. Se ejecutaron pruebas controladas,
consulta de avisos, SBOM y mediciones acotadas. Fase 47 sigue incompleta: no se aceptan
por extrapolación módulos académicos, persistencia o flujos entre roles no comprobados.

## B. Repositorio y baseline

Git no reconocido y `.git` ausente: rama/commit/diff no acreditados. No se descartó
trabajo ni se tocaron entornos privados. Baseline nuevo antes de corregir aplicación:
995 fuentes y 459 candidatos de patrones, **no vulnerabilidades confirmadas**.
Final: 996 fuentes y 460 candidatos. Scanner excluye .env, venv/build, binarios,
symlinks y documentos de evidencia; registra solo ruta/línea/regla, no valores.
No cubre historial Git ni demuestra ausencia de secretos.

Pruebas nuevas iniciales: **12 fallidas, 3 aprobadas**; cuatro omisiones JWT
reproducidas en baseline incremental posterior. Los casos se ampliaron después,
por lo que no se presenta un porcentaje antes/después de una suite idéntica.

Artefactos inmutables:
- [Baseline inicial](final/evidence/phase48-baseline-20261027T032140720870Z/RESULTS.json).
- [Baseline incremental JWT](final/evidence/phase48-baseline-20261027T033145032968Z/RESULTS.json).
- [Resultado final y hashes](final/evidence/phase48-after-20261027T033916705619Z/RESULTS.json).
- Los JSON anteriores enlazan snapshots fuente propios; no se reescriben baseline/actas.

## C. Arquitectura y confianza

Se conservan HTML/CSS/ES6, FastAPI, PostgreSQL/SQLAlchemy/Alembic, cliente HTTP,
IndexedDB y único SW. Fronteras: navegador/API, API/DB, API/filesystem, API/proveedor,
IDB/Sync, usuario/aula y tenant/tenant. Ningún UUID, estado local o red interna autoriza.
Modelo STRIDE ampliado en SECURITY_THREAT_MODEL, sin reconstruir módulos ausentes.

## D. Autenticación

Pruebas reales de funciones con datos sintéticos: hash/verify Argon2id, contraseña
incorrecta, firma CSRF/tampering, JWT expirado, audiencia/emisor y algoritmo distinto.
Se exigieron aud/iss/exp/iat/nbf; cuatro claims omitidas eran aceptadas antes por decode.
Era aceptación de un token **firmado con la clave de prueba**, no falsificación sin clave.
El emisor de la aplicación ya produce esas claims; no se modificaron secretos reales.

Limiter ahora cota 4.096, limpieza monotónica, RLock, claves HMAC y Retry-After ceil.
No expulsa contadores activos para admitir claves nuevas ni cambia la cuota de login
configurada. Si se llena, rechaza nuevas claves: riesgo de disponibilidad residual.
No es control distribuido, ni se certifican sesiones/rotación/cookies/logout con PG.

## E. RBAC

Permisos y controles institucionales existentes conservados, sin concesiones globales
ni cambios de rol para aprobar tests. Pruebas ASGI y unitarias con contextos/dobles
no sustituyen BFLA vertical/horizontal real de todas las APIs. Falta matriz persistente.

## F. Aislamiento institucional

No se crearon dos instituciones en PostgreSQL ni se ejecutó el flujo A→B de todos
los módulos. Se mantienen abiertos A48-01/08/09/12 y la aceptación de Fase 47.
No hay nueva prueba de filtración real, pero tampoco garantía de aislamiento.

## G. APIs e inyecciones

Inventario runtime anterior: 198 paths OpenAPI/63 tablas ORM, no DB viva.
Regresión ASGI seleccionada comprueba autenticación anónima, filtros protegidos,
gate Sync, contexto de cuenta, campos privilegiados y fallo de commit simulado.
Pruebas CSV evitan fórmulas y conservan números/Unicode; no acreditan privacidad
de exportaciones de dos instituciones. No escaneo intrusivo SQLi/SSRF de endpoints.
No se relajan CORS, TrustedHost o CSRF. Fixture Reports usa localhost permitido
para probar error 503 real de la frontera ASGI, no host bloqueado artificialmente.

## H. PostgreSQL

Sin conexión a una base desconocida. No se ejecuta conftest destructivo, migración,
CREATE/DROP, EXPLAIN, restauración o cambio de privilegios. No se localizaron binarios
postgres.exe bajo `C:\Program Files\PostgreSQL`; eso no demuestra ausencia de todo
servicio externo. No se lee .env para intentar conectar. Falta un entorno PG propio
preparado/verificado; grafo Alembic fuente no equivale a revisión aplicada.

## I. Integridad académica

No se alteran matrículas, respuestas, evaluaciones, calificaciones, AD/A/B/C,
competencias o historial real. No se habilita modificación mediante progreso/AI/Sync.
Fase 40 y pruebas de entrega/publicación/rectificación siguen incompletas. No se
acepta integridad académica a partir de pruebas criptográficas o de archivos.

## J. Frontend

Sin cambios frontend nuevos en esta continuación. Reutilizada regresión de cliente,
sesión, vistas privadas y SW. Se mantiene diseño y modo demo identificado. Sinks
encontrados por patrones requieren análisis del origen de cada dato; no equivalen
automáticamente a XSS. No se certifican todas las páginas/formularios o guardas.

## K. AI

Seleccionados tests no-DB existentes: entradas privadas/injection, salidas peligrosas,
diccionario local, contrato Ollama y errores/timeout/respuesta inválida con MockTransport.
No se llama a daemon real, proveedor pagado o IA externa; ningún modelo se activa.
No hay evaluación pedagógica real de 4.º/5.º/6.º ni pronunciación/transcripción,
captura de micrófono o tratamiento de audio. Filtro léxico no garantiza moderación.

## L. Insights

Se conserva motor determinista parcial y vista API integrada previamente. No genera
diagnósticos, niveles, tareas o refuerzos automáticos. Permisos/fuentes completas y
vigencia persistente requieren PostgreSQL; no se inventan competencias o recomendaciones.

## M. Sync

Se conservan gates deshabilitados, cola particionada y protocolo limitado. Pasan
pruebas seleccionadas con dobles de operaciones, recibos incompatibles, quota, errores,
backoff, cuenta y ausencia de Web Locks. No se confirman nuevos recibos PG reales.
Paquetes/pull/cursores, IDB real, dos pestañas/dispositivos y sesión revocada real
siguen sin evidencia suficiente. No se modifica SW ni se elimina trabajo pendiente.

## N. Privacidad

Solo archivos, contraseñas, tokens y contextos sintéticos. Contexto de tests aislado
sin .env; providers/gates false y URL DB sintética inaccesible. Para SCA solo se envían
nombres/versiones de paquetes públicos a PyPI. No datos académicos, código o secretos.
HMAC/cota reduce identificadores legibles y retención en RAM; no es anonimización legal.
No se certifican cifrado local, revocación de copias offline, backups o derechos/retención.
Revisión jurídica de tratamiento de menores y proveedores sigue pendiente.

## O. Rendimiento medido

Una muestra antes/después, Windows/Python 3.11, ASGI in-process sin lifespan, sockets
ni DB: **100 GET health/live**, concurrencia máxima **4**, cero respuestas no-200.

| Métrica | Baseline | Final |
|---|---:|---:|
| p50 ms | 14.102 | 13.707 |
| p95 ms | 16.826 | 16.696 |
| p99 ms | 91.416 | 89.363 |
| CPU proceso s | 0.515625 | 0.5 |
| Pico Python tracemalloc bytes | 387962 | 387942 |
| Claves retenidas, 5.000 checks limiter | 5000 | 4096 |
| Tiempo probe limiter ms | 72.054 | 112.513 |

Los rechazos por capacidad no son logins HTTP. El limitador más estricto cuesta más
tiempo; no se vende como aceleración. Tracemalloc no es RSS ni prueba de fuga; no
se atribuyen diferencias pequeñas de latencia a una optimización significativa.
Objetivo del smoke: cero errores inesperados. Sin SLA/capacidad de producción aprobados.
No estrés/soak, usuarios reales, carga de negocio, reconexión masiva o Web Vitals.

## P. PostgreSQL performance

No EXPLAIN/ANALYZE, planes, índices, N+1 observado, deadlocks o pool bajo carga.
No se ajustan índices/pool por intuición ni se sacrifican scope/conteos/privacidad.
Rendimiento integral bloqueado por falta de entorno y escenarios persistentes.

## Q. Resiliencia de archivos

Reproducción real con archivos propios: una subida excesiva truncaba el destino.
Ahora lectura acotada previa, soporte de reads parciales y temporal fsync/replace.
Error inyectado de replace conserva bytes previos y elimina solo temporal propio.
Rutas resueltas/Windows y URL encoding restringidos; checksum metadata por bloques.

No habilita subida/descarga de Fase 38: A48-06 sigue mitigada mediante 503. Tampoco
garantiza defensa ante operador hostil que cambia symlinks/dirs entre check y uso,
ni almacenamiento productivo, permisos completos, expiración de URLs o todas las
funciones del adapter. No backup/restore ni RPO/RTO observado.

## R. Accesibilidad

Reutilizadas comprobaciones de login: etiquetas, h1/main/lang, errores aria-invalid,
foco y Tab en navegador; no todas las tareas con teclado. Sin lectores de pantalla,
contraste/zoom integral, accesibilidad de arrastrar/ordenar o WCAG 2.2 AA certificada.

## S. Compatibilidad

Chrome y Edge reales headless en Windows; login a 320/375/768/1440 y cinco páginas
demo a 375/1440. Doce registros de navegador aprobados en regresión (no doce E2E
autenticados). No Firefox/Safari, móviles físicos, instalación/actualización PWA
integral o UI real con PostgreSQL.

## T. Calidad y pruebas

Final: **61 pruebas de seguridad acotadas aprobadas**; incluye 26 casos de remediación,
9 configuraciones/readiness con dobles, 17 AI con mocks y 9 CSV/fallo Reports.
Regresión separada: **67 passed, 1 skipped, 35 subtests passed**, suites Node
seleccionadas y navegador público/demo aprobados. El skip PG no cuenta como aprobado.
Los nombres históricos test_phase49_security no significan implementación de Fase 49.

- [Evidencia seguridad final](final/evidence/phase48-after-20261027T033916705619Z/RESULTS.json).
- [Regresión seleccionada final](final/evidence/phase47-integration-20261027T033923946259Z/RESULTS.json).
- [Navegadores finales](final/evidence/phase47-integration-20261027T033923946259Z/BROWSER_VALIDATION.json).

No se desactivaron tests críticos ni se ejecutó una suite que borra tablas.
Falta suite E2E completa con PG y dos instituciones, sesiones/cookies/concurrencia,
offline persistente, evaluación académica y restauración. La selección evita fixtures
DB no autorizadas y está documentada; no se presenta como toda la suite disponible.

## U. Vulnerabilidades y suministro

Nuevos A48-14..19 y actualización A48-13 en VULNERABILITY_REGISTER: truncado, rutas,
claims, herramientas y dependencias. Severidades contextuales, no CVSS certificado.
No se detectó/validó exposición real de secreto; scanner no garantiza ausencia.

pip-audit **2.10.1**, servicio PyPI, consulta UTC 2026-10-27, 54 paquetes resueltos:
antes coincidían ecdsa/python-jose/pip/setuptools. Se actualizaron solo pip/setuptools
del venv de aplicación propio, a 26.2.2/84.2.1, y suelo build setuptools>=84.1.0.
Reconsulta mantiene **dos paquetes con avisos sin fix_version**; exit 1 conservado.

- python-jose 3.5.0: PYSEC-2026-4298 / CVE-2026-85394; requiere review contextual de
  confusión HMAC/clave. El proyecto restringe algoritmo; test de algoritmo distinto
  pasa. No se leyó configuración privada ni se certifican todos los despliegues.
- ecdsa 0.19.2: PYSEC-2026-1325 / CVE-2024-23342; timing de firma ECDSA, no se invoca
  esa firma en los tests HS256. No se declara riesgo eliminado o automáticamente aceptado.

- [Avisos antes](final/evidence/phase48-dependencies-20261027T032825661229Z/ADVISORIES.json).
- [Avisos después](final/evidence/phase48-dependencies-20261027T033307506104Z/ADVISORIES.json).
- [SBOM CycloneDX 1.4, 54 componentes](final/evidence/phase48-dependencies-20261027T033307506104Z/SBOM.cdx.json).

Duplicados del servicio no son CVEs independientes. `pip check` sin errores no es
SCA. SBOM no cubre OS/Docker/CI/modelos/frontend/recursos ni aprueba licencias.

## V. Correcciones / archivos

Creados:
- `backend/verification/test_phase48_remediation.py`
- `tools/validate-security.py`
- `tools/audit-dependencies.py`
- `docs/PHASE_48_CONTINUATION_2026-10-27.md`
- Nuevos artefactos baseline/after, inventarios y SCA/SBOM citados (directorios únicos).

Código modificado:
- `backend/app/dependencies/auth.py`
- `backend/app/core/security.py`
- `backend/app/storage/local_storage.py`
- `backend/pyproject.toml`
- `backend/verification/test_reports_engine.py`
- `tools/audit-phase48.cjs`

Documentación modificada con adendas, sin reemplazar actas/resultados históricos:
- `README.md`
- `docs/VULNERABILITY_REGISTER.md`
- `docs/REMEDIATION_LOG.md`
- `docs/DEPENDENCY_SECURITY_AUDIT.md`
- `docs/AUTHENTICATION_SECURITY_AUDIT.md`
- `docs/SECURITY_THREAT_MODEL.md`
- `docs/PERFORMANCE_BASELINE.md`
- `docs/PERFORMANCE_TEST_RESULTS.md`
- `docs/RESILIENCE_TEST_RESULTS.md`
- `docs/CHILD_DATA_PRIVACY_AUDIT.md`
- `docs/RESIDUAL_RISKS.md`
- `docs/PRODUCTION_SECURITY_GATE.md`
- `docs/SECURITY_AUDIT_REPORT.md`
- `docs/PHASE_48_AUDIT_PLAN.md`
- `docs/PHASE_48_SYSTEM_BASELINE.md`

No migraciones/modelos de dominio/Frontend/SW nuevos en esta continuación. Original
venv del proyecto y .env intactos; tooling actualizado solo en venv desechable aprobado.

## W. Riesgos residuales

Altos abiertos: tenant/RBAC granular, revocación/rotación/entregas reales, Fase 40,
Sync completo y multiusuario, archivos reales y dependencias pendientes de revisión.
Capacidad global del limiter puede agotarse; coordinación entre workers no existe.
Sin RPO/RTO, restore, carga representativa, seguridad semántica AI o accesibilidad
integral verificados. Ninguna de estas limitaciones se acepta implícitamente.

## X. Documentación, reproducción y hashes

REMEDIATION_LOG enlaza causa/cambio/prueba y VULNERABILITY_REGISTER estados. Las adendas
actualizan contexto sin borrar evidencia congelada ni reinterpretar aprobaciones.
Herramientas reproducibles, ejecutadas con `AITHRON_FINAL_VALIDATION=1`:

```powershell
& '<venv-aplicación>\Scripts\python.exe' tools/validate-security.py --stage baseline --temp-dir 'C:\Users\simon\AppData\Local\Temp\opencode'
& '<venv-aplicación>\Scripts\python.exe' tools/validate-security.py --stage after --temp-dir 'C:\Users\simon\AppData\Local\Temp\opencode' --full-regression
& '<venv-auditor>\Scripts\python.exe' tools/audit-dependencies.py --runtime-python '<venv-aplicación>\Scripts\python.exe' --auditor-python '<venv-auditor>\Scripts\python.exe' --temp-dir 'C:\Users\simon\AppData\Local\Temp\opencode'
```

Venv aplicación: `...\opencode\aithron-integration-e4c75e81f5d0498fae58297003317fbe`.
Venv auditor separado: `...\opencode\aithron-audit-de008cd837534f478ad8760d47741f29`.
No se instalan auditores en el runtime ni se envía contenido de alumnos a advisories.
Hashes SHA-256 de código en snapshots y RESULTS; se repiten pruebas tras correcciones.
No se regenera un candidato congelado para aparentar aprobación.

## Y. Estado para Fase 49

**No autorizado a avanzar ni desplegar.** Requiere entorno PG sintético operativo,
pruebas E2E/tenant/roles/entregas/concurrencia, tratamiento o revisión explícita de
avisos/dependencias y altos, pruebas de backup/restore, capacidad representativa y
revisión especializada de privacidad/pedagogía. No se compra/activa infraestructura.

## Z. Decisión

**BLOQUEADA — VALIDACIÓN INTEGRAL INCOMPLETA.** Se corrigieron defectos focales con
evidencia, no se aprobaron todos los criterios. Sin cambios de notas/AD/A/B/C, datos
de menores, borrado de respuestas, bases/volúmenes o IDB real; sin secretos publicados,
rotación real, push o despliegue. Se detiene para revisión, sin iniciar Fase 49.
