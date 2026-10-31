// Mantener los textos de datos separados de las plantillas y escapar contenido.
export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
export function progressBar(value, label) {
  const safe = Math.min(100, Math.max(0, Number(value) || 0));
  return `<progress max="100" value="${safe}" aria-label="${escapeHTML(label)}">${safe}%</progress>`;
}
export function emptyState(message) { return `<p class="empty-state">${escapeHTML(message)}</p>`; }
