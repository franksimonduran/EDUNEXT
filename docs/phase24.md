# Fase 24 — Dashboard del Administrador

## Ejecutar

Desde `D:\Programing\ATHRON EDU1`:

```powershell
python -m http.server 8080 --bind 127.0.0.1 --directory frontend
```

Abrir **http://127.0.0.1:8080/admin/index.html** o entrar a `role-selection.html`, seleccionar Administrador y abrir el Dashboard de demostración. El selector utiliza las mismas definiciones de rol de la Fase 3. Elegir una tarjeta no autentica ni autoriza una cuenta.

Solo se implementa una página administrativa. Los menús de usuarios, matrículas, cursos administrativos, aprobación, configuración institucional, perfil administrativo y permisos muestran **Módulo en construcción**. Las secciones internas del Dashboard, filtros, comprobaciones y preferencias son funcionales. No se envía al Administrador a las pantallas docentes como sustituto de sus módulos futuros.

## Auditoría y fuentes existentes

- No existía `frontend/admin/`. `core/roles.js` ya definía el destino `admin/index.html`; se completó su enlace en el selector existente.
- No se encontró el ZIP original ni mockups administrativos. Se reutilizan logo/ilustración original, variables, Sidebar, Topbar y patrones de tarjetas. No se afirma reproducción de una referencia visual no consultada.
- Institución ficticia: la misma `monitor.institution` de la Fase 15. No se inventan códigos oficiales, direcciones ni otra institución.
- El único nuevo usuario de demostración es `demo-admin`. El docente procede del modelo compartido y sus relaciones con aulas; no se crean copias de estudiantes o un catálogo paralelo.
- Estudiantes y aulas: `monitor-students.service.js` y datos de Fase 16.
- Cursos/unidades/lecciones: `assignedCourses()` de Fase 22, que adapta el catálogo de Aprende.
- Borradores y versiones: almacenes existentes de Content Studio.
- Evaluaciones, intentos y periodos: servicios de Fases 17–18. Tareas/refuerzos: servicio de Fase 19.
- Panorama de aprendizaje: `academicScope`, `academicSummary`, evidencia por preguntas y grupos compatibles existentes; no hay un segundo motor de analítica. Insights no existe como módulo independiente en los archivos inspeccionados: se aprovechan sus fuentes y reglas compartidas.
- La actividad usa fechas persistidas de borradores, configuraciones de evaluaciones y actividades. Las fechas académicas permanecen en sus servicios; no se duplican controladores de calendario ni se muestran recordatorios personales privados.
- Diagnósticos: IndexedDB, estimador de almacenamiento, cola local, caché y Service Worker existentes.

## Métricas y alcance

Valores iniciales del conjunto demostrativo actual, antes de crear nuevos borradores:

| Indicador | Valor | Definición |
| --- | ---: | --- |
| Estudiantes | 76 | IDs distintos: 24 de 4.º, 28 de 5.º y 24 de 6.º |
| Monitores / Docentes | 1 | ID docente único asociado con las aulas seleccionadas |
| Aulas | 3 | IDs de aula distintos; una sección A por grado |
| Cursos | 5 | Asignaturas únicas; se distinguen de las 15 definiciones curso/grado |
| Contenidos | 75 | 15 unidades + 60 lecciones del catálogo base demostrativo; sin sumar borradores |
| Pendientes de revisión | 0 inicialmente | Registros locales en estado `ready`; cambia con el contenido realmente guardado |

La distribución institucional contiene **78 usuarios únicos**: 76 estudiantes, un Monitor y un Administrador. Los IDs se deduplican; en esta muestra no hay cuentas multirrol. Las relaciones docentes con cursos no multiplican la cantidad de docentes. Una futura fuente multirrol deberá declarar por separado personas y asignaciones de rol.

Fórmulas:

- Porcentaje de distribución = cantidad de la categoría ÷ total representado × 100. Denominador cero o no finito produce 0, sin divisiones inválidas.
- Progreso curricular = suma de lecciones completadas ÷ suma de lecciones asignadas × 100. Se informa cantidad de lecciones-estudiante y tamaño de muestra. No es una nota oficial.
- Contenido base = unidades únicas + lecciones únicas por sus IDs académicos.
- Cursos = IDs de asignatura distintos. Las definiciones por grado se identifican con la combinación de ID de curso y grado.
- Pendientes = borradores guardados como `ready`, compatibles con grado/curso y fecha seleccionados. La validación actual puede detectar errores y se informa explícitamente; ese estado no crea una solicitud institucional.
- Técnicamente validados ahora = propuestas en `ready` que siguen sin errores en la validación local ejecutada.

### Filtros

| Ámbito | Grado/aula | Periodo |
| --- | --- | --- |
| Estudiantes, docentes asociados, aulas | Sí | No: no hay periodo de matrícula/asignación confirmado |
| Catálogo base y asignaturas | Sí, mediante las relaciones curso/grado/aula compartidas | No: catálogo sin fecha de publicación institucional |
| Distribución de usuarios por rol y resumen de institución | Globales | Globales: la fuente no define matrículas por semestre |
| Estudiantes por grado/aula | Sí | No: relaciones sin periodo de matrícula |
| Borradores | Curso/grado compatible con el aula | Fecha local de modificación/creación conocida |
| Evaluaciones y correcciones | Servicio compartido `academicScope` | Reglas de fechas existentes de Fase 18 |
| Prácticas formativas | Ámbito académico compartido | Sin fecha: solo Todos o Sin fecha conocida |
| Progreso curricular | Estudiantes del ámbito | Referencia global sin fecha; no se atribuye al semestre |
| Servicios, cuota, paquetes, operaciones pendientes | Dispositivo actual, sin dependencia del aula | No aplica |

Solo existe una institución demostrativa; se muestra como texto, no como selector multiinstitucional ficticio. Se ofrecen los periodos demostrativos presentes en el repositorio, sin declarar un periodo institucional activo. Las combinaciones grado/aula incompatibles, periodos inexistentes e instituciones ajenas se rechazan con un estado recuperable.

## Contenido, revisión y privacidad

- Los borradores docentes se muestran separados del catálogo base. No se consideran publicados.
- Solicitudes institucionales y publicaciones autorizadas figuran **Estado desconocido** porque no existe una fuente autorizada integrada; no se inventa un valor cero oficial.
- La lista de revisión muestra hasta seis registros reales del almacenamiento local con estado `ready`, ID, versión, curso, grado, autor ficticio y fecha conocida.
- Ver detalle abre metadatos y errores de validación escapados como texto. No hay botones de aprobar/rechazar, modificación de contenido ni escritura de resultados.
- El Dashboard principal no muestra alias ni IDs de estudiantes, resultados individuales, rankings, conversaciones, grabaciones o respuestas de evaluaciones. Solo resume datos agregados y alias ficticios de adultos.
- El panorama de aprendizaje suprime evidencia sin al menos cinco registros y cinco estudiantes distintos en la evidencia pertinente. Los cursos con datos suficientes reutilizan los grupos de evaluación/versiones compatibles y exigen cinco estudiantes distintos. La ausencia de evidencia suficiente se muestra como tal; no se producen diagnósticos ni se atribuye análisis a IA generativa.
- Las restricciones del frontend y sus IDs de institución son reglas demostrativas, no autorización segura. FastAPI deberá comprobar identidad, institución, rol y operación.

## Actividad, alertas y notificaciones

La actividad reciente procede de marcas temporales persistidas. Los registros sin una fecha válida no se presentan como eventos fechados. Una carga de la pantalla o un cambio de filtro no fabrica eventos de auditoría.

Avisos:

- Información sobre servicios pendientes de integración, sin convertirlo en emergencia.
- Propuestas locales listas para revisar.
- Errores detectados por la validación actual.
- Lecturas de fuentes o comprobaciones de almacenamiento que realmente fallaron.
- Recursos no accesibles después de ejecutar **Comprobar recursos del catálogo**. Antes de ejecutar la comprobación, el estado es sin verificar; offline se distingue falta de preparación local de un supuesto fallo de servidor.

La campana reutiliza el renderizador de notificaciones existente y muestra los mismos avisos que el Dashboard. Su contador es cantidad de avisos actuales, no mensajes del servidor ni avisos no leídos con estado de lectura inventado. No hay Push nuevo.

La tarjeta de auditoría identifica expresamente que requiere el servicio de seguridad del backend. No se inventan IPs, ubicaciones, cambios de permisos, sesiones verificadas o modificaciones oficiales.

## Comprobaciones técnicas

- Frontend: ejecución del módulo en este navegador.
- Conectividad: `navigator.onLine`, etiquetada como indicativa; no prueba disponibilidad de FastAPI.
- Service Worker: consulta del registro y del controlador de la página, por separado del modo de visualización.
- IndexedDB: transacción de lectura sobre `aithron-edu` comprobada.
- Preferencias: lectura accesible; la escritura se verifica realmente al guardarlas y reporta fallos.
- PWA: modo independiente detectado cuando existe evidencia; en modo navegador no se confirma instalación.
- Cuota/uso: estimación del origen mediante `navigator.storage.estimate`, no almacenamiento institucional total.
- Paquetes: se distingue la cantidad de registros de los que tienen todos sus archivos requeridos presentes y con respuesta correcta en caché. No se confía solo en un indicador `verified` anterior.
- Preparaciones de Content Studio: cantidad de manifiestos locales registrados, sin afirmar que fueron distribuidos.
- AITHRON SYNC: operaciones pendientes del dispositivo actual mediante la cola existente. No se conocen los pendientes de otros dispositivos desconectados ni existe confirmación global de servidor.
- FastAPI, PostgreSQL, AITHRON AI y sincronización: **Sin integrar**. No se llaman endpoints ficticios de salud, identidad o datos.

Una fuente académica bloqueada produce estado parcial y aviso: por ejemplo, el catálogo estático y los estudiantes de demostración pueden seguir disponibles mientras los pendientes de IndexedDB se muestran desconocidos. No se convierte una lectura fallida en un contador cero.

## Preferencias y navegación compartidas

Sidebar y Topbar son los componentes comunes con configuración/rol `admin`. Se reutilizan el logo, estados de foco, menú móvil, contracción y notificaciones visuales. El diseño del contenido administrativo es propio: métricas institucionales, fuentes, servicios y agregados, sin copiar el Dashboard docente con otros títulos.

Los controles del Dashboard usan los gestores existentes de idioma, tema y accesibilidad. Su ámbito es `aithron.preferences.v1.demo-admin`, separado de `demo-monitor` y `demo-student`; no constituye autorización. Tema automático sigue el sistema. Hay controles funcionales de idioma, tamaño de texto, contraste y movimiento reducido. No se crean páginas administrativas de configuración posteriores.

Encabezados, filtros, navegación, controles y muchos rótulos soportan ES/EN mediante el diccionario compartido. Los títulos curriculares, descripciones de fuentes, mensajes técnicos y algunas explicaciones de métricas permanecen en español; no se afirma traducción íntegra de todos los módulos o contenidos.

## Offline

**Preparar Dashboard offline** utiliza `prepareStaticResources`, el mismo Service Worker y las cachés existentes. Solo prepara HTML, CSS, módulos y recursos estáticos demostrativos; no cachea respuestas API privadas ni crea otra base IndexedDB.

La prueba ejecutó: preparar, recargar bajo control del Service Worker, activar desconexión de red mediante Playwright, recargar el Dashboard, consultar datos locales, cambiar de grado, actualizar otra vez y comprobar persistencia de filtros/preferencias. Las integraciones remotas permanecieron sin integrar y el estado de red indicó desconexión.

Los datos oficiales institucionales no están disponibles ni actualizados por este mecanismo. No se garantiza disponibilidad offline de todos los recursos de estudiantes.

## Pruebas ejecutadas

```powershell
node tests/phase24.cjs
node tests/phase23.cjs
node tests/phase22.cjs
node tests/phase19.cjs
node tests/phase18.cjs
node tests/phase17.cjs
node tests/phase16.cjs
```

**Resultado: PASS en las siete suites.**

La suite 24 comprueba:

- Entrada por el selector de roles existente y Dashboard administrativo propio.
- 76 estudiantes, 78 usuarios únicos, un docente, tres aulas, cinco asignaturas y 75 contenidos base; comparación con fuentes compartidas.
- Deduplicación, porcentajes, denominador cero, filtros de grado/aula/periodo y alcance institucional constante de los usuarios.
- Borradores locales `ready`, validación de un registro inconsistente introducido para la prueba, texto HTML escapado y ausencia de controles de aprobación.
- Fuente de actividad con fecha conocida y ausencia de listas nominales de estudiantes.
- Avisos y contador de campana procedentes de los mismos datos; menús futuros y menú personal funcionales.
- Sidebar contraíble, menú móvil, teclado Enter/Escape y devolución de foco al control de origen del diálogo.
- Estado real de IndexedDB y estados sin integrar de FastAPI/PostgreSQL/AI/SYNC.
- Comprobación de recursos existentes sin referencias faltantes en el recorrido online.
- Tema oscuro, alto contraste, texto muy grande y responsive a 1440/768/320 px, sin desbordamiento horizontal en el recorrido.
- Auditorías axe-core WCAG 2 A/AA y 2.1 AA sin infracciones detectadas en oscuro/alto contraste y en claro/oscuro estándar. Esto no certifica conformidad completa ni sustituye revisión con tecnologías de asistencia.
- Desconexión real del contexto de navegador, Service Worker, recargas y cambio de filtros offline.
- Ámbito administrativo de preferencias independiente y traducción compatible ES/EN.
- Fallo de IndexedDB simulado: servicios no disponibles, fuente parcial, contador desconocido y datos estáticos conservados.
- Filtros incompatibles con recuperación, salida y navegación hacia Monitor y Estudiante sin borrar un borrador docente.
- Ausencia de errores JavaScript/consola/HTTP durante el recorrido; sin solicitudes a `/api/` ni orígenes externos.

Las suites de regresión verificaron Estudiantes/Aulas, Evaluaciones, Notas/Reportes, Tareas/Refuerzos, Content Studio y Cuenta docente. La suite 24 incluye smoke de ambos Dashboards previos; no se afirma una prueba exhaustiva de todas las fases, navegadores, lectores de pantalla o dispositivos físicos.

Python, Playwright y axe-core se utilizan solo para pruebas. `PLAYWRIGHT_MODULE` y `AXE_CORE_MODULE` permiten configurar sus rutas; el frontend no incorpora estas bibliotecas como dependencias de ejecución.

## Archivos creados

- `frontend/admin/index.html`.
- `frontend/css/admin/dashboard.css` (estilos administrativos y responsive compartidos entre secciones).
- `frontend/js/admin/dashboard.js` (controlador, filtros, navegación y comprobaciones).
- `frontend/js/components/admin-dashboard-ui.js` (tarjetas, distribución reutilizando `svgBar`, aulas, cursos, revisión, actividad y servicios).
- `frontend/js/data/admin-demo.data.js` (institución adaptada y único Administrador ficticio).
- `frontend/js/data/admin-dashboard-config.data.js` (navegación, definiciones de métricas y suficiencia).
- `frontend/js/i18n/admin-dashboard.js` (diccionario del motor compartido).
- `frontend/js/services/admin-dashboard.service.js` (adaptación/agregación de fuentes existentes y errores parciales).
- `frontend/js/services/admin-content-summary.service.js` (borradores/validación y comprobación de recursos).
- `frontend/js/services/admin-activity.service.js` (actividad local conocida y avisos deterministas).
- `frontend/js/services/admin-service-status.service.js` (diagnósticos del navegador, almacenamiento y cola).
- `frontend/js/utils/admin-statistics.js` (deduplicación, conteos, porcentajes y filtros).
- `tests/phase24.cjs`.
- `docs/phase24.md`.

## Archivos modificados por la Fase 24

- `frontend/js/services/preferences.service.js`: tercer ámbito estable, sin alterar los otros perfiles.
- `frontend/js/components/sidebar.js`: configuración/etiqueta de navegación administrativa mediante el componente existente.
- `frontend/js/components/topbar.js`: rama visual común Monitor/Administrador, sin cargar notificaciones docentes para el Administrador.
- `frontend/js/components/notification-panel.js`: opciones de texto para reutilizar el renderizador común.
- `frontend/js/i18n/i18n.js`: registro del diccionario administrativo.
- `frontend/js/pages/role-selection.js`, `frontend/role-selection.html`: acceso demostrativo a los tres destinos y explicación actualizada.
- `frontend/sw.js`: fallback de la plantilla administrativa preparada, incluidas búsquedas con filtros.
- `frontend/css/monitor/account-shared.css`: corrección de colores de éxito/error en modo oscuro de alto contraste, compartida por los perfiles compatibles.
- `frontend/js/offline/bootstrap.js`: corrección de la ruta preexistente `./offline/pwa.js` a `./pwa.js` y una sola inicialización; el recorrido de integración detectó ese 404 al abrir el Dashboard estudiantil.
- `README.md`.

Los archivos de la Fase 23 y su documentación también se conservaron en esta sesión; su inventario está en `docs/phase23.md`.

## Contratos y trabajo pendiente

Los adaptadores locales deberán sustituirse mediante contratos autorizados para resumen institucional, usuarios/roles, aulas/matrículas, catálogo, versiones aprobadas, solicitudes de revisión, estadísticas agregadas, reportes, actividad, auditoría y salud de servicios. Los contratos necesitan identidad, institución, permisos, alcance, fecha/versiones y procedencia verificables.

Quedan pendientes: autenticación real, CRUD de usuarios, matrículas, gestión de roles/permisos, perfil administrativo completo, configuración institucional, solicitudes/aprobación/publicación, reportes oficiales, auditoría protegida, comprobaciones reales de backend, PostgreSQL, AI y sincronización entre dispositivos.

No hay tokens o credenciales administrativas, endpoints ficticios, modificación de notas, confirmaciones de servidor ni operaciones institucionales simuladas.

**La implementación se detiene en la Fase 24 para revisión. No se inicia la Fase 25.**
