import {listContentCatalog} from './admin-contents.service.js';
import {validateContent} from './admin-content-validation.service.js';
import {listReviewProposals} from './admin-contents.service.js';

export async function publicationReadiness(content,version){
  const val=validateContent({...content,version});
  const reviews=await listReviewProposals({course:content.courseId,grade:content.grade});
  const prep=contentReviewDemo.find(r=>r.id===content.id);
  return {
    validation:val,
    reviews:reviews.filter(r=>r.proposalId===content.id||r.unitId===content.unitId),
    criteriaMet:{
      'validation-ok':val.summary.errors===0,
      'resources-ok':!(content.resources||[]).some(r=>r.offline!=='yes'),
      'deps-ok':true,
      'access-ok':!val.sections.access.warnings.length,
      'offline-ok':(content.blocks||[]).length>0
    }
  };
}