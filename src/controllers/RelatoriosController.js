const knex = require('../database')
const e = require('express')
const local = require('local-storage');
const { render } = require('nunjucks');
const { where, update, select } = require('../database');
const { criarInsumo, insumo } = require('./ComprasController');

const nomeDosMesesAbre = [
    'Jan. ',
    'Fev. ',
    'Mar. ',
    'Abr. ',
    'Maio ',
    'Jun. ',
    'Jul. ',
    'Ago. ',
    'Set. ',
    'Out. ',
    'Nov. ',
    'Dez. '
]
var cabecalho = []
var relatorio = []
var titulo = ''
var rota = ''


async function buscarLucroPrejuizo(inicioBusca, fimBusca){
    cabecalho = []
    relatorio = []
    rota = 'Relatorio/apresentacaoRelatorioFinanceiro.html'
    titulo = 'Lucros e Prejuízos'
    cabecalho = ['Nome da Produção', 'Custo da Produção', 'Valor de Venda', 'Saldo Final']

    const itensArmazem = await knex('Armazens')
    .where('Armazens.cod_plantacao', Number(local('plantacao')))
    .join('Producoes', 'Producoes.cod_producao', '=', 'Armazens.cod_producao')
    .whereBetween('Producoes.dt_inicio', [inicioBusca, fimBusca])
    .join('Planos_Producao', 'Planos_Producao.cod_plano', '=', 'Producoes.cod_plano')
    .orderBy('Producoes.dt_inicio')

    for (var i = 0; i < itensArmazem.length; i++) {

        var item = {
            'coluna1': '',
            'coluna2': 0,
            'coluna3': 0,
            'coluna4': 0,
        }

        const itensProducao = await knex('Itens_Producao')
        .where('Itens_Producao.cod_producao', itensArmazem[i].cod_producao)
        .where('Itens_Producao.status_aplicacao', 'REALIZADA')
        .join('Itens_Compra', 'Itens_Compra.cod_itemCompra', '=', 'Itens_Producao.cod_ItemCompra')
        .select()

        

        var valor = 0
        for (var j = 0; j < itensProducao.length; j++) {
            valor = valor + (itensProducao[j].valor_item * itensProducao[j].quantidade_item)
        }

        item.coluna1 = itensArmazem[i].nome_plano
        item.coluna2 = valor

        if (itensArmazem[i].status_hortalica == 'VENDIDO' || itensArmazem[i].status_hortalica == 'RESERVADA') {
            const valorVenda = await knex('Armazens')
            .where('Armazens.cod_posicao', itensArmazem[i].cod_posicao)
            .join('Itens_Venda', 'Itens_Venda.cod_item', '=', 'Armazens.destino_hortalica')
            .select()

            valor = 0
            valor = valor + (valorVenda[0].valor_produto * valorVenda[0].quantidade_produto)
            item.coluna3 = valor
             
        } else if (itensArmazem[i].status_hortalica == 'LIVRE' || itensArmazem[index].status_hortalica == 'DESCARTADO') {
            item.coluna3 = 0
        }

        
        item.coluna4 = item.coluna3 - item.coluna2

        item.coluna2 = 'R$'+ (item.coluna2).toFixed(2)
        item.coluna3 = 'R$'+ (item.coluna3).toFixed(2)
        item.coluna4 = 'R$'+ (item.coluna4).toFixed(2)
        

        relatorio.push(item)
    }
    
}
async function apresentarPassivos(inicioBusca, fimBusca) {
    cabecalho = []
    relatorio = []
    rota = 'Relatorio/apresentacaoRelatorioFinanceiro.html'

    var inicio = new Date(inicioBusca)
    inicio = new Date(inicio.getFullYear()+'-'+1+'-'+1)

    cabecalho = ['Ano de Refêrencia', 'Nome do Passivo', 'Tipo do Passivo', 'Valor do Passivo']
    titulo = 'Passivos'

    const passivo = await knex('Passivos')
    .where('Passivos.cod_plantacao', Number(local('plantacao')))
    .whereBetween('Passivos.data_passivo', [inicio, fimBusca])
    .orderBy('Passivos.data_passivo')

    for (let index = 0; index < passivo.length; index++) {
        var item = {
            'coluna1': '',
            'coluna2': 0,
            'coluna3': 0,
            'coluna4': 0,
        }
        const data = new Date(passivo[index].data_passivo)

        item.coluna1 = data.getFullYear()
        item.coluna2 = (passivo[index].nome_passivo).split("-", 1)
        item.coluna3 = ((passivo[index].tipo_passivo).split(" ", 2))[1]
        item.coluna4 = 'R$'+(passivo[index].valor_passivo).toFixed(2)
        
        relatorio.push(item)
    }
}
async function apresentarAtivos(inicioBusca, fimBusca) {
    cabecalho = []
    relatorio = []
    rota = 'Relatorio/apresentacaoRelatorioFinanceiro.html'

    var inicio = new Date(inicioBusca)
    inicio = new Date(inicio.getFullYear()+'-'+1+'-'+1)

    cabecalho = ['Ano de Referência', 'Nome do Ativo', 'Tipo do Ativo', 'Valor do Ativo']
    titulo = 'Ativos'

    const ativo = await knex('Ativos')
    .where('Ativos.cod_plantacao', Number(local('plantacao')))
    .whereBetween('Ativos.data_ativo', [inicio, fimBusca])
    .orderBy('Ativos.data_ativo')

    for (let index = 0; index < ativo.length; index++) {
        var item = {
            'coluna1': '',
            'coluna2': 0,
            'coluna3': 0,
            'coluna4': 0,
        }
        const data = new Date(ativo[index].data_ativo)

        item.coluna1 = data.getFullYear()
        item.coluna2 = (ativo[index].nome_ativo).split("-", 1)
        item.coluna3 = ((ativo[index].tipo_ativo).split(" ", 2))[1]
        item.coluna4 = 'R$'+(ativo[index].valor_ativo).toFixed(2)
        
        relatorio.push(item)
    }
}
async function apresentarBalanco(inicioBusca, fimBusca) {
    cabecalho = []
    relatorio = []
    rota = 'Relatorio/apresentacaoRelatorioFinanceiro.html'

    var inicio = new Date(inicioBusca)
    var fim = new Date(fimBusca)

    cabecalho = ['Ano de Referência', 'Valor dos Ativos', 'valor dos Passivos', 'Patrimônio Líquido']
    titulo = 'Balanço Patrimonial'

    const balanco = await knex('BalancosPatrimoniais')
    .where('BalancosPatrimoniais.cod_plantacao', Number(local('plantacao')))
    .whereBetween('BalancosPatrimoniais.ano_referencia', [inicio.getFullYear(), fim.getFullYear()])
    .orderBy('BalancosPatrimoniais.ano_referencia')

    for (let index = 0; index < balanco.length; index++) {
        var item = {
            'coluna1': '',
            'coluna2': 0,
            'coluna3': 0,
            'coluna4': 0,
        }

        item.coluna1 = balanco[index].ano_referencia
        item.coluna2 = 'R$'+(balanco[index].valor_ativo).toFixed(2)
        item.coluna3 = 'R$'+(balanco[index].valor_passivo).toFixed(2)
        item.coluna4 = 'R$'+(balanco[index].patrimonio_liquido).toFixed(2)
        
        relatorio.push(item)
    }
}
async function apresentarFluxoCaixa(inicioBusca, fimBusca) {
    cabecalho = []
    relatorio = []
    rota = 'Relatorio/apresentacaoRelatorioFinanceiro.html'

    var inicio = new Date(inicioBusca)
    inicio.setDate(inicio.getDate() + 1)
    var fim = new Date(fimBusca)
    fim.setDate(fim.getDate() + 1)
    
    cabecalho = ['Mês de Referência', 'Capital Inicial', 'Saldo Operacional', 'Saldo a Transportar']
    titulo = 'Fluxo de Caixa'

    const fluxo = await knex('FluxoCaixa')
    .where('FluxoCaixa.cod_plantacao', Number(local('plantacao')))
    .orderBy('FluxoCaixa.mes_referencia')

    for (let index = 0; index < fluxo.length; index++) {
        var item = {
            'coluna1': '',
            'coluna2': 0,
            'coluna3': 0,
            'coluna4': 0,
        }

        const mesReferencia  = (fluxo[index].mes_referencia).split('-',2)
        var mesMaior = 0
        var mesMenor = 1
        if(inicio.getMonth() > fim.getMonth()){
            mesMaior = inicio.getMonth()
            mesMenor = fim.getMonth()
        } else {
            mesMaior = fim.getMonth()
            mesMenor = inicio.getMonth()
        }
        
        
        if(mesReferencia[1] >= inicio.getFullYear() && mesReferencia[1] <= fim.getFullYear()){

            if(inicio.getFullYear() == fim.getFullYear()) {
                if (mesReferencia[0] >= mesMenor && mesReferencia[0] <= mesMaior) {
                    item.coluna1 =  nomeDosMesesAbre[mesReferencia[0]]+' '+mesReferencia[1] 
                    item.coluna2 = 'R$'+(fluxo[index].capital_inicial).toFixed(2)
                    item.coluna3 = 'R$'+(fluxo[index].saldo_operacional).toFixed(2)
                    item.coluna4 = 'R$'+(fluxo[index].saldo_transportar).toFixed(2)
    
                    relatorio.push(item)
                }
            } else if ((inicio.getFullYear() + 1) == fim.getFullYear()) {
                if (mesReferencia[0] <= mesMenor || mesReferencia[0] >= mesMaior) {
                    item.coluna1 =  nomeDosMesesAbre[mesReferencia[0]]+' '+mesReferencia[1] 
                    item.coluna2 = 'R$'+(fluxo[index].capital_inicial).toFixed(2)
                    item.coluna3 = 'R$'+(fluxo[index].saldo_operacional).toFixed(2)
                    item.coluna4 = 'R$'+(fluxo[index].saldo_transportar).toFixed(2)
    
                    relatorio.push(item)
                }
            } else {
                item.coluna1 =  nomeDosMesesAbre[mesReferencia[0]]+' '+mesReferencia[1] 
                item.coluna2 = 'R$'+(fluxo[index].capital_inicial).toFixed(2)
                item.coluna3 = 'R$'+(fluxo[index].saldo_operacional).toFixed(2)
                item.coluna4 = 'R$'+(fluxo[index].saldo_transportar).toFixed(2)

                relatorio.push(item)
            }
            
        }    
    }
}
async function apresentarFrenquenciaFornecedor(inicioBusca, fimBusca) {
    cabecalho = []
    relatorio = []
    rota = 'Relatorio/apresentacaoRelatorioProducao.html'

    var inicio = new Date(inicioBusca)
    var fim = new Date(fimBusca)

    cabecalho = ['Nome do Fornecedor', 'Quantidade']
    titulo = 'Frequência dos Fornecedores'

    const arrayFornecedor = await knex('Fornecedores')
    .where('Fornecedores_Produtos.cod_plantacao', Number(local('plantacao')))
    .join('Fornecedores_Produtos', 'Fornecedores.cod_fornecedor', '=', 'Fornecedores_Produtos.cod_fornecedor')
    .select('Fornecedores.cod_fornecedor')

    var fornecedor = [arrayFornecedor[0].cod_fornecedor]

    for (let index = 1; index < arrayFornecedor.length; index++) {
       if(arrayFornecedor[index].cod_fornecedor != arrayFornecedor[index-1].cod_fornecedor){
           fornecedor.push(arrayFornecedor[index].cod_fornecedor)
       }
    }

    for (let index = 0; index < fornecedor.length; index++) {
        const quantidadeFornecedor = await knex('Itens_Compra')
        .where("cod_plantacao", Number(local('plantacao')))
        .join('Compras', 'Compras.cod_compra', '=', 'Itens_Compra.cod_compra')
        .whereBetween('dt_compra', [inicio, fim])
        .join('Fornecedores', 'Fornecedores.cod_fornecedor', 'Itens_Compra.cod_fornecedor')
        .where('Itens_Compra.cod_fornecedor', Number(fornecedor[index]))
        .select()

        const dadosFornecedor = await knex('Fornecedores')
        .where('cod_fornecedor', fornecedor[index])
        .select()

        var item = {
            'coluna1': dadosFornecedor[0].nome_fornecedor,
            'coluna2': quantidadeFornecedor.length + ' vezes'
        }

        relatorio.push(item)
        
    }    
}
async function apresentarFrenquenciaCliente(inicioBusca, fimBusca) {
    cabecalho = []
    relatorio = []
    rota = 'Relatorio/apresentacaoRelatorioProducao.html'

    var inicio = new Date(inicioBusca)
    var fim = new Date(fimBusca)

    cabecalho = ['Nome do Cliente', 'Quantidade']
    titulo = 'Frequência dos Cliente'

    const cliente = await knex('Clientes')
    .where('Clientes.cod_plantacao', Number(local('plantacao')))
    .select()

    for (let index = 0; index < cliente.length; index++) {
        const quantidadeCliente = await knex('Vendas')
        .where("cod_plantacao", Number(local('plantacao')))
        .where('cod_cliente', cliente[index].cod_cliente)
        .whereBetween('dt_venda', [inicio, fim])
        .join('Itens_Venda', 'Itens_Venda.cod_venda', '=', 'Vendas.cod_venda')
        .select()

        var item = {
            'coluna1': cliente[index].nome_cliente,
            'coluna2': quantidadeCliente.length + ' vezes'
        }

        relatorio.push(item)
        
    }

}
async function apresentarFrenquenciaInsumo(inicioBusca, fimBusca) {
    cabecalho = []
    relatorio = []
    rota = 'Relatorio/apresentacaoRelatorioProducao.html'

    cabecalho = ['Nome do Insumo', 'Quantidade']
    titulo = 'Frequência do Insumo'

    var inicio = new Date(inicioBusca)
    var fim = new Date(fimBusca)

    const arrayProdutos = await knex('Insumos')
    .join('Produtos', 'Produtos.cod_produto', 'Insumos.cod_insumo')
    .where('Produtos.tipo_produto', 'INSUMO')
    .join('Fornecedores_Produtos', 'Produtos.id_produto', '=', 'Fornecedores_Produtos.id_produto')
    .where('Fornecedores_Produtos.cod_plantacao', Number(local('plantacao')))
    .select()

    var produto = [arrayProdutos[0].id_produto]

    for (let index = 1; index < arrayProdutos.length; index++) {
       if(arrayProdutos[index].id_produto != arrayProdutos[index-1].id_produto){
           produto.push(arrayProdutos[index].id_produto)
       }
    }

    for (let index = 0; index < produto.length; index++) {
        const quantidadeProduto = await knex('Itens_Compra')
        .where('cod_item', produto[index])
        .join('Compras', 'Compras.cod_compra', '=', 'Itens_Compra.cod_compra')
        .where('Compras.cod_plantacao', Number(local('plantacao')))
        .whereBetween('Compras.dt_compra', [inicio, fim])
        .select()

        const dadosInsumo = await knex('Produtos')
        .where('id_produto', produto[index])
        .where('tipo_produto', 'INSUMO')
        .join('Insumos', 'Insumos.cod_insumo', '=', 'Produtos.cod_produto')
        .select()
        

        var item = {
            'coluna1': dadosInsumo[0].nome_insumo,
            'coluna2': quantidadeProduto.length + ' vezes',
        }

        relatorio.push(item)
    }
}
async function apresentarFrenquenciaPlanoProducao(inicioBusca, fimBusca) {
    cabecalho = []
    relatorio = []
    rota = 'Relatorio/apresentacaoRelatorioProducao.html'

    var inicio = new Date(inicioBusca)
    var fim = new Date(fimBusca)

    cabecalho = ['Nome do Plano', 'Quantidade']
    titulo = 'Frequência dos Planos'

    const planos = await knex('Planos_Producao')
    .where('Planos_Producao.cod_plantacao', Number(local('plantacao')))
    .select()

    for (let index = 0; index < planos.length; index++) {
        const quantidadeProducao = await knex('Producoes')
        .where("cod_plantacao", Number(local('plantacao')))
        .where('cod_plano', planos[index].cod_plano)
        .whereBetween('dt_inicio', [inicio, fim])
        .select()

        var item = {
            'coluna1': planos[index].nome_plano,
            'coluna2': quantidadeProducao.length + ' vezes'
        }

        relatorio.push(item)
        
    }

}



module.exports = {
    // Apresentar Fornecedor
    async apresentarRelatorio(req,res, next) {
        try {

            const {
                codRelatorio,
                inicioBusca,
                fimBusca,
            } = req.body

            const dataInicio = new Date(inicioBusca)
            const dataFim = new Date(fimBusca)
            dataInicio.setDate(dataInicio.getDate() + 1)
            dataFim.setDate(dataFim.getDate() + 1)

            switch (codRelatorio) {
                case '1':
                    await buscarLucroPrejuizo(inicioBusca, fimBusca)
                    break;
                case '2':
                    await apresentarPassivos(inicioBusca, fimBusca)
                    break;
                case '3':
                    await apresentarAtivos(inicioBusca, fimBusca)
                    break;
                case '4':
                    await apresentarBalanco(inicioBusca, fimBusca)
                    break;
                case '5':
                    await apresentarFluxoCaixa(inicioBusca, fimBusca)
                    break;
                case '6':
                    await apresentarFrenquenciaFornecedor(inicioBusca, fimBusca)
                    break;
                case '7':
                    await apresentarFrenquenciaCliente(inicioBusca, fimBusca)
                    break;
                case '8':
                    await apresentarFrenquenciaInsumo(inicioBusca, fimBusca)
                    break;
                case '9':
                    await apresentarFrenquenciaPlanoProducao(inicioBusca, fimBusca)
                    break;
                default:
                  console.log('Código inabilitados');
              }

              const busca = {
                  'inicio': dataInicio.getDate() + ' ' + nomeDosMesesAbre[dataInicio.getMonth()] + ' ' + dataInicio.getFullYear(),
                  'fim': dataFim.getDate() + ' ' + nomeDosMesesAbre[dataFim.getMonth()] + ' ' + dataFim.getFullYear(),
              }
            
            return  res.render(rota, {titulo, cabecalho, relatorio, busca})
        } catch (error) {
            return next(error)
        }
        
    }    
   
}