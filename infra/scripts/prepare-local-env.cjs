// New synthetic development secrets only. Does not read/overwrite existing .env.
const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
function generate(){return Object.fromEntries(['PG_ADMIN_PASSWORD','PG_APP_PASSWORD','PG_MIGRATION_PASSWORD','SECRET_KEY','CSRF_SECRET_KEY'].map(key=>[key,crypto.randomBytes(32).toString('hex')]));}
module.exports={generate};
if(require.main===module){
 const output=path.join(__dirname,'../environments/development/.env');
 try{
  const values=generate();
  fs.writeFileSync(output,Object.entries(values).map(([k,v])=>`${k}=${v}`).join('\n')+'\nBUILD_REVISION=local-dev\n',{flag:'wx',mode:0o600});
  console.log('Created a NEW ignored local development environment file; secret values withheld. Review Windows ACLs before use.');
 }catch{console.error('Environment not created; existing files are never overwritten.');process.exitCode=1;}
}
