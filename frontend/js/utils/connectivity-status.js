export function isOnline(){
  return navigator.onLine;
}

export function onConnectivityChange(cb){
  const handler=()=>cb({online:navigator.onLine});
  window.addEventListener('online',handler);
  window.addEventListener('offline',handler);
  return ()=>{ window.removeEventListener('online',handler); window.removeEventListener('offline',handler); };
}

export function formatConnectivity(online){
  return online?'Con conexión de red':'Sin conexión';
}

export function getConnectionInfo(){
  return {
    online:navigator.onLine,
    type:navigator.connection?.effectiveType||'unknown',
    downlink:navigator.connection?.downlink||null,
    rtt:navigator.connection?.rtt||null,
    saveData:navigator.connection?.saveData||false,
  };
}

export function isConnectionLikelyFast(){
  const conn=navigator.connection;
  if(!conn) return true;
  return conn.effectiveType==='4g' && !conn.saveData;
}