const io = require('socket.io-client');

const API_URL = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

async function getOrCreateUser(username, email) {
    try {
        const regRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                email,
                password: 'password123',
                fullname: username
            })
        });

        if (regRes.ok) {
            console.log(`Registered ${username}`);
        } else {
            const err = await regRes.json();
            if (regRes.status === 400) {
                // User likely exists
            } else {
                console.error(`Failed to register ${username}:`, err);
            }
        }
    } catch (err) {
        console.error(`Register network error for ${username}:`, err.message);
    }

    try {
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                password: 'password123'
            })
        });

        if (!loginRes.ok) {
            const err = await loginRes.json();
            throw new Error(`Login failed: ${loginRes.status} ${JSON.stringify(err)}`);
        }

        return await loginRes.json();
    } catch (err) {
        console.error(`Login failed for ${username}:`, err.message);
        throw err;
    }
}

async function testRealTimeChat() {
    try {
        const timestamp = Date.now();
        const user1Name = `testuser1_${timestamp}`;
        const user2Name = `testuser2_${timestamp}`;

        console.log('1. Getting users...');
        const user1 = await getOrCreateUser(user1Name, `${user1Name}@example.com`);
        const user2 = await getOrCreateUser(user2Name, `${user2Name}@example.com`);

        console.log(`User 1: ${user1.user.id}, User 2: ${user2.user.id}`);

        console.log('2. Connecting sockets...');
        const socket1 = io(SOCKET_URL, { auth: { token: user1.token } });
        const socket2 = io(SOCKET_URL, { auth: { token: user2.token } });

        await new Promise((resolve, reject) => {
            let connected = 0;
            const check = () => { connected++; if (connected === 2) resolve(); };
            socket1.on('connect', () => { console.log('Socket 1 connected'); check(); });
            socket2.on('connect', () => { console.log('Socket 2 connected'); check(); });
            socket1.on('connect_error', (err) => reject(new Error('Socket 1 error: ' + err.message)));
            socket2.on('connect_error', (err) => reject(new Error('Socket 2 error: ' + err.message)));
            setTimeout(() => reject(new Error('Timeout connecting sockets')), 5000);
        });

        console.log('3. Setting up listeners...');
        const messagePromise = new Promise((resolve, reject) => {
            socket2.on('message:new', (msg) => {
                console.log('Socket 2 received message:', msg);
                if (msg.text === 'Hello from User 1') {
                    resolve();
                }
            });
            setTimeout(() => reject(new Error('Timeout waiting for message')), 5000);
        });

        console.log('4. User 1 sending initial message to create conversation...');
        let conversationId;
        await new Promise((resolve, reject) => {
            socket1.emit('message:new', {
                tempId: 'init-' + Date.now(),
                receiverId: user2.user.id,
                text: 'Init Conversation'
            }, (ack) => {
                if (ack.error) reject(new Error(ack.error));
                else {
                    conversationId = ack.data.conversationId;
                    console.log('Conversation created:', conversationId);
                    resolve();
                }
            });
        });

        console.log('5. User 2 joining conversation room...');
        socket2.emit('conversation:join', conversationId);
        // Give it a moment to join
        await new Promise(r => setTimeout(r, 500));

        console.log('6. User 1 sending message to User 2 (Room Broadcast)...');
        socket1.emit('message:new', {
            tempId: 'test-' + Date.now(),
            conversationId: conversationId, // Now we have the ID
            receiverId: user2.user.id,
            text: 'Hello from User 1'
        }, (ack) => {
            console.log('Socket 1 received ack:', ack);
        });

        await messagePromise;
        console.log('SUCCESS: Real-time message delivered via Room!');

        socket1.disconnect();
        socket2.disconnect();

    } catch (err) {
        console.error('TEST FAILED:', err.message);
    }
}

testRealTimeChat();
