# Práctica oral de referencia, no evaluación fonética

Disponibles: referencias del vocabulario local y sesiones reference_only de un día.
POST /ai/pronunciation/sessions recibe dictionary_entry_id existente; exige permiso,
perfil estudiante activo y contexto institucional. Máximo 20 sesiones vigentes por usuario.
GET sesión comprueba propietario/institución/expiración.

Respuesta: texto de referencia, idioma, estado, expiración y origen. transcription
y phonetic_score son null. No se inventan porcentajes ni se diagnostica habla.

POST /sessions/{id}/attempts verifica acceso y responde 503: no existe motor de
reconocimiento/análisis configurado. No se leen, procesan ni persisten grabaciones.
El límite de transporte también aplica; no se declara un formato de audio aceptado.

La página existente permite leer/repetir sin micrófono. Reproduce voz únicamente
por acción del usuario y si el navegador declara una voz local compatible; se
puede detener y siempre hay texto. No hay proveedor TTS de servidor ni garantía
de voz local en cada equipo. El modo demo previo conserva su captura voluntaria
separada; no se invoca SpeechRecognition del navegador en modo API.

Reconocimiento, validación de formatos/duración para futura recepción, transcripciones,
intentos orales y feedback fonético siguen pendientes. Una futura transcripción no
equivaldrá a evaluación de pronunciación. No se penalizan acentos ni se crean notas.
