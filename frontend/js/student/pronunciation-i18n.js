export const ps = key => translations[key]?.[getLocale()] ?? translations[key]?.es ?? key;

export function getLocale() {
 if (typeof localStorage === 'undefined') return 'es';
 return localStorage.getItem('aithron.locale') || 'es';
}

const translations = {
 title: { es: 'EDUNEXT Pronuncia', en: 'EDUNEXT Pronounce' },
 description: { es: 'Practica pronunciación palabra a palabra. Modo demostrativo.', en: 'Practice pronunciation word by word. Demo mode.' },
 demo: { es: 'Modo demostrativo', en: 'Demo mode' },
 noMic: { es: 'Micrófono no disponible', en: 'Microphone not available' },
 micDenied: { es: 'Permiso de micrófono denegado', en: 'Microphone permission denied' },
 unsupported: { es: 'Funcionalidad no soportada en este navegador', en: 'Not supported in this browser' },
 recording: { es: 'Grabando...', en: 'Recording...' },
 stopRecording: { es: 'Detener grabación', en: 'Stop recording' },
 startRecording: { es: 'Iniciar grabación', en: 'Start recording' },
 noRecording: { es: 'No hay grabación para reproducir', en: 'No recording to play' },
 deleteRecording: { es: 'Eliminar grabación', en: 'Delete recording' },
 listenTarget: { es: 'Escuchar palabra', en: 'Listen to word' },
 listenSlow: { es: 'Escuchar lento', en: 'Listen slowly' },
 modelWord: { es: 'Palabra modelo', en: 'Model word' },
 yourTry: { es: 'Tu intento', en: 'Your attempt' },
 history: { es: 'Historial', en: 'History' },
 back: { es: 'Volver', en: 'Back' },
 tryAgain: { es: 'Intentar de nuevo', en: 'Try again' },
 saveAttempt: { es: 'Guardar intento', en: 'Save attempt' },
 attemptSaved: { es: 'Intento guardado en historial', en: 'Attempt saved to history' },
 noAttempts: { es: 'Aún no hay intentos registrados', en: 'No attempts yet' },
 clearHistory: { es: 'Borrar historial', en: 'Clear history' },
 recordedAt: { es: 'Grabado el', en: 'Recorded on' },
 privacyNote: { es: 'Las grabaciones son temporales y locales. No se envían al servidor.', en: 'Recordings are temporary and local. They are not sent to server.' },
 practiceSoon: { es: 'Práctica de pronunciación disponible próximamente', en: 'Pronunciation practice coming soon' },
};
