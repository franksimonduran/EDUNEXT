import {mountQuestionActivity} from '../student/activity-runner.js';
export function mountMatchingGame(root,activity,session){
 if(activity.questions.some(question=>question.type!=='matching'))throw new TypeError('Juego de relaciones no válido.');
 return mountQuestionActivity(root,activity,session);
}
