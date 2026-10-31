# FASE 9 - AITHRON PRONUNCIA

## Objetivo
Implementar el módulo de pronunciación (modo demostrativo) para prácticas orales palabra a palabra, con grabación temporal local (sin almacenamiento permanente ni envío a servidor). Respeta identidad AITHRON EDU, HTML5/CSS3/JS ES6+ puro y principios de privacidad infantil.

## Alcance
- Pantallas: `pronuncia.html`, `practicar-pronunciacion.html`, `resultado-pronunciacion.html`, `historial-pronunciacion.html`
- Datos demostrativos: palabras/frases por 4.º–6.º primaria (ES/EN), dificultades y temas.
- Servicios: micrófono, grabación temporal (MediaRecorder), soporte de reconocimiento opcional (no simula puntuación), sesión de intentos (SessionStorage).
- Componentes: tarjeta, control de micrófono, visualizador, pasos, feedback.
- Integraciones: Traductor ("Inténtalo tú"), Vocabulario, Sidebar, Dashboard, Rutas de aprendizaje.
- CSS responsive, accesible, sin animaciones engañosas.

## Archivos creados
- `frontend/js/data/pronunciation-demo.data.js`
- `frontend/js/services/microphone.service.js`, `frontend/js/services/recording.service.js`, `frontend/js/services/speech-recognition.service.js`, `frontend/js/services/pronunciation.service.js`
- `frontend/js/utils/speech-compatibility.js`, `frontend/js/utils/pronunciation-validation.js`
- `frontend/js/components/pronunciation-card.js`, `frontend/js/components/microphone-control.js`, `frontend/js/components/voice-visualizer.js`, `frontend/js/components/practice-steps.js`, `frontend/js/components/pronunciation-feedback.js`
- `frontend/js/student/pronunciation-i18n.js`, `frontend/js/student/pronuncia.js`, `frontend/js/student/practicar-pronunciacion.js`, `frontend/js/student/resultado-pronunciacion.js`, `frontend/js/student/historial-pronunciacion.js`
- `frontend/student/pronuncia.html`, `frontend/student/practicar-pronunciacion.html`, `frontend/student/resultado-pronunciacion.html`, `frontend/student/historial-pronunciacion.html`
- `frontend/css/student/pronunciation.css`

## Archivos modificados
- `frontend/js/student/learning-routes.js`: rutas `pronunciation`, `pronunciation-practice`, `pronunciation-result`, `pronunciation-history`
- `frontend/js/components/sidebar.js`: ítem Pronuncia
- `frontend/js/student/dashboard.js`: acceso rápido Pronuncia
- `frontend/js/student/translator.js`: "Inténtalo tú" redirige a práctica (fallback a lista)
- `frontend/js/components/vocabulary-card.js`: acción Pronunciar

## Características
- Grabaciones temporales: solo locales, nunca enviadas; se limpian al salir/reemplazar.
- Sin puntuación/porcentajes automáticos. Modo demostrativo, mensajes educativos.
- Compatible con Web Speech (síntesis), micrófono con manejo de permisos y cleanup.
- Accesibilidad: roles, aria, estados claros.

## Pruebas
Manuales recomendadas: permisos, grabar/reproducir/eliminar, persistencia sesión (SessionStorage), navegación entre pantallas, responsive 320–1440, sin errores consola.
