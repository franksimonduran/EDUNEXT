export const serviceDefinitions=Object.freeze([
  {id:'frontend',name:'Frontend EDUNEXT',type:'core',description:'Interfaz de usuario principal',category:'frontend',checkType:'builtin'},
  {id:'serviceWorker',name:'Service Worker',type:'pwa',description:'Controlador offline y caché',category:'pwa',checkType:'sw'},
  {id:'indexedDB',name:'IndexedDB',type:'storage',description:'Base de datos local del navegador',category:'storage',checkType:'idb'},
  {id:'cacheStorage',name:'Cache Storage',type:'storage',description:'Almacenamiento de recursos en caché',category:'storage',checkType:'cache'},
  {id:'syncLocal',name:'EDUNEXT Sync (Local)',type:'sync',description:'Cola y operaciones de sincronización local',category:'sync',checkType:'syncQueue'},
  {id:'syncRemote',name:'EDUNEXT Sync (Remoto)',type:'sync',description:'Sincronización con servidor FastAPI',category:'sync',checkType:'api',integrated:false},
  {id:'fastapi',name:'FastAPI Backend',type:'backend',description:'API institucional',category:'backend',checkType:'api',integrated:false},
  {id:'postgresql',name:'PostgreSQL',type:'backend',description:'Base de datos institucional',category:'backend',checkType:'api',integrated:false},
  {id:'aithronAI',name:'EDUNEXT AI',type:'ai',description:'Servicios de IA (Tutor, Translate, Pronunciación, Insights)',category:'ai',checkType:'api',integrated:false},
  {id:'contentPackages',name:'Paquetes Educativos Offline',type:'content',description:'Paquetes de recursos educativos descargados',category:'content',checkType:'contentPackages'},
  {id:'manifest',name:'Manifiesto PWA',type:'pwa',description:'Manifiesto de la aplicación web',category:'pwa',checkType:'manifest'},
  {id:'storageEstimate',name:'Estimación de Almacenamiento',type:'storage',description:'Uso y cuota de almacenamiento del origen',category:'storage',checkType:'storageEstimate'},
]);

export const syncOperationTypes=Object.freeze([
  {id:'draft-created',label:'Borrador creado',category:'educativo'},
  {id:'proposal-created',label:'Propuesta administrativa',category:'administrativo'},
  {id:'review-completed',label:'Revisión completada',category:'revision'},
  {id:'evaluation-registered',label:'Evaluación registrada',category:'evaluacion'},
  {id:'resource-added',label:'Recurso agregado',category:'recurso'},
  {id:'validation-executed',label:'Validación ejecutada',category:'validacion'},
  {id:'config-modified',label:'Configuración modificada',category:'configuracion'},
  {id:'package-downloaded',label:'Paquete descargado',category:'paquete'},
  {id:'package-verified',label:'Paquete verificado',category:'paquete'},
  {id:'sync-attempted',label:'Intento de sincronización',category:'sync'},
]);

export const incidentCategories=Object.freeze([
  {id:'storage',label:'Almacenamiento',icon:'database'},
  {id:'serviceWorker',label:'Service Worker',icon:'cloud-off'},
  {id:'cacheStorage',label:'Cache Storage',icon:'box'},
  {id:'offlineResources',label:'Recursos Offline',icon:'file-off'},
  {id:'syncOperations',label:'Operaciones de Sincronización',icon:'refresh-cw'},
  {id:'compatibility',label:'Compatibilidad',icon:'cpu'},
  {id:'versions',label:'Versiones',icon:'git-branch'},
  {id:'integration',label:'Integración',icon:'link'},
  {id:'resourceErrors',label:'Errores de Recursos',icon:'alert-triangle'},
]);

export const incidentSeverities=Object.freeze([
  {id:'info',label:'Informativa',description:'Indica una característica o limitación',color:'#3b82f6'},
  {id:'warning',label:'Advertencia',description:'Existe una condición que merece revisión',color:'#f59e0b'},
  {id:'error',label:'Error',description:'Una operación o comprobación falló realmente',color:'#ef4444'},
  {id:'critical',label:'Crítica',description:'Condición grave verificada por reglas explícitas',color:'#991b1b'},
]);

export const technicalActivityTypes=Object.freeze([
  {id:'diagnostic-run',label:'Diagnóstico ejecutado',icon:'stethoscope'},
  {id:'package-validation',label:'Validación de paquete',icon:'shield-check'},
  {id:'storage-error',label:'Error de almacenamiento',icon:'alert-circle'},
  {id:'state-change',label:'Cambio de estado verificado',icon:'git-commit'},
  {id:'sync-operation',label:'Operación de sincronización',icon:'refresh-cw'},
  {id:'resource-check',label:'Comprobación de recursos',icon:'search'},
  {id:'pwa-diagnostic',label:'Diagnóstico PWA',icon:'monitor'},
  {id:'service-check',label:'Comprobación de servicio',icon:'activity'},
]);

export const diagnosticTests=Object.freeze([
  {id:'js-modules',name:'Soporte de JavaScript Modules',description:'Verifica que el navegador soporte módulos ES6',category:'compatibilidad'},
  {id:'indexeddb-available',name:'Disponibilidad de IndexedDB',description:'Comprueba acceso a IndexedDB',category:'almacenamiento'},
  {id:'indexeddb-access',name:'Acceso a base existente',description:'Verifica apertura del almacenamiento local de EDUNEXT',category:'almacenamiento'},
  {id:'sw-support',name:'Soporte de Service Worker',description:'Comprueba soporte de SW en navegador',category:'pwa'},
  {id:'sw-registration',name:'Registro existente',description:'Verifica registro de SW activo',category:'pwa'},
  {id:'sw-control',name:'Control de página',description:'Comprueba si SW controla página actual',category:'pwa'},
  {id:'cache-storage',name:'Disponibilidad de Cache Storage',description:'Verifica acceso a Cache Storage API',category:'almacenamiento'},
  {id:'cache-read',name:'Lectura de cachés propias',description:'Lista cachés controladas por la app',category:'almacenamiento'},
  {id:'manifest-presence',name:'Presencia de manifiesto PWA',description:'Verifica link rel=manifest en HTML',category:'pwa'},
  {id:'storage-manager',name:'Disponibilidad de StorageManager',description:'Comprueba navigator.storage.estimate()',category:'almacenamiento'},
  {id:'connectivity',name:'Estado de conectividad reportado',description:'navigator.onLine',category:'conectividad'},
  {id:'package-manifests',name:'Manifiestos de paquetes',description:'Verifica manifiestos en contentPackages',category:'contenido'},
  {id:'local-references',name:'Referencias locales verificables',description:'Recursos referenciados y existentes',category:'contenido'},
  {id:'sync-queue',name:'Estado de cola de sincronización',description:'Operaciones pendientes en syncQueue',category:'sync'},
  {id:'version-compat',name:'Compatibilidad de versiones',description:'Versión de esquema DB v7',category:'versiones'},
  {id:'services-integrated',name:'Servicios integrados configurados',description:'FastAPI, PostgreSQL, EDUNEXT AI',category:'integracion'},
]);

export const systemStatusDescriptions=Object.freeze({
  available:'Comprobación real exitosa. El servicio o recurso está operativo.',
  unavailable:'Comprobación real fallida. El servicio no responde o no está accesible.',
  pending:'Operación existente todavía no completada.',
  notIntegrated:'Funcionalidad futura sin implementación backend.',
  unknown:'No puede determinarse con la información disponible.',
  locallyAvailable:'Existe en el dispositivo actual.',
  errorDetected:'Fallo confirmado mediante una comprobación.',
  notConfigured:'No hay configuración de backend disponible.',
  demo:'Vista de demostración · Sin efectos reales.',
});
