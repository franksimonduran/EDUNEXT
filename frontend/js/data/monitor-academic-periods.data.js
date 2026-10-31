// Periodos de demostración; no configuran el calendario de una institución real.
export const academicPeriods = Object.freeze([
 {id:'2026-1',label:'2026 — Primer semestre (demostración)',start:'2026-01-01',end:'2026-06-30'},
 {id:'2026-2',label:'2026 — Segundo semestre (demostración)',start:'2026-07-01',end:'2026-12-31'},
]);
export const periodOptions = [['all','Todos los periodos (incluye sin fecha)'],...academicPeriods.map(p=>[p.id,p.label]),['undated','Sin fecha conocida']];
export const qualitativeScales = Object.freeze({
 'achievement-demo':{label:'Niveles de logro — ejemplo configurable, no oficial',levels:['AD','A','B','C'],automatic:false}
});
// Anotaciones explícitas sobre revisiones existentes; no son nuevos resultados ni conversiones de porcentaje.
export const academicAnnotations = Object.freeze([4,5,6].flatMap(grade=>Array.from({length:5},(_,courseIndex)=>({
 id:`annotation-${grade}-${courseIndex}`,attemptId:`teacher-attempt-${courseIndex===0?'eval-a'+grade:'teacher-demo-'+grade+'-'+courseIndex}-1`,evaluationVersion:1,reviewRevision:0,
 publication:'published-demo',publicationDate:null,
 qualitative:{scale:'achievement-demo',level:'B',questionId:'q2',competence:'Explica una idea de la unidad',criterion:'Registro ficticio: explica una idea, aún sin un ejemplo desarrollado.',source:'Nivel cualitativo registrado expresamente en el ejemplo; no calculado desde el puntaje.'}
}))));
