const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const {saveFinalEvidence}=require('../tools/final-evidence.cjs');
(async()=>{
 const {selectLocalTopic}=await import(pathToFileURL(path.resolve('frontend/js/utils/local-tutor-topic.js')));
 const {loadTutorMaterials}=await import(pathToFileURL(path.resolve('frontend/js/data/tutor-demo.data.js')));
 const material=[{title:'Fracciones',explanation:'Una fracción representa partes de una unidad.'},{title:'Acentuación',explanation:'La sílaba tónica y las tildes.'}];
 assert.equal(selectLocalTopic('acentuacion',material).index,1);
 assert.equal(selectLocalTopic('Explícame las tildes',material).index,1);
 assert.equal(selectLocalTopic('fracciones',material).index,0);
 assert.equal(selectLocalTopic('volcanes',material).kind,'missing');
 assert.equal(selectLocalTopic('hola',material).kind,'missing');
 assert.equal(selectLocalTopic('fracciones',[material[0],material[0]]).kind,'ambiguous');
 const grades=[];
 for(const grade of [4,5,6]){
  const items=await loadTutorMaterials(grade);assert(items.length>5);
  const result=selectLocalTopic('acentuacion',items);
  for(const index of result.candidates)assert.notEqual(items[index].courseId,'math');
  grades.push({grade,materials:items.length,accentuation:result.kind,candidates:result.candidates.map(i=>items[i].title)});
 }
 const report={date:new Date().toISOString(),pass:true,scope:'Lexical topic routing and real demo catalogues. No model inference or semantic accuracy guarantee.',grades};
 saveFinalEvidence('LOCAL_TUTOR_TOPIC.json',report);console.log(JSON.stringify(report,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
