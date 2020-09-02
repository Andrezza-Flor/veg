const knex = require('../database')
const e = require('express')

module.exports = {
    // Função de apresentação de Platacao
    async index(req, res, next) {
        try {
            const results = await knex('Plantacoes')
            return res.json(results)

        } catch (error) {
            next(error)
        }
        
    },

    // Função de criação de Plantacao **
    async create(req, res, next) {

        try {

            const { 
                email_Usuario,
                nome_Usuario,
                telefone_Usuario,
                cpf_Usuario,
                dt_Nasc_Usuario
             } = req.body

            await knex('Usuarios').insert({
                email_Usuario,
                nome_Usuario,
                telefone_Usuario,
                cpf_Usuario,
                dt_Nasc_Usuario
            })

            return res.status(201).send()

        } catch (error) {
            next(error)
        }        
    },

    // Função de atualizar o Plantacao **
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

    //Função de deletar o Plantacao **
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