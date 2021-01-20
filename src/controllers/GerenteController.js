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
                email_usuario: emailUsuario,
                nome_usuario: nomeUsuario,
                telefone_usuario: telefoneUsuario,
                cpf_usuario: cpfUsuario,
                dt_nasc_usuario: dtNascimento,
                tipo_usuario: 'Gerente'
            })
            
            // Inserção de dados no Banco de Dado - Tabela Platacoes
            await knex('Plantacoes').insert({
                cod_plantacao: null,
                email_gerente: emailUsuario
            })

            // Captura do codigo da plantação
            const cod = await knex('Plantacoes')
            .where({email_Gerente: emailUsuario})
            .select('cod_plantacao')
            
            // Inserção de dados no Banco de Dados - Tabela Logins
            await knex('Logins').insert({
                email_usuario: emailUsuario,
                senha_usuario: senhaUsuario1,
                cod_plantacao: parseInt(cod[0].cod_plantacao)
            })

            var dataAtual = new Date();
            const  mesReferencia = dataAtual.getMonth() + '-' + dataAtual.getFullYear();
            const anoReferencia = dataAtual.getFullYear();

            await knex('FluxoCaixa').insert({
                'mes_referencia': mesReferencia,
                'cod_plantacao': parseInt(cod[0].cod_plantacao),
                'capital_inicial': 0,
                'saldo_operacional': 0,
                'saldo_transportar': 0,
            })

            await knex('BalancosPatrimoniais').insert({
                'cod_plantacao': Number(cod[0].cod_plantacao),
                'ano_referencia': anoReferencia,
                'valor_Ativo': 0,
                'valor_Passivo': 0,
                'patrimonio_liquido': 0,
                'capital_social': 0,
            })

            const codBalancoAtual = await knex('BalancosPatrimoniais')
            .where('cod_balanco', Number(cod[0].cod_plantacao))
            .select()

            // Criando o Ativo
            await knex('Ativos')
            .insert({
                'cod_balanco': codBalancoAtual[codBalancoAtual.length - 1].cod_balanco,
                'cod_plantacao': Number(cod[0].cod_plantacao),
                'tipo_ativo': 'ATIVO CIRCULANTE',
                'nome_ativo': 'CAIXA - ' + anoReferencia,
                'valor_ativo': 0,
                'data_ativo': dataAtual,
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

        return  res.render('Perfil/perfilEditar.html', {dadosUsuario})

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
            .where({'Usuarios.email_usuario': email})
            .join('Logins', 'Logins.email_usuario', '=', 'Usuarios.email_usuario')
            .select('Usuarios.*', 'Logins.dt_admisso_usuario')

            var dt = String(dadosPerfil[0].dt_admisso_usuario)
            var mes = dt.slice(4, 7)
            var dia = dt.slice(8,10)
            var ano = dt.slice(11, 15)

            var data = dia + ' de ' + mes + '. ' + ano

            dadosPerfil[0].dt_admisso_usuario = data;


            var dt = String(dadosPerfil[0].dt_nasc_usuario)
            var mes = dt.slice(4, 7)
            var dia = dt.slice(8,10)
            var ano = dt.slice(11, 15)

            var data = dia + ' de ' + mes + '. ' + ano

            dadosPerfil[0].dt_nasc_usuario = data;
            
            const usuario = dadosPerfil[0]

            return res.render('Perfil/perfil.html', { usuario });
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