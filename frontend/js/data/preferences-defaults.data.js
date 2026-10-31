import {readPreferences,savePreferences} from '../services/preferences.service.js';
export const preferencesDefaults = Object.freeze({
 reading:true, audio:false, images:true, practice:true, games:true,
 audioAuto:false, audioSpeed:1, lineHeight:false
});

export function loadPrefs(){
 const p=readPreferences('demo-student');return Object.fromEntries(Object.keys(preferencesDefaults).map(k=>[k,p[k]]));
}
export function savePrefs(p){
 return savePreferences(p,'demo-student');
}
export function resetPrefs(){savePreferences({...preferencesDefaults},'demo-student');return {...preferencesDefaults};}
