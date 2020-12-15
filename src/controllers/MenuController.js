const knex = require('../database');
const e = require('express');
const local = require('local-storage');

async function varreduraFluxoCaixa(codPlantacao) {
    const fluxosCaixa = await knex('FluxoCaixa')
    .where('cod_plantacao', codPlantacao)
    .select()

    // varredura dos dados dos fluxos de caixa e correção dos mesmos.
    for (let index = 0; index < fluxosCaixa.length; index++) {
        if(fluxosCaixa[index].capital_inicial != (fluxosCaixa[index].saldo_transportar - fluxosCaixa[index].saldo_operacional)){
            fluxosCaixa[index].saldo_transportar = fluxosCaixa[index].capital_inicial + fluxosCaixa[index].saldo_operacional;
        }

        if(index < fluxosCaixa.length -1){
            fluxosCaixa[index + 1].capital_inicial = fluxosCaixa[index].saldo_transportar;
        }

        
    }

    // // Inserção das atualizações dos dos valores no fluxo de caixa
    for (let index = 0; index < fluxosCaixa.length; index++) {
        await knex('FluxoCaixa')
        .where('cod_fluxoCaixa', fluxosCaixa[index].cod_fluxoCaixa)
        .update({
            capital_inicial: fluxosCaixa[index].capital_inicial,
            saldo_operacional: fluxosCaixa[index].saldo_operacional,
            saldo_transportar: fluxosCaixa[index].saldo_transportar,
        })
    }
} 
async function apresentacaoEntradas() {
    const codPlantacao = Number(local('plantacao'))
    const dataAtual = new Date();
    const mesAnalise = dataAtual.getMonth();
    const anoAnalise = dataAtual.getFullYear();
    const dataFim = new Date(anoAnalise, (mesAnalise+1), 28)

    const dataInicio = new Date(anoAnalise, mesAnalise, 1);
    dataFim.setDate(0)

    const entradas = await knex('Entradas')
    .where('cod_plantacao', codPlantacao)
    .where({'status_entrada': 1})
    .whereBetween('validade_entrada', [dataInicio, dataFim])
    .select();

    for (let index = 0; index < entradas.length; index++) {
         
        const data = new Date(entradas[index].validade_entrada);

        if(data.getMonth() == dataAtual.getMonth() && data.getFullYear() == dataAtual.getFullYear()){
            entradas[index].validade_entrada = data.getDate() + "/" + (data.getMonth() + 1) + "/" + data.getFullYear();
        } else {
            entradas.splice(index);
        }
                            
    }    

    return entradas
}
async function apresentacaoSaidas() {
    const codPlantacao = Number(local('plantacao'))
    const dataAtual = new Date();
    const mesAnalise = dataAtual.getMonth();
    const anoAnalise = dataAtual.getFullYear();
    const dataFim = new Date(anoAnalise, (mesAnalise+1), 28)

    const dataInicio = new Date(anoAnalise, mesAnalise, 1);
    dataFim.setDate(0)

    const saidas = await knex('Saidas')
    .where('cod_plantacao', codPlantacao)
    .where({'status_saida': 1})
    .whereBetween('validade_saida', [dataInicio, dataFim])
    .select();

    for (let index = 0; index < saidas.length; index++) {
         
        const data = new Date(saidas[index].validade_saida);

        if(data.getMonth() == dataAtual.getMonth() && data.getFullYear() == dataAtual.getFullYear()){
            saidas[index].validade_saida = data.getDate() + "/" + (data.getMonth() + 1) + "/" + data.getFullYear();
        } else {
            saidas.splice(index);
        }
                            
    }   
    
    return saidas
}

const nomeDosMeses = [
    'JANEIRO',
    'FEVEREIRO',
    'MARÇO',
    'ABRIL',
    'MAIO',
    'JUNHO',
    'JULHO',
    'AGOSTO',
    'SETEMBRO',
    'OUTUBRO',
    'NOVEMBRO',
    'DEZEMBRO'
]

module.exports = {
    
    async home(req, res, next) {
        try {
            return res.render('home.html')
        } catch (error) {
            next(error)
        }
    },
    // Acessar a Página de Capital
    async balanco(req, res, next) {
        try {
            return res.render('Balanco/balanco.html')
        } catch(error) {
            next(error)
        }
    },
    async fluxoCaixa(req,res, next) {
        try {
            const entradas = await apresentacaoEntradas();
            var totalEntrada = 0
            for (let index = 0; index < entradas.length; index++) {
                totalEntrada = entradas[index].valor_entrada + totalEntrada;
            }

            const saidas = await apresentacaoSaidas()
            var totalSaida = 0
            for (let index = 0; index < saidas.length; index++) {
                totalSaida = saidas[index].valor_saida + totalSaida;
                
            }

            // Preparando o parâmetro mesAtual
            var dataAtual = new Date();
            const mesAtual = nomeDosMeses[dataAtual.getMonth()]

            // Preparando capitalInicial
            const  mesReferencia = dataAtual.getMonth() + '-' + dataAtual.getFullYear(); 
            const codPlantacao = Number(local('plantacao'))

            var fluxoCaixa = await knex('FluxoCaixa')
            .where({'cod_plantacao': codPlantacao})
            .where({'mes_referencia': mesReferencia})
            .select()

            if(fluxoCaixa.length == 0){

                const fluxoCaixaAnterior = await knex('FluxoCaixa')
                .where({'cod_plantacao': codPlantacao})
                .select()

                await knex('FluxoCaixa').insert({
                    'mes_referencia': mesReferencia,
                    'cod_plantacao': codPlantacao,
                    'capital_inicial': fluxoCaixaAnterior[fluxoCaixaAnterior.length -1].saldo_transportar,
                    'saldo_operacional': 0,
                    'saldo_transportar': 0,
                })
            
                fluxoCaixa = await knex('FluxoCaixa')
                .where({'cod_plantacao': codPlantacao})
                .where({'mes_referencia': mesReferencia})
                .select()
            } 

            await varreduraFluxoCaixa(codPlantacao)

            const capitalInicial = fluxoCaixa[0].capital_inicial;
            const saldoOperacional = fluxoCaixa[0].saldo_operacional;
            const saldoTrasportar = fluxoCaixa[0].saldo_transportar;
                
            return  res.render('FluxoCaixa/fluxoCaixa.html', {entradas, saidas, totalEntrada, totalSaida, mesAtual, capitalInicial, saldoOperacional, saldoTrasportar})
        } catch (error) {
            next(error)
        }
        
    },    
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
             .whereNot({'Armazens.quant_Restante_Hortalica': 0})
             .join('Hortalicas', 'Hortalicas.cod_Hortalica', '=', 'Armazens.cod_Hortalica')
             .select('Armazens.cod_Posicao_Armazem',
                     'Hortalicas.nome_Hortalica', 
                     'Armazens.quant_Restante_Hortalica', 
                     'Hortalicas.contagem_Hortalica', 
                     'Armazens.valor_Hortalica')
             
            return  res.render('armazem.html', {listaHortalica})
        } catch (error) {
            next(error)
        }
        
    },

    async financas(req, res, next) {
        try {
            return res.render('Financas/financas.html')
        } catch (error) {
            next(error)
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
        
            for (let index = 0; index < listaPedido.length; index++) {
                const dt = String(listaPedido[index].dt_Pedido_Compra)
                const mes = dt.slice(4, 7)
                const dia = dt.slice(8,10)
                const ano = dt.slice(11, 15)

                const data = dia + ' de ' + mes + '. ' + ano

                listaPedido[index].dt_Pedido_Compra = data;                
            }       

            // Reiderizando da página para receber os dados
            return  res.render('compra.html', {listaPedido})

        } catch (error) {
            next(error)
        }   
    },
    async venda(req,res, next) {
        try {
            // Preparar a lista de itens no armazém
            const codPlantacao = Number(local('plantacao'))
            const listaHortalica = await knex('Armazens')
            .where({'cod_Plantacao': codPlantacao})
            .whereNot({'Armazens.valor_Hortalica': 0})
            .whereNot({'Armazens.quant_Restante_Hortalica': 0})
            .join('Hortalicas', 'Hortalicas.cod_Hortalica', '=', 'Armazens.cod_Hortalica')
            .select('Armazens.cod_Posicao_Armazem', 
                    'Hortalicas.nome_Hortalica', 
                    'Armazens.quant_Restante_Hortalica', 
                    'Hortalicas.contagem_Hortalica', 
                    'Armazens.valor_Hortalica')
            
            return  res.render('venda.html', {listaHortalica})
        } catch (error) {
            next(error)
        }
        
    },
    async colaborador(req,res, next) {
        try {
            // Preparar a lista de itens no armazém
            const codPlantacao = Number(local('plantacao'))

            const listaColaborador = await knex('Logins')
            .where({'cod_Plantacao': codPlantacao})
            .whereNot({'tipo_Usuario': 'Gerente'})
            .join('Usuarios', 'Usuarios.email_Usuario', '=', 'Logins.email_Usuario')
            .select('Usuarios.nome_Usuario',
                    'Usuarios.email_Usuario',
                    'Usuarios.tipo_Usuario')
            
            return  res.render('colaborador.html', {listaColaborador})
        } catch (error) {
            return next(error)
        }
        
    },
    async estufa(req,res, next) {
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
            next(error)
        }
        
    },
    async relatorio(req,res, next) {
        try {
            return  res.render('relatorio.html')
        } catch (error) {
           next(error)
        }
        
    },
    async atividade(req,res, next) {
        try {
            return  res.render('atividades.html')
        } catch (error) {
            next(error)
        }
    },
    async perfil(req, res, next) {
        try {
            // Resgata o email no local storage do usuário
            const email = local('email');
            // Buscar 
            const dadosPerfil = await knex.from('Usuarios')
            .where({'Usuarios.email_Usuario': email})
            .join('Logins', 'Logins.email_Usuario', '=', 'Usuarios.email_Usuario')
            .select('Usuarios.*', 'Logins.dt_Admisso_Usuario')

            var dt = String(dadosPerfil[0].dt_Admisso_Usuario)
            var mes = dt.slice(4, 7)
            var dia = dt.slice(8,10)
            var ano = dt.slice(11, 15)

            var data = dia + ' de ' + mes + '. ' + ano

            dadosPerfil[0].dt_Admisso_Usuario = data;


            var dt = String(dadosPerfil[0].dt_Nasc_Usuario)
            var mes = dt.slice(4, 7)
            var dia = dt.slice(8,10)
            var ano = dt.slice(11, 15)

            var data = dia + ' de ' + mes + '. ' + ano

            dadosPerfil[0].dt_Nasc_Usuario = data;
            
            const usuario = dadosPerfil[0]

            return res.render('perfil.html', { usuario });

        } catch (error) {
            next(error);
        }
        
    },
}
