const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002/api';

// Test credentials
const testUsers = {
    user1: { username: 'user1', password: 'password123' },
    user2: { username: 'user2', password: 'password123' },
    user3: { username: 'user3', password: 'password123' }
};

let tokens = {};
let userIds = {};

// Helper function to login
async function login(username, password) {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            username,
            password
        });

        console.log(`✅ Logged in as ${username}`);
        return response.data;
    } catch (err) {
        if (err.response) {
            console.log(`❌ Login failed for ${username}: ${err.response.status}`);
        } else {
            console.error(`Error logging in as ${username}:`, err.message);
        }
        return null;
    }
}

// Helper function to set privacy
async function setPrivacy(token, isPrivate) {
    try {
        const response = await axios.put(`${API_BASE_URL}/users/privacy`,
            { isPrivate },
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        console.log(`✅ Privacy set to ${isPrivate ? 'PRIVATE' : 'PUBLIC'}`);
        return true;
    } catch (err) {
        if (err.response) {
            console.log(`❌ Failed to set privacy: ${err.response.status}`);
        } else {
            console.error('Error setting privacy:', err.message);
        }
        return false;
    }
}

// Helper function to follow user
async function followUser(token, targetUserId) {
    try {
        const response = await axios.post(`${API_BASE_URL}/users/${targetUserId}/follow`, {}, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log(`✅ Follow status: ${response.data.isFollowing ? 'FOLLOWING' : 'UNFOLLOWED'}`);
        return response.data.isFollowing;
    } catch (err) {
        if (err.response) {
            console.log(`❌ Failed to follow user: ${err.response.status}`);
        } else {
            console.error('Error following user:', err.message);
        }
        return false;
    }
}

// Helper function to get posts
async function getPosts(token) {
    try {
        const response = await axios.get(`${API_BASE_URL}/posts`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    } catch (err) {
        if (err.response) {
            console.log(`❌ Failed to fetch posts: ${err.response.status}`);
        } else {
            console.error('Error fetching posts:', err.message);
        }
        return [];
    }
}

// Helper function to get user posts
async function getUserPosts(token, userId) {
    try {
        const response = await axios.get(`${API_BASE_URL}/posts/user/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    } catch (err) {
        if (err.response) {
            console.log(`❌ Failed to fetch user posts: ${err.response.status}`);
        } else {
            console.error('Error fetching user posts:', err.message);
        }
        return [];
    }
}

// Main test function
async function runTests() {
    console.log('\n🧪 Starting Privacy Filtering Tests\n');
    console.log('='.repeat(50));

    // Step 1: Login all users
    console.log('\n📝 Step 1: Logging in test users...\n');
    for (const [key, creds] of Object.entries(testUsers)) {
        const result = await login(creds.username, creds.password);
        if (result) {
            tokens[key] = result.token;
            userIds[key] = result.user.id;
        }
    }

    if (Object.keys(tokens).length < 3) {
        console.log('\n❌ Not all users could login. Please ensure test users exist.');
        console.log('Run setup_test_users.js to create test users.');
        return;
    }

    console.log('\n✅ All users logged in successfully');
    console.log(`   user1 ID: ${userIds.user1}`);
    console.log(`   user2 ID: ${userIds.user2}`);
    console.log(`   user3 ID: ${userIds.user3}`);

    // Step 2: Set user1 to private
    console.log('\n📝 Step 2: Setting user1 account to PRIVATE...\n');
    await setPrivacy(tokens.user1, true);

    // Step 3: user2 follows user1
    console.log('\n📝 Step 3: user2 follows user1...\n');
    await followUser(tokens.user2, userIds.user1);

    // Step 4: Test feed visibility
    console.log('\n📝 Step 4: Testing feed visibility...\n');

    console.log('🔍 Fetching posts as user2 (follower)...');
    const user2Posts = await getPosts(tokens.user2);
    const user1PostsInUser2Feed = user2Posts.filter(p => p.userId === userIds.user1);
    console.log(`   Found ${user1PostsInUser2Feed.length} posts from user1 in user2's feed`);
    if (user1PostsInUser2Feed.length > 0) {
        console.log('   ✅ PASS: Follower can see private account posts in feed');
    } else {
        console.log('   ⚠️  No posts from user1 found (user1 may not have posts)');
    }

    console.log('\n🔍 Fetching posts as user3 (non-follower)...');
    const user3Posts = await getPosts(tokens.user3);
    const user1PostsInUser3Feed = user3Posts.filter(p => p.userId === userIds.user1);
    console.log(`   Found ${user1PostsInUser3Feed.length} posts from user1 in user3's feed`);
    if (user1PostsInUser3Feed.length === 0) {
        console.log('   ✅ PASS: Non-follower cannot see private account posts in feed');
    } else {
        console.log('   ❌ FAIL: Non-follower can see private account posts!');
    }

    // Step 5: Test profile visibility
    console.log('\n📝 Step 5: Testing profile visibility...\n');

    console.log('🔍 Fetching user1 profile posts as user2 (follower)...');
    const user1PostsForUser2 = await getUserPosts(tokens.user2, userIds.user1);
    console.log(`   Found ${user1PostsForUser2.length} posts on user1's profile`);
    if (user1PostsForUser2.length > 0) {
        console.log('   ✅ PASS: Follower can see private account profile posts');
    } else {
        console.log('   ⚠️  No posts found (user1 may not have posts)');
    }

    console.log('\n🔍 Fetching user1 profile posts as user3 (non-follower)...');
    const user1PostsForUser3 = await getUserPosts(tokens.user3, userIds.user1);
    console.log(`   Found ${user1PostsForUser3.length} posts on user1's profile`);
    if (user1PostsForUser3.length === 0) {
        console.log('   ✅ PASS: Non-follower cannot see private account profile posts');
    } else {
        console.log('   ❌ FAIL: Non-follower can see private account profile posts!');
    }

    // Step 6: Set user1 to public and test again
    console.log('\n📝 Step 6: Setting user1 account to PUBLIC and retesting...\n');
    await setPrivacy(tokens.user1, false);

    console.log('🔍 Fetching posts as user3 (non-follower) after making account public...');
    const user3PostsAfter = await getPosts(tokens.user3);
    const user1PostsInUser3FeedAfter = user3PostsAfter.filter(p => p.userId === userIds.user1);
    console.log(`   Found ${user1PostsInUser3FeedAfter.length} posts from user1 in user3's feed`);
    if (user1PostsInUser3FeedAfter.length > 0) {
        console.log('   ✅ PASS: Everyone can see public account posts in feed');
    } else {
        console.log('   ⚠️  No posts from user1 found (user1 may not have posts)');
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n✅ Privacy filtering tests completed!\n');
}

// Run tests
runTests().catch(err => {
    console.error('Test execution failed:', err);
});
