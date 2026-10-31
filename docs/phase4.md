# Fase 4 — Dashboard del Estudiante

## Abrir el resultado

Desde la raíz del proyecto:

```powershell
python -m http.server 8080 --bind 127.0.0.1 --directory frontend
```

Abrir **http://127.0.0.1:8080/student/index.html**. No necesita npm ni compilación para funcionar. Los módulos requieren HTTP; no abrir mediante `file://`.

## Referencia visual

Se revisó nuevamente `D:\Programing\ATHRON EDU.zip`: no se encontraron `pantallas/06_student_inicio.png`, `lamina_student_01.png` ni referencias responsive. Esta limitación se informó antes de implementar. La pantalla sigue la composición descrita y utiliza la marca, libro ilustrado, paleta, tipografía y variables de las fases anteriores. La fidelidad exacta al mockup queda pendiente de recibir las imágenes.

## Interfaz entregada

- Sidebar azul oscuro con las 14 secciones solicitadas, iconos locales, Inicio activo, hover, foco y botón de contracción. En versión compacta los controles conservan nombre accesible y tooltip nativo.
- Topbar con alias ficticio «Explorador», grado, selector de idioma, señal de conexión, notificaciones y avatar.
- Cuatro tarjetas de resumen: cursos en progreso, lecciones, logros y racha.
- Continuación de Matemática: avance de muestra del 70 % en 5.º y lección «Relaciona fracciones y decimales» dentro de la unidad Decimales.
- Cinco áreas académicas con ilustraciones SVG/CSS, grado, tema, avance, estado «No descargado» y ficha de muestra accesible.
- Progreso general calculado de manera determinista como promedio de los cinco cursos. Barras nativas `progress` con etiquetas accesibles y porcentajes visibles.
- Progreso por curso, lecciones y actividades. Misión con tareas completadas/pendientes y recompensa exclusivamente ilustrativa.
- Actividad reciente y calendario ficticios. Las evaluaciones se representan como próximas; los detalles explican que no están habilitadas y no hay botón para rendirlas.
- Accesos rápidos a Tutor, Translate, Pronuncia, evaluaciones y contenido offline. Las herramientas futuras muestran «Próximamente»; evaluaciones lleva a la agenda del dashboard.
- Notificaciones de muestra y menú de usuario con perfil, idioma, configuración y salida. «Cerrar sesión» informa que no existe una sesión real y ofrece volver al Login.
- Sidebar compacta en tablet, reorganización de columnas y navegación inferior móvil: Inicio, Aprende, Practica, Tutor y Progreso. Las 14 secciones están en el menú de la cabecera en móvil.

## Demostración y datos

`frontend/js/data/student-demo.data.js` contiene perfiles, cursos, estadísticas, misión, actividad, evaluaciones y notificaciones. Los temas de los tres grados son distintos. Los avances no son aleatorios y el grado seleccionado solo cambia el escenario de la visita actual; no modifica un expediente real ni se guarda en el navegador.

`frontend/js/student/i18n.js` proporciona los textos de interfaz en español/inglés, interpolación y selección de idioma en memoria. El cambio actualiza `lang`, títulos, etiquetas, menús, mensajes y contenido de muestra. No usa un traductor externo.

## Arquitectura y archivos nuevos

| Archivo | Responsabilidad |
| --- | --- |
| `frontend/student/index.html` | Estructura semántica y regiones del dashboard. |
| `frontend/css/student/dashboard.css` | Layout, tarjetas, navegación, diálogos y responsive propios del estudiante. |
| `frontend/js/student/dashboard.js` | Coordinación de datos, renderizado, navegación local y paneles. |
| `frontend/js/student/i18n.js` | Diccionarios español/inglés. |
| `frontend/js/data/student-demo.data.js` | Datos demostrativos separados de las plantillas. |
| `frontend/js/components/sidebar.js` | Sidebar, listado de secciones y navegación inferior. |
| `frontend/js/components/topbar.js` | Cabecera y señal de conexión. |
| `frontend/js/components/course-card.js` | Tarjetas de cursos y su estado vacío. |
| `frontend/js/components/progress-card.js` | Resumen y barras de progreso. |
| `frontend/js/components/notification-panel.js` | Notificaciones y estado vacío. |
| `frontend/js/components/icons.js` | Iconografía SVG local común. |
| `frontend/js/components/student-ui.js` | Escape de textos, barras accesibles y estado vacío. |
| `frontend/js/services/student.service.js` | Carga local de muestra y adaptador Fetch futuro. |
| `tests/student-dashboard.browser.cjs` | Pruebas de integración, capturas y auditoría opcional Axe. |
| `docs/phase4.md` | Documentación de esta fase. |

Se reutilizan `variables.css`, `base.css`, `components.css`, recursos gráficos y configuración de rutas existente. No se duplicaron estilos globales ni servicios de autenticación.

Archivos existentes modificados: **solo `README.md` y capturas regeneradas por las suites de regresión**. No se cambió el código de Login, Registro, Recuperación, Reset, Perfiles o sus reglas de autorización.

## Conectividad e integración futura

Se escucha `online`/`offline` y se consulta `navigator.onLine`. La señal es orientativa y no acredita conectividad con FastAPI. No se afirma que se hayan sincronizado actividades.

El aviso offline incluye el texto solicitado y aclara que esta demostración **no tiene contenidos descargados ni soporte offline instalado**. No se implementan IndexedDB, Service Worker, caché de aplicación ni sincronización. La interfaz abierta puede mostrar sus datos de muestra en memoria al desconectar, pero no se promete que pueda recargarse offline.

`loadStudentDemo()` es el único origen de datos utilizado por la página. `fetchStudentDashboard()` queda separado y no se invoca: acepta únicamente una ruta `/api/` del mismo origen, admite `AbortSignal`, comprueba el estado HTTP y prepara la consulta JSON mediante Fetch. Su contrato y validación de respuesta deberán acordarse con el backend antes de activarlo.

No se llama a `navigateAuthenticated()` con roles ficticios. La navegación autenticada de fases anteriores sigue desactivada. El servidor deberá validar sesiones, roles, grado asignado, acceso a cursos, ventanas de evaluaciones y cada operación sensible.

## Estados y accesibilidad

- Carga asíncrona con indicador y `aria-busy`, error con reintento y estados vacíos de componentes.
- Diálogos nativos con título asociado, botones de cierre, Escape, foco contenido y devolución al activador.
- Botones y navegación con teclado; estados con texto, porcentajes y marcas, además del color.
- SVG decorativos acompañados por nombres accesibles.
- Transiciones discretas y respeto de `prefers-reduced-motion`.
- Correcciones de contraste verificadas en contadores, Inicio activo y navegación móvil.

## Verificaciones ejecutadas

Microsoft Edge headless, Playwright y Axe utilizados como herramientas externas al frontend:

1. Carga correcta; cinco cursos, cuatro resúmenes, 14 secciones, cinco accesos rápidos, misión, actividad y evaluaciones presentes.
2. Estadísticas estables tras recargar; cambios de grado 4.º/5.º/6.º con temas correspondientes.
3. Español e inglés a **320, 375, 768, 1024, 1440 y 1920 px**, sin desbordamiento horizontal.
4. Contracción/expansión de sidebar, navegación por secciones y avisos de áreas futuras.
5. Apertura/cierre de notificaciones y perfil; cierre por botón/Escape y retorno del foco.
6. Tab dentro del diálogo, acceso móvil a todas las secciones y saltos a Cursos/Progreso.
7. Cinco fichas de curso, detalles de evaluaciones no habilitadas, configuración pendiente y salida sin sesión ficticia.
8. Cambios de conectividad con el navegador offline/online y aviso de limitaciones.
9. Enlaces y recursos locales HTTP 200; sin peticiones externas o de modificación, errores de consola o JavaScript.
10. Sin datos en LocalStorage, SessionStorage o IndexedDB; sin persistencia de grado o credenciales.
11. Movimiento reducido, error/reintento mediante adaptador de prueba, componentes vacíos y aviso sin JavaScript.
12. Axe: reglas automáticas WCAG A/AA seleccionadas, sin infracciones detectadas en ES/EN a 1440/320 px y en el diálogo de notificaciones. Esto no sustituye una evaluación manual con lectores de pantalla.
13. Regresión de fases 1–3: suites de Login, Registro, Recuperación, Reset, Perfiles y Acceso no autorizado ejecutadas con resultado satisfactorio.
14. Capturas generadas y revisión visual final de escritorio, tablet y móvil.

No se han probado otros motores de navegador, un lector de pantalla físico ni una integración con backend. No existe implementación de autenticación, descarga, sincronización o instalación PWA para probar en esta fase.

### Ejecutar la prueba conservada en el repositorio

Requiere Node.js y Microsoft Edge instalado. Playwright y Axe son herramientas de verificación; pueden instalarse fuera del proyecto:

```powershell
npm install --prefix "$env:TEMP\aithron-ui-tests" playwright @axe-core/playwright --no-save --package-lock=false
$env:PLAYWRIGHT_MODULE = "$env:TEMP\aithron-ui-tests\node_modules\playwright"
$env:AXE_MODULE = "$env:TEMP\aithron-ui-tests\node_modules\@axe-core\playwright"
$env:BASE_URL = "http://127.0.0.1:8080/"
node tests/student-dashboard.browser.cjs
```

Mantener el servidor local abierto en otra terminal. La prueba guarda capturas en `docs/previews/`. Axe es opcional: omitir `AXE_MODULE` para ejecutar solo las pruebas de interacción.

## Capturas

- [Escritorio: primer viewport](previews/student-dashboard-desktop-viewport.png)
- [Escritorio: página completa](previews/student-dashboard-desktop.png)
- [Tablet](previews/student-dashboard-tablet.png)
- [Móvil: primer viewport](previews/student-dashboard-mobile-viewport.png)
- [Móvil: página completa](previews/student-dashboard-mobile.png)
- [Móvil 320 px](previews/student-dashboard-mobile-320.png)
- [Interfaz en inglés](previews/student-dashboard-english.png)

## Pendiente

Recibir mockups originales; conectar datos académicos y perfil autorizado; definir contratos de API; construir páginas completas de cursos y lecciones en sus fases; implementar disponibilidad real de evaluaciones; notificaciones del servidor; acciones reales de perfil/salida; descargas, Service Worker, IndexedDB y sincronización confirmada. No se implementaron dashboards de Monitor/Administrador ni servicios IA, traducción o pronunciación.
