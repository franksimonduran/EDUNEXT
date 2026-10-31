# Revisión de integración y despliegue — 2026-10-31

**Resultado: integración parcial; producción y piloto real siguen NO-GO.**
Revisión local de fuente y verificaciones aisladas. No sustituye las actas 47–50,
el registro de vulnerabilidades ni la autorización institucional. No se publicaron
repositorios, imágenes, dominios o servicios. No se accedió a `.env` privado.

## Resultados nuevos

1. `tools/validate-integration.py` ejecutado con un entorno Python existente de
   comprobación, directorio de trabajo temporal sin `.env`, configuración sintética
   y servicios IA/Sync desactivados. No ejecuta lifespan ni conecta PostgreSQL.
   **67 tests aprobados, 1 omitido, 35 subtests aprobados**, con dos advertencias
   de deprecación. El motivo de omisión figura en los tests existentes; no es un pase.
2. Importación/construcción de FastAPI y generación de OpenAPI satisfactorias:
   **203 paths**, **63 tablas ORM**, cabeza Alembic de fuente `phase46receipts`.
   El antiguo bloqueo documental de importación de assessment **no se reprodujo**;
   no se reconstruyeron esquemas ni routers. Esto no prueba arranque con DB.
3. Contratos de cliente HTTP, sesión, políticas SW, vistas privadas y protocolo
   Sync satisfactorios en su alcance sintético. No prueban aislamiento de cuentas reales.
4. Runner final: regresión Node, contratos de infraestructura, navegador demo
   Edge/Chrome y aceptación documental satisfactorios. Su decisión sigue NO-GO.
   Las exclusiones históricas del runner se interpretan solo dentro de su ejecución;
   la ejecución Python separada se acredita con su evidencia propia.
5. Git, Docker, psql y pg_isready no localizados en PATH en esta revisión.
   Eso no demuestra que no existan instalaciones fuera de PATH o servicios remotos.
   No se inspeccionaron secretos ni se intentó descubrir bases mediante credenciales.

## Corrección acotada de infraestructura

Compose esperaba `phase45ai` mientras `alembic upgrade head` aplicaría
`phase46receipts`. Se actualizó **solo** `EXPECTED_ALEMBIC_REVISION` para evitar
incoherencia del readiness con las migraciones actuales. Nuevo guard de fuente:
`tests/deployment-readiness.cjs`. No se editaron migraciones ni se ejecutó ninguna.
Compose conserva IA y Sync apagados, red local y permisos/secretos separados.

## Estado por módulo

| Módulo | Confirmado en esta revisión | Falta antes de declarar integración real |
|---|---|---|
| Backend/configuración | Importación, OpenAPI y contratos aislados | Lifespan y PostgreSQL autorizados, errores de arranque, health/readiness reales |
| Auth/RBAC | Contratos y fallos seguros con dobles | Login/logout/refresh y roles con persistencia, dos instituciones, cookies reales |
| Personas/organización | Routers y modelos existentes | Conectar vistas que siguen demo y verificar matrículas/asignaciones reales |
| Cursos/lecciones | Contratos y catálogo local | Publicación, matrícula y acceso real por institución |
| Prácticas/evaluaciones | Fuente y contratos de frontera | Respuestas persistentes, revisión docente y resultados autorizados; no inferir AD/A/B/C |
| Planner/progreso/reportes | API parcial existente | Flujo docente-estudiante, concurrencia y fuentes persistentes completas |
| Insights/Sync | Routers registrados; protocolo probado con dobles | Fuentes reales, recibos persistentes, offline/cambio de cuenta; no declarar módulos ausentes |
| MiniCPM local | Integración de UI y pruebas anteriores | Inferencia real, rendimiento, precisión y revisión pedagógica/dispositivos |
| Gemini online | Adaptador preparado; clave solo backend | Prueba remota expresamente autorizada, sesión real, política institucional, costos y privacidad |
| Traducción | Argos preparado y vocabulario demo separado | Revisar el flujo concreto, modelos instalados y ruta activa; Gemini tutor no habilita traducción |
| Archivos/adjuntos | Mitigaciones y bloqueo documentados | Verificar almacenamiento y autorización antes de habilitar cargas/descargas |
| Despliegue | Contratos de fuente; gate cerrado | Docker/CI ejecutados, lock revisado, staging autorizado, HTTPS y restore probado |

## Bloqueos que no se resuelven con cambios visuales

- Base desechable propia **identificada y autorizada**. No ejecutar `backend/tests/conftest.py`
  ni inicialización contra una base desconocida: esa suite recrea tablas; el lifespan
  crea/actualiza roles y grados y arranca retención.
- Hallazgos abiertos de aislamiento, autorización granular, integridad, offline
  multiusuario y cobertura real. Dependencias python-jose/ecdsa siguen requiriendo
  revisión; no se ejecutó nueva SCA ni se declara ausencia de vulnerabilidades.
- No hay lock de dependencias completo revisado con hashes. Instalar rangos de
  `pyproject.toml` o capturar `pip list` no constituye un lock aprobado.
- Dominio, proveedor, presupuesto, responsables, privacidad, términos y revisión
  pedagógica requieren decisiones y autorizaciones, no inferencias del agente.
- Las claves expuestas deben revocarse por el propietario. No se reutilizaron ni
  verificaron claves reales; las variables de otra terminal no pasan a este agente.

## Orden de integración siguiente, sujeto a autorización

1. Identificar entorno PostgreSQL desechable y mecanismo de ejecución disponible
   (instalación propia o Docker autorizado); no instalar ni crear recursos automáticamente.
2. Verificar migraciones aplicadas, roles DB y readiness; recién después iniciar API.
3. Ejecutar flujos reales con fixtures sintéticas de dos instituciones y tres roles.
4. Conectar vistas existentes por módulo y validar persistencia/autorización antes
   de sustituir demos; no reconstruir módulos ausentes bajo un cierre.
5. Probar Gemini/Argos/MiniCPM separadamente y comprobar fallos, límites y privacidad.
6. Resolver seguridad/suministro, probar backup/restore y preparar staging privado
   únicamente con autorización explícita. No iniciar nuevas fases automáticamente.

## Evidencias nuevas

- `final/evidence/phase47-integration-20261031T052803847315Z/RESULTS.json`
- `final/evidence/phase47-integration-20261031T052803847315Z/RUNTIME_INVENTORY.json`
- `final/evidence/revalidation-1793424533673-18712/FINAL_TEST_RUN.json`
- Revalidación tras la corrección, con el guard de migraciones integrado:
  `final/evidence/revalidation-1793424726594-11648/FINAL_TEST_RUN.json`
- El test de alineación se ejecuta con `AITHRON_FINAL_VALIDATION=1` y guarda
  `DEPLOYMENT_READINESS_SOURCE.json` en un namespace nuevo; contiene hash de Compose.

Las evidencias anteriores no se sobrescribieron y el gate no se cambió a aprobado.
