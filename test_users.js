const { User } = require('./backend/models');

async function checkUsers() {
    try {
        const users = await User.findAll({
            attributes: ['id', 'username', 'email'],
            limit: 10
        });

        console.log(`Total users in database: ${users.length}`);
        console.log('\nUsers:');
        users.forEach(u => {
            console.log(`  - ID: ${u.id}, Username: ${u.username}, Email: ${u.email}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkUsers();
