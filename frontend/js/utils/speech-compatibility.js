export function supportsGetUserMedia() {
 return typeof navigator !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

export function supportsMediaRecorder() {
 return typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined';
}

export function supportsWebSpeechRecognition() {
 if (typeof window === 'undefined') return false;
 return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function supportsSpeechSynthesis() {
 return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function safeStopTracks(stream) {
 if (!stream) return;
 try {
  stream.getTracks().forEach(t => { try { t.stop(); } catch {} });
 } catch {}
}
