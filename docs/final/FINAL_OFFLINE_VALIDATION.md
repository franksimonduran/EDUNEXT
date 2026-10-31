# Validación offline — parcial, no aceptada

Comprobación disponible: política del SW en VM (`tests/phase48-security.cjs`) y fallback preparado en VM (`tests/offline-pwa.cjs`, 16 casos): shells docentes y student permitidas, query, rutas no preparadas, API/privadas/bearer, activos públicos, no-store, cuota y fallo de CacheStorage. No prueba navegador real, IndexedDB multicuenta, instalación/actualización, paquete/checksum, persistencia tras cierre, envío/recibo/idempotencia o recuperación Sync.

Se puede abrir sin red una shell previamente preparada de `monitor/*.html`, `admin/*.html` o de las cinco páginas student (`leccion`, `tutor`, `palabra`, `juego`, `ejercicio`). `prepareStaticResources` valida origen, allowlist, respuesta cacheable, HTML y activos referenciados; `no-cache` se acepta porque nginx lo usa para estáticos, mientras `private`/`no-store` se rechazan. El fallback `offline.html` se sirve con estado 503 para navegaciones no disponibles.

El centro de descargas `aithron-content-v1` queda fuera de este alcance y el SW no lo consulta. Abrir una shell no garantiza contenido, audio, evaluaciones, tareas ni APIs disponibles; no afirmar que toda lección funciona sin red. La prueba de navegador real `tests/phase31.cjs` no se ejecutó por ausencia de Playwright.

Stores locales/demo existentes no son motor servidor. SW no se reemplaza ni se borran caches/pedientes. Cachés antiguas y consumidores locales sin aislamiento certificado; nuevo SW restringe uso público. La evidencia histórica de marca se conservó y la nueva baseline revisada no regenera el manifiesto congelado.

Casos R24/R25 y escenario A→B→A permanecen bloqueados. No aprobar si respuestas se pierden/duplican, datos cruzan cuentas, paquete parcial se confirma o nota se altera. No repetir envíos a ciegas ni purgar para ocultar error. [Guía](../manuals/OFFLINE_AND_SYNC_GUIDE.md).
