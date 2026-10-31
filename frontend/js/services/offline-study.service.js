/** Public demonstration material only. No credentials, chat or student records. */
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function buildOfflineStudyGuide(grade,examples){
 if(![4,5,6].includes(grade))throw new Error('Grado no admitido');
 if(!Array.isArray(examples)||!examples.length||examples.length>20)throw new Error('Material no disponible');
 const sections=examples.map(item=>{
  if(item.grade!==grade)throw new Error('El material no corresponde al grado');
  // Explicit allowlist: never serialize the complete model or active conversation.
  return `<section><h2>${escape(item.subject)}: ${escape(item.title)}</h2><h3>Explicación</h3><p>${escape(item.explanation)}</p><h3>En palabras sencillas</h3><p>${escape(item.easy)}</p><h3>Pista</h3><p>${escape(item.hint)}</p><h3>Practica</h3><p>${escape(item.guide)}</p><details><summary>Volver a la explicación</summary><p>${escape(item.explanation)}</p></details></section>`;
 }).join('');
 return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Guía sin conexión — ${grade}.º — EDUNEXT</title><style>body{font:1.1rem/1.6 system-ui,sans-serif;max-width:48rem;margin:auto;padding:1rem;color:#172536;background:#f5f8fc;overflow-wrap:anywhere}section,aside{background:white;padding:1rem;margin:1rem 0;border:1px solid #bac7d5;border-radius:.6rem}h1{font-size:1.7rem}h2{font-size:1.35rem}summary{cursor:pointer;min-height:44px}p{white-space:pre-wrap}@media print{body{background:white}section{break-inside:avoid}}</style></head><body><header><h1>Guía de estudio sin conexión · ${grade}.º</h1><p>EDUNEXT · Candidato interno</p></header><aside><strong>Material demostrativo, pendiente de revisión pedagógica.</strong><p>No es una IA generativa: son explicaciones y pistas preparadas. No evalúa ni asigna notas. Este archivo no contiene tu conversación, datos personales ni claves, y no necesita internet ni envía información. No incluye el resto de la aplicación.</p></aside><main>${sections}</main><footer><p>Si necesitas más ayuda, consulta a tu docente. Puedes conservar este archivo y abrirlo con un navegador compatible. La apertura de archivos HTML depende del dispositivo.</p></footer></body></html>`;
}

export function downloadOfflineStudyGuide(grade,examples){
 const html=buildOfflineStudyGuide(grade,examples);
 const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));
 const link=document.createElement('a');
 link.href=url;link.download=`edunext-guia-demo-${grade}.html`;
 document.body.append(link);link.click();link.remove();
 // Allow the browser to consume the Blob before releasing it.
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}
