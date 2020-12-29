const knex = require('../database')
const e = require('express');
const local = require('local-storage');
const { where } = require('../database');
const { passivoPermanente } = require('./BalancoController');

const codPlantacao = Number(local('plantacao'))
const emailUsuario = local('email')
var resultadoFinal;
var resultadoConta;
var meses = [
    'Jan.', 
    'Fer.', 
    'Mar.', 
    'Abr.', 
    'Mai.', 
    'Jun.', 
    'Jul.', 
    'Ago.',
    'Set', 
    'Out.', 
    'Nov.', 
    'Dez.'
];
var dadosFinanciamento 


async function criarFluxoCaixa(mesReferencia){
    var fluxoCaixaAnterior = await knex('FluxoCaixa')
    .where({'cod_plantacao': Number(local('plantacao'))})
    .select()

    await knex('FluxoCaixa')
    .insert({
        'mes_referencia': mesReferencia,
        'cod_plantacao': Number(local('plantacao')),
        'capital_inicial': fluxoCaixaAnterior[fluxoCaixaAnterior.length -1].saldo_transportar,
        'saldo_operacional': 0,
        'saldo_transportar': 0,
    })
    
            
    var fluxoCaixa = await knex('FluxoCaixa')
    .where({'cod_plantacao': Number(local('plantacao'))})
    .where({'mes_referencia': mesReferencia})
    .select()

    return fluxoCaixa
}
async function criarBalanco(anoReferencia){
    // Busca dos dados do balanco do ano Anterior
    const balancoAnterior = await knex('BalancosPatrimoniais')
    .where('cod_plantacao', codPlantacao)
    .where('ano_referencia', anoReferencia - 1)
    .select();

    const codBalancoAntigo = balancoAnterior[0].cod_balanco;

    // Busca dos Ativos Circulantes e soma dos valores
    var totalAC = 0;
    var ativos= await knex('Ativos')
    .where('cod_balanco', codBalancoAntigo)
    .where('tipo_ativo', 'ATIVO CIRCULANTE')
    .select()

    for (let index = 0; index < ativos.length; index++) {
        totalAC = totalAC + ativos[index].valor_ativo;        
    }

    // Busca dos Passivos
    var totalP = 0;
    var passivos = await knex('Passivos')
    .where('cod_balanco', codBalancoAntigo)
    .select()

    for (let index = 0; index < passivos.length; index++) {
        totalP = totalP + passivos[index].valor_passivo;
        
    }

    var valorAtivo = 0;
    var valorPassivo = 0;

    if (totalAC < totalP) {
        valorAtivo = 0;
        valorPassivo = totalP - totalAC;
    } else {
        valorAtivo = totalAC - totalP;
        valorPassivo = 0;
    }

    // Criação do BalancoAtual
    await knex('BalancosPatrimoniais')
    .insert({
        'cod_plantacao': codPlantacao,
        'ano_referencia': anoReferencia,
        'valor_ativo': valorAtivo,
        'valor_passivo': valorPassivo,
        'patrimonio_liquido': 0,
        'capital_social': 0,
    })

    var balanco = await knex('BalancosPatrimoniais')
    .where('cod_plantacao', codPlantacao)
    .where('ano_referencia', anoReferencia)
    .select();

    const codBalancoAtual = balanco[0].cod_balanco;
    const dataAtual = new Date();

    await knex('Ativos')
    .insert({
        'cod_balanco': codBalancoAtual,
        'tipo_ativo': 'ATIVO CIRCULANTE',
        'nome_ativo': 'CAIXA - ' + anoReferencia,
        'valor_ativo': totalAC,
        'data_ativo': dataAtual,
    })
    return balanco;
}


module.exports = {
    async criarFinanciamento(req, res, next) {
        try {
            return res.render('Financiamento/criarFinanciamento.html')
        } catch (error) {
            next(error)
        }   
    },

    // Acessar Página de criação de Financiamento
    async calcularFinancimento(req, res, next) {
        try {

            var vpf;        // Valor da Parcela Fixa
            var jpp;        // Juros pagos no periodo t
            var vr;         // Valor residual do periodo
            var tc;         // tempo de carencia
            var np;         // numero de Parcelas
            var dados;      // valor exclusivo por parcelas
            var tipoParcela;//valor  
            var tipoCarencia;
            var dthoje = new Date();

            const {
                tipoFinanciamento,
                valorFinanciamento,
                parcela,
                numeroParcelas,
                taxaAnual,
                carencia,
                tempoCarencia,
                typeCarencia
            } = req.body

            resultadoFinal = [];

            vr = valorFinanciamento;
            var i = (taxaAnual/100);
            tc = Number(tempoCarencia)
            np = Number(numeroParcelas)
            const dataAtual = new Date()

            dadosFinanciamento = {
                tipoFinanciamento: tipoFinanciamento,
                valorFinanciamento: valorFinanciamento,
                taxaFinanciamento: taxaAnual,
                dataFinanciamento: dataAtual,
                tipoCarencia: typeCarencia,
                tempoCarencia: tempoCarencia,
                tipoQuitacao: parcela,
                tempoQuitacao: numeroParcelas,
            }           

            switch (typeCarencia) {
                case 'MÊS':
                    tipoCarencia = 1/12
                    break;
                case 'BIMESTRE':
                    tipoCarencia = 2/12
                    break;
                case 'TRIMESTRE':
                    tipoCarencia = 3/12
                    break;
                case 'SEMESTRE':
                    tipoCarencia = 6/12
                    break;
                default:
                    tipoCarencia = 1
                    break;
            }

            switch (parcela) {
                case 'MÊS':
                    tipoParcela = 1/12
                    break;
                case 'BIMESTRE':
                    tipoParcela = 2/12
                    break;
                case 'TRIMESTRE':
                    tipoParcela = 3/12
                    break;
                case 'SEMESTRE':
                    tipoParcela = 6/12
                    break;
                default:
                    tipoParcela = 1
                    break;
            }


            dados = {
                tempo: (parcela + " " + 0),
                parcela: 'nulo',
                parcelasPrincipais: 0,
                juros: 0,
                parcelaTotal: 0,
                saldoDevedor: vr,
                mesPagamento: (dthoje.getDate() + ' de '+  meses[dthoje.getMonth()]),
                anoPagamento: (dthoje.getFullYear())          
            }

            resultadoFinal.push(dados);

            vpf = valorFinanciamento / (np)
                       
            switch (carencia) {
                case '0':
                    for (let index = 1; index <= np; index++) {
                                    
                        jpp = vr * i * tipoParcela;
                        vr = vr - vpf;

                        switch (parcela) {
                            case 'MÊS':
                                dthoje.setMonth(dthoje.getMonth() + 1)
                                
                                break;
                            case 'BIMESTRE':
                                dthoje.setMonth(dthoje.getMonth() + 2)
                                
                                break;
                            case 'TRIMESTRE':
                                dthoje.setMonth(dthoje.getMonth() + 3)
                                
                                break;
                            case 'SEMESTRE':
                                dthoje.setMonth(dthoje.getMonth() + 6)
                                break;
                            default:
                                dthoje.setMonth(dthoje.getMonth() + 12)
                                break;
                        }

                        dados = {
                            tempo: (parcela + " " + index),
                            parcela: 'parcela',
                            parcelasPrincipais: vpf.toFixed(2),
                            juros: jpp.toFixed(2),
                            parcelaTotal: (vpf + jpp).toFixed(2),
                            saldoDevedor: vr.toFixed(2),
                            mesPagamento: meses[dthoje.getMonth()],
                            anoPagamento: dthoje.getFullYear(),
                            diaPagamento: '',
                        };
                    
                        resultadoFinal.push(dados);     
                    }
                    break;
                case '1':
                    // Não possui Carência
                    for (let index = 1; index <= tc; index++) {
                        switch (typeCarencia) {
                            case 'MÊS':
                                dthoje.setMonth(dthoje.getMonth() + 1)
                                
                                break;
                            case 'BIMESTRE':
                                dthoje.setMonth(dthoje.getMonth() + 2)
                                
                                break;
                            case 'TRIMESTRE':
                                dthoje.setMonth(dthoje.getMonth() + 3)
                                
                                break;
                            case 'SEMESTRE':
                                dthoje.setMonth(dthoje.getMonth() + 6)
                                break;
                            default:
                                dthoje.setMonth(dthoje.getMonth() + 12)
                                break;
                        }

                        dados = {
                            tempo: (typeCarencia + " " + index),
                            parcela: 'carencia',
                            parcelasPrincipais: 0,
                            juros: 0,
                            parcelaTotal: 0,
                            saldoDevedor: vr,
                            mesPagamento: meses[dthoje.getMonth()],
                            anoPagamento: dthoje.getFullYear(),
                            diaPagamento: '',
                        }
                    
                        resultadoFinal.push(dados);
                    }

                    for (let index = 1; index <= np; index++) {
                                        
                        jpp = vr * i * tipoParcela;
                        vr = vr - vpf;

                        switch (parcela) {
                            case 'MÊS':
                                dthoje.setMonth(dthoje.getMonth() + 1)
                                
                                break;
                            case 'BIMESTRE':
                                dthoje.setMonth(dthoje.getMonth() + 2)
                                
                                break;
                            case 'TRIMESTRE':
                                dthoje.setMonth(dthoje.getMonth() + 3)
                                
                                break;
                            case 'SEMESTRE':
                                dthoje.setMonth(dthoje.getMonth() + 6)
                                break;
                            default:
                                dthoje.setMonth(dthoje.getMonth() + 12)
                                break;
                        }

                        dados = {
                            tempo: (parcela + " " + index),
                            parcela: 'parcela',
                            parcelasPrincipais: vpf.toFixed(2),
                            juros: jpp.toFixed(2),
                            parcelaTotal: (vpf + jpp).toFixed(2),
                            saldoDevedor: vr.toFixed(2),
                            mesPagamento: meses[dthoje.getMonth()],
                            anoPagamento: dthoje.getFullYear(),
                            diaPagamento: '',
                        }
                    
                        resultadoFinal.push(dados);  
                             
                    }
                    break;
                case '2':
                    // Possui Carênca com juros
                    for (let index = 1; index <= tc; index++) {
                        
                        jpp = vr * i * tipoCarencia;

                        switch (typeCarencia) {
                            case 'MÊS':
                                dthoje.setMonth(dthoje.getMonth() + 1)
                                
                                break;
                            case 'BIMESTRE':
                                dthoje.setMonth(dthoje.getMonth() + 2)
                                
                                break;
                            case 'TRIMESTRE':
                                dthoje.setMonth(dthoje.getMonth() + 3)
                                
                                break;
                            case 'SEMESTRE':
                                dthoje.setMonth(dthoje.getMonth() + 6)
                                break;
                            default:
                                dthoje.setMonth(dthoje.getMonth() + 12)
                                break;
                        }

                        dados = {
                            tempo: (typeCarencia + " " + index),
                            parcela: 'carencia',
                            parcelasPrincipais: 0,
                            juros: jpp.toFixed(2),
                            parcelaTotal: jpp.toFixed(2),
                            saldoDevedor: vr,
                            mesPagamento: meses[dthoje.getMonth()],
                            anoPagamento: dthoje.getFullYear(),
                            diaPagamento: '',
                        };

                        resultadoFinal.push(dados);
                    }               
                    
                    for (let index = 1; index <= np; index++) {
                                        
                        jpp = vr * i * tipoParcela;
                        vr = vr - vpf;
                        
                        switch (parcela) {
                            case 'MÊS':
                                dthoje.setMonth(dthoje.getMonth() + 1)
                                
                                break;
                            case 'BIMESTRE':
                                dthoje.setMonth(dthoje.getMonth() + 2)
                                
                                break;
                            case 'TRIMESTRE':
                                dthoje.setMonth(dthoje.getMonth() + 3)
                                
                                break;
                            case 'SEMESTRE':
                                dthoje.setMonth(dthoje.getMonth() + 6)
                                break;
                            default:
                                dthoje.setMonth(dthoje.getMonth() + 12)
                                break;
                        }

                        dados = {
                            tempo: (parcela + " " + index),
                            parcela: 'parcela',
                            parcelasPrincipais: vpf.toFixed(2),
                            juros: jpp.toFixed(2),
                            parcelaTotal: (vpf + jpp).toFixed(2),
                            saldoDevedor: vr.toFixed(2),
                            mesPagamento: meses[dthoje.getMonth()],
                            anoPagamento: dthoje.getFullYear(),
                            diaPagamento: '',
                        }
                    
                        resultadoFinal.push(dados);  
                    }
                    break;

                default:
                    break;
            }

            var titulo = 'Resultado do Financiamento'

            return res.render("Financiamento/apresentarFinanciamento.html", {resultadoFinal, titulo})
        } catch (error) {
            next(error)
        }
    },

    async cadastrarConta(req, res, next) {
        try {
            const {
                diaPagamento,
                regraPagamento
            } = req.body

            resultadoConta = [];

            for (let index = 1; index < resultadoFinal.length; index++) {
                var ano = resultadoFinal[index].anoPagamento;

                var cont = 0;
                while( meses[cont] != resultadoFinal[index].mesPagamento ){
                    cont ++;
                    if (cont == 11){
                        break;
                    }
                }

                var payDay = new Date(Number(ano), Number(cont), Number(diaPagamento));
                if (payDay.getMonth() > cont){
                    payDay.setDate(payDay.getDate() - 1);
                }
                if (payDay.getDay() == 0 || payDay.getDay() == 6) {
                    if(regraPagamento == "proximo"){
                        if(payDay.getDay() == 0){
                           payDay.setDate(payDay.getDate() + 1);
                        } else {
                            payDay.setDate(payDay.getDate() + 2);
                        }
                    } else {
                        if(payDay.getDay() == 0){
                            payDay.setDate(payDay.getDate() - 2);
                        } else {
                            payDay.setDate(payDay.getDate() - 1);
                        }
                    }
                } 

                if (resultadoFinal[index].parcelaTotal > 0) {
                    var dados = {
                        tempo: resultadoFinal[index].tempo,
                        tipoConta: resultadoFinal[index].parcela,
                        valor: resultadoFinal[index].parcelaTotal,
                        diaPagamento: payDay.getDate(),
                        mesPagamento: payDay.getMonth() + 1,
                        anoPagamento: payDay.getFullYear(),                        
                    }
                }
                resultadoConta.push(dados);  
                                            
            }

            // Inserirdo Financiamento na tabela
            var titulo = 'Resultado das Contas'
            
            return res.render("Financiamento/apresentarResultadoFinal.html", {resultadoConta, titulo})
        } catch (error) {
            next(error)
        }
    },

    async finalizarFinanciamento(req, res, next){
        try {
            const dataFimFinanciamento = resultadoConta[resultadoConta.length -1].anoPagamento+'-'+resultadoConta[resultadoConta.length -1].mesPagamento+'-'+resultadoConta[resultadoConta.length -1].diaPagamento
            //Inserir na tabela Financiamento OKAY
            await knex('Financiamentos')
            .insert({
                'cod_financiamento': null,
                'cod_plantacao': Number(local('plantacao')),
                'tipo_financiamento': dadosFinanciamento.tipoFinanciamento,
                'valor_financiamento': dadosFinanciamento.valorFinanciamento,
                'taxa_financiamento': dadosFinanciamento.taxaFinanciamento,
                'dt_financiamento': dadosFinanciamento.dataFinanciamento,
                'dt_finalizado': dataFimFinanciamento,
                'tempo_carencia': dadosFinanciamento.tempoCarencia,
                'tempo_quitacao': dadosFinanciamento.tempoQuitacao,
                'tipo_carencia': dadosFinanciamento.tipoCarencia,
                'tipo_quitacao': dadosFinanciamento.tipoQuitacao,
                'email_usuario': local('email'),
            })

            const dataFinanciamento = new Date(dadosFinanciamento.dataFinanciamento)

            // Inserirndo o capital inicial no fluxo de caixa
            var fluxoCaixa = await knex('FluxoCaixa')
            .where('cod_plantacao', Number(local('plantacao')))
            .where('mes_referencia', dataFinanciamento.getMonth()+'-'+dataFinanciamento.getFullYear())
            .select()

            // Criar fluxo de caixa se não existir
            if(fluxoCaixa.length == 0){
                var mesReferencia = dataFinanciamento.getMonth()+'-'+dataFinanciamento.getFullYear()
                fluxoCaixa = await criarFluxoCaixa(mesReferencia);
            }

            await knex('FluxoCaixa')
            .where('cod_fluxoCaixa', fluxoCaixa[0].cod_fluxoCaixa)
            .update({
                'capital_inicial': Number(fluxoCaixa[0].capital_inicial) + Number(dadosFinanciamento.valorFinanciamento),
            })

            // Inserir no ativo
                //Pegar o balanco o ano referente
            var balanco = await knex('BalancosPatrimoniais')
            .where('cod_plantacao', Number(local('plantacao')))
            .where('ano_referencia', dataFinanciamento.getFullYear())
            .select()

            if (balanco.length == 0){
                balanco = criarBalanco(dataFinanciamento.getFullYear());
            }

            var valorAtivoAtual = await knex('Ativos')
            .where('cod_balanco', balanco[0].cod_balanco)
            .where('nome_ativo', 'CAIXA - '+ dataFinanciamento.getFullYear())
            .select()

            if (valorAtivoAtual.length == 0){
                await knex('Ativos')
                .insert({
                    'cod_plantacao': Number(local('plantacao')),
                    'cod_balanco': balanco[0].cod_balanco,
                    'tipo_ativo': 'ATIVO CIRCULANTE',
                    'nome_ativo': 'CAIXA - '+ dataFinanciamento.getFullYear(),
                    'valor_ativo': 0,
                    'data_ativo': dadosFinanciamento.dataFinanciamento,
                })

                valorAtivoAtual = await knex('Ativos')
                .where('cod_balanco', balanco[0].cod_balanco)
                .where('nome_ativo', 'CAIXA - '+ dataFinanciamento.getFullYear())
                .select()
            }

            await knex('Ativos')
            .where('cod_balanco', balanco[0].cod_balanco)
            .where('nome_ativo', 'CAIXA - '+ dataFinanciamento.getFullYear())
            .update({
                'valor_ativo': Number(valorAtivoAtual[0].valor_ativo) + Number(dadosFinanciamento.valorFinanciamento),
                'data_ativo': dadosFinanciamento.dataFinanciamento,
            })

            
            for (let index = 0; index < resultadoConta.length; index++) {
                //Inserir na tabela saida
                await knex('Saidas')
                .insert({
                    'cod_saida': null,
                    'cod_plantacao': Number(local('plantacao')),
                    'validade_saida': resultadoConta[index].anoPagamento +'-'+ resultadoConta[index].mesPagamento+'-'+ resultadoConta[index].diaPagamento,
                    'nome_saida':  resultadoConta[index].tipoConta.toUpperCase() + ' - ' +  dadosFinanciamento.tipoFinanciamento,
                    'valor_saida': resultadoConta[index].valor,
                    'destino_saida': 'PARCELAMENTO',
                    'cobranca_saida': 0,
                })                
            }

            for (let index = 0; index < resultadoFinal.length; index++) {
               //Criar o Passivo Permanente
               var passivoPermanente = await knex('Passivos')
               .where('nome_passivo', 'FINANCIAMENTO - ' + resultadoFinal[index].anoPagamento)
               .select()

               if(passivoPermanente.length == 0){
                   if(resultadoFinal[index].anoPagamento == dataFinanciamento.getFullYear()) {
                       await knex('Passivos')
                       .insert({
                           'cod_passivo': null,
                           'cod_plantacao': Number(local('plantacao')),
                           'cod_balanco': balanco[0].cod_balanco,
                           'tipo_passivo': 'PASSIVO PERMANENTE',
                           'nome_passivo': 'FINANCIAMENTO - ' + resultadoFinal[index].anoPagamento,
                           'valor_passivo': resultadoFinal[index].saldoDevedor,
                           'data_passivo': resultadoFinal[index].anoPagamento +'-'+ resultadoConta[0].mesPagamento+'-'+ resultadoConta[0].diaPagamento,
                       })
                   } else {
                       await knex('Passivos')
                       .insert({
                           'cod_passivo': null,
                           'cod_plantacao': Number(local('plantacao')),
                           'cod_balanco': 0,
                           'tipo_passivo': 'PASSIVO PERMANENTE',
                           'nome_passivo': 'FINANCIAMENTO - ' + resultadoFinal[index].anoPagamento ,
                           'valor_passivo': resultadoFinal[index].saldoDevedor,
                           'data_passivo': resultadoFinal[index].anoPagamento +'-'+ resultadoConta[0].mesPagamento+'-'+ resultadoConta[0].diaPagamento,
                       })
                   }
               } else {
                   await knex('Passivos')
                   .where('nome_passivo', 'FINANCIAMENTO - ' + resultadoFinal[index].anoPagamento )
                   .update({
                       'valor_passivo': Number(passivoPermanente[0].valor_passivo )+ Number(resultadoFinal[index].saldoDevedor),
                       'data_passivo': resultadoFinal[index].anoPagamento +'-'+ resultadoConta[0].mesPagamento+'-'+ resultadoConta[0].diaPagamento,
                   })
               }

                
            }

            // Preparando o retorno da função.

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
    }

}