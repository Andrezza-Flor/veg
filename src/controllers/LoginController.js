const knex = require('../database')
const e = require('express');
const { query } = require('express');
const { render } = require('nunjucks');

module.exports = {
    // Função de apresentação de Login
    async index(req,res) {

        try {
            return res.render('loginPage.html');
        } catch (error) {
            next(error)
        }
    },

    async access(req, res, next) {
        try {
            const {
                email,
                senha
            } = req.body;
            
            const dadoAcesso = await knex('Logins')
                .where({
                    email_Usuario: email,
                    senha_Usuario: senha
                })
                .select('email_Usuario')
            
            if (dadoAcesso.length == []) {
                var message = "Dados informados incorretos"
                return res.render('loginPage.html', { message })
            } else {
                const {
                    email_Usuario
                } = dadoAcesso[0]
                
                let queryString = "?email=" + 'andrezza';

                return res.render("/home" + queryString)
            }
            
            
        } catch (error) {
            next(error)
        }             
    },

    // // Função de atualizar o Login **
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

//     //Função de deletar o Login **
//     async delete(req, res, next) {
//         try {
//             const { email_Usuario } = req.params

//             await knex('Usuarios')
//             .where({ email_Usuario })
//             .del()

//             return res.send()

//         } catch (error) {
//             next(error)
            
//         }
//     }
}