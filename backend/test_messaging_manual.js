// Quick test script to send a message between two users
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testMessaging() {
    try {
        // Login as user1
        console.log('Logging in as user1...');
        const login1 = await axios.post(`${API_BASE_URL}/auth/login`, {
            username: 'user1',
            password: 'password123'
        });
        const user1Token = login1.data.token;
        const user1Id = login1.data.user.id;
        console.log(`User1 logged in: ID=${user1Id}`);

        // Login as user2
        console.log('Logging in as user2...');
        const login2 = await axios.post(`${API_BASE_URL}/auth/login`, {
            username: 'user2',
            password: 'password123'
        });
        const user2Token = login2.data.token;
        const user2Id = login2.data.user.id;
        console.log(`User2 logged in: ID=${user2Id}`);

        console.log('\n✅ Both users logged in successfully!');
        console.log(`\nNow open two browser windows:`);
        console.log(`1. Window 1: http://localhost:5173 - Login as user1/password123`);
        console.log(`2. Window 2: http://localhost:5173 - Login as user2/password123`);
        console.log(`\nThen navigate to Messages in both windows and try sending messages!`);

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testMessaging();
