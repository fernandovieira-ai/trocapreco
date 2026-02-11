/**
 * arquivo: routes/fasthelproutes.js
 * descriçao: arquivo responsavel pelas rotas da API
 * data: 14/03/2022
 * autor: Renato Filho
*/

const router = require("express-promise-router")();
const drfPriceSwap = require("../controllers/drfPriceSwap");

//=> Definindo as rotas do CRUD - Fasthelp

// => Rota para criar/inserir usuario : (POST) : localhost:3000/api/fasthelp-createUser
//festhelp-user abaixo é a rota que insere no postman para acessar esse metodo (createUser).

router.post("/login", drfPriceSwap.fazerLogin);

router.post("/alterarSenha", drfPriceSwap.alterarSenha);

router.post("/novoUsuario", drfPriceSwap.novoUsuario); 

router.post("/removeUsuario", drfPriceSwap.removeUsuario);

router.post("/buscaUsuario", drfPriceSwap.buscaUsuario); 

router.post("/updateUsuario", drfPriceSwap.updateUsuario); 

router.post("/sincronizaCadastros", drfPriceSwap.sincronizaCadastros);

router.post("/buscaEmpresasBase", drfPriceSwap.buscaEmpresasBase);

router.post("/buscaFiltroPreLoad", drfPriceSwap.buscaFiltroPreLoad);

router.post("/buscaFiltro", drfPriceSwap.buscaFiltro); 

router.post("/buscaItemBomba", drfPriceSwap.buscaItemBomba);

router.post("/buscaFiltroItem", drfPriceSwap.buscaFiltroItem);

router.post("/buscaPrecosCliente", drfPriceSwap.buscaPrecosCliente);

router.post("/novaNegociacao", drfPriceSwap.novaNegociacao);

router.post("/buscaMinhasNegociacoes", drfPriceSwap.buscaMinhasNegociacoes); 

router.post("/buscaNegociacoesEmpresa", drfPriceSwap.buscaNegociacoesEmpresa);

router.post("/buscaMinhasNegociacoesDetalhe", drfPriceSwap.buscaMinhasNegociacoesDetalhe);

router.post("/buscaAtualizacaoNegociacao", drfPriceSwap.buscaAtualizacaoNegociacao);

router.post("/atualizaNegociacao", drfPriceSwap.atualizaNegociacao);

router.post("/excluirNegociacao", drfPriceSwap.excluirNegociacao);

router.post("/enviaTrocaPreco", drfPriceSwap.enviaTrocaPreco); 

router.post("/aprovaRegra", drfPriceSwap.aprovaRegra);

router.post("/buscaPrecoIntervalo", drfPriceSwap.buscaPrecoIntervalo);

module.exports = router;