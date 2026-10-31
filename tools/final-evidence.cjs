// Keep frozen candidate evidence immutable; later runs get their own namespace.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
let selected;
function evidenceDirectory(){
 if(selected)return selected;
 const frozen=fs.existsSync(path.join(root,'docs/final/FINAL_CANDIDATE_MANIFEST.json'));
 const value=process.env.AITHRON_FINAL_EVIDENCE_DIR||('docs/final/evidence'+(frozen?'/revalidation-'+Date.now()+'-'+process.pid:''));
 if(!/^docs\/final\/evidence(?:\/[A-Za-z0-9_-]+)*$/.test(value))throw new Error('Final evidence must stay in an explicit safe evidence namespace');
 if(frozen&&value==='docs/final/evidence')throw new Error('Frozen evidence must not be overwritten; use a new validation namespace');
 selected=value;return selected;
}
function saveFinalEvidence(name,evidence){
 if(!/^[A-Z0-9_]+\.json$/.test(name))throw new Error('Invalid evidence filename');
 const file=path.join(root,evidenceDirectory(),name),frozen=fs.existsSync(path.join(root,'docs/final/FINAL_CANDIDATE_MANIFEST.json'));
 fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(evidence,null,2)+'\n',{flag:frozen?'wx':'w'});return file;
}
function saveEvidence(name,historical,evidence){
 if(process.env.AITHRON_FINAL_VALIDATION==='1')return saveFinalEvidence(name,evidence);
 const file=path.join(root,historical);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(evidence,null,2)+'\n');return file;
}
module.exports={evidenceDirectory,saveEvidence,saveFinalEvidence};
