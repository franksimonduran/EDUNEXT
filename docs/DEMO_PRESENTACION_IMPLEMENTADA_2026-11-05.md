# EDUNEXT — recorrido de presentación implementado (2026-11-05)

## Propósito
Demostración educativa exclusivamente con datos sintéticos, sin login real, FastAPI o PostgreSQL.
La rama `backup-main-2026-11-05` contiene el estado anterior a la adaptación para Pages.

## Archivos incorporados y modificados
- `frontend/demo.html` / `frontend/css/pages/demo.css`: portada de presentación, perfiles y acciones.
- `frontend/student/recorrido-demo.html` / `frontend/css/pages/demo-story.css`:
  lectura guiada de Comunicación de 5.º grado, cinco preguntas y pantalla de resultado.
- `frontend/js/demo/scenario.js`: banco de preguntas y cálculo determinista de aciertos;
  almacenamiento exclusivo en `edunext:presentacion:lectura:v1`.
- `frontend/js/demo/activity.js`: flujo de preguntas, explicación, repetición y enlaces entre roles.
- `frontend/js/demo/landing.js`: resultado en portada y reinicio limitado a la clave de la demo.
- `frontend/js/demo/dashboard-banner.js` / `frontend/css/pages/demo-dashboard.css`:
  tarjeta del resultado en los dashboards originales de Estudiante, Monitor y Administrador.
- `frontend/student/index.html`, `frontend/monitor/index.html`, `frontend/admin/index.html`:
  importan ese único módulo adicional, sin sustituir ni editar sus métricas históricas.
- `tests/demo-presentation.mjs`: verificaciones de puntuación, reinicio aislado y referencias de UI.
- `.github/workflows/ci.yml`: ejecuta la nueva prueba en CI.

## Recorrido para presentación
1. Abrir `frontend/demo.html` (servido por HTTP, no mediante `file://`).
2. Seleccionar **Comenzar recorrido interactivo**; leer y contestar cinco preguntas.
3. Pulsar **Finalizar práctica**. El porcentaje resulta de comparar las cinco respuestas
   seleccionadas contra las soluciones del banco sintético, no se inventa la puntuación.
4. Abrir **Estudiante**: la tarjeta nueva presenta el resultado calculado.
5. Abrir **Monitor**: la tarjeta identifica a Estudiante Demo 01 y presenta el mismo resultado.
6. Abrir **Administrador**: la tarjeta muestra el mismo resultado con advertencia de que no
   actualiza los demás indicadores institucionales existentes.
7. Volver a `demo.html`; la portada refleja la puntuación y permite **Reiniciar solo esta práctica**.

Solo funciona entre perfiles del **mismo navegador y origen** si localStorage está disponible.
No hay sincronización remota ni aislamiento de cuentas reales. Si el navegador impide guardar
datos, la puntuación se muestra solo en la pestaña en que se realizó el ejercicio.

## Verificación
Desde la raíz con Node 24:

```powershell
node tests/demo-presentation.mjs
$env:AITHRON_FINAL_VALIDATION='1'
node tools/demo-audit.cjs
node tools/demo-smoke.cjs
```

Las dos pruebas de navegador requieren su entorno descrito en `docs/DEMO_NAVEGABLE.md`.
La prueba de puntuación no sustituye una comprobación manual en GitHub Pages.

## Publicación
GitHub Pages sirve solo `frontend/` a través de
`.github/workflows/deploy-demo-pages.yml`, sujeto a configuración del repositorio.
No se afirma publicado hasta que la acción de despliegue concluya correctamente.
Si el repo sigue privado en un plan no compatible, mantenerlo privado y publicar
una copia sanitizada del frontend en un repo separado, con revisión previa.

## Limitaciones deliberadas
- Los paneles originales mantienen sus estadísticas ficticias independientes;
  la nueva tarjeta común es el único resultado dinámico entre perfiles.
- Sin autenticación, alta real, calificaciones oficiales, sincronización multiusuario ni API.
- La vista de IA y el traductor preexistentes no se declaran operativos por estos cambios.
- No usar información personal, respuestas de estudiantes reales ni cuentas escolares.
- El uso institucional con menores, producción y piloto real siguen NO-GO.
