const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const path = require('path');
const session = require('express-session');
const app = express(); // Initialize the app
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const flash = require('connect-flash');
const { parse } = require('json2csv');

// Configuración de la base de datos
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'alejandra45',
    database: 'pan',
    port: 3307
});

// Conectar a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

// Configuración de express-session
app.use(session({
    secret: 'secreto', // Cambia esto por una cadena secreta en producción
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Asegúrate de ajustar esto en producción
}));

// Configuración de connect-flash
app.use(flash());

// Middleware para pasar mensajes flash a las vistas
app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configurar el directorio 'public' para archivos estáticos como CSS y JS
app.use(express.static(path.join(__dirname, 'public')));

// Rutas para las páginas
app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/productos', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'productos.html'));
});

app.get('/contacto', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'contacto.html'));
});

app.get('/historia', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'historia.html'));
});

app.get('/carrito', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'carrito.html'));
});

app.get('/pago', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'pago.html'));
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

app.get('/usuarios', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'usuarios.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

app.get('/inventario', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'inventario.html'));
});

app.get('/materia-prima', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'materia-prima.html'));
});

app.get('/ajustes', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'ajustes.html'));
});

// Ruta para la vista del módulo de ventas
app.get('/ventas', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'ventas.html')); // Cambia la ruta según donde esté tu archivo ventas.html
});

// Ruta para la vista del módulo de cliente
app.get('/cliente', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'cliente.html')); // Cambia la ruta según donde esté tu archivo ventas.html
});

// Ruta para confirmar el pago
app.post('/confirmar-pago', (req, res) => {
    const { name, email, address, phone } = req.body;

    const query = 'INSERT INTO cliente (nombre, correo, direccion, telefono) VALUES (?, ?, ?, ?)';
    db.query(query, [name, email, address, phone], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error al guardar el cliente.' });
        }
        res.status(201).json({ message: 'Cliente guardado exitosamente.' });
    });
});

// Rutas para el módulo de usuarios
app.get('/api/usuarios', (req, res) => {
    db.query('SELECT * FROM usuario', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/usuarios/:id', (req, res) => {
    const id = req.params.id;
    console.log(`Buscando usuario con ID: ${id}`); // Log para verificar si el ID es correcto

    // Consulta a la base de datos para obtener el usuario
    db.query('SELECT * FROM usuario WHERE id = ?', [id], (error, results) => {
        if (error) {
            console.error('Error en la consulta:', error); // Log para verificar errores en la consulta
            return res.status(500).json({ error: 'Error en la consulta' });
        }
        if (results.length > 0) {
            console.log('Usuario encontrado:', results[0]); // Log para verificar el resultado
            res.json(results[0]); // Devuelve el usuario encontrado en formato JSON
        } else {
            console.log('Usuario no encontrado'); // Log si no se encuentra el usuario
            res.status(404).json({ error: 'Usuario no encontrado' });
        }
    });
});

app.post('/api/productos', (req, res) => {
    const { nombre, precio, descripcion, categoria_id, cantidad_stock } = req.body;

    // Validar que todos los campos son obligatorios
    if (!nombre || !precio || !descripcion || !categoria_id || cantidad_stock === undefined) {
        return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
    }

    // Consulta para insertar el producto
    const query = `INSERT INTO producto (nombre, precio, descripcion, categoria_id, cantidad_stock) VALUES (?, ?, ?, ?, ?)`;

    db.query(query, [nombre, precio, descripcion, categoria_id, cantidad_stock], (err, result) => {
        if (err) {
            console.error('Error al insertar el producto:', err);
            return res.status(500).json({ success: false, message: 'Error al insertar el producto: ' + err.message });
        }

        res.status(201).json({ success: true, message: 'Producto creado exitosamente.' });
    });
});

app.put('/api/productos/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, precio, descripcion, categoria_id, cantidad_stock } = req.body;

    // Validar que todos los campos son obligatorios
    if (!nombre || !precio || !descripcion || !categoria_id || cantidad_stock === undefined) {
        return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
    }

    // Consulta para actualizar el producto
    const query = `UPDATE producto SET nombre = ?, precio = ?, descripcion = ?, categoria_id = ?, cantidad_stock = ? WHERE id = ?`;

    db.query(query, [nombre, precio, descripcion, categoria_id, cantidad_stock, id], (err, result) => {
        if (err) {
            console.error('Error al actualizar el producto:', err);
            return res.status(500).json({ success: false, message: 'Error en el servidor.' });
        }

        res.json({ success: true, message: 'Producto actualizado exitosamente.' });
    });
});

app.get('/api/productos', (req, res) => {
    const query = `
        SELECT p.id, p.nombre, p.precio, p.descripcion, c.nombre AS categoria, p.cantidad_stock
        FROM producto p
        LEFT JOIN categoria c ON p.categoria_id = c.id
    `;

    db.query(query, (error, results) => {
        if (error) {
            console.error('Error al obtener productos:', error);
            return res.status(500).json({ success: false, message: 'Error al obtener productos.' });
        }
        res.json({ success: true, data: results });
    });
});


app.get('/api/productos/:id', (req, res) => {
    const { id } = req.params;

    db.query('SELECT * FROM producto WHERE id = ?', [id], (error, results) => {
        if (error || results.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        }
        res.json({ success: true, data: results[0] });
    });
});

app.delete('/api/productos/:id', (req, res) => {
    const productId = req.params.id;
    const query = 'DELETE FROM producto WHERE id = ?';

    db.query(query, [productId], (error, result) => {
        if (error) {
            console.error('Error al eliminar el producto:', error);
            return res.status(500).json({ success: false, message: 'Error en el servidor.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        }

        res.json({ success: true, message: 'Producto eliminado exitosamente.' });
    });
});

// Módulo de ventas
app.post('/api/ventas', (req, res) => {
    const { cliente_id, producto_id, cantidad, precio_unitario } = req.body;

    // Validar que todos los campos son obligatorios
    if (!cliente_id || !producto_id || !cantidad || !precio_unitario) {
        return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
    }

    // Iniciar transacción
    db.beginTransaction(err => {
        if (err) {
            console.error('Error al iniciar transacción:', err);
            return res.status(500).json({ success: false, message: 'Error al iniciar transacción.' });
        }

        // Consulta para insertar la venta
        const ventaQuery = `INSERT INTO ventas (cliente_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)`;
        db.query(ventaQuery, [cliente_id, producto_id, cantidad, precio_unitario], (err, result) => {
            if (err) {
                console.error('Error al registrar la venta:', err);
                return db.rollback(() => {
                    return res.status(500).json({ success: false, message: 'Error al registrar la venta.' });
                });
            }

            // Consulta para reducir el stock
            const updateStockQuery = `UPDATE producto SET cantidad_stock = cantidad_stock - ? WHERE id = ?`;
            db.query(updateStockQuery, [cantidad, producto_id], (err, result) => {
                if (err) {
                    console.error('Error al reducir el stock:', err);
                    return db.rollback(() => {
                        return res.status(500).json({ success: false, message: 'Error al reducir el stock.' });
                    });
                }

                // Confirmar transacción
                db.commit(err => {
                    if (err) {
                        console.error('Error al confirmar la transacción:', err);
                        return db.rollback(() => {
                            return res.status(500).json({ success: false, message: 'Error en la transacción.' });
                        });
                    }
                    res.status(201).json({ success: true, message: 'Venta registrada exitosamente.' });
                });
            });
        });
    });
});

// Módulo de ventas - Obtener todas las ventas
// Módulo de ventas - Obtener todas las ventas con nombres de productos y clientes
// Módulo de ventas - Obtener todas las ventas
app.get('/api/ventas', (req, res) => {
    const query = `
        SELECT v.id, v.cantidad, v.precio_unitario, v.fecha_venta, 
               p.nombre AS producto_nombre, c.nombre AS cliente_nombre
        FROM ventas v
        JOIN producto p ON v.producto_id = p.id
        JOIN cliente c ON v.cliente_id = c.id
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error en la consulta SQL:', err); // Imprimir el error
            return res.status(500).json({ success: false, message: 'Error al obtener las ventas.' });
        }
        res.status(200).json({ success: true, data: results });
    });
});

// Módulo de ventas - Editar una venta
// Módulo de ventas - Editar una venta
app.put('/api/ventas/:id', (req, res) => {
    const saleId = req.params.id;
    const { cantidad, precio_unitario, fecha_venta } = req.body;

    const query = 'UPDATE ventas SET cantidad = ?, precio_unitario = ?, fecha_venta = ? WHERE id = ?';
    db.query(query, [cantidad, precio_unitario, fecha_venta, saleId], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error al actualizar la venta.' });
        }
        res.status(200).json({ success: true, message: 'Venta actualizada correctamente.' });
    });
});

// Obtener todos los productos
// Endpoint para obtener todos los productos
app.get('/api/productos', (req, res) => {
    const query = 'SELECT id, nombre FROM producto';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error en la consulta SQL:', err);
            return res.status(500).json({ success: false, message: 'Error al obtener los productos.' });
        }
        res.status(200).json({ success: true, data: results });
    });
});

// Módulo de ventas - Eliminar una venta
app.delete('/api/ventas/:id', (req, res) => {
    const saleId = req.params.id;

    const query = 'DELETE FROM ventas WHERE id = ?';
    db.query(query, [saleId], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error al eliminar la venta.' });
        }
        res.status(200).json({ success: true, message: 'Venta eliminada exitosamente.' });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Consulta a la base de datos para buscar el usuario por email
    db.query('SELECT * FROM usuario WHERE correo = ?', [email], async (err, results) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).send('Error en el servidor');
        }

        if (results.length === 0) {
            // Usuario no encontrado
            return res.status(401).send('Usuario no encontrado');
        }

        const user = results[0];

        // Verifica si el estado del usuario es "activo"
        if (user.estado !== 'activo') {
            return res.status(401).send('Usuario inactivo');
        }

        // Compara la contraseña ingresada con la contraseña hasheada en la base de datos
        try {
            const match = await bcrypt.compare(password, user.password);

            if (match) {
                // Contraseña correcta, guarda el ID del usuario en la sesión
                req.session.userId = user.id_usuario;  // Asegúrate de que coincida con el nombre de la columna del ID en tu base de datos
                req.session.rol = user.rol; // Si deseas guardar el rol del usuario

                // Redirige al dashboard o a otra página según lo desees
                return res.redirect('/dashboard');
            } else {
                // Contraseña incorrecta
                return res.status(401).send('Contraseña incorrecta');
            }
        } catch (error) {
            console.error('Error al comparar contraseñas:', error);
            return res.status(500).send('Error en el servidor');
        }
    });
});

app.get('/dashboard', (req, res) => {
    // Verifica si el usuario está autenticado
    if (!req.session.userId) {
        return res.redirect('/login'); // Redirige a login si no está autenticado
    }

    // Renderiza el dashboard
    res.render('dashboard'); // Asegúrate de que tengas una vista de dashboard
});


// Ruta para obtener todas las materias primas (Leer)
// Ruta para obtener todas las materias primas (Leer)
app.get('/materia-prima/listar', (req, res) => {
    db.query('SELECT * FROM inventario_prima', (error, results) => {
        if (error) {
            console.error('Error al realizar la consulta:', error);
            return res.status(500).json({ error: 'Error al obtener datos' }); // Enviar error al cliente
        }
        
        console.log('Datos obtenidos:', results);
        res.json(results); // Enviar los resultados al cliente
    });
});   


// Ruta para agregar una nueva materia prima (Crear)
app.post('/materia-prima/guardar', (req, res) => {
    const { id_prima, nombre, descripcion, cantidad_actual, unidad_medida, fecha_entrada, fecha_caducidad, proveedor, precio_unitario } = req.body;

    // Si hay ID, entonces es una actualización; si no, es una inserción
    if (id_prima) {
        // Actualizar materia prima existente
        const sql = `UPDATE inventario_prima 
                     SET nombre = ?, descripcion = ?, cantidad_actual = ?, unidad_medida = ?, fecha_entrada = ?, fecha_caducidad = ?, proveedor = ?, precio_unitario = ? 
                     WHERE id_prima = ?`;
        const values = [nombre, descripcion, cantidad_actual, unidad_medida, fecha_entrada, fecha_caducidad, proveedor, precio_unitario, id_prima];
        db.query(sql, values, (err, result) => {
            if (err) throw err;
            res.redirect('/materia-prima');
        });
    } else {
        // Insertar nueva materia prima
        const sql = `INSERT INTO inventario_prima (nombre, descripcion, cantidad_actual, unidad_medida, fecha_entrada, fecha_caducidad, proveedor, precio_unitario) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [nombre, descripcion, cantidad_actual, unidad_medida, fecha_entrada, fecha_caducidad, proveedor, precio_unitario];
        db.query(sql, values, (err, result) => {
            if (err) throw err;
            res.redirect('/materia-prima');
        });
    }
});

app.get('/materia-prima/obtener/:id', (req, res) => {
    const id = req.params.id; // Obtén el ID de la materia prima de los parámetros de la URL

    const sql = 'SELECT * FROM inventario_prima WHERE id_prima = ?'; // Consulta SQL para obtener la materia prima
    db.query(sql, [id], (err, result) => {
        if (err) {
            res.status(500).send('Error al obtener la materia prima');
            return;
        }
        if (result.length > 0) {
            res.json(result[0]); // Devuelve el primer resultado como JSON
        } else {
            res.status(404).send('Materia prima no encontrada');
        }
    });
});

// Ruta para eliminar una materia prima (Eliminar)
// Ruta para eliminar una materia prima
app.delete('/materia-prima/eliminar/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM inventario_prima WHERE id_prima = ?';
    db.query(sql, [id], (err, result) => {
        if (err) throw err;
        res.sendStatus(200); // Enviar estado 200 para confirmar la eliminación
    });
});

//Rutas de cliente
// Crear cliente
app.post('/api/clientes', (req, res) => {
    const { nombre, direccion, telefono, correo } = req.body;

    if (!nombre || !direccion || !telefono || !correo) {
        return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
    }

    const query = 'INSERT INTO cliente (nombre, direccion, telefono, correo) VALUES (?, ?, ?, ?)';
    db.query(query, [nombre, direccion, telefono, correo], (err, result) => {
        if (err) {
            console.error('Error al crear cliente:', err);
            return res.status(500).json({ success: false, message: 'Error al crear cliente.' });
        }
        res.status(201).json({ success: true, message: 'Cliente creado exitosamente.', clienteId: result.insertId });
    });
});

// Leer todos los clientes
app.get('/api/clientes', (req, res) => {
    const query = 'SELECT * FROM cliente';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener clientes:', err);
            return res.status(500).json({ success: false, message: 'Error al obtener clientes.' });
        }
        res.json(results);
    });
});

// Leer cliente por ID
app.get('/api/clientes/:id', (req, res) => {
    const { id } = req.params;

    const query = 'SELECT * FROM cliente WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener cliente:', err);
            return res.status(500).json({ success: false, message: 'Error al obtener cliente.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
        }
        res.json(results[0]);
    });
});

// Actualizar cliente
app.put('/api/clientes/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, direccion, telefono, correo } = req.body;

    if (!nombre || !direccion || !telefono || !correo) {
        return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
    }

    const query = 'UPDATE cliente SET nombre = ?, direccion = ?, telefono = ?, correo = ? WHERE id = ?';
    db.query(query, [nombre, direccion, telefono, correo, id], (err, result) => {
        if (err) {
            console.error('Error al actualizar cliente:', err);
            return res.status(500).json({ success: false, message: 'Error al actualizar cliente.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
        }
        res.json({ success: true, message: 'Cliente actualizado exitosamente.' });
    });
});

// Eliminar cliente
app.delete('/api/clientes/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM cliente WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar cliente:', err);
            return res.status(500).json({ success: false, message: 'Error al eliminar cliente.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
        }
        res.json({ success: true, message: 'Cliente eliminado exitosamente.' });
    });
});

// Iniciar el servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en 3000`);
});
