const knex = require('../database');
const e = require('express');
const local = require('local-storage');

module.exports = {
    async celeiro(req,res) {
        try {
            return  res.render('celeiro.html')
        } catch (error) {
            return next(error)
        }
        
    },
    async armazem(req,res) {
        try {
            return  res.render('armazem.html')
        } catch (error) {
            return next(error)
        }
        
    },
    async compra(req,res) {
        try {
            return  res.render('compra.html')
        } catch (error) {
            return next(error)
        }
        
    },
    async venda(req,res) {
        try {
            return  res.render('venda.html')
        } catch (error) {
            return next(error)
        }
        
    },
    async colaborador(req,res) {
        try {
            return  res.render('colaborador.html')
        } catch (error) {
            return next(error)
        }
        
    },
    async estufa(req,res) {
        try {
            return  res.render('estufa.html')
        } catch (error) {
            return next(error)
        }
        
    },
    async relatorio(req,res) {
        try {
            return  res.render('relatorio.html')
        } catch (error) {
            return next(error)
        }
        
    },

    async atividade(req,res) {
        try {
            return  res.render('atividades.html')
        } catch (error) {
            return next(error)
        }
    },

    async perfil(req, res, next) {
        try {
            var email = local.get(' email ');

            const dadosPerfil = await knex.from('Usuarios')
            .where({email_Usuario: email})
            .select('Usuarios.*')

            const {
                nome_Usuario,
                cpf_Usuario,
                telefone_Usuario,
                dt_Nasc_Usuario,
                tipo_Usuario,
            } = dadosPerfil[0]

            return res.render('perfil.html', { nome_Usuario, cpf_Usuario, telefone_Usuario, dt_Nasc_Usuario, email, tipo_Usuario });

        } catch (error) {
            return next(error);
        }
        
    },

}

//, { nome_Usuario, cpf_Usuario, telefone_Usuario, dt_Nasc_Usuario, email_Usuario, tipo_Usuario, dt_Admisso_Usuario, }