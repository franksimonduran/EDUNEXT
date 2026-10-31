import { getPracticesDemo } from '../data/practices-demo.data.js';
import { validateGrade,ContentNotFoundError } from './course.service.js';
export async function getPractices(grade){return getPracticesDemo(validateGrade(grade));}
export async function getPractice(grade,id){const activity=(await getPractices(grade)).find(item=>item.id===id);if(!activity)throw new ContentNotFoundError();return activity;}
