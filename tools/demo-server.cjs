const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = fs.realpathSync(path.join(__dirname, '../frontend'));
// Local compatibility routes reuse the user's original PNGs without duplicating them.
const aliases={'/assets/images/branding/mark.svg':'/assets/images/Icono.png','/assets/images/branding/open-book.svg':'/assets/images/Logo.png','/favicon.ico':'/assets/images/Icono.png'};
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.webp':'image/webp','.wav':'audio/wav','.mp3':'audio/mpeg','.woff2':'font/woff2','.wasm':'application/wasm'};
function createDemoServer({handler} = {}) {
 return http.createServer(async (req, res) => {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  // Optional loopback-only preview API. Default demo remains read-only static hosting.
  if (handler && handler(req, res)) return;
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});return res.end();}
  try {
   let pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   // Reuse an alias only when the original asset is missing. Real SVGs
   // must retain their correct content type for the offline package verifier.
   if(aliases[pathname]&&!fs.existsSync(path.join(root,pathname)))pathname=aliases[pathname];
   if(pathname.includes('\\') || pathname.includes('\0'))throw new Error('Invalid path');
   const file = await fs.promises.realpath(path.join(root, pathname === '/' ? 'demo.html' : pathname));
   const stat = await fs.promises.stat(file);
   if(!file.startsWith(root + path.sep) || !stat.isFile())throw new Error('Not a file');
   res.setHeader('Content-Type',mime[path.extname(file)] || 'application/octet-stream');
   // The local demo serves these PUBLIC resources without private data.
   // All other routes (including optional API handlers) remain no-store.
   const demoStatic=/^\/(?:index\.html|demo\.html|offline-demo\.html|offline\.html|demo\.webmanifest|student\/(?:recorrido-demo|progreso-demo|tutor-demo|traductor-demo|pronuncia-demo)\.html|monitor\/(?:seguimiento-demo|herramientas-ia-demo)\.html|admin\/(?:informe-demo|herramientas-ia-demo)\.html|css\/pages\/demo(?:-story|-journeys-d2|-ai-d3|-offline|-polish-d5)?\.css|js\/demo\/[a-z0-9-]+\.js|js\/offline\/pwa\.js|js\/services\/(?:translation\.service|offline-study\.service)\.js|js\/data\/(?:dictionary-demo|languages|pronunciation-demo)\.data\.js|assets\/images\/(?:Icono\.png|Logo%20Horizontal\.png|Logo Horizontal\.png|branding\/(?:mark\.svg|edunext-(?:192|512)\.png)))$/i;
   const urlPath=new URL(req.url,'http://localhost').pathname;
   if(demoStatic.test(urlPath))res.setHeader('Cache-Control','no-cache');
   res.setHeader('Accept-Ranges','bytes');
   let start=0,end=stat.size-1,status=200;
   const range=req.headers.range;
   if(range){
    const match=/^bytes=(\d*)-(\d*)$/.exec(range);
    if(!match||(match[1]===''&&match[2]===''))throw new Error('Invalid range');
    if(match[1]===''){start=Math.max(0,stat.size-Number(match[2]));end=stat.size-1;}
    else{start=Number(match[1]);end=match[2]===''?stat.size-1:Math.min(Number(match[2]),stat.size-1);}
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});return res.end();}
    status=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${stat.size}`);
   }
   res.setHeader('Content-Length',end-start+1);
   res.writeHead(status);
   if(req.method==='HEAD')return res.end();
   const stream=fs.createReadStream(file,{start,end});
   stream.on('error',()=>{if(!res.headersSent)res.writeHead(500);res.destroy();});
   stream.pipe(res);
  } catch {res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Recurso no disponible en la demo local.');}
 });
}
if(require.main===module){
 const flag=process.argv.indexOf('--port');const port=Number(flag<0?8080:process.argv[flag+1]);
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Puerto inválido');
 const server=createDemoServer();server.on('error',e=>{console.error(e.message);process.exitCode=1;});
 server.listen(port,'127.0.0.1',()=>console.log(`Demo local: http://127.0.0.1:${port}/demo.html`));
}
module.exports={createDemoServer,aliases};
