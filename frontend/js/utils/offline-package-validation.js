export const PackageStatus=Object.freeze({
  PREPARED:'preparado',
  DOWNLOADED:'descargado',
  VERIFIED:'verificado',
  INCOMPLETE:'incompleto',
  VERSION_DIFFERENT:'version-diferente',
  UNVERIFIED:'sin-verificar',
});

export function getPackageStatusLabel(status){
  const labels={
    [PackageStatus.PREPARED]:'Preparado para empaquetado',
    [PackageStatus.DOWNLOADED]:'Descargado localmente',
    [PackageStatus.VERIFIED]:'Verificado',
    [PackageStatus.INCOMPLETE]:'Incompleto',
    [PackageStatus.VERSION_DIFFERENT]:'Versión diferente',
    [PackageStatus.UNVERIFIED]:'Sin verificar',
  };
  return labels[status]||status;
}

export function getPackageStatusColor(status){
  const colors={
    [PackageStatus.PREPARED]:'#3b82f6',
    [PackageStatus.DOWNLOADED]:'#10b981',
    [PackageStatus.VERIFIED]:'#8b5cf6',
    [PackageStatus.INCOMPLETE]:'#f59e0b',
    [PackageStatus.VERSION_DIFFERENT]:'#ef4444',
    [PackageStatus.UNVERIFIED]:'#6b7280',
  };
  return colors[status]||'#6b7280';
}

export async function validatePackageResources(pkg){
  if(!pkg.resources?.length) return {valid:true,missing:[],total:0,available:0};
  const missing=[];
  let available=0;
  for(const resource of pkg.resources){
    try{
      const cached=await caches.match(resource.url||resource.path);
      if(cached){
        available++;
      }else{
        missing.push({resource,reason:'No encontrado en Cache Storage'});
      }
    }catch{
      missing.push({resource,reason:'Error al verificar caché'});
    }
  }
  return {
    valid:missing.length===0,
    missing,
    total:pkg.resources.length,
    available:pkg.resources.length-missing.length,
  };
}

export function getRequiredResourceTypes(){
  return ['script','style','image','font','audio','video','json','html'];
}

export function filterResourcesByType(resources,type){
  return resources.filter(r=>r.type===type);
}

export function calculatePackageSize(resources){
  let total=0;
  for(const r of resources){
    if(r.sizeBytes) total+=r.sizeBytes;
  }
  return total;
}

export function formatPackageSize(bytes){
  if(bytes<1024) return bytes+' B';
  if(bytes<1024*1024) return (bytes/1024).toFixed(1)+' KB';
  if(bytes<1024*1024*1024) return (bytes/1024/1024).toFixed(2)+' MB';
  return (bytes/1024/1024/1024).toFixed(2)+' GB';
}

export function validatePackageManifest(manifest){
  const required=['id','name','version','course','grade','resources'];
  const missing=required.filter(f=>!manifest[f]);
  return {
    valid:missing.length===0,
    missing,
    warnings:[],
  };
}