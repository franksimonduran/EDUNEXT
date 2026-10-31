export {avatarsData} from './avatars.data.js';
import {readPreferences,savePreferences} from '../services/preferences.service.js';

export const profileDemo = Object.freeze({
 id:'stu-001',
 alias:'Explorador EDUNEXT',
 grade:5,
 role:'Estudiante',
 institution:'Colegio Demostrativo',
 aula:'5° A',
 avatar:'av-1',
 coursesActive:5,
 lessonsCompleted:8,
 missionsCompleted:1,
 achievements:1
});

export function getProfile(){const p=readPreferences('demo-student');return {...profileDemo,avatar:p.avatar,alias:p.alias||profileDemo.alias};}
export function saveProfileLocal({alias, avatar}){
  const patch={};if(alias)patch.alias=alias.trim().replace(/\s+/g,' ');if(avatar)patch.avatar=avatar;savePreferences(patch,'demo-student');
}
