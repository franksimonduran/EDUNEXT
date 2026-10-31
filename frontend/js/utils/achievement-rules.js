import { achievementsDemo } from '../data/achievements-demo.data.js';

export function checkUnlock(achievement, context={}){
 if(achievement.status==='obtenida') return { unlock:false, already:true };
 if(achievement.progress >= achievement.goal) return { unlock:true };
 return { unlock:false };
}
