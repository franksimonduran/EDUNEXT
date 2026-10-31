export const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const includes=(value,search)=>!search||normalize(value).includes(normalize(search));
export function filterClassrooms(rows,filter={}){
 const f={search:'',grade:'',section:'',period:'all',state:'',monitor:'',...filter};
 return rows.filter(r=>(!f.grade||Number(r.grade)===Number(f.grade))&&(!f.section||r.section===f.section)&&(f.period==='all'||f.period==='undated'&&!r.periodId||r.periodId===f.period)&&(!f.state||f.state==='base'&&r.state==='base-demo'||f.state==='draft'&&r.state!=='base-demo'||r.state==='incomplete'&&r.state==='incomplete'||r.state===r.state)&&(!f.monitor||(r.monitorIds||[]).includes(f.monitor))&&includes([r.code,r.name,r.gradeName,r.section].join(' '),f.search));
}
export function filterEnrollments(rows,filter={}){
 const f={search:'',grade:'',room:'',period:'all',state:'',...filter};
 return rows.filter(r=>(!f.grade||Number(r.grade)===Number(f.grade))&&(!f.room||r.roomId===f.room)&&(f.period==='all'||f.period==='undated'&&!r.periodId||r.periodId===f.period)&&(!f.state||r.state===f.state)&&includes([r.studentAlias,r.studentCode,r.roomLabel,r.code].join(' '),f.search));
}
export function filterAssignments(rows,filter={}){
 const f={search:'',course:'',room:'',grade:'',period:'all',state:'',...filter};
 return rows.filter(r=>(!f.course||r.courseKey===f.course)&&(!f.room||r.roomId===f.room)&&(!f.grade||Number(r.grade)===Number(f.grade))&&(f.period==='all'||f.period==='undated'&&!r.periodId||r.periodId===f.period)&&(!f.state||r.state===f.state)&&includes([r.monitorAlias,r.monitorCode,r.courseName,r.roomLabel].join(' '),f.search));
}
export function filterMovements(rows,filter={}){
 const f={search:'',type:'',period:'all',state:'',...filter};
 return rows.filter(r=>(!f.type||r.movementType===f.type)&&(f.period==='all'||r.periodId===f.period)&&(!f.state||r.state===f.state)&&includes([r.studentAlias,r.studentCode,r.originLabel,r.destinationLabel].join(' '),f.search));
}
export function sortRows(rows,key='alias',direction='asc'){
 const value=row=>({alias:row.alias||row.studentAlias||row.monitorAlias||row.name||'',code:row.code||row.studentCode||row.monitorCode||'',grade:Number(row.grade||0),students:Number(row.studentCount||0),period:row.periodId||'',state:row.state||'',date:row.updatedAt||row.proposedDate||''}[key]??'');
 return [...rows].sort((a,b)=>String(value(a)).localeCompare(String(value(b)),'es',{numeric:true})||String(a.id).localeCompare(String(b.id))*(direction==='desc'?-1:1));
}
export const paginate=(rows,page=1,size=10)=>{const count=Math.max(1,Math.ceil(rows.length/size));const current=Math.min(Math.max(1,page),count);return {rows:rows.slice((current-1)*size,current*size),page:current,count,total:rows.length};};
