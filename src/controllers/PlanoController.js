const knex = require('../database')
const e = require('express');
const local = require('local-storage');

var dadosPlano = {
    nome_plano: '',
    dias_producao: '',
    area_terreno: '',
    cod_plantacao: '',
    cod_hortalica: '',
    nome_hortalica: '',
    quantidade_hortalica: '',
    contagem_hortalica: '',
};

var cadastroProduto = {}    // Variavel usada para dacastarr Insumos e Hortaliças
var listaItem = [];         // Variavel que vai receber os itens
var item = {}               // Variável que vai receber as informações dos itens
var aplicacaoItem = []      // Variável que vai receber as informações da alicação
module.exports = {
       
    // Plano de Produção
    async planoProducao(req,res, next) {
        try {
            const planosProducao = await knex('Planos_Producao')
            .where('cod_plantacao', Number(local('plantacao')))
            .select()
            
            return  res.render('PlanoProducao/planoProducao.html', { planosProducao })
        } catch (error) {
            next(error)
        }
        
    },
    async criarPlanoProducao(req,res, next) {
        try {

            cadastroProduto = {}    
            listaItem = [];         
            item = {}               
            aplicacaoItem = [] 

            const hortalicaLista = await knex('Hortalicas')
            .orderBy('nome_hortalica')
            .select()
            
            return  res.render('PlanoProducao/criarPlanoProducao.html', {hortalicaLista})
        } catch (error) {
            next(error)
        }
        
    },
    async adicionarDadosPlano(req,res, next) {
        try {
            const {
                nomePlano,
                diasProducao,
                areaTerreno,
                codHortalica,
                quantidadeHortalica,
                contagemHortalica
            } = req.body

            const hortalica = await knex('Hortalicas')
            .where('cod_hortalica', codHortalica)
            .select()

            dadosPlano.nome_plano = nomePlano.toUpperCase();
            dadosPlano.dias_producao = Number(diasProducao);
            dadosPlano.area_terreno = Number(areaTerreno);
            dadosPlano.cod_plantacao = Number(local('plantacao'));
            dadosPlano.cod_hortalica = Number(codHortalica);
            dadosPlano.nome_hortalica = hortalica[0].nome_hortalica;
            dadosPlano.quantidade_hortalica = Number(quantidadeHortalica);
            dadosPlano.contagem_hortalica = contagemHortalica;

            const totalDia = Number(diasProducao)

            const insumoLista = await knex('Insumos')
            .orderBy('nome_insumo')
            .select()

            const tamanhoLista = aplicacaoItem.length

            return  res.render('PlanoProducao/adicionarItens.html', {dadosPlano, insumoLista, tamanhoLista, totalDia, aplicacaoItem})
        } catch (error) {
            next(error)
        }
        
    },
    async adicionarItem(req,res, next) {
        try {
            const {
                codItem,
                contagemItem,
                vezesAplicacao,
            } = req.body

            const nomeInsumo = await knex('Insumos')
            .where('cod_insumo', Number(codItem))
            .select()

            item = {
                cod_item: codItem,
                nome_item: nomeInsumo[0].nome_insumo,
                contagem_item: contagemItem,
                vezes_aplicacao: vezesAplicacao,
                quantidade_item: 0
            }

            listaItem.push(item);

            const tamanhoLista = aplicacaoItem.length

            var totalAplicacoes = []
            for (let index = 1; index <= vezesAplicacao; index++) {
                var aplicacao = {
                    nome_aplicacao: 'app' + index,
                    numero: index,
                }
                totalAplicacoes.push(aplicacao)
            }
            
            var totalDia = []
            for (let index = 1; index <= dadosPlano.dias_producao; index++) {
                totalDia.push(index)
            }

            return  res.render('PlanoProducao/adicionarItensII.html', {dadosPlano, listaItem, tamanhoLista, item, totalDia, totalAplicacoes, aplicacaoItem})
        } catch (error) {
            next(error)
        }
        
    },
    async adicionarAplicacao(req,res, next) {
        try {
            const {
                app,
                diaAplicacao,
            } = req.body

            for (let index = 0; index < item.vezes_aplicacao; index++) {
                if (item.vezes_aplicacao == 1){
                    var aplicacao = {
                        cod_item: item.cod_item,
                        nome_item: item.nome_item,
                        contagem_item: item.contagem_item,
                        quantidade_item: app,
                        dia_aplicacao: diaAplicacao,
                    }
                } else {
                    var aplicacao = {
                        cod_item: item.cod_item,
                        nome_item: item.nome_item,
                        contagem_item: item.contagem_item,
                        quantidade_item: app[index],
                        dia_aplicacao: diaAplicacao[index],
                    }
                }
                

                aplicacaoItem.push(aplicacao)
            }

            const insumoLista = await knex('Insumos')
            .orderBy('nome_insumo')
            .select()

            const tamanhoLista = aplicacaoItem.length

            const totalDia = Number(dadosPlano.diasProducao)       

            return  res.render('PlanoProducao/adicionarItens.html', {dadosPlano, insumoLista, tamanhoLista, totalDia, aplicacaoItem})
        } catch (error) {
            next(error)
        }
        
    },
    async resultadoPlano(req,res, next) {
        try {
            // Inserir a quantidade de itens que serão aplicadas
            for (var i = 0; i < listaItem.length; i++) {
                var quantidadeItem = 0;
                for (var j = 0; j < aplicacaoItem.length; j++) {
                    if(aplicacaoItem[j].cod_item == listaItem[i].cod_item){
                        quantidadeItem = quantidadeItem + Number(aplicacaoItem[j].quantidade_item)
                    }
                }

                listaItem[i].quantidade_item = quantidadeItem

            }

            // Ordenação da função pelo dia que acontecerá
            aplicacaoItem.sort(function(a, b) {
                return a.dia_aplicacao - b.dia_aplicacao
            })
            
            return  res.render('PlanoProducao/resultadoPlanoProducao.html', {dadosPlano, aplicacaoItem})
        } catch (error) {
            next(error)
        }
        
    },
    async salvarDados(req,res, next) {
        try {
            
            // Entrar na tabela Planos_Producao
            await knex('Planos_Producao')
            .insert({
                'nome_plano': dadosPlano.nome_plano,
                'dias_producao': dadosPlano.dias_producao,
                'cod_plantacao': dadosPlano.cod_plantacao,
                'area_terreno': dadosPlano.area_terreno,
                'cod_hortalica': dadosPlano.cod_hortalica,
                'quantidade_hortalica': dadosPlano.quantidade_hortalica,
                'contagem_hortalica': dadosPlano.contagem_hortalica,
            })
            // Resgatando o código que foi cadastrado 
            const codPlano = await knex('Planos_Producao')
            .where('cod_plantacao', dadosPlano.cod_plantacao)
            .select()

            // Cadastrando os itens do plano
            for (let index = 0; index < listaItem.length; index++) {
                await knex('Itens_Plano')
                .insert({
                    'cod_item': listaItem[index].cod_item,
                    'cod_plano': codPlano[codPlano.length -1].cod_plano,
                    'quantidade_item': listaItem[index].quantidade_item,
                    'contagem_item': listaItem[index].contagem_item,
                    'vezes_aplicacao': listaItem[index].vezes_aplicacao,
                })
            }

            // Cadastrar os itens da aplicacao
            for (let index = 0; index < aplicacaoItem.length; index++) {
                await knex('Momentos_Aplicacao')
                .insert({
                    'cod_item':aplicacaoItem[index].cod_item,
                    'cod_plano': codPlano[codPlano.length -1].cod_plano,
                    'dia_aplicacao':aplicacaoItem[index].dia_aplicacao,
                    'quantidade_aplicacao': aplicacaoItem[index].quantidade_item,
                })
            }
            
            const planosProducao = await knex('Planos_Producao')
            .where('cod_plantacao', Number(local('plantacao')))
            .select()
            
            return  res.render('PlanoProducao/planoProducao.html', { planosProducao })
        } catch (error) {
            next(error)
        }
        
    },
    

    // Adicionar Insumos
    async criarInsumo(req, res, next){
        try {
            return res.render('PlanoProducao/criarInsumo.html')
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

            if (insumo.length == 0) {

                if(tipoInsumo == 'APLICAR'){
                    await knex('Insumos')
                    .insert({
                        'nome_insumo': nomeInsumo.toUpperCase(),
                        'tipo_insumo': tipoInsumo,
                    })

                    const codInumo = await knex('Insumos')
                    .where('nome_insumo', nomeInsumo.toUpperCase())
                    .select('cod_insumo')

                    await knex('Produtos')
                    .insert({
                        'cod_produto': codInumo[0].cod_insumo,
                        'tipo_produto': 'INSUMO'
                    })

                    const insumoLista = await knex('Insumos')
                    .orderBy('nome_insumo')
                    .select()

                    const tamanhoLista = insumoLista.length

                    return  res.render('PlanoProducao/adicionarItens.html', {dadosPlano, insumoLista, tamanhoLista})
                } else {
                    cadastroProduto = {
                        nomeInsumo: nomeInsumo.toUpperCase(),
                        tipoInsumo: tipoInsumo,
                    }

                    return res.render('PlanoProducao/criarInsumoII.html', {cadastroProduto})
                } 
            } else {
                var mensagem = insumo[0].nome_insumo + " já foi cadastrado"
                return res.render('PlanoProducao/criarInsumo.html', {mensagem})
            }
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

            await knex('Produtos')
            .insert({
                'cod_produto': codInumo[0].cod_insumo,
                'tipo_produto': 'INSUMO'
            })

            await knex('Hortalicas')
            .insert({
                'nome_hortalica': nomeHortalica.toUpperCase(),
                'cod_insumo': codInumo[0].cod_insumo
            })

            const insumoLista = await knex('Insumos')
            .orderBy('nome_insumo')
            .select()

            const tamanhoLista = insumoLista.length
            return  res.render('PlanoProducao/adicionarItens.html', {dadosPlano, insumoLista, tamanhoLista})
        } catch (error) {
            next(error)
        }
    },


    async paginaAplicarInsumo (req, res, next) {
        try {
            const codPlantacao = Number(local('plantacao'))

            // Lista de Insumos no Celeiro
            const listaInsumo = await knex('Celeiros')
            .where({'cod_Plantacao': codPlantacao})
            .whereNot({'Celeiros.quant_Insumo': 0})
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

            const arrayInsumo = await knex('Celeiros')
            .where({'cod_posicao_celeiro': codPosicao})
            .join('Insumos', 'Insumos.cod_Insumo', '=', 'Celeiros.cod_Insumo')
            .join('Fornecedores', 'Fornecedores.cod_Fornecedor', '=', 'Celeiros.cod_Fornecedor')
            .select('Insumos.nome_Insumo', 'Fornecedores.nome_Fornecedor', 'Insumos.contagem_Insumo', 'Celeiros.quant_Insumo')
            
            const Insumo = arrayInsumo[0]

            local('insumo', String(codPosicao))

            return res.render('estufaAplicarInsumo.html', {listaInsumo, Insumo})
        } catch (error) {
            next(error)
        }
    },
    async aplicarInsumo(req, res, next){
        try {
            const codPlantacao = Number(local('plantacao'))
            const emailUsuario = local('email');
            const codPosicaoCeleiro = Number(local('insumo'))

            const {
                quantInsumo
            } = req.body

           
            // Atualizar a tabela celeiro
            const arrayQuantInsumo = await knex('Celeiros')
            .where({'cod_posicao_celeiro': codPosicaoCeleiro})
            .select('quant_Insumo')

            const quantidadeInsumo = arrayQuantInsumo[0].quant_Insumo - quantInsumo

            await knex('Celeiros')
            .where({'cod_posicao_celeiro': codPosicaoCeleiro})
            .update({
                'quant_Insumo': quantidadeInsumo
            })

            // Busca de dados para o  Plantio
            const arrayInsumo = await knex('Celeiros')
            .where({'cod_posicao_celeiro': codPosicaoCeleiro})
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

            var dt = String(arrayProduto[0].dt_Plantio)
            var mes = dt.slice(4, 7)
            var dia = dt.slice(8,10)
            var ano = dt.slice(11, 15)

            var data = dia + ' de ' + mes + '. ' + ano

            arrayProduto[0].dt_Plantio = data;
            
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
                            
            //Entrada do produto no Armazem com dados de venda nulo
                //Busca de dados para a inserção
            const arrayProduto = await knex('Plantio')
            .where({'cod_Plantacao_Hortalica': codPlantio})
            .join('Hortalicas', 'Hortalicas.cod_Insumo', '=', 'Plantio.cod_Insumo')
            .select('Hortalicas.cod_Hortalica', 'Plantio.cod_Fornecedor')
                // Inersão na tabela Armazens
            await knex('Armazens').insert({
                'cod_Posicao_Armazem': null,
                'cod_Hortalica': arrayProduto[0].cod_Hortalica,
                'cod_Fornecedor': arrayProduto[0].cod_Fornecedor,
                'cod_Plantacao': codPlantacao,
                'quant_Restante_Hortalica': quantProduto,
                'valor_Hortalica': 0
            })
            

            // Cadastrar Colheita
                // reunir os dadoa para o Insert
            const arrayCodPosicao = await knex('Armazens')
            .where({'cod_Plantacao': codPlantacao})
            .select('Armazens.cod_Posicao_Armazem')

            const codPosicao = Number(arrayCodPosicao[arrayCodPosicao.length -1 ].cod_Posicao_Armazem)

                // realizar o cadastro
            await knex('Colheita').insert({
                'cod_Posicao_Armazem': codPosicao,
                'cod_Plantacao_Hortalica': codPlantio,
                'quant_Total_Colida': quantProduto,
                'email_Usuario_Colheu': usuario,
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