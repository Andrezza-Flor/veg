const knex = require('../database')
const e = require('express')
const local = require('local-storage');
const { render } = require('nunjucks');
const { where, update, select } = require('../database');

const dataAtual = new Date()
const dataInicio = dataAtual.getFullYear() + '-' + 1 + '-' + 1;
var totalAtivo = 0;
var cod_conta = 0;

async function apresentarAtivoCirculanete(){

    var ativos = await knex('Ativos')
    .where('tipo_ativo', 'ATIVO CIRCULANTE')
    .whereBetween('data_ativo', [dataInicio, dataAtual])
    .select()

    totalAtivo = 0;
    
    for (let index = 0; index < ativos.length; index++) {
        var dataAtivo = new Date(ativos[index].data_ativo)      
                
        ativos[index].data_ativo = dataAtivo.getDate() + '-' + (dataAtivo.getMonth() + 1) + '-' + dataAtivo.getFullYear()
        
        totalAtivo = totalAtivo + Number(ativos[index].valor_ativo)
    }

    ativos.splice(1,1);

    // Busca de bancos cadastarados na plantacao 
    const bancos = await knex('Contas')
    .where('cod_plantacao', Number(local('plantacao')))
    .where('status_conta', 1)
    .select()

    for (let index = 0; index < bancos.length; index++) {
        var dtConta = new Date (bancos[index].dt_atualizacao_conta)

        var banco = {
            nome_ativo:"CONTA " + bancos[index].tipo_conta + " " + bancos[index].nome_banco,
            valor_ativo: bancos[index].saldo_conta,
            data_ativo: dtConta.getDate()+"-"+(dtConta.getMonth()+1)+"-"+dtConta.getFullYear(),
        }
        
        ativos.push(banco)
    }

    return ativos
}

module.exports = {
    // Função de apresentação Ativos Circulantes
    async ativoCirculante(req,res, next) {
        try {
            const ativos = await apresentarAtivoCirculanete();

            const tamanhoAtivo = ativos.length

            return  res.render('Balanco/ativoCirculante.html', {ativos, totalAtivo, tamanhoAtivo})
        } catch (error) {
            return next(error)
        }
        
    },

        // Função Criar Conta Bancaria
    async criarConta(req, res, next){
        try {
            return res.render('Balanco/criarConta.html')
        } catch (error) {
            next(error)
        }
    },
    async salvarConta(req, res, next){
        try {
            const {
                nomeBanco,
                tipoConta,
            } = req.body;
            
            await knex('Contas')
            .insert({
                'nome_banco': nomeBanco.toUpperCase(),
                'tipo_conta': tipoConta,
                'mensalidade_conta': 0,
                'dt_atualizacao_conta': dataAtual,
                'saldo_conta': 0,
                'cod_plantacao': Number(local('plantacao')),
                'status_conta': 1,
            })

           const ativos = await apresentarAtivoCirculanete()

            const tamanhoAtivo = ativos.length

            return  res.render('Balanco/ativoCirculante.html', {ativos, totalAtivo, tamanhoAtivo})

        } catch (error) {
            return next(error)
        }
    },
    async escolherConta(req, res, next){
        try {
            const contas = await knex('Contas')
            .where('cod_plantacao', Number(local('plantacao')))
            .where('status_conta', 1)
            .where('saldo_conta', 0)
            .select()
            const numeroBancos = contas.length
            return res.render('Balanco/escolherBanco.html', {numeroBancos, contas})
        } catch (error) {
            next(error)
        }
    },
    async excluirConta(req, res, next){
        try {
            const {
                codConta
            } = req.body

            
            await knex('Contas')
            .where('cod_conta', codConta)
            .update({
                'status_conta': 0,
            })

            const ativos = await apresentarAtivoCirculanete();

            const tamanhoAtivo = ativos.length

            return  res.render('Balanco/ativoCirculante.html', {ativos, totalAtivo, tamanhoAtivo})
        
        } catch (error) {
            next(error)
        }
    },
    
    async escolherContaSaque(req, res, nex){
        try {
            const contas = await knex('Contas')
            .where('cod_plantacao', Number(local('plantacao')))
            .where('status_conta', 1)
            .whereNot('saldo_conta', 0)
            .select()
            return  res.render('Balanco/escolherContaSaque.html', {contas})
        } catch (error) {
            nex(error)
        }
    },
    async escolherValorSaque(req, res, nex){
        try {
            const {
                codConta
            } = req.body;
            
            cod_conta = codConta

            const contas = await knex('Contas')
            .where('cod_conta', codConta)
            .select()

            const conta = 'CONTA ' + contas[0].tipo_conta +' '+ contas[0].nome_banco
            const maximoSaque = contas[0].saldo_conta;

            return  res.render('Balanco/escolherContaSaqueII.html', {conta, maximoSaque})
        } catch (error) {
            nex(error)
        }
    },
    async saque(req, res, nex){
        try {
            const {
                valorSaque
            } = req.body

            // Atualizar na tabela Bancos
            const saldoAntigo = await knex('Contas')
            .where('cod_conta', cod_conta)
            .select()

            await knex('Contas')
            .where('cod_conta', cod_conta)
            .update({
                'saldo_conta': Number(saldoAntigo[0].saldo_conta) - Number(valorSaque),
                'dt_atualizacao_conta': dataAtual,
            })
             // Atualização da tabela Ativos
                // Caixa
                const ativoCaixa = await knex('Ativos')
                .where('cod_plantacao', Number(local('plantacao')))
                .where('nome_ativo', 'CAIXA - ' + dataAtual.getFullYear())
                .select()
    
                await knex('Ativos')
                .where('cod_ativo', ativoCaixa[0].cod_ativo)
                .update({
                    'valor_ativo': Number(ativoCaixa[0].valor_ativo) + Number(valorSaque),
                })
                    // Banco
                
                const ativoBanco = await knex('Ativos')
                .where('cod_plantacao', Number(local('plantacao')))
                .where('nome_ativo', 'BANCO - ' + dataAtual.getFullYear())
                .select()
    
                if(ativoBanco.length == 0){
                    await knex('Ativos')
                    .insert({
                        'cod_plantacao': Number(local('plantacao')),
                        'cod_balanco': ativoCaixa[0].cod_balanco,
                        'tipo_ativo': 'ATIVO CIRCULANTE',
                        'nome_ativo': 'BANCO - ' +  dataAtual.getFullYear(),
                        'valor_ativo': valorSaque,
                        'data_ativo': dataAtual,
                    })
                } else {
                    await knex('Ativos')
                    .where('cod_ativo', ativoBanco[0].cod_ativo)
                    .update({
                        'valor_ativo': Number(ativoBanco[0].valor_ativo) - Number(valorSaque),
                        'data_ativo': dataAtual,
                    })
                }
    
                const ativos = await apresentarAtivoCirculanete()
    
                const tamanhoAtivo = ativos.length
    
                return  res.render('Balanco/ativoCirculante.html', {ativos, totalAtivo, tamanhoAtivo})
               
        } catch (error) {
            nex(error)
        }
    },
    
    async escolherContaDeposido(req, res, nex){
        try {
            const contas = await knex('Contas')
            .where('cod_plantacao', Number(local('plantacao')))
            .where('status_conta', 1)
            .select()

            var ativos = await knex('Ativos')
            .where('tipo_ativo', 'ATIVO CIRCULANTE')
            .where('nome_ativo', 'CAIXA - ' +  dataAtual.getFullYear())
            .whereBetween('data_ativo', [dataInicio, dataAtual])
            .select('valor_ativo')

            const minimoDeposito = ativos[0].valor_ativo;

            return  res.render('Balanco/escolherContaDeposito.html', {contas, minimoDeposito})
        } catch (error) {
            nex(error)
        }
    },
    async deposito(req, res, nex){
        try {

            const {
                codConta,
                valorDeposito,
            } = req.body
            const valorAntigo = await knex('Contas')
            .where('cod_conta', codConta)
            .select()

            //Atualização da tabela Contas
            await knex('Contas')
            .where('cod_conta', codConta)
            .update({
                'saldo_conta': Number(valorAntigo[0].saldo_conta) + Number(valorDeposito),
                'dt_atualizacao_conta': dataAtual,
            })

            // Atualização da tabela Ativos
                // Caixa - 2020
            const ativoCaixa = await knex('Ativos')
            .where('cod_plantacao', Number(local('plantacao')))
            .where('nome_ativo', 'CAIXA - ' + dataAtual.getFullYear())
            .select()

            await knex('Ativos')
            .where('cod_ativo', ativoCaixa[0].cod_ativo)
            .update({
                'valor_ativo': ativoCaixa[0].valor_ativo - valorDeposito,
            })
                // Banco - 2020
            
            const ativoBanco = await knex('Ativos')
            .where('cod_plantacao', Number(local('plantacao')))
            .where('nome_ativo', 'BANCO - ' + dataAtual.getFullYear())
            .select()

            if(ativoBanco.length == 0){
                await knex('Ativos')
                .insert({
                    'cod_plantacao': Number(local('plantacao')),
                    'cod_balanco': ativoCaixa[0].cod_balanco,
                    'tipo_ativo': 'ATIVO CIRCULANTE',
                    'nome_ativo': 'BANCO - ' +  dataAtual.getFullYear(),
                    'valor_ativo': valorDeposito,
                    'data_ativo': dataAtual,
                })
            } else {
                await knex('Ativos')
                .where('cod_ativo', ativoBanco[0].cod_ativo)
                .update({
                    'valor_ativo': Number(ativoBanco[0].valor_ativo) + Number(valorDeposito),
                    'data_ativo': dataAtual,
                })
            }

            const ativos = await apresentarAtivoCirculanete()

            const tamanhoAtivo = ativos.length

            return  res.render('Balanco/ativoCirculante.html', {ativos, totalAtivo, tamanhoAtivo}) 
        } catch (error) {
            nex(error)
        }
    },
    
    async escolherContaTransferencia(req, res, nex){
        try {
            const contas = await knex('Contas')
            .where('cod_plantacao', Number(local('plantacao')))
            .where('status_conta', 1)
            .whereNot('saldo_conta', 0)
            .select()

            return  res.render('Balanco/escolherContaTransferencia.html', {contas})
        } catch (error) {
            nex(error)
        }
    },
    async escolherValorTransferencia(req, res, nex){
        try {
            const {
                codConta
            } = req.body;
            
            cod_conta = codConta

            const conta1 = await knex('Contas')
            .where('cod_conta', codConta)
            .select()

            const conta = 'CONTA ' + conta1[0].tipo_conta +' '+ conta1[0].nome_banco
            const maximaTransferencia = conta1[0].saldo_conta;

            const contas = await knex('Contas')
            .where('cod_plantacao', Number(local('plantacao')))
            .where('status_conta', 1)
            .whereNot('cod_conta', codConta)
            .select()

            return  res.render('Balanco/escolherContaTransferenciaII.html', {conta, maximaTransferencia, contas})
        } catch (error) {
            nex(error)
        }
    },
    async transferencia(req, res, nex){
        try {
            const {
                valorTransferir,
                codConta,
            } = req.body

            // Atualizar no Banco Destino
            var valor = await knex('Contas')
            .where('cod_conta', codConta)
            .select()

            await knex('Contas')
            .where('cod_conta', codConta)
            .update({
                'saldo_conta': Number(valor[0].saldo_conta) + Number(valorTransferir),
                'dt_atualizacao_conta': dataAtual,
            })

            // Atualizar no Banco Origem
            valor = await knex('Contas')
            .where('cod_conta', cod_conta)
            .select()

            await knex('Contas')
            .where('cod_conta', cod_conta)
            .update({
                'saldo_conta': Number(valor[0].saldo_conta) - Number(valorTransferir),
                'dt_atualizacao_conta': dataAtual,
            })

            const ativos = await apresentarAtivoCirculanete()

            const tamanhoAtivo = ativos.length

            return  res.render('Balanco/ativoCirculante.html', {ativos, totalAtivo, tamanhoAtivo})
           

        } catch (error) {
            nex(error)
        }
    },

    // Função de apresentação Ativos Permanente
    async ativoPermanente(req,res, next) {
        try {
            const ativos = await knex('Ativos')
            .where('tipo_ativo', 'ATIVO PERMANENTE')
            .whereBetween('data_ativo', [dataInicio, dataAtual])
            .select()
            var totalAtivo = 0
            for (let index = 0; index < ativos.length; index++) {
                var dataAtivo = new Date(ativos[index].data_ativo)      
                
                ativos[index].data_ativo = dataAtivo.getDate() + '-' + (dataAtivo.getMonth() + 1) + '-' + dataAtivo.getFullYear()
                
                totalAtivo = totalAtivo + Number(ativos[index].valor_ativo)
            }

            return  res.render('Balanco/ativoPermanente.html', {ativos, totalAtivo})
        } catch (error) {
            return next(error)
        }
        
    },

    // Função de apresentação Passivo Circulantes
    async passivoCirculante(req,res, next) {
        try {

            const passivos = await knex('Passivos')
            .where('tipo_passivo', 'PASSIVO CIRCULANTE')
            .whereBetween('data_passivo', [dataInicio, dataAtual])
            .select()
            var totalPassivo = 0
            for (let index = 0; index < passivos.length; index++) {
                var dataPassivo = new Date(passivos[index].data_passivo)      
                
                passivos[index].data_passivo = dataPassivo.getDate() + '-' + (dataPassivo.getMonth() + 1) + '-' + dataPassivo.getFullYear()
                
                totalPassivo = totalPassivo + Number(passivos[index].valor_passivo)
            }

            return  res.render('Balanco/passivoCirculante.html', {passivos, totalPassivo})
        } catch (error) {
            return next(error)
        }
        
    },

    // Função de apresentação Passivo Permanente
    async passivoPermanente(req,res, next) {
        try {

            const passivos = await knex('Passivos')
            .where('tipo_passivo', 'PASSIVO PERMANENTE')
            .whereBetween('data_passivo', [dataInicio, dataAtual])
            .select()
            var totalPassivo = 0
            for (let index = 0; index < passivos.length; index++) {
                var dataPassivo = new Date(passivos[index].data_passivo)      
                
                passivos[index].data_passivo = dataPassivo.getDate() + '-' + (dataPassivo.getMonth() + 1) + '-' + dataPassivo.getFullYear()
                
                totalPassivo = totalPassivo + Number(passivos[index].valor_passivo)
            }

            return  res.render('Balanco/passivoPermanente.html', {passivos, totalPassivo})
        } catch (error) {
            return next(error)
        }
        
    },

   
}