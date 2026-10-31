// Explicit test only: synthetic policy/auth/database, real local Argos inference.
const assert=require('node:assert/strict'),path=require('node:path'),http=require('node:http');
const {spawn}=require('node:child_process');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
module.exports=()=>{
 let child,port,translations=0;
 const responsePolicies=[];
 return {
  async start(){
   const python=process.env.EDUNEXT_ARGOS_TEST_PYTHON,models=process.env.EDUNEXT_ARGOS_TEST_PACKAGES;
   assert.ok(python&&path.isAbsolute(python)&&models&&path.isAbsolute(models),'Explicit local test interpreter/models required');
   child=spawn(python,['-I','-X','utf8',path.resolve(__dirname,'../../backend/verification/argos_browser_fixture.py'),'--models',models],{env:{...process.env,EDUNEXT_ARGOS_BROWSER_FIXTURE:'1'},stdio:['ignore','pipe','pipe']});
   const errors=[];child.stderr.on('data',data=>errors.push(data.toString()));
   port=await new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(new Error('Fixture startup timed out')),20000);child.once('exit',()=>{clearTimeout(timer);reject(new Error('Fixture exited before readiness: '+errors.join('').slice(-2000)));});child.stdout.on('data',data=>{text+=data.toString();if(text.includes('\n')){try{const message=JSON.parse(text.split('\n')[0]);clearTimeout(timer);resolve(message.port);}catch(error){clearTimeout(timer);reject(error);}}});});
   for(let i=0;i<100;i++){try{const r=await fetch(`http://127.0.0.1:${port}/fixture-health`);if(r.ok)return;}catch{}await delay(50);}
   throw new Error('Fixture readiness unavailable');
  },
  handle(req,res,pathname){
   if(!pathname.startsWith('/api/'))return false;
   if(pathname==='/api/v1/ai/translate')translations++;
   const upstream=http.request({host:'127.0.0.1',port,path:req.url,method:req.method,headers:{...req.headers,host:`127.0.0.1:${port}`}},response=>{
    if(pathname==='/api/v1/ai/translate')responsePolicies.push(response.headers['cache-control']);
    res.writeHead(response.statusCode,response.headers);response.pipe(res);
   });
   upstream.on('error',()=>{res.writeHead(503);res.end();});req.pipe(upstream);return true;
  },
  async check({cdp,base,navigate,results}){
   for(const width of [375,768]){
    await cdp.call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    await navigate(base+'/student/traductor.html?grade=4&modo=api');
    for(const [from,to,text,expected]of [['en','es','Hello world!','hola'],['es','en','El agua es importante.','water']]){
     const initial=translations;
     await cdp.evaluate(`document.querySelector('#source-language').value=${JSON.stringify(from)};document.querySelector('#target-language').value=${JSON.stringify(to)};document.querySelector('#source-input').value=${JSON.stringify(text)};document.querySelector('#source-input').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#do-translate').click();document.querySelector('#source-input').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',ctrlKey:true,bubbles:true}));`);
     let ready=false;
     for(let i=0;i<400;i++){await delay(50);ready=await cdp.evaluate(`!document.querySelector('#do-translate').disabled && Boolean(document.querySelector('#translation-output .result-word-card'))`);if(ready)break;}
     const snapshot=await cdp.evaluate(`({text:document.querySelector('#translation-output').innerText,overflow:document.documentElement.scrollWidth>innerWidth,options:[...document.querySelector('#source-language').options].map(option=>option.value)})`);
     assert.ok(ready,JSON.stringify(snapshot));assert.ok(snapshot.text.toLowerCase().includes(expected));assert.equal(snapshot.overflow,false);assert.deepEqual(snapshot.options.sort(),['en','es']);assert.equal(translations-initial,1,'Double submit does not start another translation');
     results.push({check:'argos-real-browser-translation-synthetic-policy',width,from,to,input:text,...snapshot,pass:true,scope:'Real model and HTTP/browser; authorization/policy/database doubled, not a real student session.'});
    }
   }
   await cdp.evaluate(`document.querySelector('#source-input').value='Hello world!';document.querySelector('#do-translate').click();document.querySelector('#clear-source').click();`);
   for(let i=0;i<400;i++){await delay(50);if(await cdp.evaluate("!document.querySelector('#do-translate').disabled"))break;}
   assert.equal(await cdp.evaluate("Boolean(document.querySelector('#translation-output .result-word-card'))"),false);
   await cdp.evaluate(`document.querySelector('#source-input').value='Hello world!';document.querySelector('#do-translate').click();import('/js/services/auth.service.js').then(module=>module.signOut()).catch(()=>{});`);
   await delay(3000);
   const cleared=await cdp.evaluate(`({text:document.querySelector('#source-input').value,output:document.querySelector('#translation-output').textContent,disabled:document.querySelector('#do-translate').disabled})`);
   assert.deepEqual(cleared,{text:'',output:'',disabled:true});
   assert.ok(responsePolicies.length>=4&&responsePolicies.every(value=>value==='private, no-store'));
   results.push({check:'argos-no-stale-results-after-clear-or-auth-reset',cleared,privateResponses:responsePolicies.length,pass:true,scope:'Synthetic auth reset only; not cross-account database isolation.'});
  },
  stop(){child?.kill();}
 };
};
