import {ROLES} from '../core/roles.js';
import {courseKey,demoCode} from '../services/admin-users.service.js';
export const validAlias=s=>typeof s==='string'&&s.trim()===s&&s.length>=2&&s.length<=60&&/^[\p{L}\p{M}\p{N} .’'_-]+$/u.test(s)&&! /\s{2}/.test(s);
export const codePattern=/^DEMO-[A-Z0-9][A-Z0-9-]{2,35}$/;
export function validateUserRequest(r,context,records=[]){
 const errors=[],warnings=[],add=(field,message,blocking=false)=>errors.push({field,message,blocking});const d=r.data||{},registration=r.kind==='registration';
 if(!/^admin-request-[a-z0-9-]+$/.test(r.id||''))add('id','Identificador estable no válido.',true);
 if(r.institutionId!==context.institution.id)add('institutionId','La institución no corresponde al ámbito demostrativo.',true);
 if(!['registration','role','status','assignment'].includes(r.kind))add('kind','Tipo de propuesta no válido.',true);
 if(!d||typeof d!=='object'||Array.isArray(d))add('data','Datos estructurados no válidos.',true);
 const schemas={registration:['alias','code','profile','grade','roomIds','courseKeys','periodId','notes','responsibility'],role:['proposedRole','scope','reason'],status:['proposedState','reason'],assignment:['roomIds','courseKeys','periodId','reason']};
 if(Object.keys(d).some(k=>!(schemas[r.kind]||[]).includes(k)))add('data','El borrador contiene campos no permitidos. No se admiten credenciales ni permisos efectivos.',true);
 for(const key of schemas[r.kind]||[])if(!['grade','roomIds','courseKeys'].includes(key)&&typeof d[key]!=='string')add(key,'El campo '+key+' debe ser texto compatible con el esquema del borrador.',true);
 for(const [k,v] of Object.entries(d))if(typeof v==='string'&&(v.length>2000||/<\/?[a-z][^>]*>|javascript\s*:/i.test(v)))add(k,'Utiliza texto seguro de longitud limitada, sin HTML ni código.',true);
 const other=records.filter(x=>x.id!==r.id&&x.institutionId===r.institutionId),target=context.users.find(u=>u.id===r.targetId)||records.find(x=>x.id===r.targetId&&x.kind==='registration'&&x.state!=='archived');
 if(registration){
  if(!/^demo-user-[a-z0-9-]+$/.test(r.candidateId||''))add('candidateId','Identificador de propuesta de identidad no válido.',true);
  if(!validAlias(d.alias))add('alias','Escribe un alias ficticio de 2 a 60 caracteres, sin HTML.');
  if(!codePattern.test(d.code||''))add('code','Utiliza un código ficticio DEMO- de 3 a 36 caracteres posteriores.',!!d.code);
  if(d.code&&(context.users.some(u=>u.code===d.code)||other.some(x=>x.kind==='registration'&&x.data.code===d.code)))add('code','Este código de demostración ya está registrado o reservado por un borrador.',true);
  if(other.some(x=>x.candidateId===r.candidateId)||context.users.some(u=>u.id===r.candidateId))add('candidateId','Identificador de propuesta duplicado.',true);
  if(!Object.values(ROLES).includes(d.profile))add('profile','Selecciona un perfil válido.',true);
  if(context.users.some(u=>u.alias.toLocaleLowerCase('es')===String(d.alias).toLocaleLowerCase('es'))||other.some(x=>x.kind==='registration'&&x.data.alias.toLocaleLowerCase('es')===String(d.alias).toLocaleLowerCase('es')))warnings.push('Existe otro alias coincidente. No demuestra que sea la misma persona y no se fusionará automáticamente.');
  if(d.profile===ROLES.STUDENT&&![4,5,6].includes(d.grade))add('grade','Selecciona un grado válido.');
  if(d.profile===ROLES.STUDENT&&d.roomIds?.length!==1)add('roomIds','Selecciona un aula válida para la propuesta de estudiante.');
  if(d.profile===ROLES.STUDENT&&d.courseKeys?.length)add('courseKeys','Los cursos del estudiante se derivan del aula; no se crean asignaciones duplicadas en el registro.',true);
  if(d.profile===ROLES.MONITOR&&(!d.roomIds?.length||!d.courseKeys?.length))add('roomIds','Selecciona aulas y asignaturas para la propuesta docente.');
  if(d.profile===ROLES.ADMIN&&!d.responsibility?.trim())add('responsibility','Describe una responsabilidad administrativa ficticia.');
  if(d.profile===ROLES.ADMIN&&(d.roomIds?.length||d.courseKeys?.length||d.grade!==null))add('profile','El registro administrativo no debe contener una matrícula o asignación docente.',true);
  if(d.profile!==ROLES.STUDENT&&d.grade!==null)add('grade','El grado del estudiante no corresponde a este tipo de registro.',true);
 }else{
  if(!target)add('targetId','Selecciona un destinatario existente en esta institución.',true);
  if(target?.revision&&r.targetRevision!==target.revision)add('targetId','El borrador destinatario cambió. Actualiza su referencia antes de guardar.',true);
  const targetRoles=target?.roles||[target?.data?.profile];
  if(r.kind==='role'){if(!Object.values(ROLES).includes(d.proposedRole))add('proposedRole','Selecciona un rol propuesto válido.',true);if(!['own','classroom','institution','institution-admin'].includes(d.scope))add('scope','Selecciona un alcance de referencia válido.',true);if(targetRoles.includes(d.proposedRole))add('proposedRole','El perfil ya figura en el registro. No se añadirá una relación duplicada.');}
  if(r.kind==='status'&&!['activation','deactivation','review'].includes(d.proposedState))add('proposedState','Selecciona un cambio propuesto válido.',true);
  if(r.kind==='assignment'&&!targetRoles.includes(ROLES.MONITOR))add('targetId','La propuesta docente requiere un registro de Monitor.',true);
  if(r.kind==='assignment'&&(!d.roomIds?.length||!d.courseKeys?.length))add('roomIds','Selecciona aulas y cursos existentes.');
  const signature=x=>JSON.stringify([x.kind,x.targetId,x.data.proposedRole,x.data.scope,x.data.proposedState,x.data.roomIds,x.data.courseKeys,x.data.periodId]);
  if(other.some(x=>x.kind!=='registration'&&x.state!=='archived'&&signature(x)===signature(r)))add('targetId','Ya existe una propuesta local equivalente; edítala en lugar de duplicarla.',true);
 }
 if(registration||r.kind==='assignment'){
  if(!Array.isArray(d.roomIds)||!Array.isArray(d.courseKeys))add('roomIds','Las relaciones deben ser listas de identificadores válidos.',true);
  else{
   if(new Set(d.roomIds).size!==d.roomIds.length||new Set(d.courseKeys).size!==d.courseKeys.length)add('roomIds','No dupliques relaciones con aulas o cursos.',true);
   for(const id of d.roomIds){const room=context.rooms.find(x=>x.id===id);if(!room)add('roomIds','Selecciona un aula válida.',true);else if(d.profile===ROLES.STUDENT&&room.grade!==d.grade)add('grade','El grado seleccionado no corresponde al aula.',true);}
   for(const key of d.courseKeys){const course=context.courses.find(c=>courseKey(c)===key);if(!course||!course.rooms.some(room=>d.roomIds.includes(room.id)))add('courseKeys','La asignatura no corresponde a ninguna de las aulas propuestas.',true);}
   if((r.kind==='assignment'||d.profile===ROLES.MONITOR)&&d.roomIds.some(id=>!context.courses.some(c=>d.courseKeys.includes(courseKey(c))&&c.rooms.some(room=>room.id===id))))add('courseKeys','Cada aula propuesta debe relacionarse con al menos un curso compatible.');
  }
  if(d.periodId&&!context.institution.periods.some(p=>p.id===d.periodId))add('periodId','Periodo no válido.',true);
  if((r.kind==='assignment'||d.profile!==ROLES.ADMIN)&&!d.periodId)add('periodId','Selecciona un periodo para la propuesta (no confirma matrícula).');
 }
 warnings.push('Solo propuesta local ficticia. Identidad, roles, matrículas y permisos efectivos requieren autorización del servidor.');
 return {errors,warnings,valid:!errors.length,checkedAt:new Date().toISOString()};
}
