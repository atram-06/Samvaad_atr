const { User, sequelize } = require('./models');
const bcrypt = require('bcryptjs');

async function createUsers() {
    try {
        await sequelize.sync();

        const passwordHash = await bcrypt.hash('password123', 10);

        const [user1, created1] = await User.findOrCreate({
            where: { username: 'alice' },
            defaults: {
                email: 'alice@example.com',
                password: passwordHash,
                fullname: 'Alice Wonderland'
            }
        });

        const [user2, created2] = await User.findOrCreate({
            where: { username: 'bob' },
            defaults: {
                email: 'bob@example.com',
                password: passwordHash,
                fullname: 'Bob Builder'
            }
        });

        console.log('User 1:', user1.username, user1.id);
        console.log('User 2:', user2.username, user2.id);
        process.exit(0);
    } catch (err) {
        console.error('Error creating users:', err);
        process.exit(1);
    }
}

createUsers();
