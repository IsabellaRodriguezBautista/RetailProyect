const Producto = require('../models/producto');
const Venta = require('../models/venta');
const DetalleVenta = require('../models/detalleventa');
const Inventario = require('../models/inventario');
const sequelize = require('../database/conexion');

exports.registrarVenta = async (req, res) => {
  // req.body: { fecha_venta, clienteId, sucursalId, items: [ { productoId, cantidad } ] }
  const t = await sequelize.transaction();
  try {
    const { fecha_venta, Cliente_idCliente, Sucursal_idSucursal, items } = req.body;
    // calcular total
    let total = 0;
    for (const it of items) {
      const prod = await Producto.findByPk(it.productoId);
      if(!prod) throw new Error(`Producto ${it.productoId} no existe`);
      total += parseFloat(prod.precio) * it.cantidad;
    }
    const venta = await Venta.create({ fecha_venta, cantidad: items.reduce((s,i)=>s+i.cantidad,0), total, Cliente_idCliente, Sucursal_idSucursal }, { transaction: t });
    for (const it of items) {
      const prod = await Producto.findByPk(it.productoId);
      const subtotal = parseFloat(prod.precio) * it.cantidad;
      await DetalleVenta.create({ cantidad: it.cantidad, precio_unitario: prod.precio, subtotal, Producto_idProducto: it.productoId, Venta_idVenta: venta.id }, { transaction: t });

      // actualizar stock global en tabla producto
      prod.stock = Math.max(0, prod.stock - it.cantidad);
      await prod.save({ transaction: t });

      // actualizar inventario por sucursal (si existe)
      const inv = await Inventario.findOne({ where: { Producto_idProducto: it.productoId, Sucursal_idSucursal }, transaction: t });
      if (inv) {
        inv.cantidad_actual = Math.max(0, inv.cantidad_actual - it.cantidad);
        await inv.save({ transaction: t });
      }
    }
    await t.commit();
    res.status(201).json({ ok:true, ventaId: venta.id });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ ok:false, error: err.message });
  }
};

exports.topProducts = async (req, res) => {
  const { month, year } = req.params;
  const start = `${year}-${String(month).padStart(2,'0')}-01`;
  const end = new Date(year, month, 0).toISOString().slice(0,10); // último día del mes
  try {
    const rows = await sequelize.query(
      `SELECT p.idProducto, p.nombre, SUM(dv.cantidad) AS total_vendido, SUM(dv.subtotal) AS ventas
       FROM detalleventa dv
       JOIN venta v ON v.idVenta = dv.Venta_idVenta
       JOIN producto p ON p.idProducto = dv.Producto_idProducto
       WHERE v.fecha_venta BETWEEN :start AND :end
       GROUP BY p.idProducto
       ORDER BY total_vendido DESC
       LIMIT 10`, { replacements:{ start, end }, type: QueryTypes.SELECT }
    );
    res.json({ ok:true, top: rows });
  } catch (err) {
    console.error(err); res.status(500).json({ ok:false, err: err.message });
  }
};

exports.comparativos = async (req, res) => {
  const { month, year } = req.params;
  const start = `${year}-${String(month).padStart(2,'0')}-01`;
  const end = new Date(year, month, 0).toISOString().slice(0,10);
  try {
    const byCategoria = await sequelize.query(
      `SELECT c.nombre_categoria, SUM(dv.cantidad) AS unidades_vendidas, SUM(dv.subtotal) AS ventas
       FROM detalleventa dv
       JOIN producto p ON p.idProducto = dv.Producto_idProducto
       JOIN categoria c ON c.idCategoria = p.Categoria_idCategoria
       JOIN venta v ON v.idVenta = dv.Venta_idVenta
       WHERE v.fecha_venta BETWEEN :start AND :end
       GROUP BY c.idCategoria ORDER BY unidades_vendidas DESC`, { replacements:{start,end}, type: QueryTypes.SELECT }
    );
    const byGenero = await sequelize.query(
      `SELECT p.genero, SUM(dv.cantidad) AS unidades_vendidas, SUM(dv.subtotal) AS ventas
       FROM detalleventa dv
       JOIN producto p ON p.idProducto = dv.Producto_idProducto
       JOIN venta v ON v.idVenta = dv.Venta_idVenta
       WHERE v.fecha_venta BETWEEN :start AND :end
       GROUP BY p.genero`, { replacements:{start,end}, type: QueryTypes.SELECT }
    );
    const byTalla = await sequelize.query(
      `SELECT t.nombre, SUM(dv.cantidad) AS unidades_vendidas
       FROM detalleventa dv
       JOIN producto p ON p.idProducto = dv.Producto_idProducto
       JOIN talla t ON t.idTalla = p.Talla_idTalla
       JOIN venta v ON v.idVenta = dv.Venta_idVenta
       WHERE v.fecha_venta BETWEEN :start AND :end
       GROUP BY t.idTalla`, { replacements:{start,end}, type: QueryTypes.SELECT }
    );
    res.json({ ok:true, byCategoria, byGenero, byTalla });
  } catch (err) { console.error(err); res.status(500).json({ ok:false, err: err.message }); }
};

exports.rotacionMensual = async (req, res) => {
  const { month, year } = req.params;
  const start = `${year}-${String(month).padStart(2,'0')}-01`;
  const end = new Date(year, month, 0).toISOString().slice(0,10);
  try {
    // unidades vendidas por producto
    const ventas = await sequelize.query(
      `SELECT dv.Producto_idProducto AS productoId, SUM(dv.cantidad) AS unidades_vendidas
       FROM detalleventa dv
       JOIN venta v ON v.idVenta = dv.Venta_idVenta
       WHERE v.fecha_venta BETWEEN :start AND :end
       GROUP BY dv.Producto_idProducto`, { replacements:{start,end}, type: QueryTypes.SELECT }
    );

    // agregar stock actual y calcular rotacion aproximada
    const results = [];
    for (const row of ventas) {
      const prod = await sequelize.query(`SELECT idProducto, nombre, stock FROM producto WHERE idProducto = :id`, { replacements: { id: row.productoId }, type: QueryTypes.SELECT });
      const p = prod[0] || { stock: 0, nombre: 'N/A' };
      // inventario_promedio aproximado = stock_actual (mejor si tienes histórico)
      const inventario_promedio = p.stock || 1;
      const rotacion = (row.unidades_vendidas / inventario_promedio);
      results.push({ productoId: row.productoId, nombre: p.nombre, unidades_vendidas: row.unidades_vendidas, stock_actual: p.stock, inventario_promedio, rotacion });
    }

    // recomendaciones básicas
    const recs = results.map(r => {
      const recomendaciones = [];
      if (r.rotacion >= 0.5 && r.stock_actual <= 10) recomendaciones.push('Aumentar stock');
      if (r.rotacion <= 0.1 && r.stock_actual > 30) recomendaciones.push('Considerar descuento o promoción');
      if (r.stock_actual <= 5) recomendaciones.push('Reponer inmediatamente (stock crítico)');
      return { ...r, recomendaciones };
    });

    res.json({ ok:true, month, year, data: recs });
  } catch (err) { console.error(err); res.status(500).json({ ok:false, err: err.message }); }
};