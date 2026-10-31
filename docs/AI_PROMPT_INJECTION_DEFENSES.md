# Prompt injection

Defensas implementadas:

1. Permisos e institución antes de contexto o llamada.
2. Catálogo publicado/aprobado y matrícula/asignación reales.
3. Lista de campos textuales permitidos; nunca snapshot completo ni correct_answer.
4. System message separado del JSON de pregunta/contexto, marcado como no confiable.
5. Sin tools, SQL, browsing, funciones administrativas o URLs elegidas por usuario.
6. Provider/model/opciones solo backend; endpoints loopback sin redirects/proxies.
7. JSON schema de salida solo answer, rol/modelo/done validados.
8. Límites y rechazo de patrones conocidos, enlaces/HTML activo y referencias numéricas.
9. Fuentes construidas por servidor y texto escapado antes de HTML.

Pruebas: órdenes conocidas en pregunta y en contenido publicado, filtrado de
correct_answer, texto malicioso de salida y ausencia de campos/modelos arbitrarios.
Los mocks comprueban controles, no resistencia semántica de un modelo real.

No se garantiza detectar órdenes ofuscadas, todas las citas inventadas en prosa o
alucinaciones. Las fuentes indican contexto consultado, no prueba automática de
veracidad. La evaluación adversarial con modelo real y la política editorial
completa de las fases anteriores siguen siendo necesarias.
