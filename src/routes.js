const express = require('express')

const routes  = express.Router()

const GerenteController = require('./controllers/GerenteController')
const LoginController = require('./controllers/LoginController')
const MenuController = require('./controllers/MenuController')
const ColaboradorController = require('./controllers/ColaboradorController')

routes
//Login
    .get('/', LoginController.index)
    .post('/access', LoginController.access)
    
// Gerente
    .get('/cadastro', GerenteController.index)
    .post('/cadastrar', GerenteController.create)
    // .put('/gerente/:email_Usuario', GerenteController.update )
    // .delete('/gerente/:email_Usuario', GerenteController.delete )

// Celeiro
    .get('/celeiro', MenuController.celeiro)

// Armazem
    .get('/armazem', MenuController.armazem)

// Compra
    .get('/compra', MenuController.compra)    

// Venda
    .get('/venda', MenuController.venda) 

// Colaborador
    .get('/colaborador', MenuController.colaborador)
    .get('/cadastroColaborador', ColaboradorController.index)
    .post('/criarColaborador', ColaboradorController.create)

// Estufa
    .get('/estufa', MenuController.estufa) 

// Relatório
    .get('/relatorio', MenuController.relatorio) 

// Atividade
    .get('/atividade', MenuController.atividade) 

// Perfil
    .get('/perfil', MenuController.perfil)

module.exports = routes