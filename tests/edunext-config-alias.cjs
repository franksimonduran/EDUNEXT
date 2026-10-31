const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const {saveFinalEvidence}=require('../tools/final-evidence.cjs');
const source=fs.readFileSync('frontend/js/core/config.js','utf8').replace('export const config','globalThis.result');
function evaluate(values){const context=vm.createContext(values);vm.runInContext(source,context);return context.result.apiBaseUrl;}
assert.equal(evaluate({}),'/api/v1');
assert.equal(evaluate({AITHRON_CONFIG:{apiBaseUrl:'http://127.0.0.1:8000/api/v1/'}}),'http://127.0.0.1:8000/api/v1');
assert.equal(evaluate({EDUNEXT_CONFIG:{apiBaseUrl:'/edunext/api'}}),'/edunext/api');
assert.equal(evaluate({EDUNEXT_CONFIG:{apiBaseUrl:'/new'},AITHRON_CONFIG:{apiBaseUrl:'/old'}}),'/new');
assert.throws(()=>evaluate({EDUNEXT_CONFIG:{apiBaseUrl:'//untrusted.invalid'}}));
const report={date:new Date().toISOString(),pass:true,scope:'Public config EDUNEXT alias, legacy fallback, precedence and existing validation. No data/storage migration.'};
if(process.env.AITHRON_FINAL_VALIDATION==='1')saveFinalEvidence('EDUNEXT_CONFIG_ALIAS.json',report);
console.log(JSON.stringify(report,null,2));
