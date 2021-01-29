const knex = require('../database')
const e = require('express');
const local = require('local-storage');
const { query } = require('express');
const { render, runtime } = require('nunjucks');
const { use, search, get } = require('../routes');
const { insert } = require('../database');


var codCompra = 0
var item = []
var listaItensI = []
var listaItensII = []
var tamanhoCeleiro = []

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

async function buscarFerramentasCompra() {
    
    const ferramentasCompras = await knex('Itens_Compra')
    .where('cod_compra', codCompra)
    .where('tipo_produto', 'FERRAMENTA')
    .join('Fornecedores', 'Fornecedores.cod_fornecedor', 'Itens_Compra.cod_fornecedor')
    .join('Produtos', 'Produtos.id_produto', 'Itens_Compra.cod_item')
    .join('Ferramentas', 'Ferramentas.cod_ferramenta', '=', 'Produtos.cod_produto')
    .select()

    return ferramentasCompras

}

async function buscarInsumosCompra() {
    
    const insumosCompras = await knex('Itens_Compra')
    .where('cod_compra', codCompra)
    .where('tipo_produto', 'INSUMO')
    .join('Fornecedores', 'Fornecedores.cod_fornecedor', 'Itens_Compra.cod_fornecedor')
    .join('Produtos', 'Produtos.id_produto', 'Itens_Compra.cod_item')
    .join('Insumos', 'Insumos.cod_insumo', '=', 'Produtos.cod_produto')
    .select()

    return insumosCompras
}

async function retornarCeleiro() {
    listaItensI = [];
    listaItensII = [];

    const listaInsumo = await knex('Celeiros')
    .where('cod_plantacao', Number(local('plantacao')))
    .where('Produtos.tipo_produto', 'INSUMO')
    .join('Produtos', 'Produtos.id_produto', '=', 'Celeiros.cod_item')
    .join('Insumos', 'Insumos.cod_insumo', '=', 'Produtos.cod_produto')
    .join('Fornecedores', 'Fornecedores.cod_fornecedor', '=', 'Celeiros.cod_fornecedor')
    .select()

    for (let index = 0; index < listaInsumo.length; index++) {
        var data = new Date(listaInsumo[index].validade_insumo)

        var item = {
            'rota': '/acessoItemCeleiro/'+listaInsumo[index].cod_posicao,
            'nome_item': listaInsumo[index].nome_insumo,
            'nome_fornecedor': listaInsumo[index].nome_fornecedor,
            'data_validade': data.getDate() + ' ' + nomeDosMesesAbre[data.getMonth()] + ' ' + data.getFullYear(),
            'quantidade_item': listaInsumo[index].quantidade_item,
            'contagem_item': listaInsumo[index].contagem_item,
        }    
                
        listaItensI.push(item);
                
    }
            
    const listaFerramenta = await knex('Celeiros')
    .where('cod_plantacao', Number(local('plantacao')))
    .where('Produtos.tipo_produto', 'FERRAMENTA')
    .join('Produtos', 'Produtos.id_produto', '=', 'Celeiros.cod_item')
    .join('Ferramentas', 'Ferramentas.cod_ferramenta', '=', 'Produtos.cod_produto')
    .join('Fornecedores', 'Fornecedores.cod_fornecedor', '=', 'Celeiros.cod_fornecedor')

    for (let index = 0; index < listaFerramenta.length; index++) {

        var item = {
            'rota': '/acessoItemCeleiro/'+listaFerramenta[index].cod_posicao,
            'nome_item': listaFerramenta[index].nome_ferramenta,
            'nome_fornecedor': listaFerramenta[index].nome_fornecedor,
            'quantidade_item': listaFerramenta[index].quantidade_item,
            'contagem_item': listaFerramenta[index].contagem_item,
        }    
                
        listaItensII.push(item);
                
    }

    tamanhoCeleiro = listaItensI.length + listaItensII.length;

}

module.exports = {
    // Função de apresentação de Celeiro
    async entrarItem(req, res, next) {
        try {

            codCompra = req.params.id;
            const rota_volta = '/apresentarCompra/' + codCompra

            const ferramentasCompras = await buscarFerramentasCompra();
            const insumosCompras = await buscarInsumosCompra();      
        
            return res.render('Celeiro/detalharEntrada.html', {rota_volta, ferramentasCompras, insumosCompras})
        } catch (error) {
            next(error)
        }
        
    },

    async cadastrarItem(req, res, next) {
        try {
            const {
                validade
            } = req.body

            const ferramentasCompras = await buscarFerramentasCompra();
            const insumosCompras = await buscarInsumosCompra();     

            var dtValidade = []

            if(Array.isArray(validade)){
                dtValidade = validade
            } else {
                dtValidade.push(validade)
            }

            for (let index = 0; index < ferramentasCompras.length; index++) {
                await knex('Celeiros')
                .insert({
                    'cod_plantacao': Number(local('plantacao')),
                    'cod_item': ferramentasCompras[index].cod_item,
                    'cod_compra': ferramentasCompras[index].cod_compra,
                    'cod_fornecedor': ferramentasCompras[index].cod_fornecedor,
                    'quantidade_item': ferramentasCompras[index].quantidade_item,
                    'contagem_item': ferramentasCompras[index].contagem_item,
                })
            }

            for (let index = 0; index < insumosCompras.length; index++) {
                await knex('Celeiros')
                .insert({
                    'cod_plantacao': Number(local('plantacao')),
                    'cod_item': insumosCompras[index].cod_item,
                    'cod_compra': insumosCompras[index].cod_compra,
                    'cod_fornecedor': insumosCompras[index].cod_fornecedor,
                    'quantidade_item': insumosCompras[index].quantidade_item,
                    'contagem_item': insumosCompras[index].contagem_item,
                    'validade_insumo': dtValidade[index],
                })
            }

            // Alterar o status da compra
            await knex('Compras')
            .where('cod_compra', codCompra)
            .update({
                'status_compra': 'FECHADA',
            })
            
                       
            var listaItensI = [];
            var listaItensII = [];

            const listaInsumo = await knex('Celeiros')
            .where('cod_plantacao', Number(local('plantacao')))
            .where('Produtos.tipo_produto', 'INSUMO')
            .join('Produtos', 'Produtos.id_produto', '=', 'Celeiros.cod_item')
            .join('Insumos', 'Insumos.cod_insumo', '=', 'Produtos.cod_produto')
            .join('Fornecedores', 'Fornecedores.cod_fornecedor', '=', 'Celeiros.cod_fornecedor')
            .select()

            for (let index = 0; index < listaInsumo.length; index++) {
                var data = new Date(listaInsumo[index].validade_insumo)

                var item = {
                    'rota': '/acessoItemCeleiro/'+listaInsumo[index].cod_posicao,
                    'nome_item': listaInsumo[index].nome_insumo,
                    'nome_fornecedor': listaInsumo[index].nome_fornecedor,
                    'data_validade': data.getDate() + ' ' + nomeDosMesesAbre[data.getMonth()] + ' ' + data.getFullYear(),
                    'quantidade_item': listaInsumo[index].quantidade_item,
                    'contagem_item': listaInsumo[index].contagem_item,
                }    
                
                listaItensI.push(item);
                
            }

            const listaFerramenta = await knex('Celeiros')
            .where('cod_plantacao', Number(local('plantacao')))
            .where('Produtos.tipo_produto', 'FERRAMENTA')
            .join('Produtos', 'Produtos.id_produto', '=', 'Celeiros.cod_item')
            .join('Ferramentas', 'Ferramentas.cod_ferramenta', '=', 'Produtos.cod_produto')
            .join('Fornecedores', 'Fornecedores.cod_fornecedor', '=', 'Celeiros.cod_fornecedor')

            
            for (let index = 0; index < listaFerramenta.length; index++) {

                var item = {
                    'rota': '/acessoItemCeleiro/'+listaFerramenta[index].cod_posicao,
                    'nome_item': listaFerramenta[index].nome_ferramenta,
                    'nome_fornecedor': listaFerramenta[index].nome_fornecedor,
                    'quantidade_item': listaFerramenta[index].quantidade_item,
                    'contagem_item': listaFerramenta[index].contagem_item,
                }    
                
                listaItensII.push(item);
                
            }

            const tamanhoCeleiro = listaItensI.length + listaItensII.length;

            return  res.render('Celeiro/celeiro.html', {listaItensI, listaItensII, tamanhoCeleiro})
        } catch (error) {
            next(error)
        }
        
    },
    async acessarItem(req, res, next) {
        try {
            const posicao = req.params.id;

            const celeiro = await knex('Celeiros')
            .where('cod_posicao', posicao)
            .join('Produtos', 'Produtos.id_produto', 'Celeiros.cod_item')
            .select('tipo_produto')

            var itemCeleiro 
            item = []

            if(celeiro[0].tipo_produto == 'INSUMO') {
                itemCeleiro = await knex('Celeiros')
                .where('cod_posicao', posicao)
                .join('Itens_Compra', 'Itens_Compra.cod_itemCompra', '=', 'Celeiros.cod_itemCompra')
                .join('Fornecedores', 'Fornecedores.cod_fornecedor', '=', 'Celeiros.cod_fornecedor')
                .join('Produtos', 'Produtos.id_produto', '=', 'Celeiros.cod_item')
                .join('Insumos', 'Insumos.cod_insumo', 'Produtos.cod_produto')
                .select(
                    'Insumos.nome_insumo',
                    'Celeiros.quantidade_item',
                    'Fornecedores.nome_fornecedor',
                    'Celeiros.contagem_item',
                    'Itens_Compra.valor_item',
                    'Celeiros.validade_insumo',
                    'Celeiros.cod_posicao',
                )
                item = itemCeleiro[0]
                item.nome_item = itemCeleiro[0].nome_insumo

                var validade = new Date(itemCeleiro[0].validade_insumo)
                var dataAtual = new Date()

                if (dataAtual > validade){
                    var mensagem = ' INSUMO VENCIDO'
                } else {
                    var mensagem = ''
                }

                item.validade_insumo = validade.getDate() + ' ' + nomeDosMesesAbre[validade.getMonth()] + ' ' + validade.getFullYear();
            } else if(celeiro[0].tipo_produto == 'FERRAMENTA') {
                itemCeleiro = await knex('Celeiros')
                .where('cod_posicao', posicao)
                .join('Itens_Compra', 'Itens_Compra.cod_itemCompra', '=', 'Celeiros.cod_itemCompra')
                .join('Fornecedores', 'Fornecedores.cod_fornecedor', '=', 'Celeiros.cod_fornecedor')
                .join('Produtos', 'Produtos.id_produto', '=', 'Celeiros.cod_item')
                .join('Ferramentas', 'Ferramentas.cod_ferramenta', 'Produtos.cod_produto')
                .select(
                    'Ferramentas.nome_ferramenta',
                    'Celeiros.quantidade_item',
                    'Fornecedores.nome_fornecedor',
                    'Celeiros.contagem_item',
                    'Itens_Compra.valor_item',
                    'Celeiros.cod_posicao',
                )
                item = itemCeleiro[0]
                item.validade = 0;
                item.nome_item = itemCeleiro[0].nome_ferramenta
            }
            item.quantidade_item = (item.quantidade_item).toFixed(2)
            item.valor_item = (item.valor_item).toFixed(2) 
            
            return res.render('Celeiro/infoItem.html', { item, mensagem })
        } catch (error) {
            next(error)
        }
        
    },

    async quantidadeInabilitar(req, res, next) {
        try {
            
            return res.render('Celeiro/inabilitarItem.html', {item})
        } catch (error) {
            next(error)
        }
    },

    async quantidadeVender(req, res, next) {
        try {
            return res.render('Celeiro/venderItem.html', {item})
        } catch (error) {
            next(error)
        }
    },

    async inabilitar(req, res, next) {
        try {
            const {
                quantidade,
            } = req.body

            // Tirar no Celeiro
            await knex('Celeiros')
            .where('cod_posicao', item.cod_posicao)
            .where('cod_plantacao', Number(local('plantacao')))
            .update({
                'quantidade_item': Number(item.quantidade_item) - Number(quantidade)
            })
            await knex('Celeiros')
            .where('cod_plantacao', Number(local('plantacao')))
            .where('quantidade_item', 0)
            .del()

            await retornarCeleiro()

            return  res.render('Celeiro/celeiro.html', {listaItensI, listaItensII, tamanhoCeleiro})

        } catch (error) {
            next(error)
        }
    },

    async vender(req, res, next) {
        try {
            const {
                quantidade,
                valor
            } = req.body

            // Tirar no Celeiro
            await knex('Celeiros')
            .where('cod_posicao', item.cod_posicao)
            .where('cod_plantacao', Number(local('plantacao')))
            .update({
                'quantidade_item': Number(item.quantidade_item) - Number(quantidade)
            })
            await knex('Celeiros')
            .where('cod_plantacao', Number(local('plantacao')))
            .where('quantidade_item', 0)
            .del()

            const dataAtual = new Date()

           // Criar Uma Entrada
            await knex('Entradas')
            .insert({
                'cod_plantacao': Number(local('plantacao')),
                'validade_entrada': dataAtual,
                'nome_entrada': 'VENDA ' + item.nome_item + ' ['+ quantidade + item.contagem_item +']',
                'valor_entrada': Number(valor),
            })

            await retornarCeleiro()

            return  res.render('Celeiro/celeiro.html', {listaItensI, listaItensII, tamanhoCeleiro})

        } catch (error) {
            next(error)
        }
    },
}