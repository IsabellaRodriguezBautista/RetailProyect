// models/inventarioModel.js
const db = require('../database/connection'); // Ajusta según tu configuración

const InventarioModel = {
  // Obtener todas las ventas con información completa
  async obtenerVentas(filtros = {}) {
    try {
      let query = `
        SELECT 
          v.idVenta,
          v.fecha_venta,
          v.cantidad as unidades_totales,
          v.total,
          c.nombre as nombre_cliente,
          c.tipo_cliente as genero,
          s.nombre as sucursal,
          s.ciudad,
          dv.cantidad,
          dv.precio_unitario,
          dv.subtotal,
          p.nombre as producto,
          cat.nombre_categoria as categoria,
          t.nombre as talla,
          i.cantidad_actual as stock_actual
        FROM Venta v
        INNER JOIN detalleVenta dv ON v.idVenta = dv.Venta_idVenta
        INNER JOIN Cliente c ON v.Cliente_idCliente = c.idCliente
        INNER JOIN Sucursal s ON v.Sucursal_idSucursal = s.idSucursal
        INNER JOIN Producto p ON dv.Producto_idProducto = p.idProducto
        INNER JOIN Categoria cat ON p.Categoria_idCategoria = cat.idCategoria
        INNER JOIN Talla t ON p.Talla_idTalla = t.idTalla
        LEFT JOIN Inventario i ON p.idProducto = i.Producto_idProducto 
          AND s.idSucursal = i.Sucursal_idSucursal
        WHERE 1=1
      `;
      
      const params = [];
      
      if (filtros.mes) {
        query += ' AND MONTH(v.fecha_venta) = ?';
        params.push(filtros.mes);
      }
      
      if (filtros.anio) {
        query += ' AND YEAR(v.fecha_venta) = ?';
        params.push(filtros.anio);
      }
      
      if (filtros.genero) {
        query += ' AND c.tipo_cliente = ?';
        params.push(filtros.genero);
      }
      
      if (filtros.sucursal) {
        query += ' AND s.nombre = ?';
        params.push(filtros.sucursal);
      }
      
      if (filtros.categoria) {
        query += ' AND cat.nombre_categoria = ?';
        params.push(filtros.categoria);
      }
      
      if (filtros.fechaInicio && filtros.fechaFin) {
        query += ' AND v.fecha_venta BETWEEN ? AND ?';
        params.push(filtros.fechaInicio, filtros.fechaFin);
      }
      
      query += ' ORDER BY v.fecha_venta DESC';
      
      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener ventas: ${error.message}`);
    }
  },

  // KPIs principales
  async obtenerKPIs(filtros = {}) {
    try {
      let query = `
        SELECT 
          SUM(dv.cantidad) as ventas_totales,
          SUM(dv.subtotal) as ingresos_totales,
          (SELECT SUM(cantidad_actual) FROM Inventario) as stock_total,
          COUNT(DISTINCT v.idVenta) as total_transacciones,
          COUNT(DISTINCT c.idCliente) as clientes_unicos,
          COUNT(DISTINCT s.idSucursal) as sucursales_activas,
          AVG(v.total) as ticket_promedio
        FROM Venta v
        INNER JOIN detalleVenta dv ON v.idVenta = dv.Venta_idVenta
        INNER JOIN Cliente c ON v.Cliente_idCliente = c.idCliente
        INNER JOIN Sucursal s ON v.Sucursal_idSucursal = s.idSucursal
        WHERE 1=1
      `;
      
      const params = [];
      
      if (filtros.mes) {
        query += ' AND MONTH(v.fecha_venta) = ?';
        params.push(filtros.mes);
      }
      
      if (filtros.anio) {
        query += ' AND YEAR(v.fecha_venta) = ?';
        params.push(filtros.anio);
      }
      
      if (filtros.genero) {
        query += ' AND c.tipo_cliente = ?';
        params.push(filtros.genero);
      }
      
      if (filtros.sucursal) {
        query += ' AND s.nombre = ?';
        params.push(filtros.sucursal);
      }
      
      const [rows] = await db.query(query, params);
      
      // Calcular rotación promedio
      const rotacionQuery = `
        SELECT 
          AVG((dv.cantidad / NULLIF(i.cantidad_actual + dv.cantidad, 0)) * 100) as rotacion_promedio
        FROM detalleVenta dv
        INNER JOIN Venta v ON dv.Venta_idVenta = v.idVenta
        INNER JOIN Producto p ON dv.Producto_idProducto = p.idProducto
        INNER JOIN Cliente c ON v.Cliente_idCliente = c.idCliente
        INNER JOIN Sucursal s ON v.Sucursal_idSucursal = s.idSucursal
        LEFT JOIN Inventario i ON p.idProducto = i.Producto_idProducto 
          AND s.idSucursal = i.Sucursal_idSucursal
        WHERE 1=1 ${filtros.mes ? 'AND MONTH(v.fecha_venta) = ?' : ''}
      `;
      
      const rotacionParams = filtros.mes ? [filtros.mes] : [];
      const [rotacionRows] = await db.query(rotacionQuery, rotacionParams);
      
      return {
        ...rows[0],
        rotacion_promedio: rotacionRows[0]?.rotacion_promedio || 0
      };
    } catch (error) {
      throw new Error(`Error al calcular KPIs: ${error.message}`);
    }
  },

  // Top productos más vendidos
  async topProductosVendidos(limite = 10, filtros = {}) {
    try {
      let query = `
        SELECT 
          p.idProducto,
          p.nombre as producto,
          cat.nombre_categoria as categoria,
          p.genero,
          t.nombre as talla,
          SUM(dv.cantidad) as total_ventas,
          SUM(dv.subtotal) as ingresos_totales,
          AVG(dv.precio_unitario) as precio_promedio,
          COUNT(DISTINCT v.idVenta) as num_transacciones
        FROM detalleVenta dv
        INNER JOIN Venta v ON dv.Venta_idVenta = v.idVenta
        INNER JOIN Producto p ON dv.Producto_idProducto = p.idProducto
        INNER JOIN Categoria cat ON p.Categoria_idCategoria = cat.idCategoria
        INNER JOIN Talla t ON p.Talla_idTalla = t.idTalla
        INNER JOIN Cliente c ON v.Cliente_idCliente = c.idCliente
        INNER JOIN Sucursal s ON v.Sucursal_idSucursal = s.idSucursal
        WHERE 1=1
      `;
      
      const params = [];
      
      if (filtros.mes) {
        query += ' AND MONTH(v.fecha_venta) = ?';
        params.push(filtros.mes);
      }
      
      if (filtros.genero) {
        query += ' AND p.genero = ?';
        params.push(filtros.genero);
      }
      
      if (filtros.sucursal) {
        query += ' AND s.nombre = ?';
        params.push(filtros.sucursal);
      }
      
      query += `
        GROUP BY p.idProducto, p.nombre, cat.nombre_categoria, p.genero, t.nombre
        ORDER BY total_ventas DESC
        LIMIT ?
      `;
      params.push(limite);
      
      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener top productos: ${error.message}`);
    }
  },

  // Ventas por talla
  async ventasPorTalla(filtros = {}) {
    try {
      let query = `
        SELECT 
          t.nombre as talla,
          t.tipo_cliente as genero,
          SUM(dv.cantidad) as total_ventas,
          SUM(dv.subtotal) as ingresos_totales,
          COUNT(DISTINCT cat.idCategoria) as categorias_diferentes,
          AVG(dv.precio_unitario) as precio_promedio
        FROM detalleVenta dv
        INNER JOIN Venta v ON dv.Venta_idVenta = v.idVenta
        INNER JOIN Producto p ON dv.Producto_idProducto = p.idProducto
        INNER JOIN Talla t ON p.Talla_idTalla = t.idTalla
        INNER JOIN Categoria cat ON p.Categoria_idCategoria = cat.idCategoria
        WHERE 1=1
      `;
      
      const params = [];
      
      if (filtros.genero) {
        query += ' AND t.tipo_cliente = ?';
        params.push(filtros.genero);
      }
      
      if (filtros.mes) {
        query += ' AND MONTH(v.fecha_venta) = ?';
        params.push(filtros.mes);
      }
      
      query += `
        GROUP BY t.nombre, t.tipo_cliente
        ORDER BY total_ventas DESC
      `;
      
      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener ventas por talla: ${error.message}`);
    }
  },

  // Ventas por género
  async ventasPorGenero(filtros = {}) {
    try {
      let query = `
        SELECT 
          p.genero,
          SUM(dv.cantidad) as total_ventas,
          SUM(dv.subtotal) as ingresos_totales,
          AVG(dv.precio_unitario) as precio_promedio,
          COUNT(DISTINCT p.idProducto) as productos_diferentes
        FROM detalleVenta dv
        INNER JOIN Venta v ON dv.Venta_idVenta = v.idVenta
        INNER JOIN Producto p ON dv.Producto_idProducto = p.idProducto
        WHERE 1=1
      `;
      
      const params = [];
      
      if (filtros.mes) {
        query += ' AND MONTH(v.fecha_venta) = ?';
        params.push(filtros.mes);
      }
      
      if (filtros.sucursal) {
        query += ' AND v.Sucursal_idSucursal = (SELECT idSucursal FROM Sucursal WHERE nombre = ?)';
        params.push(filtros.sucursal);
      }
      
      query += ' GROUP BY p.genero ORDER BY total_ventas DESC';
      
      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener ventas por género: ${error.message}`);
    }
  },

  // Tendencia mensual
  async tendenciaMensual(anio = new Date().getFullYear()) {
    try {
      const query = `
        SELECT 
          MONTH(v.fecha_venta) as mes,
          DATE_FORMAT(v.fecha_venta, '%M') as nombre_mes,
          SUM(dv.cantidad) as total_ventas,
          SUM(dv.subtotal) as ingresos_totales,
          COUNT(DISTINCT v.idVenta) as num_transacciones,
          AVG(v.total) as ticket_promedio
        FROM Venta v
        INNER JOIN detalleVenta dv ON v.idVenta = dv.Venta_idVenta
        WHERE YEAR(v.fecha_venta) = ?
        GROUP BY MONTH(v.fecha_venta), DATE_FORMAT(v.fecha_venta, '%M')
        ORDER BY mes
      `;
      
      const [rows] = await db.query(query, [anio]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener tendencia mensual: ${error.message}`);
    }
  },

  // Productos con baja rotación (necesitan descuento)
  async productosBajaRotacion(limite = 10, umbralRotacion = 30) {
    try {
      const query = `
        SELECT 
          p.idProducto,
          p.nombre as producto,
          cat.nombre_categoria as categoria,
          p.genero,
          t.nombre as talla,
          s.nombre as sucursal,
          i.cantidad_actual as stock_disponible,
          COALESCE(SUM(dv.cantidad), 0) as ventas_totales,
          COALESCE(
            (SUM(dv.cantidad) / NULLIF(i.cantidad_actual + COALESCE(SUM(dv.cantidad), 0), 0)) * 100, 
            0
          ) as rotacion_promedio,
          p.precio as precio_actual,
          DATEDIFF(CURDATE(), MAX(v.fecha_venta)) as dias_sin_venta
        FROM Producto p
        INNER JOIN Categoria cat ON p.Categoria_idCategoria = cat.idCategoria
        INNER JOIN Talla t ON p.Talla_idTalla = t.idTalla
        INNER JOIN Inventario i ON p.idProducto = i.Producto_idProducto
        INNER JOIN Sucursal s ON i.Sucursal_idSucursal = s.idSucursal
        LEFT JOIN detalleVenta dv ON p.idProducto = dv.Producto_idProducto
        LEFT JOIN Venta v ON dv.Venta_idVenta = v.idVenta 
          AND v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
          AND v.Sucursal_idSucursal = s.idSucursal
        WHERE i.cantidad_actual > 0
        GROUP BY p.idProducto, p.nombre, cat.nombre_categoria, p.genero, 
                 t.nombre, s.nombre, i.cantidad_actual, p.precio
        HAVING rotacion_promedio < ?
        ORDER BY rotacion_promedio ASC, stock_disponible DESC, dias_sin_venta DESC
        LIMIT ?
      `;
      
      const [rows] = await db.query(query, [umbralRotacion, limite]);
      
      return rows.map(row => ({
        ...row,
        recomendacion: row.rotacion_promedio < 15 
          ? 'Aplicar descuento del 30-40% URGENTE' 
          : 'Aplicar descuento del 20-30%',
        descuento_sugerido: row.rotacion_promedio < 15 ? 35 : 25,
        urgencia: row.rotacion_promedio < 15 ? 'Alta' : 'Media',
        accion: 'Promoción inmediata',
        posible_perdida: (row.stock_disponible * row.precio_actual * 0.7).toFixed(2)
      }));
    } catch (error) {
      throw new Error(`Error al obtener productos baja rotación: ${error.message}`);
    }
  },

  // Productos con alta rotación (aumentar stock)
  async productosAltaRotacion(limite = 10, umbralRotacion = 70) {
    try {
      const query = `
        SELECT 
          p.idProducto,
          p.nombre as producto,
          cat.nombre_categoria as categoria,
          p.genero,
          t.nombre as talla,
          s.nombre as sucursal,
          i.cantidad_actual as stock_disponible,
          SUM(dv.cantidad) as ventas_totales,
          (SUM(dv.cantidad) / NULLIF(i.cantidad_actual + SUM(dv.cantidad), 0)) * 100 as rotacion_promedio,
          AVG(dv.precio_unitario) as precio_promedio,
          CASE 
            WHEN i.cantidad_actual < (SUM(dv.cantidad) * 0.3) THEN 'CRÍTICO'
            WHEN i.cantidad_actual < (SUM(dv.cantidad) * 0.5) THEN 'URGENTE'
            ELSE 'NORMAL'
          END as nivel_alerta,
          COUNT(DISTINCT v.idVenta) as frecuencia_compra
        FROM Producto p
        INNER JOIN Categoria cat ON p.Categoria_idCategoria = cat.idCategoria
        INNER JOIN Talla t ON p.Talla_idTalla = t.idTalla
        INNER JOIN Inventario i ON p.idProducto = i.Producto_idProducto
        INNER JOIN Sucursal s ON i.Sucursal_idSucursal = s.idSucursal
        INNER JOIN detalleVenta dv ON p.idProducto = dv.Producto_idProducto
        INNER JOIN Venta v ON dv.Venta_idVenta = v.idVenta 
          AND v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 2 MONTH)
          AND v.Sucursal_idSucursal = s.idSucursal
        GROUP BY p.idProducto, p.nombre, cat.nombre_categoria, p.genero, 
                 t.nombre, s.nombre, i.cantidad_actual
        HAVING rotacion_promedio > ?
        ORDER BY rotacion_promedio DESC, stock_disponible ASC
        LIMIT ?
      `;
      
      const [rows] = await db.query(query, [umbralRotacion, limite]);
      
      return rows.map(row => ({
        ...row,
        recomendacion: `Aumentar stock en ${Math.ceil(row.ventas_totales * 0.5)} unidades`,
        stock_sugerido: Math.ceil(row.ventas_totales * 1.5),
        stock_minimo: Math.ceil(row.ventas_totales * 0.7),
        accion: 'Reposición prioritaria',
        ingreso_potencial: (Math.ceil(row.ventas_totales * 0.5) * row.precio_promedio).toFixed(2)
      }));
    } catch (error) {
      throw new Error(`Error al obtener productos alta rotación: ${error.message}`);
    }
  },

  // Comparativo entre sucursales
  async comparativoSucursales(filtros = {}) {
    try {
      let query = `
        SELECT 
          s.idSucursal,
          s.nombre as sucursal,
          s.ciudad,
          SUM(dv.cantidad) as total_ventas,
          SUM(dv.subtotal) as ingresos_totales,
          COUNT(DISTINCT v.idVenta) as num_transacciones,
          COUNT(DISTINCT p.idProducto) as productos_vendidos,
          AVG(v.total) as ticket_promedio,
          (SELECT SUM(cantidad_actual) 
           FROM Inventario 
           WHERE Sucursal_idSucursal = s.idSucursal) as stock_actual
        FROM Sucursal s
        LEFT JOIN Venta v ON s.idSucursal = v.Sucursal_idSucursal
        LEFT JOIN detalleVenta dv ON v.idVenta = dv.Venta_idVenta
        LEFT JOIN Producto p ON dv.Producto_idProducto = p.idProducto
        WHERE 1=1
      `;
      
      const params = [];
      
      if (filtros.mes) {
        query += ' AND MONTH(v.fecha_venta) = ?';
        params.push(filtros.mes);
      }
      
      if (filtros.anio) {
        query += ' AND YEAR(v.fecha_venta) = ?';
        params.push(filtros.anio);
      }
      
      query += ' GROUP BY s.idSucursal, s.nombre, s.ciudad ORDER BY ingresos_totales DESC';
      
      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener comparativo sucursales: ${error.message}`);
    }
  },

  // Ventas por categoría
  async ventasPorCategoria(filtros = {}) {
    try {
      let query = `
        SELECT 
          cat.idCategoria,
          cat.nombre_categoria as categoria,
          SUM(dv.cantidad) as total_ventas,
          SUM(dv.subtotal) as ingresos_totales,
          COUNT(DISTINCT p.idProducto) as productos_diferentes,
          AVG(dv.precio_unitario) as precio_promedio
        FROM Categoria cat
        INNER JOIN Producto p ON cat.idCategoria = p.Categoria_idCategoria
        INNER JOIN detalleVenta dv ON p.idProducto = dv.Producto_idProducto
        INNER JOIN Venta v ON dv.Venta_idVenta = v.idVenta
        WHERE 1=1
      `;
      
      const params = [];
      
      if (filtros.mes) {
        query += ' AND MONTH(v.fecha_venta) = ?';
        params.push(filtros.mes);
      }
      
      if (filtros.genero) {
        query += ' AND p.genero = ?';
        params.push(filtros.genero);
      }
      
      query += ' GROUP BY cat.idCategoria, cat.nombre_categoria ORDER BY total_ventas DESC';
      
      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener ventas por categoría: ${error.message}`);
    }
  },

  // Registrar nueva venta
  async registrarVenta(datosVenta, detalles) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Insertar venta
      const [ventaResult] = await connection.query(
        'INSERT INTO Venta (fecha_venta, cantidad, total, Cliente_idCliente, Sucursal_idSucursal) VALUES (?, ?, ?, ?, ?)',
        [datosVenta.fecha_venta, datosVenta.cantidad, datosVenta.total, datosVenta.Cliente_idCliente, datosVenta.Sucursal_idSucursal]
      );
      
      const idVenta = ventaResult.insertId;
      
      // Insertar detalles y actualizar inventario
      for (const detalle of detalles) {
        await connection.query(
          'INSERT INTO detalleVenta (cantidad, precio_unitario, subtotal, Producto_idProducto, Venta_idVenta) VALUES (?, ?, ?, ?, ?)',
          [detalle.cantidad, detalle.precio_unitario, detalle.subtotal, detalle.Producto_idProducto, idVenta]
        );
        
        // Actualizar inventario
        await connection.query(
          'UPDATE Inventario SET cantidad_actual = cantidad_actual - ? WHERE Producto_idProducto = ? AND Sucursal_idSucursal = ?',
          [detalle.cantidad, detalle.Producto_idProducto, datosVenta.Sucursal_idSucursal]
        );
      }
      
      await connection.commit();
      return idVenta;
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error al registrar venta: ${error.message}`);
    } finally {
      connection.release();
    }
  },

  // Actualizar inventario
  async actualizarInventario(productoId, sucursalId, nuevaCantidad) {
    try {
      const query = 'UPDATE Inventario SET cantidad_actual = ? WHERE Producto_idProducto = ? AND Sucursal_idSucursal = ?';
      const [result] = await db.query(query, [nuevaCantidad, productoId, sucursalId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al actualizar inventario: ${error.message}`);
    }
  },

  // Obtener estado del inventario
  async obtenerEstadoInventario(sucursalId = null) {
    try {
      let query = `
        SELECT 
          p.idProducto,
          p.nombre as producto,
          cat.nombre_categoria as categoria,
          p.genero,
          t.nombre as talla,
          s.nombre as sucursal,
          i.cantidad_actual,
          p.precio,
          (i.cantidad_actual * p.precio) as valor_inventario
        FROM Inventario i
        INNER JOIN Producto p ON i.Producto_idProducto = p.idProducto
        INNER JOIN Categoria cat ON p.Categoria_idCategoria = cat.idCategoria
        INNER JOIN Talla t ON p.Talla_idTalla = t.idTalla
        INNER JOIN Sucursal s ON i.Sucursal_idSucursal = s.idSucursal
        WHERE 1=1
      `;
      
      const params = [];
      
      if (sucursalId) {
        query += ' AND i.Sucursal_idSucursal = ?';
        params.push(sucursalId);
      }
      
      query += ' ORDER BY i.cantidad_actual ASC';
      
      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estado inventario: ${error.message}`);
    }
  }
};

module.exports = InventarioModel;