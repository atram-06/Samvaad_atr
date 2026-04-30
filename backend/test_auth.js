const { User, sequelize } = require('./models');
const bcrypt = require('bcryptjs');

async function testAuth() {
    try {
        await sequelize.sync({ force: true }); // Force sync to recreate tables
        console.log('Database synced.');

        const username = 'verified_user';
        const email = 'verified@example.com';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('Attempting to create user...');
        const user = await User.create({
            username,
            email,
            password: hashedPassword
        });

        console.log('User created successfully:', user.id);
        process.exit(0);
    } catch (error) {
        console.error('Auth Test Failed:', error);
        process.exit(1);
    }
}

testAuth();
