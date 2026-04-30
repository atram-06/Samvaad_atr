const io = require('socket.io-client');
const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

async function runTest() {
    try {
        // 1. Login Users
        console.log('Logging in users...');
        const login1 = await axios.post(`${API_URL}/auth/login`, { username: 'alice', password: 'password123' });
        const token1 = login1.data.token;
        const user1Id = login1.data.user.id;

        const login2 = await axios.post(`${API_URL}/auth/login`, { username: 'bob', password: 'password123' });
        const token2 = login2.data.token;
        const user2Id = login2.data.user.id;

        console.log(`Logged in: Alice (${user1Id}) and Bob (${user2Id})`);

        // 2. Connect Sockets
        console.log('Connecting sockets...');
        const socket1 = io(SOCKET_URL, { auth: { token: token1 } });
        const socket2 = io(SOCKET_URL, { auth: { token: token2 } });

        await new Promise(resolve => {
            let connected = 0;
            const check = () => {
                connected++;
                if (connected === 2) resolve();
            };
            socket1.on('connect', check);
            socket2.on('connect', check);
        });
        console.log('Sockets connected.');

        // 3. Test Flow
        // Alice sends message to Bob
        const messageText = 'Hello Bob, this is Alice!';
        const tempId = 'temp-' + Date.now();

        console.log('Alice sending message...');
        socket1.emit('message:new', {
            tempId,
            conversationId: null, // New conversation
            receiverId: user2Id,
            text: messageText
        }, (ack) => {
            console.log('Alice received Ack:', ack);
            if (ack.error) {
                console.error('Ack Error:', ack.error);
                process.exit(1);
            }
        });

        // Bob listens for message
        socket2.on('message:new', (msg) => {
            console.log('Bob received message:', msg);

            if (msg.text === messageText && msg.senderId === user1Id) {
                console.log('Message content verified.');

                // Bob marks as read
                console.log('Bob marking as read...');
                socket2.emit('message:read', {
                    messageId: msg.id,
                    conversationId: msg.conversationId,
                    senderId: msg.senderId
                });
            } else {
                console.error('Message content mismatch!');
            }
        });

        // Alice listens for read receipt
        socket1.on('message:read', (receipt) => {
            console.log('Alice received read receipt:', receipt);
            console.log('TEST PASSED: Full 1:1 flow verified.');

            socket1.disconnect();
            socket2.disconnect();
            process.exit(0);
        });

        // Timeout
        setTimeout(() => {
            console.error('TEST TIMEOUT');
            process.exit(1);
        }, 10000);

    } catch (err) {
        console.error('Test failed:', err.message);
        if (err.response) console.error('API Response:', err.response.data);
        process.exit(1);
    }
}

runTest();
