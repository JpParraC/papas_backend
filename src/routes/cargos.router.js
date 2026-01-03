// routes/cargos.router.js
const express = require('express')
const router = express.Router()
const { getCargos } = require('../controllers/cargos.controller')

// GET /api/cargos -> devuelve todos los cargos
router.get('/', getCargos)

module.exports = router
