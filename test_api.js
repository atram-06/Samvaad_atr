const http = require('http');
const fs = require('fs');
const path = require('path');

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body, headers: res.headers }));
        });
        req.on('error', reject);
        if (data) {
            if (typeof data === 'string' || Buffer.isBuffer(data)) {
                req.write(data);
            } else {
                // For multipart, we handle it separately
            }
        }
        req.end();
    });
}

async function test() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginData = JSON.stringify({ username: 'testuser_browser_1', password: 'password123' });
        const loginRes = await request({
            hostname: 'localhost',
            port: 3001,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': loginData.length
            }
        }, loginData);

        if (loginRes.statusCode !== 200) {
            console.error('Login failed:', loginRes.body);
            return;
        }

        const token = JSON.parse(loginRes.body).token;
        console.log('Login successful, token received.');

        // 2. Create Post (Multipart)
        console.log('Creating post...');
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        const caption = 'Test post from script';
        const fileContent = 'dummy image content';

        let body = `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="caption"\r\n\r\n`;
        body += `${caption}\r\n`;
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="file"; filename="test.txt"\r\n`;
        body += `Content-Type: text/plain\r\n\r\n`;
        body += `${fileContent}\r\n`;
        body += `--${boundary}--\r\n`;

        const postRes = await request({
            hostname: 'localhost',
            port: 3001,
            path: '/api/posts',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': Buffer.byteLength(body)
            }
        }, body);

        if (postRes.statusCode === 201) {
            console.log('Post created successfully:', postRes.body);
        } else {
            console.error('Post creation failed:', postRes.statusCode, postRes.body);
        }

    } catch (err) {
        console.error('Test failed:', err);
    }
}

test();
