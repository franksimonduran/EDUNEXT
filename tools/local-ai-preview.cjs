'use strict';
// Explicit single-user EDUNEXT development preview. Never expose to a LAN or production.
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {createDemoServer}=require('./demo-server.cjs');
const root=path.resolve(__dirname,'..');
const endpoint='/__edunext_local/';
const privatePattern=/[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?\d[\s.-]*){8,}|https?:\/\//i;

function runtimeFor(projectRoot=root){
 const models=path.join(projectRoot,'backend','.local','argos-en-es');
 if(!fs.existsSync(path.join(models,'model-set.json')))return null;
 const candidates=[];
 const saved=path.join(projectRoot,'backend','.local','argos-runtime.json');
 if(fs.existsSync(saved)){
  try{const value=JSON.parse(fs.readFileSync(saved,'utf8')).python_executable;
   if(typeof value==='string'&&path.isAbsolute(value))candidates.push(value);
  }catch{}
 }
 candidates.push(path.join(projectRoot,'backend','.local','venv','Scripts','python.exe'));
 candidates.push(path.join(projectRoot,'backend','.local','venv','bin','python'));
 const python=candidates.find(candidate=>fs.existsSync(candidate)&&fs.statSync(candidate).isFile());
 return python?{python,models}:null;
}

async function runArgos({text,source_language,target_language},projectRoot=root){
 const runtime=runtimeFor(projectRoot);
 if(!runtime)throw new Error('MODELS_UNAVAILABLE');
 const script=path.join(projectRoot,'backend','scripts','translate_local.py');
 const env={PYTHONUTF8:'1',PYTHONIOENCODING:'utf-8'};
 for(const key of ['SystemRoot','WINDIR','PATH','TEMP','TMP','USERPROFILE','HOME','APPDATA','LOCALAPPDATA']){
  if(process.env[key])env[key]=process.env[key];
 }
 return await new Promise((resolve,reject)=>{
  const child=spawn(runtime.python,['-X','utf8',script,'--packages-dir',runtime.models,'--from',source_language,'--to',target_language],
    {cwd:projectRoot,env,stdio:['pipe','pipe','ignore'],windowsHide:true});
  let output='',done=false;
  const finish=(error,value)=>{if(done)return;done=true;clearTimeout(timer);if(error)reject(error);else resolve(value);};
  const timer=setTimeout(()=>{child.kill();finish(new Error('TRANSLATION_TIMEOUT'));},90000);
  child.on('error',()=>finish(new Error('TRANSLATION_UNAVAILABLE')));
  child.stdout.setEncoding('utf8');
  child.stdout.on('data',chunk=>{output+=chunk;if(output.length>6500){child.kill();finish(new Error('INVALID_OUTPUT'));}});
  child.on('close',code=>{const value=output.trim();if(code===0&&value&&value.length<=6000)finish(null,value);else finish(new Error('TRANSLATION_UNAVAILABLE'));});
  child.stdin.on('error',()=>{});
  child.stdin.end(text);
 });
}

function createLocalPreviewHandler({getOrigin,available=()=>Boolean(runtimeFor()),translate=payload=>runArgos(payload)}={}){
 if(typeof getOrigin!=='function')throw new TypeError('An explicit loopback origin is required');
 const token=crypto.randomBytes(32).toString('hex');
 let busy=false;
 const respond=(res,code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(JSON.stringify(data));};
 return (req,res)=>{
  let pathname;
  try{pathname=new URL(req.url,'http://127.0.0.1').pathname;}catch{return false;}
  if(!pathname.startsWith(endpoint))return false;
  const origin=getOrigin();
  if(req.headers.host!==new URL(origin).host||new URL(origin).hostname!=='127.0.0.1'
      ||(req.headers.origin&&req.headers.origin!==origin)
      ||(req.headers['sec-fetch-site']&&!['same-origin','none'].includes(req.headers['sec-fetch-site']))){
   respond(res,403,{error:'ORIGIN_REJECTED'});return true;
  }
  if(pathname===endpoint+'status'&&req.method==='GET'){
   const ready=available();
   respond(res,200,{mode:'local_preview',available:ready,token:ready?token:null,pairs:ready?['es-en','en-es']:[]});
   return true;
  }
  if(pathname!==endpoint+'translate'||req.method!=='POST'){
   respond(res,405,{error:'NOT_ALLOWED'});return true;
  }
  if(!available()){respond(res,503,{error:'MODELS_UNAVAILABLE'});return true;}
  if(req.headers['x-edunext-preview-token']!==token
     ||!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json')){
   respond(res,403,{error:'PREVIEW_TOKEN_REQUIRED'});return true;
  }
  if(busy){respond(res,429,{error:'PREVIEW_BUSY'});return true;}
  busy=true;
  (async()=>{
   try{
    let raw='';
    for await(const chunk of req){
     raw+=chunk.toString('utf8');
     if(Buffer.byteLength(raw,'utf8')>4096)throw new Error('INVALID_INPUT');
    }
    let data;
    try{data=JSON.parse(raw);}catch{throw new Error('INVALID_INPUT');}
    const text=data?.text,from=data?.source_language,to=data?.target_language;
    if(typeof text!=='string'||text.length<1||text.length>300||!text.trim()||privatePattern.test(text)
       ||!['es','en'].includes(from)||!['es','en'].includes(to)||from===to){
     throw new Error('INVALID_INPUT');
    }
    const result=await translate({text:text.trim(),source_language:from,target_language:to});
    if(typeof result!=='string'||!result.trim()||result.length>6000)throw new Error('INVALID_OUTPUT');
    respond(res,200,{mode:'local_preview',text:result.trim(),warning:'Modelo local experimental. Verifica la traducción; no es una evaluación académica.'});
   }catch(error){
    const badInput=['INVALID_INPUT'].includes(error.message);
    respond(res,badInput?400:503,{error:badInput?'INVALID_INPUT':'TRANSLATION_UNAVAILABLE'});
   }finally{busy=false;}
  })();
  return true;
 };
}
function startLocalPreview(port=8080){
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Puerto inválido');
 const origin='http://127.0.0.1:'+port;
 const server=createDemoServer({handler:createLocalPreviewHandler({getOrigin:()=>origin})});
 server.on('error',error=>{console.error('EDUNEXT local:',error.message);process.exitCode=1;});
 server.listen(port,'127.0.0.1',()=>{
  console.log('EDUNEXT local (solo equipo propio): '+origin+'/student/tutor.html?grade=4&modo=local');
  console.log('Traductor Argos local: '+origin+'/student/traductor.html?grade=4&modo=local');
  console.log('Sin nube, sin PostgreSQL y sin acceso desde la red. No utilizar con datos personales.');
  if(!runtimeFor())console.log('Argos no instalado: revisa docs/LOCAL_AI_TRANSLATE_PREVIEW.md');
 });
 return server;
}
if(require.main===module){
 const flag=process.argv.indexOf('--port');
 startLocalPreview(flag<0?8080:Number(process.argv[flag+1]));
}
module.exports={createLocalPreviewHandler,startLocalPreview,runtimeFor,runArgos};
