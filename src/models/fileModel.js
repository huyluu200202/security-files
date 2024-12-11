const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database');
const moment = require('moment-timezone');
const { v4: uuidv4 } = require('uuid');

const File = sequelize.define('File', {
    id: {
        type: DataTypes.STRING,
        defaultValue: () => uuidv4(),
        primaryKey: true,
    },
    fileName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    filePath: {
        type: DataTypes.STRING,
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
    uploadedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: () => moment().tz('Asia/Ho_Chi_Minh').toDate(),
        get() {
            const rawValue = this.getDataValue('uploadedAt');
            return rawValue ? moment(rawValue).tz('Asia/Ho_Chi_Minh').format() : null;
        },
    },
}, {
    sequelize,
    tableName: 'files',
    timestamps: false,
    uploadedAt: 'uploadedAt',
});

module.exports = File;
