const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database');
const User = require('./userModel'); 
const moment = require('moment-timezone');
const { v4: uuidv4 } = require('uuid');

const File = sequelize.define('File', {
    id: {
        type: DataTypes.STRING(255),
        defaultValue: () => uuidv4(),
        primaryKey: true,
    },
    fileName: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    filePath: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    friendlyFileType: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    formattedFileSize: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    fileHash: { // 
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true, 
    },
    uploadedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: () => moment().tz('Asia/Ho_Chi_Minh').toDate(),
        get() {
            const rawValue = this.getDataValue('uploadedAt');
            return rawValue ? moment(rawValue).tz('Asia/Ho_Chi_Minh').format() : null;
        },
    },
    user_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        references: {
            model: User,
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    uploadedBy: {
        type: DataTypes.STRING(255),
        allowNull: false,
        references: {
            model: User,
            key: 'username',
        },
        onDelete: 'CASCADE',
    },
    isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    sequelize,
    tableName: 'files',
    timestamps: false, // Không tự động thêm createdAt, updatedAt
});

module.exports = File;
