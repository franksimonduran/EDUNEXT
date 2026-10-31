// Local read-only inspection, excluding private environment files and binaries.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),os=require('node:os');
const root=path.resolve(__dirname,'..');
const mode=process.argv[2];
if(!['baseline','after'].includes(mode))throw new Error('Usage: node tools/audit-phase48.cjs baseline|after');
const fresh=process.argv.includes('--fresh')||process.env.AITHRON_FINAL_VALIDATION==='1';
const output=fresh?fs.mkdtempSync(path.join(root,`docs/final/evidence/phase48-${mode}-`)):path.join(root,'docs');
if(!fresh && mode==='baseline' && fs.existsSync(path.join(root,'docs/PHASE_48_BASELINE_EVIDENCE.json'))){
 throw new Error('Baseline already recorded; preserve it and use after for subsequent snapshots.');
}
function walk(dir){return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>{
  const p=path.posix.join(dir,e.name);
  if(e.isSymbolicLink())return [];
  if(e.isDirectory())return ['.git','.venv','venv','build','dist','__pycache__','.pytest_cache','node_modules'].includes(e.name)||e.name.endsWith('.egg-info')?[]:walk(p);
  return /\.(py|js|cjs|html|css|toml|ini|json|ya?ml|webmanifest)$/.test(e.name)?[p]:[];
});}
const files=walk('.').filter(p=>!p.startsWith('docs/'));
const candidates=[];
const rules={dom_sink:/\.innerHTML\s*=|insertAdjacentHTML\(/,sql_text:/\btext\(f["']|execute\(f["']/,command:/shell\s*=\s*True|os\.system\(/,local_token:/localStorage\.setItem\([^\n]*(?:token|jwt)/i,private_key:/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,credential_literal:/(?:password|secret_key|api_key)\s*[:=]\s*['"][^'"\n]{16,}['"]/i};
const sources=files.map(file=>{const data=fs.readFileSync(path.join(root,file));const text=data.toString('utf8');text.split(/\r?\n/).forEach((line,i)=>{for(const [rule,re] of Object.entries(rules))if(re.test(line))candidates.push({rule,file,line:i+1,classification:'Candidate only; requires source and context review. Value omitted.'});});return {file,bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')};});
const frontend=sources.filter(s=>s.file.startsWith('frontend/'));
const artifacts=walk('frontend/assets').map(p=>({file:p,bytes:fs.statSync(path.join(root,p)).size}));
const evidence={date:new Date().toISOString(),mode,scope:'Static source inspection, not a vulnerability scanner or performance test',environment:{node:process.version,platform:process.platform,architecture:process.arch,logicalCpus:os.cpus().length,totalMemoryBytes:os.totalmem()},gitMetadata:fs.existsSync(path.join(root,'.git')),missing:['AGENTS.md','PROJECT_STRUCTURE.md','.gitignore','.github','database','content','scripts','docker-compose.yml','compose.yaml'].filter(p=>!fs.existsSync(path.join(root,p))),sources,candidates,frontend:{sourceBytes:frontend.reduce((n,s)=>n+s.bytes,0),largestSources:frontend.sort((a,b)=>b.bytes-a.bytes).slice(0,15),note:'Source sizes only; not transfer size, LCP/INP/CLS or CPU/memory measurement'},assetTextFiles:artifacts,dependencies:fs.readFileSync(path.join(root,'backend/pyproject.toml'),'utf8').match(/^\s*"[^"\n]+(?:>=|==)[^"\n]+"/gm)||[],manifests:files.filter(p=>/manifest.*\.(json|webmanifest)$/.test(p)),exclusions:['.env and secrets values not output','No network, advisory database query, database connection, browser, load or active injection']};
const destination=path.join(output,`PHASE_48_${mode.toUpperCase()}_EVIDENCE.json`);
fs.writeFileSync(destination,JSON.stringify(evidence,null,2)+'\n',{flag:fresh?'wx':'w'});
console.log(JSON.stringify({mode,evidence:path.relative(root,destination),sourceFiles:sources.length,candidates:candidates.length,node:process.version,gitMetadata:evidence.gitMetadata,missing:evidence.missing}));
