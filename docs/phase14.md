# FASE 14 - Sistema Offline-First, Descargas Educativas y AITHRON SYNC

## Objetivo
Implementar infraestructura offline-first: Service Worker, Cache Storage, IndexedDB (esquema unificado), gestor de descargas, verificación de recursos, Centro de Descargas, Mis Descargas, Estado Offline, AITHRON SYNC, Cola de Sincronización, Almacenamiento Local. Preparado para futura integración con FastAPI sin enviar datos.

## Creado/Adaptado

### Infraestructura offline
- `frontend/js/offline/database-schema.js` (esquema IndexedDB: contentPackages, courses, units, lessons, practices, practiceAttempts, evaluationDrafts, learningProgress, vocabulary, syncQueue, syncMetadata, storageMetadata)
- `frontend/js/offline/database.js` (helpers getAll/get/put/del)
- `frontend/js/offline/package-manager.js` (gestión paquetes descargados)
- `frontend/js/offline/cache-manager.js` (Cache Storage)
- `frontend/js/offline/download-manager.js` (descarga con progreso, verificación básica)
- `frontend/js/offline/connectivity.js` (online/offline)
- `frontend/js/offline/storage-manager.js` (estimate/persist)
- `frontend/js/offline/sync-queue.js` (cola de operaciones, idempotencia)
- `frontend/js/offline/pwa.js` (registro SW)
- `frontend/js/offline/bootstrap.js`
- `frontend/sw.js` (Service Worker con estrategias cache-first/navegación con fallback offline.html)

### Datos
- `frontend/js/data/offline-packages.data.js` (catálogo demostrativo)

### Utilidades
- `frontend/js/utils/storage-format.js`

### Componentes/Servicios
- (integrados en js/student)

### CSS
- `frontend/css/student/downloads.css`

### Pantallas
- `frontend/student/descargas.html`
- `frontend/student/mis-descargas.html`
- `frontend/student/estado-offline.html`
- `frontend/student/sincronizacion.html`
- `frontend/student/cola-sincronizacion.html`
- `frontend/student/almacenamiento.html`

### JS
- `frontend/js/student/downloads.js`
- `frontend/js/student/downloaded-content.js`
- `frontend/js/student/offline-status.js`
- `frontend/js/student/synchronization.js`
- `frontend/js/student/sync-queue.js`
- `frontend/js/student/storage-management.js`

## Integración
- Sidebar: añadido acceso a Descargas
- Rutas: `learning-routes.js` con rutas offline/sync
- Dashboard/index: bootstrap SW
- Reutiliza evaluación-draft-store existente

## Notas
- No envía datos reales a servidor. Botón Sincronizar deshabilitado/indicando pendiente.
- Descargas verifican recursos; marcados como descargados tras verificación.
- Datos académicos y borradores no se eliminan al quitar paquetes.
- Funciona con servidor local (http://127.0.0.1:8088) sobre frontend.
