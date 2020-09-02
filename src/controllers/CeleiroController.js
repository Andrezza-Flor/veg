const knex = require('../database')
const e = require('express')

module.exports = {
    // Função de apresentação de Celeiro
    async index(req, res, next) {
        try {
            const results = await knex('Celeiros_Hortalicas')
            return res.json(results)

        } catch (error) {
            next(error)
        }
        
    },

    // Função de criação de Celeiro
    async create(req, res, next) {
        try {

            const { 
                cod_Celeiro,
                cod_Hortalica,
                quant_Hortalica,
                valor_Hortalica,
                validade_Hortalica
             } = req.body

            await knex('Celeiros_Hortalicas').insert({
                cod_Celeiro,
                cod_Hortalica,
                quant_Hortalica,
                valor_Hortalica,
                validade_Hortalica
            })
            
            return res.send()
        } catch (error) {
            next(error)
        }

       
             
    },

    // Função de atualizar o Celeiro ** 
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

    //Função de deletar o Celeiro **
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