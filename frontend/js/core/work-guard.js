// In-memory navigation protection only. Never persists answers or credentials.
export function protectWork({ hasUnsavedChanges, message }) {
  let active = true;
  const dirty = () => active && hasUnsavedChanges();
  const canLeave = () => !dirty() || window.confirm(message());
  const beforeUnload = event => {
    if (!dirty()) return;
    event.preventDefault();
    event.returnValue = '';
  };
  const navigate = event => {
    const link = event.target.closest?.('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href, location.href);
    if (url.origin === location.origin && url.pathname === location.pathname && url.search === location.search && url.hash) return;
    if (!canLeave()) { event.preventDefault(); event.stopImmediatePropagation(); }
  };
  window.addEventListener('beforeunload', beforeUnload);
  document.addEventListener('click', navigate, true);
  return {
    canLeave,
    dispose() {
      active = false;
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('click', navigate, true);
    },
  };
}
