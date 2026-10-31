export function canCompleteMission(mission){
 if(mission.status==='completada') return false;
 if(mission.type==='daily' || mission.type==='weekly'){
  if(mission.progress >= mission.goal) return true;
 }
 return false;
}
