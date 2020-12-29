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
var insumoFornecedor = [];
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
                insumoFornecedor = [];
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

            for (let index = 0; index < insumoFornecedor.length; index++) {
                if(insumoFornecedor[index].codInsumo == insumo.codInsumo){
                    insumoFornecedor.splice(index, 1);
                }
                
            }

            insumoFornecedor.push(insumo);

            const tamanhoLista = insumoFornecedor.length;

            return res.render('Fornecedor/adicionarInsumo.html', {fornecedor, insumoLista, tamanhoLista, insumoFornecedor, ferramentaPossui})      
            
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
                qualidadeProduto
            } = req.body

            const nomeFerramenta = await knex('Ferramentas')
            .where('cod_ferramenta', codFerramenta)
            .select()

            const ferramenta = {
                codFerramenta: codFerramenta,
                nomeFerramenta: nomeFerramenta[0].nome_ferramenta,
                diaEntrega: diaEntrega,
                qualidadeProduto: qualidadeProduto
            }

            for (let index = 0; index < ferramentaFornecedor.length; index++) {
                if(ferramentaFornecedor[index].codFerramenta == ferramenta.codFerramenta){
                    ferramentaFornecedor.splice(index, 1);
                }
                
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

            return  res.render('Fornecedor/resultadoFornecedor.html', {fornecedor, insumoFornecedor, ferramentaFornecedor})
        } catch (error) {
            return next(error)
        }
        
    },

    async cadastrarFornecedorProduto(req,res, next) {
        try {

            // Cadastrar Fornecedor
            await knex('Fornecedores')
            .insert({
                'nome_fornecedor': fornecedor.nomeFornecedor.toUpperCase(),
                'doc_fornecedor': fornecedor.docFornecedor,
                'telefone_fornecedor': fornecedor.telefoneFornecedor,
                'cep_fornecedor': fornecedor.cepFornecedor,
                'email_fornecedor': fornecedor.emailFornecedor,
            })

            var fornecedores = await knex('Fornecedores')
            .where('nome_fornecedor', fornecedor.nomeFornecedor)
            .select()

            const codFornecedor = fornecedores[fornecedores.length - 1].cod_fornecedor

            // Cadastrar FornecedorProduto
            for (let index = 0; index < insumoFornecedor.length; index++) {
                await knex('Fornecedores_Produtos')
                .insert({
                    'cod_produto': insumoFornecedor[index].codInsumo,
                    'cod_Fornecedor': codFornecedor,
                    'cod_plantacao': Number(local('plantacao')),
                    'dia_entrega': insumoFornecedor[index].diaEntrega,
                    'qualidade_produto': insumoFornecedor[index].qualidadeProduto,
                    'contagem_produto': insumoFornecedor[index].contagemProduto
                })
            }

            for (let index = 0; index < ferramentaFornecedor.length; index++) {
                await knex('Fornecedores_Produtos')
                .insert({
                    'cod_produto': ferramentaFornecedor[index].codFerramenta,
                    'cod_fornecedor': codFornecedor,
                    'cod_plantacao': Number(local('plantacao')),
                    'dia_entrega': ferramentaFornecedor[index].diaEntrega,
                    'qualidade_produto': ferramentaFornecedor[index].qualidadeProduto,
                    'contagem_produto': 'U', 
                })
            }

            const fornecedoresProduto = await knex('Fornecedores_Produtos')
            .where('cod_plantacao', Number(local('plantacao')))
            .select()

            var codsFornecedor = [];
            var igual = false;
            for (var i = 0; i < fornecedoresProduto.length; i++) {

                codsFornecedor.push(fornecedoresProduto[i].cod_fornecedor)
                         
            }

            fornecedores = await knex('Fornecedores')
            .whereIn('cod_fornecedor', codsFornecedor)
            .select()
                       
            return res.render('Fornecedor/fornecedor.html', {fornecedores})
            
        } catch (error) {
            return next(error)
        }
        
    },

    
   
}