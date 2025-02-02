// const { DataTypes } = require('sequelize');
// const sequelize = require('../configs/database');
// const moment = require('moment-timezone');

// const BlackListIp = sequelize.define('black_list_ip_address', {
//   id: {
//     type: DataTypes.STRING(50),
//     allowNull: false,
//     primaryKey: true
//   },
//   ip_address: {
//     type: DataTypes.STRING(255),
//     allowNull: false
//   },
//   created_at: {
//     type: DataTypes.DATE,
//     allowNull: false,
//     get() {
//       const rawValue = this.getDataValue('created_at');
//       return rawValue ? moment(rawValue).format('YYYY-MM-DD HH:mm:ss') : null;
//     },
//   },
// }, {
//   sequelize,
//   tableName: 'black_list_ip_address',
//   timestamps: true,
//   createdAt: 'created_at', 
//   updatedAt: false, 
//   underscored: true, 
//   indexes: [
//     {
//       name: "PRIMARY",
//       unique: true,
//       using: "BTREE",
//       fields: [
//         { name: "id" },
//       ]
//     },
//   ]
// });

// module.exports = BlackListIp;

const { DataTypes } = require('sequelize');
const sequelize = require('../configs/database');
const moment = require('moment-timezone');

const BlackListIp = sequelize.define('black_list_ip_address', {
  id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    primaryKey: true
  },
  ip_address: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  failed_attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    get() {
      const rawValue = this.getDataValue('created_at');
      return rawValue ? moment(rawValue).format('YYYY-MM-DD HH:mm:ss') : null;
    },
  },
}, {
  sequelize,
  tableName: 'black_list_ip_address',
  timestamps: true,
  createdAt: 'created_at', 
  updatedAt: false, 
  underscored: true, 
  indexes: [
    {
      name: "PRIMARY",
      unique: true,
      using: "BTREE",
      fields: [{ name: "id" }]
    },
    {
      name: "ip_address_index",
      unique: true,
      using: "BTREE",
      fields: [{ name: "ip_address" }]
    }
  ]
});

module.exports = BlackListIp;
