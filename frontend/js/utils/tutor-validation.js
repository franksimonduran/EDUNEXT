import {config} from '../core/config.js';
export function validateTutorInput(value){
 if(typeof value!=='string'||!value.trim())return {valid:false,error:'empty'};
 if(value.length>config.tutor.maxInputLength)return {valid:false,error:'tooLong'};
 return {valid:true,text:value.trim().normalize('NFC')};
}
export function normalizeDemoPrompt(value){return String(value??'').normalize('NFC').trim().replace(/\s+/gu,' ').toLocaleLowerCase('es');}
