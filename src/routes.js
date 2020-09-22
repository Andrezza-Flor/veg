const express = require('express')

const routes  = express.Router()

const GerenteController = require('./controllers/GerenteController')
const LoginController = require('./controllers/LoginController')
const MenuController = require('./controllers/MenuController')
const ColaboradorController = require('./controllers/ColaboradorController')
const AtividadeController = require('./controllers/AtividadeController')
const CompraController = require('./controllers/ComprasController')


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
    .get('/realizarCompra', CompraController.realizarCompra)
    .post('/buscarFornecedor', CompraController.buscarFornecedor)
    .get('/comprarInsumo', CompraController.comprarInsumo)
    .post('/escolherInsumo', CompraController.escolherInsumo)
    .post('/adicionarItem', CompraController.adicionarItem)
    .get('/finalizaCompra', CompraController.finalizaCompra)

    //Fornecedor
    .get('/criarFornecedor', CompraController.apresentarCriarFornecedor)
    .post('/criarFornecedor', CompraController.criarFornecedor)
    .post('/buscaInsumo', CompraController.buscaInsumo)
    .post('/adicionarInsumo', CompraController.adicionarInsumo)
    .get('/adicionarInsumo', CompraController.adicionarInsumoII)

    //Insumo
    .get('/criarInsumo', CompraController.insumo)
    .post('/criarInsumo', CompraController.criarInsumo)

    //Hortaliça
    .post('/criarHortalica', CompraController.criarHortalica)




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
    .get('/criarAtividade', AtividadeController.indexCriar)
    .post('/criarAtividade', AtividadeController.create)

// Perfil
    .get('/perfil', MenuController.perfil)

module.exports = routes