const Producto = require('../models/producto');
const Inventario = require('../models/inventario');

exports.registrarProducto = async (req, res) => {
  try {
    const { nombre, genero, precio, stock, Categoria_idCategoria, Talla_idTalla } = req.body;
    const producto = await Producto.create({ nombre, genero, precio, stock, Categoria_idCategoria, Talla_idTalla });
    // crear registro de inventario inicial opcional (por sucursal)
    // await Inventario.create({ cantidad_actual: stock, Producto_idProducto: producto.id, Sucursal_idSucursal: 1 });
    res.status(201).json({ ok:true, producto });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok:false, err: err.message });
  }
};
