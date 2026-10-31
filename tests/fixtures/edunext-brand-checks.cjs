// Synthetic public data in a fresh browser profile. No real accounts/databases.
const assert=require('node:assert/strict');
const audit=require('../../docs/final/evidence/edunext-brand-20261029-01/BRAND_AUDIT_BEFORE.json');
module.exports=()=>{
 let oldWorker=true;
 return {
  handle(req,res,pathname){
   if(oldWorker&&pathname==='/sw.js'){res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});res.end(audit.swBefore);return true;}
   return false;
  },
  async checkPage({cdp,page,width,results}){
   const brand=await cdp.evaluate(`({title:document.title,legacy:/\\b(?:aithron|athron) (?:edu1?|tutor|translate|insights|sync|ai)\\b/i.test(document.body.innerText),images:[...document.images].filter(image=>!image.complete||image.naturalWidth===0).map(image=>image.getAttribute('src'))})`);
   assert.ok(brand.title.includes('EDUNEXT'),page);assert.equal(brand.legacy,false,page);assert.deepEqual(brand.images,[],page);
   results.push({check:'edunext-visible-brand-and-images',page,width,brand,pass:true});
  },
  async verifyContinuity({cdp,base,navigate,results}){
   await navigate(base+'/login.html');
   const validation=await cdp.evaluate(`document.querySelector('#submit-button').click(); ({identifier:document.querySelector('#identifier').getAttribute('aria-invalid'),password:document.querySelector('#password').getAttribute('aria-invalid')})`);
   assert.deepEqual(validation,{identifier:'true',password:'true'});
   results.push({check:'edunext-login-empty-input-validation',validation,pass:true,scope:'Client validation only; no real authentication.'});
   await cdp.call('Page.navigate',{url:base+'/role-selection.html'});
   for(let i=0;i<150;i++){if(await cdp.evaluate("location.pathname==='/login.html' && document.readyState==='complete'"))break;await new Promise(resolve=>setTimeout(resolve,30));}
   assert.equal(await cdp.evaluate('location.pathname'),'/login.html');
   results.push({check:'edunext-profile-selector-still-fails-closed-without-session',pass:true,scope:'No backend authentication tested; missing session redirects to login.'});
   await navigate(base+'/student/index.html?grade=4&modo=demo');
   const before=await cdp.evaluate(`(async()=>{
    const {openAithronDb}=await import('/js/offline/database-schema.js');const db=await openAithronDb();
    const record={key:'edunext-brand-synthetic-sentinel',value:'retained-no-user-data'};
    await new Promise((resolve,reject)=>{const tx=db.transaction(['storageMetadata','syncQueue','evaluationDrafts'],'readwrite');tx.objectStore('storageMetadata').put(record);tx.objectStore('syncQueue').put({opId:'edunext-brand-synthetic-pending',status:'pendiente',payload:{synthetic:true}});tx.objectStore('evaluationDrafts').put({id:'edunext-brand-synthetic-draft',text:'synthetic-only'});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();
    localStorage.setItem('aithron.brand-test-sentinel','retained');
    const cache=await caches.open('aithron-brand-test-sentinel');await cache.put('/brand-test-sentinel',new Response('retained'));
    const reg=await navigator.serviceWorker.register('/sw.js',{scope:'/'});
    await navigator.serviceWorker.ready;
    for(let i=0;i<100&&!navigator.serviceWorker.controller;i++)await new Promise(r=>setTimeout(r,30));
    return {scope:reg.scope,controller:Boolean(navigator.serviceWorker.controller),caches:await caches.keys()};
   })()`);
   assert.ok(before.controller,'Old worker controls disposable page');
   oldWorker=false;
   const upgrade=await cdp.evaluate(`(async()=>{
    const reg=await navigator.serviceWorker.getRegistration('/');
    const old=reg.active;
    await reg.update();
    for(let i=0;i<150&&!reg.waiting;i++)await new Promise(r=>setTimeout(r,30));
    return {waiting:Boolean(reg.waiting),sameActive:reg.active===old,scope:reg.scope};
   })()`);
   assert.ok(upgrade.waiting,'Identity-only worker update detected');assert.equal(upgrade.scope,before.scope);
   // Close the controlled client by navigating outside the scope, allowing normal
   // lifecycle activation. No skipWaiting, cache purge or data clearing.
   await cdp.call('Page.navigate',{url:'about:blank'});
   await new Promise(resolve=>setTimeout(resolve,500));
   await navigate(base+'/student/index.html?grade=4&modo=demo');
   const after=await cdp.evaluate(`(async()=>{
    const {openAithronDb}=await import('/js/offline/database-schema.js');const db=await openAithronDb();
    const get=(store,id)=>new Promise((resolve,reject)=>{const req=db.transaction(store).objectStore(store).get(id);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
    const record=await get('storageMetadata','edunext-brand-synthetic-sentinel'),pending=await get('syncQueue','edunext-brand-synthetic-pending'),draft=await get('evaluationDrafts','edunext-brand-synthetic-draft');db.close();
    const manifest=await (await fetch('/manifest.webmanifest')).json();
    const reg=await navigator.serviceWorker.getRegistration('/');
    return {title:document.title,record,pending,draft,local:localStorage.getItem('aithron.brand-test-sentinel'),cache:await (await (await caches.open('aithron-brand-test-sentinel')).match('/brand-test-sentinel')).text(),caches:await caches.keys(),scope:reg.scope,waiting:Boolean(reg.waiting),controller:Boolean(navigator.serviceWorker.controller),manifest:{name:manifest.name,id:manifest.id,start_url:manifest.start_url,scope:manifest.scope}};
   })()`);
   assert.equal(after.record.value,'retained-no-user-data');assert.equal(after.local,'retained');assert.equal(after.cache,'retained');
   assert.deepEqual(after.pending,{opId:'edunext-brand-synthetic-pending',status:'pendiente',payload:{synthetic:true}});assert.deepEqual(after.draft,{id:'edunext-brand-synthetic-draft',text:'synthetic-only'});
   assert.ok(before.caches.every(name=>after.caches.includes(name)));assert.equal(after.scope,before.scope);assert.ok(after.controller);assert.equal(after.waiting,false);
   assert.equal(after.manifest.name,'EDUNEXT — Plataforma Educativa');for(const key of ['id','start_url','scope'])assert.equal(after.manifest[key],audit.pwaBefore[key]);
   results.push({check:'edunext-worker-upgrade-and-synthetic-data-continuity',before,upgrade,after,pass:true,scope:'Browser worker lifecycle and synthetic metadata only; NOT installed Android/iOS PWA, real drafts, pending-operation delivery or account isolation certification.'});
   const icon=await cdp.evaluate(`(async()=>{const image=new Image();image.src='/assets/images/branding/edunext-512.png';await image.decode();return {width:image.naturalWidth,height:image.naturalHeight};})()`);
   assert.deepEqual(icon,{width:512,height:512});results.push({check:'edunext-install-icon-decodes',icon,pass:true});
  }
 };
};
