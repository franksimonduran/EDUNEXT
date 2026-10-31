export function remainingTime(startedAtIso, durationMinutes){
 const start = new Date(startedAtIso).getTime();
 const end = start + durationMinutes*60000;
 const now = Date.now();
 if(now >= end) return 0;
 return Math.floor((end - now)/1000);
}

export function formatTime(seconds){
 if(seconds <= 0) return '00:00';
 const m = Math.floor(seconds/60).toString().padStart(2,'0');
 const s = (seconds%60).toString().padStart(2,'0');
 return `${m}:${s}`;
}
