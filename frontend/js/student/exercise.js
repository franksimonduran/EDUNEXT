import {bootLearningPage} from './learning-page.js';
import {loadAttempt} from './activity-model.js';
import {mountQuestionActivity} from './activity-runner.js';
import {pt} from './practice-i18n.js';
bootLearningPage(route=>loadAttempt(route,'practice'),({activity,session})=>{
 document.title=`${activity.name} | EDUNEXT`;
 return mountQuestionActivity(document.querySelector('#learning-content'),activity,session);
},{active:'practice',demoMessage:()=>pt('demo')});
