const { DataTypes } = require('sequelize');
const sequelize = require('../database/conexion');
const Categoria = sequelize.define('Categoria', { nombre_categoria: DataTypes.STRING }, { tableName:'categoria', timestamps:false});
module.exports = Categoria;