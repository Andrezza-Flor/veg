const express = require('express')

const routes  = express.Router()

const GerenteController = require('./controllers/GerenteController')
const ColaboradorController = require('./controllers/ColaboradorController')
const PlantacaoController = require('./controllers/PlantacaoController')
const LoginController = require('./controllers/LoginController')
const ArmazemController = require('./controllers/ArmazemController')
const CeleiroController = require('./controllers/CeleiroController')
const InsumoController = require('./controllers/InsumoController')
const HortalicaController = require('./controllers/HortalicaController')
const FornecedorController = require('./controllers/FornecedorController')
const ClienteController = require('./controllers/ClienteController ')
const VendaController = require('./controllers/VendaController')
const CompraController = require('./controllers/CompraController')

// Gerente
routes
    .get('/gerente', GerenteController.index)
    .post('/gerente', GerenteController.create)
    .put('/gerente/:email_Usuario', GerenteController.update )
    .delete('/gerente/:email_Usuario', GerenteController.delete )

// Colaborador
    .get('/colaborador', ColaboradorController.index)
    .post('/colaborador', ColaboradorController.create)

// Plantacao
    .get('/plantacao', PlantacaoController.index)

// Login
    .get('/login', LoginController.index)

// Armazem
    .get('/armazem', ArmazemController.index)

// Celeiro
    .get('/celeiro', CeleiroController.index)
    .post('/celeiro', CeleiroController.create)

// Insumo
    .get('/insumo', InsumoController.index)
    .post('/insumo', InsumoController.create)
    .delete('/insumo/:cod_Insumo', InsumoController.delete)

// Hortalicas
    .get('/hortalica', HortalicaController.index)

// Fornecedores
    .get('/fornecedor', FornecedorController.index)
    .post('/fornecedor', FornecedorController.create)
    .delete('/fornecedor/:cod_Fornecedor', FornecedorController.delete )

// Clientes
    .get('/cliente/:cod_Plantacao', ClienteController.index)
    .post('/cliente', ClienteController.create)

// Pedidos de Venda
    .get('/venda', VendaController.index)
    .post('/venda', VendaController.create)
    .delete('/venda/:cod_Pedido_Venda', VendaController.delete)

// Pedidos de Compra
    .get('/compra', CompraController.index)
    .post('/compra', CompraController.create)

module.exports = routes