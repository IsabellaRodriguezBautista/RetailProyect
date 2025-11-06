const { DataTypes } = require('sequelize');
const sequelize = require('../database/conexion');
const Talla = sequelize.define('Talla', { nombre: DataTypes.STRING, tipo_cliente: DataTypes.STRING }, { tableName:'talla', timestamps:false});
module.exports = Talla;