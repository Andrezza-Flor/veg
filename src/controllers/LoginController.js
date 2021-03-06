const knex = require('../database')
const e = require('express');
const local = require('local-storage');
const { query } = require('express');
const { render } = require('nunjucks');
const { use } = require('../routes');

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
            // Resgate dos dados dos inputs.
            const {
                email,
                senha
            } = req.body;
            // Busca dos email e senha iguais no banco de dados.
            const dadoAcesso = await knex('Logins')
                .where({
                    email_usuario: email,
                    senha_usuario: senha
                })
                .select('email_Usuario')
            
            // Condição para verificar se a resposta da busca foi vazia.
            if (dadoAcesso.length == []) {
                var message = "Dados informados incorretos"
                // Retorno da mensagem de erro.
                return res.render('loginPage.html', { message } )
               
            } else {
                // Salvar o email inserido no Local Storage, para atividades dentro do Sistema
                local('email', email);

                //Busca do código da Plantação
                const cod = await knex.from('Logins')
                .where({email_usuario: email})
                .select('Logins.cod_plantacao')

                const codPlantacao = String(cod[0].cod_plantacao);
                // Salvar o código da Plantação no Local Storage, para atividades dentro do Sistema
                local ('plantacao', codPlantacao)

                // // Preparar o parâmetro numCelerio
                // const arrayCeleiro = await knex('Celeiros')
                // .where({'cod_plantacao': codPlantacao})
                // .select('cod_posicao_celeiro')

                // const numCeleiro = arrayCeleiro.length

                // // Preparar o parâmetro num Armazem
                // const arrayArmazem = await knex('Armazens')
                // .where({'cod_plantacao': codPlantacao})
                // .select('cod_posicao_Armazem')

                // const numArmazem = arrayArmazem.length

                // // Preparar o parâmetro numEstura
                // const arrayEstufa = await knex('Plantio')
                // .where({'cod_Plantacao': codPlantacao})
                // .select('cod_Plantacao_Hortalica')

                // const numEstufa = arrayEstufa.length

                // // Preparar o parâmetro numAtiviadade
                // const arrayAtividade = await knex('Atividades')
                // .where({'ator_Atividade': email})
                // .select('cod_Atividade')

                // const numAtividade = arrayAtividade.length

                // Retorno positivo, reinderizando para dentro do sistema 
                return res.render('home.html')
            }

        } catch (error) {
            // Captura de erro
            next(error)
        }             
    }
}
