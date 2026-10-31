import {bootLearningPage} from './learning-page.js';
import {loadAttempt} from './activity-model.js';
import {mountMemoryGame} from '../games/memory-game.js';
import {mountMatchingGame} from '../games/matching-game.js';
import {mountOrderingGame} from '../games/ordering-game.js';
import {mountWordGame} from '../games/word-game.js';
import {mountQuickChallenge} from '../games/quick-challenge.js';
import {pt} from './practice-i18n.js';
const players={memory:mountMemoryGame,matching:mountMatchingGame,ordering:mountOrderingGame,word:mountWordGame,quick:mountQuickChallenge};
bootLearningPage(route=>loadAttempt(route,'game'),({activity,session})=>{
 document.title=`${activity.name} | EDUNEXT`;
 return players[activity.type](document.querySelector('#learning-content'),activity,session);
},{active:'games',demoMessage:()=>pt('demo')});
