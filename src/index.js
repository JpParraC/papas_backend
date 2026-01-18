import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import morgan from 'morgan'

// Rutas
import authRoutes from './routes/auth.routes.js'
import usuariosRoutes from './routes/usuarios.router.js'
import rolesRoutes from './routes/roles.router.js'
import cultivosRoutes from './routes/cultivos.routes.js'
import cosechasRoutes from './routes/cosechas.routes.js'
import ventasRoutes from './routes/venta.routes.js'
import pagosRoutes from './routes/pagos.routes.js'
import clienteRoutes from './routes/cliente.routes.js'
import productoRoutes from './routes/producto.routes.js'
import proveedorRoutes from './routes/proveedor.routes.js'
import inventarioRoutes from './routes/inventario.routes.js'
import compraRoutes from './routes/compra.routes.js'
import detcompRoutes from './routes/detcomp.routes.js'
import personalRoutes from './routes/personal.router.js'
import cargosRoutes from './routes/cargos.router.js'
import produccRoutes from './routes/producc.routes.js'
import reportesRoutes from './routes/reportes.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'

dotenv.config()
const app = express()

// ======================
// MIDDLEWARES GLOBALES
// ======================
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

// ======================
// RUTAS API
// ======================
app.use('/api/auth', authRoutes)
app.use('/api/usuarios', usuariosRoutes)
app.use('/api/roles', rolesRoutes)
app.use('/api/cultivos', cultivosRoutes)
app.use('/api/cosechas', cosechasRoutes)
app.use('/api/ventas', ventasRoutes)
app.use('/api/pagos', pagosRoutes)
app.use('/api/clientes', clienteRoutes)
app.use('/api/productos', productoRoutes)
app.use('/api/proveedores', proveedorRoutes)
app.use('/api/inventario', inventarioRoutes)
app.use('/api/compras', compraRoutes)
app.use('/api/detcompras', detcompRoutes)
app.use('/api/personal', personalRoutes)
app.use('/api/cargos', cargosRoutes)
app.use('/api/producc', produccRoutes)
app.use('/api/reportes', reportesRoutes)
app.use('/api/dashboard', dashboardRoutes)

// ======================
// HEALTH CHECK
// ======================
app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'API running', time: new Date() })
})

// ======================
// MANEJO GLOBAL DE ERRORES
// ======================
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  })
})

// ======================
// SERVIDOR
// ======================
const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`)
})
