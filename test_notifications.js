const { Notification } = require('./backend/models');

async function checkNotifications() {
    try {
        const count = await Notification.count();
        console.log(`Total notifications in database: ${count}`);

        const recent = await Notification.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']]
        });

        console.log('\nRecent notifications:');
        recent.forEach(n => {
            console.log(`  - Type: ${n.type}, UserId: ${n.userId}, ActorId: ${n.actorId}, Read: ${n.isRead}, Created: ${n.createdAt}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkNotifications();
