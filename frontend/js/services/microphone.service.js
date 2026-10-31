export function isMicrophoneSupported() {
 return typeof navigator !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

export function isMediaRecorderSupported() {
 return typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined';
}

export async function requestMicrophone({ audio = true } = {}) {
 if (!isMicrophoneSupported()) throw new Error('unsupported');
 const stream = await navigator.mediaDevices.getUserMedia({ audio });
 return stream;
}

export function stopStream(stream) {
 if (!stream) return;
 try {
  stream.getTracks().forEach(track => { try { track.stop(); } catch {} });
 } catch {}
}
