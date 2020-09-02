const knex = require('../database')
const e = require('express')

module.exports = {
    // Função de apresentação de gerente
    async index(req,res) {
        const results = await knex('Logins')
            .where({tipo_Usuario: 'Gerente'})
            .join('Usuarios', 'Logins.email_Usuario', '=', 'Usuarios.email_Usuario')
            .select('Usuarios.*', 'Logins.tipo_Usuario')


        return res.json(results)
        
    },

    // Função de criação de gerente
    async create(req, res, next) {

        try {

            const { 
                email_Usuario,
                nome_Usuario,
                telefone_Usuario,
                cpf_Usuario,
                dt_Nasc_Usuario,
                senha_Usuario
             } = req.body

            await knex('Usuarios').insert({
                email_Usuario,
                nome_Usuario,
                telefone_Usuario,
                cpf_Usuario,
                dt_Nasc_Usuario
            })
            
            await knex('Plantacoes').insert({
                cod_Plantacao: null,
                email_Gerente: email_Usuario
            })

            const cod = await knex('Plantacoes')
            .where({email_Gerente: email_Usuario})
            .select('cod_Plantacao')
            
            // Para cresgatar o inteiro do dado [object Object]
            var data = cod;
            var s = data[0].cod_Plantacao + "";
            var d = parseInt(s)

            await knex('Logins').insert({
                email_Usuario,
                senha_Usuario,
                tipo_Usuario: 'Gerente',
                cod_Plantacao: d
            })

            await knex('Armazens').insert({
                cod_Armazem: null,
                cod_Plantacao: d
            })

            await knex('Celeiros').insert({
                cod_Celeiro: null,
                cod_Plantacao: d
            })
                
            return res.status(201).send()

        } catch (error) {
            next(error)
        }        
    },

    // Função de atualizar o gerente **
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

    //Função de deletar o gernete **
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