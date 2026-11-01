// Synthetic wllama only. Proves general-question routing without downloaded GGUF.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

async function main(){
 const {LocalTutorService}=await import(pathToFileURL(path.resolve(__dirname,'../frontend/js/services/local-tutor.service.js')));
 const {selectLocalTopic}=await import(pathToFileURL(path.resolve(__dirname,'../frontend/js/utils/local-tutor-topic.js')));
 const materials=[{title:'Fracciones',explanation:'Las fracciones representan partes de un entero.'}];
 const question='¿Qué es correr?';
 assert.equal(selectLocalTopic(question,materials).kind,'missing');

 const requests=[];
 class FakeWllama{
  async loadModelFromUrl(){}
  async createChatCompletion(request){
   requests.push(request);
   return {choices:[{finish_reason:'stop',message:{content:'Correr es desplazarse rápidamente usando las piernas.'}}]};
  }
  async exit(){}
 }
 const service=new LocalTutorService({
  probe:async()=>({supported:true,threads:1}),
  fetchResource:async()=>({ok:true,json:async()=>({
   model_id:'MiniCPM5-2B-Q4_K_M-GGUF',runtime_version:'wllama/3.8.1',
   files:[{path:'MiniCPM5-2B-Q4_K_M.gguf',bytes:1561318368}]
  })}),
  loadRuntime:async()=>({Wllama:FakeWllama})
 });
 await service.load({consent:true});
 try{
  assert.match(await service.ask(question,null,4),/Correr es/);
  const general=requests[0];
  assert.equal(general.messages.length,2);
  assert.equal(JSON.parse(general.messages[1].content).pregunta,question);
  assert.equal(JSON.parse(general.messages[1].content).modo,'conocimiento_general_no_verificado');
  assert.ok(!Object.hasOwn(JSON.parse(general.messages[1].content),'material_demostrativo'));
  assert.match(general.messages[0].content,/no afirmes que tu respuesta procede del currículo/);

  assert.match(await service.ask('Explica fracciones',materials[0],4),/Correr es/);
  const course=JSON.parse(requests[1].messages[1].content);
  assert.equal(course.material_demostrativo,materials[0].explanation);
  assert.equal(course.tema,materials[0].title);
  assert.ok(!Object.hasOwn(course,'modo'));

  await assert.rejects(()=>service.ask('Resuelve mi examen',null,4),error=>error.code==='UNSUPPORTED_INPUT');
  await assert.rejects(()=>service.ask('¿Qué es correr?',undefined,4),error=>error.code==='INVALID_CONTEXT');
  await assert.rejects(()=>service.ask('¿Qué es correr?',null,3),error=>error.code==='INVALID_CONTEXT');
 }finally{service.dispose();}
 console.log('Local MiniCPM: general question with no false lesson, curriculum question, grade/context and safety checks OK (synthetic runtime).');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
