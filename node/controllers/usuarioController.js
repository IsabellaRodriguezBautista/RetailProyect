const Usuario = require('../models/usuarioModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'mi_clave_secreta';

// Registro
exports.register = async (req, res) => {
  const { nombre, apellido, cedula, usuario, contraseña } = req.body;
  try {
    const hash = bcrypt.hashSync(contraseña, 8);
    const nuevoUsuario = await Usuario.create({ nombre, apellido, cedula, usuario, contraseña: hash });
    res.json({ message: 'Usuario registrado', usuario: nuevoUsuario });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  const { usuario, contraseña } = req.body;
  try {
    const user = await Usuario.findOne({ where: { usuario } });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const valid = bcrypt.compareSync(contraseña, user.contraseña);
    if (!valid) return res.status(401).json({ message: 'Contraseña incorrecta' });

    const token = jwt.sign({ id: user.id, usuario: user.usuario }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ message: 'Login exitoso', token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Dashboard
exports.dashboard = (req, res) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'Token requerido' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    res.json({ message: 'Bienvenido al dashboard', user: decoded });
  } catch (err) {
    res.status(401).json({ message: 'Token inválido' });
  }
};
