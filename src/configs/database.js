const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: console.log,
        timezone: '+07:00'
    }
);

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to database successfully');
    } catch (error) {
        console.error('Failed to connected to database', error);
    }
})();

module.exports = sequelize;
