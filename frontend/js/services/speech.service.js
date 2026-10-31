import { config } from '../core/config.js';

// Envoltura sobre la Web Speech API. Cuando la síntesis de voz no está disponible,
// se informa con claridad y no se simula reproducción con animaciones. No se promete
// una voz idéntica en todos los dispositivos ni disponibilidad offline universal.
let active = null;

export function isSpeechSupported() {
 return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

function pickVoice(langTag) {
 if (!isSpeechSupported()) return null;
 const voices = window.speechSynthesis.getVoices?.() ?? [];
 const base = langTag.split('-')[0].toLowerCase();
 return voices.find(voice => voice.lang?.toLowerCase() === langTag.toLowerCase())
  ?? voices.find(voice => voice.lang?.toLowerCase().startsWith(base))
  ?? null;
}

export function hasVoiceFor(langTag) {
 if (!isSpeechSupported()) return false;
 if (window.speechSynthesis.getVoices?.().length === 0) return true; // aún sin cargar
 return Boolean(pickVoice(langTag));
}

/**
 * Reproduce un texto. `slow=true` reduce la velocidad de forma real mediante el motor
 * de síntesis (rate ≈ 0.6). Llama a `onState({status})` con 'speaking' | 'ended' |
 * 'stopped' | 'unsupported' | 'error'.
 */
export function speak(text, langTag, { slow = false, onState = () => {} } = {}) {
 stop();
 if (!isSpeechSupported()) { onState({ status: 'unsupported' }); return false; }
 const clean = String(text ?? '').trim();
 if (!clean) { onState({ status: 'error', reason: 'empty' }); return false; }
 const utterance = new SpeechSynthesisUtterance(clean);
 const voice = pickVoice(langTag);
 if (voice) utterance.voice = voice;
 utterance.lang = langTag;
 utterance.rate = slow ? config.speech.slowRate : config.speech.defaultRate;
 utterance.onstart = () => onState({ status: 'speaking', slow });
 utterance.onend = () => { if (active === utterance) active = null; onState({ status: 'ended', slow }); };
 utterance.onerror = event => { if (active === utterance) active = null; onState({ status: 'error', reason: event?.error ?? 'unknown', slow }); };
 active = utterance;
 window.speechSynthesis.speak(utterance);
 return true;
}

export function stop() {
 if (!isSpeechSupported()) return;
 active = null;
 window.speechSynthesis.cancel();
}

export function isSpeaking() {
 return active !== null;
}
