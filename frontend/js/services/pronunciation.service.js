export const PRONUNCIATION_SESSION_KEY = 'aithron.demo.pronunciation.v1';

function read() {
 try {
  const raw = sessionStorage.getItem(PRONUNCIATION_SESSION_KEY);
  if (!raw) return { attempts: [] };
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.attempts)) return { attempts: [] };
  return parsed;
 } catch {
  return { attempts: [] };
 }
}

function write(state) {
 try {
  sessionStorage.setItem(PRONUNCIATION_SESSION_KEY, JSON.stringify(state));
 } catch {}
}

export function listPronunciationAttempts() {
 return read().attempts.slice().reverse();
}

export function addPronunciationAttempt(attempt) {
 const state = read();
 state.attempts.push({ id: `pa_${Date.now()}_${Math.random().toString(36).slice(2,8)}`, createdAt: new Date().toISOString(), ...attempt });
 write(state);
 return state.attempts[state.attempts.length-1];
}

export function clearPronunciationAttempts() {
 try { sessionStorage.removeItem(PRONUNCIATION_SESSION_KEY); } catch {}
}
