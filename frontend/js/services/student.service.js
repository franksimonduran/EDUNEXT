import { getStudentDemo } from '../data/student-demo.data.js';

export async function loadStudentDemo(grade) {
  return getStudentDemo(grade);
}

/** Adaptador Fetch futuro, no invocado por la demostración. */
export async function fetchStudentDashboard(endpoint, { signal } = {}) {
  const url = new URL(endpoint, window.location.origin);
  if (url.origin !== window.location.origin || !url.pathname.startsWith('/api/')) {
    throw new TypeError('La información del estudiante debe proceder de la API del mismo sitio.');
  }
  // El servidor deberá autenticar la sesión y autorizar los datos que devuelve.
  const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Student dashboard request failed (${response.status}).`);
  return response.json();
}
