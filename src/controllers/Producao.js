const knex = require('../database')
const e = require('express');
const local = require('local-storage');

var itensVenda = []
var planos = []
var infoPlano = {}
var itensPlano = []

async function buscarInsumos(plano, quantidade) {
    const arrayPlano = await knex('Planos_Producao')
    .where('cod_plantacao', Number(local('plantacao')))
    .where('cod_plano', Number(plano))
    .join('Hortalicas', 'Hortalicas.cod_hortalica', '=', 'Planos_Producao.cod_hortalica')
    .select()

    var area = Number(arrayPlano[0].area_terreno) / Number(arrayPlano[0].quantidade_hortalica) * Number(quantidade)

    let dt_termino = new Date(); 

            dt_termino.setDate(dt_termino.getDate() + Number(arrayPlano[0].dias_producao));

    infoPlano = {
        'cod_plano': arrayPlano[0].cod_plano,
        'nome_plano': arrayPlano[0].nome_plano,
        'dias_producao': arrayPlano[0].dias_producao,
        'dt_termino': dt_termino,
        'area': area,
        'nome_hortalica': arrayPlano[0].nome_hortalica,
        'quantidade': quantidade,
        'contagem_hortalica': arrayPlano[0].contagem_hortalica,

    }

    const itemPlano = await knex('Itens_Plano')
    .where('Itens_Plano.cod_plano', Number(plano))
    .join('Planos_Producao', 'Planos_Producao.cod_plano', '=', 'Itens_Plano.cod_plano')
    .join('Insumos', 'Insumos.cod_insumo', '=', 'Itens_Plano.cod_item')
    .select()

    itensPlano = []
    var item

    for (var i = 0; i < itemPlano.length; i++) {
        var quantidadeInsumo =  Number(itemPlano[i].quantidade_item) / Number(arrayPlano[0].quantidade_hortalica) * Number(quantidade)

        var itemCeleiro = await knex('Celeiros')
        .where('Celeiros.cod_plantacao', Number(local('plantacao')))
        .where('cod_item', itemPlano[i].cod_item)
        .whereBetween('quantidade_item', [quantidadeInsumo, 9999999999.99])
        .select()                      

        if(itemCeleiro.length >= 1){
            item = {
                'cod_item': itemPlano[i].cod_insumo,
                'nome_insumo': itemPlano[i].nome_insumo,
                'quantidade_item': quantidadeInsumo,
                'quantidade_insumo': itemCeleiro[0].quantidade_item,
                'contagem_item':itemPlano[i].contagem_item,
                'status_item': 'suficiente',
            }
        } else {
            itemCeleiro = await knex('Celeiros')
            .where('Celeiros.cod_plantacao', Number(local('plantacao')))
            .where('cod_item', itemPlano[i].cod_item)
            .select()    

            if(itemCeleiro.length >= 1){
                item = {
                    'cod_item': itemPlano[i].cod_insumo,
                    'nome_insumo': itemPlano[i].nome_insumo,
                    'quantidade_item': quantidadeInsumo,
                    'quantidade_insumo': itemCeleiro[0].quantidade_item,
                    'contagem_item':itemPlano[i].contagem_item,
                    'status_item': 'insuficiente',
                }
            } else {
                item = {
                    'cod_item': itemPlano[i].cod_insumo,
                    'nome_insumo': itemPlano[i].nome_insumo,
                    'quantidade_item': quantidadeInsumo,
                    'quantidade_insumo': 0,
                    'contagem_item':itemPlano[i].contagem_item,
                    'status_item': 'falta',
                }
            }
        }

        itensPlano.push(item)

    }
}

module.exports = {
     // Plantar
     async criarProducao(req,res, next) {
        try {

            itensVenda = []
            planos = []

            itensVenda = await knex('Itens_Venda')
            .where('Vendas.cod_plantacao', Number(local('plantacao')))
            .where('status_venda', 'ABERTO')
            .join('Vendas', 'Vendas.cod_venda', '=', 'Itens_Venda.cod_venda')
            .join('Planos_Producao', 'Planos_Producao.cod_plano', '=', 'Itens_Venda.cod_plano')
            .join('Clientes', 'Clientes.cod_cliente', '=', 'Vendas.cod_cliente')
            .join('Hortalicas', 'Hortalicas.cod_hortalica', '=', 'Planos_Producao.cod_hortalica')
            .orderBy('Vendas.dt_entrega')
            .select(
                'Itens_Venda.cod_item',
                'Itens_Venda.quantidade_produto',
                'Planos_Producao.contagem_hortalica',
                'Hortalicas.nome_hortalica',
                'Clientes.nome_cliente',
            )
            
            planos = await knex('Planos_Producao')
            .where('Planos_Producao.cod_plantacao', Number(local('plantacao')))
            .join('Hortalicas', 'Hortalicas.cod_hortalica', '=', 'Planos_Producao.cod_hortalica')
            .select(
                'Planos_Producao.cod_plano',
                'Planos_Producao.nome_plano',
                'Planos_Producao.contagem_hortalica',
                'Hortalicas.nome_hortalica'
            )
        
            return  res.render('Producao/criarProducao.html', {itensVenda, planos})
        } catch (error) {
            next(error)
        }
        
    },

    async apresentarProducao(req,res, next) {
        try {
            const {
                objetivo,
                itemVenda,
                plano,
                quantidade,
            } = req.body
            var mensagem = "Dados Inválidos"

            // Verificação dos dados
            if (objetivo == 0 ) {  // Significa que não vai fazer itens_Venda
                if(plano > 0 && quantidade > 0) {
                    
                    await buscarInsumos(plano, quantidade)
                    
                    return res.render('Producao/resultadoProducao.html', {itensPlano, infoPlano})


                } else {
                    
                    return res.render('Producao/criarProducao.html')
                }
            
            } else if(objetivo == 1){  // Significa que vai fazer itens_Venda
                if(itemVenda > 0){
                    
                    // Busca do Plano e da quantidade
                    const arrayItemVenda = await knex('Itens_Venda')
                    .where('cod_item', Number(itemVenda))
                    .select('cod_plano', 'quantidade_produto')

                    const cod_plano = arrayItemVenda[0].cod_plano
                    const quantidade_produto = arrayItemVenda[0].quantidade_produto

                    await buscarInsumos(cod_plano, quantidade_produto)
                    
                    return res.render('Producao/resultadoProducao.html', {itensPlano, infoPlano})


                } else {
                    return res.render('Producao/criarProducao.html', {itensVenda, planos, mensagem})
                }
            }
            
        } catch (error) {
            next(error)
        }
        
    },

    async cadastrarProducao(req,res, next) {
        try {
            
                        
            await knex('Producoes')
            .insert({
                'cod_plano': infoPlano.cod_plano,
                'cod_plantacao': Number(local('plantacao')),
                'dt_termino': infoPlano.dt_termino,
                'status_producao': 'ABERTA',
                'dias_producao': 0,
                'quantidade_hortalica': infoPlano.quantidade,
                'email_usuario': local('email'),
            })

            const producoes = await knex('Producoes')
            .where('cod_plantacao', Number(local('plantacao')))
            .where('cod_plano', infoPlano.cod_plano)
            .select()

            const codProducao = producoes[producoes.length -1].cod_producao

            const momentosAplicacao = await knex('Momentos_Aplicacao')
            .where('Momentos_Aplicacao.cod_plano', infoPlano.cod_plano)
            .select()

            const planos = await knex('Planos_Producao')
            .where('cod_plano', infoPlano.cod_plano)
            .select('quantidade_hortalica')

            const quant = planos[0].quantidade_hortalica

            var dataAplicacao = new Date()

            for (var i = 0; i < momentosAplicacao.length; i++) {
                dataAplicacao.setDate(dataAplicacao.getDate() + Number(momentosAplicacao[i].dia_aplicacao))

                for (var j = 0; j < itensPlano.length; j++) {
                    if(itensPlano[j].cod_item == momentosAplicacao[i].cod_item){
                        await knex('Itens_Producao')
                        .insert({
                            'cod_producao': codProducao,
                            'cod_item': momentosAplicacao[i].cod_item,
                            'quantidade_item': momentosAplicacao[j].quantidade_aplicacao / quant * infoPlano.quantidade,
                            'contagem_item': itensPlano[j].contagem_item,
                            'data_aplicacao': dataAplicacao,
                            'status_aplicacao': 'NÃO REALIZADA',
                        })
                    }                    
                }
                
            }

            const listaProducao = await knex('Producoes')
            .where('cod_plantacao', Number(local('plantacao')))
            .where('status_producao', 'ABERTA')
            .select()

            const tamanhoProducao = listaProducao.length
            
            return  res.render('Producao/plantacao.html', {listaProducao, tamanhoProducao})
        } catch (error) {
            next(error)
        }
        
    },
}   