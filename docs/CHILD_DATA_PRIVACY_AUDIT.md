# Privacidad de menores

> Continuación 2026-10-27: tests criptográficos/archivos sintéticos y ASGI ejecutados,
> sin datos reales, DB o voz. Claves internas del limiter ahora HMAC sin identificador/IP
> legibles y con expiración/cota; no constituye anonimización formal o cifrado local.
> Para SCA solo se consultaron nombres/versiones de paquetes en PyPI. Sin envío de
> mensajes, archivos, credenciales o expedientes. Informe actualizado en
> PHASE_48_CONTINUATION_2026-10-27.md; no certificación legal.

Solo se usaron tokens y payloads ficticios de fixtures. No se conectó BD, grabó voz, envió conversación a terceros ni accedió a expedientes reales. El escáner no imprime valores de credenciales y excluye `.env`; no equivale a secret scan completo.

Mejoras: no-store en respuestas API, SW público sin caché de HTML dinámico, logs de excepción por clase sin SQL echo, request IDs acotados, descarga no simula archivo ni devuelve ruta en ese endpoint. `.gitignore` protege futuros archivos locales, no sanea historial inexistente/no accesible.

Riesgos abiertos: caches viejas conservadas, accesos directos a IDB/Cache Storage en otros módulos, permisos genéricos de contenido, respuestas ResourceRead y exportaciones sin pruebas reales de minimización, sessionStorage accesible a XSS, snapshots/backups/logs externos. No se borró trabajo para aparentar aislamiento.

Retención/eliminación efectiva no certificadas. AI usa adaptador local en código, pero egress/host/modelo no verificados; audio/voz real y evaluación pedagógica bloqueados. No se concluye que todos los recursos tengan licencia verificada.

Requiere revisión especializada: fundamento/autorización del tratamiento de menores, avisos comprensibles, derechos y retención, roles institucionales/encargados, transferencias/proveedores y obligaciones peruanas aplicables. Este documento **no certifica cumplimiento legal**.
