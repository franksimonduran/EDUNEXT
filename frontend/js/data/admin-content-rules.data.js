export const adminContentRules=Object.freeze({
  requireTitle:true,
  requireObjective:true,
  requireCourse:true,
  requireGrade:true,
  requireUnitWhenLesson:true,
  maxBlocks:80,
  allowedBlockTypes:['title','text','explanation','example','image','audio','vocabulary','list','reflection','practice-link','resource','summary','quiz-mini'],
  requireAltForImage:true,
  requireSafeUrls:true,
  disallowScripts:true
});

export const publicationRequirements=Object.freeze([
  {id:'validation-ok',text:'Validación técnica sin errores bloqueantes'},
  {id:'resources-ok',text:'Recursos obligatorios disponibles'},
  {id:'deps-ok',text:'Dependencias verificadas'},
  {id:'access-ok',text:'Revisión de accesibilidad atendida o registrada'},
  {id:'offline-ok',text:'Preparación offline comprobada'}
]);

export const reviewCategories=Object.freeze([
  {id:'estructural',label:'Estructural'},
  {id:'pedagogico',label:'Pedagógico'},
  {id:'accesibilidad',label:'Accesibilidad'},
  {id:'recursos',label:'Recursos'},
  {id:'seguridad',label:'Seguridad'}
]);
