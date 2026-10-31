# Ayuda híbrida móvil — primera entrega acotada

Estado: candidato interno, NO-GO para uso real. Sin activación de proveedores,
sincronización, cuentas, servicios de pago ni piloto. No cambia actas anteriores.

## Implementado

El tutor de demostración permite descargar una guía HTML autónoma con explicaciones,
pistas y preguntas del grado seleccionado. Reutiliza el catálogo demostrativo:
material pendiente de revisión pedagógica, no contenido aprobado ni IA generativa.

No requiere red, scripts, imágenes ni almacenamiento del navegador. Exporta solo
campos educativos explícitos, nunca conversaciones, identidades ni tokens. Incluye
escape HTML, CSP restrictiva y diseño de lectura móvil. No modifica IDB, SW o notas.
El botón no aparece en modo API: no se habilita exportación de contenido privado.
Es necesario abrir primero el tutor demo para solicitar la descarga.

## Verificación y límites

Con `AITHRON_FINAL_VALIDATION=1`, `node tests/offline-study.cjs` pasó comprobaciones
sintéticas de generación, escape, exclusión de campos privados, grados, límites y
ausencia de dependencias activas. Guarda evidencia nueva y hashes SHA-256.
`node tools/run-phase48-regression.cjs` pasó cuatro suites Node y tres verificaciones
de sintaxis. Son pruebas de contratos/VM/loopback, no FastAPI/PostgreSQL/E2E.

Pendiente comprobar descarga y apertura en Android/iOS y tablets físicos; algunos
gestores de archivos restringen HTML. Sin revisión pedagógica ni uso con menores.

## Resto del plan pendiente

1. Validar autenticación, RBAC, instituciones y persistencia en entorno propio.
2. Definir revisión, publicación y distribución segura de materiales reales.
3. Elegir proveedor online, presupuesto y privacidad antes de implementar/activar
   el adaptador; reutilizar gateway y cuotas, sin cambio silencioso a nube.
4. Implementar asistente de monitor con permisos y borradores, sin notas automáticas.
5. Medir modelo y computadora del colegio: HTTPS, acceso móvil y concurrencia.
6. Resolver gates y obtener autorización específica antes de un piloto real.

Esta entrega no completa la IA online ni la IA local del colegio.
