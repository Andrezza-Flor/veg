const knex = require('../database')
const e = require('express');
const local = require('local-storage');
const { query } = require('express');
const { render } = require('nunjucks');
const { use } = require('../routes');
const { where } = require('../database');
const { celeiro } = require('./MenuController');
const { detalheInsumo } = require('./CeleiroController');

module.exports = {

    async detalheHortalica (req, res, next) {
        try {
            const {
                codPosicao
            } = req.body

            local('posicaoArmazem', String(codPosicao))

            // Busca na tabela para completar o Form
            const arrayHortalicas = await knex('Armazens')
            .join('Colheita', 'Colheita.cod_Posicao_Armazem', '=', 'Armazens.cod_Posicao_Armazem')
            .where({'Armazens.cod_Posicao_Armazem': codPosicao})
            .join('Hortalicas', 'Hortalicas.cod_Hortalica', '=', 'Armazens.cod_Hortalica')
            .join('Usuarios', 'Usuarios.email_Usuario', 'Colheita.email_Usuario_Colheu')
            .join('Plantio', 'Plantio.cod_Plantacao_Hortalica', '=', 'Colheita.cod_Plantacao_Hortalica')
            .select(
                'Hortalicas.nome_Hortalica', 
                'Hortalicas.contagem_Hortalica',
                'Armazens.quant_Restante_Hortalica', 
                'Armazens.valor_Hortalica', 
                'Usuarios.nome_Usuario', 
                'Usuarios.tipo_Usuario',
                'Plantio.dt_Plantio',
                'Colheita.dt_Colheita'
            )

            // Convertendo array em objeto
            const hortalica = arrayHortalicas[0]

            const now = new Date(hortalica.dt_Colheita); // Data de hoje
            const past = new Date(hortalica.dt_Plantio); // data do Plantio
            const diff = Math.abs(now.getTime() - past.getTime()); // Subtrai uma data pela outra
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24)); 
            const contagem = 'dia'
            if (days != 1){
                contagem = 'dias'
            }

            return res.render('armazemDetalhe.html', {hortalica, days, contagem})
        } catch (error) {
            next(error)
        }
    },

    async paginaEdicao(req, res, next){
        try {

            const codPosicao = Number(local('posicaoArmazem'))
            
            // Busca na tabela para completar o Form
            const arrayHortalicas = await knex('Armazens')
            .join('Colheita', 'Colheita.cod_Posicao_Armazem', '=', 'Armazens.cod_Posicao_Armazem')
            .where({'Armazens.cod_Posicao_Armazem': codPosicao})
            .join('Hortalicas', 'Hortalicas.cod_Hortalica', '=', 'Armazens.cod_Hortalica')
            .join('Usuarios', 'Usuarios.email_Usuario', 'Colheita.email_Usuario_Colheu')
            .join('Plantio', 'Plantio.cod_Plantacao_Hortalica', '=', 'Colheita.cod_Plantacao_Hortalica')
            .select(
                'Hortalicas.nome_Hortalica', 
                'Hortalicas.contagem_Hortalica',
                'Armazens.quant_Restante_Hortalica', 
                'Armazens.valor_Hortalica', 
                'Usuarios.nome_Usuario', 
                'Usuarios.tipo_Usuario',
                'Plantio.dt_Plantio',
                'Colheita.dt_Colheita'
            )

            // Convertendo array em objeto
            const hortalica = arrayHortalicas[0]

            const now = new Date(hortalica.dt_Colheita); // Data de hoje
            const past = new Date(hortalica.dt_Plantio); // data do Plantio
            const diff = Math.abs(now.getTime() - past.getTime()); // Subtrai uma data pela outra
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24)); 
            const contagem = 'dia'
            if (days != 1){
                contagem = 'dias'
            }

            return res.render('armazemEditar.html', {hortalica, days, contagem})
        } catch (error) {
            next(error)
        }
    },

    async editarHortalica(req, res, next){
        try {
            const {
                quantRestante,
                valorHortalica
            } = req.body

            const codPosicao = Number(local('posicaoArmazem'))

            await knex('Armazens')
            .where({'cod_Posicao_Armazem': codPosicao})
            .update({
                'quant_Restante_Hortalica': quantRestante,
                'valor_Hortalica': valorHortalica
            })

            // Busca na tabela para completar o Form
            const arrayHortalicas = await knex('Armazens')
            .join('Colheita', 'Colheita.cod_Posicao_Armazem', '=', 'Armazens.cod_Posicao_Armazem')
            .where({'Armazens.cod_Posicao_Armazem': codPosicao})
            .join('Hortalicas', 'Hortalicas.cod_Hortalica', '=', 'Armazens.cod_Hortalica')
            .join('Usuarios', 'Usuarios.email_Usuario', 'Colheita.email_Usuario_Colheu')
            .join('Plantio', 'Plantio.cod_Plantacao_Hortalica', '=', 'Colheita.cod_Plantacao_Hortalica')
            .select(
                'Hortalicas.nome_Hortalica', 
                'Hortalicas.contagem_Hortalica',
                'Armazens.quant_Restante_Hortalica', 
                'Armazens.valor_Hortalica', 
                'Usuarios.nome_Usuario', 
                'Usuarios.tipo_Usuario',
                'Plantio.dt_Plantio',
                'Colheita.dt_Colheita'
            )

            // Convertendo array em objeto
            const hortalica = arrayHortalicas[0]

            const now = new Date(hortalica.dt_Colheita); // Data de hoje
            const past = new Date(hortalica.dt_Plantio); // data do Plantio
            const diff = Math.abs(now.getTime() - past.getTime()); // Subtrai uma data pela outra
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24)); 
            const contagem = 'dia'
            if (days != 1){
                contagem = 'dias'
            }
                        

            return res.render('armazemDetalhe.html', {hortalica, days, contagem})
        } catch (error) {
            next(error)
        }
    }
}