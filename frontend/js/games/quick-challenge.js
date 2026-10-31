import {mountQuestionActivity} from '../student/activity-runner.js';
export function mountQuickChallenge(root,activity,session){
 // Deliberadamente sin temporizador ni bonificación por rapidez.
 return mountQuestionActivity(root,activity,session);
}
