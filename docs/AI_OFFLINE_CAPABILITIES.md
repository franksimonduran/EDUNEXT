# Capacidades offline reales

- Tutor generativo: no disponible sin backend/proveedor; no existe modelo en navegador.
- Traducción contextual: no disponible sin modelo operativo autorizado.
- Vocabulario de proyecto: 38 ejemplos existentes; consulta frontend local solo si
  sus módulos están realmente preparados/descargados. API exige conexión al servidor.
- Pronunciación: lectura/repetición de referencias y voz local si el dispositivo la
  ofrece. No hay reconocimiento, transcripción o análisis fonético offline.
- Recursos de lecciones/audio: se conservan motores anteriores, sin prometer que
  un archivo no descargado esté disponible.

El Service Worker existente no cambia; excluye /api/ y no cachea nuevas respuestas
privadas IA. No se añadieron claves, audio o chats a cachés. No se elimina IndexedDB.
Modo demo conserva respuestas preescritas identificadas; no es IA local.

No hay cola/sincronización de conversaciones o grabaciones, ni confirmaciones
simuladas. FASE 46 no implementada. Los tests no acreditan preparación offline
completa ni cambio de usuario en todos los módulos demo heredados.
