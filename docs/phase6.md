# Fase 6 — AITHRON PRACTICA Y JUEGOS

## Abrir localmente

Desde la raíz del repositorio:

```powershell
python -m http.server 8080 --bind 127.0.0.1 --directory frontend
```

- **Prácticas:** http://127.0.0.1:8080/student/practica.html?grade=4
- **Ejercicio:** http://127.0.0.1:8080/student/ejercicio.html?grade=4&activity=practice-math-4
- **Juegos:** http://127.0.0.1:8080/student/juegos.html?grade=4
- **Memoria:** http://127.0.0.1:8080/student/juego.html?grade=4&activity=game-memory-4
- **Resultados:** se abren al terminar y contienen un ID de intento local, no porcentajes recibidos por URL. Abrir `resultado-practica.html` sin intento muestra una explicación.

Se admite `grade=4`, `grade=5` o `grade=6`. El grado es de demostración, no una modificación de un expediente escolar. Servir mediante HTTP, no `file://`.

## Referencia visual y alcance

Se consultó el ZIP disponible en `D:\Programing\ATHRON EDU.zip` sin localizar las imágenes originales de Practica, Juegos o actividades. Se informó durante la revisión previa. Se conserva la identidad visual de Dashboard/Aprende; la comparación exacta queda pendiente de recibir los mockups.

Se reutilizan los componentes existentes de Sidebar, Topbar, navegación inferior, diálogos, iconos, botones, progreso, tarjetas base y estados vacíos. No se creó otro frontend ni una segunda barra lateral.

## Pantallas y navegación

### Catálogo de prácticas

Cinco asignaturas por grado, título, descripción, dificultad, tema, preguntas y tiempo orientativo. Los filtros de asignatura, dificultad y estado se combinan. «Disponibles» muestra las que todavía no se han terminado en la sesión; «Realizadas» consulta los intentos completados.

Los contadores de completadas cuentan actividades distintas del grado y modalidad actual, no duplican el total por repetir el mismo ejercicio. El catálogo ofrece continuar intentos incompletos guardados en esta sesión.

### Resolver práctica

Pregunta actual y progreso, instrucciones, contexto, opciones/controles, Comprobar, Siguiente, Reintentar, pistas y salida. La respuesta se conserva antes de comprobar. Al comprobar, los controles se bloquean hasta elegir Reintentar; el resultado usa la primera comprobación.

La retroalimentación explica el contenido, evita etiquetas negativas y permite corregir sin penalizar por tiempo. En relaciones se muestra retroalimentación para cada par, además de la explicación de la actividad.

### Juegos

Cinco modalidades por cada grado:

- **Memoria:** tres parejas, movimientos, coincidencias, bloqueo de una tercera selección, pausa breve para errores y botón para ocultar antes. Las parejas de animales incluyen ilustraciones SVG originales.
- **Relacionar:** un reto con tres relaciones, accesible mediante selectores.
- **Ordenar:** un reto de tres pasos con botones Subir/Bajar, sin dependencia del arrastre.
- **Completar:** tres palabras o expresiones por grado.
- **Reto rápido:** tres preguntas sucesivas, sin límite de tiempo ni bonificación por rapidez.

Los controladores de relacionar, ordenar, completar y reto reutilizan el mismo motor de preguntas; no duplican captura de respuestas ni puntuación.

### Resultados

Actividad, curso, grado, respuestas, aciertos/fallos, porcentaje, pistas y recompensas. Las fortalezas y temas a repasar se derivan de las primeras respuestas del intento. La revisión muestra la respuesta utilizada para puntuar, la explicación y el número de intentos.

En memoria se muestran **movimientos**: cada selección de dos tarjetas es un movimiento. Un movimiento coincidente es un acierto; uno no coincidente es un fallo. El porcentaje es parejas encontradas dividido entre movimientos, no simplemente porcentaje del tablero descubierto.

Los enlaces permiten repetir con un intento nuevo, volver al catálogo o regresar a la lección de origen validada. Si no se llegó desde una lección, se usa una lección válida de la unidad relacionada.

## Contenido y tipos de ejercicio

Hay **15 prácticas y 60 preguntas reales**: una práctica de cuatro preguntas por asignatura y grado. Se reutilizan los datos normalizados de la fase 5 y se añaden ejercicios específicos:

- Matemática: fracciones de cantidades, suma de decimales y porcentajes.
- Comunicación: lectura, información explícita, organización e interpretación.
- Ciencia: ecosistemas, órganos/cuerpo y energía.
- Personal Social: servicios, instituciones, derechos y responsabilidades.
- Inglés: animales, vocabulario cotidiano y expresiones.

Se cubren selección múltiple, verdadero/falso (incluida una afirmación cuya respuesta correcta es Falso), completar, relacionar, ordenar, respuesta numérica e identificación de imagen. Cada pregunta tiene respuesta definida, tema, explicación y pistas.

El contenido es demostrativo y necesita revisión curricular/docente. No representa evaluación formal ni contenido oficialmente aprobado. Los controles admiten español/inglés; el material didáctico está en español y contiene términos/expresiones en inglés cuando corresponde.

### Validación

- Normalización Unicode NFC.
- Recorte, espacios y mayúsculas/minúsculas solo según la política declarada.
- No se eliminan tildes globalmente: las variantes aceptadas se definen en los datos.
- Numéricos: formato finito, sin expresiones ejecutables, con coma decimal cuando se autoriza y tolerancia explícita.
- Relaciones: opciones válidas, sin reutilizar una respuesta en varias filas.
- Orden: misma colección de IDs, sin duplicados, comparada con la secuencia definida.
- Datos escritos renderizados como texto o escapados; no se evalúa código.

## Puntuación y recompensas

**Porcentaje = aciertos en primera comprobación / preguntas respondidas × 100**, redondeado al entero más cercano. Cada pregunta cuenta una vez. Los reintentos se conservan y permiten aprender sin transformar el intento original en un 100 % artificial.

Las pistas son progresivas y no restan puntos. Se registran junto a la pregunta. En memoria se usa la fórmula por movimientos descrita arriba.

Recompensas locales:

- 10 puntos por acierto.
- Una estrella por completar.
- Otra estrella desde el 50 %.
- Otra estrella desde el 80 %.

No se modifica el progreso académico de Aprende, la racha del Dashboard, un sistema global de insignias ni notas oficiales. No hay rankings entre estudiantes ni afirmaciones de sincronización.

## Sesión temporal

`activity-session.service.js` utiliza **SessionStorage**, bajo la única clave `aithron.demo.activities.v1`. Conserva hasta los 40 intentos más recientes de esta sesión de demostración.

Cada intento contiene actividad, grado, pregunta actual, borradores, comprobaciones, pistas, estado del juego, referencia de origen y estado de finalización. No guarda alias, credenciales, roles ni información institucional. Los IDs aleatorios identifican intentos; no participan en las notas ni en el cálculo de aciertos.

Los datos locales no son un registro académico confiable ni una fuente de autorización. Los identificadores de actividad, grado, intento y lección de origen se contrastan con los datos disponibles. Un resultado no se crea a partir de parámetros como `percent=100`.

Si SessionStorage está bloqueado o falla, el motor mantiene el intento en memoria y muestra su resultado en la misma página. Se informa de que salir o recargar puede perderlo. No se simula una persistencia que no pudo realizarse.

No se incorporaron IndexedDB, Cache Storage, Service Worker, descargas ni sincronización. La conectividad del navegador sigue siendo orientativa.

## Integración

- Dashboard/Sidebar/Más → Practica y Juegos.
- Navegación inferior → Practica.
- Unidad → catálogo filtrado de su asignatura.
- Lección → pestaña Practicar → práctica completa.
- Resultado → lección exacta de origen, conservando grado e idioma.

El ejercicio introductorio de la lección se conserva. No se sustituyeron el Dashboard ni Aprende. La autenticación y la navegación por roles continúan sin backend, con sus reglas anteriores.

## Archivos nuevos

```text
frontend/student/
  practica.html
  ejercicio.html
  juegos.html
  juego.html
  resultado-practica.html
frontend/css/student/
  practice.css
  exercise.css
  games.css
  game-player.css
  practice-results.css
frontend/js/student/
  practice.js
  exercise.js
  games.js
  game-player.js
  practice-results.js
  activity-catalog.js
  activity-model.js
  activity-runner.js
  activity-results-view.js
  practice-i18n.js
frontend/js/components/
  practice-card.js
  question-renderer.js
  answer-feedback.js
  practice-progress.js
  result-summary.js
  activity-illustration.js
frontend/js/games/
  memory-game.js
  matching-game.js
  ordering-game.js
  word-game.js
  quick-challenge.js
frontend/js/data/
  practices-demo.data.js
  games-demo.data.js
frontend/js/services/
  practice.service.js
  game.service.js
  activity-session.service.js
frontend/js/utils/
  answer-validation.js
  score-calculator.js
tests/practice-games.browser.cjs
docs/phase6.md
```

Se generaron doce capturas de fase 6 en `docs/previews/`.

### Archivos existentes modificados

- `learning-shell.js`: sección activa y mensaje de demostración configurables, con los mismos componentes.
- `learning-page.js`: permite pasar esas opciones al contenedor compartido.
- `learning-routes.js`: cinco rutas nuevas y validación de parámetros `activity`/`run` duplicados.
- `dashboard.js`: navegación hacia los nuevos catálogos.
- `lessons.js`: enlace desde Practicar a la práctica completa.
- `units.js`: acceso a práctica relacionada funcional.
- `tests/learning.browser.cjs` y `tests/student-dashboard.browser.cjs`: verifican los destinos reales en lugar de los avisos provisionales.
- `README.md`: rutas y resumen actualizado.
- Capturas anteriores regeneradas por las regresiones.

No se modificaron el HTML del Dashboard, los componentes originales de Sidebar/Topbar, las variables globales, Login, Registro o las reglas de roles.

## Verificaciones ejecutadas

Microsoft Edge headless, Playwright y Axe como herramientas externas al frontend:

1. Integridad de 15 prácticas de cuatro preguntas y 15 juegos; siete tipos de pregunta presentes.
2. Resolución de las 60 preguntas en interfaz real para los tres grados.
3. Filtros combinados, ausencia de coincidencias y actividades realizadas.
4. Selección, texto, números con coma decimal, relaciones, orden e imágenes.
5. Rechazo de número vacío/no numérico y conservación de diferencias de tildes según política.
6. Pistas, respuesta vacía, incorrecta, correcta tras reintentar y bloqueo de doble comprobación.
7. Caso verificado de 3/4 aciertos = 75 %, 30 puntos y una pista; corregir el primer error no infló el porcentaje.
8. Recarga y cambio de idioma conservando respuesta y pistas; reanudación desde catálogo y reinicio limpio.
9. Finalización de los 15 juegos, incluidos los cinco tipos en los tres grados.
10. Memoria: tercer clic bloqueado, cierre automático de error tras pausa, ocultación manual, imágenes visibles al acertar y 3 parejas en 5 movimientos = 60 %.
11. Resultados, revisión, aciertos/fallos y retorno al identificador exacto de la lección de origen.
12. Cinco pantallas a **320, 375, 768, 1024, 1440 y 1920 px**, sin desbordamiento horizontal; también se comprobó el ancho durante las preguntas y con memoria resuelta en móvil.
13. Teclado en radios, pistas y ordenación, con conservación del foco; movimiento reducido.
14. Auditorías Axe sin infracciones detectadas en las reglas seleccionadas WCAG A/AA para las cinco vistas en escritorio y móvil.
15. Recursos/enlaces HTTP 200, IDs inexistentes, grado incorrecto, parámetros duplicados e intento inválido.
16. Escritura de texto con etiquetas HTML sin ejecución; no hay errores de consola/JavaScript en el recorrido probado.
17. Sin peticiones externas ni de modificación; únicamente la clave de sesión demostrativa, sin escrituras en LocalStorage o IndexedDB.
18. SessionStorage bloqueado: juego de tres palabras completado y resultado de 100 % mostrado en la misma página.
19. Regresiones de Aprende, Dashboard, Perfiles, Acceso no autorizado, Login, Registro, Recuperación y Reset ejecutadas satisfactoriamente.
20. Capturas revisadas de catálogo, ejercicio móvil, juegos, memoria con imágenes y resultados.

Las capturas de actividades completadas proceden de respuestas efectivamente dadas por las pruebas, no de resultados precargados. No se ha certificado accesibilidad con un lector de pantalla físico ni se han probado otros motores de navegador.

### Repetir las pruebas

Con Node.js, Microsoft Edge y el servidor HTTP abierto en otra terminal:

```powershell
npm install --prefix "$env:TEMP\aithron-ui-tests" playwright @axe-core/playwright --no-save --package-lock=false
$env:PLAYWRIGHT_MODULE = "$env:TEMP\aithron-ui-tests\node_modules\playwright"
$env:AXE_MODULE = "$env:TEMP\aithron-ui-tests\node_modules\@axe-core\playwright"
$env:BASE_URL = "http://127.0.0.1:8080/"
node tests/practice-games.browser.cjs
node tests/learning.browser.cjs
node tests/student-dashboard.browser.cjs
```

Playwright/Axe no son dependencias de ejecución de la app. Omitir `AXE_MODULE` para omitir la auditoría automática. Los scripts regeneran capturas.

## Capturas

- [Prácticas, escritorio](previews/practice-catalog-desktop.png) / [móvil](previews/practice-catalog-mobile.png)
- [Ejercicio, escritorio](previews/practice-exercise-desktop.png) / [móvil](previews/practice-exercise-mobile.png)
- [Juegos, escritorio](previews/games-catalog-desktop.png) / [móvil](previews/games-catalog-mobile.png)
- [Memoria inicial, escritorio](previews/game-memory-desktop.png) / [móvil](previews/game-memory-mobile.png)
- [Memoria completada](previews/game-memory-complete.png) / [móvil](previews/game-memory-complete-mobile.png)
- [Resultados, escritorio](previews/practice-results-desktop.png) / [móvil](previews/practice-results-mobile.png)

## Pendiente de integración

Recibir mockups originales; validar y ampliar actividades con revisión docente; integrar cuentas autorizadas, asignaciones y resultados reales mediante contratos de backend; persistencia offline y sincronización confirmada; gestión institucional y evaluaciones oficiales. Tutor IA, PostgreSQL, notas formales y sistema global de insignias quedan fuera de esta fase.
