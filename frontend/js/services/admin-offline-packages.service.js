import { listPackages, getPackage } from '../offline/package-manager.js';
import { getAll } from '../offline/database.js';

const REQUIRED_RESOURCE_TYPES=['script','style','image','font','audio','video','json'];
// Readiness is a presence check only, never a publication or cryptographic assertion.
export function checkOfflineReadiness(content){const required=(content?.resources||[]).filter(r=>r.type!=='practice');return {prepared:false,manifest:{contentId:content?.id,version:content?.version},required,optional:[],deps:[],issues:required.map(r=>({id:r.id,msg:'Disponibilidad local pendiente de comprobación'}))};}

export async function listOfflinePackages(filters={}){
  const packages=await listPackages();
  let filtered=packages;
  if(filters.course) filtered=filtered.filter(p=>p.course===filters.course);
  if(filters.grade) filtered=filtered.filter(p=>p.grade===filters.grade);
  if(filters.status) filtered=filtered.filter(p=>p.localStatus===filters.status);
  return filtered.map(p=>({
    id:p.id,
    name:p.name||p.id,
    course:p.course,
    grade:p.grade,
    version:p.version||'Desconocida',
    lessonsIncluded:p.lessons?.length||0,
    resourcesTotal:p.required?.length||p.resources?.length||0,
    requiredResources:p.required?.length||p.resources?.filter(r=>r.required).length||0,
    optionalResources:p.resources?.filter(r=>!r.required).length||0,
    sizeBytes:p.sizeBytes??null,
    localStatus:p.localStatus||p.status||'sin-verificar',
    downloadedAt:p.downloadedAt,
    verifiedAt:p.verifiedAt,
    dependencies:p.dependencies||[],
    manifest:p.manifest,
  }));
}

export async function getPackageDetail(id){
  const pkg=await getPackage(id);
  if(!pkg) return null;
  const resourceCheck=await verifyPackageResources(pkg);
  return {
    ...pkg,
    resources:pkg.resources||[],
    resourceCheck,
    verification:pkg.verification||{checked:false},
  };
}

export async function verifyPackageResources(pkg){
  if(!pkg.resources?.length) return {total:0,available:0,missing:0,details:[]};
  const details=[];
  let available=0;
  for(const r of pkg.resources){
    let exists=false, cached=null;
    try{
      cached=await caches.match(r.url||r.path);
      exists=!!cached;
    }catch{}
    if(exists) available++;
    details.push({resourceId:r.id||r.url,type:r.type,url:r.url||r.path,required:r.required,exists,cached:exists?'Disponible en caché':'No en caché'});
  }
  return {
    total:pkg.resources.length,
    available,
    missing:pkg.resources.length-available,
    details,
    integrity:pkg.manifest?.hash?await checkIntegrity(pkg):'no-hash',
  };
}

async function checkIntegrity(pkg){
  if(!pkg.manifest?.hash) return 'no-hash';
  try{
    const resources=pkg.resources||[];
    const data=resources.map(r=>r.url||r.path).sort().join('|');
    const encoder=new TextEncoder();
    const buffer=await crypto.subtle.digest('SHA-256',encoder.encode(data));
    const hash=Array.from(new Uint8Array(buffer)).map(b=>b.toString(16).padStart(2,'0')).join('');
    return hash===pkg.manifest.hash?'valid':'mismatch';
  }catch{return 'error';}
}

export async function getPackageStats(){
  const packages=await listPackages();
  const statusCounts={};
  for(const p of packages){
    statusCounts[p.localStatus]=(statusCounts[p.localStatus]||0)+1;
  }
  return {
    total:packages.length,
    byStatus:statusCounts,
    byCourse:groupBy(packages,'course'),
    byGrade:groupBy(packages,'grade'),
    totalResources:packages.reduce((n,p)=>n+(p.resources?.length||0),0),
    totalSize:packages.reduce((n,p)=>n+(p.sizeBytes||0),0),
  };
}

function groupBy(arr,key){
  const groups={};
  for(const item of arr){
    const val=item[key]||'sin-dato';
    groups[val]=(groups[val]||0)+1;
  }
  return groups;
}

export async function checkPackageDependencies(pkgId){
  const pkg=await getPackage(pkgId);
  if(!pkg) return {ok:false,error:'Paquete no encontrado'};
  const deps=pkg.dependencies||[];
  const missing=[];
  for(const dep of deps){
    const exists=await getPackage(dep);
    if(!exists) missing.push(dep);
  }
  return {ok:missing.length===0,missing};
}
