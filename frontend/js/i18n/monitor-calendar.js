import {getLocale} from '../student/i18n.js';
const messages={es:{month:'Mes',week:'Semana',day:'Día',today:'Hoy',previous:'Anterior',next:'Siguiente',noEvents:'No hay actividades registradas para esta fecha'},en:{month:'Month',week:'Week',day:'Day',today:'Today',previous:'Previous',next:'Next',noEvents:'No activities are registered for this date'}};
export const calendarLocale=()=>getLocale()==='en'?'en':'es';
export const ct=key=>messages[calendarLocale()][key]||messages.es[key]||key;
