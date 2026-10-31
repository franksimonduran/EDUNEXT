# EDUNEXT — Plataforma Educativa Inteligente (candidato interno Web/PWA)

**EDUNEXT es la nueva identidad de la plataforma anteriormente denominada AITHRON EDU.**

Ver [migración de identidad](docs/EDUNEXT_BRAND_MIGRATION.md).

**Traductor local inglés ↔ español (2026-10-29):** adaptador Argos y modelos probados
con textos sintéticos; uso local e integración web en
[guía de EDUNEXT Translate](docs/ARGOS_TRANSLATE_SETUP.md). No equivale a habilitación
institucional ni validación PostgreSQL; producción/piloto mantienen NO-GO.

**MiniCPM local experimental (2026-10-30):** MiniCPM5-2B Q4_K_M (GGUF, Apache-2.0) con
wllama 3.8.1 como opción explícita del tutor, ejecutada en CPU/WASM y sólo con material
demo. Ver [uso y límites](docs/LOCAL_MINICPM_SETUP.md). No sustituye Argos ni la
autenticación/backend; no autoriza uso con alumnos reales.

## Estado vigente al cierre del plan inicial — NO-GO

**Revisión de despliegue (2026-10-31):** importación/OpenAPI y contratos aislados
verificados; corregida la revisión esperada de Alembic en Compose. PostgreSQL,
E2E autenticado y despliegue real siguen pendientes. Ver
[revisión de integración y bloqueos](docs/DEPLOYMENT_READINESS_REVIEW_2026-10-31.md).
Preparación adicional sin instalar/iniciar servicios:
[entorno local EDUNEXT y compatibilidad de nombres](docs/EDUNEXT_LOCAL_INTEGRATION_PREPARATION.md).

**Continuación de integración (2026-10-26, evidencia UTC 2026-10-27):** dependencias
Python corregidas, entorno temporal aislado, contratos/ASGI y OpenAPI ejecutados;
Insights conectado a vistas API existentes. No valida PostgreSQL ni E2E autenticado.
El estado sigue **parcial/NO-GO**. Ver
[informe actualizado Fase 47](docs/PHASE_47_CONTINUATION_2026-10-27.md).
Las actas/evidencias históricas siguientes no se reescriben como aprobación.

**Continuación de seguridad (UTC 2026-10-27):** correcciones focales de archivos,
limitador y JWT verificadas; SCA/SBOM y medición ASGI limitada ejecutadas. Permanecen
avisos de dependencias y faltan PostgreSQL/E2E esenciales: **Fase 48 BLOQUEADA**.
[Informe A–Z y evidencias](docs/PHASE_48_CONTINUATION_2026-10-27.md). No autoriza Fase 49.

Objetivo: aprendizaje para 4.º, 5.º y 6.º de primaria en Perú, con perfiles Estudiante,
Monitor/Docente y Administrador y operación offline-first como objetivo, no capacidad
integral ya certificada. **El proyecto requiere correcciones y validación adicional;
no está finalizado, aceptado para usuarios reales o lanzado.**

| Estado separado | Resultado real |
|---|---|
| Software implementado | Parcial; numerosas vistas/datos son demostrativos |
| Software verificado | Ámbitos locales de contratos/fuente/fixtures y navegador demo |
| Piloto preparado | Plan, instrumentos, protocolos y materiales; no readiness técnico |
| Piloto autorizado / ejecutado / evaluado | No |
| Producción autorizada / desplegada / verificada | No |

Arquitectura conservada: HTML5/CSS3/JavaScript ES6, Fetch/IndexedDB/SW; backend
Python/FastAPI/Pydantic, PostgreSQL/SQLAlchemy/Alembic. Sin framework frontend nuevo.
AI, Insights y Sync tienen límites/bloqueos explícitos; no simulan servicios reales.

### Documentación principal y manuales

- [Informe de entrega](docs/final/FINAL_DELIVERY_REPORT.md), [estado de las 50 fases](docs/final/FINAL_SYSTEM_INVENTORY.md), [matriz](docs/final/FINAL_ACCEPTANCE_MATRIX.md).
- [Aceptación Fase 50](docs/final/PHASE_50_ACCEPTANCE.md), [decisión NO-GO](docs/final/FINAL_GO_NO_GO_DECISION.md), [limitaciones](docs/final/FINAL_KNOWN_LIMITATIONS.md).
- [Estudiante](docs/manuals/STUDENT_USER_MANUAL.md), [Monitor](docs/manuals/MONITOR_USER_MANUAL.md), [Administrador](docs/manuals/ADMIN_USER_MANUAL.md).
- [Manual técnico](docs/manuals/TECHNICAL_ADMINISTRATION_MANUAL.md), [instalación](docs/manuals/INSTALLATION_GUIDE.md), [offline](docs/manuals/OFFLINE_AND_SYNC_GUIDE.md), [privacidad](docs/manuals/PRIVACY_AND_SAFETY_GUIDE.md), [FAQ](docs/manuals/FAQ.md).
- [Plan piloto](docs/pilot/PILOT_OBJECTIVES.md), [formación no impartida](docs/pilot/PILOT_TRAINING_PLAN.md), [soporte](docs/operations/SUPPORT_GUIDE.md), [mantenimiento](docs/operations/MAINTENANCE_PLAN.md).
- [Estructura real](PROJECT_STRUCTURE.md), [restricciones de agentes](AGENTS.md), [cambios](CHANGELOG.md), [licencias pendientes](docs/final/FINAL_LICENSE_REVIEW.md).

### Ejecución técnica local permitida

Desde esta raíz con Node disponible:

```powershell
node tools/final-inventory.cjs
node tools/run-final-validation.cjs
```

Consultar los resultados en docs/final/evidence; no equivalen a login real, E2E
PostgreSQL, piloto o certificación. Git/Docker/herramientas PostgreSQL/age no están
disponibles y Python es alias de Store en el entorno usado. Instalación/backend/
Compose/HTTPS/restore siguen sin probar; seguir la guía y no tocar bases desconocidas.

Versión de producto declarada: 0.1.0; candidato **interno** 0.1.0-validation.1,
sin tag/release público. Tras revisar pruebas se genera manifiesto de hashes con
`node tools/final-inventory.cjs --freeze` y se comprueba con `--verify`; no desplegará
ni certificará el producto. No adjuntar .env privado, dumps, claves o datos personales.
En una copia ya congelada, usar `--verify` en vez de regenerar su inventario.
Las revalidaciones finales se guardan en subdirectorios nuevos para preservar la evidencia congelada.

Seguridad: actas 47/48 no aceptadas y 49 parcial. No crear cuentas reales, importar
matrículas, activar AI/voz/Sync, registrar menores, enviar comunicaciones o publicar
sin autorización y gates satisfechos. No convertir puntos a AD/A/B/C ni borrar
respuestas/IDB/volúmenes. No hay canal de soporte o responsable institucional confirmado.

## Historial de fases anteriores (no sustituye el estado vigente)

## Fase 49 — infraestructura parcialmente preparada, sin despliegue

Dockerfiles, Compose local, entornos, CI y gate manual, readiness de PostgreSQL,
TLS de DB, logs JSON, manifiesto PWA y herramientas de backup/smoke preparados.
No se ejecutaron Docker, Python, CI remoto, staging, HTTPS ni restauración.
Producción sigue **bloqueada por Fase 48**; no está autorizada ni lista para menores.
Ver [informe A–X](docs/PHASE_49_REPORT.md), [arquitectura](docs/DEPLOYMENT_ARCHITECTURE.md),
[runbook local](docs/DOCKER_DEPLOYMENT.md), [resultados](docs/DEPLOYMENT_TEST_RESULTS.md)
y [aceptación](docs/PHASE_49_ACCEPTANCE.md).
Contratos de infraestructura: `node tests/phase49-infra.cjs`.
Las imágenes de release exigen un lock con hashes que todavía no existe.

## Fase 48 — auditoría parcial; gate de producción bloqueado

Correcciones focales de aislamiento, sesiones, logs, archivos y caché privada.
Pruebas Node y login estático en Edge/Chrome; backend/PostgreSQL y E2E autenticados
siguen sin validación. La aprobación de producción continúa bloqueada.
Ver [informe A–Z](docs/SECURITY_AUDIT_REPORT.md),
[hallazgos](docs/VULNERABILITY_REGISTER.md),
[aceptación](docs/PHASE_48_ACCEPTANCE.md) y
[archivos de esta fase](docs/PHASE_48_CHANGED_FILES.md).
Regresión acotada: `node tools/run-phase48-regression.cjs`.
Login en navegadores locales: `node tests/phase48-browser.cjs`.
El SW ahora restringe caché a activos públicos y no sirve HTML autenticado offline
desde cachés heredadas; no se borran respuestas ni almacenes locales.

## Fase 47 — integración parcial, aceptación bloqueada

Inventario estático: 176 páginas, 258 decoradores de endpoints y 11 migraciones.
Se mejoró el cliente HTTP y se protegió la suite backend que recrea esquemas.
No se acreditan flujos E2E ni PostgreSQL operativo en este entorno.
Ver [acta de aceptación](docs/PHASE_47_ACCEPTANCE.md),
[resultados reales](docs/INTEGRATION_TEST_RESULTS.md) y
[entorno/configuración API](docs/INTEGRATION_ENVIRONMENT.md).
La API usa ahora `/api/v1` same-origin o `AITHRON_CONFIG.apiBaseUrl` público;
el servidor estático de las instrucciones históricas no aporta proxy API.
Pruebas backend requieren base desechable explícita y consentimiento para recrear esquema.

## AITHRON AI Engine — Fase 45 (parcial, generación bloqueada)

Gateway, adaptador Ollama local configurable, políticas, cuotas, contexto publicado
y privacidad. No hay modelo operativo verificado en este entorno: Tutor/traducción
generativos permanecen deshabilitados. Vocabulario reutilizado y práctica de
referencia no se presentan como IA ni evaluación fonética. Pantallas existentes
Tutor/Traductor/Pronuncia admiten `modo=api`; configuración en
`admin/estado-servicios.html?modo=api`. Ver
[AITHRON_AI_ARCHITECTURE](docs/AITHRON_AI_ARCHITECTURE.md),
[AI_PROVIDER_CONFIGURATION](docs/AI_PROVIDER_CONFIGURATION.md),
[AI_TEST_RESULTS](docs/AI_TEST_RESULTS.md) y [AI_KNOWN_LIMITATIONS](docs/AI_KNOWN_LIMITATIONS.md).

## AITHRON Reports Engine — Fase 43 (parcial)

Reportes reales personales, docentes e institucionales con fuentes PostgreSQL,
metadatos, filtros estrictos, matrícula histórica, privacidad de grupos pequeños y
CSV seguro. Pantallas: `student/progreso.html?modo=api&vista=reportes`,
`monitor/reportes.html?modo=api` y `admin/reportes.html?modo=api`.
Prácticas/evaluaciones/competencias confirmadas siguen no disponibles; no se
convierten porcentajes a AD/A/B/C. Ver
[REPORTS_ENGINE_ARCHITECTURE](docs/REPORTS_ENGINE_ARCHITECTURE.md),
[REPORT_TEST_RESULTS](docs/REPORT_TEST_RESULTS.md) y
[REPORT_KNOWN_LIMITATIONS](docs/REPORT_KNOWN_LIMITATIONS.md).

## AITHRON Academic Planner — Fase 42 (parcial)

Backend real de tareas de texto, entregas, feedback, refuerzos y calendario.
Integración inicial: `student/agenda.html?grade=4&modo=api` y
`monitor/tareas.html?modo=api`. `modo=demo` conserva los ejemplos previos.
Las tareas son formativas y no modifican AD/A/B/C. Adjuntos privados y borradores
offline autenticados siguen pendientes. Arquitectura y aceptación:
[ACADEMIC_PLANNER_ARCHITECTURE](docs/ACADEMIC_PLANNER_ARCHITECTURE.md),
[PLANNER_KNOWN_LIMITATIONS](docs/PLANNER_KNOWN_LIMITATIONS.md).

## Seguimiento del aprendizaje — Fase 41 (parcial)

API real de finalización de lecciones, progreso propio por unidad/curso, historial
y dos reconocimientos personales. La pantalla `student/progreso.html?grade=4&modo=api`
consume FastAPI; `modo=demo` conserva los ejemplos locales. Las finalizaciones son
declaraciones de revisión registradas, no notas ni dominio de competencia.
Prácticas, juegos y competencias confirmadas permanecen no disponibles hasta
verificar sus fuentes. Arquitectura, pruebas y límites:
[PROGRESS_ENGINE_ARCHITECTURE](docs/PROGRESS_ENGINE_ARCHITECTURE.md),
[PROGRESS_TEST_RESULTS](docs/PROGRESS_TEST_RESULTS.md),
[PROGRESS_KNOWN_LIMITATIONS](docs/PROGRESS_KNOWN_LIMITATIONS.md).

Frontend realizado con HTML5, CSS3 y JavaScript ES6 mediante módulos. Sin dependencias de ejecución ni proceso de compilación. Incluye Login, Registro, Recuperación, Restablecimiento, vista previa de perfiles, Dashboard, AITHRON APRENDE, AITHRON PRACTICA Y JUEGOS y AITHRON TUTOR. El backend FastAPI/PostgreSQL implementa autenticación, personas y organización académica; varias pantallas administrativas todavía usan datos de demostración.

## Organización académica — Fase 37

El backend incorpora años y periodos académicos, grados, secciones, aulas, matrículas, traslados, retiros, culminación, historial de movimientos y asignaciones docentes. Todas las consultas se filtran por institución y aplican permisos por rol. La creación de matrículas y los traslados admiten `Idempotency-Key`, y el cupo se protege con bloqueo transaccional.

El cliente `frontend/js/services/academic-organization.service.js` consume el contrato. Las pantallas `admin/matriculas.html`, `admin/aulas.html`, `admin/asignaciones-docentes.html` y `admin/movimientos-academicos.html` aún no están conectadas al API. Contrato, reglas y verificación: [docs/phase37.md](docs/phase37.md).

## Gestión de Usuarios, Roles y Permisos — Fase 25

Abrir `/admin/usuarios.html` desde el Dashboard administrativo o usar el menú lateral. Incluye nueve vistas: directorio de usuarios, preparación de registros ficticios, detalle con relaciones, directorio de estudiantes, detalle administrativo del estudiante, directorio de monitores, detalle del monitor, matriz de roles y permisos y listado de solicitudes locales.

Los registros base (78 identidades: 76 estudiantes, 1 monitor y 1 administrador) se muestran separados de los borradores y propuestas locales guardados en este dispositivo. Las propuestas de rol, estado o asignación docente se validan, se versionan y se archivan, pero **no conceden permisos efectivos, no crean cuentas y no matriculan**. La matriz de 17 permisos es descriptiva y la institución, los alias y los códigos son ficticios.

Pruebas: `node tests/phase25.cjs`. Vistas, modelo local, validaciones, integración con el Dashboard, offline, archivos y pendientes: [docs/phase25.md](docs/phase25.md).

## Centro de Control del Administrador — Fase 24

Abrir `/admin/index.html` o seleccionar **Administrador** en el selector de perfiles de demostración. El panel reúne métricas agregadas, filtros, gráficos SVG, organización de aulas y asignaturas, propuestas locales por revisar, actividad conocida, avisos y comprobaciones de almacenamiento/servicios del dispositivo.

Reutiliza los datos de los módulos anteriores y los componentes de navegación, preferencias y accesibilidad. Las vistas de usuarios, estudiantes, monitores y permisos ya son funcionales desde la Fase 25; el resto de módulos administrativos posteriores muestran su estado de construcción. No hay administración real de cuentas, aprobación, auditoría institucional ni conexión a FastAPI/PostgreSQL.

Pruebas: `node tests/phase24.cjs`. Definiciones de métricas, alcance de filtros, archivos, comprobaciones y pendientes: [docs/phase24.md](docs/phase24.md).

## Perfil y Configuración del Monitor — Fase 23

Abrir `/monitor/perfil.html` o `/monitor/configuracion.html`. Incluye personalización local de avatar/alias, ocho vistas de cuenta, idioma ES/EN compatible, tema claro/oscuro/automático, accesibilidad y preferencias aplicadas al Dashboard, estudiantes, calendario, editor y reportes. Reutiliza los avisos de la Fase 21; no implementa autenticación, cambios reales de contraseña ni seguridad ficticia.

Pruebas: `node tests/phase23.cjs`. Arquitectura, ámbitos de preferencias, ejecución, comprobaciones offline y pendientes: [docs/phase23.md](docs/phase23.md).

## AITHRON CONTENT STUDIO — Fase 22

Abrir `/monitor/cursos.html` o **Mis Cursos** desde el Dashboard del Monitor. Incluye nueve vistas para consultar cursos, unidades y lecciones; preparar borradores; editar trece tipos de bloque; seleccionar recursos existentes; previsualizar contenido y organizar propuestas locales.

Los borradores, revisiones y restauraciones se guardan en la misma base IndexedDB de la aplicación. El editor ofrece autoguardado de modelos válidos, validación técnica, advertencia de cambios pendientes y preparación/verificación offline explícita. El catálogo del estudiante permanece separado de las propuestas locales.

Pruebas: `node tests/phase22.cjs`. Ejecución, archivos, resultados, recorrido offline y contratos pendientes de FastAPI: [docs/phase22.md](docs/phase22.md). No hay publicación institucional ni distribución entre dispositivos.

## AITHRON REFUERZA — Fase 19

Abrir `/monitor/tareas.html` o `/monitor/refuerzos.html` para crear borradores, seleccionar recursos reales, ordenar etapas y preparar destinatarios grupales/individuales/diferenciados. Las configuraciones, observaciones y registros ficticios son locales: no se publican tareas ni se distribuyen entre dispositivos.

El selector puede preparar y verificar recursos offline; no confía en indicadores antiguos sin comprobar archivos. Pruebas: `node tests/phase19.cjs`. Rutas, modelo, archivos, recorridos offline, resultados y pendientes: [docs/phase19.md](docs/phase19.md).

## Notas y reportes docentes — Fase 18

Abrir `/monitor/notas.html` para consultar resultados de fase 17, filtrar registros por aula/curso/periodo, abrir historiales y preparar reportes grupales o individuales. Incluye impresión nativa y CSV seguro de demostración. Los puntajes no se duplican ni se convierten en notas oficiales.

La carga opcional de ejemplos amplía los intentos ficticios a las cinco asignaturas, preservando borradores modificados. La preparación offline incluye las nuevas vistas. Pruebas: `node tests/phase18.cjs`. Detalle de rutas, archivos, reglas, resultados y pendientes: [docs/phase18.md](docs/phase18.md).

## Evaluaciones docentes — Fase 17

Abrir `/monitor/evaluaciones.html` para crear y guardar borradores, configurar nueve tipos de pregunta, preparar programación local y revisar intentos ficticios. Reutiliza navegación docente, renderizador de preguntas e IndexedDB existentes. No publica evaluaciones ni notas reales.

El catálogo permite preparar explícitamente las ocho vistas docentes para trabajar sin conexión. La suite `node tests/phase17.cjs` verifica guardado, recarga offline y recuperación de correcciones. Instrucciones, archivos, resultados y límites: [docs/phase17.md](docs/phase17.md).

## Visualizar localmente

Desde PowerShell, con Python 3 instalado:

```powershell
Set-Location "D:\Programing\ATHRON EDU"
python -m http.server 8080 --bind 127.0.0.1 --directory frontend
```

Abrir **http://127.0.0.1:8080/login.html**. Detener el servidor con `Ctrl+C`. Servir por HTTP es necesario para los módulos JavaScript; no abrir el HTML con `file://`.

| Pantalla | Dirección local | Comportamiento |
| --- | --- | --- |
| Inicio de sesión | `/login.html` | Correo o usuario, contraseña y acceso a Registro/Recuperación. |
| Registro | `/register.html` | Acceso escolar por código e identificador; invitación docente con nombre, correo y contraseña. Sin registro público de administradores. |
| Recuperación | `/forgot-password.html` | Solicitud mediante correo institucional y alternativa de ayuda docente para estudiantes. |
| Restablecimiento | `/reset-password.html` | Contraseña nueva, requisitos y confirmación; exige futura autorización del servidor. |
| Selección de perfiles | `/role-selection.html` | Vista previa de Estudiante, Monitor y Administrador con módulos de muestra en construcción. |
| Acceso no autorizado | `/unauthorized.html` | Estado visual de muestra con enlaces de regreso al inicio y a los perfiles. |
| Dashboard del estudiante | `/student/index.html` | Interfaz académica demostrativa para 4.º, 5.º y 6.º, en español e inglés. |
| Mis cursos | `/student/aprende.html?grade=4` | Catálogo con filtros y cinco asignaturas por grado. |
| Curso | `/student/curso.html?grade=4&course=math` | Resumen, objetivos y unidades de Matemática. |
| Unidad | `/student/unidad.html?grade=4&course=math&unit=math-g4-u1` | Cuatro lecciones de Fracciones básicas. |
| Lección | `/student/leccion.html?grade=4&course=math&unit=math-g4-u1&lesson=math-g4-u1-l1` | Leer, escuchar audio real, visualizar y practicar. |
| Prácticas | `/student/practica.html?grade=4` | Catálogo formativo con filtros combinados. |
| Resolver práctica | `/student/ejercicio.html?grade=4&activity=practice-math-4` | Preguntas, pistas, comprobación y resultado local. |
| Juegos | `/student/juegos.html?grade=4` | Cinco categorías de minijuegos por grado. |
| Jugar | `/student/juego.html?grade=4&activity=game-memory-4` | Memoria educativa y otras modalidades por ID. |
| Resultados | `/student/resultado-practica.html` | Muestra el resultado de un intento terminado y válido; sin intento no inventa cifras. |
| Aithron Tutor | `/student/tutor.html?grade=5` | Asistente educativo con explicaciones predefinidas y estrategias. |
| Dashboard del administrador | `/admin/index.html` | Métricas agregadas, filtros, avisos y comprobaciones de almacenamiento del dispositivo. |
| Gestión de usuarios | `/admin/usuarios.html` | Directorio de identidades base y borradores locales; sin cuentas reales ni permisos efectivos. |

Todas las rutas usan el mismo origen `http://127.0.0.1:8080`. El enlace a Restablecimiento permite revisar la interfaz; no representa una autorización válida.

## Fase 6: AITHRON PRACTICA Y JUEGOS

Abrir **http://127.0.0.1:8080/student/practica.html?grade=4** o **http://127.0.0.1:8080/student/juegos.html?grade=4**. Ambos módulos están conectados al Dashboard, al Sidebar y a Aprende. La pestaña Practicar de cada lección conserva el ejercicio introductorio y añade acceso a la práctica completa.

Incluye **15 prácticas de cuatro preguntas (60 preguntas)** y **15 juegos**, cinco modalidades por grado: memoria, relacionar, ordenar, completar palabras y reto sin límite de tiempo. Los siete componentes de pregunta admiten teclado y retroalimentación educativa.

Los resultados se calculan desde las respuestas dadas. El porcentaje usa la primera comprobación, permite reintentos sin inflar la puntuación y registra las pistas. Puntos/estrellas son recompensas de muestra, no notas académicas ni un sistema global de logros.

Los intentos se guardan temporalmente en **SessionStorage**, exclusivamente bajo `aithron.demo.activities.v1`. Permite recargar o cambiar de idioma sin perder la respuesta y reanudar desde el catálogo. No guarda credenciales, permisos ni registros académicos oficiales. Si el almacenamiento está bloqueado, se puede terminar y ver el resultado en la misma página, con una explicación de la limitación.

**Archivos, arquitectura, pruebas y pendientes:** [docs/phase6.md](docs/phase6.md).

- [Catálogo de prácticas](docs/previews/practice-catalog-desktop.png)
- [Ejercicio en móvil](docs/previews/practice-exercise-mobile.png)
- [Catálogo de juegos](docs/previews/games-catalog-desktop.png)
- [Memoria con parejas encontradas](docs/previews/game-memory-complete.png)
- [Resultado formativo](docs/previews/practice-results-desktop.png)
- [Resultado en móvil](docs/previews/practice-results-mobile.png)

## Fase 7: AITHRON TUTOR IA

Abrir **http://127.0.0.1:8080/student/tutor.html?grade=5**. Incluye interfaz de chat educativo con bienvenida, preguntas sugeridas, 15 ejemplos predefinidos (tres grados × cinco asignaturas), estrategias de aprendizaje ("No entendí"), conversaciones temporales, panel de contexto académico y estados de disponibilidad honestos.

Incluye **15 ejemplos predefinidos** (tres grados × cinco asignaturas) con explicaciones, ejemplos, pistas, preguntas orientadoras, diagramas y representaciones matemáticas (fracciones, decimales, porcentajes). Las respuestas son preescritas en español; los controles admiten español e inglés.

Estrategias "No entendí": explicación sencilla, paso a paso, otro ejemplo, dibujo, pista, práctica y tutor. Se conecta desde la lección mediante "No entendí" y transmite IDs válidos de grado/curso/unidad/lección.

Conversaciones temporales en memoria (máx. 10 conversaciones, 80 mensajes), con borrado confirmado y borrador conservado al cambiar. Panel de contexto con grado, curso, unidad, lección y tema; en móvil es desplegable. Estados: demostración, offline, no disponible y error; nunca simula IA conectada.

Privacidad: "Recuerda: no compartas tus datos personales". No hay LocalStorage, SessionStorage ni IndexedDB; conversaciones solo en memoria y no se persisten al recargar. No hay claves API, no se envía HTML ejecutable, no se guardan datos personales.

Integración: Sidebar → Tutor, Topbar → Tutor, Dashboard → Tutor, Lección → "No entendí" → Tutor (con IDs reales), Dashboard → Accesos rápidos → Tutor.

**Archivos, arquitectura, pruebas y pendientes:** [docs/phase7.md](docs/phase7.md).

- [Bienvenida escritorio](docs/previews/tutor-welcome-desktop.png)
- [Bienvenida móvil](docs/previews/tutor-welcome-mobile.png)
- [Conversación escritorio](docs/previews/tutor-conversation-desktop.png)
- [Conversación móvil](docs/previews/tutor-conversation-mobile.png)

## Fase 6: AITHRON PRACTICA Y JUEGOS

Abrir **http://127.0.0.1:8080/student/aprende.html?grade=4** o entrar desde «Mis cursos» en el Dashboard. El botón «Continuar aprendiendo» del Dashboard abre una lección válida, conservando el grado de muestra y el idioma.

Incluye **15 cursos, 15 unidades y 60 lecciones de muestra** para los tres grados, con datos separados de las plantillas. Cada lección dispone de lectura, narración WAV real con transcripción, diagrama original, ejercicio introductorio y panel «No entendí» con explicaciones preescritas. Los archivos de audio ya están incluidos: no se necesita instalar una voz para reproducirlos.

Los filtros funcionan sin inventar cursos descargados. Las descargas siguen pendientes de motor offline y los ejercicios no guardan notas ni alteran el avance. El contenido académico de esta muestra está en español; los controles del módulo admiten español e inglés.

**Archivos, pruebas, recursos y pendientes:** [docs/phase5.md](docs/phase5.md).

- [Catálogo de cursos](docs/previews/aprende-catalog-desktop.png)
- [Detalle de curso](docs/previews/aprende-course-desktop.png)
- [Unidad](docs/previews/aprende-unit-desktop.png)
- [Lección en escritorio](docs/previews/aprende-lesson-desktop.png)
- [Lección en móvil](docs/previews/aprende-lesson-mobile.png)
- [Reproductor real](docs/previews/aprende-lesson-audio.png)
- [Panel «No entendí»](docs/previews/aprende-lesson-help.png)

## Fase 4: dashboard del estudiante

Abrir **http://127.0.0.1:8080/student/index.html**. Incluye sidebar de 14 secciones, topbar, cuatro estadísticas, continuación de lección, cinco cursos, progreso, actividad reciente, evaluaciones próximas, misión diaria y cinco accesos rápidos.

La vista está identificada como demostración. Permite explorar tres grados de muestra y cambiar la interfaz entre español e inglés sin guardar datos académicos o permisos. Las áreas futuras abren avisos de «Próximamente» o fichas ilustrativas; ningún botón abre una lección, evaluación o servicio IA real.

En móvil se muestra navegación inferior de cinco accesos y un menú adicional accesible desde el icono de la cabecera. Los paneles usan diálogos nativos con cierre por botón/Escape, contención del foco y retorno al activador. Hay un indicador orientativo de conectividad y un aviso claro de que todavía no se han instalado descargas ni soporte offline.

**Documentación completa, archivos, pruebas y pendientes:** [docs/phase4.md](docs/phase4.md).

- [Captura de escritorio](docs/previews/student-dashboard-desktop-viewport.png)
- [Captura de móvil](docs/previews/student-dashboard-mobile-viewport.png)
- [Dashboard completo](docs/previews/student-dashboard-desktop.png)
- [Tablet](docs/previews/student-dashboard-tablet.png)

No se modificaron las pantallas ni los servicios de las fases anteriores. La navegación autenticada continúa desactivada; esta página es una previsualización pública con datos ficticios.

## Fase 3: vista previa de perfiles

Abrir directamente **http://127.0.0.1:8080/role-selection.html**. La pantalla está identificada como demostración y no se abre como resultado de un inicio de sesión exitoso ficticio.

Las tres tarjetas abren una sección local de **Módulo en construcción**, sin dashboards ni operaciones. El selector «Escenario de vista previa» permite revisar todos los perfiles, solo Estudiante, Estudiante y Monitor, ningún perfil y un ejemplo explícito de error con reintento. Los escenarios no representan roles verificados y no se persisten.

Se implementan estados normal, hover, foco, seleccionado (con texto y `aria-pressed`), deshabilitado, carga, error y acceso no autorizado. La selección mantiene el foco de forma lógica entre tarjeta y previsualización, con avisos accesibles y soporte para movimiento reducido.

### Navegación preparada

- `js/core/roles.js`: roles conocidos, metadatos y validación de listas.
- `js/core/navigation.js`: resolución pura de un perfil hacia su ruta; múltiples perfiles requieren selección; perfiles vacíos o no asignados devuelven acceso no autorizado.
- `navigateAuthenticated()`: consulta `getAuthorizedSession()` del servicio antes de cualquier redirección; no recibe una sesión construida por el llamador.
- `getAuthorizedSession()` rechaza explícitamente la consulta mientras no exista backend.
- `roleModulesReady` permanece en `false`; las rutas futuras `student/index.html`, `monitor/index.html` y `admin/index.html` no se enlazan ni visitan desde la demostración.
- El navegador no constituye una frontera de autorización. El servidor deberá comprobar la sesión y los permisos de cada operación y destino.

Nuevos archivos: `role-selection.html`, `unauthorized.html`, `css/app-shell.css`, `css/pages/role-selection.css`, `css/pages/unauthorized.css`, `js/pages/role-selection.js`, `js/core/roles.js` y `js/core/navigation.js`. El encabezado reutilizable usa el mismo patrón semántico `.app-header` y los estilos compartidos de `app-shell.css` en ambas páginas.

Modificados en fase 3: `css/variables.css` (tokens morado/verde), `js/core/config.js` (rutas y activación futura), `js/services/auth.service.js` (consulta de sesión pendiente) y este documento. No se modificó el HTML, CSS particular ni la lógica de Login/Registro.

### Capturas de fase 3

- [Escritorio: selección de perfiles](docs/previews/role-selection-desktop.png)
- [Móvil: selección de perfiles](docs/previews/role-selection-mobile.png)
- [Perfil seleccionado y módulo en construcción](docs/previews/role-selection-selected.png)
- [Tarjetas deshabilitadas](docs/previews/role-selection-disabled.png)
- [Carga](docs/previews/role-selection-loading.png)
- [Error](docs/previews/role-selection-error.png)
- [Acceso no autorizado, escritorio](docs/previews/unauthorized-desktop.png)
- [Acceso no autorizado, móvil](docs/previews/unauthorized-mobile.png)

### Verificaciones ejecutadas en fase 3

Microsoft Edge headless con Playwright externo al frontend:

- Ambas páginas a 320, 375, 768, 1024, 1440 y 1920 px, sin desbordamiento horizontal y con tarjetas de altura uniforme.
- Recursos y enlaces locales con respuesta HTTP 200; navegación de ida y regreso entre Perfiles y Acceso no autorizado.
- Hover, foco, selección individual, tres previsualizaciones, regreso del foco y teclado (Enter).
- Escenarios deshabilitados, ausencia de perfiles, error explícito y reintento.
- Carga y bloqueo de interacciones duplicadas, seguidos de restauración de controles.
- Resolución de los tres roles individuales, múltiples roles, selección permitida, selección no asignada, lista vacía, duplicados y rechazo de formatos desconocidos.
- El intento de navegación autenticada falla con el servicio pendiente; no visita rutas privadas.
- Cambiar `disabled` de un botón no supera la comprobación del escenario; URL y LocalStorage modificados no autentican ni preseleccionan perfiles.
- Sin credenciales, sin escrituras de la app en LocalStorage, SessionStorage o IndexedDB, sin peticiones de modificación y sin errores de consola/JavaScript.
- Movimiento reducido y botones deshabilitados sin JavaScript.
- Suite de fase 2 repetida: Login, Registro, Recuperación y Reset mantienen sus validaciones, navegación y responsive.
- Capturas nuevas generadas y revisión visual de escritorio, móvil, acceso no autorizado y selección.

La referencia de perfiles tampoco aparece en el ZIP disponible; se conserva la identidad existente. No se ha verificado con lector de pantalla físico ni otros motores de navegador. Las rutas privadas y la redirección con una sesión auténtica quedan pendientes de integración real.

## Archivos

- `frontend/login.html`: estructura semántica, etiquetas, enlaces y regiones accesibles.
- `frontend/css/variables.css`: tokens globales de diseño.
- `frontend/css/base.css`: estilos base, accesibilidad y movimiento reducido.
- `frontend/css/components.css`: tarjeta, campos, botones, mensajes y carga reutilizables.
- `frontend/css/auth-layout.css`: composición, panel de marca, cabecera y adaptación móvil compartidos; extraídos de Login conservando sus reglas.
- `frontend/css/pages/login.css`: punto de extensión específico del Login.
- `frontend/css/pages/{register,forgot-password,reset-password}.css`: ajustes particulares de las nuevas pantallas.
- `frontend/js/core/config.js`: idioma, rutas y política configurable de contraseña.
- `frontend/js/core/auth-form.js`: validación accesible, campos de contraseña, requisitos, carga y prevención de duplicados para los formularios nuevos.
- `frontend/js/services/auth.service.js`: frontera de integración con FastAPI, actualmente rechaza explícitamente cualquier intento.
- `frontend/js/pages/login.js`: validación, contraseña visible, carga, bloqueo de duplicados y avisos locales.
- `frontend/{register,forgot-password,reset-password}.html`: estructura semántica de las nuevas pantallas.
- `frontend/js/pages/{register,forgot-password,reset-password}.js`: coordinación de cada flujo.
- `frontend/assets/images/branding/`: marca e ilustración SVG locales originales, sin recursos externos.
- `docs/previews/`: capturas de escritorio y móvil de las cuatro pantallas, más las dos vistas del registro docente.

### Archivos de la Fase 7

- `frontend/student/tutor.html`: estructura del chat educativo, paneles y regiones accesibles.
- `frontend/css/student/tutor.css`: encabezado, modo, paneles y layout del Tutor.
- `frontend/css/student/tutor-chat.css`: burbujas, log, sugerencias, compositor y resultados.
- `frontend/css/student/tutor-responsive.css`: adaptación móvil, tablet y escritorio.
- `frontend/js/student/tutor.js`: controlador principal, conversaciones, mensajes, estrategias, contexto.
- `frontend/js/student/tutor-i18n.js`: diccionarios español/inglés para el Tutor.
- `frontend/js/data/tutor-demo.data.js`: 15 ejemplos predefinidos por grado y asignatura.
- `frontend/js/services/tutor.service.js`: respuestas predefinidas y estrategias "No entendí".
- `frontend/js/services/tutor-api.service.js`: frontera de integración futura con FastAPI.
- `frontend/js/utils/tutor-format.js`: renderizado de bloques (texto, pasos, ejemplo, pista, math, review, visual).
- `frontend/js/utils/tutor-validation.js`: validación y normalización de entrada del usuario.
- `frontend/js/components/tutor-message.js`: renderizado de burbujas usuario/asistente con acciones rápidas.
- `frontend/js/components/tutor-suggestions.js`: tarjetas de bienvenida y ejemplos demostrativos.
- `frontend/js/components/tutor-context.js`: panel de contexto académico y lista de ejemplos.
- `frontend/js/components/tutor-conversations.js`: panel lateral de conversaciones temporales.
- `frontend/js/components/tutor-input.js`: textarea autoajustable, validación, atajos Enter/Shift+Enter.
- `frontend/js/components/tutor-learning-actions.js`: botones de estrategias "No entendí" y acciones rápidas.

### Cambios de la fase 2

Se crearon las tres páginas, sus seis archivos CSS/JS, `css/auth-layout.css`, `js/core/auth-form.js` y las capturas. Se modificaron Login (solo sus enlaces y referencia al CSS común), su módulo de navegación, `components.css`, `config.js`, `auth.service.js` y este documento. Los tokens visuales, estilos base y recursos gráficos de fase 1 se conservaron.

### Cambios de la fase 7

Se creó la interfaz completa de AITHRON TUTOR: chat educativo, ejemplos predefinidos, estrategias "No entendí", conversaciones temporales, panel de contexto y estados de disponibilidad. Se añadieron rutas, componentes de chat, servicio demostrativo, datos y validación. Se conectó desde Sidebar, Topbar, Dashboard, Lección y Accesos rápidos. No se modificaron fases anteriores salvo integración. No se añadieron dependencias.

## Alcance y referencia

La carpeta inicial estaba vacía en fase 1. Se volvió a revisar `D:\Programing\ATHRON EDU.zip` en fase 2: no incluye las imágenes de Registro/Recuperación ni `pantallas/02_public_login.png`. Las nuevas pantallas reutilizan la composición, paleta, tipografía y recursos de fase 1. La fidelidad exacta a los mockups queda pendiente de recibirlos. La marca gráfica y la ilustración actuales son recursos propios provisionales.

## Comportamiento

- Se aceptan correo o usuario; si contiene `@`, se comprueba su formato como correo.
- Campos obligatorios, errores asociados, foco al primer error y navegación por teclado.
- Botón para mostrar u ocultar contraseña con estado accesible.
- Estado de carga durante la operación asíncrona y bloqueo de envíos simultáneos. Al no existir petición real, el estado es breve, sin demora artificial.
- Un envío válido informa de que el servicio no está conectado. No hay credenciales válidas ni sesiones simuladas.
- Navegación real entre las cuatro páginas, sin enlaces rotos.
- Registro escolar sin correo personal, teléfono, ubicación ni contraseña impuesta por el frontend. La institución definirá la credencial y validará el código.
- Registro docente con invitación obligatoria; elegir modalidad no concede permisos. Los roles y cuentas administrativas los gestionará el servidor.
- Política de contraseña provisional: 10 caracteres, al menos una letra y un número. Se configura en `js/core/config.js`; el indicador y la validación usan la misma fuente.
- Confirmación de contraseña y revalidación si cambia la contraseña original. Los valores se conservan al corregir errores y cambiar de modalidad durante la visita.
- Campos del flujo inactivo deshabilitados y excluidos de validación y datos del formulario.
- No hay confirmaciones de cuenta creada, correo enviado ni contraseña modificada: todos los servicios muestran mensajes explícitos de integración pendiente.
- Sin interpretación de tokens de URL en Reset: ningún parámetro concede autorización.
- No se envían ni guardan credenciales en almacenamiento del navegador; no hay claves API.
- Sin JavaScript, el envío queda deshabilitado y se muestra una explicación. Con JavaScript, los botones están disponibles en estado normal y se bloquean durante el procesamiento.
- El texto de conexión pertenece a la composición visual; esta fase no implementa funcionamiento offline ni instalación PWA.

## Verificaciones realizadas

Pruebas de fase 2 ejecutadas en Microsoft Edge headless mediante Playwright externo al proyecto (sin añadir dependencias al frontend):

- Cuatro páginas y ambas modalidades de Registro sin desbordamiento horizontal en 320, 375, 768, 1024 y 1440 px.
- Enlaces y recursos locales con respuesta HTTP 200; navegación real Login → Registro → Login → Recuperación → Reset → Login.
- Registro escolar: campos obligatorios, foco inicial de error y conservación de valores.
- Registro docente: cinco campos obligatorios, correo inválido, contraseña insuficiente, requisitos cumplidos, confirmación y código de invitación.
- Cambio entre modalidades: exclusión de campos inactivos y conservación de valores.
- Recuperación: campo vacío, correo inválido y aviso de que no se ha enviado correo.
- Reset: campos vacíos, revalidación de confirmación, mostrar contraseña y aviso de que no hubo cambio; parámetro de URL arbitrario sin autorización.
- Teclado: Tab y activación del botón de contraseña con Enter.
- Estado de carga, `aria-busy`, bloqueo durante envíos simultáneos y restauración de controles.
- Regresión de Login: validación, mostrar contraseña, servicio pendiente y enlaces nuevos.
- Sin escrituras en LocalStorage, SessionStorage o IndexedDB; sin peticiones HTTP de modificación.
- Sin errores JavaScript ni de consola; botones deshabilitados sin JavaScript.
- Capturas a 1440 px y 320 px disponibles en `docs/previews/`.

No se ha contrastado con la imagen original, que no estaba disponible, ni se ha probado con un lector de pantalla físico o con otros motores de navegador.

## Verificación manual en navegador

1. Revisar a 320, 375, 768, 1024 y 1440 px; comprobar que no hay desplazamiento horizontal.
2. Recorrer con Tab y Shift+Tab; activar botones y enlaces con teclado.
3. Enviar vacío: ambos errores deben mostrarse y el foco debe ir al identificador.
4. Probar un correo incompleto y luego corregirlo. Un usuario sin `@` debe aceptarse localmente.
5. Mostrar/ocultar contraseña: conservar el valor y actualizar etiqueta y estado del botón.
6. Enviar campos no vacíos: ver aviso de servicio pendiente, sin navegación ni almacenamiento.
7. Recorrer las cuatro pantallas por sus enlaces; revisar consola y red.
8. Alternar Registro escolar/docente; comprobar que solo el flujo visible valida sus campos.
9. Probar contraseña corta y confirmación distinta; corregir sin perder el resto del formulario.

## Pendiente de backend y fases posteriores

Definir contrato FastAPI, endpoints y errores; implementar autenticación real y sesiones seguras; validar códigos de aula e invitaciones y resolver permisos en el servidor; definir el mecanismo de credenciales escolares y la política definitiva de contraseña; enviar correos de recuperación y validar autorizaciones de un solo uso y su caducidad antes de permitir cambios. También quedan pendientes los datos académicos reales, el currículo completo revisado, los dashboards de Monitor/Administrador, evaluaciones oficiales, asignación docente de actividades, persistencia/sincronización verificadas, la base de datos, **integración real del Tutor IA con proveedor de IA**, historial de conversaciones con privacidad y políticas de conservación, y la PWA offline.
