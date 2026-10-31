// Shared by student rendering and teacher authoring; never accepts arbitrary origins.
const base=new URL('../../',import.meta.url);
export function safeResourceURL(value){try{const u=new URL(value);return u.origin===base.origin&&u.pathname.startsWith(base.pathname)&&/\.(svg|png|jpg|jpeg|webp|wav|mp3|html)$/.test(u.pathname)?u.href:null;}catch{return null;}}
