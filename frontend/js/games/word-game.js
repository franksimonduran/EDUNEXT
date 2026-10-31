import {mountQuestionActivity} from '../student/activity-runner.js';
export function mountWordGame(root,activity,session){
 if(activity.questions.some(question=>question.type!=='word'))throw new TypeError('Juego de palabras no válido.');
 return mountQuestionActivity(root,activity,session);
}
