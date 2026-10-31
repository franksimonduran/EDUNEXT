// Static contracts + loopback smoke fixture. NOT a Docker/YAML/cloud deployment test.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),http=require('node:http');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const {evaluate}=require('../infra/scripts/check-release-gate.cjs');
const {generate}=require('../infra/scripts/prepare-local-env.cjs');
const {smoke}=require('../infra/scripts/smoke-test.cjs');
(async()=>{
 const results=[];
 async function check(name,fn){try{await fn();results.push({name,status:'pass'});}catch(e){results.push({name,status:'fail',message:e.message});}}
 await check('Production and staging gates deny current repository state',()=>{
  const gate=JSON.parse(read('infra/release-gate.json'));assert.equal(evaluate(gate,'production').eligible,false);assert.equal(evaluate(gate,'staging').eligible,false);
  assert.match(read('docs/PHASE_48_ACCEPTANCE.md'),/BLOQUEADA/);
 });
 await check('Gate requires boolean approvals and immutable digest',()=>{
  const gate=JSON.parse(read('infra/release-gate.json'));
  for(const key of Object.keys(gate))if(typeof gate[key]==='boolean')gate[key]=true;
  assert.equal(evaluate(gate,'production').eligible,false);
  gate.imageDigest='sha256:'+'a'.repeat(64);assert.equal(evaluate(gate,'production').eligible,true);
  gate.phase48Accepted='true';assert.equal(evaluate(gate,'production').eligible,false);
 });
 await check('New local secret generation is independent and does not write files in tests',()=>{
  const values=Object.values(generate());assert.equal(values.length,5);assert.equal(new Set(values).size,5);assert(values.every(v=>/^[a-f0-9]{64}$/.test(v)));
  assert.match(read('infra/scripts/prepare-local-env.cjs'),/flag:'wx'/);
 });
 await check('Compose source has private DB persistence and loopback-only web publishing',()=>{
  const compose=read('docker-compose.yml'),db=compose.split('  db:')[1].split('  api:')[0];
  assert(!/\bports:/.test(db));assert.match(db,/postgres_data:\/var\/lib\/postgresql\/data/);assert.match(compose,/127\.0\.0\.1:8080:8080/);assert.match(compose,/internal: true/);
  const api=compose.split('  api:')[1].split('  migrate:')[0];assert(!api.includes('alembic'));assert(!api.includes('PG_ADMIN_PASSWORD'));assert(!api.includes('PG_MIGRATION_PASSWORD'));
 });
 await check('Release Docker build defaults to hashed lock and nonroot; dictionary packaged',()=>{
  const docker=read('backend/Dockerfile');assert.match(docker,/ARG REQUIRE_LOCK=true/);assert.match(docker,/--require-hashes/);assert.match(docker,/USER 10001:10001/);assert.match(docker,/dictionary-demo\.data\.js/);assert.match(read('.dockerignore'),/\*\*\/\.env/);
  assert(docker.includes('ProxyHandler({})'));assert(docker.includes('settings.TRUSTED_HOSTS'));
  const images=JSON.parse(read('infra/base-images.json')).images;
  for(const [index,file] of [[0,'backend/Dockerfile'],[1,'infra/docker/frontend.Dockerfile'],[2,'docker-compose.yml']])assert(read(file).includes(images[index].image+'@'+images[index].indexDigest));
 });
 await check('Proxy source includes same-origin API and restrictive headers',()=>{
  const nginx=read('infra/docker/nginx.conf');assert.match(nginx,/proxy_pass http:\/\/api:8000/);assert.match(nginx,/script-src 'self'/);assert.match(nginx,/X-Content-Type-Options nosniff/);assert.match(nginx,/autoindex off/);
 });
 await check('PWA manifest is valid JSON with existing local icon and login entry',()=>{
  const manifest=JSON.parse(read('frontend/manifest.webmanifest'));assert.equal(manifest.scope,'/');assert.equal(manifest.start_url,'/login.html');assert(fs.existsSync(path.join(root,'frontend',manifest.icons[0].src)));
  assert.match(read('frontend/login.html'),/rel="manifest"/);
 });
 await check('Workflows are read-only and contain no registry push or cloud deploy command',()=>{
  for(const file of fs.readdirSync(path.join(root,'.github/workflows'))){const source=read('.github/workflows/'+file);assert.match(source,/contents: read/);assert(!source.includes('pull_request_target'));assert(!/docker push|kubectl apply|terraform apply|ssh\s/.test(source));}
  assert.match(read('.github/workflows/promotion-check.yml'),/workflow_dispatch/);
 });
 await check('Backup source encrypts and restore refuses non-empty targets without cleaning',()=>{
  const source=read('infra/backups/postgres_backup.py');assert.match(source,/"--encrypt"/);assert.match(source,/_restore_test/);assert.match(source,/target\["objects"\] != 0/);assert(!source.includes('"--clean"'));assert(!/DROP DATABASE|DROP TABLE/.test(source));
 });
 await check('Smoke helper accepts loopback fixture and rejects remote targets and readiness 503',async()=>{
  let ready=true;
  const server=http.createServer((req,res)=>{
   if(req.url.endsWith('/ready')&&!ready){res.writeHead(503);return res.end('{"status":"not_ready"}');}
   res.writeHead(200,{'Content-Type':'application/json'});
   res.end(req.url.endsWith('/ready')?'{"status":"ready"}':req.url.endsWith('/live')?'{"status":"alive"}':req.url.endsWith('webmanifest')?'{"scope":"/"}':'fixture');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{const base=`http://127.0.0.1:${server.address().port}`;assert.equal((await smoke(base)).length,5);ready=false;await assert.rejects(smoke(base));await assert.rejects(smoke('https://example.invalid'));}
  finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
 });
 const tools={};for(const command of ['docker','python','git','pg_dump','age']){const r=spawnSync(command,['--version'],{encoding:'utf8',timeout:10000});tools[command]={exitCode:r.status,available:r.status===0,error:r.error?.code};}
 const evidence={date:new Date().toISOString(),node:process.version,scope:'Static text/JSON contracts and a synthetic loopback HTTP fixture, NOT YAML parse, Docker build, real API, backup, staging or deployment.',results,tools,releaseLockPresent:fs.existsSync(path.join(root,'backend/requirements.lock')),notExecuted:['Docker build/Compose/nginx -t','Python/FastAPI/PostgreSQL/Alembic','CI on GitHub','Staging/cloud/DNS/HTTPS','Backup/restoration','Real PWA install/update/Sync/AI']};
 require('../tools/final-evidence.cjs').saveEvidence('INFRA_CONTRACTS.json','docs/PHASE_49_TEST_EVIDENCE.json',evidence);console.log(JSON.stringify(evidence,null,2));
 if(results.some(r=>r.status!=='pass'))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
