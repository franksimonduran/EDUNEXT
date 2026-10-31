# Recorridos del estudiante: trabajo en curso, orientación y recuperación

Fecha: 2026-10-27. Intervención sobre frontend existente, HTML/CSS/JavaScript ES6.
No constituye una fase nueva ni aceptación integral de las actas 47–50.

## Implementación

### Orientación para el primer uso

Guía desplegable reutilizable en Inicio y las páginas del shell de aprendizaje,
en español e inglés. Explica cómo explorar cursos, usar ejemplos/pistas, practicar,
consultar la agenda y ajustar accesibilidad. No añade seguimiento ni almacena datos
de visitas. Distingue puntos y avances de muestra de notas oficiales.

### Protección del trabajo

- El servicio de prácticas informa si la escritura en sessionStorage tuvo éxito.
- El intento sigue en memoria si el almacenamiento temporal falla; la pantalla
  diferencia guardado en la pestaña de respuesta no guardada.
- Una práctica guardada puede reanudarse con el mismo run tras recargar la pestaña.
- Ante trabajo no guardado se solicita confirmación al seguir enlaces y se solicita
  la advertencia nativa al recargar/cerrar. Los navegadores pueden limitar sus diálogos
  nativos; esto no reemplaza persistencia ni garantiza recuperación después de cerrar.
- Las respuestas privadas de tareas no se introducen en localStorage/IndexedDB ni
  sessionStorage. Se conservan en la ventana hasta confirmar un borrador en servidor.
- En tareas se protege el cierre por botón/Escape cuando hay cambios sin confirmar.
  Durante una operación se bloquea la edición para que el texto marcado como guardado
  corresponda al que se envió. Los bloqueos se liberan tras el resultado.
- Después de una entrega incierta, el reintento consulta primero la respuesta/recibo
  existente antes de volver a escribir o entregar; se reutiliza la clave de operación.
- Se limpia la presentación privada al cambiar la sesión o recibir 401/403; las
  respuestas tardías no vuelven a abrir el diálogo ni restauran el contenido.

No se borraron borradores, respuestas, tablas o cachés; tampoco se migró el almacén
demo a un sistema multiusuario autenticado. La persistencia de prácticas sigue siendo
temporal y exclusivamente demostrativa, no un registro académico oficial.

### Recuperación y estados comprensibles

- Carga genérica con reintento real del loader para errores temporales.
- Rutas inexistentes y falta de permisos con mensajes y salidas adecuadas; no se
  sustituye un error de consulta API por actividades o resultados inventados.
- Agenda vacía y calendario sin eventos con una siguiente acción explicada.
- Estado de tarea cerrada, respuesta recibida y borrador pendiente de guardar.
- La agenda API usa cabecera genérica «Mi agenda» en lugar del alias ficticio y
  oculta el avatar de demostración. Diálogo de respuesta adaptado a 320 px.

### Contenido de muestra

Corrección de las pistas de equivalencia decimal y fracciones para que se refieran
a la pregunta actual, y explicación explícita de la afirmación falsa de sexto:
50 % es 1/2 y 25 % es 1/4. No se cambiaron calificaciones AD/A/B/C.

Revisión técnica ejecutada: 60 lecciones, 60 preguntas de práctica y 15 juegos de
los tres grados. Comprueba referencias, selección de respuestas, ilustraciones de
partes, explicaciones, alternativas válidas y expectativas numéricas independientes.
No representa revisión profesional del currículo o idoneidad por edad. Esa revisión
requiere un responsable pedagógico y sigue pendiente.

## Evidencia final

Directorio: `docs/final/evidence/student-journeys-20261027-verified/`.

| Evidencia | Resultado |
|---|---|
| FRONTEND_REFRESH_BROWSER.json | 26 páginas × 3 anchos; 14 destinos de navegación y verificaciones de interacción pasan en Edge |
| Recorrido de práctica | Respuesta reanudada tras recarga; fallo de cuota; salida cancelada; recuperación del guardado; intentos incorrecto/correcto conservados por separado |
| Recorrido de tarea | Error temporal → reintento → edición; cancelación del cierre/Escape; bloqueo durante guardado; recibo antes de reintentar |
| Entrega incierta simulada | 1 POST de entrega; 0 escrituras adicionales de borrador al consultar el recibo en el reintento |
| Protección privada | Sin texto privado sintético en almacenamiento del navegador; logout con PATCH tardío y 403 no restauran contenido |
| STUDENT_CONTENT_AUDIT.json | Comprobaciones técnicas de 60 lecciones, 60 preguntas y 15 juegos pasan |
| FRONTEND_REFRESH_SOURCE.json | 436 módulos públicos compilan; importaciones locales y suites existentes de navegación/vistas privadas pasan |
| NODE_REGRESSION.json | Suites existentes de contratos API, sesión, resiliencia y política SW pasan en su alcance |

Capturas nuevas: `student-practice-resumed.png`, `student-task-unsaved.png`,
`student-task-mobile.png`, además de los dashboards. Solo contienen fixtures
sintéticas. La API de los recorridos es un doble HTTP local exclusivo de tests;
no demuestra funcionamiento de FastAPI/PostgreSQL ni autorización real.
La petición implícita `/favicon.ico` permanece registrada como 404; no se sustituyen
logos o iconos, reservados por el usuario para el final.

## Criterio de pantalla terminada

Aplicar por recorrido y registrar evidencia, sin extrapolar una muestra a toda la app:

1. La persona entiende qué actividad está viendo y cuál es la siguiente acción.
2. La fuente de los datos está identificada: demostración, ventana/pestaña o servidor.
3. La interfaz diferencia edición, guardado pendiente, confirmación y entrega recibida.
4. Salir no descarta silenciosamente trabajo sin confirmar en el recorrido revisado.
5. Vacío, recurso inexistente, fallo temporal y permiso denegado tienen una salida útil.
6. Error de respuesta ofrece explicación y permite aprender sin inflar la primera puntuación.
7. Se comprueban teclado, foco y anchos pequeños con datos sintéticos.
8. La evidencia dice qué se probó realmente y qué depende de servicios pendientes.

Este criterio se incorpora como instrumento de aceptación técnica; no se declara
que todas las páginas de Estudiante/Monitor/Administrador ya lo satisfagan.

## Reproducción

Elegir un namespace nuevo, pues las evidencias congeladas no deben sobrescribirse:

```powershell
$env:AITHRON_FINAL_VALIDATION='1'
$env:AITHRON_STUDENT_JOURNEY='1'
$env:AITHRON_FINAL_EVIDENCE_DIR='docs/final/evidence/student-journeys-nueva-ejecucion'
node tests/frontend-refresh.browser.cjs
node tests/student-content-audit.cjs
node --experimental-vm-modules tests/frontend-refresh-source.cjs
node tools/run-phase48-regression.cjs
$env:AITHRON_FRONTEND_HASH_NAMESPACE=$env:AITHRON_FINAL_EVIDENCE_DIR
node tests/frontend-refresh-hashes.cjs
```

Los tests usan Edge local y un perfil desechable en temporal autorizado. Los hashes
son del frontend público probado; no sustituyen el manifiesto histórico del candidato.

## Límites vigentes

Pendientes: E2E autenticado con PostgreSQL en entorno aislado autorizado, persistencia
y aislamiento multiusuario offline, revisión pedagógica profesional, currículo completo,
lector de pantalla/móviles físicos/Safari/Firefox, traducción completa y cobertura de
los demás formularios. Los nuevos recorridos no certifican todos los editores de
Monitor/Administrador. Logos e iconografía definitiva siguen para el final.

No se publicaron cambios ni se activaron AI, micrófono, sincronización o piloto real.
La decisión de producción/piloto permanece NO-GO.
