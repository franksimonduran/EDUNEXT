// Structured text only. Field schemas are shared by the editor and validation.
export const blockTypes=Object.freeze({
 heading:{label:'Título de sección',fields:{text:'Título',level:'Nivel (2 o 3)'}},
 paragraph:{label:'Texto explicativo',fields:{text:'Explicación (separa párrafos con una línea vacía)'}},
 callout:{label:'Párrafo destacado',fields:{title:'Título',text:'Texto destacado'}},
 example:{label:'Ejemplo resuelto',fields:{title:'Título',problem:'Situación o problema',explanation:'Explicación',steps:'Pasos (uno por línea)',result:'Resultado',observation:'Observación opcional'}},
 image:{label:'Imagen educativa',fields:{resourceId:'Imagen',alt:'Texto alternativo',caption:'Descripción'}},
 audio:{label:'Audio educativo',fields:{resourceId:'Audio',transcript:'Transcripción',language:'Idioma'}},
 vocabulary:{label:'Vocabulario',fields:{entryIds:'Entradas del diccionario local',pronunciation:'Pronunciación textual opcional',audioId:'Audio opcional'}},
 concepts:{label:'Lista de conceptos',fields:{items:'Conceptos y descripciones'}},
 reflection:{label:'Pregunta de reflexión',fields:{question:'Pregunta',guidance:'Orientación',objective:'Objetivo',teacherAnswer:'Respuesta orientativa (solo docente)'}},
 practice:{label:'Actividad práctica vinculada',fields:{resourceId:'Práctica',purpose:'Propósito'}},
 resource:{label:'Recurso complementario',fields:{resourceId:'Recurso',description:'Contexto de uso'}},
 summary:{label:'Resumen',fields:{ideas:'Ideas principales (una por línea)',concepts:'Conceptos clave (uno por línea)',recommendations:'Recomendaciones de repaso',resourceId:'Recurso para continuar (opcional)'}},
 assessment:{label:'Autoevaluación formativa vinculada',fields:{resourceId:'Práctica formativa existente',purpose:'Propósito formativo'}}
});
export const contentStates={draft:'Borrador local',incomplete:'Validación incompleta',ready:'Listo para revisión',archived:'Archivado'};
export const contentId=prefix=>prefix+'-'+crypto.randomUUID();
export function newBlock(type,lessonId,order){if(!Object.hasOwn(blockTypes,type))throw new Error('Tipo de bloque no válido.');return {id:contentId('block'),lessonId,type,order,content:Object.fromEntries(Object.keys(blockTypes[type].fields).map(k=>[k,k==='level'?2:k==='entryIds'||k==='items'?[]:''])),resourceVersions:{}};}
