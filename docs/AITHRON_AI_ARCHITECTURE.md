# EDUNEXT AI Engine — FASE 45

Estado: **parcial; generación real bloqueada por proveedor/modelo no operativo**.
No se presenta la ejecución de mocks como integración real.

## Componentes

- Router `app/api/v1/endpoints/ai.py`, integrado en API v1.
- Schemas estrictos `app/schemas/ai.py`; no admite identidad, modelo, claves o notas.
- AIGatewayService: identidad, políticas, contexto, seguridad, reserva de consumo,
  invocación, validación y persistencia técnica mínima.
- AIContextService: matrícula/asignación y catálogo publicado de FASE 38/41.
- AIRepository: configuración y cuotas transaccionales con bloqueo institucional.
- DictionaryRepository: lectura del recurso existente como datos, sin ejecutar JS.
- TextProvider/ProviderResult y OllamaProvider: contrato y adaptador HTTP local.
- Servicio de retención y worker periódico integrado en lifespan de FastAPI.
- Middleware IA: límite de transporte de 16 KiB antes del parseo JSON.

## Flujo generativo

Sesión/RBAC → identidad activa → configuración aplicada → texto y contexto autorizado
→ comprobación conservadora de evaluación registrada en curso → disponibilidad del
modelo → bloqueo/reserva de cuota → commit de reserva → llamada local acotada →
validación → metadatos de resultado → commit → respuesta con origen e incertidumbre.

Las reservas evitan repetir automáticamente operaciones potencialmente costosas.
No se guardan preguntas/respuestas para reproducirlas: repetir una clave da 409.
No hay herramientas de modelo, SQL libre, navegación web, ejecución de código ni
acciones sobre notas, matrículas, contenidos, tareas o reportes.

## Persistencia

AIServiceConfiguration, AIUsageEvent y PronunciationSession de referencia. No se
crean copias académicas, conversaciones, mensajes, audios o transcripciones.
Migración aditiva phase45ai después de phase43reports: no se encontró backend de
FASE 44 en el árbol recibido; no se reconstruyó ni simuló Insights.

## Frontend

Se amplían Tutor FASE 7, Traductor FASE 8 y Pronunciación FASE 9 en sus páginas
existentes. Administración utiliza estado-servicios.html en modo API. No hay otro
frontend, framework ni Service Worker. Ver AI_FRONTEND_INTEGRATION.md.
