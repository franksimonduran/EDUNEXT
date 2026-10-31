# Plan de validación final — sin piloto autorizado

Objetivo: comprobar lo que permita el entorno, preservar datos y entregar un candidato interno con límites, no aprobar por documentación. Congelación funcional: solo defectos/seguridad/accesibilidad/integridad/docs imprescindibles; mejoras al backlog.

Niveles separados: técnico (Node/fixtures/navegador), funcional (acciones persistentes), usuario (tareas humanas), pedagógico (revisor profesional), institucional (aprobación) y operacional (soporte/recuperación). Hoy solo se dispone de evidencia técnica parcial.

Prerrequisitos críticos no satisfechos: Fases 47/48 aceptadas, Python/PG aislados, infraestructura/restore, cuentas y dos instituciones realmente sembradas, privacidad/soporte y responsables. Fixtures descriptivas no crean cuentas/registro académico.

Ejecución local: inventario fuente → cuatro suites Node + contratos infra → navegador público/login y cinco vistas demo → catálogo/links/documentos/gates → informe de pruebas → candidato/hash solo tras revisar resultados. Evidencia nueva separada en evidence/, no sustituye baseline anterior.

Escenarios funcionales R01–R28: prerequisitos/pasos/esperados/prioridad/defecto/estado en FINAL_ACCEPTANCE_CASES.json y matriz generada. Todos conservan estado parcial/bloqueado/no implementado hasta prueba real pertinente; un mock nunca aprueba login/tenant/entrega/Sync.

Próximo ensayo seguro cuando sea posible: DB nueva propia, dos instituciones sintéticas, auth/roles, publicación/tarea/entrega/feedback/progreso/tenant y recuperación, sin reset en base ajena. Piloto con niños, encuestas, micrófono, envíos institucionales y lanzamiento permanecen NO-GO sin aprobaciones específicas.
