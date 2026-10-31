const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/Frank/AppData/Local/Temp/opencode/node_modules/playwright');
const server=spawn('python',['-m','http.server','8126','--bind','127.0.0.1'],{cwd:require('node:path').join(__dirname,'../frontend'),stdio:'ignore'});
(async()=>{let browser;try{
 await new Promise(r=>setTimeout(r,1000));browser=await chromium.launch();const context=await browser.newContext(),page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});page.on('request',r=>requests.push({url:r.url(),method:r.method()}));page.on('dialog',d=>d.accept());const base='http://127.0.0.1:8126/';
 const go=async path=>{await page.goto(base+'admin/'+path);await page.waitForSelector('#admin-content[aria-busy="false"]');};
 const open=async path=>{await page.goto(base+'admin/'+path);await page.waitForSelector('#admin-content[aria-busy="false"]');await page.waitForSelector('#admin-content form, #admin-content table, #admin-content .admin-empty, #admin-content h2');};
  const text=async selector=>(await page.locator(selector).innerText()).replace(/\s+/g,' ');
  const waitSave=async(selector,previous='')=>{await page.waitForFunction(([sel,prev])=>{const el=document.querySelector(sel);return!!el&&!!el.dataset.marker&&el.dataset.marker!==prev;},[selector,previous],{timeout:15000});return page.locator(selector).getAttribute('data-marker');};


 // 1. Migración conservadora a IndexedDB v7 sin perder datos previos.
 await page.goto(base+'login.html');
 await page.evaluate(()=>new Promise((resolve,reject)=>{const req=indexedDB.open('aithron-edu',6);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('evaluationDrafts'))db.createObjectStore('evaluationDrafts',{keyPath:'id'});};req.onsuccess=()=>{const db=req.result,tx=db.transaction('evaluationDrafts','readwrite');tx.objectStore('evaluationDrafts').put({id:'preserved26',text:'conservado'});tx.oncomplete=()=>{db.close();resolve();};};req.onerror=()=>reject(req.error);}));
 await go('aulas.html');
 const migration=await page.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const req=indexedDB.open('aithron-edu');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});const names=[...db.objectStoreNames];const preserved=await new Promise((resolve,reject)=>{const tx=db.transaction('evaluationDrafts','readonly'),req=tx.objectStore('evaluationDrafts').get('preserved26');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});const version=db.version;db.close();return {version,names,preserved:preserved?.text};});
  assert.equal(migration.version,await page.evaluate(async()=>(await import('/js/offline/database-schema.js')).DB_VERSION));assert(migration.names.includes('adminAcademicRecords'));assert(migration.names.includes('adminAcademicRecordVersions'));assert.equal(migration.preserved,'conservado');

 // 2. Aulas: resumen compartido, tabla y filtros sobre la fuente base.
 assert.deepEqual(await page.locator('.directory-summary strong').allTextContents(),['3','76','3','0','0','0']);
 assert.equal(await page.locator('#classroom-table tbody tr').count(),3);
 assert.match(await text('#classroom-count'),/3 aulas en la selección/);
 assert.match(await text('#classroom-count'),/3 registradas/);
 assert.equal(await page.locator('#classroom-table tbody tr').first().innerText().then(t=>t.includes('DEMO-AULA-4')),true);
 assert.match(await text('#classroom-results'),/No configurada/);
 await page.selectOption('#grade','5');assert.equal(await page.locator('#classroom-table tbody tr').count(),1);assert.match(await text('#classroom-count'),/1 aulas en la selección/);
 await page.selectOption('#grade','');await page.fill('#search','DEMO-AULA-6');assert.equal(await page.locator('#classroom-table tbody tr').count(),1);
 await page.getByRole('button',{name:'Limpiar filtros',exact:true}).click();await page.selectOption('#state','draft');assert.equal(await page.locator('#classroom-table tbody tr').count(),0);assert.match(await text('#classroom-results'),/Sin registros coincidentes/);
 await page.selectOption('#state','base');assert.equal(await page.locator('#classroom-table tbody tr').count(),3);
 await page.selectOption('#period','undated');assert.equal(await page.locator('#classroom-table tbody tr').count(),3);

 // 3. Detalle de aula: ocupación referencial, docentes, asignaturas y estudiantes.
 await go('aula-detalle.html?id=a5');
 assert.match(await text('#admin-content'),/DEMO-AULA-5/);
 assert.match(await text('#admin-content'),/28 de 30 plazas referenciales/);
 assert.match(await text('#admin-content'),/Sin periodo confirmado/);
 assert.match(await text('#admin-content'),/Profesor Aithron/);
 assert.match(await text('#admin-content'),/Estudiante 5-01/);
 assert.match(await text('#admin-content'),/Matemática/);
 assert.match(await text('#admin-content'),/Relaciones de matrícula: 28/);
 await go('aula-detalle.html?id=aula-inexistente');
 assert.match(await text('#admin-content'),/no existe en la fuente de demostración/);

  // 4. Editor de aula: alta local, persistencia, estado listo y errores de validación.
  await open('editar-aula.html');
  await page.fill('#code','DEMO-AULA-B1');await page.selectOption('#grade','4');await page.fill('#section','B');await page.selectOption('#periodId','2026-1');await page.fill('#capacity','25');
  await page.getByRole('button',{name:'Guardar borrador',exact:true}).click();
  let marker=await waitSave('#classroom-validation');
  assert.match(await text('#classroom-validation'),/Estado local: draft/);
  const classroomDraft=new URL(page.url()).searchParams.get('id');
  assert.match(classroomDraft,/^admin-academic-/);
  await page.reload();await page.waitForSelector('#classroom-form');
  assert.equal(await page.inputValue('#code'),'DEMO-AULA-B1');
  assert.equal(await page.inputValue('#section'),'B');
  assert.equal(await page.inputValue('#capacity'),'25');
  await page.getByRole('button',{name:'Guardar y marcar listo para revisión local',exact:true}).click();
  marker=await waitSave('#classroom-validation');
  assert.match(await text('#classroom-validation'),/Estado local: ready/);
  await page.fill('#code','AULA-NO-FICTICIA');await page.click('#validate-draft');
  await page.waitForFunction(()=>document.querySelector('#classroom-validation').textContent.includes('DEMO-AULA-'));
  assert.match(await text('#classroom-validation'),/El código de aula debe ser ficticio/);
  await page.fill('#code','DEMO-AULA-B1');await page.getByRole('button',{name:'Guardar borrador',exact:true}).click();
  marker=await waitSave('#classroom-validation',marker);
  assert.match(await text('#classroom-validation'),/Estado local: ready/);

  // 5. Duplicados de aula: mismo código, grado, sección y periodo.
  await open('editar-aula.html');
  await page.fill('#code','DEMO-AULA-B1');await page.selectOption('#grade','4');await page.fill('#section','B');await page.selectOption('#periodId','2026-1');
  await page.getByRole('button',{name:'Guardar borrador',exact:true}).click();
  await waitSave('#classroom-validation');
  assert.match(await text('#classroom-validation'),/Ya existe un borrador de aula con el mismo código, grado, sección y periodo/);
  assert.match(await text('#classroom-validation'),/Estado local: incomplete/);

  // 6. Periodos académicos: base, propuesta local, solapamiento y duplicado.
  await go('periodos-academicos.html');
  assert.deepEqual(await page.locator('.directory-summary strong').allTextContents(),['2','0','1','5']);
  assert.equal(await page.locator('#period-table tbody tr').count(),2);
  await page.fill('#periodName','2026 — Tercer semestre (demostración)');await page.fill('#periodYear','2026');await page.selectOption('#periodType','semester');await page.fill('#periodStart','2026-07-01');await page.fill('#periodEnd','2026-12-31');
  await page.getByRole('button',{name:'Guardar propuesta de periodo',exact:true}).click();
  let periodMarker=await waitSave('#period-validation');
  assert.match(await text('#period-validation'),/Estado local: draft/);
  assert.equal(await page.locator('#period-table tbody tr').count(),3);
  await page.fill('#periodName','2026 — Tercer semestre (demostración)');await page.fill('#periodYear','2026');await page.selectOption('#periodType','semester');
  await page.getByRole('button',{name:'Guardar propuesta de periodo',exact:true}).click();
  periodMarker=await waitSave('#period-validation',periodMarker);
  assert.match(await text('#period-validation'),/Ya existe una propuesta de periodo con el mismo nombre, año y tipo/);
  await page.fill('#periodName','Trimestre invertida 2026');await page.fill('#periodYear','2026');await page.fill('#periodStart','2026-10-01');await page.fill('#periodEnd','2026-09-01');
  await page.getByRole('button',{name:'Guardar propuesta de periodo',exact:true}).click();
  periodMarker=await waitSave('#period-validation',periodMarker);
  assert.match(await text('#period-validation'),/La fecha de inicio debe ser anterior a la fecha de fin/);

  // 7. Grados y secciones: estructura compartida y propuestas acotadas por grado.
  await go('grados-secciones.html');
  assert.equal(await page.locator('#grade-results article').count(),3);
  assert.equal(await page.locator('#section-table tbody tr').count(),3);
  await page.selectOption('#sectionGrade','4');await page.fill('#section','A');
  await page.getByRole('button',{name:'Guardar propuesta de sección',exact:true}).click();
  let sectionMarker=await waitSave('#section-validation');
  assert.match(await text('#section-validation'),/La sección ya existe en la estructura base/);
  await page.selectOption('#sectionGrade','4');await page.fill('#section','B');
  await page.getByRole('button',{name:'Guardar propuesta de sección',exact:true}).click();
  sectionMarker=await waitSave('#section-validation',sectionMarker);
  assert.match(await text('#section-validation'),/Estado local: draft/);
  await page.selectOption('#sectionGrade','4');await page.fill('#section','B');
  await page.getByRole('button',{name:'Guardar propuesta de sección',exact:true}).click();
  sectionMarker=await waitSave('#section-validation',sectionMarker);
  assert.match(await text('#section-validation'),/Ya existe una propuesta de sección con el mismo identificador en ese grado/);
  await page.selectOption('#sectionGrade','5');await page.fill('#section','B');
  await page.getByRole('button',{name:'Guardar propuesta de sección',exact:true}).click();
  sectionMarker=await waitSave('#section-validation',sectionMarker);
  assert.match(await text('#section-validation'),/Estado local: draft/);
  assert.equal(await page.locator('#section-table tbody tr').count(),7);


 // 8. Matrículas: relaciones base, filtros y duplicados contra la fuente compartida.
 await go('matriculas.html');
 assert.deepEqual(await page.locator('.directory-summary strong').allTextContents(),['76','76','3','0','0']);
 assert.equal(await page.locator('#enrollment-table tbody tr').count(),76);
 await page.fill('#search','Estudiante 4-01');assert.equal(await page.locator('#enrollment-table tbody tr').count(),1);
 await page.fill('#search','');await page.selectOption('#grade','5');assert.equal(await page.locator('#enrollment-table tbody tr').count(),28);
 await page.selectOption('#grade','');await page.selectOption('#room','a4');assert.equal(await page.locator('#enrollment-table tbody tr').count(),24);
 await page.selectOption('#room','');await page.selectOption('#period','2026-1');assert.equal(await page.locator('#enrollment-table tbody tr').count(),0);
 await page.selectOption('#period','undated');assert.equal(await page.locator('#enrollment-table tbody tr').count(),76);
   await open('editar-matricula.html');
   await page.waitForFunction(()=>{const sel=document.querySelector('#studentId');return sel&&sel.options.length>=2;},{timeout:20000});
   await page.selectOption('#studentId',{index:1});await page.selectOption('#roomId','a4');await page.selectOption('#periodId','2026-1');
   await page.click('#validate-draft');
   await page.waitForFunction(()=>document.querySelector('#enrollment-validation').textContent.includes('El estudiante ya tiene una relación'));
   assert.match(await text('#enrollment-validation'),/El estudiante ya tiene una relación de demostración con esa misma aula/);
   await page.selectOption('#roomId','a5');
   await page.getByRole('button',{name:'Guardar borrador',exact:true}).click();
   await waitSave('#enrollment-validation');
   assert.match(await text('#enrollment-validation'),/Estado local: draft/);
   assert.match(await text('#enrollment-validation'),/plaza\(s\) referenciales disponibles/);
   const enrollmentDraft=new URL(page.url()).searchParams.get('id');
   assert.match(enrollmentDraft,/^admin-academic-/);



  // 9. Asignaciones docentes: catálogo compartido, avisos y errores de coherencia.
  await go('asignaciones-docentes.html');
  assert.deepEqual(await page.locator('.directory-summary strong').allTextContents(),['15','1','3','0','0']);
  assert.equal(await page.locator('#assignment-table tbody tr').count(),15);
  await page.selectOption('#room','a4');assert.equal(await page.locator('#assignment-table tbody tr').count(),5);
  await page.selectOption('#room','');await page.selectOption('#course','math:g4');assert.equal(await page.locator('#assignment-table tbody tr').count(),1);
   await open('editar-asignacion.html');
   await page.waitForFunction(()=>{const sel=document.querySelector('#monitorId');return sel&&sel.options.length>=2;},{timeout:15000});
   await page.selectOption('#monitorId','demo-monitor');await page.selectOption('#roomId','a4');await page.selectOption('#courseKey','math:g4');await page.selectOption('#periodId','2026-1');
   await page.getByRole('button',{name:'Guardar borrador',exact:true}).click();
   let assignmentMarker=await waitSave('#assignment-validation');
   assert.match(await text('#assignment-validation'),/Estado local: draft/);
   assert.match(await text('#assignment-validation'),/La fuente de demostración ya registra esa pareja docente/);
   await page.selectOption('#courseKey','math:g5');
   await page.getByRole('button',{name:'Guardar borrador',exact:true}).click();
   assignmentMarker=await waitSave('#assignment-validation',assignmentMarker);
   assert.match(await text('#assignment-validation'),/La asignatura pertenece a otro grado que el del aula seleccionada/);
   const assignmentDraft=new URL(page.url()).searchParams.get('id');


  // 10. Movimientos académicos: preparación local sin ejecución de la relación vigente.
  await go('movimientos-academicos.html');
  assert.deepEqual(await page.locator('.directory-summary strong').allTextContents(),['0','0','0']);
  await page.selectOption('#movementType','classroom');await page.selectOption('#studentId','a4-s1');await page.selectOption('#periodId','2026-1');await page.selectOption('#fromRoomId','a4');await page.selectOption('#toRoomId','a5');await page.fill('#proposedDate','2026-02-02');
  await page.getByRole('button',{name:'Guardar borrador de movimiento',exact:true}).click();
  let movementMarker=await waitSave('#movement-validation');
  assert.match(await text('#movement-validation'),/Estado local: draft/);
  assert.match(await text('#movement-validation'),/El movimiento no se ejecuta/);
  assert.equal(await page.locator('#movement-table tbody tr').count(),1);
  await page.selectOption('#movementType','classroom');await page.selectOption('#studentId','a4-s2');await page.selectOption('#periodId','2026-1');await page.selectOption('#fromRoomId','a4');await page.selectOption('#toRoomId','a4');
  await page.getByRole('button',{name:'Guardar borrador de movimiento',exact:true}).click();
  movementMarker=await waitSave('#movement-validation',movementMarker);
  assert.match(await text('#movement-validation'),/El aula de destino debe ser distinta del aula de origen/);
  await page.selectOption('#movementType','promotion');await page.selectOption('#studentId','a6-s1');await page.selectOption('#periodId','2026-1');await page.selectOption('#fromGrade','6');await page.selectOption('#toGrade','6');
  await page.getByRole('button',{name:'Guardar borrador de movimiento',exact:true}).click();
  movementMarker=await waitSave('#movement-validation',movementMarker);
  assert.match(await text('#movement-validation'),/La promoción debe apuntar a un grado posterior/);
  assert.match(await text('#movement-validation'),/no se calcula desde notas ni prácticas/);


 // 11. Integridad de los borradoreses locales y conservación de la fuente base.
 const integrity=await page.evaluate(async ids=>{
  const drafts=await import('/js/services/admin-organization-drafts.service.js');
  const rel=await import('/js/utils/academic-relations.js');
  const model=await rel.organizationModel();
  const classroom=await drafts.getAcademicRecord(ids.classroom);
  const copy=await (async()=>{const record=drafts.newAcademicRecord('classroom',{...classroom.data,code:classroom.data.code+'-COPIA'});return drafts.saveAcademicRecord(record,{allowIncomplete:true,validator:()=>({errors:[],warnings:[]})});})();
  let stale=false,foreign=false,archivedBlocked=false;
  try{await drafts.saveAcademicRecord({...classroom,data:{...classroom.data,name:'Cambio externo'}});}catch{stale=true;}
  try{await drafts.saveAcademicRecord({...drafts.newAcademicRecord('classroom',{code:'DEMO-AULA-Z9',grade:4,section:'Z',periodId:'2026-1'}),owner:'otro-admin',institutionId:'demo-institution'});}catch{foreign=true;}
  await drafts.archiveAcademicRecord(classroom);
  try{await drafts.archiveAcademicRecord(classroom);}catch{archivedBlocked=true;}
  const versions=await drafts.academicRecordVersions(ids.classroom);
  const after=await rel.organizationModel();
  return {stale,foreign,archivedBlocked,copyNew:copy.id!==ids.classroom,versions:versions.length,base:{rooms:after.rooms.length,students:after.students.length,enrollments:after.enrollments.length,assignments:after.assignments.length,periods:after.periods.length,studentRoom:after.students.find(s=>s.id==='a4-s1').roomId}};
 },{classroom:classroomDraft,enrollment:enrollmentDraft,assignment:assignmentDraft});
 assert.deepEqual(integrity.stale,true);assert.deepEqual(integrity.foreign,true);assert.deepEqual(integrity.archivedBlocked,true);
 assert.equal(integrity.copyNew,true);assert(integrity.versions>=2);
 assert.deepEqual(integrity.base,{rooms:3,students:76,enrollments:76,assignments:15,periods:2,studentRoom:'a4'});

 // 12. Dependencias: un borrador con propuestas dependientes no se puede eliminar.
 const dependencies=await page.evaluate(async id=>{
  const drafts=await import('/js/services/admin-organization-drafts.service.js');
  const classrooms=await import('/js/services/admin-classrooms.service.js');
  const target=await drafts.getAcademicRecord(id);
  const dependent=drafts.newAcademicRecord('enrollment',{studentId:'a4-s3',roomId:'a4',periodId:'2026-1',classroomDraftId:id});
  await drafts.saveAcademicRecord(dependent,{allowIncomplete:true,validator:()=>({errors:[],warnings:[]})});
  let blocked=false,message='';
  try{await classrooms.deleteClassroomProposal(target);}catch(error){blocked=true;message=error.message;}
  await drafts.deleteAcademicRecord(dependent,{dependencies:[]});
  return {blocked,message};
 },classroomDraft);
 assert.equal(dependencies.blocked,true);
 assert.match(dependencies.message,/dependientes/);

 // 13. Acciones de propuesta en la vista de aulas: duplicar, archivar y eliminar.
 await go('aulas.html');
 await page.fill('#search','DEMO-AULA-B1');
 const draftRow=page.locator('#classroom-table tbody tr').filter({hasText:'DEMO-AULA-B1'}).first();
 await draftRow.locator('[data-org-copy]').click();
 await page.waitForFunction(()=>document.querySelector('#classroom-count').textContent.includes('2 borradores locales'));
 assert.equal(await page.locator('#classroom-table tbody tr').count(),2);
 await page.locator('#classroom-table tbody tr').filter({hasText:'DEMO-AULA-B1-Copia'}).first().locator('[data-org-archive]').click();
 await page.waitForFunction(()=>document.querySelector('#classroom-count').textContent.includes('1 borradores locales'));
 assert.equal(await page.locator('#classroom-table tbody tr').count(),1);
 await page.locator('#classroom-table tbody tr').filter({hasText:'DEMO-AULA-B1'}).first().locator('[data-org-delete]').click();
 await page.waitForFunction(()=>document.querySelector('#classroom-count').textContent.includes('0 borradores locales'));
 assert.equal(await page.locator('#classroom-table tbody tr').count(),0);

 // 14. Panel de administración: enlaces de organización académica y navegación lateral.
 await go('index.html');
 assert.equal(await page.locator('.admin-quick-links a[href="aulas.html"]').count(),1);
 assert.equal(await page.locator('a[href="movimientos-academicos.html"]').count>=1,true);
 assert.equal(await page.locator('a[href="periodos-academicos.html"]').count>=1,true);
 await page.locator('a[href="grados-secciones.html"]').first().click();
 await page.waitForSelector('#admin-content[aria-busy="false"]');
 assert.match(await text('#admin-content'),/Grados y Secciones/);

 // 15. Operación local sin conexión tras preparar el módulo.
 await go('aulas.html');
 await page.click('#prepare-classrooms-offline');
 await page.waitForFunction(()=>document.querySelector('#org-message').textContent.includes('archivos verificados'),null,{timeout:90000});
 await context.setOffline(true);
 await go('aulas.html');
 assert.equal(await page.locator('#classroom-table tbody tr').count(),3);
 await context.setOffline(false);

 // 16. Diez vistas de la fase 26: responsive, accesibilidad y enlaces internos.
 const views=['aulas.html','aula-detalle.html?id=a5','editar-aula.html','grados-secciones.html','periodos-academicos.html','matriculas.html','editar-matricula.html','asignaciones-docentes.html','editar-asignacion.html','movimientos-academicos.html'];
 for(const path of views){
  await go(path);
  for(const width of [1440,768,320]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,path+' overflow '+width);}
  await page.setViewportSize({width:1440,height:1000});
  for(const href of await page.locator('main a[href]').evaluateAll(nodes=>nodes.map(n=>n.href)))assert((await page.request.get(href)).ok(),href);
  await page.addScriptTag({path:process.env.AXE_CORE_MODULE||'C:/Users/Frank/AppData/Local/Temp/opencode/node_modules/axe-core/axe.min.js'});
  const violations=await page.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})));
  assert.deepEqual(violations,[],path+' accesibilidad');
 }
 assert(requests.every(r=>r.method==='GET'&&r.url.startsWith(base)&&!new URL(r.url).pathname.startsWith('/api/')));
 assert.deepEqual(errors,[]);
 console.log('PASS fase 26: migración v6→v7 conservadora, diez vistas de organización académica, aulas y detalle con capacidad referencial, editor con validaciones y duplicados, periodos, grados y secciones acotadas por grado, matrículas con duplicados y capacidad, asignaciones docentes, movimientos preparados sin ejecución, integridad de borradores locales, dependencias, duplicar/archivar/eliminar, offline y diez vistas responsive/axe sin alterar la fuente base.');
}finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
