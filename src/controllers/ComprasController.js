const knex = require('../database')
const e = require('express');
const local = require('local-storage');
const { query } = require('express');
const { render, runtime } = require('nunjucks');
const { use, search, get } = require('../routes');
const { insert } = require('../database');

var fornecedorInsumo = []
var fornecedorFerramenta = []
var listaCompra = []
var dadosCompra = {
    'total_compra': 0,
    'status_compra': 'ABERTO',
}
var datasEntrega = []
var valoresParcelas = []

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
            dadosCompra = {
                'total_compra': 0,
                'status_compra': 'ABERTO',
            }

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
            datasEntrega = [];

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
                        var dtEntrega = new Date(dataEntrega.getFullYear(), dataEntrega.getMonth(), dataEntrega.getDate())
                        datasEntrega.push(dtEntrega)

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
                        
                        var dtEntrega = new Date(dataEntrega.getFullYear(), dataEntrega.getMonth(), dataEntrega.getDate())
                        datasEntrega.push(dtEntrega)

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
            next(error)
        }
    },

    async apresentaCompra(req, res, next){
        try {
            const {
                quantProduto,
                valorProduto,
            } = req.body

            var subTotal = 0

            if(Array.isArray(quantProduto)){
                for (let index = 0; index < listaCompra.length; index++) {
                    listaCompra[index].quantidade_produto = (Number(quantProduto[index])).toFixed(2)
                    listaCompra[index].preco_produto = (Number(valorProduto[index])).toFixed(2)
                    listaCompra[index].total = (Number(quantProduto[index]) * Number(valorProduto[index])).toFixed(2)
                
                    subTotal = subTotal + Number(listaCompra[index].total)
                }  
            } else {
                listaCompra[0].quantidade_produto = (Number(quantProduto)).toFixed(2)
                listaCompra[0].preco_produto = (Number(valorProduto)).toFixed(2)
                listaCompra[0].total = (Number(quantProduto) * Number(valorProduto)).toFixed(2)
            
                subTotal =  (listaCompra[0].total)
            }      
                   
            dadosCompra.total_compra = (Number(subTotal)).toFixed(2)

            return res.render('Compra/finalizarCompra.html', {listaCompra, dadosCompra})
        } catch (error) {
            next(error)
        }
    },

    async cadastrarPagamento(req, res, next){
        try {
            const {
                entrega,
                valorFrete,
                tipoPagamento,
                numParcelas,
                diaPagamento,
                juros,
                valorJuros
            } = req.body
            
                        
            var data = new Date()
            valoresParcelas = []

           
            var dataEntrega = new Date();

            for (var i = 0; i < datasEntrega.length; i++) {
                if(dataEntrega < datasEntrega[i]) {
                    dataEntrega = datasEntrega[i];
                } 
            }

            dadosCompra.data_entrega = dataEntrega;          


            // Verificação de Dados
            if(entrega == 'COM FRETE'){
                if(valorFrete > 0){
                    dadosCompra.frete = Number(valorFrete)
                } else {
                    var mensagem = 'Valor do frete inválido'
                    return res.render('Compra/finalizarCompra.html', {listaCompra, dadosCompra, mensagem})
                }
            } else if(entrega == 'SEM FRETE') {
                dadosCompra.frete = 0
            }

            if(tipoPagamento == 'PRAZO'){
                if(numParcelas > 1){
                    dadosCompra.numero_parcelas = Number(numParcelas)
                    if (diaPagamento == 0) {
                        dadosCompra.dia_pagamento = data.getDate()
                    } else {
                        dadosCompra.dia_pagamento = Number(diaPagamento)
                    }

                    if(juros == 'COM JUROS'){
                        if(valorJuros > 0){
                            dadosCompra.valor_juros = Number(valorJuros)

                            var jpp = 0                                                                   // Juros pago no período
                            var vr = Number(dadosCompra.total_compra)                                         // Valor Residual
                            var i = Number(dadosCompra.valor_juros) / 100                                         // Taxa
                            var vpf = Number(dadosCompra.total_compra)  / Number(dadosCompra.numero_parcelas) // Valor da Parcela Fixa


                            var dtPagamento = new Date(data.getFullYear(), data.getMonth(), dadosCompra.dia_pagamento)

                            if (dtPagamento < data) {
                                var dataPag = new Date(data.getFullYear(), (data.getMonth() + 1), dadosCompra.dia_pagamento)
                            } else {
                                var dataPag = dtPagamento
                            }

                            for (let index = 1; index <= Number(dadosCompra.numero_parcelas); index++) {
                                                                
                                jpp = vr * i;
                                vr = vr - vpf;
                                
                                var parc = {
                                    dia_pagamento: dataPag.getDate() + ' / ' + (dataPag.getMonth() + 1),                               
                                    data_pagamento: dataPag.getFullYear() + '-' + (dataPag.getMonth() + 1) + '-' + Number(dadosCompra.dia_pagamento),
                                    juros: jpp.toFixed(2),
                                    parcela_principal: vpf.toFixed(2),
                                    parcela_total: (vpf + jpp).toFixed(2),
                                    saldo_devedor: vr.toFixed(2)
                                }

                                valoresParcelas.push(parc)

                                dataPag.setMonth(dataPag.getMonth() + 1)
                            }
                        } else {
                            var mensagem = 'Valor do juros inválido'
                            return res.render('Compra/finalizarCompra.html', {listaCompra, dadosCompra, mensagem})
                        }
                    } else if(juros == 'SEM JUROS') {
                        dadosCompra.valor_juros = 0
                        var vpf = Number(dadosCompra.total_compra)  / Number(dadosCompra.numero_parcelas) // Valor da Parcela Fixa
                        var vr = Number(dadosCompra.total_compra)   

                        var dtPagamento = new Date(data.getFullYear(), data.getMonth(), dadosCompra.dia_pagamento)

                        if (dtPagamento < data) {
                            var dataPag = new Date(data.getFullYear(), (data.getMonth() + 1), dadosCompra.dia_pagamento)
                        } else {
                            var dataPag = dtPagamento
                        }

                        for (let index = 1; index <= Number(dadosCompra.numero_parcelas); index++) {                            
                            
                            vr = vr - vpf;

                            var parc = {
                                dia_pagamento: dataPag.getDate() + ' / ' + (dataPag.getMonth() + 1),
                                data_pagamento: dataPag.getFullYear() + '-' + (dataPag.getMonth() + 1) + '-' + Number(dadosCompra.dia_pagamento),
                                juros: dadosCompra.valor_juros.toFixed(2),
                                parcela_principal: vpf.toFixed(2),
                                parcela_total: vpf.toFixed(2),
                                saldo_devedor: vr.toFixed(2)
                            }

                            valoresParcelas.push(parc)

                            dataPag.setMonth(dataPag.getMonth() + 1)
                        }
                    }
                } else {
                    var mensagem = 'Valor do número de parcelas inválido'
                    return res.render('Compra/finalizarCompra.html', {listaCompra, dadosCompra, mensagem})
                }
            } else if(tipoPagamento == 'VISTA') {
                dadosCompra.numero_parcelas = 1
                dadosCompra.valor_juros = 0
                dadosCompra.dia_pagamento = data.getDate()

                var parc = {
                    dia_pagamento: data.getDate() + ' / ' + (data.getMonth() +1),
                    data_pagamento: data,
                    juros: '0.00',
                    parcela_principal: Number(dadosCompra.total_compra).toFixed(2),
                    parcela_total: Number(dadosCompra.total_compra).toFixed(2),
                    saldo_devedor: Number(dadosCompra.total_compra).toFixed(2),
                }

                valoresParcelas.push(parc)

            }   

            valoresParcelas[0].parcela_total = (Number(valoresParcelas[0].parcela_total) + Number(dadosCompra.frete)).toFixed(2)

            return res.render('Compra/apresentarCompra.html', {listaCompra, dadosCompra, valoresParcelas})          
            
        } catch (error) {
            next(error)
        }
    },

    async salvarCompra(req, res, next){
        try {

            // Adicionar em Compra
            await knex('Compras')
            .insert({
                'total_compra': Number(dadosCompra.total_compra),
                'juros_compra': Number(dadosCompra.valor_juros),
                'valor_frete': Number(dadosCompra.frete),
                'numero_parcela': Number(dadosCompra.numero_parcelas),
                'dia_pagamento': Number(dadosCompra.dia_pagamento),
                'cod_plantacao': Number(local('plantacao')),
                'email_usuario': local('email'),
                'status_compra': dadosCompra.status_compra,
                'data_entrega': dadosCompra.data_entrega,
            })

            // Adicionar em Itens_Compras
            const codsCompra = await knex('Compras')
            .where('cod_plantacao', Number(local('plantacao')))
            .select()

            const codCompra = codsCompra[codsCompra.length -1].cod_compra

            for (let index = 0; index < listaCompra.length; index++) {
                await knex('Itens_Compra')
                .insert({
                    'cod_item': listaCompra[index].cod_produto,
                    'cod_fornecedor': listaCompra[index].cod_fornecedor,
                    'cod_compra': codCompra,
                    'quantidade_item': listaCompra[index].quantidade_produto,
                    'valor_item': listaCompra[index].preco_produto,
                    'contagem_item': listaCompra[index].contagem01,
                })
                
            }

            // Adicionar em Saidas
            for (let index = 0; index < valoresParcelas.length; index++) {
                await knex('Saidas')
                .insert({
                    'cod_plantacao': Number(local('plantacao')),
                    'validade_saida': valoresParcelas[index].data_pagamento,
                    'nome_saida': 'COMPRA - ' + codCompra,
                    'valor_saida': Number(valoresParcelas[index].parcela_principal),
                    'destino_saida': 'OUTROS DEBITOS',
                    'cobranca_saida': 0,
                })          
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

            const listaCompras = await knex('Compras')
            .where('Compras.cod_plantacao', Number(local('plantacao')))
            .where('status_compra', 'ABERTO')
            .select()

            var compras = []

            for (var i = 0; i < listaCompras.length; i++) {
                const itensCompra = await knex('Itens_Compra')
                .where('cod_compra', listaCompras[i].cod_compra)
                // .join('Fornecedores', 'Fornecedores.cod_fornecedor', '=', 'Itens_Compra.cod_fornecedor')
                .select()

                var data = new Date(listaCompras[i].dt_compra)              
                
                var compra = {
                    'nome_compra': 'COMPRA - ' + i,
                    'nome_fornecedor': itensCompra[0].nome_fornecedor,
                    'data_compra': data.getDate() + ' de ' + nomeDosMesesAbre[data.getMonth()] + data.getFullYear(),
                    'quantidade_produto': itensCompra.length + ' produtos',
                    'rota': '/apresentarCompra/' + listaCompras[i].cod_compra,
                }

                compras.push(compra)
            }

            var tamanhoCompra = compras.length
            
            return  res.render('Compra/compra.html', {compras, tamanhoCompra})

        } catch (error) {
            next(error)
        }
    },

    async mostrarCompra(req, res, next){
        try {
            const index = req.params.id;

            const compras = await knex('Compras')
            .where('Compras.cod_compra', index)
            .join('Itens_Compra', 'Itens_Compra.cod_compra', '=', 'Compras.cod_compra')
            .join('Produtos', 'Produtos.id_produto', '=', 'Itens_Compra.cod_item')
            .select()

            // Anilide da data de entrega

            var comprasInsumo = [];
            var comprasFerramenta = [];

            var parcelamentos = [];

            for (let i = 0; i < compras.length; i++) {
                if(compras[i].tipo_produto == 'INSUMO') {
                    var insumo = await knex('Compras')
                    .where('Compras.cod_compra', compras[i].cod_compra)
                    .where('Itens_Compra.cod_item', compras[i].cod_item)
                    .join('Itens_Compra', 'Itens_Compra.cod_compra', '=', 'Compras.cod_compra')
                    .join('Produtos', 'Produtos.id_produto', '=', 'Itens_Compra.cod_item')
                    .join('Insumos', 'Insumos.cod_insumo', '=', 'Produtos.cod_produto')
                    .join('Fornecedores', 'Fornecedores.cod_fornecedor', 'Itens_Compra.cod_fornecedor')
                    .select()

                    comprasInsumo.push(insumo[0])
                    
                }  else if(compras[i].tipo_produto == 'FERRAMENTA'){
                    var ferramenta = await knex('Compras')
                    .where('Compras.cod_compra', compras[i].cod_compra)
                    .where('Itens_Compra.cod_item', compras[i].cod_item)
                    .join('Itens_Compra', 'Itens_Compra.cod_compra', '=', 'Compras.cod_compra')
                    .join('Produtos', 'Produtos.id_produto', '=', 'Itens_Compra.cod_item')
                    .join('Ferramentas', 'Ferramentas.cod_ferramenta', '=', 'Produtos.cod_produto')
                    .join('Fornecedores', 'Fornecedores.cod_fornecedor', 'Itens_Compra.cod_fornecedor')
                    .select()

                    comprasFerramenta.push(ferramenta[0])
                }         
            }

            for (let index = 0; index < comprasInsumo.length; index++) {
                comprasInsumo[index].valor_item = (Number(comprasInsumo[index].valor_item) * Number(comprasInsumo[index].quantidade_item)).toFixed(2)
            }

            for (let index = 0; index < comprasFerramenta.length; index++) {
                comprasFerramenta[index].valor_item = (Number(comprasFerramenta[index].valor_item) * Number(comprasFerramenta[index].quantidade_item)).toFixed(2)
            }

            // Calculo das Parcelas
            var jpp = 0                                           
            var vr = compras[0].total_compra        
            var i = compras[0].juros_compra / 100                             
            var vpf = compras[0].total_compra / compras[0].numero_parcela

            for (let index = 0; index < Number(compras[0].numero_parcela); index++) {
                                                                                                           
                jpp = vr * i;
                vr = vr - vpf;
                            
                var parc = {                  
                    juros: jpp.toFixed(2),
                    parcela_principal: vpf.toFixed(2),
                    parcela_total: (vpf + jpp).toFixed(2),
                    saldo_devedor: vr.toFixed(2)
                }

                parcelamentos.push(parc)
            }

            var dt = new Date(compras[0].data_entrega)

            parcelamentos[0].parcela_total = (Number(parcelamentos[0].parcela_total) + compras[0].valor_frete).toFixed(2);

            var totalCompra = 0
            for (let index = 0; index < parcelamentos.length; index++) {
                totalCompra = totalCompra + Number(parcelamentos[index].parcela_total)
                
            }

            var dadosCompra = {
                totalParcial_compra: (compras[0].total_compra).toFixed(2),
                total_compra: (totalCompra).toFixed(2),
                valor_frete: (compras[0].valor_frete).toFixed(2),
                data_entrega: dt.getDate() + ' / ' + (dt.getMonth() + 1) + ' / ' + dt.getFullYear(),
                rota_entrada: '/registroEntrada/' + compras[0].cod_compra
            };

            const dataAtual = new Date()
            if(dataAtual > compras[0].data_entrega) {
                dadosCompra.status_compra = 'ENTREGA ATRASADA'
            } else {
                dadosCompra.status_compra = 'DENTRO DO PRAZO'
            }
                

            return res.render('Compra/informacoesCompra.html', {comprasInsumo, comprasFerramenta, parcelamentos, dadosCompra})
        } catch (error) {
            next(error)
        }
    }
    
}