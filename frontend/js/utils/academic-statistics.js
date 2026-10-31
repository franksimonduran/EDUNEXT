export function compatibleGroups(rows){
 const groups=new Map();
 for(const row of rows){
  if(!row.complete||!Number.isFinite(row.score)||!(row.max>0))continue;
  const key=`${row.evaluationId}|${row.version}`;
  if(!groups.has(key))groups.set(key,{key,evaluationId:row.evaluationId,version:row.version,title:row.title,course:row.course,rows:[]});
  groups.get(key).rows.push(row);
 }
 return [...groups.values()].map(group=>({...group,n:group.rows.length,meanPercent:group.rows.reduce((n,r)=>n+100*r.score/r.max,0)/group.rows.length}));
}
export function questionEvidence(rows){
 const evidence=new Map();
 for(const row of rows){
  if(!row.valid)continue;
  for(const q of row.breakdown){
   if(q.type==='open'||q.score===null)continue;
   const key=`${row.evaluationId}|${row.version}|${q.id}`;
   if(!evidence.has(key))evidence.set(key,{key,evaluationId:row.evaluationId,version:row.version,title:q.title,course:row.course,theme:row.theme,grade:row.grade,unitId:row.unitId,n:0,errors:0,students:new Set()});
   const item=evidence.get(key);item.n++;if(q.score===0){item.errors++;item.students.add(row.studentId);}
  }
 }
 return [...evidence.values()].map(e=>({...e,studentCount:e.students.size,students:undefined})).sort((a,b)=>b.errors-a.errors||a.title.localeCompare(b.title,'es'));
}
export function academicSummary(evaluations,rows){return {
 evaluations:evaluations.length,reviewed:rows.filter(r=>r.complete).length,
 pending:rows.filter(r=>r.status==='review-pending').length,
 published:rows.filter(r=>r.status==='published-demo').length,
 represented:new Set(rows.map(r=>r.studentId)).size,
 groups:compatibleGroups(rows),evidence:questionEvidence(rows)
};}
export function comparableEvolution(rows){
 const groups=compatibleGroups(rows);
 const timelines=groups.map(group=>({...group,rows:group.rows.filter(r=>r.date).sort((a,b)=>Date.parse(a.date)-Date.parse(b.date))}));
 // Different known instants and the same evaluation/version are required; never fabricate dates.
 return timelines.filter(g=>g.rows.length>=2&&new Set(g.rows.map(r=>r.date)).size>=2);
}
