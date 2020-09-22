const knex = require('../database')
const e = require('express');
const local = require('local-storage');
const { query } = require('express');
const { render } = require('nunjucks');
const { use } = require('../routes');

module.exports = {
    // Função de apresentação de Colaborador
    async indexCriar(req,res, next) {
        try {
            const codPlantacao = Number(local.get('plantacao'))

            const itensUsuarios = await knex('Logins')
            .where({cod_Plantacao: codPlantacao})
            .join('Usuarios', 'Usuarios.email_Usuario', '=', 'Logins.email_Usuario')
            .select('Usuarios.nome_Usuario', 'Usuarios.tipo_Usuario')

            const usuarios = []
            for (var i = 0; i < itensUsuarios.length; i++) {
                for (let j = 0; j < 1; j++) {
                    usuarios.push(itensUsuarios[i].tipo_Usuario + ' - ' + itensUsuarios[i].nome_Usuario)
                }
            }

            return res.render('atividadesCriar.html', { usuarios })
        } catch (error) {
            next(error)
        }
        
    },
    // Função de criação de Colaborador **
    async create(req, res, next) {
        try {

            const email = local.get(' email ');
            const codPlantacao = Number(local.get('plantacao'))

            const itensUsuarios = await knex('Logins')
            .where({cod_Plantacao: codPlantacao})
            .join('Usuarios', 'Usuarios.email_Usuario', '=', 'Logins.email_Usuario')
            .select('Usuarios.email_Usuario')

            const usuarios = []
            for (var i = 0; i < itensUsuarios.length; i++) {
                for (let j = 0; j < 1; j++) {
                    usuarios.push(itensUsuarios[i].email_Usuario)
                }
            }

            const {    
                nomeAtividade,
                dtAtividade,
                descAtividade,
                atorAtividade
             } = req.body

            await knex('Atividades').insert({
                cod_Atividade: null,
                nome_Atividade: nomeAtividade,
                data_Atividade: dtAtividade,
                descricao_Atividade: descAtividade,
                status_Atividade: 'parada',
                autor_Atividade: email,
                ator_Atividade: usuarios[atorAtividade],
                cod_Plantacao: codPlantacao
            })
    
            return res.render('atividades.html')
    

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