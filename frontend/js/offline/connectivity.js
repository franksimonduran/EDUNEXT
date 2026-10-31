import { isOnline } from '../utils/storage-format.js';

export function onConnectivityChange(cb){
 const handler=()=>cb({online:navigator.onLine});
 window.addEventListener('online',handler);
 window.addEventListener('offline',handler);
 return ()=>{ window.removeEventListener('online',handler); window.removeEventListener('offline',handler); };
}
export { isOnline };
