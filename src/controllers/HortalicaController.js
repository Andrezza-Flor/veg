const knex = require('../database')
const e = require('express')

module.exports = {
    // Função de apresentação de Hortalica
    async index(req, res, next) {
        try {
            const results = await knex('Hortalicas')
            return res.json(results)
        } catch (error) {
            next(error)
        }

    },

    // Função de criação de Hortalica **
    async create(req, res, next) {
    },

    // Função de atualizar o Hortalica **
    async update(req, res, next) {
    },

    //Função de deletar o Hortalica **
    async delete(req, res, next) {
        
    }
}