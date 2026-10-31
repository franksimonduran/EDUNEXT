const {chromium}=require('C:/Users/Frank/AppData/Local/Temp/opencode/node_modules/playwright');
const {spawn}=require('node:child_process');
const server=spawn('python',['-m','http.server','8134','--bind','127.0.0.1'],{cwd:'D:/Programing/ATHRON EDU1/frontend',stdio:'ignore'});
setTimeout(async()=>{
 try{
  const browser=await chromium.launch();
  const page=await browser.newPage();
  page.on('pageerror',e=>console.log('PAGEERROR:',e.message));
  page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE ERROR:',m.text());});
  await page.goto('http://127.0.0.1:8134/admin/movimientos-academicos.html',{waitUntil:'load',timeout:15000});
  await page.waitForSelector('#admin-content[aria-busy="false"]',{timeout:10000});
  await page.waitForTimeout(2000);
  const debugInfo=await page.evaluate(()=>{
    const adminContent=document.querySelector('#admin-content');
    return {
      innerHTML: adminContent?adminContent.innerHTML.substring(0,1000):'NO ADMIN CONTENT',
      hasMovementSummary: document.body.innerHTML.includes('Movimientos locales'),
      hasToolbar: document.body.innerHTML.includes('directory-toolbar'),
      hasMovementForm: document.querySelector('#movement-form')!==null,
      hasMovementFilters: document.querySelector('#movement-filters')!==null,
      hasMovementValidation: document.querySelector('#movement-validation')!==null,
      hasDirectorySummary: document.body.innerHTML.includes('directory-summary'),
      strongCount: (document.body.innerHTML.match(/<strong>/g)||[]).length,
      adminContentHTML: document.querySelector('#admin-content')?.innerHTML.substring(0,500)||'NO ADMIN CONTENT',
      bodyHTML: document.body.innerHTML.substring(0,500)
    };
  });
  console.log('Debug info:',JSON.stringify(debugInfo,null,2));
  await browser.close();
 }catch(e){console.error(e);}
 finally{server.kill();}
},2000);