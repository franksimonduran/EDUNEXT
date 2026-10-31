export const remindersDemo = [];

export function listReminders(){ return remindersDemo.slice(); }
export function addReminder(r){ remindersDemo.push(r); }
export function updateReminder(id, patch){ const i=remindersDemo.findIndex(x=>x.id===id); if(i>=0) remindersDemo[i]={...remindersDemo[i],...patch}; }
export function deleteReminder(id){ const i=remindersDemo.findIndex(x=>x.id===id); if(i>=0) remindersDemo.splice(i,1); }
