// Actual local checks, not placeholder E2E tests. Blocked functional cases stay blocked.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {root,read,publicFiles,corpus,catalogue}=require('../../tools/final-inventory.cjs');
const {evaluate}=require('../../infra/scripts/check-release-gate.cjs');
(async()=>{
 const results=[];
 async function check(name,fn){try{await fn();results.push({name,status:'pass'});}catch(e){results.push({name,status:'fail',message:e.message});}}
 await check('All 50 phases have explicit status and existing source/evidence references',()=>{
  const phases=JSON.parse(read('docs/final/FINAL_PHASE_STATUS.json')).phases;
  assert.equal(phases.length,50);assert.equal(new Set(phases.map(p=>p.phase)).size,50);
  for(let n=1;n<=50;n++)assert(phases.some(p=>p.phase===n));
  for(const phase of phases){assert(['Parcial','Solo demostración','Bloqueado','No implementado','Implementado y verificado','Implementado sin validación suficiente'].includes(phase.status));for(const file of phase.evidence)assert(fs.existsSync(path.join(root,file)),file);}
 });
 await check('Two synthetic institutions and all target grades, with no seeded credentials',()=>{
  const fixture=JSON.parse(read('tests/fixtures/phase50-synthetic-scenarios.json'));
  assert.equal(fixture.persistence,'not_seeded');assert.equal(fixture.institutions.length,2);assert.equal(fixture.students.length,6);
  for(const institution of fixture.institutions)assert.deepEqual(fixture.students.filter(s=>s.institutionScenario===institution.scenarioId).map(s=>s.grade).sort(),[4,5,6]);
  assert(!/"(?:password|access_token|refresh_token|official_grade)"\s*:/.test(JSON.stringify(fixture)));
 });
 await check('Demonstration catalogue has consistent grade references and local lesson audio files',async()=>{
  const data=await catalogue();assert.equal(data.grades.length,3);assert(data.dictionaryEntries>0);
  const fixture=JSON.parse(read('tests/fixtures/phase50-synthetic-scenarios.json'));
  for(const grade of data.grades){
   assert.equal(grade.courses.length,5);assert.equal(grade.practices.length,5);assert.equal(grade.games.length,5);
   for(const course of grade.courses)for(const unit of course.units){assert.equal(unit.lessons.length,4);for(const lesson of unit.lessons)assert(fs.existsSync(path.resolve(root,'frontend/student',lesson.audio)),lesson.id+' audio');}
   assert(grade.games.every(g=>g.validQuestions));assert(grade.practices.every(p=>p.questions===4));
   const ref=fixture.demonstrationReferences.find(r=>r.grade===grade.grade),course=grade.courses.find(c=>c.id===ref.course),unit=course.units.find(u=>u.id===ref.unit);
   assert(unit.lessons.some(l=>l.id===ref.lesson));assert(grade.practices.some(p=>p.id===ref.practice));assert(grade.games.some(g=>g.id===ref.game));
  }
 });
 await check('28 functional requirements remain honestly partial/blocked and selected routes exist in source',()=>{
  const cases=JSON.parse(read('docs/final/FINAL_ACCEPTANCE_CASES.json')).cases;
  assert.equal(cases.length,28);assert.equal(new Set(cases.map(c=>c.id)).size,28);
  const inventory=JSON.parse(read('docs/final/FINAL_INVENTORY.json'));
  const routes=new Set(inventory.endpoints.map(e=>e.method+' '+e.route));
  for(const row of cases){assert(['BLOCKED','NOT_IMPLEMENTED','PARTIAL'].includes(row.result));assert(fs.existsSync(path.join(root,row.page)));assert(fs.existsSync(path.join(root,row.code)));if(row.endpoint)assert(routes.has(row.endpoint),row.endpoint);}
 });
 await check('Final/manual/pilot/operation documents and root Markdown links point to existing local files',()=>{
  const docs=publicFiles().filter(p=>p.endsWith('.md')&&(/^docs\/(?:final|manuals|pilot|operations)\//.test(p)||['README.md','PROJECT_STRUCTURE.md','AGENTS.md','CHANGELOG.md'].includes(p)));
  assert(docs.length>=25);
  for(const file of docs)for(const match of read(file).matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){
   const link=match[1].split('#')[0].split('?')[0];if(!link||/^[a-z]+:/i.test(link))continue;
   const target=path.resolve(root,path.dirname(file),decodeURIComponent(link));
   assert(target.startsWith(root+path.sep),file+' external local path');assert(fs.existsSync(target),file+' → '+link);
  }
 });
 await check('No real pilot/training/production approval is fabricated and release gates deny',()=>{
  const pilot=JSON.parse(read('docs/pilot/PILOT_STATUS.json'));
  assert.equal(pilot.authorized,false);assert.equal(pilot.executed,false);assert.equal(pilot.realParticipants,0);assert.equal(pilot.trainingSessionsHeld,0);
  const gate=JSON.parse(read('infra/release-gate.json'));assert.equal(evaluate(gate,'production').eligible,false);assert.equal(evaluate(gate,'staging').eligible,false);
  assert.match(read('docs/final/FINAL_GO_NO_GO_DECISION.md'),/NO-GO/);
 });
 await check('Internal candidate corpus excludes private environment, keys, dumps and logs',()=>{
  const files=corpus();assert(files.length>100);
  for(const file of files){assert(!/(^|\/)\.env(?:$|\.(?!example$))/.test(file.path));assert(!/\.(?:key|pem|dump|age|log)$/.test(file.path));}
  assert(files.some(f=>f.path==='backend/.env.example'));
 });
 const evidence={date:new Date().toISOString(),scope:'Local data/source/documentation/gate checks only; no PostgreSQL, authenticated E2E, pedagogical approval, pilot or release.',results,functionalCases:JSON.parse(read('docs/final/FINAL_ACCEPTANCE_CASES.json')).cases.map(c=>({id:c.id,result:c.result,issue:c.issue})),decision:'NO-GO'};
 require('../../tools/final-evidence.cjs').saveFinalEvidence('HANDOVER_ACCEPTANCE.json',evidence);
 console.log(JSON.stringify(evidence,null,2));if(results.some(r=>r.status!=='pass'))process.exitCode=1;
})().catch(e=>{console.error(e.message);process.exitCode=1;});
