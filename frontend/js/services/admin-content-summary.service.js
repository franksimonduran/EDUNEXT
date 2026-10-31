import {listDrafts} from './monitor-content-drafts.service.js';
import {validateContent} from './monitor-content-validation.service.js';
import {contentResources,checkResource} from './monitor-resources.service.js';
import {dateInPeriod} from './monitor-grades.service.js';
export async function adminContentSummary(courses,{period='all'}={}){
 const scope=d=>courses.some(c=>c.id===d.courseId&&c.grade===d.grade),drafts=(await listDrafts()).filter(d=>scope(d)&&dateInPeriod(d.updatedAt||d.createdAt||null,period)),active=drafts.filter(d=>d.state!=='archived'),resources=(await contentResources()).filter(r=>!r.grade||courses.some(c=>c.id===r.courseId&&c.grade===r.grade));
 const validations=await Promise.all(active.map(async d=>({id:d.id,title:d.title,validation:await validateContent(d)})));
 const entries=active.map(d=>({id:d.id,kind:d.kind,title:d.title,grade:d.grade,courseId:d.courseId,course:courses.find(c=>c.id===d.courseId)?.name.es||d.courseId,state:d.state,version:d.version,authorId:d.owner,date:d.updatedAt||d.createdAt||null,errors:validations.find(v=>v.id===d.id)?.validation.errors||[],warnings:validations.find(v=>v.id===d.id)?.validation.warnings||[]}));
 return {entries,drafts:active.length,ready:entries.filter(e=>e.state==='ready'),validated:entries.filter(e=>e.state==='ready'&&!e.errors.length).length,archived:drafts.length-active.length,institutionalRequests:null,authorizedPublished:null,resources,errors:validations.filter(v=>v.validation.errors.length)};
}
export async function verifyAdminResources(resources){const checked=await Promise.all(resources.map(async r=>({id:r.id,name:r.name,available:await checkResource(r)})));return {checked:checked.length,missing:checked.filter(r=>!r.available),checkedAt:new Date().toISOString()};}
