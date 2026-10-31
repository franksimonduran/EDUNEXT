import { getMonthDays, formatDateISO, isSameDay, civilMonthGrid,formatCivil,isCivilWeekend } from '../utils/calendar-dates.js';
import { escapeHTML as esc } from './student-ui.js';

export function renderMonthCalendar({year, month, selectedDate, events=[],rich=false,dayKey,todayKey,locale='es',weekStart='monday',showWeekends=true}={}){
 if(rich){const days=civilMonthGrid(dayKey,weekStart).filter(d=>showWeekends||!isCivilWeekend(d)),columns=showWeekends?7:5,week=days.slice(0,columns);return `<section class="cal-month" aria-label="Calendario mensual"><div class="cal-weekdays" style="grid-template-columns:repeat(${columns},minmax(0,1fr))">${week.map(d=>`<span>${esc(formatCivil(d,{weekday:'short'},locale))}</span>`).join('')}</div><div class="cal-grid" style="grid-template-columns:repeat(${columns},minmax(0,1fr))">${days.map(day=>{const matches=events.filter(e=>e.startDate&&e.startDate<=day&&(e.endDate||e.startDate)>=day);return `<button type="button" class="cal-cell ${day.slice(0,7)!==dayKey.slice(0,7)?'adjacent-month':''}" data-day="${day}" aria-label="${esc(formatCivil(day,{dateStyle:'full'},locale))}, ${matches.length} actividades" aria-pressed="${day===selectedDate}" ${day===todayKey?'aria-current="date"':''}><span class="cal-daynum">${Number(day.slice(-2))}</span>${matches.slice(0,2).map(e=>`<span class="cell-event event-${e.type}">${esc(e.title)}</span>`).join('')}${matches.length?`<span class="cell-count">${matches.length} actividades${matches.length>2?' · +'+(matches.length-2)+' más':''}</span>`:''}</button>`;}).join('')}</div></section>`;}
 const days = getMonthDays(year, month);
 const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
 const week = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
 return `<section class="cal-month">
  <header class="cal-head"><h2>${monthNames[month]} ${year}</h2></header>
  <div class="cal-weekdays">${week.map(w=>`<div>${w}</div>`).join('')}</div>
  <div class="cal-grid">
   ${days.map(d=>{
    if(!d.date) return `<div class="cal-cell cal-cell--empty"></div>`;
    const iso = formatDateISO(d.date);
    const evCount = events.filter(e=>e.date===iso).length;
    const sel = selectedDate && isSameDay(selectedDate,d.date)?'cal-cell--sel':'';
    const today = isSameDay(new Date(), d.date)?'cal-cell--today':'';
    return `<button class="cal-cell ${sel} ${today}" data-day="${iso}"><span class="cal-daynum">${d.day}</span>${evCount?`<span class="cal-dot">${evCount}</span>`:''}</button>`;
   }).join('')}
  </div>
 </section>`;
}
