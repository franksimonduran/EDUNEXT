export function getMonthDays(year, month){
 // month 0-11
 const first = new Date(year, month, 1);
 const last = new Date(year, month+1, 0);
 const days = [];
 const startDay = (first.getDay()+6)%7; // Monday start
 for(let i=0;i<startDay;i++) days.push({date:null});
 for(let d=1;d<=last.getDate();d++) days.push({date:new Date(year,month,d), day:d});
 return days;
}

export function formatDateISO(d){ return `${String(d.getFullYear()).padStart(4,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function getWeekDays(date){
 const d = new Date(date);
 const day = (d.getDay()+6)%7;
 const monday = new Date(d); monday.setDate(d.getDate()-day);
 const days=[];
 for(let i=0;i<7;i++){ const nd=new Date(monday); nd.setDate(monday.getDate()+i); days.push(nd); }
 return days;
}
export function isSameDay(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }

// Civil dates are not instants. UTC noon is only an arithmetic/formatting anchor.
export const calendarZones=['America/Lima','UTC'];
export function validCivil(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;const d=new Date(value+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;}
export const validTime=value=>!value||/^([01]\d|2[0-3]):[0-5]\d$/.test(value);
export function civilFromInstant(value=new Date(),zone='America/Lima'){
 const date=new Date(value);if(!Number.isFinite(date.getTime()))return null;
 const p=Object.fromEntries(new Intl.DateTimeFormat('en',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).map(p=>[p.type,p.value]));
 return {date:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`};
}
export const todayCivil=(zone='America/Lima',now=new Date())=>civilFromInstant(now,zone).date;
export function addCivilDays(day,count){if(!validCivil(day))throw new Error('Fecha no válida.');const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
export function addCivilMonths(day,count){const d=new Date(day+'T12:00:00Z'),original=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+count);const end=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(original,end));return d.toISOString().slice(0,10);}
export function civilWeek(day,weekStart='monday'){const d=new Date(day+'T12:00:00Z'),start=addCivilDays(day,-(weekStart==='sunday'?d.getUTCDay():(d.getUTCDay()+6)%7));return Array.from({length:7},(_,i)=>addCivilDays(start,i));}
export function civilMonthGrid(day,weekStart='monday'){const first=day.slice(0,7)+'-01',start=civilWeek(first,weekStart)[0];return Array.from({length:42},(_,i)=>addCivilDays(start,i));}
export const isCivilWeekend=day=>[0,6].includes(new Date(day+'T12:00:00Z').getUTCDay());
export function formatCivil(day,options={dateStyle:'full'},locale='es'){return validCivil(day)?new Intl.DateTimeFormat(locale,{...options,timeZone:'UTC'}).format(new Date(day+'T12:00:00Z')):'Fecha no disponible';}
export function civilInstant(day,time,zone='America/Lima'){
 if(!validCivil(day)||!time||!validTime(time)||!calendarZones.includes(zone))return null;
 return day+'T'+time+':00'+(zone==='America/Lima'?'-05:00':'Z');
}
export function relativeCivil(day,today,locale='es'){if(!validCivil(day))return 'Sin fecha';const distance=Math.round((Date.parse(day+'T12:00:00Z')-Date.parse(today+'T12:00:00Z'))/86400000);return new Intl.RelativeTimeFormat(locale,{numeric:'auto'}).format(distance,'day');}
