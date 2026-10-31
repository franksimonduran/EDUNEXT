import {gradeCatalog,sectionId} from '../data/admin-organization-demo.data.js';
export const classroomCodePattern=/^DEMO-AULA-[A-Z0-9][A-Z0-9-]{0,19}$/;
export const sectionPattern=/^[A-Z0-9]{1,3}$/;
const text=(value,max)=>typeof value==='string'&&value.length<=max&&!/<\/?[a-z][^>]*>|javascript\s*:/i.test(value);
export function validateClassroomDraft(record,model,records=[]){
 const errors=[],warnings=[],add=(field,message,blocking=false)=>errors.push({field,message,blocking});const d=record.data||{};
  if(!classroomCodePattern.test(d.code||''))add('code','El código de aula debe ser ficticio y cumplir DEMO-AULA- seguido de 1 a 20 caracteres.',true);
 if(!gradeCatalog.some(g=>g.id===Number(d.grade)))add('grade','Selecciona un grado disponible en la institución.',true);
 if(!sectionPattern.test(String(d.section||'')))add('section','Indica una sección válida de 1 a 3 caracteres (por ejemplo, A).',true);
 if(!model.periods.some(p=>p.id===d.periodId))add('periodId','Selecciona un periodo académico configurado.',true);
 if(d.name&&!text(d.name,80))add('name','La denominación opcional debe ser texto seguro de hasta 80 caracteres.',true);
 if(d.capacity!==''&&d.capacity!==null&&d.capacity!==undefined){const value=Number(d.capacity);if(!Number.isInteger(value)||value<1||value>60)add('capacity','La capacidad referencial debe ser un número entero entre 1 y 60.',true);}
 if(d.description&&!text(d.description,400))add('description','La descripción debe ser texto seguro de hasta 400 caracteres.',true);
 if(d.notes&&!text(d.notes,400))add('notes','Las observaciones administrativas deben ser texto seguro de hasta 400 caracteres y no contener datos sensibles.',true);
 const sameCode=records.filter(r=>r.type==='classroom'&&r.id!==record.id&&r.state!=='archived'&&r.data?.code===d.code);
 const sameTuple=records.filter(r=>r.type==='classroom'&&r.id!==record.id&&r.state!=='archived'&&r.data?.code===d.code&&Number(r.data?.grade)===Number(d.grade)&&String(r.data?.section||'')===String(d.section||'')&&r.data?.periodId===d.periodId);
 if(sameTuple.length)add('code','Ya existe un borrador de aula con el mismo código, grado, sección y periodo.',true);
 if(sameCode.length&&!sameTuple.length)warnings.push('El código se usa en otro grado o sección. La sección se interpreta dentro de su grado, por lo que no es un duplicado incompatible.');
 if(d.grade&&d.section){const related=model.rooms.filter(r=>r.grade===Number(d.grade));if(related.length&&!related.some(r=>r.section===String(d.section).toUpperCase()))warnings.push('La sección propuesta todavía no existe en ese grado dentro del conjunto de demostración.');}
 if(d.periodId){const period=model.periods.find(p=>p.id===d.periodId);if(period&&!period.start)warnings.push('El periodo seleccionado no tiene fechas confirmadas en la fuente demostrativa.');}
 warnings.push('El borrador no crea el aula en la institución: solo se guarda en este dispositivo.');
 return {errors,warnings,valid:!errors.length,checkedAt:new Date().toISOString()};
}
export function validateSectionDraft(record,model,records=[]){
 const errors=[],warnings=[],add=(field,message,blocking=false)=>errors.push({field,message,blocking});const d=record.data||{};
 if(!gradeCatalog.some(g=>g.id===Number(d.grade)))add('grade','La sección necesita un grado asociado.',true);
 if(!sectionPattern.test(String(d.section||'')))add('section','Indica un identificador de sección de 1 a 3 caracteres.',true);
 if(d.periodId&&!model.periods.some(p=>p.id===d.periodId))add('periodId','El periodo indicado no existe.',true);
 if(d.notes&&!text(d.notes,400))add('notes','Las observaciones deben ser texto seguro de hasta 400 caracteres.',true);
 const duplicate=records.filter(r=>r.type==='section'&&r.id!==record.id&&r.state!=='archived'&&Number(r.data?.grade)===Number(d.grade)&&String(r.data?.section||'')===String(d.section||''));
 if(duplicate.length)add('section','Ya existe una propuesta de sección con el mismo identificador en ese grado.',true);
 const base=model.sections.find(s=>s.id===sectionId(d.grade,d.section));
 if(base)add('section','La sección ya existe en la estructura base de demostración; no se crean duplicados.',true);
 warnings.push('La sección es un identificador organizativo dentro de su grado; no habilita aulas ni matrículas.');
 return {errors,warnings,valid:!errors.length,checkedAt:new Date().toISOString()};
}
