const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../frontend');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
function audit(){
 const files=walk(root),failures=[],optional=[];let references=0;
 for(const file of files.filter(f=>/\.(html|js)$/.test(f)&&!f.includes(path.sep+'vendor'+path.sep))){
  const text=fs.readFileSync(file,'utf8'),html=file.endsWith('.html');
  const re=html?/(?:href|src)=["']([^"']+)["']/g:/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["']([^"']+)["']/g;
  for(const m of text.matchAll(re)){
   const url=m[1];if(/^(?:[a-z]+:|\/\/|#)/i.test(url)||(!html&&!url.startsWith('.')))continue;
   references++;let target=path.resolve(html&&url.startsWith('/')?root:path.dirname(file),decodeURIComponent(url.split(/[?#]/)[0]).replace(/^\//,''));
   const relative='/'+path.relative(root,target).replaceAll('\\','/');
   const alias=require('./demo-server.cjs').aliases[relative];
   if(alias)target=path.join(root,alias);
    if(!fs.existsSync(target)){
     const entry={file:path.relative(root,file),reference:url};
     failures.push(entry);
    }
  }
  if(!html&&/\brequire\s*\(/.test(text))failures.push({file:path.relative(root,file),reason:'require en módulo de navegador'});
 }
 const hashes=Object.fromEntries(files.filter(f=>/\.(html|js|css|png)$/.test(f)).map(f=>[path.relative(root,f),crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
 return {scope:'Análisis estático; no demuestra ejecución ni backend',references,failures,optional,hashes};
}
if(require.main===module){const result=audit();console.log(JSON.stringify({...result,hashes:`${Object.keys(result.hashes).length} hashes`},null,2));if(process.env.AITHRON_FINAL_VALIDATION==='1')console.log(require('./final-evidence.cjs').saveFinalEvidence('DEMO_AUDIT.json',result));if(result.failures.length)process.exitCode=1;}
module.exports={audit};
