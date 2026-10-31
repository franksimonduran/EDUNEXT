// Read-only source guard, NOT a migration execution or deployment approval.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {saveFinalEvidence}=require('../tools/final-evidence.cjs');
const root=path.resolve(__dirname,'..'),directory=path.join(root,'backend/alembic/versions');
const revisions=fs.readdirSync(directory).filter(file=>file.endsWith('.py')).map(file=>{
 const source=fs.readFileSync(path.join(directory,file),'utf8');
 const revision=source.match(/^revision(?:\s*:[^=]+)?\s*=\s*["']([^"']+)["']/m)?.[1];
 const parent=source.match(/^down_revision(?:\s*:[^=]+)?\s*=\s*["']([^"']+)["']/m)?.[1];
 assert(revision,'Unsupported revision declaration: '+file);return {file,revision,parent};
});
const referenced=new Set(revisions.map(r=>r.parent).filter(Boolean));
const heads=revisions.filter(r=>!referenced.has(r.revision)).map(r=>r.revision);
assert.equal(heads.length,1,'Single migration head required; branching must be reviewed');
const compose=fs.readFileSync(path.join(root,'docker-compose.yml'),'utf8');
assert.equal(compose.match(/EXPECTED_ALEMBIC_REVISION:\s*([^\s]+)/)?.[1],heads[0]);
const gate=JSON.parse(fs.readFileSync(path.join(root,'infra/release-gate.json'),'utf8'));
assert.equal(gate.productionDeploymentAuthorized,false);
assert.equal(gate.stagingDeploymentAuthorized,false);
const report={date:new Date().toISOString(),pass:true,migrationHead:heads[0],migrations:revisions.length,
 scope:'Source alignment only. No DB connection, Alembic upgrade, Docker build or release authorization.',
 hashes:{compose:crypto.createHash('sha256').update(compose).digest('hex')}};
if(process.env.AITHRON_FINAL_VALIDATION==='1')saveFinalEvidence('DEPLOYMENT_READINESS_SOURCE.json',report);
console.log(JSON.stringify(report,null,2));
