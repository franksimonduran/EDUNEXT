const today = new Date();
export const agendaDemo = Object.freeze([
 {
  id:'ev-1', type:'evaluation', title:'Evaluación de Matemática - Fracciones', course:'Matemática', grade:5, date: new Date(today.getFullYear(), today.getMonth(), today.getDate()+2).toISOString().slice(0,10), time:null, status:'proxima', source:'evaluations', link:'detalle-evaluacion.html?id=eval-mat-4-01', desc:'Evaluación demostrativa'
 },
 {
  id:'ev-2', type:'lesson', title:'Lección: El ciclo del agua', course:'Ciencia y Tecnología', grade:5, date: new Date(today.getFullYear(), today.getMonth(), today.getDate()+1).toISOString().slice(0,10), time:null, status:'proxima', source:'learn', link:'aprende.html?grade=5', desc:'Lección programada'
 },
 {
  id:'ev-3', type:'mission', title:'Misión semanal: Aprendiz constante', course:'General', grade:4, date: new Date(today.getFullYear(), today.getMonth(), today.getDate()+3).toISOString().slice(0,10), time:null, status:'en-progreso', source:'missions', link:'misiones.html?grade=4', desc:'Misión semanal'
 },
 {
  id:'ev-4', type:'task', title:'Repasar vocabulario Inglés', course:'Inglés', grade:6, date: today.toISOString().slice(0,10), time:null, status:'pendiente', source:'vocab', link:'vocabulario.html?grade=6', desc:'Tarea pendiente'
 }
]);

export function listAgendaEvents(filters={}){
 let items = [...agendaDemo];
 if(filters.course && filters.course!=='all') items = items.filter(i=>i.course===filters.course);
 if(filters.type && filters.type!=='all') items = items.filter(i=>i.type===filters.type);
 if(filters.status && filters.status!=='all') items = items.filter(i=>i.status===filters.status);
 return items;
}
export function getEvent(id){ return agendaDemo.find(e=>e.id===id)||null; }
