const knex = require('../database')
const e = require('express')

module.exports = {
    // Função de apresentação de  usuarios
    async index(req,res) {
        const results = await knex('Usuarios')
        return res.json(results)
    },

    // Função de criação de usuario
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

    // Função de atualizar o usuario 
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

    //Função de deletar o usuario
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