# Rendimiento frontend

Prueba real limitada al login estático, no a dashboards/lecciones/juegos/AI. Navigation Timing por viewport en JSON. Sin throttling de red/CPU; no representa equipos escolares limitados. No se midieron Web Vitals ni fugas de memoria.

Inventario registra tamaños de fuentes seleccionadas; excluye binarios y no representa audio/imágenes transferidos. No se optimizó contenido pedagógico ni se eliminó código por tamaño. No se declara lazy loading adecuado en todas las páginas.

SW refresca en red activos públicos conocidos y conserva caché solo permitida; cuota de cache.put no descarta respuesta de red. No se mejora velocidad sacrificando privacidad. El cambio puede reducir disponibilidad offline de vistas preparadas anteriormente; aceptado solo como restricción temporal de seguridad, no como PWA completa.

Pendiente: assets multimedia completos, CSS/JS duplicado/import graphs, acciones de curso/práctica/tarea/calendario, LCP/INP/CLS, memoria tras navegación prolongada y variantes táctiles/zoom.
