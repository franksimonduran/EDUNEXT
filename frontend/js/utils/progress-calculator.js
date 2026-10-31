export function calculateProgressPercent(completed, total){
 if(!total || total<=0) return 0;
 return Math.round((completed/total)*100);
}

export function getStrengths(courses=[]){
 return courses.filter(c=>c.percent>=25).slice(0,2).map(c=>({ text: `${c.course} — Buen avance`, course:c.course }));
}

export function getWeaknesses(courses=[]){
 return courses.filter(c=>c.percent<25).slice(0,2).map(c=>({ text: `${c.course} — Puedes repasar`, course:c.course, link:'progreso-curso.html?course='+encodeURIComponent(c.course) }));
}
