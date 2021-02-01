const knex = require('../database')
const e = require('express');
const local = require('local-storage');

var itensVenda = []
var planos = []
var infoPlano = {}
var itensPlano = []
var tamanhoProducao = 0
var producoes = []

async function buscarInsumos(plano, quantidade, objetivo) {
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
        'objetivo': objetivo,
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

async function varreduraProducao(){

    const listaProducao = await knex('Producoes')
    .where('cod_plantacao', Number(local('plantacao')))
    .where('status_producao', 'ABERTA')
    .select()

    for (var index = 0; index < listaProducao.length; index++) {
        const now = new Date(); // Data de hoje
        const past = new Date(listaProducao[index].dt_inicio); // Outra data no passado
        const diff = Math.abs(now.getTime() - past.getTime()); // Subtrai uma data pela outra
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24)); 

        // Atualizar os dias de produção.
        await knex('Producoes')
        .where('cod_producao', listaProducao[index].cod_producao)
        .update({
            'dias_producao': days,
        })

        // Atualizar os status das Itens_Producao
        const listaItens = await knex('Itens_Producao')
        .where('cod_producao', listaProducao[index].cod_producao)
        .whereNot('status_aplicacao', 'REALIZADA')
        .select()

        for (var j = 0; j < listaItens.length; j++) {
            const diaAplicacao = new Date(listaItens[j].data_aplicacao)
            if(diaAplicacao < now) {
                await knex('Itens_Producao')
                .where('cod_acao', listaItens[j].cod_acao)
                .update({
                    'status_aplicacao': 'ATRASADO',
                })
            }       
        }
    }

    const arrayListaProducao = await knex('Producoes')
    .where('Producoes.cod_plantacao', Number(local('plantacao')))
    .whereNot('status_producao', 'FECHADA')
    .join('Planos_Producao', 'Planos_Producao.cod_plano', '=', 'Producoes.cod_plano')
    .join('Hortalicas', 'Hortalicas.cod_hortalica', '=', 'Planos_Producao.cod_hortalica')
    .select(
        'Producoes.cod_producao',
        'Producoes.dias_producao',
        'Planos_Producao.nome_plano'
    )
        
    producoes = []
    var unidadeProducao;

    for (var i = 0; i < arrayListaProducao.length; i++) {

        var item = await knex('Itens_Producao')
        .where('cod_producao', arrayListaProducao[i].cod_producao)
        .where('status_aplicacao', 'ATRASADO')
        .join('Insumos', 'Insumos.cod_insumo', '=', 'Itens_Producao.cod_item')
        .select()
        

        if (item.length == 0){
            item = await knex('Itens_Producao')
            .where('cod_producao', arrayListaProducao[i].cod_producao)
            .where('status_aplicacao', 'NÃO REALIZADA')
            .join('Insumos', 'Insumos.cod_insumo', '=', 'Itens_Producao.cod_item')
            .select()

            if (item.length == 0) {
                item = await knex('Itens_Producao')
                .where('cod_producao', arrayListaProducao[i].cod_producao)
                .where('status_aplicacao', 'REALIZADA')
                .join('Insumos', 'Insumos.cod_insumo', '=', 'Itens_Producao.cod_item')
                .select()

                unidadeProducao = {
                    'nome_plano': arrayListaProducao[i].nome_plano,
                    'dias_producao': arrayListaProducao[i].dias_producao,
                    'proxima_etapa': 'COLHER HORTALIÇA',
                    'situacao': 'AGUARDANDO FINALIZAR',
                    'rota': '/colherHortalica/' + arrayListaProducao[i].cod_producao
                }
            } else {
                unidadeProducao = {
                    'nome_plano': arrayListaProducao[i].nome_plano,
                    'dias_producao': arrayListaProducao[i].dias_producao,
                    'proxima_etapa': item[0].nome_insumo,
                    'quantidade': item[0].quantidade_item,
                    'contagem_item': item[0].contagem_item,
                    'situacao': 'EM DIA',
                    'rota': '/acessarProducao/' + arrayListaProducao[i].cod_producao
                }
            }
                    
        } else {
            unidadeProducao = {
                'nome_plano': arrayListaProducao[i].nome_plano,
                'dias_producao': arrayListaProducao[i].dias_producao,
                'proxima_etapa': item[0].nome_insumo,
                'quantidade': item[0].quantidade_item,
                'contagem_item': item[0].contagem_item,
                'situacao': 'ATRASADA',
                'rota': '/acessarProducao/' + arrayListaProducao[i].cod_producao
            }
        }
                
        producoes.push(unidadeProducao)
               
    }
    
    tamanhoProducao = producoes.length
            
}

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
                    
                    await buscarInsumos(plano, quantidade, objetivo)
                    
                    return res.render('Producao/resultadoProducao.html', {itensPlano, infoPlano})


                } else {
                    
                    return res.render('Producao/criarProducao.html', {itensVenda, planos, mensagem})
                }
            
            } else if(objetivo == 1){  // Significa que vai fazer itens_Venda
                if(itemVenda > 0){
                    
                    // Busca do Plano e da quantidade
                    const arrayItemVenda = await knex('Itens_Venda')
                    .where('cod_item', Number(itemVenda))
                    .select('cod_plano', 'quantidade_produto')

                    const cod_plano = arrayItemVenda[0].cod_plano
                    const quantidade_produto = arrayItemVenda[0].quantidade_produto

                    await buscarInsumos(cod_plano, quantidade_produto, itemVenda)
                    
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
                'objetivo_producao': infoPlano.objetivo
            })

            const arrayProducoes = await knex('Producoes')
            .where('cod_plantacao', Number(local('plantacao')))
            .where('cod_plano', infoPlano.cod_plano)
            .select()

            const codProducao = arrayProducoes[arrayProducoes.length -1].cod_producao

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

            // Preparação da tela de apresentação das producao
            await varreduraProducao()

            
            return  res.render('Producao/plantacao.html', {producoes, tamanhoProducao})

        } catch (error) {
            next(error)
        }
        
    },

    async informarProducar (req, res, next) {
        try {
            const codProducao =  req.params.id;

            const infoProducao = await knex('Producoes')
            .where('Producoes.cod_plantacao', Number(local('plantacao')))
            .where('cod_producao', codProducao)
            .join('Planos_Producao', 'Planos_Producao.cod_plano', '=', 'Producoes.cod_plano')
            .join('Hortalicas', 'Hortalicas.cod_hortalica', '=', 'Planos_Producao.cod_hortalica')
            .select(
                'Producoes.quantidade_hortalica',
                'Planos_Producao.contagem_hortalica',
                'Hortalicas.nome_hortalica',
                'Producoes.dt_inicio',
                'Producoes.dt_termino',
            )

            const dataInicio = new Date (infoProducao[0].dt_inicio)
            const dataTermino = new Date(infoProducao[0].dt_termino)

            const producao = {
                'quantidade_hortalica': infoProducao[0].quantidade_hortalica,
                'contagem_hortalicao': infoProducao[0].contagem_hortalica,
                'nome_hortalica': infoProducao[0].nome_hortalica,
                'data_inicio': dataInicio.getDate() + ' ' + nomeDosMesesAbre[dataInicio.getMonth()] + ' ' + dataInicio.getFullYear(),
                'data_termino': dataTermino.getDate() + ' ' + nomeDosMesesAbre[dataTermino.getMonth()] + ' ' + dataTermino.getFullYear(),
            }

            const itensProducao = await knex('Itens_Producao')
            .where('cod_producao', codProducao)
            .where('tipo_produto', 'INSUMO')
            .join('Insumos', 'Insumos.cod_insumo', 'Itens_Producao.cod_item')
            .join('Produtos', 'Produtos.cod_produto', 'Insumos.cod_insumo')
            .orderBy('Itens_Producao.data_aplicacao')

            var listaItens = []
            const now = new Date()

            for (let index = 0; index < itensProducao.length; index++) {
                
                const sitCeleiro = await knex('Celeiros')
                .where('Celeiros.cod_plantacao', Number(local('plantacao')))
                .where('Celeiros.cod_item', itensProducao[index].id_produto)
                .whereBetween('Celeiros.quantidade_item', [itensProducao[index].quantidade_item, 9999999999.99])
                .join('Produtos', 'Produtos.id_produto', '=', 'Celeiros.cod_item')
                .join('Insumos', 'Insumos.cod_insumo', 'Produtos.id_produto')
                .select()

                const aplicacao = new Date(itensProducao[index].data_aplicacao)
                var item = {
                    'nome_insumo': itensProducao[index].nome_insumo,
                    'quantidade_insumo':(itensProducao[index].quantidade_item).toFixed(2),
                    'data_aplicacao': aplicacao.getDate() + ' ' + nomeDosMesesAbre[aplicacao.getMonth()] + ' ' + aplicacao.getFullYear(),
                    'situacao': itensProducao[index].status_aplicacao,
                    'contagem_item': itensProducao[index].contagem_item,
                }

                if (itensProducao[index].status_aplicacao == 'ATRASADO' || aplicacao == now) {
                    if(sitCeleiro.length > 0) {
                        item.situacao_celeiro = '';
                        item.aplicar = 1;
                        item.rota_aplicar = '/aplicarInsumo/' + itensProducao[index].cod_acao;
                    } else {
                        item.situacao_celeiro = 'falta';
                        item.aplicar = 0;
                        item.rota_aplicar = 'FALTA';
                    }
                    
                }else if(itensProducao[index].status_aplicacao == 'NÃO REALIZADA'){
                    item.aplicar = 0;

                    if(sitCeleiro.length == 0) {
                        item.situacao_celeiro = 'falta';
                        item.rota_aplicar = 'FALTA';
                    }
                } else {
                    item.rota_aplicar = 'OKAY';

                }

                listaItens.push(item)                               
            }

            return res.render('Producao/infoProducao.html', {producao, listaItens})

        } catch (error) {
            next(error)
        }
    },

    async aplicarInsumo (req, res, next){
        try {

            const codAcao =  req.params.id;

            // atualizar o status dos Itens_Producao
            await knex('Itens_Producao')
            .where('cod_acao', codAcao)
            .update({
                'status_aplicacao': 'REALIZADA',
            })
            // atualizar a quantidade do Celeiros

            const quantidade = await knex('Itens_Producao')
            .where('cod_acao', codAcao)
            .join('Produtos', 'Produtos.cod_produto', '=', 'Itens_Producao.cod_item')
            .where('Produtos.tipo_produto', 'INSUMO')
            .select()
            
            const itemCeleiro = await knex(('Celeiros'))
            .where('Celeiros.cod_plantacao', Number(local('plantacao')))
            .where('cod_item', quantidade[0].id_produto)
            .whereBetween('quantidade_item', [quantidade[0].quantidade_item, 999999999.99])
            .select('Celeiros.quantidade_item', 'Celeiros.cod_posicao')
            
            await knex('Celeiros')
            .where('cod_posicao', itemCeleiro[0].cod_posicao)
            .update({
                'quantidade_item': itemCeleiro[0].quantidade_item - quantidade[0].quantidade_item
            })

            // Preparação da tela de apresentação das producao
            await varreduraProducao()

            return  res.render('Producao/plantacao.html', {producoes, tamanhoProducao})

        } catch (error) {
            next(error)
        }
    },

    async colherHortalica(req, res, next){
        try {
            const codProducao =  req.params.id;

            const producoes = await knex('Producoes')
            .where('cod_producao', codProducao)
            .join('Planos_Producao', 'Planos_Producao.cod_plano', '=', 'Producoes.cod_plano')
            .join('Hortalicas', 'Hortalicas.cod_hortalica', 'Planos_Producao.cod_hortalica')
            .select()

            const now = new Date()

            const producao = {
                'nome_hortalica': producoes[0].nome_hortalica,
                'dias_producao': producoes[0].dias_producao,
                'contagem_hortalica': producoes[0].contagem_hortalica,
                'rota_registro': '/entradaArmazem/' + codProducao,
            }

            return res.render('Armazem/detalharEntrada.html', {producao})
        } catch (error) {
            next(error)
        }
    },
}   