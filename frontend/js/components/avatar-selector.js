import { avatarsData } from '../data/avatars.data.js';
import { escapeHTML as esc } from './student-ui.js';
import {getLocale} from '../i18n/i18n.js';

export function renderAvatarSelector(selected='av-1'){
 return `<div class="avatar-grid">
  ${avatarsData.map(a=>`<button type="button" class="avatar-opt ${a.id===selected?'selected':''}" data-av="${a.id}" aria-pressed="${a.id===selected}" aria-label="${esc((getLocale()==='en'?a.labelEn+' — '+a.descEn:a.label+' — '+a.desc))}"><span aria-hidden="true">${renderAvatar(a.id)}</span><span>${esc(getLocale()==='en'?a.labelEn:a.label)}</span></button>`).join('')}
 </div>`;
}
export function renderAvatar(id='av-1'){
 const index=Math.max(0,avatarsData.findIndex(a=>a.id===id)),glyphs=['✦','▤','⚗','∑','✧'];
  const a=avatarsData[index],label=getLocale()==='en'?a.labelEn+' — '+a.descEn:a.label+' — '+a.desc;
  return `<svg class="profile-avatar-art" viewBox="0 0 100 100" role="img" aria-label="${esc(label)}"><circle cx="50" cy="50" r="48" fill="var(--avatar-background,#ede5fc)"/><path d="M20 86c2-24 58-24 60 0" fill="var(--avatar-ink,#7145bf)"/><circle cx="50" cy="39" r="21" fill="#f1c8a5"/><path d="M29 36c-2-30 45-28 43 2-8-4-15-11-21-12-7 8-13 10-22 10" fill="#25385c"/><circle cx="43" cy="41" r="2" fill="#25385c"/><circle cx="57" cy="41" r="2" fill="#25385c"/><path d="M44 51q6 5 12 0" fill="none" stroke="#663d31" stroke-width="2"/><circle cx="78" cy="75" r="17" fill="white"/><text x="78" y="82" text-anchor="middle" font-size="23" fill="#18469e">${glyphs[index]}</text></svg>`;
}
