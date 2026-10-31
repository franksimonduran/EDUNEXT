const assert=require('node:assert/strict');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
module.exports=()=>({
 async check({cdp,base,navigate,results}){
  await cdp.call('Network.enable');
  const initial=cdp.requests.length;
  for(const width of [320,375,768,1440]){
   await cdp.call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
   await navigate(base+'/student/tutor.html?grade=4&modo=local');
   const state=await cdp.evaluate(`({title:document.querySelector('#local-tutor-title')?.textContent,consent:document.querySelector('#local-model-consent')?.checked,disabled:document.querySelector('#local-model-load')?.disabled,questionDisabled:document.querySelector('#local-question')?.disabled,overflow:document.documentElement.scrollWidth>innerWidth})`);
   assert.equal(state.consent,false);assert.equal(state.disabled,true);assert.equal(state.questionDisabled,true);assert.equal(state.overflow,false);assert.ok(state.title.includes('MiniCPM'));
   results.push({check:'local-minicpm-opt-in-responsive',width,state,pass:true});
  }
  assert.equal(cdp.requests.slice(initial).filter(request=>/\/vendor\/wllama\/|\/assets\/models\//.test(request.url)).length,0,'No runtime or model fetched before consent');
  const capability=await cdp.evaluate(`import('/js/services/local-tutor.service.js').then(module=>module.probeLocalRuntime())`);
  const environment=await cdp.evaluate(`({userAgent:navigator.userAgent,language:navigator.language,hardwareConcurrency:navigator.hardwareConcurrency,deviceMemory:navigator.deviceMemory??null,crossOriginIsolated:Boolean(globalThis.crossOriginIsolated)})`);
  const loadStarted=Date.now();
  await cdp.evaluate(`document.querySelector('#local-model-consent').click();document.querySelector('#local-model-load').click();`);
  if(!capability.supported){
   for(let i=0;i<80;i++){await delay(50);if(await cdp.evaluate("!document.querySelector('#local-model-load').disabled"))break;}
   const state=await cdp.evaluate(`({status:document.querySelector('#local-model-status').textContent,questionDisabled:document.querySelector('#local-question').disabled})`);
   assert.equal(state.questionDisabled,true);assert.match(state.status,/WebAssembly|WASM/i);
   assert.equal(cdp.requests.slice(initial).filter(request=>/\/vendor\/wllama\/|\/assets\/models\//.test(request.url)).length,0);
   results.push({check:'local-minicpm-real-browser-capability',capability,state,generation:'BLOCKED_NO_WASM',pass:true,scope:'Correct unsupported-device handling; no real model generation was performed.'});
   return;
  }
  let ready=false;
  for(let i=0;i<1800;i++){await delay(250);ready=await cdp.evaluate("!document.querySelector('#local-question').disabled");if(ready)break;const stopped=await cdp.evaluate("!document.querySelector('#local-model-load').disabled");if(stopped)break;}
  const loadMs=Date.now()-loadStarted;
  const loadStatus=await cdp.evaluate("document.querySelector('#local-model-status').textContent");
  if(!ready){results.push({check:'local-minicpm-real-browser-generation',capability,environment,loadMs,loadStatus,pass:false,generation:'BLOCKED_LOAD_FAILED',scope:'WASM probe succeeded but the actual GGUF load failed; not inference approval.'});return;}
  const heapAfterLoad=await cdp.evaluate("performance.memory ? {usedJSHeapSize:performance.memory.usedJSHeapSize,totalJSHeapSize:performance.memory.totalJSHeapSize} : null");
  const generationStarted=Date.now();
  await cdp.evaluate(`document.querySelector('#local-question').value='¿Qué representa una fracción? Responde en una frase corta.';document.querySelector('#local-question-form').requestSubmit();`);
  let output='';
  for(let i=0;i<1800;i++){await delay(250);output=await cdp.evaluate("document.querySelector('#local-answer').textContent");if(output)break;if(await cdp.evaluate("!document.querySelector('#local-model-load').disabled"))break;}
  const generationMs=Date.now()-generationStarted;
  const status=await cdp.evaluate("document.querySelector('#local-model-status').textContent");
  if(!output){results.push({check:'local-minicpm-real-browser-generation',capability,environment,loadMs,generationMs,loadStatus,status,generation:'BLOCKED_GENERATION_FAILED',pass:false,scope:'The model loaded but did not return a finished synthetic answer within the polling window.'});}
  assert.ok(output,'Actual model did not return a valid finished answer: '+status);
  const requests=cdp.requests.slice(initial);
  const remote=requests.filter(request=>{let url;try{url=new URL(request.url);}catch{return true;}if(url.protocol==='data:'||url.protocol==='blob:')return false;if(request.method!=='GET'&&request.method!=='HEAD')return true;return url.origin!==base;});
  assert.deepEqual(remote,[],'Only local GET resource loading, never remote prompt submission');
  const beforeOffline=cdp.requests.length;let offlineOutput='';
  const offlineStarted=Date.now();
  try{
   await cdp.call('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:-1,uploadThroughput:-1});
   await cdp.evaluate(`document.querySelector('#local-question').value='Dame una pista breve sobre partes iguales.';document.querySelector('#local-question-form').requestSubmit();`);
   for(let i=0;i<1800;i++){await delay(250);offlineOutput=await cdp.evaluate("document.querySelector('#local-answer').textContent");if(offlineOutput)break;if(await cdp.evaluate("!document.querySelector('#local-model-load').disabled"))break;}
   assert.ok(offlineOutput,'Model did not finish the offline synthetic question');
   assert.equal(cdp.requests.length,beforeOffline,'No request while generating offline');
  }finally{await cdp.call('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});}
  const offlineMs=Date.now()-offlineStarted;
  const heapAfterGeneration=await cdp.evaluate("performance.memory ? {usedJSHeapSize:performance.memory.usedJSHeapSize,totalJSHeapSize:performance.memory.totalJSHeapSize} : null");
  await cdp.evaluate("document.querySelector('#local-model-stop').click()");
  const cleared=await cdp.evaluate(`({answer:document.querySelector('#local-answer').textContent,question:document.querySelector('#local-question').value,disabled:document.querySelector('#local-question').disabled})`);
  assert.deepEqual(cleared,{answer:'',question:'',disabled:true});
  results.push({check:'local-minicpm-real-browser-generation',capability,environment,loadMs,generationMs,offlineMs,heapAfterLoad,heapAfterGeneration,loadStatus,output,offlineOutput,outputLength:output.length,offlineOutputLength:offlineOutput.length,status,resourceRequests:requests.length,cleared,generation:'REAL_MODEL_EXECUTED',pass:true,scope:'Two synthetic demonstration questions on this browser, second with network emulated offline and page already loaded. Timings are wall-clock polling measurements on one machine, not latency guarantees. JS heap excludes WASM memory. Not Android, pedagogical accuracy, account isolation, reopening offline PWA or institutional approval.'});
 }
});
