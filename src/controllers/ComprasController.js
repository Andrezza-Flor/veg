const knex = require('../database')
const e = require('express');
const local = require('local-storage');
const { query } = require('express');
const { render, runtime } = require('nunjucks');
const { use, search } = require('../routes');
const { insert } = require('../database');

var fornecedorInsumo = []
var fornecedorFerramenta = []
var listaCompra = []

async function eliminarReptidos(array) {
    for (var i = 0; i < array.length; i++) {
        for (var j = i+1; j < array.length; j++) {
            if(array[i].id_produto == array[j].id_produto){
                array.splice(j, 1);
                j--
            }
            
        }
    }

    return array
}

async function buscarInsumo(insumo) {
   
    for (let index = 0; index < (insumo.length - 1); index++) {
        var arrayInsumo = await knex('Fornecedores_Produtos')
        .where('cod_plantacao', Number(local('plantacao')))
        .where('Produtos.id_produto', Number(insumo[index]))
        .join('Fornecedores', 'Fornecedores.cod_fornecedor', '=', 'Fornecedores_Produtos.cod_fornecedor')
        .join('Produtos', 'Produtos.id_produto', '=', 'Fornecedores_Produtos.id_produto')
        .join('Insumos', 'Insumos.cod_insumo', '=', 'Produtos.cod_produto')
        .select()

        var itemInsumo = {
            'id_produto': arrayInsumo[0].id_produto,
            'nome_produto': arrayInsumo[0].nome_insumo,
            'fornecedor': [],
        }
        for (let j = 0; j < arrayInsumo.length; j++) {
            var fornecedor = {
                'cod_fornecedor': arrayInsumo[j].cod_fornecedor,
                'nome_fornecedor': arrayInsumo[j].nome_fornecedor,
                'qualidade_produto': arrayInsumo[j].qualidade_produto,
                'contagem_produto': arrayInsumo[j].contagem_produto,
                'dias_entrega': arrayInsumo[j].dia_entrega,
                'rota_selecionar': (arrayInsumo[0].id_produto) + '.' + (arrayInsumo[j].cod_fornecedor),
            }   
            
            itemInsumo.fornecedor.push(fornecedor)
        }

        fornecedorInsumo.push(itemInsumo)
    }
}

async function buscarFerramenta(ferramenta) {
    
    for (let index = 0; index < (ferramenta.length - 1); index++) {
        var arrayFerrmenta = await knex('Fornecedores_Produtos')
        .where('cod_plantacao', Number(local('plantacao')))
        .where('Produtos.id_produto', Number(ferramenta[index]))
        .join('Fornecedores', 'Fornecedores.cod_fornecedor', '=', 'Fornecedores_Produtos.cod_fornecedor')
        .join('Produtos', 'Produtos.id_produto', '=', 'Fornecedores_Produtos.id_produto')
        .join('Ferramentas', 'Ferramentas.cod_ferramenta', '=', 'Produtos.cod_produto')
        .select()

        var itemFerramenta = {
            'id_produto': arrayFerrmenta[0].id_produto,
            'nome_produto': arrayFerrmenta[0].nome_ferramenta,
            'fornecedor': [],
        }
        for (let j = 0; j < arrayFerrmenta.length; j++) {
            var fornecedor = {
                'cod_fornecedor': arrayFerrmenta[j].cod_fornecedor,
                'nome_fornecedor': arrayFerrmenta[j].nome_fornecedor,
                'qualidade_produto': arrayFerrmenta[j].qualidade_produto,
                'contagem_produto': arrayFerrmenta[j].contagem_produto,
                'dias_entrega': arrayFerrmenta[j].dia_entrega,
                'rota_selecionar': (arrayFerrmenta[0].id_produto) + '.' + arrayFerrmenta[j].cod_fornecedor,
            }   
            
            itemFerramenta.fornecedor.push(fornecedor)
        }

        fornecedorFerramenta.push(itemFerramenta)
    }
}

module.exports = {

    //Função para Ver detalhe do Pedido de Compra
    async compra(req, res, next) {
        try {
            const insumosRep = await knex('Fornecedores_Produtos')
            .where('cod_plantacao', Number(local('plantacao')))
            .join('Produtos', 'Produtos.id_produto', '=', 'Fornecedores_Produtos.id_produto')
            .where('Produtos.tipo_produto', 'INSUMO')
            .join('Insumos', 'Insumos.cod_insumo', 'Produtos.cod_produto')
            .select('nome_insumo', 'Produtos.id_produto')

            const insumos = await eliminarReptidos(insumosRep)

            const feramentasRep = await knex('Fornecedores_Produtos')
            .where('cod_plantacao', Number(local('plantacao')))
            .join('Produtos', 'Produtos.id_produto', '=', 'Fornecedores_Produtos.id_produto')
            .where('Produtos.tipo_produto', 'FERRAMENTA')
            .join('Ferramentas', 'Ferramentas.cod_ferramenta', 'Produtos.cod_produto')
            .select()

            const ferramentas = await eliminarReptidos(feramentasRep)
            
            return res.render('Compra/escolherItem.html', {insumos, ferramentas})
        } catch (error) {
            next(error)
        }
    },

    async selecionarFornecedor (req, res, next) {
        try {
            const {
                insumo,
                ferramenta
            } = req.body

            listaCompra = []

            fornecedorInsumo = []
            fornecedorFerramenta = []

            if (insumo == 0 && ferramenta== 0) {
                const insumosRep = await knex('Fornecedores_Produtos')
                .where('cod_plantacao', Number(local('plantacao')))
                .join('Produtos', 'Produtos.id_produto', '=', 'Fornecedores_Produtos.id_produto')
                .where('Produtos.tipo_produto', 'INSUMO')
                .join('Insumos', 'Insumos.cod_insumo', 'Produtos.cod_produto')
                .select('nome_insumo', 'Produtos.id_produto')

                const insumos = await eliminarReptidos(insumosRep)

                const feramentasRep = await knex('Fornecedores_Produtos')
                .where('cod_plantacao', Number(local('plantacao')))
                .join('Produtos', 'Produtos.id_produto', '=', 'Fornecedores_Produtos.id_produto')
                .where('Produtos.tipo_produto', 'FERRAMENTA')
                .join('Ferramentas', 'Ferramentas.cod_ferramenta', 'Produtos.cod_produto')
                .select()

                const ferramentas = await eliminarReptidos(feramentasRep)
                const mensagem = 'Você não selecionou nenhum item'
                
                return res.render('Compra/escolherItem.html', {insumos, ferramentas, mensagem})
                
            } else if(insumo == 0){
                await buscarFerramenta(ferramenta)
                fornecedorInsumo = 0
            } else if (ferramenta == 0){
                await buscarInsumo(insumo)
                fornecedorFerramenta = 0
            } else {
                await buscarInsumo(insumo)
                await buscarFerramenta(ferramenta)
            }
            
            return res.render('Compra/escolherFornecedor.html', {fornecedorFerramenta, fornecedorInsumo})
        } catch (error) {
            next(error)
        }
    },

    async apresentarFornecedor(req, res, nex) {
        try {
            listaCompra = []
            return res.render('Compra/escolherFornecedor.html', {fornecedorFerramenta, fornecedorInsumo})
        } catch (error) {
            next(error)
        }
    },

    async salvarFornecedor (req, res, next) {
        try {
            const {
                produto
            } = req.body

            var itemCompra = {}

            if (produto == 0) {
                const mensagem = 'Você não selecionou nenhum item'
                return res.render('Compra/escolherFornecedor.html', {fornecedorFerramenta, fornecedorInsumo, mensagem})
            } else {
                for (let index = 0; index < (produto.length - 1); index++) {
                    //produto[0] -> id_produto | produto[1] -> cod_fornecedor
                    const arrayCods = produto[index].split(".");

                    // Adicionar nas listas de compras 
                    const item = await knex('Produtos')
                    .where('id_produto', Number(arrayCods[0]))
                    .select()

                    // Para saber se é INSUMO ou FERRAMENTA
                    if (item[0].tipo_produto == 'INSUMO') {
                        const insumo = await knex('Produtos')
                        .where('Produtos.id_produto', Number(arrayCods[0]))
                        .where('Fornecedores.cod_fornecedor', Number(arrayCods[1]))
                        .join('Insumos', 'Insumos.cod_insumo', '=', 'Produtos.cod_produto')
                        .join('Fornecedores_Produtos', 'Fornecedores_Produtos.id_produto', 'Produtos.id_produto')
                        .join('Fornecedores', 'Fornecedores.cod_fornecedor', '=', 'Fornecedores_Produtos.cod_fornecedor')
                        .select()

                        var dataEntrega = new Date();
                        dataEntrega.setDate(dataEntrega.getDate() + Number(insumo[0].dia_entrega))

                        itemCompra = {
                            'rota_excluir': '/excluirItemCompra/' + listaCompra.length,
                            'cod_produto': insumo[0].id_produto,
                            'nome_produto': insumo[0].nome_insumo,
                            'cod_fornecedor': insumo[0].cod_fornecedor,
                            'nome_fornecedor': insumo[0].nome_fornecedor,
                            'data_entrega': dataEntrega.getDate() + '/' + (dataEntrega.getMonth() +1)  + '/' + (dataEntrega.getFullYear()),
                            'quantidade_produto': 0,
                            'preco_produto': 0,
                            'contagem01': insumo[0].contagem_produto,
                            'contagem02': 'POR ' + insumo[0].contagem_produto,
                        }

                        listaCompra.push(itemCompra)
                    } else if(item[0].tipo_produto == 'FERRAMENTA') {
                        const ferramenta = await knex('Produtos')
                        .where('Produtos.id_produto', Number(arrayCods[0]))
                        .where('Fornecedores.cod_fornecedor', Number(arrayCods[1]))
                        .join('Ferramentas', 'Ferramentas.cod_ferramenta', '=', 'Produtos.cod_produto')
                        .join('Fornecedores_Produtos', 'Fornecedores_Produtos.id_produto', 'Produtos.id_produto')
                        .join('Fornecedores', 'Fornecedores.cod_fornecedor', '=', 'Fornecedores_Produtos.cod_fornecedor')
                        .select()

                        var dataEntrega = new Date();
                        dataEntrega.setDate(dataEntrega.getDate() + Number(ferramenta[0].dia_entrega))

                        itemCompra = {
                            'rota_excluir': '/excluirItemCompra/' + listaCompra.length,
                            'cod_produto': ferramenta[0].id_produto,
                            'nome_produto': ferramenta[0].nome_ferramenta,
                            'cod_fornecedor': ferramenta[0].cod_fornecedor,
                            'nome_fornecedor': ferramenta[0].nome_fornecedor,
                            'data_entrega': dataEntrega.getDate() + '/' + (dataEntrega.getMonth() +1)  + '/' + (dataEntrega.getFullYear()),
                            'quantidade_produto': 0,
                            'preco_produto': 0,
                            'contagem01': ferramenta[0].contagem_produto,
                            'contagem02': 'POR ' + ferramenta[0].contagem_produto,
                        }

                        listaCompra.push(itemCompra)
                     }
                    
                }

                return res.render('Compra/caracterizarProduto.html', {listaCompra})
            }
            
        } catch (error) {
            next(error)
        }
    },

    async excluirItemCompra(req, res, next){
        try {
            const index = req.params.id;

            listaCompra.splice(index, 1)

            for (let i = 0; i < listaCompra.length; i++) {
                listaCompra[i].rota_excluir = '/excluirItemCompra/' + i
            }

            return res.render('Compra/caracterizarProduto.html', {listaCompra})
        } catch (error) {
            
        }
    },

    async apresentaCompra(req, res, next){
        try {
            const index = req.params.id;

            listaCompra.splice(index, 1)

            for (let i = 0; i < listaCompra.length; i++) {
                listaCompra[i].rota_excluir = '/excluirItemCompra/' + i
            }

            return res.render('Compra/finalizarCompra.html', {listaCompra})
        } catch (error) {
            
        }
    },

    
    
}