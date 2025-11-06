// models/detalleventa.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/conexion');

const DetalleVenta = sequelize.define('DetalleVenta', {
  cantidad: { type: DataTypes.INTEGER },
  precio_unitario: { type: DataTypes.DECIMAL(10,2) },
  subtotal: { type: DataTypes.DECIMAL(10,2) }
}, { tableName: 'detalleventa', timestamps: false });

module.exports = DetalleVenta;
