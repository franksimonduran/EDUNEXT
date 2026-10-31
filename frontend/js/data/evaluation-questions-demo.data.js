// Preguntas demostrativas reutilizando estructura compatible con question-renderer
export const evaluationQuestionsDemo = Object.freeze({
 'eval-mat-4-01': [
  { id:'q1', type:'multiple', context:'Matemática', title:'¿Cuál es el valor de 5 × 6?', options:[
    {id:'a',label:'30'},{id:'b',label:'25'},{id:'c',label:'35'},{id:'d',label:'20'}
   ], correct:['a'] },
  { id:'q2', type:'boolean', context:'Matemática', title:'Todo número par es divisible por 2.', options:[
    {id:'true',label:'Verdadero'},{id:'false',label:'Falso'}
   ], correct:['true'] },
  { id:'q3', type:'numeric', context:'Matemática', title:'Resuelve: 48 ÷ 6', correct:['8'] },
  { id:'q4', type:'multiple', context:'Matemática', title:'¿Qué número es mayor?', options:[
    {id:'a',label:'245'},{id:'b',label:'254'},{id:'c',label:'425'},{id:'d',label:'452'}
   ], correct:['d'] },
  { id:'q5', type:'word', context:'Matemática', title:'Completa: La mitad de 10 es ___', correct:['5'] },
  { id:'q6', type:'multiple', context:'Matemática', title:'Un triángulo tiene ___ lados.', options:[
    {id:'a',label:'3'},{id:'b',label:'4'},{id:'c',label:'5'}
   ], correct:['a'] },
  { id:'q7', type:'multiple', context:'Matemática', title:'¿Cuál fracción representa la mitad?', options:[
    {id:'a',label:'1/2'},{id:'b',label:'1/3'},{id:'c',label:'1/4'}
   ], correct:['a'] },
  { id:'q8', type:'boolean', context:'Matemática', title:'100 es mayor que 99.', options:[
    {id:'true',label:'Verdadero'},{id:'false',label:'Falso'}
   ], correct:['true'] },
  { id:'q9', type:'multiple', context:'Matemática', title:'Si tengo 3 decenas, tengo ___ unidades.', options:[
    {id:'a',label:'30'},{id:'b',label:'3'},{id:'c',label:'13'}
   ], correct:['a'] },
  { id:'q10', type:'multiple', context:'Matemática', title:'¿Cuánto es 7 × 8?', options:[
    {id:'a',label:'54'},{id:'b',label:'56'},{id:'c',label:'58'},{id:'d',label:'52'}
   ], correct:['b'] }
 ],
 'eval-com-4-01': [
  { id:'q1', type:'multiple', context:'Comprensión lectora', title:'Según el título, ¿de qué trata el texto?', options:[
    {id:'a',label:'De un viaje'},{id:'b',label:'De una amistad'},{id:'c',label:'De un deporte'}
   ], correct:['b'] },
  { id:'q2', type:'boolean', context:'Comprensión lectora', title:'El protagonista ayuda a su amigo.', options:[
    {id:'true',label:'Verdadero'},{id:'false',label:'Falso'}
   ], correct:['true'] },
  { id:'q3', type:'word', context:'Comprensión lectora', title:'Escribe una palabra que signifique lo mismo que "amable".', correct:['bondadoso','gentil'] },
  { id:'q4', type:'multiple', context:'Comprensión lectora', title:'¿Quién es el personaje principal?', options:[
    {id:'a',label:'Lucas'},{id:'b',label:'María'},{id:'c',label:'Pedro'}
   ], correct:['a'] },
  { id:'q5', type:'boolean', context:'Comprensión lectora', title:'La historia termina mal.', options:[
    {id:'true',label:'Verdadero'},{id:'false',label:'Falso'}
   ], correct:['false'] },
  { id:'q6', type:'multiple', context:'Comprensión lectora', title:'¿Cuál es la idea principal?', options:[
    {id:'a',label:'La importancia de la amistad'},{id:'b',label:'Cómo cocinar'},{id:'c',label:'Los planetas'}
   ], correct:['a'] },
  { id:'q7', type:'word', context:'Comprensión lectora', title:'Completa: Siempre debemos tratar a otros con ___', correct:['respeto'] },
  { id:'q8', type:'multiple', context:'Comprensión lectora', title:'¿Qué enseñanza deja la historia?', options:[
    {id:'a',label:'Ayudarnos unos a otros'},{id:'b',label:'Ganar siempre'},{id:'c',label:'Competir'}
   ], correct:['a'] }
 ],
 'eval-cyt-5-01': [
  { id:'q1', type:'multiple', context:'Ciencia y Tecnología', title:'Los seres vivos necesitan...', options:[
    {id:'a',label:'Agua, aire y alimento'},{id:'b',label:'Solo agua'},{id:'c',label:'Solo aire'}
   ], correct:['a'] },
  { id:'q2', type:'boolean', context:'Ciencia y Tecnología', title:'Las plantas producen su propio alimento.', options:[
    {id:'true',label:'Verdadero'},{id:'false',label:'Falso'}
   ], correct:['true'] },
  { id:'q3', type:'multiple', context:'Ciencia y Tecnología', title:'Los animales herbívoros se alimentan de...', options:[
    {id:'a',label:'Plantas'},{id:'b',label:'Carne'},{id:'c',label:'Ambos'}
   ], correct:['a'] },
  { id:'q4', type:'word', context:'Ciencia y Tecnología', title:'Completa: El proceso por el cual las plantas fabrican su alimento se llama ___', correct:['fotosíntesis'] },
  { id:'q5', type:'multiple', context:'Ciencia y Tecnología', title:'¿Qué es un ecosistema?', options:[
    {id:'a',label:'Conjunto de seres vivos y su ambiente'},{id:'b',label:'Solo animales'},{id:'c',label:'Solo plantas'}
   ], correct:['a'] },
  { id:'q6', type:'boolean', context:'Ciencia y Tecnología', title:'Los hongos son seres vivos.', options:[
    {id:'true',label:'Verdadero'},{id:'false',label:'Falso'}
   ], correct:['true'] },
  { id:'q7', type:'multiple', context:'Ciencia y Tecnología', title:'Los carnívoros se alimentan de...', options:[
    {id:'a',label:'Carne'},{id:'b',label:'Hierba'},{id:'c',label:'Frutas'}
   ], correct:['a'] },
  { id:'q8', type:'multiple', context:'Ciencia y Tecnología', title:'El agua es importante porque...', options:[
    {id:'a',label:'Todos los seres vivos la necesitan'},{id:'b',label:'Solo los peces'},{id:'c',label:'Solo las plantas'}
   ], correct:['a'] },
  { id:'q9', type:'boolean', context:'Ciencia y Tecnología', title:'Reciclar ayuda a cuidar el medio ambiente.', options:[
    {id:'true',label:'Verdadero'},{id:'false',label:'Falso'}
   ], correct:['true'] },
  { id:'q10', type:'multiple', context:'Ciencia y Tecnología', title:'¿Cuál es un recurso natural renovable?', options:[
    {id:'a',label:'Agua'},{id:'b',label:'Petróleo'},{id:'c',label:'Carbón'}
   ], correct:['a'] }
 ],
 'eval-ps-6-01': [
  { id:'q1', type:'multiple', context:'Personal Social', title:'Una norma de convivencia es...', options:[
    {id:'a',label:'Respetar el turno para hablar'},{id:'b',label:'Gritar siempre'},{id:'c',label:'Interrumpir'}
   ], correct:['a'] },
  { id:'q2', type:'boolean', context:'Personal Social', title:'Todos tenemos derechos iguales.', options:[
    {id:'true',label:'Verdadero'},{id:'false',label:'Falso'}
   ], correct:['true'] },
  { id:'q3', type:'multiple', context:'Personal Social', title:'Una responsabilidad en el aula es...', options:[
    {id:'a',label:'Cuidar los materiales'},{id:'b',label:'Romper los libros'},{id:'c',label:'Ensuciar'}
   ], correct:['a'] },
  { id:'q4', type:'word', context:'Personal Social', title:'Completa: Debemos resolver conflictos mediante el ___', correct:['diálogo'] },
  { id:'q5', type:'boolean', context:'Personal Social', title:'El respeto es importante para convivir mejor.', options:[
    {id:'true',label:'Verdadero'},{id:'false',label:'Falso'}
   ], correct:['true'] },
  { id:'q6', type:'multiple', context:'Personal Social', title:'¿Qué significa empatía?', options:[
    {id:'a',label:'Ponerse en el lugar del otro'},{id:'b',label:'Ignorar a los demás'},{id:'c',label:'Criticar'}
   ], correct:['a'] },
  { id:'q7', type:'multiple', context:'Personal Social', title:'Una acción solidaria es...', options:[
    {id:'a',label:'Ayudar a un compañero'},{id:'b',label:'Burlarse'},{id:'c',label:'Empujar'}
   ], correct:['a'] },
  { id:'q8', type:'boolean', context:'Personal Social', title:'Las normas ayudan a convivir pacíficamente.', options:[
    {id:'true',label:'Verdadero'},{id:'false',label:'Falso'}
   ], correct:['true'] },
  { id:'q9', type:'open', context:'Personal Social', title:'¿Cómo puedes ayudar a mejorar la convivencia en tu aula?' }
 ],
 'eval-ing-6-01': [
  { id:'q1', type:'multiple', context:'Inglés', title:'What do you do in the morning?', options:[
    {id:'a',label:'I get up'},{id:'b',label:'I fly'},{id:'c',label:'I swim'}
   ], correct:['a'] },
  { id:'q2', type:'boolean', context:'Inglés', title:'"Brush my teeth" means cepillarse los dientes.', options:[
    {id:'true',label:'Verdadero'},{id:'false',label:'Falso'}
   ], correct:['true'] },
  { id:'q3', type:'multiple', context:'Inglés', title:'What time do you go to school?', options:[
    {id:'a',label:'In the morning'},{id:'b',label:'At midnight'},{id:'c',label:'At noon only'}
   ], correct:['a'] },
  { id:'q4', type:'word', context:'Inglés', title:'Complete: I ___ breakfast at 7 o\'clock.', correct:['have'] },
  { id:'q5', type:'multiple', context:'Inglés', title:'What do you wear to school?', options:[
    {id:'a',label:'Uniform'},{id:'b',label:'Pajamas'},{id:'c',label:'Swimsuit'}
   ], correct:['a'] },
  { id:'q6', type:'boolean', context:'Inglés', title:'"Go to bed" means ir a dormir.', options:[
    {id:'true',label:'Verdadero'},{id:'false',label:'Falso'}
   ], correct:['true'] },
  { id:'q7', type:'multiple', context:'Inglés', title:'After school, I...', options:[
    {id:'a',label:'Do my homework'},{id:'b',label:'Fly to the moon'},{id:'c',label:'Drive a rocket'}
   ], correct:['a'] },
  { id:'q8', type:'word', context:'Inglés', title:'Complete: I ___ TV in the evening.', correct:['watch'] }
 ]
});

export function getEvaluationQuestions(id){
 return evaluationQuestionsDemo[id] || [];
}
