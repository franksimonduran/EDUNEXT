# Autenticación y sesiones

## Continuación 2026-10-27

Se ejecutaron pruebas reales de funciones criptográficas con fixtures: hash Argon2id,
verificación correcta/incorrecta, firma CSRF y manipulación, JWT caducado/algoritmo
distinto/emisor/audiencia. Decode ahora exige aud/iss/exp/iat/nbf: se reprodujeron
cuatro omisiones aceptadas antes del cambio, corregidas sin cambiar el emisor.
Los tokens que crea `create_access_token` ya incluyen estas claims.

Limiter ahora tiene cota 4.096, reloj monotónico, limpieza de expirados, RLock y
claves HMAC; no cambia el umbral de intentos configurado. Saturación rechaza claves
nuevas en vez de borrar contadores activos. Sigue por proceso: no hay coordinación
distribuida ni protección completa contra ataque repartido en cuentas/IP.

No se certifican login/sesión/rotación/logout con PostgreSQL, cookies reales entre
pestañas o revocación. Avisos python-jose/ecdsa requieren revisión explícita.
No se desactivaron CSRF/RBAC ni se editaron secretos del operador.

## Registro histórico

Revisión de security.py, dependencies/auth.py, auth_service.py, router auth, cliente y configuración. Argon2id previsto: time_cost=3, memory_cost=65536, parallelism=4; hay fallback bcrypt si falta Argon2. Refresh aleatorio se persiste como SHA-256; JWT valida issuer/audience/exp y dependencia consulta sesión/usuario activo. Roles/permisos se resuelven en DB, no solo claims editables.

Cookies refresh HttpOnly y path de refresh; CSRF firmado y comparación constante; Secure/SameSite configurables. No se elimina CSRF. Producción ahora rechaza cookie insegura/DEBUG/defaults; runtime no verificado. CORS mantiene credenciales y orígenes explícitos, rechaza `*` en configuración y expone metadatos técnicos.

Rotación ahora bloquea fila del token. Reutilización ya revocaba sesión; carrera real/lock de sesión simultáneo a logout y múltiples pestañas pendientes. Logout cliente invalida respuestas anteriores, espera refresh y trata de revocar con renovación si procede; no certifica revocación remota al fallar la red.

Credenciales inválidas/desactivadas/bloqueadas responden mensaje genérico; dummy hash reduce diferencia obvia, no demuestra timing uniforme. Limiter es por proceso/IP+identificador, no control distribuido; memoria sin cota global pendiente. Recuperación y autorregistro no operativos: no se inventa correo/token.

Pruebas disponibles: phase47-api/phase48-session simuladas aprobadas; revocación/JWT/CSRF/cookies/login real con PostgreSQL **no ejecutados**. No hay tokens nuevos en localStorage, IDB ni SW; access/CSRF permanecen en sessionStorage existente, expuesto a XSS en mismo origen.
