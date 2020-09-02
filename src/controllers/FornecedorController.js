const knex = require('../database')
const e = require('express')

module.exports = {
    // Função de apresentação de Fornecedor
    async index(req,res, next) {
        try {
            const results = await knex('Fornecedores_Insumos')
            .join('Fornecedores', 'Fornecedores.cod_Fornecedor', '=', 'Fornecedores_Insumos.cod_Fornecedor')
            .select('Fornecedores.*', 'Fornecedores_Insumos.cod_Insumo')
            return res.json(results)
        } catch (error) {
            next(error)
        }
        
    },

    // Função de criação de Fornecedor
    async create(req, res, next) {

        try {

            const { 
                doc_Fornecedor,
                nome_Fornecedor,
                telefone_Fornecedor,
                cep_Fornecedor,
                insumos
             } = req.body

            await knex('Fornecedores').insert({
                cod_Fornecedor: null,
                doc_Fornecedor,
                nome_Fornecedor,
                telefone_Fornecedor,
                cep_Fornecedor
            })
                
            const cod = await knex('Fornecedores')
            .where({doc_Fornecedor})
            .select('cod_Fornecedor')
            
            // Para cresgatar o inteiro do dado [object Object]
            var data = cod;
            var s = data[0].cod_Fornecedor + "";
            var d = parseInt(s)

            for (var i = 0; i < insumos.length; i++) {
                var { 
                    cod_Insumo,
                    valor_Insumo,
                    quant_por_Valor,
                    tempo_Entrega
                 } = insumos[i]
                await knex('Fornecedores_Insumos').insert({ 
                    cod_Fornecedor: d,
                    cod_Insumo,
                    valor_Insumo,
                    quant_por_Valor,
                    tempo_Entrega
                 })
            }

            

            return res.status(201).send()

        } catch (error) {
            next(error)
        }        
    },

    // Função de atualizar o Fornecedor **
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

    //Função de deletar o Fornecedor
    async delete(req, res, next) {
        try {
            const { cod_Fornecedor } = req.params

            await knex('Fornecedores')
            .where({ cod_Fornecedor })
            .del()

            return res.send()

        } catch (error) {
            next(error)
            
        }
    }
}