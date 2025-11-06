const { DataTypes } = require('sequelize');
const sequelize = require('../database/conexion');

const Producto = sequelize.define('Producto', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  genero: { type: DataTypes.STRING },
  precio: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'producto', timestamps: false });

module.exports = Producto;