# Service Worker conservado

No se modifica ni duplica `frontend/sw.js`. Namespaces públicos v2, fallback offline
con 503, exclusión de API/bearer y no interceptación de POST/PATCH permanecen.
Cachés heredadas no se consultan; no se borran por esta intervención.

Nueve comprobaciones de política SW con VM pasan de nuevo. No prueban instalación,
actualización, móvil ni dispositivos compartidos reales. App shell privado no se
amplió por conveniencia: no hay permiso para servir datos privados de otra cuenta.
Sin Background Sync y sin promesa de ejecución con navegador cerrado.
