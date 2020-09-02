const knex = require('../database')
const e = require('express')

module.exports = {
    // Função de apresentação de Cliente
    async index(req, res, next) {
        try {
            const { cod_Plantacao } = req.params

            const results = await knex('Clientes')
            .where({cod_Plantacao})
            .join('Clientes_Plantacoes', 'Clientes_Plantacoes.cod_Cliente', '=', 'Clientes.cod_Cliente')
            .select('Clientes.*', 'Clientes_Plantacoes.Cod_Plantacao')

            return res.json(results)

        } catch (error) {
            next(error)
        }
        
    },

    // Função de criação de Cliente
    async create(req, res, next) {
        try {
            const {
                cod_Plantacao,
                nome_Cliente,
                email_Cliente,
                telefone_Cliente,
                cep_Cliente,
                doc_Cliente
            } = req.body

            await knex('Clientes').insert({
                cod_Cliente: null,
                nome_Cliente,
                email_Cliente,
                telefone_Cliente,
                cep_Cliente,
                doc_Cliente
            })

            const cod = await knex('Clientes')
            .where({ doc_Cliente })
            .select('cod_Cliente')
            
            // Para cresgatar o inteiro do dado [object Object]
            var data = cod;
            var s = data[0].cod_Cliente + "";
            var d = parseInt(s)

            await knex('Clientes_Plantacoes').insert({
                cod_Plantacao,
                cod_Cliente: d
            })

            return res.status(201).send()

        } catch (error) {
            next(error)
        }
             
    },

    // Função de atualizar o Cliente ** 
    async update(req, res, next) {
        try {

            const { 
                nome_Usuario
             } = req.body

             const { email_Usuario } = req.params

            await knex('Usuarios')
            .update({ 
                nome_Usuario
             })
            .where({ email_Usuario })

            return res.send()

        } catch (error) {
            next(error)
        }
    },

    //Função de deletar o Cliente **
    async delete(req, res, next) {
        try {
            const { email_Usuario } = req.params

            await knex('Usuarios')
            .where({ email_Usuario })
            .del()

            return res.send()

        } catch (error) {
            next(error)
            
        }
    }
}