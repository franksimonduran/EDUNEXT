export function bytesToMB(b){ if(!b)return '0 MB'; const mb=(b/1048576); return mb<0.01? '<0,01 MB': `${mb.toFixed(2)} MB`; }
export function formatDate(d){ try { const dt=new Date(d); return dt.toLocaleString(); } catch{return '-';} }
export function isOnline(){ return navigator.onLine; }
