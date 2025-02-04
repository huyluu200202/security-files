const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database');
const moment = require('moment-timezone');
const { v4: uuidv4 } = require('uuid');

const BlackListIp = sequelize.define('BlackListIp', {
    id: {
        type: DataTypes.STRING(50),
        defaultValue: () => uuidv4(),  // Tự động tạo UUID khi tạo mới bản ghi
        primaryKey: true,
    },
    ip_address: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,  // Đảm bảo mỗi IP chỉ có một bản ghi
    },
    failed_attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,  // Mặc định là 0 lần thất bại
    },
    is_blocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,  // Mặc định là không bị block
    },
    blocked_at: {
        type: DataTypes.DATE,
        allowNull: true,  // Khi bị block, ghi lại thời gian block
        get() {
            const rawValue = this.getDataValue('blocked_at');
            return rawValue ? moment(rawValue).tz('Asia/Ho_Chi_Minh').format() : null;  // Chuyển đổi múi giờ
        },
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: () => moment().tz('Asia/Ho_Chi_Minh').toDate(),  // Thời gian tạo bản ghi
        get() {
            const rawValue = this.getDataValue('created_at');
            return rawValue ? moment(rawValue).tz('Asia/Ho_Chi_Minh').format() : null;
        },
    },
}, {
    sequelize,
    tableName: 'black_list_ip_address',
    timestamps: false,  // Không dùng `createdAt` và `updatedAt` tự động của Sequelize
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
