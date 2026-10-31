import { getCoursesDemo } from './courses-demo.data.js';
import { getUnitsDemo } from './units-demo.data.js';

export const courseIds = Object.freeze(['math','reading','science','social','english']);
const difficulty = {math:'easy',reading:'intermediate',science:'easy',social:'advanced',english:'intermediate'};

export function getPracticesDemo(grade) {
 return getCoursesDemo(grade).map(course=>{
  const unit=getUnitsDemo(course)[0];
  const questions=unit.lessons.map((lesson,index)=>({
   id:`${course.id}-${grade}-q${index+1}`,type:'multiple',title:lesson.exercise.question,
   context:`${lesson.blocks[0].text} ${lesson.examples[0]}`,
   options:lesson.exercise.options.map((label,i)=>({id:String(i),label})),answer:String(lesson.exercise.answer),
   explanation:lesson.examples[0],topic:lesson.title,
   hints:[`Recuerda el objetivo: ${lesson.objective}`,`Revisa esta idea y vuelve al ejemplo: ${lesson.blocks[0].text.split('. ')[0]}.`],
  }));
  if(course.id==='math') {
   Object.assign(questions[0],{
    type:'numeric',context:grade===4?'Una colección contiene 12 fichas. Queremos elegir tres cuartas partes.':grade===5?'Sumamos partes de una misma unidad. En esta actividad se acepta punto o coma decimal.':'Un porcentaje indica una parte de cada cien. Usa el total de 80 como referencia.',
    title:grade===4?'¿Cuánto es 3/4 de 12?':grade===5?'¿Cuánto es 0.7 + 0.2?':'¿Cuánto es el 25 % de 80?',
    answer:grade===4?9:grade===5?.9:20,normalization:{decimalComma:true,tolerance:0},
    explanation:grade===4?'12 dividido entre 4 es 3. Tomamos tres grupos de 3: el resultado es 9.':grade===5?'Siete décimas más dos décimas son nueve décimas: 0.9.':'25 % equivale a un cuarto. Un cuarto de 80 es 20.',
    hints:grade===4?['Primero divide 12 en cuatro partes iguales.','Después toma tres de esas partes.']:grade===5?['Convierte los números en décimas.','Suma las cantidades de décimas y conserva su posición.']:['Relaciona 25 % con una fracción conocida.','Divide el total en cuatro partes iguales.'],
   });
   Object.assign(questions[1],{type:'boolean',title:grade===4?'Dos cuartos representan la mitad de una unidad.':grade===5?'0.5 y 0.50 representan la misma cantidad.':'50 % significa la mitad del total.',context:'Decide si la afirmación es verdadera o falsa.',options:[{id:'true',label:'Verdadero'},{id:'false',label:'Falso'}],answer:'true',explanation:grade===4?'2/4 equivale a 1/2: elegimos dos de cuatro partes iguales.':grade===5?'Un cero a la derecha de la parte decimal no cambia el valor de 0.5.':'50 de cada 100 representa la mitad.'});
  }
  if(course.id==='reading') {
   Object.assign(questions[1],{type:'word',title:grade===4?'Completa: Ana sembró una _____.':grade===5?'Completa: los _____ organizan las partes de un texto.':'Completa: una interpretación se apoya en _____ del texto.',context:grade===4?'Ana sembró una semilla en una maceta y la regó cada mañana.':grade===5?'Los títulos y subtítulos ayudan a agrupar la información de una lectura.':'Para explicar lo que pensamos, buscamos evidencias o pistas escritas en el texto.',answer:grade===4?['semilla']:grade===5?['subtítulos','subtitulos']:['evidencias','pistas'],normalization:{trim:true,collapseWhitespace:true,caseInsensitive:true,ignoreAccents:false},explanation:grade===4?'El texto dice que Ana sembró una semilla.':grade===5?'Los subtítulos orientan y organizan las secciones del texto.':'Las evidencias o pistas del texto permiten sustentar una interpretación.',hints:['Vuelve a leer el texto que acompaña la pregunta.','Busca la palabra que completa la idea, no un detalle distinto.']});
   Object.assign(questions[3],{type:'ordering',title:'Ordena una estrategia para comprender una lectura.',context:'Usa Subir y Bajar para colocar los pasos en un orden útil.',items:[{id:'read',label:'Leer el texto completo'},{id:'summarize',label:'Explicar lo principal con tus palabras'},{id:'title',label:'Observar el título y anticipar el tema'}],answer:['title','read','summarize'],explanation:'Primero anticipamos el tema con el título; después leemos y finalmente explicamos las ideas principales.',hints:['Antes de leer, observa las pistas del título.','El resumen se realiza cuando ya conoces el contenido.']});
  }
  if(course.id==='science') {
   Object.assign(questions[1],{type:'image',title:grade===4?'¿Qué imagen representa un ecosistema acuático?':grade===5?'¿Qué imagen muestra los órganos que intervienen en el intercambio de gases?':'¿Qué imagen muestra una fuente de energía renovable?',context:'Observa las ilustraciones originales. Sus descripciones también están disponibles para lectores de pantalla.',options:grade===4?[{id:'lake',label:'Laguna',image:'lake',alt:'Agua de una laguna, plantas de orilla y un pez'},{id:'desert',label:'Desierto',image:'desert',alt:'Arena, cactus y sol en un ambiente seco'},{id:'forest',label:'Bosque',image:'forest',alt:'Árboles y plantas sobre tierra firme'}]:grade===5?[{id:'lungs',label:'Pulmones',image:'lungs',alt:'Dos pulmones conectados a la tráquea'},{id:'heart',label:'Corazón',image:'heart',alt:'Corazón con vasos que transportan sangre'},{id:'stomach',label:'Estómago',image:'stomach',alt:'Estómago conectado al tubo digestivo'}]:[{id:'solar',label:'Sol y panel solar',image:'solar',alt:'La luz del sol llega a un panel solar'},{id:'coal',label:'Carbón',image:'coal',alt:'Rocas de carbón mineral'},{id:'oil',label:'Petróleo',image:'oil',alt:'Un barril de petróleo'}],answer:grade===4?'lake':grade===5?'lungs':'solar',explanation:grade===4?'Una laguna es un ambiente acuático donde conviven seres vivos y elementos no vivos.':grade===5?'En los pulmones se realiza el intercambio de gases.':'El sol es una fuente renovable; el carbón y el petróleo son combustibles fósiles.',hints:grade===4?['Busca un ambiente donde el agua sea esencial.']:grade===5?['Piensa por dónde pasa el aire al respirar.']:['Busca una fuente que se repone de manera natural.']});
  }
  if(course.id==='social') {
   Object.assign(questions[2],{type:'matching',title:'Relaciona cada elemento con su función o compromiso.',context:'Selecciona una respuesta distinta para cada fila. Puedes usar el teclado.',pairs:grade===4?[{id:'library',left:'Biblioteca',right:'Lectura'},{id:'health',left:'Centro de salud',right:'Atención de salud'},{id:'school',left:'Escuela',right:'Aprendizaje'}]:grade===5?[{id:'council',left:'Municipalidad',right:'Gestión de servicios locales'},{id:'class',left:'Aula organizada',right:'Acuerdos para aprender juntos'},{id:'team',left:'Equipo de trabajo',right:'Distribución de tareas'}]:[{id:'listen',left:'Ser escuchado',right:'Escuchar con respeto'},{id:'shared',left:'Usar espacios comunes',right:'Cuidarlos para los demás'},{id:'participate',left:'Participar',right:'Respetar los turnos'}],explanation:'Las funciones y los compromisos ayudan a organizar una comunidad y a respetar a sus integrantes.',hints:['Piensa qué necesita atender cada institución o acción.','Cada respuesta corresponde a una sola fila.']});
  }
  if(course.id==='english') {
   Object.assign(questions[0],{type:'word',title:grade===4?'Completa en inglés: d_g (perro).':grade===5?'Completa la expresión de agradecimiento: Thank _____.':'Completa: I _____ reading (Me gusta leer).',context:'Escribe la palabra completa que falta. Se aceptan mayúsculas y minúsculas; no se eliminan letras ni tildes automáticamente.',answer:grade===4?['dog']:grade===5?['you']:['like'],normalization:{trim:true,collapseWhitespace:true,caseInsensitive:true,ignoreAccents:false},explanation:grade===4?'Dog significa perro.':grade===5?'Thank you significa gracias.':'I like reading significa Me gusta leer.',hints:grade===4?['La palabra tiene tres letras.','La vocal que falta es la misma que en hello.']:grade===5?['La expresión agradece a la persona que te ayuda.']:['Busca la palabra que expresa una preferencia.']});
  }
   if(course.id==='math'){
    questions[0].topic=grade===4?'Fracciones de una cantidad':grade===5?'Suma de decimales':'Cálculo de porcentajes';
    questions[1].topic=grade===4?'Fracciones equivalentes':grade===5?'Equivalencia de decimales':'Porcentajes y fracciones';
    questions[1].hints=grade===4?['Compara dos partes de un total de cuatro con la mitad de ese total.']:grade===5?['Piensa en cinco décimas y cincuenta centésimas.','Añadir un cero al final de la parte decimal no cambia la cantidad.']:['Recuerda: 50 de cada 100 representa una mitad.','Compara una mitad (50 %) con un cuarto (25 %).'];
    if(grade===6){questions[1].title='50 % equivale a la cuarta parte del total.';questions[1].answer='false';questions[1].explanation='La afirmación es falsa: 50 % equivale a la mitad (1/2). La cuarta parte (1/4) equivale al 25 %.';}
   }
  if(course.id==='reading'){questions[1].topic=grade===4?'Información explícita':grade===5?'Organización del texto':'Interpretación de textos';questions[3].topic='Estrategias de lectura';}
  if(course.id==='science')questions[1].topic=grade===4?'Tipos de ecosistema':grade===5?'Respiración':'Fuentes de energía renovable';
  if(course.id==='social')questions[2].topic=grade===4?'Servicios de la comunidad':grade===5?'Funciones de las instituciones':'Derechos y responsabilidades';
  if(course.id==='english')questions[0].topic=grade===4?'Nombres de animales':grade===5?'Expresiones de agradecimiento':'Expresar preferencias';
  questions.forEach(question=>{if(question.type==='matching'){
   question.answer=Object.fromEntries(question.pairs.map(pair=>[pair.id,pair.id]));
   question.explanation=`${question.explanation} ${question.pairs.map(pair=>`${pair.left}: ${pair.right}.`).join(' ')}`;
  }});
  return {
   id:`practice-${course.id}-${grade}`,kind:'practice',grade,courseId:course.id,courseName:course.name,topic:course.topic.es,tone:course.id==='english'?'sky':course.tone,icon:course.icon,
   unitId:unit.id,lessonId:unit.lessons[0].id,name:`Practiquemos: ${course.topic.es}`,description:`Cuatro retos para reforzar ${course.topic.es.toLowerCase()} con explicaciones y pistas.`,difficulty:difficulty[course.id],estimatedMinutes:5,
   available:true,questions,offline:{downloaded:false,verified:false},
  };
 });
}
