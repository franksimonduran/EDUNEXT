# EDUNEXT DEMO — publicación estática con GitHub Pages

## Alcance y límites

Esta configuración publica **solo `frontend/`** del repositorio `franksimonduran/EDUNEXT`.
No publica `backend/`, `docs/`, `infra/`, pruebas, PostgreSQL, secretos o endpoints FastAPI.

El sitio es una **demostración** con datos sintéticos, sin inicio de sesión real ni permisos efectivos.
No introducir datos personales. IA generativa, micrófono y sincronización remota no se
declaran operativos por el mero hecho de publicar los archivos. GitHub Pages no ejecuta Python.

## Configuración inicial en GitHub

1. Revisar este cambio en el pull request correspondiente y resolver el requisito de visibilidad:
   con GitHub Free, Pages requiere repositorio **público**; en planes compatibles
   GitHub Pages puede activarse desde un repositorio privado, pero el sitio publicado
   normalmente es público. Cambiar visibilidad expone también el código fuente del repositorio:
   hacerlo solo tras revisar secretos, licencias, derechos y datos.
2. Abrir **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. Integrar el pull request en `main`. El workflow
   `.github/workflows/deploy-demo-pages.yml` se ejecutará con el cambio.
4. Abrir **Actions → EDUNEXT — demo GitHub Pages** y verificar que la ejecución
   haya terminado correctamente (sin suponer éxito por haber creado el workflow).
5. Abrir **Settings → Pages** para conocer la URL publicada. La URL típica
   para un repositorio de proyecto, si la publicación se completó, es
   `https://franksimonduran.github.io/EDUNEXT/`.

## Navegación

- La raíz `/` del sitio usa `frontend/index.html` para entrar a `demo.html`.
- `demo.html` ofrece Estudiante, Monitor y Administrador con navegación relativa.
- Algunas pantallas heredadas pueden solicitar `/api/v1` y fallar sin backend.
  Por eso el recorrido oficial es el enlace **Explorar demo**, no el formulario
  de inicio de sesión real.
- El servidor local `node tools/demo-server.cjs` tiene alias de assets que
  GitHub Pages no ofrece. Probar referencias de marca, imágenes y rutas en el sitio
  publicado antes de la presentación.
- Service Worker / manifiesto PWA en una ruta `/EDUNEXT/` requieren validación
  específica. No se afirma instalación u operación offline completa.

## Comprobación y reversión

- Validar en navegador de escritorio y móvil la entrada de la demo, imágenes, JS,
  CSS, perfiles y recorridos críticos.
- Verificar la consola de navegador y la pestaña Network para errores 404 y
  llamadas inesperadas a `/api/`.
- Para detener la publicación, deshabilitar GitHub Pages desde Settings → Pages
  (no equivale a borrar contenido indexado o copias). No borrar caches o datos del
  usuario como "reversión".
- Mantener la documentación histórica de producción: **EDUNEXT NO-GO** para uso
  institucional o piloto con menores sigue vigente.

## Referencias

- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
