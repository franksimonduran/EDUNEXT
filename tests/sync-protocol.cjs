// Synthetic protocol/transaction checks. Not IndexedDB/browser or PostgreSQL E2E.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');

(async()=>{
 const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
 const protocol=await import('data:text/javascript;base64,'+Buffer.from(read('frontend/js/sync/protocol.js')).toString('base64'));
 const context={protocol_version:1,account_context_id:crypto.randomUUID(),institution_context_id:crypto.randomUUID()};
 const scope=protocol.requireContext(context),lesson=crypto.randomUUID(),version=crypto.randomUUID();
 const operation={opId:crypto.randomUUID(),protocolVersion:1,accountScope:scope};
 operation.body={client_operation_id:operation.opId,resource_id:lesson,lesson_version_id:version,schema_version:1,operation_type:'lesson.progress.complete'};
 const receipt={client_operation_id:operation.opId,status:'applied',server_resource_id:lesson,server_version:version,confirmed_at:new Date().toISOString()};
 let passed=0;
 async function test(name,run){await run();passed++;console.log('PASS '+name);}
 await test('finite operation type and privileged payload rejection',()=>{
  assert.deepEqual(protocol.operationBody(operation),operation.body);
  for(const type of ['academic_record.update','user.role.change','assessment_grade.edit','enrollment.create','content.publish'])
   assert.throws(()=>protocol.operationBody({...operation,body:{...operation.body,operation_type:type}}));
  assert.throws(()=>protocol.operationBody({...operation,body:{...operation.body,score:100}}));
 });
 await test('demo and foreign operations excluded',()=>{
  assert.equal(protocol.ownedOperations([operation,{...operation,protocolVersion:undefined},{...operation,accountScope:'foreign'}],context).length,1);
 });
 await test('identity required and protocol version checked',()=>{
  assert.throws(()=>protocol.requireContext({...context,protocol_version:2}));
  assert.throws(()=>protocol.requireContext({...context,account_context_id:'demo'}));
 });
 await test('no receipt from send or mismatched operation',()=>{
  assert.throws(()=>protocol.validateReceipt(operation,{...receipt,status:'sending'}));
  for(const field of ['client_operation_id','server_resource_id','server_version'])
   assert.throws(()=>protocol.validateReceipt(operation,{...receipt,[field]:crypto.randomUUID()}));
  assert.throws(()=>protocol.validateReceipt(operation,{...receipt,confirmed_at:'invalid'}));
  assert.equal(protocol.validateReceipt(operation,receipt),receipt);
 });
 await test('errors classified without treating auth as offline',()=>{
  assert.equal(protocol.failureState(401),'blocked_auth');assert.equal(protocol.failureState(403),'rejected');
  assert.equal(protocol.failureState(409),'conflict');assert.equal(protocol.failureState(503),'retryable_error');
  assert.equal(protocol.failureState(429),'retryable_error');
 });
 await test('bounded backoff and retry budget',()=>{
  assert.equal(protocol.retryDelay(1,()=>0.5),1000);assert.equal(protocol.retryDelay(5,()=>0.5),16000);
  assert.throws(()=>protocol.retryDelay(6));
 });
 await test('Retry-After cannot shorten local backoff',()=>{
  assert.equal(protocol.nextRetryAt(1,'120',1000),121000);
  assert.ok(protocol.nextRetryAt(1,'invalid',1000)>=1750);
  assert.equal(protocol.failureState(413),'rejected');
 });
 const memory=new Map(['syncQueue','learningProgress','syncReceipts'].map(name=>[name,new Map()]));
 let failOpen=false,failProgressWrite=false,mode='success',sends=[];
 function db(){return {close(){},transaction(names){
  const snapshots=new Map(names.map(name=>[name,new Map(memory.get(name))]));let aborted=false;
  const tx={abort(){aborted=true;for(const [name,snapshot] of snapshots)memory.set(name,snapshot);queueMicrotask(()=>tx.onabort?.());},
   objectStore(name){const store=memory.get(name);return {
    add(value){if(store.has(value.opId))throw Error('duplicate');store.set(value.opId,structuredClone(value));},
    put(value){if(failProgressWrite&&name==='learningProgress')throw Error('QuotaExceededError');store.set(name==='syncQueue'?value.opId:value.id,structuredClone(value));},
    get(key){const request={};queueMicrotask(()=>{request.result=structuredClone(store.get(key));request.onsuccess?.();});return request;},
   };}};
  setImmediate(()=>{if(!aborted)tx.oncomplete?.();});return tx;
 }};}
 const sandbox=vm.createContext({crypto:crypto.webcrypto,navigator:{locks:{request:async(_key,fn)=>fn()}},Date,Error,TypeError,Promise});
 const dependencies={
  './database.js':{openAithronDb:async()=>{if(failOpen)throw Error('QuotaExceededError');return db();},getAll:async name=>[...memory.get(name).values()]},
  '../services/sync-api.service.js':{syncBootstrap:async()=>context,pushSyncOperations:async(ctx,bodies)=>{
   sends.push({context:ctx,bodies});if(mode==='auth'){const error=Error('expired');error.status=401;throw error;}
   if(mode==='mismatch')return [{...receipt,client_operation_id:crypto.randomUUID()}];
   return bodies.map(body=>({...receipt,client_operation_id:body.client_operation_id,server_resource_id:body.resource_id,server_version:body.lesson_version_id}));
  }},
  '../sync/protocol.js':protocol,
 };
 const module=new vm.SourceTextModule(read('frontend/js/offline/confirmed-sync.js'),{context:sandbox});
 await module.link(async specifier=>{const values=dependencies[specifier],keys=Object.keys(values);
  return new vm.SyntheticModule(keys,function(){for(const key of keys)this.setExport(key,values[key]);},{context:sandbox});});
 await module.evaluate();const client=module.namespace;
 await test('local save and queue share simulated transaction',async()=>{
  const saved=await client.queueLessonCompletion(context,lesson,version);
  assert.equal(memory.get('syncQueue').get(saved.opId).status,'ready');
  assert.equal(memory.get('learningProgress').get(`sync-v1:${scope}:${lesson}`).status,'local_provisional');
 });
 await test('storage failure does not report local success',async()=>{
  const before=memory.get('syncQueue').size;failOpen=true;
  await assert.rejects(()=>client.queueLessonCompletion(context,lesson,version));failOpen=false;
  assert.equal(memory.get('syncQueue').size,before);
 });
 await test('simulated transaction abort preserves queue when progress write fails',async()=>{
  const before=memory.get('syncQueue').size;failProgressWrite=true;
  await assert.rejects(()=>client.queueLessonCompletion(context,lesson,version));failProgressWrite=false;
  assert.equal(memory.get('syncQueue').size,before);
 });
 await test('confirmed receipt saved only for owning operation',async()=>{
  memory.get('syncQueue').set('demo',{opId:'demo',status:'ready'});
  const result=await client.syncAuthenticatedProgress();assert.equal(result.confirmed,1);
  assert.equal(memory.get('syncReceipts').size,1);assert.equal(memory.get('syncQueue').get('demo').status,'ready');
  assert.equal(memory.get('learningProgress').get(`sync-v1:${scope}:${lesson}`).status,'server_confirmed');
 });
 await test('lost or invalid receipt keeps provisional work',async()=>{
  const saved=await client.queueLessonCompletion(context,lesson,version);mode='mismatch';
  const result=await client.syncAuthenticatedProgress();assert.equal(result.confirmed,0);
  assert.equal(memory.get('syncQueue').get(saved.opId).status,'retryable_error');
  assert.equal(memory.get('learningProgress').get(`sync-v1:${scope}:${lesson}`).status,'local_provisional');
 });
 await test('expired session blocks without deleting or confirming',async()=>{
  const saved=await client.queueLessonCompletion(context,crypto.randomUUID(),version);mode='auth';
  await client.syncAuthenticatedProgress();assert.equal(memory.get('syncQueue').get(saved.opId).status,'blocked_auth');
  assert.ok(memory.get('syncQueue').has(saved.opId));
 });
 await test('cross-account preconditions accompany every push',()=>{
  assert.ok(sends.length);for(const send of sends)assert.equal(send.context.account_context_id,context.account_context_id);
  assert.match(read('backend/app/api/v1/endpoints/sync.py'),/expected_account_id.*context\.user_id/);
 });
 await test('missing Web Locks prevents dispatch',async()=>{
  sandbox.navigator.locks=null;const before=sends.length;
  await assert.rejects(()=>client.syncAuthenticatedProgress());assert.equal(sends.length,before);
 });
 console.log(JSON.stringify({passed,scope:'synthetic protocol and storage doubles only'}));
})().catch(error=>{console.error(error);process.exitCode=1;});
