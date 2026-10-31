# Fase 22 — AITHRON CONTENT STUDIO

## Ejecutar

Desde `D:\Programing\ATHRON EDU1`:

```powershell
python -m http.server 8080 --bind 127.0.0.1 --directory frontend
```

Abrir **http://127.0.0.1:8080/monitor/cursos.html**. El Dashboard del Monitor también permite entrar mediante **Mis Cursos** o el menú **Cursos**.

Utilizar HTTP en localhost o HTTPS. Los módulos JavaScript, IndexedDB y Service Worker necesitan un origen compatible; abrir un archivo mediante `file://` no es el recorrido de ejecución.

| Vista | Ruta de ejemplo |
| --- | --- |
| Mis Cursos | `/monitor/cursos.html` |
| Detalle del Curso | `/monitor/detalle-curso.html?grade=4&course=math` |
| Unidades Educativas | `/monitor/unidades.html?grade=4&course=math` |
| Preparar Unidad | `/monitor/editar-unidad.html?grade=4&course=math` |
| Lecciones | `/monitor/lecciones.html?grade=4&course=math&unit=math-g4-u1` |
| Editor de Lecciones | `/monitor/editar-leccion.html?grade=4&course=math&unit=math-g4-u1` |
| Biblioteca de Recursos | `/monitor/recursos-educativos.html?grade=4&course=math` |
| Vista Previa base | `/monitor/vista-previa-leccion.html?grade=4&course=math&unit=math-g4-u1&lesson=math-g4-u1-l1` |
| Organización de Contenidos | `/monitor/organizar-contenidos.html?grade=4&course=math` |

Después de guardar, los editores y la vista previa de un borrador utilizan `?id=<identificador-local>`. Los identificadores reales se obtienen del catálogo y de IndexedDB; no se crean páginas por entidad.

## Inspección y reutilización

- El catálogo académico procede de `course.service.js`, `courses-demo.data.js`, `units-demo.data.js` y `lessons-demo.data.js`: cinco asignaturas por cada uno de los tres grados disponibles. Son **15 definiciones curso/grado**, con una unidad y cuatro lecciones base por definición en la muestra actual. Un aula adicional del mismo grado no duplica el curso.
- Las aulas asignadas proceden de `authorizedRooms()` de la Fase 16. Se utiliza la correspondencia entre códigos de asignación posicionales de esa fase e IDs del catálogo, sin reemplazar ninguno de sus modelos.
- No se encontró un ZIP de referencia ni una carpeta `content/` en el repositorio inspeccionado. Se reutilizaron variables CSS, Sidebar, Topbar, tarjetas, recursos y estilo docente existentes.
- La biblioteca adapta `monitor-learning-resources.service.js`: lecturas, prácticas y vocabulario existentes. Añade referencias a los 60 audios reales de las lecciones y a la ilustración original `assets/images/branding/open-book.svg`. Esta última se describe como ilustración general de lectura, no como diagrama específico de Matemática.
- No hay documentos ni videos locales registrados; sus filtros muestran un resultado vacío explícito. Las licencias y la revisión pedagógica institucional siguen pendientes de verificación; se muestra la procedencia conocida.
- AITHRON Insights existe como observaciones por reglas en el Dashboard, sin un módulo independiente en los archivos inspeccionados. Allí se incorporaron accesos al curso, unidad, lecciones, recursos y preparación de apoyo.

## Funciones implementadas

### Catálogo, unidades y lecciones

- Búsqueda, filtros por grado/aula/asignatura/estado y ordenación de cursos.
- Contadores calculados desde el catálogo compartido y los borradores del Monitor, con resúmenes actualizados por filtros.
- Detalle del curso, unidades, lecciones, recursos, acceso a contenido base y organizador.
- Consulta de catálogo base de demostración y propuestas locales identificadas por separado.
- Creación, edición, duplicación, validación, archivo y eliminación confirmada de borradores.
- Detección de títulos y órdenes duplicados en la ubicación correspondiente.
- Protección de ubicaciones guardadas, IDs de catálogo, versiones base y referencias académicas.
- Bloqueo de eliminación de unidades con lecciones dependientes; el archivo de la unidad exige archivar antes sus lecciones locales activas.
- Campos de competencia, capacidad, criterio, propósito y evidencia sin inventar códigos curriculares oficiales.

### Editor estructurado

Trece tipos de bloque definidos por un esquema compartido:

1. Título de sección, limitado a h2/h3 y con comprobación de jerarquía.
2. Texto explicativo, con párrafos separados por líneas vacías.
3. Párrafo destacado.
4. Ejemplo resuelto: situación, explicación, pasos, resultado y observación.
5. Imagen del catálogo y texto alternativo.
6. Audio local, idioma y transcripción.
7. Vocabulario: selección múltiple del diccionario de la Fase 8, sus equivalencias y ejemplos; pronunciación textual y audio opcionales.
8. Lista de conceptos: añadir, editar, eliminar y reordenar conceptos y descripciones.
9. Pregunta de reflexión, sin puntaje ni registro de respuestas; la orientación privada del docente no se incluye en la vista previa.
10. Práctica vinculada por ID y versión.
11. Recurso complementario.
12. Resumen, conceptos, recomendaciones y recurso para continuar.
13. Autoevaluación formativa vinculada a una práctica existente; no copia preguntas ni respuestas de evaluaciones oficiales.

Seleccionar, duplicar, subir, bajar y eliminar bloques funciona con botones nativos, utilizables por teclado. Los IDs se regeneran al duplicar. Los metadatos de la lección están fuera de los bloques.

El escritorio utiliza estructura/editor/propiedades; en tablet y móvil se reorganizan en paneles plegables. La Topbar conserva el componente global e incorpora contexto de edición y acceso a vista previa en esta pantalla.

### Guardado y versiones

- Se reutiliza la base **`aithron-edu`**, migrada de versión 4 a **5** sin eliminar almacenes anteriores.
- Solo se añaden `monitorContentDrafts` y `monitorContentVersions`, ambos con índice `owner`.
- Los bloques pertenecen al snapshot de la lección. No se crea una tabla paralela que pueda quedar desincronizada del borrador.
- Borrador y snapshot de revisión se escriben en una misma transacción. La confirmación aparece después de `transaction.oncomplete`.
- Se comprueban revisión esperada, propiedad local, duplicados y relaciones durante el guardado. Una pestaña con datos antiguos recibe un error en lugar de sobrescribir silenciosamente.
- El autoguardado espera **1600 ms** de inactividad. Serializa escrituras, mantiene el ID y no confirma cambios posteriores a un snapshot como si ya estuvieran guardados.
- Los modelos inconsistentes no se guardan: se muestran errores y se conserva el indicador de cambios pendientes. Al abandonar el editor hay opciones de guardar, volver o descartar con confirmación; la recarga/cierre usa la advertencia nativa del navegador cuando hay cambios pendientes.
- No hay fallback silencioso a otra base o a LocalStorage. Los errores de almacenamiento se muestran como errores de guardado.
- El historial permite consultar versiones y restaurar con confirmación. La restauración crea una revisión nueva y exige resolver primero cambios pendientes.
- Estados persistidos: borrador local, listo para revisión local y archivado. En edición y validación incompleta son estados reales de interfaz. Revisión institucional, aprobación y publicación se identifican como capacidades futuras.

### Validación y seguridad

- IDs estables; curso asignado; grado, unidad y orden compatibles; duración y longitudes limitadas.
- Objetivo obligatorio; al menos un bloque útil —un encabezado aislado no basta—; campos y tipos compatibles por bloque.
- IDs de bloque únicos, relación con su lección y orden consecutivo.
- Recursos y versiones registrados; imágenes con alternativa textual y audio con transcripción.
- Referencias a evaluaciones locales compatibles, conservando su versión y sin copiar preguntas/respuestas.
- Renderizador con escape de texto, rutas de recursos registradas y del mismo origen; no admite HTML libre, scripts ni marcos externos.
- Advertencias de revisión curricular, pedagógica y de accesibilidad manual. La validación técnica no equivale a aprobación institucional ni certificación de accesibilidad.

### Vista previa e integraciones

- `lesson-content.js` contiene el renderizado compartido utilizado por Aprende y la vista previa docente; conserva los diagramas de `learning-visual.js` y el estilo de lecciones.
- La vista previa tiene selector escritorio/tablet/móvil, aviso de contenido no publicado y no escribe progreso, resultados ni intentos estudiantiles.
- Los enlaces de prácticas solo abren el motor existente por acción explícita, en otra pestaña; no se inicia una actividad al renderizar el borrador.
- Tareas y refuerzos reciben curso/grado/unidad válidos. Una lección base puede preseleccionarse como recurso existente. Una propuesta local se conserva como referencia a ID/versión; no se transforma en recurso publicado ni se asignan destinatarios al guardar una lección.
- Las evaluaciones se relacionan mediante IDs/versiones existentes en el almacenamiento; no se modifican sus preguntas, resultados o intentos.
- El Dashboard consulta el mismo resumen de cursos/unidades/lecciones/borradores y ofrece Mis Cursos.

## Offline: preparación y verificación

Se reutilizan `prepareStaticResources`, el Service Worker y `aithron-monitor-shell-v1`. No existe otro motor de descargas.

1. **Preparar aplicación offline** en Mis Cursos guarda y verifica las nueve plantillas y su grafo de módulos/estilos.
2. Guardar una lección y usar **Preparar recursos offline** prepara además sus recursos seleccionados y dependencias estáticas.
3. La preparación de una unidad incluye las lecciones vinculadas y sus recursos. Las revisiones de las lecciones dependientes también se registran y comprueban.
4. **Comprobar preparación offline** verifica la revisión guardada, las relaciones, las versiones y las respuestas que siguen presentes en caché. Un archivo eliminado o una dependencia modificada invalida la preparación.
5. El resumen en `storageMetadata` es una comprobación local del dispositivo, no un archivo de distribución institucional. El contenido estructurado permanece en IndexedDB y los archivos compartidos se referencian sin guardar binarios dentro del modelo.

El estado previo a las comprobaciones es sin verificar. Solo las comprobaciones ejecutadas con éxito producen **Preparación completa en este dispositivo**. Esta preparación no significa descarga en el dispositivo de un estudiante ni sincronización con un servidor.

### Recorrido offline ejecutado

En Chromium automatizado con Playwright, servidor HTTP local y Service Worker real:

- Entrar al Monitor, consultar Mis Cursos y Matemática de 4.º, abrir unidades y preparar una lección.
- Añadir título, explicación, ejemplo, imagen local y otros tipos de bloque; guardar y recuperar tras recargar.
- Preparar/verificar la aplicación y los recursos; recargar con la aplicación bajo el control del Service Worker.
- Activar `browserContext.setOffline(true)`, recargar el editor y recuperar el borrador.
- Modificar una explicación, guardar sin conexión y abrir la vista previa.
- Comprobar el texto guardado y decodificar la imagen desde la caché.
- Recargar la vista previa, volver al editor sin conexión y comprobar de nuevo la modificación.
- Reconectar, preparar la revisión actual y eliminar la imagen de las cachés: la verificación pasa a preparación incompleta.

La desconexión fue simulada por el navegador, no retirando físicamente la conexión de un equipo. No se probó en dispositivos físicos ni se verificaron todas las combinaciones de navegadores/PWA instaladas.

## Pruebas ejecutadas

Comandos desde la raíz del repositorio:

```powershell
node tests/phase22.cjs
node tests/phase17.cjs
node tests/phase18.cjs
node tests/phase19.cjs
```

Las suites reutilizan la instalación de Playwright del entorno en `C:/Users/Frank/AppData/Local/Temp/opencode/node_modules/playwright`, o la indicada por `PLAYWRIGHT_MODULE`. Python sirve el frontend en los puertos locales de cada suite. Playwright es una herramienta de pruebas, no una dependencia del frontend.

**Resultados obtenidos: PASS en las cuatro suites.**

La suite nueva comprueba:

- Migración 4→5 que conserva un borrador previo de evaluación.
- Nueve vistas; Sidebar activo y acceso desde Dashboard; Topbar/perfil; filtros y contadores de cursos/aulas.
- Creación y recuperación de unidades; duplicación/eliminación; lecciones de unidades locales; bloqueo de dependencias.
- Los trece tipos de bloque; edición, duplicación, eliminación, movimiento y IDs/órdenes únicos.
- Reordenación de borradores y movimiento de bloques mediante Enter en botones de teclado.
- Rechazo de HTML introducido; texto escapado; orientación docente privada excluida de la vista previa.
- Guardado manual y automático, recarga, historial/restauración, versiones nuevas, conflictos y protección del catálogo base.
- Aviso de salida con cambios pendientes y posibilidad de volver al editor.
- Recursos reales, filtros, detalle, inserción desde biblioteca y selección de imagen/audio/práctica por referencia.
- Apertura contextual de tareas y refuerzos.
- Comprobación de paquetes de unidad y su invalidación tras cambiar una lección dependiente.
- Recorrido offline descrito arriba, incluida persistencia después de varias recargas.
- Las nueve vistas a **1440, 768 y 320 px**, sin desbordamiento horizontal en los recorridos probados.
- Respuestas HTTP de enlaces de las vistas, errores JavaScript y mensajes de error de consola durante el recorrido.
- Smoke de Aprende: contenido compartido, diagrama existente, metadatos de audio y cambio de interfaz a inglés.

Las suites existentes 17/18/19 verificaron evaluaciones docentes, notas/reportes y tareas/refuerzos, incluidas sus rutas offline. En `tests/phase18.cjs` se añadió una espera al contenido de detalle antes de comprobarlo: la prueba anterior comprobaba el texto durante el estado «Cargando resultado…». No se alteraron sus expectativas académicas.

No se afirma una prueba exhaustiva de todas las fases 1–21, lectores de pantalla, dispositivos físicos o permisos institucionales reales.

## Archivos creados

### Plantillas

En `frontend/monitor/`:

- `cursos.html`
- `detalle-curso.html`
- `unidades.html`
- `editar-unidad.html`
- `lecciones.html`
- `editar-leccion.html`
- `recursos-educativos.html`
- `vista-previa-leccion.html`
- `organizar-contenidos.html`

### Estilos y JavaScript

- `frontend/css/monitor/content-studio.css`: estilos compartidos y responsive de las nueve vistas; evita once hojas con reglas redundantes.
- `frontend/js/monitor/content-studio.js`: controlador de catálogo, listados, biblioteca, vista previa y organizador.
- `frontend/js/monitor/content-editor.js`: formularios, guardado, historial, advertencias y edición por bloques.
- `frontend/js/components/monitor-content-ui.js`: campos, tarjetas/estados, resumen, lista de bloques y validación compartidos.
- `frontend/js/components/monitor-lesson-block-editor.js`: controles según esquema del bloque.
- `frontend/js/components/lesson-content.js`: renderizado seguro compartido con Aprende.
- `frontend/js/data/lesson-block-types.data.js`: tipos, esquemas, IDs y estados locales.
- `frontend/js/services/monitor-courses.service.js`: asignaciones y resumen del catálogo existente.
- `frontend/js/services/monitor-content-drafts.service.js`: borradores de ambas entidades, historial, dependencias, archivo y reordenación transaccional.
- `frontend/js/services/monitor-resources.service.js`: adaptación de recursos registrados y disponibilidad comprobable.
- `frontend/js/services/monitor-content-validation.service.js`: validación de unidades/lecciones y sus referencias.
- `frontend/js/services/monitor-content-packages.service.js`: manifiesto, preparación y verificación mediante el motor offline existente.
- `frontend/js/utils/content-safety.js`: política compartida de rutas de recursos.
- `tests/phase22.cjs`.
- `docs/phase22.md`.

No se crearon catálogos académicos, recursos binarios o motores de práctica adicionales. Unidades y lecciones comparten el servicio de borradores y los componentes de formulario donde sus reglas son comunes.

## Archivos modificados

- `frontend/js/offline/database-schema.js`: migración no destructiva a v5, dos almacenes nuevos.
- `frontend/js/monitor/management-shell.js`: navegación existente hacia Cursos/Calendario.
- `frontend/js/monitor/dashboard.js`: Mis Cursos, resumen compartido y enlaces desde observaciones Insights.
- `frontend/js/monitor/support-editor.js`: contexto validado de lección base o propuesta local para tareas/refuerzos.
- `frontend/js/student/lessons.js`: uso del renderizado de lectura compartido, respetando los títulos ES/EN de interfaz.
- `frontend/sw.js`: fallback offline de las nueve plantillas docentes, conservando el aislamiento de respuestas API.
- `tests/phase18.cjs`: espera explícita del detalle académico cargado.
- `README.md`: acceso y referencia de esta fase.

## Contratos futuros para FastAPI

Los servicios actuales son adaptadores locales. No realizan peticiones a endpoints institucionales ficticios. Fetch se usa únicamente para comprobar/preparar recursos estáticos existentes. La integración remota deberá implementar estos contratos y reemplazar los adaptadores locales manteniendo los modelos y renderizadores:

| Operación de dominio | Datos mínimos de contrato | Verificación futura |
| --- | --- | --- |
| Consultar cursos autorizados | identidad, ámbito institucional, aula, grado, área, versión | Permisos en servidor y pertenencia a aulas |
| Consultar unidades/lecciones | IDs estables, versión, estado autorizado, dependencias | Visibilidad por perfil y grado |
| Crear/actualizar borrador | entidad base opcional, versión base, revisión esperada, metadatos, bloques, referencias/versiones | Validación de esquema, autorización y control de concurrencia |
| Validar contenido | snapshot/versiones, recursos, referencias | Revisión técnica, seguridad y flujo pedagógico institucional |
| Solicitar revisión | ID/revisión del borrador, autor autorizado, observaciones | Registro de solicitud y confirmación del servidor |
| Aprobar/publicar versión | versión aprobada, permisos institucionales, auditoría | Autoridad, trazabilidad e integridad transaccional |
| Consultar/subir recursos | ID, tipo/MIME, tamaño, licencia, alternativa textual, ámbito, versión | Seguridad del archivo, privacidad, permisos y derechos de distribución |
| Preparar/descargar paquete aprobado | manifiesto, versión, recursos requeridos, hashes, tamaño, estado | Integridad y disponibilidad confirmadas mediante AITHRON SYNC |

Pendientes del backend: identidad/autorización real, revisión institucional, aprobación, publicación, distribución entre dispositivos, subida autorizada de archivos, auditoría institucional, resolución remota de versiones y sincronización confirmada. Los estados aprobados/publicados deberán venir de un proceso autorizado, nunca de un botón local.

**La implementación se detiene en la Fase 22 para revisión.**
