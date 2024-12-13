const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database');
const moment = require('moment-timezone');
const { v4: uuidv4 } = require('uuid');

const Permission = sequelize.define('Permission', {
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
    can_view: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    can_download: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    can_edit: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: () => moment().tz('Asia/Ho_Chi_Minh').toDate(),
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: () => moment().tz('Asia/Ho_Chi_Minh').toDate(),
    },
}, {
    sequelize,
    tableName: 'permissions',
    timestamps: false,
});

module.exports = Permission;
