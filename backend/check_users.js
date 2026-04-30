const { User } = require('./models');

async function checkUsers() {
    try {
        const users = await User.findAll({
            attributes: ['id', 'username', 'email']
        });
        console.log('Users found:', JSON.stringify(users, null, 2));
    } catch (err) {
        console.error('Error fetching users:', err);
    }
}

checkUsers();
