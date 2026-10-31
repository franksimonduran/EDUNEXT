const KEY='aithron.demo.activities.v1';
const memory={version:1,sessions:[]};
let storageAvailable=true;
function read() {
 if(!storageAvailable)return memory;
 try {
  const raw=sessionStorage.getItem(KEY);
  if(!raw)return memory;
  const data=JSON.parse(raw);
  if(data.version!==1||!Array.isArray(data.sessions))return memory;
  memory.sessions=data.sessions.filter(s=>s&&typeof s.id==='string'&&typeof s.activityId==='string'&&['practice','game'].includes(s.kind)&&[4,5,6].includes(s.grade)&&Array.isArray(s.records)&&s.records.every(r=>r&&typeof r.id==='string'&&Array.isArray(r.attempts)&&r.attempts.every(a=>a&&typeof a.correct==='boolean')&&Number.isInteger(r.hintsUsed)&&r.hintsUsed>=0)).slice(-40);
 }catch{storageAvailable=false;}
 return memory;
}
export function saveSession(session) {
 const data=read();
 data.sessions=data.sessions.filter(item=>item.id!==session.id);
 data.sessions.push(structuredClone(session));data.sessions=data.sessions.slice(-40);
  try{sessionStorage.setItem(KEY,JSON.stringify(data));storageAvailable=true;return true;}catch{storageAvailable=false;return false;}
}
export function newSession(activity,originLesson=null) {
 const session={id:crypto.randomUUID(),activityId:activity.id,kind:activity.kind,grade:activity.grade,index:0,status:'in-progress',records:[],drafts:{},game:{},originLesson,createdAt:Date.now()};
 saveSession(session);return session;
}
export function getSession(id) {return structuredClone(read().sessions.find(session=>session.id===id)??null);}
export function listSessions() {return structuredClone(read().sessions);}
export function canStoreSession(){return storageAvailable;}
