const knex = require('../database')
const e = require('express')
const local = require('local-storage');
const { render } = require('nunjucks');
const { where, update, select } = require('../database');
const { criarInsumo, insumo } = require('./ComprasController');


var fornecedor = {
    codFornecedor: '',
    nomeFornecedor: '',
    docFornecedor: '',
    telefoneFornecedor: '',
    cepFornecedor: '',
    emailFornecedor: '',
}
var cadastroProduto= {};
var insumoLista = [];
var ferramentaLista = [];

var ferramentaFornecedor = [];
var insumosFornecedor = [];
var insumoPossui = false;
var ferramentaPossui = false;

module.exports = {
    // CriarFornecedor
    async criarFornecedor(req,res, next) {
        try {
            
            return  res.render('Fornecedor/criarFornecedor.html')
        } catch (error) {
            return next(error)
        }
        
    },    
    async salvarFornecedor(req, res, next){
        try {
            const {
                nomeFornecedor,
                docFornecedor,
                telefoneFornecedor,
                cepFornecedor,
                emailFornecedor,
                insumo,
                ferramenta,
            } = req.body

            fornecedor.nomeFornecedor = nomeFornecedor;
            fornecedor.docFornecedor = docFornecedor;
            fornecedor.telefoneFornecedor = telefoneFornecedor;
            fornecedor.cepFornecedor = cepFornecedor;
            fornecedor.emailFornecedor = emailFornecedor;

            insumoLista = await knex('Insumos')
            .orderBy('nome_insumo')
            ferramentaLista = await knex('Ferramentas')
            .orderBy('nome_ferramenta')

            const tamanhoLista = 0;

            if(insumo == 'INSUMO' || ferramenta == 'FERRAMENTA'){
                insumosFornecedor = [];
                ferramentaFornecedor = [];
                
                if(insumo != 'INSUMO'){
                    ferramentaPossui = true;
                    return res.render('Fornecedor/adicionarFerramenta.html', {fornecedor, ferramentaLista, tamanhoLista})
                }
                if(ferramenta != 'FERRAMENTA'){
                    insumoPossui = true;
                    return res.render('Fornecedor/adicionarInsumo.html', {fornecedor, insumoLista, tamanhoLista})
                }
                
                ferramentaPossui = true;    
                insumoPossui = true;

                return res.render('Fornecedor/adicionarInsumo.html', {fornecedor, insumoLista, tamanhoLista})

            } else {
                var mensagem = "O tipo do fornecimento deve ser preenchido."
                return  res.render('Fornecedor/criarFornecedor.html', {mensagem})
            }

        } catch (error) {
            next(error)
        }
    },
    async selecionarInsumo(req,res, next) {
        try {
            const {
                codInsumo,
                diaEntrega,
                qualidadeProduto,
                contagemProduto
            } = req.body

            const nomeInsumo = await knex('Insumos')
            .where('cod_insumo', codInsumo)
            .select()

            const insumo = {
                codInsumo: codInsumo,
                nomeInsumo: nomeInsumo[0].nome_insumo,
                diaEntrega: diaEntrega,
                qualidadeProduto: qualidadeProduto,
                contagemProduto: contagemProduto,
            }

            insumosFornecedor.push(insumo);

            const tamanhoLista = insumosFornecedor.length;

            return res.render('Fornecedor/adicionarInsumo.html', {fornecedor, insumoLista, tamanhoLista, insumosFornecedor, ferramentaPossui})      
            
        } catch (error) {
            return next(error)
        }
        
    },
    async apresentarFerramenta(req, res, next){
        try {
            ferramentaLista = await knex('Ferramentas')
            .orderBy('nome_ferramenta')

            const tamanhoLista = ferramentaFornecedor.length

            return res.render('Fornecedor/adicionarFerramenta.html', {fornecedor, ferramentaLista, tamanhoLista})
    } catch (error) {
            next(error)
        }
    },
    async selecionarFerramenta(req,res, next) {
        try {
            const {
                codFerramenta,
                diaEntrega,
                qualidadeProduto,
                contagemProduto
            } = req.body

            const nomeFerramenta = await knex('Ferramentas')
            .where('cod_ferramenta', codFerramenta)
            .select()

            const ferramenta = {
                codFerramenta: codFerramenta,
                nomeFerramenta: nomeFerramenta[0].nome_ferramenta,
                diaEntrega: diaEntrega,
                qualidadeProduto: qualidadeProduto,
                contagemProduto: contagemProduto,
            }

            ferramentaFornecedor.push(ferramenta);


            const tamanhoLista = ferramentaFornecedor.length;

            return res.render('Fornecedor/adicionarFerramenta.html', {fornecedor, ferramentaLista, tamanhoLista, ferramentaFornecedor})      
            
        } catch (error) {
            return next(error)
        }
        
    },
    

    async criarInsumo(req, res, next){
        try {
            return res.render('Fornecedor/criarInsumo.html')
        } catch (error) {
            next(error)
        }
    },
    async salvarHortalica(req, res, next){
        try {
            const {
                nomeHortalica
            } = req.body;
            await knex('Insumos')
            .insert({
                'nome_insumo': cadastroProduto.nomeInsumo.toUpperCase(),
                'tipo_insumo': cadastroProduto.tipoInsumo,
            })

            const codInumo = await knex('Insumos')
            .where('nome_insumo', cadastroProduto.nomeInsumo)
            .select('cod_insumo')

            await knex('Hortalicas')
            .insert({
                'nome_hortalica': nomeHortalica.toUpperCase(),
                'cod_insumo': codInumo[0].cod_insumo
            })

            insumoLista = await knex('Insumos')
            .orderBy('nome_insumo')

            const tamanhoLista = insumoLista.length;

            return res.render('Fornecedor/adicionarInsumo.html', {fornecedor, insumoLista, tamanhoLista, insumosFornecedor})
        } catch (error) {
            next(error)
        }
    },
    async salvarInsumo(req, res, next){
        try {
            const {
                nomeInsumo,
                tipoInsumo
            } = req.body

            const insumo = await knex('Insumos')
            .where('nome_insumo', nomeInsumo.toUpperCase())
            .select();

            console.log(insumo)

            if (insumo.length == 0) {

                console.log('não exixte insumo com esse nome')
                if(tipoInsumo == 'APLICAR'){
                    await knex('Insumos')
                    .insert({
                        'nome_insumo': nomeInsumo.toUpperCase(),
                        'tipo_insumo': tipoInsumo,
                    })

                    insumoLista = await knex('Insumos')
                    .orderBy('nome_insumo')

                    const tamanhoLista = insumoLista.length

                    return res.render('Fornecedor/adicionarInsumo.html', {fornecedor, insumoLista, tamanhoLista, insumosFornecedor})
                } else {
                    cadastroProduto = {
                        nomeInsumo: nomeInsumo.toUpperCase(),
                        tipoInsumo: tipoInsumo,
                    }

                    return res.render('Fornecedor/criarInsumoII.html', {cadastroProduto})
                } 
            } else {
                var mensagem = insumo[0].nome_insumo + " já foi cadastrado"
                return res.render('Fornecedor/criarInsumo.html', {mensagem})
            }
        } catch (error) {
            next(error)
        }
    },


    async criarFerramenta(req, res, next){
        try {
            return res.render('Fornecedor/criarFerramenta.html')
        } catch (error) {
            next(error)
        }
    },
    async salvarFerramenta(req, res, next){
        try {
            const {
                nomeFerramenta,
                caracteristicaFerramenta,
            } = req.body

            const ferramentasIguais = await knex('Ferramentas')
            .where('nome_ferramenta', nomeFerramenta.toUpperCase())
            .where('caracteristica_ferramenta', caracteristicaFerramenta.toUpperCase())
            .select()

            if(ferramentasIguais.length == 0){
                await knex('Ferramentas')
                .insert({
                    'nome_ferramenta': nomeFerramenta.toUpperCase(),
                    'caracteristica_ferramenta': caracteristicaFerramenta.toUpperCase(),
                })

                ferramentaLista = await knex('Ferramentas')
                .orderBy('nome_ferramenta')

                const tamanhoLista = ferramentaFornecedor.length

                return res.render('Fornecedor/adicionarFerramenta.html', {fornecedor, ferramentaLista, tamanhoLista})

            } else {
                const mensagem  = 'Essa Ferramenta já foi cadastra';
                return res.render('Fornecedor/criarFerramenta.html', {mensagem})
            }


        } catch (error) {
            next(error)
        }
    },





    async salvarDados(req,res, next) {
        try {


            console.log(ferramentaFornecedor);
            console.log(insumosFornecedor)
            // // Inserir na tabela Fornecedores
            // await knex('Fornecedores').insert({
            //     cod_Fornecedor: null,
            //     doc_Fornecedor: docFornecedor,
            //     nome_Fornecedor: nomeFornecedor,
            //     telefone_Fornecedor: telefoneFornecedor,
            //     cep_Fornecedor: cepFornecedor,
            //     email_Fornecedor: emailFornecedor                
            // })
            // const cod = await knex('Fornecedores')
            // .select('cod_Fornecedor')

            return  res.render('Fornecedor/criarFornecedor.html', {produtos})
        } catch (error) {
            return next(error)
        }
        
    },
   
}