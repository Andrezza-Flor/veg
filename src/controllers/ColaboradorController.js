const knex = require('../database')
const e = require('express');
const local = require('local-storage');
const { query } = require('express');
const { render } = require('nunjucks');
const { use } = require('../routes');

module.exports = {
    // Função de apresentação de Colaborador
    async index(req,res) {
        return res.render('colaboradorCriarColaborador.html')
    },
    // Função de criação de Colaborador **
    async create(req, res, next) {

        const email = local.get(' email ');

        try {

            const { 
                nomeColaborador,
                cpfColaborador,
                telefoneColaborador,
                dtNasciColaborador,
                emailColaborador,
                senhaColaboradorI,
                senhaColaboradorII,
                funcaoColaborador
             } = req.body

            if (senhaColaboradorI === senhaColaboradorII) {
                // await knex('Usuarios').insert({
                //     email_Usuario: emailColaborador,
                //     nome_Usuario: nomeColaborador,
                //     telefone_Usuario: telefoneColaborador,
                //     cpf_Usuario: cpfColaborador,
                //     dt_Nasc_Usuario: dtNasciColaborador,
                //     tipo_Usuario: funcaoColaborador
                // })
                
                const cod = await knex.from('Plantacoes')
                .where({email_Gerente: email})
                .select('Plantacoes.cod_Plantacao')


                const codPlantacao = cod[0].cod_Plantacao;
    
    
                await knex('Logins').insert({
                    email_Usuario: emailColaborador,
                    senha_Usuario: senhaColaboradorI,
                    cod_Plantacao: codPlantacao,
                })
                  
    
                return res.render('colaborador.html')
    
            } else {
                const message = "Senha incompativeis"
                return res.render('colaboradorCriarColaborador.html', { message })
            }
            
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
    async disable(req, res, next) {
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