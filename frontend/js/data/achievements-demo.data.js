export const achievementsDemo = Object.freeze([
  { id:'a-1', name:'Primer Gran Paso', desc:'Terminar la primera lección', rule:'first-lesson', goal:1, progress:1, status:'obtenida', icon:'spark', date:new Date().toISOString(), reward:10 },
  { id:'a-2', name:'Explorador Matemático', desc:'Completa cinco prácticas de Matemática', rule:'math-practices', goal:5, progress:1, status:'pendiente', icon:'book', reward:30 },
  { id:'a-3', name:'Gran Lector', desc:'Realizar lecciones de Comunicación', rule:'com-lessons', goal:3, progress:3, status:'pendiente', icon:'book', reward:30 },
  { id:'a-4', name:'Científico Curioso', desc:'Explorar temas de Ciencia y Tecnología', rule:'cyt-lessons', goal:3, progress:1, status:'pendiente', icon:'spark', reward:30 },
  { id:'a-5', name:'Ciudadano Responsable', desc:'Actividades de Personal Social', rule:'ps-lessons', goal:3, progress:1, status:'pendiente', icon:'spark', reward:30 },
  { id:'a-6', name:'Maestro de Palabras', desc:'Practicar vocabulario', rule:'vocab', goal:5, progress:0, status:'pendiente', icon:'book', reward:20 }
]);

export function getAchievement(id){ return achievementsDemo.find(a=>a.id===id)||null; }
export function listAchievements(){ return achievementsDemo; }
