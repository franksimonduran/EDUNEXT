// EDUNEXT DEMO: escenario ficticio, público y sin cuentas autenticadas.
// Solo se guarda la puntuación de este recorrido en una clave exclusiva.
export const DEMO_STUDENT = Object.freeze({id:'demo-student-01',name:'Estudiante Demo 01',grade:5,group:'5.º A',institution:'Institución Demo'});
export const DEMO_READING = Object.freeze({
  title:'El huerto de nuestra escuela',
  course:'Comunicación',
  topic:'Comprensión lectora',
  passage:'Los estudiantes de quinto grado decidieron crear un huerto en su escuela para aprender a cuidar las plantas y trabajar en equipo. Primero prepararon la tierra y sembraron semillas de lechuga y zanahoria. Cada mañana, un grupo diferente regaba las plantas y anotaba sus cambios en un cuaderno. Después de tres semanas, aparecieron las primeras hojas. Todos celebraron el resultado y comprendieron que la paciencia y la colaboración ayudan a alcanzar metas comunes.'
});
export const DEMO_QUESTIONS = Object.freeze([
  {prompt:'¿Por qué decidieron crear el huerto?',choices:['Para vender plantas','Para aprender a cuidar las plantas y colaborar','Para construir una cancha'],correct:1,explanation:'El texto indica que querían aprender a cuidar las plantas y trabajar en equipo.'},
  {prompt:'¿Cuándo regaban las plantas?',choices:['Cada mañana','Solo los domingos','Una vez al mes'],correct:0,explanation:'El texto dice que cada mañana un grupo diferente las regaba.'},
  {prompt:'¿Quiénes organizaron el huerto?',choices:['Personas de otra escuela','Solo los docentes','Los estudiantes de quinto grado'],correct:2,explanation:'La primera oración menciona a los estudiantes de quinto grado.'},
  {prompt:'¿Qué ocurrió después de tres semanas?',choices:['Se secaron todas las semillas','Aparecieron las primeras hojas','Abandonaron el huerto'],correct:1,explanation:'Después de tres semanas aparecieron las primeras hojas.'},
  {prompt:'¿Cuál es la enseñanza principal?',choices:['La colaboración y la paciencia ayudan a lograr metas','Las plantas no necesitan cuidados','Es mejor trabajar siempre a solas'],correct:0,explanation:'El texto destaca el trabajo en equipo, el cuidado y la paciencia.'}
]);
const STORAGE_KEY='edunext:presentacion:lectura:v1';
let fallback=null;
function validAnswers(answers){
  return Array.isArray(answers)&&answers.length===DEMO_QUESTIONS.length&&
    answers.every((answer,index)=>Number.isInteger(answer)&&answer>=0&&answer<DEMO_QUESTIONS[index].choices.length);
}
export function calculateDemoResult(answers){
  if(!validAnswers(answers))throw new TypeError('Se requieren cinco respuestas válidas.');
  const correct=answers.reduce((sum,answer,index)=>sum+Number(answer===DEMO_QUESTIONS[index].correct),0);
  return {correct,total:DEMO_QUESTIONS.length,percent:Math.round(correct*100/DEMO_QUESTIONS.length)};
}
function normalize(value){
  if(!value||value.version!==1||value.studentId!==DEMO_STUDENT.id||!validAnswers(value.answers))return null;
  const score=calculateDemoResult(value.answers);
  return {...score,answers:[...value.answers],completedAt:typeof value.completedAt==='string'?value.completedAt:null,localOnly:true};
}
export function readDemoResult(){
  try{
    const stored=globalThis.localStorage?.getItem(STORAGE_KEY);
    if(stored)return normalize(JSON.parse(stored));
  }catch{/* Browser may disable storage; only in-memory fallback is available. */}
  return normalize(fallback);
}
export function saveDemoResult(answers){
  const score=calculateDemoResult(answers);
  const record={version:1,studentId:DEMO_STUDENT.id,answers:[...answers],completedAt:new Date().toISOString()};
  fallback=record;
  let persisted=false;
  try{if(!globalThis.localStorage)throw new Error('Sin almacenamiento local');globalThis.localStorage.setItem(STORAGE_KEY,JSON.stringify(record));persisted=true;}catch{/* No report of cross-tab persistence when storage is blocked. */}
  try{globalThis.dispatchEvent?.(new Event('edunext-demo-result'));}catch{}
  return {...score,answers:[...answers],completedAt:record.completedAt,localOnly:true,persisted};
}
export function resetDemoResult(){
  fallback=null;
  try{globalThis.localStorage?.removeItem(STORAGE_KEY);}catch{}
  try{globalThis.dispatchEvent?.(new Event('edunext-demo-result'));}catch{}
}
