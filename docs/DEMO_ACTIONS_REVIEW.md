# Revisión de acciones demo

Alcance: navegación existente, sin implementar asignaciones oficiales ni backend.

| Hallazgo | Tratamiento |
|---|---|
| Insights docente abría aviso genérico | Abre análisis de resultados demo existente; no motor Insights autenticado |
| Insights y Sync en shell de gestión no tenían ruta | Análisis demo y límites de almacenamiento local, respectivamente |
| Calendario, cursos y cuenta | Se reutilizan las pantallas existentes |
| Ver actividad de refuerzo en estudiante | Abre listado de refuerzos, filtrado por estudiante/aula; no inventa una actividad |
| Consultar actividades en aula | Abre seguimiento de actividades con contexto |
| Preparar refuerzo | Conserva editor local existente y contexto sintético |
| Salir de demostración | Regresa a demo.html, sin borrar sesiones ni datos |
| Acción desconocida | Explica que no está disponible en esta demo y necesita integración |

El inventario inicial encuentra los avisos genéricos principalmente en dashboard,
management-shell y organizer del monitor. Admin ya instala rutas de navegación
en captura, pero conserva textos heredados de “próxima fase” en su menú alternativo;
no son prueba de ausencia de sus páginas. No se da por revisado cada formulario
ni cada escritura local de los tres perfiles.

Prueba: tools/demo-smoke.cjs comprueba render de 20 rutas a dos anchos y seis
clics de navegación docente con fixtures sintéticas. tools/demo-audit.cjs verifica
referencias/imports con los alias del servidor local. Evidencia nueva con
AITHRON_FINAL_VALIDATION=1; no sustituye aceptación de negocio ni cambia NO-GO.
