const express = require('express')

const routes  = express.Router()

const GerenteController = require('./controllers/GerenteController')
const LoginController = require('./controllers/LoginController')
const MenuController = require('./controllers/MenuController')
const ColaboradorController = require('./controllers/ColaboradorController')
const AtividadeController = require('./controllers/AtividadeController')
const CompraController = require('./controllers/ComprasController')
const EstufaController = require('./controllers/EstufaController')
const CeleiroController = require('./controllers/CeleiroController')
const ArmazemController = require('./controllers/ArmazemController')
const VendaController = require('./controllers/VendaController')
const FinancaController = require('./controllers/FinancasController')
const FluxoCaixa = require('./controllers/FluxoCaixaController')
const Balanco = require('./controllers/BalancoController')

routes
//Login
    .get('/', LoginController.index)
    .post('/access', LoginController.access)
    .get('/home', MenuController.home)
    
// Gerente
    .get('/cadastro', GerenteController.index)
    .post('/cadastrar', GerenteController.create)
    // .put('/gerente/:email_Usuario', GerenteController.update )
    // .delete('/gerente/:email_Usuario', GerenteController.delete )

// Celeiro
    .get('/celeiro', MenuController.celeiro)

// Armazem
    .get('/armazem', MenuController.armazem)
    .post('/detalheHortalica', ArmazemController.detalheHortalica)
    .get('/editarHortalica', ArmazemController.paginaEdicao)
    .post('/editarHortalica', ArmazemController.editarHortalica)

// Balanço
    .get('/balanco', MenuController.balanco)
    .get('/ativoCirculante', Balanco.ativoCirculante)
    .get('/ativoPermanente', Balanco.ativoPermanente)
    .get('/passivoCirculante', Balanco.passivoCirculante)
    .get('/passivoPermanente', Balanco.passivoPermanente)
    


// Fluxo de Caixa
    .get('/fluxoCaixa', MenuController.fluxoCaixa)
    // Entradas
    .get('/entrada', FluxoCaixa.entrada)
    .post('/entrada', FluxoCaixa.buscaEntrada)
    .get('/cadastrarEntrada', FluxoCaixa.criarEntrada)
    .post('/cadastrarEntrada', FluxoCaixa.salvarEntrada)
    .post('/acessarEntrada', FluxoCaixa.acessarEntrada)
    .get('/editarEntrada', FluxoCaixa.paginaEditarEntrada)
    .post('/editarEntrada', FluxoCaixa.editarEntrada)
    .get('/excluirEntrada', FluxoCaixa.excluirEntrada)
    // Saidas
    .get('/saida', FluxoCaixa.saida)
    .post('/saida', FluxoCaixa.buscarSaida)
    .get('/cadastrarSaida', FluxoCaixa.criarSaida)
    .post('/cadastrarSaida', FluxoCaixa.salvarSaida)
    .post('/acessarSaida', FluxoCaixa.acessarSaida)
    .get('/editarSaida', FluxoCaixa.paginaEditarSaida)
    .post('/editarSaida', FluxoCaixa.editarSaida)
    .get('/excluirSaida', FluxoCaixa.excluirSaida)
    

// Finanças
    .get('/financas', MenuController.financas)
    .get('/criarFinanciamento', FinancaController.paginaCriar)
    .post('/calcularFinanciamento', FinancaController.calcularFinancimento)
    .post('/criarConta', FinancaController.cadastrarConta)
    
// Compra
    .get('/compra', MenuController.compra)
    
    //Detalhe-Compra
    .post('/detalhePedido', CompraController.detalhePedido)
    .get('/entrarCeleiro', CompraController.entrarCeleiro)

    //Comprar
    .get('/realizarCompra', CompraController.comprar)
    .post('/buscarFornecedor', CompraController.escolherFornecedor)
    .get('/comprarInsumo', CompraController.comprarInsumo)
    .post('/escolherInsumo', CompraController.escolherInsumo)
    .post('/adicionarItem', CompraController.adicionarItem)
    .get('/finalizaCompra', CompraController.finalizaCompra)
    .get('/salvarCompra', CompraController.salvarCompra)

    //Fornecedor
    .get('/criarFornecedor', CompraController.apresentarCriarFornecedor)
    .post('/criarFornecedor', CompraController.criarFornecedor)
    .get('/adicionarInsumo', CompraController.adicionarInsumoII)
    .post('/buscaInsumo', CompraController.buscaInsumo)
    .post('/adicionarInsumo', CompraController.adicionarInsumo)
    

    //Insumo
    .get('/criarInsumo', CompraController.insumo)
    .post('/criarInsumo', CompraController.criarInsumo)

    //Hortaliça
    .post('/criarHortalica', CompraController.criarHortalica)


// Venda
    .get('/venda', MenuController.venda)
    
    //Vender
    .get('/escolherCliete', VendaController.vender)
    .post('/escolherCliente', VendaController.escolherCliente)
    .get('/escolherHortalica', VendaController.buscaHortalica)
    .post('/escolherHortalica', VendaController.escolherHortalica)
    .post('/adicionarHortalica', VendaController.adicioanarItem)
    .get('/finalizarVenda', VendaController.finalizarVenda)
    .get('/salvarVenda', VendaController.salvarVenda)

    //Cliente
    .get('/adicionarCliente', VendaController.adicionarCliente)
    .post('/adicionarCliente', VendaController.salvarCliente)


// Colaborador
    .get('/colaborador', MenuController.colaborador)
    .get('/cadastroColaborador', ColaboradorController.index)
    .post('/criarColaborador', ColaboradorController.create)
    .post('/detalheColaborador', ColaboradorController.paginaDetalhe)
    .get('/editarColaborador', ColaboradorController.paginaEditar)
    .get('/inabilitarColaborador', ColaboradorController.inabilitar)
    .post('/editarColaborador', ColaboradorController.editar)
    

// Estufa
    .get('/estufa', MenuController.estufa)
    .get('/aplicarInsumo', EstufaController.paginaAplicarInsumo)
    .post('/buscarInsumo', EstufaController.buscarInsumo)
    .post('/aplicarInsumo', EstufaController.aplicarInsumo)
    .post('/detalheInsumo', EstufaController.detalhePoduto)
    .post('/colherInsumo', EstufaController.colherProduto)


// Relatório
    .get('/relatorio', MenuController.relatorio) 

// Atividade
    .get('/atividade', MenuController.atividade)
    .get('/criarAtividade', AtividadeController.indexCriar)
    .post('/criarAtividade', AtividadeController.create)

// Perfil
    .get('/perfil', MenuController.perfil)
    .get('/editarPerfil', GerenteController.paginaEditar)
    .post('/editarPerfil', GerenteController.editarPerfil)
    .get('/inabilitarPerfil', GerenteController.inabilitar)

module.exports = routes