const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database');
const File = require('../models/fileModel');
const moment = require('moment-timezone');
const { v4: uuidv4 } = require('uuid');

const OCRLog = sequelize.define('OCRLog', {
    id: {
        type: DataTypes.STRING,
        defaultValue: () => uuidv4(),
        primaryKey: true,
    },
    file_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: File,
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
        defaultValue: 'pending',
    },
    result: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    processed_at: {
        type: DataTypes.DATE,
        defaultValue: () => moment().tz('Asia/Ho_Chi_Minh').toDate(),
    },
    error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    sequelize,
    tableName: 'ocr_logs',
    timestamps: false,
});

module.exports = OCRLog;
