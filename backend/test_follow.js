const http = require('http');

// Login first to get token
const loginData = JSON.stringify({
    username: 'verified_user',
    password: 'password123'
});

const loginOptions = {
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
    }
};

const loginReq = http.request(loginOptions, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            const { token } = JSON.parse(body);
            console.log('Login successful, token obtained.');
            followUser(token);
        } else {
            console.error('Login failed:', body);
        }
    });
});

loginReq.write(loginData);
loginReq.end();

function followUser(token) {
    const followOptions = {
        hostname: '127.0.0.1',
        port: 3001,
        path: '/api/users/2/follow', // Assuming user ID 2 exists or we'll get 404, but 500 is what we want to repro
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    const followReq = http.request(followOptions, (res) => {
        console.log(`FOLLOW STATUS: ${res.statusCode}`);
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log(`FOLLOW BODY: ${body}`);
        });
    });

    followReq.end();
}
