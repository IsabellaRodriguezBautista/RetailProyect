// models/inventario.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/conexion');

const Inventario = sequelize.define('Inventario', {
  cantidad_actual: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'inventario', timestamps: false });

module.exports = Inventario;
