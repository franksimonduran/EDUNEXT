# EDUNEXT — instrucciones para intervenciones futuras

- Mantener frontend HTML5/CSS3/JavaScript ES6; no React/Vue/Angular/TypeScript ni frameworks CSS.
- Mantener FastAPI, Pydantic, PostgreSQL, SQLAlchemy y Alembic. Reutilizar auth, RBAC y servicios; no reconstruir módulos ausentes bajo una fase de cierre.
- Leer README, actas 47–50, registro de vulnerabilidades y gate de liberación antes de cambiar código. Documentación preparada no equivale a software verificado.
- No publicar, contratar, cambiar DNS, rotar secretos reales, importar datos de menores o ejecutar piloto real sin autorización específica. Producción/piloto real siguen NO-GO.
- No descartar trabajo ajeno, borrar tablas/volúmenes/IDB/respuestas ni modificar AD/A/B/C automáticamente. No ejecutar pytest tests/conftest.py contra una base desconocida: recrea tablas.
- Usar exclusivamente fixtures sintéticas y bases/entornos propios autorizados. No activar proveedores AI, micrófono o sincronización como si fueran capacidades verificadas.
- No leer/imprimir/copiar .env privado o secretos a evidencias, imágenes o informes. No crear cuentas universales, almacenar JWT en localStorage/IDB ni debilitar CSRF/CORS/RBAC.
- No modificar migraciones históricas aplicadas ni downgrade destructivo. Distinguir rollback de código de recuperación de datos.
- Reutilizar tests y guardar la evidencia final con AITHRON_FINAL_VALIDATION=1; no sobrescribir baseline/actas anteriores para aparentar aprobación.
- No inventar resultados, participantes, testimonios, licencias, certificados o aprobaciones. Declarar límites de mocks, análisis estático y navegador demo.
- Mantener candidatos internos sin publicar; verificar hashes tras cada corrección y repetir pruebas pertinentes. No iniciar nuevas fases automáticamente.
