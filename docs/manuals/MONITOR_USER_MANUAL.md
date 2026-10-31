# Manual Monitor/Docente — alcance pendiente de aceptación

No capacitar con datos reales ni registrar notas escolares en esta copia. Acceso real, asignación y aislamiento requieren validación de API/DB; la ruta `/monitor/index.html` es demo explícita.

| Tarea / ruta de referencia | Procedimiento y límite |
|---|---|
| Dashboard/aulas/estudiantes | Revisar avisos demo. En versión autorizada, usar solo asignaciones vigentes; elegir aula local no concede acceso |
| Cursos/Estudio (`cursos.html`) | Abrir curso/unidad/lección, preparar borrador y previsualizar. Guardado IndexedDB no publica contenido |
| Prácticas | Revisar consigna/opciones/feedback y versión. Publicación/intento persistente debe validarse antes de uso escolar |
| Evaluaciones (`evaluaciones.html`) | Borradores locales; flujo completo instrumento→asignación→revisión→publicación no aceptado |
| Revisión/competencias/AD-A-B-C | Evidencias, criterio y valoración deben ser humanas y autorizadas. No convertir aciertos/porcentajes ni promediar niveles como números |
| Tareas (`tareas.html`) | Modo demo/API inicial. Validar destinatarios/fecha civil/zona horaria; publicación, entrega y feedback requieren confirmación backend |
| Refuerzos | Preparar recursos y destinatarios; una sugerencia no crea un plan. Confirmar explícitamente operación autorizada |
| Calendario | Contrastar aula/curso/fechas y estado, no asumir que todos los eventos locales son institucionales |
| Reportes | Distinguir fuentes confirmadas/insuficientes; no exportar aula ajena o datos innecesarios |
| Insights | Tarjeta de reglas ficticias, sin motor real. No diagnósticos, rankings o decisiones automáticas |
| Perfil/sesión | Preferencias locales no elevan permisos. Logout/revocación y cuenta compartida por validar |

## Manejo de errores y protección

403 no es desconexión; no buscar otro ID para saltarlo. 409 exige revisar estado/versiones; 422 corregir campos conservando borrador; 429 esperar. No presentar propuesta local como publicación/nota/entrega. No borrar respuestas ante un error ni registrar conversaciones privadas/audio como evidencia indiscriminada.

## Ensayo de formación

Solo con ejemplos: consultar un aula demo, preparar un borrador local, explicar diferencia entre propuesto/publicado y localizar un aviso de indisponibilidad. La práctica no concede permiso docente ni constituye capacitación ya realizada. Para flujo real tarea→estudiante→feedback se requiere entorno aislado y superar gates. [Soporte](../operations/SUPPORT_GUIDE.md) y [privacidad](PRIVACY_AND_SAFETY_GUIDE.md).
