const knex = require('../database')
const e = require('express');
const local = require('local-storage');
const { query } = require('express');
const { render } = require('nunjucks');
const { use } = require('../routes');

const nomeDosMesesAbre = [
    'Jan. ',
    'Fev. ',
    'Mar. ',
    'Abr. ',
    'Maio ',
    'Jun. ',
    'Jul. ',
    'Ago. ',
    'Set. ',
    'Out. ',
    'Nov. ',
    'Dez. '
]

module.exports = {
    // Função de apresentação de Colaborador
    async apresentarColaborador(req,res) {
        return res.render('colaboradorCriarColaborador.html')
    },
    // Função de criação de Colaborador **
    async criarColaborador(req, res, next) {
        try {    
            return res.render('Colaborador/criarColaborador.html')
                    
        } catch (error) {
            next(error)
        }        
    },
    async cadastrarColaborador(req, res, next) {
        try {
            const {
                nomeColaborador,
                cpfColaborador,
                telefoneColaborador,
                dtNasciColaborador,
                salario,
                emailColaborador,
                senhaColaboradorI,
                senhaColaboradorII,
                funcaoColaborador
            } = req.body
            const now = new Date()

            if (senhaColaboradorI != senhaColaboradorII) {
                var mensagem = 'Senhas inconsistêntes'
                return res.render('Colaborador/criarColaborador.html', {mensagem})
            } 

            // Cadastrar o Usuário
            await knex('Usuarios')
            .insert({
                'email_usuario': emailColaborador,
                'nome_usuario': nomeColaborador,
                'telefone_usuario': telefoneColaborador,
                'dt_nasc_usuario': dtNasciColaborador,
                'cpf_usuario': cpfColaborador,
                'tipo_Usuario': funcaoColaborador
            })

            // Criando o acesso
            await knex('Logins')
            .insert({
                'email_usuario': emailColaborador,
                'senha_usuario': senhaColaboradorI,
                'cod_plantacao': Number(local('plantacao')),
                'dt_admisso_usuario': now
            })

            // Cadastrando Colaborador -. Entrar na folha de pagamento
            await knex('Colaboradores')
            .insert({
                'cod_plantacao': Number(local('plantacao')),
                'email_colaborador': emailColaborador,
                'salario_colaborador': salario,
                'data_contratacao': now,
                'data_termino': null,
            })
            
            const colaboradores = await knex("Colaboradores")
            .where('Colaboradores.cod_plantacao', Number(local('plantacao')))
            .whereNot('salario_colaborador', 0)
            .join('Usuarios', 'Usuarios.email_usuario', '=', 'Colaboradores.email_colaborador')
            .select('Colaboradores.cod_colaborador', 'Usuarios.nome_usuario', 'Usuarios.tipo_usuario')
            return  res.render('Colaborador/colaborador.html', {colaboradores})
                    
        } catch (error) {
            next(error)
        }        
    },
    // Função para apresentar dados dos Colaboradores
    async paginaDetalhe(req, res, next) {
        try {
            const {
                codColaborador
            } = req.body
            local('colaborador', String(codColaborador))
            
            const arrayColaborador = await knex('Colaboradores')
            .where('cod_colaborador', codColaborador)
            .join('Usuarios', 'Usuarios.email_usuario', 'Colaboradores.email_colaborador')
            .select()

            const dataAdmissao = new Date(arrayColaborador[0].data_contratacao)
            const dataNasciemnto = new Date(arrayColaborador[0].dt_nasc_usuario)

            const colaborador = {
                'nome': arrayColaborador[0].nome_usuario,
                'telefone': arrayColaborador[0].telefone_usuario,
                'cpf': arrayColaborador[0].cpf_usuario,
                'data_nascimento': dataNasciemnto.getDate() + ' ' + nomeDosMesesAbre[dataNasciemnto.getMonth()] + ' ' + dataNasciemnto.getFullYear(),
                'email': arrayColaborador[0].email_usuario,
                'tipo_usuairo': arrayColaborador[0].tipo_usuario,
                'data_admissao': dataAdmissao.getDate() + ' ' + nomeDosMesesAbre[dataAdmissao.getMonth()] + ' ' + dataAdmissao.getFullYear(),
                'salario': (arrayColaborador[0].salario_colaborador).toFixed(2),
            }

            return  res.render('Colaborador/infoColaborador.html', {colaborador})

        } catch (error) {
            next(error)
        }
    },
    //Função de deletar o Colaborador **
    async inabilitar(req, res, next) {
        try {
            const cod_colaborador = Number(local('colaborador'))
            const email_colaborador = await knex("Colaboradores")
            .where('cod_colaborador', cod_colaborador)
            .select()

            await knex('Logins')
            .where({'email_Usuario': email_colaborador[0].email_colaborador})
            .del()

            await knex('Colaboradores')
            .where('cod_colaborador', cod_colaborador)
            .update({
                'salario_colaborador': 0,
            })
            
            const colaboradores = await knex("Colaboradores")
            .where('Colaboradores.cod_plantacao', Number(local('plantacao')))
            .whereNot('salario_colaborador', 0)
            .join('Usuarios', 'Usuarios.email_usuario', '=', 'Colaboradores.email_colaborador')
            .select('Colaboradores.cod_colaborador', 'Usuarios.nome_usuario', 'Usuarios.tipo_usuario')
            return  res.render('Colaborador/colaborador.html', {colaboradores})

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


    
}