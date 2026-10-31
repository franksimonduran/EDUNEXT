let channel=null;
function getChannel(){if(!channel&&typeof BroadcastChannel!=='undefined'){channel=new BroadcastChannel('aithron-demo-monitor-data');channel.onmessage=e=>{if(e.data?.scope==='demo-monitor')window.dispatchEvent(new Event('monitor-data-change'));};}return channel;}
export function announceMonitorChange(){if(typeof window==='undefined')return;window.dispatchEvent(new Event('monitor-data-change'));getChannel()?.postMessage({scope:'demo-monitor'});}
export function onMonitorChange(callback){getChannel();window.addEventListener('monitor-data-change',callback);return ()=>window.removeEventListener('monitor-data-change',callback);}
