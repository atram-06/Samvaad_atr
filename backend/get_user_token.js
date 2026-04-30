const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

async function getToken() {
    try {
        // Try login first
        try {
            const res = await axios.post(`${API_URL}/auth/login`, {
                username: 'user1',
                password: 'password123'
            });
            console.log(JSON.stringify(res.data));
            return;
        } catch (e) {
            // Ignore login error, try register
        }

        // Register if login failed
        const res = await axios.post(`${API_URL}/auth/register`, {
            username: 'user1',
            email: 'user1@example.com',
            password: 'password123',
            fullname: 'User One'
        });

        // Login after register
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'user1',
            password: 'password123'
        });
        console.log(JSON.stringify(loginRes.data));

    } catch (err) {
        console.error('Error:', err.message);
        if (err.response) console.error(err.response.data);
    }
}

getToken();
