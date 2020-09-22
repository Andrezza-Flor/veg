const knex = require('../database')
const e = require('express');
const local = require('local-storage');
const { query } = require('express');
const { render, runtime } = require('nunjucks');
const { use, search } = require('../routes');

module.exports = {
    async realizarCompra(req, res, next){
        try {
            // Preparando o parâmetro listaFornecedor
            const codPlantacao = local('plantacao')
            const listaFornecedor = await knex('Fornecedores')
            .join('Fornecedores_Insumos', 'Fornecedores_Insumos.cod_Fornecedor', '=' , 'Fornecedores.cod_Fornecedor')
            .where({'Fornecedores_Insumos.cod_Plantacao': codPlantacao})
            .select('Fornecedores_Insumos.cod_Fornecedor', 'Fornecedores.nome_Fornecedor')

            return res.render('compraComprarFornecedor.html', {listaFornecedor})
        } catch (error) {
            next(error)
        }
    },
    async buscarFornecedor(req, res, next ){
        try {
            //Preparando parametro listaFornecedor
            const codPlantacao = Number(local('plantacao'))
            const listaFornecedor = await knex('Fornecedores')
            .join('Fornecedores_Insumos', 'Fornecedores_Insumos.cod_Fornecedor', '=' , 'Fornecedores.cod_Fornecedor')
            .where({'Fornecedores_Insumos.cod_Plantacao': codPlantacao})
            .select('Fornecedores_Insumos.cod_Fornecedor', 'Fornecedores.nome_Fornecedor')

            //Preparanso parâmetro dadosFornecedor
            const {
                codFornecedorInsumo
            } = req.body
            const arrayFornecedor = await knex('Fornecedores')
            .where({'cod_Fornecedor': codFornecedorInsumo})
            .select()

            const dadosFornecedor = arrayFornecedor[0]

            local('fornecedor', String(codFornecedorInsumo))
            
            return res.render('compraComprarFornecedor.html', {listaFornecedor, dadosFornecedor})
        } catch (error) {
            
        }
    },
    async comprarInsumo(req, res, next){
        try {
            // Inserinrdo dados na tabela Pedidos_Compra
            const emailUsuario = local('email')
            const codFornecedorInsumo = Number(local('fornecedor'))
            const codPlantacao = Number(local('plantacao'))
            await knex('Pedidos_Compra').insert({
                cod_Pedido_Compra: null,
                total_Compra: 0,
                email_Usuario_Compra: emailUsuario,
                cod_Fornecedor: codFornecedorInsumo,
                cod_Plantacao: codPlantacao,
            })

            // Pegando o codigo do Pedido
            const codigos = await knex('Pedidos_Compra')
            .where({'cod_Plantacao': codPlantacao})
            .select('cod_Pedido_Compra')
            const codPedidoCompra = String(codigos[codigos.length -1].cod_Pedido_Compra)
            local('pedidoCompra', codPedidoCompra)

            //Preparando parâmetro listaInsumo
            const listaInsumo = await knex('Fornecedores_Insumos')
            .where({'cod_Fornecedor': codFornecedorInsumo})
            .join('Insumos', 'Fornecedores_Insumos.cod_Insumo', '=', 'Insumos.cod_Insumo')
            .select('Insumos.cod_Insumo', 'Insumos.nome_Insumo')

            return res.render('compraComprarInsumo.html', {listaInsumo})
                
        } catch (error) {
            next(error)
        }
    },
    async escolherInsumo(req, res, next){
        try {
            //Preparando parâmetro listaInsumo
            const codFornecedorInsumo = Number(local('fornecedor'))

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

            // Preparar Itens
            const codPedido = Number(local('pedidoCompra'))
            const Itens = await knex('Itens_Compra')
            .where({'cod_Pedido_Compra': codPedido})
            .join('Insumos', 'Insumos.cod_Insumo', '=', 'Itens_Compra.cod_Insumo')
            .select('Itens_Compra.validade_Item', 'Itens_Compra.quant_Total_Insumo', 'Itens_Compra.valor_Item', 'Insumos.nome_Insumo')

            return res.render('compraComprarInsumo.html', {listaInsumo, nomeInsumo, contagemInsumo, Itens})
        } catch (error) {
            next(error)
        }
    },
    async adicionarItem(req, res, next){
        try {
            // Preparar listaInsumo
            const codFornecedorInsumo = Number(local('fornecedor'))

            const listaInsumo = await knex('Fornecedores_Insumos')
            .where({'cod_Fornecedor': codFornecedorInsumo})
            .join('Insumos', 'Fornecedores_Insumos.cod_Insumo', '=', 'Insumos.cod_Insumo')
            .select('Insumos.cod_Insumo', 'Insumos.nome_Insumo')


            //Preparar nomeInsumo
            const codInsumo = Number(local('insumo'))
            const arrayInsumo = await knex('Insumos')
            .where({'cod_Insumo': codInsumo})
            .select('nome_Insumo', 'contagem_Insumo')

            const nomeInsumo = arrayInsumo[0].nome_Insumo
            
            //Preparar conatgemInsumo
            const contagemInsumo = arrayInsumo[0].contagem_Insumo

            // Adicionar no banco Itens_Compra
            const {
                validadeInsumo,
                quantInsumo,
                valorInsumo
            } = req.body
            const codPedido = Number(local('pedidoCompra'))

            await knex('Itens_Compra').insert({
                cod_Item_Compra: null,
                quant_Total_Insumo: quantInsumo,
                quant_Restante_Insumo: quantInsumo,
                cod_Pedido_Compra: codPedido,
                cod_Insumo: codInsumo,
                validade_Item: validadeInsumo,
                valor_Item: valorInsumo
            })

            // Preparar Itens
            const Itens = await knex('Itens_Compra')
            .where({'cod_Pedido_Compra': codPedido})
            .join('Insumos', 'Insumos.cod_Insumo', '=', 'Itens_Compra.cod_Insumo')
            .select('Itens_Compra.validade_Item', 'Itens_Compra.quant_Total_Insumo', 'Itens_Compra.valor_Item', 'Insumos.nome_Insumo')

            return res.render('compraComprarInsumo.html', {listaInsumo, nomeInsumo, contagemInsumo, Itens})
        } catch (error) {
            next(error)
        }
    },
    async finalizaCompra(req, res, next){
        try {
            // Preparar parâmetro dadosUsuario
            const emailUsuario = local('email')
            const arrayDadoUsuario = await knex('Usuarios')
            .where({'email_Usuario': emailUsuario})
            .select('Usuarios.nome_Usuario', 'Usuarios.tipo_Usuario')
            const dadoUsuario = arrayDadoUsuario[0]

            // Preparar parâmetro dadoFornecedor
            const codFornecedor = Number(local('fornecedor'))
            const arrayFornecedor = await knex('Fornecedores')
            .where({'cod_Fornecedor': codFornecedor})
            .select('Fornecedores.doc_Fornecedor', 'Fornecedores.nome_Fornecedor', 'Fornecedores.telefone_Fornecedor', 'Fornecedores.cep_Fornecedor', 'Fornecedores.email_Fornecedor')

            const dadoFornecedor = arrayFornecedor[arrayFornecedor.length -1]

            // Preparar parâmetro dadoItem
            const codPedido = Number(local('pedidoCompra'))
            const dadoItem = await knex('Itens_Compra')
            .where({'cod_Pedido_Compra': codPedido})
            .join('Insumos', 'Insumos.cod_Insumo', '=', 'Itens_Compra.cod_Insumo')
            .select('Insumos.nome_Insumo', 'Insumos.contagem_Insumo', 'Itens_Compra.*')
            
            // Prepara parâmetro dadoCompra
            var total = 0
            for (var i = 0; i < dadoItem.length; i++) {
                total = total + dadoItem[i].valor_Item
            }

            await knex('Pedidos_Compra')
            .where({'cod_Pedido_Compra': codPedido})
            .update({
                total_Compra: total,
            })
            const arrayPedidos = await knex('Pedidos_Compra')
            .where({'cod_Pedido_Compra': codPedido})
            .select('Pedidos_Compra.dt_Pedido_Compra', 'Pedidos_Compra.total_Compra')

            const dadoCompra = arrayPedidos[0]
            return res.render('compraFinalizarCompra.html', {dadoUsuario, dadoFornecedor, dadoItem, dadoCompra})
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