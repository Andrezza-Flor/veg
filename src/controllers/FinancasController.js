const knex = require('../database')
const e = require('express');
const local = require('local-storage');

var resultadoFinal;
var resultadoConta;
var meses = [
    'Jan', 
    'Fer', 
    'Mar', 
    'Abr', 
    'Mai', 
    'Jun', 
    'Jul', 
    'Ago',
    'Set', 
    'Out', 
    'Nov', 
    'Dez'
];

module.exports = {
    

    // Acessar Página de criação de Financiamento
    async paginaCriar(req, res, next) {
        try {
            return res.render("Financas/calcularFinanciamento.html")
        } catch (error) {
            next(error)
        }
    },

    async calcularFinancimento(req, res, next) {
        try {

            var vpf;     // Valor da Parcela Fixa
            var jpp; // Juros pagos no periodo t
            var vr;  // Valor residual do periodo
            var tc; //tempo de carencia
            var np; //numero de Parcelas
            var dados; // valor exclusivo por parcelas
            var tipoParcela; //valor  
            var tipoCarencia;
            var dthoje = new Date();
            var mes;
            var ano;
            var mesAnalise;

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
                                mes = ((dthoje.getMonth()+1) + index);
                                
                                break;
                            case 'BIMESTRE':
                                mes = ((dthoje.getMonth()+1) + (2*index));
                                
                                break;
                            case 'TRIMESTRE':
                                mes = ((dthoje.getMonth()+1) + (3*index));
                                
                                break;
                            case 'SEMESTRE':
                                mes = ((dthoje.getMonth()+1) + (6*index));
                                break;
                            default:
                                mes = ((dthoje.getMonth()+1) + (12*index));
                                break;
                        }

                        if((mes % 12) == 0){
                            ano = 0
                        } else {
                            ano = Math.floor(mes/12)
                            mes = mes % 12;
                        }

                        dados = {
                            tempo: (parcela + " " + index),
                            parcela: 'parcela',
                            parcelasPrincipais: vpf.toFixed(2),
                            juros: jpp.toFixed(2),
                            parcelaTotal: (vpf + jpp).toFixed(2),
                            saldoDevedor: vr.toFixed(2),
                            mesPagamento: (meses[mes-1]),
                            anoPagamento: (dthoje.getFullYear() + ano),
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
                                mes = ((dthoje.getMonth()+1) + index);
                                
                                break;
                            case 'BIMESTRE':
                                mes = ((dthoje.getMonth()+1) + (2*index));
                                
                                break;
                            case 'TRIMESTRE':
                                mes = ((dthoje.getMonth()+1) + (3*index));
                                
                                break;
                            case 'SEMESTRE':
                                mes = ((dthoje.getMonth()+1) + (6*index));
                                break;
                            default:
                                mes = ((dthoje.getMonth()+1) + (12*index));
                                break;
                        }

                        if((mes % 12) == 0){
                            ano = 0
                        } else {
                            ano = Math.floor(mes/12)
                            mes = mes % 12;
                        }

                        dados = {
                            tempo: (typeCarencia + " " + index),
                            parcela: 'carencia',
                            parcelasPrincipais: 0,
                            juros: 0,
                            parcelaTotal: 0,
                            saldoDevedor: vr,
                            mesPagamento: (meses[mes-1]),
                            anoPagamento: (dthoje.getFullYear() + ano),
                            diaPagamento: '',
                        }
                    
                        resultadoFinal.push(dados);
                    }

                    mesAnalise = (12 * ano) + mes;
                    
                    for (let index = 1; index <= np; index++) {
                                        
                        jpp = vr * i * tipoParcela;
                        vr = vr - vpf;

                        switch (parcela) {
                            case 'MÊS':
                                mes = ((mesAnalise) + index);
                                
                                break;
                            case 'BIMESTRE':
                                mes = ((mesAnalise) + (2*index));
                                
                                break;
                            case 'TRIMESTRE':
                                mes = ((mesAnalise) + (3*index));
                                
                                break;
                            case 'SEMESTRE':
                                mes = ((mesAnalise) + (6*index));
                                break;
                            default:
                                mes = ((mesAnalise) + (12*index));
                                break;
                        }

                        if((mes % 12) == 0){
                            ano = 0
                        } else {
                            ano = Math.floor(mes/12)
                            mes = mes % 12;
                        }

                        dados = {
                            tempo: (parcela + " " + index),
                            parcela: 'parcela',
                            parcelasPrincipais: vpf.toFixed(2),
                            juros: jpp.toFixed(2),
                            parcelaTotal: (vpf + jpp).toFixed(2),
                            saldoDevedor: vr.toFixed(2),
                            mesPagamento: (meses[mes-1]),
                            anoPagamento: (dthoje.getFullYear() + ano),
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
                                mes = ((dthoje.getMonth()+1) + index);
                                
                                break;
                            case 'BIMESTRE':
                                mes = ((dthoje.getMonth()+1) + (2*index));
                                
                                break;
                            case 'TRIMESTRE':
                                mes = ((dthoje.getMonth()+1) + (3*index));
                                
                                break;
                            case 'SEMESTRE':
                                mes = ((dthoje.getMonth()+1) + (6*index));
                                break;
                            default:
                                mes = ((dthoje.getMonth()+1) + (12*index));
                                break;
                        }

                        if((mes % 12) == 0){
                            ano = 0
                        } else {
                            ano = Math.floor(mes/12)
                            mes = mes % 12;
                        }

                        dados = {
                            tempo: (typeCarencia + " " + index),
                            parcela: 'carencia',
                            parcelasPrincipais: 0,
                            juros: jpp.toFixed(2),
                            parcelaTotal: jpp.toFixed(2),
                            saldoDevedor: vr,
                            mesPagamento: (meses[mes-1]),
                            anoPagamento: (dthoje.getFullYear() + ano),
                            diaPagamento: '',
                        };

                        resultadoFinal.push(dados);
                    }

                    mesAnalise = (12 * ano) + mes;
                    
                    
                    for (let index = 1; index <= np; index++) {
                                        
                        jpp = vr * i * tipoParcela;
                        vr = vr - vpf;
                        
                        switch (parcela) {
                            case 'MÊS':
                                mes = ((mesAnalise) + index);
                                
                                break;
                            case 'BIMESTRE':
                                mes = ((mesAnalise) + (2*index));
                                
                                break;
                            case 'TRIMESTRE':
                                mes = ((mesAnalise) + (3*index));
                                
                                break;
                            case 'SEMESTRE':
                                mes = ((mesAnalise) + (6*index));
                                break;
                            default:
                                mes = ((mesAnalise) + (12*index));
                                break;
                        }

                        if((mes % 12) == 0){
                            ano = 0
                        } else {
                            ano = Math.floor(mes/12)
                            mes = mes % 12;
                        }

                        dados = {
                            tempo: (parcela + " " + index),
                            parcela: 'parcela',
                            parcelasPrincipais: vpf.toFixed(2),
                            juros: jpp.toFixed(2),
                            parcelaTotal: (vpf + jpp).toFixed(2),
                            saldoDevedor: vr.toFixed(2),
                            mesPagamento: (meses[mes-1]),
                            anoPagamento: (dthoje.getFullYear() + ano),
                            diaPagamento: '',
                        }
                    
                        resultadoFinal.push(dados);  
                    }
                    break;

                default:
                    break;
            }

            var titulo = 'Resultado do Financiamento'

            return res.render("Financas/criarFinanciamento.html", {resultadoFinal, titulo})
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


            var titulo = 'Resultado das Contas'

            return res.render("Financas/criarConta.html", {resultadoConta, titulo})
        } catch (error) {
            next(error)
        }
    }

}