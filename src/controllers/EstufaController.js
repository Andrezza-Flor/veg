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

    async paginaAplicarInsumo (req, res, next) {
        try {
            const codPlantacao = Number(local('plantacao'))

            // Lista de Insumos no Celeiro
            const listaInsumo = await knex('Celeiros')
            .where({'cod_Plantacao': codPlantacao})
            .join('Insumos', 'Insumos.cod_Insumo', 'Celeiros.cod_Insumo')
            .join('Fornecedores', 'Fornecedores.cod_Fornecedor', '=', 'Celeiros.cod_Fornecedor')
            .select('Celeiros.cod_Insumo', 'Celeiros.cod_posicao_celeiro', 'Insumos.nome_Insumo', 'Fornecedores.nome_Fornecedor')

            return res.render('estufaAplicarInsumo.html', {listaInsumo})
        } catch (error) {
            next(error)
        }
    },

    async buscarInsumo(req, res, next){
        try {
            const codPlantacao = Number(local('plantacao'))

            // Lista de Insumos no Celeiro
            const listaInsumo = await knex('Celeiros')
            .where({'cod_Plantacao': codPlantacao})
            .whereNot({'Celeiros.quant_Insumo': 0})
            .join('Insumos', 'Insumos.cod_Insumo', 'Celeiros.cod_Insumo')
            .join('Fornecedores', 'Fornecedores.cod_Fornecedor', '=', 'Celeiros.cod_Fornecedor')
            .select('Celeiros.cod_Insumo', 'Celeiros.cod_posicao_celeiro', 'Insumos.nome_Insumo', 'Fornecedores.nome_Fornecedor')


            // Preparar parâmetro Insumo
            const {
                codPosicao
            } = req.body

            local('insumo', String(codPosicao))

            const arrayInsumo = await knex('Celeiros')
            .where({'cod_posicao_celeiro': codPosicao})
            .join('Insumos', 'Insumos.cod_Insumo', '=', 'Celeiros.cod_Insumo')
            .join('Fornecedores', 'Fornecedores.cod_Fornecedor', '=', 'Celeiros.cod_Fornecedor')
            .select('Insumos.nome_Insumo', 'Fornecedores.nome_Fornecedor', 'Insumos.contagem_Insumo', 'Celeiros.quant_Insumo')
            
            const Insumo = arrayInsumo[0]

            return res.render('estufaAplicarInsumo.html', {listaInsumo, Insumo})
        } catch (error) {
            next(error)
        }
    },

    async aplicarInsumo(req, res, next){
        try {
            const {
                quantInsumo
            } = req.body

            const codPlantacao = Number(local('plantacao'))
            const emailUsuario = local('email');
            const codPosicaoCeleiro = Number(local('insumo'))


            // Atualizar a tabela celeiro
            const arrayQuantInsumo = await knex('Celeiros')
            .where({'cod_posicao_celeiro': codPosicaoCeleiro})
            .select('quant_Insumo')

            const quantidadeInsumo = arrayQuantInsumo[0].quant_Insumo - quantInsumo

            await knex('Celeiros')
            .where({'cod_posicao_celeiro': codPosicaoCeleiro})
            .update({
                quant_Insumo: quantidadeInsumo
            })

            // Busca de dados do plantio
            const arrayInsumo = await knex('Celeiros')
            .where({'cod_posicao_celeiro': codPosicaoCeleiro})
            .whereNot({'Celeiros.quant_Insumo': 0})
            .join('Insumos', 'Insumos.cod_Insumo', '=', 'Celeiros.cod_Insumo')
            .select('Insumos.*', 'Celeiros.*')

            // Inserção de dados na Tabela Plantio
            await knex('Plantio').insert({
                cod_Plantacao_Hortalica: null,
                cod_Plantacao: codPlantacao,
                quant_Plantada: quantInsumo,
                email_Usuario_Plantou: emailUsuario,
                status_Plantio: 'plantado',
                tipo_Plantio: arrayInsumo[0].tipo_Insumo,
                cod_Insumo: arrayInsumo[0].cod_Insumo,
                cod_Fornecedor: arrayInsumo[0].cod_Fornecedor,
            })

            // Preparando parâmetro produção
            const producao = await knex('Plantio')
            .where({'cod_Plantacao': codPlantacao})
            .where({'status_Plantio':'plantado'})
            .where({'tipo_Plantio': 'plantar'})
            .join('Hortalicas', 'Hortalicas.cod_Insumo', 'Plantio.cod_Insumo')
            .select('Hortalicas.nome_Hortalica', 'Plantio.quant_Plantada', 'Plantio.dt_Plantio', 'Plantio.cod_Plantacao_Hortalica')

            for (let i = 0; i < producao.length; i++) {
                const now = new Date(); // Data de hoje
                const past = new Date(producao[i].dt_Plantio); // data do Plantio
                const diff = Math.abs(now.getTime() - past.getTime()); // Subtrai uma data pela outra
                const days = Math.ceil(diff / (1000 * 60 * 60 * 24)); 

                producao[i].dt_Plantio = days
            }
            

            return  res.render('estufa.html', {producao})
        } catch (error) {
            next(error)
        }
    },

    async detalhePoduto(req, res, next){
        try {
            const {
                codPlantio
            } = req.body
            local('codPlantio', String(codPlantio))

            const arrayProduto  = await knex('Plantio')
            .where({'cod_Plantacao_Hortalica': codPlantio})
            .join('Hortalicas', 'Hortalicas.cod_Insumo', '=', 'Plantio.cod_Insumo')
            .join('Usuarios', 'Usuarios.email_Usuario', '=', 'Plantio.email_Usuario_Plantou')
            .select('Hortalicas.nome_Hortalica', 'Plantio.quant_Plantada', 'Plantio.dt_Plantio', 'Usuarios.nome_Usuario', 'Usuarios.tipo_Usuario')

           const produto = arrayProduto[0]

           // Calcular os dias de producao
            const now = new Date(); // Data de hoje
            const past = new Date(arrayProduto[0].dt_Plantio); // data do Plantio
            const diff = Math.abs(now.getTime() - past.getTime()); // Subtrai uma data pela outra
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24)); 
            
            return  res.render('estufaDetalhe.html', {produto, days})
        } catch (error) {
            next(error)
        }
    },

    async colherProduto(req, res, next){
        try {
            const codPlantacao = Number(local('plantacao'))
            const codPlantio = Number(local('codPlantio'))
            const usuario = local('email')

            const {
                quantProduto
            } = req.body

            // Saida do produto da Plantacao
                
            await knex('Plantio')
            .where({'cod_Plantacao_Hortalica': codPlantio})
            .update({
                'quant_Plantada': 0,
                'status_Plantio': 'colido'
            })
            
            // Cadastrar Colheita
            // Caso já tenha colido parte da produção
            try {
                await knex('Colheita').insert({
                    cod_Plantacao_Hortalica: codPlantio,
                    quant_Total_Colida: quantProduto,
                    email_Usuario_Colheu: usuario,
                })
            } catch {
                // Caso não consiga atualiza o que já existe
                const quantColheita = await knex('Colheita')
                .where({'cod_Plantacao_Hortalica': codPlantio})
                .select('quant_Total_Colida')
                
                const quantTotalColheita = quantColheita[0].quant_Total_Colida + Number(quantProduto)

                await knex('Colheita')
                .where({'cod_Plantacao_Hortalica': codPlantio})
                .update({
                    'quant_Total_Colida': quantTotalColheita
                })
            }
                
            //Entrada do produto no Armazem com dados de venda nulo
                //Busca de dados para a inserção
            const arrayProduto = await knex('Plantio')
            .where({'cod_Plantacao_Hortalica': codPlantio})
            .join('Hortalicas', 'Hortalicas.cod_Insumo', '=', 'Plantio.cod_Insumo')
            .select('Hortalicas.cod_Hortalica', 'Plantio.cod_Fornecedor')
            
            await knex('Armazens').insert({
                cod_Hortalica: arrayProduto[0].cod_Hortalica,
                cod_Fornecedor: arrayProduto[0].cod_Fornecedor,
                cod_Plantacao: codPlantacao,
                quant_Restante_Hortalica: quantProduto,
                valor_Hortalica: 0
            })
            

            // Preparando parâmetro produção
            const producao = await knex('Plantio')
            .where({'cod_Plantacao': codPlantacao})
            .where({'status_Plantio':'plantado'})
            .where({'tipo_Plantio': 'plantar'})
            .join('Hortalicas', 'Hortalicas.cod_Insumo', 'Plantio.cod_Insumo')
            .select('Hortalicas.nome_Hortalica', 'Plantio.quant_Plantada', 'Plantio.dt_Plantio', 'Plantio.cod_Plantacao_Hortalica')

            for (let i = 0; i < producao.length; i++) {
                const now = new Date(); // Data de hoje
                const past = new Date(producao[i].dt_Plantio); // data do Plantio
                const diff = Math.abs(now.getTime() - past.getTime()); // Subtrai uma data pela outra
                const days = Math.ceil(diff / (1000 * 60 * 60 * 24)); 

                producao[i].dt_Plantio = days
            }
            

            return  res.render('estufa.html', {producao})
        } catch (error) {
            next(error)
        }
    }
}