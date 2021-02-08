const knex = require('../database')
const e = require('express');
const local = require('local-storage');
const { apresentarCliente } = require('./ClienteController');
const { selecionarFerramenta } = require('./FornecedorController');
const { venda } = require('./MenuController');

var dadosVenda = {
    cod_cliente: '',
    nome_cliente: '',
    data_entrega: '',
    data_encrita: '',
    tipo_entrega: '',
    tipo_venda: '',
    valor_venda: '',
    area_producao: '',
    dias_producao: '',
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

var itensVenda = []
var listaCompra = []
var listaHortalica = []
var tamanhoVenda = 0
var vendas = []

async function buscarHortalica (cod_hortalica){
    const hortalica = await knex('Hortalicas')
    .where('cod_hortalica', cod_hortalica)
    .select()

    return hortalica
}

async function buscarItensCompra (cod_plano, quantidade){
    const itens = await knex('Itens_Plano')
    .where('cod_plano', cod_plano)
    .select()

    const planos = await knex('Planos_Producao')
    .where('cod_plano', cod_plano)
    .select()

    const quantidadeProduzida = planos[0].quantidade_hortalica;
   

    for (var index = 0; index < itens.length; index++) {
        var quantidadeItem = quantidade  * itens[index].quantidade_item / quantidadeProduzida

        var verificador = 0
        for (var j = 0; j < listaCompra.length; j++) {
            if (listaCompra[j].cod_item == itens[index].cod_item) {
                listaCompra[j].quantidade_aplicacao = Number(listaCompra[j].quantidade_aplicacao) + quantidadeItem
                verificador = 1
                break;
            }
            verificador = 0
        }
        
        if(verificador == 0) {
            var insumo = await knex('Insumos')
            .where('cod_insumo', itens[index].cod_item)
            .select()
            
            var item = {
                nome_plano: planos[0].nome_plano,
                cod_item: itens[index].cod_item,
                nome_item: insumo[0].nome_insumo,
                quantidade_aplicacao:quantidadeItem,
                contagem_item: itens[index].contagem_item,
            }

            listaCompra.push(item)

        }
        
    }
}

async function apresentarVendas () {
    const listaVendas = await knex('Vendas')
    .where('Vendas.cod_plantacao', Number(local('plantacao')))
    .whereNot('Vendas.status_venda', 'FECHADA')
    .join('Clientes', 'Clientes.cod_cliente', 'Vendas.cod_cliente')
    .select()

    vendas = []

    for (let index = 0; index < listaVendas.length; index++) {
        const itensVenda = await knex('Itens_Venda')
        .where('cod_venda', listaVendas[index].cod_venda)
        .join('Hortalicas', 'Hortalicas.cod_hortalica', '=', 'Itens_Venda.cod_produto')
        .select()

        var nomeItens = itensVenda[0].nome_hortalica;

        for (var j = 1; j < itensVenda.length; j++) {
            nomeItens = nomeItens + ', ' + itensVenda[j].nome_hortalica                
        }

        var data = new Date(listaVendas[index].dt_entrega)
                
        var venda = {
            'nome_cliente': listaVendas[index].nome_cliente,
            'data_entrega': data.getDate() + ' de ' + nomeDosMesesAbre[data.getMonth()] + data.getFullYear(),
            'produtos': nomeItens,
            'rota': '/apresentarVenda/' + listaVendas[index].cod_venda
        }

        vendas.push(venda)
    }
            
    tamanhoVenda = vendas.length
}

module.exports = {

    // Funçoes para realizar a venda
    async vender (req, res, next) {
        try {
            const listaCliente = await knex('Clientes')
            .where({'cod_Plantacao': Number(local('plantacao'))})
            .select()

            itensVenda = []
            listaCompra = []
            
            return res.render('Venda/escolherCliente.html', {listaCliente})
        } catch (error) {
            next(error)
        }
    },

    async escolherCliente(req, res, next){
        try {
            
            const {
                codCliente,
                dataEntrega,
                entrega,
                venda,
            } = req.body

            const listaCliente = await knex('Clientes')
            .where('cod_cliente', codCliente)
            .select()

            const cliente = listaCliente[0];

            dadosVenda.nome_cliente = cliente.nome_cliente;
            dadosVenda.cod_cliente = codCliente;
            dadosVenda.tipo_entrega = entrega;
            dadosVenda.tipo_venda = venda;

            // Atribuir a data correta para a venda
            // Buscar hortaliças para a venda
            if (venda == 'IMEDIATA') {
                var dataAtual = new Date()
                dadosVenda.data_entrega = dataAtual;

                listaHortalica = await knex('Armazens')
                .where('cod_plantacao', Number(local('plantacao')))
                .where('Armazens.status_hortalica', 'LIVRE')
                .join('Hortalicas', 'Hortalicas.cod_hortalica', '=', 'Armazens.cod_hortalica')
                .select()

            } else {
                if (dataEntrega == '') {
                    const listaCliente = await knex('Clientes')
                    .where({'cod_Plantacao': Number(local('plantacao'))})
                    .select()

                    itensVenda = []
                    listaCompra = []

                    const mensagem = "DATA INVÁLIDA"
                    
                    return res.render('Venda/escolherCliente.html', {listaCliente, mensagem})
                }
                dadosVenda.data_entrega = dataEntrega;

                listaHortalica = await knex('Planos_Producao')
                .where('cod_plantacao', Number(local('plantacao')))
                .join('Hortalicas', 'Hortalicas.cod_hortalica', '=', 'Planos_Producao.cod_hortalica')
                .select()
            }

            return res.render('Venda/escolherHortalica.html', {dadosVenda, listaHortalica})

        } catch (error) {
            next(error)
        }
    },

    async escolherHortalica(req, res, next){
        try {
            
            itensVenda = []

            const {
                cod_hortalica    
            } = req.body
            var hortalica = []
            if (Array.isArray(cod_hortalica)) {
                hortalica = cod_hortalica
            } else if(cod_hortalica == undefined) {
                const mensagem = 'É necessário selecionar pelo menos uma hortaliça'
                return res.render('Venda/escolherHortalica.html', {dadosVenda, listaHortalica, mensagem})
            } else {
                hortalica.push(cod_hortalica)
            }

            if(dadosVenda.tipo_venda == 'IMEDIATA'){
                for (let index = 0; index < hortalica.length; index++) {
                    var dadosHortalica = await knex('Armazens')
                    .where('Armazens.cod_plantacao', Number(local('plantacao')))
                    .where('Armazens.cod_hortalica', hortalica[index])
                    .where('Armazens.status_hortalica', 'LIVRE')
                    .join('Hortalicas', 'Hortalicas.cod_hortalica', '=', 'Armazens.cod_hortalica')
                    .join('Producoes', 'Producoes.cod_producao', 'Armazens.cod_producao')
                    .join('Planos_Producao', 'Planos_Producao.cod_plano', 'Producoes.cod_plano')
                    .select(
                        'Hortalicas.nome_hortalica',
                        'Armazens.quantidade_hortalica',
                        'Armazens.cod_hortalica',
                        'Planos_Producao.contagem_hortalica'
                    );
    
                    var item = {
                        rota_excluir: '/excluirItem/' + (itensVenda.length),
                        cod_hortalica: dadosHortalica[0].cod_hortalica,
                        nome_hortalica: dadosHortalica[0].nome_hortalica,
                        quantidade_hortalica: dadosHortalica[0].quantidade_hortalica,
                        valor_produto: 0,
                        total_valor: 0,
                        cod_plano: 0,
                        dias_producao: 0,
                        area_producao: 0,
                        contagem_hortalica: dadosHortalica[0].contagem_hortalica
                    }
                    
                    itensVenda.push(item)
                }

                const obs = 0

                return res.render('Venda/escolherQuantidadeHortalica.html', {dadosVenda , itensVenda, obs})

            } else {
                // Buscar cada item selecionado para cadastra-los na lista de itensVenda
                for (let index = 0; index < hortalica.length; index++) {
                    var dadosHortalica = await knex('Hortalicas')
                    .where('Hortalicas.cod_hortalica', Number(hortalica[index]))
                    .join('Planos_Producao', 'Planos_Producao.cod_hortalica', '=', 'Hortalicas.cod_hortalica')
                    .select();

                    var item = {
                        rota_excluir: '/excluirItem/' + (itensVenda.length),
                        cod_hortalica: dadosHortalica[0].cod_hortalica,
                        nome_hortalica: dadosHortalica[0].nome_hortalica,
                        quantidade_hortalica: 9999999999.99,
                        valor_produto: 0,
                        total_valor: 0,
                        cod_plano: 0,
                        dias_producao: 0,
                        area_producao: 0,
                        contagem_hortalica: dadosHortalica[0].contagem_hortalica
                    }
                    
                    itensVenda.push(item)
                }
                
                for (let index = 0; index < itensVenda.length; index++) {
                    var plano = await knex('Planos_Producao')
                    .where('cod_plantacao', Number(local('plantacao')))
                    .where('cod_hortalica', itensVenda[index].cod_hortalica)
                    .select()

                    await buscarItensCompra(plano[0].cod_plano, itensVenda[index].quantidade_hortalica)     
                }

                return res.render('Venda/escolherQuantidadeHortalica.html', {dadosVenda, listaHortalica, itensVenda, listaCompra})

            }

            
        } catch (error) {
            next(error)
        }
    },

    async voltarEscolherHortalica(req, res, next){
        try {
            
            return res.render('Venda/escolherHortalica.html', {dadosVenda, listaHortalica})

        } catch (error) {
            next(error)
        }
    },
    
    async excluirItem(req, res, next){
        try {
            const index = req.params.id;

            if(index > -1) {
                itensVenda.splice(index, 1)
                for (let i = 0; i < itensVenda.length; i++) {
                    
                    itensVenda[i].rota_excluir = '/excluirItem/' + i
                    
                }
            }

            const tamanhoLista = itensVenda.length

            return res.render('Venda/escolherQuantidadeHortalica.html', {dadosVenda, listaHortalica, tamanhoLista, itensVenda})
        } catch (error) {
            next(error)
        }
    },

    async apresentarVenda(req, res, next){
        try {
            const {
                quantProduto,
                valorProduto
            } = req.body
        
            if (itensVenda.length > 1) {
                for (let index = 0; index < quantProduto.length; index++) {
                    itensVenda[index].quantidade_hortalica = quantProduto[index]
                    itensVenda[index].valor_produto = (Number(valorProduto[index])).toFixed(2)
                    itensVenda[index].total_valor = (Number(quantProduto[index]) * Number(valorProduto[index])).toFixed(2)
                }
            } else {
                for (let index = 0; index < 1; index++) {
                    itensVenda[index].quantidade_hortalica = quantProduto
                    itensVenda[index].valor_produto = (Number(valorProduto)).toFixed(2)
                    itensVenda[index].total_valor = (Number(quantProduto) * Number(valorProduto)).toFixed(2)
                }
            }
            

            

            const dataVenda = new Date(dadosVenda.data_entrega)

            dadosVenda.data_escrita = dataVenda.getDate() + ' / ' + dataVenda.getMonth() + ' / ' + dataVenda.getFullYear()
           
            var totalVenda = 0
            for (let index = 0; index < itensVenda.length; index++) {
                var plano = await knex('Planos_Producao')
                .where('cod_plantacao', Number(local('plantacao')))
                .where('cod_hortalica', itensVenda[index].cod_hortalica)
                .select()

                var areaProducao = (plano[0].area_terreno * itensVenda[index].quantidade_hortalica) / plano[0].area_terreno;
                totalVenda = totalVenda + Number(itensVenda[index].total_valor)     
            
                itensVenda[index].cod_plano = plano[0].cod_plano
                itensVenda[index].dias_producao = plano[0].dias_producao + ' Dias'
                itensVenda[index].area_producao = areaProducao
            }
            
            var areaTotal = 0;
            var diasTotais = 0
            for (let index = 0; index < itensVenda.length; index++) {
                
                areaTotal = areaTotal + itensVenda[index].area_producao
            
                if (index > 0) {
                    if(diasTotais < itensVenda[index].dias_producao) {
                        diasTotais = itensVenda[index].dias_producao
                    }
                } else {
                    diasTotais = itensVenda[index].dias_producao
                }
            }

            if (dadosVenda.tipo_venda != 'IMAEDIATA') {
                dadosVenda.area_producao = areaTotal.toFixed(2)
                dadosVenda.dias_producao = diasTotais
                dadosVenda.valor_venda = totalVenda.toFixed(2)
            }

            


            return res.render('Venda/resultadoVenda.html',  {dadosVenda, itensVenda, listaCompra})
        } catch (error) {
            next(error)
        }
    },


    async cadastarVenda(req, res, next){
        try {
            const {
                totalVenda,
            } = req.body

            dadosVenda.valor_venda = totalVenda
            
            //Cadastro de Venda
            await knex('Vendas')
            .insert({
                'cod_cliente': Number(dadosVenda.cod_cliente),
                'dt_entrega': dadosVenda.data_entrega,
                'tipo_entrega': dadosVenda.tipo_entrega,
                'total_venda': dadosVenda.valor_venda,
                'email_usuario': local('email'),
                'cod_plantacao': Number(local('plantacao')),
                'status_venda': 'ABERTO'
            })

            // Cadastro dos Itens Venda
            const vendasLista = await knex('Vendas')
            .where('cod_plantacao', Number(local('plantacao')))
            .where('status_venda', 'ABERTO')
            .where('email_usuario', local('email'))
            .where('cod_cliente', dadosVenda.cod_cliente)
            .select()

            const codVenda = vendasLista[vendasLista.length -1].cod_venda

            for (let index = 0; index < itensVenda.length; index++) {
                await knex('Itens_Venda')
                .insert({
                    'cod_produto': itensVenda[index].cod_hortalica,
                    'cod_venda': codVenda,
                    'quantidade_produto': itensVenda[index].quantidade_hortalica,
                    'valor_produto': itensVenda[index].valor_produto,
                    'cod_plano': itensVenda[index].cod_plano,
                    'quantidade_produzida': 0.00,
                })
            }

            await apresentarVendas()
            
            return  res.render('Venda/venda.html', {vendas, tamanhoVenda}) 
        } catch (error) {
            next(error)
        }
    },

    async infoVenda (req, res, next) {
        try {

            const cod_venda = req.params.id;

            const listaVenda = await knex('Vendas')
            .where('Vendas.cod_venda', cod_venda)
            .join('Clientes', 'Clientes.cod_cliente', '=', 'Vendas.cod_cliente')
            .join('Usuarios', 'Usuarios.email_usuario', 'Vendas.email_usuario')
            .select()

            var venda = listaVenda[0]

            var dataVenda = new Date(venda.dt_venda)
            var dataEntrega = new Date(venda.dt_entrega)

            venda.dt_venda = dataVenda.getDate() + ' de ' + nomeDosMesesAbre[dataVenda.getMonth()] + dataVenda.getFullYear()
            venda.dt_entrega =  dataEntrega.getDate() + ' de ' + nomeDosMesesAbre[dataEntrega.getMonth()] + dataEntrega.getFullYear()
            venda.total_venda = venda.total_venda.toFixed(2)



            var listaItens = await knex('Itens_Venda')
            .where('cod_venda', cod_venda)
            .join('Planos_Producao', 'Planos_Producao.cod_Plano', '=', 'Itens_Venda.cod_Plano')
            .join('Hortalicas', 'Hortalicas.cod_hortalica', '=', 'Itens_Venda.cod_produto')
            .select()

            var finalizarVenda = 0
            var listaProdutos = []

            for (let index = 0; index < listaItens.length; index++) {
                var item = {
                    'nome_hortalica': listaItens[index].nome_hortalica,
                    'quantidade_produto': listaItens[index].quantidade_produto + listaItens[index].contagem_hortalica,
                    'valor_produto': (Number(listaItens[index].valor_produto) * Number(listaItens[index].quantidade_produto)).toFixed(2),
                    'quantidade_produzida': listaItens[index].quantidade_produzida+ listaItens[index].contagem_hortalica,
                }

                if (item.quantidade_produto ==item.quantidade_produzida){
                    finalizarVenda = '/finalizarVenda/' + cod_venda
                } else {
                    finalizarVenda = 0
                }

                listaProdutos.push(item)
                 
            }

            return res.render('Venda/infoVenda.html', {venda, listaProdutos, finalizarVenda})
        } catch (error) {
            next(error)
        }
    },

    async apresentarTelaFinalizar(req, res, next){
        try {
            const cod_venda = req.params.id
            local ('cod_venda', String(cod_venda))

            const arrayVenda = await knex("Vendas")
            .where('cod_venda', cod_venda)
            .join('Clientes', 'Clientes.cod_cliente', '=', 'Vendas.cod_cliente')
            .select()
            
            const data_venda = new Date(arrayVenda[0].dt_venda)

            const venda = {
                'nome_cliente': arrayVenda[0].nome_cliente,
                'telefone_cliente': arrayVenda[0].telefone_cliente,
                'data_venda': data_venda.getDate() + ' ' + nomeDosMesesAbre[data_venda.getMonth()] + ' ' + data_venda.getFullYear(),
                'total_venda': arrayVenda[0].total_venda,
            }

            var listaItens = await knex('Itens_Venda')
            .where('cod_venda', cod_venda)
            .join('Planos_Producao', 'Planos_Producao.cod_Plano', '=', 'Itens_Venda.cod_Plano')
            .join('Hortalicas', 'Hortalicas.cod_hortalica', '=', 'Itens_Venda.cod_produto')
            .select()

            var listaProdutos = []

            for (let index = 0; index < listaItens.length; index++) {
                var item = {
                    'nome_hortalica': listaItens[index].nome_hortalica,
                    'quantidade_produto': listaItens[index].quantidade_produto + listaItens[index].contagem_hortalica,
                    'valor_produto': (Number(listaItens[index].valor_produto) * Number(listaItens[index].quantidade_produto)).toFixed(2),
                }

                listaProdutos.push(item)
                 
            }

            return res.render('Venda/finalizarVenda.html', {venda, listaProdutos})
        } catch (error) {
            next(error)
        }
    },
    async finalizarVenda(req, res, next){
        try {
            const cod_venda = Number(local('cod_venda'))

            const {
                tipoPagamento,
                numParcelas,
                diaPagamento
            } = req.body

            const arrayVenda = await knex('Vendas')
            .where('cod_venda', cod_venda)
            .join('Clientes', 'Clientes.cod_cliente', '=', 'Vendas.cod_cliente')
            .select()

            var dataPagamento = new Date(diaPagamento)
            
            var parcelamento = []

            if (tipoPagamento == 'PRAZO') {
                if(numParcelas == '' || diaPagamento == '') {
                    const arrayVenda = await knex("Vendas")
                    .where('cod_venda', cod_venda)
                    .join('Clientes', 'Clientes.cod_cliente', '=', 'Vendas.cod_cliente')
                    .select()
                    
                    const data_venda = new Date(arrayVenda[0].dt_venda)

                    const venda = {
                        'nome_cliente': arrayVenda[0].nome_cliente,
                        'telefone_cliente': arrayVenda[0].telefone_cliente,
                        'data_venda': data_venda.getDate() + ' ' + nomeDosMesesAbre[data_venda.getMonth()] + ' ' + data_venda.getFullYear(),
                        'total_venda': arrayVenda[0].total_venda,
                    }

                    var listaItens = await knex('Itens_Venda')
                    .where('cod_venda', cod_venda)
                    .join('Planos_Producao', 'Planos_Producao.cod_Plano', '=', 'Itens_Venda.cod_Plano')
                    .join('Hortalicas', 'Hortalicas.cod_hortalica', '=', 'Itens_Venda.cod_produto')
                    .select()

                    var listaProdutos = []

                    for (let index = 0; index < listaItens.length; index++) {
                        var item = {
                            'nome_hortalica': listaItens[index].nome_hortalica,
                            'quantidade_produto': listaItens[index].quantidade_produto + listaItens[index].contagem_hortalica,
                            'valor_produto': (Number(listaItens[index].valor_produto) * Number(listaItens[index].quantidade_produto)).toFixed(2),
                        }

                        listaProdutos.push(item)
                    }

                    var mensagem = 'Dados Inválidos';

                    return res.render('Venda/finalizarVenda.html', {venda, listaProdutos, mensagem})

                } else {
                    var valoresParcelas = arrayVenda[0].total_venda / Number(numParcelas)
                    for (let index = 0; index < Number(numParcelas); index++) {
                        var parcela = {
                            'dia_pagamento': dataPagamento.getFullYear()+ '-' +(dataPagamento.getMonth()+1)+ '-' +dataPagamento.getDate(),
                            'valor_pagamento': valoresParcelas.toFixed(2),
                        }
                        parcelamento.push(parcela)
                        dataPagamento.setMonth(dataPagamento.getMonth() + 1)
                    }

                }
            } else {
                var dataPagamento = new Date(arrayVenda[0].dt_entrega)
                var parcela = {
                    'dia_pagamento': dataPagamento,
                    'valor_pagamento': arrayVenda[0].total_venda,
                }

                parcelamento.push(parcela)
            }

            for (let index = 0; index < parcelamento.length; index++) {
                await knex('Entradas').insert({
                    'cod_plantacao': Number(local('plantacao')),
                    'validade_entrada': parcelamento[index].dia_pagamento,
                    'nome_entrada': 'VENDA - ' + arrayVenda[0].nome_cliente,
                    'valor_entrada': parcelamento[index].valor_pagamento,
                    'destino_valor': null
                })          
            }

            await knex('Vendas')
            .where('cod_venda', cod_venda)
            .update({
                'status_venda': 'FECHADA'
            })

            const itemVenda = await knex('Itens_Venda')
            .where('cod_venda', cod_venda)
            .select()

            for (let index = 0; index < itemVenda.length; index++) {
                await knex('Armazens')                
                .where('cod_plantacao', Number(local('plantacao')))
                .where('destino_hortalica', itemVenda[index].cod_item)
                .update ({
                    'status_hortalica': 'VENDIDO'
                })
            }

            // Retorno para vendas
            await apresentarVendas()
            
            return  res.render('Venda/venda.html', {vendas, tamanhoVenda}) 
        } catch (error) {
            next(error)
        }
    }
}