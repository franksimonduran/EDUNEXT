# Limitaciones y aceptación — FASE 41

Estado: **parcial**. No es una fase completa ni certificada.

## Implementado

Progreso propio lección/unidad/curso, inicio/finalización explícita, historial SQL,
dos reconocimientos personales persistentes, consulta docente asignada, agregados
institucionales mínimos con supresión, integración de la pantalla de progreso y
migración aditiva probada/aplicada.

## Fuentes bloqueadas

FASE 39: publicación, integridad de resultados y privacidad incompletas. Juegos
aceptan resultados cliente. No se muestran como actividades confirmadas.
FASE 40: no hay registros/competencias confirmados operativos. Estado explícito
`not_available`, no cifras ficticias. No se reimplementaron esas APIs aquí.

FASE 38: el catálogo filtra aprobación independiente, validación y publicación,
pero la integridad/inmutabilidad editorial heredada requiere endurecimiento.

## Pendientes de integridad/verificación

- Referencias de contexto nuevas viven en JSON; falta migración contextual con
  claves compuestas y política de progreso por matrícula cuando cambie institución.
- Bloqueo estudiantil implementado, pero no se ejecutó prueba de dos transacciones
  independientes concurrentes ni carrera publicación/retiro contra finalización.
- No hay snapshot transaccional repetible para todo el resumen ante cambios
  editoriales concurrentes. El catálogo usa referencia estable del conjunto leído.
- No hay importación/reconciliación de progreso legacy; conflicto 409 conserva fila.
- Falta revocación/rectificación de reconocimientos con auditoría.
- Solo indicadores actuales y rangos temporales en historial; no gráficos por
  semana/mes ni agregación normativa por periodo para todas las fuentes.
- Monitor/Administrador: APIs mínimas, pantallas pendientes. La página estudiante
  conserva shell previo, sin completar integración de identidad visual de cuenta.
- Faltan pruebas de concurrencia, login real, cambio de identidad, conjunto completo
  de regresión, E2E real y pruebas offline de la nueva pantalla.

## Fuera de alcance

EDUNEXT Insights avanzado, predicciones, reportes completos, tareas/refuerzos,
calendario real, IA, SYNC remoto, sincronización multidispositivo, promoción y
boletas. Sin rankings, dinero, rachas obligatorias ni conversiones a AD/A/B/C.
