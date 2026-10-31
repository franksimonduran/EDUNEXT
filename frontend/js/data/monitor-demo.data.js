export const monitor = Object.freeze({id:'demo-monitor',alias:'Profesor EDUNEXT',initials:'PA',institution:'Escuela Horizonte (ficticia)',classroomIds:['a4','a5','a6']});
export const subjects = ['Matemática','Comunicación','Ciencia y Tecnología','Personal Social','Inglés'];
export const classrooms = [4,5,6].map(grade=>({id:`a${grade}`,grade,section:'A',courseIds:subjects.map((_,i)=>`${grade}-${i}`)}));
export const students = classrooms.flatMap(c=>Array.from({length: c.grade===5?28:24},(_,i)=>({id:`${c.id}-s${i+1}`,alias:`Estudiante ${c.grade}-${String(i+1).padStart(2,'0')}`,classroomId:c.id,assigned:20,completed:8+(i%12)})));
export const practices = students.flatMap((s,i)=>subjects.flatMap((course,j)=>[1,2].map(attempt=>({id:`${s.id}-${j}-${attempt}`,studentId:s.id,classroomId:s.classroomId,course,topic:j===0?'Comparación de fracciones':'Comprensión de conceptos',correct:j===0&&i%7===0?3:6+(i+j+attempt)%5,total:10}))));
export const evaluations = classrooms.map(c=>({id:`eval-${c.id}`,classroomId:c.id,course:'Matemática',name:'Fracciones — demostración',date:`2026-11-${c.grade+10}T09:00:00`,duration:30,status:'Programada (ficticia)',openReview: c.grade===5?3:0}));
export const activities = classrooms.map(c=>({id:`activity-${c.id}`,classroomId:c.id,type:'Práctica formativa',description:'Se registró un intento de demostración',date:'2026-10-19T10:00:00',status:'Registro ficticio, sin recepción del servidor'}));
export const monitorNavigation = [
 {label:'Principal',items:[['home','Dashboard','home']]},
 {label:'Gestión educativa',items:[['students','Estudiantes','user'],['classrooms','Aulas','book'],['courses','Cursos','book'],['tasks','Tareas','clipboard'],['evaluations','Evaluaciones','clipboard']]},
 {label:'Seguimiento',items:[['grades','Notas','chart'],['support','Refuerzos','target'],['reports','Reportes','chart'],['insights','EDUNEXT Insights','spark']]},
 {label:'Organización',items:[['calendar','Calendario','calendar'],['sync','Sincronización','wifi']]},
 {label:'Cuenta',items:[['profile','Mi perfil','user'],['settings','Configuración','settings'],['logout','Cerrar sesión','logout']]}
];
