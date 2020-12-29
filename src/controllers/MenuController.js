const knex = require('../database');
const e = require('express');
const local = require('local-storage');
const { apresentarCriarFornecedor } = require('./ComprasController');

async function criarFluxoCaixa(mesReferencia) {
    // Pegando o saldo a transportar do mês anterior 
    const fluxoCaixaAnterior = await knex('FluxoCaixa')
    .where({'cod_plantacao': Number(local('plantacao'))})
    .select()

    // Buscando Entradas e Saidas referentes a esse mês
        // Datas de analise

    const data = new Date()
    const dataInicio = new Date(data.getFullYear(), data.getMonth(), 1)
    const dataFim = new Date(data.getFullYear(), data.getMonth()+1, 0)
        // Entradas
    var entradas = await knex('Entradas')
    .whereBetween('validade_entrada', [dataInicio, dataFim])
    .select()

    var totalEntrada = 0;
    for (let index = 0; index < entradas.length; index++) {
        totalEntrada = totalEntrada + entradas[index].valor_entrada;
        
    }
        // Saidas
    var saidas = await knex('Saidas')
    .whereBetween('validade_saida', [dataInicio, dataFim])
    .select()

    var totalSaida = 0;
    for (let index = 0; index < saidas.length; index++) {
        totalSaida = totalSaida + saidas[index].valor_saida;
        
    }

    await knex('FluxoCaixa').insert({
        'mes_referencia': mesReferencia,
        'cod_plantacao': Number(local('plantacao')),
        'capital_inicial': fluxoCaixaAnterior[fluxoCaixaAnterior.length -1].saldo_transportar,
        'saldo_operacional': totalEntrada - totalSaida,
        'saldo_transportar': fluxoCaixaAnterior[fluxoCaixaAnterior.length -1].saldo_transportar + (totalEntrada - totalSaida),
    })
            
    var fluxoCaixa = await knex('FluxoCaixa')
    .where({'cod_plantacao': Number(local('plantacao'))})
    .where({'mes_referencia': mesReferencia})
    .select()

    return fluxoCaixa;
}
async function varreduraFluxoCaixa(mesReferencia) {
    const fluxosCaixa = await knex('FluxoCaixa')
    .where('cod_plantacao', Number(local('plantacao')))
    .where('mes_referencia', mesReferencia)
    .select()

    const data = new Date()
    const dataInicio = new Date(data.getFullYear(), data.getMonth(), 1)
    const dataFim = new Date(data.getFullYear(), data.getMonth()+1, 0)

        // Entradas
    var entradas = await knex('Entradas')
    .whereBetween('validade_entrada', [dataInicio, dataFim])
    .select()

    var totalEntrada = 0;
    for (let index = 0; index < entradas.length; index++) {
        totalEntrada = totalEntrada + entradas[index].valor_entrada;
        
    }
        // Saidas
    var saidas = await knex('Saidas')
    .whereBetween('validade_saida', [dataInicio, dataFim])
    .select()

    var totalSaida = 0;
    for (let index = 0; index < saidas.length; index++) {
        totalSaida = totalSaida + saidas[index].valor_saida;
        
    }

    // varredura dos dados dos fluxos de caixa e correção dos mesmos.
    for (let index = 0; index < fluxosCaixa.length; index++) {
        if(fluxosCaixa[index].capital_inicial != (fluxosCaixa[index].saldo_transportar - (totalEntrada - totalSaida))){
            fluxosCaixa[index].saldo_transportar = fluxosCaixa[index].capital_inicial + (totalEntrada - totalSaida);
        }

        if(index < fluxosCaixa.length -1){
            fluxosCaixa[index + 1].capital_inicial = fluxosCaixa[index].saldo_transportar;
        }
    }

    // // Inserção das atualizações dos dos valores no fluxo de caixa
    for (let index = 0; index < fluxosCaixa.length; index++) {
        await knex('FluxoCaixa')
        .where('cod_fluxoCaixa', fluxosCaixa[index].cod_fluxoCaixa)
        .update({
            capital_inicial: fluxosCaixa[index].capital_inicial,
            saldo_operacional: (totalEntrada - totalSaida),
            saldo_transportar: fluxosCaixa[index].saldo_transportar,
        })
    }
} 
async function apresentacaoEntradas() {
    const codPlantacao = Number(local('plantacao'))
    const dataAtual = new Date();
    const mesAnalise = dataAtual.getMonth();
    const anoAnalise = dataAtual.getFullYear();
    const dataFim = new Date(anoAnalise, (mesAnalise+1), 28)

    const dataInicio = new Date(anoAnalise, mesAnalise, 1);
    dataFim.setDate(0)

    const entradas = await knex('Entradas')
    .where('cod_plantacao', codPlantacao)
    .whereBetween('validade_entrada', [dataInicio, dataFim])
    .select();

    for (let index = 0; index < entradas.length; index++) {
         
        const data = new Date(entradas[index].validade_entrada);

        if(data.getMonth() == dataAtual.getMonth() && data.getFullYear() == dataAtual.getFullYear()){
            entradas[index].validade_entrada = data.getDate() + "/" + (data.getMonth() + 1) + "/" + data.getFullYear();
        } else {
            entradas.splice(index);
        }
                            
    }    

    return entradas
}
async function apresentacaoSaidas() {
    const codPlantacao = Number(local('plantacao'))
    const dataAtual = new Date();
    const mesAnalise = dataAtual.getMonth();
    const anoAnalise = dataAtual.getFullYear();
    const dataFim = new Date(anoAnalise, (mesAnalise+1), 28)

    const dataInicio = new Date(anoAnalise, mesAnalise, 1);
    dataFim.setDate(0)

    const saidas = await knex('Saidas')
    .where('cod_plantacao', codPlantacao)
    .whereBetween('validade_saida', [dataInicio, dataFim])
    .select();

    for (let index = 0; index < saidas.length; index++) {
         
        const data = new Date(saidas[index].validade_saida);

        if(data.getMonth() == dataAtual.getMonth() && data.getFullYear() == dataAtual.getFullYear()){
            saidas[index].validade_saida = data.getDate() + "/" + (data.getMonth() + 1) + "/" + data.getFullYear();
        } else {
            saidas.splice(index);
        }
                            
    }   
    
    return saidas
}
async function criarBalanco(anoReferencia){
    // Busca dos dados do balanco do ano Anterior
    const codPlantacao = Number(local('plantacao'))

    // Para criar um novo balanco é necessario buscar o saldo a transportar do ultimo mês do ano, 
    // para caso seja positivo somar no ATIVO, no caixa da empresa, 
    // e caso seja negativo somar no PASSIVO, no outros depitos.
        // Pegando o último saldo_transportar do FluxoCaixa:
    
    const ultimoFluxoCaixa = await knex('FluxoCaixa')
    .where('cod_plantacao', Number(local('plantacao')))
    .select()

    const saldoTrasportar = ultimoFluxoCaixa[ultimoFluxoCaixa.length -1].saldo_transportar
    var saldoAtivo = 0;
    var saldoPassivo = 0

    // Preparando as variaveis para receber o AtivoCirculante ou PassivoCirculante
    if (saldoTrasportar < 0){
        saldoPassivo = saldoTrasportar;
    } else if(saldoTrasportar >= 0) {
        saldoAtivo = saldoTrasportar;
    }
    

    // Criação do BalancoAtual
    await knex('BalancosPatrimoniais')
    .insert({
        'cod_plantacao': codPlantacao,
        'ano_referencia': anoReferencia,
        'valor_ativo': saldoAtivo,
        'valor_passivo': saldoPassivo,
        'patrimonio_liquido': 0,
        'capital_social': 0,
    })

    var balanco = await knex('BalancosPatrimoniais')
    .where('cod_plantacao', Number(local('plantacao')))
    .where('ano_referencia', anoReferencia)
    .select();

    const codBalancoAtual = balanco[0].cod_balanco;
    const dataAtual = new Date();

    await knex('Ativos')
    .insert({
        'cod_plantacao': Number(local('plantacao')),
        'cod_balanco': codBalancoAtual,
        'tipo_ativo': 'ATIVO CIRCULANTE',
        'nome_ativo': 'CAIXA - ' + anoReferencia,
        'valor_ativo': saldoAtivo,
        'data_ativo': dataAtual,
    })

    await knex('Ativos')
    .insert({
        'cod_plantacao': Number(local('plantacao')),
        'cod_balanco': codBalancoAtual,
        'tipo_ativo': 'ATIVO CIRCULANTE',
        'nome_ativo': 'BANCOS - ' + anoReferencia,
        'valor_ativo': 0,
        'data_ativo': dataAtual,
    })

    await knex('Passivos')
    .insert({
        'cod_plantacao': Number(local('plantacao')),
        'cod_balanco': codBalancoAtual,
        'tipo_passivo': 'PASSIVO CIRCULANTE',
        'nome_passivo': 'OUTROS DEPOSITOS - ' + anoReferencia,
        'valor_passivo': saldoPassivo,
        'data_passivo': dataAtual,
    })

    // Verificando se já possui Passivos e Ativos Permanente referente a esse periodo
        // Buscar a data de intervalo para esse balanço
    const dataInicio = new Date (anoReferencia+'-1'+'-1')
    const dataFim = new Date (anoReferencia+'-12'+'-31')
        // Atualizar os passivos permanentes antes cadastrados
    await knex('Passivos')
    .whereBetween('data_passivo', [dataInicio, dataFim])
    .where('tipo_passivo', 'PASSIVO PERMANENTE')
    .where('cod_plantacao', codPlantacao)
    .update({
        'cod_balanco': codBalancoAtual,    
    })
        // Atualizar os ativos permanentes antes cadastrados
    await knex('Ativos')
    .whereBetween('data_ativo', [dataInicio, dataFim])
    .where('tipo_ativo', 'ATIVO PERMANENTE')
    .where('cod_plantacao', codPlantacao)
    .update({
        'cod_balanco': codBalancoAtual,    
    })

    return balanco


}
async function varreduraBalanco(codPlantacao) {
    // Capturar data atual
    const dataAtual = new Date();

    // Buscar o cod_balanco para ser analisado
    var balanco = await knex('BalancosPatrimoniais')
    .where('cod_plantacao', codPlantacao)
    .where('ano_referencia', dataAtual.getFullYear())
    .select();

    if(balanco.length == 0){
        balanco = await criarBalanco(dataAtual.getFullYear())
    } 

    const codBalanco = balanco[0].cod_balanco;

    const primeiroDia =  new Date(dataAtual.getFullYear() + '-1' + '-1');

    // Atualização dos Ativos Circulates
    const entradas = await knex('Entradas')
    .where('cod_plantacao', codPlantacao)
    .whereBetween('validade_entrada', [primeiroDia, dataAtual])
    .where('destino_valor', null)
    .select()

    var caixaAtivo = await knex('Ativos')
    .where('cod_balanco', codBalanco)
    .where('nome_ativo', ('CAIXA - ' + dataAtual.getFullYear()))
    .select('cod_ativo', 'valor_ativo')

        // Caso não haja Caixa refernce a esse balanco
    if (caixaAtivo.length == 0){
        await knex('Ativos')
        .insert({
            'cod_balanco': codBalanco,
            'cod_plantacao': codPlantacao,
            'tipo_ativo': 'ATIVO CIRCULANTE',
            'nome_ativo': ('CAIXA - ' + dataAtual.getFullYear()),
            'valor_ativo': 0,
            'data_ativo': dataAtual,
        });

        caixaAtivo = await knex('Ativos')
        .where('cod_balanco', codBalanco)
        .where('nome_ativo', ('CAIXA - ' + dataAtual.getFullYear()))
        .select('cod_ativo', 'valor_ativo')
    }

    const codAtivo = caixaAtivo[0].cod_ativo;
    var totalEntrada =0;

        // Cadastrar nas entradas que o valor já não foi contabilizado nos Ativos
    for (let index = 0; index < entradas.length; index++) {
        totalEntrada = totalEntrada + entradas[index].valor_entrada;

        await knex('Entradas')
        .where('cod_entrada', entradas[index].cod_entrada)
        .update({
            'destino_valor': ('CAIXA - ' + dataAtual.getFullYear()),
        })
    }

        // Atualizando o Caixa com os valores de entradas que não foram contabilizados
    await knex('Ativos')
    .where('cod_ativo', codAtivo)
    .update({
        'valor_ativo': caixaAtivo[0].valor_ativo + totalEntrada,
        'data_ativo': dataAtual,
    })

    // Atualização dos Passivos Circulates e Passivos Permanentes
    const saidas = await knex('Saidas')
    .where('cod_plantacao', codPlantacao)
    .whereBetween('validade_saida', [primeiroDia, dataAtual])
    .where('cobranca_saida', 0)
    .select()

    var tipoSaida;
    var aluguel = 0;
    var conta = 0;
    var imposto = 0;
    var outrosDebitos = 0;
    var parcelamentos = 0;

    // Varredura da Saida
    for (let index = 0; index < saidas.length; index++) {
        tipoSaida = saidas[index].destino_saida;

        switch (tipoSaida) {
            case 'ALUGUEL':
                aluguel = aluguel + saidas[index].valor_saida;
                break;
            case 'CONTA':
                conta = conta + saidas[index].valor_saida;
                break;
            case 'IMPOSTO':
                imposto = imposto + saidas[index].valor_saida;
                break;
            case 'OUTROS DEBITOS':
                outrosDebitos = outrosDebitos + saidas[index].valor_saida;
                break;
            case 'PARCELAMENTO':
                parcelamentos = parcelamentos + saidas[index].valor_saida;
                break;
            default:
                break;
        }
        
        // Atualizar o aconbranca da saida
        await knex('Saidas')
        .where('cod_saida', saidas[index].cod_saida)
        .update({
            'cobranca_saida': 1,
        })
    }

    // Atualização dos Alugueis
    if(aluguel > 0){
        var codAlugueis = await knex('Passivos')
        .where('nome_passivo', 'ALUGUEIS - ' + dataAtual.getFullYear())
        .select()

        // Criação do aluguel referente para esse balanco 
        if (codAlugueis.length == 0){
            await knex('Passivos')
            .insert({
                'cod_balanco': codBalanco,
                'cod_plantacao': codPlantacao,
                'tipo_passivo': 'PASSIVO CIRCULANTE',
                'nome_passivo': 'ALUGUEIS - ' + dataAtual.getFullYear(),
                'valor_passivo': aluguel,
                'data_passivo': dataAtual,
            })
        } else if(aluguel.length != 0) {
            await knex('Passivos')
            .where('cod_passivo', codAlugueis[0].cod_passivo)
            .update({
                'valor_passivo': codAlugueis[0].valor_passivo + aluguel,
                'data_passivo': dataAtual,
            })
        }
    }

    // Atualização das Contas
    if(conta > 0){
        var codContas = await knex('Passivos')
        .where('nome_passivo', 'CONTAS - ' + dataAtual.getFullYear())
        .select()

        if (codContas.length == 0){
            await knex('Passivos')
            .insert({
                'cod_balanco': codBalanco,
                'cod_plantacao': codPlantacao,
                'tipo_passivo': 'PASSIVO CIRCULANTE',
                'nome_passivo': 'CONTAS - ' + dataAtual.getFullYear(),
                'valor_passivo': conta,
                'data_passivo': dataAtual,
            })
        } else if(conta.length!=0) {
            await knex('Passivos')
            .where('cod_passivo', codContas[0].cod_passivo)
            .update({
                'valor_passivo': codContas[0].valor_passivo + conta,
                'data_passivo': dataAtual,
            })
        }
    }

    // Atualização dos Impostos
    if(imposto > 0){
        var codImpostos = await knex('Passivos')
        .where('nome_passivo', 'IMPOSTOS - ' + dataAtual.getFullYear())
        .select()

        if (codImpostos.length == 0){
            await knex('Passivos')
            .insert({
                'cod_balanco': codBalanco,
                'cod_plantacao': codPlantacao,
                'tipo_passivo': 'PASSIVO CIRCULANTE',
                'nome_passivo': 'IMPOSTOS - ' + dataAtual.getFullYear(),
                'valor_passivo': imposto,
                'data_passivo': dataAtual,
            })
        } else if(imposto.length!=0) {
            await knex('Passivos')
            .where('cod_passivo', codImpostos[0].cod_passivo)
            .update({
                'valor_passivo': codImpostos[0].valor_passivo + imposto,
                'data_passivo': dataAtual,
            })
        }
    }

    // Atualização dos Outros Debitos
    if(outrosDebitos > 0 ){
        var codOutrosDepositos = await knex('Passivos')
        .where('nome_passivo', 'OUTROS DEPOSITOS - ' + dataAtual.getFullYear())
        .select()

        if (codOutrosDepositos.length == 0){
            await knex('Passivos')
            .insert({
                'cod_balanco': codBalanco,
                'cod_plantacao': codPlantacao,
                'tipo_passivo': 'PASSIVO CIRCULANTE',
                'nome_passivo': 'OUTROS DEPOSITOS - ' + dataAtual.getFullYear(),
                'valor_passivo': outrosDebitos,
                'data_passivo': dataAtual,
            })
        } else if(outrosDebitos.length!=0) {
            await knex('Passivos')
            .where('cod_passivo', codOutrosDepositos[0].cod_passivo)
            .update({
                'valor_passivo': codOutrosDepositos[0].valor_passivo + outrosDebitos,
                'data_passivo': dataAtual,
            })
        }
    }
    
    // Atualização dos Parcelamentos
    if(parcelamentos > 0){
        var codParcelamento = await knex('Passivos')
        .where('tipo_passivo', 'PASSIVO PERMANENTE')
        .where('nome_passivo', 'PARCELAMENTO - ' + dataAtual.getFullYear())
        .select()

        if (codParcelamento.length == 0){
            await knex('Passivos')
            .insert({
                'cod_balanco': codBalanco,
                'cod_plantacao': codPlantacao,
                'tipo_passivo': 'PASSIVO PERMANENTE',
                'nome_passivo': 'PARCELAMENTO - ' + dataAtual.getFullYear(),
                'valor_passivo': parcelamentos,
                'data_passivo': dataAtual,
            })
        } else if(codParcelamento.length!=0) {
            await knex('Passivos')
            .where('cod_passivo', codParcelamento[0].cod_passivo)
            .update({
                'valor_passivo': codParcelamento[0].valor_passivo + parcelamentos,
                'data_passivo': dataAtual,
            })
        }

    }
    
    // --------------------------------------------------------------------

    // Atualização do Patrimonio Líquido
    var totalAtivo = 0;
    var totalPassivo = 0;

        //Varreidura do Ativo
    const ativos = await knex('Ativos')
    .where('cod_balanco', codBalanco)
    .select('valor_ativo')

    for (let index = 0; index < ativos.length; index++) {
        totalAtivo = totalAtivo + Number(ativos[index].valor_ativo)        
    }

     // Varredura do Passivo
    const passivos = await knex('Passivos')
    .where('cod_balanco', codBalanco)
    .select('valor_passivo')

    
    for (let index = 0; index < passivos.length; index++) {
        totalPassivo = totalPassivo + Number(passivos[index].valor_passivo)        
    }

    await knex('BalancosPatrimoniais')
    .where('cod_balanco', codBalanco)
    .update({
        'valor_ativo': totalAtivo,
        'valor_passivo': totalPassivo,
        'patrimonio_liquido': totalAtivo - totalPassivo,
    })

    return codBalanco;
}

const nomeDosMeses = [
    'JANEIRO',
    'FEVEREIRO',
    'MARÇO',
    'ABRIL',
    'MAIO',
    'JUNHO',
    'JULHO',
    'AGOSTO',
    'SETEMBRO',
    'OUTUBRO',
    'NOVEMBRO',
    'DEZEMBRO'
]

module.exports = {
    
    async home(req, res, next) {
        try {
            return res.render('home.html')
        } catch (error) {
            next(error)
        }
    },
    async balanco(req, res, next) {
        try {
            const codPlantacao = Number(local('plantacao'))
            const codBalanco = await varreduraBalanco(codPlantacao);
          
            // Capturação dos dados do balanco
                // Ativo 
            const ativos = await knex('Ativos')
            .where('cod_balanco', codBalanco)
            .select('valor_ativo', 'tipo_ativo')
           

            var ativoCirculante = 0;
            var ativoPermanente = 0;

            for (let index = 0; index < ativos.length; index++) {
                if (ativos[index].tipo_ativo == 'ATIVO CIRCULANTE'){
                    ativoCirculante = ativoCirculante + ativos[index].valor_ativo;
                } else if(ativos[index].tipo_ativo == 'ATIVO PERMANENTE') {
                    ativoPermanente = ativoPermanente + ativos[index].valor_ativo;
                }
            }

                // Passivo 
            const passivos = await knex('Passivos')
            .where('cod_balanco', codBalanco)
            .select('valor_passivo', 'tipo_passivo')
            
            var passivoCirculante = 0;
            var passivoPermanente = 0;

            for (let index = 0; index < passivos.length; index++) {
                if(passivos[index].tipo_passivo == 'PASSIVO CIRCULANTE'){
                    passivoCirculante = passivoCirculante + passivos[index].valor_passivo
                } else if(passivos[index].tipo_passivo == 'PASSIVO PERMANENTE') {
                    passivoPermanente = passivoPermanente + passivos[index].valor_passivo
                }
                    
            }

                // Lucros Acumulados e Prejuizo Acumulado e Capital Social
            const balanco =  await knex('BalancosPatrimoniais')
            .where('cod_balanco', codBalanco)
            .select('patrimonio_liquido', 'capital_social')
            
            const patrimonioLiquido = balanco[0].patrimonio_liquido;
            const capitalSocial = balanco[0].capital_social;
            const totalAtivo = ativoCirculante + ativoPermanente;
            const totalPassivo = passivoCirculante + passivoPermanente;
                

            return res.render('Balanco/balanco.html', { ativoCirculante, ativoPermanente, totalAtivo, passivoCirculante, passivoPermanente, totalPassivo, patrimonioLiquido, capitalSocial})
        } catch(error) {
            next(error)
        }
    },
    async fluxoCaixa(req,res, next) {
        try {
            const entradas = await apresentacaoEntradas();
            var totalEntrada = 0
            for (let index = 0; index < entradas.length; index++) {
                totalEntrada = entradas[index].valor_entrada + totalEntrada;
            }

            const saidas = await apresentacaoSaidas()
            var totalSaida = 0
            for (let index = 0; index < saidas.length; index++) {
                totalSaida = saidas[index].valor_saida + totalSaida;
                
            }

            // Preparando o parâmetro mesAtual
            var dataAtual = new Date();
            const mesAtual = nomeDosMeses[dataAtual.getMonth()]

            // Preparando FluxoCaixa
            const  mesReferencia = dataAtual.getMonth() + '-' + dataAtual.getFullYear(); 
            const codPlantacao = Number(local('plantacao'))
            
            await varreduraFluxoCaixa(mesReferencia)

            var fluxoCaixa = await knex('FluxoCaixa')
            .where({'cod_plantacao': codPlantacao})
            .where({'mes_referencia': mesReferencia})
            .select()

            if(fluxoCaixa.length == 0){
                fluxoCaixa = await criarFluxoCaixa(mesReferencia)
            } 

            const capitalInicial = fluxoCaixa[0].capital_inicial;
            const saldoOperacional = fluxoCaixa[0].saldo_operacional;
            const saldoTrasportar = fluxoCaixa[0].saldo_transportar;
                
            return  res.render('FluxoCaixa/fluxoCaixa.html', {entradas, saidas, totalEntrada, totalSaida, mesAtual, capitalInicial, saldoOperacional, saldoTrasportar})
        } catch (error) {
            next(error)
        }
        
    },   
    async fornecedor(req, res, next){
        try {
            const fornecedoresProduto = await knex('Fornecedores_Produtos')
            .where('cod_plantacao', Number(local('plantacao')))
            .select()

            var codsFornecedor = [];
            var igual = false;
            for (var i = 0; i < fornecedoresProduto.length; i++) {

                codsFornecedor.push(fornecedoresProduto[i].cod_fornecedor)
                         
            }

            const fornecedores = await knex('Fornecedores')
            .whereIn('cod_fornecedor', codsFornecedor)
            .select()

            console.log(fornecedores)

                       
            return res.render('Fornecedor/fornecedor.html', {fornecedores})
        } catch (error) {
            next(error)
        }
    },
    async celeiro(req,res, next) {
        try {
            const codPlantacao = Number(local('plantacao'))
            const listaInsumo = await knex('Celeiros')
            .where({'cod_Plantacao': codPlantacao})
            .whereNot({'Celeiros.quant_Insumo': 0})
            .join('Insumos', 'Insumos.cod_Insumo', 'Celeiros.cod_Insumo')
            .join('Fornecedores', 'Fornecedores.cod_Fornecedor', 'Celeiros.cod_Fornecedor')
            .select('Celeiros.cod_Insumo', 'Insumos.nome_Insumo', 'Insumos.contagem_Insumo', 'Celeiros.quant_Insumo', 'Fornecedores.nome_Fornecedor')
            
            return  res.render('celeiro.html', {listaInsumo})
        } catch (error) {
            next(error)
        }
        
    },
    async armazem(req,res, next) {
        try {
             // Preparar a lista de itens no armazém
             const codPlantacao = Number(local('plantacao'))
             const listaHortalica = await knex('Armazens')
             .where({'cod_Plantacao': codPlantacao})
             .whereNot({'Armazens.quant_Restante_Hortalica': 0})
             .join('Hortalicas', 'Hortalicas.cod_Hortalica', '=', 'Armazens.cod_Hortalica')
             .select('Armazens.cod_Posicao_Armazem',
                     'Hortalicas.nome_Hortalica', 
                     'Armazens.quant_Restante_Hortalica', 
                     'Hortalicas.contagem_Hortalica', 
                     'Armazens.valor_Hortalica')
             
            return  res.render('armazem.html', {listaHortalica})
        } catch (error) {
            next(error)
        }
        
    },
    async financiamento(req, res, next) {
        try {
            const plantacao = await knex('Plantacoes')
            .where('cod_plantacao', Number(local('plantacao')))
            .select('dt_criacao_plantacao');

            const dataInicio = plantacao[0].dt_criacao_plantacao;
            const dataAtual = new Date();

            const financiamentos = await knex('Financiamentos')
            .where('cod_plantacao', Number(local('plantacao')))
            .whereNotBetween('dt_finalizado', [dataInicio, dataAtual])
            .select()

            for (let index = 0; index < financiamentos.length; index++) {
                var dataTabela = new Date(financiamentos[index].dt_financiamento);
               
                financiamentos[index].dt_financiamento = dataTabela.getDate()+ ' / ' + (dataTabela.getMonth()+1)+ ' / ' + (dataTabela.getFullYear())
            }

            return res.render('Financiamento/financiamento.html', {financiamentos})
        } catch (error) {
            next(error)
        }   
    },
    async compra(req,res, next) {
        try {
            // Trazendo dados da tabela
            const codPlantacao = Number(local('plantacao'))
            const listaPedido = await knex('Pedidos_Compra')
            .where({'cod_Plantacao': codPlantacao})
            .where({'status_Pedido': 'esperando'})
            .join('Fornecedores', 'Fornecedores.cod_Fornecedor', 'Pedidos_Compra.cod_Fornecedor')
            .select('Pedidos_Compra.cod_Pedido_Compra', 'Pedidos_Compra.dt_Pedido_Compra', 'Fornecedores.nome_Fornecedor')
        
            for (let index = 0; index < listaPedido.length; index++) {
                const dt = String(listaPedido[index].dt_Pedido_Compra)
                const mes = dt.slice(4, 7)
                const dia = dt.slice(8,10)
                const ano = dt.slice(11, 15)

                const data = dia + ' de ' + mes + '. ' + ano

                listaPedido[index].dt_Pedido_Compra = data;                
            }       

            // Reiderizando da página para receber os dados
            return  res.render('compra.html', {listaPedido})

        } catch (error) {
            next(error)
        }   
    },
    async venda(req,res, next) {
        try {
            // Preparar a lista de itens no armazém
            const codPlantacao = Number(local('plantacao'))
            const listaHortalica = await knex('Armazens')
            .where({'cod_Plantacao': codPlantacao})
            .whereNot({'Armazens.valor_Hortalica': 0})
            .whereNot({'Armazens.quant_Restante_Hortalica': 0})
            .join('Hortalicas', 'Hortalicas.cod_Hortalica', '=', 'Armazens.cod_Hortalica')
            .select('Armazens.cod_Posicao_Armazem', 
                    'Hortalicas.nome_Hortalica', 
                    'Armazens.quant_Restante_Hortalica', 
                    'Hortalicas.contagem_Hortalica', 
                    'Armazens.valor_Hortalica')
            
            return  res.render('venda.html', {listaHortalica})
        } catch (error) {
            next(error)
        }
        
    },
    async colaborador(req,res, next) {
        try {
            // Preparar a lista de itens no armazém
            const codPlantacao = Number(local('plantacao'))

            const listaColaborador = await knex('Logins')
            .where({'cod_Plantacao': codPlantacao})
            .whereNot({'tipo_Usuario': 'Gerente'})
            .join('Usuarios', 'Usuarios.email_Usuario', '=', 'Logins.email_Usuario')
            .select('Usuarios.nome_Usuario',
                    'Usuarios.email_Usuario',
                    'Usuarios.tipo_Usuario')
            
            return  res.render('colaborador.html', {listaColaborador})
        } catch (error) {
            return next(error)
        }
        
    },
    async estufa(req,res, next) {
        try {
            // Preparar parâmetro produto
            const codPlantacao = Number(local('plantacao'))

            // Preparando parâmetro produção
            const producao = await knex('Plantio')
            .where({'cod_Plantacao': codPlantacao})
            .where({'status_Plantio':'plantado'})
            .where({'tipo_Plantio': 'plantar'})
            .join('Hortalicas', 'Hortalicas.cod_Insumo', 'Plantio.cod_Insumo')
            .select('Hortalicas.nome_Hortalica', 'Plantio.quant_Plantada', 'Plantio.dt_Plantio', 'Plantio.cod_Plantacao_Hortalica')

            for (let i = 0; i < producao.length; i++) {
                const now = new Date(); // Data de hoje
                const past = new Date(producao[i].dt_Plantio); // data do Plantio
                const diff = Math.abs(now.getTime() - past.getTime()); // Subtrai uma data pela outra
                const days = Math.ceil(diff / (1000 * 60 * 60 * 24)); 

                producao[i].dt_Plantio = days
            }

            return  res.render('estufa.html', {producao})
        } catch (error) {
            next(error)
        }
        
    },
    async relatorio(req,res, next) {
        try {
            return  res.render('relatorio.html')
        } catch (error) {
           next(error)
        }
        
    },
    async atividade(req,res, next) {
        try {
            return  res.render('atividades.html')
        } catch (error) {
            next(error)
        }
    },
    async perfil(req, res, next) {
        try {
            // Resgata o email no local storage do usuário
            const email = local('email');
            // Buscar 
            const dadosPerfil = await knex.from('Usuarios')
            .where({'Usuarios.email_Usuario': email})
            .join('Logins', 'Logins.email_Usuario', '=', 'Usuarios.email_Usuario')
            .select('Usuarios.*', 'Logins.dt_Admisso_Usuario')

            var dt = String(dadosPerfil[0].dt_Admisso_Usuario)
            var mes = dt.slice(4, 7)
            var dia = dt.slice(8,10)
            var ano = dt.slice(11, 15)

            var data = dia + ' de ' + mes + '. ' + ano

            dadosPerfil[0].dt_Admisso_Usuario = data;


            var dt = String(dadosPerfil[0].dt_Nasc_Usuario)
            var mes = dt.slice(4, 7)
            var dia = dt.slice(8,10)
            var ano = dt.slice(11, 15)

            var data = dia + ' de ' + mes + '. ' + ano

            dadosPerfil[0].dt_Nasc_Usuario = data;
            
            const usuario = dadosPerfil[0]

            return res.render('perfil.html', { usuario });

        } catch (error) {
            next(error);
        }
        
    },
}
