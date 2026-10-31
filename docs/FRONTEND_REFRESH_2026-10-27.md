# Mejora transversal del frontend — 2026-10-27

## Alcance realizado

Mejora de presentación compartida, navegación y controles existentes en HTML/CSS/ES6.
Logos, ilustraciones e iconos definitivos quedan para el final por indicación del usuario.
No equivale a terminación funcional de todos los módulos: el proyecto conserva su
estado de integración parcial y NO-GO de las actas 47–50.

### Navegación

- Una definición de destinos del estudiante, reutilizada por navegación lateral,
  móvil, menú ampliado y acciones de los controladores del dashboard y aprendizaje.
- Enlaces nativos para cambiar de pantalla; se puede abrir en otra pestaña y navegar
  con teclado. Se conservan grado, idioma y selección explícita de modo api/demo.
- Eliminada la duplicación de Evaluaciones. Agenda, Progreso, Misiones, Logros,
  Descargas, Pronunciación y Perfil abren las pantallas existentes.
- Estado activo normalizado, incluida la pantalla de Descargas.
- Corrección de `learningURL()` cuando se llama sin objeto de opciones.

### Presentación

- `frontend/css/experience.css`, cargado desde base.css: tipografía más legible,
  superficies/bordes/espaciados consistentes, formularios, diálogos y estados de foco.
- Inicio del estudiante con continuación de lección antes de los indicadores.
- Tarjetas de cursos en una columna en móvil y cabecera compactada a anchuras pequeñas.
- Tratamiento compartido para Monitor y Administrador; herramientas docentes
  secundarias agrupadas en un desplegable nativo en lugar de acumularlas en el hero.
- Correcciones de superficies y controles en tema oscuro; reglas de contraste alto
  e impresión. No se declara cobertura WCAG completa de toda la aplicación.
- Corrección de desbordamiento del Traductor a 320 px mediante min-width y grid.
- Texto de login actualizado para evitar prometer funcionamiento offline integral.

### Interacción

- Menú docente/administrativo con nombre accesible, aria-controls y aria-expanded
  actualizado según el estado de la navegación.
- Calendario conserva el foco al cambiar mes, volver a hoy o elegir fecha.
- Enlaces de la agenda conservan el contexto y escapan títulos de eventos.
- El arranque de páginas espera renderizadores asíncronos antes de terminar la carga
  y comprueba que el liberador de recursos sea una función.
- Filtros de Descargas funcionales, estado aria-pressed y recuperación de foco.
- Descargas distingue metadatos locales de disponibilidad actual de archivos,
  actualiza registros al terminar y muestra errores que el gestor conserva en el job.
  No se certificó una descarga offline completa ni se modificó la política de borrado.
- El SW prepara también el nuevo CSS y el CSS que importa variables.css; se mantiene
  su restricción a activos públicos y no se eliminan cachés ni respuestas locales.

## Verificación ejecutada

Todo con perfiles de navegador desechables y datos de demostración; sin credenciales
reales, base PostgreSQL, proveedor AI, micrófono o piloto.

| Comprobación | Resultado y alcance |
|---|---|
| Navegador Edge, 26 pantallas × 320/768/1440 px | 78 comprobaciones sin desbordamiento del documento ni excepciones JS |
| 14 destinos del estudiante en inglés, grado 6 | Destinos únicos, contexto conservado y sección activa correcta |
| Teclado | Enter sobre enlace Agenda abre la pantalla |
| Agenda y Descargas | Foco conservado; filtro vacío y aria-pressed comprobados |
| Menú docente | aria-expanded cambia al abrir |
| Tema oscuro del inicio | Superficie de tarjetas y colores de select/botón principal comprobados |
| Texto 200 % | Sin desbordamiento del documento en inicio de estudiante, a 1440 px; no se extrapola a todas las vistas |
| JS público | 434 módulos compilados y dependencias ES locales existentes |
| Suites existentes | Navegación monitor, fronteras de vistas privadas, API, sesión, resiliencia y política SW pasan en sus ámbitos limitados |
| Edge y Chrome iniciales | Login a 320/375/768/1440 y cinco vistas principales a 375/1440 pasan; la revisión ampliada final es Edge |

Evidencias finales nuevas, sin sustituir actas o baseline:

- `docs/final/evidence/frontend-refresh-20261027-verified/FRONTEND_REFRESH_BROWSER.json`
- Capturas nuevas `student-320.png`, `student-1440.png`, `student-dark.png`,
  `monitor-320.png`, `monitor-1440.png`, `admin-320.png`, `admin-1440.png` en el mismo directorio.
- `docs/final/evidence/frontend-refresh-source-20261027/FRONTEND_REFRESH_SOURCE.json`
- `docs/final/evidence/frontend-refresh-regression-20261027/NODE_REGRESSION.json`
- `docs/final/evidence/frontend-refresh-20261027-a/BROWSER_VALIDATION.json`

Los intentos previos b/c y final se conservan: documentan los defectos detectados,
la corrección de la condición de espera y las iteraciones de estilo. El directorio
`verified` contiene el resultado posterior a la última corrección de frontend.
La petición implícita `/favicon.ico` del navegador está registrada como 404;
no se cambió la identidad gráfica, que ya usa favicon SVG en las vistas que lo declaran.

`node test-syntax.js` no es una comprobación válida de este frontend: ese archivo
preexistente contiene un fragmento que falla al compilar. No se modificó; se sustituyó
su uso en esta intervención por la compilación efectiva de los 434 módulos públicos.
La suite privada requiere `--experimental-vm-modules`, con el que pasó.

## Reproducción

Usar un namespace nuevo por ejecución para no sobrescribir evidencia:

```powershell
$env:AITHRON_FINAL_VALIDATION='1'
$env:AITHRON_FINAL_EVIDENCE_DIR='docs/final/evidence/frontend-refresh-nueva-ejecucion'
node tests/frontend-refresh.browser.cjs
node --experimental-vm-modules tests/frontend-refresh-source.cjs
node tools/run-phase48-regression.cjs
$env:AITHRON_FRONTEND_HASH_NAMESPACE=$env:AITHRON_FINAL_EVIDENCE_DIR
node tests/frontend-refresh-hashes.cjs
```

Requiere Edge instalado y el directorio temporal autorizado indicado en el test.
El test crea su servidor HTTP loopback y perfiles propios; los conserva en temporal.
Los hashes se generan solo del frontend público y se comparan después de las pruebas.
No se regenera el manifiesto histórico del candidato congelado.

## Pendientes que esta intervención no acredita como terminados

- Continuidad E2E entre sesión real y datos reales de los tres perfiles; los dashboards
  existentes mantienen sus datos demo. Conservar modo api en enlaces no crea servicios.
- Conexión de todas las pantallas administrativas a los contratos backend existentes.
- Traducción completa del contenido operativo de todos los módulos; el menú se
  verificó en inglés, pero existen cuerpos de páginas escritos en español.
- Catálogo completo de estados vacíos/error y diseño individual de todas las pantallas.
- Accesibilidad completa con lector de pantalla, Safari/Firefox y móviles físicos.
- Rendimiento en equipos escolares y red limitada; no hay medición de Web Vitals aquí.
- Integridad offline multiusuario, descarga completa y sincronización autenticada.
- Logos e iconografía final.

No se activaron capacidades pendientes, no se borró información ni se modificaron
notas AD/A/B/C. Producción y piloto real siguen NO-GO.
