import {escapeHTML as esc} from './student-ui.js';
import {tt} from '../student/tutor-i18n.js';
import {text} from '../student/i18n.js';
export function renderTutorConversations(conversations,activeId,examples){
 return `<ul>${conversations.map(conversation=>{
  const example=examples.find(item=>item.id===conversation.exampleId);
  return `<li><button type="button" data-tutor-conversation="${conversation.id}" aria-pressed="${conversation.id===activeId}"><span>${tt('conversation')} ${conversation.number}</span><small>${example?esc(text(example.subject)):tt('emptyConversation')}</small></button></li>`;
 }).join('')}</ul>`;
}
