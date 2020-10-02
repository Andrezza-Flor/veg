const knex = require('../database')
const e = require('express')

module.exports = {
    // Função de apresentação de gerente
    async index(req,res) {
        try {
            return  res.render('cadastro.html')
        } catch (error) {
            return next(error)
        }
        
    },

    // Função de criação de gerente
    async create(req, res, next) {
        // Captura dos dados no body
        try {            
            const {
                nomeUsuario,
                cpfUsuario,
                telefoneUsuario,
                dtNascimento,
                emailUsuario,
                senhaUsuario1              
             } = req.body;

            // Inserção de dados no Banco de Dados - Tabela Usuarios
            await knex('Usuarios').insert({
                email_Usuario: emailUsuario,
                nome_Usuario: nomeUsuario,
                telefone_Usuario: telefoneUsuario,
                cpf_Usuario: cpfUsuario,
                dt_Nasc_Usuario: dtNascimento,
                tipo_Usuario: 'Gerente'
            })
            
            // Inserção de dados no Banco de Dado - Tabela Platacoes
            await knex('Plantacoes').insert({
                cod_Plantacao: null,
                email_Gerente: emailUsuario
            })

            // Captura do codigo da plantação
            const cod = await knex('Plantacoes')
            .where({email_Gerente: emailUsuario})
            .select('cod_Plantacao')
            
            // Para cresgatar o inteiro do dado [object Object]
            var data = cod;
            var s = data[0].cod_Plantacao + "";
            var d = parseInt(s)

            // Inserção de dados no Banco de Dados - Tabela Logins
            await knex('Logins').insert({
                email_Usuario: emailUsuario,
                senha_Usuario: senhaUsuario1,
                cod_Plantacao: d
            })
            
            // Reiderizando a página
            return res.render('loginPage.html')

        } catch (error) {
            next(error)
        }        
    },

    // // Função de atualizar o gerente **
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

    //     return  res.render('loginPage.html')

    //     } catch (error) {
    //         next(error)
    //     }
    // },

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