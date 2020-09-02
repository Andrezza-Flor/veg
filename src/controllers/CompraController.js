const knex = require('../database')
const e = require('express')

module.exports = {
    // Função de apresentação de Compra
    async index(req,res, next) {
        try {
            const results = await knex('Pedidos_Compra')
            // .join('Itens_Venda', 'Itens_Venda.cod_Pedido_Venda', '=', 'Pedidos_Venda.cod_Pedido_Venda')
            // .select('Pedidos_Venda.*', 'Itens_Venda.cod_Hortalica', 'Itens_Venda.quant_Hortalica')
            return res.json(results)
        } catch (error) {
            next(error)
        }
    },

    // Função de criação de Compra 
    async create(req, res, next) {

        try {

            const { 
                cod_Armazem,
                itens
             } = req.body


            const cods = await knex('Pedidos_Compra')
              .insert({
                cod_Pedido_Compra: null,
                cod_Armazem
              })
              .select('cod_Pedido_Compra');
            
            const cod = cods[ cods.length -1 ]

            for (var i = 0; i < itens.length; i++) {
                var { 
                    quat_Total_Insumo,
                    cod_Fornecedor,
                    cod_Insumo
                 } = itens[i]

                await knex('Itens_Compra').insert({ 
                    cod_Item_Compra: null,
                    quat_Total_Insumo,
                    quat_Restante_Insumo: quat_Total_Insumo,
                    cod_Pedido_Compra: cod,
                    cod_Fornecedor,
                    cod_Insumo
                 })
            }

            

            return res.status(201).send()

        } catch (error) {
            next(error)
        }        
    },

    // Função de atualizar o Compra **
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

    //Função de deletar o Compra **
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