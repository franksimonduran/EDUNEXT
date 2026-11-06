# Reporte de validación D6

## Base de referencia
D5 integró 14 vistas prioritarias, pruebas de teclado y auditoría visual con 98 observaciones a siete anchuras; D4 confirmó el recorrido offline con el servidor de origen apagado. Los resultados que constan en GitHub Actions deben consultarse por commit.

## Suite de cierre
- `node tests/demo-presentation.mjs`
- `node tests/demo-d2.mjs`
- `node tests/demo-d3.mjs`
- `node tests/demo-d4.mjs`
- `node tests/demo-d5.mjs`
- `node tests/demo-d6.mjs`
- `node tools/demo-d6-acceptance.cjs` (Chrome real)
- `node tools/demo-d4-offline.cjs` (origen desconectado)
- `node tools/demo-d5-visual.cjs` (98 comprobaciones de pantalla)

## Evidencias
GitHub Actions: https://github.com/franksimonduran/EDUNEXT/actions
El workflow D6 adjunta el resultado automatizado de aceptación del navegador y vuelve a exigir los contratos D1–D5. El despliegue de Pages se verifica por separado.

## Pendiente de registro final
Registrar aquí las URLs y conclusiones de las ejecuciones posteriores al último commit D6. No asignar resultados de ejecución inexistentes ni marcar automáticamente una conformidad institucional.
