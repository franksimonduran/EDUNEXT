export const offlinePackages = Object.freeze([
 { id:'pkg-mat-4-fracc', course:'Matemática', grade:4, unit:'Fracciones', lessons:['leccion-fracciones-1','leccion-fracciones-2'], version:'1.0.0', desc:'Fracciones básicas', required:['/student/leccion.html','/js/student/lessons.js'], estimatedBytes:250000 },
 { id:'pkg-com-5-lect', course:'Comunicación', grade:5, unit:'Lectura comprensiva', lessons:['leccion-lectura-1'], version:'1.0.0', desc:'Estrategias de lectura', required:['/student/leccion.html'], estimatedBytes:180000 },
]);

export function getPackages(){ return [...offlinePackages]; }
export function getPackage(id){ return offlinePackages.find(p=>p.id===id)||null; }
