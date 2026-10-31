export function getEventStatusClass(status){
 if(status==='completada') return 'ev--done';
 if(status==='vencida') return 'ev--late';
 if(status==='proxima') return 'ev--up';
 return 'ev--pend';
}
