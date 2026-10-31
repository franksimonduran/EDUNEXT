# Navegadores realmente probados

| Navegador | Plataforma / modo | Alcance / resultado |
|---|---|---|
| Edge 156.0.4314.42 | Windows, headless CDP | Login estático, 4 tamaños, validación vacía y Tab: PASS |
| Chrome 156.0.8078.48 | Windows, headless CDP | Mismo alcance: PASS |
| Firefox | Ejecutable no localizado en ruta habitual | No probado |
| Safari/iOS/Android físicos | Sin entorno utilizado | No probado |

Viewports: 320×720, 375×812, 768×1024, 1440×900; son emulación de ancho de escritorio, no compatibilidad móvil física. Sin excepciones Runtime observadas. No se capturaron todos los mensajes de consola/red, ni se certifican todas las páginas.

No probado: instalación/actualización PWA, login real, backend, audio/micrófono, almacenamiento offline real, zoom y orientación táctil. Perfiles temporales nuevos en ruta aprobada; no se tocó perfil personal ni se ingresaron credenciales.

Artefacto reproducible: `node tests/phase48-browser.cjs`, genera PHASE_48_BROWSER_EVIDENCE.json. Solo usa ejecutables locales encontrados; no instala navegador ni paquete.
