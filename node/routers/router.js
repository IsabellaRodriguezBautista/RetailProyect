const express = require('express');
const router = express.Router();
const controller = require('../controllers/usuarioController');
const productController = require('../controllers/productController');
const ventaController = require('../controllers/ventaController');

// Rutas
router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/', controller.dashboard);
router.post('/producto', productController.registrarProducto);
router.post('/venta', ventaController.registrarVenta);

// dashboard & reports
router.get('/dashboard/top-products/:month/:year', ventaController.topProducts);
router.get('/dashboard/rotacion/:month/:year', ventaController.rotacionMensual);
router.get('/dashboard/comparativo/:month/:year', ventaController.comparativos);

module.exports = router;
