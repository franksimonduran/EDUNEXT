const {chromium}=require('C:/Users/Frank/AppData/Local/Temp/opencode/node_modules/playwright');
const {spawn}=require('node:child_process');
const server=spawn('python',['-m','http.server','8134','--bind','127.0.0.1'],{cwd:'D:/Programing/ATHRON EDU1/frontend',stdio:'ignore'});
setTimeout(async()=>{
 try{
  const browser=await chromium.launch();
  const page=await browser.newPage();
  const logs=[];
  page.on('pageerror',e=>console.log('PAGEERROR:',e.message));
  page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE ERROR:',m.text());});
  page.on('console',m=>{if(m.type()==='log')console.log('CONSOLE LOG:',m.text());});
  await page.goto('http://127.0.0.1:8134/admin/movimientos-academicos.html',{waitUntil:'load',timeout:15000});
  await page.waitForSelector('#admin-content[aria-busy="false"]',{timeout:10000});
  await page.waitForTimeout(2000);
  const logs=await page.evaluate(()=>{return window.__debugLogs||[];});
  console.log('Debug logs:',logs);
  const html=await page.content();
  console.log('Has movementSummary in HTML:',html.includes('Movimientos locales'));
  console.log('Has toolbar:',html.includes('directory-toolbar'));
  console.log('Has movement-form:',html.includes('id="movement-form"'));
  console.log('Has movement-filters:',html.includes('id="movement-filters"'));
  console.log('Has movement-validation:',html.includes('id="movement-validation"'));
  console.log('Has directory-summary:',html.includes('directory-summary'));
  console.log('Has strong tags:',(document.body.innerHTML.match(/<strong>/g)||[]).length);
  const adminContent=document.querySelector('#admin-content');
  console.log('Admin content innerHTML length:',adminContent?adminContent.innerHTML.length:0);
  console.log('Admin content innerHTML:',adminContent?adminContent.innerHTML.substring(0,500):'NO ADMIN CONTENT');
  await browser.close();
 }catch(e){console.error(e);}
 finally{server.kill();}
},2000);