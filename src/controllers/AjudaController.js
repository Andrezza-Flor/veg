const knex = require('../database')
const e = require('express')
const local = require('local-storage');
const { render } = require('nunjucks');
const { where, update, select } = require('../database');
const { criarInsumo, insumo } = require('./ComprasController');

var manual = []
var titulo = ''

 function apresentarBalanco() {
    titulo = 'Manual do Balanço'
    manual = []

    const linha1 = '1. O Balanço é composto por três partes fundamentais:';
    const linha2 = '    1.1. Os Ativos, que são seus saldos positivos;';
    const linha3 = '    1.2. Os Passivos, que são seus saldos negativos';
    const linha4 = '    1.3. O Patrimônio Líquido, o resultado dos ativos - os passivos;';
    const linha5 = '2. Tanto os passivos quanto os ativos estão divididos entre Circulantes e Permanetes.';
    const linha6 = '3. Para acessar quanlquer uma dessas divisões basta selecionar o seu nome.';
    const linha7 = '4. Caso haja a necessidade de movimentação os botões no interir das divisões vai orientar o usuário.';
    const linha8 = '5. Na seção de Balanço Patrimonial não será possível alterar o saldo do patrimonio líquido, essa atividade deverá ser realizada nos outros botões do menu.';
    manual.push(linha1)
    manual.push(linha2)
    manual.push(linha3)
    manual.push(linha4)
    manual.push(linha5)
    manual.push(linha6)
    manual.push(linha7)
    manual.push(linha8)
}
 function apresentarFluxo() {
    titulo = 'Manual do Fluxo de Caixa'
    manual = []

    const linha1 = '1. O Fluxo de Caixa é a seção reservada para a movimentação do caixa.';
    const linha2 = '2. A principio ela mostra duas tabelas as entradas e as saídas do caixa.';
    const linha3 = '3. Logo abaixo são apresentados três valores o capital inicial, o saldo operacional e o saldo a transportar para o próximo mês.';
    const linha4 = '4. Esses valores podem se alterar por meio das atividades realizadas no sistema.';
    const linha5 = '5. Caso o usuário queira cadastrar alguma entrada ou saída, que o sistema não englobe como multa de trâncito ou aluguel é possivel realiza-la selecionando o "+" ao lado da palavra entrada ou saída.';
    const linha6 = '6. Após isso rolar a página até final e seleciona o botão Cadastrar Entrada ou Cadastrar Saída.';
    const linha7 = '7. Preencher as informaçẽos e selecionar o botão Salvar Cadastro.';
    const linha8 = '8. Além disso é possível observar as Entradas ou Saídas, passadas ou futuras, por meio do "+" dito anteriormente.';
    
    manual.push(linha1)
    manual.push(linha2)
    manual.push(linha3)
    manual.push(linha4)
    manual.push(linha5)
    manual.push(linha6)
    manual.push(linha7)
    manual.push(linha8)
}
 function apresentarFinanciamento() {
    manual = []
    titulo = 'Manual do Financiamento'
    const linha1 = '1. O Financiamento é a seção exclusiva para cadastrar financiamentos.';
    const linha2 = '2. Por meio dessa seção também é possivel visualizar as parcelas futuras e assim se planejar.';
    const linha3 = '3. Na parte inicial são apresentados os financiamento que ainda estão em aberto.';
    const linha4 = '4. Para cadastrar um financiamneto é necessário selecionar no botão Cadastrar Financiamento.';
    const linha5 = '5. Preencher as informações do financiamento.';
    const linha6 = '6. Selecionar o botão Salvar';
    const linha7 = '7. Nessa Parte o sistemaapresentará uma tabela com as informações dos dados cadastrados';
    const linha8 = '8. Caso o usuário estivesse com o intuito de visualizar os dados de um futuro financiamento, é possivel desistir do processo selecionando outro botão do menu.';
    const linha9 = '9. Caso queira continuar, o usuário deve selecionar o dia de pagamento e a regra de pagamento';
    const linha10 = '10. Selecionar o Botão Salvar';
    const linha11 = '11. Nesse momento o sistema vai apresentar os dados do pagamento das parcelas se o usuário estiver de acordo seleciona o botão Salvar Financiamento';
    
    manual.push(linha1)
    manual.push(linha2)
    manual.push(linha3)
    manual.push(linha4)
    manual.push(linha5)
    manual.push(linha6)
    manual.push(linha7)
    manual.push(linha8)
    manual.push(linha9)
    manual.push(linha10)
    manual.push(linha11)
}
 function apresentarCompra() {
    manual = []
    titulo = 'Manual da Compra'
    const linha1 = '1. Ao selecionar o botão Compra o sistema apresentará os dados das compras em aberto.';
    const linha2 = '2. Caso o usuário queira visualizar os dados da compra é só selecionar o botão Acessar.';
    const linha3 = '3. O usuário pode também realizar uma nova compra selecionando o botão Comprar.';
    const linha4 = '4. Vale lembrar que os itens que ficarão disponibilizado para compra, são apenas os cadastrados para um forneceodor';
    const linha5 = '5. O usuário seguirá os passos que que o sistema indicar até finalizar a compra.';
    const linha6 = '6. Após as compras chegarem o usuário deve realizar a entrada no celeiro, para isso ela deve acessar a compra e selecionar o botão Chegou.';
    
    manual.push(linha1)
    manual.push(linha2)
    manual.push(linha3)
    manual.push(linha4)
    manual.push(linha5)
    manual.push(linha6)
}
 function apresentarFornecedor() {
    manual = []
    titulo = 'Manual do Fornecedor'
    const linha1 = '1. Para visualizar ou cadastrar um fornecedor é necessário acessar a Compra e depois selecionar o botão Fornecedor no final da página.';
    const linha2 = '2. Dessa forma o sistema apresentará os fornecedores já cadastrardos para o usuário escolher qualquer visualizar.';
    const linha3 = '3. Caso queira visualizar o cadastrado do fornecedor o usuário escolhe o nome do fornecedor e depois seleciona o botão Selecionar';
    const linha4 = '4. Dessa forma o sistema apresentará os dados do fornecedor e os insumos que este fornece.';
    const linha5 = '5. Porém se o usuário quer criar um fornecedor, você deve selecionar o botão Criar Fornecedor.';
    const linha6 = '6. O sistema começará uma operação de cadastrado, o usuário deve preencher os dados.';
    const linha7 = '7. Após o termino do cadstro o fornecedor já ficará disponível para realizar compras.';
    
    manual.push(linha1)
    manual.push(linha2)
    manual.push(linha3)
    manual.push(linha4)
    manual.push(linha5)
    manual.push(linha6)
    manual.push(linha7)
}
 function apresentarVenda() {
    manual = []
    titulo = 'Manual da Venda'
    const linha1 = '1. Ao selecionar o botão Venda o sistema apresentará os dados das vendas em aberto.';
    const linha2 = '2. Caso o usuário queira visualizar os dados da venda é só selecionar o botão Acessar.';
    const linha3 = '3. O usuário pode também realizar uma nova venda selecionando o botão Vender.';
    const linha4 = '4. Vale lembrar que os itens que ficarão disponibilizado para venda, são aqueles que há um plano de produção ou armazenados com o estado LIVRE';
    const linha5 = '5. O usuário seguirá os passos que o sistema indicar até finalizar a venda.';
    const linha6 = '6. Após o termino do cadastro da venda o usuário tem que produzir a hortaliça, quando está estiver produzida o sistema permitirá que o usuário finalize a venda';
    const linha7 = '7. Para finalizar basta acessar a venda e selecionar o botão Finalizar';
    
    manual.push(linha1)
    manual.push(linha2)
    manual.push(linha3)
    manual.push(linha4)
    manual.push(linha5)
    manual.push(linha6)
    manual.push(linha7)
}
 function apresentarCliente() {
    manual = []
    titulo = 'Manual do Cliente'
    const linha1 = '1. Para visualizar ou cadastrar um cliente é necessário acessar a Venda e depois selecionar o botão Cliente no final da página.';
    const linha2 = '2. Dessa forma o sistema apresentará os clientes já cadastrardos para o usuário escolher qualquer visualizar.';
    const linha3 = '3. Caso queira visualizar o cadastrado do cliente o usuário escolhe o nome do cliente e depois seleciona o botão Selecionar';
    const linha4 = '4. Dessa forma o sistema apresentará os dados do cliente.';
    const linha5 = '5. Porém se o usuário quer criar um cliente, você deve selecionar o botão Criar Cliente.';
    const linha6 = '6. O sistema começará uma operação de cadastrado, o usuário deve preencher os dados.';
    const linha7 = '7. Após o termino do cadstro o cliente já ficará disponível para realizar vendas.';
    
    manual.push(linha1)
    manual.push(linha2)
    manual.push(linha3)
    manual.push(linha4)
    manual.push(linha5)
    manual.push(linha6)
    manual.push(linha7)
}
 function apresentarProducao() {
    manual = []
    titulo = 'Manual da Produção'
    const linha1 = '1. Ao selecionar o botão Plantação o sistema apresentará os dados das produções em aberto.';
    const linha2 = '2. Caso o usuário queira visualizar os dados da produção é só selecionar o botão Acessar.';
    const linha3 = '3. Dentro do cadastro da produção será apresentado uma tabela de aplicações dos itens, essa tabela é dinâmica e mudará todo o dia mostrando o que está faltando, o que já foi realizado, o que está atrasado e caso esteja no dia de aplicar algum insumo ela disponibizará um link, e assim fará a baixa no celeiro.';
    const linha4 = '4. O usuário pode também realizar uma nova produção selecionando o botão Produzir.';
    const linha5 = '5. Vale lembrar que para produzir o usuário pode optar por realizar um item de uma venda, ou deixar livre para vendas futuras';
    const linha6 = '6. O usuário seguirá os passos que o sistema indicar até finalizar o cadastro da produçãp.';
    const linha7 = '7. Após o termino do cadastro da produção os seus dados ficarão disponíveis ate essa produção ser encerrada';
    const linha8 = '8. Para finalizar uma produção basta selecionar o botão Acessar qunado a situação estiver AGUARDANDO FINALIZAR.';
    
    manual.push(linha1)
    manual.push(linha2)
    manual.push(linha3)
    manual.push(linha4)
    manual.push(linha5)
    manual.push(linha6)
    manual.push(linha7)
    manual.push(linha8)
}
 function apresentarCeleiro() {
    manual = []
    titulo = 'Manual do Celeiro'
    const linha1 = '1. O celeiro é o lugar onde haverá todos os insumos que foram comprados.';
    const linha2 = '2. Para visualizar os dados desse insumo é necessário seleiconar o botão Acessar.';
    const linha3 = '3. Dessa forma o sistema apresentará os dados do insumo e caso o usuário queira descarta-lo ou vende-lo á só selecionar o Descartar ou Vender e preencher as informações';
    
    manual.push(linha1)
    manual.push(linha2)
    manual.push(linha3)
}
 function apresentarArmazem() {
    manual = []
    titulo = 'Manual do Armazém'
    const linha1 = '1. O armazém é o lugar onde haverá todas as hortaliças que foram produzidas.';
    const linha2 = '2. Para visualizar os dados dessas hortaliças é necessário seleiconar o botão Acessar.';
    const linha3 = '3. Dessa forma o sistema apresentará os dados da hortaliça e caso o usuário queira descarta-la é só selecionar o Descartar e preencher as informações';
    
    manual.push(linha1)
    manual.push(linha2)
    manual.push(linha3)
}
 function apresentarColaborador() {
    manual = []
    titulo = 'Manual do Colaborador'
    const linha1 = '1. A seção de colaborador é reservada para realizar o cadastro dos colaboradores da plantação, além de liberar acesso para eles o seu cadastro permite que seja alimentada a tabela de passivo por meio da foha de pagamento.';
    const linha2 = '2. Para visualizar um colaborador bastaescolger qual deles e depois selecionar o botão Selecionar';
    const linha3 = '3. Caso o usuário queora cadastrar um colaborador basta selecionar o botão Cadastrar e seguir os passos de cadastro.';
    
    manual.push(linha1)
    manual.push(linha2)
    manual.push(linha3)
}
 function apresentarRelatorio() {
    manual = []
    titulo = 'Manual do Relatório'
    const linha1 = '1. A sesão de relatórios e a parteque o usuário tem de visualizar sua plantação em dados no formato de tabela.';
    const linha2 = '2. Para visualizar é necessário escolher o tipo de relatório da sua peferência e depois selecionar o botão Selecionar.';
    const linha3 = '3. O sistema realizará a busca e apresentará, caso o usuário queira armazenar em forma de arquivo e necessário selecionar o botão Baixar.';
    const linha4 = '4. O sistema apresentará uma página com os mesmos dados basta o usuário realizar o comando Ctrl+p.';
    const linha5 = '5. Esolher a opção de salvamento e salva-lá';

    manual.push(linha1)
    manual.push(linha2)
    manual.push(linha3)
    manual.push(linha4)
    manual.push(linha5)
}



module.exports = {
    // Apresentar Fornecedor
    async apresentarAjuda(req,res, next) {
        try {

            const {
                codManual
            } = req.body
            

            switch (codManual) {
                case '1':
                    apresentarBalanco()
                    break;
                case '2':
                    apresentarFluxo()
                    break;
                case '3':
                    apresentarFinanciamento()
                    break;
                case '4':
                    apresentarCompra()
                    break;
                case '5':
                    apresentarFornecedor()
                    break;
                case '6':
                    apresentarVenda()
                    break;
                case '7':
                    apresentarCliente()
                    break;
                case '8':
                    apresentarProducao()
                    break;
                case '9':
                    apresentarPlanoProducao()
                    break;
                case '10':
                    apresentarCeleiro()
                    break;
                case '11':
                    apresentarArmazem()
                    break;
                case '12':
                    apresentarColaborador()
                    break;
                case '13':
                    apresentarRelatorio()
                    break;
                default:
                  console.log('Código inabilitados');
              }

            return  res.render("Ajuda/apresentarAjuda.html", {titulo, manual})
        } catch (error) {
            return next(error)
        }
        
    }    
   
}