import {ROLES,ROLE_DETAILS} from '../core/roles.js';
export const referenceRoles=Object.values(ROLES).map(id=>({id,name:ROLE_DETAILS[id].label}));
// Proposed contracts, never executable access-control rules.
export const permissionReferences=[
 ['courses.read','Consultar cursos','courses','read','own/classroom/institution',['Propios','Asociados','Según ámbito institucional']],
 ['practice.solve','Resolver prácticas','practice','solve','own',['Propias','Vista docente','No es función principal']],
 ['progress.read','Consultar progreso','progress','read','own/classroom/aggregate',['Propio','Estudiantes autorizados','Agregados o según permiso']],
 ['evaluations.prepare','Preparar evaluaciones','evaluations','prepare','classroom',['No','Según asignación','Según permiso institucional']],
 ['evaluations.review','Revisar evaluaciones','evaluations','review','own/classroom',['Revisar las propias','Según asignación','Según autorización específica']],
 ['users.read','Consultar usuarios','users','read','institution',['No','Solo datos académicos autorizados','Según permiso institucional']],
 ['users.create','Solicitar alta de usuario','users','create','institution-admin',['No','No','Según autorización institucional']],
 ['users.update','Proponer cambios de usuario','users','update','institution-admin',['No','No','Según autorización institucional']],
 ['users.deactivate','Solicitar desactivación','users','deactivate','institution-admin',['No','No','Según permiso específico']],
 ['roles.read','Consultar roles','roles','read','institution',['Propios','Propios','Según ámbito']],
 ['roles.assign','Proponer asignación de rol','roles','assign','institution-admin',['No','No','Requiere autorización de servidor']],
 ['classrooms.read','Consultar aulas','classrooms','read','classroom/institution',['Propia','Asociadas','Según ámbito']],
 ['classrooms.manage','Gestionar aulas','classrooms','manage','institution-admin',['No','Consulta','Según permiso']],
 ['content.review','Revisar contenidos','content','review','classroom/institution',['No','Proponer','Según permiso institucional']],
 ['content.publish','Publicar contenido','content','publish','institution-admin',['No','Proponer','Requiere aprobación autorizada']],
 ['reports.read','Consultar reportes','reports','read','own/classroom/aggregate',['Propios','Aulas autorizadas','Agregados o según permiso']],
 ['settings.manage','Configurar institución','settings','manage','institution-admin',['No','No','Según responsabilidad autorizada']]
].map(([id,name,resource,action,scope,cells])=>({id,name,description:'Referencia conceptual de mínimo privilegio. FastAPI validará identidad, permiso, institución y recurso.',resource,action,scope,cells,state:'reference'}));
export const requestKinds={registration:'Registro ficticio',role:'Propuesta de rol',status:'Propuesta de estado',assignment:'Propuesta de asignación docente'};
export const requestStates={draft:'Borrador local',incomplete:'Validación pendiente',ready:'Listo para presentar localmente',archived:'Archivado local'};
