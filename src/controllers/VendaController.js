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
            console.log(arrayItensVenda)

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

            //Preparanco lista de Hortalicas no Armazem
            const listaHortalica = await knex('Armazens')
            .where({'cod_Plantacao': codPlantacao})
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
            .select('Hortalicas.nome_Hortalica', 'Hortalicas.contagem_Hortalica', 'Armazens.quant_Restante_Hortalica', 'Armazens.valor_Hortalica')

            const hortalica = arrayHortalicas[0]


            return res.render('vendaEscolherHortalica.html', {cliente, listaHortalica, hortalica})
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

            const itemVenda = {
                quant_Vendida: quantHortalica,
                cod_Posicao_Armazem: posicaoArmazem,
                cod_Hortalica: listaHortalica[0].cod_Hortalica,
                nome_Hortalica: listaHortalica[0].nome_Hortalica,
                valor_Hortalica: listaHortalica[0].valor_Hortalica,
                contagem_Hortalica: listaHortalica[0].contagem_Hortalica
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