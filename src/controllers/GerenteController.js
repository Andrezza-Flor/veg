const knex = require('../database')
const e = require('express')
const local = require('local-storage');
const { editarHortalica } = require('./ArmazemController');
const { returning } = require('../database');

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

    // Função de atualizar o dados do Usuário **
    async paginaEditar(req, res, next) {
        try {
            const email = local('email')
            
            const arrayUsuario = await knex('Usuarios')
            .where({'Usuarios.email_Usuario': email})
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

        return  res.render('perfilEditar.html', {dadosUsuario})

        } catch (error) {
            next(error)
        }
    },

    async editarPerfil(req, res, next){
        try {
            const email = local('email')

            const {
                nomeUsuario,
                telefoneUsuario,
                passUsuario
            } = req.body

            console.log(nomeUsuario, telefoneUsuario, passUsuario)

            await knex('Usuarios')
            .where({'Usuarios.email_Usuario': email})
            .join('Logins', 'Logins.email_Usuario', '=', 'Usuarios.email_Usuario')
            .update({ 
                'nome_Usuario': nomeUsuario,
                'telefone_Usuario': telefoneUsuario,
                'senha_Usuario': passUsuario
             })

            const dadosPerfil = await knex.from('Usuarios')
            .where({'Usuarios.email_Usuario': email})
            .join('Logins', 'Logins.email_Usuario', '=', 'Usuarios.email_Usuario')
            .select('Usuarios.*', 'Logins.dt_Admisso_Usuario')

            var dt = String(dadosPerfil[0].dt_Admisso_Usuario)
            var mes = dt.slice(4, 7)
            var dia = dt.slice(8,10)
            var ano = dt.slice(11, 15)

            var data = dia + ' de ' + mes + '. ' + ano

            dadosPerfil[0].dt_Admisso_Usuario = data;


            var dt = String(dadosPerfil[0].dt_Nasc_Usuario)
            var mes = dt.slice(4, 7)
            var dia = dt.slice(8,10)
            var ano = dt.slice(11, 15)

            var data = dia + ' de ' + mes + '. ' + ano

            dadosPerfil[0].dt_Nasc_Usuario = data;
            
            const usuario = dadosPerfil[0]

            return res.render('perfil.html', { usuario });
        } catch (error) {
            next(error)
        }
    },

    //Função de deletar o gernete **
    async inabilitar(req, res, next) {
        try {
            const email = local('email')
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
            
            return  res.render('loginPage.html')

        } catch (error) {
            next(error)
            
        }
    }
}