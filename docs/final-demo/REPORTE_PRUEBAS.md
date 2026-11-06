# EDUNEXT DEMO — Reporte de pruebas D6

**Corte técnico:** 5 de noviembre de 2026 (hora de Perú; ejecuciones de GitHub pueden registrar UTC del 6 de noviembre).
**Alcance:** recorrido público sintético de EDUNEXT, no autorización institucional.

## Resultados confirmados

| Bloque | Resultado | Ejecución |
|---|---|---|
| Contratos y reglas D1–D6 | PASS | [D6 final](https://github.com/franksimonduran/EDUNEXT/actions/runs/42160957591) |
| Puntuaciones 0/60/80/100, 14 rutas, cinco paquetes y seis documentos | PASS | [D6 final](https://github.com/franksimonduran/EDUNEXT/actions/runs/42160957591) |
| Recarga offline sin servidor de origen y consultas de tres perfiles | PASS, 13 comprobaciones | [D6 final](https://github.com/franksimonduran/EDUNEXT/actions/runs/42160957591) |
| Privacidad: API con autorización no responde desde caché pública | PASS | [D6 final](https://github.com/franksimonduran/EDUNEXT/actions/runs/42160957591) |
| Pantallas prioritarias: 14 rutas × 7 anchuras | PASS, 98 mediciones de página | [D6 final](https://github.com/franksimonduran/EDUNEXT/actions/runs/42160957591) |
| Dos interacciones adicionales con teclado | PASS | [D6 final](https://github.com/franksimonduran/EDUNEXT/actions/runs/42160957591) |
| Publicación Pages y nueve rutas públicas por HTTP | PASS | [Publicación](https://github.com/franksimonduran/EDUNEXT/actions/runs/42160988387) |

La prueba de navegador de D6 reutiliza los ensayos D4/D5. Los porcentajes 60 % y 80 % se verifican mediante pruebas deterministas de JavaScript; la navegación completa en Chrome con un resultado del 100 % se verifica en el ensayo D4. **No se afirma haber ejecutado los tres porcentajes como tres sesiones E2E independientes.**

## Cómo repetir las pruebas

```powershell
node tests/demo-presentation.mjs
node tests/demo-d2.mjs
node tests/demo-d3.mjs
node tests/demo-d4.mjs
node tests/demo-d5.mjs
node tests/demo-d6.mjs
node tools/demo-d6-acceptance.cjs
```

La aceptación con Chrome requiere `DEMO_BROWSER` en entornos sin Chrome/Edge localizable automáticamente. Las evidencias visuales y JSON están adjuntas al workflow D6.

## Pendientes fuera del cierre de demostración

No se ejecutó una auditoría WCAG 2.2 AA manual completa, Lighthouse estandarizado ni pruebas en móviles físicos. La lectura pública por HTTP está verificada desde GitHub Actions; la inspección visual pública independiente del sitio no está certificada por este reporte. Las comprobaciones de producción real (backend, autorizaciones, sincronización, privacidad con menores) mantienen NO-GO.

## Conclusión

**Aprobación técnica automatizada de la demostración pública D6** en las condiciones medidas. No equivale a liberar el sistema académico para uso institucional.
