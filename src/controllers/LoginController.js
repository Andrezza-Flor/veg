const knex = require('../database')
const e = require('express')

module.exports = {
    // Função de apresentação de Login
    async index(req,res) {
        const results = await knex('Logins')
        .join('Usuarios', 'Logins.email_Usuario', '=', 'Usuarios.email_Usuario')
        .select('Usuarios.*', 'Logins.tipo_Usuario')


    return res.json(results)
    },
        // Função de criação de Login **
    async create(req, res, next) {

             
    },

    // Função de atualizar o Login **
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

    //Função de deletar o Login **
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