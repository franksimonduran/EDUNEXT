# EDUNEXT DEMO — Etapa D4: PWA y recursos offline
Fecha: 2026-11-05. Alcance exclusivo: **demostración pública sintética**.

## Copia de seguridad
La rama `backup-main-before-d4-2026-11-05` conserva exactamente el `main`
previo a D4. La implementación se revisa en `feature/edunext-demo-d4`
antes de integrarse.

## Funcionalidad incorporada
- `frontend/offline-demo.html`: centro con estado de conectividad declarado
  por el navegador, Service Worker, uso estimado y recursos realmente
  presentes; botones **Preparar toda la demo**, **Preparar/Verificar** paquete,
  **Verificar de nuevo**, **Descargar guía** y **Solicitar persistencia**.
- `frontend/js/demo/offline-packages.js`: manifiesto explícito de cinco
  paquetes: base, lectura, progreso de tres perfiles, tutor/traductor/pronuncia
  y guía HTML. Origen, ruta, extensiones, respuestas HTTP y disponibilidad
  validados. Preparación solo mediante acción voluntaria del usuario;
  descarga `credentials:'omit'`. Se rechazan respuestas privadas, no-store,
  opacas, redirigidas o de tipo erróneo. No se declara preparado hasta comprobar
  todos los recursos.
- `frontend/js/demo/offline-status.js`: interfaz de estado y acciones
  reales; módulo opcional de guía basado en
  `frontend/js/services/offline-study.service.js`, sin conversaciones,
  historial ni datos personales.
- `frontend/js/demo/offline-entry.js`: registra el SW existente
  respetando su scope. Los paquetes **no** se descargan automáticamente.
- `frontend/sw.js`: reutiliza el mismo worker y sus cachés preexistentes.
  Nueva caché aislada `edunext-demo-offline-v1` solo para recursos
  públicos D1–D4. La navegación HTML offline consulta esa caché únicamente
  para la allowlist D4, sin ampliar las páginas privadas o API; preserva los
  comportamientos preexistentes y NO borra otras cachés.
- `frontend/demo.html`: acceso al centro y registro SW.
- `frontend/offline.html`: mensaje y enlaces relativos compatibles con
  `/EDUNEXT/` en GitHub Pages, sin mostrar API privada.
- `tools/demo-server.cjs`: cabeceras cacheables **solo** para recursos
  públicos explícitos de la demo; el resto continúa siendo no-store.
- `frontend/demo.webmanifest`: permanece aislado del manifiesto del sistema.

## Recorrido verificable
1. Abrir `demo.html` o `offline-demo.html` bajo HTTPS o localhost.
2. Con conexión, pulsar `Preparar toda la demo` y comprobar **5/5**.
3. Cortar red desde navegador (DevTools Network → Offline) y RECARGAR.
4. Abrir `student/recorrido-demo.html`, resolver las cinco preguntas y
   consultar `student/progreso-demo.html`.
5. Cambiar a `monitor/seguimiento-demo.html` y
   `admin/informe-demo.html` dentro del mismo navegador/origen.
6. Abrir las páginas D3 de Tutor guiado, Translate y Pronuncia (solo
   ejercicio escrito; síntesis de voz depende de voces instaladas).
7. Regresar a `offline-demo.html`: los paquetes deben seguir verificados.

## Límites importantes
- **No** se declaran offline los dashboards completos heredados ni todas
  las pantallas de EDUNEXT. La ruta completa verificada es el recorrido
  público guiado de D1–D4 y sus informes de muestra.
- La puntuación y los puntos se guardan en el localStorage ficticio ya
  existente. No se sincronizan entre navegadores ni dispositivos.
- API autenticada, altas reales, calificaciones oficiales, evaluaciones,
  usuarios, sincronización multiinstitucional y modelos MiniCPM/Argos NO
  funcionan mediante esta demo.
- El almacenamiento puede ser borrado por el navegador; la persistencia
  se solicita solo cuando el usuario pulsa el botón y no está garantizada.
- Las actualizaciones de recursos requieren revisar la política de
  versión: no se borran cachés anteriores de forma automática.
- Al preparar recursos de la web es preciso HTTPS o localhost. Una guía
  HTML descargada puede abrirse independientemente del sitio.

## Pruebas
```powershell
node tests/demo-d4.mjs
node tests/offline-pwa.cjs
node tools/demo-d4-offline.cjs
```
La prueba con navegador requiere Chrome/Edge y `DEMO_BROWSER` configurado
cuando no está en rutas típicas. Reproduce la desconexión con CDP, verifica
la recarga, interacciones de los tres perfiles, Tutor, Translate, Pronuncia,
la caché de la demo y que las API no reciben fallbacks privados.
También se ejecutan las suites D1/D2/D3 previas.

## GitHub Pages
Se despliega **solo** `frontend/` desde `main` mediante
`.github/workflows/deploy-demo-pages.yml`. En la ruta
`https://franksimonduran.github.io/EDUNEXT/`, la base se determina
relativamente, sin rutas raíz hardcodeadas en los nuevos paquetes.
No declarar el sitio actualizado hasta confirmar que el workflow termina
correctamente, y no asumir que el comportamiento offline ha sido ensayado
desde un móvil real o desde todos los navegadores.

## Próxima etapa
**D5: calidad visual, accesibilidad y rendimiento del frontend.**
