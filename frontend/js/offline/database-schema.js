const DB_NAME='aithron-edu';
const DB_VERSION=10;

function migrate(db){
 if(!db.objectStoreNames.contains('syncReceipts'))db.createObjectStore('syncReceipts',{keyPath:'id'});
 for(const name of ['adminContentReviews','adminPublicationPrep','adminReportConfigs','adminReportHistory'])if(!db.objectStoreNames.contains(name))db.createObjectStore(name,{keyPath:'id'});
 for(const name of ['adminConfigurationProposals','adminConfigurationVersions','technicalIncidents','technicalActivity'])if(!db.objectStoreNames.contains(name))db.createObjectStore(name,{keyPath:'id'});
 for(const name of ['adminAcademicRecords','adminAcademicRecordVersions'])if(!db.objectStoreNames.contains(name)){const s=db.createObjectStore(name,{keyPath:'id'});s.createIndex('owner','owner',{unique:false});s.createIndex('type','type',{unique:false});}
 for(const name of ['adminUserRequests','adminUserRequestVersions'])if(!db.objectStoreNames.contains(name)){const s=db.createObjectStore(name,{keyPath:'id'});s.createIndex('owner','owner',{unique:false});}
 for(const name of ['monitorContentDrafts','monitorContentVersions'])if(!db.objectStoreNames.contains(name)){const s=db.createObjectStore(name,{keyPath:'id'});s.createIndex('owner','owner',{unique:false});}
 for(const name of ['monitorSessions','monitorReminders','monitorNotificationStates','monitorNotificationPreferences'])if(!db.objectStoreNames.contains(name))db.createObjectStore(name,{keyPath:'id'});
 for (const name of ['monitorEvaluations','monitorAttempts']) {
  if(!db.objectStoreNames.contains(name)) db.createObjectStore(name,{keyPath:'id'});
 }
 for(const name of ['monitorActivities','monitorActivityAssignments','monitorActivityRecords','monitorActivityObservations']){
  if(!db.objectStoreNames.contains(name))db.createObjectStore(name,{keyPath:'id'});
 }
 if(!db.objectStoreNames.contains('contentPackages')){ const s=db.createObjectStore('contentPackages',{keyPath:'id'}); s.createIndex('course','course',{unique:false}); s.createIndex('grade','grade',{unique:false}); }
 if(!db.objectStoreNames.contains('courses')){ const s=db.createObjectStore('courses',{keyPath:'id'}); s.createIndex('grade','grade',{unique:false}); }
 if(!db.objectStoreNames.contains('units')){ const s=db.createObjectStore('units',{keyPath:'id'}); s.createIndex('courseId','courseId',{unique:false}); }
 if(!db.objectStoreNames.contains('lessons')){ const s=db.createObjectStore('lessons',{keyPath:'id'}); s.createIndex('unitId','unitId',{unique:false}); s.createIndex('courseId','courseId',{unique:false}); }
 if(!db.objectStoreNames.contains('practices')){ const s=db.createObjectStore('practices',{keyPath:'id'}); s.createIndex('lessonId','lessonId',{unique:false}); }
 if(!db.objectStoreNames.contains('practiceAttempts')){ const s=db.createObjectStore('practiceAttempts',{keyPath:'id'}); s.createIndex('practiceId','practiceId',{unique:false}); }
 if(!db.objectStoreNames.contains('evaluationDrafts')){ const s=db.createObjectStore('evaluationDrafts',{keyPath:'id'}); s.createIndex('evaluationId','evaluationId',{unique:false}); }
 if(!db.objectStoreNames.contains('learningProgress')){ const s=db.createObjectStore('learningProgress',{keyPath:'id'}); }
 if(!db.objectStoreNames.contains('vocabulary')){ const s=db.createObjectStore('vocabulary',{keyPath:'id'}); }
 if(!db.objectStoreNames.contains('syncQueue')){ const s=db.createObjectStore('syncQueue',{keyPath:'opId'}); s.createIndex('status','status',{unique:false}); s.createIndex('type','type',{unique:false}); }
 if(!db.objectStoreNames.contains('syncMetadata')){ const s=db.createObjectStore('syncMetadata',{keyPath:'key'}); }
 if(!db.objectStoreNames.contains('storageMetadata')){ const s=db.createObjectStore('storageMetadata',{keyPath:'key'}); }
}

export function openAithronDb(){
 return new Promise((resolve,reject)=>{
  if(typeof indexedDB==='undefined'){ reject(new Error('noidb')); return; }
  const req=indexedDB.open(DB_NAME, DB_VERSION);
  req.onupgradeneeded=()=>{ migrate(req.result); };
   req.onsuccess=()=>{req.result.onversionchange=()=>req.result.close();resolve(req.result);};
   req.onblocked=()=>reject(new Error('Cierra otras pestañas de EDUNEXT para actualizar el almacenamiento.'));
  req.onerror=()=>reject(req.error);
 });
}
export {DB_NAME, DB_VERSION};
