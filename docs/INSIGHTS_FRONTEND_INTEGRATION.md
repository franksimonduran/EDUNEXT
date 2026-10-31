# Frontend

Cliente nuevo: `frontend/js/services/insights-api.service.js`, reutiliza `apiRequest`
de auth; expone `insightRuleCatalog` y `readInsights(code, filters)`. Lista finita
de fuentes; sin tokens en almacenamiento, sin fallback demo y sin caché privada.

No hay pantallas conectadas ni flujos de navegador verificados. Se conservaron
Dashboard Monitor y sugerencias locales de refuerzos. La búsqueda de Fase 20
encontró referencias demostrativas, no un módulo Insights completo que conectar.

Pendiente: selector explícito demo/API, estados de carga/red/403/sesión expirada,
explicación accesible, filtros autorizados, lenguaje de primaria, navegación por
teclado y pruebas móvil. El cliente aislado no se presenta como integración visual.
