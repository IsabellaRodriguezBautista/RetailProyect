// models/venta.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/conexion');

const Venta = sequelize.define('Venta', {
  fecha_venta: { type: DataTypes.DATEONLY },
  cantidad: { type: DataTypes.INTEGER },
  total: { type: DataTypes.DECIMAL(10,2) }
}, { tableName: 'venta', timestamps: false });

module.exports = Venta;
