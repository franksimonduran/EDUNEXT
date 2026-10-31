export function calculateScore(records) {
 const answered=records.filter(record=>record.attempts?.length);
 const correct=answered.filter(record=>record.attempts[0].correct).length;
 const total=answered.length;
 const percent=total?Math.round(correct/total*100):0;
 return {answered:total,correct,incorrect:total-correct,percent,hints:answered.reduce((sum,record)=>sum+(record.hintsUsed??0),0),points:correct*10,stars:total?1+Number(percent>=50)+Number(percent>=80):0};
}
