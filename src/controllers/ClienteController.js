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

    // Funções para criar Cliente
    async criarCliente(req, res, next){
        try {
            return res.render('Cliente/criarCliente.html')
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

            await knex('Clientes').insert({
                'nome_cliente': nomeCliente.toUpperCase(),
                'email_cliente': emailCliente,
                'telefone_cliente': telefoneCliente,
                'cep_cliente': cepCliente,
                'doc_cliente': docCliente,
                'cod_plantacao': Number(local('plantacao'))
            })

            const listaCliente = await knex('Clientes')
            .where({'cod_plantacao': Number(local('plantacao'))})
            .select()
            
            return res.render('Cliente/cliente.html', {listaCliente})
        } catch (error) {
            next(error)
        }
    },
    
    async apresentarCliente(req, res, next){
        try {
            // Inserir dados na tabela Clientes
            const {
                codCliente
            } = req.body


            const listaCliente = await knex('Clientes')
            .where({'cod_cliente': codCliente})
            .select()
            
            const cliente = listaCliente[0]
            return res.render('Cliente/infoCliente.html', {cliente})
        } catch (error) {
            next(error)
        }
    },
    

}