const knex = require('../database')
const e = require('express');
const local = require('local-storage');
const { render } = require('nunjucks');
const { insert } = require('../database');

async function varreduraFluxoCaixa(codPlantacao) {
    
    const fluxosCaixa = await knex('FluxoCaixa')
    .where('cod_plantacao', codPlantacao)
    .select()

    // varredura dos dados dos fluxos de caixa e correção dos mesmos.
    for (let index = 0; index < fluxosCaixa.length; index++) {
        if(fluxosCaixa[index].capital_inicial != (fluxosCaixa[index].saldo_transportar - fluxosCaixa[index].saldo_operacional)){
            fluxosCaixa[index].saldo_transportar = fluxosCaixa[index].capital_inicial + fluxosCaixa[index].saldo_operacional;
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
            saldo_operacional: fluxosCaixa[index].saldo_operacional,
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
    .where('status_entrada', 1)
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
    .where('status_saida', 1)
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
async function buscaEntrada(){
    const codEntrada = Number(local('codEntrada'))

    const entradas = await knex('Entradas')
    .where({'cod_entrada': codEntrada})
    .select();

    const entrada = entradas[0];

    const data = new Date(entrada.validade_entrada);

    entrada.validade_entrada = data.getFullYear()

    if((data.getMonth()+1) < 10){
        entrada.validade_entrada = entrada.validade_entrada + '-0' + (data.getMonth() + 1);
    } else {
        entrada.validade_entrada = entrada.validade_entrada + '-' + (data.getMonth() + 1);
    }

    if(data.getDate() < 10 ){
        entrada.validade_entrada = entrada.validade_entrada + '-0' + data.getDate();
    } else {
        entrada.validade_entrada = entrada.validade_entrada + '-' + data.getDate();
    }

    return entrada
}
async function buscarSaida(){
    const codSaida = Number(local('codSaida'))

    const saidas = await knex('Saidas')
    .where({'cod_saida': codSaida})
    .select();

    const saida = saidas[0];

    const data = new Date(saida.validade_saida);

    saida.validade_saida = data.getFullYear()

    if((data.getMonth()+1) < 10){
        saida.validade_saida = saida.validade_saida + '-0' + (data.getMonth() + 1);
    } else {
        saida.validade_saida = saida.validade_saida + '-' + (data.getMonth() + 1);
    }

    if(data.getDate() < 10 ){
        saida.validade_saida = saida.validade_saida + '-0' + data.getDate();
    } else {
        saida.validade_saida = saida.validade_saida + '-' + data.getDate();
    }

    return saida
}
async function criarBalanco(anoReferencia){
    const codPlantacao = Number(local('plantacao'))

    await knex('BalancosPatrimoniais')
    .insert({
        'cod_plantacao': codPlantacao,
        'ano_referencia': anoReferencia,
        'valor_ativo': 0,
        'valor_passivo': 0,
        'patrimonio_liquido': 0,
        'capital_social': 0,
    })

    const codBalanco = await knex('BalancosPatrimoniais')
    .where('cod_plantacao', codPlantacao)
    .where('ano_referencia', anoReferencia)
    .select('cod_balanco');

    console.log("Balaço adicionado com sucesso", codBalanco[0].cod_balanco);

    return codBalanco;
}
async function adicionarAtivo(codEntrada){
    // Buscando os dados da Entrada
    const entradas = await knex('Entradas')
    .where('cod_entrada', codEntrada)
    .select()

    const dataEntrada = new Date(entradas[0].validade_entrada);
    
    // Buscando os cod_balanco
    var codBalanco = await knex('BalancosPatrimoniais')
    .where('ano_referencia', dataEntrada.getFullYear())
    .select('cod_balanco') 

    if ( codBalanco.length == [] ){
        codBalanco = await criarBalanco(dataEntrada.getFullYear());
    }

    await knex('Ativos')
    .insert({
        'cod_balanco': codBalanco[0].cod_balanco,
        'tipo_ativo': 'ATIVO CIRCULANTE',
        'nome_ativo': entradas[0].nome_entrada,
        'valor_ativo': entradas[0].valor_entrada,
        'data_ativo': entradas[0].validade_entrada,
        'status_ativo': 0,
    })

    console.log('Ativo adicionado com sucesso')
}
async function adicionarPassivo(codSaida){
    // Buscando os dados da Saidas
    const saidas = await knex('Saidas')
    .where('cod_saida', codSaida)
    .select()


    const dataSaida = new Date(saidas[0].validade_saida);
    
    // Buscando os cod_balanco
    var codBalanco = await knex('BalancosPatrimoniais')
    .where('ano_referencia', dataSaida.getFullYear())
    .select('cod_balanco') 

    if ( codBalanco.length == [] ){
        codBalanco = await criarBalanco(dataEntrada.getFullYear());
    }

    await knex('Passivos')
    .insert({
        'cod_balanco': codBalanco[0].cod_balanco,
        'tipo_passivo': 'PASSIVO CIRCULANTE',
        'nome_passivo': saidas[0].nome_saida,
        'valor_passivo': saidas[0].valor_saida,
        'data_passivo': saidas[0].validade_saida,
        'status_passivo': 0,
    })

    console.log('Passivo adicionado com sucesso')
}

module.exports = {
    async entrada(req,res, next) {
        try {
            const entradas = await apresentacaoEntradas();

            return res.render('FluxoCaixa/entrada.html', {entradas})
        } catch (error) {
            next(error)
        }
        
    },
    async buscaEntrada(req,res, next) {
        try {
            const codPlantacao = Number(local('plantacao'))
            const {
                inicioBusca,
                fimBusca
            } = req.body;


            
            const entradas = await knex('Entradas')
            .where({'cod_plantacao': codPlantacao})
            .where({'status_entrada': 1})
            .whereBetween('validade_entrada', [inicioBusca, fimBusca])
            .select();

            for (let index = 0; index < entradas.length; index++) {
                
                const data = new Date(entradas[index].validade_entrada);
                entradas[index].validade_entrada = data.getDate() + "/" + (data.getMonth() + 1) + "/" + data.getFullYear();
                                
            }
            
            return  res.render('FluxoCaixa/entrada.html', {entradas})
        } catch (error) {
            next(error)
        }
        
    },
    async criarEntrada(req,res, next) {
        try {
            return  res.render('FluxoCaixa/criarEntrada.html')
        } catch (error) {
            next(error)
        }
        
    },
    // Função de salvar dados no banco de dados
    async salvarEntrada(req,res, next) {
        try {
            const {
                nomeEntrada,
                valorEntrada,
                dtPagamento,
                caracteristicaPagamento,
            } = req.body

            const codPlantacao = Number(local('plantacao'))
            var parcelaFixa = Number(valorEntrada)
            var dataPagamento = new Date(dtPagamento);
            dataPagamento.setDate(dataPagamento.getDate() + 1)
            const dia = dataPagamento.getDate();
            var mes = dataPagamento.getMonth();
            var ano = dataPagamento.getFullYear();  
                        
            //Cadastro da Entrada pelos números de parcelas
            var dtEntrada = new Date(ano, mes, dia)

            if (dia != dtEntrada.getDate()){
                dtEntrada.setDate(0);
            }
                
            if(caracteristicaPagamento == 0){                      
                switch (dtEntrada.getDay()) {
                    case 0:
                        dtEntrada.setDate(dtEntrada.getDate() + 1);
                        break;
                        
                    case 6:
                        dtEntrada.setDate(dtEntrada.getDate() + 2);
                        break;

                    default:
                        break;
                }
            } 
            
            await knex('Entradas').insert({
               'cod_entrada': null,
               'cod_plantacao': codPlantacao,
               'validade_entrada': dtEntrada,
                'nome_entrada': nomeEntrada.toUpperCase(),
               'valor_entrada': parcelaFixa,
               'status_entrada': 1,
            })

            const codEntradas = await knex('Entradas')
            .where('cod_plantacao', codPlantacao)
            .select('cod_entrada')

            const codEntrada = codEntradas[codEntradas.length - 1].cod_entrada

            await adicionarAtivo(codEntrada)

            var mesReferencia = dtEntrada.getMonth() + '-' + dtEntrada.getFullYear();

            var fluxoCaixa = await knex('FluxoCaixa')
            .where('cod_plantacao', codPlantacao)
            .where('mes_referencia', mesReferencia)
            .select('saldo_operacional')


            if (fluxoCaixa.length == 0) {
                await knex('FluxoCaixa')
                .insert({
                    mes_referencia: mesReferencia,
                    cod_plantacao: codPlantacao,
                    capital_inicial: 0,
                    saldo_operacional: parcelaFixa,
                    saldo_transportar: 0
                })

            } else {
                // Resgatar saldo_operacional
                var saldoOperacional = Number(fluxoCaixa[0].saldo_operacional)

                // atualizar saldo_operacional
                await knex('FluxoCaixa')
                .where('cod_plantacao', codPlantacao)
                .where('mes_referencia', mesReferencia)
                .update({
                    saldo_operacional: saldoOperacional + parcelaFixa
                })

            }
            
            await varreduraFluxoCaixa(codPlantacao)

            const entradas = await apresentacaoEntradas();
            
            return  res.render('FluxoCaixa/entrada.html', {entradas})
        } catch (error) {
            next(error)
        }
        
    },
    async acessarEntrada(req,res, next) {
        try {
            const {
                codEntrada
            } = req.body;

            local('codEntrada', String(codEntrada))  

            const entrada = await buscaEntrada();
            
            return  res.render('FluxoCaixa/visualizarEntrada.html', {entrada})
        } catch (error) {
            next(error)
        }
        
    },
    async paginaEditarEntrada(req,res, next) {
        try {
            const entrada = await buscaEntrada();
            
            return  res.render('FluxoCaixa/editarEntrada.html', {entrada})
        } catch (error) {
            next(error)
        }
        
    },
    // Função de edicao no banco de dados
    async editarEntrada(req,res, next) {
        try {
            const codEntrada = Number(local('codEntrada'))
            const codPlantacao = Number(local('plantacao'))
            const{
                nomeEntrada,
                valorEntrada,
                dtInicio
            } = req.body;

            // Resgatar o valor anterior para atualizar também no FluxoCaixa
            const valorAntigo = await knex('Entradas')
            .where({'cod_Entrada': codEntrada})
            .select('valor_entrada')
            
            await knex('Entradas')
            .where({'cod_Entrada': codEntrada})
            .update({
                'nome_entrada': nomeEntrada.toUpperCase(),
                'valor_entrada': valorEntrada,
                'validade_entrada': dtInicio,
            })

            const dtEntrada = new Date(dtInicio)
            dtEntrada.setDate(dtEntrada.getDate() + 1)

            var mesReferencia = dtEntrada.getMonth() + '-' + dtEntrada.getFullYear();

            var fluxoCaixa = await knex('FluxoCaixa')
            .where('cod_plantacao', codPlantacao)
            .where('mes_referencia', mesReferencia)
            .select('saldo_operacional')


            // Resgatar saldo_operacional
            var saldoOperacional = fluxoCaixa[0].saldo_operacional + (Number(valorEntrada) - valorAntigo[0].valor_entrada)
            
            // atualizar saldo_operacional
            await knex('FluxoCaixa')
            .where('cod_plantacao', codPlantacao)
            .where('mes_referencia', mesReferencia)
            .update({
                saldo_operacional: saldoOperacional
            })

            await varreduraFluxoCaixa(codPlantacao);

            const entrada = await buscaEntrada();
            
            return  res.render('FluxoCaixa/visualizarEntrada.html', {entrada})
        } catch (error) {
            next(error)
        }
        
    },
    // Função de edicao no banco de dados
    async excluirEntrada(req,res, next){
        try {
            const codEntrada = Number(local('codEntrada'))
            const codPlantacao = Number(local('plantacao'))

            const entrada = await knex('Entradas')
            .where('cod_entrada', codEntrada)
            .select('valor_entrada', 'validade_entrada')

            const valorEntrada = Number(entrada[0].valor_entrada);
            const data = new Date(entrada[0].validade_entrada);
            data.setDate(data.getDate() + 1)
            const mesReferencia = data.getMonth()+'-'+data.getFullYear();

            await knex('Entradas')
            .where({'cod_entrada': codEntrada})
            .update({'status_entrada': 0})

            const saldoOperacional = await knex('FluxoCaixa')
            .where('cod_plantacao', codPlantacao)
            .where('mes_referencia', mesReferencia)
            .select('saldo_operacional')

            await knex('FluxoCaixa')
            .where('cod_plantacao', codPlantacao)
            .where('mes_referencia', mesReferencia)
            .update({
                saldo_operacional: saldoOperacional[0].saldo_operacional - valorEntrada
            })

            await varreduraFluxoCaixa(codPlantacao);

            const entradas = await apresentacaoEntradas();

            return res.render('FluxoCaixa/entrada.html', {entradas})
        } catch (error) {
            next(error)
        }
    },
    async saida(req,res, next) {
        try {
            
            const saidas =   await apresentacaoSaidas();

            return  res.render('FluxoCaixa/saida.html', {saidas})
        } catch (error) {
            next(error)
        }
        
    },
    async buscarSaida(req, res, next){
        try {
            const codPlantacao = Number(local('plantacao'))
            const {
                inicioBusca,
                fimBusca
            } = req.body;

            const saidas = await knex('Saidas')
            .where({'cod_plantacao': codPlantacao})
            .where({'status_saida': 1})
            .whereBetween('validade_saida', [inicioBusca, fimBusca])
            .select();

            for (let index = 0; index < saidas.length; index++) {
                
                const data = new Date(saidas[index].validade_saida);
                saidas[index].validade_saida = data.getDate() + "/" + (data.getMonth() + 1) + "/" + data.getFullYear();
                                
            }

            return  res.render('FluxoCaixa/saida.html', {saidas})
        } catch (error) {
            next(error)
        }
    },
    async criarSaida(req, res, next){
        try {
            return res.render('FluxoCaixa/criarSaida.html')
        } catch (error) {
            next(error)
        }
    },
    // Função de salvar dados no banco de dados
    async salvarSaida(req,res, next) {
        try {
            const {
                nomeSaida,
                valorSaida,
                dtPagamento,
                caracteristicaPagamento,
            } = req.body

            const codPlantacao = Number(local('plantacao'))
            var parcelaFixa = Number(valorSaida)
            var dataPagamento = new Date(dtPagamento);
            dataPagamento.setDate(dataPagamento.getDate() + 1)
            const dia = dataPagamento.getDate();
            var mes = dataPagamento.getMonth();
            var ano = dataPagamento.getFullYear();
          
            //Cadastro da Saidas pelos números de parcelas
            var dtSaida = new Date(ano, mes, dia)

            if (dia != dtSaida.getDate()){
                dtSaida.setDate(0);
            }
            
            if(caracteristicaPagamento == 0){     
                switch (dtSaida.getDay()) {
                    case 0:
                        dtSaida.setDate(dtSaida.getDate() + 1);
                        break;
                    case 6:
                        dtSaida.setDate(dtSaida.getDate() + 2);
                        break;
                    default:
                        break;
                }            
            } 
                
 
            await knex('Saidas').insert({
                'cod_saida': null,
                'cod_plantacao': codPlantacao,
                'validade_saida': dtSaida,
                'nome_saida': nomeSaida.toUpperCase(),
                'valor_saida': parcelaFixa,
                'status_saida': 1,
            })

            const codSaidas = await knex('Saidas')
            .where('cod_plantacao', codPlantacao)
            .select('cod_saida')

            const codSaida = codSaidas[codSaidas.length - 1].cod_saida

            await adicionarPassivo(codSaida)                

            var mesReferencia = dtSaida.getMonth() + '-' + dtSaida.getFullYear();
                
            var fluxoCaixa = await knex('FluxoCaixa')
            .where('cod_plantacao', codPlantacao)
            .where('mes_referencia', mesReferencia)
            .select('saldo_operacional')


            if (fluxoCaixa.length == 0) {
                await knex('FluxoCaixa')
                .insert({
                    'mes_referencia': mesReferencia,
                    'cod_plantacao': codPlantacao,
                    'capital_inicial': 0,
                    'saldo_operacional': Math.sign(parcelaFixa),
                    'saldo_transportar': 0
                })

            } else {
                // Resgatar saldo_operacional
                var saldoOperacional = fluxoCaixa[0].saldo_operacional

                // atualizar saldo_operacional
                await knex('FluxoCaixa')
                .where('cod_plantacao', codPlantacao)
                .where('mes_referencia', mesReferencia)
                .update({
                    saldo_operacional: saldoOperacional - parcelaFixa
                })

            }        

            await varreduraFluxoCaixa(codPlantacao);
                        
            const saidas = await apresentacaoSaidas();
            
            return  res.render('FluxoCaixa/saida.html', {saidas})
        } catch (error) {
            next(error)
        }
        
    },
    async acessarSaida(req,res, next) {
        try {
            const {
                codSaida
            } = req.body;
            
            local('codSaida', String(codSaida))

            const saida = await buscarSaida();
            
            return  res.render('FluxoCaixa/visualizarSaida.html', {saida})
        } catch (error) {
            next(error)
        }
        
    },
    async paginaEditarSaida(req,res, next) {
        try {
            const saida = await buscarSaida();
            
            return  res.render('FluxoCaixa/editarSaida.html', {saida})
        } catch (error) {
            next(error)
        }
        
    },
    // Função de edicao no banco de dados
    async editarSaida(req,res, next) {
        try {
            const codSaida = Number(local('codSaida'))
            const codPlantacao = Number(local('plantacao'))
           
            const{
                nomeSaida,
                valorSaida,
                dtSaida
            } = req.body;

            // Resgatando o valor antigo da saída para o FluxoCaixa
            const valorAntigo = await knex('Saidas')
            .where('cod_saida', codSaida)
            .select('valor_saida');
            
            await knex('Saidas')
            .where({'cod_saida': codSaida})
            .update({
                'nome_saida': nomeSaida.toUpperCase(),
                'valor_saida': valorSaida,
                'validade_saida': dtSaida,
            })

            // Atualizar o saldo operacional do mes correspondente
            const dataSaida = new Date(dtSaida);
            dataSaida.setDate(dataSaida.getDate() + 1)
            var mes_referencia = dataSaida.getMonth() + '-' + dataSaida.getFullYear();

            var fluxoCaixa = await knex('FluxoCaixa')
            .where('cod_plantacao', codPlantacao)
            .where('mes_referencia', mes_referencia)
            .select('saldo_operacional', 'cod_fluxoCaixa')

            var saldoOperacional = fluxoCaixa[0].saldo_operacional - (Number(valorSaida) - valorAntigo[0].valor_saida)

            await knex('FluxoCaixa')
            .where('cod_fluxoCaixa', Number(fluxoCaixa[0].cod_fluxoCaixa))
            .update({
                'saldo_operacional': saldoOperacional,
            })

            await varreduraFluxoCaixa(codPlantacao);
            const saida = await buscarSaida();
            
            return  res.render('FluxoCaixa/visualizarSaida.html', {saida})
        } catch (error) {
            next(error)
        }
        
    },

    async excluirSaida(req,res, next){
        try {
            const codSaida = Number(local('codSaida'))
            const codPlantacao = Number(local('plantacao'))

            const saida = await knex('Saidas')
            .where('cod_saida', codSaida)
            .select('valor_saida', 'validade_saida')

            const valorSaida = Number(saida[0].valor_saida);
            const data = new Date(saida[0].validade_saida);
            data.setDate(data.getDate() + 1);
            const  mesReferencia = data.getMonth() + '-' + data.getFullYear();

            await knex('Saidas')
            .where({'cod_saida': codSaida})
            .update({'status_saida': 0})

            const saldoOperacional = await knex('FluxoCaixa')
            .where('cod_plantacao', codPlantacao)
            .where('mes_referencia', mesReferencia)
            .select('saldo_operacional', 'cod_fluxoCaixa')

            const saldoTotal = Number(saldoOperacional[0].saldo_operacional) + Number(valorSaida);

            console.log(saldoTotal)
            console.log(saldoOperacional[0].saldo_operacional)
            console.log(valorSaida)


            await knex('FluxoCaixa')
            .where('cod_fluxocaixa', Number(saldoOperacional[0].cod_fluxoCaixa))
            .update({
                'saldo_operacional': saldoTotal
            })

            

            await varreduraFluxoCaixa(codPlantacao);

            const saidas = await apresentacaoSaidas();

            return res.render('FluxoCaixa/saida.html', {saidas})
        } catch (error) {
            next(error)
        }
    },
    
}