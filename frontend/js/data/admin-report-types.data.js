export const reportTypes=Object.freeze([
  {id:'institutional',label:'Reporte Institucional',icon:'clipboard',description:'Resumen global de la organización, estudiantes, aulas, docentes, contenidos y actividad.',dataRequired:['institution','students','rooms','teachers','courses','content','activity'],availability:'full'},
  {id:'grade',label:'Reporte por Grado',icon:'book',description:'Distribución de estudiantes, aulas, cursos y resultados agregados para un grado específico.',dataRequired:['grade','rooms','students','courses','activity'],availability:'grade'},
  {id:'classroom',label:'Reporte por Aula',icon:'users',description:'Organización, indicadores agregados y calidad de datos de un aula concreta.',dataRequired:['room','students','teachers','courses','activity'],availability:'room'},
  {id:'course',label:'Reporte por Asignatura',icon:'book-open',description:'Unidades, lecciones, prácticas, evaluaciones y resultados por curso y grado.',dataRequired:['course','grade','units','lessons','evaluations'],availability:'course'},
  {id:'statistics',label:'Estadísticas Institucionales',icon:'chart',description:'Indicadores agregados, gráficos y comparativas entre periodos compatibles.',dataRequired:['institution','students','rooms','courses','evaluations','formative'],availability:'full'},
  {id:'monitoring',label:'Seguimiento Académico',icon:'target',description:'Progreso curricular, prácticas formativas, evaluaciones corregidas y observaciones de Insights.',dataRequired:['students','courses','evaluations','formative','insights'],availability:'full'},
  {id:'quality',label:'Calidad de Datos',icon:'alert-triangle',description:'Validación de integridad, duplicados, referencias rotas, cobertura y disponibilidad.',dataRequired:['institution','students','rooms','enrollments','assignments','content','evaluations'],availability:'full'},
  {id:'activity',label:'Actividad de la Plataforma',icon:'activity',description:'Eventos administrativos y académicos locales con filtros por tipo, periodo y fuente.',dataRequired:['activity'],availability:'full'},
  {id:'history',label:'Historial de Reportes',icon:'clock',description:'Configuraciones e informes demostrativos preparados localmente.',dataRequired:['history'],availability:'full'}
]);

export const availablePeriods=Object.freeze([
  {id:'all',label:'Todos (incluye sin fecha)'},
  {id:'undated',label:'Sin fecha conocida'},
  {id:'2026-1',label:'2026-1 (Ene-Jun)'},
  {id:'2026-2',label:'2026-2 (Jul-Dic)'}
]);

export const availableGrades=Object.freeze([{id:'all',label:'Todos'},{id:'4',label:'4.º primaria'},{id:'5',label:'5.º primaria'},{id:'6',label:'6.º primaria'}]);

export const availableCourses=Object.freeze([
  {id:'math',label:'Matemática'},{id:'com',label:'Comunicación'},
  {id:'sci',label:'Ciencia y Tecnología'},{id:'soc',label:'Personal Social'},
  {id:'eng',label:'Inglés'}
]);

export const indicatorCategories=Object.freeze([
  {id:'organization',label:'Organización Institucional',icon:'users'},
  {id:'content',label:'Contenido Educativo',icon:'book'},
  {id:'academic',label:'Actividad Académica',icon:'clipboard'},
  {id:'progress',label:'Progreso Curricular',icon:'target'},
  {id:'formative',label:'Resultados Formativos',icon:'award'},
  {id:'availability',label:'Disponibilidad de Datos',icon:'database'}
]);

export const qualityCategories=Object.freeze([
  {id:'users',label:'Usuarios',icon:'user',rules:['uniqueId','validRole','institutionMatch']},
  {id:'rooms',label:'Aulas',icon:'home',rules:['validGrade','validSection','periodConsistency']},
  {id:'enrollments',label:'Matrículas',icon:'user-plus',rules:['validStudent','validRoom','noDuplicateEnrollment','periodMatch']},
  {id:'assignments',label:'Asignaciones Docentes',icon:'chalkboard',rules:['validMonitor','validRoom','validCourse','noDuplicateAssignment']},
  {id:'content',label:'Contenidos',icon:'file-text',rules:['validCourse','validGrade','validUnit','versionConsistency']},
  {id:'evaluations',label:'Evaluaciones',icon:'clipboard-check',rules:['validEvaluation','validState','completeResults']},
  {id:'academic',label:'Datos Académicos',icon:'bar-chart',rules:['validMetric','nonZeroDenominator','periodAlignment']},
  {id:'availability',label:'Disponibilidad',icon:'wifi',rules:['knownSource','dateKnown','periodCovered']}
]);

export const activityTypes=Object.freeze([
  {id:'draft_created',label:'Borrador docente creado',icon:'file-plus'},
  {id:'proposal_created',label:'Propuesta administrativa local',icon:'file-text'},
  {id:'review_completed',label:'Revisión de contenido local',icon:'check-circle'},
  {id:'evaluation_registered',label:'Evaluación registrada en demostración',icon:'clipboard'},
  {id:'resource_added',label:'Recurso agregado al catálogo',icon:'plus-circle'},
  {id:'validation_executed',label:'Validación ejecutada',icon:'shield-check'},
  {id:'config_modified',label:'Configuración local modificada',icon:'settings'}
]);

export const demoReportConfig=Object.freeze([
  {id:'cfg-1',type:'institutional',period:'2026-1',grade:'all',room:'all',course:'all',indicators:['organization','content','academic'],createdAt:'2026-10-01T10:00:00.000Z',name:'Reporte Institucional Semestre 1'},
  {id:'cfg-2',type:'grade',period:'2026-1',grade:'5',room:'all',course:'all',indicators:['organization','progress','formative'],createdAt:'2026-10-02T14:30:00.000Z',name:'5.º Primaria - Semestre 1'},
  {id:'cfg-3',type:'classroom',period:'2026-1',grade:'4',room:'a4',course:'all',indicators:['organization','progress'],createdAt:'2026-10-03T09:15:00.000Z',name:'Aula 4ºA - Repeto General'},
  {id:'cfg-4',type:'course',period:'2026-1',grade:'5',room:'all',course:'math',indicators:['content','formative','progress'],createdAt:'2026-10-04T11:45:00.000Z',name:'Matemática 5.º - Unidades y Evaluaciones'},
  {id:'cfg-5',type:'statistics',period:'2026-1',grade:'all',room:'all',course:'all',indicators:['organization','content','academic','progress','formative','availability'],createdAt:'2026-10-05T16:20:00.000Z',name:'Estadísticas Completas Semestre 1'}
]);

export const minimumSampleSize=5;