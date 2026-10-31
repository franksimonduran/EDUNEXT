const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {saveFinalEvidence}=require('../tools/final-evidence.cjs');

(async()=>{
 const file='frontend/js/services/offline-study.service.js';
 const source=fs.readFileSync(file,'utf8');
 const {buildOfflineStudyGuide}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const item={grade:4,subject:'Matemática',title:'Fracciones',explanation:'<script>alert(1)</script>',easy:'Partes iguales',hint:'Observa',guide:'Explica',token:'PRIVATE_SENTINEL',conversation:'PRIVATE_CHAT'};
 const html=buildOfflineStudyGuide(4,[item]);
 assert.ok(html.includes('&lt;script&gt;'));
 assert.ok(!html.includes('<script'));
 assert.ok(!html.includes('PRIVATE_'));
 assert.ok(html.includes("default-src 'none'"));
 assert.ok(!/<(?:script|img|iframe|link)\b/i.test(html));
 assert.ok(html.includes('No es una IA generativa'));
 assert.ok(html.includes('width=device-width'));
 assert.throws(()=>buildOfflineStudyGuide(3,[item]));
 assert.throws(()=>buildOfflineStudyGuide(4,[]));
 assert.throws(()=>buildOfflineStudyGuide(5,[item]));
 assert.throws(()=>buildOfflineStudyGuide(4,Array(21).fill(item)));
 const hashes=Object.fromEntries([file,'frontend/js/student/tutor.js','tests/offline-study.cjs'].map(path=>[path,crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')]));
 saveFinalEvidence('OFFLINE_STUDY_TEST_RUN.json',{date:new Date().toISOString(),result:'PASS',scope:'Synthetic generator checks only; no mobile browser, real AI, pedagogical approval, DB or pilot verification.',hashes,decision:'NO-GO'});
 console.log('PASS: offline study generator, escaping, allowlist, grade validation, self-contained HTML and hashes. Mobile opening/download not verified.');
})().catch(error=>{console.error(error);process.exitCode=1;});
