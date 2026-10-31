const http = require('http');

function request(path) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port: 8000,
            path: path,
            method: 'GET'
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
        });
        req.on('error', reject);
        req.end();
    });
}

async function test() {
    const server = require('child_process').spawn('python', ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'], { cwd: 'D:/Programing/ATHRON EDU1/backend' });
    
    await new Promise(r => setTimeout(r, 3000));
    
    try {
        const endpoints = [
            '/api/v1/health/live',
            '/api/v1/health/ready',
            '/api/v1/meta',
            '/api/v1/meta/version',
            '/api/v1/system/status'
        ];
        
        for (const path of endpoints) {
            const res = await fetch(`http://127.0.0.1:8000${path}`);
            const data = await res.json();
            console.log(`${path}: ${res.status} -`, JSON.stringify(data));
            if (!res.ok) throw new Error(`Failed: ${path}`);
        }
        
        console.log('All endpoints working!');
    } catch (e) {
        console.error('Test failed:', e);
        process.exitCode = 1;
    }
}

test().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });