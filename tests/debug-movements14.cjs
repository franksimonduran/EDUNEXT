const {chromium}=require('C:/Users/Frank/AppData/Local/Temp/opencode/node_modules/playwright');
const {spawn}=require('node:child_process');
const server=spawn('python',['-m','http.server','8137','--bind','127.0.0.1'],{cwd:'D:/Programing/ATHRON EDU1/frontend',stdio:'ignore'});
setTimeout(async()=>{
 try{
  const browser=await require('C:/Users/Frank/AppData/Local/Temp/opencode/node_modules/playwright').chromium.launch();
  const page=await browser.newPage();
  page.on('pageerror',e=>console.log('PAGEERROR:',e.message));
  page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE ERROR:',m.text());});
  await page.goto('http://127.0.0.1:8137/admin/movimientos-academicos.html',{waitUntil:'load',timeout:15000});
  await page.waitForSelector('#admin-content[aria-busy="false"]',{timeout:10000});
  await new Promise(r=>setTimeout(r,1000));
  const errors=await page.evaluate(()=>{const errs=[];const orig=console.error;console.error=(...args)=>errs.push(args.join(' '));return errs;});
  console.log('Console errors:',errors);
  const html=await page.content();
  console.log('Has directory-summary:',html.includes('directory-summary'));
  console.log('Has strong:',html.includes('<strong>'));
  console.log('HTML length:',html.length);
  const summaryMatch=html.match(/<section class="directory-summary"[^>]*>[\s\S]*?<\/section>/);
  console.log('Directory summary section:',summaryMatch?summaryMatch[0].substring(0,500):'NOT FOUND');
  await browser.close();
 }catch(e){console.error(e);}
 finally{server.kill();}
},2000);