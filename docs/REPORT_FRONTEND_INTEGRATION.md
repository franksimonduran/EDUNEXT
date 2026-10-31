# Integración frontend

Pantallas existentes ampliadas:

- Estudiante: `student/progreso.html?modo=api&vista=reportes`, enlace desde progreso API.
- Monitor: `monitor/reportes.html?modo=api` y vistas que comparten controlador de reportes.
- Administrador: `admin/reportes.html?modo=api`.

Componentes: `reports-api-view.js` compartido y `reports-api.service.js`.
Reutilizan shells, estilos, tablas, formularios y Fetch autenticado. Se añadió
apiDownload al servicio auth para conservar tokens en memoria/sesión sin copiarlos
a nuevos almacenamientos; también conserva renovación de sesión al descargar Blob.

El catálogo autorizado configura reportes/filtros. Opciones docentes vienen de
reportes/monitor/context y años institucionales de reportes/institution/context.
Hay selección de fecha de corte ISO consciente de zona para matrícula y rangos
since/until para historial/serie. No se utilizan IDs de aulas demo como autorización.

Tablas con caption y encabezados, medidores porcentuales con texto/etiqueta,
mensajes role=status, navegación de páginas y detalles de fuente/filtros/fórmulas.
Datos se escapan antes de HTML; null se muestra no disponible. Una consulta fallida
retira la tabla anterior. Respuestas tardías de solicitudes obsoletas se descartan.
No se comunica progreso exclusivamente por color.

Modo demo mantiene controladores anteriores. En API no se sustituyen 403/503 por
datos ficticios. No se cachean reportes ni exportaciones en IndexedDB/Cache Storage.
La prueba Chromium utiliza viewport 390×844 y API simulada para tres perfiles.

Pendiente: integrar todos los dashboards y pantallas estadísticas FASE 28,
gráficos de barras/líneas completos, filtros avanzados, shell de identidad de cuenta
completamente autenticado, E2E navegador–JWT–PostgreSQL y pruebas con lector físico.
El shell legado conserva avisos/navegación demostrativos fuera del visor adaptado.
