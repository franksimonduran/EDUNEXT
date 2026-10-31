# Privacidad de audio

Estado actual API: **no recibe grabaciones**. No hay audio temporal, archivos,
biometría, transcripciones ni proveedor de reconocimiento. Las sesiones guardan
solo propietario, institución, referencia de vocabulario, idioma y expiración.

El modo autenticado no solicita getUserMedia ni inicia captura al cargar la página.
Permite aprender sin micrófono. La prueba de navegador intercepta solicitudes de
micrófono y verifica que no ocurren en el flujo de referencia.

FASE 9 demo conserva sus funciones previas de grabación voluntaria. Eso no acredita
integración de voz IA, reconocimiento offline o puntuación fonética. La regresión
completa de dispositivos/formatos/permisos denegados reales no fue ejecutada.

Antes de aceptar voz: motor autorizado, finalidad, formatos reales/duración/tamaño,
consentimientos aplicables, transporte HTTPS, acceso y eliminación verificable.
No reenviar audio a terceros por defecto. La implementación actual no evita ese
requisito mediante una transcripción o puntuación inventada.
