const knex = require('../database')
const e = require('express')

module.exports = {
    // Função de apresentação de Colaborador
    async index(req,res) {

        const results = await knex('Logins')
            .whereNot({tipo_Usuario: 'Gerente'})
            .join('Usuarios', 'Logins.email_Usuario', '=', 'Usuarios.email_Usuario')
            .select('Usuarios.*', 'Logins.tipo_Usuario')


        return res.json(results)
    },

    // Função de criação de Colaborador **
    async create(req, res, next) {

        try {

            const { 
                email_Usuario,
                nome_Usuario,
                telefone_Usuario,
                cpf_Usuario,
                dt_Nasc_Usuario,
                senha_Usuario,
                tipo_Usuario,
                email_Gerente
             } = req.body

            await knex('Usuarios').insert({
                email_Usuario,
                nome_Usuario,
                telefone_Usuario,
                cpf_Usuario,
                dt_Nasc_Usuario
            })
            
            var cod = knex('Plantacoes')
            .where({ email_Gerente })
            .join('Usuarios', 'email_Usuario', '=', 'Plantacoes.email_Gerente')
            .select('Plantacoes.cod_Plantacao')

            const results = await cod


            await knex('Logins').insert({
                email_Usuario,
                senha_Usuario,
                tipo_Usuario,
                cod_Plantacao: cod
            })
                

            return res.status(201).send()

        } catch (error) {
            next(error)
        }        
    },

    // Função de atualizar o Colaborador ** 
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

    //Função de deletar o Colaborador **
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