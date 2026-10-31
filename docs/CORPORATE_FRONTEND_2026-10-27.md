# Composición corporativa del frontend — 2026-10-27

## Alcance aplicado

Reorganización estructural de los dashboards de Estudiante, Monitor y Administrador
y adaptación corporativa del shell compartido, navegación, cursos, acceso y controles.
HTML/CSS/JavaScript ES6 conservados. No se incorporan frameworks, fuentes remotas ni
nuevas dependencias de ejecución.

Se mantienen los logos e iconos existentes como recursos provisionales; los definitivos
se reservan para el final por indicación del usuario. No se publica la aplicación.

## Cambios visibles

### Estructura institucional común

- Navegación lateral clara en tema claro, con agrupaciones y selección discreta.
  En tema oscuro utiliza superficies adaptadas. El logo SVG existente conserva su
  contraste mediante fondo azul; no se reemplaza la marca.
- Cabecera de contexto compacta y un único título principal en cada dashboard.
- Se eliminan los saludos y mensajes motivacionales repetidos del inicio.
- Superficies neutras, radios moderados, menor uso de sombras y gradientes, botones
  primarios institucionales y acciones secundarias discretas.
- Login, registro y recuperación/restablecimiento comparten la dirección corporativa;
  en móvil se reduce el panel decorativo para dar prioridad al formulario.

### Estudiante

- Nueva estructura de Inicio: título de página, contexto de muestra/grado, lección
  para continuar, agenda de evaluaciones, indicadores compactos y cursos.
- La lección actual es una superficie de trabajo sobria, sin banner ilustrado grande.
- La guía de uso se consulta desde Ayuda y permanece disponible al final de la vista.
  En las páginas de aprendizaje ya no precede al contenido principal.
- Los metadatos de muestra se mantienen visibles; sus explicaciones extensas son
  consultables mediante disclosures o pie de página, sin presentar datos ficticios
  como resultados oficiales.
- Resumen de cuatro indicadores en una franja común y tarjetas de curso compactadas.
- Evaluaciones de muestra con fecha y acceso a detalle, conservando el aviso de que
  no están habilitadas en el diálogo correspondiente.

### Monitor

- Inicio enfocado en intentos por revisar, estudiantes con actividades pendientes y
  evaluaciones programadas localmente. Se reutilizan los cálculos existentes.
- Próximas evaluaciones y actividad reciente antes del análisis complementario.
- Estadísticas, catálogo, borradores y herramientas se organizan en secciones y
  disclosures; los registros y controles se reubican, no se borran datos persistidos.
- Se mantienen preferencias de aula inicial, sección, visibilidad de actividad y
  accesos rápidos; los destinos de revisión siguen siendo los módulos existentes.

### Administrador

- Inicio con título «Resumen institucional», filtros contextuales e indicadores
  compactos en lugar del bloque inicial de presentación/configuración.
- Avisos, propuestas locales y organización académica se sitúan antes del detalle
  de distribución y estado técnico.
- Apariencia, tamaño de texto y preparación de recursos locales pasan a una sección
  propia después del resumen; conservan sus controles y servicios existentes.
- Filtros abiertos en escritorio y consultables en móvil mediante «Filtrar resumen».
- Definiciones de los indicadores accesibles desde cada métrica; no se interpreta
  un dato no disponible como cero.
- Los accesos a secciones internas abren el disclosure correspondiente, desplazan
  y llevan el foco al destino.

## Implementación principal

- HTML de los tres dashboards reformulado de forma semántica y legible.
- `frontend/js/components/dashboard-composition.js`: composición de nodos generados
  conocidos, preservando controles, registros y delegación de eventos.
- `frontend/js/components/topbar.js`: contexto corporativo; mantiene el párrafo de
  contexto requerido por módulos docentes y evita duplicar títulos principales.
- `frontend/js/components/sidebar.js`: agrupaciones del estudiante, mismos 14 destinos.
- `frontend/js/components/{progress-card,admin-dashboard-ui}.js`: métricas compactas.
- Controladores de dashboards y compatibilidad de `monitor/management-shell.js` y
  `monitor/account.js` con la nueva jerarquía de encabezados.
- `frontend/css/experience.css`: composición corporativa y adaptación responsive
  sobre la base de legibilidad existente, sin scripts que redimensionen texto.

## Verificación final

Namespace: `docs/final/evidence/corporate-ui-20261027-final/`.

**189 comprobaciones de navegador, ninguna fallida**, en Edge local con perfil
desechable y datos sintéticos:

| Grupo | Resultado y alcance |
|---|---|
| 48 pantallas × 320/768/1440 px | 144 comprobaciones de carga, desbordamiento y texto renderizado; sin excepciones JS |
| Legibilidad | Texto HTML visible revisado no inferior a 0,875 rem; excluye SVG, contenido oculto y texto solo accesible |
| Navegación estudiante | 14 destinos, contexto y selección activa |
| Interacciones compartidas | 2 grupos existentes de teclado/foco/filtros/tema |
| Temas y ampliación | 6 casos claro/oscuro en dashboards y 12 de texto al 200 % en las seis vistas de referencia |
| Composición corporativa | 6 vistas de dashboard: un h1, nueva estructura, ayuda y acción de continuación dentro de la ventana probada |
| Operaciones conservadas | Filtro de grado reduce el conjunto de estudiantes; definición abre; salto a distribución abre/focaliza; reset recupera el conjunto; revisión docente navega al registro existente |
| Trabajo en curso | 3 grupos de prácticas y tareas con API HTTP simulada, incluidos cuota, entrega incierta y limpieza por sesión/403 |

Las cuatro vistas docentes adicionales cubren detalle de curso, lecciones, editor
de lección y edición de perfil, para comprobar las dependencias del shell cambiado.
La acción de continuación se comprueba a 375 y 1440 px con altura 900; no se afirma
que sea visible sin desplazamiento en toda resolución o móvil físico.

`FRONTEND_REFRESH_SOURCE.json`: 437 módulos compilan, importaciones ES locales
resueltas, suites de navegación docente y fronteras privadas aprobadas.
`NODE_REGRESSION.json`: suites existentes de API, política SW, resiliencia y sesión
aprueban en su ámbito de contratos, fixtures, VM y HTTP local.

Las iteraciones a/b/c/layout se conservan: muestran incompatibilidades de consumidores
de la cabecera antigua y ajustes de pruebas para el indicador agrupado. El resultado
vigente está en el namespace final, sin sobrescribir evidencia histórica.

## Capturas

En el namespace final:

- `corporate-student-1440.png`, `corporate-student-375.png`.
- `corporate-monitor-1440.png`, `corporate-monitor-375.png`.
- `corporate-admin-1440.png`, `corporate-admin-375.png`.
- Capturas `premium-*-light.png` y `premium-*-dark.png` del shell nuevo.
- Login, catálogo, lección y recorridos de tareas también conservan capturas nuevas.

## Reproducción

Usar un namespace nuevo para conservar cada ejecución:

```powershell
$env:AITHRON_FINAL_VALIDATION='1'
$env:AITHRON_PREMIUM_READABILITY='1'
$env:AITHRON_PREMIUM_FOCUS='0'
$env:AITHRON_STUDENT_JOURNEY='1'
$env:AITHRON_CORPORATE_COMPOSITION='1'
$env:AITHRON_FINAL_EVIDENCE_DIR='docs/final/evidence/corporate-nueva-ejecucion'
node tests/frontend-refresh.browser.cjs
node --experimental-vm-modules tests/frontend-refresh-source.cjs
node tools/run-phase48-regression.cjs
$env:AITHRON_FRONTEND_HASH_NAMESPACE=$env:AITHRON_FINAL_EVIDENCE_DIR
node tests/frontend-refresh-hashes.cjs
```

El test levanta su servidor loopback y conserva un perfil Edge desechable en temporal
autorizado. Las fixtures API solo están habilitadas en el test. Los hashes se guardan
del frontend público probado y se comparan sin regenerar el candidato histórico.

## Límites vigentes

No es aceptación de todos los estados de todas las pantallas. Quedan revisión visual
exhaustiva del catálogo completo, traducción integral, WCAG completa, lectores de
pantalla, móviles físicos, Firefox/Safari y medición de rendimiento escolar.
Los dashboards siguen usando sus servicios de demostración; no se acredita sesión
autenticada o persistencia PostgreSQL mediante esta validación de navegador.

No se cambian permisos, calificaciones AD/A/B/C, bases o secretos. No se borran
respuestas ni borradores, no se activan AI/micrófono/sincronización ni piloto real.
Producción y piloto conservan la decisión NO-GO de las actas vigentes.
