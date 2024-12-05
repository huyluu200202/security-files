const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database');
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
    fileType: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    fileSize: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    uploadedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    sequelize,
    tableName: 'files',
    timestamps: false,
});

module.exports = File;
