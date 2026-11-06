# EDUNEXT DEMO — D5: calidad visual, accesibilidad y experiencia
**Fecha:** 2026-11-05  
**Alcance:** demostración pública sin datos personales ni backend.  
**Respaldo:** `backup-main-before-d5-2026-11-05`.

## Resumen de cambios

- Estilos unificados en `frontend/css/pages/demo-polish-d5.css`: tokens de presentación, superficies y tarjetas uniformes, accesos táctiles más amplios, foco visible, tipografía adaptable, estados de botones y soporte de movimiento reducido.
- Capa D5 aplicada al HTML de **14 vistas** del recorrido: portada, centro offline, práctica, progreso, seguimiento docente, informe institucional, tres herramientas del estudiante, dos vistas informativas y los tres dashboards heredados.
- `frontend/js/demo/activity.js`: foco trasladado al título de la siguiente pregunta o del resultado, navegación directa hacia progreso/seguimiento/informe de muestra; los cálculos ficticios y la lógica de puntuación siguen intactos.
- `frontend/js/demo/ai-tools.js`: la búsqueda exacta del diccionario admite Enter, sin crear llamadas remotas.
- `frontend/demo.html`: el enlace «Ir al contenido» ahora apunta al `main` real y las advertencias distinguen el recorrido offline preparado del sistema académico completo.
- `frontend/js/demo/offline-packages.js` y `frontend/sw.js`: versión `edunext-demo-offline-v2` e incorporación explícita del nuevo CSS público, sin borrar la caché v1, IndexedDB, resultados locales ni datos ajenos.
- `tools/demo-server.cjs`: permite preparar exclusivamente la nueva hoja CSS pública cuando se usa el servidor local.

## Revisión y pruebas

- `node tests/demo-d5.mjs`: 14 páginas, rutas, foco estructural, hoja D5 como última capa de estilos, registro de idioma y versión de caché.
- `node tools/demo-d5-visual.cjs`: **98 comprobaciones de páginas** = 14 rutas × 7 anchuras (320, 360, 390, 768, 1024, 1280, 1440 píxeles), en Chrome headless. Prueba overflow, errores JS, respuestas HTTP fallidas, salto al contenido, título H1, idioma, CSS, carga de imágenes y texto. Comprueba también el foco de la práctica y la consulta del traductor por Enter.
- El script guarda **12 capturas de viewport** y `D5_REPORT.json` como artefactos del workflow `.github/workflows/demo-d5-visual.yml`, con duración de carga del DOM como observación descriptiva.
- `node tools/demo-d4-offline.cjs`: regresión real: descargar cinco paquetes, cerrar servidor de origen, desactivar red y navegar por los recorridos D1–D4.
- `node tools/demo-smoke.cjs`: regresión de navegación del monitor, tres roles y herramientas D3.
- CI original conserva pruebas de frontend y backend; Pages exige la nueva prueba de estructura antes de publicar.

## Cómo probar la demo

```powershell
node tools/demo-server.cjs
```

Abrir `http://127.0.0.1:8080/demo.html`. Para comprobar la versión D5 offline: abrir `offline-demo.html`, **preparar nuevamente los cinco paquetes** y verificar 5/5. La caché v1 se conserva, pero no se considera certificada para servir el diseño D5 nuevo.

Sitio previsto después del despliegue: `https://franksimonduran.github.io/EDUNEXT/`.

## Límites explícitos

- Se pulen recorridos principales y tres dashboards. **No** se afirma haber rediseñado ni auditado todas las páginas heredadas de los tres roles.
- El navegador headless a anchuras predefinidas es una emulación de escritorio; no sustituye pruebas manuales en Android, iOS, lectores de pantalla o dispositivos escolares reales.
- La auditoría D5 es una **comprobación automatizada parcial**, no una certificación de WCAG 2.2 AA.
- Se recopilan tiempos observados de `DOMContentLoaded`, pero **no** se han obtenido puntuaciones Lighthouse ni una comparación cuantitativa antes/después. Las metas LCP, CLS y Lighthouse requerirán un entorno de medición estandarizado.
- No se certifican IA generativa real, Argos en Pages, voz evaluada automáticamente, autenticación, backend académico, sincronización remota o producción.
- No se cambia la visibilidad del repositorio ni se crean cuentas o datos reales.
- Antes de presentar en un navegador con cachés previas, volver a preparar los recursos tras el despliegue y verificar el modo offline.

## Etapa siguiente

D6 — ensayo completo, verificación final de GitHub Pages, documentación de límites y presentación al jurado.
