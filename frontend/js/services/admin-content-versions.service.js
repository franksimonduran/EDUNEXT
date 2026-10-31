export function diffVersions(oldv,newv){
  const diff={meta:[],blocks:[],resources:[]};
  const fields=['title','objective','description','grade','unitId','theme'];
  for(const f of fields){
    if((oldv?.[f]||'')!==(newv?.[f]||''))diff.meta.push({field:f,old:oldv?.[f],new:newv?.[f],type:'modified'});
  }
  const ob=oldv?.blocks||[],nb=newv?.blocks||[];
  const map=new Map(ob.map(b=>[b.id,b]));
  for(const b of nb){if(!map.has(b.id))diff.blocks.push({id:b.id,type:'added',block:b});else if(JSON.stringify(map.get(b.id))!==JSON.stringify(b))diff.blocks.push({id:b.id,type:'modified',old:map.get(b.id),new:b});}
  for(const b of ob){if(!nb.find(x=>x.id===b.id))diff.blocks.push({id:b.id,type:'removed',block:b});}
  const or=res(oldv?.resources||[]),nr=res(newv?.resources||[]);
  for(const r of nr){if(!or.find(x=>x.id===r.id))diff.resources.push({id:r.id,type:'added',res:r});}
  for(const r of or){if(!nr.find(x=>x.id===r.id))diff.resources.push({id:r.id,type:'removed',res:r});}
  function res(a){return a.map(r=>({id:r.id,type:r.type,name:r.name}));}
  return diff;
}
