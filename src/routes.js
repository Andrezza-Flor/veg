const express = require('express')

const routes  = express.Router()

const GerenteController = require('./controllers/GerenteController')
const LoginController = require('./controllers/LoginController')
const MenuController = require('./controllers/MenuController')
const FinanciamentoController = require('./controllers/FinanciamentoController')
const FluxoCaixa = require('./controllers/FluxoCaixaController')
const Balanco = require('./controllers/BalancoController')
const Fornecedor = require('./controllers/FornecedorController')
const Cliente = require('./controllers/ClienteController')
const Compra = require('./controllers/ComprasController')
const Celeiro= require('./controllers/CeleiroController')
const Plano = require('./controllers/PlanoController')
const Producao = require('./controllers/Producao')
const Armazem = require('./controllers/ArmazemController')
const ColaboradorController = require('./controllers/ColaboradorController')
const VendaController = require('./controllers/VendaController')
const Relatorio = require('./controllers/RelatoriosController')
const Ajuda = require('./controllers/AjudaController')

const AtividadeController = require('./controllers/AtividadeController')

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

// Balanço
    .get('/balanco', MenuController.balanco)
    .get('/ativoCirculante', Balanco.ativoCirculante)
    .get('/ativoPermanente', Balanco.ativoPermanente)
    .get('/passivoCirculante', Balanco.passivoCirculante)
    .get('/passivoPermanente', Balanco.passivoPermanente)
    // Ativos Circulantes
    .get('/criarConta', Balanco.criarConta)
    .post('/salvarConta', Balanco.salvarConta)
    .get('/excluirConta', Balanco.escolherConta)
    .post('/excluirConta', Balanco.excluirConta)
    .get('/depositar', Balanco.escolherContaDeposido)
    .post('/depositar', Balanco.deposito)
    .get('/sacar', Balanco.escolherContaSaque)
    .post('/sacarValor', Balanco.escolherValorSaque)
    .post('/sacar', Balanco.saque)
    .get('/transferir', Balanco.escolherContaTransferencia)
    .post('/transferirValor', Balanco.escolherValorTransferencia)
    .post('/transferir', Balanco.transferencia)  

// Fluxo de Caixa
    .get('/fluxoCaixa', MenuController.fluxoCaixa)
    // Entradas
    .get('/entrada', FluxoCaixa.entrada)
    .post('/entrada', FluxoCaixa.buscaEntrada)
    .get('/cadastrarEntrada', FluxoCaixa.criarEntrada)
    .post('/cadastrarEntrada', FluxoCaixa.salvarEntrada)
    .post('/acessarEntrada', FluxoCaixa.acessarEntrada)
    // Saidas
    .get('/saida', FluxoCaixa.saida)
    .post('/saida', FluxoCaixa.buscarSaida)
    .get('/cadastrarSaida', FluxoCaixa.criarSaida)
    .post('/cadastrarSaida', FluxoCaixa.salvarSaida)
    .post('/acessarSaida', FluxoCaixa.acessarSaida)
    

// Financiamento
    .get('/financiamento', MenuController.financiamento)
    .get('/criarFinanciamento', FinanciamentoController.criarFinanciamento)
    .post('/calcularFinanciamento', FinanciamentoController.calcularFinancimento)
    .post('/criarConta', FinanciamentoController.cadastrarConta)
    .get('/salvarFinanciamento', FinanciamentoController.finalizarFinanciamento)
    
// Fornecedor
    .get('/fornecedor', MenuController.fornecedor)
    .post('/fornecedor', Fornecedor.apresentarFornecedor)
    .get('/criarFornecedor', Fornecedor.criarFornecedor)
    .post('/criarFornecedor', Fornecedor.salvarFornecedor)
    .post('/adicionarInsumo', Fornecedor.selecionarInsumo)
    .get('/adicionarFerramenta', Fornecedor.apresentarFerramenta)
    .post('/adicionarFerramenta', Fornecedor.selecionarFerramenta)
    .get('/salvarDados', Fornecedor.salvarDados)
    .get('/cadastrarFornecedor', Fornecedor.cadastrarFornecedorProduto)
    .get('/inabilitarFornecedor', Fornecedor.inabilitarFornecedor)

    // Insumo
    .get('/criarInsumo', Fornecedor.criarInsumo)
    .post('/criarInsumo', Fornecedor.salvarInsumo)
    .post('/criarHortalica', Fornecedor.salvarHortalica)
    // Ferramenta
    .get('/criarFerramenta', Fornecedor.criarFerramenta)
    .post('/criarFerramenta', Fornecedor.salvarFerramenta)
    
// Compra
    .get('/compra', MenuController.compra)
    .get('/criarCompra', Compra.compra)
    .post('/apresentarFornecedores', Compra.selecionarFornecedor)
    .get('/apresentarFornecedor', Compra.apresentarFornecedor)
    .post('/selecionarFornecedor', Compra.salvarFornecedor)
    .get('/excluirItemCompra/:id', Compra.excluirItemCompra)
    .post('/apresentarCompra', Compra.apresentaCompra)
    .post('/salvarCompra', Compra.cadastrarPagamento)
    .get('/finalizarCompra', Compra.salvarCompra)
    .get('/apresentarCompra/:id', Compra.mostrarCompra)

// Celeiro
    .get('/celeiro', MenuController.celeiro)
    .get('/registroEntrada/:id', Celeiro.entrarItem)
    .post('/entradaCeleiro', Celeiro.cadastrarItem)
    .get('/acessoItemCeleiro/:id', Celeiro.acessarItem)
    .get('/inabilitarItemCeleiro', Celeiro.quantidadeInabilitar)
    .post('/inabilitarItemCeleiro', Celeiro.inabilitar)
    .get('/venderItemCeleiro', Celeiro.quantidadeVender)
    .post('/venderItemCeleiro', Celeiro.vender)



    // Venda
    .get('/venda', MenuController.venda)
    .get('/criarVenda', VendaController.vender)
    .post('/escolherCliente', VendaController.escolherCliente)
    .post('/escolherHortalica', VendaController.escolherHortalica)
    .get('/escolherHOrtalica', VendaController.voltarEscolherHortalica)
    .get('/excluirItem/:id', VendaController.excluirItem)
    .post('/apresentarVenda', VendaController.apresentarVenda)
    .post('/salvarVenda', VendaController.cadastarVenda)
    .get('/apresentarVenda/:id', VendaController.infoVenda)
    .get('/finalizarVenda/:id', VendaController.apresentarTelaFinalizar)
    .post('/finalizarVenda', VendaController.finalizarVenda)
   
    //Cliente
    .get('/cliente', MenuController.cliente)
    .post('/cliente', Cliente.apresentarCliente)
    .get('/criarCliente', Cliente.criarCliente)
    .post('/salvarCliente', Cliente.salvarCliente)

    // Plantação
    .get('/plantacao', MenuController.plantacao)
    .get('/criarProducao', Producao.criarProducao)
    .post('/apresentarProducao', Producao.apresentarProducao)
    .get('/cadastrarProducao', Producao.cadastrarProducao)
    .get('/acessarProducao/:id', Producao.informarProducar)
    .get('/aplicarInsumo/:id', Producao.aplicarInsumo)
    .get('/colherHortalica/:id', Producao.colherHortalica)

        // Plano Producao
    .get('/planoProducao', Plano.planoProducao)
    .get('/criarPlanoProducao', Plano.criarPlanoProducao)
    .post('/criarPlano', Plano.adicionarDadosPlano)
    .post('/adicionarItens', Plano.adicionarItem)
    .post('/adicionarAplicacao', Plano.adicionarAplicacao)
    .get('/resultadoPlano', Plano.resultadoPlano)
    .get('/cadastrarPlano', Plano.salvarDados)

        // Cadastrar Insumo
    .get('/criarItem', Plano.criarInsumo)
    .post('/criarItem', Plano.salvarInsumo)
    .post('/criarItemHortalica', Plano.salvarHortalica)


// Armazem
    .get('/armazem', MenuController.armazem)
    .post('/entradaArmazem/:id', Armazem.cadastrarEntrada)
    .get('/acessoItemArmazem/:id', Armazem.acessarHortalica)
    .get('/editarDadosArmazem', Armazem.apresentarDadosParaEdicao)
    .post('/salvarDadosProduto', Armazem.salvarDados)

// Colaborador
    .get('/colaborador', MenuController.colaborador)
    .get('/cadastrarColaborador', ColaboradorController.criarColaborador)
    .post('/criarColaborador', ColaboradorController.cadastrarColaborador)
    .post('/colaborador', ColaboradorController.paginaDetalhe)
    .get('/inabilitarColaborador', ColaboradorController.inabilitar)
    .get('/editarColaborador', ColaboradorController.editar)
    
    // .post('/criarColaborador', ColaboradorController.apresentarColaborador)
    // .post('/detalheColaborador', ColaboradorController.paginaDetalhe)
    // .get('/editarColaborador', ColaboradorController.paginaEditar)
    // .get('/inabilitarColaborador', ColaboradorController.inabilitar)
    // .post('/editarColaborador', ColaboradorController.editar)

// Perfil
    .get('/perfil', MenuController.perfil)
    .get('/editarPerfil', GerenteController.paginaEditar)
    .post('/editarPerfil', GerenteController.editarPerfil)
    .get('/inabilitarPerfil', GerenteController.inabilitar)

// Relatório
    .get('/relatorio', MenuController.relatorio)
    .post('/relatorio', Relatorio.apresentarRelatorio)

// Ajuda
    .get('/ajuda', MenuController.ajuda)
    .post('/ajuda', Ajuda.apresentarAjuda)

// ------------------------------------------------------------------------

// Atividade
    .get('/atividade', MenuController.atividade)
    .get('/criarAtividade', AtividadeController.indexCriar)
    .post('/criarAtividade', AtividadeController.create)


module.exports = routes