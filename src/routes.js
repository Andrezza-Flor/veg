const express = require('express')

const routes  = express.Router()

const GerenteController = require('./controllers/GerenteController')
const LoginController = require('./controllers/LoginController')
const MenuController = require('./controllers/MenuController')
const FinanciamentoController = require('./controllers/FinanciamentoController')
const FluxoCaixa = require('./controllers/FluxoCaixaController')
const Balanco = require('./controllers/BalancoController')
const Fornecedor = require('./controllers/FornecedorController')

const ColaboradorController = require('./controllers/ColaboradorController')
const AtividadeController = require('./controllers/AtividadeController')
const CompraController = require('./controllers/ComprasController')
const PlantacaoController = require('./controllers/PlantacaoController')
const CeleiroController = require('./controllers/CeleiroController')
const ArmazemController = require('./controllers/ArmazemController')
const VendaController = require('./controllers/VendaController')

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
    
    // Hortaliça
    .post('/criarHortalica', CompraController.criarHortalica)

// Compra
    .get('/compra', MenuController.compra)






// Celeiro
.get('/celeiro', MenuController.celeiro)

// Armazem
    .get('/armazem', MenuController.armazem)
    .post('/detalheHortalica', ArmazemController.detalheHortalica)
    .get('/editarHortalica', ArmazemController.paginaEdicao)
    .post('/editarHortalica', ArmazemController.editarHortalica)

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

// Plantação
    .get('/plantacao', MenuController.plantacao)
    .get('/planoProducao', PlantacaoController.planoProducao)
    .get('/criarPlanoProducao', PlantacaoController.criarPlanoProducao)
    .post('/criarPlano', PlantacaoController.adicionarDadosPlano)
    .post('/adicionarItens', PlantacaoController.adicionarItem)
    .post('/adicionarAplicacao', PlantacaoController.adicionarAplicacao)
    .get('/resultadoPlano', PlantacaoController.resultadoPlano)
    .get('/cadastrarPlano', PlantacaoController.salvarDados)
    
    // Cadastrar Insumo
    .get('/criarItem', PlantacaoController.criarInsumo)
    .post('/criarItem', PlantacaoController.salvarInsumo)
    .post('/criarItemHortalica', PlantacaoController.salvarHortalica)
    

// Colaborador
    .get('/colaborador', MenuController.colaborador)
    .get('/cadastroColaborador', ColaboradorController.index)
    .post('/criarColaborador', ColaboradorController.create)
    .post('/detalheColaborador', ColaboradorController.paginaDetalhe)
    .get('/editarColaborador', ColaboradorController.paginaEditar)
    .get('/inabilitarColaborador', ColaboradorController.inabilitar)
    .post('/editarColaborador', ColaboradorController.editar)
    
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