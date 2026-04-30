const io = require('socket.io-client');
const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';
const TARGET_USER_ID = 2; // The user logged in the browser

async function sendMessage() {
    try {
        // 1. Create a sender
        const timestamp = Date.now();
        const senderName = `sender_${timestamp}`;

        await axios.post(`${API_URL}/auth/register`, {
            username: senderName,
            email: `${senderName}@example.com`,
            password: 'password123',
            fullname: 'Sender Bot'
        });

        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: senderName,
            password: 'password123'
        });

        const senderToken = loginRes.data.token;
        const senderId = loginRes.data.user.id;
        console.log(`Sender created: ${senderName} (${senderId})`);

        // 2. Connect Socket
        const socket = io(SOCKET_URL, { auth: { token: senderToken } });

        await new Promise(resolve => socket.on('connect', resolve));
        console.log('Sender socket connected');

        // 3. Send Message to Target
        console.log(`Sending message to User ${TARGET_USER_ID}...`);
        socket.emit('message:new', {
            tempId: 'test-' + Date.now(),
            receiverId: TARGET_USER_ID,
            text: 'Hello from Background Script!'
        }, (ack) => {
            console.log('Ack received:', ack);
            socket.disconnect();
            process.exit(0);
        });

    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

console.log('Waiting 10 seconds before sending...');
setTimeout(sendMessage, 10000);
