const knex = require('../database')
const e = require('express');
const local = require('local-storage');
const { query } = require('express');
const { render } = require('nunjucks');
const { use } = require('../routes');
const { where, insert } = require('../database');
const { armazem } = require('./MenuController');
const { detalheInsumo } = require('./CeleiroController');

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
var tamanhoArmazem = 0
var itensArmazem = []

async function apresentarArmazem () {
    const listaArmazem = await knex('Armazens')
    .where('Armazens.cod_plantacao', Number(local('plantacao')))
    .whereNot('status_hortalica', 'VENDIDO')
    .join('Hortalicas', 'Hortalicas.cod_hortalica', '=',  'Armazens.cod_hortalica')
    .join('Producoes', 'Producoes.cod_producao', '=', 'Armazens.cod_producao')
    .join('Planos_Producao', 'Planos_Producao.cod_plano', '=', 'Producoes.cod_plano')
    .select(
        'Hortalicas.nome_hortalica',
        'Planos_Producao.contagem_hortalica',
        'Producoes.objetivo_producao',
        'Armazens.quantidade_hortalica',
        'Armazens.validade_hortalica',
        'Armazens.destino_hortalica',
        'Armazens.cod_posicao'
    )

    itensArmazem = []

    for (let index = 0; index < listaArmazem.length; index++) {
        const validade = new Date(listaArmazem[index].validade_hortalica)

        var item = {
            'nome_hortalica': listaArmazem[index].nome_hortalica,
            'quantidade_hortalica': listaArmazem[index].quantidade_hortalica,
            'contagem_item': listaArmazem[index].contagem_hortalica,
            'data_validade': validade.getDate() + ' ' + nomeDosMesesAbre[validade.getMonth()] + ' ' + validade.getFullYear(),
            'rota': '/acessoItemArmazem/' + listaArmazem[index].cod_posicao
        }

        if (listaArmazem[index].destino_hortalica > 0){
            item.objetivo_producao = 'CONTRATO DE VENDA';
        } else {
            item.objetivo_producao = 'VENDAS FUTURAS';
        }

        itensArmazem.push(item)
               
    }

    tamanhoArmazem = listaArmazem.length
}

var cod_posicao = 0
module.exports = {
    async cadastrarEntrada(req, res, next) {
        try {
            const {
                quantidadeColida,
                validadeHortalica,
            } = req.body

            const codProducao = req.params.id

            const producao = await knex('Producoes')
            .where('cod_producao', codProducao)
            .join('Planos_Producao', 'Planos_Producao.cod_plano', '=', 'Producoes.cod_plano')
            .select(
                'Producoes.objetivo_producao',
                'Producoes.cod_plantacao',
                'Producoes.cod_producao',
                'Planos_Producao.cod_hortalica',
            )

            if (producao[0].objetivo_producao == 0) {
                await knex('Armazens')
                .insert({
                    'destino_hortalica': producao[0].objetivo_producao,
                    'cod_plantacao': Number(local('plantacao')),
                    'cod_producao': producao[0].cod_producao,
                    'cod_hortalica': producao[0].cod_hortalica,
                    'quantidade_hortalica': quantidadeColida,
                    'validade_hortalica': validadeHortalica,
                    'status_hortalica': 'LIVRE',
                })
            } else {

                const quantidade = await knex('Producoes')
                .where('cod_producao', codProducao)
                .join('Itens_Venda', 'Itens_Venda.cod_item', '=', 'Producoes.objetivo_producao')
                .select()

                const quantidadeProduzida = quantidade[0].quantidade_produzida
                const quantidadeTotal = quantidade[0].quantidade_produto
                const quantidadeFaltante = quantidadeTotal - quantidadeProduzida

                if(quantidadeFaltante < quantidadeColida) {
                    await knex('Itens_Venda')
                    .where('cod_item', producao[0].objetivo_producao)
                    .update({
                        'quantidade_produzida': quantidadeTotal,
                    })
                    var sobraColheita = quantidadeColida - quantidadeFaltante

                    await knex('Armazens')
                    .insert({
                        'destino_hortalica': 0,
                        'cod_plantacao': Number(local('plantacao')),
                        'cod_producao': producao[0].cod_producao,
                        'cod_hortalica': producao[0].cod_hortalica,
                        'quantidade_hortalica': sobraColheita,
                        'validade_hortalica': validadeHortalica,
                        'status_hortalica': 'LIVRE',
                    })

                    await knex('Armazens')
                    .insert({
                        'destino_hortalica': producao[0].objetivo_producao,
                        'cod_plantacao': Number(local('plantacao')),
                        'cod_producao': producao[0].cod_producao,
                        'cod_hortalica': producao[0].cod_hortalica,
                        'quantidade_hortalica': quantidadeFaltante,
                        'validade_hortalica': validadeHortalica,
                        'status_hortalica': 'RESERVADA',
                    })

                } else {

                    await knex('Itens_Venda')
                    .where('cod_item', producao[0].objetivo_producao)
                    .update({
                        'quantidade_produzida': quantidadeProduzida + quantidadeColida,
                    })

                    await knex('Armazens')
                    .insert({
                        'destino_hortalica': producao[0].objetivo_producao,
                        'cod_plantacao': Number(local('plantacao')),
                        'cod_producao': producao[0].cod_producao,
                        'cod_hortalica': producao[0].cod_hortalica,
                        'quantidade_hortalica': quantidadeColida,
                        'validade_hortalica': validadeHortalica,
                        'status_hortalica': 'RESERVADA',
                    })
                } 
            }
           

            // Atualização da producao para fechada
            await knex('Producoes')
            .where('cod_producao', codProducao)
            .update({
                'status_producao': 'FECHADA'
            })

            await apresentarArmazem()
             
            return  res.render('Armazem/armazem.html', {tamanhoArmazem, itensArmazem})
            
        } catch (error) {
            next(error)
        }
    },

    async acessarHortalica (req, res, next) {
        try {
            const codPosicao = req.params.id
            cod_posicao = codPosicao


            const itemArmazem = await knex('Armazens')
            .where('cod_posicao', codPosicao)
            .join('Hortalicas', 'Hortalicas.cod_hortalica', '=', 'Armazens.cod_hortalica')
            .join('Producoes', 'Producoes.cod_producao', '=', 'Armazens.cod_producao')
            .join('Planos_Producao', 'Planos_Producao.cod_plano', '=', 'Producoes.cod_plano')
            .select(
                'Armazens.cod_posicao',
                'Hortalicas.nome_hortalica',
                'Armazens.quantidade_hortalica',
                'Planos_Producao.contagem_hortalica',
                'Armazens.validade_hortalica',
                'Armazens.destino_hortalica',
            )
            const now = new Date ()
            const validade = new Date(itemArmazem[0].validade_hortalica)

            const produto = {
                'nome_hortalica': itemArmazem[0].nome_hortalica,
                'quantidade_hortalica': itemArmazem[0].quantidade_hortalica,
                'contagem_hortalica': itemArmazem[0].contagem_hortalica,
                'validade_hortalica': validade.getDate() + ' ' + nomeDosMesesAbre[validade.getMonth()] + ' ' + validade.getFullYear(),
            }
     

            var mensagem = ''

            if (validade < now) {
                produto.vencido = 1
                produto.destino = 'SEM DESTINO'
                mensagem = 'PRODUTO VENCIDO'
            } else {
                produto.vencido = 0

                if(itemArmazem[0].destino_hortalica == 0){
                    produto.destino = 'LIBERADO PARA VENDA IMEDIATA'
                } else {
                    const cliente = await knex('Armazens')
                    .where('cod_posicao', codPosicao)
                    .join('Itens_Venda', 'Itens_Venda.cod_item', '=', 'Armazens.destino_hortalica')
                    .join('Vendas', 'Vendas.cod_venda', '=', 'Itens_Venda.cod_venda')
                    .join('Clientes', 'Clientes.cod_cliente', 'Vendas.cod_Cliente')
                    .select()

                    produto.destino = 'RESERVADA PARA VENDA - ' + cliente[0].nome_cliente
                }

            }

            return res.render('Armazem/infoProduto.html', {produto, mensagem})

        } catch (error) {
            next(error)
        }
    },

    async apresentarDadosParaEdicao (req, res, next) {
        try {
            const produto = await knex('Armazens')
            .where('cod_posicao', cod_posicao)
            .join('Hortalicas', 'Hortalicas.cod_hortalica', '=', 'Armazens.cod_hortalica')
            .join('Producoes', 'Producoes.cod_producao', '=', 'Armazens.cod_producao')
            .join('Planos_Producao', 'Planos_Producao.cod_plano', '=', 'Producoes.cod_plano')
            .select(
                'Hortalicas.nome_hortalica',
                'Armazens.quantidade_hortalica',
                'Planos_Producao.contagem_hortalica',
            )

            return res.render('Armazem/edicaoProduto.html', {produto})
        } catch (error) {
            next(error)
        }
    }, 

    async salvarDados (req, res, next) {
        try {
            const {
                quantidade,
                validade,
            } = req.body

            if (quantidade != '') {
                await knex('Armazens')
                .where('cod_posicao', cod_posicao)
                .update({
                    'quantidade_hortalica': quantidade
                })
            }

            if(validade != '') {
                await knex('Armazens')
                .where('cod_posicao', cod_posicao)
                .update({
                    'validade_hortalica': validade
                })
            }
            
            const listaArmazem = await knex('Armazens')
            .where('Armazens.cod_plantacao', Number(local('plantacao')))
            .whereNot('Armazens.quantidade_hortalica', 0)
            .where('status_hortalica', 'ARMAZENADO')
            .join('Hortalicas', 'Hortalicas.cod_hortalica', '=',  'Armazens.cod_hortalica')
            .join('Producoes', 'Producoes.cod_producao', '=', 'Armazens.cod_producao')
            .join('Planos_Producao', 'Planos_Producao.cod_plano', '=', 'Producoes.cod_plano')
            .select(
                'Hortalicas.nome_hortalica',
                'Planos_Producao.contagem_hortalica',
                'Producoes.objetivo_producao',
                'Armazens.quantidade_hortalica',
                'Armazens.validade_hortalica',
                'Armazens.destino_hortalica',
                'Armazens.cod_posicao'
            )

            var itensArmazem = []

            for (let index = 0; index < listaArmazem.length; index++) {
                const validade = new Date(listaArmazem[index].validade_hortalica)

                var item = {
                    'nome_hortalica': listaArmazem[index].nome_hortalica,
                    'quantidade_hortalica': listaArmazem[index].quantidade_hortalica,
                    'contagem_item': listaArmazem[index].contagem_hortalica,
                    'data_validade': validade.getDate() + ' ' + nomeDosMesesAbre[validade.getMonth()] + ' ' + validade.getFullYear(),
                    'rota': '/acessoItemArmazem/' + listaArmazem[index].cod_posicao
                }

                if (listaArmazem[index].destino_hortalica > 0){
                    item.objetivo_producao = 'CONTRATO DE VENDA';
                } else {
                    item.objetivo_producao = 'VENDAS FUTURAS';
                }

                itensArmazem.push(item)
               
            }

             const tamanhoArmazem = listaArmazem.length
             
            return  res.render('Armazem/armazem.html', {tamanhoArmazem, itensArmazem})

        } catch (error) {
            next(error)
        }
    },   
}