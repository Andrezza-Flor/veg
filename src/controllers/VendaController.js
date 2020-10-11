const knex = require('../database')
const e = require('express');
const local = require('local-storage');
const { query } = require('express');
const { render } = require('nunjucks');
const { use } = require('../routes');
const { where } = require('../database');
const { celeiro } = require('./MenuController');
const { detalheInsumo } = require('./CeleiroController');

const arrayItensVenda = []

module.exports = {

    // Funçoes para realizar a venda
    async vender (req, res, next) {
        try {
            const codPlantacao = Number(local('plantacao'))

            const listaCliente = await knex('Clientes')
            .where({'cod_Plantacao': codPlantacao})
            .select('Clientes.cod_Cliente', 'Clientes.nome_Cliente')
            
            return res.render('vendaEscolherCliente.html', {listaCliente})
        } catch (error) {
            next(error)
        }
    },
    async escolherCliente(req, res, next){
        try {
            const codPlantacao = Number(local('plantacao'))
            const emailUsuario = local('email')

            const listaCliente = await knex('Clientes')
            .where({'cod_Plantacao': codPlantacao})
            .select('Clientes.cod_Cliente', 'Clientes.nome_Cliente')
            
            const {
                codCliente
            } = req.body

            const arrayCliente = await knex('Clientes')
            .where({'cod_Cliente': codCliente})
            .select()

            const cliente = arrayCliente[0]

            local('cliente', String(cliente.cod_Cliente))
            
            // Limar o arraItensVeda antentes de começar a inserção no array
            while (arrayItensVenda.length) {
                arrayItensVenda.pop()
            }

            return res.render('vendaEscolherCliente.html', {listaCliente, cliente})

        } catch (error) {
            next(error)
        }
    },
    async buscaHortalica(req, res, next){
        try {
            const codPlantacao = Number(local('plantacao'))
            const codCliente = Number(local('cliente'))

            // Preparar o paramentro cliente
            const arrayCliente = await knex('Clientes')
            .where({'cod_Cliente': codCliente})
            .select('Clientes.nome_Cliente')

            const cliente = arrayCliente[0].nome_Cliente

            //Preparando lista de Hortalicas no Armazem
            const listaHortalica = await knex('Armazens')
            .where({'cod_Plantacao': codPlantacao})
            .whereNot({'quant_Restante_Hortalica': 0})
            .join('Hortalicas', 'Hortalicas.cod_Hortalica', '=', 'Armazens.cod_Hortalica')
            .select('Armazens.cod_Posicao_Armazem', 'Hortalicas.nome_Hortalica')

            return res.render('vendaEscolherHortalica.html', {listaHortalica, cliente})
        } catch (error) {
            next(error)
        }
    },
    async escolherHortalica(req, res, next){
        try {
            const codPlantacao = Number(local('plantacao'))
            const codCliente = Number(local('cliente'))

            // Preparar o paramentro cliente
            const arrayCliente = await knex('Clientes')
            .where({'cod_Cliente': codCliente})
            .select('Clientes.nome_Cliente')

            const cliente = arrayCliente[0].nome_Cliente
            

            //Preparanco lista de Hortalicas no Armazem
            const listaHortalica = await knex('Armazens')
            .where({'cod_Plantacao': codPlantacao})
            .whereNot({'quant_Restante_Hortalica': 0})
            .join('Hortalicas', 'Hortalicas.cod_Hortalica', '=', 'Armazens.cod_Hortalica')
            .select('Armazens.cod_Posicao_Armazem', 'Hortalicas.nome_Hortalica')

            // Preparar dados da hortalicas
            const {
                codPosicao
            } = req.body

            local('posicaoArmazem', String(codPosicao))

            const arrayHortalicas = await knex('Armazens')
            .where({'cod_Posicao_Armazem': codPosicao})
            .join('Hortalicas', 'Hortalicas.cod_Hortalica', '=', 'Armazens.cod_Hortalica')
            .select('Hortalicas.nome_Hortalica',
                    'Hortalicas.contagem_Hortalica', 
                    'Armazens.quant_Restante_Hortalica', 
                    'Armazens.valor_Hortalica')

            const hortalica = arrayHortalicas[0]

            var soma = 0
            
            // Calcular o restante de hortalicas no armazém
            for (let index = 0; index < arrayItensVenda.length; index++) {
               soma += (Number(arrayItensVenda[index].quant_Vendida))
            }

            const quantidade_Restante = hortalica.quant_Restante_Hortalica - soma

            return res.render('vendaEscolherHortalica.html', {cliente, listaHortalica, hortalica, quantidade_Restante, arrayItensVenda})
        } catch (error) {
            next(error)
        }
    },
    async adicioanarItem(req, res, next){
        try {
            const posicaoArmazem = Number(local('posicaoArmazem'))
            const codPlantacao = Number(local('plantacao'))
            const codCliente = Number(local('cliente'))

            // Preparar o paramentro cliente
            const arrayCliente = await knex('Clientes')
            .where({'cod_Cliente': codCliente})
            .select('Clientes.nome_Cliente')

            const cliente = arrayCliente[0].nome_Cliente
            

            //Preparanco lista de Hortalicas no Armazem
            const listaHortalica = await knex('Armazens')
            .where({'cod_Plantacao': codPlantacao})
            .whereNot({'quant_Restante_Hortalica': 0})
            .join('Hortalicas', 'Hortalicas.cod_Hortalica', '=', 'Armazens.cod_Hortalica')
            .select(
                'Armazens.cod_Posicao_Armazem', 
                'Hortalicas.nome_Hortalica', 
                'Hortalicas.cod_Hortalica',
                'Armazens.valor_Hortalica',
                'Hortalicas.contagem_Hortalica')

            // Preparando o arrayItensVenda
            const {
                quantHortalica
            } = req.body

            const hortalica = await knex('Armazens')
            .where({'cod_Posicao_Armazem': posicaoArmazem})
            .join('Hortalicas', 'Hortalicas.cod_Hortalica', '=', 'Armazens.cod_Hortalica')
            .select(
                'Armazens.cod_Posicao_Armazem', 
                'Hortalicas.nome_Hortalica', 
                'Hortalicas.cod_Hortalica',
                'Armazens.valor_Hortalica',
                'Hortalicas.contagem_Hortalica')

            const itemVenda = {
                quant_Vendida: quantHortalica,
                cod_Posicao_Armazem: posicaoArmazem,
                cod_Hortalica: hortalica[0].cod_Hortalica,
                nome_Hortalica: hortalica[0].nome_Hortalica,
                valor_Hortalica: hortalica[0].valor_Hortalica,
                contagem_Hortalica: hortalica[0].contagem_Hortalica
            }

                // Alimentando o array com as informações da compra
            if (quantHortalica > 0) {
                arrayItensVenda.push(itemVenda)
            }        

            return res.render('vendaEscolherHortalica.html', {cliente, listaHortalica, arrayItensVenda})
        } catch (error) {
            next(error)
        }
    },
    async finalizarVenda(req, res, next){
        try {
            // Dados para a consulta
            const codCliente = Number(local('cliente'))
            const emailUsuario = local('email')

            // Apresentar os dados da venda
            
                // Dados do Usuário: Nome do Usuario (nome e o tipo)
            const arrayUsuario = await knex('Usuarios')
            .where({'email_Usuario': emailUsuario})
            .select('Usuarios.nome_Usuario', 'Usuarios.tipo_Usuario')

            const usuario = arrayUsuario[0]

            // Data da compra
            const dt = String(new Date)
            const mes = dt.slice(4, 7)
            const dia = dt.slice(8,10)
            const ano = dt.slice(11, 15)
    
            const data = dia + ' de ' + mes + '. ' + ano

                // Dados do Cliente: nome, CNPJ, Telefone, cep, email

            const arrayCliente = await knex('Clientes')
            .where({'cod_Cliente':codCliente})
            .select()
            const cliente = arrayCliente[0]

                // Total da compra
            var total = 0
            for (let index = 0; index < arrayItensVenda.length; index++) {
                total = (arrayItensVenda[index].quant_Vendida * arrayItensVenda[index].valor_Hortalica)+ total;
            }
            
            return res.render('vendaFinalizar.html', {usuario, data, cliente, arrayItensVenda, total})
        } catch (error) {
            next(error)
        }
    },
    async salvarVenda(req, res, next){
        try {
            const codPlantacao = Number(local('plantacao'))
            const codCliente = Number(local('cliente'))
            const emailUsuario = local('email')

            var total = 0
            for (let index = 0; index < arrayItensVenda.length; index++) {
                
            }
            
            // Entrar os dados na tabela Pedidos_Venda
            await knex('Pedidos_Venda').insert({
                'cod_Pedido_Venda': null,
                'total_Venda': total,
                'cod_Cliente': codCliente,
                'email_Usuario_Vendeu': emailUsuario,
                'cod_Plantacao': codPlantacao
            })

            // Entrar os dadoa na tabela Itens_Venda

            const arrayPedido = await knex('Pedidos_Venda')
            .where({'cod_Plantacao': codPlantacao})
            .select('Pedidos_Venda.cod_Pedido_Venda')

            const codPedido = Number(arrayPedido[arrayPedido.length - 1].cod_Pedido_Venda)

            for (let index = 0; index < arrayItensVenda.length; index++) {
                await knex('Itens_Venda').insert({
                    'cod_Item_Venda': null,
                    'quant_vendida': arrayItensVenda[index].quant_Vendida,
                    'cod_Posicao_Armazem': arrayItensVenda[index].cod_Posicao_Armazem,
                    'cod_Hortalica':arrayItensVenda[index].cod_Hortalica,
                    'cod_Plantacao': codPlantacao,
                    'cod_Pedido_Venda': codPedido,
                })

                // Atualizar dados do Armazéns
                    // Busca da quantidade atual da hortalica
                const arrayQuantidade = await knex('Armazens')
                .where({'cod_Posicao_Armazem': arrayItensVenda[index].cod_Posicao_Armazem})
                .select('Armazens.quant_Restante_Hortalica')

                var quantidade = arrayQuantidade[0].quant_Restante_Hortalica - arrayItensVenda[index].quant_Vendida;

                    // Atualizar elemento
                await knex('Armazens')
                .where({'cod_Posicao_Armazem': arrayItensVenda[index].cod_Posicao_Armazem})
                .update({
                    'quant_Restante_Hortalica': quantidade 
                })
            }

            
            // Preparar a lista de itens no armazém
            const listaHortalica = await knex('Armazens')
            .where({'cod_Plantacao': codPlantacao})
            .whereNot({'Armazens.quant_Restante_Hortalica': 0})
            .join('Hortalicas', 'Hortalicas.cod_Hortalica', '=', 'Armazens.cod_Hortalica')
            .select('Armazens.cod_Posicao_Armazem', 'Hortalicas.nome_Hortalica', 'Armazens.quant_Restante_Hortalica', 'Hortalicas.contagem_Hortalica', 'Armazens.valor_Hortalica')
            
            return  res.render('venda.html', {listaHortalica})
        } catch (error) {
            next(error)
        }
    },

    // Funções para criar Cliente
    async adicionarCliente(req, res, next){
        try {
            return res.render('vendaCriarCliente.html')
        } catch (error) {
            next(error)
        }
    },
    async salvarCliente(req, res, next){
        try {
            // Inserir dados na tabela Clientes
            const {
                nomeCliente,
                docCliente,
                telefoneCliente,
                cepCliente,
                emailCliente
            } = req.body

            const codPlantacao = Number(local('plantacao'))

            await knex('Clientes').insert({
                'cod_Cliente': null,
                'nome_Cliente': nomeCliente,
                'email_Cliente': emailCliente,
                'telefone_Cliente': telefoneCliente,
                'cep_Cliente': cepCliente,
                'doc_Cliente': docCliente,
                'cod_Plantacao': codPlantacao
            })

            const listaCliente = await knex('Clientes')
            .where({'cod_Plantacao': codPlantacao})
            .select('Clientes.cod_Cliente', 'Clientes.nome_Cliente')

            console.log(listaCliente)

            return res.render('vendaEscolherCliente.html', {listaCliente})
        } catch (error) {
            next(error)
        }
    }

}