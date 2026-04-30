const { sequelize } = require('./models');

async function resetTable() {
    try {
        await sequelize.getQueryInterface().dropTable('Notifications');
        console.log('Dropped Notifications table.');
        await sequelize.sync(); // Recreate
        console.log('Synced database.');
        process.exit(0);
    } catch (err) {
        console.error('Error resetting table:', err);
        process.exit(1);
    }
}

resetTable();
