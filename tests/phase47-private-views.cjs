// Fake transport/DOM boundaries only; not browser, cookies, database or tenant proof.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const json=data=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
(async()=>{
 const memory=new Map([['aithron.access_token','synthetic'],['aithron.csrf_token','synthetic']]);
 global.window={sessionStorage:{getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)}};
 const authSource=read('frontend/js/services/auth.service.js').replace("import { config } from '../core/config.js';","const config={apiBaseUrl:'https://api.example/api/v1',csrfHeaderName:'X-CSRF-Token'};");
 const auth=await import('data:text/javascript;base64,'+Buffer.from(authSource).toString('base64'));
 let notifications=0,released;
 const unsubscribe=auth.onAuthenticationCleared(()=>notifications++);
 auth.onAuthenticationCleared(()=>{throw Error('A broken view must not stop logout');});
 global.fetch=async()=>new Promise(resolve=>{released=()=>resolve(json({ok:true}));});
 const logout=auth.signOut();assert.equal(notifications,1,'private view clears before HTTP logout completes');
 while(!released)await tick();released();await logout;
 const before=notifications;unsubscribe();
 global.fetch=async url=>json(url.endsWith('/auth/login')?{access_token:'synthetic-new'}:{user:{id:'synthetic-user'},permissions:[]});
 await auth.signIn({identifier:'synthetic',password:'synthetic'});assert.equal(notifications,before,'unsubscribe works');
 assert.equal(memory.has('aithron.access_token'),true);
 assert.throws(()=>auth.onAuthenticationCleared(null));
 let invalidated,mode='available',deferred;
 const rule={rule_code:'tasks.pending',rule_version:1,report_code:'me.activities',condition:'count > 0'};
 const data={metadata:{generated_at:'2026-10-26T00:00:00Z',timezone:'America/Lima',population_definition:'Own targets',sources:['Assignment'],filters:{}},
  items:[{rule_code:'tasks.pending',rule_version:1,explanation:'<img src=x onerror=alert(1)>',suggestion:'<script>not executable</script>',
   data_status:'available',observed_value:1,source_report_id:'me.activities',source_metric_ids:['pending_count'],academic_period_id:null}],
  limitations:['No academic judgment'],data_status:'available',source_total:1,page_size:25};
 const node=()=>({textContent:'',innerHTML:'',disabled:false,replaceChildren(){this.innerHTML='';}});
 const submit=node(),form={elements:{source:{value:'me.activities'},context:{value:'0'}},handlers:{},
  querySelector:()=>submit,addEventListener(name,handler){this.handlers[name]=handler;}};
 const nodes=new Map(['[data-insight-status]','[data-insight-output]','[data-insight-page="-1"]','[data-insight-page="1"]','[data-insight-page-label]'].map(key=>[key,node()]));
 const host={innerHTML:'',querySelector:selector=>selector==='form'?form:nodes.get(selector),
  querySelectorAll:()=>[nodes.get('[data-insight-page="-1"]'),nodes.get('[data-insight-page="1"]')],
  addEventListener(){},replaceChildren(){this.innerHTML='';for(const value of nodes.values())value.innerHTML='';}};
 const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const dependencies={
  './student-ui.js':{escapeHTML:escape},
  '../services/insights-api.service.js':{insightRuleCatalog:async()=>[rule],readInsights:async()=>{
   if(mode==='forbidden'){const error=Error('private details');error.status=403;throw error;}
   if(mode==='deferred')return new Promise(resolve=>{deferred=resolve;});return data;
  }},
  '../services/reports-api.service.js':{reportContexts:async()=>({items:[]})},
  '../services/auth.service.js':{onAuthenticationCleared:listener=>{invalidated=listener;return ()=>{invalidated=null;};}},
 };
 const context=vm.createContext({AbortController,document:{querySelectorAll:()=>[]}});
 const module=new vm.SourceTextModule(read('frontend/js/components/insights-api-view.js'),{context});
 await module.link(async specifier=>{const values=dependencies[specifier],keys=Object.keys(values);
  return new vm.SyntheticModule(keys,function(){for(const key of keys)this.setExport(key,values[key]);},{context});});
 await module.evaluate();const dispose=module.namespace.renderInsightsApi(host,'me');await tick();
 await form.handlers.submit({preventDefault(){}});
 assert.ok(nodes.get('[data-insight-output]').innerHTML.includes('&lt;img'));
 assert.ok(!nodes.get('[data-insight-output]').innerHTML.includes('<script>'));
 assert.equal(nodes.get('[data-insight-page="1"]').disabled,true);
 mode='forbidden';await form.handlers.submit({preventDefault(){}});
 assert.equal(nodes.get('[data-insight-output]').innerHTML,'');
 assert.match(nodes.get('[data-insight-status]').textContent,/Acceso denegado/);
 mode='deferred';const pending=form.handlers.submit({preventDefault(){}});await tick();
 form.handlers.change();assert.equal(submit.disabled,false,'filter change must not leave infinite loading');
 invalidated();assert.equal(host.innerHTML,'');deferred(data);await pending;
 assert.equal(host.innerHTML,'','late response cannot restore a cleared private view');dispose();
 console.log('PASS private-view boundaries: immediate logout cleanup, observer isolation/unsubscribe, escaped Insights, 403 clearing, pagination, filter recovery, late-response suppression. Transport/DOM doubles only.');
})().catch(error=>{console.error(error);process.exitCode=1;});
