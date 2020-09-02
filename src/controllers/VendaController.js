const knex = require('../database')
const e = require('express')

module.exports = {
    // Função de apresentação de Venda
    async index(req,res, next) {
        try {
            const results = await knex('Pedidos_Venda')
            .join('Itens_Venda', 'Itens_Venda.cod_Pedido_Venda', '=', 'Pedidos_Venda.cod_Pedido_Venda')
            .select('Pedidos_Venda.*', 'Itens_Venda.quant_Hortalica', 'Itens_Venda.cod_Hortalica')
            return res.json(results)
        } catch (error) {
            next(error)
        }
    },

    // Função de criação de Venda
    async create(req, res, next) {

        try {

            const { 
                cod_Cliente,
                itens
             } = req.body


            const cods = await knex('Pedidos_Venda')
              .insert({
                cod_Pedido_Venda: null,
                cod_Cliente
              })
              .select('cod_Pedido_Venda');
            
            const cod = cods[ cods.length -1 ]

            for (var i = 0; i < itens.length; i++) {
                var { 
                    quant_Hortalica,
                    cod_Celeiro,
                    cod_Hortalica
                 } = itens[i]

                await knex('Itens_Venda').insert({ 
                    cod_Item_Venda: null,
                    quant_Hortalica,
                    cod_Celeiro,
                    cod_Hortalica,
                    cod_Pedido_Venda: cod
                 })
            }

            

            return res.status(201).send()

        } catch (error) {
            next(error)
        }        
    },

    // Função de atualizar o Venda **
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

    //Função de deletar o Venda
    async delete(req, res, next) {
        try {
            const { cod_Pedido_Venda } = req.params

            await knex('Pedidos_Venda')
            .where({ cod_Pedido_Venda })
            .del()

            return res.send()

        } catch (error) {
            next(error)
            
        }
    }
}