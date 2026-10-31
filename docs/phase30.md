# Fase 30 — configuración administrativa (avance verificable)

## Implementado

Doce rutas administrativas reutilizan `admin-settings.js`, el shell existente, el selector de avatares y `preferences.service.js`. Las preferencias se guardan únicamente en el ámbito `demo-admin`. Alias y avatar se reflejan en las páginas que usan el shell administrativo.

Las propuestas institucionales tienen identidad estable, revisión transaccional, snapshot de base, versiones, validación, comparación, archivado y eliminación confirmada. No escriben en datos de institución, matrículas, contenidos ni calificaciones. IndexedDB se amplía de v7 a v8 mediante la migración compartida, conservando los almacenes previos. Los almacenes técnicos previstos por la fase anterior se crean en esta misma migración para evitar aperturas independientes de versión 8.

Configuración académica consume las relaciones compartidas, los periodos y la escala cualitativa existente. AD/A/B/C no se convierte desde porcentajes. Seguridad consulta la matriz de permisos original. Privacidad y ayuda distinguen documentación ausente y servicios pendientes.

No se encontró ZIP visual dentro del repositorio.

## Cómo abrir

Servir `frontend` mediante HTTP local y abrir `/admin/configuracion.html`. Desde allí hay enlaces a perfil, editor, institución, configuración académica, parámetros, preferencias, seguridad, privacidad, notificaciones, ayuda y revisión de propuestas.

## Prueba ejecutada

`node tests/phase30.cjs` — PASS en Chromium: apertura de doce páginas, ausencia de errores JavaScript durante el recorrido, ancho de 320 px sin desbordamiento global, guardado y recarga de alias/avatar, Topbar personalizado, propuesta guardada dos veces con un único ID y revisión 2, recuperación y diferencias, institución base intacta.

## Pendiente para cerrar la fase

- Preferencias administrativas de notificación por categoría y estados de lectura en campana.
- Parámetros institucionales específicos por tipo: actualmente comparten el formulario y no constituyen editores especializados de política académica o funcionalidades.
- Periodo inicial y preferencias ampliadas de reportes: solo se exponen las opciones actualmente admitidas por el servicio compartido.
- Prueba offline con desconexión controlada, auditoría de accesibilidad/contraste y regresiones completas de fases anteriores.
- El frontend de las fases 27–29 contiene problemas previos de sintaxis/imports e integración que no quedan certificados por esta prueba. Las afirmaciones anteriores de finalización completa no deben considerarse evidencia de ejecución.

FastAPI deberá validar identidad, institución, permisos, versión base, dependencias y autorización antes de presentar o aplicar una configuración. No se llama a endpoints futuros. Contraseñas, 2FA, sesiones remotas, publicación, cambios de roles y auditoría oficial siguen sin integrar.
