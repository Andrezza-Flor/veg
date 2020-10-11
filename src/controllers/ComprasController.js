const knex = require('../database')
const e = require('express');
const local = require('local-storage');
const { query } = require('express');
const { render, runtime } = require('nunjucks');
const { use, search } = require('../routes');
const { insert } = require('../database');

const arrayItensCompra = []

module.exports = {

    //Função para Ver detalhe do Pedido de Compra
    async detalhePedido(req, res, next) {
        try {
            // Preparar parâmetro pedido
            const {
                codPedido
            } = req.body
            local('pedidoCompra', Number(codPedido))
            const arrayPedido = await knex('Pedidos_Compra')
            .where({'cod_Pedido_Compra': codPedido})
            .join('Usuarios', 'Usuarios.email_Usuario', '=', 'Pedidos_Compra.email_Usuario_Comprou')
            .select('Usuarios.nome_Usuario', 'Usuarios.tipo_Usuario', 'Pedidos_Compra.total_Compra', 'Pedidos_Compra.dt_Pedido_Compra')

            const pedido = arrayPedido[0]

            // Preparar parâmetro fornecedor
            const arrayFornecedor = await knex('Pedidos_Compra')
            .where({'cod_Pedido_Compra': codPedido})
            .join('Fornecedores', 'Fornecedores.cod_Fornecedor', '=', 'Pedidos_Compra.cod_Fornecedor')
            .select('Fornecedores.*')

            const fornecedor = arrayFornecedor[0]
            
            // Preparar parâmentro Itens
            const Itens = await knex('Itens_Compra')
            .where({'cod_Pedido_Compra': codPedido})
            .join('Insumos', 'Insumos.cod_Insumo', '=', 'Itens_Compra.cod_Insumo')
            .select('Insumos.nome_Insumo','Insumos.contagem_Insumo','Itens_Compra.valor_Item', 'Itens_Compra.quant_Total_Insumo')
            // Reiderização da página, com os dados
            return res.render('compraDetalhe.html', {pedido, fornecedor, Itens})
        } catch (error) {
            next(error)
        }
    },
    async entrarCeleiro (req, res, next){
        try {
            // inserir na tabela Celeiro
            const codPlantacao = Number(local('plantacao'))
            const codPedido = Number(local('pedidoCompra'))
            const arrayItens = await knex('Itens_Compra')
            .where({'Itens_Compra.cod_Pedido_Compra': codPedido})
            .join('Pedidos_Compra', 'Pedidos_Compra.cod_Pedido_Compra', '=', 'Itens_Compra.cod_Pedido_Compra')
            .select('Itens_Compra.cod_Insumo', 'Pedidos_Compra.cod_Fornecedor', 'Itens_Compra.quant_Total_Insumo')

            const arrayCeleiro = await knex('Celeiros')
            .where({'cod_Plantacao': codPlantacao})
            .select('cod_Insumo', 'cod_Fornecedor')

            for (var i = 0; i < arrayItens.length; i++) { 
                const insumo = arrayItens[i].cod_Insumo
                const fornecedor = arrayItens[i].cod_Fornecedor
                try {
                    await knex('Celeiros').insert({
                        cod_Insumo: arrayItens[i].cod_Insumo,
                        cod_Fornecedor: arrayItens[i].cod_Fornecedor,
                        cod_Plantacao: codPlantacao,
                        quant_Insumo: arrayItens[i].quant_Total_Insumo,
                    }) 
                } catch (error) {
                    const arrayQuantInsumo = await knex('Celeiros')
                        .where({'cod_Insumo': insumo})
                        .where({'cod_Fornecedor': fornecedor})
                        .select('quant_Insumo')

                        // Soma as quantidades
                        const quantInsumo = arrayQuantInsumo[0].quant_Insumo + arrayItens[i].quant_Total_Insumo

                        // Insere o novo valor na tabela 
                        await knex('Celeiros')
                        .where({'cod_Insumo': insumo})
                        .where({'cod_Fornecedor': fornecedor})
                        .update({
                            quant_Insumo: quantInsumo
                        })
                }
                    
                
            }

            // Atualizar o status do Pedido de Compra
            await knex('Pedidos_Compra')
            .where({'cod_Pedido_Compra': codPedido})
            .update({
                status_Pedido: 'entregue'
            })

            // Preparando listaPedido
            const listaPedido = await knex('Pedidos_Compra')
            .where({'cod_Plantacao': codPlantacao})
            .where({'status_Pedido': 'esperando'})
            .join('Fornecedores', 'Fornecedores.cod_Fornecedor', 'Pedidos_Compra.cod_Fornecedor')
            .select('Pedidos_Compra.cod_Pedido_Compra', 'Pedidos_Compra.dt_Pedido_Compra', 'Fornecedores.nome_Fornecedor')
            
            
            return  res.render('compra.html', {listaPedido})
        } catch (error) {
            next(error)
        }
    },

    // Função para Comprar
    async comprar(req, res, next){
        try {
            // Preparando o parâmetro listaFornecedor
            const codPlantacao = local('plantacao')
            const listaFornecedor = await knex('Fornecedores')
            .join('Fornecedores_Insumos', 'Fornecedores_Insumos.cod_Fornecedor', '=' , 'Fornecedores.cod_Fornecedor')
            .where({'Fornecedores_Insumos.cod_Plantacao': codPlantacao})
            .distinct('Fornecedores_Insumos.cod_Fornecedor', 'Fornecedores.nome_Fornecedor')

            return res.render('compraComprarFornecedor.html', {listaFornecedor})
        } catch (error) {
            next(error)
        }
    },
    async escolherFornecedor(req, res, next ){
        try {
            //Preparando parametro listaFornecedor
            const codPlantacao = Number(local('plantacao'))
            const listaFornecedor = await knex('Fornecedores')
            .join('Fornecedores_Insumos', 'Fornecedores_Insumos.cod_Fornecedor', '=' , 'Fornecedores.cod_Fornecedor')
            .where({'Fornecedores_Insumos.cod_Plantacao': codPlantacao})
            .distinct('Fornecedores_Insumos.cod_Fornecedor', 'Fornecedores.nome_Fornecedor')

            //Preparanso parâmetro dadosFornecedor
            const {
                codFornecedorInsumo
            } = req.body
            const arrayFornecedor = await knex('Fornecedores')
            .where({'cod_Fornecedor': codFornecedorInsumo})
            .select()

            const dadosFornecedor = arrayFornecedor[0]

            local('fornecedor', String(codFornecedorInsumo))

            while (arrayItensCompra.length) {
                arrayItensCompra.pop()
            }
            
            return res.render('compraComprarFornecedor.html', {listaFornecedor, dadosFornecedor})
        } catch (error) {
            
        }
    },
    async comprarInsumo(req, res, next){
        try {
            // Inserinrdo dados na tabela Pedidos_Compra
            const emailUsuario = local('email')
            const codFornecedor = Number(local('fornecedor'))
            const codPlantacao = Number(local('plantacao'))
           

            // Preparando o parametro fornecedor
            const arrayFornecedor = await knex('Fornecedores')
            .where({'cod_Fornecedor': codFornecedor})
            .select('Fornecedores.nome_Fornecedor')

            const fornecedor = arrayFornecedor[0].nome_Fornecedor

            //Preparando parâmetro listaInsumo
            const listaInsumo = await knex('Fornecedores_Insumos')
            .where({'cod_Fornecedor': codFornecedor})
            .join('Insumos', 'Fornecedores_Insumos.cod_Insumo', '=', 'Insumos.cod_Insumo')
            .select('Insumos.cod_Insumo', 'Insumos.nome_Insumo')

            return res.render('compraComprarInsumo.html', {fornecedor, listaInsumo})
                
        } catch (error) {
            next(error)
        }
    },
    async escolherInsumo(req, res, next){
        try {
            const codFornecedorInsumo = Number(local('fornecedor'))

            // Preparando o parametro fornecedor
            const arrayFornecedor = await knex('Fornecedores')
            .where({'cod_Fornecedor': codFornecedorInsumo})
            .select('Fornecedores.nome_Fornecedor')

            const fornecedor = arrayFornecedor[0].nome_Fornecedor

            //Preparando parâmetro listaInsumo
            

            const listaInsumo = await knex('Fornecedores_Insumos')
            .where({'cod_Fornecedor': codFornecedorInsumo})
            .join('Insumos', 'Fornecedores_Insumos.cod_Insumo', '=', 'Insumos.cod_Insumo')
            .select('Insumos.cod_Insumo', 'Insumos.nome_Insumo')

            // Preparando parâmetro nomeInsumo
            const {
                codInsumo
            } = req.body
            const arrayInsumo = await knex('Insumos')
            .where({'cod_Insumo': codInsumo})
            .select('nome_Insumo', 'contagem_Insumo')
            const nomeInsumo = arrayInsumo[0].nome_Insumo  
            const contagemInsumo = arrayInsumo[0].contagem_Insumo

            local('insumo', String(codInsumo))

            return res.render('compraComprarInsumo.html', {fornecedor, listaInsumo, nomeInsumo, contagemInsumo, arrayItensCompra})
        } catch (error) {
            next(error)
        }
    },
    async adicionarItem(req, res, next){
        try {
            const codFornecedorInsumo = Number(local('fornecedor'))
            const codInsumo = Number(local('insumo'))

            // Preparando o parametro fornecedor
            const arrayFornecedor = await knex('Fornecedores')
            .where({'cod_Fornecedor': codFornecedorInsumo})
            .select('Fornecedores.nome_Fornecedor')

            const fornecedor = arrayFornecedor[0].nome_Fornecedor

            // Preparar listaInsumo
            
            const listaInsumo = await knex('Fornecedores_Insumos')
            .where({'cod_Fornecedor': codFornecedorInsumo})
            .join('Insumos', 'Fornecedores_Insumos.cod_Insumo', '=', 'Insumos.cod_Insumo')
            .select('Insumos.cod_Insumo', 
                    'Insumos.nome_Insumo')

            //Preparar nomeInsumo
            const arrayInsumo = await knex('Insumos')
            .where({'cod_Insumo': codInsumo})
            .select('nome_Insumo', 'contagem_Insumo')

            const nomeInsumo = arrayInsumo[0].nome_Insumo
            
            //Preparar contagemInsumo
            const contagemInsumo = arrayInsumo[0].contagem_Insumo

            // Adicionar no banco Itens_Compra

            const {
                quantInsumo,
                valorInsumo
            } = req.body
            const codPedido = Number(local('pedidoCompra'))

            const itemCompra = {
                quant_Total_Insumo: quantInsumo,
                cod_Pedido_Compra: codPedido,
                cod_Insumo: codInsumo,
                nome_Insumo: arrayInsumo[0].nome_Insumo,
                valor_Insumo: valorInsumo,
                contagem_Insumo: arrayInsumo[0].contagem_Insumo
            }

            // Preparar arrayItensCompra
            if (quantInsumo > 0) {
                arrayItensCompra.push(itemCompra)
            }

            return res.render('compraComprarInsumo.html', {fornecedor, listaInsumo, nomeInsumo, contagemInsumo, arrayItensCompra})
        } catch (error) {
            next(error)
        }
    },
    async finalizaCompra(req, res, next){
        try {
            const emailUsuario = local('email')
            const codFornecedor = Number(local('fornecedor'))

            // Preparar parâmetro dadosUsuario
            const arrayDadoUsuario = await knex('Usuarios')
            .where({'email_Usuario': emailUsuario})
            .select('Usuarios.nome_Usuario', 'Usuarios.tipo_Usuario')
            const dadoUsuario = arrayDadoUsuario[0]

            const dt = String(new Date)
            const mes = dt.slice(4, 7)
            const dia = dt.slice(8,10)
            const ano = dt.slice(11, 15)

            const data = dia + ' de ' + mes + '. ' + ano

            // Preparar parâmetro dadoFornecedor
            const arrayFornecedor = await knex('Fornecedores')
            .where({'cod_Fornecedor': codFornecedor})
            .select('Fornecedores.doc_Fornecedor',
                    'Fornecedores.nome_Fornecedor', 
                    'Fornecedores.telefone_Fornecedor', 
                    'Fornecedores.cep_Fornecedor', 
                    'Fornecedores.email_Fornecedor')

            const dadoFornecedor = arrayFornecedor[0]

            // Preparar parâmetro dadoItem
            var total = 0
            for (let index = 0; index < arrayItensCompra.length; index++) {
                total = (arrayItensCompra[index].quant_Total_Insumo * arrayItensCompra[index].valor_Insumo)+ total;
            }

            return res.render('compraFinalizarCompra.html', {dadoUsuario, data, dadoFornecedor, arrayItensCompra, total})
        } catch (error) {
            next(error)
        }
    },
    async salvarCompra(req, res, next){
        try {
            const emailUsuario = local('email')
            const codFornecedor = Number(local('fornecedor'))
            const codPlantacao = Number(local('plantacao'))

            var total = 0
            for (let index = 0; index < arrayItensCompra.length; index++) {
                total = (arrayItensCompra[index].quant_Total_Insumo * arrayItensCompra[index].valor_Insumo)+ total;
            }

            // Inserir os dados na tabela Pedido_Compra
            await knex('Pedidos_Compra').insert({
                'cod_Pedido_Compra': null,
                'total_Compra': total,
                'email_Usuario_Comprou': emailUsuario,
                'cod_Fornecedor': codFornecedor,
                'cod_Plantacao': codPlantacao,
                'status_Pedido': 'esperando'
            })

            // Pegando o codigo do Pedido
            const codigos = await knex('Pedidos_Compra')
            .where({'cod_Plantacao': codPlantacao})
            .select('cod_Pedido_Compra')
            const codPedidoCompra = Number(codigos[codigos.length -1].cod_Pedido_Compra)
           
            
            //Inserir os dados na tabela Itens_Compra
            for (let index = 0; index < arrayItensCompra.length; index++) {
                await knex('Itens_Compra').insert({
                    'cod_Item_Compra': null,
                    'quant_Total_Insumo': arrayItensCompra[index].quant_Total_Insumo,
                    'cod_Pedido_Compra': codPedidoCompra,
                    'cod_Insumo': arrayItensCompra[index].cod_Insumo,
                    'valor_Item': arrayItensCompra[index].valor_Insumo
                })
            }

            // Trazendo dados da tabela
            const listaPedido = await knex('Pedidos_Compra')
            .where({'cod_Plantacao': codPlantacao})
            .where({'status_Pedido': 'esperando'})
            .join('Fornecedores', 'Fornecedores.cod_Fornecedor', 'Pedidos_Compra.cod_Fornecedor')
            .select('Pedidos_Compra.cod_Pedido_Compra', 'Pedidos_Compra.dt_Pedido_Compra', 'Fornecedores.nome_Fornecedor')

            for (let index = 0; index < listaPedido.length; index++) {
                const dt = String(listaPedido[index].dt_Pedido_Compra)
                const mes = dt.slice(4, 7)
                const dia = dt.slice(8,10)
                const ano = dt.slice(11, 15)

                const data = dia + ' de ' + mes + '. ' + ano

                listaPedido[index].dt_Pedido_Compra = data;                
            }

            return  res.render('compra.html', {listaPedido})
        } catch (error) {
            next(error)
        }
    },

    // Função de Criar Fornecedor
    async apresentarCriarFornecedor(req, res, next){
        try {
            return res.render('compraCriarFornecedor.html')
        } catch (error) {
            next(error)
        }
    },
    async criarFornecedor(req, res, next){
        try {
            // Pegar dados do corpo da minha página
            const {
                nomeFornecedor,
                docFornecedor,
                telefoneFornecedor,
                cepFornecedor,
                emailFornecedor
            } = req.body

            // Inserir na tabela Fornecedores
            await knex('Fornecedores').insert({
                cod_Fornecedor: null,
                doc_Fornecedor: docFornecedor,
                nome_Fornecedor: nomeFornecedor,
                telefone_Fornecedor: telefoneFornecedor,
                cep_Fornecedor: cepFornecedor,
                email_Fornecedor: emailFornecedor                
            })
            const cod = await knex('Fornecedores')
            .select('cod_Fornecedor')


            const codFornecedor = String(cod[cod.length - 1].cod_Fornecedor)
            local('fornecedor', codFornecedor)

            // preparando o parâmetro listaInsumo
            const listaInsumo = await knex('Insumos')
            .select('cod_Insumo', 'nome_Insumo')

            return res.render('compraAdicionarInsumo.html', {nomeFornecedor, listaInsumo})
        } catch (error) {
            next(error)
        }
    },
    async buscaInsumo(req, res, next){
        try {
            //Preparando parâmetro nomeFornecedor
            const codFornecedor = Number(local('fornecedor'))
            const arrayFornecedor = await knex('Fornecedores')
            .where({'cod_Fornecedor': codFornecedor})
            .select('Fornecedores.nome_Fornecedor')

            const nomeFornecedor = arrayFornecedor[0].nome_Fornecedor


            //Preparando listaInsumo
            const listaInsumo = await knex('Insumos')
            .select('cod_Insumo', 'nome_Insumo')

            // Preparândo parâmetro dadosInsumo
            const { codInsumo } = req.body
    
            const arrayInsumo = await knex('Insumos')
            .where({'cod_Insumo': codInsumo})
            .select('nome_Insumo', 'tipo_Insumo')

            local('insumo', String(codInsumo))

            const dadosInsumo = arrayInsumo[0]

            //Preparândo tabelaInsumos
            const tabelaInsumos = await knex('Fornecedores_Insumos')
            .where({'cod_Fornecedor': codFornecedor})
            .join('Insumos', 'Insumos.cod_Insumo', '=', 'Fornecedores_Insumos.cod_Insumo')
            .select('Insumos.nome_Insumo', 'Fornecedores_Insumos.tempo_Entrega')

            return res.render('compraAdicionarInsumo.html', {nomeFornecedor, listaInsumo, dadosInsumo, tabelaInsumos})
        } catch (error) {
            next(error)
        }
    },
    async adicionarInsumo(req, res, next){
        try {
            //Preparando parâmetro nomeFornecedor
            const codFornecedor = Number(local('fornecedor'))
            const arrayFornecedor = await knex('Fornecedores')
            .where({'cod_Fornecedor': codFornecedor})
            .select('Fornecedores.nome_Fornecedor')

            const nomeFornecedor = arrayFornecedor[0].nome_Fornecedor

            //Preparando listaInsumo
            const listaInsumo = await knex('Insumos')
            .select('cod_Insumo', 'nome_Insumo')

            // INSERÇÃO DE DADOS TA TABELA -> Fornecedores_Insumos
            const codInsumo = Number(local('insumo'))
            const codPlantacao = Number(local('plantacao'))
            const {
                tempoEntrega
            } = req.body

            await knex('Fornecedores_Insumos').insert({
                cod_Insumo: codInsumo,
                cod_Fornecedor: codFornecedor,
                cod_Plantacao:codPlantacao,
                tempo_Entrega:tempoEntrega
            })
            
            //Preparando parâmetro tabelaInsumos
            const tabelaInsumos = await knex('Fornecedores_Insumos')
            .where({'cod_Fornecedor': codFornecedor})
            .join('Insumos', 'Insumos.cod_Insumo', '=', 'Fornecedores_Insumos.cod_Insumo')
            .select('Insumos.nome_Insumo', 'Fornecedores_Insumos.tempo_Entrega')

            return res.render('compraAdicionarInsumo.html', {nomeFornecedor, listaInsumo, tabelaInsumos})
        } catch (error) {
            next(error)
        }
    },
    async adicionarInsumoII(req, res, next){
        try {
            //Preparando parâmetro nomeFornecedor
            const codFornecedor = Number(local('fornecedor'))
            const arrayFornecedor = await knex('Fornecedores')
            .where({'cod_Fornecedor': codFornecedor})
            .select('Fornecedores.nome_Fornecedor')

            const nomeFornecedor = arrayFornecedor[0].nome_Fornecedor

            //Preparando listaInsumo
            const listaInsumo = await knex('Insumos')
            .select('cod_Insumo', 'nome_Insumo')

            //Preparando parâmetro tabelaInsumos
            const tabelaInsumos = await knex('Fornecedores_Insumos')
            .where({'cod_Fornecedor': codFornecedor})
            .join('Insumos', 'Insumos.cod_Insumo', '=', 'Fornecedores_Insumos.cod_Insumo')
            .select('Insumos.nome_Insumo', 'Fornecedores_Insumos.tempo_Entrega')

            return res.render('compraAdicionarInsumo.html', {nomeFornecedor, listaInsumo, tabelaInsumos})
        } catch (error) {
            next(error)
        }
    },

    //Função de Criar Insumo
    async insumo(req, res, next){
        try {
            return res.render('compraCriarInsumo.html')
        } catch (error) {
            next(erro)
        }
    },
    async criarInsumo(req,res, next) {
        try {
            // inserir dados Insumos
            const {
                nomeInsumo,
                contagemInsumo,
                tipoInsumo
            } = req.body

            await knex('Insumos').insert({
                cod_Insumo: null,
                nome_Insumo: nomeInsumo,
                tipo_Insumo: tipoInsumo,
                contagem_Insumo: contagemInsumo
            })

            const array = await knex('Insumos')
            .select('cod_Insumo')

            const codInsumo = array[array.length -1].cod_Insumo
            local('insumo', codInsumo)

            if (tipoInsumo == 'aplicar') {
                // Preparar nomeFornecedor
                const codFornecedor = Number(local('fornecedor'))
                const arrayFornecedor = await knex('Fornecedores')
                .where({'cod_Fornecedor': codFornecedor})
                .select('Fornecedores.nome_Fornecedor')

                const nomeFornecedor = arrayFornecedor[0].nome_Fornecedor

                // Preparar listaInsumo
                const listaInsumo = await knex('Insumos')
                .select('cod_Insumo', 'nome_Insumo')

                // Preparar tabelaInsumos
                const tabelaInsumos = await knex('Fornecedores_Insumos')
                .where({'cod_Fornecedor': codFornecedor})
                .join('Insumos', 'Insumos.cod_Insumo', '=', 'Fornecedores_Insumos.cod_Insumo')
                .select('Insumos.nome_Insumo', 'Fornecedores_Insumos.tempo_Entrega')

                return res.render('compraAdicionarInsumo.html', {nomeFornecedor, listaInsumo, tabelaInsumos})
            } else {
                const arrayInsumo = await knex('Insumos')
                .select('Insumos.cod_Insumo', 'Insumos.nome_Insumo')

                const codInsumo  = String(arrayInsumo[arrayInsumo.length -1].cod_Insumo);
                const nomeInsumo  = String(arrayInsumo[arrayInsumo.length -1].nome_Insumo);
                local ('cod_Insumo', codInsumo)
                return res.render('compraCriarHortalica.html', { nomeInsumo })
            }
  
        } catch (error) {
            next(error)
        }
            
    },
    // Função de Criar Hortalica
    async criarHortalica(req,res, next) {
        try {
            
            // Inserir dados de Hortalica
            const {
                nomeHortalica,
                contagemHortalica
            } = req.body
            
            const codInsumo = Number(local('insumo'))
            await knex('Hortalicas').insert({
                cod_Insumo: codInsumo,
                nome_Hortalica: nomeHortalica,
                contagem_Hortalica: contagemHortalica
            })

             // Preparar nomeFornecedor
             const codFornecedor = Number(local('fornecedor'))
             const arrayFornecedor = await knex('Fornecedores')
             .where({'cod_Fornecedor': codFornecedor})
             .select('Fornecedores.nome_Fornecedor')

             const nomeFornecedor = arrayFornecedor[0].nome_Fornecedor

             // Preparar listaInsumo
             const listaInsumo = await knex('Insumos')
             .select('cod_Insumo', 'nome_Insumo')

             // Preparar tabelaInsumos
             const tabelaInsumos = await knex('Fornecedores_Insumos')
             .where({'cod_Fornecedor': codFornecedor})
             .join('Insumos', 'Insumos.cod_Insumo', '=', 'Fornecedores_Insumos.cod_Insumo')
             .select('Insumos.nome_Insumo', 'Fornecedores_Insumos.tempo_Entrega')
    
            return res.render('compraAdicionarInsumo.html', {nomeFornecedor, listaInsumo, tabelaInsumos})
    
                
        } catch (error) {
            next(error)
        }
            
    }
}