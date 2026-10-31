export const reportValidationRules=Object.freeze({
  institutional:{required:['period'],optional:['grade','room','course'],constraints:[{rule:'periodValid',message:'Periodo académico no válido.'},{rule:'institutionMatch',message:'La institución no coincide con el perfil administrativo.'}]},
  grade:{required:['period','grade'],optional:['room','course'],constraints:[{rule:'periodValid',message:'Periodo académico no válido.'},{rule:'gradeValid',message:'Grado no válido.'},{rule:'roomGradeMatch',message:'El aula seleccionada no corresponde al grado.'}]},
  classroom:{required:['period','grade','room'],optional:['course'],constraints:[{rule:'periodValid',message:'Periodo académico no válido.'},{rule:'gradeValid',message:'Grado no válido.'},{rule:'roomExists',message:'Aula inexistente en el ámbito demostrativo.'},{rule:'roomGradeMatch',message:'El aula seleccionada no corresponde al grado.'}]},
  course:{required:['period','grade','course'],optional:['room'],constraints:[{rule:'periodValid',message:'Periodo académico no válido.'},{rule:'gradeValid',message:'Grado no válido.'},{rule:'courseValid',message:'Asignatura no válida.'},{rule:'roomGradeMatch',message:'El aula seleccionada no corresponde al grado.'}]},
  statistics:{required:['period'],optional:['grade','room','course'],constraints:[{rule:'periodValid',message:'Periodo académico no válido.'},{rule:'gradeValid',message:'Grado no válido.'},{rule:'roomExists',message:'Aula inexistente en el ámbito demostrativo.'},{rule:'roomGradeMatch',message:'El aula seleccionada no corresponde al grado.'},{rule:'courseValid',message:'Asignatura no válida.'}]},
  monitoring:{required:['period','grade'],optional:['room','course'],constraints:[{rule:'periodValid',message:'Periodo académico no válido.'},{rule:'gradeValid',message:'Grado no válido.'},{rule:'roomGradeMatch',message:'El aula seleccionada no corresponde al grado.'},{rule:'courseValid',message:'Asignatura no válida.'}]},
  quality:{required:['period'],optional:['grade','room','course'],constraints:[{rule:'periodValid',message:'Periodo académico no válido.'},{rule:'gradeValid',message:'Grado no válido.'},{rule:'roomExists',message:'Aula inexistente en el ámbito demostrativo.'},{rule:'roomGradeMatch',message:'El aula seleccionada no corresponde al grado.'},{rule:'courseValid',message:'Asignatura no válida.'}]},
  activity:{required:['period'],optional:['grade','room','course'],constraints:[{rule:'periodValid',message:'Periodo académico no válido.'},{rule:'gradeValid',message:'Grado no válido.'},{rule:'roomExists',message:'Aula inexistente en el ámbito demostrativo.'},{rule:'roomGradeMatch',message:'El aula seleccionada no corresponde al grado.'},{rule:'courseValid',message:'Asignatura no válida.'}]},
  history:{required:[],optional:[],constraints:[]}
});

export function validateReportConfig(config){
  const rules=reportValidationRules[config?.type];
  if(!rules)return {valid:false,errors:['Tipo de reporte no válido.']};
  const errors=[];
  for(const req of rules.required){
    if(!config[req])errors.push(`Campo obligatorio ausente: ${req}.`);
  }
  for(const c of rules.constraints){
    const fn=validationFunctions[c.rule];
    if(fn&&!fn(config))errors.push(c.message);
  }
  return {valid:errors.length===0,errors};
}

export const validationFunctions=Object.freeze({
  periodValid:(c)=>['all','undated','2026-1','2026-2'].includes(c.period),
  institutionMatch:(c)=>c.institution==='demo-institution',
  gradeValid:(c)=>['all','4','5','6'].includes(String(c.grade)),
  courseValid:(c)=>['math','com','sci','soc','eng'].includes(c.course),
  roomExists:(c)=>{if(c.room==='all')return true;const rooms=['a4','a5','a6'];return rooms.includes(c.room);},
  roomGradeMatch:(c)=>{if(c.room==='all'||c.grade==='all')return true;const roomGrade={'a4':4,'a5':4,'a6':5};return roomGrade[c.room]===Number(c.grade);}
});