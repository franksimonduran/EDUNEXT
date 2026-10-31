# Fase 48 — plan y matriz de auditoría

## Continuación autorizada 2026-10-27

Línea base nueva inmutable antes de correcciones, sin sustituir actas previas.
Prioridades verificadas: pérdida de archivo, rutas Windows, memoria/concurrencia
del limiter, claims JWT y dependencias. Tests en venv/CWD propios, archivos sintéticos,
sin `.env`, DB, datos de menores o proveedores. Consulta PyPI solo de paquetes.

Herramientas: pytest, ASGI/httpx, ThreadPoolExecutor local, filesystem temporal,
pip-audit 2.10.1/PyPI/CycloneDX, scanner fuente sin valores, regresión Node y CDP
Chrome/Edge públicos/demo. Carga limitada a 100 health ASGI concurrentes de a 4 y
5.000 comprobaciones de función limiter; no stress, servicio externo o carga DB.

Riesgos/resultado/corrección por ID en VULNERABILITY_REGISTER y evidencia antes/después
en PHASE_48_CONTINUATION_2026-10-27. La falta de PG/E2E/tenant/restore sigue bloqueando
aprobación. No avanzar a infraestructura Fase 49 ni tomar mocks como confirmaciones.

## Matriz histórica

Alcance autorizado: repositorio local, datos sintéticos, dobles y servidor HTTP efímero en 127.0.0.1. Sin producción, terceros, carga destructiva, datos reales, pagos, push o Fase 49. Fase 47 no está aceptada; no se asumen módulos completos.

| Área / riesgo | Objetivo y método | Herramienta/entorno | Resultado/evidencia | Corrección / estado |
|---|---|---|---|---|
| Caché privada / divulgación | Reproducir política de almacenamiento y lectura | Node VM de sw.js | 4 fallos iniciales; suite ampliada a 9 checks | Namespace público, exclusiones, no-store; mitigado, navegador pendiente |
| Cliente / sesiones | Timeout, errores, refresh, logout concurrente | Node, transporte simulado y HTTP loopback | Cuatro suites en PHASE_48_REGRESSION_EVIDENCE.json | Mejorado; no prueba revocación real ni dos pestañas |
| RBAC/BOLA | Seguir rutas → servicios → consultas | Lectura de Python | Faltaba comprobación del curso padre en lecturas/asociaciones | Cambios aplicados; unidad Python y dos tenants pendientes |
| Refresh / replay | Revisar transacción de rotación | Lectura de auth_service.py | SELECT de token no bloqueaba fila | FOR UPDATE agregado; concurrencia PostgreSQL pendiente |
| Configuración / exposición | Revisar defaults, CORS, cookies, logs | Lectura + inventario hash | DEBUG/defaults inseguros si se desplegaban sin validación | Validador producción, no-store, logs mínimos; runtime pendiente |
| Archivos / integridad | Comprobar persistencia y detección | Lectura de endpoints/storage | Upload no guardaba bytes; download devolvía metadatos | 503 explícito; no recrear almacenamiento; pruebas Python pendientes |
| Dependencias / cadena | Declaraciones, lock, imports, secretos candidatos | Escáner local de patrones sin valores | JSON baseline/after; candidatos no equivalen a vulnerabilidades | EmailStr requiere email-validator; sin resolución/SCA completo |
| AI / menores | Destinos, contexto, límites, audio | Lectura gateway/proveedor y docs previos | Adaptador loopback; proveedor real no verificado | Evaluación semántica/pedagógica bloqueada |
| Insights/Sync | Verificar existencia y capacidades | Router/documentación Fase 47 | No hay routers registrados | No implementados como motores verificables; bloqueados |
| Rendimiento/PostgreSQL | Medir p50/p95/p99, EXPLAIN, integridad | Requiere app/BD aisladas | No ejecutado | No se optimizan índices/pool sin medidas |
| Accesibilidad/E2E/PWA | Teclado, zoom, instalación, roles reales | Edge/Chrome CDP + app integrada requerida | Login público probado; resto no ejecutado | Bloquea aceptación integral |

Prioridad: menores, aislamiento, sesiones, respuestas, archivos y registros académicos. Aprobación requiere evidencia runtime, ausencia de bloqueantes y revisión explícita de hallazgos altos. No basta un inventario o suite verde de dobles.
