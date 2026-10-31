# Fase 15 — Dashboard Monitor / Docente

## Apertura
Desde `D:\Programing\ATHRON EDU1\frontend` ejecutar:

```powershell
python -m http.server 8088 --bind 127.0.0.1
```

Abrir http://127.0.0.1:8088/monitor/index.html o seleccionar Monitor en la vista de perfiles y abrir su enlace de demostración. No hay autenticación ni autorización real.

## Inspección y referencias
Se revisaron Sidebar, Topbar, variables, selección de perfiles, estructura y almacenamiento existente. Las fases anteriores contienen pantallas y módulos, pero su existencia no acredita su validación completa. En particular, la fase 14 sigue parcial: el gestor anterior no verifica realmente cada recurso y no debe considerarse offline completo. No se corrigió ese módulo en esta fase.

El ZIP `D:\Programing\ATHRON EDU.zip` existe; su listado contiene el proyecto original y componentes Monitor de otra tecnología, pero no `pantallas/28_monitor_inicio.png` ni `lamina_monitor_01.png`. Tampoco se localizaron imágenes monitor en D:\Programing. Se reutilizó el diseño corporativo actual; no se reprodujeron mockups inaccesibles.

## Archivos creados
- frontend/monitor/index.html
- frontend/css/monitor/dashboard.css
- frontend/js/monitor/dashboard.js
- frontend/js/data/monitor-demo.data.js
- frontend/js/services/monitor-dashboard.service.js
- frontend/js/components/monitor-dashboard-cards.js

Modificados: componentes compartidos sidebar.js y topbar.js (opciones docentes conservando la firma anterior), pages/role-selection.js (enlace explícito de demostración).

## Datos y reglas
Tres aulas asignadas al monitor ficticio: 24, 28 y 24 estudiantes. Cinco cursos por grado: 15 instancias de curso, cinco asignaturas. Datos deterministas, sin información real de menores, solicitudes externas ni persistencia académica docente.

Progreso: suma de lecciones-estudiante completadas / suma de lecciones-estudiante asignadas. Aciertos: suma de respuestas correctas / suma de preguntas de prácticas, por asignatura. No son notas oficiales. Apoyo: dos prácticas de Matemática del mismo tema con menos del 50 % de aciertos; evidencia visible al abrir detalle. No hay análisis de IA ni diagnósticos.

Selector de aula filtra resumen, rendimiento, progreso, aulas, evaluaciones, actividades, avisos, apoyo, Insights y notificaciones. Sincronización muestra información remota desconocida, nunca confirmaciones ficticias. Módulos posteriores abren un diálogo de construcción. Salir vuelve a perfiles sin simular cierre de sesión autenticada.

## Verificación ejecutada
Prueba real con Chromium/Playwright, servidor Python temporal en puerto 8095:
- Dashboard cargó sin errores de JavaScript ni respuestas HTTP >=400.
- Contadores globales: 76 estudiantes, 3 aulas, 15 cursos, 3 evaluaciones.
- Selección 5.º A: 28 estudiantes, 1 aula, 5 cursos, 1 evaluación.
- Campana y perfil abrieron diálogos; cierre por botón y Escape.
- Sidebar contrajo correctamente.
- A 1280, 768 y 320 px no hubo desbordamiento horizontal.

Pendiente: auditoría completa de accesibilidad/lector de pantalla, traducción integral EN del panel, aplicación de preferencias globales de fase 13, pruebas exhaustivas por teclado y regresión de todas las fases anteriores. No se afirma que estas verificaciones se hayan ejecutado. El CSS respeta movimiento reducido y los diálogos nativos proporcionan manejo de foco.

## Backend y fases futuras
Pendientes autenticación/autorización, consulta FastAPI, datos actuales, sincronización docente, notificaciones de servidor y módulos completos de estudiantes, aulas, tareas, evaluaciones, notas, refuerzo, calendario, configuración e Insights. La capa de servicio devuelve un modelo derivado sustituible por un adaptador autorizado. La lista visual de aulas no es una barrera de seguridad.
