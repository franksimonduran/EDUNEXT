export function filterEvents(events, filters){
 return events.filter(e=>{
  if(filters.course && filters.course!=='all' && e.course!==filters.course) return false;
  if(filters.type && filters.type!=='all' && e.type!==filters.type) return false;
  if(filters.status && filters.status!=='all' && e.status!==filters.status) return false;
  return true;
 });
}
