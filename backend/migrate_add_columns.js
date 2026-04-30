const { sequelize } = require('./models');

async function addMissingColumns() {
    try {
        console.log('Adding missing columns to database...');

        // Add isPrivate column to Users table
        await sequelize.query(`
            ALTER TABLE Users ADD COLUMN isPrivate BOOLEAN DEFAULT 0;
        `).catch(err => {
            if (err.message.includes('duplicate column name')) {
                console.log('isPrivate column already exists');
            } else {
                throw err;
            }
        });

        console.log('✅ Database schema updated successfully!');
        console.log('You can now use the password change feature.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration error:', error.message);
        process.exit(1);
    }
}

addMissingColumns();
