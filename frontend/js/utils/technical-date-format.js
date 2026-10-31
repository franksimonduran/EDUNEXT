export function formatTechnicalDate(timestamp,options={}){
  if(!timestamp) return 'Sin fecha';
  const date=new Date(timestamp);
  if(isNaN(date.getTime())) return 'Fecha inválida';
  const opts={
    timeZone:options.timeZone||'America/Lima',
    dateStyle:options.dateStyle||'medium',
    timeStyle:options.timeStyle||'short',
    ...options,
  };
  return new Intl.DateTimeFormat(options.locale||'es-PE',opts).format(date);
}

export function formatISODate(timestamp){
  if(!timestamp) return 'Sin fecha';
  const date=new Date(timestamp);
  if(isNaN(date.getTime())) return 'Fecha inválida';
  return date.toISOString();
}

export function formatRelativeTime(timestamp){
  if(!timestamp) return 'Sin fecha';
  const now=Date.now();
  const diff=now-timestamp;
  if(diff<0) return 'En el futuro';
  if(diff<1000) return 'Ahora mismo';
  if(diff<60000) return `Hace ${Math.floor(diff/1000)}s`;
  if(diff<3600000) return `Hace ${Math.floor(diff/60000)}m`;
  if(diff<86400000) return `Hace ${Math.floor(diff/3600000)}h`;
  if(diff<604800000) return `Hace ${Math.floor(diff/86400000)}d`;
  return formatTechnicalDate(timestamp);
}

export function formatDuration(ms){
  if(ms<1000) return `${ms}ms`;
  if(ms<60000) return `${(ms/1000).toFixed(1)}s`;
  if(ms<3600000) return `${Math.floor(ms/60000)}m ${Math.floor((ms%60000)/1000)}s`;
  return `${Math.floor(ms/3600000)}h ${Math.floor((ms%3600000)/60000)}m`;
}

export function formatDateRange(start,end){
  if(!start||!end) return 'Rango incompleto';
  return `${formatTechnicalDate(start)} - ${formatTechnicalDate(end)}`;
}

export function getLimaTimeZone(){
  return 'America/Lima';
}

export function isToday(timestamp){
  if(!timestamp) return false;
  const date=new Date(timestamp);
  const today=new Date();
  return date.getDate()===today.getDate() && date.getMonth()===today.getMonth() && date.getFullYear()===today.getFullYear();
}

export function isThisWeek(timestamp){
  if(!timestamp) return false;
  const date=new Date(timestamp);
  const today=new Date();
  const weekStart=new Date(today);
  weekStart.setDate(today.getDate()-today.getDay());
  const weekEnd=new Date(weekStart);
  weekEnd.setDate(weekStart.getDate()+6);
  return date>=weekStart && date<=weekEnd;
}