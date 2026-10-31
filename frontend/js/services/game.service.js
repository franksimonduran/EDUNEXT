import { getGamesDemo } from '../data/games-demo.data.js';
import { validateGrade,ContentNotFoundError } from './course.service.js';
export async function getGames(grade){return getGamesDemo(validateGrade(grade));}
export async function getGame(grade,id){const activity=(await getGames(grade)).find(item=>item.id===id);if(!activity)throw new ContentNotFoundError();return activity;}
