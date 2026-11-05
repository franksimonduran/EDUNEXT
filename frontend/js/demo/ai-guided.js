// EDUNEXT DEMO D3 — catálogo pedagógico revisado. No genera contenido ni solicita servicios.
import {getDemoEvidence} from './metrics.js';

export const GUIDED_TOPICS=Object.freeze([
 {id:'reading',title:'Comunicación',prompts:[
  {id:'main',question:'¿Cómo encuentro la idea principal de una lectura?',answer:'Busca de qué trata principalmente el texto. Primero identifica quién participa y qué sucede; luego resume el mensaje en una sola oración.',activity:'En «El huerto de nuestra escuela», pregúntate cuál fue el objetivo de sembrar y cuidar las plantas.'},
  {id:'details',question:'¿Cómo reconozco detalles importantes?',answer:'Los detalles responden preguntas concretas: ¿quién?, ¿cuándo?, ¿dónde? y ¿qué ocurrió? Comprueba cada respuesta volviendo al texto.',activity:'Busca qué plantas sembraron y cuándo aparecieron sus primeras hojas.'},
  {id:'feedback',question:'¿Qué hago si me equivoco en la práctica?',answer:'Relee el párrafo relacionado, compara tu respuesta con la explicación y prueba de nuevo. Equivocarte puede ayudarte a aprender.',activity:'Vuelve a la práctica guiada y revisa las explicaciones de las cinco preguntas.'}
 ]},
 {id:'math',title:'Matemática',prompts:[
  {id:'fraction',question:'¿Qué es una fracción?',answer:'Una fracción representa partes iguales de un todo. En 1/4, el 4 indica las partes iguales y el 1 indica cuántas tomamos.',activity:'Dibuja un círculo dividido en cuatro partes iguales y colorea una.'},
  {id:'compare',question:'¿Cómo comparo fracciones sencillas?',answer:'Cuando dos fracciones tienen el mismo denominador, es mayor la que tiene el numerador más grande. Ejemplo: 3/4 es mayor que 1/4.',activity:'Compara 2/5 y 4/5 usando un dibujo.'}
 ]},
 {id:'science',title:'Ciencia y Tecnología',prompts:[
  {id:'plants',question:'¿Qué necesitan las plantas para crecer?',answer:'Las plantas necesitan agua, luz y condiciones apropiadas de suelo, aire y temperatura. Sus necesidades varían según la especie.',activity:'Relaciona el riego del huerto de la lectura con el cuidado de las plantas.'}
 ]},
 {id:'social',title:'Personal Social',prompts:[
  {id:'team',question:'¿Por qué es importante trabajar en equipo?',answer:'Trabajar en equipo permite compartir tareas, escuchar ideas y alcanzar objetivos que pueden ser difíciles de lograr a solas.',activity:'Identifica cómo los estudiantes del huerto organizaron sus turnos de riego.'}
 ]},
 {id:'english',title:'Inglés',prompts:[
  {id:'greeting',question:'¿Cuándo puedo usar «Hello»?',answer:'«Hello» significa «Hola» y sirve para saludar. Es una expresión sencilla de cortesía.',activity:'Practica el saludo «Hello» y después consulta su entrada en el diccionario educativo.'}
 ]}
]);
export function getGuidedTopic(id){return GUIDED_TOPICS.find(topic=>topic.id===id)||null;}
export function getGuidedPrompt(topicId,promptId){return getGuidedTopic(topicId)?.prompts.find(p=>p.id===promptId)||null;}
export function getSuggestedPrompt(){
 const r=getDemoEvidence();
 return r.completed&&r.percent<80?{topic:'reading',prompt:'feedback'}:{topic:'reading',prompt:'main'};
}
export const DEMO_CAPABILITIES=Object.freeze([
 {name:'Tutor guiado',status:'disponible',detail:'Explicaciones pedagógicas predefinidas; no realiza generación de texto.'},
 {name:'Diccionario educativo',status:'disponible',detail:'Entradas locales verificables en español e inglés; no traduce texto libre.'},
 {name:'Pronunciación guiada',status:'disponible',detail:'Muestra palabras y ejercicios sin grabación. Voz sintetizada solo si el dispositivo la proporciona.'},
 {name:'MiniCPM generativo',status:'no certificado',detail:'El modelo/runtime opcional de EDUNEXT no ha sido validado en este despliegue.'},
 {name:'Argos Translate',status:'no activado',detail:'El motor Python no se ejecuta en GitHub Pages.'},
 {name:'Análisis automático de voz',status:'no activado',detail:'No se captura micrófono, no se transcribe ni se calculan porcentajes fonéticos.'}
]);
