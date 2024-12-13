const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database');
const moment = require('moment-timezone');
const { v4: uuidv4 } = require('uuid');

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.STRING,
        defaultValue: () => uuidv4(),
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    file_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    action: {
        type: DataTypes.ENUM('upload', 'download', 'delete', 'edit'),
        allowNull: false,
    },
    action_timestamp: {
        type: DataTypes.DATE,
        defaultValue: () => moment().tz('Asia/Ho_Chi_Minh').toDate(),
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    sequelize,
    tableName: 'audit_logs',
    timestamps: false,
});

module.exports = AuditLog;