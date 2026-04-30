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

        // 2. Connect Bob's Socket (to receive notification)
        console.log('Connecting Bob\'s socket...');
        const socketBob = io(SOCKET_URL, { auth: { token: token2 } });

        await new Promise(resolve => socketBob.on('connect', resolve));
        console.log('Bob connected.');

        // 3. Alice Follows Bob (Trigger Notification)
        console.log('Alice following Bob...');

        // Listen for notification
        const notificationPromise = new Promise((resolve, reject) => {
            socketBob.on('notification:new', (data) => {
                console.log('Bob received notification:', data);
                if (data.type === 'follow' && data.actor.username === 'alice') {
                    resolve(data);
                }
            });
            setTimeout(() => reject(new Error('Notification timeout')), 5000);
        });

        const followRes = await axios.post(`${API_URL}/users/${user2Id}/follow`, {}, {
            headers: { Authorization: `Bearer ${token1}` }
        });

        if (!followRes.data.isFollowing) {
            console.log('Was unfollowed. Following again...');
            await axios.post(`${API_URL}/users/${user2Id}/follow`, {}, {
                headers: { Authorization: `Bearer ${token1}` }
            });
        }

        await notificationPromise;
        console.log('Real-time notification verified.');

        // 4. Verify Unread Count API
        console.log('Verifying unread count API...');
        const countRes = await axios.get(`${API_URL}/notifications/unread-count`, {
            headers: { Authorization: `Bearer ${token2}` }
        });
        console.log('Unread count:', countRes.data.count);

        if (countRes.data.count > 0) {
            console.log('Unread count verified.');
        } else {
            console.error('Unread count mismatch!');
            process.exit(1);
        }

        console.log('TEST PASSED: Notification flow verified.');
        socketBob.disconnect();
        process.exit(0);

    } catch (err) {
        console.error('Test failed:', err.message);
        if (err.response) console.error('API Response:', err.response.data);
        process.exit(1);
    }
}

runTest();
