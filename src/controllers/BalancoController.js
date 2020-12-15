const knex = require('../database')
const e = require('express')
const local = require('local-storage');

async function varreduraBalanco(codPlantacao) {
    // Capturar data atual
    const dataAtual = new Date();
    var totalAtivo = 0;
    var totalPassivo = 0

    // Buscar o cod_balanco para ser analisado
    const balanco = await knex('BalancosPatrimoniais')
    .where('cod_plantacao', codPlantacao)
    .where('ano_referencia', dataAtual.getFullYear())
    .select('cod_balanco');
    const codBalanco = balanco[0].cod_balanco;

    // Varredura dos ativos 
    const ativos = await knes('Ativos')
    .where('cod_balanco', codBalanco)
    .select()

    for (let index = 0; index < ativos.length; index++) {
        var dataAtivo = new Date(ativos[i].data_ativo);
        
        if ( dataAtivo <= dataAtual ){
            if ( ativos[i].status_ativo == 0 ){
                await knex('Ativos')
                .where('cod_ativo', ativos[i].cod_ativo)
                .update({
                    'status_ativo': 1,
                })
            } 

            totalAtivo = totalAtivo + Number(ativos[index].valor_ativo)
        } else {
            if ( ativos[i].status_ativo == 1 ){
                await knex('Ativos')
                .where('cod_ativo', ativos[i].cod_ativo)
                .update({
                    'status_ativo': 0,
                })
            }
        }
    }


    // Varredura dos passivos 
    const passivos = await knes('Passivos')
    .where('cod_balanco', codBalanco)
    .select()

    for (let index = 0; index < passivos.length; index++) {
        var dataPassivo = new Date(passivos[index].data_passivo);
        
        if ( dataPassivo <= dataAtual ){
            if ( passivos[index].status_passivo == 0 ){
                await knex('Passivos')
                .where('cod_passivo', passivos[index].cod_passivo)
                .update({
                    'status_passivo': 1,
                })
            } 

            totalPassivo = totalPassivo + Number(passivos[index].valor_passivo)
        } else {
            if ( passivos[index].status_passivo == 1 ){
                await knex('Passivos')
                .where('cod_passivo', passivos[index].cod_passivo)
                .update({
                    'status_passivo': 0,
                })
            }
        }
    }

    const patrimonioLiquido = totalAtivo - totalPassivo;

    await knex('BalancosPatrimoniais')
    .where('cod_plantacao', codPlantacao)
    .where('ano_referencia', dataAtual.getFullYear())
    .update({
        'patrimonio_liquido': patrimonioLiquido,
    })

    
}

module.exports = {
    // Função de apresentação Ativos Circulantes
    async ativoCirculante(req,res, next) {
        try {
            return  res.render('Balanco/ativoCirculante.html')
        } catch (error) {
            return next(error)
        }
        
    },

    // Função de apresentação Ativos Permanente
    async ativoPermanente(req,res, next) {
        try {
            return  res.render('Balanco/ativoPermanente.html')
        } catch (error) {
            return next(error)
        }
        
    },

    // Função de apresentação Passivo Circulantes
    async passivoCirculante(req,res, next) {
        try {
            return  res.render('Balanco/passivoCirculante.html')
        } catch (error) {
            return next(error)
        }
        
    },

    // Função de apresentação Passivo Permanente
    async passivoPermanente(req,res, next) {
        try {
            return  res.render('Balanco/passivoPermanente.html')
        } catch (error) {
            return next(error)
        }
        
    },

   
}