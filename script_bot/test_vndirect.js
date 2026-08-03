// FILE: script_bot/test_vndirect.js
const https = require('https');

const url = 'https://finfo-api.vndirect.com.vn/v4/macro_observations?q=itemCode:CPI_YOY&sort=-date&size=1';

console.log('Bắt đầu bài test kết nối tới VNDirect API...');
console.log('Môi trường:', process.version);
console.log('URL:', url);

const req = https.get(url, {
    rejectUnauthorized: false,
    timeout: 30000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
        'Connection': 'keep-alive'
    }
}, res => {
    console.log('\n[RESPONSE] STATUS:', res.statusCode);
    console.log('[RESPONSE] HEADERS:', JSON.stringify(res.headers, null, 2));

    let data = '';

    res.on('data', chunk => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('\n[RESPONSE] BODY (1000 chars):');
        console.log(data.substring(0, 1000));
        console.log('\nBài test kết thúc thành công.');
    });
});

req.on('socket', socket => {
    socket.on('lookup', (err, address, family, host) => {
        if (err) {
            console.error('\n[SOCKET] DNS Lookup Error:', err.message);
        } else {
            console.log(`\n[SOCKET] DNS Resolved: ${host} -> ${address} (IPv${family})`);
        }
    });

    socket.on('connect', () => {
        console.log('[SOCKET] TCP CONNECTED');
    });

    socket.on('secureConnect', () => {
        console.log('[SOCKET] TLS CONNECTED (Handshake successful)');
    });
});

req.on('timeout', () => {
    console.error('\n[ERROR] REQUEST TIMEOUT (30s)');
    req.destroy();
});

req.on('error', err => {
    console.error('\n[ERROR] REQUEST ERROR:', err.message);
    if (err.code) console.error('[ERROR] Code:', err.code);
});
