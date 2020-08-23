const express = require('express')

const routes  = express.Router()

const UserController = require('./controllers/UsuarioController')

routes.get('/usuarios', UserController.index)

routes.post('/usuarios', UserController.create)

routes.put('/usuarios/:email_Usuario', UserController.update )

routes.delete('/usuarios/:email_Usuario', UserController.delete )

module.exports = routes