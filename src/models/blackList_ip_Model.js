const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database');
const moment = require('moment-timezone');
const { v4: uuidv4 } = require('uuid');

const BlackListIp = sequelize.define('BlackListIp', {
    id: {
        type: DataTypes.STRING(50),
        defaultValue: () => uuidv4(),  
        primaryKey: true,
    },
    ip_address: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true, 
    },
    failed_attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0, 
    },
    is_blocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,  
    },
    blocked_at: {
        type: DataTypes.DATE,
        allowNull: true, 
        get() {
            const rawValue = this.getDataValue('blocked_at');
            return rawValue ? moment(rawValue).tz('Asia/Ho_Chi_Minh').format() : null; 
        },
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: () => moment().tz('Asia/Ho_Chi_Minh').toDate(), 
        get() {
            const rawValue = this.getDataValue('created_at');
            return rawValue ? moment(rawValue).tz('Asia/Ho_Chi_Minh').format() : null;
        },
    },
}, {
    sequelize,
    tableName: 'black_list_ip_address',
    timestamps: false, 
    indexes: [
        {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
        },
        {
            name: "ip_address_index",
            unique: true,
            using: "BTREE",
            fields: [{ name: "ip_address" }],
        }
    ],
});

module.exports = BlackListIp;
