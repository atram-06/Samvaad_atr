const notificationService = require('./backend/services/notificationService');

async function testCreateNotification() {
    try {
        console.log('Testing notification creation...');
        const result = await notificationService.createNotification({
            userId: 1,
            actorId: 2,
            type: 'like',
            referenceId: 1,
            payload: { text: 'Test notification' }
        });

        if (result) {
            console.log('✅ Notification created successfully:', result.id);
        } else {
            console.log('❌ Notification creation returned null');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error creating notification:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

testCreateNotification();
