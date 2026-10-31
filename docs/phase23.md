# Fase 23 — Perfil, configuración y seguridad del Monitor

## Ejecución

Desde la raíz del proyecto: `python -m http.server 8080 --bind 127.0.0.1 --directory frontend`.

Abrir `http://127.0.0.1:8080/monitor/perfil.html`. Las ocho plantillas son `perfil.html`, `editar-perfil.html`, `configuracion.html`, `preferencias.html`, `accesibilidad.html`, `privacidad.html`, `seguridad.html` y `ayuda.html`, bajo `frontend/monitor/`.

El perfil utiliza las aulas de la Fase 16, los cursos de la Fase 22 y las evaluaciones locales compartidas. Los datos institucionales son de solo lectura. No se encontró el ZIP de referencia; se reutilizó el diseño existente.

## Preferencias y reutilización

- `preferences.service.js` centraliza lectura, validación, escritura y eventos. Usa claves no sensibles `aithron.preferences.v1.demo-monitor` y `aithron.preferences.v1.demo-student`; la identidad demostrativa no constituye autorización.
- Los gestores existentes `theme-manager.js` y `accessibility-manager.js` y el diccionario de la Fase 13 fueron ampliados, no sustituidos por otros motores paralelos. Se conserva compatibilidad con el valor antiguo `auto` y lectura de claves estudiantiles anteriores. Las nuevas escrituras se realizan en el ámbito correspondiente y propagan errores.
- El selector de avatares utiliza una única biblioteca de cinco identidades ilustradas. Las ilustraciones SVG se dibujan localmente; no se solicitan fotografías ni permisos.
- La personalización solo admite alias de 2–40 caracteres de texto seguro, avatar, saludo y tono. No permite cambiar identidad institucional, rol, aulas, asignaturas o permisos.
- Idioma, tema, tamaño de texto, contraste, movimiento, foco y espaciado se aplican mediante los gestores compartidos. Automático escucha cambios posteriores del sistema.
- Las vistas nuevas y su navegación compatible soportan ES/EN. Los módulos académicos anteriores mantienen textos en español y traducciones parciales existentes. No se traduce contenido curricular ni comentarios.
- El Dashboard respeta aula inicial, sección inicial mediante desplazamiento, actividad reciente y accesos rápidos opcionales.
- Mis Estudiantes respeta filas por página y orden preferido. Las tablas docentes compatibles utilizan densidad y legibilidad compartidas.
- El calendario existente respeta vista inicial, aula, primer día semanal, fines de semana y tipos de evento predeterminados. Sus pantallas bajo `/monitor/` reutilizan ahora el Sidebar/Topbar comunes. Las fechas y fuentes académicas no se modifican.
- Content Studio respeta apertura de paneles, vista previa, espera de autoguardado y advertencias pedagógicas opcionales; los errores técnicos y la validación no pueden desactivarse.
- Reportes respeta encabezado decorativo, fecha, explicaciones de métricas y tamaño de impresión. La marca de demostración permanece visible y la impresión usa fondo blanco.
- Los controles de audio de páginas docentes compatibles reciben la velocidad seleccionada sin autoplay.
- Las preferencias de avisos siguen en la página y almacenes de la Fase 21. No se crean suscripciones Push ni eventos de sincronización por guardar preferencias locales.

## Privacidad, seguridad y salida

Privacidad distingue preferencias, borradores, datos ficticios e información institucional; explica conservación limitada y equipos compartidos. Consulta permisos y almacenamiento sin solicitarlos, y muestra documentos institucionales pendientes sin inventar políticas, contactos ni responsables.

Seguridad identifica una sesión de demostración. Contraseñas, 2FA, sesiones remotas, revocación y autenticación institucional figuran pendientes de backend. Recuperación enlaza al flujo existente de la Fase 2.

Cerrar sesión solicita confirmación y vuelve al selector demostrativo sin borrar borradores, preferencias, recordatorios, descargas ni operaciones pendientes. El selector de perfiles no aísla ni protege los datos como lo haría una autenticación real. No se muestran datos de otro perfil en su interfaz de personalización; los ámbitos locales no son una barrera de seguridad.

Restablecer preferencias reinicia únicamente apariencia, idioma y accesibilidad tras confirmación. Conserva alias/avatar, preferencias de trabajo, avisos y trabajo docente.

## Offline

En Configuración, **Preparar estas vistas offline** reutiliza `prepareStaticResources` y el Service Worker. Guarda las ocho plantillas y dependencias estáticas; preferencias siguen en almacenamiento local e información académica demostrativa en IndexedDB. No hay una nueva base de datos.

La suite ejecutó con Chromium y Service Worker real: cambiar avatar/alias, guardar; activar oscuro y texto muy grande; recargar; desconectar mediante `browserContext.setOffline(true)`; abrir Perfil; comprobar avatar/alias/tema/texto; cambiar apariencia sin red; guardar, recargar y navegar entre Ayuda, Perfil y Configuración. No se afirmó una modificación de cuenta institucional ni una sincronización.

## Pruebas realmente ejecutadas

`node tests/phase23.cjs` — **PASS**:

- Ocho vistas, menús, coherencia de aulas/cursos/contadores, selector de avatar y persistencia.
- Alias inválido/HTML rechazado, rol no editable, ámbitos estudiante/docente separados.
- Temas claro/oscuro/automático y cambio posterior de preferencia del sistema; ES/EN y navegación compatible.
- Preferencias aplicadas a Dashboard, tablas, calendario y editor; reportes y etiqueta de demostración conservados en impresión.
- Accesibilidad, texto aumentado y responsive a 1440/768/320 px en las ocho vistas y pantallas compatibles de Evaluaciones, Cursos, Registro, Reportes, análisis y Calendario.
- Auditoría axe-core con reglas WCAG 2 A/AA y 2.1 AA sobre las ocho vistas en oscuro/alto contraste; comprobaciones adicionales en claro y oscuro estándar sobre las vistas de cuenta principales. Sin infracciones detectadas en esos recorridos. Esto no certifica conformidad completa ni sustituye revisión manual.
- Teclado en preguntas frecuentes, fallo de escritura simulado, ausencia de confirmación falsa, restablecimiento y salida sin eliminar un borrador.
- Recorrido offline, enlaces HTTP, ausencia de errores JavaScript/consola durante el recorrido.

Regresiones ejecutadas: `tests/phase17.cjs`, `tests/phase18.cjs`, `tests/phase19.cjs` y `tests/phase22.cjs`: **PASS**. No se afirma cobertura exhaustiva de todas las fases, navegadores, lectores de pantalla o dispositivos físicos.

Las pruebas utilizan Python y la instalación de Playwright del entorno (`PLAYWRIGHT_MODULE` permite otra ruta). La suite 23 usa axe-core para pruebas (`AXE_CORE_MODULE` permite indicar `axe.min.js`); ninguna de estas herramientas se carga como dependencia de ejecución del frontend.

## Archivos

Creaciones:

- Las ocho plantillas indicadas en `frontend/monitor/`.
- `frontend/css/monitor/account.css`, `account-shared.css`.
- `frontend/js/monitor/account.js`.
- `frontend/js/services/preferences.service.js`, `monitor-settings.service.js`, `monitor-profile.service.js`.
- `frontend/js/components/monitor-account-navigation.js`.
- `frontend/js/i18n/monitor-account.js` (diccionario del motor existente).
- `frontend/js/data/monitor-help.data.js`.
- `tests/phase23.cjs` y este documento.

Modificaciones:

- Gestores de tema/accesibilidad, diccionario `js/i18n/i18n.js`, fuentes de avatares/perfil/preferencias estudiantiles y selector de avatares: reutilización y ámbitos estables, validación y errores de escritura.
- Páginas estudiantiles de edición, ajustes y accesibilidad: compatibilidad y tratamiento de errores de los gestores compartidos.
- Sidebar y Topbar comunes; shell y Dashboard docentes: navegación de cuenta, personalización y preferencias.
- Listado de estudiantes, calendario/controlador y componentes de fechas, editor de contenidos, resumen de validación y reportes: aplicación real de preferencias.
- `css/variables.css`, `css/monitor.css`: estilos compartidos, adaptación del calendario y contraste.
- Preparación offline y Service Worker: rutas nuevas y calendario existente.
- `README.md`.

## Contratos futuros

FastAPI deberá suministrar perfil institucional autorizado, roles/asignaciones, sesión real, cambio de contraseña, recuperación confirmada, 2FA cuando corresponda, sesiones remotas, permisos y documentos institucionales aprobados. Las preferencias remotas, si se incorporan, necesitarán contratos y confirmación propios; hoy son exclusivamente locales. No se llaman endpoints ficticios ni se guardan contraseñas o tokens en preferencias.
