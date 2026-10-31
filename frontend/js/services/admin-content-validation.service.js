export function validateContent(content){
  const errors=[],warnings=[];
  const add=(type,rule,desc,el)=>({type,rule,desc,el});
  if(!content?.title){errors.push(add('error','requireTitle','Falta título','title'));}
  if(!content?.objective){errors.push(add('error','requireObjective','Falta objetivo','objective'));}
  if(!content?.courseId){errors.push(add('error','requireCourse','Falta curso','course'));}
  if(!content?.grade){errors.push(add('error','requireGrade','Falta grado','grade'));}
  if(content?.type==='lesson'&&!content?.unitId){errors.push(add('error','requireUnitWhenLesson','Falta unidad para lección','unit'));}
  const blocks=content?.blocks||[];
  if(blocks.length>80){warnings.push(add('warning','maxBlocks','Más de 80 bloques','blocks'));}
  blocks.forEach((b,idx)=>{
    if(b.type==='image'){
      if(!b.alt && b.alt!==''){warnings.push(add('warning','requireAltForImage',`Bloque ${idx+1}: falta texto alternativo`,'image:'+b.id));}
    }
  });
  (content?.resources||[]).forEach((r,idx)=>{
    if(!r.path && !r.src){warnings.push(add('warning','resources','Recurso sin ruta','resource:'+idx));}
  });
  return {
    ranAt:new Date().toISOString(),
    errors,
    warnings,
    info:[],
    summary:{errors:errors.length,warnings:warnings.length,ok:errors.length===0},
    sections:{
      structure:{errors:errors.filter(e=>e.rule.includes('require')),warnings:[]},
      content:{errors:[],warnings:warnings.filter(w=>w.rule==='maxBlocks')},
      resources:{errors:[],warnings:warnings.filter(w=>w.rule==='resources')},
      access:{errors:[],warnings:warnings.filter(w=>w.rule.includes('Alt'))},
      compat:{errors:[],warnings:[]},
      offline:{errors:[],warnings:[]},
      security:{errors:[],warnings:[]}
    }
  };
}
