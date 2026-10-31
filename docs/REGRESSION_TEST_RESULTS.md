# Regresión ejecutada

Comando: `node tools/run-phase48-regression.cjs`. Genera PHASE_48_REGRESSION_EVIDENCE.json con stdout, salida y tiempo real por suite; esos tiempos no son latencia de la aplicación.

- phase47-api.cjs: transporte simulado, refresh concurrente, errores HTTP, red, timeout, configuración y fallo cerrado de login.
- phase48-security.cjs: política SW en VM; suite ampliada a nueve comprobaciones, incluyendo no-store/bearer/rutas privadas/Vary/query/cuota.
- phase48-resilience.cjs: HTTP loopback real; cuerpo lento/cancelación/403 y validación de download.
- phase48-session.cjs: transporte simulado; contexto viejo y refresh/logout.
- Sintaxis: sw.js, auth.service.js y config.js mediante Node --input-type=module --check.
- Por separado: phase48-browser.cjs, login estático en Edge/Chrome, PASS (JSON propio).

Resultado de las últimas ejecuciones: consultar JSON, no extrapolar a suite completa. Las suites de navegador históricas dependen de Python/Playwright/rutas anteriores y no se ejecutaron. Pytest/BD/Alembic tampoco. No se deshabilitó ninguna prueba para obtener verde.

Antes/después SW: prueba inicial de seis checks falló en cuatro; tras corregir pasó y se añadieron tres checks. Los nueve checks finales no se presentaron como nueve reproducciones iniciales.
