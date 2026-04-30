const { Post, User } = require('./models');

async function checkPostCategories() {
    try {
        console.log('\n📊 Checking all posts and their categories...\n');

        const posts = await Post.findAll({
            include: [{
                model: User,
                attributes: ['id', 'username']
            }],
            order: [['createdAt', 'DESC']]
        });

        console.log(`Total posts in database: ${posts.length}\n`);

        // Group by category
        const categoryCounts = {};
        posts.forEach(post => {
            const cat = post.category || 'null';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        console.log('Posts by category:');
        Object.entries(categoryCounts).forEach(([cat, count]) => {
            console.log(`  ${cat}: ${count} posts`);
        });

        console.log('\n📝 Detailed post list:\n');
        posts.forEach((post, index) => {
            console.log(`${index + 1}. Post ID: ${post.id}`);
            console.log(`   User: ${post.User.username} (ID: ${post.User.userId})`);
            console.log(`   Category: "${post.category}"`);
            console.log(`   MediaType: ${post.mediaType}`);
            console.log(`   Caption: ${post.caption ? post.caption.substring(0, 50) + '...' : 'No caption'}`);
            console.log(`   Created: ${post.createdAt}`);
            console.log('');
        });

        // Check for user1 specifically
        const user1Posts = posts.filter(p => p.User.username === 'user1');
        if (user1Posts.length > 0) {
            console.log(`\n🔍 user1 has ${user1Posts.length} posts:`);
            user1Posts.forEach(post => {
                console.log(`   - Post ${post.id}: category="${post.category}", mediaType="${post.mediaType}"`);
            });
        }

    } catch (err) {
        console.error('Error checking posts:', err);
    } finally {
        process.exit(0);
    }
}

checkPostCategories();
