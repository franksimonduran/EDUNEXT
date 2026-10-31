import {readPreferences,savePreferences,preferenceScope} from '../services/preferences.service.js';
let systemListener;
export function applyTheme(theme,{persist=true,scope=preferenceScope()}={}){
 theme=theme==='auto'?'system':theme;if(!['light','dark','system'].includes(theme))throw new Error('Tema no válido.');
 if(persist)savePreferences({theme},scope);
 const dark=theme==='dark'||theme==='system'&&matchMedia('(prefers-color-scheme: dark)').matches;
 document.documentElement.dataset.theme=dark?'dark':'light';document.documentElement.dataset.themePreference=theme;
}
export function getTheme(scope=preferenceScope()){const theme=readPreferences(scope).theme;return theme==='system'?'auto':theme;}
export function initTheme(scope=preferenceScope()){
 applyTheme(readPreferences(scope).theme,{persist:false,scope});
 const media=matchMedia('(prefers-color-scheme: dark)');if(systemListener)media.removeEventListener('change',systemListener);systemListener=()=>applyTheme(readPreferences(scope).theme,{persist:false,scope});media.addEventListener('change',systemListener);
}
