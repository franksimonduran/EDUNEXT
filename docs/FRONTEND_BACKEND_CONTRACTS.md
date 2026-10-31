# Contratos — Fase 47

## Continuación 2026-10-27

- Se conserva `apiRequest`; se añade `onAuthenticationCleared(listener)` para
  desmontar vistas privadas al cambiar/cerrar sesión sin borrar IDB/borradores.
  La notificación puede repetirse; las limpiezas deben ser idempotentes.
- Reportes API enlaza a `vista=insights`; usa mismo perfil/contexto y permisos Reports.
  Rutas/limitaciones en `INSIGHTS_API.md`; no crea acciones docentes ni notas.
- Sync mantiene contrato V1 de `SYNC_SERVER_API.md`, gate deshabilitado y precondiciones
  de cuenta/institución. No se habilita envío por el hecho de integrar la pantalla.
- Recursos de lección POST/DELETE se registran únicamente en `lessons.router`;
  URLs y schemas activos no cambian. Se eliminaron registros duplicados que hacían
  que OpenAPI mostrara otro handler para la misma ruta.
- OpenAPI real generado: 198 paths. No equivale a endpoints probados con PostgreSQL.
- Timeout del cliente actual incluye lectura del cuerpo; la observación histórica
  inferior sobre timeout limitado a cabeceras no describe el código vigente.

Ver evidencias y entorno en `PHASE_47_CONTINUATION_2026-10-27.md`.

## Cliente único existente

Se consolida `frontend/js/services/auth.service.js`; no se agrega otro cliente. `apiRequest` recibe ruta relativa (`/…`), método, JSON, headers, signal, timeoutMs y responseType. Prohíbe rutas `//` y barras invertidas. Conserva headers de idempotencia al repetir después de 401; no reintenta mutaciones por error de red.

Base por defecto: `/api/v1` del mismo origen. Para servidores separados, el anfitrión debe definir `globalThis.AITHRON_CONFIG = {apiBaseUrl: '…'}` **antes** de cargar módulos. Configuración pública, sin secretos. No se ha agregado un proxy ni probado un servidor integrado. Las antiguas pruebas de navegador que interceptan localhost:8000 necesitan configurar explícitamente esa base mediante addInitScript.

## Auth

POST `/auth/login`: `{identifier,password}` → access_token, csrf_token y cookie refresh HttpOnly; después GET `/auth/me` autoriza perfil. POST `/auth/refresh` usa cookie y X-CSRF-Token, rota tokens; single-flight dentro de una pestaña. POST `/auth/logout` requiere bearer y CSRF. No hay recuperación de contraseña operativa; no se simula correo.

Se mantiene sessionStorage existente para access/CSRF. No se añade localStorage ni IndexedDB de credenciales. No se certifica coordinación de refresh entre pestañas ni cierre con solicitudes pendientes.

## Errores

AuthenticationError mantiene status/code; añade fields para detalle 422, retryAfter y requestId. 401 sesión; 403 permiso; 404 recurso; 409 conflicto; 422 formulario; 429 límite; 500 fallo servidor; 503 indisponibilidad. Los errores no se convierten en arrays vacíos. TIMEOUT es distinto de red inaccesible; signal externo conserva cancelación. El timeout cubre fetch hasta cabeceras, no lectura lenta posterior del cuerpo.

## Datos académicos

UUID y claves deben seguir schemas existentes; no convertir títulos en IDs. Fechas civiles deben conservarse como fechas, instantes según contrato, institución America/Lima en fixtures existentes. No se cambiaron formatos, fórmulas ni niveles AD/A/B/C. Paginación, versiones y estados requieren verificación por módulo: este trabajo no afirma haber unificado todos sus consumidores.

Listado de rutas: INTEGRATION_ENDPOINT_INVENTORY.md. Es extracción estática de decoradores con modelos response cuando se pueden leer; OpenAPI runtime sigue pendiente.
