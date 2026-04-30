// Create two test users for messaging demo
const bcrypt = require('bcryptjs');
const { User, sequelize } = require('./models');

async function createTestUsers() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database');

        const password = await bcrypt.hash('test123', 10);

        // Create or update testuser1
        const [user1, created1] = await User.findOrCreate({
            where: { username: 'testuser1' },
            defaults: {
                email: 'testuser1@test.com',
                password,
                fullname: 'Test User One',
                bio: 'Test user for messaging'
            }
        });

        if (!created1) {
            await user1.update({ password });
        }

        // Create or update testuser2
        const [user2, created2] = await User.findOrCreate({
            where: { username: 'testuser2' },
            defaults: {
                email: 'testuser2@test.com',
                password,
                fullname: 'Test User Two',
                bio: 'Test user for messaging'
            }
        });

        if (!created2) {
            await user2.update({ password });
        }

        console.log('\n✅ Test users created/updated successfully!');
        console.log('\n📝 USER CREDENTIALS:');
        console.log('═══════════════════════════════════════');
        console.log('User 1:');
        console.log('  Username: testuser1');
        console.log('  Password: test123');
        console.log(`  ID: ${user1.id}`);
        console.log('\nUser 2:');
        console.log('  Username: testuser2');
        console.log('  Password: test123');
        console.log(`  ID: ${user2.id}`);
        console.log('═══════════════════════════════════════');

        console.log('\n🧪 MANUAL TESTING INSTRUCTIONS:');
        console.log('═══════════════════════════════════════');
        console.log('1. Open TWO browser windows (or one normal + one incognito)');
        console.log('\n2. Window 1:');
        console.log('   - Go to: http://localhost:5173');
        console.log('   - Login as: testuser1 / test123');
        console.log('   - Navigate to Messages page');
        console.log('\n3. Window 2:');
        console.log('   - Go to: http://localhost:5173');
        console.log('   - Login as: testuser2 / test123');
        console.log('   - Navigate to Messages page');
        console.log('\n4. In Window 2 (testuser2):');
        console.log('   - The chat list will be empty initially');
        console.log('   - You need to send the first message to start a conversation');
        console.log(`   - Use the browser console to send a test message:`);
        console.log(`   
   // In browser console of Window 2:
   const socket = window.io('http://localhost:3001', {
       auth: { token: localStorage.getItem('token') }
   });
   socket.on('connect', () => {
       console.log('Connected!');
       socket.emit('message:new', {
           receiverId: ${user1.id},
           text: 'Hello from testuser2!'
       }, (ack) => console.log('Ack:', ack));
   });
   `);
        console.log('\n5. Check Window 1 (testuser1):');
        console.log('   - You should see a notification appear');
        console.log('   - The message should appear in the chat list');
        console.log('   - Click on the chat to open it');
        console.log('\n6. Now you can chat normally between both windows!');
        console.log('═══════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createTestUsers();
