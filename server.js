console.log("Hola Mundo");
const path = require('path');
const express = require('express');
const app = express();

// Puerto donde correrá el servidor
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'node')));

// Ruta principal


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'node', 'views', 'index.html'));
});
// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
