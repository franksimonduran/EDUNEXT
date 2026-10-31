# AI en infraestructura

Configurado en plantillas/Compose: AITHRON_AI_ENABLED=false, sin credenciales externas/modelo descargado. No se creó otro gateway ni servicio cloud. Diccionario existente se copia a la ruta relativa del backend; build/lectura runtime sin verificar.

Ollama previo permite loopback estricto; dentro de Docker loopback refiere al propio contenedor, no al host. No cambiar a host.docker.internal/red remota ni desactivar restricciones para sortearlo sin diseño autorizado de privacidad/egress. Proveedor real sigue bloqueado; no se activa contenedor/modelo adicional por defecto.

Para habilitar en futuro: proveedor/modelo y host autorizados, política institucional/menores/retención verificada, límites de usuario/institución/concurrencia, contextos permitidos, evaluaciones pedagógicas y seguridad semántica, observabilidad solo técnica, presupuesto y fallo/timeout probados. No auto fallback a cloud ni reintentos masivos. Audio/transcripciones/voz real no disponibles; referencias no son evaluación fonética.

Estado: plantillas preparadas, generación/voz no verificadas, disponibilidad de proveedor no configurada. Ninguna clave o conversación se envió durante preparación. No se prometen costos o precisión.
