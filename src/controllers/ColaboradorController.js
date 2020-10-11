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
                await knex('Usuarios').insert({
                    email_Usuario: emailColaborador,
                    nome_Usuario: nomeColaborador,
                    telefone_Usuario: telefoneColaborador,
                    cpf_Usuario: cpfColaborador,
                    dt_Nasc_Usuario: dtNasciColaborador,
                    tipo_Usuario: funcaoColaborador
                })
                
                const codPlantacao = Number(local('plantacao'))
    
                await knex('Logins').insert({
                    email_Usuario: emailColaborador,
                    senha_Usuario: senhaColaboradorI,
                    cod_Plantacao: codPlantacao,
                })
                  
    
                const listaColaborador = await knex('Logins')
                .where({'cod_Plantacao': codPlantacao})
                .whereNot({'tipo_Usuario': 'Gerente'})
                .join('Usuarios', 'Usuarios.email_Usuario', '=', 'Logins.email_Usuario')
                .select('Usuarios.nome_Usuario',
                        'Usuarios.email_Usuario',
                        'Usuarios.tipo_Usuario')
                
                return  res.render('colaborador.html', {listaColaborador})
    
            } else {
                const message = "Senha incompativeis"
                return res.render('colaboradorCriarColaborador.html', { message })
            }
            
        } catch (error) {
            next(error)
        }        
    },

    // Função para apresentar dados dos Colaboradores
    async paginaDetalhe(req, res, next) {
        try {
            const {
                emailUsuario
            } = req.body

            local('emailColaborador', emailUsuario)
            
            const arrayUsuario = await knex('Usuarios')
            .where({'Usuarios.email_Usuario': emailUsuario})
            .join('Logins', 'Logins.email_Usuario', '=', 'Usuarios.email_Usuario')
            .select('Logins.*', 'Usuarios.*')

            var dadosUsuario = arrayUsuario[0]
            var dt = String(dadosUsuario.dt_Admisso_Usuario)
            var mes = dt.slice(4, 7)
            var dia = dt.slice(8,10)
            var ano = dt.slice(11, 15)

            var data = dia + ' de ' + mes + '. ' + ano
            dadosUsuario.dt_Admisso_Usuario= data;

            dt = String(dadosUsuario.dt_Nasc_Usuario )
            mes = dt.slice(4, 7)
            dia = dt.slice(8,10)
            ano = dt.slice(11, 15)

            data = dia + ' de ' + mes + '. ' + ano
            dadosUsuario.dt_Nasc_Usuario = data; 

            console.log(dadosUsuario)

            return  res.render('colaboradorDetalhe.html', {dadosUsuario})

        } catch (error) {
            next(error)
        }
    },

    async paginaEditar(req, res, next) {
        try {
            const emailUsuario = local('emailColaborador')
            
            const arrayUsuario = await knex('Usuarios')
            .where({'Usuarios.email_Usuario': emailUsuario})
            .join('Logins', 'Logins.email_Usuario', '=', 'Usuarios.email_Usuario')
            .select('Logins.*', 'Usuarios.*')

            var dadosUsuario = arrayUsuario[0]
            var dt = String(dadosUsuario.dt_Admisso_Usuario)
            var mes = dt.slice(4, 7)
            var dia = dt.slice(8,10)
            var ano = dt.slice(11, 15)

            var data = dia + ' de ' + mes + '. ' + ano
            dadosUsuario.dt_Admisso_Usuario= data;

            dt = String(dadosUsuario.dt_Nasc_Usuario )
            mes = dt.slice(4, 7)
            dia = dt.slice(8,10)
            ano = dt.slice(11, 15)

            data = dia + ' de ' + mes + '. ' + ano
            dadosUsuario.dt_Nasc_Usuario = data; 


            return  res.render('colaboradorEditar.html', {dadosUsuario})

        } catch (error) {
            next(error)
        }
    },

    // Função de atualizar o Colaborador ** 
    async editar(req, res, next){
        try {
            const email = local('emailColaborador')
            const codPlantacao = local('plantacao')

            const {
                nomeUsuario,
                telefoneUsuario
            } = req.body

            

            await knex('Usuarios')
            .where({'Usuarios.email_Usuario': email})
            .join('Logins', 'Logins.email_Usuario', '=', 'Usuarios.email_Usuario')
            .update({ 
                'nome_Usuario': nomeUsuario,
                'telefone_Usuario': telefoneUsuario
             })

            const listaColaborador = await knex('Logins')
            .where({'cod_Plantacao': codPlantacao})
            .whereNot({'tipo_Usuario': 'Gerente'})
            .join('Usuarios', 'Usuarios.email_Usuario', '=', 'Logins.email_Usuario')
            .select('Usuarios.nome_Usuario',
                    'Usuarios.email_Usuario',
                    'Usuarios.tipo_Usuario')
            
            return  res.render('colaborador.html', {listaColaborador})
        } catch (error) {
            next(error)
        }
    },


    //Função de deletar o Colaborador **
    async inabilitar(req, res, next) {
        try {
            const email = local('emailColaborador')
            const codPlantacao = local('plantacao')

            await knex('Logins')
            .where({'email_Usuario': email })
            .del()

            const listaColaborador = await knex('Logins')
            .where({'cod_Plantacao': codPlantacao})
            .whereNot({'tipo_Usuario': 'Gerente'})
            .join('Usuarios', 'Usuarios.email_Usuario', '=', 'Logins.email_Usuario')
            .select('Usuarios.nome_Usuario',
                    'Usuarios.email_Usuario',
                    'Usuarios.tipo_Usuario')
            
            return  res.render('colaborador.html', {listaColaborador})

        } catch (error) {
            next(error)
            
        }
    }
}