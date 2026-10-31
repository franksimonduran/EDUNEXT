export const missionsDemo = Object.freeze({
  daily: [
    { id:'m-d-1', type:'daily', title:'Gran lector', desc:'Completa una lección de Comunicación', goal:1, progress:0, reward:20, status:'disponible', link:'aprende.html?grade=4' },
    { id:'m-d-2', type:'daily', title:'Explorador matemático', desc:'Resuelve tres ejercicios de Matemática', goal:3, progress:0, reward:20, status:'disponible', link:'practica.html?grade=4' },
    { id:'m-d-3', type:'daily', title:'Aprende palabras', desc:'Repasa cinco palabras de vocabulario', goal:5, progress:0, reward:15, status:'disponible', link:'vocabulario.html?grade=4' },
    { id:'m-d-4', type:'daily', title:'Científico curioso', desc:'Estudia una lección de Ciencia y Tecnología', goal:1, progress:0, reward:15, status:'disponible', link:'aprende.html?grade=4' }
  ],
  weekly: [
    { id:'m-w-1', type:'weekly', title:'Aprendiz constante', desc:'Completar cuatro lecciones', goal:4, progress:1, reward:50, status:'en-progreso', period:'Semana actual' },
    { id:'m-w-2', type:'weekly', title:'Practicante', desc:'Realizar cinco prácticas', goal:5, progress:1, reward:50, status:'en-progreso', period:'Semana actual' }
  ],
  completed: []
});

export function listMissions(filter='all'){
 if(filter==='daily') return missionsDemo.daily;
 if(filter==='weekly') return missionsDemo.weekly;
 if(filter==='completed') return missionsDemo.completed;
 return [...missionsDemo.daily, ...missionsDemo.weekly];
}
