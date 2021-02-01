const knex = require('../database')
const e = require('express');
const local = require('local-storage');
const { apresentarCliente } = require('./ClienteController');
const { selecionarFerramenta } = require('./FornecedorController');

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
                hortalica    
            } = req.body

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
                    quantidade_hortalica: 0,
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

            dadosVenda.area_producao = areaTotal.toFixed(2)
            dadosVenda.dias_producao = diasTotais
            dadosVenda.valor_venda = totalVenda.toFixed(2)


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
                })
            }
            

            const listaVendas = await knex('Vendas')
            .where('Vendas.cod_plantacao', Number(local('plantacao')))
            .join('Clientes', 'Clientes.cod_cliente', 'Vendas.cod_cliente')
            .select()

            var vendas = []

            for (let index = 0; index < listaVendas.length; index++) {
                const itensVenda = await knex('Itens_Venda')
                .where('cod_venda', listaVendas[index].cod_venda)
                .select()

                var data = new Date(listaVendas[index].dt_entrega)
                
                var venda = {
                    'nome_cliente': listaVendas[index].nome_cliente,
                    'data_entrega': data.getDate() + ' de ' + nomeDosMesesAbre[data.getMonth()] + data.getFullYear(),
                    'quantidade_produto': itensVenda.length + ' produtos',
                    'rota': '/apresentarVenda/' + listaVendas[index].cod_venda
                }

                vendas.push(venda)
            }
            
            var tamanhoVenda = vendas.length
            
            return  res.render('Venda/venda.html', {vendas, tamanhoVenda})        } catch (error) {
            next(error)
        }
    },

    async infoVenda (req, res, next) {
        try {

            const index = req.params.id;

            const listaVenda = await knex('Vendas')
            .where('Vendas.cod_venda', index)
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
            .where('cod_venda', index)
            .join('Planos_Producao', 'Planos_Producao.cod_Plano', '=', 'Itens_Venda.cod_Plano')
            .join('Hortalicas', 'Hortalicas.cod_hortalica', '=', 'Itens_Venda.cod_produto')

            var listaProdutos = []

            for (let index = 0; index < listaItens.length; index++) {
                var item = {
                    'nome_hortalica': listaItens[index].nome_hortalica,
                    'quantidade_produto': listaItens[index].quantidade_produto + ' ' + listaItens[index].contagem_hortalica,
                    'valor_produto': 'R$ ' + (Number(listaItens[index].valor_produto) * Number(listaItens[index].quantidade_produto)).toFixed(2)
                }

                listaProdutos.push(item)
               
            }

            return res.render('Venda/infoVenda.html', {venda, listaProdutos})
        } catch (error) {
            next(error)
        }
    }
}