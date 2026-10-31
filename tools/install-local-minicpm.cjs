// Explicit, pinned public model/runtime installation; no npm scripts, cloud inference or silent overwrites.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const {Readable}=require('node:stream'),{pipeline}=require('node:stream/promises');
const root=path.resolve(__dirname,'..');
const MODEL='MiniCPM5-2B-Q4_K_M-GGUF';
const MODEL_REVISION='2079a22f3beaa4e306449978533478fe0522f4b3';
const BASE_MODEL='openbmb/MiniCPM5-2B';
const BASE_REVISION='f97400052a43d642bbc6e9975e2397e3ae6a6b52';
const GGUF='MiniCPM5-2B-Q4_K_M.gguf';
const GGUF_BYTES=1561318368;
const GGUF_SHA256='ec2d5801640099e97d8d7e8003ad4d81f336e757811f03a26173dddf386602fd';
const RUNTIME_VERSION='3.8.1';
const RUNTIME_TARBALL='https://registry.npmjs.org/@wllama/wllama/-/wllama-3.8.1.tgz';
const RUNTIME_INTEGRITY='sha512-Pl7BEJhPU8OHnV/yhn3DFZYhLLOdSHh+4TND79WCftHnlUAdQPAsyc/CfIOY+4mVxvf5VW3Xw3Uf7BBfotS1gw==';
const RUNTIME_SHA256='e5506753e41a59c11f61f2c52422045be9fc76e32a7e47f037aaad5df4ec723e';
const RUNTIME_WASM_SHA256='551f13439366eff11e057b1b91fe46a7fdac29d56d67372d4c5f19a549dfe70c';
const MODEL_URL=`https://huggingface.co/openbmb/MiniCPM5-2B-GGUF/resolve/${MODEL_REVISION}/${GGUF}`;
const TEMPLATE_URL=`https://huggingface.co/${BASE_MODEL}/raw/${BASE_REVISION}/chat_template.jinja`;
const LICENSE_URL='https://www.apache.org/licenses/LICENSE-2.0.txt';
const modelDir=path.join(root,'frontend/assets/models/minicpm5-2b-gguf');
const vendorDir=path.join(root,'frontend/js/vendor/wllama');
const receiptFile=path.join(modelDir,'EDUNEXT_INSTALL.json');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
async function shaFile(file){return new Promise((resolve,reject)=>{const hash=crypto.createHash('sha256');fs.createReadStream(file).on('error',reject).on('data',chunk=>hash.update(chunk)).on('end',()=>resolve(hash.digest('hex')));});}
function readJSON(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
async function fetchBytes(url,max=16*1024*1024){
 const response=await fetch(url,{signal:AbortSignal.timeout(180000),headers:{'User-Agent':'EDUNEXT-internal-model-installer/1.0'}});
 if(!response.ok)throw new Error('Download failed: '+response.status+' '+new URL(url).pathname);
 const chunks=[];let size=0;
 for await(const chunk of response.body){size+=chunk.length;if(size>max)throw new Error('Download size exceeded');chunks.push(chunk);}
 return Buffer.concat(chunks);
}
async function downloadFile(url,target,expectedBytes,expectedHash){
 const response=await fetch(url,{signal:AbortSignal.timeout(900000),headers:{'User-Agent':'EDUNEXT-internal-model-installer/1.0'}});
 if(!response.ok)throw new Error('Download failed: '+response.status+' '+new URL(url).pathname);
 const staging=target+'.installing';
 await pipeline(Readable.fromWeb(response.body),fs.createWriteStream(staging,{flags:'wx'}));
 const bytes=fs.statSync(staging).size;
 if(bytes!==expectedBytes)throw new Error('Size mismatch for '+path.basename(target)+': '+bytes);
 if(await shaFile(staging)!==expectedHash)throw new Error('Hash mismatch for '+path.basename(target));
 fs.renameSync(staging,target);
}
function tarFiles(archive,names){
 const tar=zlib.gunzipSync(archive,{maxOutputLength:64*1024*1024}),files=new Map();
 for(let offset=0;offset+512<=tar.length;){
  const header=tar.subarray(offset,offset+512),name=header.subarray(0,100).toString().replace(/\0.*$/s,'');
  if(!name)break;
  const size=parseInt(header.subarray(124,136).toString().replace(/\0.*$/s,'').trim()||'0',8);
  if(!Number.isSafeInteger(size)||size<0||offset+512+size>tar.length)throw new Error('Invalid npm tar archive');
  if(names.includes(name))files.set(name,tar.subarray(offset+512,offset+512+size));
  offset+=512+Math.ceil(size/512)*512;
 }
 return files;
}
async function verify(){
 const receipt=readJSON(receiptFile);
 if(receipt.model_id!==MODEL||receipt.model_revision!==MODEL_REVISION||receipt.base_model_id!==BASE_MODEL||receipt.base_model_revision!==BASE_REVISION)throw new Error('Model revision mismatch');
 if(receipt.runtime_version!==`wllama/${RUNTIME_VERSION}`||receipt.npm_integrity!==RUNTIME_INTEGRITY)throw new Error('Runtime revision mismatch');
 for(const record of receipt.files){
  if(!/^(?:[A-Za-z0-9_.-]+)$/.test(record.path))throw new Error('Invalid receipt path');
  const target=path.join(modelDir,record.path);
  if(!fs.existsSync(target))throw new Error('Missing installed resource: '+record.path);
  const actual=await shaFile(target);if(actual!==record.sha256)throw new Error('Installed model hash mismatch: '+record.path);
 }
 for(const [name,expected] of Object.entries({ 'index.js':RUNTIME_SHA256,'wllama.wasm':RUNTIME_WASM_SHA256 })){
  const target=path.join(vendorDir,name);if(!fs.existsSync(target))throw new Error('Missing runtime: '+name);
  if(await shaFile(target)!==expected)throw new Error('Installed runtime hash mismatch: '+name);
 }
 for(const name of ['LICENSE','PROVENANCE.json'])if(!fs.existsSync(path.join(vendorDir,name)))throw new Error('Missing runtime licence/provenance: '+name);
 if(!fs.existsSync(path.join(modelDir,'PROVENANCE.json')))throw new Error('Missing model provenance');
 console.log('Verified '+receipt.files.length+' model resources, wllama '+RUNTIME_VERSION+' and licence/provenance. No network access or inference approval.');
}
async function install(){
 if(!process.argv.includes('--download'))throw new Error('Use --download to explicitly allow runtime/model downloads, or --verify to check installed files.');
 fs.mkdirSync(modelDir,{recursive:true});fs.mkdirSync(vendorDir,{recursive:true});
 const ggufTarget=path.join(modelDir,GGUF);
 if(fs.existsSync(ggufTarget)){
  if(fs.statSync(ggufTarget).size!==GGUF_BYTES||await shaFile(ggufTarget)!==GGUF_SHA256)throw new Error('Existing GGUF differs from pinned revision; review it manually instead of overwriting.');
  console.log('GGUF already present and verified.');
 }else{
  console.log('Downloading pinned GGUF (1.5 GB)…');
  await downloadFile(MODEL_URL,ggufTarget,GGUF_BYTES,GGUF_SHA256);
 }
 const provenance=path.join(vendorDir,'PROVENANCE.json'),licenceTarget=path.join(vendorDir,'LICENSE');
 let needRuntime=false;
 for(const [name,expected] of Object.entries({'index.js':RUNTIME_SHA256,'wllama.wasm':RUNTIME_WASM_SHA256})){
  const target=path.join(vendorDir,name);
  if(fs.existsSync(target)){if(await shaFile(target)!==expected)throw new Error('Existing runtime differs: '+name);continue;}
  needRuntime=true;
 }
 if(needRuntime||!fs.existsSync(licenceTarget)||!fs.existsSync(provenance)){
  console.log('Downloading wllama '+RUNTIME_VERSION+'…');
  const archive=await fetchBytes(RUNTIME_TARBALL,16*1024*1024);
  if('sha512-'+crypto.createHash('sha512').update(archive).digest('base64')!==RUNTIME_INTEGRITY)throw new Error('npm archive integrity mismatch');
  const bundled=tarFiles(archive,['package/esm/index.js','package/esm/wasm/wllama.wasm','package/LICENCE']);
  const runtime=bundled.get('package/esm/index.js'),wasm=bundled.get('package/esm/wasm/wllama.wasm'),licence=bundled.get('package/LICENCE');
  if(!runtime||!wasm||!licence)throw new Error('Missing wllama runtime, wasm or licence');
  if(/^\s*import\s/m.test(runtime.toString()))throw new Error('Runtime is not self-contained');
  if(sha(runtime)!==RUNTIME_SHA256||sha(wasm)!==RUNTIME_WASM_SHA256)throw new Error('Extracted runtime hash mismatch');
  for(const [name,content,hash] of [['index.js',runtime,RUNTIME_SHA256],['wllama.wasm',wasm,RUNTIME_WASM_SHA256],['LICENSE',licence,null]]){
   const target=path.join(vendorDir,name);
   if(fs.existsSync(target)){if(hash&&await shaFile(target)!==hash)throw new Error('Existing runtime differs: '+name);continue;}
   fs.writeFileSync(target,content,{flag:'wx'});
  }
  if(!fs.existsSync(provenance))fs.writeFileSync(provenance,JSON.stringify({package:'@wllama/wllama',version:RUNTIME_VERSION,source:RUNTIME_TARBALL,integrity:RUNTIME_INTEGRITY,license:'MIT',files:[{path:'index.js',source:'package/esm/index.js',sha256:RUNTIME_SHA256},{path:'wllama.wasm',source:'package/esm/wasm/wllama.wasm',sha256:RUNTIME_WASM_SHA256}],notes:'Vendored for same-origin opt-in browser inference only.'},null,2)+'\n',{flag:'wx'});
 }
 const small={ 'chat_template.jinja':{url:TEMPLATE_URL,bytes:5435,sha256:'bc1f78ef8a86b6bdf64a056cf89dd0ac506db4f198ab363d85168e2500ab44dd'},'LICENSE-APACHE-2.0.txt':{url:LICENSE_URL,bytes:11358,sha256:'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30'} };
 for(const [name,meta] of Object.entries(small)){
  const target=path.join(modelDir,name);
  if(fs.existsSync(target)){if(await shaFile(target)!==meta.sha256)throw new Error('Existing licence/template differs: '+name);continue;}
  const content=await fetchBytes(meta.url,64*1024);
  if(content.length!==meta.bytes||sha(content)!==meta.sha256)throw new Error('Pinned resource mismatch: '+name);
  fs.writeFileSync(target,content,{flag:'wx'});
 }
 const receipt={date:new Date().toISOString(),model_id:MODEL,model_revision:MODEL_REVISION,base_model_id:BASE_MODEL,base_model_revision:BASE_REVISION,library:'wllama',runtime_version:`wllama/${RUNTIME_VERSION}`,npm_integrity:RUNTIME_INTEGRITY,runtime_sha256:RUNTIME_SHA256,runtime_wasm_sha256:RUNTIME_WASM_SHA256,license:'Apache-2.0',files:[{path:GGUF,bytes:GGUF_BYTES,sha256:GGUF_SHA256},{path:'chat_template.jinja',bytes:5435,sha256:'bc1f78ef8a86b6bdf64a056cf89dd0ac506db4f198ab363d85168e2500ab44dd'},{path:'LICENSE-APACHE-2.0.txt',bytes:11358,sha256:'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30'}],scope:'Internal GGUF model and wllama runtime for the opt-in local tutor; not GPU, pedagogical, Android or release acceptance.'};
 if(fs.existsSync(receiptFile)){const current=readJSON(receiptFile);if(JSON.stringify(current.files)!==JSON.stringify(receipt.files)||current.model_revision!==MODEL_REVISION||current.runtime_version!==receipt.runtime_version)throw new Error('Existing receipt differs; review it manually instead of overwriting.');}
 else fs.writeFileSync(receiptFile,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
 console.log('Installed '+MODEL+' with wllama '+RUNTIME_VERSION+'. Browser loading remains opt-in and unverified by this script.');
}
(process.argv.includes('--verify')?verify():install()).catch(error=>{console.error(error.message);console.error('No prior resources were overwritten. Review any .installing files before retrying.');process.exitCode=1;});
