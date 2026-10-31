import { escapeHTML as esc } from './student-ui.js';

// Diagramas originales dibujados a partir de los datos de la lección, no imágenes
// genéricas reutilizadas con un significado distinto. Texto alternativo + leyenda.
export function renderLearningVisual(image) {
 let graphic;
 if(image.kind==='parts') {
  const columns=Math.min(10,image.parts);
  const size=Math.min(92,490/columns);
  const left=(600-columns*size)/2;
  graphic=Array.from({length:image.parts},(_,index)=>`<rect x="${left+(index%columns)*size+3}" y="${35+Math.floor(index/columns)*64}" width="${size-6}" height="54" rx="8" fill="${index<image.filled?'#2868eb':'#fff'}" stroke="#8aa8d9" stroke-width="2"/>`).join('');
  graphic+=`<text x="300" y="205" text-anchor="middle" fill="#18469e" font-family="Segoe UI, sans-serif" font-size="20">${esc(image.labels[2])}</text>`;
 } else {
  graphic='<path d="M175 95h65m120 0h65" stroke="#a4bde3" stroke-width="3"/><path d="m232 88 9 7-9 7m185-14 9 7-9 7" fill="none" stroke="#a4bde3" stroke-width="3"/>';
  graphic+=image.labels.map((label,index)=>`<rect x="${20+index*195}" y="55" width="170" height="82" rx="18" fill="${index===1?'#e6edfc':'#fff'}" stroke="#afc5e9"/><circle cx="${105+index*195}" cy="37" r="15" fill="#2868eb"/><text x="${105+index*195}" y="42" text-anchor="middle" fill="white" font-size="14">${index+1}</text><text x="${105+index*195}" y="101" text-anchor="middle" fill="#18469e" font-family="Segoe UI, sans-serif" font-size="14">${esc(label)}</text>`).join('');
 }
 return `<figure class="learning-figure" lang="es"><svg viewBox="0 0 600 230" role="img" aria-label="${esc(image.caption)}">${graphic}</svg><figcaption>${esc(image.caption)}</figcaption></figure>`;
}
