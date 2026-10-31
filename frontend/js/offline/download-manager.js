import { getPackage } from '../data/offline-packages.data.js';
import { savePackage } from './package-manager.js';
import { cacheAsset } from './cache-manager.js';

const active=new Map();

export function isActive(id){ return active.has(id); }
export function getActive(){ return Array.from(active.values()); }
export async function startDownload(id, onProgress){
 if(active.has(id)) return;
 const pkg=getPackage(id);
 if(!pkg) throw new Error('pkg-not-found');
 const job={id, name: pkg.unit||pkg.course, total: (pkg.required||[]).length, done:0, status:'preparing', error:null};
 active.set(id,job);
 try {
  job.status='downloading';
  for(const r of (pkg.required||[])){
    if(job.status==='cancelled')throw new Error('Descarga cancelada');
    if(!(await cacheAsset(r)))throw new Error('No se pudo almacenar un recurso obligatorio');
    job.done++; if(onProgress) onProgress({...job});
  }
  // verify minimal
  job.status='verifying';
  const local={...pkg, downloadedAt: Date.now(), status:'descargado', verified:true};
  await savePackage(local);
  job.status='descargado';
  if(onProgress) onProgress({...job});
  setTimeout(()=>active.delete(id), 500);
 } catch(e){
  job.status='error'; job.error=e.message||'error'; if(onProgress) onProgress({...job});
 }
}
export function cancelDownload(id){ if(active.has(id)){ active.get(id).status='cancelled'; active.delete(id); } }
