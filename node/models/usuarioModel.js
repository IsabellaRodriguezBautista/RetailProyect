const { DataTypes } = require('sequelize');
const sequelize = require('../database/conexion');

const Usuario = sequelize.define('usuarios', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  apellido: { type: DataTypes.STRING, allowNull: false },
  cedula: { type: DataTypes.STRING, allowNull: false, unique: true },
  usuario: { type: DataTypes.STRING, allowNull: false, unique: true },
  contrasena: { type: DataTypes.STRING, allowNull: false }
}, {
  timestamps: false,
  freezeTableName: true
});

module.exports = Usuario;
