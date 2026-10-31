import {readPreferences,savePreferences,preferenceScope} from '../services/preferences.service.js';
export function applyA11y(settings={}, {persist=true,scope=preferenceScope()}={}){
 const keys=['font','contrast','reduceMotion','focusHighlight','lineHeight','tableReadable'],patch=Object.fromEntries(keys.filter(k=>Object.hasOwn(settings,k)).map(k=>[k,settings[k]]));
 const a=persist?savePreferences(patch,scope):{...readPreferences(scope),...patch},root=document.documentElement;
 root.dataset.font=a.font;root.style.setProperty('--a11y-font-scale',a.font==='xlarge'?'1.25':a.font==='large'?'1.125':'1');root.dataset.contrast=a.contrast;root.dataset.reduceMotion=String(a.reduceMotion);root.dataset.focusHighlight=String(a.focusHighlight);root.dataset.readingSpacing=a.lineHeight?'relaxed':'normal';root.dataset.readableTables=String(a.tableReadable);
}
export function loadA11y(scope=preferenceScope()){const p=readPreferences(scope);return Object.fromEntries(['font','contrast','reduceMotion','focusHighlight','lineHeight','tableReadable'].map(k=>[k,p[k]]));}
export function initA11y(scope=preferenceScope()){applyA11y(loadA11y(scope),{persist:false,scope});}
