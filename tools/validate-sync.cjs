// Evidence only: no backend imports, database connections or destructive fixtures.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
if(process.env.AITHRON_FINAL_VALIDATION!=='1')throw Error('AITHRON_FINAL_VALIDATION=1 required');
const python=process.argv[2];if(!python)throw Error('Pass the explicit Python executable as the first argument');
const root=path.resolve(__dirname,'..');
const paths=[
 'backend/app/schemas/sync.py','backend/app/db/models/sync_receipt.py','backend/app/db/models/__init__.py',
 'backend/alembic/versions/20261026_phase46_sync_receipts.py','backend/app/repositories/sync_repository.py',
 'backend/app/services/sync_service.py','backend/app/api/v1/endpoints/sync.py','backend/app/api/v1/router.py',
 'backend/app/core/config.py','backend/app/core/ai_middleware.py','backend/app/main.py',
 'backend/verification/test_sync_contract.py','frontend/js/offline/database-schema.js',
 'frontend/js/sync/protocol.js','frontend/js/services/sync-api.service.js','frontend/js/offline/confirmed-sync.js',
 'frontend/js/student/synchronization.js','tests/sync-protocol.cjs','tools/validate-sync.cjs',
];
const run=(command,args,options={})=>{const r=spawnSync(command,args,{cwd:root,encoding:'utf8',timeout:120000,...options});
 return {exit_code:r.status,output:(r.stdout||'')+(r.stderr||''),error:r.error?.message};};
const tests=run(process.execPath,['--experimental-vm-modules','tests/sync-protocol.cjs']);
const sw=run(process.execPath,['tests/phase48-security.cjs']);
const ast=run(python,['-c',"import ast,pathlib,sys; [ast.parse(pathlib.Path(p).read_text(encoding='utf-8-sig')) for p in sys.argv[1:]]; print('Python AST passed')",...paths.filter(p=>p.endsWith('.py'))]);
const contract=run(python,['-m','unittest','discover','-s','verification','-p','test_sync_contract.py','-v'],{cwd:path.join(root,'backend')});
const syntax=paths.filter(p=>p.endsWith('.js')||p.endsWith('.cjs')).map(p=>({path:p,
 ...run(process.execPath,p.endsWith('.js')?['--input-type=module','--check']:['--check'],{input:fs.readFileSync(path.join(root,p),'utf8')})}));
const evidence={generated_at:new Date().toISOString(),AITHRON_FINAL_VALIDATION:1,
 scope:'Synthetic protocol/storage doubles, source, syntax and existing SW VM checks; no real DB/browser/provider.',
 protocol:tests,service_worker_regression:sw,python_ast:ast,python_contract:contract,syntax,
 hashes:paths.map(p=>({path:p,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex')}))};
const output=path.join('docs','final','evidence',`sync-${Date.now()}.json`);
fs.writeFileSync(path.join(root,output),JSON.stringify(evidence,null,2),{flag:'wx'});
console.log(output);console.log(JSON.stringify({protocol:tests.exit_code,sw:sw.exit_code,ast:ast.exit_code,contract:contract.exit_code,syntax:syntax.every(r=>r.exit_code===0)}));
process.exitCode=[tests,sw,ast,contract,...syntax].every(r=>r.exit_code===0)?0:1;
