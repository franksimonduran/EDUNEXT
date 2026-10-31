import {listContentReviews} from './admin-content-review.service.js';
import {listPublicationPrep} from './admin-content-review.service.js';

export async function historyList(filters={}){
  const reviews=await listContentReviews();
  let rows=reviews.map(r=>({id:r.id,content:r.proposalTitle||r.proposalId,version:r.version,type:r.type||'review',revisor:r.revisor||'demo-admin',date:r.updatedAt,category:r.category||'estructural',obs:(r.observations||[]).map(o=>o.text).join(' | '),state:r.status||'guardado',raw:r}));
  if(filters.content)rows=rows.filter(r=>r.content.toLowerCase().includes(filters.content.toLowerCase()));
  if(filters.category)rows=rows.filter(r=>r.category===filters.category);
  if(filters.state)rows=rows.filter(r=>r.state===filters.state);
  if(filters.q){const q=filters.q.toLowerCase();rows=rows.filter(r=>r.obs.toLowerCase().includes(q));}
  const preps=await listPublicationPrep();
  const prepRows=preps.map(p=>({id:p.id,content:p.contentTitle||p.contentId,version:p.version,type:'preparation',revisor:'demo-admin',date:p.updatedAt,category:'preparacion',obs:'Preparación de publicación guardada localmente',state:'guardado',raw:p}));
  return [...prepRows,...rows].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
}
