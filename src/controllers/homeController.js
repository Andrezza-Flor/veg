const knex = require('../database')
const e = require('express');
const { query } = require('express');
const { render } = require('nunjucks');

module.exports = {
    // Função de apresentação de Login
    async index(req,res) {

        try {
            console.log( req.query)

            return res.render('home.html');
        } catch (error) {
            next(error)
        }
    }
}