// server.js - Integrado con tu estructura existente
const path = require('path');
const express = require('express');
const sequelize = require('./node/database/conexion');
const router = require('./node/routers/router');
const jwt= require("jsonwebtoken");

const app = express();
const PORT = 3000;

// Middlewares para JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'node')));

// Rutas API (router con JWT)
app.use('/routers', router);

// Vistas independientes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'node', 'views', 'index.html'));
});

app.get('/registro', (req, res) => {
  res.sendFile(path.join(__dirname, 'node', 'views', 'usuario.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'node', 'views', 'login.html'));
});

// Conexión a la base de datos y sincronización
sequelize.authenticate()
  .then(() => {
    console.log('Conexión exitosa con MySQL');
    // Sincronizar modelos (crear tablas si no existen)
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('Tablas sincronizadas');
  })
  .catch(err => console.error('Error al conectar con MySQL:', err));

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});