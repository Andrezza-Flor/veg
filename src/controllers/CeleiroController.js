const knex = require('../database')
const e = require('express')
const { render } = require('nunjucks')

module.exports = {
    // Função de apresentação de Celeiro
    async index(req, res, next) {
        try {

            const itensProdutos = await knex('produtos')
            .select('produtos.nome_produto');
            const produtos = []

            for (var i = 0; i < itensProdutos.length; i++) {
                for (var j = 0; j < 1; j++) {
                    produtos.push(itensProdutos[i].nome_produto)
                }
            }
            
            return res.render('consulta_produto.html' , {produtos})

            return res.render('celeiro.html', { nomeInsumo })
        } catch (error) {
            next(error)
        }
        
    },

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