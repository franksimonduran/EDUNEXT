export function safeCsvCell(value){
 let text=String(value??'');
 // Spreadsheet formula injection, including leading whitespace/control characters.
 if(/^[\s\u0000-\u001f]*[=+\-@]/u.test(text)||/^[\t\r\n]/.test(text))text="'"+text;
 return '"'+text.replace(/"/g,'""')+'"';
}
export function createDemoCsv(rows){return '\uFEFF'+rows.map(row=>row.map(safeCsvCell).join(';')).join('\r\n');}
export function downloadDemoCsv(text){const blob=new Blob([text],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='EDUNEXT-datos-de-demostracion.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
