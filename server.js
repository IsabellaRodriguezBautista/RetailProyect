const path = require('path');
const express = require('express');
const sequelize = require('./node/database/conexion'); // solo una vez

const app = express();
const PORT = 3000;

// Middlewares
app.use(express.static(path.join(__dirname, 'node')));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'node', 'views', 'index.html'));
});

// Conexión a la base de datos
sequelize.authenticate()
  .then(() => console.log('Conexión exitosa con MySQL'))
  .catch(err => console.error('Error al conectar con MySQL:', err));

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
