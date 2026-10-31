// Loopback-only development host: static frontend + same-origin API proxy.
// Does not start FastAPI, read dotenv, connect to PostgreSQL or handle Gemini keys.
const http = require('node:http');
const {createDemoServer} = require('./demo-server.cjs');
const HOP = new Set(['connection','keep-alive','proxy-authenticate','proxy-authorization','te','trailer','transfer-encoding','upgrade','proxy-connection']);
function cleanHeaders(headers) {
 const denied = new Set([...HOP, ...String(headers.connection || '').toLowerCase().split(',').map(v => v.trim())]);
 return Object.fromEntries(Object.entries(headers).filter(([key]) => !denied.has(key.toLowerCase()) && !key.toLowerCase().startsWith('x-forwarded-') && key.toLowerCase() !== 'forwarded'));
}
function createDevServer({apiPort = 8000} = {}) {
 if (!Number.isInteger(apiPort) || apiPort < 1 || apiPort > 65535) throw new Error('Puerto API invalido');
 const staticServer = createDemoServer();
 return http.createServer((req, res) => {
  // Reject DNS rebinding and absolute-form proxy requests.
  if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/i.test(req.headers.host || '') || !req.url.startsWith('/') || req.url.startsWith('//') || req.url.includes('\\')) {
   res.writeHead(400); return res.end('Solicitud local no valida');
  }
  const pathname = req.url.split('?')[0];
  if (pathname !== '/api/v1' && !pathname.startsWith('/api/v1/')) return staticServer.emit('request', req, res);
  const fail = (status, message) => {
   if (res.headersSent) return res.destroy();
   res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
   res.end(JSON.stringify({detail:message}));
  };
  const maximum = 1024 * 1024;
  if (Number(req.headers['content-length']) > maximum) return fail(413, 'Solicitud demasiado grande');
  const headers = cleanHeaders(req.headers); headers.host = `127.0.0.1:${apiPort}`;
  const upstream = http.request({hostname:'127.0.0.1',port:apiPort,path:req.url,method:req.method,headers}, response => {
   const responseHeaders = cleanHeaders(response.headers);
   responseHeaders['cache-control'] = 'no-store';
   res.writeHead(response.statusCode, responseHeaders);
   response.on('error', () => res.destroy());
   response.pipe(res);
  });
  const timer = setTimeout(() => { fail(504, 'El backend no respondio a tiempo'); upstream.destroy(); }, 65000);
  let received = 0;
  req.on('data', chunk => { received += chunk.length; if (received > maximum) { fail(413, 'Solicitud demasiado grande'); upstream.destroy(); req.unpipe(upstream); req.resume(); } });
  upstream.on('error', () => fail(503, 'Backend no disponible en el puerto configurado. Inicia FastAPI en un entorno autorizado.'));
  res.on('close', () => { clearTimeout(timer); upstream.destroy(); });
  req.on('aborted', () => upstream.destroy());
  req.pipe(upstream);
 });
}
if (require.main === module) {
 const readPort = (name, fallback) => { const i = process.argv.indexOf(name); return i < 0 ? fallback : Number(process.argv[i + 1]); };
 const port = readPort('--port', 8080), apiPort = readPort('--api-port', 8000);
 if (!Number.isInteger(port) || port < 1 || port > 65535 || port === apiPort) throw new Error('Puertos locales invalidos o iguales');
 const server = createDevServer({apiPort});
 server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? 'Puerto ocupado. Deten el servidor estatico anterior con Ctrl+C.' : 'No se pudo iniciar el servidor local.'); process.exitCode = 1; });
 server.listen(port, '127.0.0.1', () => console.log(`Frontend: http://127.0.0.1:${port}/login.html\nAPI: /api/v1 -> http://127.0.0.1:${apiPort}/api/v1\nFastAPI no se inicia automaticamente.`));
}
module.exports = {createDevServer};
