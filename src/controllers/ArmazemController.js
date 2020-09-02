const knex = require('../database')
const e = require('express')

module.exports = {
    // Função de apresentação de Armazem
    async index(req, res, next) {
        try {
            const results = await knex('Armazens')
            return res.json(results)

        } catch (error) {
            next(error)
        }
        
    },

    // Função de criação de Armazem **
    async create(req, res, next) {

             
    },

    // Função de atualizar o Armazem ** 
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

    //Função de deletar o Armazem **
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