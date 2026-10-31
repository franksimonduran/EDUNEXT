import {validCivil,formatCivil} from './calendar-dates.js';
export function fmtDate(d){
 if(validCivil(d))return formatCivil(d,{dateStyle:'long'});
 return new Intl.DateTimeFormat('es-ES',{dateStyle:'long'}).format(new Date(d));
}
export function fmtDay(d){ return new Intl.DateTimeFormat('es-ES',{weekday:'short', day:'numeric'}).format(d); }
