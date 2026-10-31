# Fase 25 — Gestión de Usuarios, Roles y Permisos

## Ejecutar

Desde `D:\Programing\ATHRON EDU1`:

```powershell
python -m http.server 8080 --bind 127.0.0.1 --directory frontend
```

Abrir **http://127.0.0.1:8080/admin/index.html** y usar el menú lateral, o entrar directamente a `role-selection.html`, seleccionar Administrador y abrir el Dashboard de demostración. El selector usa las definiciones de rol de la Fase 3; elegir una tarjeta no autentica ni autoriza ninguna cuenta.

Nueve vistas nuevas, todas bajo `frontend/admin/`:

| Vista | Archivo | Función |
| --- | --- | --- |
| Gestión de Usuarios | `usuarios.html` | Directorio de usuarios y borradores locales con búsqueda, filtros, orden, paginación y resumen. |
| Preparar Registro de Usuario | `editar-usuario.html` | Formulario adaptativo para registros ficticios de estudiante, monitor o administrador. |
| Detalle de Usuario | `detalle-usuario.html` | Ficha con rol, origen, relaciones académicas y propuestas asociadas. |
| Gestión de Estudiantes | `estudiantes.html` | Directorio restringido a estudiantes con reparto por grado y aula. |
| Detalle Administrativo del Estudiante | `detalle-estudiante.html` | Ficha del estudiante sin notas, grabaciones ni datos personales. |
| Gestión de Monitores y Docentes | `monitores.html` | Directorio de docentes con filtros por asignatura y aula. |
| Detalle del Monitor | `detalle-monitor.html` | Aulas y asignaturas asociadas a un docente del conjunto base. |
| Roles y Permisos | `roles-permisos.html` | Matriz descriptiva de permisos y propuestas locales de rol, estado y asignación. |
| Solicitudes y Registros Pendientes | `solicitudes-usuarios.html` | Listado de borradores y propuestas locales con validación, archivo, copia y eliminación. |

Todas las vistas son demostrativas: no crean cuentas, no conceden permisos efectivos, no matriculan y no contactan con ningún servidor.

## Auditoría y fuentes existentes

- No existe `AGENTS.md` en el repositorio. `frontend/admin/` solo contenía `index.html` de la Fase 24.
- No se encontró el ZIP original ni mockups administrativos; se reutilizan logo, variables, Sidebar, Topbar, tarjetas y patrones de la Fase 24.
- Estudiantes y aulas proceden de `monitor-students.service.js` (Fase 16); cursos y asignaturas de `assignedCourses()` (Fase 22). No se crea una copia paralela de esas fuentes.
- El docente y el Administrador proceden de `admin-demo.data.js`; solo `demo-admin` es una identidad administrativa nueva.
- Preferencias, tema, accesibilidad, notificaciones, iconos y el motor de idioma son los componentes ya existentes, con el ámbito `demo-admin` de la Fase 24.
- Las nueve vistas se sirven desde el mismo Service Worker y las mismas cachés de las Fases 22–24.

Conjunto base vigente, antes de crear borradores: **78 identidades únicas** (76 estudiantes, 1 Monitor, 1 Administrador), 3 aulas y 5 asignaturas. Un mismo ID con varios roles cuenta una vez como usuario y una vez por cada rol en asignaciones.

## Separación entre datos base y propuestas locales

| Origen | Contenido | ¿Editable? | ¿Produce efectos? |
| --- | --- | --- | --- |
| Base compartida | Estudiantes, docente, Administrador, aulas, asignaturas | No | No |
| Registros locales | Alias, código ficticio y relaciones propuestas de una identidad nueva | Sí, en este dispositivo | No |
| Propuestas locales | Cambio de rol, de estado o de asignación docente sobre un registro existente | Sí, en este dispositivo | No |

Un borrador o una propuesta **no es** una cuenta, una matrícula, una asignación autorizada ni una solicitud recibida por un servidor. No existen estados "presentado", "aprobado" o "rechazado": solo `draft`, `incomplete`, `ready` y `archived`, con la etiqueta explícita «Listo para presentar localmente».

## Modelo local y versionado

IndexedDB `aithron-edu` sube a **v6** con dos almacenes nuevos, `adminUserRequests` y `adminUserRequestVersions`, creados solo si no existen. La migración es conservadora: los almacenes de las fases anteriores y sus registros se conservan intactos (verificado en la suite con un registro previo de `evaluationDrafts`).

Modelo de una propuesta:

| Campo | Contenido |
| --- | --- |
| `id` | `admin-request-<uuid>` estable, sin datos personales. |
| `candidateId` | `demo-user-<uuid>` para registros nuevos; permite detectar duplicados sin identificar personas. |
| `kind` | `registration`, `role`, `status` o `assignment`. |
| `targetId` / `targetRevision` | Destinatario y revisión revisada; si el destinatario cambió, el guardado se rechaza. |
| `owner` | `demo-admin`; ninguna propuesta es visible para otro ámbito. |
| `institutionId` | `demo-institution`; las referencias ajenas se rechazan. |
| `state` | `draft`, `incomplete`, `ready` o `archived`. |
| `revision` / `version` | Contadores de conflicto y de historial. |
| `data` | Solo campos permitidos por el tipo de propuesta. |
| `validation` | Errores y advertencias calculados en la última escritura. |

Cada escritura correcta genera una versión en `adminUserRequestVersions` (`<id>:<revisión>`) con la instantánea completa. Archivar y eliminar también incrementan la revisión; eliminar borra el historial del propio registro y nunca datos académicos base.

## Validación y reglas de integridad

- Lista blanca de campos por tipo de propuesta. Cualquier clave adicional —incluidas contraseñas, tokens o permisos— bloquea el guardado.
- Texto limitado a 2000 caracteres y sin HTML ni `javascript:`.
- Código ficticio con patrón `^DEMO-[A-Z0-9][A-Z0-9-]{2,35}$`; los códigos ya usados o reservados por otro borrador se rechazan.
- Alias de 2 a 60 caracteres, sin espacios dobles; un alias coincidente genera advertencia y nunca fusión automática.
- Estudiante: grado válido, exactamente un aula y ninguna asignatura manual (se derivan del aula).
- Monitor: aulas y asignaturas coherentes entre sí y un periodo explícito.
- Administrador: descripción de responsabilidad y sin matrícula, aula ni asignatura.
- Propuesta docente: las aulas propuestas deben tener al menos un curso compatible y recíproco.
- Periodo: debe existir en `academicPeriods`; la ausencia de periodo base de la fuente no se simula.
- Destinatario: debe existir en la institución y su revisión debe coincidir con la guardada.
- Propuestas equivalentes (mismo tipo, destinatario, rol, estado, aulas, cursos y periodo) se rechazan como duplicado.
- Conflicto de edición: si otra pestaña cambió la revisión, se informa y no se sobrescribe.
- Borrar o archivar un registro con propuestas dependientes se bloquea; las dependencias se muestran en un diálogo.

## Directorio, filtros y vistas de detalle

El directorio permite buscar por alias, código, rol, grado o aula; filtrar por rol, grado, aula, periodo, estado del registro, asignatura y dirección de orden; cambiar el tamaño de página (10, 20, 50) y navegar por páginas. El número de filas por página se recuerda con las preferencias del ámbito administrativo.

El estado del registro distingue «Registro disponible», «Borrador local», «Propuesta pendiente», «Datos incompletos», «Listo para presentar localmente» y «Archivado local».

Los detalles muestran información general, roles, relaciones académicas y propuestas asociadas. Desde un usuario se consultan sus aulas y asignaturas; desde un aula, su número de estudiantes y docente; desde un curso, sus unidades y lecciones del catálogo base. Los conteos proceden de las mismas fuentes compartidas que el resto de la aplicación.

El detalle administrativo del estudiante **no** muestra notas, calificaciones, grabaciones, conversaciones ni datos personales. El detalle del monitor muestra aulas y asignaturas del conjunto base.

## Matriz de roles y permisos

`roles-permisos.html` muestra 17 referencias de permisos con recurso, acción, alcance y celdas por rol: `courses.read`, `practice.solve`, `progress.read`, `evaluations.prepare`, `evaluations.review`, `users.read`, `users.create`, `users.update`, `users.deactivate`, `roles.read`, `roles.assign`, `classrooms.read`, `classrooms.manage`, `content.review`, `content.publish`, `reports.read` y `settings.manage`.

Son **contratos conceptuales de diseño**, no reglas ejecutables: la interfaz no concede acceso, no habilita funciones ocultas y no altera la navegación por rol. Cada fila abre una ficha que declara que un backend autorizado deberá validar identidad, permiso, institución y recurso. Estos identificadores son la referencia de diseño que un servicio real deberá consumir; en esta fase no se crea ningún documento ni endpoint de contrato.

Desde la misma vista se preparan tres propuestas locales:

- **Rol**: rol propuesto (`STUDENT`, `MONITOR`, `ADMIN`) y alcance de referencia (`own`, `classroom`, `institution`, `institution-admin`).
- **Estado**: `activation`, `deactivation` o `review`.
- **Asignación docente**: aulas, asignaturas y periodo para un Monitor.

El diálogo de confirmación recuerda de forma expresa que la propuesta **no concede permisos efectivos** ni altera cuentas, matrículas, notas o progreso. La suite comprueba que, tras guardar propuestas de rol, estado y asignación, los roles efectivos, el número de usuarios y de estudiantes y las métricas del Dashboard permanecen idénticos.

## Integración con el Dashboard (Fase 24)

Las tarjetas y menús que antes mostraban «Módulo en construcción» abren ahora vistas reales:

- Las tarjetas de **Estudiantes** y **Monitores** enlazan con `estudiantes.html` y `monitores.html`.
- El bloque de usuarios incluye cinco accesos directos: Usuarios, Estudiantes, Monitores, Roles y Permisos y Solicitudes locales.
- El personal listado enlaza con su ficha de detalle.
- El Sidebar: Usuarios, Estudiantes, Monitores y Seguridad y Permisos navegan a las vistas correspondientes.

**Cambio intencionado de comportamiento:** la suite `phase24.cjs` esperaba que la entrada «Usuarios» del Sidebar mostrara el diálogo «Módulo en construcción». Esa expectativa se actualizó porque la fase 25 sustituye ese diálogo por la navegación real. El resto de la suite 24 permanece igual y sigue pasando.

El bloque «Borradores administrativos» informa del número de propuestas locales separadas de las 78 identidades base y enlaza con las dos vistas de gestión.

## Privacidad y datos de menores

- No se solicitan ni almacenan contraseñas, tokens, correos, documentos, teléfonos, direcciones, fechas de nacimiento ni datos de contacto.
- Todos los identificadores son ficticios (`DEMO-…`, `demo-user-…`) y las identidades se representan por alias.
- La institución es la misma ficticia de la Fase 15; no se inventan códigos oficiales ni otras instituciones.
- No se muestran notas, grabaciones, conversaciones ni resultados individuales de menores en ninguna de las nueve vistas.
- Los estudiantes aparecen por alias de demostración, código ficticio, grado y aula: los mismos identificadores ya públicos en el conjunto base del proyecto.

## Preferencias, navegación e idioma

Sidebar, Topbar, notificaciones, menú móvil y coordinación de foco son los componentes comunes con configuración `admin`. Se reutilizan el logo, los estados de foco y el menú de usuario del Dashboard. Tema, contraste, tamaño de texto y movimiento reducido se aplican igual que en la Fase 24, con el ámbito `aithron.preferences.v1.demo-admin` separado de los perfiles docente y estudiantil.

El Dashboard mantiene la compatibilidad ES/EN de la Fase 24. Las nueve vistas de la Fase 25 se publican en español y fijan `lang="es"` de forma explícita para no declarar una traducción inexistente; el tema y las preferencias de accesibilidad sí se respetan.

## Offline

El botón **Preparar módulo offline** del directorio usa `prepareStaticResources`, el mismo Service Worker y las cachés existentes: prepara el Dashboard y las nueve vistas, siguiendo sus imports y hojas de estilo, y verifica cada archivo antes de informarlo. El fallback del Service Worker se amplía a las diez rutas administrativas, por lo que la navegación sin conexión devuelve la vista preparada y no una pantalla genérica.

Verificado en la suite: preparación, recarga bajo control del Service Worker, desconexión real del contexto, edición de un borrador sin red, persistencia tras recargar, búsqueda del registro editado y consulta de la matriz de permisos sin conexión. El módulo **Administración** del Dashboard continúa preparando su propia plantilla administrativa.

## Pruebas ejecutadas

```powershell
node tests/phase25.cjs
node tests/phase24.cjs
node tests/phase23.cjs
node tests/phase22.cjs
node tests/phase19.cjs
node tests/phase18.cjs
node tests/phase17.cjs
node tests/phase16.cjs
```

**Resultado: PASS en las ocho suites.**

La suite 25 comprueba:

- Migración conservadora a v6 y conservación de un registro previo de otro módulo.
- Directorio compartido: 78 identidades, 76 estudiantes, 1 monitor y 1 administrador; deduplicación y reparto por grado y aula.
- Búsqueda, filtros combinados, orden ascendente y descendente, paginación, tamaño de página y filtros conservados al recargar.
- Formulario adaptativo: perfil estudiante con validación de grado y aula, perfil monitor con aulas y asignaturas, perfil administrador con responsabilidad; guardado incompleto, edición posterior y conservación del identificador.
- Duplicado de un registro con alias y código propios; archivado, validación, dependencias y eliminación de propuestas.
- Bloqueos: código duplicado, institución ajena, campo no permitido, revisión obsoleta, borrado de un registro base y borrado con propuestas dependientes.
- Matriz de 17 permisos; propuestas de rol, estado y asignación con confirmación; roles, usuarios, estudiantes y métricas del Dashboard sin cambios tras las propuestas.
- Conflictos entre pestañas, conflicto de revisión y dependencia de propuestas.
- Preparación offline, edición sin conexión, persistencia y recarga de las nueve vistas.
- Responsive a 1440, 768 y 320 px sin desbordamiento horizontal, enlaces internos resolubles y auditoría axe-core WCAG 2 A/AA y 2.1 AA sin infracciones en las nueve vistas.
- Identificador inexistente, institución ajena y parámetros repetidos con estados recuperables.
- Dashboard con enlaces reales, sin llamadas a `/api/` ni a orígenes externos y sin errores de consola.

Las suites de regresión verificaron Estudiantes/Aulas, Evaluaciones, Notas/Reportes, Tareas/Refuerzos, Content Studio, Cuenta docente y Dashboard administrativo. No se afirma una prueba exhaustiva de todas las fases, navegadores, lectores de pantalla o dispositivos físicos.

Python, Playwright y axe-core se usan solo para pruebas. `PLAYWRIGHT_MODULE` y `AXE_CORE_MODULE` permiten configurar sus rutas; el frontend no incorpora estas bibliotecas como dependencias de ejecución.

## Archivos creados

- `frontend/admin/usuarios.html`, `editar-usuario.html`, `detalle-usuario.html`, `estudiantes.html`, `detalle-estudiante.html`, `monitores.html`, `detalle-monitor.html`, `roles-permisos.html`, `solicitudes-usuarios.html`.
- `frontend/css/admin/users.css`.
- `frontend/js/admin/admin-shell.js` (Shell común, navegación real y preferencias).
- `frontend/js/admin/users-workspace.js` (controlador del directorio, filtros, detalles y solicitudes).
- `frontend/js/admin/user-editor.js` (formulario adaptativo de registro).
- `frontend/js/admin/user-proposals.js` (matriz de permisos y propuestas de rol, estado y asignación).
- `frontend/js/components/admin-user-ui.js` (tabla, resumen, estados, acciones y matriz).
- `frontend/js/services/admin-users.service.js` (adaptadores de solo lectura del directorio compartido).
- `frontend/js/services/admin-user-drafts.service.js` (borradores, versiones, validación, archivo, copia y eliminación transaccional).
- `frontend/js/utils/admin-user-validation.js` (reglas de validación comunes).
- `frontend/js/data/admin-permissions.data.js` (referencias de permisos, tipos de propuesta y estados).
- `tests/phase25.cjs`.
- `docs/phase25.md`.

## Archivos modificados por la Fase 25

- `frontend/js/offline/database-schema.js`: versión 6 y almacenes `adminUserRequests` y `adminUserRequestVersions`.
- `frontend/sw.js`: fallback offline para las diez rutas administrativas.
- `frontend/js/admin/dashboard.js`: navegación real, enlaces rápidos y bloque de borradores administrativos.
- `frontend/js/components/admin-dashboard-ui.js`: enlaces reales en las tarjetas con destino existente.
- `frontend/js/admin/admin-shell.js`: rutas reales del módulo y fijación de idioma español.
- `frontend/css/admin/dashboard.css`: estilos de los enlaces rápidos y de las fichas.
- `tests/phase24.cjs`: expectativa de navegación «Usuarios» actualizada al cambio intencionado.
- `README.md`.

## Contratos y trabajo pendiente

Los adaptadores locales deberán sustituirse mediante contratos autorizados para usuarios, roles, permisos, aulas, matrículas, catálogo, versiones aprobadas, solicitudes de revisión, estadísticas agregadas, reportes, actividad, auditoría y salud de servicios. Esos contratos necesitan identidad, institución, permiso, alcance, fecha, versiones y procedencia verificables.

Quedan pendientes: autenticación real, CRUD institucional de usuarios, matrículas, gestión efectiva de roles y permisos, flujo de aprobación y publicación, perfil administrativo completo, configuración institucional, reportes oficiales, auditoría protegida, sincronización entre dispositivos y traducción ES/EN de este módulo.

No hay tokens ni credenciales administrativas, endpoints ficticios, modificación de notas, confirmaciones de servidor ni operaciones institucionales simuladas.

**La implementación se detiene en la Fase 25 para revisión. No se inicia la Fase 26.**
