# EDUNEXT — migración de identidad

## Adenda 2026-10-31 — nombres públicos y preparación local

Se añadieron `EDUNEXT_CONFIG.apiBaseUrl` y `EDUNEXT_AI_ENABLED`, con prioridad sobre
los alias anteriores y sin eliminar su compatibilidad. Se actualizaron textos de
diagnóstico visibles que aún mencionaban la base por su identificador histórico.
No se renombraron bases, cachés, roles, JWT, migraciones ni actas históricas.
Pruebas: `tests/edunext-config-alias.cjs` y `tests/edunext-settings-alias.py`.
Preparación autorizada limitada a archivos, sin instalar/iniciar PostgreSQL:
[guía local](EDUNEXT_LOCAL_INTEGRATION_PREPARATION.md).

## Informe histórico de migración

**EDUNEXT es la nueva identidad de la plataforma anteriormente denominada AITHRON EDU.**

Migración de marca local del 29 de octubre de 2026 UTC, sin publicación ni nueva
aceptación funcional. Producción y piloto real continúan **NO-GO**.

## Alcance y auditoría

Se revisaron 1.436 archivos de fuente/documentación mediante una lista de extensiones
permitidas, excluyendo entornos privados, bases de datos y secretos. 514 archivos
tenían referencias anteriores. No hay `.git` ni ejecutable Git disponible: no se
inventan rama, commit o estado limpio. El trabajo previo se conservó.

Además se revisó la plantilla pública `backend/.env.example` y se actualizó solo su
encabezado y `APP_NAME`. No se leyó ni modificó ningún `.env` privado.

La auditoría clasificó interfaz, PWA, documentación vigente, documentación histórica,
identificadores persistentes y configuración externa antes de aplicar 299 cambios
de frases públicas revisadas. No fue una sustitución indiscriminada de `aithron`.
La lista completa, categorías y hashes previos están en
`final/evidence/edunext-brand-20261029-01/BRAND_AUDIT_BEFORE.json`.

Resultado final de fuente: **305 archivos existentes modificados y 9 archivos
nuevos** (sin contar evidencias). Se restauraron dos rutas documentales históricas
que no debían renombrarse, verificando coincidencia exacta con su hash previo.
La lista íntegra y los SHA-256 finales figuran en `changedFiles`, `addedFiles` y
`hashes` de la validación de fuente enlazada abajo.

## Cambios

- Títulos de las 176 páginas HTML, textos, mensajes, navegación, traducciones de
  interfaz, reportes y guía offline demo utilizan EDUNEXT.
- Productos visibles: EDUNEXT Student, EDUNEXT Monitor, EDUNEXT Admin, EDUNEXT AI,
  EDUNEXT Translate, EDUNEXT Insights y EDUNEXT Sync. Los roles y sus permisos no cambian.
- Metadatos públicos FastAPI/OpenAPI, fuente del vocabulario y encabezado CSV
  actualizados; rutas, esquemas, clases y operación de autenticación conservados.
- README, estructura y documentación vigente con referencias de marca actualizadas.
  Actas, resultados, auditorías e inventarios históricos permanecen intactos.
- Variables CSS base: azul `#2563EB`, azul oscuro `#1E3A8A`, violeta `#7C3AED`, fondo
  `#F8FAFC` y texto `#0F172A`. Verde `#10B981` como token de marca; se conserva el
  verde semántico oscuro para texto accesible. No se rediseñan las paletas de cada perfil.
- Símbolo **provisional** E/flecha en `mark.svg`, sin alterar su ruta. Original
  conservado en `assets/images/branding/legacy-mark.svg`. PNG propios de 192 y 512 px,
  generados sin dependencias ni descargas por `tools/edunext-icons.cjs`.
- Manifiesto: nombre «EDUNEXT — Plataforma Educativa», nombre corto «EDUNEXT»,
  descripción e iconos actualizados. `id`, `start_url`, `scope`, idioma y display
  conservados. SW cambia solo un comentario para detectar actualización normal;
  no utiliza `skipWaiting`, no purga cachés y conserva toda su política de seguridad.

## Identificadores preservados por compatibilidad

| Ámbito | Identificadores / motivo |
|---|---|
| IndexedDB | `aithron-edu`, `aithron-evaluations-demo`, versiones, stores y `openAithronDb`; no perder registros |
| Cachés | `aithron-static-v1/v2`, `aithron-content-v1`, `aithron-public-v2`, `aithron-monitor-shell-v1`; no borrar preparación previa |
| Preferencias y sesión | Claves `aithron.*`, evento `aithron-preferences-change`, canal `aithron-demo-monitor-data`, lock `aithron-sync-v1:*` |
| Configuración | `AITHRON_CONFIG`, `AITHRON_AI_ENABLED`, `AITHRON_FINAL_VALIDATION` y demás variables de herramientas |
| API y seguridad | `/api/v1`, cookies y CSRF, campo `athron_ai`, clases `AithronException`, issuer `aithron-edu`, audience `aithron-edu-web` |
| Operación | Nombres de paquetes, archivos/rutas históricas, rutas de storage, health service, logs, imágenes Docker, redes, volúmenes, entornos y bases |
| Externos | Correos/dominios de ejemplo y rutas heredadas de scripts; no crear ni renombrar repositorios, dominios o cuentas |

No fue necesaria ninguna migración Alembic, de IndexedDB ni de datos. El nombre
predeterminado de institución del script administrativo histórico se conserva para
no confundir identidad del producto con datos institucionales. No se ejecutó ese script.
Los nombres de archivos de arquitectura que contienen AITHRON se conservan para no
romper enlaces. El historial del README explica las fases bajo su nombre original.

## Verificación

Evidencia nueva, nunca sustituyendo resultados históricos:

- `edunext-brand-source-20261029-04/EDUNEXT_BRAND_VALIDATION.json`: nueve controles
  de fuente, sintaxis, enlaces HTML, manifiesto, hashes históricos y compatibilidad
  satisfactorios. Revisión de 707 archivos frontend de texto. Lista completa de
  archivos modificados y coincidencias restantes con clasificación en el JSON.
- `edunext-brand-browser-20261029-03/FRONTEND_REFRESH_BROWSER.json`: 194 controles
  satisfactorios en Edge real y perfil desechable; vistas públicas demo a 320, 768
  y 1.440 px, imágenes, navegación y marcas visibles. Selector sin sesión redirige
  al login. Actualización del worker anterior al actual conserva scope, metadato
  IndexedDB sintético, borrador y operación pendiente sintéticos, clave local y caché
  sintéticos. Icono PNG decodifica. Validación cliente de campos vacíos de login pasa.
- Regresión de sesiones, cliente API y políticas SW: satisfactoria en su alcance
  limitado de fixtures/VM/loopback. Contratos de infraestructura: diez satisfactorios.
- Generador de guía offline: satisfactorio, sin datos personales ni IA generativa.
- Aceptación documental/contratos anterior: siete controles satisfactorios tras
  crear este informe; conserva los 28 requisitos funcionales parciales/bloqueados.
  Evidencia en `edunext-brand-regression-20261029-02/HANDOVER_ACCEPTANCE.json`.
- Python: sintaxis AST satisfactoria. Construcción de FastAPI/OpenAPI/ASGI bloqueada
  por `ImportError` en `app.schemas.assessment`, al cargar `endpoints/assessments.py`.
  Esos módulos no se modificaron en esta migración. No se ejecutó la suite ASGI ni
  el lifespan de arranque: no se considera aprobado el inicio de FastAPI.
  Evidencia: `edunext-brand-backend-20261029-03/EDUNEXT_BACKEND_VALIDATION.json`.

Una primera ejecución del nuevo verificador tuvo errores de resolución de enlaces
y expectativa del selector sin sesión; se corrigieron las pruebas, no se debilitó
la autenticación. Sus evidencias fallidas se conservan con sufijo `01`.
El primer runner Python también falló al limpiar su directorio temporal activo en
Windows; se corrigió la limpieza y se registró el bloqueo de importación real.

| Verificación solicitada | Alcance real |
|---|---|
| Marca, mensajes y módulos | Fuente frontend completa; muestra ejecutada de 29 vistas públicas |
| Login y perfiles | Validación vacía y rechazo sin sesión; no login PostgreSQL |
| Navegación y recursos | Enlaces HTML existentes y navegación demo; no todos los flujos autenticados |
| Estilos y Android | Viewports 320/768/1440 sin desbordamiento en la muestra; no Android físico |
| PWA instalada | Manifiesto y lifecycle de worker pasan; instalación real pendiente |
| IndexedDB, borradores y cola | Persistencia de fixtures sintéticas tras actualizar worker; no datos reales |
| Seguridad SW | Nueve políticas VM previas pasan; fuente del worker equivalente |
| API y arranque | Identificadores conservados; arranque bloqueado por importación preexistente |
| Sintaxis | JS frontend y AST Python satisfactorios |
| Separación entre cuentas | No certificada; regresión de sesión simulada pasa, no prueba dos cuentas reales |
| Suite existente completa | Solo subconjunto pertinente ejecutado; no se declara aprobación integral |

## Límites y publicación

Pendientes: instalación/actualización de una PWA **instalada** en Android/iOS físico,
autenticación y persistencia PostgreSQL reales, aislamiento de cuentas real, entrega
de operaciones pendientes, descarga/apertura en dispositivos, revisión pedagógica,
licencias/identidad definitiva y gates de seguridad anteriores. Las pruebas sintéticas
no certifican datos privados offline ni sincronización operativa.

No se activó IA, se descargaron modelos, se usó micrófono ni se contrataron servicios.
La integración futura de modelos locales en Android con 6 GB de RAM no se elimina,
pero su viabilidad y rendimiento **no están verificados** por este cambio de marca.

No publicar todavía. Revisar el logotipo provisional y la disponibilidad legal del
nombre, validar los gates y probar dispositivos antes de preparar un candidato
nuevo autorizado. El manifiesto congelado anterior no se reescribe: sus hashes ya
no describen esta fuente modificada. No se hizo push, release o despliegue.
Si una configuración privada o desplegada define explícitamente `APP_NAME` con la
marca anterior, su operador deberá revisarla sin compartir secretos. No se cambia
esa configuración automáticamente ni se renombra el directorio de trabajo.
