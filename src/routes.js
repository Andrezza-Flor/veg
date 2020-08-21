const express = require('express')

const routes  = express.Router()

const UserController = require('./controllers/UsuarioController')

routes.get('/usuarios', UserController.index)

module.exports = routes