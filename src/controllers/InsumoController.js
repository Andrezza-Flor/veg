const knex = require('../database')
const e = require('express')

module.exports = {
    // Função de apresentação de Insumo
    async index(req, res, next) {
        try {
            const results = await knex('Insumos')
            return res.json(results)
        } catch (error) {
            next(error)
        }

    },

    // Função de criação de Insumo
    async create(req, res, next) {

        try {

            const { 
                nome_Insumo,
                tipo_Insumo,
                contagem_Insumo,
                nome_Hortalica,
                contagem_Hortalica
             } = req.body

            await knex('Insumos').insert({
                cod_Insumo: null,
                nome_Insumo,
                tipo_Insumo,
                contagem_Insumo
            })

            const cod = await knex('Insumos')
            .where({ nome_Insumo })
            .select('Insumos.cod_Insumo')
            
            // Para cresgatar o inteiro do dado [object Object]
            var data = cod;
            var s = data[0].cod_Insumo + "";
            var d = parseInt(s)

            if (tipo_Insumo == 'plantar') {

                await knex('Hortalicas').insert({
                    cod_Hortalica: null,
                    nome_Hortalica,
                    cod_Insumo: d,
                    contagem_Hortalica
                })
            }

            return res.status(201).send()

        } catch (error) {
            next(error)
        }        
    },

    // Função de atualizar o Insumo **
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

    //Função de deletar o Insumo
    async delete(req, res, next) {
        try {
            const { cod_Insumo } = req.params

            await knex('Insumos')
            .where({ cod_Insumo })
            .del()

            return res.send()

        } catch (error) {
            next(error)
            
        }
    }
}