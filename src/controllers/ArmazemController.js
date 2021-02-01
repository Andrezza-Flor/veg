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
var cod_posicao = 0
module.exports = {
    async cadastrarEntrada(req, res, next) {
        try {
            const {
                quantidadeColida,
                validadeHortalica,
            } = req.body

            const codPoducao = req.params.id

            const producao = await knex('Producoes')
            .where('cod_producao', codPoducao)
            .join('Planos_Producao', 'Planos_Producao.cod_plano', '=', 'Producoes.cod_plano')
            .select(
                'Producoes.objetivo_producao',
                'Producoes.cod_plantacao',
                'Producoes.cod_producao',
                'Planos_Producao.cod_hortalica',
            )

            await knex('Armazens')
            .insert({
                'contrato_venda': producao[0].objetivo_producao,
                'cod_plantacao': producao[0].cod_plantacao,
                'cod_producao': producao[0].cod_producao,
                'cod_hortalica': producao[0].cod_hortalica,
                'quantidade_hortalica': quantidadeColida,
                'validade_hortalica': validadeHortalica,
                'status_hortalica': 'ARMAZENADO',
            })

            await knex('Producoes')
            .where('cod_producao', codPoducao)
            .update({
                'status_producao': 'FECHADA'
            })

            const listaArmazem = await knex('Armazens')
            .where('Armazens.cod_plantacao', Number(local('plantacao')))
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
                'Armazens.contrato_venda',
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

                if (listaArmazem[index].contrato_venda > 0){
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
                'Armazens.contrato_venda',
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

                if(itemArmazem[0].contrato_venda == 0){
                    produto.destino = 'LIBERADO PARA VENDA IMEDIATA'
                } else {
                    const cliente = await knex('Armazens')
                    .where('cod_posicao', codPosicao)
                    .join('Itens_Venda', 'Itens_Venda.cod_venda', '=', 'Armazens.contrato_venda')
                    .join('Vendas', 'Vendas.cod_venda', '=', 'Itens_Venda.cod_venda')
                    .join('Clientes', 'Clientes.cod_cliente', 'Vendas.cod_Cliente')
                    .select('Clientes.nome_cliente')
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
                'Armazens.contrato_venda',
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

                if (listaArmazem[index].contrato_venda > 0){
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