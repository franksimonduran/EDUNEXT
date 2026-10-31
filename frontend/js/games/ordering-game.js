import {mountQuestionActivity} from '../student/activity-runner.js';
export function mountOrderingGame(root,activity,session){
 if(activity.questions.some(question=>question.type!=='ordering'))throw new TypeError('Juego de secuencia no válido.');
 return mountQuestionActivity(root,activity,session);
}
