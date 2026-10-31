export function isSpeechRecognitionSupported() {
 if (typeof window === 'undefined') return false;
 return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function createSpeechRecognition() {
 if (!isSpeechRecognitionSupported()) return null;
 const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
 return new SpeechRecognition();
}
