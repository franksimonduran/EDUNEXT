import {openAithronDb,getAll,get} from '../offline/database.js';
import {monitor,subjects} from '../data/monitor-demo.data.js';
import {authorizedRooms} from './monitor-students.service.js';
import {learningResources,resourceById} from './monitor-learning-resources.service.js';
import {validCivil,validTime,calendarZones,todayCivil,addCivilDays} from '../utils/calendar-dates.js';
import {announceMonitorChange} from '../utils/monitor-data-events.js';
export const organizerId=prefix=>prefix+'-'+crypto.randomUUID();
export const notificationDefaults={evaluations:true,tasks:true,reinforcements:true,reminders:true,sessions:true,sync:true,system:true,leadDays:3,zone:'America/Lima',quietStart:'',quietEnd:''};
export async function listPersonal(kind){return (await getAll(kind==='session'?'monitorSessions':'monitorReminders')).filter(x=>x.owner===monitor.id);}
export async function getPersonal(kind,id){const x=await get(kind==='session'?'monitorSessions':'monitorReminders',id);return x?.owner===monitor.id?x:null;}
export async function getNotificationPreferences(){const row=await get('monitorNotificationPreferences',monitor.id);return {...notificationDefaults,...row,id:monitor.id};}
export async function initOrganizer(){
 const db=await openAithronDb();return new Promise((resolve,reject)=>{const tx=db.transaction(['monitorSessions','monitorReminders','storageMetadata'],'readwrite'),meta=tx.objectStore('storageMetadata'),req=meta.get('monitor-organizer-seed-v1');req.onsuccess=()=>{if(req.result)return;const day=todayCivil(),createdAt=new Date().toISOString();
  subjects.forEach((course,i)=>{const grade=[4,5,6][i%3],resource=learningResources(grade).find(r=>r.course===course&&r.type==='lesson');tx.objectStore('monitorSessions').add({id:'session-example-'+i,owner:monitor.id,title:'Sesión personal de ejemplo: '+resource.theme,room:'a'+grade,course,theme:resource.theme,date:addCivilDays(day,i%3),time:i===0?'09:00':'10:00',duration:30,objective:'Revisar un concepto con material de demostración.',resourceIds:[resource.id],zone:'America/Lima',state:'planned',revision:1,createdAt,updatedAt:createdAt,source:'fixture'});});
  const resource=learningResources(4).find(r=>r.type==='lesson');tx.objectStore('monitorSessions').add({id:'session-example-overlap',owner:monitor.id,title:'Sesión de ejemplo coincidente',room:'a4',course:'Matemática',theme:resource.theme,date:day,time:'09:15',duration:30,objective:'Organizar material educativo de muestra.',resourceIds:[resource.id],zone:'America/Lima',state:'planned',revision:1,createdAt,updatedAt:createdAt,source:'fixture'});
  tx.objectStore('monitorReminders').add({id:'reminder-example-today',owner:monitor.id,title:'Ejemplo personal: revisar materiales',description:'Recordatorio ficticio local.',date:day,time:null,zone:'America/Lima',category:'personal',room:'',course:'',color:'orange',reference:'',state:'pending',revision:1,createdAt,updatedAt:createdAt,source:'fixture'});
  tx.objectStore('monitorReminders').add({id:'reminder-example-next',owner:monitor.id,title:'Ejemplo personal: preparar la próxima semana',description:'No es una tarea publicada.',date:addCivilDays(day,2),time:null,zone:'America/Lima',category:'planning',room:'',course:'',color:'purple',reference:'',state:'pending',revision:1,createdAt,updatedAt:createdAt,source:'fixture'});
  tx.objectStore('monitorReminders').add({id:'reminder-example-past',owner:monitor.id,title:'Ejemplo completado de organización',description:'Estado ficticio, no entrega académica.',date:addCivilDays(day,-2),time:null,zone:'America/Lima',category:'personal',room:'',course:'',color:'blue',reference:'',state:'completed',revision:1,createdAt,updatedAt:createdAt,source:'fixture'});
  meta.put({key:'monitor-organizer-seed-v1',day,createdAt});};tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(new Error('No se pudo preparar la organización local.'));};});
}
export function personalErrors(kind,value){const errors={};
 if(!value.title?.trim()||value.title.length>160||/<\/?[a-z][^>]*>/i.test(value.title))errors.title='Escribe un título de hasta 160 caracteres sin HTML.';
 if(!validCivil(value.date))errors.date='Selecciona una fecha válida.';if(!validTime(value.time))errors.time='Selecciona una hora válida o deja el campo vacío.';
 if(!calendarZones.includes(value.zone))errors.zone='Selecciona una zona horaria admitida.';
 if(value.room&&!authorizedRooms().some(r=>r.id===value.room))errors.room='Aula no asignada.';
 if(value.course&&!subjects.includes(value.course))errors.course='Asignatura no válida.';
 if(value.description?.length>2000||/<\/?[a-z][^>]*>/i.test(value.description||''))errors.description='Descripción de hasta 2000 caracteres, sin etiquetas HTML.';
 if(kind==='session'){
  const room=authorizedRooms().find(r=>r.id===value.room);if(!room)errors.room='Selecciona un aula asignada.';if(!subjects.includes(value.course))errors.course='Selecciona una asignatura.';
  if(!value.objective?.trim()||value.objective.length>2000||/<\/?[a-z][^>]*>/i.test(value.objective))errors.objective='Escribe el objetivo pedagógico sin HTML.';
  if(!value.theme?.trim()||value.theme.length>500||/<\/?[a-z][^>]*>/i.test(value.theme))errors.theme='Escribe el tema sin HTML.';
  if(!Number.isFinite(value.duration)||value.duration<1||value.duration>240)errors.duration='Duración orientativa de 1 a 240 minutos.';
  if(!value.resourceIds?.length||value.resourceIds.some(id=>{const r=resourceById(id,room?.grade);return !r||r.course!==value.course;}))errors.resourceIds='Selecciona recursos existentes del curso y grado del aula.';
 }else {if(!['personal','planning','review','support'].includes(value.category))errors.category='Selecciona una categoría válida.';if(!['orange','purple','blue','green'].includes(value.color))errors.color='Selecciona un color válido.';}
 return errors;
}
async function write(store,value,event,expected,remove=false){
 const db=await openAithronDb();return new Promise((resolve,reject)=>{const tx=db.transaction([store,'syncQueue'],'readwrite'),target=tx.objectStore(store),req=target.get(value.id);let stale=false;
 req.onsuccess=()=>{if(expected!==null&&(req.result?.revision??0)!==expected){stale=true;tx.abort();return;}if(remove)target.delete(value.id);else target.put(value);const opId=organizerId('op');tx.objectStore('syncQueue').put({opId,type:event,owner:monitor.id,entityId:value.id,payload:{id:value.id,revision:value.revision},createdAt:Date.now(),status:'pendiente',attempts:0,idempotencyKey:opId,requiresAuthorization:true,installationScope:'demo-monitor'});};tx.oncomplete=()=>{db.close();announceMonitorChange();resolve(value);};tx.onerror=tx.onabort=()=>{db.close();reject(new Error(stale?'El registro cambió en otra pestaña. Recarga antes de guardar.':'No se pudo guardar. Revisa el almacenamiento y vuelve a intentarlo.'));};});
}
export async function savePersonal(kind,value){const errors=personalErrors(kind,value);if(Object.keys(errors).length)throw new Error(Object.values(errors).join(' '));const old=await getPersonal(kind,value.id);if(old&&old.revision!==value.revision)throw new Error('El registro cambió. Recarga para reintentar.');const row={...structuredClone(value),owner:monitor.id,state:value.state||(kind==='session'?'planned':'pending'),revision:(old?.revision||0)+1,createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),source:old?.source||'personal-local'};return write(kind==='session'?'monitorSessions':'monitorReminders',row,'monitor.'+kind+'.save',old?.revision??null);}
export async function deletePersonal(kind,id){const old=await getPersonal(kind,id);if(!old)throw new Error('Registro personal no encontrado.');return write(kind==='session'?'monitorSessions':'monitorReminders',old,'monitor.'+kind+'.delete',old.revision,true);}
export async function toggleReminder(id){const row=await getPersonal('reminder',id);if(!row)throw new Error('Recordatorio no encontrado.');return savePersonal('reminder',{...row,state:row.state==='completed'?'pending':'completed'});}
export async function saveNotificationPreferences(value){if(![0,1,3,7].includes(Number(value.leadDays))||!calendarZones.includes(value.zone)||!validTime(value.quietStart)||!validTime(value.quietEnd))throw new Error('Revisa la antelación, zona y horas de descanso.');const old=await getNotificationPreferences();if((value.revision||0)!==(old.revision||0))throw new Error('Las preferencias cambiaron en otra pestaña. Recarga.');return write('monitorNotificationPreferences',{...notificationDefaults,...value,id:monitor.id,owner:monitor.id,leadDays:Number(value.leadDays),revision:(old.revision||0)+1,updatedAt:new Date().toISOString()},'monitor.notification.preferences',old.revision??null);}
