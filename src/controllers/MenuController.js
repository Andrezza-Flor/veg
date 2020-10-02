const knex = require('../database');
const e = require('express');
const local = require('local-storage');

module.exports = {
    async celeiro(req,res, next) {
        try {
            const codPlantacao = Number(local('plantacao'))
            const listaInsumo = await knex('Celeiros')
            .where({'cod_Plantacao': codPlantacao})
            .whereNot({'Celeiros.quant_Insumo': 0})
            .join('Insumos', 'Insumos.cod_Insumo', 'Celeiros.cod_Insumo')
            .join('Fornecedores', 'Fornecedores.cod_Fornecedor', 'Celeiros.cod_Fornecedor')
            .select('Celeiros.cod_Insumo', 'Insumos.nome_Insumo', 'Insumos.contagem_Insumo', 'Celeiros.quant_Insumo', 'Fornecedores.nome_Fornecedor')
            
            return  res.render('celeiro.html', {listaInsumo})
        } catch (error) {
            next(error)
        }
        
    },
    async armazem(req,res, next) {
        try {
            // Preparar a lista de itens no armazém
            const codPlantacao = Number(local('plantacao'))
            const listaHortalica = await knex('Armazens')
            .where({'cod_Plantacao': codPlantacao})
            .join('Hortalicas', 'Hortalicas.cod_Hortalica', '=', 'Armazens.cod_Hortalica')
            .select('Armazens.cod_Posicao_Armazem', 'Hortalicas.nome_Hortalica', 'Armazens.quant_Restante_Hortalica', 'Hortalicas.contagem_Hortalica')
            
            return  res.render('armazem.html', {listaHortalica})
        } catch (error) {
            return next(error)
        }
        
    },
    async compra(req,res, next) {
        try {
            // Trazendo dados da tabela
            const codPlantacao = Number(local('plantacao'))
            const listaPedido = await knex('Pedidos_Compra')
            .where({'cod_Plantacao': codPlantacao})
            .where({'status_Pedido': 'esperando'})
            .join('Fornecedores', 'Fornecedores.cod_Fornecedor', 'Pedidos_Compra.cod_Fornecedor')
            .select('Pedidos_Compra.cod_Pedido_Compra', 'Pedidos_Compra.dt_Pedido_Compra', 'Fornecedores.nome_Fornecedor')
            
            // Reiderizando da página para receber os dados
            return  res.render('compra.html', {listaPedido})

        } catch (error) {
            return next(error)
        }   
    },
    async venda(req,res) {
        try {
            // Preparar a lista de itens no armazém
            const codPlantacao = Number(local('plantacao'))
            const listaHortalica = await knex('Armazens')
            .where({'cod_Plantacao': codPlantacao})
            .join('Hortalicas', 'Hortalicas.cod_Hortalica', '=', 'Armazens.cod_Hortalica')
            .select('Armazens.cod_Posicao_Armazem', 'Hortalicas.nome_Hortalica', 'Armazens.quant_Restante_Hortalica', 'Hortalicas.contagem_Hortalica', 'Armazens.valor_Hortalica')
            
            return  res.render('venda.html', {listaHortalica})
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
            // Preparar parâmetro produto
            const codPlantacao = Number(local('plantacao'))

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
            // Resgata o email no local storage do usuário
            const email = local('email');
            // Buscar 
            const dadosPerfil = await knex.from('Usuarios')
            .where({email_Usuario: email})
            .select('Usuarios.*')

            const usuario = dadosPerfil[0]

            return res.render('perfil.html', { usuario });

        } catch (error) {
            return next(error);
        }
        
    },
}
