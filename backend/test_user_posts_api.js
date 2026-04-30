const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002/api';

async function testUserPosts() {
    try {
        // Login as user1
        console.log('🔐 Logging in as user1...\n');
        const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
            username: 'user1',
            password: 'password123'
        });

        const token = loginRes.data.token;
        const userId = loginRes.data.user.id;

        console.log(`✅ Logged in successfully`);
        console.log(`   User ID: ${userId}`);
        console.log(`   Token: ${token.substring(0, 20)}...\n`);

        // Fetch user's own posts
        console.log(`📥 Fetching posts for user ${userId}...\n`);
        const postsRes = await axios.get(`${API_BASE_URL}/posts/user/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const posts = postsRes.data;
        console.log(`✅ Received ${posts.length} posts\n`);

        // Show categories
        console.log('📊 Posts by category:');
        const categories = {};
        posts.forEach(post => {
            const cat = post.category || 'null';
            categories[cat] = (categories[cat] || 0) + 1;
        });

        Object.entries(categories).forEach(([cat, count]) => {
            console.log(`   ${cat}: ${count} posts`);
        });

        console.log('\n📝 Detailed post list:');
        posts.forEach((post, index) => {
            console.log(`\n${index + 1}. Post ID: ${post.id}`);
            console.log(`   Category: "${post.category}"`);
            console.log(`   MediaType: ${post.mediaType}`);
            console.log(`   MediaUrl: ${post.mediaUrl ? 'Yes' : 'No'}`);
            console.log(`   Caption: ${post.caption || 'No caption'}`);
        });

        // Filter music posts
        const musicPosts = posts.filter(p => p.category === 'music');
        console.log(`\n\n🎵 Music posts: ${musicPosts.length}`);
        musicPosts.forEach(post => {
            console.log(`   - Post ${post.id}: ${post.caption || 'No caption'}`);
        });

    } catch (err) {
        if (err.response) {
            console.error(`❌ API Error: ${err.response.status}`);
            console.error('Response:', err.response.data);
        } else {
            console.error('❌ Error:', err.message);
        }
    } finally {
        process.exit(0);
    }
}

testUserPosts();
