const knex = require('../database')
const e = require('express')
const { render } = require('nunjucks')

module.exports = {
    // Função de apresentação de Celeiro
    async detalheInsumo(req, res, next) {
        try {
            //prparar parâmetro insumo
           
            return res.render('celeiroDetalhe.html', {insumo, fornecedor})
        } catch (error) {
            next(error)
        }
        
    }

    // // Função de criação de Celeiro
    // async create(req, res, next) {
    //     try {

    //         const { 
    //             cod_Celeiro,
    //             cod_Hortalica,
    //             quant_Hortalica,
    //             valor_Hortalica,
    //             validade_Hortalica
    //          } = req.body

    //         await knex('Celeiros_Hortalicas').insert({
    //             cod_Celeiro,
    //             cod_Hortalica,
    //             quant_Hortalica,
    //             valor_Hortalica,
    //             validade_Hortalica
    //         })
            
    //         return res.send()
    //     } catch (error) {
    //         next(error)
    //     }

       
             
    // },

    // // Função de atualizar o Celeiro ** 
    // async update(req, res, next) {
    //     try {

    //         const { 
    //             nome_Usuario
    //          } = req.body

    //          const { email_Usuario } = req.params

    //         await knex('Usuarios')
    //         .update({ 
    //             nome_Usuario
    //          })
    //         .where({ email_Usuario })

    //         return res.send()

    //     } catch (error) {
    //         next(error)
    //     }
    // },

    // //Função de deletar o Celeiro **
    // async delete(req, res, next) {
    //     try {
    //         const { email_Usuario } = req.params

    //         await knex('Usuarios')
    //         .where({ email_Usuario })
    //         .del()

    //         return res.send()

    //     } catch (error) {
    //         next(error)
            
    //     }
    // }
}