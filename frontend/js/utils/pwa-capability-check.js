import {getSWDetail,getManifestDetail,getCacheDetail} from '../services/admin-pwa-diagnostics.service.js';
export const isStandalone=()=>matchMedia('(display-mode: standalone)').matches;
export const isPWAInstallable=()=>null;
export const getManifestInfo=getManifestDetail;
export async function checkPWACapabilities(){const sw=await getSWDetail(),manifest=await getManifestDetail(),cache=await getCacheDetail();return {serviceWorker:sw.supported,registration:sw.registered,active:sw.active,controlling:sw.controlling,manifest:manifest.present,manifestValid:manifest.accessible,cacheStorage:cache.supported,cacheCount:cache.appCaches?.length,installable:null,standalone:isStandalone(),offlineReady:null};}
export function getPWAStatusSummary(c){return {checks:Object.entries(c).map(([name,value])=>({name,pass:value})),limitation:'La instalación y el funcionamiento offline necesitan pruebas específicas.'};}
