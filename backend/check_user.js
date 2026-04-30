const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function checkUser() {
    try {
        const username = 'verified_user';
        const user = await User.findOne({ where: { username } });

        if (user) {
            console.log(`User ${username} found.`);
            // Reset password to ensure it's correct
            const hashedPassword = await bcrypt.hash('password123', 10);
            user.password = hashedPassword;
            await user.save();
            console.log('Password reset to: password123');
        } else {
            console.log(`User ${username} not found. Creating...`);
            const hashedPassword = await bcrypt.hash('password123', 10);
            await User.create({
                username,
                email: 'verified@example.com',
                password: hashedPassword,
                fullname: 'Verified User'
            });
            console.log('User created.');
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

checkUser();
