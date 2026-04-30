const http = require('http');
const fs = require('fs');
const path = require('path');

// Login first
const loginData = JSON.stringify({
    username: 'verified_user',
    password: 'password123'
});

const loginReq = http.request({
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
    }
}, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            const { token } = JSON.parse(body);
            console.log('Login successful');
            uploadPost(token);
        } else {
            console.error('Login failed:', body);
        }
    });
});

loginReq.write(loginData);
loginReq.end();

function uploadPost(token) {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const filePath = path.join(__dirname, 'dummy.jpg');

    // Create dummy file if not exists
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, 'dummy image content');
    }

    const fileContent = fs.readFileSync(filePath);

    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="caption"\r\n\r\n`;
    body += `Test Caption\r\n`;

    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="file"; filename="dummy.jpg"\r\n`;
    body += `Content-Type: image/jpeg\r\n\r\n`;

    const footer = `\r\n--${boundary}--\r\n`;

    const options = {
        hostname: '127.0.0.1',
        port: 3001,
        path: '/api/posts',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': Buffer.byteLength(body) + fileContent.length + Buffer.byteLength(footer)
        }
    };

    const req = http.request(options, (res) => {
        console.log(`UPLOAD STATUS: ${res.statusCode}`);
        let resBody = '';
        res.on('data', chunk => resBody += chunk);
        res.on('end', () => console.log('UPLOAD BODY:', resBody));
    });

    req.write(body);
    req.write(fileContent);
    req.write(footer);
    req.end();
}
