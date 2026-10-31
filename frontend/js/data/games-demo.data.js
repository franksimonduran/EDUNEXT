import { getPracticesDemo } from './practices-demo.data.js';
const definitions=[
 {type:'memory',name:'Memoria educativa',description:'Encuentra parejas de conceptos y significados.',course:'english',difficulty:'easy'},
 {type:'matching',name:'Relaciona las parejas',description:'Conecta cada elemento con su función.',course:'social',difficulty:'easy'},
 {type:'ordering',name:'Ordena la secuencia',description:'Organiza una estrategia paso a paso.',course:'reading',difficulty:'intermediate'},
 {type:'word',name:'Completa la palabra',description:'Descubre la palabra que completa cada idea.',course:'english',difficulty:'intermediate'},
 {type:'quick',name:'Reto rápido, a tu ritmo',description:'Resuelve preguntas breves sin límite de tiempo.',course:'math',difficulty:'advanced'},
];
export function getGamesDemo(grade) {
 const practices=getPracticesDemo(grade);
 return definitions.map(def=>{
  const practice=practices.find(item=>item.courseId===def.course);
  const pairs=grade===4?[{id:'dog',left:'Dog',right:'Perro'},{id:'cat',left:'Cat',right:'Gato'},{id:'bird',left:'Bird',right:'Pájaro'}]:grade===5?[{id:'book',left:'Book',right:'Libro'},{id:'pencil',left:'Pencil',right:'Lápiz'},{id:'desk',left:'Desk',right:'Escritorio'}]:[{id:'hello',left:'Hello',right:'Hola'},{id:'thanks',left:'Thank you',right:'Gracias'},{id:'bye',left:'Goodbye',right:'Adiós'}];
  if(grade===4)pairs.forEach(pair=>{pair.image=pair.id;});
  const wordQuestions=pairs.map(pair=>({
   id:`word-${grade}-${pair.id}`,type:'word',topic:`${practice.topic} · ${pair.right}`,
   title:`Completa en inglés: ${pair.right} → _____.`,
   context:'Escribe la palabra o expresión completa en inglés. Se aceptan mayúsculas y minúsculas.',
   answer:[pair.left],normalization:{trim:true,collapseWhitespace:true,caseInsensitive:true,ignoreAccents:false},
   explanation:`${pair.left} significa ${pair.right.toLocaleLowerCase('es')}.`,
   hints:[`Recuerda el vocabulario de esta unidad: ${practice.topic}.`,`La palabra o expresión empieza con ${pair.left[0]}.`],
  }));
  const questions=def.type==='matching'?[practice.questions.find(q=>q.type==='matching')]:def.type==='ordering'?[practice.questions.find(q=>q.type==='ordering')]:def.type==='word'?wordQuestions:def.type==='quick'?practice.questions.slice(0,3):[];
  return {...practice,id:`game-${def.type}-${grade}`,kind:'game',type:def.type,name:def.name,description:def.description,difficulty:def.difficulty,questions,pairs,timed:false,rules:{firstCheckScoring:true,unlimitedTime:true}};
 });
}
