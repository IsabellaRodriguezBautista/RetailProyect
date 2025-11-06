const path = require('path');
const express = require('express');
const sequelize = require('./node/database/conexion');
const router = require('./node/routers/router');
const Usuario = require('./node/models/usuarioModel'); // Importado aquí

const app = express();
const PORT = 3000;

// 🧩 Middlewares para JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🗂️ Archivos estáticos (solo la carpeta views)
app.use(express.static(path.join(__dirname, 'node', 'views')));

// 🛠️ Rutas API
app.use('/api', router);

// 🧭 Rutas de vistas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'node', 'views', 'index.html'));
});

app.get('/registro', (req, res) => {
  res.sendFile(path.join(__dirname, 'node', 'views', 'usuario.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'node', 'views', 'login.html'));
});

// 🔄 Conexión y sincronización de la base de datos
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa con MySQL');

    await Usuario.sync(); // mantiene los datos existentes
    console.log('✅ Tabla "usuario" sincronizada correctamente');

    // 🚀 Iniciar servidor solo si la conexión fue exitosa
    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Error al conectar con MySQL:', err);
  }
})();
